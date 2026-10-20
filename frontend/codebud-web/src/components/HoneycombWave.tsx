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
 * each bucket is one Path2D, so a frame costs ~2 draws per bucket whatever the
 * cell count.
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

/* Geometry — identical to HoneycombField's plate (§A2 cell size). */
const S = 32.33; // circumradius
const H = Math.sqrt(3) * S; // ≈ 56 — row pitch
const COL_PITCH = 1.5 * S; // ≈ 48.5 — column pitch
const R = S - 0.6; // cell radius; the 0.6 is half the gutter
const GUTTER_W = 1.2; // stroke width, matching the plate's gutter

/** Seconds for one pass from beyond the corners to the centre, then a beat. */
const PERIOD = 7;
const HOLD = 0.08; // fraction of the period spent at rest before the next pass

/** How far past the far corner the ring starts, as a fraction of the diagonal. */
const START = 1.15;

/** Half-width of the band that is displaced, in pixels of radius. */
const BAND = 150;

/** Peak lift at the crest, in CSS pixels. Around a fifth of the row pitch —
 *  enough that the grid visibly breaks alignment along the ridge, not so much
 *  that cells detach from the comb and read as loose tiles. */
const LIFT = 11;

/** How far the outline brightens toward the crest brass at the peak of the
 *  wave. The displacement is the effect; this is a highlight on top of it. */
const GLOW = 0.85;

/** Brightness buckets. Enough steps that the ridge reads as smooth; few enough
 *  that a frame stays a handful of draws. */
const BUCKETS = 14;

type Cell = { x: number; y: number };
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

/** Hermite ease, for ramping the wave in and out. */
function smoothstep(edge0: number, edge1: number, x: number) {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

export function HoneycombWave() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return; // no 2d context — the SVG plate underneath still shows

        const root = document.documentElement;
        const styles = getComputedStyle(root);
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
        const canvasSolid = css(canvasInk);
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
        const fillByBucket: string[] = [];
        const strokeByBucket: string[] = [];
        for (let b = 0; b < BUCKETS; b++) {
            const t = b / (BUCKETS - 1); // 0 = at rest, 1 = on the crest
            fillByBucket.push(css(mixInk(combInk, crestInk, Math.max(0, t - 0.4) * 0.12)));
            strokeByBucket.push(css(mixInk(gutterRest, crestSolid, t * GLOW)));
        }

        let cells: Cell[] = [];
        let width = 0;
        let height = 0;
        let centreX = 0;
        let centreY = 0;
        let maxRadius = 0;

        const layout = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.lineWidth = GUTTER_W;
            ctx.lineJoin = "round";

            centreX = width / 2;
            centreY = height / 2;
            maxRadius = Math.hypot(centreX, centreY);

            // A row and column of overscan, so a lifted cell never uncovers an
            // edge of the grid.
            cells = [];
            const cols = Math.ceil(width / COL_PITCH) + 2;
            const rows = Math.ceil(height / H) + 3;
            for (let i = -1; i < cols; i++) {
                const x = i * COL_PITCH;
                const stagger = i % 2 === 0 ? H / 2 : 0;
                for (let k = -1; k < rows; k++) cells.push({ x, y: k * H + stagger });
            }
        };

        /* Flat-top hexagon. The slight scale with lift is what stops the rise
           reading as a flat slide upward. */
        const traceHex = (path: Path2D, x: number, y: number, scale: number) => {
            const r = R * scale;
            path.moveTo(x + r, y);
            for (let k = 1; k < 6; k++) {
                const a = (Math.PI / 180) * (60 * k);
                path.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
            }
            path.closePath();
        };

        let raf = 0;
        let start = performance.now();

        const frame = (now: number) => {
            raf = requestAnimationFrame(frame);
            if (root.getAttribute("data-honey") === "off") return;

            const elapsed = ((now - start) / 1000) % PERIOD;
            const progress = Math.min(elapsed / (PERIOD * (1 - HOLD)), 1);
            const ringRadius = (1 - progress) * maxRadius * START;

            /*
             * Amplitude envelope. Without it the ring reaches the centre still
             * at full strength and the wave does not end so much as switch off
             * — a whole ridge vanishing between one frame and the next. Ramping
             * the amplitude down over the last third lets the ripple die out as
             * it converges, which is what a real one does. The ramp in matters
             * far less (the ring enters from off-screen) but costs nothing.
             */
            const envelope = smoothstep(0, 0.08, progress) * (1 - smoothstep(0.66, 1, progress));

            ctx.fillStyle = canvasSolid;
            ctx.fillRect(0, 0, width, height);

            const paths: Path2D[] = [];
            for (let b = 0; b < BUCKETS; b++) paths.push(new Path2D());

            for (let i = 0; i < cells.length; i++) {
                const cell = cells[i];
                const offset = Math.hypot(cell.x - centreX, cell.y - centreY) - ringRadius;

                let lift = 0;
                if (offset > -BAND && offset < BAND) {
                    // Cosine bump: 0 at the band edges, 1 on the ring itself, so
                    // cells ease into and out of the wave rather than snapping
                    // up as it arrives.
                    lift = ((Math.cos((offset / BAND) * Math.PI) + 1) / 2) * envelope;
                }

                const bucket = Math.min(BUCKETS - 1, Math.round(lift * (BUCKETS - 1)));
                traceHex(paths[bucket], cell.x, cell.y - lift * LIFT, 1 + lift * 0.07);
            }

            // Ascending, so the least-lifted cells go down first and the crest
            // is painted last — a raised cell overlaps its neighbours from in
            // front, which is the whole point of raising it.
            for (let b = 0; b < BUCKETS; b++) {
                ctx.fillStyle = fillByBucket[b];
                ctx.fill(paths[b]);
                ctx.strokeStyle = strokeByBucket[b];
                ctx.stroke(paths[b]);
            }
        };

        layout();
        const onResize = () => layout();
        window.addEventListener("resize", onResize);

        // rAF is throttled while hidden anyway; this stops the clock jumping a
        // long way when the tab comes back.
        const onVisibility = () => {
            if (!document.hidden) start = performance.now();
        };
        document.addEventListener("visibilitychange", onVisibility);

        raf = requestAnimationFrame(frame);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", onResize);
            document.removeEventListener("visibilitychange", onVisibility);
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
