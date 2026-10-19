"""DSA solutions (Technical Suneja DSA playlist) in Python.

Each snippet sits between `# @snippet <name>` and `# @end` markers so the
notes builder can embed it. Run this file to execute the self-tests.
"""


# @snippet bigo_slow
def add_upto_slow(n):          # O(n)
    total = 0
    for i in range(1, n + 1):
        total += i
    return total
# @end


# @snippet bigo_fast
def add_upto_fast(n):          # O(1)
    return n * (n + 1) // 2
# @end


# @snippet sum_zero_brute
def sum_zero_brute(arr):            # O(n^2)
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] + arr[j] == 0:
                return [arr[i], arr[j]]
    return None
# @end


# @snippet sum_zero
def sum_zero(arr):                  # sorted input
    left, right = 0, len(arr) - 1   # O(n), O(1)
    while left < right:
        total = arr[left] + arr[right]
        if total == 0:
            return [arr[left], arr[right]]
        elif total > 0:
            right -= 1              # need smaller
        else:
            left += 1               # need bigger
    return None
# @end


# @snippet anagram
def is_anagram(a, b):               # O(n)
    if len(a) != len(b):
        return False
    freq = {}
    for ch in a:                    # count a
        freq[ch] = freq.get(ch, 0) + 1
    for ch in b:                    # use up with b
        if not freq.get(ch):
            return False
        freq[ch] -= 1
    return True

# one-liner: Counter(a) == Counter(b)
# @end


# @snippet count_unique
def count_unique(arr):              # sorted input
    if not arr:                     # O(n), O(1)
        return 0
    i = 0                           # last unique
    for j in range(1, len(arr)):
        if arr[j] != arr[i]:
            i += 1
            arr[i] = arr[j]         # move it forward
    return i + 1

# easy way (O(n) extra space): len(set(arr))
# @end


# @snippet max_sum_brute
def max_sum_brute(arr, k):          # O(n*k)
    if len(arr) < k:
        return None
    best = float('-inf')
    for i in range(len(arr) - k + 1):
        best = max(best, sum(arr[i:i + k]))
    return best
# @end


# @snippet max_sum
def max_sum(arr, k):                # O(n)
    if len(arr) < k:
        return None
    window = sum(arr[:k])           # first window
    best = window
    for i in range(k, len(arr)):
        window += arr[i] - arr[i - k]   # slide
        best = max(best, window)
    return best
# @end


# @snippet binary_search
def binary_search(arr, target):     # O(log n)
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1            # go right
        else:
            hi = mid - 1            # go left
    return -1
# @end


# @snippet same_brute
def same_brute(a, b):               # O(n^2)
    if len(a) != len(b):
        return False
    b = list(b)                     # don't mutate input
    for x in a:
        if x * x not in b:          # .index is O(n)
            return False
        b.remove(x * x)
    return True
# @end


# @snippet same
def same(a, b):                     # O(n)
    if len(a) != len(b):
        return False
    fa, fb = {}, {}
    for x in a:
        fa[x] = fa.get(x, 0) + 1
    for y in b:
        fb[y] = fb.get(y, 0) + 1
    for x, cnt in fa.items():
        if fb.get(x * x) != cnt:
            return False
    return True
# @end


# @snippet countdown
def countdown(n):
    if n <= 0:                      # 1. base case
        print("Done!")
        return
    print(n)
    countdown(n - 1)                # 2. smaller input
# @end


# @snippet factorial
def factorial(n):                   # O(n) time+stack
    if n <= 1:
        return 1
    return n * factorial(n - 1)

def sum_range(n):                   # 1 + 2 + ... + n
    if n == 1:
        return 1
    return n + sum_range(n - 1)
# @end


# @snippet adv_recursion
def power(base, exp):
    if exp == 0:
        return 1
    return base * power(base, exp - 1)

def product(arr):
    if not arr:
        return 1
    return arr[0] * product(arr[1:])

def fib(n):                         # O(2^n)!
    if n <= 2:
        return 1
    return fib(n - 1) + fib(n - 2)
# @end


# @snippet fib_memo
def fib_memo(n, memo=None):         # O(n)
    memo = {} if memo is None else memo
    if n <= 2:
        return 1
    if n not in memo:
        memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)
    return memo[n]
# @end


# @snippet reverse_rec
def reverse(s):
    if len(s) <= 1:
        return s
    return reverse(s[1:]) + s[0]
# @end


# @snippet helper
def collect_odds(arr):
    result = []                     # outer state

    def helper(sub):                # recursive helper
        if not sub:
            return
        if sub[0] % 2 != 0:
            result.append(sub[0])
        helper(sub[1:])

    helper(arr)
    return result
# @end


# @snippet pure
def collect_odds_pure(arr):
    if not arr:
        return []
    first = [arr[0]] if arr[0] % 2 else []
    return first + collect_odds_pure(arr[1:])
# @end


# @snippet linear_search
def linear_search(arr, target):     # O(n)
    for i, value in enumerate(arr):
        if value == target:
            return i
    return -1

# built-ins: x in arr, arr.index(x)
# @end


# @snippet bubble
def bubble_sort(arr):               # O(n^2)
    n = len(arr)
    for i in range(n):
        for j in range(n - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
# @end


# @snippet bubble_opt
def bubble_sort_opt(arr):
    n = len(arr)
    for i in range(n - 1, 0, -1):   # shrink end
        swapped = False
        for j in range(i):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:             # already sorted
            break                   # best case O(n)
    return arr
# @end


# @snippet selection
def selection_sort(arr):            # O(n^2)
    n = len(arr)
    for i in range(n - 1):
        smallest = i
        for j in range(i + 1, n):
            if arr[j] < arr[smallest]:
                smallest = j
        if smallest != i:           # 1 swap per pass
            arr[i], arr[smallest] = arr[smallest], arr[i]
    return arr
# @end


# @snippet insertion
def insertion_sort(arr):            # O(n^2), best O(n)
    for i in range(1, len(arr)):
        current = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > current:
            arr[j + 1] = arr[j]     # shift right
            j -= 1
        arr[j + 1] = current        # drop in the gap
    return arr
# @end


# @snippet max_char
def max_char(s):                    # O(n)
    freq = {}
    for ch in s:
        freq[ch] = freq.get(ch, 0) + 1
    best, best_count = '', 0
    for ch, cnt in freq.items():
        if cnt > best_count:
            best, best_count = ch, cnt
    return best

# Counter(s).most_common(1)[0][0]
# @end


# @snippet palindrome
def is_palindrome(s):               # O(n), O(1)
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    return True

# quick: s == s[::-1]
# @end


# @snippet palindrome_clean
def is_palindrome_clean(s):         # "A man, a plan..."
    s = ''.join(c.lower() for c in s if c.isalnum())
    return s == s[::-1]
# @end


# @snippet longest_substring
def longest_unique(s):              # O(n)
    last_seen = {}                  # char -> index
    start = best = 0
    for end, ch in enumerate(s):
        if ch in last_seen and last_seen[ch] >= start:
            start = last_seen[ch] + 1   # jump past dup
        last_seen[ch] = end
        best = max(best, end - start + 1)
    return best
# @end


if __name__ == "__main__":
    import random
    from collections import Counter

    assert add_upto_slow(100) == add_upto_fast(100) == 5050
    for f in (sum_zero_brute, sum_zero):
        assert f([-4, -3, -2, -1, 0, 1, 2, 5]) == [-2, 2]
        assert f([-3, -2, -1, 0, 5]) is None
        assert f([]) is None
    assert is_anagram("anagram", "nagaram") and not is_anagram("rat", "car")
    assert not is_anagram("aaz", "zza") and is_anagram("", "")
    assert count_unique([1, 1, 1, 2, 3, 3, 4, 4, 5, 6]) == 6
    assert count_unique([]) == 0 and count_unique([7]) == 1
    for f in (max_sum_brute, max_sum):
        assert f([2, 6, 9, 2, 1, 8, 5, 6, 3], 3) == 19
        assert f([-3, -1, -2], 2) == -3
        assert f([1], 2) is None
    arr = list(range(0, 100, 3))
    for t in range(-2, 102):
        expected = arr.index(t) if t in arr else -1
        assert binary_search(arr, t) == expected == linear_search(arr, t)
    for f in (same_brute, same):
        assert f([1, 2, 3, 2], [9, 1, 4, 4])
        assert not f([1, 2, 3], [1, 9])
        assert not f([1, 2, 1], [4, 4, 1])
    assert factorial(5) == 120 and sum_range(4) == 10
    assert power(2, 10) == 1024 and product([1, 2, 3, 10]) == 60
    assert fib(10) == fib_memo(10) == 55 and fib_memo(80) == 23416728348467685
    assert reverse("suneja") == "ajenus"
    assert collect_odds([1, 2, 3, 4, 5]) == collect_odds_pure([1, 2, 3, 4, 5]) == [1, 3, 5]
    for _ in range(200):
        data = [random.randint(-50, 50) for _ in range(random.randint(0, 25))]
        for f in (bubble_sort, bubble_sort_opt, selection_sort, insertion_sort):
            assert f(list(data)) == sorted(data)
    assert max_char("javascript") == "a" and max_char("aabbbcc") == "b"
    assert Counter("hello").most_common(1)[0][0] == "l" == max_char("hello")
    assert is_palindrome("madam") and is_palindrome("") and not is_palindrome("abca")
    assert is_palindrome_clean("A man, a plan, a canal: Panama")
    for s, n in [("abcabcbb", 3), ("bbbbb", 1), ("pwwkew", 3), ("", 0), ("abba", 2), ("dvdf", 3)]:
        assert longest_unique(s) == n, s
    print("all python tests passed")
