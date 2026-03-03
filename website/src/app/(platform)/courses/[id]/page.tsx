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
    ChevronDown,
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
import dynamic from "next/dynamic";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false, loading: () => <div className="animate-pulse h-20 bg-white/5 rounded-lg" /> });

const ease = [0.16, 1, 0.3, 1] as const;

const LESSON_ICONS: Record<string, any> = {
    text: FileText,
    video: Video,
    code_challenge: Code2,
    quiz: HelpCircle,
    assignment: ClipboardList,
};

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
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
                    setExpandedSections(new Set([res.course.sections[0]._id]));
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
                                <iframe src={lesson.content} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                            </div>
                        ) : lesson.type === "quiz" ? (
                            <QuizPlayer content={lesson.content} />
                        ) : (
                            <div className="prose prose-invert prose-sm max-w-none bg-surface-2/50 rounded-xl border border-white/[0.06] p-8">
                                <ReactMarkdown>{lesson.content || "*No content yet*"}</ReactMarkdown>
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
                                {(course.sections || []).map((section) => {
                                    const isExpanded = expandedSections.has(section._id);
                                    return (
                                        <div key={section._id} className="bg-surface-2/50 rounded-xl border border-white/[0.06] overflow-hidden">
                                            <button onClick={() => toggleSection(section._id)}
                                                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left">
                                                <ChevronRight size={14} className={`text-white/20 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                                <span className="flex-1 text-sm font-semibold text-white">{section.title}</span>
                                                <span className="text-[10px] text-white/15">{section.lessons?.length || 0} lessons</span>
                                            </button>
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                                        <div className="px-5 pb-4 border-t border-white/[0.04] pt-2 space-y-1">
                                                            {(section.lessons || []).map((lesson) => {
                                                                const LIcon = LESSON_ICONS[lesson.type] || FileText;
                                                                const done = completedLessons.has(lesson._id);
                                                                return (
                                                                    <button key={lesson._id}
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


// ── Quiz Player ──
function QuizPlayer({ content }: { content: string }) {
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [submitted, setSubmitted] = useState(false);

    let questions: { question: string; options: string[]; correct: number }[] = [];
    try { questions = JSON.parse(content); } catch {}

    if (!questions.length) {
        return <p className="text-sm text-white/30 text-center py-8">No quiz questions available</p>;
    }

    const score = Object.entries(answers).filter(([i, a]) => questions[Number(i)]?.correct === a).length;

    return (
        <div className="space-y-6">
            {questions.map((q, i) => (
                <div key={i} className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-6">
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
                </div>
            ))}
            {!submitted ? (
                <button onClick={() => setSubmitted(true)}
                    className="px-6 py-3 rounded-xl bg-yellow-400 text-surface-0 text-sm font-bold hover:bg-yellow-300 transition-colors">
                    Submit Quiz
                </button>
            ) : (
                <div className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-6 text-center">
                    <p className="text-lg font-bold text-white mb-1">Score: {score}/{questions.length}</p>
                    <p className="text-xs text-white/25">{score === questions.length ? "Perfect score!" : "Review your answers above"}</p>
                </div>
            )}
        </div>
    );
}
