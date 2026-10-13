"use client";

/*
 * The header every other page opens with — the homepage's voice at page
 * scale: a decoding mono eyebrow, a display statement that rises word by word,
 * a lede, and an optional row of mono facts. BrassRing (variant "page") draws
 * its horizon along the bottom of this element, so it carries #page-hero.
 */

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { EASE_OUT, RiseText, ScrambleText } from "../home/primitives";

export interface PageHeroProps {
    eyebrow: string;
    title: string;
    lede?: string;
    /** Short facts under the lede — "Last updated", "Sections", … */
    meta?: { label: string; value: string }[];
    /** A shorter header, for reading pages (legal). */
    compact?: boolean;
}

export function PageHero({ eyebrow, title, lede, meta, compact = false }: PageHeroProps) {
    const reduce = useReducedMotion();
    const [play, setPlay] = useState(false);

    useEffect(() => {
        const id = window.setTimeout(() => setPlay(true), reduce ? 0 : 250);
        return () => window.clearTimeout(id);
    }, [reduce]);

    return (
        <header id="page-hero" className={cn("page-hero", compact && "page-hero--compact")}>
            <ScrambleText as="p" text={eyebrow} active={play} duration={700} className="scene-label text-brass-500" />
            <RiseText as="h1" text={title} play={play} delay={0.3} className="page-hero__title" />
            {lede && (
                <motion.p
                    className="page-hero__lede"
                    initial={{ opacity: 0, y: 14 }}
                    animate={play ? { opacity: 1, y: 0 } : undefined}
                    transition={{ duration: 0.8, delay: 0.9, ease: EASE_OUT }}
                >
                    {lede}
                </motion.p>
            )}
            {meta && meta.length > 0 && (
                <motion.dl
                    className="page-hero__meta"
                    initial={{ opacity: 0 }}
                    animate={play ? { opacity: 1 } : undefined}
                    transition={{ duration: 0.8, delay: 1.1 }}
                >
                    {meta.map((m) => (
                        <div key={m.label}>
                            <dt>{m.label}</dt>
                            <dd>{m.value}</dd>
                        </div>
                    ))}
                </motion.dl>
            )}
        </header>
    );
}
