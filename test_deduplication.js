/**
 * Test the fixed submission service to ensure no duplicates are created
 */

const testSubmissionDeduplication = async () => {
  console.log('🧪 === TESTING SUBMISSION DEDUPLICATION ===');
  
  try {
    // Import the submission service
    const { submitTestToSupabase } = await import('./src/services/submissionService');
    
    const testUserId = 'test-user-' + Date.now();
    const testSubmissionData = {
      testType: 'aptitude',
      score: 85,
      totalQuestions: 30,
      timeTaken: 1800,
      answers: [
        { question: 1, answer: 'A', correct: true },
        { question: 2, answer: 'B', correct: false }
      ],
      status: 'completed',
      userName: 'Test Student',
      userEmail: 'test@example.com'
    };
    
    console.log('📝 Testing first submission...');
    const result1 = await submitTestToSupabase(testUserId, testSubmissionData);
    console.log('✅ First submission result:', { 
      success: result1.success, 
      cached: result1.cached,
      isDuplicate: result1.isDuplicate
    });
    
    // Wait a moment and try the same submission again
    console.log('📝 Testing duplicate submission (should be prevented)...');
    const result2 = await submitTestToSupabase(testUserId, testSubmissionData);
    console.log('✅ Second submission result:', { 
      success: result2.success, 
      cached: result2.cached,
      isDuplicate: result2.isDuplicate
    });
    
    if (result2.cached || result2.isDuplicate) {
      console.log('🎉 SUCCESS: Duplicate prevention is working!');
    } else {
      console.log('⚠️ WARNING: Duplicate might not have been prevented');
    }
    
    console.log('🎯 === TEST COMPLETED ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Export for use in browser console
window.testSubmissionDeduplication = testSubmissionDeduplication;

console.log('🔧 Deduplication test loaded. Run window.testSubmissionDeduplication() in console to test.');
