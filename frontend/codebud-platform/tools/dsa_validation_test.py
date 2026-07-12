#!/usr/bin/env python3
"""
Comprehensive DSA Function Validation Suite
Tests all DSA functions for correctness, edge cases, and reliability
"""

import requests
import json
import sys
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime

BASE_URL = "http://127.0.0.1:5001"


@dataclass
class TestResult:
    """Record of a single test case result"""
    problem_id: str
    problem_name: str
    function_name: str
    test_name: str
    test_input: str
    expected_output: str
    actual_output: str
    passed: bool
    error: str = ""
    execution_time_ms: float = 0.0
    category: str = "normal"  # normal, edge, stress


@dataclass
class ProblemValidation:
    """Validation report for a single problem"""
    problem_id: str
    problem_name: str
    function_name: str
    total_tests: int = 0
    passed_tests: int = 0
    failed_tests: int = 0
    error_tests: int = 0
    test_results: List[TestResult] = None
    
    def __post_init__(self):
        if self.test_results is None:
            self.test_results = []


class DSAValidator:
    """Comprehensive DSA validation system"""
    
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.results: List[ProblemValidation] = []
        self.all_test_results: List[TestResult] = []
    
    def run_test(self, problem_id: str, problem_name: str, function_name: str, 
                test_name: str, code: str, test_input: Tuple, expected: Any,
                category: str = "normal") -> TestResult:
        """
        Execute a single test case via the DSA API
        """
        try:
            response = requests.post(
                f"{self.base_url}/api/run",
                json={
                    "problem_id": problem_id,
                    "code": code,
                    "language": "python",
                    "judge_mode": "test"
                },
                timeout=15
            )
            
            result_data = response.json()
            
            # Parse the response to get test results
            test_results = result_data.get('test_results', [])
            all_passed = result_data.get('all_passed', False)
            
            # Extract actual output from the last test result
            actual_output = "No output"
            error = ""
            exec_time = 0.0
            
            if test_results:
                last_result = test_results[-1]
                actual_output = str(last_result.get('got', 'ERROR'))
                error = last_result.get('error', '')
                exec_time = last_result.get('execution_time', 0)
            
            test_result = TestResult(
                problem_id=problem_id,
                problem_name=problem_name,
                function_name=function_name,
                test_name=test_name,
                test_input=str(test_input),
                expected_output=str(expected),
                actual_output=actual_output,
                passed=all_passed,
                error=error,
                execution_time_ms=exec_time,
                category=category
            )
            
            self.all_test_results.append(test_result)
            return test_result
            
        except Exception as e:
            test_result = TestResult(
                problem_id=problem_id,
                problem_name=problem_name,
                function_name=function_name,
                test_name=test_name,
                test_input=str(test_input),
                expected_output=str(expected),
                actual_output="EXCEPTION",
                passed=False,
                error=str(e),
                category=category
            )
            self.all_test_results.append(test_result)
            return test_result
    
    def validate_problem_1_two_sum(self):
        """Validate Problem 1: Two Sum"""
        problem_id = "1"
        problem_name = "Two Sum"
        function_name = "two_sum"
        
        # Correct solution
        solution = """
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
"""
        
        validation = ProblemValidation(
            problem_id=problem_id,
            problem_name=problem_name,
            function_name=function_name
        )
        
        # Normal test cases
        test_cases = [
            ("normal_case_1", ([2, 7, 11, 15], 9), [0, 1]),
            ("normal_case_2", ([3, 2, 4], 6), [1, 2]),
            ("normal_case_3", ([3, 3], 6), [0, 1]),
            ("edge_empty", ([], 0), []),
            ("edge_single_pair", ([1, 2], 3), [0, 1]),
            ("edge_duplicate_values", ([0, 4, 3, 0], 0), [0, 3]),
            ("edge_negative_numbers", ([-1, -2, -3, 5], 2), [2, 3]),
            ("stress_large_array", (list(range(1000)) + [1100, 1500], 2500), [1100, 1500]),
        ]
        
        for test_name, test_input, expected in test_cases:
            result = self.run_test(
                problem_id, problem_name, function_name,
                test_name, solution, test_input, expected,
                category="edge" if "edge" in test_name else ("stress" if "stress" in test_name else "normal")
            )
            validation.test_results.append(result)
            if result.passed:
                validation.passed_tests += 1
            else:
                validation.failed_tests += 1
        
        validation.total_tests = len(validation.test_results)
        self.results.append(validation)
        return validation
    
    def validate_problem_2_valid_parentheses(self):
        """Validate Problem 2: Valid Parentheses"""
        problem_id = "2"
        problem_name = "Valid Parentheses"
        function_name = "is_valid"
        
        solution = """
def is_valid(s):
    stack = []
    pairs = {'(': ')', '[': ']', '{': '}'}
    for char in s:
        if char in pairs:
            stack.append(char)
        else:
            if not stack or pairs[stack.pop()] != char:
                return False
    return len(stack) == 0
"""
        
        validation = ProblemValidation(
            problem_id=problem_id,
            problem_name=problem_name,
            function_name=function_name
        )
        
        test_cases = [
            ("normal_case_1", ("()",), True),
            ("normal_case_2", ("()[]{}",), True),
            ("normal_case_3", ("(]",), False),
            ("edge_empty", ("",), True),
            ("edge_single_char", ("(",), False),
            ("edge_nested", ("(([]){})",), True),
            ("edge_invalid_nested", ("([)]",), False),
            ("edge_only_close", (")",), False),
            ("stress_long_valid", ("(" * 500 + ")" * 500,), True),
            ("stress_long_invalid", ("(" * 500 + ")" * 499,), False),
        ]
        
        for test_name, test_input, expected in test_cases:
            result = self.run_test(
                problem_id, problem_name, function_name,
                test_name, solution, test_input, expected,
                category="edge" if "edge" in test_name else ("stress" if "stress" in test_name else "normal")
            )
            validation.test_results.append(result)
            if result.passed:
                validation.passed_tests += 1
            else:
                validation.failed_tests += 1
        
        validation.total_tests = len(validation.test_results)
        self.results.append(validation)
        return validation
    
    def validate_problem_3_reverse_linked_list(self):
        """Validate Problem 3: Reverse Linked List"""
        problem_id = "3"
        problem_name = "Reverse Linked List"
        function_name = "reverse_list"
        
        solution = """
def reverse_list(head):
    if not head:
        return []
    result = []
    for i in range(len(head) - 1, -1, -1):
        result.append(head[i])
    return result
"""
        
        validation = ProblemValidation(
            problem_id=problem_id,
            problem_name=problem_name,
            function_name=function_name
        )
        
        test_cases = [
            ("normal_case_1", ([1, 2, 3, 4, 5],), [5, 4, 3, 2, 1]),
            ("normal_case_2", ([1, 2],), [2, 1]),
            ("edge_empty", ([],), []),
            ("edge_single", ([1],), [1]),
            ("edge_two_elements", ([1, 2],), [2, 1]),
            ("edge_duplicates", ([1, 1, 1, 1],), [1, 1, 1, 1]),
            ("stress_large", (list(range(1000)),), list(range(999, -1, -1))),
        ]
        
        for test_name, test_input, expected in test_cases:
            result = self.run_test(
                problem_id, problem_name, function_name,
                test_name, solution, test_input, expected,
                category="edge" if "edge" in test_name else ("stress" if "stress" in test_name else "normal")
            )
            validation.test_results.append(result)
            if result.passed:
                validation.passed_tests += 1
            else:
                validation.failed_tests += 1
        
        validation.total_tests = len(validation.test_results)
        self.results.append(validation)
        return validation
    
    def validate_problem_4_binary_search(self):
        """Validate Problem 4: Binary Search"""
        problem_id = "4"
        problem_name = "Binary Search"
        function_name = "search"
        
        solution = """
def search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
"""
        
        validation = ProblemValidation(
            problem_id=problem_id,
            problem_name=problem_name,
            function_name=function_name
        )
        
        test_cases = [
            ("normal_case_1", ([-1, 0, 3, 5, 9, 12], 9), 4),
            ("normal_case_2", ([-1, 0, 3, 5, 9, 12], 2), -1),
            ("edge_single_found", ([1], 1), 0),
            ("edge_single_not_found", ([1], 2), -1),
            ("edge_target_first", ([1, 2, 3, 4, 5], 1), 0),
            ("edge_target_last", ([1, 2, 3, 4, 5], 5), 4),
            ("edge_negative_numbers", ([-10, -5, -1, 0, 5, 10], -5), 1),
            ("stress_large_array", (list(range(0, 1000, 2)), 500), 250),
            ("stress_large_not_found", (list(range(0, 1000, 2)), 999), -1),
        ]
        
        for test_name, test_input, expected in test_cases:
            result = self.run_test(
                problem_id, problem_name, function_name,
                test_name, solution, test_input, expected,
                category="edge" if "edge" in test_name else ("stress" if "stress" in test_name else "normal")
            )
            validation.test_results.append(result)
            if result.passed:
                validation.passed_tests += 1
            else:
                validation.failed_tests += 1
        
        validation.total_tests = len(validation.test_results)
        self.results.append(validation)
        return validation
    
    def validate_problem_5_maximum_subarray(self):
        """Validate Problem 5: Maximum Subarray"""
        problem_id = "5"
        problem_name = "Maximum Subarray"
        function_name = "max_subarray"
        
        solution = """
def max_subarray(nums):
    max_sum = current_sum = nums[0] if nums else 0
    for num in nums[1:]:
        current_sum = max(num, current_sum + num)
        max_sum = max(max_sum, current_sum)
    return max_sum
"""
        
        validation = ProblemValidation(
            problem_id=problem_id,
            problem_name=problem_name,
            function_name=function_name
        )
        
        test_cases = [
            ("normal_case_1", ([-2, 1, -3, 4, -1, 2, 1, -5, 4],), 6),
            ("normal_case_2", ([1],), 1),
            ("normal_case_3", ([5, 4, -1, 7, 8],), 23),
            ("edge_all_negative", ([-1, -2, -3, -4],), -1),
            ("edge_all_positive", ([1, 2, 3, 4],), 10),
            ("edge_single_positive", ([5],), 5),
            ("edge_single_negative", ([-5],), -5),
            ("edge_mixed", ([-5, 10, -3, 5, -2],), 12),
            ("stress_large_positive", (list(range(1, 1001)),), sum(range(1, 1001))),
            ("stress_large_negative", (list(range(-500, 0)),), -1),
        ]
        
        for test_name, test_input, expected in test_cases:
            result = self.run_test(
                problem_id, problem_name, function_name,
                test_name, solution, test_input, expected,
                category="edge" if "edge" in test_name else ("stress" if "stress" in test_name else "normal")
            )
            validation.test_results.append(result)
            if result.passed:
                validation.passed_tests += 1
            else:
                validation.failed_tests += 1
        
        validation.total_tests = len(validation.test_results)
        self.results.append(validation)
        return validation
    
    def run_all_validations(self):
        """Execute all DSA validations"""
        print("=" * 80)
        print("DSA COMPREHENSIVE VALIDATION TEST SUITE")
        print("=" * 80)
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        self.validate_problem_1_two_sum()
        print("✓ Problem 1 (Two Sum) validation complete")
        
        self.validate_problem_2_valid_parentheses()
        print("✓ Problem 2 (Valid Parentheses) validation complete")
        
        self.validate_problem_3_reverse_linked_list()
        print("✓ Problem 3 (Reverse Linked List) validation complete")
        
        self.validate_problem_4_binary_search()
        print("✓ Problem 4 (Binary Search) validation complete")
        
        self.validate_problem_5_maximum_subarray()
        print("✓ Problem 5 (Maximum Subarray) validation complete")
        
        self.generate_report()
    
    def generate_report(self):
        """Generate comprehensive validation report"""
        print("\n" + "=" * 80)
        print("VALIDATION REPORT")
        print("=" * 80 + "\n")
        
        total_tests = sum(r.total_tests for r in self.results)
        total_passed = sum(r.passed_tests for r in self.results)
        total_failed = sum(r.failed_tests for r in self.results)
        
        print(f"📊 EXECUTION SUMMARY")
        print(f"{'─' * 80}")
        print(f"Total Functions Tested:    {len(self.results)}")
        print(f"Total Test Cases:          {total_tests}")
        print(f"Passed Tests:              {total_passed} ✅")
        print(f"Failed Tests:              {total_failed} ❌")
        print(f"Success Rate:              {100 * total_passed / total_tests:.1f}%\n" if total_tests > 0 else "N/A\n")
        
        # Per-problem breakdown
        print(f"\n📋 PROBLEM-BY-PROBLEM BREAKDOWN")
        print(f"{'─' * 80}")
        for result in self.results:
            status = "✅ PASSED" if result.failed_tests == 0 else "❌ SOME FAILED"
            print(f"Problem {result.problem_id}: {result.problem_name} [{status}]")
            print(f"  Function: {result.function_name}")
            print(f"  Tests: {result.passed_tests}/{result.total_tests} passed")
            print()
        
        # Detailed results
        print(f"\n🔍 DETAILED TEST RESULTS")
        print(f"{'─' * 80}\n")
        
        for result in self.results:
            print(f"Problem {result.problem_id}: {result.problem_name}")
            print(f"Function: {result.function_name}")
            print(f"{'─' * 80}")
            
            for test_result in result.test_results:
                status = "✅" if test_result.passed else "❌"
                print(f"{status} {test_result.test_name} [{test_result.category}]")
                print(f"   Input:    {test_result.test_input[:80]}")
                print(f"   Expected: {test_result.expected_output[:80]}")
                print(f"   Got:      {test_result.actual_output[:80]}")
                if test_result.error:
                    print(f"   Error:    {test_result.error[:80]}")
                print(f"   Time:     {test_result.execution_time_ms:.2f}ms")
                print()
        
        # Failed cases summary
        failed_cases = [t for t in self.all_test_results if not t.passed]
        if failed_cases:
            print(f"\n⚠️  FAILED TESTS SUMMARY ({len(failed_cases)} failures)")
            print(f"{'─' * 80}\n")
            for test in failed_cases:
                print(f"Problem {test.problem_id} ({test.function_name}): {test.test_name}")
                print(f"  Expected: {test.expected_output[:80]}")
                print(f"  Got:      {test.actual_output[:80]}")
                if test.error:
                    print(f"  Error:    {test.error[:80]}")
                print()
        
        # Edge case coverage
        edge_cases = [t for t in self.all_test_results if t.category == "edge"]
        stress_cases = [t for t in self.all_test_results if t.category == "stress"]
        edge_passed = sum(1 for t in edge_cases if t.passed)
        stress_passed = sum(1 for t in stress_cases if t.passed)
        
        print(f"\n🧪 TEST CATEGORY COVERAGE")
        print(f"{'─' * 80}")
        print(f"Edge Cases: {edge_passed}/{len(edge_cases)} passed" if edge_cases else "Edge Cases: None run")
        print(f"Stress Tests: {stress_passed}/{len(stress_cases)} passed" if stress_cases else "Stress Tests: None run")
        
        # Final verdict
        print(f"\n{'=' * 80}")
        if total_failed == 0:
            print("✅ VALIDATION PASSED - ALL DSA FUNCTIONS WORKING CORRECTLY")
        else:
            print(f"❌ VALIDATION FAILED - {total_failed} test cases failed")
            print("⚠️  Review failed cases above and fix issues")
        print(f"{'=' * 80}\n")
        
        # Save report to file
        report_file = "DSA_VALIDATION_REPORT.json"
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "total_functions": len(self.results),
            "total_tests": total_tests,
            "passed_tests": total_passed,
            "failed_tests": total_failed,
            "success_rate": 100 * total_passed / total_tests if total_tests > 0 else 0,
            "problems": [
                {
                    "id": r.problem_id,
                    "name": r.problem_name,
                    "function": r.function_name,
                    "total": r.total_tests,
                    "passed": r.passed_tests,
                    "failed": r.failed_tests,
                    "tests": [asdict(t) for t in r.test_results]
                }
                for r in self.results
            ]
        }
        
        with open(report_file, 'w') as f:
            json.dump(report_data, f, indent=2, default=str)
        
        print(f"📄 Report saved to: {report_file}\n")


if __name__ == "__main__":
    validator = DSAValidator()
    try:
        validator.run_all_validations()
        sys.exit(0 if sum(r.failed_tests for r in validator.results) == 0 else 1)
    except Exception as e:
        print(f"❌ Validation error: {str(e)}", file=sys.stderr)
        sys.exit(1)
