import type { SpotSet } from './types'

export const security: SpotSet = {
  id: 'security',
  bugs: [
    {
      id: 'sql-injection',
      title: 'Logging in as anyone',
      task: 'An attacker logged in with the email `\' OR 1=1 --`.',
      lang: 'javascript',
      code: `async function findUser(email) {
  const sql = \`SELECT * FROM users WHERE email = '\${email}'\`
  return db.query(sql)
}`,
      line: 2,
      fixed: `async function findUser(email) {
  return db.query('SELECT * FROM users WHERE email = $1', [email])
}`,
      also: [3],
      explain: 'Building SQL with string templates lets input become code. Use ==parameterised queries==: the value is sent separately and never parsed as SQL.',
      difficulty: 'Easy',
    },
    {
      id: 'md5',
      title: 'Cracked in an afternoon',
      task: 'After a database leak, most passwords were recovered within hours.',
      lang: 'javascript',
      code: `import crypto from 'node:crypto'

export function hashPassword(password) {
  return crypto.createHash('md5').update(password).digest('hex')
}`,
      line: 4,
      fixed: `import bcrypt from 'bcrypt'

export function hashPassword(password) {
  return bcrypt.hash(password, 12)
}`,
      explain: 'MD5 (and SHA-256) are ==fast and unsalted== here, so GPUs try billions of guesses per second and identical passwords share a hash. Use bcrypt, scrypt or Argon2.',
      difficulty: 'Easy',
    },
    {
      id: 'cookie-flags',
      title: 'Session stolen by a script',
      task: 'An XSS bug in a comment widget leaked users\' session cookies.',
      lang: 'javascript',
      code: `res.cookie('session', token, {
  maxAge: 7 * 24 * 3600 * 1000,
  httpOnly: false,
  secure: true,
  sameSite: 'lax',
})`,
      line: 3,
      fix: '  httpOnly: true,',
      explain: '==`httpOnly`== hides the cookie from `document.cookie`, so injected scripts cannot read it. (Fix the XSS too.)',
      difficulty: 'Easy',
    },
    {
      id: 'idor',
      title: 'Reading other people\'s invoices',
      task: 'Changing the number in `/api/invoices/1043` shows other customers\' invoices.',
      lang: 'javascript',
      code: `app.get('/api/invoices/:id', requireLogin, async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
  if (!invoice) return res.sendStatus(404)
  res.json(invoice)
})`,
      line: 2,
      fix: '  const invoice = await Invoice.findOne({ _id: req.params.id, ownerId: req.user.id })',
      explain: 'Being logged in is not permission. Check ==ownership== on every object lookup (broken access control, OWASP #1).',
      difficulty: 'Medium',
    },
    {
      id: 'jwt-verify',
      title: 'Anyone can be admin',
      task: 'A user edited their JWT payload to `"role": "admin"` and got admin access.',
      lang: 'javascript',
      code: `import jwt from 'jsonwebtoken'

function currentUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  return jwt.decode(token)
}`,
      line: 5,
      fix: "  return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })",
      explain: '`decode` only base64-decodes the payload; it does ==not check the signature==. `verify` (with a pinned algorithm) rejects tampered tokens.',
      difficulty: 'Medium',
    },
    {
      id: 'xss-innerhtml',
      title: 'A comment that runs code',
      task: 'A comment containing `<img src=x onerror=alert(1)>` ran a script for every visitor.',
      lang: 'javascript',
      code: `function renderComment(comment) {
  const p = document.createElement('p')
  p.innerHTML = comment.text
  list.appendChild(p)
}`,
      line: 3,
      fix: '  p.textContent = comment.text',
      explain: '`innerHTML` parses user input as HTML. ==`textContent`== inserts it as plain text. If you need some HTML, sanitise with DOMPurify.',
      difficulty: 'Easy',
    },
  ],
}
