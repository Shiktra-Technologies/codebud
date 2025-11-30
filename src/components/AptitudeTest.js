import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProctor } from '../context/ProctorContext';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import ViolationModal from './ViolationModal';
import ViolationWarningPopup from './ViolationWarningPopup';
import { generateViolationAnalysis } from '../utils/violationAnalysis';
import submissionForwardingService from '../services/submissionForwardingService';
import './AptitudeTest.css';

const AptitudeTest = () => {
  const navigate = useNavigate();
  const { currentUser } = useSimpleAuth();
  const { startMonitoring, pauseMonitoring, stopMonitoring, proctorState, completeTestCleanup } = useProctor();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(5400); // 90 minutes (30 questions * 3 minutes each)
  const [testStarted, setTestStarted] = useState(false);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [unacknowledgedViolations, setUnacknowledgedViolations] = useState([]);
  const [currentWarningViolation, setCurrentWarningViolation] = useState(null);
  const [showWarningCount, setShowWarningCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [questionStartTimes, setQuestionStartTimes] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comprehensive aptitude test questions covering multiple domains
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
    },
    {
      id: 4,
      question: "A shirt originally costs $80. If it's on sale for 25% off, what is the sale price?",
      options: ["$55", "$60", "$65", "$70"],
      correct: 1
    },
    {
      id: 5,
      question: "Which word is the odd one out?",
      options: ["Apple", "Orange", "Banana", "Carrot"],
      correct: 3
    },
    {
      id: 6,
      question: "If 3x + 7 = 22, what is the value of x?",
      options: ["3", "5", "7", "9"],
      correct: 1
    },
    {
      id: 7,
      question: "Complete the analogy: Book is to Reading as Fork is to ?",
      options: ["Cooking", "Eating", "Kitchen", "Spoon"],
      correct: 1
    },
    {
      id: 8,
      question: "What is 15% of 200?",
      options: ["25", "30", "35", "40"],
      correct: 1
    },
    {
      id: 9,
      question: "Which number should come next: 1, 4, 9, 16, 25, ?",
      options: ["30", "35", "36", "49"],
      correct: 2
    },
    {
      id: 10,
      question: "If it takes 5 machines 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?",
      options: ["5 minutes", "20 minutes", "100 minutes", "500 minutes"],
      correct: 0
    },
    {
      id: 11,
      question: "What is the next letter in this sequence: A, E, I, M, ?",
      options: ["O", "P", "Q", "R"],
      correct: 2
    },
    {
      id: 12,
      question: "A cube has how many faces?",
      options: ["4", "6", "8", "12"],
      correct: 1
    },
    {
      id: 13,
      question: "If today is Wednesday, what day will it be 100 days from now?",
      options: ["Monday", "Tuesday", "Wednesday", "Friday"],
      correct: 3
    },
    {
      id: 14,
      question: "What is the missing number: 2, 6, 12, 20, 30, ?",
      options: ["40", "42", "44", "48"],
      correct: 1
    },
    {
      id: 15,
      question: "Which of these is NOT a prime number?",
      options: ["17", "19", "21", "23"],
      correct: 2
    },
    {
      id: 16,
      question: "Complete the pattern: Triangle, Square, Pentagon, ?",
      options: ["Circle", "Hexagon", "Octagon", "Rectangle"],
      correct: 1
    },
    {
      id: 17,
      question: "If you rearrange the letters 'CIFAIPC', you would have the name of a(n):",
      options: ["City", "Animal", "Ocean", "Country"],
      correct: 2
    },
    {
      id: 18,
      question: "What is 7² + 3² ?",
      options: ["49", "52", "58", "100"],
      correct: 2
    },
    {
      id: 19,
      question: "In a certain code, MOUSE is written as NLFPD. How is CHAIR written?",
      options: ["DIBJS", "BGZHQ", "DGJCS", "BFGHO"],
      correct: 0
    },
    {
      id: 20,
      question: "If the time is 3:15, what is the angle between the hour and minute hands?",
      options: ["0°", "7.5°", "15°", "90°"],
      correct: 1
    },
    {
      id: 21,
      question: "Which comes next in the series: Z, Y, X, W, V, ?",
      options: ["T", "U", "S", "R"],
      correct: 1
    },
    {
      id: 22,
      question: "A man is 24 years old. His brother is half his age. When the man is 100, how old will his brother be?",
      options: ["50", "76", "88", "100"],
      correct: 2
    },
    {
      id: 23,
      question: "What is the area of a rectangle with length 8 cm and width 5 cm?",
      options: ["26 cm²", "40 cm²", "13 cm²", "80 cm²"],
      correct: 1
    },
    {
      id: 24,
      question: "Which word means the opposite of 'abundant'?",
      options: ["Plenty", "Scarce", "Ample", "Rich"],
      correct: 1
    },
    {
      id: 25,
      question: "If A = 1, B = 2, C = 3, what does 'CAB' equal?",
      options: ["6", "312", "321", "123"],
      correct: 0
    },
    {
      id: 26,
      question: "What percentage is 45 out of 180?",
      options: ["20%", "25%", "30%", "35%"],
      correct: 1
    },
    {
      id: 27,
      question: "Complete the sequence: 3, 7, 15, 31, ?",
      options: ["47", "63", "79", "95"],
      correct: 1
    },
    {
      id: 28,
      question: "If you fold a piece of paper in half 3 times and then make one cut, how many pieces will you have when you unfold it?",
      options: ["4", "6", "8", "9"],
      correct: 3
    },
    {
      id: 29,
      question: "What is the next number in the Fibonacci sequence: 1, 1, 2, 3, 5, 8, ?",
      options: ["11", "13", "15", "21"],
      correct: 1
    },
    {
      id: 30,
      question: "A clock shows 3:00. What will be the time when the minute hand moves 210°?",
      options: ["6:30", "7:00", "8:30", "9:00"],
      correct: 2
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

    // Forward results to admin CSV system for real-time updates
    try {
      submissionForwardingService.forwardSubmission({
        ...results,
        userId: currentUser?.id || currentUser?.email || `anonymous_${Date.now()}`,
        userName: currentUser?.displayName || currentUser?.email || 'Anonymous User',
        testType: 'Aptitude Test',
        submittedAt: results.submittedAt
      });
      console.log('✅ Real test submission forwarded to admin CSV system');
    } catch (error) {
      console.error('❌ Failed to forward test submission to CSV:', error);
      // Don't fail the entire submission if CSV forwarding fails
    }

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

      {/* Minimalistic Progress Bar */}
      <div className="progress-container">
        <div className="progress-info">
          <span className="progress-text">Question {currentQuestion + 1} of {questions.length}</span>
          <span className="progress-percentage">{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
          {/* Progress dots for visual feedback */}
          <div className="progress-dots">
            {Array.from({ length: Math.min(questions.length, 10) }, (_, i) => {
              const questionIndex = Math.floor((i / 9) * (questions.length - 1));
              const isCompleted = questionIndex <= currentQuestion;
              const isAnswered = answers[questions[questionIndex]?.id] !== undefined;
              return (
                <div 
                  key={i}
                  className={`progress-dot ${isCompleted ? 'completed' : ''} ${isAnswered ? 'answered' : ''}`}
                  style={{ left: `${(questionIndex / (questions.length - 1)) * 100}%` }}
                  title={`Question ${questionIndex + 1}${isAnswered ? ' (Answered)' : ''}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AptitudeTest;
