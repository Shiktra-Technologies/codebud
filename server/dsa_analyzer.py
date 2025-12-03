"""
DSA Analyzer – Always returns final_output + final_stdout
"""

from typing import Dict, List, Any, Callable
from dataclasses import dataclass
from enum import Enum
import time
import ast
import threading
from io import StringIO
from contextlib import redirect_stdout
import psutil
import os

# ----------------------------------------------------------
# Problems Database - Extended for CodeBud
# ----------------------------------------------------------

problems = {
    "1": {
        "title": "Two Sum",
        "function_name": "two_sum",
        "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        "test_cases": [
            {"input": ([2, 7, 11, 15], 9), "expected": [0, 1]},
            {"input": ([3, 2, 4], 6), "expected": [1, 2]},
            {"input": ([3, 3], 6), "expected": [0, 1]},
            {"input": ([1, 2, 3, 4, 5], 8), "expected": [2, 4]},
            {"input": ([0, 4, 3, 0], 0), "expected": [0, 3]},
        ],
    },
    "2": {
        "title": "Valid Parentheses",
        "function_name": "is_valid",
        "description": "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
        "test_cases": [
            {"input": ("()",), "expected": True},
            {"input": ("()[]{}",), "expected": True},
            {"input": ("(]",), "expected": False},
            {"input": ("([)]",), "expected": False},
            {"input": ("{[]}",), "expected": True},
        ],
    },
    "3": {
        "title": "Reverse Linked List",
        "function_name": "reverse_list",
        "description": "Given the head of a singly linked list, reverse the list, and return the reversed list.",
        "test_cases": [
            {"input": ([1, 2, 3, 4, 5],), "expected": [5, 4, 3, 2, 1]},
            {"input": ([1, 2],), "expected": [2, 1]},
            {"input": ([],), "expected": []},
            {"input": ([1],), "expected": [1]},
        ],
    },
    "4": {
        "title": "Binary Search",
        "function_name": "search",
        "description": "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums.",
        "test_cases": [
            {"input": ([-1, 0, 3, 5, 9, 12], 9), "expected": 4},
            {"input": ([-1, 0, 3, 5, 9, 12], 2), "expected": -1},
            {"input": ([1], 1), "expected": 0},
            {"input": ([1, 2, 3, 4, 5], 3), "expected": 2},
        ],
    },
    "5": {
        "title": "Maximum Subarray",
        "function_name": "max_subarray",
        "description": "Given an integer array nums, find the contiguous subarray which has the largest sum and return its sum.",
        "test_cases": [
            {"input": ([-2, 1, -3, 4, -1, 2, 1, -5, 4],), "expected": 6},
            {"input": ([1],), "expected": 1},
            {"input": ([5, 4, -1, 7, 8],), "expected": 23},
            {"input": ([-1, -2, -3, -4],), "expected": -1},
        ],
    }
}

# ----------------------------------------------------------
# ENUMS + DATACLASSES
# ----------------------------------------------------------

class TestStatus(Enum):
    PASSED = "passed"
    FAILED = "failed"
    ERROR = "error"
    TIMEOUT = "timeout"


class SubmissionStatus(Enum):
    ACCEPTED = "Accepted"
    WRONG_ANSWER = "Wrong Answer"
    RUNTIME_ERROR = "Runtime Error"
    TIME_LIMIT_EXCEEDED = "Time Limit Exceeded"
    COMPILATION_ERROR = "Compilation Error"
    MEMORY_LIMIT_EXCEEDED = "Memory Limit Exceeded"


@dataclass
class TestCase:
    input_data: Any
    expected_output: Any


@dataclass
class TestResult:
    test_case: TestCase
    status: TestStatus
    actual_output: Any = None
    error_message: str = ""
    execution_time: float = 0
    memory_used: float = 0
    stdout_output: str = ""

# ----------------------------------------------------------
# VALIDATOR
# ----------------------------------------------------------

class CodeValidator:
    @staticmethod
    def validate_syntax(code: str):
        try:
            ast.parse(code)
            return True, ""
        except SyntaxError as e:
            return False, f"Syntax Error at line {e.lineno}: {e.msg}"

    @staticmethod
    def check_security(code: str):
        """
        Basic security checks for malicious code
        """
        dangerous_imports = [
            'os', 'sys', 'subprocess', 'socket', 'urllib', 'requests',
            'eval', 'exec', 'compile', '__import__', 'open', 'file',
            'input', 'raw_input'
        ]
        
        dangerous_keywords = [
            '__builtins__', '__globals__', '__locals__', '__import__',
            'getattr', 'setattr', 'delattr', 'hasattr'
        ]
        
        # Check for dangerous imports
        for dangerous in dangerous_imports:
            if dangerous in code:
                return False, f"Potentially dangerous operation detected: {dangerous}"
        
        # Check for dangerous keywords
        for keyword in dangerous_keywords:
            if keyword in code:
                return False, f"Restricted keyword detected: {keyword}"
        
        return True, ""

# ----------------------------------------------------------
# MAIN ANALYZER
# ----------------------------------------------------------

class DSAAnalyzer:

    def __init__(self, code: str, timeout: int = 5, memory_limit: int = 256):
        self.code = code
        self.timeout = timeout
        self.memory_limit = memory_limit
        self.test_results: List[TestResult] = []

    def analyze(self, test_cases: List[TestCase], function_name: str):

        ok, msg = CodeValidator.validate_syntax(self.code)
        if not ok:
            return {
                "status": SubmissionStatus.COMPILATION_ERROR.value,
                "message": msg,
                "is_accepted": False,
                "final_output": None,
                "final_stdout": ""
            }

        ok, msg = CodeValidator.check_security(self.code)
        if not ok:
            return {
                "status": SubmissionStatus.COMPILATION_ERROR.value,
                "message": msg,
                "is_accepted": False,
                "final_output": None,
                "final_stdout": ""
            }

        namespace = {}
        try:
            exec(self.code, namespace)
        except Exception as e:
            return {
                "status": SubmissionStatus.COMPILATION_ERROR.value,
                "message": str(e),
                "is_accepted": False,
                "final_output": None,
                "final_stdout": ""
            }

        if function_name not in namespace:
            return {
                "status": SubmissionStatus.COMPILATION_ERROR.value,
                "message": f"Function '{function_name}' not found.",
                "is_accepted": False,
                "final_output": None,
                "final_stdout": ""
            }

        return self.run_tests(namespace[function_name], test_cases)

    def run_tests(self, student_func: Callable, test_cases: List[TestCase]):

        self.test_results = []
        passed = failed = errors = 0
        total_time = 0
        max_mem = 0

        for tc in test_cases:

            stdout_buf = StringIO()
            output = {"value": None, "err": None}

            start = time.time()
            mem0 = self._mem()

            def execute():
                try:
                    with redirect_stdout(stdout_buf):
                        output["value"] = student_func(*tc.input_data)
                except Exception as e:
                    output["err"] = e

            th = threading.Thread(target=execute)
            th.start()
            th.join(self.timeout)

            runtime = time.time() - start
            mem_used = max(0, self._mem() - mem0)
            max_mem = max(max_mem, mem_used)

            if th.is_alive():
                result = TestResult(tc, TestStatus.TIMEOUT, error_message="Execution timed out")
                errors += 1

            elif output["err"]:
                result = TestResult(tc, TestStatus.ERROR, error_message=str(output["err"]))
                errors += 1

            else:
                actual = output["value"]
                if actual == tc.expected_output:
                    result = TestResult(tc, TestStatus.PASSED, actual_output=actual)
                    passed += 1
                else:
                    result = TestResult(tc, TestStatus.FAILED, actual_output=actual,
                                        error_message=f"Expected {tc.expected_output}, got {actual}")
                    failed += 1

            result.execution_time = runtime
            result.memory_used = mem_used
            result.stdout_output = stdout_buf.getvalue()

            self.test_results.append(result)
            total_time += runtime

        is_correct = (failed == 0 and errors == 0)
        last = self.test_results[-1] if self.test_results else None

        return {
            "status": SubmissionStatus.ACCEPTED.value if is_correct else self._failure(),
            "is_accepted": is_correct,
            "total_tests": len(test_cases),
            "passed": passed,
            "failed": failed,
            "errors": errors,
            "total_execution_time_ms": round(total_time * 1000, 2),
            "max_memory_used_mb": round(max_mem, 2),

            "results": [self._serialize(r) for r in self.test_results],

            # ALWAYS RETURN THESE
            "final_output": last.actual_output if last else None,
            "final_stdout": last.stdout_output if last else "",

            "message": (
                "Accepted! All test cases passed ✓"
                if is_correct else
                "Rejected: Some test cases failed"
            )
        }

    def _failure(self):
        for r in self.test_results:
            if r.status == TestStatus.TIMEOUT:
                return SubmissionStatus.TIME_LIMIT_EXCEEDED.value
            if r.status == TestStatus.ERROR:
                return SubmissionStatus.RUNTIME_ERROR.value
            if r.status == TestStatus.FAILED:
                return SubmissionStatus.WRONG_ANSWER.value
        return SubmissionStatus.WRONG_ANSWER.value

    def _mem(self):
        try:
            return psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024)
        except:
            return 0

    def _serialize(self, r: TestResult):
        return {
            "status": r.status.value,
            "input": str(r.test_case.input_data),
            "expected": str(r.test_case.expected_output),
            "actual": str(r.actual_output),
            "error": r.error_message,
            "execution_time_ms": round(r.execution_time * 1000, 2),
            "memory_used_mb": round(r.memory_used, 2),
            "stdout": r.stdout_output
        }

# ----------------------------------------------------------
# PROBLEM MANAGEMENT
# ----------------------------------------------------------

def get_problem(problem_id: str):
    """Get problem details by ID"""
    return problems.get(problem_id)

def get_all_problems():
    """Get all available problems"""
    return problems

# ----------------------------------------------------------
# REQUIRED BY server.py
# ----------------------------------------------------------

def analyze_code(problem_id: str, code: str, language: str = "python"):
    """
    Public API used by server.py
    """
    if language.lower() != "python":
        return {
            "status": SubmissionStatus.RUNTIME_ERROR.value,
            "message": f"Language '{language}' not supported yet. Only Python is supported.",
            "is_accepted": False,
            "final_output": None,
            "final_stdout": ""
        }

    if problem_id not in problems:
        return {
            "status": SubmissionStatus.RUNTIME_ERROR.value,
            "message": f"Problem '{problem_id}' not found",
            "is_accepted": False,
            "final_output": None,
            "final_stdout": ""
        }

    problem = problems[problem_id]
    test_cases = [
        TestCase(input_data=tc["input"], expected_output=tc["expected"])
        for tc in problem["test_cases"]
    ]

    analyzer = DSAAnalyzer(code)
    return analyzer.analyze(test_cases, problem["function_name"])
