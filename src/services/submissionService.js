/**
 * Clean, reliable submission service for student test submissions
 */

import { supabase } from '../config/supabaseConfig';

/**
 * Submit test results directly to Supabase submission_csv table
 * This is the main submission function for real student test submissions
 */
export const submitTestToSupabase = async (userId, submissionData) => {
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return { success: false, error: 'Database connection not available' };
  }

  console.log('🚀 === STUDENT SUBMISSION TO SUPABASE ===');
  console.log('📝 Input data:', { 
    userId: userId ? `${userId.substring(0, 8)}...` : 'null',
    testType: submissionData?.testType || 'unknown',
    score: submissionData?.score || 0,
    totalQuestions: submissionData?.totalQuestions || 0
  });

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
      const userEmail = authUser?.email || submissionData.userEmail || `user_${userId.substring(0, 8)}@example.com`;
      const displayName = authUser?.user_metadata?.display_name || 
                         submissionData.userName || 
                         userEmail.split('@')[0] || 
                         'Student';

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userEmail,
          display_name: displayName,
          role: 'student'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create user:', createError);
        throw new Error(`Could not create user record: ${createError.message}`);
      }
      console.log('✅ Created user record:', newUser.email);
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
    console.log('📊 Record to insert:', {
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
      console.error('❌ Supabase insert failed:', {
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

    console.log('✅ SUCCESS! Submission saved to Supabase:', {
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
      console.log('✅ Backup saved to localStorage');
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
    console.error('❌ Error:', error.message);
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
      console.log('✅ Fallback submission saved to localStorage');
    } catch (localError) {
      console.error('❌ Even localStorage fallback failed:', localError);
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
 * Get all submissions from Supabase (for admin dashboard)
 */
export const getAllSubmissionsFromSupabase = async () => {
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return { success: false, error: 'Database connection not available', data: [] };
  }

  try {
    console.log('📊 Fetching all submissions from Supabase...');
    
    const { data, error } = await supabase
      .from('submission_csv')
      .select(`
        *,
        users!inner(
          email,
          display_name,
          role
        )
      `)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch submissions:', error);
      throw error;
    }

    console.log(`✅ Retrieved ${data?.length || 0} submissions from Supabase`);
    
    // Format the data for the admin dashboard
    const formattedData = data?.map(submission => ({
      id: submission.id,
      user_id: submission.user_id,
      user_name: submission.users?.display_name || 'Unknown',
      user_email: submission.users?.email || 'Unknown',
      test_type: submission.test_type,
      score: submission.score,
      total_questions: submission.total_questions,
      time_taken: submission.time_taken,
      answers: submission.answers,
      status: submission.status,
      submitted_at: submission.submitted_at,
      violation_count: submission.violation_count,
      violation_details: submission.violation_details,
      device_info: submission.device_info
    })) || [];

    return { 
      success: true, 
      data: formattedData,
      count: formattedData.length
    };

  } catch (error) {
    console.error('❌ Error fetching submissions:', error);
    
    // Fallback to localStorage
    console.log('📱 Falling back to localStorage submissions...');
    try {
      const localSubmissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      console.log(`📱 Retrieved ${localSubmissions.length} submissions from localStorage`);
      
      return { 
        success: true, 
        data: localSubmissions,
        count: localSubmissions.length,
        fallback: true
      };
    } catch (localError) {
      console.error('❌ localStorage fallback also failed:', localError);
      return { 
        success: false, 
        error: error.message,
        data: [],
        count: 0
      };
    }
  }
};

export default {
  submitTestToSupabase,
  getAllSubmissionsFromSupabase
};
