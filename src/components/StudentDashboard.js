import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import './Dashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userRole, isStudent } = useSimpleAuth();
  const heroRef = useRef(null);
  const cardsRef = useRef(null);

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
              Unlock your potential with our advanced assessment platform. 
              Choose your path and demonstrate your technical expertise.
            </p>
            
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">2</div>
                <div className="stat-label">Assessments</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-number">∞</div>
                <div className="stat-label">Attempts</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-number">45m</div>
                <div className="stat-label">Average Time</div>
              </div>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="visual-container">
              <div className="visual-card card-1">
                <div className="card-icon">🧠</div>
                <div className="card-title">Aptitude</div>
              </div>
              <div className="visual-card card-2">
                <div className="card-icon">💻</div>
                <div className="card-title">DSA</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Assessment Cards Section */}
      <section className="assessments-section" ref={cardsRef}>
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Choose Your Path</h2>
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
