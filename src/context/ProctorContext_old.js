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
    violations: [],
    violationCount: 0,
    maxViolations: 5
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
    setProctorState(prev => {
      const newViolationCount = prev.violationCount + 1;
      const shouldSubmit = newViolationCount >= prev.maxViolations;
      
      return {
        ...prev,
        violations: [...prev.violations, violation],
        violationCount: newViolationCount,
        testSubmitted: shouldSubmit,
        tabSwitched: shouldSubmit
      };
    });
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
        addViolation('WARNING', 'Tab switched or window minimized during test');
      }
    };

    const handleBlur = () => {
      if (document.visibilityState === 'visible') {
        addViolation('WARNING', 'Lost focus - switched to another application');
      }
    };

    const handleKeydown = (e) => {
      // Prevent copy, cut, paste operations
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key === 'c' || e.key === 'x' || e.key === 'v' || e.key === 'a')
      ) {
        e.preventDefault();
        addViolation('WARNING', `Attempted to use ${e.key === 'c' ? 'copy' : e.key === 'x' ? 'cut' : e.key === 'v' ? 'paste' : 'select all'}`);
        return;
      }

      // Prevent common shortcuts that could be used to cheat
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key === 't' || e.key === 'w' || e.key === 'n' || e.key === 'r' || e.key === 'Tab')
      ) {
        e.preventDefault();
        addViolation('WARNING', 'Attempted to use prohibited keyboard shortcut');
        return;
      }

      // Prevent Alt+Tab (Windows/Linux)
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        addViolation('WARNING', 'Attempted to switch applications using Alt+Tab');
        return;
      }

      // Prevent Cmd+Tab (Mac)
      if (e.metaKey && e.key === 'Tab') {
        e.preventDefault();
        addViolation('WARNING', 'Attempted to switch applications using Cmd+Tab');
        return;
      }
      
      // Prevent F12 and other function keys (dev tools) - These are critical
      if (e.key === 'F12') {
        e.preventDefault();
        submitTestDueToViolation('Attempted to open developer tools (F12)');
        return;
      }

      if (e.key === 'F1' || e.key === 'F5' || e.key === 'F11') {
        e.preventDefault();
        addViolation('WARNING', `Attempted to use function key: ${e.key}`);
        return;
      }

      // Prevent Ctrl/Cmd + Shift + I (dev tools) - Critical
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        submitTestDueToViolation('Attempted to open developer tools');
        return;
      }

      // Prevent Ctrl/Cmd + Shift + J (console) - Critical
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        submitTestDueToViolation('Attempted to open console');
        return;
      }

      // Prevent Ctrl/Cmd + U (view source)
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        addViolation('WARNING', 'Attempted to view page source');
        return;
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      addViolation('WARNING', 'Right-click attempted');
    };

    // Prevent copy/paste operations
    const handleCopy = (e) => {
      e.preventDefault();
      e.clipboardData.setData('text/plain', '');
      addViolation('WARNING', 'Copy operation attempted');
    };

    const handleCut = (e) => {
      e.preventDefault();
      e.clipboardData.setData('text/plain', '');
      addViolation('WARNING', 'Cut operation attempted');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      addViolation('WARNING', 'Paste operation attempted');
    };

    // Prevent drag and drop
    const handleDragStart = (e) => {
      e.preventDefault();
      addViolation('WARNING', 'Drag operation attempted');
    };

    const handleDrop = (e) => {
      e.preventDefault();
      addViolation('WARNING', 'Drop operation attempted');
    };

    // Prevent text selection in certain areas
    const handleSelectStart = (e) => {
      // Allow text selection only in input fields and textareas
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
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
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('selectstart', handleSelectStart);

    // Disable print functionality
    window.addEventListener('beforeprint', (e) => {
      e.preventDefault();
      addViolation('WARNING', 'Print operation attempted');
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('selectstart', handleSelectStart);
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
