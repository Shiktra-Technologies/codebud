"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Check, Zap, Crown, Users } from "lucide-react";

import { SectionBadge } from "@/components/section-badge";
import { Button } from "@/components/ui/button";

const ease = [0.16, 1, 0.3, 1] as const;

const plans = [
    {
        name: "Starter",
        icon: Zap,
        monthlyPrice: "Free",
        yearlyPrice: "Free",
        period: "",
        description: "Perfect for exploring coding and getting started.",
        features: [
            "5 Beginner Courses",
            "Basic Coding Labs",
            "Community Access",
            "Progress Tracking",
            "Weekly Challenges",
        ],
        cta: "Start Free",
        variant: "outline" as const,
        popular: false,
    },
    {
        name: "Pro",
        icon: Crown,
        monthlyPrice: "₹499",
        yearlyPrice: "₹399",
        period: "/mo",
        description: "Full access to everything — learn without limits.",
        features: [
            "All 50+ Courses",
            "Advanced Coding Labs",
            "AI-Powered Feedback",
            "Certificates & Badges",
            "Priority Support",
            "Career Launchpad Access",
            "Mock Interviews",
        ],
        cta: "Go Pro",
        variant: "default" as const,
        popular: true,
    },
    {
        name: "Team",
        icon: Users,
        monthlyPrice: "₹1,499",
        yearlyPrice: "₹1,199",
        period: "/mo",
        description: "For coding bootcamps, schools, and teams.",
        features: [
            "Everything in Pro",
            "Team Progress Dashboard",
            "Custom Learning Paths",
            "Dedicated Account Manager",
            "Bulk Onboarding",
            "Admin Controls",
            "Invoice Billing",
        ],
        cta: "Contact Sales",
        variant: "outline" as const,
        popular: false,
    },
];

export const Pricing = () => {
    const [isYearly, setIsYearly] = useState(false);

    return (
        <section id="pricing" className="py-28 overflow-hidden relative">

            {/* Spotlight */}
            <div
                className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse, transparent 0%, transparent 60%)",
                }}
            />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease }}
                        className="mb-5"
                    >
                        <SectionBadge>Pricing</SectionBadge>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.05, duration: 0.6, ease }}
                        className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-5 text-foreground tracking-tight"
                    >
                        Simple, <span className="text-primary">transparent</span> pricing
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, duration: 0.5, ease }}
                        className="text-muted-foreground text-base md:text-lg max-w-md mx-auto leading-relaxed mb-8"
                    >
                        Start free. Upgrade when you're ready to unlock everything.
                    </motion.p>

                    {/* Toggle */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.15, duration: 0.5, ease }}
                        className="flex items-center justify-center gap-3"
                    >
                        <span className={`text-sm font-medium transition-colors duration-200 ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setIsYearly(!isYearly)}
                            className="relative w-14 h-7 rounded-full bg-card border border-border transition-colors duration-300 hover:border-primary/20"
                        >
                            <motion.div
                                className="absolute top-1 w-5 h-5 rounded-full bg-foreground"
                                animate={{ left: isYearly ? 30 : 4 }}
                                transition={{ duration: 0.3, ease }}
                            />
                        </button>
                        <span className={`text-sm font-medium transition-colors duration-200 ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
                            Yearly
                        </span>
                        {isYearly && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase tracking-wider"
                            >
                                Save 20%
                            </motion.span>
                        )}
                    </motion.div>
                </div>

                {/* Cards */}
                <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
                            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            viewport={{ once: true, margin: "-30px" }}
                            transition={{ delay: index * 0.1, duration: 0.6, ease }}
                            className={`group relative ${plan.popular ? "md:-mt-4 md:-mb-4" : ""}`}
                        >
                            {/* Animated glow for popular */}
                            {plan.popular && (
                                <div
                                    className="absolute -inset-px rounded-xl z-0"
                                    style={{
                                        background: "linear-gradient(135deg, transparent 0%, transparent 40%, transparent 60%, transparent 100%)",
                                    }}
                                />
                            )}

                            <div className={`relative h-full bg-card backdrop-blur-sm border rounded-xl p-7 transition-all duration-500 hover:overflow-hidden overflow-hidden ${plan.popular
                                    ? "surface-metallic border-border bg-card"
                                    : "border-border hover:border-primary/10"
                                }`}>
                                {/* Popular badge */}
                                {plan.popular && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <span className="text-[10px] font-bold text-secondary-foreground bg-secondary px-4 py-1 rounded-full uppercase tracking-wider">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                {/* Gradient top border on hover */}
                                <div
                                    className="absolute top-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    style={{
                                        background: "linear-gradient(90deg, transparent, transparent, transparent)",
                                    }}
                                />

                                {/* Plan icon */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 ${plan.popular
                                        ? "bg-muted text-muted-foreground"
                                        : "bg-muted text-muted-foreground group-hover:text-primary/70 group-hover:bg-primary/[0.06]"
                                    }`}>
                                    <plan.icon size={20} />
                                </div>

                                <h3 className="text-lg font-bold text-foreground mb-1">{plan.name}</h3>
                                <p className="text-sm text-muted-foreground mb-5">{plan.description}</p>

                                {/* Price */}
                                <div className="mb-6">
                                    <motion.span
                                        key={isYearly ? "yearly" : "monthly"}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className={`text-4xl font-extrabold ${"text-foreground"}`}
                                    >
                                        {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                                    </motion.span>
                                    {plan.period && (
                                        <span className="text-sm text-muted-foreground font-medium ml-1">{plan.period}</span>
                                    )}
                                </div>

                                {/* Features */}
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <motion.li
                                            key={feature}
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.3 + i * 0.05, duration: 0.4, ease }}
                                            className="flex items-center gap-2.5 text-sm text-muted-foreground"
                                        >
                                            <Check size={14} className={`flex-shrink-0 ${"text-muted-foreground"}`} />
                                            {feature}
                                        </motion.li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <Button
                                    variant={plan.variant}
                                    size="lg"
                                    className={`w-full ${plan.popular ? "" : ""}`}
                                >
                                    {plan.cta}
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
