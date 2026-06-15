// Python Interpreter Service using Skulpt
// This runs Python code directly in the browser!

class BrowserPythonService {
    constructor() {
        this.skulptLoaded = false;
        this.loadSkulpt();
    }

    async loadSkulpt() {
        if (this.skulptLoaded) return;
        
        // Load Skulpt (Python-to-JavaScript transpiler)
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/skulpt/0.11.1/skulpt.min.js');
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/skulpt/0.11.1/skulpt-stdlib.js');
        
        this.skulptLoaded = true;
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async executePythonCode(code, input = '') {
        await this.loadSkulpt();
        
        return new Promise((resolve) => {
            let output = '';
            let hasError = false;
            let errorMessage = '';

            // Configure Skulpt
            window.Sk.pre = "output";
            window.Sk.configure({
                output: (text) => {
                    output += text;
                },
                read: (filename) => {
                    if (window.Sk.builtinFiles === undefined || 
                        window.Sk.builtinFiles["files"][filename] === undefined) {
                        throw "File not found: '" + filename + "'";
                    }
                    return window.Sk.builtinFiles["files"][filename];
                },
                inputfun: () => {
                    return input;
                },
                inputfunTakesPrompt: true
            });

            // Execute the code
            const promise = window.Sk.misceval.asyncToPromise(() => {
                return window.Sk.importMainWithBody("<stdin>", false, code, true);
            });

            promise.then(
                () => {
                    resolve({
                        success: true,
                        output: output,
                        error: null,
                        executionTime: 0 // Browser execution is too fast to measure meaningfully
                    });
                },
                (error) => {
                    resolve({
                        success: false,
                        output: output,
                        error: error.toString(),
                        executionTime: 0
                    });
                }
            );
        });
    }

    // Test specific DSA problems
    async testTwoSum(code) {
        const testCode = `
${code}

# Test cases
test_cases = [
    ([2, 7, 11, 15], 9),
    ([3, 2, 4], 6), 
    ([3, 3], 6)
]

expected = [[0, 1], [1, 2], [0, 1]]
results = []

for i, (nums, target) in enumerate(test_cases):
    try:
        result = two_sum(nums, target)
        passed = result == expected[i]
        results.append({
            'input': [nums, target],
            'expected': expected[i],
            'actual': result,
            'passed': passed
        })
        print(f"Test {i+1}: {'PASS' if passed else 'FAIL'}")
        if not passed:
            print(f"  Expected: {expected[i]}, Got: {result}")
    except Exception as e:
        results.append({
            'input': [nums, target],
            'expected': expected[i],
            'actual': None,
            'passed': False,
            'error': str(e)
        })
        print(f"Test {i+1}: ERROR - {e}")

# Print summary
passed_count = sum(1 for r in results if r['passed'])
print(f"\\nResults: {passed_count}/{len(results)} tests passed")
`;

        return await this.executePythonCode(testCode);
    }
}

export default BrowserPythonService;
