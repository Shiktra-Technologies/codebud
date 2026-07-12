import apiClient, { getToken } from "@/lib/apiClient";
import {
    getMyEnrollments,
    listCourses,
    type Course,
    type Enrollment,
} from "@/lib/services/courseService";
import { getMyApplications, type Application } from "@/lib/services/applicationService";
import { fetchRecommendations } from "@/lib/services/recommendations";
import type { MentorshipTask, MentorshipProject } from "@/lib/services/mentorshipService";

/**
 * Roadmap Service — derives the student roadmap entirely from work the
 * student has already done (enrollments, lessons, test submissions,
 * mentorship tasks/projects, job applications). There is no manual
 * check-off: every milestone recomputes from live data, so the roadmap
 * updates automatically as the student works.
 */

export type MilestoneStatus = "completed" | "in_progress" | "upcoming";

export interface RoadmapMilestone {
    id: string;
    title: string;
    description: string;
    status: MilestoneStatus;
    /** 0–1 fraction for milestones with countable progress. */
    progress: number;
    /** Human-readable evidence, e.g. "7 of 10 lessons". */
    detail?: string;
    href: string;
    cta: string;
}

export interface RoadmapStage {
    id: string;
    title: string;
    tagline: string;
    status: MilestoneStatus;
    milestones: RoadmapMilestone[];
}

export interface RoadmapSnapshot {
    stages: RoadmapStage[];
    /** The first unfinished milestone — the student's current focus. */
    current: RoadmapMilestone | null;
    completedCount: number;
    totalCount: number;
    /** Overall 0–100 completion across all milestones. */
    overallPct: number;
    fetchedAt: string;
}

// ── Raw inputs ────────────────────────────────────────────────────────

interface Submission {
    test_type?: string;
    testType?: string;
    score?: number;
    total_questions?: number;
    totalQuestions?: number;
    [key: string]: unknown;
}

export interface RoadmapInputs {
    isOnboarded: boolean;
    hasLearningPath: boolean;
    enrollments: Enrollment[];
    courseMap: Record<string, Course>;
    submissions: Submission[];
    tasks: MentorshipTask[];
    projects: MentorshipProject[];
    hasMentor: boolean;
    applications: Application[];
}

export async function fetchRoadmapInputs(isOnboarded: boolean): Promise<RoadmapInputs> {
    const token = getToken();

    const [dashboardRes, enrollRes, coursesRes, appsRes, recsRes] = await Promise.all([
        apiClient
            .get("/api/dashboard")
            .then((r) => r.data)
            .catch(() => null),
        getMyEnrollments().catch(() => ({ success: false, enrollments: [] as Enrollment[] })),
        listCourses().catch(() => ({ success: false, courses: [] as Course[] })),
        getMyApplications().catch(() => ({ success: false, applications: [] as Application[] })),
        token
            ? fetchRecommendations(token).catch(() => null)
            : Promise.resolve(null),
    ]);

    const courseMap: Record<string, Course> = {};
    for (const c of coursesRes?.courses || []) courseMap[c._id] = c;

    return {
        isOnboarded,
        hasLearningPath: Boolean(recsRes && (recsRes as { data?: unknown[] }).data?.length),
        enrollments: enrollRes?.enrollments || [],
        courseMap,
        submissions: dashboardRes?.success ? dashboardRes.submissions || [] : [],
        tasks: dashboardRes?.success ? dashboardRes.tasks || [] : [],
        projects: dashboardRes?.success ? dashboardRes.projects || [] : [],
        hasMentor: Boolean(dashboardRes?.success && dashboardRes.mentor),
        applications: appsRes?.applications || [],
    };
}

// ── Derivation helpers ────────────────────────────────────────────────

// Enrollments arrive in two shapes: the typed one nests progress under
// `progress`, the dashboard aggregate flattens it. Read both.
function completedLessonIds(e: Enrollment): string[] {
    const flat = (e as unknown as { completed_lessons?: string[] }).completed_lessons;
    return e.progress?.completed_lessons || flat || [];
}

function courseFinished(e: Enrollment, courseMap: Record<string, Course>): boolean {
    if (e.completed_at) return true;
    const pct = e.progress?.percentage;
    if (typeof pct === "number" && pct >= 100) return true;
    const course = courseMap[e.course_id];
    if (!course) return false;
    const total = course.sections?.reduce((a, s) => a + (s.lessons?.length || 0), 0) || 0;
    return total > 0 && completedLessonIds(e).length >= total;
}

function submissionPassed(s: Submission): boolean {
    const score = s.score || 0;
    const total = s.total_questions || s.totalQuestions || 30;
    return total > 0 && score / total >= 0.6;
}

function submissionType(s: Submission): "aptitude" | "dsa" | "other" {
    const t = (s.test_type || s.testType || "").toLowerCase();
    if (t.includes("apt")) return "aptitude";
    if (t.includes("dsa") || t.includes("code")) return "dsa";
    return "other";
}

const TASK_DONE = new Set(["approved", "completed"]);

function clamp01(n: number) {
    return Math.max(0, Math.min(1, n));
}

// ── Roadmap builder ───────────────────────────────────────────────────

const LESSONS_TARGET = 10;
const ASSESSMENTS_TARGET = 5;
const TASKS_TARGET = 3;

/**
 * Pure derivation: inputs in, roadmap out. Milestone `done`/`progress`
 * comes only from observed student work, never from stored flags.
 */
export function buildRoadmap(inputs: RoadmapInputs): RoadmapSnapshot {
    const {
        isOnboarded,
        hasLearningPath,
        enrollments,
        courseMap,
        submissions,
        tasks,
        projects,
        hasMentor,
        applications,
    } = inputs;

    const lessonsDone = enrollments.reduce((a, e) => a + completedLessonIds(e).length, 0);
    const finishedCourses = enrollments.filter((e) => courseFinished(e, courseMap)).length;
    const aptitudePassed = submissions.some((s) => submissionType(s) === "aptitude" && submissionPassed(s));
    const dsaTaken = submissions.filter((s) => submissionType(s) === "dsa");
    const tasksDone = tasks.filter((t) => TASK_DONE.has((t.status || "").toLowerCase())).length;
    const projectSubmitted = projects.some((p) => (p.status || "").toLowerCase() === "submitted");
    const interviewReached = applications.some((a) =>
        ["interview", "offered"].includes(((a as { status?: string }).status || "").toLowerCase()),
    );

    // Each entry: done flag, optional fractional progress + detail.
    const spec: Array<{
        stage: { id: string; title: string; tagline: string };
        milestones: Array<{
            id: string;
            title: string;
            description: string;
            done: boolean;
            progress?: number;
            detail?: string;
            href: string;
            cta: string;
        }>;
    }> = [
        {
            stage: {
                id: "setup",
                title: "Get set up",
                tagline: "Tell us who you are so everything else can be personalized.",
            },
            milestones: [
                {
                    id: "onboarding",
                    title: "Complete onboarding",
                    description: "Share your goals, skills, and interests.",
                    done: isOnboarded,
                    href: "/onboarding",
                    cta: "Start onboarding",
                },
                {
                    id: "learning-path",
                    title: "Get your learning path",
                    description: "A personalized path generated from your profile.",
                    done: hasLearningPath,
                    href: "/learning-path",
                    cta: "View your path",
                },
            ],
        },
        {
            stage: {
                id: "learn",
                title: "Learn",
                tagline: "Enroll in courses and build momentum lesson by lesson.",
            },
            milestones: [
                {
                    id: "first-enrollment",
                    title: "Enroll in your first course",
                    description: "Pick a course from your path or the catalog.",
                    done: enrollments.length > 0,
                    detail: enrollments.length
                        ? `${enrollments.length} course${enrollments.length === 1 ? "" : "s"} enrolled`
                        : undefined,
                    href: "/courses",
                    cta: "Browse courses",
                },
                {
                    id: "first-lesson",
                    title: "Complete your first lesson",
                    description: "Finish any lesson in an enrolled course.",
                    done: lessonsDone > 0,
                    href: "/courses",
                    cta: "Continue learning",
                },
                {
                    id: "ten-lessons",
                    title: `Complete ${LESSONS_TARGET} lessons`,
                    description: "Consistency beats intensity — keep going.",
                    done: lessonsDone >= LESSONS_TARGET,
                    progress: clamp01(lessonsDone / LESSONS_TARGET),
                    detail: `${Math.min(lessonsDone, LESSONS_TARGET)} of ${LESSONS_TARGET} lessons`,
                    href: "/courses",
                    cta: "Continue learning",
                },
                {
                    id: "finish-course",
                    title: "Finish a course",
                    description: "Complete every lesson in one course.",
                    done: finishedCourses > 0,
                    detail: finishedCourses ? `${finishedCourses} finished` : undefined,
                    href: "/courses",
                    cta: "Continue learning",
                },
            ],
        },
        {
            stage: {
                id: "practice",
                title: "Practice & assess",
                tagline: "Prove what you've learned under real test conditions.",
            },
            milestones: [
                {
                    id: "first-assessment",
                    title: "Take your first assessment",
                    description: "Complete an aptitude or DSA test.",
                    done: submissions.length > 0,
                    detail: submissions.length
                        ? `${submissions.length} submission${submissions.length === 1 ? "" : "s"}`
                        : undefined,
                    href: "/aptitude-test",
                    cta: "Take a test",
                },
                {
                    id: "pass-aptitude",
                    title: "Pass an aptitude test",
                    description: "Score 60% or higher on an aptitude assessment.",
                    done: aptitudePassed,
                    href: "/aptitude-test",
                    cta: "Take aptitude test",
                },
                {
                    id: "pass-dsa",
                    title: "Pass a DSA challenge",
                    description: "Score 60% or higher on a coding assessment.",
                    done: dsaTaken.some(submissionPassed),
                    detail: dsaTaken.length ? `${dsaTaken.length} attempt${dsaTaken.length === 1 ? "" : "s"}` : undefined,
                    href: "/dsa-test",
                    cta: "Take DSA test",
                },
                {
                    id: "five-assessments",
                    title: `Complete ${ASSESSMENTS_TARGET} assessments`,
                    description: "Build a track record on the leaderboard.",
                    done: submissions.length >= ASSESSMENTS_TARGET,
                    progress: clamp01(submissions.length / ASSESSMENTS_TARGET),
                    detail: `${Math.min(submissions.length, ASSESSMENTS_TARGET)} of ${ASSESSMENTS_TARGET} assessments`,
                    href: "/problems",
                    cta: "Practice problems",
                },
            ],
        },
        {
            stage: {
                id: "mentorship",
                title: "Grow with mentorship",
                tagline: "Work with a mentor on real tasks and projects.",
            },
            milestones: [
                {
                    id: "mentor",
                    title: "Connect with a mentor",
                    description: "Get matched with a mentor who guides your work.",
                    done: hasMentor,
                    href: "/dashboard",
                    cta: "View mentorship",
                },
                {
                    id: "mentor-tasks",
                    title: `Complete ${TASKS_TARGET} mentor tasks`,
                    description: "Finish tasks your mentor assigns you.",
                    done: tasksDone >= TASKS_TARGET,
                    progress: clamp01(tasksDone / TASKS_TARGET),
                    detail: `${Math.min(tasksDone, TASKS_TARGET)} of ${TASKS_TARGET} tasks approved`,
                    href: "/dashboard",
                    cta: "View tasks",
                },
                {
                    id: "project",
                    title: "Submit a project",
                    description: "Ship a mentor-assigned project end to end.",
                    done: projectSubmitted,
                    href: "/dashboard",
                    cta: "View projects",
                },
            ],
        },
        {
            stage: {
                id: "career",
                title: "Launch your career",
                tagline: "Turn your progress into interviews and offers.",
            },
            milestones: [
                {
                    id: "first-application",
                    title: "Apply to your first job",
                    description: "Use your track record to apply with confidence.",
                    done: applications.length > 0,
                    detail: applications.length
                        ? `${applications.length} application${applications.length === 1 ? "" : "s"}`
                        : undefined,
                    href: "/jobs",
                    cta: "Browse jobs",
                },
                {
                    id: "interview",
                    title: "Reach the interview stage",
                    description: "Progress past screening with an employer.",
                    done: interviewReached,
                    href: "/jobs",
                    cta: "Track applications",
                },
            ],
        },
    ];

    // Statuses: everything done is completed; the first unfinished
    // milestone (and any unfinished one with partial progress) is
    // in_progress; the rest are upcoming.
    let currentAssigned = false;
    let current: RoadmapMilestone | null = null;
    let completedCount = 0;
    let totalCount = 0;

    const stages: RoadmapStage[] = spec.map(({ stage, milestones }) => {
        const built = milestones.map((m): RoadmapMilestone => {
            totalCount += 1;
            let status: MilestoneStatus;
            if (m.done) {
                status = "completed";
                completedCount += 1;
            } else if (!currentAssigned || (m.progress ?? 0) > 0) {
                status = "in_progress";
                if (!currentAssigned) currentAssigned = true;
            } else {
                status = "upcoming";
            }
            const milestone: RoadmapMilestone = {
                id: m.id,
                title: m.title,
                description: m.description,
                status,
                progress: m.done ? 1 : clamp01(m.progress ?? 0),
                detail: m.detail,
                href: m.href,
                cta: m.cta,
            };
            if (!current && status === "in_progress") current = milestone;
            return milestone;
        });

        const stageStatus: MilestoneStatus = built.every((m) => m.status === "completed")
            ? "completed"
            : built.some((m) => m.status !== "upcoming")
                ? "in_progress"
                : "upcoming";

        return { ...stage, status: stageStatus, milestones: built };
    });

    return {
        stages,
        current,
        completedCount,
        totalCount,
        overallPct: totalCount ? Math.round((completedCount / totalCount) * 100) : 0,
        fetchedAt: new Date().toISOString(),
    };
}

export async function fetchRoadmap(isOnboarded: boolean): Promise<RoadmapSnapshot> {
    return buildRoadmap(await fetchRoadmapInputs(isOnboarded));
}
