import apiClient from '@/lib/apiClient';

/**
 * Job Service — API-backed job posting CRUD
 * (Replaces the old localStorage-based jobService)
 */

export interface Job {
    _id: string;
    company_id: string;
    title: string;
    description: string;
    requirements: string[];
    skills_required: string[];
    type: 'full-time' | 'part-time' | 'internship' | 'contract' | 'remote';
    location: string;
    salary_range: { min?: number; max?: number; currency?: string };
    experience_level: 'entry' | 'mid' | 'senior';
    application_deadline?: string;
    is_active: boolean;
    views_count: number;
    created_at: string;
    updated_at: string;
    // Joined
    company_name?: string;
    company_logo?: string;
    company?: any;
    application_count?: number;
}

export async function createJob(data: Partial<Job>) {
    const res = await apiClient.post('/api/jobs', data);
    return res.data;
}

export async function listJobs(): Promise<{ success: boolean; jobs: Job[] }> {
    const res = await apiClient.get('/api/jobs');
    return res.data;
}

export async function getJob(jobId: string) {
    const res = await apiClient.get(`/api/jobs/${jobId}`);
    return res.data;
}

export async function updateJob(jobId: string, data: Partial<Job>) {
    const res = await apiClient.patch(`/api/jobs/${jobId}`, data);
    return res.data;
}

export async function deleteJob(jobId: string) {
    const res = await apiClient.delete(`/api/jobs/${jobId}`);
    return res.data;
}

export default {
    createJob,
    listJobs,
    getJob,
    updateJob,
    deleteJob,
};
