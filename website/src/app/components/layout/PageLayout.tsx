"use client";

import React, { useEffect } from "react";
import Lenis from "lenis";
import { motion } from "motion/react";
import { Navbar, Footer } from "../sections";
import { CursorGlow } from "../ui/cursor-glow";
import { SectionBadge } from "../ui/section-badge";
import { FloatingHex } from "../ui/floating-hex";

const ease = [0.16, 1, 0.3, 1] as const;

interface PageLayoutProps {
    children: React.ReactNode;
    badge?: string;
    title: React.ReactNode;
    subtitle?: string;
}

export function PageLayout({ children, badge, title, subtitle }: PageLayoutProps) {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    return (
        <>
            <CursorGlow />
            <Navbar />
            <main>
                {/* ── Page Hero Header ── */}
                <section className="relative pt-36 pb-20 overflow-hidden bg-surface-0">
                    {/* Background layers */}
                    <div className="absolute inset-0 honeycomb-bg opacity-20 pointer-events-none" />
                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
                        style={{
                            background:
                                "radial-gradient(ellipse, rgba(255,193,7,0.05) 0%, rgba(255,193,7,0.02) 40%, transparent 70%)",
                        }}
                    />

                    {/* Floating hexes */}
                    <FloatingHex size={44} x="6%" y="20%" delay={0} opacity={0.05} rotation={12} />
                    <FloatingHex size={28} x="88%" y="30%" delay={0.4} opacity={0.04} rotation={-8} />
                    <FloatingHex size={36} x="92%" y="70%" delay={0.8} opacity={0.03} rotation={22} />

                    <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                        {badge && (
                            <motion.div
                                initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                transition={{ duration: 0.5, ease }}
                                className="mb-6"
                            >
                                <SectionBadge>{badge}</SectionBadge>
                            </motion.div>
                        )}

                        <motion.h1
                            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            transition={{ delay: 0.05, duration: 0.7, ease }}
                            className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-white tracking-tight leading-tight"
                        >
                            {title}
                        </motion.h1>

                        {subtitle && (
                            <motion.p
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.5, ease }}
                                className="text-white/40 text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
                            >
                                {subtitle}
                            </motion.p>
                        )}
                    </div>

                    {/* Bottom gradient fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-surface-0 to-transparent pointer-events-none" />
                </section>

                {children}
            </main>
            <Footer />
        </>
    );
}
