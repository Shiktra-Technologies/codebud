/**
 * Clean, reliable submission service for student test submissions
 */

import { supabase } from '../config/supabaseConfig';

// In-memory cache to prevent duplicate submissions from React.StrictMode
const recentSubmissions = new Map();
const SUBMISSION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Clean up expired submissions from cache
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, timestamp] of recentSubmissions.entries()) {
    if (now - timestamp > SUBMISSION_CACHE_DURATION) {
      recentSubmissions.delete(key);
    }
  }
};

// Generate a unique key for submission deduplication
const generateSubmissionKey = (userId, submissionData) => {
  return `${userId}_${submissionData.testType || 'aptitude'}_${submissionData.score}_${submissionData.totalQuestions || submissionData.answers?.length || 30}`;
};

/**
 * Submit test results directly to Supabase submission_csv table
 * This is the main submission function for real student test submissions
 */
export const submitTestToSupabase = async (userId, submissionData) => {
  if (!supabase) {
    console.error('[ERROR] Supabase client not initialized');
    return { success: false, error: 'Database connection not available' };
  }

  console.log('🚀 === STUDENT SUBMISSION TO SUPABASE ===');
  console.log('📝 Input data:', { 
    userId: userId ? `${userId.substring(0, 8)}...` : 'null',
    testType: submissionData?.testType || 'unknown',
    score: submissionData?.score || 0,
    totalQuestions: submissionData?.totalQuestions || 0
  });

  // Clean up expired cache entries
  cleanupCache();
  
  // Check local cache to prevent React.StrictMode duplicates
  const submissionKey = generateSubmissionKey(userId, submissionData);
  const now = Date.now();
  
  if (recentSubmissions.has(submissionKey)) {
    const cachedTime = recentSubmissions.get(submissionKey);
    if (now - cachedTime < SUBMISSION_CACHE_DURATION) {
      console.log('🚫 Local cache: Duplicate submission prevented (React.StrictMode protection)');
      return { 
        success: true, 
        message: 'Duplicate submission prevented by local cache',
        cached: true
      };
    }
  }
  
  // Add to cache to prevent future duplicates
  recentSubmissions.set(submissionKey, now);
  console.log('[SUCCESS] Local cache: Submission key added:', submissionKey);

  try {
    // Validate required data
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    if (!submissionData || typeof submissionData !== 'object') {
      throw new Error('Valid submission data is required');
    }

    // Get current authenticated user to ensure user record exists
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      console.warn('⚠️ No authenticated user found, proceeding with provided userId');
    }

    // Ensure user exists in users table
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, email, display_name')
      .eq('id', userId)
      .maybeSingle();

    if (!existingUser) {
      console.log('🔨 Creating user record in users table...');
      
      // Enhanced user data resolution - prioritize explicit userName
      const userEmail = authUser?.email || submissionData.userEmail || `user_${userId.substring(0, 8)}@example.com`;
      
      // PRIORITY ORDER for display name:
      // 1. submissionData.userName (explicitly provided)
      // 2. Check if user already exists in database
      // 3. authUser display_name or name
      // 4. email username part
      // 5. "Student" as final fallback
      let displayName = 'Student';
      
      if (submissionData.userName && submissionData.userName.trim()) {
        displayName = submissionData.userName.trim();
        console.log(`✅ Using explicit userName: "${displayName}"`);
      } else {
        // Try to get existing display name from database first
        const existingDisplayName = await getUserDisplayName(userId);
        if (existingDisplayName) {
          displayName = existingDisplayName;
          console.log(`✅ Using existing display_name from database: "${displayName}"`);
        } else if (authUser?.user_metadata?.display_name) {
          displayName = authUser.user_metadata.display_name;
          console.log(`✅ Using auth display_name: "${displayName}"`);
        } else if (authUser?.user_metadata?.name) {
          displayName = authUser.user_metadata.name;
          console.log(`✅ Using auth name: "${displayName}"`);
        } else if (userEmail && userEmail.includes('@')) {
          displayName = userEmail.split('@')[0];
          console.log(`✅ Using email prefix: "${displayName}"`);
        }
      }

      const userRecord = {
        id: userId,
        email: userEmail,
        display_name: displayName,
        role: 'student'
      };

      console.log('👤 Creating user with data:', {
        id: userId.substring(0, 8) + '...',
        email: userEmail,
        display_name: displayName,
        role: 'student'
      });

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert(userRecord)
        .select()
        .single();

      if (createError) {
        console.error('[ERROR] Failed to create user:', {
          error: createError,
          attempted_data: userRecord
        });
        
        // Don't throw error immediately - try to proceed with submission
        // The fallback logic will handle the missing user data
        console.warn('⚠️ Proceeding with submission despite user creation failure');
      } else {
        console.log('[SUCCESS] Created user record successfully:', {
          email: newUser.email,
          display_name: newUser.display_name
        });
      }
    } else {
      console.log('👤 Using existing user:', {
        email: existingUser.email,
        display_name: existingUser.display_name
      });
    }

    // Check for duplicate submissions in the last 5 minutes
    console.log('🔍 Checking for duplicate submissions...');
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: existingSubmissions, error: checkError } = await supabase
      .from('submission_csv')
      .select('id, submitted_at, score, total_questions')
      .eq('user_id', userId)
      .eq('test_type', submissionData.testType || 'aptitude')
      .gte('submitted_at', fiveMinutesAgo)
      .order('submitted_at', { ascending: false });

    if (checkError) {
      console.warn('⚠️ Could not check for duplicates, proceeding with insertion:', checkError);
    } else if (existingSubmissions && existingSubmissions.length > 0) {
      // Check if there's a submission with the same score and total questions
      const duplicateSubmission = existingSubmissions.find(sub => 
        sub.score === parseInt(submissionData.score) && 
        sub.total_questions === parseInt(submissionData.totalQuestions || submissionData.answers?.length || 30)
      );
      
      if (duplicateSubmission) {
        console.log('🚫 Duplicate submission detected, skipping insertion:', {
          existingId: duplicateSubmission.id,
          existingScore: duplicateSubmission.score,
          existingSubmittedAt: duplicateSubmission.submitted_at
        });
        
        // Return the existing submission instead of creating a duplicate
        const { data: existingData, error: fetchError } = await supabase
          .from('submission_csv')
          .select(`
            id, 
            score, 
            test_type, 
            submitted_at,
            users!inner(email, display_name)
          `)
          .eq('id', duplicateSubmission.id)
          .single();
          
        if (fetchError) {
          console.warn('⚠️ Could not fetch existing submission details:', fetchError);
        } else {
          console.log('[SUCCESS] Returning existing submission instead of creating duplicate');
          return { 
            success: true, 
            data: existingData,
            message: 'Duplicate submission prevented - returning existing submission',
            isDuplicate: true
          };
        }
      }
    }

    // Prepare submission data for the submission_csv table
    const submissionRecord = {
      user_id: userId,
      test_type: submissionData.testType || 'aptitude',
      score: parseInt(submissionData.score) || 0,
      total_questions: parseInt(submissionData.totalQuestions || submissionData.answers?.length || 30),
      time_taken: parseInt(submissionData.timeTaken || submissionData.timing?.totalTimeSpent || 0),
      answers: submissionData.answers || [],
      status: submissionData.status || 'completed',
      device_info: {
        userAgent: navigator?.userAgent?.substring(0, 200) || 'unknown',
        timestamp: new Date().toISOString()
      },
      violation_count: parseInt(submissionData.violations?.count || submissionData.violationAnalysis?.totalViolations || 0),
      violation_details: submissionData.violations?.details || submissionData.violationAnalysis?.detailedViolations || []
    };

    console.log('💾 Inserting to submission_csv table...');
    console.log('[DATA] Record to insert:', {
      user_id: submissionRecord.user_id.substring(0, 8) + '...',
      test_type: submissionRecord.test_type,
      score: submissionRecord.score,
      total_questions: submissionRecord.total_questions
    });
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('submission_csv')
      .insert(submissionRecord)
      .select(`
        id, 
        score, 
        test_type, 
        submitted_at,
        users!inner(email, display_name)
      `)
      .single();

    if (error) {
      console.error('[ERROR] Supabase insert failed:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw new Error(`Database insert failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from database insert');
    }

    console.log('[SUCCESS] SUCCESS! Submission saved to Supabase:', {
      id: data.id,
      userEmail: data.users?.email,
      testType: data.test_type,
      score: data.score,
      submittedAt: data.submitted_at
    });

    // Also save to localStorage as backup
    const localSubmission = {
      id: data.id,
      user_id: userId,
      user_email: data.users?.email || submissionData.userEmail || '',
      user_name: data.users?.display_name || submissionData.userName || 'Student',
      ...submissionRecord,
      submitted_at: data.submitted_at
    };

    try {
      const existing = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      existing.push(localSubmission);
      localStorage.setItem('all_submissions', JSON.stringify(existing));
      console.log('[SUCCESS] Backup saved to localStorage');
    } catch (localError) {
      console.warn('⚠️ localStorage backup failed:', localError);
    }

    console.log('🎯 === SUBMISSION COMPLETE ===');
    return { 
      success: true, 
      data: data,
      message: 'Test submission saved successfully'
    };

  } catch (error) {
    console.error('🚨 === SUBMISSION FAILED ===');
    console.error('[ERROR] Error:', error.message);
    console.error('📊 Error details:', error);
    
    // Fallback to localStorage only
    console.log('💾 Saving to localStorage as fallback...');
    const fallbackSubmission = {
      id: `fallback_${userId}_${Date.now()}`,
      user_id: userId,
      user_email: submissionData.userEmail || '',
      user_name: submissionData.userName || 'Student',
      test_type: submissionData.testType || 'aptitude',
      score: parseInt(submissionData.score) || 0,
      total_questions: parseInt(submissionData.totalQuestions) || 30,
      time_taken: parseInt(submissionData.timeTaken) || 0,
      answers: submissionData.answers || [],
      status: submissionData.status || 'completed',
      submitted_at: new Date().toISOString(),
      fallback: true
    };

    try {
      const existing = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      existing.push(fallbackSubmission);
      localStorage.setItem('all_submissions', JSON.stringify(existing));
      console.log('[SUCCESS] Fallback submission saved to localStorage');
    } catch (localError) {
      console.error('[ERROR] Even localStorage fallback failed:', localError);
    }

    return { 
      success: false, 
      error: error.message,
      data: fallbackSubmission,
      fallback: true
    };
  }
};

/**
 * Get the correct display name for a user from the users table
 */
export const getUserDisplayName = async (userId) => {
  if (!supabase || !userId) {
    return null;
  }

  try {
    console.log(`🔍 Fetching display name for user: ${userId.substring(0, 8)}...`);
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('display_name, email')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.warn(`⚠️ Could not fetch user data for ${userId}:`, error);
      return null;
    }
    
    if (userData) {
      const displayName = userData.display_name || userData.email?.split('@')[0] || null;
      console.log(`✅ Found display name for ${userId.substring(0, 8)}: "${displayName}"`);
      return displayName;
    }
    
    console.log(`❌ No user data found for ${userId.substring(0, 8)}`);
    return null;
  } catch (error) {
    console.error('Error fetching user display name:', error);
    return null;
  }
};

/**
 * Get all submissions from Supabase (for admin dashboard)
 */
export const getAllSubmissionsFromSupabase = async () => {
  if (!supabase) {
    console.error('[ERROR] Supabase client not initialized');
    return { success: false, error: 'Database connection not available', data: [] };
  }

  try {
    console.log('[DATA] Fetching all submissions with user details...');
    
    // Try different approaches to get user data, starting with the most reliable
    let data, error;
    
    console.log('🔍 Attempting Method 1: Direct join query...');
    const joinResult = await supabase
      .from('submission_csv')
      .select(`
        id,
        user_id,
        test_type,
        score,
        total_questions,
        time_taken,
        answers,
        status,
        submitted_at,
        violation_count,
        violation_details,
        device_info,
        users(
          email,
          display_name,
          role
        )
      `)
      .order('submitted_at', { ascending: false });
    
    data = joinResult.data;
    error = joinResult.error;

    // Check if join worked or if we need to use fallback approach
    const joinWorked = !error && data && data.length > 0 && data.some(s => s.users);
    
    if (error || !joinWorked) {
      if (error) {
        console.error('[ERROR] Join query failed:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
      } else {
        console.log('⚠️ Join query succeeded but no user data found, using separate queries');
      }
      
      // Method 2: Fetch submissions and users separately (more reliable)
      console.log('🔄 Using Method 2: Separate queries...');
      const { data: submissionsOnly, error: submissionsError } = await supabase
        .from('submission_csv')
        .select(`
          id,
          user_id,
          test_type,
          score,
          total_questions,
          time_taken,
          answers,
          status,
          submitted_at,
          violation_count,
          violation_details,
          device_info
        `)
        .order('submitted_at', { ascending: false });
      
      if (submissionsError) {
        console.error('[ERROR] Submissions query failed:', submissionsError);
        throw submissionsError;
      }
      
      console.log(`📊 Retrieved ${submissionsOnly.length} submissions`);
      
      if (submissionsOnly.length === 0) {
        console.log('[LIST] No submissions found');
        return { success: true, data: [], count: 0 };
      }
      
      // Get all unique user IDs
      const userIds = [...new Set(submissionsOnly.map(s => s.user_id).filter(Boolean))];
      console.log(`🔍 Fetching user data for ${userIds.length} unique users:`, userIds.map(id => id?.substring(0, 8) + '...'));
      
      // Fetch all users data separately
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, display_name, role');
      
      if (usersError) {
        console.warn('⚠️ Could not fetch users data:', usersError);
      } else {
        console.log(`👥 Retrieved ${usersData?.length || 0} users from users table`);
        if (usersData?.length > 0) {
          console.log('🔍 Sample users:', usersData.slice(0, 3).map(u => ({
            id: u.id?.substring(0, 8) + '...',
            display_name: u.display_name,
            email: u.email
          })));
        }
      }
      
      // Create a users lookup map
      const usersMap = new Map();
      (usersData || []).forEach(user => {
        usersMap.set(user.id, user);
      });
      
      console.log(`🗺️ Created users lookup map with ${usersMap.size} entries`);
      
      // Format submissions with user data
      const fallbackFormattedData = submissionsOnly.map(submission => {
        const userData = usersMap.get(submission.user_id);
        
        let userName = `User ${submission.user_id?.substring(0, 8)}`;
        if (userData?.display_name) {
          userName = userData.display_name;
          console.log(`✅ Found display_name for ${submission.user_id?.substring(0, 8)}: "${userData.display_name}"`);
        } else if (userData?.email) {
          userName = userData.email.split('@')[0];
          console.log(`⚠️ No display_name, using email prefix for ${submission.user_id?.substring(0, 8)}: "${userName}"`);
        } else {
          console.log(`❌ No user data found for ${submission.user_id?.substring(0, 8)}, using fallback`);
        }
        
        return {
          id: submission.id,
          user_id: submission.user_id,
          user_name: userName,
          user_email: userData?.email || 'Unknown',
          test_type: submission.test_type,
          score: submission.score,
          total_questions: submission.total_questions,
          time_taken: submission.time_taken,
          answers: submission.answers,
          status: submission.status,
          submitted_at: submission.submitted_at,
          violation_count: submission.violation_count,
          violation_details: submission.violation_details,
          device_info: submission.device_info,
          role: userData?.role || 'student'
        };
      });
      
      console.log(`✅ Successfully formatted ${fallbackFormattedData.length} submissions with user data`);
      return { success: true, data: fallbackFormattedData, count: fallbackFormattedData.length };
    }

    console.log(`✅ Retrieved ${data?.length || 0} submissions with user details`);
    
    // Format the data for the admin dashboard - now with proper user data from join
    const formattedData = [];
    const submissionsWithoutUsers = [];
    
    for (const submission of data || []) {
      // Log the first submission to see available fields
      if (data.indexOf(submission) === 0) {
        console.log('🔍 First submission fields:', Object.keys(submission));
        console.log('🔍 First submission sample:', {
          id: submission.id,
          user_id: submission.user_id?.substring(0, 8) + '...',
          users: submission.users,
          test_type: submission.test_type,
          score: submission.score
        });
      }
      
      // Enhanced user name resolution - prioritize display_name from users table
      let userName = 'Unknown Student';
      let userEmail = 'Unknown';
      let userRole = 'student';
      
      if (submission.users && submission.users.display_name) {
        // PRIORITY: Use display_name from users table if available
        userName = submission.users.display_name;
        userEmail = submission.users.email || 'No email';
        userRole = submission.users.role || 'student';
        
        console.log(`✅ Using display_name from users table: "${userName}" for submission ${submission.id}`);
      } else if (submission.users && submission.users.email) {
        // FALLBACK: Use email username part if display_name is missing
        userName = submission.users.email.split('@')[0];
        userEmail = submission.users.email;
        userRole = submission.users.role || 'student';
        
        console.log(`⚠️ No display_name, using email prefix: "${userName}" for submission ${submission.id}`);
      } else if (submission.user_id) {
        // NO USER DATA: Need to fetch separately
        submissionsWithoutUsers.push(submission);
        
        // Use a fallback name for now
        const userIdShort = submission.user_id.toString().substring(0, 8);
        userName = `User ${userIdShort}`;
        userEmail = 'No email available';
        
        console.log(`🔍 No user data in join, will fetch separately for user_id: ${submission.user_id}`);
      }
      
      formattedData.push({
        id: submission.id,
        user_id: submission.user_id,
        user_name: userName,
        user_email: userEmail,
        test_type: submission.test_type,
        score: submission.score,
        total_questions: submission.total_questions,
        time_taken: submission.time_taken,
        answers: submission.answers,
        status: submission.status,
        submitted_at: submission.submitted_at,
        violation_count: submission.violation_count,
        violation_details: submission.violation_details,
        device_info: submission.device_info,
        role: userRole
      });
    }
    
    // If we have submissions without user data, try to fetch user data separately
    if (submissionsWithoutUsers.length > 0) {
      console.log(`🔍 Fetching user data for ${submissionsWithoutUsers.length} submissions without user info...`);
      
      for (const submission of submissionsWithoutUsers) {
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('display_name, email, role')
            .eq('id', submission.user_id)
            .maybeSingle();
            
          if (userData && !userError) {
            // Update the corresponding formatted data entry
            const formattedIndex = formattedData.findIndex(f => f.id === submission.id);
            if (formattedIndex !== -1) {
              // PRIORITY: Use display_name from users table
              const finalUserName = userData.display_name || userData.email?.split('@')[0] || 'Student';
              
              formattedData[formattedIndex].user_name = finalUserName;
              formattedData[formattedIndex].user_email = userData.email || 'No email';
              formattedData[formattedIndex].role = userData.role || 'student';
              
              console.log(`✅ Updated submission ${submission.id} with display_name: "${finalUserName}" from users table`);
            }
          } else {
            console.warn(`⚠️ No user data found for user_id: ${submission.user_id}`);
          }
        } catch (userFetchError) {
          console.warn(`⚠️ Could not fetch user data for ${submission.user_id}:`, userFetchError);
        }
      }
    }

    return { 
      success: true, 
      data: formattedData,
      count: formattedData.length
    };

  } catch (error) {
    console.error('[ERROR] Error fetching submissions from Supabase:', error);
    
    // NO localStorage fallback - only show real database data
    console.log('� Only showing real Supabase data - no localStorage fallback');
    return { 
      success: false, 
      error: error.message,
      data: [],
      count: 0
    };
  }
};

export default {
  submitTestToSupabase,
  getAllSubmissionsFromSupabase,
  getUserDisplayName
};
