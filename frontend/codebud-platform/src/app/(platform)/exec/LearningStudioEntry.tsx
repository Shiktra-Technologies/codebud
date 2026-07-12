"use client";

/**
 * Cinematic entry point from the legacy super-admin tab into the dedicated
 * Learning Studio workspace at /super-admin/learning-studio.
 *
 * The Studio is its own route — separate page, separate layout, separate URL
 * — so deep links, browser history, and SSR all behave correctly. This tile
 * just teases the experience and routes the admin there with a smooth motion
 * cue so it feels continuous rather than like a hard reload.
 */

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, Sparkles, LayoutList, Brain, Network } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const HIGHLIGHTS = [
    {
        icon: LayoutList,
        title: "Modular curriculum",
        body: "Block-based lessons, drag-drop modules, and clean versioning.",
    },
    {
        icon: Brain,
        title: "Intelligence metadata",
        body: "Structured interests, career goals, learning styles, target roles — feeding onboarding and recommendations.",
    },
    {
        icon: Network,
        title: "Skill graph",
        body: "Map each course onto the skill ontology that powers adaptive learning.",
    },
];

export default function LearningStudioEntry() {
    const router = useRouter();

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease }}
                className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-yellow-400/[0.06] via-surface-2/40 to-transparent p-8"
            >
                <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
                <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none opacity-50">
                    <div className="absolute top-1/2 right-10 -translate-y-1/2 w-72 h-72 rounded-full bg-yellow-400/10 blur-3xl" />
                </div>

                <div className="relative max-w-2xl">
                    <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-yellow-400/80 font-semibold">
                        <Sparkles size={11} />
                        Learning Studio
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                        The content intelligence operating system.
                    </h2>
                    <p className="mt-2 text-sm text-white/45 leading-relaxed">
                        Build courses as structured learning graphs — not lesson lists.
                        Every course you author feeds onboarding match, the recommendation
                        engine, the skill graph, and the adaptive learning surface.
                    </p>

                    <button
                        type="button"
                        onClick={() => router.push("/super-admin/learning-studio")}
                        className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-black text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition shadow-[0_0_24px_rgba(255,193,7,0.25)]"
                    >
                        Open Learning Studio
                        <ArrowRight size={14} />
                    </button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {HIGHLIGHTS.map((h, i) => {
                    const Icon = h.icon;
                    return (
                        <motion.div
                            key={h.title}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.05 + i * 0.05, ease }}
                            className="rounded-xl border border-white/[0.05] bg-surface-2/30 p-5 hover:border-white/[0.1] transition"
                        >
                            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3">
                                <Icon size={14} className="text-yellow-400/80" />
                            </div>
                            <h3 className="text-sm font-semibold text-white/85">{h.title}</h3>
                            <p className="text-xs text-white/40 mt-1 leading-relaxed">{h.body}</p>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
