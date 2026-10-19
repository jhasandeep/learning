import type { TestCase } from '../lib/testing'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Algorithm {
  id: string
  title: string
  topic: string
  difficulty: Difficulty
  fnName: string
  description: string
  /** Correct reference solution. Endless mode injects one bug into it. */
  code: string
  tests: TestCase[]
}

// Each algorithm needs tests that cover edge cases, so that almost any
// injected bug makes at least one of them fail.
export const ALGORITHMS: Algorithm[] = [
  {
    id: 'sum-zero',
    title: 'Sum Zero',
    topic: 'Two pointers',
    difficulty: 'easy',
    fnName: 'sumZero',
    description: 'Given a sorted array of integers, return the first pair whose sum is 0, or undefined if there is none.',
    code: `function sumZero(arr) {
  let left = 0;
  let right = arr.length - 1;
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === 0) return [arr[left], arr[right]];
    if (sum > 0) right--;
    else left++;
  }
  return undefined;
}`,
    tests: [
      { args: [[-4, -3, -2, -1, 0, 1, 2, 5]], expected: [-2, 2] },
      { args: [[-3, -2, -1, 0, 5]], expected: undefined },
      { args: [[-2, 0, 1, 3]], expected: undefined },
      { args: [[-5, 5]], expected: [-5, 5] },
      { args: [[0]], expected: undefined },
      { args: [[]], expected: undefined },
      { args: [[-6, -1, 2, 6, 9]], expected: [-6, 6] },
      { args: [[-9, -1, 0, 1, 3]], expected: [-1, 1] },
    ],
  },
  {
    id: 'valid-anagram',
    title: 'Valid Anagram',
    topic: 'Frequency counter',
    difficulty: 'easy',
    fnName: 'isAnagram',
    description: 'Return true if string b uses exactly the same letters as a, the same number of times.',
    code: `function isAnagram(a, b) {
  if (a.length !== b.length) return false;
  const freq = {};
  for (const ch of a) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  for (const ch of b) {
    if (!freq[ch]) return false;
    freq[ch] -= 1;
  }
  return true;
}`,
    tests: [
      { args: ['anagram', 'nagaram'], expected: true },
      { args: ['rat', 'car'], expected: false },
      { args: ['aaz', 'zza'], expected: false },
      { args: ['', ''], expected: true },
      { args: ['ab', 'a'], expected: false },
      { args: ['listen', 'silent'], expected: true },
      { args: ['aab', 'abb'], expected: false },
    ],
  },
  {
    id: 'count-unique',
    title: 'Count Unique Values',
    topic: 'Two pointers',
    difficulty: 'easy',
    fnName: 'countUnique',
    description: 'Given a sorted array, return how many unique values it contains.',
    code: `function countUnique(arr) {
  if (arr.length === 0) return 0;
  let i = 0;
  for (let j = 1; j < arr.length; j++) {
    if (arr[j] !== arr[i]) {
      i++;
      arr[i] = arr[j];
    }
  }
  return i + 1;
}`,
    tests: [
      { args: [[1, 1, 1, 2, 3, 3, 4, 4, 5, 6]], expected: 6 },
      { args: [[]], expected: 0 },
      { args: [[7]], expected: 1 },
      { args: [[-2, -1, -1, 0, 1]], expected: 4 },
      { args: [[3, 3, 3]], expected: 1 },
      { args: [[1, 2, 3, 4]], expected: 4 },
    ],
  },
  {
    id: 'max-subarray-sum',
    title: 'Max Sum of k Consecutive',
    topic: 'Sliding window',
    difficulty: 'medium',
    fnName: 'maxSum',
    description: 'Return the largest sum of k consecutive elements, or null if the array is shorter than k.',
    code: `function maxSum(arr, k) {
  if (arr.length < k) return null;
  let window = 0;
  for (let i = 0; i < k; i++) window += arr[i];
  let best = window;
  for (let i = k; i < arr.length; i++) {
    window += arr[i] - arr[i - k];
    best = Math.max(best, window);
  }
  return best;
}`,
    tests: [
      { args: [[2, 6, 9, 2, 1, 8, 5, 6, 3], 3], expected: 19 },
      { args: [[1, 2, 5, 2, 8, 1, 5], 2], expected: 10 },
      { args: [[-3, -1, -2], 2], expected: -3 },
      { args: [[4, 2, 1, 6], 1], expected: 6 },
      { args: [[1], 2], expected: null },
      { args: [[1, 9, 1, 1], 4], expected: 12 },
      { args: [[5, 1, 1, 1, 7], 2], expected: 8 },
    ],
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    topic: 'Divide & conquer',
    difficulty: 'easy',
    fnName: 'binarySearch',
    description: 'Return the index of target in the sorted array, or -1 if it is not there.',
    code: `function binarySearch(arr, target) {
  let lo = 0;
  let hi = arr.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
    tests: [
      { args: [[1, 3, 5, 8, 10, 12, 16, 20, 25], 16], expected: 6 },
      { args: [[1, 3, 5, 8, 10], 1], expected: 0 },
      { args: [[1, 3, 5, 8, 10], 10], expected: 4 },
      { args: [[1, 3, 5, 8, 10], 4], expected: -1 },
      { args: [[], 4], expected: -1 },
      { args: [[7], 7], expected: 0 },
      { args: [[2, 4, 6, 8, 10, 12], 2], expected: 0 },
      { args: [[2, 4, 6, 8, 10, 12], 12], expected: 5 },
      { args: [[2, 4], 4], expected: 1 },
      { args: [[1, 3, 5, 8, 10, 12, 16], 0], expected: -1 },
      { args: [[1, 3, 5, 8, 10, 12, 16], 99], expected: -1 },
    ],
  },
  {
    id: 'same-squared',
    title: 'Squares in Another Array',
    topic: 'Frequency counter',
    difficulty: 'medium',
    fnName: 'same',
    description: 'Return true if every value in a has its square in b with the same frequency.',
    code: `function same(a, b) {
  if (a.length !== b.length) return false;
  const fa = {};
  const fb = {};
  for (const x of a) fa[x] = (fa[x] || 0) + 1;
  for (const y of b) fb[y] = (fb[y] || 0) + 1;
  for (const key in fa) {
    if (fb[key * key] !== fa[key]) return false;
  }
  return true;
}`,
    tests: [
      { args: [[1, 2, 3, 2], [9, 1, 4, 4]], expected: true },
      { args: [[1, 2, 3], [1, 9]], expected: false },
      { args: [[1, 2, 1], [4, 4, 1]], expected: false },
      { args: [[], []], expected: true },
      { args: [[3], [9]], expected: true },
      { args: [[2, 3], [4, 8]], expected: false },
    ],
  },
  {
    id: 'factorial',
    title: 'Factorial',
    topic: 'Recursion',
    difficulty: 'easy',
    fnName: 'factorial',
    description: 'Return n! using recursion. factorial(0) and factorial(1) are 1.',
    code: `function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}`,
    tests: [
      { args: [0], expected: 1 },
      { args: [1], expected: 1 },
      { args: [2], expected: 2 },
      { args: [5], expected: 120 },
      { args: [7], expected: 5040 },
    ],
  },
  {
    id: 'power',
    title: 'Power',
    topic: 'Recursion',
    difficulty: 'easy',
    fnName: 'power',
    description: 'Return base raised to exp (exp is a whole number ≥ 0) using recursion.',
    code: `function power(base, exp) {
  if (exp === 0) return 1;
  return base * power(base, exp - 1);
}`,
    tests: [
      { args: [2, 0], expected: 1 },
      { args: [2, 1], expected: 2 },
      { args: [2, 10], expected: 1024 },
      { args: [3, 3], expected: 27 },
      { args: [5, 2], expected: 25 },
    ],
  },
  {
    id: 'fibonacci',
    title: 'Fibonacci (memoised)',
    topic: 'Recursion',
    difficulty: 'medium',
    fnName: 'fib',
    description: 'Return the nth Fibonacci number (fib(1) = fib(2) = 1) in O(n) using memoisation.',
    code: `function fib(n, memo = {}) {
  if (n <= 2) return 1;
  if (memo[n]) return memo[n];
  memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
  return memo[n];
}`,
    tests: [
      { args: [1], expected: 1 },
      { args: [2], expected: 1 },
      { args: [3], expected: 2 },
      { args: [10], expected: 55 },
      { args: [40], expected: 102334155 },
    ],
  },
  {
    id: 'bubble-sort',
    title: 'Bubble Sort (optimised)',
    topic: 'Sorting',
    difficulty: 'medium',
    fnName: 'bubbleSort',
    description: 'Sort the array in ascending order in place with optimised bubble sort and return it.',
    code: `function bubbleSort(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    let swapped = false;
    for (let j = 0; j < i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return arr;
}`,
    tests: [
      { args: [[5, 3, 4, 1, 2]], expected: [1, 2, 3, 4, 5] },
      { args: [[]], expected: [] },
      { args: [[1]], expected: [1] },
      { args: [[2, 1]], expected: [1, 2] },
      { args: [[3, -1, 3, 0]], expected: [-1, 0, 3, 3] },
      { args: [[1, 2, 3]], expected: [1, 2, 3] },
      { args: [[9, 8, 7, 6, 5, 4]], expected: [4, 5, 6, 7, 8, 9] },
    ],
  },
  {
    id: 'selection-sort',
    title: 'Selection Sort',
    topic: 'Sorting',
    difficulty: 'medium',
    fnName: 'selectionSort',
    description: 'Sort the array in ascending order in place with selection sort and return it.',
    code: `function selectionSort(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    let smallest = i;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] < arr[smallest]) smallest = j;
    }
    if (smallest !== i) {
      [arr[i], arr[smallest]] = [arr[smallest], arr[i]];
    }
  }
  return arr;
}`,
    tests: [
      { args: [[5, 3, 4, 1, 2]], expected: [1, 2, 3, 4, 5] },
      { args: [[]], expected: [] },
      { args: [[2, 1]], expected: [1, 2] },
      { args: [[4, 4, -2, 0]], expected: [-2, 0, 4, 4] },
      { args: [[1, 2, 3]], expected: [1, 2, 3] },
      { args: [[3, 1, 2]], expected: [1, 2, 3] },
    ],
  },
  {
    id: 'insertion-sort',
    title: 'Insertion Sort',
    topic: 'Sorting',
    difficulty: 'medium',
    fnName: 'insertionSort',
    description: 'Sort the array in ascending order in place with insertion sort and return it.',
    code: `function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const current = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > current) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = current;
  }
  return arr;
}`,
    tests: [
      { args: [[5, 3, 4, 1, 2]], expected: [1, 2, 3, 4, 5] },
      { args: [[]], expected: [] },
      { args: [[2, 1]], expected: [1, 2] },
      { args: [[3, -1, 3, 0]], expected: [-1, 0, 3, 3] },
      { args: [[1, 2, 3]], expected: [1, 2, 3] },
      { args: [[9, 1, 8, 2]], expected: [1, 2, 8, 9] },
    ],
  },
  {
    id: 'max-char',
    title: 'Maximum Occurring Character',
    topic: 'Frequency counter',
    difficulty: 'easy',
    fnName: 'maxChar',
    description: 'Return the character that appears most often (the first one to reach the top count on a tie).',
    code: `function maxChar(s) {
  const freq = {};
  for (const ch of s) freq[ch] = (freq[ch] || 0) + 1;
  let best = "";
  let bestCount = 0;
  for (const ch in freq) {
    if (freq[ch] > bestCount) {
      best = ch;
      bestCount = freq[ch];
    }
  }
  return best;
}`,
    tests: [
      { args: ['javascript'], expected: 'a' },
      { args: ['aabbbcc'], expected: 'b' },
      { args: ['z'], expected: 'z' },
      { args: [''], expected: '' },
      { args: ['abcabc'], expected: 'a' },
      { args: ['hello'], expected: 'l' },
    ],
  },
  {
    id: 'palindrome',
    title: 'Palindrome Check',
    topic: 'Two pointers',
    difficulty: 'easy',
    fnName: 'isPalindrome',
    description: 'Return true if the string reads the same forwards and backwards.',
    code: `function isPalindrome(s) {
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    if (s[left] !== s[right]) return false;
    left++;
    right--;
  }
  return true;
}`,
    tests: [
      { args: ['madam'], expected: true },
      { args: ['racecar'], expected: true },
      { args: ['abca'], expected: false },
      { args: [''], expected: true },
      { args: ['ab'], expected: false },
      { args: ['abba'], expected: true },
      { args: ['abcda'], expected: false },
    ],
  },
  {
    id: 'longest-substring',
    title: 'Longest Substring Without Repeats',
    topic: 'Sliding window',
    difficulty: 'hard',
    fnName: 'longestUnique',
    description: 'Return the length of the longest substring that has no repeated characters.',
    code: `function longestUnique(s) {
  const lastSeen = new Map();
  let start = 0;
  let best = 0;
  for (let end = 0; end < s.length; end++) {
    const ch = s[end];
    if (lastSeen.has(ch) && lastSeen.get(ch) >= start) {
      start = lastSeen.get(ch) + 1;
    }
    lastSeen.set(ch, end);
    best = Math.max(best, end - start + 1);
  }
  return best;
}`,
    tests: [
      { args: ['abcabcbb'], expected: 3 },
      { args: ['bbbbb'], expected: 1 },
      { args: ['pwwkew'], expected: 3 },
      { args: [''], expected: 0 },
      { args: ['abba'], expected: 2 },
      { args: ['dvdf'], expected: 3 },
      { args: ['abcdef'], expected: 6 },
    ],
  },
  {
    id: 'two-sum',
    title: 'Two Sum',
    topic: 'Hash map',
    difficulty: 'easy',
    fnName: 'twoSum',
    description: 'Return the indices [i, j] (i < j) of the two numbers that add up to target, or [] if none.',
    code: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
    tests: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] },
      { args: [[3, 3], 6], expected: [0, 1] },
      { args: [[1, 2, 3], 7], expected: [] },
      { args: [[5, 1, 9, 4], 13], expected: [2, 3] },
      { args: [[], 1], expected: [] },
    ],
  },
  {
    id: 'max-profit',
    title: 'Best Time to Buy and Sell Stock',
    topic: 'Greedy',
    difficulty: 'easy',
    fnName: 'maxProfit',
    description: 'Given daily prices, return the max profit from one buy then one later sell (0 if no profit).',
    code: `function maxProfit(prices) {
  let minPrice = Infinity;
  let best = 0;
  for (let i = 0; i < prices.length; i++) {
    if (prices[i] < minPrice) minPrice = prices[i];
    else best = Math.max(best, prices[i] - minPrice);
  }
  return best;
}`,
    tests: [
      { args: [[7, 1, 5, 3, 6, 4]], expected: 5 },
      { args: [[7, 6, 4, 3, 1]], expected: 0 },
      { args: [[]], expected: 0 },
      { args: [[2, 4, 1]], expected: 2 },
      { args: [[3, 8, 1, 4]], expected: 5 },
      { args: [[1, 2]], expected: 1 },
    ],
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    topic: 'Stack',
    difficulty: 'medium',
    fnName: 'isValid',
    description: 'Return true if every bracket ()[]{} is closed by the same type, in the right order.',
    code: `function isValid(s) {
  const pairs = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  for (const ch of s) {
    if (ch === "(" || ch === "[" || ch === "{") {
      stack.push(ch);
    } else {
      if (stack.length === 0 || stack.pop() !== pairs[ch]) return false;
    }
  }
  return stack.length === 0;
}`,
    tests: [
      { args: ['()'], expected: true },
      { args: ['()[]{}'], expected: true },
      { args: ['(]'], expected: false },
      { args: ['([)]'], expected: false },
      { args: ['{[]}'], expected: true },
      { args: ['('], expected: false },
      { args: [')'], expected: false },
      { args: [''], expected: true },
    ],
  },
  {
    id: 'move-zeroes',
    title: 'Move Zeroes',
    topic: 'Two pointers',
    difficulty: 'easy',
    fnName: 'moveZeroes',
    description: 'Move all 0s to the end in place, keeping the order of the other numbers. Return the array.',
    code: `function moveZeroes(nums) {
  let write = 0;
  for (let read = 0; read < nums.length; read++) {
    if (nums[read] !== 0) {
      [nums[write], nums[read]] = [nums[read], nums[write]];
      write++;
    }
  }
  return nums;
}`,
    tests: [
      { args: [[0, 1, 0, 3, 12]], expected: [1, 3, 12, 0, 0] },
      { args: [[0]], expected: [0] },
      { args: [[1, 2]], expected: [1, 2] },
      { args: [[0, 0, 1]], expected: [1, 0, 0] },
      { args: [[4, 0, 5, 0, 0, 6]], expected: [4, 5, 6, 0, 0, 0] },
    ],
  },
  {
    id: 'merge-sorted',
    title: 'Merge Two Sorted Arrays',
    topic: 'Two pointers',
    difficulty: 'medium',
    fnName: 'mergeSorted',
    description: 'Merge two sorted arrays into one new sorted array.',
    code: `function mergeSorted(a, b) {
  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) out.push(a[i++]);
    else out.push(b[j++]);
  }
  while (i < a.length) out.push(a[i++]);
  while (j < b.length) out.push(b[j++]);
  return out;
}`,
    tests: [
      { args: [[1, 3, 5], [2, 4, 6]], expected: [1, 2, 3, 4, 5, 6] },
      { args: [[], [1, 2]], expected: [1, 2] },
      { args: [[1, 2], []], expected: [1, 2] },
      { args: [[1, 1], [1]], expected: [1, 1, 1] },
      { args: [[5, 9], [1, 2, 3]], expected: [1, 2, 3, 5, 9] },
      { args: [[0, 10], [5]], expected: [0, 5, 10] },
    ],
  },
]

export const ALGORITHMS_BY_ID = Object.fromEntries(ALGORITHMS.map((a) => [a.id, a]))
