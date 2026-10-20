"use client";

/*
 * The product demo, in two places in the Proof scene.
 *
 *   DemoBackdrop  the walkthrough playing muted, on a loop, dimmed behind the
 *                 thread — the platform itself as the evidence the messages
 *                 argue for. Desktop only, and only once the scene is near:
 *                 until then (and on phones, and under reduced motion) it is
 *                 the video's still frame.
 *   DemoDialog    the same video with sound and controls, in a modal, opened
 *                 from the picture-in-picture card (or the pill on phones).
 *
 * The background player is a youtube-nocookie embed driven over postMessage
 * (enablejsapi): it stays invisible until YouTube reports it is actually
 * playing, so its loading chrome never shows, and it pauses whenever the
 * scene is off screen or the modal is open.
 */

import { useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";

import { DEMO_VIDEO } from "./content";

const YT = "https://www.youtube-nocookie.com";

/*
 * The background loops only the platform footage: the demo opens on a few
 * seconds of browser chrome (an incognito tab) and closes on an outro, and
 * neither reads well dimmed behind the thread. `end` stops the player at the
 * out point; the ended event seeks it back to the in point.
 */
const LOOP_IN = 8;
const LOOP_OUT = 112;

function command(frame: HTMLIFrameElement | null, func: string, args: unknown[] = []) {
    frame?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), YT);
}

/* ── Background ───────────────────────────────────────────────────────── */

export function DemoBackdrop({ live, active }: { live: boolean; active: boolean }) {
    const frameRef = useRef<HTMLIFrameElement>(null);
    const [src, setSrc] = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [playing, setPlaying] = useState(false);

    // Built on the client: the API wants this page's origin.
    useEffect(() => {
        if (!live || src) return;
        const id = DEMO_VIDEO.id;
        const params = new URLSearchParams({
            autoplay: "1",
            mute: "1",
            start: String(LOOP_IN),
            end: String(LOOP_OUT),
            controls: "0",
            disablekb: "1",
            fs: "0",
            rel: "0",
            modestbranding: "1",
            iv_load_policy: "3",
            playsinline: "1",
            enablejsapi: "1",
            origin: window.location.origin,
        });
        setSrc(`${YT}/embed/${id}?${params}`);
    }, [live, src]);

    // Reveal only once YouTube says it is playing (state 1).
    useEffect(() => {
        if (!src) return;
        const onMessage = (e: MessageEvent) => {
            if (e.origin !== YT || e.source !== frameRef.current?.contentWindow) return;
            let data: { event?: string; info?: unknown } | null = null;
            try {
                data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
            } catch {
                return;
            }
            const state =
                data?.event === "infoDelivery"
                    ? (data.info as { playerState?: number } | undefined)?.playerState
                    : data?.event === "onStateChange"
                      ? data.info
                      : undefined;
            if (state === 1) setPlaying(true);
            if (state === 0) {
                // Reached LOOP_OUT — go round again from the in point.
                command(frameRef.current, "seekTo", [LOOP_IN, true]);
                command(frameRef.current, "playVideo");
            }
        };
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, [src]);

    // Backstop: if the API never reports in, show it anyway.
    useEffect(() => {
        if (!loaded) return;
        const id = window.setTimeout(() => setPlaying(true), 4000);
        return () => window.clearTimeout(id);
    }, [loaded]);

    useEffect(() => {
        if (loaded) command(frameRef.current, active ? "playVideo" : "pauseVideo");
    }, [active, loaded]);

    const onLoad = () => {
        // Subscribe to player events, then make sure it is muted and running.
        frameRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: "listening", id: "mcb-demo-backdrop", channel: "widget" }),
            YT,
        );
        command(frameRef.current, "mute");
        setLoaded(true);
    };

    return (
        <div className="demo-backdrop" aria-hidden="true" data-playing={playing || undefined}>
            <img className="demo-backdrop__poster" src={DEMO_VIDEO.poster} alt="" loading="lazy" decoding="async" />
            {src && (
                <div className="demo-backdrop__video">
                    <iframe
                        ref={frameRef}
                        src={src}
                        title={`${DEMO_VIDEO.title} (background, muted)`}
                        tabIndex={-1}
                        allow="autoplay; encrypted-media"
                        onLoad={onLoad}
                        className="demo-backdrop__frame"
                    />
                </div>
            )}
            <div className="demo-backdrop__shade" />
        </div>
    );
}

/* ── Triggers ─────────────────────────────────────────────────────────── */

/** Desktop: a framed picture-in-picture card. */
export function DemoCard({ onOpen }: { onOpen: () => void }) {
    return (
        <button type="button" className="demo-card mh-focus" onClick={onOpen} aria-haspopup="dialog">
            <span className="demo-card__thumb">
                <img src={DEMO_VIDEO.poster} alt="" loading="lazy" decoding="async" />
                <span aria-hidden="true" className="demo-card__play">
                    <svg viewBox="0 0 16 16">
                        <path d="M5 3.2v9.6L12.6 8z" />
                    </svg>
                </span>
            </span>
            <span className="demo-card__meta">
                <span className="demo-card__label">Product demo</span>
                <span className="demo-card__cta">
                    Watch with sound <span aria-hidden="true">↗</span>
                </span>
            </span>
            <span aria-hidden="true" className="demo-card__corner demo-card__corner--tl" />
            <span aria-hidden="true" className="demo-card__corner demo-card__corner--br" />
        </button>
    );
}

/** Phones: a compact pill. */
export function DemoPill({ onOpen }: { onOpen: () => void }) {
    return (
        <button type="button" className="demo-pill mh-focus" onClick={onOpen} aria-haspopup="dialog">
            <svg aria-hidden="true" viewBox="0 0 16 16">
                <path d="M5 3.2v9.6L12.6 8z" />
            </svg>
            Watch the demo
        </button>
    );
}

/* ── Player ───────────────────────────────────────────────────────────── */

export function DemoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const id = DEMO_VIDEO.id;
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="demo-dialog__overlay" />
                <Dialog.Content className="demo-dialog" aria-describedby={undefined}>
                    <div className="demo-dialog__bar">
                        <Dialog.Title className="demo-dialog__title">{DEMO_VIDEO.title}</Dialog.Title>
                        <Dialog.Close className="demo-dialog__close mh-focus">
                            Close <span aria-hidden="true">✕</span>
                        </Dialog.Close>
                    </div>
                    <div className="demo-dialog__frame">
                        {/* Mounted only while open, so closing stops playback outright. */}
                        {open && (
                            <iframe
                                src={`${YT}/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                                title={DEMO_VIDEO.title}
                                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                                allowFullScreen
                            />
                        )}
                    </div>
                    <a
                        href={`https://www.youtube.com/watch?v=${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="demo-dialog__yt mh-focus"
                    >
                        Open on YouTube <span aria-hidden="true">↗</span>
                    </a>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
