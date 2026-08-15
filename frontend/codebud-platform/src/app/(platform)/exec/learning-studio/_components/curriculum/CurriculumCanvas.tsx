"use client";

/**
 * The nested drag-drop canvas.
 *
 * Two layers of sortability live inside ONE DndContext:
 *
 *   - Outer: SortableContext(modules)             — reorders modules
 *   - Inner: SortableContext(lessons-in-module)   — reorders lessons within a module
 *
 * `data: { type: "module" | "lesson", moduleId? }` on each sortable item is
 * how `handleDragOver` and `handleDragEnd` discriminate. The active-item
 * type also drives a custom collision detector so a module being dragged
 * never lands "inside" another module's lesson list, and vice versa.
 *
 * Cross-module lesson moves are handled in `handleDragOver`: as soon as the
 * dragged lesson hovers over a different module's droppable area, we
 * dispatch `move_lesson` so the visual list updates in place. `handleDragEnd`
 * only commits the *final* sort order via `reorder_lessons` if the lesson
 * ended in a non-empty list — empty-module landings are already handled by
 * the move action.
 */

import React from "react";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    closestCenter,
    pointerWithin,
    rectIntersection,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
    type CollisionDetection,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    sortableKeyboardCoordinates,
    arrayMove,
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "motion/react";

import type { LessonKind } from "@/lib/services/learningStudioService";
import type { CurriculumAction, CurriculumState } from "./curriculumStore";
import { findLessonAnywhere } from "./curriculumStore";
import ModuleCard from "./ModuleCard";
import { KIND_META } from "./blockKindMeta";

interface Props {
    state: CurriculumState;
    dispatch: React.Dispatch<CurriculumAction>;
    flowMode: boolean;
}

export default function CurriculumCanvas({ state, dispatch, flowMode }: Props) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    // Track the active drag for the overlay ghost + cross-module logic.
    const [activeId, setActiveId] = React.useState<string | null>(null);
    const activeType: "module" | "lesson" | null = React.useMemo(() => {
        if (!activeId) return null;
        if (state.modules.some((m) => m.id === activeId)) return "module";
        return "lesson";
    }, [activeId, state.modules]);

    const collapsedSet = React.useMemo(
        () => new Set(state.ui.collapsedModuleIds),
        [state.ui.collapsedModuleIds],
    );

    // Custom collision strategy: when dragging a module, only consider other
    // modules (top-level). When dragging a lesson, prefer intersections with
    // lesson droppables but fall back to the module-drop zone for
    // cross-module landings into empty / unhovered modules.
    const collisionDetection: CollisionDetection = React.useCallback(
        (args) => {
            if (activeType === "module") {
                return closestCenter({
                    ...args,
                    droppableContainers: args.droppableContainers.filter(
                        (c) => state.modules.some((m) => m.id === c.id),
                    ),
                });
            }
            // Lesson drag: try pointer-within first (more permissive for
            // crossing module boundaries), then rectIntersection.
            const inside = pointerWithin(args);
            if (inside.length > 0) return inside;
            return rectIntersection(args);
        },
        [activeType, state.modules],
    );

    const handleDragStart = (e: DragStartEvent) => {
        setActiveId(String(e.active.id));
    };

    const handleDragOver = (e: DragOverEvent) => {
        const { active, over } = e;
        if (!over) return;
        const activeData = active.data.current;
        const overData = over.data.current;
        if (!activeData || activeData.type !== "lesson") return;

        const lessonId = String(active.id);
        const fromModuleId = activeData.moduleId as string;
        if (!fromModuleId) return;

        // Determine the target module:
        //   - dropping over another lesson  → that lesson's module
        //   - dropping over a module-drop   → that module
        //   - else: bail (don't auto-snap to weird targets)
        let toModuleId: string | null = null;
        let toIndex = -1;

        if (overData?.type === "lesson") {
            toModuleId = overData.moduleId as string;
            const m = state.modules.find((mm) => mm.id === toModuleId);
            if (m) toIndex = m.lessons.findIndex((l) => l.id === over.id);
        } else if (overData?.type === "module-drop") {
            toModuleId = overData.moduleId as string;
            const m = state.modules.find((mm) => mm.id === toModuleId);
            toIndex = m ? m.lessons.length : 0;
        } else {
            return;
        }

        if (!toModuleId || toIndex < 0) return;
        if (toModuleId === fromModuleId) return; // intra-module handled in dragEnd

        dispatch({ type: "move_lesson", fromModuleId, toModuleId, lessonId, toIndex });
    };

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        setActiveId(null);
        if (!over || active.id === over.id) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        // Module reorder ────────────────────────────────────────────
        if (activeData?.type === "module" && overData?.type === "module") {
            const ids = state.modules.map((m) => m.id);
            const from = ids.indexOf(String(active.id));
            const to = ids.indexOf(String(over.id));
            if (from < 0 || to < 0) return;
            const next = arrayMove(ids, from, to);
            dispatch({ type: "reorder_modules", orderedIds: next });
            return;
        }

        // Intra-module lesson reorder ───────────────────────────────
        if (activeData?.type === "lesson" && overData?.type === "lesson") {
            const fromMod = activeData.moduleId as string;
            const toMod = overData.moduleId as string;
            if (fromMod !== toMod) return; // cross-module was handled in dragOver
            const m = state.modules.find((mm) => mm.id === fromMod);
            if (!m) return;
            const ids = m.lessons.map((l) => l.id);
            const from = ids.indexOf(String(active.id));
            const to = ids.indexOf(String(over.id));
            if (from < 0 || to < 0) return;
            const next = arrayMove(ids, from, to);
            dispatch({ type: "reorder_lessons", moduleId: fromMod, orderedIds: next });
        }
    };

    const handleDragCancel = () => setActiveId(null);

    // ── Active ghost for the DragOverlay ──────────────────────────────
    const dragged = activeId ? findDraggedDescriptor(state, activeId) : null;

    if (flowMode) {
        return <FlowVisualization state={state} />;
    }

    return (
        <div>
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <SortableContext
                    items={state.modules.map((m) => m.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-3">
                        <AnimatePresence initial={false}>
                            {state.modules.map((m, idx) => (
                                <motion.div
                                    key={m.id}
                                    layout
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1], delay: idx * 0.02 }}
                                >
                                    <ModuleCard
                                        module={m}
                                        collapsed={collapsedSet.has(m.id)}
                                        activeLessonId={state.ui.activeLessonId}
                                        onToggleCollapsed={() =>
                                            dispatch({ type: "toggle_module_collapsed", moduleId: m.id })
                                        }
                                        onRename={(title) =>
                                            dispatch({ type: "update_module", moduleId: m.id, patch: { title } })
                                        }
                                        onDelete={() =>
                                            dispatch({ type: "remove_module", moduleId: m.id })
                                        }
                                        onAddLesson={(kind: LessonKind) =>
                                            dispatch({ type: "add_lesson", moduleId: m.id, kind })
                                        }
                                        onSelectLesson={(id) =>
                                            dispatch({ type: "select_lesson", moduleId: m.id, lessonId: id })
                                        }
                                        onRenameLesson={(id, title) =>
                                            dispatch({
                                                type: "update_lesson",
                                                moduleId: m.id,
                                                lessonId: id,
                                                patch: { title },
                                            })
                                        }
                                        onDeleteLesson={(id) =>
                                            dispatch({ type: "remove_lesson", moduleId: m.id, lessonId: id })
                                        }
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </SortableContext>

                <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
                    {dragged?.kind === "module" && (
                        <div className="rounded-xl border border-yellow-400/40 bg-surface-1/90 backdrop-blur-xl shadow-2xl px-3 py-2.5 text-[13.5px] font-semibold text-white/90">
                            {dragged.title}
                        </div>
                    )}
                    {dragged?.kind === "lesson" && (
                        <div className="rounded-lg border border-yellow-400/40 bg-surface-1/95 backdrop-blur-xl shadow-2xl px-2.5 py-2 text-[12.5px] font-medium text-white/90 inline-flex items-center gap-2">
                            {dragged.icon}
                            {dragged.title}
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            {state.modules.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-sm text-white/40">
                        No modules yet. Add your first module to start designing the curriculum.
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Helpers ────────────────────────────────────────────────────────────

function findDraggedDescriptor(state: CurriculumState, id: string) {
    const m = state.modules.find((mm) => mm.id === id);
    if (m) return { kind: "module" as const, title: m.title };
    const found = findLessonAnywhere(state, id);
    if (!found) return null;
    const meta = KIND_META[found.lesson.kind];
    const Icon = meta.icon;
    return {
        kind: "lesson" as const,
        title: found.lesson.title,
        icon: <Icon size={11} className={meta.accent} />,
    };
}

// ── Flow mode (lightweight preview) ────────────────────────────────────

function FlowVisualization({ state }: { state: CurriculumState }) {
    // Honest scope: this is NOT a full graph renderer. It's a vertical flow
    // preview that respects module ordering + within-module prerequisites,
    // so the super-admin can sanity-check the learning sequence. A real
    // edge-rendered graph lives on the curriculum_nodes authoring view in
    // a later PR (where it can address cross-course reuse properly).
    return (
        <div className="relative pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-yellow-400/40 via-white/[0.08] to-transparent" />
            <div className="space-y-4">
                {state.modules.map((m, mi) => (
                    <div key={m.id} className="relative">
                        <div className="absolute -left-[18px] top-2 w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(255,193,7,0.5)]" />
                        <p className="text-[10px] uppercase tracking-[0.14em] text-yellow-400/70 font-semibold mb-1">
                            Module {mi + 1}
                        </p>
                        <h3 className="text-sm font-semibold text-white/90 mb-2">{m.title}</h3>
                        <div className="pl-3 border-l border-white/[0.05] space-y-1.5">
                            {m.lessons.map((l) => {
                                const meta = KIND_META[l.kind];
                                const Icon = meta.icon;
                                return (
                                    <div
                                        key={l.id}
                                        className="flex items-center gap-2 text-[12px] text-white/65"
                                    >
                                        <Icon size={10} className={meta.accent} />
                                        <span className="truncate">{l.title}</span>
                                        {l.prerequisite_lesson_ids.length > 0 && (
                                            <span className="text-[10px] text-amber-400/70">
                                                ← needs {l.prerequisite_lesson_ids.length}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                            {m.lessons.length === 0 && (
                                <p className="text-[11px] text-white/30 italic">empty</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <p className="mt-6 text-[10.5px] text-white/30">
                Flow preview · full edge-rendered graph lands with `curriculum_nodes` authoring.
            </p>
        </div>
    );
}
