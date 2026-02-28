"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRealTime } from "@/lib/hooks/useRealTime";
import {
    LayoutDashboard,
    Users,
    FileText,
    Trophy,
    Briefcase,
    Download,
    Bug,
    Settings,
    LogOut,
    User,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Shield,
    Menu,
    X,
    Search,
    RefreshCw,
    Eye,
    Clock,
    GraduationCap,
    Activity,
    Circle,
} from "lucide-react";
import StudentsTab from "./_components/StudentsTab";
import ActiveUsersTab from "./_components/ActiveUsersTab";
import SubmissionsTab from "./_components/SubmissionsTab";
import AdminLeaderboardTab from "./_components/LeaderboardTab";
import JobsTab from "./_components/JobsTab";
import CSVReportsTab from "./_components/CSVReportsTab";
import DebugTab from "./_components/DebugTab";
import SettingsTab from "./_components/SettingsTab";
import DSATab from "./_components/DSATab";

const ease = [0.16, 1, 0.3, 1] as const;

interface SidebarItem {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
}

interface SidebarGroup {
    title: string;
    items: SidebarItem[];
}

const sidebarGroups: SidebarGroup[] = [
    {
        title: "Main",
        items: [
            { id: "active", label: "Active Users", icon: Activity },
            { id: "students", label: "Students", icon: Users },
            { id: "leaderboard", label: "Leaderboard", icon: Trophy },
        ],
    },
    {
        title: "Academic",
        items: [
            { id: "submissions", label: "Submissions", icon: FileText },
            { id: "dsa", label: "DSA Challenges", icon: LayoutDashboard },
        ],
    },
    {
        title: "Operations",
        items: [
            { id: "jobs", label: "Job Board", icon: Briefcase },
            { id: "csv", label: "CSV Reports", icon: Download },
        ],
    },
    {
        title: "System",
        items: [
            { id: "debug", label: "Debug Console", icon: Bug },
            { id: "settings", label: "Settings", icon: Settings },
        ],
    },
];

export default function AdminDashboardPage() {
    const { user, userRole, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("active");
    
    // Real-time data
    const {
        students,
        submissions,
        activeStudents,
        status,
        activeCount,
        submissionCount,
        refresh,
        loading,
        error,
    } = useRealTime({
        pollInterval: 3000,
        enableRealTime: true,
    });
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const displayName = (user as any)?.display_name || (user as any)?.displayName || user?.email?.split("@")[0] || "Admin";
    const email = user?.email || "";
    const initial = (typeof displayName === 'string' ? displayName : "A").charAt(0).toUpperCase();

    // Auth check
    useEffect(() => {
        if (userRole && userRole !== "admin" && userRole !== "super_admin") {
            router.push("/dashboard");
        }
    }, [userRole, router]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        router.push("/auth");
    };

    return (
        <div className="min-h-screen bg-surface-0 flex">
            {/* ── Sidebar ── */}
            <aside
                className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-surface-1/80 backdrop-blur-2xl border-r border-white/[0.06] z-40 transition-all duration-300 ${sidebarCollapsed ? "w-[68px]" : "w-[240px]"
                    }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center gap-3 px-4 border-b border-white/[0.06] shrink-0">
                    <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,193,7,0.15)] shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" className="w-4 h-4">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    {!sidebarCollapsed && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm font-bold tracking-tight text-white/90"
                        >
                            CODE <span className="text-yellow-400">BUD</span>
                        </motion.span>
                    )}
                </div>

                {/* Nav Groups */}
                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                    {sidebarGroups.map((group) => (
                        <div key={group.title}>
                            {!sidebarCollapsed && (
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20 px-3 mb-2">
                                    {group.title}
                                </p>
                            )}
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className={`w-full flex items-center gap-3 rounded-lg transition-all duration-200 ${sidebarCollapsed ? "px-2.5 py-2.5 justify-center" : "px-3 py-2.5"
                                                } ${isActive
                                                    ? "bg-yellow-400/[0.08] text-yellow-400 border border-yellow-400/20"
                                                    : "text-white/40 hover:text-white/60 hover:bg-white/[0.03] border border-transparent"
                                                }`}
                                            title={sidebarCollapsed ? item.label : undefined}
                                        >
                                            <Icon size={16} className="shrink-0" />
                                            {!sidebarCollapsed && (
                                                <span className="text-[13px] font-medium truncate">{item.label}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sidebar toggle */}
                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="h-12 flex items-center justify-center border-t border-white/[0.06] text-white/25 hover:text-white/40 transition-colors"
                >
                    {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>

                {/* Profile */}
                <div className="border-t border-white/[0.06] p-3" ref={profileRef}>
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className={`w-full flex items-center gap-3 rounded-lg p-2 hover:bg-white/[0.03] transition-colors ${sidebarCollapsed ? "justify-center" : ""}`}
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-xs font-bold text-surface-0 shadow-[0_0_12px_rgba(255,193,7,0.15)] shrink-0">
                            {initial}
                        </div>
                        {!sidebarCollapsed && (
                            <>
                                <div className="flex-1 text-left min-w-0">
                                    <p className="text-[13px] font-medium text-white/80 truncate">{displayName}</p>
                                    <p className="text-[11px] text-white/25 truncate">{email}</p>
                                </div>
                                <ChevronDown size={14} className={`text-white/20 transition-transform ${showProfileMenu ? "rotate-180" : ""}`} />
                            </>
                        )}
                    </button>

                    <AnimatePresence>
                        {showProfileMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                className={`absolute bottom-20 ${sidebarCollapsed ? "left-[72px]" : "left-3 right-3"} bg-surface-2/95 backdrop-blur-2xl rounded-xl border border-white/[0.08] shadow-2xl shadow-black/40 overflow-hidden`}
                            >
                                <div className="p-2">
                                    {userRole === "super_admin" && (
                                        <Link
                                            href="/super-admin"
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400/60 hover:text-red-400 hover:bg-red-400/[0.05] transition-colors"
                                            onClick={() => setShowProfileMenu(false)}
                                        >
                                            <Shield size={15} />
                                            Super Admin
                                        </Link>
                                    )}
                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors"
                                        onClick={() => setShowProfileMenu(false)}
                                    >
                                        <User size={15} />
                                        Profile
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400/60 hover:text-red-400 hover:bg-red-400/[0.05] transition-colors"
                                    >
                                        <LogOut size={15} />
                                        Sign Out
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-[240px]"}`}>
                {/* Top bar (mobile + search) */}
                <header className="h-16 bg-surface-1/60 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                            className="lg:hidden p-2 rounded-lg hover:bg-white/[0.05] text-white/40"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="flex items-center gap-2">
                            <Shield size={16} className="text-yellow-400" />
                            <h1 className="text-sm font-bold text-white/80">
                                Admin Dashboard
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Live Status Indicator */}
                        <div
                            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${
                                status === "connected"
                                    ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                                    : status === "connecting"
                                        ? "bg-blue-400/10 border-blue-400/20 text-blue-400"
                                        : status === "refreshing"
                                            ? "bg-yellow-400/10 border-yellow-400/20 text-yellow-400"
                                            : "bg-red-400/10 border-red-400/20 text-red-400"
                            }`}
                        >
                            <Circle
                                size={6}
                                className={`fill-current ${status === "connected" || status === "refreshing" ? "animate-pulse" : ""}`}
                            />
                            {status === "connected" && "Live"}
                            {status === "connecting" && "Connecting"}
                            {status === "refreshing" && "Refreshing"}
                            {status === "error" && "Error"}
                        </div>

                        {/* Active Students Counter */}
                        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-3/50 border border-white/[0.06]">
                            <Activity size={12} className="text-white/30" />
                            <span className="text-xs font-semibold text-white/50">
                                {activeCount}
                            </span>
                            <span className="text-[10px] text-white/20">active</span>
                        </div>

                        {/* Submissions Counter */}
                        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-3/50 border border-white/[0.06]">
                            <FileText size={12} className="text-white/30" />
                            <span className="text-xs font-semibold text-white/50">
                                {submissionCount}
                            </span>
                            <span className="text-[10px] text-white/20">submissions</span>
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={refresh}
                            disabled={status === "refreshing"}
                            className="p-2 rounded-lg hover:bg-white/[0.05] text-white/30 hover:text-white/50 transition-colors disabled:opacity-50"
                            title="Refresh data"
                        >
                            <RefreshCw size={14} className={status === "refreshing" ? "animate-spin" : ""} />
                        </button>

                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-3/50 border border-white/[0.06]">
                            <Shield size={12} className="text-yellow-400" />
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                                {userRole || "admin"}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Content area */}
                <main className="p-4 lg:p-8">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease }}
                    >
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-white capitalize">
                                {activeTab === "csv" ? "CSV Reports" : activeTab === "dsa" ? "DSA Challenges" : activeTab}
                            </h2>
                            <p className="text-sm text-white/30 mt-1">
                                Manage and monitor your platform
                            </p>
                        </div>

                        {/* Tab content */}
                        {activeTab === "active" && (
                            <ActiveUsersTab
                                activeStudents={activeStudents}
                                submissions={submissions}
                            />
                        )}
                        {activeTab === "students" && <StudentsTab />}
                        {activeTab === "submissions" && <SubmissionsTab />}
                        {activeTab === "leaderboard" && <AdminLeaderboardTab />}
                        {activeTab === "jobs" && <JobsTab />}
                        {activeTab === "csv" && <CSVReportsTab />}
                        {activeTab === "debug" && <DebugTab />}
                        {activeTab === "settings" && <SettingsTab />}
                        {activeTab === "dsa" && <DSATab />}
                    </motion.div>
                </main>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
                            className="fixed left-0 top-0 h-screen w-[280px] bg-surface-1/95 backdrop-blur-2xl border-r border-white/[0.06] z-50 lg:hidden"
                        >
                            <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.06]">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" className="w-4 h-4">
                                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-bold text-white/90">
                                        CODE <span className="text-yellow-400">BUD</span>
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsMobileSidebarOpen(false)}
                                    className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="py-4 px-3 space-y-6">
                                {sidebarGroups.map((group) => (
                                    <div key={group.title}>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20 px-3 mb-2">
                                            {group.title}
                                        </p>
                                        <div className="space-y-0.5">
                                            {group.items.map((item) => {
                                                const Icon = item.icon;
                                                const isActive = activeTab === item.id;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => { setActiveTab(item.id); setIsMobileSidebarOpen(false); }}
                                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${isActive
                                                            ? "bg-yellow-400/[0.08] text-yellow-400 border border-yellow-400/20"
                                                            : "text-white/40 hover:text-white/60 hover:bg-white/[0.03] border border-transparent"
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
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
