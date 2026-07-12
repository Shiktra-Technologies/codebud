"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/lib/hooks/useAuth";
import {
    getMyCompanyProfile,
    updateCompanyProfile,
} from "@/lib/services/companyService";
import type { CompanyProfile } from "@/lib/services/companyService";
import {
    createJob,
    listJobs,
    updateJob,
    deleteJob,
} from "@/lib/services/newJobService";
import type { Job } from "@/lib/services/newJobService";
import {
    getJobApplications,
    updateApplicationStatus,
    scheduleInterview,
} from "@/lib/services/applicationService";
import type { Application } from "@/lib/services/applicationService";
import {
    Building2,
    Briefcase,
    Users,
    Plus,
    Pencil,
    Trash2,
    Eye,
    EyeOff,
    X,
    Save,
    ChevronDown,
    ChevronRight,
    MapPin,
    Globe,
    Mail,
    Calendar,
    Clock,
    Search,
    Loader2,
    LogOut,
    User,
    BarChart3,
    FileText,
    CheckCircle2,
    XCircle,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const ease = [0.16, 1, 0.3, 1] as const;

type TabId = "overview" | "jobs" | "applications" | "profile";

export default function CompanyDashboard() {
    const { user, userRole, logout } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<TabId>("overview");
    const [profile, setProfile] = useState<CompanyProfile | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    const displayName =
        profile?.name ||
        (user as any)?.display_name ||
        (user as any)?.displayName ||
        user?.email?.split("@")[0] ||
        "Company";

    // ── Access check ──
    useEffect(() => {
        if (!loading && userRole !== "company" && userRole !== "codebud_super_admin") {
            router.push("/dashboard");
        }
    }, [loading, userRole, router]);

    // ── Data fetch ──
    const fetchData = useCallback(async () => {
        try {
            const [profileRes, jobsRes] = await Promise.all([
                getMyCompanyProfile().catch(() => null),
                listJobs().catch(() => ({ success: false, jobs: [] })),
            ]);
            if (profileRes?.success) setProfile(profileRes.profile);
            if (jobsRes?.success) {
                // Filter to only company's own jobs
                const myJobs = (jobsRes.jobs || []).filter(
                    (j: Job) => j.company_id === (profileRes?.profile?._id || "")
                );
                setJobs(myJobs);
            }
        } catch (err) {
            console.error("Company dashboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-0 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-white/20" />
            </div>
        );
    }

    if (userRole !== "company" && userRole !== "codebud_super_admin") return null;

    const activeJobs = jobs.filter((j) => j.is_active);

    return (
        <div className="min-h-screen bg-surface-0">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-0/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="h-full max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
                            <Building2 size={16} className="text-blue-400" />
                        </div>
                        <span className="text-sm font-bold text-white">{displayName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={logout}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-red-400/60 hover:text-red-400 hover:bg-red-400/5 transition-colors">
                            <LogOut size={12} /> Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="pt-16">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
                    {/* Title */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="mb-8">
                        <h1 className="text-2xl font-bold text-white mb-1">Company Dashboard</h1>
                        <p className="text-sm text-white/25">Manage your job postings and applications</p>
                    </motion.div>

                    {/* Tabs */}
                    <div className="flex gap-1 p-1 bg-surface-2/40 rounded-xl border border-white/[0.04] w-fit mb-8">
                        {([
                            { id: "overview" as const, label: "Overview", icon: BarChart3 },
                            { id: "jobs" as const, label: "Job Postings", icon: Briefcase },
                            { id: "applications" as const, label: "Applications", icon: FileText },
                            { id: "profile" as const, label: "Company Profile", icon: Building2 },
                        ]).map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${isActive ? "bg-yellow-400 text-surface-0 shadow-[0_0_20px_rgba(255,193,7,0.15)]" : "text-white/30 hover:text-white/50 hover:bg-white/[0.03]"}`}>
                                    <Icon size={14} /> {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <AnimatePresence mode="wait">
                        {/* ── Overview Tab ── */}
                        {activeTab === "overview" && (
                            <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease }}>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                    {[
                                        { label: "Total Jobs", value: jobs.length, icon: Briefcase },
                                        { label: "Active Jobs", value: activeJobs.length, icon: Eye },
                                        { label: "Verification", value: profile?.verified ? "Verified" : "Pending", icon: CheckCircle2 },
                                        { label: "Profile", value: profile ? "Complete" : "Incomplete", icon: Building2 },
                                    ].map((s, i) => {
                                        const Icon = s.icon;
                                        return (
                                            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ease }}
                                                className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-5">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25">{s.label}</span>
                                                    <Icon size={14} className="text-white/15" />
                                                </div>
                                                <p className="text-2xl font-bold text-white">{s.value}</p>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                                {!profile && (
                                    <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-6 text-center">
                                        <Building2 size={24} className="mx-auto mb-2 text-yellow-400/60" />
                                        <h3 className="text-sm font-semibold text-white mb-1">Complete Your Profile</h3>
                                        <p className="text-xs text-white/30 mb-3">Set up your company profile to start posting jobs</p>
                                        <button onClick={() => setActiveTab("profile")}
                                            className="px-4 py-2 rounded-lg bg-yellow-400 text-surface-0 text-xs font-bold hover:bg-yellow-300 transition-colors">
                                            Set Up Profile
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ── Jobs Tab ── */}
                        {activeTab === "jobs" && (
                            <motion.div key="jobs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease }}>
                                <JobManager onRefresh={fetchData} />
                            </motion.div>
                        )}

                        {/* ── Applications Tab ── */}
                        {activeTab === "applications" && (
                            <motion.div key="applications" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease }}>
                                <ApplicationManager jobs={jobs} />
                            </motion.div>
                        )}

                        {/* ── Profile Tab ── */}
                        {activeTab === "profile" && (
                            <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease }}>
                                <ProfileEditor profile={profile} onSave={() => fetchData()} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}


// ══════════════════════════════════════════════════════════════
//                      JOB MANAGER
// ══════════════════════════════════════════════════════════════

function JobManager({ onRefresh }: { onRefresh: () => void }) {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: "", description: "", location: "", job_type: "full-time", experience_level: "mid",
        salary_min: 0, salary_max: 0, salary_currency: "INR", skills_required: "",
        requirements: "", benefits: "",
    });

    useEffect(() => {
        listJobs().then((res) => {
            if (res.success) setJobs(res.jobs || []);
        }).finally(() => setLoading(false));
    }, []);

    const handleCreate = async () => {
        if (!form.title.trim()) return;
        setSaving(true);
        try {
            const res = await createJob({
                title: form.title,
                description: form.description,
                location: form.location,
                type: form.job_type as Job["type"],
                experience_level: form.experience_level as "entry" | "mid" | "senior",
                salary_range: { min: form.salary_min, max: form.salary_max, currency: form.salary_currency },
                skills_required: form.skills_required.split(",").map((s) => s.trim()).filter(Boolean),
                requirements: form.requirements.split("\n").filter(Boolean),
            } as Partial<Job>);
            if (res.success) {
                setShowForm(false);
                setForm({ title: "", description: "", location: "", job_type: "full-time", experience_level: "mid", salary_min: 0, salary_max: 0, salary_currency: "INR", skills_required: "", requirements: "", benefits: "" });
                const refreshed = await listJobs();
                if (refreshed.success) setJobs(refreshed.jobs || []);
                onRefresh();
            }
        } catch (err: any) {
            alert(err?.response?.data?.error || "Failed to create job");
        }
        setSaving(false);
    };

    const handleDelete = async (jobId: string) => {
        if (!confirm("Delete this job posting?")) return;
        try {
            await deleteJob(jobId);
            setJobs((prev) => prev.filter((j) => j._id !== jobId));
            onRefresh();
        } catch { alert("Failed to delete job"); }
    };

    if (loading) return <div className="py-20 text-center"><Loader2 size={24} className="mx-auto text-white/20 animate-spin" /></div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-medium text-white/30">{jobs.length} job postings</span>
                <button onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-400 text-surface-0 text-xs font-bold hover:bg-yellow-300 transition-colors">
                    <Plus size={14} /> New Job
                </button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
                        <div className="bg-surface-2/50 rounded-xl border border-yellow-400/20 p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-white">New Job Posting</h3>
                                <button onClick={() => setShowForm(false)} className="p-1 text-white/30 hover:text-white/50"><X size={16} /></button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Job Title *</label>
                                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior React Developer"
                                        className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Location</label>
                                    <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Remote, Bangalore"
                                        className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Type</label>
                                    <select value={form.job_type} onChange={(e) => setForm({ ...form, job_type: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/60 outline-none cursor-pointer">
                                        {["full-time", "part-time", "contract", "internship", "remote"].map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Experience</label>
                                    <select value={form.experience_level} onChange={(e) => setForm({ ...form, experience_level: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/60 outline-none cursor-pointer">
                                        {["entry", "mid", "senior", "lead"].map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Skills (comma separated)</label>
                                <input type="text" value={form.skills_required} onChange={(e) => setForm({ ...form, skills_required: e.target.value })} placeholder="e.g. React, TypeScript, Node.js"
                                    className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors" />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Description</label>
                                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Job description..."
                                    className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors resize-none" />
                            </div>
                            <button onClick={handleCreate} disabled={!form.title.trim() || saving}
                                className="px-5 py-2.5 rounded-lg bg-yellow-400 text-surface-0 text-xs font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50 flex items-center gap-2">
                                {saving ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : "Post Job"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {jobs.length === 0 ? (
                <div className="py-20 text-center">
                    <Briefcase size={32} className="mx-auto mb-3 text-white/10" />
                    <h4 className="text-sm font-semibold text-white/30 mb-1">No Job Postings</h4>
                    <p className="text-xs text-white/15">Create your first job posting</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {jobs.map((job, i) => (
                        <motion.div key={job._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, ease }}
                            className="group bg-surface-2/50 rounded-xl border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-sm font-semibold text-white truncate">{job.title}</h3>
                                        <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${job.is_active ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" : "bg-white/5 text-white/25 border border-white/[0.06]"}`}>
                                            {job.is_active ? "Active" : "Closed"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[11px] text-white/20">
                                        {job.location && <span className="flex items-center gap-1"><MapPin size={10} />{job.location}</span>}
                                        <span>{job.type}</span>
                                        <span>{job.experience_level}</span>
                                        <span>{job.application_count || 0} applicants</span>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(job._id)} className="p-2 rounded-lg text-white/10 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}


// ══════════════════════════════════════════════════════════════
//                    APPLICATION MANAGER
// ══════════════════════════════════════════════════════════════

function ApplicationManager({ jobs }: { jobs: Job[] }) {
    const [selectedJobId, setSelectedJobId] = useState<string>("");
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchApplications = async (jobId: string) => {
        if (!jobId) return;
        setLoading(true);
        try {
            const res = await getJobApplications(jobId);
            if (res.success) setApplications(res.applications || []);
        } catch { setApplications([]); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (selectedJobId) fetchApplications(selectedJobId);
    }, [selectedJobId]);

    const handleStatusChange = async (appId: string, status: string) => {
        try {
            await updateApplicationStatus(appId, status as any);
            if (selectedJobId) fetchApplications(selectedJobId);
        } catch { alert("Failed to update status"); }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case "applied": return "bg-blue-400/10 text-blue-400 border-blue-400/20";
            case "screening": return "bg-yellow-400/10 text-yellow-400 border-yellow-400/20";
            case "interview": return "bg-purple-400/10 text-purple-400 border-purple-400/20";
            case "offered": return "bg-emerald-400/10 text-emerald-400 border-emerald-400/20";
            case "rejected": return "bg-red-400/10 text-red-400 border-red-400/20";
            default: return "bg-white/5 text-white/30 border-white/[0.06]";
        }
    };

    return (
        <div>
            <div className="mb-6">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-2 block">Select Job Posting</label>
                <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full max-w-sm px-3 py-2.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/60 outline-none cursor-pointer">
                    <option value="">Choose a job...</option>
                    {jobs.map((j) => <option key={j._id} value={j._id}>{j.title}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="py-20 text-center"><Loader2 size={24} className="mx-auto text-white/20 animate-spin" /></div>
            ) : !selectedJobId ? (
                <div className="py-20 text-center">
                    <FileText size={32} className="mx-auto mb-3 text-white/10" />
                    <p className="text-xs text-white/20">Select a job to view applications</p>
                </div>
            ) : applications.length === 0 ? (
                <div className="py-20 text-center">
                    <Users size={32} className="mx-auto mb-3 text-white/10" />
                    <p className="text-xs text-white/20">No applications for this job yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {applications.map((app, i) => (
                        <motion.div key={app._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, ease }}
                            className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-white mb-1">{app.student?.display_name || app.student?.email || "Anonymous"}</p>
                                    {app.student?.email && <p className="text-xs text-white/25 mb-2">{app.student.email}</p>}
                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColor(app.status)}`}>{app.status}</span>
                                    {app.cover_note && <p className="text-xs text-white/30 mt-2 line-clamp-2">{app.cover_note}</p>}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {app.status === "applied" && (
                                        <>
                                            <button onClick={() => handleStatusChange(app._id, "screening")}
                                                className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 hover:bg-yellow-400/20 transition-colors">
                                                Screen
                                            </button>
                                            <button onClick={() => handleStatusChange(app._id, "rejected")}
                                                className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition-colors">
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    {app.status === "screening" && (
                                        <>
                                            <button onClick={() => handleStatusChange(app._id, "interview")}
                                                className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-purple-400/10 text-purple-400 border border-purple-400/20 hover:bg-purple-400/20 transition-colors">
                                                Interview
                                            </button>
                                            <button onClick={() => handleStatusChange(app._id, "rejected")}
                                                className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition-colors">
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    {app.status === "interview" && (
                                        <>
                                            <button onClick={() => handleStatusChange(app._id, "offered")}
                                                className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 hover:bg-emerald-400/20 transition-colors">
                                                Offer
                                            </button>
                                            <button onClick={() => handleStatusChange(app._id, "rejected")}
                                                className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition-colors">
                                                Reject
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}


// ══════════════════════════════════════════════════════════════
//                     PROFILE EDITOR
// ══════════════════════════════════════════════════════════════

function ProfileEditor({ profile, onSave }: { profile: CompanyProfile | null; onSave: () => void }) {
    const [form, setForm] = useState({
        name: profile?.name || "",
        industry: profile?.industry || "",
        description: profile?.description || "",
        location: profile?.location || "",
        website: profile?.website || "",
        size: profile?.size || "",
        logo_url: profile?.logo_url || "",
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (profile) {
                await updateCompanyProfile(form);
            } else {
                const { createCompanyProfile } = await import("@/lib/services/companyService");
                await createCompanyProfile(form);
            }
            onSave();
        } catch (err: any) {
            alert(err?.response?.data?.error || "Failed to save profile");
        }
        setSaving(false);
    };

    return (
        <div className="max-w-2xl">
            <div className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-6 space-y-4">
                <h3 className="text-sm font-bold text-white mb-2">Company Profile</h3>
                {[
                    { label: "Company Name", key: "name", placeholder: "Your Company Inc." },
                    { label: "Industry", key: "industry", placeholder: "e.g. Technology, Finance" },
                    { label: "Location", key: "location", placeholder: "e.g. Bangalore, India" },
                    { label: "Website", key: "website", placeholder: "https://example.com" },
                    { label: "Logo URL", key: "logo_url", placeholder: "https://..." },
                ].map((field) => (
                    <div key={field.key}>
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">{field.label}</label>
                        <input type="text" value={(form as any)[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} placeholder={field.placeholder}
                            className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors" />
                    </div>
                ))}
                <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Company Size</label>
                    <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/60 outline-none cursor-pointer">
                        <option value="">Select</option>
                        {["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Description</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Tell students about your company..."
                        className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors resize-none" />
                </div>
                <button onClick={handleSave} disabled={saving}
                    className="px-5 py-2.5 rounded-lg bg-yellow-400 text-surface-0 text-xs font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50 flex items-center gap-2">
                    {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save Profile</>}
                </button>
            </div>
        </div>
    );
}
