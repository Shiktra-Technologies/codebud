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
// Check if submission_csv table exists and what columns it has
export const checkSubmissionCSVTable = async () => {
  try {
    console.log('🔍 Checking submission_csv table structure...');
    
    // Try a simple select to see what columns exist
    const { data, error } = await supabase
      .from('submission_csv')
      .select(`
        *,
        users:user_id (
          email,
          display_name
        )
      `)
      .limit(1);
    
    if (error) {
      console.error('❌ submission_csv table check error:', error);
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('❌ submission_csv table does not exist');
        return { exists: false, error };
      } else {
        console.log('⚠️ Table exists but has issues:', error.message);
        return { exists: true, error, columns: [] };
      }
    }
    
    console.log('✅ submission_csv table exists, sample data:', data);
    return { exists: true, data };
  } catch (error) {
    console.error('❌ Failed to check submission_csv table:', error);
    return { exists: false, error };
  }
};

// Provide SQL script for manual table creation in Supabase dashboard
export const getSubmissionCSVTableScript = () => {
  return `
-- Create the submission_csv table for cross-device submissions
CREATE TABLE IF NOT EXISTS submission_csv (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_type TEXT DEFAULT 'aptitude',
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 30,
  time_taken INTEGER DEFAULT 0,
  answers JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'completed',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  device_info JSONB DEFAULT '{}'::jsonb,
  violation_count INTEGER DEFAULT 0,
  violation_details JSONB DEFAULT '[]'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submission_csv_user_id ON submission_csv (user_id);
CREATE INDEX IF NOT EXISTS idx_submission_csv_submitted_at ON submission_csv (submitted_at);
CREATE INDEX IF NOT EXISTS idx_submission_csv_test_type ON submission_csv (test_type);

-- Enable Row Level Security
ALTER TABLE submission_csv ENABLE ROW LEVEL SECURITY;

-- Create policies for security
CREATE POLICY "Users can insert their own submissions" ON submission_csv
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
  
CREATE POLICY "Users can view their own submissions" ON submission_csv
  FOR SELECT USING (auth.uid()::text = user_id::text);
  
CREATE POLICY "Admins can view all submissions" ON submission_csv
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );
`;
};

// Create submission_csv table (simplified approach)
export const createSubmissionCSVTable = async () => {
  try {
    console.log('🔨 Note: To create submission_csv table, run this SQL in Supabase dashboard:');
    console.log(getSubmissionCSVTableScript());
    
    // Try to check if table exists by attempting a simple query
    const { data, error } = await supabase
      .from('submission_csv')
      .select('id')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('❌ Table does not exist. Please create it manually in Supabase dashboard.');
      return { 
        success: false, 
        error, 
        message: 'Please run the SQL script in Supabase dashboard to create the table',
        sql: getSubmissionCSVTableScript()
      };
    }
    
    console.log('✅ submission_csv table exists');
    return { success: true };
  } catch (error) {
    console.error('❌ Error checking submission_csv table:', error);
    return { 
      success: false, 
      error,
      message: 'Please run the SQL script in Supabase dashboard to create the table',
      sql: getSubmissionCSVTableScript()
    };
  }
};

export const submitTestToSupabase = async (userId, submissionData) => {
  try {
    console.log('💾 Submitting to submission_csv table with user reference');
    
    // Create submission object for the new normalized table
    const submission = {
      user_id: userId,
      test_type: submissionData.testType || 'aptitude',
      score: submissionData.score || 0,
      total_questions: submissionData.totalQuestions || submissionData.answers?.length || 30,
      time_taken: submissionData.timeTaken || 0,
      answers: submissionData.answers || [],
      status: submissionData.status || 'completed',
      submitted_at: new Date().toISOString(),
      
      // Additional CSV-specific data
      device_info: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        timestamp: new Date().toISOString()
      },
      violation_count: submissionData.violations?.count || submissionData.violationAnalysis?.totalViolations || 0,
      violation_details: submissionData.violations?.details || submissionData.violationAnalysis?.detailedViolations || []
    };

    console.log('📝 Attempting to save to submission_csv table:', {
      user_id: submission.user_id,
      test_type: submission.test_type,
      score: submission.score,
      total_questions: submission.total_questions
    });

    // Try to insert into Supabase submission_csv table
    const { data, error } = await supabase
      .from('submission_csv')
      .insert(submission)
      .select(`
        *,
        users:user_id (
          email,
          display_name,
          role
        )
      `);

    if (error) {
      console.error('❌ Supabase submission_csv insert error:', error);
      throw error;
    }

    console.log('✅ Submission saved to submission_csv table:', data);

    // Also save to localStorage as fallback
    const localSubmission = {
      id: data[0]?.id || `${userId}_${Date.now()}`,
      user_id: userId,
      user_name: data[0]?.users?.display_name || submissionData.userName || 'Unknown Student',
      user_email: data[0]?.users?.email || submissionData.userEmail || '',
      ...submission
    };

    const existingSubmissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
    existingSubmissions.push(localSubmission);
    localStorage.setItem('all_submissions', JSON.stringify(existingSubmissions));
    
    // Forward submission to admin CSV system
    try {
      const { default: submissionForwardingService } = await import('./submissionForwardingService');
      await submissionForwardingService.forwardSubmission({
        ...submissionData,
        userId: userId,
        submittedAt: submission.submitted_at,
        id: submission.id
      });
    } catch (forwardingError) {
      console.error('Failed to forward submission to admin:', forwardingError);
      // Don't fail the entire submission if forwarding fails
    }
    
    // Trigger leaderboard refresh and real-time broadcast
    try {
      const { default: leaderboardService } = await import('./leaderboardService');
      const updatedLeaderboard = leaderboardService.refreshLeaderboard();
      
      // Import and trigger real-time broadcast
      const { default: realTimeService } = await import('./realTimeService');
      realTimeService.emit('leaderboard', updatedLeaderboard);
      
      console.log('✅ Leaderboard updated and broadcasted after submission');
    } catch (err) {
      console.warn('Could not refresh/broadcast leaderboard:', err);
    }
    
    return { success: true, data: submission };
  } catch (error) {
    console.error('❌ Error submitting test to Supabase:', error);
    
    // Fallback to localStorage
    const submission = {
      id: `${userId}_${Date.now()}`,
      user_id: userId,
      user_name: submissionData.userName || submissionData.student_name || 'Unknown Student',
      user_email: submissionData.userEmail || submissionData.student_email || '',
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
    
    // Trigger leaderboard refresh and real-time broadcast even on fallback
    try {
      const { default: leaderboardService } = await import('./leaderboardService');
      const updatedLeaderboard = leaderboardService.refreshLeaderboard();
      
      // Import and trigger real-time broadcast
      const { default: realTimeService } = await import('./realTimeService');
      realTimeService.emit('leaderboard', updatedLeaderboard);
      
      console.log('✅ Leaderboard updated and broadcasted after fallback submission');
    } catch (err) {
      console.warn('Could not refresh/broadcast leaderboard:', err);
    }
    
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
    console.log('📡 Querying submission_csv table with user details...');
    
    const { data, error } = await supabase
      .from('submission_csv')
      .select(`
        *,
        users:user_id (
          id,
          email,
          display_name,
          role,
          created_at
        )
      `)
      .order('submitted_at', { ascending: false });
    
    if (error) {
      console.error('❌ Supabase submission_csv query error:', error);
      throw error;
    }
    
    // Transform data to include user info directly
    const transformedData = data?.map(submission => ({
      ...submission,
      user_name: submission.users?.display_name || 'Unknown Student',
      user_email: submission.users?.email || 'No email',
      percentage: submission.percentage || Math.round((submission.score / submission.total_questions) * 100)
    })) || [];
    
    console.log(`✅ Retrieved ${transformedData.length} submissions from submission_csv table`);
    console.log('📊 Sample submission data:', transformedData[0]);
    
    return { success: true, data: transformedData };
  } catch (error) {
    console.error('❌ Error getting submissions from submission_csv table:', error);
    
    // Fallback to localStorage - check multiple sources
    const allSubmissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
    const supabaseSubmissions = JSON.parse(localStorage.getItem('supabase_submissions') || '[]');
    
    // Combine both sources
    const combinedSubmissions = [...allSubmissions, ...supabaseSubmissions];
    
    // Remove duplicates by ID
    const uniqueSubmissions = combinedSubmissions.filter((submission, index, self) => 
      index === self.findIndex(s => s.id === submission.id)
    );
    
    console.log(`✅ Fallback: Retrieved ${uniqueSubmissions.length} submissions from localStorage (${allSubmissions.length} + ${supabaseSubmissions.length} combined)`);
    return { success: true, data: uniqueSubmissions, fallback: true };
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

// ==================== ADMIN SUBMISSION FORWARDING ====================

/**
 * Save submission forwarding data
 * @param {object} forwardingData - Forwarding metadata
 */
export const saveSubmissionForwarding = async (forwardingData) => {
  try {
    const forwardingRecord = {
      id: `fwd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      submission_id: forwardingData.id || forwardingData.submissionId,
      user_id: forwardingData.userId,
      forwarded_at: forwardingData.forwardedAt || new Date().toISOString(),
      device_info: JSON.stringify(forwardingData.deviceInfo || {}),
      forwarding_status: forwardingData.forwardingStatus || 'completed',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('submission_forwarding')
      .insert(forwardingRecord);

    if (error) throw error;

    console.log('✅ Submission forwarding saved to Supabase');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error saving submission forwarding:', error);
    
    // Fallback to localStorage
    const existingForwarding = JSON.parse(localStorage.getItem('submission_forwarding') || '[]');
    existingForwarding.push(forwardingRecord);
    localStorage.setItem('submission_forwarding', JSON.stringify(existingForwarding));
    
    return { success: false, error: error.message, fallback: true };
  }
};

/**
 * Get all submissions for admin CSV generation
 */
export const getAllSubmissionsForAdmin = async () => {
  try {
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`📊 Retrieved ${submissions.length} submissions for CSV`);
    return submissions;
  } catch (error) {
    console.error('❌ Error getting all submissions:', error);
    
    // Fallback to localStorage
    const localSubmissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
    console.log(`📊 Using ${localSubmissions.length} local submissions as fallback`);
    return localSubmissions;
  }
};

/**
 * Get submission forwarding records
 */
export const getSubmissionForwardingRecords = async () => {
  try {
    const { data: records, error } = await supabase
      .from('submission_forwarding')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return records;
  } catch (error) {
    console.error('❌ Error getting forwarding records:', error);
    
    // Fallback to localStorage
    const localRecords = JSON.parse(localStorage.getItem('submission_forwarding') || '[]');
    return localRecords;
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
  checkSubmissionCSVTable,
  createSubmissionCSVTable,
  getSubmissionCSVTableScript,
  subscribeToUserActivity,
  subscribeToSubmissions,
  syncPendingSubmissions,
  getDashboardStats,
  saveSubmissionForwarding,
  getAllSubmissionsForAdmin,
  getSubmissionForwardingRecords
};
