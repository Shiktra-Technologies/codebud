/**
 * Leaderboard Demo Utility
 * Use this to test real-time leaderboard updates across multiple devices/tabs
 */

// Demo submissions disabled — no Supabase import needed
import leaderboardService from '../services/leaderboardService';

// Demo user profiles for testing
const demoUsers = [
  { id: 'demo_user_1', name: 'Alice Johnson', email: 'alice@demo.com' },
  { id: 'demo_user_2', name: 'Bob Smith', email: 'bob@demo.com' },
  { id: 'demo_user_3', name: 'Charlie Brown', email: 'charlie@demo.com' },
  { id: 'demo_user_4', name: 'Diana Wilson', email: 'diana@demo.com' },
  { id: 'demo_user_5', name: 'Eva Garcia', email: 'eva@demo.com' },
];

const testTypes = ['aptitude', 'coding', 'technical', 'general'];

/**
 * Generate a random test submission for demo purposes
 * DISABLED: Only real student submissions should be stored
 */
export const generateRandomSubmission = async () => {
  console.log('🚫 Demo submission generation is disabled');
  console.log('ℹ️ Only real student test submissions will be stored in the database');
  return {
    success: false,
    message: 'Demo submissions are disabled. Only real student submissions allowed.'
  };

  // DISABLED CODE:
  /*
  const user = demoUsers[Math.floor(Math.random() * demoUsers.length)];
  const testType = testTypes[Math.floor(Math.random() * testTypes.length)];
  const totalQuestions = Math.floor(Math.random() * 20) + 10; // 10-30 questions
  const score = Math.floor(Math.random() * totalQuestions); // Random score up to total
  
  const submissionData = {
    userName: user.name,
    userEmail: user.email,
    testType: testType,
    score: score,
    totalQuestions: totalQuestions,
    timeTaken: Math.floor(Math.random() * 3600) + 300, // 5-65 minutes
    status: 'completed',
    answers: Array(totalQuestions).fill(null).map((_, i) => ({
      question: i + 1,
      answer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
      correct: Math.random() > 0.3 // 70% chance of being correct
    }))
  };

  try {
    console.log('🎯 Generating demo submission:', {
      user: user.name,
      testType,
      score: `${score}/${totalQuestions}`,
      percentage: Math.round((score / totalQuestions) * 100) + '%'
    });

    await submitTestToSupabase(user.id, submissionData);
    return {
      success: true,
      user: user.name,
      score: score,
      totalQuestions: totalQuestions,
      testType: testType
    };
  } catch (error) {
    console.error('Error generating demo submission:', error);
    return { success: false, error: error.message };
  }
  */
};

/**
 * Generate multiple submissions for testing
 * DISABLED: Only real student submissions should be stored
 */
export const generateMultipleSubmissions = async (count = 3) => {
  console.log('🚫 Demo multiple submission generation is disabled');
  console.log('ℹ️ Only real student test submissions will be stored in the database');
  return [{
    success: false,
    message: 'Demo submissions are disabled. Only real student submissions allowed.'
  }];
};

/**
 * Clear all demo data
 */
export const clearDemoData = () => {
  try {
    // Remove demo submissions from localStorage
    const allSubmissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
    const filteredSubmissions = allSubmissions.filter(sub =>
      !sub.user_id.startsWith('demo_user_')
    );

    localStorage.setItem('all_submissions', JSON.stringify(filteredSubmissions));

    // Refresh leaderboard
    leaderboardService.refreshLeaderboard();

    console.log('🧹 Demo data cleared');
    return { success: true, removed: allSubmissions.length - filteredSubmissions.length };
  } catch (error) {
    console.error('Error clearing demo data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current leaderboard status
 */
export const getLeaderboardStatus = () => {
  const leaderboard = leaderboardService.getLeaderboard();
  const submissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');

  return {
    totalUsers: leaderboard.length,
    totalSubmissions: submissions.length,
    demoSubmissions: submissions.filter(sub => sub.user_id.startsWith('demo_user_')).length,
    topUsers: leaderboard.slice(0, 5).map(user => ({
      name: user.userName,
      score: user.totalScore,
      tests: user.testsCompleted
    }))
  };
};

/**
 * Test real-time synchronization
 */
export const testRealTimeSync = async () => {
  console.log('🔄 Testing real-time synchronization...');

  // Generate a submission
  const result = await generateRandomSubmission();

  // Wait a moment for sync
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check if leaderboard was updated
  const status = getLeaderboardStatus();

  console.log('📊 Real-time sync test results:', {
    submissionGenerated: result.success,
    currentLeaderboard: status
  });

  return {
    success: result.success,
    leaderboardStatus: status
  };
};

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  window.leaderboardDemo = {
    generateRandomSubmission,
    generateMultipleSubmissions,
    clearDemoData,
    getLeaderboardStatus,
    testRealTimeSync
  };

  console.log('🎯 Leaderboard Demo Utils loaded! Try:');
  console.log('  leaderboardDemo.generateRandomSubmission()');
  console.log('  leaderboardDemo.generateMultipleSubmissions(5)');
  console.log('  leaderboardDemo.getLeaderboardStatus()');
  console.log('  leaderboardDemo.testRealTimeSync()');
  console.log('  leaderboardDemo.clearDemoData()');
}

export default {
  generateRandomSubmission,
  generateMultipleSubmissions,
  clearDemoData,
  getLeaderboardStatus,
  testRealTimeSync
};
