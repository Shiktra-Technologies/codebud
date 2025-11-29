import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProctor } from '../context/ProctorContext';
import ViolationModal from './ViolationModal';
import ViolationWarningPopup from './ViolationWarningPopup';
import { generateViolationAnalysis } from '../utils/violationAnalysis';
import './AptitudeTest.css';

const AptitudeTest = () => {
  const navigate = useNavigate();
  const { startMonitoring, pauseMonitoring, stopMonitoring, proctorState, completeTestCleanup } = useProctor();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes
  const [testStarted, setTestStarted] = useState(false);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [unacknowledgedViolations, setUnacknowledgedViolations] = useState([]);
  const [currentWarningViolation, setCurrentWarningViolation] = useState(null);
  const [showWarningCount, setShowWarningCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [questionStartTimes, setQuestionStartTimes] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sample aptitude questions - replace with your actual questions
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const questions = [
    {
      id: 1,
      question: "If a train travels 120 miles in 2 hours, what is its average speed?",
      options: ["40 mph", "50 mph", "60 mph", "70 mph"],
      correct: 2
    },
    {
      id: 2,
      question: "What comes next in the sequence: 2, 4, 8, 16, ?",
      options: ["24", "32", "30", "20"],
      correct: 1
    },
    {
      id: 3,
      question: "If all Bloops are Razzles and all Razzles are Lazzles, then all Bloops are definitely Lazzles.",
      options: ["True", "False", "Cannot be determined", "Sometimes true"],
      correct: 0
    }
  ];

  // Start monitoring when component mounts
  useEffect(() => {
    startMonitoring();
    
    return () => {
      // Only pause monitoring on unmount (keep permissions)
      pauseMonitoring();
    };
  }, [startMonitoring, pauseMonitoring]);

  // Initialize test and timer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setTestStarted(true);
    const now = new Date();
    setStartTime(now);
    setQuestionStartTimes({ 0: now }); // Start timing for first question

    // Timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1 && !isSubmitting) {
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Monitor for violations
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (proctorState.testSubmitted && !isSubmitting) {
      // Automatically cleanup when test is submitted due to violation
      setTimeout(() => {
        completeTestCleanup();
      }, 500);
      handleSubmitTest();
      return;
    }

    const newViolations = proctorState.violations.filter(
      v => !unacknowledgedViolations.find(uv => uv.id === v.id)
    );

    if (newViolations.length > 0) {
      // Show warning popup for new violations
      const latestViolation = newViolations[newViolations.length - 1];
      setCurrentWarningViolation(latestViolation);
      setShowWarningCount(prev => prev + 1);
      
      setUnacknowledgedViolations(prev => [...prev, ...newViolations]);
      
      // If it's a critical violation, also show the modal
      if (newViolations.some(v => v.type === 'CRITICAL')) {
        setShowViolationModal(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proctorState.violations, proctorState.testSubmitted, unacknowledgedViolations, isSubmitting]);

  // Add CSS to disable text selection and enhance security
  useEffect(() => {
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.mozUserSelect = 'none';
    document.body.style.msUserSelect = 'none';

    return () => {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.mozUserSelect = '';
      document.body.style.msUserSelect = '';
    };
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      // Track start time for next question if not already tracked
      setQuestionStartTimes(prev => ({
        ...prev,
        [nextQuestion]: prev[nextQuestion] || new Date()
      }));
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      const prevQuestion = currentQuestion - 1;
      setCurrentQuestion(prevQuestion);
      // Track start time if returning to a question
      setQuestionStartTimes(prev => ({
        ...prev,
        [prevQuestion]: prev[prevQuestion] || new Date()
      }));
    }
  };

  const handleSubmitTest = useCallback(() => {
    // Prevent multiple submissions
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Pause monitoring when test is submitted (keep permissions for future tests)
    pauseMonitoring();

    const endTime = new Date();
    
    // Handle case where startTime might be null
    if (!startTime) {
      console.error('Start time is null, using current time as fallback');
      setStartTime(endTime);
    }
    
    const totalTimeSpent = startTime ? Math.floor((endTime - startTime) / 1000) : 0; // in seconds
    const timeSpentPerQuestion = {};
    
    // Calculate time spent on each question
    questions.forEach((question, index) => {
      const questionStartTime = questionStartTimes[index];
      if (questionStartTime) {
        const questionEndTime = index === currentQuestion ? endTime : 
          (questionStartTimes[index + 1] || endTime);
        timeSpentPerQuestion[question.id] = Math.floor((questionEndTime - questionStartTime) / 1000);
      }
    });

    // Calculate score and detailed results
    let score = 0;
    const detailedAnswers = questions.map(question => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correct;
      if (isCorrect) score++;
      
      return {
        questionId: question.id,
        question: question.question,
        options: question.options,
        correctAnswer: question.correct,
        correctAnswerText: question.options[question.correct],
        userAnswer: userAnswer,
        userAnswerText: userAnswer !== undefined ? question.options[userAnswer] : 'Not Answered',
        isCorrect,
        timeSpent: timeSpentPerQuestion[question.id] || 0
      };
    });

    // Calculate pass/fail (passing score: 60%)
    const percentage = (score / questions.length) * 100;
    const passed = percentage >= 60;

    // Prepare comprehensive results with violation analysis
    const baseResults = {
      testType: 'aptitude',
      score,
      totalQuestions: questions.length,
      percentage: Math.round(percentage),
      passed,
      answers: detailedAnswers,
      timing: {
        startTime: startTime ? startTime.toISOString() : endTime.toISOString(),
        endTime: endTime.toISOString(),
        totalTimeSpent, // in seconds
        totalTimeSpentFormatted: formatTime(3600 - timeRemaining), // formatted time
        timeSpentPerQuestion
      },
      violations: {
        count: proctorState.violationCount,
        maxViolations: proctorState.maxViolations,
        details: proctorState.violations,
        submittedDueToViolation: proctorState.testSubmitted,
        autoSubmitted: proctorState.autoSubmitted
      },
      submittedAt: endTime ? endTime.toISOString() : new Date().toISOString()
    };

    // Generate comprehensive violation analysis
    const violationAnalysis = generateViolationAnalysis(
      proctorState.violations, 
      'aptitude', 
      baseResults
    );

    const results = {
      ...baseResults,
      violationAnalysis
    };

    // Save results
    localStorage.setItem('testResults', JSON.stringify(results));

    // Automatically cleanup - exit fullscreen and turn off camera
    setTimeout(() => {
      completeTestCleanup();
    }, 1000); // Small delay to ensure results are saved

    navigate('/submitted');
  }, [isSubmitting, pauseMonitoring, completeTestCleanup, startTime, setStartTime, questionStartTimes, currentQuestion, answers, questions, timeRemaining, proctorState.violationCount, proctorState.maxViolations, proctorState.violations, proctorState.testSubmitted, proctorState.autoSubmitted, navigate]);

  const handleViolationAcknowledge = () => {
    setShowViolationModal(false);
    // Keep violations but mark them as acknowledged
  };

  const handleViolationSubmit = () => {
    setShowViolationModal(false);
    handleSubmitTest();
  };

  const handleWarningClose = () => {
    setCurrentWarningViolation(null);
  };

  if (!testStarted) {
    return <div className="loading">Starting test...</div>;
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="aptitude-test">
      {showViolationModal && (
        <ViolationModal 
          violations={unacknowledgedViolations}
          onAcknowledge={handleViolationAcknowledge}
          onSubmitTest={handleViolationSubmit}
        />
      )}
      
      {currentWarningViolation && (
        <ViolationWarningPopup 
          key={showWarningCount} // Force re-render for each new violation
          violation={currentWarningViolation}
          violationCount={proctorState.violationCount}
          maxViolations={proctorState.maxViolations}
          onClose={handleWarningClose}
        />
      )}
      
      <div className="test-header">
        <div className="test-info">
          <h1>Aptitude Test</h1>
          <div className="question-counter">
            Question {currentQuestion + 1} of {questions.length}
          </div>
        </div>
        <div className="test-stats">
          <div className="timer">
            <div className="time-display">{formatTime(timeRemaining)}</div>
          </div>
          <div className={`violation-counter ${proctorState.violationCount >= 3 ? 'warning' : ''}`}>
            <div className="violation-display">
              ⚠️ {proctorState.violationCount}/{proctorState.maxViolations} Violations
            </div>
          </div>
        </div>
      </div>

      <div className="test-content">
        <div className="question-section">
          <h2 className="question-text">{currentQ.question}</h2>
          
          <div className="options">
            {currentQ.options.map((option, index) => (
              <label key={index} className="option">
                <input
                  type="radio"
                  name={`question-${currentQ.id}`}
                  value={index}
                  checked={answers[currentQ.id] === index}
                  onChange={() => handleAnswerSelect(currentQ.id, index)}
                />
                <span className="option-text">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="navigation">
          <button 
            onClick={handlePrevious} 
            disabled={currentQuestion === 0}
            className="nav-btn prev-btn"
          >
            Previous
          </button>
          
          {currentQuestion === questions.length - 1 ? (
            <button onClick={handleSubmitTest} className="nav-btn submit-btn">
              Submit Test
            </button>
          ) : (
            <button onClick={handleNext} className="nav-btn next-btn">
              Next
            </button>
          )}
        </div>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default AptitudeTest;
