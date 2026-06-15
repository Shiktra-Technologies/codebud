/**
 * Curriculum store — a pure useReducer-based state container.
 *
 * Single source of truth for the in-progress curriculum tree during editing.
 * The reducer is pure: every action returns a fully-new state object. That
 * gives us three things essentially for free:
 *
 *   1. Optimistic updates with autosave — the parent's autosave hook gets the
 *      new modules array on every mutation, no special handling needed.
 *   2. Undo/redo readiness — the entire mutation history is replay-able by
 *      keeping a stack of past states. Not wired into the UI in this PR but
 *      the architecture supports it without changes.
 *   3. Drag-drop performance — reducer actions touch only the modules array,
 *      not the entire course doc; React re-renders are scoped.
 *
 * `uiState` (collapsed sets, selection) is NOT persisted. `toPersistable()`
 * strips it before sending to the backend.
 */

import type { LessonKind, Module, Lesson } from "@/lib/services/learningStudioService";

// ── Defaults per lesson kind ──────────────────────────────────────────

export const LESSON_KIND_DEFAULTS: Record<LessonKind, {
    label: string;
    estimated_duration_minutes: number;
    difficulty: number;
}> = {
    lesson:       { label: "Lesson",       estimated_duration_minutes: 15, difficulty: 0.3 },
    video:        { label: "Video",        estimated_duration_minutes: 10, difficulty: 0.2 },
    reading:      { label: "Reading",      estimated_duration_minutes: 12, difficulty: 0.3 },
    exercise:     { label: "Exercise",     estimated_duration_minutes: 20, difficulty: 0.4 },
    quiz:         { label: "Quiz",         estimated_duration_minutes: 8,  difficulty: 0.4 },
    assessment:   { label: "Assessment",   estimated_duration_minutes: 30, difficulty: 0.6 },
    coding_lab:   { label: "Coding Lab",   estimated_duration_minutes: 45, difficulty: 0.6 },
    project:      { label: "Project",      estimated_duration_minutes: 120, difficulty: 0.7 },
    checkpoint:   { label: "Checkpoint",   estimated_duration_minutes: 5,  difficulty: 0.3 },
    career_task:  { label: "Career Task",  estimated_duration_minutes: 30, difficulty: 0.5 },
    ai_session:   { label: "AI Session",   estimated_duration_minutes: 15, difficulty: 0.3 },
};

// ── ID generation ─────────────────────────────────────────────────────

function newId(prefix: string): string {
    const r =
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? (crypto as Crypto).randomUUID()
            : Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `${prefix}_${r}`;
}

export function makeLesson(kind: LessonKind, title?: string): Lesson {
    const defaults = LESSON_KIND_DEFAULTS[kind];
    return {
        id: newId("lsn"),
        title: title ?? `New ${defaults.label}`,
        kind,
        description: "",
        blocks: [],
        estimated_duration_minutes: defaults.estimated_duration_minutes,
        difficulty: defaults.difficulty,
        skill_slugs: [],
        concept_ids: [],
        prerequisite_lesson_ids: [],
    };
}

export function makeModule(title?: string): Module {
    return {
        id: newId("mod"),
        title: title ?? "New module",
        description: "",
        lessons: [],
    };
}

// ── State + Actions ───────────────────────────────────────────────────

export interface CurriculumUiState {
    collapsedModuleIds: string[];   // arrays (not Sets) for easy serialization in dev
    activeLessonId: string | null;
    activeModuleId: string | null;
}

export interface CurriculumState {
    modules: Module[];
    ui: CurriculumUiState;
}

export type CurriculumAction =
    | { type: "set"; modules: Module[] }
    | { type: "add_module"; afterModuleId?: string }
    | { type: "remove_module"; moduleId: string }
    | { type: "update_module"; moduleId: string; patch: Partial<Pick<Module, "title" | "description">> }
    | { type: "reorder_modules"; orderedIds: string[] }
    | { type: "toggle_module_collapsed"; moduleId: string }
    | { type: "add_lesson"; moduleId: string; kind: LessonKind; afterLessonId?: string }
    | { type: "remove_lesson"; moduleId: string; lessonId: string }
    | { type: "update_lesson"; moduleId: string; lessonId: string; patch: Partial<Lesson> }
    | { type: "reorder_lessons"; moduleId: string; orderedIds: string[] }
    | { type: "move_lesson"; fromModuleId: string; toModuleId: string; lessonId: string; toIndex: number }
    | { type: "select_lesson"; moduleId: string | null; lessonId: string | null }
    // ── Block authoring actions ──
    | { type: "add_lesson_block"; moduleId: string; lessonId: string; blockType: string; afterBlockId?: string }
    | { type: "remove_lesson_block"; moduleId: string; lessonId: string; blockId: string }
    | { type: "update_lesson_block"; moduleId: string; lessonId: string; blockId: string; patch: Record<string, unknown> }
    | { type: "reorder_lesson_blocks"; moduleId: string; lessonId: string; orderedIds: string[] };

export function initialState(modules: Module[]): CurriculumState {
    return {
        modules: modules ?? [],
        ui: { collapsedModuleIds: [], activeLessonId: null, activeModuleId: null },
    };
}

export function curriculumReducer(state: CurriculumState, action: CurriculumAction): CurriculumState {
    switch (action.type) {
        case "set":
            return { ...state, modules: action.modules };

        case "add_module": {
            const fresh = makeModule();
            if (!action.afterModuleId) {
                return { ...state, modules: [...state.modules, fresh] };
            }
            const idx = state.modules.findIndex((m) => m.id === action.afterModuleId);
            if (idx < 0) return { ...state, modules: [...state.modules, fresh] };
            const next = [...state.modules];
            next.splice(idx + 1, 0, fresh);
            return { ...state, modules: next };
        }

        case "remove_module":
            return { ...state, modules: state.modules.filter((m) => m.id !== action.moduleId) };

        case "update_module":
            return {
                ...state,
                modules: state.modules.map((m) =>
                    m.id === action.moduleId ? { ...m, ...action.patch } : m,
                ),
            };

        case "reorder_modules": {
            const byId = new Map(state.modules.map((m) => [m.id, m]));
            const reordered = action.orderedIds
                .map((id) => byId.get(id))
                .filter((m): m is Module => Boolean(m));
            // Guard against stale ids — keep any modules not in the orderedIds.
            const known = new Set(action.orderedIds);
            const tail = state.modules.filter((m) => !known.has(m.id));
            return { ...state, modules: [...reordered, ...tail] };
        }

        case "toggle_module_collapsed": {
            const set = new Set(state.ui.collapsedModuleIds);
            if (set.has(action.moduleId)) set.delete(action.moduleId);
            else set.add(action.moduleId);
            return { ...state, ui: { ...state.ui, collapsedModuleIds: [...set] } };
        }

        case "add_lesson": {
            const lesson = makeLesson(action.kind);
            return {
                ...state,
                modules: state.modules.map((m) => {
                    if (m.id !== action.moduleId) return m;
                    if (!action.afterLessonId) {
                        return { ...m, lessons: [...m.lessons, lesson] };
                    }
                    const idx = m.lessons.findIndex((l) => l.id === action.afterLessonId);
                    const next = [...m.lessons];
                    if (idx < 0) next.push(lesson);
                    else next.splice(idx + 1, 0, lesson);
                    return { ...m, lessons: next };
                }),
                ui: { ...state.ui, activeModuleId: action.moduleId, activeLessonId: lesson.id },
            };
        }

        case "remove_lesson":
            return {
                ...state,
                modules: state.modules.map((m) =>
                    m.id === action.moduleId
                        ? { ...m, lessons: m.lessons.filter((l) => l.id !== action.lessonId) }
                        : m,
                ),
                ui: state.ui.activeLessonId === action.lessonId
                    ? { ...state.ui, activeLessonId: null }
                    : state.ui,
            };

        case "update_lesson":
            return {
                ...state,
                modules: state.modules.map((m) =>
                    m.id === action.moduleId
                        ? {
                              ...m,
                              lessons: m.lessons.map((l) =>
                                  l.id === action.lessonId ? { ...l, ...action.patch } : l,
                              ),
                          }
                        : m,
                ),
            };

        case "reorder_lessons":
            return {
                ...state,
                modules: state.modules.map((m) => {
                    if (m.id !== action.moduleId) return m;
                    const byId = new Map(m.lessons.map((l) => [l.id, l]));
                    const reordered = action.orderedIds
                        .map((id) => byId.get(id))
                        .filter((l): l is Lesson => Boolean(l));
                    const known = new Set(action.orderedIds);
                    const tail = m.lessons.filter((l) => !known.has(l.id));
                    return { ...m, lessons: [...reordered, ...tail] };
                }),
            };

        case "move_lesson": {
            let dragged: Lesson | undefined;
            const stripped = state.modules.map((m) => {
                if (m.id !== action.fromModuleId) return m;
                dragged = m.lessons.find((l) => l.id === action.lessonId);
                return { ...m, lessons: m.lessons.filter((l) => l.id !== action.lessonId) };
            });
            if (!dragged) return state;
            return {
                ...state,
                modules: stripped.map((m) => {
                    if (m.id !== action.toModuleId) return m;
                    const next = [...m.lessons];
                    const idx = Math.max(0, Math.min(action.toIndex, next.length));
                    next.splice(idx, 0, dragged!);
                    return { ...m, lessons: next };
                }),
                ui: { ...state.ui, activeModuleId: action.toModuleId, activeLessonId: action.lessonId },
            };
        }

        case "select_lesson":
            return {
                ...state,
                ui: {
                    ...state.ui,
                    activeModuleId: action.moduleId,
                    activeLessonId: action.lessonId,
                },
            };

        case "add_lesson_block": {
            return {
                ...state,
                modules: state.modules.map((m) => {
                    if (m.id !== action.moduleId) return m;
                    return {
                        ...m,
                        lessons: m.lessons.map((l) => {
                            if (l.id !== action.lessonId) return l;
                            const newBlock = {
                                id: newId("blk"),
                                type: action.blockType as any,
                                data: {},
                            };
                            if (!action.afterBlockId) {
                                return { ...l, blocks: [...l.blocks, newBlock] };
                            }
                            const idx = l.blocks.findIndex((b) => b.id === action.afterBlockId);
                            const next = [...l.blocks];
                            if (idx < 0) next.push(newBlock);
                            else next.splice(idx + 1, 0, newBlock);
                            return { ...l, blocks: next };
                        }),
                    };
                }),
            };
        }

        case "remove_lesson_block":
            return {
                ...state,
                modules: state.modules.map((m) => {
                    if (m.id !== action.moduleId) return m;
                    return {
                        ...m,
                        lessons: m.lessons.map((l) =>
                            l.id === action.lessonId
                                ? { ...l, blocks: l.blocks.filter((b) => b.id !== action.blockId) }
                                : l,
                        ),
                    };
                }),
            };

        case "update_lesson_block":
            return {
                ...state,
                modules: state.modules.map((m) => {
                    if (m.id !== action.moduleId) return m;
                    return {
                        ...m,
                        lessons: m.lessons.map((l) => {
                            if (l.id !== action.lessonId) return l;
                            return {
                                ...l,
                                blocks: l.blocks.map((b) =>
                                    b.id === action.blockId
                                        ? { ...b, data: { ...b.data, ...action.patch } }
                                        : b,
                                ),
                            };
                        }),
                    };
                }),
            };

        case "reorder_lesson_blocks":
            return {
                ...state,
                modules: state.modules.map((m) => {
                    if (m.id !== action.moduleId) return m;
                    return {
                        ...m,
                        lessons: m.lessons.map((l) => {
                            if (l.id !== action.lessonId) return l;
                            const byId = new Map(l.blocks.map((b) => [b.id, b]));
                            const reordered = action.orderedIds
                                .map((id) => byId.get(id))
                                .filter((b) => Boolean(b)) as typeof l.blocks;
                            const known = new Set(action.orderedIds);
                            const tail = l.blocks.filter((b) => !known.has(b.id));
                            return { ...l, blocks: [...reordered, ...tail] };
                        }),
                    };
                }),
            };

        default:
            return state;
    }
}

/** Strip UI-only state before sending to the backend. */
export function toPersistable(state: CurriculumState): Module[] {
    return state.modules.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        lessons: m.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            kind: l.kind,
            description: l.description,
            blocks: l.blocks,
            estimated_duration_minutes: l.estimated_duration_minutes,
            difficulty: l.difficulty,
            skill_slugs: l.skill_slugs,
            concept_ids: l.concept_ids,
            prerequisite_lesson_ids: l.prerequisite_lesson_ids,
        })),
    }));
}

// ── Derived selectors ─────────────────────────────────────────────────

export function findLesson(
    state: CurriculumState,
    moduleId: string | null,
    lessonId: string | null,
): { module: Module; lesson: Lesson } | null {
    if (!moduleId || !lessonId) return null;
    const m = state.modules.find((mm) => mm.id === moduleId);
    if (!m) return null;
    const l = m.lessons.find((ll) => ll.id === lessonId);
    return l ? { module: m, lesson: l } : null;
}

export function findLessonAnywhere(
    state: CurriculumState,
    lessonId: string,
): { module: Module; lesson: Lesson; moduleIndex: number; lessonIndex: number } | null {
    for (let mi = 0; mi < state.modules.length; mi++) {
        const m = state.modules[mi];
        const li = m.lessons.findIndex((l) => l.id === lessonId);
        if (li >= 0) return { module: m, lesson: m.lessons[li], moduleIndex: mi, lessonIndex: li };
    }
    return null;
}

export function courseStats(state: CurriculumState) {
    let totalLessons = 0;
    let totalMinutes = 0;
    const skillCoverage = new Map<string, number>();
    for (const m of state.modules) {
        for (const l of m.lessons) {
            totalLessons++;
            totalMinutes += l.estimated_duration_minutes || 0;
            for (const s of l.skill_slugs) {
                skillCoverage.set(s, (skillCoverage.get(s) ?? 0) + 1);
            }
        }
    }
    const topSkills = [...skillCoverage.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([slug, count]) => ({ slug, count }));
    return { modules: state.modules.length, totalLessons, totalMinutes, topSkills };
}
