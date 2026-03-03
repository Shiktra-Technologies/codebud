/**
 * Shared constants — moved from supabase.ts
 */

export const USER_ROLES = {
    STUDENT: 'student',
    MENTOR: 'mentor',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin',
};

export const ROLE_PERMISSIONS = {
    [USER_ROLES.STUDENT]: ['view_dashboard', 'submit_test', 'view_results'],
    [USER_ROLES.MENTOR]: ['view_dashboard', 'view_results', 'view_assigned_students', 'view_submissions', 'add_feedback', 'manage_practice_sets', 'view_violations'],
    [USER_ROLES.ADMIN]: ['view_dashboard', 'submit_test', 'view_results', 'manage_students', 'view_submissions', 'export_data'],
    [USER_ROLES.SUPER_ADMIN]: ['view_dashboard', 'submit_test', 'view_results', 'manage_students', 'view_submissions', 'export_data', 'manage_admins', 'system_settings'],
};

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
