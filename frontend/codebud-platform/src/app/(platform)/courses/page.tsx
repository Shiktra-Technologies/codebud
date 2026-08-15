"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { listCourses, getMyEnrollments } from "@/lib/services/courseService";
import type { Course } from "@/lib/services/courseService";
import {
    BookOpen,
    Clock,
    Users,
    Star,
    Search,
    ArrowLeft,
} from "lucide-react";
import { HexIcon } from "@/app/components/ui/hex-icon";
import { EmptyState } from "@/app/components/ui/empty-state";
import { ErrorState } from "@/app/components/ui/error-state";
import { CardSkeletonGrid } from "@/app/components/ui/card-skeleton";

const ease = [0.16, 1, 0.3, 1] as const;

const DIFFICULTY_COLORS: Record<string, string> = {
    beginner: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    intermediate: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
    advanced: "bg-red-400/10 text-red-400 border-red-400/20",
};

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [difficulty, setDifficulty] = useState<string>("all");
    
    useEffect(() => {
        Promise.all([
            listCourses(),
            getMyEnrollments().catch(() => ({ success: false, enrollments: [] })),
        ]).then(([coursesRes, enrollRes]) => {
            if (coursesRes.success) {
                setCourses(coursesRes.courses || []);
                setError(null);
            } else {
                setCourses([]);
                setError(coursesRes.error || 'Failed to load courses');
            }
            if (enrollRes.success) {
                setEnrolledIds(new Set((enrollRes.enrollments || []).map((e: any) => e.course_id)));
            }
        }).catch((err) => {
            console.error('Error in courses page:', err);
            setError('Network error. Please check your connection and try again.');
            setCourses([]);
        }).finally(() => setLoading(false));
    }, []);

    const filtered = courses.filter((c) => {
        const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.tags || []).some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchDifficulty = difficulty === "all" || c.difficulty === difficulty;
        return matchSearch && matchDifficulty;
    });

    return (
        <div className="min-h-screen bg-surface-0 honeycomb-bg-lg">
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-0/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="h-full max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="flex items-center gap-2 text-xs font-medium text-white/30 hover:text-white/50 transition-colors">
                            <ArrowLeft size={14} /> Dashboard
                        </Link>
                        <div className="w-px h-5 bg-white/[0.06]" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
                                <BookOpen size={16} className="text-yellow-400" />
                            </div>
                            <span className="text-sm font-bold text-white">Courses</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="pt-16">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 page-enter">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="mb-8">
                        <h1 className="text-2xl font-bold text-white mb-1">Course Catalog</h1>
                        <p className="text-sm text-white/30">Browse and enroll in courses — all free</p>
                    </motion.div>

                    {/* Filters */}
                    {!loading && !error && (
                    <div className="flex flex-wrap items-center gap-4 mb-8">
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/15" />
                            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search courses..."
                                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/70 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors" />
                        </div>
                        <div className="flex gap-1 p-1 bg-surface-2/40 rounded-xl border border-white/[0.04]">
                            {["all", "beginner", "intermediate", "advanced"].map((d) => (
                                <button key={d} onClick={() => setDifficulty(d)}
                                    className={`pressable px-3 py-1.5 rounded-lg text-xs font-medium ${difficulty === d ? "bg-yellow-400 text-surface-0 shadow-[0_0_20px_rgba(255,193,7,0.2)]" : "text-white/30 hover:text-white/50"}`}>
                                    {d === "all" ? "All Levels" : d.charAt(0).toUpperCase() + d.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    )}

                    {/* Loading */}
                    {loading && <CardSkeletonGrid count={6} />}

                    {/* Error */}
                    {!loading && error && (
                        <ErrorState
                            message={error}
                            onRetry={() => window.location.reload()}
                        />
                    )}

                    {/* Course Grid */}
                    {!loading && !error && filtered.length === 0 ? (
                        <EmptyState
                            icon={BookOpen}
                            title={searchTerm || difficulty !== "all" ? "No matches" : "No courses yet"}
                            description="Check back soon for new content"
                        />
                    ) : !loading && !error && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filtered.map((course, i) => {
                                const isEnrolled = enrolledIds.has(course._id);
                                const totalLessons = course.sections?.reduce((a, s) => a + (s.lessons?.length || 0), 0) || 0;
                                return (
                                    <motion.div
                                        key={course._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.4, ease }}
                                    >
                                        <Link href={`/courses/${course._id}`}
                                            className="card-hover group block bg-surface-2/50 rounded-xl border border-white/[0.06] overflow-hidden">
                                            {/* Thumbnail placeholder */}
                                            <div className="h-36 bg-gradient-to-br from-yellow-400/[0.04] to-amber-500/[0.03] flex items-center justify-center border-b border-white/[0.04]">
                                                <div className="opacity-45 group-hover:opacity-100 transition-opacity duration-300">
                                                    <HexIcon size="lg">
                                                        <BookOpen size={22} />
                                                    </HexIcon>
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${DIFFICULTY_COLORS[course.difficulty] || DIFFICULTY_COLORS.beginner}`}>
                                                        {course.difficulty}
                                                    </span>
                                                    {isEnrolled && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-400/10 text-blue-400 border border-blue-400/20">
                                                            Enrolled
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-yellow-400 transition-colors duration-300">{course.title}</h3>
                                                <p className="text-xs text-white/30 line-clamp-2 mb-3">{course.description || "No description"}</p>
                                                <div className="flex items-center justify-between text-[11px] text-white/20">
                                                    <div className="flex items-center gap-3">
                                                        {course.estimated_hours > 0 && <span className="flex items-center gap-1"><Clock size={10} />{course.estimated_hours}h</span>}
                                                        <span className="flex items-center gap-1"><BookOpen size={10} />{totalLessons} lessons</span>
                                                        {(course.enrollment_count || 0) > 0 && <span className="flex items-center gap-1"><Users size={10} />{course.enrollment_count}</span>}
                                                    </div>
                                                    {(course.avg_rating || 0) > 0 && (
                                                        <span className="flex items-center gap-1"><Star size={10} className="text-yellow-400" />{course.avg_rating}</span>
                                                    )}
                                                </div>
                                                {course.tags && course.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                                        {course.tags.slice(0, 4).map((tag) => (
                                                            <span key={tag} className="px-2 py-0.5 rounded bg-surface-3/50 text-[10px] text-white/20 border border-white/[0.04]">{tag}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
