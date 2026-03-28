"""
Template/signature validation helpers.
"""

import ast
from typing import List, Tuple


class TemplateMatcher:
    """Check whether submission follows required function signature."""

    @staticmethod
    def _name_variants(name: str):
        raw = str(name or "").strip()
        if not raw:
            return []

        parts = [p for p in raw.replace('-', '_').split('_') if p]
        snake = '_'.join(p.lower() for p in parts) if parts else raw.lower()
        camel = ''
        pascal = ''
        if parts:
            camel = parts[0].lower() + ''.join(p.capitalize() for p in parts[1:])
            pascal = ''.join(p.capitalize() for p in parts)
        else:
            camel = raw[0].lower() + raw[1:] if raw else raw
            pascal = raw[0].upper() + raw[1:] if raw else raw

        variants = []
        for candidate in (raw, snake, camel, pascal):
            if candidate and candidate not in variants:
                variants.append(candidate)
        return variants

    @staticmethod
    def has_required_callable(code: str, function_name: str) -> bool:
        is_valid, _ = TemplateMatcher.validate_required_callable(code, function_name)
        return is_valid

    @staticmethod
    def _collect_declared_callables(tree: ast.AST) -> List[str]:
        names: List[str] = []

        for node in getattr(tree, "body", []):
            if isinstance(node, ast.FunctionDef):
                names.append(node.name)
            elif isinstance(node, ast.ClassDef) and node.name == "Solution":
                for member in node.body:
                    if isinstance(member, ast.FunctionDef):
                        names.append(f"Solution.{member.name}")
        return names

    @staticmethod
    def validate_required_callable(code: str, function_name: str) -> Tuple[bool, str]:
        try:
            tree = ast.parse(code)
        except SyntaxError as exc:
            return False, f"Syntax error at line {exc.lineno}, column {exc.offset}: {exc.msg}"

        required_variants = TemplateMatcher._name_variants(function_name)
        if not required_variants:
            return False, "Function name is not configured for this problem."

        # Allow top-level function definition.
        for node in tree.body:
            if isinstance(node, ast.FunctionDef) and node.name in required_variants:
                return True, ""

        # Allow LeetCode-style class Solution method.
        for node in tree.body:
            if isinstance(node, ast.ClassDef) and node.name == "Solution":
                for member in node.body:
                    if isinstance(member, ast.FunctionDef) and member.name in required_variants:
                        return True, ""

        expected = ", ".join(required_variants)
        discovered = TemplateMatcher._collect_declared_callables(tree)
        if discovered:
            return (
                False,
                f'Entry function not found. Expected one of: {expected}. Found: {", ".join(discovered)}.'
            )
        return False, f"Entry function not found. Expected one of: {expected}. No callable definitions were found."
