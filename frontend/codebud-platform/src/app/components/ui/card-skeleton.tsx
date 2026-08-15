import React from "react";
import { Skeleton } from "./skeleton";
import { cn } from "./utils";

/* ── Loading skeletons that mirror destination content shapes ───────── */
/* One consolidated pattern used for course/job/card grids and list     */
/* rows, replacing ad-hoc spinner + label loading states.               */

export function GridCardSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "rounded-xl border border-white/[0.06] bg-surface-2/40 p-5 space-y-4 animate-rise",
                className,
            )}
        >
            <div className="flex items-start justify-between">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-14 rounded" />
            </div>
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-2/3 rounded" />
            <Skeleton className="h-9 w-full rounded-lg" />
        </div>
    );
}

export function CardSkeletonGrid({
    count = 3,
    className,
}: {
    count?: number;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
                className,
            )}
        >
            {Array.from({ length: count }).map((_, i) => (
                <GridCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function ListRowSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "flex items-center gap-4 p-4 rounded-xl bg-surface-2/30 border border-white/[0.04] animate-rise",
                className,
            )}
        >
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-1/3 rounded" />
                <Skeleton className="h-2.5 w-1/5 rounded" />
            </div>
            <Skeleton className="h-5 w-14 rounded shrink-0" />
        </div>
    );
}

export function ListSkeleton({
    count = 4,
    className,
}: {
    count?: number;
    className?: string;
}) {
    return (
        <div className={cn("space-y-2", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <ListRowSkeleton key={i} />
            ))}
        </div>
    );
}

export function StatTileSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "rounded-xl border border-white/[0.06] bg-surface-2/40 p-5 space-y-4 animate-rise",
                className,
            )}
        >
            <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-12 rounded" />
        </div>
    );
}
