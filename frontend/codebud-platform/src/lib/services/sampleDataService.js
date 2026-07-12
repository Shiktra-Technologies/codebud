/**
 * Sample data generator for testing real-time leaderboard functionality
 */

// Submission functionality disabled — no imports needed
import leaderboardService from './leaderboardService';

export const generateSampleSubmissions = () => {
  console.log('🚫 Sample submission generation is disabled');
  console.log('ℹ️ Only real student test submissions will be stored in the database');
  return [];

  // DISABLED SAMPLE DATA:
  /*
  const sampleSubmissions = [
    {
      id: 'user1_1732824000000',
      user_id: 'user1',
      user_name: 'Alice Johnson',
      user_email: 'alice@example.com',
      test_type: 'aptitude',
      score: 95,
      total_questions: 20,
      time_taken: 1800,
      status: 'completed',
      submitted_at: new Date('2024-11-28T10:00:00Z').toISOString(),
      created_at: new Date('2024-11-28T10:00:00Z').toISOString(),
      answers: Array(20).fill(null).map((_, i) => ({ question: i + 1, answer: 'A', correct: Math.random() > 0.25 }))
    },
    {
      id: 'user1_1732824600000',
      user_id: 'user1',
      user_name: 'Alice Johnson',
      user_email: 'alice@example.com',
      test_type: 'technical',
      score: 88,
      total_questions: 15,
      time_taken: 2400,
      status: 'completed',
      submitted_at: new Date('2024-11-28T14:00:00Z').toISOString(),
      created_at: new Date('2024-11-28T14:00:00Z').toISOString(),
      answers: Array(15).fill(null).map((_, i) => ({ question: i + 1, answer: 'B', correct: Math.random() > 0.2 }))
    },
    {
      id: 'user2_1732825200000',
      user_id: 'user2',
      user_name: 'Bob Smith',
      user_email: 'bob@example.com',
      test_type: 'aptitude',
      score: 92,
      total_questions: 20,
      time_taken: 1650,
      status: 'completed',
      submitted_at: new Date('2024-11-28T11:30:00Z').toISOString(),
      created_at: new Date('2024-11-28T11:30:00Z').toISOString(),
      answers: Array(20).fill(null).map((_, i) => ({ question: i + 1, answer: 'C', correct: Math.random() > 0.15 }))
    },
    {
      id: 'user2_1732826800000',
      user_id: 'user2',
      user_name: 'Bob Smith',
      user_email: 'bob@example.com',
      test_type: 'technical',
      score: 90,
      total_questions: 15,
      time_taken: 2100,
      status: 'completed',
      submitted_at: new Date('2024-11-28T16:45:00Z').toISOString(),
      created_at: new Date('2024-11-28T16:45:00Z').toISOString(),
      answers: Array(15).fill(null).map((_, i) => ({ question: i + 1, answer: 'A', correct: Math.random() > 0.1 }))
    },
    {
      id: 'user3_1732827400000',
      user_id: 'user3',
      user_name: 'Carol Davis',
      user_email: 'carol@example.com',
      test_type: 'aptitude',
      score: 89,
      total_questions: 20,
      time_taken: 1920,
      status: 'completed',
      submitted_at: new Date('2024-11-29T09:15:00Z').toISOString(),
      created_at: new Date('2024-11-29T09:15:00Z').toISOString(),
      answers: Array(20).fill(null).map((_, i) => ({ question: i + 1, answer: 'B', correct: Math.random() > 0.18 }))
    },
    {
      id: 'user4_1732828000000',
      user_id: 'user4',
      user_name: 'David Wilson',
      user_email: 'david@example.com',
      test_type: 'aptitude',
      score: 85,
      total_questions: 20,
      time_taken: 2100,
      status: 'completed',
      submitted_at: new Date('2024-11-29T12:00:00Z').toISOString(),
      created_at: new Date('2024-11-29T12:00:00Z').toISOString(),
      answers: Array(20).fill(null).map((_, i) => ({ question: i + 1, answer: 'D', correct: Math.random() > 0.25 }))
    },
    {
      id: 'user4_1732828600000',
      user_id: 'user4',
      user_name: 'David Wilson',
      user_email: 'david@example.com',
      test_type: 'technical',
      score: 87,
      total_questions: 15,
      time_taken: 2700,
      status: 'completed',
      submitted_at: new Date('2024-11-29T15:30:00Z').toISOString(),
      created_at: new Date('2024-11-29T15:30:00Z').toISOString(),
      answers: Array(15).fill(null).map((_, i) => ({ question: i + 1, answer: 'C', correct: Math.random() > 0.13 }))
    },
    {
      id: 'user5_1732829200000',
      user_id: 'user5',
      user_name: 'Emma Brown',
      user_email: 'emma@example.com',
      test_type: 'aptitude',
      score: 91,
      total_questions: 20,
      time_taken: 1750,
      status: 'completed',
      submitted_at: new Date('2024-11-29T18:45:00Z').toISOString(),
      created_at: new Date('2024-11-29T18:45:00Z').toISOString(),
      answers: Array(20).fill(null).map((_, i) => ({ question: i + 1, answer: 'A', correct: Math.random() > 0.09 }))
    }
  ];

  return sampleSubmissions;
  */
};

export const addSampleSubmissionsToLocalStorage = () => {
  console.log('🚫 Sample submission generation to localStorage is disabled');
  console.log('ℹ️ Only real student test submissions will be stored');

  // Return existing submissions if any
  try {
    const existingSubmissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
    console.log(`ℹ️ Found ${existingSubmissions.length} existing submissions in localStorage`);
    return existingSubmissions;
  } catch (error) {
    console.error('Error reading existing submissions:', error);
    return [];
  }
};

export const clearAllSubmissions = () => {
  try {
    localStorage.removeItem('all_submissions');
    localStorage.removeItem('leaderboard_data');
    localStorage.removeItem('user_scores');
    console.log('🧹 Cleared all submissions and leaderboard data');
  } catch (error) {
    console.error('Error clearing submissions:', error);
  }
};

// Function to simulate a new test submission - DISABLED
export const simulateTestSubmission = (userId, userName, userEmail, testType, score) => {
  console.log('🚫 Test simulation is disabled');
  console.log('ℹ️ Only real student test submissions will be stored');
  return null;
};

export default {
  generateSampleSubmissions,
  addSampleSubmissionsToLocalStorage,
  clearAllSubmissions,
  simulateTestSubmission
};
