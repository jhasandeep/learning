import type { DsaModule } from './types'

export const foundations: DsaModule = {
  id: 'foundations',
  title: 'Foundations',
  level: 'Foundations',
  blurb: 'Loops, running totals, comparing and building results. Everything later is made of these.',
  color: '#16a34a',
  lessons: [
    {
      id: 'sum-array',
      title: 'Sum of an array',
      topic: 'Loops and running totals',
      blurb: 'Add up every number in a list with a running total.',
      analogy: {
        emoji: '🧾',
        title: 'A cashier adding up a bill',
        text: 'A cashier does not memorise every price. They keep one **running total** and add each item as it passes the scanner. When the last item is scanned, the total is the answer. A loop with an accumulator is exactly that.',
      },
      problem: {
        statement: 'Write `sum_array(nums)` that returns the sum of all numbers in the list. An empty list has a sum of 0.',
        examples: [
          { input: 'nums = [1, 2, 3]', output: '6', why: '1 + 2 + 3' },
          { input: 'nums = []', output: '0', why: 'nothing to add' },
          { input: 'nums = [-1, 1]', output: '0', why: 'negative numbers work the same way' },
        ],
        constraints: ['The list can be empty.', 'Numbers can be negative.'],
      },
      steps: [
        {
          title: 'Keep a running total',
          tag: 'idea',
          idea: 'Start a total at 0. Look at every number once, in order, and add it to the total. When you run out of numbers, the total is the answer.',
          walk: [
            'Create `total` and set it to 0. This is also the answer for an empty list.',
            'Visit each number in the list, one at a time.',
            'Add the number to `total`.',
            'After the loop, return `total`.',
          ],
          code: {
            python: `def sum_array(nums):
    total = 0
    for n in nums:
        total += n
    return total
`,
            javascript: `function sumArray(nums) {
  let total = 0;
  for (const n of nums) {
    total += n;
  }
  return total;
}
`,
          },
          time: 'O(n)',
          space: 'O(1)',
          verdict: 'Perfect. You touch each number once and only keep one variable.',
        },
        {
          title: 'Let the language do the loop',
          tag: 'best',
          idea: 'Both languages have a built-in for this exact job. It is the same loop under the hood, so the speed is the same: O(n). Learn the loop first so you know what the built-in does.',
          walk: [
            'Python: `sum(nums)` adds the whole list and returns 0 for an empty list.',
            'JavaScript: `reduce` walks the array carrying a total, and the second argument `0` is the starting total.',
          ],
          code: {
            python: `def sum_array(nums):
    return sum(nums)
`,
            javascript: `function sumArray(nums) {
  return nums.reduce((total, n) => total + n, 0);
}
`,
          },
          time: 'O(n)',
          space: 'O(1)',
          verdict: 'Shorter, same speed. In interviews, show the loop first, then mention the built-in.',
        },
      ],
      dryRun: {
        title: 'Watch the total grow',
        input: 'nums = [3, 1, 4, 2]',
        frames: [
          { caption: 'Start with a total of 0, before looking at any number.', vars: [['total', '0']], array: { cells: [3, 1, 4, 2] } },
          { caption: 'Look at 3. Add it: 0 + 3 = 3.', vars: [['n', '3'], ['total', '3']], array: { cells: [3, 1, 4, 2], pointers: { n: 0 }, marks: [0] } },
          { caption: 'Look at 1. Add it: 3 + 1 = 4.', vars: [['n', '1'], ['total', '4']], array: { cells: [3, 1, 4, 2], pointers: { n: 1 }, marks: [0, 1] } },
          { caption: 'Look at 4. Add it: 4 + 4 = 8.', vars: [['n', '4'], ['total', '8']], array: { cells: [3, 1, 4, 2], pointers: { n: 2 }, marks: [0, 1, 2] } },
          { caption: 'Look at 2. Add it: 8 + 2 = 10.', vars: [['n', '2'], ['total', '10']], array: { cells: [3, 1, 4, 2], pointers: { n: 3 }, marks: [0, 1, 2, 3] } },
          { caption: 'No numbers left. Return the total: 10.', vars: [['total', '10']], array: { cells: [3, 1, 4, 2], marks: [0, 1, 2, 3] } },
        ],
      },
      practice: {
        fn: { python: 'sum_array', javascript: 'sumArray' },
        starter: {
          python: `def sum_array(nums):
    # your code here
    pass
`,
          javascript: `function sumArray(nums) {
  // your code here
}
`,
        },
        cases: [
          { label: 'adds [1, 2, 3] to 6', args: [[1, 2, 3]], expected: 6 },
          { label: 'an empty list gives 0', args: [[]], expected: 0 },
          { label: 'one number gives itself', args: [[5]], expected: 5 },
          { label: 'negative and positive cancel out', args: [[-1, 1]], expected: 0 },
          { label: 'all negative numbers', args: [[-5, -5]], expected: -10 },
          { label: 'a longer list', args: [[10, 20, 30, 40]], expected: 100 },
        ],
        hints: ['You need one variable that remembers the total so far.', 'Start the total at 0, so an empty list returns 0 without extra code.', 'Loop over every number and add it to the total, then return the total after the loop.'],
      },
      mistakes: ['Starting the total at 1 instead of 0 (that adds an extra 1 to every answer).', 'Returning inside the loop, which stops after the first number.', 'Forgetting that an empty list must return 0.'],
      variants: ['Return the **average** of the list (what must you do for an empty list?).', 'Sum only the **even** numbers.', 'Return the sum of the **squares** of the numbers.'],
      recap: 'A running total (accumulator) plus one loop solves every "combine all items into one answer" problem.',
    },
    {
      id: 'find-max',
      title: 'Find the largest number',
      topic: 'Compare with the best so far',
      blurb: 'Scan a list once and remember the biggest value you have seen.',
      analogy: {
        emoji: '🧍',
        title: 'Finding the tallest person in a queue',
        text: 'Walk along the queue holding the **tallest person so far** in mind. Each new person is either taller (you switch to them) or not (you ignore them). At the end of the queue, the person you are remembering is the tallest.',
      },
      problem: {
        statement: 'Write `find_max(nums)` that returns the largest number in the list, or `None` (`null` in JavaScript) if the list is empty.',
        examples: [
          { input: 'nums = [3, 9, 2]', output: '9' },
          { input: 'nums = [-5, -2, -9]', output: '-2', why: 'the "biggest" negative is the one closest to zero' },
          { input: 'nums = []', output: 'None / null', why: 'there is no largest number in an empty list' },
        ],
      },
      steps: [
        {
          title: 'Start with 0 as the best (a trap)',
          tag: 'slow',
          idea: 'The first idea many people have: set `best = 0` and update it whenever a number is bigger. It looks fine, but there is a bug. Can you spot it?',
          walk: ['Set `best` to 0.', 'For every number, if it is bigger than `best`, replace `best`.', 'Return `best`.'],
          code: {
            python: `def find_max(nums):
    best = 0
    for n in nums:
        if n > best:
            best = n
    return best
`,
            javascript: `function findMax(nums) {
  let best = 0;
  for (const n of nums) {
    if (n > best) best = n;
  }
  return best;
}
`,
          },
          time: 'O(n)',
          space: 'O(1)',
          buggy: true,
          verdict: 'Wrong for [-5, -2, -9]: it returns 0, a number that is not even in the list. A starting value must come from the data.',
        },
        {
          title: 'Start with the first number',
          tag: 'best',
          idea: 'Take the first number as the best so far, because it is a real value from the list. Then compare every other number against it. Handle the empty list first, since there is no first number.',
          walk: [
            'If the list is empty, return `None` / `null` straight away.',
            'Set `best` to the first number.',
            'Look at the remaining numbers. If one is bigger than `best`, replace `best` with it.',
            'Return `best`.',
          ],
          code: {
            python: `def find_max(nums):
    if not nums:
        return None
    best = nums[0]
    for n in nums[1:]:
        if n > best:
            best = n
    return best
`,
            javascript: `function findMax(nums) {
  if (nums.length === 0) return null;
  let best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] > best) best = nums[i];
  }
  return best;
}
`,
          },
          time: 'O(n)',
          space: 'O(1)',
          verdict: 'Correct for every input, one pass, constant memory.',
        },
      ],
      dryRun: {
        title: 'Follow "best so far"',
        input: 'nums = [4, 9, 2, 9, 7]',
        frames: [
          { caption: 'The list is not empty, so take the first number as the best so far.', vars: [['best', '4']], array: { cells: [4, 9, 2, 9, 7], pointers: { best: 0 }, marks: [0] } },
          { caption: 'Look at 9. Is 9 > 4? Yes, so the new best is 9.', vars: [['best', '9']], array: { cells: [4, 9, 2, 9, 7], pointers: { i: 1 }, marks: [1] } },
          { caption: 'Look at 2. Is 2 > 9? No. Keep 9.', vars: [['best', '9']], array: { cells: [4, 9, 2, 9, 7], pointers: { i: 2 }, marks: [1] } },
          { caption: 'Look at the second 9. Is 9 > 9? No (equal is not bigger). Keep 9.', vars: [['best', '9']], array: { cells: [4, 9, 2, 9, 7], pointers: { i: 3 }, marks: [1] } },
          { caption: 'Look at 7. Is 7 > 9? No. Keep 9.', vars: [['best', '9']], array: { cells: [4, 9, 2, 9, 7], pointers: { i: 4 }, marks: [1] } },
          { caption: 'The list is finished. The largest number is 9.', vars: [['best', '9']], array: { cells: [4, 9, 2, 9, 7], marks: [1] } },
        ],
      },
      practice: {
        fn: { python: 'find_max', javascript: 'findMax' },
        starter: {
          python: `def find_max(nums):
    # your code here
    pass
`,
          javascript: `function findMax(nums) {
  // your code here
}
`,
        },
        cases: [
          { label: 'finds the biggest of [3, 9, 2]', args: [[3, 9, 2]], expected: 9 },
          { label: 'works when all numbers are negative', args: [[-5, -2, -9]], expected: -2 },
          { label: 'one number is its own maximum', args: [[7]], expected: 7 },
          { label: 'the maximum can be first', args: [[10, 3, 4]], expected: 10 },
          { label: 'the maximum can be last', args: [[1, 2, 99]], expected: 99 },
          { label: 'equal numbers are fine', args: [[4, 4, 4]], expected: 4 },
          { label: 'an empty list gives None / null', args: [[]], expected: null },
        ],
        hints: ['Do not start with 0: the list may contain only negative numbers.', 'Start with the first number, but check for an empty list before you read `nums[0]`.', 'Loop over the rest and replace `best` whenever you see something bigger.'],
      },
      mistakes: ['Starting with `best = 0` (breaks for all-negative lists).', 'Reading `nums[0]` before checking the list is empty.', 'Using `>=` and thinking it matters. It does not change the answer, only which duplicate you "found".'],
      variants: ['Find the **smallest** number.', 'Return the **index** of the largest number.', 'Find the **second largest** number (keep two variables).'],
      recap: 'Start from a real value in the data, not an invented one, and compare everything else against the best so far.',
    },
    {
      id: 'reverse-string',
      title: 'Reverse a string',
      topic: 'Indexes and two pointers',
      blurb: 'Reverse the characters of a string in three different ways.',
      analogy: {
        emoji: '📚',
        title: 'Reversing a row of books',
        text: 'To reverse a shelf of books you can build a **new shelf** by taking books from the right end one by one. Or you can stand at both ends and **swap** the two outer books, then move inwards until you meet in the middle.',
      },
      problem: {
        statement: 'Write `reverse_string(s)` that returns the string written backwards.',
        examples: [
          { input: 's = "hello"', output: '"olleh"' },
          { input: 's = "ab"', output: '"ba"' },
          { input: 's = ""', output: '""' },
        ],
      },
      steps: [
        {
          title: 'Build a new string from the back',
          tag: 'slow',
          idea: 'Start with an empty result. Walk through the original string from the last position to the first and add each character to the result.',
          walk: ['Start with an empty `result`.', 'Walk the index from the last position down to 0.', 'Add that character to the end of `result`.', 'Return `result`.'],
          code: {
            python: `def reverse_string(s):
    result = ""
    for i in range(len(s) - 1, -1, -1):
        result += s[i]
    return result
`,
            javascript: `function reverseString(s) {
  let result = "";
  for (let i = s.length - 1; i >= 0; i--) {
    result += s[i];
  }
  return result;
}
`,
          },
          time: 'O(n)',
          space: 'O(n)',
          verdict: 'Correct and easy to read. It needs a second string as big as the first.',
        },
        {
          title: 'Swap from both ends',
          tag: 'better',
          idea: 'Strings cannot be changed in place, so turn the string into a list of characters. Put one pointer at the start and one at the end, swap the two characters, and move both pointers towards the middle until they meet.',
          walk: [
            'Turn the string into a list/array of characters.',
            '`left` starts at 0 and `right` at the last index.',
            'While `left < right`: swap the two characters, then `left += 1` and `right -= 1`.',
            'Join the characters back into a string.',
          ],
          code: {
            python: `def reverse_string(s):
    chars = list(s)
    left, right = 0, len(chars) - 1
    while left < right:
        chars[left], chars[right] = chars[right], chars[left]
        left += 1
        right -= 1
    return "".join(chars)
`,
            javascript: `function reverseString(s) {
  const chars = s.split("");
  let left = 0;
  let right = chars.length - 1;
  while (left < right) {
    [chars[left], chars[right]] = [chars[right], chars[left]];
    left++;
    right--;
  }
  return chars.join("");
}
`,
          },
          time: 'O(n)',
          space: 'O(n)',
          verdict: 'This is the **two pointers** pattern. On a real array (not a string) it uses no extra memory at all.',
        },
        {
          title: 'The one-liner',
          tag: 'best',
          idea: 'Both languages can reverse in one expression. Know it for everyday code, but be ready to write the pointer version when an interviewer says "without built-ins".',
          walk: ['Python: the slice `s[::-1]` means "the whole string, stepping backwards".', 'JavaScript: split into characters, `reverse()` the array, join back.'],
          code: {
            python: `def reverse_string(s):
    return s[::-1]
`,
            javascript: `function reverseString(s) {
  return s.split("").reverse().join("");
}
`,
          },
          time: 'O(n)',
          space: 'O(n)',
          verdict: 'Shortest code. Same O(n) time as the others.',
        },
      ],
      dryRun: {
        title: 'Swap from both ends',
        input: 's = "hello"  →  chars = [h, e, l, l, o]',
        frames: [
          { caption: 'Put `left` on the first character and `right` on the last.', vars: [['left', '0'], ['right', '4']], array: { cells: ['h', 'e', 'l', 'l', 'o'], pointers: { left: 0, right: 4 } } },
          { caption: 'Swap h and o. Then move left to 1 and right to 3.', vars: [['left', '1'], ['right', '3']], array: { cells: ['o', 'e', 'l', 'l', 'h'], pointers: { left: 1, right: 3 }, marks: [0, 4] } },
          { caption: 'Swap e and l. Then move left to 2 and right to 2.', vars: [['left', '2'], ['right', '2']], array: { cells: ['o', 'l', 'l', 'e', 'h'], pointers: { left: 2, right: 2 }, marks: [0, 1, 3, 4] } },
          { caption: 'left is no longer smaller than right (both are 2), so stop. The middle letter stays where it is.', vars: [['left', '2'], ['right', '2']], array: { cells: ['o', 'l', 'l', 'e', 'h'], pointers: { left: 2, right: 2 }, marks: [0, 1, 2, 3, 4] } },
          { caption: 'Join the characters: "olleh".', vars: [['result', '"olleh"']], array: { cells: ['o', 'l', 'l', 'e', 'h'], marks: [0, 1, 2, 3, 4] } },
        ],
      },
      practice: {
        fn: { python: 'reverse_string', javascript: 'reverseString' },
        starter: {
          python: `def reverse_string(s):
    # your code here
    pass
`,
          javascript: `function reverseString(s) {
  // your code here
}
`,
        },
        cases: [
          { label: 'reverses "hello"', args: ['hello'], expected: 'olleh' },
          { label: 'an empty string stays empty', args: [''], expected: '' },
          { label: 'one character stays the same', args: ['a'], expected: 'a' },
          { label: 'two characters swap', args: ['ab'], expected: 'ba' },
          { label: 'a palindrome stays the same', args: ['racecar'], expected: 'racecar' },
          { label: 'keeps upper and lower case and spaces', args: ['Hello World'], expected: 'dlroW olleH' },
        ],
        hints: ['Strings are read-only in both languages: you build a new one or change a list of characters.', 'Walk the indexes from `len(s) - 1` down to 0 and add each character to a result.', 'Or use two pointers: swap `chars[left]` and `chars[right]`, then move both inwards while `left < right`.'],
      },
      mistakes: ['Looping `while left <= right`, which does one pointless swap in the middle.', 'Trying to assign `s[i] = ...` on a string (strings cannot be changed in place).', 'An off-by-one start: the last index is `len(s) - 1`, not `len(s)`.'],
      variants: ['Reverse the **order of the words** but keep each word as it is.', 'Check whether a string is a **palindrome** (next lessons).', 'Reverse only the **letters** and leave other characters in place.'],
      recap: 'Two pointers that start at both ends and move inwards let you reverse anything without extra memory.',
    },
    {
      id: 'fizzbuzz',
      title: 'FizzBuzz',
      topic: 'Conditions and order of checks',
      blurb: 'The classic warm-up: why the order of your if-statements matters.',
      analogy: {
        emoji: '🚦',
        title: 'A sorting machine with rules',
        text: 'Picture a machine that stamps each number. It checks its rules **from the most specific to the most general**. If it checked the general rule first, it would stamp the item and never reach the special one.',
      },
      problem: {
        statement: 'Write `fizz_buzz(n)` that returns a list of strings for the numbers 1 to n. For multiples of 3 use "Fizz", for multiples of 5 use "Buzz", for multiples of both use "FizzBuzz", otherwise the number as a string.',
        examples: [
          { input: 'n = 5', output: '["1", "2", "Fizz", "4", "Buzz"]' },
          { input: 'n = 15', output: 'ends with "FizzBuzz"', why: '15 is a multiple of 3 and of 5' },
          { input: 'n = 0', output: '[]' },
        ],
      },
      steps: [
        {
          title: 'Check the most specific rule first',
          tag: 'idea',
          idea: 'A number divisible by 15 is divisible by both 3 and 5. If you test "divisible by 3" first, 15 would become "Fizz" and the "FizzBuzz" rule would never run. So test 15 first.',
          walk: [
            'Create an empty list `out`.',
            'For each `i` from 1 to n:',
            'If `i % 15 == 0` add "FizzBuzz". Else if `i % 3 == 0` add "Fizz". Else if `i % 5 == 0` add "Buzz". Else add the number as text.',
            'Return `out`.',
          ],
          code: {
            python: `def fizz_buzz(n):
    out = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            out.append("FizzBuzz")
        elif i % 3 == 0:
            out.append("Fizz")
        elif i % 5 == 0:
            out.append("Buzz")
        else:
            out.append(str(i))
    return out
`,
            javascript: `function fizzBuzz(n) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    if (i % 15 === 0) out.push("FizzBuzz");
    else if (i % 3 === 0) out.push("Fizz");
    else if (i % 5 === 0) out.push("Buzz");
    else out.push(String(i));
  }
  return out;
}
`,
          },
          time: 'O(n)',
          space: 'O(n)',
          verdict: 'Correct and clear. The list of answers is n items long, so O(n) space is unavoidable.',
        },
        {
          title: 'Build the word piece by piece',
          tag: 'best',
          idea: 'Instead of a special case for 15, build the text: add "Fizz" if divisible by 3, then add "Buzz" if divisible by 5. A multiple of 15 gets both pieces automatically. If the text is still empty, use the number. Adding a new rule later (like 7 → "Bazz") is one new line.',
          walk: [
            'For each `i`, start with an empty string `word`.',
            'If `i % 3 == 0`, add "Fizz". If `i % 5 == 0`, add "Buzz".',
            'If `word` is still empty, use the number as text.',
            'Add `word` to the list.',
          ],
          code: {
            python: `def fizz_buzz(n):
    out = []
    for i in range(1, n + 1):
        word = ""
        if i % 3 == 0:
            word += "Fizz"
        if i % 5 == 0:
            word += "Buzz"
        out.append(word or str(i))
    return out
`,
            javascript: `function fizzBuzz(n) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    let word = "";
    if (i % 3 === 0) word += "Fizz";
    if (i % 5 === 0) word += "Buzz";
    out.push(word || String(i));
  }
  return out;
}
`,
          },
          time: 'O(n)',
          space: 'O(n)',
          verdict: 'Same speed, easier to extend. Interviewers like this version.',
        },
      ],
      dryRun: {
        title: 'Build the word for 1 to 6',
        input: 'n = 6',
        frames: [
          { caption: 'i = 1: not divisible by 3 or 5, so the word is empty and we use "1".', vars: [['i', '1'], ['word', '""']], extra: { label: 'out', items: ['"1"'] } },
          { caption: 'i = 2: same, use "2".', vars: [['i', '2'], ['word', '""']], extra: { label: 'out', items: ['"1"', '"2"'] } },
          { caption: 'i = 3: divisible by 3, so word = "Fizz".', vars: [['i', '3'], ['word', '"Fizz"']], extra: { label: 'out', items: ['"1"', '"2"', '"Fizz"'] } },
          { caption: 'i = 4: nothing matches, use "4".', vars: [['i', '4'], ['word', '""']], extra: { label: 'out', items: ['"1"', '"2"', '"Fizz"', '"4"'] } },
          { caption: 'i = 5: divisible by 5, so word = "Buzz".', vars: [['i', '5'], ['word', '"Buzz"']], extra: { label: 'out', items: ['"1"', '"2"', '"Fizz"', '"4"', '"Buzz"'] } },
          { caption: 'i = 6: divisible by 3, so word = "Fizz". (At i = 15 both rules add text: "FizzBuzz".)', vars: [['i', '6'], ['word', '"Fizz"']], extra: { label: 'out', items: ['"1"', '"2"', '"Fizz"', '"4"', '"Buzz"', '"Fizz"'] } },
        ],
      },
      practice: {
        fn: { python: 'fizz_buzz', javascript: 'fizzBuzz' },
        starter: {
          python: `def fizz_buzz(n):
    # your code here
    pass
`,
          javascript: `function fizzBuzz(n) {
  // your code here
}
`,
        },
        cases: [
          { label: 'n = 5', args: [5], expected: ['1', '2', 'Fizz', '4', 'Buzz'] },
          { label: 'n = 1 gives just "1"', args: [1], expected: ['1'] },
          { label: 'n = 0 gives an empty list', args: [0], expected: [] },
          { label: 'multiples of both are "FizzBuzz"', args: [15], expected: ['1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz'] },
          { label: 'numbers are returned as strings', args: [2], expected: ['1', '2'] },
        ],
        hints: ['`i % 3 == 0` means "i is divisible by 3".', 'A number divisible by both 3 and 5 must not become just "Fizz": check that case first, or build the word in two pieces.', 'Use `str(i)` (Python) or `String(i)` (JavaScript) for the plain numbers.'],
      },
      mistakes: ['Checking `% 3` before `% 15`, so "FizzBuzz" never appears.', 'Returning numbers instead of strings.', 'Looping from 0, or stopping at n - 1 instead of n.'],
      variants: ['Add a rule: multiples of 7 say "Bazz".', 'Print the results instead of returning a list.', 'Return only the **count** of "FizzBuzz" values up to n.'],
      recap: 'Order your checks from the most specific to the most general, or build the answer from independent pieces.',
    },
  ],
}
