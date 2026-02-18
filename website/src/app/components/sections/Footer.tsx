"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Github, Twitter, MessageCircle, Send, ArrowUp, Heart } from "lucide-react";

import { HexDivider } from "../ui/hex-divider";

const socialLinks = [
    { icon: Github, href: "#", label: "GitHub", hoverColor: "hover:text-white hover:bg-white/10" },
    { icon: Twitter, href: "#", label: "Twitter", hoverColor: "hover:text-sky-400 hover:bg-sky-400/10" },
    { icon: MessageCircle, href: "#", label: "Discord", hoverColor: "hover:text-indigo-400 hover:bg-indigo-400/10" },
];

const footerLinks = [
    {
        title: "Product",
        links: [
            { label: "Features", href: "/#features" },
            { label: "Pricing", href: "/#pricing" },
            { label: "Roadmap", href: "#" },
            { label: "Changelog", href: "#" },
        ],
    },
    {
        title: "Resources",
        links: [
            { label: "Documentation", href: "#" },
            { label: "Blog", href: "/blog" },
            { label: "Tutorials", href: "/blog" },
            { label: "API Reference", href: "#" },
        ],
    },
    {
        title: "Company",
        links: [
            { label: "About", href: "/about" },
            { label: "Careers", href: "/careers" },
            { label: "Press", href: "#" },
            { label: "Contact", href: "/contact" },
        ],
    },
    {
        title: "Legal",
        links: [
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
            { label: "Security", href: "#" },
            { label: "Cookies", href: "/privacy#cookies" },
        ],
    },
];

const ease = [0.16, 1, 0.3, 1] as const;

export const Footer = () => {
    const [email, setEmail] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setEmail("");
            // TODO: newsletter signup
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <footer className="relative bg-surface-0 overflow-hidden">
            {/* Top divider */}
            <div className="relative">
                <HexDivider />
            </div>

            <div className="absolute inset-0 honeycomb-bg opacity-15 pointer-events-none" />

            {/* Ambient spotlight */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse, rgba(255,193,7,0.02) 0%, transparent 60%)",
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-8">
                {/* Top section: brand + newsletter */}
                <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-14">
                    {/* Brand */}
                    <div className="max-w-sm">
                        <a href="/" className="flex items-center gap-2.5 mb-4 group">
                            <div className="relative w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(255,193,7,0.3)] transition-shadow duration-300">
                                <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" className="w-4.5 h-4.5">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <span className="text-lg font-bold text-yellow-400 tracking-tight">CODE BUD</span>
                        </a>
                        <p className="text-sm text-white/30 leading-relaxed mb-6">
                            The modern platform for learning to code. Interactive lessons, real projects, AI feedback, and a thriving community.
                        </p>

                        {/* Social icons */}
                        <div className="flex gap-2">
                            {socialLinks.map((s) => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    aria-label={s.label}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-white/30 border border-white/[0.04] transition-all duration-300 hover:scale-110 hover:border-white/[0.08] ${s.hoverColor}`}
                                >
                                    <s.icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div className="w-full max-w-md">
                        <h3 className="text-sm font-semibold text-white/80 mb-2">Stay in the loop</h3>
                        <p className="text-sm text-white/30 mb-4">Get weekly coding tips and platform updates.</p>
                        <form onSubmit={handleSubmit} className="relative">
                            <div
                                className={`relative rounded-xl transition-all duration-300 ${isFocused ? "shadow-[0_0_20px_rgba(255,193,7,0.08)]" : ""
                                    }`}
                            >
                                {/* Animated border */}
                                <div
                                    className={`absolute -inset-px rounded-xl transition-opacity duration-300 ${isFocused ? "opacity-100" : "opacity-0"
                                        }`}
                                    style={{
                                        background: "linear-gradient(135deg, rgba(255,193,7,0.3), rgba(255,193,7,0.05), rgba(255,193,7,0.2))",
                                    }}
                                />
                                <div className="relative flex bg-surface-2/60 backdrop-blur-sm rounded-xl border border-white/[0.06] overflow-hidden">
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setIsFocused(true)}
                                        onBlur={() => setIsFocused(false)}
                                        className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-white/25 outline-none"
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-3 bg-yellow-400 hover:bg-yellow-300 text-surface-0 font-semibold text-sm transition-all duration-200 flex items-center gap-1.5 hover:shadow-[0_0_16px_rgba(255,193,7,0.2)]"
                                    >
                                        <Send size={14} />
                                        Subscribe
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Link grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-14">
                    {footerLinks.map((group) => (
                        <div key={group.title}>
                            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-[0.2em] mb-4">
                                {group.title}
                            </h4>
                            <ul className="space-y-2.5">
                                {group.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-white/30 hover:text-yellow-400/80 transition-colors duration-200 relative group/link inline-block"
                                        >
                                            {link.label}
                                            <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-yellow-400/30 scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300 origin-left" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/[0.04] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-white/20 flex items-center gap-1.5">
                        © {new Date().getFullYear()} CODE BUD. Made with
                        <Heart size={11} className="text-red-400/60 fill-red-400/60" />
                        for developers.
                    </p>

                    {/* Back to top */}
                    <button
                        onClick={scrollToTop}
                        className="group flex items-center gap-2 text-xs text-white/20 hover:text-yellow-400/60 transition-colors duration-200"
                    >
                        Back to top
                        <div className="w-7 h-7 rounded-lg border border-white/[0.06] flex items-center justify-center group-hover:border-yellow-400/20 group-hover:bg-yellow-400/[0.05] transition-all duration-300">
                            <ArrowUp size={12} className="group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                    </button>
                </div>
            </div>
        </footer>
    );
};
