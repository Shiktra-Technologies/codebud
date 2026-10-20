"use client";

/*
 * FloatingLogo — the mascot tile as a small 3D object that travels with the
 * page.
 *
 * A slab, not a sticker: the front face is the logo, stacked layers behind it
 * make a brass edge that shows as it tilts, and the back face is a carbon
 * plate stamped with </>. Scroll decides where it is:
 *
 *   hero      large, in the empty middle of the brass ring
 *   then      it flies to an open spot in each scene — the story's free third
 *             column, above the dial, beside the proof thread, over the team
 *             row — and lands under </> on the contact screen.
 *
 * Every flight is a coin-flip (one full turn on Y) along a shallow arc, so
 * the back face shows mid-air. At rest it bobs and leans toward the pointer
 * and with the scroll. Phones have no spare room, so there it leaves the hero
 * by diving into the nav's logo mark and stays gone.
 *
 * Runs in one rAF loop outside React, like BrassRing: two transforms a frame.
 */

import { useEffect, useRef } from "react";

/** Layout size of the slab; scale() sets the size you see. */
const BASE = 200;
const LAYERS = 8;
const LAYER_GAP = 2.2;

interface Key {
    at: number; // scroll position, px
    x: number; // centre, px from the viewport's left
    y: number; // centre, px from the viewport's top
    size: number; // px
    flip: boolean; // the flight INTO this key turns the coin
    fade?: boolean; // the flight into this key fades it out (phones)
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

function section(id: string, vh: number) {
    const el = document.getElementById(id);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, pin: Math.max(0, r.height - vh) };
}

/** Centre of the nav's logo mark — where the slab dives when it leaves. */
function navMark(w: number, h: number) {
    const mark = document.querySelector(".scene-nav__mark")?.getBoundingClientRect();
    return { nx: mark ? mark.left + mark.width / 2 : w * 0.2, ny: mark ? mark.top + mark.height / 2 : h - 32 };
}

/** Where the slab rests in each scene, in scroll order. */
function buildKeys(w: number, h: number, mobile: boolean, variant: "home" | "page"): Key[] {
    if (variant === "page") {
        // The other pages: beside the header's title, then into the nav mark.
        // Phones have no room beside the title, so there it stays put away.
        const el = document.getElementById("page-hero");
        if (!el || mobile) return [];
        const r = el.getBoundingClientRect();
        const top = r.top + window.scrollY;
        const S = Math.min(190, Math.max(130, w * 0.11));
        const { nx, ny } = navMark(w, h);
        const rest = { x: w * 0.84, y: top + r.height * 0.46, size: S };
        return [
            { at: 0, ...rest, flip: false },
            { at: top + r.height * 0.2, ...rest, flip: false },
            { at: top + r.height * 0.62, x: nx, y: ny, size: 18, flip: true, fade: true },
        ];
    }

    const hero = section("home", h);
    if (!hero) return [];

    if (mobile) {
        const { nx, ny } = navMark(w, h);
        return [
            { at: 0, x: w / 2, y: h * 0.72, size: 96, flip: false },
            { at: hero.top + hero.pin * 0.16, x: w / 2, y: h * 0.72, size: 96, flip: false },
            { at: hero.top + hero.pin * 0.4, x: nx, y: ny, size: 18, flip: true, fade: true },
        ];
    }

    const story = section("story", h);
    const how = section("how", h);
    const proof = section("proof", h);
    const team = section("team", h);
    if (!story || !how || !proof || !team) return [];
    const end = Math.max(0, document.documentElement.scrollHeight - h);
    const S = Math.min(220, Math.max(150, w * 0.13));

    const keys: Key[] = [
        { at: 0, x: w * 0.5, y: h * 0.53, size: S, flip: false },
        { at: hero.top + hero.pin * 0.2, x: w * 0.5, y: h * 0.53, size: S, flip: false },
        // Up and right, clear of the problem statement that owns the middle.
        { at: hero.top + hero.pin * 0.46, x: w * 0.905, y: h * 0.3, size: S * 0.5, flip: true },
        // The story track leaves its right-hand column empty — it grows into it.
        { at: story.top, x: w * 0.835, y: h * 0.5, size: S * 0.85, flip: false },
        { at: story.top + story.pin, x: w * 0.835, y: h * 0.5, size: S * 0.85, flip: false },
        // Between the caption and the step title, above the dial.
        { at: how.top, x: w * 0.5, y: h * 0.17, size: S * 0.46, flip: true },
        // Leaves as the dial starts to set (JourneyScene's EXIT), not after.
        { at: how.top + how.pin * 0.88, x: w * 0.5, y: h * 0.17, size: S * 0.46, flip: false },
        { at: proof.top, x: w * 0.87, y: h * 0.56, size: S * 0.6, flip: true },
        { at: proof.top + proof.pin, x: w * 0.87, y: h * 0.56, size: S * 0.6, flip: false },
        { at: team.top, x: w * 0.85, y: h * 0.19, size: S * 0.52, flip: true },
        { at: team.top + team.pin, x: w * 0.85, y: h * 0.19, size: S * 0.52, flip: false },
        // Lands in the contact screen's left column, under </>.
        { at: end, x: w * 0.12, y: h * 0.6, size: S * 0.62, flip: true },
    ];
    // Scroll positions must rise; a short page can squeeze two keys together.
    for (let i = 1; i < keys.length; i++) keys[i].at = Math.max(keys[i].at, keys[i - 1].at + 1);
    return keys;
}

export function FloatingLogo({ variant = "home" }: { variant?: "home" | "page" }) {
    const rootRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = rootRef.current;
        const body = bodyRef.current;
        if (!root || !body) return;

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const mobileQuery = window.matchMedia("(max-width: 767px)");

        let w = window.innerWidth;
        let h = window.innerHeight;
        let keys: Key[] = [];
        const measure = () => {
            w = window.innerWidth;
            h = window.innerHeight;
            keys = buildKeys(w, h, mobileQuery.matches, variant);
        };
        // Fonts, images and the nav's entrance all move things after first paint.
        const late = window.setTimeout(measure, 1600);
        // The first report arrives right after layout, so the first measure
        // costs no extra layout of its own.
        const ro = new ResizeObserver(() => measure());
        ro.observe(document.body);
        window.addEventListener("resize", measure);
        mobileQuery.addEventListener("change", measure);

        let px = w / 2;
        let py = h / 2;
        const onPointer = (e: PointerEvent) => {
            px = e.clientX;
            py = e.clientY;
        };
        window.addEventListener("pointermove", onPointer, { passive: true });

        let tiltX = 0;
        let tiltY = 0;
        let lean = 0;
        let lastY = window.scrollY;
        let lastT = 0;
        let lastRoot = "";
        let lastBody = "";
        let lastOpacity = "";
        const start = performance.now();
        let raf = 0;

        const frame = (now: number) => {
            raf = requestAnimationFrame(frame);
            if (keys.length < 2) return;
            const dt = lastT ? Math.min(64, now - lastT) : 16.7;
            lastT = now;
            const k = dt / 16.7;

            const Y = window.scrollY;
            let i = 0;
            while (i < keys.length - 2 && Y >= keys[i + 1].at) i++;
            const a = keys[i];
            const b = keys[i + 1];
            const t = clamp01((Y - a.at) / (b.at - a.at));
            const e = smooth(t);

            // The flight: eased position, a shallow hop, a coin-turn on Y. Only
            // a flight hops and turns — a hold (or a glide into the next
            // scene's spot) just eases.
            const flying = b.flip && !reduce;
            const arc = flying ? Math.sin(Math.PI * t) : 0;
            const x = lerp(a.x, b.x, e);
            const y = lerp(a.y, b.y, e) - arc * h * 0.06;
            const size = lerp(a.size, b.size, e) * (1 + 0.12 * arc);
            const spin = flying ? 360 * smooth(clamp01((t - 0.08) / 0.84)) : 0;

            // At rest: lean toward the pointer, and with the scroll.
            const vy = (Y - lastY) / dt;
            lastY = Y;
            const ease = 1 - Math.pow(1 - 0.08, k);
            const wantX = reduce ? 0 : Math.max(-12, Math.min(12, -((py - y) / h) * 26));
            const wantY = reduce ? 0 : Math.max(-14, Math.min(14, ((px - x) / w) * 30));
            const wantLean = reduce ? 0 : Math.max(-16, Math.min(16, vy * 6));
            tiltX += (wantX - tiltX) * ease;
            tiltY += (wantY - tiltY) * ease;
            lean += (wantLean - lean) * ease;

            const intro = reduce ? 1 : clamp01((now - start - 500) / 1100);
            const grow = reduce ? 1 : easeOutBack(intro);
            let opacity = Math.min(1, intro * 1.4);
            if (b.fade) opacity *= 1 - smooth(clamp01((t - 0.55) / 0.45));
            if (b.fade && Y >= b.at) opacity = 0;

            const rootT = `translate3d(${(x - BASE / 2).toFixed(1)}px, ${(y - BASE / 2).toFixed(1)}px, 0) scale(${((size / BASE) * grow).toFixed(4)})`;
            const bodyT = `rotateX(${(tiltX + lean).toFixed(2)}deg) rotateY(${(spin + tiltY).toFixed(2)}deg) rotateZ(${(lean * -0.35).toFixed(2)}deg)`;
            const op = opacity.toFixed(3);
            if (rootT !== lastRoot) root.style.transform = lastRoot = rootT;
            if (bodyT !== lastBody) body.style.transform = lastBody = bodyT;
            if (op !== lastOpacity) {
                root.style.opacity = lastOpacity = op;
                root.style.visibility = opacity <= 0.001 ? "hidden" : "visible";
            }
        };

        const onVisibility = () => {
            cancelAnimationFrame(raf);
            lastT = 0;
            if (document.visibilityState === "visible") raf = requestAnimationFrame(frame);
        };
        document.addEventListener("visibilitychange", onVisibility);
        raf = requestAnimationFrame(frame);

        return () => {
            cancelAnimationFrame(raf);
            window.clearTimeout(late);
            ro.disconnect();
            window.removeEventListener("resize", measure);
            mobileQuery.removeEventListener("change", measure);
            window.removeEventListener("pointermove", onPointer);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [variant]);

    return (
        <div ref={rootRef} className="float-logo" aria-hidden="true" style={{ opacity: 0 }}>
            <div className="float-logo__glow" />
            <div className="float-logo__shadow" />
            <div className="float-logo__bob">
                <div ref={bodyRef} className="float-logo__body">
                    {Array.from({ length: LAYERS }, (_, i) => (
                        <span
                            key={i}
                            className="float-logo__layer"
                            style={{ transform: `translateZ(${(-(i + 1) * LAYER_GAP).toFixed(1)}px)` }}
                        />
                    ))}
                    <span
                        className="float-logo__back"
                        style={{ transform: `translateZ(${(-(LAYERS + 1) * LAYER_GAP).toFixed(1)}px) rotateY(180deg)` }}
                    >
                        <svg viewBox="-16 -14 32 28" className="float-logo__back-hex">
                            <polygon points="15,0 7.5,12.99 -7.5,12.99 -15,0 -7.5,-12.99 7.5,-12.99" />
                        </svg>
                        <span className="float-logo__back-glyph">&lt;/&gt;</span>
                    </span>
                    <img
                        src="/logo/logo-mark-256.webp"
                        srcSet="/logo/logo-mark-256.webp 1x, /logo/logo-mark.webp 2x"
                        alt=""
                        className="float-logo__face"
                        draggable={false}
                    />
                </div>
            </div>
        </div>
    );
}
