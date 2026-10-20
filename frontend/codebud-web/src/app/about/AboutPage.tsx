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
    Code2,
} from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { Tilt3D } from "@/components/Tilt3D";
import { HexCluster } from "@/components/HexCluster";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Values ── */
const values = [
    {
        icon: Target,
        title: "Proof Over Paperwork",
        description:
            "A certificate says you showed up. A project proves you can build. Everything here is designed to produce something a student can point to.",
        gradient: "from-primary/20 to-primary/10",
    },
    {
        icon: Users,
        title: "Practitioners, Not Lecturers",
        description:
            "Mentors who have shipped code and sat on the other side of the interview table — across product companies, IT services, consulting and academia.",
        gradient: "from-muted to-muted",
    },
    {
        icon: Lightbulb,
        title: "Novelty-First Briefs",
        description:
            "Never the same copied project every batch turns in. Every brief is written to be defensible in an interview, with mentor code reviews at each stage.",
        gradient: "from-muted to-muted",
    },
    {
        icon: Sparkles,
        title: "Affordable By Design",
        description:
            "The full ecosystem at ₹99 a month — no separate paywalls for mentorship, projects or interview prep. Cost is never the reason a student sits out.",
        gradient: "from-muted to-muted",
    },
];

/* ── Team ── */
const team = [
    {
        name: "Rohan Gowda",
        role: "Founder & CEO",
        initials: "RG",
        gradient: "from-primary to-muted",
    },
    {
        name: "Aman Rao M",
        role: "Co-founder & CTO",
        initials: "AR",
        gradient: "from-primary to-muted",
    },
    {
        name: "Nikhil Bajantri",
        role: "Development Lead",
        initials: "NB",
        gradient: "from-muted to-muted",
    },
    {
        name: "Bimal P B",
        role: "Full Stack Developer",
        initials: "BP",
        gradient: "from-muted to-muted",
    },
    {
        name: "B Vibha",
        role: "Full Stack Developer",
        initials: "BV",
        gradient: "from-muted to-muted",
    },
];

/* ── Metrics ── */
const metrics = [
    { label: "DSA Catalogue", value: 3000, suffix: "+", icon: Code2 },
    { label: "Aptitude Catalogue", value: 50000, suffix: "+", icon: Target },
    { label: "Courses Published", value: 85, suffix: "+", icon: Sparkles },
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
                    <span className="text-primary">coding education</span>
                </>
            }
            subtitle="Students should graduate with proof of what they can do, not just a stack of certificates. MYCODEBUD is built to close the distance between college, skills, practical experience and employability."
        >
            {/* ── Our Story ── */}
            <section className="py-24 relative overflow-hidden bg-background">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        {/* Text */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, ease }}
                        >
                            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-6 tracking-tight">
                                From one shared idea to an{" "}
                                <span className="text-primary">ecosystem</span>
                            </h2>
                            <div className="space-y-4 text-muted-foreground leading-relaxed text-[15px]">
                                <p>
                                    MYCODEBUD started in 2025. Our founder shared the idea with our
                                    co-founder, who began building the first version alone — a single
                                    platform combining interactive lessons, real-world projects, and
                                    AI-powered feedback instead of scattered learning resources.
                                </p>
                                <p>
                                    As the platform took shape, more people joined. What began as one
                                    developer&apos;s side project became a small team building a DSA and
                                    aptitude catalogue deep enough to take someone from fundamentals
                                    all the way to interview-ready.
                                </p>
                                <p>
                                    MYCODEBUD is a subsidiary of Shiktra Technologies LLP, operating as
                                    a Udyam Registered, VTU Registered initiative recognised by the
                                    Govt. of Karnataka through K-TECH and the New Age Innovation
                                    Network — connecting students, colleges and companies inside one
                                    ecosystem.
                                </p>
                                <p>
                                    Every layer of it — guidance, mentorship, projects, DSA, interview
                                    preparation and hackathons — exists to produce something a student
                                    can point to and say, &quot;I built this.&quot;
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
                            <div className="relative rounded-xl border border-border bg-card backdrop-blur-sm p-8 overflow-hidden">
                                {/* Glow */}
                                <div
                                    className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
                                    style={{
                                        background:
                                            "radial-gradient(circle, transparent 0%, transparent 60%)",
                                    }}
                                />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <Heart size={20} className="text-primary" />
                                        </div>
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                            Our Mission
                                        </span>
                                    </div>
                                    <p className="text-xl md:text-2xl font-bold text-foreground leading-snug mb-4">
                                        &quot;Make coding education so interactive and engaging that anyone
                                        can go from zero to shipping real products.&quot;
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        — The MYCODEBUD Founding Team
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>


            {/* ── Core Values ── */}
            <section className="py-24 relative overflow-hidden bg-background">

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                            What drives us
                        </h2>
                        <p className="text-muted-foreground max-w-lg mx-auto">
                            The principles the whole ecosystem is built on.
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
                            >
                                <Tilt3D
                                    stageClassName="h-full"
                                    className="group h-full rounded-xl border border-border bg-card backdrop-blur-sm p-6 hover:border-primary/15"
                                >
                                    <div className="hex-stack w-12 h-12 mb-4 tilt-layer-1">
                                        <div className="hex-badge w-full h-full text-primary/80">
                                            <v.icon size={19} strokeWidth={1.5} />
                                        </div>
                                    </div>
                                    <div className="tilt-layer-2">
                                        <h3 className="text-body font-semibold text-foreground mb-2">{v.title}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
                                    </div>
                                </Tilt3D>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>


            {/* ── Team ── */}
            <section className="py-24 relative overflow-hidden bg-background">
                <HexCluster />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                            Meet the team
                        </h2>
                        <p className="text-muted-foreground max-w-lg mx-auto">
                            The people building MyCodeBud.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
                        {team.map((member, i) => (
                            <motion.div
                                key={member.name}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.06, duration: 0.5, ease }}
                                className="group text-center"
                            >
                                <div className="hex-stack relative mx-auto w-20 h-20 mb-3 group-hover:scale-105 transition-transform duration-300">
                                    <div className="hex-badge w-full h-full text-xl font-bold text-foreground">
                                        {member.initials}
                                    </div>
                                </div>
                                <h4 className="text-sm font-semibold text-foreground mb-0.5">{member.name}</h4>
                                <p className="text-xs text-muted-foreground">{member.role}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>


            {/* ── Metrics ── */}
            <section className="py-24 relative overflow-hidden bg-background">
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] rounded-full pointer-events-none"
                    style={{
                        background: "radial-gradient(ellipse, transparent 0%, transparent 60%)",
                    }}
                />
                <div className="max-w-5xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {metrics.map((m, i) => (
                            <motion.div
                                key={m.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5, ease }}
                                className="text-center group"
                            >
                                <div className="hex-stack w-12 h-12 mx-auto mb-4">
                                    <div className="hex-badge w-full h-full text-primary/70">
                                        <m.icon size={20} />
                                    </div>
                                </div>
                                <div className="text-3xl md:text-4xl font-extrabold text-foreground mb-1">
                                    <AnimatedCounter value={m.value} suffix={m.suffix} />
                                </div>
                                <p className="text-sm text-muted-foreground">{m.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </PageLayout>
    );
}
