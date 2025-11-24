"use client";

import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { BarChart3, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
    const { isSignedIn, user } = useUser();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl group">
                    <div className="p-2 bg-primary/20 rounded-xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Pollo</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-4">
                    {isSignedIn ? (
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" asChild className="hover:bg-primary/5">
                                <Link href="/dashboard">Dashboard</Link>
                            </Button>
                            <UserButton afterSignOutUrl="/" appearance={{
                                elements: {
                                    avatarBox: "w-9 h-9 border-2 border-background ring-2 ring-primary/10"
                                }
                            }} />
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" asChild className="hover:bg-primary/5">
                                <Link href="/sign-in">Sign In</Link>
                            </Button>
                            <Button asChild size="sm" className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300">
                                <Link href="/sign-up">Get Started</Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <div className="md:hidden flex items-center gap-4">
                    {isSignedIn && (
                        <UserButton afterSignOutUrl="/" appearance={{
                            elements: {
                                avatarBox: "w-8 h-8 border-2 border-background ring-2 ring-primary/10"
                            }
                        }} />
                    )}
                    <button
                        className="p-2 text-foreground/70 hover:text-foreground transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Menu className="w-6 h-6" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t bg-background/95 backdrop-blur-md p-4 space-y-4 animate-in slide-in-from-top-5">
                    {isSignedIn ? (
                        <div className="flex flex-col gap-2">
                            <Button variant="ghost" asChild className="w-full justify-start hover:bg-primary/5">
                                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                                    Dashboard
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <Button variant="ghost" asChild className="w-full justify-start hover:bg-primary/5">
                                <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                                    Sign In
                                </Link>
                            </Button>
                            <Button asChild className="w-full shadow-lg shadow-primary/20">
                                <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                                    Get Started
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}
