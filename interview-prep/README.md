# PrepArena: interview prep by fixing real bugs

A Next.js app for interview prep: an 18-language online compiler, plus DSA practice the way interviews test it: read a bug report, debug real JavaScript in the browser, run real tests, and learn why it broke. Spaced-repetition flashcards and XP/streak tracking come with it.

It started as a redesign of [Bug Hunter](https://game.myhastech.com/), with a cleaner UI and more of the "learn" side built in.

## Features

| Area | What it does |
| --- | --- |
| **Online compiler** | Programiz-style editor for **18 languages**, picked by their logos (from [Devicon](https://devicon.dev), MIT): Python, R, SQL, HTML/CSS, Java, Kotlin, C, C++, C#, JavaScript, TypeScript, Go, Rust, Scala, Dart, Ruby, PHP, Swift. Six of them run **inside the browser** on self-hosted WebAssembly runtimes (Pyodide, webR, sql.js); the rest are compiled on the server through a pluggable runner. It has a stdin box, Run/Stop, time limits, share links, auto-saved drafts, download, a resizable split, R plots, SQL result tables with a sample database, and a live HTML preview with its console. |
| **Bug Hunt campaign** | 12 hand-written levels in teaching order (off-by-one → two pointers → sliding window → recursion → sorting → a two-bug boss). Each has a story, test cases, three hints that go from a nudge to the exact fix, an explanation and a diff of the fix. |
| **Endless mode** | 147 bugs injected into 20 classic algorithms by 21 mutation operators (comparison, off-by-one, logic, initial value, arithmetic, wrong function, return value). Every bug is **verified**: it compiles and fails at least one test. Level numbers are stable, so links can be shared. Streaks give bonus XP. |
| **Code runner** | User code runs in a Web Worker (no DOM access) with a 2-second cut-off for infinite loops. Per-test expected/received output, a console tab for `console.log`, and drafts auto-saved per level. |
| **Flashcards** | 179 questions in 16 decks (system design, DSA, plus one deck per full-stack notes topic), scheduled with Leitner spaced repetition (1 → 2 → 4 → 8 → 16 → 32 days). Search across all cards, plus a browse-all mode. |
| **Whiteboard** | An Excalidraw whiteboard at `/board`, for learning by drawing and for teaching. Each notes topic gets a **concept board** generated from its notes. One hand-drawn frame per section (definitions, flow diagrams with arrows, tables, code, mistakes) plus a cover and Q&A sticky notes. **Present** goes full screen and steps through the frames as slides, with laser pointer and pen. **Import PDF** turns every page of any PDF into a slide you can annotate; the System Design and DSA volumes have ready-made PDF boards. **Export PDF** downloads one page per frame. The library sidebar has teaching shapes (client, server, DB, cache, queue, load balancer, CDN, callouts). Boards save to IndexedDB in the browser. Pre-exported concept-board PDFs are in `public/notes/boards/`. |
| **Progress** | XP and levels, day streak, daily goal ring, 18-week activity heatmap, 10 badges, JSON export/import, reset. Everything stays in `localStorage`, so no account is needed. |
| **UX** | Ctrl/⌘+K command palette (type a number to jump to an Endless level), keyboard shortcuts (`?` lists them), light theme by default (dark is one click away) with no flash, mobile layout with a Problem/Code switcher, reduced-motion support. |
| **Full-stack notes** | 14 revision topics at `/notes`: HTML, CSS, JavaScript, TypeScript, React, Next.js, Node.js, Express & REST, auth & web security, SQL, MongoDB, Git, Docker/CI-CD and testing. Each one has definitions, tables, flow diagrams, highlighted code, common mistakes and rapid-fire Q&A. 22 snippets open straight in the compiler with **Run in compiler**. You can switch any topic to a **handwritten** style, print it, or download its handwritten A4 PDF, and mark it as read for XP. Full-text search covers all topics. The System Design and DSA PDF volumes are linked as well. |

## Run it

```sh
npm install
npm run dev        # http://localhost:3000
npm test           # vitest: content + logic tests
npm run lint
npm run build      # every page is prerendered (one per level, deck, language and notes topic)
```

After editing notes, regenerate the downloadable PDFs: the handwritten notes in `public/notes/` and the concept boards in `public/notes/boards/`. This needs Playwright and a running `next start` on port 3100:

```sh
npm run notes:pdf  # optional arg: base URL
```

Node 22.18 or newer is needed, because `build:bank` runs a TypeScript file directly.

## Online compiler

| Language | Runs on | How |
| --- | --- | --- |
| Python | browser | Pyodide (CPython → WebAssembly) in a module worker; `input()` reads the stdin box |
| R | browser | webR, with plots rendered as images |
| SQL | browser | sql.js (SQLite → WebAssembly) with `customers` / `orders` / `shippings` sample tables and a Reset DB button |
| HTML/CSS | browser | sandboxed `<iframe>` live preview with its `console.log` piped below |
| JavaScript, TypeScript | browser | Web Worker; TypeScript is transpiled with sucrase (types are stripped, not checked) |
| Java, Kotlin, C, C++, C#, Go, Rust, Scala, Dart, Ruby, PHP, Swift | server | `POST /api/run` → Piston, Judge0, or local toolchains (dev only) |

The WebAssembly runtimes, the whiteboard's Excalidraw fonts and the pdf.js worker are copied from `node_modules` into `public/vendor/` by `scripts/vendor-runtimes.mjs` (on install, dev and build), so no third-party CDN is used. The first Python run downloads about 13 MB and the first R run about 45 MB; after that the browser cache serves them.

Limits: 64 KB of code or input, 64 KB of output, a compile timeout of 20 s and a run timeout of 6 s on the server (5 s for JS, 15 s for Python and 20 s for R in the browser), and 30 runs per minute per IP.

### Running compiled languages

Compiled languages need a code runner. Pick one with environment variables (see `.env.example`):

- **Piston (recommended)** is open source and sandboxes code in isolated containers.
  ```sh
  docker run -d --privileged -p 2000:2000 --name piston_api ghcr.io/engineer-man/piston
  ```
  Then install the runtimes you want (`gcc`, `java`, `kotlin`, `mono`, `go`, `rust`, `scala`, `dart`, `ruby`, `php`, `swift`) with the package manager in Piston's CLI, as described in the [Piston README](https://github.com/engineer-man/piston).
  Then set `RUNNER_BACKEND=piston` and `PISTON_URL=http://localhost:2000`.
- **Judge0**: set `RUNNER_BACKEND=judge0` with `JUDGE0_URL` (and `JUDGE0_KEY` for RapidAPI). Language IDs are looked up from the instance's `/languages` list.
- **local** (`RUNNER_BACKEND=local`) uses compilers installed on the machine (gcc, javac, go, rustc and so on), with time and output limits but **no sandbox**. It is the default in `npm run dev` and is refused in production unless `ALLOW_UNSAFE_LOCAL_RUNNER=1`. Never expose it publicly.

With no runner configured, the browser languages still work, and compiled languages show a short setup note.

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
  app/            routes: / · /compiler/[lang] · /campaign/[id] · /endless/[level] · /flashcards/[deck] · /progress · /notes/[topic] · /board/[id] · /api/run
  components/     shell, command palette, play screen, editor, diff view, UI primitives
  components/notes/  notes block renderer, Shiki highlighting (build time), code actions
  data/           campaign levels, algorithm library, verified bug bank, flashcard decks
  data/notes/     one file per full-stack notes topic (typed blocks: def, code, table, flow, mistake…)
  lib/            test runner (worker + shared core), mutation engine, SRS, progress store
  lib/run/        in-browser runtimes for the compiler (JS/TS worker, SQLite worker, webR) + dispatcher
  lib/exec/       server runners: Piston, Judge0, local
  lib/board/      whiteboard: notes → Excalidraw concept boards, PDF import/export, teaching library, IndexedDB store
public/runners/   Python worker (static module worker that loads Pyodide)
public/notes/     PDF volumes, one handwritten PDF per notes topic, boards/ concept-board PDFs
scripts/          build-bank.ts, vendor-runtimes.mjs, export-notes-pdf.mjs, build-lang-icons.mjs
tests/            vitest suites
```

Built with Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, CodeMirror 6, Shiki, Excalidraw, pdf.js, pdf-lib, Pyodide, webR, sql.js and lucide icons.
