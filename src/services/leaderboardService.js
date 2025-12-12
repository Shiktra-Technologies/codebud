/**
 * Leaderboard Service - Manage leaderboard data and calculations
 */

const LEADERBOARD_STORAGE_KEY = 'leaderboard_data';
const USER_SCORES_KEY = 'user_scores';

export const leaderboardService = {
  // Initialize listeners when service is created
  init() {
    this.startListeningForUpdates();
    return this;
  },

  /**
   * Get current leaderboard data
   */
  getLeaderboard() {
    try {
      // First try to build leaderboard from real submissions
      const realLeaderboard = this.buildLeaderboardFromSubmissions();
      
      if (realLeaderboard.length > 0) {
        console.log('📊 Using real submission data for leaderboard');
        return realLeaderboard;
      }
      
      // Fallback to stored leaderboard data (for backwards compatibility)
      console.log('📊 Using stored leaderboard data (no real submissions found)');
      const leaderboardData = JSON.parse(localStorage.getItem(LEADERBOARD_STORAGE_KEY) || '[]');
      return leaderboardData.sort((a, b) => b.totalScore - a.totalScore);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      return [];
    }
  },

  /**
   * Update user score
   */
  updateUserScore(userId, userName, testType, score) {
    try {
      const userScores = JSON.parse(localStorage.getItem(USER_SCORES_KEY) || '{}');
      
      if (!userScores[userId]) {
        userScores[userId] = {
          userId,
          userName,
          scores: {},
          totalScore: 0,
          testsCompleted: 0
        };
      }

      // Update the specific test score
      userScores[userId].scores[testType] = Math.max(
        userScores[userId].scores[testType] || 0,
        score
      );

      // Recalculate total score and tests completed
      const scores = Object.values(userScores[userId].scores);
      userScores[userId].totalScore = scores.reduce((sum, s) => sum + s, 0);
      userScores[userId].testsCompleted = scores.length;
      userScores[userId].averageScore = Math.round(userScores[userId].totalScore / userScores[userId].testsCompleted);

      localStorage.setItem(USER_SCORES_KEY, JSON.stringify(userScores));
      
      // Update leaderboard
      this.updateLeaderboard();
      
      return userScores[userId];
    } catch (error) {
      console.error('Error updating user score:', error);
      throw error;
    }
  },

  /**
   * Update the leaderboard based on user scores
   */
  updateLeaderboard() {
    try {
      const userScores = JSON.parse(localStorage.getItem(USER_SCORES_KEY) || '{}');
      const leaderboard = Object.values(userScores).map((user, index) => ({
        ...user,
        rank: index + 1,
        lastUpdated: new Date().toISOString()
      }));

      // Sort by total score (descending) then by tests completed (descending)
      leaderboard.sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        return b.testsCompleted - a.testsCompleted;
      });

      // Update ranks
      leaderboard.forEach((user, index) => {
        user.rank = index + 1;
      });

      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(leaderboard));
      return leaderboard;
    } catch (error) {
      console.error('Error updating leaderboard:', error);
      return [];
    }
  },

  /**
   * Build leaderboard from real test submissions
   */
  buildLeaderboardFromSubmissions() {
    try {
      // Get all submissions from localStorage (real test data)
      const allSubmissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      console.log('Building leaderboard from submissions:', allSubmissions.length);

      if (allSubmissions.length === 0) {
        console.log('No real submissions found, returning empty leaderboard');
        return [];
      }

      // Group submissions by user
      const userSubmissions = {};
      
      allSubmissions.forEach(submission => {
        const userId = submission.user_id;
        const userName = submission.user_name || submission.student_name || 'Unknown Student';
        const userEmail = submission.user_email || submission.student_email || '';
        const testType = submission.test_type || 'unknown';
        const score = parseInt(submission.score) || 0;
        const submittedAt = submission.submitted_at || submission.created_at;

        if (!userSubmissions[userId]) {
          userSubmissions[userId] = {
            userId,
            userName,
            userEmail,
            scores: {},
            totalScore: 0,
            testsCompleted: 0,
            lastSubmission: submittedAt
          };
        }

        // Keep the best score for each test type
        if (!userSubmissions[userId].scores[testType] || userSubmissions[userId].scores[testType] < score) {
          userSubmissions[userId].scores[testType] = score;
        }

        // Update last submission date
        if (!userSubmissions[userId].lastSubmission || new Date(submittedAt) > new Date(userSubmissions[userId].lastSubmission)) {
          userSubmissions[userId].lastSubmission = submittedAt;
        }
      });

      // Calculate totals and create leaderboard
      const leaderboard = Object.values(userSubmissions).map(user => {
        const scores = Object.values(user.scores);
        user.totalScore = scores.reduce((sum, score) => sum + score, 0);
        user.testsCompleted = scores.length;
        user.averageScore = user.testsCompleted > 0 ? Math.round(user.totalScore / user.testsCompleted) : 0;
        return user;
      });

      // Sort by total score (descending) then by tests completed (descending)
      leaderboard.sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        return b.testsCompleted - a.testsCompleted;
      });

      // Assign ranks
      leaderboard.forEach((user, index) => {
        user.rank = index + 1;
        user.lastUpdated = new Date().toISOString();
      });

      // Store in both locations for consistency
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(leaderboard));
      
      // Also update user scores storage
      const userScoresData = {};
      leaderboard.forEach(user => {
        userScoresData[user.userId] = user;
      });
      localStorage.setItem(USER_SCORES_KEY, JSON.stringify(userScoresData));

      console.log(`✅ Built leaderboard with ${leaderboard.length} users from real submissions`);
      return leaderboard;
    } catch (error) {
      console.error('Error building leaderboard from submissions:', error);
      return [];
    }
  },

  /**
   * Get user's current rank and position
   */
  getUserRank(userId) {
    try {
      const leaderboard = this.getLeaderboard();
      const userPosition = leaderboard.findIndex(user => user.userId === userId);
      
      if (userPosition === -1) {
        return { rank: null, position: null, totalUsers: leaderboard.length };
      }

      return {
        rank: userPosition + 1,
        position: userPosition,
        totalUsers: leaderboard.length,
        userStats: leaderboard[userPosition]
      };
    } catch (error) {
      console.error('Error getting user rank:', error);
      return { rank: null, position: null, totalUsers: 0 };
    }
  },

  /**
   * Get top N users from leaderboard
   */
  getTopUsers(limit = 10) {
    try {
      const leaderboard = this.getLeaderboard();
      return leaderboard.slice(0, limit);
    } catch (error) {
      console.error('Error getting top users:', error);
      return [];
    }
  },

  /**
   * Initialize leaderboard (refresh from real data)
   */
  initializeLeaderboard() {
    try {
      console.log('🔄 Initializing leaderboard from real submission data');
      return this.buildLeaderboardFromSubmissions();
    } catch (error) {
      console.error('Error initializing leaderboard:', error);
      return [];
    }
  },

  /**
   * Get user's detailed performance
   */
  getUserPerformance(userId) {
    try {
      const userScores = JSON.parse(localStorage.getItem(USER_SCORES_KEY) || '{}');
      if (!userScores[userId]) {
        return null;
      }

      const userRank = this.getUserRank(userId);
      return {
        ...userScores[userId],
        ...userRank
      };
    } catch (error) {
      console.error('Error getting user performance:', error);
      return null;
    }
  },

  /**
   * Refresh leaderboard after new submission
   * Call this after a test is submitted to update rankings
   */
  refreshLeaderboard() {
    try {
      console.log('🔄 Refreshing leaderboard after new submission');
      const updatedLeaderboard = this.buildLeaderboardFromSubmissions();
      
      // Broadcast update to other tabs/devices
      this.broadcastLeaderboardUpdate(updatedLeaderboard);
      
      // Trigger any listeners or callbacks
      if (typeof window !== 'undefined' && window.leaderboardUpdateCallbacks) {
        window.leaderboardUpdateCallbacks.forEach(callback => callback(updatedLeaderboard));
      }
      
      return updatedLeaderboard;
    } catch (error) {
      console.error('Error refreshing leaderboard:', error);
      return [];
    }
  },

  /**
   * Broadcast leaderboard update across devices/tabs
   */
  broadcastLeaderboardUpdate(leaderboardData) {
    try {
      const updatePayload = {
        type: 'leaderboard_update',
        timestamp: new Date().toISOString(),
        data: leaderboardData
      };

      // BroadcastChannel for cross-tab communication
      if (typeof BroadcastChannel !== 'undefined') {
        if (!this.broadcastChannel) {
          this.broadcastChannel = new BroadcastChannel('leaderboard_updates');
        }
        this.broadcastChannel.postMessage(updatePayload);
      }

      // localStorage event for cross-device sync (when multiple browsers/devices)
      localStorage.setItem('leaderboard_last_update', JSON.stringify(updatePayload));
      
      // Custom event for same-tab components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('leaderboard_updated', { 
          detail: updatePayload 
        }));
      }
      
      console.log('📡 Leaderboard update broadcasted to all devices/tabs');
    } catch (error) {
      console.error('Error broadcasting leaderboard update:', error);
    }
  },

  /**
   * Listen for leaderboard updates from other devices/tabs
   */
  startListeningForUpdates() {
    try {
      // BroadcastChannel listener
      if (typeof BroadcastChannel !== 'undefined') {
        if (!this.broadcastChannel) {
          this.broadcastChannel = new BroadcastChannel('leaderboard_updates');
        }
        
        this.broadcastChannel.onmessage = (event) => {
          try {
            console.log('📨 Received leaderboard update from another tab');
            this.handleIncomingUpdate(event.data);
          } catch (error) {
            console.error('Error handling leaderboard broadcast message:', error);
          }
        };
        
        this.broadcastChannel.onmessageerror = (event) => {
          console.warn('Leaderboard broadcast message error:', event);
        };
      }

      // localStorage listener for cross-device updates
      const handleStorageChange = (event) => {
        if (event.key === 'leaderboard_last_update' && event.newValue) {
          try {
            const updateData = JSON.parse(event.newValue);
            console.log('📨 Received leaderboard update from another device');
            this.handleIncomingUpdate(updateData);
          } catch (error) {
            console.error('Error parsing leaderboard update:', error);
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
      
      // Store reference for cleanup
      this._storageListener = handleStorageChange;
      
      console.log('👂 Started listening for leaderboard updates');
    } catch (error) {
      console.error('Error setting up leaderboard listeners:', error);
    }
  },

  /**
   * Handle incoming leaderboard updates
   */
  handleIncomingUpdate(updateData) {
    try {
      if (updateData.type === 'leaderboard_update' && updateData.data) {
        // Update local storage
        localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(updateData.data));
        
        // Trigger callbacks
        if (typeof window !== 'undefined' && window.leaderboardUpdateCallbacks) {
          window.leaderboardUpdateCallbacks.forEach(callback => callback(updateData.data));
        }
        
        // Trigger custom event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('leaderboard_updated', { 
            detail: updateData 
          }));
        }
      }
    } catch (error) {
      console.error('Error handling incoming leaderboard update:', error);
    }
  },

  /**
   * Stop listening for updates (cleanup)
   */
  stopListeningForUpdates() {
    try {
      if (this.broadcastChannel) {
        this.broadcastChannel.close();
        this.broadcastChannel = null;
      }
      
      if (this._storageListener) {
        window.removeEventListener('storage', this._storageListener);
        this._storageListener = null;
      }
      
      console.log('🔕 Stopped listening for leaderboard updates');
    } catch (error) {
      console.error('Error stopping leaderboard listeners:', error);
    }
  },

  /**
   * Register callback for leaderboard updates
   */
  onLeaderboardUpdate(callback) {
    if (typeof window !== 'undefined') {
      if (!window.leaderboardUpdateCallbacks) {
        window.leaderboardUpdateCallbacks = [];
      }
      window.leaderboardUpdateCallbacks.push(callback);
    }
  },

  /**
   * Unregister callback for leaderboard updates
   */
  offLeaderboardUpdate(callback) {
    if (typeof window !== 'undefined' && window.leaderboardUpdateCallbacks) {
      window.leaderboardUpdateCallbacks = window.leaderboardUpdateCallbacks.filter(cb => cb !== callback);
    }
  }
};

// Initialize the service with real-time listeners
const initializedLeaderboardService = leaderboardService.init();

export default initializedLeaderboardService;
