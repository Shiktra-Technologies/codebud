"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";

import { HexDivider } from "../ui/hex-divider";

const stats = [
    { label: "Active Learners", value: 10000, suffix: "+", icon: "👨‍💻" },
    { label: "Coding Challenges", value: 200, suffix: "+", icon: "⚡" },
    { label: "Project-Based Courses", value: 50, suffix: "+", icon: "🚀" },
    { label: "Student Satisfaction", value: 95, suffix: "%", icon: "⭐" },
];

const ease = [0.16, 1, 0.3, 1] as const;

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    useEffect(() => {
        if (!isInView) return;
        const duration = 1500;
        const start = performance.now();

        function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(2, -10 * progress);
            setDisplay(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }, [isInView, value]);

    const formatted =
        display >= 1000
            ? `${(display / 1000).toFixed(display >= 10000 ? 0 : 1)}K`
            : `${display}`;

    return (
        <div ref={ref} className="text-3xl md:text-5xl font-bold mb-2 font-mono tabular-nums text-shimmer">
            {formatted}
            {suffix}
        </div>
    );
}

export const Stats = () => {
    return (
        <section className="py-20 md:py-24 relative overflow-hidden bg-surface-0">
            <div className="absolute inset-0 honeycomb-bg-lg opacity-30 pointer-events-none" />

            {/* Top divider */}
            <div className="absolute top-0 left-0 right-0">
                <HexDivider />
            </div>

            {/* Ambient spotlight */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] rounded-full pointer-events-none"
                style={{
                    background:
                        "radial-gradient(ellipse, rgba(255,193,7,0.04) 0%, transparent 70%)",
                }}
            />

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 25, filter: "blur(6px)" }}
                            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: index * 0.1, duration: 0.6, ease }}
                            className="group relative text-center"
                        >
                            {/* Glassmorphic card */}
                            <div className="relative bg-surface-2/40 backdrop-blur-sm border border-white/[0.04] rounded-2xl p-6 md:p-8 transition-all duration-500 hover:border-yellow-400/15 hover:bg-surface-2/60 hover:shadow-[0_8px_40px_rgba(255,193,7,0.06)]">
                                {/* Gradient top border on hover */}
                                <div
                                    className="absolute top-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    style={{
                                        background: "linear-gradient(90deg, transparent, rgba(255,193,7,0.4), transparent)",
                                    }}
                                />

                                {/* Emoji icon */}
                                <div className="text-2xl mb-3 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                                    {stat.icon}
                                </div>

                                {/* Number with shimmer */}
                                <AnimatedNumber value={stat.value} suffix={stat.suffix} />

                                {/* Label */}
                                <div className="text-[10px] md:text-xs font-medium text-white/30 uppercase tracking-[0.2em] group-hover:text-white/45 transition-colors duration-300">
                                    {stat.label}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Bottom divider */}
            <div className="absolute bottom-0 left-0 right-0">
                <HexDivider />
            </div>
        </section>
    );
};
