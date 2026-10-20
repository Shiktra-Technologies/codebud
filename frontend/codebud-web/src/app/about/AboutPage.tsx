"use client";

/*
 * About — the story at reading pace, in the homepage's vocabulary: notices
 * for the founding team's words, toned photography for the three stages, the
 * ecosystem's seven layers as a bar list, the values, the team cards from the
 * homepage, and the numbers ticker. All copy is MYCODEBUD's own (the previous
 * About page and the info document).
 */

import { motion } from "motion/react";
import { Lightbulb, Sparkles, Target, Users } from "lucide-react";

import { PageLayout } from "../components/layout/PageLayout";
import { EASE_OUT, Notice, Photo } from "../components/home/primitives";
import { TeamGrid } from "../components/home/TeamScene";
import { TickerBand } from "../components/home/TickerBand";

/* ── Content ──────────────────────────────────────────────────────────── */

const STORY = [
    "MYCODEBUD started in 2025. Our founder shared the idea with our co-founder, who began building the first version alone — a single platform combining interactive lessons, real-world projects, and AI-powered feedback instead of scattered learning resources.",
    "As the platform took shape, more people joined. What began as one developer's side project became a small team building a DSA and aptitude catalogue deep enough to take someone from fundamentals all the way to interview-ready.",
    "MYCODEBUD is a subsidiary of Shiktra Technologies LLP, operating as a Udyam Registered, VTU Registered initiative recognised by the Govt. of Karnataka through K-TECH and the New Age Innovation Network — connecting students, colleges and companies inside one ecosystem.",
    "Every layer of it — guidance, mentorship, projects, DSA, interview preparation and hackathons — exists to produce something a student can point to and say, “I built this.”",
];

const NOTES = [
    {
        id: "first",
        time: "2025",
        body: "Make coding education so interactive and engaging that anyone can go from zero to shipping real products.",
    },
    {
        id: "mission",
        time: "Mission",
        body: "Move students from theory to practical capability — guidance, mentorship, meaningful projects, DSA, interview prep and hackathons — priced so access is never the barrier.",
    },
];

const STAGES = [
    {
        n: "01",
        title: "Learn",
        body: "Structured guidance and DSA fundamentals, aligned to what companies expect.",
        image: { src: "/images/home/step-02-learn.webp", alt: "A student working through digital logic on a whiteboard" },
    },
    {
        n: "02",
        title: "Build",
        body: "Novelty and core projects, reviewed by mentors, not left to guesswork.",
        image: { src: "/images/home/step-03-build.webp", alt: "Source code on a monitor" },
    },
    {
        n: "03",
        title: "Prove",
        body: "Hackathons, mock interviews and Demo Days that turn effort into evidence.",
        image: { src: "/images/home/step-06-hackathon.webp", alt: "Teams building at a hackathon" },
    },
];

/** The info document's seven ecosystem layers and their weights (sum: 100). */
const LAYERS = [
    { name: "Guidance & Direction", share: 10 },
    { name: "Mentorship", share: 15 },
    { name: "Core & Novelty Projects", share: 20 },
    { name: "DSA Practice", share: 15 },
    { name: "Interview Preparation", share: 15 },
    { name: "Hackathons & Competitions", share: 15 },
    { name: "Career & Placement Support", share: 10 },
];
const LAYER_MAX = Math.max(...LAYERS.map((l) => l.share));

const VALUES = [
    {
        icon: Target,
        title: "Proof Over Paperwork",
        body: "A certificate says you showed up. A project proves you can build. Everything here is designed to produce something a student can point to.",
    },
    {
        icon: Users,
        title: "Practitioners, Not Lecturers",
        body: "Mentors who have shipped code and sat on the other side of the interview table — across product companies, IT services, consulting and academia.",
    },
    {
        icon: Lightbulb,
        title: "Novelty-First Briefs",
        body: "Never the same copied project every batch turns in. Every brief is written to be defensible in an interview, with mentor code reviews at each stage.",
    },
    {
        icon: Sparkles,
        title: "Affordable By Design",
        body: "The full ecosystem at ₹99 a month — no separate paywalls for mentorship, projects or interview prep. Cost is never the reason a student sits out.",
    },
];

/* ── Pieces ───────────────────────────────────────────────────────────── */

function SectionHead({ id, label, title, lede }: { id: string; label: string; title: string; lede?: string }) {
    return (
        <motion.div
            className="section-head"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
        >
            <p className="scene-label text-brass-500">{label}</p>
            <h2 id={id} className="section-head__title">
                {title}
            </h2>
            {lede && <p className="section-head__lede">{lede}</p>}
        </motion.div>
    );
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export function AboutPage() {
    return (
        <PageLayout
            eyebrow="Our story"
            title="Students should graduate with proof, not a stack of certificates."
            lede="MYCODEBUD is built to close the distance between college, skills, practical experience and employability."
            meta={[
                { label: "Started", value: "2025" },
                { label: "Based in", value: "Bengaluru" },
                { label: "A venture of", value: "Shiktra Technologies LLP" },
            ]}
        >
            {/* ── The story, with the founding team's words pinned beside it ── */}
            <section className="page-section" aria-labelledby="about-story">
                <div className="about-story">
                    <div>
                        <p className="scene-label text-brass-500">From one shared idea</p>
                        <h2 id="about-story" className="section-head__title">
                            …to an ecosystem.
                        </h2>
                        <div className="about-story__body">
                            {STORY.map((p, i) => (
                                <motion.p
                                    key={i}
                                    initial={{ opacity: 0, y: 18 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-60px" }}
                                    transition={{ duration: 0.7, ease: EASE_OUT }}
                                >
                                    {p}
                                </motion.p>
                            ))}
                        </div>
                    </div>
                    <ol className="about-notes" aria-label="From the founding team">
                        {NOTES.map((note, i) => (
                            <motion.li
                                key={note.id}
                                initial={{ opacity: 0, y: -14, scale: 0.97 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true, margin: "-80px" }}
                                transition={{ duration: 0.6, delay: i * 0.35, ease: EASE_OUT }}
                            >
                                <Notice
                                    from="MYCODEBUD founding team"
                                    time={note.time}
                                    tone={i === NOTES.length - 1 ? "brass" : "carbon"}
                                >
                                    {note.body}
                                </Notice>
                            </motion.li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* ── Learn → Build → Prove ── */}
            <section className="page-section" aria-labelledby="about-stages">
                <SectionHead id="about-stages" label="The path" title="Learn. Build. Prove." />
                <ol className="stages">
                    {STAGES.map((s, i) => (
                        <motion.li
                            key={s.n}
                            className="stage"
                            initial={{ opacity: 0, y: 48 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.8, delay: i * 0.1, ease: EASE_OUT }}
                        >
                            <Photo {...s.image} className="absolute inset-0" />
                            <div aria-hidden="true" className="stage__scrim" />
                            <p className="scene-label relative z-10 text-brass-400">Stage {s.n}</p>
                            <div className="relative z-10 mt-auto">
                                <h3 className="stage__title">{s.title}</h3>
                                <p className="scene-mono mt-3 text-carbon-bone/90">{s.body}</p>
                            </div>
                        </motion.li>
                    ))}
                </ol>
            </section>

            {/* ── Seven layers ── */}
            <section className="page-section" aria-labelledby="about-layers">
                <div className="layers-wrap">
                    <div>
                        <p className="scene-label text-brass-500">The ecosystem</p>
                        <h2 id="about-layers" className="section-head__title">
                            Seven layers, one journey.
                        </h2>
                        <p className="section-head__lede">
                            Layers that reinforce each other — a student moves through direction, skill-building and
                            practical exposure until preparation becomes proof.
                        </p>
                        <p className="layers-figure">
                            <span className="layers-figure__value">7</span>
                            <span className="layers-figure__label">ecosystem layers</span>
                        </p>
                    </div>
                    <div>
                        <p className="layers-scale" aria-hidden="true">
                            <span>Share of the ecosystem</span>
                            <span>0–{LAYER_MAX}%</span>
                        </p>
                        <ol className="layers" aria-label="Each layer's share of the ecosystem">
                            {LAYERS.map((layer, i) => (
                                <li key={layer.name} className="layers__row">
                                    <span className="layers__name">
                                        <span className="layers__idx">{String(i + 1).padStart(2, "0")}</span>
                                        {layer.name}
                                    </span>
                                    <span aria-hidden="true" className="layers__track">
                                        <motion.span
                                            className="layers__bar"
                                            style={{ width: `${(layer.share / LAYER_MAX) * 100}%` }}
                                            initial={{ scaleX: 0 }}
                                            whileInView={{ scaleX: 1 }}
                                            viewport={{ once: true, margin: "-40px" }}
                                            transition={{ duration: 1, delay: 0.15 + i * 0.07, ease: EASE_OUT }}
                                        />
                                    </span>
                                    <span className="layers__value">{layer.share}%</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </section>

            {/* ── Values ── */}
            <section className="page-section" aria-labelledby="about-values">
                <SectionHead id="about-values" label="What drives us" title="The principles the whole ecosystem is built on." />
                <ul className="values">
                    {VALUES.map((v, i) => (
                        <motion.li
                            key={v.title}
                            className="value-card"
                            initial={{ opacity: 0, y: 32 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.7, delay: i * 0.08, ease: EASE_OUT }}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="hex-stack h-[2.8rem] w-[3.25rem]">
                                    <span className="hex-badge h-full w-full text-brass-400">
                                        <v.icon size={18} strokeWidth={1.6} />
                                    </span>
                                </div>
                                <span className="scene-label text-carbon-tertiary">{String(i + 1).padStart(2, "0")}</span>
                            </div>
                            <h3 className="value-card__title">{v.title}</h3>
                            <p className="value-card__body">{v.body}</p>
                        </motion.li>
                    ))}
                </ul>
            </section>

            {/* ── People ── */}
            <section className="page-section" aria-labelledby="about-team">
                <SectionHead
                    id="about-team"
                    label="The people behind it"
                    title="A small team, practitioner mentors, and a hiring network."
                />
                <TeamGrid />
            </section>

            <TickerBand />
        </PageLayout>
    );
}
