"use client";

import { motion } from "motion/react";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";
import Link from "next/link";

import { Button } from "./components/ui/button";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center px-6 relative overflow-hidden">
            {/* Honeycomb background */}
            <div className="absolute inset-0 honeycomb-bg opacity-15 pointer-events-none" />

            {/* Red-tinted spotlight */}
            <div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[600px] h-[600px] rounded-full pointer-events-none"
                style={{
                    background: "radial-gradient(circle, rgba(239,68,68,0.04) 0%, transparent 60%)",
                }}
            />
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse, rgba(255,193,7,0.03) 0%, transparent 60%)",
                }}
            />

            {/* Content */}
            <div className="relative z-10 text-center max-w-xl mx-auto">
                {/* Icon */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease }}
                    className="mb-6 flex justify-center"
                >
                    <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <AlertTriangle size={36} className="text-red-400/80" />
                    </div>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15, ease }}
                    className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight"
                >
                    Oops! Something <span className="text-shimmer">broke</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25, ease }}
                    className="text-white/40 text-base md:text-lg mb-8 leading-relaxed max-w-md mx-auto"
                >
                    An unexpected error occurred. Our team has been notified and we're working on a fix.
                </motion.p>

                {/* Error details in IDE-style terminal */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35, ease }}
                    className="bg-surface-2/40 backdrop-blur-sm border border-red-500/10 rounded-xl p-4 mb-10 max-w-md mx-auto text-left font-mono text-xs overflow-hidden"
                >
                    <div className="flex items-center gap-1.5 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                        <span className="ml-2 text-[10px] text-white/20">error output</span>
                    </div>
                    <div className="text-red-400/60 truncate">
                        {error.message || "An unexpected error occurred"}
                    </div>
                    {error.digest && (
                        <div className="text-white/15 mt-1 text-[10px]">
                            digest: {error.digest}
                        </div>
                    )}
                </motion.div>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.45, ease }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3"
                >
                    <Button
                        variant="brand"
                        size="xl"
                        className="px-8 group shadow-[0_0_24px_rgba(255,193,7,0.15)]"
                        onClick={() => reset()}
                    >
                        <RefreshCw size={16} className="mr-1.5 group-hover:rotate-180 transition-transform duration-500" />
                        Try Again
                    </Button>
                    <Link href="/">
                        <Button variant="brandOutline" size="xl" className="px-8">
                            <Home size={16} className="mr-1.5" />
                            Go Home
                        </Button>
                    </Link>
                </motion.div>
            </div>

            {/* Navbar */}
            <div className="fixed top-0 left-0 right-0 z-50 p-5">
                <Link href="/" className="flex items-center gap-2.5 group w-fit">
                    <div className="relative w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(255,193,7,0.3)] transition-shadow duration-300">
                        <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" className="w-4.5 h-4.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span className="text-lg font-bold text-yellow-400 tracking-tight">CODE BUD</span>
                </Link>
            </div>
        </div>
    );
}
