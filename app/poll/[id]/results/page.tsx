"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, orderBy, getDocs, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Download, ArrowLeft, Users, BarChart3, Clock } from "lucide-react";
import { ShareModal } from "@/components/ShareModal";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Poll {
    id: string;
    title: string;
    description?: string;
    creatorId: string;
    createdAt: any;
    totalVotes: number;
    isOpen: boolean;
    settings: {
        showVoterList: boolean;
    };
}

interface Option {
    id: string;
    text: string;
    count: number;
}

interface Vote {
    id: string;
    voterId: string;
    displayName?: string;
    avatarUrl?: string;
    optionId: string;
    createdAt: any;
}

const COLORS = ['#FFD700', '#FFA500', '#DAA520', '#B8860B', '#8B4513', '#CD853F', '#F4A460', '#DEB887'];

export default function ResultsPage() {
    const params = useParams();
    const pollId = params.id as string;
    const { user, isLoaded, isSignedIn } = useUser();
    const router = useRouter();

    const [poll, setPoll] = useState<Poll | null>(null);
    const [options, setOptions] = useState<Option[]>([]);
    const [votes, setVotes] = useState<Vote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreator, setIsCreator] = useState(false);

    useEffect(() => {
        if (!pollId) return;

        const pollRef = doc(db, "polls", pollId);
        const optionsRef = collection(db, "polls", pollId, "options");

        const unsubPoll = onSnapshot(pollRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data() as Omit<Poll, 'id'>;
                setPoll({ ...data, id: doc.id });
                if (user && data.creatorId === user.id) {
                    setIsCreator(true);
                }
            } else {
                setIsLoading(false);
            }
        });

        const unsubOptions = onSnapshot(optionsRef, (snapshot) => {
            const opts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Option));
            setOptions(opts);
            setIsLoading(false);
        });

        return () => {
            unsubPoll();
            unsubOptions();
        };
    }, [pollId, user]);

    // Fetch votes for creator or if public list enabled
    useEffect(() => {
        const fetchVotes = async () => {
            if (!pollId || (!isCreator && !poll?.settings.showVoterList)) return;

            const votesRef = collection(db, "polls", pollId, "votes");
            const q = query(votesRef, orderBy("createdAt", "desc"));

            // Real-time listener for votes might be heavy, using getDocs for table to avoid excessive reads on large polls
            // But for "Live" feel, let's use snapshot but limit if needed. For now, snapshot.
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const votesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Vote));
                setVotes(votesData);
            });

            return () => unsubscribe();
        };

        if (poll) fetchVotes();
    }, [pollId, isCreator, poll]);

    const handleExportCSV = () => {
        if (!options.length || !votes.length) return;

        const csvContent = [
            ["Voter", "Option", "Timestamp"],
            ...votes.map(v => {
                const option = options.find(o => o.id === v.optionId)?.text || "Unknown";
                const date = v.createdAt ? new Date(v.createdAt.seconds * 1000).toISOString() : "";
                return [`"${v.displayName || 'Anonymous'}"`, `"${option}"`, date];
            })
        ].map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `poll_results_${pollId}.csv`;
        link.click();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!poll) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <h1 className="text-2xl font-bold">Poll Not Found</h1>
                <Button onClick={() => router.push("/")}>Go Home</Button>
            </div>
        );
    }

    const chartData = options.map(opt => ({
        name: opt.text,
        value: opt.count
    }));

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex gap-2">
                        <Button variant="ghost" className="pl-0 hover:pl-2 transition-all" onClick={() => router.push(`/poll/${pollId}`)}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Poll
                        </Button>
                        {isSignedIn && (
                            <Button variant="ghost" className="hover:pl-2 transition-all" onClick={() => router.replace('/dashboard')}>
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                            </Button>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">{poll.title}</h1>
                    <p className="text-muted-foreground">
                        Results & Analytics • {poll.totalVotes} total votes
                    </p>
                </div>
                <div className="flex gap-2">
                    <ShareModal pollId={pollId} pollTitle={poll.title} />
                    {isCreator && (
                        <Button variant="outline" onClick={handleExportCSV}>
                            <Download className="w-4 h-4 mr-2" /> Export CSV
                        </Button>
                    )}
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Donut Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-primary" /> Vote Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--foreground)' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" /> Vote Counts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <RechartsTooltip
                                    cursor={{ fill: 'var(--muted)' }}
                                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--foreground)' }}
                                />
                                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Voters Table (Creator Only or Public if allowed) */}
            {(isCreator || poll.settings.showVoterList) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" /> Recent Voters
                        </CardTitle>
                        <CardDescription>
                            {isCreator ? "Full list of voters and their choices." : "Public list of recent voters."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <div className="grid grid-cols-3 p-4 font-medium border-b bg-muted/50">
                                <div>Voter</div>
                                <div>Option</div>
                                <div className="text-right">Time</div>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto">
                                {votes.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">No votes yet.</div>
                                ) : (
                                    votes.map((vote) => {
                                        const option = options.find(o => o.id === vote.optionId);
                                        return (
                                            <div key={vote.id} className="grid grid-cols-3 p-4 border-b last:border-0 items-center hover:bg-muted/20 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarImage src={vote.avatarUrl} />
                                                        <AvatarFallback>{vote.displayName?.[0] || "?"}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="truncate font-medium">{vote.displayName || "Anonymous"}</span>
                                                </div>
                                                <div className="truncate text-muted-foreground">
                                                    {option?.text || "Unknown"}
                                                </div>
                                                <div className="text-right text-sm text-muted-foreground flex items-center justify-end gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {vote.createdAt ? formatDistanceToNow(new Date(vote.createdAt.seconds * 1000), { addSuffix: true }) : "Just now"}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
