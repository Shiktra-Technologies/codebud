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

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://localhost:5000";

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
        await fetch(`${API_BASE}/api/recommendations/events`, {
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
