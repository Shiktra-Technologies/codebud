"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, ShieldAlert, X } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

interface ViolationWarningPopupProps {
    violation: { description: string } | null;
    violationCount: number;
    maxViolations: number;
    onClose: () => void;
}

export default function ViolationWarningPopup({
    violation,
    violationCount,
    maxViolations,
    onClose,
}: ViolationWarningPopupProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300);
        }, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    if (!violation) return null;

    const isNearLimit = violationCount >= maxViolations - 2;
    const isAtLimit = violationCount >= maxViolations;
    const pct = Math.min((violationCount / maxViolations) * 100, 100);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: -30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -30, scale: 0.95 }}
                    transition={{ duration: 0.4, ease }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-sm"
                >
                    <div
                        className={`rounded-2xl border overflow-hidden shadow-2xl ${
                            isNearLimit
                                ? "bg-surface-1 border-red-500/20 shadow-red-500/5"
                                : "bg-surface-1 border-yellow-400/20 shadow-yellow-400/5"
                        }`}
                    >
                        {/* Header */}
                        <div
                            className={`px-4 py-3 flex items-center gap-2.5 ${
                                isNearLimit
                                    ? "bg-red-500/10 border-b border-red-500/15"
                                    : "bg-yellow-400/10 border-b border-yellow-400/15"
                            }`}
                        >
                            <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                    isAtLimit
                                        ? "bg-red-500/20"
                                        : isNearLimit
                                        ? "bg-red-500/15"
                                        : "bg-yellow-400/15"
                                }`}
                            >
                                {isAtLimit ? (
                                    <ShieldAlert size={14} className="text-red-400" />
                                ) : (
                                    <AlertTriangle size={14} className={isNearLimit ? "text-red-400" : "text-yellow-400"} />
                                )}
                            </div>
                            <h3 className="text-xs font-bold text-white flex-1">
                                {isAtLimit
                                    ? "Test Auto-Submitted!"
                                    : "Security Violation Detected"}
                            </h3>
                            {!isAtLimit && (
                                <button
                                    onClick={() => setVisible(false)}
                                    className="p-1 rounded-md text-white/20 hover:text-white/40 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="px-4 py-3">
                            <p className="text-xs text-white/50 mb-3">
                                {violation.description}
                            </p>

                            {/* Counter */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-baseline gap-1">
                                    <span
                                        className={`text-lg font-bold tabular-nums ${
                                            isNearLimit ? "text-red-400" : "text-yellow-400"
                                        }`}
                                    >
                                        {violationCount}
                                    </span>
                                    <span className="text-xs text-white/20">
                                        / {maxViolations}
                                    </span>
                                </div>
                                <span className="text-[10px] text-white/25">
                                    {isAtLimit
                                        ? "Max violations — test submitted"
                                        : `${maxViolations - violationCount} remaining`}
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1.5 rounded-full bg-surface-3/40 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.6, ease }}
                                    className={`h-full rounded-full ${
                                        isNearLimit ? "bg-red-400" : "bg-yellow-400"
                                    }`}
                                />
                            </div>

                            {/* Warning text */}
                            {!isAtLimit && (
                                <p
                                    className={`text-[10px] mt-2 font-medium ${
                                        isNearLimit ? "text-red-400/70" : "text-white/25"
                                    }`}
                                >
                                    {isNearLimit
                                        ? "🔴 FINAL WARNING — one more violation will auto-submit your test!"
                                        : "⚠️ Avoid these actions. Follow test rules to continue."}
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
