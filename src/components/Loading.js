import React, { useState, useEffect } from 'react';
import './Loading.css';

const Loading = () => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const codingQuotes = [
    "Compiling brilliance...",
    "Optimizing your experience...",
    "Loading knowledge modules...",
    "Initializing code excellence...",
    "Preparing your coding journey...",
    "Building something amazing...",
    "Debugging the universe...",
    "Crafting your success story...",
    "Powering up your potential...",
    "Loading... because great things take time!"
  ];

  useEffect(() => {
    // Change quote every 2 seconds
    const quoteInterval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % codingQuotes.length);
    }, 2000);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 15;
      });
    }, 300);

    return () => {
      clearInterval(quoteInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="premium-loading-container">
      {/* Animated background particles */}
      <div className="loading-particles">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
      </div>

      {/* Main content */}
      <div className="loading-content">
        {/* Animated logo */}
        <div className="loading-logo-wrapper">
          <div className="loading-logo">
            <div className="logo-icon">💻</div>
            <div className="logo-glow"></div>
          </div>
          <h1 className="loading-brand">CodeBud</h1>
          <p className="loading-tagline">Your Coding Companion</p>
        </div>

        {/* Spinner */}
        <div className="loading-spinner-wrapper">
          <svg className="loading-spinner" viewBox="0 0 50 50">
            <circle
              className="spinner-track"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="3"
            ></circle>
            <circle
              className="spinner-progress"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="3"
            ></circle>
          </svg>
        </div>

        {/* Motivational quote */}
        <div className="loading-quote-container">
          <p className="loading-quote" key={quoteIndex}>
            {codingQuotes[quoteIndex]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="loading-progress-bar">
          <div 
            className="loading-progress-fill" 
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        <p className="loading-percentage">{Math.floor(Math.min(progress, 100))}%</p>
      </div>

      {/* Version info */}
      <div className="loading-footer">
        <p className="loading-version">v1.0.0</p>
      </div>
    </div>
  );
};

export default Loading;
