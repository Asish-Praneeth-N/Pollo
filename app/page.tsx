import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { JoinPoll } from "@/components/JoinPoll";
import { DemoPoll } from "@/components/DemoPoll";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <div className="container mx-auto px-4 md:px-6 pb-24 -mt-8 sm:-mt-12 relative z-20">
          <DemoPoll />
        </div>
        <JoinPoll />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
