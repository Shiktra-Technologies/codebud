import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "./utils";
import { HexIcon } from "./hex-icon";

/* ── ErrorState ───────────────────────────────────────────────────── */
/* Designed fallback for API/network failures inside a section — an   */
/* icon, a short message, and a Retry action. Replaces raw error text */
/* or an indefinite spinner with no escape hatch.                     */

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
    retrying?: boolean;
    size?: "sm" | "md";
    className?: string;
}

export function ErrorState({
    message = "Something went wrong while loading this.",
    onRetry,
    retrying = false,
    size = "md",
    className,
}: ErrorStateProps) {
    const compact = size === "sm";

    return (
        <div
            className={cn(
                "group flex flex-col items-center justify-center text-center rounded-xl border border-red-400/15 bg-red-400/[0.03] animate-rise",
                compact ? "py-8 px-4" : "py-12 px-6",
                className,
            )}
        >
            <div className={compact ? "mb-2.5" : "mb-3.5"}>
                <HexIcon size={compact ? "sm" : "md"}>
                    <AlertCircle size={compact ? 14 : 18} className="text-red-400" />
                </HexIcon>
            </div>
            <p
                className={cn(
                    "font-semibold text-white/70",
                    compact ? "text-xs" : "text-sm",
                )}
            >
                Couldn&apos;t load this
            </p>
            <p
                className={cn(
                    "text-white/40 mt-1.5 max-w-[260px] leading-relaxed",
                    compact ? "text-[11px]" : "text-xs",
                )}
            >
                {message}
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    disabled={retrying}
                    className="mt-4 pressable inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs font-semibold text-white/70 hover:bg-white/[0.08] hover:text-white hover:border-white/[0.12] disabled:opacity-50"
                >
                    <RefreshCw
                        size={12}
                        className={retrying ? "animate-spin" : ""}
                    />
                    {retrying ? "Retrying…" : "Retry"}
                </button>
            )}
        </div>
    );
}
