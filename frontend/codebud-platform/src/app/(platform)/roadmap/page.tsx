"use client";

/**
 * /roadmap — the student's live journey tracker.
 *
 * Every milestone is DERIVED from actual work (lessons completed, tests
 * submitted, mentor tasks approved, jobs applied to) — nothing is checked
 * off by hand. The snapshot refetches on tab focus and on a background
 * poll, so the roadmap advances on its own as the student works.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Compass,
    Briefcase,
    Code2,
    GraduationCap,
    Lock,
    Map,
    RefreshCw,
    Rocket,
    Sparkles,
    Users,
} from "lucide-react";

import { useAuth } from "@/lib/hooks/useAuth";
import {
    fetchRoadmap,
    type RoadmapMilestone,
    type RoadmapSnapshot,
    type RoadmapStage,
} from "@/lib/services/roadmapService";

const ease = [0.16, 1, 0.3, 1] as const;
const POLL_MS = 60_000;

const STAGE_ICONS: Record<string, typeof Rocket> = {
    setup: Rocket,
    learn: GraduationCap,
    practice: Code2,
    mentorship: Users,
    career: Briefcase,
};

// ── Overall progress ring ─────────────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
    const size = 132;
    const stroke = 7;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const dash = (Math.max(0, Math.min(100, pct)) / 100) * c;

    return (
        <div className="relative h-[132px] w-[132px]">
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={stroke}
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="url(#roadmap-grad)"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={c}
                    initial={{ strokeDashoffset: c }}
                    animate={{ strokeDashoffset: c - dash }}
                    transition={{ duration: 1.1, ease }}
                />
                <defs>
                    <linearGradient id="roadmap-grad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                    <div className="font-mono text-[32px] font-bold leading-none tabular-nums text-amber-300">
                        {pct}%
                    </div>
                    <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        complete
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Milestone row ─────────────────────────────────────────────────────

function MilestoneRow({ milestone }: { milestone: RoadmapMilestone }) {
    const { status } = milestone;
    const isDone = status === "completed";
    const isActive = status === "in_progress";
    const showBar = !isDone && milestone.progress > 0;

    return (
        <div
            className={`relative flex items-start gap-4 rounded-xl border p-4 transition-colors ${
                isActive
                    ? "border-amber-400/25 bg-amber-400/[0.04]"
                    : "border-white/[0.05] bg-white/[0.015]"
            }`}
        >
            {/* Status icon */}
            <div
                className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
                    isDone
                        ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-300"
                        : isActive
                            ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                            : "border-white/[0.08] bg-white/[0.03] text-zinc-600"
                }`}
            >
                {isDone ? (
                    <Check size={13} strokeWidth={3} />
                ) : isActive ? (
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                    </span>
                ) : (
                    <Lock size={11} />
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h4
                        className={`text-sm font-semibold ${
                            isDone
                                ? "text-zinc-400 line-through decoration-zinc-600"
                                : isActive
                                    ? "text-white"
                                    : "text-zinc-500"
                        }`}
                    >
                        {milestone.title}
                    </h4>
                    {milestone.detail && (
                        <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                            {milestone.detail}
                        </span>
                    )}
                </div>
                <p className={`mt-0.5 text-xs ${isActive ? "text-zinc-400" : "text-zinc-600"}`}>
                    {milestone.description}
                </p>

                {showBar && (
                    <div className="mt-2.5 h-1.5 max-w-[240px] overflow-hidden rounded-full bg-white/[0.05]">
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round(milestone.progress * 100)}%` }}
                            transition={{ duration: 0.8, ease }}
                        />
                    </div>
                )}
            </div>

            {!isDone && (
                <Link
                    href={milestone.href}
                    className={`mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isActive
                            ? "bg-amber-400 text-zinc-950 hover:bg-amber-300"
                            : "border border-white/[0.07] text-zinc-500 hover:border-white/[0.15] hover:text-zinc-300"
                    }`}
                >
                    {milestone.cta}
                    <ArrowRight size={12} />
                </Link>
            )}
        </div>
    );
}

// ── Stage block ───────────────────────────────────────────────────────

function StageBlock({ stage, index }: { stage: RoadmapStage; index: number }) {
    const Icon = STAGE_ICONS[stage.id] ?? Compass;
    const done = stage.milestones.filter((m) => m.status === "completed").length;

    return (
        <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.08, ease }}
            className="relative pl-14"
        >
            {/* Timeline node */}
            <div
                className={`absolute left-0 top-0 grid h-10 w-10 place-items-center rounded-xl border ${
                    stage.status === "completed"
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : stage.status === "in_progress"
                            ? "border-amber-400/35 bg-amber-400/10 text-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.15)]"
                            : "border-white/[0.07] bg-white/[0.02] text-zinc-600"
                }`}
            >
                {stage.status === "completed" ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
            </div>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3
                    className={`text-lg font-semibold ${
                        stage.status === "upcoming" ? "text-zinc-500" : "text-white"
                    }`}
                >
                    {stage.title}
                </h3>
                <span className="text-[11px] font-medium tabular-nums text-zinc-500">
                    {done}/{stage.milestones.length} done
                </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">{stage.tagline}</p>

            <div className="mt-4 space-y-2.5">
                {stage.milestones.map((m) => (
                    <MilestoneRow key={m.id} milestone={m} />
                ))}
            </div>
        </motion.section>
    );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function RoadmapPage() {
    const { user } = useAuth();
    const [snapshot, setSnapshot] = useState<RoadmapSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inFlight = useRef(false);

    const isOnboarded = Boolean((user as Record<string, unknown> | null)?.is_onboarded);

    const load = useCallback(
        async (isRefresh = false) => {
            if (inFlight.current) return;
            inFlight.current = true;
            if (isRefresh) setRefreshing(true);
            try {
                setSnapshot(await fetchRoadmap(isOnboarded));
                setError(null);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load your roadmap");
            } finally {
                inFlight.current = false;
                setLoading(false);
                setRefreshing(false);
            }
        },
        [isOnboarded],
    );

    // Auto-update: initial load + background poll (skipped while the tab
    // is hidden) + refetch the moment the student returns to the tab —
    // e.g. right after finishing a lesson or submitting a test.
    useEffect(() => {
        load();
        const timer = setInterval(() => {
            if (document.visibilityState === "visible") load(true);
        }, POLL_MS);
        const onVisible = () => {
            if (document.visibilityState === "visible") load(true);
        };
        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", onVisible);
        return () => {
            clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("focus", onVisible);
        };
    }, [load]);

    if (loading) {
        return (
            <div className="grid min-h-[60vh] place-items-center bg-[#08080b] text-zinc-500">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400/20 border-t-amber-400" />
                    <p className="text-xs">Loading your roadmap…</p>
                </div>
            </div>
        );
    }

    if (error || !snapshot) {
        return (
            <div className="grid min-h-[60vh] place-items-center bg-[#08080b] px-6">
                <div className="max-w-md rounded-xl border border-red-500/20 bg-red-500/[0.04] px-5 py-4 text-sm text-red-300">
                    {error || "Failed to load your roadmap"}
                </div>
            </div>
        );
    }

    const { stages, current, completedCount, totalCount, overallPct } = snapshot;

    return (
        <div className="min-h-screen bg-[#08080b] text-white">
            {/* Header */}
            <header className="mx-auto w-full max-w-5xl px-6 pt-8">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
                >
                    <ArrowLeft size={13} /> Back to dashboard
                </Link>
            </header>

            {/* Hero */}
            <section className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-10 px-6 py-10 sm:py-14 lg:grid-cols-[1fr_auto]">
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease }}
                        className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300"
                    >
                        <Map size={11} /> your roadmap
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.08, ease }}
                        className="mt-4 text-balance text-3xl font-semibold leading-tight text-white sm:text-4xl"
                    >
                        {completedCount} of {totalCount} milestones down.
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.16, ease }}
                        className="mt-4 flex flex-wrap items-center gap-3"
                    >
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-1 text-[11px] font-medium text-emerald-300">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            </span>
                            Live — updates automatically from your work
                        </span>
                        <button
                            onClick={() => load(true)}
                            disabled={refreshing}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
                        >
                            <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
                            {refreshing ? "Syncing…" : "Sync now"}
                        </button>
                    </motion.div>

                    {/* Up next */}
                    {current ? (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.24, ease }}
                            className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-400/[0.07] to-transparent p-4"
                        >
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-amber-400/30 bg-amber-400/10">
                                <Sparkles size={15} className="text-amber-300" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400/70">
                                    Up next
                                </div>
                                <div className="truncate text-sm font-semibold text-white">
                                    {current.title}
                                </div>
                            </div>
                            <Link
                                href={current.href}
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-zinc-950 transition-colors hover:bg-amber-300"
                            >
                                {current.cta} <ArrowRight size={13} />
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.24 }}
                            className="mt-6 text-sm text-emerald-300"
                        >
                            🎉 Every milestone complete — you&apos;ve finished the roadmap!
                        </motion.p>
                    )}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.15, ease }}
                    className="flex justify-center lg:justify-end"
                >
                    <ProgressRing pct={overallPct} />
                </motion.div>
            </section>

            {/* Timeline */}
            <div className="mx-auto w-full max-w-5xl px-6 pb-24">
                <div className="relative space-y-12">
                    {/* Connector line */}
                    <div
                        aria-hidden
                        className="absolute bottom-4 left-5 top-4 w-px bg-gradient-to-b from-amber-400/30 via-white/[0.07] to-transparent"
                    />
                    {stages.map((stage, i) => (
                        <StageBlock key={stage.id} stage={stage} index={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}
