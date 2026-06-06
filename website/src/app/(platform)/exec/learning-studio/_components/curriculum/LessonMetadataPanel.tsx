"use client";

import React from "react";
import { Clock, BarChart, Hash, Sparkles } from "lucide-react";
import type { Lesson } from "@/lib/services/learningStudioService";
import type { CurriculumAction } from "./curriculumStore";

interface Props {
    lesson: Lesson;
    moduleId: string;
    dispatch: React.Dispatch<CurriculumAction>;
}

export default function LessonMetadataPanel({ lesson, moduleId, dispatch }: Props) {
    return (
        <div className="w-[300px] shrink-0 border-l border-white/[0.04] bg-[#0d0d0d] overflow-y-auto custom-scrollbar flex flex-col">
            <div className="p-4 border-b border-white/[0.04]">
                <h3 className="text-[11px] uppercase tracking-wider font-semibold text-white/50 mb-1">
                    Lesson Properties
                </h3>
            </div>

            <div className="p-4 space-y-6">
                <div className="space-y-2">
                    <label className="text-[12px] font-medium text-white/70 flex items-center gap-1.5">
                        <Clock size={12} className="text-white/40" />
                        Estimated Duration
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            className="w-full bg-surface-1 border border-white/[0.06] rounded-lg px-3 py-1.5 text-sm text-white/90 outline-none focus:border-yellow-400/50 transition"
                            value={lesson.estimated_duration_minutes || 0}
                            onChange={(e) =>
                                dispatch({
                                    type: "update_lesson",
                                    moduleId,
                                    lessonId: lesson.id,
                                    patch: { estimated_duration_minutes: parseInt(e.target.value) || 0 },
                                })
                            }
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30 pointer-events-none">
                            min
                        </span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[12px] font-medium text-white/70 flex items-center gap-1.5">
                        <BarChart size={12} className="text-white/40" />
                        Difficulty Level
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        className="w-full accent-yellow-400"
                        value={lesson.difficulty}
                        onChange={(e) =>
                            dispatch({
                                type: "update_lesson",
                                moduleId,
                                lessonId: lesson.id,
                                patch: { difficulty: parseFloat(e.target.value) },
                            })
                        }
                    />
                    <div className="flex justify-between text-[10px] text-white/40 font-medium px-1">
                        <span>Beginner</span>
                        <span>Expert</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[12px] font-medium text-white/70 flex items-center gap-1.5">
                        <Hash size={12} className="text-white/40" />
                        Target Skills
                    </label>
                    <div className="border border-white/[0.06] rounded-lg bg-surface-1 p-3">
                        {lesson.skill_slugs.length === 0 ? (
                            <p className="text-xs text-white/40 italic">No skills targeted yet.</p>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {lesson.skill_slugs.map((slug) => (
                                    <span key={slug} className="px-2 py-0.5 rounded text-[10px] bg-white/[0.04] border border-white/[0.08] text-white/70">
                                        {slug}
                                    </span>
                                ))}
                            </div>
                        )}
                        <button className="mt-2 text-[11px] text-yellow-400 hover:text-yellow-300 font-medium transition">
                            + Add Skill
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[12px] font-medium text-white/70 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-amber-400/80" />
                        AI Generation
                    </label>
                    <button className="w-full py-2 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/20 rounded-lg text-[12px] font-semibold transition">
                        Generate Content
                    </button>
                    <p className="text-[10px] text-white/30 leading-snug">
                        Use AI to draft an initial version of this lesson based on the curriculum structure.
                    </p>
                </div>
            </div>
        </div>
    );
}
