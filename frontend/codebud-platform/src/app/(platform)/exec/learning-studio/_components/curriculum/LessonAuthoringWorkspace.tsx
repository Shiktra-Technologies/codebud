"use client";

import React from "react";
import type { CurriculumState, CurriculumAction } from "./curriculumStore";
import { findLesson } from "./curriculumStore";
import CurriculumSidebar from "./CurriculumSidebar";
import LessonEditor from "./LessonEditor";
import LessonMetadataPanel from "./LessonMetadataPanel";
import { ArrowLeft } from "lucide-react";

interface Props {
    state: CurriculumState;
    dispatch: React.Dispatch<CurriculumAction>;
}

export default function LessonAuthoringWorkspace({ state, dispatch }: Props) {
    const active = findLesson(state, state.ui.activeModuleId, state.ui.activeLessonId);

    if (!active) {
        // Fallback if somehow rendered without an active lesson
        return (
            <div className="flex-1 flex items-center justify-center bg-surface-0">
                <p className="text-white/40">Select a lesson to edit.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex h-full overflow-hidden bg-surface-0">
            {/* Left Sidebar - Outline context */}
            <div className="w-[280px] shrink-0 border-r border-white/[0.04] bg-[#0a0a0a] flex flex-col">
                <div className="p-4 border-b border-white/[0.04] flex items-center gap-3">
                    <button
                        onClick={() => dispatch({ type: "select_lesson", moduleId: null, lessonId: null })}
                        className="p-1.5 -ml-1.5 text-white/40 hover:text-white/90 hover:bg-white/[0.05] rounded-md transition"
                        title="Back to Curriculum"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h2 className="text-sm font-semibold text-white/90">Course Outline</h2>
                        <p className="text-[10px] text-white/40 mt-0.5">Authoring Mode</p>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <CurriculumSidebar 
                        state={state} 
                        onSelectModule={(moduleId) => dispatch({ type: "select_lesson", moduleId, lessonId: null })}
                        onSelectLesson={(moduleId, lessonId) => dispatch({ type: "select_lesson", moduleId, lessonId })}
                        onToggleModule={(moduleId) => dispatch({ type: "toggle_module_collapsed", moduleId })}
                    />
                </div>
            </div>

            {/* Center - Content Editor */}
            <LessonEditor lesson={active.lesson} moduleId={active.module.id} dispatch={dispatch} />

            {/* Right - Metadata & AI */}
            <LessonMetadataPanel lesson={active.lesson} moduleId={active.module.id} dispatch={dispatch} />
        </div>
    );
}
