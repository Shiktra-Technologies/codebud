/**
 * Visual metadata for each lesson kind — colors, icons, accents.
 *
 * Kept as a typed map so adding a new kind (a) requires updating
 * `LessonKind` in the service, and (b) surfaces this file as the place to
 * add visuals — no scattered switch statements.
 */

import {
    BookOpen,
    Video,
    FileText,
    Dumbbell,
    HelpCircle,
    ClipboardList,
    Code2,
    Hammer,
    Flag,
    Briefcase,
    Sparkles,
    type LucideIcon,
} from "lucide-react";
import type { LessonKind } from "@/lib/services/learningStudioService";

export interface KindMeta {
    icon: LucideIcon;
    label: string;
    accent: string;        // tailwind text class
    accentBg: string;      // tailwind bg class (subtle)
    accentBorder: string;  // tailwind border class
    hint: string;          // short descriptor used in the picker
}

export const KIND_META: Record<LessonKind, KindMeta> = {
    lesson:      { icon: BookOpen,      label: "Lesson",      accent: "text-sky-300",      accentBg: "bg-sky-400/[0.08]",      accentBorder: "border-sky-400/25",      hint: "Concept explanation" },
    video:       { icon: Video,         label: "Video",       accent: "text-rose-300",     accentBg: "bg-rose-400/[0.08]",     accentBorder: "border-rose-400/25",     hint: "Recorded walkthrough" },
    reading:     { icon: FileText,      label: "Reading",     accent: "text-amber-300",    accentBg: "bg-amber-400/[0.07]",    accentBorder: "border-amber-400/20",    hint: "Article / docs" },
    exercise:    { icon: Dumbbell,      label: "Exercise",    accent: "text-lime-300",     accentBg: "bg-lime-400/[0.08]",     accentBorder: "border-lime-400/25",     hint: "Hands-on practice" },
    quiz:        { icon: HelpCircle,    label: "Quiz",        accent: "text-cyan-300",     accentBg: "bg-cyan-400/[0.08]",     accentBorder: "border-cyan-400/25",     hint: "Short knowledge check" },
    assessment:  { icon: ClipboardList, label: "Assessment",  accent: "text-violet-300",   accentBg: "bg-violet-400/[0.08]",   accentBorder: "border-violet-400/25",   hint: "Graded evaluation" },
    coding_lab:  { icon: Code2,         label: "Coding Lab",  accent: "text-emerald-300",  accentBg: "bg-emerald-400/[0.08]",  accentBorder: "border-emerald-400/25",  hint: "In-browser coding" },
    project:     { icon: Hammer,        label: "Project",     accent: "text-yellow-300",   accentBg: "bg-yellow-400/[0.08]",   accentBorder: "border-yellow-400/30",   hint: "End-to-end build" },
    checkpoint:  { icon: Flag,          label: "Checkpoint",  accent: "text-pink-300",     accentBg: "bg-pink-400/[0.08]",     accentBorder: "border-pink-400/25",     hint: "Progress validation" },
    career_task: { icon: Briefcase,     label: "Career Task", accent: "text-orange-300",   accentBg: "bg-orange-400/[0.07]",   accentBorder: "border-orange-400/25",   hint: "Portfolio / interview prep" },
    ai_session:  { icon: Sparkles,      label: "AI Session",  accent: "text-fuchsia-300",  accentBg: "bg-fuchsia-400/[0.08]",  accentBorder: "border-fuchsia-400/25",  hint: "Guided AI tutor session" },
};

export const KIND_ORDER: LessonKind[] = [
    "lesson", "video", "reading",
    "exercise", "coding_lab", "project",
    "quiz", "assessment", "checkpoint",
    "career_task", "ai_session",
];

export function formatDuration(minutes: number): string {
    if (!minutes || minutes <= 0) return "—";
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function difficultyLabel(d: number): { label: string; tone: string } {
    if (d < 0.25) return { label: "Easy",   tone: "text-emerald-400/80" };
    if (d < 0.50) return { label: "Medium", tone: "text-sky-400/80" };
    if (d < 0.75) return { label: "Hard",   tone: "text-amber-400/80" };
    return { label: "Expert", tone: "text-rose-400/80" };
}
