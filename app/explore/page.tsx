"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Poll {
    id: string;
    title: string;
    description?: string;
    createdAt: any;
    totalVotes: number;
    isOpen: boolean;
    creatorName: string;
}

export default function ExplorePage() {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchPolls = async () => {
            try {
                // In a real app, we'd use a compound query or Algolia for search.
                // For this demo, we'll fetch recent polls and filter client-side.
                const pollsRef = collection(db, "polls");
                const q = query(pollsRef, orderBy("createdAt", "desc"), limit(50));

                const snapshot = await getDocs(q);
                const pollsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Poll[];

                setPolls(pollsData);
            } catch (error) {
                console.error("Error fetching polls:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPolls();
    }, []);

    const filteredPolls = polls.filter(poll =>
        poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        poll.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Explore Polls</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Discover what the world is thinking. Vote on trending topics and see real-time results.
                </p>
            </div>

            <div className="max-w-md mx-auto relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search polls..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-48 rounded-xl bg-muted/20 animate-pulse" />
                    ))}
                </div>
            ) : filteredPolls.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No polls found matching your search.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPolls.map((poll) => (
                        <Card key={poll.id} className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                            <CardHeader>
                                <div className="flex justify-between items-start gap-2">
                                    <Badge variant={poll.isOpen ? "default" : "secondary"} className="mb-2">
                                        {poll.isOpen ? "Active" : "Closed"}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {poll.createdAt ? formatDistanceToNow(new Date(poll.createdAt.seconds * 1000), { addSuffix: true }) : "Just now"}
                                    </span>
                                </div>
                                <CardTitle className="line-clamp-2 leading-tight min-h-[3rem]">
                                    {poll.title}
                                </CardTitle>
                                <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                                    {poll.description || "No description provided."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <BarChart3 className="w-4 h-4" />
                                    <span>{poll.totalVotes} votes</span>
                                    <span className="mx-2">•</span>
                                    <span>by {poll.creatorName}</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground" asChild>
                                    <Link href={`/poll/${poll.id}`}>
                                        Vote Now <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
