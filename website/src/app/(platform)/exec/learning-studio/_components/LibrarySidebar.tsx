"use client";

import React from "react";
import { motion } from "motion/react";
import { Search, RefreshCw, Lock, FileText } from "lucide-react";
import {
    type CourseListResponse,
    type LifecycleState,
    LIFECYCLE_LABELS,
    LIFECYCLE_TONE,
} from "@/lib/services/learningStudioService";

interface Props {
    library: CourseListResponse | null;
    loading: boolean;
    stateFilter: LifecycleState | "all";
    onStateFilterChange: (s: LifecycleState | "all") => void;
    activeCourseId: string | null;
    onSelect: (id: string) => void;
    onRefresh: () => void;
}

const FILTERS: Array<LifecycleState | "all"> = [
    "all",
    "draft",
    "review",
    "scheduled",
    "published",
    "archived",
];

export default function LibrarySidebar({
    library,
    loading,
    stateFilter,
    onStateFilterChange,
    activeCourseId,
    onSelect,
    onRefresh,
}: Props) {
    const [search, setSearch] = React.useState("");

    const v2 = library?.courses_v2 ?? [];
    const v1 = library?.courses_v1_legacy ?? [];

    const filteredV2 = React.useMemo(() => {
        const s = search.trim().toLowerCase();
        return v2.filter((c) => {
            if (stateFilter !== "all" && c.lifecycle_state !== stateFilter) return false;
            if (s && !c.title.toLowerCase().includes(s)) return false;
            return true;
        });
    }, [v2, stateFilter, search]);

    return (
        <div className="flex flex-col h-full">
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="sticky top-0 z-10 bg-surface-0/95 backdrop-blur border-b border-white/[0.04] px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-white/30 font-semibold">Library</p>
                        <p className="text-[13px] text-white/70 font-medium mt-0.5">
                            {v2.length + v1.length} {v2.length + v1.length === 1 ? "course" : "courses"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onRefresh}
                        className="p-1.5 rounded-md hover:bg-white/[0.04] text-white/40 hover:text-white/80 transition"
                        aria-label="Refresh"
                    >
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search courses"
                        className="w-full pl-7 pr-2.5 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.05] text-xs text-white/80 placeholder:text-white/25 focus:outline-none focus:border-yellow-400/30 focus:bg-white/[0.05] transition"
                    />
                </div>

                <div className="flex flex-wrap gap-1 mt-2.5">
                    {FILTERS.map((f) => {
                        const isActive = stateFilter === f;
                        const count =
                            f === "all"
                                ? v2.length
                                : library?.counts?.[f] ?? 0;
                        return (
                            <button
                                key={f}
                                type="button"
                                onClick={() => onStateFilterChange(f)}
                                className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                                    isActive
                                        ? "bg-yellow-400/10 text-yellow-300 border-yellow-400/30"
                                        : "bg-white/[0.02] text-white/40 border-white/[0.05] hover:text-white/70"
                                }`}
                            >
                                {f === "all" ? "All" : LIFECYCLE_LABELS[f]}{" "}
                                <span className="opacity-60">{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── List ──────────────────────────────────────────────── */}
            <div className="flex-1 px-2 py-2 space-y-0.5">
                {loading && v2.length === 0 ? (
                    <div className="px-2 py-8 text-center text-xs text-white/30">Loading…</div>
                ) : filteredV2.length === 0 && v1.length === 0 ? (
                    <div className="px-2 py-8 text-center text-xs text-white/30">
                        No courses match this view.
                    </div>
                ) : (
                    <>
                        {filteredV2.map((c) => {
                            const isActive = c._id === activeCourseId;
                            const tone = LIFECYCLE_TONE[c.lifecycle_state];
                            return (
                                <motion.button
                                    key={c._id}
                                    type="button"
                                    onClick={() => onSelect(c._id)}
                                    whileHover={{ x: 1 }}
                                    className={`group w-full text-left px-3 py-2.5 rounded-lg transition relative ${
                                        isActive
                                            ? "bg-white/[0.05] ring-1 ring-yellow-400/30"
                                            : "hover:bg-white/[0.03]"
                                    }`}
                                >
                                    {isActive && (
                                        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-yellow-400" />
                                    )}
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-[13px] font-medium text-white/85 truncate">
                                            {c.title || "Untitled"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span
                                            className={`text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-sm border ${tone.bg} ${tone.fg} ${tone.border}`}
                                        >
                                            {LIFECYCLE_LABELS[c.lifecycle_state]}
                                        </span>
                                        <span className="text-[10px] text-white/25">
                                            v{c.version_number}
                                        </span>
                                        <span className="text-[10px] text-white/25 ml-auto">
                                            {c.modules?.length ?? 0} mod
                                        </span>
                                    </div>
                                </motion.button>
                            );
                        })}

                        {v1.length > 0 && (
                            <div className="pt-4 pb-1">
                                <p className="px-3 text-[9px] uppercase tracking-[0.14em] text-white/25 font-semibold flex items-center gap-1.5">
                                    <Lock size={9} /> Legacy (read-only)
                                </p>
                            </div>
                        )}
                        {v1.map((c) => (
                            <div
                                key={c._id}
                                className="px-3 py-2 rounded-lg opacity-50 cursor-not-allowed"
                                title="Legacy course — managed in the old admin panel"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText size={11} className="text-white/30 shrink-0" />
                                    <p className="text-[12px] text-white/50 truncate">{c.title}</p>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
