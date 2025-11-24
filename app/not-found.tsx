import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center space-y-6">
            <div className="p-6 bg-muted/30 rounded-full">
                <FileQuestion className="w-16 h-16 text-muted-foreground" />
            </div>
            <div className="space-y-2">
                <h2 className="text-4xl font-bold tracking-tight">Page Not Found</h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    The page you are looking for doesn't exist or has been moved.
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg">
                    <Link href="/">Return Home</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                    <Link href="/create">Create a Poll</Link>
                </Button>
            </div>
        </div>
    )
}
