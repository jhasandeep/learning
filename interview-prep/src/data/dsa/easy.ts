import type { DsaModule } from './types'

export const easy: DsaModule = {
  id: 'easy',
  title: 'Easy problems',
  level: 'Easy',
  blurb: 'The questions every interview starts with. Each one introduces a pattern you will reuse for the rest of the course.',
  color: '#0891b2',
  lessons: [
    {
      id: 'valid-palindrome',
      title: 'Valid palindrome',
      topic: 'Two pointers',
      blurb: 'Check if a sentence reads the same forwards and backwards, ignoring punctuation and case.',
      analogy: {
        emoji: '🪞',
        title: 'Two people reading a word from opposite ends',
        text: 'Imagine two people reading the same word, one from the left and one from the right. If every pair of letters they meet matches, the word is a palindrome. They only need to walk until they meet in the middle.',
      },
      problem: {
        statement: 'Write `is_palindrome(s)` that returns `True` if the string reads the same forwards and backwards, looking only at letters and digits and ignoring upper/lower case.',
        examples: [
          { input: 's = "A man, a plan, a canal: Panama"', output: 'True', why: 'ignoring spaces and punctuation it is "amanaplanacanalpanama"' },
          { input: 's = "race a car"', output: 'False', why: '"raceacar" reversed is "racaecar"' },
          { input: 's = ""', output: 'True', why: 'an empty text is the same both ways' },
        ],
      },
      steps: [
        {
          title: 'Clean it, reverse it, compare',
          tag: 'slow',
          idea: 'Remove everything that is not a letter or digit, make it lowercase, then compare the result with its own reverse. Simple to understand, but it creates two extra strings.',
          walk: ['Keep only letters and digits, lowercased, in a new string `cleaned`.', 'Reverse `cleaned`.', 'Return whether the two are equal.'],
          code: {
            python: `def is_palindrome(s):
    cleaned = "".join(c.lower() for c in s if c.isalnum())
    return cleaned == cleaned[::-1]
`,
            javascript: `function isPalindrome(s) {
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleaned === cleaned.split("").reverse().join("");
}
`,
          },
          time: 'O(n)',
          space: 'O(n)',
          verdict: 'Correct and readable. It uses extra memory for the cleaned and reversed copies.',
        },
        {
          title: 'Two pointers, no extra strings',
          tag: 'best',
          idea: 'Put one pointer at each end. Skip anything that is not a letter or digit. Compare the two characters (ignoring case). If they differ, it is not a palindrome. If the pointers meet, it is.',
          walk: [
            'Set `left = 0` and `right = len(s) - 1`.',
            'While `left < right`: move `left` forward until it sits on a letter or digit.',
            'Move `right` backward until it sits on a letter or digit.',
            'If the two characters (lowercased) are different, return False.',
            'Move both pointers inwards. If the loop ends, return True.',
          ],
          code: {
            python: `def is_palindrome(s):
    left, right = 0, len(s) - 1
    while left < right:
        while left < right and not s[left].isalnum():
            left += 1
        while left < right and not s[right].isalnum():
            right -= 1
        if s[left].lower() != s[right].lower():
            return False
        left += 1
        right -= 1
    return True
`,
            javascript: `function isPalindrome(s) {
  const isAlnum = (c) => /[a-z0-9]/i.test(c);
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    while (left < right && !isAlnum(s[left])) left++;
    while (left < right && !isAlnum(s[right])) right--;
    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
    left++;
    right--;
  }
  return true;
}
`,
          },
          time: 'O(n)',
          space: 'O(1)',
          verdict: 'Each character is visited at most once and no copies are made. This is the answer interviewers expect.',
        },
      ],
      dryRun: {
        title: 'Walk inwards from both ends',
        input: 's = "A b,A"  (letters: A b A)',
        frames: [
          { caption: 'Pointers start at both ends: "A" and "A".', vars: [['left', '0'], ['right', '4']], array: { cells: ['A', ' ', 'b', ',', 'A'], pointers: { left: 0, right: 4 } } },
          { caption: 'Both are letters. "a" equals "a", so keep going. Move both inwards.', vars: [['left', '1'], ['right', '3']], array: { cells: ['A', ' ', 'b', ',', 'A'], pointers: { left: 1, right: 3 }, marks: [0, 4] } },
          { caption: 'left is on a space and right is on a comma: skip both. left moves to "b", right moves to "b".', vars: [['left', '2'], ['right', '2']], array: { cells: ['A', ' ', 'b', ',', 'A'], pointers: { left: 2, right: 2 }, marks: [0, 4] } },
          { caption: 'The pointers have met in the middle, so every pair matched. Return True.', vars: [['result', 'True']], array: { cells: ['A', ' ', 'b', ',', 'A'], marks: [0, 2, 4] } },
        ],
      },
      practice: {
        fn: { python: 'is_palindrome', javascript: 'isPalindrome' },
        starter: {
          python: `def is_palindrome(s):
    # your code here
    pass
`,
          javascript: `function isPalindrome(s) {
  // your code here
}
`,
        },
        cases: [
          { label: 'a sentence with punctuation', args: ['A man, a plan, a canal: Panama'], expected: true },
          { label: '"race a car" is not a palindrome', args: ['race a car'], expected: false },
          { label: 'an empty string is a palindrome', args: [''], expected: true },
          { label: 'one character is a palindrome', args: ['a'], expected: true },
          { label: 'only punctuation is a palindrome', args: [' ,.'], expected: true },
          { label: 'digits count as characters ("0P")', args: ['0P'], expected: false },
          { label: 'upper and lower case are the same', args: ['No lemon, no melon'], expected: true },
        ],
        hints: ['Decide first what counts: only letters and digits, and "A" equals "a".', 'The simple way: build a cleaned string and compare it with its reverse.', 'The better way: two pointers that skip characters that are not letters or digits.'],
      },
      mistakes: ['Forgetting to lowercase, so "Aa" fails.', 'Not skipping spaces and punctuation.', 'Moving a pointer past the other one (always keep `left < right` in the inner loops too).'],
      variants: ['**Almost palindrome**: can you make it a palindrome by deleting at most one character?', 'Find the **longest palindromic substring**.', 'Check a palindrome **number** without turning it into a string.'],
      recap: 'Two pointers walking inwards from both ends check a mirror property in one pass with no extra memory.',
    },
    {
      id: 'valid-anagram',
      title: 'Valid anagram',
      topic: 'Counting with a hash map',
      blurb: 'Decide if two words use exactly the same letters, first by sorting and then by counting.',
      analogy: {
        emoji: '🔤',
        title: 'Two bags of Scrabble tiles',
        text: 'Two words are anagrams if they come from the **same bag of tiles**. You do not need to line the tiles up in order. You only need to count: the same number of each letter in both bags.',
      },
      problem: {
        statement: 'Write `is_anagram(s, t)` that returns `True` if `t` can be made by rearranging the letters of `s`, using every letter exactly once.',
        examples: [
          { input: 's = "anagram", t = "nagaram"', output: 'True' },
          { input: 's = "rat", t = "car"', output: 'False', why: 'different letters' },
          { input: 's = "ab", t = "a"', output: 'False', why: 'different lengths can never match' },
        ],
      },
      steps: [
        {
          title: 'Sort both and compare',
          tag: 'slow',
          idea: 'If two words are anagrams, their letters in sorted order are identical. So sort both and compare. It is two lines, but sorting costs more than counting.',
          walk: ['Sort the letters of `s`.', 'Sort the letters of `t`.', 'Return whether the two sorted results are equal.'],
          code: {
            python: `def is_anagram(s, t):
    return sorted(s) == sorted(t)
`,
            javascript: `function isAnagram(s, t) {
  return s.split("").sort().join("") === t.split("").sort().join("");
}
`,
          },
          time: 'O(n log n)',
          space: 'O(n)',
          verdict: 'Correct. Sorting is the slow part, so we can do better.',
        },
        {
          title: 'Count the letters',
          tag: 'best',
          idea: 'Count how many times each letter appears in `s`. Then walk through `t` and subtract. If a letter is missing or runs below zero, `t` has a letter `s` does not. If the lengths match and nothing went wrong, they are anagrams. Counting each letter once is O(n).',
          walk: [
            'If the lengths differ, return False immediately.',
            'Build `counts`: for each letter in `s`, add 1 to its count.',
            'For each letter in `t`, subtract 1. If its count is 0 or missing, return False.',
            'If you finish, every letter matched. Return True.',
          ],
          code: {
            python: `def is_anagram(s, t):
    if len(s) != len(t):
        return False
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    for ch in t:
        if counts.get(ch, 0) == 0:
            return False
        counts[ch] -= 1
    return True
`,
            javascript: `function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const counts = new Map();
  for (const ch of s) {
    counts.set(ch, (counts.get(ch) || 0) + 1);
  }
  for (const ch of t) {
    if (!counts.get(ch)) return false;
    counts.set(ch, counts.get(ch) - 1);
  }
  return true;
}
`,
          },
          time: 'O(n)',
          space: 'O(1)',
          verdict: 'Space is O(1) for a fixed alphabet (at most 26 letters). This **frequency map** pattern appears in dozens of problems.',
        },
      ],
      dryRun: {
        title: 'Count, then subtract',
        input: 's = "rat", t = "tar"',
        frames: [
          { caption: 'Same length (3), so we can continue. Counts start empty.', extra: { label: 'counts', items: [] } },
          { caption: 'Count the letters of s = "rat": r, a and t each appear once.', extra: { label: 'counts', items: ['r: 1', 'a: 1', 't: 1'] } },
          { caption: 'Now walk t = "tar". First letter t: count is 1, so subtract one.', vars: [['ch', 't']], extra: { label: 'counts', items: ['r: 1', 'a: 1', 't: 0'] } },
          { caption: 'Next letter a: count is 1, subtract one.', vars: [['ch', 'a']], extra: { label: 'counts', items: ['r: 1', 'a: 0', 't: 0'] } },
          { caption: 'Last letter r: count is 1, subtract one.', vars: [['ch', 'r']], extra: { label: 'counts', items: ['r: 0', 'a: 0', 't: 0'] } },
          { caption: 'Every letter was matched exactly once. Return True.', vars: [['result', 'True']] },
        ],
      },
      practice: {
        fn: { python: 'is_anagram', javascript: 'isAnagram' },
        starter: {
          python: `def is_anagram(s, t):
    # your code here
    pass
`,
          javascript: `function isAnagram(s, t) {
  // your code here
}
`,
        },
        cases: [
          { label: '"anagram" and "nagaram"', args: ['anagram', 'nagaram'], expected: true },
          { label: '"rat" and "car" use different letters', args: ['rat', 'car'], expected: false },
          { label: 'different lengths are not anagrams', args: ['ab', 'a'], expected: false },
          { label: 'two empty strings are anagrams', args: ['', ''], expected: true },
          { label: '"listen" and "silent"', args: ['listen', 'silent'], expected: true },
          { label: 'same letters but different counts', args: ['aab', 'abb'], expected: false },
          { label: 'one letter', args: ['a', 'a'], expected: true },
        ],
        hints: ['Words of different lengths can never be anagrams: check that first.', 'Sorting both words and comparing works. A faster idea: count the letters.', 'Add 1 for each letter in `s`, subtract 1 for each letter in `t`. Nothing may go below 0.'],
      },
      mistakes: ['Only checking that every letter of `t` is in `s` (this accepts "aab" and "abb").', 'Skipping the length check.', 'Using `counts[ch]` on a missing key (use `.get(ch, 0)` in Python).'],
      variants: ['Group a list of words into **anagram groups**.', 'Ignore spaces and capital letters.', 'Check if `t` is an anagram of **any part** of `s` (sliding window, later).'],
      recap: 'When order does not matter, count things with a hash map instead of sorting.',
    },
    {
      id: 'two-sum',
      title: 'Two sum',
      topic: 'Hash map lookup',
      blurb: 'Find two numbers that add up to a target, from slow double loops to one fast pass.',
      analogy: {
        emoji: '🤝',
        title: 'Finding your matching partner',
        text: 'You are at a party and need a partner whose number adds up to the target. Instead of asking everyone you meet (slow), you keep a **guest list** of the numbers you have already seen. For each new person you ask the list: "is the partner I need already on it?"',
      },
      problem: {
        statement: 'Write `two_sum(nums, target)` that returns the **indices** `[i, j]` (with `i < j`) of the two numbers that add up to `target`, or `None` if there is no such pair. Use each number at most once.',
        examples: [
          { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]', why: '2 + 7 = 9' },
          { input: 'nums = [3, 2, 4], target = 6', output: '[1, 2]', why: '2 + 4 = 6 (3 + 3 would reuse the same number)' },
          { input: 'nums = [1, 2, 3], target = 7', output: 'None' },
        ],
      },
      steps: [
        {
          title: 'Try every pair',
          tag: 'slow',
          idea: 'Check every pair of numbers. For each `i`, look at every `j` after it and see if `nums[i] + nums[j]` equals the target. It always works, but it is a loop inside a loop.',
          walk: ['For each position `i`.', 'For each later position `j`.', 'If the two numbers add up to the target, return `[i, j]`.', 'If nothing matched, return None.'],
          code: {
            python: `def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return None
`,
            javascript: `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
  return null;
}
`,
          },
          time: 'O(n²)',
          space: 'O(1)',
          verdict: 'Correct but slow: 10,000 numbers means about 50 million checks.',
        },
        {
          title: 'Remember what you have seen',
          tag: 'best',
          idea: 'For a number `x`, the partner you need is `target - x`. Keep a hash map of the numbers you have already passed (value → index). Looking something up in a hash map is O(1), so one pass over the list is enough.',
          walk: [
            'Create an empty map `seen` (number → its index).',
            'For each number `x` at index `i`, compute `need = target - x`.',
            'If `need` is already in `seen`, return `[seen[need], i]`.',
            'Otherwise remember this number: `seen[x] = i`.',
            'If the loop ends, return None.',
          ],
          code: {
            python: `def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:
            return [seen[need], i]
        seen[x] = i
    return None
`,
            javascript: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return null;
}
`,
          },
          time: 'O(n)',
          space: 'O(n)',
          verdict: 'We traded a little memory for a lot of speed. This is the most famous trade in interviews.',
        },
      ],
      dryRun: {
        title: 'Fill the map, look for the partner',
        input: 'nums = [2, 7, 11, 15], target = 9',
        frames: [
          { caption: 'Start with an empty map of numbers we have seen.', vars: [['target', '9']], array: { cells: [2, 7, 11, 15] }, extra: { label: 'seen', items: [] } },
          { caption: 'x = 2, so we need 9 - 2 = 7. Is 7 in the map? No. Remember 2 at index 0.', vars: [['i', '0'], ['x', '2'], ['need', '7']], array: { cells: [2, 7, 11, 15], pointers: { i: 0 } }, extra: { label: 'seen', items: ['2 → 0'] } },
          { caption: 'x = 7, so we need 9 - 7 = 2. Is 2 in the map? Yes, at index 0!', vars: [['i', '1'], ['x', '7'], ['need', '2']], array: { cells: [2, 7, 11, 15], pointers: { i: 1 }, marks: [0, 1] }, extra: { label: 'seen', items: ['2 → 0'] } },
          { caption: 'Return [0, 1]. We found the pair after looking at only two numbers.', vars: [['result', '[0, 1]']], array: { cells: [2, 7, 11, 15], marks: [0, 1] }, extra: { label: 'seen', items: ['2 → 0'] } },
        ],
      },
      practice: {
        fn: { python: 'two_sum', javascript: 'twoSum' },
        starter: {
          python: `def two_sum(nums, target):
    # your code here
    pass
`,
          javascript: `function twoSum(nums, target) {
  // your code here
}
`,
        },
        cases: [
          { label: 'the pair at the start', args: [[2, 7, 11, 15], 9], expected: [0, 1] },
          { label: 'the pair in the middle', args: [[3, 2, 4], 6], expected: [1, 2] },
          { label: 'two equal numbers', args: [[3, 3], 6], expected: [0, 1] },
          { label: 'a number cannot be used twice', args: [[3, 2, 4, 5], 6], expected: [1, 2] },
          { label: 'negative numbers', args: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] },
          { label: 'no pair gives None / null', args: [[1, 2, 3], 7], expected: null },
          { label: 'an empty list gives None / null', args: [[], 5], expected: null },
        ],
        hints: ['Brute force: two loops over every pair. It works, but try to avoid the inner loop.', 'For each number `x`, the number you need is `target - x`.', 'Keep a map of numbers you have already seen (value → index) and look up the partner in O(1). Add the current number to the map **after** checking it.'],
      },
      mistakes: ['Adding the current number to the map **before** checking, so a number pairs with itself.', 'Returning the numbers instead of the indices.', 'Using the same index twice.'],
      variants: ['Return **all** pairs that add up to the target.', 'The list is **sorted**: solve it with two pointers and O(1) memory.', 'Three sum: find three numbers that add up to 0 (later in the course).'],
      recap: 'A hash map turns "have I seen the partner I need?" from a search into an instant lookup.',
    },
    {
      id: 'contains-duplicate',
      title: 'Contains duplicate',
      topic: 'Sets',
      blurb: 'Decide if any value appears twice, with three approaches of increasing speed.',
      analogy: {
        emoji: '🎟️',
        title: 'A bouncer with a guest list',
        text: 'A bouncer ticks each name off as people enter. If someone arrives whose name is **already ticked**, there is a duplicate. A set is that guest list, and checking it takes no time at all.',
      },
      problem: {
        statement: 'Write `contains_duplicate(nums)` that returns `True` if any value appears at least twice, and `False` if every value is different.',
        examples: [
          { input: 'nums = [1, 2, 3, 1]', output: 'True' },
          { input: 'nums = [1, 2, 3, 4]', output: 'False' },
          { input: 'nums = []', output: 'False' },
        ],
      },
      steps: [
        {
          title: 'Compare every pair',
          tag: 'slow',
          idea: 'Compare each number with every number after it. If two are equal, you found a duplicate.',
          walk: ['For each position `i`.', 'For each later position `j`.', 'If `nums[i] == nums[j]`, return True.', 'If no pair matched, return False.'],
          code: {
            python: `def contains_duplicate(nums):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] == nums[j]:
                return True
    return False
`,
            javascript: `function containsDuplicate(nums) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] === nums[j]) return true;
    }
  }
  return false;
}
`,
          },
          time: 'O(n²)',
          space: 'O(1)',
          verdict: 'Works, but a list of 100,000 numbers would take billions of comparisons.',
        },
        {
          title: 'Sort, then look at neighbours',
          tag: 'better',
          idea: 'If the list is sorted, equal numbers sit next to each other. So sort a copy and compare each number with the one before it.',
          walk: ['Sort a copy of the list.', 'For each position from 1, compare with the previous one.', 'If they are equal, return True.', 'Otherwise return False.'],
          code: {
            python: `def contains_duplicate(nums):
    ordered = sorted(nums)
    for i in range(1, len(ordered)):
        if ordered[i] == ordered[i - 1]:
            return True
    return False
`,
            javascript: `function containsDuplicate(nums) {
  const ordered = [...nums].sort((a, b) => a - b);
  for (let i = 1; i < ordered.length; i++) {
    if (ordered[i] === ordered[i - 1]) return true;
  }
  return false;
}
`,
          },
          time: 'O(n log n)',
          space: 'O(n)',
          verdict: 'Much faster. Sorting is the cost.',
        },
        {
          title: 'Use a set',
          tag: 'best',
          idea: 'A set remembers what it has seen and can answer "is this in the set?" instantly. Walk through the list: if a number is already in the set, it is a duplicate. If not, add it.',
          walk: ['Create an empty set `seen`.', 'For each number: if it is in `seen`, return True.', 'Otherwise add it to `seen`.', 'If the loop ends, return False.'],
          code: {
            python: `def contains_duplicate(nums):
    seen = set()
    for n in nums:
        if n in seen:
            return True
        seen.add(n)
    return False
`,
            javascript: `function containsDuplicate(nums) {
  const seen = new Set();
  for (const n of nums) {
    if (seen.has(n)) return true;
    seen.add(n);
  }
  return false;
}
`,
          },
          time: 'O(n)',
          space: 'O(n)',
          verdict: 'Fastest, and it stops as soon as it finds the first duplicate.',
        },
      ],
      dryRun: {
        title: 'The set fills up until a repeat shows up',
        input: 'nums = [4, 7, 4, 9]',
        frames: [
          { caption: 'Start with an empty set.', array: { cells: [4, 7, 4, 9] }, extra: { label: 'seen', items: [] } },
          { caption: 'Look at 4. Is it in the set? No. Add it.', vars: [['n', '4']], array: { cells: [4, 7, 4, 9], pointers: { n: 0 } }, extra: { label: 'seen', items: ['4'] } },
          { caption: 'Look at 7. Not in the set. Add it.', vars: [['n', '7']], array: { cells: [4, 7, 4, 9], pointers: { n: 1 } }, extra: { label: 'seen', items: ['4', '7'] } },
          { caption: 'Look at 4 again. It is already in the set: a duplicate! Return True right away.', vars: [['n', '4'], ['result', 'True']], array: { cells: [4, 7, 4, 9], pointers: { n: 2 }, marks: [0, 2] }, extra: { label: 'seen', items: ['4', '7'] } },
        ],
      },
      practice: {
        fn: { python: 'contains_duplicate', javascript: 'containsDuplicate' },
        starter: {
          python: `def contains_duplicate(nums):
    # your code here
    pass
`,
          javascript: `function containsDuplicate(nums) {
  // your code here
}
`,
        },
        cases: [
          { label: 'a repeated number', args: [[1, 2, 3, 1]], expected: true },
          { label: 'all different', args: [[1, 2, 3, 4]], expected: false },
          { label: 'an empty list has no duplicates', args: [[]], expected: false },
          { label: 'one number has no duplicates', args: [[5]], expected: false },
          { label: 'all the same', args: [[1, 1, 1, 1]], expected: true },
          { label: 'duplicates far apart', args: [[9, 4, 6, 8, 3, 9]], expected: true },
          { label: 'negative numbers', args: [[-1, -2, -1]], expected: true },
        ],
        hints: ['You only need a yes/no answer, not which number repeated.', 'A set stores each value once and can check membership instantly.', 'Walk the list. If the number is already in the set, return True; otherwise add it. Return False at the end.'],
      },
      mistakes: ['Using a list instead of a set for `seen` (membership checks become O(n)).', 'Returning False inside the loop on the first number that is not a duplicate.', 'Forgetting the empty list.'],
      variants: ['Return the **first duplicate** value.', 'Contains duplicate **within k positions** of each other (sliding window, later).', 'Find **all** values that appear more than once.'],
      recap: 'A set answers "have I seen this before?" in constant time, which beats comparing every pair.',
    },
    {
      id: 'first-unique-char',
      title: 'First unique character',
      topic: 'Frequency map, two passes',
      blurb: 'Find the first letter that appears only once, by counting first and scanning second.',
      analogy: {
        emoji: '🗳️',
        title: 'Count the votes, then read the list',
        text: 'First, **count** how many times each letter appears (one pass). Then go back through the word from the start and stop at the first letter whose count is 1 (second pass). Counting first means you never have to guess.',
      },
      problem: {
        statement: 'Write `first_unique_char(s)` that returns the **index** of the first character that appears only once in `s`, or `-1` if there is none.',
        examples: [
          { input: 's = "leetcode"', output: '0', why: '"l" appears once and comes first' },
          { input: 's = "loveleetcode"', output: '2', why: '"l" and "o" repeat, "v" is the first single one' },
          { input: 's = "aabb"', output: '-1' },
        ],
      },
      steps: [
        {
          title: 'Count each letter again and again',
          tag: 'slow',
          idea: 'For each position, count how many times that letter appears in the whole string. The first one with a count of 1 is the answer. It is simple but recounts the same letters over and over.',
          walk: ['For each index `i`.', 'Count how many times `s[i]` appears in the whole string.', 'If the count is 1, return `i`.', 'If none, return -1.'],
          code: {
            python: `def first_unique_char(s):
    for i in range(len(s)):
        if s.count(s[i]) == 1:
            return i
    return -1
`,
            javascript: `function firstUniqueChar(s) {
  for (let i = 0; i < s.length; i++) {
    if (s.split(s[i]).length - 1 === 1) return i;
  }
  return -1;
}
`,
          },
          time: 'O(n²)',
          space: 'O(1)',
          verdict: 'Correct, but each `count` scans the entire string.',
        },
        {
          title: 'Count once, scan once',
          tag: 'best',
          idea: 'Build a frequency map in one pass. Then walk the string again from the left and return the first index whose letter has a count of exactly 1. Two simple passes beat one clever loop.',
          walk: ['Pass 1: build `counts` (letter → how many times).', 'Pass 2: for each index from the start, look up the count of that letter.', 'Return the first index where the count is 1.', 'If none, return -1.'],
          code: {
            python: `def first_unique_char(s):
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    for i, ch in enumerate(s):
        if counts[ch] == 1:
            return i
    return -1
`,
            javascript: `function firstUniqueChar(s) {
  const counts = new Map();
  for (const ch of s) {
    counts.set(ch, (counts.get(ch) || 0) + 1);
  }
  for (let i = 0; i < s.length; i++) {
    if (counts.get(s[i]) === 1) return i;
  }
  return -1;
}
`,
          },
          time: 'O(n)',
          space: 'O(1)',
          verdict: 'Space is O(1) because the alphabet is a fixed size. Counting first, then scanning, is a pattern you will use again.',
        },
      ],
      dryRun: {
        title: 'Two passes over "aabc"',
        input: 's = "aabc"',
        frames: [
          { caption: 'Pass 1: count every letter.', array: { cells: ['a', 'a', 'b', 'c'] }, extra: { label: 'counts', items: ['a: 2', 'b: 1', 'c: 1'] } },
          { caption: 'Pass 2: index 0 is "a". Its count is 2, so it repeats. Skip it.', vars: [['i', '0']], array: { cells: ['a', 'a', 'b', 'c'], pointers: { i: 0 } }, extra: { label: 'counts', items: ['a: 2', 'b: 1', 'c: 1'] } },
          { caption: 'Index 1 is "a" again. Count is 2. Skip.', vars: [['i', '1']], array: { cells: ['a', 'a', 'b', 'c'], pointers: { i: 1 } }, extra: { label: 'counts', items: ['a: 2', 'b: 1', 'c: 1'] } },
          { caption: 'Index 2 is "b". Its count is 1, so it is unique and it is the first one we met. Return 2.', vars: [['i', '2'], ['result', '2']], array: { cells: ['a', 'a', 'b', 'c'], pointers: { i: 2 }, marks: [2] }, extra: { label: 'counts', items: ['a: 2', 'b: 1', 'c: 1'] } },
        ],
      },
      practice: {
        fn: { python: 'first_unique_char', javascript: 'firstUniqueChar' },
        starter: {
          python: `def first_unique_char(s):
    # your code here
    pass
`,
          javascript: `function firstUniqueChar(s) {
  // your code here
}
`,
        },
        cases: [
          { label: '"leetcode" starts with a unique letter', args: ['leetcode'], expected: 0 },
          { label: '"loveleetcode"', args: ['loveleetcode'], expected: 2 },
          { label: 'no unique letter gives -1', args: ['aabb'], expected: -1 },
          { label: 'an empty string gives -1', args: [''], expected: -1 },
          { label: 'one letter', args: ['z'], expected: 0 },
          { label: 'the unique letter is last', args: ['aabbc'], expected: 4 },
          { label: 'it must be the FIRST unique letter', args: ['abcab'], expected: 2 },
        ],
        hints: ['Counting how often each letter appears makes the rest easy.', 'Build a map of letter → count in one pass.', 'Go through the string again **in order** and return the first index whose count is 1.'],
      },
      mistakes: ['Returning the letter instead of the index.', 'Looping over the map instead of the string (the map may not keep the original order).', 'Forgetting to return -1 at the end.'],
      variants: ['Return the **letter** instead of the index.', 'Find the **last** unique character.', 'Find the first character that appears **exactly twice**.'],
      recap: 'Two simple passes, count first and decide second, are often clearer and faster than one clever pass.',
    },
    {
      id: 'merge-sorted-arrays',
      title: 'Merge two sorted lists',
      topic: 'Two pointers on two inputs',
      blurb: 'Combine two sorted lists into one sorted list in a single pass.',
      analogy: {
        emoji: '🃏',
        title: 'Merging two sorted piles of cards',
        text: 'You hold two piles of cards, each already sorted. Look only at the **top card of each pile**, take the smaller one, and put it on the new pile. Repeat. You never need to look deeper into a pile.',
      },
      problem: {
        statement: 'Write `merge_sorted(a, b)` that takes two lists, each sorted from smallest to largest, and returns one new sorted list with all the numbers.',
        examples: [
          { input: 'a = [1, 3, 5], b = [2, 4, 6]', output: '[1, 2, 3, 4, 5, 6]' },
          { input: 'a = [], b = [1]', output: '[1]' },
          { input: 'a = [1, 1], b = [1]', output: '[1, 1, 1]', why: 'duplicates are all kept' },
        ],
      },
      steps: [
        {
          title: 'Join and sort',
          tag: 'slow',
          idea: 'Glue the two lists together and sort the result. It is the easiest thing to write. But it ignores the fact that both lists are already sorted, so it does extra work.',
          walk: ['Concatenate `a` and `b`.', 'Sort the combined list.', 'Return it.'],
          code: {
            python: `def merge_sorted(a, b):
    return sorted(a + b)
`,
            javascript: `function mergeSorted(a, b) {
  return [...a, ...b].sort((x, y) => x - y);
}
`,
          },
          time: 'O((n + m) log(n + m))',
          space: 'O(n + m)',
          verdict: 'Correct, but we are paying to sort data that is already mostly in order.',
        },
        {
          title: 'Two pointers, take the smaller',
          tag: 'best',
          idea: 'Use one pointer for each list, both starting at the front. Compare the two front numbers, take the smaller into the result, and move that pointer forward. When one list runs out, add everything left in the other.',
          walk: [
            'Set `i = 0` (for `a`) and `j = 0` (for `b`), and an empty `result`.',
            'While both lists still have numbers: take the smaller of `a[i]` and `b[j]` into `result` and move that pointer.',
            'One list is finished. Add whatever is left of the other list.',
            'Return `result`.',
          ],
          code: {
            python: `def merge_sorted(a, b):
    result = []
    i, j = 0, 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            result.append(a[i])
            i += 1
        else:
            result.append(b[j])
            j += 1
    result.extend(a[i:])
    result.extend(b[j:])
    return result
`,
            javascript: `function mergeSorted(a, b) {
  const result = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) {
      result.push(a[i]);
      i++;
    } else {
      result.push(b[j]);
      j++;
    }
  }
  while (i < a.length) result.push(a[i++]);
  while (j < b.length) result.push(b[j++]);
  return result;
}
`,
          },
          time: 'O(n + m)',
          space: 'O(n + m)',
          verdict: 'Each number is handled exactly once. This is the merge step of **merge sort**.',
        },
      ],
      dryRun: {
        title: 'Take the smaller front number',
        input: 'a = [1, 4], b = [2, 3]',
        frames: [
          { caption: 'Both pointers start at the front. Compare 1 and 2.', vars: [['i', '0'], ['j', '0']], array: { label: 'a', cells: [1, 4], pointers: { i: 0 } }, extra: { label: 'result', items: [] } },
          { caption: '1 is smaller: take 1 from a and move i.', vars: [['i', '1'], ['j', '0']], array: { label: 'a', cells: [1, 4], pointers: { i: 1 }, marks: [0] }, extra: { label: 'result', items: ['1'] } },
          { caption: 'Compare 4 (from a) and 2 (from b). 2 is smaller: take 2 and move j.', vars: [['i', '1'], ['j', '1']], array: { label: 'a', cells: [1, 4], pointers: { i: 1 }, marks: [0] }, extra: { label: 'result', items: ['1', '2'] } },
          { caption: 'Compare 4 and 3. 3 is smaller: take 3. Now b has no numbers left.', vars: [['i', '1'], ['j', '2']], array: { label: 'a', cells: [1, 4], pointers: { i: 1 }, marks: [0] }, extra: { label: 'result', items: ['1', '2', '3'] } },
          { caption: 'b is finished, so add what is left of a: 4. Done.', vars: [['i', '2'], ['j', '2']], array: { label: 'a', cells: [1, 4], marks: [0, 1] }, extra: { label: 'result', items: ['1', '2', '3', '4'] } },
        ],
      },
      practice: {
        fn: { python: 'merge_sorted', javascript: 'mergeSorted' },
        starter: {
          python: `def merge_sorted(a, b):
    # your code here
    pass
`,
          javascript: `function mergeSorted(a, b) {
  // your code here
}
`,
        },
        cases: [
          { label: 'interleaved lists', args: [[1, 3, 5], [2, 4, 6]], expected: [1, 2, 3, 4, 5, 6] },
          { label: 'the first list is empty', args: [[], [1]], expected: [1] },
          { label: 'the second list is empty', args: [[1, 2], []], expected: [1, 2] },
          { label: 'both are empty', args: [[], []], expected: [] },
          { label: 'duplicates are kept', args: [[1, 1], [1]], expected: [1, 1, 1] },
          { label: 'negative numbers', args: [[-3, 0], [-2, 5]], expected: [-3, -2, 0, 5] },
          { label: 'one list is entirely smaller', args: [[1, 2], [8, 9]], expected: [1, 2, 8, 9] },
        ],
        hints: ['Joining and sorting works, but try to use the fact that both lists are already sorted.', 'Keep one pointer per list. Compare `a[i]` and `b[j]` and take the smaller.', 'After the loop, one list may still have numbers left: add them to the end.'],
      },
      mistakes: ['Forgetting the leftovers after the main loop.', 'Using `<` and `<=` inconsistently (it will not break the answer, but be consistent).', 'Reading `a[i]` when `i` is already past the end of `a`.'],
      variants: ['Merge **k** sorted lists (use a heap, later).', 'Merge **in place** into the first list (it has extra room at the end).', 'Merge two sorted **linked lists**.'],
      recap: 'When inputs are already sorted, two pointers can combine them in a single pass.',
    },
    {
      id: 'move-zeroes',
      title: 'Move zeroes to the end',
      topic: 'Write pointer',
      blurb: 'Push every zero to the back while keeping the other numbers in their original order.',
      analogy: {
        emoji: '🧹',
        title: 'Sweeping the gaps closed',
        text: 'Imagine seats in a row with some empty. Walk along the row and move each person to the **leftmost free seat**. Everyone keeps their order, and all the empty seats end up on the right. A second pointer keeps track of "the next free seat".',
      },
      problem: {
        statement: 'Write `move_zeroes(nums)` that returns a new list with all zeros moved to the end and the other numbers in the same order as before.',
        examples: [
          { input: 'nums = [0, 1, 0, 3, 12]', output: '[1, 3, 12, 0, 0]' },
          { input: 'nums = [0]', output: '[0]' },
          { input: 'nums = [1, 2]', output: '[1, 2]' },
        ],
      },
      steps: [
        {
          title: 'Two lists, then join',
          tag: 'idea',
          idea: 'Collect the non-zero numbers in one list, count the zeros, and put the zeros after. Easy to get right.',
          walk: ['Create `result` with only the non-zero numbers, in order.', 'Count how many zeros there were.', 'Add that many zeros to the end.', 'Return `result`.'],
          code: {
            python: `def move_zeroes(nums):
    result = [n for n in nums if n != 0]
    result += [0] * (len(nums) - len(result))
    return result
`,
            javascript: `function moveZeroes(nums) {
  const result = nums.filter((n) => n !== 0);
  while (result.length < nums.length) result.push(0);
  return result;
}
`,
          },
          time: 'O(n)',
          space: 'O(n)',
          verdict: 'Already optimal in time. It uses a second list, though.',
        },
        {
          title: 'A write pointer on one copy',
          tag: 'best',
          idea: 'Keep a `write` position, the next free seat on the left. Walk through the numbers: every non-zero number is written at `write`, and `write` moves forward. When the walk is over, fill the rest with zeros. Interviewers often ask for this "in place" version.',
          walk: [
            'Copy the list so the input is not changed, and set `write = 0`.',
            'For each number: if it is not zero, put it at position `write` and add 1 to `write`.',
            'Fill every position from `write` to the end with 0.',
            'Return the list.',
          ],
          code: {
            python: `def move_zeroes(nums):
    arr = list(nums)
    write = 0
    for n in nums:
        if n != 0:
            arr[write] = n
            write += 1
    for i in range(write, len(arr)):
        arr[i] = 0
    return arr
`,
            javascript: `function moveZeroes(nums) {
  const arr = [...nums];
  let write = 0;
  for (const n of nums) {
    if (n !== 0) {
      arr[write] = n;
      write++;
    }
  }
  for (let i = write; i < arr.length; i++) arr[i] = 0;
  return arr;
}
`,
          },
          time: 'O(n)',
          space: 'O(1)',
          verdict: 'Apart from the copy we made for safety, the work itself needs no extra list. Remove the copy and it works fully in place.',
        },
      ],
      dryRun: {
        title: 'The write pointer closes the gaps',
        input: 'nums = [0, 1, 0, 3]',
        frames: [
          { caption: 'write = 0 is where the next non-zero number will go.', vars: [['write', '0']], array: { cells: [0, 1, 0, 3], pointers: { write: 0 } } },
          { caption: 'Read 0: it is a zero, skip it. write stays at 0.', vars: [['write', '0']], array: { cells: [0, 1, 0, 3], pointers: { write: 0 } } },
          { caption: 'Read 1: non-zero. Write it at position 0, then write = 1.', vars: [['write', '1']], array: { cells: [1, 1, 0, 3], pointers: { write: 1 }, marks: [0] } },
          { caption: 'Read 0: skip it.', vars: [['write', '1']], array: { cells: [1, 1, 0, 3], pointers: { write: 1 }, marks: [0] } },
          { caption: 'Read 3: non-zero. Write it at position 1, then write = 2.', vars: [['write', '2']], array: { cells: [1, 3, 0, 3], pointers: { write: 2 }, marks: [0, 1] } },
          { caption: 'All numbers read. Fill from position 2 to the end with zeros.', vars: [['write', '2']], array: { cells: [1, 3, 0, 0], marks: [0, 1, 2, 3] } },
        ],
      },
      practice: {
        fn: { python: 'move_zeroes', javascript: 'moveZeroes' },
        starter: {
          python: `def move_zeroes(nums):
    # your code here
    pass
`,
          javascript: `function moveZeroes(nums) {
  // your code here
}
`,
        },
        cases: [
          { label: 'zeros move to the end', args: [[0, 1, 0, 3, 12]], expected: [1, 3, 12, 0, 0] },
          { label: 'a single zero', args: [[0]], expected: [0] },
          { label: 'no zeros: nothing changes', args: [[1, 2]], expected: [1, 2] },
          { label: 'an empty list', args: [[]], expected: [] },
          { label: 'leading zeros', args: [[0, 0, 1]], expected: [1, 0, 0] },
          { label: 'order of the other numbers is kept', args: [[4, 0, 2, 0, 9]], expected: [4, 2, 9, 0, 0] },
          { label: 'all zeros', args: [[0, 0, 0]], expected: [0, 0, 0] },
        ],
        hints: ['The easiest way: keep the non-zero numbers, then add the zeros.', 'To avoid a second list, use a `write` index: the next place a non-zero number belongs.', 'After copying all non-zero numbers forward, fill the remaining positions with 0.'],
      },
      mistakes: ['Sorting the list (this changes the order of the other numbers).', 'Removing items from a list while looping over it.', 'Forgetting to fill the end with zeros after the write pointer.'],
      variants: ['Move all **occurrences of a value** to the end (not just 0).', 'Remove duplicates from a **sorted** list in place.', 'Partition: put all **even** numbers before the odd ones.'],
      recap: 'A write pointer lets you rebuild an array in one pass: read everything, write only what you keep.',
    },
    {
      id: 'valid-parentheses',
      title: 'Valid parentheses',
      topic: 'Stack',
      blurb: 'Check that every bracket is closed in the right order, using a stack.',
      analogy: {
        emoji: '🥞',
        title: 'A stack of plates',
        text: 'You can only add or take a plate from the **top** of the stack. Opening brackets are plates you put on. A closing bracket must match the plate on top, the most recent one. If it does not match, the order is wrong.',
      },
      problem: {
        statement: 'Write `is_valid(s)` for a string containing only `( ) [ ] { }`. Return `True` if every opening bracket is closed by the same kind of bracket, in the correct order.',
        examples: [
          { input: 's = "()[]{}"', output: 'True' },
          { input: 's = "(]"', output: 'False', why: 'the type does not match' },
          { input: 's = "([)]"', output: 'False', why: 'closed in the wrong order' },
          { input: 's = "{[]}"', output: 'True', why: 'properly nested' },
        ],
      },
      steps: [
        {
          title: 'Keep deleting matching pairs',
          tag: 'slow',
          idea: 'If the string is valid, there must be a touching pair like `()` or `[]` somewhere. Delete such a pair, and repeat until nothing is left (valid) or nothing can be deleted (invalid). It is clever, but each delete rebuilds the string.',
          walk: ['Repeat while the string still contains "()", "[]" or "{}".', 'Remove every such pair.', 'When the loop stops, the string must be empty to be valid.'],
          code: {
            python: `def is_valid(s):
    while "()" in s or "[]" in s or "{}" in s:
        s = s.replace("()", "").replace("[]", "").replace("{}", "")
    return s == ""
`,
            javascript: `function isValid(s) {
  while (s.includes("()") || s.includes("[]") || s.includes("{}")) {
    s = s.replace("()", "").replace("[]", "").replace("{}", "");
  }
  return s === "";
}
`,
          },
          time: 'O(n²)',
          space: 'O(n)',
          verdict: 'Correct, but a long string is rescanned many times.',
        },
        {
          title: 'Use a stack',
          tag: 'best',
          idea: 'Push every opening bracket on a stack. When you see a closing bracket, the most recent unclosed opening bracket (the top of the stack) must be its partner. If not, return False. If the stack is empty at the end, every bracket was closed.',
          walk: [
            'Create an empty `stack` and a lookup of closing → opening brackets.',
            'For each character: if it is an opening bracket, push it.',
            'If it is a closing bracket: the stack must not be empty and its top must be the matching opening bracket. Pop it. Otherwise return False.',
            'At the end, return True only if the stack is empty (no unclosed brackets).',
          ],
          code: {
            python: `def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return len(stack) == 0
`,
            javascript: `function isValid(s) {
  const pairs = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  for (const ch of s) {
    if (ch in pairs) {
      if (stack.length === 0 || stack.pop() !== pairs[ch]) return false;
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;
}
`,
          },
          time: 'O(n)',
          space: 'O(n)',
          verdict: 'One pass. "The most recent thing must be matched first" is the signal to think **stack**.',
        },
      ],
      dryRun: {
        title: 'Push openers, pop on closers',
        input: 's = "{[]}"',
        frames: [
          { caption: 'Start with an empty stack.', array: { cells: ['{', '[', ']', '}'] }, extra: { label: 'stack (top on the right)', items: [] } },
          { caption: '"{" is an opening bracket: push it.', vars: [['ch', '{']], array: { cells: ['{', '[', ']', '}'], pointers: { ch: 0 } }, extra: { label: 'stack (top on the right)', items: ['{'] } },
          { caption: '"[" is an opening bracket: push it.', vars: [['ch', '[']], array: { cells: ['{', '[', ']', '}'], pointers: { ch: 1 } }, extra: { label: 'stack (top on the right)', items: ['{', '['] } },
          { caption: '"]" closes a bracket. The top is "[", which matches. Pop it.', vars: [['ch', ']']], array: { cells: ['{', '[', ']', '}'], pointers: { ch: 2 }, marks: [1, 2] }, extra: { label: 'stack (top on the right)', items: ['{'] } },
          { caption: '"}" closes a bracket. The top is "{", which matches. Pop it.', vars: [['ch', '}']], array: { cells: ['{', '[', ']', '}'], pointers: { ch: 3 }, marks: [0, 1, 2, 3] }, extra: { label: 'stack (top on the right)', items: [] } },
          { caption: 'The stack is empty, so every bracket was closed correctly. Return True.', vars: [['result', 'True']], extra: { label: 'stack (top on the right)', items: [] } },
        ],
      },
      practice: {
        fn: { python: 'is_valid', javascript: 'isValid' },
        starter: {
          python: `def is_valid(s):
    # your code here
    pass
`,
          javascript: `function isValid(s) {
  // your code here
}
`,
        },
        cases: [
          { label: 'one pair', args: ['()'], expected: true },
          { label: 'three kinds in a row', args: ['()[]{}'], expected: true },
          { label: 'wrong type of closing bracket', args: ['(]'], expected: false },
          { label: 'closed in the wrong order', args: ['([)]'], expected: false },
          { label: 'properly nested', args: ['{[]}'], expected: true },
          { label: 'an empty string is valid', args: [''], expected: true },
          { label: 'an unclosed opening bracket', args: ['(('], expected: false },
          { label: 'a closing bracket with nothing open', args: [']'], expected: false },
        ],
        hints: ['The most recently opened bracket must be closed first. Which data structure gives you "the most recent"?', 'Push opening brackets onto a stack. For a closing bracket, check the top of the stack.', 'Handle an empty stack before you look at the top, and check that the stack is empty at the end.'],
      },
      mistakes: ['Popping from an empty stack when a closing bracket comes first (like "]").', 'Returning True without checking that the stack is empty at the end (like "((").', 'Only counting brackets instead of matching types and order.'],
      variants: ['Find the length of the **longest valid** parentheses substring.', 'Remove the **minimum** number of brackets to make a string valid.', 'Evaluate a simple expression such as `3 + (2 * 4)`.'],
      recap: 'Whenever the most recent unmatched thing must be handled first, use a stack.',
    },
  ],
}
