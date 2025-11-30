/**
 * Real-time Service - Alternative real-time communication methods
 * Uses localStorage events, BroadcastChannel API, and polling for real-time updates
 */

class RealTimeService {
  constructor() {
    this.listeners = new Map();
    this.channels = new Map();
    this.heartbeatInterval = null;
    this.pollingIntervals = new Map();
    this.isActive = true;
    this.deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Initialize services
    this.initializeHeartbeat();
    this.initializeActivityTracking();
    this.setupVisibilityListener();
    this.initializeCrossDeviceSync();
  }

  /**
   * Initialize cross-device synchronization
   */
  initializeCrossDeviceSync() {
    // Listen for storage events from other devices
    window.addEventListener('storage', (event) => {
      if (event.key === 'cross_device_sync' && event.newValue) {
        try {
          const syncData = JSON.parse(event.newValue);
          if (syncData.deviceId !== this.deviceId && syncData.type === 'leaderboard_update') {
            console.log('📱 Received leaderboard update from another device');
            this.handleCrossDeviceUpdate(syncData);
          }
        } catch (error) {
          console.error('Error processing cross-device sync:', error);
        }
      }
    });
  }

  /**
   * Handle updates from other devices
   */
  handleCrossDeviceUpdate(syncData) {
    // Trigger leaderboard refresh
    try {
      const event = new CustomEvent('cross_device_update', { detail: syncData });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error handling cross-device update:', error);
    }
  }

  /**
   * Subscribe to real-time updates for a collection
   * @param {string} collectionName - Name of the collection to watch
   * @param {function} callback - Callback function to execute on updates
   * @param {object} options - Options like polling interval
   */
  subscribe(collectionName, callback, options = {}) {
    const { pollInterval = 2000, useLocalStorage = true, useBroadcast = true } = options;
    
    console.log(`📡 Setting up real-time subscription for: ${collectionName}`);
    
    // Create BroadcastChannel for cross-tab communication
    if (useBroadcast && !this.channels.has(collectionName)) {
      const channel = new BroadcastChannel(`realtime_${collectionName}`);
      channel.onmessage = (event) => {
        console.log(`📨 Received broadcast for ${collectionName}:`, event.data);
        callback(event.data);
      };
      this.channels.set(collectionName, channel);
    }

    // Set up localStorage listener
    if (useLocalStorage) {
      const storageListener = (event) => {
        if (event.key === `realtime_${collectionName}` && event.newValue) {
          const data = JSON.parse(event.newValue);
          console.log(`💾 localStorage update for ${collectionName}:`, data);
          callback(data);
        }
      };
      
      window.addEventListener('storage', storageListener);
      
      // Store listener for cleanup
      if (!this.listeners.has(collectionName)) {
        this.listeners.set(collectionName, []);
      }
      this.listeners.get(collectionName).push({
        type: 'storage',
        listener: storageListener
      });
    }

    // Set up polling for fresh data
    const pollingId = setInterval(async () => {
      if (!this.isActive) return; // Don't poll when tab is inactive
      
      try {
        const data = await this.fetchLatestData(collectionName);
        if (data && data.length > 0) {
          callback(data);
        }
      } catch (error) {
        console.warn(`⚠️ Polling failed for ${collectionName}:`, error);
      }
    }, pollInterval);
    
    this.pollingIntervals.set(collectionName, pollingId);
    
    return () => this.unsubscribe(collectionName);
  }

  /**
   * Emit data to all subscribers
   * @param {string} collectionName - Collection name
   * @param {*} data - Data to emit
   */
  emit(collectionName, data) {
    const timestamp = new Date().toISOString();
    const payload = {
      data,
      timestamp,
      source: 'local'
    };

    // Broadcast to other tabs
    const channel = this.channels.get(collectionName);
    if (channel) {
      channel.postMessage(payload);
    }

    // Update localStorage to trigger storage events for cross-device communication
    localStorage.setItem(`realtime_${collectionName}`, JSON.stringify(payload));
    localStorage.setItem(`realtime_${collectionName}_timestamp`, timestamp);
    
    console.log(`📤 Emitted data for ${collectionName}:`, payload);
  }

  /**
   * Broadcast update specifically for leaderboard
   * @param {string} updateType - Type of update
   * @param {*} data - Data to broadcast
   */
  broadcastUpdate(updateType, data) {
    this.emit(updateType, data);
    
    // Special handling for leaderboard updates
    if (updateType === 'leaderboard') {
      try {
        // Cross-device sync via localStorage
        const syncPayload = {
          type: 'leaderboard_update',
          data: data,
          timestamp: new Date().toISOString(),
          deviceId: this.deviceId
        };
        localStorage.setItem('cross_device_sync', JSON.stringify(syncPayload));
        
        const { default: leaderboardService } = require('./leaderboardService');
        leaderboardService.refreshLeaderboard();
      } catch (error) {
        console.warn('Could not trigger leaderboard refresh:', error);
      }
    }
  }

  /**
   * Fetch latest data from storage or API
   * @param {string} collectionName - Collection to fetch
   */
  async fetchLatestData(collectionName) {
    switch (collectionName) {
      case 'users':
        return this.fetchUsers();
      case 'submissions':
        return this.fetchSubmissions();
      case 'activities':
        return this.fetchActivities();
      case 'activeUsers':
        return this.fetchActiveUsers();
      default:
        console.warn(`Unknown collection: ${collectionName}`);
        return [];
    }
  }

  /**
   * Fetch users from localStorage with fallback
   */
  async fetchUsers() {
    try {
      // Try localStorage first
      const localUsers = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
      if (localUsers.length > 0) {
        return localUsers;
      }

      // Fallback to sessionStorage
      const sessionUsers = JSON.parse(sessionStorage.getItem('admin_users_cache') || '{}');
      if (sessionUsers.data) {
        return sessionUsers.data;
      }

      return [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  /**
   * Fetch submissions from storage
   */
  async fetchSubmissions() {
    try {
      const submissions = JSON.parse(localStorage.getItem('test_results') || '[]');
      const recentSubmissions = JSON.parse(sessionStorage.getItem('admin_submissions_cache') || '{}');
      
      // Combine and deduplicate
      const allSubmissions = [
        ...submissions,
        ...(recentSubmissions.data || [])
      ];

      // Remove duplicates by id
      const unique = allSubmissions.filter((submission, index, array) => 
        array.findIndex(s => s.id === submission.id) === index
      );

      return unique.sort((a, b) => new Date(b.timestamp || b.submittedAt) - new Date(a.timestamp || a.submittedAt));
    } catch (error) {
      console.error('Error fetching submissions:', error);
      return [];
    }
  }

  /**
   * Fetch user activities
   */
  async fetchActivities() {
    const submissions = await this.fetchSubmissions();
    const users = await this.fetchUsers();

    const activities = [];
    
    // Add submission activities
    submissions.slice(0, 20).forEach(submission => {
      const user = users.find(u => u.id === submission.userId);
      activities.push({
        id: `submission-${submission.id}`,
        type: 'submission',
        userId: submission.userId,
        userName: user?.displayName || user?.email || 'Unknown User',
        action: `Submitted ${submission.testType || 'test'}`,
        timestamp: submission.timestamp || submission.submittedAt,
        details: {
          score: submission.score,
          passed: submission.passed
        }
      });
    });

    // Add login activities
    users.filter(u => u.lastLogin).slice(0, 10).forEach(user => {
      activities.push({
        id: `login-${user.id}`,
        type: 'login',
        userId: user.id,
        userName: user.displayName || user.email,
        action: 'Logged in',
        timestamp: user.lastLogin
      });
    });

    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Fetch currently active users
   */
  async fetchActiveUsers() {
    const users = await this.fetchUsers();
    const now = new Date();
    const activeThreshold = 2 * 60 * 1000; // 2 minutes (more sensitive)

    // Check heartbeat data
    const heartbeatData = JSON.parse(localStorage.getItem('user_heartbeats') || '{}');

    return users.filter(user => {
      // Check heartbeat first
      const heartbeat = heartbeatData[user.id];
      if (heartbeat) {
        const heartbeatTime = new Date(heartbeat.timestamp);
        if (now - heartbeatTime < activeThreshold) {
          return true;
        }
      }

      // Fallback to lastLogin (more generous threshold)
      if (user.lastLogin) {
        const loginTime = new Date(user.lastLogin);
        if (now - loginTime < 10 * 60 * 1000) { // 10 minutes for recent logins
          return true;
        }
      }

      return false;
    }).map(user => ({
      ...user,
      isActive: true,
      lastSeen: heartbeatData[user.id]?.timestamp || user.lastLogin,
      currentActivity: heartbeatData[user.id]?.activity || 'browsing'
    }));
  }

  /**
   * Track user activity and presence
   */
  trackUserActivity(userId, activity = 'browsing') {
    if (!userId) return;

    const heartbeatData = JSON.parse(localStorage.getItem('user_heartbeats') || '{}');
    heartbeatData[userId] = {
      timestamp: new Date().toISOString(),
      activity: activity,
      tabId: this.getTabId()
    };

    localStorage.setItem('user_heartbeats', JSON.stringify(heartbeatData));
    
    // Emit to other tabs immediately for real-time updates
    this.emit('activeUsers', heartbeatData);
    
    console.log(`👤 Tracked activity for user ${userId}:`, activity);
  }

  /**
   * Force refresh active users (useful after login)
   */
  async refreshActiveUsers() {
    const activeUsers = await this.fetchActiveUsers();
    this.emit('activeUsers', activeUsers);
    console.log(`🔄 Refreshed active users: ${activeUsers.length} active`);
    return activeUsers;
  }

  /**
   * Initialize heartbeat system
   */
  initializeHeartbeat() {
    // Send heartbeat every 15 seconds for faster detection
    this.heartbeatInterval = setInterval(() => {
      const currentUser = this.getCurrentUser();
      if (currentUser && this.isActive) {
        this.trackUserActivity(currentUser.id, this.getCurrentActivity());
      }
    }, 15000);
    
    // Initial heartbeat
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      this.trackUserActivity(currentUser.id, this.getCurrentActivity());
    }
  }

  /**
   * Initialize activity tracking
   */
  initializeActivityTracking() {
    // Track mouse movement
    let lastActivity = Date.now();
    
    const trackActivity = () => {
      lastActivity = Date.now();
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        this.trackUserActivity(currentUser.id, 'active');
      }
    };

    // Throttled activity tracking
    let activityTimeout;
    document.addEventListener('mousemove', () => {
      if (activityTimeout) return;
      activityTimeout = setTimeout(() => {
        trackActivity();
        activityTimeout = null;
      }, 5000);
    });

    document.addEventListener('keypress', trackActivity);
    document.addEventListener('click', trackActivity);
    document.addEventListener('scroll', trackActivity);
  }

  /**
   * Set up visibility change listener
   */
  setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      this.isActive = !document.hidden;
      
      if (this.isActive) {
        console.log('🟢 Tab became active - resuming real-time updates');
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          this.trackUserActivity(currentUser.id, 'active');
        }
      } else {
        console.log('🟡 Tab became inactive - reducing updates');
      }
    });
  }

  /**
   * Get current user from auth
   */
  getCurrentUser() {
    try {
      // Try to get from React auth context or localStorage
      const authData = localStorage.getItem('authUser');
      if (authData) {
        return JSON.parse(authData);
      }
      return null;
    } catch (error) {
      console.warn('Could not get current user:', error);
      return null;
    }
  }

  /**
   * Get current activity based on URL
   */
  getCurrentActivity() {
    const path = window.location.pathname;
    if (path.includes('/admin')) return 'admin dashboard';
    if (path.includes('/problems')) return 'solving problems';
    if (path.includes('/results')) return 'viewing results';
    return 'browsing';
  }

  /**
   * Generate unique tab ID
   */
  getTabId() {
    if (!this.tabId) {
      this.tabId = Math.random().toString(36).substring(2, 9);
    }
    return this.tabId;
  }

  /**
   * Record a new submission
   */
  recordSubmission(submissionData) {
    console.log('📝 Recording new submission:', submissionData);
    
    // Optimize with batching and immediate emission
    const enhancedSubmission = {
      ...submissionData,
      id: submissionData.id || `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString()
    };
    
    // Emit immediately for real-time updates (don't wait for localStorage)
    this.emit('submissions', [enhancedSubmission]);
    this.emit('activities', [enhancedSubmission]);
    
    // Update localStorage asynchronously with fallback
    const updateStorage = () => {
      try {
        const submissions = JSON.parse(localStorage.getItem('test_results') || '[]');
        submissions.unshift(enhancedSubmission);
        submissions.splice(100); // Keep only last 100
        localStorage.setItem('test_results', JSON.stringify(submissions));
      } catch (error) {
        console.error('Error updating localStorage:', error);
      }
    };

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(updateStorage, { timeout: 1000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(updateStorage, 16); // Next frame
    }
  }

  /**
   * Unsubscribe from a collection
   */
  unsubscribe(collectionName) {
    console.log(`🚫 Unsubscribing from: ${collectionName}`);
    
    // Remove storage listeners
    const listeners = this.listeners.get(collectionName) || [];
    listeners.forEach(({ type, listener }) => {
      if (type === 'storage') {
        window.removeEventListener('storage', listener);
      }
    });
    this.listeners.delete(collectionName);

    // Close broadcast channel
    const channel = this.channels.get(collectionName);
    if (channel) {
      channel.close();
      this.channels.delete(collectionName);
    }

    // Clear polling
    const pollingId = this.pollingIntervals.get(collectionName);
    if (pollingId) {
      clearInterval(pollingId);
      this.pollingIntervals.delete(collectionName);
    }
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup() {
    console.log('🧹 Cleaning up real-time service');
    
    // Clear heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Unsubscribe from all
    for (const collectionName of this.listeners.keys()) {
      this.unsubscribe(collectionName);
    }
  }
}

// Export singleton instance
const realTimeService = new RealTimeService();
export default realTimeService;
