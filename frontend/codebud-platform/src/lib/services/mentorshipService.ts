import apiClient from '@/lib/apiClient';

// ──────── Types ────────

export interface MentorUser {
    _id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
}

export interface MentorAssignment {
    _id: string;
    student_id: string;
    mentor_id: string;
    assigned_at: string;
    status: string;
}

export interface MentorshipTask {
    _id: string;
    mentor_id: string;
    student_id: string;
    title: string;
    description: string;
    priority: string;
    due_date?: string;
    skills: string[];
    difficulty_level: string;
    status: string;
    created_at: string;
}

export interface MentorshipProject {
    _id: string;
    mentor_id: string;
    student_id: string;
    title: string;
    description: string;
    due_date?: string;
    skills: string[];
    difficulty_level: string;
    status: string;
    created_at: string;
}

// ──────── API Calls ────────

export async function getMyMentor(): Promise<{ mentor: MentorUser | null, assignment: MentorAssignment | null }> {
    try {
        const res = await apiClient.get('/api/student/mentor');
        if (res.data.success) {
            return { mentor: res.data.mentor, assignment: res.data.assignment };
        }
        return { mentor: null, assignment: null };
    } catch {
        return { mentor: null, assignment: null };
    }
}

export async function getStudentTasks(): Promise<MentorshipTask[]> {
    try {
        const res = await apiClient.get('/api/student/tasks');
        if (res.data.success) {
            return res.data.tasks;
        }
        return [];
    } catch {
        return [];
    }
}

export async function getMentorTasks(): Promise<MentorshipTask[]> {
    try {
        const res = await apiClient.get('/api/mentor/tasks');
        if (res.data.success) {
            return res.data.tasks;
        }
        return [];
    } catch {
        return [];
    }
}

export async function submitTask(taskId: string, payload: any): Promise<{ success: boolean; message?: string }> {
    try {
        const res = await apiClient.post(`/api/student/tasks/${taskId}/submit`, payload);
        return res.data;
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function requestMeeting(payload: any): Promise<{ success: boolean; meeting?: any }> {
    try {
        const res = await apiClient.post('/api/student/meetings', payload);
        return res.data;
    } catch (e: any) {
        return { success: false };
    }
}

export async function getStudentProjects(): Promise<MentorshipProject[]> {
    try {
        const res = await apiClient.get('/api/student/projects');
        if (res.data.success) {
            return res.data.projects;
        }
        return [];
    } catch {
        return [];
    }
}

export async function getMentorProjects(): Promise<MentorshipProject[]> {
    try {
        const res = await apiClient.get('/api/mentor/projects');
        if (res.data.success) {
            return res.data.projects;
        }
        return [];
    } catch {
        return [];
    }
}

export async function submitProject(projectId: string, formData: FormData): Promise<{ success: boolean; message?: string }> {
    try {
        const res = await apiClient.post(`/api/student/projects/${projectId}/submit`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function submitTaskMultipart(taskId: string, formData: FormData): Promise<{ success: boolean; message?: string }> {
    try {
        const res = await apiClient.post(`/api/student/tasks/${taskId}/submit`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function reviewTask(taskId: string, payload: any): Promise<{ success: boolean; message?: string }> {
    try {
        const res = await apiClient.post(`/api/mentor/tasks/${taskId}/review`, payload);
        return res.data;
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function reviewProject(projectId: string, payload: any): Promise<{ success: boolean; message?: string }> {
    try {
        const res = await apiClient.post(`/api/mentor/projects/${projectId}/review`, payload);
        return res.data;
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
