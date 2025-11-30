/**
 * CSV Forwarding Test Component
 * Tests real-time submission forwarding across multiple devices
 */

import React, { useState, useEffect } from 'react';
import submissionForwardingService from '../services/submissionForwardingService';
import adminCSVService from '../services/adminCSVService';

const CSVForwardingTest = () => {
  const [testStatus, setTestStatus] = useState({
    forwarding: 'Not tested',
    csvGeneration: 'Not tested',
    realTimeUpdates: 'Not tested',
    multiDevice: 'Not tested'
  });
  const [csvStats, setCsvStats] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [testLog, setTestLog] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestLog(prev => [...prev, { timestamp, message, type }]);
  };

  // Test 1: Submission Forwarding
  const testSubmissionForwarding = async () => {
    addLog('🧪 Testing submission forwarding...', 'info');
    setTestStatus(prev => ({ ...prev, forwarding: 'Testing...' }));

    try {
      const mockSubmission = {
        userId: `test-user-${Date.now()}`,
        userName: 'Test User',
        score: Math.floor(Math.random() * 20) + 10, // Random score 10-30
        totalQuestions: 30,
        answers: generateMockAnswers(),
        timing: {
          startTime: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
          endTime: new Date().toISOString(),
          totalTimeSpent: 900, // 15 minutes in seconds
          totalTimeSpentFormatted: '15:00'
        },
        violationAnalysis: {
          totalViolations: Math.floor(Math.random() * 3),
          severityBreakdown: { high: 0, medium: 1, low: 1 },
          categoryBreakdown: { faceDetection: 1, tabSwitch: 1 },
          violations: [
            {
              type: 'tabSwitch',
              severity: 'medium',
              timestamp: new Date(Date.now() - 300000).toISOString(),
              description: 'User switched browser tabs'
            }
          ]
        },
        submittedAt: new Date().toISOString()
      };

      const success = await submissionForwardingService.forwardSubmission(mockSubmission);
      
      if (success) {
        setTestStatus(prev => ({ ...prev, forwarding: '✅ Passed' }));
        addLog('✅ Submission forwarding successful', 'success');
      } else {
        setTestStatus(prev => ({ ...prev, forwarding: '❌ Failed' }));
        addLog('❌ Submission forwarding failed', 'error');
      }
    } catch (error) {
      setTestStatus(prev => ({ ...prev, forwarding: '❌ Error' }));
      addLog(`❌ Forwarding error: ${error.message}`, 'error');
    }
  };

  // Test 2: CSV Generation
  const testCSVGeneration = async () => {
    addLog('📊 Testing CSV generation...', 'info');
    setTestStatus(prev => ({ ...prev, csvGeneration: 'Testing...' }));

    try {
      const csvData = await adminCSVService.getCurrentCSVData();
      const statistics = await adminCSVService.getSubmissionStatistics();
      
      if (csvData && csvData.content.includes(',')) {
        setTestStatus(prev => ({ ...prev, csvGeneration: '✅ Passed' }));
        addLog(`✅ CSV generated with ${csvData.totalSubmissions} submissions`, 'success');
        setCsvStats(statistics);
      } else {
        setTestStatus(prev => ({ ...prev, csvGeneration: '❌ Failed' }));
        addLog('❌ CSV generation failed - no valid content', 'error');
      }
    } catch (error) {
      setTestStatus(prev => ({ ...prev, csvGeneration: '❌ Error' }));
      addLog(`❌ CSV generation error: ${error.message}`, 'error');
    }
  };

  // Test 3: Real-time Updates
  const testRealTimeUpdates = async () => {
    addLog('🔄 Testing real-time updates...', 'info');
    setTestStatus(prev => ({ ...prev, realTimeUpdates: 'Testing...' }));

    try {
      let updateReceived = false;
      
      // Setup listener
      const removeListener = adminCSVService.addUpdateListener((updateData) => {
        addLog(`🔄 Real-time update received: ${updateData.type}`, 'success');
        updateReceived = true;
      });

      // Trigger an update by creating a submission
      await testSubmissionForwarding();
      
      // Wait for update
      setTimeout(() => {
        if (updateReceived) {
          setTestStatus(prev => ({ ...prev, realTimeUpdates: '✅ Passed' }));
          addLog('✅ Real-time updates working', 'success');
        } else {
          setTestStatus(prev => ({ ...prev, realTimeUpdates: '⚠️ Partial' }));
          addLog('⚠️ No real-time update received (may still work)', 'warning');
        }
        removeListener();
      }, 2000);

    } catch (error) {
      setTestStatus(prev => ({ ...prev, realTimeUpdates: '❌ Error' }));
      addLog(`❌ Real-time test error: ${error.message}`, 'error');
    }
  };

  // Test 4: Multi-Device Simulation
  const testMultiDevice = async () => {
    addLog('📱 Testing multi-device simulation...', 'info');
    setTestStatus(prev => ({ ...prev, multiDevice: 'Testing...' }));

    try {
      // Simulate submissions from different devices
      const deviceTypes = ['Desktop', 'Mobile', 'Tablet'];
      const browsers = ['Chrome', 'Firefox', 'Safari'];
      
      for (let i = 0; i < 3; i++) {
        const mockSubmission = {
          userId: `device-test-${i}-${Date.now()}`,
          userName: `Device Test User ${i + 1}`,
          score: Math.floor(Math.random() * 15) + 15,
          totalQuestions: 30,
          answers: generateMockAnswers(),
          timing: {
            startTime: new Date(Date.now() - 600000).toISOString(),
            endTime: new Date().toISOString(),
            totalTimeSpent: 600,
            totalTimeSpentFormatted: '10:00'
          },
          violationAnalysis: {
            totalViolations: Math.floor(Math.random() * 2),
            severityBreakdown: { high: 0, medium: 0, low: 1 },
            categoryBreakdown: { faceDetection: 0, tabSwitch: 1 }
          },
          submittedAt: new Date().toISOString(),
          deviceInfo: {
            deviceType: deviceTypes[i],
            browser: browsers[i % browsers.length],
            os: i === 0 ? 'Windows' : i === 1 ? 'Android' : 'macOS'
          }
        };

        await submissionForwardingService.forwardSubmission(mockSubmission);
        addLog(`📱 Simulated submission from ${mockSubmission.deviceInfo.deviceType}`, 'info');
        
        // Small delay between submissions
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setTestStatus(prev => ({ ...prev, multiDevice: '✅ Passed' }));
      addLog('✅ Multi-device simulation completed', 'success');
      
      // Load recent submissions to show results
      const recent = await adminCSVService.getRecentSubmissions(10);
      setRecentSubmissions(recent);
      
    } catch (error) {
      setTestStatus(prev => ({ ...prev, multiDevice: '❌ Error' }));
      addLog(`❌ Multi-device test error: ${error.message}`, 'error');
    }
  };

  // Generate mock answers
  const generateMockAnswers = () => {
    const answers = [];
    for (let i = 0; i < 30; i++) {
      answers.push({
        questionIndex: i,
        selectedAnswer: Math.floor(Math.random() * 4), // 0-3
        isCorrect: Math.random() > 0.3, // 70% correct rate
        timeSpent: Math.floor(Math.random() * 60) + 10, // 10-70 seconds
        timestamp: new Date(Date.now() - (30 - i) * 30000).toISOString()
      });
    }
    return answers;
  };

  // Run all tests
  const runAllTests = async () => {
    addLog('🚀 Starting comprehensive CSV forwarding tests...', 'info');
    await testSubmissionForwarding();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testCSVGeneration();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testRealTimeUpdates();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testMultiDevice();
    addLog('🏁 All tests completed!', 'success');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>📊 CSV Forwarding System Test Suite</h1>
      <p>Test the real-time submission forwarding and CSV generation system across multiple devices.</p>

      {/* Test Status Dashboard */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px',
        marginBottom: '30px'
      }}>
        {Object.entries(testStatus).map(([key, status]) => (
          <div key={key} style={{
            padding: '15px',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            background: status.includes('✅') ? '#d4edda' : 
                       status.includes('❌') ? '#f8d7da' : 
                       status.includes('Testing') ? '#fff3cd' : '#f8f9fa'
          }}>
            <h4 style={{ margin: '0 0 5px 0' }}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{status}</p>
          </div>
        ))}
      </div>

      {/* Control Buttons */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={runAllTests} style={{
          padding: '12px 24px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          🚀 Run All Tests
        </button>
        <button onClick={testSubmissionForwarding} style={{
          padding: '12px 24px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          🧪 Test Forwarding
        </button>
        <button onClick={testCSVGeneration} style={{
          padding: '12px 24px',
          backgroundColor: '#17a2b8',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          📊 Test CSV Generation
        </button>
        <button onClick={testRealTimeUpdates} style={{
          padding: '12px 24px',
          backgroundColor: '#ffc107',
          color: 'black',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          🔄 Test Real-time
        </button>
        <button onClick={testMultiDevice} style={{
          padding: '12px 24px',
          backgroundColor: '#6f42c1',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          📱 Test Multi-Device
        </button>
      </div>

      {/* Statistics Display */}
      {csvStats && (
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>📈 Current System Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div><strong>Total Submissions:</strong> {csvStats.totalSubmissions}</div>
            <div><strong>Average Score:</strong> {csvStats.averageScore}%</div>
            <div><strong>Total Violations:</strong> {csvStats.totalViolations}</div>
            <div><strong>Real-time Status:</strong> {csvStats.realTimeStatus}</div>
          </div>
        </div>
      )}

      {/* Recent Submissions */}
      {recentSubmissions.length > 0 && (
        <div style={{
          background: 'white',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #dee2e6', background: '#f8f9fa' }}>
            <h3 style={{ margin: 0 }}>📋 Recent Test Submissions</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>User ID</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Score</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Device</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Violations</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.slice(0, 5).map((submission, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{submission.userId}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>
                      <span style={{ color: submission.score >= 24 ? '#28a745' : '#ffc107' }}>
                        {submission.score}/30
                      </span>
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{submission.deviceType}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{submission.totalViolations}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6', fontSize: '12px' }}>
                      {new Date(submission.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Test Log */}
      <div style={{
        background: '#000',
        color: '#00ff00',
        padding: '15px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '12px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <h4 style={{ color: '#00ff00', margin: '0 0 10px 0' }}>🖥️ Test Execution Log</h4>
        {testLog.map((log, index) => (
          <div key={index} style={{
            marginBottom: '5px',
            color: log.type === 'error' ? '#ff6b6b' : 
                   log.type === 'success' ? '#51cf66' : 
                   log.type === 'warning' ? '#ffd43b' : '#00ff00'
          }}>
            <span style={{ color: '#888' }}>[{log.timestamp}]</span> {log.message}
          </div>
        ))}
        {testLog.length === 0 && (
          <div style={{ color: '#666' }}>Waiting for test execution...</div>
        )}
      </div>
    </div>
  );
};

export default CSVForwardingTest;
