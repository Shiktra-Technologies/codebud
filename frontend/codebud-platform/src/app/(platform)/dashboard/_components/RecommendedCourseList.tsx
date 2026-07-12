"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, Lock, Telescope, Check } from "lucide-react";
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

function formatTag(tag: string) {
    return tag.replace(/_/g, " ");
}

function MatchHUD({ pct }: { pct: number }) {
    const isElite = pct > 85;
    const isStrong = pct >= 50 && pct <= 85;

    const color = isElite
        ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
        : isStrong
        ? "text-zinc-300"
        : "text-zinc-500";

    return (
        <div className="flex items-baseline gap-1">
            <span className={`font-mono text-lg font-bold tabular-nums ${color}`}>
                {pct}
            </span>
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${color}`}>
                % match
            </span>
        </div>
    );
}

function Pill({
    children,
    accent = false,
}: {
    children: React.ReactNode;
    accent?: boolean;
}) {
    return (
        <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium tracking-wide ${
                accent
                    ? "border-amber-400/30 bg-amber-400/[0.06] text-amber-300/90"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400"
            }`}
        >
            {children}
        </span>
    );
}

function CourseCard({
    course,
    index,
    onClick,
}: {
    course: RecommendedCourse;
    index: number;
    onClick?: () => void;
}) {
    const visibleTags = course.matched_tags.slice(0, 4);
    const overflow = course.matched_tags.length - visibleTags.length;
    const explanations = formatReasons(course.reasons || []);

    return (
        <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.06, ease }}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl transition-colors hover:border-amber-400/25"
        >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-400/[0.04] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative flex flex-col gap-4 p-5">
                <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <Pill>{formatTag(course.category)}</Pill>
                        <Pill>{DIFFICULTY_LABEL[course.difficulty]}</Pill>
                    </div>
                    <MatchHUD pct={course.score} />
                </header>

                <h3 className="line-clamp-2 text-base font-semibold leading-snug text-white">
                    {course.title}
                </h3>

                {visibleTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {visibleTags.map((tag) => (
                            <Pill key={tag} accent>
                                {formatTag(tag)}
                            </Pill>
                        ))}
                        {overflow > 0 && (
                            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                                +{overflow} more
                            </span>
                        )}
                    </div>
                )}

                {explanations.length > 0 && (
                    <ul className="flex flex-col gap-1.5">
                        {explanations.map((line, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-1.5 text-[11px] leading-relaxed text-zinc-400"
                            >
                                <Check
                                    size={11}
                                    className="mt-0.5 shrink-0 text-emerald-400/70"
                                />
                                <span>{line}</span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-auto pt-1">
                    <Link
                        href={`/courses/${course.slug}`}
                        onClick={onClick}
                        className="group/btn inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
                    >
                        View Path
                        <ArrowRight
                            size={14}
                            className="transition-transform group-hover/btn:translate-x-0.5"
                        />
                    </Link>
                </div>
            </div>
        </motion.article>
    );
}

function SectionShell({ children }: { children: React.ReactNode }) {
    return (
        <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md border border-amber-400/25 bg-amber-400/[0.08]">
                        <Sparkles size={14} className="text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold tracking-tight text-white">
                            Recommended For You
                        </h2>
                        <p className="text-[11px] text-zinc-500">
                            Curated by your onboarding profile
                        </p>
                    </div>
                </div>
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600 sm:block">
                    Engine v1.0
                </span>
            </div>
            {children}
        </section>
    );
}

function SkeletonGrid() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    className="h-52 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40"
                />
            ))}
        </div>
    );
}

function EmptyOnboarding() {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-10 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-amber-400/25 bg-amber-400/[0.08]">
                <Lock size={16} className="text-amber-400" />
            </div>
            <p className="text-sm font-semibold text-white">
                Complete onboarding to unlock recommendations
            </p>
            <p className="mt-1 text-xs text-zinc-500">
                Tell us your goal, skill level, and interests so the engine can
                personalize your path.
            </p>
            <Link
                href="/onboarding"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
            >
                Start onboarding <ArrowRight size={14} />
            </Link>
        </div>
    );
}

function EmptyNoMatches() {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-10 text-center">
            <Telescope size={20} className="mb-2 text-zinc-500" />
            <p className="text-sm font-semibold text-white">
                No matches yet
            </p>
            <p className="mt-1 text-xs text-zinc-500">
                We couldn&apos;t find courses for your profile. New paths drop
                weekly — check back soon.
            </p>
            <Link
                href="/courses"
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-amber-400/30 hover:text-amber-300"
            >
                Browse all courses <ArrowRight size={12} />
            </Link>
        </div>
    );
}

export default function RecommendedCourseList() {
    const [courses, setCourses] = useState<RecommendedCourse[]>([]);
    const [engineVersion, setEngineVersion] = useState<string>("");
    const [profileVersion, setProfileVersion] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notOnboarded, setNotOnboarded] = useState(false);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const token = getToken();
            if (!token) {
                if (!cancelled) {
                    setError("Sign in to see recommendations");
                    setLoading(false);
                }
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
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load recommendations",
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

    // RECOMMENDATION_VIEWED — fire once per snapshot landing, batched across cards.
    useEffect(() => {
        if (!courses.length) return;
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

    const handleClick = (course: RecommendedCourse, position: number) => {
        void postRecommendationEvents([
            {
                event_type: "RECOMMENDATION_CLICKED",
                course_id: course.course_id,
                engine_version: engineVersion,
                profile_version: profileVersion,
                score: course.score,
                position,
            },
        ]);
    };

    return (
        <SectionShell>
            {loading && <SkeletonGrid />}

            {!loading && error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {!loading && !error && notOnboarded && <EmptyOnboarding />}

            {!loading && !error && !notOnboarded && courses.length === 0 && (
                <EmptyNoMatches />
            )}

            {!loading && !error && !notOnboarded && courses.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course, i) => (
                        <CourseCard
                            key={course.course_id}
                            course={course}
                            index={i}
                            onClick={() => handleClick(course, i)}
                        />
                    ))}
                </div>
            )}
        </SectionShell>
    );
}
