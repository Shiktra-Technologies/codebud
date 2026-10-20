"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { ROUTE_BAR_DELAY_MS, TIMEOUT_MS, useBootActive, useDelayedAffordance } from "@/lib/loading";

/*
 * Route transition bar (§5.2).
 *
 * A 2px brass bar, indeterminate, appearing only after 180ms of pending
 * navigation. §5.2 forbids a full-screen loader on route change, ever. §D17b
 * forbids this bar from appearing while the boot screen is mounted, or on
 * first load — that is boot's job, and only one affordance may be visible at
 * a time.
 *
 * Mounted once in the root layout, and it tracks "pending" itself: a click on
 * an internal link to another page (or back/forward to one) starts it, the
 * new pathname rendering ends it. It used to come from app/loading.tsx, but a
 * root loading boundary wraps every page in Suspense, and that made the
 * server stream each page's markup out of order — the content arrived hidden
 * at the end of the HTML and only showed once the scripts had run.
 */
export default function RouteProgress() {
    const pathname = usePathname();
    const rendered = useRef(pathname);
    const [pending, setPending] = useState(false);
    const boot = useBootActive();

    // The new route has rendered.
    useEffect(() => {
        rendered.current = pathname;
        setPending(false);
    }, [pathname]);

    useEffect(() => {
        let giveUp = 0;
        const start = () => {
            setPending(true);
            window.clearTimeout(giveUp);
            // A navigation that never lands (offline, an error page) must not
            // leave the bar running.
            giveUp = window.setTimeout(() => setPending(false), TIMEOUT_MS);
        };

        // Not `defaultPrevented`: next/link prevents the default itself, then
        // navigates client-side.
        const onClick = (e: MouseEvent) => {
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const a = (e.target as Element | null)?.closest?.("a[href]");
            if (!(a instanceof HTMLAnchorElement)) return;
            if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return;
            const url = new URL(a.href, window.location.href);
            // Other sites, mailto:, and in-page jumps (#how) never go pending.
            if (url.origin !== window.location.origin || url.pathname === rendered.current) return;
            start();
        };
        const onPop = () => {
            if (window.location.pathname !== rendered.current) start();
        };

        document.addEventListener("click", onClick);
        window.addEventListener("popstate", onPop);
        return () => {
            window.clearTimeout(giveUp);
            document.removeEventListener("click", onClick);
            window.removeEventListener("popstate", onPop);
        };
    }, []);

    const { visible } = useDelayedAffordance(pending && !boot, { delay: ROUTE_BAR_DELAY_MS });

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
