// Hybrid DSA Code Execution Service
// Supports both browser-based and server-based execution
// Uses apiClient for authenticated requests to Flask backend

import apiClient from '@/lib/apiClient';

class DSAService {
    constructor() {
        // Server-based execution
        this.baseURL = process.env.REACT_APP_DSA_SERVER_URL || 'http://localhost:5001/api';
        this.timeout = 30000; // 30 seconds timeout for code execution
        
        // Browser-based execution options
        this.useBrowserFirst = process.env.REACT_APP_USE_BROWSER_FIRST !== 'false';
        this.fallbackToServer = process.env.REACT_APP_FALLBACK_TO_SERVER !== 'false';
    }

    /**
     * Execute DSA code submission
     * @param {string} problemId - The problem ID
     * @param {string} code - The user's code
     * @param {string} language - Programming language (default: python)
     * @returns {Promise<Object>} Execution results
     */
    async executeCode(problemId, code, language = 'python') {
        try {
            const response = await apiClient.post('/api/run', {
                problem_id: problemId,
                code: code,
                language: language
            }, { timeout: this.timeout });

            return response.data;
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                throw new Error('Code execution timed out. Please optimize your solution.');
            }
            if (error.response) {
                throw new Error(error.response.data?.error || `Server error: ${error.response.status}`);
            }
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                throw new Error('No internet connection. Please check your network.');
            }
            throw new Error(`Connection failed: ${error.message}`);
        }
    }

    /**
     * Get all available DSA problems
     * @returns {Promise<Array>} List of problems
     */
    async getProblems() {
        try {
            const response = await apiClient.get('/api/problems');
            return response.data.problems || [];
        } catch (error) {
            console.error('Error fetching problems:', error);
            throw new Error('Failed to load problems. Please try again later.');
        }
    }

    /**
     * Get specific problem details
     * @param {string} problemId - The problem ID
     * @returns {Promise<Object>} Problem details
     */
    async getProblem(problemId) {
        try {
            const response = await apiClient.get(`/api/problem/${problemId}`);
            return response.data.problem;
        } catch (error) {
            if (error.response?.status === 404) {
                throw new Error(`Problem ${problemId} not found`);
            }
            console.error('Error fetching problem:', error);
            throw error;
        }
    }

    /**
     * Check if DSA server is healthy
     * @returns {Promise<boolean>} Server health status
     */
    async checkHealth() {
        try {
            const response = await apiClient.get('/api/health', { timeout: 5000 });
            return response.status === 200;
        } catch (error) {
            console.warn('DSA server health check failed:', error.message);
            return false;
        }
    }

    /**
     * Submit code for final evaluation (same as executeCode but semantically different)
     * @param {string} problemId - The problem ID
     * @param {string} code - The user's code
     * @param {string} language - Programming language
     * @returns {Promise<Object>} Submission results
     */
    async submitCode(problemId, code, language = 'python') {
        return this.executeCode(problemId, code, language);
    }

    /**
     * Format execution results for display
     * @param {Object} result - Raw execution result
     * @returns {Object} Formatted result
     */
    formatResult(result) {
        return {
            success: result.is_accepted,
            status: result.status,
            message: result.message,
            statistics: {
                totalTests: result.total_tests,
                passed: result.passed,
                failed: result.failed,
                errors: result.errors,
                executionTime: result.total_execution_time_ms,
                memoryUsed: result.max_memory_used_mb
            },
            testResults: result.results || [],
            output: {
                finalOutput: result.final_output,
                finalStdout: result.final_stdout
            }
        };
    }

    /**
     * Get problem template code for a specific problem
     * @param {string} problemId - The problem ID
     * @returns {string} Template code
     */
    getProblemTemplate(problemId) {
        const templates = {
            '1': `def two_sum(nums, target):
    """
    Given an array of integers nums and an integer target,
    return indices of the two numbers such that they add up to target.
    
    Args:
        nums: List[int] - Array of integers
        target: int - Target sum
    
    Returns:
        List[int] - Indices of the two numbers
    """
    # Your solution here
    pass`,

            '2': `def is_valid(s):
    """
    Given a string s containing just the characters '(', ')', '{', '}', '[' and ']',
    determine if the input string is valid.
    
    Args:
        s: str - String of parentheses
    
    Returns:
        bool - True if valid, False otherwise
    """
    # Your solution here
    pass`,

            '3': `def reverse_list(head):
    """
    Given the head of a singly linked list, reverse the list,
    and return the reversed list.
    
    Args:
        head: List[int] - List representation of linked list
    
    Returns:
        List[int] - Reversed list
    """
    # Your solution here
    pass`,

            '4': `def search(nums, target):
    """
    Given an array of integers nums which is sorted in ascending order,
    and an integer target, write a function to search target in nums.
    
    Args:
        nums: List[int] - Sorted array of integers
        target: int - Target to search for
    
    Returns:
        int - Index of target, or -1 if not found
    """
    # Your solution here
    pass`,

            '5': `def max_subarray(nums):
    """
    Given an integer array nums, find the contiguous subarray
    which has the largest sum and return its sum.
    
    Args:
        nums: List[int] - Array of integers
    
    Returns:
        int - Maximum subarray sum
    """
    # Your solution here
    pass`
        };

        return templates[problemId] || `def solution():
    """
    Your solution here
    """
    pass`;
    }
}

// Create and export a singleton instance
const dsaService = new DSAService();
export default dsaService;
