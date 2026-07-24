"use client";

import React from "react";
import { motion } from "motion/react";
import {
    Globe,
    BookOpen,
    Rocket,
    MapPin,
    ArrowRight,
    Building2,
    Users,
    Heart,
    Zap,
} from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { Button } from "@/components/ui/button";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Perks ── */
const perks = [
    {
        icon: Globe,
        title: "Remote-First",
        description: "Work from anywhere in the world. We're a distributed team that values async communication, flexibility, and trust.",
        gradient: "from-muted to-muted",
    },
    {
        icon: BookOpen,
        title: "Learning Budget",
        description: "₹50,000/year for conferences, courses, books, and tools. We invest in your growth as much as ours.",
        gradient: "from-primary/20 to-primary/10",
    },
    {
        icon: Rocket,
        title: "Impact at Scale",
        description: "Your work directly impacts 10,000+ learners globally. Ship features that change how people learn to code.",
        gradient: "from-muted to-muted",
    },
];

/* ── Open positions (placeholder) ── */
const positions = [
    {
        title: "Senior Full-Stack Engineer",
        department: "Engineering",
        location: "Remote",
        type: "Full-time",
        description: "Build and scale our learning platform with React, Node.js, and PostgreSQL.",
        departmentIcon: Zap,
    },
    {
        title: "AI / ML Engineer",
        department: "Engineering",
        location: "Remote",
        type: "Full-time",
        description: "Design and deploy AI models for personalised learning paths and code review.",
        departmentIcon: Zap,
    },
    {
        title: "Product Designer",
        department: "Design",
        location: "Remote / Bangalore",
        type: "Full-time",
        description: "Craft beautiful, intuitive interfaces that make learning feel effortless.",
        departmentIcon: Heart,
    },
    {
        title: "Curriculum Developer",
        department: "Education",
        location: "Remote",
        type: "Contract",
        description: "Create world-class coding courses — from beginner to advanced — across web and data science.",
        departmentIcon: BookOpen,
    },
    {
        title: "Community Manager",
        department: "Community",
        location: "Remote",
        type: "Full-time",
        description: "Grow and nurture our vibrant community of developers across Discord, GitHub, and social channels.",
        departmentIcon: Users,
    },
];

/* ── Department badge colors ── */
const deptColors: Record<string, string> = {
    Engineering: "border-border text-muted-foreground bg-muted",
    Design: "border-border text-muted-foreground bg-muted",
    Education: "border-primary/30 text-primary/80 bg-primary/[0.06]",
    Community: "border-border text-foreground bg-muted",
};

/* ── Page ── */
export function CareersPage() {
    return (
        <PageLayout
            badge="Careers"
            title={
                <>
                    Build the future{" "}
                    <span className="text-primary">with us</span>
                </>
            }
            subtitle="We're looking for passionate engineers, designers, and educators who want to shape the next generation of coding education."
        >
            {/* ── Why MYCODEBUD ── */}
            <section className="py-24 relative overflow-hidden bg-background">

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease }}
                        className="text-center mb-14"
                    >
                        <h2 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                            Why join MYCODEBUD?
                        </h2>
                        <p className="text-muted-foreground max-w-lg mx-auto">
                            We believe great work happens when you&apos;re empowered, supported, and inspired.
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-3 gap-5">
                        {perks.map((perk, i) => (
                            <motion.div
                                key={perk.title}
                                initial={{ opacity: 0, y: 25, filter: "blur(6px)" }}
                                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08, duration: 0.6, ease }}
                                className="group relative rounded-xl border border-border bg-card backdrop-blur-sm p-7 hover:border-primary/15 transition-colors duration-500 hover:-translate-y-1"
                            >
                                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                    style={{
                                        background: "radial-gradient(ellipse at top, transparent 0%, transparent 60%)",
                                    }}
                                />
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${perk.gradient} flex items-center justify-center mb-5`}>
                                    <perk.icon size={22} className="text-foreground" />
                                </div>
                                <h3 className="font-semibold text-foreground mb-2 text-lg">{perk.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{perk.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>


            {/* ── Open Positions ── */}
            <section className="py-24 relative overflow-hidden bg-background">
                <div className="max-w-4xl mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease }}
                        className="text-center mb-14"
                    >
                        <h2 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                            Open positions
                        </h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Don&apos;t see a match? Send your resume to{" "}
                            <a href="mailto:careers@codebud.dev" className="text-primary/70 hover:text-primary transition-colors">
                                careers@codebud.dev
                            </a>
                        </p>
                    </motion.div>

                    <div className="space-y-4">
                        {positions.map((pos, i) => (
                            <motion.div
                                key={pos.title}
                                initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.06, duration: 0.5, ease }}
                                className="group relative rounded-xl border border-border bg-card backdrop-blur-sm p-6 hover:border-primary/15 transition-colors duration-500"
                            >
                                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                    style={{
                                        background: "radial-gradient(ellipse at top left, transparent 0%, transparent 50%)",
                                    }}
                                />
                                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-body font-semibold text-foreground group-hover:text-primary/90 transition-colors duration-300">
                                                {pos.title}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-3">{pos.description}</p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${deptColors[pos.department] || "border-border text-muted-foreground bg-muted"}`}>
                                                <Building2 size={9} />
                                                {pos.department}
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border border-border text-muted-foreground bg-muted">
                                                <MapPin size={9} />
                                                {pos.location}
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border border-border text-muted-foreground bg-muted">
                                                {pos.type}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="sm:self-center inline-flex items-center gap-1.5 text-sm font-semibold text-primary/70 hover:text-primary transition-colors group/btn">
                                        Apply
                                        <ArrowRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>


            {/* ── Culture CTA ── */}
            <section className="py-24 relative overflow-hidden bg-background">
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full pointer-events-none"
                    style={{
                        background: "radial-gradient(ellipse, transparent 0%, transparent 60%)",
                    }}
                />
                <div className="max-w-2xl mx-auto px-6 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease }}
                    >
                        <h2 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                            Ready to make an <span className="text-primary">impact?</span>
                        </h2>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            At MYCODEBUD, every line of code you write helps someone learn something new. Join a team that&apos;s changing education, one commit at a time.
                        </p>
                        <Button
                            variant="default"
                            size="lg"
                            className="px-10 group"
                        >
                            View All Openings
                            <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                    </motion.div>
                </div>
            </section>
        </PageLayout>
    );
}
