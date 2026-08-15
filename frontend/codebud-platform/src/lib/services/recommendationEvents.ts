/**
 * Recommendation interaction analytics — append-only event stream.
 *
 * The backend stores these for future ranking feedback / personalization
 * signals. Today no scoring logic consumes them. Events are best-effort —
 * a failed POST never blocks rendering or navigation.
 */

import { getToken } from "@/lib/apiClient";

export type RecommendationEventType =
    | "RECOMMENDATION_VIEWED"
    | "RECOMMENDATION_CLICKED"
    | "RECOMMENDATION_ENROLLED";

export interface RecommendationEvent {
    event_type: RecommendationEventType;
    course_id: string;
    engine_version: string;
    profile_version: number;
    score: number;
    position?: number;
    client_ts?: string;
}

export async function postRecommendationEvents(
    events: RecommendationEvent[],
): Promise<void> {
    if (!events.length) return;
    const token = getToken();
    if (!token) return;

    const stamped = events.map((e) => ({
        ...e,
        client_ts: e.client_ts ?? new Date().toISOString(),
    }));

    try {
        // Direct call to the backend (proxy removed).
        const base = (process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
        await fetch(`${base}/api/recommendations/events`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ events: stamped }),
            keepalive: true,
            cache: "no-store",
        });
    } catch {
        // Best-effort. Analytics MUST NOT break the dashboard.
    }
}
