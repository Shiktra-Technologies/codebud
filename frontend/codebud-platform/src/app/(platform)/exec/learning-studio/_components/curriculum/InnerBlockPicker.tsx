"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X, Type, Heading, FileText, Video, Code, HelpCircle, Activity, Image as ImageIcon, Map, FolderGit2, Sparkles, AlertTriangle, BookOpen, Flag } from "lucide-react";
import type { LessonBlock } from "@/lib/services/learningStudioService";

interface Props {
    onPick: (type: LessonBlock["type"]) => void;
    compact?: boolean;
}

const BLOCK_TYPES: { type: LessonBlock["type"]; label: string; hint: string; icon: any; color: string }[] = [
    { type: "text", label: "Text", hint: "Basic paragraph", icon: Type, color: "text-white/80" },
    { type: "heading", label: "Heading", hint: "Section title", icon: Heading, color: "text-white/90" },
    { type: "markdown", label: "Markdown", hint: "Rich formatting", icon: FileText, color: "text-zinc-400" },
    { type: "video", label: "Video", hint: "Embed external video", icon: Video, color: "text-blue-400" },
    { type: "code", label: "Code", hint: "Syntax highlighted block", icon: Code, color: "text-yellow-400" },
    { type: "quiz", label: "Quiz", hint: "Multiple choice question", icon: HelpCircle, color: "text-purple-400" },
    { type: "exercise", label: "Exercise", hint: "Practice task", icon: Activity, color: "text-orange-400" },
    { type: "project", label: "Project", hint: "Hands-on assignment", icon: FolderGit2, color: "text-emerald-400" },
    { type: "ai_prompt", label: "AI Prompt", hint: "AI tutor activity", icon: Sparkles, color: "text-sky-400" },
    { type: "callout", label: "Callout", hint: "Important note", icon: AlertTriangle, color: "text-amber-400" },
    { type: "image", label: "Image", hint: "Upload or embed image", icon: ImageIcon, color: "text-pink-400" },
    { type: "diagram", label: "Diagram", hint: "Mermaid or flowchart", icon: Map, color: "text-indigo-400" },
    { type: "resource", label: "Resource", hint: "Downloadable link", icon: BookOpen, color: "text-teal-400" },
    { type: "checkpoint", label: "Checkpoint", hint: "Required milestone", icon: Flag, color: "text-rose-400" },
];

export default function InnerBlockPicker({ onPick, compact }: Props) {
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
        <div className="relative w-full flex justify-center py-2 group/picker" ref={ref}>
            {!open && (
                <div className="absolute inset-0 flex items-center px-4 pointer-events-none opacity-0 group-hover/picker:opacity-100 transition-opacity">
                    <div className="w-full border-t border-white/[0.06] border-dashed" />
                </div>
            )}
            
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`relative z-10 flex items-center gap-1.5 text-[12px] font-medium rounded-full transition-all border ${
                    open ? "px-3 py-1.5 border-yellow-400/30 bg-yellow-400/10 text-yellow-400" :
                    compact
                        ? "px-2 py-1 border-white/[0.06] bg-surface-0 hover:bg-white/[0.06] text-white/55 hover:text-white/85 opacity-0 group-hover/picker:opacity-100"
                        : "px-3 py-1.5 border-white/[0.12] bg-surface-0 hover:bg-white/[0.04] hover:border-yellow-400/30 text-white/70 shadow-sm"
                }`}
            >
                {open ? <X size={12} /> : <Plus size={12} />}
                {!compact || open ? (open ? "Close" : "Add block") : null}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.96 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute z-30 mt-8 top-full w-[320px] rounded-xl border border-white/[0.08] bg-surface-1/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                    >
                        <div className="px-3 py-2 flex items-center justify-between border-b border-white/[0.04]">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-white/40 font-semibold">
                                Select Block Type
                            </p>
                        </div>
                        <div className="p-1 grid grid-cols-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {BLOCK_TYPES.map((b) => {
                                const Icon = b.icon;
                                return (
                                    <button
                                        key={b.type}
                                        type="button"
                                        onClick={() => {
                                            onPick(b.type);
                                            setOpen(false);
                                        }}
                                        className="flex items-start gap-2.5 px-2 py-2 rounded-lg text-left hover:bg-white/[0.04] transition group"
                                    >
                                        <div className="w-7 h-7 rounded border border-white/[0.06] bg-surface-0 flex items-center justify-center shrink-0 group-hover:border-white/[0.15] transition">
                                            <Icon size={14} className={b.color} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[12px] font-medium text-white/85 truncate">
                                                {b.label}
                                            </p>
                                            <p className="text-[10px] text-white/35 truncate">
                                                {b.hint}
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
