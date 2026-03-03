"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Settings,
    Plus,
    Trash2,
    Save,
    Loader2,
    Search,
    GraduationCap,
    Code2,
    Briefcase,
    Target,
    Building2,
    BookOpen,
    Wrench,
    Brain,
    Star,
    Eye,
    EyeOff,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
} from "lucide-react";
import {
    getAllPlatformConfig,
    updatePlatformConfig,
} from "@/lib/services/onboardingService";

const ease = [0.16, 1, 0.3, 1] as const;

// Category metadata for UX
const CATEGORY_META: Record<string, { label: string; description: string; icon: React.ElementType; color: string }> = {
    colleges: { label: "Colleges / Universities", description: "Education institutions shown in onboarding", icon: GraduationCap, color: "yellow" },
    degrees: { label: "Degrees", description: "Academic degrees (B.Tech, M.Tech, etc.)", icon: BookOpen, color: "blue" },
    branches: { label: "Branches / Specializations", description: "Academic branches like CSE, ECE, etc.", icon: Brain, color: "purple" },
    programming_languages: { label: "Programming Languages", description: "Languages students can select as skills", icon: Code2, color: "emerald" },
    frameworks: { label: "Frameworks & Tools", description: "Tech frameworks and developer tools", icon: Wrench, color: "orange" },
    interest_topics: { label: "Interest Topics", description: "Topics students can express interest in", icon: Star, color: "pink" },
    career_goals: { label: "Career Goals", description: "What brings students to the platform", icon: Target, color: "cyan" },
    job_roles: { label: "Job Roles", description: "Preferred job/career roles", icon: Briefcase, color: "indigo" },
    dream_companies: { label: "Dream Companies", description: "Target companies for placement prep", icon: Building2, color: "rose" },
};

const COLOR_MAP: Record<string, string> = {
    yellow: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
    blue: "bg-blue-400/10 text-blue-400 border-blue-400/20",
    purple: "bg-purple-400/10 text-purple-400 border-purple-400/20",
    emerald: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    orange: "bg-orange-400/10 text-orange-400 border-orange-400/20",
    pink: "bg-pink-400/10 text-pink-400 border-pink-400/20",
    cyan: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
    indigo: "bg-indigo-400/10 text-indigo-400 border-indigo-400/20",
    rose: "bg-rose-400/10 text-rose-400 border-rose-400/20",
};

interface ConfigValue {
    label: string;
    active: boolean;
}

interface CategoryConfig {
    _id?: string;
    category: string;
    values: ConfigValue[];
}

export default function PlatformConfigTab() {
    const [configs, setConfigs] = useState<CategoryConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [newItem, setNewItem] = useState("");
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());

    // ── Fetch all config ──
    const fetchConfig = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getAllPlatformConfig();
            if (res.success && res.configs) {
                setConfigs(res.configs);
                if (!selectedCategory && res.configs.length > 0) {
                    setSelectedCategory(res.configs[0].category);
                }
            }
        } catch (err) {
            console.error("Failed to load platform config:", err);
            showToast("Failed to load configuration", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Current category data ──
    const currentConfig = configs.find((c) => c.category === selectedCategory);
    const currentValues = currentConfig?.values || [];
    const filteredValues = search.trim()
        ? currentValues.filter((v) => v.label.toLowerCase().includes(search.toLowerCase()))
        : currentValues;
    const meta = selectedCategory ? CATEGORY_META[selectedCategory] : null;

    // ── Add item ──
    const handleAddItem = () => {
        if (!newItem.trim() || !selectedCategory) return;
        // Check duplicate
        if (currentValues.some((v) => v.label.toLowerCase() === newItem.trim().toLowerCase())) {
            showToast("Item already exists", "error");
            return;
        }
        setConfigs((prev) =>
            prev.map((c) =>
                c.category === selectedCategory
                    ? { ...c, values: [...c.values, { label: newItem.trim(), active: true }] }
                    : c,
            ),
        );
        setNewItem("");
        setPendingChanges((prev) => new Set(prev).add(selectedCategory));
    };

    // ── Remove item ──
    const handleRemoveItem = (label: string) => {
        if (!selectedCategory) return;
        setConfigs((prev) =>
            prev.map((c) =>
                c.category === selectedCategory
                    ? { ...c, values: c.values.filter((v) => v.label !== label) }
                    : c,
            ),
        );
        setPendingChanges((prev) => new Set(prev).add(selectedCategory));
    };

    // ── Toggle active ──
    const handleToggleActive = (label: string) => {
        if (!selectedCategory) return;
        setConfigs((prev) =>
            prev.map((c) =>
                c.category === selectedCategory
                    ? { ...c, values: c.values.map((v) => v.label === label ? { ...v, active: !v.active } : v) }
                    : c,
            ),
        );
        setPendingChanges((prev) => new Set(prev).add(selectedCategory));
    };

    // ── Save ──
    const handleSave = async () => {
        if (!selectedCategory || !currentConfig) return;
        setSaving(true);
        try {
            const res = await updatePlatformConfig(selectedCategory, currentConfig.values);
            if (res.success) {
                showToast(`Saved ${meta?.label || selectedCategory} successfully`, "success");
                setPendingChanges((prev) => {
                    const next = new Set(prev);
                    next.delete(selectedCategory);
                    return next;
                });
            } else {
                showToast("Failed to save", "error");
            }
        } catch (err) {
            showToast("Failed to save configuration", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 size={24} className="animate-spin text-yellow-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Toast ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-xl ${
                            toast.type === "success"
                                ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                                : "bg-red-400/10 border-red-400/20 text-red-400"
                        }`}
                    >
                        {toast.type === "success" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                        <span className="text-xs font-semibold">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Settings size={18} className="text-yellow-400" />
                        Platform Configuration
                    </h2>
                    <p className="text-xs text-white/25 mt-1">
                        Manage dropdown options shown during student onboarding. Changes take effect immediately after saving.
                    </p>
                </div>
                <button
                    onClick={fetchConfig}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white/30 hover:text-white/50 bg-surface-2/50 border border-white/[0.06] hover:border-white/[0.1] transition-all"
                >
                    <RefreshCw size={12} /> Refresh
                </button>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* ── Sidebar: Categories ── */}
                <div className="col-span-4 space-y-1.5">
                    {Object.entries(CATEGORY_META).map(([key, m]) => {
                        const Icon = m.icon;
                        const isActive = selectedCategory === key;
                        const count = configs.find((c) => c.category === key)?.values.length || 0;
                        const hasChanges = pendingChanges.has(key);
                        return (
                            <button
                                key={key}
                                onClick={() => {
                                    setSelectedCategory(key);
                                    setSearch("");
                                    setNewItem("");
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                                    isActive
                                        ? "bg-surface-2 border border-white/[0.08]"
                                        : "hover:bg-surface-2/30 border border-transparent"
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${COLOR_MAP[m.color] || ""}`}>
                                    <Icon size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-semibold truncate ${isActive ? "text-white" : "text-white/40"}`}>
                                        {m.label}
                                    </p>
                                    <p className="text-[10px] text-white/15">{count} items</p>
                                </div>
                                {hasChanges && (
                                    <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ── Main: Config values ── */}
                <div className="col-span-8">
                    {selectedCategory && meta ? (
                        <div className="bg-surface-2/30 rounded-2xl border border-white/[0.06] overflow-hidden">
                            {/* Category header */}
                            <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-white">{meta.label}</h3>
                                    <p className="text-[10px] text-white/20 mt-0.5">{meta.description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${COLOR_MAP[meta.color]}`}>
                                        {currentValues.length} total · {currentValues.filter((v) => v.active).length} active
                                    </span>
                                    {pendingChanges.has(selectedCategory) && (
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-400 text-surface-0 hover:bg-yellow-300 shadow-lg shadow-yellow-400/10 transition-all"
                                        >
                                            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                            Save
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Search + Add */}
                            <div className="px-5 py-3 border-b border-white/[0.04] flex gap-2">
                                <div className="relative flex-1">
                                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/15" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search items..."
                                        className="w-full pl-8 pr-3 py-2 rounded-lg bg-surface-0/50 border border-white/[0.04] text-xs text-white/60 placeholder:text-white/15 outline-none focus:border-yellow-400/20 transition-colors"
                                    />
                                </div>
                                <div className="flex gap-1.5">
                                    <input
                                        type="text"
                                        value={newItem}
                                        onChange={(e) => setNewItem(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                                        placeholder="Add new item..."
                                        className="w-44 px-3 py-2 rounded-lg bg-surface-0/50 border border-white/[0.04] text-xs text-white/60 placeholder:text-white/15 outline-none focus:border-yellow-400/20 transition-colors"
                                    />
                                    <button
                                        onClick={handleAddItem}
                                        disabled={!newItem.trim()}
                                        className="px-3 py-2 rounded-lg text-xs font-bold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 hover:bg-yellow-400/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Items list */}
                            <div className="max-h-[480px] overflow-y-auto">
                                {filteredValues.length === 0 ? (
                                    <div className="px-5 py-12 text-center">
                                        <p className="text-xs text-white/15">
                                            {search ? "No items match your search" : "No items yet — add some above"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/[0.03]">
                                        {filteredValues.map((val, idx) => (
                                            <motion.div
                                                key={val.label}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.01] group transition-colors"
                                            >
                                                <span className="text-[10px] text-white/10 w-6 text-right font-mono">{idx + 1}</span>
                                                <span className={`flex-1 text-xs font-medium ${val.active ? "text-white/60" : "text-white/15 line-through"}`}>
                                                    {val.label}
                                                </span>
                                                <button
                                                    onClick={() => handleToggleActive(val.label)}
                                                    className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                                                        val.active
                                                            ? "text-emerald-400 hover:bg-emerald-400/10"
                                                            : "text-white/15 hover:bg-white/[0.04]"
                                                    }`}
                                                    title={val.active ? "Disable" : "Enable"}
                                                >
                                                    {val.active ? <Eye size={12} /> : <EyeOff size={12} />}
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveItem(val.label)}
                                                    className="p-1.5 rounded-lg text-white/10 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-24">
                            <p className="text-xs text-white/15">Select a category to manage</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
