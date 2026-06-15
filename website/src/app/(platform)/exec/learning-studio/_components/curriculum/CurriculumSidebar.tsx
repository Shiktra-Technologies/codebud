"use client";

import React from "react";
import { motion } from "motion/react";
import {
    Layers,
    BookOpen,
    ChevronRight,
    ChevronDown,
} from "lucide-react";
import type { CurriculumState } from "./curriculumStore";
import { KIND_META } from "./blockKindMeta";

interface Props {
    state: CurriculumState;
    onSelectLesson: (moduleId: string, lessonId: string) => void;
    onSelectModule: (moduleId: string) => void;
    onToggleModule: (moduleId: string) => void;
}

/**
 * Slim outline tree — pure navigation. No drag here (the canvas owns
 * drag-drop). Clicking a node scrolls the canvas to it via the active
 * selection state — handled by the parent.
 */
export default function CurriculumSidebar({
    state,
    onSelectLesson,
    onSelectModule,
    onToggleModule,
}: Props) {
    const { modules, ui } = state;
    const collapsed = new Set(ui.collapsedModuleIds);

    return (
        <div className="h-full flex flex-col">
            <div className="px-3 py-2.5 border-b border-white/[0.04]">
                <div className="flex items-center gap-1.5">
                    <Layers size={11} className="text-white/35" />
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/35 font-semibold">
                        Outline
                    </p>
                    <span className="ml-auto text-[10px] text-white/30">
                        {modules.length} mod · {modules.reduce((s, m) => s + m.lessons.length, 0)} blocks
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-1.5 py-2 space-y-0.5">
                {modules.length === 0 && (
                    <p className="px-3 py-6 text-center text-[11px] text-white/30">
                        No modules yet.
                    </p>
                )}
                {modules.map((m) => {
                    const isCollapsed = collapsed.has(m.id);
                    const isActive = ui.activeModuleId === m.id && !ui.activeLessonId;
                    return (
                        <div key={m.id}>
                            <button
                                type="button"
                                onClick={() => onSelectModule(m.id)}
                                className={`group w-full flex items-center gap-1 px-2 py-1.5 rounded-md text-left transition ${
                                    isActive
                                        ? "bg-white/[0.05] text-white"
                                        : "hover:bg-white/[0.025] text-white/70"
                                }`}
                            >
                                <span
                                    role="button"
                                    tabIndex={-1}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleModule(m.id);
                                    }}
                                    className="p-0.5 text-white/35 hover:text-white/85 cursor-pointer"
                                >
                                    {isCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                                </span>
                                <BookOpen size={11} className="text-yellow-400/70 shrink-0" />
                                <span className="text-[12px] font-medium truncate">{m.title}</span>
                                <span className="ml-auto text-[10px] text-white/25">
                                    {m.lessons.length}
                                </span>
                            </button>
                            {!isCollapsed && m.lessons.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    transition={{ duration: 0.15 }}
                                    style={{ overflow: "hidden" }}
                                    className="pl-5"
                                >
                                    {m.lessons.map((l) => {
                                        const meta = KIND_META[l.kind];
                                        const Icon = meta.icon;
                                        const isLessonActive = ui.activeLessonId === l.id;
                                        return (
                                            <button
                                                key={l.id}
                                                type="button"
                                                onClick={() => onSelectLesson(m.id, l.id)}
                                                className={`relative w-full flex items-center gap-2 px-2 py-1 rounded-md text-left transition ${
                                                    isLessonActive
                                                        ? "bg-yellow-400/[0.06] text-yellow-100/90"
                                                        : "hover:bg-white/[0.02] text-white/55"
                                                }`}
                                            >
                                                {isLessonActive && (
                                                    <span className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-yellow-400" />
                                                )}
                                                <Icon size={9} className={meta.accent} />
                                                <span className="text-[11.5px] truncate">{l.title}</span>
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
