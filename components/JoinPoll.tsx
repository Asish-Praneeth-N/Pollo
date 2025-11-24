"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinPoll() {
    const [pollId, setPollId] = useState("");
    const router = useRouter();

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (pollId.trim()) {
            router.push(`/poll/${pollId}`);
        }
    };

    return (
        <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl">
                            Have a code? Join now.
                        </h2>
                        <p className="text-muted-foreground">
                            Enter the poll ID or link to start voting immediately.
                        </p>
                    </div>
                    <form onSubmit={handleJoin} className="flex flex-col sm:flex-row w-full max-w-sm items-center gap-2 space-x-0 sm:space-x-2">
                        <Input
                            type="text"
                            placeholder="Enter Poll ID"
                            value={pollId}
                            onChange={(e) => setPollId(e.target.value)}
                            className="bg-background"
                        />
                        <Button type="submit" className="w-full sm:w-auto">Join</Button>
                    </form>
                </div>
            </div>
        </section>
    );
}
