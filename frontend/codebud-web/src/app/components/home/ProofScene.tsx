"use client";

/*
 * Proof — 300svh, pinned. A short thread between a recruiter and MYCODEBUD.
 *
 * Messages land at fixed points in the scene's progress. Before each of
 * MYCODEBUD's replies the thread shows the product's hex-dot "typing" mark,
 * and the stack re-flows to make room for the incoming message — so the
 * thread always sits centred, and the newest message always sits lowest and
 * furthest right. Older messages step back: carbon instead of brass, dimmer.
 *
 * Behind the thread, the product demo plays muted — the platform itself as
 * the evidence — and a picture-in-picture card opens it with sound. Both fade
 * in with the stage's approach and out over the end of the pin, so the scene
 * still hands over softly in both directions.
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
import { PROOF_CAPTION, PROOF_DIFF, PROOF_MESSAGES } from "./content";
import { DemoBackdrop, DemoCard, DemoDialog, DemoPill } from "./DemoVideo";
import { useElementSize, useIsMobile } from "./hooks";
import { useLenis } from "./lenis";
import { EASE_OUT, Notice, Photo, ScrambleText, TypingDots } from "./primitives";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Top-left offsets from the stage centre, per number of slots in the thread,
 * laid out for a 900px-tall stage (shorter stages compress y). The second
 * message carries a photo, so it is the tall one in the middle of the stack.
 */
const DESKTOP: Record<number, [number, number][]> = {
    1: [[-210, -50]],
    2: [[-330, -230], [-150, -150]],
    3: [[-470, -330], [-330, -262], [-80, -128]],
};
// Phones: each older message keeps ~110px visible — enough for its header and
// both lines of a wrapped body — before the next one overlaps it.
const MOBILE: Record<number, [number, number][]> = {
    1: [[0, -50]],
    2: [[-6, -210], [6, -96]],
    3: [[-8, -372], [0, -258], [8, -108]],
};
/** How long before a reply lands the typing mark shows. */
const TYPING_LEAD = 0.09;

export function ProofScene() {
    const sectionRef = useRef<HTMLElement>(null);
    const [stageRef, { h }] = useElementSize<HTMLDivElement>();
    const mobile = useIsMobile();
    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
    // The approach: 0 as the stage's top reaches the bottom of the viewport, 1 as it pins.
    const { scrollYProgress: approach } = useScroll({ target: sectionRef, offset: ["start end", "start start"] });
    // One timeline for the whole scene: -0.25 → 0 on the way in, then the pin.
    const phase = useTransform([approach, scrollYProgress], ([a, p]: number[]) => (p > 0 ? p : (a - 1) * 0.25));

    // The caption arrives with the stage rather than sitting on it from the start.
    const captionOpacity = useTransform(approach, [0.4, 0.9], [0, 1]);
    const captionY = useTransform(approach, [0.4, 0.9], [14, 0]);

    /* ── the demo ── */
    const lenis = useLenis();
    const reduce = useReducedMotion();
    const [demoOpen, setDemoOpen] = useState(false);
    // Mount the background player once the scene is first approached, then keep it.
    const [near, setNear] = useState(false);
    useMotionValueEvent(approach, "change", (a) => {
        if (a > 0.01) setNear(true);
    });
    // Play only while some of the scene is on screen.
    const [onScreen, setOnScreen] = useState(false);
    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
        io.observe(el);
        return () => io.disconnect();
    }, []);
    // The page must not scroll behind the modal player.
    useEffect(() => {
        if (!lenis) return;
        if (demoOpen) lenis.stop();
        else lenis.start();
    }, [demoOpen, lenis]);
    // In on the approach, out over the last stretch of the pin.
    const demoOpacity = useTransform([approach, scrollYProgress], ([a, p]: number[]) =>
        clamp01((a - 0.15) / 0.6) * (1 - clamp01((p - 0.84) / 0.16)),
    );
    const demoVisibility = useTransform(demoOpacity, (v) => (v < 0.04 ? "hidden" : "visible"));

    const [state, setState] = useState({ count: 0, typing: false });
    useMotionValueEvent(phase, "change", (p) => {
        const count = PROOF_MESSAGES.filter((m) => m.at <= p).length;
        const next = PROOF_MESSAGES[count];
        const typing = !!next && next.typing && p >= next.at - TYPING_LEAD;
        setState((s) => (s.count === count && s.typing === typing ? s : { count, typing }));
    });

    const { count, typing } = state;
    const slots = Math.max(1, count + (typing ? 1 : 0));
    const table = mobile ? MOBILE : DESKTOP;
    // The tables are drawn for a 900px (desktop) / 844px (phone) stage.
    const sy = h ? Math.min(1, h / (mobile ? 844 : 900)) : 1;
    const layout = table[Math.min(3, slots)].map(([x, y]) => [x, y * sy] as [number, number]);
    // On mobile the cards are centred on x, so offsets are relative to a centred box.
    const cardW = mobile ? "min(86vw, 22rem)" : undefined;

    return (
        <section id="proof" ref={sectionRef} aria-labelledby="proof-title" className="relative h-[300svh]">
            <div ref={stageRef} className="sticky top-0 h-svh overflow-hidden">
                <motion.div className="absolute inset-0" style={{ opacity: demoOpacity }}>
                    <DemoBackdrop live={near && !mobile && !reduce} active={onScreen && !demoOpen} />
                </motion.div>

                <motion.div
                    className={mobile ? "demo-pill-slot" : "demo-card-slot"}
                    style={{ opacity: demoOpacity, visibility: demoVisibility }}
                >
                    {mobile ? (
                        <DemoPill onOpen={() => setDemoOpen(true)} />
                    ) : (
                        <DemoCard onOpen={() => setDemoOpen(true)} />
                    )}
                </motion.div>
                <DemoDialog open={demoOpen} onOpenChange={setDemoOpen} />

                <motion.h2
                    id="proof-title"
                    style={{ opacity: captionOpacity, y: captionY }}
                    className="scene-label absolute inset-x-0 top-7 px-6 text-center text-carbon-secondary max-md:hidden"
                >
                    {PROOF_CAPTION}
                </motion.h2>

                <ol aria-label="A conversation about proof" className="absolute inset-0">
                    <AnimatePresence>
                        {PROOF_MESSAGES.slice(0, count).map((msg, i) => {
                            const [ox, oy] = layout[i] ?? [0, 0];
                            const newest = i === count - 1 && !typing;
                            const mine = msg.from.startsWith("MYCODEBUD");
                            return (
                                <motion.li
                                    key={msg.id}
                                    className={cn("proof-msg", msg.visual && "proof-msg--wide")}
                                    style={mobile ? { width: cardW, marginLeft: `calc(${cardW} / -2)` } : undefined}
                                    // Older messages step back by dimming, not fading:
                                    // a translucent card lets the comb show through.
                                    initial={{ opacity: 0, x: ox + 24, y: oy + 36, scale: 0.94 }}
                                    animate={{
                                        opacity: 1,
                                        filter: newest ? "brightness(1)" : "brightness(0.62)",
                                        x: ox,
                                        y: oy,
                                        scale: 1,
                                    }}
                                    exit={{ opacity: 0, y: oy + 24, scale: 0.96 }}
                                    transition={{ duration: 0.7, ease: EASE_OUT }}
                                >
                                    <Notice
                                        from={msg.from}
                                        time={msg.time}
                                        tone={mine && newest ? "brass" : "carbon"}
                                        className="h-full"
                                    >
                                        <ScrambleText text={msg.body} duration={900} />
                                        {msg.image && <Photo {...msg.image} className="proof-photo" />}
                                        {msg.visual === "diff" && <ProofDiff />}
                                    </Notice>
                                </motion.li>
                            );
                        })}

                        {typing && (
                            <motion.li
                                key={`typing-${count}`}
                                className="proof-typing"
                                style={mobile ? { marginLeft: `calc(${cardW} / -2)` } : undefined}
                                initial={{ opacity: 0, scale: 0.8, x: layout[count][0], y: layout[count][1] + 12 }}
                                animate={{ opacity: 1, scale: 1, x: layout[count][0], y: layout[count][1] }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.35, ease: EASE_OUT }}
                            >
                                <span className="proof-typing__who">MYCODEBUD team</span>
                                <TypingDots className="text-brass-500" />
                            </motion.li>
                        )}
                    </AnimatePresence>
                </ol>
            </div>
        </section>
    );
}

/** The credentials-vs-proof table from the info document, as a diff. */
function ProofDiff() {
    return (
        <motion.ul
            className="proof-diff"
            initial="hidden"
            animate="shown"
            variants={{ shown: { transition: { staggerChildren: 0.09, delayChildren: 0.45 } } }}
        >
            {PROOF_DIFF.map((row, i) => (
                <motion.li
                    key={i}
                    className={cn(
                        "proof-diff__row",
                        row.sign === "-" && "proof-diff__row--del",
                        row.sign === "+" && "proof-diff__row--add",
                        row.sign === "//" && "proof-diff__row--note",
                    )}
                    variants={{
                        hidden: { opacity: 0, x: -8 },
                        shown: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE_OUT } },
                    }}
                >
                    <span className="proof-diff__sign" aria-hidden="true">
                        {row.sign}
                    </span>
                    <span className="proof-diff__text">{row.text}</span>
                </motion.li>
            ))}
        </motion.ul>
    );
}
