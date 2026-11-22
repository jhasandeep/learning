import type { TaskPath } from './types'

export const python: TaskPath = {
  id: 'python',
  title: 'Python',
  blurb: 'Write real Python: dictionaries, comprehensions, decorators, classes and generators.',
  tasks: [
    {
      id: 'word-count',
      kind: 'run',
      language: 'python',
      title: 'Count the words',
      goal: 'Write `word_count(text)` that returns a dictionary of how often each word appears.',
      steps: [
        'Make the text lowercase and split it into words.',
        'Count each word in a dictionary.',
        'Return the dictionary, for example `{"the": 2, "cat": 1}`.',
      ],
      starter: `def word_count(text):
    # your code here
    pass
`,
      hints: ['`text.lower().split()` gives a list of lowercase words.', 'Use `counts.get(word, 0) + 1` to add one safely.', '`collections.Counter(words)` also works (convert with `dict(...)`).'],
      solution: `def word_count(text):
    counts = {}
    for word in text.lower().split():
        counts[word] = counts.get(word, 0) + 1
    return counts
`,
      harness: `check("counts repeated words", lambda: word_count("the cat the dog") == {"the": 2, "cat": 1, "dog": 1})
check("ignores upper and lower case", lambda: word_count("Go go GO") == {"go": 3})
check("empty text gives an empty dict", lambda: word_count("") == {})
check("returns a dict", lambda: isinstance(word_count("a b"), dict))`,
      learned: 'Dictionaries map keys to values, and `dict.get(key, default)` avoids errors when a key is missing.',
    },
    {
      id: 'comprehension',
      kind: 'run',
      language: 'python',
      title: 'Filter and transform with a comprehension',
      goal: 'Write `squares_of_evens(nums)` using a single list comprehension.',
      steps: [
        'Keep only the even numbers.',
        'Square each of them.',
        'Return the new list in one comprehension: `[expr for x in nums if condition]`.',
      ],
      starter: `def squares_of_evens(nums):
    # your code here
    pass
`,
      hints: ['An even number has `n % 2 == 0`.', 'The shape is `[n * n for n in nums if ...]`.', 'No `for` loop statements and no `append` are needed.'],
      solution: `def squares_of_evens(nums):
    return [n * n for n in nums if n % 2 == 0]
`,
      harness: `check("squares the even numbers", lambda: squares_of_evens([1, 2, 3, 4]) == [4, 16])
check("no evens gives an empty list", lambda: squares_of_evens([1, 3, 5]) == [])
check("keeps the order", lambda: squares_of_evens([6, 2]) == [36, 4])
check("works with negative numbers", lambda: squares_of_evens([-2, -3]) == [4])`,
      rules: [{ label: 'Uses a list comprehension', match: /\[[^\]]*\bfor\b[^\]]*\bin\b[^\]]*\]/, hint: 'Write [ ... for n in nums if ... ].' }],
      learned: 'A list comprehension builds a new list from another one in a single, readable expression.',
    },
    {
      id: 'decorator',
      kind: 'run',
      language: 'python',
      title: 'Write a decorator',
      goal: 'Write `count_calls`, a decorator that counts how many times a function was called.',
      steps: [
        'Create `count_calls(fn)` that returns a `wrapper`.',
        'Every call to `wrapper` increases `wrapper.calls` and then calls `fn` with the same arguments.',
        'Start with `wrapper.calls = 0`, and return the result of `fn`.',
      ],
      starter: `def count_calls(fn):
    # your code here
    pass

@count_calls
def greet(name):
    return "Hello " + name
`,
      hints: ['A decorator is a function that takes a function and returns a function.', 'Inside, let the wrapper accept any arguments with `*args` and a double-star `kwargs` parameter, and pass them on.', 'Functions are objects: `wrapper.calls = 0` stores an attribute on it.'],
      solution: `def count_calls(fn):
    def wrapper(*args, **kwargs):
        wrapper.calls += 1
        return fn(*args, **kwargs)
    wrapper.calls = 0
    return wrapper

@count_calls
def greet(name):
    return "Hello " + name
`,
      harness: `check("the decorated function still works", lambda: greet("Asha") == "Hello Asha")
check("starts at 0 calls (fresh function)", lambda: (lambda f: f.calls)(count_calls(lambda: 1)) == 0)
def _three():
    g = count_calls(lambda x: x)
    g(1); g(2); g(3)
    return g.calls == 3
check("counts three calls", _three)
check("passes arguments through", lambda: count_calls(lambda a, b: a + b)(2, 3) == 5)`,
      learned: 'A decorator wraps a function to add behaviour (counting, logging, timing) without touching the original code.',
    },
    {
      id: 'bank-account',
      kind: 'run',
      language: 'python',
      title: 'Model a bank account with a class',
      goal: 'Write a `BankAccount` class with `deposit`, `withdraw` and a safe `balance`.',
      steps: [
        '`__init__(self, balance=0)` stores the balance.',
        '`deposit(amount)` adds money; `withdraw(amount)` removes it.',
        'Withdrawing more than the balance, or a non-positive amount, raises `ValueError`.',
      ],
      starter: `class BankAccount:
    # your code here
    pass
`,
      hints: ['Store the value as `self.balance` in `__init__`.', 'Check `amount <= 0` first and `raise ValueError("…")`.', 'In `withdraw`, also check `amount > self.balance`.'],
      solution: `class BankAccount:
    def __init__(self, balance=0):
        self.balance = balance

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("amount must be positive")
        self.balance += amount

    def withdraw(self, amount):
        if amount <= 0:
            raise ValueError("amount must be positive")
        if amount > self.balance:
            raise ValueError("insufficient funds")
        self.balance -= amount
`,
      harness: `def _raises(fn):
    try:
        fn()
    except ValueError:
        return True
    return False

check("starts with the given balance", lambda: BankAccount(100).balance == 100)
check("starts at 0 by default", lambda: BankAccount().balance == 0)
def _dep():
    a = BankAccount(); a.deposit(50); return a.balance == 50
check("deposit adds money", _dep)
def _wd():
    a = BankAccount(80); a.withdraw(30); return a.balance == 50
check("withdraw removes money", _wd)
check("cannot withdraw more than the balance", lambda: _raises(lambda: BankAccount(10).withdraw(20)))
check("cannot deposit a negative amount", lambda: _raises(lambda: BankAccount().deposit(-5)))`,
      learned: 'A class bundles data and the rules that protect it; raising exceptions stops invalid actions from silently corrupting state.',
    },
    {
      id: 'fib-generator',
      kind: 'run',
      language: 'python',
      title: 'Create a generator',
      goal: 'Write `fib(n)`, a generator that yields the first `n` Fibonacci numbers.',
      steps: [
        'Start with `a, b = 0, 1`.',
        'Use `yield a` inside a loop that runs `n` times.',
        'Update with `a, b = b, a + b`. Do not build a list.',
      ],
      starter: `def fib(n):
    # your code here
    pass
`,
      hints: ['A function with `yield` becomes a generator.', 'Loop with `for _ in range(n):`.', 'The tuple swap `a, b = b, a + b` moves the sequence forward.'],
      solution: `def fib(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b
`,
      harness: `check("first 8 numbers", lambda: list(fib(8)) == [0, 1, 1, 2, 3, 5, 8, 13])
check("n = 0 yields nothing", lambda: list(fib(0)) == [])
check("it is a generator (lazy)", lambda: hasattr(fib(3), "__next__"))
check("next() gives values one at a time", lambda: (lambda g: (next(g), next(g), next(g)))(fib(5)) == (0, 1, 1))`,
      rules: [{ label: 'Uses `yield`', match: /\byield\b/, hint: 'Use yield inside the loop.' }],
      learned: 'A generator produces values one at a time, so it can describe huge or endless sequences while using almost no memory.',
    },
  ],
}
