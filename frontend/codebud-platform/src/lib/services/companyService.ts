import apiClient from '@/lib/apiClient';

/**
 * Company Service — API calls for company profile management
 */

export interface CompanyProfile {
    _id: string;
    user_id: string;
    name: string;
    logo_url: string;
    description: string;
    website: string;
    industry: string;
    size: string;
    location: string;
    social_links: { linkedin?: string; twitter?: string; github?: string };
    verified: boolean;
    created_at: string;
    updated_at: string;
    job_count?: number;
    email?: string;
}

// ── Company Profile (company user) ──

export async function createCompanyProfile(data: Partial<CompanyProfile>) {
    const res = await apiClient.post('/api/company/profile', data);
    return res.data;
}

export async function getMyCompanyProfile() {
    const res = await apiClient.get('/api/company/profile');
    return res.data;
}

export async function updateCompanyProfile(data: Partial<CompanyProfile>) {
    const res = await apiClient.patch('/api/company/profile', data);
    return res.data;
}

export async function getPublicCompanyProfile(companyId: string) {
    const res = await apiClient.get(`/api/company/profile/${companyId}`);
    return res.data;
}

// ── Admin ──

export async function listCompanies(): Promise<{ success: boolean; companies: CompanyProfile[] }> {
    const res = await apiClient.get('/api/admin/companies');
    return res.data;
}

export async function verifyCompany(companyId: string) {
    const res = await apiClient.patch(`/api/admin/companies/${companyId}/verify`);
    return res.data;
}

export async function getJobStats() {
    const res = await apiClient.get('/api/admin/job-stats');
    return res.data;
}

export default {
    createCompanyProfile,
    getMyCompanyProfile,
    updateCompanyProfile,
    getPublicCompanyProfile,
    listCompanies,
    verifyCompany,
    getJobStats,
};
