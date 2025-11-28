import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import './Dashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userRole, isStudent } = useSimpleAuth();

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

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="heading-xl">
              Welcome back, {currentUser?.displayName?.split(' ')[0] || 'Student'}! 👋
            </h1>
            <p className="hero-description">
              Ready to showcase your skills? Choose your assessment path and let's begin this journey together.
            </p>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">2</div>
                <div className="stat-label">Available Tests</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">0</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">∞</div>
                <div className="stat-label">Attempts</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="section-header">
          <h2 className="heading-lg">Choose Your Assessment</h2>
          <p className="section-description">
            Select from our comprehensive testing suite designed to evaluate different aspects of your technical expertise.
          </p>
        </div>

        <div className="test-grid">
          {testTypes.map((test) => (
            <div key={test.id} className={`test-card ${test.color}`}>
              <div className="test-card-header">
                <div className="test-icon">{test.icon}</div>
                <div className="test-badges">
                  <span className="difficulty-badge">{test.difficulty}</span>
                  <span className="duration-badge">{test.duration}</span>
                </div>
              </div>

              <div className="test-content">
                <h3 className="test-title">{test.title}</h3>
                <p className="test-subtitle">{test.subtitle}</p>
                <p className="test-description">{test.description}</p>

                <div className="test-features">
                  {test.features.map((feature, index) => (
                    <span key={index} className="feature-tag">
                      ✓ {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="test-card-footer">
                <button
                  onClick={() => handleTestSelection(test.id)}
                  className="start-test-btn"
                >
                  Start Assessment
                  <span className="btn-arrow">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-footer">
          <div className="info-section">
            <h3>💡 Assessment Tips</h3>
            <ul>
              <li>Ensure you have a stable internet connection</li>
              <li>Use Chrome, Firefox, or Safari for best compatibility</li>
              <li>Allow camera and microphone permissions for proctoring</li>
              <li>Take the test in a quiet, well-lit environment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
