"use client";

import React, { useEffect, useRef } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";

import { cn } from "@/lib/utils";
import { useScramble, type ScrambleOptions } from "./hooks";

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const;

/* ── ScrambleText ─────────────────────────────────────────────────────── */

type TextTag = "span" | "p" | "div" | "h1" | "h2" | "h3" | "li";

interface ScrambleTextProps extends ScrambleOptions {
    text: string;
    as?: TextTag;
    className?: string;
}

/**
 * Decodes `text` into place (see useScramble). The real text sits in an
 * sr-only twin so assistive tech reads it once, never the glyph noise.
 *
 * While it decodes, every character keeps a span of its own. Rendering the
 * runs directly reused one node for a different stretch of text each frame,
 * and the layout-shift metric counts a node whose start moves as a shift —
 * a notice that never visibly moved scored 0.26 CLS on phones. At rest (not
 * started, or done) it is a single run again.
 */
export function ScrambleText({ text, as: Tag = "span", className, ...options }: ScrambleTextProps) {
    const runs = useScramble(text, options);
    let content: React.ReactNode;
    if (runs.length === 1) {
        const [run] = runs;
        content = run.state === 2 ? run.text : <span className={run.state === 0 ? "opacity-0" : "scramble-glyph"}>{run.text}</span>;
    } else {
        const chars: React.ReactNode[] = [];
        for (const run of runs) {
            const cls = run.state === 0 ? "opacity-0" : run.state === 1 ? "scramble-glyph" : undefined;
            for (const ch of Array.from(run.text)) {
                chars.push(
                    <span key={chars.length} className={cls}>
                        {ch}
                    </span>,
                );
            }
        }
        content = chars;
    }
    return (
        <Tag className={className}>
            <span className="sr-only">{text}</span>
            <span aria-hidden="true">{content}</span>
        </Tag>
    );
}

/* ── WordReveal — scroll-linked ───────────────────────────────────────── */

interface WordRevealProps {
    text: string;
    progress: MotionValue<number>;
    /** Progress window over which the words light up, first to last. */
    range: [number, number];
    as?: TextTag;
    className?: string;
    /** Resting opacity of a word that has not lit yet. */
    dim?: number;
}

/**
 * Each word brightens as `progress` crosses its slice of `range`. One value
 * drives them all: progress is written to --p on the wrapper, and each word
 * maps its own slice (--a → --b) to an opacity in CSS (.word-reveal in
 * home.css). An animated component per word cost hydration time and a style
 * write per word on every scroll frame.
 */
export function WordReveal({ text, progress, range, as: Tag = "p", className, dim = 0.12 }: WordRevealProps) {
    const ref = useRef<HTMLSpanElement>(null);
    useMotionValueEvent(progress, "change", (v) => ref.current?.style.setProperty("--p", v.toFixed(4)));
    // The value it already holds (a page opened part-way down).
    useEffect(() => {
        ref.current?.style.setProperty("--p", progress.get().toFixed(4));
    }, [progress]);

    const words = text.split(" ");
    const [a, b] = range;
    const step = (b - a) / words.length;
    return (
        <Tag className={className}>
            <span className="sr-only">{text}</span>
            <span ref={ref} aria-hidden="true" className="word-reveal" style={{ "--dim": dim } as React.CSSProperties}>
                {words.map((word, i) => (
                    <React.Fragment key={i}>
                        <span
                            className="word-reveal__word"
                            style={{ "--a": a + step * i, "--b": a + step * (i + 1.6) } as React.CSSProperties}
                        >
                            {word}
                        </span>
                        {i < words.length - 1 ? " " : null}
                    </React.Fragment>
                ))}
            </span>
        </Tag>
    );
}

/* ── RiseText — time-based ────────────────────────────────────────────── */

/**
 * Each word rises out of its own clipped line box, staggered, once `play`
 * turns true. Used where a statement should land as a moment (page headers,
 * the contact vision) rather than track the scroll. The rise is a CSS
 * animation (.rise-text in home.css) started by a class, so the words cost no
 * animated components to hydrate.
 */
export function RiseText({
    text,
    play,
    as: Tag = "h2",
    className,
    id,
    delay = 0.15,
    stagger = 0.035,
}: {
    text: string;
    play: boolean;
    as?: "h1" | "h2" | "p";
    className?: string;
    id?: string;
    delay?: number;
    stagger?: number;
}) {
    const words = text.split(" ");
    return (
        <Tag id={id} className={cn(className, "rise-text", play && "rise-text--play")}>
            <span className="sr-only">{text}</span>
            <span aria-hidden="true">
                {words.map((word, i) => (
                    <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-top">
                        <span className="rise-text__word" style={{ animationDelay: `${delay + i * stagger}s` }}>
                            {word}
                        </span>
                        {i < words.length - 1 ? " " : null}
                    </span>
                ))}
            </span>
        </Tag>
    );
}

/* ── Orb ──────────────────────────────────────────────────────────────── */

/** A slowly shifting radial-gradient sphere in the brand's metals. */
export function Orb({
    palette = "brass",
    className,
}: {
    palette?: "brass" | "patina" | "ember";
    className?: string;
}) {
    return <div aria-hidden="true" className={cn("orb", `orb--${palette}`, className)} />;
}

/* ── Photo ────────────────────────────────────────────────────────────── */

/**
 * A photograph in the house treatment: monochrome, toned brass (or patina)
 * through a colour-blend layer, with a faint machined scanline. Stock colour
 * would fight the carbon/brass palette; toned, every photo reads as one set.
 */
export function Photo({
    src,
    alt,
    position,
    tone = "brass",
    className,
    eager = false,
}: {
    src: string;
    alt: string;
    position?: string;
    tone?: "brass" | "patina";
    className?: string;
    eager?: boolean;
}) {
    return (
        <div className={cn("photo", tone === "patina" && "photo--patina", className)}>
            <img
                src={src}
                alt={alt}
                loading={eager ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                style={position ? { objectPosition: position } : undefined}
            />
        </div>
    );
}

/* ── Notice — the message card used by the hero and the proof scene ───── */

interface NoticeProps {
    from: string;
    time: string;
    tone: "brass" | "carbon";
    children: React.ReactNode;
    className?: string;
}

export function Notice({ from, time, tone, children, className }: NoticeProps) {
    return (
        <div className={cn("notice", tone === "brass" ? "notice--brass" : "notice--carbon", className)}>
            <div className="notice__head">
                <span className="flex items-center gap-1.5">
                    <img src="/logo/logo-sm.webp" alt="" className="notice__mark" loading="lazy" decoding="async" />
                    From: {from}
                </span>
                <span>{time}</span>
            </div>
            <div className="notice__body">{children}</div>
        </div>
    );
}

/** Three pulsing hex dots — the product's loading mark, used here as "typing…". */
export function TypingDots({ className }: { className?: string }) {
    return (
        <span className={cn("inline-flex items-center gap-1.5", className)} role="status" aria-label="Typing">
            <span className="mh-hexdot" />
            <span className="mh-hexdot" />
            <span className="mh-hexdot" />
        </span>
    );
}
