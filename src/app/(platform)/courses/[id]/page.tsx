"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import {
    getCourse,
    enrollInCourse,
    getCourseProgress,
    completeLesson,
    addReview,
    getReviews,
} from "@/lib/services/courseService";
import type { Course, Lesson, Section } from "@/lib/services/courseService";
import {
    BookOpen,
    Clock,
    Users,
    Star,
    ArrowLeft,
    ChevronRight,
    Play,
    FileText,
    Video,
    Code2,
    HelpCircle,
    ClipboardList,
    CheckCircle2,
    Circle,
    Loader2,
    Send,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const LESSON_ICONS: Record<string, any> = {
    text: FileText,
    video: Video,
    code_challenge: Code2,
    quiz: HelpCircle,
    assignment: ClipboardList,
};

const toSlug = (value?: string) =>
    (value || "untitled")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

const getSectionKey = (section: Partial<Section>, sectionIndex: number) => {
    const id = typeof section._id === "string" ? section._id.trim() : "";
    if (id) return id;
    return `section-${sectionIndex}-${toSlug(section.title)}`;
};

const getLessonKey = (sectionKey: string, lesson: Partial<Lesson>, lessonIndex: number) => {
    const id = typeof lesson._id === "string" ? lesson._id.trim() : "";
    if (id) return id;
    return `${sectionKey}-lesson-${lessonIndex}-${toSlug(lesson.title)}`;
};

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    useAuth();
    const courseId = params?.id as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [enrolled, setEnrolled] = useState(false);
    const [progress, setProgress] = useState<any>(null);
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
    const [activeLesson, setActiveLesson] = useState<{ section: Section; lesson: Lesson } | null>(null);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [reviews, setReviews] = useState<any[]>([]);
    const [reviewText, setReviewText] = useState("");
    const [reviewRating, setReviewRating] = useState(5);
    const [submittingReview, setSubmittingReview] = useState(false);

    const fetchCourse = useCallback(async () => {
        if (!courseId) return;
        try {
            const res = await getCourse(courseId);
            if (res.success) {
                setCourse(res.course);
                // Auto-expand first section
                if (res.course.sections?.length) {
                    const firstSectionKey = getSectionKey(res.course.sections[0], 0);
                    setExpandedSections(new Set([firstSectionKey]));
                }
            } else {
                router.push("/courses");
            }
        } catch {
            router.push("/courses");
        } finally {
            setLoading(false);
        }
    }, [courseId, router]);

    const fetchProgress = useCallback(async () => {
        if (!courseId) return;
        try {
            const res = await getCourseProgress(courseId);
            if (res.success) {
                setEnrolled(true);
                setProgress(res);
                setCompletedLessons(new Set(res.completed_lessons || []));
            }
        } catch {
            // Not enrolled
        }
    }, [courseId]);

    const fetchReviews = useCallback(async () => {
        if (!courseId) return;
        try {
            const res = await getReviews(courseId);
            if (res.success) setReviews(res.reviews || []);
        } catch {}
    }, [courseId]);

    useEffect(() => { fetchCourse(); }, [fetchCourse]);
    useEffect(() => { fetchProgress(); }, [fetchProgress]);
    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    const handleEnroll = async () => {
        setEnrolling(true);
        try {
            const res = await enrollInCourse(courseId);
            if (res.success) {
                setEnrolled(true);
                fetchProgress();
            }
        } catch (err: any) {
            if (err?.response?.status === 400) {
                setEnrolled(true);
                fetchProgress();
            } else {
                alert("Failed to enroll");
            }
        }
        setEnrolling(false);
    };

    const handleCompleteLesson = async (lessonId: string) => {
        try {
            await completeLesson(courseId, lessonId);
            setCompletedLessons((prev) => new Set(prev).add(lessonId));
            fetchProgress();
        } catch {}
    };

    const handleSubmitReview = async () => {
        if (!reviewText.trim()) return;
        setSubmittingReview(true);
        try {
            await addReview(courseId, reviewRating, reviewText);
            setReviewText("");
            setReviewRating(5);
            fetchReviews();
        } catch (err: any) {
            alert(err?.response?.data?.error || "Failed to submit review");
        }
        setSubmittingReview(false);
    };

    const toggleSection = (id: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-0 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-white/20" />
            </div>
        );
    }

    if (!course) return null;

    const totalLessons = course.sections?.reduce((a, s) => a + (s.lessons?.length || 0), 0) || 0;
    const progressPct = progress?.progress_percent || 0;

    // ── Lesson Player View ──
    if (activeLesson) {
        const lesson = activeLesson.lesson;
        const isCompleted = completedLessons.has(lesson._id);
        const LIcon = LESSON_ICONS[lesson.type] || FileText;

        return (
            <div className="min-h-screen bg-surface-0">
                <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-surface-0/90 backdrop-blur-xl border-b border-white/[0.04]">
                    <div className="h-full max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between">
                        <button onClick={() => setActiveLesson(null)} className="flex items-center gap-2 text-xs text-white/30 hover:text-white/50 transition-colors">
                            <ArrowLeft size={14} /> Back to course
                        </button>
                        <div className="flex items-center gap-3">
                            <LIcon size={14} className="text-white/20" />
                            <span className="text-sm font-semibold text-white truncate max-w-[300px]">{lesson.title}</span>
                        </div>
                        <div>
                            {enrolled && !isCompleted && (
                                <button onClick={() => handleCompleteLesson(lesson._id)}
                                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-400 text-surface-0 text-xs font-bold hover:bg-emerald-300 transition-colors">
                                    <CheckCircle2 size={12} /> Mark Complete
                                </button>
                            )}
                            {isCompleted && (
                                <span className="flex items-center gap-2 text-xs font-semibold text-emerald-400"><CheckCircle2 size={14} /> Completed</span>
                            )}
                        </div>
                    </div>
                </header>
                <main className="pt-14">
                    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
                        {lesson.type === "video" ? (
                            <div className="aspect-video rounded-xl overflow-hidden bg-surface-2 border border-white/[0.06] mb-6">
                                <iframe title={lesson.title || "Course video"} src={lesson.content} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                            </div>
                        ) : lesson.type === "quiz" ? (
                            <QuizPlayer content={lesson.content} />
                        ) : (
                            <div className="prose prose-invert prose-sm max-w-none bg-surface-2/50 rounded-xl border border-white/[0.06] p-8">
                                <SafeLessonContent content={lesson.content} />
                            </div>
                        )}
                    </div>
                </main>
            </div>
        );
    }

    // ── Course Detail View ──
    return (
        <div className="min-h-screen bg-surface-0">
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-0/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="h-full max-w-7xl mx-auto px-4 lg:px-8 flex items-center">
                    <Link href="/courses" className="flex items-center gap-2 text-xs font-medium text-white/30 hover:text-white/50 transition-colors">
                        <ArrowLeft size={14} /> All Courses
                    </Link>
                </div>
            </header>

            <main className="pt-16">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Course Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                        course.difficulty === "beginner" ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" :
                                        course.difficulty === "intermediate" ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" :
                                        "bg-red-400/10 text-red-400 border-red-400/20"
                                    }`}>{course.difficulty}</span>
                                    {enrolled && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-400/10 text-blue-400 border border-blue-400/20">Enrolled</span>}
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">{course.title}</h1>
                                <p className="text-sm text-white/40 mb-4">{course.description}</p>
                                <div className="flex items-center gap-5 text-xs text-white/25">
                                    {course.instructor_name && <span>By {course.instructor_name}</span>}
                                    <span className="flex items-center gap-1"><BookOpen size={12} />{totalLessons} lessons</span>
                                    {course.estimated_hours > 0 && <span className="flex items-center gap-1"><Clock size={12} />{course.estimated_hours}h</span>}
                                    {(course.enrollment_count || 0) > 0 && <span className="flex items-center gap-1"><Users size={12} />{course.enrollment_count} students</span>}
                                    {(course.avg_rating || 0) > 0 && <span className="flex items-center gap-1"><Star size={12} className="text-yellow-400" />{course.avg_rating}</span>}
                                </div>
                            </motion.div>

                            {/* Progress bar */}
                            {enrolled && (
                                <div className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-white/40">Progress</span>
                                        <span className="text-xs font-bold text-white">{progressPct}%</span>
                                    </div>
                                    <div className="h-2 bg-surface-3/60 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.8, ease }}
                                            className="h-full bg-yellow-400 rounded-full" />
                                    </div>
                                </div>
                            )}

                            {/* Sections & Lessons */}
                            <div className="space-y-3">
                                <h2 className="text-sm font-bold text-white mb-3">Course Content</h2>
                                {(course.sections || []).map((section, sectionIndex) => {
                                    const sectionKey = getSectionKey(section, sectionIndex);
                                    const isExpanded = expandedSections.has(sectionKey);
                                    return (
                                        <div key={sectionKey} className="bg-surface-2/50 rounded-xl border border-white/[0.06] overflow-hidden">
                                            <button onClick={() => toggleSection(sectionKey)}
                                                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left">
                                                <ChevronRight size={14} className={`text-white/20 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                                <span className="flex-1 text-sm font-semibold text-white">{section.title}</span>
                                                <span className="text-[10px] text-white/15">{section.lessons?.length || 0} lessons</span>
                                            </button>
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                                        <div className="px-5 pb-4 border-t border-white/[0.04] pt-2 space-y-1">
                                                            {(section.lessons || []).map((lesson, lessonIndex) => {
                                                                const lessonKey = getLessonKey(sectionKey, lesson, lessonIndex);
                                                                const LIcon = LESSON_ICONS[lesson.type] || FileText;
                                                                const done = typeof lesson._id === "string" && lesson._id ? completedLessons.has(lesson._id) : false;
                                                                return (
                                                                    <button key={lessonKey}
                                                                        onClick={() => enrolled ? setActiveLesson({ section, lesson }) : handleEnroll()}
                                                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors text-left">
                                                                        {done ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0" /> : <Circle size={14} className="text-white/10 shrink-0" />}
                                                                        <LIcon size={14} className="text-white/20 shrink-0" />
                                                                        <span className={`flex-1 text-xs font-medium ${done ? "text-white/40" : "text-white/60"}`}>{lesson.title}</span>
                                                                        {lesson.duration_minutes > 0 && <span className="text-[10px] text-white/15">{lesson.duration_minutes}m</span>}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Reviews */}
                            <div className="space-y-4">
                                <h2 className="text-sm font-bold text-white">Reviews</h2>
                                {enrolled && (
                                    <div className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-5 space-y-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs text-white/30">Rating:</span>
                                            {[1, 2, 3, 4, 5].map((n) => (
                                                <button key={n} onClick={() => setReviewRating(n)}>
                                                    <Star size={16} className={n <= reviewRating ? "text-yellow-400 fill-yellow-400" : "text-white/10"} />
                                                </button>
                                            ))}
                                        </div>
                                        <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={3} placeholder="Write your review..."
                                            className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/70 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors resize-none" />
                                        <button onClick={handleSubmitReview} disabled={!reviewText.trim() || submittingReview}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-surface-0 text-xs font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50">
                                            {submittingReview ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                            Submit Review
                                        </button>
                                    </div>
                                )}
                                {reviews.length === 0 ? (
                                    <p className="text-xs text-white/15 py-8 text-center">No reviews yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {reviews.map((r, i) => (
                                            <div key={i} className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="flex items-center gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((n) => (
                                                            <Star key={n} size={10} className={n <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-white/10"} />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] text-white/20">{r.user_name || "Student"}</span>
                                                </div>
                                                <p className="text-xs text-white/40">{r.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 bg-surface-2/50 rounded-xl border border-white/[0.06] p-6 space-y-5">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-emerald-400 mb-1">Free</p>
                                    <p className="text-xs text-white/20">Full access to all content</p>
                                </div>
                                {!enrolled ? (
                                    <button onClick={handleEnroll} disabled={enrolling}
                                        className="w-full py-3 rounded-xl bg-yellow-400 text-surface-0 text-sm font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                        {enrolling ? <><Loader2 size={14} className="animate-spin" /> Enrolling...</> : "Enroll Now"}
                                    </button>
                                ) : (
                                    <button onClick={() => {
                                        const first = course.sections?.[0]?.lessons?.[0];
                                        if (first) setActiveLesson({ section: course.sections[0], lesson: first });
                                    }}
                                        className="w-full py-3 rounded-xl bg-yellow-400 text-surface-0 text-sm font-bold hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2">
                                        <Play size={14} /> Continue Learning
                                    </button>
                                )}
                                <div className="space-y-3 text-xs text-white/30">
                                    <div className="flex justify-between"><span>Sections</span><span className="text-white/60 font-semibold">{course.sections?.length || 0}</span></div>
                                    <div className="flex justify-between"><span>Lessons</span><span className="text-white/60 font-semibold">{totalLessons}</span></div>
                                    {course.estimated_hours > 0 && <div className="flex justify-between"><span>Duration</span><span className="text-white/60 font-semibold">{course.estimated_hours}h</span></div>}
                                    <div className="flex justify-between"><span>Level</span><span className="text-white/60 font-semibold capitalize">{course.difficulty}</span></div>
                                </div>
                                {course.tags && course.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {course.tags.map((t) => (
                                            <span key={t} className="px-2 py-0.5 rounded bg-surface-3/50 text-[10px] text-white/20 border border-white/[0.04]">{t}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}


function SafeLessonContent({ content }: { content: unknown }) {
    let text = "*No content yet*";

    if (typeof content === "string") {
        text = content.trim() ? content : "*No content yet*";
    } else if (content !== null && content !== undefined) {
        try {
            text = JSON.stringify(content, null, 2);
        } catch {
            text = String(content);
        }
    }

    const lines = text.split(/\r?\n/);

    return (
        <div className="space-y-2">
            {lines.map((line, idx) => {
                const trimmed = line.trim();

                if (!trimmed) {
                    return <div key={idx} className="h-1" />;
                }

                if (trimmed.startsWith("### ")) {
                    return <h3 key={idx} className="text-base font-semibold text-white">{trimmed.slice(4)}</h3>;
                }

                if (trimmed.startsWith("## ")) {
                    return <h2 key={idx} className="text-lg font-bold text-white">{trimmed.slice(3)}</h2>;
                }

                if (trimmed.startsWith("# ")) {
                    return <h1 key={idx} className="text-xl font-bold text-white">{trimmed.slice(2)}</h1>;
                }

                if (trimmed.startsWith("- ")) {
                    return (
                        <p key={idx} className="text-sm text-white/70 leading-relaxed">
                            <span className="text-yellow-400 mr-2">•</span>
                            {trimmed.slice(2)}
                        </p>
                    );
                }

                return <p key={idx} className="text-sm text-white/70 leading-relaxed">{line}</p>;
            })}
        </div>
    );
}


// ── Quiz Player ──
function QuizPlayer({ content }: { content: string }) {
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [submitted, setSubmitted] = useState(false);

    type RenderQuestion =
        | {
            kind: "mcq";
            question: string;
            options: string[];
            correct: number;
        }
        | {
            kind: "coding";
            question: string;
            title?: string;
            difficulty?: string;
            companyTag?: string;
            whyAsked?: string;
            example?: string;
            hint?: string;
            solution?: string;
            complexity?: string;
        };

    const normalizeOptions = (rawOptions: unknown): string[] => {
        if (Array.isArray(rawOptions)) {
            return rawOptions.map((opt) => String(opt));
        }

        if (rawOptions && typeof rawOptions === "object") {
            return Object.values(rawOptions as Record<string, unknown>).map((opt) => String(opt));
        }

        if (typeof rawOptions === "string") {
            const trimmed = rawOptions.trim();
            if (!trimmed) return [];

            // Support legacy string formats like "A|B|C|D" or "A,B,C,D".
            if (trimmed.includes("|")) return trimmed.split("|").map((s) => s.trim()).filter(Boolean);
            if (trimmed.includes(",")) return trimmed.split(",").map((s) => s.trim()).filter(Boolean);

            return [trimmed];
        }

        return [];
    };

    const resolveCorrectIndex = (
        rawQuestion: Record<string, unknown>,
        options: string[],
        rawOptions: unknown
    ): number => {
        const candidates = [rawQuestion.correct, rawQuestion.correct_answer, rawQuestion.answer];

        for (const candidate of candidates) {
            if (typeof candidate === "number" && Number.isInteger(candidate)) {
                if (candidate >= 0 && candidate < options.length) return candidate;
                if (candidate > 0 && candidate <= options.length) return candidate - 1;
            }

            if (typeof candidate === "string") {
                const value = candidate.trim();
                if (!value) continue;

                if (/^\d+$/.test(value)) {
                    const n = Number(value);
                    if (n >= 0 && n < options.length) return n;
                    if (n > 0 && n <= options.length) return n - 1;
                }

                if (rawOptions && typeof rawOptions === "object" && !Array.isArray(rawOptions)) {
                    const keys = Object.keys(rawOptions as Record<string, unknown>);
                    const keyIndex = keys.findIndex((k) => k.toLowerCase() === value.toLowerCase());
                    if (keyIndex !== -1) return keyIndex;
                }

                const valueIndex = options.findIndex((opt) => opt.trim().toLowerCase() === value.toLowerCase());
                if (valueIndex !== -1) return valueIndex;
            }
        }

        return -1;
    };

    let parsed: unknown = [];
    try {
        parsed = JSON.parse(content);
    } catch {
        parsed = [];
    }

    const rawQuestions = Array.isArray(parsed)
        ? parsed
        : (parsed && typeof parsed === "object" && Array.isArray((parsed as { questions?: unknown }).questions)
            ? (parsed as { questions: unknown[] }).questions
            : []);

    const questions = rawQuestions
        .map((item) => {
            if (!item || typeof item !== "object") return null;

            const rawQuestion = item as Record<string, unknown>;
            const options = normalizeOptions(rawQuestion.options);
            const questionText =
                (typeof rawQuestion.question === "string" && rawQuestion.question.trim()) ||
                (typeof rawQuestion.problem_statement === "string" && rawQuestion.problem_statement.trim()) ||
                (typeof rawQuestion.title === "string" && rawQuestion.title.trim()) ||
                "Untitled question";
            const correct = resolveCorrectIndex(rawQuestion, options, rawQuestion.options);
            const typeValue = typeof rawQuestion.type === "string" ? rawQuestion.type.toLowerCase() : "";

            if (options.length) {
                return {
                    kind: "mcq",
                    question: questionText,
                    options,
                    correct,
                } as RenderQuestion;
            }

            const looksLikeCoding =
                typeValue === "coding" ||
                typeof rawQuestion.problem_statement === "string" ||
                typeof rawQuestion.optimal_solution_python === "string" ||
                typeof rawQuestion.time_space_complexity === "string";

            if (looksLikeCoding) {
                return {
                    kind: "coding",
                    question: questionText,
                    title: typeof rawQuestion.title === "string" ? rawQuestion.title : undefined,
                    difficulty: typeof rawQuestion.difficulty === "string" ? rawQuestion.difficulty : undefined,
                    companyTag: typeof rawQuestion.company_tag === "string" ? rawQuestion.company_tag : undefined,
                    whyAsked: typeof rawQuestion.why_asked === "string" ? rawQuestion.why_asked : undefined,
                    example: typeof rawQuestion.example === "string" ? rawQuestion.example : undefined,
                    hint: typeof rawQuestion.hint === "string" ? rawQuestion.hint : undefined,
                    solution: typeof rawQuestion.optimal_solution_python === "string" ? rawQuestion.optimal_solution_python : undefined,
                    complexity: typeof rawQuestion.time_space_complexity === "string" ? rawQuestion.time_space_complexity : undefined,
                } as RenderQuestion;
            }

            return null;
        })
        .filter((q): q is RenderQuestion => Boolean(q));

    if (!questions.length) {
        return <p className="text-sm text-white/30 text-center py-8">No quiz questions available</p>;
    }

    const mcqQuestions = questions.filter((q): q is Extract<RenderQuestion, { kind: "mcq" }> => q.kind === "mcq");
    const score = Object.entries(answers).filter(([i, a]) => {
        const q = questions[Number(i)];
        return q?.kind === "mcq" && q.correct === a;
    }).length;

    return (
        <div className="space-y-6">
            {questions.map((q, i) => (
                <div key={i} className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-6">
                    {q.kind === "mcq" ? (
                        <>
                            <p className="text-sm font-semibold text-white mb-4">{i + 1}. {q.question}</p>
                            <div className="space-y-2">
                                {q.options.map((opt, oi) => {
                                    const isSelected = answers[i] === oi;
                                    const isCorrect = submitted && q.correct === oi;
                                    const isWrong = submitted && isSelected && q.correct !== oi;
                                    return (
                                        <button key={oi} onClick={() => !submitted && setAnswers({ ...answers, [i]: oi })}
                                            className={`w-full text-left px-4 py-3 rounded-lg border text-xs font-medium transition-all ${
                                                isCorrect ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-400" :
                                                isWrong ? "bg-red-400/10 border-red-400/30 text-red-400" :
                                                isSelected ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400" :
                                                "bg-surface-3/30 border-white/[0.06] text-white/50 hover:border-white/[0.1]"
                                            }`}>
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                {q.title && <span className="text-sm font-semibold text-white">{i + 1}. {q.title}</span>}
                                {q.difficulty && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">{q.difficulty}</span>}
                                {q.companyTag && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-400/10 text-blue-400 border border-blue-400/20">{q.companyTag}</span>}
                            </div>
                            <p className="text-sm text-white/80">{q.question}</p>
                            {q.whyAsked && (
                                <div>
                                    <p className="text-[10px] uppercase tracking-wide text-white/30 mb-1">Why Asked</p>
                                    <p className="text-xs text-white/65">{q.whyAsked}</p>
                                </div>
                            )}
                            {q.example && (
                                <div>
                                    <p className="text-[10px] uppercase tracking-wide text-white/30 mb-1">Example</p>
                                    <p className="text-xs text-white/65">{q.example}</p>
                                </div>
                            )}
                            {q.hint && (
                                <div>
                                    <p className="text-[10px] uppercase tracking-wide text-white/30 mb-1">Hint</p>
                                    <p className="text-xs text-white/65">{q.hint}</p>
                                </div>
                            )}
                            {q.solution && (
                                <div>
                                    <p className="text-[10px] uppercase tracking-wide text-white/30 mb-1">Optimal Solution (Python)</p>
                                    <pre className="text-xs text-emerald-300 bg-black/25 border border-white/[0.06] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{q.solution}</pre>
                                </div>
                            )}
                            {q.complexity && (
                                <div>
                                    <p className="text-[10px] uppercase tracking-wide text-white/30 mb-1">Complexity</p>
                                    <p className="text-xs text-white/65">{q.complexity}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
            {mcqQuestions.length > 0 && !submitted ? (
                <button onClick={() => setSubmitted(true)}
                    className="px-6 py-3 rounded-xl bg-yellow-400 text-surface-0 text-sm font-bold hover:bg-yellow-300 transition-colors">
                    Submit Quiz
                </button>
            ) : mcqQuestions.length > 0 ? (
                <div className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-6 text-center">
                    <p className="text-lg font-bold text-white mb-1">Score: {score}/{mcqQuestions.length}</p>
                    <p className="text-xs text-white/25">{score === mcqQuestions.length ? "Perfect score!" : "Review your answers above"}</p>
                </div>
            ) : null}
        </div>
    );
}
