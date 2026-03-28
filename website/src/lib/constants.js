/**
 * Shared constants — moved from supabase.ts
 */

export const USER_ROLES = {
    STUDENT: 'student',
    MENTOR: 'mentor',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin',
    COMPANY: 'company',
};

export const ROLE_PERMISSIONS = {
    [USER_ROLES.STUDENT]: ['view_dashboard', 'submit_test', 'view_results', 'view_courses', 'enroll_course', 'view_jobs', 'apply_job'],
    [USER_ROLES.MENTOR]: ['view_dashboard', 'view_results', 'view_assigned_students', 'view_submissions', 'add_feedback', 'manage_practice_sets', 'view_violations'],
    [USER_ROLES.ADMIN]: ['view_dashboard', 'submit_test', 'view_results', 'manage_students', 'view_submissions', 'export_data'],
    [USER_ROLES.SUPER_ADMIN]: ['view_dashboard', 'submit_test', 'view_results', 'manage_students', 'view_submissions', 'export_data', 'manage_admins', 'system_settings', 'manage_courses', 'manage_companies'],
    [USER_ROLES.COMPANY]: ['view_company_dashboard', 'manage_jobs', 'view_applications', 'manage_company_profile'],
};

function resolveApiUrl() {
    const configured = String(process.env.NEXT_PUBLIC_API_URL || '').trim();
    if (configured) return configured;

    if (typeof window !== 'undefined' && window.location?.hostname && window.location.hostname !== 'localhost') {
        return `${window.location.protocol}//${window.location.hostname}:5001`;
    }

    return 'http://localhost:5001';
}

export const API_URL = resolveApiUrl();
