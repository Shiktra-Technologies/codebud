import React from 'react';
import './ViolationModal.css';

const ViolationModal = ({ violations, onAcknowledge, onSubmitTest }) => {
  if (!violations.length) return null;

  const criticalViolations = violations.filter(v => v.type === 'CRITICAL');
  const hasCritical = criticalViolations.length > 0;

  return (
    <div className="violation-modal-overlay">
      <div className="violation-modal">
        <div className={`violation-header ${hasCritical ? 'critical' : 'warning'}`}>
          <div className="violation-icon">
            {hasCritical ? '🚨' : '⚠️'}
          </div>
          <h2>
            {hasCritical ? 'Test Violation Detected' : 'Security Warning'}
          </h2>
        </div>

        <div className="violation-content">
          {hasCritical ? (
            <div className="critical-message">
              <p>Your test has been automatically submitted due to security violations:</p>
              <ul>
                {criticalViolations.map(violation => (
                  <li key={violation.id}>
                    <strong>{violation.description}</strong>
                    <span className="violation-time">
                      {new Date(violation.timestamp).toLocaleTimeString()}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="final-warning">
                Please contact your proctor or administrator for further instructions.
              </p>
            </div>
          ) : (
            <div className="warning-message">
              <p>The following security warnings have been recorded:</p>
              <ul>
                {violations.map(violation => (
                  <li key={violation.id}>
                    <strong>{violation.description}</strong>
                    <span className="violation-time">
                      {new Date(violation.timestamp).toLocaleTimeString()}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="continue-warning">
                Please avoid these actions. Continued violations may result in automatic test submission.
              </p>
            </div>
          )}
        </div>

        <div className="violation-actions">
          {hasCritical ? (
            <button onClick={onSubmitTest} className="submit-btn critical">
              View Submitted Test
            </button>
          ) : (
            <button onClick={onAcknowledge} className="acknowledge-btn">
              I Understand - Continue Test
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViolationModal;
