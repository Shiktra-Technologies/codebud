"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { getUserSubmissions } from "@/lib/services/submissionService";
import { leaderboardService } from "@/lib/services/leaderboardService";
import {
    User,
    Mail,
    Shield,
    ArrowLeft,
    LogOut,
    Trophy,
    Code2,
    Brain,
    CheckCircle2,
    XCircle,
    BarChart3,
    Calendar,
    Clock,
    Edit3,
    Save,
    X,
    FileText,
    Loader2,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

interface Submission {
    test_type?: string;
    testType?: string;
    score?: number;
    total_questions?: number;
    totalQuestions?: number;
    timestamp?: string;
    createdAt?: string;
    [key: string]: unknown;
}

export default function ProfilePage() {
    const { user, userRole, logout } = useAuth();
    const router = useRouter();

    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [rank, setRank] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState("");

    const displayName = (user as any)?.display_name || (user as any)?.displayName || user?.email?.split("@")[0] || "User";
    const email = user?.email || "";
    const initial = (typeof displayName === "string" ? displayName : "U").charAt(0).toUpperCase();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const userId = (user as any)?._id || (user as any)?.id || "";
                if (userId) {
                    const [subs, userRank] = await Promise.all([
                        getUserSubmissions(userId).catch(() => []),
                        Promise.resolve().then(() => leaderboardService.getUserRank(userId)).catch(() => null),
                    ]);
                    const list = Array.isArray(subs) ? subs : (subs as any)?.submissions || [];
                    setSubmissions(list);
                    if (userRank && typeof userRank === "object" && "rank" in (userRank as any)) {
                        setRank((userRank as any).rank);
                    }
                }
            } catch {
                // ignore
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    useEffect(() => {
        setEditName(typeof displayName === "string" ? displayName : "");
    }, [displayName]);

    const handleLogout = async () => {
        await logout();
        router.push("/auth");
    };

    const handleSaveName = () => {
        // Save to localStorage as a local override
        if (editName.trim()) {
            localStorage.setItem("codebud_display_name", editName.trim());
        }
        setEditing(false);
    };

    // Stats
    const totalTests = submissions.length;
    const passedTests = submissions.filter((s) => {
        const sc = s.score || 0;
        const t = s.total_questions || s.totalQuestions || 1;
        return (sc / t) * 100 >= 60;
    }).length;
    const avgScore = totalTests > 0
        ? Math.round(submissions.reduce((acc, s) => {
            const sc = s.score || 0;
            const t = s.total_questions || s.totalQuestions || 1;
            return acc + (sc / t) * 100;
        }, 0) / totalTests)
        : 0;
    const dsaCount = submissions.filter((s) => (s.test_type || s.testType || "").toLowerCase().includes("dsa")).length;
    const aptCount = submissions.filter((s) => (s.test_type || s.testType || "").toLowerCase().includes("aptitude")).length;
    const latestSub = submissions.length > 0
        ? submissions.sort((a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime())[0]
        : null;

    const formatDate = (ts?: string) => {
        if (!ts) return "—";
        return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    return (
        <div className="min-h-screen bg-surface-0">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <Link href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-yellow-400 transition-colors mb-8 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    Back to Dashboard
                </Link>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
                    {/* Profile Card */}
                    <div className="relative bg-surface-2/50 rounded-2xl border border-white/[0.06] p-8 overflow-hidden mb-6">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(255,193,7,0.04) 0%, transparent 70%)" }} />

                        <div className="relative flex flex-col items-center mb-8">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-2xl font-bold text-surface-0 shadow-[0_0_40px_rgba(255,193,7,0.2)] mb-4">
                                {initial}
                            </div>

                            {editing ? (
                                <div className="flex items-center gap-2 mb-1">
                                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                                        className="px-3 py-1.5 rounded-lg bg-surface-3/50 border border-white/[0.1] text-white text-center text-lg font-bold outline-none focus:border-yellow-400/30"
                                        autoFocus />
                                    <button onClick={handleSaveName} className="p-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/20 transition-colors">
                                        <Save size={14} />
                                    </button>
                                    <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-white/30 hover:text-white/50 transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-xl font-bold text-white">{displayName}</h1>
                                    <button onClick={() => setEditing(true)} className="p-1 rounded text-white/15 hover:text-white/40 transition-colors">
                                        <Edit3 size={13} />
                                    </button>
                                </div>
                            )}

                            <p className="text-sm text-white/30">{email}</p>
                            <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
                                <Shield size={12} className="text-yellow-400" />
                                <span className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
                                    {userRole || "student"}
                                </span>
                            </div>
                        </div>

                        {/* Info Fields */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-3/30 border border-white/[0.06]">
                                <User size={16} className="text-white/30 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs text-white/30 uppercase tracking-wider font-semibold">Display Name</p>
                                    <p className="text-sm text-white/80">{displayName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-3/30 border border-white/[0.06]">
                                <Mail size={16} className="text-white/30 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs text-white/30 uppercase tracking-wider font-semibold">Email</p>
                                    <p className="text-sm text-white/80">{email}</p>
                                </div>
                            </div>
                            {rank !== null && (
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-3/30 border border-white/[0.06]">
                                    <Trophy size={16} className="text-yellow-400/50 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-xs text-white/30 uppercase tracking-wider font-semibold">Rank</p>
                                        <p className="text-sm text-white/80">#{rank}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button onClick={handleLogout}
                            className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/15 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium">
                            <LogOut size={15} />
                            Sign Out
                        </button>
                    </div>

                    {/* Performance Stats */}
                    <div className="bg-surface-2/50 rounded-2xl border border-white/[0.06] p-6 mb-6">
                        <h2 className="text-sm font-bold text-white/60 mb-4 flex items-center gap-2">
                            <BarChart3 size={16} className="text-yellow-400/50" />
                            Performance Overview
                        </h2>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 size={20} className="animate-spin text-white/20" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: "Tests Taken", value: totalTests, icon: FileText, color: "text-white/50" },
                                    { label: "Avg Score", value: `${avgScore}%`, icon: BarChart3, color: avgScore >= 60 ? "text-emerald-400" : "text-yellow-400" },
                                    { label: "Passed", value: passedTests, icon: CheckCircle2, color: "text-emerald-400" },
                                    { label: "Failed", value: totalTests - passedTests, icon: XCircle, color: "text-red-400" },
                                ].map((s) => (
                                    <div key={s.label} className="bg-surface-3/30 rounded-xl p-4 border border-white/[0.04]">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <s.icon size={12} className={s.color} />
                                            <span className="text-[10px] uppercase tracking-wider text-white/20">{s.label}</span>
                                        </div>
                                        <p className="text-xl font-bold text-white">{s.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Test Breakdown */}
                    <div className="bg-surface-2/50 rounded-2xl border border-white/[0.06] p-6 mb-6">
                        <h2 className="text-sm font-bold text-white/60 mb-4 flex items-center gap-2">
                            <Brain size={16} className="text-purple-400/50" />
                            Test Breakdown
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-surface-3/30 rounded-xl p-4 border border-white/[0.04]">
                                <div className="flex items-center gap-2 mb-3">
                                    <Brain size={16} className="text-purple-400" />
                                    <span className="text-sm font-semibold text-white/60">Aptitude</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{aptCount}</p>
                                <p className="text-[10px] text-white/15 uppercase tracking-wider mt-1">Tests completed</p>
                            </div>
                            <div className="bg-surface-3/30 rounded-xl p-4 border border-white/[0.04]">
                                <div className="flex items-center gap-2 mb-3">
                                    <Code2 size={16} className="text-emerald-400" />
                                    <span className="text-sm font-semibold text-white/60">DSA</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{dsaCount}</p>
                                <p className="text-[10px] text-white/15 uppercase tracking-wider mt-1">Challenges completed</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Submissions */}
                    {!loading && submissions.length > 0 && (
                        <div className="bg-surface-2/50 rounded-2xl border border-white/[0.06] p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-bold text-white/60 flex items-center gap-2">
                                    <Clock size={16} className="text-white/25" />
                                    Recent Activity
                                </h2>
                                <Link href="/submitted" className="text-xs text-yellow-400/50 hover:text-yellow-400 transition-colors">
                                    View all →
                                </Link>
                            </div>
                            <div className="space-y-2">
                                {submissions.slice(0, 5).map((sub, i) => {
                                    const type = sub.test_type || sub.testType || "Test";
                                    const sc = sub.score || 0;
                                    const t = sub.total_questions || sub.totalQuestions || 1;
                                    const pct = Math.round((sc / t) * 100);
                                    const pass = pct >= 60;
                                    return (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-surface-3/20 border border-white/[0.03]">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${pass ? "bg-emerald-400/10" : "bg-red-400/10"}`}>
                                                {pass ? <CheckCircle2 size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-white/50 truncate">{type}</p>
                                                <p className="text-[10px] text-white/15">{formatDate(sub.timestamp || sub.createdAt)}</p>
                                            </div>
                                            <span className={`text-sm font-bold ${pass ? "text-emerald-400" : "text-red-400"}`}>{pct}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
