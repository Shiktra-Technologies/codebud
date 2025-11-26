import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProctor } from '../context/ProctorContext';
import './ProblemList.css';

// Sample DSA problems data
const sampleProblems = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    category: "Array",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    acceptance: "49.1%",
    frequency: "High"
  },
  {
    id: 2,
    title: "Reverse Linked List",
    difficulty: "Easy",
    category: "Linked List",
    description: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    acceptance: "71.6%",
    frequency: "High"
  },
  {
    id: 3,
    title: "Valid Parentheses",
    difficulty: "Easy",
    category: "Stack",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    acceptance: "40.1%",
    frequency: "Medium"
  },
  {
    id: 4,
    title: "Binary Tree Inorder Traversal",
    difficulty: "Easy",
    category: "Tree",
    description: "Given the root of a binary tree, return the inorder traversal of its nodes' values.",
    acceptance: "74.4%",
    frequency: "Medium"
  },
  {
    id: 5,
    title: "Maximum Subarray",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
    acceptance: "53.5%",
    frequency: "High"
  },
  {
    id: 6,
    title: "Climbing Stairs",
    difficulty: "Easy",
    category: "Dynamic Programming",
    description: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    acceptance: "52.9%",
    frequency: "High"
  },
  {
    id: 7,
    title: "Merge Two Sorted Lists",
    difficulty: "Easy",
    category: "Linked List",
    description: "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists in a sorted manner and return the head of the merged linked list.",
    acceptance: "62.8%",
    frequency: "High"
  },
  {
    id: 8,
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    category: "Array",
    description: "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.",
    acceptance: "54.2%",
    frequency: "High"
  },
  {
    id: 9,
    title: "Contains Duplicate",
    difficulty: "Easy",
    category: "Array",
    description: "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
    acceptance: "60.3%",
    frequency: "Medium"
  },
  {
    id: 10,
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    category: "String",
    description: "Given a string s, find the length of the longest substring without repeating characters.",
    acceptance: "33.8%",
    frequency: "High"
  }
];

const ProblemList = () => {
  const navigate = useNavigate();
  const { startMonitoring, mediaStream } = useProctor();
  const [problems] = useState(sampleProblems);
  const [filteredProblems, setFilteredProblems] = useState(sampleProblems);
  const [filters, setFilters] = useState({
    difficulty: 'All',
    category: 'All',
    search: ''
  });

  const [testStarted, setTestStarted] = useState(false);

  useEffect(() => {
    // Apply filters
    let filtered = problems;

    if (filters.difficulty !== 'All') {
      filtered = filtered.filter(p => p.difficulty === filters.difficulty);
    }

    if (filters.category !== 'All') {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    if (filters.search) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredProblems(filtered);
  }, [filters, problems]);

  const handleProblemSelect = (problemId) => {
    if (!testStarted) {
      // Start monitoring when first problem is selected
      startMonitoring();
      setTestStarted(true);
    }
    navigate(`/problem/${problemId}`);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#00b894';
      case 'Medium': return '#fdcb6e';
      case 'Hard': return '#e17055';
      default: return '#74b9ff';
    }
  };

  const categories = ['All', ...new Set(problems.map(p => p.category))];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  // Show warning if trying to start without proper permissions
  if (!mediaStream) {
    return (
      <div className="problem-list-container">
        <div className="error-message">
          <h2>⚠️ Access Denied</h2>
          <p>Please go back and grant all required permissions before accessing problems.</p>
          <button onClick={() => navigate('/')} className="back-btn">
            Go Back to Permissions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="problem-list-container">
      {/* Header */}
      <div className="header-section">
        <div className="platform-info">
          <h1>CodeBud DSA Platform</h1>
          <p>Practice Data Structures & Algorithms - Proctored Environment</p>
          {testStarted && (
            <div className="monitoring-status">
              🔴 <strong>LIVE MONITORING ACTIVE</strong> - Do not switch tabs!
            </div>
          )}
        </div>
        
        {/* Camera preview */}
        <div className="camera-preview">
          <video 
            autoPlay 
            muted 
            ref={(video) => {
              if (video && mediaStream) {
                video.srcObject = mediaStream;
              }
            }}
            className="preview-video"
          />
          <div className="preview-label">You</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search problems..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>

        <div className="filter-dropdowns">
          <select 
            value={filters.difficulty}
            onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
          >
            {difficulties.map(diff => (
              <option key={diff} value={diff}>{diff}</option>
            ))}
          </select>

          <select 
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Problems Table */}
      <div className="problems-section">
        <div className="problems-header">
          <h2>Problems ({filteredProblems.length})</h2>
        </div>

        <div className="problems-table">
          <div className="table-header">
            <div className="col-status">Status</div>
            <div className="col-title">Title</div>
            <div className="col-acceptance">Acceptance</div>
            <div className="col-difficulty">Difficulty</div>
            <div className="col-frequency">Frequency</div>
          </div>

          {filteredProblems.map((problem) => (
            <div 
              key={problem.id} 
              className="problem-row"
              onClick={() => handleProblemSelect(problem.id)}
            >
              <div className="col-status">
                <div className="status-icon unsolved">○</div>
              </div>
              <div className="col-title">
                <div className="problem-title">{problem.title}</div>
                <div className="problem-category">{problem.category}</div>
              </div>
              <div className="col-acceptance">{problem.acceptance}</div>
              <div className="col-difficulty">
                <span 
                  className="difficulty-badge"
                  style={{ backgroundColor: getDifficultyColor(problem.difficulty) }}
                >
                  {problem.difficulty}
                </span>
              </div>
              <div className="col-frequency">
                <span className={`frequency-badge ${problem.frequency.toLowerCase()}`}>
                  {problem.frequency}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredProblems.length === 0 && (
          <div className="no-problems">
            <p>No problems found matching your criteria.</p>
          </div>
        )}
      </div>

      {!testStarted && (
        <div className="start-warning">
          <p>⚠️ Selecting any problem will start the proctored test session. Make sure you're ready!</p>
        </div>
      )}
    </div>
  );
};

export default ProblemList;
