import { supabase } from '../config/supabaseConfig';

/**
 * Clean Supabase Service Layer - Fixed for black screen issue
 */

// ==================== USER MANAGEMENT ====================

/**
 * Save user data to Supabase
 * @param {object} user - User object from Supabase auth
 * @param {object} userData - Additional user data object
 */
export const saveUserToSupabase = async (user, role) => {
  try {
    const userData = {
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.displayName || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
      role: role || 'student',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_active: new Date().toISOString()
    };

    console.log('💾 Saving user to Supabase:', userData);

    const { data, error } = await supabase
      .from('users')
      .upsert(userData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('[ERROR] Error saving user to Supabase:', error);
      throw error;
    }

    console.log('[SUCCESS] User saved to Supabase successfully');
    return { success: true, data };
  } catch (error) {
    console.error('[ERROR] Error in saveUserToSupabase:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user data from Supabase
 * @param {string} userId - User ID to fetch
 */
export const getUserFromSupabase = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('[ERROR] Error getting user from Supabase:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all users (for admin dashboard)
 */
export const getAllUsersFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    console.log(`✅ Retrieved ${data.length} users from Supabase`);
    return { success: true, data };
  } catch (error) {
    console.error('[ERROR] Error getting all users from Supabase:', error);
    return { success: true, data: [], fallback: true };
  }
};

/**
 * Get all users with fallback to localStorage
 */
export const getAllUsers = async () => {
  try {
    const result = await getAllUsersFromSupabase();
    if (result.success && result.data.length > 0) {
      return result.data;
    }
  } catch (error) {
    console.warn('Failed to get users from Supabase, using localStorage fallback');
  }
  
  // Fallback to localStorage
  const existingUsers = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
  console.log(`✅ Fallback: Retrieved ${existingUsers.length} users from localStorage`);
  return existingUsers;
};

// ==================== SUBMISSIONS ====================

/**
 * Submit test to Supabase - redirects to clean submission service
 */
export const submitTestToSupabase = async (userId, submissionData) => {
  try {
    // Use the new clean submission service
    const { submitTestToSupabase: submitTest } = await import('./submissionService');
    return await submitTest(userId, submissionData);
  } catch (error) {
    console.error('[ERROR] Error loading submission service:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all submissions - redirects to clean submission service
 */
export const getAllSubmissions = async () => {
  try {
    // Use the new clean submission service
    const { getAllSubmissionsFromSupabase } = await import('./submissionService');
    return await getAllSubmissionsFromSupabase();
  } catch (error) {
    console.error('[ERROR] Error loading submission service:', error);
    // Fallback to localStorage
    const localSubmissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
    return { 
      success: true, 
      data: localSubmissions,
      count: localSubmissions.length,
      fallback: true 
    };
  }
};

/**
 * Get all submissions for admin
 */
export const getAllSubmissionsForAdmin = async () => {
  return await getAllSubmissions();
};

/**
 * Update user activity (last active time)
 * @param {string} userId - User ID
 */
export const updateUserActivity = async (userId) => {
  if (!userId) {
    console.warn('⚠️ Cannot update user activity: userId is undefined');
    return;
  }

  try {
    const { error } = await supabase
      .from('users')
      .update({ 
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
    
    console.log('[SUCCESS] User activity updated in Supabase');
  } catch (error) {
    console.error('[ERROR] Error updating user activity in Supabase:', error);
  }
};

/**
 * Sync pending submissions (placeholder for compatibility)
 */
export const syncPendingSubmissions = async () => {
  console.log('📡 Sync pending submissions called (placeholder)');
  // Placeholder function for compatibility
  return { success: true };
};

/**
 * Save submission forwarding data (placeholder for compatibility)
 */
export const saveSubmissionForwarding = async (forwardingData) => {
  console.log('📡 Save submission forwarding called:', forwardingData);
  // For now, just save to localStorage as fallback
  try {
    const existingForwarding = JSON.parse(localStorage.getItem('submission_forwarding') || '[]');
    existingForwarding.push(forwardingData);
    
    // Keep only last 100 entries to prevent quota exceeded
    if (existingForwarding.length > 100) {
      existingForwarding.splice(0, existingForwarding.length - 100);
    }
    
    localStorage.setItem('submission_forwarding', JSON.stringify(existingForwarding));
    return { success: true };
  } catch (error) {
    console.warn('Failed to save forwarding data to localStorage:', error);
    return { success: false, error: error.message };
  }
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Check if submission_csv table exists
 */
export const checkSubmissionCSVTable = async () => {
  try {
    const { data, error } = await supabase
      .from('submission_csv')
      .select('id')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      return { exists: false, error };
    }
    
    return { exists: true, data };
  } catch (error) {
    return { exists: false, error };
  }
};

// ==================== EXPORTS ====================

export default {
  saveUserToSupabase,
  getUserFromSupabase,
  getAllUsersFromSupabase,
  getAllUsers,
  updateUserActivity,
  syncPendingSubmissions,
  saveSubmissionForwarding,
  submitTestToSupabase,
  getAllSubmissions,
  getAllSubmissionsForAdmin,
  checkSubmissionCSVTable
};
