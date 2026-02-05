import React, { useState, useEffect } from 'react';
import './RealTimeLoader.css';

const RealTimeLoader = ({ message = "Connecting to Real-Time Data...", subMessage = "Fetching live student activity and submissions" }) => {
  const [dots, setDots] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate dots
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    return () => {
      clearInterval(dotInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="realtime-loader-container">
      {/* Animated background particles */}
      <div className="realtime-particles">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
      </div>

      {/* Main content */}
      <div className="realtime-loader-content">
        {/* Animated connection icon */}
        <div className="connection-icon-wrapper">
          <div className="connection-icon">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle className="pulse-ring" cx="40" cy="40" r="30" stroke="url(#gradient1)" strokeWidth="2" />
              <circle className="pulse-ring pulse-ring-2" cx="40" cy="40" r="25" stroke="url(#gradient1)" strokeWidth="2" />
              <circle className="pulse-ring pulse-ring-3" cx="40" cy="40" r="20" stroke="url(#gradient1)" strokeWidth="2" />
              
              <g className="database-icon">
                <ellipse cx="40" cy="30" rx="15" ry="5" fill="var(--primary-500)" opacity="0.3"/>
                <rect x="25" y="30" width="30" height="15" fill="var(--primary-500)" opacity="0.3"/>
                <ellipse cx="40" cy="45" rx="15" ry="5" fill="var(--primary-500)" opacity="0.3"/>
                <ellipse cx="40" cy="30" rx="15" ry="5" fill="none" stroke="var(--primary-500)" strokeWidth="2"/>
                <line x1="25" y1="30" x2="25" y2="45" stroke="var(--primary-500)" strokeWidth="2"/>
                <line x1="55" y1="30" x2="55" y2="45" stroke="var(--primary-500)" strokeWidth="2"/>
                <ellipse cx="40" cy="45" rx="15" ry="5" fill="none" stroke="var(--primary-500)" strokeWidth="2"/>
              </g>

              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary-500)" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="var(--primary-400)" stopOpacity="0.4"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="connection-glow"></div>
        </div>

        {/* Loading text */}
        <div className="loading-text-wrapper">
          <h2 className="loading-title">
            {message}<span className="loading-dots">{dots}</span>
          </h2>
          <p className="loading-subtitle">{subMessage}</p>
        </div>

        {/* Status indicators */}
        <div className="status-indicators">
          <div className="status-item">
            <div className="status-dot pulse"></div>
            <span>Real-Time Connection</span>
          </div>
          <div className="status-item">
            <div className="status-dot"></div>
            <span>Database Sync</span>
          </div>
          <div className="status-item">
            <div className="status-dot"></div>
            <span>Live Updates</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="realtime-progress-container">
          <div className="realtime-progress-bar">
            <div 
              className="realtime-progress-fill" 
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              <div className="progress-shimmer"></div>
            </div>
          </div>
          <div className="progress-percentage">{Math.floor(Math.min(progress, 100))}%</div>
        </div>

        {/* Connection status */}
        <div className="connection-status">
          <div className="status-badge">
            <div className="status-badge-icon">⚡</div>
            <span>Establishing secure connection...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeLoader;
