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

export async function fetchRecommendations(
    token: string,
): Promise<RecommendationsResponse> {
    // Direct call to the backend (proxy removed); CORS allowlist on the
    // backend covers this app's origin.
    const base = (process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
    const url = `${base}/api/recommendations`;

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
