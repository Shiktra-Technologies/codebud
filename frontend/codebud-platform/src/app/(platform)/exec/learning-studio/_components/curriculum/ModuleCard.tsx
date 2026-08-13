"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "motion/react";
import {
    GripVertical,
    ChevronDown,
    Trash2,
    MoreVertical,
    BookOpen,
} from "lucide-react";

import type { Module, LessonKind, Lesson } from "@/lib/services/learningStudioService";
import LessonCard from "./LessonCard";
import BlockTypePicker from "./BlockTypePicker";

const ease = [0.16, 1, 0.3, 1] as const;

interface Props {
    module: Module;
    collapsed: boolean;
    activeLessonId: string | null;
    onToggleCollapsed: () => void;
    onRename: (title: string) => void;
    onDelete: () => void;
    onAddLesson: (kind: LessonKind) => void;
    onSelectLesson: (id: string) => void;
    onRenameLesson: (id: string, title: string) => void;
    onDeleteLesson: (id: string) => void;
}

export default function ModuleCard({
    module,
    collapsed,
    activeLessonId,
    onToggleCollapsed,
    onRename,
    onDelete,
    onAddLesson,
    onSelectLesson,
    onRenameLesson,
    onDeleteLesson,
}: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: module.id,
        data: { type: "module" },
    });

    // A separate droppable target for the module body — lets a lesson dragged
    // from another module land inside this one even when the lesson list is
    // empty (no sortable items to hit).
    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: `module-drop:${module.id}`,
        data: { type: "module-drop", moduleId: module.id },
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const [renaming, setRenaming] = React.useState(false);
    const [draft, setDraft] = React.useState(module.title);
    React.useEffect(() => {
        if (!renaming) setDraft(module.title);
    }, [module.title, renaming]);

    const commitRename = () => {
        const next = draft.trim();
        if (next && next !== module.title) onRename(next);
        setRenaming(false);
    };

    const lessonIds = module.lessons.map((l) => l.id);
    const totalMinutes = module.lessons.reduce(
        (s, l) => s + (l.estimated_duration_minutes || 0),
        0,
    );

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`rounded-xl border bg-surface-1/30 backdrop-blur-sm transition ${
                isOver
                    ? "border-yellow-400/40 shadow-[0_0_30px_rgba(255,193,7,0.08)]"
                    : "border-white/[0.06]"
            }`}
        >
            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.04]">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="p-0.5 text-white/25 hover:text-white/70 cursor-grab active:cursor-grabbing transition shrink-0"
                    aria-label="Drag module"
                >
                    <GripVertical size={13} />
                </button>

                <button
                    type="button"
                    onClick={onToggleCollapsed}
                    className="p-0.5 text-white/35 hover:text-white/80 transition shrink-0"
                    aria-label={collapsed ? "Expand" : "Collapse"}
                >
                    <ChevronDown
                        size={13}
                        style={{
                            transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
                            transition: "transform 200ms",
                        }}
                    />
                </button>

                <BookOpen size={12} className="text-yellow-400/70 shrink-0" />

                {renaming ? (
                    <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") {
                                setDraft(module.title);
                                setRenaming(false);
                            }
                        }}
                        className="flex-1 bg-transparent text-[13.5px] font-semibold text-white focus:outline-none border-b border-yellow-400/30 pb-px"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setRenaming(true)}
                        className="flex-1 text-left text-[13.5px] font-semibold text-white/90 hover:text-white truncate"
                        title={module.title}
                    >
                        {module.title}
                    </button>
                )}

                <div className="flex items-center gap-3 text-[10.5px] text-white/35 shrink-0">
                    <span>{module.lessons.length} {module.lessons.length === 1 ? "block" : "blocks"}</span>
                    {totalMinutes > 0 && <span>{formatTotal(totalMinutes)}</span>}
                </div>

                <ModuleMenu onDelete={onDelete} />
            </div>

            {/* ── Body ───────────────────────────────────────────── */}
            <AnimatePresence initial={false}>
                {!collapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease }}
                        style={{ overflow: "hidden" }}
                    >
                        <div ref={setDropRef} className="p-2 space-y-1.5 min-h-[44px]">
                            <SortableContext items={lessonIds} strategy={verticalListSortingStrategy}>
                                {module.lessons.map((lesson: Lesson) => (
                                    <LessonCard
                                        key={lesson.id}
                                        lesson={lesson}
                                        moduleId={module.id}
                                        isActive={lesson.id === activeLessonId}
                                        onSelect={() => onSelectLesson(lesson.id)}
                                        onRename={(t) => onRenameLesson(lesson.id, t)}
                                        onDelete={() => onDeleteLesson(lesson.id)}
                                    />
                                ))}
                            </SortableContext>

                            {module.lessons.length === 0 && (
                                <div className="px-3 py-4 text-center text-[11.5px] text-white/30 border border-dashed border-white/[0.06] rounded-lg">
                                    Empty module — drop a lesson here or add one below.
                                </div>
                            )}

                            <div className="pt-1.5 flex justify-start">
                                <BlockTypePicker
                                    onPick={onAddLesson}
                                    label="Add block"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ModuleMenu({ onDelete }: { onDelete: () => void }) {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [open]);
    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="p-1 rounded-md text-white/30 hover:text-white/80 hover:bg-white/[0.04] transition"
                aria-label="Module actions"
            >
                <MoreVertical size={12} />
            </button>
            {open && (
                <div className="absolute z-20 right-0 mt-1 w-44 rounded-lg border border-white/[0.08] bg-surface-1/95 backdrop-blur-xl shadow-xl py-1">
                    <button
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            onDelete();
                        }}
                        className="w-full px-3 py-1.5 text-left text-[12px] text-red-300/90 hover:text-red-200 hover:bg-red-500/10 transition inline-flex items-center gap-2"
                    >
                        <Trash2 size={11} /> Delete module
                    </button>
                </div>
            )}
        </div>
    );
}

function formatTotal(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
