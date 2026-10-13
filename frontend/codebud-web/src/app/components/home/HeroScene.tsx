"use client";

/*
 * Hero — 220svh with a pinned stage.
 *
 *   load        the wordmark decodes letter by letter across the full width,
 *               the ring blooms open behind it, the first notice drops in.
 *   0 → .22     two more notices arrive; the newest is always brass, older
 *               ones fall back to carbon and take the time they arrived.
 *   .30 → .46   wordmark and notices lift and blur away; the ring fades.
 *   .48 → .86   the problem statement lights up word by word.
 */

import { useEffect, useRef, useState } from "react";
import {
    AnimatePresence,
    motion,
    useMotionValueEvent,
    useReducedMotion,
    useScroll,
    useTransform,
} from "motion/react";

import { cn } from "@/lib/utils";
import { HERO_NOTICES, HERO_PROBLEM, WORDMARK, WORDMARK_SPLIT } from "./content";
import { GLYPHS } from "./hooks";
import { EASE_OUT, Notice, ScrambleText, WordReveal } from "./primitives";

/** "4:57 PM". Formatted by hand: the first Intl/toLocale call loads locale
 *  data and blocked the main thread for ~50ms, for a string this simple. */
const clock = () => {
    const d = new Date();
    const h = d.getHours();
    return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

/*
 * The wordmark decode, scheduled up front and played by CSS (.hero-letter in
 * home.css) — so the letters land from the first paint instead of waiting
 * for the page's JavaScript to hydrate. Same rhythm as useScramble: letter i
 * starts at 160 + 80i ms, cycles a fresh glyph every 45ms, and locks after
 * 20–45% of 780ms. The glyphs are seeded rather than random so the server and
 * client render the same markup.
 */
const GLYPH_MS = 45;

function seeded(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const DECODE = Array.from(WORDMARK, (ch, i) => {
    const rand = seeded(i * 7919 + 17);
    const start = 160 + i * 80;
    const steps = Math.ceil((780 * (0.2 + rand() * 0.25)) / GLYPH_MS);
    const glyphs = Array.from({ length: steps }, () => GLYPHS[(rand() * GLYPHS.length) | 0]);
    return { ch, start, glyphs, lock: start + steps * GLYPH_MS };
});

/** True until the hero first mounts: that mount hydrates the server's page,
 *  whose intro began at the first paint. */
let firstMount = true;

function WordmarkLetter({ index }: { index: number }) {
    const { ch, start, glyphs, lock } = DECODE[index];
    return (
        <span className={cn("hero-letter", index >= WORDMARK_SPLIT && "text-brass-500")}>
            {glyphs.map((g, k) => (
                <span key={k} className="hero-letter__glyph" style={{ animationDelay: `${start + k * GLYPH_MS}ms` }}>
                    {g}
                </span>
            ))}
            <span className="hero-letter__char" style={{ animationDelay: `${lock}ms` }}>
                {ch}
            </span>
        </span>
    );
}

export function HeroScene() {
    const ref = useRef<HTMLElement>(null);
    const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

    /* ── notices ── */
    const [introReady, setIntroReady] = useState(false);
    const [unlocked, setUnlocked] = useState(1);
    const stamps = useRef<Record<string, string>>({});

    // The first notice drops in 1.5s into the intro. The wordmark's decode is
    // CSS and starts at the first paint, so the notice is timed from there
    // too, not from hydration — on a slow phone hydration lands seconds after
    // the paint, and the notice (the largest text there, so its LCP) waited
    // 1.5s more on top.
    useEffect(() => {
        // After a client-side navigation the intro starts at mount instead.
        const painted = performance.getEntriesByName("first-contentful-paint")[0]?.startTime;
        const from = firstMount && painted !== undefined ? painted : performance.now();
        firstMount = false;
        const wait = reduce ? 0 : Math.max(0, from + 1500 - performance.now());
        const id = window.setTimeout(() => setIntroReady(true), wait);
        return () => window.clearTimeout(id);
    }, [reduce]);

    useMotionValueEvent(scrollYProgress, "change", (p) => {
        const n = HERO_NOTICES.filter((notice) => notice.at <= p).length;
        setUnlocked((prev) => (prev === n ? prev : n));
    });

    const count = introReady ? Math.max(1, unlocked) : 0;
    const visible = HERO_NOTICES.slice(0, count);

    // Stamped when each one first lands; shown once a newer one replaces "Now".
    useEffect(() => {
        for (const n of HERO_NOTICES.slice(0, count)) stamps.current[n.id] ??= clock();
    }, [count]);

    /* ── scroll choreography ── */
    const fade = useTransform(scrollYProgress, [0.3, 0.46], [1, 0]);
    const lift = useTransform(scrollYProgress, [0.3, 0.46], [0, -56]);
    const blur = useTransform(scrollYProgress, [0.3, 0.46], ["blur(0px)", "blur(12px)"]);

    const problemY = useTransform(scrollYProgress, [0.4, 0.62], [56, 0]);
    const problemOpacity = useTransform(scrollYProgress, [0.38, 0.48], [0, 1]);
    const labelOpacity = useTransform(scrollYProgress, [0.44, 0.52], [0, 1]);
    const codaOpacity = useTransform(scrollYProgress, [0.86, 0.94], [0, 1]);
    const codaY = useTransform(scrollYProgress, [0.86, 0.94], [12, 0]);

    return (
        <section id="home" ref={ref} aria-labelledby="hero-title" className="relative h-[220svh]">
            <div className="sticky top-0 h-svh overflow-hidden">
                {/* Scrim so the letters hold their contrast where the ring crosses the top edge. */}
                <div aria-hidden="true" className="hero-scrim" />

                <motion.div style={{ opacity: fade, y: lift, filter: blur }} className="absolute inset-0">
                    <h1 id="hero-title" className="hero-wordmark">
                        <span className="sr-only">MYCODEBUD — proof, not paperwork.</span>
                        <span aria-hidden="true" className="contents">
                            {DECODE.map((_, i) => (
                                <WordmarkLetter key={i} index={i} />
                            ))}
                        </span>
                    </h1>

                    <ol aria-label="Messages from the MYCODEBUD team" className="hero-notices">
                        <AnimatePresence initial={false}>
                            {visible.map((notice, i) => {
                                const newest = i === visible.length - 1;
                                return (
                                    <motion.li
                                        key={notice.id}
                                        layout
                                        initial={{ opacity: 0, y: -18, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                        transition={{ duration: 0.55, ease: EASE_OUT }}
                                    >
                                        <Notice
                                            from="MYCODEBUD team"
                                            time={newest ? "Now" : (stamps.current[notice.id] ?? "")}
                                            tone={newest ? "brass" : "carbon"}
                                        >
                                            <ScrambleText text={notice.body} duration={1000} />
                                        </Notice>
                                    </motion.li>
                                );
                            })}
                        </AnimatePresence>
                    </ol>

                    <div className="hero-corner hero-corner--left">
                        <span className="text-brass-500">&lt;/&gt;</span> A Shiktra Technologies LLP venture
                    </div>
                    <div className="hero-corner hero-corner--right">
                        Scroll to explore
                        <span aria-hidden="true" className="hero-scroll-line" />
                    </div>
                </motion.div>

                {/* The problem statement — lit by scroll, after the wordmark clears. */}
                <motion.div
                    style={{ y: problemY, opacity: problemOpacity }}
                    className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center"
                >
                    <motion.p style={{ opacity: labelOpacity }} className="scene-label mb-6 text-brass-500">
                        {HERO_PROBLEM.label}
                    </motion.p>
                    <WordReveal
                        as="h2"
                        text={HERO_PROBLEM.text}
                        progress={scrollYProgress}
                        range={[0.48, 0.86]}
                        dim={0.1}
                        className="scene-statement max-w-[22ch]"
                    />
                    <motion.p style={{ opacity: codaOpacity, y: codaY }} className="scene-mono mt-8 text-carbon-secondary">
                        {HERO_PROBLEM.coda}
                    </motion.p>
                </motion.div>
            </div>
        </section>
    );
}
