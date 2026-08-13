"use client";

import React from "react";
import {
    Brain,
    Clock,
    BarChart3,
    Layers,
    Sparkles,
    Lock,
} from "lucide-react";
import type { CurriculumState } from "./curriculumStore";
import { findLesson, courseStats } from "./curriculumStore";
import { KIND_META, formatDuration, difficultyLabel } from "./blockKindMeta";

interface Props {
    state: CurriculumState;
    onUpdateLesson: (moduleId: string, lessonId: string, patch: Partial<import("@/lib/services/learningStudioService").Lesson>) => void;
}

/**
 * Right rail — context-sensitive intelligence.
 *
 *   - Lesson selected → editable per-lesson metadata (duration, difficulty,
 *     skills, concepts, prerequisites). This is where the curriculum graph
 *     becomes machine-readable: every value here feeds recommendation and
 *     the future mastery validator.
 *   - No selection → course-level rollup (total duration, skill coverage).
 *
 * Most fields call `onUpdateLesson` directly; the parent's autosave hook
 * persists. No local form state — single source of truth in the store.
 */
export default function CurriculumGraphPanel({ state, onUpdateLesson }: Props) {
    const focus = findLesson(state, state.ui.activeModuleId, state.ui.activeLessonId);

    if (!focus) {
        return <CourseRollup state={state} />;
    }

    return <LessonInspector module={focus.module} lesson={focus.lesson} onUpdateLesson={onUpdateLesson} />;
}

// ── Course-level rollup ────────────────────────────────────────────────

function CourseRollup({ state }: { state: CurriculumState }) {
    const stats = courseStats(state);
    return (
        <div className="p-5 space-y-5">
            <PanelHeader title="Curriculum intelligence" subtitle="Course-wide rollup. Select a block to drill in." />

            <StatGrid stats={[
                { label: "Modules",      value: stats.modules,                 icon: Layers },
                { label: "Blocks",       value: stats.totalLessons,            icon: Sparkles },
                { label: "Total time",   value: formatDuration(stats.totalMinutes), icon: Clock },
                { label: "Top skills",   value: stats.topSkills.length,        icon: BarChart3 },
            ]} />

            <Section title="Skill coverage" hint="Skills tagged across this course.">
                {stats.topSkills.length === 0 ? (
                    <p className="text-[12px] text-white/35 italic">
                        No skill tags yet. Tag lessons to feed the recommendation engine.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-1.5">
                        {stats.topSkills.map(({ slug, count }) => (
                            <span
                                key={slug}
                                className="text-[11px] px-2 py-0.5 rounded-md bg-yellow-400/[0.06] border border-yellow-400/20 text-yellow-200/90"
                            >
                                {slug} <span className="opacity-50">×{count}</span>
                            </span>
                        ))}
                    </div>
                )}
            </Section>

            <Section title="What this powers" hint="Every tag below maps to a real consumer system.">
                <ul className="text-[11.5px] text-white/55 leading-relaxed space-y-1">
                    <li>• Recommendation engine — ranking against learner targeting</li>
                    <li>• Skill vector — EWMA updates per completed lesson</li>
                    <li>• Mastery validator — promotion eligibility</li>
                    <li>• AI tutor — grounded context retrieval</li>
                    <li>• Employability — claim issuance on course completion</li>
                </ul>
            </Section>
        </div>
    );
}

// ── Per-lesson inspector ───────────────────────────────────────────────

function LessonInspector({
    module,
    lesson,
    onUpdateLesson,
}: {
    module: import("@/lib/services/learningStudioService").Module;
    lesson: import("@/lib/services/learningStudioService").Lesson;
    onUpdateLesson: Props["onUpdateLesson"];
}) {
    const meta = KIND_META[lesson.kind];
    const Icon = meta.icon;
    const diff = difficultyLabel(lesson.difficulty);

    const patch = (p: Partial<typeof lesson>) => onUpdateLesson(module.id, lesson.id, p);

    return (
        <div className="p-5 space-y-5">
            <PanelHeader title={lesson.title} subtitle={`${meta.label} · in ${module.title}`} />

            {/* Kind badge */}
            <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border ${meta.accentBg} ${meta.accentBorder}`}>
                <Icon size={11} className={meta.accent} />
                <span className={`text-[11px] font-medium ${meta.accent}`}>{meta.label}</span>
            </div>

            {/* Duration + difficulty */}
            <div className="grid grid-cols-2 gap-2">
                <Field label="Duration (min)">
                    <input
                        type="number"
                        min={0}
                        value={lesson.estimated_duration_minutes || ""}
                        onChange={(e) => patch({ estimated_duration_minutes: Number(e.target.value) || 0 })}
                        className="w-full bg-white/[0.02] border border-white/[0.06] rounded-md px-2.5 py-1.5 text-[12.5px] text-white/90 focus:outline-none focus:border-yellow-400/40 transition"
                    />
                </Field>
                <Field label="Difficulty" hint={diff.label}>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={lesson.difficulty}
                        onChange={(e) => patch({ difficulty: Number(e.target.value) })}
                        className="w-full accent-yellow-400 cursor-pointer"
                    />
                </Field>
            </div>

            {/* Description */}
            <Field label="Description" hint="Surfaces in recommendations + tutor context.">
                <textarea
                    rows={3}
                    value={lesson.description ?? ""}
                    onChange={(e) => patch({ description: e.target.value })}
                    placeholder="What will the learner do or learn?"
                    className="w-full bg-white/[0.02] border border-white/[0.06] rounded-md px-2.5 py-1.5 text-[12px] text-white/85 placeholder:text-white/25 focus:outline-none focus:border-yellow-400/40 transition resize-none"
                />
            </Field>

            {/* Skill tags */}
            <Field label="Skills built" hint="Slugs from taxonomy_skills. Drives the skill vector.">
                <TagInput
                    values={lesson.skill_slugs}
                    onChange={(values) => patch({ skill_slugs: values })}
                    placeholder="e.g. react, typescript"
                />
            </Field>

            {/* Concepts (stub for now — wires to knowledge_concepts later) */}
            <Field label="Concepts referenced" hint="Future: knowledge graph node IDs.">
                <TagInput
                    values={lesson.concept_ids}
                    onChange={(values) => patch({ concept_ids: values })}
                    placeholder="e.g. gradient-descent"
                />
            </Field>

            {/* Prerequisites — show siblings in same course */}
            <PrerequisitePicker
                allLessons={collectSiblings(module)}
                current={lesson.prerequisite_lesson_ids}
                excludeId={lesson.id}
                onChange={(ids) => patch({ prerequisite_lesson_ids: ids })}
            />

            {/* Recommendation weight stub */}
            <Section title="Recommendation weight" hint="Computed signal — read-only.">
                <div className="space-y-1.5">
                    <RecoBar label="Skill alignment"   value={Math.min(1, lesson.skill_slugs.length / 3)} />
                    <RecoBar label="Difficulty fit"    value={1 - Math.abs(lesson.difficulty - 0.5) * 2} />
                    <RecoBar label="Concept richness"  value={Math.min(1, lesson.concept_ids.length / 4)} />
                </div>
            </Section>
        </div>
    );
}

function collectSiblings(m: import("@/lib/services/learningStudioService").Module) {
    return m.lessons.map((l) => ({ id: l.id, title: l.title, kind: l.kind }));
}

// ── Tag input (simple chips + free entry) ─────────────────────────────

function TagInput({
    values,
    onChange,
    placeholder,
}: {
    values: string[];
    onChange: (v: string[]) => void;
    placeholder?: string;
}) {
    const [draft, setDraft] = React.useState("");
    const add = () => {
        const v = draft.trim().toLowerCase().replace(/\s+/g, "-");
        if (!v || values.includes(v)) {
            setDraft("");
            return;
        }
        onChange([...values, v]);
        setDraft("");
    };
    return (
        <div className="flex flex-wrap gap-1.5 items-center px-2 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-md focus-within:border-yellow-400/40 transition">
            {values.map((v) => (
                <span
                    key={v}
                    className="inline-flex items-center gap-1 text-[10.5px] px-1.5 py-0.5 rounded-sm bg-white/[0.04] border border-white/[0.06] text-white/75"
                >
                    {v}
                    <button
                        type="button"
                        onClick={() => onChange(values.filter((x) => x !== v))}
                        className="text-white/30 hover:text-white/80"
                        aria-label={`Remove ${v}`}
                    >
                        ×
                    </button>
                </span>
            ))}
            <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        add();
                    } else if (e.key === "Backspace" && !draft && values.length > 0) {
                        onChange(values.slice(0, -1));
                    }
                }}
                onBlur={() => draft && add()}
                placeholder={values.length === 0 ? placeholder : "Add…"}
                className="flex-1 min-w-[80px] bg-transparent text-[11.5px] text-white/85 placeholder:text-white/25 focus:outline-none"
            />
        </div>
    );
}

function PrerequisitePicker({
    allLessons,
    current,
    excludeId,
    onChange,
}: {
    allLessons: { id: string; title: string; kind: string }[];
    current: string[];
    excludeId: string;
    onChange: (ids: string[]) => void;
}) {
    const options = allLessons.filter((l) => l.id !== excludeId);
    if (options.length === 0) {
        return (
            <Section title="Prerequisites" hint="Other lessons in this module the learner should complete first.">
                <p className="text-[11.5px] text-white/35 italic">
                    No other lessons in this module yet.
                </p>
            </Section>
        );
    }
    return (
        <Section title="Prerequisites" hint="Other lessons in this module the learner should complete first.">
            <div className="space-y-1">
                {options.map((l) => {
                    const checked = current.includes(l.id);
                    return (
                        <label
                            key={l.id}
                            className={`flex items-center gap-2 px-2 py-1 rounded-md text-[11.5px] cursor-pointer transition ${
                                checked ? "bg-yellow-400/[0.06] text-yellow-100/90" : "hover:bg-white/[0.025] text-white/70"
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                    onChange(
                                        checked
                                            ? current.filter((id) => id !== l.id)
                                            : [...current, l.id],
                                    )
                                }
                                className="accent-yellow-400"
                            />
                            <Lock size={9} className="text-white/30" />
                            <span className="truncate">{l.title}</span>
                        </label>
                    );
                })}
            </div>
        </Section>
    );
}

// ── Shared primitives ─────────────────────────────────────────────────

function PanelHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div>
            <div className="flex items-center gap-1.5 mb-1">
                <Brain size={11} className="text-yellow-400/80" />
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/35 font-semibold">
                    Intelligence
                </p>
            </div>
            <h3 className="text-[15px] font-semibold text-white/95 leading-tight">{title}</h3>
            {subtitle && <p className="text-[11.5px] text-white/40 mt-0.5">{subtitle}</p>}
        </div>
    );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="flex items-baseline justify-between mb-1.5">
                <p className="text-[10.5px] uppercase tracking-[0.14em] text-white/40 font-semibold">{title}</p>
            </div>
            {children}
            {hint && <p className="text-[10.5px] text-white/30 mt-1">{hint}</p>}
        </div>
    );
}

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
            <div className="flex items-baseline justify-between mb-1">
                <label className="text-[10.5px] uppercase tracking-[0.14em] text-white/40 font-semibold">
                    {label}
                </label>
                {hint && <span className="text-[10px] text-white/30">{hint}</span>}
            </div>
            {children}
        </div>
    );
}

function StatGrid({ stats }: { stats: { label: string; value: number | string; icon: React.ElementType }[] }) {
    return (
        <div className="grid grid-cols-2 gap-2">
            {stats.map((s) => {
                const Icon = s.icon;
                return (
                    <div
                        key={s.label}
                        className="p-2.5 rounded-lg border border-white/[0.05] bg-white/[0.02]"
                    >
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/35">
                            <Icon size={10} />
                            {s.label}
                        </div>
                        <p className="text-base font-semibold text-white/90 mt-0.5">{s.value}</p>
                    </div>
                );
            })}
        </div>
    );
}

function RecoBar({ label, value }: { label: string; value: number }) {
    const pct = Math.max(0, Math.min(1, value));
    return (
        <div>
            <div className="flex items-center justify-between text-[10.5px] text-white/45 mb-0.5">
                <span>{label}</span>
                <span>{Math.round(pct * 100)}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400/80 to-amber-500/80"
                    style={{ width: `${pct * 100}%` }}
                />
            </div>
        </div>
    );
}
