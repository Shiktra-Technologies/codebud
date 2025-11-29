import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { 
  optimizeMemoryUsage, 
  performanceMetrics, 
  adaptiveQuality, 
  errorHandling 
} from '../utils/performanceOptimization';

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
    maxViolations: 5,
    autoSubmitted: false
  });

  const [mediaStream, setMediaStream] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [deviceCapabilities, setDeviceCapabilities] = useState(null);
  const [optimalSettings, setOptimalSettings] = useState(null);
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const modelRef = useRef(null);
  const performanceRef = useRef({
    lastCleanup: Date.now(),
    memoryUsage: [],
    errorCount: 0
  });

  // Initialize device capabilities and optimal settings
  useEffect(() => {
    const capabilities = adaptiveQuality.getDeviceCapabilities();
    const settings = adaptiveQuality.getOptimalSettings(capabilities);
    
    setDeviceCapabilities(capabilities);
    setOptimalSettings(settings);
    
    console.log('🔧 Device capabilities detected:', capabilities);
    console.log('⚙️ Optimal settings applied:', settings);
  }, []);

  // Load models with optimization
  useEffect(() => {
    const loadModelsOptimized = async () => {
      if (!optimalSettings?.enableAIDetection) {
        console.log('🔄 AI detection disabled for performance - using basic monitoring');
        setModelsLoaded(true);
        return;
      }

      try {
        // Set optimized TensorFlow backend
        await tf.setBackend('webgl');
        await tf.ENV.set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
        await tf.ENV.set('WEBGL_FORCE_F16_TEXTURES', true);
        
        // Load lighter model for better performance
        const model = await errorHandling.retryOperation(
          () => cocoSsd.load({ base: 'lite_mobilenet_v2' }),
          3,
          2000
        );
        
        modelRef.current = model;
        setModelsLoaded(true);
        console.log('✅ Optimized AI model loaded successfully');
        
      } catch (error) {
        console.warn('⚠️ AI model loading failed, falling back to basic monitoring:', error);
        setModelsLoaded(true); // Continue with basic monitoring
      }
    };

    if (optimalSettings) {
      loadModelsOptimized();
    }
  }, [optimalSettings]);

  // Performance monitoring and cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastCleanup = now - performanceRef.current.lastCleanup;
      
      if (timeSinceLastCleanup >= optimizeMemoryUsage.memoryCleanupInterval) {
        // Memory cleanup
        if (window.gc) {
          window.gc();
        }
        
        // TensorFlow memory cleanup
        tf.engine().disposeVariables();
        
        // Performance monitoring
        const memoryInfo = performanceMetrics.memoryUsage();
        if (memoryInfo) {
          performanceRef.current.memoryUsage.push({
            timestamp: now,
            ...memoryInfo
          });
          
          // Keep only last 10 measurements
          if (performanceRef.current.memoryUsage.length > 10) {
            performanceRef.current.memoryUsage.shift();
          }
        }
        
        performanceRef.current.lastCleanup = now;
        console.log('🧹 Performance cleanup completed');
      }
    }, optimizeMemoryUsage.memoryCleanupInterval);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Optimized media permissions request
  const requestMediaPermissions = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported');
      }

      // Use optimized constraints based on device capabilities
      const constraints = {
        video: optimalSettings?.videoResolution ? {
          width: { ideal: optimalSettings.videoResolution.width },
          height: { ideal: optimalSettings.videoResolution.height },
          facingMode: 'user',
          frameRate: { ideal: 15, max: 30 } // Reduced FPS for performance
        } : optimizeMemoryUsage.videoConstraints,
        audio: optimalSettings?.audioSampleRate ? 
          { ...optimizeMemoryUsage.audioConstraints, sampleRate: optimalSettings.audioSampleRate } :
          optimizeMemoryUsage.audioConstraints
      };

      console.log('📹 Requesting optimized media with constraints:', constraints);
      
      const stream = await errorHandling.retryOperation(
        () => navigator.mediaDevices.getUserMedia(constraints),
        3,
        1000
      );
      
      console.log('✅ Optimized media permissions granted successfully');
      setMediaStream(stream);
      setPermissions(prev => ({
        ...prev,
        camera: true,
        microphone: true
      }));
      
      return true;
    } catch (error) {
      console.error('❌ Media permissions failed:', error);
      
      let errorMessage = 'Failed to access camera and microphone. ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera and microphone access when prompted, or:\n1. Click the camera icon in your browser\'s address bar\n2. Change settings to "Allow"\n3. Refresh this page';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera or microphone found. Please connect these devices and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera or microphone is being used by another application. Please close other applications and try again.';
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      alert(errorMessage);
      return false;
    }
  }, [optimalSettings]);

  // Request fullscreen
  const requestFullscreen = useCallback(async () => {
    try {
      // Check if fullscreen is supported
      const docEl = document.documentElement;
      if (!docEl.requestFullscreen && !docEl.webkitRequestFullscreen && !docEl.mozRequestFullScreen && !docEl.msRequestFullscreen) {
        alert('Fullscreen mode is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        return false;
      }

      // Try different fullscreen methods for browser compatibility
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        await docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }
      
      // Small delay to ensure fullscreen is active
      setTimeout(() => {
        if (document.fullscreenElement || document.webkitFullscreenElement || 
            document.mozFullScreenElement || document.msFullscreenElement) {
          setPermissions(prev => ({ ...prev, fullscreen: true }));
        }
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      
      if (error.name === 'NotAllowedError') {
        alert('Fullscreen access was denied. Please:\n1. Click "Allow" when prompted for fullscreen\n2. Or press F11 to enter fullscreen manually\n3. Refresh this page if needed');
      } else {
        alert('Failed to enter fullscreen mode. Please try pressing F11 or check your browser settings.');
      }
      return false;
    }
  }, []);

  // Start monitoring with performance optimization
  const startMonitoring = useCallback(() => {
    console.log('🔍 Starting optimized monitoring...');
    setProctorState(prev => ({ ...prev, isMonitoring: true }));
  }, []);

  // Pause monitoring (keeps permissions active)
  const pauseMonitoring = useCallback(() => {
    console.log('⏸️ Pausing monitoring (permissions maintained)');
    setProctorState(prev => ({ ...prev, isMonitoring: false }));
  }, []);

  // Stop monitoring and cleanup (only call when truly needed)
  const stopMonitoring = useCallback(() => {
    console.log('🛑 Stopping monitoring with full cleanup');
    setProctorState(prev => ({ ...prev, isMonitoring: false }));
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    // Reset permissions state
    setPermissions(prev => ({
      ...prev,
      camera: false,
      microphone: false
    }));
  }, [mediaStream]);

  // Exit fullscreen gracefully
  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    setPermissions(prev => ({ ...prev, fullscreen: false }));
  }, []);

  // Complete test cleanup - exits fullscreen and stops camera
  const completeTestCleanup = useCallback(() => {
    console.log('🧹 Starting optimized test cleanup');
    
    // Immediate state updates first (UI responsiveness)
    setProctorState(prev => ({ 
      ...prev, 
      isMonitoring: false,
      testSubmitted: true
    }));
    
    setPermissions({
      camera: false,
      microphone: false,
      fullscreen: false
    });

    // Heavy operations run asynchronously
    setTimeout(() => {
      // Exit fullscreen (async, doesn't block)
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        try { document.webkitExitFullscreen(); } catch(e) {}
      } else if (document.mozCancelFullScreen) {
        try { document.mozCancelFullScreen(); } catch(e) {}
      } else if (document.msExitFullscreen) {
        try { document.msExitFullscreen(); } catch(e) {}
      }
    }, 0);

    // Media cleanup in next tick
    setTimeout(() => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (error) {
            console.warn('Error stopping track:', error);
          }
        });
        setMediaStream(null);
      }
      
      // Close audio context
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
          audioContextRef.current = null;
        } catch (error) {
          console.warn('Error closing audio context:', error);
        }
      }
    }, 50);
    
    console.log('✅ Optimized cleanup initiated');
  }, [mediaStream]);

  // Optimized violation tracking
  const addViolation = useCallback((type, description) => {
    if (proctorState.testSubmitted) return;

    const violation = {
      id: Date.now(),
      type,
      description,
      timestamp: new Date().toISOString()
    };
    
    setProctorState(prev => ({
      ...prev,
      violations: [...prev.violations, violation],
      violationCount: prev.violationCount + 1
    }));
    
    console.log('⚠️ Violation recorded:', violation);
  }, [proctorState.testSubmitted]);

  // Submit test due to violation
  const submitTestDueToViolation = useCallback((reason) => {
    const violation = {
      id: Date.now(),
      type: 'CRITICAL',
      description: reason,
      timestamp: new Date().toISOString()
    };
    
    console.log('🚨 Critical violation - auto-submitting test:', reason);
    
    setProctorState(prev => ({
      ...prev,
      violations: [...prev.violations, violation],
      violationCount: prev.violationCount + 1,
      testSubmitted: true,
      tabSwitched: true,
      autoSubmitted: true
    }));
  }, []);

  // Monitor violation count and auto-submit at maximum violations
  useEffect(() => {
    if (proctorState.violationCount >= proctorState.maxViolations && !proctorState.testSubmitted && proctorState.isMonitoring) {
      const violationSummary = proctorState.violations.map(v => v.description).join(', ');
      submitTestDueToViolation(`Maximum violations exceeded (${proctorState.violationCount}/${proctorState.maxViolations}). Violations: ${violationSummary}`);
    }
  }, [proctorState.violationCount, proctorState.maxViolations, proctorState.testSubmitted, proctorState.isMonitoring, proctorState.violations, submitTestDueToViolation]);

  // Optimized monitoring effect with adaptive intervals
  useEffect(() => {
    if (!proctorState.isMonitoring || 
        proctorState.testSubmitted || 
        !modelsLoaded || 
        !mediaStream || 
        !videoRef.current) return;

    let detectionInterval;
    let animationFrameId;

    const runOptimizedProctoring = async () => {
      const video = videoRef.current;
      
      if (!video.srcObject) {
        video.srcObject = mediaStream;
        await video.play();
      }

      // Audio analysis setup with optimized settings
      if (!audioContextRef.current) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;
      }
      
      const audioContext = audioContextRef.current;
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(analyser);
      analyser.fftSize = 256; // Reduced for better performance
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const SPEECH_THRESHOLD = 0.1;

      const checkAudioAndVideoOptimized = async () => {
        try {
          // Audio analysis
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const isSpeaking = (average / 128) > SPEECH_THRESHOLD;

          // Video analysis (only if AI detection is enabled)
          if (video.readyState === 4 && 
              optimalSettings?.enableAIDetection && 
              modelRef.current) {
            
            const predictions = await modelRef.current.detect(video);
            const personCount = predictions.filter(p => p.class === 'person').length;

            if (personCount >= 2) {
              submitTestDueToViolation(
                `Critical Security Violation: ${personCount} people detected in camera frame.`
              );
            }
          }
        } catch (error) {
          console.error('🔧 Proctoring check error (continuing):', error);
          performanceRef.current.errorCount++;
          
          // If too many errors, fall back to basic monitoring
          if (performanceRef.current.errorCount > 10) {
            console.warn('⚠️ Too many AI detection errors, falling back to basic monitoring');
            if (optimalSettings) {
              optimalSettings.enableAIDetection = false;
            }
          }
        }
      };

      const interval = optimalSettings?.detectionInterval || optimizeMemoryUsage.detectionInterval;
      detectionInterval = setInterval(checkAudioAndVideoOptimized, interval);
      
      console.log(`🔄 Started monitoring with ${interval}ms interval`);
    };

    runOptimizedProctoring();

    return () => {
      clearInterval(detectionInterval);
      cancelAnimationFrame(animationFrameId);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [proctorState.isMonitoring, proctorState.testSubmitted, modelsLoaded, 
      mediaStream, optimalSettings, submitTestDueToViolation]);


  // Enhanced event monitoring with performance optimization
  useEffect(() => {
    if (!proctorState.isMonitoring || proctorState.testSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addViolation('CRITICAL', 'Tab switched or window minimized during test');
      }
    };

    const handleBlur = () => {
      if (document.visibilityState === 'visible') {
        addViolation('CRITICAL', 'Lost focus - switched to another application');
      }
    };

    const handleKeydown = (e) => {
      if ((e.ctrlKey || e.metaKey) && 
          (e.key === 't' || e.key === 'w' || e.key === 'n' || e.key === 'r' || e.key === 'Tab')) {
        e.preventDefault();
        addViolation('CRITICAL', 'Attempted to use prohibited keyboard shortcut');
      }
      
      if (e.key === 'F12') {
        e.preventDefault();
        addViolation('CRITICAL', 'Attempted to open developer tools');
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      addViolation('WARNING', 'Right-click attempted');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && proctorState.isMonitoring) {
        submitTestDueToViolation('Exited fullscreen mode during test');
      } else if (!document.fullscreenElement) {
        setPermissions(prev => ({ ...prev, fullscreen: false }));
      }
    };

    // Add event listeners with passive option for better performance
    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
    window.addEventListener('blur', handleBlur, { passive: true });
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('fullscreenchange', handleFullscreenChange, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [proctorState.isMonitoring, proctorState.testSubmitted, addViolation, submitTestDueToViolation]);

  // Get performance metrics for debugging
  const getPerformanceMetrics = useCallback(() => {
    return {
      deviceCapabilities,
      optimalSettings,
      memoryUsage: performanceRef.current.memoryUsage,
      errorCount: performanceRef.current.errorCount,
      currentMemory: performanceMetrics.memoryUsage(),
      modelsLoaded,
      aiDetectionEnabled: optimalSettings?.enableAIDetection || false
    };
  }, [deviceCapabilities, optimalSettings, modelsLoaded]);

  const value = {
    permissions,
    proctorState,
    mediaStream,
    requestMediaPermissions,
    requestFullscreen,
    startMonitoring,
    pauseMonitoring,
    stopMonitoring,
    exitFullscreen,
    completeTestCleanup,
    addViolation,
    submitTestDueToViolation,
    videoRef,
    // Performance-related exports
    deviceCapabilities,
    optimalSettings,
    getPerformanceMetrics
  };

  return (
    <ProctorContext.Provider value={value}>
      {/* This video element is required for person detection but is hidden from the user */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ display: 'none' }}
      />
      {children}
    </ProctorContext.Provider>
  );
};
