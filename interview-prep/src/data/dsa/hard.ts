import type { DsaModule } from './types'

export const hard: DsaModule = {
  id: 'hard',
  title: 'Hard problems',
  level: 'Hard',
  blurb: 'Two-pointer tricks, dynamic programming tables, graph ordering and backtracking with pruning. Each one builds on the earlier lessons.',
  color: '#dc2626',
  lessons: [
    {
      id: 'trapping-rain-water',
      title: 'Trapping rain water',
      topic: 'Two pointers, precomputation',
      blurb: 'Work out how much rain a bumpy skyline can hold, from per-bar maths to a two-pointer sweep.',
      analogy: {
        emoji: '🌧️',
        title: 'Rain between buildings',
        text: 'Water on top of a bar can rise only as high as the **shorter of the tallest wall on its left and the tallest wall on its right**. Anything higher would spill over the lower wall. So each bar holds water equal to that level minus its own height.',
      },
      problem: {
        statement: 'Write `trap(heights)` where each number is the height of a bar of width 1. Return how many units of rain water are trapped between the bars after it rains.',
        examples: [
          { input: 'heights = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]', output: '6' },
          { input: 'heights = [3, 0, 3]', output: '3', why: 'the gap holds 3 units' },
          { input: 'heights = [1, 2, 3]', output: '0', why: 'water runs off the lower side' },
        ],
      },
      steps: [
        {
          title: 'Look left and right for every bar',
          tag: 'slow',
          idea: 'For each bar, find the tallest bar to its left and the tallest to its right (scanning each time). The water above this bar is `min(left, right) - height`, never below zero. Add them all up.',
          walk: ['For each bar `i`.', 'Scan the left side and the bar itself for the tallest (`left_max`).', 'Scan the right side and the bar itself for the tallest (`right_max`).', 'Add `min(left_max, right_max) - heights[i]` to the total.'],
          code: {
            python: `def trap(heights):
    total = 0
    for i in range(len(heights)):
        left_max = max(heights[: i + 1])
        right_max = max(heights[i:])
        total += min(left_max, right_max) - heights[i]
    return total
`,
            javascript: `function trap(heights) {
  let total = 0;
  for (let i = 0; i < heights.length; i++) {
    const leftMax = Math.max(...heights.slice(0, i + 1));
    const rightMax = Math.max(...heights.slice(i));
    total += Math.min(leftMax, rightMax) - heights[i];
  }
  return total;
}
`,
          },
          time: 'O(n²)',
          space: 'O(n)',
          verdict: 'Correct and easy to understand, but it rescans the list for every bar.',
        },
        {
          title: 'Precompute the walls',
          tag: 'better',
          idea: 'The "tallest to the left" values can be built in one pass from the left, and the "tallest to the right" values in one pass from the right. Store them in two arrays and then do a single sum.',
          walk: ['`left[i]` = the tallest bar from the start up to `i` (built left to right).', '`right[i]` = the tallest bar from `i` to the end (built right to left).', 'Sum `min(left[i], right[i]) - heights[i]` over all bars.'],
          code: {
            python: `def trap(heights):
    n = len(heights)
    if n == 0:
        return 0
    left = [0] * n
    right = [0] * n
    left[0] = heights[0]
    for i in range(1, n):
        left[i] = max(left[i - 1], heights[i])
    right[n - 1] = heights[n - 1]
    for i in range(n - 2, -1, -1):
        right[i] = max(right[i + 1], heights[i])
    return sum(min(left[i], right[i]) - heights[i] for i in range(n))
`,
            javascript: `function trap(heights) {
  const n = heights.length;
  if (n === 0) return 0;
  const left = new Array(n).fill(0);
  const right = new Array(n).fill(0);
  left[0] = heights[0];
  for (let i = 1; i < n; i++) left[i] = Math.max(left[i - 1], heights[i]);
  right[n - 1] = heights[n - 1];
  for (let i = n - 2; i >= 0; i--) right[i] = Math.max(right[i + 1], heights[i]);
  let total = 0;
  for (let i = 0; i < n; i++) total += Math.min(left[i], right[i]) - heights[i];
  return total;
}
`,
          },
          time: 'O(n)',
          space: 'O(n)',
          verdict: 'Linear time. It uses two extra arrays of the same size.',
        },
        {
          title: 'Two pointers: only the smaller side matters',
          tag: 'best',
          idea: 'Keep a pointer at each end and the tallest wall seen from each side. The water level at the **lower** side is decided by its own side\'s tallest wall, because the other side is at least as tall. So always move the pointer on the lower side inwards, adding water as you go.',
          walk: ['`left = 0`, `right = n - 1`, `left_max = right_max = 0`.', 'While `left < right`: if `heights[left] < heights[right]`, work on the left side, otherwise the right.', 'On a side: if the bar is taller than that side\'s max, update the max; otherwise add `max - bar` to the total.', 'Move that pointer inwards. Return the total.'],
          code: {
            python: `def trap(heights):
    left, right = 0, len(heights) - 1
    left_max = right_max = 0
    total = 0
    while left < right:
        if heights[left] < heights[right]:
            if heights[left] >= left_max:
                left_max = heights[left]
            else:
                total += left_max - heights[left]
            left += 1
        else:
            if heights[right] >= right_max:
                right_max = heights[right]
            else:
                total += right_max - heights[right]
            right -= 1
    return total
`,
            javascript: `function trap(heights) {
  let left = 0;
  let right = heights.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let total = 0;
  while (left < right) {
    if (heights[left] < heights[right]) {
      if (heights[left] >= leftMax) leftMax = heights[left];
      else total += leftMax - heights[left];
      left++;
    } else {
      if (heights[right] >= rightMax) rightMax = heights[right];
      else total += rightMax - heights[right];
      right--;
    }
  }
  return total;
}
`,
          },
          time: 'O(n)',
          space: 'O(1)',
          verdict: 'The optimal answer: one pass and no extra arrays.',
        },
      ],
      dryRun: {
        title: 'Two pointers sweep inwards',
        input: 'heights = [3, 0, 2, 0, 4]',
        frames: [
          { caption: 'left = 0 (height 3), right = 4 (height 4). The left side is lower, so handle the left. 3 becomes the left wall.', vars: [['left_max', '3'], ['total', '0']], array: { cells: [3, 0, 2, 0, 4], pointers: { left: 0, right: 4 } } },
          { caption: 'left = 1 (height 0) is lower than the right wall 4. It is below left_max 3, so it holds 3 - 0 = 3 units.', vars: [['left_max', '3'], ['total', '3']], array: { cells: [3, 0, 2, 0, 4], pointers: { left: 1, right: 4 }, marks: [1] } },
          { caption: 'left = 2 (height 2): holds 3 - 2 = 1 unit. total = 4.', vars: [['left_max', '3'], ['total', '4']], array: { cells: [3, 0, 2, 0, 4], pointers: { left: 2, right: 4 }, marks: [1, 2] } },
          { caption: 'left = 3 (height 0): holds 3 - 0 = 3 units. total = 7.', vars: [['left_max', '3'], ['total', '7']], array: { cells: [3, 0, 2, 0, 4], pointers: { left: 3, right: 4 }, marks: [1, 2, 3] } },
          { caption: 'The pointers meet. The rain water trapped is 7 units.', vars: [['result', '7']], array: { cells: [3, 0, 2, 0, 4], marks: [1, 2, 3] } },
        ],
      },
      practice: {
        fn: { python: 'trap', javascript: 'trap' },
        starter: { python: `def trap(heights):\n    # your code here\n    pass\n`, javascript: `function trap(heights) {\n  // your code here\n}\n` },
        cases: [
          { label: 'the classic skyline', args: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], expected: 6 },
          { label: 'a valley between two tall bars', args: [[3, 0, 3]], expected: 3 },
          { label: 'rising bars hold nothing', args: [[1, 2, 3]], expected: 0 },
          { label: 'an empty list', args: [[]], expected: 0 },
          { label: 'one bar', args: [[1]], expected: 0 },
          { label: 'uneven walls', args: [[4, 2, 0, 3, 2, 5]], expected: 9 },
          { label: 'a flat surface', args: [[2, 2, 2]], expected: 0 },
        ],
        hints: ['For one bar, the water above it is `min(tallest on the left, tallest on the right) - its height`.', 'Precompute the tallest-so-far from the left and from the right in two passes.', 'To use O(1) memory: two pointers; always move the pointer on the lower side, since that side\'s own max decides the water level.'],
      },
      mistakes: ['Counting water that would spill off the ends.', 'Using `max(left, right)` instead of `min`.', 'Moving the pointer on the taller side in the two-pointer version.'],
      variants: ['**Container with most water** (two pointers, similar idea).', 'Trapping rain water on a **2D grid** (needs a heap).', 'Return the water level above each bar as a list.'],
      recap: 'A bar\'s water depends on the lower of its two bounding walls, and two pointers can track that without extra arrays.',
    },
    {
      id: 'coin-change',
      title: 'Coin change',
      topic: 'Dynamic programming',
      blurb: 'Find the fewest coins that make an amount, growing from slow recursion to a bottom-up table.',
      analogy: {
        emoji: '🪙',
        title: 'Paying with the fewest coins',
        text: 'To pay 11 with coins of 1, 2 and 5, you must use **one last coin**. If it is a 5, the rest is 6, and you want the fewest coins for 6. The best answer for 11 is built from the best answers for **smaller amounts**. Solve the small amounts first and reuse them.',
      },
      problem: {
        statement: 'Write `coin_change(coins, amount)` that returns the **fewest coins** needed to make `amount`, using unlimited coins of each value. Return `-1` if it is impossible. An amount of 0 needs 0 coins.',
        examples: [
          { input: 'coins = [1, 2, 5], amount = 11', output: '3', why: '5 + 5 + 1' },
          { input: 'coins = [2], amount = 3', output: '-1', why: 'cannot make an odd amount from 2s' },
          { input: 'coins = [1], amount = 0', output: '0' },
        ],
      },
      steps: [
        {
          title: 'Try every coin recursively',
          tag: 'slow',
          idea: 'To make `amount`, try each coin as the last one. The cost is 1 plus the cost of the remaining amount. Take the cheapest choice. It is correct but explores the same amounts again and again.',
          walk: ['If the amount is 0, no coins are needed.', 'For each coin that fits (not bigger than the amount), compute `1 + fewest(amount - coin)`.', 'Return the smallest result, or "impossible" if no coin works.'],
          code: {
            python: `def coin_change(coins, amount):
    INF = float("inf")

    def fewest(rest):
        if rest == 0:
            return 0
        best = INF
        for coin in coins:
            if coin <= rest:
                best = min(best, 1 + fewest(rest - coin))
        return best

    result = fewest(amount)
    return -1 if result == INF else result
`,
            javascript: `function coinChange(coins, amount) {
  function fewest(rest) {
    if (rest === 0) return 0;
    let best = Infinity;
    for (const coin of coins) {
      if (coin <= rest) best = Math.min(best, 1 + fewest(rest - coin));
    }
    return best;
  }
  const result = fewest(amount);
  return result === Infinity ? -1 : result;
}
`,
          },
          time: 'O(coins^amount)',
          space: 'O(amount)',
          verdict: 'Exponential: even an amount of 40 would take far too long.',
        },
        {
          title: 'Remember each amount (memoization)',
          tag: 'better',
          idea: 'The answer for a given remaining amount never changes, so store it the first time. Each amount from 1 to `amount` is then computed once, trying every coin.',
          walk: ['Keep a `memo` of remaining amount → fewest coins.', 'Before computing, check the memo.', 'After computing, store the result and return it.'],
          code: {
            python: `def coin_change(coins, amount):
    INF = float("inf")
    memo = {}

    def fewest(rest):
        if rest == 0:
            return 0
        if rest in memo:
            return memo[rest]
        best = INF
        for coin in coins:
            if coin <= rest:
                best = min(best, 1 + fewest(rest - coin))
        memo[rest] = best
        return best

    result = fewest(amount)
    return -1 if result == INF else result
`,
            javascript: `function coinChange(coins, amount) {
  const memo = new Map();
  function fewest(rest) {
    if (rest === 0) return 0;
    if (memo.has(rest)) return memo.get(rest);
    let best = Infinity;
    for (const coin of coins) {
      if (coin <= rest) best = Math.min(best, 1 + fewest(rest - coin));
    }
    memo.set(rest, best);
    return best;
  }
  const result = fewest(amount);
  return result === Infinity ? -1 : result;
}
`,
          },
          time: 'O(amount × coins)',
          space: 'O(amount)',
          verdict: 'Fast. Deep recursion for large amounts can hit the call-stack limit, so the next version uses a loop.',
        },
        {
          title: 'Bottom-up table',
          tag: 'best',
          idea: 'Build a table `dp[a]` = fewest coins for amount `a`, from 0 up to `amount`. `dp[0] = 0`. For each amount, try each coin: `dp[a] = min(dp[a - coin] + 1)`. No recursion needed.',
          walk: ['Create `dp` of size amount + 1, filled with "impossible", and `dp[0] = 0`.', 'For each amount `a` from 1 to `amount`:', 'For each coin that fits, update `dp[a] = min(dp[a], dp[a - coin] + 1)`.', 'Return `dp[amount]`, or -1 if it is still "impossible".'],
          code: {
            python: `def coin_change(coins, amount):
    INF = float("inf")
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for coin in coins:
            if coin <= a and dp[a - coin] + 1 < dp[a]:
                dp[a] = dp[a - coin] + 1
    return -1 if dp[amount] == INF else dp[amount]
`,
            javascript: `function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const coin of coins) {
      if (coin <= a && dp[a - coin] + 1 < dp[a]) dp[a] = dp[a - coin] + 1;
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
`,
          },
          time: 'O(amount × coins)',
          space: 'O(amount)',
          verdict: 'The standard dynamic programming answer: a table filled from small to large.',
        },
      ],
      dryRun: {
        title: 'Fill the table for coins [1, 2, 5]',
        input: 'coins = [1, 2, 5], amount = 6',
        frames: [
          { caption: 'dp[0] = 0 (no coins for amount 0). Everything else starts as "impossible".', array: { label: 'dp (index = amount)', cells: [0, '∞', '∞', '∞', '∞', '∞', '∞'] } },
          { caption: 'Amount 1: coin 1 → dp[0] + 1 = 1. Amount 2: coin 2 → dp[0] + 1 = 1.', array: { label: 'dp (index = amount)', cells: [0, 1, 1, '∞', '∞', '∞', '∞'], marks: [1, 2] } },
          { caption: 'Amount 3: coin 1 → dp[2] + 1 = 2, coin 2 → dp[1] + 1 = 2. Best 2. Amount 4: coin 2 → dp[2] + 1 = 2.', array: { label: 'dp (index = amount)', cells: [0, 1, 1, 2, 2, '∞', '∞'], marks: [3, 4] } },
          { caption: 'Amount 5: coin 5 → dp[0] + 1 = 1. One coin!', array: { label: 'dp (index = amount)', cells: [0, 1, 1, 2, 2, 1, '∞'], marks: [5] } },
          { caption: 'Amount 6: coin 1 → dp[5] + 1 = 2 (a 5 and a 1). Others are not better. dp[6] = 2.', array: { label: 'dp (index = amount)', cells: [0, 1, 1, 2, 2, 1, 2], marks: [6] }, vars: [['result', '2']] },
        ],
      },
      practice: {
        fn: { python: 'coin_change', javascript: 'coinChange' },
        starter: { python: `def coin_change(coins, amount):\n    # your code here\n    pass\n`, javascript: `function coinChange(coins, amount) {\n  // your code here\n}\n` },
        cases: [
          { label: '[1, 2, 5] makes 11 with 3 coins', args: [[1, 2, 5], 11], expected: 3 },
          { label: 'impossible gives -1', args: [[2], 3], expected: -1 },
          { label: 'an amount of 0 needs 0 coins', args: [[1], 0], expected: 0 },
          { label: 'one coin value', args: [[1], 2], expected: 2 },
          { label: 'greedy would fail here ([1, 3, 4] for 6)', args: [[1, 3, 4], 6], expected: 2 },
          { label: 'an exact coin', args: [[5, 10], 10], expected: 1 },
          { label: 'no coins fit', args: [[5, 10], 3], expected: -1 },
        ],
        hints: ['The fewest coins for amount `a` is 1 + the fewest for `a - coin`, for the best coin.', 'Greedy (always take the biggest coin) is not always right: try [1, 3, 4] for 6.', 'Build a table `dp` from 0 to the amount; use infinity for "impossible" and check it at the end.'],
      },
      mistakes: ['Using a greedy approach (largest coin first).', 'Using 0 as "impossible" in the table, which looks like a valid answer.', 'Returning `dp[amount]` without turning "impossible" into -1.'],
      variants: ['Count **how many ways** to make the amount (a different recurrence).', 'Each coin can be used **only once**.', 'Return the actual **list of coins** used.'],
      recap: 'If the best answer for a size is built from best answers for smaller sizes, fill a table from small to large.',
    },
    {
      id: 'longest-common-subsequence',
      title: 'Longest common subsequence',
      topic: 'Dynamic programming on two strings',
      blurb: 'Find the longest sequence of letters that appears in order in two strings, using a 2D table.',
      analogy: {
        emoji: '🧬',
        title: 'Comparing two DNA strands',
        text: 'A subsequence keeps letters **in order but allows gaps**. To compare two strands, look at their last letters. If they match, that letter is part of the answer and you continue with both strands shortened. If not, drop the last letter of one strand or the other and keep the better result.',
      },
      problem: {
        statement: 'Write `lcs(a, b)` that returns the **length** of the longest common subsequence of the strings `a` and `b` (letters in the same order in both, but not necessarily next to each other).',
        examples: [
          { input: 'a = "abcde", b = "ace"', output: '3', why: '"ace"' },
          { input: 'a = "abc", b = "def"', output: '0' },
          { input: 'a = "AGGTAB", b = "GXTXAYB"', output: '4', why: '"GTAB"' },
        ],
      },
      steps: [
        {
          title: 'Plain recursion',
          tag: 'slow',
          idea: 'Compare the first letters of the remaining parts. If they match, add 1 and continue with both shortened. Otherwise try skipping a letter from either string and take the better result.',
          walk: ['If either string is used up, the length is 0.', 'If the current letters match: `1 + lcs(rest of a, rest of b)`.', 'Otherwise: the larger of `lcs(skip a letter of a, b)` and `lcs(a, skip a letter of b)`.'],
          code: {
            python: `def lcs(a, b):
    def go(i, j):
        if i == len(a) or j == len(b):
            return 0
        if a[i] == b[j]:
            return 1 + go(i + 1, j + 1)
        return max(go(i + 1, j), go(i, j + 1))

    return go(0, 0)
`,
            javascript: `function lcs(a, b) {
  function go(i, j) {
    if (i === a.length || j === b.length) return 0;
    if (a[i] === b[j]) return 1 + go(i + 1, j + 1);
    return Math.max(go(i + 1, j), go(i, j + 1));
  }
  return go(0, 0);
}
`,
          },
          time: 'O(2^(n+m))',
          space: 'O(n + m)',
          verdict: 'Exponential because the same (i, j) pairs are solved over and over.',
        },
        {
          title: 'Remember each (i, j)',
          tag: 'better',
          idea: 'The answer for a pair of positions `(i, j)` never changes. Store it the first time it is computed. There are only n × m different pairs.',
          walk: ['Keep a `memo` keyed by `(i, j)`.', 'Return the stored value if present.', 'Otherwise compute with the same rules, store, and return.'],
          code: {
            python: `def lcs(a, b):
    memo = {}

    def go(i, j):
        if i == len(a) or j == len(b):
            return 0
        if (i, j) not in memo:
            if a[i] == b[j]:
                memo[(i, j)] = 1 + go(i + 1, j + 1)
            else:
                memo[(i, j)] = max(go(i + 1, j), go(i, j + 1))
        return memo[(i, j)]

    return go(0, 0)
`,
            javascript: `function lcs(a, b) {
  const memo = new Map();
  function go(i, j) {
    if (i === a.length || j === b.length) return 0;
    const key = i + "," + j;
    if (!memo.has(key)) {
      if (a[i] === b[j]) memo.set(key, 1 + go(i + 1, j + 1));
      else memo.set(key, Math.max(go(i + 1, j), go(i, j + 1)));
    }
    return memo.get(key);
  }
  return go(0, 0);
}
`,
          },
          time: 'O(n × m)',
          space: 'O(n × m)',
          verdict: 'Polynomial now. Next, the same idea without recursion.',
        },
        {
          title: 'Fill a table',
          tag: 'best',
          idea: 'Let `dp[i][j]` be the answer for the first `i` letters of `a` and the first `j` letters of `b`. If the last letters match, `dp[i][j] = dp[i-1][j-1] + 1`. Otherwise it is the larger of `dp[i-1][j]` and `dp[i][j-1]`. Row 0 and column 0 are all zeros.',
          walk: ['Create a grid of (n + 1) × (m + 1) zeros.', 'For each `i` from 1 to n and `j` from 1 to m:', 'If `a[i-1] == b[j-1]`, `dp[i][j] = dp[i-1][j-1] + 1`.', 'Else `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`. The answer is `dp[n][m]`.'],
          code: {
            python: `def lcs(a, b):
    n, m = len(a), len(b)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[n][m]
`,
            javascript: `function lcs(a, b) {
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[n][m];
}
`,
          },
          time: 'O(n × m)',
          space: 'O(n × m)',
          verdict: 'A 2D table is the template for edit distance, longest palindromic subsequence and many more.',
        },
      ],
      dryRun: {
        title: 'The table for "ace" and "abc"',
        input: 'a = "ace", b = "abc"',
        frames: [
          { caption: 'Row 0 and column 0 are zeros: an empty string has nothing in common with anything.', extra: { label: 'dp rows (b = "", a, b, c)', items: ['"" : 0 0 0 0', 'a : 0 . . .', 'c : 0 . . .', 'e : 0 . . .'] } },
          { caption: 'Row for "a": a matches a, so dp = 1 (diagonal 0 + 1). After that it stays 1.', extra: { label: 'dp rows (b = "", a, b, c)', items: ['"" : 0 0 0 0', 'a : 0 1 1 1', 'c : 0 . . .', 'e : 0 . . .'] } },
          { caption: 'Row for "c": c matches c in the last column: dp = diagonal (1) + 1 = 2. Other cells copy the best neighbour.', extra: { label: 'dp rows (b = "", a, b, c)', items: ['"" : 0 0 0 0', 'a : 0 1 1 1', 'c : 0 1 1 2', 'e : 0 . . .'] } },
          { caption: '"e" matches nothing, so each cell copies the larger of the cell above or to the left. The corner holds the answer: 2 ("ac").', extra: { label: 'dp rows (b = "", a, b, c)', items: ['"" : 0 0 0 0', 'a : 0 1 1 1', 'c : 0 1 1 2', 'e : 0 1 1 2'] }, vars: [['result', '2']] },
        ],
      },
      practice: {
        fn: { python: 'lcs', javascript: 'lcs' },
        starter: { python: `def lcs(a, b):\n    # your code here\n    pass\n`, javascript: `function lcs(a, b) {\n  // your code here\n}\n` },
        cases: [
          { label: '"abcde" and "ace"', args: ['abcde', 'ace'], expected: 3 },
          { label: 'identical strings', args: ['abc', 'abc'], expected: 3 },
          { label: 'nothing in common', args: ['abc', 'def'], expected: 0 },
          { label: 'an empty string', args: ['', 'abc'], expected: 0 },
          { label: 'both empty', args: ['', ''], expected: 0 },
          { label: 'the classic DNA example', args: ['AGGTAB', 'GXTXAYB'], expected: 4 },
          { label: 'letters must stay in order', args: ['abc', 'cba'], expected: 1 },
        ],
        hints: ['Think about the last letters of both strings: do they match?', 'If they match, they are part of the answer: add 1 to the answer for both strings shortened by one letter.', 'If not, take the better of: drop the last letter of `a`, or drop the last letter of `b`. Store answers in a table.'],
      },
      mistakes: ['Confusing a subsequence (gaps allowed) with a substring (no gaps).', 'Off-by-one between table indexes and string indexes (`a[i - 1]`, not `a[i]`).', 'Forgetting the extra row and column of zeros.'],
      variants: ['Return the **actual subsequence**, not just its length (walk back through the table).', '**Edit distance**: minimum changes to turn a into b.', 'Longest **palindromic** subsequence (LCS of a string and its reverse).'],
      recap: 'For two sequences, let a 2D table hold the answer for every pair of prefixes, and build it from the smaller prefixes.',
    },
    {
      id: 'course-schedule',
      title: 'Course schedule',
      topic: 'Graphs: cycle detection and ordering',
      blurb: 'Decide if every course can be finished when some courses must come first.',
      analogy: {
        emoji: '🎓',
        title: 'A study plan with prerequisites',
        text: 'Some courses need others first. If course A needs B, B needs C, and C needs A, you are stuck in a **circle**: nothing can start. A valid plan exists exactly when there is **no circle** in the prerequisites.',
      },
      problem: {
        statement: 'There are `n` courses numbered `0` to `n - 1`. `prerequisites` is a list of pairs `[a, b]`, meaning you must take course `b` before course `a`. Write `can_finish(n, prerequisites)` that returns `True` if you can finish all courses.',
        examples: [
          { input: 'n = 2, prerequisites = [[1, 0]]', output: 'True', why: 'take 0, then 1' },
          { input: 'n = 2, prerequisites = [[1, 0], [0, 1]]', output: 'False', why: 'each needs the other' },
          { input: 'n = 1, prerequisites = []', output: 'True' },
        ],
      },
      steps: [
        {
          title: 'Depth-first search: look for a circle',
          tag: 'idea',
          idea: 'Treat each requirement `b → a` as an arrow. Search from each course following arrows. Mark a course "in progress" while you are exploring below it. If you ever reach a course that is still "in progress", you walked in a circle: return False. When finished with a course, mark it "done".',
          walk: ['Build `graph[b]` = list of courses that need `b`.', 'State of each course: 0 = unvisited, 1 = in progress, 2 = done.', '`has_cycle(course)`: if state is 1 return True (circle); if 2 return False.', 'Mark 1, check every course that depends on it, then mark 2. If no course has a cycle, return True.'],
          code: {
            python: `def can_finish(n, prerequisites):
    graph = [[] for _ in range(n)]
    for a, b in prerequisites:
        graph[b].append(a)
    state = [0] * n

    def has_cycle(course):
        if state[course] == 1:
            return True
        if state[course] == 2:
            return False
        state[course] = 1
        for nxt in graph[course]:
            if has_cycle(nxt):
                return True
        state[course] = 2
        return False

    return not any(has_cycle(c) for c in range(n))
`,
            javascript: `function canFinish(n, prerequisites) {
  const graph = Array.from({ length: n }, () => []);
  for (const [a, b] of prerequisites) graph[b].push(a);
  const state = new Array(n).fill(0);

  function hasCycle(course) {
    if (state[course] === 1) return true;
    if (state[course] === 2) return false;
    state[course] = 1;
    for (const next of graph[course]) {
      if (hasCycle(next)) return true;
    }
    state[course] = 2;
    return false;
  }

  for (let c = 0; c < n; c++) {
    if (hasCycle(c)) return false;
  }
  return true;
}
`,
          },
          time: 'O(n + edges)',
          space: 'O(n + edges)',
          verdict: 'Each course and each requirement is visited once. The three states are what make the circle detection correct.',
        },
        {
          title: 'Topological sort (Kahn\'s algorithm)',
          tag: 'best',
          idea: 'Count how many prerequisites each course still waits for. Courses with zero can be taken now: put them in a queue. When you take one, every course that needed it waits for one less. If you can take **every** course this way, there is no circle. Courses inside a circle never reach zero.',
          walk: ['Build `graph` and `waiting[a]` = number of prerequisites of `a`.', 'Queue every course with `waiting == 0`.', 'Take a course from the queue and count it as done; reduce `waiting` of the courses that need it; queue any that reach 0.', 'Return `True` if the number of courses taken equals `n`.'],
          code: {
            python: `from collections import deque


def can_finish(n, prerequisites):
    graph = [[] for _ in range(n)]
    waiting = [0] * n
    for a, b in prerequisites:
        graph[b].append(a)
        waiting[a] += 1
    queue = deque(c for c in range(n) if waiting[c] == 0)
    taken = 0
    while queue:
        course = queue.popleft()
        taken += 1
        for nxt in graph[course]:
            waiting[nxt] -= 1
            if waiting[nxt] == 0:
                queue.append(nxt)
    return taken == n
`,
            javascript: `function canFinish(n, prerequisites) {
  const graph = Array.from({ length: n }, () => []);
  const waiting = new Array(n).fill(0);
  for (const [a, b] of prerequisites) {
    graph[b].push(a);
    waiting[a]++;
  }
  const queue = [];
  for (let c = 0; c < n; c++) {
    if (waiting[c] === 0) queue.push(c);
  }
  let taken = 0;
  for (let head = 0; head < queue.length; head++) {
    const course = queue[head];
    taken++;
    for (const next of graph[course]) {
      waiting[next]--;
      if (waiting[next] === 0) queue.push(next);
    }
  }
  return taken === n;
}
`,
          },
          time: 'O(n + edges)',
          space: 'O(n + edges)',
          verdict: 'No recursion, and it also gives you a valid study order (the order you took courses). Used in build systems and task schedulers.',
        },
      ],
      dryRun: {
        title: 'Take courses that have no waiting prerequisites',
        input: 'n = 3, prerequisites = [[1, 0], [2, 1]]  (0 → 1 → 2)',
        frames: [
          { caption: 'Course 1 waits for 0, course 2 waits for 1. Only course 0 waits for nothing.', array: { label: 'waiting (index = course)', cells: [0, 1, 1] }, extra: { label: 'queue', items: ['0'] }, vars: [['taken', '0']] },
          { caption: 'Take course 0. Course 1 now waits for 0 courses: add it to the queue.', array: { label: 'waiting (index = course)', cells: [0, 0, 1], marks: [0] }, extra: { label: 'queue', items: ['1'] }, vars: [['taken', '1']] },
          { caption: 'Take course 1. Course 2 now waits for 0 courses: add it to the queue.', array: { label: 'waiting (index = course)', cells: [0, 0, 0], marks: [0, 1] }, extra: { label: 'queue', items: ['2'] }, vars: [['taken', '2']] },
          { caption: 'Take course 2. The queue is empty and taken = 3 = n, so every course can be finished: True.', array: { label: 'waiting (index = course)', cells: [0, 0, 0], marks: [0, 1, 2] }, extra: { label: 'queue', items: [] }, vars: [['taken', '3'], ['result', 'True']] },
        ],
      },
      practice: {
        fn: { python: 'can_finish', javascript: 'canFinish' },
        starter: { python: `def can_finish(n, prerequisites):\n    # your code here\n    pass\n`, javascript: `function canFinish(n, prerequisites) {\n  // your code here\n}\n` },
        cases: [
          { label: 'one prerequisite', args: [2, [[1, 0]]], expected: true },
          { label: 'two courses that need each other', args: [2, [[1, 0], [0, 1]]], expected: false },
          { label: 'one course, no prerequisites', args: [1, []], expected: true },
          { label: 'a long chain', args: [4, [[1, 0], [2, 1], [3, 2]]], expected: true },
          { label: 'a circle of three', args: [3, [[0, 1], [1, 2], [2, 0]]], expected: false },
          { label: 'two courses depend on the same one', args: [3, [[1, 0], [2, 0]]], expected: true },
          { label: 'a circle hidden inside a bigger graph', args: [5, [[1, 0], [2, 1], [3, 2], [1, 3]]], expected: false },
        ],
        hints: ['A plan exists exactly when the prerequisites contain no circle.', 'Idea 1: DFS with three states (unvisited, in progress, done); reaching an in-progress course means a circle.', 'Idea 2: repeatedly take courses with zero waiting prerequisites; if you take all `n`, there is no circle.'],
      },
      mistakes: ['Using only a visited flag in DFS: a course reached by two different paths is **not** a circle.', 'Reversing the edge direction inconsistently.', 'Forgetting courses that are not connected to anything.'],
      variants: ['Return a valid **order** of courses (or an empty list if impossible).', 'Find the **minimum number of semesters** if you can take any number of courses at once.', 'Detect a cycle in an **undirected** graph (use union-find).'],
      recap: 'A graph of "must come before" arrows can be ordered only if it has no circle; DFS states or a zero-waiting queue both detect that.',
    },
    {
      id: 'n-queens',
      title: 'N-Queens (count solutions)',
      topic: 'Backtracking with pruning',
      blurb: 'Place n queens on an n by n board so none attack each other, and count the ways.',
      analogy: {
        emoji: '♛',
        title: 'Seating guests who must not see each other',
        text: 'Seat one guest per row. Before seating a guest, check that no earlier guest is in the same column or on a diagonal line of sight. If a row has **no safe seat**, you made an earlier mistake: step back and move that guest instead. Stepping back is backtracking.',
      },
      problem: {
        statement: 'Write `total_n_queens(n)` that returns how many different ways you can place `n` queens on an `n × n` chessboard so that no two queens attack each other (no two in the same row, column or diagonal).',
        examples: [
          { input: 'n = 4', output: '2' },
          { input: 'n = 1', output: '1' },
          { input: 'n = 3', output: '0', why: 'no safe arrangement exists' },
        ],
      },
      steps: [
        {
          title: 'Row by row, check earlier queens',
          tag: 'better',
          idea: 'Place one queen per row, so rows never clash. For each row try every column. A spot is safe if no earlier queen shares its column or diagonal (check each earlier queen). If a row has no safe spot, give up on that branch and go back.',
          walk: ['`cols[r]` holds the column of the queen in row `r`.', '`place(row)`: if `row == n`, one full solution is found: count it.', 'For each column, check all earlier rows: same column, or `|row difference| == |column difference|` means a diagonal clash.', 'If safe, set `cols[row]` and call `place(row + 1)`.'],
          code: {
            python: `def total_n_queens(n):
    cols = [0] * n

    def safe(row, col):
        for r in range(row):
            if cols[r] == col or abs(cols[r] - col) == row - r:
                return False
        return True

    def place(row):
        if row == n:
            return 1
        count = 0
        for col in range(n):
            if safe(row, col):
                cols[row] = col
                count += place(row + 1)
        return count

    return place(0)
`,
            javascript: `function totalNQueens(n) {
  const cols = new Array(n).fill(0);

  function safe(row, col) {
    for (let r = 0; r < row; r++) {
      if (cols[r] === col || Math.abs(cols[r] - col) === row - r) return false;
    }
    return true;
  }

  function place(row) {
    if (row === n) return 1;
    let count = 0;
    for (let col = 0; col < n; col++) {
      if (safe(row, col)) {
        cols[row] = col;
        count += place(row + 1);
      }
    }
    return count;
  }

  return place(0);
}
`,
          },
          time: 'About O(n!)',
          space: 'O(n)',
          verdict: 'Pruning unsafe branches early makes this much faster than trying every placement. But `safe` re-checks every earlier queen.',
        },
        {
          title: 'Track attacked columns and diagonals in sets',
          tag: 'best',
          idea: 'Instead of looping over earlier queens, remember which columns and diagonals are already attacked. Cells on the same "down-right" diagonal share `row - col`; cells on the same "down-left" diagonal share `row + col`. Checking a set is O(1).',
          walk: ['Keep three sets: `used_cols`, `used_diag1` (row - col) and `used_diag2` (row + col).', 'For each column in this row, skip it if any of its three values is in a set.', 'Otherwise add the three values, recurse to the next row, then **remove** them (backtrack).'],
          code: {
            python: `def total_n_queens(n):
    used_cols = set()
    used_diag1 = set()
    used_diag2 = set()

    def place(row):
        if row == n:
            return 1
        count = 0
        for col in range(n):
            if col in used_cols or (row - col) in used_diag1 or (row + col) in used_diag2:
                continue
            used_cols.add(col)
            used_diag1.add(row - col)
            used_diag2.add(row + col)
            count += place(row + 1)
            used_cols.remove(col)
            used_diag1.remove(row - col)
            used_diag2.remove(row + col)
        return count

    return place(0)
`,
            javascript: `function totalNQueens(n) {
  const usedCols = new Set();
  const usedDiag1 = new Set();
  const usedDiag2 = new Set();

  function place(row) {
    if (row === n) return 1;
    let count = 0;
    for (let col = 0; col < n; col++) {
      if (usedCols.has(col) || usedDiag1.has(row - col) || usedDiag2.has(row + col)) continue;
      usedCols.add(col);
      usedDiag1.add(row - col);
      usedDiag2.add(row + col);
      count += place(row + 1);
      usedCols.delete(col);
      usedDiag1.delete(row - col);
      usedDiag2.delete(row + col);
    }
    return count;
  }

  return place(0);
}
`,
          },
          time: 'About O(n!)',
          space: 'O(n)',
          verdict: 'Each safety check is now constant time. It is the same backtracking skeleton as subsets, plus **pruning** (skip choices that cannot work).',
        },
      ],
      dryRun: {
        title: 'Placing queens on a 4×4 board',
        input: 'n = 4  (columns are numbered 0 to 3)',
        frames: [
          { caption: 'Row 0: try column 0. It is safe. Place the first queen.', vars: [['row', '0'], ['cols', '[0]']], array: { label: 'column of the queen in each row', cells: [0, '-', '-', '-'], pointers: { row: 0 } } },
          { caption: 'Row 1: column 0 shares the column, column 1 shares a diagonal. Column 2 is safe. Place it.', vars: [['row', '1'], ['cols', '[0, 2]']], array: { label: 'column of the queen in each row', cells: [0, 2, '-', '-'], pointers: { row: 1 } } },
          { caption: 'Row 2: every column is attacked by the queens above. Dead end: go back to row 1 and try another column.', vars: [['row', '2']], array: { label: 'column of the queen in each row', cells: [0, 2, '✗', '-'], pointers: { row: 2 } } },
          { caption: 'Row 1: column 3 is safe. Then row 2 column 1 is safe, but row 3 has no safe column. Back up again; the whole start at column 0 fails.', vars: [['row', '3']], array: { label: 'column of the queen in each row', cells: [0, 3, 1, '✗'], pointers: { row: 3 } } },
          { caption: 'Try column 1 for row 0. Rows then fit as [1, 3, 0, 2]: a full solution! count = 1. By symmetry [2, 0, 3, 1] is the other: count = 2.', vars: [['cols', '[1, 3, 0, 2]'], ['count', '2']], array: { label: 'column of the queen in each row', cells: [1, 3, 0, 2], marks: [0, 1, 2, 3] } },
        ],
      },
      practice: {
        fn: { python: 'total_n_queens', javascript: 'totalNQueens' },
        starter: { python: `def total_n_queens(n):\n    # your code here\n    pass\n`, javascript: `function totalNQueens(n) {\n  // your code here\n}\n` },
        cases: [
          { label: 'n = 1', args: [1], expected: 1 },
          { label: 'n = 2 has no solution', args: [2], expected: 0 },
          { label: 'n = 3 has no solution', args: [3], expected: 0 },
          { label: 'n = 4 has 2 solutions', args: [4], expected: 2 },
          { label: 'n = 5 has 10 solutions', args: [5], expected: 10 },
          { label: 'n = 6 has 4 solutions', args: [6], expected: 4 },
        ],
        hints: ['Put exactly one queen in each row, so you only choose a column per row.', 'A queen at (r, c) attacks the same column and cells where `row - col` or `row + col` is the same.', 'After placing and recursing, **remove** the queen again so other columns can be tried (backtracking).'],
      },
      mistakes: ['Not undoing a placement after the recursive call.', 'Checking only one of the two diagonal directions.', 'Counting partial placements instead of only complete ones (row == n).'],
      variants: ['Return all the **boards** as lists of strings.', 'Place queens with an extra **blocked square**.', 'Sudoku solver (the same backtracking idea with three sets).'],
      recap: 'Backtracking with pruning tries one choice at a time, abandons it the moment it cannot work, and undoes it before trying the next.',
    },
  ],
}
