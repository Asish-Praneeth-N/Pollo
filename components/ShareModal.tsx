"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Share2, Linkedin, Twitter, Facebook } from "lucide-react";

interface ShareModalProps {
    pollId: string;
    pollTitle: string;
    trigger?: React.ReactNode;
}

export function ShareModal({ pollId, pollTitle, trigger }: ShareModalProps) {
    const [copied, setCopied] = useState(false);
    const [embedCopied, setEmbedCopied] = useState(false);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}/poll/${pollId}`;
    const embedCode = `<iframe src="${origin}/embed/${pollId}" width="100%" height="500" frameborder="0"></iframe>`;

    const handleCopy = (text: string, setFn: (val: boolean) => void) => {
        navigator.clipboard.writeText(text);
        setFn(true);
        setTimeout(() => setFn(false), 2000);
    };

    const shareSocial = (platform: string) => {
        const text = encodeURIComponent(`Vote on this poll: ${pollTitle}`);
        const url = encodeURIComponent(shareUrl);
        let link = "";

        switch (platform) {
            case "twitter":
                link = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
                break;
            case "linkedin":
                link = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                break;
            case "facebook":
                link = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                break;
            case "whatsapp":
                link = `https://wa.me/?text=${text}%20${url}`;
                break;
        }

        if (link) window.open(link, "_blank", "width=600,height=400");
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4 mr-2" /> Share
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Poll</DialogTitle>
                    <DialogDescription>
                        Share this poll with your audience to get more votes.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="link" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="link">Link</TabsTrigger>
                        <TabsTrigger value="social">Social</TabsTrigger>
                        <TabsTrigger value="embed">Embed</TabsTrigger>
                    </TabsList>

                    <TabsContent value="link" className="space-y-4 py-4">
                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <Label htmlFor="link" className="sr-only">Link</Label>
                                <Input id="link" defaultValue={shareUrl} readOnly />
                            </div>
                            <Button size="sm" className="px-3" onClick={() => handleCopy(shareUrl, setCopied)}>
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="social" className="py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" className="w-full" onClick={() => shareSocial("twitter")}>
                                <Twitter className="w-4 h-4 mr-2 text-sky-500" /> Twitter
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => shareSocial("linkedin")}>
                                <Linkedin className="w-4 h-4 mr-2 text-blue-600" /> LinkedIn
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => shareSocial("facebook")}>
                                <Facebook className="w-4 h-4 mr-2 text-blue-500" /> Facebook
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => shareSocial("whatsapp")}>
                                <Share2 className="w-4 h-4 mr-2 text-green-500" /> WhatsApp
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="embed" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="embed" className="text-sm font-medium">Embed Code</Label>
                            <div className="relative">
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono text-xs"
                                    readOnly
                                    value={embedCode}
                                />
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="absolute top-2 right-2 h-6 px-2"
                                    onClick={() => handleCopy(embedCode, setEmbedCopied)}
                                >
                                    {embedCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Copy and paste this code into your website or blog.
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
