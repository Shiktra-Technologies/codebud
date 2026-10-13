"use client";

/*
 * BrassRing — the hero's light ring, and the horizon behind the contact scene.
 *
 * One fixed, full-viewport WebGL canvas behind the page (z -1, above the
 * honeycomb plate). A single fragment shader draws a ring of light whose edge
 * disperses into the brand metals: a hot bone core, brass body, ember outside,
 * patina inside. Scroll scrubs its geometry:
 *
 *   hero      the ring frames the viewport, swells and slides off as the hero
 *             scrolls, then fades out under the problem statement.
 *   contact   it comes back as a vast arc rising from the bottom edge.
 *
 * Everything between those two is honeycomb only: the ring draws nothing (and
 * skips the GPU entirely) while its alpha is zero.
 *
 * Output is premultiplied with alpha = brightest channel, so the dark parts of
 * the frame are transparent and the comb shows through instead of being
 * painted over with black.
 *
 * OFF THE MAIN THREAD. The canvas is handed to a worker
 * (transferControlToOffscreen) that runs brass-ring-renderer.ts; this
 * component only tells it what changes — viewport, scroll, pointer, and where
 * the hero and contact sections sit. Creating the WebGL context alone blocked
 * the main thread for 130–580ms during page load, and compiling the shader
 * added up to 150ms more. Browsers that cannot hand a WebGL canvas to a worker
 * run the same renderer here instead.
 */

import { useEffect, useRef, useState } from "react";

import { createRingRenderer, ringDpr, type RingInput, type RingRenderer, type RingVariant } from "./brass-ring-renderer";
import type { RingMessage } from "./brass-ring.worker";
import { useLenis } from "./lenis";

/*
 * Canvases already handed to a worker. A canvas can be transferred only once,
 * and React's dev StrictMode unmounts and remounts on the same element — so a
 * worker outlives a cleanup that is followed by a remount, and ends (freeing
 * its GPU context) only once its canvas has really left the page.
 */
const drawing = new WeakMap<HTMLCanvasElement, Worker>();

/**
 * `home` frames the homepage hero (#home) as a ring. `page` is for the other
 * pages: a horizon under their header (#page-hero) that scrolls and fades
 * away with it. Both bring the horizon back behind #contact at the end.
 */
export function BrassRing({ variant = "home" }: { variant?: RingVariant }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fallback, setFallback] = useState(false);
    const lenis = useLenis();
    const sendRef = useRef<((input: RingInput) => void) | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set up in a task of its own, just after hydration's commit: starting
        // the worker and handing it the canvas cost ~6ms (~25ms on a throttled
        // phone) that would otherwise lengthen the commit, the longest task of
        // the load.
        const setUp = (): (() => void) => {
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            const view = (): RingInput => {
                const width = window.innerWidth;
                const height = window.innerHeight;
                return { type: "view", width, height, dpr: ringDpr(width, height, window.devicePixelRatio) };
            };
            // Section geometry, in document coordinates.
            const geometry = (): RingInput => {
                const hero = document.getElementById(variant === "page" ? "page-hero" : "home")?.getBoundingClientRect();
                const contact = document.getElementById("contact")?.getBoundingClientRect();
                const y = window.scrollY;
                return {
                    type: "geometry",
                    heroTop: hero ? hero.top + y : 0,
                    heroH: hero ? Math.max(1, hero.height) : 1,
                    heroLen: hero ? Math.max(1, hero.height - window.innerHeight) : 1,
                    contactTop: contact ? contact.top + y : Infinity,
                };
            };

            let send: (input: RingInput) => void;
            let stop: () => void;

            let worker = drawing.get(canvas);
            if (!worker && typeof Worker !== "undefined" && "transferControlToOffscreen" in canvas) {
                let w: Worker | undefined;
                try {
                    w = new Worker(new URL("./brass-ring.worker.ts", import.meta.url));
                    const offscreen = canvas.transferControlToOffscreen();
                    const init: RingMessage = {
                        type: "init",
                        canvas: offscreen,
                        variant,
                        reduce,
                        inputs: [view(), { type: "scroll", y: window.scrollY }],
                    };
                    w.postMessage(init, [offscreen]);
                    drawing.set(canvas, w);
                    worker = w;
                } catch {
                    w?.terminate();
                }
            }

            if (worker) {
                const w = worker;
                w.onmessage = (e: MessageEvent<{ type: string }>) => {
                    if (e.data?.type === "fallback") setFallback(true);
                };
                send = (input) => w.postMessage(input);
                stop = () =>
                    window.setTimeout(() => {
                        if (canvas.isConnected) return;
                        w.terminate();
                        drawing.delete(canvas);
                    }, 0);
            } else {
                /*
                 * No worker canvas: the same renderer on this thread, set up in a
                 * task of its own just after hydration's, so creating the context
                 * does not land on the hydration commit.
                 */
                let ring: RingRenderer | null = null;
                let raf = 0;
                const latest = new Map<RingInput["type"], RingInput>();
                send = (input) => {
                    if (ring) ring.apply(input);
                    else latest.set(input.type, input);
                };
                const frame = (now: number) => {
                    raf = requestAnimationFrame(frame);
                    ring?.apply({ type: "scroll", y: window.scrollY });
                    ring?.frame(now);
                };
                const begin = window.setTimeout(() => {
                    ring = createRingRenderer(canvas, { variant, reduce, onFallback: () => setFallback(true) });
                    if (!ring) {
                        setFallback(true);
                        return;
                    }
                    for (const input of latest.values()) ring.apply(input);
                    raf = requestAnimationFrame(frame);
                }, 0);
                const onVisibility = () => {
                    cancelAnimationFrame(raf);
                    raf = 0;
                    if (document.visibilityState === "visible" && ring) raf = requestAnimationFrame(frame);
                };
                document.addEventListener("visibilitychange", onVisibility);
                stop = () => {
                    window.clearTimeout(begin);
                    cancelAnimationFrame(raf);
                    document.removeEventListener("visibilitychange", onVisibility);
                    const r = ring;
                    r?.dispose();
                    // Free the GPU context only once the canvas has really left the
                    // page. React's dev StrictMode remounts on this same canvas;
                    // losing the context there handed that remount a dead one, so
                    // every page reached by navigation fell back to the CSS ring.
                    window.setTimeout(() => {
                        if (!canvas.isConnected) r?.release();
                    }, 0);
                };
            }

            sendRef.current = send;
            send(view());
            // Section geometry comes from the observer, which reports right after
            // layout (its first report included) — reading it during mount would
            // force an extra layout in the middle of hydration.
            const ro = new ResizeObserver(() => send(geometry()));
            ro.observe(document.body);
            const onResize = () => send(view());
            const onScroll = () => send({ type: "scroll", y: window.scrollY });
            const onPointer = (e: PointerEvent) =>
                send({ type: "pointer", x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 });
            window.addEventListener("resize", onResize);
            window.addEventListener("scroll", onScroll, { passive: true });
            window.addEventListener("pointermove", onPointer, { passive: true });

            return () => {
                sendRef.current = null;
                ro.disconnect();
                window.removeEventListener("resize", onResize);
                window.removeEventListener("scroll", onScroll);
                window.removeEventListener("pointermove", onPointer);
                stop();
            };
        };

        let stop: (() => void) | undefined;
        const deferred = window.setTimeout(() => {
            stop = setUp();
        }, 0);
        return () => {
            window.clearTimeout(deferred);
            stop?.();
        };
    }, [variant]);

    // Lenis moves the page from its own frame loop; passing its position on as
    // it sets it saves the frame a scroll event would otherwise wait for.
    useEffect(() => {
        if (!lenis) return;
        return lenis.on("scroll", (l) => sendRef.current?.({ type: "scroll", y: l.animatedScroll }));
    }, [lenis]);

    return (
        <>
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 h-full w-full"
                style={{ zIndex: -1 }}
            />
            {fallback && <div aria-hidden="true" className="ring-fallback" />}
        </>
    );
}
