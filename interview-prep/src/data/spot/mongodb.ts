import type { SpotSet } from './types'

export const mongodb: SpotSet = {
  id: 'mongodb',
  bugs: [
    {
      id: 'string-id',
      title: 'Always null',
      task: 'The order exists, but this lookup with the native driver returns `null`.',
      lang: 'javascript',
      code: `import { MongoClient, ObjectId } from 'mongodb'

async function getOrder(id) {
  return db.collection('orders').findOne({ _id: id })
}`,
      line: 4,
      fix: "  return db.collection('orders').findOne({ _id: new ObjectId(id) })",
      explain: '`_id` is an ==ObjectId==, and a string never equals it. Convert it (Mongoose casts for you; the driver does not).',
      difficulty: 'Easy',
    },
    {
      id: 'missing-set',
      title: 'The update that throws',
      task: 'Renaming a user fails with "Update document requires atomic operators".',
      lang: 'javascript',
      code: `await db.collection('users').updateOne(
  { _id: userId },
  { name: 'Ada Lovelace' },
)`,
      line: 3,
      fix: "  { $set: { name: 'Ada Lovelace' } },",
      explain: 'Updates must use operators such as ==`$set`==, `$inc` or `$push`. To replace a whole document, use `replaceOne`.',
      difficulty: 'Easy',
    },
    {
      id: 'operator-injection',
      title: 'Password: anything',
      task: 'An attacker logged in by sending `{"email":"ceo@corp.com","password":{"$ne":""}}`.',
      lang: 'javascript',
      code: `app.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email, password: req.body.password })
  if (!user) return res.sendStatus(401)
  startSession(res, user)
})`,
      line: 2,
      fixed: `app.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (typeof email !== 'string' || typeof password !== 'string') return res.sendStatus(400)
  const user = await User.findOne({ email })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.sendStatus(401)
  startSession(res, user)
})`,
      explain: 'Request JSON can contain ==query operators== like `$ne`. Check types, and compare a hashed password in code instead of in the query.',
      difficulty: 'Hard',
    },
    {
      id: 'pipeline-order',
      title: 'The slow report',
      task: 'Totals per customer for paid orders. The query scans the entire 50M-order collection.',
      lang: 'javascript',
      code: `db.orders.aggregate([
  { $group: { _id: '$customerId', total: { $sum: '$amount' }, status: { $first: '$status' } } },
  { $match: { status: 'paid' } },
])`,
      line: 2,
      fixed: `db.orders.aggregate([
  { $match: { status: 'paid' } },
  { $group: { _id: '$customerId', total: { $sum: '$amount' } } },
])`,
      also: [3],
      explain: 'Filtering after `$group` processes every order and also gives wrong totals (it keeps one status per customer). Put ==`$match` first==, where it can use an index.',
      difficulty: 'Medium',
    },
    {
      id: 'unbounded-array',
      title: 'Document too large',
      task: 'Popular posts start failing to save with "BSONObj size … is invalid".',
      lang: 'javascript',
      code: `await db.collection('posts').updateOne(
  { _id: postId },
  { $push: { comments: { userId, text, at: new Date() } } },
)`,
      line: 3,
      fixed: `await db.collection('comments').insertOne(
  { postId, userId, text, at: new Date() },
)`,
      explain: 'Embedding an ==unbounded== list grows the post forever, up to the 16 MB document limit. Store comments in their own collection with a `postId` index.',
      difficulty: 'Medium',
    },
    {
      id: 'regex-index',
      title: 'Search ignores the index',
      task: '`explain()` shows a COLLSCAN for this email search, even with an index on `email`.',
      lang: 'javascript',
      code: `db.users.find({ email: { $regex: 'ada@example', $options: 'i' } })`,
      line: 1,
      fix: "db.users.find({ email: 'ada@example.com' }).collation({ locale: 'en', strength: 2 })",
      explain: 'A case-insensitive, unanchored regex cannot use the index efficiently. Match exactly, with a ==case-insensitive collation== index (or store a lower-cased copy).',
      difficulty: 'Hard',
    },
  ],
}
