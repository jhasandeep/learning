import type { TaskPath } from './types'

// The spec-tests task uses the same tiny test framework as the Testing path:
// `test(name, fn)` and `expect(value)` with toBe, toEqual, toBeTruthy, toContain and toThrow.
// YOUR tests run against the correct function and against broken copies.

const MINI = `function test(name, fn) { (test.list = test.list || []).push({ name, fn }); }
function expect(actual) {
  const fail = (msg) => { throw new Error(msg); };
  return {
    toBe: (e) => { if (actual !== e) fail("expected " + JSON.stringify(e) + " but got " + JSON.stringify(actual)); },
    toEqual: (e) => { if (JSON.stringify(actual) !== JSON.stringify(e)) fail("expected " + JSON.stringify(e) + " but got " + JSON.stringify(actual)); },
    toBeTruthy: () => { if (!actual) fail("expected a truthy value"); },
    toContain: (e) => { if (!actual.includes(e)) fail("expected it to contain " + JSON.stringify(e)); },
    toThrow: () => { let threw = false; try { actual(); } catch (e) { threw = true; } if (!threw) fail("expected the function to throw"); },
  };
}
function runUserTests() {
  const list = test.list || [];
  const failed = [];
  for (const t of list) { try { t.fn(); } catch (e) { failed.push(t.name); } }
  return { count: list.length, failed };
}
`

export const aiSdlc: TaskPath = {
  id: 'ai-sdlc',
  title: 'AI in the SDLC',
  blurb: 'Build the checks that keep AI-written code honest: tests from a spec, look-alike packages, secret redaction, release notes and a DORA report.',
  tasks: [
    {
      id: 'spec-tests',
      kind: 'run',
      language: 'javascript',
      title: 'Turn a spec into tests before the agent codes',
      goal: 'Write tests for `parseDuration(text)` straight from its spec, so they catch three broken implementations an agent might write.',
      steps: [
        'Spec: `"90m"` is 90 minutes, `"2h"` is 120, `"1h30m"` is 90. Anything else (empty, `"abc"`, `"5x"`) throws.',
        'Use `test("name", () => { ... })` with `expect(...).toBe(...)` and `expect(() => ...).toThrow()`.',
        'Write at least 4 tests: one per rule in the spec.',
      ],
      starter: `function parseDuration(text) {
  const m = /^(?:(\\d+)h)?(?:(\\d+)m)?$/.exec(text.trim());
  if (!text.trim() || !m) throw new Error("Invalid duration");
  return Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
}

// Write your tests below
`,
      hints: ['Each line of the spec is a test: minutes only, hours only, both, and bad input.', 'One broken version counts an hour as 100 minutes: `"2h"` alone does not show that unless you check the exact number.', 'Example: `test("rejects junk", () => { expect(() => parseDuration("abc")).toThrow(); });`'],
      solution: `function parseDuration(text) {
  const m = /^(?:(\\d+)h)?(?:(\\d+)m)?$/.exec(text.trim());
  if (!text.trim() || !m) throw new Error("Invalid duration");
  return Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
}

test("reads minutes", () => {
  expect(parseDuration("90m")).toBe(90);
});
test("reads hours", () => {
  expect(parseDuration("2h")).toBe(120);
});
test("reads hours and minutes", () => {
  expect(parseDuration("1h30m")).toBe(90);
});
test("rejects bad input", () => {
  expect(() => parseDuration("")).toThrow();
  expect(() => parseDuration("abc")).toThrow();
  expect(() => parseDuration("5x")).toThrow();
});
`,
      harness: `${MINI}const __good = parseDuration;
const __mutants = {
  "that ignores the hours": (t) => { const m = /(\\d+)m/.exec(t); if (!t.trim() || !/^(\\d+h)?(\\d+m)?$/.test(t.trim())) throw new Error("bad"); return m ? Number(m[1]) : 0; },
  "that returns 0 instead of throwing": (t) => { const m = /^(?:(\\d+)h)?(?:(\\d+)m)?$/.exec(t.trim()); return m ? Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0) : 0; },
  "that counts an hour as 100 minutes": (t) => { const m = /^(?:(\\d+)h)?(?:(\\d+)m)?$/.exec(t.trim()); if (!t.trim() || !m) throw new Error("bad"); return Number(m[1] ?? 0) * 100 + Number(m[2] ?? 0); },
};
check("You wrote at least 4 tests", () => runUserTests().count >= 4);
check("Your tests pass on the correct code", () => { parseDuration = __good; const r = runUserTests(); return r.count > 0 && r.failed.length === 0; });
const __catches = (m) => { parseDuration = m; const r = runUserTests(); parseDuration = __good; return r.count > 0 && r.failed.length > 0; };
check("Your tests catch a parser that ignores the hours", () => __catches(__mutants["that ignores the hours"]));
check("Your tests catch a parser that returns 0 instead of throwing", () => __catches(__mutants["that returns 0 instead of throwing"]));
check("Your tests catch a parser that counts an hour as 100 minutes", () => __catches(__mutants["that counts an hour as 100 minutes"]));`,
      learned: 'Tests written from the spec before the code give an agent a checkable definition of done, and only count if they fail on plausible wrong implementations.',
    },
    {
      id: 'lookalike-packages',
      kind: 'run',
      language: 'javascript',
      title: 'Catch look-alike package names',
      goal: 'Write `levenshtein(a, b)` and `findLookalikes(deps, known)` to flag dependencies whose names are one or two edits away from a well-known package.',
      steps: [
        '`levenshtein(a, b)` is the fewest single-character inserts, deletes or substitutions that turn `a` into `b`.',
        '`findLookalikes(deps, known)` checks each name in `deps` that is not itself in `known`.',
        'If its closest known name is 1 or 2 edits away, add `{ name, looksLike }`. Keep the order of `deps`.',
      ],
      starter: `function levenshtein(a, b) {
  // your code here
  return 0;
}

function findLookalikes(deps, known) {
  // your code here
  return [];
}`,
      hints: ['Hallucinated and typo-squatted packages are usually a letter or two away from a real one: `lodahs`, `expresss`.', 'Use a table where `d[i][j]` is the distance between the first `i` letters of `a` and the first `j` of `b`; row 0 and column 0 are `0, 1, 2, ...`.', '`d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1))`'],
      solution: `function levenshtein(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

function findLookalikes(deps, known) {
  const out = [];
  for (const name of deps) {
    if (known.includes(name)) continue;
    let best = null;
    let bestDist = Infinity;
    for (const k of known) {
      const dist = levenshtein(name, k);
      if (dist < bestDist) {
        best = k;
        bestDist = dist;
      }
    }
    if (bestDist >= 1 && bestDist <= 2) out.push({ name, looksLike: best });
  }
  return out;
}`,
      harness: `const known = ["react", "lodash", "express", "zod", "axios"];
check("levenshtein(\\"kitten\\", \\"sitting\\") is 3", () => levenshtein("kitten", "sitting") === 3);
check("Identical names are 0 apart, empty strings count every letter", () => levenshtein("zod", "zod") === 0 && levenshtein("", "abc") === 3);
check("Flags names one or two edits from a known package", () => JSON.stringify(findLookalikes(["expresss", "lodahs"], known)) === JSON.stringify([{ name: "expresss", looksLike: "express" }, { name: "lodahs", looksLike: "lodash" }]));
check("Does not flag the real packages", () => findLookalikes(["react", "zod"], known).length === 0);
check("Does not flag unrelated new names", () => findLookalikes(["left-pad-ai-helper"], known).length === 0);`,
      learned: 'Slopsquatting relies on names that look right at a glance; an edit-distance check in CI catches them before `npm install` runs someone else\'s code.',
    },
    {
      id: 'redact-secrets',
      kind: 'run',
      language: 'javascript',
      title: 'Redact secrets before logs reach an AI tool',
      goal: 'Write `redact(text)` that hides keys and passwords in a log before it is pasted into a prompt, and counts what it hid.',
      steps: [
        'Replace AWS access key ids (`AKIA` plus 16 capitals or digits) and GitHub tokens (`ghp_` plus 36 letters or digits) with `[REDACTED]`.',
        'For `password=`, `secret=` and `api_key=` (any case), keep the name and replace only the value: `password=[REDACTED]`. A value ends at a space or `&`.',
        'Return `{ text, count }` with the number of replacements.',
      ],
      starter: `function redact(text) {
  // your code here
  return { text, count: 0 };
}`,
      hints: ['Use a global regex per secret type, and count inside the replacement callback.', '`/AKIA[0-9A-Z]{16}/g` and `/ghp_[A-Za-z0-9]{36}/g` match the key formats.', 'For key=value, `/\\b(password|secret|api_key)=[^\\s&]+/gi` with a replacer that returns the name + `"=[REDACTED]"`.'],
      solution: `function redact(text) {
  let count = 0;
  const hide = (re, replace) => {
    text = text.replace(re, (...m) => {
      count++;
      return replace(...m);
    });
  };
  hide(/AKIA[0-9A-Z]{16}/g, () => "[REDACTED]");
  hide(/ghp_[A-Za-z0-9]{36}/g, () => "[REDACTED]");
  hide(/\\b(password|secret|api_key)=[^\\s&]+/gi, (_, name) => name + "=[REDACTED]");
  return { text, count };
}`,
      harness: `const token = "ghp_" + "Ab3".repeat(12);
check("Hides an AWS access key id", () => redact("key AKIAIOSFODNN7EXAMPLE used").text === "key [REDACTED] used");
check("Hides a GitHub token", () => redact("auth " + token).text === "auth [REDACTED]");
check("Keeps the name of a key=value secret", () => redact("GET /login?user=asha&password=hunter2&next=/").text === "GET /login?user=asha&password=[REDACTED]&next=/");
check("Matches names in any case", () => redact("API_KEY=sk-123 Secret=abc").text === "API_KEY=[REDACTED] Secret=[REDACTED]");
check("Counts every replacement", () => redact("AKIAIOSFODNN7EXAMPLE " + token + " password=x").count === 3);
check("Leaves clean text alone", () => { const r = redact("user=asha passwords are hashed"); return r.text === "user=asha passwords are hashed" && r.count === 0; });`,
      learned: 'Data you paste into an AI tool leaves your control, so scrub secrets from logs and code first, keeping enough context (the key name) to stay useful.',
    },
    {
      id: 'release-notes',
      kind: 'run',
      language: 'javascript',
      title: 'Draft release notes from commits',
      goal: 'Write `releaseNotes(version, commits)` that turns Conventional Commit messages into grouped release notes.',
      steps: [
        'Commits look like `type(scope)!: description`; the scope and `!` are optional. Ignore lines that do not match.',
        'A `!` or the text `BREAKING CHANGE` puts the commit under **Breaking changes** only. Otherwise `feat` goes under **Features** and `fix` under **Fixes**; other types are skipped.',
        'Items are `- scope: description` (or `- description` with no scope). Output `## <version>`, then each non-empty section as a blank line, `### <title>` and its items, joined with newlines.',
      ],
      starter: `function releaseNotes(version, commits) {
  // your code here
  return "## " + version;
}`,
      hints: ['Parse with `/^(\\w+)(?:\\(([^)]+)\\))?(!)?:\\s*(.+)$/` to get the type, scope, bang and description.', 'Keep three arrays (breaking, features, fixes) and push the formatted item into the right one.', 'Loop over `[["Breaking changes", breaking], ["Features", features], ["Fixes", fixes]]` and skip empty ones.'],
      solution: `function releaseNotes(version, commits) {
  const breaking = [];
  const features = [];
  const fixes = [];
  for (const commit of commits) {
    const m = /^(\\w+)(?:\\(([^)]+)\\))?(!)?:\\s*(.+)$/.exec(commit);
    if (!m) continue;
    const [, type, scope, bang, description] = m;
    const item = "- " + (scope ? scope + ": " : "") + description;
    if (bang || commit.includes("BREAKING CHANGE")) breaking.push(item);
    else if (type === "feat") features.push(item);
    else if (type === "fix") fixes.push(item);
  }
  const lines = ["## " + version];
  for (const [title, items] of [["Breaking changes", breaking], ["Features", features], ["Fixes", fixes]]) {
    if (items.length) lines.push("", "### " + title, ...items);
  }
  return lines.join("\\n");
}`,
      harness: `const commits = ["feat(auth): add SSO login", "fix: crash when saving an empty note", "chore: bump dependencies", "feat!: drop Node 18 support", "Merge branch main", "docs(readme): fix typo"];
check("Groups features and fixes under headings", () => { const n = releaseNotes("v2.0.0", commits); return n.includes("### Features\\n- auth: add SSO login") && n.includes("### Fixes\\n- crash when saving an empty note"); });
check("Puts breaking changes first", () => releaseNotes("v2.0.0", commits).startsWith("## v2.0.0\\n\\n### Breaking changes\\n- drop Node 18 support"));
check("Skips chores, docs and merge commits", () => { const n = releaseNotes("v2.0.0", commits); return !n.includes("bump") && !n.includes("typo") && !n.includes("Merge"); });
check("Leaves out empty sections", () => releaseNotes("v1.0.1", ["fix: typo in error message"]) === "## v1.0.1\\n\\n### Fixes\\n- typo in error message");
check("Treats BREAKING CHANGE in the message as breaking", () => releaseNotes("v3.0.0", ["feat(api): remove v1 routes BREAKING CHANGE"]).includes("### Breaking changes\\n- api: remove v1 routes BREAKING CHANGE"));`,
      learned: 'Structured commit messages let tools (or an AI) write release notes from facts in the history, and a human only has to polish them.',
    },
    {
      id: 'dora-report',
      kind: 'run',
      language: 'javascript',
      title: 'Measure delivery with a DORA report',
      goal: 'Write `doraReport({ deploys, incidents, days })` that returns the four DORA metrics for a period, so AI adoption is judged by outcomes.',
      steps: [
        'Deploys are `{ commitAt, deployedAt, failed }`; incidents are `{ startedAt, resolvedAt }` (ISO strings).',
        'Return `deploysPerWeek`, `leadTimeHours` (the median commit-to-deploy time), `changeFailureRate` (failed / total) and `mttrHours` (the mean incident length).',
        'Round each value to 2 decimals and use `0` for any metric with no data.',
      ],
      starter: `function doraReport({ deploys, incidents, days }) {
  // your code here
  return { deploysPerWeek: 0, leadTimeHours: 0, changeFailureRate: 0, mttrHours: 0 };
}`,
      hints: ['`(Date.parse(b) - Date.parse(a)) / 3600000` is the gap in hours.', 'Sort the lead times numerically; with an even count the median is the mean of the middle two.', '`Math.round(x * 100) / 100` rounds to 2 decimals.'],
      solution: `function doraReport({ deploys, incidents, days }) {
  const hours = (a, b) => (Date.parse(b) - Date.parse(a)) / 3600000;
  const round = (x) => Math.round(x * 100) / 100;
  const lead = deploys.map((d) => hours(d.commitAt, d.deployedAt)).sort((a, b) => a - b);
  const mid = Math.floor(lead.length / 2);
  const median = lead.length === 0 ? 0 : lead.length % 2 ? lead[mid] : (lead[mid - 1] + lead[mid]) / 2;
  const failed = deploys.filter((d) => d.failed).length;
  const restore = incidents.reduce((sum, i) => sum + hours(i.startedAt, i.resolvedAt), 0);
  return {
    deploysPerWeek: days ? round((deploys.length / days) * 7) : 0,
    leadTimeHours: round(median),
    changeFailureRate: deploys.length ? round(failed / deploys.length) : 0,
    mttrHours: incidents.length ? round(restore / incidents.length) : 0,
  };
}`,
      harness: `const deploys = [
  { commitAt: "2026-11-02T09:00:00Z", deployedAt: "2026-11-02T12:00:00Z", failed: false },
  { commitAt: "2026-11-03T10:00:00Z", deployedAt: "2026-11-04T10:00:00Z", failed: true },
  { commitAt: "2026-11-05T08:00:00Z", deployedAt: "2026-11-05T10:00:00Z", failed: false },
  { commitAt: "2026-11-09T09:00:00Z", deployedAt: "2026-11-09T14:00:00Z", failed: false },
];
const incidents = [
  { startedAt: "2026-11-04T11:00:00Z", resolvedAt: "2026-11-04T12:30:00Z" },
  { startedAt: "2026-11-10T09:00:00Z", resolvedAt: "2026-11-10T09:30:00Z" },
];
const r = doraReport({ deploys, incidents, days: 14 });
check("Deployment frequency is 2 per week", () => r.deploysPerWeek === 2);
check("Lead time is the median, 4 hours (not the mean)", () => r.leadTimeHours === 4);
check("Change failure rate is 0.25", () => r.changeFailureRate === 0.25);
check("Time to restore is 1 hour on average", () => r.mttrHours === 1);
check("Rounds to 2 decimals", () => doraReport({ deploys, incidents, days: 9 }).deploysPerWeek === 3.11);
check("No data gives zeros, not NaN", () => JSON.stringify(doraReport({ deploys: [], incidents: [], days: 7 })) === JSON.stringify({ deploysPerWeek: 0, leadTimeHours: 0, changeFailureRate: 0, mttrHours: 0 }));`,
      learned: 'DORA pairs speed (deployment frequency, lead time) with stability (change failure rate, time to restore), so faster AI-assisted coding only counts if failures do not rise with it.',
    },
  ],
}
