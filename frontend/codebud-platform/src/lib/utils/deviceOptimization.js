/**
 * Device Capability Detection and Performance Optimization
 * For handling 60+ concurrent users on various devices
 */

/**
 * Detect device capabilities
 */
export const detectDeviceCapabilities = () => {
  const memory = navigator.deviceMemory || 4; // GB, defaults to 4 if not available
  const cores = navigator.hardwareConcurrency || 2;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  const capabilities = {
    memory,
    cores,
    connectionType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 10, // Mbps
    rtt: connection?.rtt || 50, // ms
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isLowEnd: memory < 4 || cores < 4,
    isMidRange: memory >= 4 && memory < 8 && cores >= 4,
    isHighEnd: memory >= 8 && cores >= 4
  };
  
  return capabilities;
};

/**
 * Get recommended settings based on device capabilities
 */
export const getRecommendedSettings = (capabilities) => {
  if (capabilities.isHighEnd) {
    return {
      proctoring: {
        faceDetectionInterval: 2000, // 2 seconds
        objectDetectionInterval: 1500, // 1.5 seconds
        enableAudioAnalysis: true,
        videoQuality: 'high',
        enableAllFeatures: true
      },
      autoSave: {
        interval: 10000, // 10 seconds
        enabled: true
      },
      ui: {
        animations: true,
        transitions: true
      },
      recommendation: 'Optimal performance expected'
    };
  } else if (capabilities.isMidRange) {
    return {
      proctoring: {
        faceDetectionInterval: 3000, // 3 seconds
        objectDetectionInterval: 2500, // 2.5 seconds
        enableAudioAnalysis: true,
        videoQuality: 'medium',
        enableAllFeatures: true
      },
      autoSave: {
        interval: 15000, // 15 seconds
        enabled: true
      },
      ui: {
        animations: true,
        transitions: false
      },
      recommendation: 'Good performance expected'
    };
  } else {
    // Low-end device
    return {
      proctoring: {
        faceDetectionInterval: 5000, // 5 seconds
        objectDetectionInterval: 4000, // 4 seconds
        enableAudioAnalysis: false,
        videoQuality: 'low',
        enableAllFeatures: false
      },
      autoSave: {
        interval: 20000, // 20 seconds
        enabled: true
      },
      ui: {
        animations: false,
        transitions: false
      },
      recommendation: 'Performance may be limited. Consider using a more powerful device.',
      warning: true
    };
  }
};

/**
 * Check if device meets minimum requirements
 */
export const meetsMinimumRequirements = (capabilities) => {
  const requirements = {
    minMemory: 2, // GB
    minCores: 2,
    minDownlink: 1 // Mbps
  };
  
  const meets = {
    memory: capabilities.memory >= requirements.minMemory,
    cores: capabilities.cores >= requirements.minCores,
    network: capabilities.downlink >= requirements.minDownlink,
    overall: true
  };
  
  meets.overall = meets.memory && meets.cores && meets.network;
  
  return meets;
};

/**
 * Get device performance score (0-100)
 */
export const getPerformanceScore = (capabilities) => {
  let score = 0;
  
  // Memory score (max 40 points)
  if (capabilities.memory >= 8) score += 40;
  else if (capabilities.memory >= 4) score += 30;
  else if (capabilities.memory >= 2) score += 20;
  else score += 10;
  
  // CPU cores score (max 30 points)
  if (capabilities.cores >= 8) score += 30;
  else if (capabilities.cores >= 4) score += 25;
  else if (capabilities.cores >= 2) score += 15;
  else score += 5;
  
  // Network score (max 20 points)
  if (capabilities.downlink >= 10) score += 20;
  else if (capabilities.downlink >= 5) score += 15;
  else if (capabilities.downlink >= 2) score += 10;
  else score += 5;
  
  // Mobile penalty (max 10 points)
  score += capabilities.isMobile ? 5 : 10;
  
  return Math.min(100, score);
};

/**
 * Measure current FPS (frames per second)
 */
export const measureFPS = () => {
  return new Promise((resolve) => {
    let lastTime = performance.now();
    let frames = 0;
    const duration = 1000; // measure for 1 second
    
    const countFrame = (currentTime) => {
      frames++;
      const elapsed = currentTime - lastTime;
      
      if (elapsed < duration) {
        requestAnimationFrame(countFrame);
      } else {
        const fps = Math.round((frames * 1000) / elapsed);
        resolve(fps);
      }
    };
    
    requestAnimationFrame(countFrame);
  });
};

/**
 * Adaptive proctoring settings based on real-time performance
 */
export const adaptiveProctoring = {
  async adjustSettings(currentSettings) {
    const fps = await measureFPS();
    const adjustedSettings = { ...currentSettings };
    
    if (fps < 30) {
      // Very low FPS - reduce proctoring frequency significantly
      adjustedSettings.faceDetectionInterval = Math.max(
        adjustedSettings.faceDetectionInterval * 1.5,
        5000
      );
      adjustedSettings.objectDetectionInterval = Math.max(
        adjustedSettings.objectDetectionInterval * 1.5,
        5000
      );
      adjustedSettings.enableAudioAnalysis = false;
      console.warn('⚠️ Low FPS detected. Reducing proctoring frequency.');
    } else if (fps < 50) {
      // Medium FPS - slight reduction
      adjustedSettings.faceDetectionInterval = Math.max(
        adjustedSettings.faceDetectionInterval * 1.2,
        3000
      );
      adjustedSettings.objectDetectionInterval = Math.max(
        adjustedSettings.objectDetectionInterval * 1.2,
        3000
      );
    }
    
    return adjustedSettings;
  },
  
  /**
   * Pause proctoring when tab is not visible
   */
  setupVisibilityControl(pauseCallback, resumeCallback) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('🔇 Tab hidden - pausing proctoring');
        pauseCallback();
      } else {
        console.log('🔊 Tab visible - resuming proctoring');
        resumeCallback();
      }
    });
  }
};

/**
 * Memory optimization utilities
 */
export const memoryOptimization = {
  /**
   * Check current memory usage (if available)
   */
  checkMemory() {
    if (performance.memory) {
      const used = performance.memory.usedJSHeapSize / (1024 * 1024); // MB
      const total = performance.memory.totalJSHeapSize / (1024 * 1024); // MB
      const limit = performance.memory.jsHeapSizeLimit / (1024 * 1024); // MB
      
      return {
        used: Math.round(used),
        total: Math.round(total),
        limit: Math.round(limit),
        percentage: Math.round((used / limit) * 100),
        isHigh: (used / limit) > 0.8
      };
    }
    
    return null;
  },
  
  /**
   * Trigger garbage collection (if available in dev mode)
   */
  forceGC() {
    if (window.gc) {
      window.gc();
      console.log('🗑️ Garbage collection triggered');
    }
  },
  
  /**
   * Clear old cached data
   */
  clearOldCache() {
    try {
      // Clear old test progress (older than 7 days)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('test_progress_')) {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            const savedTime = new Date(parsed.lastSaved).getTime();
            if (savedTime < sevenDaysAgo) {
              localStorage.removeItem(key);
              console.log(`🗑️ Cleared old progress: ${key}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error clearing old cache:', error);
    }
  }
};

/**
 * Network optimization
 */
export const networkOptimization = {
  /**
   * Batch multiple operations together
   */
  createBatcher(delay = 1000) {
    let queue = [];
    let timeoutId = null;
    
    return {
      add(operation) {
        queue.push(operation);
        
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        timeoutId = setTimeout(async () => {
          const batch = [...queue];
          queue = [];
          
          console.log(`📦 Processing batch of ${batch.length} operations`);
          
          for (const op of batch) {
            try {
              await op();
            } catch (error) {
              console.error('Batch operation error:', error);
            }
          }
        }, delay);
      }
    };
  },
  
  /**
   * Retry failed operations with exponential backoff
   */
  async retryWithBackoff(operation, maxRetries = 3, initialDelay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }
        
        const delay = initialDelay * Math.pow(2, i);
        console.log(`⏳ Retry ${i + 1}/${maxRetries} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
};

/**
 * Get overall system status for 60 concurrent users
 */
export const getSystemStatus = async () => {
  const capabilities = detectDeviceCapabilities();
  const settings = getRecommendedSettings(capabilities);
  const requirements = meetsMinimumRequirements(capabilities);
  const score = getPerformanceScore(capabilities);
  const fps = await measureFPS();
  const memory = memoryOptimization.checkMemory();
  
  return {
    capabilities,
    settings,
    requirements,
    score,
    fps,
    memory,
    status: {
      ready: requirements.overall && score >= 50,
      warning: score < 50 || !requirements.overall,
      error: score < 30
    },
    message: requirements.overall 
      ? score >= 70 
        ? '✅ System ready for optimal performance'
        : score >= 50
        ? '⚠️ System ready with moderate performance'
        : '⚠️ Performance may be limited'
      : '❌ System does not meet minimum requirements'
  };
};

export default {
  detectDeviceCapabilities,
  getRecommendedSettings,
  meetsMinimumRequirements,
  getPerformanceScore,
  measureFPS,
  adaptiveProctoring,
  memoryOptimization,
  networkOptimization,
  getSystemStatus
};
