/**
 * Admin CSV Service - Fixed for Real Supabase Data Only
 * Manages CSV generation, download, and real-time updates for admin dashboard
 */

import { getAllSubmissionsFromSupabase } from './submissionService';

class AdminCSVService {
  constructor() {
    this.listeners = new Set();
    console.log('[DATA] Admin CSV Service initialized - Real Supabase data only');
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
   * Download CSV file with real Supabase data
   */
  async downloadCSV(filename = null) {
    try {
      console.log('📥 Starting CSV download with real Supabase data...');
      
      // Get real submissions from Supabase
      const result = await getAllSubmissionsFromSupabase();
      const submissions = result.success ? result.data : [];
      
      console.log(`📊 Found ${submissions.length} submissions for CSV download`);
      
      if (submissions.length === 0) {
        alert('No submissions found in the database to export.');
        return false;
      }

      // Generate CSV content
      const csvContent = this.generateCSVContent(submissions);
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `submissions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log(`✅ CSV downloaded: ${submissions.length} submissions`);
      return true;
    } catch (error) {
      console.error('[ERROR] Failed to download CSV:', error);
      alert('Failed to download CSV: ' + error.message);
      return false;
    }
  }

  /**
   * Generate CSV content from Supabase submissions
   */
  generateCSVContent(submissions) {
    // CSV headers
    const headers = [
      'Student Name',
      'Student Email', 
      'Test Type',
      'Score',
      'Total Questions',
      'Percentage',
      'Time Taken (minutes)',
      'Submission Date',
      'Status',
      'Violations',
      'Device Info',
      'Submission ID'
    ].join(',');

    // CSV rows
    const rows = submissions.map(submission => {
      const percentage = submission.total_questions > 0 ? 
        Math.round((submission.score / submission.total_questions) * 100) : 0;
      
      const timeTakenMinutes = Math.floor((submission.time_taken || 0) / 60);
      
      const deviceInfo = submission.device_info && typeof submission.device_info === 'object' ? 
        (submission.device_info.userAgent || 'Unknown Browser') : 
        'Unknown Device';
      
      const submissionDate = submission.submitted_at ? 
        new Date(submission.submitted_at).toLocaleString() : 
        'Unknown Date';

      // Escape CSV values properly
      const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        escapeCSV(submission.user_name || 'Unknown Student'),
        escapeCSV(submission.user_email || 'No Email'),
        escapeCSV(submission.test_type || 'Unknown Test'),
        escapeCSV(submission.score || 0),
        escapeCSV(submission.total_questions || 0),
        escapeCSV(`${percentage}%`),
        escapeCSV(timeTakenMinutes),
        escapeCSV(submissionDate),
        escapeCSV(submission.status || 'completed'),
        escapeCSV(submission.violation_count || 0),
        escapeCSV(deviceInfo),
        escapeCSV(submission.id || '')
      ].join(',');
    });

    return headers + '\n' + rows.join('\n');
  }

  /**
   * Search submissions by criteria (from real Supabase data)
   */
  async searchSubmissions(criteria = {}) {
    try {
      console.log('🔍 Searching submissions with criteria:', criteria);
      
      // Get all submissions from Supabase
      const result = await getAllSubmissionsFromSupabase();
      let submissions = result.success ? result.data : [];
      
      console.log(`📊 Searching through ${submissions.length} real submissions`);
      
      // Apply search filters
      if (criteria.searchText) {
        const searchLower = criteria.searchText.toLowerCase();
        submissions = submissions.filter(sub => 
          (sub.user_name && sub.user_name.toLowerCase().includes(searchLower)) ||
          (sub.user_email && sub.user_email.toLowerCase().includes(searchLower))
        );
      }

      // Filter by date range
      if (criteria.startDate) {
        const startDate = new Date(criteria.startDate);
        submissions = submissions.filter(sub => new Date(sub.submitted_at) >= startDate);
      }
      
      if (criteria.endDate) {
        const endDate = new Date(criteria.endDate);
        submissions = submissions.filter(sub => new Date(sub.submitted_at) <= endDate);
      }

      // Filter by score range
      if (criteria.minScore !== undefined && criteria.minScore !== '') {
        submissions = submissions.filter(sub => sub.score >= parseInt(criteria.minScore));
      }
      
      if (criteria.maxScore !== undefined && criteria.maxScore !== '') {
        submissions = submissions.filter(sub => sub.score <= parseInt(criteria.maxScore));
      }

      console.log(`✅ Found ${submissions.length} submissions matching criteria`);
      return submissions;
    } catch (error) {
      console.error('[ERROR] Failed to search submissions:', error);
      return [];
    }
  }

  /**
   * Export filtered CSV with search criteria
   */
  async exportFilteredCSV(criteria = {}, filename = null) {
    try {
      const filteredSubmissions = await this.searchSubmissions(criteria);
      
      if (filteredSubmissions.length === 0) {
        alert('No submissions match the specified criteria.');
        return false;
      }

      // Generate CSV content
      const csvContent = this.generateCSVContent(filteredSubmissions);
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `filtered_submissions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log(`✅ Filtered CSV downloaded: ${filteredSubmissions.length} submissions`);
      return true;
    } catch (error) {
      console.error('[ERROR] Failed to export filtered CSV:', error);
      alert('Failed to export filtered CSV: ' + error.message);
      return false;
    }
  }

  /**
   * Get recent submissions for preview (from real Supabase data)
   */
  async getRecentSubmissions(limit = 10) {
    try {
      const result = await getAllSubmissionsFromSupabase();
      const submissions = result.success ? result.data : [];
      
      if (submissions.length === 0) {
        return [];
      }

      // Sort by submission date and limit
      const recent = submissions
        .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
        .slice(0, limit);

      return recent.map(submission => ({
        userName: submission.user_name || 'Unknown Student',
        userEmail: submission.user_email || 'No Email',
        score: submission.score || 0,
        percentage: submission.total_questions > 0 ? Math.round((submission.score / submission.total_questions) * 100) : 0,
        timestamp: submission.submitted_at,
        testType: submission.test_type || 'Unknown Test',
        totalViolations: submission.violation_count || 0,
        submissionStatus: submission.status || 'completed'
      }));
    } catch (error) {
      console.error('[ERROR] Failed to get recent submissions:', error);
      return [];
    }
  }

  /**
   * Get current CSV data (for dashboard statistics)
   */
  async getCurrentCSVData() {
    try {
      const result = await getAllSubmissionsFromSupabase();
      const submissions = result.success ? result.data : [];
      
      const csvContent = submissions.length > 0 ? this.generateCSVContent(submissions) : '';
      
      return {
        content: csvContent,
        lastUpdated: new Date().toISOString(),
        totalSubmissions: submissions.length,
        downloadUrl: null
      };
    } catch (error) {
      console.error('[ERROR] Failed to get current CSV data:', error);
      return {
        content: '',
        lastUpdated: new Date().toISOString(),
        totalSubmissions: 0,
        downloadUrl: null
      };
    }
  }

  /**
   * Get submission statistics for admin dashboard
   */
  async getSubmissionStatistics() {
    try {
      const result = await getAllSubmissionsFromSupabase();
      const submissions = result.success ? result.data : [];
      
      if (submissions.length === 0) {
        return {
          totalSubmissions: 0,
          averageScore: 0,
          totalViolations: 0,
          completionRate: 100,
          realTimeStatus: 'connected'
        };
      }

      const totalScore = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
      const totalViolations = submissions.reduce((sum, sub) => sum + (sub.violation_count || 0), 0);
      const completedSubmissions = submissions.filter(sub => sub.status === 'completed').length;

      return {
        totalSubmissions: submissions.length,
        averageScore: Math.round(totalScore / submissions.length),
        totalViolations: totalViolations,
        completionRate: Math.round((completedSubmissions / submissions.length) * 100),
        realTimeStatus: 'connected'
      };
    } catch (error) {
      console.error('[ERROR] Failed to get submission statistics:', error);
      return {
        totalSubmissions: 0,
        averageScore: 0,
        totalViolations: 0,
        completionRate: 100,
        realTimeStatus: 'error'
      };
    }
  }

  /**
   * Force refresh - no cache, always fresh data
   */
  async forceRefresh() {
    console.log('🔄 Force refresh - getting fresh data from Supabase');
    // No caching, always fresh data
    return true;
  }
}

// Create and export singleton instance
export const adminCSVService = new AdminCSVService();
export default adminCSVService;
