"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
    Trophy,
    Award,
    RefreshCw,
    Medal,
    TrendingUp,
} from "lucide-react";
import leaderboardService from "@/lib/services/leaderboardService";

const ease = [0.16, 1, 0.3, 1] as const;

interface LeaderboardEntry {
    userId?: string;
    userName?: string;
    displayName?: string;
    userEmail?: string;
    email?: string;
    totalScore?: number;
    testsCompleted?: number;
    averageScore?: number | string;
    [key: string]: unknown;
}

export default function AdminLeaderboardTab() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = () => {
        try {
            const lb = leaderboardService.getTopUsers(50);
            setLeaderboard(lb || []);
        } catch {
            setLeaderboard([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    if (loading) {
        return (
            <div className="py-20 text-center">
                <RefreshCw size={24} className="mx-auto mb-3 text-white/20 animate-spin" />
                <p className="text-sm text-white/25">Loading leaderboard...</p>
            </div>
        );
    }

    if (leaderboard.length === 0) {
        return (
            <div className="py-20 text-center">
                <Trophy size={32} className="mx-auto mb-3 text-white/10" />
                <h4 className="text-sm font-semibold text-white/30 mb-1">No Rankings Yet</h4>
                <p className="text-xs text-white/15">Rankings appear after students complete assessments</p>
            </div>
        );
    }

    return (
        <div>
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
                <div className="flex items-end justify-center gap-6 mb-8 py-6">
                    {[1, 0, 2].map((pos, idx) => {
                        const entry = leaderboard[pos];
                        if (!entry) return null;
                        const name = entry.userName || entry.displayName || "Anonymous";
                        const heights = ["h-28", "h-36", "h-24"];
                        const medals = ["🥈", "🥇", "🥉"];
                        const widths = ["w-24", "w-28", "w-24"];
                        return (
                            <motion.div key={pos} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: idx * 0.1, ease }}
                                className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-xl bg-surface-3/80 border border-white/[0.08] flex items-center justify-center text-base font-bold text-white/40">
                                    {name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs font-medium text-white/50 max-w-[100px] truncate text-center">{name}</span>
                                <div className={`${heights[idx]} ${widths[idx]} rounded-t-xl bg-surface-2/60 border border-white/[0.06] border-b-0 flex flex-col items-center justify-center gap-1`}>
                                    <span className="text-2xl">{medals[idx]}</span>
                                    <span className="text-sm font-bold text-white/60">{entry.totalScore?.toLocaleString() || 0}</span>
                                    <span className="text-[10px] text-white/25">{entry.testsCompleted || 0} tests</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Full Table */}
            <div className="bg-surface-2/50 rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/[0.04] text-[11px] font-semibold uppercase tracking-wider text-white/25">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-4">Student</div>
                    <div className="col-span-2">Score</div>
                    <div className="col-span-2">Tests</div>
                    <div className="col-span-3">Average</div>
                </div>
                <div className="divide-y divide-white/[0.04]">
                    {leaderboard.map((entry, i) => {
                        const name = entry.userName || entry.displayName || "Anonymous";
                        const email = entry.userEmail || entry.email || "";
                        return (
                            <motion.div key={entry.userId || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
                                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-3.5 hover:bg-white/[0.015] transition-colors">
                                <div className="md:col-span-1 flex items-center">
                                    <span className="text-sm font-bold text-white/30">
                                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                                    </span>
                                </div>
                                <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-surface-3/80 border border-white/[0.06] flex items-center justify-center text-[12px] font-bold text-white/35 shrink-0">
                                        {name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-medium text-white/60 truncate">{name}</p>
                                        <p className="text-[11px] text-white/15 truncate">{email as string}</p>
                                    </div>
                                </div>
                                <div className="md:col-span-2 flex items-center">
                                    <span className="text-sm font-bold text-yellow-400/80 tabular-nums">{entry.totalScore?.toLocaleString() || 0}</span>
                                </div>
                                <div className="md:col-span-2 flex items-center">
                                    <span className="text-sm text-white/40 tabular-nums">{entry.testsCompleted || 0}</span>
                                </div>
                                <div className="md:col-span-3 flex items-center gap-2">
                                    <div className="flex-1 h-1.5 rounded-full bg-surface-3/50 overflow-hidden">
                                        <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500" style={{ width: `${Math.min(Number(entry.averageScore || 0), 100)}%` }} />
                                    </div>
                                    <span className="text-xs text-white/40 tabular-nums w-10 text-right">{typeof entry.averageScore === "number" ? `${Math.round(entry.averageScore)}%` : entry.averageScore || "—"}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
