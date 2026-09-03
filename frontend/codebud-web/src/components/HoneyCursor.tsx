"use client";

/*
 * Honey cursor (§5.5) — the pointer as a body of liquid brass.
 *
 * Four blobs chase the pointer at decreasing speeds. An SVG goo filter merges
 * them, so the gaps between them render as a single stretching strand rather
 * than four circles in a row. The head deforms with velocity — stretched along
 * the direction of travel, squashed across it — which is the part that reads as
 * liquid rather than as a dot with a tail. Clicking throws droplets on an arc,
 * leaves a smear, and pushes out a ring.
 *
 * WHY THIS RUNS OUTSIDE REACT
 * The blobs move every frame. Routing that through setState would re-render a
 * component 60 times a second and put the reconciler on the critical path of
 * pointer movement. Positions are written straight to the DOM as transforms
 * inside one rAF loop: no layout, no React, compositor only.
 *
 * MOTION PREFERENCE — deliberate deviation
 * This does NOT check `prefers-reduced-motion`. It used to, and on a machine
 * with that preference set the whole layer silently never mounted. The effect
 * is the product's signature and was asked for explicitly, so the opt-out
 * moved to `document.documentElement.dataset.honey = "off"`, which unmounts
 * the layer and (via theme.css) stops every honey animation. To restore
 * preference-driven behaviour, re-add the matchMedia check below and delete
 * the re-grant block at the end of theme.css.
 *
 * STILL GATED — coarse pointers. There is no cursor to replace on touch.
 *
 * ACCESSIBILITY
 * The native cursor is hidden only where the blob stands in for it; text
 * inputs keep their I-beam (theme.css). Nothing here is focusable or
 * announced — it is decoration over a UI that works identically without it.
 */

import { useEffect, useRef } from "react";

/*
 * How hard each segment chases the pointer per frame.
 *
 * ONE segment: the trail is gone. It used to be [0.92, 0.62, 0.42, 0.28] —
 * four bodies whose spacing the goo filter rendered as a strand of honey. The
 * loop below is still written for N segments, so restoring it is a matter of
 * adding eases back to this array and the matching .honey-blob-N sizes in
 * theme.css; nothing else assumes a count of one.
 */
const SEGMENT_EASE = [0.92];
const SEGMENTS = SEGMENT_EASE.length;

/** Velocity → deformation. Speed is px/frame; the caps stop a fast flick from
 *  turning the head into a needle. */
const STRETCH_PER_SPEED = 0.05;
const MAX_STRETCH = 1.7;
/** How quickly the measured speed decays when the pointer stops — this is what
 *  makes the blob recover its round shape instead of snapping back. Faster
 *  tracking closes the gap sooner, so the decay has to be quicker too or the
 *  head stays stretched after the pointer has already stopped. */
const SPEED_DECAY = 0.7;

const DROPLETS_PER_CLICK = 9;
const DROPLET_MIN_DISTANCE = 30;
const DROPLET_MAX_DISTANCE = 78;
const DROPLET_MIN_SIZE = 5;
const DROPLET_MAX_SIZE = 12;
/** Downward drift added to the end of each droplet's arc, so the splash falls
 *  rather than expanding as a flat ring. */
const DROPLET_GRAVITY = 26;

/** Backstop only — droplets remove themselves on animationend. */
const DROPLET_LIFETIME_MS = 1400;

/**
 * Half-width of the box the goo filter runs over.
 *
 * PERFORMANCE — this is the single most expensive thing in the effect. The
 * filter used to sit on a `position: fixed; inset: 0` layer, so every frame the
 * compositor rasterised a VIEWPORT-sized surface, blurred it, and ran a colour
 * matrix over it — roughly 1.8M pixels per frame on a 1920x935 screen for a few
 * small blobs. Confining it to a box that travels with the pointer cuts that to
 * about 176k pixels, an order of magnitude less work per frame, with no visual
 * difference because nothing outside the box was ever painted anyway.
 */
const GOO_HALF = 210;
/** Same idea for a click: the splash gets its own short-lived filtered box. */
const SPLASH_HALF = 190;
/**
 * Ceiling on how far a segment may sit from the head, so nothing can leave the
 * filtered box and clip at its edge. With a single segment this never binds —
 * it is the guard that made a multi-segment trail safe, kept for when one comes
 * back.
 */
const MAX_TRAIL = GOO_HALF - 40;

const HOT_SELECTOR =
    'a, button, [role="button"], input, select, textarea, [tabindex]:not([tabindex="-1"])';
/*
 * Surfaces the pointer is tracked across. `.no-tilt` opts an element out of
 * tracking entirely; `.no-honey` (theme.css) switches the flood off, and a
 * surface with no pool has nothing to aim the hotspot at — tracking it would
 * write two custom properties per frame onto an element that ignores them.
 */
const SURFACE_SELECTOR =
    '.honey-surface:not(.no-tilt):not(.no-honey), [data-slot="card"]:not(.no-tilt):not(.no-honey), .tilt-3d:not(.no-tilt):not(.no-honey)';

/**
 * Where the blob gets out of the way.
 *
 * Anything you type into or select text in: form fields, the code editor, and
 * the console/output panes. A caret is information the blob cannot convey, and
 * a fat drop of honey sitting over the insertion point makes a field feel
 * broken — so the cursor layer hides and the native caret comes back
 * (theme.css lifts `cursor: none` for the same set).
 */
const TEXT_SELECTOR =
    'input, textarea, select, [contenteditable="true"], .monaco-editor, pre, code, [data-honey-text]';

/**
 * One drip per card, at a bottom corner — that is where liquid actually
 * collects on a rounded box. Which corner is used is picked per hover, so the
 * same card does not always run off the same side.
 *
 * A single site rather than several: three simultaneous drips read as a
 * decorative fringe, one reads as honey.
 */
/*
 * Every dimension below is randomised within a range on each hover, so no two
 * drips are the same one twice. Honey does not run off an edge identically each
 * time, and a loop that repeats exactly is the thing that reads as animation
 * rather than liquid.
 *
 * The ranges are the design; the individual values are not. Widen a range to
 * make the effect more varied, move it to change its character.
 */

/** Fraction of the card's width the drop is sized at, and the hard limits. */
const DRIP_SIZE_RATIO = 0.055;
const DRIP_SIZE_MIN = 10;
const DRIP_SIZE_MAX = 28;
/** Multiplied into the size so the same card gives a fat drop one time and a
 *  small one the next. Applied AFTER the cap and topping out at 1, because a
 *  range that can exceed the cap just clips: on any wide card the base already
 *  sits above DRIP_SIZE_MAX, so half the draws landed on exactly 28px and the
 *  drop never appeared to vary at all. */
const SIZE_JITTER: [number, number] = [0.62, 1];
/** How wide the pool spreads, as a multiple of the drop. Shared with the CSS
 *  via --pool, and used here for the containment maths — the two MUST agree or
 *  the pool can hang off the card's edge. */
const POOL_RATIO: [number, number] = [3.5, 5.2];
/** How far the neck draws down before it pinches, as a multiple of the drop.
 *  This is the "length" of the drip. Passed to CSS as --neck. */
const NECK_RATIO: [number, number] = [1.6, 3.2];
/** How far the freed drop falls, as a multiple of the drop. */
const FALL_RATIO: [number, number] = [4.5, 10];
/** Breathing room between the pool's edge and the card's, so the run-off never
 *  looks like it is coming off the corner radius. */
const EDGE_PADDING = 8;

/** A value somewhere in [min, max]. */
const between = ([min, max]: [number, number]) => min + Math.random() * (max - min);

/**
 * Builds the pool/neck/bead rig for one card.
 *
 * Everything is measured off the host rather than expressed in percentages.
 * Percentages were the bug: a pool 4.2 drops wide, centred at 17% of a narrow
 * card, hangs off the left edge — the drip appeared to run off nothing. Sizing
 * and clamping against the real width keeps the whole thing inside the card's
 * perimeter at any card size, and scales the drop so a small chip gets a small
 * drip instead of the same 24px one a full-width panel gets.
 */
function buildDripRig(_host: HTMLElement, width: number): HTMLDivElement {

    const pool = between(POOL_RATIO);
    const neck = between(NECK_RATIO);
    const fall = between(FALL_RATIO);

    // Drop scaled to the card and clamped so it never turns into a speck or a
    // blob bigger than the thing it is running off, THEN jittered — see
    // SIZE_JITTER for why that order matters.
    const base = Math.min(DRIP_SIZE_MAX, Math.max(DRIP_SIZE_MIN, width * DRIP_SIZE_RATIO));
    let size = Math.max(DRIP_SIZE_MIN, base * between(SIZE_JITTER));
    // A pool wider than the card can never be contained; shrink until it fits.
    // This uses THIS drip's pool ratio, not a constant — that is the whole
    // reason the ratio is computed before the size.
    const maxSize = (width - EDGE_PADDING * 2) / pool;
    if (maxSize > 0) size = Math.min(size, maxSize);

    // The pool's half-width is the true margin — clamping the drip's centre by
    // it is what guarantees no overhang.
    const halfPool = (size * pool) / 2 + EDGE_PADDING;
    const left = Math.min(Math.max(halfPool, width * 0.17), width - halfPool);
    const right = Math.max(Math.min(width - halfPool, width * 0.83), halfPool);
    const rigX = Math.random() < 0.5 ? left : right;

    const rig = document.createElement("div");
    rig.className = "honey-drips";
    rig.setAttribute("aria-hidden", "true");
    rig.style.setProperty("--x", `${rigX}px`);

    const drip = document.createElement("span");
    drip.className = "honey-drip";
    drip.style.setProperty("--size", `${size.toFixed(2)}px`);
    drip.style.setProperty("--pool", pool.toFixed(3));
    drip.style.setProperty("--neck", neck.toFixed(3));
    drip.style.setProperty("--fall", `${(size * fall).toFixed(2)}px`);
    // One cycle covers all four phases — pool, neck, pinch, fall — so this is
    // the single knob for how fast the whole thing drips. Raise it to make the
    // honey read as thicker and slower; lower it for a runnier liquid.
    // Randomised per hover so re-entering a card does not replay an identical
    // cycle, and so the drop is not always caught at the same phase.
    drip.style.setProperty("--dur", `${1.45 + Math.random() * 0.35}s`);
    drip.style.setProperty("--delay", `${-(Math.random() * 3)}s`);

    // Pool, neck and bead go in one gooed group so they render as a single
    // body of liquid — that merge is what lets the bead start hidden inside
    // the pool and emerge, rather than appearing beside it. See theme.css.
    const body = document.createElement("span");
    body.className = "honey-drip-body";
    for (const part of ["lip", "neck", "bead"]) {
        const el = document.createElement("i");
        el.className = `honey-drip-${part}`;
        body.appendChild(el);
    }
    drip.appendChild(body);
    rig.appendChild(drip);

    return rig;
}

export default function HoneyCursor() {
    const layerRef = useRef<HTMLDivElement | null>(null);
    const gooRef = useRef<HTMLDivElement | null>(null);
    const blobRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        if (!window.matchMedia("(pointer: fine)").matches) return;
        if (document.documentElement.dataset.honey === "off") return;

        const layer = layerRef.current;
        const goo = gooRef.current;
        const blobs = blobRefs.current.filter(Boolean) as HTMLDivElement[];
        if (!layer || !goo || blobs.length !== SEGMENTS) return;

        document.documentElement.classList.add("honey-cursor-active");
        layer.style.display = "block";

        // Off-screen until the first real pointer event, so nothing flashes at
        // the origin on load.
        let targetX = -200;
        let targetY = -200;
        const xs = new Array(SEGMENTS).fill(targetX);
        const ys = new Array(SEGMENTS).fill(targetY);

        let speed = 0;
        let angle = 0;

        let hovered: HTMLElement | null = null;
        let pendingSurface: HTMLElement | null = null;
        // The drip rig lives in the hovered card and is torn down when the
        // pointer leaves it, so at most one exists at a time.
        let rig: HTMLDivElement | null = null;
        let moved = false;
        /** Last element the text-entry test ran against, so it runs on change
         *  rather than on every pointer event. */
        let lastTarget: HTMLElement | null = null;

        /*
         * PERFORMANCE — the hovered card's box, cached.
         *
         * This loop used to call getBoundingClientRect() on the hovered element
         * every frame AND write custom properties to that same element every
         * frame. Reading layout straight after writing to it forces a
         * synchronous re-layout, 60 times a second, for as long as the pointer
         * sat on a card. Caching the box removes the read entirely; it is only
         * re-measured when something can actually have moved it.
         */
        let hoverRect: { left: number; top: number; width: number; height: number } | null = null;
        const invalidateRect = () => {
            hoverRect = null;
        };

        /** Last values written, so an unchanged frame writes nothing at all. */
        let lastHx = NaN;
        let lastHy = NaN;
        /*
         * PERFORMANCE — the loop suspends itself.
         *
         * With the pointer still, every frame was recomputing identical
         * positions and writing identical transforms. The loop now stops once
         * the blobs have converged and restarts on the next pointer event, so
         * an idle page — or one being scrolled without moving the mouse — pays
         * nothing for the cursor at all.
         */
        let raf = 0;
        let running = false;

        const onMove = (e: PointerEvent) => {
            targetX = e.clientX;
            targetY = e.clientY;
            moved = true;

            const el = e.target as HTMLElement | null;
            const hot = el?.closest?.(HOT_SELECTOR) ? "true" : "false";
            // Writing an attribute that already holds this value still
            // invalidates style for the subtree, so check before writing.
            if (layer.dataset.hot !== hot) layer.dataset.hot = hot;

            // Re-evaluated only when the element under the pointer actually
            // changes. The computed-style fallback catches anything that opts
            // into a text caret without matching the selector — a custom editor,
            // a `cursor-text` utility — without paying for getComputedStyle on
            // every single pointermove.
            if (el !== lastTarget) {
                lastTarget = el;
                let text = !!el?.closest?.(TEXT_SELECTOR);
                if (!text && el) {
                    try {
                        text = getComputedStyle(el).cursor === "text";
                    } catch {
                        /* detached node — treat as not text */
                    }
                }
                const flag = text ? "true" : "false";
                if (layer.dataset.text !== flag) layer.dataset.text = flag;
            }

            pendingSurface = (el?.closest?.(SURFACE_SELECTOR) as HTMLElement) ?? null;
            start();
        };

        // mouseleave on <html>, not pointerleave on document: pointerleave does
        // not reliably fire when the pointer exits the window, which left the
        // blob parked at the edge.
        const onLeave = () => {
            targetX = -200;
            targetY = -200;
            start();
        };

        /*
         * PARKED, NOT EASED.
         *
         * `mouseleave` only fires when the pointer crosses the document edge.
         * Alt-tabbing, switching to another app, or opening a screenshot tool
         * leaves the pointer where it was, so the blob stayed painted on the
         * page — a yellow dot sitting next to whatever the pointer happened to
         * be over, which is what every "stray dot" screenshot shows. Losing
         * focus means there is no pointer to represent, so the blob jumps
         * straight off-screen rather than easing there.
         */
        const park = () => {
            targetX = -200;
            targetY = -200;
            for (let i = 0; i < SEGMENTS; i++) {
                xs[i] = targetX;
                ys[i] = targetY;
            }
            moved = false;
            start();
        };
        const onBlur = () => park();
        const onVisibility = () => {
            if (document.visibilityState === "hidden") park();
        };

        const splash = (x: number, y: number) => {
            /*
             * The splash gets its own filtered box, created at the click point
             * and thrown away when it finishes. Before, droplets were appended
             * to the full-viewport filtered layer, so one click made the
             * browser filter the whole screen for the length of the animation.
             */
            const burst = document.createElement("div");
            burst.className = "honey-splash";
            burst.style.transform = `translate3d(${x}px, ${y}px, 0)`;

            const smear = document.createElement("div");
            smear.className = "honey-smear";
            burst.appendChild(smear);

            for (let i = 0; i < DROPLETS_PER_CLICK; i++) {
                // Even spread plus jitter: a perfectly regular ring of droplets
                // reads as a mechanism, not a splash.
                const a = (Math.PI * 2 * i) / DROPLETS_PER_CLICK + (Math.random() - 0.5) * 0.7;
                const distance =
                    DROPLET_MIN_DISTANCE +
                    Math.random() * (DROPLET_MAX_DISTANCE - DROPLET_MIN_DISTANCE);
                const size =
                    DROPLET_MIN_SIZE + Math.random() * (DROPLET_MAX_SIZE - DROPLET_MIN_SIZE);

                const dot = document.createElement("div");
                dot.className = "honey-droplet";
                dot.style.width = `${size}px`;
                dot.style.height = `${size}px`;
                dot.style.margin = `${-size / 2}px 0 0 ${-size / 2}px`;
                dot.style.setProperty("--dx", `${Math.cos(a) * distance}px`);
                dot.style.setProperty("--dy", `${Math.sin(a) * distance}px`);
                // Bigger droplets carry further and fall harder.
                dot.style.setProperty("--gy", `${DROPLET_GRAVITY * (size / DROPLET_MAX_SIZE)}px`);
                dot.style.setProperty("--dur", `${0.55 + Math.random() * 0.35}s`);
                burst.appendChild(dot);
            }

            // One timer for the whole burst rather than one per droplet.
            window.setTimeout(() => burst.remove(), DROPLET_LIFETIME_MS);
            layer.appendChild(burst);

            // The ring lives outside the filtered box so it stays a clean rim
            // instead of being absorbed into the blob mass.
            const ring = document.createElement("div");
            ring.className = "honey-ring";
            ring.style.setProperty("--sx", `${x}px`);
            ring.style.setProperty("--sy", `${y}px`);
            ring.addEventListener("animationend", () => ring.remove(), { once: true });
            document.body.appendChild(ring);
        };

        const onDown = (e: PointerEvent) => splash(e.clientX, e.clientY);

        const tick = () => {
            for (let i = 0; i < SEGMENTS; i++) {
                const leadX = i === 0 ? targetX : xs[i - 1];
                const leadY = i === 0 ? targetY : ys[i - 1];
                xs[i] += (leadX - xs[i]) * SEGMENT_EASE[i];
                ys[i] += (leadY - ys[i]) * SEGMENT_EASE[i];
            }

            // Deformation comes from how far the head still has to travel, not
            // from raw pointer delta — that keeps the stretch tied to what the
            // blob is actually doing, so it eases out instead of cutting off
            // the instant the pointer stops.
            const gapX = targetX - xs[0];
            const gapY = targetY - ys[0];
            const gap = Math.hypot(gapX, gapY);
            if (gap > 0.5) {
                angle = Math.atan2(gapY, gapX);
                speed = Math.max(speed, gap);
            }
            speed *= SPEED_DECAY;

            const stretch = Math.min(1 + speed * STRETCH_PER_SPEED, MAX_STRETCH);
            // Constant-area squash: what the shape gains lengthwise it loses
            // across, which is how a drop of liquid actually behaves.
            const squash = 1 / Math.sqrt(stretch);
            const deg = (angle * 180) / Math.PI;

            // The filtered box rides the head; every blob is then positioned
            // RELATIVE to it, which is what keeps the filter region small.
            goo.style.transform = `translate3d(${xs[0]}px, ${ys[0]}px, 0)`;

            for (let i = 0; i < SEGMENTS; i++) {
                let ox = xs[i] - xs[0];
                let oy = ys[i] - ys[0];
                // Clamp the strand so the tail can never leave the filtered box
                // and clip against its edge.
                const d = Math.hypot(ox, oy);
                if (d > MAX_TRAIL) {
                    const k = MAX_TRAIL / d;
                    ox *= k;
                    oy *= k;
                }
                // Trailing segments deform less — the strand thins out rather
                // than every blob stretching identically.
                const falloff = 1 - i / SEGMENTS;
                const sx = 1 + (stretch - 1) * falloff;
                const sy = 1 + (squash - 1) * falloff;
                blobs[i].style.transform =
                    `translate3d(${ox}px, ${oy}px, 0) rotate(${deg}deg) scale(${sx}, ${sy})`;
            }

            if (pendingSurface !== hovered) {
                hovered?.style.removeProperty("--honey-x");
                hovered?.style.removeProperty("--honey-y");
                hovered?.style.removeProperty("--honey-ox");
                hovered?.style.removeProperty("--honey-oy");
                rig?.remove();
                rig = null;
                hovered = pendingSurface;
                hoverRect = null;
                lastHx = NaN;
                lastHy = NaN;
                if (hovered) {
                    // The one layout read per hover, not per frame.
                    const box = hovered.getBoundingClientRect();
                    hoverRect = {
                        left: box.left,
                        top: box.top,
                        width: box.width || 1,
                        height: box.height || 1,
                    };
                    // Freeze where the honey flows in FROM. Written once, on
                    // entry, and never updated — the fill has to spread from
                    // the point the pointer crossed the edge. The live
                    // --honey-x/y below keep tracking for the highlight; if the
                    // fill used those too it would slide around under the
                    // pointer instead of flowing across the card.
                    hovered.style.setProperty("--honey-ox", `${targetX - box.left}px`);
                    hovered.style.setProperty("--honey-oy", `${targetY - box.top}px`);
                    // DRIP DISABLED — uncomment both lines to bring the
                    // honey drip back. buildDripRig and the .honey-drip* CSS
                    // are untouched, so nothing else has to change.
                    // rig = buildDripRig(hovered, box.width);
                    // hovered.appendChild(rig);
                }
            }

            if (hovered && moved) {
                if (!hoverRect) {
                    const box = hovered.getBoundingClientRect();
                    hoverRect = {
                        left: box.left,
                        top: box.top,
                        width: box.width || 1,
                        height: box.height || 1,
                    };
                }
                const hx = Math.round(targetX - hoverRect.left);
                const hy = Math.round(targetY - hoverRect.top);
                // Rounded to whole pixels and diffed: a sub-pixel change in the
                // highlight is invisible but still costs a style invalidation
                // and a repaint of the card.
                if (hx !== lastHx || hy !== lastHy) {
                    hovered.style.setProperty("--honey-x", `${hx}px`);
                    hovered.style.setProperty("--honey-y", `${hy}px`);
                    lastHx = hx;
                    lastHy = hy;
                }
            }

            // Converged and still: stop until something moves again.
            //
            // The test has to cover EVERY segment, not just the head. Checking
            // the head alone suspended the loop the moment it caught up, which
            // froze the trailing blobs wherever they happened to be — they were
            // left stranded across the screen instead of gathering under the
            // pointer.
            let far = Math.abs(gapX) + Math.abs(gapY);
            for (let i = 1; i < SEGMENTS; i++) {
                far = Math.max(far, Math.abs(xs[i] - targetX) + Math.abs(ys[i] - targetY));
            }
            if (far < 0.3 && speed < 0.15) {
                running = false;
                raf = 0;
                return;
            }
            raf = requestAnimationFrame(tick);
        };

        const start = () => {
            if (running) return;
            running = true;
            raf = requestAnimationFrame(tick);
        };
        start();

        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("pointerdown", onDown, { passive: true });
        document.documentElement.addEventListener("mouseleave", onLeave);
        window.addEventListener("blur", onBlur);
        document.addEventListener("visibilitychange", onVisibility);
        // Scrolling and resizing are the only things that move a hovered card
        // out from under the cached box, so they are what invalidates it —
        // rather than re-measuring on the off chance, every frame.
        window.addEventListener("scroll", invalidateRect, { passive: true, capture: true });
        window.addEventListener("resize", invalidateRect, { passive: true });

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerdown", onDown);
            document.documentElement.removeEventListener("mouseleave", onLeave);
            window.removeEventListener("blur", onBlur);
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("scroll", invalidateRect, { capture: true } as any);
            window.removeEventListener("resize", invalidateRect);
            hovered?.style.removeProperty("--honey-x");
            hovered?.style.removeProperty("--honey-y");
            hovered?.style.removeProperty("--honey-ox");
            hovered?.style.removeProperty("--honey-oy");
            rig?.remove();
            document.querySelectorAll(".honey-drips").forEach((n) => n.remove());
            document.documentElement.classList.remove("honey-cursor-active");
            document.querySelectorAll(".honey-ring").forEach((n) => n.remove());
        };
    }, []);

    return (
        <>
            {/* The goo filter, defined once. Blur merges neighbouring blobs into
                one mass; the colour matrix then steepens the alpha ramp so that
                mass gets a hard edge back. Without the second step this is a
                smudge rather than liquid. */}
            <svg
                aria-hidden="true"
                width="0"
                height="0"
                style={{ position: "absolute", pointerEvents: "none" }}
            >
                <defs>
                    <filter id="honey-goo">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
                        <feColorMatrix
                            in="blur"
                            type="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11"
                            result="goo"
                        />
                        <feBlend in="SourceGraphic" in2="goo" />
                    </filter>
                    {/* Tighter blur for the drips: those shapes are smaller
                        than the cursor blobs and the neck has to stay readable
                        as it thins, which a wide blur erases. */}
                    <filter id="honey-goo-drip">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
                        <feColorMatrix
                            in="blur"
                            type="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -12"
                        />
                    </filter>
                </defs>
            </svg>

            {/* display:none until the effect confirms this device should have
                it, so a touch visitor never paints it at all. */}
            <div
                ref={layerRef}
                className="honey-cursor-layer"
                aria-hidden="true"
                style={{ display: "none" }}
            >
                {/* The filtered box. It travels with the pointer and the blobs
                    sit inside it, so the goo filter only ever runs over a few
                    hundred pixels instead of the whole viewport. */}
                <div ref={gooRef} className="honey-cursor-goo">
                    {/* Painted back-to-front, so a restored trail sits under the
                        head rather than over it. */}
                    {Array.from({ length: SEGMENTS }, (_, i) => SEGMENTS - 1 - i).map((seg) => (
                        <div
                            key={seg}
                            ref={(el) => {
                                blobRefs.current[seg] = el;
                            }}
                            className={`honey-blob honey-blob-${seg}`}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}
