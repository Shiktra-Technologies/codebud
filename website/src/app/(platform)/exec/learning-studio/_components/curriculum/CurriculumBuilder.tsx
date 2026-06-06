"use client";

/**
 * CurriculumBuilder — the entry point for the Curriculum tab.
 *
 * Architecture:
 *
 *   props (course)
 *      ↓
 *   useReducer(curriculumReducer)         ← single source of truth while editing
 *      ↓
 *   ┌──────────────┬───────────────────┬────────────────┐
 *   │ Sidebar      │ Canvas (dnd)      │ Graph Panel    │
 *   │ navigation   │ authoring         │ intelligence   │
 *   └──────────────┴───────────────────┴────────────────┘
 *      ↓
 *   onChange({ modules })                ← bubbles every mutation to CourseCanvas
 *      ↓
 *   CourseCanvas.useAutosave              ← persists via PATCH (debounced)
 *
 * The local store is initialized FROM `course.modules` and kept in sync. When
 * the parent autosaves and receives an updated `course` back, the `useEffect`
 * below resets the store IF the incoming modules differ structurally — this
 * prevents stale local state after backend canonicalization while preserving
 * UI-only state (collapsed sections, selection) across saves.
 */

import React from "react";
import type { CourseV2, Lesson } from "@/lib/services/learningStudioService";
import {
    curriculumReducer,
    initialState,
    toPersistable,
    courseStats,
    type CurriculumState,
    findLesson,
} from "./curriculumStore";
import CurriculumSidebar from "./CurriculumSidebar";
import CurriculumCanvas from "./CurriculumCanvas";
import CurriculumGraphPanel from "./CurriculumGraphPanel";
import CurriculumToolbar from "./CurriculumToolbar";
import LessonAuthoringWorkspace from "./LessonAuthoringWorkspace";

interface Props {
    course: CourseV2;
    onChange: (patch: Partial<CourseV2>) => void;
}

export default function CurriculumBuilder({ course, onChange }: Props) {
    const [state, dispatch] = React.useReducer(
        curriculumReducer,
        course.modules ?? [],
        initialState,
    );

    // Sync store ← course when the persistable shape changes externally
    // (i.e. autosave returned a new doc). We compare on the canonical
    // modules-only JSON so internal ui state (selection, collapsed) isn't
    // clobbered on every save round-trip.
    const lastSyncedRef = React.useRef<string>(JSON.stringify(toPersistable(state)));
    React.useEffect(() => {
        const incoming = JSON.stringify(course.modules ?? []);
        if (incoming !== lastSyncedRef.current) {
            dispatch({ type: "set", modules: course.modules ?? [] });
            lastSyncedRef.current = incoming;
        }
    }, [course.modules]);

    // Push store → autosave whenever the persistable modules change.
    // We diff against the last-pushed snapshot to avoid spamming patches when
    // only ui state (selection, collapsed) moved.
    const lastPushedRef = React.useRef<string>(lastSyncedRef.current);
    React.useEffect(() => {
        const next = toPersistable(state);
        const serialized = JSON.stringify(next);
        if (serialized !== lastPushedRef.current) {
            lastPushedRef.current = serialized;
            lastSyncedRef.current = serialized; // suppress the echo from the sync effect
            onChange({ modules: next });
        }
    }, [state, onChange]);

    const [flowMode, setFlowMode] = React.useState(false);
    const stats = React.useMemo(() => courseStats(state), [state]);

    // If a lesson is actively selected, hijack the entire builder view
    // and show the Lesson Authoring Workspace.
    if (state.ui.activeLessonId) {
        return <LessonAuthoringWorkspace state={state} dispatch={dispatch} />;
    }

    // ── Scroll-into-view when sidebar selection changes ───────────────
    const canvasScrollRef = React.useRef<HTMLDivElement | null>(null);
    React.useEffect(() => {
        const id = state.ui.activeLessonId ?? state.ui.activeModuleId;
        if (!id) return;
        // Wait a tick for layout, then scroll.
        const timer = window.setTimeout(() => {
            const el = canvasScrollRef.current?.querySelector(`[data-curr-id="${id}"]`);
            (el as HTMLElement | null)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 50);
        return () => window.clearTimeout(timer);
    }, [state.ui.activeLessonId, state.ui.activeModuleId]);

    return (
        <div className="grid grid-cols-[220px_minmax(0,1fr)_320px] gap-px bg-white/[0.04] rounded-xl border border-white/[0.06] overflow-hidden -mx-2">
            {/* ── Outline sidebar ──────────────────────────────────── */}
            <aside className="bg-surface-0 max-h-[calc(100vh-260px)] overflow-y-auto">
                <CurriculumSidebar
                    state={state}
                    onSelectModule={(moduleId) =>
                        dispatch({ type: "select_lesson", moduleId, lessonId: null })
                    }
                    onSelectLesson={(moduleId, lessonId) =>
                        dispatch({ type: "select_lesson", moduleId, lessonId })
                    }
                    onToggleModule={(moduleId) =>
                        dispatch({ type: "toggle_module_collapsed", moduleId })
                    }
                />
            </aside>

            {/* ── Canvas ───────────────────────────────────────────── */}
            <main
                ref={canvasScrollRef}
                className="bg-surface-0 max-h-[calc(100vh-260px)] overflow-y-auto px-5 py-4"
            >
                <CurriculumToolbar
                    moduleCount={stats.modules}
                    lessonCount={stats.totalLessons}
                    totalMinutes={stats.totalMinutes}
                    onAddModule={() => dispatch({ type: "add_module" })}
                    flowMode={flowMode}
                    onToggleFlowMode={() => setFlowMode((v) => !v)}
                />
                <CurriculumCanvas state={state} dispatch={dispatch} flowMode={flowMode} />
            </main>

            {/* ── Intelligence panel ───────────────────────────────── */}
            <aside className="bg-surface-0 max-h-[calc(100vh-260px)] overflow-y-auto">
                <CurriculumGraphPanel
                    state={state}
                    onUpdateLesson={(moduleId, lessonId, patch: Partial<Lesson>) =>
                        dispatch({ type: "update_lesson", moduleId, lessonId, patch })
                    }
                />
            </aside>
        </div>
    );
}

export type { CurriculumState };
