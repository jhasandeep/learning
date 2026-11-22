import type { SdLesson } from '../types'

const SECRET = 's3cret'
const VALID = 'alice:100:648298'

export const jwtSessions: SdLesson = {
  id: 'auth-jwt',
  title: 'Authentication: sessions and JWT',
  topic: 'Proving who you are',
  blurb: 'How a server remembers a logged-in user, why signed tokens (JWT) are trusted, and the layers of security around an API.',
  why: {
    story: 'HTTP forgets everything between requests, so after you log in the server needs a way to recognise you. There are two common answers. **Sessions**: the server stores your login in memory or a database and gives your browser a random **session id** (a cookie). **JWT** (JSON Web Token): the server gives you a **signed token** containing your identity and expiry; any server can check the signature without looking anything up. Around this sit other layers: HTTPS, rate limiting, input validation, least-privilege authorisation and secret management.',
    pains: ['Every request would need the password again without a login mechanism.', 'Looking up a session in one shared store on every request is a bottleneck.', 'A token that anyone can edit would let users promote themselves to admin.', 'A stolen token works until it expires.'],
  },
  before: {
    title: 'Server-side sessions',
    nodes: [
      { id: 'b', label: 'Browser', kind: 'client', x: 10, y: 28, sub: 'cookie: sid=9f3' },
      { id: 'api', label: 'API server', kind: 'server', x: 48, y: 28 },
      { id: 's', label: 'Session store', kind: 'cache', x: 86, y: 28, sub: 'sid -> user' },
    ],
    edges: [{ from: 'b', to: 'api' }, { from: 'api', to: 's' }],
    frames: [
      { caption: 'You log in. The server creates a **session** record and sends a random **session id** in a cookie.', active: ['b', 'api', 's'], flow: [['b', 'api'], ['api', 's']] },
      { caption: 'On every later request the browser sends the cookie. The server **looks up** the session id in its store to find who you are.', active: ['b', 'api', 's'], flow: [['b', 'api'], ['api', 's']] },
      { caption: 'Easy to revoke (delete the record), but every server must reach the shared session store, which is another thing to scale.', active: ['s'], badges: { s: 'LOOKUP' } },
    ],
  },
  how: {
    title: 'JWT: a signed token, no lookup',
    nodes: [
      { id: 'b', label: 'Client', kind: 'client', x: 10, y: 28, sub: 'holds the token' },
      { id: 'auth', label: 'Auth server', kind: 'gateway', x: 48, y: 10, sub: 'signs tokens' },
      { id: 'api', label: 'API server', kind: 'server', x: 48, y: 46, sub: 'checks signature' },
    ],
    edges: [{ from: 'b', to: 'auth' }, { from: 'auth', to: 'b' }, { from: 'b', to: 'api' }],
    frames: [
      { caption: 'You log in. The auth server returns a **token**: `header.payload.signature`. The payload holds `user` and an expiry time.', active: ['b', 'auth'], flow: [['b', 'auth'], ['auth', 'b']], badges: { auth: 'SIGN' } },
      { caption: 'The signature is computed from the payload and a **secret key** only the servers know.', active: ['auth'] },
      { caption: 'On each request the client sends the token (usually `Authorization: Bearer ...`).', active: ['b', 'api'], flow: [['b', 'api']] },
      { caption: 'The API server **recomputes the signature**. If it matches and the token is not expired, it trusts the payload. No database call needed.', active: ['api'], badges: { api: 'VALID' } },
      { caption: 'If someone edits the payload (changes `user` to admin), the signature no longer matches and the request is **rejected**.', active: ['api'], bad: ['api'], badges: { api: 'BAD SIG' } },
    ],
  },
  tabs: ['Sessions', 'JWT'],
  sim: {
    id: 'jwt',
    intro: 'Create a token, then tamper with it or let it expire, and see how the server decides.',
    tryThis: ['Create a token and verify it: valid.', 'Change the user name inside it and verify: the signature no longer matches.', 'Move the clock past the expiry and verify: expired.'],
  },
  realWorld: [
    { name: 'Login with Google (OAuth 2.0 / OpenID Connect)', text: 'You sign in at Google, and the app receives tokens (often JWTs) proving who you are, without ever seeing your password.' },
    { name: 'Mobile apps and microservices', text: 'JWT suits APIs where many services must verify identity without sharing a session database.' },
    { name: 'Traditional web apps', text: 'Frameworks like Django, Rails and Spring commonly use cookie-based sessions: simple and easy to revoke.' },
    { name: 'Layers of API security', text: 'HTTPS everywhere, authentication (who are you), authorisation (what may you do), rate limiting, input validation, secrets in a vault, and audit logs.' },
  ],
  tradeoffs: {
    gain: ['Sessions: easy to revoke, small cookie, simple to reason about.', 'JWT: stateless, scales across servers and services, works well for APIs.'],
    cost: ['Sessions: need a shared store and lookup on every request.', 'JWT: hard to revoke before expiry; large tokens; a leaked secret lets attackers mint tokens; payload is readable (signed, not encrypted).'],
    useWhen: ['Sessions: classic server-rendered web apps.', 'JWT: APIs, mobile apps, service-to-service identity, single sign-on.'],
    avoidWhen: ['Never store secrets or sensitive personal data in a JWT payload.', 'Avoid very long-lived JWTs: use short expiry plus refresh tokens.'],
  },
  steps: [
    {
      title: 'Trust the token and only check the expiry',
      tag: 'slow',
      idea: 'A token looks like `user:expiry:signature`. A naive server splits it, checks that it has not expired, and trusts the `user`. This is the classic mistake: **nothing stops a client from editing the token**.',
      walk: ['Split the token into user, expiry and signature.', 'Reject it if `now >= expiry`.', 'Otherwise accept the user (without checking the signature!).'],
      buggy: true,
      code: {
        python: `def verify(token, secret, now):
    parts = token.split(":")
    if len(parts) != 3 or not parts[1].isdigit():
        return "malformed"
    user, exp, sig = parts
    if now >= int(exp):
        return "expired"
    return "valid:" + user
`,
        javascript: `function verify(token, secret, now) {
  const parts = token.split(":");
  if (parts.length !== 3 || !/^\\d+$/.test(parts[1])) return "malformed";
  const [user, exp, sig] = parts;
  if (now >= Number(exp)) return "expired";
  return "valid:" + user;
}
`,
      },
      time: 'O(token length)',
      space: 'O(1)',
      verdict: 'Anyone can write `admin:9999999:anything` and be accepted. We must verify a signature made with a secret.',
    },
    {
      title: 'Verify the signature first, then the expiry',
      tag: 'best',
      idea: 'Recompute `checksum(user:exp:secret)` and compare it with the signature in the token. Only if it matches do we trust the fields and look at the expiry. (Real JWTs use HMAC-SHA256 or RSA signatures; here a small checksum stands in so you can see the logic.)',
      walk: ['Reject tokens that do not have three parts or a numeric expiry: "malformed".', 'Compute the expected signature from `user:exp:secret`.', 'If it differs from the token\'s signature: "bad signature".', 'If `now >= exp`: "expired".', 'Otherwise: `"valid:" + user`.'],
      code: {
        python: `def verify(token, secret, now):
    parts = token.split(":")
    if len(parts) != 3 or not parts[1].isdigit():
        return "malformed"
    user, exp, sig = parts
    if str(checksum(user + ":" + exp + ":" + secret)) != sig:
        return "bad signature"
    if now >= int(exp):
        return "expired"
    return "valid:" + user
`,
        javascript: `function verify(token, secret, now) {
  const parts = token.split(":");
  if (parts.length !== 3 || !/^\\d+$/.test(parts[1])) return "malformed";
  const [user, exp, sig] = parts;
  if (String(checksum(user + ":" + exp + ":" + secret)) !== sig) return "bad signature";
  if (now >= Number(exp)) return "expired";
  return "valid:" + user;
}
`,
      },
      time: 'O(token length)',
      space: 'O(1)',
      verdict: 'The order matters: never act on fields you have not authenticated. Production code also uses constant-time comparison and checks the algorithm and audience.',
    },
  ],
  practice: {
    fn: { python: 'verify', javascript: 'verify' },
    driver: {
      python: `def checksum(text):
    h = 7
    for ch in text:
        h = (h * 31 + ord(ch)) % 1000003
    return h
`,
      javascript: `function checksum(text) {
  let h = 7;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) % 1000003;
  }
  return h;
}
`,
    },
    starter: {
      python: `def verify(token, secret, now):
    # token looks like "user:expiry:signature".
    # A helper checksum(text) is provided: the signature of a token is
    #   str(checksum(user + ":" + expiry + ":" + secret))
    # Return "malformed", "bad signature", "expired" or "valid:<user>".
    pass
`,
      javascript: `function verify(token, secret, now) {
  // token looks like "user:expiry:signature".
  // A helper checksum(text) is provided: the signature of a token is
  //   String(checksum(user + ":" + expiry + ":" + secret))
  // Return "malformed", "bad signature", "expired" or "valid:<user>".
}
`,
    },
    cases: [
      { label: 'a good token that has not expired', args: [VALID, SECRET, 50], expected: 'valid:alice' },
      { label: 'an expired token', args: [VALID, SECRET, 100], expected: 'expired' },
      { label: 'someone changed the user name', args: ['bob:100:648298', SECRET, 50], expected: 'bad signature' },
      { label: 'someone extended the expiry', args: ['alice:999:648298', SECRET, 150], expected: 'bad signature' },
      { label: 'the token was signed with another secret', args: ['alice:100:848308', SECRET, 50], expected: 'bad signature' },
      { label: 'not a token at all', args: ['garbage', SECRET, 50], expected: 'malformed' },
      { label: 'a tampered token is rejected even before expiry matters', args: ['bob:100:949725', 'other', 500], expected: 'bad signature' },
    ],
    hints: ['Split on ":" and make sure there are exactly three parts and the expiry is a number.', 'Recompute the signature with the provided `checksum` helper and compare it as text.', 'Check the signature before the expiry, and only return `valid:<user>` if both pass.'],
  },
  quiz: [
    { q: 'Why can a server trust a JWT without a database lookup?', options: ['The signature proves it was issued by the server and not altered', 'JWTs are encrypted so nobody can read them', 'The browser guarantees it'], answer: 0, why: 'Only someone with the secret key can create a matching signature, so any edit is detected. (The payload itself is readable.)' },
    { q: 'A user logs out, but their JWT is still valid for another hour. What helps?', options: ['Short token lifetimes plus refresh tokens, or a revocation list', 'Making tokens longer', 'Nothing can be done'], answer: 0, why: 'Because JWTs are stateless they cannot be deleted. Keep access tokens short-lived and revoke the refresh token.' },
    { q: 'Which is NOT a good place for sensitive data?', options: ['A server-side session record', 'A JWT payload', 'A secrets vault'], answer: 1, why: 'A JWT payload is only encoded and signed, not encrypted, so anyone holding the token can read it.' },
  ],
  interview: [
    { q: 'Sessions vs JWT: which would you choose?', a: 'For a classic web app with one backend, **sessions** are simple and easy to revoke. For APIs, mobile apps and microservices where many servers must authenticate requests without a shared store, **JWT** is convenient. Use short-lived access tokens with refresh tokens and store them securely (HTTP-only cookies for browsers).' },
    { q: 'Authentication vs authorisation?', a: '**Authentication** verifies **who you are** (password, OTP, token). **Authorisation** decides **what you may do** (roles, permissions, ownership). A valid login does not mean you may open every record: check authorisation on every request on the server.' },
    { q: 'What layers would you put around a public API?', a: 'HTTPS (TLS), an API gateway with authentication, **rate limiting** and quotas, input validation and output encoding, least-privilege authorisation, secrets kept in a vault, protection against common attacks (SQL injection, CSRF, XSS), logging and alerts.' },
  ],
  mistakes: ['Trusting a token without verifying its signature.', 'Putting passwords or personal data in a JWT payload.', 'Long-lived tokens with no way to revoke them.', 'Checking authentication but forgetting authorisation on each endpoint.'],
  recap: 'Sessions store login state on the server; JWTs carry signed state in the token. Always verify the signature before trusting anything inside.',
}
