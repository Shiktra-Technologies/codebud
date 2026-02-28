"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { submitTest } from "@/lib/services/submissionService";
import dsaService from "@/lib/services/dsaService";
import { useProctor, Violation } from "@/lib/context/ProctorContext";
import ViolationModal from "@/app/components/proctoring/ViolationModal";
import ViolationWarningPopup from "@/app/components/proctoring/ViolationWarningPopup";
import {
    ArrowLeft,
    Clock,
    Play,
    CheckCircle2,
    Code2,
    Terminal,
    Trophy,
    RotateCcw,
    Home,
    AlertTriangle,
    Loader2,
    ChevronDown,
    ShieldAlert,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const LANGUAGES = [
    { id: "python", label: "Python", ext: "py" },
    { id: "javascript", label: "JavaScript", ext: "js" },
    { id: "java", label: "Java", ext: "java" },
    { id: "cpp", label: "C++", ext: "cpp" },
];

interface Problem {
    id: string | number;
    title: string;
    description: string;
    difficulty: string;
    examples?: { input: string; output: string }[];
    constraints?: string[];
    starterCode?: Record<string, string>;
    [key: string]: unknown;
}

export default function DSATestPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { proctorState, startMonitoring, completeTestCleanup, videoRef } = useProctor();

    // Test state
    const [testStarted, setTestStarted] = useState(false);
    const [testFinished, setTestFinished] = useState(false);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [currentProblem, setCurrentProblem] = useState(0);
    const [loading, setLoading] = useState(false);

    // Editor state
    const [language, setLanguage] = useState("python");
    const [code, setCode] = useState("");
    const [running, setRunning] = useState(false);
    const [output, setOutput] = useState<string | null>(null);
    const [outputError, setOutputError] = useState(false);

    // Timer
    const [timeLeft, setTimeLeft] = useState(90 * 60);

    // Results
    const [score, setScore] = useState(0);
    const [solvedProblems, setSolvedProblems] = useState<Set<number>>(new Set());

    // Proctoring UI state
    const [showViolationModal, setShowViolationModal] = useState(false);
    const [showWarningPopup, setShowWarningPopup] = useState(false);
    const [latestViolation, setLatestViolation] = useState<Violation | null>(null);
    const lastViolationCount = useRef(0);

    // Auto-start test if coming from permissions page
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
            handleFinish(true);
        }
    }, [proctorState.autoSubmitted]);

    // Fetch problems
    useEffect(() => {
        const fetchProblems = async () => {
            setLoading(true);
            try {
                const result = await dsaService.getProblems();
                const problemList = Array.isArray(result) ? result : (result as any)?.problems || [];
                setProblems(problemList.length > 0 ? problemList : getDefaultProblems());
            } catch {
                setProblems(getDefaultProblems());
            } finally {
                setLoading(false);
            }
        };
        fetchProblems();
    }, []);

    // Set starter code when problem or language changes
    useEffect(() => {
        if (problems.length > 0) {
            const problem = problems[currentProblem];
            const starter = problem?.starterCode?.[language] || getDefaultStarter(language);
            setCode(starter);
            setOutput(null);
            setOutputError(false);
        }
    }, [currentProblem, language, problems]);

    // Timer
    useEffect(() => {
        if (!testStarted || testFinished) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleFinish();
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

    const handleRun = async () => {
        if (running) return;
        setRunning(true);
        setOutput(null);
        setOutputError(false);
        try {
            const problem = problems[currentProblem];
            const result: any = await dsaService.executeCode(String(problem.id), code, language);
            if (result?.error) {
                setOutput(result.error);
                setOutputError(true);
            } else {
                setOutput(result?.output || result?.result || JSON.stringify(result, null, 2));
                if (result?.passed || result?.allPassed) {
                    setSolvedProblems((prev) => new Set(prev).add(currentProblem));
                }
            }
        } catch (err: any) {
            setOutput(err.message || "Execution failed. Make sure the DSA server is running.");
            setOutputError(true);
        } finally {
            setRunning(false);
        }
    };

    const handleFinish = async (dueToViolation = false) => {
        const finalScore = solvedProblems.size;
        setScore(finalScore);

        // Cleanup proctoring
        completeTestCleanup();

        try {
            const userId = (user as any)?._id || (user as any)?.id || "";
            if (userId) {
                await submitTest(userId, {
                    test_type: "DSA Challenge",
                    testType: "DSA Challenge",
                    score: finalScore,
                    total_questions: problems.length,
                    totalQuestions: problems.length,
                    solvedProblems: Array.from(solvedProblems),
                    language,
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
            // Silently fail
        }

        setTestFinished(true);
    };

    const isLowTime = timeLeft < 600;

    // ─── Landing ──────────────────────────────────────────────────────────

    if (!testStarted) {
        return (
            <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
                    className="max-w-lg w-full bg-surface-2/50 rounded-2xl border border-white/[0.06] p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-400/10 to-green-500/5 border border-emerald-400/20 flex items-center justify-center">
                        <Code2 size={28} className="text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">DSA Challenge</h1>
                    <p className="text-sm text-white/30 mb-6">Solve data structures and algorithms problems</p>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-surface-3/40 rounded-xl p-3 border border-white/[0.04]">
                            <p className="text-lg font-bold text-white">{problems.length || "—"}</p>
                            <p className="text-[10px] text-white/25 uppercase tracking-wider">Problems</p>
                        </div>
                        <div className="bg-surface-3/40 rounded-xl p-3 border border-white/[0.04]">
                            <p className="text-lg font-bold text-white">90</p>
                            <p className="text-[10px] text-white/25 uppercase tracking-wider">Minutes</p>
                        </div>
                        <div className="bg-surface-3/40 rounded-xl p-3 border border-white/[0.04]">
                            <p className="text-lg font-bold text-white">4</p>
                            <p className="text-[10px] text-white/25 uppercase tracking-wider">Languages</p>
                        </div>
                    </div>
                    <div className="text-left mb-6 space-y-2">
                        {[
                            "Camera & microphone will be monitored",
                            "Test runs in fullscreen mode",
                            "Tab switching and app switching is tracked",
                            "5 violations = automatic submission",
                            "Write code in Python, JavaScript, Java, or C++",
                        ].map((rule, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-white/30">
                                <CheckCircle2 size={12} className="text-emerald-400/50 shrink-0" />
                                {rule}
                            </div>
                        ))}
                    </div>
                    <button onClick={() => router.push("/permissions?test=dsa")} disabled={loading || problems.length === 0}
                        className="w-full py-3 rounded-xl bg-yellow-400 text-surface-0 text-sm font-bold hover:bg-yellow-300 transition-colors shadow-[0_0_20px_rgba(255,193,7,0.15)] disabled:opacity-50">
                        {loading ? "Loading Problems…" : "Start Challenge"}
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
        const pct = problems.length > 0 ? Math.round((score / problems.length) * 100) : 0;
        const passed = pct >= 60;
        return (
            <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease }}
                    className="max-w-lg w-full bg-surface-2/50 rounded-2xl border border-white/[0.06] p-8 text-center">
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${passed ? "bg-emerald-400/10 border border-emerald-400/20" : "bg-red-400/10 border border-red-400/20"}`}>
                        {passed ? <Trophy size={32} className="text-emerald-400" /> : <AlertTriangle size={32} className="text-red-400" />}
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">{passed ? "Well Done!" : "Keep Coding"}</h1>
                    <p className="text-sm text-white/30 mb-6">
                        {proctorState.autoSubmitted
                            ? "Your test was auto-submitted due to proctoring violations."
                            : passed
                                ? "You passed the DSA challenge!"
                                : "Practice more and try again."}
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
                            <p className="text-2xl font-bold text-white">{score}/{problems.length}</p>
                            <p className="text-[10px] text-white/25 uppercase tracking-wider">Solved</p>
                        </div>
                        <div className="bg-surface-3/40 rounded-xl p-4 border border-white/[0.04]">
                            <p className="text-2xl font-bold text-white">{formatTime(90 * 60 - timeLeft)}</p>
                            <p className="text-[10px] text-white/25 uppercase tracking-wider">Time Used</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-surface-3/50 border border-white/[0.06] text-sm font-medium text-white/50 hover:text-white/70 transition-colors">
                            <Home size={16} /> Dashboard
                        </Link>
                        <button onClick={() => { setTestStarted(false); setTestFinished(false); setSolvedProblems(new Set()); setTimeLeft(90 * 60); setCurrentProblem(0); setCode(""); setOutput(null); lastViolationCount.current = 0; }}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-400 text-surface-0 text-sm font-bold hover:bg-yellow-300 transition-colors">
                            <RotateCcw size={16} /> Retake
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ─── Test UI ──────────────────────────────────────────────────────────

    const problem = problems[currentProblem] || { title: "Loading...", description: "", difficulty: "Medium" };

    return (
        <div className="min-h-screen bg-surface-0 flex flex-col">
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
                    onSubmitTest={() => { setShowViolationModal(false); handleFinish(true); }}
                />
            )}

            {/* Top bar */}
            <header className="h-12 bg-surface-1/80 backdrop-blur-2xl border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-white/80">DSA Challenge</span>
                    <div className="flex items-center gap-1">
                        {problems.map((_, i) => (
                            <button key={i} onClick={() => setCurrentProblem(i)}
                                className={`w-7 h-7 rounded-md text-[11px] font-bold flex items-center justify-center transition-all ${
                                    currentProblem === i
                                        ? "bg-yellow-400 text-surface-0"
                                        : solvedProblems.has(i)
                                            ? "bg-emerald-400/15 text-emerald-400 border border-emerald-400/20"
                                            : "bg-surface-3/30 text-white/25 border border-white/[0.04]"
                                }`}>
                                {i + 1}
                            </button>
                        ))}
                    </div>
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
                        <Clock size={12} />
                        <span className="text-xs font-mono font-bold tabular-nums">{formatTime(timeLeft)}</span>
                    </div>
                    <button onClick={() => { if (confirm("Submit your challenge?")) handleFinish(); }}
                        className="px-4 py-1.5 rounded-lg bg-yellow-400 text-surface-0 text-xs font-bold hover:bg-yellow-300 transition-colors">
                        Submit
                    </button>
                </div>
            </header>

            {/* Split Pane */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0">
                {/* Problem Description */}
                <div className="lg:w-[40%] border-b lg:border-b-0 lg:border-r border-white/[0.04] overflow-y-auto p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            problem.difficulty === "Easy" ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/15" :
                            problem.difficulty === "Hard" ? "bg-red-400/10 text-red-400 border-red-400/15" :
                            "bg-yellow-400/10 text-yellow-400 border-yellow-400/15"
                        }`}>{problem.difficulty}</span>
                    </div>
                    <h2 className="text-lg font-bold text-white mb-4">{problem.title}</h2>
                    <div className="prose prose-invert prose-sm max-w-none text-white/40 text-sm leading-relaxed whitespace-pre-wrap">
                        {problem.description}
                    </div>
                    {problem.examples && problem.examples.length > 0 && (
                        <div className="mt-6 space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/25">Examples</h4>
                            {problem.examples.map((ex: any, i: number) => (
                                <div key={i} className="bg-surface-3/30 rounded-lg p-3 border border-white/[0.04]">
                                    <p className="text-xs text-white/30 font-mono"><span className="text-white/50">Input:</span> {ex.input}</p>
                                    <p className="text-xs text-white/30 font-mono mt-1"><span className="text-white/50">Output:</span> {ex.output}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Code Editor + Output */}
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Editor Header */}
                    <div className="h-10 bg-surface-1/50 border-b border-white/[0.04] flex items-center justify-between px-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <Code2 size={13} className="text-white/25" />
                            <span className="text-xs text-white/40">Solution</span>
                        </div>
                        <div className="relative">
                            <select value={language} onChange={(e) => setLanguage(e.target.value)}
                                className="appearance-none pl-2 pr-6 py-1 rounded bg-surface-3/50 border border-white/[0.06] text-xs text-white/50 outline-none cursor-pointer">
                                {LANGUAGES.map((l) => (
                                    <option key={l.id} value={l.id}>{l.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                        </div>
                    </div>

                    {/* Code Area */}
                    <div className="flex-1 min-h-0 relative">
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="absolute inset-0 w-full h-full bg-surface-0 text-sm text-white/80 font-mono p-4 outline-none resize-none leading-relaxed"
                            placeholder="Write your solution here..."
                            spellCheck={false}
                        />
                    </div>

                    {/* Output Panel */}
                    <div className="h-[180px] border-t border-white/[0.04] flex flex-col shrink-0">
                        <div className="h-9 bg-surface-1/50 flex items-center justify-between px-4 border-b border-white/[0.04] shrink-0">
                            <div className="flex items-center gap-2">
                                <Terminal size={12} className="text-white/25" />
                                <span className="text-xs text-white/40">Output</span>
                            </div>
                            <button onClick={handleRun} disabled={running}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-400/10 border border-emerald-400/20 text-xs font-medium text-emerald-400 hover:bg-emerald-400/20 transition-colors disabled:opacity-50">
                                {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                                {running ? "Running…" : "Run Code"}
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {output === null ? (
                                <p className="text-xs text-white/15 font-mono">Click &quot;Run Code&quot; to execute your solution</p>
                            ) : (
                                <pre className={`text-xs font-mono whitespace-pre-wrap leading-relaxed ${outputError ? "text-red-400" : "text-emerald-400/80"}`}>
                                    {output}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDefaultProblems(): Problem[] {
    return [
        {
            id: "two-sum",
            title: "Two Sum",
            description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
            difficulty: "Easy",
            examples: [
                { input: "nums = [2,7,11,15], target = 9", output: "[0,1]" },
                { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
            ],
        },
        {
            id: "reverse-linked-list",
            title: "Reverse Linked List",
            description: "Given the head of a singly linked list, reverse the list, and return the reversed list.\n\nImplement both iterative and recursive approaches.",
            difficulty: "Easy",
            examples: [
                { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" },
            ],
        },
        {
            id: "binary-search",
            title: "Binary Search",
            description: "Given a sorted array of distinct integers and a target value, return the index if the target is found. If not, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.",
            difficulty: "Easy",
            examples: [
                { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4" },
                { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1" },
            ],
        },
    ];
}

function getDefaultStarter(language: string): string {
    switch (language) {
        case "python":
            return "def solution(nums, target):\n    # Write your solution here\n    pass\n";
        case "javascript":
            return "function solution(nums, target) {\n    // Write your solution here\n}\n";
        case "java":
            return "class Solution {\n    public int[] solution(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}\n";
        case "cpp":
            return "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> solution(vector<int>& nums, int target) {\n        // Write your solution here\n        return {};\n    }\n};\n";
        default:
            return "// Write your solution here\n";
    }
}
