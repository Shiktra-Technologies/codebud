"use client";

import React, { Suspense, lazy, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ChevronDown, Play, Pause, Code2, X, ExternalLink } from "lucide-react";
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
    const [showDemo, setShowDemo] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);
    const demoRef = useRef<HTMLDivElement>(null);
    const videoIframeRef = useRef<HTMLIFrameElement>(null);

    const sendVideoCommand = (func: string, args: unknown[] = []) => {
        if (videoIframeRef.current?.contentWindow) {
            videoIframeRef.current.contentWindow.postMessage(
                JSON.stringify({ event: "command", func, args }),
                "*"
            );
        }
    };

    const enforce1080p = () => {
        sendVideoCommand("setPlaybackQuality", ["hd1080"]);
        sendVideoCommand("setPlaybackQualityRange", ["hd1080", "hd1080"]);
    };

    const togglePlayPause = () => {
        if (isPlaying) {
            sendVideoCommand("pauseVideo");
            setIsPlaying(false);
        } else {
            sendVideoCommand("playVideo");
            enforce1080p();
            setIsPlaying(true);
        }
    };

    useEffect(() => {
        if (!showDemo) return;

        enforce1080p();
        // Continuously enforce 1080p HD so cursor movement or window focus never drops bitrate
        const qualityInterval = setInterval(enforce1080p, 1500);

        const handleMessage = (event: MessageEvent) => {
            try {
                const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
                if (data?.event === "onReady") {
                    enforce1080p();
                }
                if (data?.event === "infoDelivery" && data.info) {
                    if (data.info.playerState === 1) {
                        setIsPlaying(true);
                    } else if (data.info.playerState === 2 || data.info.playerState === 0) {
                        setIsPlaying(false);
                    }
                }
            } catch {
                // ignore non-json messages
            }
        };

        window.addEventListener("message", handleMessage);
        return () => {
            clearInterval(qualityInterval);
            window.removeEventListener("message", handleMessage);
        };
    }, [showDemo]);

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
            <div className={`relative z-10 flex-1 flex flex-col items-center justify-center w-full ${showDemo ? "max-w-6xl" : "max-w-5xl"} mx-auto px-4 sm:px-6 pt-24 pb-8 text-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]`}>

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
                    MY<span className="text-primary">CODEBUD</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.7, delay: 0.55, ease }}
                    className="text-muted-foreground text-base md:text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                    A career and capability-building ecosystem for engineering students — guidance, mentorship, projects, DSA, hackathons and placement support.
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
                    <Button
                        variant={showDemo ? "secondary" : "outline"}
                        size="lg"
                        className="w-full sm:w-auto px-8 transition-all duration-300"
                        onClick={() => {
                            if (showDemo) {
                                setShowDemo(false);
                            } else {
                                setShowDemo(true);
                                setTimeout(() => {
                                    demoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                                }, 120);
                            }
                        }}
                    >
                        {showDemo ? (
                            <>
                                <Code2 size={15} className="mr-1.5 text-primary" />
                                View Code
                            </>
                        ) : (
                            <>
                                <Play size={15} className="mr-1.5 text-primary fill-primary/20" />
                                Watch Demo
                            </>
                        )}
                    </Button>
                </motion.div>

                {/* ── 3D IDE Mockup / Video Demo ── */}
                <motion.div
                    ref={demoRef}
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.0, delay: 0.9, ease }}
                    className={`ide-stage w-full ${showDemo ? "max-w-5xl" : "max-w-3xl"} mx-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]`}
                >
                    <AnimatePresence mode="wait">
                        {!showDemo ? (
                            /* The tilt itself lives in CSS (.ide-tilt) so it can flatten on
                                hover and on narrow screens without fighting Motion. */
                            <motion.div
                                key="code-mockup-card"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.35, ease }}
                                className="ide-tilt relative rounded-xl overflow-hidden border border-border"
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
                                    <div className="flex items-center justify-between px-4 py-2.5">
                                        <div className="flex items-center">
                                            <div className="flex gap-1.5 mr-4">
                                                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                                                <div className="w-3 h-3 rounded-full bg-primary/60" />
                                                <div className="w-3 h-3 rounded-full bg-muted" />
                                            </div>
                                            <div className="flex gap-px">
                                                <div className="bg-muted px-4 py-1.5 rounded-t-lg text-[11px] text-foreground font-mono flex items-center gap-2 border border-border border-b-0">
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
                                                <button
                                                    onClick={() => setShowDemo(true)}
                                                    className="px-3 py-1.5 text-[11px] text-muted-foreground/60 hover:text-primary font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                                                    title="Watch Platform Demo"
                                                >
                                                    <Play size={10} className="text-primary/70" />
                                                    demo.mp4
                                                </button>
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
                            </motion.div>
                        ) : (
                            /* Video Demo Card with immersive enlargement animation */
                            <motion.div
                                key="video-demo-card"
                                initial={{ opacity: 0, scale: 0.82, y: 32 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.85, y: 20 }}
                                transition={{ duration: 0.65, ease }}
                                className="relative rounded-xl overflow-hidden border border-border bg-card shadow-[0_30px_90px_rgba(0,0,0,0.85)]"
                            >
                                {/* IDE Chrome — Top bar */}
                                <div className="relative z-10 bg-card backdrop-blur-lg border-b border-border px-4 py-2.5 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="flex gap-1.5 mr-4">
                                            <button
                                                onClick={() => setShowDemo(false)}
                                                className="w-3 h-3 rounded-full bg-destructive/70 hover:bg-destructive flex items-center justify-center group cursor-pointer transition-colors"
                                                title="Close Video"
                                            >
                                                <X size={8} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                            <div className="w-3 h-3 rounded-full bg-primary/60" />
                                            <div className="w-3 h-3 rounded-full bg-muted" />
                                        </div>
                                        <div className="flex gap-px">
                                            {/* Inactive Welcome.tsx tab */}
                                            <button
                                                onClick={() => setShowDemo(false)}
                                                className="px-4 py-1.5 text-[11px] text-muted-foreground hover:text-foreground font-mono flex items-center gap-2 transition-colors cursor-pointer"
                                                title="Switch back to Welcome.tsx"
                                            >
                                                <svg width="12" height="12" viewBox="0 0 32 32" className="text-muted-foreground">
                                                    <circle cx="16" cy="16" r="14" fill="currentColor" opacity="0.2" />
                                                    <text x="16" y="21" textAnchor="middle" fontSize="16" fill="currentColor" fontWeight="bold">⚛</text>
                                                </svg>
                                                Welcome.tsx
                                            </button>
                                            {/* Active demo.mp4 tab */}
                                            <div className="bg-muted px-4 py-1.5 rounded-t-lg text-[11px] text-foreground font-mono flex items-center gap-2 border border-border border-b-0 font-medium">
                                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                demo.mp4
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowDemo(false)}
                                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 hover:bg-muted border border-border transition-colors font-mono cursor-pointer"
                                    >
                                        <Code2 size={12} className="text-primary" />
                                        <span>Back to Code</span>
                                    </button>
                                </div>

                                {/* YouTube Video Player with Click-to-Play/Pause & Constant 1080p HD */}
                                <div
                                    className="relative z-10 w-full aspect-video bg-black overflow-hidden cursor-pointer group select-none"
                                    onClick={togglePlayPause}
                                    onMouseEnter={enforce1080p}
                                    onMouseLeave={enforce1080p}
                                    title={isPlaying ? "Click to Pause" : "Click to Play"}
                                    style={{ transform: "translateZ(0)", willChange: "transform", backfaceVisibility: "hidden" }}
                                >
                                    <iframe
                                        ref={videoIframeRef}
                                        src="https://www.youtube-nocookie.com/embed/4xKh__QymKA?autoplay=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&playsinline=1&enablejsapi=1&vq=hd1080"
                                        title="Platform Demo"
                                        className="absolute w-full h-[128%] -top-[14%] left-0 border-0 pointer-events-none select-none"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        style={{ transform: "translateZ(0)", willChange: "transform", backfaceVisibility: "hidden" }}
                                        onLoad={() => {
                                            enforce1080p();
                                        }}
                                    />

                                    {/* Centered Play overlay when paused */}
                                    <AnimatePresence>
                                        {!isPlaying && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.85 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.85 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute inset-0 z-20 flex items-center justify-center bg-black/50"
                                            >
                                                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary/40 transition-transform duration-200 group-hover:scale-110">
                                                    <Play size={28} className="fill-current ml-1" />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Hover Pause indicator when playing */}
                                    {isPlaying && (
                                        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                            <div className="w-14 h-14 rounded-full bg-black/80 border border-white/20 text-white flex items-center justify-center shadow-2xl">
                                                <Pause size={22} className="fill-white" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Video Footer — status bar */}
                                <div className="relative z-10 bg-card border-t border-border px-4 py-1.5 flex items-center justify-between text-[10px] text-muted-foreground/70 font-mono">
                                    <div className="flex items-center gap-2.5">
                                        <button
                                            onClick={togglePlayPause}
                                            className="flex items-center gap-1.5 text-foreground/90 hover:text-primary transition-colors cursor-pointer px-1 py-0.5 rounded hover:bg-muted/50"
                                            title={isPlaying ? "Click to Pause" : "Click to Play"}
                                        >
                                            <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                                            <span className="font-medium">{isPlaying ? "Playing Demo" : "Paused"}</span>
                                            {isPlaying ? (
                                                <Pause size={10} className="ml-0.5 opacity-70" />
                                            ) : (
                                                <Play size={10} className="ml-0.5 opacity-70 fill-current" />
                                            )}
                                        </button>
                                        <span className="text-border">|</span>
                                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider">
                                            1080p HD
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-muted-foreground/50 hidden sm:inline">
                                            Click video to {isPlaying ? "pause" : "play"}
                                        </span>
                                        <a
                                            href="https://www.youtube.com/watch?v=4xKh__QymKA"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            <span>Open in YouTube</span>
                                            <ExternalLink size={10} />
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Trusted by strip */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 0.8 }}
                    className="mt-10 sm:mt-14 flex flex-col items-center gap-3"
                >
                    <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60 font-semibold">
                        Mentors who&apos;ve worked at
                    </span>
                    <div className="flex items-center gap-6 sm:gap-8 text-muted-foreground/60">
                        {["Amazon", "TCS", "Infosys", "Precisely", "SIH Jury"].map((company) => (
                            <span key={company} className="text-xs sm:text-sm font-semibold tracking-wide">
                                {company}
                            </span>
                        ))}
                    </div>
                    {/* The brand doc lists these as mentor affiliations shown for
                        professional context, explicitly not endorsements. */}
                    <span className="text-[10px] text-muted-foreground/40 max-w-md text-center">
                        Mentor affiliations shown for context on professional background — not endorsements by these organisations.
                    </span>
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
