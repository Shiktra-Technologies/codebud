"use client";

/*
 * Team — 240svh with a pinned stage on desktop.
 *
 * The headline lights word by word while the stage scrolls in. Once pinned,
 * the first card — wide enough to read as the whole story — gives up width
 * and the other two slide in beside it until all three share the row.
 * Mobile drops the pin: the cards stack and the headline lights on its own.
 */

import { useRef } from "react";
import { cubicBezier, motion, useScroll, useTransform, type MotionValue } from "motion/react";

import { TEAM_CARDS, TEAM_HEADLINE, type TeamCard } from "./content";
import { useIsMobile } from "./hooks";
import { Orb, Photo, WordReveal } from "./primitives";

const easeInOut = cubicBezier(0.65, 0, 0.35, 1);
const THIRD = "calc((100% - 16px) / 3)";

export function TeamScene() {
    const mobile = useIsMobile();
    return mobile ? <TeamStacked /> : <TeamPinned />;
}

function TeamPinned() {
    const sectionRef = useRef<HTMLElement>(null);
    // From the section's top entering at the bottom of the viewport to the end of the pin.
    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end end"] });

    const spread = useTransform(scrollYProgress, [0.5, 0.84], [0, 1], { ease: easeInOut });
    const firstWidth = useTransform(spread, (v) => `calc(${92 - 58.6667 * v}% - ${(16 / 3) * v}px)`);

    return (
        <section id="team" ref={sectionRef} aria-labelledby="team-title" className="relative h-[240svh]">
            <div className="sticky top-0 flex h-svh flex-col justify-between gap-8 overflow-hidden px-4 pb-24 pt-6">
                <WordReveal
                    as="h2"
                    text={TEAM_HEADLINE}
                    progress={scrollYProgress}
                    range={[0.1, 0.4]}
                    className="team-headline"
                />
                <span id="team-title" className="sr-only">
                    The people behind MYCODEBUD
                </span>

                <div className="flex h-[50svh] min-h-[22rem] gap-2 overflow-hidden">
                    {TEAM_CARDS.map((card, i) => (
                        <TeamCardView
                            key={card.id}
                            card={card}
                            index={i}
                            width={i === 0 ? firstWidth : THIRD}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

function TeamStacked() {
    const headRef = useRef<HTMLHeadingElement>(null);
    const { scrollYProgress } = useScroll({ target: headRef, offset: ["start 0.9", "end 0.45"] });

    return (
        <section id="team" aria-labelledby="team-title" className="relative px-4 pb-28 pt-24">
            <span id="team-title" className="sr-only">
                The people behind MYCODEBUD
            </span>
            <div ref={headRef}>
                <WordReveal as="h2" text={TEAM_HEADLINE} progress={scrollYProgress} range={[0, 1]} className="team-headline" />
            </div>
            <div className="mt-10 flex flex-col gap-2">
                {TEAM_CARDS.map((card, i) => (
                    <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <TeamCardView card={card} index={i} width="100%" />
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

/** The same three cards, laid out statically in a row — for the About page. */
export function TeamGrid() {
    return (
        <div className="team-grid">
            {TEAM_CARDS.map((card, i) => (
                <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                >
                    <TeamCardView card={card} index={i} width="100%" />
                </motion.div>
            ))}
        </div>
    );
}

function TeamCardView({
    card,
    index,
    width,
}: {
    card: TeamCard;
    index: number;
    width: string | MotionValue<string>;
}) {
    return (
        <motion.article className="team-card" style={{ width }}>
            {card.image && (
                <Photo {...card.image} tone={card.orb === "patina" ? "patina" : "brass"} className="team-card__photo" />
            )}

            <div className="relative z-10 flex items-start justify-between gap-4">
                <Orb palette={card.orb} className="team-orb" />
                <span className="scene-label text-carbon-tertiary">{String(index + 1).padStart(2, "0")}</span>
            </div>

            {card.members && (
                // The comb's own extruded cell (theme.css .hex-stack/.hex-badge), one per person.
                <ul aria-hidden="true" className="team-hexes">
                    {card.members.map((m) => (
                        <li key={m.initials} className="hex-stack team-hex">
                            <span className="hex-badge h-full w-full">{m.initials}</span>
                        </li>
                    ))}
                </ul>
            )}

            <div className="relative z-10 mt-auto">
                <h3 className="team-card__title">{card.title}</h3>
                <p className="team-card__lead">{card.lead}</p>

                {card.members && (
                    <ul className="team-roster">
                        {card.members.map((m) => (
                            <li key={m.name}>
                                <span className="text-carbon-bone">{m.name}</span>
                                <span className="text-carbon-secondary">{m.role}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {card.chips && (
                    <ul className="team-chips">
                        {card.chips.map((c) => (
                            <li key={c} className="team-chip">
                                {c}
                            </li>
                        ))}
                    </ul>
                )}

                {card.partners && (
                    <ul className="team-partners">
                        {card.partners.map((p) => (
                            <li key={p.name}>
                                <span className="text-carbon-bone">{p.name}</span>
                                <span className="text-carbon-secondary">{p.city}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {card.note && <p className="team-card__note">{card.note}</p>}
            </div>
        </motion.article>
    );
}
