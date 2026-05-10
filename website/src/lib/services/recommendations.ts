/**
 * Recommendations Service — fetches the personalized course list from the
 * backend's content-based recommendation engine (Keycloak-protected).
 */

export type RecommendationReason =
    | { type: "goal_match"; value: string }
    | { type: "interest_overlap"; value: string[] }
    | { type: "difficulty_match"; value: string }
    | { type: "difficulty_near"; value: string };

export interface RecommendedCourse {
    course_id: string;
    slug: string;
    title: string;
    category: string;
    difficulty: 1 | 2 | 3;
    thumbnail_url?: string | null;
    score: number;
    matched_tags: string[];
    reasons: RecommendationReason[];
}

export interface RecommendationsResponse {
    success: boolean;
    data: RecommendedCourse[];
    reason?: "not_onboarded" | "cooldown" | "generation_failed";
    engine_version?: string;
    profile_version?: number;
}

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://localhost:5000";

export async function fetchRecommendations(
    token: string,
): Promise<RecommendationsResponse> {
    const url = `${API_BASE}/api/recommendations`;
    console.log(
        "[DEBUG] Fetching recommendations from:",
        process.env.NEXT_PUBLIC_API_URL,
        "→ resolved URL:",
        url,
    );

    const res = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
    });

    if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(
            (detail as { error?: string }).error ??
                `Recommendations request failed (${res.status})`,
        );
    }

    return (await res.json()) as RecommendationsResponse;
}

export default fetchRecommendations;
