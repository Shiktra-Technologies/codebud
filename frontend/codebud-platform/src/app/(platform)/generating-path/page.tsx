"use client";

/**
 * Cinematic post-onboarding transition.
 *
 * The recommendation snapshot is already generated synchronously by the
 * /api/onboarding/complete endpoint, so this screen exists for *perceived*
 * intelligence, not real work. We hold a minimum 2.4s and stage four lines
 * of copy so the user feels the system "thinking" about them.
 *
 * Routing:
 *   /generating-path?next=/learning-path  → routes to ?next when timer fires
 *   /generating-path                      → defaults to /learning-path
 *
 * Visual review needed: motion timing on slower hardware, mesh glow density.
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Target, Layers, Compass, Check } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

type Stage = {
    icon: typeof Sparkles;
    label: string;
    msAt: number;
};

// Total duration ≈ 2400ms; each stage settles before the next overlaps.
const STAGES: Stage[] = [
    { icon: Sparkles, label: "Analyzing your interests…",          msAt: 0    },
    { icon: Target,   label: "Matching learning paths…",           msAt: 600  },
    { icon: Layers,   label: "Ranking the right next courses…",    msAt: 1200 },
    { icon: Compass,  label: "Building your personalized roadmap…", msAt: 1800 },
];

const REVEAL_AT_MS = 2400;

export default function GeneratingPathPage() {
    const router = useRouter();
    const params = useSearchParams();
    const next = useMemo(() => params.get("next") || "/learning-path", [params]);

    const [elapsed, setElapsed] = useState(0);
    const [done, setDone] = useState(false);

    useEffect(() => {
        const start = performance.now();
        const tick = () => {
            const t = performance.now() - start;
            setElapsed(t);
            if (t >= REVEAL_AT_MS) {
                setDone(true);
                return;
            }
            requestAnimationFrame(tick);
        };
        const raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    useEffect(() => {
        if (!done) return;
        // Brief settle before navigation so the "ready" pulse is felt, not skipped.
        const t = setTimeout(() => router.replace(next), 550);
        return () => clearTimeout(t);
    }, [done, next, router]);

    const progressPct = Math.min(100, Math.round((elapsed / REVEAL_AT_MS) * 100));

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden bg-[#08080b] text-white">
            {/* ── Background mesh ────────────────────────────────────────────── */}
            <div
                className="absolute inset-0 opacity-70"
                style={{
                    backgroundImage:
                        "radial-gradient(60% 50% at 50% 30%, rgba(251,191,36,0.10), transparent 70%), radial-gradient(40% 35% at 80% 80%, rgba(244,114,182,0.06), transparent 60%), radial-gradient(45% 40% at 15% 75%, rgba(56,189,248,0.05), transparent 60%)",
                }}
            />
            <motion.div
                aria-hidden
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, ease }}
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
                    backgroundSize: "44px 44px",
                    maskImage:
                        "radial-gradient(circle at 50% 40%, black 30%, transparent 75%)",
                }}
            />

            {/* Soft scanning bar — implies "AI is reading you" without being literal. */}
            <motion.div
                aria-hidden
                className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent blur-[1px]"
                initial={{ y: "10vh", opacity: 0 }}
                animate={{ y: ["10vh", "90vh"], opacity: [0, 0.9, 0] }}
                transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
            />

            {/* ── Content ────────────────────────────────────────────────────── */}
            <div className="relative z-10 flex h-full w-full items-center justify-center px-6">
                <div className="flex w-full max-w-xl flex-col items-center text-center">
                    {/* Brand mark */}
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease }}
                        className="mb-10 flex items-center gap-2.5"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.4)]">
                            <Sparkles size={16} className="text-zinc-950" />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-zinc-400">
                            CODE <span className="text-amber-400">BUD</span>
                        </span>
                    </motion.div>

                    {/* Animated rings — visual anchor for "thinking" */}
                    <div className="relative mb-10 h-40 w-40">
                        {[0, 1, 2].map((i) => (
                            <motion.span
                                key={i}
                                aria-hidden
                                className="absolute inset-0 rounded-full border border-amber-400/30"
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: [0.6, 1.4], opacity: [0.55, 0] }}
                                transition={{
                                    duration: 2.6,
                                    delay: i * 0.7,
                                    repeat: Infinity,
                                    ease: "easeOut",
                                }}
                            />
                        ))}
                        <motion.div
                            className="absolute inset-2 rounded-full border border-white/[0.06] bg-zinc-950/60 backdrop-blur-xl"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.6, ease }}
                        />
                        <div className="absolute inset-0 grid place-items-center">
                            <AnimatePresence mode="wait">
                                {!done ? (
                                    <motion.div
                                        key="thinking"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.35, ease }}
                                        className="font-mono text-3xl font-bold tabular-nums text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                                    >
                                        {progressPct}
                                        <span className="ml-0.5 text-base text-amber-400/70">%</span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="done"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.45, ease }}
                                        className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-zinc-950 shadow-[0_0_30px_rgba(251,191,36,0.6)]"
                                    >
                                        <Check size={22} strokeWidth={3} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2, ease }}
                        className="text-balance text-3xl font-semibold leading-tight text-white sm:text-4xl"
                    >
                        {!done ? (
                            <>
                                Designing <span className="text-amber-400">your</span> learning journey
                            </>
                        ) : (
                            "Your personalized journey is ready."
                        )}
                    </motion.h1>

                    <p className="mt-3 text-sm text-zinc-500">
                        We&apos;re tailoring every recommendation to who you are.
                    </p>

                    {/* Stage list */}
                    <ul className="mt-10 flex w-full max-w-md flex-col gap-3">
                        {STAGES.map((stage, idx) => {
                            const reached = elapsed >= stage.msAt;
                            const completed =
                                idx < STAGES.length - 1
                                    ? elapsed >= STAGES[idx + 1].msAt
                                    : done;
                            const Icon = stage.icon;
                            return (
                                <motion.li
                                    key={stage.label}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={
                                        reached
                                            ? { opacity: 1, x: 0 }
                                            : { opacity: 0.25, x: -4 }
                                    }
                                    transition={{ duration: 0.45, ease }}
                                    className="flex items-center gap-3 text-left"
                                >
                                    <div
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors duration-300 ${
                                            completed
                                                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                                                : reached
                                                ? "border-amber-400/30 bg-amber-400/[0.08] text-amber-300"
                                                : "border-white/[0.06] bg-white/[0.02] text-zinc-600"
                                        }`}
                                    >
                                        {completed ? (
                                            <Check size={14} strokeWidth={2.6} />
                                        ) : (
                                            <Icon size={14} />
                                        )}
                                    </div>
                                    <span
                                        className={`text-sm transition-colors ${
                                            completed
                                                ? "text-zinc-300"
                                                : reached
                                                ? "text-white"
                                                : "text-zinc-600"
                                        }`}
                                    >
                                        {stage.label}
                                    </span>
                                </motion.li>
                            );
                        })}
                    </ul>

                    {/* Progress bar (subtle) */}
                    <div className="mt-10 h-px w-full max-w-md overflow-hidden rounded-full bg-white/[0.04]">
                        <motion.div
                            className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 0.15, ease: "linear" }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
