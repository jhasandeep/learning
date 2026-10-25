import type { LearnTrack } from './types'

const SEED = `const db = createDb({
  users: [
    { _id: 'u1', name: 'Ada', age: 36, city: 'London', tags: ['math'] },
    { _id: 'u2', name: 'Linus', age: 28, city: 'Helsinki', tags: ['os', 'git'] },
    { _id: 'u3', name: 'Grace', age: 45, city: 'New York', tags: ['navy', 'cobol'] },
    { _id: 'u4', name: 'Alan', age: 41, city: 'London', tags: [] },
  ],
  orders: [
    { _id: 'o1', userId: 'u1', total: 120, status: 'paid' },
    { _id: 'o2', userId: 'u1', total: 35, status: 'paid' },
    { _id: 'o3', userId: 'u2', total: 80, status: 'refunded' },
    { _id: 'o4', userId: 'u3', total: 300, status: 'paid' },
    { _id: 'o5', userId: 'u3', total: 45, status: 'pending' },
  ],
})`

const DATA = 'Collections: `users` `{ _id, name, age, city, tags }` and `orders` `{ _id, userId, total, status }`. `db` is ready to use; every method returns a Promise (`find` returns a cursor: end it with `.toArray()`).'

export const mongodb: LearnTrack = {
  id: 'mongodb',
  intro: 'Work with documents: queries and operators, projection and sorting, inserts and updates, arrays, aggregation pipelines, $lookup joins and safe queries.',
  kind: 'js',
  lang: 'javascript',
  steps: [
    {
      id: 'find',
      title: 'Finding documents',
      learn: `\`find(filter)\` returns a cursor of matching documents; \`toArray()\` collects them. A filter is an object of field/value pairs that must all match:

\`\`\`
await db.collection('users').find({ city: 'London' }).toArray()
\`\`\`

\`findOne\` returns the first match or \`null\`.

${DATA}`,
      task: 'Write `usersIn(city)` returning all users in that city, and `userById(id)` returning one user or `null`.',
      starter: `async function usersIn(city) {
  return db.collection('users').find({}).toArray()
}

async function userById(id) {

}
`,
      solution: `async function usersIn(city) {
  return db.collection('users').find({ city }).toArray()
}

async function userById(id) {
  return db.collection('users').findOne({ _id: id })
}
`,
      tests: [
        ['usersIn("London")', 'expect((await usersIn("London")).map((u) => u.name)).toEqual(["Ada", "Alan"])'],
        ['userById finds one', 'expect((await userById("u3"))?.name).toBe("Grace")'],
        ['userById returns null when missing', 'expect(await userById("nope")).toBeNull()'],
      ],
      hints: ['The filter `{ city }` is shorthand for `{ city: city }`.', '`findOne({ _id: id })`.'],
      setup: SEED,
    },
    {
      id: 'operators',
      title: 'Operators, projection and sorting',
      learn: `Query operators go inside the field: \`{ age: { $gte: 30, $lt: 40 } }\`, \`{ city: { $in: ['London', 'Paris'] } }\`.

The second argument picks fields: \`{ projection: { _id: 0, name: 1 } }\`. Chain \`.sort({ age: -1 })\` (−1 = descending) and \`.limit(n)\`.

${DATA}`,
      task: 'Write `oldest(n, minAge)`: the names (only `name`, no `_id`) of users aged at least `minAge`, oldest first, at most `n` of them.',
      starter: `async function oldest(n, minAge) {
  return db.collection('users').find({}).toArray()
}
`,
      solution: `async function oldest(n, minAge) {
  return db.collection('users')
    .find({ age: { $gte: minAge } }, { projection: { _id: 0, name: 1 } })
    .sort({ age: -1 })
    .limit(n)
    .toArray()
}
`,
      tests: [
        ['oldest 2 aged 30+', 'expect(await oldest(2, 30)).toEqual([{ name: "Grace" }, { name: "Alan" }])'],
        ['respects minAge', 'expect(await oldest(10, 40)).toEqual([{ name: "Grace" }, { name: "Alan" }])'],
        ['uses $gte', 'expect(code).toMatch(/\\$gte/)'],
      ],
      hints: ['Filter: `{ age: { $gte: minAge } }`.', 'Projection `{ _id: 0, name: 1 }`, then `.sort({ age: -1 }).limit(n)`.'],
      setup: SEED,
    },
    {
      id: 'insert',
      title: 'Inserting',
      learn: `\`insertOne(doc)\` adds a document and returns \`{ insertedId }\`. MongoDB doesn't enforce a schema by default, so **validate in your code** (or with a JSON-schema validator on the collection).

${DATA}`,
      task: 'Write `createUser({ name, age })`: throw `Error("Invalid user")` unless name is a non-empty string and age a positive integer; otherwise insert `{ name, age, city: null, tags: [] }` and return the new id.',
      starter: `async function createUser(input) {
  const result = await db.collection('users').insertOne(input)
  return result.insertedId
}
`,
      solution: `async function createUser({ name, age }) {
  if (typeof name !== 'string' || !name.trim() || !Number.isInteger(age) || age <= 0) {
    throw new Error('Invalid user')
  }
  const result = await db.collection('users').insertOne({ name: name.trim(), age, city: null, tags: [] })
  return result.insertedId
}
`,
      tests: [
        ['inserts and returns the id', 'const id = await createUser({ name: "Barbara", age: 30 }); expect(await db.collection("users").findOne({ _id: id }, { projection: { _id: 0 } })).toEqual({ name: "Barbara", age: 30, city: null, tags: [] })'],
        ['rejects invalid users', 'await expect(createUser({ name: "", age: 30 })).rejects.toMatch("Invalid user"); await expect(createUser({ name: "X", age: -1 })).rejects.toMatch("Invalid user")'],
        ['does not store extra fields', 'const id = await createUser({ name: "Eve", age: 22, isAdmin: true }); expect((await db.collection("users").findOne({ _id: id })).isAdmin).toBeUndefined()'],
      ],
      hints: ['`Number.isInteger(age) && age > 0` checks the age.', 'Build the document yourself instead of inserting `input` as it is.'],
      setup: SEED,
    },
    {
      id: 'update',
      title: 'Updating',
      learn: `Updates need **operators**: \`$set\` changes fields, \`$inc\` adds to a number, \`$unset\` removes a field. Passing a plain object is an error.

\`{ upsert: true }\` inserts the document if nothing matches. The result tells you \`matchedCount\` and \`modifiedCount\`.

${DATA}`,
      task: 'Write `birthday(id)` (add 1 to `age`, return true if a user was updated) and `moveTo(id, city)` (set `city`).',
      starter: `async function birthday(id) {
  await db.collection('users').updateOne({ _id: id }, { age: 1 })
}

async function moveTo(id, city) {

}
`,
      solution: `async function birthday(id) {
  const r = await db.collection('users').updateOne({ _id: id }, { $inc: { age: 1 } })
  return r.matchedCount === 1
}

async function moveTo(id, city) {
  await db.collection('users').updateOne({ _id: id }, { $set: { city } })
}
`,
      tests: [
        ['birthday adds a year', 'expect(await birthday("u1")).toBe(true); expect((await db.collection("users").findOne({ _id: "u1" })).age).toBe(37)'],
        ['birthday reports a missing user', 'expect(await birthday("nope")).toBe(false)'],
        ['moveTo sets the city only', 'await moveTo("u2", "Portland"); expect(await db.collection("users").findOne({ _id: "u2" }, { projection: { _id: 0 } })).toEqual({ name: "Linus", age: 28, city: "Portland", tags: ["os", "git"] })'],
      ],
      hints: ['`{ $inc: { age: 1 } }` adds one.', 'Return `r.matchedCount === 1`.'],
      setup: SEED,
    },
    {
      id: 'arrays',
      title: 'Working with arrays',
      learn: `Arrays are first-class in documents:

- query \`{ tags: 'git' }\` matches documents whose array **contains** "git"
- \`$push\` appends, \`$addToSet\` appends only if missing, \`$pull\` removes
- \`{ tags: { $size: 0 } }\` matches empty arrays`,
      task: 'Write `tagged(tag)` (names of users with that tag, sorted by name) and `addTag(id, tag)` that never adds a duplicate.',
      starter: `async function tagged(tag) {
  return []
}

async function addTag(id, tag) {
  await db.collection('users').updateOne({ _id: id }, { $push: { tags: tag } })
}
`,
      solution: `async function tagged(tag) {
  const users = await db.collection('users').find({ tags: tag }).sort({ name: 1 }).toArray()
  return users.map((u) => u.name)
}

async function addTag(id, tag) {
  await db.collection('users').updateOne({ _id: id }, { $addToSet: { tags: tag } })
}
`,
      tests: [
        ['finds users with a tag', 'await addTag("u1", "git"); expect(await tagged("git")).toEqual(["Ada", "Linus"])'],
        ['never duplicates a tag', 'await addTag("u2", "git"); await addTag("u2", "git"); expect((await db.collection("users").findOne({ _id: "u2" })).tags).toEqual(["os", "git"])'],
      ],
      hints: ['A plain `{ tags: tag }` filter matches arrays that contain the tag.', '`$addToSet` instead of `$push`.'],
      setup: SEED,
    },
    {
      id: 'aggregate',
      title: 'Aggregation pipelines',
      learn: `\`aggregate([...])\` runs documents through **stages**: \`$match\` (filter), \`$group\` (combine, with \`$sum\`, \`$avg\`…), \`$sort\`, \`$limit\`, \`$project\`.

Put \`$match\` first so it can use indexes and shrink the work for later stages:

\`\`\`
[{ $match: { status: 'paid' } }, { $group: { _id: '$userId', total: { $sum: '$total' } } }]
\`\`\``,
      task: 'Write `revenueByUser()`: for paid orders, return `{ _id: userId, total, orders }` per user (sum of totals and count), sorted by total descending.',
      starter: `async function revenueByUser() {
  return db.collection('orders').aggregate([]).toArray()
}
`,
      solution: `async function revenueByUser() {
  return db.collection('orders').aggregate([
    { $match: { status: 'paid' } },
    { $group: { _id: '$userId', total: { $sum: '$total' }, orders: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]).toArray()
}
`,
      tests: [
        ['totals per user, largest first', 'expect(await revenueByUser()).toEqual([{ _id: "u3", total: 300, orders: 1 }, { _id: "u1", total: 155, orders: 2 }])'],
        ['$match comes first', 'await revenueByUser(); expect(Object.keys(db.collection("orders").pipelines.at(-1)[0])[0]).toBe("$match")'],
      ],
      hints: ['`{ $sum: "$total" }` adds the field; `{ $sum: 1 }` counts.', 'Then `{ $sort: { total: -1 } }`.'],
      setup: SEED,
    },
    {
      id: 'lookup',
      title: 'Joining with $lookup',
      learn: `\`$lookup\` brings in matching documents from another collection as an array:

\`\`\`
{ $lookup: { from: 'orders', localField: '_id', foreignField: 'userId', as: 'orders' } }
\`\`\`

If you always need related data together and it stays small, **embedding** it in one document is often better than joining.`,
      task: 'Write `usersWithOrderCount()`: every user as `{ name, orderCount }` (no `_id`), sorted by name. Use `$lookup` then `$project` with `{ $size: "$orders" }`.',
      starter: `async function usersWithOrderCount() {
  return db.collection('users').aggregate([
    { $sort: { name: 1 } },
  ]).toArray()
}
`,
      solution: `async function usersWithOrderCount() {
  return db.collection('users').aggregate([
    { $lookup: { from: 'orders', localField: '_id', foreignField: 'userId', as: 'orders' } },
    { $project: { _id: 0, name: 1, orderCount: { $size: '$orders' } } },
    { $sort: { name: 1 } },
  ]).toArray()
}
`,
      tests: [
        ['counts orders per user', 'expect(await usersWithOrderCount()).toEqual([{ name: "Ada", orderCount: 2 }, { name: "Alan", orderCount: 0 }, { name: "Grace", orderCount: 2 }, { name: "Linus", orderCount: 1 }])'],
        ['uses $lookup', 'expect(code).toMatch(/\\$lookup/)'],
      ],
      hints: ['`$lookup` adds an `orders` array to each user.', '`$project: { _id: 0, name: 1, orderCount: { $size: "$orders" } }`.'],
      setup: SEED,
    },
    {
      id: 'injection',
      title: 'Safe queries',
      learn: `JSON from a request can contain **operators**. If a login checks \`findOne({ email, password })\` with the body as-is, sending \`{ "password": { "$ne": null } }\` matches any password.

Check that inputs are the types you expect (strings!) before they reach a query, and compare password hashes in code, not in the query.`,
      task: 'Fix `findByEmail(input)`: return `null` unless `input.email` is a string; then find the user by a lower-cased, trimmed email. The data has an `accounts` collection.',
      starter: `const accounts = db.collection('accounts')
accounts.insertMany([{ email: 'ada@example.com', name: 'Ada' }, { email: 'linus@example.com', name: 'Linus' }])

async function findByEmail(input) {
  return accounts.findOne({ email: input.email })
}
`,
      solution: `const accounts = db.collection('accounts')
accounts.insertMany([{ email: 'ada@example.com', name: 'Ada' }, { email: 'linus@example.com', name: 'Linus' }])

async function findByEmail(input) {
  if (typeof input?.email !== 'string') return null
  return accounts.findOne({ email: input.email.trim().toLowerCase() })
}
`,
      tests: [
        ['finds by email, ignoring case and spaces', 'expect((await findByEmail({ email: "  ADA@example.com " }))?.name).toBe("Ada")'],
        ['refuses operator objects', 'expect(await findByEmail({ email: { $ne: null } })).toBeNull()'],
        ['returns null for a missing email', 'expect(await findByEmail({})).toBeNull()'],
      ],
      hints: ['`typeof input?.email !== "string"` → return `null`.', 'Normalise with `.trim().toLowerCase()` before querying.'],
      setup: SEED,
    },
  ],
}
