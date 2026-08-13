"use client";

import React from "react";
import { GripVertical, Trash2 } from "lucide-react";
import type { LessonBlock } from "@/lib/services/learningStudioService";
import TextareaAutosize from "react-textarea-autosize";

interface BlockRendererProps {
    block: LessonBlock;
    onChange: (patch: Record<string, unknown>) => void;
    onDelete: () => void;
    dragHandleProps?: Record<string, any>;
}

export function BlockRenderer({ block, onChange, onDelete, dragHandleProps }: BlockRendererProps) {
    const renderContent = () => {
        switch (block.type) {
            case "heading":
                return <HeadingBlock data={block.data} onChange={onChange} />;
            case "text":
                return <TextBlock data={block.data} onChange={onChange} />;
            case "video":
                return <VideoBlock data={block.data} onChange={onChange} />;
            case "code":
                return <CodeBlock data={block.data} onChange={onChange} />;
            case "quiz":
                return <QuizBlock data={block.data} onChange={onChange} />;
            case "markdown":
                return <MarkdownBlock data={block.data} onChange={onChange} />;
            default:
                return (
                    <div className="p-4 border border-white/10 border-dashed rounded-lg bg-white/[0.02]">
                        <p className="text-xs text-white/50 mb-2 uppercase tracking-widest font-semibold">{block.type} Block</p>
                        <p className="text-sm text-white/30 italic">Editor for this block type is under construction.</p>
                    </div>
                );
        }
    };

    return (
        <div className="group relative flex gap-3 -ml-12 pl-2 pr-4 py-1 rounded-xl hover:bg-white/[0.02] transition">
            <div className="w-10 pt-2 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    type="button"
                    className="p-1 text-white/30 hover:text-white/80 transition rounded cursor-grab active:cursor-grabbing"
                    {...dragHandleProps}
                >
                    <GripVertical size={16} />
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    className="p-1 mt-1 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition rounded"
                >
                    <Trash2 size={14} />
                </button>
            </div>
            <div className="flex-1 min-w-0">{renderContent()}</div>
        </div>
    );
}

function HeadingBlock({ data, onChange }: { data: Record<string, any>; onChange: (p: any) => void }) {
    return (
        <TextareaAutosize
            placeholder="Heading 1"
            className="w-full bg-transparent resize-none outline-none text-3xl font-bold text-white/90 placeholder:text-white/20 py-2"
            value={data.text || ""}
            onChange={(e: any) => onChange({ text: e.target.value })}
        />
    );
}

function TextBlock({ data, onChange }: { data: Record<string, any>; onChange: (p: any) => void }) {
    return (
        <TextareaAutosize
            placeholder="Start typing..."
            className="w-full bg-transparent resize-none outline-none text-[15px] leading-relaxed text-white/80 placeholder:text-white/30 py-2"
            value={data.text || ""}
            onChange={(e: any) => onChange({ text: e.target.value })}
        />
    );
}

function MarkdownBlock({ data, onChange }: { data: Record<string, any>; onChange: (p: any) => void }) {
    return (
        <div className="relative border border-white/[0.06] rounded-xl bg-surface-0 overflow-hidden group/md">
            <div className="absolute top-2 right-2 px-2 py-1 bg-surface-1 rounded border border-white/5 text-[10px] text-white/30 font-medium uppercase tracking-wider select-none">
                Markdown
            </div>
            <TextareaAutosize
                placeholder="Write markdown content here..."
                className="w-full bg-transparent resize-none outline-none text-sm font-mono text-zinc-300 placeholder:text-white/20 p-4 min-h-[100px]"
                value={data.text || ""}
                onChange={(e: any) => onChange({ text: e.target.value })}
            />
        </div>
    );
}

function VideoBlock({ data, onChange }: { data: Record<string, any>; onChange: (p: any) => void }) {
    return (
        <div className="border border-white/[0.06] rounded-xl bg-surface-0 p-4">
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-3">Video Embed</p>
            <input
                type="text"
                placeholder="Paste YouTube or Vimeo URL..."
                className="w-full bg-surface-1 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/30 outline-none focus:border-yellow-400/50 transition"
                value={data.url || ""}
                onChange={(e: any) => onChange({ url: e.target.value })}
            />
            {data.url && (
                <div className="mt-4 aspect-video rounded-lg bg-surface-1 border border-white/[0.04] flex items-center justify-center overflow-hidden">
                    {data.url.includes("youtube") || data.url.includes("youtu.be") ? (
                        <iframe 
                            src={data.url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")} 
                            className="w-full h-full" 
                            allowFullScreen 
                        />
                    ) : (
                        <p className="text-xs text-white/40">Video preview available for YouTube URLs</p>
                    )}
                </div>
            )}
        </div>
    );
}

function CodeBlock({ data, onChange }: { data: Record<string, any>; onChange: (p: any) => void }) {
    return (
        <div className="border border-white/[0.06] rounded-xl bg-[#0d0d0d] overflow-hidden">
            <div className="flex items-center px-3 py-2 border-b border-white/[0.04] bg-[#1a1a1a]">
                <input 
                    type="text"
                    placeholder="Language (e.g. typescript, python)"
                    className="bg-transparent outline-none text-xs text-white/60 font-mono w-[150px] placeholder:text-white/20"
                    value={data.language || ""}
                    onChange={(e: any) => onChange({ language: e.target.value })}
                />
            </div>
            <TextareaAutosize
                placeholder="// Write code here..."
                className="w-full bg-transparent resize-none outline-none text-[13px] font-mono text-zinc-300 placeholder:text-white/20 p-4 min-h-[100px]"
                value={data.code || ""}
                onChange={(e: any) => onChange({ code: e.target.value })}
                spellCheck={false}
            />
        </div>
    );
}

function QuizBlock({ data, onChange }: { data: Record<string, any>; onChange: (p: any) => void }) {
    const quizId = React.useId();
    const options = Array.isArray(data.options) ? data.options : ["", ""];
    
    const updateOption = (idx: number, val: string) => {
        const next = [...options];
        next[idx] = val;
        onChange({ options: next });
    };

    const addOption = () => onChange({ options: [...options, ""] });

    return (
        <div className="border border-white/[0.06] rounded-xl bg-surface-0 p-5">
            <p className="text-[11px] font-semibold text-purple-400/80 uppercase tracking-wider mb-4 flex items-center gap-2">
                Quiz Question
            </p>
            <TextareaAutosize
                placeholder="What is your question?"
                className="w-full bg-transparent resize-none outline-none text-base font-medium text-white/90 placeholder:text-white/30 mb-5"
                value={data.question || ""}
                onChange={(e: any) => onChange({ question: e.target.value })}
            />
            <div className="space-y-2">
                {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                        <input 
                            type="radio" 
                            name={`quiz-${quizId}`} 
                            checked={data.correctIndex === idx}
                            onChange={() => onChange({ correctIndex: idx })}
                            className="w-4 h-4 accent-purple-500"
                        />
                        <input
                            type="text"
                            placeholder={`Option ${idx + 1}`}
                            className="flex-1 bg-surface-1 border border-white/[0.04] hover:border-white/[0.1] focus:border-purple-500/50 rounded-lg px-3 py-2 text-sm text-white/80 outline-none transition"
                            value={opt}
                            onChange={(e: any) => updateOption(idx, e.target.value)}
                        />
                    </div>
                ))}
            </div>
            <button
                type="button"
                onClick={addOption}
                className="mt-3 text-xs font-medium text-purple-400 hover:text-purple-300 transition"
            >
                + Add Option
            </button>
        </div>
    );
}
