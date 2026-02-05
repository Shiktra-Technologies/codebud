import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import jobService from '../services/jobService';
import leaderboardService from '../services/leaderboardService';
import sampleDataService from '../services/sampleDataService';
import leaderboardDemo from '../utils/leaderboardDemo';
import './Dashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userRole, isStudent } = useSimpleAuth();
  const heroRef = useRef(null);
  const cardsRef = useRef(null);
  const [activeSection, setActiveSection] = useState('assessments');
  const [jobPostings, setJobPostings] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Helper function to get avatar emoji based on name
  const getAvatarEmoji = (name) => {
    if (!name) return '👤';
    const avatars = ['👨‍💻', '👩‍💻', '👨‍🎓', '👩‍🎓', '🧑‍💻', '👨‍🔬', '👩‍🔬', '🧑‍🎓'];
    const index = name.length % avatars.length;
    return avatars[index];
  };

  // Redirect if not a student
  if (!isStudent()) {
    return (
      <div className="dashboard-container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>Student access required for this dashboard.</p>
        </div>
      </div>
    );
  }

  const handleTestSelection = (testType) => {
    navigate(`/permission/${testType}`);
  };

  const testTypes = [
    {
      id: 'aptitude',
      title: 'Aptitude Assessment',
      subtitle: 'Logic & Reasoning',
      description: 'Test your analytical thinking with logical reasoning, quantitative aptitude, and problem-solving questions.',
      icon: '🧠',
      color: 'primary',
      difficulty: 'Intermediate',
      duration: '45 minutes',
      features: ['Multiple Choice', 'Timer-based', 'Auto-grading']
    },
    {
      id: 'dsa',
      title: 'DSA Challenge',
      subtitle: 'Data Structures & Algorithms',
      description: 'Solve complex coding problems using data structures and algorithmic thinking with real code editor.',
      icon: '💻',
      color: 'success',
      difficulty: 'Advanced',
      duration: '90 minutes',
      features: ['Code Editor', 'Multiple Languages', 'Real-time Execution']
    }
  ];

  // Initialize services and load data
  useEffect(() => {
    jobService.initializeSampleData();
    // Only add sample data if no real submissions exist
    const existingSubmissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
    if (existingSubmissions.length === 0) {
      sampleDataService.addSampleSubmissionsToLocalStorage();
    }
    
    loadJobPostings();
    loadLeaderboard();
    loadUserRank();

    // Register for real-time leaderboard updates
    const handleLeaderboardUpdate = (updatedLeaderboard) => {
      console.log('[DATA] Student dashboard received leaderboard update');
      setLeaderboardData(updatedLeaderboard);
      loadUserRank(); // Refresh user rank
      setLeaderboardLoading(false);
    };

    leaderboardService.onLeaderboardUpdate(handleLeaderboardUpdate);

    // Listen for custom leaderboard update events
    const handleCustomLeaderboardUpdate = (event) => {
      console.log('[DATA] Received custom leaderboard update event');
      if (event.detail && event.detail.data) {
        setLeaderboardData(event.detail.data);
        loadUserRank();
        setLeaderboardLoading(false);
      }
    };

    // Listen for cross-device updates
    const handleCrossDeviceUpdate = (event) => {
      console.log('📱 Student dashboard received cross-device update');
      if (event.detail && event.detail.type === 'leaderboard_update') {
        loadLeaderboard(); // Refresh leaderboard data
      }
    };

    window.addEventListener('leaderboard_updated', handleCustomLeaderboardUpdate);
    window.addEventListener('cross_device_update', handleCrossDeviceUpdate);

    // Initial load with loading state
    setLeaderboardLoading(true);
    
    // Cleanup
    return () => {
      leaderboardService.offLeaderboardUpdate(handleLeaderboardUpdate);
      window.removeEventListener('leaderboard_updated', handleCustomLeaderboardUpdate);
      window.removeEventListener('cross_device_update', handleCrossDeviceUpdate);
    };
  }, []);

  // Add scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) observer.observe(heroRef.current);
    if (cardsRef.current) observer.observe(cardsRef.current);

    return () => observer.disconnect();
  }, []);

  const loadJobPostings = () => {
    const jobs = jobService.getJobPostings();
    setJobPostings(jobs);
  };

  const loadLeaderboard = () => {
    const leaderboard = leaderboardService.getTopUsers(10);
    setLeaderboardData(leaderboard);
  };

  const loadUserRank = () => {
    if (currentUser?.uid) {
      const rankInfo = leaderboardService.getUserRank(currentUser.uid);
      setUserRank(rankInfo);
    }
  };

  const calculateLeaderboard = () => {
    // Prioritize real leaderboard data from actual submissions
    if (leaderboardData.length > 0) {
      return leaderboardData.map(user => ({
        id: user.userId || user.id,
        name: user.userName || user.displayName || 'Anonymous',
        email: user.userEmail || user.email,
        score: user.totalScore || 0,
        testsCompleted: user.testsCompleted || 0,
        averageScore: user.averageScore || '0%',
        avatar: getAvatarEmoji(user.userName || user.displayName),
        lastSubmission: user.lastSubmission,
        isPlaceholder: false
      }));
    }
    
    // If no real leaderboard data, return empty array
    return [];
  };

  const handleJobApplication = async (jobId) => {
    try {
      if (!currentUser) {
        alert('Please log in to apply for jobs');
        return;
      }

      await jobService.applyForJob(jobId, {
        studentId: currentUser.uid,
        studentName: currentUser.displayName || currentUser.email,
        studentEmail: currentUser.email
      });

      alert('Application submitted successfully!');
      loadJobPostings(); // Refresh job postings
    } catch (error) {
      alert(error.message || 'Failed to apply for job');
    }
  };

  // Mock data for new sections
  const courses = [
    {
      id: 1,
      title: 'JavaScript Fundamentals',
      instructor: 'John Doe',
      progress: 75,
      totalLessons: 12,
      completedLessons: 9,
      rating: 4.8,
      thumbnail: '🟨'
    },
    {
      id: 2,
      title: 'Data Structures & Algorithms',
      instructor: 'Jane Smith',
      progress: 45,
      totalLessons: 20,
      completedLessons: 9,
      rating: 4.9,
      thumbnail: '🟦'
    },
    {
      id: 3,
      title: 'React Development',
      instructor: 'Mike Johnson',
      progress: 30,
      totalLessons: 15,
      completedLessons: 4,
      rating: 4.7,
      thumbnail: '🟪'
    }
  ];

  // Use dynamic leaderboard data - prioritize real submission data
  const leaderboard = leaderboardData.length > 0 ? leaderboardData.map((user, index) => ({
    rank: user.rank || index + 1,
    name: user.userName || user.displayName || 'Anonymous',
    email: user.userEmail || user.email,
    score: user.totalScore || 0,
    testsCompleted: user.testsCompleted || 0,
    averageScore: user.averageScore || 0,
    avatar: getAvatarEmoji(user.userName || user.displayName),
    isCurrentUser: currentUser?.uid === user.userId || currentUser?.id === user.userId
  })) : [
    { rank: 1, name: 'Complete an assessment', score: 0, avatar: '🎯', isPlaceholder: true },
    { rank: 2, name: 'to see real rankings!', score: 0, avatar: '�', isPlaceholder: true },
    { rank: 5, name: 'You', score: 2150, avatar: '🏆', isCurrentUser: true }
  ];

  // Use dynamic job postings or fallback to static
  const jobNotifications = jobPostings.length > 0 ? jobPostings.map(job => ({
    id: job.id,
    company: job.company,
    position: job.position,
    location: job.location,
    type: job.type,
    salary: job.salary,
    postedDate: new Date(job.postedDate).toISOString().split('T')[0],
    logo: '🚀',
    description: job.description,
    requirements: job.requirements
  })) : [
    {
      id: 1,
      company: 'Tech Corp',
      position: 'Frontend Developer',
      location: 'Remote',
      type: 'Full-time',
      salary: '$70,000 - $90,000',
      postedDate: '2024-11-28',
      logo: '🚀'
    },
    {
      id: 2,
      company: 'StartupXYZ',
      position: 'Full Stack Developer',
      location: 'New York, NY',
      type: 'Full-time',
      salary: '$80,000 - $100,000',
      postedDate: '2024-11-27',
      logo: '💡'
    },
    {
      id: 3,
      company: 'Innovation Labs',
      position: 'Software Engineer Intern',
      location: 'San Francisco, CA',
      type: 'Internship',
      salary: '$25/hour',
      postedDate: '2024-11-26',
      logo: '🔬'
    }
  ];

  return (
    <div className="modern-dashboard">
      {/* Hero Section */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
          <div className="floating-elements">
            <div className="floating-circle circle-1"></div>
            <div className="floating-circle circle-2"></div>
            <div className="floating-circle circle-3"></div>
          </div>
        </div>
        
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-icon">Welcome to CodeBud Pro</span>
              <span></span>
            </div>
            
            <h1 className="hero-title">
              Hello <span className="gradient-text">{currentUser?.displayName?.split(' ')[0] || 'Student'}</span>,<br />
              Ready to <span className="gradient-text">Excel</span>?
            </h1>
            
            <p className="hero-subtitle">
              Unlock your potential with our advanced learning platform. 
              Take assessments, learn from courses, compete on leaderboards, and discover job opportunities.
            </p>
            
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">5</div>
                <div className="stat-label">Sections</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-number">∞</div>
                <div className="stat-label">Opportunities</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-number">#5</div>
                <div className="stat-label">Your Rank</div>
              </div>
            </div>
          </div>
          

        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="navigation-section">
        <div className="nav-container">
          <div className="nav-tabs">
            <button 
              className={`nav-tab ${activeSection === 'assessments' ? 'active' : ''}`}
              onClick={() => setActiveSection('assessments')}
            >
              <span className="nav-icon">🧠</span>
              <span className="nav-text">Assessments</span>
            </button>
            <button 
              className={`nav-tab ${activeSection === 'courses' ? 'active' : ''}`}
              onClick={() => setActiveSection('courses')}
            >
              <span className="nav-icon">📚</span>
              <span className="nav-text">Courses</span>
            </button>
            <button 
              className={`nav-tab ${activeSection === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setActiveSection('leaderboard')}
            >
              <span className="nav-icon">🏆</span>
              <span className="nav-text">Leaderboard</span>
            </button>
            <button 
              className={`nav-tab ${activeSection === 'jobs' ? 'active' : ''}`}
              onClick={() => setActiveSection('jobs')}
            >
              <span className="nav-icon">💼</span>
              <span className="nav-text">Job Opportunities</span>
            </button>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="content-section" ref={cardsRef}>
        <div className="section-container">
          
          {/* Assessments Section */}
          {activeSection === 'assessments' && (
            <div className="assessments-content">
              <div className="section-header">
                <h2 className="section-title">Choose Your Assessment Path</h2>
                <p className="section-description">
                  Select from our comprehensive testing suite designed to evaluate your skills
                </p>
              </div>

              <div className="assessments-grid">
                {testTypes.map((test, index) => (
                  <div 
                    key={test.id} 
                    className={`assessment-card ${test.color}`}
                    style={{ '--delay': `${index * 0.2}s` }}
                  >
                    <div className="card-glow"></div>
                    <div className="card-content">
                      <div className="card-header">
                        <div className="card-icon-wrapper">
                          <span className="card-icon">{test.icon}</span>
                        </div>
                        <div className="card-badges">
                          <span className="difficulty-badge">{test.difficulty}</span>
                          <span className="duration-badge">{test.duration}</span>
                        </div>
                      </div>

                      <div className="card-body">
                        <h3 className="card-title">{test.title}</h3>
                        <p className="card-subtitle">{test.subtitle}</p>
                        <p className="card-description">{test.description}</p>

                        <div className="card-features">
                          {test.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="feature-item">
                              <span className="feature-check">✓</span>
                              <span className="feature-text">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="card-footer">
                        <button
                          onClick={() => handleTestSelection(test.id)}
                          className="assessment-btn"
                        >
                          <span className="btn-text">Start Assessment</span>
                          <span className="btn-icon">→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Courses Section */}
          {activeSection === 'courses' && (
            <div className="courses-content">
              <div className="section-header">
                <h2 className="section-title">My Learning Path</h2>
                <p className="section-description">
                  Continue your learning journey with our curated courses
                </p>
              </div>

              <div className="courses-grid">
                {courses.map((course) => (
                  <div key={course.id} className="course-card">
                    <div className="course-header">
                      <div className="course-thumbnail">{course.thumbnail}</div>
                      <div className="course-info">
                        <h3 className="course-title">{course.title}</h3>
                        <p className="course-instructor">by {course.instructor}</p>
                        <div className="course-rating">
                          <span className="rating-stars">⭐</span>
                          <span className="rating-value">{course.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="course-progress">
                      <div className="progress-info">
                        <span>Progress: {course.completedLessons}/{course.totalLessons} lessons</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <button className="continue-btn">Continue Learning</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard Section */}
          {activeSection === 'leaderboard' && (
            <div className="leaderboard-content">
              <h2 style={{ color: '#333', marginBottom: '8px' }}>🏆 Student Leaderboard</h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Top performing students based on assessment scores and completion rates
              </p>

              <div style={{
                background: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
                      padding: '60px', 
                      color: '#6c757d'
                    }}>
                      <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏆</div>
                      <h3 style={{ color: '#495057', marginBottom: '12px' }}>No Rankings Available</h3>
                      <p style={{ margin: '0 0 20px 0', fontSize: '16px' }}>
                        Student rankings will appear here once assessments are completed
                      </p>
                      <div style={{
                        padding: '15px 25px',
                        backgroundColor: '#e7f3ff',
                        borderRadius: '8px',
                        color: '#0066cc',
                        fontSize: '14px',
                        maxWidth: '400px',
                        margin: '0 auto'
                      }}>
                        💡 Complete an assessment to see your ranking and compete with other students!
                      </div>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #dee2e6', backgroundColor: '#f8f9fa' }}>
                            <th style={{ padding: '15px 12px', textAlign: 'left', fontWeight: '700', color: '#495057' }}>Rank</th>
                            <th style={{ padding: '15px 12px', textAlign: 'left', fontWeight: '700', color: '#495057' }}>Student</th>
                            <th style={{ padding: '15px 12px', textAlign: 'center', fontWeight: '700', color: '#495057' }}>Score</th>
                            <th style={{ padding: '15px 12px', textAlign: 'center', fontWeight: '700', color: '#495057' }}>Tests Completed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {calculateLeaderboard().map((student, index) => {
                            const isCurrentUser = currentUser && (
                              student.id === currentUser.uid || 
                              student.id === currentUser.id || 
                              student.email === currentUser.email
                            );
                            
                            return (
                              <tr key={student.id || index} style={{ 
                                borderBottom: '1px solid #dee2e6',
                                backgroundColor: isCurrentUser ? '#e3f2fd' : (index < 3 ? '#fff3cd' : 'white'),
                                transition: 'background-color 0.2s ease'
                              }}>
                                <td style={{ padding: '15px 12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ 
                                      fontWeight: 'bold',
                                      color: '#333',
                                      fontSize: '16px'
                                    }}>
                                      #{index + 1}
                                    </span>
                                    {index === 0 && <span style={{ fontSize: '20px' }}>🥇</span>}
                                    {index === 1 && <span style={{ fontSize: '20px' }}>🥈</span>}
                                    {index === 2 && <span style={{ fontSize: '20px' }}>🥉</span>}
                                    {isCurrentUser && (
                                      <span style={{
                                        backgroundColor: '#2196f3',
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '10px',
                                        fontWeight: '600'
                                      }}>
                                        YOU
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: '15px 12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                      width: '40px',
                                      height: '40px',
                                      borderRadius: '50%',
                                      backgroundColor: isCurrentUser ? '#2196f3' : '#007bff',
                                      color: 'white',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: student.avatar?.length > 1 ? '20px' : '16px',
                                      fontWeight: 'bold'
                                    }}>
                                      {student.avatar}
                                    </div>
                                    <div>
                                      <div style={{ 
                                        fontWeight: isCurrentUser ? '700' : '500',
                                        color: isCurrentUser ? '#1976d2' : '#333',
                                        fontSize: '15px'
                                      }}>
                                        {student.name}
                                      </div>
                                      <div style={{ fontSize: '12px', color: '#666' }}>{student.email}</div>
                                      {student.lastSubmission && (
                                        <div style={{ fontSize: '11px', color: '#999' }}>
                                          Last: {new Date(student.lastSubmission).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '15px 12px', textAlign: 'center' }}>
                                  <div>
                                    <span style={{
                                      padding: '6px 12px',
                                      borderRadius: '15px',
                                      backgroundColor: isCurrentUser ? '#bbdefb' : '#e3f2fd',
                                      color: isCurrentUser ? '#0d47a1' : '#1976d2',
                                      fontSize: '14px',
                                      fontWeight: 'bold'
                                    }}>
                                      {student.score.toLocaleString()}
                                    </span>
                                    {student.averageScore && (
                                      <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                        Avg: {student.averageScore}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: '15px 12px', textAlign: 'center' }}>
                                  <span style={{ 
                                    color: '#333',
                                    fontWeight: '500',
                                    fontSize: '15px'
                                  }}>
                                    {student.testsCompleted}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Jobs Section */}
          {activeSection === 'jobs' && (
            <div className="jobs-content">
              <div className="section-header">
                <h2 className="section-title">Job Opportunities</h2>
                <p className="section-description">
                  Discover career opportunities matching your skills
                </p>
              </div>

              <div className="jobs-grid">
                {jobNotifications.map((job) => (
                  <div key={job.id} className="job-card">
                    <div className="job-header">
                      <div className="company-logo">{job.logo}</div>
                      <div className="job-meta">
                        <div className="job-date">
                          {new Date(job.postedDate).toLocaleDateString()}
                        </div>
                        <div className="job-type">{job.type}</div>
                      </div>
                    </div>
                    <div className="job-content">
                      <h3 className="job-title">{job.position}</h3>
                      <p className="job-company">{job.company}</p>
                      <div className="job-details">
                        <div className="job-location">📍 {job.location}</div>
                        <div className="job-salary">💰 {job.salary}</div>
                      </div>
                    </div>
                    <div className="job-actions">
                      <button 
                        className="job-btn primary"
                        onClick={() => handleJobApplication(job.id)}
                      >
                        Apply Now
                      </button>
                      <button 
                        className="job-btn secondary"
                        onClick={() => {
                          if (currentUser?.uid) {
                            jobService.saveJob(job.id, currentUser.uid);
                            alert('Job saved for later!');
                          } else {
                            alert('Please log in to save jobs');
                          }
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Tips Section */}
      <section className="tips-section">
        <div className="section-container">
          <div className="tips-content">
            <div className="tips-header">
              <h3 className="tips-title">
                <span className="tips-icon">💡</span>
                Assessment Guidelines
              </h3>
            </div>
            <div className="tips-grid">
              <div className="tip-item">
                <div className="tip-icon">🌐</div>
                <div className="tip-text">Stable internet connection required</div>
              </div>
              <div className="tip-item">
                <div className="tip-icon">🖥️</div>
                <div className="tip-text">Chrome, Firefox, or Safari recommended</div>
              </div>
              <div className="tip-item">
                <div className="tip-icon">📷</div>
                <div className="tip-text">Camera & microphone access needed</div>
              </div>
              <div className="tip-item">
                <div className="tip-icon">🔇</div>
                <div className="tip-text">Quiet, well-lit environment</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudentDashboard;
