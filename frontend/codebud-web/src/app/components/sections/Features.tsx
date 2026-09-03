"use client";

import React from "react";
import { motion } from "motion/react";
import { Book, Code, Users, Zap, Trophy, Rocket } from "lucide-react";

import { SectionBadge } from "@/components/section-badge";
import { Tilt3D } from "@/components/Tilt3D";
import { HoneycombBand } from "@/components/HoneycombField";
import { HexCluster } from "@/components/HexCluster";

const features = [
    {
        icon: Rocket,
        title: "Real Projects, Not Templates",
        description:
            "Novelty-first, portfolio-ready work — never the same copied project every batch turns in.",
        span: "lg:col-span-1 lg:row-span-2",
        visual: "paths",
    },
    {
        icon: Users,
        title: "Mentorship From Practitioners",
        description:
            "Learn from people who've shipped code and sat on the other side of the interview table.",
        span: "lg:col-span-1",
        visual: "mentorship",
    },
    {
        icon: Code,
        title: "Placement-Aligned DSA",
        description:
            "Practice tracks and interview questions built around what companies actually ask.",
        span: "lg:col-span-1",
        visual: "dsa",
    },
    {
        icon: Trophy,
        title: "Hackathon Support",
        description:
            "Mentor guidance and technical support to compete in national-level hackathons and challenges.",
        span: "lg:col-span-1",
        visual: "hackathons",
    },
    {
        icon: Zap,
        title: "₹99 A Month",
        description:
            "High-value career preparation priced so cost is never the reason a student sits out.",
        span: "lg:col-span-1",
        visual: "pricing",
    },
    {
        icon: Book,
        title: "An Ecosystem, Not A Course",
        description:
            "Guidance, mentorship, projects and placement support that work together — not scattered across apps.",
        span: "lg:col-span-1 lg:row-span-2",
        visual: "ecosystem",
    },
];

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Mini visual for tall cards ── */
function CardVisual({ type }: { type: string }) {
    if (type === "paths") {
        return (
            <div className="mt-4 space-y-2 opacity-40 group-hover:opacity-60 transition-opacity duration-500">
                {["Core project", "Novelty brief", "Mentor code review", "GitHub-ready docs", "Demo Day"].map((step, i) => (
                    <div key={step} className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${i < 3 ? "bg-primary" : "bg-muted"}`} />
                        <div className="h-px flex-1 bg-muted" />
                        <span className="text-[10px] font-mono text-muted-foreground">{step}</span>
                    </div>
                ))}
            </div>
        );
    }
    if (type === "ecosystem") {
        return (
            <div className="mt-4 space-y-2 opacity-40 group-hover:opacity-60 transition-opacity duration-500">
                {[
                    "Guidance & Direction",
                    "Mentorship",
                    "Core & Novelty Projects",
                    "DSA Practice",
                    "Interview Preparation",
                    "Hackathons",
                    "Placement Support",
                ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                        <span className="text-primary/60">&rarr;</span>
                        {item}
                    </div>
                ))}
            </div>
        );
    }
    return null;
}

/* ── Tilting bento card ──
 * The mouse-tracking "spotlight" this used to carry painted a gradient whose
 * every stop was `transparent`, so it cost a handler per move and rendered
 * nothing. Tilt3D's sheen is the same idea with a colour in it, and it rides
 * the same pointer position that drives the tilt. */
function FeatureCard({
    feature,
    index,
}: {
    feature: (typeof features)[0];
    index: number;
}) {
    const isTall = feature.span.includes("row-span-2");

    return (
        <motion.div
            initial={{ opacity: 0, y: 25, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ delay: index * 0.08, duration: 0.6, ease }}
            className={`${feature.span}`}
        >
            <Tilt3D
                stageClassName="h-full"
                className="group h-full bg-card backdrop-blur-sm border border-border rounded-xl p-7 overflow-hidden hover:border-primary/15"
            >
                <div className="relative z-10 tilt-layer-2">
                    {/* Hexagonal plinth — the comb's own cell, extruded, so the
                        icon sits on the same geometry as the field behind it. */}
                    <div className="hex-stack mb-5 w-12 h-12 tilt-layer-1">
                        <div className="hex-badge w-full h-full text-primary/80">
                            <feature.icon size={19} strokeWidth={1.5} />
                        </div>
                    </div>

                    <h3 className="text-base font-semibold mb-2.5 text-foreground group-hover:text-foreground transition-colors duration-200">
                        {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm group-hover:text-muted-foreground transition-colors duration-300">
                        {feature.description}
                    </p>

                    {isTall && <CardVisual type={feature.visual} />}
                </div>
            </Tilt3D>
        </motion.div>
    );
}

export const Features = () => {
    return (
        <section id="features" className="py-28 overflow-hidden relative">

            {/* Spotlight */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse, transparent 0%, transparent 60%)",
                }}
            />

            <HoneycombBand top="0" height={320} />
            <HexCluster side="right" />

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
                        <SectionBadge>Why MYCODEBUD</SectionBadge>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.05, duration: 0.6, ease }}
                        className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-5 text-foreground tracking-tight"
                    >
                        Six reasons students
                        <br className="hidden sm:block" />
                        <span className="text-primary"> pick MyCodeBud</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, duration: 0.5, ease }}
                        className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto leading-relaxed"
                    >
                        Not another course library. An ecosystem built so preparation turns into evidence a recruiter actually believes.
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
