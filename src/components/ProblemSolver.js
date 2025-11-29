import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useProctor } from '../context/ProctorContext';
import ViolationModal from './ViolationModal';
import ViolationWarningPopup from './ViolationWarningPopup';
import { generateViolationAnalysis } from '../utils/violationAnalysis';
import './ProblemSolver.css';

// Sample problem data with test cases
const problemsData = {
  1: {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    category: "Array",
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
        explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."
      }
    ],
    constraints: [
      "2 <= nums.length <= 10⁴",
      "-10⁹ <= nums[i] <= 10⁹",
      "-10⁹ <= target <= 10⁹",
      "Only one valid answer exists."
    ],
    starterCode: {
      javascript: `function twoSum(nums, target) {
    // Write your solution here
    
}`,
      python: `def two_sum(nums, target):
    # Write your solution here
    pass`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        
    }
}`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        
    }
};`
    },
    testCases: [
      { input: "[2,7,11,15], 9", expectedOutput: "[0,1]" },
      { input: "[3,2,4], 6", expectedOutput: "[1,2]" },
      { input: "[3,3], 6", expectedOutput: "[0,1]" }
    ]
  },
  2: {
    id: 2,
    title: "Reverse Linked List",
    difficulty: "Easy",
    category: "Linked List",
    description: `Given the head of a singly linked list, reverse the list, and return the reversed list.`,
    examples: [
      {
        input: "head = [1,2,3,4,5]",
        output: "[5,4,3,2,1]",
        explanation: "The linked list is reversed."
      }
    ],
    constraints: [
      "The number of nodes in the list is the range [0, 5000].",
      "-5000 <= Node.val <= 5000"
    ],
    starterCode: {
      javascript: `function reverseList(head) {
    // Write your solution here
    
}`,
      python: `def reverse_list(head):
    # Write your solution here
    pass`,
      java: `class Solution {
    public ListNode reverseList(ListNode head) {
        // Write your solution here
        
    }
}`,
      cpp: `class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        // Write your solution here
        
    }
};`
    },
    testCases: [
      { input: "[1,2,3,4,5]", expectedOutput: "[5,4,3,2,1]" },
      { input: "[1,2]", expectedOutput: "[2,1]" },
      { input: "[]", expectedOutput: "[]" }
    ]
  },
  3: {
    id: 3,
    title: "Valid Parentheses",
    difficulty: "Easy",
    category: "Stack",
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
- Open brackets must be closed by the same type of brackets.
- Open brackets must be closed in the correct order.
- Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      {
        input: 's = "()"',
        output: "true",
        explanation: "The string contains valid parentheses pairs."
      },
      {
        input: 's = "()[]{}"',
        output: "true",
        explanation: "All brackets are properly matched."
      },
      {
        input: 's = "(]"',
        output: "false",
        explanation: "The brackets are not properly matched."
      }
    ],
    constraints: [
      "1 <= s.length <= 10⁴",
      "s consists of parentheses only '()[]{}'."
    ],
    starterCode: {
      javascript: `function isValid(s) {
    // Write your solution here
    
}`,
      python: `def is_valid(s):
    # Write your solution here
    pass`,
      java: `class Solution {
    public boolean isValid(String s) {
        // Write your solution here
        
    }
}`,
      cpp: `class Solution {
public:
    bool isValid(string s) {
        // Write your solution here
        
    }
};`
    },
    testCases: [
      { input: '"()"', expectedOutput: "true" },
      { input: '"()[]{}"', expectedOutput: "true" },
      { input: '"(]"', expectedOutput: "false" },
      { input: '"([)]"', expectedOutput: "false" }
    ]
  },
  4: {
    id: 4,
    title: "Binary Tree Inorder Traversal",
    difficulty: "Easy",
    category: "Tree",
    description: `Given the root of a binary tree, return the inorder traversal of its nodes' values.

Inorder traversal visits nodes in the order: left subtree, root, right subtree.`,
    examples: [
      {
        input: "root = [1,null,2,3]",
        output: "[1,3,2]",
        explanation: "Inorder traversal: left, root, right."
      }
    ],
    constraints: [
      "The number of nodes in the tree is in the range [0, 100].",
      "-100 <= Node.val <= 100"
    ],
    starterCode: {
      javascript: `function inorderTraversal(root) {
    // Write your solution here
    
}`,
      python: `def inorder_traversal(root):
    # Write your solution here
    pass`,
      java: `class Solution {
    public List<Integer> inorderTraversal(TreeNode root) {
        // Write your solution here
        
    }
}`,
      cpp: `class Solution {
public:
    vector<int> inorderTraversal(TreeNode* root) {
        // Write your solution here
        
    }
};`
    },
    testCases: [
      { input: "[1,null,2,3]", expectedOutput: "[1,3,2]" },
      { input: "[]", expectedOutput: "[]" },
      { input: "[1]", expectedOutput: "[1]" }
    ]
  },
  5: {
    id: 5,
    title: "Maximum Subarray",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: `Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.

A subarray is a contiguous part of an array.`,
    examples: [
      {
        input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        output: "6",
        explanation: "[4,-1,2,1] has the largest sum = 6."
      },
      {
        input: "nums = [1]",
        output: "1",
        explanation: "The array has only one element."
      }
    ],
    constraints: [
      "1 <= nums.length <= 10⁵",
      "-10⁴ <= nums[i] <= 10⁴"
    ],
    starterCode: {
      javascript: `function maxSubArray(nums) {
    // Write your solution here
    
}`,
      python: `def max_sub_array(nums):
    # Write your solution here
    pass`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        // Write your solution here
        
    }
}`,
      cpp: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        // Write your solution here
        
    }
};`
    },
    testCases: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6" },
      { input: "[1]", expectedOutput: "1" },
      { input: "[5,4,-1,7,8]", expectedOutput: "23" }
    ]
  }
};

const ProblemSolver = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { proctorState, mediaStream, startMonitoring, pauseMonitoring, stopMonitoring, completeTestCleanup } = useProctor();
  
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [unacknowledgedViolations, setUnacknowledgedViolations] = useState([]);
  const [currentWarningViolation, setCurrentWarningViolation] = useState(null);
  const [showWarningCount, setShowWarningCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const problemData = problemsData[id];
    if (problemData) {
      setProblem(problemData);
      setCode(problemData.starterCode[selectedLanguage] || '');
      setStartTime(new Date()); // Track when user started working on this problem
    } else {
      navigate('/problems');
    }
  }, [id, navigate, selectedLanguage]);

  // Start monitoring when component mounts
  useEffect(() => {
    startMonitoring();
    
    return () => {
      // Only pause monitoring on unmount (keep permissions)
      pauseMonitoring();
    };
  }, [startMonitoring, pauseMonitoring]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (problem && problem.starterCode[selectedLanguage]) {
      setCode(problem.starterCode[selectedLanguage]);
    }
  }, [selectedLanguage, problem]);

  // Check if test was submitted due to violation
  useEffect(() => {
    if (proctorState.testSubmitted && !isSubmitting) {
      // Automatically cleanup when test is submitted due to violation
      setTimeout(() => {
        completeTestCleanup();
      }, 500);
      navigate('/submitted');
    }
  }, [proctorState.testSubmitted, navigate, isSubmitting, completeTestCleanup]);

  // Monitor for violations
  useEffect(() => {
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
  }, [proctorState.violations, unacknowledgedViolations]);

  // Add CSS to enhance security
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

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };

  const handleViolationAcknowledge = () => {
    setShowViolationModal(false);
    // Keep violations but mark them as acknowledged
  };

  const handleViolationSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    // Automatically cleanup - exit fullscreen and turn off camera
    setTimeout(() => {
      completeTestCleanup();
    }, 500); // Quick cleanup for violation submission
    
    setShowViolationModal(false);
    navigate('/submitted');
  };

  const handleWarningClose = () => {
    setCurrentWarningViolation(null);
  };

  const runCode = () => {
    setIsRunning(true);
    setOutput('');
    setTestResults([]);

    // Simulate code execution (in real app, this would call backend)
    setTimeout(() => {
      const mockResults = problem.testCases.map((testCase, index) => ({
        id: index + 1,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: testCase.expectedOutput, // Mock: assume correct for demo
        passed: Math.random() > 0.3, // Random pass/fail for demo
        runtime: `${Math.floor(Math.random() * 100)}ms`
      }));

      setTestResults(mockResults);
      setOutput('Code executed successfully!');
      setIsRunning(false);
    }, 2000);
  };

  const submitSolution = () => {
    if (isSubmitting) return;
    
    if (window.confirm('Are you sure you want to submit your solution?')) {
      setIsSubmitting(true);
      
      // Pause monitoring when solution is submitted (keep permissions for future tests)
      pauseMonitoring();
      
      const endTime = new Date();
      
      // Handle case where startTime might be null
      if (!startTime) {
        console.error('Start time is null, using current time as fallback');
        setStartTime(endTime);
      }
      
      const totalTimeSpent = startTime ? Math.floor((endTime - startTime) / 1000) : 0; // in seconds
      
      // Calculate basic test case results (simplified)
      const passedTests = testResults.filter(result => result.passed).length;
      const totalTests = testResults.length || problem.testCases?.length || 0;
      const percentage = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
      const passed = percentage >= 50; // DSA: 50% test cases to pass

      // Prepare comprehensive results for DSA with violation analysis
      const baseResults = {
        testType: 'dsa',
        problemId: problem.id,
        problemTitle: problem.title,
        difficulty: problem.difficulty,
        category: problem.category,
        solution: code,
        language: selectedLanguage,
        testCases: {
          passed: passedTests,
          total: totalTests,
          percentage,
          details: testResults
        },
        passed,
        timing: {
          startTime: startTime ? startTime.toISOString() : endTime.toISOString(),
          endTime: endTime.toISOString(),
          totalTimeSpent,
          totalTimeSpentFormatted: formatDuration(totalTimeSpent)
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
        'dsa', 
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
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#00b894';
      case 'Medium': return '#fdcb6e';
      case 'Hard': return '#e17055';
      default: return '#74b9ff';
    }
  };

  if (!problem) {
    return <div className="loading">Loading problem...</div>;
  }

  // Show loading state if media stream is not yet available
  if (!mediaStream) {
    return (
      <div className="problem-solver-container">
        <div className="permission-check">
          <div className="permission-loading">
            <div className="spinner"></div>
            <h2>🔒 Setting up Security</h2>
            <p>Initializing camera and microphone access for proctored testing...</p>
            <div className="permission-actions">
              <button 
                onClick={() => navigate('/permission/dsa')} 
                className="permission-retry-btn"
              >
                Grant Permissions
              </button>
              <button 
                onClick={() => navigate('/problems')} 
                className="back-btn secondary"
              >
                Back to Problems
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="problem-solver-container">
      {showViolationModal && (
        <ViolationModal 
          violations={unacknowledgedViolations}
          onAcknowledge={handleViolationAcknowledge}
          onSubmitTest={handleViolationSubmit}
        />
      )}
      
      {currentWarningViolation && (
        <ViolationWarningPopup 
          key={showWarningCount}
          violation={currentWarningViolation}
          violationCount={proctorState.violationCount}
          maxViolations={proctorState.maxViolations}
          onClose={handleWarningClose}
        />
      )}
      {/* Header with monitoring info */}
      <div className="solver-header">
        <div className="problem-info">
          <h1>{problem.title}</h1>
          <div className="problem-meta">
            <span 
              className="difficulty-badge"
              style={{ backgroundColor: getDifficultyColor(problem.difficulty) }}
            >
              {problem.difficulty}
            </span>
            <span className="category-badge">{problem.category}</span>
          </div>
        </div>
        
        <div className="monitoring-info">
          <div className="camera-preview-small">
            <video 
              autoPlay 
              muted 
              ref={(video) => {
                if (video && mediaStream) {
                  video.srcObject = mediaStream;
                }
              }}
              className="preview-video-small"
            />
          </div>
          <div className="status-indicator">
            🔴 <strong>MONITORED</strong>
            <div className={`violation-count ${proctorState.violationCount >= 3 ? 'warning' : ''}`}>
              ⚠️ Violations: {proctorState.violationCount}/{proctorState.maxViolations}
            </div>
          </div>
        </div>
      </div>

      <div className="solver-content">
        {/* Left Panel - Problem Description */}
        <div className="left-panel">
          <div className="panel-tabs">
            <button 
              className={activeTab === 'description' ? 'active' : ''}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button 
              className={activeTab === 'testcases' ? 'active' : ''}
              onClick={() => setActiveTab('testcases')}
            >
              Test Cases
            </button>
          </div>

          <div className="panel-content">
            {activeTab === 'description' && (
              <div className="description-content">
                <div className="problem-description">
                  {problem.description.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>

                <div className="examples-section">
                  <h3>Examples:</h3>
                  {problem.examples.map((example, index) => (
                    <div key={index} className="example">
                      <h4>Example {index + 1}:</h4>
                      <div className="example-block">
                        <strong>Input:</strong> {example.input}<br/>
                        <strong>Output:</strong> {example.output}<br/>
                        <strong>Explanation:</strong> {example.explanation}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="constraints-section">
                  <h3>Constraints:</h3>
                  <ul>
                    {problem.constraints.map((constraint, index) => (
                      <li key={index}>{constraint}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'testcases' && (
              <div className="testcases-content">
                <h3>Test Cases:</h3>
                {testResults.length > 0 ? (
                  <div className="test-results">
                    {testResults.map((result) => (
                      <div key={result.id} className={`test-case ${result.passed ? 'passed' : 'failed'}`}>
                        <div className="test-header">
                          <span className="test-number">Test Case {result.id}</span>
                          <span className={`test-status ${result.passed ? 'passed' : 'failed'}`}>
                            {result.passed ? '✓ Passed' : '✗ Failed'}
                          </span>
                        </div>
                        <div className="test-details">
                          <div><strong>Input:</strong> {result.input}</div>
                          <div><strong>Expected:</strong> {result.expectedOutput}</div>
                          <div><strong>Actual:</strong> {result.actualOutput}</div>
                          <div><strong>Runtime:</strong> {result.runtime}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Run your code to see test results.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="right-panel">
          <div className="editor-header">
            <select 
              value={selectedLanguage} 
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="language-select"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
            
            <div className="editor-actions">
              <button 
                onClick={runCode} 
                disabled={isRunning}
                className="run-btn"
              >
                {isRunning ? 'Running...' : 'Run Code'}
              </button>
              <button 
                onClick={submitSolution}
                className="submit-btn"
              >
                Submit Solution
              </button>
            </div>
          </div>

          <div className="editor-container">
            <Editor
              height="60vh"
              language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                insertSpaces: true,
                wordWrap: 'on'
              }}
            />
          </div>

          {output && (
            <div className="output-section">
              <h4>Output:</h4>
              <div className="output-content">
                {output}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemSolver;
