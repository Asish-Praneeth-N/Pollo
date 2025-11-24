"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Share2, BarChart3, MoreVertical, Power, Copy } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Poll {
    id: string;
    title: string;
    createdAt: any;
    isOpen: boolean;
    totalVotes: number;
    creatorId: string;
}

export default function Dashboard() {
    const { isLoaded, isSignedIn, user } = useUser();
    const router = useRouter();
    const [polls, setPolls] = useState<Poll[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push("/sign-in");
            return;
        }

        if (user) {
            const q = query(
                collection(db, "polls"),
                where("creatorId", "==", user.id),
                orderBy("createdAt", "desc")
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const pollsData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Poll[];
                setPolls(pollsData);
                setIsLoading(false);
            });

            return () => unsubscribe();
        }
    }, [isLoaded, isSignedIn, user, router]);

    const handleToggleStatus = async (pollId: string, currentStatus: boolean) => {
        try {
            const pollRef = doc(db, "polls", pollId);
            await updateDoc(pollRef, {
                isOpen: !currentStatus,
            });
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    const handleDeletePoll = async (pollId: string) => {
        if (!confirm("Are you sure you want to delete this poll? This action cannot be undone.")) return;

        try {
            await deleteDoc(doc(db, "polls", pollId));
            // Note: Subcollections (options, votes) are not automatically deleted in client SDK.
            // In a production app, use a Cloud Function to delete subcollections recursively.
        } catch (error) {
            console.error("Error deleting poll:", error);
        }
    };

    const handleShare = (pollId: string) => {
        const url = `${window.location.origin}/poll/${pollId}`;
        navigator.clipboard.writeText(url);
        alert("Poll link copied to clipboard!");
    };

    if (!isLoaded || !isSignedIn) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Manage your polls and view results.</p>
                </div>
                <Button asChild>
                    <Link href="/create">
                        <Plus className="w-4 h-4 mr-2" /> Create Poll
                    </Link>
                </Button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 rounded-xl bg-muted/20 animate-pulse" />
                    ))}
                </div>
            ) : polls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 border rounded-xl bg-muted/10">
                    <div className="p-4 bg-muted rounded-full">
                        <BarChart3 className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">No polls yet</h3>
                        <p className="text-muted-foreground max-w-sm">
                            Create your first poll to start gathering feedback from your audience.
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/create">Create Poll</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {polls.map((poll) => (
                        <Card key={poll.id} className="group hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="line-clamp-1" title={poll.title}>
                                            {poll.title}
                                        </CardTitle>
                                        <CardDescription>
                                            {poll.createdAt?.seconds ? formatDistanceToNow(new Date(poll.createdAt.seconds * 1000), { addSuffix: true }) : "Just now"}
                                        </CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="-mr-2">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => router.push(`/poll/${poll.id}`)}>
                                                <BarChart3 className="w-4 h-4 mr-2" /> View Results
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleShare(poll.id)}>
                                                <Share2 className="w-4 h-4 mr-2" /> Share
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleToggleStatus(poll.id, poll.isOpen)}>
                                                <Power className="w-4 h-4 mr-2" /> {poll.isOpen ? "Close Poll" : "Re-open Poll"}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeletePoll(poll.id)}>
                                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm">
                                    <Badge variant={poll.isOpen ? "default" : "secondary"}>
                                        {poll.isOpen ? "Active" : "Closed"}
                                    </Badge>
                                    <span className="text-muted-foreground">
                                        {poll.totalVotes} votes
                                    </span>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0">
                                <div className="flex gap-2 w-full">
                                    <Button variant="outline" className="flex-1" asChild>
                                        <Link href={`/poll/${poll.id}`}>
                                            View
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleShare(poll.id)}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
