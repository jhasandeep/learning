import type { SdLesson } from '../types'

export const solid: SdLesson = {
  id: 'solid',
  title: 'SOLID principles',
  topic: 'Clean code for low-level design',
  blurb: 'Five rules that keep code easy to change as it grows, with a hands-on example of the open/closed principle.',
  why: {
    story: 'High-level design decides which servers and databases you need. **Low-level design** is how the code inside them is organised. **SOLID** is a set of five habits that stop code from turning into a tangle: **S**ingle responsibility, **O**pen/closed, **L**iskov substitution, **I**nterface segregation and **D**ependency inversion. They matter in interviews and in real teams because requirements always change, and good structure makes a change small and safe instead of scary.',
    pains: ['Adding a feature means editing ten unrelated places.', 'A change in one class breaks another that seemed unrelated.', 'Tests are hard to write because classes create their own dependencies.', 'One giant class does everything and nobody dares to touch it.'],
  },
  before: {
    title: 'Before: one class does everything',
    nodes: [
      { id: 'o', label: 'OrderManager', kind: 'service', x: 50, y: 28, sub: 'does it all' },
      { id: 'a', label: 'Pricing', kind: 'server', x: 14, y: 8 },
      { id: 'b', label: 'Emails', kind: 'server', x: 86, y: 8 },
      { id: 'c', label: 'Database', kind: 'db', x: 14, y: 48 },
      { id: 'd', label: 'Payment', kind: 'server', x: 86, y: 48 },
    ],
    edges: [{ from: 'o', to: 'a' }, { from: 'o', to: 'b' }, { from: 'o', to: 'c' }, { from: 'o', to: 'd' }],
    frames: [
      { caption: 'A single `OrderManager` calculates prices, saves to the database, takes payment and sends emails.', active: ['o', 'a', 'b', 'c', 'd'] },
      { caption: 'A change to the email text, the payment provider or the tax rule all force edits to the same class.', bad: ['o'], badges: { o: 'FRAGILE' } },
    ],
  },
  how: {
    title: 'After: five principles at work',
    nodes: [
      { id: 's', label: 'S: Single responsibility', kind: 'service', x: 20, y: 10 },
      { id: 'o', label: 'O: Open/closed', kind: 'service', x: 80, y: 10 },
      { id: 'l', label: 'L: Liskov', kind: 'service', x: 20, y: 28 },
      { id: 'i', label: 'I: Interface segregation', kind: 'service', x: 80, y: 28 },
      { id: 'd', label: 'D: Dependency inversion', kind: 'service', x: 50, y: 46 },
    ],
    edges: [],
    frames: [
      { caption: '**S: Single responsibility.** A class should have **one reason to change**. Split pricing, storage, payment and email into separate classes.', active: ['s'] },
      { caption: '**O: Open/closed.** Open for extension, closed for modification: add a new behaviour by adding **new code** (a new class), not by editing a working `if` chain.', active: ['o'] },
      { caption: '**L: Liskov substitution.** A subclass must work anywhere its parent is expected. If `Square` extends `Rectangle` but breaks `set_width`, it violates this.', active: ['l'] },
      { caption: '**I: Interface segregation.** Prefer several small interfaces to one big one: a `Printer` should not be forced to implement `fax()` and `scan()`.', active: ['i'] },
      { caption: '**D: Dependency inversion.** Depend on **abstractions**, not concrete classes: `OrderService` takes a `PaymentGateway` interface, so tests and new providers plug in easily.', active: ['d'] },
    ],
  },
  realWorld: [
    { name: 'Payment gateways', text: 'A checkout depends on a `PaymentGateway` interface; Razorpay, Stripe or a test fake each implement it (D, L).' },
    { name: 'Logging and notifications', text: 'A `Notifier` interface with email, SMS and push implementations: adding WhatsApp means one new class (O).' },
    { name: 'Plugin systems', text: 'Editors and frameworks let you add behaviour through plugins without changing the core (O, D).' },
    { name: 'Low-level design interviews', text: 'Parking lot, elevator, library or booking system questions are really tests of these principles.' },
  ],
  tradeoffs: {
    gain: ['Changes become small and local.', 'Code is easier to test and to understand.', 'Teams can work in parallel on separate classes.'],
    cost: ['More classes and indirection for small programs.', 'Over-applying them gives needless abstraction (do not build interfaces for things that will never vary).'],
    useWhen: ['Code that will keep changing: business rules, integrations, features.'],
    avoidWhen: ['Tiny scripts and throw-away prototypes.'],
  },
  steps: [
    {
      title: 'An if/elif chain per shape',
      tag: 'slow',
      idea: 'The first version uses one function with a branch for each shape. It works, but adding a new shape means **editing** this function again, so it is not closed for modification.',
      walk: ['Loop over the shapes.', 'Use an `if` for each kind to compute its area.', 'Sum and round to two decimals.'],
      code: {
        python: `import math

def total_area(shapes):
    total = 0
    for shape in shapes:
        if shape[0] == "circle":
            total += math.pi * shape[1] ** 2
        elif shape[0] == "rect":
            total += shape[1] * shape[2]
        elif shape[0] == "triangle":
            total += 0.5 * shape[1] * shape[2]
    return round(total, 2)
`,
        javascript: `function totalArea(shapes) {
  let total = 0;
  for (const shape of shapes) {
    if (shape[0] === "circle") total += Math.PI * shape[1] ** 2;
    else if (shape[0] === "rect") total += shape[1] * shape[2];
    else if (shape[0] === "triangle") total += 0.5 * shape[1] * shape[2];
  }
  return Math.round(total * 100) / 100;
}
`,
      },
      time: 'O(shapes)',
      space: 'O(1)',
      verdict: 'Correct today. Every new shape (hexagon, ellipse) forces another edit to code that already works and is already tested.',
    },
    {
      title: 'Open/closed: each shape knows its own area',
      tag: 'best',
      idea: 'Give every shape its own small class with an `area()` method and register it by name. `total_area` never changes: to support a new shape you **add a class** and register it. This also follows single responsibility (each class knows one shape) and Liskov (every shape can be used wherever a `Shape` is expected).',
      walk: ['Define a class per shape with `area()`.', 'Keep a registry that maps the name to the class.', '`total_area` creates each shape from the registry and sums `area()`.'],
      code: {
        python: `import math

class Circle:
    def __init__(self, r):
        self.r = r
    def area(self):
        return math.pi * self.r ** 2

class Rect:
    def __init__(self, w, h):
        self.w, self.h = w, h
    def area(self):
        return self.w * self.h

class Triangle:
    def __init__(self, b, h):
        self.b, self.h = b, h
    def area(self):
        return 0.5 * self.b * self.h

SHAPES = {"circle": Circle, "rect": Rect, "triangle": Triangle}

def total_area(shapes):
    total = sum(SHAPES[kind](*dims).area() for kind, *dims in shapes)
    return round(total, 2)
`,
        javascript: `class Circle {
  constructor(r) { this.r = r; }
  area() { return Math.PI * this.r ** 2; }
}

class Rect {
  constructor(w, h) { this.w = w; this.h = h; }
  area() { return this.w * this.h; }
}

class Triangle {
  constructor(b, h) { this.b = b; this.h = h; }
  area() { return 0.5 * this.b * this.h; }
}

const SHAPES = { circle: Circle, rect: Rect, triangle: Triangle };

function totalArea(shapes) {
  let total = 0;
  for (const [kind, ...dims] of shapes) total += new SHAPES[kind](...dims).area();
  return Math.round(total * 100) / 100;
}
`,
      },
      time: 'O(shapes)',
      space: 'O(1)',
      verdict: 'Adding `SHAPES["hexagon"] = Hexagon` extends the program without touching `total_area`.',
    },
  ],
  practice: {
    fn: { python: 'total_area', javascript: 'totalArea' },
    starter: {
      python: `def total_area(shapes):
    # shapes: list like ["circle", r], ["rect", w, h], ["triangle", base, height]
    # Return the total area rounded to 2 decimals.
    # Challenge: design it so adding a new shape needs no change to this function.
    pass
`,
      javascript: `function totalArea(shapes) {
  // shapes: list like ["circle", r], ["rect", w, h], ["triangle", base, height]
  // Return the total area rounded to 2 decimals.
  // Challenge: design it so adding a new shape needs no change to this function.
}
`,
    },
    cases: [
      { label: 'a circle of radius 1', args: [[['circle', 1]]], expected: 3.14 },
      { label: 'a rectangle', args: [[['rect', 3, 4]]], expected: 12 },
      { label: 'a triangle', args: [[['triangle', 6, 5]]], expected: 15 },
      { label: 'a mix of shapes', args: [[['circle', 1], ['rect', 2, 3]]], expected: 9.14 },
      { label: 'a circle of radius 2', args: [[['circle', 2]]], expected: 12.57 },
      { label: 'no shapes', args: [[]], expected: 0 },
    ],
    hints: ['Give each shape its own small class (or function) that returns its area.', 'Keep a lookup from the shape name to that class.', 'Sum the areas and round once at the end.'],
  },
  quiz: [
    { q: 'A class sends emails, saves orders and calculates tax. Which principle does it break most clearly?', options: ['Single responsibility', 'Liskov substitution', 'Interface segregation'], answer: 0, why: 'It has several reasons to change. Split it into focused classes.' },
    { q: 'You add a new payment provider by writing one new class and changing no existing code. Which principle is this?', options: ['Open/closed', 'Single responsibility only', 'None'], answer: 0, why: 'The system is open to extension (new class) and closed to modification (old code untouched).' },
    { q: '`OrderService` creates `new StripeGateway()` inside itself. What is the fix?', options: ['Pass in a `PaymentGateway` interface (dependency inversion)', 'Make the class bigger', 'Use global variables'], answer: 0, why: 'Depending on an abstraction lets you swap providers and test with a fake.' },
  ],
  interview: [
    { q: 'Explain SOLID briefly with an example.', a: 'Take a parking lot. **S**: `Ticket`, `Payment`, `Slot` are separate classes. **O**: add a new vehicle type by adding a class, not editing `if` chains. **L**: any `Vehicle` subtype works wherever a `Vehicle` is expected. **I**: separate small interfaces (`Payable`, `Parkable`) not one huge one. **D**: `ParkingLot` depends on a `PricingStrategy` interface, so hourly or flat pricing can be swapped in.' },
    { q: 'What is the Liskov substitution principle, with a violation?', a: 'Objects of a subclass must be usable wherever the base class is expected **without surprising behaviour**. Violation: `Square` extends `Rectangle` but setting its width also changes its height, breaking code that assumes the two are independent. Prefer composition or a common `Shape` interface.' },
    { q: 'How are dependency inversion and dependency injection related?', a: '**Dependency inversion** is the principle: depend on abstractions. **Dependency injection** is a technique to follow it: the dependency is passed in (constructor, parameter) instead of created inside the class. Frameworks automate the wiring.' },
  ],
  mistakes: ['Creating interfaces for everything, even things that will never change.', 'Subclassing just to reuse code when the "is-a" relationship is not true.', 'Huge "manager" or "util" classes that do everything.', 'Hard-coding dependencies, which makes tests need real databases.'],
  recap: 'SOLID keeps code easy to change: small focused classes, extension by addition, substitutable subtypes, slim interfaces and dependencies on abstractions.',
}
