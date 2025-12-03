import React, { useState, useEffect } from 'react';
import dsaService from '../services/dsaService';
import './DSATest.css';

const DSATest = () => {
    const [problems, setProblems] = useState([]);
    const [selectedProblem, setSelectedProblem] = useState('');
    const [code, setCode] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [serverHealth, setServerHealth] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        checkServerAndLoadProblems();
    }, []);

    const checkServerAndLoadProblems = async () => {
        try {
            console.log('Checking DSA server health...');
            
            // Check server health
            const isHealthy = await dsaService.checkHealth();
            console.log('Server health:', isHealthy);
            setServerHealth(isHealthy);

            if (isHealthy) {
                console.log('Loading problems...');
                // Load problems
                const problemList = await dsaService.getProblems();
                console.log('Problems loaded:', problemList.length);
                setProblems(problemList);
                
                // Select first problem by default
                if (problemList.length > 0) {
                    const firstProblem = problemList[0];
                    setSelectedProblem(firstProblem.id);
                    setCode(dsaService.getProblemTemplate(firstProblem.id));
                }
            } else {
                setError('DSA server is not responding. Please check if the server is deployed correctly on Railway.');
            }
        } catch (err) {
            console.error('Error connecting to DSA server:', err);
            setError(`Failed to connect to DSA server: ${err.message}`);
        }
    };

    const handleProblemChange = (problemId) => {
        setSelectedProblem(problemId);
        setCode(dsaService.getProblemTemplate(problemId));
        setResults(null);
        setError('');
    };

    const executeCode = async () => {
        if (!selectedProblem || !code.trim()) {
            setError('Please select a problem and write some code');
            return;
        }

        // Check server health before executing
        if (!serverHealth) {
            setError('DSA server is not available. Please check the Railway deployment.');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            console.log('Executing code for problem:', selectedProblem);
            console.log('Code:', code);
            
            const result = await dsaService.executeCode(selectedProblem, code);
            console.log('Raw result:', result);
            
            if (!result || typeof result !== 'object') {
                throw new Error('Invalid response from server');
            }
            
            const formattedResult = dsaService.formatResult(result);
            console.log('Formatted result:', formattedResult);
            setResults(formattedResult);
        } catch (err) {
            console.error('Code execution error:', err);
            setError(`Execution failed: ${err.message}`);
            setResults(null);
        } finally {
            setLoading(false);
        }
    };

    const selectedProblemData = problems.find(p => p.id === selectedProblem);

    if (!serverHealth) {
        return (
            <div className="dsa-test-container">
                <div className="server-error">
                    <h2>🔴 DSA Server Not Available</h2>
                    <p>The DSA execution server is not running.</p>
                    <div className="setup-instructions">
                        <h3>To start the server:</h3>
                        <ol>
                            <li>Open a new terminal in the project root</li>
                            <li>Run: <code>./setup-dsa-server.sh</code> (first time only)</li>
                            <li>Run: <code>./start-dsa-server.sh</code></li>
                            <li>Refresh this page</li>
                        </ol>
                    </div>
                    <button onClick={checkServerAndLoadProblems} className="retry-btn">
                        🔄 Check Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="dsa-test-container">
            <div className="dsa-header">
                <h1>🧠 DSA Code Execution Test</h1>
                <div className="server-status">
                    <span className="status-indicator healthy">🟢 Server Online</span>
                </div>
            </div>

            <div className="dsa-content">
                <div className="problem-section">
                    <div className="problem-selector">
                        <label htmlFor="problem-select">Choose Problem:</label>
                        <select 
                            id="problem-select"
                            value={selectedProblem} 
                            onChange={(e) => handleProblemChange(e.target.value)}
                        >
                            {problems.map(problem => (
                                <option key={problem.id} value={problem.id}>
                                    {problem.title} (ID: {problem.id})
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedProblemData && (
                        <div className="problem-details">
                            <h3>{selectedProblemData.title}</h3>
                            <p>{selectedProblemData.description}</p>
                            <p><strong>Function:</strong> <code>{selectedProblemData.function_name}</code></p>
                            <p><strong>Test Cases:</strong> {selectedProblemData.test_count}</p>
                        </div>
                    )}
                </div>

                <div className="code-section">
                    <div className="code-editor">
                        <label htmlFor="code-textarea">Your Code:</label>
                        <textarea
                            id="code-textarea"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Write your solution here..."
                            rows={15}
                            cols={80}
                        />
                    </div>

                    <div className="execute-section">
                        <button 
                            onClick={executeCode} 
                            disabled={loading}
                            className="execute-btn"
                        >
                            {loading ? '⏳ Executing...' : '🚀 Execute Code'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="error-display">
                        <h3>❌ Error</h3>
                        <p>{error}</p>
                    </div>
                )}

                {results && (
                    <div className="results-section">
                        <div className={`result-header ${results.success ? 'success' : 'failure'}`}>
                            <h3>
                                {results.success ? '✅ Success!' : '❌ Failed'}
                            </h3>
                            <p>{results.message}</p>
                        </div>

                        <div className="statistics">
                            <h4>📊 Statistics</h4>
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <span className="stat-label">Total Tests:</span>
                                    <span className="stat-value">{results.statistics.totalTests}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Passed:</span>
                                    <span className="stat-value passed">{results.statistics.passed}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Failed:</span>
                                    <span className="stat-value failed">{results.statistics.failed}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Errors:</span>
                                    <span className="stat-value errors">{results.statistics.errors}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Execution Time:</span>
                                    <span className="stat-value">{results.statistics.executionTime}ms</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Memory Used:</span>
                                    <span className="stat-value">{results.statistics.memoryUsed}MB</span>
                                </div>
                            </div>
                        </div>

                        {results.testResults && results.testResults.length > 0 && (
                            <div className="test-results">
                                <h4>🧪 Test Results</h4>
                                {results.testResults.map((test, index) => (
                                    <div key={index} className={`test-case ${test.status}`}>
                                        <h5>Test Case {index + 1}</h5>
                                        <div className="test-details">
                                            <p><strong>Input:</strong> {test.input}</p>
                                            <p><strong>Expected:</strong> {test.expected}</p>
                                            <p><strong>Actual:</strong> {test.actual}</p>
                                            <p><strong>Status:</strong> 
                                                <span className={`status ${test.status}`}>
                                                    {test.status.toUpperCase()}
                                                </span>
                                            </p>
                                            {test.error && (
                                                <p><strong>Error:</strong> <span className="error-text">{test.error}</span></p>
                                            )}
                                            {test.stdout && (
                                                <p><strong>Output:</strong> <pre>{test.stdout}</pre></p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(results.output.finalOutput || results.output.finalStdout) && (
                            <div className="final-output">
                                <h4>📤 Final Output</h4>
                                {results.output.finalOutput && (
                                    <p><strong>Return Value:</strong> {JSON.stringify(results.output.finalOutput)}</p>
                                )}
                                {results.output.finalStdout && (
                                    <div>
                                        <strong>Console Output:</strong>
                                        <pre>{results.output.finalStdout}</pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DSATest;
