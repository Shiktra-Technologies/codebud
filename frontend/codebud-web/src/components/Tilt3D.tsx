"use client";

/*
 * Tilt3D — pointer-tracked 3D tilt for a card.
 *
 * The card rotates toward the pointer on two axes and lifts toward the viewer,
 * with a specular band riding the pointer so the rotation reads as a lit
 * surface rather than a bare transform. Geometry and easing live in theme.css
 * (`.tilt-stage` / `.tilt-3d` / `.tilt-sheen`); this only writes the angles.
 *
 * ANGLES GO INTO CUSTOM PROPERTIES, not into `transform`. Writing the whole
 * transform string per frame means the browser re-parses it every move; writing
 * three numbers into `--tilt-*` leaves the declaration itself untouched.
 *
 * THE WRITES ARE rAF-COALESCED. `pointermove` fires faster than the compositor
 * paints on a high-polling mouse, so the handler stores the event position and
 * a single frame callback does the style write — at most one per frame however
 * many events arrive.
 *
 * OPT-OUT is `data-honey="off"` on <html>, matching the honey layer, and NOT
 * prefers-reduced-motion — see the note above `.tilt-3d` in theme.css.
 *
 * The root carries both of honeycomb-cursor.css's hooks: `.tilt-3d` makes it a
 * tracked surface (the honey drip off its bottom edge), and `.honey-surface`
 * additionally opts its heading into the brass hover flip — the drip selector
 * accepts either, but the title rule only matches `.honey-surface`.
 */

import React, { useCallback, useEffect, useRef } from "react";

interface Tilt3DProps {
    children: React.ReactNode;
    /** Max rotation in degrees at the card's edge. */
    max?: number;
    /** How far the card lifts toward the viewer while tracked, in px. */
    lift?: number;
    /** Classes for the tilting element itself (the visible card). */
    className?: string;
    /** Classes for the perspective wrapper. */
    stageClassName?: string;
}

export function Tilt3D({
    children,
    max = 7,
    lift = 14,
    className = "",
    stageClassName = "",
}: Tilt3DProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const frame = useRef<number | null>(null);
    const pending = useRef<{ x: number; y: number } | null>(null);

    const apply = useCallback(() => {
        frame.current = null;
        const el = cardRef.current;
        const point = pending.current;
        if (!el || !point) return;

        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        // -0.5 … 0.5 from the card's centre.
        const px = (point.x - rect.left) / rect.width - 0.5;
        const py = (point.y - rect.top) / rect.height - 0.5;

        // Pointer below centre tips the near edge toward you, so rotateX is
        // negated against the Y offset.
        el.style.setProperty("--tilt-x", `${(-py * max * 2).toFixed(2)}deg`);
        el.style.setProperty("--tilt-y", `${(px * max * 2).toFixed(2)}deg`);
        el.style.setProperty("--tilt-z", `${lift}px`);
        el.style.setProperty("--sheen-x", `${((px + 0.5) * 100).toFixed(1)}%`);
        el.style.setProperty("--sheen-y", `${((py + 0.5) * 100).toFixed(1)}%`);
    }, [max, lift]);

    const handleMove = useCallback(
        (e: React.PointerEvent) => {
            if (document.documentElement.dataset.honey === "off") return;
            pending.current = { x: e.clientX, y: e.clientY };
            cardRef.current?.setAttribute("data-tilting", "true");
            if (frame.current === null) frame.current = requestAnimationFrame(apply);
        },
        [apply],
    );

    const handleLeave = useCallback(() => {
        const el = cardRef.current;
        if (!el) return;
        if (frame.current !== null) {
            cancelAnimationFrame(frame.current);
            frame.current = null;
        }
        pending.current = null;
        // Drop the flag first so the eased transition applies to the way back.
        el.removeAttribute("data-tilting");
        el.style.setProperty("--tilt-x", "0deg");
        el.style.setProperty("--tilt-y", "0deg");
        el.style.setProperty("--tilt-z", "0px");
    }, []);

    useEffect(
        () => () => {
            if (frame.current !== null) cancelAnimationFrame(frame.current);
        },
        [],
    );

    return (
        <div className={`tilt-stage ${stageClassName}`}>
            <div
                ref={cardRef}
                onPointerMove={handleMove}
                onPointerLeave={handleLeave}
                className={`tilt-3d honey-surface ${className}`}
            >
                <div className="tilt-sheen" aria-hidden="true" />
                {children}
            </div>
        </div>
    );
}
