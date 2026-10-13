"use client";

/*
 * Story — 320svh, pinned. Four tall cards on a horizontal track.
 *
 * Scroll is split into one slice per card. Entering a slice steps the track
 * one column left (time-based, not scrubbed — it should read as a cut, not a
 * pan) while the incoming card rises into the centre column. The story-style
 * bars at the top of each card are the one scrubbed element: the current
 * segment fills with scroll so the reader can see how far the next cut is.
 */

import { useEffect, useRef, useState } from "react";
import {
    animate,
    motion,
    useMotionValue,
    useMotionValueEvent,
    useScroll,
    useTransform,
    type MotionValue,
} from "motion/react";

import { cn } from "@/lib/utils";
import { STORY_CARDS, STORY_CODE, type StoryCard } from "./content";
import { useElementSize, useIsMobile } from "./hooks";
import { EASE_IN_OUT, EASE_OUT, Orb, Photo, ScrambleText } from "./primitives";

const N = STORY_CARDS.length;
const GAP = 8;
const EDGE = 16;

export function StoryScene() {
    const sectionRef = useRef<HTMLElement>(null);
    const [stageRef, { w }] = useElementSize<HTMLDivElement>();
    const mobile = useIsMobile();
    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

    const [active, setActive] = useState(0);
    useMotionValueEvent(scrollYProgress, "change", (p) => {
        const i = Math.min(N - 1, Math.max(0, Math.floor(p * N)));
        setActive((prev) => (prev === i ? prev : i));
    });

    // Desktop: three columns, the live card in the middle one. Mobile: one
    // card, the previous one peeking at the left edge.
    const col = w ? (mobile ? Math.min(w - 48, 460) : (w - EDGE * 2 - GAP * 2) / 3) : 0;
    const target = (w - col) / 2 - active * (col + GAP);

    const x = useMotionValue(0);
    const placed = useRef(false);
    useEffect(() => {
        if (!w) return;
        if (!placed.current) {
            placed.current = true;
            x.set(target);
            return;
        }
        const controls = animate(x, target, { duration: 0.95, ease: EASE_IN_OUT });
        return () => controls.stop();
    }, [target, w, x]);

    return (
        <section
            id="story"
            ref={sectionRef}
            aria-label="Our story"
            className="relative"
            style={{ height: `${100 + N * 56}svh` }}
        >
            <div ref={stageRef} className="sticky top-0 h-svh overflow-hidden">
                <motion.ol style={{ x }} className="absolute inset-y-0 left-0 flex" aria-label="How MYCODEBUD began">
                    {STORY_CARDS.map((card, i) => (
                        <motion.li
                            key={card.id}
                            className="story-slot"
                            style={col ? { width: col, marginRight: GAP } : { marginRight: GAP }}
                            initial={false}
                            animate={{ y: i <= active ? "0%" : "104%" }}
                            transition={{ duration: 0.95, ease: EASE_IN_OUT }}
                        >
                            <StoryCardView card={card} seen={i <= active} progress={scrollYProgress} />
                        </motion.li>
                    ))}
                </motion.ol>
            </div>
        </section>
    );
}

/* ── Card ─────────────────────────────────────────────────────────────── */

const TONE: Record<StoryCard["variant"], string> = {
    brass: "story-card--brass",
    orb: "story-card--carbon",
    comb: "story-card--patina",
    code: "story-card--elevated",
    photo: "story-card--photo",
};

function StoryCardView({
    card,
    seen,
    progress,
}: {
    card: StoryCard;
    seen: boolean;
    progress: MotionValue<number>;
}) {
    return (
        <article className={cn("story-card", TONE[card.variant])}>
            {card.variant === "photo" && card.image && (
                <>
                    <Photo {...card.image} className="absolute inset-0" />
                    {/* Carbon at both ends so the title and the lines hold their contrast. */}
                    <div aria-hidden="true" className="story-card__scrim" />
                </>
            )}
            <StoryBars progress={progress} />

            <div className="relative z-10 flex items-start justify-between gap-4">
                <p className="scene-label opacity-70">{card.eyebrow}</p>
            </div>

            {card.title && (
                <motion.h3
                    className="story-card__title relative z-10"
                    initial={false}
                    animate={seen ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                    transition={{ duration: 0.8, delay: seen ? 0.25 : 0, ease: EASE_OUT }}
                >
                    {card.title}
                </motion.h3>
            )}
            {card.lead && (
                <ScrambleText
                    as="p"
                    text={card.lead}
                    active={seen}
                    duration={1000}
                    delay={200}
                    className="story-card__lead relative z-10"
                />
            )}

            <div className="story-card__visual">
                {card.variant === "brass" && <CombCluster />}
                {card.variant === "orb" && <Orb palette="brass" className="story-orb" />}
                {card.variant === "comb" && <div aria-hidden="true" className="comb-drift" />}
                {card.variant === "code" && <TypedCode play={seen} />}
            </div>

            <div className="relative z-10 mt-auto space-y-3">
                {card.lines.map((line, i) => (
                    <ScrambleText
                        key={line}
                        as="p"
                        text={line}
                        active={seen}
                        duration={1100}
                        delay={350 + i * 160}
                        className="scene-mono"
                    />
                ))}
            </div>
        </article>
    );
}

/* ── Story bars ───────────────────────────────────────────────────────── */

function StoryBars({ progress }: { progress: MotionValue<number> }) {
    return (
        <div aria-hidden="true" className="story-bars">
            {STORY_CARDS.map((card, j) => (
                <Segment key={card.id} index={j} progress={progress} />
            ))}
        </div>
    );
}

function Segment({ index, progress }: { index: number; progress: MotionValue<number> }) {
    const scaleX = useTransform(progress, [index / N, (index + 1) / N], [0, 1]);
    return (
        <span className="story-bar">
            <motion.span className="story-bar__fill" style={{ scaleX }} />
        </span>
    );
}

/* ── Visuals ──────────────────────────────────────────────────────────── */

/** Seven flat-top cells — the comb's own geometry, drawn as a single cluster. */
function CombCluster() {
    const s = 34;
    const h = Math.sqrt(3) * s;
    const cells: [number, number][] = [
        [0, 0],
        [0, -h],
        [0, h],
        [1.5 * s, -h / 2],
        [1.5 * s, h / 2],
        [-1.5 * s, -h / 2],
        [-1.5 * s, h / 2],
    ];
    const hex = (cx: number, cy: number, r: number) =>
        Array.from({ length: 6 }, (_, k) => {
            const a = (Math.PI / 3) * k;
            return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
        }).join(" ");
    return (
        <svg aria-hidden="true" viewBox="-110 -110 220 220" className="comb-cluster">
            {cells.map(([cx, cy], i) => (
                <polygon
                    key={i}
                    points={hex(cx, cy, s - 3)}
                    className={i === 0 ? "comb-cluster__core" : "comb-cluster__cell"}
                    style={{ animationDelay: `${i * 0.35}s` }}
                />
            ))}
            <text x="0" y="1" textAnchor="middle" dominantBaseline="middle" className="comb-cluster__glyph">
                {"</>"}
            </text>
        </svg>
    );
}

const TOTAL_CHARS = STORY_CODE.reduce((n, line) => n + line.reduce((m, t) => m + t.text.length, 0) + 1, 0);

/** The info document's cover snippet, typed out once the card is live. */
function TypedCode({ play }: { play: boolean }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!play) {
            setCount(0);
            return;
        }
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setCount(TOTAL_CHARS);
            return;
        }
        let raf = 0;
        const t0 = performance.now() + 450;
        const tick = (now: number) => {
            const c = Math.max(0, Math.floor((now - t0) / 22));
            setCount(Math.min(TOTAL_CHARS, c));
            if (c < TOTAL_CHARS) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [play]);

    // `left` counts down through the snippet; a line is the one being typed
    // while the count sits between its first character and its newline.
    let left = count;
    return (
        // A div, not <pre>: the honey cursor hands over to the native caret on
        // pre/code, and this block is decoration, not something to select.
        <div className="typed-code" aria-hidden="true">
            {STORY_CODE.map((line, li) => {
                const lineLen = line.reduce((m, t) => m + t.text.length, 0);
                const out = line.map((tok, ti) => {
                    const shown = tok.text.slice(0, Math.max(0, left));
                    left -= tok.text.length;
                    return shown ? (
                        <span key={ti} className={tok.tone ? `tok-${tok.tone}` : undefined}>
                            {shown}
                        </span>
                    ) : null;
                });
                const caretHere = play && left <= 0 && left >= -lineLen;
                left -= 1; // the newline
                return (
                    <span key={li} className="block min-h-[1.6em]">
                        {out}
                        {caretHere && <span className="typed-caret" />}
                    </span>
                );
            })}
        </div>
    );
}
