/**
 * Utility functions to check browser compatibility and environment
 */

export const checkBrowserSupport = () => {
  const support = {
    getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    fullscreen: !!(document.documentElement.requestFullscreen || 
                   document.documentElement.webkitRequestFullscreen || 
                   document.documentElement.mozRequestFullScreen || 
                   document.documentElement.msRequestFullscreen),
    permissions: !!(navigator.permissions),
    webgl: !!window.WebGLRenderingContext,
    audioContext: !!(window.AudioContext || window.webkitAudioContext),
    isSecure: window.location.protocol === 'https:' || window.location.hostname === 'localhost'
  };

  return support;
};

export const getBrowserName = () => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return 'Unknown';
};

export const getEnvironmentInfo = () => {
  const support = checkBrowserSupport();
  const browser = getBrowserName();
  
  return {
    browser,
    support,
    isCompatible: Object.values(support).every(Boolean),
    issues: Object.entries(support)
      .filter(([_, supported]) => !supported)
      .map(([feature]) => feature)
  };
};

export const getPermissionInstructions = (browser) => {
  const instructions = {
    Chrome: {
      camera: 'Click the camera icon in the address bar, select "Always allow", then reload the page',
      fullscreen: 'Click "Allow" when prompted for fullscreen, or press F11'
    },
    Firefox: {
      camera: 'Click the camera icon in the address bar, select "Allow" from the dropdown',
      fullscreen: 'Click "Allow" when prompted, or press F11'
    },
    Safari: {
      camera: 'Go to Safari > Preferences > Websites > Camera/Microphone and set to "Allow"',
      fullscreen: 'Click "Allow" when prompted, or use View > Enter Full Screen'
    },
    Edge: {
      camera: 'Click the camera icon in the address bar and select "Allow"',
      fullscreen: 'Click "Allow" when prompted, or press F11'
    }
  };

  return instructions[browser] || instructions.Chrome;
};
