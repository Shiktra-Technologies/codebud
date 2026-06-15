"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { submitTest } from "@/lib/services/submissionService";
import { useProctor, Violation } from "@/lib/context/ProctorContext";
import { getAptitudeQuestions, type AptitudeQuestion } from "@/lib/services/aptitudeService";
import ViolationModal from "@/app/components/proctoring/ViolationModal";
import ViolationWarningPopup from "@/app/components/proctoring/ViolationWarningPopup";
import {
    Clock,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Trophy,
    RotateCcw,
    Home,
    Flag,
    ShieldAlert,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;
const TEST_DURATION_SECONDS = 45 * 60;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AptitudeTestPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { proctorState, startMonitoring, completeTestCleanup, videoRef } = useProctor();

    // Test state
    const [aptitudeQuestions, setAptitudeQuestions] = useState<AptitudeQuestion[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(true);
    const [questionsError, setQuestionsError] = useState("");
    const [testStarted, setTestStarted] = useState(false);
    const [testFinished, setTestFinished] = useState(false);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>([]);
    const [timeLeft, setTimeLeft] = useState(TEST_DURATION_SECONDS);
    const [submitting, setSubmitting] = useState(false);
    const [score, setScore] = useState(0);
    const [flagged, setFlagged] = useState<Set<number>>(new Set());

    // Proctoring UI state
    const [showViolationModal, setShowViolationModal] = useState(false);
    const [showWarningPopup, setShowWarningPopup] = useState(false);
    const [latestViolation, setLatestViolation] = useState<Violation | null>(null);
    const lastViolationCount = useRef(0);

    const fetchAptitudeQuestions = useCallback(async () => {
        setLoadingQuestions(true);
        setQuestionsError("");

        try {
            const res = await getAptitudeQuestions({ limit: 30 });
            const questions = Array.isArray(res?.questions) ? res.questions : [];

            if (res?.success && questions.length > 0) {
                setAptitudeQuestions(questions);
                setAnswers(new Array(questions.length).fill(null));
                setCurrentQ(0);
            } else {
                setQuestionsError(res?.error || "No aptitude questions found in the database.");
            }
        } catch (error: any) {
            setQuestionsError(error?.response?.data?.error || "Failed to load aptitude questions from server.");
        } finally {
            setLoadingQuestions(false);
        }
    }, []);

    useEffect(() => {
        fetchAptitudeQuestions();
    }, [fetchAptitudeQuestions]);

    // Auto-start test if coming from permissions page (permissions already granted)
    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        if (params.get("start") === "true" && !testStarted) {
            setTestStarted(true);
        }
    }, []);

    // Start proctoring when test starts
    useEffect(() => {
        if (testStarted && !testFinished) {
            startMonitoring();
        }
    }, [testStarted, testFinished]);

    // Watch for new violations
    useEffect(() => {
        if (proctorState.violationCount > lastViolationCount.current) {
            const newest = proctorState.violations[proctorState.violations.length - 1];
            setLatestViolation(newest);
            if (newest?.type === "CRITICAL") {
                setShowViolationModal(true);
            } else {
                setShowWarningPopup(true);
            }
            lastViolationCount.current = proctorState.violationCount;
        }
    }, [proctorState.violationCount, proctorState.violations]);

    // Auto-submit when proctoring triggers it
    useEffect(() => {
        if (proctorState.autoSubmitted && testStarted && !testFinished) {
            handleSubmit(true);
        }
    }, [proctorState.autoSubmitted]);

    // Timer
    useEffect(() => {
        if (!testStarted || testFinished) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [testStarted, testFinished]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const handleAnswer = (optionIdx: number) => {
        if (!aptitudeQuestions.length) return;
        const newAnswers = [...answers];
        newAnswers[currentQ] = optionIdx;
        setAnswers(newAnswers);
    };

    const toggleFlag = () => {
        const newFlagged = new Set(flagged);
        if (newFlagged.has(currentQ)) newFlagged.delete(currentQ);
        else newFlagged.add(currentQ);
        setFlagged(newFlagged);
    };

    const handleSubmit = async (dueToViolation = false) => {
        if (submitting) return;
        if (!aptitudeQuestions.length) return;
        setSubmitting(true);

        let correct = 0;
        answers.forEach((ans, i) => {
            if (ans !== null && ans === aptitudeQuestions[i]?.correct) correct++;
        });
        setScore(correct);

        // Cleanup proctoring
        completeTestCleanup();

        // Submit to backend
        try {
            const userId = (user as any)?._id || (user as any)?.id || "";
            if (userId) {
                await submitTest(userId, {
                    test_type: "Aptitude Test",
                    testType: "Aptitude Test",
                    score: correct,
                    total_questions: aptitudeQuestions.length,
                    totalQuestions: aptitudeQuestions.length,
                    answers,
                    userName: (user as any)?.display_name || (user as any)?.displayName || user?.email?.split("@")[0],
                    userEmail: user?.email,
                    timestamp: new Date().toISOString(),
                    // Proctoring data
                    violationCount: proctorState.violationCount,
                    violations: proctorState.violations,
                    autoSubmitted: dueToViolation || proctorState.autoSubmitted,
                    submittedDueToViolation: dueToViolation,
                });
            }
        } catch {
            // Silently fail - score is shown regardless
        }

        setTestFinished(true);
        setSubmitting(false);
    };

    const answered = answers.filter((a) => a !== null).length;
    const progress = aptitudeQuestions.length ? Math.round((answered / aptitudeQuestions.length) * 100) : 0;
    const isLowTime = timeLeft < 300; // less than 5 min

    if (loadingQuestions) {
        return (
            <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-sm text-white/60">Loading aptitude questions from database...</p>
                </div>
            </div>
        );
    }

    if (questionsError || aptitudeQuestions.length === 0) {
        return (
            <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
                <div className="max-w-lg w-full bg-surface-2/50 rounded-2xl border border-white/[0.06] p-8 text-center">
                    <h1 className="text-xl font-bold text-white mb-2">Question Bank Unavailable</h1>
                    <p className="text-sm text-white/35 mb-6">{questionsError || "No aptitude questions are available."}</p>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchAptitudeQuestions}
                            className="flex-1 py-3 rounded-xl bg-yellow-400 text-surface-0 text-sm font-bold hover:bg-yellow-300 transition-colors"
                        >
                            Retry
                        </button>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="flex-1 py-3 rounded-xl bg-surface-3/50 border border-white/[0.06] text-sm font-medium text-white/60 hover:text-white/80 transition-colors"
                        >
                            Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Landing (Pre-test) ───────────────────────────────────────────────

    if (!testStarted) {
        return (
            <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
                    className="max-w-lg w-full bg-surface-2/50 rounded-2xl border border-white/[0.06] p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-yellow-400/10 to-amber-500/5 border border-yellow-400/20 flex items-center justify-center">
                        <Clock size={28} className="text-yellow-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Aptitude Assessment</h1>
                    <p className="text-sm text-white/30 mb-6">Test your analytical and problem-solving skills</p>
                    <div className="grid grid-cols-3 gap-3 mb-6 text-center">
                        <div className="bg-surface-3/40 rounded-xl p-3 border border-white/[0.04]">
                            <p className="text-lg font-bold text-white">{aptitudeQuestions.length}</p>
                            <p className="text-[10px] text-white/25 uppercase tracking-wider">Questions</p>
                        </div>
                        <div className="bg-surface-3/40 rounded-xl p-3 border border-white/[0.04]">
                            <p className="text-lg font-bold text-white">45</p>
                            <p className="text-[10px] text-white/25 uppercase tracking-wider">Minutes</p>
                        </div>
                        <div className="bg-surface-3/40 rounded-xl p-3 border border-white/[0.04]">
                            <p className="text-lg font-bold text-white">60%</p>
                            <p className="text-[10px] text-white/25 uppercase tracking-wider">Pass Mark</p>
                        </div>
                    </div>
                    <div className="text-left mb-6 space-y-2">
                        {[
                            "Camera & microphone will be monitored",
                            "Test runs in fullscreen mode",
                            "Tab switching and app switching is tracked",
                            "5 violations = automatic submission",
                            "Timer starts when you click Start",
                        ].map((rule, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-white/30">
                                <CheckCircle2 size={12} className="text-emerald-400/50 shrink-0" />
                                {rule}
                            </div>
                        ))}
                    </div>
                    <button onClick={() => router.push("/permissions?test=aptitude")}
                        className="w-full py-3 rounded-xl bg-yellow-400 text-surface-0 text-sm font-bold hover:bg-yellow-300 transition-colors shadow-[0_0_20px_rgba(255,193,7,0.15)]">
                        Start Assessment
                    </button>
                    <Link href="/dashboard" className="inline-block mt-4 text-xs text-white/25 hover:text-white/40 transition-colors">
                        ← Back to Dashboard
                    </Link>
                </motion.div>
            </div>
        );
    }

    // ─── Results ──────────────────────────────────────────────────────────

    if (testFinished) {
        const pct = Math.round((score / aptitudeQuestions.length) * 100);
        const passed = pct >= 60;
        return (
            <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease }}
                    className="max-w-lg w-full bg-surface-2/50 rounded-2xl border border-white/[0.06] p-8 text-center">
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${passed ? "bg-emerald-400/10 border border-emerald-400/20" : "bg-red-400/10 border border-red-400/20"}`}>
                        {passed ? <Trophy size={32} className="text-emerald-400" /> : <AlertTriangle size={32} className="text-red-400" />}
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">{passed ? "Congratulations!" : "Keep Practicing"}</h1>
                    <p className="text-sm text-white/30 mb-6">
                        {proctorState.autoSubmitted
                            ? "Your test was auto-submitted due to proctoring violations."
                            : passed
                                ? "You passed the aptitude assessment!"
                                : "You didn't pass this time. Review and try again."}
                    </p>
                    {proctorState.violationCount > 0 && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center gap-2">
                            <ShieldAlert size={16} className="text-red-400 shrink-0" />
                            <span className="text-xs text-red-400/80">
                                {proctorState.violationCount} proctoring violation{proctorState.violationCount > 1 ? "s" : ""} recorded
                            </span>
                        </div>
                    )}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-surface-3/40 rounded-xl p-4 border border-white/[0.04]">
                            <p className={`text-2xl font-bold ${passed ? "text-emerald-400" : "text-red-400"}`}>{pct}%</p>
                            <p className="text-[10px] text-white/25 uppercase tracking-wider">Score</p>
                        </div>
                        <div className="bg-surface-3/40 rounded-xl p-4 border border-white/[0.04]">
                            <p className="text-2xl font-bold text-white">{score}/{aptitudeQuestions.length}</p>
                            <p className="text-[10px] text-white/25 uppercase tracking-wider">Correct</p>
                        </div>
                        <div className="bg-surface-3/40 rounded-xl p-4 border border-white/[0.04]">
                            <p className="text-2xl font-bold text-white">{formatTime(TEST_DURATION_SECONDS - timeLeft)}</p>
                            <p className="text-[10px] text-white/25 uppercase tracking-wider">Time Taken</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-surface-3/50 border border-white/[0.06] text-sm font-medium text-white/50 hover:text-white/70 transition-colors">
                            <Home size={16} /> Dashboard
                        </Link>
                        <button onClick={() => { setTestStarted(false); setTestFinished(false); setAnswers(new Array(aptitudeQuestions.length).fill(null)); setTimeLeft(TEST_DURATION_SECONDS); setFlagged(new Set()); setCurrentQ(0); lastViolationCount.current = 0; }}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-400 text-surface-0 text-sm font-bold hover:bg-yellow-300 transition-colors">
                            <RotateCcw size={16} /> Retake
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ─── Test UI ──────────────────────────────────────────────────────────

    const q = aptitudeQuestions[currentQ];
    if (!q) {
        return (
            <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
                <p className="text-sm text-white/40">Unable to load this question.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-0">
            {/* Hidden video for AI face detection */}
            <video ref={videoRef as React.RefObject<HTMLVideoElement>} autoPlay playsInline muted className="hidden" />

            {/* Violation Warning Popup */}
            <AnimatePresence>
                {showWarningPopup && latestViolation && (
                    <ViolationWarningPopup
                        violation={latestViolation}
                        violationCount={proctorState.violationCount}
                        maxViolations={proctorState.maxViolations}
                        onClose={() => setShowWarningPopup(false)}
                    />
                )}
            </AnimatePresence>

            {/* Violation Modal */}
            {showViolationModal && (
                <ViolationModal
                    violations={proctorState.violations}
                    onAcknowledge={() => setShowViolationModal(false)}
                    onSubmitTest={() => { setShowViolationModal(false); handleSubmit(true); }}
                />
            )}

            {/* Top bar */}
            <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-surface-1/80 backdrop-blur-2xl border-b border-white/[0.06]">
                <div className="h-full flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-white/80">Aptitude Test</span>
                        <span className="text-xs text-white/25">{currentQ + 1} / {aptitudeQuestions.length}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Violation counter */}
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${
                            proctorState.violationCount >= proctorState.maxViolations - 1
                                ? "bg-red-400/10 border-red-400/20 text-red-400"
                                : proctorState.violationCount > 0
                                    ? "bg-orange-400/10 border-orange-400/20 text-orange-400"
                                    : "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                        }`}>
                            <ShieldAlert size={12} />
                            <span className="tabular-nums">{proctorState.violationCount}/{proctorState.maxViolations}</span>
                        </div>
                        {/* Monitoring indicator */}
                        {proctorState.isMonitoring && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Live</span>
                            </div>
                        )}
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border ${isLowTime ? "bg-red-400/10 border-red-400/20 text-red-400" : "bg-surface-3/50 border-white/[0.06] text-white/60"}`}>
                            <Clock size={13} />
                            <span className="text-sm font-mono font-bold tabular-nums">{formatTime(timeLeft)}</span>
                        </div>
                        <button onClick={() => { if (confirm(`Submit test? You've answered ${answered}/${aptitudeQuestions.length} questions.`)) handleSubmit(); }}
                            className="px-4 py-1.5 rounded-lg bg-yellow-400 text-surface-0 text-xs font-bold hover:bg-yellow-300 transition-colors">
                            Submit
                        </button>
                    </div>
                </div>
                {/* Progress bar */}
                <div className="h-0.5 bg-surface-3/30">
                    <div className="h-full bg-yellow-400 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
            </header>

            <main className="pt-14 flex">
                {/* Question Navigator Sidebar (desktop) */}
                <aside className="hidden lg:block w-[200px] fixed left-0 top-14 h-[calc(100vh-56px)] bg-surface-1/50 border-r border-white/[0.04] p-4 overflow-y-auto">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/20 mb-3">Questions</p>
                    <div className="grid grid-cols-5 gap-1.5">
                        {aptitudeQuestions.map((_, i) => (
                            <button key={i} onClick={() => setCurrentQ(i)}
                                className={`w-full aspect-square rounded-lg text-[11px] font-bold flex items-center justify-center transition-all border ${
                                    currentQ === i
                                        ? "bg-yellow-400 text-surface-0 border-yellow-400"
                                        : answers[i] !== null
                                            ? "bg-emerald-400/15 text-emerald-400 border-emerald-400/20"
                                            : flagged.has(i)
                                                ? "bg-orange-400/15 text-orange-400 border-orange-400/20"
                                                : "bg-surface-3/30 text-white/25 border-white/[0.04] hover:border-white/[0.1]"
                                }`}>
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 space-y-1.5 text-[10px] text-white/20">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-400/15 border border-emerald-400/20" /> Answered</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-orange-400/15 border border-orange-400/20" /> Flagged</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-surface-3/30 border border-white/[0.04]" /> Unanswered</div>
                    </div>
                </aside>

                {/* Question Area */}
                <div className="flex-1 lg:ml-[200px] max-w-3xl mx-auto px-4 lg:px-8 py-8">
                    <AnimatePresence mode="wait">
                        <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2, ease }}>
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-xs font-semibold uppercase tracking-wider text-white/25">Question {currentQ + 1}</span>
                                <button onClick={toggleFlag}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${flagged.has(currentQ) ? "bg-orange-400/10 text-orange-400 border border-orange-400/20" : "text-white/25 hover:text-white/40 border border-white/[0.04]"}`}>
                                    <Flag size={12} />
                                    {flagged.has(currentQ) ? "Flagged" : "Flag"}
                                </button>
                            </div>
                            <h2 className="text-lg font-semibold text-white leading-relaxed mb-6">{q.question}</h2>
                            <div className="space-y-3">
                                {q.options.map((option, oi) => (
                                    <button key={oi} onClick={() => handleAnswer(oi)}
                                        className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 ${
                                            answers[currentQ] === oi
                                                ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
                                                : "bg-surface-2/50 border-white/[0.06] text-white/60 hover:border-white/[0.12] hover:bg-white/[0.02]"
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                                answers[currentQ] === oi
                                                    ? "bg-yellow-400 text-surface-0"
                                                    : "bg-surface-3/60 text-white/30"
                                            }`}>
                                                {String.fromCharCode(65 + oi)}
                                            </div>
                                            <span className="text-sm">{option}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8">
                        <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-xs font-medium text-white/40 hover:text-white/60 transition-all disabled:opacity-30">
                            <ChevronLeft size={14} /> Previous
                        </button>
                        {currentQ < aptitudeQuestions.length - 1 ? (
                            <button onClick={() => setCurrentQ(currentQ + 1)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-400 text-surface-0 text-xs font-bold hover:bg-yellow-300 transition-colors">
                                Next <ChevronRight size={14} />
                            </button>
                        ) : (
                            <button onClick={() => { if (confirm(`Submit test? You've answered ${answered}/${aptitudeQuestions.length} questions.`)) handleSubmit(false); }}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-400 text-surface-0 text-xs font-bold hover:bg-yellow-300 transition-colors">
                                <CheckCircle2 size={14} /> Submit Test
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
