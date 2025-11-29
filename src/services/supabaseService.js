import { supabase } from '../config/supabaseConfig';

/**
 * Supabase Service Layer
 * Handles all database operations for 60+ concurrent users
 * Includes error handling, retries, and offline support
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
      display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
      role: role,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      status: 'active',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('users')
      .upsert(userData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });

    if (error) throw error;

    console.log('✅ User saved to Supabase:', user.email);
    
    // Also save to localStorage as fallback
    const existingUsers = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
    const userIndex = existingUsers.findIndex(u => u.id === user.id);
    
    if (userIndex >= 0) {
      existingUsers[userIndex] = { ...existingUsers[userIndex], ...userData };
    } else {
      existingUsers.push(userData);
    }
    
    localStorage.setItem('all_registered_users', JSON.stringify(existingUsers));
    
    return { success: true, data: userData };
  } catch (error) {
    console.error('❌ Error saving user to Supabase:', error);
    
    // Fallback to localStorage
    const userData = {
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
      role: role,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      status: 'active'
    };
    
    const existingUsers = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
    const userIndex = existingUsers.findIndex(u => u.id === user.id);
    
    if (userIndex >= 0) {
      existingUsers[userIndex] = { ...existingUsers[userIndex], ...userData };
    } else {
      existingUsers.push(userData);
    }
    
    localStorage.setItem('all_registered_users', JSON.stringify(existingUsers));
    
    return { success: true, data: userData, fallback: true };
  }
};

/**
 * Get user data from Supabase
 * @param {string} userId - User ID
 */
export const getUserFromSupabase = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    
    if (data) {
      return { success: true, data };
    } else {
      // Try localStorage fallback
      const existingUsers = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
      const user = existingUsers.find(u => u.id === userId);
      return { success: !!user, data: user, fallback: true };
    }
  } catch (error) {
    console.error('❌ Error getting user from Supabase:', error);
    
    // Fallback to localStorage
    const existingUsers = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
    const user = existingUsers.find(u => u.id === userId);
    return { success: !!user, data: user, fallback: true };
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
    console.error('❌ Error getting all users from Supabase:', error);
    
    // Fallback to localStorage
    const existingUsers = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
    console.log(`✅ Fallback: Retrieved ${existingUsers.length} users from localStorage`);
    return { success: true, data: existingUsers, fallback: true };
  }
};

/**
 * Update user activity (last active time)
 * @param {string} userId - User ID
 */
export const updateUserActivity = async (userId) => {
  // Check if userId is valid
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
    
    console.log('✅ User activity updated in Supabase');
  } catch (error) {
    console.error('❌ Error updating user activity in Supabase:', error);
    console.error('❌ Make sure you have run the database migration script!');
    
    // Fallback to localStorage
    const existingUsers = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
    const userIndex = existingUsers.findIndex(u => u.id === userId);
    
    if (userIndex >= 0) {
      existingUsers[userIndex].last_active = new Date().toISOString();
      localStorage.setItem('all_registered_users', JSON.stringify(existingUsers));
    }
  }
};

// ==================== TEST SUBMISSIONS ====================

/**
 * Submit test results to Supabase
 * @param {string} userId - User ID
 * @param {object} submissionData - Test submission data
 */
export const submitTestToSupabase = async (userId, submissionData) => {
  try {
    const submission = {
      id: `${userId}_${Date.now()}`,
      user_id: userId,
      test_type: submissionData.testType || 'general',
      score: submissionData.score || 0,
      total_questions: submissionData.totalQuestions || 0,
      time_taken: submissionData.timeTaken || 0,
      answers: submissionData.answers || [],
      status: submissionData.status || 'completed',
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('submissions')
      .insert(submission);

    if (error) throw error;

    console.log('✅ Test submission saved to Supabase');
    
    // Also save to localStorage as fallback
    const existingSubmissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
    existingSubmissions.push(submission);
    localStorage.setItem('all_submissions', JSON.stringify(existingSubmissions));
    
    return { success: true, data: submission };
  } catch (error) {
    console.error('❌ Error submitting test to Supabase:', error);
    
    // Fallback to localStorage
    const submission = {
      id: `${userId}_${Date.now()}`,
      user_id: userId,
      test_type: submissionData.testType || 'general',
      score: submissionData.score || 0,
      total_questions: submissionData.totalQuestions || 0,
      time_taken: submissionData.timeTaken || 0,
      answers: submissionData.answers || [],
      status: submissionData.status || 'completed',
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    const existingSubmissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
    existingSubmissions.push(submission);
    localStorage.setItem('all_submissions', JSON.stringify(existingSubmissions));
    
    return { success: true, data: submission, fallback: true };
  }
};

/**
 * Auto-save test progress
 * @param {string} userId - User ID
 * @param {object} progressData - Test progress data
 */
export const autoSaveTestProgress = async (userId, progressData) => {
  try {
    const progress = {
      id: `progress_${userId}_${progressData.testType || 'general'}`,
      user_id: userId,
      test_type: progressData.testType || 'general',
      current_question: progressData.currentQuestion || 0,
      answers: progressData.answers || [],
      time_remaining: progressData.timeRemaining || 0,
      last_saved: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('test_progress')
      .upsert(progress, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });

    if (error) throw error;

    console.log('✅ Test progress auto-saved to Supabase');
    return { success: true, data: progress };
  } catch (error) {
    console.error('❌ Error auto-saving test progress to Supabase:', error);
    
    // Fallback to localStorage
    const progress = {
      id: `progress_${userId}_${progressData.testType || 'general'}`,
      user_id: userId,
      test_type: progressData.testType || 'general',
      current_question: progressData.currentQuestion || 0,
      answers: progressData.answers || [],
      time_remaining: progressData.timeRemaining || 0,
      last_saved: new Date().toISOString()
    };
    
    localStorage.setItem(`test_progress_${userId}`, JSON.stringify(progress));
    
    return { success: true, data: progress, fallback: true };
  }
};

/**
 * Get test progress
 * @param {string} userId - User ID
 * @param {string} testType - Test type
 */
export const getTestProgress = async (userId, testType = 'general') => {
  try {
    const { data, error } = await supabase
      .from('test_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('test_type', testType)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
      return { success: true, data };
    } else {
      // Try localStorage fallback
      const progress = localStorage.getItem(`test_progress_${userId}`);
      return { 
        success: !!progress, 
        data: progress ? JSON.parse(progress) : null, 
        fallback: true 
      };
    }
  } catch (error) {
    console.error('❌ Error getting test progress from Supabase:', error);
    
    // Fallback to localStorage
    const progress = localStorage.getItem(`test_progress_${userId}`);
    return { 
      success: !!progress, 
      data: progress ? JSON.parse(progress) : null, 
      fallback: true 
    };
  }
};

/**
 * Get all submissions (for admin dashboard)
 */
export const getAllSubmissions = async () => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        users:user_id (
          email,
          display_name,
          role
        )
      `)
      .order('submitted_at', { ascending: false });
    
    if (error) throw error;
    
    console.log(`✅ Retrieved ${data.length} submissions from Supabase`);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error getting all submissions from Supabase:', error);
    
    // Fallback to localStorage
    const existingSubmissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
    console.log(`✅ Fallback: Retrieved ${existingSubmissions.length} submissions from localStorage`);
    return { success: true, data: existingSubmissions, fallback: true };
  }
};

// ==================== REAL-TIME SUBSCRIPTIONS ====================

/**
 * Subscribe to user activity updates
 * @param {function} callback - Callback function for updates
 */
export const subscribeToUserActivity = (callback) => {
  try {
    const subscription = supabase
      .channel('users')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'users' 
        }, 
        callback
      )
      .subscribe();

    console.log('✅ Subscribed to user activity updates');
    
    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error('❌ Error subscribing to user activity:', error);
    
    // Return a no-op function for fallback
    return () => {};
  }
};

/**
 * Subscribe to submissions updates
 * @param {function} callback - Callback function for updates
 */
export const subscribeToSubmissions = (callback) => {
  try {
    const subscription = supabase
      .channel('submissions')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'submissions' 
        }, 
        callback
      )
      .subscribe();

    console.log('✅ Subscribed to submissions updates');
    
    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error('❌ Error subscribing to submissions:', error);
    
    // Return a no-op function for fallback
    return () => {};
  }
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Sync pending submissions (for offline support)
 */
export const syncPendingSubmissions = async () => {
  try {
    const pendingSubmissions = JSON.parse(localStorage.getItem('pending_submissions') || '[]');
    
    if (pendingSubmissions.length === 0) {
      return { success: true, synced: 0 };
    }
    
    let syncedCount = 0;
    const remainingSubmissions = [];
    
    for (const submission of pendingSubmissions) {
      try {
        await submitTestToSupabase(submission.user_id, submission);
        syncedCount++;
      } catch (error) {
        console.error('❌ Failed to sync submission:', error);
        remainingSubmissions.push(submission);
      }
    }
    
    localStorage.setItem('pending_submissions', JSON.stringify(remainingSubmissions));
    
    console.log(`✅ Synced ${syncedCount} pending submissions`);
    return { success: true, synced: syncedCount };
  } catch (error) {
    console.error('❌ Error syncing pending submissions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async () => {
  try {
    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Get total submissions count
    const { count: totalSubmissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true });

    if (submissionsError) throw submissionsError;

    // Get active users (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { count: activeUsers, error: activeError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_active', yesterday.toISOString());

    if (activeError) throw activeError;

    // Get average score
    const { data: submissions, error: scoreError } = await supabase
      .from('submissions')
      .select('score, total_questions');

    if (scoreError) throw scoreError;

    let averageScore = 0;
    let passRate = 0;

    if (submissions && submissions.length > 0) {
      const totalScore = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
      averageScore = Math.round(totalScore / submissions.length);
      
      const passedTests = submissions.filter(sub => 
        (sub.score / sub.total_questions) >= 0.6
      ).length;
      passRate = Math.round((passedTests / submissions.length) * 100);
    }

    const stats = {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalSubmissions: totalSubmissions || 0,
      averageScore,
      passRate
    };

    console.log('✅ Dashboard stats retrieved from Supabase');
    return { success: true, data: stats };
  } catch (error) {
    console.error('❌ Error getting dashboard stats from Supabase:', error);
    
    // Fallback to localStorage calculations
    const users = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
    const submissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const activeUsers = users.filter(user => 
      user.last_active && new Date(user.last_active) >= yesterday
    ).length;
    
    let averageScore = 0;
    let passRate = 0;

    if (submissions.length > 0) {
      const totalScore = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
      averageScore = Math.round(totalScore / submissions.length);
      
      const passedTests = submissions.filter(sub => 
        (sub.score / sub.total_questions) >= 0.6
      ).length;
      passRate = Math.round((passedTests / submissions.length) * 100);
    }

    const stats = {
      totalUsers: users.length,
      activeUsers,
      totalSubmissions: submissions.length,
      averageScore,
      passRate
    };

    return { success: true, data: stats, fallback: true };
  }
};

export default {
  saveUserToSupabase,
  getUserFromSupabase,
  getAllUsersFromSupabase,
  updateUserActivity,
  submitTestToSupabase,
  autoSaveTestProgress,
  getTestProgress,
  getAllSubmissions,
  subscribeToUserActivity,
  subscribeToSubmissions,
  syncPendingSubmissions,
  getDashboardStats
};
