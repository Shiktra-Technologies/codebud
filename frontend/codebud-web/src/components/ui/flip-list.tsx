"use client";

import * as React from "react";

/*
 * FlipList — §D12b / §D20c. Items move on reorder, they don't teleport.
 *
 * Matters most under §D5: rows are separated by border and rhythm alone (fills
 * are 1.05:1), so a teleporting re-sort is genuinely disorienting.
 *
 * Constraints (§D20c):
 *   1. Position only — translate, never width/height. Size animation reads
 *      elastic and is expensive.
 *   2. Never on initial mount — FLIP fires on reorder / filter / removal only.
 *   3. Reduced motion snaps; above ~50 tracked items it skips entirely rather
 *      than degrading.
 *
 * Each child MUST carry a stable `key`. Children render in normal flow; FlipList
 * only measures their positions and plays a transform to reconcile the change.
 */

const MAX_ITEMS = 50;

export function FlipList({
    children,
    className,
    duration = 380,
    as: Tag = "div",
}: {
    children: React.ReactNode;
    className?: string;
    duration?: number;
    as?: React.ElementType;
}) {
    const containerRef = React.useRef<HTMLElement | null>(null);
    const prevRects = React.useRef<Map<string, DOMRect>>(new Map());
    const mounted = React.useRef(false);

    const reduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const keys = React.Children.toArray(children)
        .map((c) => (React.isValidElement(c) ? c.key : null))
        .filter(Boolean) as string[];

    React.useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const items = new Map<string, HTMLElement>();
        el.querySelectorAll<HTMLElement>("[data-flip-key]").forEach((n) => {
            const k = n.dataset.flipKey;
            if (k) items.set(k, n);
        });

        const next = new Map<string, DOMRect>();
        items.forEach((n, k) => next.set(k, n.getBoundingClientRect()));

        // (2) never on initial mount; (3) skip large lists and reduced motion
        const skip = !mounted.current || reduced || items.size > MAX_ITEMS;
        if (!skip) {
            items.forEach((node, k) => {
                const first = prevRects.current.get(k);
                const last = next.get(k);
                if (!first || !last) return; // entering item — no move to play
                const dx = first.left - last.left;
                const dy = first.top - last.top;
                if (dx === 0 && dy === 0) return;
                // (1) position only — translate from old to new
                node.animate(
                    [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
                    { duration, easing: "cubic-bezier(.2,.8,.2,1)" },
                );
            });
        }

        prevRects.current = next;
        mounted.current = true;
    }, [keys.join("|"), duration, reduced]);

    return (
        <Tag ref={containerRef as React.Ref<HTMLElement>} className={className} data-slot="flip-list">
            {React.Children.map(children, (child) => {
                if (!React.isValidElement(child)) return child;
                const existing = (child.props as { className?: string }).className;
                return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
                    "data-flip-key": String(child.key),
                    className: existing,
                });
            })}
        </Tag>
    );
}
