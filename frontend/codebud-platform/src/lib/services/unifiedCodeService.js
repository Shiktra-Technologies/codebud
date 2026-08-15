// Unified Browser Code Execution Service
// Supports Python (Skulpt + Pyodide) and C (TCC.js) in the browser

import BrowserPythonService from './browserPythonService';
import PyodidePythonService from './pyodidePythonService';
import BrowserCService from './browserCService';

class UnifiedCodeService {
    constructor() {
        this.skulptService = new BrowserPythonService();
        this.pyodideService = new PyodidePythonService();
        this.cService = new BrowserCService();
        
        this.supportedLanguages = ['python', 'python3', 'c', 'cpp'];
    }

    async executeCode(language, code, problemId = null, useAdvanced = false) {
        const lang = language.toLowerCase();
        
        try {
            switch (lang) {
                case 'python':
                case 'python3':
                    if (problemId) {
                        // Use advanced Pyodide for DSA problems
                        return await this.pyodideService.testDSAProblem(problemId, code);
                    } else if (useAdvanced) {
                        // Use Pyodide for advanced Python features
                        return await this.pyodideService.executePythonCode(code);
                    } else {
                        // Use faster Skulpt for simple code
                        return await this.skulptService.executePythonCode(code);
                    }
                
                case 'c':
                    if (problemId) {
                        return await this.cService.testBinarySearch(code);
                    } else {
                        return await this.cService.executeCCode(code);
                    }
                
                case 'cpp':
                    // C++ support would require a different compiler
                    throw new Error('C++ support coming soon!');
                
                default:
                    throw new Error(`Language ${language} not supported`);
            }
        } catch (error) {
            return {
                success: false,
                error: `Execution failed: ${error.message}`,
                output: ''
            };
        }
    }

    async checkLanguageSupport(language) {
        const lang = language.toLowerCase();
        
        switch (lang) {
            case 'python':
            case 'python3':
                // Check if Skulpt is available
                try {
                    await this.skulptService.loadSkulpt();
                    return { supported: true, engine: 'Skulpt + Pyodide' };
                } catch {
                    return { supported: false, reason: 'Failed to load Python interpreter' };
                }
            
            case 'c':
                try {
                    await this.cService.loadTCC();
                    return { supported: true, engine: 'TCC.js' };
                } catch {
                    return { supported: false, reason: 'Failed to load C compiler' };
                }
            
            default:
                return { supported: false, reason: `Language ${language} not implemented` };
        }
    }

    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    // Get code templates for different languages
    getCodeTemplate(language, problemId = '1') {
        const lang = language.toLowerCase();
        
        const templates = {
            python: {
                '1': `def two_sum(nums, target):
    """
    Given an array of integers nums and an integer target,
    return indices of the two numbers such that they add up to target.
    """
    # Your solution here
    pass`,
                '2': `def is_valid(s):
    """
    Given a string s containing just the characters '(', ')', '{', '}', '[' and ']',
    determine if the input string is valid.
    """
    # Your solution here
    pass`
            },
            c: {
                binary_search: `#include <stdio.h>

int search(int* nums, int numsSize, int target) {
    /*
     * Binary search implementation
     * Return index of target, or -1 if not found
     */
    // Your solution here
    return -1;
}`
            }
        };

        return templates[lang]?.[problemId] || `// Template for ${language} not available`;
    }
}

// Create singleton instance
const unifiedCodeService = new UnifiedCodeService();
export default unifiedCodeService;
