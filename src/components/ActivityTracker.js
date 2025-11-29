import React, { useEffect } from 'react';
import { useSimpleAuth } from '../context/SimpleAuthContext';

const ActivityTracker = () => {
  const { currentUser, updateLastActive } = useSimpleAuth();

  useEffect(() => {
    if (currentUser) {
      // Update activity immediately
      updateLastActive(currentUser.id); // Fixed: Changed from uid to id for Supabase

      // Set up interval to update activity every 30 seconds
      const activityInterval = setInterval(() => {
        updateLastActive(currentUser.id); // Fixed: Changed from uid to id for Supabase
      }, 30000); // 30 seconds

      // Cleanup on unmount
      return () => clearInterval(activityInterval);
    }
  }, [currentUser, updateLastActive]);

  // Also update on user interaction
  useEffect(() => {
    const handleUserActivity = () => {
      if (currentUser) {
        updateLastActive(currentUser.id); // Fixed: Changed from uid to id for Supabase
      }
    };

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // Cleanup event listeners
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [currentUser, updateLastActive]);

  return null; // This component doesn't render anything
};

export default ActivityTracker;
