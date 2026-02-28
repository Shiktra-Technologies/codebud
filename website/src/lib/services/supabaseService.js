/**
 * User Service — replaces supabaseService.js
 * All calls go through Flask backend API → MongoDB
 */

import apiClient from '@/lib/apiClient';

// ==================== USER MANAGEMENT ====================

/**
 * Save/create user (called after signup)
 */
export const saveUser = async (userData) => {
  // User is created during signup — this is a no-op compatibility shim
  console.log('[USER] saveUser called (handled by signup API)');
  return { success: true };
};

// Backward-compat alias
export const saveUserToSupabase = saveUser;

/**
 * Get user data by ID
 */
export const getUser = async (userId) => {
  try {
    const response = await apiClient.get(`/api/users/${userId}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error('[USER] Error getting user:', error?.response?.data?.error || error.message);
    return { success: false, error: error.message };
  }
};

// Backward-compat alias
export const getUserFromSupabase = getUser;

/**
 * Get all users (admin only)
 */
export const getAllUsers = async () => {
  try {
    const response = await apiClient.get('/api/users');
    console.log(`✅ Retrieved ${response.data.count} users from API`);
    return response.data.data || [];
  } catch (error) {
    console.error('[USER] Error getting all users:', error.message);
    // Fallback to localStorage
    const existingUsers = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
    console.log(`✅ Fallback: Retrieved ${existingUsers.length} users from localStorage`);
    return existingUsers;
  }
};

// Backward-compat aliases
export const getAllUsersFromSupabase = async () => {
  const data = await getAllUsers();
  return { success: true, data };
};

/**
 * Update user activity (last active time)
 */
export const updateUserActivity = async (userId) => {
  if (!userId) {
    console.warn('⚠️ Cannot update user activity: userId is undefined');
    return;
  }

  try {
    await apiClient.patch(`/api/users/${userId}/activity`);
    console.log('[SUCCESS] User activity updated');
  } catch (error) {
    console.error('[ERROR] Error updating user activity:', error.message);
  }
};

/**
 * Update user data (admin/super admin only)
 */
export const updateUser = async (userId, updates) => {
  if (!userId) {
    console.warn('⚠️ Cannot update user: userId is undefined');
    return { success: false, error: 'User ID is required' };
  }

  try {
    const response = await apiClient.patch(`/api/users/${userId}`, updates);
    console.log('[SUCCESS] User updated:', userId);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[ERROR] Error updating user:', error.message);
    return { success: false, error: error?.response?.data?.error || error.message };
  }
};

/**
 * Sync pending submissions (compatibility placeholder)
 */
export const syncPendingSubmissions = async () => {
  console.log('📡 Sync pending submissions called (placeholder)');
  return { success: true };
};

/**
 * Save submission forwarding data (compatibility placeholder)
 */
export const saveSubmissionForwarding = async (forwardingData) => {
  console.log('📡 Save submission forwarding called:', forwardingData);
  try {
    const existingForwarding = JSON.parse(localStorage.getItem('submission_forwarding') || '[]');
    existingForwarding.push(forwardingData);
    if (existingForwarding.length > 100) {
      existingForwarding.splice(0, existingForwarding.length - 100);
    }
    localStorage.setItem('submission_forwarding', JSON.stringify(existingForwarding));
    return { success: true };
  } catch (error) {
    console.warn('Failed to save forwarding data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if submissions table exists (compatibility)
 */
export const checkSubmissionCSVTable = async () => {
  return { exists: true };
};

// ==================== SUBMISSION FUNCTIONS (re-exports) ====================

export const submitTestToSupabase = async (userId, submissionData) => {
  try {
    const { submitTest } = await import('./submissionService');
    return await submitTest(userId, submissionData);
  } catch (error) {
    console.error('[ERROR] Error loading submission service:', error);
    return { success: false, error: error.message };
  }
};

export const getAllSubmissions = async () => {
  try {
    const { getAllSubmissions: getAll } = await import('./submissionService');
    return await getAll();
  } catch (error) {
    console.error('[ERROR] Error loading submission service:', error);
    const localSubmissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
    return { success: true, data: localSubmissions, count: localSubmissions.length, fallback: true };
  }
};

export const getAllSubmissionsForAdmin = getAllSubmissions;

// ==================== EXPORTS ====================

export default {
  saveUser,
  saveUserToSupabase,
  getUser,
  getUserFromSupabase,
  getAllUsers,
  getAllUsersFromSupabase,
  updateUser,
  updateUserActivity,
  syncPendingSubmissions,
  saveSubmissionForwarding,
  submitTestToSupabase,
  getAllSubmissions,
  getAllSubmissionsForAdmin,
  checkSubmissionCSVTable,
};
