"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Code2,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    Search,
    Activity,
    Zap,
    BarChart3,
    AlertCircle,
    Copy,
    Tag,
    Server,
} from "lucide-react";
import apiClient from "@/lib/apiClient";

const ease = [0.16, 1, 0.3, 1] as const;

interface DSAProblem {
    id: string;
    title: string;
    difficulty: string;
    category: string;
    description?: string;
    examples?: Array<{ input: string; output: string }>;
}

interface CodeSubmission {
    id: string;
    code: string;
    language: string;
    submitted_at: string;
    s3_key?: string;
    analysis?: {
        complexity?: {
            time_complexity?: string;
            space_complexity?: string;
            cyclomatic_complexity?: number;
        };
        code_quality?: {
            score?: number;
            readability_score?: number;
            maintainability_index?: number;
        };
        suggestions?: Array<{
            category: string;
            description: string;
            priority: string;
        }>;
        issues?: Array<{
            type: string;
            line: number;
            message: string;
            severity: string;
        }>;
    };
}

export default function DSATab() {
    const [problems, setProblems] = useState<DSAProblem[]>([]);
    const [serverHealthy, setServerHealthy] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [difficultyFilter, setDifficultyFilter] = useState("all");
    const [expandedProblem, setExpandedProblem] = useState<string | null>(null);

    // Code submissions state
    const [codeSubmissions, setCodeSubmissions] = useState<Record<string, CodeSubmission[]>>({});
    const [loadingSubmissions, setLoadingSubmissions] = useState<string | null>(null);

    const checkHealth = useCallback(async () => {
        try {
            const res = await apiClient.get("/api/health", { timeout: 5000 });
            setServerHealthy(res.status === 200);
        } catch {
            setServerHealthy(false);
        }
    }, []);

    const fetchProblems = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            const res = await apiClient.get("/api/problems");
            setProblems(res.data.problems || []);
        } catch (err) {
            console.error("Error fetching DSA problems:", err);
            setProblems([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        checkHealth();
        fetchProblems();
    }, [checkHealth, fetchProblems]);

    const fetchCodeSubmissions = async (userId: string) => {
        if (codeSubmissions[userId]) return; // already loaded
        setLoadingSubmissions(userId);
        try {
            const res = await apiClient.get(`/api/code-submissions/${userId}`);
            setCodeSubmissions((prev) => ({
                ...prev,
                [userId]: res.data.data || [],
            }));
        } catch {
            setCodeSubmissions((prev) => ({ ...prev, [userId]: [] }));
        } finally {
            setLoadingSubmissions(null);
        }
    };

    const filtered = problems.filter((p) => {
        const q = search.toLowerCase();
        const matchesSearch =
            !search ||
            p.title.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q);
        const matchesDifficulty =
            difficultyFilter === "all" || p.difficulty.toLowerCase() === difficultyFilter;
        return matchesSearch && matchesDifficulty;
    });

    const diffCounts = {
        easy: problems.filter((p) => p.difficulty.toLowerCase() === "easy").length,
        medium: problems.filter((p) => p.difficulty.toLowerCase() === "medium").length,
        hard: problems.filter((p) => p.difficulty.toLowerCase() === "hard").length,
    };

    const diffColor = (d: string) => {
        switch (d.toLowerCase()) {
            case "easy":
                return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
            case "medium":
                return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
            case "hard":
                return "text-red-400 bg-red-400/10 border-red-400/20";
            default:
                return "text-white/40 bg-white/5 border-white/10";
        }
    };

    return (
        <div>
            {/* DSA Server Status */}
            <div className="flex items-center gap-3 mb-6">
                <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${
                        serverHealthy === true
                            ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                            : serverHealthy === false
                            ? "bg-red-400/10 border-red-400/20 text-red-400"
                            : "bg-white/5 border-white/10 text-white/30"
                    }`}
                >
                    <Server size={12} />
                    {serverHealthy === true
                        ? "DSA Server Online"
                        : serverHealthy === false
                        ? "DSA Server Offline"
                        : "Checking..."}
                </div>
                <button
                    onClick={() => {
                        checkHealth();
                        fetchProblems(true);
                    }}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-xs font-medium text-white/40 hover:text-white/60 transition-all disabled:opacity-50"
                >
                    <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Total Problems", value: problems.length, icon: Code2 },
                    { label: "Easy", value: diffCounts.easy, icon: CheckCircle2, cls: "text-emerald-400" },
                    { label: "Medium", value: diffCounts.medium, icon: Zap, cls: "text-yellow-400" },
                    { label: "Hard", value: diffCounts.hard, icon: AlertCircle, cls: "text-red-400" },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.08, ease }}
                        className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-5"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-white/30">
                                {stat.label}
                            </span>
                            <stat.icon size={14} className={stat.cls || "text-white/20"} />
                        </div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                <div className="flex-1 relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search problems by title, category, or ID..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors"
                    />
                </div>
                <div className="relative">
                    <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <select
                        value={difficultyFilter}
                        onChange={(e) => setDifficultyFilter(e.target.value)}
                        className="appearance-none pl-8 pr-8 py-2.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/60 outline-none focus:border-yellow-400/30 transition-colors cursor-pointer"
                    >
                        <option value="all">All Difficulties</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                </div>
            </div>

            {/* Problems List */}
            {loading ? (
                <div className="py-20 text-center">
                    <RefreshCw size={24} className="mx-auto mb-3 text-white/20 animate-spin" />
                    <p className="text-sm text-white/25">Loading DSA problems...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-20 text-center">
                    <Code2 size={32} className="mx-auto mb-3 text-white/10" />
                    <h4 className="text-sm font-semibold text-white/30 mb-1">
                        {search || difficultyFilter !== "all"
                            ? "No matching problems"
                            : "No problems available"}
                    </h4>
                    <p className="text-xs text-white/15">
                        {serverHealthy === false
                            ? "Start the DSA server to load problems"
                            : "Problems will appear when added to the server"}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((problem, i) => (
                        <motion.div
                            key={problem.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.03, ease }}
                            className="bg-surface-2/50 rounded-xl border border-white/[0.06] overflow-hidden"
                        >
                            {/* Problem header */}
                            <button
                                onClick={() =>
                                    setExpandedProblem(expandedProblem === problem.id ? null : problem.id)
                                }
                                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.015] transition-colors"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-surface-3/60 border border-white/[0.06] flex items-center justify-center text-xs font-bold text-white/30 shrink-0">
                                        {i + 1}
                                    </div>
                                    <div className="text-left min-w-0">
                                        <h4 className="text-[13px] font-semibold text-white/70 truncate">
                                            {problem.title}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] uppercase tracking-wider text-white/25">
                                                {problem.category}
                                            </span>
                                            <span className="text-white/10">·</span>
                                            <span className="text-[10px] uppercase tracking-wider text-white/25">
                                                {problem.id}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span
                                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${diffColor(
                                            problem.difficulty
                                        )}`}
                                    >
                                        {problem.difficulty}
                                    </span>
                                    {expandedProblem === problem.id ? (
                                        <ChevronUp size={14} className="text-white/20" />
                                    ) : (
                                        <ChevronDown size={14} className="text-white/20" />
                                    )}
                                </div>
                            </button>

                            {/* Expanded details */}
                            <AnimatePresence>
                                {expandedProblem === problem.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25, ease }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 pb-5 border-t border-white/[0.04]">
                                            <div className="pt-4">
                                                {problem.description && (
                                                    <p className="text-sm text-white/40 mb-4 leading-relaxed">
                                                        {problem.description}
                                                    </p>
                                                )}

                                                {problem.examples && problem.examples.length > 0 && (
                                                    <div className="mb-4">
                                                        <h5 className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-2">
                                                            Examples
                                                        </h5>
                                                        <div className="space-y-2">
                                                            {problem.examples.map((ex, j) => (
                                                                <div
                                                                    key={j}
                                                                    className="bg-surface-3/40 rounded-lg border border-white/[0.04] p-3"
                                                                >
                                                                    <div className="text-xs text-white/30 font-mono">
                                                                        <span className="text-white/20">Input: </span>
                                                                        {ex.input}
                                                                    </div>
                                                                    <div className="text-xs text-emerald-400/60 font-mono mt-1">
                                                                        <span className="text-white/20">Output: </span>
                                                                        {ex.output}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Problem metadata */}
                                                <div className="flex items-center gap-4 text-[11px] text-white/20">
                                                    <span className="flex items-center gap-1">
                                                        <Tag size={10} />
                                                        {problem.category}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Code2 size={10} />
                                                        {problem.id}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Showing count */}
            {!loading && filtered.length > 0 && (
                <div className="mt-4 text-center">
                    <span className="text-xs text-white/20">
                        Showing {filtered.length} of {problems.length} problems
                    </span>
                </div>
            )}
        </div>
    );
}
