import React from "react";
import Link from "next/link";
import { cn } from "./utils";
import { HexIcon } from "./hex-icon";

/* ── EmptyState ───────────────────────────────────────────────────── */
/* Consistent empty-state treatment: hex icon + title + description   */
/* + optional CTA. Used across dashboard widgets, lists, and grids.   */

interface EmptyStateAction {
    label: string;
    href?: string;
    onClick?: () => void;
}

interface EmptyStateProps {
    icon: React.ElementType;
    title: string;
    description?: string;
    action?: EmptyStateAction;
    size?: "sm" | "md";
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    size = "md",
    className,
}: EmptyStateProps) {
    const compact = size === "sm";

    return (
        <div
            className={cn(
                "group flex flex-col items-center justify-center text-center animate-rise",
                compact ? "py-8 px-4" : "py-12 px-6",
                className,
            )}
        >
            <div className={compact ? "mb-2.5" : "mb-3.5"}>
                <HexIcon size={compact ? "sm" : "md"}>
                    <Icon size={compact ? 14 : 18} />
                </HexIcon>
            </div>
            <p
                className={cn(
                    "font-semibold text-white/70",
                    compact ? "text-xs" : "text-sm",
                )}
            >
                {title}
            </p>
            {description && (
                <p
                    className={cn(
                        "text-white/40 mt-1.5 max-w-[240px] leading-relaxed",
                        compact ? "text-[11px]" : "text-xs",
                    )}
                >
                    {description}
                </p>
            )}
            {action &&
                (action.href ? (
                    <Link
                        href={action.href}
                        className="mt-4 pressable inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-xs font-semibold text-yellow-400 hover:bg-yellow-400/15 hover:border-yellow-400/30"
                    >
                        {action.label}
                    </Link>
                ) : (
                    <button
                        onClick={action.onClick}
                        className="mt-4 pressable inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-xs font-semibold text-yellow-400 hover:bg-yellow-400/15 hover:border-yellow-400/30"
                    >
                        {action.label}
                    </button>
                ))}
        </div>
    );
}
