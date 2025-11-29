import React, { useState, useEffect, useCallback } from 'react';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import { isUserActive, formatLastSeen } from '../utils/userActivity';
import realTimeService from '../services/realTimeService';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { currentUser, getAllUsers } = useSimpleAuth();
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Real-time data states
  const [students, setStudents] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [realTimeStatus, setRealTimeStatus] = useState('connecting');

  console.log('AdminDashboard render - Real-time mode:', { 
    studentsCount: students.length,
    activeUsersCount: activeUsers.length,
    submissionsCount: testResults.length,
    status: realTimeStatus
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

  // Real-time data fetching
  const fetchRealTimeData = useCallback(async () => {
    try {
      console.log('🔄 Fetching real-time data...');
      
      // Fetch real users
      let realUsers = [];
      try {
        realUsers = await getAllUsers();
      } catch (error) {
        console.warn('Could not fetch users from Firebase:', error);
      }

      // Process students
      if (realUsers && realUsers.length > 0) {
        const studentUsers = realUsers
          .filter(user => user.role === 'student' || !user.role) // Include users without role as potential students
          .map(student => ({
            ...student,
            id: student.uid || student.id,
            testsCompleted: 0, // TODO: Calculate from submissions
            isOnline: isUserActive(student.lastLogin || student.lastActive),
            lastSeenFormatted: formatLastSeen(student.lastLogin || student.lastActive)
          }));
        
        setStudents(studentUsers);
        
        // Filter active users (online in last 5 minutes)
        const currentlyActive = studentUsers
          .filter(user => user.isOnline)
          .map(user => ({
            ...user,
            uid: user.uid || user.id,
            currentActivity: user.currentActivity || 'Browsing platform',
            lastSeen: user.lastLogin || user.lastActive || new Date().toISOString()
          }));
          
        setActiveUsers(currentlyActive);
      }

      // Get submissions from localStorage (real-time submissions)
      const storedSubmissions = JSON.parse(localStorage.getItem('test_results') || '[]');
      if (storedSubmissions.length > 0) {
        setTestResults(storedSubmissions.slice(0, 50)); // Show last 50 submissions
      }

      // Get activity data from real-time service
      const activityData = realTimeService.getLatestData('submissions');
      if (activityData && activityData.length > 0) {
        setTestResults(prev => {
          const combined = [...activityData, ...prev];
          const unique = combined.filter((item, index, self) => 
            index === self.findIndex(t => t.id === item.id)
          );
          return unique.slice(0, 50);
        });
      }

      setRealTimeStatus('connected');
      setLoading(false);
      
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      setError('Failed to fetch real-time data');
      setRealTimeStatus('error');
      setLoading(false);
    }
  }, [getAllUsers]);

  // Initialize real-time subscriptions
  useEffect(() => {
    console.log('🚀 Initializing Real-Time Admin Dashboard');
    
    // Initial data fetch
    fetchRealTimeData();

    // Set up real-time subscriptions
    const unsubscribeSubmissions = realTimeService.subscribe('submissions', (payload) => {
      console.log('📋 Real-time submissions update:', payload);
      const data = Array.isArray(payload) ? payload : payload.data || [];
      if (data.length > 0) {
        setTestResults(data.slice(0, 50));
        setRealTimeStatus('connected');
      }
    }, { pollInterval: 2000 });

    const unsubscribeUsers = realTimeService.subscribe('activeUsers', (payload) => {
      console.log('👥 Real-time users update:', payload);
      const data = Array.isArray(payload) ? payload : payload.data || [];
      if (data.length > 0) {
        setActiveUsers(data);
        setRealTimeStatus('connected');
      }
    }, { pollInterval: 3000 });

    const unsubscribeActivity = realTimeService.subscribe('activities', (payload) => {
      console.log('📊 Real-time activity update:', payload);
      // Update user activity status
      fetchRealTimeData();
    }, { pollInterval: 5000 });

    // Track admin user activity
    if (currentUser) {
      realTimeService.trackUserActivity(currentUser.uid, 'admin dashboard');
    }

    // Cleanup subscriptions
    return () => {
      console.log('🧹 Cleaning up real-time subscriptions');
      unsubscribeSubmissions();
      unsubscribeUsers();
      unsubscribeActivity();
    };
  }, [currentUser, fetchRealTimeData]);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    setLoading(true);
    setRealTimeStatus('refreshing');
    fetchRealTimeData();
  }, [fetchRealTimeData]);

  // Show loading state while fetching initial data
  if (loading && students.length === 0) {
    return (
      <div className="admin-dashboard">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔄</div>
          <h2>Connecting to Real-Time Data...</h2>
          <p style={{ color: '#666' }}>Fetching live student activity and submissions</p>
          <div style={{
            width: '200px',
            height: '4px',
            backgroundColor: '#e0e0e0',
            borderRadius: '2px',
            margin: '20px auto',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#007bff',
              borderRadius: '2px',
              animation: 'loading 1.5s ease-in-out infinite'
            }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {error && (
        <div className="warning-banner">
          <div className="warning-content">
            <span className="warning-icon">⚠️</span>
            <span className="warning-text">{error}</span>
            <button className="warning-dismiss" onClick={() => setError('')}>✕</button>
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
                {realTimeStatus === 'connected' ? '🔄 Live Data' : 
                 realTimeStatus === 'connecting' ? '🔄 Connecting...' : 
                 realTimeStatus === 'refreshing' ? '🔄 Refreshing...' : '❌ Connection Error'}
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
              🔄 Refresh
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
                localStorage.setItem('test_results', JSON.stringify(existing.slice(0, 50)));
                
                // Trigger real-time update
                realTimeService.broadcastUpdate('submissions', [testSubmission, ...existing.slice(0, 50)]);
                
                console.log('🧪 Generated test submission:', testSubmission);
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
              🧪 Test Submission
            </button>
          </div>
        </div>
        <p style={{ color: '#28a745', fontSize: '14px', margin: '0' }}>
          📡 Real-time updates every 2-5 seconds • {students.length} students • {activeUsers.length} active • {testResults.length} submissions
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
            backgroundColor: activeTab === 'live-activity' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'live-activity' ? 'white' : 'black',
            border: '1px solid #dee2e6',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('live-activity')}
        >
          🔴 Live Activity
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
            <h2>Active Users & Their Submissions ({activeUsers.length})</h2>
            {activeUsers.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                border: '2px dashed #dee2e6'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🟢</div>
                <h3 style={{ color: '#6c757d' }}>No Active Users</h3>
                <p style={{ color: '#6c757d', margin: '0' }}>
                  Users who are currently online will appear here with their recent submissions
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {activeUsers.map(user => {
                  // Get user's recent submissions
                  const userSubmissions = testResults.filter(submission => 
                    submission.userId === user.uid || submission.studentEmail === user.email
                  ).slice(0, 5); // Show last 5 submissions

                  return (
                    <div key={user.uid} style={{ 
                      border: '1px solid #dee2e6', 
                      borderRadius: '12px', 
                      padding: '0',
                      backgroundColor: 'white',
                      overflow: 'hidden',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {/* User Header */}
                      <div style={{
                        background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                        color: 'white',
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px'
                      }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                          fontWeight: 'bold',
                          border: '3px solid rgba(255,255,255,0.3)'
                        }}>
                          {user.displayName?.charAt(0) || 'U'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>{user.displayName}</h3>
                          <p style={{ margin: '0 0 4px 0', opacity: 0.9, fontSize: '14px' }}>{user.email}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ 
                              backgroundColor: 'rgba(40, 167, 69, 0.9)', 
                              padding: '4px 12px', 
                              borderRadius: '20px', 
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              🟢 {user.currentActivity || 'Active'}
                            </span>
                            <span style={{ fontSize: '12px', opacity: 0.8 }}>
                              {formatLastSeen(user.lastSeen)}
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{userSubmissions.length}</div>
                          <div style={{ fontSize: '12px', opacity: 0.8 }}>Submissions</div>
                        </div>
                      </div>

                      {/* User Submissions */}
                      <div style={{ padding: '20px' }}>
                        {userSubmissions.length === 0 ? (
                          <div style={{ 
                            textAlign: 'center', 
                            padding: '30px',
                            color: '#6c757d',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '2px dashed #dee2e6'
                          }}>
                            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📝</div>
                            <p style={{ margin: '0', fontSize: '14px' }}>No submissions yet</p>
                          </div>
                        ) : (
                          <>
                            <h4 style={{ 
                              margin: '0 0 15px 0', 
                              color: '#495057',
                              fontSize: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              📊 Recent Submissions ({userSubmissions.length})
                            </h4>
                            <div style={{ 
                              display: 'grid', 
                              gap: '12px'
                            }}>
                              {userSubmissions.map((submission, index) => (
                                <div key={submission.id || index} style={{
                                  border: '1px solid #e9ecef',
                                  borderRadius: '8px',
                                  padding: '15px',
                                  backgroundColor: submission.passed ? '#d4edda' : '#f8d7da',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ 
                                      fontWeight: '600', 
                                      marginBottom: '4px',
                                      color: submission.passed ? '#155724' : '#721c24'
                                    }}>
                                      {submission.testType || 'Test'} - {submission.problemTitle || 'Problem'}
                                    </div>
                                    <div style={{ 
                                      fontSize: '12px', 
                                      color: submission.passed ? '#155724' : '#721c24',
                                      opacity: 0.8
                                    }}>
                                      {new Date(submission.submittedAt || submission.timestamp).toLocaleString()}
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{
                                      padding: '4px 12px',
                                      borderRadius: '20px',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      backgroundColor: submission.passed ? '#28a745' : '#dc3545',
                                      color: 'white'
                                    }}>
                                      {submission.passed ? '✅ Passed' : '❌ Failed'}
                                    </span>
                                    <span style={{
                                      fontSize: '18px',
                                      fontWeight: 'bold',
                                      color: submission.passed ? '#28a745' : '#dc3545'
                                    }}>
                                      {submission.score}%
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
            <h2>Recent Submissions ({testResults.length})</h2>
            {testResults.length === 0 ? (
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
                      <th style={{ padding: '12px', textAlign: 'left' }}>Student</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Test</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Score</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResults.map(result => (
                    <tr key={result.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px' }}>{result.userName}</td>
                      <td style={{ padding: '12px' }}>{result.problemTitle}</td>
                      <td style={{ padding: '12px' }}>{result.score}%</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          backgroundColor: result.passed ? '#d4edda' : '#f8d7da',
                          color: result.passed ? '#155724' : '#721c24',
                          fontSize: '12px'
                        }}>
                          {result.passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{formatLastSeen(result.submittedAt)}</td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'live-activity' && (
          <div>
            <h2>🔴 Live Activity Monitor</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Real-time view of active users and their latest submissions as they happen
            </p>
            
            {/* Live Stats Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '25px'
            }}>
              <div style={{
                padding: '20px',
                backgroundColor: '#e8f5e8',
                borderRadius: '10px',
                textAlign: 'center',
                border: '2px solid #28a745'
              }}>
                <div style={{ fontSize: '32px', color: '#28a745', fontWeight: 'bold' }}>
                  {activeUsers.length}
                </div>
                <div style={{ color: '#155724', fontWeight: '600' }}>Active Users</div>
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: '#fff3cd',
                borderRadius: '10px',
                textAlign: 'center',
                border: '2px solid #ffc107'
              }}>
                <div style={{ fontSize: '32px', color: '#e09900', fontWeight: 'bold' }}>
                  {testResults.filter(s => {
                    const submissionTime = new Date(s.submittedAt || s.timestamp);
                    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                    return submissionTime > fiveMinutesAgo;
                  }).length}
                </div>
                <div style={{ color: '#856404', fontWeight: '600' }}>Recent Submissions</div>
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: '#d1ecf1',
                borderRadius: '10px',
                textAlign: 'center',
                border: '2px solid #17a2b8'
              }}>
                <div style={{ fontSize: '32px', color: '#138496', fontWeight: 'bold' }}>
                  {Math.round((testResults.filter(s => s.passed).length / Math.max(testResults.length, 1)) * 100)}%
                </div>
                <div style={{ color: '#0c5460', fontWeight: '600' }}>Pass Rate</div>
              </div>
            </div>

            {/* Real-time Activity Stream */}
            <div style={{
              border: '2px solid #007bff',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: 'white'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                color: 'white',
                padding: '15px 20px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: '#28a745', 
                  borderRadius: '50%',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}></span>
                Live Activity Stream
              </div>
              
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {/* Combine active users and recent submissions */}
                {[...activeUsers.map(user => ({
                  type: 'user_active',
                  timestamp: user.lastSeen || Date.now(),
                  user,
                  id: `active_${user.uid}`
                })), ...testResults.slice(0, 10).map(submission => ({
                  type: 'submission',
                  timestamp: submission.submittedAt || submission.timestamp,
                  submission,
                  user: students.find(s => s.uid === submission.userId || s.email === submission.studentEmail),
                  id: submission.id || `sub_${Math.random()}`
                }))].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20).map((activity, index) => (
                  <div key={activity.id} style={{
                    padding: '15px 20px',
                    borderBottom: '1px solid #e9ecef',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                  }}>
                    {/* Activity Icon */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: activity.type === 'user_active' ? '#28a745' : activity.submission?.passed ? '#007bff' : '#dc3545',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      flexShrink: 0
                    }}>
                      {activity.type === 'user_active' ? '👤' : activity.submission?.passed ? '✅' : '❌'}
                    </div>
                    
                    {/* Activity Details */}
                    <div style={{ flex: 1 }}>
                      {activity.type === 'user_active' ? (
                        <>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                            {activity.user.displayName || activity.user.email} is active
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Current activity: {activity.user.currentActivity || 'browsing'} • {formatLastSeen(activity.timestamp)}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                            {activity.user?.displayName || activity.submission?.studentName || 'Unknown User'} submitted {activity.submission?.testType || 'test'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', display: 'flex', gap: '15px' }}>
                            <span>Score: {activity.submission?.score || 0}%</span>
                            <span>Status: {activity.submission?.passed ? 'Passed' : 'Failed'}</span>
                            <span>{formatLastSeen(activity.timestamp)}</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Activity Badge */}
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: activity.type === 'user_active' ? '#d4edda' : activity.submission?.passed ? '#cce7ff' : '#f8d7da',
                      color: activity.type === 'user_active' ? '#155724' : activity.submission?.passed ? '#004085' : '#721c24'
                    }}>
                      {activity.type === 'user_active' ? 'ACTIVE' : activity.submission?.passed ? 'PASSED' : 'FAILED'}
                    </div>
                  </div>
                ))}
                
                {activeUsers.length === 0 && testResults.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '60px 20px',
                    color: '#6c757d'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📡</div>
                    <h3>Waiting for Live Activity...</h3>
                    <p style={{ margin: '0' }}>
                      User activity and submissions will appear here in real-time
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
