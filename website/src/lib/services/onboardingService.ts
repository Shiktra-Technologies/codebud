import apiClient from '@/lib/apiClient';

/**
 * Onboarding Service — API calls for student onboarding flow
 */

export interface OnboardingConfig {
    colleges: string[];
    degrees: string[];
    branches: string[];
    programming_languages: string[];
    frameworks: string[];
    interest_topics: string[];
    career_goals: string[];
    job_roles: string[];
    dream_companies: string[];
}

export interface OnboardingProfile {
    display_name: string;
    phone: string;
    dob: string;
    gender: string;
    city: string;
    bio: string;
    linkedin: string;
    github: string;
    portfolio: string;
}

export interface OnboardingEducation {
    status: string;
    college: string;
    degree: string;
    branch: string;
    year: string;
    graduation_year: string;
    cgpa: string;
}

export interface OnboardingSkills {
    languages: { name: string; level: string }[];
    frameworks: string[];
    interests: string[];
}

export interface OnboardingCareer {
    goals: string[];
    dream_companies: string[];
    preferred_roles: string[];
    weekly_hours: string;
}

export interface OnboardingData {
    profile: OnboardingProfile;
    education: OnboardingEducation;
    skills: OnboardingSkills;
    career: OnboardingCareer;
}

// ── Fetch dynamic config (dropdown options) ──

export async function getOnboardingConfig(): Promise<{ success: boolean; config: OnboardingConfig }> {
    const res = await apiClient.get('/api/onboarding/config');
    return res.data;
}

// ── Submit completed onboarding ──

export async function completeOnboarding(data: OnboardingData) {
    const res = await apiClient.post('/api/onboarding/complete', data);
    return res.data;
}

// ── Get existing onboarding data (for edit mode) ──

export async function getOnboardingData(): Promise<{ success: boolean; onboarding_completed: boolean; data: OnboardingData }> {
    const res = await apiClient.get('/api/onboarding/data');
    return res.data;
}

// ── Super Admin: get all platform configs ──

export async function getAllPlatformConfig() {
    const res = await apiClient.get('/api/super-admin/platform-config');
    return res.data;
}

// ── Super Admin: update a config category ──

export async function updatePlatformConfig(category: string, values: { label: string; active: boolean }[]) {
    const res = await apiClient.put(`/api/super-admin/platform-config/${category}`, { values });
    return res.data;
}

// ── Super Admin: reset student onboarding ──

export async function resetStudentOnboarding(userId: string) {
    const res = await apiClient.post(`/api/super-admin/users/${userId}/reset-onboarding`);
    return res.data;
}

export default {
    getOnboardingConfig,
    completeOnboarding,
    getOnboardingData,
    getAllPlatformConfig,
    updatePlatformConfig,
    resetStudentOnboarding,
};
