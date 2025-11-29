import React, { useEffect } from 'react';
import realTimeService from '../services/realTimeService';

/**
 * Real-time Activity Tracker Hook
 * Tracks user interactions and submission activities in real-time
 */
export const useRealTimeActivity = (userId) => {
  useEffect(() => {
    if (!userId) return;

    // Track page navigation
    const trackPageChange = () => {
      const activity = getActivityFromPath(window.location.pathname);
      realTimeService.trackUserActivity(userId, activity);
    };

    // Initial track
    trackPageChange();

    // Track navigation changes
    window.addEventListener('popstate', trackPageChange);
    
    // Track form submissions
    const trackFormSubmission = (event) => {
      if (event.target.tagName === 'FORM') {
        realTimeService.trackUserActivity(userId, 'submitting form');
      }
    };

    // Track code execution
    const trackCodeExecution = () => {
      realTimeService.trackUserActivity(userId, 'running code');
    };

    document.addEventListener('submit', trackFormSubmission);
    
    // Custom event for code execution (to be dispatched from ProblemSolver)
    document.addEventListener('codeExecution', trackCodeExecution);

    return () => {
      window.removeEventListener('popstate', trackPageChange);
      document.removeEventListener('submit', trackFormSubmission);
      document.removeEventListener('codeExecution', trackCodeExecution);
    };
  }, [userId]);
};

/**
 * Real-time Submission Hook
 * Records submissions in real-time for immediate admin dashboard updates
 */
export const useRealTimeSubmission = () => {
  const recordSubmission = (submissionData) => {
    console.log('🚀 Recording real-time submission:', submissionData);
    
    // Enhanced submission data with real-time info
    const enhancedSubmission = {
      ...submissionData,
      id: submissionData.id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      realTime: true,
      source: 'live-submission'
    };

    // Record in real-time service
    realTimeService.recordSubmission(enhancedSubmission);
    
    // Also update user activity
    if (submissionData.userId) {
      const activityType = submissionData.testType === 'dsa' ? 'solving DSA problem' : 'taking aptitude test';
      realTimeService.trackUserActivity(submissionData.userId, activityType);
    }

    return enhancedSubmission;
  };

  return { recordSubmission };
};

/**
 * Get activity description from URL path
 */
const getActivityFromPath = (path) => {
  if (path.includes('/admin')) return 'admin dashboard';
  if (path.includes('/problems')) return 'solving problems';
  if (path.includes('/aptitude')) return 'taking aptitude test';
  if (path.includes('/results')) return 'viewing results';
  if (path.includes('/profile')) return 'editing profile';
  return 'browsing';
};

/**
 * Real-time Status Component
 * Shows real-time connection status
 */
export const RealTimeStatus = ({ className = '' }) => {
  const [isConnected, setIsConnected] = React.useState(true);
  const [lastUpdate, setLastUpdate] = React.useState(new Date());

  useEffect(() => {
    // Simulate connection status (in real app, this would check actual connection)
    const checkConnection = () => {
      setIsConnected(navigator.onLine);
      setLastUpdate(new Date());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);

    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  return (
    <div className={`realtime-status ${className}`}>
      <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
        <div className="status-dot"></div>
        <span className="status-text">
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>
      <div className="last-update">
        Updated {formatTimeAgo(lastUpdate)}
      </div>
    </div>
  );
};

const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};
