"use client";

/*
 * How it works — a dial. Pinned for one ~42svh slice per journey step.
 *
 * A circle far larger than the viewport sits with its crest at mid-screen, so
 * only a shallow arc shows. Each step owns a marker 36° apart on the rim;
 * scroll turns the dial so the markers pass, one by one, under a fixed sight
 * line at the crest. The step whose marker sits under the sight line names
 * the title above the arc and the copy below it.
 *
 * The rotation is scrubbed (it follows the wheel exactly); the copy swaps are
 * discrete, so text is never caught half-way between two steps.
 *
 * EXIT. The stage must be empty before it unpins: a dial clipped by the
 * stage's bottom edge, scrolling away, reads as a hard cut into the next
 * scene. So the last stretch of the pin is an exit — the copy lifts and blurs
 * out, then the dial keeps rolling and sets below the bottom edge like a
 * horizon going down. The stage also carries a soft bottom fade, so no edge
 * is ever drawn there in either scroll direction.
 */

import { useMemo, useRef, useState } from "react";
import {
    AnimatePresence,
    motion,
    useMotionValueEvent,
    useScroll,
    useTransform,
} from "motion/react";

import { cn } from "@/lib/utils";
import { JOURNEY, JOURNEY_CAPTION } from "./content";
import { useElementSize, useIsMobile } from "./hooks";
import { EASE_OUT, Photo, ScrambleText } from "./primitives";

const N = JOURNEY.length;
const STEP_DEG = 36;
/** Dead zone at the start so the first step holds for a beat. */
const LEAD = 0.035;
/** Pin progress where the last step arrives under the sight line … */
const TURN_END = 0.8;
/** … and where the exit begins (the copy starts lifting a touch earlier). */
const EXIT = 0.88;

const pad2 = (n: number) => String(n).padStart(2, "0");

export function JourneyScene() {
    const sectionRef = useRef<HTMLElement>(null);
    const [stageRef, { w, h }] = useElementSize<HTMLDivElement>();
    const mobile = useIsMobile();
    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

    // Keeps rolling a little past the last step while it sets.
    const rotate = useTransform(
        scrollYProgress,
        [LEAD, TURN_END, EXIT, 1],
        [0, -(N - 1) * STEP_DEG, -(N - 1) * STEP_DEG, -(N - 1) * STEP_DEG - 16],
    );

    const [active, setActive] = useState(0);
    useMotionValueEvent(scrollYProgress, "change", (p) => {
        const t = Math.min(1, Math.max(0, (p - LEAD) / (TURN_END - LEAD)));
        const i = Math.round(t * (N - 1));
        setActive((prev) => (prev === i ? prev : i));
    });

    const R = mobile ? Math.max(w * 1.3, 420) : Math.max(w * 0.8, 760);
    const crest = h * (mobile ? 0.55 : 0.53);

    /* ── exit ── */
    const setting = useTransform(scrollYProgress, [EXIT, 1], [0, 1]);
    // Accelerating, like something setting: the crest ends well below the fold.
    const dialY = useTransform(setting, (v) => v * v * (h - crest + 180));
    const dialOpacity = useTransform(setting, [0, 0.6, 1], [1, 0.75, 0]);
    const uiOpacity = useTransform(scrollYProgress, [EXIT - 0.02, EXIT + 0.05], [1, 0]);
    const uiY = useTransform(scrollYProgress, [EXIT - 0.02, EXIT + 0.06], [0, -40]);
    const uiBlurPx = useTransform(scrollYProgress, [EXIT - 0.02, EXIT + 0.05], [0, 10]);
    const uiFilter = useTransform(uiBlurPx, (v) => (v < 0.05 ? "none" : `blur(${v.toFixed(1)}px)`));
    const step = JOURNEY[active];
    // Phones: the photo takes the gap between the caption and the title, and
    // drops out entirely on screens too short to give it real height.
    const phonePhotoH = Math.min(212, crest - 72 - 150 - 84);

    return (
        <section
            id="how"
            ref={sectionRef}
            aria-labelledby="how-title"
            className="relative"
            style={{ height: `${150 + N * 42}svh` }}
        >
            <div ref={stageRef} className="journey-stage sticky top-0 h-svh overflow-hidden">
                {w > 0 && (
                    <motion.div
                        aria-hidden="true"
                        className="absolute"
                        style={{
                            width: R * 2,
                            height: R * 2,
                            left: w / 2 - R,
                            top: crest,
                            rotate,
                            y: dialY,
                            opacity: dialOpacity,
                        }}
                    >
                        <DialFace R={R} />
                    </motion.div>
                )}

                {/* Everything that reads — lifts and blurs out together on exit. */}
                <motion.div className="absolute inset-0" style={{ opacity: uiOpacity, y: uiY, filter: uiFilter }}>
                    <h2 id="how-title" className="scene-label absolute inset-x-0 top-7 px-6 text-center text-carbon-secondary">
                        {JOURNEY_CAPTION}
                    </h2>

                    {w > 0 && (
                        <>
                            {/* The step, photographed — every frame is stacked and
                                cross-faded, so a step change never waits on a load. */}
                            {(!mobile || phonePhotoH >= 110) && (
                                <figure
                                    className={cn("journey-photo", mobile && "journey-photo--phone")}
                                    style={mobile ? { top: 76, height: phonePhotoH } : { top: h * 0.13 }}
                                >
                                    {JOURNEY.map((s, i) => (
                                        <motion.div
                                            key={s.title}
                                            className="absolute inset-0"
                                            initial={false}
                                            animate={{ opacity: i === active ? 1 : 0, scale: i === active ? 1 : 1.06 }}
                                            transition={{ duration: 0.75, ease: EASE_OUT }}
                                        >
                                            <Photo {...s.image} className="absolute inset-0" />
                                        </motion.div>
                                    ))}
                                    <span aria-hidden="true" className="journey-photo__corner journey-photo__corner--tl" />
                                    <span aria-hidden="true" className="journey-photo__corner journey-photo__corner--tr" />
                                    <span aria-hidden="true" className="journey-photo__corner journey-photo__corner--bl" />
                                    <span aria-hidden="true" className="journey-photo__corner journey-photo__corner--br" />
                                    <figcaption className="journey-photo__cap">
                                        Fig. {pad2(active + 1)} — {step.tag}
                                    </figcaption>
                                </figure>
                            )}

                            {/* What this step gives you, and the one number that goes with it. */}
                            {!mobile && (
                                <aside className="journey-panel" style={{ top: h * 0.14 }}>
                                    <p className="scene-label text-brass-500">What you get</p>
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.ul
                                            key={active}
                                            className="journey-panel__list"
                                            initial="out"
                                            animate="in"
                                            exit="out"
                                            variants={{
                                                in: { transition: { staggerChildren: 0.06 } },
                                                out: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
                                            }}
                                        >
                                            {step.includes.map((item) => (
                                                <motion.li
                                                    key={item}
                                                    variants={{
                                                        in: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE_OUT } },
                                                        out: { opacity: 0, x: 10, transition: { duration: 0.2 } },
                                                    }}
                                                >
                                                    <span aria-hidden="true" className="text-brass-500">+</span>
                                                    {item}
                                                </motion.li>
                                            ))}
                                        </motion.ul>
                                    </AnimatePresence>
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.div
                                            key={active}
                                            className="journey-figure"
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.4, ease: EASE_OUT }}
                                        >
                                            <p className={cn("journey-figure__value", step.figure.mono && "is-mono")}>
                                                {step.figure.value}
                                            </p>
                                            <p className="journey-figure__label">{step.figure.label}</p>
                                        </motion.div>
                                    </AnimatePresence>
                                </aside>
                            )}

                            {/* Sight line + frame at the crest — fixed, the dial turns under it. */}
                            <div aria-hidden="true" className="journey-sight" style={{ top: crest }}>
                                <span className="journey-sight__line" />
                                <motion.span
                                    className="journey-sight__frame"
                                    key={active}
                                    initial={{ scale: 1.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.45, ease: EASE_OUT }}
                                />
                            </div>

                            <div
                                className="journey-meta"
                                style={{ top: crest - 38 }}
                            >
                                <span>
                                    Step {pad2(active + 1)} / {pad2(N)}
                                </span>
                                <span className="flex items-center gap-2">
                                    <span aria-hidden="true" className="h-2 w-2" style={{ background: step.color }} />
                                    {step.tag}
                                </span>
                            </div>

                            <div
                                className="absolute inset-x-0 flex justify-center px-6"
                                style={{ bottom: h - crest + 72 }}
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.h3
                                        key={active}
                                        className="journey-title"
                                        initial={{ opacity: 0, y: 22, filter: "blur(10px)" }}
                                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                        exit={{ opacity: 0, y: -16, filter: "blur(10px)" }}
                                        transition={{ duration: 0.42, ease: EASE_OUT }}
                                    >
                                        {step.title}
                                    </motion.h3>
                                </AnimatePresence>
                            </div>

                            {/* Lower on phones: the arc is steeper there, so the step
                                numbers on either side of the crest ride higher. */}
                            <div
                                className="absolute inset-x-0 flex justify-center px-6"
                                style={{ top: crest + (mobile ? 92 : 58) }}
                            >
                                <ScrambleText
                                    key={active}
                                    as="p"
                                    text={step.body}
                                    duration={850}
                                    className="journey-body"
                                />
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </section>
    );
}

/* ── Dial face ────────────────────────────────────────────────────────── */

function DialFace({ R }: { R: number }) {
    const size = R * 2;
    const rim = R - 1;

    // Static geometry — only rebuilt when the dial is resized.
    const ticks = useMemo(() => {
        const out: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];
        for (let deg = 0; deg < 360; deg += 2) {
            const major = deg % 10 === 0;
            const len = major ? 14 : 6;
            const a = (deg * Math.PI) / 180;
            const sin = Math.sin(a);
            const cos = Math.cos(a);
            out.push({
                x1: R + (rim - 4) * sin,
                y1: R - (rim - 4) * cos,
                x2: R + (rim - 4 - len) * sin,
                y2: R - (rim - 4 - len) * cos,
                major,
            });
        }
        return out;
    }, [R, rim]);

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} overflow="visible" className="block">
            <circle cx={R} cy={R} r={rim} className="journey-dial__body" />
            <circle cx={R} cy={R} r={rim} className="journey-dial__glow" />
            <circle cx={R} cy={R} r={rim} className="journey-dial__rim" />
            {ticks.map((t, i) => (
                <line
                    key={i}
                    x1={t.x1}
                    y1={t.y1}
                    x2={t.x2}
                    y2={t.y2}
                    className={t.major ? "journey-dial__tick journey-dial__tick--major" : "journey-dial__tick"}
                />
            ))}
            {JOURNEY.map((s, i) => {
                const deg = i * STEP_DEG;
                const a = (deg * Math.PI) / 180;
                const x = R + rim * Math.sin(a);
                const y = R - rim * Math.cos(a);
                // Numbers ride inside the rim, below the ticks — outside, the
                // live one would sit on the sight line.
                const lx = R + (rim - 36) * Math.sin(a);
                const ly = R - (rim - 36) * Math.cos(a);
                return (
                    <g key={s.title}>
                        <rect
                            x={x - 5}
                            y={y - 5}
                            width={10}
                            height={10}
                            fill={s.color}
                            transform={`rotate(${deg} ${x} ${y})`}
                        />
                        <text
                            x={lx}
                            y={ly}
                            className="journey-dial__label"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            transform={`rotate(${deg} ${lx} ${ly})`}
                        >
                            {pad2(i + 1)}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}
