import React, { useState, useEffect, useCallback } from 'react';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import { isUserActive } from '../utils/userActivity';
import realTimeService from '../services/realTimeService';
import jobService from '../services/jobService';
import leaderboardService from '../services/leaderboardService';
import sampleDataService from '../services/sampleDataService';
import adminCSVService from '../services/adminCSVService';
import { getAllSubmissions } from '../services/supabaseService';
import { getAllSubmissionsFromSupabase } from '../services/submissionService';
import { supabase } from '../config/supabaseConfig';
import RealTimeLoader from './RealTimeLoader';
import './AdminDashboard.css';
import './AdminDashboard_premium.css';

const AdminDashboard = () => {
  const { currentUser, getAllUsers } = useSimpleAuth();
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Real-time data states
  const [students, setStudents] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [realTimeStatus, setRealTimeStatus] = useState('connecting');
  
  // Job posting states
  const [jobPostings, setJobPostings] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [showJobModal, setShowJobModal] = useState(false);
  const [newJobForm, setNewJobForm] = useState({
    company: '',
    position: '',
    location: '',
    type: 'Full-time',
    salary: '',
    description: '',
    requirements: ''
  });

  // CSV Reports states
  const [csvData, setCsvData] = useState(null);
  const [csvStats, setCsvStats] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [submissionFilter, setSubmissionFilter] = useState('all');
  const [searchCriteria, setSearchCriteria] = useState({
    searchText: '',
    startDate: '',
    endDate: '',
    minScore: '',
    maxScore: '',
    deviceType: '',
    hasViolations: undefined
  });

  console.log('AdminDashboard render - Real-time mode:', { 
    studentsCount: students.length,
    activeUsersCount: activeUsers.length,
    submissionsCount: testResults.length,
    status: realTimeStatus,
    currentUser: currentUser ? { 
      id: currentUser.id, 
      email: currentUser.email, 
      role: currentUser.role 
    } : null
  });
  
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never';
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  // Job posting functions
  const loadJobPostings = () => {
    const jobs = jobService.getJobPostings();
    setJobPostings(jobs);
  };

  const loadLeaderboard = () => {
    const leaderboard = leaderboardService.getTopUsers(10);
    setLeaderboardData(leaderboard);
  };

  const handleJobSubmit = (e) => {
    e.preventDefault();
    try {
      const newJobData = {
        ...newJobForm,
        postedBy: currentUser?.displayName || currentUser?.email || 'Admin'
      };
      
      const newJob = jobService.addJobPosting(newJobData);
      setJobPostings([newJob, ...jobPostings]);
      setShowJobModal(false);
      
      // Reset form
      setNewJobForm({
        company: '',
        position: '',
        location: '',
        type: 'Full-time',
        salary: '',
        description: '',
        requirements: ''
      });
      
      alert('Job posted successfully!');
    } catch (error) {
      console.error('Error posting job:', error);
      alert('Failed to post job. Please try again.');
    }
  };

  const handleJobInputChange = (field, value) => {
    setNewJobForm(prev => ({ ...prev, [field]: value }));
  };

  const deleteJobPosting = (jobId) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        jobService.deleteJobPosting(jobId);
        const updatedJobs = jobPostings.filter(job => job.id !== jobId);
        setJobPostings(updatedJobs);
        alert('Job posting deleted successfully!');
      } catch (error) {
        console.error('Error deleting job:', error);
        alert('Failed to delete job posting. Please try again.');
      }
    }
  };

  const calculateLeaderboard = () => {
    // Prioritize real leaderboard data from actual submissions
    if (leaderboardData.length > 0) {
      return leaderboardData.map(user => ({
        id: user.userId,
        name: user.userName || user.displayName || 'Unknown Student',
        email: user.userEmail || user.email || 'N/A',
        score: user.totalScore || 0,
        testsCompleted: user.testsCompleted || 0,
        averageScore: user.averageScore || 0,
        lastSubmission: user.lastSubmission,
        avatar: (user.userName || user.displayName)?.charAt(0)?.toUpperCase() || 'S'
      }));
    }
    
    // If no real leaderboard data, return empty array
    return [];
  };

  // Real-time data fetching
  const fetchRealTimeData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Fetching real-time data...');
      
      // Fetch real users
      let realUsers = [];
      try {
        realUsers = await getAllUsers();
      } catch (error) {
        console.warn('Could not fetch users from Supabase:', error);
      }

      // Process students
      if (realUsers && realUsers.length > 0) {
        const studentUsers = realUsers
          .filter(user => user.role === 'student' || !user.role) // Include users without role as potential students
          .map(student => ({
            ...student,
            id: student.id || student.uid,
            testsCompleted: 0, // TODO: Calculate from submissions
            isOnline: isUserActive(student.lastLogin || student.lastActive),
            lastSeenFormatted: formatLastSeen(student.lastLogin || student.lastActive)
          }));
        
        setStudents(studentUsers);
        
        // Filter active users (online in last 5 minutes)
        // Exclude current admin user and only show active student users
        const currentlyActive = studentUsers
          .filter(user => user.isOnline)
          .filter(user => user.id !== currentUser?.id) // Exclude current admin user
          .filter(user => user.role === 'student' || !user.role) // Only show student users
          .map(user => ({
            ...user,
            id: user.id || user.uid,
            currentActivity: user.currentActivity || 'Browsing platform',
            lastSeen: user.lastLogin || user.lastActive || new Date().toISOString()
          }));
          
        setActiveUsers(currentlyActive);
      }

      // Get submissions from Supabase (primary) - ignore localStorage if table exists
      let uniqueSubmissions = [];
      
      try {
        // Check if Supabase table exists first
        const { checkSubmissionCSVTable } = await import('../services/supabaseService');
        const tableCheck = await checkSubmissionCSVTable();
        
        if (tableCheck.exists) {
          console.log('[SUCCESS] submission_csv table exists - using Supabase data only');
          
          // Get submissions from Supabase using new clean service
          console.log('[CHECK] Calling getAllSubmissionsFromSupabase...');
          const result = await getAllSubmissionsFromSupabase();
          console.log('[LIST] getAllSubmissionsFromSupabase result:', { 
            success: result.success, 
            dataLength: result.data?.length,
            error: result.error 
          });
          
          if (result.success && result.data) {
            console.log(`✅ Loaded ${result.data.length} submissions from Supabase submission_csv_with_users table`);
            if (result.data.length > 0) {
              console.log('[CHECK] Sample submission:', result.data[0]);
            }
            uniqueSubmissions = result.data;
          } else {
            console.log('[DATA] No submissions in Supabase table yet');
            uniqueSubmissions = [];
          }
        } else {
          console.warn('[DATA] submission_csv table does not exist');
          uniqueSubmissions = [];
        }
      } catch (error) {
        console.warn('� Error accessing Supabase submissions:', error.message);
        uniqueSubmissions = [];
      }
      
      if (uniqueSubmissions.length > 0) {
        // Sort by submission time (newest first)
        uniqueSubmissions.sort((a, b) => {
          const timeA = new Date(a.submittedAt || a.timestamp || 0);
          const timeB = new Date(b.submittedAt || b.timestamp || 0);
          return timeB - timeA;
        });
        
        // Only update if we have more comprehensive data
        setTestResults(prev => {
          // If we have significantly more data, use the comprehensive set
          if (uniqueSubmissions.length > prev.length || prev.length === 0) {
            console.log(`📊 Loaded ${uniqueSubmissions.length} total submissions from all sources`);
            return uniqueSubmissions;
          }
          // Otherwise, keep the existing data to prevent jumping
          return prev;
        });
      }

      // Get activity data from real-time service
      try {
        const activityData = await realTimeService.fetchLatestData('submissions');
        if (activityData && activityData.length > 0) {
          setTestResults(prev => {
            const combined = [...activityData, ...prev];
            const unique = combined.filter((item, index, self) => 
              index === self.findIndex(t => t.id === item.id)
            );
            return unique; // Show all unique submissions
          });
        }
      } catch (error) {
        console.error('Failed to fetch real-time activity data:', error);
      }

      setRealTimeStatus('connected');
      setLoading(false);
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      setError('Failed to fetch real-time data');
      setRealTimeStatus('error');
      setLoading(false);
      setIsLoading(false);
    }
  }, [getAllUsers, currentUser]);

  // Filter submissions based on selected filter
  const getFilteredSubmissions = useCallback(() => {
    if (!testResults || testResults.length === 0) return [];
    
    let filtered = [...testResults];
    
    switch (submissionFilter) {
      case 'passed':
        filtered = filtered.filter(r => {
          const score = r.score || 0;
          const total = r.total_questions || r.totalQuestions || 30;
          return (score / total) >= 0.6;
        });
        break;
      case 'failed':
        filtered = filtered.filter(r => {
          const score = r.score || 0;
          const total = r.total_questions || r.totalQuestions || 30;
          return (score / total) < 0.6;
        });
        break;
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = filtered.filter(r => {
          const submissionDate = new Date(r.submitted_at || r.submittedAt || r.timestamp);
          return submissionDate >= today;
        });
        break;
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(r => {
          const submissionDate = new Date(r.submitted_at || r.submittedAt || r.timestamp);
          return submissionDate >= weekAgo;
        });
        break;
      default:
        // 'all' - no filtering
        break;
    }
    
    return filtered;
  }, [testResults, submissionFilter]);

  // Test Supabase function
  const testSupabaseSubmissions = async () => {
    console.log('[TEST] Testing Supabase submission_csv table...');
    try {
      // First check table structure
      console.log('[CHECK] Checking submission_csv table structure...');
      const { checkSubmissionCSVTable } = await import('../services/supabaseService');
      const tableCheck = await checkSubmissionCSVTable();
      console.log('[DATA] Table check result:', tableCheck);
      
      if (tableCheck.exists) {
        console.log('[SUCCESS] submission_csv table exists! Testing full functionality...');
        
        // Clear old localStorage data since we have Supabase now
        const oldData = {
          test_results: JSON.parse(localStorage.getItem('test_results') || '[]').length,
          pending_submissions: JSON.parse(localStorage.getItem('pending_submissions') || '[]').length,
          submission_forwarding: JSON.parse(localStorage.getItem('submission_forwarding') || '[]').length,
        };
        
        if (oldData.test_results > 0 || oldData.pending_submissions > 0 || oldData.submission_forwarding > 0) {
          console.log('[CLEANUP] Clearing old localStorage data:', oldData);
          localStorage.removeItem('test_results');
          localStorage.removeItem('pending_submissions'); 
          localStorage.removeItem('submission_forwarding');
          localStorage.removeItem('supabase_submissions');
        }
        
        // Test retrieving existing submissions from Supabase
        console.log('[LIST] Retrieving submissions from submission_csv table...');
        const submissions = await getAllSubmissions();
        console.log('[DATA] Current submissions in Supabase:', submissions);
        
        // Test database connectivity only - no test submissions
        if (currentUser && currentUser.id) {
          console.log('[CHECK] Testing database connectivity...');
          
          // Check if the user exists in the users table
          console.log('[USER] Checking if user exists in users table...');
          const { data: userCheck, error: userCheckError } = await supabase
            .from('users')
            .select('id, email, role')
            .eq('id', currentUser.id)
            .single();
            
          if (userCheckError) {
            console.error('[ERROR] User does not exist in users table:', userCheckError);
            console.log('[DEBUG] This is likely why submissions would fail');
            
            // Try to create the user for future submissions
            console.log('[BUILD] Attempting to create user record for future submissions...');
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert([{
                id: currentUser.id,
                email: currentUser.email || 'test@example.com',
                display_name: currentUser.display_name || currentUser.email?.split('@')[0] || 'Test User',
                role: currentUser.role || 'student',
                created_at: new Date().toISOString()
              }])
              .select()
              .single();
              
            if (createError) {
              console.error('[ERROR] Failed to create user:', createError);
              console.log('⚠️ Students will not be able to submit tests until user record exists');
            } else {
              console.log('[SUCCESS] User created successfully:', newUser);
              console.log('[SUCCESS] Ready to receive real student submissions');
            }
          } else {
            console.log('[SUCCESS] User exists in users table:', userCheck);
            console.log('[SUCCESS] Ready to receive real student submissions');
          }
          
          console.log('[TARGET] Database connectivity test complete - no test submissions created');
        } else {
          console.warn('[WARNING] No current user - cannot test database connectivity');
        }
        
        // Import and make test function available globally
        import('../utils/testSubmissionFlow').then(module => {
          window.testSubmissionFlow = module.testSubmissionFlow;
        });
        
        // Import and make test functions available globally
        import('../utils/testSubmissionFlow').then(({ testSubmissionFlow }) => {
          window.testSubmissionFlow = testSubmissionFlow;
          console.log('[SUCCESS] testSubmissionFlow() is now available globally');
        }).catch(console.error);

        // Make debugging functions available globally
        window.debugSubmissionFlow = async () => {
          console.log('[CHECK] === DEBUGGING SUBMISSION FLOW ===');
          
          // Check current auth user
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          console.log('[USER] Current auth user:', user ? { id: user.id, email: user.email } : 'None', authError);
          
          // Check users table
          if (user) {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();
            console.log('👥 User in users table:', userData || 'Not found', userError);
          }
          
          // Check submissions table
          const { data: submissions, error: submissionsError } = await supabase
            .from('submission_csv')
            .select('*')
            .limit(5);
          console.log('[DATA] Recent submissions:', submissions || [], submissionsError);
          
          console.log('[CHECK] === DEBUGGING COMPLETE ===');
        };
        
        window.clearAllLocalStorageData = () => {
          localStorage.clear();
          console.log('[CLEANUP] Cleared ALL localStorage data. Refresh the page.');
        };
        
        console.log('💡 To clear ALL localStorage: clearAllLocalStorageData()');
        return;
      }
      
      if (!tableCheck.exists) {
        console.log('[BUILD] Attempting to create submission_csv table...');
        const createResult = await createSubmissionCSVTable();
        console.log('🏗️ Table creation result:', createResult);
        
        if (!createResult.success) {
          console.error('[ERROR] Table does not exist. Please create it manually.');
          console.log('[LIST] SQL Script to run in Supabase dashboard:');
          const { getSubmissionCSVTableScript } = await import('../services/supabaseService');
          console.log(getSubmissionCSVTableScript());
          
          // Check localStorage data to see what's causing the large number
          const testResults = JSON.parse(localStorage.getItem('test_results') || '[]');
          const allSubmissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
          const pendingSubmissions = JSON.parse(localStorage.getItem('pending_submissions') || '[]');
          const forwardingData = JSON.parse(localStorage.getItem('submission_forwarding') || '[]');
          
          console.warn('🗂️ Large localStorage detected:', {
            test_results: testResults.length,
            all_submissions: allSubmissions.length,
            pending_submissions: pendingSubmissions.length,
            submission_forwarding: forwardingData.length,
            total: testResults.length + allSubmissions.length + pendingSubmissions.length + forwardingData.length
          });
          
          // Provide cleanup function
          window.clearLargeLocalStorageData = () => {
            localStorage.removeItem('submission_forwarding');
            localStorage.removeItem('pending_submissions');
            console.log('[CLEANUP] Cleared large localStorage data. Refresh the page.');
          };
          
          console.log('💡 If you see too many submissions, run: clearLargeLocalStorageData()');
          
          console.warn('[WARNING] Using localStorage fallback until table is created');
          return;
        }
      }
      
      if (!tableCheck.exists) {
        console.error('[ERROR] Submissions table does not exist - need to create it');
        return;
      }
      
      // Test inserting multiple submissions with realistic data to populate submission_csv_with_users
      const testStudents = [
        {
          id: 'student_001_' + Date.now(),
          userName: 'Alice Johnson',
          userEmail: 'alice.johnson@example.com',
          testType: 'aptitude',
          score: 28,
          totalQuestions: 30,
          timeTaken: 1650,
          answers: Array.from({length: 30}, (_, i) => ({question: i+1, answer: 'A', correct: Math.random() > 0.1})),
          status: 'completed'
        },
        {
          id: 'student_002_' + Date.now(),
          userName: 'Bob Smith',
          userEmail: 'bob.smith@example.com',
          testType: 'aptitude', 
          score: 22,
          totalQuestions: 30,
          timeTaken: 1890,
          answers: Array.from({length: 30}, (_, i) => ({question: i+1, answer: 'B', correct: Math.random() > 0.2})),
          status: 'completed'
        },
        {
          id: 'student_003_' + Date.now(),
          userName: 'Carol Davis',
          userEmail: 'carol.davis@example.com',
          testType: 'technical',
          score: 35,
          totalQuestions: 40,
          timeTaken: 2100,
          answers: Array.from({length: 40}, (_, i) => ({question: i+1, answer: 'C', correct: Math.random() > 0.05})),
          status: 'completed'
        }
      ];
      
      console.log('📝 Inserting test submissions to populate submission_csv_with_users...');
      const insertResults = [];
      
      for (const student of testStudents) {
        console.log(`👤 Creating submission for ${student.userName}...`);
        try {
          const insertResult = await submitTestToSupabase(student.id, student);
          insertResults.push(insertResult);
          console.log(`✅ Inserted submission for ${student.userName}:`, insertResult?.success ? 'Success' : 'Failed');
        } catch (error) {
          console.error(`❌ Failed to insert submission for ${student.userName}:`, error.message);
        }
      }
      
      console.log('[SUCCESS] Insert results summary:', insertResults);
      
      // Wait a moment for database to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test retrieving submissions from both tables
      console.log('[LIST] Retrieving submissions from submission_csv_with_users...');
      const retrieveResult = await getAllSubmissions();
      console.log('[SUCCESS] Submissions retrieved:', {
        count: retrieveResult?.data?.length || 0,
        submissions: retrieveResult?.data?.slice(0, 3).map(s => ({
          userName: s.user_name || s.userName || s.display_name || s.name || 'Unknown',
          email: s.user_email || s.userEmail || s.email,
          testType: s.test_type || s.testType,
          score: s.score
        })) || []
      });

      // Log if no data is found but don't create fake data
      if (!retrieveResult?.data || retrieveResult.data.length === 0) {
        console.log('� No submissions found in submission_csv_with_users table');
        console.log('ℹ️ Submit real tests to see data here');
      }
      
    } catch (error) {
      console.error('[ERROR] Supabase test failed:', error);
    }
  };

  // Create localStorage test data when Supabase is empty
  const createLocalStorageTestData = async () => {
    const testSubmissions = [
      {
        id: 'sub_001_' + Date.now(),
        user_id: 'student_001',
        user_name: 'Alice Johnson',
        user_email: 'alice.johnson@example.com',
        display_name: 'Alice Johnson',
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
        answers: Array.from({length: 30}, (_, i) => ({question: i+1, answer: 'A', correct: Math.random() > 0.1})),
        status: 'completed',
        submitted_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
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
        display_name: 'Bob Smith',
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
        answers: Array.from({length: 30}, (_, i) => ({question: i+1, answer: 'B', correct: Math.random() > 0.2})),
        status: 'completed',
        submitted_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
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
        display_name: 'Carol Davis',
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
        answers: Array.from({length: 40}, (_, i) => ({question: i+1, answer: 'C', correct: Math.random() > 0.05})),
        status: 'completed',
        submitted_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
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
        display_name: 'David Wilson',
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
        answers: Array.from({length: 30}, (_, i) => ({question: i+1, answer: 'D', correct: Math.random() > 0.4})),
        status: 'completed',
        submitted_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
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
        display_name: 'Emma Brown',
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
        answers: Array.from({length: 45}, (_, i) => ({question: i+1, answer: 'A', correct: Math.random() > 0.07})),
        status: 'completed',
        submitted_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        submittedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        violation_count: 0,
        device_info: {browser: 'Edge', os: 'Windows'},
        role: 'student'
      }
    ];

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
    console.log('[DATA] Submissions with names:');
    testSubmissions.forEach(sub => {
      console.log(`  • ${sub.user_name} - ${sub.test_type} - ${sub.score}/${sub.total_questions}`);
    });

    return testSubmissions;
  };

  // Initialize real-time subscriptions
  useEffect(() => {
    console.log('🚀 Initializing Real-Time Admin Dashboard - Real Data Only');
    
    // Initialize job service (but don't add sample data)
    // jobService.initializeSampleData(); // DISABLED - no sample job data
    // sampleDataService.addSampleSubmissionsToLocalStorage(); // DISABLED - no sample submissions
    
    console.log('ℹ️ Sample data services disabled - showing only real database data');

    // Make test function available globally for manual testing
    window.testSupabaseSubmissions = testSupabaseSubmissions;
    
    // Initial data fetch
    fetchRealTimeData();
    loadJobPostings();
    loadLeaderboard();

    // Register for real-time leaderboard updates
    const handleLeaderboardUpdate = (updatedLeaderboard) => {
      console.log('[DATA] Admin dashboard received leaderboard update');
      setLeaderboardData(updatedLeaderboard);
    };

    leaderboardService.onLeaderboardUpdate(handleLeaderboardUpdate);

    // Listen for custom leaderboard update events
    const handleCustomLeaderboardUpdate = (event) => {
      console.log('[DATA] Admin dashboard received custom leaderboard update event');
      if (event.detail && event.detail.data) {
        setLeaderboardData(event.detail.data);
      }
    };

    // Listen for cross-device updates
    const handleCrossDeviceUpdate = (event) => {
      console.log('📱 Admin dashboard received cross-device update');
      if (event.detail && event.detail.type === 'leaderboard_update') {
        loadLeaderboard(); // Refresh leaderboard data
      }
    };

    window.addEventListener('leaderboard_updated', handleCustomLeaderboardUpdate);
    window.addEventListener('cross_device_update', handleCrossDeviceUpdate);

    // Set up real-time subscriptions
    const unsubscribeSubmissions = realTimeService.subscribe('submissions', (payload) => {
      console.log('[LIST] Real-time submissions update:', payload);
      const newData = Array.isArray(payload) ? payload : payload.data || [];
      if (newData.length > 0) {
        // Merge with existing data instead of replacing it
        setTestResults(prev => {
          const combined = [...newData, ...prev];
          const unique = combined.filter((item, index, self) => {
            if (!item) return false;
            return index === self.findIndex(s => {
              if (s.id && item.id) return s.id === item.id;
              const sKey = `${s.userId || s.studentEmail || 'anon'}_${s.submittedAt || s.timestamp}`;
              const itemKey = `${item.userId || item.studentEmail || 'anon'}_${item.submittedAt || item.timestamp}`;
              return sKey === itemKey;
            });
          });
          // Sort by timestamp (newest first)
          unique.sort((a, b) => new Date(b.submittedAt || b.timestamp || 0) - new Date(a.submittedAt || a.timestamp || 0));
          return unique;
        });
        setRealTimeStatus('connected');
      }
    }, { pollInterval: 5000 }); // Reduced frequency to prevent jumping

    const unsubscribeUsers = realTimeService.subscribe('activeUsers', (payload) => {
      console.log('👥 Real-time users update:', payload);
      const data = Array.isArray(payload) ? payload : payload.data || [];
      if (data.length > 0) {
        // Apply the same filtering logic: exclude current admin, only show students
        const filteredActiveUsers = data
          .filter(user => user.id !== currentUser?.id) // Exclude current admin user
          .filter(user => user.role === 'student' || !user.role); // Only show student users
        setActiveUsers(filteredActiveUsers);
        setRealTimeStatus('connected');
      }
    }, { pollInterval: 10000 }); // Reduced frequency

    const unsubscribeActivity = realTimeService.subscribe('activities', (payload) => {
      console.log('[DATA] Real-time activity update:', payload);
      // Update activity status without refetching all data to prevent jumping
      const data = Array.isArray(payload) ? payload : payload.data || [];
      if (data.length > 0) {
        // Just update the status without full data refetch
        setRealTimeStatus('connected');
      }
    }, { pollInterval: 15000 }); // Much reduced frequency for activity updates

    // Track admin user activity
    if (currentUser) {
      realTimeService.trackUserActivity(currentUser.id, 'admin dashboard');
    }

    // Cleanup subscriptions
    return () => {
      console.log('[CLEANUP] Cleaning up real-time subscriptions');
      unsubscribeSubmissions();
      unsubscribeUsers();
      unsubscribeActivity();
      leaderboardService.offLeaderboardUpdate(handleLeaderboardUpdate);
      window.removeEventListener('leaderboard_updated', handleCustomLeaderboardUpdate);
      window.removeEventListener('cross_device_update', handleCrossDeviceUpdate);
    };
  }, [currentUser, fetchRealTimeData]);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    setLoading(true);
    setRealTimeStatus('refreshing');
    fetchRealTimeData();
  }, [fetchRealTimeData]);

  // CSV Reports Handlers
  const loadCSVData = useCallback(async () => {
    setCsvLoading(true);
    try {
      const [csvData, statistics, recent] = await Promise.all([
        adminCSVService.getCurrentCSVData(),
        adminCSVService.getSubmissionStatistics(),
        adminCSVService.getRecentSubmissions(1000) // Request a very high limit to get all submissions
      ]);
      
      setCsvData(csvData);
      setCsvStats(statistics);
      setRecentSubmissions(recent);
    } catch (error) {
      console.error('Failed to load CSV data:', error);
      setError('Failed to load CSV data');
    } finally {
      setCsvLoading(false);
    }
  }, []);

  const handleCSVRefresh = useCallback(async () => {
    await adminCSVService.forceRefresh();
    await loadCSVData();
  }, [loadCSVData]);

  const handleCSVDownload = useCallback(async (criteria = null) => {
    try {
      if (criteria && Object.values(criteria).some(v => v !== '' && v !== undefined)) {
        // Download filtered CSV
        const success = await adminCSVService.exportFilteredCSV(criteria);
        if (!success) {
          setError('Failed to export filtered CSV');
        }
      } else {
        // Download full CSV
        const success = await adminCSVService.downloadCSV();
        if (!success) {
          setError('Failed to download CSV');
        }
      }
    } catch (error) {
      console.error('CSV download error:', error);
      setError('Failed to download CSV file');
    }
  }, []);

  const handleCSVSearch = useCallback(async (criteria) => {
    setCsvLoading(true);
    try {
      const filtered = await adminCSVService.searchSubmissions(criteria);
      setRecentSubmissions(filtered); // Show all filtered results
    } catch (error) {
      console.error('CSV search error:', error);
      setError('Failed to search submissions');
    } finally {
      setCsvLoading(false);
    }
  }, []);

  // Load CSV data when tab changes to CSV reports
  useEffect(() => {
    if (activeTab === 'csv-reports' && !csvData) {
      loadCSVData();
    }
  }, [activeTab, csvData, loadCSVData]);

  // Setup real-time CSV updates
  useEffect(() => {
    if (activeTab === 'csv-reports') {
      const removeListener = adminCSVService.addUpdateListener((updateData) => {
        console.log('CSV update received:', updateData);
        loadCSVData(); // Refresh data when new submissions arrive
      });

      return removeListener;
    }
  }, [activeTab, loadCSVData]);

  // Setup Supabase real-time subscriptions for cross-device updates
  useEffect(() => {
    console.log('🔄 Setting up Supabase real-time subscriptions for Admin Dashboard');
    
    // Subscribe to submission_csv table changes
    const submissionsSubscription = supabase
      .channel('admin-submission-csv')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'submission_csv' 
        }, 
        (payload) => {
          console.log('🆕 New submission received via Supabase real-time:', payload.new);
          
          // Instead of trying to access joined data that doesn't exist in real-time,
          // just refresh the submissions to get the proper user data from the view
          loadTestResults();
          
          // Refresh CSV data if on CSV reports tab
          if (activeTab === 'csv-reports') {
            loadCSVData();
          }
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'submission_csv' 
        }, 
        (payload) => {
          console.log('📝 Submission updated via Supabase real-time:', payload.new);
          
          // Instead of trying to access joined data that doesn't exist in real-time,
          // just refresh the submissions to get the proper user data from the view
          loadTestResults();
          
          // Refresh CSV data if on CSV reports tab
          if (activeTab === 'csv-reports') {
            loadCSVData();
          }
        }
      )
      .subscribe();

    // Subscribe to users table changes for active user tracking
    const usersSubscription = supabase
      .channel('admin-users')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'users' 
        }, 
        (payload) => {
          console.log('[USER] User activity update via Supabase real-time:', payload);
          
          // Refresh user data when user activities change
          fetchRealTimeData();
        }
      )
      .subscribe();

    // Cleanup subscriptions on component unmount
    return () => {
      console.log('🔌 Cleaning up Supabase real-time subscriptions');
      submissionsSubscription.unsubscribe();
      usersSubscription.unsubscribe();
    };
  }, [activeTab, loadCSVData, fetchRealTimeData]);

  // Show loading state while fetching initial data
  if (loading && students.length === 0) {
    return (
      <div className="admin-dashboard">
        <RealTimeLoader />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {error && (
        <div className="warning-banner">
          <div className="warning-content">
            <span className="warning-icon">!</span>
            <span className="warning-text">{error}</span>
            <button className="warning-dismiss" onClick={() => setError('')}>×</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <h1 style={{ margin: '0 0 5px 0' }}>Real-Time Admin Dashboard</h1>
            <p style={{ margin: '0', color: '#666' }}>Welcome, {currentUser?.displayName || currentUser?.email || 'Admin'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: realTimeStatus === 'connected' ? '#28a745' : 
                               realTimeStatus === 'connecting' ? '#ffc107' : '#dc3545'
              }}></div>
              <span style={{ fontSize: '14px', color: '#666' }}>
                {realTimeStatus === 'connected' ? 'Live Data' : 
                 realTimeStatus === 'connecting' ? 'Connecting...' : 
                 realTimeStatus === 'refreshing' ? 'Refreshing...' : 'Connection Error'}
              </span>
            </div>
            <button 
              onClick={handleRefresh}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                marginRight: '8px'
              }}
            >
              Refresh
            </button>
            <button 
              onClick={() => {
                // Simulate a live submission for testing
                const testSubmission = {
                  id: `test-${Date.now()}`,
                  userId: 'test-user-' + Math.random().toString(36).substring(2, 9),
                  userName: `Test Student ${Math.floor(Math.random() * 100)}`,
                  problemTitle: ['Two Sum', 'Binary Search', 'Merge Sort', 'Quick Sort'][Math.floor(Math.random() * 4)],
                  score: Math.floor(Math.random() * 40) + 60, // 60-100
                  passed: true,
                  submittedAt: new Date().toISOString()
                };
                
                // Add to localStorage
                const existing = JSON.parse(localStorage.getItem('test_results') || '[]');
                existing.unshift(testSubmission);
                localStorage.setItem('test_results', JSON.stringify(existing)); // Store all submissions
                
                // Trigger real-time update
                realTimeService.broadcastUpdate('submissions', [testSubmission, ...existing]); // Broadcast all submissions
                
                console.log('[TEST] Generated test submission:', testSubmission);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Test Submission
            </button>
          </div>
        </div>
        <p style={{ color: '#28a745', fontSize: '14px', margin: '0' }}>
          Real-time updates every 2-5 seconds • {students.length} students • {activeUsers.length} active • {testResults.length} submissions
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ padding: '0 20px', borderBottom: '1px solid #eee' }}>
        <button 
          style={{ 
            padding: '10px 15px', 
            margin: '0 5px', 
            backgroundColor: activeTab === 'students' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'students' ? 'white' : 'black',
            border: '1px solid #dee2e6',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('students')}
        >
          Students ({students.length})
        </button>
        <button 
          style={{ 
            padding: '10px 15px', 
            margin: '0 5px', 
            backgroundColor: activeTab === 'active-users' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'active-users' ? 'white' : 'black',
            border: '1px solid #dee2e6',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('active-users')}
        >
          Active Users ({activeUsers.length})
        </button>
        <button 
          style={{ 
            padding: '10px 15px', 
            margin: '0 5px', 
            backgroundColor: activeTab === 'submissions' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'submissions' ? 'white' : 'black',
            border: '1px solid #dee2e6',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('submissions')}
        >
          Submissions ({testResults.length})
        </button>
        <button 
          style={{ 
            padding: '10px 15px', 
            margin: '0 5px', 
            backgroundColor: activeTab === 'leaderboard' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'leaderboard' ? 'white' : 'black',
            border: '1px solid #dee2e6',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('leaderboard')}
        >
          Leaderboard
        </button>
        <button 
          style={{ 
            padding: '10px 15px', 
            margin: '0 5px', 
            backgroundColor: activeTab === 'job-posting' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'job-posting' ? 'white' : 'black',
            border: '1px solid #dee2e6',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('job-posting')}
        >
          Job Posting
        </button>

        <button
          style={{ 
            padding: '10px 15px', 
            margin: '0 5px', 
            backgroundColor: activeTab === 'csv-reports' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'csv-reports' ? 'white' : 'black',
            border: '1px solid #dee2e6',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('csv-reports')}
        >
          CSV Reports
        </button>
        
        <button
          style={{ 
            padding: '10px 15px', 
            margin: '0 5px', 
            backgroundColor: activeTab === 'debug' ? '#dc3545' : '#f8f9fa',
            color: activeTab === 'debug' ? 'white' : 'black',
            border: '1px solid #dee2e6',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('debug')}
        >
          Debug
        </button>
      </div>

      {/* Content Area */}
      <div style={{ padding: '20px' }}>
        {activeTab === 'students' && (
          <div>
            <h2>All Students ({students.length})</h2>
            {students.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                border: '2px dashed #dee2e6'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                <h3 style={{ color: '#6c757d' }}>No Students Found</h3>
                <p style={{ color: '#6c757d', margin: '0' }}>
                  Students will appear here when they sign up and log in to the platform
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {students.map(student => (
                <div key={student.id} style={{ 
                  border: '1px solid #dee2e6', 
                  borderRadius: '8px', 
                  padding: '15px',
                  backgroundColor: 'white'
                }}>
                  <h3>{student.displayName}</h3>
                  <p style={{ color: '#666', fontSize: '14px' }}>{student.email}</p>
                  <p style={{ color: student.isOnline ? 'green' : 'gray' }}>
                    🟢 {student.isOnline ? 'Online' : 'Offline'} • {student.lastSeenFormatted}
                  </p>
                  <p>Tests Completed: {student.testsCompleted}</p>
                </div>
              ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'active-users' && (
          <div>
            {/* Header with status and refresh */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '25px'
            }}>
              <h2 style={{ margin: '0', color: '#212529' }}>
                🟢 Active Users & Their Submissions ({activeUsers.length})
              </h2>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{
                  padding: '8px 15px',
                  backgroundColor: realTimeStatus === 'connected' ? '#d4edda' : '#f8d7da',
                  color: realTimeStatus === 'connected' ? '#155724' : '#721c24',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: `1px solid ${realTimeStatus === 'connected' ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                  {realTimeStatus === 'connected' ? '🟢 LIVE' : '🔴 OFFLINE'}
                </div>
                <button
                  onClick={fetchRealTimeData}
                  disabled={isLoading}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: isLoading ? '#6c757d' : '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  🔄 {isLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

            {isLoading ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '12px',
                border: '1px solid #dee2e6'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <h3 style={{ color: '#6c757d' }}>Loading Active Users...</h3>
                <p style={{ color: '#6c757d', margin: '0' }}>
                  Fetching real-time user activity and submissions
                </p>
              </div>
            ) : activeUsers.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px', 
                backgroundColor: '#ffffff', 
                borderRadius: '12px',
                border: '2px dashed #dee2e6',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🟢</div>
                <h3 style={{ color: '#495057', marginBottom: '12px' }}>No Active Users</h3>
                <p style={{ color: '#6c757d', margin: '0', fontSize: '16px' }}>
                  Users who are currently online will appear here with their recent submissions
                </p>
                <div style={{
                  marginTop: '20px',
                  padding: '12px 20px',
                  backgroundColor: '#e7f3ff',
                  borderRadius: '8px',
                  color: '#0066cc',
                  fontSize: '14px'
                }}>
                  💡 Users are considered active if they've been online in the last 5 minutes
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {activeUsers.map((user, index) => {
                  // Get user's recent submissions with better filtering
                  const userSubmissions = testResults.filter(submission => {
                    const matchesUserId = submission.userId === user.id;
                    const matchesEmail = submission.studentEmail === user.email || submission.userEmail === user.email;
                    const matchesUserName = submission.userName === user.displayName;
                    return matchesUserId || matchesEmail || matchesUserName;
                  }).slice(0, 5); // Show last 5 submissions

                  const lastActivity = user.lastSeen ? new Date(user.lastSeen) : null;
                  const isRecentlyActive = lastActivity && (Date.now() - lastActivity.getTime()) < 5 * 60 * 1000; // 5 minutes

                  return (
                    <div key={user.id || index} style={{ 
                      border: `2px solid ${isRecentlyActive ? '#28a745' : '#dee2e6'}`, 
                      borderRadius: '15px', 
                      padding: '0',
                      backgroundColor: 'white',
                      overflow: 'hidden',
                      boxShadow: isRecentlyActive ? '0 4px 12px rgba(40, 167, 69, 0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease'
                    }}>
                      {/* User Header */}
                      <div style={{
                        background: isRecentlyActive 
                          ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
                          : 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                        color: 'white',
                        padding: '25px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px'
                      }}>
                        <div style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255,255,255,0.25)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '28px',
                          fontWeight: 'bold',
                          border: '3px solid rgba(255,255,255,0.4)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}>
                          {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '700' }}>
                            {user.displayName || user.email || 'Unknown User'}
                          </h3>
                          <p style={{ margin: '0 0 10px 0', opacity: 0.9, fontSize: '15px' }}>
                            {user.email || 'No email provided'}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                            <span style={{ 
                              backgroundColor: isRecentlyActive 
                                ? 'rgba(255, 255, 255, 0.25)' 
                                : 'rgba(40, 167, 69, 0.9)', 
                              padding: '6px 14px', 
                              borderRadius: '20px', 
                              fontSize: '12px',
                              fontWeight: '700',
                              border: '1px solid rgba(255,255,255,0.3)'
                            }}>
                              {isRecentlyActive ? '🟢 LIVE' : '🔵 ACTIVE'} {user.currentActivity || 'Online'}
                            </span>
                            <span style={{ fontSize: '13px', opacity: 0.85, fontWeight: '500' }}>
                              Last seen: {formatLastSeen(user.lastSeen)}
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '4px' }}>
                            {userSubmissions.length}
                          </div>
                          <div style={{ fontSize: '13px', opacity: 0.85, fontWeight: '600' }}>
                            Submission{userSubmissions.length !== 1 ? 's' : ''}
                          </div>
                          {userSubmissions.length > 0 && (
                            <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>
                              Avg: {Math.round(userSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0) / userSubmissions.length)}%
                            </div>
                          )}
                        </div>
                      </div>

                      {/* User Submissions */}
                      <div style={{ padding: '25px' }}>
                        {userSubmissions.length === 0 ? (
                          <div style={{ 
                            textAlign: 'center', 
                            padding: '40px',
                            color: '#6c757d',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '12px',
                            border: '2px dashed #dee2e6'
                          }}>
                            <div style={{ fontSize: '40px', marginBottom: '15px' }}>📝</div>
                            <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>No submissions yet</h4>
                            <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>
                              This user hasn't submitted any tests yet
                            </p>
                          </div>
                        ) : (
                          <>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              marginBottom: '20px',
                              padding: '15px 20px',
                              backgroundColor: '#f8f9fa',
                              borderRadius: '10px',
                              border: '1px solid #e9ecef'
                            }}>
                              <h4 style={{ 
                                margin: '0', 
                                color: '#495057',
                                fontSize: '17px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontWeight: '700'
                              }}>
                                📊 Recent Submissions
                              </h4>
                              <div style={{ display: 'flex', gap: '15px', fontSize: '13px', fontWeight: '600' }}>
                                <span style={{ color: '#28a745' }}>
                                  ✅ {userSubmissions.filter(s => s.passed).length} Passed
                                </span>
                                <span style={{ color: '#dc3545' }}>
                                  ❌ {userSubmissions.filter(s => !s.passed).length} Failed
                                </span>
                              </div>
                            </div>
                            
                            <div style={{ 
                              display: 'grid', 
                              gap: '15px'
                            }}>
                              {userSubmissions.map((submission, submissionIndex) => (
                                <div key={submission.id || submissionIndex} style={{
                                  border: `2px solid ${submission.passed ? '#28a745' : '#dc3545'}`,
                                  borderRadius: '12px',
                                  padding: '18px',
                                  backgroundColor: submission.passed ? '#d4edda' : '#f8d7da',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ 
                                      fontWeight: '700', 
                                      marginBottom: '6px',
                                      color: submission.passed ? '#155724' : '#721c24',
                                      fontSize: '15px'
                                    }}>
                                      {submission.testType || 'Test'} - {submission.problemTitle || submission.problemStatement?.substring(0, 50) || 'Problem'}
                                      {submission.problemStatement && submission.problemStatement.length > 50 && '...'}
                                    </div>
                                    <div style={{ 
                                      fontSize: '13px', 
                                      color: submission.passed ? '#155724' : '#721c24',
                                      opacity: 0.8,
                                      display: 'flex',
                                      gap: '15px',
                                      alignItems: 'center'
                                    }}>
                                      <span>📅 {new Date(submission.submittedAt || submission.timestamp).toLocaleString()}</span>
                                      {submission.timeSpent && (
                                        <span>⏱️ {Math.round(submission.timeSpent / 60)} min</span>
                                      )}
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{
                                      padding: '6px 16px',
                                      borderRadius: '25px',
                                      fontSize: '12px',
                                      fontWeight: '700',
                                      backgroundColor: submission.passed ? '#28a745' : '#dc3545',
                                      color: 'white',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }}>
                                      {submission.passed ? '✅ PASSED' : '❌ FAILED'}
                                    </span>
                                    <span style={{
                                      fontSize: '20px',
                                      fontWeight: 'bold',
                                      color: submission.passed ? '#28a745' : '#dc3545',
                                      minWidth: '50px',
                                      textAlign: 'right'
                                    }}>
                                      {submission.score || 0}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'submissions' && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2>Submissions ({getFilteredSubmissions().length} / {testResults.length})</h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                  value={submissionFilter}
                  onChange={(e) => setSubmissionFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="all">All Submissions</option>
                  <option value="passed">Passed (≥60%)</option>
                  <option value="failed">Failed (&lt;60%)</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                </select>
                <button
                  onClick={() => fetchRealTimeData()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '8px'
                  }}
                  disabled={loading}
                >
                  {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
                </button>
                <button
                  onClick={() => {
                    // Clear localStorage and refresh
                    localStorage.removeItem('all_submissions');
                    fetchRealTimeData();
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🧹 Clear Cache
                </button>
              </div>
            </div>
            
            {(() => {
              const filteredSubmissions = getFilteredSubmissions();
              return filteredSubmissions.length > 0 && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '16px', 
                  marginBottom: '20px' 
                }}>
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                      {filteredSubmissions.length}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {submissionFilter === 'all' ? 'Total Submissions' : 'Filtered Results'}
                    </div>
                  </div>
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#e8f5e8',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                      {filteredSubmissions.filter(r => {
                        const score = r.score || 0;
                        const total = r.total_questions || r.totalQuestions || 30;
                        return (score / total) >= 0.6;
                      }).length}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Passed</div>
                  </div>
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#fce4ec',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c2185b' }}>
                      {filteredSubmissions.filter(r => {
                        const score = r.score || 0;
                        const total = r.total_questions || r.totalQuestions || 30;
                        return (score / total) < 0.6;
                      }).length}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Failed</div>
                  </div>
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#fff3e0',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
                      {filteredSubmissions.length > 0 
                        ? Math.round(filteredSubmissions.reduce((acc, r) => {
                            const score = r.score || 0;
                            const total = r.total_questions || r.totalQuestions || 30;
                            return acc + (score / total);
                          }, 0) / filteredSubmissions.length * 100)
                        : 0}%
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Average Score</div>
                  </div>
                </div>
              );
            })()}
            
            {(() => {
              const filteredSubmissions = getFilteredSubmissions();
              return filteredSubmissions.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                border: '2px dashed #dee2e6'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <h3 style={{ color: '#6c757d' }}>No Submissions Yet</h3>
                <p style={{ color: '#6c757d', margin: '0' }}>
                  Test submissions will appear here in real-time as students complete tests
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Student</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Test Details</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Score</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Result</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map(result => {
                      // Handle multiple data formats: Supabase submission_csv_with_users, regular Supabase, and localStorage
                      const studentName = result.user_name || result.userName || result.display_name || result.displayName || result.name || 'Unknown Student';
                      const studentEmail = result.user_email || result.userEmail || result.email || '';
                      const testType = result.test_type || result.testType || result.problemTitle || 'Aptitude Test';
                      const score = result.score || 0;
                      const totalQuestions = result.total_questions || result.totalQuestions || 30;
                      const percentage = Math.round((score / totalQuestions) * 100);
                      const passed = percentage >= 60;
                      const submittedTime = result.submitted_at || result.submittedAt || result.timestamp;
                      const status = result.status || 'completed';
                      
                      return (
                        <tr key={result.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                          <td style={{ padding: '12px' }}>
                            <div>
                              <strong>{studentName}</strong>
                              {studentEmail && (
                                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                  {studentEmail}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div>
                              <strong>{testType}</strong>
                              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                {score}/{totalQuestions} questions
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div>
                              <strong style={{ 
                                color: passed ? '#28a745' : '#dc3545' 
                              }}>
                                {percentage}%
                              </strong>
                              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                {score} correct
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ 
                              padding: '4px 8px', 
                              borderRadius: '4px', 
                              backgroundColor: passed ? '#d4edda' : '#f8d7da',
                              color: passed ? '#155724' : '#721c24',
                              fontSize: '12px',
                              textTransform: 'capitalize'
                            }}>
                              {passed ? 'Passed' : 'Failed'}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div>
                              <strong>{formatLastSeen(submittedTime)}</strong>
                              {result.time_taken && (
                                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                  {Math.floor(result.time_taken / 60)}m {result.time_taken % 60}s
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
            })()}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div>
            <h2>🏆 Student Leaderboard</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Top performing students based on assessment scores and completion rates
            </p>
            
            <div style={{
              background: 'white',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                color: 'white',
                padding: '15px 20px',
                fontWeight: 'bold'
              }}>
                Student Rankings
              </div>
              
              <div style={{ padding: '0' }}>
                {calculateLeaderboard().length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px', 
                    color: '#6c757d'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
                    <h3>No Rankings Available</h3>
                    <p style={{ margin: '0' }}>
                      Student rankings will appear here once assessments are completed
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #dee2e6', backgroundColor: '#f8f9fa' }}>
                          <th style={{ padding: '12px', textAlign: 'left' }}>Rank</th>
                          <th style={{ padding: '12px', textAlign: 'left' }}>Student</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Score</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Tests Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculateLeaderboard().map((student, index) => (
                          <tr key={student.id} style={{ 
                            borderBottom: '1px solid #dee2e6',
                            backgroundColor: student.isPlaceholder ? '#f8f9fa' : (index < 3 ? '#fff3cd' : 'white'),
                            opacity: student.isPlaceholder ? 0.7 : 1
                          }}>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ 
                                  fontWeight: 'bold',
                                  color: student.isPlaceholder ? '#666' : '#333'
                                }}>
                                  {student.isPlaceholder ? '-' : `#${index + 1}`}
                                </span>
                                {!student.isPlaceholder && index === 0 && <span>🥇</span>}
                                {!student.isPlaceholder && index === 1 && <span>🥈</span>}
                                {!student.isPlaceholder && index === 2 && <span>🥉</span>}
                              </div>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  backgroundColor: student.isPlaceholder ? '#6c757d' : '#007bff',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: student.avatar?.length > 1 ? '18px' : '14px',
                                  fontWeight: 'bold'
                                }}>
                                  {student.avatar}
                                </div>
                                <div>
                                  <div style={{ 
                                    fontWeight: '500',
                                    color: student.isPlaceholder ? '#666' : '#333'
                                  }}>
                                    {student.name}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#666' }}>{student.email}</div>
                                  {!student.isPlaceholder && student.lastSubmission && (
                                    <div style={{ fontSize: '11px', color: '#999' }}>
                                      Last: {new Date(student.lastSubmission).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              {student.isPlaceholder ? (
                                <span style={{ color: '#666', fontSize: '14px' }}>-</span>
                              ) : (
                                <div>
                                  <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    backgroundColor: '#e3f2fd',
                                    color: '#1976d2',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                  }}>
                                    {student.score.toLocaleString()}
                                  </span>
                                  {student.averageScore && (
                                    <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                                      Avg: {student.averageScore}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <span style={{ 
                                color: student.isPlaceholder ? '#666' : '#333'
                              }}>
                                {student.isPlaceholder ? '-' : student.testsCompleted}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'job-posting' && (
          <div>
            <h2>💼 Job Posting Management</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Post job opportunities for students and manage existing postings
            </p>
            
            {/* New Job Form */}
            <div style={{
              background: 'white',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              marginBottom: '20px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                color: 'white',
                padding: '15px 20px',
                fontWeight: 'bold'
              }}>
                Post New Job Opportunity
              </div>
              
              <form onSubmit={handleJobSubmit} style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Company Name *</label>
                    <input
                      type="text"
                      required
                      value={newJobForm.company}
                      onChange={(e) => handleJobInputChange('company', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Position Title *</label>
                    <input
                      type="text"
                      required
                      value={newJobForm.position}
                      onChange={(e) => handleJobInputChange('position', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      placeholder="Enter position title"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Location *</label>
                    <input
                      type="text"
                      required
                      value={newJobForm.location}
                      onChange={(e) => handleJobInputChange('location', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      placeholder="Enter location"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Job Type *</label>
                    <select
                      required
                      value={newJobForm.type}
                      onChange={(e) => handleJobInputChange('type', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Internship">Internship</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Salary Range *</label>
                    <input
                      type="text"
                      required
                      value={newJobForm.salary}
                      onChange={(e) => handleJobInputChange('salary', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      placeholder="e.g. $50,000 - $70,000"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Job Description *</label>
                  <textarea
                    required
                    value={newJobForm.description}
                    onChange={(e) => handleJobInputChange('description', e.target.value)}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="Describe the role, responsibilities, and company culture"
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Requirements *</label>
                  <textarea
                    required
                    value={newJobForm.requirements}
                    onChange={(e) => handleJobInputChange('requirements', e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="List required skills, experience, and qualifications"
                  />
                </div>

                <button 
                  type="submit" 
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  📝 Post Job
                </button>
              </form>
            </div>

            {/* Existing Job Postings */}
            <div style={{
              background: 'white',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                color: 'white',
                padding: '15px 20px',
                fontWeight: 'bold'
              }}>
                Current Job Postings ({jobPostings.length})
              </div>
              
              <div style={{ padding: jobPostings.length === 0 ? '40px' : '0' }}>
                {jobPostings.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#6c757d'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
                    <h3>No Job Postings Yet</h3>
                    <p style={{ margin: '0' }}>
                      Create your first job posting using the form above
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '15px', padding: '20px' }}>
                    {jobPostings.map((job) => (
                      <div key={job.id} style={{
                        border: '1px solid #e9ecef',
                        borderRadius: '6px',
                        padding: '15px',
                        backgroundColor: '#f8f9fa'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 5px 0', color: '#007bff' }}>{job.position}</h4>
                            <p style={{ margin: '0 0 5px 0', fontWeight: '500' }}>{job.company}</p>
                            <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#666' }}>
                              <span>📍 {job.location}</span>
                              <span>💰 {job.salary}</span>
                              <span>🕒 {job.type}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => deleteJobPosting(job.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                        <p style={{ margin: '10px 0', fontSize: '14px', lineHeight: '1.4' }}>
                          {job.description.substring(0, 200)}{job.description.length > 200 ? '...' : ''}
                        </p>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                          Posted by {job.postedBy} on {new Date(job.postedDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'csv-reports' && (
          <CSVReportsSection 
            csvData={csvData}
            csvStats={csvStats}
            recentSubmissions={recentSubmissions}
            searchCriteria={searchCriteria}
            csvLoading={csvLoading}
            onSearch={handleCSVSearch}
            onDownload={handleCSVDownload}
            onRefresh={handleCSVRefresh}
            setSearchCriteria={setSearchCriteria}
          />
        )}

        {/* Debug Panel */}
        {activeTab === 'debug' && (
          <div>
            <h2>🔧 Debug Information & Troubleshooting</h2>
            
            {/* Authentication Debug */}
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#e8f4fd', 
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #0084d6'
            }}>
              <h3>🔑 Authentication Status</h3>
              <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                <div><strong>Current User:</strong> {JSON.stringify(currentUser, null, 2)}</div>
                <div><strong>User Role:</strong> {currentUser?.role || 'undefined'}</div>
                <div><strong>Is Admin:</strong> {currentUser?.role === 'admin' || currentUser?.role === 'super_admin' ? 'Yes' : 'No'}</div>
              </div>
            </div>
            
            {/* Data State Debug */}
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f0f8e8', 
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #28a745'
            }}>
              <h3>📊 Data State</h3>
              <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                <div><strong>Students Count:</strong> {students.length}</div>
                <div><strong>Active Users Count:</strong> {activeUsers.length}</div>
                <div><strong>Submissions Count:</strong> {testResults.length}</div>
                <div><strong>Real-time Status:</strong> {realTimeStatus}</div>
                <div><strong>Loading State:</strong> {loading ? 'true' : 'false'}</div>
                <div><strong>Error:</strong> {error || 'none'}</div>
                <div><strong>Filter State:</strong> {submissionFilter}</div>
                <div><strong>Filtered Submissions:</strong> {getFilteredSubmissions().length}</div>
              </div>
            </div>
            
            {/* Supabase Connection Debug */}
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#fff8e8', 
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #ff9800'
            }}>
              <h3>🔗 Supabase Connection Test</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                <button
                  onClick={testSupabaseSubmissions}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  🧪 Test Supabase Connection
                </button>
                
                <button
                  onClick={() => {
                    console.log('[CLEANUP] Clearing all localStorage test data...');
                    localStorage.removeItem('all_submissions');
                    localStorage.removeItem('test_results');
                    localStorage.removeItem('admin_submissions');
                    localStorage.removeItem('admin_csv_data');
                    console.log('[SUCCESS] localStorage cleared, refreshing dashboard...');
                    fetchRealTimeData();
                    alert('Cleared all test data! Dashboard will now show only real submissions from submission_csv_with_users table.');
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  🧹 Clear Test Data
                </button>
                
                <button
                  onClick={() => fetchRealTimeData()}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Refresh Data
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      const { data: { user } } = await supabase.auth.getUser();
                      console.log('🔐 Current Supabase session:', session);
                      console.log('🔐 Current Supabase user:', user);
                      alert(`Session: ${session ? 'Active' : 'None'}\nUser: ${user?.email || 'Not authenticated'}\nRole: ${user?.user_metadata?.role || 'Not set'}`);
                    } catch (error) {
                      console.error('Auth check error:', error);
                      alert('Error checking auth: ' + error.message);
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6f42c1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  🔐 Check Supabase Auth
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      console.log('[TEST] Testing direct submission_csv_with_users query...');
                      const { data: directQuery, error: directError } = await supabase
                        .from('submission_csv_with_users')
                        .select('*')
                        .limit(5);
                      
                      if (directError) {
                        console.error('Direct query error:', directError);
                        alert('Direct query failed: ' + directError.message);
                      } else {
                        console.log('Direct query success:', directQuery);
                        alert(`Direct query success: Found ${directQuery.length} submissions from submission_csv_with_users`);
                        if (directQuery.length > 0) {
                          console.log('Sample submission from submission_csv_with_users:', directQuery[0]);
                          console.log('Available fields:', Object.keys(directQuery[0]));
                          alert(`Sample fields available: ${Object.keys(directQuery[0]).join(', ')}`);
                        }
                      }
                    } catch (error) {
                      console.error('Direct query error:', error);
                      alert('Direct query failed: ' + error.message);
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  🔍 Test submission_csv_with_users
                </button>
              </div>
            </div>
            
            {/* Recent Submissions Debug */}
            {testResults.length > 0 && (
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#fce8f3', 
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #e91e63'
              }}>
                <h3>📋 Sample Submission Data</h3>
                <pre style={{ 
                  backgroundColor: '#fff', 
                  padding: '15px', 
                  borderRadius: '4px', 
                  overflow: 'auto',
                  fontSize: '12px',
                  maxHeight: '400px'
                }}>
                  {JSON.stringify(testResults[0], null, 2)}
                </pre>
              </div>
            )}
            
            {/* localStorage Debug */}
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f8f4ff', 
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #8b5cf6'
            }}>
              <h3>💾 localStorage Debug</h3>
              <div style={{ fontFamily: 'monospace', fontSize: '14px', marginBottom: '15px' }}>
                <div><strong>all_submissions length:</strong> {JSON.parse(localStorage.getItem('all_submissions') || '[]').length}</div>
              </div>
              <button
                onClick={() => {
                  const data = localStorage.getItem('all_submissions');
                  console.log('localStorage all_submissions:', JSON.parse(data || '[]'));
                  alert(`localStorage has ${JSON.parse(data || '[]').length} submissions`);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                📦 Check localStorage
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('all_submissions');
                  alert('localStorage cleared');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🗑️ Clear localStorage
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// CSV Reports Component
const CSVReportsSection = ({ 
  csvData, 
  csvStats, 
  recentSubmissions, 
  searchCriteria, 
  csvLoading,
  onSearch, 
  onDownload, 
  onRefresh,
  setSearchCriteria 
}) => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📊 CSV Reports & Data Export</h2>
        <div>
          <button 
            onClick={onRefresh} 
            disabled={csvLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: csvLoading ? 'not-allowed' : 'pointer',
              marginRight: '10px'
            }}
          >
            {csvLoading ? '🔄 Refreshing...' : '🔄 Refresh Data'}
          </button>
          <button 
            onClick={() => onDownload()}
            disabled={csvLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: csvLoading ? 'not-allowed' : 'pointer'
            }}
          >
            📥 Download Full CSV
          </button>
        </div>
      </div>

      {/* CSV Report Information */}
      <div style={{ 
        background: '#ffffff', 
        padding: '25px', 
        borderRadius: '12px', 
        marginBottom: '25px',
        border: '2px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#212529', fontSize: '18px', fontWeight: '600' }}>📋 Comprehensive Submission Report</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', fontSize: '14px' }}>
          <div style={{ 
            padding: '15px', 
            background: '#f8f9fa', 
            borderRadius: '8px', 
            border: '1px solid #e9ecef'
          }}>
            <strong style={{ color: '#495057', fontSize: '15px' }}>👤 Student Information:</strong>
            <ul style={{ margin: '8px 0 0 20px', color: '#6c757d', lineHeight: '1.6' }}>
              <li>Student Name & Email</li>
              <li>Session ID & Timestamps</li>
              <li>Test Type & Version</li>
            </ul>
          </div>
          <div style={{ 
            padding: '15px', 
            background: '#f8f9fa', 
            borderRadius: '8px', 
            border: '1px solid #e9ecef'
          }}>
            <strong style={{ color: '#495057', fontSize: '15px' }}>📊 Performance Data:</strong>
            <ul style={{ margin: '8px 0 0 20px', color: '#6c757d', lineHeight: '1.6' }}>
              <li>Score, Percentage, Time Spent</li>
              <li>Question-by-question answers</li>
              <li>Individual question timing</li>
            </ul>
          </div>
          <div style={{ 
            padding: '15px', 
            background: '#f8f9fa', 
            borderRadius: '8px', 
            border: '1px solid #e9ecef'
          }}>
            <strong style={{ color: '#495057', fontSize: '15px' }}>💻 Device & Environment:</strong>
            <ul style={{ margin: '8px 0 0 20px', color: '#6c757d', lineHeight: '1.6' }}>
              <li>Device Type (Mobile/Desktop/Tablet)</li>
              <li>Browser & Operating System</li>
              <li>Screen Resolution & User Agent</li>
            </ul>
          </div>
          <div style={{ 
            padding: '15px', 
            background: '#f8f9fa', 
            borderRadius: '8px', 
            border: '1px solid #e9ecef'
          }}>
            <strong style={{ color: '#495057', fontSize: '15px' }}>🔒 Security & Proctoring:</strong>
            <ul style={{ margin: '8px 0 0 20px', color: '#6c757d', lineHeight: '1.6' }}>
              <li>Violation counts & details</li>
              <li>Security assessment & trust score</li>
              <li>Proctoring event timeline</li>
            </ul>
          </div>
        </div>
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#d1ecf1', 
          borderRadius: '8px', 
          fontSize: '14px', 
          color: '#0c5460',
          border: '1px solid #bee5eb'
        }}>
          💡 <strong>Total Columns:</strong> 45+ data points per submission including detailed JSON analysis for comprehensive reporting
        </div>
      </div>

      {/* Statistics Cards */}
      {csvStats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          <div style={{
            background: '#007bff',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,123,255,0.2)',
            border: '1px solid #0056b3'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{csvStats.totalSubmissions}</h3>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>Total Submissions</p>
          </div>
          <div style={{
            background: '#28a745',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(40,167,69,0.2)',
            border: '1px solid #1e7e34'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{csvStats.averageScore}%</h3>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>Average Score</p>
          </div>
          <div style={{
            background: '#dc3545',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(220,53,69,0.2)',
            border: '1px solid #c82333'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{csvStats.totalViolations}</h3>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>Total Violations</p>
          </div>
          <div style={{
            background: '#17a2b8',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(23,162,184,0.2)',
            border: '1px solid #117a8b'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              {csvStats.realTimeStatus === 'Active' ? '🟢 Active' : '🔴 Inactive'}
            </h3>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>Real-time Status</p>
          </div>
        </div>
      )}

      {/* Search Filters */}
      <div style={{
        background: '#ffffff',
        padding: '25px',
        borderRadius: '10px',
        marginBottom: '20px',
        border: '2px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#212529', fontSize: '18px', fontWeight: '600' }}>🔍 Filter & Export Options</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Student Name:</label>
            <input
              type="text"
              value={searchCriteria.searchText}
              onChange={(e) => setSearchCriteria({...searchCriteria, searchText: e.target.value})}
              placeholder="Search by student name or email..."
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                borderRadius: '6px', 
                border: '2px solid #ced4da',
                fontSize: '14px',
                color: '#495057',
                backgroundColor: '#fff',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#ced4da'}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Start Date:</label>
            <input
              type="date"
              value={searchCriteria.startDate}
              onChange={(e) => setSearchCriteria({...searchCriteria, startDate: e.target.value})}
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                borderRadius: '6px', 
                border: '2px solid #ced4da',
                fontSize: '14px',
                color: '#495057',
                backgroundColor: '#fff'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057', fontSize: '14px' }}>End Date:</label>
            <input
              type="date"
              value={searchCriteria.endDate}
              onChange={(e) => setSearchCriteria({...searchCriteria, endDate: e.target.value})}
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                borderRadius: '6px', 
                border: '2px solid #ced4da',
                fontSize: '14px',
                color: '#495057',
                backgroundColor: '#fff'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Min Score:</label>
            <input
              type="number"
              min="0"
              max="30"
              value={searchCriteria.minScore}
              onChange={(e) => setSearchCriteria({...searchCriteria, minScore: e.target.value})}
              placeholder="0"
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                borderRadius: '6px', 
                border: '2px solid #ced4da',
                fontSize: '14px',
                color: '#495057',
                backgroundColor: '#fff'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Max Score:</label>
            <input
              type="number"
              min="0"
              max="30"
              value={searchCriteria.maxScore}
              onChange={(e) => setSearchCriteria({...searchCriteria, maxScore: e.target.value})}
              placeholder="30"
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                borderRadius: '6px', 
                border: '2px solid #ced4da',
                fontSize: '14px',
                color: '#495057',
                backgroundColor: '#fff'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Device Type:</label>
            <select
              value={searchCriteria.deviceType}
              onChange={(e) => setSearchCriteria({...searchCriteria, deviceType: e.target.value})}
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                borderRadius: '6px', 
                border: '2px solid #ced4da',
                fontSize: '14px',
                color: '#495057',
                backgroundColor: '#fff'
              }}
            >
              <option value="">All Devices</option>
              <option value="Desktop">Desktop</option>
              <option value="Mobile">Mobile</option>
              <option value="Tablet">Tablet</option>
            </select>
          </div>
        </div>
        <div style={{ 
          marginTop: '20px', 
          display: 'flex', 
          gap: '15px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <button
            onClick={() => onSearch(searchCriteria)}
            disabled={csvLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: csvLoading ? '#6c757d' : '#17a2b8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: csvLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              minWidth: '160px',
              justifyContent: 'center'
            }}
          >
            🔍 Search & Preview
          </button>
          <button
            onClick={() => onDownload(searchCriteria)}
            disabled={csvLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: csvLoading ? '#6c757d' : '#28a745',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: csvLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              minWidth: '180px',
              justifyContent: 'center'
            }}
          >
            📥 Export Filtered CSV
          </button>
        </div>
      </div>

      {/* Recent Submissions Preview */}
      <div style={{
        background: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '10px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          background: '#007bff', 
          color: 'white', 
          padding: '15px 20px',
          fontWeight: 'bold'
        }}>
          📋 All Submissions
        </div>
        {csvLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div>🔄 Loading submission data...</div>
          </div>
        ) : recentSubmissions.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
              Showing all {recentSubmissions.length} submissions
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <tr>
                  <th style={{ 
                    padding: '16px 12px', 
                    textAlign: 'left', 
                    fontWeight: '600', 
                    color: '#212529',
                    fontSize: '14px',
                    borderRight: '1px solid #dee2e6'
                  }}>Student Name</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    textAlign: 'left', 
                    fontWeight: '600', 
                    color: '#212529',
                    fontSize: '14px',
                    borderRight: '1px solid #dee2e6'
                  }}>Email</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    textAlign: 'left', 
                    fontWeight: '600', 
                    color: '#212529',
                    fontSize: '14px',
                    borderRight: '1px solid #dee2e6'
                  }}>Score</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    textAlign: 'left', 
                    fontWeight: '600', 
                    color: '#212529',
                    fontSize: '14px',
                    borderRight: '1px solid #dee2e6'
                  }}>Percentage</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    textAlign: 'left', 
                    fontWeight: '600', 
                    color: '#212529',
                    fontSize: '14px',
                    borderRight: '1px solid #dee2e6'
                  }}>Device</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    textAlign: 'left', 
                    fontWeight: '600', 
                    color: '#212529',
                    fontSize: '14px',
                    borderRight: '1px solid #dee2e6'
                  }}>Violations</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    textAlign: 'left', 
                    fontWeight: '600', 
                    color: '#212529',
                    fontSize: '14px'
                  }}>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.map((submission, index) => (
                  <tr key={index} style={{ 
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#e3f2fd'}
                  onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa'}
                  >
                    <td style={{ padding: '14px 12px', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: '#007bff',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          border: '2px solid #0056b3'
                        }}>
                          {(submission.userName || submission.displayName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: '500', color: '#212529', fontSize: '14px' }}>
                          {submission.userName || submission.displayName || 'Anonymous User'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6' }}>
                      <span style={{ color: '#6c757d', fontSize: '13px' }}>
                        {submission.userEmail || submission.email || 'No email provided'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6' }}>
                      <span style={{ 
                        color: submission.score >= 24 ? '#28a745' : submission.score >= 18 ? '#fd7e14' : '#dc3545',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}>
                        {submission.score}/30
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6' }}>
                      <span style={{ 
                        color: '#212529', 
                        fontWeight: '500',
                        fontSize: '14px'
                      }}>
                        {submission.percentage}%
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6' }}>
                      <span style={{
                        background: submission.deviceType === 'Desktop' ? '#007bff' : 
                                   submission.deviceType === 'Mobile' ? '#28a745' : '#fd7e14',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '14px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {submission.deviceType || 'Unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6' }}>
                      <span style={{
                        color: submission.totalViolations > 0 ? '#dc3545' : '#28a745',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}>
                        {submission.totalViolations || 0}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', borderBottom: '1px solid #dee2e6', fontSize: '12px', color: '#6c757d' }}>
                      {new Date(submission.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
            📭 No submissions found. Data will appear here when users complete tests.
          </div>
        )}
      </div>

      {csvData && (
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#6c757d', textAlign: 'center' }}>
          CSV last updated: {csvData.lastUpdated ? new Date(csvData.lastUpdated).toLocaleString() : 'Never'}
          <br />
          Total records available: {csvData.totalSubmissions || 0}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
