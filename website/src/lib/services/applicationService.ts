import apiClient from '@/lib/apiClient';

/**
 * Application Service — API calls for job applications
 */

export interface Application {
    _id: string;
    job_id: string;
    student_id: string;
    company_id: string;
    status: 'applied' | 'screening' | 'interview' | 'offered' | 'rejected' | 'withdrawn';
    cover_note: string;
    status_history: { status: string; changed_at: string; changed_by: string }[];
    interview_slot: { date: string; time: string; link: string } | null;
    notes: string;
    created_at: string;
    updated_at: string;
    // Joined data
    job?: any;
    student?: any;
    company_name?: string;
}

// ── Student Actions ──

export async function applyToJob(jobId: string, coverNote?: string) {
    const res = await apiClient.post(`/api/jobs/${jobId}/apply`, { cover_note: coverNote || '' });
    return res.data;
}

export async function getMyApplications(): Promise<{ success: boolean; applications: Application[] }> {
    const res = await apiClient.get('/api/applications/me');
    return res.data;
}

// ── Company Actions ──

export async function getJobApplications(jobId: string): Promise<{ success: boolean; applications: Application[] }> {
    const res = await apiClient.get(`/api/jobs/${jobId}/applications`);
    return res.data;
}

export async function updateApplicationStatus(applicationId: string, status: string, notes?: string) {
    const res = await apiClient.patch(`/api/applications/${applicationId}/status`, { status, notes });
    return res.data;
}

export async function scheduleInterview(applicationId: string, date: string, time: string, link?: string) {
    const res = await apiClient.post(`/api/applications/${applicationId}/interview`, { date, time, link });
    return res.data;
}

export default {
    applyToJob,
    getMyApplications,
    getJobApplications,
    updateApplicationStatus,
    scheduleInterview,
};
