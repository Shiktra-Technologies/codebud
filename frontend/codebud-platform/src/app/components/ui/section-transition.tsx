import React from "react";
import { cn } from "./utils";

/* ── SectionTransition ────────────────────────────────────────────── */
/* Gradient fade between sections with optional hex divider           */

interface SectionTransitionProps {
    direction?: "down" | "up";
    className?: string;
}

export function SectionTransition({
    direction = "down",
    className,
}: SectionTransitionProps) {
    return (
        <div
            className={cn(
                "relative h-24 pointer-events-none -my-12 z-20",
                className,
            )}
        >
            <div
                className="absolute inset-0"
                style={{
                    background:
                        direction === "down"
                            ? "linear-gradient(to bottom, var(--surface-0), transparent 30%, transparent 70%, var(--surface-0))"
                            : "linear-gradient(to top, var(--surface-0), transparent 30%, transparent 70%, var(--surface-0))",
                }}
            />
        </div>
    );
}
