/**
 * Leaderboard Service - Backend-powered leaderboard with caching
 * Fetches real submission data via API, builds ranked leaderboard,
 * and keeps cross-tab sync through BroadcastChannel.
 */

import apiClient, { getToken } from '@/lib/apiClient';

const CACHE_KEY = 'leaderboard_cache';
const CACHE_TTL = 60_000; // 1 minute local cache

// Helper: decode JWT and check if user is admin
function isUserAdmin() {
  try {
    const token = getToken();
    if (!token) return false;
    
    const payload = token.split('.')[1];
    if (!payload) return false;
    
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = JSON.parse(typeof window !== 'undefined' ? window.atob(padded) : Buffer.from(padded, 'base64').toString());
    
    const role = decoded?.role || '';
    return role === 'admin' || role === 'codebud_super_admin';
  } catch {
    return false;
  }
}

export const leaderboardService = {
  _cache: null,
  _cacheTime: 0,
  _broadcastChannel: null,
  _storageListener: null,

  init() {
    this.startListeningForUpdates();
    return this;
  },

  // ──────── Core: fetch from backend API ────────

  /**
   * Fetch all submissions from backend and build leaderboard locally.
   * Only admin users can fetch all data; others use cache silently.
   */
  async fetchLeaderboardFromAPI() {
    try {
      // Non-admin users cannot access /api/submissions, skip API call entirely
      if (!isUserAdmin()) {
        return this._getFromCache();
      }

      const response = await apiClient.get('/api/submissions');
      const allSubmissions = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      if (allSubmissions.length === 0) {
        console.log('[Leaderboard] No submissions from API');
        return [];
      }

      const leaderboard = this._buildFromSubmissions(allSubmissions);

      // Cache locally
      this._cache = leaderboard;
      this._cacheTime = Date.now();
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: leaderboard, time: Date.now() }));
      } catch { /* quota exceeded — fine */ }

      console.log(`✅ Leaderboard built from API: ${leaderboard.length} users`);
      return leaderboard;
    } catch (error) {
      console.warn('[Leaderboard] API fetch failed, using cache:', error.message);
      return this._getFromCache();
    }
  },

  /**
   * Build a ranked leaderboard array from raw submissions.
   */
  _buildFromSubmissions(submissions) {
    const userMap = {};

    submissions.forEach(sub => {
      const userId = sub.user_id || sub.userId;
      const userName = sub.user_name || sub.userName || sub.student_name || 'Unknown';
      const userEmail = sub.user_email || sub.userEmail || sub.student_email || '';
      const testType = sub.test_type || sub.testType || 'unknown';
      const score = parseInt(sub.score) || 0;
      const submittedAt = sub.submitted_at || sub.submittedAt || sub.created_at;

      if (!userId) return;

      if (!userMap[userId]) {
        userMap[userId] = {
          userId,
          userName,
          userEmail,
          scores: {},
          totalScore: 0,
          testsCompleted: 0,
          averageScore: 0,
          lastSubmission: submittedAt,
        };
      }

      // Best score per test type
      if (!userMap[userId].scores[testType] || userMap[userId].scores[testType] < score) {
        userMap[userId].scores[testType] = score;
      }

      // Latest submission date
      if (submittedAt && (!userMap[userId].lastSubmission || new Date(submittedAt) > new Date(userMap[userId].lastSubmission))) {
        userMap[userId].lastSubmission = submittedAt;
      }
    });

    const leaderboard = Object.values(userMap).map(user => {
      const scores = Object.values(user.scores);
      user.totalScore = scores.reduce((sum, s) => sum + s, 0);
      user.testsCompleted = scores.length;
      user.averageScore = user.testsCompleted > 0 ? Math.round(user.totalScore / user.testsCompleted) : 0;
      return user;
    });

    // Sort: total score desc, then tests completed desc
    leaderboard.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return b.testsCompleted - a.testsCompleted;
    });

    leaderboard.forEach((user, idx) => {
      user.rank = idx + 1;
      user.lastUpdated = new Date().toISOString();
    });

    return leaderboard;
  },

  /**
   * Read cached leaderboard from localStorage when API is unavailable.
   */
  _getFromCache() {
    try {
      if (this._cache && Date.now() - this._cacheTime < CACHE_TTL) {
        return this._cache;
      }
      const stored = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      return stored.data || [];
    } catch {
      return [];
    }
  },

  // ──────── Public API (consumed by components) ────────

  /**
   * Get current leaderboard.  Returns cached data immediately, then
   * refreshes in background if stale.
   */
  async getLeaderboard() {
    // If we have a fresh in-memory cache, return it instantly
    if (this._cache && Date.now() - this._cacheTime < CACHE_TTL) {
      return this._cache;
    }
    return this.fetchLeaderboardFromAPI();
  },

  /**
   * Synchronous getter that returns whatever is in cache right now
   * (useful for SSR hydration or initial render).
   */
  getLeaderboardSync() {
    if (this._cache) return this._cache;
    return this._getFromCache();
  },

  /**
   * Get top N users.
   */
  async getTopUsers(limit = 10) {
    try {
      const lb = await this.getLeaderboard();
      return lb.slice(0, limit);
    } catch {
      return this.getLeaderboardSync().slice(0, limit);
    }
  },

  /**
   * Get a user's rank.
   */
  async getUserRank(userId) {
    try {
      const lb = await this.getLeaderboard();
      const pos = lb.findIndex(u => u.userId === userId);
      if (pos === -1) return { rank: null, position: null, totalUsers: lb.length };
      return { rank: pos + 1, position: pos, totalUsers: lb.length, userStats: lb[pos] };
    } catch {
      return { rank: null, position: null, totalUsers: 0 };
    }
  },

  /**
   * Force refresh from API and broadcast update.
   */
  async refreshLeaderboard() {
    console.log('🔄 Refreshing leaderboard from API');
    const updated = await this.fetchLeaderboardFromAPI();
    this.broadcastLeaderboardUpdate(updated);

    if (typeof window !== 'undefined' && window.leaderboardUpdateCallbacks) {
      window.leaderboardUpdateCallbacks.forEach(cb => cb(updated));
    }
    return updated;
  },

  /**
   * Called after a new submission to update scores.
   */
  updateUserScore(userId, userName, testType, score) {
    // Invalidate cache so next getLeaderboard() will re-fetch
    this._cache = null;
    this._cacheTime = 0;
    // Fire-and-forget refresh
    this.refreshLeaderboard().catch(() => {});
  },

  /**
   * Get user performance details.
   */
  async getUserPerformance(userId) {
    const lb = await this.getLeaderboard();
    const user = lb.find(u => u.userId === userId);
    if (!user) return null;
    const rankInfo = await this.getUserRank(userId);
    return { ...user, ...rankInfo };
  },

  // ──────── Cross-tab sync via BroadcastChannel ────────

  broadcastLeaderboardUpdate(leaderboardData) {
    try {
      const payload = {
        type: 'leaderboard_update',
        timestamp: new Date().toISOString(),
        data: leaderboardData,
      };

      if (typeof BroadcastChannel !== 'undefined') {
        if (!this._broadcastChannel) {
          this._broadcastChannel = new BroadcastChannel('leaderboard_updates');
        }
        this._broadcastChannel.postMessage(payload);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('leaderboard_updated', { detail: payload }));
      }
    } catch (err) {
      console.warn('Broadcast failed:', err.message);
    }
  },

  startListeningForUpdates() {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        if (!this._broadcastChannel) {
          this._broadcastChannel = new BroadcastChannel('leaderboard_updates');
        }
        this._broadcastChannel.onmessage = (e) => {
          if (e.data?.type === 'leaderboard_update' && e.data?.data) {
            this._cache = e.data.data;
            this._cacheTime = Date.now();
            if (typeof window !== 'undefined' && window.leaderboardUpdateCallbacks) {
              window.leaderboardUpdateCallbacks.forEach(cb => cb(e.data.data));
            }
          }
        };
      }
    } catch {
      // BroadcastChannel not supported — silent
    }
  },

  stopListeningForUpdates() {
    try {
      if (this._broadcastChannel) {
        this._broadcastChannel.close();
        this._broadcastChannel = null;
      }
    } catch {}
  },

  // ──────── Callback registration ────────

  onLeaderboardUpdate(callback) {
    if (typeof window !== 'undefined') {
      if (!window.leaderboardUpdateCallbacks) window.leaderboardUpdateCallbacks = [];
      window.leaderboardUpdateCallbacks.push(callback);
    }
  },

  offLeaderboardUpdate(callback) {
    if (typeof window !== 'undefined' && window.leaderboardUpdateCallbacks) {
      window.leaderboardUpdateCallbacks = window.leaderboardUpdateCallbacks.filter(cb => cb !== callback);
    }
  },
};

const initializedLeaderboardService = leaderboardService.init();
export default initializedLeaderboardService;
