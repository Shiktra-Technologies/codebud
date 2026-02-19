"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
    FileText,
    Search,
    RefreshCw,
    CheckCircle2,
    X,
    Clock,
    Filter,
    ChevronDown,
} from "lucide-react";
import { getAllSubmissions } from "@/lib/services/submissionService";

const ease = [0.16, 1, 0.3, 1] as const;

interface Submission {
    id?: string;
    _id?: string;
    userId?: string;
    userEmail?: string;
    user_email?: string;
    userName?: string;
    user_name?: string;
    displayName?: string;
    test_type?: string;
    testType?: string;
    score?: number;
    total_questions?: number;
    totalQuestions?: number;
    submitted_at?: string;
    submittedAt?: string;
    timestamp?: string;
    [key: string]: unknown;
}

export default function SubmissionsTab() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSubmissions = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            const result = await getAllSubmissions();
            const subs = Array.isArray(result) ? result : (result as any)?.data || [];
            setSubmissions(subs);
        } catch {
            // localStorage fallback
            if (typeof window !== "undefined") {
                const stored = JSON.parse(localStorage.getItem("all_submissions") || "[]");
                setSubmissions(stored);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const filtered = submissions.filter((s) => {
        const name = s.userName || s.user_name || s.displayName || "";
        const email = s.userEmail || s.user_email || "";
        const type = s.test_type || s.testType || "";
        const q = search.toLowerCase();
        const matchesSearch = !search || name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
        const matchesType = filterType === "all" || type.toLowerCase().includes(filterType.toLowerCase());
        return matchesSearch && matchesType;
    });

    const avgScore = filtered.length > 0
        ? Math.round(filtered.reduce((acc, s) => acc + (s.score || 0), 0) / filtered.length)
        : 0;

    const passRate = filtered.length > 0
        ? Math.round((filtered.filter((s) => { const score = s.score || 0; const total = s.total_questions || s.totalQuestions || 30; return score / total >= 0.6; }).length / filtered.length) * 100)
        : 0;

    return (
        <div>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                    { label: "Total Submissions", value: submissions.length },
                    { label: "Average Score", value: `${avgScore}%` },
                    { label: "Pass Rate", value: `${passRate}%` },
                ].map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08, ease }}
                        className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-white/30">{stat.label}</span>
                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                <div className="flex-1 relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by student name or email..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors" />
                </div>
                <div className="relative">
                    <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                        className="appearance-none pl-8 pr-8 py-2.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/60 outline-none focus:border-yellow-400/30 transition-colors cursor-pointer">
                        <option value="all">All Types</option>
                        <option value="aptitude">Aptitude</option>
                        <option value="dsa">DSA</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                </div>
                <button onClick={() => fetchSubmissions(true)} disabled={refreshing}
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-xs font-medium text-white/40 hover:text-white/60 hover:border-white/[0.1] transition-all disabled:opacity-50">
                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="py-20 text-center">
                    <RefreshCw size={24} className="mx-auto mb-3 text-white/20 animate-spin" />
                    <p className="text-sm text-white/25">Loading submissions...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-20 text-center">
                    <FileText size={32} className="mx-auto mb-3 text-white/10" />
                    <h4 className="text-sm font-semibold text-white/30 mb-1">{search || filterType !== "all" ? "No matching submissions" : "No submissions yet"}</h4>
                    <p className="text-xs text-white/15">Submissions will appear after students complete assessments</p>
                </div>
            ) : (
                <div className="bg-surface-2/50 rounded-xl border border-white/[0.06] overflow-hidden">
                    {/* Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/[0.04] text-[11px] font-semibold uppercase tracking-wider text-white/25">
                        <div className="col-span-3">Student</div>
                        <div className="col-span-2">Test Type</div>
                        <div className="col-span-2">Score</div>
                        <div className="col-span-2">Result</div>
                        <div className="col-span-3">Submitted</div>
                    </div>
                    {/* Rows */}
                    <div className="divide-y divide-white/[0.04]">
                        {filtered.slice(0, 50).map((sub, i) => {
                            const name = sub.userName || sub.user_name || sub.displayName || sub.userEmail || sub.user_email || "Unknown";
                            const type = sub.test_type || sub.testType || "Aptitude";
                            const score = sub.score || 0;
                            const total = sub.total_questions || sub.totalQuestions || 30;
                            const pct = Math.round((score / total) * 100);
                            const passed = pct >= 60;
                            const time = sub.submitted_at || sub.submittedAt || sub.timestamp;
                            return (
                                <div key={sub.id || sub._id || i} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-3.5 hover:bg-white/[0.015] transition-colors">
                                    <div className="md:col-span-3 flex items-center gap-2 min-w-0">
                                        <div className="w-7 h-7 rounded-md bg-surface-3/80 border border-white/[0.06] flex items-center justify-center text-[11px] font-bold text-white/35 shrink-0">
                                            {(typeof name === "string" ? name : "U").charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-[13px] text-white/60 truncate">{name}</span>
                                    </div>
                                    <div className="md:col-span-2 flex items-center">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-3/60 text-white/30 border border-white/[0.04]">{type}</span>
                                    </div>
                                    <div className="md:col-span-2 flex items-center">
                                        <span className="text-sm font-bold text-white/60 tabular-nums">{score}/{total} <span className="text-white/25 font-normal text-xs">({pct}%)</span></span>
                                    </div>
                                    <div className="md:col-span-2 flex items-center">
                                        <span className={`flex items-center gap-1 text-xs font-medium ${passed ? "text-emerald-400" : "text-red-400"}`}>
                                            {passed ? <CheckCircle2 size={12} /> : <X size={12} />}
                                            {passed ? "Passed" : "Failed"}
                                        </span>
                                    </div>
                                    <div className="md:col-span-3 flex items-center">
                                        <span className="text-xs text-white/25 flex items-center gap-1">
                                            <Clock size={11} />
                                            {time ? new Date(time as string).toLocaleString() : "—"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {filtered.length > 50 && (
                        <div className="px-5 py-3 border-t border-white/[0.04] text-center">
                            <span className="text-xs text-white/20">Showing 50 of {filtered.length} submissions</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
