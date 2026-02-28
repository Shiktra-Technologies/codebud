/**
 * Submission Service — replaces Supabase-based submission logic
 * All calls go through Flask backend API → MongoDB
 */

import apiClient from '@/lib/apiClient';

// In-memory cache to prevent duplicate submissions from React.StrictMode
const recentSubmissions = new Map();
const SUBMISSION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function cleanupCache() {
  const now = Date.now();
  for (const [key, timestamp] of recentSubmissions.entries()) {
    if (now - timestamp > SUBMISSION_CACHE_DURATION) {
      recentSubmissions.delete(key);
    }
  }
}

function generateSubmissionKey(userId, submissionData) {
  return `${userId}_${submissionData?.test_type}_${submissionData?.score}_${submissionData?.total_questions}`;
}

/**
 * Submit test results to MongoDB via API
 */
export const submitTest = async (userId, submissionData) => {
  cleanupCache();

  const key = generateSubmissionKey(userId, submissionData);
  if (recentSubmissions.has(key)) {
    console.log('[SUBMISSION] Duplicate detected, skipping');
    return { success: true, duplicate: true };
  }

  try {
    const response = await apiClient.post('/api/submissions', {
      user_id: userId,
      test_type: submissionData.test_type || 'unknown',
      score: submissionData.score || 0,
      total_questions: submissionData.total_questions || 0,
      correct_answers: submissionData.correct || submissionData.correct_answers || 0,
      answers: submissionData.answers || {},
      time_taken: submissionData.time_taken || 0,
    });

    if (response.data.success) {
      recentSubmissions.set(key, Date.now());
      console.log('[SUBMISSION] Saved successfully');
      return { success: true, data: response.data.data };
    }

    return { success: false, error: response.data.error || 'Submission failed' };
  } catch (error) {
    console.error('[SUBMISSION] Error:', error.message);
    // Fallback: save to localStorage
    try {
      const localSubmissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      localSubmissions.push({
        id: `local_${Date.now()}`,
        user_id: userId,
        ...submissionData,
        submitted_at: new Date().toISOString(),
        local: true,
      });
      localStorage.setItem('all_submissions', JSON.stringify(localSubmissions));
      recentSubmissions.set(key, Date.now());
      return { success: true, fallback: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};

// Backward-compat alias
export const submitTestToSupabase = submitTest;

/**
 * Get user's display name
 */
export const getUserDisplayName = async (userId) => {
  try {
    const response = await apiClient.get(`/api/users/${userId}`);
    if (response.data.success) {
      return response.data.data?.display_name || 'Unknown User';
    }
    return 'Unknown User';
  } catch {
    return 'Unknown User';
  }
};

/**
 * Get all submissions (admin)
 */
export const getAllSubmissions = async () => {
  try {
    const response = await apiClient.get('/api/submissions');
    if (response.data.success) {
      console.log(`✅ Retrieved ${response.data.count} submissions from API`);
      return {
        success: true,
        data: response.data.data || [],
        count: response.data.count || 0,
      };
    }
    return { success: true, data: [], count: 0 };
  } catch (error) {
    console.error('[SUBMISSION] Error getting all submissions:', error.message);
    // Fallback
    const localSubmissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
    return {
      success: true,
      data: localSubmissions,
      count: localSubmissions.length,
      fallback: true,
    };
  }
};

// Backward-compat alias
export const getAllSubmissionsFromSupabase = getAllSubmissions;

/**
 * Get submissions for a specific user
 */
export const getUserSubmissions = async (userId) => {
  try {
    const response = await apiClient.get(`/api/submissions/${userId}`);
    if (response.data.success) {
      return { success: true, data: response.data.data, count: response.data.count };
    }
    return { success: true, data: [], count: 0 };
  } catch (error) {
    console.error('[SUBMISSION] Error getting user submissions:', error.message);
    return { success: false, data: [], error: error.message };
  }
};

export default {
  submitTest,
  submitTestToSupabase,
  getAllSubmissions,
  getAllSubmissionsFromSupabase,
  getUserSubmissions,
  getUserDisplayName,
};
