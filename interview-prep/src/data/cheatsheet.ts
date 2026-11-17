// One-page quick-revision sheets, one per notes topic (same ids as src/data/notes).
// Rows are [syntax, meaning]; text fields support the notes mini-markup (`code`, **bold**, ==highlight==).

export interface SheetGroup {
  title: string
  rows: [string, string][]
}

export interface Sheet {
  /** Matches a notes topic id; title, colour and category come from there. */
  id: string
  groups: SheetGroup[]
  gotchas: string[]
}

export const SHEETS: Sheet[] = [
  {
    id: 'html',
    groups: [
      {
        title: 'Structure & semantics',
        rows: [
          ['<header> <nav> <main> <footer>', 'Page landmarks; one `<main>` per page'],
          ['<section> <article> <aside>', 'Themed group / standalone content / side content'],
          ['<h1>–<h6>', 'Headings in order, one `<h1>`, never skip levels'],
          ['<button> vs <a>', '`<button>` does an action, `<a href>` navigates'],
          ['<img alt="…" loading="lazy">', '`alt` is required; empty `alt=""` for decorative images'],
        ],
      },
      {
        title: 'Forms',
        rows: [
          ['<label for="id"> + <input id="id">', 'Links the label to the field (click target + screen readers)'],
          ['type="email|number|date|password"', 'Right keyboard + built-in validation'],
          ['required minlength pattern', 'Built-in constraint validation'],
          ['<form method="post" action="/x">', '`GET` puts data in the URL, `POST` in the body'],
          ['name="…"', 'Without `name` the field is not submitted'],
        ],
      },
      {
        title: 'Head, SEO & performance',
        rows: [
          ['<meta name="viewport" content="width=device-width, initial-scale=1">', 'Makes pages responsive on phones'],
          ['<title> + <meta name="description">', 'What search results show'],
          ['<script defer> / <script async>', '`defer` runs after parsing, in order; `async` runs as soon as loaded'],
          ['<link rel="preload|preconnect">', 'Hint the browser to fetch early'],
          ['aria-label, role, tabindex', 'Accessibility attributes: use only when native HTML is not enough'],
        ],
      },
    ],
    gotchas: [
      'Use native elements first (`<button>`, `<nav>`) before reaching for ARIA.',
      '`<div onclick>` is not keyboard accessible; use a `<button>`.',
      'Block elements start a new line; inline elements flow. `<span>` and `<a>` are inline.',
    ],
  },
  {
    id: 'css',
    groups: [
      {
        title: 'Box model & layout',
        rows: [
          ['box-sizing: border-box', 'Width includes padding + border (set it globally)'],
          ['margin / padding / border', 'Outside space / inside space / edge'],
          ['display: flex; justify-content; align-items; gap', 'One-dimensional layout; main axis vs cross axis'],
          ['display: grid; grid-template-columns: repeat(3, 1fr)', 'Two-dimensional layout'],
          ['position: relative | absolute | fixed | sticky', 'Absolute is placed against the nearest positioned ancestor'],
          ['z-index', 'Only works on positioned elements (or flex/grid items); creates stacking contexts'],
        ],
      },
      {
        title: 'Selectors & specificity',
        rows: [
          ['.a .b  /  .a > .b  /  .a + .b', 'Descendant / child / next sibling'],
          [':hover :focus-visible :nth-child(2n)', 'Pseudo-classes'],
          ['::before  ::after', 'Pseudo-elements (need `content`)'],
          ['inline > #id > .class > tag', 'Specificity order; `!important` beats all (avoid it)'],
          [':is()  :where()  :has()', 'Group selectors; `:where` has zero specificity; `:has` is the parent selector'],
        ],
      },
      {
        title: 'Responsive & modern',
        rows: [
          ['@media (min-width: 768px) { … }', 'Mobile-first breakpoints'],
          ['rem  em  %  vw  vh', 'Root-relative / parent-relative / of parent / of viewport'],
          ['clamp(1rem, 2vw, 2rem)', 'Fluid value with min and max'],
          ['var(--brand)  with  :root { --brand: #4f46e5 }', 'Custom properties (CSS variables)'],
          ['transition: opacity .2s ease;', 'Animate between states; prefer `transform`/`opacity` (GPU friendly)'],
        ],
      },
    ],
    gotchas: [
      'Margins between siblings collapse vertically; padding and flex/grid gaps do not.',
      'Centre with flex: `display:flex; justify-content:center; align-items:center`.',
      '`height: 100%` needs a parent with a height; use `min-height: 100vh` for full-screen sections.',
    ],
  },
  {
    id: 'javascript',
    groups: [
      {
        title: 'Variables, types & equality',
        rows: [
          ['const / let / var', '`const` default, `let` if reassigned, avoid `var` (function-scoped, hoisted)'],
          ['typeof null  →  "object"', 'Historic bug; check `x === null`'],
          ['== vs ===', '`===` has no type coercion: always use it'],
          ['0, "", null, undefined, NaN, false', 'The falsy values'],
          ['a ?? b   a?.b   a ||= b', 'Nullish default / optional chaining / assign if falsy'],
          ['Number.isNaN(x)', '`NaN !== NaN`, so compare with this'],
        ],
      },
      {
        title: 'Arrays & objects',
        rows: [
          ['map  filter  reduce', 'Transform / keep / fold into one value (all return new values)'],
          ['find  some  every  includes', 'First match / any / all / contains'],
          ['[...a, x]   {...o, k: v}', 'Spread = shallow copy'],
          ['const {a, b = 1} = obj;  const [x, ...rest] = arr', 'Destructuring with defaults and rest'],
          ['Object.keys / values / entries', 'Iterate an object'],
          ['structuredClone(obj)', 'Deep copy (JSON round-trip loses dates, undefined, functions)'],
        ],
      },
      {
        title: 'Functions, this & scope',
        rows: [
          ['(a, b) => a + b', 'Arrow: no own `this`, no `arguments`'],
          ['closure', 'A function remembers the variables of where it was created'],
          ['fn.call(x, a)  fn.apply(x, [a])  fn.bind(x)', 'Set `this`: call now / call now with array / return new function'],
          ['hoisting', '`function` declarations and `var` are hoisted; `let/const` are in the temporal dead zone'],
          ['debounce / throttle', 'Wait until quiet / at most once per interval'],
        ],
      },
      {
        title: 'Async & event loop',
        rows: [
          ['Promise.all / allSettled / race / any', 'All succeed / all results / first settled / first success'],
          ['async function → Promise;  await', '`await` pauses the function, not the thread'],
          ['try { await f() } catch (e) {}', 'Error handling for async code'],
          ['call stack → microtasks → macrotasks', 'Promises (`.then`, `await`) run before `setTimeout` callbacks'],
          ['fetch(url).then(r => r.json())', '`fetch` only rejects on network errors; check `r.ok`'],
        ],
      },
    ],
    gotchas: [
      '`var` in a loop with `setTimeout` prints the last value: use `let`.',
      '`[] + {}`, `"5" - 2`, `"5" + 2` are coercion traps; convert explicitly.',
      '`array.sort()` sorts as strings and mutates: pass a comparator `(a,b)=>a-b`.',
      '`forEach` ignores `await`; use `for…of` for sequential async work.',
    ],
  },
  {
    id: 'typescript',
    groups: [
      {
        title: 'Types',
        rows: [
          ['string number boolean null undefined', 'Primitives'],
          ['string[]  Array<string>  [string, number]', 'Array / generic array / tuple'],
          ['type A = { id: number; name?: string }', 'Object type, `?` = optional'],
          ['interface A { id: number }', 'Extendable object shape (`extends`); declarations merge'],
          ['"admin" | "user"', 'Union of literals (like an enum)'],
          ['A & B', 'Intersection: has everything from both'],
          ['unknown  vs  any', '`unknown` forces a check first; `any` turns the checker off'],
        ],
      },
      {
        title: 'Utility types & generics',
        rows: [
          ['Partial<T>  Required<T>  Readonly<T>', 'All optional / all required / all readonly'],
          ['Pick<T,"a">  Omit<T,"a">', 'Keep / drop keys'],
          ['Record<string, number>', 'Object used as a map'],
          ['ReturnType<typeof fn>  Awaited<T>', 'Derive types from code'],
          ['function id<T>(x: T): T', 'Generic: the type is a parameter'],
          ['keyof T   typeof x   T[K]', 'Keys / type of a value / indexed access'],
        ],
      },
      {
        title: 'Narrowing',
        rows: [
          ['typeof x === "string"', 'Narrow primitives'],
          ['x instanceof Date  /  "k" in obj', 'Narrow classes / by property'],
          ['{ kind: "a" } | { kind: "b" }', 'Discriminated union: switch on `kind`'],
          ['x as Foo   x!', 'Assertions: you promise the compiler; no runtime check'],
          ['const x = [..] as const', 'Deep readonly literal types'],
        ],
      },
    ],
    gotchas: [
      'Types vanish at runtime: validate API data (e.g. with zod) instead of trusting a cast.',
      'Turn on `strict: true`; it catches `null`/`undefined` bugs.',
      '`interface` for object shapes you extend, `type` for unions and computed types.',
    ],
  },
  {
    id: 'react',
    groups: [
      {
        title: 'Hooks',
        rows: [
          ['const [v, setV] = useState(0)', 'State; `setV(p => p + 1)` when it depends on the previous value'],
          ['useEffect(() => { …; return cleanup }, [deps])', 'Side effects after render; `[]` = once; cleanup runs before re-run/unmount'],
          ['useRef(null)', 'Mutable box that does not re-render; DOM refs'],
          ['useMemo / useCallback', 'Cache a value / a function between renders (only when it matters)'],
          ['useContext(Ctx)', 'Read shared data without prop drilling'],
          ['useReducer(reducer, init)', 'State with many transitions'],
        ],
      },
      {
        title: 'Rendering rules',
        rows: [
          ['{cond && <A/>}  {cond ? <A/> : <B/>}', 'Conditional rendering (`0 && …` prints 0!)'],
          ['{items.map(i => <Li key={i.id} />)}', 'Stable unique `key`, not the array index when the list changes'],
          ['<Child {...props} />', 'Pass props; props are read-only'],
          ['setState → re-render', 'State updates are batched and asynchronous'],
          ['React.memo(Component)', 'Skip re-render when props are shallow-equal'],
        ],
      },
      {
        title: 'Patterns',
        rows: [
          ['Lifting state up', 'Move state to the nearest common parent'],
          ['Controlled input: value + onChange', 'React owns the value'],
          ['Custom hook `useThing()`', 'Reuse stateful logic'],
          ['Error boundary', 'Catches render errors in children (class component / library)'],
          ['Suspense + lazy()', 'Code-split and show a fallback'],
        ],
      },
    ],
    gotchas: [
      'Never mutate state: `setList([...list, x])`, not `list.push(x)`.',
      'Missing or wrong effect dependencies cause stale values or infinite loops.',
      'Hooks only at the top level of a component, never in conditions or loops.',
      'Objects/arrays created in render are new every time: they defeat `memo` and trigger effects.',
    ],
  },
  {
    id: 'nextjs',
    groups: [
      {
        title: 'App Router files',
        rows: [
          ['app/page.tsx', 'The route `/`'],
          ['app/blog/[slug]/page.tsx', 'Dynamic route; read `params`'],
          ['layout.tsx', 'Shared UI that persists between pages'],
          ['loading.tsx  error.tsx  not-found.tsx', 'Loading UI / error boundary / 404'],
          ['app/api/x/route.ts  (export GET, POST)', 'Route handlers (API endpoints)'],
          ['middleware / proxy', 'Runs before a request: redirects, auth checks'],
        ],
      },
      {
        title: 'Server vs client',
        rows: [
          ['Server Component (default)', 'Runs on the server, can `await` data, ships no JS to the browser'],
          ['"use client"', 'Needed for state, effects, event handlers, browser APIs'],
          ['"use server" (Server Actions)', 'Functions called from forms/clients that run on the server'],
          ['next/link  next/image  next/font', 'Prefetching navigation / optimised images / zero-layout-shift fonts'],
          ['export const metadata = {…}', 'SEO title and description'],
        ],
      },
      {
        title: 'Rendering strategies',
        rows: [
          ['SSG', 'Built once at build time: fastest'],
          ['SSR (dynamic)', 'Rendered per request: fresh data per user'],
          ['ISR / revalidate', 'Static pages refreshed on a timer or on demand'],
          ['CSR', 'Fetched in the browser after load'],
        ],
      },
    ],
    gotchas: [
      'Secrets only on the server: only `NEXT_PUBLIC_` variables reach the browser.',
      'You cannot import a server-only module into a Client Component.',
      'Data fetched in Server Components can be cached: know your revalidate settings.',
    ],
  },
  {
    id: 'nodejs',
    groups: [
      {
        title: 'Core ideas',
        rows: [
          ['Single thread + event loop', 'Great for I/O-bound work, bad for heavy CPU (use worker threads)'],
          ['require() / module.exports  vs  import / export', 'CommonJS vs ES modules'],
          ['process.env.X   process.argv', 'Environment variables / CLI arguments'],
          ['fs.promises.readFile(path, "utf8")', 'Prefer async file APIs'],
          ['Stream: pipe(src, dest)', 'Process big data in chunks without loading it all'],
          ['EventEmitter: on / emit', 'Publish-subscribe inside the process'],
        ],
      },
      {
        title: 'Event loop order',
        rows: [
          ['process.nextTick', 'Runs first after the current operation'],
          ['Promise microtasks', 'Next, before timers'],
          ['setTimeout / setInterval', 'Timers phase'],
          ['setImmediate', 'Check phase, after I/O callbacks'],
        ],
      },
      {
        title: 'Production',
        rows: [
          ['cluster / PM2 / containers', 'Use all CPU cores / keep it running'],
          ['try/catch + process.on("unhandledRejection")', 'Never let rejections go unhandled'],
          ['dotenv, config per environment', 'Keep secrets out of the code'],
          ['npm ci', 'Clean, reproducible install from the lockfile'],
        ],
      },
    ],
    gotchas: [
      'Blocking the loop (big loops, sync fs, heavy JSON) freezes every request.',
      'Callbacks are `(err, data)`: always check `err` first.',
      '`dependencies` vs `devDependencies`: production installs skip dev.',
    ],
  },
  {
    id: 'express',
    groups: [
      {
        title: 'Basics',
        rows: [
          ['app.get("/users/:id", (req, res) => …)', 'Route with a path parameter'],
          ['req.params / req.query / req.body / req.headers', 'URL param / `?a=1` / JSON body / headers'],
          ['res.status(201).json({ ok: true })', 'Send a status and JSON'],
          ['app.use(express.json())', 'Parse JSON bodies (needed before routes)'],
          ['express.Router()', 'Group routes by feature'],
        ],
      },
      {
        title: 'Middleware & errors',
        rows: [
          ['(req, res, next) => { …; next() }', 'Middleware: do work then pass control on'],
          ['(err, req, res, next) => …', 'Error handler: four arguments, registered last'],
          ['next(err)', 'Jump to the error handler'],
          ['cors()  helmet()  morgan()  rateLimit()', 'CORS / security headers / logging / throttling'],
          ['auth middleware: verify JWT → req.user', 'Protect routes'],
        ],
      },
      {
        title: 'HTTP status codes',
        rows: [
          ['200 / 201 / 204', 'OK / Created / No content'],
          ['400 / 401 / 403 / 404 / 409 / 422', 'Bad request / not logged in / not allowed / not found / conflict / validation'],
          ['429', 'Too many requests'],
          ['500 / 502 / 503', 'Server error / bad gateway / unavailable'],
        ],
      },
    ],
    gotchas: [
      'Middleware order matters: `express.json()` and CORS go before the routes.',
      'Always respond exactly once; `return res.json()` to avoid "headers already sent".',
      'Async errors need `try/catch` or a wrapper (Express 5 forwards rejected promises).',
    ],
  },
  {
    id: 'python',
    groups: [
      {
        title: 'Data structures',
        rows: [
          ['list [1,2]  tuple (1,2)', 'Mutable / immutable sequences'],
          ['dict {"a": 1}   d.get("k", default)', 'Key-value map; `.get` avoids `KeyError`'],
          ['set {1,2}   a & b   a | b   a - b', 'Unique values; intersection / union / difference'],
          ['[x*2 for x in xs if x > 0]', 'List comprehension (also dict/set)'],
          ['a[1:3]  a[::-1]  a[-1]', 'Slicing, reverse, last item'],
          ['sorted(xs, key=lambda x: x[1], reverse=True)', 'Sort without mutating'],
        ],
      },
      {
        title: 'Functions & OOP',
        rows: [
          ['def f(a, b=1, *args, **kwargs)', 'Defaults, extra positionals, extra keywords'],
          ['lambda x: x + 1', 'Anonymous one-expression function'],
          ['class A: def __init__(self, x): self.x = x', 'Constructor; `self` is the instance'],
          ['@dataclass', 'Generates `__init__`, `__repr__`, `__eq__`'],
          ['@decorator', 'Wrap a function to add behaviour'],
          ['yield', 'Generator: lazy values, one at a time'],
        ],
      },
      {
        title: 'Handy built-ins',
        rows: [
          ['enumerate(xs)  zip(a, b)', 'Index + item / pair up'],
          ['with open(p) as f:', 'Context manager: closes the file for you'],
          ['try / except ValueError / finally', 'Error handling'],
          ['f"{name}: {n:.2f}"', 'f-string formatting'],
          ['collections: Counter, defaultdict, deque', 'Counting / default values / fast queue'],
        ],
      },
    ],
    gotchas: [
      'Mutable default arguments (`def f(x=[])`) are shared between calls: use `None`.',
      '`is` compares identity, `==` compares value.',
      '`a = b` for lists copies the reference; use `.copy()` or `list(a)`.',
      'Indentation is syntax: mix tabs and spaces and it breaks.',
    ],
  },
  {
    id: 'django',
    groups: [
      {
        title: 'Project flow (MVT)',
        rows: [
          ['urls.py → view → template', 'Request → URL match → view logic → HTML'],
          ['models.py', 'Tables as Python classes (ORM)'],
          ['python manage.py makemigrations / migrate', 'Create then apply schema changes'],
          ['python manage.py runserver / createsuperuser', 'Dev server / admin account'],
          ['settings.py', 'INSTALLED_APPS, DATABASES, MIDDLEWARE, SECRET_KEY, DEBUG'],
        ],
      },
      {
        title: 'ORM',
        rows: [
          ['Post.objects.filter(author=u).order_by("-created")', 'Query (lazy: runs when iterated)'],
          ['.get(id=1)  .first()  .exists()  .count()', 'One row (raises if missing) / first / boolean / count'],
          ['.select_related("author")', 'JOIN for ForeignKey: fixes N+1'],
          ['.prefetch_related("tags")', 'Extra query for many-to-many / reverse FK'],
          ['Q(a=1) | Q(b=2)   F("price") * 2', 'OR conditions / reference another column'],
          ['ForeignKey  OneToOneField  ManyToManyField', 'Relationships'],
        ],
      },
      {
        title: 'Views, forms, DRF',
        rows: [
          ['def view(request): return render(request, "t.html", ctx)', 'Function-based view'],
          ['ListView / DetailView / CreateView', 'Class-based generic views'],
          ['{% csrf_token %}', 'Required in every POST form'],
          ['ModelSerializer + ViewSet (DRF)', 'JSON APIs with little code'],
          ['@login_required  permission_classes', 'Protect views'],
        ],
      },
    ],
    gotchas: [
      'N+1 queries: use `select_related` / `prefetch_related`.',
      'Never deploy with `DEBUG = True`; keep `SECRET_KEY` out of git.',
      'Commit migrations; never edit applied ones.',
    ],
  },
  {
    id: 'fastapi',
    groups: [
      {
        title: 'Basics',
        rows: [
          ['@app.get("/items/{id}")  def read(id: int)', 'Path parameter, type-validated'],
          ['def f(q: str | None = None)', 'Query parameter (`?q=`)'],
          ['class Item(BaseModel): name: str; price: float', 'Request body with Pydantic validation'],
          ['response_model=ItemOut', 'Filter/shape the response (hide secrets)'],
          ['uvicorn main:app --reload', 'Run the dev server; docs at `/docs`'],
        ],
      },
      {
        title: 'Dependencies & security',
        rows: [
          ['Depends(get_db)', 'Dependency injection: DB session, current user'],
          ['OAuth2PasswordBearer + JWT', 'Token auth pattern'],
          ['HTTPException(status_code=404, detail="…")', 'Return an error response'],
          ['CORSMiddleware', 'Allow your frontend origin'],
          ['BackgroundTasks', 'Run work after the response is sent'],
        ],
      },
      {
        title: 'Async',
        rows: [
          ['async def', 'Use for I/O with async libraries (httpx, async DB drivers)'],
          ['def (sync)', 'Runs in a thread pool: fine for blocking code'],
        ],
      },
    ],
    gotchas: [
      'Do not call blocking code inside `async def`: it stalls the whole server.',
      'Validation errors return `422` automatically.',
      'Use separate input and output models (never return the password hash).',
    ],
  },
  {
    id: 'security',
    groups: [
      {
        title: 'Top attacks & the fix',
        rows: [
          ['SQL injection', 'Parameterised queries / ORM, never string-concatenate SQL'],
          ['XSS', 'Escape output, avoid `innerHTML`, set a Content-Security-Policy'],
          ['CSRF', 'SameSite cookies + CSRF tokens for cookie-based auth'],
          ['Broken access control', 'Check ownership on the server for every request'],
          ['SSRF', 'Allow-list outgoing URLs the server may fetch'],
          ['Sensitive data exposure', 'HTTPS everywhere, never log secrets'],
        ],
      },
      {
        title: 'Auth',
        rows: [
          ['Hash passwords: bcrypt / argon2', 'Salted, slow hashes: never MD5/SHA1, never encrypt'],
          ['Session cookie vs JWT', 'Server-side session is easy to revoke; JWT is stateless but hard to revoke'],
          ['Cookie flags: HttpOnly; Secure; SameSite', 'Stop JS reading it / HTTPS only / limit cross-site sending'],
          ['Access token (short) + refresh token (long)', 'Limit damage when a token leaks'],
          ['401 vs 403', 'Not authenticated vs authenticated but not allowed'],
        ],
      },
      {
        title: 'Headers & hygiene',
        rows: [
          ['CORS', 'Browser rule: only allow listed origins; not a server-side security tool'],
          ['Helmet / security headers', 'CSP, HSTS, X-Content-Type-Options'],
          ['Rate limiting', 'Slow brute-force and abuse'],
          ['Validate input on the server', 'Client checks are for UX only'],
          ['npm audit, pin dependencies', 'Supply-chain safety'],
        ],
      },
    ],
    gotchas: [
      'Never trust the client: user id, price and role come from the server, not the request.',
      'localStorage tokens are readable by any XSS; an HttpOnly cookie is safer.',
      'Hashing is one-way, encryption is reversible, encoding (Base64) is neither secure.',
    ],
  },
  {
    id: 'sql',
    groups: [
      {
        title: 'Querying',
        rows: [
          ['SELECT cols FROM t WHERE … GROUP BY … HAVING … ORDER BY … LIMIT n', 'Writing order'],
          ['FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY', 'Execution order (why aliases fail in `WHERE`)'],
          ['COUNT(*)  SUM  AVG  MIN  MAX', 'Aggregates; `COUNT(col)` skips NULLs'],
          ['WHERE col IS NULL', '`= NULL` is never true'],
          ['LIKE "a%"   IN (…)   BETWEEN a AND b', 'Pattern / list / range'],
          ['DISTINCT   LIMIT 10 OFFSET 20', 'Unique rows / paging'],
        ],
      },
      {
        title: 'Joins & sets',
        rows: [
          ['INNER JOIN', 'Only rows that match on both sides'],
          ['LEFT JOIN', 'All left rows, NULL where no match (find "without" rows with `WHERE r.id IS NULL`)'],
          ['FULL OUTER JOIN', 'All rows from both'],
          ['CROSS JOIN', 'Every combination'],
          ['UNION  vs  UNION ALL', 'Remove duplicates / keep them (faster)'],
          ['WITH x AS (…) SELECT …', 'CTE: a named subquery'],
        ],
      },
      {
        title: 'Window functions & design',
        rows: [
          ['ROW_NUMBER() OVER (PARTITION BY d ORDER BY s DESC)', 'Rank rows inside groups: top N per group'],
          ['RANK  DENSE_RANK', 'Ties share a rank (`RANK` leaves gaps)'],
          ['LAG(x) OVER (…)  SUM(x) OVER (…)', 'Previous row / running total'],
          ['CREATE INDEX ON t(col)', 'Faster reads, slower writes; index columns used in `WHERE`/`JOIN`'],
          ['BEGIN … COMMIT / ROLLBACK', 'Transaction: all or nothing (ACID)'],
          ['1NF → 2NF → 3NF', 'Atomic values → no partial dependency → no transitive dependency'],
        ],
      },
    ],
    gotchas: [
      '`WHERE` filters rows, `HAVING` filters groups.',
      'A leading wildcard (`LIKE "%abc"`) and functions on a column prevent index use.',
      '`NOT IN` with a NULL in the list returns nothing: use `NOT EXISTS`.',
      '`SELECT *` in production code hides cost and breaks on schema changes.',
    ],
  },
  {
    id: 'mongodb',
    groups: [
      {
        title: 'CRUD',
        rows: [
          ['db.users.insertOne({ name: "A" })', 'Create (`insertMany` for several)'],
          ['db.users.find({ age: { $gt: 18 } }, { name: 1 })', 'Read with filter and projection'],
          ['db.users.updateOne({ _id }, { $set: { age: 30 } })', 'Update only listed fields'],
          ['db.users.deleteOne({ _id })', 'Delete'],
          ['.sort({ age: -1 }).skip(20).limit(10)', 'Order and paginate'],
        ],
      },
      {
        title: 'Operators',
        rows: [
          ['$gt $gte $lt $lte $ne $in $nin', 'Comparison'],
          ['$and $or $not', 'Logic'],
          ['$set $unset $inc $push $pull $addToSet', 'Update operators'],
          ['$exists  $regex  $elemMatch', 'Field present / pattern / match inside arrays'],
        ],
      },
      {
        title: 'Aggregation & design',
        rows: [
          ['$match → $group → $sort → $project', 'Pipeline stages run in order'],
          ['$lookup', 'Left join with another collection'],
          ['createIndex({ email: 1 }, { unique: true })', 'Index + unique constraint'],
          ['Embed vs reference', 'Embed data read together (1-to-few); reference for large or shared data'],
          ['explain("executionStats")', 'Check whether a query used an index (`IXSCAN` vs `COLLSCAN`)'],
        ],
      },
    ],
    gotchas: [
      'Replacing a document without `$set` overwrites all of its fields.',
      'No enforced schema: validate in the app (Mongoose) or with schema validation.',
      'Documents are capped at 16 MB; unbounded arrays are an anti-pattern.',
    ],
  },
  {
    id: 'git',
    groups: [
      {
        title: 'Everyday',
        rows: [
          ['git status   git diff   git log --oneline --graph', 'See what is going on'],
          ['git add -p   git commit -m "msg"', 'Stage chunks, then snapshot'],
          ['git switch -c feature/x', 'New branch'],
          ['git pull --rebase   git push -u origin x', 'Update / publish'],
          ['git stash   git stash pop', 'Park uncommitted work'],
          ['git clone url', 'Copy a repo'],
        ],
      },
      {
        title: 'Undo',
        rows: [
          ['git restore file', 'Discard unstaged changes'],
          ['git restore --staged file', 'Unstage'],
          ['git commit --amend', 'Fix the last commit (unpushed only)'],
          ['git revert <sha>', 'New commit that undoes one: safe on shared branches'],
          ['git reset --soft | --mixed | --hard <sha>', 'Move branch (keep staged / keep files / discard everything)'],
          ['git reflog', 'Find "lost" commits: nearly everything is recoverable'],
        ],
      },
      {
        title: 'Collaboration',
        rows: [
          ['git merge x', 'Join histories (keeps true history, adds a merge commit)'],
          ['git rebase main', 'Replay your commits on top: linear history, rewrites commits'],
          ['git cherry-pick <sha>', 'Copy one commit'],
          ['Resolve conflict: edit → git add → git commit', 'Remove `<<<<<<<` markers first'],
          ['Pull request', 'Review + CI before merging'],
        ],
      },
    ],
    gotchas: [
      'Never rebase or force-push commits others have pulled (`--force-with-lease` if you must).',
      '`fetch` downloads; `pull` = fetch + merge/rebase.',
      'Committed a secret? Rotate it: removing it from history is not enough.',
    ],
  },
  {
    id: 'docker',
    groups: [
      {
        title: 'Commands',
        rows: [
          ['docker build -t app:1 .', 'Build an image from a Dockerfile'],
          ['docker run -d -p 8080:80 --name web app:1', 'Start a container (host:container port)'],
          ['docker ps  /  docker ps -a', 'Running / all containers'],
          ['docker logs -f web   docker exec -it web sh', 'Follow logs / open a shell'],
          ['docker stop web   docker rm web   docker rmi app:1', 'Stop / delete container / delete image'],
          ['docker compose up -d   docker compose down', 'Start / stop a multi-container app'],
        ],
      },
      {
        title: 'Dockerfile',
        rows: [
          ['FROM node:20-alpine', 'Base image (small, pinned tag)'],
          ['COPY package*.json ./  →  RUN npm ci  →  COPY . .', 'Copy dependency files first so the install layer is cached'],
          ['CMD ["node", "server.js"]', 'Default command (`ENTRYPOINT` for the fixed executable)'],
          ['EXPOSE 3000', 'Documents the port; `-p` actually publishes it'],
          ['multi-stage: FROM … AS build', 'Build in one stage, ship only the output'],
          ['.dockerignore', 'Keep `node_modules`, `.git`, secrets out of the image'],
        ],
      },
      {
        title: 'Concepts',
        rows: [
          ['Image vs container', 'Read-only template vs running instance'],
          ['Volume  -v data:/var/lib/…', 'Persist data beyond the container'],
          ['Network', 'Containers on one network reach each other by service name'],
          ['environment / env_file', 'Pass configuration, never bake secrets in'],
        ],
      },
    ],
    gotchas: [
      'Containers are disposable: anything not in a volume is lost on removal.',
      'Each `RUN`/`COPY` makes a layer; order instructions from least to most frequently changed.',
      '`localhost` inside a container is the container itself, not your machine.',
    ],
  },
  {
    id: 'testing',
    groups: [
      {
        title: 'Test types',
        rows: [
          ['Unit', 'One function/component in isolation: fast, many'],
          ['Integration', 'Several parts together (API + DB)'],
          ['End-to-end (Playwright, Cypress)', 'Real browser, real flow: slow, few'],
          ['Test pyramid', 'Many unit → some integration → few E2E'],
        ],
      },
      {
        title: 'Jest / Vitest',
        rows: [
          ['describe("x", () => { it("does y", () => {…}) })', 'Group and define tests'],
          ['expect(a).toBe(1)  .toEqual({…})', 'Primitive identity / deep equality'],
          ['.toThrow()  .resolves  .rejects', 'Errors and promises'],
          ['jest.fn()   vi.fn()', 'Mock function: check calls with `toHaveBeenCalledWith`'],
          ['jest.mock("./api")', 'Replace a module'],
          ['beforeEach / afterEach', 'Setup and cleanup per test'],
        ],
      },
      {
        title: 'React Testing Library',
        rows: [
          ['render(<A />); screen.getByRole("button", { name: /save/i })', 'Query like a user would'],
          ['await userEvent.click(btn)', 'Simulate real interaction'],
          ['await screen.findByText("Done")', 'Wait for async UI'],
          ['getBy / queryBy / findBy', 'Throws / returns null / waits'],
        ],
      },
    ],
    gotchas: [
      'Test behaviour, not implementation details; refactors should not break tests.',
      'Do not mock what you are testing; mock the network and the clock.',
      'Each test must be independent: no shared mutable state, no required order.',
      'Coverage % shows what ran, not whether it was asserted.',
    ],
  },
]
