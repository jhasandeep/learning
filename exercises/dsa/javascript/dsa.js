// DSA solutions (Technical Suneja DSA playlist) in JavaScript.
//
// Each snippet sits between `// @snippet <name>` and `// @end` markers so the
// notes builder can embed it. Run `node dsa.js` to execute the self-tests.

// @snippet bigo_slow
function addUptoSlow(n) {        // O(n)
  let total = 0;
  for (let i = 1; i <= n; i++) total += i;
  return total;
}
// @end

// @snippet bigo_fast
function addUptoFast(n) {        // O(1)
  return (n * (n + 1)) / 2;
}
// @end

// @snippet sum_zero_brute
function sumZeroBrute(arr) {        // O(n^2)
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] + arr[j] === 0) {
        return [arr[i], arr[j]];
      }
    }
  }
  return undefined;
}
// @end

// @snippet sum_zero
function sumZero(arr) {             // sorted input
  let left = 0;                     // O(n), O(1)
  let right = arr.length - 1;
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === 0) return [arr[left], arr[right]];
    else if (sum > 0) right--;      // need smaller
    else left++;                    // need bigger
  }
  return undefined;
}
// @end

// @snippet anagram
function isAnagram(a, b) {          // O(n)
  if (a.length !== b.length) return false;
  const freq = {};
  for (const ch of a) {             // count a
    freq[ch] = (freq[ch] || 0) + 1;
  }
  for (const ch of b) {             // use up with b
    if (!freq[ch]) return false;
    freq[ch]--;
  }
  return true;
}
// @end

// @snippet count_unique
function countUnique(arr) {         // sorted input
  if (arr.length === 0) return 0;   // O(n), O(1)
  let i = 0;                        // last unique
  for (let j = 1; j < arr.length; j++) {
    if (arr[j] !== arr[i]) {
      i++;
      arr[i] = arr[j];              // move it forward
    }
  }
  return i + 1;
}

// easy way (O(n) extra space): new Set(arr).size
// @end

// @snippet max_sum_brute
function maxSumBrute(arr, k) {      // O(n*k)
  if (arr.length < k) return null;
  let best = -Infinity;
  for (let i = 0; i <= arr.length - k; i++) {
    let sum = 0;
    for (let j = 0; j < k; j++) sum += arr[i + j];
    best = Math.max(best, sum);
  }
  return best;
}
// @end

// @snippet max_sum
function maxSum(arr, k) {           // O(n)
  if (arr.length < k) return null;
  let window = 0;
  for (let i = 0; i < k; i++) window += arr[i];
  let best = window;                // first window
  for (let i = k; i < arr.length; i++) {
    window += arr[i] - arr[i - k];  // slide
    best = Math.max(best, window);
  }
  return best;
}
// @end

// @snippet binary_search
function binarySearch(arr, target) { // O(log n)
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1; // right
    else hi = mid - 1;                   // left
  }
  return -1;
}
// @end

// @snippet same_brute
function sameBrute(a, b) {          // O(n^2)
  if (a.length !== b.length) return false;
  b = [...b];                       // don't mutate input
  for (const x of a) {
    const idx = b.indexOf(x * x);   // O(n) scan
    if (idx === -1) return false;
    b.splice(idx, 1);
  }
  return true;
}
// @end

// @snippet same
function same(a, b) {               // O(n)
  if (a.length !== b.length) return false;
  const fa = {}, fb = {};
  for (const x of a) fa[x] = (fa[x] || 0) + 1;
  for (const y of b) fb[y] = (fb[y] || 0) + 1;
  for (const key in fa) {
    if (fb[key * key] !== fa[key]) return false;
  }
  return true;
}
// @end

// @snippet countdown
function countdown(n) {
  if (n <= 0) {                     // 1. base case
    console.log("Done!");
    return;
  }
  console.log(n);
  countdown(n - 1);                 // 2. smaller input
}
// @end

// @snippet factorial
function factorial(n) {             // O(n) time+stack
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

function sumRange(n) {              // 1 + 2 + ... + n
  if (n === 1) return 1;
  return n + sumRange(n - 1);
}
// @end

// @snippet adv_recursion
function power(base, exp) {
  if (exp === 0) return 1;
  return base * power(base, exp - 1);
}

function product(arr) {
  if (arr.length === 0) return 1;
  return arr[0] * product(arr.slice(1));
}

function fib(n) {                   // O(2^n)!
  if (n <= 2) return 1;
  return fib(n - 1) + fib(n - 2);
}
// @end

// @snippet fib_memo
function fibMemo(n, memo = {}) {    // O(n)
  if (n <= 2) return 1;
  if (memo[n]) return memo[n];
  memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  return memo[n];
}
// @end

// @snippet reverse_rec
function reverse(s) {
  if (s.length <= 1) return s;
  return reverse(s.slice(1)) + s[0];
}
// @end

// @snippet helper
function collectOdds(arr) {
  const result = [];                // outer state

  function helper(sub) {            // recursive helper
    if (sub.length === 0) return;
    if (sub[0] % 2 !== 0) result.push(sub[0]);
    helper(sub.slice(1));
  }

  helper(arr);
  return result;
}
// @end

// @snippet pure
function collectOddsPure(arr) {
  if (arr.length === 0) return [];
  const first = arr[0] % 2 !== 0 ? [arr[0]] : [];
  return first.concat(collectOddsPure(arr.slice(1)));
}
// @end

// @snippet linear_search
function linearSearch(arr, target) { // O(n)
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}

// built-ins: arr.includes(x), arr.indexOf(x)
// @end

// @snippet bubble
function bubbleSort(arr) {          // O(n^2)
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}
// @end

// @snippet bubble_opt
function bubbleSortOpt(arr) {
  for (let i = arr.length - 1; i > 0; i--) { // shrink end
    let swapped = false;
    for (let j = 0; j < i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    if (!swapped) break;            // best case O(n)
  }
  return arr;
}
// @end

// @snippet selection
function selectionSort(arr) {       // O(n^2)
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let smallest = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[smallest]) smallest = j;
    }
    if (smallest !== i) {           // 1 swap per pass
      [arr[i], arr[smallest]] = [arr[smallest], arr[i]];
    }
  }
  return arr;
}
// @end

// @snippet insertion
function insertionSort(arr) {       // O(n^2), best O(n)
  for (let i = 1; i < arr.length; i++) {
    const current = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > current) {
      arr[j + 1] = arr[j];          // shift right
      j--;
    }
    arr[j + 1] = current;           // drop in the gap
  }
  return arr;
}
// @end

// @snippet max_char
function maxChar(s) {               // O(n)
  const freq = {};
  for (const ch of s) freq[ch] = (freq[ch] || 0) + 1;
  let best = "", bestCount = 0;
  for (const ch in freq) {
    if (freq[ch] > bestCount) {
      best = ch;
      bestCount = freq[ch];
    }
  }
  return best;
}
// @end

// @snippet palindrome
function isPalindrome(s) {          // O(n), O(1)
  let left = 0, right = s.length - 1;
  while (left < right) {
    if (s[left] !== s[right]) return false;
    left++;
    right--;
  }
  return true;
}

// quick: s === [...s].reverse().join("")
// @end

// @snippet palindrome_clean
function isPalindromeClean(s) {     // "A man, a plan..."
  s = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return s === [...s].reverse().join("");
}
// @end

// @snippet longest_substring
function longestUnique(s) {         // O(n)
  const lastSeen = new Map();       // char -> index
  let start = 0, best = 0;
  for (let end = 0; end < s.length; end++) {
    const ch = s[end];
    if (lastSeen.has(ch) && lastSeen.get(ch) >= start) {
      start = lastSeen.get(ch) + 1; // jump past dup
    }
    lastSeen.set(ch, end);
    best = Math.max(best, end - start + 1);
  }
  return best;
}
// @end

if (require.main === module) {
  const assert = require("node:assert/strict");

  assert.equal(addUptoSlow(100), 5050);
  assert.equal(addUptoFast(100), 5050);
  for (const f of [sumZeroBrute, sumZero]) {
    assert.deepEqual(f([-4, -3, -2, -1, 0, 1, 2, 5]), [-2, 2]);
    assert.equal(f([-3, -2, -1, 0, 5]), undefined);
    assert.equal(f([]), undefined);
  }
  assert.ok(isAnagram("anagram", "nagaram") && !isAnagram("rat", "car"));
  assert.ok(!isAnagram("aaz", "zza") && isAnagram("", ""));
  assert.equal(countUnique([1, 1, 1, 2, 3, 3, 4, 4, 5, 6]), 6);
  assert.equal(countUnique([]), 0);
  assert.equal(countUnique([7]), 1);
  for (const f of [maxSumBrute, maxSum]) {
    assert.equal(f([2, 6, 9, 2, 1, 8, 5, 6, 3], 3), 19);
    assert.equal(f([-3, -1, -2], 2), -3);
    assert.equal(f([1], 2), null);
  }
  const arr = Array.from({ length: 34 }, (_, i) => i * 3);
  for (let t = -2; t < 102; t++) {
    assert.equal(binarySearch(arr, t), arr.indexOf(t));
    assert.equal(linearSearch(arr, t), arr.indexOf(t));
  }
  for (const f of [sameBrute, same]) {
    assert.ok(f([1, 2, 3, 2], [9, 1, 4, 4]));
    assert.ok(!f([1, 2, 3], [1, 9]));
    assert.ok(!f([1, 2, 1], [4, 4, 1]));
  }
  assert.equal(factorial(5), 120);
  assert.equal(sumRange(4), 10);
  assert.equal(power(2, 10), 1024);
  assert.equal(product([1, 2, 3, 10]), 60);
  assert.equal(fib(10), 55);
  assert.equal(fibMemo(10), 55);
  assert.equal(fibMemo(50), 12586269025);
  assert.equal(reverse("suneja"), "ajenus");
  assert.deepEqual(collectOdds([1, 2, 3, 4, 5]), [1, 3, 5]);
  assert.deepEqual(collectOddsPure([1, 2, 3, 4, 5]), [1, 3, 5]);
  for (let r = 0; r < 200; r++) {
    const data = Array.from({ length: Math.floor(Math.random() * 25) },
      () => Math.floor(Math.random() * 101) - 50);
    const expected = [...data].sort((x, y) => x - y);
    for (const f of [bubbleSort, bubbleSortOpt, selectionSort, insertionSort]) {
      assert.deepEqual(f([...data]), expected);
    }
  }
  assert.equal(maxChar("javascript"), "a");
  assert.equal(maxChar("aabbbcc"), "b");
  assert.ok(isPalindrome("madam") && isPalindrome("") && !isPalindrome("abca"));
  assert.ok(isPalindromeClean("A man, a plan, a canal: Panama"));
  for (const [s, n] of [["abcabcbb", 3], ["bbbbb", 1], ["pwwkew", 3], ["", 0], ["abba", 2], ["dvdf", 3]]) {
    assert.equal(longestUnique(s), n, s);
  }
  // sort() gotcha shown in the notes
  assert.deepEqual([10, 1, 5, 100].sort(), [1, 10, 100, 5]);
  console.log("all javascript tests passed");
}
