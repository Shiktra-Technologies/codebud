"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getUserSubmissions, getAllSubmissions } from "@/lib/services/submissionService";
import {
    FileText,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    Code2,
    Brain,
    ChevronDown,
    ArrowUpRight,
    Loader2,
    BarChart3,
    Calendar,
    Trophy,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

interface Submission {
    _id?: string;
    id?: string;
    test_type?: string;
    testType?: string;
    score?: number;
    total_questions?: number;
    totalQuestions?: number;
    timestamp?: string;
    createdAt?: string;
    result?: string;
    language?: string;
    userName?: string;
    userEmail?: string;
    [key: string]: unknown;
}

export default function SubmittedPage() {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState("All");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchSubmissions = async () => {
            setLoading(true);
            try {
                const userId = (user as any)?._id || (user as any)?.id || "";
                const role = (user as any)?.role || "student";
                let subs: any;
                if (role === "admin" || role === "superadmin") {
                    subs = await getAllSubmissions();
                } else if (userId) {
                    subs = await getUserSubmissions(userId);
                }
                const list = Array.isArray(subs) ? subs : subs?.submissions || [];
                setSubmissions(list.sort((a: any, b: any) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime()));
            } catch {
                setSubmissions([]);
            } finally {
                setLoading(false);
            }
        };
        fetchSubmissions();
    }, [user]);

    const types = ["All", ...Array.from(new Set(submissions.map((s) => s.test_type || s.testType || "Unknown")))];

    const filtered = submissions.filter((s) => {
        const type = s.test_type || s.testType || "Unknown";
        const matchType = typeFilter === "All" || type === typeFilter;
        const matchSearch = search === "" || (s.userName || "").toLowerCase().includes(search.toLowerCase()) || type.toLowerCase().includes(search.toLowerCase());
        return matchType && matchSearch;
    });

    const total = submissions.length;
    const avgScore = total > 0 ? Math.round(submissions.reduce((acc, s) => {
        const sc = s.score || 0;
        const t = s.total_questions || s.totalQuestions || 1;
        return acc + (sc / t) * 100;
    }, 0) / total) : 0;
    const passed = submissions.filter((s) => {
        const sc = s.score || 0;
        const t = s.total_questions || s.totalQuestions || 1;
        return (sc / t) * 100 >= 60;
    }).length;

    const formatDate = (ts?: string) => {
        if (!ts) return "—";
        const d = new Date(ts);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const getTypeIcon = (type: string) => {
        if (type.toLowerCase().includes("dsa")) return <Code2 size={14} className="text-emerald-400" />;
        if (type.toLowerCase().includes("aptitude")) return <Brain size={14} className="text-purple-400" />;
        return <FileText size={14} className="text-yellow-400" />;
    };

    return (
        <div className="min-h-screen bg-surface-0">
            {/* Header */}
            <div className="border-b border-white/[0.04]">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400/10 to-amber-500/5 border border-yellow-400/20 flex items-center justify-center">
                                <FileText size={20} className="text-yellow-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Submissions</h1>
                                <p className="text-xs text-white/25">Your test history and results</p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: "Total", value: total, icon: BarChart3, color: "text-white/50" },
                                { label: "Avg Score", value: `${avgScore}%`, icon: Trophy, color: avgScore >= 60 ? "text-emerald-400" : "text-yellow-400" },
                                { label: "Passed", value: passed, icon: CheckCircle2, color: "text-emerald-400" },
                                { label: "Failed", value: total - passed, icon: XCircle, color: "text-red-400" },
                            ].map((s) => (
                                <div key={s.label} className="bg-surface-2/40 rounded-xl p-4 border border-white/[0.04]">
                                    <div className="flex items-center gap-2 mb-1">
                                        <s.icon size={14} className={s.color} />
                                        <span className="text-[10px] uppercase tracking-wider text-white/20">{s.label}</span>
                                    </div>
                                    <p className="text-xl font-bold text-white">{s.value}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap items-center gap-3 border-b border-white/[0.03]">
                <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input type="text" placeholder="Search submissions..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-2/40 border border-white/[0.06] text-sm text-white/70 placeholder:text-white/15 outline-none focus:border-yellow-400/30 transition-colors" />
                </div>
                <div className="flex gap-1.5">
                    {types.map((t) => (
                        <button key={t} onClick={() => setTypeFilter(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                typeFilter === t ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20" : "bg-surface-3/30 text-white/25 border border-white/[0.04] hover:text-white/40"
                            }`}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Submissions List */}
            <div className="max-w-5xl mx-auto px-6 py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={24} className="animate-spin text-white/20" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <FileText size={32} className="mx-auto mb-3 text-white/10" />
                        <p className="text-sm text-white/25">No submissions yet</p>
                        <p className="text-xs text-white/15 mt-1">Take a test to see your results here</p>
                        <Link href="/dashboard" className="inline-flex items-center gap-1 mt-4 text-xs text-yellow-400/60 hover:text-yellow-400 transition-colors">
                            Go to Dashboard <ArrowUpRight size={12} />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((sub, i) => {
                            const type = sub.test_type || sub.testType || "Unknown";
                            const sc = sub.score || 0;
                            const total = sub.total_questions || sub.totalQuestions || 1;
                            const pct = Math.round((sc / total) * 100);
                            const pass = pct >= 60;

                            return (
                                <motion.div key={sub._id || sub.id || i}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, ease, delay: i * 0.03 }}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-surface-2/30 border border-white/[0.04] hover:border-white/[0.08] hover:bg-surface-2/50 transition-all">

                                    {/* Type Icon */}
                                    <div className="w-9 h-9 rounded-lg bg-surface-3/40 border border-white/[0.04] flex items-center justify-center shrink-0">
                                        {getTypeIcon(type)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="text-sm font-semibold text-white/70 truncate">{type}</h3>
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                                                pass ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/15" : "bg-red-400/10 text-red-400 border-red-400/15"
                                            }`}>{pass ? "PASS" : "FAIL"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] text-white/20">
                                            <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(sub.timestamp || sub.createdAt)}</span>
                                            {sub.language && <span className="flex items-center gap-1"><Code2 size={10} /> {sub.language}</span>}
                                            {sub.userName && <span>{sub.userName}</span>}
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div className="text-right shrink-0">
                                        <p className={`text-lg font-bold ${pass ? "text-emerald-400" : "text-red-400"}`}>{pct}%</p>
                                        <p className="text-[10px] text-white/15">{sc}/{total}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
