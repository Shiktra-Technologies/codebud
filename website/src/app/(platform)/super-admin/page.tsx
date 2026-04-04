"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getAllUsers, updateUser } from "@/lib/services/supabaseService";
import { getAllSubmissions } from "@/lib/services/submissionService";
import {
    Shield,
    Users,
    BarChart3,
    Search,
    RefreshCw,
    ChevronDown,
    X,
    User,
    LogOut,
    GraduationCap,
    ShieldCheck,
    Crown,
    FileText,
    AlertTriangle,
    CheckCircle2,
    Activity,
    Database,
    Cpu,
    Eye,
    Loader2,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { BookOpen, Building2, Settings } from "lucide-react";
import CourseBuilderTab from "./CourseBuilderTab";
import CompanyManagementTab from "./CompanyManagementTab";
import PlatformConfigTab from "./PlatformConfigTab";
import BootSequence from "@/app/components/BootSequence";

const ease = [0.16, 1, 0.3, 1] as const;

interface UserRecord {
    _id?: string;
    id?: string;
    uid?: string;
    email?: string;
    display_name?: string;
    displayName?: string;
    role?: string;
    status?: string;
    isActive?: boolean;
    created_at?: string;
    createdAt?: string;
    last_active?: string;
    lastLoginAt?: string;
    [key: string]: unknown;
}

// ─── Super Admin Page ─────────────────────────────────────────────────────────

export default function SuperAdminPage() {
    const { user, userRole, logout } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<"overview" | "users" | "courses" | "companies" | "config">("overview");
    const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const displayName =
        (user as any)?.display_name ||
        (user as any)?.displayName ||
        user?.email?.split("@")[0] ||
        "Super Admin";

    // ─── Access check ─────────────────────────────────────────────────────

    useEffect(() => {
        if (!loading && userRole !== "codebud_super_admin") {
            router.push("/dashboard");
        }
    }, [loading, userRole, router]);

    // ─── Click outside profile menu ───────────────────────────────────────

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // ─── Data fetching ────────────────────────────────────────────────────

    const fetchData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);

            const [usersData, subsResult] = await Promise.all([
                getAllUsers(),
                getAllSubmissions(),
            ]);

            setAllUsers(Array.isArray(usersData) ? usersData : []);
            const subs = Array.isArray(subsResult)
                ? subsResult
                : (subsResult as any)?.data || [];
            setSubmissions(subs);
        } catch (err) {
            console.error("Super admin fetch error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ─── Role change handler ──────────────────────────────────────────────

    const handleRoleChange = async (userId: string, newRole: string) => {
        const result = await updateUser(userId, { role: newRole });
        if (result.success) {
            setAllUsers((prev) =>
                prev.map((u) =>
                    (u._id || u.id) === userId ? { ...u, role: newRole } : u,
                ),
            );
            setSelectedUser(null);
        } else {
            alert("Failed to update role: " + (result.error || "Unknown error"));
        }
    };

    // ─── Deactivation handler ─────────────────────────────────────────────

    const [deactivating, setDeactivating] = useState(false);

    const handleToggleActive = async (targetUser: UserRecord) => {
        const uid = targetUser._id || targetUser.id || "";
        if (!uid) return;
        const isCurrentlyActive = (targetUser.status || "active") !== "inactive";
        const action = isCurrentlyActive ? "deactivate" : "reactivate";
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        setDeactivating(true);
        try {
            const res = await import("@/lib/apiClient").then(m => m.default.patch(`/api/users/${uid}/deactivate`, { active: !isCurrentlyActive }));
            if (res.data?.success) {
                const newStatus = isCurrentlyActive ? "inactive" : "active";
                setAllUsers((prev) => prev.map((u) => (u._id || u.id) === uid ? { ...u, status: newStatus } : u));
                setSelectedUser((prev) => prev && ((prev._id || prev.id) === uid) ? { ...prev, status: newStatus } : prev);
            } else {
                alert("Failed: " + (res.data?.error || "Unknown error"));
            }
        } catch (err: any) {
            alert("Error: " + (err?.response?.data?.error || err.message));
        } finally {
            setDeactivating(false);
        }
    };

    // ─── Stats ────────────────────────────────────────────────────────────

    const stats = {
        totalUsers: allUsers.length,
        students: allUsers.filter((u) => u.role === "student").length,
        admins: allUsers.filter((u) => u.role === "admin").length,
        superAdmins: allUsers.filter((u) => u.role === "super_admin").length,
        totalSubmissions: submissions.length,
        violations: submissions.filter((s: any) => s.violations?.submittedDueToViolation).length,
        passed: submissions.filter((s: any) => s.passed).length,
        passRate:
            submissions.length > 0
                ? Math.round(
                    (submissions.filter((s: any) => s.passed).length /
                        submissions.length) *
                    100,
                )
                : 0,
    };

    // ─── Filtered users ───────────────────────────────────────────────────

    const filteredUsers = allUsers.filter(
        (u) =>
            (u.display_name || u.displayName || "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.role || "").toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // ─── Helpers ──────────────────────────────────────────────────────────

    const roleLabel = (role?: string) => {
        switch (role) {
            case "student": return "Student";
            case "admin": return "Admin";
            case "super_admin": return "Super Admin";
            default: return role || "Unknown";
        }
    };

    const roleColor = (role?: string) => {
        switch (role) {
            case "student": return "bg-emerald-400/10 text-emerald-400 border-emerald-400/15";
            case "admin": return "bg-yellow-400/10 text-yellow-400 border-yellow-400/15";
            case "super_admin": return "bg-red-400/10 text-red-400 border-red-400/15";
            default: return "bg-white/5 text-white/30 border-white/[0.06]";
        }
    };

    const formatDate = (d?: string) => {
        if (!d) return "Never";
        try {
            return new Date(d).toLocaleString();
        } catch {
            return "N/A";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-0 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-white/20" />
            </div>
        );
    }

    if (userRole !== "codebud_super_admin") return null;

    // ─── Render ───────────────────────────────────────────────────────────

    return (
        <BootSequence>
            <div className="min-h-screen bg-surface-0">
                {/* ── Header ─────────────────────────────────────────────── */}
                <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-0/80 backdrop-blur-xl border-b border-white/[0.04]">
                    <div className="h-full max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between">
                        {/* Left */}
                        <div className="flex items-center gap-4">
                            <Link
                                href="/admin"
                                className="flex items-center gap-2 text-xs font-medium text-white/30 hover:text-white/50 transition-colors"
                            >
                                <ArrowLeft size={14} />
                                Admin Panel
                            </Link>
                            <div className="w-px h-5 bg-white/[0.06]" />
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-red-400/10 border border-red-400/20 flex items-center justify-center">
                                    <Shield size={16} className="text-red-400" />
                                </div>
                                <span className="text-sm font-bold text-white">
                                    Super Admin
                                </span>
                            </div>
                        </div>

                        {/* Right */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => fetchData(true)}
                                disabled={refreshing}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-xs font-medium text-white/40 hover:text-white/60 transition-all disabled:opacity-50"
                            >
                                <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                                {refreshing ? "Refreshing…" : "Refresh"}
                            </button>
                            {/* Profile */}
                            <div ref={profileRef} className="relative">
                                <button
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors"
                                >
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-[10px] font-bold text-white">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                    <ChevronDown size={12} className="text-white/20" />
                                </button>
                                <AnimatePresence>
                                    {showProfileMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-full mt-2 w-56 bg-surface-2 border border-white/[0.06] rounded-xl shadow-2xl overflow-hidden"
                                        >
                                            <div className="p-3 border-b border-white/[0.04]">
                                                <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                                                <p className="text-xs text-white/25 truncate">{user?.email}</p>
                                            </div>
                                            <div className="p-1.5">
                                                <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/60 hover:bg-white/[0.03] transition-colors">
                                                    <User size={14} /> Dashboard
                                                </Link>
                                                <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400/60 hover:text-red-400 hover:bg-red-400/[0.05] transition-colors">
                                                    <LogOut size={14} /> Logout
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </header>

                {/* ── Content ────────────────────────────────────────────── */}
                <main className="pt-16">
                    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
                        {/* Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease }}
                            className="mb-8"
                        >
                            <h1 className="text-2xl font-bold text-white mb-1">
                                System Administration
                            </h1>
                            <p className="text-sm text-white/25">
                                Manage users, roles, and monitor system health
                            </p>
                        </motion.div>

                        {/* Tabs */}
                        <div className="flex gap-1 p-1 bg-surface-2/40 rounded-xl border border-white/[0.04] w-fit mb-8">
                            {([
                                { id: "overview" as const, label: "System Overview", icon: BarChart3 },
                                { id: "users" as const, label: "User Management", icon: Users },
                                { id: "courses" as const, label: "Course Builder", icon: BookOpen },
                                { id: "companies" as const, label: "Companies", icon: Building2 },
                                { id: "config" as const, label: "Platform Config", icon: Settings },
                            ]).map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${isActive
                                            ? "bg-yellow-400 text-surface-0 shadow-[0_0_20px_rgba(255,193,7,0.15)]"
                                            : "text-white/30 hover:text-white/50 hover:bg-white/[0.03]"
                                            }`}
                                    >
                                        <Icon size={14} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tab Content */}
                        <AnimatePresence mode="wait">
                            {activeTab === "overview" && (
                                <motion.div
                                    key="overview"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.3, ease }}
                                    className="space-y-8"
                                >
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {([
                                            { label: "Total Users", value: stats.totalUsers, icon: Users, gradient: "from-blue-500 to-blue-600" },
                                            { label: "Students", value: stats.students, icon: GraduationCap, gradient: "from-emerald-500 to-green-600" },
                                            { label: "Admins", value: stats.admins, icon: ShieldCheck, gradient: "from-yellow-500 to-amber-600" },
                                            { label: "Super Admins", value: stats.superAdmins, icon: Crown, gradient: "from-red-500 to-rose-600" },
                                            { label: "Total Submissions", value: stats.totalSubmissions, icon: FileText, gradient: "from-purple-500 to-violet-600" },
                                            { label: "Violation Submissions", value: stats.violations, icon: AlertTriangle, gradient: "from-orange-500 to-amber-600" },
                                            { label: "Passed Tests", value: stats.passed, icon: CheckCircle2, gradient: "from-emerald-500 to-green-600" },
                                            { label: "Pass Rate", value: `${stats.passRate}%`, icon: BarChart3, gradient: "from-cyan-500 to-blue-600" },
                                        ]).map((stat, i) => {
                                            const Icon = stat.icon;
                                            return (
                                                <motion.div
                                                    key={stat.label}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.4, delay: i * 0.05, ease }}
                                                    className="group relative bg-surface-2/50 rounded-xl border border-white/[0.06] p-5 hover:border-white/[0.1] transition-colors"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25">
                                                            {stat.label}
                                                        </span>
                                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                                                            <Icon size={14} className="text-white" />
                                                        </div>
                                                    </div>
                                                    <p className="text-2xl font-bold text-white">
                                                        {stat.value}
                                                    </p>
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {/* System Health */}
                                    <div className="bg-surface-2/50 rounded-xl border border-white/[0.06] overflow-hidden">
                                        <div className="p-5 border-b border-white/[0.04]">
                                            <h3 className="text-sm font-bold text-white">
                                                System Health
                                            </h3>
                                        </div>
                                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {([
                                                { label: "Authentication", status: "healthy", icon: Shield },
                                                { label: "Database", status: "healthy", icon: Database },
                                                { label: "Proctoring", status: "healthy", icon: Eye },
                                                { label: "Performance", status: "warning", icon: Cpu },
                                            ]).map((item) => {
                                                const Icon = item.icon;
                                                const isHealthy = item.status === "healthy";
                                                return (
                                                    <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-surface-3/30 border border-white/[0.04]">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${isHealthy ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]"}`} />
                                                        <Icon size={14} className="text-white/30" />
                                                        <span className="text-xs font-medium text-white/50">{item.label}</span>
                                                        <span className={`ml-auto text-[10px] font-semibold uppercase tracking-wider ${isHealthy ? "text-emerald-400" : "text-yellow-400"}`}>
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Role Distribution */}
                                    <div className="bg-surface-2/50 rounded-xl border border-white/[0.06] overflow-hidden">
                                        <div className="p-5 border-b border-white/[0.04]">
                                            <h3 className="text-sm font-bold text-white">
                                                User Distribution
                                            </h3>
                                        </div>
                                        <div className="p-5">
                                            <div className="space-y-4">
                                                {([
                                                    { label: "Students", count: stats.students, color: "bg-emerald-400", pct: stats.totalUsers > 0 ? (stats.students / stats.totalUsers) * 100 : 0 },
                                                    { label: "Admins", count: stats.admins, color: "bg-yellow-400", pct: stats.totalUsers > 0 ? (stats.admins / stats.totalUsers) * 100 : 0 },
                                                    { label: "Super Admins", count: stats.superAdmins, color: "bg-red-400", pct: stats.totalUsers > 0 ? (stats.superAdmins / stats.totalUsers) * 100 : 0 },
                                                ]).map((bar) => (
                                                    <div key={bar.label} className="space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-white/40">{bar.label}</span>
                                                            <span className="text-xs font-bold text-white/60">{bar.count} ({Math.round(bar.pct)}%)</span>
                                                        </div>
                                                        <div className="h-2 bg-surface-3/60 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${bar.pct}%` }}
                                                                transition={{ duration: 0.8, ease }}
                                                                className={`h-full ${bar.color} rounded-full`}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === "courses" && (
                                <motion.div
                                    key="courses"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.3, ease }}
                                >
                                    <CourseBuilderTab />
                                </motion.div>
                            )}

                            {activeTab === "companies" && (
                                <motion.div
                                    key="companies"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.3, ease }}
                                >
                                    <CompanyManagementTab />
                                </motion.div>
                            )}

                            {activeTab === "config" && (
                                <motion.div
                                    key="config"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.3, ease }}
                                >
                                    <PlatformConfigTab />
                                </motion.div>
                            )}

                            {activeTab === "users" && (
                                <motion.div
                                    key="users"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.3, ease }}
                                    className="space-y-6"
                                >
                                    {/* Search */}
                                    <div className="relative max-w-sm">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                                        <input
                                            type="text"
                                            placeholder="Search users…"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-2/40 border border-white/[0.06] text-sm text-white/70 placeholder:text-white/15 outline-none focus:border-yellow-400/30 transition-colors"
                                        />
                                    </div>

                                    {/* Users Table */}
                                    <div className="bg-surface-2/50 rounded-xl border border-white/[0.06] overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-white/[0.04]">
                                                        <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/25">User</th>
                                                        <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/25">Role</th>
                                                        <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/25">Status</th>
                                                        <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/25">Last Active</th>
                                                        <th className="text-right px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/25">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredUsers.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="text-center py-12 text-sm text-white/20">
                                                                No users found
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        filteredUsers.map((u) => {
                                                            const uid = u._id || u.id || u.uid || "";
                                                            const name = u.display_name || u.displayName || "Unknown";
                                                            const initial = (typeof name === "string" ? name : "U").charAt(0).toUpperCase();
                                                            const isSelf = uid === ((user as any)?._id || (user as any)?.id);

                                                            return (
                                                                <tr key={uid} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                                                                    <td className="px-5 py-3">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-500/10 border border-white/[0.06] flex items-center justify-center text-xs font-bold text-yellow-400">
                                                                                {initial}
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-semibold text-white/70">{name}</p>
                                                                                <p className="text-[10px] text-white/20">{u.email}</p>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-5 py-3">
                                                                        <span className={`inline-flex text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${roleColor(u.role)}`}>
                                                                            {roleLabel(u.role)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-5 py-3">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <div className={`w-1.5 h-1.5 rounded-full ${(u.status || "active") === "inactive" ? "bg-red-400" : "bg-emerald-400"}`} />
                                                                            <span className={`text-xs ${(u.status || "active") === "inactive" ? "text-red-400/60" : "text-white/40"}`}>
                                                                                {(u.status || "active") === "inactive" ? "Inactive" : "Active"}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-5 py-3 text-xs text-white/30">
                                                                        {formatDate(u.last_active || u.lastLoginAt)}
                                                                    </td>
                                                                    <td className="px-5 py-3 text-right">
                                                                        <button
                                                                            onClick={() => setSelectedUser(u)}
                                                                            className="text-xs font-medium text-yellow-400/60 hover:text-yellow-400 transition-colors"
                                                                        >
                                                                            Manage
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>

                {/* ── User Management Modal ───────────────────────────────── */}
                <AnimatePresence>
                    {selectedUser && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                            onClick={() => setSelectedUser(null)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ duration: 0.2, ease }}
                                className="w-full max-w-md bg-surface-2 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="flex items-center justify-between p-5 border-b border-white/[0.04]">
                                    <h3 className="text-sm font-bold text-white">
                                        Manage User
                                    </h3>
                                    <button onClick={() => setSelectedUser(null)} className="text-white/20 hover:text-white/40 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-5 space-y-5">
                                    {/* User Info */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-500/10 border border-white/[0.06] flex items-center justify-center text-lg font-bold text-yellow-400">
                                            {(selectedUser.display_name || selectedUser.displayName || selectedUser.email || "U").charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">
                                                {selectedUser.display_name || selectedUser.displayName || "No name"}
                                            </p>
                                            <p className="text-xs text-white/25">{selectedUser.email}</p>
                                        </div>
                                    </div>

                                    {/* Info Fields */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-lg bg-surface-3/40 border border-white/[0.04]">
                                            <p className="text-[10px] text-white/25 mb-0.5">Current Role</p>
                                            <p className="text-xs font-semibold text-white/60">{roleLabel(selectedUser.role)}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-surface-3/40 border border-white/[0.04]">
                                            <p className="text-[10px] text-white/25 mb-0.5">Last Active</p>
                                            <p className="text-xs font-semibold text-white/60">{formatDate(selectedUser.last_active || selectedUser.lastLoginAt)}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-surface-3/40 border border-white/[0.04]">
                                            <p className="text-[10px] text-white/25 mb-0.5">Created</p>
                                            <p className="text-xs font-semibold text-white/60">{formatDate(selectedUser.created_at || selectedUser.createdAt)}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-surface-3/40 border border-white/[0.04]">
                                            <p className="text-[10px] text-white/25 mb-0.5">ID</p>
                                            <p className="text-xs font-semibold text-white/60 truncate">{selectedUser._id || selectedUser.id || "—"}</p>
                                        </div>
                                    </div>

                                    {/* Role Change */}
                                    <div>
                                        <p className="text-xs font-semibold text-white/40 mb-3">Change Role</p>
                                        <div className="flex gap-2">
                                            {(["student", "admin", "super_admin"] as const).map((role) => {
                                                const isCurrent = selectedUser.role === role;
                                                const isSelf = (selectedUser._id || selectedUser.id) === ((user as any)?._id || (user as any)?.id);
                                                return (
                                                    <button
                                                        key={role}
                                                        disabled={isCurrent || isSelf}
                                                        onClick={() => handleRoleChange(selectedUser._id || selectedUser.id || "", role)}
                                                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all border ${isCurrent
                                                            ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
                                                            : "bg-surface-3/30 text-white/30 border-white/[0.04] hover:text-white/50 hover:border-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed"
                                                            }`}
                                                    >
                                                        {roleLabel(role)}
                                                        {isCurrent && " ✓"}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {(selectedUser._id || selectedUser.id) === ((user as any)?._id || (user as any)?.id) && (
                                            <p className="text-[10px] text-red-400/60 mt-2">
                                                You cannot change your own role
                                            </p>
                                        )}
                                    </div>

                                    {/* Deactivate / Reactivate */}
                                    {(() => {
                                        const isSelf = (selectedUser._id || selectedUser.id) === ((user as any)?._id || (user as any)?.id);
                                        const isInactive = (selectedUser.status || "active") === "inactive";
                                        if (isSelf) return null;
                                        return (
                                            <div className="pt-2 border-t border-white/[0.04]">
                                                <button
                                                    onClick={() => handleToggleActive(selectedUser)}
                                                    disabled={deactivating}
                                                    className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-all border flex items-center justify-center gap-2 ${isInactive
                                                        ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/15"
                                                        : "bg-red-400/10 text-red-400 border-red-400/20 hover:bg-red-400/15"
                                                        } disabled:opacity-50`}
                                                >
                                                    {deactivating ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : isInactive ? (
                                                        <CheckCircle2 size={12} />
                                                    ) : (
                                                        <AlertTriangle size={12} />
                                                    )}
                                                    {isInactive ? "Reactivate Account" : "Deactivate Account"}
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </BootSequence>
    );
}
