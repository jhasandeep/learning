import type { DsaModule } from './types'

export const patterns: DsaModule = {
  id: 'patterns',
  title: 'Core patterns',
  level: 'Patterns',
  blurb: 'Four patterns that turn slow double loops into one pass: sliding window, prefix sums and binary search.',
  color: '#7c3aed',
  lessons: [
    {
      id: 'max-sum-window',
      title: 'Maximum sum of k numbers in a row',
      topic: 'Sliding window (fixed size)',
      blurb: 'Slide a window of fixed size along the list and update the sum instead of recomputing it.',
      analogy: {
        emoji: '🚂',
        title: 'A train window moving along the track',
        text: 'Imagine looking through a train window that shows exactly k houses. When the train moves one step, **one new house comes in and one leaves**. You do not need to recount all the houses: take the old count, add the new one and subtract the one that left.',
      },
      problem: {
        statement: 'Write `max_sum_window(nums, k)` that returns the largest sum of any `k` consecutive numbers, or `None` (`null`) if the list has fewer than `k` numbers.',
        examples: [
          { input: 'nums = [2, 1, 5, 1, 3, 2], k = 3', output: '9', why: '5 + 1 + 3 is the best window' },
          { input: 'nums = [4], k = 1', output: '4' },
          { input: 'nums = [1, 2], k = 3', output: 'None', why: 'there are not enough numbers' },
        ],
      },
      steps: [
        {
          title: 'Add up every window from scratch',
          tag: 'slow',
          idea: 'For every starting position, add up the next `k` numbers and keep the biggest sum. It is easy, but each window re-adds numbers that the previous window already added.',
          walk: ['If there are fewer than `k` numbers, return None.', 'For each start position that leaves room for `k` numbers:', 'Add the `k` numbers from there.', 'Keep the largest sum seen. Return it.'],
          code: {
            python: `def max_sum_window(nums, k):
    if len(nums) < k:
        return None
    best = None
    for start in range(len(nums) - k + 1):
        total = 0
        for i in range(start, start + k):
            total += nums[i]
        if best is None or total > best:
            best = total
    return best
`,
            javascript: `function maxSumWindow(nums, k) {
  if (nums.length < k) return null;
  let best = null;
  for (let start = 0; start + k <= nums.length; start++) {
    let total = 0;
    for (let i = start; i < start + k; i++) {
      total += nums[i];
    }
    if (best === null || total > best) best = total;
  }
  return best;
}
`,
          },
          time: 'O(n × k)',
          space: 'O(1)',
          verdict: 'Correct, but with a huge window every step does a lot of repeated work.',
        },
        {
          title: 'Slide the window',
          tag: 'best',
          idea: 'Compute the first window once. Then move the window one step at a time: add the number that enters on the right and subtract the number that leaves on the left. Each number is added once and removed once.',
          walk: ['If there are fewer than `k` numbers, return None.', 'Add up the first `k` numbers: this is the first window sum and the best so far.', 'For each next position: `window = window + nums[i] - nums[i - k]`.', 'Update the best if the new window is larger. Return the best.'],
          code: {
            python: `def max_sum_window(nums, k):
    if len(nums) < k:
        return None
    window = sum(nums[:k])
    best = window
    for i in range(k, len(nums)):
        window += nums[i] - nums[i - k]
        best = max(best, window)
    return best
`,
            javascript: `function maxSumWindow(nums, k) {
  if (nums.length < k) return null;
  let window = 0;
  for (let i = 0; i < k; i++) window += nums[i];
  let best = window;
  for (let i = k; i < nums.length; i++) {
    window += nums[i] - nums[i - k];
    best = Math.max(best, window);
  }
  return best;
}
`,
          },
          time: 'O(n)',
          space: 'O(1)',
          verdict: 'One pass, no matter how big k is. This is the **sliding window** pattern.',
        },
      ],
      dryRun: {
        title: 'Slide a window of size 3',
        input: 'nums = [2, 1, 5, 1, 3], k = 3',
        frames: [
          { caption: 'First window = 2 + 1 + 5 = 8. This is the best so far.', vars: [['window', '8'], ['best', '8']], array: { cells: [2, 1, 5, 1, 3], marks: [0, 1, 2] } },
          { caption: 'Slide right: add 1 (enters), subtract 2 (leaves). 8 + 1 - 2 = 7. Not better.', vars: [['window', '7'], ['best', '8']], array: { cells: [2, 1, 5, 1, 3], pointers: { in: 3, out: 0 }, marks: [1, 2, 3] } },
          { caption: 'Slide right: add 3 (enters), subtract 1 (leaves). 7 + 3 - 1 = 9. A new best!', vars: [['window', '9'], ['best', '9']], array: { cells: [2, 1, 5, 1, 3], pointers: { in: 4, out: 1 }, marks: [2, 3, 4] } },
          { caption: 'No numbers left to slide in. The answer is 9.', vars: [['best', '9']], array: { cells: [2, 1, 5, 1, 3], marks: [2, 3, 4] } },
        ],
      },
      practice: {
        fn: { python: 'max_sum_window', javascript: 'maxSumWindow' },
        starter: { python: `def max_sum_window(nums, k):\n    # your code here\n    pass\n`, javascript: `function maxSumWindow(nums, k) {\n  // your code here\n}\n` },
        cases: [
          { label: 'the best window is in the middle', args: [[2, 1, 5, 1, 3, 2], 3], expected: 9 },
          { label: 'one number, window of 1', args: [[4], 1], expected: 4 },
          { label: 'not enough numbers gives None / null', args: [[1, 2], 3], expected: null },
          { label: 'all negative numbers', args: [[-1, -2, -3], 2], expected: -3 },
          { label: 'the window is the whole list', args: [[1, 1, 1, 1], 4], expected: 4 },
          { label: 'an empty list', args: [[], 1], expected: null },
          { label: 'the best window is at the end', args: [[1, 2, 3, 9, 9], 2], expected: 18 },
        ],
        hints: ['Return None / null when the list has fewer than k numbers.', 'Do not re-add the whole window each time.', 'After the first window, add the new number and subtract the one that left: `nums[i] - nums[i - k]`.'],
      },
      mistakes: ['Starting the best at 0 (breaks with all-negative numbers).', 'An off-by-one when removing the old number: it is `nums[i - k]`.', 'Forgetting the case where the list is shorter than k.'],
      variants: ['Return the **starting index** of the best window.', 'Find the maximum **average** of k numbers.', 'Smallest window with a sum of at least a target (variable size, next lesson).'],
      recap: 'A sliding window updates the answer by adding what enters and removing what leaves, instead of starting over.',
    },
    {
      id: 'longest-unique-substring',
      title: 'Longest substring without repeats',
      topic: 'Sliding window (variable size)',
      blurb: 'Grow a window while letters are unique, and shrink it when a repeat appears.',
      analogy: {
        emoji: '🪟',
        title: 'A stretchy window that must stay clear of repeats',
        text: 'Hold a stretchy window over the word. Stretch it to the right while every letter inside is different. When a letter repeats, **pull the left edge forward** just far enough to drop the earlier copy. The widest the window ever got is the answer.',
      },
      problem: {
        statement: 'Write `length_of_longest_substring(s)` that returns the length of the longest part of `s` (a substring, letters next to each other) that has no repeated letter.',
        examples: [
          { input: 's = "abcabcbb"', output: '3', why: '"abc"' },
          { input: 's = "bbbbb"', output: '1', why: '"b"' },
          { input: 's = "pwwkew"', output: '3', why: '"wke"' },
        ],
      },
      steps: [
        {
          title: 'Start at every position and extend',
          tag: 'slow',
          idea: 'For each start position, keep adding letters to a set until you meet a letter already in the set. Record the length. Try every start and keep the longest.',
          walk: ['For each start index.', 'Create an empty set and walk right from the start.', 'Stop when the next letter is already in the set.', 'Keep the longest length found.'],
          code: {
            python: `def length_of_longest_substring(s):
    best = 0
    for start in range(len(s)):
        seen = set()
        for end in range(start, len(s)):
            if s[end] in seen:
                break
            seen.add(s[end])
        best = max(best, len(seen))
    return best
`,
            javascript: `function lengthOfLongestSubstring(s) {
  let best = 0;
  for (let start = 0; start < s.length; start++) {
    const seen = new Set();
    for (let end = start; end < s.length; end++) {
      if (seen.has(s[end])) break;
      seen.add(s[end]);
    }
    best = Math.max(best, seen.size);
  }
  return best;
}
`,
          },
          time: 'O(n²)',
          space: 'O(n)',
          verdict: 'Correct. It restarts from scratch for every position, repeating work.',
        },
        {
          title: 'One window and a "last seen" map',
          tag: 'best',
          idea: 'Remember the last index where each letter appeared. Walk `right` across the string. If the current letter was seen **inside the current window**, move `left` to just after that earlier copy. Then the window is clean again: measure it.',
          walk: [
            '`left` is the start of the current window; `last` maps letter → last index.',
            'For each `right`, look at the letter.',
            'If the letter is in `last` and that index is at least `left`, set `left = last[letter] + 1`.',
            'Save `last[letter] = right` and update the best with `right - left + 1`.',
          ],
          code: {
            python: `def length_of_longest_substring(s):
    last = {}
    left = 0
    best = 0
    for right, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1
        last[ch] = right
        best = max(best, right - left + 1)
    return best
`,
            javascript: `function lengthOfLongestSubstring(s) {
  const last = new Map();
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (last.has(ch) && last.get(ch) >= left) {
      left = last.get(ch) + 1;
    }
    last.set(ch, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
`,
          },
          time: 'O(n)',
          space: 'O(n)',
          verdict: 'Each letter is visited once and `left` never moves backwards.',
        },
      ],
      dryRun: {
        title: 'The window stretches and jumps',
        input: 's = "abca"',
        frames: [
          { caption: 'right = 0, letter a. Never seen. Window "a" has length 1.', vars: [['left', '0'], ['right', '0'], ['best', '1']], array: { cells: ['a', 'b', 'c', 'a'], pointers: { left: 0, right: 0 }, marks: [0] }, extra: { label: 'last seen', items: ['a: 0'] } },
          { caption: 'right = 1, letter b. New. Window "ab" has length 2.', vars: [['left', '0'], ['right', '1'], ['best', '2']], array: { cells: ['a', 'b', 'c', 'a'], pointers: { left: 0, right: 1 }, marks: [0, 1] }, extra: { label: 'last seen', items: ['a: 0', 'b: 1'] } },
          { caption: 'right = 2, letter c. New. Window "abc" has length 3.', vars: [['left', '0'], ['right', '2'], ['best', '3']], array: { cells: ['a', 'b', 'c', 'a'], pointers: { left: 0, right: 2 }, marks: [0, 1, 2] }, extra: { label: 'last seen', items: ['a: 0', 'b: 1', 'c: 2'] } },
          { caption: 'right = 3, letter a. It was last seen at index 0, inside the window. Move left to 1 to drop the old a. Window "bca" has length 3.', vars: [['left', '1'], ['right', '3'], ['best', '3']], array: { cells: ['a', 'b', 'c', 'a'], pointers: { left: 1, right: 3 }, marks: [1, 2, 3] }, extra: { label: 'last seen', items: ['a: 3', 'b: 1', 'c: 2'] } },
          { caption: 'The string is finished. The longest clean window had length 3.', vars: [['best', '3']], array: { cells: ['a', 'b', 'c', 'a'] } },
        ],
      },
      practice: {
        fn: { python: 'length_of_longest_substring', javascript: 'lengthOfLongestSubstring' },
        starter: { python: `def length_of_longest_substring(s):\n    # your code here\n    pass\n`, javascript: `function lengthOfLongestSubstring(s) {\n  // your code here\n}\n` },
        cases: [
          { label: '"abcabcbb"', args: ['abcabcbb'], expected: 3 },
          { label: 'all the same letter', args: ['bbbbb'], expected: 1 },
          { label: '"pwwkew"', args: ['pwwkew'], expected: 3 },
          { label: 'an empty string', args: [''], expected: 0 },
          { label: 'no repeats at all', args: ['abcdef'], expected: 6 },
          { label: '"dvdf" (the window must jump, not reset)', args: ['dvdf'], expected: 3 },
          { label: '"abba" (never move left backwards)', args: ['abba'], expected: 2 },
        ],
        hints: ['Think of a window [left, right] that always contains different letters.', 'When the new letter is already inside the window, move `left` to one past its old position.', 'Only move `left` forward: use `last[ch] >= left` so an old copy outside the window is ignored (try "abba").'],
      },
      mistakes: ['Resetting `left` to 0 or moving it backwards (breaks "abba").', 'Not checking that the old copy is inside the window.', 'Measuring the window as `right - left` instead of `right - left + 1`.'],
      variants: ['Return the **substring** itself, not only its length.', 'Longest substring with **at most 2** different letters.', 'Smallest window that contains all letters of a pattern (harder).'],
      recap: 'A variable window grows on the right and only ever moves its left edge forward, so the whole scan is O(n).',
    },
    {
      id: 'subarray-sum-k',
      title: 'Subarrays that add up to k',
      topic: 'Prefix sums and a hash map',
      blurb: 'Count the stretches of a list that sum to a target, using running totals.',
      analogy: {
        emoji: '🛣️',
        title: 'Distance markers on a road',
        text: 'A road has a marker showing the **total distance from the start**. The distance between two markers is just one number minus the other. So if you want a stretch that is exactly k long, you ask: "have I passed a marker that is exactly k less than where I am now?"',
      },
      problem: {
        statement: 'Write `subarray_sum(nums, k)` that returns how many continuous stretches (subarrays) of `nums` add up to `k`. Numbers may be negative.',
        examples: [
          { input: 'nums = [1, 1, 1], k = 2', output: '2', why: 'the first two and the last two' },
          { input: 'nums = [1, 2, 3], k = 3', output: '2', why: '[1, 2] and [3]' },
          { input: 'nums = [1, -1, 0], k = 0', output: '3', why: '[1, -1], [0] and [1, -1, 0]' },
        ],
      },
      steps: [
        {
          title: 'Try every subarray',
          tag: 'slow',
          idea: 'For each start position, keep adding numbers to the right and count every time the running sum equals `k`. Because numbers can be negative, you cannot stop early.',
          walk: ['For each start index.', 'Walk to the right adding numbers to `total`.', 'Whenever `total == k`, add one to the count.', 'Return the count.'],
          code: {
            python: `def subarray_sum(nums, k):
    count = 0
    for start in range(len(nums)):
        total = 0
        for end in range(start, len(nums)):
            total += nums[end]
            if total == k:
                count += 1
    return count
`,
            javascript: `function subarraySum(nums, k) {
  let count = 0;
  for (let start = 0; start < nums.length; start++) {
    let total = 0;
    for (let end = start; end < nums.length; end++) {
      total += nums[end];
      if (total === k) count++;
    }
  }
  return count;
}
`,
          },
          time: 'O(n²)',
          space: 'O(1)',
          verdict: 'Correct, but it checks every possible stretch.',
        },
        {
          title: 'Running totals and a map',
          tag: 'best',
          idea: 'Let `prefix` be the sum of everything so far. A stretch ending here adds up to `k` exactly when an earlier prefix equals `prefix - k`. So keep a map: prefix value → how many times it has occurred. Start with `{0: 1}` for the empty stretch.',
          walk: ['`seen = {0: 1}` and `prefix = 0`, `count = 0`.', 'For each number, add it to `prefix`.', 'Add `seen[prefix - k]` (or 0) to `count`.', 'Record this prefix: `seen[prefix] += 1`.', 'Return `count`.'],
          code: {
            python: `def subarray_sum(nums, k):
    seen = {0: 1}
    prefix = 0
    count = 0
    for n in nums:
        prefix += n
        count += seen.get(prefix - k, 0)
        seen[prefix] = seen.get(prefix, 0) + 1
    return count
`,
            javascript: `function subarraySum(nums, k) {
  const seen = new Map([[0, 1]]);
  let prefix = 0;
  let count = 0;
  for (const n of nums) {
    prefix += n;
    count += seen.get(prefix - k) || 0;
    seen.set(prefix, (seen.get(prefix) || 0) + 1);
  }
  return count;
}
`,
          },
          time: 'O(n)',
          space: 'O(n)',
          verdict: 'This works even with negative numbers, where a sliding window cannot.',
        },
      ],
      dryRun: {
        title: 'Prefix sums for [1, 2, 3] with k = 3',
        input: 'nums = [1, 2, 3], k = 3',
        frames: [
          { caption: 'Start: prefix = 0, and the empty prefix 0 has been seen once.', vars: [['prefix', '0'], ['count', '0']], array: { cells: [1, 2, 3] }, extra: { label: 'seen prefixes', items: ['0 ×1'] } },
          { caption: 'Add 1: prefix = 1. We need an earlier prefix of 1 - 3 = -2. None. Remember prefix 1.', vars: [['prefix', '1'], ['count', '0']], array: { cells: [1, 2, 3], pointers: { n: 0 } }, extra: { label: 'seen prefixes', items: ['0 ×1', '1 ×1'] } },
          { caption: 'Add 2: prefix = 3. We need 3 - 3 = 0, and 0 was seen once: the stretch [1, 2] works! count = 1.', vars: [['prefix', '3'], ['count', '1']], array: { cells: [1, 2, 3], pointers: { n: 1 }, marks: [0, 1] }, extra: { label: 'seen prefixes', items: ['0 ×1', '1 ×1', '3 ×1'] } },
          { caption: 'Add 3: prefix = 6. We need 6 - 3 = 3, seen once: the stretch [3] works! count = 2.', vars: [['prefix', '6'], ['count', '2']], array: { cells: [1, 2, 3], pointers: { n: 2 }, marks: [2] }, extra: { label: 'seen prefixes', items: ['0 ×1', '1 ×1', '3 ×1', '6 ×1'] } },
          { caption: 'Done. Two subarrays add up to 3.', vars: [['count', '2']], array: { cells: [1, 2, 3] } },
        ],
      },
      practice: {
        fn: { python: 'subarray_sum', javascript: 'subarraySum' },
        starter: { python: `def subarray_sum(nums, k):\n    # your code here\n    pass\n`, javascript: `function subarraySum(nums, k) {\n  // your code here\n}\n` },
        cases: [
          { label: 'overlapping stretches', args: [[1, 1, 1], 2], expected: 2 },
          { label: '[1, 2] and [3]', args: [[1, 2, 3], 3], expected: 2 },
          { label: 'no stretch adds up to k', args: [[1], 0], expected: 0 },
          { label: 'an empty list', args: [[], 0], expected: 0 },
          { label: 'zeros and negatives together', args: [[1, -1, 0], 0], expected: 3 },
          { label: 'a longer list', args: [[3, 4, 7, 2, -3, 1, 4, 2], 7], expected: 4 },
        ],
        hints: ['Define `prefix` as the sum of the numbers so far.', 'A stretch ending now sums to k when an earlier prefix equals `prefix - k`.', 'Keep a map of prefix → how many times seen, starting with `{0: 1}` so stretches that start at the beginning count too.'],
      },
      mistakes: ['Forgetting to start the map with `{0: 1}`.', 'Updating the map **before** looking up `prefix - k` (it matters when k is 0).', 'Using a sliding window: it fails when there are negative numbers.'],
      variants: ['Return the **longest** stretch with sum k.', 'Count stretches with sum **divisible by k**.', 'Find the number of stretches with equal numbers of 0s and 1s.'],
      recap: 'The sum between two positions is the difference of two prefix sums, so a map of past prefixes finds matches instantly.',
    },
    {
      id: 'binary-search',
      title: 'Binary search',
      topic: 'Binary search',
      blurb: 'Find a number in a sorted list by cutting the search area in half every time.',
      analogy: {
        emoji: '📖',
        title: 'Looking up a word in a dictionary',
        text: 'You do not read a dictionary page by page. You open it in the middle, see if your word is **before or after** that page, and throw away the other half. Each look removes half of what is left, so even a million pages take only about 20 looks.',
      },
      problem: {
        statement: 'Write `binary_search(nums, target)` for a list sorted from smallest to largest. Return the **index** of `target`, or `-1` if it is not in the list.',
        examples: [
          { input: 'nums = [-1, 0, 3, 5, 9, 12], target = 9', output: '4' },
          { input: 'nums = [-1, 0, 3, 5, 9, 12], target = 2', output: '-1' },
          { input: 'nums = [], target = 1', output: '-1' },
        ],
      },
      steps: [
        {
          title: 'Check every number',
          tag: 'slow',
          idea: 'Walk through the list and compare each number with the target. It works on any list, sorted or not, but it ignores the fact that ours is sorted.',
          walk: ['For each index, compare `nums[i]` with the target.', 'If equal, return the index.', 'If the loop ends, return -1.'],
          code: {
            python: `def binary_search(nums, target):
    for i in range(len(nums)):
        if nums[i] == target:
            return i
    return -1
`,
            javascript: `function binarySearch(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === target) return i;
  }
  return -1;
}
`,
          },
          time: 'O(n)',
          space: 'O(1)',
          verdict: 'Fine for small lists. For a million numbers it may need a million checks.',
        },
        {
          title: 'Cut the search area in half',
          tag: 'best',
          idea: 'Keep a search area from `low` to `high`. Look at the middle number. If it is the target, you are done. If it is too small, the target must be in the right half, so move `low` past the middle. If it is too big, move `high` before the middle. Stop when the area is empty.',
          walk: ['`low = 0`, `high = len - 1`.', 'While `low <= high`: `mid = (low + high) // 2`.', 'If `nums[mid] == target`, return `mid`.', 'If `nums[mid] < target`, search right: `low = mid + 1`. Otherwise search left: `high = mid - 1`.', 'If the area becomes empty, return -1.'],
          code: {
            python: `def binary_search(nums, target):
    low, high = 0, len(nums) - 1
    while low <= high:
        mid = (low + high) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1
`,
            javascript: `function binarySearch(nums, target) {
  let low = 0;
  let high = nums.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}
`,
          },
          time: 'O(log n)',
          space: 'O(1)',
          verdict: 'A million numbers need about 20 steps. It only works because the list is **sorted**.',
        },
      ],
      dryRun: {
        title: 'Halve the search area',
        input: 'nums = [1, 3, 5, 7, 9, 11], target = 9',
        frames: [
          { caption: 'The whole list is the search area. mid = 2, and nums[2] = 5.', vars: [['low', '0'], ['high', '5'], ['mid', '2']], array: { cells: [1, 3, 5, 7, 9, 11], pointers: { low: 0, mid: 2, high: 5 } } },
          { caption: '5 is smaller than 9, so the target is on the right. low = mid + 1 = 3. The left half is thrown away.', vars: [['low', '3'], ['high', '5'], ['mid', '4']], array: { cells: [1, 3, 5, 7, 9, 11], pointers: { low: 3, mid: 4, high: 5 }, marks: [3, 4, 5] } },
          { caption: 'mid = 4, and nums[4] = 9. That is the target!', vars: [['mid', '4'], ['result', '4']], array: { cells: [1, 3, 5, 7, 9, 11], pointers: { mid: 4 }, marks: [4] } },
          { caption: 'Return index 4. We needed only 2 looks for a 6-number list.', vars: [['result', '4']], array: { cells: [1, 3, 5, 7, 9, 11], marks: [4] } },
        ],
      },
      practice: {
        fn: { python: 'binary_search', javascript: 'binarySearch' },
        starter: { python: `def binary_search(nums, target):\n    # your code here\n    pass\n`, javascript: `function binarySearch(nums, target) {\n  // your code here\n}\n` },
        cases: [
          { label: 'finds 9', args: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
          { label: 'a missing number gives -1', args: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
          { label: 'an empty list gives -1', args: [[], 1], expected: -1 },
          { label: 'one number, found', args: [[5], 5], expected: 0 },
          { label: 'the last of two', args: [[1, 3], 3], expected: 1 },
          { label: 'the first number', args: [[1, 2, 3, 4, 5, 6, 7], 1], expected: 0 },
          { label: 'the last number', args: [[1, 2, 3, 4, 5, 6, 7], 7], expected: 6 },
          { label: 'bigger than everything', args: [[1, 2, 3], 10], expected: -1 },
        ],
        hints: ['Keep two indexes, `low` and `high`, that mark the search area.', 'Compare the middle number with the target and throw away the half that cannot contain it.', 'Use `low = mid + 1` and `high = mid - 1` (not just `mid`), and loop while `low <= high`, or you may loop forever.'],
      },
      mistakes: ['`while low < high` instead of `<=`, which skips a one-number area.', 'Setting `low = mid` or `high = mid`: the area may never shrink (infinite loop).', 'Using binary search on a list that is not sorted.'],
      variants: ['Return where the target **would be inserted** if missing.', 'Find the **first** or **last** position of a repeated number.', 'Binary search on the **answer** (for example the smallest speed that finishes in time).'],
      recap: 'On sorted data, every comparison can discard half of what is left, turning O(n) into O(log n).',
    },
  ],
}
