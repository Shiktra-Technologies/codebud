import React, { useEffect, useState } from 'react';
import './ViolationWarningPopup.css';

const ViolationWarningPopup = ({ violation, violationCount, maxViolations, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow fade out animation
    }, 4000); // Show for 4 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!violation) return null;

  const isNearLimit = violationCount >= maxViolations - 2;
  const isAtLimit = violationCount >= maxViolations;

  return (
    <div className={`violation-warning-overlay ${isVisible ? 'visible' : 'hidden'}`}>
      <div className={`violation-warning-popup ${isNearLimit ? 'critical' : 'warning'}`}>
        <div className="warning-header">
          <div className="warning-icon">
            {isAtLimit ? '🚨' : isNearLimit ? '⚠️' : '⚠️'}
          </div>
          <h3>
            {isAtLimit ? 'Test Auto-Submitted!' : 'Security Violation Detected!'}
          </h3>
        </div>

        <div className="warning-content">
          <p className="violation-description">{violation.description}</p>
          
          <div className="violation-counter">
            <div className="counter-display">
              <span className="count">{violationCount}</span>
              <span className="separator">/</span>
              <span className="max">{maxViolations}</span>
            </div>
            <p className="counter-text">
              {isAtLimit 
                ? 'Maximum violations reached - Test submitted automatically'
                : `Violations remaining: ${maxViolations - violationCount}`
              }
            </p>
          </div>

          {!isAtLimit && (
            <div className="warning-message">
              <p>
                {isNearLimit 
                  ? '🔴 FINAL WARNING: One more violation will submit your test!'
                  : '⚠️ Please avoid these actions. Follow the test rules to continue.'
                }
              </p>
            </div>
          )}
        </div>

        <div className="warning-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${(violationCount / maxViolations) * 100}%`,
                backgroundColor: isNearLimit ? '#dc3545' : '#ffc107'
              }}
            ></div>
          </div>
        </div>

        {!isAtLimit && (
          <button onClick={() => setIsVisible(false)} className="close-button">
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default ViolationWarningPopup;
