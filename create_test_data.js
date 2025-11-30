/**
 * Script to create test submission data in localStorage to bypass RLS issues
 */

// Test submission data with proper field names
const testSubmissions = [
  {
    id: 'sub_001_' + Date.now(),
    user_id: 'student_001',
    user_name: 'Alice Johnson',
    user_email: 'alice.johnson@example.com',
    displayName: 'Alice Johnson',
    userName: 'Alice Johnson',
    userEmail: 'alice.johnson@example.com',
    test_type: 'Aptitude Test',
    testType: 'Aptitude Test',
    score: 28,
    total_questions: 30,
    totalQuestions: 30,
    time_taken: 1650,
    timeTaken: 1650,
    answers: Array.from({length: 30}, (_, i) => ({
      question: i+1, 
      answer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)], 
      correct: Math.random() > 0.1
    })),
    status: 'completed',
    submitted_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    submittedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    violation_count: 0,
    device_info: {browser: 'Chrome', os: 'macOS'},
    role: 'student'
  },
  {
    id: 'sub_002_' + Date.now(),
    user_id: 'student_002',
    user_name: 'Bob Smith',
    user_email: 'bob.smith@example.com',
    displayName: 'Bob Smith',
    userName: 'Bob Smith',
    userEmail: 'bob.smith@example.com',
    test_type: 'Technical Assessment',
    testType: 'Technical Assessment',
    score: 22,
    total_questions: 30,
    totalQuestions: 30,
    time_taken: 1890,
    timeTaken: 1890,
    answers: Array.from({length: 30}, (_, i) => ({
      question: i+1, 
      answer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)], 
      correct: Math.random() > 0.2
    })),
    status: 'completed',
    submitted_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
    submittedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    violation_count: 1,
    device_info: {browser: 'Firefox', os: 'Windows'},
    role: 'student'
  },
  {
    id: 'sub_003_' + Date.now(),
    user_id: 'student_003',
    user_name: 'Carol Davis',
    user_email: 'carol.davis@example.com',
    displayName: 'Carol Davis',
    userName: 'Carol Davis',
    userEmail: 'carol.davis@example.com',
    test_type: 'Programming Challenge',
    testType: 'Programming Challenge',
    score: 35,
    total_questions: 40,
    totalQuestions: 40,
    time_taken: 2100,
    timeTaken: 2100,
    answers: Array.from({length: 40}, (_, i) => ({
      question: i+1, 
      answer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)], 
      correct: Math.random() > 0.05
    })),
    status: 'completed',
    submitted_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
    submittedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    violation_count: 0,
    device_info: {browser: 'Safari', os: 'macOS'},
    role: 'student'
  },
  {
    id: 'sub_004_' + Date.now(),
    user_id: 'student_004',
    user_name: 'David Wilson',
    user_email: 'david.wilson@example.com',
    displayName: 'David Wilson',
    userName: 'David Wilson',
    userEmail: 'david.wilson@example.com',
    test_type: 'Aptitude Test',
    testType: 'Aptitude Test',
    score: 18,
    total_questions: 30,
    totalQuestions: 30,
    time_taken: 2400,
    timeTaken: 2400,
    answers: Array.from({length: 30}, (_, i) => ({
      question: i+1, 
      answer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)], 
      correct: Math.random() > 0.4
    })),
    status: 'completed',
    submitted_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    submittedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    violation_count: 2,
    device_info: {browser: 'Chrome', os: 'Linux'},
    role: 'student'
  },
  {
    id: 'sub_005_' + Date.now(),
    user_id: 'student_005',
    user_name: 'Emma Brown',
    user_email: 'emma.brown@example.com',
    displayName: 'Emma Brown',
    userName: 'Emma Brown',
    userEmail: 'emma.brown@example.com',
    test_type: 'Coding Assessment',
    testType: 'Coding Assessment',
    score: 42,
    total_questions: 45,
    totalQuestions: 45,
    time_taken: 3600,
    timeTaken: 3600,
    answers: Array.from({length: 45}, (_, i) => ({
      question: i+1, 
      answer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)], 
      correct: Math.random() > 0.07
    })),
    status: 'completed',
    submitted_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
    submittedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    violation_count: 0,
    device_info: {browser: 'Edge', os: 'Windows'},
    role: 'student'
  }
];

console.log('🧪 Creating test submission data in localStorage...');

// Store in all the possible localStorage keys that the app might check
localStorage.setItem('all_submissions', JSON.stringify(testSubmissions));
localStorage.setItem('test_results', JSON.stringify(testSubmissions));
localStorage.setItem('admin_submissions', JSON.stringify(testSubmissions));

// Create CSV data for the CSV service
const csvHeaders = 'Student Name,Student Email,Test Type,Score,Total Questions,Percentage,Time Taken,Submission Date,Status,Violations,Device';
const csvRows = testSubmissions.map(sub => {
  const percentage = Math.round((sub.score / sub.total_questions) * 100);
  const deviceInfo = `${sub.device_info.browser} on ${sub.device_info.os}`;
  return `"${sub.user_name}","${sub.user_email}","${sub.test_type}","${sub.score}","${sub.total_questions}","${percentage}%","${Math.floor(sub.time_taken / 60)} min","${new Date(sub.submitted_at).toLocaleString()}","${sub.status}","${sub.violation_count}","${deviceInfo}"`;
}).join('\n');

const csvContent = csvHeaders + '\n' + csvRows;
const csvData = {
  content: csvContent,
  lastUpdated: new Date().toISOString(),
  totalSubmissions: testSubmissions.length,
  downloadUrl: null
};

localStorage.setItem('admin_csv_data', JSON.stringify(csvData));

console.log(`✅ Created ${testSubmissions.length} test submissions in localStorage`);
console.log('📊 Submissions with names:');
testSubmissions.forEach(sub => {
  console.log(`  • ${sub.user_name} - ${sub.test_type} - ${sub.score}/${sub.total_questions}`);
});

console.log('💡 Refresh your admin dashboard to see the test data!');
