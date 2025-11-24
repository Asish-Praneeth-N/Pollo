"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, Loader2, Eye, Share2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CreatePoll() {
    const { isLoaded, isSignedIn, user } = useUser();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [options, setOptions] = useState(["", ""]);
    const [settings, setSettings] = useState({
        allowMultiple: false,
        requireLogin: false,
        showVoterList: true,
        allowChangeVote: false,
    });

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push("/sign-in");
        }
    }, [isLoaded, isSignedIn, router]);

    const handleAddOption = () => {
        setOptions([...options, ""]);
    };

    const handleRemoveOption = (index: number) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleCreatePoll = async () => {
        if (!title.trim() || options.some(opt => !opt.trim())) return;

        setIsLoading(true);
        try {
            const pollData = {
                title,
                description,
                creatorId: user?.id,
                creatorName: user?.fullName || user?.username || "Anonymous",
                creatorAvatar: user?.imageUrl,
                createdAt: serverTimestamp(),
                isOpen: true,
                totalVotes: 0,
                settings,
            };

            const pollRef = await addDoc(collection(db, "polls"), pollData);

            // Create options subcollection
            const batch = writeBatch(db);
            options.forEach((optText) => {
                const optRef = doc(collection(db, `polls/${pollRef.id}/options`));
                batch.set(optRef, {
                    text: optText,
                    count: 0,
                });
            });
            await batch.commit();

            router.push(`/poll/${pollRef.id}`);
        } catch (error) {
            console.error("Error creating poll:", error);
            // Handle error (toast)
        } finally {
            setIsLoading(false);
        }
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
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column: Form */}
                <div className={`flex-1 space-y-8 ${isPreviewMode ? 'hidden lg:block' : ''}`}>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Create a Poll</h1>
                        <p className="text-muted-foreground">Design your poll and configure settings.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Poll Title <span className="text-red-500">*</span></Label>
                            <Input
                                id="title"
                                placeholder="e.g., What's your favorite framework?"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-lg"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="Add some context..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="space-y-4">
                            <Label>Options <span className="text-red-500">*</span></Label>
                            <AnimatePresence>
                                {options.map((option, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center gap-2"
                                    >
                                        <Input
                                            placeholder={`Option ${index + 1}`}
                                            value={option}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                        />
                                        {options.length > 2 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveOption(index)}
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <Button
                                variant="outline"
                                onClick={handleAddOption}
                                className="w-full border-dashed"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Add Option
                            </Button>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="font-semibold">Settings</h3>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Allow Multiple Choices</Label>
                                    <p className="text-sm text-muted-foreground">Voters can select more than one option.</p>
                                </div>
                                <Switch
                                    checked={settings.allowMultiple}
                                    onCheckedChange={(c) => setSettings({ ...settings, allowMultiple: c })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Require Login</Label>
                                    <p className="text-sm text-muted-foreground">Voters must sign in to vote.</p>
                                </div>
                                <Switch
                                    checked={settings.requireLogin}
                                    onCheckedChange={(c) => setSettings({ ...settings, requireLogin: c })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Show Voter List</Label>
                                    <p className="text-sm text-muted-foreground">Display recent voters publicly.</p>
                                </div>
                                <Switch
                                    checked={settings.showVoterList}
                                    onCheckedChange={(c) => setSettings({ ...settings, showVoterList: c })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6">
                            <Button
                                variant="outline"
                                className="flex-1 lg:hidden"
                                onClick={() => setIsPreviewMode(true)}
                            >
                                <Eye className="w-4 h-4 mr-2" /> Preview
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleCreatePoll}
                                disabled={isLoading || !title.trim() || options.some(o => !o.trim())}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                                    </>
                                ) : (
                                    <>
                                        Create & Open <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Live Preview */}
                <div className={`flex-1 lg:block ${isPreviewMode ? 'block' : 'hidden'}`}>
                    <div className="sticky top-24 space-y-6">
                        <div className="flex items-center justify-between lg:justify-end mb-4">
                            <h2 className="text-lg font-semibold lg:hidden">Preview</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="lg:hidden"
                                onClick={() => setIsPreviewMode(false)}
                            >
                                Close Preview
                            </Button>
                        </div>

                        <Card className="border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {user?.firstName?.[0] || "A"}
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-medium">{user?.fullName || "Anonymous"}</p>
                                        <p className="text-xs text-muted-foreground">Just now</p>
                                    </div>
                                </div>
                                <CardTitle className="text-2xl">{title || "Poll Title"}</CardTitle>
                                {description && <CardDescription>{description}</CardDescription>}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {options.map((opt, i) => (
                                    <div key={i} className="p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-between group">
                                        <span className={opt ? "" : "text-muted-foreground italic"}>
                                            {opt || `Option ${i + 1}`}
                                        </span>
                                        {settings.allowMultiple ? (
                                            <div className="w-5 h-5 rounded border border-primary/50 group-hover:border-primary" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full border border-primary/50 group-hover:border-primary" />
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Share2 className="w-4 h-4" /> Share Preview
                            </h3>
                            <div className="p-3 bg-background rounded-lg border text-sm text-muted-foreground break-all">
                                https://pollo.app/poll/preview-id
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
