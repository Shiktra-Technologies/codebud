// User role management utility
import { supabase } from '../config/supabaseConfig';

export const USER_ROLES = {
  STUDENT: 'student',
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
 * Create user profile with role in Supabase
 */
export const createUserProfile = async (user, role = USER_ROLES.STUDENT, additionalData = {}) => {
  if (!user || !user.id) {
    throw new Error('User object is required');
  }

  if (!Object.values(USER_ROLES).includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }
  
  const userData = {
    id: user.id,
    email: user.email,
    display_name: user.user_metadata?.display_name || '',
    photo_url: user.user_metadata?.picture || '',
    role: role,
    permissions: JSON.stringify(ROLE_PERMISSIONS[role]),
    created_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
    is_active: true,
    ...additionalData
  };

  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(userData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });
    if (error) throw error;
    
    console.log(`✅ User profile created with role: ${role}`);
    return userData;
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    throw error;
  }
};

/**
 * Get user profile and role from Supabase
 */
export const getUserProfile = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    
    if (data) {
      return {
        ...data,
        permissions: ROLE_PERMISSIONS[data.role] || ROLE_PERMISSIONS[USER_ROLES.STUDENT]
      };
    } else {
      // If user profile doesn't exist, return null
      console.log('User profile not found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Update user role (only Super Admin can do this)
 */
export const updateUserRole = async (userId, newRole, updatedBy) => {
  if (!userId || !newRole || !updatedBy) {
    throw new Error('User ID, new role, and updater ID are required');
  }

  if (!Object.values(USER_ROLES).includes(newRole)) {
    throw new Error(`Invalid role: ${newRole}`);
  }

  try {
    const updateData = {
      role: newRole,
      permissions: JSON.stringify(ROLE_PERMISSIONS[newRole]),
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
      role_history: JSON.stringify({
        previousRole: '', // You can get this from current data first
        newRole: newRole,
        changedAt: new Date().toISOString(),
        changedBy: updatedBy
      })
    };

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;
    
    console.log(`✅ User role updated to: ${newRole}`);
    return updateData;
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    throw error;
  }
};

/**
 * Get all users by role (Admin and Super Admin access)
 */
export const getUsersByRole = async (role = null) => {
  try {
    let query = supabase
      .from('users')
      .select('*')
      .eq('is_active', true);

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('❌ Error fetching users by role:', error);
    throw error;
  }
};

/**
 * Get all active students (for Admin dashboard)
 */
export const getActiveStudents = async () => {
  return await getUsersByRole(USER_ROLES.STUDENT);
};

/**
 * Check if user has permission
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions && permissions[permission] === true;
};

/**
 * Get user test submissions and results
 */
export const getUserTestResults = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('❌ Error fetching user test results:', error);
    throw error;
  }
};

/**
 * Get all test submissions (for Admin dashboard)
 */
export const getAllTestResults = async () => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('❌ Error fetching all test results:', error);
    throw error;
  }
};

/**
 * Save test results to Supabase
 */
export const saveTestResults = async (userId, testData) => {
  try {
    const resultData = {
      user_id: userId,
      ...testData,
      submitted_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('submissions')
      .insert(resultData)
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Test results saved successfully');
    return data;
  } catch (error) {
    console.error('❌ Error saving test results:', error);
    throw error;
  }
};

/**
 * Update user last login time
 */
export const updateLastLogin = async (userId) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ 
        last_login_at: new Date().toISOString() 
      })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Error updating last login:', error);
    // Don't throw error - this is not critical
  }
};

/**
 * Deactivate user (soft delete)
 */
export const deactivateUser = async (userId, deactivatedBy) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivated_by: deactivatedBy
      })
      .eq('id', userId);

    if (error) throw error;
    
    console.log('✅ User deactivated successfully');
  } catch (error) {
    console.error('❌ Error deactivating user:', error);
    throw error;
  }
};

/**
 * Super admin login verification
 */
export const SUPER_ADMIN_CONFIG = {
  secretCode: 'CODEBUD_SUPER_ADMIN_2025' // Change this to your secret code
};

export const verifySuperAdminAccess = (secretCode) => {
  return secretCode === SUPER_ADMIN_CONFIG.secretCode;
};
