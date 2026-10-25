import type { LearnTrack } from './types'

export const security: LearnTrack = {
  id: 'security',
  intro: 'Write code that holds up: escaping output, parameterised queries, password hashing, constant-time checks, access control, validation, signed tokens and rate limits.',
  kind: 'js',
  lang: 'javascript',
  steps: [
    {
      id: 'escape-html',
      title: 'Escaping output (XSS)',
      learn: `**Cross-site scripting (XSS)** happens when user text is inserted into a page as HTML: \`<img src=x onerror=alert(1)>\` then runs as code.

Escape the five special characters before putting text into HTML: \`&\` (first!), \`<\`, \`>\`, \`"\` and \`'\`. Frameworks like React do this for you, unless you use \`dangerouslySetInnerHTML\`.`,
      task: 'Write `escapeHtml(text)` that replaces `&`, `<`, `>`, `"` and `\'` with `&amp;`, `&lt;`, `&gt;`, `&quot;` and `&#39;`.',
      starter: `function escapeHtml(text) {
  return text
}
`,
      solution: `function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
`,
      tests: [
        ['escapes tags', 'expect(escapeHtml("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;")'],
        ['escapes quotes', 'expect(escapeHtml(`"x" \'y\'`)).toBe("&quot;x&quot; &#39;y&#39;")'],
        ['escapes & first (no double escaping)', 'expect(escapeHtml("a & <b>")).toBe("a &amp; &lt;b&gt;")'],
        ['leaves plain text alone', 'expect(escapeHtml("Hello")).toBe("Hello")'],
      ],
      hints: ['Chain `.replace(/&/g, "&amp;")` and so on.', 'Replace `&` first, otherwise the `&` in `&lt;` gets escaped again.'],
    },
    {
      id: 'sql-injection',
      title: 'Parameterised queries',
      learn: `Building SQL by gluing strings lets input become code: an email of \`' OR 1=1 --\` logs in as anyone.

Use **placeholders** and send values separately; the database never parses them as SQL:

\`\`\`
db.query('SELECT * FROM users WHERE email = $1', [email])
\`\`\``,
      task: 'Rewrite `findUserQuery(email, status)` to return `{ text, values }` with `$1`/`$2` placeholders instead of putting the values in the SQL.',
      starter: `function findUserQuery(email, status) {
  return {
    text: "SELECT id, name FROM users WHERE email = '" + email + "' AND status = '" + status + "'",
    values: [],
  }
}
`,
      solution: `function findUserQuery(email, status) {
  return {
    text: 'SELECT id, name FROM users WHERE email = $1 AND status = $2',
    values: [email, status],
  }
}
`,
      tests: [
        ['uses placeholders', 'expect(findUserQuery("a@b.co", "active")).toEqual({ text: "SELECT id, name FROM users WHERE email = $1 AND status = $2", values: ["a@b.co", "active"] })'],
        ['input never ends up in the SQL', 'const q = findUserQuery("\' OR 1=1 --", "x"); expect(q.text).not.toContain("OR 1=1"); expect(q.values[0]).toBe("\' OR 1=1 --")'],
      ],
      hints: ['The SQL text should contain `$1` and `$2`, no quotes around them.', 'Put the values in the `values` array, in the same order.'],
    },
    {
      id: 'hash-password',
      title: 'Hashing passwords',
      learn: `Never store passwords, or fast hashes of them (MD5, plain SHA-256): leaked hashes get cracked at billions of guesses per second.

Use a **slow, salted** key-derivation function: bcrypt, scrypt, Argon2 or PBKDF2. A random **salt** per user means equal passwords get different hashes. Web Crypto has PBKDF2:

\`\`\`
const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits'])
const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256)
\`\`\``,
      task: 'Write `hashPassword(password, saltHex)` returning the PBKDF2-SHA-256 hash (100,000 iterations, 256 bits) as hex. `toHex` and `fromHex` are given.',
      starter: `const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
const fromHex = (hex) => new Uint8Array(hex.match(/../g).map((h) => parseInt(h, 16)))

async function hashPassword(password, saltHex) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  return toHex(digest)
}
`,
      solution: `const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
const fromHex = (hex) => new Uint8Array(hex.match(/../g).map((h) => parseInt(h, 16)))

async function hashPassword(password, saltHex) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: fromHex(saltHex), iterations: 100000, hash: 'SHA-256' }, key, 256)
  return toHex(bits)
}
`,
      tests: [
        ['matches PBKDF2-SHA-256 (100k iterations)', 'const key = await crypto.subtle.importKey("raw", new TextEncoder().encode("hunter2"), "PBKDF2", false, ["deriveBits"]); const want = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: fromHex("a1b2c3d4"), iterations: 100000, hash: "SHA-256" }, key, 256); expect(await hashPassword("hunter2", "a1b2c3d4")).toBe(toHex(want))'],
        ['a different salt gives a different hash', 'expect(await hashPassword("pw", "0011")).not.toBe(await hashPassword("pw", "0022"))'],
        ['64 hex characters', 'expect(await hashPassword("pw", "00")).toMatch(/^[0-9a-f]{64}$/)'],
      ],
      hints: ['Import the password as a PBKDF2 key, then `deriveBits`.', 'Pass `salt: fromHex(saltHex)` and `256` bits; convert with `toHex`.'],
    },
    {
      id: 'constant-time',
      title: 'Constant-time comparison',
      learn: `\`a === b\` stops at the first different character, so how long it takes leaks **how much** of a secret matched. Attackers can time it to guess tokens one character at a time.

Compare secrets in **constant time**: look at every character and combine the differences, then decide at the end.`,
      task: 'Write `safeEqual(a, b)` for strings: false if the lengths differ; otherwise XOR every character code into one accumulator (no early return) and return whether it is 0.',
      starter: `function safeEqual(a, b) {
  return a === b
}
`,
      solution: `function safeEqual(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}
`,
      tests: [
        ['equal strings', 'expect(safeEqual("token-123", "token-123")).toBe(true)'],
        ['different strings', 'expect(safeEqual("token-123", "token-124")).toBe(false); expect(safeEqual("abc", "abcd")).toBe(false)'],
        ['compares every character (no === on the secrets)', 'expect(code).not.toMatch(/\\ba\\s*===\\s*b\\b/); expect(code).toMatch(/\\^/)'],
      ],
      hints: ['`diff |= a.charCodeAt(i) ^ b.charCodeAt(i)` inside the loop.', 'Return `diff === 0` after the loop, not inside it.'],
    },
    {
      id: 'access-control',
      title: 'Access control',
      learn: `Being logged in isn't permission. **Broken access control** (number one in the OWASP Top 10) is when \`/invoices/1043\` returns any invoice to any user.

Check, on the server, for every object: does this user own it, or have a role that allows it? Answer 404 rather than 403 if you don't want to reveal that it exists.`,
      task: 'Write `getInvoice(user, id)`: return the invoice if the user owns it or `user.role === "admin"`. Otherwise (or if it doesn\'t exist) throw an error with `status` 404.',
      starter: `const INVOICES = [
  { id: 1, ownerId: 'u1', total: 30 },
  { id: 2, ownerId: 'u2', total: 99 },
]

function getInvoice(user, id) {
  return INVOICES.find((i) => i.id === id)
}
`,
      solution: `const INVOICES = [
  { id: 1, ownerId: 'u1', total: 30 },
  { id: 2, ownerId: 'u2', total: 99 },
]

function getInvoice(user, id) {
  const invoice = INVOICES.find((i) => i.id === id)
  if (!invoice || (invoice.ownerId !== user.id && user.role !== 'admin')) {
    throw Object.assign(new Error('Not found'), { status: 404 })
  }
  return invoice
}
`,
      tests: [
        ['owners can read their invoice', 'expect(getInvoice({ id: "u1", role: "user" }, 1).total).toBe(30)'],
        ['others get 404', 'let err; try { getInvoice({ id: "u1", role: "user" }, 2) } catch (e) { err = e } expect(err?.status).toBe(404)'],
        ['admins can read any invoice', 'expect(getInvoice({ id: "x", role: "admin" }, 2).total).toBe(99)'],
        ['unknown invoices are 404 too', 'expect(() => getInvoice({ id: "u1", role: "user" }, 9)).toThrow()'],
      ],
      hints: ['Find the invoice, then check `invoice.ownerId === user.id || user.role === "admin"`.', '`throw Object.assign(new Error("Not found"), { status: 404 })`.'],
    },
    {
      id: 'validation',
      title: 'Validating input',
      learn: `Validate on the server; client-side checks are only for convenience. Prefer an **allowlist** (what is allowed) over a denylist (what isn't):

- check types and lengths
- only accept known values for enums (\`role\` in \`['user', 'editor']\`)
- never let the client set fields like \`isAdmin\``,
      task: 'Write `validateSignup(body)` returning `{ ok: true, value }` or `{ ok: false, errors }`. Rules: `email` is a string with "@"; `password` is a string of at least 12 characters; `role` defaults to "user" and must be "user" or "editor". `value` contains only those three fields.',
      starter: `function validateSignup(body) {
  return { ok: true, value: body }
}
`,
      solution: `function validateSignup(body) {
  const errors = {}
  const { email, password, role = 'user' } = body ?? {}
  if (typeof email !== 'string' || !email.includes('@')) errors.email = 'Enter a valid email'
  if (typeof password !== 'string' || password.length < 12) errors.password = 'Use at least 12 characters'
  if (!['user', 'editor'].includes(role)) errors.role = 'Unknown role'
  if (Object.keys(errors).length) return { ok: false, errors }
  return { ok: true, value: { email, password, role } }
}
`,
      tests: [
        ['accepts a valid signup and drops extra fields', 'expect(validateSignup({ email: "a@b.co", password: "correct horse", isAdmin: true })).toEqual({ ok: true, value: { email: "a@b.co", password: "correct horse", role: "user" } })'],
        ['reports each problem', 'const r = validateSignup({ email: "nope", password: "short", role: "admin" }); expect(r.ok).toBe(false); expect(Object.keys(r.errors).sort()).toEqual(["email", "password", "role"])'],
        ['rejects non-strings', 'expect(validateSignup({ email: ["a@b"], password: 123456789012 }).ok).toBe(false)'],
      ],
      hints: ['Collect messages in an `errors` object, one key per field.', 'Build `value` from only `email`, `password` and `role`, so `isAdmin` can\'t sneak in.'],
    },
    {
      id: 'signed-tokens',
      title: 'Signed tokens',
      learn: `A signed token (like a JWT) is \`payload.signature\`, where the signature is an **HMAC** of the payload with a server secret. Anyone can read the payload; nobody without the secret can change it.

Verify the signature **before** trusting anything inside, and reject expired tokens.`,
      task: '`sign(payload, secret)` is given. Write `verify(token, secret, now)`: return the payload if the signature matches and `payload.exp > now`; otherwise return `null`.',
      starter: `const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '')
const hmac = async (data, secret) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)))
}
async function sign(payload, secret) {
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)))
  return body + '.' + (await hmac(body, secret))
}

async function verify(token, secret, now) {
  const [body] = token.split('.')
  return JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')))
}
`,
      solution: `const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '')
const hmac = async (data, secret) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)))
}
async function sign(payload, secret) {
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)))
  return body + '.' + (await hmac(body, secret))
}

async function verify(token, secret, now) {
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = await hmac(body, secret)
  if (expected.length !== sig.length) return null
  let diff = 0
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
  if (diff !== 0) return null
  const payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(body.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))))
  return payload.exp > now ? payload : null
}
`,
      tests: [
        ['accepts a valid token', 'const t = await sign({ sub: "u1", exp: 2000 }, "s3cret"); expect(await verify(t, "s3cret", 1000)).toEqual({ sub: "u1", exp: 2000 })'],
        ['rejects a tampered payload', 'const t = await sign({ sub: "u1", role: "user", exp: 2000 }, "s3cret"); const forged = (await sign({ sub: "u1", role: "admin", exp: 2000 }, "other")).split(".")[0] + "." + t.split(".")[1]; expect(await verify(forged, "s3cret", 1000)).toBeNull()'],
        ['rejects the wrong secret', 'const t = await sign({ exp: 2000 }, "a"); expect(await verify(t, "b", 1000)).toBeNull()'],
        ['rejects an expired token', 'const t = await sign({ exp: 500 }, "k"); expect(await verify(t, "k", 1000)).toBeNull()'],
      ],
      hints: ['Recompute `await hmac(body, secret)` and compare it with the signature part.', 'Only decode the payload after the signature matches; then check `exp`.'],
    },
    {
      id: 'rate-limit',
      title: 'Rate limiting logins',
      learn: `Without a limit, attackers can try thousands of passwords per minute (**credential stuffing**). A **fixed-window** limiter counts attempts per key (account or IP) per minute and refuses the rest:

- remember \`{ windowStart, count }\` per key
- a new window starts when \`now - windowStart >= windowMs\``,
      task: 'Write `createLimiter(max, windowMs)` returning `allow(key, now)`: true for the first `max` calls per key in each window, false after that.',
      starter: `function createLimiter(max, windowMs) {
  return function allow(key, now) {
    return true
  }
}
`,
      solution: `function createLimiter(max, windowMs) {
  const hits = new Map()
  return function allow(key, now) {
    const entry = hits.get(key)
    if (!entry || now - entry.windowStart >= windowMs) {
      hits.set(key, { windowStart: now, count: 1 })
      return true
    }
    if (entry.count >= max) return false
    entry.count++
    return true
  }
}
`,
      tests: [
        ['allows up to max per window', 'const allow = createLimiter(3, 60000); expect([1, 2, 3, 4].map(() => allow("ip1", 1000))).toEqual([true, true, true, false])'],
        ['keys are separate', 'const allow = createLimiter(1, 60000); expect(allow("a", 0)).toBe(true); expect(allow("b", 0)).toBe(true); expect(allow("a", 0)).toBe(false)'],
        ['a new window resets the count', 'const allow = createLimiter(1, 60000); allow("a", 0); expect(allow("a", 59999)).toBe(false); expect(allow("a", 60000)).toBe(true)'],
      ],
      hints: ['Keep a `Map` from key to `{ windowStart, count }`.', 'Start a fresh window when there\'s no entry or `now - windowStart >= windowMs`.'],
    },
  ],
}
