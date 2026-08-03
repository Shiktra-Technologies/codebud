"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { Users, Code2, FolderKanban, Star, type LucideIcon } from "lucide-react";

/*
 * B1 step 1: these four carried emoji (technologist, bolt, rocket, star), which
 * the no-emoji rule forbids. Mapped to what each stat MEANS rather than to each
 * removed glyph's lucide
 * twin — "Project-Based Courses" is projects, not a rocket. Interim treatment:
 * B1 step 4 replaces these with the custom hex-derived accent marks.
 */
const stats: { label: string; value: number; suffix: string; icon: LucideIcon }[] = [
    { label: "Active Learners", value: 10000, suffix: "+", icon: Users },
    { label: "Coding Challenges", value: 200, suffix: "+", icon: Code2 },
    { label: "Project-Based Courses", value: 50, suffix: "+", icon: FolderKanban },
    { label: "Student Satisfaction", value: 95, suffix: "%", icon: Star },
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
        <div ref={ref} className="text-3xl md:text-5xl font-bold mb-2 font-mono tabular-nums text-foreground">
            {formatted}
            {suffix}
        </div>
    );
}

export const Stats = () => {
    return (
        <section className="py-20 md:py-24 relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 25, filter: "blur(6px)" }}
                                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ delay: index * 0.1, duration: 0.6, ease }}
                                className="group relative text-center"
                            >
                                <div className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-6 md:p-8 transition-colors duration-500 hover:border-primary/15">
                                    {/* h-8 matches the 2rem line-box the emoji occupied, so the
                                        numbers below keep their exact position. */}
                                    <div className="h-8 mb-3 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                                        <Icon size={22} strokeWidth={1.5} className="text-primary" aria-hidden="true" />
                                    </div>

                                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />

                                    <div className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-[0.2em]">
                                        {stat.label}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
