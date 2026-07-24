"use client";

import { motion } from "motion/react";
import { ArrowLeft, Home, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Floating code particles ── */
const particles = [
    { symbol: "</>", x: "10%", y: "20%", size: 18, delay: 0, duration: 12 },
    { symbol: "{ }", x: "85%", y: "15%", size: 16, delay: 1, duration: 14 },
    { symbol: "=>", x: "75%", y: "65%", size: 14, delay: 2, duration: 10 },
    { symbol: "404", x: "5%", y: "55%", size: 12, delay: 0.5, duration: 13 },
    { symbol: "null", x: "90%", y: "40%", size: 11, delay: 3, duration: 11 },
    { symbol: "???", x: "20%", y: "75%", size: 13, delay: 1.5, duration: 15 },
    { symbol: "//", x: "65%", y: "80%", size: 10, delay: 2.5, duration: 12 },
    { symbol: "!!", x: "40%", y: "10%", size: 14, delay: 0.8, duration: 14 },
];

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">

            {/* Spotlights */}
            <div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[800px] h-[600px] rounded-full pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse, transparent 0%, transparent 60%)",
                    animation: "spotlight-pulse 6s ease-in-out infinite",
                }}
            />
            <div
                className="absolute top-1/4 left-1/3 w-[400px] h-[400px] rounded-full pointer-events-none"
                style={{
                    background: "radial-gradient(circle, transparent 0%, transparent 50%)",
                }}
            />

            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {particles.map((p, i) => (
                    <motion.span
                        key={i}
                        className="absolute font-mono text-primary/[0.06] font-bold select-none"
                        style={{ left: p.x, top: p.y, fontSize: p.size }}
                        animate={{
                            y: [0, -15, 5, -10, 0],
                            x: [0, 5, -5, 3, 0],
                            rotate: [0, 5, -3, 2, 0],
                            opacity: [0.04, 0.08, 0.04, 0.06, 0.04],
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: p.duration,
                            delay: p.delay,
                            ease: "easeInOut",
                        }}
                    >
                        {p.symbol}
                    </motion.span>
                ))}
            </div>

            {/* Content */}
            <div className="relative z-10 text-center max-w-xl mx-auto">
                {/* Glitch 404 */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.8, ease }}
                    className="relative mb-6"
                >
                    <span className="text-[140px] sm:text-[180px] md:text-[220px] font-black leading-none tracking-tighter text-foreground/90 select-none"
                       
                    >
                        404
                    </span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.6, delay: 0.2, ease }}
                    className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground mb-4 tracking-tight"
                >
                    Lost in the <span className="text-primary">codebase?</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35, ease }}
                    className="text-muted-foreground text-base md:text-lg mb-8 leading-relaxed max-w-md mx-auto"
                >
                    The page you're looking for was moved, deleted, or maybe never existed. Let's get you back on track.
                </motion.p>

                {/* Error code snippet */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.45, ease }}
                    className="bg-card backdrop-blur-sm border border-border rounded-xl p-4 mb-10 max-w-sm mx-auto text-left font-mono text-sm"
                >
                    <div className="flex items-center gap-1.5 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-muted" />
                        <span className="ml-2 text-[10px] text-muted-foreground/70">terminal</span>
                    </div>
                    <div>
                        <span className="text-destructive/70">Error</span>
                        <span className="text-muted-foreground">: </span>
                        <span className="text-muted-foreground">Page</span>
                        <span className="text-muted-foreground">.</span>
                        <span className="text-primary/70">notFound</span>
                        <span className="text-muted-foreground">()</span>
                    </div>
                    <div className="text-muted-foreground/70 mt-1">
                        <span className="text-muted-foreground/60">  at </span>
                        <span className="text-muted-foreground">Router</span>
                        <span className="text-muted-foreground/60"> (</span>
                        <span className="text-foreground">navigation.tsx</span>
                        <span className="text-muted-foreground/60">:42)</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-muted-foreground/70">
                        <span className="text-primary/50">→</span>
                        <span>Try </span>
                        <span className="text-foreground">navigating home</span>
                    </div>
                </motion.div>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.55, ease }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3"
                >
                    <Link href="/">
                        <Button variant="default" size="lg" className="px-8 group">
                            <Home size={16} className="mr-1.5" />
                            Take Me Home
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        size="lg"
                        className="px-8"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft size={16} className="mr-1.5" />
                        Go Back
                    </Button>
                </motion.div>
            </div>

            {/* Navbar shadow at top for consistency */}
            <div className="fixed top-0 left-0 right-0 z-50 p-5">
                <Link href="/" className="flex items-center gap-2.5 group w-fit">
                    <div className="relative w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover: transition-shadow duration-300">
                        <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" className="w-4.5 h-4.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span className="text-lg font-bold text-primary tracking-tight">MYCODEBUD</span>
                </Link>
            </div>
        </div>
    );
}
