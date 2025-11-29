import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import jobService from '../services/jobService';
import leaderboardService from '../services/leaderboardService';
import sampleDataService from '../services/sampleDataService';
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
    sampleDataService.addSampleSubmissionsToLocalStorage(); // Add sample test submissions for leaderboard
    loadJobPostings();
    loadLeaderboard();
    loadUserRank();

    // Register for real-time leaderboard updates
    const handleLeaderboardUpdate = (updatedLeaderboard) => {
      console.log('📊 Student dashboard received leaderboard update');
      setLeaderboardData(updatedLeaderboard);
      loadUserRank(); // Refresh user rank
    };

    leaderboardService.onLeaderboardUpdate(handleLeaderboardUpdate);

    // Cleanup
    return () => {
      leaderboardService.offLeaderboardUpdate(handleLeaderboardUpdate);
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

  // Use dynamic leaderboard data or fallback to static
  const leaderboard = leaderboardData.length > 0 ? leaderboardData.map((user, index) => ({
    rank: user.rank || index + 1,
    name: user.userName,
    score: user.totalScore,
    avatar: '👨‍💻',
    isCurrentUser: currentUser?.uid === user.userId
  })) : [
    { rank: 1, name: 'Alex Chen', score: 2450, avatar: '👨‍💻' },
    { rank: 2, name: 'Sarah Kim', score: 2380, avatar: '👩‍💻' },
    { rank: 3, name: 'David Wilson', score: 2320, avatar: '👨‍🎓' },
    { rank: 4, name: 'Emma Davis', score: 2280, avatar: '👩‍🎓' },
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
              <span className="badge-icon">✨</span>
              Welcome to CodeBud Pro
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
          
          <div className="hero-visual">
            <div className="visual-container">
              <div className="visual-card card-1">
                <div className="card-icon">🧠</div>
                <div className="card-title">Assessments</div>
              </div>
              <div className="visual-card card-2">
                <div className="card-icon">📚</div>
                <div className="card-title">Courses</div>
              </div>
              <div className="visual-card card-3">
                <div className="card-icon">🏆</div>
                <div className="card-title">Leaderboard</div>
              </div>
              <div className="visual-card card-4">
                <div className="card-icon">�</div>
                <div className="card-title">Jobs</div>
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
              <div className="section-header">
                <h2 className="section-title">Global Leaderboard</h2>
                <p className="section-description">
                  See how you rank among your peers
                </p>
              </div>

              <div className="leaderboard-container">
                <div className="leaderboard-header">
                  <div className="rank-col">Rank</div>
                  <div className="name-col">Student</div>
                  <div className="score-col">Score</div>
                </div>
                <div className="leaderboard-list">
                  {leaderboard.length > 0 ? leaderboard.map((entry) => (
                    <div 
                      key={entry.rank} 
                      className={`leaderboard-item ${entry.isCurrentUser ? 'current-user' : ''}`}
                    >
                      <div className="rank-col">
                        <span className="rank-number">#{entry.rank}</span>
                        {entry.rank <= 3 && (
                          <span className="rank-medal">
                            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                          </span>
                        )}
                      </div>
                      <div className="name-col">
                        <span className="avatar">{entry.avatar}</span>
                        <span className="name">{entry.name}</span>
                      </div>
                      <div className="score-col">
                        <span className="score">{entry.score.toLocaleString()}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="no-data">
                      <p>No test submissions found yet.</p>
                      <p>Complete an assessment to see your ranking!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Demo Section for Testing */}
              <div className="demo-section" style={{ marginTop: '2rem', padding: '1rem', background: '#2a2a2a', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '1rem', color: '#bb86fc' }}>🎯 Real-time Leaderboard Demo</h4>
                <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#ccc' }}>
                  Simulate new test submissions to see the leaderboard update in real-time:
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button 
                    className="job-btn primary" 
                    onClick={() => {
                      const users = ['John Doe', 'Sarah Wilson', 'Mike Chen', 'Lisa Park'];
                      const testTypes = ['aptitude', 'technical'];
                      const randomUser = users[Math.floor(Math.random() * users.length)];
                      const randomTest = testTypes[Math.floor(Math.random() * testTypes.length)];
                      const randomScore = Math.floor(Math.random() * 30) + 70; // 70-100
                      
                      sampleDataService.simulateTestSubmission(
                        `demo_user_${Date.now()}`,
                        randomUser,
                        `${randomUser.toLowerCase().replace(' ', '.')}@example.com`,
                        randomTest,
                        randomScore
                      );
                      
                      // Refresh leaderboard display
                      loadLeaderboard();
                    }}
                  >
                    📈 Simulate Test Submission
                  </button>
                  <button 
                    className="job-btn secondary" 
                    onClick={() => {
                      sampleDataService.clearAllSubmissions();
                      sampleDataService.addSampleSubmissionsToLocalStorage();
                      loadLeaderboard();
                    }}
                  >
                    🔄 Reset to Sample Data
                  </button>
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
