import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProctor } from '../context/ProctorContext';
import { getEnvironmentInfo, getPermissionInstructions } from '../utils/environmentCheck';
import './PermissionPage.css';

const PermissionPage = () => {
  const navigate = useNavigate();
  const { testType } = useParams();
  const { requestMediaPermissions, requestFullscreen, permissions } = useProctor();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState({
    camera: 'prompt',
    microphone: 'prompt'
  });
  const [environmentInfo, setEnvironmentInfo] = useState(null);

  // Redirect to dashboard if no test type is specified
  React.useEffect(() => {
    if (!testType || (testType !== 'aptitude' && testType !== 'dsa')) {
      navigate('/');
    }
  }, [testType, navigate]);

  // Check environment and permission status
  useEffect(() => {
    const envInfo = getEnvironmentInfo();
    setEnvironmentInfo(envInfo);

    const checkPermissions = async () => {
      if (navigator.permissions) {
        try {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' });
          const microphonePermission = await navigator.permissions.query({ name: 'microphone' });
          
          setPermissionStatus({
            camera: cameraPermission.state,
            microphone: microphonePermission.state
          });

          // Listen for permission changes
          cameraPermission.onchange = () => {
            setPermissionStatus(prev => ({
              ...prev,
              camera: cameraPermission.state
            }));
          };

          microphonePermission.onchange = () => {
            setPermissionStatus(prev => ({
              ...prev,
              microphone: microphonePermission.state
            }));
          };
        } catch (error) {
          console.log('Permission API not fully supported:', error);
        }
      }
    };
    
    checkPermissions();
  }, []);

  const getTestTypeInfo = () => {
    switch (testType) {
      case 'aptitude':
        return {
          title: 'Aptitude Test',
          description: 'Complete the logical reasoning and quantitative aptitude assessment',
          nextRoute: '/aptitude-test' // We'll create this route
        };
      case 'dsa':
        return {
          title: 'DSA Problems',
          description: 'Solve Data Structures and Algorithms coding challenges',
          nextRoute: '/problems'
        };
      default:
        return {
          title: 'Assessment',
          description: 'Complete your assessment',
          nextRoute: '/problems'
        };
    }
  };

  const testInfo = getTestTypeInfo();

  const steps = [
    {
      title: 'Camera Access',
      description: 'We need access to your camera to monitor you during the test',
      icon: '📷',
      action: async () => {
        setLoading(true);
        const success = await requestMediaPermissions();
        setLoading(false);
        return success;
      },
      completed: permissions.camera && permissions.microphone
    },
    {
      title: 'Fullscreen Mode',
      description: 'The test must be taken in fullscreen mode to prevent cheating',
      icon: '🖥️',
      action: async () => {
        setLoading(true);
        const success = await requestFullscreen();
        setLoading(false);
        return success;
      },
      completed: permissions.fullscreen
    }
  ];

  const handleStepAction = async () => {
    const step = steps[currentStep];
    if (step.completed) {
      nextStep();
      return;
    }

    const success = await step.action();
    if (success) {
      nextStep();
    } else {
      // More detailed error handling is now in the ProctorContext
      console.log(`Failed to ${step.title.toLowerCase()}`);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // All permissions granted, navigate to appropriate test
      navigate(testInfo.nextRoute);
    }
  };

  const allPermissionsGranted = steps.every(step => step.completed);

  return (
    <div className="permission-page">
      <div className="permission-container">
        <div className="header">
          <h1>CodeBud - {testInfo.title}</h1>
          <p>Before starting your {testType} test, we need to set up monitoring permissions</p>
          {!window.location.protocol.includes('https') && window.location.hostname !== 'localhost' && (
            <div style={{
              background: '#fed7d7',
              border: '1px solid #feb2b2',
              borderRadius: '8px',
              padding: '15px',
              margin: '20px 0',
              color: '#c53030'
            }}>
              ⚠️ <strong>HTTPS Required:</strong> Camera and microphone access requires a secure connection. 
              Please access this site via HTTPS for permissions to work properly.
            </div>
          )}
          
          {environmentInfo && !environmentInfo.isCompatible && (
            <div style={{
              background: '#fed7d7',
              border: '1px solid #feb2b2',
              borderRadius: '8px',
              padding: '15px',
              margin: '20px 0',
              color: '#c53030'
            }}>
              ⚠️ <strong>Compatibility Issues Detected:</strong>
              <ul style={{ textAlign: 'left', marginTop: '10px' }}>
                {environmentInfo.issues.map(issue => (
                  <li key={issue}>
                    <strong>{issue}:</strong> Not supported in your current browser/environment
                  </li>
                ))}
              </ul>
              <p><strong>Recommendation:</strong> Use the latest version of Chrome, Firefox, or Safari for best compatibility.</p>
            </div>
          )}
        </div>

        <div className="steps-progress">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`step ${index === currentStep ? 'active' : ''} ${step.completed ? 'completed' : ''}`}
            >
              <div className="step-number">
                {step.completed ? '✓' : index + 1}
              </div>
              <div className="step-title">{step.title}</div>
            </div>
          ))}
        </div>

        <div className="current-step">
          <div className="step-icon">
            {steps[currentStep].icon}
          </div>
          <h2>{steps[currentStep].title}</h2>
          <p>{steps[currentStep].description}</p>

          <div className="permissions-info">
            <h3>Why do we need these permissions?</h3>
            <ul>
              <li>📷 <strong>Camera & Microphone:</strong> To ensure test integrity and prevent cheating</li>
              <li>🖥️ <strong>Fullscreen:</strong> To prevent access to other applications during the test</li>
              <li>🔒 <strong>Tab Monitoring:</strong> Switching tabs will automatically submit your test</li>
            </ul>
          </div>

          {(permissionStatus.camera === 'denied' || permissionStatus.microphone === 'denied') && (
            <div className="permission-denied-help">
              <h3>🚨 Permissions Blocked</h3>
              <p>Camera or microphone access has been blocked. To fix this:</p>
              {environmentInfo && (
                <>
                  <p><strong>For {environmentInfo.browser}:</strong></p>
                  <ol>
                    <li>{getPermissionInstructions(environmentInfo.browser).camera}</li>
                  </ol>
                </>
              )}
              <p><strong>General steps:</strong></p>
              <ol>
                <li>Look for a <strong>camera/microphone icon</strong> in your browser's address bar (usually on the left side)</li>
                <li>Click on it and change the setting to <strong>"Allow"</strong></li>
                <li>Click the "Retry Permissions" button below</li>
              </ol>
              <button 
                className="retry-btn" 
                onClick={() => window.location.reload()}
                style={{
                  background: '#f6ad55',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                🔄 Retry Permissions
              </button>
            </div>
          )}

          <div className="warning-box">
            ⚠️ <strong>Important:</strong> Once the test starts:
            <br />• Do not switch tabs or applications
            <br />• Do not exit fullscreen mode
            <br />• Do not open developer tools
            <br />• Any violation will automatically submit your test
          </div>

          <button 
            className="permission-btn" 
            onClick={handleStepAction}
            disabled={loading}
          >
            {loading ? 'Loading...' : 
             steps[currentStep].completed ? 'Continue' : 
             `Grant ${steps[currentStep].title}`}
          </button>

          {allPermissionsGranted && (
            <button 
              className="start-test-btn"
              onClick={() => navigate(testInfo.nextRoute)}
            >
              Start {testInfo.title} 🚀
            </button>
          )}
        </div>

        <div className="footer">
          <p>By continuing, you agree to the monitoring terms and conditions.</p>
        </div>
      </div>
    </div>
  );
};

export default PermissionPage;
