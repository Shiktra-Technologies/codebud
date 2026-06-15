"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
    Users, BarChart3, FileText, BookOpen, LayoutDashboard,
    TrendingUp, Clock, MessageSquare, Target, ChevronRight,
    Loader2, AlertCircle, GraduationCap, Award, Activity
} from "lucide-react";
import {
    getMentorDashboardStats,
    getMentorStudents,
    type DashboardStats,
    type MentorStudent,
} from "@/lib/services/mentorService";
import BootSequence from "@/app/components/BootSequence";
import MentorTasksWidget from "./_components/MentorTasksWidget";
import AlertsDropdown from "@/lib/components/AlertsDropdown";
import ActivityTimelineWidget from "@/lib/components/ActivityTimelineWidget";

const ease = [0.16, 1, 0.3, 1] as const;

type Tab = "overview" | "students" | "analytics" | "submissions" | "practice";

const SIDEBAR_ITEMS: { id: Tab; label: string; icon: React.ElementType; group: string }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, group: "Main" },
    { id: "students", label: "My Students", icon: Users, group: "Main" },
    { id: "analytics", label: "Analytics", icon: BarChart3, group: "Academic" },
    { id: "submissions", label: "Submissions", icon: FileText, group: "Academic" },
    { id: "practice", label: "Practice Sets", icon: BookOpen, group: "Tools" },
];

function StatCard({ label, value, icon: Icon, color, delay }: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease }}
            className="relative bg-surface-1/80 backdrop-blur-xl rounded-2xl border border-white/[0.06] p-5 overflow-hidden group hover:border-white/[0.1] transition-all duration-300"
        >
            <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none" style={{
                background: `radial-gradient(circle, ${color}08 0%, transparent 70%)`,
            }} />
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-2xl font-bold text-white">{value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ backgroundColor: `${color}15` }}>
                    <Icon size={18} style={{ color }} />
                </div>
            </div>
        </motion.div>
    );
}

// ──────── Students Tab ────────

function StudentsTab({ students, loading, onSelectStudent }: {
    students: MentorStudent[];
    loading: boolean;
    onSelectStudent: (id: string) => void;
}) {
    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-yellow-400 animate-spin" /></div>;
    }

    if (!students.length) {
        return (
            <div className="text-center py-20">
                <Users className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">No students assigned yet.</p>
                <p className="text-white/20 text-xs mt-1">Ask your admin to assign students to you.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Assigned Students</h3>
                <span className="text-xs text-white/30 bg-surface-2/50 px-2.5 py-1 rounded-full">{students.length} students</span>
            </div>
            {students.map((s, i) => (
                <motion.button
                    key={s._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, ease }}
                    onClick={() => onSelectStudent(s._id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-2/30 border border-white/[0.04] hover:border-yellow-400/20 hover:bg-surface-2/50 transition-all duration-200 text-left group"
                >
                    <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 font-bold text-sm shrink-0">
                        {(s.display_name || s.email)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{s.display_name || s.email.split('@')[0]}</p>
                        <p className="text-xs text-white/30 truncate">{s.email}</p>
                    </div>
                    <div className="text-xs text-white/20">
                        {s.last_active ? new Date(s.last_active).toLocaleDateString() : 'Never'}
                    </div>
                    <ChevronRight size={14} className="text-white/10 group-hover:text-yellow-400/50 transition-colors" />
                </motion.button>
            ))}
        </div>
    );
}

// ──────── Analytics Tab (Student Detail) ────────

function AnalyticsTab({ students, loading, preSelectedStudent, onClearPreSelected }: {
    students: MentorStudent[];
    loading: boolean;
    preSelectedStudent?: string | null;
    onClearPreSelected?: () => void;
}) {
    const [selectedStudent, setSelectedStudent] = useState<string | null>(preSelectedStudent || null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    // Sync preSelectedStudent prop
    useEffect(() => {
        if (preSelectedStudent) {
            setSelectedStudent(preSelectedStudent);
            onClearPreSelected?.();
        }
    }, [preSelectedStudent, onClearPreSelected]);

    const loadAnalytics = useCallback(async (studentId: string) => {
        setLoadingAnalytics(true);
        try {
            const { getStudentAnalytics } = await import("@/lib/services/mentorService");
            const data = await getStudentAnalytics(studentId);
            setAnalytics(data);
        } catch {
            setAnalytics(null);
        }
        setLoadingAnalytics(false);
    }, []);

    useEffect(() => {
        if (selectedStudent) loadAnalytics(selectedStudent);
    }, [selectedStudent, loadAnalytics]);

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-yellow-400 animate-spin" /></div>;
    }

    if (!selectedStudent) {
        return (
            <div>
                <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Select a Student</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {students.map((s) => (
                        <button
                            key={s._id}
                            onClick={() => setSelectedStudent(s._id)}
                            className="flex items-center gap-3 p-4 rounded-xl bg-surface-2/30 border border-white/[0.04] hover:border-yellow-400/20 hover:bg-surface-2/50 transition-all text-left"
                        >
                            <div className="w-9 h-9 rounded-lg bg-yellow-400/10 flex items-center justify-center text-yellow-400 font-bold text-sm">
                                {(s.display_name || s.email)[0].toUpperCase()}
                            </div>
                            <span className="text-sm text-white">{s.display_name || s.email.split('@')[0]}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    const student = students.find(s => s._id === selectedStudent);

    return (
        <div>
            <button
                onClick={() => { setSelectedStudent(null); setAnalytics(null); }}
                className="text-xs text-white/30 hover:text-yellow-400 mb-4 flex items-center gap-1 transition-colors"
            >
                ← Back to students
            </button>

            <h3 className="text-lg font-bold text-white mb-4">
                {student?.display_name || 'Student'} — Analytics
            </h3>

            {loadingAnalytics ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-yellow-400 animate-spin" /></div>
            ) : analytics?.analytics ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-surface-2/30 border border-white/[0.04] rounded-xl p-4">
                            <p className="text-xs text-white/30 mb-1">Avg Aptitude</p>
                            <p className="text-xl font-bold text-yellow-400">{analytics.analytics.aptitude.avg_score}%</p>
                        </div>
                        <div className="bg-surface-2/30 border border-white/[0.04] rounded-xl p-4">
                            <p className="text-xs text-white/30 mb-1">DSA Pass Rate</p>
                            <p className="text-xl font-bold text-green-400">{analytics.analytics.dsa.pass_rate}%</p>
                        </div>
                        <div className="bg-surface-2/30 border border-white/[0.04] rounded-xl p-4">
                            <p className="text-xs text-white/30 mb-1">Total Submissions</p>
                            <p className="text-xl font-bold text-white">{analytics.analytics.dsa.total_submissions}</p>
                        </div>
                        <div className="bg-surface-2/30 border border-white/[0.04] rounded-xl p-4">
                            <p className="text-xs text-white/30 mb-1">Time Spent</p>
                            <p className="text-xl font-bold text-blue-400">{Math.round(analytics.analytics.time_spent / 60)}m</p>
                        </div>
                    </div>

                    {/* Score history */}
                    {analytics.analytics.aptitude.scores.length > 0 && (
                        <div className="bg-surface-2/30 border border-white/[0.04] rounded-xl p-4">
                            <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Recent Aptitude Scores</p>
                            <div className="flex items-end gap-1 h-24">
                                {analytics.analytics.aptitude.scores.slice(0, 15).map((s: any, i: number) => (
                                    <div
                                        key={i}
                                        className="flex-1 bg-yellow-400/20 rounded-t-sm hover:bg-yellow-400/40 transition-colors"
                                        style={{ height: `${Math.max(s.score, 5)}%` }}
                                        title={`${s.score}% — ${new Date(s.date).toLocaleDateString()}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-white/30 text-sm text-center py-10">No analytics data available yet.</p>
            )}

            <div className="mt-8">
                {student && <ActivityTimelineWidget studentId={student._id} isMentor={true} />}
            </div>
        </div>
    );
}

// ──────── Submissions Tab (Aptitude + DSA + Feedback History) ────────

function SubmissionsTab({ students, loading }: {
    students: MentorStudent[];
    loading: boolean;
}) {
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [codeSubmissions, setCodeSubmissions] = useState<any[]>([]);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loadingSubs, setLoadingSubs] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const [feedbackTarget, setFeedbackTarget] = useState<string | null>(null);
    const [subView, setSubView] = useState<"aptitude" | "dsa" | "feedback">("aptitude");

    // Edit feedback state
    const [editingFeedback, setEditingFeedback] = useState<string | null>(null);
    const [editText, setEditText] = useState("");

    const loadSubmissions = useCallback(async (studentId: string) => {
        setLoadingSubs(true);
        try {
            const { getStudentSubmissions, getStudentCodeSubmissions, getStudentFeedback } = await import("@/lib/services/mentorService");
            const [aptData, dsaData, fbData] = await Promise.all([
                getStudentSubmissions(studentId),
                getStudentCodeSubmissions(studentId),
                getStudentFeedback(studentId),
            ]);
            setSubmissions(aptData);
            setCodeSubmissions(dsaData);
            setFeedbacks(fbData);
        } catch {
            setSubmissions([]);
            setCodeSubmissions([]);
            setFeedbacks([]);
        }
        setLoadingSubs(false);
    }, []);

    useEffect(() => {
        if (selectedStudent) loadSubmissions(selectedStudent);
    }, [selectedStudent, loadSubmissions]);

    const handleFeedback = async (submissionId: string) => {
        if (!feedbackText.trim() || !selectedStudent) return;
        try {
            const { addFeedback } = await import("@/lib/services/mentorService");
            await addFeedback({
                student_id: selectedStudent,
                submission_id: submissionId,
                feedback: feedbackText,
                category: 'general',
            });
            setFeedbackText("");
            setFeedbackTarget(null);
            // Reload feedback list
            const { getStudentFeedback } = await import("@/lib/services/mentorService");
            setFeedbacks(await getStudentFeedback(selectedStudent));
        } catch { /* ignore */ }
    };

    const handleEditFeedback = async (feedbackId: string) => {
        if (!editText.trim()) return;
        try {
            const { updateFeedback } = await import("@/lib/services/mentorService");
            await updateFeedback(feedbackId, { feedback: editText });
            setEditingFeedback(null);
            setEditText("");
            if (selectedStudent) {
                const { getStudentFeedback } = await import("@/lib/services/mentorService");
                setFeedbacks(await getStudentFeedback(selectedStudent));
            }
        } catch { /* ignore */ }
    };

    const handleDeleteFeedback = async (feedbackId: string) => {
        try {
            const { deleteFeedback } = await import("@/lib/services/mentorService");
            await deleteFeedback(feedbackId);
            if (selectedStudent) {
                const { getStudentFeedback } = await import("@/lib/services/mentorService");
                setFeedbacks(await getStudentFeedback(selectedStudent));
            }
        } catch { /* ignore */ }
    };

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-yellow-400 animate-spin" /></div>;
    }

    if (!selectedStudent) {
        return (
            <div>
                <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Select Student to Review</h3>
                {students.length === 0 ? (
                    <p className="text-white/20 text-xs text-center py-10">No students assigned yet.</p>
                ) : (
                    <div className="space-y-2">
                        {students.map(s => (
                            <button
                                key={s._id}
                                onClick={() => setSelectedStudent(s._id)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-2/30 border border-white/[0.04] hover:border-yellow-400/20 text-left transition-all"
                            >
                                <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center text-yellow-400 font-bold text-xs">
                                    {(s.display_name || s.email)[0].toUpperCase()}
                                </div>
                                <span className="text-sm text-white">{s.display_name || s.email.split('@')[0]}</span>
                                <ChevronRight size={14} className="ml-auto text-white/10" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    const student = students.find(s => s._id === selectedStudent);

    return (
        <div>
            <button
                onClick={() => { setSelectedStudent(null); setSubmissions([]); setCodeSubmissions([]); setFeedbacks([]); setSubView("aptitude"); }}
                className="text-xs text-white/30 hover:text-yellow-400 mb-4 flex items-center gap-1 transition-colors"
            >
                ← Back
            </button>
            <h3 className="text-lg font-bold text-white mb-4">
                {student?.display_name || student?.email?.split('@')[0]} — Submissions
            </h3>

            {/* Sub-tabs */}
            <div className="flex gap-2 mb-5">
                {([
                    { id: "aptitude" as const, label: "Aptitude", count: submissions.length },
                    { id: "dsa" as const, label: "DSA Code", count: codeSubmissions.length },
                    { id: "feedback" as const, label: "Feedback History", count: feedbacks.length },
                ]).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSubView(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${subView === tab.id
                                ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
                                : "bg-surface-2/50 border-white/[0.06] text-white/40 hover:text-white/60"
                            }`}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {loadingSubs ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-yellow-400 animate-spin" /></div>
            ) : (
                <>
                    {/* Aptitude Submissions */}
                    {subView === "aptitude" && (
                        submissions.length === 0 ? (
                            <p className="text-white/30 text-sm text-center py-10">No aptitude submissions yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {submissions.map((sub: any) => (
                                    <div key={sub._id} className="bg-surface-2/30 border border-white/[0.04] rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <span className="text-xs font-semibold text-white/40 uppercase">{sub.test_type || 'Test'}</span>
                                                <p className="text-sm font-medium text-white">Score: {sub.score}/{sub.total_questions}</p>
                                            </div>
                                            <span className="text-xs text-white/20">{sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : ''}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            {feedbackTarget === sub._id ? (
                                                <div className="flex-1 flex gap-2">
                                                    <input
                                                        value={feedbackText}
                                                        onChange={e => setFeedbackText(e.target.value)}
                                                        placeholder="Type feedback..."
                                                        className="flex-1 bg-surface-3/50 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-400/30"
                                                    />
                                                    <button
                                                        onClick={() => handleFeedback(sub._id)}
                                                        className="px-3 py-1.5 bg-yellow-400 text-black text-xs font-semibold rounded-lg hover:bg-yellow-300 transition-colors"
                                                    >
                                                        Send
                                                    </button>
                                                    <button onClick={() => setFeedbackTarget(null)} className="text-xs text-white/30 hover:text-white/50">Cancel</button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setFeedbackTarget(sub._id)}
                                                    className="flex items-center gap-1 text-xs text-yellow-400/60 hover:text-yellow-400 transition-colors"
                                                >
                                                    <MessageSquare size={12} /> Add Feedback
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* DSA Code Submissions */}
                    {subView === "dsa" && (
                        codeSubmissions.length === 0 ? (
                            <p className="text-white/30 text-sm text-center py-10">No DSA code submissions yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {codeSubmissions.map((sub: any) => (
                                    <div key={sub._id} className="bg-surface-2/30 border border-white/[0.04] rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="text-sm font-medium text-white">{sub.problem_title || sub.problem_id || 'DSA Problem'}</p>
                                                <span className="text-xs text-white/30">{sub.language || 'Unknown'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${sub.status === 'passed' || sub.passed ? "bg-green-400/10 text-green-400" :
                                                        sub.status === 'failed' ? "bg-red-400/10 text-red-400" :
                                                            "bg-white/5 text-white/30"
                                                    }`}>
                                                    {sub.status || (sub.passed ? 'Passed' : 'Failed')}
                                                </span>
                                                <span className="text-xs text-white/20">{sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : ''}</span>
                                            </div>
                                        </div>
                                        {sub.code && (
                                            <pre className="mt-2 p-3 bg-surface-3/50 rounded-lg text-[11px] text-white/60 overflow-x-auto max-h-32 font-mono">
                                                {sub.code.slice(0, 500)}{sub.code.length > 500 ? '...' : ''}
                                            </pre>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                            {feedbackTarget === `dsa_${sub._id}` ? (
                                                <div className="flex-1 flex gap-2">
                                                    <input
                                                        value={feedbackText}
                                                        onChange={e => setFeedbackText(e.target.value)}
                                                        placeholder="Type feedback on this code..."
                                                        className="flex-1 bg-surface-3/50 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-400/30"
                                                    />
                                                    <button
                                                        onClick={() => handleFeedback(sub._id)}
                                                        className="px-3 py-1.5 bg-yellow-400 text-black text-xs font-semibold rounded-lg hover:bg-yellow-300 transition-colors"
                                                    >
                                                        Send
                                                    </button>
                                                    <button onClick={() => setFeedbackTarget(null)} className="text-xs text-white/30 hover:text-white/50">Cancel</button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setFeedbackTarget(`dsa_${sub._id}`)}
                                                    className="flex items-center gap-1 text-xs text-yellow-400/60 hover:text-yellow-400 transition-colors"
                                                >
                                                    <MessageSquare size={12} /> Add Feedback
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* Feedback History */}
                    {subView === "feedback" && (
                        feedbacks.length === 0 ? (
                            <p className="text-white/30 text-sm text-center py-10">No feedback given yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {feedbacks.map((fb: any) => (
                                    <div key={fb._id} className="bg-surface-2/30 border border-white/[0.04] rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${fb.category === 'code_quality' ? "bg-purple-400/10 text-purple-400" :
                                                        fb.category === 'approach' ? "bg-blue-400/10 text-blue-400" :
                                                            fb.category === 'optimization' ? "bg-green-400/10 text-green-400" :
                                                                "bg-white/5 text-white/30"
                                                    }`}>
                                                    {fb.category || 'general'}
                                                </span>
                                                {fb.rating && (
                                                    <span className="text-xs text-yellow-400">
                                                        {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-white/20">
                                                {fb.created_at ? new Date(fb.created_at).toLocaleDateString() : ''}
                                                {fb.updated_at && <span className="ml-1 text-white/10">(edited)</span>}
                                            </span>
                                        </div>

                                        {editingFeedback === fb._id ? (
                                            <div className="flex gap-2 mt-1">
                                                <input
                                                    value={editText}
                                                    onChange={e => setEditText(e.target.value)}
                                                    className="flex-1 bg-surface-3/50 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-400/30"
                                                />
                                                <button
                                                    onClick={() => handleEditFeedback(fb._id)}
                                                    className="px-3 py-1.5 bg-yellow-400 text-black text-xs font-semibold rounded-lg hover:bg-yellow-300 transition-colors"
                                                >
                                                    Save
                                                </button>
                                                <button onClick={() => setEditingFeedback(null)} className="text-xs text-white/30 hover:text-white/50">Cancel</button>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-white/70">{fb.feedback}</p>
                                        )}

                                        <div className="flex items-center gap-3 mt-2">
                                            <button
                                                onClick={() => { setEditingFeedback(fb._id); setEditText(fb.feedback); }}
                                                className="text-[10px] text-white/20 hover:text-yellow-400 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFeedback(fb._id)}
                                                className="text-[10px] text-white/20 hover:text-red-400 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </>
            )}
        </div>
    );
}

// ──────── Practice Sets Tab ────────

function PracticeTab({ students }: { students: MentorStudent[] }) {
    const [sets, setSets] = useState<any[]>([]);
    const [loadingSets, setLoadingSets] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ title: "", description: "", problem_ids: "", deadline: "" });
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);

    const loadSets = useCallback(async () => {
        setLoadingSets(true);
        try {
            const { getPracticeSets } = await import("@/lib/services/mentorService");
            const data = await getPracticeSets();
            setSets(data);
        } catch { /* ignore */ }
        setLoadingSets(false);
    }, []);

    useEffect(() => { loadSets(); }, [loadSets]);

    const handleCreate = async () => {
        if (!form.title.trim()) return;
        setCreating(true);
        try {
            const { createPracticeSet } = await import("@/lib/services/mentorService");
            const pids = form.problem_ids.split(",").map(s => s.trim()).filter(Boolean);
            await createPracticeSet({
                title: form.title,
                description: form.description,
                problem_ids: pids,
                assigned_students: selectedStudents,
                deadline: form.deadline || undefined,
            });
            setShowCreate(false);
            setForm({ title: "", description: "", problem_ids: "", deadline: "" });
            setSelectedStudents([]);
            await loadSets();
        } catch { /* ignore */ }
        setCreating(false);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Practice Sets</h3>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="px-3 py-1.5 bg-yellow-400 text-black text-xs font-semibold rounded-lg hover:bg-yellow-300 transition-colors"
                >
                    {showCreate ? "Cancel" : "+ Create Set"}
                </button>
            </div>

            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-surface-2/30 border border-white/[0.06] rounded-xl p-5 mb-6 space-y-3"
                    >
                        <input
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="Practice set title"
                            className="w-full bg-surface-3/50 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-400/30"
                        />
                        <textarea
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Description (optional)"
                            rows={2}
                            className="w-full bg-surface-3/50 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-400/30 resize-none"
                        />
                        <input
                            value={form.problem_ids}
                            onChange={e => setForm(f => ({ ...f, problem_ids: e.target.value }))}
                            placeholder="Problem IDs (comma-separated, e.g. 1,2,3)"
                            className="w-full bg-surface-3/50 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-400/30"
                        />
                        <input
                            type="datetime-local"
                            value={form.deadline}
                            onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                            className="w-full bg-surface-3/50 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400/30"
                        />
                        <div>
                            <p className="text-xs text-white/30 mb-2">Assign to students:</p>
                            <div className="flex flex-wrap gap-2">
                                {students.map(s => (
                                    <button
                                        key={s._id}
                                        onClick={() => setSelectedStudents(prev =>
                                            prev.includes(s._id) ? prev.filter(id => id !== s._id) : [...prev, s._id]
                                        )}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${selectedStudents.includes(s._id)
                                                ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
                                                : "bg-surface-3/50 border-white/[0.06] text-white/40 hover:text-white/60"
                                            }`}
                                    >
                                        {s.display_name || s.email.split('@')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleCreate}
                            disabled={creating || !form.title.trim()}
                            className="w-full py-2.5 bg-yellow-400 text-black text-sm font-semibold rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {creating ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : "Create Practice Set"}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {loadingSets ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-yellow-400 animate-spin" /></div>
            ) : sets.length === 0 ? (
                <div className="text-center py-16">
                    <BookOpen className="w-12 h-12 text-white/10 mx-auto mb-3" />
                    <p className="text-white/30 text-sm">No practice sets yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sets.map((ps: any) => (
                        <div key={ps._id} className="bg-surface-2/30 border border-white/[0.04] rounded-xl p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-white">{ps.title}</p>
                                    {ps.description && <p className="text-xs text-white/30 mt-0.5">{ps.description}</p>}
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${ps.completion_rate >= 80 ? "bg-green-400/10 text-green-400" :
                                        ps.completion_rate >= 40 ? "bg-yellow-400/10 text-yellow-400" :
                                            "bg-white/5 text-white/30"
                                    }`}>
                                    {ps.completion_rate}% done
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-xs text-white/20">
                                <span>{ps.problem_ids?.length || 0} problems</span>
                                <span>{ps.assigned_students?.length || 0} students</span>
                                {ps.deadline && <span>Due: {new Date(ps.deadline).toLocaleDateString()}</span>}
                            </div>
                            {/* Completion bar */}
                            <div className="mt-3 h-1.5 bg-surface-3/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-yellow-400/60 rounded-full transition-all duration-500"
                                    style={{ width: `${ps.completion_rate}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ──────────── MAIN DASHBOARD ────────────

export default function MentorDashboardPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [students, setStudents] = useState<MentorStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [preSelectedStudent, setPreSelectedStudent] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsData, studentsData] = await Promise.all([
                getMentorDashboardStats(),
                getMentorStudents(),
            ]);
            setStats(statsData);
            setStudents(studentsData);
        } catch (err) {
            console.error("[MENTOR] Failed to load data:", err);
        }
        setLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleLogout = async () => {
        await logout();
        router.push("/auth");
    };

    // Group sidebar items
    const groups = SIDEBAR_ITEMS.reduce((acc, item) => {
        if (!acc[item.group]) acc[item.group] = [];
        acc[item.group].push(item);
        return acc;
    }, {} as Record<string, typeof SIDEBAR_ITEMS>);

    return (
        <BootSequence>
            <div className="min-h-screen bg-surface-0 flex">
                {/* ── Sidebar ── */}
                <aside className="w-64 bg-surface-1/50 backdrop-blur-xl border-r border-white/[0.04] flex flex-col shrink-0">
                    {/* Logo */}
                    <div className="p-6 border-b border-white/[0.04]">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-yellow-400 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,193,7,0.15)]">
                                <GraduationCap size={18} className="text-black" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">MyCodeBud</p>
                                <p className="text-[10px] text-yellow-400/60 uppercase tracking-wider font-semibold">Mentor Panel</p>
                            </div>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                        {Object.entries(groups).map(([group, items]) => (
                            <div key={group}>
                                <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.15em] mb-2 px-3">{group}</p>
                                <div className="space-y-1">
                                    {items.map((item) => {
                                        const Icon = item.icon;
                                        const active = activeTab === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => setActiveTab(item.id)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active
                                                        ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20"
                                                        : "text-white/40 hover:text-white/60 hover:bg-surface-2/30 border border-transparent"
                                                    }`}
                                            >
                                                <Icon size={16} />
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* User */}
                    <div className="p-4 border-t border-white/[0.04]">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center text-yellow-400 font-bold text-xs">
                                {(user?.display_name || user?.email || 'M')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-white truncate">{user?.display_name || user?.email}</p>
                                <p className="text-[10px] text-white/30">Mentor</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full py-2 text-xs font-medium text-white/30 hover:text-red-400 border border-white/[0.06] hover:border-red-400/20 rounded-lg transition-all"
                        >
                            Sign Out
                        </button>
                    </div>
                </aside>

                {/* ── Main Content ── */}
                <main className="flex-1 overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-surface-0/80 backdrop-blur-xl border-b border-white/[0.04] px-8 py-5 flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-white">
                                {SIDEBAR_ITEMS.find(i => i.id === activeTab)?.label || "Mentor Dashboard"}
                            </h1>
                            <p className="text-xs text-white/30 mt-0.5">
                                {students.length} students assigned • {stats?.practice_sets || 0} practice sets
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <AlertsDropdown />
                        </div>
                    </div>

                    <div className="p-8">
                        <AnimatePresence mode="wait">
                            {activeTab === "overview" && (
                                <motion.div
                                    key="overview"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {loading ? (
                                        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-yellow-400 animate-spin" /></div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                                <StatCard label="My Students" value={stats?.total_students || 0} icon={Users} color="#FBBF24" delay={0} />
                                                <StatCard label="Active Today" value={stats?.active_today || 0} icon={Activity} color="#34D399" delay={0.1} />
                                                <StatCard label="Avg Aptitude" value={`${stats?.avg_aptitude_score || 0}%`} icon={Award} color="#60A5FA" delay={0.2} />
                                                <StatCard label="DSA Pass Rate" value={`${stats?.dsa_pass_rate || 0}%`} icon={Target} color="#F472B6" delay={0.3} />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <StatCard label="DSA Submissions" value={stats?.dsa_submissions || 0} icon={FileText} color="#A78BFA" delay={0.4} />
                                                <StatCard label="Practice Sets" value={stats?.practice_sets || 0} icon={BookOpen} color="#FB923C" delay={0.5} />
                                                <StatCard label="Feedbacks Given" value={stats?.feedbacks_given || 0} icon={MessageSquare} color="#2DD4BF" delay={0.6} />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                                                <MentorTasksWidget />
                                            {/* Quick student list */}
                                            {students.length > 0 && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">Recent Students</p>
                                                        <button onClick={() => setActiveTab("students")} className="text-xs text-yellow-400/60 hover:text-yellow-400 transition-colors">View All →</button>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {students.slice(0, 4).map(s => (
                                                            <div key={s._id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-2/20 border border-white/[0.04]">
                                                                <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center text-yellow-400 font-bold text-xs">
                                                                    {(s.display_name || s.email)[0].toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm text-white font-medium">{s.display_name || s.email.split('@')[0]}</p>
                                                                    <p className="text-[10px] text-white/20">{s.email}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === "students" && (
                                <motion.div key="students" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                    <StudentsTab
                                        students={students}
                                        loading={loading}
                                        onSelectStudent={(id) => { setPreSelectedStudent(id); setActiveTab("analytics"); }}
                                    />
                                </motion.div>
                            )}

                            {activeTab === "analytics" && (
                                <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                    <AnalyticsTab students={students} loading={loading} preSelectedStudent={preSelectedStudent} onClearPreSelected={() => setPreSelectedStudent(null)} />
                                </motion.div>
                            )}

                            {activeTab === "submissions" && (
                                <motion.div key="submissions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                    <SubmissionsTab students={students} loading={loading} />
                                </motion.div>
                            )}

                            {activeTab === "practice" && (
                                <motion.div key="practice" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                    <PracticeTab students={students} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </BootSequence>
    );
}
