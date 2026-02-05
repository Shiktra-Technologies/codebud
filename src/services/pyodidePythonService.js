// Advanced Python execution using Pyodide (Python in WebAssembly)
// This is more powerful than Skulpt and closer to real Python

class PyodidePythonService {
    constructor() {
        this.pyodideLoaded = false;
        this.pyodide = null;
    }

    async loadPyodide() {
        if (this.pyodideLoaded) return this.pyodide;

        // Load Pyodide (full Python interpreter in WebAssembly)
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        document.head.appendChild(script);

        await new Promise((resolve) => {
            script.onload = resolve;
        });

        // Initialize Pyodide
        this.pyodide = await window.loadPyodide();
        this.pyodideLoaded = true;
        
        return this.pyodide;
    }

    async executePythonCode(code, captureOutput = true) {
        const pyodide = await this.loadPyodide();
        
        let result = {
            success: false,
            output: '',
            error: null,
            returnValue: null,
            executionTime: 0
        };

        const startTime = performance.now();

        try {
            // Capture stdout if needed
            if (captureOutput) {
                pyodide.runPython(`
import sys
from io import StringIO
_stdout_capture = StringIO()
sys.stdout = _stdout_capture
`);
            }

            // Execute the user code
            const returnValue = pyodide.runPython(code);

            // Get captured output
            if (captureOutput) {
                const output = pyodide.runPython('_stdout_capture.getvalue()');
                result.output = output;
                
                // Restore stdout
                pyodide.runPython('sys.stdout = sys.__stdout__');
            }

            result.success = true;
            result.returnValue = returnValue;
            result.executionTime = performance.now() - startTime;

        } catch (error) {
            result.error = error.toString();
            result.executionTime = performance.now() - startTime;
        }

        return result;
    }

    async testDSAProblem(problemId, code) {
        const pyodide = await this.loadPyodide();
        
        // Define test cases for each problem
        const problems = {
            '1': {
                functionName: 'two_sum',
                testCases: [
                    { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
                    { input: [[3, 2, 4], 6], expected: [1, 2] },
                    { input: [[3, 3], 6], expected: [0, 1] }
                ]
            },
            '2': {
                functionName: 'is_valid',
                testCases: [
                    { input: ['()'], expected: true },
                    { input: ['()[]{}'], expected: true },
                    { input: ['(]'], expected: false },
                    { input: ['([)]'], expected: false },
                    { input: ['{[]}'], expected: true }
                ]
            }
        };

        if (!problems[problemId]) {
            return { error: `Problem ${problemId} not found` };
        }

        const problem = problems[problemId];
        
        // Create comprehensive test code
        const testCode = `
${code}

import json
import traceback
import time

results = []
total_passed = 0

test_cases = ${JSON.stringify(problem.testCases)}

for i, test_case in enumerate(test_cases):
    test_result = {
        'test_number': i + 1,
        'input': test_case['input'],
        'expected': test_case['expected'],
        'actual': None,
        'passed': False,
        'error': None,
        'execution_time': 0
    }
    
    try:
        start_time = time.time()
        
        # Call the function with unpacked arguments
        if len(test_case['input']) == 1:
            actual = ${problem.functionName}(test_case['input'][0])
        else:
            actual = ${problem.functionName}(*test_case['input'])
            
        end_time = time.time()
        
        test_result['actual'] = actual
        test_result['execution_time'] = round((end_time - start_time) * 1000, 2)  # Convert to ms
        test_result['passed'] = actual == test_case['expected']
        
        if test_result['passed']:
            total_passed += 1
            print(f"✓ Test {i+1}: PASSED")
        else:
            print(f"✗ Test {i+1}: FAILED")
            print(f"  Expected: {test_case['expected']}")
            print(f"  Got: {actual}")
            
    except Exception as e:
        test_result['error'] = str(e)
        test_result['traceback'] = traceback.format_exc()
        print(f"✗ Test {i+1}: ERROR - {str(e)}")
    
    results.append(test_result)

# Summary
total_tests = len(test_cases)
print(f"\\nResults: {total_passed}/{total_tests} tests passed")

# Calculate score
score = (total_passed / total_tests) * 100
if score == 100:
    print(f"Perfect score! All tests passed!")
    status = "Accepted"
elif score >= 80:
    print(f"Good job! {score}% success rate")
    status = "Partially Accepted"
else:
    print(f"Keep trying! {score}% success rate")
    status = "Wrong Answer"

# Return results as JSON string for JavaScript
import json
final_result = {
    'status': status,
    'total_tests': total_tests,
    'passed': total_passed,
    'failed': total_tests - total_passed,
    'success_rate': score,
    'results': results
}

json.dumps(final_result)
`;

        try {
            const result = await this.executePythonCode(testCode);
            
            if (result.success && result.returnValue) {
                // Parse the JSON result from Python
                const testResults = JSON.parse(result.returnValue);
                return {
                    success: true,
                    output: result.output,
                    ...testResults
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'Execution failed',
                    output: result.output
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.toString(),
                output: ''
            };
        }
    }

    // Install packages (Pyodide supports many Python packages)
    async installPackage(packageName) {
        const pyodide = await this.loadPyodide();
        await pyodide.loadPackage(packageName);
    }

    // Get available packages
    async getAvailablePackages() {
        const pyodide = await this.loadPyodide();
        return pyodide.runPython(`
import pyodide_js
list(pyodide_js._api.packages.keys())
`);
    }
}

export default PyodidePythonService;
