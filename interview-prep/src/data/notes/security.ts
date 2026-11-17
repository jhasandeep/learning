import type { NoteTopic } from './types'

export const security: NoteTopic = {
  id: 'security',
  title: 'Auth & Web Security',
  tagline: 'Sessions, JWT, OAuth, hashing, OWASP Top 10, CORS, CSP',
  category: 'Backend',
  badge: 'Sec',
  color: '#b91c1c',
  sections: [
    {
      id: 'authn',
      title: 'Authentication vs authorization',
      blocks: [
        { type: 'def', text: '**Authentication** = ==who are you?== (login). **Authorization** = ==what may you do?== (roles, permissions, ownership). Fail authentication → 401; fail authorization → 403.' },
        { type: 'analogy', title: 'Think of web security like a nightclub door', steps: [{ icon: '🪪', who: 'Guest shows ID', tech: 'Login', text: 'Who are you?' }, { icon: '🎟️', who: 'Wristband', tech: 'Token / session', text: 'Proof you were already checked' }, { icon: '👮', who: 'Bouncer per room', tech: 'Authorization', text: 'What are you allowed to enter?' }, { icon: '📹', who: 'CCTV + rules', tech: 'Rate limits, logging', text: 'Spot and stop bad behaviour' }] },
        { type: 'list', items: ['RBAC: permissions by role (admin, doctor, patient).', 'Always check **ownership** too: "can this user see *this* order?" — missing checks cause IDOR bugs.', 'Authorize on the server for every request; hiding a button is not security.'] },
      ],
    },
    {
      id: 'passwords',
      title: 'Storing passwords',
      blocks: [
        {
          type: 'code', lang: 'javascript', title: 'Hash with bcrypt / argon2 — never encrypt or plain-hash',
          code: `import bcrypt from 'bcrypt'

const hash = await bcrypt.hash(password, 12)   // salt is generated and stored inside the hash
const ok = await bcrypt.compare(attempt, hash) // constant-time compare`,
        },
        { type: 'list', items: ['Use slow, salted algorithms: **argon2id** or **bcrypt**. Never MD5/SHA-256 alone.', 'Rate-limit login and OTP endpoints; lock out or add delays after failures.', 'Same error for "no such user" and "wrong password" (no user enumeration).', 'Offer MFA (TOTP / passkeys) for sensitive apps.'] },
      ],
    },
    {
      id: 'sessions-jwt',
      title: 'Sessions vs JWT',
      blocks: [
        {
          type: 'table', head: ['', 'Server session', 'JWT'],
          rows: [
            ['State', 'stored on the server (Redis/DB); cookie holds only an id', 'claims inside a signed token'],
            ['Logout / revoke', 'easy: delete the session', 'hard: valid until it expires'],
            ['Scaling', 'needs a shared store', 'any server can verify the signature'],
            ['Best for', 'classic web apps', 'APIs, mobile, microservices'],
          ],
        },
        { type: 'flow', steps: ['Login', 'Short access token (15 min) + refresh token (httpOnly cookie)', 'Access expires', 'POST /refresh → rotate refresh token', 'Logout → revoke refresh token'], caption: 'Access + refresh token pattern' },
        { type: 'mistake', text: 'JWTs are signed, not encrypted — never put secrets in the payload. Always verify the signature and `exp`, and pin the algorithm (reject `alg: none`).' },
      ],
    },
    {
      id: 'oauth',
      title: 'OAuth 2.0 and OpenID Connect',
      blocks: [
        { type: 'p', text: '**OAuth 2.0** lets an app act on a user\'s behalf without their password (authorization). **OpenID Connect** adds an ID token on top, for ==login with Google/GitHub== (authentication).' },
        { type: 'steps', items: ['App redirects to the provider with `client_id`, `redirect_uri`, `scope`, `state` and a PKCE challenge.', 'User logs in and consents.', 'Provider redirects back with a one-time `code`.', 'Server exchanges the code (+ PKCE verifier) for tokens.', 'App reads the ID token / user info and creates its own session.'] },
        { type: 'tip', text: 'Use the Authorization Code flow with PKCE; `state` protects against CSRF on the callback. Libraries: Auth.js (NextAuth), Passport, Clerk, Cognito.' },
      ],
    },
    {
      id: 'owasp',
      title: 'Common attacks (OWASP)',
      blocks: [
        {
          type: 'table', head: ['Attack', 'What happens', 'Defence'],
          rows: [
            ['XSS', 'attacker script runs in your page', 'escape output (React does), avoid `dangerouslySetInnerHTML` or sanitise (DOMPurify), CSP, httpOnly cookies'],
            ['CSRF', 'another site makes the browser send a request with your cookies', '`SameSite=Lax/Strict` cookies, CSRF tokens, check Origin'],
            ['SQL / NoSQL injection', 'input changes the query', 'parameterised queries / ORM, validate types, reject `$` operators in input'],
            ['Broken access control / IDOR', '`/orders/124` shows someone else\'s order', 'check ownership on every request'],
            ['SSRF', 'server fetches an attacker-chosen internal URL', 'allow-list hosts, block internal IP ranges'],
            ['Clickjacking', 'your page is framed and clicks are hijacked', '`X-Frame-Options` / CSP `frame-ancestors`'],
            ['Secrets leaked', 'keys in git or frontend bundles', 'env vars / secret manager, rotate keys'],
          ],
        },
        {
          type: 'code', lang: 'javascript', title: 'Injection: never build queries with strings',
          code: `// ✗ vulnerable: id = "1 OR 1=1"
db.query(\`SELECT * FROM users WHERE id = \${req.params.id}\`)

// ✓ parameterised
db.query('SELECT * FROM users WHERE id = ?', [req.params.id])`,
        },
      ],
    },
    {
      id: 'browser',
      title: 'Browser security: CORS, cookies, headers',
      blocks: [
        { type: 'def', text: '**Same-origin policy**: a page can only read responses from the same scheme + host + port. **CORS** is the server ==opting in== to let other origins read its responses (`Access-Control-Allow-Origin`). CORS does not protect your API from non-browser clients.' },
        { type: 'list', items: ['Non-simple requests (JSON body, custom headers, PUT/DELETE) trigger a **preflight** `OPTIONS` request.', 'Credentialed requests can\'t use `*`; list exact origins.', 'Cookie flags: `HttpOnly` (no JS access), `Secure` (HTTPS only), `SameSite=Lax` (CSRF defence).', 'Headers: HSTS, CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy` — `helmet` sets sensible defaults.'] },
        { type: 'revision', text: 'Hash passwords with argon2/bcrypt, short access + rotating refresh tokens in httpOnly cookies, authorize every request (ownership!), parameterised queries, escape output + CSP, SameSite cookies, CORS is an opt-in not a firewall.' },
      ],
    },
  ],
  qa: [
    ['Authentication vs authorization?', 'Authentication verifies identity (login); authorization decides what that identity may do (roles, ownership).'],
    ['How should passwords be stored?', 'Hashed with a slow, salted algorithm such as argon2id or bcrypt — never plain, encrypted or fast-hashed.'],
    ['Session vs JWT?', 'Sessions keep state on the server and are easy to revoke; JWTs are signed, stateless tokens that scale easily but are hard to revoke, so keep them short-lived with refresh tokens.'],
    ['What is XSS and how do you prevent it?', 'Injected script running in your page. Escape output, avoid raw HTML or sanitise it, use a CSP, and keep tokens in httpOnly cookies.'],
    ['What is CSRF?', 'Another site causes the browser to send an authenticated request with your cookies. Defend with SameSite cookies, CSRF tokens and Origin checks.'],
    ['How do you prevent SQL injection?', 'Parameterised queries or an ORM — never concatenate user input into SQL.'],
    ['What does CORS do?', 'It lets a server allow specific other origins to read its responses in the browser. It is not an access-control mechanism for the API itself.'],
    ['What is a preflight request?', 'An OPTIONS request the browser sends before a non-simple cross-origin request to check that the server allows it.'],
    ['OAuth vs OpenID Connect?', 'OAuth 2.0 is for delegated authorization (access tokens); OpenID Connect adds an ID token for authentication (login with Google).'],
    ['What is IDOR?', 'Insecure Direct Object Reference: changing an id in the URL shows another user\'s data because ownership isn\'t checked.'],
    ['What do HttpOnly, Secure and SameSite do?', 'HttpOnly hides the cookie from JS, Secure sends it only over HTTPS, SameSite limits sending it on cross-site requests.'],
  ],
}
