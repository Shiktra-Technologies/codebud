"""
Reference solutions for deterministic cross-match judging.
"""

from typing import Optional


class ReferenceSolutionStore:
    """In-memory reference solution registry by problem and language."""

    def __init__(self):
        self._solutions = {
            "python": {
                "1": """def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        need = target - n
        if need in seen:
            return [seen[need], i]
        seen[n] = i
    return []
""",
                "2": """def is_valid(s):
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    for ch in s:
        if ch in pairs.values():
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()
    return len(stack) == 0
""",
                "3": """def reverse_list(head):
    return list(reversed(head))
""",
                "4": """def search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
""",
                "5": """def max_subarray(nums):
    best = nums[0]
    current = nums[0]
    for n in nums[1:]:
        current = max(n, current + n)
        best = max(best, current)
    return best
""",
            }
        }

    def get_solution(self, problem_id: str, language: str) -> Optional[str]:
        lang = (language or "").lower()
        return self._solutions.get(lang, {}).get(str(problem_id))
