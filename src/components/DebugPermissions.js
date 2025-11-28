import React, { useState, useEffect } from 'react';
import { getEnvironmentInfo } from '../utils/environmentCheck';

const DebugPermissions = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [permissionStates, setPermissionStates] = useState({});

  useEffect(() => {
    const gatherDebugInfo = async () => {
      const envInfo = getEnvironmentInfo();
      
      const info = {
        environment: envInfo,
        url: window.location.href,
        protocol: window.location.protocol,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      // Check permission states
      const states = {};
      if (navigator.permissions) {
        try {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' });
          const microphonePermission = await navigator.permissions.query({ name: 'microphone' });
          
          states.camera = cameraPermission.state;
          states.microphone = microphonePermission.state;
        } catch (error) {
          states.error = error.message;
        }
      }

      setDebugInfo(info);
      setPermissionStates(states);
    };

    gatherDebugInfo();
  }, []);

  const testMediaAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log('✅ Media access successful:', stream);
      alert('✅ Camera and microphone access successful!');
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('❌ Media access failed:', error);
      alert(`❌ Media access failed: ${error.message}`);
    }
  };

  if (!debugInfo) return <div>Loading debug info...</div>;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999
    }}>
      <h4>Debug Info</h4>
      <div>
        <strong>Environment:</strong>
        <ul>
          <li>Browser: {debugInfo.environment.browser}</li>
          <li>Compatible: {debugInfo.environment.isCompatible ? '✅' : '❌'}</li>
          <li>Issues: {debugInfo.environment.issues.join(', ') || 'None'}</li>
          <li>Secure: {debugInfo.environment.support.isSecure ? '✅' : '❌'}</li>
        </ul>
      </div>
      
      <div>
        <strong>Permissions:</strong>
        <ul>
          <li>Camera: {permissionStates.camera || 'Unknown'}</li>
          <li>Microphone: {permissionStates.microphone || 'Unknown'}</li>
          {permissionStates.error && <li>Error: {permissionStates.error}</li>}
        </ul>
      </div>

      <button 
        onClick={testMediaAccess}
        style={{
          background: '#4299e1',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        Test Media Access
      </button>
    </div>
  );
};

export default DebugPermissions;
