import { describe, expect, it } from 'vitest'
import { MONGO_LESSONS } from '@/data/mongo-lessons'
import { checkChallenge, format, MongoEngine, ObjectId, sameResult, splitStatements } from '@/lib/run/mongo-engine'

const run = async (code: string, engine = new MongoEngine()) => engine.run(code)
const text = async (code: string, engine?: MongoEngine) => (await run(code, engine)).steps.map((s) => s.text).join('\n')

describe('splitStatements', () => {
  it('splits on semicolons and newlines but keeps chained calls together', () => {
    expect(splitStatements('db.a.find()\ndb.b.find();db.c.find()')).toEqual(['db.a.find()', 'db.b.find()', 'db.c.find()'])
    expect(splitStatements('db.a\n  .find({ x: 1 })\n  .sort({ y: -1 })\n  .limit(2)')).toHaveLength(1)
    expect(splitStatements('db.a.aggregate([\n  { $match: { a: 1 } },\n  { $group: { _id: "$b" } }\n])\ndb.b.find()')).toHaveLength(2)
  })

  it('ignores comments, and semicolons or newlines inside strings, templates and regexes', () => {
    expect(splitStatements('// hi\ndb.a.find({ s: "a;b\\nc" }) // trailing\n/* block\n; */ db.b.find()')).toEqual(['db.a.find({ s: "a;b\\nc" })', 'db.b.find()'])
    expect(splitStatements('db.a.find({ n: /a;b\\/c/i })\ndb.b.find()')).toHaveLength(2)
    expect(splitStatements('print(`x ${1 + 1};\n`)\nprint(2)')).toHaveLength(2)
  })

  it('keeps if/else and function bodies in one statement', () => {
    expect(splitStatements('if (true) {\n  print(1)\n}\nelse {\n  print(2)\n}\nprint(3)')).toHaveLength(2)
    expect(splitStatements('if (x)\n  print(1)\nprint(2)')).toHaveLength(2)
  })
})

describe('format', () => {
  it('prints like mongosh', () => {
    expect(format({ a: 1, b: 'x', c: [1, 2] })).toBe("{ a: 1, b: 'x', c: [ 1, 2 ] }")
    expect(format({ 'a-b': new ObjectId('0123456789abcdef01234567'), d: new Date('2025-01-02T00:00:00Z') })).toBe("{\n  'a-b': ObjectId('0123456789abcdef01234567'),\n  d: ISODate('2025-01-02T00:00:00.000Z')\n}")
    expect(format({ _id: new ObjectId('0123456789abcdef01234567') })).toBe("{ _id: ObjectId('0123456789abcdef01234567') }")
    expect(format([])).toBe('[]')
    expect(format({ long: 'x'.repeat(80) })).toContain('\n')
  })
})

describe('MongoEngine', () => {
  it('queries the sample database', async () => {
    const r = await run('db.customers.find({ country: "India" }, { name: 1 }).sort({ age: 1 })')
    expect(r.failed).toBe(false)
    expect(r.last).toEqual([{ _id: 1, name: 'Asha Verma' }, { _id: 6, name: 'Farid Khan' }])
    expect(await text('db.customers.countDocuments({ tier: "gold" })')).toBe('2')
    expect(await text('db.customers.findOne({ name: "nobody" })')).toBe('null')
  })

  it('persists data and variables between runs until reset', async () => {
    const e = new MongoEngine()
    await run('const names = ["Ann", "Bob"]\ndb.people.insertMany(names.map((n) => ({ _id: n })))', e)
    expect(await text('db.people.countDocuments()', e)).toBe('2')
    expect(await text('names.length', e)).toBe('2')
    e.reset()
    expect(await text('db.people.countDocuments()', e)).toBe('0')
    expect((await run('names', e)).failed).toBe(true)
  })

  it('supports insert, update (incl. upsert), delete and their result shapes', async () => {
    const e = new MongoEngine()
    expect(await text('db.products.insertOne({ _id: 99, name: "X" })', e)).toBe('{ acknowledged: true, insertedId: 99 }')
    expect(await text('db.products.updateOne({ _id: 99 }, { $set: { price: 5 }, $inc: { stock: 2 } })', e)).toContain('modifiedCount: 1')
    expect(await text('db.products.findOne({ _id: 99 })', e)).toBe("{ _id: 99, name: 'X', price: 5, stock: 2 }")
    expect(await text('db.products.updateOne({ _id: 99 }, { $set: { price: 5 } })', e)).toContain('modifiedCount: 0')
    expect(await text('db.products.updateOne({ _id: 100 }, { $set: { name: "Y" } }, { upsert: true })', e)).toContain('upsertedCount: 1')
    expect(await text('db.products.findOne({ _id: 100 })', e)).toBe("{ _id: 100, name: 'Y' }")
    expect(await text('db.products.deleteMany({ _id: { $in: [99, 100] } })', e)).toBe('{ acknowledged: true, deletedCount: 2 }')
  })

  it('generates ObjectIds and rejects duplicate keys', async () => {
    const e = new MongoEngine()
    expect(await text('db.t.insertOne({ a: 1 })', e)).toMatch(/insertedId: ObjectId\('[0-9a-f]{24}'\)/)
    const dup = await run('db.products.insertOne({ _id: 1, name: "dup" })', e)
    expect(dup.failed).toBe(true)
    expect(dup.steps[0].text).toMatch(/E11000 duplicate key error collection: shop\.products index: _id_ dup key: \{ _id: 1 \}/)
    await run('db.customers.createIndex({ name: 1 }, { unique: true })', e)
    expect((await run('db.customers.insertOne({ name: "Chen Li" })', e)).failed).toBe(true)
  })

  it('runs aggregations including $lookup and $unwind', async () => {
    const r = await run('db.orders.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }, { $sort: { _id: 1 } }])')
    expect(r.last).toEqual([{ _id: 'paid', n: 4 }, { _id: 'pending', n: 2 }, { _id: 'shipped', n: 2 }])
    const j = await run('db.orders.aggregate([{ $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "c" } }, { $unwind: "$c" }, { $match: { _id: 5 } }, { $project: { c: "$c.name" } }])')
    expect(j.last).toEqual([{ _id: 5, c: 'Asha Verma' }])
  })

  it('handles dates, nested fields, arrays and distinct', async () => {
    expect((await run('db.orders.find({ date: { $gte: ISODate("2025-03-01") } }).count()')).last).toBe(3)
    expect((await run('db.customers.find({ "address.city": "Delhi" }).toArray().map((c) => c.name)')).last).toEqual(['Asha Verma'])
    expect((await run('db.customers.distinct("country")')).last).toEqual(['China', 'India', 'UAE', 'UK', 'USA'])
    expect((await run('db.customers.distinct("tags")')).last).toEqual(['newsletter', 'vip'])
  })

  it('supports print, loops, functions, async/await and shell helpers', async () => {
    const r = await run('function double(n) { return n * 2 }\nfor (const p of db.products.find({ price: { $lt: 100 } }).toArray()) {\n  print(p.name, double(p.price))\n}\nawait db.products.countDocuments()\nshow collections')
    expect(r.failed).toBe(false)
    expect(r.steps.map((s) => s.text)).toEqual(['Pen 40', '6', 'customers\norders\nproducts'])
  })

  it('reports errors with the failing statement and stops there', async () => {
    const r = await run('db.customers.find()\nnope.find()\ndb.orders.find()')
    expect(r.failed).toBe(true)
    expect(r.steps.at(-1)).toMatchObject({ kind: 'error', code: 'nope.find()' })
    expect(r.steps.at(-1)?.text).toMatch(/nope is not defined/)
    expect((await run('db.customers.updateOne({}, { name: "x" })')).steps[0].text).toMatch(/atomic operators/)
  })

  it('previews 20 cursor documents and explains index use', async () => {
    const e = new MongoEngine()
    await run('db.big.insertMany(Array.from({ length: 30 }, (_, i) => ({ _id: i })))', e)
    expect(await text('db.big.find()', e)).toMatch(/10 more documents/)
    expect(await text('db.customers.find({ country: "UK" }).explain()', e)).toContain("stage: 'COLLSCAN'")
    await run('db.customers.createIndex({ country: 1 })', e)
    expect(await text('db.customers.find({ country: "UK" }).explain()', e)).toContain("stage: 'IXSCAN'")
    expect(await text('db.customers.getIndexes().map((i) => i.name)', e)).toBe("[ '_id_', 'country_1' ]")
  })

  it('lists the database contents for the schema panel', () => {
    const info = new MongoEngine().collections()
    expect(info.map((c) => [c.name, c.count])).toEqual([['customers', 6], ['orders', 8], ['products', 6]])
    expect(info[0].fields).toContain('address')
  })
})

describe('sameResult', () => {
  it('ignores key order and, unless ordered, document order', () => {
    expect(sameResult([{ a: 1, b: 2 }], [{ b: 2, a: 1 }], true)).toBe(true)
    expect(sameResult([1, 2], [2, 1], false)).toBe(true)
    expect(sameResult([1, 2], [2, 1], true)).toBe(false)
  })
})

describe('lessons', () => {
  it('have unique ids and complete content', () => {
    expect(new Set(MONGO_LESSONS.map((l) => l.id)).size).toBe(MONGO_LESSONS.length)
    for (const l of MONGO_LESSONS) {
      expect(l.body.length, l.id).toBeGreaterThan(0)
      expect(l.challenge.task.length, l.id).toBeGreaterThan(10)
      expect(l.challenge.hint.length, l.id).toBeGreaterThan(5)
    }
  })

  it.each(MONGO_LESSONS.map((l) => [l.id, l] as const))('%s: the example runs without errors', async (_id, l) => {
    const r = await run(l.example.code)
    expect(r.failed, r.steps.find((s) => s.kind === 'error')?.text).toBe(false)
  })

  it.each(MONGO_LESSONS.map((l) => [l.id, l] as const))('%s: the reference solution passes and the starter does not', async (_id, l) => {
    const ok = await checkChallenge(l.challenge.solution, l.challenge)
    expect(ok, ok.detail).toMatchObject({ pass: true })
    const verdict = await checkChallenge(l.challenge.starter, l.challenge)
    expect(verdict.pass, `${l.id} starter should not pass`).toBe(false)
  })

  it('accepts a different correct answer and rejects a wrong one', async () => {
    const shape = MONGO_LESSONS.find((l) => l.id === 'shape')!
    const alt = await checkChallenge('db.products.aggregate([{ $sort: { price: -1 } }, { $limit: 3 }, { $project: { _id: 0, name: 1, price: 1 } }])', shape.challenge)
    expect(alt.pass).toBe(true)
    const wrong = await checkChallenge('db.products.find({}, { _id: 0, name: 1, price: 1 }).sort({ price: 1 }).limit(3)', shape.challenge)
    expect(wrong.pass).toBe(false)
    const syntax = await checkChallenge('db.products.find(', shape.challenge)
    expect(syntax.pass).toBe(false)
    expect(syntax.detail).toMatch(/failed/)
  })
})
