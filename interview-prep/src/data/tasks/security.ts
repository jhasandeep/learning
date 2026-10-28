import type { TaskPath } from './types'

export const security: TaskPath = {
  id: 'security',
  title: 'Security',
  blurb: 'Defend against real attacks: XSS, SQL injection, bad redirects, open CORS and brute force.',
  tasks: [
    {
      id: 'escape-html',
      kind: 'run',
      language: 'javascript',
      title: 'Stop XSS by escaping HTML',
      goal: 'Write `escapeHtml(text)` so user input can never become real HTML.',
      steps: [
        'Replace `&` with `&amp;` first, then `<`, `>`, `"` and `\'`.',
        '`<` becomes `&lt;`, `>` becomes `&gt;`, `"` becomes `&quot;`, `\'` becomes `&#39;`.',
        'Return the safe string.',
      ],
      starter: `function escapeHtml(text) {
  // your code here
}`,
      hints: ['Chain `.replaceAll(...)` calls, one per character.', 'Do the `&` replacement first, otherwise you would escape the `&` of your own entities.', 'A lookup object plus one regex replace also works.'],
      solution: `function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}`,
      harness: `check("escapes a script tag", () => escapeHtml("<script>alert(1)</script>") === "&lt;script&gt;alert(1)&lt;/script&gt;");
check("escapes quotes", () => escapeHtml('a"b\\'c') === "a&quot;b&#39;c");
check("escapes & without double escaping", () => escapeHtml("a & b") === "a &amp; b");
check("leaves normal text unchanged", () => escapeHtml("Hello World 123") === "Hello World 123");
check("an attribute breakout is neutralised", () => escapeHtml('" onmouseover="steal()').indexOf('"') === -1);`,
      learned: 'Cross-site scripting happens when user text is treated as HTML: escaping special characters makes it plain, harmless text.',
    },
    {
      id: 'parameterized-query',
      kind: 'run',
      language: 'javascript',
      title: 'Stop SQL injection with parameters',
      goal: 'Write `findUserQuery(name)` that returns a safe `{ text, values }` query instead of gluing strings.',
      steps: [
        '`text` must be `"SELECT * FROM users WHERE name = $1"`.',
        '`values` must be an array holding the user input, `[name]`.',
        'Never put the input into the SQL string itself.',
      ],
      starter: `function findUserQuery(name) {
  return { text: "SELECT * FROM users WHERE name = '" + name + "'", values: [] };
}`,
      hints: ['Placeholders like `$1` are filled in by the database driver, safely.', 'The input goes in the `values` array only.', 'The SQL text should be the same for every user.'],
      solution: `function findUserQuery(name) {
  return { text: "SELECT * FROM users WHERE name = $1", values: [name] };
}`,
      harness: `check("uses the $1 placeholder", () => findUserQuery("Asha").text === "SELECT * FROM users WHERE name = $1");
check("passes the input in values", () => { const q = findUserQuery("Asha"); return q.values.length === 1 && q.values[0] === "Asha"; });
check("an injection attempt stays out of the SQL", () => { const evil = "x' OR '1'='1"; const q = findUserQuery(evil); return q.text.indexOf("OR") === -1 && q.values[0] === evil; });
check("the SQL text is identical for any input", () => findUserQuery("a").text === findUserQuery("b").text);`,
      learned: 'Parameterised queries keep code and data separate, so input can never change what the SQL does: the cure for SQL injection.',
    },
    {
      id: 'safe-redirect',
      kind: 'run',
      language: 'javascript',
      title: 'Prevent open redirects',
      goal: 'Write `safeRedirect(url)` that returns the URL only when it stays on your own site.',
      steps: [
        'Allow paths that start with a single `/`, such as `/dashboard`.',
        'Reject `//evil.com` (protocol-relative) and `https://evil.com`.',
        'Return `"/"` when the URL is not safe.',
      ],
      starter: `function safeRedirect(url) {
  // your code here
}`,
      hints: ['A safe relative path starts with `/` but not with `//`.', 'Also reject backslashes: browsers treat `/\\\\evil.com` like `//evil.com`.', 'Check `typeof url === "string"` first.'],
      solution: `function safeRedirect(url) {
  if (typeof url !== "string") return "/";
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\\\")) return url;
  return "/";
}`,
      harness: `check("allows /dashboard", () => safeRedirect("/dashboard") === "/dashboard");
check("allows a path with a query", () => safeRedirect("/search?q=a") === "/search?q=a");
check("blocks https://evil.com", () => safeRedirect("https://evil.com") === "/");
check("blocks //evil.com", () => safeRedirect("//evil.com") === "/");
check("blocks a backslash trick", () => safeRedirect("/\\\\evil.com") === "/");
check("falls back to / for non-strings", () => safeRedirect(undefined) === "/");`,
      learned: 'Never redirect to a URL a user can control without checking it: only accept your own relative paths.',
    },
    {
      id: 'cors-allowlist',
      kind: 'run',
      language: 'javascript',
      title: 'Write a strict CORS allow-list',
      goal: 'Write `isAllowedOrigin(origin)` that accepts only exact, trusted origins.',
      steps: [
        'The allowed origins are `https://app.example.com` and `https://admin.example.com`.',
        'Compare with an exact match (not `includes` or `startsWith`).',
        'Anything else, including `undefined` and `*`, is not allowed.',
      ],
      starter: `const ALLOWED = ["https://app.example.com", "https://admin.example.com"];

function isAllowedOrigin(origin) {
  // your code here
}`,
      hints: ['`ALLOWED.includes(origin)` is an exact comparison of whole strings.', '`origin.includes("example.com")` would also allow `https://evil-example.com`.', 'Return a boolean.'],
      solution: `const ALLOWED = ["https://app.example.com", "https://admin.example.com"];

function isAllowedOrigin(origin) {
  return ALLOWED.includes(origin);
}`,
      harness: `check("allows the app origin", () => isAllowedOrigin("https://app.example.com") === true);
check("allows the admin origin", () => isAllowedOrigin("https://admin.example.com") === true);
check("blocks another site", () => isAllowedOrigin("https://evil.com") === false);
check("blocks a look-alike domain", () => isAllowedOrigin("https://app.example.com.evil.com") === false && isAllowedOrigin("https://evil-example.com") === false);
check("blocks a missing origin and the wildcard", () => isAllowedOrigin(undefined) === false && isAllowedOrigin("*") === false);`,
      learned: 'A CORS allow-list must match whole origins exactly; partial matches let attackers register look-alike domains.',
    },
    {
      id: 'rate-limiter',
      kind: 'run',
      language: 'javascript',
      title: 'Build a login rate limiter',
      goal: 'Write `createLimiter(limit, windowMs)` that blocks an IP after too many attempts in a time window.',
      steps: [
        'Return a function `allow(ip, now)` that returns `true` or `false`.',
        'Remember the attempt times for each IP.',
        'Allow at most `limit` attempts per IP within the last `windowMs`; older attempts stop counting.',
      ],
      starter: `function createLimiter(limit, windowMs) {
  // your code here
}`,
      hints: ['Keep a `Map` from IP to an array of timestamps.', 'Drop timestamps older than `now - windowMs` before counting.', 'Only record an attempt when it is allowed (or record all: both pass the tests).'],
      solution: `function createLimiter(limit, windowMs) {
  const hits = new Map();
  return function allow(ip, now) {
    const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(ip, recent);
      return false;
    }
    recent.push(now);
    hits.set(ip, recent);
    return true;
  };
}`,
      harness: `check("allows the first attempts up to the limit", () => { const allow = createLimiter(3, 1000); return allow("1.1.1.1", 0) && allow("1.1.1.1", 1) && allow("1.1.1.1", 2); });
check("blocks the attempt after the limit", () => { const allow = createLimiter(3, 1000); allow("a", 0); allow("a", 1); allow("a", 2); return allow("a", 3) === false; });
check("each IP has its own counter", () => { const allow = createLimiter(1, 1000); allow("a", 0); return allow("b", 1) === true; });
check("allows again after the window passes", () => { const allow = createLimiter(1, 1000); allow("a", 0); return allow("a", 500) === false && allow("a", 1500) === true; });`,
      learned: 'Rate limiting slows brute-force and credential-stuffing attacks by capping how often one client can try.',
    },
  ],
}
