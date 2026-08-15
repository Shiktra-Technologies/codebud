"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { listJobs } from "@/lib/services/newJobService";
import type { Job } from "@/lib/services/newJobService";
import {
    Briefcase,
    MapPin,
    DollarSign,
    Search,
    ArrowLeft,
    Building2,
    Users,
    ChevronRight,
} from "lucide-react";
import { EmptyState } from "@/app/components/ui/empty-state";
import { ErrorState } from "@/app/components/ui/error-state";
import { ListSkeleton } from "@/app/components/ui/card-skeleton";

const ease = [0.16, 1, 0.3, 1] as const;

export default function JobsPage() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [jobType, setJobType] = useState<string>("all");

    const loadJobs = () => {
        setLoading(true);
        setError(null);
        listJobs()
            .then((res) => {
                if (res.success) {
                    setJobs(res.jobs || []);
                } else {
                    setJobs([]);
                    setError("Failed to load job openings");
                }
            })
            .catch(() => {
                setError("Network error. Please check your connection and try again.");
                setJobs([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadJobs();
    }, []);

    const filtered = jobs.filter((j) => {
        const matchSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (j.location || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (j.company_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (j.skills_required || []).some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchType = jobType === "all" || j.type === jobType;
        return matchSearch && matchType;
    });

    return (
        <div className="min-h-screen bg-surface-0 honeycomb-bg-lg">
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-0/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="h-full max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="flex items-center gap-2 text-xs font-medium text-white/30 hover:text-white/50 transition-colors">
                            <ArrowLeft size={14} /> Dashboard
                        </Link>
                        <div className="w-px h-5 bg-white/[0.06]" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
                                <Briefcase size={16} className="text-blue-400" />
                            </div>
                            <span className="text-sm font-bold text-white">Job Board</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="pt-16">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 page-enter">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="mb-8">
                        <h1 className="text-2xl font-bold text-white mb-1">Job Opportunities</h1>
                        <p className="text-sm text-white/30">Browse openings from verified companies</p>
                    </motion.div>

                    {/* Filters */}
                    {!loading && !error && (
                    <div className="flex flex-wrap items-center gap-4 mb-8">
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/15" />
                            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search jobs, companies, skills..."
                                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/70 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors" />
                        </div>
                        <div className="flex gap-1 p-1 bg-surface-2/40 rounded-xl border border-white/[0.04]">
                            {["all", "full-time", "part-time", "internship", "remote"].map((t) => (
                                <button key={t} onClick={() => setJobType(t)}
                                    className={`pressable px-3 py-1.5 rounded-lg text-xs font-medium ${jobType === t ? "bg-yellow-400 text-surface-0 shadow-[0_0_20px_rgba(255,193,7,0.2)]" : "text-white/30 hover:text-white/50"}`}>
                                    {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    )}

                    {/* Job Count */}
                    {!loading && !error && (
                        <p className="text-xs text-white/25 mb-4">{filtered.length} {filtered.length === 1 ? "opening" : "openings"}</p>
                    )}

                    {loading && <ListSkeleton count={5} />}

                    {!loading && error && (
                        <ErrorState message={error} onRetry={loadJobs} />
                    )}

                    {!loading && !error && filtered.length === 0 ? (
                        <EmptyState
                            icon={Briefcase}
                            title={searchTerm || jobType !== "all" ? "No matches" : "No jobs available"}
                            description="Check back later for new opportunities"
                        />
                    ) : !loading && !error && (
                        <div className="space-y-3">
                            {filtered.map((job, i) => {
                                const hasSalary = job.salary_range && (job.salary_range.min ?? 0) > 0;
                                return (
                                <motion.div
                                    key={job._id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(i * 0.04, 0.4), ease }}
                                >
                                    <Link href={`/jobs/${job._id}`}
                                        className="card-hover-row group block bg-surface-2/50 rounded-xl border border-white/[0.06] p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-base font-semibold text-white group-hover:text-yellow-400 transition-colors duration-300">{job.title}</h3>
                                                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-400/10 text-blue-400 border border-blue-400/20">
                                                        {job.type}
                                                    </span>
                                                </div>
                                                {job.company_name && (
                                                    <p className="text-xs text-white/40 mb-2 flex items-center gap-1.5">
                                                        <Building2 size={10} /> {job.company_name}
                                                    </p>
                                                )}
                                                <p className="text-xs text-white/25 line-clamp-2 mb-3">{job.description || ""}</p>

                                                {/* Most decision-relevant fact gets more visual weight */}
                                                {hasSalary && (
                                                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-400/[0.06] border border-emerald-400/15 px-2.5 py-1">
                                                        <DollarSign size={12} className="text-emerald-400" />
                                                        <span className="text-[13px] font-semibold text-emerald-300">
                                                            {job.salary_range!.currency} {(job.salary_range!.min ?? 0).toLocaleString()} – {(job.salary_range!.max ?? 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap items-center gap-4 text-[11px] text-white/20">
                                                    {job.location && <span className="flex items-center gap-1"><MapPin size={10} />{job.location}</span>}
                                                    <span className="capitalize">{job.experience_level}</span>
                                                    {(job.application_count || 0) > 0 && (
                                                        <span className="flex items-center gap-1"><Users size={10} />{job.application_count} applicants</span>
                                                    )}
                                                </div>
                                                {job.skills_required && job.skills_required.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                                        {job.skills_required.slice(0, 6).map((skill) => (
                                                            <span key={skill} className="px-2 py-0.5 rounded bg-surface-3/50 text-[10px] text-white/20 border border-white/[0.04]">{skill}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <ChevronRight size={16} className="text-white/10 group-hover:text-yellow-400/50 group-hover:translate-x-0.5 transition-all duration-300 shrink-0 mt-1" />
                                        </div>
                                    </Link>
                                </motion.div>
                            );})}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
