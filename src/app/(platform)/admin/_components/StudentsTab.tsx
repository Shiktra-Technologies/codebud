"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
    Users,
    GraduationCap,
    Eye,
    Clock,
    Search,
    RefreshCw,
    Mail,
    Shield,
    Activity,
} from "lucide-react";
import { getAllUsers } from "@/lib/services/supabaseService";

const ease = [0.16, 1, 0.3, 1] as const;

interface UserData {
    _id?: string;
    id?: string;
    email?: string;
    display_name?: string;
    displayName?: string;
    role?: string;
    last_active?: string;
    lastActive?: string;
    created_at?: string;
    createdAt?: string;
    [key: string]: unknown;
}

export default function StudentsTab() {
    const [students, setStudents] = useState<UserData[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStudents = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            const users = await getAllUsers();
            const studentList = Array.isArray(users)
                ? users.filter((u: UserData) => u.role === "student" || !u.role)
                : [];
            setStudents(studentList);
        } catch {
            setStudents([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const filtered = students.filter((s) => {
        const name = s.display_name || s.displayName || "";
        const email = s.email || "";
        const q = search.toLowerCase();
        return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
    });

    const timeAgo = (dateStr: string | undefined) => {
        if (!dateStr) return "Unknown";
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <div>
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                    { label: "Total Students", value: students.length, icon: Users, gradient: "from-yellow-400 to-amber-500" },
                    { label: "Active Today", value: students.filter((s) => { const la = s.last_active || s.lastActive; if (!la) return false; return Date.now() - new Date(la).getTime() < 86400000; }).length, icon: Activity, gradient: "from-emerald-400 to-green-500" },
                    { label: "New This Week", value: students.filter((s) => { const ca = s.created_at || s.createdAt; if (!ca) return false; return Date.now() - new Date(ca).getTime() < 604800000; }).length, icon: GraduationCap, gradient: "from-purple-400 to-violet-500" },
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08, ease }}
                            className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-white/30">{stat.label}</span>
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                                    <Icon size={14} className="text-white" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Search + Refresh */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search students by name or email..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors"
                    />
                </div>
                <button onClick={() => fetchStudents(true)} disabled={refreshing}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-xs font-medium text-white/40 hover:text-white/60 hover:border-white/[0.1] transition-all disabled:opacity-50">
                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Student Cards */}
            {loading ? (
                <div className="py-20 text-center">
                    <RefreshCw size={24} className="mx-auto mb-3 text-white/20 animate-spin" />
                    <p className="text-sm text-white/25">Loading students...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-20 text-center">
                    <Users size={32} className="mx-auto mb-3 text-white/10" />
                    <h4 className="text-sm font-semibold text-white/30 mb-1">{search ? "No matches found" : "No students registered"}</h4>
                    <p className="text-xs text-white/15">
                        {search ? "Try adjusting your search query" : "Students will appear here after registration"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((student, i) => {
                        const name = student.display_name || student.displayName || student.email?.split("@")[0] || "Unknown";
                        const initial = name.charAt(0).toUpperCase();
                        const lastActive = student.last_active || student.lastActive;
                        return (
                            <motion.div key={student._id || student.id || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3), ease }}
                                className="group bg-surface-2/50 rounded-xl border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400/20 to-amber-500/10 flex items-center justify-center text-sm font-bold text-yellow-400 shrink-0">
                                        {initial}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white/80 truncate">{name}</p>
                                        <p className="text-[11px] text-white/25 truncate flex items-center gap-1">
                                            <Mail size={10} /> {student.email || "No email"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-white/30">
                                    <span className="flex items-center gap-1.5">
                                        <Shield size={11} />
                                        {student.role || "student"}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={11} />
                                        {timeAgo(lastActive as string)}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
