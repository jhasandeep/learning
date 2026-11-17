import type { DsaModule } from './types'

export const medium: DsaModule = {
  id: 'medium',
  title: 'Medium problems',
  level: 'Medium',
  blurb: 'Dynamic programming basics, sorting tricks, graph search and backtracking. The questions that decide most interviews.',
  color: '#ea580c',
  lessons: [
    {
      id: 'max-subarray',
      title: 'Maximum subarray (Kadane)',
      topic: 'Dynamic programming idea',
      blurb: 'Find the stretch of a list with the biggest sum, and learn to carry the "best so far" forward.',
      analogy: {
        emoji: '💰',
        title: 'A running bank balance',
        text: 'Walk along a list of gains and losses. If your balance so far is **negative, drop it** and start fresh from the next number, because carrying a debt only hurts. If it is positive, keep it: it can only help. Track the highest balance you ever had.',
      },
      problem: {
        statement: 'Write `max_subarray(nums)` that returns the largest sum of any non-empty continuous stretch of the list. The list has at least one number.',
        examples: [
          { input: 'nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]', output: '6', why: '[4, -1, 2, 1]' },
          { input: 'nums = [1]', output: '1' },
          { input: 'nums = [-3, -1, -2]', output: '-1', why: 'must take at least one number' },
        ],
      },
      steps: [
        {
          title: 'Try every stretch',
          tag: 'slow',
          idea: 'For each start position, keep extending to the right and remember the biggest running sum you see anywhere.',
          walk: ['`best` starts as the first number.', 'For each start, set `total = 0` and extend to the right adding numbers.', 'After each addition, update `best`.', 'Return `best`.'],
          code: {
            python: `def max_subarray(nums):
    best = nums[0]
    for start in range(len(nums)):
        total = 0
        for end in range(start, len(nums)):
            total += nums[end]
            best = max(best, total)
    return best
`,
            javascript: `function maxSubarray(nums) {
  let best = nums[0];
  for (let start = 0; start < nums.length; start++) {
    let total = 0;
    for (let end = start; end < nums.length; end++) {
      total += nums[end];
      best = Math.max(best, total);
    }
  }
  return best;
}
`,
          },
          time: 'O(n²)',
          space: 'O(1)',
          verdict: 'Correct, but it re-adds the same numbers many times.',
        },
        {
          title: 'Kadane: extend or restart',
          tag: 'best',
          idea: 'At every number there are only two choices for the best stretch that **ends here**: extend the previous stretch, or start a new one with just this number. Pick the larger. Then the overall best is the largest of these.',
          walk: ['`current` = best sum of a stretch ending at the current number. Start with the first number; `best = current`.', 'For each next number: `current = max(number, current + number)`.', 'Update `best = max(best, current)`.', 'Return `best`.'],
          code: {
            python: `def max_subarray(nums):
    current = best = nums[0]
    for n in nums[1:]:
        current = max(n, current + n)
        best = max(best, current)
    return best
`,
            javascript: `function maxSubarray(nums) {
  let current = nums[0];
  let best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    current = Math.max(nums[i], current + nums[i]);
    best = Math.max(best, current);
  }
  return best;
}
`,
          },
          time: 'O(n)',
          space: 'O(1)',
          verdict: 'One pass. This "best answer ending here" thinking is the heart of dynamic programming.',
        },
      ],
      dryRun: {
        title: 'Extend or restart',
        input: 'nums = [2, -5, 4, 1]',
        frames: [
          { caption: 'Start with the first number: current = 2, best = 2.', vars: [['current', '2'], ['best', '2']], array: { cells: [2, -5, 4, 1], marks: [0] } },
          { caption: 'Next is -5. Extend: 2 + (-5) = -3. Restart: -5. The larger is -3. best stays 2.', vars: [['current', '-3'], ['best', '2']], array: { cells: [2, -5, 4, 1], pointers: { n: 1 }, marks: [0, 1] } },
          { caption: 'Next is 4. Extend: -3 + 4 = 1. Restart: 4. The larger is 4 (drop the debt!). best = 4.', vars: [['current', '4'], ['best', '4']], array: { cells: [2, -5, 4, 1], pointers: { n: 2 }, marks: [2] } },
          { caption: 'Next is 1. Extend: 4 + 1 = 5. best = 5.', vars: [['current', '5'], ['best', '5']], array: { cells: [2, -5, 4, 1], pointers: { n: 3 }, marks: [2, 3] } },
          { caption: 'Done. The best stretch is [4, 1] with sum 5.', vars: [['best', '5']], array: { cells: [2, -5, 4, 1], marks: [2, 3] } },
        ],
      },
      practice: {
        fn: { python: 'max_subarray', javascript: 'maxSubarray' },
        starter: { python: `def max_subarray(nums):\n    # your code here\n    pass\n`, javascript: `function maxSubarray(nums) {\n  // your code here\n}\n` },
        cases: [
          { label: 'the classic example', args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
          { label: 'one number', args: [[1]], expected: 1 },
          { label: 'all positive: take everything', args: [[5, 4, -1, 7, 8]], expected: 23 },
          { label: 'all negative: take the least bad', args: [[-3, -1, -2]], expected: -1 },
          { label: 'two negatives', args: [[-2, -1]], expected: -1 },
          { label: 'a drop in the middle', args: [[2, -5, 4, 1]], expected: 5 },
        ],
        hints: ['A stretch must have at least one number, so do not start the best at 0.', 'Track the best stretch that ends at the current number.', '`current = max(n, current + n)`: either extend the previous stretch or start over at `n`.'],
      },
      mistakes: ['Starting `best` at 0 (wrong for all-negative lists).', 'Resetting `current` to 0 instead of to the current number.', 'Forgetting to update `best` on every step.'],
      variants: ['Also return the **start and end** of the best stretch.', 'Maximum product subarray (negatives flip signs).', 'Maximum sum of a **circular** array.'],
      recap: 'When the answer at each position depends only on the best answer just before it, carry that one value forward.',
    },
    {
      id: 'three-sum',
      title: 'Three sum',
      topic: 'Sort + two pointers',
      blurb: 'Find all unique triples that add up to zero, by sorting and sweeping two pointers.',
      analogy: {
        emoji: '🎯',
        title: 'Fix one player, find the other two',
        text: 'To make teams of three whose scores cancel out, **fix one player** and then look for a pair that balances them. If the remaining players are lined up by score, a pair can be found by moving a pointer in from each end, instead of testing every pair.',
      },
      problem: {
        statement: 'Write `three_sum(nums)` that returns every unique triple `[a, b, c]` (each in ascending order) from the list that adds up to 0. The same triple must not appear twice.',
        examples: [
          { input: 'nums = [-1, 0, 1, 2, -1, -4]', output: '[[-1, -1, 2], [-1, 0, 1]]' },
          { input: 'nums = [0, 1, 1]', output: '[]' },
          { input: 'nums = [0, 0, 0, 0]', output: '[[0, 0, 0]]', why: 'only one unique triple' },
        ],
      },
      steps: [
        {
          title: 'Try all triples',
          tag: 'slow',
          idea: 'Check every group of three numbers. Sort each triple so duplicates look identical, and keep them in a set to remove repeats.',
          walk: ['Three nested loops pick every `i < j < k`.', 'If the three add up to 0, sort them and store as a key.', 'Convert the stored keys back into lists.'],
          code: {
            python: `def three_sum(nums):
    found = set()
    n = len(nums)
    for i in range(n):
        for j in range(i + 1, n):
            for k in range(j + 1, n):
                if nums[i] + nums[j] + nums[k] == 0:
                    found.add(tuple(sorted((nums[i], nums[j], nums[k]))))
    return [list(t) for t in found]
`,
            javascript: `function threeSum(nums) {
  const found = new Map();
  const n = nums.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        if (nums[i] + nums[j] + nums[k] === 0) {
          const triple = [nums[i], nums[j], nums[k]].sort((a, b) => a - b);
          found.set(triple.join(","), triple);
        }
      }
    }
  }
  return [...found.values()];
}
`,
          },
          time: 'O(n³)',
          space: 'O(n)',
          verdict: 'Correct, but 1,000 numbers means a billion checks.',
        },
        {
          title: 'Sort, fix one, sweep two pointers',
          tag: 'best',
          idea: 'Sort the list. For each number `nums[i]`, look for a pair in the rest that sums to `-nums[i]` with two pointers: `left` just after `i`, `right` at the end. A sum too small moves `left` up, too big moves `right` down. Skip repeated values so each triple appears once.',
          walk: ['Sort the numbers.', 'For each `i`: skip it if it equals the previous number (avoids repeats).', 'Set `left = i + 1`, `right = last`. While `left < right`: compute the sum of the three.', 'If it is 0, record the triple, move both pointers, and skip duplicates. If negative, `left++`; if positive, `right--`.'],
          code: {
            python: `def three_sum(nums):
    nums = sorted(nums)
    result = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        left, right = i + 1, len(nums) - 1
        while left < right:
            total = nums[i] + nums[left] + nums[right]
            if total < 0:
                left += 1
            elif total > 0:
                right -= 1
            else:
                result.append([nums[i], nums[left], nums[right]])
                left += 1
                right -= 1
                while left < right and nums[left] == nums[left - 1]:
                    left += 1
    return result
`,
            javascript: `function threeSum(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length - 2; i++) {
    if (i > 0 && sorted[i] === sorted[i - 1]) continue;
    let left = i + 1;
    let right = sorted.length - 1;
    while (left < right) {
      const total = sorted[i] + sorted[left] + sorted[right];
      if (total < 0) left++;
      else if (total > 0) right--;
      else {
        result.push([sorted[i], sorted[left], sorted[right]]);
        left++;
        right--;
        while (left < right && sorted[left] === sorted[left - 1]) left++;
      }
    }
  }
  return result;
}
`,
          },
          time: 'O(n²)',
          space: 'O(1)',
          verdict: 'Sorting costs O(n log n), then each fixed number needs one O(n) sweep. The answer list itself is not counted in the extra space.',
        },
      ],
      dryRun: {
        title: 'Fix -1, then sweep',
        input: 'nums = [-1, 0, 1, 2, -1, -4]  → sorted: [-4, -1, -1, 0, 1, 2]',
        frames: [
          { caption: 'After sorting. First fix i = 0 (value -4). We need two numbers summing to 4.', vars: [['i', '0']], array: { cells: [-4, -1, -1, 0, 1, 2], pointers: { i: 0, left: 1, right: 5 } } },
          { caption: '-4 + -1 + 2 = -3 is too small, so move left up. Eventually no pair reaches 4, so no triple starts with -4.', vars: [['i', '0'], ['sum', '< 0']], array: { cells: [-4, -1, -1, 0, 1, 2], pointers: { i: 0, left: 4, right: 5 } } },
          { caption: 'Fix i = 1 (value -1). left = 2, right = 5: -1 + -1 + 2 = 0. A triple! Record [-1, -1, 2].', vars: [['i', '1'], ['sum', '0']], array: { cells: [-4, -1, -1, 0, 1, 2], pointers: { i: 1, left: 2, right: 5 }, marks: [1, 2, 5] }, extra: { label: 'result', items: ['[-1, -1, 2]'] } },
          { caption: 'Move both pointers: left = 3, right = 4. -1 + 0 + 1 = 0. Another triple: [-1, 0, 1].', vars: [['i', '1'], ['sum', '0']], array: { cells: [-4, -1, -1, 0, 1, 2], pointers: { i: 1, left: 3, right: 4 }, marks: [1, 3, 4] }, extra: { label: 'result', items: ['[-1, -1, 2]', '[-1, 0, 1]'] } },
          { caption: 'i = 2 is another -1, the same as before, so skip it. The remaining values cannot make 0. Done.', vars: [['i', '2']], array: { cells: [-4, -1, -1, 0, 1, 2], pointers: { i: 2 } }, extra: { label: 'result', items: ['[-1, -1, 2]', '[-1, 0, 1]'] } },
        ],
      },
      practice: {
        fn: { python: 'three_sum', javascript: 'threeSum' },
        starter: { python: `def three_sum(nums):\n    # your code here\n    pass\n`, javascript: `function threeSum(nums) {\n  // your code here\n}\n` },
        unordered: true,
        cases: [
          { label: 'the classic example', args: [[-1, 0, 1, 2, -1, -4]], expected: [[-1, -1, 2], [-1, 0, 1]] },
          { label: 'no triple adds up to 0', args: [[0, 1, 1]], expected: [] },
          { label: 'three zeros', args: [[0, 0, 0]], expected: [[0, 0, 0]] },
          { label: 'an empty list', args: [[]], expected: [] },
          { label: 'a pair of equal numbers', args: [[-2, 0, 1, 1, 2]], expected: [[-2, 0, 2], [-2, 1, 1]] },
          { label: 'many zeros give one unique triple', args: [[0, 0, 0, 0]], expected: [[0, 0, 0]] },
        ],
        hints: ['Sorting first makes duplicates easy to skip and lets you use two pointers.', 'Fix `nums[i]`, then move `left` and `right` towards each other looking for a sum of 0.', 'To avoid repeated triples, skip a value when it equals the one before it (for `i`, and for `left` after finding a triple).'],
      },
      mistakes: ['Returning duplicate triples.', 'Skipping duplicates **before** checking the first value (it can skip the first valid triple).', 'Not sorting each triple when you use the brute-force set approach.'],
      variants: ['Three sum **closest** to a target.', 'Four sum.', 'Count the number of triples instead of listing them.'],
      recap: 'Sort, fix one number, and use two pointers for the rest: this turns O(n³) into O(n²).',
    },
    {
      id: 'climbing-stairs',
      title: 'Climbing stairs',
      topic: 'Recursion to dynamic programming',
      blurb: 'Count the ways to climb a staircase, and watch slow recursion become a fast loop.',
      analogy: {
        emoji: '🪜',
        title: 'The last step you took',
        text: 'To stand on step n you must have come from step n - 1 (one step) or from step n - 2 (two steps). So the number of ways to reach step n is **the ways to reach n - 1 plus the ways to reach n - 2**. Each step builds on the two before it.',
      },
      problem: {
        statement: 'Write `climb_stairs(n)` that returns how many different ways you can climb `n` stairs if you can climb 1 or 2 stairs at a time.',
        examples: [
          { input: 'n = 2', output: '2', why: '1+1 or 2' },
          { input: 'n = 3', output: '3', why: '1+1+1, 1+2, 2+1' },
          { input: 'n = 5', output: '8' },
        ],
      },
      steps: [
        {
          title: 'Plain recursion',
          tag: 'slow',
          idea: 'Turn the idea straight into code: `ways(n) = ways(n - 1) + ways(n - 2)`, with `ways(1) = 1` and `ways(2) = 2`. It is correct, but it recomputes the same values again and again.',
          walk: ['If `n` is 1 or 2, return `n`.', 'Otherwise return `ways(n - 1) + ways(n - 2)`.'],
          code: {
            python: `def climb_stairs(n):
    if n <= 2:
        return n
    return climb_stairs(n - 1) + climb_stairs(n - 2)
`,
            javascript: `function climbStairs(n) {
  if (n <= 2) return n;
  return climbStairs(n - 1) + climbStairs(n - 2);
}
`,
          },
          time: 'O(2ⁿ)',
          space: 'O(n)',
          verdict: 'For n = 40 this takes about a billion calls, because `ways(3)` is calculated over and over.',
        },
        {
          title: 'Remember answers (memoization)',
          tag: 'better',
          idea: 'Store each answer the first time you compute it. Next time, look it up instead of recomputing. Every value from 1 to n is computed exactly once.',
          walk: ['Keep a dictionary `memo` of answers.', 'If `n` is in `memo`, return it.', 'Otherwise compute it from the two smaller answers, store it, and return it.'],
          code: {
            python: `def climb_stairs(n, memo=None):
    if memo is None:
        memo = {}
    if n <= 2:
        return n
    if n not in memo:
        memo[n] = climb_stairs(n - 1, memo) + climb_stairs(n - 2, memo)
    return memo[n]
`,
            javascript: `function climbStairs(n, memo = new Map()) {
  if (n <= 2) return n;
  if (!memo.has(n)) {
    memo.set(n, climbStairs(n - 1, memo) + climbStairs(n - 2, memo));
  }
  return memo.get(n);
}
`,
          },
          time: 'O(n)',
          space: 'O(n)',
          verdict: 'From exponential to linear with a few lines. Same recursion, just with a notebook.',
        },
        {
          title: 'Build up from the bottom with two variables',
          tag: 'best',
          idea: 'Each answer needs only the previous two. So start from the small answers and walk up to n, keeping just two numbers: the ways for n - 2 and for n - 1.',
          walk: ['`a` = ways(1) = 1 and `b` = ways(2) = 2.', 'For each step from 3 to n: the new value is `a + b`.', 'Shift: `a` becomes the old `b`, and `b` becomes the new value.', 'Return `b` (or n if n is 1 or 2).'],
          code: {
            python: `def climb_stairs(n):
    if n <= 2:
        return n
    a, b = 1, 2
    for _ in range(3, n + 1):
        a, b = b, a + b
    return b
`,
            javascript: `function climbStairs(n) {
  if (n <= 2) return n;
  let a = 1;
  let b = 2;
  for (let i = 3; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}
`,
          },
          time: 'O(n)',
          space: 'O(1)',
          verdict: 'Fast and tiny. This is **dynamic programming**: solve small cases first and build up.',
        },
      ],
      dryRun: {
        title: 'Build up the answers',
        input: 'n = 5',
        frames: [
          { caption: 'Known answers: 1 stair has 1 way, 2 stairs have 2 ways.', vars: [['a', '1'], ['b', '2']], extra: { label: 'ways', items: ['1 → 1', '2 → 2'] } },
          { caption: 'Stair 3 = 1 + 2 = 3. Shift: a = 2, b = 3.', vars: [['a', '2'], ['b', '3']], extra: { label: 'ways', items: ['1 → 1', '2 → 2', '3 → 3'] } },
          { caption: 'Stair 4 = 2 + 3 = 5. Shift: a = 3, b = 5.', vars: [['a', '3'], ['b', '5']], extra: { label: 'ways', items: ['1 → 1', '2 → 2', '3 → 3', '4 → 5'] } },
          { caption: 'Stair 5 = 3 + 5 = 8. Shift: a = 5, b = 8.', vars: [['a', '5'], ['b', '8']], extra: { label: 'ways', items: ['1 → 1', '2 → 2', '3 → 3', '4 → 5', '5 → 8'] } },
          { caption: 'We reached stair 5. Return b = 8.', vars: [['result', '8']], extra: { label: 'ways', items: ['1 → 1', '2 → 2', '3 → 3', '4 → 5', '5 → 8'] } },
        ],
      },
      practice: {
        fn: { python: 'climb_stairs', javascript: 'climbStairs' },
        starter: { python: `def climb_stairs(n):\n    # your code here\n    pass\n`, javascript: `function climbStairs(n) {\n  // your code here\n}\n` },
        cases: [
          { label: '1 stair', args: [1], expected: 1 },
          { label: '2 stairs', args: [2], expected: 2 },
          { label: '3 stairs', args: [3], expected: 3 },
          { label: '4 stairs', args: [4], expected: 5 },
          { label: '5 stairs', args: [5], expected: 8 },
          { label: '10 stairs', args: [10], expected: 89 },
          { label: '20 stairs (plain recursion is slow here)', args: [20], expected: 10946 },
        ],
        hints: ['To reach stair n you came from n - 1 or n - 2, so `ways(n) = ways(n - 1) + ways(n - 2)`.', 'Plain recursion repeats a lot of work. Store answers, or build up from small values.', 'Keep just two variables and update them in a loop from 3 up to n.'],
      },
      mistakes: ['Using plain recursion for large n (very slow).', 'Wrong base cases: ways(1) = 1 and ways(2) = 2.', 'Returning the wrong variable after the loop.'],
      variants: ['Allow steps of **1, 2 or 3** at a time.', 'Some stairs are **broken**: count the ways avoiding them.', 'Minimum cost climbing stairs (each stair has a cost).'],
      recap: 'When a problem is built from smaller copies of itself, remember the small answers (or build up from them) instead of recomputing.',
    },
    {
      id: 'merge-intervals',
      title: 'Merge intervals',
      topic: 'Sorting first',
      blurb: 'Combine overlapping ranges: sorting makes the problem a single pass.',
      analogy: {
        emoji: '📅',
        title: 'Combining overlapping meetings in a calendar',
        text: 'If you line the meetings up by **start time**, any meeting that overlaps the previous one must start before the previous one ends. Then you just stretch the previous block instead of adding a new one.',
      },
      problem: {
        statement: 'Write `merge_intervals(intervals)` that takes a list of `[start, end]` ranges and returns a list where all overlapping or touching ranges are merged, sorted by start.',
        examples: [
          { input: 'intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]', output: '[[1, 6], [8, 10], [15, 18]]' },
          { input: 'intervals = [[1, 4], [4, 5]]', output: '[[1, 5]]', why: 'touching ranges are merged' },
          { input: 'intervals = [[5, 6], [1, 2]]', output: '[[1, 2], [5, 6]]', why: 'the input is not sorted' },
        ],
      },
      steps: [
        {
          title: 'Keep merging until nothing overlaps',
          tag: 'slow',
          idea: 'Look for any two ranges that overlap. Merge them into one. Repeat until no pair overlaps. It works but keeps rescanning.',
          walk: ['Repeat while something changed.', 'Compare every pair; if two overlap, replace them with their union.', 'When no pair overlaps, sort the ranges and return them.'],
          code: {
            python: `def merge_intervals(intervals):
    items = [list(x) for x in intervals]
    changed = True
    while changed:
        changed = False
        for i in range(len(items)):
            for j in range(i + 1, len(items)):
                a, b = items[i], items[j]
                if a[0] <= b[1] and b[0] <= a[1]:
                    items[i] = [min(a[0], b[0]), max(a[1], b[1])]
                    items.pop(j)
                    changed = True
                    break
            if changed:
                break
    return sorted(items)
`,
            javascript: `function mergeIntervals(intervals) {
  const items = intervals.map((x) => [...x]);
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < items.length && !changed; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        if (a[0] <= b[1] && b[0] <= a[1]) {
          items[i] = [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
          items.splice(j, 1);
          changed = true;
          break;
        }
      }
    }
  }
  return items.sort((x, y) => x[0] - y[0]);
}
`,
          },
          time: 'O(n³)',
          space: 'O(n)',
          verdict: 'Correct but slow: every merge restarts the scan.',
        },
        {
          title: 'Sort by start, then merge in one pass',
          tag: 'best',
          idea: 'Sort the ranges by their start. Take the first one as the current block. For each next range: if it starts at or before the current block ends, stretch the end. Otherwise the current block is finished, so save it and start a new block.',
          walk: ['If the list is empty, return `[]`.', 'Sort by start. Put the first range in `merged`.', 'For each next range: if `start <= merged[-1][1]`, set the last end to the larger end.', 'Otherwise append the range as a new block. Return `merged`.'],
          code: {
            python: `def merge_intervals(intervals):
    if not intervals:
        return []
    merged = []
    for start, end in sorted(intervals):
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged
`,
            javascript: `function mergeIntervals(intervals) {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged = [[sorted[0][0], sorted[0][1]]];
  for (let i = 1; i < sorted.length; i++) {
    const [start, end] = sorted[i];
    const last = merged[merged.length - 1];
    if (start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}
`,
          },
          time: 'O(n log n)',
          space: 'O(n)',
          verdict: 'Sorting dominates; the merge itself is one pass. "Sort first" simplifies many interval problems.',
        },
      ],
      dryRun: {
        title: 'Stretch or start a new block',
        input: 'intervals = [[8, 10], [1, 3], [2, 6]]  → sorted: [[1, 3], [2, 6], [8, 10]]',
        frames: [
          { caption: 'After sorting by start. The first range [1, 3] becomes the first block.', extra: { label: 'merged', items: ['[1, 3]'] } },
          { caption: 'Next is [2, 6]. It starts at 2, which is before the block ends (3), so they overlap. Stretch the end to max(3, 6) = 6.', vars: [['start', '2'], ['end', '6']], extra: { label: 'merged', items: ['[1, 6]'] } },
          { caption: 'Next is [8, 10]. It starts at 8, after the block ends (6). No overlap: start a new block.', vars: [['start', '8'], ['end', '10']], extra: { label: 'merged', items: ['[1, 6]', '[8, 10]'] } },
          { caption: 'No ranges left. The result is [[1, 6], [8, 10]].', extra: { label: 'merged', items: ['[1, 6]', '[8, 10]'] } },
        ],
      },
      practice: {
        fn: { python: 'merge_intervals', javascript: 'mergeIntervals' },
        starter: { python: `def merge_intervals(intervals):\n    # your code here\n    pass\n`, javascript: `function mergeIntervals(intervals) {\n  // your code here\n}\n` },
        cases: [
          { label: 'the classic example', args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] },
          { label: 'touching ranges are merged', args: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
          { label: 'an empty list', args: [[]], expected: [] },
          { label: 'the input is not sorted', args: [[[5, 6], [1, 2]]], expected: [[1, 2], [5, 6]] },
          { label: 'one range inside another', args: [[[1, 4], [2, 3]]], expected: [[1, 4]] },
          { label: 'a later range starts earlier', args: [[[1, 4], [0, 4]]], expected: [[0, 4]] },
          { label: 'one range joins three', args: [[[1, 10], [2, 3], [4, 5], [9, 12]]], expected: [[1, 12]] },
        ],
        hints: ['Sort the ranges by their start first.', 'Keep a list of merged blocks. Compare each range with the **last** block.', 'If `start <= last end`, set the last end to `max(last end, end)`; otherwise start a new block.'],
      },
      mistakes: ['Not sorting first.', 'Setting the last end to `end` instead of `max(last end, end)` (breaks when a range is inside another).', 'Using `<` instead of `<=` when touching ranges should merge.'],
      variants: ['**Insert** a new interval into a sorted list and merge.', 'Count the minimum number of **meeting rooms** needed.', 'Find the **gaps** between merged intervals.'],
      recap: 'Sorting by start turns a tangle of overlaps into a single left-to-right pass.',
    },
    {
      id: 'number-of-islands',
      title: 'Number of islands',
      topic: 'Graph search (DFS and BFS)',
      blurb: 'Count the islands on a grid map by exploring each one and marking it as visited.',
      analogy: {
        emoji: '🏝️',
        title: 'Exploring islands by boat',
        text: 'You sail over a map. The first time you find land, you have discovered a **new island**. You walk across all of its connected land and plant a flag on every square so you never count it again. Then you keep sailing for more unflagged land.',
      },
      problem: {
        statement: 'Write `num_islands(grid)` where `grid` is a list of strings made of `"1"` (land) and `"0"` (water). Return the number of islands. An island is a group of land squares connected up, down, left or right.',
        examples: [
          { input: 'grid = ["11000", "11000", "00100", "00011"]', output: '3' },
          { input: 'grid = ["111", "010", "111"]', output: '1', why: 'the land is all connected through the middle' },
          { input: 'grid = []', output: '0' },
        ],
      },
      steps: [
        {
          title: 'Depth-first search (DFS)',
          tag: 'idea',
          idea: 'Scan every square. When you find unvisited land, count one island and **flood-fill** it: visit the square, then recursively visit its four neighbours that are land and not yet visited. A set of visited squares prevents going in circles.',
          walk: ['Keep a `visited` set of (row, column).', 'For every square: if it is land and not visited, add 1 to the count and call `explore` on it.', '`explore(r, c)`: stop if outside the grid, water, or visited. Otherwise mark visited and explore the 4 neighbours.'],
          code: {
            python: `def num_islands(grid):
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    visited = set()

    def explore(r, c):
        if r < 0 or c < 0 or r >= rows or c >= cols:
            return
        if grid[r][c] != "1" or (r, c) in visited:
            return
        visited.add((r, c))
        explore(r + 1, c)
        explore(r - 1, c)
        explore(r, c + 1)
        explore(r, c - 1)

    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1" and (r, c) not in visited:
                count += 1
                explore(r, c)
    return count
`,
            javascript: `function numIslands(grid) {
  const rows = grid.length;
  const cols = rows ? grid[0].length : 0;
  const visited = new Set();

  function explore(r, c) {
    if (r < 0 || c < 0 || r >= rows || c >= cols) return;
    if (grid[r][c] !== "1" || visited.has(r + "," + c)) return;
    visited.add(r + "," + c);
    explore(r + 1, c);
    explore(r - 1, c);
    explore(r, c + 1);
    explore(r, c - 1);
  }

  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === "1" && !visited.has(r + "," + c)) {
        count++;
        explore(r, c);
      }
    }
  }
  return count;
}
`,
          },
          time: 'O(rows × cols)',
          space: 'O(rows × cols)',
          verdict: 'Every square is visited at most once. Very deep recursion can overflow on huge grids, so there is also a version with a queue.',
        },
        {
          title: 'Breadth-first search (BFS) with a queue',
          tag: 'best',
          idea: 'Same idea, but instead of recursion use a **queue**: put the first land square in, then repeatedly take one out and add its unvisited land neighbours. It explores the island in rings and never overflows the call stack.',
          walk: ['For each unvisited land square, add one island and put the square in a queue (mark it visited immediately).', 'While the queue is not empty: take a square out and look at its 4 neighbours.', 'Each neighbour that is inside the grid, land and unvisited is marked visited and added to the queue.'],
          code: {
            python: `from collections import deque


def num_islands(grid):
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    visited = set()
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != "1" or (r, c) in visited:
                continue
            count += 1
            visited.add((r, c))
            queue = deque([(r, c)])
            while queue:
                cr, cc = queue.popleft()
                for nr, nc in ((cr + 1, cc), (cr - 1, cc), (cr, cc + 1), (cr, cc - 1)):
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1" and (nr, nc) not in visited:
                        visited.add((nr, nc))
                        queue.append((nr, nc))
    return count
`,
            javascript: `function numIslands(grid) {
  const rows = grid.length;
  const cols = rows ? grid[0].length : 0;
  const visited = new Set();
  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== "1" || visited.has(r + "," + c)) continue;
      count++;
      visited.add(r + "," + c);
      const queue = [[r, c]];
      for (let head = 0; head < queue.length; head++) {
        const [cr, cc] = queue[head];
        for (const [nr, nc] of [[cr + 1, cc], [cr - 1, cc], [cr, cc + 1], [cr, cc - 1]]) {
          if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && grid[nr][nc] === "1" && !visited.has(nr + "," + nc)) {
            visited.add(nr + "," + nc);
            queue.push([nr, nc]);
          }
        }
      }
    }
  }
  return count;
}
`,
          },
          time: 'O(rows × cols)',
          space: 'O(rows × cols)',
          verdict: 'Same speed as DFS, with no recursion limit. Know both: DFS goes deep first, BFS goes wide first.',
        },
      ],
      dryRun: {
        title: 'Flood one island at a time',
        input: 'grid = ["110", "100", "001"]',
        frames: [
          { caption: 'Square (0,0) is land and not visited: island 1 found! Flood-fill it: (0,0), then its neighbours (0,1) and (1,0).', vars: [['count', '1']], array: { label: 'row 0', cells: ['1', '1', '0'], marks: [0, 1] }, extra: { label: 'visited', items: ['(0,0)', '(0,1)', '(1,0)'] } },
          { caption: 'The flood stops at water and the edges. This island has 3 squares, all now flagged as visited.', vars: [['count', '1']], extra: { label: 'visited', items: ['(0,0)', '(0,1)', '(1,0)'] } },
          { caption: 'Keep scanning. (0,1) and (1,0) are already visited, so they are not counted again. (1,1) and (1,2) are water.', vars: [['count', '1']], extra: { label: 'visited', items: ['(0,0)', '(0,1)', '(1,0)'] } },
          { caption: 'Square (2,2) is land and not visited: island 2 found! It has no land neighbours, so it is just one square.', vars: [['count', '2']], extra: { label: 'visited', items: ['(0,0)', '(0,1)', '(1,0)', '(2,2)'] } },
          { caption: 'The scan is complete. There are 2 islands.', vars: [['result', '2']], extra: { label: 'visited', items: ['(0,0)', '(0,1)', '(1,0)', '(2,2)'] } },
        ],
      },
      practice: {
        fn: { python: 'num_islands', javascript: 'numIslands' },
        starter: { python: `def num_islands(grid):\n    # your code here\n    pass\n`, javascript: `function numIslands(grid) {\n  // your code here\n}\n` },
        cases: [
          { label: 'three islands', args: [['11000', '11000', '00100', '00011']], expected: 3 },
          { label: 'one island joined in the middle', args: [['111', '010', '111']], expected: 1 },
          { label: 'an empty grid', args: [[]], expected: 0 },
          { label: 'no land at all', args: [['000', '000']], expected: 0 },
          { label: 'diagonal squares are not connected', args: [['10', '01']], expected: 2 },
          { label: 'one square', args: [['1']], expected: 1 },
          { label: 'a snake-shaped island', args: [['1110', '0010', '0111']], expected: 1 },
        ],
        hints: ['When you find unvisited land, you have found a whole new island. Count it once.', 'Then mark **every connected land square** as visited (DFS or BFS) so you never count them again.', 'Check the grid edges before reading a neighbour, and only move up, down, left and right (not diagonally).'],
      },
      mistakes: ['Counting every land square instead of every island.', 'Forgetting to mark squares as visited (infinite loops or double counting).', 'Going out of bounds when checking neighbours.'],
      variants: ['Return the **size of the largest** island.', 'Count islands where **diagonals** also connect.', 'Find the number of **distinct island shapes**.'],
      recap: 'To count connected groups, start a search at each unvisited cell and mark everything it reaches.',
    },
    {
      id: 'subsets',
      title: 'All subsets',
      topic: 'Backtracking',
      blurb: 'Generate every possible subset of a list by choosing to include or skip each item.',
      analogy: {
        emoji: '🧳',
        title: 'Packing a suitcase',
        text: 'For each item you can either **pack it or leave it**. Two choices per item means 2 × 2 × 2 … possible suitcases. Backtracking walks through all those choices: pack the item and continue, then unpack it and try leaving it behind.',
      },
      problem: {
        statement: 'Write `subsets(nums)` that returns every possible subset of the list (including the empty one). Each subset keeps the numbers in their original order. The order of the subsets does not matter.',
        examples: [
          { input: 'nums = [1, 2]', output: '[[], [1], [2], [1, 2]]' },
          { input: 'nums = [1]', output: '[[], [1]]' },
          { input: 'nums = []', output: '[[]]', why: 'the empty list has one subset: the empty one' },
        ],
      },
      steps: [
        {
          title: 'Double the list with each number',
          tag: 'idea',
          idea: 'Start with just the empty subset. For each number, make a copy of every existing subset with that number added, and add those copies to the list. After n numbers you have 2ⁿ subsets.',
          walk: ['Start with `result = [[]]`.', 'For each number `n`: for every subset already in `result`, create a new subset that is that one plus `n`.', 'Add all the new subsets to `result`.', 'Return `result`.'],
          code: {
            python: `def subsets(nums):
    result = [[]]
    for n in nums:
        result += [subset + [n] for subset in result]
    return result
`,
            javascript: `function subsets(nums) {
  let result = [[]];
  for (const n of nums) {
    result = [...result, ...result.map((subset) => [...subset, n])];
  }
  return result;
}
`,
          },
          time: 'O(n × 2ⁿ)',
          space: 'O(n × 2ⁿ)',
          verdict: 'Short and correct. The output itself has 2ⁿ subsets, so no solution can be faster than that.',
        },
        {
          title: 'Backtracking: choose, explore, un-choose',
          tag: 'best',
          idea: 'Walk through the numbers one by one. At each number make a choice: **include it** (add it to the current subset, then continue) or **skip it**. When you reach the end, the current subset is complete. After exploring "include", remove the number again (**backtrack**) so you can explore "skip".',
          walk: ['`current` is the subset being built; `result` collects finished ones.', '`go(i)`: if `i` is past the end, save a copy of `current` and return.', 'Include: push `nums[i]`, call `go(i + 1)`, then pop it again.', 'Skip: call `go(i + 1)` without it.'],
          code: {
            python: `def subsets(nums):
    result = []
    current = []

    def go(i):
        if i == len(nums):
            result.append(list(current))
            return
        current.append(nums[i])
        go(i + 1)
        current.pop()
        go(i + 1)

    go(0)
    return result
`,
            javascript: `function subsets(nums) {
  const result = [];
  const current = [];

  function go(i) {
    if (i === nums.length) {
      result.push([...current]);
      return;
    }
    current.push(nums[i]);
    go(i + 1);
    current.pop();
    go(i + 1);
  }

  go(0);
  return result;
}
`,
          },
          time: 'O(n × 2ⁿ)',
          space: 'O(n) extra',
          verdict: 'The choose, explore, un-choose pattern solves permutations, combinations, N-Queens and sudoku too.',
        },
      ],
      dryRun: {
        title: 'The decision tree for [1, 2]',
        input: 'nums = [1, 2]',
        frames: [
          { caption: 'At number 1 we decide: include it first. current = [1].', vars: [['i', '0'], ['current', '[1]']], array: { cells: [1, 2], pointers: { i: 0 }, marks: [0] }, extra: { label: 'result', items: [] } },
          { caption: 'At number 2: include it. current = [1, 2]. We are past the end, so save [1, 2].', vars: [['i', '2'], ['current', '[1, 2]']], array: { cells: [1, 2], marks: [0, 1] }, extra: { label: 'result', items: ['[1, 2]'] } },
          { caption: 'Backtrack: remove 2, then skip it. current = [1]. Past the end again: save [1].', vars: [['i', '2'], ['current', '[1]']], array: { cells: [1, 2], marks: [0] }, extra: { label: 'result', items: ['[1, 2]', '[1]'] } },
          { caption: 'Backtrack to the first decision: remove 1 and skip it. current = []. Now include 2: current = [2]. Save [2].', vars: [['i', '2'], ['current', '[2]']], array: { cells: [1, 2], marks: [1] }, extra: { label: 'result', items: ['[1, 2]', '[1]', '[2]'] } },
          { caption: 'Remove 2 and skip it too. current = []. Save []. All 4 subsets found.', vars: [['i', '2'], ['current', '[]']], array: { cells: [1, 2] }, extra: { label: 'result', items: ['[1, 2]', '[1]', '[2]', '[]'] } },
        ],
      },
      practice: {
        fn: { python: 'subsets', javascript: 'subsets' },
        starter: { python: `def subsets(nums):\n    # your code here\n    pass\n`, javascript: `function subsets(nums) {\n  // your code here\n}\n` },
        unordered: true,
        cases: [
          { label: 'two numbers', args: [[1, 2]], expected: [[], [1], [2], [1, 2]] },
          { label: 'one number', args: [[1]], expected: [[], [1]] },
          { label: 'an empty list has one subset', args: [[]], expected: [[]] },
          { label: 'three numbers give 8 subsets', args: [[1, 2, 3]], expected: [[], [1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]] },
          { label: 'numbers keep their original order', args: [[3, 1]], expected: [[], [3], [1], [3, 1]] },
        ],
        hints: ['A list of n numbers has 2ⁿ subsets: each number is either in or out.', 'Simple way: start with `[[]]` and, for each number, add a copy of every existing subset with that number appended.', 'Backtracking way: include the number, recurse, remove it, recurse again. Save a **copy** of the current subset at the end.'],
      },
      mistakes: ['Saving `current` itself instead of a copy (all results end up identical).', 'Forgetting to remove the number again after exploring the "include" branch.', 'Forgetting the empty subset.'],
      variants: ['Subsets of a list **with duplicates** (no repeated subsets).', 'All **permutations** of a list.', 'All **combinations** of k numbers.'],
      recap: 'Backtracking explores every choice, then undoes it, so one shared list can build all the answers.',
    },
  ],
}
