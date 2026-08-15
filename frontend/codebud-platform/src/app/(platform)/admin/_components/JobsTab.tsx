"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Briefcase,
    Plus,
    MapPin,
    DollarSign,
    Clock,
    Trash2,
    Users,
    RefreshCw,
    X,
} from "lucide-react";
import jobService from "@/lib/services/jobService";

const ease = [0.16, 1, 0.3, 1] as const;

interface Job {
    id: string;
    company: string;
    position: string;
    location: string;
    type: string;
    salary: string;
    description?: string;
    postedDate?: string;
    applications?: any[];
    [key: string]: unknown;
}

export default function JobsTab() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        company: "",
        position: "",
        location: "",
        type: "Full-time",
        salary: "",
        description: "",
    });

    const fetchJobs = useCallback(() => {
        try {
            jobService.initializeSampleData();
            const list = jobService.getJobPostings();
            setJobs(list || []);
        } catch {
            setJobs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handleCreate = () => {
        if (!formData.company || !formData.position) return;
        try {
            jobService.addJobPosting(formData);
            setFormData({ company: "", position: "", location: "", type: "Full-time", salary: "", description: "" });
            setShowForm(false);
            fetchJobs();
        } catch (err: any) {
            alert(err.message || "Failed to create job posting");
        }
    };

    const handleDelete = (jobId: string) => {
        if (confirm("Delete this job posting?")) {
            try {
                jobService.deleteJobPosting(jobId);
                fetchJobs();
            } catch {
                alert("Failed to delete job");
            }
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-white/30">{jobs.length} postings</span>
                </div>
                <button onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-400 text-surface-0 text-xs font-bold hover:bg-yellow-300 transition-colors">
                    <Plus size={14} /> New Posting
                </button>
            </div>

            {/* Create Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="mb-6 overflow-hidden">
                        <div className="bg-surface-2/50 rounded-xl border border-yellow-400/20 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-white">Create Job Posting</h3>
                                <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-white/[0.05] text-white/30">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                {[
                                    { key: "company", label: "Company", placeholder: "e.g. Google" },
                                    { key: "position", label: "Position", placeholder: "e.g. Frontend Developer" },
                                    { key: "location", label: "Location", placeholder: "e.g. Remote / Bangalore" },
                                    { key: "salary", label: "Salary", placeholder: "e.g. ₹8-12 LPA" },
                                ].map((field) => (
                                    <div key={field.key}>
                                        <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">{field.label}</label>
                                        <input type="text" value={(formData as any)[field.key]} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                            placeholder={field.placeholder}
                                            className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors" />
                                    </div>
                                ))}
                            </div>
                            <div className="mb-4">
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Type</label>
                                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/60 outline-none focus:border-yellow-400/30 transition-colors cursor-pointer">
                                    {["Full-time", "Part-time", "Internship", "Contract", "Remote"].map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Description</label>
                                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Job description..."
                                    rows={3}
                                    className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors resize-none" />
                            </div>
                            <button onClick={handleCreate} disabled={!formData.company || !formData.position}
                                className="px-5 py-2.5 rounded-lg bg-yellow-400 text-surface-0 text-xs font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                Create Posting
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Job Cards */}
            {loading ? (
                <div className="py-20 text-center">
                    <RefreshCw size={24} className="mx-auto mb-3 text-white/20 animate-spin" />
                    <p className="text-sm text-white/25">Loading jobs...</p>
                </div>
            ) : jobs.length === 0 ? (
                <div className="py-20 text-center">
                    <Briefcase size={32} className="mx-auto mb-3 text-white/10" />
                    <h4 className="text-sm font-semibold text-white/30 mb-1">No Job Postings</h4>
                    <p className="text-xs text-white/15">Create your first job posting above</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {jobs.map((job, i) => (
                        <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3), ease }}
                            className="group bg-surface-2/50 rounded-xl border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-sm font-semibold text-white group-hover:text-yellow-400 transition-colors">{job.position}</h3>
                                    <p className="text-xs text-white/35">{job.company}</p>
                                </div>
                                <button onClick={() => handleDelete(job.id)}
                                    className="p-1.5 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100">
                                    <Trash2 size={13} />
                                </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px] text-white/25">
                                <span className="flex items-center gap-1"><MapPin size={10} />{job.location}</span>
                                <span className="flex items-center gap-1"><DollarSign size={10} />{job.salary}</span>
                                <span className="px-1.5 py-0.5 rounded bg-surface-3/50 border border-white/[0.04]">{job.type}</span>
                            </div>
                            {job.applications && job.applications.length > 0 && (
                                <div className="flex items-center gap-1.5 text-xs text-yellow-400/60">
                                    <Users size={12} />
                                    {job.applications.length} application{job.applications.length !== 1 ? "s" : ""}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
