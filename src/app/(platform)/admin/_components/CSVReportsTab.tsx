"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Download,
    FileText,
    RefreshCw,
    Search,
    Calendar,
    CheckCircle2,
    Filter,
    SlidersHorizontal,
    ChevronDown,
    ChevronUp,
    X,
} from "lucide-react";
import adminCSVService from "@/lib/services/adminCSVService";

const ease = [0.16, 1, 0.3, 1] as const;

const TEST_TYPES = [
    { value: "", label: "All Types" },
    { value: "aptitude", label: "Aptitude" },
    { value: "dsa", label: "DSA" },
    { value: "coding", label: "Coding" },
    { value: "mcq", label: "MCQ" },
];

export default function CSVReportsTab() {
    const [downloading, setDownloading] = useState(false);
    const [downloadingFiltered, setDownloadingFiltered] = useState(false);

    // Search
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[] | null>(null);
    const [searching, setSearching] = useState(false);

    // Filter panel
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [minScore, setMinScore] = useState("");
    const [maxScore, setMaxScore] = useState("");
    const [testType, setTestType] = useState("");
    const [filteredCount, setFilteredCount] = useState<number | null>(null);

    const hasFilters = startDate || endDate || minScore || maxScore || testType;

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

    const handleFilteredDownload = async () => {
        setDownloadingFiltered(true);
        try {
            const criteria: Record<string, any> = {};
            if (searchQuery.trim()) criteria.searchTerm = searchQuery.trim();
            if (startDate) criteria.startDate = startDate;
            if (endDate) criteria.endDate = endDate;
            if (minScore) criteria.minScore = Number(minScore);
            if (maxScore) criteria.maxScore = Number(maxScore);
            if (testType) criteria.testType = testType;
            await adminCSVService.exportFilteredCSV(criteria);
        } catch (err: any) {
            alert(err.message || "Failed to export filtered CSV");
        } finally {
            setDownloadingFiltered(false);
        }
    };

    const handleSearch = useCallback(async () => {
        const criteria: Record<string, any> = {};
        if (searchQuery.trim()) criteria.searchTerm = searchQuery.trim();
        if (startDate) criteria.startDate = startDate;
        if (endDate) criteria.endDate = endDate;
        if (minScore) criteria.minScore = Number(minScore);
        if (maxScore) criteria.maxScore = Number(maxScore);
        if (testType) criteria.testType = testType;

        if (!Object.keys(criteria).length) return;

        setSearching(true);
        try {
            const results = await adminCSVService.searchSubmissions(criteria);
            setSearchResults(results || []);
            setFilteredCount(results?.length ?? 0);
        } catch {
            setSearchResults([]);
            setFilteredCount(0);
        } finally {
            setSearching(false);
        }
    }, [searchQuery, startDate, endDate, minScore, maxScore, testType]);

    const clearFilters = () => {
        setStartDate("");
        setEndDate("");
        setMinScore("");
        setMaxScore("");
        setTestType("");
        setFilteredCount(null);
        setSearchResults(null);
    };

    const inputClass =
        "w-full px-3 py-2 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors";
    const labelClass = "block text-[11px] font-medium text-white/30 mb-1.5 uppercase tracking-wider";

    return (
        <div>
            {/* Download Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease }}
                className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-6 mb-6"
            >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400/10 to-amber-500/5 border border-yellow-400/20 flex items-center justify-center">
                            <Download size={22} className="text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-white">Export All Submissions</h3>
                            <p className="text-xs text-white/30 mt-0.5">
                                Download a complete CSV report with 45+ columns of all student submissions
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-400 text-surface-0 text-sm font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(255,193,7,0.15)]"
                    >
                        {downloading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                        {downloading ? "Exporting…" : "Download CSV"}
                    </button>
                </div>
            </motion.div>

            {/* Filter & Search Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease }}
                className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-6 mb-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal size={14} className="text-yellow-400/60" />
                        <h3 className="text-sm font-semibold text-white">Search &amp; Filter</h3>
                        {hasFilters && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 text-[10px] font-bold">
                                Filters Active
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setFiltersOpen(!filtersOpen)}
                        className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/50 transition-colors"
                    >
                        <Filter size={12} />
                        {filtersOpen ? "Hide Filters" : "Show Filters"}
                        {filtersOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                </div>

                {/* Text search row */}
                <div className="flex gap-3 mb-3">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            placeholder="Search by student name, email, or test type..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={searching || (!searchQuery.trim() && !hasFilters)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-3/60 border border-white/[0.06] text-xs font-medium text-white/50 hover:text-white/70 hover:border-white/[0.1] transition-all disabled:opacity-50"
                    >
                        {searching ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                        Search
                    </button>
                </div>

                {/* Expandable filter panel */}
                <AnimatePresence>
                    {filtersOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease }}
                            className="overflow-hidden"
                        >
                            <div className="pt-3 border-t border-white/[0.04]">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    {/* Date range */}
                                    <div>
                                        <label className={labelClass}>Start Date</label>
                                        <div className="relative">
                                            <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className={`${inputClass} pl-9`}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>End Date</label>
                                        <div className="relative">
                                            <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className={`${inputClass} pl-9`}
                                            />
                                        </div>
                                    </div>

                                    {/* Score range */}
                                    <div>
                                        <label className={labelClass}>Min Score (%)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={minScore}
                                            onChange={(e) => setMinScore(e.target.value)}
                                            placeholder="0"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Max Score (%)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={maxScore}
                                            onChange={(e) => setMaxScore(e.target.value)}
                                            placeholder="100"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                    {/* Test type filter */}
                                    <div>
                                        <label className={labelClass}>Test Type</label>
                                        <select
                                            value={testType}
                                            onChange={(e) => setTestType(e.target.value)}
                                            className={`${inputClass} cursor-pointer`}
                                        >
                                            {TEST_TYPES.map((t) => (
                                                <option key={t.value} value={t.value} className="bg-surface-3 text-white">
                                                    {t.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-end gap-2 sm:col-span-2">
                                        <button
                                            onClick={handleSearch}
                                            disabled={searching || (!searchQuery.trim() && !hasFilters)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-xs font-bold text-yellow-400 hover:bg-yellow-400/20 transition-all disabled:opacity-50"
                                        >
                                            {searching ? <RefreshCw size={13} className="animate-spin" /> : <Filter size={13} />}
                                            Apply Filters
                                        </button>
                                        <button
                                            onClick={handleFilteredDownload}
                                            disabled={downloadingFiltered || (!searchQuery.trim() && !hasFilters)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-xs font-bold text-emerald-400 hover:bg-emerald-400/20 transition-all disabled:opacity-50"
                                        >
                                            {downloadingFiltered ? (
                                                <RefreshCw size={13} className="animate-spin" />
                                            ) : (
                                                <Download size={13} />
                                            )}
                                            Export Filtered CSV
                                        </button>
                                        {hasFilters && (
                                            <button
                                                onClick={clearFilters}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-white/30 hover:text-white/50 hover:bg-white/[0.03] transition-all"
                                            >
                                                <X size={12} />
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {filteredCount !== null && (
                                    <div className="text-[11px] text-white/25 mt-1">
                                        {filteredCount} submission{filteredCount !== 1 ? "s" : ""} match your filters
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Search Results */}
            {searchResults !== null && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease }}
                    className="bg-surface-2/50 rounded-xl border border-white/[0.06] overflow-hidden mb-6"
                >
                    <div className="flex items-center justify-between p-5 border-b border-white/[0.04]">
                        <h3 className="text-sm font-semibold text-white/80">Search Results</h3>
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] text-white/25">{searchResults.length} found</span>
                            {searchResults.length > 0 && (
                                <button
                                    onClick={handleFilteredDownload}
                                    disabled={downloadingFiltered}
                                    className="flex items-center gap-1.5 text-[11px] text-emerald-400/60 hover:text-emerald-400 transition-colors"
                                >
                                    <Download size={11} />
                                    Export these
                                </button>
                            )}
                        </div>
                    </div>
                    {searchResults.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileText size={24} className="mx-auto mb-2 text-white/15" />
                            <p className="text-xs text-white/25">No submissions match your search</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.04]">
                            {searchResults.slice(0, 30).map((sub: any, i: number) => {
                                const name =
                                    sub.userName || sub.user_name || sub.displayName || sub.userEmail || "Unknown";
                                const type = sub.test_type || sub.testType || "Aptitude";
                                const score = sub.score || 0;
                                const total = sub.total_questions || sub.totalQuestions || 30;
                                const pct = total > 0 ? Math.round((score / total) * 100) : 0;
                                const passed = pct >= 60;
                                const date = sub.submitted_at || sub.submittedAt || sub.timestamp;
                                const dateStr = date ? new Date(date).toLocaleDateString() : "";
                                const violations = sub.violation_count || 0;
                                return (
                                    <div
                                        key={sub.id || sub._id || i}
                                        className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.015] transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div
                                                className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                                                    passed ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
                                                }`}
                                            >
                                                {passed ? (
                                                    <CheckCircle2 size={12} />
                                                ) : (
                                                    <span className="text-xs font-bold">✕</span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[13px] text-white/60 truncate">{name}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] text-white/20">{type}</span>
                                                    {dateStr && (
                                                        <span className="text-[10px] text-white/15">{dateStr}</span>
                                                    )}
                                                    {violations > 0 && (
                                                        <span className="text-[10px] text-red-400/50">
                                                            {violations} violation{violations > 1 ? "s" : ""}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-bold ${passed ? "text-emerald-400" : "text-red-400"}`}>
                                            {pct}%
                                        </span>
                                    </div>
                                );
                            })}
                            {searchResults.length > 30 && (
                                <div className="px-5 py-3 text-center text-[11px] text-white/20">
                                    Showing 30 of {searchResults.length} results. Export to CSV to see all.
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Report Types Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease }}
                className="mt-6 bg-surface-2/30 rounded-xl border border-white/[0.04] p-6"
            >
                <h3 className="text-sm font-semibold text-white/40 mb-4">CSV Report Includes (45+ Columns)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                        "Student name & email",
                        "User ID & submission ID",
                        "Test type & title",
                        "Difficulty & category",
                        "Score & percentage",
                        "Correct / wrong answers",
                        "Pass/fail status",
                        "Time taken (sec & min)",
                        "Start & submit timestamps",
                        "Language & code snippet",
                        "Answers JSON",
                        "Test results JSON",
                        "Violation count & types",
                        "Violation details JSON",
                        "Auto-submitted flag",
                        "Device type & user agent",
                        "Browser & OS",
                        "Screen resolution",
                        "Mobile detection",
                        "Fullscreen status",
                        "Camera & mic status",
                        "Face detection info",
                        "Timezone & language",
                        "Data source & fallback",
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
