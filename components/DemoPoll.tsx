"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const DEMO_OPTIONS = [
    { id: "1", text: "Next.js", votes: 45, color: "bg-blue-500" },
    { id: "2", text: "React", votes: 30, color: "bg-cyan-500" },
    { id: "3", text: "Vue", votes: 15, color: "bg-green-500" },
    { id: "4", text: "Svelte", votes: 10, color: "bg-orange-500" },
];

export function DemoPoll() {
    const [options, setOptions] = useState(DEMO_OPTIONS);
    const [totalVotes, setTotalVotes] = useState(100);

    // Simulate real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            setOptions((prev) => {
                const newOptions = [...prev];
                const randomIndex = Math.floor(Math.random() * newOptions.length);
                newOptions[randomIndex].votes += 1;
                return newOptions;
            });
            setTotalVotes((prev) => prev + 1);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="w-full max-w-md mx-auto shadow-2xl border-muted/40 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>What's your favorite framework?</CardTitle>
                <CardDescription>Live Demo Poll • {totalVotes} votes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {options.map((option) => {
                    const percentage = Math.round((option.votes / totalVotes) * 100);
                    return (
                        <div key={option.id} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">{option.text}</span>
                                <span className="text-muted-foreground">{percentage}%</span>
                            </div>
                            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                    className={`h-full ${option.color}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ type: "spring", stiffness: 50, damping: 15 }}
                                />
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
