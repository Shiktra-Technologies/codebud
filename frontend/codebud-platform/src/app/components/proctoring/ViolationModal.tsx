"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Violation } from "@/lib/context/ProctorContext";
import { AlertTriangle, ShieldAlert, ShieldCheck, X } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

interface ViolationModalProps {
    violations: Violation[];
    onAcknowledge: () => void;
    onSubmitTest: () => void;
}

export default function ViolationModal({
    violations,
    onAcknowledge,
    onSubmitTest,
}: ViolationModalProps) {
    if (!violations.length) return null;

    const criticalViolations = violations.filter((v) => v.type === "CRITICAL");
    const hasCritical = criticalViolations.length > 0;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.4, ease }}
                    className="w-full max-w-md bg-surface-1 rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div
                        className={`px-6 py-5 flex items-center gap-3 ${
                            hasCritical
                                ? "bg-red-500/10 border-b border-red-500/20"
                                : "bg-yellow-400/10 border-b border-yellow-400/20"
                        }`}
                    >
                        <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                hasCritical
                                    ? "bg-red-500/15 border border-red-500/20"
                                    : "bg-yellow-400/15 border border-yellow-400/20"
                            }`}
                        >
                            {hasCritical ? (
                                <ShieldAlert size={20} className="text-red-400" />
                            ) : (
                                <AlertTriangle size={20} className="text-yellow-400" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">
                                {hasCritical ? "Test Violation Detected" : "Security Warning"}
                            </h2>
                            <p className="text-xs text-white/30 mt-0.5">
                                {hasCritical
                                    ? "Your test has been auto-submitted"
                                    : "Please review these warnings"}
                            </p>
                        </div>
                    </div>

                    {/* Violations list */}
                    <div className="px-6 py-4 max-h-[280px] overflow-y-auto">
                        {hasCritical ? (
                            <>
                                <p className="text-xs text-white/40 mb-3">
                                    Your test was automatically submitted due to security violations:
                                </p>
                                <div className="space-y-2">
                                    {criticalViolations.map((v) => (
                                        <div
                                            key={v.id}
                                            className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/5 border border-red-500/10"
                                        >
                                            <ShieldAlert
                                                size={14}
                                                className="text-red-400 shrink-0 mt-0.5"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-white/60">
                                                    {v.description}
                                                </p>
                                                <p className="text-[10px] text-white/20 mt-0.5">
                                                    {new Date(v.timestamp).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-red-400/60 mt-3">
                                    Contact your proctor or administrator for further instructions.
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-xs text-white/40 mb-3">
                                    The following security warnings have been recorded:
                                </p>
                                <div className="space-y-2">
                                    {violations.map((v) => (
                                        <div
                                            key={v.id}
                                            className="flex items-start gap-2.5 p-3 rounded-lg bg-yellow-400/5 border border-yellow-400/10"
                                        >
                                            <AlertTriangle
                                                size={14}
                                                className="text-yellow-400 shrink-0 mt-0.5"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-white/60">
                                                    {v.description}
                                                </p>
                                                <p className="text-[10px] text-white/20 mt-0.5">
                                                    {new Date(v.timestamp).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-yellow-400/60 mt-3">
                                    Continued violations will result in automatic test submission.
                                </p>
                            </>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 border-t border-white/[0.06]">
                        {hasCritical ? (
                            <button
                                onClick={onSubmitTest}
                                className="w-full py-3 rounded-xl bg-red-500/15 border border-red-500/20 text-sm font-bold text-red-400 hover:bg-red-500/25 transition-colors"
                            >
                                View Submitted Test
                            </button>
                        ) : (
                            <button
                                onClick={onAcknowledge}
                                className="w-full py-3 rounded-xl bg-yellow-400 text-surface-0 text-sm font-bold hover:bg-yellow-300 transition-colors shadow-[0_0_20px_rgba(255,193,7,0.15)]"
                            >
                                I Understand — Continue Test
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
