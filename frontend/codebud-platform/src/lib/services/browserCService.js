// Basic C compiler/interpreter using TCC.js (Tiny C Compiler in WebAssembly)
// This can compile and run C code in the browser!

class BrowserCService {
    constructor() {
        this.tccLoaded = false;
        this.tcc = null;
    }

    async loadTCC() {
        if (this.tccLoaded) return this.tcc;

        // Load TCC.js (Tiny C Compiler compiled to WebAssembly)
        // Note: This is a conceptual example - you'd need to include TCC.js
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tcc-js@1.0.0/dist/tcc.js';
        document.head.appendChild(script);

        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
        });

        // Initialize TCC
        this.tcc = new window.TCC();
        this.tccLoaded = true;
        
        return this.tcc;
    }

    async compileCCode(code) {
        const tcc = await this.loadTCC();
        
        try {
            // Compile C code
            const compiled = tcc.compile(code);
            
            return {
                success: true,
                executable: compiled,
                error: null
            };
        } catch (error) {
            return {
                success: false,
                executable: null,
                error: error.toString()
            };
        }
    }

    async executeCCode(code, input = '') {
        const compilation = await this.compileCCode(code);
        
        if (!compilation.success) {
            return {
                success: false,
                output: '',
                error: compilation.error,
                compilationError: true
            };
        }

        try {
            // Execute compiled code
            const result = compilation.executable.run(input);
            
            return {
                success: true,
                output: result.stdout,
                error: result.stderr,
                exitCode: result.exitCode,
                compilationError: false
            };
        } catch (error) {
            return {
                success: false,
                output: '',
                error: error.toString(),
                compilationError: false
            };
        }
    }

    // Test binary search problem in C
    async testBinarySearch(code) {
        const testCode = `
#include <stdio.h>
${code}

int main() {
    // Test cases for binary search
    int arr1[] = {-1, 0, 3, 5, 9, 12};
    int arr2[] = {-1, 0, 3, 5, 9, 12};
    int arr3[] = {1};
    
    int size1 = 6, size2 = 6, size3 = 1;
    int target1 = 9, target2 = 2, target3 = 1;
    int expected1 = 4, expected2 = -1, expected3 = 0;
    
    int result1 = search(arr1, size1, target1);
    int result2 = search(arr2, size2, target2);
    int result3 = search(arr3, size3, target3);
    
    printf("Test 1: %s\\n", result1 == expected1 ? "PASS" : "FAIL");
    printf("Test 2: %s\\n", result2 == expected2 ? "PASS" : "FAIL");
    printf("Test 3: %s\\n", result3 == expected3 ? "PASS" : "FAIL");
    
    int passed = 0;
    if (result1 == expected1) passed++;
    if (result2 == expected2) passed++;
    if (result3 == expected3) passed++;
    
    printf("\\nResults: %d/3 tests passed\\n", passed);
    
    return 0;
}
`;

        return await this.executeCCode(testCode);
    }
}

export default BrowserCService;
