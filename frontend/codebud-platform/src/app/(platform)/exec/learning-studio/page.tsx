"use client";

/**
 * Learning Studio — the content intelligence operating system for CODEBUD.
 *
 * Three-pane workspace:
 *   ┌─────────────┬─────────────────────┬────────────────────┐
 *   │  Library    │  Canvas             │  Intelligence      │
 *   │  (sidebar)  │  (identity / curr.) │  (recommendation)  │
 *   └─────────────┴─────────────────────┴────────────────────┘
 *
 * Access is gated to `codebud_super_admin` by both Next.js middleware and the
 * Flask blueprint behind /api/super-admin/learning-studio/*. A client-side
 * guard remains for defense-in-depth.
 */

import React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Loader2, Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import {
    learningStudio,
    type CourseV2,
    type CourseListResponse,
    type LegacyCourseSummary,
    type LifecycleState,
} from "@/lib/services/learningStudioService";

import LibrarySidebar from "./_components/LibrarySidebar";
import CourseCanvas from "./_components/CourseCanvas";
import IntelligencePanel from "./_components/IntelligencePanel";
import CreateCourseDialog from "./_components/CreateCourseDialog";

const ease = [0.16, 1, 0.3, 1] as const;

export default function LearningStudioPage() {
    const { userRole, loading: authLoading } = useAuth();
    const router = useRouter();

    const [library, setLibrary] = React.useState<CourseListResponse | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [activeCourseId, setActiveCourseId] = React.useState<string | null>(null);
    const [activeCourse, setActiveCourse] = React.useState<CourseV2 | null>(null);
    const [courseLoading, setCourseLoading] = React.useState(false);
    const [showCreate, setShowCreate] = React.useState(false);
    const [stateFilter, setStateFilter] = React.useState<LifecycleState | "all">("all");

    // ── Access guard (defense in depth; middleware is the gate) ──────────
    React.useEffect(() => {
        if (!authLoading && userRole && userRole !== "codebud_super_admin") {
            router.replace("/dashboard");
        }
    }, [authLoading, userRole, router]);

    const refreshLibrary = React.useCallback(async () => {
        setLoading(true);
        try {
            const resp = await learningStudio.courses.list();
            if (resp.success) setLibrary(resp);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (userRole === "codebud_super_admin") refreshLibrary();
    }, [userRole, refreshLibrary]);

    // Hydrate the active course doc whenever the selection changes.
    React.useEffect(() => {
        let cancelled = false;
        if (!activeCourseId) {
            setActiveCourse(null);
            return;
        }
        setCourseLoading(true);
        learningStudio.courses
            .get(activeCourseId)
            .then((res) => {
                if (cancelled) return;
                if (res.success && res.course) setActiveCourse(res.course);
            })
            .finally(() => !cancelled && setCourseLoading(false));
        return () => {
            cancelled = true;
        };
    }, [activeCourseId]);

    const handleCreated = (course: CourseV2) => {
        setShowCreate(false);
        setActiveCourseId(course._id);
        setActiveCourse(course);
        refreshLibrary();
    };

    // Optimistic local update so saves feel instant; the service still persists.
    const handleCoursePatched = (next: CourseV2) => {
        setActiveCourse(next);
        setLibrary((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                courses_v2: prev.courses_v2.map((c) => (c._id === next._id ? next : c)),
            };
        });
    };

    if (authLoading || userRole !== "codebud_super_admin") {
        return (
            <div className="min-h-screen bg-surface-0 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-yellow-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-0 text-white/90 flex flex-col">
            {/* ── Studio header ────────────────────────────────────────── */}
            <header className="relative shrink-0 border-b border-white/[0.06] bg-surface-1/40 backdrop-blur-xl">
                <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => router.push("/super-admin")}
                            className="p-2 rounded-lg hover:bg-white/[0.04] transition text-white/40 hover:text-white/80"
                            aria-label="Back to super admin"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(255,193,7,0.25)]">
                                <Sparkles size={14} className="text-black" />
                            </div>
                            <div>
                                <h1 className="text-[15px] font-semibold tracking-tight">Learning Studio</h1>
                                <p className="text-[11px] text-white/30 -mt-px">Content intelligence workspace</p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowCreate(true)}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-yellow-400 text-black text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition shadow-[0_0_20px_rgba(255,193,7,0.2)]"
                    >
                        <Plus size={14} />
                        New Course
                    </button>
                </div>
            </header>

            {/* ── 3-pane workspace ─────────────────────────────────────── */}
            <div className="flex-1 grid grid-cols-[280px_minmax(0,1fr)_340px] gap-px bg-white/[0.04] overflow-hidden">
                <motion.aside
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease }}
                    className="bg-surface-0 overflow-y-auto"
                >
                    <LibrarySidebar
                        library={library}
                        loading={loading}
                        stateFilter={stateFilter}
                        onStateFilterChange={setStateFilter}
                        activeCourseId={activeCourseId}
                        onSelect={(id) => setActiveCourseId(id)}
                        onRefresh={refreshLibrary}
                    />
                </motion.aside>

                <motion.main
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease, delay: 0.05 }}
                    className="bg-surface-0 overflow-y-auto"
                >
                    <AnimatePresence mode="wait">
                        {activeCourse ? (
                            <CourseCanvas
                                key={activeCourse._id}
                                course={activeCourse}
                                loading={courseLoading}
                                onPatched={handleCoursePatched}
                            />
                        ) : (
                            <EmptyCanvas key="empty" onCreate={() => setShowCreate(true)} />
                        )}
                    </AnimatePresence>
                </motion.main>

                <motion.aside
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease, delay: 0.08 }}
                    className="bg-surface-0 overflow-y-auto"
                >
                    <IntelligencePanel
                        course={activeCourse}
                        onPatched={handleCoursePatched}
                    />
                </motion.aside>
            </div>

            <CreateCourseDialog
                open={showCreate}
                onClose={() => setShowCreate(false)}
                onCreated={handleCreated}
            />
        </div>
    );
}

function EmptyCanvas({ onCreate }: { onCreate: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="h-full flex items-center justify-center px-10"
        >
            <div className="max-w-md text-center">
                <div className="relative mx-auto w-20 h-20 mb-6">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-amber-500/0 blur-2xl" />
                    <div className="relative w-full h-full rounded-2xl border border-white/[0.06] bg-surface-1/60 backdrop-blur flex items-center justify-center">
                        <Sparkles size={26} className="text-yellow-400/80" />
                    </div>
                </div>
                <h2 className="text-xl font-semibold tracking-tight">Design intelligence, not pages.</h2>
                <p className="mt-2 text-sm text-white/40 leading-relaxed">
                    Select a course from the library to enter the workspace, or start a
                    new one. Every course you build here feeds onboarding,
                    recommendations, skill graphs, and the adaptive learning engine.
                </p>
                <button
                    type="button"
                    onClick={onCreate}
                    className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-black text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition"
                >
                    <Plus size={14} />
                    Start a new course
                </button>
            </div>
        </motion.div>
    );
}

// Re-exported to silence "unused import" if the project's lint is strict about
// type-only imports in client components.
export type { LegacyCourseSummary };
