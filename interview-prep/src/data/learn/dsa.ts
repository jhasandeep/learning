import type { LearnTrack } from './types'

export const dsa: LearnTrack = {
  id: 'dsa',
  intro: 'The patterns behind most coding rounds, one at a time: hash maps, stacks, binary search, linked lists, sliding windows, sorting intervals, BFS and dynamic programming.',
  kind: 'js',
  lang: 'javascript',
  steps: [
    {
      id: 'two-sum',
      title: 'Hash maps: Two Sum',
      learn: `Checking every pair is O(n²). A **hash map** turns "have I seen the number I need?" into an O(1) lookup, so one pass is enough: O(n).

For each number \`x\`, look for \`target - x\` among the numbers seen so far; then record \`x\` with its index.`,
      task: 'Write `twoSum(nums, target)` returning the indices `[i, j]` (i < j) of the two numbers that add up to `target`, or `null`. One pass with a `Map`.',
      starter: `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++)
    for (let j = i + 1; j < nums.length; j++)
      if (nums[i] + nums[j] === target) return [i, j]
  return null
}
`,
      solution: `function twoSum(nums, target) {
  const seen = new Map()
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i]
    if (seen.has(need)) return [seen.get(need), i]
    seen.set(nums[i], i)
  }
  return null
}
`,
      tests: [
        ['finds the pair', 'expect(twoSum([2, 7, 11, 15], 9)).toEqual([0, 1]); expect(twoSum([3, 2, 4], 6)).toEqual([1, 2])'],
        ['does not reuse one element', 'expect(twoSum([3, 3], 6)).toEqual([0, 1]); expect(twoSum([3], 6)).toBeNull()'],
        ['uses a Map in one pass', 'expect(code).toMatch(/new Map\\(/); const big = Array.from({ length: 20000 }, (_, i) => i); const t = Date.now(); expect(twoSum(big, 39997)).toEqual([19998, 19999]); expect(Date.now() - t).toBeLessThan(200)'],
      ],
      hints: ['For each `nums[i]`, check `seen.has(target - nums[i])` before storing it.', 'Store `seen.set(nums[i], i)` after the check, so an element can\'t pair with itself.'],
    },
    {
      id: 'stack',
      title: 'Stacks: valid brackets',
      learn: `A **stack** is last-in, first-out: perfect for things that must close in reverse order.

Push each opening bracket; on a closing bracket, pop and check it matches. At the end the stack must be empty.`,
      task: 'Write `isValid(s)` for strings of `()[]{}`: true when every bracket is closed by the same type in the right order.',
      starter: `function isValid(s) {
  let open = 0
  for (const ch of s) {
    if ('([{'.includes(ch)) open++
    else open--
  }
  return open === 0
}
`,
      solution: `function isValid(s) {
  const pairs = { ')': '(', ']': '[', '}': '{' }
  const stack = []
  for (const ch of s) {
    if (ch in pairs) {
      if (stack.pop() !== pairs[ch]) return false
    } else {
      stack.push(ch)
    }
  }
  return stack.length === 0
}
`,
      tests: [
        ['accepts nested and sequential brackets', 'expect(isValid("()[]{}")).toBe(true); expect(isValid("{[()]}")).toBe(true); expect(isValid("")).toBe(true)'],
        ['rejects wrong order or type', 'expect(isValid("(]")).toBe(false); expect(isValid("([)]")).toBe(false); expect(isValid(")(")).toBe(false)'],
        ['rejects unclosed brackets', 'expect(isValid("((")).toBe(false)'],
      ],
      hints: ['Counting isn\'t enough: "([)]" has balanced counts.', 'Map each closer to its opener and compare with `stack.pop()`.'],
    },
    {
      id: 'binary-search',
      title: 'Binary search',
      learn: `In a **sorted** array, compare with the middle element and discard half each time: O(log n) instead of O(n).

Keep \`lo\` and \`hi\` as the inclusive range still possible and loop **while \`lo <= hi\`**; move past \`mid\` (\`mid + 1\` / \`mid - 1\`) so the range always shrinks.`,
      task: 'Write `search(nums, target)` returning the index of `target` in the sorted array, or -1. It must be O(log n).',
      starter: `function search(nums, target) {
  return nums.indexOf(target)
}
`,
      solution: `function search(nums, target) {
  let lo = 0
  let hi = nums.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (nums[mid] === target) return mid
    if (nums[mid] < target) lo = mid + 1
    else hi = mid - 1
  }
  return -1
}
`,
      tests: [
        ['finds elements, including the ends', 'const a = [1, 3, 5, 7, 9]; expect(a.map((x) => search(a, x))).toEqual([0, 1, 2, 3, 4])'],
        ['returns -1 when missing', 'expect(search([1, 3, 5], 4)).toBe(-1); expect(search([], 1)).toBe(-1)'],
        ['is logarithmic (no indexOf/includes/loops over everything)', 'expect(code).not.toMatch(/indexOf|includes|findIndex/); const a = { length: 1e9, reads: 0 }; const p = new Proxy(a, { get: (t, k) => (k === "length" ? t.length : (t.reads++, Number(k))) }); expect(search(p, 123456789)).toBe(123456789); expect(a.reads).toBeLessThan(100)'],
      ],
      hints: ['Loop `while (lo <= hi)` with `mid = (lo + hi) >> 1`.', 'Too small? `lo = mid + 1`. Too big? `hi = mid - 1`.'],
    },
    {
      id: 'linked-list',
      title: 'Reversing a linked list',
      learn: `A linked list node is \`{ val, next }\`. To reverse it in place, walk the list and point each node back at the previous one.

Save \`next\` **before** you overwrite \`cur.next\`, or you lose the rest of the list. Three pointers: \`prev\`, \`cur\`, \`next\`.`,
      task: 'Write `reverse(head)` returning the new head. `fromArray` and `toArray` are given for testing.',
      starter: `const fromArray = (a) => a.reduceRight((next, val) => ({ val, next }), null)
const toArray = (n) => { const out = []; for (; n; n = n.next) out.push(n.val); return out }

function reverse(head) {
  return head
}
`,
      solution: `const fromArray = (a) => a.reduceRight((next, val) => ({ val, next }), null)
const toArray = (n) => { const out = []; for (; n; n = n.next) out.push(n.val); return out }

function reverse(head) {
  let prev = null
  let cur = head
  while (cur) {
    const next = cur.next
    cur.next = prev
    prev = cur
    cur = next
  }
  return prev
}
`,
      tests: [
        ['reverses the list', 'expect(toArray(reverse(fromArray([1, 2, 3, 4])))).toEqual([4, 3, 2, 1])'],
        ['handles empty and single-node lists', 'expect(reverse(null)).toBeNull(); expect(toArray(reverse(fromArray([7])))).toEqual([7])'],
        ['reuses the nodes (in place)', 'const head = fromArray([1, 2]); const second = head.next; expect(reverse(head)).toBe(second)'],
      ],
      hints: ['`const next = cur.next` first, then `cur.next = prev`.', 'Move along: `prev = cur; cur = next`; return `prev`.'],
    },
    {
      id: 'sliding-window',
      title: 'Sliding window',
      learn: `For "longest substring/subarray such that…", grow a **window** on the right and shrink it from the left when it breaks the rule. Each index enters and leaves once: O(n).

For "no repeated characters", remember each character's last index; on a repeat, jump the left edge past it (but **never move it left**).`,
      task: 'Write `longestUnique(s)`: the length of the longest substring without repeating characters.',
      starter: `function longestUnique(s) {
  return new Set(s).size
}
`,
      solution: `function longestUnique(s) {
  const last = new Map()
  let left = 0
  let best = 0
  for (let right = 0; right < s.length; right++) {
    const ch = s[right]
    if (last.has(ch)) left = Math.max(left, last.get(ch) + 1)
    last.set(ch, right)
    best = Math.max(best, right - left + 1)
  }
  return best
}
`,
      tests: [
        ['classic examples', 'expect(longestUnique("abcabcbb")).toBe(3); expect(longestUnique("bbbbb")).toBe(1); expect(longestUnique("pwwkew")).toBe(3)'],
        ['the left edge never moves back', 'expect(longestUnique("abba")).toBe(2); expect(longestUnique("tmmzuxt")).toBe(5)'],
        ['empty string', 'expect(longestUnique("")).toBe(0)'],
      ],
      hints: ['Track `left`, and for each `right` update the best `right - left + 1`.', 'On a repeat: `left = Math.max(left, last.get(ch) + 1)`.'],
    },
    {
      id: 'merge-intervals',
      title: 'Sorting: merge intervals',
      learn: `Many problems get easy after **sorting**. Sort intervals by start; then each interval either overlaps the last merged one (extend its end) or starts a new one.

Sorting costs O(n log n), the merge pass O(n).`,
      task: 'Write `merge(intervals)` that merges overlapping `[start, end]` intervals (touching ones like [1,2] and [2,3] merge too) and returns them sorted. Don\'t change the input.',
      starter: `function merge(intervals) {
  return intervals
}
`,
      solution: `function merge(intervals) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0])
  const out = []
  for (const [start, end] of sorted) {
    const last = out[out.length - 1]
    if (last && start <= last[1]) last[1] = Math.max(last[1], end)
    else out.push([start, end])
  }
  return out
}
`,
      tests: [
        ['merges overlaps', 'expect(merge([[1, 3], [2, 6], [8, 10], [15, 18]])).toEqual([[1, 6], [8, 10], [15, 18]])'],
        ['handles unsorted, touching and contained intervals', 'expect(merge([[4, 5], [1, 4]])).toEqual([[1, 5]]); expect(merge([[1, 10], [2, 3]])).toEqual([[1, 10]])'],
        ['does not change the input', 'const input = [[3, 4], [1, 2]]; merge(input); expect(input).toEqual([[3, 4], [1, 2]])'],
      ],
      hints: ['Sort a copy by start: `[...intervals].sort((a, b) => a[0] - b[0])`.', 'Overlap when `start <= last[1]`; then `last[1] = Math.max(last[1], end)`.'],
    },
    {
      id: 'bfs',
      title: 'BFS: shortest path',
      learn: `**Breadth-first search** explores in layers using a **queue**, so the first time it reaches a cell is by a shortest path (in an unweighted graph).

Mark cells as visited when you **enqueue** them, so nothing is queued twice.`,
      task: 'Write `shortestPath(grid)`: the grid is an array of strings with "." (open) and "#" (wall). Return the fewest moves (up/down/left/right) from top-left to bottom-right, or -1.',
      starter: `function shortestPath(grid) {
  return grid.length + grid[0].length - 2
}
`,
      solution: `function shortestPath(grid) {
  const rows = grid.length
  const cols = grid[0].length
  if (grid[0][0] === '#' || grid[rows - 1][cols - 1] === '#') return -1
  const seen = new Set(['0,0'])
  let queue = [[0, 0]]
  for (let steps = 0; queue.length; steps++) {
    const next = []
    for (const [r, c] of queue) {
      if (r === rows - 1 && c === cols - 1) return steps
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr
        const nc = c + dc
        const key = nr + ',' + nc
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || grid[nr][nc] === '#' || seen.has(key)) continue
        seen.add(key)
        next.push([nr, nc])
      }
    }
    queue = next
  }
  return -1
}
`,
      tests: [
        ['an open grid', 'expect(shortestPath(["...", "...", "..."])).toBe(4)'],
        ['goes around walls', 'expect(shortestPath([".#...", ".#.#.", "...#."])).toBe(10)'],
        ['-1 when blocked; 0 for one cell', 'expect(shortestPath([".#", "#."])).toBe(-1); expect(shortestPath(["."])).toBe(0)'],
      ],
      hints: ['Process the queue one layer at a time and count the layers.', 'Skip cells that are out of bounds, walls, or already seen.'],
    },
    {
      id: 'dynamic-programming',
      title: 'Dynamic programming: coin change',
      learn: `**Dynamic programming** solves a problem by combining answers to smaller versions of it, each computed once.

For the fewest coins to make \`amount\`: \`best[a] = 1 + min(best[a - coin])\` over the coins, building up from \`best[0] = 0\`. Greedy (largest coin first) is wrong for coins like [1, 3, 4] and amount 6.`,
      task: 'Write `minCoins(coins, amount)`: the fewest coins that add up to `amount` (unlimited coins of each value), or -1 if impossible.',
      starter: `function minCoins(coins, amount) {
  let count = 0
  for (const c of [...coins].sort((a, b) => b - a)) {
    while (amount >= c) {
      amount -= c
      count++
    }
  }
  return amount === 0 ? count : -1
}
`,
      solution: `function minCoins(coins, amount) {
  const best = new Array(amount + 1).fill(Infinity)
  best[0] = 0
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a && best[a - c] + 1 < best[a]) best[a] = best[a - c] + 1
    }
  }
  return best[amount] === Infinity ? -1 : best[amount]
}
`,
      tests: [
        ['beats greedy', 'expect(minCoins([1, 3, 4], 6)).toBe(2)'],
        ['common cases', 'expect(minCoins([1, 2, 5], 11)).toBe(3); expect(minCoins([2], 3)).toBe(-1); expect(minCoins([1], 0)).toBe(0)'],
        ['is fast enough for larger amounts', 'const t = Date.now(); expect(minCoins([7, 13, 29], 5000)).toBe(176); expect(Date.now() - t).toBeLessThan(500)'],
      ],
      hints: ['`best = new Array(amount + 1).fill(Infinity)` with `best[0] = 0`.', 'For each amount `a` and coin `c ≤ a`: `best[a] = Math.min(best[a], best[a - c] + 1)`.'],
    },
  ],
}
