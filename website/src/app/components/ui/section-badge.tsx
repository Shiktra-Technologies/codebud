import React from "react";
import { cn } from "./utils";

/* ── SectionBadge ─────────────────────────────────────────────────── */
/* Pill badge with hex icon used at the top of each section heading */

interface SectionBadgeProps {
    children: React.ReactNode;
    className?: string;
}

export function SectionBadge({ children, className }: SectionBadgeProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-400/15 bg-yellow-400/[0.04] backdrop-blur-sm",
                className,
            )}
        >
            <svg
                width="10"
                height="12"
                viewBox="0 0 10 12"
                className="text-yellow-400/60"
            >
                <path
                    d="M5 0.5 L9.5 3 V9 L5 11.5 L0.5 9 V3 Z"
                    fill="currentColor"
                />
            </svg>
            <span className="text-[11px] font-medium text-yellow-400/70 tracking-widest uppercase">
                {children}
            </span>
        </div>
    );
}
