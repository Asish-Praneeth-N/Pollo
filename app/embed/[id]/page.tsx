"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, runTransaction, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

interface Poll {
    id: string;
    title: string;
    totalVotes: number;
    isOpen: boolean;
    settings: {
        allowMultiple: boolean;
    };
}

interface Option {
    id: string;
    text: string;
    count: number;
}

export default function EmbedPage() {
    const params = useParams();
    const pollId = params.id as string;

    const [poll, setPoll] = useState<Poll | null>(null);
    const [options, setOptions] = useState<Option[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasVoted, setHasVoted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!pollId) return;

        const pollRef = doc(db, "polls", pollId);
        const optionsRef = collection(db, "polls", pollId, "options");

        const unsubPoll = onSnapshot(pollRef, (doc) => {
            if (doc.exists()) {
                setPoll({ id: doc.id, ...doc.data() } as Poll);
            } else {
                setIsLoading(false);
            }
        });

        const unsubOptions = onSnapshot(optionsRef, (snapshot) => {
            const opts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Option));
            setOptions(opts);
            setIsLoading(false);
        });

        // Check local storage for vote
        if (localStorage.getItem(`voted_${pollId}`)) {
            setHasVoted(true);
        }

        return () => {
            unsubPoll();
            unsubOptions();
        };
    }, [pollId]);

    const handleVote = async (optionId: string) => {
        if (hasVoted) return;
        setIsSubmitting(true);

        try {
            await runTransaction(db, async (transaction) => {
                const pollDoc = await transaction.get(doc(db, "polls", pollId));
                if (!pollDoc.exists() || !pollDoc.data().isOpen) throw "Poll closed";

                const voteRef = doc(collection(db, "polls", pollId, "votes"));
                const optionRef = doc(db, "polls", pollId, "options", optionId);

                transaction.set(voteRef, {
                    pollId,
                    optionId,
                    voterId: "embed_user",
                    isAnonymous: true,
                    createdAt: serverTimestamp(),
                });

                transaction.update(optionRef, {
                    count: (await transaction.get(optionRef)).data()?.count + 1 || 1
                });

                transaction.update(doc(db, "polls", pollId), {
                    totalVotes: (pollDoc.data().totalVotes || 0) + 1
                });
            });

            setHasVoted(true);
            localStorage.setItem(`voted_${pollId}`, "true");
        } catch (error) {
            console.error("Vote failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
    if (!poll) return <div className="p-4 text-center">Poll not found</div>;

    return (
        <div className="font-sans p-4 bg-card text-card-foreground border rounded-xl h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <h2 className="font-bold text-lg leading-tight">{poll.title}</h2>
                <Link href={`/poll/${pollId}`} target="_blank" className="text-muted-foreground hover:text-primary">
                    <ExternalLink className="w-4 h-4" />
                </Link>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
                {options.map((option) => {
                    const percentage = poll.totalVotes > 0 ? Math.round((option.count / poll.totalVotes) * 100) : 0;
                    return (
                        <div key={option.id} className="space-y-1">
                            {hasVoted || !poll.isOpen ? (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium truncate">{option.text}</span>
                                        <span className="text-muted-foreground">{percentage}%</span>
                                    </div>
                                    <Progress value={percentage} className="h-2" />
                                </>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start h-auto py-2 px-3 whitespace-normal text-left"
                                    onClick={() => handleVote(option.id)}
                                    disabled={isSubmitting}
                                >
                                    {option.text}
                                </Button>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs text-muted-foreground">
                <span>{poll.totalVotes} votes</span>
                <Link href="/" target="_blank" className="hover:underline font-medium text-primary">
                    Powered by Pollo
                </Link>
            </div>
        </div>
    );
}
