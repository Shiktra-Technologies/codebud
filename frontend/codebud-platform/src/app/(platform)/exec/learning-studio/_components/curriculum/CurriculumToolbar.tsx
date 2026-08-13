"use client";

import React from "react";
import { Plus, Layers, ListTree, GitBranch } from "lucide-react";

interface Props {
    moduleCount: number;
    lessonCount: number;
    totalMinutes: number;
    onAddModule: () => void;
    onToggleAllCollapsed?: () => void;
    flowMode: boolean;
    onToggleFlowMode: () => void;
}

export default function CurriculumToolbar({
    moduleCount,
    lessonCount,
    totalMinutes,
    onAddModule,
    flowMode,
    onToggleFlowMode,
}: Props) {
    return (
        <div className="flex items-center gap-2 px-1 pb-3 mb-1 border-b border-white/[0.04]">
            <div className="flex items-center gap-3">
                <Stat icon={Layers}   label="modules" value={moduleCount} />
                <Stat icon={ListTree} label="blocks"  value={lessonCount} />
                <Stat label="total"   value={formatTotal(totalMinutes)} />
            </div>

            <div className="ml-auto flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={onToggleFlowMode}
                    title={flowMode ? "Show outline" : "Visualize learning flow (preview)"}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition border ${
                        flowMode
                            ? "bg-yellow-400/10 text-yellow-200 border-yellow-400/30"
                            : "bg-white/[0.02] text-white/55 hover:text-white/85 border-white/[0.06]"
                    }`}
                >
                    <GitBranch size={11} />
                    Flow
                </button>

                <button
                    type="button"
                    onClick={onAddModule}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold bg-yellow-400 text-black hover:brightness-110 active:scale-[0.98] transition shadow-[0_0_18px_rgba(255,193,7,0.2)]"
                >
                    <Plus size={12} />
                    Add module
                </button>
            </div>
        </div>
    );
}

function Stat({
    icon: Icon,
    label,
    value,
}: {
    icon?: React.ElementType;
    label: string;
    value: number | string;
}) {
    return (
        <div className="flex items-center gap-1.5 text-[11px] text-white/45">
            {Icon && <Icon size={10} className="text-white/30" />}
            <span className="text-white/75 font-semibold">{value}</span>
            <span>{label}</span>
        </div>
    );
}

function formatTotal(minutes: number): string {
    if (!minutes) return "—";
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
