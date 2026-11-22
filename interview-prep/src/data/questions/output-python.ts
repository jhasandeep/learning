import type { QuestionSet } from './types'

// Predict-the-output questions for Python: mutability, scope, OOP, generators, asyncio and more.
// `output` is the exact stdout; tests/questions.test.ts runs every snippet and compares.

export const outputPython: QuestionSet = {
  id: 'output-python',
  title: 'Output guessing: Python',
  questions: [
    {
      id: 'mutable-default-arg',
      q: 'The famous mutable default argument. What prints?',
      a: `Default values are evaluated **once**, when the function is defined, not on every call. All calls that omit \`bucket\` share the **same list**, so it keeps growing: \`[1]\`, \`[1, 2]\`. Passing a fresh list gives \`[3]\`. The next default call sees the old list again: \`[1, 2, 4]\`.

Fix: \`def add(item, bucket=None): bucket = [] if bucket is None else bucket\`.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['functions', 'mutability', 'gotcha'],
      code: { lang: 'python', run: true, code: `def add(item, bucket=[]):
    bucket.append(item)
    return bucket

print(add(1))
print(add(2))
print(add(3, []))
print(add(4))` },
      output: `[1]
[1, 2]
[3]
[1, 2, 4]`,
      followUp: 'Which other default values are dangerous (dict, set, `datetime.now()`)?',
    },
    {
      id: 'late-binding-closures',
      q: 'Lambdas in a loop: what does this print?',
      a: `Python closures capture the **variable**, not its value ("late binding"). When the lambdas are called, the loop is over and \`i\` is \`2\`, so the first line is \`[2, 2, 2]\`. Binding the current value as a **default argument** (\`i=i\`) freezes it per lambda: \`[0, 1, 2]\`. \`functools.partial\` works too.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['closures', 'lambda', 'gotcha'],
      code: { lang: 'python', run: true, code: `funcs = [lambda: i for i in range(3)]
print([f() for f in funcs])

fixed = [lambda i=i: i for i in range(3)]
print([f() for f in fixed])` },
      output: `[2, 2, 2]
[0, 1, 2]`,
      followUp: 'How is this different from JavaScript `var` vs `let` in loops?',
    },
    {
      id: 'is-vs-equals',
      q: '`is` against `==`: predict every line.',
      a: `\`==\` compares **values**, \`is\` compares **identity** (same object in memory). \`a == b\` is true but \`a is b\` is false (two lists); \`c\` is another name for \`a\`.

Small integers (-5 to 256) are cached by CPython, so \`x is y\` is \`True\`. That is an implementation detail: never use \`is\` for numbers or strings. Use it for \`None\`.

\`None\` is a singleton and the empty tuple is cached in CPython, so those are \`True\`. Floats: \`0.1 + 0.2\` is not exactly \`0.3\`.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['identity', 'equality', 'gotcha'],
      code: { lang: 'python', run: true, code: `a = [1, 2]
b = [1, 2]
c = a
print(a == b, a is b, a is c)

x = 256
y = 256
print(x is y)

e1, e2 = (), ()
print(None is None, e1 is e2)
print(0.1 + 0.2 == 0.3)` },
      output: `True False True
True
True True
False`,
      followUp: 'Why should you write `if x is None` instead of `if x == None`?',
    },
    {
      id: 'list-reference-copy',
      q: 'Copying lists: what does each print?',
      a: `\`b = a\` is just another name for the same list, so \`b.append(5)\` changes \`a\`. \`copy()\` and slicing make a **shallow** copy: a new outer list whose items are the **same objects**. \`c\` was copied **before** the append, so it has no \`5\`. But the inner list \`[3, 4]\` is shared by \`a\`, \`c\` and \`d\`, so \`c[2].append(99)\` shows up in \`a\` too. \`d is a\` is \`False\` (a different outer list) while \`d[2] is a[2]\` is \`True\`. Use \`copy.deepcopy\` for independent nested data.`,
      difficulty: 'Easy',
      freq: 3,
      tags: ['lists', 'copy', 'references'],
      code: { lang: 'python', run: true, code: `a = [1, 2, [3, 4]]
b = a
c = a.copy()
d = a[:]

b.append(5)
c[2].append(99)

print(a)
print(c)
print(d is a, d[2] is a[2])` },
      output: `[1, 2, [3, 4, 99], 5]
[1, 2, [3, 4, 99]]
False True`,
      followUp: 'What does `copy.deepcopy` do with circular references?',
    },
    {
      id: 'list-multiply',
      q: 'Creating a 2D grid with `*`. What goes wrong?',
      a: `\`[row] * 2\` repeats the **same row object** twice, so both rows are one list: changing one changes both, giving \`[[0, 7, 0], [0, 7, 0]]\`. A list comprehension builds a **new** row on each pass, so only the first row changes. Multiplying is safe for immutable items (\`[0] * 3\`), not for nested lists.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['lists', 'references', 'gotcha'],
      code: { lang: 'python', run: true, code: `grid = [[0] * 3] * 2
grid[0][1] = 7
print(grid)

grid2 = [[0] * 3 for _ in range(2)]
grid2[0][1] = 7
print(grid2)` },
      output: `[[0, 7, 0], [0, 7, 0]]
[[0, 7, 0], [0, 0, 0]]`,
      followUp: 'How would you transpose a matrix in one line?',
    },
    {
      id: 'tuple-augmented-assign',
      q: 'A tuple holding a list: what happens with `+=`?',
      a: `\`t[2] += [5]\` does two steps: it calls \`list.__iadd__\` which **extends the list in place** (that works), then tries to **assign the result back** to \`t[2]\`, which fails because tuples are immutable. So you get a \`TypeError\` **and** the list was already changed: \`(1, 2, [3, 4, 5])\`.`,
      difficulty: 'Hard',
      freq: 2,
      tags: ['tuples', 'immutability', 'gotcha'],
      code: { lang: 'python', run: true, code: `t = (1, 2, [3, 4])
try:
    t[2] += [5]
except TypeError as e:
    print('error:', e)
print(t)` },
      output: `error: 'tuple' object does not support item assignment
(1, 2, [3, 4, 5])`,
      followUp: 'Can a tuple be a dictionary key? When can it not?',
    },
    {
      id: 'dict-ordering-and-keys',
      q: 'Dictionary behaviour: what prints?',
      a: `\`1\`, \`1.0\` and \`True\` are **equal** and have the same hash, so they are the **same key**: the key stays \`1\` (the first inserted) and the value is overwritten by the last assignment, \`bool\`. Result: \`{1: 'bool'} 1\`.

Dicts keep **insertion order** (guaranteed since 3.7). Deleting then re-adding \`b\` moves it to the end: \`['a', 'c', 'b']\`.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['dict', 'hashing'],
      code: { lang: 'python', run: true, code: `d = {}
d[1] = 'int'
d[1.0] = 'float'
d[True] = 'bool'
print(d, len(d))

d2 = {'b': 1, 'a': 2}
d2['c'] = 3
del d2['b']
d2['b'] = 4
print(list(d2))` },
      output: `{1: 'bool'} 1
['a', 'c', 'b']`,
      followUp: 'Why must dictionary keys be hashable, and why is a list not?',
    },
    {
      id: 'string-immutable-ops',
      q: 'Strings: predict the output.',
      a: `Slices are \`[start:stop:step]\` with stop **excluded**: \`s[1:4]\` → \`yth\`; \`[::-1]\` reverses; \`[-3:]\` is the last three. Strings are **immutable**: \`upper()\` returns a new string and \`s\` is unchanged. \`split(',')\` keeps empty strings. Repetition and \`join\` build new strings.`,
      difficulty: 'Easy',
      freq: 2,
      tags: ['strings', 'slicing'],
      code: { lang: 'python', run: true, code: `s = 'python'
print(s[1:4], s[::-1], s[-3:])
print(s.upper(), s)
print('a,b,,c'.split(','))
print('-'.join(['x', 'y']), 'ab' * 3)
print('  hi  '.strip() + '!')` },
      output: `yth nohtyp hon
PYTHON python
['a', 'b', '', 'c']
x-y ababab
hi!`,
      followUp: 'Why is building a long string with `+=` in a loop slow compared to `join`?',
    },
    {
      id: 'list-slicing-mutation',
      q: 'Slice assignment and negative indexes. Output?',
      a: `Assigning to a slice **replaces** that range with the new items, and the lengths do not have to match: \`[1, 2]\` becomes \`['x']\`, giving \`[0, 'x', 3, 4, 5]\`. An **extended** slice (with a step) needs the same length: indexes 0, 2, 4 become 9. Out-of-range slices return an empty list instead of raising an error. \`del a[1:]\` keeps only the first item.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['lists', 'slicing'],
      code: { lang: 'python', run: true, code: `a = [0, 1, 2, 3, 4, 5]
a[1:3] = ['x']
print(a)
a[::2] = [9, 9, 9]
print(a)
print(a[10:], a[-1], a[:-1])
del a[1:]
print(a)` },
      output: `[0, 'x', 3, 4, 5]
[9, 'x', 9, 4, 9]
[] 9 [9, 'x', 9, 4]
[9]`,
      followUp: 'What is the difference between `a[:]` on the right and left of an assignment?',
    },
    {
      id: 'generator-laziness',
      q: 'Generators are lazy and one-shot. What prints?',
      a: `Calling \`count()\` runs **nothing**; it returns a generator. \`created\` prints first. The first \`next\` starts the body: \`start\`, then yields \`0\`. \`list(g)\` resumes and collects \`1, 2\`, then the body ends and prints \`end\`. The generator is now **exhausted**, so the second \`list(g)\` is empty: \`[]\`.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['generators', 'iterators'],
      code: { lang: 'python', run: true, code: `def count():
    print('start')
    for i in range(3):
        yield i
    print('end')

g = count()
print('created')
print(next(g))
print(list(g))
print(list(g))` },
      output: `created
start
0
end
[1, 2]
[]`,
      followUp: 'Generator expression vs list comprehension: memory and speed trade-offs?',
    },
    {
      id: 'list-comprehension-scope',
      q: 'Comprehension scope and walrus. Output?',
      a: `In Python 3 a comprehension has its **own scope**, so its loop variable \`x\` does not overwrite the outer \`x\`: \`outer [0, 2, 4]\`. (In Python 2 it leaked.) The walrus operator \`:=\` is the exception: it binds in the **enclosing** scope, so \`total\` ends at \`6\` and \`vals\` is the running sum \`[1, 3, 6]\`.`,
      difficulty: 'Hard',
      freq: 1,
      tags: ['comprehension', 'scope'],
      code: { lang: 'python', run: true, code: `x = 'outer'
squares = [x * 2 for x in range(3)]
print(x, squares)

total = 0
vals = [(total := total + n) for n in [1, 2, 3]]
print(vals, total)` },
      output: `outer [0, 2, 4]
[1, 3, 6] 6`,
      followUp: 'When would you prefer a plain loop over a comprehension?',
    },
    {
      id: 'global-local-scope',
      q: 'LEGB scope: what prints, and what fails?',
      a: `Lookup order is **L**ocal, **E**nclosing, **G**lobal, **B**uilt-in. \`read\` only reads, so it finds the global \`10\`.

In \`broken\`, assigning to \`x\` anywhere in a function makes it **local for the whole function**, so the \`+=\` reads a local that has no value yet: \`UnboundLocalError\`. Fix with \`global x\`. \`nonlocal\` lets \`inc\` rebind \`n\` from the enclosing function: two calls give \`2\`. The global \`x\` stays \`10\`.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['scope', 'global', 'nonlocal'],
      code: { lang: 'python', run: true, code: `x = 10

def read():
    return x

def broken():
    try:
        x += 1
    except UnboundLocalError:
        return 'UnboundLocalError'

def outer():
    n = 0
    def inc():
        nonlocal n
        n += 1
        return n
    inc()
    return inc()

print(read(), broken(), outer(), x)` },
      output: `10 UnboundLocalError 2 10`,
      followUp: 'Why is overusing `global` a design smell?',
    },
    {
      id: 'class-vs-instance-attr',
      q: 'Class attribute vs instance attribute. What prints?',
      a: `\`tricks = []\` is a **class attribute**, shared by every instance. \`a.learn\` mutates that shared list, so \`b.tricks\` also shows \`['sit']\`. \`Dog.count\` was incremented twice. Then \`a.count = 100\` **creates an instance attribute** on \`a\` that shadows the class one; \`b\` and the class still see \`2\`. Create mutable per-instance state inside \`__init__\`.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['oop', 'classes', 'gotcha'],
      code: { lang: 'python', run: true, code: `class Dog:
    tricks = []
    count = 0

    def __init__(self, name):
        self.name = name
        Dog.count += 1

    def learn(self, t):
        self.tricks.append(t)

a, b = Dog('a'), Dog('b')
a.learn('sit')
print(b.tricks, Dog.count)

a.count = 100
print(a.count, b.count, Dog.count)` },
      output: `['sit'] 2
100 2 2`,
      followUp: 'What is the difference between `@classmethod`, `@staticmethod` and a normal method?',
    },
    {
      id: 'mro-super',
      q: 'Multiple inheritance and `super()`. What order is printed?',
      a: `Python builds a linear **method resolution order** (C3 linearisation): \`D, B, C, A, object\`. \`super()\` does not mean "the parent"; it means "the **next class in the MRO**". So \`D\` → \`B\` → \`C\` → \`A\`, each called once (the diamond is solved without calling \`A\` twice).`,
      difficulty: 'Hard',
      freq: 2,
      tags: ['oop', 'inheritance', 'mro'],
      code: { lang: 'python', run: true, code: `class A:
    def hello(self):
        print('A')

class B(A):
    def hello(self):
        print('B')
        super().hello()

class C(A):
    def hello(self):
        print('C')
        super().hello()

class D(B, C):
    def hello(self):
        print('D')
        super().hello()

D().hello()
print([k.__name__ for k in D.__mro__])` },
      output: `D
B
C
A
['D', 'B', 'C', 'A', 'object']`,
      followUp: 'What problem does the diamond problem cause in C++, and how does C3 fix it?',
    },
    {
      id: 'decorator-order',
      q: 'Stacked decorators: in what order do they run?',
      a: `Decorators are applied **bottom-up at definition time**: \`@tag('inner')\` wraps \`work\` first, then \`@tag('outer')\` wraps that result (both \`decorating\` lines print when the function is defined). At **call** time the outermost wrapper runs first, so you enter \`outer\`, then \`inner\`, run the function, and exit in reverse order: \`inner\`, then \`outer\`. (Add \`functools.wraps\` to keep the original name and docstring.)`,
      difficulty: 'Hard',
      freq: 2,
      tags: ['decorators', 'functions'],
      code: { lang: 'python', run: true, code: `def tag(name):
    def deco(fn):
        print('decorating', fn.__name__, 'with', name)
        def wrapper(*a, **k):
            print('enter', name)
            result = fn(*a, **k)
            print('exit', name)
            return result
        return wrapper
    return deco

@tag('outer')
@tag('inner')
def work():
    print('working')

print('--- calling')
work()` },
      output: `decorating work with inner
decorating wrapper with outer
--- calling
enter outer
enter inner
working
exit inner
exit outer`,
      followUp: 'Write a `@timer` decorator and explain why `functools.wraps` matters.',
    },
    {
      id: 'exception-flow',
      q: '`try / except / else / finally` flow. What prints?',
      a: `For \`f(0)\`: \`try 0\`, the error is raised, \`except\` runs and returns \`handled\`, but **\`finally\` always runs before the function really returns**, so \`finally\` prints, then \`handled\`. For \`f(1)\`: the \`try\` block hits \`return\` so \`else\` is **skipped** (it only runs when the try block finishes normally without returning); \`finally\` still prints, then \`returned\`.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['exceptions', 'control-flow'],
      code: { lang: 'python', run: true, code: `def f(n):
    try:
        print('try', n)
        if n == 0:
            raise ValueError('zero')
        return 'returned'
    except ValueError:
        print('except')
        return 'handled'
    else:
        print('else')
    finally:
        print('finally')

print(f(0))
print(f(1))` },
      output: `try 0
except
finally
handled
try 1
finally
returned`,
      followUp: 'What happens if `finally` itself contains a `return`?',
    },
    {
      id: 'truthiness-and-and-or',
      q: 'Truthiness and short-circuit operators. Predict each.',
      a: `Empty containers, \`0\`, \`''\` and \`None\` are **falsy**; \`[0]\` and \`'0'\` are non-empty so **truthy**. \`or\` / \`and\` return one of the **operands**, not a bool: \`0 or 'x'\` → \`'x'\`; \`5 and 7\` → \`7\`; \`'' and 1\` → \`''\`; \`None or []\` → \`[]\`. Comparisons chain: \`1 < 2 < 3\` is true; \`1 < 3 < 2\` false. \`any([])\` is False and \`all([])\` is **True** (vacuous truth).`,
      difficulty: 'Easy',
      freq: 3,
      tags: ['booleans', 'operators'],
      code: { lang: 'python', run: true, code: `print(bool([]), bool([0]), bool(''), bool('0'), bool(None))
print(0 or 'x', 5 and 7, '' and 1, None or [])
print(not 0, not [], 1 < 2 < 3, 1 < 3 < 2)
print(any([]), all([]))` },
      output: `False True False True False
x 7  []
True True True False
False True`,
      followUp: 'What does `x = x or default` do, and when is it wrong (hint: `0`)?',
    },
    {
      id: 'sorted-key-stability',
      q: '`sort` vs `sorted`, `key`, and stability. What prints?',
      a: `Python's sort is **stable**: equal keys keep their original order, so by length we get \`['a', 'e', 'bb', 'dd', 'ccc']\`. With \`reverse=True\` stability is also kept for equal elements: \`['ccc', 'bb', 'dd', 'a', 'e']\`. \`list.sort()\` sorts **in place and returns \`None\`**, a classic bug when written as \`x = x.sort()\`. Strings sort **lexicographically**: \`'10' < '9'\`. A \`lambda\` key sorts items by value descending.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['sorting', 'lists'],
      code: { lang: 'python', run: true, code: `words = ['bb', 'a', 'ccc', 'dd', 'e']
print(sorted(words, key=len))
print(sorted(words, key=len, reverse=True))
print(words.sort(), words)
print(sorted([10, 9, 1]), sorted(['10', '9', '1']))
print(sorted({'b': 2, 'a': 1}.items(), key=lambda kv: -kv[1]))` },
      output: `['a', 'e', 'bb', 'dd', 'ccc']
['ccc', 'bb', 'dd', 'a', 'e']
None ['a', 'bb', 'ccc', 'dd', 'e']
[1, 9, 10] ['1', '10', '9']
[('b', 2), ('a', 1)]`,
      followUp: 'What is the time complexity of Timsort and why does it do well on partly sorted data?',
    },
    {
      id: 'unpacking-star',
      q: 'Unpacking, swapping and `*`. What prints?',
      a: `The right side of \`a, b = b, a + b\` is **fully evaluated first** (a tuple \`(2, 3)\`), then assigned: \`2 3\`, which is how you step a Fibonacci pair without a temp variable. \`*mid\` collects the middle items into a **list**. \`x = y = []\` binds both names to the **same list**. \`*args\` gathers positional arguments into a tuple and \`**kwargs\` keyword arguments into a dict.`,
      difficulty: 'Easy',
      freq: 2,
      tags: ['unpacking', 'assignment'],
      code: { lang: 'python', run: true, code: `a, b = 1, 2
a, b = b, a + b
print(a, b)

first, *mid, last = [1, 2, 3, 4, 5]
print(first, mid, last)

x = y = []
x.append(1)
print(y)

def f(*args, **kwargs):
    return args, kwargs
print(f(1, 2, k=3))` },
      output: `2 3
1 [2, 3, 4] 5
[1]
((1, 2), {'k': 3})`,
      followUp: 'How do you merge two dicts in Python 3.9+?',
    },
    {
      id: 'integer-division-and-round',
      q: 'Numbers: division, rounding and big ints. Output?',
      a: `\`/\` is **true division** (always a float); \`//\` is **floor** division, which rounds toward negative infinity, so \`-7 // 2\` is \`-4\` (not \`-3\`) and \`-7 % 3\` is \`2\` (the result takes the sign of the divisor). \`round\` uses **banker's rounding** (half to even): \`2.5 → 2\`, \`3.5 → 4\`. Integers have **unlimited precision**. \`int()\` truncates toward zero. \`10 / 5\` is \`2.0\`, a float.`,
      difficulty: 'Easy',
      freq: 2,
      tags: ['numbers', 'operators'],
      code: { lang: 'python', run: true, code: `print(7 / 2, 7 // 2, -7 // 2, -7 % 3)
print(round(2.5), round(3.5), round(-0.5))
print(2 ** 100)
print(int('42') + int(3.99), int(-3.99))
print(10 / 5, type(10 / 5).__name__)` },
      output: `3.5 3 -4 2
2 4 0
1267650600228229401496703205376
45 -3
2.0 float`,
      followUp: 'How does floor division differ from `int(a / b)` for negatives?',
    },
    {
      id: 'set-operations',
      q: 'Sets and dedup: what prints?',
      a: `Set operators: \`&\` intersection, \`|\` union, \`-\` difference, \`^\` symmetric difference (in exactly one). Sets are **unordered**, so sort before printing when order matters. \`{}\` is an empty **dict**, not a set (use \`set()\`). To de-duplicate **and keep order**, use \`dict.fromkeys\`, because dicts remember insertion order.`,
      difficulty: 'Easy',
      freq: 2,
      tags: ['sets', 'collections'],
      code: { lang: 'python', run: true, code: `a = {1, 2, 3}
b = {3, 4}
print(a & b, a | b, a - b, a ^ b)
print(sorted(set([3, 1, 3, 2, 1])))
print({1, 2} == {2, 1}, {} == set(), type({}).__name__)
print(list(dict.fromkeys(['b', 'a', 'b', 'c'])))` },
      output: `{3} {1, 2, 3, 4} {1, 2} {1, 2, 4}
[1, 2, 3]
True False dict
['b', 'a', 'c']`,
      followUp: 'What is the time complexity of `x in some_set` versus `x in some_list`?',
    },
    {
      id: 'enumerate-zip-map',
      q: 'Iterators: `zip`, `map`, `enumerate`. What prints?',
      a: `\`zip\` stops at the **shortest** input, so the third name is dropped. \`enumerate\` takes a \`start\`. \`map\` returns a one-shot **iterator**: the first \`list(m)\` consumes it and the second is \`[]\`. \`zip(*pairs)\` is the idiom to **unzip** / transpose: it gives \`[(1, 2), ('x', 'y')]\`.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['iterators', 'builtins'],
      code: { lang: 'python', run: true, code: `names = ['a', 'b', 'c']
ages = [1, 2]
print(list(zip(names, ages)))
print(list(enumerate(names, start=1)))

m = map(str.upper, names)
print(list(m))
print(list(m))

print(dict(zip('ab', [1, 2])))
print(list(zip(*[(1, 'x'), (2, 'y')])))` },
      output: `[('a', 1), ('b', 2)]
[(1, 'a'), (2, 'b'), (3, 'c')]
['A', 'B', 'C']
[]
{'a': 1, 'b': 2}
[(1, 2), ('x', 'y')]`,
      followUp: 'What does `itertools.zip_longest` do?',
    },
    {
      id: 'string-formatting-fstring',
      q: 'f-strings and formatting. Output?',
      a: `Format spec after the colon: \`>8\` right-aligns in 8 columns, \`.2f\` two decimals, \`,\` adds thousands separators, \`08.1f\` zero-pads to width 8 with one decimal. \`!r\` uses \`repr\` (quotes included). Double braces print literal braces. The old \`%\` style and \`.format()\` still work but f-strings are preferred.`,
      difficulty: 'Easy',
      freq: 1,
      tags: ['strings', 'formatting'],
      code: { lang: 'python', run: true, code: `name, pi, n = 'Asha', 3.14159, 1234567
print(f'{name:>8}|{pi:.2f}|{n:,}')
print(f'{name!r} {2 + 3} {n:08.1f}')
print(f'{{literal}} {"nested"}')
print('%s is %d' % ('x', 5), '{} {}'.format(1, 2))` },
      output: `    Asha|3.14|1,234,567
'Asha' 5 1234567.0
{literal} nested
x is 5 1 2`,
      followUp: 'How do f-strings differ from `str.format` in speed and security (user-supplied templates)?',
    },
    {
      id: 'copy-on-iteration',
      q: 'Modifying a list while iterating over it. What happens?',
      a: `The list iterator walks by **index**. Removing an item shifts everything left, so the next item **jumps into the slot already visited** and is skipped. Here \`2\` is removed, \`4\` slides to index 0 and is never checked, then \`6\` is removed: the result is \`[4, 7]\`, which still contains an even number. Never mutate a list while looping over it; build a new one with a comprehension (\`[7]\`) or loop over a copy (\`nums[:]\`). Changing a **dict's size** during iteration raises \`RuntimeError\`.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['lists', 'iteration', 'gotcha'],
      code: { lang: 'python', run: true, code: `nums = [2, 4, 6, 7]
for n in nums:
    if n % 2 == 0:
        nums.remove(n)
print(nums)

nums = [2, 4, 6, 7]
nums = [n for n in nums if n % 2]
print(nums)

d = {'a': 1, 'b': 2}
try:
    for k in d:
        d[k + 'x'] = 0
except RuntimeError as e:
    print('RuntimeError')` },
      output: `[4, 7]
[7]
RuntimeError`,
      followUp: 'Why does the same bug not happen when you loop over `nums[:]`?',
    },
    {
      id: 'gil-threads-note',
      q: 'Threads and the GIL: is this counter safe, and what prints?',
      a: `With the \`Lock\`, the result is always \`40000\`. Without it, \`counter += 1\` is **not atomic** (it is read, add, write) and threads can interleave, losing updates. The **GIL** (global interpreter lock) lets only one thread run Python bytecode at a time, so threads do **not** speed up CPU-bound work; they help with I/O waits. For CPU-bound parallelism use \`multiprocessing\` (or free-threaded Python 3.13+).`,
      difficulty: 'Hard',
      freq: 2,
      tags: ['concurrency', 'gil', 'threads'],
      code: { lang: 'python', code: `import threading

counter = 0
lock = threading.Lock()

def work():
    global counter
    for _ in range(10000):
        with lock:
            counter += 1

threads = [threading.Thread(target=work) for _ in range(4)]
for t in threads: t.start()
for t in threads: t.join()
print(counter)` },
      output: `40000`,
      followUp: 'When would you pick `threading`, `multiprocessing` or `asyncio`?',
    },
    {
      id: 'asyncio-order',
      q: '`asyncio` ordering: what prints?',
      a: `\`gather\` schedules all three coroutines on the **event loop** at once. Each runs until its first \`await asyncio.sleep\`, so all three \`start\` lines print immediately in creation order. They then finish in order of their **delay** (B, C, A), but \`gather\` returns results in the **argument order**: \`['A', 'B', 'C']\`. Total time is about the longest (0.03 s), not the sum. Awaiting them one by one would run sequentially.`,
      difficulty: 'Hard',
      freq: 3,
      tags: ['asyncio', 'event-loop', 'concurrency'],
      code: { lang: 'python', code: `import asyncio

async def task(name, delay):
    print('start', name)
    await asyncio.sleep(delay)
    print('end', name)
    return name

async def main():
    print('main begins')
    results = await asyncio.gather(task('A', 0.03), task('B', 0.01), task('C', 0.02))
    print(results)

asyncio.run(main())` },
      output: `main begins
start A
start B
start C
end B
end C
end A
['A', 'B', 'C']`,
      followUp: 'How does the asyncio event loop compare to the JavaScript one (microtasks, `await`)?',
    },
    {
      id: 'asyncio-create-task-vs-await',
      q: '`await` a coroutine vs `create_task`. What is the order?',
      a: `\`create_task\` **schedules** the coroutine to run concurrently and returns immediately. \`await say('awaited', ...)\` pauses \`main\` for 0.01 s, during which the task is already counting its 0.02 s. So \`awaited\` prints first, then \`after awaited\`, then \`main\` waits for the task: \`task\`, then \`done\`. A bare \`await\` of a coroutine never runs concurrently by itself.`,
      difficulty: 'Hard',
      freq: 2,
      tags: ['asyncio', 'tasks'],
      code: { lang: 'python', code: `import asyncio

async def say(msg, delay):
    await asyncio.sleep(delay)
    print(msg)

async def main():
    t = asyncio.create_task(say('task', 0.02))
    await say('awaited', 0.01)
    print('after awaited')
    await t
    print('done')

asyncio.run(main())` },
      output: `awaited
after awaited
task
done`,
      followUp: 'What happens to a task you create but never await?',
    },
  ],
}
