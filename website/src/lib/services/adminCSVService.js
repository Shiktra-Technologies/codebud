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
   * Generate comprehensive CSV content (45+ columns) from submissions
   */
  generateCSVContent(submissions) {
    // Escape CSV values properly
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Comprehensive headers — 45+ columns
    const headers = [
      // Student info
      'Submission ID', 'User ID', 'Student Name', 'Student Email',
      // Test info
      'Test Type', 'Test Title', 'Difficulty', 'Category',
      // Score / Performance
      'Score', 'Total Questions', 'Correct Answers', 'Wrong Answers', 'Percentage',
      'Pass/Fail', 'Status',
      // Time
      'Time Taken (sec)', 'Time Taken (min)', 'Started At', 'Submitted At',
      // Code Submission
      'Language', 'Code Submission (truncated)',
      // Per-question breakdown (serialised)
      'Answers JSON',
      // Per-test-case breakdown (serialised)
      'Test Results JSON',
      // Proctoring / Violations
      'Violation Count', 'Auto Submitted', 'Submitted Due to Violation',
      'Violation Types', 'Violation Details JSON',
      // Device / Environment
      'Device Type', 'User Agent', 'Browser', 'Operating System',
      'Screen Width', 'Screen Height', 'Is Mobile',
      // Security Assessment
      'Fullscreen Active', 'Camera Active', 'Mic Active',
      'Face Detection Enabled', 'Multiple People Detected',
      // Location / Network
      'IP Hint', 'Timezone', 'Language Preference',
      // Meta
      'Source', 'Created At', 'Updated At', 'Local Fallback'
    ].join(',');

    const rows = submissions.map(sub => {
      const totalQ = sub.total_questions || sub.totalQuestions || 0;
      const score = sub.score || 0;
      const correct = sub.correct_answers || sub.correctAnswers || 0;
      const wrong = totalQ > 0 ? totalQ - correct : 0;
      const percentage = totalQ > 0 ? Math.round((score / totalQ) * 100) : (score || 0);
      const passed = percentage >= 60;
      const timeSec = sub.time_taken || sub.timeTaken || sub.time_spent || 0;
      const timeMin = Math.round(timeSec / 60 * 10) / 10;
      const details = sub.details || {};
      const violations = sub.violations || details.violations || {};
      const violationCount = sub.violation_count || details.violationCount || violations.count || 0;
      const device = sub.device_info || details.device || {};
      const testResults = details.testResults || sub.testResults || [];

      return [
        // Student info
        escapeCSV(sub._id || sub.id || ''),
        escapeCSV(sub.user_id || sub.userId || ''),
        escapeCSV(sub.user_name || sub.displayName || sub.userName || 'Unknown'),
        escapeCSV(sub.user_email || sub.userEmail || ''),
        // Test info
        escapeCSV(sub.test_type || sub.testType || 'Unknown'),
        escapeCSV(sub.test_title || details.title || details.test_title || ''),
        escapeCSV(details.difficulty || ''),
        escapeCSV(details.category || ''),
        // Score
        escapeCSV(score),
        escapeCSV(totalQ),
        escapeCSV(correct),
        escapeCSV(wrong),
        escapeCSV(`${percentage}%`),
        escapeCSV(passed ? 'PASS' : 'FAIL'),
        escapeCSV(sub.status || 'completed'),
        // Time
        escapeCSV(timeSec),
        escapeCSV(timeMin),
        escapeCSV(sub.started_at || details.startedAt || ''),
        escapeCSV(sub.submitted_at || sub.submittedAt || sub.timestamp || ''),
        // Code
        escapeCSV(details.language || ''),
        escapeCSV((details.codeSubmission || '').slice(0, 200)),
        // Answers
        escapeCSV(sub.answers ? JSON.stringify(sub.answers).slice(0, 500) : ''),
        // Test case results
        escapeCSV(testResults.length > 0 ? JSON.stringify(testResults).slice(0, 500) : ''),
        // Proctoring
        escapeCSV(violationCount),
        escapeCSV(sub.auto_submitted || details.autoSubmitted ? 'Yes' : 'No'),
        escapeCSV(violations.submittedDueToViolation ? 'Yes' : 'No'),
        escapeCSV(Array.isArray(violations.types) ? violations.types.join('; ') : ''),
        escapeCSV(violations.details ? JSON.stringify(violations.details).slice(0, 300) : ''),
        // Device
        escapeCSV(device.deviceType || device.type || (device.isMobile ? 'Mobile' : 'Desktop')),
        escapeCSV(typeof device === 'string' ? device : (device.userAgent || '')),
        escapeCSV(device.browser || ''),
        escapeCSV(device.os || device.operatingSystem || ''),
        escapeCSV(device.screenWidth || ''),
        escapeCSV(device.screenHeight || ''),
        escapeCSV(device.isMobile ? 'Yes' : 'No'),
        // Security
        escapeCSV(details.fullscreenActive ? 'Yes' : 'No'),
        escapeCSV(details.cameraActive ? 'Yes' : 'No'),
        escapeCSV(details.micActive ? 'Yes' : 'No'),
        escapeCSV(details.faceDetection ? 'Yes' : 'No'),
        escapeCSV(details.multiplePeople ? 'Yes' : 'No'),
        // Network
        escapeCSV(device.ip || ''),
        escapeCSV(device.timezone || ''),
        escapeCSV(device.language || ''),
        // Meta
        escapeCSV(sub.local ? 'localStorage' : 'API'),
        escapeCSV(sub.created_at || sub.createdAt || ''),
        escapeCSV(sub.updated_at || sub.updatedAt || ''),
        escapeCSV(sub.local ? 'Yes' : 'No'),
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
      if (criteria.searchText || criteria.searchTerm) {
        const searchLower = (criteria.searchText || criteria.searchTerm).toLowerCase();
        submissions = submissions.filter(sub => 
          (sub.user_name && sub.user_name.toLowerCase().includes(searchLower)) ||
          (sub.user_email && sub.user_email.toLowerCase().includes(searchLower)) ||
          (sub.test_type && sub.test_type.toLowerCase().includes(searchLower)) ||
          (sub.userName && sub.userName.toLowerCase().includes(searchLower)) ||
          (sub.userEmail && sub.userEmail.toLowerCase().includes(searchLower))
        );
      }

      // Filter by test type
      if (criteria.testType) {
        const typeLower = criteria.testType.toLowerCase();
        submissions = submissions.filter(sub => {
          const subType = (sub.test_type || sub.testType || '').toLowerCase();
          return subType.includes(typeLower);
        });
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
