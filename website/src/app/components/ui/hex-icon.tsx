import React from "react";
import { cn } from "./utils";

/* ── HexIcon ──────────────────────────────────────────────────────── */
/* Hexagonal SVG container for feature icons                          */

interface HexIconProps {
    children: React.ReactNode;
    size?: "sm" | "md" | "lg";
    className?: string;
}

const sizeMap = {
    sm: { w: "w-9", h: "h-11" },
    md: { w: "w-12", h: "h-14" },
    lg: { w: "w-16", h: "h-[72px]" },
};

export function HexIcon({ children, size = "md", className }: HexIconProps) {
    const s = sizeMap[size];

    return (
        <div
            className={cn(
                "relative",
                s.w,
                s.h,
                "group-hover:scale-110 transition-transform duration-300",
                className,
            )}
        >
            <svg viewBox="0 0 52 60" className="absolute inset-0 w-full h-full">
                <path
                    d="M26 1 L50.5 15 V45 L26 59 L1.5 45 V15 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-yellow-400/20 group-hover:text-yellow-400/50 transition-colors duration-300"
                />
                <path
                    d="M26 1 L50.5 15 V45 L26 59 L1.5 45 V15 Z"
                    className="fill-yellow-400/[0.05] group-hover:fill-yellow-400/[0.15] transition-colors duration-300"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-yellow-400 group-hover:text-yellow-300 transition-colors duration-300">
                {children}
            </div>
        </div>
    );
}
