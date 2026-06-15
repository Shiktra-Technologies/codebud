"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

export const Navbar = () => {
    const [isScrolled, setIsScrolled] = React.useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { label: "Features", href: "/#features" },
        { label: "Pricing", href: "/#pricing" },
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
    ];

    return (
        <>
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${isScrolled
                    ? "py-2.5"
                    : "py-4"
                    }`}
            >
                {/* Glassmorphic background layer */}
                <div
                    className={`absolute inset-0 transition-all duration-500 ${isScrolled
                        ? "bg-surface-0/70 backdrop-blur-2xl backdrop-saturate-150"
                        : "bg-transparent"
                        }`}
                />

                {/* Animated bottom border — gold gradient line on scroll */}
                <div
                    className={`absolute bottom-0 left-0 right-0 h-px transition-opacity duration-500 ${isScrolled ? "opacity-100" : "opacity-0"
                        }`}
                    style={{
                        background:
                            "linear-gradient(90deg, transparent, rgba(255,193,7,0.3) 30%, rgba(255,193,7,0.5) 50%, rgba(255,193,7,0.3) 70%, transparent)",
                    }}
                />

                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between relative z-10">
                    {/* Logo with glow */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="relative">
                            {/* Logo glow */}
                            <div
                                className="absolute -inset-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{
                                    background: "radial-gradient(circle, rgba(255,193,7,0.15) 0%, transparent 70%)",
                                }}
                            />
                            <div className="relative w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(255,193,7,0.3)] transition-shadow duration-300">
                                <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" className="w-4.5 h-4.5">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                        </div>
                        <span className="text-lg font-bold text-yellow-400 tracking-tight">CODE BUD</span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="relative text-[13px] font-medium text-white/50 hover:text-white transition-colors duration-200 uppercase tracking-[0.15em] group/link"
                            >
                                {link.label}
                                {/* Hover underline */}
                                <span className="absolute -bottom-1 left-0 right-0 h-px bg-yellow-400/50 scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300 origin-left" />
                            </Link>
                        ))}

                        {/* CTA with animated border */}
                        <Link
                            href="/auth"
                            className="relative text-[13px] font-semibold text-surface-0 bg-yellow-400 px-5 py-2 rounded-lg hover:bg-yellow-300 transition-all duration-200 hover:shadow-[0_0_24px_rgba(255,193,7,0.25)] hover:scale-[1.03] active:scale-[0.98]"
                        >
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden text-white/70 hover:text-white p-2 transition-colors"
                        aria-label="Toggle menu"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {isMobileMenuOpen ? (
                                <path d="M18 6L6 18M6 6l12 12" />
                            ) : (
                                <path d="M3 12h18M3 6h18M3 18h18" />
                            )}
                        </svg>
                    </button>
                </div>
            </motion.nav>

            {/* Fullscreen mobile menu overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-40 bg-surface-0/95 backdrop-blur-3xl flex flex-col items-center justify-center"
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="absolute top-5 right-6 text-white/50 hover:text-white p-2"
                            aria-label="Close menu"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Decorative spotlight */}
                        <div
                            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
                            style={{
                                background: "radial-gradient(circle, rgba(255,193,7,0.06) 0%, transparent 60%)",
                            }}
                        />

                        <nav className="flex flex-col items-center gap-8 relative z-10">
                            {navLinks.map((link, i) => (
                                <motion.div
                                    key={link.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ delay: i * 0.08, duration: 0.4, ease }}
                                >
                                    <Link
                                        href={link.href}
                                        className="text-2xl font-semibold text-white/60 hover:text-yellow-400 transition-colors duration-200 uppercase tracking-[0.15em]"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                </motion.div>
                            ))}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ delay: navLinks.length * 0.08, duration: 0.4, ease }}
                            >
                                <Link
                                    href="/auth"
                                    className="mt-4 inline-block text-lg font-semibold text-surface-0 bg-yellow-400 px-8 py-3 rounded-xl hover:bg-yellow-300 transition-all duration-200"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Get Started
                                </Link>
                            </motion.div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
