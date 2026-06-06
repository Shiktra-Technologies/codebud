"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Building2,
    Plus,
    Search,
    CheckCircle2,
    XCircle,
    MapPin,
    Globe,
    Users as UsersIcon,
    Briefcase,
    Loader2,
    X,
    Eye,
    ShieldCheck,
    BarChart3,
    Mail,
} from "lucide-react";
import {
    listCompanies,
    verifyCompany,
    getJobStats,
} from "@/lib/services/companyService";
import type { CompanyProfile } from "@/lib/services/companyService";
import apiClient from "@/lib/apiClient";

const ease = [0.16, 1, 0.3, 1] as const;

export default function CompanyManagementTab() {
    const [companies, setCompanies] = useState<CompanyProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);

    // ── Create company account form ──
    const [newCompany, setNewCompany] = useState({
        email: "",
        password: "",
        company_name: "",
        industry: "",
        location: "",
        website: "",
        description: "",
        company_size: "",
    });

    const fetchData = useCallback(async () => {
        try {
            const [companiesRes, statsRes] = await Promise.all([
                listCompanies().catch(() => ({ success: false, companies: [] })),
                getJobStats().catch(() => null),
            ]);
            if (companiesRes.success) setCompanies(companiesRes.companies || []);
            if (statsRes?.success) setStats(statsRes.stats);
        } catch (err) {
            console.error("Failed to fetch companies:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Create company account (super admin creates user + company profile) ──
    const handleCreate = async () => {
        if (!newCompany.email.trim() || !newCompany.password.trim() || !newCompany.company_name.trim()) return;
        setCreating(true);
        try {
            // Step 1: Create user with company role via signup
            const signupRes = await apiClient.post("/api/auth/signup", {
                email: newCompany.email,
                password: newCompany.password,
                name: newCompany.company_name,
                role: "company",
            });

            if (signupRes.data?.token) {
                // Step 2: Create company profile using the new user's token
                const companyToken = signupRes.data.token;
                await apiClient.post("/api/company/profile", {
                    name: newCompany.company_name,
                    industry: newCompany.industry,
                    location: newCompany.location,
                    website: newCompany.website,
                    description: newCompany.description,
                    size: newCompany.company_size,
                }, {
                    headers: { Authorization: `Bearer ${companyToken}` },
                });
            }

            setShowCreateForm(false);
            setNewCompany({ email: "", password: "", company_name: "", industry: "", location: "", website: "", description: "", company_size: "" });
            fetchData();
        } catch (err: any) {
            alert(err?.response?.data?.error || "Failed to create company account");
        }
        setCreating(false);
    };

    // ── Verify / unverify company ──
    const handleVerify = async (companyId: string) => {
        try {
            await verifyCompany(companyId);
            fetchData();
        } catch {
            alert("Failed to update verification status");
        }
    };

    const filteredCompanies = companies.filter((c) =>
        (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.industry || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.location || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="py-20 text-center">
                <Loader2 size={24} className="mx-auto mb-3 text-white/20 animate-spin" />
                <p className="text-sm text-white/25">Loading companies...</p>
            </div>
        );
    }

    return (
        <div>
            {/* Stats Row */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "Total Companies", value: companies.length, icon: Building2 },
                        { label: "Verified", value: companies.filter((c) => c.verified).length, icon: ShieldCheck },
                        { label: "Active Jobs", value: stats.active_jobs, icon: Briefcase },
                        { label: "Applications", value: stats.total_applications, icon: UsersIcon },
                    ].map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ease }}
                                className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25">{s.label}</span>
                                    <Icon size={14} className="text-white/15" />
                                </div>
                                <p className="text-xl font-bold text-white">{s.value ?? "—"}</p>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/15" />
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search companies..."
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/70 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors" />
                </div>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-400 text-surface-0 text-xs font-bold hover:bg-yellow-300 transition-colors shrink-0"
                >
                    <Plus size={14} /> New Company Account
                </button>
            </div>

            {/* Create Company Form */}
            <AnimatePresence>
                {showCreateForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
                        <div className="bg-surface-2/50 rounded-xl border border-yellow-400/20 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-white">Create Company Account</h3>
                                <button onClick={() => setShowCreateForm(false)} className="p-1 rounded-lg hover:bg-white/[0.05] text-white/30"><X size={16} /></button>
                            </div>
                            <p className="text-xs text-white/30 mb-4">This creates a new user account with "company" role and sets up their company profile.</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Login Email *</label>
                                    <input type="email" value={newCompany.email} onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })} placeholder="company@example.com"
                                        className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Password *</label>
                                    <input type="text" value={newCompany.password} onChange={(e) => setNewCompany({ ...newCompany, password: e.target.value })} placeholder="Initial password"
                                        className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Company Name *</label>
                                    <input type="text" value={newCompany.company_name} onChange={(e) => setNewCompany({ ...newCompany, company_name: e.target.value })} placeholder="e.g. TechCorp Inc."
                                        className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Industry</label>
                                    <input type="text" value={newCompany.industry} onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })} placeholder="e.g. Software, Finance"
                                        className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Location</label>
                                    <input type="text" value={newCompany.location} onChange={(e) => setNewCompany({ ...newCompany, location: e.target.value })} placeholder="e.g. Bangalore, India"
                                        className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Company Size</label>
                                    <select value={newCompany.company_size} onChange={(e) => setNewCompany({ ...newCompany, company_size: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/60 outline-none cursor-pointer">
                                        <option value="">Select size</option>
                                        <option value="1-10">1–10</option>
                                        <option value="11-50">11–50</option>
                                        <option value="51-200">51–200</option>
                                        <option value="201-500">201–500</option>
                                        <option value="501-1000">501–1000</option>
                                        <option value="1000+">1000+</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Website</label>
                                    <input type="url" value={newCompany.website} onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })} placeholder="https://example.com"
                                        className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors" />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Description</label>
                                <textarea value={newCompany.description} onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })} placeholder="Brief about the company..." rows={2}
                                    className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors resize-none" />
                            </div>
                            <button
                                onClick={handleCreate}
                                disabled={!newCompany.email.trim() || !newCompany.password.trim() || !newCompany.company_name.trim() || creating}
                                className="px-5 py-2.5 rounded-lg bg-yellow-400 text-surface-0 text-xs font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {creating ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : "Create Company Account"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Company List */}
            {filteredCompanies.length === 0 ? (
                <div className="py-20 text-center">
                    <Building2 size={32} className="mx-auto mb-3 text-white/10" />
                    <h4 className="text-sm font-semibold text-white/30 mb-1">{searchTerm ? "No matches" : "No Companies"}</h4>
                    <p className="text-xs text-white/15">{searchTerm ? "Try a different search" : "Create the first company account to get started"}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredCompanies.map((company, i) => (
                        <motion.div
                            key={company._id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i * 0.04, 0.3), ease }}
                            className="group bg-surface-2/50 rounded-xl border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-surface-3/50 border border-white/[0.06] flex items-center justify-center shrink-0">
                                            {company.logo_url ? (
                                                <img src={company.logo_url} alt="" className="w-6 h-6 rounded object-cover" />
                                            ) : (
                                                <Building2 size={14} className="text-white/20" />
                                            )}
                                        </div>
                                        <h3 className="text-sm font-semibold text-white truncate">{company.name}</h3>
                                        <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${company.verified
                                            ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                                            : "bg-orange-400/10 text-orange-400 border border-orange-400/20"
                                            }`}>
                                            {company.verified ? "Verified" : "Pending"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/30 line-clamp-1 mb-2">{company.description || "No description"}</p>
                                    <div className="flex items-center gap-4 text-[11px] text-white/20">
                                        {company.industry && <span>{company.industry}</span>}
                                        {company.location && <span className="flex items-center gap-1"><MapPin size={10} />{company.location}</span>}
                                        {company.size && <span className="flex items-center gap-1"><UsersIcon size={10} />{company.size}</span>}
                                        {company.website && (
                                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-yellow-400 transition-colors">
                                                <Globe size={10} /> Website
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => handleVerify(company._id)}
                                        title={company.verified ? "Revoke verification" : "Verify company"}
                                        className={`p-2 rounded-lg transition-colors ${company.verified
                                            ? "text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20"
                                            : "text-white/20 hover:text-emerald-400 hover:bg-emerald-400/10"
                                            }`}
                                    >
                                        <ShieldCheck size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
