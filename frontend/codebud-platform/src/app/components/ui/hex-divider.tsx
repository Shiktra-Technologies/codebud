import React from "react";
import { cn } from "./utils";

/* ── HexDivider ───────────────────────────────────────────────────── */
/* Gradient line with centered hex — used as section separators       */

interface HexDividerProps {
    className?: string;
}

export function HexDivider({ className }: HexDividerProps) {
    return (
        <div className={cn("flex items-center justify-center gap-3 my-2", className)}>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent" />
            <svg
                width="14"
                height="16"
                viewBox="0 0 14 16"
                className="text-yellow-400/20"
            >
                <path
                    d="M7 0.5 L13.3 4.25 V11.75 L7 15.5 L0.7 11.75 V4.25 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                />
            </svg>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent" />
        </div>
    );
}
