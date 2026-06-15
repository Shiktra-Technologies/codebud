"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { reviewTask, reviewProject, MentorshipTask } from "@/lib/services/mentorshipService";

interface MentorReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: any; // Task or Project
    type: "task" | "project";
    onSuccess: () => void;
}

export default function MentorReviewModal({ isOpen, onClose, item, type, onSuccess }: MentorReviewModalProps) {
    const [status, setStatus] = useState("Completed");
    const [comments, setComments] = useState("");
    const [rubric, setRubric] = useState({
        technical_quality: 5,
        architecture: 5,
        ui_ux: 5,
        documentation: 5,
        problem_solving: 5
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen || !item) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const payload = {
                status,
                comments,
                rubric
            };

            let res;
            if (type === "task") {
                res = await reviewTask(item._id, payload);
            } else {
                res = await reviewProject(item._id, payload);
            }

            if (res.success) {
                onSuccess();
                onClose();
            } else {
                setError(res.message || "Failed to submit review");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleRubricChange = (field: string, val: number) => {
        setRubric(prev => ({ ...prev, [field]: val }));
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-surface-1 border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                        <h2 className="text-lg font-bold text-white">Review {type === "task" ? "Task" : "Project"}</h2>
                        <button onClick={onClose} className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto">
                        <div className="mb-6">
                            <p className="text-xs text-yellow-400 font-semibold uppercase tracking-wider mb-1">{type}</p>
                            <h3 className="text-xl font-bold text-white">{item.title}</h3>
                            <p className="text-sm text-white/50 mt-1">{item.description}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Verdict</label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStatus("Completed")}
                                        className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 border transition-all ${status === "Completed" ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-surface-2 border-white/[0.06] text-white/40 hover:bg-surface-3"}`}
                                    >
                                        <CheckCircle2 size={18} /> Approve / Completed
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatus("Needs Revision")}
                                        className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 border transition-all ${status === "Needs Revision" ? "bg-amber-500/10 border-amber-500/50 text-amber-400" : "bg-surface-2 border-white/[0.06] text-white/40 hover:bg-surface-3"}`}
                                    >
                                        <AlertCircle size={18} /> Needs Revision
                                    </button>
                                </div>
                            </div>

                            {/* Rubric */}
                            <div className="bg-surface-2/30 rounded-xl border border-white/[0.04] p-5">
                                <h4 className="text-sm font-semibold text-white mb-4">Rubric Scoring (1-10)</h4>
                                <div className="space-y-4">
                                    {[
                                        { key: "technical_quality", label: "Technical Quality" },
                                        { key: "architecture", label: "Architecture & Design" },
                                        { key: "ui_ux", label: "UI / UX" },
                                        { key: "documentation", label: "Documentation" },
                                        { key: "problem_solving", label: "Problem Solving" }
                                    ].map(metric => (
                                        <div key={metric.key} className="flex items-center justify-between">
                                            <label className="text-sm text-white/70 w-1/2">{metric.label}</label>
                                            <input 
                                                type="range" 
                                                min="1" max="10" 
                                                value={(rubric as any)[metric.key]} 
                                                onChange={(e) => handleRubricChange(metric.key, parseInt(e.target.value))}
                                                className="w-1/3 accent-yellow-400"
                                            />
                                            <span className="w-8 text-right text-sm font-bold text-yellow-400">{(rubric as any)[metric.key]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Comments */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Overall Feedback</label>
                                <textarea
                                    required
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    className="w-full bg-surface-2 border border-white/[0.06] rounded-xl p-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-yellow-400/50 transition-colors h-32 resize-none"
                                    placeholder="Provide detailed feedback for the student..."
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2.5 rounded-lg text-sm font-bold bg-yellow-400 text-black hover:bg-yellow-300 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading && <Loader2 size={16} className="animate-spin" />}
                                    Submit Review
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
