"use client";

import React from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { SectionBadge } from "../ui/section-badge";
import { Button } from "../ui/button";
import { FloatingHex } from "../ui/floating-hex";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Rotating honeycomb ring decoration ── */
function HoneycombRing({ size, opacity }: { size: number; opacity: number }) {
    return (
        <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ width: size, height: size, opacity }}
        >
            <svg
                viewBox="0 0 200 200"
                className="w-full h-full"
                style={{ animation: "hex-spin-slow 120s linear infinite" }}
            >
                {Array.from({ length: 6 }).map((_, i) => {
                    const angle = (i * 60 - 90) * (Math.PI / 180);
                    const cx = 100 + 72 * Math.cos(angle);
                    const cy = 100 + 72 * Math.sin(angle);
                    return (
                        <g key={i} transform={`translate(${cx - 12}, ${cy - 14})`}>
                            <path
                                d="M12 0 L23.3 6.5 V19.5 L12 26 L0.7 19.5 V6.5 Z"
                                fill="none"
                                stroke="#FFC107"
                                strokeWidth="0.5"
                            />
                        </g>
                    );
                })}
                <path
                    d="M100 78 L119 89 V111 L100 122 L81 111 V89 Z"
                    fill="none"
                    stroke="#FFC107"
                    strokeWidth="0.4"
                    strokeDasharray="3 2"
                />
            </svg>
        </div>
    );
}

/* ── Social proof mini avatars ── */
const avatars = [
    { initials: "PS", color: "from-violet-500 to-purple-600" },
    { initials: "AM", color: "from-cyan-400 to-blue-500" },
    { initials: "SC", color: "from-emerald-400 to-teal-500" },
    { initials: "RP", color: "from-amber-500 to-orange-500" },
    { initials: "AG", color: "from-rose-500 to-pink-500" },
];

export const CTA = () => {
    return (
        <section className="py-32 relative overflow-hidden bg-surface-0">
            <div className="absolute inset-0 honeycomb-bg opacity-30 pointer-events-none" />

            {/* Honeycomb rings */}
            <HoneycombRing size={500} opacity={0.08} />
            <HoneycombRing size={700} opacity={0.04} />

            {/* Spotlights */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
                style={{
                    background:
                        "radial-gradient(ellipse, rgba(255,193,7,0.06) 0%, rgba(255,193,7,0.02) 40%, transparent 70%)",
                }}
            />
            <div
                className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full pointer-events-none"
                style={{
                    background: "radial-gradient(circle, rgba(99,102,241,0.03) 0%, transparent 50%)",
                }}
            />

            {/* Floating hexes */}
            <FloatingHex size={48} x="8%" y="20%" delay={0} opacity={0.06} rotation={15} />
            <FloatingHex size={32} x="85%" y="25%" delay={0.5} opacity={0.04} rotation={-10} />
            <FloatingHex size={40} x="90%" y="70%" delay={1} opacity={0.05} rotation={20} />
            <FloatingHex size={28} x="12%" y="75%" delay={1.5} opacity={0.04} rotation={-15} />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="max-w-2xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease }}
                        className="mb-6"
                    >
                        <SectionBadge>Get Started</SectionBadge>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.05, duration: 0.7, ease }}
                        className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-white tracking-tight leading-tight"
                    >
                        Ready to start your
                        <br />
                        <span className="text-shimmer">coding journey?</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, duration: 0.5, ease }}
                        className="text-white/40 text-base md:text-lg mb-10 leading-relaxed max-w-md mx-auto"
                    >
                        Join thousands of students already building real-world projects and
                        leveling up their skills with MYCODEBUD.
                    </motion.p>

                    {/* CTA buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.15, duration: 0.5, ease }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
                    >
                        <Link href="/auth">
                            <Button variant="brand" size="xl" className="px-10 group shadow-[0_0_30px_rgba(255,193,7,0.15)]">
                                Join MYCODEBUD Today
                                <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                        </Link>
                        <a href="/#features">
                            <Button variant="brandOutline" size="xl" className="px-8">
                                Explore Courses
                            </Button>
                        </a>
                    </motion.div>

                    {/* Social proof */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.25, duration: 0.5, ease }}
                        className="flex items-center justify-center gap-3"
                    >
                        <div className="flex -space-x-2">
                            {avatars.map((a) => (
                                <div
                                    key={a.initials}
                                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${a.color} flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-surface-0`}
                                >
                                    {a.initials}
                                </div>
                            ))}
                        </div>
                        <span className="text-sm text-white/35">
                            Join <span className="text-yellow-400/70 font-semibold">10,000+</span> developers
                        </span>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
