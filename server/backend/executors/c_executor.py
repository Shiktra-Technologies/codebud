"""
C Code Executor for DSA Problems
"""

import subprocess
import tempfile
import os
import time
from typing import Dict, List, Any
import logging
import platform

logger = logging.getLogger(__name__)


class CExecutor:
    """Execute C code safely with compilation and execution"""
    
    def __init__(self, timeout: int = 10, max_memory_mb: int = 512):
        self.timeout = timeout
        self.max_memory_mb = max_memory_mb
        self.is_windows = platform.system() == 'Windows'
        
    def execute_code(self, code: str, test_inputs: List[str] = None) -> Dict[str, Any]:
        """
        Compile and execute C code
        
        Args:
            code: C code string
            test_inputs: List of inputs to test (optional)
            
        Returns:
            Dictionary with compilation/execution results
        """
        temp_dir = tempfile.mkdtemp()
        
        try:
            # Write source file
            source_file = os.path.join(temp_dir, 'solution.c')
            with open(source_file, 'w') as f:
                f.write(code)
            
            # Compile
            executable = os.path.join(temp_dir, 'solution.exe' if self.is_windows else 'solution')
            compile_cmd = ['gcc', '-o', executable, source_file, '-lm']
            
            compile_result = subprocess.run(
                compile_cmd,
                capture_output=True,
                text=True,
                timeout=self.timeout
            )
            
            if compile_result.returncode != 0:
                return {
                    'status': 'compilation_error',
                    'error': compile_result.stderr,
                    'stdout': '',
                    'stderr': compile_result.stderr
                }
            
            # Execute
            if test_inputs:
                # Run with provided inputs
                combined_input = '\n'.join(test_inputs)
                exec_result = subprocess.run(
                    [executable],
                    input=combined_input,
                    capture_output=True,
                    text=True,
                    timeout=self.timeout
                )
            else:
                # Run without input
                exec_result = subprocess.run(
                    [executable],
                    capture_output=True,
                    text=True,
                    timeout=self.timeout
                )
            
            return {
                'status': 'success' if exec_result.returncode == 0 else 'runtime_error',
                'stdout': exec_result.stdout,
                'stderr': exec_result.stderr,
                'return_code': exec_result.returncode
            }
            
        except subprocess.TimeoutExpired:
            return {
                'status': 'timeout',
                'error': f'Execution timeout exceeded ({self.timeout}s)',
                'stdout': '',
                'stderr': f'Execution timeout exceeded ({self.timeout}s)'
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'stdout': '',
                'stderr': str(e)
            }
        finally:
            # Cleanup temp files
            try:
                import shutil
                shutil.rmtree(temp_dir)
            except:
                pass
    
    def run_terminal_code(self, code: str, test_inputs: List[str] = None) -> Dict[str, str]:
        """
        Compile and run C code in terminal, return output
        
        Args:
            code: C code to execute
            test_inputs: Optional list of inputs
            
        Returns:
            Dictionary with stdout and stderr
        """
        result = self.execute_code(code, test_inputs)
        
        return {
            'stdout': result.get('stdout', ''),
            'stderr': result.get('stderr', '') if 'error' not in result else result.get('error', ''),
            'return_code': result.get('return_code', -1),
            'compilation_error': result.get('status') == 'compilation_error'
        }
    
    def execute_with_test_cases(self, code: str, 
                               test_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Execute C code with test cases
        
        For C, test cases would typically be:
        - Standard input/output based
        - Or comparison against expected stdout
        
        Args:
            code: C code to execute
            test_cases: List of test cases
            
        Returns:
            Test results
        """
        test_results = []
        passed_count = 0
        
        temp_dir = tempfile.mkdtemp()
        
        try:
            # Compile once
            source_file = os.path.join(temp_dir, 'solution.c')
            with open(source_file, 'w') as f:
                f.write(code)
            
            executable = os.path.join(temp_dir, 'solution.exe' if self.is_windows else 'solution')
            compile_cmd = ['gcc', '-o', executable, source_file, '-lm']
            
            compile_result = subprocess.run(
                compile_cmd,
                capture_output=True,
                text=True,
                timeout=self.timeout
            )
            
            if compile_result.returncode != 0:
                return {
                    'status': 'compilation_error',
                    'error': compile_result.stderr,
                    'test_results': [],
                    'passed': 0,
                    'total': len(test_cases)
                }
            
            # Run test cases
            for i, test_case in enumerate(test_cases):
                try:
                    test_input = test_case.get('input', '')
                    expected_output = test_case.get('expected', '')
                    
                    start_time = time.time()
                    
                    exec_result = subprocess.run(
                        [executable],
                        input=test_input,
                        capture_output=True,
                        text=True,
                        timeout=self.timeout
                    )
                    
                    execution_time = time.time() - start_time
                    
                    # Compare output
                    actual_output = exec_result.stdout.strip()
                    expected_output_str = str(expected_output).strip()
                    passed = actual_output == expected_output_str
                    
                    if passed:
                        passed_count += 1
                    
                    test_results.append({
                        'test_case': i + 1,
                        'input': test_input[:100],  # Truncate for display
                        'expected': expected_output_str[:100],
                        'got': actual_output[:100],
                        'passed': passed,
                        'execution_time': round(execution_time * 1000, 2),
                        'memory_used_mb': 0,
                        'time_limit_exceeded': False,
                        'memory_limit_exceeded': False,
                        'hidden': bool(test_case.get('hidden', False))
                    })
                    
                except subprocess.TimeoutExpired:
                    test_results.append({
                        'test_case': i + 1,
                        'input': test_input[:100],
                        'expected': expected_output_str[:100],
                        'got': 'TIMEOUT',
                        'passed': False,
                        'execution_time': self.timeout * 1000,
                        'memory_used_mb': 0,
                        'time_limit_exceeded': True,
                        'memory_limit_exceeded': False,
                        'hidden': bool(test_case.get('hidden', False))
                    })
                except Exception as e:
                    test_results.append({
                        'test_case': i + 1,
                        'input': test_input[:100],
                        'expected': expected_output_str[:100],
                        'got': 'ERROR',
                        'passed': False,
                        'error': str(e),
                        'memory_used_mb': 0,
                        'time_limit_exceeded': False,
                        'memory_limit_exceeded': False,
                        'hidden': bool(test_case.get('hidden', False))
                    })
            
            return {
                'status': 'success',
                'test_results': test_results,
                'passed': passed_count,
                'total': len(test_cases),
                'all_passed': passed_count == len(test_cases)
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'test_results': [],
                'passed': 0,
                'total': len(test_cases)
            }
        finally:
            # Cleanup
            try:
                import shutil
                shutil.rmtree(temp_dir)
            except:
                pass
