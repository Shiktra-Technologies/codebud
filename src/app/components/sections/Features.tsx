"use client";

import React, { useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Book, Code, Users, Zap, Trophy, Rocket } from "lucide-react";

import { SectionBadge } from "../ui/section-badge";
import { HexIcon } from "../ui/hex-icon";

const features = [
    {
        icon: Book,
        title: "Structured Learning Paths",
        description:
            "From HTML basics to full-stack mastery — follow curated roadmaps designed by industry experts.",
        span: "lg:col-span-1 lg:row-span-2",
        visual: "paths",
    },
    {
        icon: Code,
        title: "Hands-On Coding Labs",
        description:
            "Practice in real-time coding environments. Build projects, not just theory.",
        span: "lg:col-span-1",
        visual: "code",
    },
    {
        icon: Zap,
        title: "AI-Powered Feedback",
        description:
            "Get instant code reviews and personalized suggestions to level up faster.",
        span: "lg:col-span-1",
        visual: "ai",
    },
    {
        icon: Users,
        title: "Peer Community",
        description:
            "Collaborate with fellow learners, join coding challenges, and grow together.",
        span: "lg:col-span-1",
        visual: "community",
    },
    {
        icon: Trophy,
        title: "Certifications & Badges",
        description:
            "Earn recognized certificates as you complete milestones in your coding journey.",
        span: "lg:col-span-1",
        visual: "certs",
    },
    {
        icon: Rocket,
        title: "Career Launchpad",
        description:
            "Access internship opportunities, resume building tools, and mock interviews.",
        span: "lg:col-span-1 lg:row-span-2",
        visual: "career",
    },
];

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Mini visual for tall cards ── */
function CardVisual({ type }: { type: string }) {
    if (type === "paths") {
        return (
            <div className="mt-4 space-y-2 opacity-40 group-hover:opacity-60 transition-opacity duration-500">
                {["HTML & CSS", "JavaScript", "React", "Node.js", "Full-Stack"].map((step, i) => (
                    <div key={step} className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${i < 3 ? "bg-yellow-400" : "bg-white/20"}`} />
                        <div className="h-px flex-1 bg-white/[0.06]" />
                        <span className="text-[10px] font-mono text-white/30">{step}</span>
                    </div>
                ))}
            </div>
        );
    }
    if (type === "career") {
        return (
            <div className="mt-4 space-y-2 opacity-40 group-hover:opacity-60 transition-opacity duration-500">
                {["Resume Builder", "Mock Interviews", "Internship Board", "Portfolio Review"].map((item, i) => (
                    <div key={item} className="flex items-center gap-2 text-[10px] font-mono text-white/30">
                        <span className="text-yellow-400/60">→</span>
                        {item}
                    </div>
                ))}
            </div>
        );
    }
    return null;
}

/* ── Spotlight card with mouse tracking ── */
function FeatureCard({
    feature,
    index,
}: {
    feature: (typeof features)[0];
    index: number;
}) {
    const cardRef = useRef<HTMLDivElement>(null);
    const spotlightRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!cardRef.current || !spotlightRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        spotlightRef.current.style.background = `radial-gradient(400px circle at ${x}px ${y}px, rgba(255,193,7,0.06), transparent 60%)`;
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (spotlightRef.current) {
            spotlightRef.current.style.background = "transparent";
        }
    }, []);

    const isTall = feature.span.includes("row-span-2");

    return (
        <motion.div
            initial={{ opacity: 0, y: 25, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ delay: index * 0.08, duration: 0.6, ease }}
            className={`${feature.span}`}
        >
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="group relative h-full bg-surface-2/40 backdrop-blur-sm border border-white/[0.04] rounded-2xl p-7 transition-all duration-500 hover:border-yellow-400/15 hover:bg-surface-2/60 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(255,193,7,0.06)] overflow-hidden"
            >
                {/* Mouse-tracking spotlight */}
                <div
                    ref={spotlightRef}
                    className="absolute inset-0 pointer-events-none z-0 transition-[background] duration-300"
                />

                {/* Gradient top border on hover */}
                <div
                    className="absolute top-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                        background: "linear-gradient(90deg, transparent, rgba(255,193,7,0.3), transparent)",
                    }}
                />

                {/* Corner hex accent */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <svg width="20" height="23" viewBox="0 0 20 23" className="text-yellow-400/10">
                        <path d="M10 0.5 L19.3 5.75 V16.25 L10 21.5 L0.7 16.25 V5.75 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
                    </svg>
                </div>

                <div className="relative z-10">
                    <HexIcon className="mb-5">
                        <feature.icon size={20} strokeWidth={2} />
                    </HexIcon>

                    <h3 className="text-base font-semibold mb-2.5 text-white/90 group-hover:text-white transition-colors duration-200">
                        {feature.title}
                    </h3>
                    <p className="text-white/40 leading-relaxed text-sm group-hover:text-white/55 transition-colors duration-300">
                        {feature.description}
                    </p>

                    {isTall && <CardVisual type={feature.visual} />}
                </div>
            </div>
        </motion.div>
    );
}

export const Features = () => {
    return (
        <section id="features" className="py-28 bg-surface-0 overflow-hidden relative">
            <div className="absolute inset-0 honeycomb-bg-lg opacity-30 pointer-events-none" />

            {/* Spotlight */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse, rgba(255,193,7,0.04) 0%, transparent 60%)",
                }}
            />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Section header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease }}
                        className="mb-5"
                    >
                        <SectionBadge>Why CODE BUD</SectionBadge>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.05, duration: 0.6, ease }}
                        className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-5 text-white tracking-tight"
                    >
                        Everything you need to
                        <br className="hidden sm:block" />
                        <span className="text-shimmer"> become a developer</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, duration: 0.5, ease }}
                        className="text-white/40 text-base md:text-lg max-w-lg mx-auto leading-relaxed"
                    >
                        Tools, community, and curriculum designed to take you from beginner to confident developer.
                    </motion.p>
                </div>

                {/* Bento grid layout */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
                    {features.map((feature, index) => (
                        <FeatureCard key={index} feature={feature} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
};
