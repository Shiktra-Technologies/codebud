import React, { useEffect } from 'react';
import { useProctor } from '../context/ProctorContext';
import './SubmissionPage.css';

const SubmissionPage = () => {
  const { proctorState, stopMonitoring } = useProctor();

  useEffect(() => {
    // Stop monitoring when reaching submission page
    stopMonitoring();
  }, [stopMonitoring]);

  return (
    <div className="submission-page">
      <div className="submission-container">
        {proctorState.tabSwitched ? (
          // Test was auto-submitted due to violation
          <div className="violation-submission">
            <div className="violation-icon">⚠️</div>
            <h1>Test Automatically Submitted</h1>
            <p className="violation-message">
              Your test was automatically submitted due to a policy violation.
            </p>
            
            <div className="violation-details">
              <h3>Violation Details:</h3>
              <div className="violations-list">
                {proctorState.violations.map((violation) => (
                  <div key={violation.id} className="violation-item">
                    <div className="violation-header">
                      <span className={`violation-type ${violation.type.toLowerCase()}`}>
                        {violation.type}
                      </span>
                      <span className="violation-time">
                        {new Date(violation.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="violation-description">
                      {violation.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="policy-reminder">
              <h4>Reminder of Test Policies:</h4>
              <ul>
                <li>❌ No switching tabs or applications</li>
                <li>❌ No exiting fullscreen mode</li>
                <li>❌ No opening developer tools</li>
                <li>❌ No using prohibited keyboard shortcuts</li>
              </ul>
            </div>
          </div>
        ) : (
          // Normal submission
          <div className="success-submission">
            <div className="success-icon">✅</div>
            <h1>Test Submitted Successfully!</h1>
            <p className="success-message">
              Your solution has been submitted and will be reviewed.
            </p>
            
            <div className="submission-details">
              <div className="detail-item">
                <strong>Submission Time:</strong> {new Date().toLocaleString()}
              </div>
              <div className="detail-item">
                <strong>Total Violations:</strong> {proctorState.violations.length}
              </div>
              <div className="detail-item">
                <strong>Session Status:</strong> Completed
              </div>
            </div>

            {proctorState.violations.length > 0 && (
              <div className="warnings-section">
                <h3>Session Warnings:</h3>
                <div className="violations-list">
                  {proctorState.violations.filter(v => v.type === 'WARNING').map((violation) => (
                    <div key={violation.id} className="violation-item warning">
                      <div className="violation-header">
                        <span className="violation-type warning">WARNING</span>
                        <span className="violation-time">
                          {new Date(violation.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="violation-description">
                        {violation.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="next-steps">
          <h3>What happens next?</h3>
          <div className="steps-list">
            <div className="step">
              <span className="step-number">1</span>
              <span className="step-text">Your code will be tested against all test cases</span>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <span className="step-text">Performance metrics will be calculated</span>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <span className="step-text">Results will be available in your dashboard</span>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <span className="step-text">Proctoring report will be generated</span>
            </div>
          </div>
        </div>

        <div className="actions">
          <button 
            onClick={() => window.location.href = '/problems'}
            className="return-btn"
          >
            Return to Problems
          </button>
          <button 
            onClick={() => window.close()}
            className="close-btn"
          >
            Close Window
          </button>
        </div>

        <div className="footer-note">
          <p>
            <strong>Note:</strong> This window will remain in fullscreen mode until you close it completely.
            The monitoring session has ended.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubmissionPage;
