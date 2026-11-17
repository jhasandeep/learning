import type { SpotSet } from './types'

export const dsa: SpotSet = {
  id: 'dsa',
  bugs: [
    {
      id: 'binary-search',
      title: 'Misses the last element',
      task: '`search([1, 3, 5, 7], 7)` should return 3, but returns -1.',
      lang: 'javascript',
      code: `function search(nums, target) {
  let lo = 0, hi = nums.length - 1
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (nums[mid] === target) return mid
    if (nums[mid] < target) lo = mid + 1
    else hi = mid - 1
  }
  return -1
}`,
      line: 3,
      fix: '  while (lo <= hi) {',
      explain: 'With an inclusive `hi`, the range `lo === hi` still holds one candidate. The loop must run ==while `lo <= hi`==.',
      difficulty: 'Easy',
    },
    {
      id: 'two-sum',
      title: 'Using the same number twice',
      task: '`twoSum([3, 2, 4], 6)` should return `[1, 2]` but returns `[0, 0]`.',
      lang: 'javascript',
      code: `function twoSum(nums, target) {
  const seen = new Map()
  nums.forEach((n, i) => seen.set(n, i))
  for (let i = 0; i < nums.length; i++) {
    const j = seen.get(target - nums[i])
    if (j !== undefined) return [i, j]
  }
}`,
      line: 6,
      fix: '    if (j !== undefined && j !== i) return [i, j]',
      explain: '3 + 3 = 6 finds index 0 itself. Make sure the partner is ==a different index== (or build the map as you go, checking before inserting).',
      difficulty: 'Medium',
    },
    {
      id: 'parentheses',
      title: '"((" is valid?',
      task: '`isValid("((")` should be false but returns true.',
      lang: 'javascript',
      code: `function isValid(s) {
  const pairs = { ')': '(', ']': '[', '}': '{' }
  const stack = []
  for (const ch of s) {
    if (!pairs[ch]) stack.push(ch)
    else if (stack.pop() !== pairs[ch]) return false
  }
  return true
}`,
      line: 8,
      fix: '  return stack.length === 0',
      explain: 'Unclosed openers are left on the stack. The string is valid only if the stack is ==empty== at the end.',
      difficulty: 'Easy',
    },
    {
      id: 'reverse-list',
      title: 'Lost the rest of the list',
      task: 'Reversing `1 → 2 → 3` returns just `1`.',
      lang: 'javascript',
      code: `function reverse(head) {
  let prev = null, cur = head
  while (cur) {
    cur.next = prev
    prev = cur
    cur = cur.next
  }
  return prev
}`,
      line: 4,
      fixed: `function reverse(head) {
  let prev = null, cur = head
  while (cur) {
    const next = cur.next
    cur.next = prev
    prev = cur
    cur = next
  }
  return prev
}`,
      also: [6],
      explain: 'Overwriting `cur.next` first loses the pointer to the rest of the list, so `cur = cur.next` goes back to `prev`. ==Save `next` first==.',
      difficulty: 'Medium',
    },
    {
      id: 'sliding-window',
      title: 'Window never shrinks right',
      task: 'Longest substring without repeats: `"abba"` should give 2 but gives 3.',
      lang: 'javascript',
      code: `function longest(s) {
  const last = new Map()
  let start = 0, best = 0
  for (let i = 0; i < s.length; i++) {
    if (last.has(s[i])) start = last.get(s[i]) + 1
    last.set(s[i], i)
    best = Math.max(best, i - start + 1)
  }
  return best
}`,
      line: 5,
      fix: '    if (last.has(s[i])) start = Math.max(start, last.get(s[i]) + 1)',
      explain: 'At the final "a", its last index (0) is ==behind the window==, so `start` jumps backwards to 1. The left edge must never move left.',
      difficulty: 'Hard',
    },
    {
      id: 'fib-memo',
      title: 'Memo that never remembers',
      task: '`fib(45)` should be instant with memoisation, but it takes ages.',
      lang: 'javascript',
      code: `function fib(n, memo = {}) {
  if (n < 2) return n
  if (memo[n]) return memo[n]
  const result = fib(n - 1) + fib(n - 2)
  memo[n] = result
  return result
}`,
      line: 4,
      fix: '  const result = fib(n - 1, memo) + fib(n - 2, memo)',
      explain: 'The recursive calls get a ==fresh empty memo== from the default parameter, so nothing is reused. Pass the memo down.',
      difficulty: 'Medium',
    },
  ],
}
