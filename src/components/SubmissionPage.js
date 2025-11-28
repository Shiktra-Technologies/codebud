import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProctor } from '../context/ProctorContext';
import './SubmissionPage.css';

const SubmissionPage = () => {
  const { pauseMonitoring, exitFullscreen, permissions } = useProctor();
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState(null);

  useEffect(() => {
    // Pause monitoring when reaching submission page (keep permissions active)
    pauseMonitoring();
    
    // Load test results from localStorage
    const savedResults = localStorage.getItem('testResults');
    if (savedResults) {
      setTestResults(JSON.parse(savedResults));
    }
  }, [pauseMonitoring]);

  if (!testResults) {
    return (
      <div className="submission-page">
        <div className="submission-container">
          <div className="loading-results">
            <div className="loader"></div>
            <p>Loading test results...</p>
          </div>
        </div>
      </div>
    );
  }

  const isViolationSubmission = testResults.violations?.submittedDueToViolation;

  return (
    <div className="submission-page">
      <div className="submission-container">
        {/* Header Section */}
        <div className={`results-header ${testResults.passed ? 'passed' : 'failed'}`}>
          <div className="result-icon">
            {isViolationSubmission ? '🚨' : testResults.passed ? '✅' : '❌'}
          </div>
          <h1>
            {testResults.violations?.autoSubmitted 
              ? `Test Auto-Submitted: ${testResults.violations.count}/${testResults.violations.maxViolations} Violations Exceeded`
              : isViolationSubmission 
                ? 'Test Auto-Submitted Due to Security Breach'
                : testResults.passed 
                  ? 'Congratulations! Test Passed' 
                  : 'Test Completed'
            }
          </h1>
          <div className="result-summary">
            {testResults.testType === 'aptitude' ? (
              <p>Score: <strong>{testResults.score}/{testResults.totalQuestions}</strong> ({testResults.percentage}%)</p>
            ) : (
              <p>Test Cases: <strong>{testResults.testCases?.passed || 0}/{testResults.testCases?.total || 0}</strong> ({testResults.testCases?.percentage || 0}%)</p>
            )}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="performance-summary">
          <div className="summary-card">
            <h3>📊 Performance</h3>
            <div className="performance-stats">
              <div className="stat">
                <span className="stat-label">Status:</span>
                <span className={`stat-value ${testResults.passed ? 'passed' : 'failed'}`}>
                  {testResults.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Score:</span>
                <span className="stat-value">
                  {testResults.testType === 'aptitude' 
                    ? `${testResults.score}/${testResults.totalQuestions}` 
                    : `${testResults.testCases?.passed || 0}/${testResults.testCases?.total || 0}`
                  }
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Percentage:</span>
                <span className="stat-value">{testResults.percentage || testResults.testCases?.percentage || 0}%</span>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <h3>⏱️ Timing</h3>
            <div className="timing-stats">
              <div className="stat">
                <span className="stat-label">Total Time:</span>
                <span className="stat-value">{testResults.timing?.totalTimeSpentFormatted || 'N/A'}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Started:</span>
                <span className="stat-value">
                  {new Date(testResults.timing?.startTime).toLocaleTimeString()}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Submitted:</span>
                <span className="stat-value">
                  {new Date(testResults.submittedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <h3>🛡️ Proctoring</h3>
            <div className="proctoring-stats">
              <div className="stat">
                <span className="stat-label">Violations:</span>
                <span className={`stat-value ${testResults.violations?.count > 0 ? 'violations' : 'clean'}`}>
                  {testResults.violations?.count || 0}/{testResults.violations?.maxViolations || 5}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Status:</span>
                <span className={`stat-value ${isViolationSubmission ? 'auto-submitted' : 'normal'}`}>
                  {isViolationSubmission ? 'Auto-Submitted' : 'Normal'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Results for Aptitude Test */}
        {testResults.testType === 'aptitude' && testResults.answers && (
          <div className="detailed-results">
            <h3>📋 Question Review</h3>
            <div className="questions-review">
              {testResults.answers.map((answer, index) => (
                <div key={answer.questionId} className={`question-item ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="question-header">
                    <span className="question-number">Q{index + 1}</span>
                    <span className={`result-badge ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                      {answer.isCorrect ? '✓' : '✗'}
                    </span>
                    <span className="time-taken">{answer.timeSpent}s</span>
                  </div>
                  <div className="question-text">{answer.question}</div>
                  <div className="answer-comparison">
                    <div className="user-answer">
                      <strong>Your Answer:</strong> {answer.userAnswerText}
                    </div>
                    <div className="correct-answer">
                      <strong>Correct Answer:</strong> {answer.correctAnswerText}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DSA Results */}
        {testResults.testType === 'dsa' && (
          <div className="detailed-results">
            <h3>💻 Solution Summary</h3>
            <div className="solution-summary">
              <div className="solution-info">
                <p><strong>Problem:</strong> {testResults.problemTitle}</p>
                <p><strong>Difficulty:</strong> <span className={`difficulty ${testResults.difficulty?.toLowerCase()}`}>{testResults.difficulty}</span></p>
                <p><strong>Category:</strong> {testResults.category}</p>
                <p><strong>Language:</strong> {testResults.language}</p>
              </div>
              {testResults.testCases?.details && (
                <div className="test-cases">
                  <h4>Test Case Results:</h4>
                  {testResults.testCases.details.map((testCase, index) => (
                    <div key={index} className={`test-case ${testCase.passed ? 'passed' : 'failed'}`}>
                      <span>Test {index + 1}: {testCase.passed ? '✓ Passed' : '✗ Failed'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comprehensive Violation Analysis */}
        {testResults.violationAnalysis && (
          <div className="violation-analysis-section">
            <h3>🛡️ Security & Integrity Analysis</h3>
            
            {/* Violation Summary */}
            <div className="analysis-summary">
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Total Violations:</span>
                  <span className={`summary-value ${testResults.violationAnalysis.summary.totalViolations > 0 ? 'violations' : 'clean'}`}>
                    {testResults.violationAnalysis.summary.totalViolations}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Security Breaches:</span>
                  <span className={`summary-value ${testResults.violationAnalysis.summary.securityBreaches > 0 ? 'critical' : 'clean'}`}>
                    {testResults.violationAnalysis.summary.securityBreaches}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Integrity Score:</span>
                  <span className={`summary-value score-${Math.floor(testResults.violationAnalysis.severityScore.score / 20)}`}>
                    {testResults.violationAnalysis.severityScore.score}/100
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Overall Rating:</span>
                  <span className={`summary-value rating-${testResults.violationAnalysis.integrityReport.overallIntegrity.toLowerCase()}`}>
                    {testResults.violationAnalysis.integrityReport.overallIntegrity}
                  </span>
                </div>
              </div>
              <div className="integrity-interpretation">
                <strong>{testResults.violationAnalysis.severityScore.interpretation}</strong>
                <p>{testResults.violationAnalysis.integrityReport.recommendation}</p>
              </div>
            </div>

            {/* Violation Categories */}
            {testResults.violations?.details && testResults.violations.details.length > 0 && (
              <div className="violation-categories">
                <h4>Violation Breakdown</h4>
                <div className="category-grid">
                  {Object.entries(testResults.violationAnalysis.categorizedViolations).map(([category, violations]) => 
                    violations.length > 0 && (
                      <div key={category} className="category-card">
                        <div className="category-header">
                          <span className="category-name">{category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                          <span className="category-count">{violations.length}</span>
                        </div>
                        <div className="category-violations">
                          {violations.map((violation, index) => (
                            <div key={index} className="mini-violation">
                              <span className="mini-time">{new Date(violation.timestamp).toLocaleTimeString()}</span>
                              <span className="mini-desc">{violation.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            {testResults.violationAnalysis.timeline.length > 0 && (
              <div className="violation-timeline">
                <h4>Violation Timeline</h4>
                <div className="timeline">
                  {testResults.violationAnalysis.timeline.map((item) => (
                    <div key={item.sequence} className={`timeline-item ${item.severity.toLowerCase()}`}>
                      <div className="timeline-marker">{item.sequence}</div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-time">{item.timeFormatted}</span>
                          <span className={`timeline-severity ${item.severity.toLowerCase()}`}>
                            {item.severity} Risk
                          </span>
                        </div>
                        <div className="timeline-description">{item.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {testResults.violationAnalysis.recommendations.length > 0 && (
              <div className="recommendations-section">
                <h4>📋 Recommendations</h4>
                <ul className="recommendations-list">
                  {testResults.violationAnalysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="recommendation-item">
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="actions">
          <button 
            onClick={() => navigate('/')}
            className="dashboard-btn"
          >
            Back to Dashboard
          </button>
          <button 
            onClick={() => window.print()}
            className="print-btn"
          >
            Print Results
          </button>
        </div>

        {/* Fullscreen Exit Section */}
        {permissions.fullscreen && (
          <div className="fullscreen-exit-section">
            <div className="fullscreen-notice">
              <h4>🖥️ Still in Fullscreen Mode</h4>
              <p>You can now safely exit fullscreen mode if you wish to continue using your browser normally.</p>
              <button 
                onClick={exitFullscreen}
                className="exit-fullscreen-btn"
              >
                Exit Fullscreen
              </button>
            </div>
          </div>
        )}

        <div className="footer-note">
          <p>
            Test completed on {new Date(testResults.submittedAt).toLocaleString()}.
            {testResults.violations?.autoSubmitted && 
              ` This test was automatically submitted after reaching the maximum allowed violations (${testResults.violations.maxViolations}).`}
            {isViolationSubmission && !testResults.violations?.autoSubmitted && 
              ' This test was automatically submitted due to a critical security breach (fullscreen exit or multiple people detected).'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubmissionPage;
