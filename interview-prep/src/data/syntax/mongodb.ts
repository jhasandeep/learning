import type { SyntaxSet } from './types'

export const mongodb: SyntaxSet = {
  id: 'mongodb',
  title: 'MongoDB',
  snippets: [
    {
      id: 'connect',
      title: 'Connect with mongoose',
      lang: 'javascript',
      code: `import mongoose from 'mongoose'

const uri = process.env.MONGODB_URI
if (!uri) throw new Error('MONGODB_URI is not set')

let connection = null

export function connectDb() {
  connection ??= mongoose.connect(uri, { dbName: 'shop' })
  return connection
}`,
      note: 'Read the URI from the **environment**, never hard-code it. Caching the promise means hot reloads and serverless calls reuse one connection.',
    },
    {
      id: 'schema-model',
      title: 'Schema and model',
      lang: 'typescript',
      code: `import { Schema, model } from 'mongoose'

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
    },
    age: { type: Number, min: 0, max: 120 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true },
)

export const User = model('User', userSchema)`,
      note: 'Validation lives in the **schema** (`required`, `min`, `enum`), and `timestamps` adds `createdAt` and `updatedAt`. Note `unique` creates an index, it is not a validator.',
    },
    {
      id: 'crud',
      title: 'CRUD operations',
      lang: 'javascript',
      code: `const user = await User.create({ name: 'Asha', email: 'a@x.com' })

const admins = await User.find({ role: 'admin' })
const one = await User.findOne({ email: 'a@x.com' })
const byId = await User.findById(id)

await User.updateOne(
  { _id: id },
  { $set: { name: 'Asha K' }, $inc: { loginCount: 1 } },
)
const updated = await User.findByIdAndUpdate(
  id,
  { $push: { tags: 'vip' } },
  { new: true, runValidators: true },
)

await User.deleteOne({ _id: id })`,
      note: 'Use **update operators** (`$set`, `$inc`, `$push`) so you change fields instead of replacing the document. `new: true` returns the updated version.',
    },
    {
      id: 'mongosh-queries',
      title: 'mongosh queries',
      lang: 'javascript',
      code: `db.users.insertOne({ name: 'Asha', age: 28, tags: ['admin'] })
db.users.find({ age: { $gt: 18 }, tags: 'admin' }, { name: 1 })
db.users.find().sort({ createdAt: -1 }).limit(5)
db.users.find({ $or: [{ city: 'Pune' }, { age: { $lt: 21 } }] })
db.users.updateMany({ active: false }, { $set: { archived: true } })
db.users.deleteMany({ archived: true })
db.users.countDocuments({ age: { $gte: 30 } })
db.users.distinct('city')`,
      note: 'Raw shell syntax: a **filter** document, then an optional projection. Comparison operators (`$gt`, `$in`, `$or`) are the same in every driver.',
    },
    {
      id: 'query-pagination',
      title: 'Filter, sort and paginate',
      lang: 'javascript',
      code: `async function listProducts({ page = 1, limit = 20, category }) {
  const filter = {
    price: { $gte: 10, $lte: 100 },
    inStock: true,
    ...(category && { category }),
  }
  const [items, total] = await Promise.all([
    Product.find(filter)
      .select('name price category')
      .sort({ price: -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ])
  return { items, total, pages: Math.ceil(total / limit) }
}`,
      note: 'Classic **skip/limit pagination** with a total count. Sort on a unique field too so pages are stable; `lean()` returns plain objects, which is faster.',
    },
    {
      id: 'indexes',
      title: 'Indexes: compound, unique, text',
      lang: 'javascript',
      code: `userSchema.index({ email: 1 }, { unique: true })
orderSchema.index({ userId: 1, createdAt: -1 })
postSchema.index({ title: 'text', body: 'text' })

const results = await Post.find(
  { $text: { $search: 'react hooks' } },
  { score: { $meta: 'textScore' } },
).sort({ score: { $meta: 'textScore' } })

// mongosh: TTL index and checking a query plan
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
db.orders.find({ userId: id }).explain('executionStats')`,
      note: 'A **compound index** serves queries on its leading fields, in order (equality first, then sort). Check `explain()` for IXSCAN instead of COLLSCAN.',
    },
    {
      id: 'aggregation-group',
      title: 'Aggregation pipeline',
      lang: 'javascript',
      code: `const topCustomers = await Order.aggregate([
  { $match: { status: 'paid', createdAt: { $gte: startOfYear } } },
  {
    $group: {
      _id: '$customerId',
      orders: { $sum: 1 },
      revenue: { $sum: '$total' },
      avgOrder: { $avg: '$total' },
    },
  },
  { $sort: { revenue: -1 } },
  { $limit: 10 },
  { $project: { _id: 0, customerId: '$_id', orders: 1, revenue: 1 } },
])`,
      note: 'The SQL `GROUP BY` question. Put `$match` **first** so it can use an index and shrink the data before `$group`.',
    },
    {
      id: 'lookup-join',
      title: '$lookup join',
      lang: 'javascript',
      code: `const orders = await Order.aggregate([
  { $match: { status: 'paid' } },
  {
    $lookup: {
      from: 'users',
      localField: 'userId',
      foreignField: '_id',
      as: 'user',
    },
  },
  { $unwind: '$user' },
  { $project: { total: 1, 'user.name': 1, 'user.email': 1 } },
])`,
      note: '`$lookup` is a **left outer join** that returns an array; `$unwind` turns it into a single object. `from` is the collection name, not the model name.',
    },
    {
      id: 'populate',
      title: 'References and populate',
      lang: 'javascript',
      code: `const postSchema = new Schema({
  title: String,
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
})

const post = await Post.findById(id)
  .populate('author', 'name email')
  .populate({
    path: 'comments',
    select: 'text createdAt',
    options: { sort: { createdAt: -1 }, limit: 5 },
    populate: { path: 'author', select: 'name' },
  })
  .lean()`,
      note: 'Store an `ObjectId` with `ref`, then **populate** swaps it for the document. It runs extra queries, so interviewers may ask when to embed instead.',
    },
    {
      id: 'array-updates-upsert',
      title: 'Array updates and upsert',
      lang: 'javascript',
      code: `await Cart.updateOne(
  { userId },
  { $addToSet: { items: productId } },
  { upsert: true },
)

await Cart.updateOne({ userId }, { $pull: { items: productId } })

await Post.updateOne(
  { _id: postId, 'comments._id': commentId },
  { $set: { 'comments.$.text': newText } },
)`,
      note: '`$addToSet` adds without duplicates, `$pull` removes, and the **positional** `$` updates the array element the filter matched. `upsert` inserts if nothing matches.',
    },
    {
      id: 'transaction',
      title: 'Transaction with a session',
      lang: 'javascript',
      code: `const session = await mongoose.startSession()
try {
  await session.withTransaction(async () => {
    const from = await Account.findOneAndUpdate(
      { _id: fromId, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { session, new: true },
    )
    if (!from) throw new Error('Insufficient funds')
    await Account.updateOne(
      { _id: toId },
      { $inc: { balance: amount } },
      { session },
    )
  })
} finally {
  await session.endSession()
}`,
      note: 'The bank transfer question: pass `session` to ==every operation== so both writes commit or neither does. Transactions need a replica set.',
    },
  ],
}
