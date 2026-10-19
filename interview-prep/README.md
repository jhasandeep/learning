# PrepArena: interview prep by fixing real bugs

A Next.js app for practising DSA the way interviews test it: read a bug report, debug real JavaScript in the browser, run real tests, and learn why it broke. Spaced-repetition flashcards and XP/streak tracking come with it.

It started as a redesign of [Bug Hunter](https://game.myhastech.com/), with a cleaner UI and more of the "learn" side built in.

## Features

| Area | What it does |
| --- | --- |
| **Bug Hunt campaign** | 12 hand-written levels in teaching order (off-by-one → two pointers → sliding window → recursion → sorting → a two-bug boss). Each has a story, test cases, three hints that go from a nudge to the exact fix, an explanation and a diff of the fix. |
| **Endless mode** | 147 bugs injected into 20 classic algorithms by 21 mutation operators (comparison, off-by-one, logic, initial value, arithmetic, wrong function, return value). Every bug is **verified**: it compiles and fails at least one test. Level numbers are stable, so links can be shared. Streaks give bonus XP. |
| **Code runner** | User code runs in a Web Worker (no DOM access) with a 2-second cut-off for infinite loops. Per-test expected/received output, a console tab for `console.log`, and drafts auto-saved per level. |
| **Flashcards** | 64 questions (system design, DSA, React, JavaScript) from the revision notes, scheduled with Leitner spaced repetition (1 → 2 → 4 → 8 → 16 → 32 days). Search across all cards, plus a browse-all mode. |
| **Progress** | XP and levels, day streak, daily goal ring, 18-week activity heatmap, 10 badges, JSON export/import, reset. Everything stays in `localStorage`, so no account is needed. |
| **UX** | Ctrl/⌘+K command palette (type a number to jump to an Endless level), keyboard shortcuts (`?` lists them), light/dark theme with no flash, mobile layout with a Problem/Code switcher, reduced-motion support. |
| **Notes** | The System Design and DSA PDFs from `../notes/` are linked in the app. |

## Run it

```sh
npm install
npm run dev        # http://localhost:3000
npm test           # vitest: content + logic tests
npm run lint
npm run build      # all 175 pages are prerendered
```

Node 22.18 or newer is needed, because `build:bank` runs a TypeScript file directly.

## How Endless levels are made

1. `src/data/algorithms.ts` holds correct reference solutions with edge-case tests.
2. `src/lib/mutate.ts` finds every place a mutation operator applies (for example `<` → `<=`, `+ 1` → `- 1`, `Math.max` → `Math.min`).
3. `npm run build:bank` (`scripts/build-bank.ts`) runs every mutant in a Node `vm` with a timeout. It keeps the ones that compile and fail a test, and drops equivalent mutants. The result goes to `src/data/endless-bank.json`.
4. `src/lib/endless.ts` maps level *N* to a bank entry through a fixed shuffle. Hints come from the bug category and line number.

`tests/content.test.ts` re-checks that every campaign bug fails, every fix passes, and every Endless level is a real, distinct bug.

To add an algorithm, append it to `algorithms.ts`, run `npm run build:bank`, then `npm test`.

## Project layout

```
src/
  app/            routes: / · /campaign/[id] · /endless/[level] · /flashcards/[deck] · /progress · /notes
  components/     shell, command palette, play screen, editor, diff view, UI primitives
  data/           campaign levels, algorithm library, verified bug bank, flashcard decks
  lib/            test runner (worker + shared core), mutation engine, SRS, progress store
scripts/          build-bank.ts
tests/            vitest suites
```

Built with Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, CodeMirror 6 and lucide icons.
