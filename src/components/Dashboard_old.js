import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

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
              Welcome back, {currentUser?.displayName?.split(' ')[0] || 'Candidate'}! 👋
            </h1>
            <p className="hero-description">
              Ready to showcase your skills? Choose your assessment path and let's begin this journey together.
            </p>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">2</div>
                <div className="stat-label">Available Tests</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">AI</div>
                <div className="stat-label">Proctored</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="test-selection-header">
          <h2 className="heading-lg">Choose Your Assessment</h2>
          <p className="text-muted">Select the type of test that matches your evaluation requirements.</p>
        </div>

        <div className="test-grid">
          {testTypes.map((test) => (
            <div 
              key={test.id}
              className={`test-card ${test.color}`} 
              onClick={() => handleTestSelection(test.id)}
            >
              <div className="test-card-header">
                <div className="test-icon">
                  <span className="icon-emoji">{test.icon}</span>
                </div>
                <div className="test-badge">
                  <span className={`badge badge-${test.color}`}>{test.difficulty}</span>
                </div>
              </div>
              
              <div className="test-card-content">
                <h3 className="test-title">{test.title}</h3>
                <p className="test-subtitle">{test.subtitle}</p>
                <p className="test-description">{test.description}</p>
                
                <div className="test-meta">
                  <div className="meta-item">
                    <span className="meta-icon">⏱️</span>
                    <span className="meta-text">{test.duration}</span>
                  </div>
                </div>

                <div className="test-features">
                  {test.features.map((feature, index) => (
                    <span key={index} className="feature-tag">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="test-card-footer">
                <button className={`btn btn-${test.color} btn-lg`}>
                  Start {test.title}
                  <span className="btn-arrow">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="security-notice">
          <div className="notice-content">
            <div className="notice-icon">🔒</div>
            <div className="notice-text">
              <h4>Secure Assessment Environment</h4>
              <p>
                Your test will be monitored using AI-powered proctoring technology to ensure integrity. 
                Camera and microphone access will be required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
            <div className="test-features">
              <span>• Multiple Choice Questions</span>
              <span>• Time-bound Assessment</span>
              <span>• Logical Reasoning</span>
            </div>
            <button className="select-test-btn">Start Aptitude Test</button>
          </div>

          <div className="test-card" onClick={() => handleTestSelection('dsa')}>
            <div className="test-icon dsa-icon">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
              </svg>
            </div>
            <h2>DSA Problems</h2>
            <p>Data Structures and Algorithms coding challenges with live code editor</p>
            <div className="test-features">
              <span>• Coding Problems</span>
              <span>• Multiple Languages</span>
              <span>• Real-time Compilation</span>
            </div>
            <button className="select-test-btn">Start DSA Test</button>
          </div>
        </div>

        <div className="dashboard-info">
          <div className="info-card">
            <h3>Important Instructions</h3>
            <ul>
              <li>Ensure you have a stable internet connection</li>
              <li>Find a quiet, well-lit environment</li>
              <li>Keep your ID document ready for verification</li>
              <li>You'll need to grant camera and microphone permissions</li>
              <li>The test will be proctored for security</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
