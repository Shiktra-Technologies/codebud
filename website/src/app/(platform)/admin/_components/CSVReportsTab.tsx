"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
    Download,
    FileText,
    RefreshCw,
    Search,
    Calendar,
    CheckCircle2,
} from "lucide-react";
import adminCSVService from "@/lib/services/adminCSVService";

const ease = [0.16, 1, 0.3, 1] as const;

export default function CSVReportsTab() {
    const [downloading, setDownloading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[] | null>(null);
    const [searching, setSearching] = useState(false);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await adminCSVService.downloadCSV();
        } catch (err: any) {
            alert(err.message || "Failed to download CSV");
        } finally {
            setDownloading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const results = await adminCSVService.searchSubmissions({
                searchTerm: searchQuery,
            });
            setSearchResults(results || []);
        } catch {
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    return (
        <div>
            {/* Download Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}
                className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-6 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400/10 to-amber-500/5 border border-yellow-400/20 flex items-center justify-center">
                            <Download size={22} className="text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-white">Export All Submissions</h3>
                            <p className="text-xs text-white/30 mt-0.5">Download a complete CSV report of all student submissions</p>
                        </div>
                    </div>
                    <button onClick={handleDownload} disabled={downloading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-400 text-surface-0 text-sm font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(255,193,7,0.15)]">
                        {downloading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                        {downloading ? "Exporting…" : "Download CSV"}
                    </button>
                </div>
            </motion.div>

            {/* Search Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease }}
                className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-6 mb-6">
                <h3 className="text-sm font-semibold text-white mb-4">Search Submissions</h3>
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            placeholder="Search by student name, email, or test type..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors" />
                    </div>
                    <button onClick={handleSearch} disabled={searching || !searchQuery.trim()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-3/60 border border-white/[0.06] text-xs font-medium text-white/50 hover:text-white/70 hover:border-white/[0.1] transition-all disabled:opacity-50">
                        {searching ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                        Search
                    </button>
                </div>
            </motion.div>

            {/* Search Results */}
            {searchResults !== null && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
                    className="bg-surface-2/50 rounded-xl border border-white/[0.06] overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-white/[0.04]">
                        <h3 className="text-sm font-semibold text-white/80">Search Results</h3>
                        <span className="text-[11px] text-white/25">{searchResults.length} found</span>
                    </div>
                    {searchResults.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileText size={24} className="mx-auto mb-2 text-white/15" />
                            <p className="text-xs text-white/25">No submissions match your search</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.04]">
                            {searchResults.slice(0, 20).map((sub: any, i: number) => {
                                const name = sub.userName || sub.user_name || sub.displayName || sub.userEmail || "Unknown";
                                const type = sub.test_type || sub.testType || "Aptitude";
                                const score = sub.score || 0;
                                const total = sub.total_questions || sub.totalQuestions || 30;
                                const pct = Math.round((score / total) * 100);
                                const passed = pct >= 60;
                                return (
                                    <div key={sub.id || i} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.015] transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${passed ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                                                {passed ? <CheckCircle2 size={12} /> : <span className="text-xs font-bold">✕</span>}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[13px] text-white/60 truncate">{name}</p>
                                                <p className="text-[11px] text-white/20">{type}</p>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-bold ${passed ? "text-emerald-400" : "text-red-400"}`}>{pct}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Report Types Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2, ease }}
                className="mt-6 bg-surface-2/30 rounded-xl border border-white/[0.04] p-6">
                <h3 className="text-sm font-semibold text-white/40 mb-4">CSV Report Includes</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        "Student name & email",
                        "Test type & date",
                        "Score & percentage",
                        "Pass/fail status",
                        "Time taken",
                        "Question details",
                        "Answer selections",
                        "Violation flags",
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-white/25">
                            <CheckCircle2 size={11} className="text-emerald-400/40 shrink-0" />
                            {item}
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
