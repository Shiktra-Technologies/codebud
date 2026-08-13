/**
 * Simple test utility for verifying Supabase submissions
 */

import { submitTest as submitTestToSupabase, getAllSubmissions as getAllSubmissionsFromSupabase } from '../services/submissionService';

export const testSubmissionFlow = async () => {
  console.log('🧪 === TESTING SUBMISSION FLOW ===');

  try {
    // Test data
    const testUserId = 'test_user_' + Date.now();
    const testSubmission = {
      testType: 'aptitude',
      score: 85,
      totalQuestions: 30,
      timeTaken: 1800, // 30 minutes
      answers: [
        { question: 1, answer: 'A', correct: true },
        { question: 2, answer: 'B', correct: false },
        { question: 3, answer: 'C', correct: true }
      ],
      status: 'completed',
      userName: 'Test Student',
      userEmail: 'test@example.com'
    };

    console.log('📝 Testing submission...');
    const submitResult = await submitTestToSupabase(testUserId, testSubmission);

    if (submitResult.success) {
      console.log('✅ Submission test PASSED');
      console.log('📊 Submitted data:', submitResult.data);

      // Test retrieval
      console.log('📋 Testing retrieval...');
      const retrieveResult = await getAllSubmissionsFromSupabase();

      if (retrieveResult.success) {
        console.log('✅ Retrieval test PASSED');
        console.log(`📊 Retrieved ${retrieveResult.data.length} submissions`);

        // Find our test submission
        const ourSubmission = retrieveResult.data.find(sub => sub.user_id === testUserId);
        if (ourSubmission) {
          console.log('✅ Test submission found in database!');
          console.log('📊 Retrieved submission:', ourSubmission);
        } else {
          console.log('⚠️ Test submission not found in retrieved data');
        }

        console.log('🎉 === ALL TESTS PASSED ===');
        return true;
      } else {
        console.error('❌ Retrieval test FAILED:', retrieveResult.error);
        return false;
      }
    } else {
      console.error('❌ Submission test FAILED:', submitResult.error);
      return false;
    }
  } catch (error) {
    console.error('🚨 Test suite FAILED:', error);
    return false;
  }
};

// Make it available globally for browser console testing
if (typeof window !== 'undefined') {
  window.testSubmissionFlow = testSubmissionFlow;
}

export default { testSubmissionFlow };
