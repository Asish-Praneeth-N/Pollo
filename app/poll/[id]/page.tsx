"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, runTransaction, serverTimestamp, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Share2, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Poll {
    id: string;
    title: string;
    description?: string;
    creatorId: string;
    creatorName: string;
    creatorAvatar?: string;
    isOpen: boolean;
    totalVotes: number;
    settings: {
        allowMultiple: boolean;
        requireLogin: boolean;
        showVoterList: boolean;
        allowChangeVote: boolean;
    };
}

interface Option {
    id: string;
    text: string;
    count: number;
}

interface Voter {
    id: string;
    displayName?: string;
    avatarUrl?: string;
    createdAt: any;
    isAnonymous: boolean;
}

export default function PollPage() {
    const params = useParams();
    const pollId = params.id as string;
    const { isLoaded, isSignedIn, user } = useUser();
    const { openSignIn } = useClerk();
    const router = useRouter();

    const [poll, setPoll] = useState<Poll | null>(null);
    const [options, setOptions] = useState<Option[]>([]);
    const [recentVoters, setRecentVoters] = useState<Voter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [hasVoted, setHasVoted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Initialize Anonymous ID
    useEffect(() => {
        if (typeof window !== "undefined" && !localStorage.getItem("anonId")) {
            localStorage.setItem("anonId", `anon_${Math.random().toString(36).substr(2, 9)}`);
        }
    }, []);

    // Fetch Poll Data & Real-time Updates
    useEffect(() => {
        if (!pollId) return;

        const pollRef = doc(db, "polls", pollId);
        const optionsRef = collection(db, "polls", pollId, "options");
        const votesRef = collection(db, "polls", pollId, "votes");

        const unsubPoll = onSnapshot(pollRef, (doc) => {
            if (doc.exists()) {
                setPoll({ id: doc.id, ...doc.data() } as Poll);
            } else {
                setError("Poll not found");
                setIsLoading(false);
            }
        });

        const unsubOptions = onSnapshot(optionsRef, (snapshot) => {
            const opts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Option));
            // Sort options by text or custom order if available. For now, ID or creation order.
            // Ideally, we should have an 'order' field.
            setOptions(opts);
            setIsLoading(false);
        });

        // Listen for recent votes if enabled
        // Note: Real-time listener for votes might be expensive for large polls.
        // We'll limit to last 10.
        const qVotes = query(votesRef, orderBy("createdAt", "desc"), limit(10));
        const unsubVotes = onSnapshot(qVotes, (snapshot) => {
            const voters = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Voter));
            setRecentVoters(voters);
        });

        return () => {
            unsubPoll();
            unsubOptions();
            unsubVotes();
        };
    }, [pollId]);

    // Check if user has already voted
    useEffect(() => {
        const checkVote = async () => {
            if (!pollId) return;
            const voterId = user?.id || localStorage.getItem("anonId");
            if (!voterId) return;

            const votesRef = collection(db, "polls", pollId, "votes");
            const q = query(votesRef, where("voterId", "==", voterId));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                setHasVoted(true);
                // Pre-fill selected options if needed (requires reading vote docs)
                const votedOptionIds = snapshot.docs.map(d => d.data().optionId);
                setSelectedOptions(votedOptionIds);
            }
        };

        checkVote();
    }, [pollId, user]);

    const handleVote = async () => {
        if (selectedOptions.length === 0) return;
        if (poll?.settings.requireLogin && !isSignedIn) {
            openSignIn();
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const voterId = user?.id || localStorage.getItem("anonId");
            const displayName = user?.fullName || user?.username || "Anonymous";
            const avatarUrl = user?.imageUrl;
            const isAnonymous = !user;

            await runTransaction(db, async (transaction) => {
                // Check if poll is still open
                const pollDoc = await transaction.get(doc(db, "polls", pollId));
                if (!pollDoc.exists() || !pollDoc.data().isOpen) {
                    throw "Poll is closed";
                }

                // Check for existing vote if multiple votes not allowed (per user/session)
                // Note: Transactional query for existing vote is tricky. 
                // We rely on the client-side check + security rules for strict enforcement.
                // For this demo, we assume the client check is sufficient for UX.

                // Create vote docs and increment counts
                for (const optionId of selectedOptions) {
                    const voteRef = doc(collection(db, "polls", pollId, "votes"));
                    const optionRef = doc(db, "polls", pollId, "options", optionId);

                    transaction.set(voteRef, {
                        pollId,
                        optionId,
                        voterId,
                        displayName,
                        avatarUrl,
                        isAnonymous,
                        createdAt: serverTimestamp(),
                    });

                    transaction.update(optionRef, {
                        count: (await transaction.get(optionRef)).data()?.count + 1 || 1
                    });
                }

                // Update total votes
                transaction.update(doc(db, "polls", pollId), {
                    totalVotes: (pollDoc.data().totalVotes || 0) + selectedOptions.length
                });
            });

            setHasVoted(true);
        } catch (err) {
            console.error("Voting failed:", err);
            setError("Failed to submit vote. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleOption = (optionId: string) => {
        if (hasVoted && !poll?.settings.allowChangeVote) return;

        if (poll?.settings.allowMultiple) {
            setSelectedOptions(prev =>
                prev.includes(optionId)
                    ? prev.filter(id => id !== optionId)
                    : [...prev, optionId]
            );
        } else {
            setSelectedOptions([optionId]);
        }
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        alert("Poll link copied to clipboard!");
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !poll) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <h1 className="text-2xl font-bold">Poll Not Found</h1>
                <p className="text-muted-foreground">{error || "This poll does not exist or has been deleted."}</p>
                <Button onClick={() => router.push("/")}>Go Home</Button>
            </div>
        );
    }

    const maxVotes = Math.max(...options.map(o => o.count), 1);

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Voting Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-primary/10 shadow-lg">
                        <CardHeader>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Avatar className="w-6 h-6">
                                        <AvatarImage src={poll.creatorAvatar} />
                                        <AvatarFallback>{poll.creatorName[0]}</AvatarFallback>
                                    </Avatar>
                                    <span>{poll.creatorName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!poll.isOpen && (
                                        <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-full font-medium">
                                            Closed
                                        </span>
                                    )}
                                    <Button variant="ghost" size="icon" onClick={handleShare}>
                                        <Share2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardTitle className="text-3xl">{poll.title}</CardTitle>
                            {poll.description && <CardDescription className="text-lg">{poll.description}</CardDescription>}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!poll.isOpen ? (
                                <div className="p-6 bg-muted/30 rounded-xl text-center space-y-2">
                                    <Lock className="w-8 h-8 mx-auto text-muted-foreground" />
                                    <h3 className="font-semibold">Voting is closed</h3>
                                    <p className="text-muted-foreground">This poll is no longer accepting votes.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {options.map((option) => {
                                        const isSelected = selectedOptions.includes(option.id);
                                        return (
                                            <div
                                                key={option.id}
                                                onClick={() => toggleOption(option.id)}
                                                className={`
                                                    relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                                                    ${isSelected
                                                        ? "border-primary bg-primary/5"
                                                        : "border-muted hover:border-primary/50 hover:bg-muted/20"
                                                    }
                                                    ${hasVoted && !poll.settings.allowChangeVote ? "opacity-50 cursor-not-allowed" : ""}
                                                `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {poll.settings.allowMultiple ? (
                                                        <Checkbox checked={isSelected} />
                                                    ) : (
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-primary" : "border-muted-foreground"}`}>
                                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                                        </div>
                                                    )}
                                                    <span className="font-medium text-lg">{option.text}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            {poll.isOpen && (
                                <Button
                                    size="lg"
                                    className="w-full text-lg h-12"
                                    onClick={handleVote}
                                    disabled={selectedOptions.length === 0 || isSubmitting || (hasVoted && !poll.settings.allowChangeVote)}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    ) : hasVoted ? (
                                        poll.settings.allowChangeVote ? "Update Vote" : "Voted"
                                    ) : (
                                        "Submit Vote"
                                    )}
                                </Button>
                            )}
                            {hasVoted && (
                                <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    Your vote has been recorded.
                                </p>
                            )}
                            {poll.settings.requireLogin && !isSignedIn && (
                                <p className="text-center text-xs text-muted-foreground">
                                    Sign in required to vote.
                                </p>
                            )}
                        </CardFooter>
                    </Card>
                </div>

                {/* Right Column: Results Panel */}
                <div className="space-y-6">
                    <Card className="border-none shadow-none bg-transparent lg:bg-card lg:border lg:shadow-sm">
                        <CardHeader>
                            <CardTitle>Live Results</CardTitle>
                            <CardDescription>{poll.totalVotes} total votes</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Donut Chart Placeholder - using CSS conic gradient for simple visualization */}
                            <div className="flex justify-center">
                                <div className="relative w-48 h-48 rounded-full border-8 border-muted flex items-center justify-center">
                                    <div className="text-center">
                                        <span className="text-3xl font-bold">{poll.totalVotes}</span>
                                        <p className="text-xs text-muted-foreground">Votes</p>
                                    </div>
                                    {/* Note: A real donut chart would require calculating segments based on options data */}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {options.map((option) => {
                                    const percentage = poll.totalVotes > 0
                                        ? Math.round((option.count / poll.totalVotes) * 100)
                                        : 0;

                                    return (
                                        <div key={option.id} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium truncate max-w-[150px]">{option.text}</span>
                                                <span className="text-muted-foreground">{percentage}% ({option.count})</span>
                                            </div>
                                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-primary"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    transition={{ duration: 0.5 }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {poll.settings.showVoterList && recentVoters.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Recent Voters</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentVoters.map((voter) => (
                                        <div key={voter.id} className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={voter.avatarUrl} />
                                                <AvatarFallback>{voter.displayName?.[0] || "?"}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {voter.displayName || "Anonymous"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {voter.createdAt ? formatDistanceToNow(new Date(voter.createdAt.seconds * 1000), { addSuffix: true }) : "Just now"}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
