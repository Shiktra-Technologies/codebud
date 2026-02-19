"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Users,
    Activity,
    Clock,
    Award,
    ChevronDown,
    ChevronUp,
    Circle,
    CheckCircle2,
    XCircle,
    Mail,
    Calendar,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

interface Student {
    id: string;
    email: string;
    display_name?: string;
    role?: string;
    last_active?: string;
    created_at?: string;
}

interface Submission {
    id: string;
    user_id: string;
    test_type: string;
    score: number;
    total_questions: number;
    submitted_at: string;
    time_taken?: number;
    violations?: number;
    [key: string]: any;
}

interface ActiveUsersTabProps {
    activeStudents: Student[];
    submissions: Submission[];
}

export default function ActiveUsersTab({ activeStudents, submissions }: ActiveUsersTabProps) {
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    // Get recent submissions for each user
    const userSubmissions = useMemo(() => {
        const map = new Map<string, Submission[]>();
        submissions.forEach((sub) => {
            if (!map.has(sub.user_id)) {
                map.set(sub.user_id, []);
            }
            map.get(sub.user_id)!.push(sub);
        });
        // Keep only last 5 per user
        map.forEach((subs, userId) => {
            map.set(userId, subs.slice(0, 5));
        });
        return map;
    }, [submissions]);

    // Calculate stats per user
    const userStats = useMemo(() => {
        const stats = new Map<
            string,
            { count: number; avgScore: number; lastActivity: string }
        >();
        activeStudents.forEach((student) => {
            const subs = userSubmissions.get(student.id) || [];
            const avgScore =
                subs.length > 0
                    ? Math.round(subs.reduce((sum, s) => sum + s.score, 0) / subs.length)
                    : 0;
            stats.set(student.id, {
                count: subs.length,
                avgScore,
                lastActivity: student.last_active || student.created_at || "",
            });
        });
        return stats;
    }, [activeStudents, userSubmissions]);

    const formatTime = (timestamp: string) => {
        if (!timestamp) return "Never";
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return "—";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    if (activeStudents.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease }}
                className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-16 text-center"
            >
                <Users size={32} className="mx-auto mb-3 text-white/10" />
                <h4 className="text-sm font-semibold text-white/30 mb-1">
                    No Active Users
                </h4>
                <p className="text-xs text-white/15">
                    Users will appear here when active in the last 5 minutes
                </p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease }}
            className="space-y-3"
        >
            {activeStudents.map((student, i) => {
                const stats = userStats.get(student.id);
                const subs = userSubmissions.get(student.id) || [];
                const isExpanded = expandedUser === student.id;
                const isLive = stats && formatTime(stats.lastActivity).includes("Just now");

                return (
                    <motion.div
                        key={student.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3, ease }}
                        className="bg-surface-2/50 rounded-xl border border-white/[0.06] overflow-hidden"
                    >
                        {/* Header */}
                        <div
                            onClick={() =>
                                setExpandedUser(isExpanded ? null : student.id)
                            }
                            className={`p-4 cursor-pointer transition-colors ${
                                isExpanded
                                    ? "bg-white/[0.02]"
                                    : "hover:bg-white/[0.01]"
                            }`}
                        >
                            <div
                                className={`absolute inset-0 opacity-5 pointer-events-none ${
                                    isLive
                                        ? "bg-gradient-to-r from-emerald-400 to-green-500"
                                        : "bg-gradient-to-r from-blue-400 to-cyan-500"
                                }`}
                            />
                            <div className="relative flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {/* Avatar */}
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                                            isLive
                                                ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                                                : "bg-blue-400/10 text-blue-400 border border-blue-400/20"
                                        }`}
                                    >
                                        {(student.display_name || student.email)[0].toUpperCase()}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="text-sm font-semibold text-white truncate">
                                                {student.display_name || student.email.split("@")[0]}
                                            </h4>
                                            <span
                                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                                    isLive
                                                        ? "bg-emerald-400/10 text-emerald-400"
                                                        : "bg-blue-400/10 text-blue-400"
                                                }`}
                                            >
                                                {isLive && (
                                                    <Circle
                                                        size={6}
                                                        className="fill-current animate-pulse"
                                                    />
                                                )}
                                                {isLive ? "Live" : "Active"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-white/30 truncate">
                                            {student.email}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="text-right">
                                        <p className="text-xs text-white/20 mb-0.5">
                                            Submissions
                                        </p>
                                        <p className="text-sm font-bold text-white/60">
                                            {stats?.count || 0}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-white/20 mb-0.5">Avg Score</p>
                                        <p className="text-sm font-bold text-yellow-400">
                                            {stats?.avgScore || 0}%
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-white/20 mb-0.5">
                                            Last Seen
                                        </p>
                                        <p className="text-sm font-bold text-white/40">
                                            {stats ? formatTime(stats.lastActivity) : "—"}
                                        </p>
                                    </div>
                                    {isExpanded ? (
                                        <ChevronUp size={16} className="text-white/25" />
                                    ) : (
                                        <ChevronDown size={16} className="text-white/25" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Expanded: Recent Submissions */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease }}
                                    className="border-t border-white/[0.04]"
                                >
                                    <div className="p-4">
                                        <h5 className="text-xs font-semibold uppercase tracking-wider text-white/25 mb-3">
                                            Recent Submissions
                                        </h5>
                                        {subs.length === 0 ? (
                                            <p className="text-xs text-white/15 italic py-4">
                                                No submissions yet
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {subs.map((sub) => {
                                                    const passed =
                                                        (sub.score / sub.total_questions) * 100 >= 60;
                                                    return (
                                                        <div
                                                            key={sub.id}
                                                            className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-surface-3/30 border border-white/[0.04]"
                                                        >
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <div
                                                                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                                                                        passed
                                                                            ? "bg-emerald-400/10 text-emerald-400"
                                                                            : "bg-red-400/10 text-red-400"
                                                                    }`}
                                                                >
                                                                    {passed ? (
                                                                        <CheckCircle2 size={14} />
                                                                    ) : (
                                                                        <XCircle size={14} />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-medium text-white/60 truncate">
                                                                        {sub.test_type}
                                                                    </p>
                                                                    <p className="text-[10px] text-white/20">
                                                                        {new Date(
                                                                            sub.submitted_at
                                                                        ).toLocaleDateString()}{" "}
                                                                        •{" "}
                                                                        {formatDuration(sub.time_taken)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p
                                                                    className={`text-xs font-bold ${
                                                                        passed
                                                                            ? "text-emerald-400"
                                                                            : "text-red-400"
                                                                    }`}
                                                                >
                                                                    {sub.score}/{sub.total_questions}
                                                                </p>
                                                                <p className="text-[10px] text-white/20">
                                                                    {Math.round(
                                                                        (sub.score / sub.total_questions) * 100
                                                                    )}
                                                                    %
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}
