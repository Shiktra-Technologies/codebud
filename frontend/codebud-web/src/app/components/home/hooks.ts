"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

/* ── Element size ─────────────────────────────────────────────────────── */

/**
 * Live content-box size of an element. 0×0 until the first measurement.
 * Updates land in a transition: the re-render a size triggers is a whole
 * scene laying itself out, and as a transition it yields instead of blocking
 * the main thread right after hydration.
 */
export function useElementSize<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [size, setSize] = useState({ w: 0, h: 0 });

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            startTransition(() => setSize((s) => (s.w === width && s.h === height ? s : { w: width, h: height })));
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return [ref, size] as const;
}

/* ── Media query ──────────────────────────────────────────────────────── */

/** Set once the first page has hydrated; anything mounted after that can
 *  start from the real value. */
let hydrated = false;

/**
 * `initial` on the server and through hydration. The real value follows in a
 * transition, so a switch of layout is an interruptible re-render, not a
 * blocking one inside hydration (which is what useSyncExternalStore made it —
 * up to ~600ms of main thread on a throttled phone). Components mounted
 * later, as after a client-side navigation, read the real value straight away.
 */
export function useMediaQuery(query: string, initial = false) {
    const [matches, setMatches] = useState(() => (hydrated ? window.matchMedia(query).matches : initial));

    useEffect(() => {
        hydrated = true;
        const mql = window.matchMedia(query);
        const update = () => startTransition(() => setMatches(mql.matches));
        update();
        mql.addEventListener("change", update);
        return () => mql.removeEventListener("change", update);
    }, [query]);

    return matches;
}

/**
 * The phone layout (below the md breakpoint). The server renders it, so a
 * phone hydrates the markup it is going to keep; a desktop switches to its
 * layout after hydration instead, where the re-render costs about a quarter of
 * what it costs a phone — and the scenes it touches are all below the fold.
 */
export const useIsMobile = () => useMediaQuery("(max-width: 767px)", true);

/* ── Text scramble ────────────────────────────────────────────────────── */

/**
 * Only glyphs that never add a line-break opportunity mid-word (letters,
 * digits, and symbols of the same Unicode line-break classes, plus openers).
 * "/" or "}" can end a line, so a word holding one mid-decode wrapped early
 * and then jumped back once it resolved — a layout shift every few frames.
 */
export const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>{[=*#_@&";
const glyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

/** 0 = not shown yet, 1 = cycling glyphs, 2 = resolved. */
export type ScrambleState = 0 | 1 | 2;
export interface ScrambleRun {
    text: string;
    state: ScrambleState;
}

export interface ScrambleOptions {
    /** Start (or keep) the effect running. While false the text rests in `from`. */
    active?: boolean;
    /** "hidden" types the text in from nothing; "text" scrambles text already on screen. */
    from?: "hidden" | "text";
    /** Rough length of the whole effect, ms. */
    duration?: number;
    delay?: number;
    /** Change this to replay the effect without changing the text. */
    replayKey?: unknown;
}

/** Spaces and break points (hyphens, dashes, slashes) never scramble: they
 *  decide where lines wrap, and a hyphen hidden under a glyph mid-decode
 *  rewrapped the whole notice on phones, line by line, every few frames. */
const isBlank = (ch: string) => /[\s\-‐–—/]/.test(ch);

function rest(text: string, state: ScrambleState): ScrambleRun[] {
    return [{ text, state }];
}

/**
 * Characters arrive left to right as cycling glyphs and lock onto the real
 * letter a beat later. Glyphs only re-roll every ~45ms — re-rolling every
 * frame reads as noise rather than as a decode.
 *
 * Output is a list of runs rather than a string: unresolved characters keep
 * their real letter in the layout (invisible) so line breaks never jump while
 * the text decodes.
 */
export function useScramble(
    text: string,
    { active = true, from = "hidden", duration = 900, delay = 0, replayKey }: ScrambleOptions = {},
): ScrambleRun[] {
    const reduce = useReducedMotion();
    const restState: ScrambleState = from === "hidden" ? 0 : 2;
    const [runs, setRuns] = useState<ScrambleRun[]>(() => rest(text, restState));

    useEffect(() => {
        if (reduce) {
            setRuns(rest(text, active || from === "text" ? 2 : 0));
            return;
        }
        if (!active) {
            setRuns(rest(text, restState));
            return;
        }

        const chars = Array.from(text);
        const n = Math.max(1, chars.length);
        // Arrival is spread over the first ~55% of the duration; each character
        // then scrambles for 20–45% of it before locking.
        const appear = chars.map((_, i) => (from === "text" ? 0 : (i / n) * duration * 0.55));
        const resolve = appear.map(
            (a, i) => a + duration * (0.2 + Math.random() * 0.25) + (from === "text" ? (i / n) * duration * 0.5 : 0),
        );
        const cache = chars.map(() => glyph());

        let raf = 0;
        let lastRoll = 0;
        const t0 = performance.now() + delay;

        const tick = (now: number) => {
            const t = now - t0;
            if (t < 0) {
                raf = requestAnimationFrame(tick);
                return;
            }
            if (now - lastRoll > 45) {
                for (let i = 0; i < cache.length; i++) cache[i] = glyph();
                lastRoll = now;
            }

            const next: ScrambleRun[] = [];
            let done = true;
            for (let i = 0; i < chars.length; i++) {
                const ch = chars[i];
                let state: ScrambleState;
                let out = ch;
                if (isBlank(ch)) {
                    state = 2;
                } else if (t >= resolve[i]) {
                    state = 2;
                } else if (t >= appear[i]) {
                    state = 1;
                    out = cache[i];
                    done = false;
                } else {
                    state = 0;
                    done = false;
                }
                const last = next[next.length - 1];
                if (last && last.state === state) last.text += out;
                else next.push({ text: out, state });
            }

            setRuns(next);
            if (!done) raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
        // restState is derived from `from`.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, active, from, duration, delay, replayKey, reduce]);

    return runs;
}
