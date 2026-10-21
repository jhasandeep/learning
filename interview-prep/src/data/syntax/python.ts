import type { SyntaxSet } from './types'

export const python: SyntaxSet = {
  id: 'python',
  title: 'Python',
  snippets: [
    {
      id: 'comprehensions',
      title: 'List, dict and set comprehensions',
      lang: 'python',
      code: `nums = [3, 1, 4, 1, 5, 9, 2, 6]
squares = [n * n for n in nums]
evens = [n for n in nums if n % 2 == 0]
labels = ['even' if n % 2 == 0 else 'odd' for n in nums]
grid = [[0] * 3 for _ in range(3)]
flat = [x for row in grid for x in row]

words = ['apple', 'bob', 'cat']
lengths = {w: len(w) for w in words}
inverted = {v: k for k, v in lengths.items()}
remainders = {n % 3 for n in nums}
total = sum(n * n for n in nums)

for i, (word, n) in enumerate(zip(words, nums), start=1):
  print(i, word, n)`,
      note: 'The bread and butter of Python rounds. Note `[[0] * 3 for _ in range(3)]`, not `[[0] * 3] * 3`, which shares **one inner list**.',
    },
    {
      id: 'exceptions',
      title: 'Exception handling',
      lang: 'python',
      code: `class InsufficientFunds(Exception):
  def __init__(self, needed: float):
    super().__init__(f'need {needed:.2f} more')
    self.needed = needed

def withdraw(balance: float, amount: float) -> float:
  if amount > balance:
    raise InsufficientFunds(amount - balance)
  return balance - amount

try:
  balance = withdraw(100, 150)
except InsufficientFunds as e:
  print('declined:', e)
except (ValueError, TypeError) as e:
  raise RuntimeError('bad input') from e
finally:
  print('done')`,
      note: 'Custom exceptions subclass `Exception`; catch the specific ones first. `raise ... from e` keeps the original **traceback chain**.',
    },
    {
      id: 'dataclass-typing',
      title: 'dataclass with type hints',
      lang: 'python',
      code: `from dataclasses import dataclass, field
from typing import Optional

@dataclass
class User:
  id: int
  name: str
  email: Optional[str] = None
  tags: list[str] = field(default_factory=list)

@dataclass(frozen=True, order=True)
class Point:
  x: float
  y: float

def find_user(users: list[User], uid: int) -> User | None:
  return next((u for u in users if u.id == uid), None)`,
      note: '`@dataclass` writes `__init__`, `__repr__` and `__eq__` from the **type hints**. Use `default_factory` for mutable defaults; `frozen=True` makes it hashable.',
    },
    {
      id: 'generators',
      title: 'Generators and yield',
      lang: 'python',
      code: `def fib():
  a, b = 0, 1
  while True:
    yield a
    a, b = b, a + b

def chunks(items, size):
  for i in range(0, len(items), size):
    yield items[i:i + size]

def read_lines(path):
  with open(path) as f:
    yield from (line.rstrip('\\n') for line in f)

gen = fib()
first_ten = [next(gen) for _ in range(10)]
squares = (n * n for n in range(1_000_000))`,
      note: 'A generator is **lazy**: it pauses at `yield` and resumes on `next()`, so it can stream huge files or infinite sequences in constant memory.',
    },
    {
      id: 'decorator',
      title: 'Decorator with functools.wraps',
      lang: 'python',
      code: `import functools
import time

def timed(fn):
  @functools.wraps(fn)
  def wrapper(*args, **kwargs):
    start = time.perf_counter()
    try:
      return fn(*args, **kwargs)
    finally:
      elapsed = time.perf_counter() - start
      print(f'{fn.__name__} took {elapsed:.3f}s')
  return wrapper

@timed
def slow_add(a, b):
  time.sleep(0.1)
  return a + b`,
      note: 'A decorator takes a function and returns a wrapper. `functools.wraps` keeps the **name and docstring**; the follow-up is a decorator that takes arguments.',
    },
    {
      id: 'context-manager',
      title: 'Context managers',
      lang: 'python',
      code: `import time
from contextlib import contextmanager

class Timer:
  def __enter__(self):
    self.start = time.perf_counter()
    return self

  def __exit__(self, exc_type, exc, tb):
    self.elapsed = time.perf_counter() - self.start

@contextmanager
def opened(path):
  f = open(path)
  try:
    yield f
  finally:
    f.close()`,
      note: '`with` calls `__enter__` and always `__exit__`; a falsy return lets exceptions propagate. `@contextmanager` does the same with one **yield** inside try/finally.',
    },
    {
      id: 'collections',
      title: 'Counter, defaultdict, deque BFS',
      lang: 'python',
      code: `from collections import Counter, defaultdict, deque

counts = Counter('mississippi')
top_two = counts.most_common(2)

graph = defaultdict(list)
for a, b in [(1, 2), (1, 3), (2, 4)]:
  graph[a].append(b)

def bfs(start):
  seen, queue = {start}, deque([start])
  while queue:
    node = queue.popleft()
    for nxt in graph[node]:
      if nxt not in seen:
        seen.add(nxt)
        queue.append(nxt)
  return seen`,
      note: '`Counter` for frequencies, `defaultdict(list)` for adjacency lists, `deque` for an O(1) **popleft** queue. Together they cover most graph and counting problems.',
    },
    {
      id: 'two-pointers',
      title: 'Two pointers on a sorted array',
      lang: 'python',
      code: `def pair_sum(nums: list[int], target: int) -> tuple[int, int] | None:
  lo, hi = 0, len(nums) - 1
  while lo < hi:
    total = nums[lo] + nums[hi]
    if total == target:
      return lo, hi
    if total < target:
      lo += 1
    else:
      hi -= 1
  return None`,
      note: 'Move the left pointer up when the sum is too small and the right one down when too large: O(n) instead of O(n^2). The template behind **pair sum**, 3Sum and container problems.',
    },
    {
      id: 'sliding-window',
      title: 'Sliding window template',
      lang: 'python',
      code: `def max_window_sum(nums: list[int], k: int) -> int:
  window = best = sum(nums[:k])
  for i in range(k, len(nums)):
    window += nums[i] - nums[i - k]
    best = max(best, window)
  return best

def longest_unique(s: str) -> int:
  last: dict[str, int] = {}
  left = best = 0
  for right, ch in enumerate(s):
    if last.get(ch, -1) >= left:
      left = last[ch] + 1
    last[ch] = right
    best = max(best, right - left + 1)
  return best`,
      note: 'Fixed window: add the new item, drop the old one. Variable window: grow `right`, move `left` past the **repeat**. Both run in O(n).',
    },
    {
      id: 'binary-search',
      title: 'Binary search template',
      lang: 'python',
      code: `from bisect import bisect_left

def binary_search(nums: list[int], target: int) -> int:
  lo, hi = 0, len(nums) - 1
  while lo <= hi:
    mid = (lo + hi) // 2
    if nums[mid] == target:
      return mid
    if nums[mid] < target:
      lo = mid + 1
    else:
      hi = mid - 1
  return -1

i = bisect_left(nums, target)
found = i < len(nums) and nums[i] == target`,
      note: 'Write the loop by hand first (watch `lo <= hi` and the `mid + 1` / `mid - 1` updates), then mention `bisect_left` finds the **first index** not less than the target.',
    },
    {
      id: 'heapq-top-k',
      title: 'heapq top-k',
      lang: 'python',
      code: `import heapq
from collections import Counter

def top_k_frequent(nums: list[int], k: int) -> list[int]:
  heap: list[tuple[int, int]] = []
  for num, freq in Counter(nums).items():
    heapq.heappush(heap, (freq, num))
    if len(heap) > k:
      heapq.heappop(heap)
  return [num for freq, num in heap]

largest_three = heapq.nlargest(3, [5, 1, 8, 3, 9])

max_heap: list[int] = []
heapq.heappush(max_heap, -5)
biggest = -max_heap[0]`,
      note: '`heapq` is a **min-heap**: keep a heap of size k so the smallest gets popped, giving O(n log k). Negate values for a max-heap.',
    },
    {
      id: 'lru-cache-memo',
      title: 'Memoization with lru_cache',
      lang: 'python',
      code: `from functools import cache, lru_cache

@lru_cache(maxsize=None)
def fib(n: int) -> int:
  return n if n < 2 else fib(n - 1) + fib(n - 2)

def climb_stairs(n: int) -> int:
  @cache
  def ways(i: int) -> int:
    if i <= 1:
      return 1
    return ways(i - 1) + ways(i - 2)
  return ways(n)

print(fib(80), climb_stairs(10))
fib.cache_clear()`,
      note: 'Top-down **dynamic programming** in one line: cache results by argument. Arguments must be hashable, so pass tuples, not lists.',
    },
  ],
}
