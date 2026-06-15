"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import {
    LayoutDashboard,
    BookOpen,
    Code2,
    Trophy,
    Briefcase,
    Zap,
    User,
    LogOut,
    ChevronDown,
    GraduationCap,
    Menu,
    X,
    CheckCircle2,
    Target,
    ArrowRight,
    MapPin,
    Award,
    BarChart3,
    RefreshCw,
    Star,
    ArrowUpRight,
    Clock,
    Sparkles,
    Compass,
} from "lucide-react";
import leaderboardService from "@/lib/services/leaderboardService";
import { getUserSubmissions } from "@/lib/services/submissionService";

import BootSequence from "@/app/components/BootSequence";
import RecommendedCourseList from "./_components/RecommendedCourseList";

// ─── Constants ────────────────────────────────────────────────────────────────

const ease = [0.16, 1, 0.3, 1] as const;

const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { id: "learning-path", label: "Learning Path", icon: Compass, href: "/learning-path" },
    { id: "aptitude", label: "Aptitude Test", icon: BookOpen, href: "/aptitude-test" },
    { id: "dsa", label: "DSA Test", icon: Code2, href: "/dsa-test" },
    { id: "problems", label: "Problems", icon: Zap, href: "/problems" },
];

const tabItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "assessments", label: "Assessments", icon: Target },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "jobs", label: "Jobs", icon: Briefcase },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
    userId?: string;
    userName?: string;
    displayName?: string;
    userEmail?: string;
    email?: string;
    totalScore?: number;
    testsCompleted?: number;
    averageScore?: number | string;
    lastSubmission?: string;
    rank?: number;
    [key: string]: unknown;
}

interface Submission {
    id?: string;
    test_type?: string;
    testType?: string;
    score?: number;
    total_questions?: number;
    totalQuestions?: number;
    submitted_at?: string;
    submittedAt?: string;
    timestamp?: string;
    passed?: boolean;
    [key: string]: unknown;
}

interface StatCard {
    label: string;
    value: string | number;
    icon: React.ElementType;
    gradient: string;
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
    const { user, userRole, logout } = useAuth();
    const router = useRouter();

    // UI state
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [activePage, setActivePage] = useState("dashboard");
    const [activeTab, setActiveTab] = useState("overview");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Data state
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Derived data
    const displayName =
        (user as any)?.display_name ||
        (user as any)?.displayName ||
        user?.email?.split("@")[0] ||
        "User";
    const email = user?.email || "";
    const initial = (typeof displayName === "string" ? displayName : "U")
        .charAt(0)
        .toUpperCase();

    // ─── Data Fetching ────────────────────────────────────────────────────────

    const fetchData = useCallback(
        async (isRefresh = false) => {
            try {
                if (isRefresh) setRefreshing(true);

                // Fetch submissions
                let userSubs: Submission[] = [];
                try {
                    const userId =
                        (user as any)?._id || (user as any)?.id || "";
                    if (userId) {
                        const result = await getUserSubmissions(userId);
                        userSubs = Array.isArray(result)
                            ? result
                            : (result as any)?.data || [];
                    }
                } catch {
                    // localStorage fallback
                    if (typeof window !== "undefined") {
                        const stored = JSON.parse(
                            localStorage.getItem("all_submissions") || "[]",
                        );
                        const uid =
                            (user as any)?._id || (user as any)?.id || "";
                        userSubs = stored.filter(
                            (s: any) =>
                                s.userId === uid ||
                                s.userEmail === user?.email,
                        );
                    }
                }
                setSubmissions(userSubs);

                // Fetch leaderboard
                try {
                    const lb = await leaderboardService.getTopUsers(10);
                    setLeaderboard(lb || []);
                    const uid =
                        (user as any)?._id || (user as any)?.id || "";
                    if (uid) {
                        const rank = await leaderboardService.getUserRank(uid);
                        setUserRank(rank);
                    }
                } catch {
                    setLeaderboard([]);
                }


            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [user],
    );

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ─── Click Outside ────────────────────────────────────────────────────────

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                profileRef.current &&
                !profileRef.current.contains(e.target as Node)
            ) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ─── Computed Stats ───────────────────────────────────────────────────────

    const totalTests = submissions.length;
    const totalScore = submissions.reduce(
        (acc, s) => acc + (s.score || 0),
        0,
    );
    const avgScore =
        totalTests > 0 ? Math.round(totalScore / totalTests) : 0;
    const passedTests = submissions.filter((s) => {
        const score = s.score || 0;
        const total = s.total_questions || s.totalQuestions || 30;
        return score / total >= 0.6;
    }).length;

    const stats: StatCard[] = [
        {
            label: "Problems Solved",
            value: totalTests || "—",
            icon: Code2,
            gradient: "from-yellow-400 to-amber-500",
        },
        {
            label: "Average Score",
            value: totalTests > 0 ? `${avgScore}%` : "—",
            icon: BarChart3,
            gradient: "from-emerald-400 to-green-500",
        },
        {
            label: "Current Rank",
            value: userRank?.rank ? `#${userRank.rank}` : "—",
            icon: Trophy,
            gradient: "from-purple-400 to-violet-500",
        },
        {
            label: "Tests Passed",
            value: passedTests || "—",
            icon: CheckCircle2,
            gradient: "from-blue-400 to-cyan-500",
        },
    ];

    const handleLogout = async () => {
        await logout();
        router.push("/auth");
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <BootSequence>
            <div className="min-h-screen bg-surface-0">
                {/* ── Top Navbar ─────────────────────────────────────────────── */}
                <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-1/80 backdrop-blur-2xl border-b border-white/[0.06]">
                    <div className="h-full flex items-center justify-between px-4 lg:px-8">
                        {/* Logo */}
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 group"
                        >
                            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,193,7,0.15)] group-hover:shadow-[0_0_30px_rgba(255,193,7,0.25)] transition-shadow">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="black"
                                    strokeWidth="2.5"
                                    className="w-4 h-4"
                                >
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <span className="text-sm font-bold tracking-tight text-white/90 hidden sm:block">
                                CODE{" "}
                                <span className="text-yellow-400">BUD</span>
                            </span>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = activePage === item.id;
                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        onClick={() => setActivePage(item.id)}
                                        className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${isActive
                                            ? "text-yellow-400"
                                            : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"
                                            }`}
                                    >
                                        <Icon size={16} />
                                        {item.label}
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeNav"
                                                className="absolute inset-0 rounded-lg bg-yellow-400/[0.08] border border-yellow-400/20"
                                                transition={{
                                                    type: "spring",
                                                    duration: 0.5,
                                                    bounce: 0.2,
                                                }}
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Right Side */}
                        <div className="flex items-center gap-3">
                            {/* Role Badge */}
                            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-3/50 border border-white/[0.06]">
                                <GraduationCap
                                    size={12}
                                    className="text-yellow-400"
                                />
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                                    {userRole || "student"}
                                </span>
                            </div>

                            {/* Profile Dropdown */}
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() =>
                                        setShowProfileMenu(!showProfileMenu)
                                    }
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-sm font-bold text-surface-0 shadow-[0_0_15px_rgba(255,193,7,0.15)]">
                                        {initial}
                                    </div>
                                    <ChevronDown
                                        size={14}
                                        className={`text-white/30 transition-transform duration-200 ${showProfileMenu ? "rotate-180" : ""}`}
                                    />
                                </button>

                                <AnimatePresence>
                                    {showProfileMenu && (
                                        <motion.div
                                            initial={{
                                                opacity: 0,
                                                y: 8,
                                                scale: 0.95,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                scale: 1,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                y: 8,
                                                scale: 0.95,
                                            }}
                                            transition={{ duration: 0.2, ease }}
                                            className="absolute right-0 top-full mt-2 w-64 bg-surface-2/95 backdrop-blur-2xl rounded-xl border border-white/[0.08] shadow-2xl shadow-black/40 overflow-hidden"
                                        >
                                            <div className="p-4 border-b border-white/[0.06]">
                                                <p className="text-sm font-semibold text-white truncate">
                                                    {displayName}
                                                </p>
                                                <p className="text-xs text-white/30 truncate mt-0.5">
                                                    {email}
                                                </p>
                                            </div>
                                            <div className="p-2">
                                                <Link
                                                    href="/profile"
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors"
                                                    onClick={() =>
                                                        setShowProfileMenu(false)
                                                    }
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

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() =>
                                    setIsMobileMenuOpen(!isMobileMenuOpen)
                                }
                                className="md:hidden p-2 rounded-lg hover:bg-white/[0.05] transition-colors text-white/40"
                            >
                                {isMobileMenuOpen ? (
                                    <X size={20} />
                                ) : (
                                    <Menu size={20} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Nav */}
                    <AnimatePresence>
                        {isMobileMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="md:hidden bg-surface-1/95 backdrop-blur-2xl border-b border-white/[0.06] overflow-hidden"
                            >
                                <nav className="p-4 space-y-1">
                                    {navItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = activePage === item.id;
                                        return (
                                            <Link
                                                key={item.id}
                                                href={item.href}
                                                onClick={() => {
                                                    setActivePage(item.id);
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                                    ? "text-yellow-400 bg-yellow-400/[0.08] border border-yellow-400/20"
                                                    : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"
                                                    }`}
                                            >
                                                <Icon size={18} />
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </header>

                {/* ── Content ────────────────────────────────────────────────── */}
                <main className="pt-16">
                    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
                        {/* Welcome + Refresh */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease }}
                            className="flex items-start justify-between mb-8 gap-4"
                        >
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                    Welcome back,{" "}
                                    <span className="text-yellow-400">
                                        {displayName}
                                    </span>
                                </h1>
                                <p className="text-sm text-white/30 mt-1">
                                    Continue your coding journey where you left off
                                </p>
                            </div>
                            <button
                                onClick={() => fetchData(true)}
                                disabled={refreshing}
                                className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-2/50 border border-white/[0.06] text-xs font-medium text-white/40 hover:text-white/60 hover:border-white/[0.1] transition-all disabled:opacity-50"
                            >
                                <RefreshCw
                                    size={14}
                                    className={
                                        refreshing ? "animate-spin" : ""
                                    }
                                />
                                {refreshing ? "Refreshing…" : "Refresh"}
                            </button>
                        </motion.div>

                        {/* Personalized Path — primary surface; full reveal at /learning-path */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1, ease }}
                            className="mb-8"
                        >
                            <div className="mb-3 flex items-end justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-amber-400" />
                                    <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
                                        Your learning path
                                    </h2>
                                </div>
                                <Link
                                    href="/learning-path"
                                    className="group inline-flex items-center gap-1 text-[12px] font-semibold text-amber-400/70 transition-colors hover:text-amber-300"
                                >
                                    View full path
                                    <ArrowRight
                                        size={12}
                                        className="transition-transform group-hover:translate-x-0.5"
                                    />
                                </Link>
                            </div>
                            <RecommendedCourseList />
                        </motion.div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {stats.map((stat, i) => {
                                const Icon = stat.icon;
                                return (
                                    <motion.div
                                        key={stat.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.5,
                                            delay: i * 0.08,
                                            ease,
                                        }}
                                        className="relative group"
                                    >
                                        <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-white/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                        <div className="relative bg-surface-2/50 backdrop-blur-sm rounded-xl border border-white/[0.06] p-5 hover:border-white/[0.1] transition-colors">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-white/30">
                                                    {stat.label}
                                                </span>
                                                <div
                                                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}
                                                >
                                                    <Icon
                                                        size={14}
                                                        className="text-white"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-2xl font-bold text-white">
                                                {stat.value}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Section Tabs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.35, ease }}
                            className="mb-6"
                        >
                            <div className="flex items-center gap-1 p-1 bg-surface-2/30 rounded-xl border border-white/[0.04] w-fit">
                                {tabItems.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() =>
                                                setActiveTab(tab.id)
                                            }
                                            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${isActive
                                                ? "text-yellow-400"
                                                : "text-white/35 hover:text-white/55"
                                                }`}
                                        >
                                            <Icon size={14} />
                                            <span className="hidden sm:inline">
                                                {tab.label}
                                            </span>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeTab"
                                                    className="absolute inset-0 rounded-lg bg-surface-3/80 border border-white/[0.08]"
                                                    transition={{
                                                        type: "spring",
                                                        duration: 0.4,
                                                        bounce: 0.15,
                                                    }}
                                                    style={{ zIndex: -1 }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Tab Content */}
                        <AnimatePresence mode="wait">
                            {/* ── Overview Tab ───────────────────────────────── */}
                            {activeTab === "overview" && (
                                <OverviewTab
                                    submissions={submissions}
                                    leaderboard={leaderboard}
                                    userEmail={email}
                                    onViewLeaderboard={() =>
                                        setActiveTab("leaderboard")
                                    }
                                />
                            )}

                            {/* ── Courses Tab ─────────────────────────────────── */}
                            {activeTab === "courses" && <CoursesTab />}

                            {/* ── Assessments Tab ────────────────────────────── */}
                            {activeTab === "assessments" && <AssessmentsTab />}

                            {/* ── Leaderboard Tab ────────────────────────────── */}
                            {activeTab === "leaderboard" && (
                                <LeaderboardTab
                                    leaderboard={leaderboard}
                                    userRank={userRank}
                                    userEmail={email}
                                />
                            )}

                            {/* ── Jobs Tab ────────────────────────────────────── */}
                            {activeTab === "jobs" && (
                                <JobsTab />
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </BootSequence>
    );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
    submissions,
    leaderboard,
    userEmail,
    onViewLeaderboard,
}: {
    submissions: Submission[];
    leaderboard: LeaderboardEntry[];
    userEmail: string;
    onViewLeaderboard: () => void;
}) {
    return (
        <motion.div
            key="overview"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease }}
        >
            {/* Quick Actions */}
            <h2 className="text-lg font-bold text-white mb-4">
                Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {[
                    {
                        title: "Aptitude Test",
                        desc: "Test your analytical skills with timed assessments",
                        icon: BookOpen,
                        href: "/aptitude-test",
                        gradient: "from-yellow-400/10 to-amber-500/5",
                        badge: "45 min",
                    },
                    {
                        title: "DSA Challenge",
                        desc: "Solve data structures and algorithms problems",
                        icon: Code2,
                        href: "/dsa-test",
                        gradient: "from-emerald-400/10 to-green-500/5",
                        badge: "90 min",
                    },
                    {
                        title: "Practice Problems",
                        desc: "Browse and solve coding problems at your pace",
                        icon: Zap,
                        href: "/problems",
                        gradient: "from-purple-400/10 to-violet-500/5",
                        badge: "∞",
                    },
                ].map((action, i) => {
                    const Icon = action.icon;
                    return (
                        <Link key={action.title} href={action.href}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.5,
                                    delay: i * 0.08,
                                    ease,
                                }}
                                className="group relative overflow-hidden bg-surface-2/50 rounded-xl border border-white/[0.06] p-6 hover:border-yellow-400/20 transition-all duration-300 cursor-pointer h-full"
                            >
                                <div
                                    className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                                />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-surface-3/80 border border-white/[0.06] flex items-center justify-center group-hover:border-yellow-400/20 transition-colors">
                                            <Icon
                                                size={18}
                                                className="text-white/50 group-hover:text-yellow-400 transition-colors"
                                            />
                                        </div>
                                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-3/60 text-white/25 border border-white/[0.04]">
                                            {action.badge}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-semibold text-white mb-1 group-hover:text-yellow-400 transition-colors">
                                        {action.title}
                                    </h3>
                                    <p className="text-xs text-white/30 leading-relaxed">
                                        {action.desc}
                                    </p>
                                    <div className="mt-4 flex items-center gap-1 text-xs font-medium text-yellow-400/0 group-hover:text-yellow-400/80 transition-colors">
                                        Start now{" "}
                                        <ArrowUpRight size={12} />
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>

            {/* Recent Activity + Leaderboard Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Recent Submissions */}
                <div className="lg:col-span-3 bg-surface-2/50 rounded-xl border border-white/[0.06] overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-white/[0.04]">
                        <h3 className="text-sm font-semibold text-white/80">
                            Recent Activity
                        </h3>
                        <span className="text-[11px] text-white/25 font-medium">
                            {submissions.length} total
                        </span>
                    </div>
                    {submissions.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-surface-3/50 border border-white/[0.06] flex items-center justify-center">
                                <Target
                                    size={20}
                                    className="text-white/15"
                                />
                            </div>
                            <p className="text-sm text-white/30 mb-1">
                                No submissions yet
                            </p>
                            <p className="text-xs text-white/15">
                                Complete an assessment to see your results
                                here
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.04]">
                            {submissions.slice(0, 5).map((sub, i) => {
                                const testType =
                                    sub.test_type ||
                                    sub.testType ||
                                    "Aptitude Test";
                                const score = sub.score || 0;
                                const total =
                                    sub.total_questions ||
                                    sub.totalQuestions ||
                                    30;
                                const pct = Math.round(
                                    (score / total) * 100,
                                );
                                const passed = pct >= 60;
                                const time =
                                    sub.submitted_at ||
                                    sub.submittedAt ||
                                    sub.timestamp;
                                return (
                                    <div
                                        key={sub.id || i}
                                        className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${passed
                                                    ? "bg-emerald-400/10 text-emerald-400"
                                                    : "bg-red-400/10 text-red-400"
                                                    }`}
                                            >
                                                {passed ? (
                                                    <CheckCircle2
                                                        size={14}
                                                    />
                                                ) : (
                                                    <X size={14} />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-white/70 truncate">
                                                    {testType}
                                                </p>
                                                <p className="text-[11px] text-white/25">
                                                    {time
                                                        ? new Date(
                                                            time as string,
                                                        ).toLocaleDateString()
                                                        : "—"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-3">
                                            <p
                                                className={`text-sm font-bold ${passed
                                                    ? "text-emerald-400"
                                                    : "text-red-400"
                                                    }`}
                                            >
                                                {pct}%
                                            </p>
                                            <p className="text-[11px] text-white/25">
                                                {score}/{total}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Leaderboard Preview */}
                <div className="lg:col-span-2 bg-surface-2/50 rounded-xl border border-white/[0.06] overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-white/[0.04]">
                        <h3 className="text-sm font-semibold text-white/80">
                            Leaderboard
                        </h3>
                        <button
                            onClick={onViewLeaderboard}
                            className="text-[11px] text-yellow-400/60 hover:text-yellow-400 font-medium transition-colors"
                        >
                            View all →
                        </button>
                    </div>
                    {leaderboard.length === 0 ? (
                        <div className="p-12 text-center">
                            <Trophy
                                size={20}
                                className="mx-auto mb-2 text-white/15"
                            />
                            <p className="text-xs text-white/25">
                                Rankings appear after assessments
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.04]">
                            {leaderboard.slice(0, 5).map((entry, i) => {
                                const name =
                                    entry.userName ||
                                    entry.displayName ||
                                    "Anonymous";
                                const isMe =
                                    userEmail ===
                                    (entry.userEmail || entry.email);
                                return (
                                    <div
                                        key={entry.userId || i}
                                        className={`flex items-center gap-3 px-5 py-3 ${isMe
                                            ? "bg-yellow-400/[0.04]"
                                            : "hover:bg-white/[0.02]"
                                            } transition-colors`}
                                    >
                                        <span className="w-6 text-center text-xs font-bold text-white/30">
                                            {i === 0
                                                ? "🥇"
                                                : i === 1
                                                    ? "🥈"
                                                    : i === 2
                                                        ? "🥉"
                                                        : `${i + 1}`}
                                        </span>
                                        <div className="w-7 h-7 rounded-md bg-surface-3/80 border border-white/[0.06] flex items-center justify-center text-[11px] font-bold text-white/40 shrink-0">
                                            {name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`text-[13px] font-medium truncate ${isMe
                                                    ? "text-yellow-400"
                                                    : "text-white/60"
                                                    }`}
                                            >
                                                {name}{" "}
                                                {isMe && (
                                                    <span className="text-[10px] text-yellow-400/60">
                                                        (you)
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <span className="text-xs font-bold text-white/40 tabular-nums">
                                            {entry.totalScore?.toLocaleString() ||
                                                0}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Guidelines */}
            <div className="mt-8 bg-surface-2/30 rounded-xl border border-white/[0.04] p-6">
                <h3 className="text-sm font-semibold text-white/50 mb-4 flex items-center gap-2">
                    <Star size={14} className="text-yellow-400/50" />
                    Assessment Guidelines
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { icon: "🌐", text: "Stable internet required" },
                        {
                            icon: "🖥️",
                            text: "Chrome/Firefox recommended",
                        },
                        { icon: "📷", text: "Camera access needed" },
                        { icon: "🔇", text: "Quiet environment" },
                    ].map((tip, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-2.5 text-xs text-white/30"
                        >
                            <span className="text-base">{tip.icon}</span>
                            {tip.text}
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

// ─── Courses Tab ──────────────────────────────────────────────────────────────

function CoursesTab() {
    const [enrollments, setEnrollments] = React.useState<any[]>([]);
    const [courseMap, setCourseMap] = React.useState<Record<string, any>>({});
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        (async () => {
            try {
                const { getMyEnrollments } = await import("@/lib/services/courseService");
                const { listCourses } = await import("@/lib/services/courseService");
                const [enrollRes, coursesRes] = await Promise.all([
                    getMyEnrollments().catch(() => ({ success: false, enrollments: [] })),
                    listCourses().catch(() => ({ success: false, courses: [] })),
                ]);
                if (enrollRes.success) setEnrollments(enrollRes.enrollments || []);
                const map: Record<string, any> = {};
                (coursesRes.courses || []).forEach((c: any) => { map[c._id] = c; });
                setCourseMap(map);
            } catch { }
            setLoading(false);
        })();
    }, []);

    if (loading) {
        return (
            <div className="py-16 text-center">
                <div className="w-6 h-6 border-2 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-white/20">Loading courses...</p>
            </div>
        );
    }

    return (
        <motion.div
            key="courses"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease }}
        >
            {enrollments.length > 0 && (
                <>
                    <h3 className="text-sm font-bold text-white mb-4">My Enrolled Courses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {enrollments.map((enrollment: any, i: number) => {
                            const course = courseMap[enrollment.course_id];
                            const title = course?.title || enrollment.course_id;
                            const totalLessons = course?.sections?.reduce((a: number, s: any) => a + (s.lessons?.length || 0), 0) || 0;
                            const completedCount = enrollment.completed_lessons?.length || 0;
                            const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
                            return (
                                <motion.div
                                    key={enrollment._id || enrollment.course_id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: i * 0.08, ease }}
                                    className="group relative bg-surface-2/50 backdrop-blur-sm rounded-2xl border border-white/[0.06] overflow-hidden hover:border-white/[0.12] transition-all duration-300"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="relative p-6 space-y-5">
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center flex-shrink-0">
                                                <BookOpen size={24} className="text-yellow-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-white mb-1.5 truncate">{title}</h3>
                                                <p className="text-xs font-medium text-white/40">
                                                    {course?.instructor_name || "Instructor"}
                                                </p>
                                                {course?.avg_rating > 0 && (
                                                    <div className="flex items-center gap-1.5 mt-2">
                                                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                                        <span className="text-sm font-semibold text-yellow-400">{course.avg_rating}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-white/40">Course Progress</span>
                                                <span className="text-xs font-bold text-yellow-400">{pct}%</span>
                                            </div>
                                            <div className="h-2 bg-surface-3/60 rounded-full overflow-hidden border border-white/[0.04]">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 + 0.3, ease }}
                                                    className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 relative">
                                                    <div className="absolute inset-0 bg-white/20" />
                                                </motion.div>
                                            </div>
                                            <p className="text-xs text-white/30">{completedCount} of {totalLessons} lessons completed</p>
                                        </div>
                                        <Link href={`/courses/${enrollment.course_id}`}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-yellow-400 text-surface-0 rounded-xl text-sm font-bold hover:bg-yellow-300 transition-all shadow-[0_0_20px_rgba(255,193,7,0.15)]">
                                            Continue Learning <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </>
            )}
            <Link href="/courses"
                className="flex items-center justify-center gap-2 w-full py-4 bg-surface-2/50 rounded-xl border border-white/[0.06] text-sm font-semibold text-white/40 hover:text-yellow-400 hover:border-yellow-400/20 transition-all">
                Browse All Courses <ArrowRight size={14} />
            </Link>
        </motion.div>
    );
}

// ─── Assessments Tab ──────────────────────────────────────────────────────────

function AssessmentsTab() {
    const assessments = [
        {
            id: "aptitude",
            title: "Aptitude Assessment",
            subtitle: "Logic & Reasoning",
            desc: "Test your analytical thinking with logical reasoning, quantitative aptitude, and problem-solving questions.",
            icon: BookOpen,
            difficulty: "Intermediate",
            duration: "45 min",
            href: "/aptitude-test",
            features: [
                "30 questions",
                "Timer-based",
                "Auto-grading",
                "Instant results",
            ],
            gradient: "from-yellow-400/5 to-amber-500/5",
            iconBg: "bg-yellow-400/10 border-yellow-400/20",
            iconColor: "text-yellow-400",
        },
        {
            id: "dsa",
            title: "DSA Challenge",
            subtitle: "Data Structures & Algorithms",
            desc: "Solve coding problems with a real code editor. Multiple language support with real-time execution.",
            icon: Code2,
            difficulty: "Advanced",
            duration: "90 min",
            href: "/dsa-test",
            features: [
                "Code Editor",
                "Multiple Languages",
                "Real-time Execution",
                "Test Cases",
            ],
            gradient: "from-emerald-400/5 to-green-500/5",
            iconBg: "bg-emerald-400/10 border-emerald-400/20",
            iconColor: "text-emerald-400",
        },
    ];

    return (
        <motion.div
            key="assessments"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease }}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assessments.map((test, i) => {
                    const Icon = test.icon;
                    return (
                        <motion.div
                            key={test.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.5,
                                delay: i * 0.1,
                                ease,
                            }}
                            className="group relative bg-surface-2/50 rounded-2xl border border-white/[0.06] overflow-hidden hover:border-white/[0.12] transition-all duration-300"
                        >
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${test.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                            />
                            <div className="relative p-7">
                                <div className="flex items-start justify-between mb-6">
                                    <div
                                        className={`w-12 h-12 rounded-xl ${test.iconBg} border flex items-center justify-center`}
                                    >
                                        <Icon
                                            size={22}
                                            className={test.iconColor}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-400/10 text-emerald-400 border border-emerald-400/15">
                                            {test.difficulty}
                                        </span>
                                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-surface-3/60 text-white/30 border border-white/[0.06]">
                                            <Clock
                                                size={10}
                                                className="inline mr-1 -mt-px"
                                            />
                                            {test.duration}
                                        </span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">
                                    {test.title}
                                </h3>
                                <p className="text-xs font-medium text-yellow-400/60 mb-3">
                                    {test.subtitle}
                                </p>
                                <p className="text-sm text-white/35 leading-relaxed mb-6">
                                    {test.desc}
                                </p>
                                <div className="grid grid-cols-2 gap-2 mb-6">
                                    {test.features.map((f, fi) => (
                                        <div
                                            key={fi}
                                            className="flex items-center gap-2 text-xs text-white/35"
                                        >
                                            <CheckCircle2
                                                size={12}
                                                className="text-emerald-400/50 shrink-0"
                                            />
                                            {f}
                                        </div>
                                    ))}
                                </div>
                                <Link
                                    href={test.href}
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-yellow-400 text-surface-0 text-sm font-bold hover:bg-yellow-300 transition-colors shadow-[0_0_20px_rgba(255,193,7,0.15)]"
                                >
                                    Start Assessment{" "}
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}

// ─── Leaderboard Tab ──────────────────────────────────────────────────────────

function LeaderboardTab({
    leaderboard,
    userRank,
    userEmail,
}: {
    leaderboard: LeaderboardEntry[];
    userRank: any;
    userEmail: string;
}) {
    return (
        <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease }}
        >
            <div className="bg-surface-2/50 rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-white/[0.04]">
                    <div>
                        <h3 className="text-base font-bold text-white">
                            Student Rankings
                        </h3>
                        <p className="text-xs text-white/25 mt-0.5">
                            Based on assessment scores and completion rates
                        </p>
                    </div>
                    {userRank?.rank && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
                            <Award
                                size={14}
                                className="text-yellow-400"
                            />
                            <span className="text-xs font-bold text-yellow-400">
                                Your Rank: #{userRank.rank}
                            </span>
                        </div>
                    )}
                </div>

                {leaderboard.length === 0 ? (
                    <div className="p-16 text-center">
                        <Trophy
                            size={32}
                            className="mx-auto mb-3 text-white/10"
                        />
                        <h4 className="text-sm font-semibold text-white/30 mb-1">
                            No Rankings Yet
                        </h4>
                        <p className="text-xs text-white/15 max-w-xs mx-auto">
                            Rankings appear once students complete
                            assessments. Be the first!
                        </p>
                    </div>
                ) : (
                    <div>
                        {/* Top 3 Podium */}
                        {leaderboard.length >= 3 && (
                            <div className="flex items-end justify-center gap-4 px-5 py-8 border-b border-white/[0.04]">
                                {[1, 0, 2].map((pos, idx) => {
                                    const entry = leaderboard[pos];
                                    if (!entry) return null;
                                    const name =
                                        entry.userName ||
                                        entry.displayName ||
                                        "Anonymous";
                                    const isMe =
                                        userEmail ===
                                        (entry.userEmail ||
                                            entry.email);
                                    const heights = [
                                        "h-24",
                                        "h-32",
                                        "h-20",
                                    ];
                                    const medals = ["🥈", "🥇", "🥉"];
                                    return (
                                        <div
                                            key={pos}
                                            className="flex flex-col items-center gap-2"
                                        >
                                            <div
                                                className={`w-10 h-10 rounded-xl ${isMe
                                                    ? "bg-gradient-to-br from-yellow-400 to-amber-500"
                                                    : "bg-surface-3/80 border border-white/[0.08]"
                                                    } flex items-center justify-center text-sm font-bold ${isMe
                                                        ? "text-surface-0"
                                                        : "text-white/40"
                                                    }`}
                                            >
                                                {name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                            <span className="text-xs font-medium text-white/50 max-w-[80px] truncate text-center">
                                                {name}
                                            </span>
                                            <div
                                                className={`${heights[idx]} w-20 rounded-t-lg bg-surface-3/50 border border-white/[0.06] border-b-0 flex flex-col items-center justify-center gap-1`}
                                            >
                                                <span className="text-lg">
                                                    {medals[idx]}
                                                </span>
                                                <span className="text-xs font-bold text-white/50">
                                                    {entry.totalScore?.toLocaleString() ||
                                                        0}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Full List */}
                        <div className="divide-y divide-white/[0.04]">
                            {leaderboard.map((entry, i) => {
                                const name =
                                    entry.userName ||
                                    entry.displayName ||
                                    "Anonymous";
                                const entryEmail =
                                    entry.userEmail ||
                                    entry.email ||
                                    "";
                                const isMe =
                                    userEmail === entryEmail;
                                return (
                                    <div
                                        key={entry.userId || i}
                                        className={`flex items-center gap-4 px-5 py-3.5 ${isMe
                                            ? "bg-yellow-400/[0.04]"
                                            : "hover:bg-white/[0.015]"
                                            } transition-colors`}
                                    >
                                        <span className="w-8 text-center text-xs font-bold text-white/25">
                                            {i === 0
                                                ? "🥇"
                                                : i === 1
                                                    ? "🥈"
                                                    : i === 2
                                                        ? "🥉"
                                                        : `#${i + 1}`}
                                        </span>
                                        <div
                                            className={`w-8 h-8 rounded-lg ${isMe
                                                ? "bg-gradient-to-br from-yellow-400 to-amber-500"
                                                : "bg-surface-3/80 border border-white/[0.06]"
                                                } flex items-center justify-center text-[12px] font-bold ${isMe
                                                    ? "text-surface-0"
                                                    : "text-white/35"
                                                } shrink-0`}
                                        >
                                            {name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`text-[13px] font-medium truncate ${isMe
                                                    ? "text-yellow-400"
                                                    : "text-white/60"
                                                    }`}
                                            >
                                                {name}{" "}
                                                {isMe && (
                                                    <span className="text-[10px] text-yellow-400/50 ml-1">
                                                        You
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-[11px] text-white/15 truncate">
                                                {entryEmail as string}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-white/50 tabular-nums">
                                                {entry.totalScore?.toLocaleString() ||
                                                    0}
                                            </p>
                                            <p className="text-[10px] text-white/20">
                                                {entry.testsCompleted ||
                                                    0}{" "}
                                                tests
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─── Jobs Tab ─────────────────────────────────────────────────────────────────

function JobsTab() {
    const [jobs, setJobs] = React.useState<any[]>([]);
    const [myApps, setMyApps] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        (async () => {
            try {
                const { listJobs } = await import("@/lib/services/newJobService");
                const { getMyApplications } = await import("@/lib/services/applicationService");
                const [jobsRes, appsRes] = await Promise.all([
                    listJobs().catch(() => ({ success: false, jobs: [] })),
                    getMyApplications().catch(() => ({ success: false, applications: [] })),
                ]);
                if (jobsRes.success) setJobs((jobsRes.jobs || []).slice(0, 6));
                if (appsRes.success) setMyApps(appsRes.applications || []);
            } catch { }
            setLoading(false);
        })();
    }, []);

    if (loading) {
        return (
            <div className="py-16 text-center">
                <div className="w-6 h-6 border-2 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-white/20">Loading jobs...</p>
            </div>
        );
    }

    const appliedJobIds = new Set(myApps.map((a: any) => a.job_id));

    return (
        <motion.div
            key="jobs"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease }}
        >
            {/* My Applications */}
            {myApps.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-white mb-4">My Applications</h3>
                    <div className="bg-surface-2/50 rounded-xl border border-white/[0.06] overflow-hidden">
                        {myApps.slice(0, 5).map((app: any, i: number) => {
                            const statusColors: Record<string, string> = {
                                applied: "bg-blue-400/10 text-blue-400 border-blue-400/20",
                                screening: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
                                interview: "bg-purple-400/10 text-purple-400 border-purple-400/20",
                                offered: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
                                rejected: "bg-red-400/10 text-red-400 border-red-400/20",
                            };
                            return (
                                <div key={app._id || i} className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04] last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-white/60">{app.job_title || "Job"}</p>
                                        <p className="text-[10px] text-white/20">{app.company_name || ""}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColors[app.status] || "bg-white/5 text-white/30 border-white/[0.06]"}`}>
                                        {app.status}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Featured Jobs */}
            {jobs.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-white mb-4">Featured Opportunities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {jobs.map((job: any, i: number) => (
                            <motion.div
                                key={job._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.06, ease }}
                                className="group bg-surface-2/50 rounded-xl border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all duration-300"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-surface-3/80 border border-white/[0.06] flex items-center justify-center">
                                        <Briefcase size={16} className="text-white/25" />
                                    </div>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-3/60 text-white/25 border border-white/[0.04]">
                                        {job.job_type || "full-time"}
                                    </span>
                                </div>
                                <h3 className="text-base font-semibold text-white mb-0.5 group-hover:text-yellow-400 transition-colors">
                                    {job.title}
                                </h3>
                                <p className="text-xs text-white/35 mb-3">{job.company_name || ""}</p>
                                <div className="flex flex-wrap items-center gap-3 mb-4 text-[11px] text-white/25">
                                    {job.location && <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>}
                                    {job.experience_level && <span className="capitalize">{job.experience_level}</span>}
                                </div>
                                <Link href={`/jobs/${job._id}`}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-colors bg-yellow-400 text-surface-0 hover:bg-yellow-300">
                                    View Details <ArrowRight size={12} />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            <Link href="/jobs"
                className="flex items-center justify-center gap-2 w-full py-4 bg-surface-2/50 rounded-xl border border-white/[0.06] text-sm font-semibold text-white/40 hover:text-yellow-400 hover:border-yellow-400/20 transition-all">
                Browse All Jobs <ArrowRight size={14} />
            </Link>
        </motion.div>
    );
}
