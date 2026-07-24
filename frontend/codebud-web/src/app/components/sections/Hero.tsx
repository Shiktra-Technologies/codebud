"use client";

import React, { Suspense, lazy } from "react";
import { motion } from "motion/react";
import { ArrowRight, ChevronDown, Play } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SectionBadge } from "@/components/section-badge";
import { CodeTyping } from "@/components/brand/code-typing";
import { PLATFORM_AUTH_URL } from "@/lib/platformUrl";

const BabylonScene = lazy(() =>
    import("./BabylonScene").then((m) => ({ default: m.BabylonScene }))
);

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Floating code particles ── */
const codeSymbols = [
    { symbol: "</>", x: "8%", y: "20%", size: 16, delay: 0, duration: 12 },
    { symbol: "{ }", x: "88%", y: "15%", size: 14, delay: 2, duration: 14 },
    { symbol: "=>", x: "82%", y: "55%", size: 12, delay: 4, duration: 10 },
    { symbol: "( )", x: "5%", y: "60%", size: 13, delay: 1, duration: 13 },
    { symbol: "[ ]", x: "92%", y: "35%", size: 11, delay: 3, duration: 11 },
    { symbol: "//", x: "15%", y: "80%", size: 10, delay: 5, duration: 15 },
    { symbol: "&&", x: "75%", y: "75%", size: 12, delay: 2.5, duration: 12 },
    { symbol: "++", x: "50%", y: "5%", size: 11, delay: 1.5, duration: 14 },
];

export const Hero = () => {
    return (
        <section className="relative min-h-screen flex flex-col items-center overflow-hidden noise-overlay">
            {/* ── Honeycomb pattern ── */}

            {/* ── Babylon.js 3D Scene ── */}
            <div className="absolute inset-0 z-[2] pointer-events-none">
                <Suspense fallback={null}>
                    <BabylonScene />
                </Suspense>
            </div>

            {/* ── Dramatic spotlight ── */}
            <div className="absolute inset-0 z-[3] pointer-events-none">
                {/* Primary spotlight — warm amber */}
                <div
                    className="absolute top-1/3 left-1/2"
                    style={{
                        width: 1000,
                        height: 800,
                        background:
                            "radial-gradient(ellipse, transparent 0%, transparent 30%, transparent 60%)",
                        animation: "spotlight-pulse 6s ease-in-out infinite",
                    }}
                />
                {/* Secondary spotlight — cold accent for depth */}
                <div
                    className="absolute top-1/4 left-1/3 w-[600px] h-[600px]"
                    style={{
                        background:
                            "radial-gradient(circle, transparent 0%, transparent 50%)",
                    }}
                />
                {/* Bottom fade */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-48"
                    style={{
                        background: "linear-gradient(to top, var(--background), transparent)",
                    }}
                />
            </div>

            {/* ── Floating code symbol particles ── */}
            <div className="absolute inset-0 z-[4] pointer-events-none overflow-hidden">
                {codeSymbols.map((p, i) => (
                    <motion.span
                        key={i}
                        className="absolute font-mono text-primary/[0.07] font-bold select-none"
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

            {/* ── Content ── */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto px-6 pt-24 pb-8 text-center">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 15, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.6, delay: 0.2, ease }}
                    className="mb-6"
                >
                    <SectionBadge>
                        <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Now in Early Access
                        </span>
                    </SectionBadge>
                </motion.div>

                {/* Headline with shimmer */}
                <motion.h1
                    initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.8, delay: 0.35, ease }}
                    className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] tracking-tight mb-7"
                >
                    Learn to{" "}
                    <span className="text-primary">Code.</span>
                    <br />
                    Build the{" "}
                    <span className="text-primary">Future.</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.7, delay: 0.55, ease }}
                    className="text-muted-foreground text-base md:text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                    From zero to hero — interactive lessons, real-world projects, AI-powered feedback, and a thriving community of 10,000+ developers.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7, ease }}
                    className="flex flex-col sm:flex-row items-center gap-3 mb-16 sm:mb-20"
                >
                    <Link href={PLATFORM_AUTH_URL}>
                        <Button variant="default" size="lg" className="w-full sm:w-auto group px-8">
                            Start Learning Free
                            <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                        </Button>
                    </Link>
                    <a href="/#features">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                            <Play size={15} className="mr-1" />
                            Watch Demo
                        </Button>
                    </a>
                </motion.div>

                {/* ── 3D IDE Mockup ── */}
                <motion.div
                    initial={{ opacity: 0, y: 60, rotateX: 8 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 1.0, delay: 0.9, ease }}
                    className="w-full max-w-3xl mx-auto"
                    style={{ perspective: 1200 }}
                >
                    <div
                        className="relative rounded-xl overflow-hidden border border-border"
                        style={{
                            transform: "perspective(1200px) rotateX(2deg)",
                            animation: "ide-glow 4s ease-in-out infinite",
                        }}
                    >
                        {/* Gradient border glow */}
                        <div
                            className="absolute -inset-px rounded-xl pointer-events-none z-20"
                            style={{
                                background:
                                    "linear-gradient(135deg, transparent 0%, transparent 40%, transparent 60%, transparent 100%)",
                            }}
                        />

                        {/* IDE Chrome — Top bar */}
                        <div className="relative z-10 bg-card backdrop-blur-lg border-b border-border">
                            {/* Traffic lights + tabs */}
                            <div className="flex items-center px-4 py-2.5">
                                <div className="flex gap-1.5 mr-4">
                                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                                    <div className="w-3 h-3 rounded-full bg-primary/60" />
                                    <div className="w-3 h-3 rounded-full bg-muted" />
                                </div>
                                <div className="flex gap-px flex-1">
                                    <div className="bg-muted px-4 py-1.5 rounded-t-lg text-[11px] text-muted-foreground font-mono flex items-center gap-2 border border-border border-b-0">
                                        <svg width="12" height="12" viewBox="0 0 32 32" className="text-muted-foreground">
                                            <circle cx="16" cy="16" r="14" fill="currentColor" opacity="0.2" />
                                            <text x="16" y="21" textAnchor="middle" fontSize="16" fill="currentColor" fontWeight="bold">⚛</text>
                                        </svg>
                                        Welcome.tsx
                                    </div>
                                    <div className="px-4 py-1.5 text-[11px] text-muted-foreground/70 font-mono flex items-center gap-2">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary/40">
                                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                        </svg>
                                        styles.css
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* IDE Body — sidebar + code */}
                        <div className="relative z-10 flex bg-card backdrop-blur-xl">
                            {/* Mini sidebar — file tree */}
                            <div className="hidden sm:block w-44 border-r border-border py-3 px-2 shrink-0">
                                <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70 font-semibold px-2 mb-2">
                                    Explorer
                                </div>
                                {[
                                    { name: "src", indent: 0, isDir: true },
                                    { name: "components", indent: 1, isDir: true },
                                    { name: "Welcome.tsx", indent: 2, isDir: false, active: true },
                                    { name: "Button.tsx", indent: 2, isDir: false },
                                    { name: "styles", indent: 1, isDir: true },
                                    { name: "theme.css", indent: 2, isDir: false },
                                    { name: "package.json", indent: 0, isDir: false },
                                ].map((f, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center gap-1.5 py-0.5 px-2 rounded text-[11px] font-mono cursor-default ${f.active
                                            ? "bg-primary/[0.08] text-primary/80"
                                            : "text-muted-foreground hover:text-muted-foreground"
                                            }`}
                                        style={{ paddingLeft: `${8 + f.indent * 12}px` }}
                                    >
                                        <span className="text-[9px]">
                                            {f.isDir ? "📁" : f.active ? "📄" : "📄"}
                                        </span>
                                        {f.name}
                                    </div>
                                ))}
                            </div>

                            {/* Code editor area */}
                            <div className="flex-1 min-h-[220px] sm:min-h-[260px]">
                                <CodeTyping />
                            </div>
                        </div>

                        {/* IDE Footer — status bar */}
                        <div className="relative z-10 bg-card border-t border-border px-4 py-1 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 font-mono">
                                    <span className="w-1.5 h-1.5 rounded-full bg-muted" />
                                    Ready
                                </span>
                                <span className="text-[10px] text-muted-foreground/60 font-mono">UTF-8</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-muted-foreground/60 font-mono">TypeScript React</span>
                                <span className="text-[10px] text-muted-foreground/60 font-mono">Ln 1, Col 1</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Trusted by strip */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 0.8 }}
                    className="mt-10 sm:mt-14 flex flex-col items-center gap-3"
                >
                    <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60 font-semibold">
                        Trusted by developers at
                    </span>
                    <div className="flex items-center gap-6 sm:gap-8 text-muted-foreground/60">
                        {["Google", "Microsoft", "Amazon", "Meta", "Stripe"].map((company) => (
                            <span key={company} className="text-xs sm:text-sm font-semibold tracking-wide">
                                {company}
                            </span>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.0, duration: 0.8 }}
                className="relative z-10 pb-8"
            >
                <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                    <ChevronDown size={20} className="text-muted-foreground/70" />
                </motion.div>
            </motion.div>
        </section>
    );
};
