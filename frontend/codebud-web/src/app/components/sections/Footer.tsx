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
            { label: "Roadmap", href: "#" },
            { label: "Changelog", href: "#" },
        ],
    },
    {
        title: "Company",
        links: [
            { label: "About", href: "/about" },
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
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || status === "sending") return;

        setStatus("sending");
        setError("");

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, topic: "newsletter" }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.error ?? "Could not sign you up. Please try again.");
                setStatus("error");
                return;
            }

            setEmail("");
            setStatus("sent");
        } catch {
            setError("Network error. Please try again.");
            setStatus("error");
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
                            {/* decorative — the MYCODEBUD wordmark beside it carries the name */}
                            <img
                                src="/logo/logo.png"
                                alt=""
                                className="w-8 h-8 rounded-lg object-contain shrink-0"
                            />
                            <span className="text-lg font-bold text-primary tracking-tight">MYCODEBUD</span>
                        </a>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                            A career and capability-building ecosystem for engineering students — guidance, mentorship, projects, DSA, hackathons and placement support.
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
                        <p className="text-sm text-muted-foreground mb-4">Ecosystem updates, hackathon calls and new project briefs.</p>
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
                                        disabled={status === "sending"}
                                        className="px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all duration-200 flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <Send size={14} />
                                        {status === "sending" ? "Sending…" : "Subscribe"}
                                    </button>
                                </div>
                            </div>

                            <p
                                role="status"
                                aria-live="polite"
                                className={`mt-2 text-xs ${status === "error" ? "text-destructive" : "text-primary/80"}`}
                            >
                                {status === "sent" && "You're on the list."}
                                {status === "error" && error}
                            </p>
                        </form>
                    </div>
                </div>

                {/* Link grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-14">
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
                        © {new Date().getFullYear()} Shiktra Technologies LLP. Made with
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
