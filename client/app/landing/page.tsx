import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackgroundBeams } from "@/components/ui/background-beams";

export default function LandingPage() {
  return (
    <div className="flex items-center justify-center w-full flex-col px-4 py-20 text-center min-h-screen">
      <h2 className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-900 to-neutral-700 dark:from-neutral-200 dark:to-white text-3xl md:text-5xl lg:text-7xl font-sans py-2 md:py-8 relative z-20 font-bold tracking-tight">
        Welcome to Connexa
      </h2>
      <p className="max-w-2xl mx-auto text-base md:text-xl text-neutral-700 dark:text-neutral-400">
        A modern messaging platform built for real-time connection. Chat one-on-one or in groups, share media, and enjoy seamless video calls — all in one place.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center z-20">
        <Link href="/login">
          <Button size="lg" className="px-8">Login</Button>
        </Link>
        <Link href="/signup">
          <Button size="lg" variant="outline" className="px-8">Signup</Button>
        </Link>
      </div>
      <BackgroundBeams />
    </div>
  );
}