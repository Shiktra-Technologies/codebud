"""
Problem Database Handler
Manages DSA problem definitions and test cases.
"""

from typing import Dict, List, Optional, Any, Tuple
import json
import logging
import hashlib

logger = logging.getLogger(__name__)


class ProblemDatabase:
    """Manage DSA problem database."""

    LANGUAGE_ALIASES = {
        "c++": "cpp",
        "cc": "cpp",
        "cxx": "cpp",
        "js": "javascript",
        "node": "javascript",
        "ts": "typescript",
    }

    def __init__(self):
        self.problems = self._load_default_problems()

    @classmethod
    def _normalize_language(cls, language: str) -> str:
        lang = str(language or "").strip().lower()
        return cls.LANGUAGE_ALIASES.get(lang, lang)

    @staticmethod
    def _to_camel_case(name: str) -> str:
        parts = [p for p in str(name or "").split("_") if p]
        if not parts:
            return "solve"
        return parts[0] + "".join(p.capitalize() for p in parts[1:])

    @staticmethod
    def _normalize_generic_type(type_name: str) -> str:
        return str(type_name or "").strip().lower().replace(" ", "")

    @classmethod
    def _generic_to_cpp_type(cls, type_name: str) -> str:
        t = cls._normalize_generic_type(type_name)
        mapping = {
            "int": "int",
            "long": "long long",
            "float": "double",
            "double": "double",
            "bool": "bool",
            "boolean": "bool",
            "string": "string",
            "char": "char",
            "int[]": "vector<int>",
            "long[]": "vector<long long>",
            "float[]": "vector<double>",
            "double[]": "vector<double>",
            "bool[]": "vector<bool>",
            "boolean[]": "vector<bool>",
            "string[]": "vector<string>",
            "char[]": "vector<char>",
            "int[][]": "vector<vector<int>>",
            "long[][]": "vector<vector<long long>>",
            "double[][]": "vector<vector<double>>",
            "string[][]": "vector<vector<string>>",
        }
        return mapping.get(t, "int")

    @classmethod
    def _generic_to_java_type(cls, type_name: str) -> str:
        t = cls._normalize_generic_type(type_name)
        mapping = {
            "int": "int",
            "long": "long",
            "float": "double",
            "double": "double",
            "bool": "boolean",
            "boolean": "boolean",
            "string": "String",
            "char": "char",
            "int[]": "int[]",
            "long[]": "long[]",
            "float[]": "double[]",
            "double[]": "double[]",
            "bool[]": "boolean[]",
            "boolean[]": "boolean[]",
            "string[]": "String[]",
            "char[]": "char[]",
            "int[][]": "int[][]",
            "long[][]": "long[][]",
            "double[][]": "double[][]",
            "string[][]": "String[][]",
        }
        return mapping.get(t, "int")

    @classmethod
    def _js_default_from_generic(cls, type_name: str) -> str:
        t = cls._normalize_generic_type(type_name)
        if t in ("bool", "boolean"):
            return "false"
        if t in ("int", "long", "float", "double"):
            return "0"
        if t in ("string", "char"):
            return "''"
        if "[]" in t:
            return "[]"
        return "null"

    def _get_explicit_signature(self, problem: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        sig = problem.get("signature")
        if not isinstance(sig, dict):
            return None
        params = sig.get("params", [])
        if not isinstance(params, list):
            return None
        normalized_params = []
        for idx, p in enumerate(params):
            if not isinstance(p, dict):
                return None
            name = str(p.get("name") or f"arg{idx + 1}").strip() or f"arg{idx + 1}"
            ptype = str(p.get("type") or "int").strip() or "int"
            normalized_params.append({"name": name, "type": ptype})

        return {
            "function_name": str(sig.get("function_name") or problem.get("function_name") or "solve"),
            "return_type": str(sig.get("return_type") or "int"),
            "params": normalized_params,
        }

    @staticmethod
    def _coerce_args(test_input: Any) -> List[Any]:
        if isinstance(test_input, tuple):
            return list(test_input)
        if isinstance(test_input, list):
            return list(test_input)
        if test_input is None:
            return []
        return [test_input]

    @staticmethod
    def _guess_param_names(args: List[Any]) -> List[str]:
        if not args:
            return []
        if len(args) == 1:
            first = args[0]
            if isinstance(first, list):
                return ["nums"]
            if isinstance(first, str):
                return ["s"]
            return ["x"]
        if len(args) == 2 and isinstance(args[0], list) and isinstance(args[1], (int, float)):
            return ["nums", "target"]
        return [f"arg{i + 1}" for i in range(len(args))]

    @staticmethod
    def _cpp_type_of(value: Any) -> str:
        if isinstance(value, bool):
            return "bool"
        if isinstance(value, int):
            return "int"
        if isinstance(value, float):
            return "double"
        if isinstance(value, str):
            return "string"
        if isinstance(value, list):
            if not value:
                return "vector<int>"
            elem_type = ProblemDatabase._cpp_type_of(value[0])
            if elem_type.startswith("vector<"):
                return f"vector<{elem_type}>"
            return f"vector<{elem_type}>"
        return "int"

    @staticmethod
    def _merge_cpp_types(types: List[str]) -> str:
        unique = [t for t in dict.fromkeys(types) if t]
        if not unique:
            return "int"
        if len(unique) == 1:
            return unique[0]
        numeric = {"int", "double", "long long"}
        if all(t in numeric for t in unique):
            return "double" if "double" in unique else "int"
        if any(t.startswith("vector<") for t in unique):
            nested = []
            for t in unique:
                if t.startswith("vector<") and t.endswith(">"):
                    nested.append(t[7:-1])
            if nested:
                return f"vector<{ProblemDatabase._merge_cpp_types(nested)}>"
            return "vector<int>"
        return unique[0]

    @staticmethod
    def _java_type_of(value: Any) -> str:
        if isinstance(value, bool):
            return "boolean"
        if isinstance(value, int):
            return "int"
        if isinstance(value, float):
            return "double"
        if isinstance(value, str):
            return "String"
        if isinstance(value, list):
            if not value:
                return "int[]"
            elem_type = ProblemDatabase._java_type_of(value[0])
            primitive = {"int", "double", "boolean"}
            if elem_type in primitive:
                return f"{elem_type}[]"
            return "List<Object>"
        return "int"

    @staticmethod
    def _merge_java_types(types: List[str]) -> str:
        unique = [t for t in dict.fromkeys(types) if t]
        if not unique:
            return "int"
        if len(unique) == 1:
            return unique[0]
        numeric = {"int", "double", "long"}
        if all(t in numeric for t in unique):
            return "double" if "double" in unique else "int"
        arrays = [t for t in unique if t.endswith("[]")]
        if arrays:
            base = [t[:-2] for t in arrays]
            merged_base = ProblemDatabase._merge_java_types(base)
            return f"{merged_base}[]"
        if any(t.startswith("List<") for t in unique):
            return "List<Object>"
        return unique[0]

    @staticmethod
    def _cpp_default_return(ret_type: str) -> str:
        if ret_type == "bool":
            return "false"
        if ret_type in ("int", "double", "long long"):
            return "0"
        if ret_type == "string":
            return '""'
        if ret_type.startswith("vector<"):
            return "{}"
        return "{}"

    @staticmethod
    def _java_default_return(ret_type: str) -> str:
        if ret_type == "boolean":
            return "false"
        if ret_type in ("int", "double", "long"):
            return "0"
        if ret_type == "String":
            return '""'
        if ret_type.endswith("[]"):
            return f"new {ret_type}{{}}"
        if ret_type.startswith("List<"):
            return "new ArrayList<>()"
        return "null"

    @staticmethod
    def _js_default_return(expected: Any) -> str:
        if isinstance(expected, bool):
            return "false"
        if isinstance(expected, (int, float)):
            return "0"
        if isinstance(expected, str):
            return "''"
        if isinstance(expected, list):
            return "[]"
        if isinstance(expected, dict):
            return "{}"
        return "null"

    def _infer_signature(self, problem: Dict[str, Any]) -> Tuple[str, List[str], List[Any], Any, List[Any]]:
        fn = problem.get("function_name", "solve")
        camel_fn = self._to_camel_case(fn)
        test_cases = problem.get("test_cases", [])
        sample_case = test_cases[0] if test_cases else {}
        sample_args = self._coerce_args(sample_case.get("input"))
        param_names = self._guess_param_names(sample_args)
        expected = sample_case.get("expected")
        expected_samples = [tc.get("expected") for tc in test_cases if isinstance(tc, dict) and "expected" in tc]
        return camel_fn, param_names, sample_args, expected, expected_samples

    def _build_default_template(self, problem: Dict[str, Any], language: str) -> Optional[str]:
        explicit_sig = self._get_explicit_signature(problem)
        if explicit_sig:
            camel_fn = self._to_camel_case(explicit_sig["function_name"])
            param_names = [p["name"] for p in explicit_sig["params"]]
            cpp_params = ", ".join(
                f"{self._generic_to_cpp_type(p['type'])} {p['name']}" for p in explicit_sig["params"]
            )
            java_params = ", ".join(
                f"{self._generic_to_java_type(p['type'])} {p['name']}" for p in explicit_sig["params"]
            )
            js_params = ", ".join(param_names)
            cpp_ret = self._generic_to_cpp_type(explicit_sig["return_type"])
            java_ret = self._generic_to_java_type(explicit_sig["return_type"])
            js_default = self._js_default_from_generic(explicit_sig["return_type"])
        else:
            camel_fn, param_names, sample_args, expected, expected_samples = self._infer_signature(problem)

            cpp_param_types = []
            java_param_types = []
            for idx, _ in enumerate(sample_args):
                arg_values = []
                for tc in problem.get("test_cases", []):
                    tc_args = self._coerce_args(tc.get("input")) if isinstance(tc, dict) else []
                    if idx < len(tc_args):
                        arg_values.append(tc_args[idx])
                cpp_param_types.append(self._merge_cpp_types([self._cpp_type_of(v) for v in arg_values]))
                java_param_types.append(self._merge_java_types([self._java_type_of(v) for v in arg_values]))

            cpp_params = ", ".join(
                f"{t} {name}" for name, t in zip(param_names, cpp_param_types)
            )
            java_params = ", ".join(
                f"{t} {name}" for name, t in zip(param_names, java_param_types)
            )
            js_params = ", ".join(param_names)

            cpp_ret = self._merge_cpp_types([self._cpp_type_of(v) for v in expected_samples or [expected]])
            java_ret = self._merge_java_types([self._java_type_of(v) for v in expected_samples or [expected]])
            js_default = self._js_default_return(expected)

        templates = {
            "cpp": f"""#include <bits/stdc++.h>
using namespace std;

class Solution {{
public:
    {cpp_ret} {camel_fn}({cpp_params}) {{
        // Your solution here
        return {self._cpp_default_return(cpp_ret)};
    }}
}};
""",
            "java": f"""import java.io.*;
import java.util.*;

class Solution {{
    public {java_ret} {camel_fn}({java_params}) {{
        // Your solution here
        return {self._java_default_return(java_ret)};
    }}
}}
""",
            "javascript": f"""var {camel_fn} = function({js_params}) {{
    // Your solution here
    return {js_default};
}};
""",
            "typescript": """function solve(): void {
    // TODO: implement solution
}

solve();
""",
            "kotlin": """fun main() {
    // TODO: implement solution
}
""",
            "swift": """import Foundation

// TODO: implement solution
""",
            "rust": """fn main() {
    // TODO: implement solution
}
""",
            "php": """<?php
// TODO: implement solution
?>
""",
        }
        return templates.get(language)

    def _load_default_problems(self) -> Dict[str, Dict[str, Any]]:
        """Load default problem set aligned with frontend DSA service."""
        return {
            "1": {
                "id": "1",
                "title": "Two Sum",
                "description": (
                    "Given an array of integers nums and an integer target, return indices of the "
                    "two numbers such that they add up to target. You may assume each input has "
                    "exactly one solution and you cannot use the same element twice."
                ),
                "difficulty": "Easy",
                "tags": ["Array", "Hash Table"],
                "function_name": "two_sum",
                "signature": {
                    "function_name": "two_sum",
                    "return_type": "int[]",
                    "params": [
                        {"name": "nums", "type": "int[]"},
                        {"name": "target", "type": "int"},
                    ],
                },
                "language_templates": {
                    "python": """def two_sum(nums, target):
    # Your solution here
    pass
""",
                    "c": """#include <stdio.h>
#include <stdlib.h>

int* two_sum(int* nums, int numsSize, int target, int* returnSize) {
    int* result = (int*)malloc(2 * sizeof(int));
    *returnSize = 2;
    // Your solution here
    return result;
}
""",
                },
                "test_cases": [
                    {"input": ([2, 7, 11, 15], 9), "expected": [0, 1]},
                    {"input": ([3, 2, 4], 6), "expected": [1, 2]},
                    {"input": ([3, 3], 6), "expected": [0, 1]},
                    {"input": ([0, 4, 3, 0], 0), "expected": [0, 3], "hidden": True},
                ],
            },
            "2": {
                "id": "2",
                "title": "Valid Parentheses",
                "description": (
                    "Given a string s containing only '(', ')', '{', '}', '[' and ']', determine "
                    "if the input string is valid."
                ),
                "difficulty": "Easy",
                "tags": ["String", "Stack"],
                "function_name": "is_valid",
                "signature": {
                    "function_name": "is_valid",
                    "return_type": "bool",
                    "params": [
                        {"name": "s", "type": "string"},
                    ],
                },
                "language_templates": {
                    "python": """def is_valid(s):
    # Your solution here
    pass
""",
                    "c": """#include <stdbool.h>
#include <string.h>

bool is_valid(char* s) {
    // Your solution here
    return false;
}
""",
                },
                "test_cases": [
                    {"input": ("()",), "expected": True},
                    {"input": ("()[]{}",), "expected": True},
                    {"input": ("(]",), "expected": False},
                    {"input": ("([)]",), "expected": False, "hidden": True},
                ],
            },
            "3": {
                "id": "3",
                "title": "Reverse Linked List",
                "description": (
                    "Given the head of a singly linked list, reverse the list and return the "
                    "reversed list. In this judge, linked list input is represented as a Python list."
                ),
                "difficulty": "Easy",
                "tags": ["Linked List"],
                "function_name": "reverse_list",
                "signature": {
                    "function_name": "reverse_list",
                    "return_type": "int[]",
                    "params": [
                        {"name": "head", "type": "int[]"},
                    ],
                },
                "language_templates": {
                    "python": """def reverse_list(head):
    # Your solution here
    pass
""",
                    "c": """#include <stdlib.h>

int* reverse_list(int* head, int headSize, int* returnSize) {
    // Your solution here
    *returnSize = headSize;
    return head;
}
""",
                },
                "test_cases": [
                    {"input": ([1, 2, 3, 4, 5],), "expected": [5, 4, 3, 2, 1]},
                    {"input": ([1, 2],), "expected": [2, 1]},
                    {"input": ([],), "expected": []},
                    {"input": ([1],), "expected": [1], "hidden": True},
                ],
            },
            "4": {
                "id": "4",
                "title": "Binary Search",
                "description": (
                    "Given a sorted array nums and a target, return its index if found, else -1. "
                    "Your algorithm should run in O(log n)."
                ),
                "difficulty": "Easy",
                "tags": ["Array", "Binary Search"],
                "function_name": "search",
                "signature": {
                    "function_name": "search",
                    "return_type": "int",
                    "params": [
                        {"name": "nums", "type": "int[]"},
                        {"name": "target", "type": "int"},
                    ],
                },
                "language_templates": {
                    "python": """def search(nums, target):
    # Your solution here
    pass
""",
                    "c": """int search(int* nums, int numsSize, int target) {
    // Your solution here
    return -1;
}
""",
                },
                "test_cases": [
                    {"input": ([-1, 0, 3, 5, 9, 12], 9), "expected": 4},
                    {"input": ([-1, 0, 3, 5, 9, 12], 2), "expected": -1},
                    {"input": ([1], 1), "expected": 0},
                    {"input": ([1, 2, 3, 4, 5], 3), "expected": 2, "hidden": True},
                ],
            },
            "5": {
                "id": "5",
                "title": "Maximum Subarray",
                "description": (
                    "Given an integer array nums, find the contiguous subarray with the largest "
                    "sum and return its sum."
                ),
                "difficulty": "Medium",
                "tags": ["Array", "Dynamic Programming"],
                "function_name": "max_subarray",
                "signature": {
                    "function_name": "max_subarray",
                    "return_type": "int",
                    "params": [
                        {"name": "nums", "type": "int[]"},
                    ],
                },
                "language_templates": {
                    "python": """def max_subarray(nums):
    # Your solution here
    pass
""",
                    "c": """int max_subarray(int* nums, int numsSize) {
    // Your solution here
    return 0;
}
""",
                },
                "test_cases": [
                    {"input": ([-2, 1, -3, 4, -1, 2, 1, -5, 4],), "expected": 6},
                    {"input": ([1],), "expected": 1},
                    {"input": ([5, 4, -1, 7, 8],), "expected": 23},
                    {"input": ([-1, -2, -3, -4],), "expected": -1, "hidden": True},
                ],
            },
        }

    def get_problem(self, problem_id: str) -> Optional[Dict[str, Any]]:
        return self.problems.get(problem_id)

    def get_all_problems(self) -> Dict[str, Dict[str, Any]]:
        return self.problems

    def get_problem_list(self) -> List[Dict[str, Any]]:
        problem_list = []
        for pid, problem in self.problems.items():
            problem_list.append(
                {
                    "id": problem["id"],
                    "title": problem["title"],
                    "difficulty": problem.get("difficulty", "Unknown"),
                    "tags": problem.get("tags", []),
                    "test_count": len(problem.get("test_cases", [])),
                }
            )
        return problem_list

    def add_problem(self, problem: Dict[str, Any]) -> bool:
        try:
            problem_id = str(len(self.problems) + 1)
            problem["id"] = problem_id
            self.problems[problem_id] = problem
            return True
        except Exception as e:
            logger.error(f"Error adding problem: {str(e)}")
            return False

    def get_template(self, problem_id: str, language: str) -> Optional[str]:
        problem = self.get_problem(problem_id)
        if problem:
            normalized_language = self._normalize_language(language)
            existing = problem.get("language_templates", {}).get(normalized_language)
            if existing:
                return existing
            return self._build_default_template(problem, normalized_language)
        return None

    def get_test_cases(self, problem_id: str) -> List[Dict[str, Any]]:
        problem = self.get_problem(problem_id)
        if problem:
            return problem.get("test_cases", [])
        return []

    def get_public_test_cases(self, problem_id: str) -> List[Dict[str, Any]]:
        return [tc for tc in self.get_test_cases(problem_id) if not bool(tc.get("hidden", False))]

    def get_judge_test_cases(self, problem_id: str) -> List[Dict[str, Any]]:
        return self.get_test_cases(problem_id)

    def add_hidden_test_cases(self, problem_id: str, hidden_cases: List[Dict[str, Any]]) -> int:
        problem = self.get_problem(problem_id)
        if not problem:
            return 0

        existing = problem.setdefault("test_cases", [])
        seen = set()
        for tc in existing:
            key = json.dumps({"input": str(tc.get("input")), "expected": str(tc.get("expected"))}, sort_keys=True)
            seen.add(hashlib.sha256(key.encode()).hexdigest())

        added = 0
        for tc in hidden_cases or []:
            if not isinstance(tc, dict):
                continue
            candidate = {"input": tc.get("input"), "expected": tc.get("expected"), "hidden": True}
            key = json.dumps(
                {"input": str(candidate.get("input")), "expected": str(candidate.get("expected"))},
                sort_keys=True,
            )
            digest = hashlib.sha256(key.encode()).hexdigest()
            if digest in seen:
                continue
            existing.append(candidate)
            seen.add(digest)
            added += 1
        return added

    def save_to_file(self, filepath: str) -> bool:
        try:
            with open(filepath, "w") as f:
                json.dump(self.problems, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Error saving problems: {str(e)}")
            return False

    def load_from_file(self, filepath: str) -> bool:
        try:
            with open(filepath, "r") as f:
                self.problems = json.load(f)
            return True
        except Exception as e:
            logger.error(f"Error loading problems: {str(e)}")
            return False
