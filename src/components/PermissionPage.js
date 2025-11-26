import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProctor } from '../context/ProctorContext';
import './PermissionPage.css';

const PermissionPage = () => {
  const navigate = useNavigate();
  const { requestMediaPermissions, requestFullscreen, permissions } = useProctor();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

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
      alert(`Failed to ${step.title.toLowerCase()}. Please try again or check your browser settings.`);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // All permissions granted, navigate to problem list
      navigate('/problems');
    }
  };

  const allPermissionsGranted = steps.every(step => step.completed);

  return (
    <div className="permission-page">
      <div className="permission-container">
        <div className="header">
          <h1>CodeBud - Proctored DSA Platform</h1>
          <p>Before starting your test, we need to set up monitoring permissions</p>
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
              onClick={() => navigate('/problems')}
            >
              Start Test 🚀
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
