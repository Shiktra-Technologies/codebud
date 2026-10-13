/*
 * Draws the brass ring off the main thread. <BrassRing> hands this worker its
 * canvas (transferControlToOffscreen) and then only forwards what changes —
 * viewport, scroll, pointer, section geometry. Creating the WebGL context,
 * compiling the shader and every frame's draw all happen here, away from the
 * thread that runs the page.
 */

import { createRingRenderer, type RingInput, type RingVariant } from "./brass-ring-renderer";

export type RingMessage =
    | { type: "init"; canvas: OffscreenCanvas; variant: RingVariant; reduce: boolean; inputs: RingInput[] }
    | RingInput;

// Typed by hand: pulling in the WebWorker lib alongside the DOM one clashes.
const scope = self as unknown as {
    onmessage: ((e: MessageEvent<RingMessage>) => void) | null;
    postMessage: (message: { type: "fallback" }) => void;
    requestAnimationFrame?: (cb: (now: number) => void) => number;
};

// Worker rAF follows the page's frames (and stops while the tab is hidden);
// a timer stands in where a browser lacks it.
const nextFrame = (cb: (now: number) => void) =>
    scope.requestAnimationFrame ? scope.requestAnimationFrame(cb) : setTimeout(() => cb(performance.now()), 16);

let ring: ReturnType<typeof createRingRenderer> = null;

const frame = (now: number) => {
    nextFrame(frame);
    ring?.frame(now);
};

scope.onmessage = (e) => {
    const m = e.data;
    if (m.type !== "init") {
        ring?.apply(m);
        return;
    }
    const fallback = () => scope.postMessage({ type: "fallback" });
    ring = createRingRenderer(m.canvas, { variant: m.variant, reduce: m.reduce, onFallback: fallback });
    if (!ring) {
        fallback();
        return;
    }
    for (const input of m.inputs) ring.apply(input);
    nextFrame(frame);
};
