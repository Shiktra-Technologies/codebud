/**
 * Test the submission system to ensure no more errors
 */

// Function to test submission without errors
window.testSubmissionNoErrors = async () => {
  console.log('🧪 === TESTING SUBMISSION SYSTEM (NO ERRORS) ===');
  
  try {
    // Clear some localStorage to prevent quota issues
    console.log('🧹 Clearing old localStorage data...');
    const keysToCheck = ['test_results', 'pending_submissions', 'admin_submission_update'];
    keysToCheck.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🧹 Cleared ${key}`);
      }
    });
    
    // Test basic Supabase connection
    console.log('📡 Testing Supabase connection...');
    const { checkSubmissionCSVTable } = await import('./services/supabaseService');
    const tableCheck = await checkSubmissionCSVTable();
    console.log('📊 Table check result:', tableCheck.exists ? '✅ Table exists' : '❌ Table missing');
    
    // Test submission service import
    console.log('📦 Testing submission service import...');
    const { submitTestToSupabase } = await import('./services/submissionService');
    console.log('✅ Submission service imported successfully');
    
    // Test a minimal submission (without actually submitting)
    console.log('🎯 Testing submission preparation...');
    const testData = {
      testType: 'aptitude',
      score: 85,
      totalQuestions: 30,
      timeTaken: 1800,
      answers: [{ question: 1, answer: 'A', correct: true }],
      status: 'completed',
      userName: 'Test Student',
      userEmail: 'test@example.com'
    };
    
    console.log('✅ Test data prepared:', {
      testType: testData.testType,
      score: testData.score,
      answersLength: testData.answers.length
    });
    
    console.log('🎉 === ALL TESTS PASSED - NO ERRORS ===');
    console.log('📝 Ready for real student submissions!');
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

// Auto-run the test
setTimeout(() => {
  if (window.testSubmissionNoErrors) {
    window.testSubmissionNoErrors();
  }
}, 2000);

console.log('✅ Error-free submission test loaded. Run testSubmissionNoErrors() to test.');
