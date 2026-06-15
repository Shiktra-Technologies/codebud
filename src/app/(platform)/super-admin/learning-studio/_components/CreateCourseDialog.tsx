"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, Sparkles } from "lucide-react";
import {
    learningStudio,
    type CourseV2,
    type Difficulty,
} from "@/lib/services/learningStudioService";

const ease = [0.16, 1, 0.3, 1] as const;

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: (course: CourseV2) => void;
}

export default function CreateCourseDialog({ open, onClose, onCreated }: Props) {
    const [title, setTitle] = React.useState("");
    const [shortDesc, setShortDesc] = React.useState("");
    const [category, setCategory] = React.useState("");
    const [difficulty, setDifficulty] = React.useState<Difficulty>("beginner");
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Reset state when the dialog opens fresh.
    React.useEffect(() => {
        if (open) {
            setTitle("");
            setShortDesc("");
            setCategory("");
            setDifficulty("beginner");
            setError(null);
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || busy) return;
        setBusy(true);
        setError(null);
        try {
            const res = await learningStudio.courses.create({
                title: title.trim(),
                short_description: shortDesc.trim(),
                category: category.trim() || "general",
                difficulty,
            });
            if (res.success && res.course) {
                onCreated(res.course);
            } else {
                setError(res.error || "Failed to create course");
            }
        } catch (err: any) {
            setError(err?.message || "Failed to create course");
        } finally {
            setBusy(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={busy ? undefined : onClose}
                    />

                    <motion.form
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.3, ease }}
                        className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-surface-1/95 backdrop-blur-xl shadow-2xl"
                    >
                        <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={busy}
                            className="absolute top-3 right-3 p-1.5 rounded-md text-white/40 hover:text-white/90 hover:bg-white/[0.05] transition"
                            aria-label="Close"
                        >
                            <X size={14} />
                        </button>

                        <div className="px-6 pt-6 pb-2">
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={12} className="text-yellow-400/80" />
                                <p className="text-[10px] uppercase tracking-[0.14em] text-yellow-400/80 font-semibold">
                                    New course
                                </p>
                            </div>
                            <h2 className="text-xl font-semibold tracking-tight">Name your course</h2>
                            <p className="text-[12px] text-white/40 mt-1">
                                You'll fill in the rest — curriculum, targeting, skills — once it's in the studio.
                            </p>
                        </div>

                        <div className="px-6 py-4 space-y-4">
                            <Field label="Title">
                                <input
                                    autoFocus
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Industry-Ready Frontend with React"
                                    className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg px-3.5 py-2 text-[14px] text-white/90 placeholder:text-white/25 focus:outline-none focus:border-yellow-400/40 focus:bg-white/[0.04] transition"
                                />
                            </Field>
                            <Field label="Short description" optional>
                                <input
                                    value={shortDesc}
                                    onChange={(e) => setShortDesc(e.target.value)}
                                    maxLength={280}
                                    placeholder="One-line pitch"
                                    className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg px-3.5 py-2 text-[13px] text-white/85 placeholder:text-white/25 focus:outline-none focus:border-yellow-400/40 focus:bg-white/[0.04] transition"
                                />
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Category" optional>
                                    <input
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="frontend"
                                        className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg px-3.5 py-2 text-[13px] text-white/85 placeholder:text-white/25 focus:outline-none focus:border-yellow-400/40 transition"
                                    />
                                </Field>
                                <Field label="Difficulty">
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                                        className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg px-3.5 py-2 text-[13px] text-white/85 focus:outline-none focus:border-yellow-400/40 transition"
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                        <option value="expert">Expert</option>
                                    </select>
                                </Field>
                            </div>

                            {error && (
                                <p className="text-[12px] text-red-400">{error}</p>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-white/[0.05] flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={busy}
                                className="px-3.5 py-1.5 rounded-lg text-[13px] text-white/60 hover:text-white/90 hover:bg-white/[0.04] transition disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!title.trim() || busy}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-yellow-400 text-black text-[13px] font-semibold hover:brightness-110 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {busy && <Loader2 size={12} className="animate-spin" />}
                                {busy ? "Creating…" : "Create draft"}
                            </button>
                        </div>
                    </motion.form>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function Field({
    label,
    optional,
    children,
}: {
    label: string;
    optional?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="block text-[11px] uppercase tracking-[0.14em] text-white/35 font-semibold mb-1.5">
                {label}
                {optional && <span className="ml-1 text-white/20 normal-case tracking-normal">(optional)</span>}
            </label>
            {children}
        </div>
    );
}
