"use client";

import React, { useEffect } from "react";
import Lenis from "lenis";
import { motion } from "motion/react";
import { Navbar, Footer } from "../sections";
import { SectionBadge } from "@/components/section-badge";

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
            <Navbar />
            <main>
                {/* ── Page Hero Header ── */}
                <section className="relative pt-36 pb-20 overflow-hidden">
                    {/* Background layers */}
                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
                        style={{
                            background:
                                "radial-gradient(ellipse, transparent 0%, transparent 40%, transparent 70%)",
                        }}
                    />


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
                            className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-foreground tracking-tight leading-tight"
                        >
                            {title}
                        </motion.h1>

                        {subtitle && (
                            <motion.p
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.5, ease }}
                                className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
                            >
                                {subtitle}
                            </motion.p>
                        )}
                    </div>

                    {/* Bottom gradient fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                </section>

                {children}
            </main>
            <Footer />
        </>
    );
}
