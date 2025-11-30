/**
 * Admin CSV Service
 * Manages CSV generation, download, and real-time updates for admin dashboard
 */

import submissionForwardingService from './submissionForwardingService';
import realTimeService from './realTimeService';

class AdminCSVService {
  constructor() {
    this.listeners = new Set();
    this.updateChannel = null;
    this.csvCache = null;
    this.lastUpdateTime = null;
    this.isListening = false;
    this.initialize();
  }

  initialize() {
    try {
      // Initialize BroadcastChannel for real-time updates
      if (typeof BroadcastChannel !== 'undefined') {
        this.updateChannel = new BroadcastChannel('admin-submissions');
        this.setupRealTimeListener();
      }

      // Setup localStorage listener for cross-tab communication
      this.setupStorageListener();
      
      console.log('📊 Admin CSV Service initialized');
    } catch (error) {
      console.error('Failed to initialize Admin CSV Service:', error);
    }
  }

  /**
   * Setup real-time listener for new submissions
   */
  setupRealTimeListener() {
    if (!this.updateChannel || this.isListening) return;

    this.updateChannel.addEventListener('message', (event) => {
      if (event.data.type === 'NEW_SUBMISSION') {
        this.handleNewSubmission(event.data.data);
      }
    });

    this.isListening = true;
    console.log('🔄 Real-time CSV listener activated');
  }

  /**
   * Setup localStorage listener for cross-device updates
   */
  setupStorageListener() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'admin_submission_update') {
        try {
          const updateData = JSON.parse(event.newValue || '{}');
          if (updateData.type === 'NEW_SUBMISSION') {
            this.handleNewSubmission(updateData.data);
          }
        } catch (error) {
          console.error('Failed to parse storage update:', error);
        }
      }
    });
  }

  /**
   * Handle new submission data
   */
  handleNewSubmission(submissionData) {
    try {
      // Clear cache to force refresh
      this.csvCache = null;
      this.lastUpdateTime = new Date().toISOString();

      // Notify all listeners
      this.notifyListeners({
        type: 'NEW_SUBMISSION',
        data: submissionData,
        timestamp: this.lastUpdateTime
      });

      console.log('✅ New submission processed for CSV update');
    } catch (error) {
      console.error('Failed to handle new submission:', error);
    }
  }

  /**
   * Add listener for CSV updates
   */
  addUpdateListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of updates
   */
  notifyListeners(updateData) {
    this.listeners.forEach(callback => {
      try {
        callback(updateData);
      } catch (error) {
        console.error('Listener callback error:', error);
      }
    });
  }

  /**
   * Get current CSV data with caching
   */
  async getCurrentCSVData() {
    try {
      // Check localStorage cache first
      const cachedData = localStorage.getItem('admin_csv_data');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        return {
          content: parsed.content,
          lastUpdated: parsed.lastUpdated,
          totalSubmissions: parsed.totalSubmissions,
          downloadUrl: parsed.downloadUrl
        };
      }

      // Generate fresh CSV if no cache
      return await this.generateFreshCSV();
    } catch (error) {
      console.error('Failed to get CSV data:', error);
      return this.getEmptyCSVData();
    }
  }

  /**
   * Generate fresh CSV data
   */
  async generateFreshCSV() {
    try {
      const submissions = submissionForwardingService.getAllSubmissions();
      const csvBlob = submissionForwardingService.getCSVBlob();
      const downloadUrl = URL.createObjectURL(csvBlob);

      const csvData = {
        content: await csvBlob.text(),
        lastUpdated: new Date().toISOString(),
        totalSubmissions: submissions.length,
        downloadUrl: downloadUrl
      };

      // Cache the data
      localStorage.setItem('admin_csv_data', JSON.stringify(csvData));
      
      return csvData;
    } catch (error) {
      console.error('Failed to generate fresh CSV:', error);
      return this.getEmptyCSVData();
    }
  }

  /**
   * Get empty CSV structure
   */
  getEmptyCSVData() {
    const headers = submissionForwardingService.getCSVHeaders();
    return {
      content: headers + '\n',
      lastUpdated: new Date().toISOString(),
      totalSubmissions: 0,
      downloadUrl: null
    };
  }

  /**
   * Download CSV file
   */
  async downloadCSV(filename = null) {
    try {
      const csvData = await this.getCurrentCSVData();
      
      if (!csvData.downloadUrl && csvData.content) {
        // Generate download URL if not available
        const blob = new Blob([csvData.content], { type: 'text/csv;charset=utf-8;' });
        csvData.downloadUrl = URL.createObjectURL(blob);
      }

      if (csvData.downloadUrl) {
        const link = document.createElement('a');
        link.href = csvData.downloadUrl;
        link.download = filename || `test_submissions_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('📥 CSV download initiated');
        return true;
      }

      throw new Error('No CSV data available for download');
    } catch (error) {
      console.error('Failed to download CSV:', error);
      return false;
    }
  }

  /**
   * Get submission statistics for admin dashboard
   */
  async getSubmissionStatistics() {
    try {
      const stats = submissionForwardingService.getStatistics();
      const csvData = await this.getCurrentCSVData();
      
      return {
        ...stats,
        csvLastUpdated: csvData.lastUpdated,
        csvTotalSubmissions: csvData.totalSubmissions,
        realTimeStatus: this.isListening ? 'Active' : 'Inactive'
      };
    } catch (error) {
      console.error('Failed to get submission statistics:', error);
      return {
        totalSubmissions: 0,
        averageScore: 0,
        totalViolations: 0,
        lastUpdated: new Date().toISOString(),
        deviceBreakdown: { Desktop: 0, Mobile: 0, Tablet: 0 },
        hourlySubmissions: {},
        csvLastUpdated: null,
        csvTotalSubmissions: 0,
        realTimeStatus: 'Error'
      };
    }
  }

  /**
   * Get recent submissions preview
   */
  async getRecentSubmissions(limit = 10) {
    try {
      const allSubmissions = submissionForwardingService.getAllSubmissions();
      
      // Sort by timestamp descending and limit results
      const recent = allSubmissions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);

      return recent.map(submission => ({
        userId: submission.userId,
        score: submission.score,
        percentage: submission.percentage,
        timestamp: submission.timestamp,
        deviceType: submission.deviceType,
        totalViolations: submission.totalViolations,
        submissionStatus: submission.submissionStatus
      }));
    } catch (error) {
      console.error('Failed to get recent submissions:', error);
      return [];
    }
  }

  /**
   * Search submissions by criteria
   */
  async searchSubmissions(criteria = {}) {
    try {
      const allSubmissions = submissionForwardingService.getAllSubmissions();
      
      let filtered = allSubmissions;

      // Filter by user ID
      if (criteria.userId) {
        filtered = filtered.filter(sub => 
          sub.userId.toLowerCase().includes(criteria.userId.toLowerCase())
        );
      }

      // Filter by date range
      if (criteria.startDate) {
        const startDate = new Date(criteria.startDate);
        filtered = filtered.filter(sub => new Date(sub.timestamp) >= startDate);
      }
      
      if (criteria.endDate) {
        const endDate = new Date(criteria.endDate);
        filtered = filtered.filter(sub => new Date(sub.timestamp) <= endDate);
      }

      // Filter by score range
      if (criteria.minScore !== undefined) {
        filtered = filtered.filter(sub => sub.score >= criteria.minScore);
      }
      
      if (criteria.maxScore !== undefined) {
        filtered = filtered.filter(sub => sub.score <= criteria.maxScore);
      }

      // Filter by device type
      if (criteria.deviceType) {
        filtered = filtered.filter(sub => sub.deviceType === criteria.deviceType);
      }

      // Filter by violation count
      if (criteria.hasViolations !== undefined) {
        if (criteria.hasViolations) {
          filtered = filtered.filter(sub => sub.totalViolations > 0);
        } else {
          filtered = filtered.filter(sub => sub.totalViolations === 0);
        }
      }

      // Sort by timestamp descending
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return filtered;
    } catch (error) {
      console.error('Failed to search submissions:', error);
      return [];
    }
  }

  /**
   * Export filtered data as CSV
   */
  async exportFilteredCSV(criteria = {}, filename = null) {
    try {
      const filteredSubmissions = await this.searchSubmissions(criteria);
      
      if (filteredSubmissions.length === 0) {
        throw new Error('No submissions match the specified criteria');
      }

      // Generate CSV content for filtered data
      const headers = submissionForwardingService.getCSVHeaders();
      const rows = filteredSubmissions.map(row => 
        submissionForwardingService.formatCSVRow(row)
      );
      
      const csvContent = headers + '\n' + rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Download the filtered CSV
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename || `filtered_submissions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`📥 Filtered CSV exported: ${filteredSubmissions.length} submissions`);
      return true;
    } catch (error) {
      console.error('Failed to export filtered CSV:', error);
      return false;
    }
  }

  /**
   * Get live dashboard data
   */
  async getLiveDashboardData() {
    try {
      const [statistics, recentSubmissions, csvData] = await Promise.all([
        this.getSubmissionStatistics(),
        this.getRecentSubmissions(5),
        this.getCurrentCSVData()
      ]);

      return {
        statistics,
        recentSubmissions,
        csvInfo: {
          totalSubmissions: csvData.totalSubmissions,
          lastUpdated: csvData.lastUpdated,
          downloadReady: !!csvData.downloadUrl
        },
        realTimeStatus: this.isListening,
        lastRefresh: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get live dashboard data:', error);
      return {
        statistics: await this.getSubmissionStatistics(),
        recentSubmissions: [],
        csvInfo: { totalSubmissions: 0, lastUpdated: null, downloadReady: false },
        realTimeStatus: false,
        lastRefresh: new Date().toISOString()
      };
    }
  }

  /**
   * Force refresh CSV data
   */
  async forceRefresh() {
    try {
      // Clear cache
      localStorage.removeItem('admin_csv_data');
      this.csvCache = null;
      
      // Generate fresh data
      const csvData = await this.generateFreshCSV();
      
      // Notify listeners
      this.notifyListeners({
        type: 'FORCE_REFRESH',
        timestamp: new Date().toISOString()
      });

      console.log('🔄 CSV data force refreshed');
      return csvData;
    } catch (error) {
      console.error('Failed to force refresh:', error);
      return null;
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.updateChannel) {
      this.updateChannel.close();
    }
    this.listeners.clear();
    this.csvCache = null;
    this.isListening = false;
  }
}

// Create and export singleton instance
export const adminCSVService = new AdminCSVService();
export default adminCSVService;
