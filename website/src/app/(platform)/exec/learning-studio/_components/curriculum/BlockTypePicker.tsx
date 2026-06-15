"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X } from "lucide-react";
import type { LessonKind } from "@/lib/services/learningStudioService";
import { KIND_META, KIND_ORDER } from "./blockKindMeta";

interface Props {
    onPick: (kind: LessonKind) => void;
    compact?: boolean;
    label?: string;
}

/**
 * Inline kind picker. Stays compact until clicked; expands to show the full
 * grid of 11 kinds with hover hints. No modal — matches the "inline
 * authoring" spec. Closes on selection or outside click.
 */
export default function BlockTypePicker({ onPick, compact, label }: Props) {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [open]);

    return (
        <div className="relative inline-block" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 text-[12px] font-medium rounded-lg transition border ${
                    compact
                        ? "px-2 py-1 border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-white/55 hover:text-white/85"
                        : "px-3 py-1.5 border-dashed border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] hover:border-yellow-400/30 text-white/70"
                }`}
            >
                <Plus size={11} />
                {label ?? "Add block"}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute z-30 mt-1.5 right-0 w-[280px] rounded-xl border border-white/[0.08] bg-surface-1/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                    >
                        <div className="px-3 py-2 flex items-center justify-between border-b border-white/[0.04]">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-white/35 font-semibold">
                                Add block
                            </p>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="p-0.5 text-white/30 hover:text-white/80 rounded transition"
                                aria-label="Close"
                            >
                                <X size={11} />
                            </button>
                        </div>
                        <div className="p-1 grid grid-cols-1">
                            {KIND_ORDER.map((kind) => {
                                const meta = KIND_META[kind];
                                const Icon = meta.icon;
                                return (
                                    <button
                                        key={kind}
                                        type="button"
                                        onClick={() => {
                                            onPick(kind);
                                            setOpen(false);
                                        }}
                                        className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-white/[0.03] transition"
                                    >
                                        <div className={`w-7 h-7 rounded-md ${meta.accentBg} border ${meta.accentBorder} flex items-center justify-center shrink-0`}>
                                            <Icon size={13} className={meta.accent} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[12px] font-medium text-white/85 truncate">
                                                {meta.label}
                                            </p>
                                            <p className="text-[10px] text-white/35 truncate">
                                                {meta.hint}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
