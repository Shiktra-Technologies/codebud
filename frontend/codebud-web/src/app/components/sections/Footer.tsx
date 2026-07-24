"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Github, Twitter, MessageCircle, Send, ArrowUp, Heart } from "lucide-react";


const socialLinks = [
    { icon: Github, href: "#", label: "GitHub", hoverColor: "hover:text-foreground hover:bg-muted" },
    { icon: Twitter, href: "#", label: "Twitter", hoverColor: "hover:text-muted-foreground hover:bg-muted" },
    { icon: MessageCircle, href: "#", label: "Discord", hoverColor: "hover:text-muted-foreground hover:bg-muted" },
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
        <footer className="relative overflow-hidden">
            {/* Top divider */}
            <div className="relative">
            </div>


            {/* Ambient spotlight */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse, transparent 0%, transparent 60%)",
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-8">
                {/* Top section: brand + newsletter */}
                <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-14">
                    {/* Brand */}
                    <div className="max-w-sm">
                        <a href="/" className="flex items-center gap-2.5 mb-4 group">
                            <div className="relative w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:overflow-hidden transition-shadow duration-300">
                                <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" className="w-4.5 h-4.5">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <span className="text-lg font-bold text-primary tracking-tight">MYCODEBUD</span>
                        </a>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                            The modern platform for learning to code. Interactive lessons, real projects, AI feedback, and a thriving community.
                        </p>

                        {/* Social icons */}
                        <div className="flex gap-2">
                            {socialLinks.map((s) => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    aria-label={s.label}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground border border-border transition-all duration-300 hover:scale-110 hover:border-border ${s.hoverColor}`}
                                >
                                    <s.icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div className="w-full max-w-md">
                        <h3 className="text-sm font-semibold text-foreground mb-2">Stay in the loop</h3>
                        <p className="text-sm text-muted-foreground mb-4">Get weekly coding tips and platform updates.</p>
                        <form onSubmit={handleSubmit} className="relative">
                            <div
                                className={`relative rounded-xl transition-all duration-300 ${isFocused ? "" : ""
                                    }`}
                            >
                                {/* Animated border */}
                                <div
                                    className={`absolute -inset-px rounded-xl transition-opacity duration-300 ${isFocused ? "opacity-100" : "opacity-0"
                                        }`}
                                    style={{
                                        background: "linear-gradient(135deg, transparent, transparent, transparent)",
                                    }}
                                />
                                <div className="relative flex bg-card backdrop-blur-sm rounded-xl border border-border overflow-hidden">
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setIsFocused(true)}
                                        onBlur={() => setIsFocused(false)}
                                        className="flex-1 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all duration-200 flex items-center gap-1.5 hover:"
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
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-4">
                                {group.title}
                            </h4>
                            <ul className="space-y-2.5">
                                {group.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-primary/80 transition-colors duration-200 relative group/link inline-block"
                                        >
                                            {link.label}
                                            <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-primary/30 scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300 origin-left" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
                        © {new Date().getFullYear()} MYCODEBUD. Made with
                        <Heart size={11} className="text-destructive/60 fill-destructive/60" />
                        for developers.
                    </p>

                    {/* Back to top */}
                    <button
                        onClick={scrollToTop}
                        className="group flex items-center gap-2 text-xs text-muted-foreground/70 hover:text-primary/60 transition-colors duration-200"
                    >
                        Back to top
                        <div className="w-7 h-7 rounded-lg border border-border flex items-center justify-center group-hover:border-primary/20 group-hover:bg-primary/[0.05] transition-all duration-300">
                            <ArrowUp size={12} className="group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                    </button>
                </div>
            </div>
        </footer>
    );
};
