"use client";

/*
 * Machined Hive — displaced honeycomb wave.
 *
 * The comb, drawn cell by cell, with a ring travelling from beyond the corners
 * to the centre that LIFTS each hexagon as it passes. Cells rise and their
 * outlines brighten at the crest, so the surface has real relief rather than a
 * shading trick painted over a flat tiling.
 *
 * WHY CANVAS AND NOT THE SVG PATTERN. The ambient plate is one <pattern> tile
 * the renderer repeats, so every tile is identical by construction and no cell
 * can move independently. Drawing the cells as individual SVG or DOM elements
 * would mean ~500 of them at a laptop window and ~3,200 at 4K, each animating a
 * transform on the main thread every frame. On canvas the same grid is a
 * handful of draws: cells are bucketed by how far the wave has lifted them and
 * each bucket is one path, so a frame costs ~2 draws per bucket whatever the
 * cell count.
 *
 * OFF THE MAIN THREAD. Even as a handful of draws, rebuilding ~570 cells (3,200
 * at 4K) every frame cost the main thread 3–7ms a frame, on top of everything
 * the scroll scenes do in the same frame. So the canvas is handed to a worker
 * (transferControlToOffscreen) and painted there. The drawing itself lives in
 * honeycomb-wave-painter.ts, shared with a main-thread fallback for browsers
 * that cannot hand a canvas over.
 *
 * IT PAINTS THE WHOLE COMB, opaquely, over the static SVG plate rather than
 * beside it. Compositing a moving band on top of the plate would leave every
 * displaced cell's flat original showing underneath it.
 *
 * OUTLINES, NOT A PUNCHED-OUT BACKING — a deliberate departure from the
 * plate's construction (§A2), which lays down a brass backing and paints the
 * cells over it so the gutter is whatever the cells do not cover. That works
 * beautifully while the cells are fixed and fails as soon as they move: a cell
 * lifted 11px vacates an 11px band of raw backing, so every displaced cell
 * leaves a yellow patch behind it and the wave reads as blotches of fill
 * rather than a moving surface. Here each cell is filled with the comb colour
 * and its outline stroked, so the gutter travels WITH the cell and stays one
 * line wide at any displacement.
 *
 * That reintroduces the hazard §A2 avoided: a stroked tiling draws every shared
 * edge twice, and two overlapping translucent strokes composite to a brighter
 * seam — the tiling picks up a plaid. The fix is to stroke in OPAQUE colours,
 * pre-composited over the canvas ink, so drawing an edge twice is
 * indistinguishable from drawing it once.
 *
 * Colours are read from the design tokens at mount, so theme.css stays the one
 * source of truth and this never hard-codes the palette.
 */

import { useEffect, useRef } from "react";

import { BUCKETS, createWavePainter, type WaveInks } from "./honeycomb-wave-painter";
import type { WaveMessage } from "./honeycomb-wave.worker";

/** How far the outline brightens toward the crest brass at the peak of the
 *  wave. The displacement is the effect; this is a highlight on top of it. */
const GLOW = 0.85;

type Ink = [number, number, number, number];

function readToken(styles: CSSStyleDeclaration, name: string, fallback: string) {
    return styles.getPropertyValue(name).trim() || fallback;
}

/** Scratch 1×1 context, reused across calls, used only to make the engine
 *  convert a colour to device sRGB. Created lazily so this module stays safe
 *  to import on the server. */
let inkProbe: CanvasRenderingContext2D | null = null;

/**
 * Any CSS colour → [r,g,b,a] in sRGB, converted BY THE BROWSER.
 *
 * Hand-parsing this is a trap, and so is reading `color` back off a DOM probe.
 * The palette is authored natively in OKLCH (§B1/§B2) and getComputedStyle
 * serialises an OKLCH-authored colour AS OKLCH — `oklch(0.146 0.006 75)` — so
 * pulling three numbers out of it with a regex reads lightness, chroma and HUE
 * as r, g and b. `--carbon-canvas` came back as rgb(0,0,75) and the whole comb
 * rendered navy. Nothing in the palette is blue; the parser invented it.
 *
 * The engine will only hand back sRGB numbers if it is made to rasterise, so
 * the colour is painted into a 1×1 canvas and the pixel read back. That works
 * for every colour space the browser understands and stays correct if the
 * palette is re-authored in another one.
 *
 * Legacy hex/rgb() inputs skip the rasterise: `fillStyle` normalises those to
 * `#rrggbb` / `rgba(…)` losslessly, whereas a readback of a translucent fill
 * goes through premultiplied storage and comes back a shade off.
 */
function resolveColour(input: string, fallback: Ink): Ink {
    if (typeof document === "undefined") return fallback;

    if (!inkProbe) {
        const scratch = document.createElement("canvas");
        scratch.width = 1;
        scratch.height = 1;
        inkProbe = scratch.getContext("2d", { willReadFrequently: true });
    }
    if (!inkProbe) return fallback;

    // A rejected fillStyle is silently ignored, leaving the previous value, so
    // validity is checked where an invalid colour is actually reported: the
    // style object drops it.
    const validity = document.createElement("span").style;
    validity.color = input;
    if (!validity.color) return fallback;

    inkProbe.fillStyle = input;
    const normalised = inkProbe.fillStyle as string;

    const legacy = normalised.match(
        /^#([0-9a-f]{6})$|^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)$/i,
    );
    if (legacy) {
        if (legacy[1]) {
            const n = parseInt(legacy[1], 16);
            return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
        }
        return [
            parseFloat(legacy[2]),
            parseFloat(legacy[3]),
            parseFloat(legacy[4]),
            legacy[5] === undefined ? 1 : parseFloat(legacy[5]),
        ];
    }

    // Modern syntax (oklch, lab, color(...)): rasterise and read the pixel.
    inkProbe.clearRect(0, 0, 1, 1);
    inkProbe.fillRect(0, 0, 1, 1);
    const px = inkProbe.getImageData(0, 0, 1, 1).data;
    const a = px[3] / 255;
    if (a === 0) return fallback;
    // Storage is premultiplied; undo it so the ink matches the authored colour.
    return [px[0] / a, px[1] / a, px[2] / a, a];
}

/** Flatten a translucent ink onto an opaque one. Everything this component
 *  strokes is opaque, so a doubled edge cannot brighten. */
function flatten(fg: Ink, bg: Ink): Ink {
    const a = fg[3];
    return [
        fg[0] * a + bg[0] * (1 - a),
        fg[1] * a + bg[1] * (1 - a),
        fg[2] * a + bg[2] * (1 - a),
        1,
    ];
}

function mixInk(a: Ink, b: Ink, t: number): Ink {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, 1];
}

const css = (c: Ink) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;

/** The comb's inks, resolved from the design tokens. */
function readInks(): WaveInks {
    const styles = getComputedStyle(document.documentElement);
    const canvasInk = resolveColour(
        readToken(styles, "--carbon-canvas", "#0C0A08"), [12, 10, 8, 1]);
    const combInk = resolveColour(
        readToken(styles, "--carbon-comb", "#12100E"), [18, 16, 14, 1]);
    const gutterInk = resolveColour(
        readToken(styles, "--carbon-comb-edge", "rgba(242,183,5,0.22)"), [242, 183, 5, 0.22]);
    const crestInk = resolveColour(
        readToken(styles, "--comb-wave-brass", "rgba(242,183,5,0.72)"), [242, 183, 5, 0.72]);

    // Opaque equivalents. The resting outline is exactly what the plate's
    // translucent backing resolves to, so canvas and plate agree at rest.
    const gutterRest = flatten(gutterInk, canvasInk);
    const crestSolid = flatten(crestInk, canvasInk);

    /*
     * Per-bucket inks, precomputed — none of this runs per frame.
     *
     * THE CELL FILLS STAY DARK. §A2 makes the gutter the subject and the
     * cells merely the ground it runs between; lighting the fills toward
     * brass inverts that and the comb stops reading as a comb — it becomes
     * a field of glowing tiles. A lifted cell lightens barely at all; the
     * light goes into its OUTLINE.
     */
    const fills: string[] = [];
    const strokes: string[] = [];
    for (let b = 0; b < BUCKETS; b++) {
        const t = b / (BUCKETS - 1); // 0 = at rest, 1 = on the crest
        fills.push(css(mixInk(combInk, crestInk, Math.max(0, t - 0.4) * 0.12)));
        strokes.push(css(mixInk(gutterRest, crestSolid, t * GLOW)));
    }
    return { canvas: css(canvasInk), fills, strokes };
}

/*
 * Workers already painting a canvas. A canvas hands itself to a worker only
 * once, and React's dev StrictMode unmounts and remounts on the same element —
 * so a worker outlives a cleanup that is followed by a remount, and ends only
 * once its canvas has really left the page.
 */
const painting = new WeakMap<HTMLCanvasElement, Worker>();

/** Start the wave on its canvas; returns the teardown. */
function startWave(canvas: HTMLCanvasElement): (() => void) | undefined {
    const root = document.documentElement;
    const isOff = () => root.getAttribute("data-honey") === "off";
    const view = () => ({
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
    // The element's own size; the backing store is the painter's.
    const fit = () => {
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
    };
    fit();

    let worker = painting.get(canvas);
    if (!worker && typeof Worker !== "undefined" && "transferControlToOffscreen" in canvas) {
        let w: Worker | undefined;
        try {
            w = new Worker(new URL("./honeycomb-wave.worker.ts", import.meta.url));
            const offscreen = canvas.transferControlToOffscreen();
            const init: WaveMessage = { type: "init", canvas: offscreen, inks: readInks(), ...view(), paused: isOff() };
            w.postMessage(init, [offscreen]);
            painting.set(canvas, w);
            worker = w;
        } catch {
            w?.terminate();
        }
    }

    // rAF stops while the tab is hidden anyway; restarting the clock when
    // it comes back stops the wave jumping a long way.
    if (worker) {
        const w = worker;
        const post = (m: WaveMessage) => w.postMessage(m);
        const onResize = () => {
            fit();
            post({ type: "resize", ...view() });
        };
        const onVisibility = () => {
            if (!document.hidden) post({ type: "restart" });
        };
        const honey = new MutationObserver(() => post({ type: isOff() ? "pause" : "resume" }));
        honey.observe(root, { attributes: true, attributeFilter: ["data-honey"] });
        window.addEventListener("resize", onResize);
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            honey.disconnect();
            window.removeEventListener("resize", onResize);
            document.removeEventListener("visibilitychange", onVisibility);
            window.setTimeout(() => {
                if (canvas.isConnected) return;
                w.terminate();
                painting.delete(canvas);
            }, 0);
        };
    }

    // No worker for this canvas: the same painter on the main thread.
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return; // no 2d context — the SVG plate underneath still shows
    const painter = createWavePainter(ctx, readInks());
    const size = () => {
        const v = view();
        painter.resize(v.width, v.height, v.dpr);
    };
    size();

    let start = performance.now();
    let raf = 0;
    const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (isOff()) return;
        painter.draw((now - start) / 1000);
    };
    const onResize = () => {
        fit();
        size();
    };
    const onVisibility = () => {
        if (!document.hidden) start = performance.now();
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(frame);

    return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVisibility);
    };
}

export function HoneycombWave() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        // Started in a task of its own, just after hydration's: reading the
        // tokens and handing the canvas to its worker cost ~12ms (~50ms on a
        // throttled phone) that would otherwise land on the hydration commit.
        let stop: (() => void) | undefined;
        const begin = window.setTimeout(() => {
            stop = startWave(canvas);
        }, 0);
        return () => {
            window.clearTimeout(begin);
            stop?.();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="comb-canvas"
            style={{ position: "absolute", inset: 0, display: "block" }}
        />
    );
}
