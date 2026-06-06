"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Clock } from "lucide-react";
import type { Lesson } from "@/lib/services/learningStudioService";
import { KIND_META, formatDuration, difficultyLabel } from "./blockKindMeta";

interface Props {
    lesson: Lesson;
    moduleId: string;
    isActive: boolean;
    onSelect: () => void;
    onRename: (title: string) => void;
    onDelete: () => void;
}

/**
 * A sortable lesson row. Uses dnd-kit's useSortable hook — drag handle is
 * scoped to the GripVertical icon so the rest of the card stays clickable
 * (selection, inline rename).
 */
export default function LessonCard({
    lesson,
    moduleId,
    isActive,
    onSelect,
    onRename,
    onDelete,
}: Props) {
    const meta = KIND_META[lesson.kind];
    const Icon = meta.icon;
    const diff = difficultyLabel(lesson.difficulty);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: lesson.id,
        // Embed parent info in dnd-kit's data bag so the parent's
        // onDragOver/onDragEnd can detect cross-module moves.
        data: { type: "lesson", moduleId },
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const [renaming, setRenaming] = React.useState(false);
    const [draft, setDraft] = React.useState(lesson.title);
    React.useEffect(() => {
        if (!renaming) setDraft(lesson.title);
    }, [lesson.title, renaming]);

    const commitRename = () => {
        const next = draft.trim();
        if (next && next !== lesson.title) onRename(next);
        setRenaming(false);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            onClick={onSelect}
            className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-lg border transition cursor-pointer ${
                isActive
                    ? "bg-white/[0.05] border-yellow-400/30"
                    : "bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.08]"
            }`}
        >
            {/* Drag handle — only this element is the listener target */}
            <button
                type="button"
                {...listeners}
                onClick={(e) => e.stopPropagation()}
                className="p-0.5 text-white/20 hover:text-white/60 cursor-grab active:cursor-grabbing transition shrink-0"
                aria-label="Drag lesson"
            >
                <GripVertical size={12} />
            </button>

            {/* Kind icon */}
            <div className={`w-6 h-6 rounded-md ${meta.accentBg} border ${meta.accentBorder} flex items-center justify-center shrink-0`}>
                <Icon size={11} className={meta.accent} />
            </div>

            {/* Title (click-to-rename) */}
            <div className="flex-1 min-w-0">
                {renaming ? (
                    <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") {
                                setDraft(lesson.title);
                                setRenaming(false);
                            }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-transparent text-[12.5px] font-medium text-white/90 focus:outline-none border-b border-yellow-400/30 pb-px"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect();
                            setRenaming(true);
                        }}
                        className="w-full text-left text-[12.5px] font-medium text-white/85 truncate hover:text-white"
                        title={lesson.title}
                    >
                        {lesson.title}
                    </button>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-white/30 inline-flex items-center gap-0.5">
                        <Clock size={9} /> {formatDuration(lesson.estimated_duration_minutes)}
                    </span>
                    <span className={`text-[10px] ${diff.tone}`}>{diff.label}</span>
                    {lesson.skill_slugs.length > 0 && (
                        <span className="text-[10px] text-white/30">
                            {lesson.skill_slugs.length} skill{lesson.skill_slugs.length === 1 ? "" : "s"}
                        </span>
                    )}
                </div>
            </div>

            {/* Delete (visible on hover) */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="p-1 rounded-md text-white/20 opacity-0 group-hover:opacity-100 hover:text-red-300 hover:bg-red-500/10 transition shrink-0"
                aria-label="Delete lesson"
            >
                <Trash2 size={11} />
            </button>

            {isActive && (
                <span className="absolute -left-px top-1.5 bottom-1.5 w-[2px] rounded-full bg-yellow-400" />
            )}
        </div>
    );
}
