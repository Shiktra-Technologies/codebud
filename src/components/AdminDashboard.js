import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import { isUserActive, formatLastSeen, getUserStats } from '../utils/userActivity';
import { subscribeToUserActivity, subscribeToSubmissions, getAllSubmissions } from '../services/firestoreService';
import './AdminDashboard.css';
import './ActivityStyles.css';

const AdminDashboard = () => {
  const { currentUser, userRole, isAdmin, isSuperAdmin, getAllUsers, isOnline } = useSimpleAuth();
  const [students, setStudents] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  // Set up real-time listeners for user activity and test submissions
  useEffect(() => {
    if (!isAdmin() && !isSuperAdmin()) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }

    if (!realTimeEnabled) {
      return;
    }

    console.log('📡 Setting up real-time listeners...');

    // Subscribe to user activity changes
    const unsubscribeUsers = subscribeToUserActivity((users) => {
      console.log('✅ Real-time update: Users changed', users.length);
      const realStudents = users.filter(user => user.role === 'student');
      
      const studentsWithStats = realStudents.map(student => ({
        ...student,
        id: student.uid,
        lastActive: student.lastLogin,
        testsCompleted: testResults.filter(result => result.userId === student.uid).length,
        status: student.status || 'active',
        isOnline: isUserActive(student.lastLogin),
        lastSeenFormatted: formatLastSeen(student.lastLogin)
      }));

      setStudents(studentsWithStats);
      setLoading(false);
    });

    // Subscribe to test submissions changes
    const unsubscribeSubmissions = subscribeToSubmissions((submissions) => {
      console.log('✅ Real-time update: Submissions changed', submissions.length);
      setTestResults(submissions);
    });

    // Cleanup listeners on unmount
    return () => {
      console.log('🔌 Disconnecting real-time listeners');
      unsubscribeUsers();
      unsubscribeSubmissions();
    };
  }, [isAdmin, isSuperAdmin, realTimeEnabled]);

  // Initial data load (fallback if real-time fails)
  useEffect(() => {
    if (!isAdmin() && !isSuperAdmin()) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }

    fetchData();
  }, [isAdmin, isSuperAdmin]);

  // Refresh function to get latest user data
  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Get fresh data from Firestore (with localStorage fallback)
      const allUsers = await getAllUsers();
      const realStudents = allUsers.filter(user => user.role === 'student');
      
      // Get submissions from Firestore
      const submissionsResult = await getAllSubmissions();
      const testResultsData = submissionsResult.data || [];

      const studentsWithStats = realStudents.map(student => ({
        ...student,
        id: student.uid,
        lastActive: student.lastLogin,
        testsCompleted: testResultsData.filter(result => result.userId === student.uid).length,
        status: student.status || 'active',
        isOnline: isUserActive(student.lastLogin),
        lastSeenFormatted: formatLastSeen(student.lastLogin)
      }));

      setStudents(studentsWithStats);
      setTestResults(testResultsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (userId) => {
    const student = students.find(s => s.uid === userId);
    return student?.displayName || student?.email || 'Unknown Student';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTestTypeDisplay = (testType) => {
    switch (testType) {
      case 'dsa': return 'DSA Problem';
      case 'aptitude': return 'Aptitude Test';
      default: return testType;
    }
  };

  const calculateStats = () => {
    const userStats = getUserStats(students.map(s => ({ ...s, role: 'student' })));
    const totalSubmissions = testResults.length;
    const passedTests = testResults.filter(result => result.passed).length;
    const violationSubmissions = testResults.filter(result => 
      result.violations?.submittedDueToViolation
    ).length;

    return {
      totalStudents: students.length,
      activeStudents: students.filter(s => s.isOnline).length,
      totalSubmissions,
      passedTests,
      violationSubmissions,
      passRate: totalSubmissions > 0 ? Math.round((passedTests / totalSubmissions) * 100) : 0
    };
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Access Denied</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  // Filter students and results based on search term
  const filteredStudents = students.filter(student =>
    student.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredResults = testResults.filter(result => {
    const studentName = getStudentName(result.userId).toLowerCase();
    const testType = getTestTypeDisplay(result.testType).toLowerCase();
    const search = searchTerm.toLowerCase();
    return studentName.includes(search) || testType.includes(search);
  });

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-header-info">
          <p>Welcome back, {currentUser?.displayName || currentUser?.email || 'Admin'}</p>
          <div className="connection-status">
            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
            <span className="status-text">{isOnline ? '🌐 Online' : '📡 Offline'}</span>
            {realTimeEnabled && isOnline && <span className="realtime-badge">🔄 Real-time</span>}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalStudents}</h3>
            <p>Total Students</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <h3>{stats.activeStudents}</h3>
            <p>Active Now</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{stats.totalSubmissions}</h3>
            <p>Total Submissions</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.passedTests}</h3>
            <p>Passed Tests</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <h3>{stats.violationSubmissions}</h3>
            <p>Violation Submissions</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search students or results..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <span className="tab-icon">👥</span>
          Active Students ({filteredStudents.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          <span className="tab-icon">📊</span>
          Test Results ({filteredResults.length})
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === 'students' && (
          <div className="students-section">
            <h2>Active Students</h2>
            {filteredStudents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No students found</h3>
                <p>No students match your search criteria.</p>
              </div>
            ) : (
              <div className="students-grid">
                {filteredStudents.map(student => (
                  <div key={student.uid} className="student-card">
                    <div className="student-info">
                      <div className="student-avatar">
                        {student.photoURL ? (
                          <img src={student.photoURL} alt="Avatar" />
                        ) : (
                          <div className="avatar-placeholder">
                            {(student.displayName || student.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="student-details">
                        <div className="student-header">
                          <h3>{student.displayName || 'No name'}</h3>
                          <div className={`activity-indicator ${student.isOnline ? 'online' : 'offline'}`}>
                            <span className="status-dot"></span>
                            <span className="status-text">
                              {student.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </div>
                        <p className="student-email">{student.email}</p>
                        <div className="student-meta">
                          <span className="join-date">
                            Joined: {formatDate(student.createdAt)}
                          </span>
                          <span className="last-login">
                            Last seen: {student.lastSeenFormatted}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="student-stats">
                      <div className="stat-item">
                        <span className="stat-value">
                          {testResults.filter(r => r.userId === student.uid).length}
                        </span>
                        <span className="stat-label">Tests Taken</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">
                          {testResults.filter(r => r.userId === student.uid && r.passed).length}
                        </span>
                        <span className="stat-label">Passed</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="results-section">
            <h2>Test Results</h2>
            {filteredResults.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>No test results found</h3>
                <p>No test results match your search criteria.</p>
              </div>
            ) : (
              <div className="results-table-container">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Test Type</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Violations</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map(result => (
                      <tr key={result.id} className={result.passed ? 'passed' : 'failed'}>
                        <td>
                          <div className="student-info-compact">
                            <strong>{getStudentName(result.userId)}</strong>
                          </div>
                        </td>
                        <td>
                          <span className="test-type-badge">
                            {getTestTypeDisplay(result.testType)}
                          </span>
                        </td>
                        <td>
                          <span className="score">
                            {result.testType === 'aptitude' 
                              ? `${result.score}/${result.totalQuestions} (${result.percentage}%)`
                              : result.solved ? 'Solved' : 'Not Solved'
                            }
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${result.passed ? 'passed' : 'failed'}`}>
                            {result.passed ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td>
                          <div className="violations-info">
                            <span className={`violation-count ${result.violations?.count > 0 ? 'has-violations' : ''}`}>
                              {result.violations?.count || 0}
                            </span>
                            {result.violations?.submittedDueToViolation && (
                              <span className="auto-submit-badge">Auto-Submitted</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="submit-date">
                            {formatDate(result.submittedAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="dashboard-actions">
        <button onClick={fetchData} className="refresh-button" disabled={loading}>
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
