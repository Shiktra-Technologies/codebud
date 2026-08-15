/**
 * Schema-driven recommendation explanation renderer.
 *
 * The backend ships structured `RecommendationReason` objects only —
 * sentences are never persisted. This module is the single place that
 * turns a reason type into a UI string, so we can change wording, add
 * locales, or A/B-test phrasing without redeploying the backend.
 */

import type { RecommendationReason } from "@/lib/services/recommendations";

const DIFFICULTY_TITLE: Record<string, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
};

function titleCase(s: string): string {
    return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function humanList(items: string[]): string {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function formatReason(reason: RecommendationReason): string {
    switch (reason.type) {
        case "goal_match":
            return `Matches your goal: ${titleCase(reason.value || "")}`;
        case "interest_overlap": {
            const tags = (reason.value || []).map(titleCase);
            return tags.length
                ? `Matches your interests: ${humanList(tags)}`
                : "Matches your interests";
        }
        case "difficulty_match":
            return `${DIFFICULTY_TITLE[reason.value] ?? titleCase(reason.value)} friendly — fits your level`;
        case "difficulty_near":
            return `Close to your level (${DIFFICULTY_TITLE[reason.value] ?? titleCase(reason.value)})`;
        default: {
            // Future-proof: an unknown reason.type should never crash the UI.
            const fallback = reason as { type?: string };
            return fallback.type ? `Matches: ${titleCase(fallback.type)}` : "Personalized match";
        }
    }
}

export function formatReasons(reasons: RecommendationReason[]): string[] {
    return reasons.map(formatReason);
}
