"use client";

/*
 * Hive cursor — the pointer as an instrument, in the Machined Hive's own parts.
 *
 *   idle    a brass hexagon — the comb's cell — trails the pointer a beat
 *           behind and rolls as it travels sideways, the way the journey dial
 *           turns with scroll. A dot marks the exact hotspot and never lags.
 *   lock    over anything clickable the cell opens into four corner brackets
 *           that close around the element (the dial's sight frame, sized to
 *           the target), and a mono tag decodes above them naming the action.
 *   press   the brackets tighten and a hex ring pulses out from the click.
 *   text    over form fields the layer steps aside for the native caret.
 *
 * WHY OUTSIDE REACT
 * Everything here moves every frame. One rAF loop writes transforms straight
 * to a handful of fixed elements — no state, no re-render, compositor only —
 * and the loop suspends itself once the cell has caught up with an idle
 * pointer.
 *
 * MOTION PREFERENCE
 * It is a cursor replacement, so it stays under prefers-reduced-motion, but
 * without the lag, the roll or the click pulse: the cell sits on the pointer
 * and the brackets snap. `data-honey="off"` on <html> (the product's switch
 * for all ambient motion) removes the layer entirely.
 */

import { useEffect, useRef } from "react";

/** Elements the brackets lock onto. */
const INTERACTIVE =
    'a[href], button:not(:disabled), [role="button"], [role="link"], [role="tab"], summary, label[for], [tabindex]:not([tabindex="-1"]), [data-cursor="lock"]';
/** Where the layer hides and the native cursor takes over — kept in step with
 *  hive-cursor.css. Iframes are on the list because pointer events stop at
 *  their edge: over an embedded player the reticle would freeze where it
 *  crossed in, while the player draws its own cursor inside. */
const TEXT =
    'input:not([type="button"], [type="submit"], [type="reset"], [type="checkbox"], [type="radio"], [type="range"], [type="color"], [type="file"]), textarea, select, [contenteditable=""], [contenteditable="true"], [data-cursor="text"], iframe';

/** Flat-top cell, point to point, in px. The SVG below is drawn to match. */
const CELL_W = 30;
const CELL_H = (CELL_W * Math.sqrt(3)) / 2;
/** Clearance between a locked element and its brackets. */
const PAD = 6;
/** How far the brackets close in on press. */
const SQUEEZE = 3;
/** Catch-up per 60Hz frame for the trailing cell and the bracket morph;
 *  scaled by real frame time so 120Hz panels and slow frames feel the same. */
const FOLLOW = 0.2;
const MORPH = 0.26;
const FRAME_MS = 1000 / 60;
/** Degrees of roll per px of sideways travel. */
const ROLL = 0.35;
/** Anything bigger than this share of the viewport is too big to bracket. */
const MAX_LOCK_AREA = 0.35;
/** Tag decode: per-character stagger and lead-in, ms. */
const TAG_STAGGER = 38;
const TAG_LEAD = 70;

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/{}=+*#";
const glyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

/** Flat-top hexagon of circumradius 15 around the origin. */
const HEX_POINTS = "15,0 7.5,12.99 -7.5,12.99 -15,0 -7.5,-12.99 7.5,-12.99";

function actionFor(el: Element): string {
    const custom = el.getAttribute("data-cursor-label");
    if (custom) return custom;
    if (el instanceof HTMLAnchorElement) {
        const href = el.getAttribute("href") ?? "";
        if (href.startsWith("mailto:")) return "Email";
        if (href.startsWith("tel:")) return "Call";
        if (href.startsWith("#")) return "Jump";
        if (el.target === "_blank" || (el.host && el.host !== window.location.host)) return "Open ↗";
        return "Go →";
    }
    if (el instanceof HTMLButtonElement && el.type === "submit") return "Send";
    if (el.hasAttribute("aria-expanded")) return "Toggle";
    return "Press";
}

type Mode = "idle" | "lock" | "text";

/** A mouse, on a layout wide enough to be the desktop one — kept in step with
 *  hive-cursor.css. Phones, tablets and the mobile layout keep their own
 *  cursor (or none). */
const DESKTOP_POINTER = "(hover: hover) and (pointer: fine) and (min-width: 768px)";

/** Wire the cursor up on its layer; returns the teardown. */
function attach(root: HTMLDivElement): (() => void) | undefined {
    const cell = root.querySelector<HTMLElement>(".hive-cursor__cell");
    const dot = root.querySelector<HTMLElement>(".hive-cursor__dot");
    const tag = root.querySelector<HTMLElement>(".hive-cursor__tag");
    const corners = Array.from(root.querySelectorAll<HTMLElement>(".hive-cursor__corner"));
    if (!cell || !dot || !tag || corners.length !== 4) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /*
     * The class that hides the native cursor has a rule reaching every
     * element, so adding it restyles the whole page (20–60ms). It goes on
     * at the first pointer move rather than on mount, which keeps that out
     * of page load — and until the pointer moves the cell has nowhere to
     * be anyway.
     */
    let active = false;
    const activate = () => {
        if (active) return;
        active = true;
        document.documentElement.classList.add("hive-cursor-active");
        root.style.display = "block";
    };

    // Raw pointer, the trailing cell, and the bracket box (x, y, w, h).
    let px = -100;
    let py = -100;
    let cx = px;
    let cy = py;
    let roll = 0;
    let bx = cx - CELL_W / 2;
    let by = cy - CELL_H / 2;
    let bw = CELL_W;
    let bh = CELL_H;

    let mode: Mode = "idle";
    let target: Element | null = null;
    let pressed = false;
    let shown = false;

    // Tag decode state.
    let tagText = "";
    let tagStart = 0;
    let tagDone = true;
    let tagH = 0;

    /** Last transform written per element — an unchanged frame writes nothing. */
    const last = new Map<HTMLElement, string>();
    const place = (el: HTMLElement, value: string) => {
        if (last.get(el) === value) return;
        last.set(el, value);
        el.style.transform = value;
    };

    const setMode = (next: Mode) => {
        if (mode === next) return;
        mode = next;
        root.dataset.mode = next;
    };

    const setShown = (next: boolean) => {
        if (shown === next) return;
        shown = next;
        root.dataset.visible = next ? "true" : "false";
    };

    /** Decide what the element under the pointer means for the cursor. */
    const resolve = (el: Element | null) => {
        if (el?.closest?.(TEXT)) {
            target = null;
            setMode("text");
            return;
        }
        const hit = el?.closest?.(INTERACTIVE) ?? null;
        let lockable = false;
        if (hit) {
            const r = hit.getBoundingClientRect();
            lockable = r.width * r.height <= window.innerWidth * window.innerHeight * MAX_LOCK_AREA;
        }
        root.dataset.hot = hit && !lockable ? "true" : "false";

        if (hit && lockable) {
            if (hit !== target) {
                target = hit;
                tagText = actionFor(hit).toUpperCase();
                tagStart = performance.now();
                tagDone = reduce;
                tag.textContent = reduce ? tagText : "";
                tagH = 0;
            }
            setMode("lock");
        } else {
            target = null;
            setMode("idle");
        }
    };

    let raf = 0;
    let lastTime = 0;
    const start = () => {
        if (!raf) raf = requestAnimationFrame(tick);
    };

    const tick = (now: number) => {
        raf = 0;
        const dt = lastTime ? Math.min(64, now - lastTime) : FRAME_MS;
        lastTime = now;
        const k = dt / FRAME_MS;
        const follow = reduce ? 1 : 1 - Math.pow(1 - FOLLOW, k);
        const morph = reduce ? 1 : 1 - Math.pow(1 - MORPH, k);

        // Trailing cell; it rolls by how far it travelled sideways.
        const dx = (px - cx) * follow;
        cx += dx;
        cy += (py - cy) * follow;
        if (!reduce) roll = (roll + dx * ROLL) % 360;

        // Bracket target: the locked element, or the cell's own box.
        let tx: number;
        let ty: number;
        let tw: number;
        let th: number;
        if (mode === "lock" && target && !target.isConnected) {
            // The element went away under the pointer (a list re-render,
            // an exit animation) — look again at whatever is there now.
            target = null;
            setMode("idle");
            resolve(document.elementFromPoint(px, py));
        }
        if (mode === "lock" && target) {
            const r = target.getBoundingClientRect();
            const s = pressed ? SQUEEZE : 0;
            tx = r.left - PAD + s;
            ty = r.top - PAD + s;
            tw = r.width + (PAD - s) * 2;
            th = r.height + (PAD - s) * 2;
        } else {
            tx = cx - CELL_W / 2;
            ty = cy - CELL_H / 2;
            tw = CELL_W;
            th = CELL_H;
        }
        bx += (tx - bx) * morph;
        by += (ty - by) * morph;
        bw += (tw - bw) * morph;
        bh += (th - bh) * morph;

        place(dot, `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`);
        place(
            cell,
            `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0) rotate(${roll.toFixed(2)}deg) scale(${pressed ? 0.82 : 1})`,
        );
        const x0 = bx.toFixed(2);
        const y0 = by.toFixed(2);
        const x1 = (bx + bw).toFixed(2);
        const y1 = (by + bh).toFixed(2);
        place(corners[0], `translate3d(${x0}px, ${y0}px, 0)`);
        place(corners[1], `translate3d(${x1}px, ${y0}px, 0)`);
        place(corners[2], `translate3d(${x0}px, ${y1}px, 0)`);
        place(corners[3], `translate3d(${x1}px, ${y1}px, 0)`);

        // Tag: decode the action word, then park it above the top-left
        // bracket — or below the box when there is no room above.
        if (mode === "lock") {
            if (!tagDone) {
                const t = now - tagStart;
                let out = "";
                let done = true;
                for (let i = 0; i < tagText.length; i++) {
                    const ch = tagText[i];
                    if (ch === " " || t >= TAG_LEAD + i * TAG_STAGGER) out += ch;
                    else {
                        out += glyph();
                        done = false;
                    }
                }
                if (tag.textContent !== out) tag.textContent = out;
                tagDone = done;
            }
            if (!tagH) tagH = tag.offsetHeight;
            const above = by - tagH - 5;
            const ty2 = above >= 4 ? above : by + bh + 5;
            place(tag, `translate3d(${x0}px, ${ty2.toFixed(2)}px, 0)`);
        }

        const settling =
            Math.abs(px - cx) + Math.abs(py - cy) > 0.05 ||
            Math.abs(tx - bx) + Math.abs(ty - by) + Math.abs(tw - bw) + Math.abs(th - bh) > 0.05 ||
            !tagDone;
        // While locked keep watching the target: scenes move elements under
        // a still pointer (pinned tracks, scrolled lists).
        if (settling || mode === "lock") start();
        else lastTime = 0; // suspended — the next wake-up starts a fresh dt
    };

    const onMove = (e: PointerEvent) => {
        // A finger or a pen brings its own feedback — a reticle chasing a
        // touch is noise (touchscreen laptops also report a fine pointer).
        if (e.pointerType !== "mouse") {
            hide();
            return;
        }
        activate();
        px = e.clientX;
        py = e.clientY;
        if (!shown) {
            // First sighting: appear in place rather than sweep in from
            // wherever the cell was parked.
            cx = px;
            cy = py;
            bx = cx - CELL_W / 2;
            by = cy - CELL_H / 2;
            bw = CELL_W;
            bh = CELL_H;
            setShown(true);
        }
        resolve(e.target as Element | null);
        start();
    };

    // Scrolling slides new elements under a pointer that has not moved.
    let scrollFrame = 0;
    const onScroll = () => {
        if (!shown || scrollFrame) return;
        scrollFrame = requestAnimationFrame(() => {
            scrollFrame = 0;
            resolve(document.elementFromPoint(px, py));
            start();
        });
    };

    const onDown = () => {
        pressed = true;
        root.dataset.pressed = "true";
        if (!reduce && shown) {
            const ring = document.createElement("div");
            ring.className = "hive-cursor__pulse";
            ring.style.transform = `translate3d(${px}px, ${py}px, 0)`;
            ring.innerHTML = `<svg viewBox="-16 -14 32 28"><polygon points="${HEX_POINTS}" /></svg>`;
            ring.addEventListener("animationend", () => ring.remove(), { once: true });
            root.appendChild(ring);
        }
        start();
    };
    const onUp = () => {
        pressed = false;
        root.dataset.pressed = "false";
        start();
    };

    /*
     * Hidden, not eased away, when there is no pointer to represent:
     * leaving the window, alt-tabbing, or a hidden tab. mouseleave on
     * <html> is the reliable signal for the window edge.
     */
    const hide = () => {
        setShown(false);
        pressed = false;
        root.dataset.pressed = "false";
    };
    const onVisibility = () => {
        if (document.visibilityState === "hidden") hide();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    document.documentElement.addEventListener("mouseleave", hide);
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
        cancelAnimationFrame(raf);
        cancelAnimationFrame(scrollFrame);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("scroll", onScroll, { capture: true });
        document.documentElement.removeEventListener("mouseleave", hide);
        window.removeEventListener("blur", hide);
        document.removeEventListener("visibilitychange", onVisibility);
        document.documentElement.classList.remove("hive-cursor-active");
        root.querySelectorAll(".hive-cursor__pulse").forEach((n) => n.remove());
        root.style.display = "none";
    };
}

export default function HiveCursor() {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (document.documentElement.dataset.honey === "off") return;
        const root = rootRef.current;
        if (!root) return;

        // Follows the viewport: going into a mobile view (a narrow window,
        // DevTools' device mode) takes the cursor away; coming back restores it.
        const desktop = window.matchMedia(DESKTOP_POINTER);
        let detach = desktop.matches ? attach(root) : undefined;
        const onChange = () => {
            detach?.();
            detach = desktop.matches ? attach(root) : undefined;
        };
        desktop.addEventListener("change", onChange);
        return () => {
            desktop.removeEventListener("change", onChange);
            detach?.();
        };
    }, []);

    return (
        // display:none until the effect confirms a fine, hovering pointer, so
        // touch visitors never paint it.
        <div
            ref={rootRef}
            className="hive-cursor"
            aria-hidden="true"
            data-mode="idle"
            data-visible="false"
            style={{ display: "none" }}
        >
            <span className="hive-cursor__corner hive-cursor__corner--tl" />
            <span className="hive-cursor__corner hive-cursor__corner--tr" />
            <span className="hive-cursor__corner hive-cursor__corner--bl" />
            <span className="hive-cursor__corner hive-cursor__corner--br" />
            <span className="hive-cursor__tag" />
            <span className="hive-cursor__cell">
                <svg className="hive-cursor__hex" viewBox="-16 -14 32 28" overflow="visible">
                    <polygon className="hive-cursor__hex-under" points={HEX_POINTS} />
                    <polygon className="hive-cursor__hex-line" points={HEX_POINTS} />
                    <line className="hive-cursor__hex-tick" x1="15" y1="0" x2="19.5" y2="0" />
                    <line className="hive-cursor__hex-tick" x1="-15" y1="0" x2="-19.5" y2="0" />
                </svg>
            </span>
            <span className="hive-cursor__dot" />
        </div>
    );
}
