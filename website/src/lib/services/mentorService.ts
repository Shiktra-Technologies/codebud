/**
 * Mentor Service — API layer for all mentor dashboard operations
 */
import apiClient from '@/lib/apiClient';

// ──────── Types ────────

export interface MentorStudent {
    _id: string;
    email: string;
    display_name: string;
    role: string;
    created_at: string;
    last_active: string;
}

export interface StudentAnalytics {
    student: MentorStudent | null;
    analytics: {
        aptitude: {
            avg_score: number;
            total_attempts: number;
            scores: Array<{ score: number; date: string }>;
        };
        dsa: {
            total_submissions: number;
            passed: number;
            pass_rate: number;
        };
        time_spent: number;
        last_active: string | null;
    };
}

export interface MentorFeedback {
    _id: string;
    mentor_id: string;
    student_id: string;
    submission_id?: string;
    feedback: string;
    rating?: number;
    category: string;
    created_at: string;
}

export interface PracticeSet {
    _id: string;
    mentor_id: string;
    title: string;
    description: string;
    problem_ids: string[];
    assigned_students: string[];
    deadline?: string;
    status: string;
    created_at: string;
    completion_rate: number;
    completed_count: number;
}

export interface DashboardStats {
    total_students: number;
    active_today: number;
    avg_aptitude_score: number;
    dsa_submissions: number;
    dsa_pass_rate: number;
    practice_sets: number;
    feedbacks_given: number;
}

// ──────── API Calls ────────

export async function getMentorStudents(): Promise<MentorStudent[]> {
    const res = await apiClient.get('/api/mentor/students');
    return res.data.success ? res.data.data : [];
}

export async function getStudentAnalytics(studentId: string): Promise<StudentAnalytics | null> {
    const res = await apiClient.get(`/api/mentor/students/${studentId}/analytics`);
    return res.data.success ? res.data : null;
}

export async function addFeedback(data: {
    student_id: string;
    submission_id?: string;
    feedback: string;
    rating?: number;
    category?: string;
}): Promise<{ success: boolean; feedback_id?: string }> {
    const res = await apiClient.post('/api/mentor/feedback', data);
    return res.data;
}

export async function getStudentFeedback(studentId: string): Promise<MentorFeedback[]> {
    const res = await apiClient.get(`/api/mentor/feedback/${studentId}`);
    return res.data.success ? res.data.data : [];
}

export async function createPracticeSet(data: {
    title: string;
    description: string;
    problem_ids: string[];
    assigned_students: string[];
    deadline?: string;
}): Promise<{ success: boolean; practice_set_id?: string }> {
    const res = await apiClient.post('/api/mentor/practice-sets', data);
    return res.data;
}

export async function getPracticeSets(): Promise<PracticeSet[]> {
    const res = await apiClient.get('/api/mentor/practice-sets');
    return res.data.success ? res.data.data : [];
}

export async function updatePracticeSet(setId: string, data: Partial<PracticeSet>): Promise<{ success: boolean }> {
    const res = await apiClient.patch(`/api/mentor/practice-sets/${setId}`, data);
    return res.data;
}

export async function getMentorDashboardStats(): Promise<DashboardStats | null> {
    const res = await apiClient.get('/api/mentor/dashboard-stats');
    return res.data.success ? res.data.stats : null;
}

export async function getStudentSubmissions(studentId: string) {
    const res = await apiClient.get(`/api/submissions/${studentId}`);
    return res.data.success ? res.data.data : [];
}

export async function getStudentCodeSubmissions(studentId: string) {
    const res = await apiClient.get(`/api/code-submissions/${studentId}`);
    return res.data.success ? res.data.data : [];
}

export async function unassignStudent(mentorId: string, studentId: string): Promise<{ success: boolean }> {
    const res = await apiClient.delete(`/api/mentor/students/${studentId}?mentor_id=${mentorId}`);
    return res.data;
}

export async function updateFeedback(feedbackId: string, data: { feedback?: string; rating?: number; category?: string }): Promise<{ success: boolean }> {
    const res = await apiClient.patch(`/api/mentor/feedback/${feedbackId}`, data);
    return res.data;
}

export async function deleteFeedback(feedbackId: string): Promise<{ success: boolean }> {
    const res = await apiClient.delete(`/api/mentor/feedback/${feedbackId}`);
    return res.data;
}
