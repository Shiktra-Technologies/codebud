/**
 * Submission Forwarding Service
 * Handles real-time forwarding of all submission data to admin with CSV generation
 */

import supabaseService from './supabaseService';
import realTimeService from './realTimeService';

class SubmissionForwardingService {
  constructor() {
    this.csvData = [];
    this.listeners = new Set();
    this.isInitialized = false;
    this.adminChannel = null;
    this.initializeService();
  }

  async initializeService() {
    try {
      // Initialize BroadcastChannel for real-time admin updates
      if (typeof BroadcastChannel !== 'undefined') {
        this.adminChannel = new BroadcastChannel('admin-submissions');
      }

      // Load existing submissions on initialization
      await this.loadExistingSubmissions();
      this.isInitialized = true;
      console.log('📊 Submission Forwarding Service initialized');
    } catch (error) {
      console.error('Failed to initialize submission forwarding:', error);
    }
  }

  async loadExistingSubmissions() {
    try {
      const submissions = await supabaseService.getAllSubmissionsForAdmin();
      this.csvData = submissions.map(submission => this.formatSubmissionForCSV(submission));
      console.log(`📋 Loaded ${submissions.length} existing submissions`);
    } catch (error) {
      console.error('Failed to load existing submissions:', error);
      // Continue with empty data if loading fails
      this.csvData = [];
    }
  }

  /**
   * Forward a new submission to admin and update CSV
   */
  async forwardSubmission(submissionData) {
    try {
      if (!this.isInitialized) {
        await this.initializeService();
      }

      // Format submission for CSV
      const csvRow = this.formatSubmissionForCSV(submissionData);
      
      // Add to local CSV data
      this.csvData.push(csvRow);

      // Save to persistent storage
      await this.saveToStorage(submissionData);

      // Notify admin dashboard in real-time
      await this.notifyAdmin(csvRow);

      // Update CSV file
      await this.updateCSVFile();

      console.log('✅ Submission forwarded successfully:', {
        userId: submissionData.userId,
        score: submissionData.score,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Failed to forward submission:', error);
      return false;
    }
  }

  /**
   * Format submission data for CSV export
   */
  formatSubmissionForCSV(submission) {
    const deviceInfo = this.getDeviceInfo();
    const proctoring = submission.violationAnalysis || {};
    
    return {
      // Basic Info
      timestamp: new Date(submission.submittedAt || Date.now()).toISOString(),
      userId: submission.userId || 'Anonymous',
      sessionId: submission.sessionId || this.generateSessionId(),
      
      // Test Results
      score: submission.score || 0,
      totalQuestions: submission.answers?.length || 30,
      correctAnswers: submission.answers?.filter(a => a.isCorrect).length || 0,
      incorrectAnswers: submission.answers?.filter(a => !a.isCorrect).length || 0,
      percentage: submission.percentage || Math.round((submission.score / (submission.answers?.length || 30)) * 100),
      
      // Timing Information
      startTime: submission.timing?.startTime ? new Date(submission.timing.startTime).toISOString() : '',
      endTime: submission.timing?.endTime ? new Date(submission.timing.endTime).toISOString() : '',
      totalTimeSpent: submission.timing?.totalTimeSpentFormatted || 'N/A',
      totalTimeSeconds: submission.timing?.totalTimeSpent || 0,
      avgTimePerQuestion: submission.answers ? 
        Math.round(submission.answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / submission.answers.length) : 0,
      
      // Device Information
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      operatingSystem: deviceInfo.os,
      screenResolution: deviceInfo.screenResolution,
      userAgent: deviceInfo.userAgent,
      ipAddress: deviceInfo.ipAddress || 'N/A',
      
      // Proctoring Data
      totalViolations: proctoring.totalViolations || 0,
      highSeverityViolations: proctoring.severityBreakdown?.high || 0,
      mediumSeverityViolations: proctoring.severityBreakdown?.medium || 0,
      lowSeverityViolations: proctoring.severityBreakdown?.low || 0,
      faceDetectionViolations: proctoring.categoryBreakdown?.faceDetection || 0,
      tabSwitchViolations: proctoring.categoryBreakdown?.tabSwitch || 0,
      fullscreenViolations: proctoring.categoryBreakdown?.fullscreenExit || 0,
      suspiciousActivityViolations: proctoring.categoryBreakdown?.suspiciousActivity || 0,
      
      // Detailed Answer Data (JSON string for CSV)
      answerDetails: JSON.stringify(submission.answers?.map(answer => ({
        questionIndex: answer.questionIndex,
        selectedAnswer: answer.selectedAnswer,
        isCorrect: answer.isCorrect,
        timeSpent: answer.timeSpent,
        timestamp: answer.timestamp
      })) || []),
      
      // Violation Details (JSON string)
      violationDetails: JSON.stringify(proctoring.violations?.map(violation => ({
        type: violation.type,
        severity: violation.severity,
        timestamp: violation.timestamp,
        description: violation.description
      })) || []),
      
      // Test Configuration
      testType: 'Aptitude Test',
      testVersion: '1.0',
      proctoringEnabled: true,
      
      // Status
      submissionStatus: 'Completed',
      validSubmission: this.isValidSubmission(submission)
    };
  }

  /**
   * Get device and browser information
   */
  getDeviceInfo() {
    const userAgent = navigator.userAgent;
    const screen = window.screen;
    
    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android/i.test(userAgent) && !/Mobile/i.test(userAgent);
    
    // Detect browser
    let browser = 'Unknown';
    if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';
    
    // Detect OS
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac OS')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    
    return {
      deviceType: isMobile ? 'Mobile' : (isTablet ? 'Tablet' : 'Desktop'),
      browser: browser,
      os: os,
      screenResolution: `${screen.width}x${screen.height}`,
      userAgent: userAgent,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate submission data
   */
  isValidSubmission(submission) {
    return !!(
      submission.score !== undefined &&
      submission.answers &&
      submission.answers.length > 0 &&
      submission.submittedAt
    );
  }

  /**
   * Save submission to persistent storage
   */
  async saveToStorage(submissionData) {
    try {
      // Save to Supabase with forwarding metadata
      const forwardingData = {
        ...submissionData,
        forwardedAt: new Date().toISOString(),
        deviceInfo: this.getDeviceInfo(),
        forwardingStatus: 'completed'
      };

      await supabaseService.saveSubmissionForwarding(forwardingData);
    } catch (error) {
      console.error('Failed to save submission to storage:', error);
      // Continue operation even if storage fails
    }
  }

  /**
   * Notify admin dashboard via BroadcastChannel
   */
  async notifyAdmin(csvRow) {
    try {
      const adminNotification = {
        type: 'NEW_SUBMISSION',
        data: csvRow,
        timestamp: new Date().toISOString(),
        source: 'submission-forwarding'
      };

      // Broadcast to admin dashboard
      if (this.adminChannel) {
        this.adminChannel.postMessage(adminNotification);
      }

      // Also trigger localStorage event for cross-tab communication
      localStorage.setItem('admin_submission_update', JSON.stringify(adminNotification));
      localStorage.removeItem('admin_submission_update');

      console.log('📢 Admin notified of new submission');
    } catch (error) {
      console.error('Failed to notify admin:', error);
    }
  }

  /**
   * Generate and update CSV file
   */
  async updateCSVFile() {
    try {
      const csvContent = this.generateCSVContent();
      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Store CSV in localStorage for admin access
      const csvData = {
        content: csvContent,
        lastUpdated: new Date().toISOString(),
        totalSubmissions: this.csvData.length,
        downloadUrl: URL.createObjectURL(csvBlob)
      };
      
      localStorage.setItem('admin_csv_data', JSON.stringify(csvData));
      
      console.log(`📄 CSV updated with ${this.csvData.length} submissions`);
      return csvBlob;
    } catch (error) {
      console.error('Failed to update CSV file:', error);
      return null;
    }
  }

  /**
   * Generate CSV content from data
   */
  generateCSVContent() {
    if (this.csvData.length === 0) {
      return this.getCSVHeaders() + '\n';
    }

    const headers = this.getCSVHeaders();
    const rows = this.csvData.map(row => this.formatCSVRow(row));
    
    return headers + '\n' + rows.join('\n');
  }

  /**
   * Get CSV column headers
   */
  getCSVHeaders() {
    return [
      'Timestamp',
      'User ID',
      'Session ID',
      'Score',
      'Total Questions',
      'Correct Answers',
      'Incorrect Answers',
      'Percentage',
      'Start Time',
      'End Time',
      'Total Time Spent',
      'Total Time (Seconds)',
      'Avg Time Per Question (Seconds)',
      'Device Type',
      'Browser',
      'Operating System',
      'Screen Resolution',
      'User Agent',
      'IP Address',
      'Total Violations',
      'High Severity Violations',
      'Medium Severity Violations',
      'Low Severity Violations',
      'Face Detection Violations',
      'Tab Switch Violations',
      'Fullscreen Violations',
      'Suspicious Activity Violations',
      'Answer Details (JSON)',
      'Violation Details (JSON)',
      'Test Type',
      'Test Version',
      'Proctoring Enabled',
      'Submission Status',
      'Valid Submission'
    ].join(',');
  }

  /**
   * Format a single CSV row
   */
  formatCSVRow(rowData) {
    const values = [
      rowData.timestamp,
      rowData.userId,
      rowData.sessionId,
      rowData.score,
      rowData.totalQuestions,
      rowData.correctAnswers,
      rowData.incorrectAnswers,
      rowData.percentage,
      rowData.startTime,
      rowData.endTime,
      rowData.totalTimeSpent,
      rowData.totalTimeSeconds,
      rowData.avgTimePerQuestion,
      rowData.deviceType,
      rowData.browser,
      rowData.operatingSystem,
      rowData.screenResolution,
      `"${rowData.userAgent.replace(/"/g, '""')}"`, // Escape quotes in user agent
      rowData.ipAddress,
      rowData.totalViolations,
      rowData.highSeverityViolations,
      rowData.mediumSeverityViolations,
      rowData.lowSeverityViolations,
      rowData.faceDetectionViolations,
      rowData.tabSwitchViolations,
      rowData.fullscreenViolations,
      rowData.suspiciousActivityViolations,
      `"${rowData.answerDetails.replace(/"/g, '""')}"`, // Escape JSON
      `"${rowData.violationDetails.replace(/"/g, '""')}"`, // Escape JSON
      rowData.testType,
      rowData.testVersion,
      rowData.proctoringEnabled,
      rowData.submissionStatus,
      rowData.validSubmission
    ];

    return values.join(',');
  }

  /**
   * Get all submissions for admin dashboard
   */
  getAllSubmissions() {
    return [...this.csvData];
  }

  /**
   * Get CSV blob for download
   */
  getCSVBlob() {
    const csvContent = this.generateCSVContent();
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  /**
   * Get real-time statistics
   */
  getStatistics() {
    const total = this.csvData.length;
    const avgScore = total > 0 ? 
      Math.round(this.csvData.reduce((sum, row) => sum + row.score, 0) / total) : 0;
    const totalViolations = this.csvData.reduce((sum, row) => sum + row.totalViolations, 0);
    
    return {
      totalSubmissions: total,
      averageScore: avgScore,
      totalViolations: totalViolations,
      lastUpdated: new Date().toISOString(),
      deviceBreakdown: this.getDeviceBreakdown(),
      hourlySubmissions: this.getHourlyBreakdown()
    };
  }

  /**
   * Get device breakdown statistics
   */
  getDeviceBreakdown() {
    const breakdown = { Desktop: 0, Mobile: 0, Tablet: 0 };
    this.csvData.forEach(row => {
      breakdown[row.deviceType] = (breakdown[row.deviceType] || 0) + 1;
    });
    return breakdown;
  }

  /**
   * Get hourly submission breakdown
   */
  getHourlyBreakdown() {
    const hourly = {};
    this.csvData.forEach(row => {
      const hour = new Date(row.timestamp).getHours();
      hourly[hour] = (hourly[hour] || 0) + 1;
    });
    return hourly;
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.adminChannel) {
      this.adminChannel.close();
    }
    this.listeners.clear();
    this.csvData = [];
  }
}

// Create and export singleton instance
export const submissionForwardingService = new SubmissionForwardingService();
export default submissionForwardingService;
