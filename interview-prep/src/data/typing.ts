// Typing trainer data: a US QWERTY keyboard with the finger for each key, the
// lesson curriculum (home row → full keyboard → symbols → real code) and the
// word lists the exercises are built from.

export type Finger = 'lp' | 'lr' | 'lm' | 'li' | 'ri' | 'rm' | 'rr' | 'rp' | 'th'

export const FINGERS: Record<Finger, { name: string; color: string }> = {
  lp: { name: 'Left pinky', color: '#a855f7' },
  lr: { name: 'Left ring', color: '#3b82f6' },
  lm: { name: 'Left middle', color: '#10b981' },
  li: { name: 'Left index', color: '#f59e0b' },
  ri: { name: 'Right index', color: '#f97316' },
  rm: { name: 'Right middle', color: '#14b8a6' },
  rr: { name: 'Right ring', color: '#0ea5e9' },
  rp: { name: 'Right pinky', color: '#ec4899' },
  th: { name: 'Thumb', color: '#64748b' },
}

export interface Key {
  /** Character typed without shift ('' for control keys). */
  base: string
  /** Character typed with shift. */
  shift?: string
  label: string
  finger: Finger
  /** Width in key units. */
  w?: number
  /** Home-row bump (F and J). */
  bump?: boolean
}

const k = (base: string, shift: string | undefined, finger: Finger, extra: Partial<Key> = {}): Key => ({ base, shift, label: shift && !/[a-z]/.test(base) ? `${shift}\n${base}` : base.toUpperCase(), finger, ...extra })

export const KEYBOARD: Key[][] = [
  [k('`', '~', 'lp'), k('1', '!', 'lp'), k('2', '@', 'lr'), k('3', '#', 'lm'), k('4', '$', 'li'), k('5', '%', 'li'), k('6', '^', 'ri'), k('7', '&', 'ri'), k('8', '*', 'rm'), k('9', '(', 'rr'), k('0', ')', 'rp'), k('-', '_', 'rp'), k('=', '+', 'rp'), { base: '', label: 'Backspace', finger: 'rp', w: 2 }],
  [{ base: '', label: 'Tab', finger: 'lp', w: 1.5 }, k('q', 'Q', 'lp'), k('w', 'W', 'lr'), k('e', 'E', 'lm'), k('r', 'R', 'li'), k('t', 'T', 'li'), k('y', 'Y', 'ri'), k('u', 'U', 'ri'), k('i', 'I', 'rm'), k('o', 'O', 'rr'), k('p', 'P', 'rp'), k('[', '{', 'rp'), k(']', '}', 'rp'), k('\\', '|', 'rp', { w: 1.5 })],
  [{ base: '', label: 'Caps', finger: 'lp', w: 1.75 }, k('a', 'A', 'lp'), k('s', 'S', 'lr'), k('d', 'D', 'lm'), k('f', 'F', 'li', { bump: true }), k('g', 'G', 'li'), k('h', 'H', 'ri'), k('j', 'J', 'ri', { bump: true }), k('k', 'K', 'rm'), k('l', 'L', 'rr'), k(';', ':', 'rp'), k("'", '"', 'rp'), { base: '\n', label: 'Enter', finger: 'rp', w: 2.25 }],
  [{ base: '', label: 'Shift', finger: 'lp', w: 2.25 }, k('z', 'Z', 'lp'), k('x', 'X', 'lr'), k('c', 'C', 'lm'), k('v', 'V', 'li'), k('b', 'B', 'li'), k('n', 'N', 'ri'), k('m', 'M', 'ri'), k(',', '<', 'rm'), k('.', '>', 'rr'), k('/', '?', 'rp'), { base: '', label: 'Shift', finger: 'rp', w: 2.75 }],
  [{ base: ' ', label: 'Space', finger: 'th', w: 6.25 }],
]

/** For every typable character: its key, and whether shift is needed. */
export const CHAR_KEY: Record<string, { key: Key; shift: boolean }> = Object.fromEntries(
  KEYBOARD.flat().flatMap((key) => [
    ...(key.base ? [[key.base, { key, shift: false }] as const] : []),
    ...(key.shift ? [[key.shift, { key, shift: true }] as const] : []),
  ]),
)

/** Left-hand keys use the right shift and vice versa. */
export const isLeftHand = (f: Finger) => f.startsWith('l')

// ---------- lessons ----------

export type LessonKind = 'keys' | 'shift' | 'punctuation' | 'numbers' | 'words' | 'sentences' | 'symbols' | 'code'

export interface Lesson {
  id: string
  title: string
  track: 'Beginner' | 'Intermediate' | 'Code'
  kind: LessonKind
  /** Keys this lesson introduces (shown with their finger). */
  newKeys: string[]
  /** Lower-case letters and symbols allowed so far (for 'keys' lessons). */
  keys: string
  tip: string
  /** Code lessons: which snippet language to draw from. */
  lang?: 'javascript' | 'python' | 'sql'
}

const HOME = 'asdfghjkl;'
const beginner: [string, string, string, string][] = [
  // id, title, new keys, tip
  ['home-fj', 'Home row: F and J', 'fj', 'Rest your index fingers on F and J; feel the bumps without looking.'],
  ['home-dk', 'Home row: D and K', 'dk', 'Middle fingers on D and K. Return to the home row after every key.'],
  ['home-sl', 'Home row: S and L', 'sl', 'Ring fingers on S and L. Keep your wrists relaxed and off the desk.'],
  ['home-a', 'Home row: A and ;', 'a;', 'Pinkies on A and semicolon. Thumbs hover over the space bar.'],
  ['home-gh', 'Home row: G and H', 'gh', 'Index fingers stretch one key inward for G and H, then come back.'],
  ['top-ei', 'Top row: E and I', 'ei', 'Middle fingers reach up for E and I.'],
  ['top-ru', 'Top row: R and U', 'ru', 'Index fingers reach up and slightly left for R and U.'],
  ['top-ty', 'Top row: T and Y', 'ty', 'Index fingers stretch up and inward for T and Y.'],
  ['top-wo', 'Top row: W and O', 'wo', 'Ring fingers reach up for W and O.'],
  ['top-qp', 'Top row: Q and P', 'qp', 'Pinkies reach up for Q and P.'],
  ['bottom-vm', 'Bottom row: V and M', 'vm', 'Index fingers curl down for V and M.'],
  ['bottom-c', 'Bottom row: C and comma', 'c,', 'Middle fingers curl down for C and the comma.'],
  ['bottom-bn', 'Bottom row: B and N', 'bn', 'Index fingers reach down and inward for B and N.'],
  ['bottom-x', 'Bottom row: X and period', 'x.', 'Ring fingers curl down for X and the period.'],
  ['bottom-z', 'Bottom row: Z and slash', 'z/', 'Pinkies curl down for Z and the slash.'],
]

let cumulative = ''
export const LESSONS: Lesson[] = [
  ...beginner.map(([id, title, keys, tip]) => {
    cumulative += keys
    return { id, title, track: 'Beginner' as const, kind: 'keys' as const, newKeys: keys.split(''), keys: cumulative, tip }
  }),
  { id: 'all-letters', title: 'All letters review', track: 'Beginner', kind: 'words', newKeys: [], keys: 'abcdefghijklmnopqrstuvwxyz', tip: 'Real words with every letter. Accuracy first, speed comes on its own.' },
  { id: 'shift', title: 'Capital letters with Shift', track: 'Intermediate', kind: 'shift', newKeys: ['Shift'], keys: '', tip: 'Hold Shift with the pinky of the opposite hand: right Shift for A–T, left Shift for Y–P.' },
  { id: 'punctuation', title: 'Punctuation', track: 'Intermediate', kind: 'punctuation', newKeys: ["'", '"', '?', '!', '-', ':'], keys: '', tip: 'Quotes and question marks live under your right pinky.' },
  { id: 'numbers', title: 'Number row', track: 'Intermediate', kind: 'numbers', newKeys: '1234567890'.split(''), keys: '', tip: 'Reach up from the home row with the same finger as the letter below each number.' },
  { id: 'common-words', title: 'The 200 most common words', track: 'Intermediate', kind: 'words', newKeys: [], keys: '', tip: 'These words are most of everyday English. Type them as whole shapes, not letter by letter.' },
  { id: 'sentences', title: 'Full sentences', track: 'Intermediate', kind: 'sentences', newKeys: [], keys: '', tip: 'Keep a steady rhythm through capitals and punctuation.' },
  { id: 'brackets', title: 'Brackets ( ) [ ] { }', track: 'Code', kind: 'symbols', newKeys: ['(', ')', '[', ']', '{', '}'], keys: '()[]{}', tip: 'Parentheses are Shift + 9 / 0; square brackets and braces sit under your right pinky.' },
  { id: 'operators', title: 'Operators = + - * / < > !', track: 'Code', kind: 'symbols', newKeys: ['=', '+', '*', '<', '>', '!', '&', '|'], keys: '=+-*/<>!&|%', tip: 'Most operators are on the right side: keep your right hand anchored on J.' },
  { id: 'code-symbols', title: 'Developer symbols', track: 'Code', kind: 'symbols', newKeys: ['$', '#', '@', '_', '`', '\\', '~', '^'], keys: '$#@_`\\~^', tip: 'Template strings, decorators and paths: the symbols you type every day.' },
  { id: 'code-js', title: 'JavaScript snippets', track: 'Code', kind: 'code', newKeys: [], keys: '', lang: 'javascript', tip: 'Real code from your notes. After Enter, the indentation is typed for you.' },
  { id: 'code-python', title: 'Python snippets', track: 'Code', kind: 'code', newKeys: [], keys: '', lang: 'python', tip: 'Indentation is meaningful in Python; it is filled in after each Enter.' },
  { id: 'code-sql', title: 'SQL queries', track: 'Code', kind: 'code', newKeys: [], keys: '', lang: 'sql', tip: 'Keywords in capitals: practise the Shift rhythm.' },
]

export const LESSONS_BY_ID: Record<string, Lesson> = Object.fromEntries(LESSONS.map((l) => [l.id, l]))
export const HOME_ROW = HOME

// ---------- text sources ----------

/** The 200 most common English words. */
export const COMMON_WORDS = `the of and to a in is you that it he was for on are as with his they i at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if will up other about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who oil its now find long down day did get come made may part over new sound take only little work know place year live me back give most very after thing our just name good sentence man think say great where help through much before line right too mean old any same tell boy follow came want show also around form three small set put end does another well large must big even such because turn here why ask went men read need land different home us move try kind hand picture again change off play spell air away animal house point page letter mother answer found study still learn should world high every near add food between own below country plant last school father keep tree never start city earth eye light thought head under story saw left few while along might close something seem next hard open example begin life always those both paper together got group often run`.split(/\s+/)

/** Extra words that use only a few letters, so early lessons have real words to type. */
export const EASY_WORDS = `ad add ads all as ask dad fad fall falls flask gas glad had hall half has jag lad lads lag lass sad salad sash shall dash flash slash hash gash shag alas lash dish fish kid kids lid lids skid skill still fill hill will kill gill jig dig fig his hid ill is if lie lies die dies field fields shield shields see seed seeds feed feeds feel feels keel heel heels deed deeds fee fees led sled shed fled ledge hedge edge edges idea ideas aide aides life like likes hike hikes side sides slide slides glide hide hides here her jade fake lake lakes sake rake hare share shares dear fear fears gear hear jar jars far gas sure rule rules user users rude dull full fuss us use used fur hurl red reds read reads rid ride ride rides fire fires hire dirt shirt skirt third first trust tried yes yet say days dry try style these that this thus their there treat street tree trees text test taste`.split(/\s+/)

export const SENTENCES = [
  'The quick brown fox jumps over the lazy dog.',
  'Pack my box with five dozen liquor jugs.',
  'How vexingly quick daft zebras jump!',
  'Good code is read many more times than it is written.',
  'Make it work, make it right, then make it fast.',
  'A clear name is worth more than a clever comment.',
  'Small commits with clear messages make history easy to read.',
  'Test the edge cases first: empty input, one item, and huge input.',
  'Every request should be validated on the server, not only in the browser.',
  'Measure before you optimise; the slow part is rarely where you guess.',
  'Caching makes reads fast, but invalidation is the hard part.',
  'An index speeds up reads and slows down writes a little.',
  'Explain your approach out loud before you start to code.',
  'If two things change together, keep them close together.',
  'Prefer simple solutions; you can always add complexity later.',
]

export const PUNCTUATION_WORDS = ["don't", "it's", "you're", "can't", "let's", '"hello"', '"yes"', 'why?', 'ready?', 'done!', 'wow!', 'well-known', 'up-to-date', 'note:', 'tip:', 'e-mail', "isn't", "we'll", '"ok"', 'what?']

/** Python practice snippets (the notes have no short Python examples). */
export const PYTHON_SNIPPETS = [
  `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
    return []`,
  `for i in range(1, 16):
    if i % 15 == 0:
        print("FizzBuzz")
    elif i % 3 == 0:
        print("Fizz")
    else:
        print(i)`,
  `def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        lo, hi = (mid + 1, hi) if arr[mid] < target else (lo, mid - 1)
    return -1`,
  `from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)`,
  `squares = [n * n for n in range(10) if n % 2 == 0]
lookup = {name: len(name) for name in ["asha", "ben"]}
print(squares, lookup)`,
  `from collections import Counter

words = "the cat and the hat".split()
counts = Counter(words)
print(counts.most_common(2))`,
  `class Stack:
    def __init__(self):
        self.items = []

    def push(self, item):
        self.items.append(item)

    def pop(self):
        return self.items.pop()`,
  `def is_palindrome(s: str) -> bool:
    clean = [c.lower() for c in s if c.isalnum()]
    return clean == clean[::-1]`,
  `with open("data.txt") as f:
    for line in f:
        name, score = line.strip().split(",")
        print(f"{name}: {int(score)}")`,
  `try:
    value = int(input("Number: "))
except ValueError:
    print("Not a number")
else:
    print(value * 2)`,
]
