"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/lib/hooks/useAuth";
import dsaService from "@/lib/services/dsaService";
import { getUserSubmissions } from "@/lib/services/submissionService";
import {
    Code2,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    ChevronRight,
    Zap,
    Brain,
    Trophy,
    ArrowUpRight,
    Loader2,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

interface Problem {
    id: string | number;
    title: string;
    description: string;
    difficulty: string;
    tags?: string[];
    [key: string]: unknown;
}

export default function ProblemsPage() {
    const { user } = useAuth();
    // Primitive dep for the fetch effect: the `user` object identity changes
    // on every auth refresh and would re-fire the fetch.
    const userId = (user as any)?._id || (user as any)?.id || "";
    const [problems, setProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [diffFilter, setDiffFilter] = useState<"All" | "Easy" | "Medium" | "Hard">("All");
    const [solvedIds, setSolvedIds] = useState<Set<string | number>>(new Set());

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await dsaService.getProblems();
                const list = Array.isArray(result) ? result : (result as any)?.problems || [];
                setProblems(list.length > 0 ? list : getDefaultProblems());
            } catch {
                setProblems(getDefaultProblems());
            }

            try {
                if (userId) {
                    const subs = await getUserSubmissions(userId);
                    const solved = new Set<string | number>();
                    (Array.isArray(subs) ? subs : (subs as any)?.data || []).forEach((s: any) => {
                        if (s.test_type === "DSA Challenge" && s.score > 0 && s.solvedProblems) {
                            s.solvedProblems.forEach((idx: number) => solved.add(idx));
                        }
                    });
                    setSolvedIds(solved);
                }
            } catch {
                // ignore
            }
            setLoading(false);
        };
        fetchData();
    }, [userId]);

    const filtered = problems.filter((p) => {
        const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
        const matchDiff = diffFilter === "All" || p.difficulty === diffFilter;
        return matchSearch && matchDiff;
    });

    const diffColors: Record<string, string> = {
        Easy: "bg-emerald-400/10 text-emerald-400 border-emerald-400/15",
        Medium: "bg-yellow-400/10 text-yellow-400 border-yellow-400/15",
        Hard: "bg-red-400/10 text-red-400 border-red-400/15",
    };

    const stats = {
        total: problems.length,
        easy: problems.filter((p) => p.difficulty === "Easy").length,
        medium: problems.filter((p) => p.difficulty === "Medium").length,
        hard: problems.filter((p) => p.difficulty === "Hard").length,
        solved: solvedIds.size,
    };

    return (
        <div className="min-h-screen bg-surface-0">
            {/* Header */}
            <div className="border-b border-white/[0.04]">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/10 to-green-500/5 border border-emerald-400/20 flex items-center justify-center">
                                <Code2 size={20} className="text-emerald-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Problem Library</h1>
                                <p className="text-xs text-white/25">Practice DSA problems at your own pace</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <div className="flex gap-4 mt-6">
                        {[
                            { label: "Total", value: stats.total, icon: Code2, color: "text-white/50" },
                            { label: "Easy", value: stats.easy, icon: Zap, color: "text-emerald-400" },
                            { label: "Medium", value: stats.medium, icon: Brain, color: "text-yellow-400" },
                            { label: "Hard", value: stats.hard, icon: Trophy, color: "text-red-400" },
                            { label: "Solved", value: stats.solved, icon: CheckCircle2, color: "text-emerald-400" },
                        ].map((s) => (
                            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, ease, delay: 0.1 }}
                                className="bg-surface-2/40 rounded-xl px-4 py-3 border border-white/[0.04] flex items-center gap-2">
                                <s.icon size={14} className={s.color} />
                                <span className="text-sm font-bold text-white">{s.value}</span>
                                <span className="text-[10px] text-white/20 uppercase tracking-wider">{s.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-6xl mx-auto px-6 py-5 flex items-center gap-3 border-b border-white/[0.03]">
                <div className="relative flex-1 max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                        type="text"
                        placeholder="Search problems..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-2/40 border border-white/[0.06] text-sm text-white/70 placeholder:text-white/15 outline-none focus:border-yellow-400/30 transition-colors"
                    />
                </div>
                <div className="flex gap-1.5">
                    {(["All", "Easy", "Medium", "Hard"] as const).map((d) => (
                        <button key={d} onClick={() => setDiffFilter(d)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                diffFilter === d ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20" : "bg-surface-3/30 text-white/25 border border-white/[0.04] hover:text-white/40"
                            }`}>
                            {d}
                        </button>
                    ))}
                </div>
            </div>

            {/* Problems List */}
            <div className="max-w-6xl mx-auto px-6 py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={24} className="animate-spin text-white/20" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Code2 size={32} className="mx-auto mb-3 text-white/10" />
                        <p className="text-sm text-white/25">No problems found</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((problem, i) => {
                            const solved = solvedIds.has(i) || solvedIds.has(problem.id);
                            return (
                                <motion.div key={problem.id || i}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, ease, delay: i * 0.03 }}>
                                    <Link href={`/problems/${resolveProblemSlug(problem)}`}
                                        className="group flex items-center gap-4 p-4 rounded-xl bg-surface-2/30 border border-white/[0.04] hover:border-white/[0.08] hover:bg-surface-2/50 transition-all">
                                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-3/40 border border-white/[0.04] text-xs font-bold text-white/25">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-semibold text-white/70 group-hover:text-white/90 transition-colors truncate">
                                                    {problem.title}
                                                </h3>
                                                {solved && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                                            </div>
                                            {problem.tags && problem.tags.length > 0 && (
                                                <div className="flex gap-1.5 mt-1">
                                                    {problem.tags.slice(0, 3).map((tag: string) => (
                                                        <span key={tag} className="text-[10px] text-white/15 bg-surface-3/30 px-1.5 py-0.5 rounded">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${diffColors[problem.difficulty] || "text-white/20"}`}>
                                            {problem.difficulty}
                                        </span>
                                        <ArrowUpRight size={14} className="text-white/10 group-hover:text-white/30 transition-colors shrink-0" />
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Start Challenge CTA */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.4 }}
                    className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-surface-2/60 to-surface-3/20 border border-white/[0.06] text-center">
                    <h3 className="text-base font-bold text-white mb-1">Ready for a timed challenge?</h3>
                    <p className="text-xs text-white/25 mb-4">Take the full DSA assessment with a 90-minute timer</p>
                    <Link href="/dsa-test"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-400 text-surface-0 text-sm font-bold hover:bg-yellow-300 transition-colors shadow-[0_0_20px_rgba(255,193,7,0.15)]">
                        <Zap size={16} /> Start DSA Test
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}

// ─── Problem slug resolution ─────────────────────────────────────────────────
// The workspace at /problems/[id] is keyed by slug ("two-sum"), but the backend
// problem list uses numeric ids ("1"). Resolve backend entries to their slug so
// list clicks land on the right workspace; unknown problems keep their raw id
// (the detail page shows its not-found state for those).

const KNOWN_PROBLEM_SLUGS = new Set([
    "two-sum", "reverse-linked-list", "binary-search", "valid-parentheses",
    "merge-sorted-arrays", "max-subarray", "longest-substring", "three-sum",
    "lru-cache", "coin-change", "word-search", "merge-intervals",
    "trapping-rain-water", "median-two-arrays", "serialize-tree",
]);

// Backend titles whose slugified form differs from the workspace slug.
const PROBLEM_SLUG_ALIASES: Record<string, string> = {
    "merge-two-sorted-arrays": "merge-sorted-arrays",
    "longest-substring-without-repeating-characters": "longest-substring",
    "median-of-two-sorted-arrays": "median-two-arrays",
    "maximum-subarray": "max-subarray",
    "3sum": "three-sum",
};

function resolveProblemSlug(problem: Problem): string {
    const id = String(problem.id ?? "");
    if (KNOWN_PROBLEM_SLUGS.has(id)) return id;
    const slug = (problem.title || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    const aliased = PROBLEM_SLUG_ALIASES[slug] || slug;
    return KNOWN_PROBLEM_SLUGS.has(aliased) ? aliased : id;
}

// ─── Default Problems ────────────────────────────────────────────────────────

function getDefaultProblems(): Problem[] {
    return [
        { id: "two-sum", title: "Two Sum", description: "Find two numbers that add to target", difficulty: "Easy", tags: ["Array", "Hash Map"] },
        { id: "reverse-linked-list", title: "Reverse Linked List", description: "Reverse a singly linked list", difficulty: "Easy", tags: ["Linked List"] },
        { id: "binary-search", title: "Binary Search", description: "Search sorted array in O(log n)", difficulty: "Easy", tags: ["Array", "Binary Search"] },
        { id: "valid-parentheses", title: "Valid Parentheses", description: "Check if brackets are balanced", difficulty: "Easy", tags: ["Stack", "String"] },
        { id: "merge-sorted-arrays", title: "Merge Two Sorted Arrays", description: "Merge two sorted arrays into one", difficulty: "Easy", tags: ["Array", "Two Pointers"] },
        { id: "max-subarray", title: "Maximum Subarray", description: "Find contiguous subarray with max sum", difficulty: "Medium", tags: ["Array", "Dynamic Programming"] },
        { id: "longest-substring", title: "Longest Substring Without Repeating Characters", description: "Find the length of the longest substring without repeating characters", difficulty: "Medium", tags: ["String", "Sliding Window"] },
        { id: "three-sum", title: "3Sum", description: "Find all unique triplets that sum to zero", difficulty: "Medium", tags: ["Array", "Two Pointers", "Sorting"] },
        { id: "lru-cache", title: "LRU Cache", description: "Design a Least Recently Used cache", difficulty: "Medium", tags: ["Hash Map", "Linked List", "Design"] },
        { id: "coin-change", title: "Coin Change", description: "Find minimum coins to make amount", difficulty: "Medium", tags: ["Dynamic Programming"] },
        { id: "word-search", title: "Word Search", description: "Search for a word in a 2D grid", difficulty: "Medium", tags: ["Backtracking", "Matrix"] },
        { id: "merge-intervals", title: "Merge Intervals", description: "Merge all overlapping intervals", difficulty: "Medium", tags: ["Array", "Sorting"] },
        { id: "trapping-rain-water", title: "Trapping Rain Water", description: "Calculate trapped water between bars", difficulty: "Hard", tags: ["Array", "Two Pointers", "Stack"] },
        { id: "median-two-arrays", title: "Median of Two Sorted Arrays", description: "Find median in O(log(m+n))", difficulty: "Hard", tags: ["Array", "Binary Search"] },
        { id: "serialize-tree", title: "Serialize and Deserialize Binary Tree", description: "Convert binary tree to/from string", difficulty: "Hard", tags: ["Tree", "BFS", "DFS"] },
    ];
}
