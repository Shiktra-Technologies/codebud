"use client";

import { ROUTE_BAR_DELAY_MS, useBootActive, useDelayedAffordance } from "@/lib/loading";

/*
 * Route transition bar (§5.2).
 *
 * A 2px brass bar, indeterminate, appearing only after 180ms of pending
 * navigation. Rendered from `app/loading.tsx`, which App Router mounts exactly
 * while a route segment is pending — so "pending" needs no manual tracking.
 *
 * §5.2 forbids a full-screen loader on route change, ever. §D17b forbids this
 * bar from appearing while the boot screen is mounted, or on first load — that
 * is boot's job, and only one affordance may be visible at a time.
 */
export default function RouteProgress() {
    const boot = useBootActive();
    const { visible } = useDelayedAffordance(!boot, { delay: ROUTE_BAR_DELAY_MS });

    if (boot || !visible) return null;

    return (
        <div
            role="status"
            aria-label="Loading page"
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                zIndex: 300,
                pointerEvents: "none",
                overflow: "hidden",
            }}
        >
            <div className="mh-routebar" style={{ height: "100%", background: "var(--brass-500)" }} />
        </div>
    );
}
