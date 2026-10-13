/*
 * Paints the honeycomb wave off the main thread. <HoneycombWave> hands this
 * worker its canvas (transferControlToOffscreen) and then only forwards
 * viewport changes, pause/resume and a clock restart — the 570–3,200 cells a
 * frame never touch the thread that runs the page's scroll scenes.
 */

import { createWavePainter, type WaveInks } from "./honeycomb-wave-painter";

export type WaveMessage =
    | { type: "init"; canvas: OffscreenCanvas; inks: WaveInks; width: number; height: number; dpr: number; paused: boolean }
    | { type: "resize"; width: number; height: number; dpr: number }
    | { type: "pause" }
    | { type: "resume" }
    | { type: "restart" };

// Typed by hand: pulling in the WebWorker lib alongside the DOM one clashes.
const scope = self as unknown as {
    onmessage: ((e: MessageEvent<WaveMessage>) => void) | null;
    requestAnimationFrame?: (cb: (now: number) => void) => number;
    cancelAnimationFrame?: (id: number) => void;
};

// Worker rAF follows the page's frames (and stops while the tab is hidden);
// a timer stands in where a browser lacks it.
const nextFrame = (cb: (now: number) => void): number =>
    scope.requestAnimationFrame
        ? scope.requestAnimationFrame(cb)
        : (setTimeout(() => cb(performance.now()), 16) as unknown as number);
const cancelFrame = (id: number) => (scope.cancelAnimationFrame ? scope.cancelAnimationFrame(id) : clearTimeout(id));

let painter: ReturnType<typeof createWavePainter> | null = null;
let start = 0;
let raf = 0;
let paused = false;

const frame = (now: number) => {
    raf = nextFrame(frame);
    painter?.draw((now - start) / 1000);
};

const run = () => {
    if (!raf && !paused && painter) raf = nextFrame(frame);
};

scope.onmessage = (e) => {
    const m = e.data;
    switch (m.type) {
        case "init": {
            const ctx = m.canvas.getContext("2d", { alpha: false });
            if (!ctx) return; // the SVG plate underneath still shows
            painter = createWavePainter(ctx, m.inks);
            painter.resize(m.width, m.height, m.dpr);
            start = performance.now();
            paused = m.paused;
            run();
            break;
        }
        case "resize":
            painter?.resize(m.width, m.height, m.dpr);
            break;
        case "pause":
            paused = true;
            cancelFrame(raf);
            raf = 0;
            break;
        case "resume":
            paused = false;
            run();
            break;
        case "restart":
            start = performance.now();
            break;
    }
};
