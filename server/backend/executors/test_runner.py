"""
Deterministic Test Runner for DSA Problems
Ensures consistent test results across multiple runs
"""

import hashlib
import json
import logging
import time
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class TestRun:
    """Record of a test run for consistency tracking"""
    code_hash: str
    test_case_hashes: List[str] = field(default_factory=list)
    results: List[bool] = field(default_factory=list)
    timestamp: float = field(default_factory=time.time)
    
    def to_dict(self) -> Dict:
        return {
            'code_hash': self.code_hash,
            'test_case_hashes': self.test_case_hashes,
            'results': self.results,
            'timestamp': self.timestamp
        }


class DeterministicTestRunner:
    """
    Ensures test results are consistent and deterministic.
    Detects flaky tests and provides confidence scoring.
    """
    
    def __init__(self, max_runs_to_track: int = 10):
        self.max_runs_to_track = max_runs_to_track
        self.run_history: Dict[str, List[TestRun]] = {}
    
    @staticmethod
    def hash_code(code: str) -> str:
        """Generate deterministic hash of code"""
        return hashlib.sha256(code.strip().encode()).hexdigest()
    
    @staticmethod
    def hash_test_case(test_case: Dict[str, Any]) -> str:
        """Generate deterministic hash of test case"""
        # Create canonical representation
        canonical = json.dumps({
            'input': str(test_case.get('input')),
            'expected': str(test_case.get('expected'))
        }, sort_keys=True)
        return hashlib.sha256(canonical.encode()).hexdigest()
    
    def record_test_run(self, code: str, test_cases: List[Dict[str, Any]], 
                       results: List[bool]) -> str:
        """
        Record a test run for consistency tracking
        
        Returns:
            Unique run ID
        """
        code_hash = self.hash_code(code)
        test_hashes = [self.hash_test_case(tc) for tc in test_cases]
        
        run = TestRun(
            code_hash=code_hash,
            test_case_hashes=test_hashes,
            results=results
        )
        
        run_id = f"{code_hash}_{int(run.timestamp * 1000)}"
        
        if code_hash not in self.run_history:
            self.run_history[code_hash] = []
        
        self.run_history[code_hash].append(run)
        
        # Keep only recent runs
        if len(self.run_history[code_hash]) > self.max_runs_to_track:
            self.run_history[code_hash] = self.run_history[code_hash][-self.max_runs_to_track:]
        
        return run_id
    
    def check_consistency(self, code: str, test_cases: List[Dict[str, Any]], 
                         current_results: List[bool]) -> Dict[str, Any]:
        """
        Check if current test results are consistent with previous runs
        
        Returns:
            Consistency report with confidence score
        """
        code_hash = self.hash_code(code)
        
        if code_hash not in self.run_history or not self.run_history[code_hash]:
            return {
                'is_consistent': True,
                'confidence': 0.5,
                'note': 'First run - no history to compare',
                'previous_runs': 0,
                'is_flaky': False
            }
        
        previous_runs = self.run_history[code_hash]
        test_hashes = [self.hash_test_case(tc) for tc in test_cases]
        
        # Check if test cases are the same
        matching_runs = [
            run for run in previous_runs 
            if run.test_case_hashes == test_hashes
        ]
        
        if not matching_runs:
            return {
                'is_consistent': True,
                'confidence': 0.7,
                'note': 'Test cases changed - cannot compare',
                'previous_runs': len(previous_runs),
                'is_flaky': False
            }
        
        # Compare results
        all_match = all(run.results == current_results for run in matching_runs)
        
        if all_match:
            confidence = min(0.95, 0.7 + (len(matching_runs) * 0.05))
            return {
                'is_consistent': True,
                'confidence': confidence,
                'note': f'Consistent with {len(matching_runs)} previous runs',
                'previous_runs': len(matching_runs),
                'is_flaky': False
            }
        else:
            # Results are inconsistent - potentially flaky
            pass_count = sum(1 for run in matching_runs if run.results == current_results)
            total = len(matching_runs)
            
            return {
                'is_consistent': False,
                'confidence': pass_count / total,
                'note': f'FLAKY TEST DETECTED: Passed {pass_count}/{total} previous runs. Recommend running AI validation.',
                'previous_runs': total,
                'is_flaky': True,
                'mismatch_rate': 1 - (pass_count / total)
            }
    
    def get_test_report(self, code: str) -> Dict[str, Any]:
        """Get report for all test runs of this code"""
        code_hash = self.hash_code(code)
        
        if code_hash not in self.run_history:
            return {
                'code_hash': code_hash,
                'total_runs': 0,
                'consistency_rate': None,
                'is_stable': None
            }
        
        runs = self.run_history[code_hash]
        
        if not runs:
            return {
                'code_hash': code_hash,
                'total_runs': 0,
                'consistency_rate': None,
                'is_stable': None
            }
        
        # Check consistency between runs
        if len(runs) == 1:
            consistency_rate = 1.0
            is_stable = None  # Not enough data
        else:
            # Compare each run with the first
            first_results = runs[0].results
            matching = sum(1 for run in runs if run.results == first_results)
            consistency_rate = matching / len(runs)
            is_stable = consistency_rate >= 0.95
        
        return {
            'code_hash': code_hash,
            'total_runs': len(runs),
            'consistency_rate': consistency_rate,
            'is_stable': is_stable,
            'runs': [run.to_dict() for run in runs[-5:]],  # Last 5 runs
            'timestamp_latest': runs[-1].timestamp if runs else None
        }


class TestValidator:
    """
    Additional test validation using semantic analysis
    """
    
    @staticmethod
    def analyze_test_patterns(test_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze test cases for coverage and patterns"""
        
        if not test_cases:
            return {'total_cases': 0, 'coverage': 'unknown'}
        
        analysis = {
            'total_cases': len(test_cases),
            'has_null_cases': False,
            'has_edge_cases': False,
            'has_large_input': False,
            'has_empty_input': False,
            'input_types': set(),
            'expected_types': set(),
            'patterns': []
        }
        
        for tc in test_cases:
            inp = tc.get('input')
            exp = tc.get('expected')
            
            # Check input patterns
            if inp is None:
                analysis['has_null_cases'] = True
            
            if isinstance(inp, (list, str, dict)) and len(str(inp)) < 5:
                analysis['has_edge_cases'] = True
            
            if isinstance(inp, (list, str)) and len(inp) == 0:
                analysis['has_empty_input'] = True
            
            if isinstance(inp, (list, str)) and len(inp) > 100:
                analysis['has_large_input'] = True
            
            # Track types
            analysis['input_types'].add(type(inp).__name__)
            if exp is not None:
                analysis['expected_types'].add(type(exp).__name__)
        
        # Convert sets to lists for JSON serialization
        analysis['input_types'] = list(analysis['input_types'])
        analysis['expected_types'] = list(analysis['expected_types'])
        
        return analysis
    
    @staticmethod
    def get_coverage_report(test_cases: List[Dict[str, Any]]) -> str:
        """Generate human-readable coverage report"""
        analysis = TestValidator.analyze_test_patterns(test_cases)
        
        report = f"""Test Coverage Analysis:
- Total Cases: {analysis['total_cases']}
- Null/None Cases: {'Yes' if analysis['has_null_cases'] else 'No'}
- Edge Cases: {'Yes' if analysis['has_edge_cases'] else 'No'}
- Empty Input Cases: {'Yes' if analysis['has_empty_input'] else 'No'}
- Large Input Cases: {'Yes' if analysis['has_large_input'] else 'No'}
- Input Types: {', '.join(analysis['input_types'])}
- Output Types: {', '.join(analysis['expected_types'])}
"""
        return report
