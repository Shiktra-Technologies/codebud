"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import { motion } from "motion/react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProctor } from "@/lib/context/ProctorContext";
import type { Violation } from "@/lib/context/ProctorContext";
import ViolationModal from "@/app/components/proctoring/ViolationModal";
import ViolationWarningPopup from "@/app/components/proctoring/ViolationWarningPopup";
import { submitTest } from "@/lib/services/submissionService";
import submissionForwardingService from "@/lib/services/submissionForwardingService";
import dsaService from "@/lib/services/dsaService";
import {
    Play,
    Send,
    ChevronLeft,
    Code2,
    FileText,
    FlaskConical,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    ShieldAlert,
    Monitor,
    ChevronDown,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

// ─── Problem Data with Starter Code & Test Cases ─────────────────────────────

type Language = "javascript" | "python" | "java" | "cpp";

interface TestCase {
    input: string;
    expectedOutput: string;
}

interface Example {
    input: string;
    output: string;
    explanation: string;
}

interface ProblemData {
    id: string;
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    category: string;
    description: string;
    examples: Example[];
    constraints: string[];
    starterCode: Record<Language, string>;
    testCases: TestCase[];
}

const problemsData: Record<string, ProblemData> = {
    "two-sum": {
        id: "two-sum",
        title: "Two Sum",
        difficulty: "Easy",
        category: "Array",
        description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.`,
        examples: [
            { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
            { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]." },
        ],
        constraints: ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i] ≤ 10⁹", "-10⁹ ≤ target ≤ 10⁹", "Only one valid answer exists."],
        starterCode: {
            javascript: `function twoSum(nums, target) {\n    // Write your solution here\n    \n}`,
            python: `def two_sum(nums, target):\n    # Write your solution here\n    pass`,
            java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        \n    }\n}`,
            cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        \n    }\n};`,
        },
        testCases: [
            { input: "[2,7,11,15], 9", expectedOutput: "[0,1]" },
            { input: "[3,2,4], 6", expectedOutput: "[1,2]" },
            { input: "[3,3], 6", expectedOutput: "[0,1]" },
        ],
    },
    "reverse-linked-list": {
        id: "reverse-linked-list",
        title: "Reverse Linked List",
        difficulty: "Easy",
        category: "Linked List",
        description: `Given the head of a singly linked list, reverse the list, and return the reversed list.`,
        examples: [
            { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]", explanation: "The linked list is reversed." },
        ],
        constraints: ["The number of nodes in the list is the range [0, 5000].", "-5000 ≤ Node.val ≤ 5000"],
        starterCode: {
            javascript: `function reverseList(head) {\n    // Write your solution here\n    \n}`,
            python: `def reverse_list(head):\n    # Write your solution here\n    pass`,
            java: `class Solution {\n    public ListNode reverseList(ListNode head) {\n        // Write your solution here\n        \n    }\n}`,
            cpp: `class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        // Write your solution here\n        \n    }\n};`,
        },
        testCases: [
            { input: "[1,2,3,4,5]", expectedOutput: "[5,4,3,2,1]" },
            { input: "[1,2]", expectedOutput: "[2,1]" },
            { input: "[]", expectedOutput: "[]" },
        ],
    },
    "binary-search": {
        id: "binary-search",
        title: "Binary Search",
        difficulty: "Easy",
        category: "Array",
        description: `Given a sorted array of integers nums and a target value, return the index of target if found. If not found, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.`,
        examples: [
            { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4", explanation: "9 exists in nums and its index is 4." },
            { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1", explanation: "2 does not exist in nums so return -1." },
        ],
        constraints: ["1 ≤ nums.length ≤ 10⁴", "-10⁴ < nums[i], target < 10⁴", "All integers in nums are unique.", "nums is sorted in ascending order."],
        starterCode: {
            javascript: `function search(nums, target) {\n    // Write your solution here\n    \n}`,
            python: `def search(nums, target):\n    # Write your solution here\n    pass`,
            java: `class Solution {\n    public int search(int[] nums, int target) {\n        // Write your solution here\n        \n    }\n}`,
            cpp: `class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Write your solution here\n        \n    }\n};`,
        },
        testCases: [
            { input: "[-1,0,3,5,9,12], 9", expectedOutput: "4" },
            { input: "[-1,0,3,5,9,12], 2", expectedOutput: "-1" },
        ],
    },
    "valid-parentheses": {
        id: "valid-parentheses",
        title: "Valid Parentheses",
        difficulty: "Easy",
        category: "Stack",
        description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n- Open brackets must be closed by the same type of brackets.\n- Open brackets must be closed in the correct order.\n- Every close bracket has a corresponding open bracket of the same type.`,
        examples: [
            { input: 's = "()"', output: "true", explanation: "The string contains valid parentheses pairs." },
            { input: 's = "()[]{}"', output: "true", explanation: "All brackets are properly matched." },
            { input: 's = "(]"', output: "false", explanation: "The brackets are not properly matched." },
        ],
        constraints: ["1 ≤ s.length ≤ 10⁴", "s consists of parentheses only '()[]{}'."],
        starterCode: {
            javascript: `function isValid(s) {\n    // Write your solution here\n    \n}`,
            python: `def is_valid(s):\n    # Write your solution here\n    pass`,
            java: `class Solution {\n    public boolean isValid(String s) {\n        // Write your solution here\n        \n    }\n}`,
            cpp: `class Solution {\npublic:\n    bool isValid(string s) {\n        // Write your solution here\n        \n    }\n};`,
        },
        testCases: [
            { input: '"()"', expectedOutput: "true" },
            { input: '"()[]{}"', expectedOutput: "true" },
            { input: '"(]"', expectedOutput: "false" },
            { input: '"([)]"', expectedOutput: "false" },
        ],
    },
    "merge-sorted-arrays": {
        id: "merge-sorted-arrays",
        title: "Merge Two Sorted Arrays",
        difficulty: "Easy",
        category: "Array",
        description: `You are given two integer arrays nums1 and nums2, sorted in non-decreasing order. Merge nums2 into nums1 as one sorted array.\n\nReturn the merged sorted array.`,
        examples: [
            { input: "nums1 = [1,2,3], nums2 = [2,5,6]", output: "[1,2,2,3,5,6]", explanation: "The arrays are merged and sorted." },
        ],
        constraints: ["nums1.length == m", "nums2.length == n", "0 ≤ m, n ≤ 200", "-10⁹ ≤ nums1[i], nums2[j] ≤ 10⁹"],
        starterCode: {
            javascript: `function merge(nums1, nums2) {\n    // Write your solution here\n    \n}`,
            python: `def merge(nums1, nums2):\n    # Write your solution here\n    pass`,
            java: `class Solution {\n    public int[] merge(int[] nums1, int[] nums2) {\n        // Write your solution here\n        \n    }\n}`,
            cpp: `class Solution {\npublic:\n    vector<int> merge(vector<int>& nums1, vector<int>& nums2) {\n        // Write your solution here\n        \n    }\n};`,
        },
        testCases: [
            { input: "[1,2,3], [2,5,6]", expectedOutput: "[1,2,2,3,5,6]" },
            { input: "[1], []", expectedOutput: "[1]" },
        ],
    },
    "max-subarray": {
        id: "max-subarray",
        title: "Maximum Subarray",
        difficulty: "Medium",
        category: "Dynamic Programming",
        description: `Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.\n\nA subarray is a contiguous part of an array.`,
        examples: [
            { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "[4,-1,2,1] has the largest sum = 6." },
            { input: "nums = [1]", output: "1", explanation: "The array has only one element." },
        ],
        constraints: ["1 ≤ nums.length ≤ 10⁵", "-10⁴ ≤ nums[i] ≤ 10⁴"],
        starterCode: {
            javascript: `function maxSubArray(nums) {\n    // Write your solution here\n    \n}`,
            python: `def max_subarray(nums):\n    # Write your solution here\n    pass`,
            java: `class Solution {\n    public int maxSubArray(int[] nums) {\n        // Write your solution here\n        \n    }\n}`,
            cpp: `class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Write your solution here\n        \n    }\n};`,
        },
        testCases: [
            { input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6" },
            { input: "[1]", expectedOutput: "1" },
            { input: "[5,4,-1,7,8]", expectedOutput: "23" },
        ],
    },
    "longest-substring": {
        id: "longest-substring",
        title: "Longest Substring Without Repeating Characters",
        difficulty: "Medium",
        category: "String",
        description: `Given a string s, find the length of the longest substring without repeating characters.`,
        examples: [
            { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", with the length of 3.' },
            { input: 's = "bbbbb"', output: "1", explanation: 'The answer is "b", with the length of 1.' },
        ],
        constraints: ["0 ≤ s.length ≤ 5 × 10⁴", "s consists of English letters, digits, symbols and spaces."],
        starterCode: {
            javascript: `function lengthOfLongestSubstring(s) {\n    // Write your solution here\n    \n}`,
            python: `def length_of_longest_substring(s):\n    # Write your solution here\n    pass`,
            java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your solution here\n        \n    }\n}`,
            cpp: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Write your solution here\n        \n    }\n};`,
        },
        testCases: [
            { input: '"abcabcbb"', expectedOutput: "3" },
            { input: '"bbbbb"', expectedOutput: "1" },
            { input: '"pwwkew"', expectedOutput: "3" },
        ],
    },
    "three-sum": {
        id: "three-sum",
        title: "3Sum",
        difficulty: "Medium",
        category: "Array",
        description: `Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i ≠ j, i ≠ k, and j ≠ k, and nums[i] + nums[j] + nums[k] == 0.\n\nNotice that the solution set must not contain duplicate triplets.`,
        examples: [
            { input: "nums = [-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]", explanation: "The distinct triplets that sum to 0." },
        ],
        constraints: ["3 ≤ nums.length ≤ 3000", "-10⁵ ≤ nums[i] ≤ 10⁵"],
        starterCode: {
            javascript: `function threeSum(nums) {\n    // Write your solution here\n    \n}`,
            python: `def three_sum(nums):\n    # Write your solution here\n    pass`,
            java: `class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        // Write your solution here\n        \n    }\n}`,
            cpp: `class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        // Write your solution here\n        \n    }\n};`,
        },
        testCases: [
            { input: "[-1,0,1,2,-1,-4]", expectedOutput: "[[-1,-1,2],[-1,0,1]]" },
            { input: "[0,1,1]", expectedOutput: "[]" },
            { input: "[0,0,0]", expectedOutput: "[[0,0,0]]" },
        ],
    },
    "lru-cache": {
        id: "lru-cache",
        title: "LRU Cache",
        difficulty: "Medium",
        category: "Design",
        description: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the LRUCache class:\n- LRUCache(int capacity) Initialize the LRU cache with positive size capacity.\n- int get(int key) Return the value of the key if the key exists, otherwise return -1.\n- void put(int key, int value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.`,
        examples: [
            { input: 'LRUCache(2), put(1,1), put(2,2), get(1), put(3,3), get(2)', output: "1, -1", explanation: "After put(3,3), key 2 is evicted as it was least recently used." },
        ],
        constraints: ["1 ≤ capacity ≤ 3000", "0 ≤ key ≤ 10⁴", "0 ≤ value ≤ 10⁵", "At most 2 × 10⁵ calls will be made to get and put."],
        starterCode: {
            javascript: `class LRUCache {\n    constructor(capacity) {\n        // Initialize your data structure here\n    }\n\n    get(key) {\n        // Return the value or -1\n    }\n\n    put(key, value) {\n        // Insert or update the key-value pair\n    }\n}`,
            python: `class LRUCache:\n    def __init__(self, capacity: int):\n        # Initialize your data structure here\n        pass\n\n    def get(self, key: int) -> int:\n        # Return the value or -1\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        # Insert or update the key-value pair\n        pass`,
            java: `class LRUCache {\n    public LRUCache(int capacity) {\n        // Initialize your data structure here\n    }\n\n    public int get(int key) {\n        // Return the value or -1\n    }\n\n    public void put(int key, int value) {\n        // Insert or update the key-value pair\n    }\n}`,
            cpp: `class LRUCache {\npublic:\n    LRUCache(int capacity) {\n        // Initialize your data structure here\n    }\n\n    int get(int key) {\n        // Return the value or -1\n    }\n\n    void put(int key, int value) {\n        // Insert or update the key-value pair\n    }\n};`,
        },
        testCases: [
            { input: "LRUCache(2), put(1,1), put(2,2), get(1)", expectedOutput: "1" },
            { input: "LRUCache(2), put(1,1), put(2,2), put(3,3), get(2)", expectedOutput: "-1" },
        ],
    },
    "coin-change": {
        id: "coin-change",
        title: "Coin Change",
        difficulty: "Medium",
        category: "Dynamic Programming",
        description: `You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.`,
        examples: [
            { input: "coins = [1,5,10], amount = 12", output: "3", explanation: "12 = 10 + 1 + 1" },
            { input: "coins = [2], amount = 3", output: "-1", explanation: "Amount 3 cannot be made with only coin 2." },
        ],
        constraints: ["1 ≤ coins.length ≤ 12", "1 ≤ coins[i] ≤ 2³¹ - 1", "0 ≤ amount ≤ 10⁴"],
        starterCode: {
            javascript: `function coinChange(coins, amount) {\n    // Write your solution here\n    \n}`,
            python: `def coin_change(coins, amount):\n    # Write your solution here\n    pass`,
            java: `class Solution {\n    public int coinChange(int[] coins, int amount) {\n        // Write your solution here\n        \n    }\n}`,
            cpp: `class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        // Write your solution here\n        \n    }\n};`,
        },
        testCases: [
            { input: "[1,5,10], 12", expectedOutput: "3" },
            { input: "[2], 3", expectedOutput: "-1" },
            { input: "[1], 0", expectedOutput: "0" },
        ],
    },
    "word-search": {
        id: "word-search",
        title: "Word Search",
        difficulty: "Medium",
        category: "Backtracking",
        description: `Given an m × n grid of characters board and a string word, return true if word exists in the grid.\n\nThe word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once.`,
        examples: [
            { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"', output: "true", explanation: "The word can be found by following adjacent cells." },
        ],
        constraints: ["m == board.length", "n == board[i].length", "1 ≤ m, n ≤ 6", "1 ≤ word.length ≤ 15"],
        starterCode: {
            javascript: `function exist(board, word) {\n    // Write your solution here\n    \n}`,
            python: `def exist(board, word):\n    # Write your solution here\n    pass`,
            java: `class Solution {\n    public boolean exist(char[][] board, String word) {\n        // Write your solution here\n        \n    }\n}`,
            cpp: `class Solution {\npublic:\n    bool exist(vector<vector<char>>& board, string word) {\n        // Write your solution here\n        \n    }\n};`,
        },
        testCases: [
            { input: '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "ABCCED"', expectedOutput: "true" },
            { input: '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "SEE"', expectedOutput: "true" },
            { input: '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "ABCB"', expectedOutput: "false" },
        ],
    },
    "merge-intervals": {
        id: "merge-intervals",
        title: "Merge Intervals",
        difficulty: "Medium",
        category: "Array",
        description: `Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
        examples: [
            { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]", explanation: "Intervals [1,3] and [2,6] overlap, so merge them into [1,6]." },
        ],
        constraints: ["1 ≤ intervals.length ≤ 10⁴", "intervals[i].length == 2", "0 ≤ starti ≤ endi ≤ 10⁴"],
        starterCode: {
            javascript: `function merge(intervals) {\n    // Write your solution here\n    \n}`,
            python: `def merge(intervals):\n    # Write your solution here\n    pass`,
            java: `class Solution {\n    public int[][] merge(int[][] intervals) {\n        // Write your solution here\n        \n    }\n}`,
            cpp: `class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        // Write your solution here\n        \n    }\n};`,
        },
        testCases: [
            { input: "[[1,3],[2,6],[8,10],[15,18]]", expectedOutput: "[[1,6],[8,10],[15,18]]" },
            { input: "[[1,4],[4,5]]", expectedOutput: "[[1,5]]" },
        ],
    },
    "trapping-rain-water": {
        id: "trapping-rain-water",
        title: "Trapping Rain Water",
        difficulty: "Hard",
        category: "Array",
        description: `Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.`,
        examples: [
            { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6", explanation: "6 units of rain water are trapped." },
        ],
        constraints: ["n == height.length", "1 ≤ n ≤ 2 × 10⁴", "0 ≤ height[i] ≤ 10⁵"],
        starterCode: {
            javascript: `function trap(height) {\n    // Write your solution here\n    \n}`,
            python: `def trap(height):\n    # Write your solution here\n    pass`,
            java: `class Solution {\n    public int trap(int[] height) {\n        // Write your solution here\n        \n    }\n}`,
            cpp: `class Solution {\npublic:\n    int trap(vector<int>& height) {\n        // Write your solution here\n        \n    }\n};`,
        },
        testCases: [
            { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", expectedOutput: "6" },
            { input: "[4,2,0,3,2,5]", expectedOutput: "9" },
        ],
    },
    "median-two-arrays": {
        id: "median-two-arrays",
        title: "Median of Two Sorted Arrays",
        difficulty: "Hard",
        category: "Array",
        description: `Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be O(log(m+n)).`,
        examples: [
            { input: "nums1 = [1,3], nums2 = [2]", output: "2.0", explanation: "Merged array = [1,2,3] and median is 2." },
            { input: "nums1 = [1,2], nums2 = [3,4]", output: "2.5", explanation: "Merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5." },
        ],
        constraints: ["nums1.length == m", "nums2.length == n", "0 ≤ m ≤ 1000", "0 ≤ n ≤ 1000", "1 ≤ m + n ≤ 2000"],
        starterCode: {
            javascript: `function findMedianSortedArrays(nums1, nums2) {\n    // Write your solution here\n    \n}`,
            python: `def find_median_sorted_arrays(nums1, nums2):\n    # Write your solution here\n    pass`,
            java: `class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        // Write your solution here\n        \n    }\n}`,
            cpp: `class Solution {\npublic:\n    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n        // Write your solution here\n        \n    }\n};`,
        },
        testCases: [
            { input: "[1,3], [2]", expectedOutput: "2.0" },
            { input: "[1,2], [3,4]", expectedOutput: "2.5" },
        ],
    },
    "serialize-tree": {
        id: "serialize-tree",
        title: "Serialize and Deserialize Binary Tree",
        difficulty: "Hard",
        category: "Tree",
        description: `Design an algorithm to serialize and deserialize a binary tree. Serialization is converting the tree to a string, and deserialization is constructing the tree from a string.\n\nThere is no restriction on how your serialization/deserialization algorithm should work.`,
        examples: [
            { input: "root = [1,2,3,null,null,4,5]", output: "[1,2,3,null,null,4,5]", explanation: "The tree is encoded and decoded back to its original structure." },
        ],
        constraints: ["The number of nodes in the tree is in the range [0, 10⁴].", "-1000 ≤ Node.val ≤ 1000"],
        starterCode: {
            javascript: `class Codec {\n    serialize(root) {\n        // Encodes a tree to a single string\n    }\n\n    deserialize(data) {\n        // Decodes your encoded data to tree\n    }\n}`,
            python: `class Codec:\n    def serialize(self, root):\n        \"\"\"Encodes a tree to a single string.\"\"\"\n        pass\n\n    def deserialize(self, data):\n        \"\"\"Decodes your encoded data to tree.\"\"\"\n        pass`,
            java: `public class Codec {\n    public String serialize(TreeNode root) {\n        // Encodes a tree to a single string\n    }\n\n    public TreeNode deserialize(String data) {\n        // Decodes your encoded data to tree\n    }\n}`,
            cpp: `class Codec {\npublic:\n    string serialize(TreeNode* root) {\n        // Encodes a tree to a single string\n    }\n\n    TreeNode* deserialize(string data) {\n        // Decodes your encoded data to tree\n    }\n};`,
        },
        testCases: [
            { input: "[1,2,3,null,null,4,5]", expectedOutput: "[1,2,3,null,null,4,5]" },
            { input: "[]", expectedOutput: "[]" },
        ],
    },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const languageLabels: Record<Language, string> = {
    javascript: "JavaScript",
    python: "Python",
    java: "Java",
    cpp: "C++",
};

const monacoLangMap: Record<Language, string> = {
    javascript: "javascript",
    python: "python",
    java: "java",
    cpp: "cpp",
};

const diffColors: Record<string, { bg: string; text: string; border: string }> = {
    Easy: { bg: "bg-emerald-400/10", text: "text-emerald-400", border: "border-emerald-400/20" },
    Medium: { bg: "bg-yellow-400/10", text: "text-yellow-400", border: "border-yellow-400/20" },
    Hard: { bg: "bg-red-400/10", text: "text-red-400", border: "border-red-400/20" },
};

interface TestResult {
    id: number;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    runtime: string;
}

// ─── ProblemSolver Component ─────────────────────────────────────────────────

export default function ProblemSolverPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const {
        proctorState,
        mediaStream,
        startMonitoring,
        pauseMonitoring,
        completeTestCleanup,
    } = useProctor();

    const problemId = params.id as string;
    const problem = problemsData[problemId];

    // ── State ────────────────────────────────────────────────────────────────
    const [selectedLanguage, setSelectedLanguage] = useState<Language>("javascript");
    const [code, setCode] = useState("");
    const [output, setOutput] = useState("");
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<"description" | "testcases">("description");
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [startTime] = useState(() => new Date());

    // Violation state
    const [showViolationModal, setShowViolationModal] = useState(false);
    const [unacknowledgedViolations, setUnacknowledgedViolations] = useState<Violation[]>([]);
    const [currentWarningViolation, setCurrentWarningViolation] = useState<Violation | null>(null);
    const [showWarningCount, setShowWarningCount] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);

    // ── Initialise code when problem or language changes ─────────────────────
    useEffect(() => {
        if (problem) {
            setCode(problem.starterCode[selectedLanguage]);
        }
    }, [problem, selectedLanguage]);

    // ── Proctoring lifecycle ─────────────────────────────────────────────────
    useEffect(() => {
        startMonitoring();
        return () => { pauseMonitoring(); };
    }, [startMonitoring, pauseMonitoring]);

    // Video ref
    useEffect(() => {
        if (videoRef.current && mediaStream) {
            videoRef.current.srcObject = mediaStream;
        }
    }, [mediaStream]);

    // Auto-submit on violation threshold
    useEffect(() => {
        if (proctorState.testSubmitted && !isSubmitting) {
            setTimeout(() => completeTestCleanup(), 500);
            router.push("/submitted");
        }
    }, [proctorState.testSubmitted, router, isSubmitting, completeTestCleanup]);

    // Monitor new violations
    useEffect(() => {
        const newViolations = proctorState.violations.filter(
            (v) => !unacknowledgedViolations.find((uv) => uv.id === v.id)
        );
        if (newViolations.length > 0) {
            const latest = newViolations[newViolations.length - 1];
            setCurrentWarningViolation(latest);
            setShowWarningCount((p) => p + 1);
            setUnacknowledgedViolations((prev) => [...prev, ...newViolations]);
            if (newViolations.some((v) => v.type === "CRITICAL")) {
                setShowViolationModal(true);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [proctorState.violations]);

    // Disable text selection during test
    useEffect(() => {
        document.body.style.userSelect = "none";
        return () => { document.body.style.userSelect = ""; };
    }, []);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleViolationAcknowledge = useCallback(() => setShowViolationModal(false), []);
    const handleViolationSubmit = useCallback(() => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setTimeout(() => completeTestCleanup(), 500);
        setShowViolationModal(false);
        router.push("/submitted");
    }, [isSubmitting, completeTestCleanup, router]);
    const handleWarningClose = useCallback(() => setCurrentWarningViolation(null), []);

    const runCode = useCallback(async () => {
        if (!problem) return;
        setIsRunning(true);
        setOutput("");
        setTestResults([]);
        setActiveTab("testcases");

        try {
            const result: any = await dsaService.executeCode(problemId, code, selectedLanguage);

            if (result.results && result.results.length > 0) {
                const results: TestResult[] = result.results.map((r: any, idx: number) => ({
                    id: idx + 1,
                    input: r.input || problem.testCases[idx]?.input || "",
                    expectedOutput: r.expected || problem.testCases[idx]?.expectedOutput || "",
                    actualOutput: r.actual ?? "N/A",
                    passed: r.status === "passed",
                    runtime: `${r.execution_time_ms?.toFixed(1) ?? "?"}ms`,
                }));

                setTestResults(results);
                const passedCount = results.filter((r) => r.passed).length;

                if (result.is_accepted) {
                    setOutput(`✅ Accepted — ${passedCount}/${results.length} test cases passed (${result.total_execution_time_ms?.toFixed(1)}ms)`);
                } else if (result.status === "Compilation Error" || result.status === "Runtime Error") {
                    setOutput(`⚠️ ${result.status}: ${result.message}`);
                } else {
                    setOutput(`❌ ${result.status} — ${passedCount}/${results.length} test cases passed`);
                }
            } else {
                // Server returned a message without per-test results (e.g. language not supported)
                setOutput(`⚠️ ${result.message || result.status || "Unknown error"}`);
            }
        } catch (error: any) {
            setOutput(`⚠️ ${error.message}`);
        } finally {
            setIsRunning(false);
        }
    }, [problem, problemId, code, selectedLanguage]);

    const submitSolution = useCallback(async () => {
        if (isSubmitting || !problem) return;
        setIsSubmitting(true);
        setActiveTab("testcases");

        // Execute code on server for real evaluation
        let results: TestResult[] = [];
        let passedCount = 0;

        try {
            const result: any = await dsaService.submitCode(problemId, code, selectedLanguage);
            results = (result.results || []).map((r: any, idx: number) => ({
                id: idx + 1,
                input: r.input || problem.testCases[idx]?.input || "",
                expectedOutput: r.expected || problem.testCases[idx]?.expectedOutput || "",
                actualOutput: r.actual ?? "N/A",
                passed: r.status === "passed",
                runtime: `${r.execution_time_ms?.toFixed(1) ?? "?"}ms`,
            }));
            passedCount = result.passed ?? results.filter((r) => r.passed).length;
        } catch (error: any) {
            console.warn("Code execution failed during submit:", error.message);
        }

        setTestResults(results);
        const percentage = results.length > 0 ? Math.round((passedCount / results.length) * 100) : 0;

        const userId = (user as any)?._id || (user as any)?.id || "anonymous";
        const userEmail = (user as any)?.email || "anonymous@example.com";
        const userName = (user as any)?.name || (user as any)?.displayName || userEmail;

        const endTime = new Date();
        const timeTaken = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

        // Navigate immediately for better UX
        router.push("/submitted");

        // Async operations in background
        try {
            await submitTest(userId, {
                test_type: "DSA Challenge",
                test_title: problem.title,
                score: percentage,
                total_questions: problem.testCases.length,
                correct_answers: passedCount,
                wrong_answers: results.length - passedCount,
                time_spent: timeTaken,
                details: {
                    difficulty: problem.difficulty,
                    category: problem.category,
                    language: selectedLanguage,
                    codeSubmission: code,
                    testResults: results,
                    violationCount: proctorState.violationCount,
                },
            });
        } catch (e) {
            console.warn("Failed to submit DSA result:", e);
        }

        try {
            submissionForwardingService.forwardSubmission({
                userId,
                userEmail,
                displayName: userName,
                testType: "DSA Problem",
                testTitle: problem.title,
                score: percentage,
                totalQuestions: problem.testCases.length,
                correctAnswers: passedCount,
                wrongAnswers: results.length - passedCount,
                timeSpent: timeTaken,
                submissionTime: endTime.toISOString(),
                details: {
                    difficulty: problem.difficulty,
                    category: problem.category,
                    codeSubmission: code,
                    language: selectedLanguage,
                    testResults: results,
                    violationCount: proctorState.violationCount,
                },
            });
        } catch (e) {
            console.warn("Failed to forward submission:", e);
        }

        setTimeout(() => completeTestCleanup(), 200);
    }, [isSubmitting, problem, user, startTime, router, selectedLanguage, code, proctorState.violationCount, completeTestCleanup]);

    // ── 404 ──────────────────────────────────────────────────────────────────
    if (!problem) {
        return (
            <div className="min-h-screen bg-surface-0 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease }}
                    className="text-center"
                >
                    <Code2 size={48} className="mx-auto mb-4 text-white/10" />
                    <h2 className="text-xl font-bold text-white mb-2">Problem Not Found</h2>
                    <p className="text-sm text-white/30 mb-6">
                        The problem &quot;{problemId}&quot; doesn&apos;t exist or has been removed.
                    </p>
                    <button
                        onClick={() => router.push("/problems")}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-400 text-surface-0 text-sm font-bold hover:bg-yellow-300 transition-colors"
                    >
                        <ChevronLeft size={16} /> Back to Problems
                    </button>
                </motion.div>
            </div>
        );
    }

    // ── Permission gate (no camera) ──────────────────────────────────────────
    if (!mediaStream) {
        return (
            <div className="min-h-screen bg-surface-0 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease }}
                    className="bg-surface-2/60 rounded-2xl border border-white/[0.06] p-8 max-w-md mx-auto text-center"
                >
                    <div className="w-14 h-14 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert size={28} className="text-yellow-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2">Setting up Security</h2>
                    <p className="text-sm text-white/30 mb-6">
                        Camera and microphone access is required for proctored testing.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => router.push("/permissions")}
                            className="px-5 py-2.5 rounded-xl bg-yellow-400 text-surface-0 text-sm font-bold hover:bg-yellow-300 transition-colors"
                        >
                            Grant Permissions
                        </button>
                        <button
                            onClick={() => router.push("/problems")}
                            className="px-5 py-2.5 rounded-xl bg-surface-3/50 text-white/50 text-sm font-medium border border-white/[0.06] hover:text-white/70 transition-colors"
                        >
                            Back
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const dc = diffColors[problem.difficulty] || { bg: "", text: "text-white/30", border: "" };

    // ── Main render ──────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-surface-0 flex flex-col">
            {/* ── Violation overlays ──────────────────────────────────────── */}
            {showViolationModal && (
                <ViolationModal
                    violations={unacknowledgedViolations}
                    onAcknowledge={handleViolationAcknowledge}
                    onSubmitTest={handleViolationSubmit}
                />
            )}
            {currentWarningViolation && (
                <ViolationWarningPopup
                    key={showWarningCount}
                    violation={currentWarningViolation}
                    violationCount={proctorState.violationCount}
                    maxViolations={proctorState.maxViolations}
                    onClose={handleWarningClose}
                />
            )}

            {/* ── Header ─────────────────────────────────────────────────── */}
            <motion.header
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease }}
                className="h-14 px-4 flex items-center justify-between border-b border-white/[0.06] bg-surface-1/80 backdrop-blur-xl shrink-0 z-20"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => router.push("/problems")}
                        className="flex items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors text-xs font-medium"
                    >
                        <ChevronLeft size={14} /> Problems
                    </button>
                    <div className="w-px h-5 bg-white/[0.06]" />
                    <h1 className="text-sm font-bold text-white truncate">{problem.title}</h1>
                    <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${dc.bg} ${dc.text} ${dc.border}`}
                    >
                        {problem.difficulty}
                    </span>
                    <span className="text-[10px] text-white/15 bg-surface-3/30 px-1.5 py-0.5 rounded shrink-0">
                        {problem.category}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Camera preview */}
                    <div className="w-10 h-8 rounded-lg overflow-hidden border border-white/[0.08] bg-surface-3/40 relative">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                        <Monitor size={12} className="text-red-400" />
                        <span className="text-red-400 font-semibold">MONITORED</span>
                    </div>
                    <div
                        className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                            proctorState.violationCount >= 3
                                ? "bg-red-400/10 text-red-400 border-red-400/20"
                                : "bg-surface-3/30 text-white/30 border-white/[0.04]"
                        }`}
                    >
                        ⚠ {proctorState.violationCount}/{proctorState.maxViolations}
                    </div>
                </div>
            </motion.header>

            {/* ── Split pane ──────────────────────────────────────────────── */}
            <div className="flex-1 flex overflow-hidden">
                {/* ── Left: Description / Test Cases ─────────────────────── */}
                <div className="w-[42%] min-w-[320px] border-r border-white/[0.06] flex flex-col">
                    {/* Tabs */}
                    <div className="flex border-b border-white/[0.04] shrink-0">
                        {[
                            { id: "description" as const, label: "Description", icon: FileText },
                            { id: "testcases" as const, label: "Test Cases", icon: FlaskConical },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                                    activeTab === tab.id
                                        ? "border-yellow-400 text-yellow-400"
                                        : "border-transparent text-white/25 hover:text-white/40"
                                }`}
                            >
                                <tab.icon size={13} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                        {activeTab === "description" && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease }}
                                className="space-y-5"
                            >
                                {/* Description */}
                                <div className="text-sm text-white/50 leading-relaxed whitespace-pre-line">
                                    {problem.description}
                                </div>

                                {/* Examples */}
                                <div>
                                    <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">
                                        Examples
                                    </h3>
                                    <div className="space-y-3">
                                        {problem.examples.map((ex, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded-xl bg-surface-2/40 border border-white/[0.04] p-4 space-y-1.5"
                                            >
                                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider mb-2">
                                                    Example {idx + 1}
                                                </p>
                                                <p className="text-xs text-white/40">
                                                    <span className="text-white/20 font-semibold">Input:</span>{" "}
                                                    <code className="text-emerald-400/70 font-mono text-[11px]">
                                                        {ex.input}
                                                    </code>
                                                </p>
                                                <p className="text-xs text-white/40">
                                                    <span className="text-white/20 font-semibold">Output:</span>{" "}
                                                    <code className="text-yellow-400/70 font-mono text-[11px]">
                                                        {ex.output}
                                                    </code>
                                                </p>
                                                <p className="text-xs text-white/30">
                                                    <span className="text-white/20 font-semibold">Explanation:</span>{" "}
                                                    {ex.explanation}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Constraints */}
                                <div>
                                    <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">
                                        Constraints
                                    </h3>
                                    <ul className="space-y-1">
                                        {problem.constraints.map((c, idx) => (
                                            <li
                                                key={idx}
                                                className="text-xs text-white/30 flex items-start gap-2"
                                            >
                                                <span className="text-yellow-400/40 mt-0.5">•</span>
                                                <code className="font-mono text-[11px] text-white/25">
                                                    {c}
                                                </code>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "testcases" && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease }}
                            >
                                <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">
                                    Test Cases
                                </h3>

                                {testResults.length > 0 ? (
                                    <div className="space-y-2">
                                        {testResults.map((r) => (
                                            <div
                                                key={r.id}
                                                className={`rounded-xl border p-3.5 ${
                                                    r.passed
                                                        ? "bg-emerald-400/5 border-emerald-400/15"
                                                        : "bg-red-400/5 border-red-400/15"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold text-white/40">
                                                        Case {r.id}
                                                    </span>
                                                    <span
                                                        className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                                                            r.passed
                                                                ? "text-emerald-400"
                                                                : "text-red-400"
                                                        }`}
                                                    >
                                                        {r.passed ? (
                                                            <CheckCircle2 size={12} />
                                                        ) : (
                                                            <XCircle size={12} />
                                                        )}
                                                        {r.passed ? "Passed" : "Failed"}
                                                    </span>
                                                </div>
                                                <div className="space-y-1 text-[11px] font-mono">
                                                    <p className="text-white/25">
                                                        <span className="text-white/15">Input:</span>{" "}
                                                        {r.input}
                                                    </p>
                                                    <p className="text-white/25">
                                                        <span className="text-white/15">Expected:</span>{" "}
                                                        {r.expectedOutput}
                                                    </p>
                                                    <p
                                                        className={
                                                            r.passed
                                                                ? "text-emerald-400/60"
                                                                : "text-red-400/60"
                                                        }
                                                    >
                                                        <span className="text-white/15">Actual:</span>{" "}
                                                        {r.actualOutput}
                                                    </p>
                                                    <p className="text-white/15 flex items-center gap-1">
                                                        <Clock size={10} /> {r.runtime}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FlaskConical
                                            size={28}
                                            className="mx-auto mb-3 text-white/10"
                                        />
                                        <p className="text-xs text-white/20">
                                            Run your code to see test results
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* ── Right: Editor + Output ─────────────────────────────── */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Editor toolbar */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04] bg-surface-1/40 shrink-0">
                        {/* Language selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowLangDropdown(!showLangDropdown)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-xs font-medium text-white/50 hover:text-white/70 transition-colors"
                            >
                                <Code2 size={13} />
                                {languageLabels[selectedLanguage]}
                                <ChevronDown size={12} />
                            </button>
                            {showLangDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-full left-0 mt-1 w-40 rounded-xl bg-surface-3/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl overflow-hidden z-30"
                                >
                                    {(Object.keys(languageLabels) as Language[]).map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => {
                                                setSelectedLanguage(lang);
                                                setShowLangDropdown(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                                                lang === selectedLanguage
                                                    ? "bg-yellow-400/10 text-yellow-400"
                                                    : "text-white/40 hover:bg-white/[0.04] hover:text-white/60"
                                            }`}
                                        >
                                            {languageLabels[lang]}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={runCode}
                                disabled={isRunning}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-xs font-medium text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isRunning ? (
                                    <Loader2 size={13} className="animate-spin" />
                                ) : (
                                    <Play size={13} />
                                )}
                                {isRunning ? "Running…" : "Run Code"}
                            </button>
                            <button
                                onClick={submitSolution}
                                disabled={isSubmitting}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-yellow-400 text-surface-0 text-xs font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(255,193,7,0.15)]"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={13} className="animate-spin" />
                                ) : (
                                    <Send size={13} />
                                )}
                                {isSubmitting ? "Submitting…" : "Submit"}
                            </button>
                        </div>
                    </div>

                    {/* Monaco editor */}
                    <div className="flex-1 min-h-0">
                        <Editor
                            height="100%"
                            language={monacoLangMap[selectedLanguage]}
                            value={code}
                            onChange={(value) => setCode(value || "")}
                            theme="vs-dark"
                            options={{
                                fontSize: 13,
                                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                insertSpaces: true,
                                wordWrap: "on",
                                lineNumbersMinChars: 3,
                                glyphMargin: false,
                                folding: true,
                                renderLineHighlight: "line",
                                cursorBlinking: "smooth",
                                smoothScrolling: true,
                                padding: { top: 12, bottom: 12 },
                                overviewRulerLanes: 0,
                                hideCursorInOverviewRuler: true,
                                overviewRulerBorder: false,
                                scrollbar: {
                                    verticalScrollbarSize: 6,
                                    horizontalScrollbarSize: 6,
                                },
                            }}
                        />
                    </div>

                    {/* Output panel */}
                    {output && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, ease }}
                            className="border-t border-white/[0.06] px-4 py-3 bg-surface-1/40 shrink-0"
                        >
                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider mb-1.5">
                                Output
                            </p>
                            <p className="text-xs font-mono text-emerald-400/70">{output}</p>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
