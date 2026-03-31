// Hybrid DSA Code Execution Service
// Supports both browser-based and server-based execution
// Uses dedicated DSA client so execution calls go to /server/backend analyzer service

import axios from 'axios';
import { getToken } from '@/lib/apiClient';

function normalizeDsaBaseUrl(rawUrl) {
    const url = String(rawUrl || '').trim();
    if (!url) return '';
    const withoutSlash = url.replace(/\/+$/, '');
    if (withoutSlash.endsWith('/api')) return withoutSlash;
    return `${withoutSlash}/api`;
}

function resolveDsaBaseUrl() {
    return normalizeDsaBaseUrl('/api/proxy');
}

class DSAService {
    constructor() {
        // Server-based execution
        this.baseURL = resolveDsaBaseUrl();
        this.timeout = 30000; // 30 seconds timeout for code execution
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        // Browser-based execution options
        this.useBrowserFirst = process.env.NEXT_PUBLIC_USE_BROWSER_FIRST !== 'false';
        this.fallbackToServer = process.env.NEXT_PUBLIC_FALLBACK_TO_SERVER !== 'false';

        // Reuse auth token for protected DSA routes if present.
        this.client.interceptors.request.use((config) => {
            const token = getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    normalizeExecutionResponse(data) {
        const safe = data || {};
        const status = safe.status || (safe.is_accepted ? 'Accepted' : 'failed');
        const output =
            safe.output ||
            safe.final_output ||
            safe.final_stdout ||
            safe.result ||
            safe.message ||
            '';
        const hasFailureStatus = ['failed', 'runtime error', 'compilation error', 'error'].includes(String(status).toLowerCase());
        const rawError = safe.error || (hasFailureStatus ? safe.message : '');
        const error = rawError ? String(rawError) : null;
        const hasExecutionFailure = Boolean(error) || Boolean(safe.compilation_error) || Number(safe.return_code || 0) !== 0;
        const success = Boolean(
            safe.is_accepted ??
            (typeof safe.success === 'boolean' ? safe.success && !hasExecutionFailure : !hasFailureStatus && !hasExecutionFailure)
        );

        return {
            ...safe,
            success,
            status,
            output,
            error,
            // Legacy aliases consumed by older UI components.
            allPassed: Boolean(safe.is_accepted ?? safe.allPassed ?? safe.all_passed),
            passed: Number(safe.passed ?? 0),
            total_tests: Number(safe.total_tests ?? 0),
        };
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
            const payload = {
                problem_id: problemId,
                code,
                language,
            };
            console.log('[DSA] executeCode request', {
                baseURL: this.baseURL,
                endpoint: '/run',
                problemId,
                language,
                codeLength: String(code || '').length,
            });

            const response = await this.client.post('/run', payload, { timeout: this.timeout });
            const normalized = this.normalizeExecutionResponse(response.data);

            console.log('[DSA] executeCode response', {
                status: normalized.status,
                accepted: normalized.allPassed,
                passed: normalized.passed,
                total_tests: normalized.total_tests,
            });

            return normalized;
        } catch (error) {
            // Timeout error
            if (error.code === 'ECONNABORTED') {
                const msg = 'Code execution timed out (30s). Please optimize your solution.';
                console.error('[DSA] Timeout:', msg);
                throw new Error(msg);
            }
            
            // Server response error (HTTP error status)
            if (error.response) {
                console.error('[DSA] Server error response', {
                    status: error.response.status,
                    data: error.response.data,
                });
                throw new Error(error.response.data?.error || `Server error: ${error.response.status}`);
            }
            
            // Network error (no response from server)
            if (!error.response && error.code === 'ECONNREFUSED') {
                const msg = `Cannot connect to API server at ${this.baseURL}. Is the backend running on the correct port?`;
                console.error('[DSA] Connection refused:', msg);
                throw new Error(msg);
            }
            
            // Offline check
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                const msg = 'No internet connection. Please check your network.';
                console.error('[DSA] Offline:', msg);
                throw new Error(msg);
            }
            
            // Generic network error
            console.error('[DSA] Network error', {
                message: error.message,
                code: error.code,
                errno: error.errno,
            });
            throw new Error(`Connection failed: ${error.message}. Please check that the backend API is running.`);
        }
    }

    /**
     * Get all available DSA problems
     * @returns {Promise<Array>} List of problems
     */
    async getProblems() {
        try {
            const response = await this.client.get('/problems');
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
            const response = await this.client.get(`/problem/${problemId}`);
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
            const response = await this.client.get('/health', { timeout: 5000 });
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
