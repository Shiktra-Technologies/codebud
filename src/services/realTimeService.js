/**
 * Real-time Service - Free alternatives to Firebase real-time
 * Uses localStorage events, BroadcastChannel API, and polling for real-time updates
 */

class RealTimeService {
  constructor() {
    this.listeners = new Map();
    this.channels = new Map();
    this.heartbeatInterval = null;
    this.pollingIntervals = new Map();
    this.isActive = true;
    
    // Initialize services
    this.initializeHeartbeat();
    this.initializeActivityTracking();
    this.setupVisibilityListener();
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

    // Update localStorage to trigger storage events
    localStorage.setItem(`realtime_${collectionName}`, JSON.stringify(payload));
    
    console.log(`📤 Emitted data for ${collectionName}:`, payload);
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
      const user = users.find(u => u.uid === submission.userId);
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
        id: `login-${user.uid}`,
        type: 'login',
        userId: user.uid,
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
    const activeThreshold = 5 * 60 * 1000; // 5 minutes

    // Check heartbeat data
    const heartbeatData = JSON.parse(localStorage.getItem('user_heartbeats') || '{}');

    return users.filter(user => {
      // Check heartbeat first
      const heartbeat = heartbeatData[user.uid];
      if (heartbeat) {
        const heartbeatTime = new Date(heartbeat.timestamp);
        if (now - heartbeatTime < activeThreshold) {
          return true;
        }
      }

      // Fallback to lastLogin
      if (user.lastLogin) {
        const loginTime = new Date(user.lastLogin);
        return now - loginTime < activeThreshold;
      }

      return false;
    }).map(user => ({
      ...user,
      isActive: true,
      lastSeen: heartbeatData[user.uid]?.timestamp || user.lastLogin,
      currentActivity: heartbeatData[user.uid]?.activity || 'browsing'
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
    
    // Emit to other tabs
    this.emit('activeUsers', heartbeatData);
  }

  /**
   * Initialize heartbeat system
   */
  initializeHeartbeat() {
    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      const currentUser = this.getCurrentUser();
      if (currentUser && this.isActive) {
        this.trackUserActivity(currentUser.uid, this.getCurrentActivity());
      }
    }, 30000);
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
        this.trackUserActivity(currentUser.uid, 'active');
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
          this.trackUserActivity(currentUser.uid, 'active');
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
    
    // Add to localStorage
    const submissions = JSON.parse(localStorage.getItem('test_results') || '[]');
    submissions.unshift({
      ...submissionData,
      id: submissionData.id || Date.now().toString(),
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 submissions
    submissions.splice(100);
    localStorage.setItem('test_results', JSON.stringify(submissions));
    
    // Emit real-time update
    this.emit('submissions', submissions);
    this.emit('activities', submissions.slice(0, 1)); // Latest activity
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
