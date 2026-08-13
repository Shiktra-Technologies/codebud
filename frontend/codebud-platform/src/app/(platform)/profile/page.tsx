"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { getUserSubmissions } from "@/lib/services/submissionService";
import { leaderboardService } from "@/lib/services/leaderboardService";
import apiClient from "@/lib/apiClient";
import {
    User,
    Mail,
    Shield,
    ArrowLeft,
    LogOut,
    Trophy,
    Code2,
    Brain,
    CheckCircle2,
    XCircle,
    BarChart3,
    Calendar,
    Clock,
    Edit3,
    Save,
    X,
    FileText,
    Loader2,
    Camera,
    Upload,
    GraduationCap,
    Target,
    Linkedin,
    Github,
    Globe,
    MapPin,
    Phone,
    Pencil,
} from "lucide-react";
import { getOnboardingData } from "@/lib/services/onboardingService";

const ease = [0.16, 1, 0.3, 1] as const;

interface Submission {
    test_type?: string;
    testType?: string;
    score?: number;
    total_questions?: number;
    totalQuestions?: number;
    timestamp?: string;
    createdAt?: string;
    [key: string]: unknown;
}

export default function ProfilePage() {
    const { user, userRole, logout } = useAuth();
    const router = useRouter();

    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [rank, setRank] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [saving, setSaving] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [onboardingData, setOnboardingData] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const displayName = (user as any)?.display_name || (user as any)?.displayName || (typeof window !== 'undefined' ? localStorage.getItem("codebud_display_name") : null) || user?.email?.split("@")[0] || "User";
    const email = user?.email || "";
    const initial = (typeof displayName === "string" ? displayName : "U").charAt(0).toUpperCase();
    const userId = (user as any)?._id || (user as any)?.id || "";

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (userId) {
                    const [subs, userRank] = await Promise.all([
                        getUserSubmissions(userId).catch(() => []),
                        leaderboardService.getUserRank(userId).catch(() => null),
                    ]);
                    const list = Array.isArray(subs) ? subs : (subs as any)?.data || [];
                    setSubmissions(list);
                    if (userRank && typeof userRank === "object" && "rank" in (userRank as any)) {
                        setRank((userRank as any).rank);
                    }
                }
                // Load avatar
                const storedAvatar = (user as any)?.avatar_url;
                if (storedAvatar) {
                    // If it's a relative API path, prepend base URL
                    if (storedAvatar.startsWith("/api/")) {
                        setAvatarUrl(`${apiClient.defaults.baseURL}${storedAvatar}`);
                    } else {
                        setAvatarUrl(storedAvatar);
                    }
                }
                // Load onboarding data
                try {
                    const obRes = await getOnboardingData();
                    if (obRes.success && obRes.data) {
                        setOnboardingData(obRes.data);
                    }
                } catch {
                    // Not onboarded yet or error — ignore
                }
            } catch {
                // ignore
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        // `user` is intentionally not a dep: its object identity changes on
        // every auth refresh, which would re-fire this fetch. userId is the
        // stable key; avatar_url is read best-effort at fetch time.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    useEffect(() => {
        setEditName(typeof displayName === "string" ? displayName : "");
    }, [displayName]);

    const handleLogout = async () => {
        await logout();
        router.push("/auth");
    };

    const handleSaveName = async () => {
        if (!editName.trim()) return;
        setSaving(true);
        try {
            // Save to backend
            await apiClient.patch("/api/profile", { display_name: editName.trim() });
            // Also cache in localStorage for immediate reads
            localStorage.setItem("codebud_display_name", editName.trim());
        } catch (err) {
            console.warn("Failed to save name to backend, saving locally:", err);
            localStorage.setItem("codebud_display_name", editName.trim());
        } finally {
            setSaving(false);
            setEditing(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side validation
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert("File too large. Max size is 5MB.");
            return;
        }
        const allowed = ["image/png", "image/jpeg", "image/gif", "image/webp"];
        if (!allowed.includes(file.type)) {
            alert("Invalid file type. Use PNG, JPG, GIF, or WebP.");
            return;
        }

        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append("avatar", file);
            const res = await apiClient.post("/api/profile/avatar", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const url = res.data?.data?.avatar_url;
            if (url) {
                if (url.startsWith("/api/")) {
                    setAvatarUrl(`${apiClient.defaults.baseURL}${url}`);
                } else {
                    setAvatarUrl(url);
                }
            }
        } catch (err: any) {
            console.error("Avatar upload failed:", err);
            alert(err?.response?.data?.error || "Failed to upload avatar");
        } finally {
            setUploadingAvatar(false);
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Stats
    const totalTests = submissions.length;
    const passedTests = submissions.filter((s) => {
        const sc = s.score || 0;
        const t = s.total_questions || s.totalQuestions || 1;
        return (sc / t) * 100 >= 60;
    }).length;
    const avgScore = totalTests > 0
        ? Math.round(submissions.reduce((acc, s) => {
            const sc = s.score || 0;
            const t = s.total_questions || s.totalQuestions || 1;
            return acc + (sc / t) * 100;
        }, 0) / totalTests)
        : 0;
    const dsaCount = submissions.filter((s) => (s.test_type || s.testType || "").toLowerCase().includes("dsa")).length;
    const aptCount = submissions.filter((s) => (s.test_type || s.testType || "").toLowerCase().includes("aptitude")).length;
    const latestSub = submissions.length > 0
        ? submissions.sort((a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime())[0]
        : null;

    const formatDate = (ts?: string) => {
        if (!ts) return "—";
        return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    return (
        <div className="min-h-screen bg-surface-0">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <Link href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-yellow-400 transition-colors mb-8 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    Back to Dashboard
                </Link>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
                    {/* Profile Card */}
                    <div className="relative bg-surface-2/50 rounded-2xl border border-white/[0.06] p-8 overflow-hidden mb-6">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(255,193,7,0.04) 0%, transparent 70%)" }} />

                        <div className="relative flex flex-col items-center mb-8">
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/gif,image/webp"
                                onChange={handleAvatarUpload}
                                className="hidden"
                            />

                            {/* Avatar with upload overlay */}
                            <button
                                onClick={handleAvatarClick}
                                disabled={uploadingAvatar}
                                className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(255,193,7,0.2)] mb-4 group cursor-pointer"
                            >
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-2xl font-bold text-surface-0">
                                        {initial}
                                    </div>
                                )}
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    {uploadingAvatar ? (
                                        <Loader2 size={20} className="text-white animate-spin" />
                                    ) : (
                                        <Camera size={20} className="text-white" />
                                    )}
                                </div>
                            </button>

                            {editing ? (
                                <div className="flex items-center gap-2 mb-1">
                                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                                        className="px-3 py-1.5 rounded-lg bg-surface-3/50 border border-white/[0.1] text-white text-center text-lg font-bold outline-none focus:border-yellow-400/30"
                                        autoFocus />
                                    <button onClick={handleSaveName} disabled={saving} className="p-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/20 transition-colors disabled:opacity-50">
                                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    </button>
                                    <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-white/30 hover:text-white/50 transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-xl font-bold text-white">{displayName}</h1>
                                    <button onClick={() => setEditing(true)} className="p-1 rounded text-white/15 hover:text-white/40 transition-colors">
                                        <Edit3 size={13} />
                                    </button>
                                </div>
                            )}

                            <p className="text-sm text-white/30">{email}</p>
                            <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
                                <Shield size={12} className="text-yellow-400" />
                                <span className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
                                    {userRole || "student"}
                                </span>
                            </div>
                        </div>

                        {/* Info Fields */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-3/30 border border-white/[0.06]">
                                <User size={16} className="text-white/30 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs text-white/30 uppercase tracking-wider font-semibold">Display Name</p>
                                    <p className="text-sm text-white/80">{displayName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-3/30 border border-white/[0.06]">
                                <Mail size={16} className="text-white/30 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs text-white/30 uppercase tracking-wider font-semibold">Email</p>
                                    <p className="text-sm text-white/80">{email}</p>
                                </div>
                            </div>
                            {rank !== null && (
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-3/30 border border-white/[0.06]">
                                    <Trophy size={16} className="text-yellow-400/50 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-xs text-white/30 uppercase tracking-wider font-semibold">Rank</p>
                                        <p className="text-sm text-white/80">#{rank}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Onboarding Data Sections ── */}
                        {onboardingData && (
                            <div className="mt-6 space-y-3">
                                {/* Education */}
                                {onboardingData.education && onboardingData.education.college && (
                                    <div className="p-4 rounded-xl bg-surface-3/30 border border-white/[0.06]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <GraduationCap size={14} className="text-blue-400" />
                                            <span className="text-[10px] uppercase tracking-wider text-white/25 font-semibold">Education</span>
                                        </div>
                                        <p className="text-sm text-white/80 font-semibold">{onboardingData.education.college}</p>
                                        <p className="text-xs text-white/30 mt-0.5">
                                            {[onboardingData.education.degree, onboardingData.education.branch, onboardingData.education.year].filter(Boolean).join(" · ")}
                                        </p>
                                        {onboardingData.education.cgpa && (
                                            <p className="text-[10px] text-white/15 mt-1">CGPA/% : {onboardingData.education.cgpa}</p>
                                        )}
                                    </div>
                                )}

                                {/* Skills */}
                                {onboardingData.skills && (onboardingData.skills.languages?.length > 0 || onboardingData.skills.interests?.length > 0) && (
                                    <div className="p-4 rounded-xl bg-surface-3/30 border border-white/[0.06]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Code2 size={14} className="text-emerald-400" />
                                            <span className="text-[10px] uppercase tracking-wider text-white/25 font-semibold">Skills & Interests</span>
                                        </div>
                                        {onboardingData.skills.languages?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {onboardingData.skills.languages.map((l: any) => (
                                                    <span key={l.name} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                                                        {l.name} <span className="text-yellow-400/50">· {l.level}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {onboardingData.skills.frameworks?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {onboardingData.skills.frameworks.map((f: string) => (
                                                    <span key={f} className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-2/50 text-white/30 border border-white/[0.04]">{f}</span>
                                                ))}
                                            </div>
                                        )}
                                        {onboardingData.skills.interests?.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {onboardingData.skills.interests.map((t: string) => (
                                                    <span key={t} className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-400/10 text-blue-400 border border-blue-400/20">{t}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Career */}
                                {onboardingData.career && onboardingData.career.goals?.length > 0 && (
                                    <div className="p-4 rounded-xl bg-surface-3/30 border border-white/[0.06]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target size={14} className="text-cyan-400" />
                                            <span className="text-[10px] uppercase tracking-wider text-white/25 font-semibold">Career Goals</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {onboardingData.career.goals.map((g: string) => (
                                                <span key={g} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">{g}</span>
                                            ))}
                                        </div>
                                        {onboardingData.career.dream_companies?.length > 0 && (
                                            <p className="text-xs text-white/25 mt-1"><span className="text-white/15">Dream: </span>{onboardingData.career.dream_companies.join(", ")}</p>
                                        )}
                                        {onboardingData.career.preferred_roles?.length > 0 && (
                                            <p className="text-xs text-white/25 mt-0.5"><span className="text-white/15">Roles: </span>{onboardingData.career.preferred_roles.join(", ")}</p>
                                        )}
                                    </div>
                                )}

                                {/* Social Links */}
                                {onboardingData.profile && (onboardingData.profile.linkedin || onboardingData.profile.github || onboardingData.profile.portfolio) && (
                                    <div className="p-4 rounded-xl bg-surface-3/30 border border-white/[0.06]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Globe size={14} className="text-purple-400" />
                                            <span className="text-[10px] uppercase tracking-wider text-white/25 font-semibold">Links</span>
                                        </div>
                                        <div className="flex gap-3">
                                            {onboardingData.profile.linkedin && (
                                                <a href={onboardingData.profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-blue-400 transition-colors"><Linkedin size={16} /></a>
                                            )}
                                            {onboardingData.profile.github && (
                                                <a href={onboardingData.profile.github} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-white/60 transition-colors"><Github size={16} /></a>
                                            )}
                                            {onboardingData.profile.portfolio && (
                                                <a href={onboardingData.profile.portfolio} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-yellow-400 transition-colors"><Globe size={16} /></a>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Edit Onboarding Data button */}
                                <Link
                                    href="/onboarding"
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 hover:bg-yellow-400/15 transition-colors text-sm font-medium"
                                >
                                    <Pencil size={14} />
                                    Edit Profile Data
                                </Link>
                            </div>
                        )}

                        <button onClick={handleLogout}
                            className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/15 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium">
                            <LogOut size={15} />
                            Sign Out
                        </button>
                    </div>

                    {/* Performance Stats */}
                    <div className="bg-surface-2/50 rounded-2xl border border-white/[0.06] p-6 mb-6">
                        <h2 className="text-sm font-bold text-white/60 mb-4 flex items-center gap-2">
                            <BarChart3 size={16} className="text-yellow-400/50" />
                            Performance Overview
                        </h2>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 size={20} className="animate-spin text-white/20" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: "Tests Taken", value: totalTests, icon: FileText, color: "text-white/50" },
                                    { label: "Avg Score", value: `${avgScore}%`, icon: BarChart3, color: avgScore >= 60 ? "text-emerald-400" : "text-yellow-400" },
                                    { label: "Passed", value: passedTests, icon: CheckCircle2, color: "text-emerald-400" },
                                    { label: "Failed", value: totalTests - passedTests, icon: XCircle, color: "text-red-400" },
                                ].map((s) => (
                                    <div key={s.label} className="bg-surface-3/30 rounded-xl p-4 border border-white/[0.04]">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <s.icon size={12} className={s.color} />
                                            <span className="text-[10px] uppercase tracking-wider text-white/20">{s.label}</span>
                                        </div>
                                        <p className="text-xl font-bold text-white">{s.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Test Breakdown */}
                    <div className="bg-surface-2/50 rounded-2xl border border-white/[0.06] p-6 mb-6">
                        <h2 className="text-sm font-bold text-white/60 mb-4 flex items-center gap-2">
                            <Brain size={16} className="text-purple-400/50" />
                            Test Breakdown
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-surface-3/30 rounded-xl p-4 border border-white/[0.04]">
                                <div className="flex items-center gap-2 mb-3">
                                    <Brain size={16} className="text-purple-400" />
                                    <span className="text-sm font-semibold text-white/60">Aptitude</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{aptCount}</p>
                                <p className="text-[10px] text-white/15 uppercase tracking-wider mt-1">Tests completed</p>
                            </div>
                            <div className="bg-surface-3/30 rounded-xl p-4 border border-white/[0.04]">
                                <div className="flex items-center gap-2 mb-3">
                                    <Code2 size={16} className="text-emerald-400" />
                                    <span className="text-sm font-semibold text-white/60">DSA</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{dsaCount}</p>
                                <p className="text-[10px] text-white/15 uppercase tracking-wider mt-1">Challenges completed</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Submissions */}
                    {!loading && submissions.length > 0 && (
                        <div className="bg-surface-2/50 rounded-2xl border border-white/[0.06] p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-bold text-white/60 flex items-center gap-2">
                                    <Clock size={16} className="text-white/25" />
                                    Recent Activity
                                </h2>
                                <Link href="/submitted" className="text-xs text-yellow-400/50 hover:text-yellow-400 transition-colors">
                                    View all →
                                </Link>
                            </div>
                            <div className="space-y-2">
                                {submissions.slice(0, 5).map((sub, i) => {
                                    const type = sub.test_type || sub.testType || "Test";
                                    const sc = sub.score || 0;
                                    const t = sub.total_questions || sub.totalQuestions || 1;
                                    const pct = Math.round((sc / t) * 100);
                                    const pass = pct >= 60;
                                    return (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-surface-3/20 border border-white/[0.03]">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${pass ? "bg-emerald-400/10" : "bg-red-400/10"}`}>
                                                {pass ? <CheckCircle2 size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-white/50 truncate">{type}</p>
                                                <p className="text-[10px] text-white/15">{formatDate(sub.timestamp || sub.createdAt)}</p>
                                            </div>
                                            <span className={`text-sm font-bold ${pass ? "text-emerald-400" : "text-red-400"}`}>{pct}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
