"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    FileText,
    LayoutList,
    UsersRound,
    ClipboardCheck,
    LineChart,
    Send,
    History,
    Loader2,
    Eye,
    AlertTriangle,
    RefreshCw,
} from "lucide-react";
import {
    learningStudio,
    type CourseV2,
    type LifecycleState,
    LIFECYCLE_LABELS,
    LIFECYCLE_TONE,
} from "@/lib/services/learningStudioService";
import StudioActionBar, { type AutosaveStatus } from "./StudioActionBar";

const ease = [0.16, 1, 0.3, 1] as const;

const TABS = [
    { id: "overview" as const,    label: "Overview",     icon: FileText },
    { id: "curriculum" as const,  label: "Curriculum",   icon: LayoutList },
    { id: "match" as const,       label: "Learner Match", icon: UsersRound },
    { id: "assessments" as const, label: "Assessments",  icon: ClipboardCheck },
    { id: "analytics" as const,   label: "Analytics",    icon: LineChart },
    { id: "publishing" as const,  label: "Publishing",   icon: Send },
    { id: "versions" as const,    label: "Versions",     icon: History },
];
type TabId = typeof TABS[number]["id"];

interface Props {
    course: CourseV2;
    loading: boolean;
    onPatched: (next: CourseV2) => void;
}

/**
 * Debounced autosave: keeps the user typing while we batch PATCH calls.
 * One in-flight save at a time; queued changes are coalesced.
 *
 * Exposes:
 *   queue(patch)            schedule a save (debounced 600ms)
 *   flushNow()              imperative flush — used by tab-switch and beforeunload
 *   status                  idle | saving | saved | error
 *   lastSavedAt             ms epoch of the last successful PATCH (or null)
 *   hasPendingChanges()     true if work is queued OR a save is in flight
 *   lastError               last error message, if any (drives retry CTA)
 *
 * Pending changes survive in a ref through re-renders. They DO NOT survive
 * unmount — `page.tsx` keys CourseCanvas on `course._id`, so switching courses
 * remounts this hook and drops anything still in the debounce window. The
 * beforeunload guard catches the window-close case.
 */
interface Autosave {
    queue: (p: Partial<CourseV2>) => void;
    /** Returns true if everything is persisted, false if the flush failed. */
    flushNow: () => Promise<boolean>;
    status: AutosaveStatus;
    lastSavedAt: number | null;
    hasPendingChanges: () => boolean;
    /** Returns true if the retry succeeded. */
    retry: () => Promise<boolean>;
}

function useAutosave(
    courseId: string,
    onPatched: (next: CourseV2) => void,
): Autosave {
    const pending = React.useRef<Partial<CourseV2> | null>(null);
    const inflight = React.useRef(false);
    const failedPayload = React.useRef<Partial<CourseV2> | null>(null);
    const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const [status, setStatus] = React.useState<AutosaveStatus>("idle");
    const [lastSavedAt, setLastSavedAt] = React.useState<number | null>(null);

    const flush = React.useCallback(async () => {
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = null;
        }
        if (inflight.current) return;
        // Retry path: replay the failed payload first.
        const payload = failedPayload.current
            ? { ...failedPayload.current, ...(pending.current || {}) }
            : pending.current;
        if (!payload) return;
        pending.current = null;
        failedPayload.current = null;
        inflight.current = true;
        setStatus("saving");
        try {
            const res = await learningStudio.courses.patch(courseId, payload);
            if (res.success && res.course) {
                onPatched(res.course);
                setLastSavedAt(Date.now());
                setStatus("saved");
            } else {
                failedPayload.current = payload;
                setStatus("error");
            }
        } catch {
            failedPayload.current = payload;
            setStatus("error");
        } finally {
            inflight.current = false;
            if (pending.current) flush();
        }
    }, [courseId, onPatched]);

    const queue = React.useCallback(
        (patch: Partial<CourseV2>) => {
            pending.current = { ...(pending.current || {}), ...patch };
            setStatus("saving");
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(flush, 600);
        },
        [flush],
    );

    const flushNow = React.useCallback(async () => {
        await flush();
        // Truth lives in the refs — the React state update from flush won't
        // be visible in this closure until the next render.
        return failedPayload.current === null && pending.current === null;
    }, [flush]);

    const retry = React.useCallback(async () => {
        await flush();
        return failedPayload.current === null && pending.current === null;
    }, [flush]);

    const hasPendingChanges = React.useCallback(
        () => pending.current !== null || inflight.current || failedPayload.current !== null,
        [],
    );

    // Reset when switching to a different course (defensive — the parent keys
    // the canvas on courseId, but if that contract ever changes, we don't want
    // stale pending state corrupting the new course).
    React.useEffect(() => {
        pending.current = null;
        failedPayload.current = null;
        inflight.current = false;
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        setStatus("idle");
        setLastSavedAt(null);
    }, [courseId]);

    React.useEffect(
        () => () => {
            if (timer.current) clearTimeout(timer.current);
        },
        [],
    );

    return { queue, flushNow, status, lastSavedAt, hasPendingChanges, retry };
}

// ── Stage definitions (single source of truth for progression) ────────
//
// Each entry: which tab id it represents, what counts as "complete", and what
// the next stage in the deterministic creation flow is. Tabs that aren't part
// of the creation flow (Analytics, Versions) have nextStage = null so the bar
// doesn't push admins into them.

interface StageInfo {
    label: string;
    isComplete: (c: CourseV2) => boolean;
    missingHint: (c: CourseV2) => string | null;
    nextStage: TabId | null;
}

const STAGE: Record<TabId, StageInfo> = {
    overview: {
        label: "Overview",
        isComplete: (c) =>
            c.title.trim().length > 0 &&
            c.short_description.trim().length > 0 &&
            c.estimated_duration_minutes > 0,
        missingHint: (c) => {
            const missing: string[] = [];
            if (!c.title.trim()) missing.push("title");
            if (!c.short_description.trim()) missing.push("short description");
            if (!c.estimated_duration_minutes) missing.push("duration");
            if (missing.length === 0) return null;
            return `Recommended next: ${missing.join(", ")}`;
        },
        nextStage: "curriculum",
    },
    curriculum: {
        label: "Curriculum",
        isComplete: (c) => (c.modules?.length ?? 0) > 0,
        missingHint: (c) =>
            (c.modules?.length ?? 0) > 0 ? null : "Add at least one module to continue.",
        nextStage: "assessments",
    },
    match: {
        label: "Learner Match",
        isComplete: (c) =>
            c.targeting.interests.length > 0 ||
            c.targeting.career_goals.length > 0 ||
            c.targeting.target_roles.length > 0,
        missingHint: (c) =>
            c.targeting.interests.length +
                c.targeting.career_goals.length +
                c.targeting.target_roles.length >
            0
                ? null
                : "Tag at least one interest, goal, or target role.",
        nextStage: "assessments",
    },
    assessments: {
        label: "Assessments",
        isComplete: () => true, // optional stage in v1
        missingHint: () => null,
        nextStage: "publishing",
    },
    analytics: {
        label: "Analytics",
        isComplete: () => true,
        missingHint: () => null,
        nextStage: null,
    },
    publishing: {
        label: "Publishing",
        isComplete: (c) => c.lifecycle_state === "published",
        missingHint: (c) =>
            c.lifecycle_state === "published" ? null : "Transition to publish when ready.",
        nextStage: null,
    },
    versions: {
        label: "Versions",
        isComplete: () => true,
        missingHint: () => null,
        nextStage: null,
    },
};

export default function CourseCanvas({ course, loading, onPatched }: Props) {
    const [tab, setTab] = React.useState<TabId>("overview");
    const autosave = useAutosave(course._id, onPatched);
    const tone = LIFECYCLE_TONE[course.lifecycle_state];

    // Pending nav intent — used by the retry modal when a tab switch is
    // blocked because the last autosave failed.
    const [pendingNav, setPendingNav] = React.useState<TabId | null>(null);

    // ── Hard navigation guard (browser close / reload / route change) ──
    // We can't await async saves in beforeunload, so we just warn. The user
    // ack'ing the prompt gives us the in-flight save a chance to land before
    // the page unloads.
    React.useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (
                autosave.hasPendingChanges() ||
                autosave.status === "saving" ||
                autosave.status === "error"
            ) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [autosave]);

    // ── Tab-switch gating ──────────────────────────────────────────────
    // Cleanly: flush any pending edits before changing tabs so the user never
    // sees "Saved" stale relative to the new context. On error: open a modal
    // rather than silently swapping panels.
    const requestTabChange = React.useCallback(
        async (next: TabId) => {
            if (next === tab) return;
            if (autosave.status === "error") {
                setPendingNav(next);
                return;
            }
            if (autosave.hasPendingChanges() || autosave.status === "saving") {
                const ok = await autosave.flushNow();
                // If the flush failed, surface the retry modal instead of
                // continuing — never silently switch on a failed save.
                if (!ok) {
                    setPendingNav(next);
                    return;
                }
            }
            setTab(next);
        },
        [autosave, tab],
    );

    const stage = STAGE[tab];
    const nextStage = stage.nextStage;
    const nextStageLabel = nextStage ? STAGE[nextStage].label : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease }}
            className="min-h-full flex flex-col"
        >
            {/* ── Course header ───────────────────────────────────── */}
            <div className="px-8 pt-7 pb-5 border-b border-white/[0.04]">
                <div className="flex items-center gap-2 mb-2">
                    <span
                        className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-sm border ${tone.bg} ${tone.fg} ${tone.border}`}
                    >
                        {LIFECYCLE_LABELS[course.lifecycle_state]}
                    </span>
                    <span className="text-[11px] text-white/30">v{course.version_number}</span>
                    {/* Inline status removed — the StudioActionBar at the
                        bottom is now the single source of truth for save state. */}
                    <button
                        type="button"
                        className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/80 transition"
                        title="Live student preview — coming in next phase"
                    >
                        <Eye size={12} /> Preview as learner
                    </button>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">{course.title || "Untitled course"}</h2>
                <p className="text-[12px] text-white/40 mt-1">
                    {course.slug} · updated {formatRelative(course.updated_at)}
                </p>
            </div>

            {/* ── Tabs ────────────────────────────────────────────── */}
            <div className="px-8 pt-3 border-b border-white/[0.04] flex items-center gap-1 overflow-x-auto">
                {TABS.map(({ id, label, icon: Icon }) => {
                    const active = tab === id;
                    const complete = STAGE[id].isComplete(course);
                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => requestTabChange(id)}
                            className={`relative inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-t-md transition ${
                                active ? "text-white" : "text-white/45 hover:text-white/75"
                            }`}
                        >
                            <Icon size={12} />
                            {label}
                            {complete && !active && (
                                <span className="w-1 h-1 rounded-full bg-emerald-400/70" />
                            )}
                            {active && (
                                <motion.span
                                    layoutId="course-tab-underline"
                                    className="absolute left-2 right-2 -bottom-px h-0.5 bg-yellow-400 rounded-full"
                                    transition={{ duration: 0.3, ease }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Tab content ─────────────────────────────────────── */}
            <div className="flex-1 px-8 py-6 pb-24">
                {tab === "overview" && <OverviewTab course={course} onChange={autosave.queue} />}
                {tab === "curriculum" && <ComingSoonTab title="Curriculum builder" subtitle="Drag-drop modules and lesson blocks land in the next phase. Schema is already in place — your changes will deserialize cleanly." />}
                {tab === "match" && <ComingSoonTab title="Learner Match" subtitle="Configure targeting via the Intelligence panel on the right; this tab will visualize match impact across the onboarding cohort." />}
                {tab === "assessments" && <ComingSoonTab title="Assessments" subtitle="Quiz and assignment authoring. Backed by the same block system as lessons." />}
                {tab === "analytics" && <ComingSoonTab title="Analytics" subtitle="Lesson views, drop-off, completion rate, recommendation conversion. Awaits the event pipeline." />}
                {tab === "publishing" && <PublishingTab course={course} onPatched={onPatched} />}
                {tab === "versions" && <VersionsTab courseId={course._id} />}
            </div>

            {/* ── Persistent action bar ───────────────────────────── */}
            <StudioActionBar
                saveStatus={autosave.status}
                lastSavedAt={autosave.lastSavedAt}
                stageLabel={stage.label}
                completionLabel={stage.missingHint(course)}
                isStageComplete={stage.isComplete(course)}
                nextStageLabel={nextStageLabel}
                onContinue={nextStage ? () => requestTabChange(nextStage) : null}
                onRetrySave={autosave.retry}
            />

            <SaveErrorModal
                open={pendingNav !== null}
                onRetry={async () => {
                    const ok = await autosave.retry();
                    // If retry succeeded, complete the navigation. Otherwise
                    // leave the modal open so the user can try again.
                    if (ok && pendingNav) {
                        setTab(pendingNav);
                        setPendingNav(null);
                    }
                }}
                onKeepEditing={() => setPendingNav(null)}
                targetTabLabel={pendingNav ? STAGE[pendingNav].label : null}
            />

            {loading && (
                <div className="fixed top-20 right-4 text-xs text-white/40 flex items-center gap-1">
                    <Loader2 size={11} className="animate-spin" /> syncing
                </div>
            )}
        </motion.div>
    );
}

// ── Save error retry modal ────────────────────────────────────────────

function SaveErrorModal({
    open,
    onRetry,
    onKeepEditing,
    targetTabLabel,
}: {
    open: boolean;
    onRetry: () => void;
    onKeepEditing: () => void;
    targetTabLabel: string | null;
}) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                >
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={onKeepEditing}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.25, ease }}
                        className="relative w-full max-w-md rounded-2xl border border-red-500/20 bg-surface-1/95 backdrop-blur-xl shadow-2xl"
                    >
                        <div className="px-6 pt-6 pb-2">
                            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/30 text-red-300 text-[10px] uppercase tracking-[0.14em] font-semibold mb-3">
                                <AlertTriangle size={11} /> Save failed
                            </div>
                            <h3 className="text-lg font-semibold tracking-tight">
                                Your last save didn't go through.
                            </h3>
                            <p className="text-[13px] text-white/55 mt-2 leading-relaxed">
                                {targetTabLabel ? (
                                    <>
                                        We can't move to <span className="text-white/85">{targetTabLabel}</span>{" "}
                                        until your edits are safely persisted. Retry the save,
                                        or stay here and try again manually.
                                    </>
                                ) : (
                                    "Retry the save before continuing — no data has been lost yet."
                                )}
                            </p>
                        </div>
                        <div className="px-6 py-4 flex items-center justify-end gap-2 border-t border-white/[0.05]">
                            <button
                                type="button"
                                onClick={onKeepEditing}
                                className="px-3.5 py-1.5 rounded-lg text-[13px] text-white/60 hover:text-white/90 hover:bg-white/[0.04] transition"
                            >
                                Keep editing
                            </button>
                            <button
                                type="button"
                                onClick={onRetry}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-yellow-400 text-black text-[13px] font-semibold hover:brightness-110 active:scale-[0.98] transition"
                            >
                                <RefreshCw size={12} /> Retry save
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ── Overview tab ──────────────────────────────────────────────────────

function OverviewTab({
    course,
    onChange,
}: {
    course: CourseV2;
    onChange: (p: Partial<CourseV2>) => void;
}) {
    return (
        <div className="space-y-5 max-w-2xl">
            <Field label="Title">
                <TextInput
                    value={course.title}
                    onChange={(v) => onChange({ title: v })}
                    placeholder="A concise, learner-facing title"
                />
            </Field>
            <Field label="Short description" hint="One line. Used on cards and recommendations.">
                <TextInput
                    value={course.short_description}
                    onChange={(v) => onChange({ short_description: v })}
                    maxLength={280}
                    placeholder="A learner reads this in 2 seconds — make it count."
                />
            </Field>
            <Field label="Full description" hint="Markdown supported (rendering in next phase).">
                <textarea
                    value={course.full_description}
                    onChange={(e) => onChange({ full_description: e.target.value })}
                    rows={6}
                    className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-3.5 py-2.5 text-[13px] text-white/85 placeholder:text-white/25 focus:outline-none focus:border-yellow-400/40 focus:bg-white/[0.04] transition resize-none"
                    placeholder="Tell learners what they will build, gain, and become."
                />
            </Field>

            <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                    <TextInput
                        value={course.category}
                        onChange={(v) => onChange({ category: v })}
                        placeholder="e.g. frontend, backend, ai"
                    />
                </Field>
                <Field label="Language">
                    <TextInput
                        value={course.language}
                        onChange={(v) => onChange({ language: v })}
                        placeholder="en"
                    />
                </Field>
                <Field label="Difficulty">
                    <select
                        value={course.difficulty}
                        onChange={(e) => onChange({ difficulty: e.target.value as CourseV2["difficulty"] })}
                        className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-3.5 py-2 text-[13px] text-white/85 focus:outline-none focus:border-yellow-400/40 transition"
                    >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                    </select>
                </Field>
                <Field label="Estimated duration (min)">
                    <TextInput
                        type="number"
                        value={String(course.estimated_duration_minutes || "")}
                        onChange={(v) => onChange({ estimated_duration_minutes: Number(v) || 0 })}
                        placeholder="0"
                    />
                </Field>
            </div>

            <Field label="Thumbnail URL">
                <TextInput
                    value={course.thumbnail_url}
                    onChange={(v) => onChange({ thumbnail_url: v })}
                    placeholder="https://…"
                />
            </Field>
        </div>
    );
}

// ── Publishing tab ────────────────────────────────────────────────────

function PublishingTab({
    course,
    onPatched,
}: {
    course: CourseV2;
    onPatched: (next: CourseV2) => void;
}) {
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const ALLOWED: Record<LifecycleState, LifecycleState[]> = {
        draft:     ["review", "archived"],
        review:    ["draft", "scheduled", "published", "archived"],
        scheduled: ["draft", "published", "archived"],
        published: ["archived"],
        archived:  ["draft"],
    };

    const handleTransition = async (to: LifecycleState) => {
        setBusy(true);
        setError(null);
        try {
            const res = await learningStudio.courses.transition(course._id, to);
            if (res.success && res.course) {
                onPatched(res.course);
            } else {
                setError(res.error || "Transition failed");
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="max-w-xl space-y-4">
            <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/30 font-semibold">Current state</p>
                <p className="text-lg font-semibold mt-1">{LIFECYCLE_LABELS[course.lifecycle_state]}</p>
                <p className="text-[12px] text-white/40 mt-1">
                    Publishing snapshots the course so any enrolled students stay pinned to their version.
                </p>
            </div>

            <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/30 font-semibold mb-2">Transition to</p>
                <div className="flex flex-wrap gap-2">
                    {ALLOWED[course.lifecycle_state].map((to) => (
                        <button
                            key={to}
                            type="button"
                            disabled={busy}
                            onClick={() => handleTransition(to)}
                            className="px-3 py-1.5 rounded-md text-[12px] font-medium bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-yellow-400/30 transition disabled:opacity-40"
                        >
                            {LIFECYCLE_LABELS[to]}
                        </button>
                    ))}
                    {ALLOWED[course.lifecycle_state].length === 0 && (
                        <p className="text-[12px] text-white/40">No transitions available from this state.</p>
                    )}
                </div>
            </div>

            {error && <p className="text-[12px] text-red-400">{error}</p>}
        </div>
    );
}

// ── Versions tab ──────────────────────────────────────────────────────

function VersionsTab({ courseId }: { courseId: string }) {
    const [versions, setVersions] = React.useState<CourseV2[] | null>(null);
    React.useEffect(() => {
        learningStudio.courses.versions(courseId).then((r) => {
            if (r.success) setVersions(r.versions);
        });
    }, [courseId]);

    if (versions === null) return <p className="text-[12px] text-white/40">Loading…</p>;
    if (versions.length === 0)
        return (
            <p className="text-[12px] text-white/40">
                No version snapshots yet. Versions are captured automatically when a course is published.
            </p>
        );

    return (
        <ul className="space-y-2 max-w-xl">
            {versions.map((v) => (
                <li
                    key={(v as any)._id}
                    className="px-4 py-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-between"
                >
                    <div>
                        <p className="text-[13px] font-medium text-white/85">v{v.version_number}</p>
                        <p className="text-[11px] text-white/40">
                            snapshotted {formatRelative((v as any).snapshotted_at)}
                        </p>
                    </div>
                    <span
                        className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-sm border ${LIFECYCLE_TONE[v.lifecycle_state].bg} ${LIFECYCLE_TONE[v.lifecycle_state].fg} ${LIFECYCLE_TONE[v.lifecycle_state].border}`}
                    >
                        {LIFECYCLE_LABELS[v.lifecycle_state]}
                    </span>
                </li>
            ))}
        </ul>
    );
}

// ── Shared inputs ─────────────────────────────────────────────────────

function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="block text-[11px] uppercase tracking-[0.14em] text-white/35 font-semibold mb-1.5">
                {label}
            </label>
            {children}
            {hint && <p className="text-[11px] text-white/30 mt-1.5">{hint}</p>}
        </div>
    );
}

function TextInput({
    value,
    onChange,
    type = "text",
    placeholder,
    maxLength,
}: {
    value: string;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
    maxLength?: number;
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-3.5 py-2 text-[13px] text-white/85 placeholder:text-white/25 focus:outline-none focus:border-yellow-400/40 focus:bg-white/[0.04] transition"
        />
    );
}

function ComingSoonTab({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div className="max-w-xl">
            <div className="relative rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent p-8">
                <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent" />
                <p className="text-[10px] uppercase tracking-[0.14em] text-yellow-400/70 font-semibold">Next phase</p>
                <h3 className="text-lg font-semibold mt-1">{title}</h3>
                <p className="text-[13px] text-white/45 mt-2 leading-relaxed">{subtitle}</p>
            </div>
        </div>
    );
}

function formatRelative(iso?: string) {
    if (!iso) return "—";
    try {
        const d = new Date(iso);
        const diffMs = Date.now() - d.getTime();
        const min = Math.round(diffMs / 60000);
        if (min < 1) return "just now";
        if (min < 60) return `${min}m ago`;
        const hr = Math.round(min / 60);
        if (hr < 24) return `${hr}h ago`;
        const day = Math.round(hr / 24);
        return `${day}d ago`;
    } catch {
        return "—";
    }
}
