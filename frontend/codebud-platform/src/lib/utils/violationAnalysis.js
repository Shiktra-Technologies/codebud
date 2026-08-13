// Violation Analysis Utility
// Generates comprehensive violation reports and scoring analysis

export const generateViolationAnalysis = (violations, testType, testResults) => {
  const analysis = {
    summary: {
      totalViolations: violations.length,
      violationTypes: getViolationTypes(violations),
      criticalViolations: violations.filter(v => v.type === 'CRITICAL').length,
      warningViolations: violations.filter(v => v.type === 'WARNING').length,
      securityBreaches: violations.filter(v => isSecurityBreach(v.description)).length,
      timespan: getViolationTimespan(violations)
    },
    categorizedViolations: categorizeViolations(violations),
    severityScore: calculateSeverityScore(violations, testResults),
    integrityReport: generateIntegrityReport(violations, testResults),
    recommendations: generateRecommendations(violations, testType),
    timeline: generateViolationTimeline(violations)
  };

  return analysis;
};

const getViolationTypes = (violations) => {
  const types = violations.reduce((acc, violation) => {
    acc[violation.type] = (acc[violation.type] || 0) + 1;
    return acc;
  }, {});
  return types;
};

const isSecurityBreach = (description) => {
  const securityKeywords = [
    'multiple people', 'fullscreen', 'developer tools', 
    'keyboard shortcut', 'right-click', 'exited fullscreen'
  ];
  return securityKeywords.some(keyword => 
    description.toLowerCase().includes(keyword.toLowerCase())
  );
};

const getViolationTimespan = (violations) => {
  if (violations.length === 0) return { duration: 0, firstViolation: null, lastViolation: null };
  
  const timestamps = violations.map(v => new Date(v.timestamp));
  const firstViolation = new Date(Math.min(...timestamps));
  const lastViolation = new Date(Math.max(...timestamps));
  const duration = lastViolation - firstViolation;
  
  return {
    duration: Math.round(duration / 1000), // in seconds
    firstViolation: firstViolation.toISOString(),
    lastViolation: lastViolation.toISOString(),
    durationFormatted: formatDuration(duration / 1000)
  };
};

const categorizeViolations = (violations) => {
  const categories = {
    tabSwitching: [],
    focusLoss: [],
    multiplePersons: [],
    fullscreenExit: [],
    prohibitedActions: [],
    other: []
  };

  violations.forEach(violation => {
    const desc = violation.description.toLowerCase();
    if (desc.includes('tab switched') || desc.includes('window minimized')) {
      categories.tabSwitching.push(violation);
    } else if (desc.includes('lost focus') || desc.includes('switched to another application')) {
      categories.focusLoss.push(violation);
    } else if (desc.includes('multiple people') || desc.includes('people detected')) {
      categories.multiplePersons.push(violation);
    } else if (desc.includes('fullscreen') || desc.includes('exited fullscreen')) {
      categories.fullscreenExit.push(violation);
    } else if (desc.includes('keyboard shortcut') || desc.includes('developer tools') || desc.includes('right-click')) {
      categories.prohibitedActions.push(violation);
    } else {
      categories.other.push(violation);
    }
  });

  return categories;
};

const calculateSeverityScore = (violations, testResults) => {
  let score = 100; // Start with perfect score
  const penalties = {
    'CRITICAL': 20,
    'WARNING': 5
  };

  violations.forEach(violation => {
    score -= penalties[violation.type] || 10;
  });

  // Additional penalties for security breaches
  const securityBreaches = violations.filter(v => isSecurityBreach(v.description));
  score -= securityBreaches.length * 15;

  // Bonus for test completion (even with violations)
  if (!testResults?.violations?.autoSubmitted) {
    score += 10;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    interpretation: getScoreInterpretation(Math.max(0, Math.min(100, score))),
    penalties: calculatePenaltyBreakdown(violations)
  };
};

const getScoreInterpretation = (score) => {
  if (score >= 90) return 'Excellent - High Integrity';
  if (score >= 75) return 'Good - Minor Issues';
  if (score >= 60) return 'Fair - Moderate Concerns';
  if (score >= 40) return 'Poor - Significant Issues';
  return 'Critical - Major Integrity Violations';
};

const calculatePenaltyBreakdown = (violations) => {
  const breakdown = {
    criticalViolations: violations.filter(v => v.type === 'CRITICAL').length * 20,
    warningViolations: violations.filter(v => v.type === 'WARNING').length * 5,
    securityBreaches: violations.filter(v => isSecurityBreach(v.description)).length * 15
  };

  breakdown.total = Object.values(breakdown).reduce((sum, penalty) => sum + penalty, 0);
  return breakdown;
};

const generateIntegrityReport = (violations, testResults) => {
  const report = {
    overallIntegrity: violations.length === 0 ? 'HIGH' : violations.length <= 2 ? 'MEDIUM' : 'LOW',
    riskFactors: [],
    positiveFactors: [],
    recommendation: ''
  };

  // Analyze risk factors
  if (violations.some(v => v.description.includes('multiple people'))) {
    report.riskFactors.push('Multiple persons detected - possible collaboration');
  }
  if (violations.filter(v => v.description.includes('tab switch')).length > 2) {
    report.riskFactors.push('Frequent tab switching - possible external resource access');
  }
  if (violations.some(v => v.description.includes('fullscreen'))) {
    report.riskFactors.push('Fullscreen exit - monitoring compromise');
  }
  if (violations.some(v => v.description.includes('developer tools'))) {
    report.riskFactors.push('Developer tools access attempt - potential code inspection');
  }

  // Analyze positive factors
  if (!testResults?.violations?.autoSubmitted) {
    report.positiveFactors.push('Test completed without auto-submission');
  }
  if (violations.length <= 2) {
    report.positiveFactors.push('Low violation count indicates good compliance');
  }

  // Generate recommendation
  if (report.overallIntegrity === 'HIGH') {
    report.recommendation = 'Results can be trusted with high confidence';
  } else if (report.overallIntegrity === 'MEDIUM') {
    report.recommendation = 'Results should be reviewed with minor concerns noted';
  } else {
    report.recommendation = 'Results require careful review due to integrity concerns';
  }

  return report;
};

const generateRecommendations = (violations, testType) => {
  const recommendations = [];
  
  if (violations.filter(v => v.description.includes('tab switch')).length > 2) {
    recommendations.push('Consider browser lockdown software for future assessments');
    recommendations.push('Provide clear instructions about tab switching consequences');
  }

  if (violations.some(v => v.description.includes('multiple people'))) {
    recommendations.push('Implement additional identity verification measures');
    recommendations.push('Consider individual testing rooms or spaces');
  }

  if (violations.some(v => v.description.includes('fullscreen'))) {
    recommendations.push('Provide training on fullscreen requirements');
    recommendations.push('Consider technical enforcement of fullscreen mode');
  }

  if (violations.length === 0) {
    recommendations.push('Candidate demonstrated excellent test-taking discipline');
    recommendations.push('Current monitoring system is effective for this candidate');
  }

  return recommendations;
};

const generateViolationTimeline = (violations) => {
  return violations
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((violation, index) => ({
      sequence: index + 1,
      timestamp: violation.timestamp,
      timeFormatted: new Date(violation.timestamp).toLocaleTimeString(),
      type: violation.type,
      description: violation.description,
      severity: violation.type === 'CRITICAL' ? 'High' : 'Medium'
    }));
};

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

export default generateViolationAnalysis;
