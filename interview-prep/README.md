# PrepArena: interview prep by fixing real bugs

A Next.js app for interview prep: an 18-language online compiler, plus DSA practice the way interviews test it: read a bug report, debug real JavaScript in the browser, run real tests, and learn why it broke. Spaced-repetition flashcards and XP/streak tracking come with it.

It started as a redesign of [Bug Hunter](https://game.myhastech.com/), with a cleaner UI and more of the "learn" side built in.

## Features

| Area | What it does |
| --- | --- |
| **Online compiler** | Programiz-style editor for **18 languages**, picked by their logos: Python, R, SQL, HTML/CSS, Java, Kotlin, C, C++, C#, JavaScript, TypeScript, Go, Rust, Scala, Dart, Ruby, PHP, Swift. Six of them run **inside the browser** on self-hosted WebAssembly runtimes (Pyodide, webR, sql.js); the rest are compiled on the server through a pluggable runner. A **MongoDB playground** is added on top: an in-browser mongosh-style shell (find, aggregate, insert/update/delete, indexes, `$lookup`) on a sample `shop` database, with a **Learn** tab of 12 guided lessons whose challenges are checked automatically. It has a stdin box, Run/Stop, time limits, share links, auto-saved drafts, download, a resizable split, R plots, SQL result tables with a sample database, and a live HTML preview with its console. |
| **Bug Hunt campaign** | 12 hand-written levels in teaching order (off-by-one → two pointers → sliding window → recursion → sorting → a two-bug boss). Each has a story, test cases, three hints that go from a nudge to the exact fix, an explanation and a diff of the fix. |
| **Find the mistake** | The Bug Hunt page has a **By technology** tab: 96 short snippets (6 per technology, from HTML and CSS to Docker, Git and system-design docs), each with exactly one wrong line. Click the line you think is wrong; a wrong guess shakes, two unlock a hint (a three-line range), and you can reveal the answer. Then you see why and a diff of the fix. XP goes by how few guesses you needed. The tests parse every JavaScript/TypeScript/JSX snippet, check the SQL fixes, and run the algorithm bugs to prove each fix works and each bug really fails. |
| **Endless mode** | 147 bugs injected into 20 classic algorithms by 21 mutation operators (comparison, off-by-one, logic, initial value, arithmetic, wrong function, return value). Every bug is **verified**: it compiles and fails at least one test. Level numbers are stable, so links can be shared. Streaks give bonus XP. |
| **Code runner** | User code runs in a Web Worker (no DOM access) with a 2-second cut-off for infinite loops. Per-test expected/received output, a console tab for `console.log`, and drafts auto-saved per level. |
| **Flashcards** | 179 questions in 16 decks (system design, DSA, plus one deck per full-stack notes topic), scheduled with Leitner spaced repetition (1 → 2 → 4 → 8 → 16 → 32 days). Search across all cards, plus a browse-all mode. |
| **Interview questions** | `/questions` has the **most asked interview questions** for 16 technologies (HTML, CSS, JavaScript, TypeScript, React, Next.js, Node.js, Express & REST, auth & security, SQL, MongoDB, Git, Docker/CI-CD, testing, system design, DSA). That is about 400 questions, each with a clear answer, a code example (runnable ones open in the compiler), the likely follow-up, difficulty and how often it is asked. Filter by search, difficulty, "most asked" and status. Mark questions **Known** or **Review later** (XP the first time), drill them in **Practice** mode one at a time (in order or shuffled), deep-link to a question, and print or download a PDF with every answer. `/questions/top` collects the most-asked questions across all technologies. |
| **Quiz** | `/quiz` has **multiple-choice questions** for all 16 technologies (192 in total), with highlighted code where the question is about a snippet. Choices are shuffled every time; picking one shows straight away whether it is right and why. Play all 12, a quick 10, or only the ones you have not got right yet; keys 1–4 answer and Enter moves on. The results screen lists what you missed, with a **Retry missed** button. `/quiz/mixed` draws 15 from every technology. A test keeps the correct answer from usually being the longest or shortest choice. |
| **Typing** | A typing.com-style trainer at `/typing`: 27 lessons in three tracks. **Beginner** goes from the home row out two keys at a time; **Intermediate** covers Shift, punctuation, numbers, common words and sentences; **Code** covers brackets, operators, developer symbols, and real JavaScript, Python and SQL (snippets from the notes, with auto-indent after Enter). An on-screen keyboard tinted by finger highlights the next key (and the opposite-hand Shift), with a hand guide and live WPM / accuracy. Lessons award 1–3 stars. **Interview syntax**: 137 snippets in 12 sets (JavaScript, Promises & async, TypeScript, React, Next.js, Node.js, Express, NestJS, Testing, SQL, MongoDB, Python) of the code interviewers ask you to write; type each in **Copy** mode, then write it in **Memory** mode (text hidden, a mistake shows the right character, Peek reveals it briefly) until it is marked memorised. Every snippet is syntax-checked by the tests (TypeScript compiler, Python `ast`, SQL run on SQLite). **Typing tests** run 15 s to 10 min, or **Auto** (a passage sized to your recent speed), with words, punctuation, numbers, **sentences from the technology notes** (pick a technology, with a link to read its notes) or interview code (filter by technology), and show a WPM-per-second chart, errors and a missed-key heatmap. Personal bests, recent tests and a heatmap of your weakest keys across every session are kept in the progress store. |
| **Mind map** | `/map` puts every technology on one zoomable, pannable map: Full-stack → category → technology → section → the ideas to remember (definitions, key points, flows drawn as chains, table rows, common mistakes, tips) plus a "Most asked" branch of interview questions. System Design and DSA are grouped by theme. Scroll or pinch to zoom, drag to move, click to open a branch (it stays put while the tree reflows), search with `/`, show Technologies / Sections / Everything, go full screen, and use **Recall** mode to blur the details and test your memory. `/map/<tech>` opens one technology. **Create mind map** (`/map/create`) lets you build your own maps: a central topic with branches split left and right, **Tab** for a child idea, **Enter** for the next one, typing to rename, arrow keys to move around, drag a node onto another to move its branch, branch colours, folding, undo/redo, and export as PNG, a Markdown outline or a JSON backup (which you can import again). Start blank or from any technology's notes sections. Maps are saved in `localStorage`. The layout (`src/lib/user-mindmap.ts`) is tested for overlaps. The layout is a tidy tree measured from the real card sizes (`src/lib/mindmap*.ts`, tested for overlaps). |
| **Whiteboard** | An Excalidraw whiteboard at `/board`, for learning by drawing and for teaching. Each notes topic gets a **concept board** generated from its notes. One hand-drawn frame per section (definitions, flow diagrams with arrows, tables, code, mistakes) plus a cover and Q&A sticky notes. **Present** goes full screen and steps through the frames as slides, with laser pointer and pen. **Import PDF** turns every page of any PDF into a slide you can annotate; the System Design and DSA volumes have ready-made PDF boards. **Export PDF** downloads one page per frame. The library sidebar has teaching shapes (client, server, DB, cache, queue, load balancer, CDN, callouts). Boards save to IndexedDB in the browser. Pre-exported concept-board PDFs are in `public/notes/boards/`. |
| **Progress** | XP and levels, day streak, daily goal ring, 18-week activity heatmap, 10 badges, JSON export/import, reset. Everything stays in `localStorage`, so no account is needed. |
| **Technology logos** | Every language and topic shows its logo ([Devicon](https://devicon.dev), MIT), in the compiler, notes, questions, flashcards, whiteboards, the home page and the Ctrl+K menu. They are static SVGs in `public/icons/tech` (`npm run icons` refreshes them), so they add no JavaScript; topics without a logo (security, system design, DSA) use a line icon. |
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

After editing notes or questions, regenerate the downloadable PDFs: the handwritten notes in `public/notes/`, the concept boards in `public/notes/boards/` and the question sets in `public/notes/questions/`. This needs Playwright and a running `next start` on port 3100:

```sh
npm run notes:pdf  # optional args: base URL, then stages (notes boards questions)
```

Node 22.18 or newer is needed, because `build:bank` runs a TypeScript file directly.

## Online compiler

| Language | Runs on | How |
| --- | --- | --- |
| Python | browser | Pyodide (CPython → WebAssembly) in a module worker; `input()` reads the stdin box |
| R | browser | webR, with plots rendered as images |
| SQL | browser | sql.js (SQLite → WebAssembly) with `customers` / `orders` / `shippings` sample tables and a Reset DB button |
| MongoDB | browser | [mingo](https://github.com/kofrasa/mingo) (MongoDB's query language for in-memory objects) behind a small mongosh-style shell in a Web Worker (`src/lib/run/mongo-engine.ts`). Sample `shop` database (`customers`, `products`, `orders`), state kept between runs, Reset DB button |
| HTML/CSS | browser | sandboxed `<iframe>` live preview with its `console.log` piped below |
| JavaScript, TypeScript | browser | Web Worker; TypeScript is transpiled with sucrase (types are stripped, not checked) |
| C, C++, Java, C#, Go, Rust, Scala, Ruby, PHP, Swift | online, from the browser | The page calls the public [Wandbox](https://wandbox.org) API directly (CORS-enabled, no key, **no backend needed**). It picks the newest released compiler from Wandbox's list (`src/lib/run/wandbox.ts`) |
| Any compiled language, once a runner is configured; Kotlin and Dart always | server | `POST /api/run` → Piston, Judge0, or local toolchains (dev only). Used first when configured; see below |

The WebAssembly runtimes, the whiteboard's Excalidraw fonts and the pdf.js worker are copied from `node_modules` into `public/vendor/` by `scripts/vendor-runtimes.mjs` (on install, dev and build), so no third-party CDN is used. The first Python run downloads about 13 MB and the first R run about 45 MB; after that the browser cache serves them.

Limits: 64 KB of code or input, 64 KB of output, a compile timeout of 20 s and a run timeout of 6 s on the server (5 s for JS, 15 s for Python and 20 s for R in the browser), and 30 runs per minute per IP.

### Running compiled languages

Most compiled languages already work with **no setup**, because the browser talks to Wandbox itself. Your code is sent to that public service, and it can be slow, rate-limited or change its rules. If you configure a server runner below, the app uses **it first** (it is faster and covers Kotlin and Dart too) and keeps Wandbox as the fallback when no runner is set.

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
  app/            routes: / · /compiler/[lang] · /campaign/[id] · /endless/[level] · /flashcards/[deck] · /progress · /notes/[topic] · /questions/[set] · /map/[tech] · /typing/lesson/[id] · /typing/syntax/[set] · /typing/test · /board/[id] · /api/run
  components/     shell, command palette, play screen, editor, diff view, UI primitives
  components/notes/  notes block renderer, Shiki highlighting (build time), code actions
  data/           campaign levels, algorithm library, verified bug bank, flashcard decks
  data/notes/     one file per full-stack notes topic (typed blocks: def, code, table, flow, mistake…)
  data/questions/ one file per technology: most-asked interview questions (validated by tests/questions.test.ts)
  data/syntax/    interview-syntax snippets for typing practice (validated by tests/syntax.test.ts)
  lib/            test runner (worker + shared core), mutation engine, SRS, progress store
  lib/run/        in-browser runtimes for the compiler (JS/TS worker, SQLite worker, webR) + dispatcher
  lib/exec/       server runners: Piston, Judge0, local
  lib/board/      whiteboard: notes → Excalidraw concept boards, PDF import/export, teaching library, IndexedDB store
public/runners/   Python worker (static module worker that loads Pyodide)
public/notes/     PDF volumes, one handwritten PDF per notes topic, boards/ concept-board PDFs, questions/ question-set PDFs
scripts/          build-bank.ts, vendor-runtimes.mjs, export-notes-pdf.mjs, build-tech-icons.mjs
tests/            vitest suites
```

Built with Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, CodeMirror 6, Shiki, Excalidraw, pdf.js, pdf-lib, Pyodide, webR, sql.js and lucide icons.

### MongoDB playground

Open `/compiler/mongodb`. Write mongosh-style JavaScript: `db.customers.find({ country: "India" })`, `db.orders.aggregate([...])`, `insertOne/insertMany`, `updateOne/updateMany` (with `$set`, `$inc`, `$push`, upsert...), `deleteOne/deleteMany`, `createIndex`, `explain()`, plus `const`, functions, loops, `print()`, `ObjectId()` and `ISODate()`. Each statement prints its own result card, and data persists between runs until **Reset DB**. It is an emulation, not a real `mongod`: there is no server, transactions, change streams, `$out`/`$merge` or full index behaviour (`explain()` is a simplified plan).

The **Learn** tab has 12 lessons (documents, filters, projection and sorting, inserts, updates, arrays, deletes, aggregation, `$unwind`, `$lookup`, indexes). Each has an example you can load or run and a challenge. **Check my answer** runs your code and a reference solution on identical fresh databases and compares the results (the data afterwards, for writes), so any correct answer passes. Solved lessons are stored in the progress store and earn XP. Lessons live in `src/data/mongo-lessons.ts`; `tests/mongo.test.ts` runs every example and solution.
