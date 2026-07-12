"use client";

import React from "react";
import { motion } from "motion/react";
import { Star } from "lucide-react";

import { SectionBadge } from "../ui/section-badge";

const testimonials = [
    {
        name: "Priya Sharma",
        role: "Full-Stack Developer @ Razorpay",
        avatar: "PS",
        color: "from-violet-500 to-purple-600",
        rating: 5,
        quote:
            "MYCODEBUD took me from writing my first HTML tag to deploying production apps in 8 months. The structured paths and real projects made all the difference.",
    },
    {
        name: "Arjun Mehta",
        role: "CS Student, IIT Delhi",
        avatar: "AM",
        color: "from-cyan-400 to-blue-500",
        rating: 5,
        quote:
            "The AI-powered feedback is insanely good. It's like having a senior engineer review your code 24/7. I've improved faster than I ever thought possible.",
    },
    {
        name: "Sarah Chen",
        role: "Career Switcher → SWE @ Google",
        avatar: "SC",
        color: "from-emerald-400 to-teal-500",
        rating: 5,
        quote:
            "I was a marketing manager. MYCODEBUD's career launchpad helped me land my first dev role. The mock interviews were surprisingly realistic.",
    },
    {
        name: "Rahul Patel",
        role: "Freelance Developer",
        avatar: "RP",
        color: "from-amber-500 to-orange-500",
        rating: 5,
        quote:
            "The peer community is what sets MYCODEBUD apart. Working on team projects with other learners taught me more than any solo course ever could.",
    },
    {
        name: "Ananya Gupta",
        role: "Frontend Engineer @ Flipkart",
        avatar: "AG",
        color: "from-rose-500 to-pink-500",
        rating: 5,
        quote:
            "I tried 5 other platforms before MYCODEBUD. None of them had this level of hands-on practice. The coding labs are genuinely addictive.",
    },
    {
        name: "Dev Krishnan",
        role: "Open Source Contributor",
        avatar: "DK",
        color: "from-yellow-400 to-amber-500",
        rating: 5,
        quote:
            "The certifications actually carry weight. I've had recruiters specifically mention my MYCODEBUD badges during interviews. Worth every minute.",
    },
    {
        name: "Meera Joshi",
        role: "Backend Dev @ Swiggy",
        avatar: "MJ",
        color: "from-indigo-400 to-violet-500",
        rating: 5,
        quote:
            "The Node.js and database courses are exceptional. Went from zero backend knowledge to building production APIs in just 4 months.",
    },
    {
        name: "Karthik Reddy",
        role: "Mobile Dev @ PhonePe",
        avatar: "KR",
        color: "from-teal-400 to-cyan-500",
        rating: 5,
        quote:
            "I love how MYCODEBUD combines theory with practice. Every concept has a hands-on project. It's the closest thing to learning on the job.",
    },
];

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Single testimonial card ── */
function TestimonialCard({ t }: { t: (typeof testimonials)[0] }) {
    return (
        <div className="group relative w-[340px] sm:w-[380px] flex-shrink-0 bg-surface-2/40 backdrop-blur-sm border border-white/[0.04] rounded-2xl p-6 mx-2 transition-all duration-500 hover:border-yellow-400/15 hover:bg-surface-2/60 hover:shadow-[0_8px_40px_rgba(255,193,7,0.06)]">
            {/* Gradient top border on hover */}
            <div
                className="absolute top-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,193,7,0.3), transparent)",
                }}
            />

            {/* Decorative gold quote */}
            <div className="absolute top-4 right-5 text-4xl font-serif text-yellow-400/[0.06] leading-none select-none">
                "
            </div>

            {/* Stars */}
            <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={13} className="fill-yellow-400 text-yellow-400" />
                ))}
            </div>

            {/* Quote */}
            <p className="text-white/50 text-sm leading-relaxed mb-5 group-hover:text-white/65 transition-colors duration-300">
                "{t.quote}"
            </p>

            {/* Author */}
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-transparent group-hover:ring-yellow-400/20 transition-all duration-300`}>
                    {t.avatar}
                </div>
                <div>
                    <div className="text-sm font-semibold text-white/80">{t.name}</div>
                    <div className="text-[11px] text-white/30">{t.role}</div>
                </div>
            </div>
        </div>
    );
}

/* ── Infinite marquee row ── */
function MarqueeRow({
    items,
    direction = "left",
    speed = 30,
}: {
    items: (typeof testimonials);
    direction?: "left" | "right";
    speed?: number;
}) {
    // Duplicate items for seamless loop
    const doubled = [...items, ...items];
    const distance = items.length * 396; // card width + gap

    return (
        <div className="relative overflow-hidden group/marquee">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-surface-0 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-surface-0 to-transparent z-10 pointer-events-none" />

            <motion.div
                className="flex will-change-transform"
                animate={{
                    x: direction === "left" ? [0, -distance] : [-distance, 0],
                }}
                transition={{
                    x: {
                        repeat: Infinity,
                        repeatType: "loop",
                        duration: speed,
                        ease: "linear",
                    },
                }}
                style={{
                    // Pause on hover
                }}
            >
                {doubled.map((t, i) => (
                    <TestimonialCard key={`${t.name}-${i}`} t={t} />
                ))}
            </motion.div>
        </div>
    );
}

export const Testimonials = () => {
    // Split into two rows
    const row1 = testimonials.slice(0, 4);
    const row2 = testimonials.slice(4);

    return (
        <section className="py-28 bg-surface-0 overflow-hidden relative">
            <div className="absolute inset-0 honeycomb-bg-lg opacity-20 pointer-events-none" />

            {/* Spotlight */}
            <div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[900px] h-[500px] rounded-full pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse, rgba(255,193,7,0.03) 0%, transparent 60%)",
                }}
            />

            {/* Section header */}
            <div className="max-w-7xl mx-auto px-6 relative z-10 text-center mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease }}
                    className="mb-5"
                >
                    <SectionBadge>Social Proof</SectionBadge>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05, duration: 0.6, ease }}
                    className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-5 text-white tracking-tight"
                >
                    Loved by{" "}
                    <span className="text-shimmer">10,000+ developers</span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1, duration: 0.5, ease }}
                    className="text-white/40 text-base md:text-lg max-w-lg mx-auto leading-relaxed"
                >
                    Don't just take our word for it — hear from students who transformed their careers with MYCODEBUD.
                </motion.p>
            </div>

            {/* Marquee rows */}
            <div className="space-y-4 relative z-10">
                <MarqueeRow items={row1} direction="left" speed={35} />
                <MarqueeRow items={row2} direction="right" speed={40} />
            </div>
        </section>
    );
};
