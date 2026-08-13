/**
 * Frontend events client — emits to the Learning Spine.
 *
 * Design goals:
 *   - Fire-and-forget for callers. `events.track(...)` returns void.
 *   - Batched POSTs (size + time fuse) so we don't hammer the API on every
 *     keystroke-level signal.
 *   - localStorage queue so events survive page navigation / accidental reload.
 *   - Idempotent: each event carries a UUID v4 `event_id`; the backend de-dupes.
 *   - Offline-tolerant: on network failure, events stay in the queue and the
 *     next flush retries. Bounded retry; persisted past 24h are dropped to
 *     avoid forever-stale data poisoning the skill vector.
 *
 * Usage:
 *   import { events } from "@/lib/services/eventsService";
 *   events.track("lesson_completed", {
 *     course_id, curriculum_node_id, skill_slugs: ["react"],
 *     metadata: { score: 0.92 }
 *   });
 *
 * Server-only events (e.g. skill_mastery_changed) are rejected by the backend
 * — callers should not attempt them.
 */

import apiClient from "@/lib/apiClient";

// ── Canonical event types (mirror of backend EVENT_TYPES sans server-only) ─

export type LearningEventType =
    | "lesson_started" | "lesson_completed" | "lesson_abandoned"
    | "block_viewed" | "video_watched"
    | "quiz_started" | "quiz_passed" | "quiz_failed"
    | "assessment_started" | "assessment_completed"
    | "answer_revealed"
    | "project_started" | "project_submitted" | "project_reviewed"
    | "project_approved" | "project_deployed"
    | "code_run" | "code_submitted" | "code_review_passed"
    | "recommendation_shown" | "recommendation_clicked"
    | "recommendation_dismissed" | "recommendation_accepted"
    | "course_enrolled" | "course_completed" | "course_unenrolled"
    | "goal_created" | "goal_updated" | "goal_completed"
    | "session_started" | "session_ended"
    | "streak_incremented" | "streak_broken"
    | "tutor_session_started" | "tutor_session_ended" | "tutor_turn"
    | "mentor_feedback" | "self_assessment";

export interface LearningEventInit {
    course_id?: string;
    curriculum_node_id?: string;
    skill_slugs?: string[];
    concept_ids?: string[];
    metadata?: Record<string, unknown>;
    timestamp?: string;   // ISO; defaults to client now
}

interface QueuedEvent extends LearningEventInit {
    event_id: string;
    event_type: LearningEventType;
    queued_at: number;    // ms; for staleness eviction
    attempts: number;
}

// ── Tunables ──────────────────────────────────────────────────────────

const STORAGE_KEY = "codebud_event_queue";
const SESSION_KEY = "codebud_event_session";
const MAX_QUEUE_SIZE = 500;              // hard cap; oldest evicted past this
const BATCH_SIZE = 50;                   // backend cap is 100; we keep headroom
const FLUSH_INTERVAL_MS = 8_000;         // debounce: flush every 8s
const URGENT_FLUSH_DELAY_MS = 250;       // urgent events (e.g. completion) flush ~immediately
const MAX_AGE_MS = 24 * 60 * 60 * 1000;  // drop events older than 24h
const MAX_ATTEMPTS = 5;

// Events worth flushing immediately rather than waiting for the next tick —
// either because they unlock progression UI, or because they're cheap and
// the user expects to see them reflected.
const URGENT_EVENTS: ReadonlySet<LearningEventType> = new Set([
    "lesson_completed",
    "quiz_passed", "quiz_failed",
    "assessment_completed",
    "project_submitted", "project_reviewed",
    "course_completed",
    "tutor_session_ended",
    "self_assessment",
    "mentor_feedback",
]);

// ── Session id (per browser tab, stable across in-tab navigation) ─────

function getOrCreateSessionId(): string {
    if (typeof window === "undefined") return "ssr";
    try {
        const existing = sessionStorage.getItem(SESSION_KEY);
        if (existing) return existing;
        const fresh = uuid();
        sessionStorage.setItem(SESSION_KEY, fresh);
        return fresh;
    } catch {
        return uuid();
    }
}

function uuid(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return (crypto as Crypto).randomUUID();
    }
    // RFC4122-ish fallback
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// ── Queue persistence ─────────────────────────────────────────────────

function loadQueue(): QueuedEvent[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as QueuedEvent[];
        // Evict anything past MAX_AGE — keeps a flaky-network user from
        // dragging week-old "completed lesson" events into their vector.
        const cutoff = Date.now() - MAX_AGE_MS;
        return parsed.filter((e) => e.queued_at > cutoff);
    } catch {
        return [];
    }
}

function saveQueue(queue: QueuedEvent[]): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch {
        // localStorage may be full or disabled (incognito); drop quietly.
    }
}

// ── The client ────────────────────────────────────────────────────────

class EventsClient {
    private queue: QueuedEvent[] = [];
    private flushTimer: ReturnType<typeof setTimeout> | null = null;
    private intervalTimer: ReturnType<typeof setInterval> | null = null;
    private inflight = false;
    private sessionId: string;

    constructor() {
        this.queue = loadQueue();
        this.sessionId = getOrCreateSessionId();

        if (typeof window !== "undefined") {
            // Periodic flush — gives delivery to non-urgent events.
            this.intervalTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);

            // Try to send anything pending before the tab goes away. `sendBeacon`
            // would be ideal but our backend is auth-token gated; fall back to
            // a synchronous fetch via `keepalive` if we can.
            window.addEventListener("visibilitychange", () => {
                if (document.visibilityState === "hidden") {
                    this.flush({ keepalive: true });
                }
            });
            window.addEventListener("pagehide", () => this.flush({ keepalive: true }));
        }
    }

    /**
     * Enqueue an event. Always returns synchronously; delivery happens in the
     * background. Safe to call from React effects without await.
     */
    track(event_type: LearningEventType, init: LearningEventInit = {}): void {
        const event: QueuedEvent = {
            event_id: uuid(),
            event_type,
            timestamp: init.timestamp ?? new Date().toISOString(),
            course_id: init.course_id,
            curriculum_node_id: init.curriculum_node_id,
            skill_slugs: init.skill_slugs,
            concept_ids: init.concept_ids,
            metadata: init.metadata,
            queued_at: Date.now(),
            attempts: 0,
        };
        this.queue.push(event);

        // Cap the queue so a long offline stretch doesn't bloat localStorage
        // indefinitely. Oldest-first eviction.
        if (this.queue.length > MAX_QUEUE_SIZE) {
            this.queue.splice(0, this.queue.length - MAX_QUEUE_SIZE);
        }
        saveQueue(this.queue);

        if (URGENT_EVENTS.has(event_type)) {
            this.scheduleFlush(URGENT_FLUSH_DELAY_MS);
        }
    }

    private scheduleFlush(delayMs: number): void {
        if (this.flushTimer) return;
        this.flushTimer = setTimeout(() => {
            this.flushTimer = null;
            this.flush();
        }, delayMs);
    }

    /**
     * Send the head of the queue to the backend. Idempotent: a re-delivered
     * batch is no-op'd by the server's unique event_id index, so we don't
     * worry about exactly-once delivery here.
     */
    async flush(opts: { keepalive?: boolean } = {}): Promise<void> {
        if (this.inflight) return;
        if (this.queue.length === 0) return;

        const batch = this.queue.slice(0, BATCH_SIZE);
        if (batch.length === 0) return;
        this.inflight = true;

        // Bump attempt counters BEFORE the network call so retry counts are
        // honored even if the page navigates mid-flight.
        batch.forEach((e) => e.attempts++);
        saveQueue(this.queue);

        try {
            const body = {
                session_id: this.sessionId,
                events: batch.map(stripQueueMetadata),
            };
            // We don't include keepalive in the axios config since axios doesn't
            // support it directly. The interval handler retries on next tick.
            // For visibilitychange paths we just best-effort.
            // Full backend path — the old proxy used to insert the /api prefix.
            const res = await apiClient.post("/api/v2/events/batch", body);

            if (res.data?.success) {
                // Remove the events we successfully sent. The backend also
                // returns `duplicates` — those were already on the server, so
                // we treat them as accepted and dequeue.
                const sentIds = new Set(batch.map((e) => e.event_id));
                this.queue = this.queue.filter((e) => !sentIds.has(e.event_id));
                saveQueue(this.queue);

                // If the backend reported mastery changes, fire a window event
                // so React components can refetch skill vectors without us
                // taking a hard dependency on a state library.
                if (Array.isArray(res.data?.mastery_changes) && res.data.mastery_changes.length > 0) {
                    window.dispatchEvent(new CustomEvent("codebud:mastery_changed", {
                        detail: res.data.mastery_changes,
                    }));
                }
            } else {
                this.dropExhausted(batch);
            }
        } catch (err) {
            // Network failure or 5xx — leave events in queue, let the interval
            // pick up. Drop any that have exceeded MAX_ATTEMPTS so a permanent
            // server bug doesn't pin them forever.
            this.dropExhausted(batch);
            if (process.env.NODE_ENV !== "production") {
                console.warn("[events] flush failed; will retry", err);
            }
        } finally {
            this.inflight = false;

            // If there's more queued, schedule another flush soon. Avoids
            // waiting up to FLUSH_INTERVAL_MS to drain a backlog.
            if (this.queue.length > 0 && !this.flushTimer) {
                this.scheduleFlush(URGENT_FLUSH_DELAY_MS);
            }

            // Suppress unused-param lint without touching the signature; we
            // may use opts.keepalive once we switch to fetch+keepalive.
            void opts;
        }
    }

    private dropExhausted(batch: QueuedEvent[]): void {
        const toDrop = new Set(
            batch.filter((e) => e.attempts >= MAX_ATTEMPTS).map((e) => e.event_id),
        );
        if (toDrop.size === 0) return;
        this.queue = this.queue.filter((e) => !toDrop.has(e.event_id));
        saveQueue(this.queue);
        if (process.env.NODE_ENV !== "production") {
            console.warn(`[events] dropped ${toDrop.size} exhausted event(s)`);
        }
    }

    /** Test/debug — return a snapshot of pending events without mutating. */
    pending(): ReadonlyArray<QueuedEvent> {
        return [...this.queue];
    }
}

function stripQueueMetadata(e: QueuedEvent) {
    const { queued_at, attempts, ...rest } = e;
    void queued_at;
    void attempts;
    return rest;
}

// Module-level singleton. Import as `events` everywhere.
export const events = new EventsClient();

// ── Type-safe helpers for the most common call sites ──────────────────

export const trackLesson = {
    started:   (course_id: string, node_id: string, skills?: string[]) =>
        events.track("lesson_started",   { course_id, curriculum_node_id: node_id, skill_slugs: skills }),
    completed: (course_id: string, node_id: string, skills?: string[], score?: number) =>
        events.track("lesson_completed", {
            course_id, curriculum_node_id: node_id, skill_slugs: skills,
            metadata: score !== undefined ? { score } : undefined,
        }),
    abandoned: (course_id: string, node_id: string, seconds_in: number) =>
        events.track("lesson_abandoned", { course_id, curriculum_node_id: node_id, metadata: { seconds_in } }),
};

export const trackQuiz = {
    passed: (assessment_id: string, score: number, skill_slugs: string[]) =>
        events.track("quiz_passed", { skill_slugs, metadata: { assessment_id, score } }),
    failed: (assessment_id: string, score: number, skill_slugs: string[]) =>
        events.track("quiz_failed", { skill_slugs, metadata: { assessment_id, score } }),
};

export const trackProject = {
    submitted: (project_id: string, skills: string[], submission_id: string) =>
        events.track("project_submitted", { skill_slugs: skills, metadata: { project_id, submission_id } }),
    reviewed:  (project_id: string, skills: string[], score: number, reviewer: "ai" | "mentor" | "peer") =>
        events.track("project_reviewed",  { skill_slugs: skills, metadata: { project_id, score, reviewer } }),
};

export const trackRecommendation = {
    shown:    (course_ids: string[]) => events.track("recommendation_shown", { metadata: { course_ids } }),
    clicked:  (course_id: string)    => events.track("recommendation_clicked", { course_id }),
    dismissed:(course_id: string)    => events.track("recommendation_dismissed", { course_id }),
    accepted: (course_id: string)    => events.track("recommendation_accepted", { course_id }),
};
