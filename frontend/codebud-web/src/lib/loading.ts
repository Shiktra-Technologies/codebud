"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/*
 * Shared loading-affordance rules (§D17).
 *
 * One delay rule across boot screen, route bar and every skeleton:
 *   0–200ms   show nothing (the container still reserves its space — §D17a)
 *   200ms–8s  show the affordance, then hold a 350ms minimum
 *   past 8s   swap to the error/timeout state
 *
 * The route bar keeps its own 180ms threshold from §5.2 — already inside the
 * band, and a second number isn't worth the distinction.
 */

export const DELAY_MS = 200;
export const MIN_HOLD_MS = 350;
export const TIMEOUT_MS = 8000;
export const ROUTE_BAR_DELAY_MS = 180;

/*
 * §D17b — exactly one loading affordance visible at a time. A module-level
 * store, because the route bar lives in the root layout (above BootSequence)
 * while skeletons live deep in the tree; a context can't span both without
 * threading a provider through everything.
 */
let bootActive = false;
const subscribers = new Set<() => void>();

function subscribe(fn: () => void) {
    subscribers.add(fn);
    return () => { subscribers.delete(fn); };
}

/** Called by BootSequence while the boot screen is mounted. */
export function setBootActive(next: boolean) {
    if (bootActive === next) return;
    bootActive = next;
    subscribers.forEach((fn) => fn());
}

/** True while the boot screen owns the screen. Suppresses route bar + skeletons. */
export function useBootActive(): boolean {
    return useSyncExternalStore(subscribe, () => bootActive, () => false);
}

/**
 * §D17 delay/hold/timeout for any loading affordance.
 * `active` is whether the underlying work is still pending.
 */
export function useDelayedAffordance(
    active: boolean,
    opts?: { delay?: number; minHold?: number; timeout?: number },
): { visible: boolean; timedOut: boolean } {
    const delay = opts?.delay ?? DELAY_MS;
    const minHold = opts?.minHold ?? MIN_HOLD_MS;
    const timeout = opts?.timeout ?? TIMEOUT_MS;

    const [visible, setVisible] = useState(false);
    const [timedOut, setTimedOut] = useState(false);
    const shownAtRef = useRef<number | null>(null);
    const visibleRef = useRef(false);
    visibleRef.current = visible;

    useEffect(() => {
        if (active) {
            setTimedOut(false);
            const show = window.setTimeout(() => {
                shownAtRef.current = performance.now();
                setVisible(true);
            }, delay);
            const fail = window.setTimeout(() => setTimedOut(true), timeout);
            return () => { window.clearTimeout(show); window.clearTimeout(fail); };
        }

        // Work finished. If nothing was ever shown, there is no ceremony to honour.
        if (!visibleRef.current) {
            shownAtRef.current = null;
            return;
        }
        const elapsed = performance.now() - (shownAtRef.current ?? 0);
        const hide = window.setTimeout(() => {
            setVisible(false);
            shownAtRef.current = null;
        }, Math.max(0, minHold - elapsed));
        return () => window.clearTimeout(hide);
    }, [active, delay, minHold, timeout]);

    return { visible, timedOut };
}
