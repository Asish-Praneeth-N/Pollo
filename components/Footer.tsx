import Link from "next/link";
import { Github } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t border-primary/10 bg-background/50 backdrop-blur-sm">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between py-8 px-4 md:px-6 gap-4 text-center md:text-left">
                <p className="text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} Pollo. Real-time voting made simple.
                </p>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <Link href="#" className="hover:text-foreground transition-colors">
                        Terms
                    </Link>
                    <Link href="#" className="hover:text-foreground transition-colors">
                        Privacy
                    </Link>
                    <Link
                        href="https://github.com"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-foreground transition-colors flex items-center gap-2"
                    >
                        <Github className="w-4 h-4" />
                        Source
                    </Link>
                </div>
            </div>
        </footer>
    );
}
