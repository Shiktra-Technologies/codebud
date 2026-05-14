"use client";

/**
 * Persistent footer for the course workspace.
 *
 * Three signals, always visible:
 *   1. Save state           — never disappears (idle shows "All changes saved").
 *   2. Stage completion     — what's still missing on this tab, in plain words.
 *   3. Progression CTA      — "Continue to Curriculum →" etc., advancing
 *                             through the deterministic flow.
 *
 * This is the single source of truth for "is my work safe?" — the header chip
 * is intentionally not duplicated, so admins look in one place and learn the
 * habit fast.
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    CheckCircle2,
    Loader2,
    AlertTriangle,
    ArrowRight,
    Circle,
    RefreshCw,
} from "lucide-react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

interface Props {
    saveStatus: AutosaveStatus;
    lastSavedAt: number | null;

    stageLabel: string;
    completionLabel: string | null;   // e.g. "3 of 4 fields complete"
    isStageComplete: boolean;

    nextStageLabel: string | null;    // null = no next stage in flow
    onContinue: (() => void) | null;

    onRetrySave: () => void;
}

export default function StudioActionBar({
    saveStatus,
    lastSavedAt,
    stageLabel,
    completionLabel,
    isStageComplete,
    nextStageLabel,
    onContinue,
    onRetrySave,
}: Props) {
    // Live "saved 12s ago" — refreshes every 15s so the timestamp never lies.
    const [, setTick] = React.useState(0);
    React.useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 15_000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="sticky bottom-0 z-20 border-t border-white/[0.06] bg-surface-1/85 backdrop-blur-xl">
            <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent" />
            <div className="px-8 py-3 flex items-center gap-4">
                {/* ── Save state pill ─────────────────────────────────── */}
                <SaveStatePill
                    status={saveStatus}
                    lastSavedAt={lastSavedAt}
                    onRetry={onRetrySave}
                />

                {/* ── Stage hint ──────────────────────────────────────── */}
                <div className="hidden md:flex items-center gap-2 pl-4 ml-1 border-l border-white/[0.06] min-w-0">
                    {isStageComplete ? (
                        <CheckCircle2 size={12} className="text-emerald-400/80 shrink-0" />
                    ) : (
                        <Circle size={11} className="text-white/30 shrink-0" />
                    )}
                    <div className="min-w-0">
                        <p className="text-[11px] text-white/55 truncate">
                            <span className="text-white/35">Stage:</span> {stageLabel}
                        </p>
                        {completionLabel && (
                            <p className="text-[10px] text-white/35 truncate">{completionLabel}</p>
                        )}
                    </div>
                </div>

                {/* ── Right cluster ───────────────────────────────────── */}
                <div className="ml-auto flex items-center gap-2">
                    {nextStageLabel && onContinue && (
                        <button
                            type="button"
                            onClick={onContinue}
                            className={`group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition active:scale-[0.98] ${
                                isStageComplete
                                    ? "bg-yellow-400 text-black hover:brightness-110 shadow-[0_0_20px_rgba(255,193,7,0.2)]"
                                    : "bg-white/[0.04] text-white/65 hover:bg-white/[0.07] border border-white/[0.07]"
                            }`}
                            title={
                                isStageComplete
                                    ? undefined
                                    : "You can continue now — remaining fields can be filled later."
                            }
                        >
                            Continue to {nextStageLabel}
                            <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Save state pill ──────────────────────────────────────────────────

function SaveStatePill({
    status,
    lastSavedAt,
    onRetry,
}: {
    status: AutosaveStatus;
    lastSavedAt: number | null;
    onRetry: () => void;
}) {
    if (status === "error") {
        return (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300">
                <AlertTriangle size={12} />
                <span className="text-[12px] font-medium">Save failed</span>
                <button
                    type="button"
                    onClick={onRetry}
                    className="ml-1 inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-red-500/15 hover:bg-red-500/25 transition"
                >
                    <RefreshCw size={10} /> Retry
                </button>
            </div>
        );
    }
    if (status === "saving") {
        return (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/70">
                <Loader2 size={12} className="animate-spin text-yellow-400" />
                <span className="text-[12px] font-medium">Saving changes…</span>
            </div>
        );
    }
    // idle or saved — both show "All changes saved" if we've ever saved.
    const label = lastSavedAt
        ? `All changes saved · ${formatRelative(lastSavedAt)}`
        : "All changes saved";
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={label}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/15 text-emerald-300/90"
            >
                <CheckCircle2 size={12} />
                <span className="text-[12px] font-medium">{label}</span>
            </motion.div>
        </AnimatePresence>
    );
}

function formatRelative(ts: number) {
    const diffMs = Date.now() - ts;
    const sec = Math.max(1, Math.round(diffMs / 1000));
    if (sec < 5) return "just now";
    if (sec < 60) return `${sec}s ago`;
    const min = Math.round(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.round(min / 60);
    return `${hr}h ago`;
}
