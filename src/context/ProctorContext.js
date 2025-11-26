import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ProctorContext = createContext();

export const useProctor = () => {
  const context = useContext(ProctorContext);
  if (!context) {
    throw new Error('useProctor must be used within a ProctorProvider');
  }
  return context;
};

export const ProctorProvider = ({ children }) => {
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false,
    fullscreen: false
  });
  
  const [proctorState, setProctorState] = useState({
    isMonitoring: false,
    tabSwitched: false,
    testSubmitted: false,
    violations: []
  });

  const [mediaStream, setMediaStream] = useState(null);

  // Request camera and microphone permissions
  const requestMediaPermissions = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setMediaStream(stream);
      setPermissions(prev => ({
        ...prev,
        camera: true,
        microphone: true
      }));
      return true;
    } catch (error) {
      console.error('Failed to get media permissions:', error);
      return false;
    }
  }, []);

  // Request fullscreen
  const requestFullscreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setPermissions(prev => ({ ...prev, fullscreen: true }));
        return true;
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      return false;
    }
  }, []);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    setProctorState(prev => ({ ...prev, isMonitoring: true }));
  }, []);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setProctorState(prev => ({ ...prev, isMonitoring: false }));
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
  }, [mediaStream]);

  // Add violation
  const addViolation = useCallback((type, description) => {
    const violation = {
      id: Date.now(),
      type,
      description,
      timestamp: new Date().toISOString()
    };
    setProctorState(prev => ({
      ...prev,
      violations: [...prev.violations, violation]
    }));
  }, []);

  // Submit test due to violation
  const submitTestDueToViolation = useCallback((reason) => {
    const violation = {
      id: Date.now(),
      type: 'CRITICAL',
      description: reason,
      timestamp: new Date().toISOString()
    };
    setProctorState(prev => ({
      ...prev,
      violations: [...prev.violations, violation],
      testSubmitted: true,
      tabSwitched: true
    }));
  }, []);

  // Monitor tab switching
  useEffect(() => {
    if (!proctorState.isMonitoring || proctorState.testSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        submitTestDueToViolation('Tab switched or window minimized during test');
      }
    };

    const handleBlur = () => {
      if (document.visibilityState === 'visible') {
        submitTestDueToViolation('Lost focus - switched to another application');
      }
    };

    const handleKeydown = (e) => {
      // Prevent common shortcuts that could be used to cheat
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key === 't' || e.key === 'w' || e.key === 'n' || e.key === 'r' || e.key === 'Tab')
      ) {
        e.preventDefault();
        submitTestDueToViolation('Attempted to use prohibited keyboard shortcut');
      }
      
      // Prevent F12 (dev tools)
      if (e.key === 'F12') {
        e.preventDefault();
        submitTestDueToViolation('Attempted to open developer tools');
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      addViolation('WARNING', 'Right-click attempted');
    };

    // Monitor fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        submitTestDueToViolation('Exited fullscreen mode during test');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [proctorState.isMonitoring, proctorState.testSubmitted, submitTestDueToViolation, addViolation]);

  const value = {
    permissions,
    proctorState,
    mediaStream,
    requestMediaPermissions,
    requestFullscreen,
    startMonitoring,
    stopMonitoring,
    addViolation,
    submitTestDueToViolation
  };

  return (
    <ProctorContext.Provider value={value}>
      {children}
    </ProctorContext.Provider>
  );
};
