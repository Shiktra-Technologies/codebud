"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
    Lightbulb,
    Users,
    Shield,
    Sparkles,
    Target,
    Heart,
    Globe,
    Code2,
} from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { HexDivider } from "../components/ui/hex-divider";
import { FloatingHex } from "../components/ui/floating-hex";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Values ── */
const values = [
    {
        icon: Lightbulb,
        title: "Innovation First",
        description:
            "We constantly push the boundaries of interactive education with AI-powered feedback, real-time collaboration, and cutting-edge curriculum.",
        gradient: "from-amber-500/20 to-yellow-500/10",
    },
    {
        icon: Users,
        title: "Community Driven",
        description:
            "Learning is better together. Our vibrant community of 10,000+ developers supports, mentors, and inspires each other every day.",
        gradient: "from-cyan-500/20 to-blue-500/10",
    },
    {
        icon: Shield,
        title: "Quality Obsessed",
        description:
            "Every course is crafted by industry veterans, peer-reviewed, and continuously updated to reflect real-world best practices.",
        gradient: "from-emerald-500/20 to-teal-500/10",
    },
    {
        icon: Sparkles,
        title: "Accessible to All",
        description:
            "From absolute beginners to seasoned pros, MYCODEBUD meets you where you are with adaptive learning paths and flexible pricing.",
        gradient: "from-violet-500/20 to-purple-500/10",
    },
];

/* ── Team ── */
const team = [
    {
        name: "Aman Rao",
        role: "Founder & CEO",
        initials: "AR",
        gradient: "from-amber-500 to-orange-600",
    },
    {
        name: "Priya Sharma",
        role: "Head of Engineering",
        initials: "PS",
        gradient: "from-violet-500 to-purple-600",
    },
    {
        name: "Aiden Mitchell",
        role: "Lead Curriculum Designer",
        initials: "AM",
        gradient: "from-cyan-400 to-blue-500",
    },
    {
        name: "Sarah Chen",
        role: "Head of Community",
        initials: "SC",
        gradient: "from-emerald-400 to-teal-500",
    },
    {
        name: "Ravi Patel",
        role: "AI & ML Lead",
        initials: "RP",
        gradient: "from-rose-500 to-pink-600",
    },
    {
        name: "Maya Johnson",
        role: "Head of Design",
        initials: "MJ",
        gradient: "from-sky-400 to-indigo-500",
    },
];

/* ── Metrics ── */
const metrics = [
    { label: "Active Students", value: 10000, suffix: "+", icon: Users },
    { label: "Courses Published", value: 85, suffix: "+", icon: Code2 },
    { label: "Countries Reached", value: 120, suffix: "+", icon: Globe },
    { label: "Completion Rate", value: 94, suffix: "%", icon: Target },
];

/* ── Animated Counter ── */
function AnimatedCounter({
    value,
    suffix,
    duration = 2,
}: {
    value: number;
    suffix: string;
    duration?: number;
}) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    const start = performance.now();
                    const animate = (now: number) => {
                        const progress = Math.min((now - start) / (duration * 1000), 1);
                        const eased = 1 - Math.pow(1 - progress, 3);
                        setCount(Math.floor(eased * value));
                        if (progress < 1) requestAnimationFrame(animate);
                    };
                    requestAnimationFrame(animate);
                }
            },
            { threshold: 0.5 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [value, duration]);

    return (
        <span ref={ref}>
            {count.toLocaleString()}
            {suffix}
        </span>
    );
}

/* ── Page ── */
export function AboutPage() {
    return (
        <PageLayout
            badge="Our Story"
            title={
                <>
                    Building the future of
                    <br />
                    <span className="text-shimmer">coding education</span>
                </>
            }
            subtitle="We believe everyone deserves access to world-class coding education. MYCODEBUD is on a mission to empower the next generation of developers."
        >
            {/* ── Our Story ── */}
            <section className="py-24 relative overflow-hidden bg-surface-0">
                <div className="absolute inset-0 honeycomb-bg opacity-10 pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        {/* Text */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, ease }}
                        >
                            <h2 className="text-2xl md:text-4xl font-bold text-white mb-6 tracking-tight">
                                From a dorm room idea to a{" "}
                                <span className="text-yellow-400">global platform</span>
                            </h2>
                            <div className="space-y-4 text-white/40 leading-relaxed text-[15px]">
                                <p>
                                    MYCODEBUD started in 2023 when our founder, frustrated with fragmented
                                    learning resources, envisioned a single platform that combines
                                    interactive lessons, real-world projects, and AI-powered feedback.
                                </p>
                                <p>
                                    What began as a weekend project quickly grew into a movement.
                                    Thousands of students from over 120 countries now use MYCODEBUD
                                    to learn full-stack development, data science, and more — with a
                                    94% course completion rate that&apos;s unheard of in online education.
                                </p>
                                <p>
                                    Today, we&apos;re backed by a passionate team of engineers, educators,
                                    and designers who share one obsession: making coding education so
                                    good, so engaging, that dropping out simply isn&apos;t an option.
                                </p>
                            </div>
                        </motion.div>

                        {/* Visual Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.1, ease }}
                            className="relative"
                        >
                            <div className="relative rounded-2xl border border-white/[0.06] bg-surface-2/40 backdrop-blur-sm p-8 overflow-hidden">
                                {/* Glow */}
                                <div
                                    className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
                                    style={{
                                        background:
                                            "radial-gradient(circle, rgba(255,193,7,0.08) 0%, transparent 60%)",
                                    }}
                                />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center">
                                            <Heart size={20} className="text-yellow-400" />
                                        </div>
                                        <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                                            Our Mission
                                        </span>
                                    </div>
                                    <p className="text-xl md:text-2xl font-bold text-white leading-snug mb-4">
                                        &quot;Make coding education so interactive and engaging that anyone
                                        can go from zero to shipping real products.&quot;
                                    </p>
                                    <p className="text-sm text-white/30">
                                        — The MYCODEBUD Founding Team
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <HexDivider />

            {/* ── Core Values ── */}
            <section className="py-24 relative overflow-hidden bg-surface-0">
                <div className="absolute inset-0 honeycomb-bg-lg opacity-10 pointer-events-none" />
                <FloatingHex size={40} x="5%" y="30%" delay={0.2} opacity={0.04} rotation={10} />
                <FloatingHex size={32} x="90%" y="60%" delay={0.6} opacity={0.03} rotation={-15} />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight mb-4">
                            What drives us
                        </h2>
                        <p className="text-white/35 max-w-lg mx-auto">
                            Four principles that shape every decision we make.
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {values.map((v, i) => (
                            <motion.div
                                key={v.title}
                                initial={{ opacity: 0, y: 25, filter: "blur(6px)" }}
                                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08, duration: 0.6, ease }}
                                className="group relative rounded-2xl border border-white/[0.06] bg-surface-2/30 backdrop-blur-sm p-6 hover:border-yellow-400/15 transition-all duration-500 hover:-translate-y-1"
                            >
                                {/* Hover glow */}
                                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                    style={{
                                        background: "radial-gradient(ellipse at top, rgba(255,193,7,0.04) 0%, transparent 60%)",
                                    }}
                                />
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${v.gradient} flex items-center justify-center mb-4`}>
                                    <v.icon size={20} className="text-white" />
                                </div>
                                <h3 className="font-semibold text-white mb-2">{v.title}</h3>
                                <p className="text-sm text-white/30 leading-relaxed">{v.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <HexDivider />

            {/* ── Team ── */}
            <section className="py-24 relative overflow-hidden bg-surface-0">
                <div className="absolute inset-0 honeycomb-bg opacity-10 pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight mb-4">
                            Meet the team
                        </h2>
                        <p className="text-white/35 max-w-lg mx-auto">
                            Passionate builders, educators, and dreamers.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                        {team.map((member, i) => (
                            <motion.div
                                key={member.name}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.06, duration: 0.5, ease }}
                                className="group text-center"
                            >
                                <div className="relative mx-auto w-20 h-20 mb-3">
                                    <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${member.gradient} flex items-center justify-center text-xl font-bold text-white group-hover:scale-105 group-hover:shadow-lg transition-all duration-300`}>
                                        {member.initials}
                                    </div>
                                    {/* Ring on hover */}
                                    <div className="absolute -inset-1 rounded-2xl border border-yellow-400/0 group-hover:border-yellow-400/20 transition-all duration-300" />
                                </div>
                                <h4 className="text-sm font-semibold text-white mb-0.5">{member.name}</h4>
                                <p className="text-xs text-white/30">{member.role}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <HexDivider />

            {/* ── Metrics ── */}
            <section className="py-24 relative overflow-hidden bg-surface-0">
                <div className="absolute inset-0 honeycomb-bg opacity-15 pointer-events-none" />
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] rounded-full pointer-events-none"
                    style={{
                        background: "radial-gradient(ellipse, rgba(255,193,7,0.04) 0%, transparent 60%)",
                    }}
                />
                <div className="max-w-5xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {metrics.map((m, i) => (
                            <motion.div
                                key={m.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5, ease }}
                                className="text-center group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-yellow-400/[0.06] border border-yellow-400/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-400/10 transition-colors duration-300">
                                    <m.icon size={20} className="text-yellow-400/70" />
                                </div>
                                <div className="text-3xl md:text-4xl font-extrabold text-white mb-1">
                                    <AnimatedCounter value={m.value} suffix={m.suffix} />
                                </div>
                                <p className="text-sm text-white/30">{m.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </PageLayout>
    );
}
