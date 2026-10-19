import type { TestCase } from '@/lib/testing'
import type { Difficulty } from './algorithms'

export interface CampaignLevel {
  id: string
  title: string
  topic: string
  difficulty: Difficulty
  /** One-line context shown above the task. */
  story: string
  description: string
  fnName: string
  buggy: string
  solution: string
  tests: TestCase[]
  /** Progressive: vague → specific. */
  hints: [string, string, string]
  explanation: string
  bugs: number
}

// Hand-written levels in teaching order. tests/content.test.ts proves each
// buggy version fails at least one test and each solution passes all of them.
export const CAMPAIGN: CampaignLevel[] = [
  {
    id: 'first-bug',
    title: 'The Missing Last Element',
    topic: 'Loops',
    difficulty: 'easy',
    story: 'Your first ticket: the cart total is always a bit too low.',
    description: 'sumArray(nums) should return the sum of every number in the array.',
    fnName: 'sumArray',
    buggy: `function sumArray(nums) {
  let total = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    total += nums[i];
  }
  return total;
}`,
    solution: `function sumArray(nums) {
  let total = 0;
  for (let i = 0; i < nums.length; i++) {
    total += nums[i];
  }
  return total;
}`,
    tests: [
      { args: [[1, 2, 3]], expected: 6 },
      { args: [[10]], expected: 10 },
      { args: [[]], expected: 0 },
      { args: [[-2, 5, 4]], expected: 7 },
    ],
    hints: [
      'Look at which elements the loop actually visits.',
      'The loop condition stops one index early.',
      'Change `i < nums.length - 1` to `i < nums.length`.',
    ],
    explanation: 'Classic off-by-one: valid indexes run from 0 to length − 1, so the condition must be `i < nums.length`. Using `length - 1` skips the last element.',
    bugs: 1,
  },
  {
    id: 'sum-zero',
    title: 'Sum Zero',
    topic: 'Two pointers',
    difficulty: 'easy',
    story: 'A teammate wrote the two-pointer version of Sum Zero, but it returns [0, 0] for some inputs.',
    description: 'Given a sorted array, return the first pair that sums to 0, or undefined if there is none.',
    fnName: 'sumZero',
    buggy: `function sumZero(arr) {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    const sum = arr[left] + arr[right];
    if (sum === 0) return [arr[left], arr[right]];
    if (sum > 0) right--;
    else left++;
  }
  return undefined;
}`,
    solution: `function sumZero(arr) {
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
      { args: [[0]], expected: undefined },
      { args: [[-5, 5]], expected: [-5, 5] },
    ],
    hints: [
      'What happens when both pointers land on the same element?',
      'The loop keeps running when left === right.',
      'Use `left < right` so an element is never paired with itself.',
    ],
    explanation: 'With `left <= right`, both pointers can meet on 0 and the code reports [0, 0] — the same element used twice. A pair needs two different positions, so loop while `left < right`.',
    bugs: 1,
  },
  {
    id: 'anagram',
    title: 'Anagram Checker',
    topic: 'Frequency counter',
    difficulty: 'easy',
    story: 'QA says "aaz" and "zza" are being reported as anagrams.',
    description: 'isAnagram(a, b) returns true if b uses exactly the same letters as a, the same number of times.',
    fnName: 'isAnagram',
    buggy: `function isAnagram(a, b) {
  if (a.length !== b.length) return false;
  const freq = {};
  for (const ch of a) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  for (const ch of b) {
    if (!freq[ch]) return false;
  }
  return true;
}`,
    solution: `function isAnagram(a, b) {
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
    ],
    hints: [
      'The second loop checks that a letter exists — but does it check how many?',
      'Counts are built for a, but never used up by b.',
      'Inside the second loop, add `freq[ch] -= 1;` after the check.',
    ],
    explanation: 'A frequency counter must decrement as it matches. Without `freq[ch] -= 1`, a single "z" in a lets b use "z" any number of times, so "zza" looks valid.',
    bugs: 1,
  },
  {
    id: 'count-unique',
    title: 'Count Unique Values',
    topic: 'Two pointers',
    difficulty: 'easy',
    story: 'The dashboard shows one fewer unique visitor than the database does.',
    description: 'Given a sorted array, return how many unique values it contains.',
    fnName: 'countUnique',
    buggy: `function countUnique(arr) {
  if (arr.length === 0) return 0;
  let i = 0;
  for (let j = 1; j < arr.length; j++) {
    if (arr[j] !== arr[i]) {
      i++;
      arr[i] = arr[j];
    }
  }
  return i;
}`,
    solution: `function countUnique(arr) {
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
    ],
    hints: [
      'Is `i` a count, or a position?',
      '`i` is the index of the last unique value.',
      'Return `i + 1`.',
    ],
    explanation: '`i` is an index (0-based), so the number of unique values is `i + 1`. Mixing up "index" and "count" is one of the most common interview bugs.',
    bugs: 1,
  },
  {
    id: 'sliding-window',
    title: 'Best Weekly Sales',
    topic: 'Sliding window',
    difficulty: 'medium',
    story: 'The "best k-day streak" widget breaks for stores that lose money every day.',
    description: 'maxSum(arr, k) returns the largest sum of k consecutive elements, or null if the array is shorter than k.',
    fnName: 'maxSum',
    buggy: `function maxSum(arr, k) {
  if (arr.length < k) return null;
  let window = 0;
  for (let i = 0; i < k; i++) window += arr[i];
  let best = 0;
  for (let i = k; i < arr.length; i++) {
    window += arr[i] - arr[i - k];
    best = Math.max(best, window);
  }
  return best;
}`,
    solution: `function maxSum(arr, k) {
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
      { args: [[-3, -1, -2], 2], expected: -3 },
      { args: [[4, 2, 1, 6], 4], expected: 13 },
      { args: [[1], 2], expected: null },
    ],
    hints: [
      'Try it on an array where every number is negative.',
      '`best` starts at a value that may never be a real window sum.',
      'Initialise `best = window` (the first window), not 0.',
    ],
    explanation: 'Starting `best` at 0 assumes some window is ≥ 0. With all-negative data the true answer is negative, so 0 wins incorrectly. Seed it with the first real window (or -Infinity). It also covers k === arr.length, where the slide loop never runs.',
    bugs: 1,
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    topic: 'Divide & conquer',
    difficulty: 'easy',
    story: 'Search works for most items, but the last product in the catalog is never found.',
    description: 'binarySearch(arr, target) returns the index of target in a sorted array, or -1.',
    fnName: 'binarySearch',
    buggy: `function binarySearch(arr, target) {
  let lo = 0;
  let hi = arr.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
    solution: `function binarySearch(arr, target) {
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
      { args: [[1, 3, 5, 8, 10, 12, 16], 16], expected: 6 },
      { args: [[1, 3, 5, 8, 10], 1], expected: 0 },
      { args: [[7], 7], expected: 0 },
      { args: [[1, 3, 5], 4], expected: -1 },
    ],
    hints: [
      'What happens when the search space shrinks to exactly one element?',
      'When lo === hi the loop stops without checking that element.',
      'Loop while `lo <= hi`.',
    ],
    explanation: 'lo and hi are both inclusive bounds, so the range [lo, hi] still has one element when lo === hi. `while (lo < hi)` exits before checking it. Inclusive bounds → `lo <= hi`.',
    bugs: 1,
  },
  {
    id: 'factorial',
    title: 'Recursion Without a Floor',
    topic: 'Recursion',
    difficulty: 'easy',
    story: 'factorial(0) crashes the server with "Maximum call stack size exceeded".',
    description: 'factorial(n) returns n! for n ≥ 0. factorial(0) is 1.',
    fnName: 'factorial',
    buggy: `function factorial(n) {
  if (n === 1) return 1;
  return n * factorial(n - 1);
}`,
    solution: `function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}`,
    tests: [
      { args: [5], expected: 120 },
      { args: [1], expected: 1 },
      { args: [0], expected: 1 },
      { args: [3], expected: 6 },
    ],
    hints: [
      'Trace factorial(0) by hand.',
      'The base case only catches n === 1, so 0 → -1 → -2 … never stops.',
      'Use `if (n <= 1) return 1;`.',
    ],
    explanation: 'Every recursion needs a base case that every input eventually reaches. `n === 1` misses 0 (and negatives), so the calls never stop. `n <= 1` covers both 0 and 1.',
    bugs: 1,
  },
  {
    id: 'bubble-sort',
    title: 'Bubble Sort Gives Up Early',
    topic: 'Sorting',
    difficulty: 'medium',
    story: 'The leaderboard is only "kind of" sorted — the top score is right, the rest are not.',
    description: 'bubbleSort(arr) sorts the array ascending in place (optimised bubble sort) and returns it.',
    fnName: 'bubbleSort',
    buggy: `function bubbleSort(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    let swapped = false;
    for (let j = 0; j < i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
    if (!swapped) break;
  }
  return arr;
}`,
    solution: `function bubbleSort(arr) {
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
      { args: [[2, 1]], expected: [1, 2] },
      { args: [[3, 1, 2]], expected: [1, 2, 3] },
      { args: [[1, 2, 3]], expected: [1, 2, 3] },
    ],
    hints: [
      'How many passes does the outer loop actually make?',
      'The early-exit check reads `swapped`, but nothing ever sets it.',
      'Set `swapped = true;` right after the swap.',
    ],
    explanation: 'The optimisation "stop when a pass makes no swaps" only works if each swap sets the flag. Without `swapped = true`, the loop always breaks after the first pass — which only guarantees the largest value is in place.',
    bugs: 1,
  },
  {
    id: 'insertion-sort',
    title: 'Insertion Sort Drops a Card',
    topic: 'Sorting',
    difficulty: 'medium',
    story: 'After sorting, one value is duplicated and another is missing.',
    description: 'insertionSort(arr) sorts the array ascending in place and returns it.',
    fnName: 'insertionSort',
    buggy: `function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const current = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > current) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j] = current;
  }
  return arr;
}`,
    solution: `function insertionSort(arr) {
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
      { args: [[2, 1]], expected: [1, 2] },
      { args: [[1, 2, 3]], expected: [1, 2, 3] },
      { args: [[3, -1, 3, 0]], expected: [-1, 0, 3, 3] },
    ],
    hints: [
      'Where is the gap left after shifting bigger values right?',
      'The loop stops at j where arr[j] <= current, so the gap is one to the right.',
      'Write `arr[j + 1] = current;`.',
    ],
    explanation: 'After the while loop, j points at the first element that is NOT bigger than current (or −1). The empty slot is j + 1. Writing to arr[j] overwrites a valid value and loses data.',
    bugs: 1,
  },
  {
    id: 'palindrome',
    title: 'Palindrome Pointers',
    topic: 'Two pointers',
    difficulty: 'easy',
    story: 'The validator says "racecar" and "abba" are not palindromes.',
    description: 'isPalindrome(s) returns true if s reads the same forwards and backwards.',
    fnName: 'isPalindrome',
    buggy: `function isPalindrome(s) {
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    if (s[left] !== s[right]) return false;
    left++;
    right++;
  }
  return true;
}`,
    solution: `function isPalindrome(s) {
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
      { args: ['racecar'], expected: true },
      { args: ['abca'], expected: false },
      { args: [''], expected: true },
      { args: ['abba'], expected: true },
    ],
    hints: [
      'Both pointers should move towards the middle.',
      'One pointer is moving the wrong way and walks off the end of the string.',
      'Use `right--`.',
    ],
    explanation: 'Two pointers from both ends must converge: left++ and right--. With right++, the right pointer runs off the end of the string, compares a real letter with undefined, and returns false for every palindrome longer than one character.',
    bugs: 1,
  },
  {
    id: 'two-sum',
    title: 'Two Sum, Same Index Twice',
    topic: 'Hash map',
    difficulty: 'medium',
    story: 'twoSum([3, 2, 4], 6) returns [0, 0] — using the 3 twice.',
    description: 'twoSum(nums, target) returns indices [i, j] (i < j) of two different numbers that add up to target, or [].',
    fnName: 'twoSum',
    buggy: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    seen.set(nums[i], i);
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
  }
  return [];
}`,
    solution: `function twoSum(nums, target) {
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
    ],
    hints: [
      'When is the current number added to the map?',
      'It is stored before the lookup, so it can match itself.',
      'Check `seen.has(need)` first, then `seen.set(nums[i], i)`.',
    ],
    explanation: 'Order matters in the one-pass hash map. Look up the complement among PREVIOUS numbers first, then record the current one. Recording first lets 3 pair with itself for target 6.',
    bugs: 1,
  },
  {
    id: 'longest-substring',
    title: 'Boss: The "abba" Trap',
    topic: 'Sliding window',
    difficulty: 'hard',
    story: 'Boss level — two bugs. The longest-unique-substring service is wrong for "abba" and for every string.',
    description: 'longestUnique(s) returns the length of the longest substring without repeated characters.',
    fnName: 'longestUnique',
    buggy: `function longestUnique(s) {
  const lastSeen = new Map();
  let start = 0;
  let best = 0;
  for (let end = 0; end < s.length; end++) {
    const ch = s[end];
    if (lastSeen.has(ch)) {
      start = lastSeen.get(ch) + 1;
    }
    lastSeen.set(ch, end);
    best = Math.max(best, end - start);
  }
  return best;
}`,
    solution: `function longestUnique(s) {
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
      { args: ['abba'], expected: 2 },
      { args: [''], expected: 0 },
    ],
    hints: [
      'There are two bugs: one in the window length, one in when start jumps.',
      'A window from start to end (inclusive) has end − start + 1 items. And a duplicate seen BEFORE start is not inside the window.',
      'Use `end - start + 1`, and only jump when `lastSeen.get(ch) >= start`.',
    ],
    explanation: 'Window length with inclusive ends is end − start + 1. And in "abba", the last "a" was seen at 0, which is already outside the window (start = 2) — jumping to 1 moves the window backwards. Only jump if the duplicate is inside the window.',
    bugs: 2,
  },
]

export const CAMPAIGN_BY_ID = Object.fromEntries(CAMPAIGN.map((l) => [l.id, l]))
