"use client";

/**
 * /learning-path — the personalized recommendation reveal experience.
 *
 * This is intentionally NOT a dashboard. It's the dedicated, cinematic
 * landing surface that makes the user feel the platform built something
 * for them specifically. It consumes the existing recommendations
 * snapshot — no new backend contract.
 *
 * Visual review needed: hero ring scale on small viewports, motion
 * cadence on top-match card, grid wrap thresholds.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
    Sparkles,
    ArrowRight,
    Check,
    Target,
    GraduationCap,
    Compass,
    Layers,
    Lock,
} from "lucide-react";

import { useAuth } from "@/lib/hooks/useAuth";
import { getToken } from "@/lib/apiClient";
import {
    fetchRecommendations,
    type RecommendedCourse,
} from "@/lib/services/recommendations";
import { formatReasons } from "@/lib/recommendationExplanation";
import { postRecommendationEvents } from "@/lib/services/recommendationEvents";

const ease = [0.16, 1, 0.3, 1] as const;

const DIFFICULTY_LABEL: Record<1 | 2 | 3, string> = {
    1: "Beginner",
    2: "Intermediate",
    3: "Advanced",
};

function formatTag(t: string) {
    return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ───────────────────────── Hero ──────────────────────────────────────

function MatchRing({ pct }: { pct: number }) {
    const size = 168;
    const stroke = 8;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const dash = (Math.max(0, Math.min(100, pct)) / 100) * c;

    return (
        <div className="relative h-[168px] w-[168px]">
            {/* Outer glow */}
            <motion.div
                aria-hidden
                className="absolute inset-0 rounded-full bg-amber-400/20 blur-3xl"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.55, scale: 1 }}
                transition={{ duration: 1.2, ease }}
            />
            <svg width={size} height={size} className="relative -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={stroke}
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="url(#match-grad)"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={c}
                    initial={{ strokeDashoffset: c }}
                    animate={{ strokeDashoffset: c - dash }}
                    transition={{ duration: 1.4, delay: 0.25, ease }}
                />
                <defs>
                    <linearGradient id="match-grad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.6, ease }}
                        className="font-mono text-[44px] font-bold leading-none tabular-nums text-amber-300 drop-shadow-[0_0_18px_rgba(251,191,36,0.45)]"
                    >
                        {pct}
                    </motion.div>
                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-400/70">
                        % personalized
                    </div>
                </div>
            </div>
        </div>
    );
}

function HeroChip({
    icon: Icon,
    label,
}: {
    icon: typeof Target;
    label: string;
}) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1 text-[11px] font-medium text-zinc-300 backdrop-blur">
            <Icon size={12} className="text-amber-400/80" />
            {label}
        </span>
    );
}

function Hero({
    displayName,
    topScore,
    chips,
}: {
    displayName: string;
    topScore: number;
    chips: { icon: typeof Target; label: string }[];
}) {
    return (
        <section className="relative overflow-hidden">
            {/* Background mesh */}
            <div
                aria-hidden
                className="absolute inset-0 -z-10"
                style={{
                    backgroundImage:
                        "radial-gradient(50% 50% at 50% 30%, rgba(251,191,36,0.10), transparent 70%), radial-gradient(40% 35% at 85% 80%, rgba(244,114,182,0.05), transparent 60%)",
                }}
            />
            <div
                aria-hidden
                className="absolute inset-0 -z-10 opacity-50"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
                    backgroundSize: "44px 44px",
                    maskImage:
                        "radial-gradient(circle at 50% 30%, black 30%, transparent 80%)",
                }}
            />

            <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 sm:py-24 lg:grid-cols-[1fr_auto] lg:gap-16">
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, ease }}
                        className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300"
                    >
                        <Sparkles size={11} /> your learning path
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1, ease }}
                        className="mt-5 text-balance text-4xl font-semibold leading-[1.05] text-white sm:text-5xl lg:text-[56px]"
                    >
                        Welcome back,{" "}
                        <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                            {displayName}
                        </span>
                        .
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.22, ease }}
                        className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-zinc-400"
                    >
                        We built a personalized path based on what you told us
                        — your goal, your interests, and where you are right now.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.34, ease }}
                        className="mt-6 flex flex-wrap gap-2"
                    >
                        {chips.map((c, i) => (
                            <HeroChip key={i} icon={c.icon} label={c.label} />
                        ))}
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.2, ease }}
                    className="flex justify-center lg:justify-end"
                >
                    <MatchRing pct={topScore} />
                </motion.div>
            </div>
        </section>
    );
}

// ───────────────────────── Top match card ────────────────────────────

function TopMatchCard({
    course,
    onClick,
}: {
    course: RecommendedCourse;
    onClick: () => void;
}) {
    const reasons = formatReasons(course.reasons || []);
    const visibleTags = course.matched_tags.slice(0, 6);

    return (
        <motion.article
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease }}
            className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-zinc-950/80 backdrop-blur-2xl"
        >
            {/* Glow accent */}
            <div
                aria-hidden
                className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-amber-400/30 via-transparent to-transparent opacity-60 blur-2xl"
            />
            <div className="absolute inset-px rounded-[calc(theme(borderRadius.3xl)-1px)] bg-gradient-to-br from-zinc-900/80 via-zinc-950 to-zinc-950" />

            <div className="relative grid grid-cols-1 gap-8 p-7 lg:grid-cols-[1.4fr_1fr] lg:p-10">
                {/* LEFT — primary content */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="rounded-md border border-amber-400/30 bg-amber-400/[0.08] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
                            Top match
                        </span>
                        <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                            {formatTag(course.category || "")}
                        </span>
                        <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                            {DIFFICULTY_LABEL[course.difficulty]}
                        </span>
                    </div>

                    <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight text-white sm:text-4xl">
                        {course.title}
                    </h2>

                    {visibleTags.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-1.5">
                            {visibleTags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-md border border-amber-400/20 bg-amber-400/[0.05] px-2 py-0.5 text-[11px] font-medium text-amber-200/90"
                                >
                                    {formatTag(tag)}
                                </span>
                            ))}
                        </div>
                    )}

                    {reasons.length > 0 && (
                        <div className="mt-7 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                Why this matches you
                            </h3>
                            <ul className="space-y-2.5">
                                {reasons.map((r, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-2.5 text-sm text-zinc-300"
                                    >
                                        <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
                                            <Check size={11} strokeWidth={3} />
                                        </span>
                                        <span>{r}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="mt-7 flex flex-wrap items-center gap-3">
                        <Link
                            href={`/courses/${course.slug}`}
                            onClick={onClick}
                            className="group inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-zinc-950 shadow-[0_0_28px_rgba(251,191,36,0.35)] transition-all hover:bg-amber-300"
                        >
                            Start this path
                            <ArrowRight
                                size={16}
                                className="transition-transform group-hover:translate-x-0.5"
                            />
                        </Link>
                        <Link
                            href="#all-paths"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-xs font-semibold text-zinc-400 transition-colors hover:border-white/[0.16] hover:text-white"
                        >
                            See alternatives
                        </Link>
                    </div>
                </div>

                {/* RIGHT — score panel */}
                <div className="flex items-center justify-center">
                    <div className="flex flex-col items-center text-center">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                            Match score
                        </div>
                        <div className="mt-2 font-mono text-[88px] font-bold leading-none tabular-nums text-white sm:text-[104px]">
                            {course.score}
                        </div>
                        <div className="-mt-1 text-base font-semibold tracking-wider text-amber-400">
                            % match
                        </div>
                        <p className="mt-5 max-w-[200px] text-xs leading-relaxed text-zinc-500">
                            Computed from your goal, level, and the interests
                            you picked during onboarding.
                        </p>
                    </div>
                </div>
            </div>
        </motion.article>
    );
}

// ───────────────────────── Path grid ─────────────────────────────────

function PathCard({
    course,
    index,
    onClick,
}: {
    course: RecommendedCourse;
    index: number;
    onClick: () => void;
}) {
    const reasons = formatReasons(course.reasons || []).slice(0, 2);
    return (
        <motion.article
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 + index * 0.07, ease }}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/25 hover:shadow-[0_0_40px_rgba(251,191,36,0.08)]"
        >
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-400/[0.04] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
            <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                        {formatTag(course.category || "")}
                    </span>
                    <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                        {DIFFICULTY_LABEL[course.difficulty]}
                    </span>
                </div>
                <div className="text-right">
                    <span className="font-mono text-2xl font-bold tabular-nums text-amber-300">
                        {course.score}
                    </span>
                    <span className="ml-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400/80">
                        %
                    </span>
                </div>
            </div>

            <h3 className="relative mt-4 line-clamp-2 text-lg font-semibold leading-snug text-white">
                {course.title}
            </h3>

            {reasons.length > 0 && (
                <ul className="relative mt-4 space-y-1.5">
                    {reasons.map((r, i) => (
                        <li
                            key={i}
                            className="flex items-start gap-1.5 text-[12px] text-zinc-400"
                        >
                            <Check
                                size={11}
                                className="mt-0.5 shrink-0 text-emerald-400/70"
                            />
                            <span className="line-clamp-1">{r}</span>
                        </li>
                    ))}
                </ul>
            )}

            <div className="relative mt-auto pt-5">
                <Link
                    href={`/courses/${course.slug}`}
                    onClick={onClick}
                    className="group/btn inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-200"
                >
                    Explore path
                    <ArrowRight
                        size={14}
                        className="transition-transform group-hover/btn:translate-x-0.5"
                    />
                </Link>
            </div>
        </motion.article>
    );
}

// ───────────────────────── Roadmap teaser ────────────────────────────

function RoadmapTeaser() {
    const items = [
        {
            icon: Layers,
            title: "Continue your path",
            body: "We'll surface the next lesson the moment you start a course.",
        },
        {
            icon: Compass,
            title: "Because you like this",
            body: "Themed groupings as your interests deepen.",
        },
        {
            icon: GraduationCap,
            title: "Trending with peers like you",
            body: "Collaborative signals once enough students are active.",
        },
    ];
    return (
        <section className="mx-auto w-full max-w-6xl px-6 pb-24">
            <div className="mb-6 flex items-center gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Coming next to your path
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {items.map(({ icon: Icon, title, body }) => (
                    <div
                        key={title}
                        className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] p-5"
                    >
                        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-zinc-500">
                            <Icon size={14} />
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                            {title}
                            <Lock size={11} className="text-zinc-600" />
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                            {body}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ───────────────────────── Page ──────────────────────────────────────

export default function LearningPathPage() {
    const { user } = useAuth();
    const [courses, setCourses] = useState<RecommendedCourse[]>([]);
    const [engineVersion, setEngineVersion] = useState("");
    const [profileVersion, setProfileVersion] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notOnboarded, setNotOnboarded] = useState(false);
    const viewedRef = useRef(false);

    const displayName = useMemo(() => {
        const u = user as Record<string, unknown> | null;
        return (
            (u?.display_name as string) ||
            (u?.displayName as string) ||
            user?.email?.split("@")[0] ||
            "there"
        );
    }, [user]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const token = getToken();
            if (!token) {
                setError("Sign in to view your learning path");
                setLoading(false);
                return;
            }
            try {
                const res = await fetchRecommendations(token);
                if (cancelled) return;
                if (res.reason === "not_onboarded") {
                    setNotOnboarded(true);
                } else {
                    setCourses(res.data ?? []);
                    setEngineVersion(res.engine_version ?? "");
                    setProfileVersion(res.profile_version ?? 0);
                }
            } catch (e) {
                if (!cancelled) {
                    setError(
                        e instanceof Error
                            ? e.message
                            : "Failed to load your learning path",
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Fire VIEWED once per snapshot landing — this page is the primary rec surface.
    useEffect(() => {
        if (viewedRef.current || !courses.length) return;
        viewedRef.current = true;
        void postRecommendationEvents(
            courses.map((c, i) => ({
                event_type: "RECOMMENDATION_VIEWED",
                course_id: c.course_id,
                engine_version: engineVersion,
                profile_version: profileVersion,
                score: c.score,
                position: i,
            })),
        );
    }, [courses, engineVersion, profileVersion]);

    const handleClick = (c: RecommendedCourse, position: number) => {
        void postRecommendationEvents([
            {
                event_type: "RECOMMENDATION_CLICKED",
                course_id: c.course_id,
                engine_version: engineVersion,
                profile_version: profileVersion,
                score: c.score,
                position,
            },
        ]);
    };

    if (loading) {
        return (
            <div className="grid min-h-[60vh] place-items-center bg-[#08080b] text-zinc-500">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400/20 border-t-amber-400" />
                    <p className="text-xs">Loading your path…</p>
                </div>
            </div>
        );
    }

    if (notOnboarded) {
        return (
            <div className="grid min-h-[70vh] place-items-center px-6">
                <div className="max-w-md rounded-2xl border border-white/[0.08] bg-zinc-950/80 p-8 text-center backdrop-blur-xl">
                    <div className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-lg border border-amber-400/30 bg-amber-400/[0.08]">
                        <Sparkles size={16} className="text-amber-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">
                        Tell us a bit about yourself first
                    </h2>
                    <p className="mt-2 text-sm text-zinc-500">
                        Your path is generated from your goal, level, and
                        interests. Take 2 minutes to set them up.
                    </p>
                    <Link
                        href="/onboarding"
                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-amber-300"
                    >
                        Start onboarding <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="grid min-h-[60vh] place-items-center px-6">
                <div className="max-w-md rounded-xl border border-red-500/20 bg-red-500/[0.04] px-5 py-4 text-sm text-red-300">
                    {error}
                </div>
            </div>
        );
    }

    if (!courses.length) {
        return (
            <div className="grid min-h-[60vh] place-items-center px-6 text-center">
                <div>
                    <p className="text-base text-zinc-300">
                        We couldn&apos;t find paths matching your profile yet.
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                        New courses are added regularly — check back soon.
                    </p>
                    <Link
                        href="/courses"
                        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-amber-400/30 hover:text-amber-300"
                    >
                        Browse all courses <ArrowRight size={12} />
                    </Link>
                </div>
            </div>
        );
    }

    const [topMatch, ...rest] = courses;

    // Hero chips synthesized from the top match — concrete signals, not generic copy.
    const chips: { icon: typeof Target; label: string }[] = [];
    chips.push({
        icon: GraduationCap,
        label: DIFFICULTY_LABEL[topMatch.difficulty] ?? "Personalized",
    });
    if (topMatch.category) {
        chips.push({ icon: Compass, label: formatTag(topMatch.category) });
    }
    topMatch.matched_tags.slice(0, 2).forEach((tag) => {
        chips.push({ icon: Target, label: formatTag(tag) });
    });

    return (
        <div className="min-h-screen bg-[#08080b] text-white">
            <Hero
                displayName={displayName}
                topScore={topMatch.score}
                chips={chips}
            />

            <div className="mx-auto -mt-6 w-full max-w-6xl px-6">
                <TopMatchCard
                    course={topMatch}
                    onClick={() => handleClick(topMatch, 0)}
                />
            </div>

            {rest.length > 0 && (
                <section
                    id="all-paths"
                    className="mx-auto w-full max-w-6xl px-6 py-16"
                >
                    <div className="mb-6 flex items-end justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-semibold text-white">
                                More paths shaped for you
                            </h2>
                            <p className="mt-1 text-sm text-zinc-500">
                                Ranked by overall fit. Pick what feels right.
                            </p>
                        </div>
                        <Link
                            href="/courses"
                            className="hidden items-center gap-1 text-xs font-semibold text-zinc-400 transition-colors hover:text-amber-300 sm:inline-flex"
                        >
                            Browse the full catalog
                            <ArrowRight size={12} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {rest.map((c, i) => (
                            <PathCard
                                key={c.course_id}
                                course={c}
                                index={i}
                                onClick={() => handleClick(c, i + 1)}
                            />
                        ))}
                    </div>
                </section>
            )}

            <RoadmapTeaser />
        </div>
    );
}
