import apiClient from "@/lib/apiClient";

/**
 * Learning Studio v2 — service layer.
 *
 * All endpoints under /api/super-admin/learning-studio are gated to
 * codebud_super_admin on the backend; the frontend additionally enforces this
 * at the route level via Next.js middleware. See:
 *   - middleware.ts (route gate)
 *   - lib/auth/roleRouting.ts (canonical role → route map)
 *   - backend learning_studio.py (RBAC + schema)
 *
 * Course documents are returned with a `schema_version` field so the same
 * surface can transparently expose v1 (legacy) and v2 (studio-authored)
 * courses. v1 entries are read-only.
 */

export type LifecycleState =
    | "draft"
    | "review"
    | "scheduled"
    | "published"
    | "archived";

export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";

export type TaxonomyKind =
    | "skills"
    | "interests"
    | "career_goals"
    | "target_roles"
    | "learning_styles";

export interface TaxonomyItem {
    _id: string;
    slug: string;
    label: string;
    status: "approved" | "pending";
    created_at?: string;
    approved_at?: string;
}

export interface LessonBlock {
    id: string;
    type:
        | "text"
        | "video"
        | "code"
        | "quiz"
        | "assignment"
        | "resource"
        | "image"
        | "callout"
        | "interactive_lab"
        | "ai_hint";
    data: Record<string, unknown>;
}

export interface Lesson {
    id: string;
    title: string;
    blocks: LessonBlock[];
    estimated_duration_minutes?: number;
}

export interface Module {
    id: string;
    title: string;
    description?: string;
    lessons: Lesson[];
}

export interface CourseTargeting {
    interests: string[];
    career_goals: string[];
    skill_alignment: string[];
    learning_styles: string[];
    target_roles: string[];
    ideal_for: string[];
}

export interface CourseSkills {
    required_skills: string[];
    gained_skills: string[];
    prerequisite_course_ids: string[];
}

export interface CourseV2 {
    _id: string;
    schema_version: 2;
    lifecycle_state: LifecycleState;
    version_number: number;
    slug: string;

    title: string;
    short_description: string;
    full_description: string;
    thumbnail_url: string;
    banner_url: string;
    promo_video_url: string;
    category: string;
    difficulty: Difficulty;
    estimated_duration_minutes: number;
    language: string;

    targeting: CourseTargeting;
    skills: CourseSkills;

    modules: Module[];
    final_assessment: unknown | null;

    progression_rules: {
        require_quizzes: boolean;
        require_assignments: boolean;
        min_completion_percentage: number;
    };

    recommendation_metadata: {
        difficulty_alignment: string[];
        learning_outcomes: string[];
    };

    analytics_snapshot: {
        enrollment_count: number;
        completion_rate: number;
        avg_progress: number;
        last_aggregated_at: string | null;
    };

    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
    published_at?: string;
}

export interface LegacyCourseSummary {
    _id: string;
    title: string;
    thumbnail_url?: string;
    is_published: boolean;
    schema_version: 1;
    lifecycle_state: LifecycleState;
    read_only: true;
    updated_at?: string;
}

export interface CourseListResponse {
    success: boolean;
    courses_v2: CourseV2[];
    courses_v1_legacy: LegacyCourseSummary[];
    counts: Record<LifecycleState | "v1_legacy", number>;
    error?: string;
}

const BASE = "/super-admin/learning-studio";

function unwrap<T>(p: Promise<{ data: T }>): Promise<T> {
    return p.then((r) => r.data);
}

export const learningStudio = {
    courses: {
        list(state?: LifecycleState) {
            const url = state ? `${BASE}/courses?state=${state}` : `${BASE}/courses`;
            return unwrap<CourseListResponse>(apiClient.get(url));
        },
        get(id: string) {
            return unwrap<{ success: boolean; course?: CourseV2; error?: string }>(
                apiClient.get(`${BASE}/courses/${id}`),
            );
        },
        create(payload: Partial<CourseV2> & { title: string }) {
            return unwrap<{ success: boolean; course?: CourseV2; error?: string }>(
                apiClient.post(`${BASE}/courses`, payload),
            );
        },
        patch(id: string, payload: Partial<CourseV2>) {
            return unwrap<{ success: boolean; course?: CourseV2; error?: string }>(
                apiClient.patch(`${BASE}/courses/${id}`, payload),
            );
        },
        transition(id: string, to: LifecycleState) {
            return unwrap<{
                success: boolean;
                course?: CourseV2;
                error?: string;
                allowed?: LifecycleState[];
            }>(apiClient.post(`${BASE}/courses/${id}/lifecycle`, { to }));
        },
        versions(id: string) {
            return unwrap<{ success: boolean; versions: CourseV2[]; error?: string }>(
                apiClient.get(`${BASE}/courses/${id}/versions`),
            );
        },
    },
    taxonomy: {
        list(kind: TaxonomyKind) {
            return unwrap<{ success: boolean; kind: TaxonomyKind; items: TaxonomyItem[] }>(
                apiClient.get(`${BASE}/taxonomy/${kind}`),
            );
        },
        propose(kind: TaxonomyKind, label: string) {
            return unwrap<{ success: boolean; item?: TaxonomyItem; duplicate?: boolean; error?: string }>(
                apiClient.post(`${BASE}/taxonomy/${kind}`, { label }),
            );
        },
        approve(kind: TaxonomyKind, id: string) {
            return unwrap<{ success: boolean; item?: TaxonomyItem }>(
                apiClient.patch(`${BASE}/taxonomy/${kind}/${id}/approve`),
            );
        },
    },
};

export const LIFECYCLE_LABELS: Record<LifecycleState, string> = {
    draft: "Draft",
    review: "In Review",
    scheduled: "Scheduled",
    published: "Published",
    archived: "Archived",
};

export const LIFECYCLE_TONE: Record<LifecycleState, { fg: string; bg: string; border: string }> = {
    draft:     { fg: "text-white/60",      bg: "bg-white/[0.04]",     border: "border-white/10" },
    review:    { fg: "text-sky-300",       bg: "bg-sky-500/10",       border: "border-sky-400/30" },
    scheduled: { fg: "text-violet-300",    bg: "bg-violet-500/10",    border: "border-violet-400/30" },
    published: { fg: "text-emerald-300",   bg: "bg-emerald-500/10",   border: "border-emerald-400/30" },
    archived:  { fg: "text-white/30",      bg: "bg-white/[0.02]",     border: "border-white/[0.06]" },
};
