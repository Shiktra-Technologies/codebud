/**
 * Submission Forwarding Service
 * Handles real-time forwarding of all submission data to admin with CSV generation
 */

import supabaseService from './supabaseService';
import { submitTestToSupabase } from './submissionService';
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
      // Clear old localStorage data to prevent quota issues
      this.clearOldLocalStorageData();
      
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

      // Save submission to main Supabase submissions table for cross-device access
      try {
        const userId = submissionData.userId || submissionData.userEmail || `anonymous_${Date.now()}`;
        console.log('💾 Attempting to save submission to Supabase:', { userId, testType: submissionData.testType });
        
        const result = await submitTestToSupabase(userId, {
          ...submissionData,
          userName: submissionData.userName || submissionData.displayName,
          userEmail: submissionData.userEmail || submissionData.email,
          testType: submissionData.testType || 'aptitude',
          score: submissionData.score || 0,
          totalQuestions: submissionData.totalQuestions || submissionData.answers?.length || 0,
          timeTaken: submissionData.timing?.totalTimeSpent || 0,
          answers: submissionData.answers || [],
          status: 'completed'
        });
        
        console.log('✅ Submission saved to Supabase submissions table:', result);
      } catch (supabaseError) {
        console.error('❌ Failed to save submission to Supabase:', supabaseError);
        // Don't fail the entire forwarding process if Supabase fails
      }

      // Save to persistent storage (forwarding metadata)
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
      studentName: submission.userName || submission.displayName || 'Anonymous User',
      studentEmail: submission.userEmail || submission.email || 'No email provided',
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
      validSubmission: this.isValidSubmission(submission),
      
      // Question-by-question details (first 5 questions for detailed view)
      question1Answer: submission.answers?.[0]?.userAnswerText || 'Not Answered',
      question1Correct: submission.answers?.[0]?.isCorrect ? 'Yes' : 'No',
      question1Time: submission.answers?.[0]?.timeSpent || 0,
      question2Answer: submission.answers?.[1]?.userAnswerText || 'Not Answered',
      question2Correct: submission.answers?.[1]?.isCorrect ? 'Yes' : 'No', 
      question2Time: submission.answers?.[1]?.timeSpent || 0,
      question3Answer: submission.answers?.[2]?.userAnswerText || 'Not Answered',
      question3Correct: submission.answers?.[2]?.isCorrect ? 'Yes' : 'No',
      question3Time: submission.answers?.[2]?.timeSpent || 0,
      question4Answer: submission.answers?.[3]?.userAnswerText || 'Not Answered',
      question4Correct: submission.answers?.[3]?.isCorrect ? 'Yes' : 'No',
      question4Time: submission.answers?.[3]?.timeSpent || 0,
      question5Answer: submission.answers?.[4]?.userAnswerText || 'Not Answered',
      question5Correct: submission.answers?.[4]?.isCorrect ? 'Yes' : 'No',
      question5Time: submission.answers?.[4]?.timeSpent || 0,
      
      // Comprehensive analysis sections
      detailedAnswerAnalysis: JSON.stringify({
        totalQuestions: submission.answers?.length || 0,
        answeredQuestions: submission.answers?.filter(a => a.userAnswer !== undefined).length || 0,
        unansweredQuestions: submission.answers?.filter(a => a.userAnswer === undefined).length || 0,
        averageTimePerQuestion: submission.answers?.length > 0 ? 
          Math.round(submission.answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / submission.answers.length) : 0,
        fastestQuestion: Math.min(...(submission.answers?.map(a => a.timeSpent || Infinity) || [0])),
        slowestQuestion: Math.max(...(submission.answers?.map(a => a.timeSpent || 0) || [0])),
        questionTypes: submission.answers?.reduce((acc, a) => {
          const type = a.questionType || 'Multiple Choice';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}) || {}
      }),
      
      violationSummary: JSON.stringify({
        hasViolations: (proctoring.totalViolations || 0) > 0,
        riskLevel: (proctoring.totalViolations || 0) > 5 ? 'High' : 
                   (proctoring.totalViolations || 0) > 2 ? 'Medium' : 'Low',
        mostCommonViolation: proctoring.violations?.reduce((acc, v) => {
          acc[v.type] = (acc[v.type] || 0) + 1;
          return acc;
        }, {}) || {},
        violationTimeline: proctoring.violations?.map(v => ({
          time: v.timestamp,
          type: v.type,
          severity: v.severity
        })) || []
      }),
      
      performanceMetrics: JSON.stringify({
        efficiency: submission.percentage && submission.timing?.totalTimeSpent ? 
          Math.round((submission.percentage / (submission.timing.totalTimeSpent / 60)) * 10) / 10 : 0,
        consistency: submission.answers?.length > 0 ? 
          Math.round((1 - (Math.max(...(submission.answers.map(a => a.timeSpent || 0))) - 
                          Math.min(...(submission.answers.map(a => a.timeSpent || Infinity)))) / 
                         (submission.answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / submission.answers.length)) * 100) : 0,
        completionRate: submission.answers?.length > 0 ? 
          Math.round((submission.answers.filter(a => a.userAnswer !== undefined).length / submission.answers.length) * 100) : 0,
        accuracy: submission.percentage || 0
      }),
      
      securityAssessment: JSON.stringify({
        proctoringEnabled: true,
        trustScore: Math.max(0, 100 - ((proctoring.totalViolations || 0) * 10)),
        environmentSecure: (proctoring.totalViolations || 0) < 3,
        recommendedAction: (proctoring.totalViolations || 0) > 5 ? 'Review Manually' : 
                          (proctoring.totalViolations || 0) > 2 ? 'Minor Review' : 'Accept',
        flaggedForReview: (proctoring.totalViolations || 0) > 3
      }),
      
      testEnvironmentDetails: JSON.stringify({
        device: deviceInfo.deviceType,
        platform: `${deviceInfo.browser} on ${deviceInfo.os}`,
        screenSize: deviceInfo.screenResolution,
        testDuration: submission.timing?.totalTimeSpentFormatted || 'N/A',
        startTime: submission.timing?.startTime ? new Date(submission.timing.startTime).toLocaleString() : 'N/A',
        completionTime: submission.timing?.endTime ? new Date(submission.timing.endTime).toLocaleString() : 'N/A',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        userAgent: deviceInfo.userAgent?.substring(0, 100) + '...' // Truncated for readability
      })
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

      // Also trigger localStorage event for cross-tab communication (minimal data)
      try {
        const minimalNotification = {
          type: 'new_submission',
          userId: adminNotification.userId,
          score: adminNotification.score,
          timestamp: adminNotification.timestamp
        };
        localStorage.setItem('admin_submission_update', JSON.stringify(minimalNotification));
        localStorage.removeItem('admin_submission_update');
      } catch (quotaError) {
        console.warn('localStorage quota exceeded, skipping notification storage');
        // Clear some old data if quota exceeded
        this.clearOldLocalStorageData();
      }

      console.log('📢 Admin notified of new submission');
    } catch (error) {
      console.error('Failed to notify admin:', error);
    }
  }

  /**
   * Clear old localStorage data to prevent quota exceeded errors
   */
  clearOldLocalStorageData() {
    try {
      console.log('🧹 Clearing old localStorage data to free up space...');
      
      // Clear old submissions (keep only last 50)
      const allSubmissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      if (allSubmissions.length > 50) {
        const recentSubmissions = allSubmissions.slice(-50);
        localStorage.setItem('all_submissions', JSON.stringify(recentSubmissions));
        console.log(`🧹 Cleared ${allSubmissions.length - 50} old submissions`);
      }
      
      // Clear old forwarding data (keep only last 20)
      const forwardingData = JSON.parse(localStorage.getItem('submission_forwarding') || '[]');
      if (forwardingData.length > 20) {
        const recentForwarding = forwardingData.slice(-20);
        localStorage.setItem('submission_forwarding', JSON.stringify(recentForwarding));
        console.log(`🧹 Cleared ${forwardingData.length - 20} old forwarding records`);
      }
      
      // Clear other potentially large items
      const keysToCheck = ['test_results', 'pending_submissions', 'user_scores'];
      keysToCheck.forEach(key => {
        const data = localStorage.getItem(key);
        if (data && data.length > 10000) { // If larger than 10KB
          localStorage.removeItem(key);
          console.log(`🧹 Cleared large ${key} data`);
        }
      });
      
      console.log('🧹 localStorage cleanup completed');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
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
      'Student Name',
      'Student Email',
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
      'Valid Submission',
      'Question 1 Answer',
      'Question 1 Correct',
      'Question 1 Time (sec)',
      'Question 2 Answer',
      'Question 2 Correct',
      'Question 2 Time (sec)',
      'Question 3 Answer',
      'Question 3 Correct', 
      'Question 3 Time (sec)',
      'Question 4 Answer',
      'Question 4 Correct',
      'Question 4 Time (sec)',
      'Question 5 Answer',
      'Question 5 Correct',
      'Question 5 Time (sec)',
      'Detailed Answer Analysis',
      'Violation Summary',
      'Performance Metrics',
      'Security Assessment',
      'Test Environment Details'
    ].join(',');
  }

  /**
   * Format a single CSV row
   */
  formatCSVRow(rowData) {
    const values = [
      rowData.timestamp,
      rowData.studentName,
      rowData.studentEmail,
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
      rowData.validSubmission,
      
      // Question-by-question details
      `"${(rowData.question1Answer || '').replace(/"/g, '""')}"`,
      rowData.question1Correct,
      rowData.question1Time,
      `"${(rowData.question2Answer || '').replace(/"/g, '""')}"`,
      rowData.question2Correct,
      rowData.question2Time,
      `"${(rowData.question3Answer || '').replace(/"/g, '""')}"`,
      rowData.question3Correct,
      rowData.question3Time,
      `"${(rowData.question4Answer || '').replace(/"/g, '""')}"`,
      rowData.question4Correct,
      rowData.question4Time,
      `"${(rowData.question5Answer || '').replace(/"/g, '""')}"`,
      rowData.question5Correct,
      rowData.question5Time,
      
      // Comprehensive analysis sections (JSON escaped)
      `"${(rowData.detailedAnswerAnalysis || '{}').replace(/"/g, '""')}"`,
      `"${(rowData.violationSummary || '{}').replace(/"/g, '""')}"`,
      `"${(rowData.performanceMetrics || '{}').replace(/"/g, '""')}"`,
      `"${(rowData.securityAssessment || '{}').replace(/"/g, '""')}"`,
      `"${(rowData.testEnvironmentDetails || '{}').replace(/"/g, '""')}"`
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
