"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { submitTest } from "@/lib/services/submissionService";
import { useProctor, Violation } from "@/lib/context/ProctorContext";
import ViolationModal from "@/app/components/proctoring/ViolationModal";
import ViolationWarningPopup from "@/app/components/proctoring/ViolationWarningPopup";
import {
    ArrowLeft,
    Clock,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Trophy,
    RotateCcw,
    Home,
    Flag,
    Shield,
    ShieldAlert,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

// ─── Sample Questions ─────────────────────────────────────────────────────────

const aptitudeQuestions = [
    { id: 1, question: "If a train travels 360 km in 4 hours, what is its speed in km/hr?", options: ["80 km/hr", "90 km/hr", "100 km/hr", "70 km/hr"], correct: 1 },
    { id: 2, question: "What is the next number in the sequence: 2, 6, 12, 20, 30, ?", options: ["40", "42", "44", "36"], correct: 1 },
    { id: 3, question: "A shopkeeper sells an item at 20% profit. If the cost price is ₹500, what is the selling price?", options: ["₹550", "₹600", "₹650", "₹580"], correct: 1 },
    { id: 4, question: "If 5 workers can complete a task in 12 days, how many days will 10 workers take?", options: ["24 days", "6 days", "8 days", "10 days"], correct: 1 },
    { id: 5, question: "What is 15% of 240?", options: ["30", "36", "42", "48"], correct: 1 },
    { id: 6, question: "In a class of 40 students, 25 play cricket and 20 play football. If 10 play both, how many play neither?", options: ["5", "10", "15", "0"], correct: 0 },
    { id: 7, question: "Which number is the odd one out: 3, 5, 11, 14, 17, 21?", options: ["21", "14", "__(no answer)", "3"], correct: 1 },
    { id: 8, question: "If the ratio of boys to girls is 3:5 and there are 120 girls, how many boys are there?", options: ["72", "80", "60", "96"], correct: 0 },
    { id: 9, question: "A car depreciates 10% each year. If it costs ₹5,00,000, what is its value after 1 year?", options: ["₹4,50,000", "₹4,00,000", "₹4,75,000", "₹4,25,000"], correct: 0 },
    { id: 10, question: "Complete the analogy: Pen : Write :: Knife : ?", options: ["Sharp", "Cut", "Steel", "Blade"], correct: 1 },
    { id: 11, question: "If A is 3 times as old as B and B is 4 years older than C who is 6 years old, how old is A?", options: ["30", "24", "36", "18"], correct: 0 },
    { id: 12, question: "What is the compound interest on ₹10,000 at 10% per annum for 2 years?", options: ["₹2,000", "₹2,100", "₹1,900", "₹2,200"], correct: 1 },
    { id: 13, question: "How many triangles are in a hexagon divided from the center?", options: ["4", "5", "6", "8"], correct: 2 },
    { id: 14, question: "If MOUSE is coded as PRXVH, how is CHAIR coded?", options: ["FKDLU", "FKDLU", "EKDLU", "FLDMU"], correct: 0 },
    { id: 15, question: "A boat goes 12 km downstream in 1 hour and returns in 2 hours. What is the boat's speed in still water?", options: ["8 km/hr", "9 km/hr", "10 km/hr", "6 km/hr"], correct: 1 },
    { id: 16, question: "Find the missing number: 1, 1, 2, 3, 5, 8, ?", options: ["11", "12", "13", "10"], correct: 2 },
    { id: 17, question: "If the area of a square is 144 sq.cm, what is the perimeter?", options: ["48 cm", "44 cm", "52 cm", "36 cm"], correct: 0 },
    { id: 18, question: "Two dice are thrown. What is the probability of getting a sum of 7?", options: ["1/6", "1/12", "5/36", "7/36"], correct: 0 },
    { id: 19, question: "A pipe can fill a tank in 6 hours. Another pipe can empty it in 8 hours. If both are open, how long to fill?", options: ["12 hours", "24 hours", "18 hours", "14 hours"], correct: 1 },
    { id: 20, question: "What day will it be 100 days from Monday?", options: ["Tuesday", "Wednesday", "Thursday", "Friday"], correct: 2 },
    { id: 21, question: "If sin θ = 3/5, what is cos θ?", options: ["4/5", "3/4", "5/3", "5/4"], correct: 0 },
    { id: 22, question: "A vendor buys 10 apples for ₹100 and sells them at ₹15 each. What is the profit %?", options: ["50%", "40%", "25%", "30%"], correct: 0 },
    { id: 23, question: "Which is the largest 3-digit prime number?", options: ["997", "991", "983", "999"], correct: 0 },
    { id: 24, question: "In how many ways can 5 people be seated in a row?", options: ["60", "120", "24", "720"], correct: 1 },
    { id: 25, question: "If log₂(x) = 5, what is x?", options: ["25", "32", "10", "64"], correct: 1 },
    { id: 26, question: "The average of 5 numbers is 20. If one number is removed, the average becomes 18. What number was removed?", options: ["28", "24", "30", "26"], correct: 0 },
    { id: 27, question: "A clock shows 3:15. What is the angle between the hour and minute hands?", options: ["0°", "7.5°", "15°", "22.5°"], correct: 1 },
    { id: 28, question: "If x² - 5x + 6 = 0, what are the roots?", options: ["2 and 3", "1 and 6", "-2 and -3", "1 and 5"], correct: 0 },
    { id: 29, question: "A rectangle has length 12 cm and diagonal 13 cm. What is the breadth?", options: ["5 cm", "7 cm", "8 cm", "6 cm"], correct: 0 },
    { id: 30, question: "Which planet is closest to the sun?", options: ["Venus", "Mercury", "Mars", "Earth"], correct: 1 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AptitudeTestPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { proctorState, startMonitoring, completeTestCleanup, videoRef } = useProctor();

    // Test state
    const [testStarted, setTestStarted] = useState(false);
    const [testFinished, setTestFinished] = useState(false);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>(new Array(aptitudeQuestions.length).fill(null));
    const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes
    const [submitting, setSubmitting] = useState(false);
    const [score, setScore] = useState(0);
    const [flagged, setFlagged] = useState<Set<number>>(new Set());

    // Proctoring UI state
    const [showViolationModal, setShowViolationModal] = useState(false);
    const [showWarningPopup, setShowWarningPopup] = useState(false);
    const [latestViolation, setLatestViolation] = useState<Violation | null>(null);
    const lastViolationCount = useRef(0);

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
        setSubmitting(true);

        let correct = 0;
        answers.forEach((ans, i) => {
            if (ans === aptitudeQuestions[i].correct) correct++;
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
    const progress = Math.round((answered / aptitudeQuestions.length) * 100);
    const isLowTime = timeLeft < 300; // less than 5 min

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
                            <p className="text-2xl font-bold text-white">{formatTime(45 * 60 - timeLeft)}</p>
                            <p className="text-[10px] text-white/25 uppercase tracking-wider">Time Taken</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-surface-3/50 border border-white/[0.06] text-sm font-medium text-white/50 hover:text-white/70 transition-colors">
                            <Home size={16} /> Dashboard
                        </Link>
                        <button onClick={() => { setTestStarted(false); setTestFinished(false); setAnswers(new Array(aptitudeQuestions.length).fill(null)); setTimeLeft(45 * 60); setFlagged(new Set()); setCurrentQ(0); lastViolationCount.current = 0; }}
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
