"""
Python Code Executor for DSA Problems
"""

import subprocess
import sys
import os
import tempfile
import time
import json
import copy
import inspect
import multiprocessing as mp
import queue
from typing import Dict, List, Any, Tuple
from io import StringIO
from contextlib import redirect_stdout, redirect_stderr
import logging

logger = logging.getLogger(__name__)


def _execute_function_case_in_process(code: str, resolved_name: str, call_args: tuple, result_queue: mp.Queue):
    """Run one function test case in a subprocess so infinite loops can be force-terminated."""
    stdout_capture = StringIO()
    try:
        with redirect_stdout(stdout_capture):
            namespace = {}
            exec(code, namespace)
            func = namespace.get(resolved_name)
            if func is None:
                raise RuntimeError(f'Function "{resolved_name}" not found in isolated execution namespace')

            import tracemalloc
            tracemalloc.start()
            try:
                result = func(*call_args)
                _, peak_bytes = tracemalloc.get_traced_memory()
            finally:
                tracemalloc.stop()

        result_queue.put({
            'ok': True,
            'result': result,
            'stdout': stdout_capture.getvalue(),
            'peak_memory_mb': peak_bytes / (1024 * 1024)
        })
    except Exception as e:
        result_queue.put({
            'ok': False,
            'error': str(e),
            'stdout': stdout_capture.getvalue(),
            'peak_memory_mb': 0
        })


class TestComparator:
    """Robust test case comparison with intelligent data structure handling"""
    
    @staticmethod
    def deep_equals(actual: Any, expected: Any) -> bool:
        """
        Deep comparison of test results handling various data types
        
        Args:
            actual: Actual output from function
            expected: Expected output from test case
            
        Returns:
            True if they are semantically equal, False otherwise
        """
        # None handling
        if actual is None and expected is None:
            return True
        if actual is None or expected is None:
            return False
        
        # Type checking
        if type(actual) != type(expected):
            # Try type coercion for numbers
            try:
                if isinstance(expected, (int, float)) and isinstance(actual, (int, float)):
                    return abs(float(actual) - float(expected)) < 1e-9
            except:
                pass
            return False
        
        # Direct comparison for basic types
        if isinstance(actual, (str, int, float, bool)):
            if isinstance(actual, float):
                return abs(actual - expected) < 1e-9
            return actual == expected
        
        # List/Array comparison
        if isinstance(actual, list):
            if len(actual) != len(expected):
                return False
            return all(TestComparator.deep_equals(a, e) for a, e in zip(actual, expected))
        
        # Tuple comparison
        if isinstance(actual, tuple):
            if len(actual) != len(expected):
                return False
            return all(TestComparator.deep_equals(a, e) for a, e in zip(actual, expected))
        
        # Dict comparison
        if isinstance(actual, dict):
            if set(actual.keys()) != set(expected.keys()):
                return False
            return all(TestComparator.deep_equals(actual[k], expected[k]) for k in actual.keys())
        
        # Set comparison (order doesn't matter)
        if isinstance(actual, set):
            return actual == expected
        
        # Fallback
        return actual == expected
    
    @staticmethod
    def format_value(value: Any, max_length: int = 100) -> str:
        """Format value for display with truncation"""
        try:
            if value is None:
                return "None"
            if isinstance(value, bool):
                return str(value)
            if isinstance(value, (str, int, float)):
                s = str(value)
                return s[:max_length] + "..." if len(s) > max_length else s
            # For complex types, use JSON representation
            s = json.dumps(value, default=str)
            return s[:max_length] + "..." if len(s) > max_length else s
        except:
            s = str(value)
            return s[:max_length] + "..." if len(s) > max_length else s


class PythonExecutor:
    """Execute Python code safely with timeout and resource limits"""
    
    def __init__(self, timeout: int = 10, max_memory_mb: int = 512):
        self.timeout = timeout
        self.max_memory_mb = max_memory_mb

    @staticmethod
    def _to_snake_case(name: str) -> str:
        out = []
        for i, ch in enumerate(name):
            if ch.isupper() and i > 0:
                out.append('_')
            out.append(ch.lower())
        return ''.join(out)

    @staticmethod
    def _name_variants(name: str) -> List[str]:
        raw = str(name or '').strip()
        if not raw:
            return []

        if '_' in raw:
            parts = [p for p in raw.split('_') if p]
            snake = '_'.join(p.lower() for p in parts) if parts else raw.lower()
            camel = parts[0].lower() + ''.join(p.capitalize() for p in parts[1:]) if parts else raw
            pascal = ''.join(p.capitalize() for p in parts) if parts else raw
        else:
            snake = PythonExecutor._to_snake_case(raw)
            bits = [p for p in snake.split('_') if p]
            camel = bits[0].lower() + ''.join(p.capitalize() for p in bits[1:]) if bits else raw
            pascal = ''.join(p.capitalize() for p in bits) if bits else raw

        ordered = []
        for candidate in (raw, snake, camel, pascal):
            if candidate and candidate not in ordered:
                ordered.append(candidate)
        return ordered

    @staticmethod
    def _expected_arg_count(test_cases: List[Dict[str, Any]]) -> int:
        if not test_cases:
            return 0
        test_input = test_cases[0].get('input', ())
        if isinstance(test_input, tuple):
            return len(test_input)
        if isinstance(test_input, list):
            return len(test_input)
        return 1

    @staticmethod
    def _can_accept_arity(func: Any, arg_count: int) -> bool:
        try:
            sig = inspect.signature(func)
        except Exception:
            return False

        params = list(sig.parameters.values())
        required_positional = 0
        optional_positional = 0
        has_varargs = False

        for p in params:
            if p.kind in (inspect.Parameter.POSITIONAL_ONLY, inspect.Parameter.POSITIONAL_OR_KEYWORD):
                if p.default is inspect._empty:
                    required_positional += 1
                else:
                    optional_positional += 1
            elif p.kind == inspect.Parameter.VAR_POSITIONAL:
                has_varargs = True

        if arg_count < required_positional:
            return False
        if has_varargs:
            return True
        return arg_count <= (required_positional + optional_positional)

    def _resolve_callable(self, namespace: Dict[str, Any], function_name: str, test_cases: List[Dict[str, Any]]):
        candidates = self._name_variants(function_name)
        seen = set()
        ordered = []
        for c in candidates:
            if c not in seen:
                ordered.append(c)
                seen.add(c)

        for candidate in ordered:
            fn = namespace.get(candidate)
            if callable(fn):
                return fn, candidate

        solution_cls = namespace.get('Solution')
        if solution_cls and isinstance(solution_cls, type):
            try:
                sol = solution_cls()
                for candidate in ordered:
                    method = getattr(sol, candidate, None)
                    if callable(method):
                        return method, f"Solution.{candidate}"
            except Exception:
                pass

        # Fallback: allow custom entry function names if exactly one compatible candidate exists.
        expected_arity = self._expected_arg_count(test_cases)
        fallback_candidates = []

        for name, fn in namespace.items():
            if name.startswith('__'):
                continue
            # Avoid treating classes/objects as entry functions.
            if not inspect.isfunction(fn):
                continue
            if self._can_accept_arity(fn, expected_arity):
                fallback_candidates.append((name, fn))

        if solution_cls and isinstance(solution_cls, type):
            try:
                sol = solution_cls()
                for name in dir(sol):
                    if name.startswith('_'):
                        continue
                    method = getattr(sol, name, None)
                    if callable(method) and self._can_accept_arity(method, expected_arity):
                        fallback_candidates.append((f"Solution.{name}", method))
            except Exception:
                pass

        # De-duplicate by name
        dedup = {}
        for name, fn in fallback_candidates:
            dedup[name] = fn
        fallback_candidates = list(dedup.items())

        if len(fallback_candidates) == 1:
            return fallback_candidates[0][1], fallback_candidates[0][0]

        if len(fallback_candidates) > 1:
            for preferred in ('solve', 'solution', 'main'):
                for name, fn in fallback_candidates:
                    if name.endswith(preferred):
                        return fn, name

        return None, None

    @staticmethod
    def _get_callable_by_resolved_name(namespace: Dict[str, Any], resolved_name: str):
        """Resolve a previously selected entrypoint from a fresh namespace."""
        if not resolved_name:
            return None
        if resolved_name.startswith('Solution.'):
            method_name = resolved_name.split('.', 1)[1]
            solution_cls = namespace.get('Solution')
            if solution_cls and isinstance(solution_cls, type):
                try:
                    sol = solution_cls()
                    method = getattr(sol, method_name, None)
                    if callable(method):
                        return method
                except Exception:
                    return None
            return None
        fn = namespace.get(resolved_name)
        if callable(fn):
            return fn
        return None

    @staticmethod
    def _is_two_sum_match(actual: Any, expected: Any) -> bool:
        """
        LeetCode-style tolerance for Two Sum index order.
        Accept [i, j] and [j, i] as equivalent.
        """
        if not isinstance(actual, (list, tuple)) or not isinstance(expected, (list, tuple)):
            return False
        if len(actual) != 2 or len(expected) != 2:
            return False
        if not all(isinstance(x, int) for x in actual) or not all(isinstance(x, int) for x in expected):
            return False
        return set(actual) == set(expected)
        
    def execute_code(self, code: str, test_inputs: List[Any] = None) -> Dict[str, Any]:
        """
        Execute Python code and return output/errors
        
        Args:
            code: Python code string
            test_inputs: List of inputs to test
            
        Returns:
            Dictionary with execution results
        """
        try:
            # Create temporary file for code
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(code)
                temp_file = f.name
            
            try:
                # Execute code
                result = subprocess.run(
                    [sys.executable, temp_file],
                    capture_output=True,
                    text=True,
                    timeout=self.timeout
                )
                
                return {
                    'status': 'success' if result.returncode == 0 else 'error',
                    'stdout': result.stdout,
                    'stderr': result.stderr,
                    'return_code': result.returncode,
                    'execution_time': self.timeout
                }
                
            finally:
                # Clean up temp file
                if os.path.exists(temp_file):
                    os.remove(temp_file)
                    
        except subprocess.TimeoutExpired:
            return {
                'status': 'timeout',
                'stdout': '',
                'stderr': f'Execution timeout exceeded ({self.timeout}s)',
                'return_code': -1,
                'execution_time': self.timeout
            }
        except Exception as e:
            return {
                'status': 'error',
                'stdout': '',
                'stderr': str(e),
                'return_code': -1,
                'execution_time': 0
            }
    
    def execute_with_function(self, code: str, function_name: str, 
                             test_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Execute Python code with specific function tests using robust comparison
        
        Args:
            code: Python code containing function definition
            function_name: Name of function to test
            test_cases: List of test cases with 'input' and 'expected' keys
            
        Returns:
            Dictionary with test results and deterministic validation
        """
        try:
            # Pre-validate code once before per-test isolated execution.
            compile(code, '<submission>', 'exec')

            # Check entry resolution once for clear upfront error messaging.
            bootstrap_namespace = {}
            exec(code, bootstrap_namespace)
            bootstrap_func, bootstrap_name = self._resolve_callable(
                bootstrap_namespace, function_name, test_cases
            )
            if bootstrap_func is None:
                return {
                    'status': 'error',
                    'error': f'Function "{function_name}" not found in code. Use exact LeetCode signature.',
                    'test_results': [],
                    'passed': 0,
                    'total': len(test_cases),
                    'validation_mode': 'strict'
                }

            test_results = []
            passed_count = 0
            resolved_name = bootstrap_name
            
            for i, test_case in enumerate(test_cases):
                stdout_capture = StringIO()
                try:
                    start_time = time.time()

                    # LeetCode-style isolation: execute in a fresh namespace per test case.
                    with redirect_stdout(stdout_capture):
                        namespace = {}
                        exec(code, namespace)
                        func = self._get_callable_by_resolved_name(namespace, bootstrap_name)
                        if func is None:
                            # Defensive fallback to handle unexpected resolution drift.
                            func, current_resolved = self._resolve_callable(namespace, function_name, [test_case])
                            if func is None:
                                raise RuntimeError(f'Function "{function_name}" could not be resolved for test case {i + 1}')
                            if current_resolved:
                                resolved_name = current_resolved
                        
                        # Extract input and expected output
                        test_input = test_case.get('input', ())
                        expected = test_case.get('expected')

                        # Isolate input from mutation side effects.
                        isolated_input = copy.deepcopy(test_input)
                        if isinstance(isolated_input, tuple):
                            call_args = isolated_input
                        elif isinstance(isolated_input, list):
                            call_args = tuple(isolated_input)
                        else:
                            call_args = (isolated_input,)

                        result_queue = mp.Queue()
                        worker = mp.Process(
                            target=_execute_function_case_in_process,
                            args=(code, bootstrap_name, call_args, result_queue)
                        )
                        worker.start()
                        worker.join(self.timeout)

                        if worker.is_alive():
                            worker.terminate()
                            worker.join()
                            raise TimeoutError(f'Execution timeout exceeded ({self.timeout}s)')

                        try:
                            process_result = result_queue.get_nowait()
                        except queue.Empty:
                            raise RuntimeError('Execution process completed without returning a result')

                        if not process_result.get('ok'):
                            raise RuntimeError(process_result.get('error', 'Execution failed'))

                        result = process_result.get('result')
                        peak_memory_mb = float(process_result.get('peak_memory_mb', 0))
                        captured_stdout = process_result.get('stdout', '')

                    # LeetCode-style in-place functions may return None.
                    actual_for_compare = result
                    if result is None and isinstance(call_args, tuple) and len(call_args) == 1:
                        if isinstance(call_args[0], list):
                            actual_for_compare = call_args[0]
                    
                    execution_time = time.time() - start_time
                    time_limit_exceeded = execution_time > self.timeout
                    memory_limit_exceeded = peak_memory_mb > self.max_memory_mb
                    
                    # Use robust comparison
                    if time_limit_exceeded:
                        passed = False
                        actual_for_compare = 'TIMEOUT'
                    elif memory_limit_exceeded:
                        passed = False
                        actual_for_compare = 'MEMORY_LIMIT_EXCEEDED'
                    elif function_name in ('twoSum', 'two_sum'):
                        passed = (
                            TestComparator.deep_equals(actual_for_compare, expected)
                            or self._is_two_sum_match(actual_for_compare, expected)
                        )
                    else:
                        passed = TestComparator.deep_equals(actual_for_compare, expected)
                    if passed:
                        passed_count += 1
                    
                    test_results.append({
                        'test_case': i + 1,
                        'input': TestComparator.format_value(isolated_input),
                        'expected': TestComparator.format_value(expected),
                        'got': TestComparator.format_value(actual_for_compare),
                        'passed': passed,
                        'execution_time': round(execution_time * 1000, 2),  # ms
                        'memory_used_mb': round(peak_memory_mb, 3),
                        'time_limit_exceeded': time_limit_exceeded,
                        'memory_limit_exceeded': memory_limit_exceeded,
                        'stdout': captured_stdout,
                        'hidden': bool(test_case.get('hidden', False))
                    })
                    
                except Exception as e:
                    captured_stdout = stdout_capture.getvalue()
                    is_timeout = isinstance(e, TimeoutError)
                    test_results.append({
                        'test_case': i + 1,
                        'input': TestComparator.format_value(test_case.get('input')),
                        'expected': TestComparator.format_value(test_case.get('expected')),
                        'got': 'TIMEOUT' if is_timeout else 'ERROR',
                        'passed': False,
                        'error': str(e),
                        'execution_time': round(self.timeout * 1000, 2) if is_timeout else 0,
                        'memory_used_mb': 0,
                        'time_limit_exceeded': is_timeout,
                        'memory_limit_exceeded': False,
                        'stdout': captured_stdout,
                        'hidden': bool(test_case.get('hidden', False))
                    })

                    # If one case timed out, stop executing subsequent cases to avoid long hangs.
                    if is_timeout:
                        for j in range(i + 1, len(test_cases)):
                            remaining_case = test_cases[j]
                            test_results.append({
                                'test_case': j + 1,
                                'input': TestComparator.format_value(remaining_case.get('input')),
                                'expected': TestComparator.format_value(remaining_case.get('expected')),
                                'got': 'TIMEOUT',
                                'passed': False,
                                'error': f'Execution timeout exceeded ({self.timeout}s)',
                                'execution_time': round(self.timeout * 1000, 2),
                                'memory_used_mb': 0,
                                'time_limit_exceeded': True,
                                'memory_limit_exceeded': False,
                                'stdout': '',
                                'hidden': bool(remaining_case.get('hidden', False))
                            })
                        break
            
            return {
                'status': 'success',
                'test_results': test_results,
                'passed': passed_count,
                'total': len(test_cases),
                'all_passed': passed_count == len(test_cases),
                'validation_mode': 'strict',
                'resolved_function': resolved_name,
                'final_stdout': test_results[-1].get('stdout', '') if test_results else ''
            }
            
        except SyntaxError as e:
            return {
                'status': 'syntax_error',
                'error': str(e),
                'test_results': [],
                'passed': 0,
                'total': len(test_cases),
                'validation_mode': 'strict'
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'test_results': [],
                'passed': 0,
                'total': len(test_cases),
                'validation_mode': 'strict'
            }
    
    def run_terminal_code(self, code: str, stdin_data: str = '') -> Dict[str, str]:
        """
        Run code in terminal and return output
        
        Args:
            code: Python code to execute
            stdin_data: Optional stdin payload to pass to the process
            
        Returns:
            Dictionary with stdout and stderr
        """
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            temp_file = f.name
        
        try:
            result = subprocess.run(
                [sys.executable, temp_file],
                input=stdin_data,
                capture_output=True,
                text=True,
                timeout=self.timeout
            )
            
            return {
                'stdout': result.stdout,
                'stderr': result.stderr,
                'return_code': result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                'stdout': '',
                'stderr': f'Execution timeout ({self.timeout}s)',
                'return_code': -1
            }
        finally:
            if os.path.exists(temp_file):
                os.remove(temp_file)
