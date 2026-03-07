"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { getJob } from "@/lib/services/newJobService";
import type { Job } from "@/lib/services/newJobService";
import { applyToJob, getMyApplications } from "@/lib/services/applicationService";
import {
    Briefcase,
    MapPin,
    Clock,
    DollarSign,
    ArrowLeft,
    Building2,
    Send,
    CheckCircle2,
    Loader2,
    Globe,
    Users,
    Calendar,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

export default function JobDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, userRole } = useAuth();
    const jobId = params?.id as string;

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [applied, setApplied] = useState(false);
    const [applying, setApplying] = useState(false);
    const [coverLetter, setCoverLetter] = useState("");
    const [resumeUrl, setResumeUrl] = useState("");
    const [showApplyForm, setShowApplyForm] = useState(false);

    useEffect(() => {
        if (!jobId) return;
        Promise.all([
            getJob(jobId),
            getMyApplications().catch(() => ({ success: false, applications: [] })),
        ]).then(([jobRes, appRes]) => {
            if (jobRes.success) setJob(jobRes.job);
            else router.push("/jobs");
            if (appRes.success) {
                const hasApplied = (appRes.applications || []).some((a: any) => a.job_id === jobId);
                setApplied(hasApplied);
            }
        }).finally(() => setLoading(false));
    }, [jobId, router]);

    const handleApply = async () => {
        setApplying(true);
        try {
            const res = await applyToJob(jobId, coverLetter);
            if (res.success) {
                setApplied(true);
                setShowApplyForm(false);
            }
        } catch (err: any) {
            if (err?.response?.status === 400) {
                setApplied(true);
            } else {
                alert(err?.response?.data?.error || "Failed to apply");
            }
        }
        setApplying(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-0 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-white/20" />
            </div>
        );
    }

    if (!job) return null;

    return (
        <div className="min-h-screen bg-surface-0">
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-0/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="h-full max-w-7xl mx-auto px-4 lg:px-8 flex items-center">
                    <Link href="/jobs" className="flex items-center gap-2 text-xs font-medium text-white/30 hover:text-white/50 transition-colors">
                        <ArrowLeft size={14} /> All Jobs
                    </Link>
                </div>
            </header>

            <main className="pt-16">
                <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-400/10 text-blue-400 border border-blue-400/20">
                                        {job.type}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-3/50 text-white/30 border border-white/[0.06] capitalize">
                                        {job.experience_level}
                                    </span>
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">{job.title}</h1>
                                {job.company_name && (
                                    <p className="text-sm text-white/40 flex items-center gap-2 mb-4">
                                        <Building2 size={14} /> {job.company_name}
                                    </p>
                                )}
                                <div className="flex flex-wrap items-center gap-4 text-xs text-white/25 mb-6">
                                    {job.location && <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>}
                                    {job.salary_range && (job.salary_range.min ?? 0) > 0 && (
                                        <span className="flex items-center gap-1">
                                            <DollarSign size={12} />
                                            {job.salary_range.currency} {(job.salary_range.min ?? 0).toLocaleString()} – {(job.salary_range.max ?? 0).toLocaleString()}
                                        </span>
                                    )}
                                    {(job.application_count || 0) > 0 && (
                                        <span className="flex items-center gap-1"><Users size={12} />{job.application_count} applicants</span>
                                    )}
                                </div>
                            </motion.div>

                            {/* Description */}
                            <div className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-6">
                                <h2 className="text-sm font-bold text-white mb-3">About the Role</h2>
                                <p className="text-sm text-white/40 whitespace-pre-wrap leading-relaxed">{job.description || "No description provided."}</p>
                            </div>

                            {/* Requirements */}
                            {job.requirements && job.requirements.length > 0 && (
                                <div className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-6">
                                    <h2 className="text-sm font-bold text-white mb-3">Requirements</h2>
                                    <ul className="space-y-2">
                                        {job.requirements.map((r, i) => (
                                            <li key={i} className="text-xs text-white/40 flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1 shrink-0" />
                                                {r}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Benefits */}
                            {(job as any).benefits && (job as any).benefits.length > 0 && (
                                <div className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-6">
                                    <h2 className="text-sm font-bold text-white mb-3">Benefits</h2>
                                    <ul className="space-y-2">
                                        {(job as any).benefits.map((b: string, i: number) => (
                                            <li key={i} className="text-xs text-white/40 flex items-start gap-2">
                                                <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                                                {b}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 space-y-4">
                                <div className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-6 space-y-4">
                                    {applied ? (
                                        <div className="text-center py-4">
                                            <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-400" />
                                            <p className="text-sm font-semibold text-emerald-400 mb-1">Applied</p>
                                            <p className="text-xs text-white/25">Your application has been submitted</p>
                                        </div>
                                    ) : userRole === "student" ? (
                                        !showApplyForm ? (
                                            <button onClick={() => setShowApplyForm(true)}
                                                className="w-full py-3 rounded-xl bg-yellow-400 text-surface-0 text-sm font-bold hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2">
                                                <Send size={14} /> Apply Now
                                            </button>
                                        ) : (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-white">Apply to this position</h4>
                                                <div>
                                                    <label className="text-[10px] font-semibold uppercase text-white/20 mb-1 block">Cover Letter (optional)</label>
                                                    <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} rows={5} placeholder="Why you're a good fit..."
                                                        className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/70 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors resize-none" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-semibold uppercase text-white/20 mb-1 block">Resume URL (optional)</label>
                                                    <input type="url" value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} placeholder="https://..."
                                                        className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/70 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={handleApply} disabled={applying}
                                                        className="flex-1 py-2.5 rounded-lg bg-yellow-400 text-surface-0 text-xs font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                                        {applying ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                                        Submit
                                                    </button>
                                                    <button onClick={() => setShowApplyForm(false)}
                                                        className="px-4 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-xs text-white/30 hover:text-white/50 transition-colors">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    ) : (
                                        <p className="text-xs text-white/25 text-center py-4">Sign in as a student to apply</p>
                                    )}

                                    {/* Skills */}
                                    {job.skills_required && job.skills_required.length > 0 && (
                                        <div>
                                            <h4 className="text-[10px] font-bold uppercase text-white/20 mb-2">Required Skills</h4>
                                            <div className="flex flex-wrap gap-1.5">
                                                {job.skills_required.map((s) => (
                                                    <span key={s} className="px-2 py-0.5 rounded bg-surface-3/50 text-[10px] text-white/25 border border-white/[0.04]">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
