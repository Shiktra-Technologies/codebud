/**
 * Role Manager — Migrated from Supabase to MongoDB API
 * All user/role operations go through the Flask backend API
 */

import apiClient from '../apiClient';

export const USER_ROLES = {
  STUDENT: 'student',
  MENTOR: 'mentor',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

export const ROLE_PERMISSIONS = {
  [USER_ROLES.STUDENT]: {
    canTakeTests: true,
    canViewOwnResults: true,
    canAccessDashboard: true,
    canViewProblems: true,
    canSubmitSolutions: true
  },
  [USER_ROLES.MENTOR]: {
    canTakeTests: false,
    canViewOwnResults: false,
    canAccessDashboard: true,
    canViewProblems: true,
    canSubmitSolutions: false,
    canViewStudents: true,       // assigned students only
    canViewAllResults: false,
    canManageTests: false,
    canGenerateReports: false,
    canViewSubmissions: true,    // assigned students only
    canAddFeedback: true,
    canManagePracticeSets: true,
    canViewViolations: true,     // assigned students only
  },
  [USER_ROLES.ADMIN]: {
    canTakeTests: false,
    canViewOwnResults: true,
    canAccessDashboard: true,
    canViewProblems: false,
    canSubmitSolutions: false,
    canViewStudents: true,
    canViewAllResults: true,
    canManageTests: true,
    canGenerateReports: true,
    canViewSubmissions: true
  },
  [USER_ROLES.SUPER_ADMIN]: {
    canTakeTests: false,
    canViewOwnResults: true,
    canAccessDashboard: true,
    canViewProblems: false,
    canSubmitSolutions: false,
    canViewStudents: true,
    canViewAllResults: true,
    canManageTests: true,
    canGenerateReports: true,
    canViewSubmissions: true,
    canManageUsers: true,
    canManageAdmins: true,
    canModifyPermissions: true,
    canViewSystemStats: true,
    canAccessSecretLogin: true,
    canDeleteUsers: true,
    canResetPasswords: true,
    canViewAuditLogs: true
  }
};

/**
 * Get user profile via API
 */
export const getUserProfile = async (userId) => {
  if (!userId) throw new Error('User ID is required');
  try {
    const response = await apiClient.get(`/api/users/${userId}`);
    if (response.data.success) {
      const data = response.data.data;
      return { ...data, permissions: ROLE_PERMISSIONS[data.role] || ROLE_PERMISSIONS[USER_ROLES.STUDENT] };
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    return null;
  }
};

/**
 * Get all users by role (Admin access)
 */
export const getUsersByRole = async (role = null) => {
  try {
    const response = await apiClient.get('/api/users');
    if (response.data.success) {
      let users = response.data.data || [];
      if (role) users = users.filter(u => u.role === role);
      return users;
    }
    return [];
  } catch (error) {
    console.error('❌ Error fetching users by role:', error);
    return [];
  }
};

export const getActiveStudents = async () => getUsersByRole(USER_ROLES.STUDENT);

/**
 * Check if user has permission
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions && permissions[permission] === true;
};

/**
 * Get user test submissions via API
 */
export const getUserTestResults = async (userId) => {
  try {
    const response = await apiClient.get(`/api/submissions/${userId}`);
    if (response.data.success) return response.data.data || [];
    return [];
  } catch (error) {
    console.error('❌ Error fetching user test results:', error);
    return [];
  }
};

/**
 * Get all test submissions (admin)
 */
export const getAllTestResults = async () => {
  try {
    const response = await apiClient.get('/api/submissions');
    if (response.data.success) return response.data.data || [];
    return [];
  } catch (error) {
    console.error('❌ Error fetching all test results:', error);
    return [];
  }
};

/**
 * Save test results via API
 */
export const saveTestResults = async (userId, testData) => {
  try {
    const response = await apiClient.post('/api/submissions', {
      ...testData,
      user_id: userId,
    });
    if (response.data.success) {
      console.log('✅ Test results saved successfully');
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('❌ Error saving test results:', error);
    throw error;
  }
};

/**
 * Update user last active
 */
export const updateLastLogin = async (userId) => {
  try {
    await apiClient.patch(`/api/users/${userId}/activity`);
  } catch (error) {
    console.error('❌ Error updating last login:', error);
  }
};

// Stubs for backward compat
export const createUserProfile = async (user, role = USER_ROLES.STUDENT) => {
  console.log('createUserProfile called — handled by signup API');
  return { ...user, role, permissions: ROLE_PERMISSIONS[role] };
};

export const updateUserRole = async () => {
  console.warn('updateUserRole not yet implemented via API');
};

export const deactivateUser = async () => {
  console.warn('deactivateUser not yet implemented via API');
};

export const SUPER_ADMIN_CONFIG = {
  secretCode: 'CODEBUD_SUPER_ADMIN_2025'
};

export const verifySuperAdminAccess = (secretCode) => {
  return secretCode === SUPER_ADMIN_CONFIG.secretCode;
};
