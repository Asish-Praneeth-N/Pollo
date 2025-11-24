import { Zap, Share2, LayoutDashboard, FileSpreadsheet } from "lucide-react";

const features = [
    {
        name: "Realtime",
        description: "Votes update instantly across all devices.",
        icon: Zap,
    },
    {
        name: "Shareable",
        description: "Share via link or QR code in seconds.",
        icon: Share2,
    },
    {
        name: "Creator Dashboard",
        description: "Manage your polls and view insights.",
        icon: LayoutDashboard,
    },
    {
        name: "Export CSV",
        description: "Download your data for analysis.",
        icon: FileSpreadsheet,
    },
];

export function Features() {
    return (
        <section className="py-24 bg-background relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-black/[0.02] -z-10" />
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature) => (
                        <div
                            key={feature.name}
                            className="group flex flex-col items-center text-center space-y-4 p-4 sm:p-6 rounded-2xl bg-card border hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                        >
                            <div className="p-4 bg-primary/5 rounded-2xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-lg">{feature.name}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
