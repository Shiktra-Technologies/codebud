"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";

import { Tilt3D } from "@/components/Tilt3D";


const stats = [
    { label: "Coding Challenges", value: 3000, suffix: "+", icon: "⚡" },
    { label: "Projects", value: 3000, suffix: "+", icon: "🚀" },
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
            if (progress >= 1) {
                // The exponential ease never quite reaches 1, so land on the exact value.
                setDisplay(value);
                return;
            }
            const eased = 1 - Math.pow(2, -10 * progress);
            setDisplay(Math.floor(eased * value));
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }, [isInView, value]);

    // Full digits — the counts read as "3000+", not "3.0K".
    const formatted = `${display}`;

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

            {/* Top divider */}
            <div className="absolute top-0 left-0 right-0">
            </div>

            {/* Ambient spotlight */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] rounded-full pointer-events-none"
                style={{
                    background:
                        "radial-gradient(ellipse, transparent 0%, transparent 70%)",
                }}
            />

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 25, filter: "blur(6px)" }}
                            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: index * 0.1, duration: 0.6, ease }}
                            className="text-center"
                        >
                            <Tilt3D
                                max={6}
                                lift={10}
                                className="group bg-card backdrop-blur-sm border border-border rounded-xl p-6 md:p-8 hover:border-primary/15"
                            >
                                {/* Hexagonal plinth carrying the emoji — same cell
                                    the ambient comb is built from, extruded. */}
                                <div className="hex-stack w-12 h-12 mx-auto mb-4 tilt-layer-1">
                                    <div className="hex-badge w-full h-full text-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                                        {stat.icon}
                                    </div>
                                </div>

                                <div className="tilt-layer-2">
                                    {/* Number with shimmer */}
                                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />

                                    {/* Label */}
                                    <div className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-[0.2em]">
                                        {stat.label}
                                    </div>
                                </div>
                            </Tilt3D>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Bottom divider */}
            <div className="absolute bottom-0 left-0 right-0">
            </div>
        </section>
    );
};
