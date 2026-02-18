"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Check, Zap, Crown, Users } from "lucide-react";

import { SectionBadge } from "../ui/section-badge";
import { Button } from "../ui/button";

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
        variant: "brandOutline" as const,
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
        variant: "brand" as const,
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
        variant: "brandOutline" as const,
        popular: false,
    },
];

export const Pricing = () => {
    const [isYearly, setIsYearly] = useState(false);

    return (
        <section id="pricing" className="py-28 bg-surface-0 overflow-hidden relative">
            <div className="absolute inset-0 honeycomb-bg-lg opacity-20 pointer-events-none" />

            {/* Spotlight */}
            <div
                className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse, rgba(255,193,7,0.04) 0%, transparent 60%)",
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
                        className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-5 text-white tracking-tight"
                    >
                        Simple, <span className="text-shimmer">transparent</span> pricing
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, duration: 0.5, ease }}
                        className="text-white/40 text-base md:text-lg max-w-md mx-auto leading-relaxed mb-8"
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
                        <span className={`text-sm font-medium transition-colors duration-200 ${!isYearly ? "text-white" : "text-white/40"}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setIsYearly(!isYearly)}
                            className="relative w-14 h-7 rounded-full bg-surface-2/80 border border-white/[0.06] transition-colors duration-300 hover:border-yellow-400/20"
                        >
                            <motion.div
                                className="absolute top-1 w-5 h-5 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(255,193,7,0.3)]"
                                animate={{ left: isYearly ? 30 : 4 }}
                                transition={{ duration: 0.3, ease }}
                            />
                        </button>
                        <span className={`text-sm font-medium transition-colors duration-200 ${isYearly ? "text-white" : "text-white/40"}`}>
                            Yearly
                        </span>
                        {isYearly && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider"
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
                                    className="absolute -inset-px rounded-2xl z-0"
                                    style={{
                                        background: "linear-gradient(135deg, rgba(255,193,7,0.3) 0%, rgba(255,193,7,0.05) 40%, rgba(255,193,7,0.05) 60%, rgba(255,193,7,0.2) 100%)",
                                    }}
                                />
                            )}

                            <div className={`relative h-full bg-surface-2/40 backdrop-blur-sm border rounded-2xl p-7 transition-all duration-500 hover:shadow-[0_12px_48px_rgba(255,193,7,0.08)] overflow-hidden ${plan.popular
                                    ? "border-yellow-400/20 bg-surface-2/60"
                                    : "border-white/[0.04] hover:border-yellow-400/10"
                                }`}>
                                {/* Popular badge */}
                                {plan.popular && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <span className="text-[10px] font-bold text-surface-0 bg-yellow-400 px-4 py-1 rounded-full uppercase tracking-wider shadow-[0_0_20px_rgba(255,193,7,0.3)]">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                {/* Gradient top border on hover */}
                                <div
                                    className="absolute top-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    style={{
                                        background: "linear-gradient(90deg, transparent, rgba(255,193,7,0.3), transparent)",
                                    }}
                                />

                                {/* Plan icon */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 ${plan.popular
                                        ? "bg-yellow-400/15 text-yellow-400"
                                        : "bg-white/[0.04] text-white/50 group-hover:text-yellow-400/70 group-hover:bg-yellow-400/[0.06]"
                                    }`}>
                                    <plan.icon size={20} />
                                </div>

                                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                                <p className="text-sm text-white/35 mb-5">{plan.description}</p>

                                {/* Price */}
                                <div className="mb-6">
                                    <motion.span
                                        key={isYearly ? "yearly" : "monthly"}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className={`text-4xl font-extrabold ${plan.popular ? "text-shimmer" : "text-white"}`}
                                    >
                                        {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                                    </motion.span>
                                    {plan.period && (
                                        <span className="text-sm text-white/30 font-medium ml-1">{plan.period}</span>
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
                                            className="flex items-center gap-2.5 text-sm text-white/50"
                                        >
                                            <Check size={14} className={`flex-shrink-0 ${plan.popular ? "text-yellow-400" : "text-white/30"}`} />
                                            {feature}
                                        </motion.li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <Button
                                    variant={plan.variant}
                                    size="lg"
                                    className={`w-full ${plan.popular ? "shadow-[0_0_20px_rgba(255,193,7,0.15)]" : ""}`}
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
