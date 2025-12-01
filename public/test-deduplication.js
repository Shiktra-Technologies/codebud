/**
 * Browser-compatible test for submission deduplication
 * Load this in the browser console to test the fix
 */

window.testSubmissionDeduplication = async () => {
  console.log('🧪 === TESTING SUBMISSION DEDUPLICATION ===');
  
  try {
    // Import the submission service (browser compatible)
    const { submitTestToSupabase } = await import('/src/services/submissionService.js');
    
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
      isDuplicate: result1.isDuplicate,
      message: result1.message
    });
    
    // Wait a moment and try the same submission again
    console.log('📝 Testing duplicate submission (should be prevented)...');
    const result2 = await submitTestToSupabase(testUserId, testSubmissionData);
    console.log('✅ Second submission result:', { 
      success: result2.success, 
      cached: result2.cached,
      isDuplicate: result2.isDuplicate,
      message: result2.message
    });
    
    if (result2.cached || result2.isDuplicate) {
      console.log('🎉 SUCCESS: Duplicate prevention is working!');
    } else {
      console.log('⚠️ WARNING: Duplicate might not have been prevented');
    }
    
    // Test with a slightly different submission to ensure it still works normally
    console.log('📝 Testing different submission (should succeed)...');
    const differentSubmissionData = {
      ...testSubmissionData,
      score: 90, // Different score
    };
    
    const result3 = await submitTestToSupabase(testUserId, differentSubmissionData);
    console.log('✅ Different submission result:', { 
      success: result3.success, 
      cached: result3.cached,
      isDuplicate: result3.isDuplicate,
      message: result3.message
    });
    
    console.log('🎯 === TEST COMPLETED ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

console.log('🔧 Run window.testSubmissionDeduplication() to test duplicate prevention.');
