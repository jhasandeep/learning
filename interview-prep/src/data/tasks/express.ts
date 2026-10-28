import type { TaskPath } from './types'

// Express handlers are plain functions of (req, res, next), so they can be practised
// in the browser. The checks call your function with a mock request and response.

const MOCKS = `function mockRes() {
  const res = { statusCode: 200, body: undefined, headers: {} };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  res.set = (k, v) => { res.headers[k] = v; return res; };
  return res;
}
`

export const express: TaskPath = {
  id: 'express',
  title: 'Express & REST APIs',
  blurb: 'Write route handlers and middleware: params, validation, auth and error handling.',
  tasks: [
    {
      id: 'get-user',
      kind: 'run',
      language: 'javascript',
      title: 'Write a GET route handler',
      goal: 'Write `getUser(req, res)` for `GET /users/:id` that answers with JSON or a 404.',
      steps: [
        'Read the id from `req.params.id` (a string: convert it with `Number`).',
        'Find the user in the `users` array.',
        'If found, `res.json(user)`. If not, `res.status(404).json({ error: "User not found" })`.',
      ],
      starter: `const users = [
  { id: 1, name: "Asha" },
  { id: 2, name: "Ravi" },
];

function getUser(req, res) {
  // your code here
}`,
      hints: ['Route parameters are always strings: `Number(req.params.id)`.', '`users.find((u) => u.id === id)` returns the user or `undefined`.', 'Use `return` after sending so you do not send twice.'],
      solution: `const users = [
  { id: 1, name: "Asha" },
  { id: 2, name: "Ravi" },
];

function getUser(req, res) {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
}`,
      harness: `${MOCKS}check("returns the user as JSON", () => { const res = mockRes(); getUser({ params: { id: "2" } }, res); return res.body && res.body.name === "Ravi"; });
check("answers 200 by default", () => { const res = mockRes(); getUser({ params: { id: "1" } }, res); return res.statusCode === 200; });
check("unknown id gives status 404", () => { const res = mockRes(); getUser({ params: { id: "99" } }, res); return res.statusCode === 404; });
check("404 body has an error message", () => { const res = mockRes(); getUser({ params: { id: "99" } }, res); return res.body && res.body.error === "User not found"; });`,
      learned: 'A route handler reads the request, decides, and sends exactly one response with the right status code.',
    },
    {
      id: 'logger-middleware',
      kind: 'run',
      language: 'javascript',
      title: 'Write logging middleware',
      goal: 'Write `logger(req, res, next)` that records the request and passes control on.',
      steps: [
        'Push the string `"<METHOD> <url>"` (for example `GET /users`) into the `logs` array.',
        'Set `req.startedAt` to the current time with `Date.now()`.',
        'Call `next()` so the request continues to the next handler.',
      ],
      starter: `const logs = [];

function logger(req, res, next) {
  // your code here
}`,
      hints: ['Middleware gets three arguments and must end by calling `next()` (or sending a response).', 'Use a template string: `${req.method} ${req.url}`.', 'Forgetting `next()` makes the request hang forever.'],
      solution: `const logs = [];

function logger(req, res, next) {
  logs.push(\`\${req.method} \${req.url}\`);
  req.startedAt = Date.now();
  next();
}`,
      harness: `check("records 'METHOD url' in logs", () => { logs.length = 0; logger({ method: "GET", url: "/users" }, {}, () => {}); return logs[0] === "GET /users"; });
check("sets req.startedAt to a timestamp", () => { const req = { method: "GET", url: "/" }; logger(req, {}, () => {}); return typeof req.startedAt === "number" && req.startedAt > 0; });
check("calls next() exactly once", () => { let n = 0; logger({ method: "GET", url: "/" }, {}, () => n++); return n === 1; });`,
      learned: 'Middleware runs in order for every request; it can read or change `req`/`res`, and must call `next()` to continue the chain.',
    },
    {
      id: 'validate-middleware',
      kind: 'run',
      language: 'javascript',
      title: 'Validate a request body',
      goal: 'Write `validateUser(req, res, next)` that rejects bad input with a 400.',
      steps: [
        '`req.body.name` must be a non-empty string.',
        '`req.body.email` must contain `@`.',
        'If something is wrong send `res.status(400).json({ error: "..." })` and stop; otherwise call `next()`.',
      ],
      starter: `function validateUser(req, res, next) {
  // your code here
}`,
      hints: ['Never trust input from clients: check every field.', 'Return right after sending the error so `next()` is not also called.', '`typeof name === "string" && name.trim() !== ""`'],
      solution: `function validateUser(req, res, next) {
  const { name, email } = req.body || {};
  if (typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "name is required" });
  }
  if (typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "a valid email is required" });
  }
  next();
}`,
      harness: `${MOCKS}check("a valid body calls next()", () => { let called = false; validateUser({ body: { name: "Asha", email: "a@x.com" } }, mockRes(), () => { called = true; }); return called; });
check("a missing name gives 400", () => { const res = mockRes(); validateUser({ body: { email: "a@x.com" } }, res, () => {}); return res.statusCode === 400; });
check("an email without @ gives 400", () => { const res = mockRes(); validateUser({ body: { name: "A", email: "nope" } }, res, () => {}); return res.statusCode === 400; });
check("an error response has an error message", () => { const res = mockRes(); validateUser({ body: {} }, res, () => {}); return typeof res.body.error === "string"; });
check("next() is NOT called for invalid input", () => { let called = false; validateUser({ body: { name: "", email: "" } }, mockRes(), () => { called = true; }); return !called; });`,
      learned: 'Validate at the edge of your API: reject bad input early with a 400 so the rest of your code only sees clean data.',
    },
    {
      id: 'auth-middleware',
      kind: 'run',
      language: 'javascript',
      title: 'Protect a route with auth middleware',
      goal: 'Write `requireAuth` that only lets requests with the header `Authorization: Bearer secret-token` through.',
      steps: [
        'Read `req.headers.authorization`.',
        'If it is missing or not `"Bearer secret-token"`, answer `401` with `{ error: "Unauthorized" }`.',
        'Otherwise set `req.user = { name: "admin" }` and call `next()`.',
      ],
      starter: `function requireAuth(req, res, next) {
  // your code here
}`,
      hints: ['Headers are lower-case in Node: `req.headers.authorization`.', '401 means "not authenticated"; 403 means "authenticated but not allowed".', 'Return after sending the 401.'],
      solution: `function requireAuth(req, res, next) {
  if (req.headers.authorization !== "Bearer secret-token") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = { name: "admin" };
  next();
}`,
      harness: `${MOCKS}check("the right token calls next()", () => { let called = false; requireAuth({ headers: { authorization: "Bearer secret-token" } }, mockRes(), () => { called = true; }); return called; });
check("the right token sets req.user", () => { const req = { headers: { authorization: "Bearer secret-token" } }; requireAuth(req, mockRes(), () => {}); return req.user && req.user.name === "admin"; });
check("a wrong token gives 401", () => { const res = mockRes(); requireAuth({ headers: { authorization: "Bearer nope" } }, res, () => {}); return res.statusCode === 401; });
check("no header gives 401", () => { const res = mockRes(); requireAuth({ headers: {} }, res, () => {}); return res.statusCode === 401 && res.body.error === "Unauthorized"; });
check("next() is NOT called when unauthorised", () => { let called = false; requireAuth({ headers: {} }, mockRes(), () => { called = true; }); return !called; });`,
      learned: 'Authentication middleware guards many routes at once: it either lets the request continue or ends it with a 401.',
    },
    {
      id: 'error-handler',
      kind: 'run',
      language: 'javascript',
      title: 'Write the error-handling middleware',
      goal: 'Write `errorHandler(err, req, res, next)` that sends a safe JSON error and never leaks internals.',
      steps: [
        'Use `err.status` as the status code, or `500` when it is missing.',
        'Send `{ error: <message> }`: the real message only for errors with `err.expose === true`, otherwise `"Internal error"`.',
        'Never include `err.stack` in the response.',
      ],
      starter: `function errorHandler(err, req, res, next) {
  // your code here
}`,
      hints: ['An error handler has FOUR parameters; Express recognises it by that.', '`const status = err.status || 500;`', 'Decide the message first: `err.expose ? err.message : "Internal error"`.'],
      solution: `function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.expose ? err.message : "Internal error";
  res.status(status).json({ error: message });
}`,
      harness: `${MOCKS}check("uses err.status as the status code", () => { const res = mockRes(); errorHandler({ status: 404, expose: true, message: "Not here" }, {}, res, () => {}); return res.statusCode === 404; });
check("defaults to status 500", () => { const res = mockRes(); errorHandler(new Error("db password is hunter2"), {}, res, () => {}); return res.statusCode === 500; });
check("shows the message for exposed errors", () => { const res = mockRes(); errorHandler({ status: 400, expose: true, message: "Bad name" }, {}, res, () => {}); return res.body.error === "Bad name"; });
check("hides internal messages (sends 'Internal error')", () => { const res = mockRes(); errorHandler(new Error("db password is hunter2"), {}, res, () => {}); return res.body.error === "Internal error"; });
check("never sends the stack trace", () => { const res = mockRes(); errorHandler(new Error("x"), {}, res, () => {}); return JSON.stringify(res.body).indexOf("at ") === -1 && res.body.stack === undefined; });`,
      learned: 'One central error handler gives every failure a consistent shape and keeps stack traces and secrets away from users.',
    },
  ],
}
