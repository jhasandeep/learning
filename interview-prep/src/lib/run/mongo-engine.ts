import { Aggregator, Query, update as mongoUpdate, updateMany as mongoUpdateMany, updateOne as mongoUpdateOne } from 'mingo'
import { DB_NAME, seedData } from './mongo-seed'

// A small mongosh-style shell on top of mingo (MongoDB's query language for
// in-memory objects). Collections live in memory; db.<name>.find(), insertOne(),
// updateMany(), aggregate() and friends behave like the real driver for the
// everyday cases. It is pure JavaScript, so it runs in a worker and in tests.

export type Doc = Record<string, unknown>

export class ObjectId {
  readonly hex: string
  constructor(hex?: string) {
    if (hex !== undefined && !/^[0-9a-fA-F]{24}$/.test(hex)) throw new MongoServerError('BSONError: input must be a 24 character hex string')
    this.hex = hex ? hex.toLowerCase() : ObjectId.generate()
  }
  private static counter = Math.floor(Math.random() * 0xffffff)
  private static generate(): string {
    const time = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0')
    let rand = ''
    for (let i = 0; i < 10; i++) rand += Math.floor(Math.random() * 16).toString(16)
    ObjectId.counter = (ObjectId.counter + 1) % 0x1000000
    return time + rand + ObjectId.counter.toString(16).padStart(6, '0')
  }
  toString() { return this.hex }
  toJSON() { return this.hex }
  getTimestamp() { return new Date(parseInt(this.hex.slice(0, 8), 16) * 1000) }
}

export class MongoServerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MongoServerError'
  }
}

/* ------------------------------------------------------------------ */
/* Formatting (mongosh style)                                          */
/* ------------------------------------------------------------------ */

const WIDTH = 72

function quote(s: string): string {
  const q = s.includes("'") && !s.includes('"') ? '"' : "'"
  return q + s.replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll(q, `\\${q}`) + q
}

export function format(v: unknown, indent = 0, seen: WeakSet<object> = new WeakSet()): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  switch (typeof v) {
    case 'string': return quote(v)
    case 'number': return Object.is(v, -0) ? '-0' : String(v)
    case 'boolean': return String(v)
    case 'bigint': return `${v}n`
    case 'function': return `[Function: ${v.name || '(anonymous)'}]`
    case 'symbol': return v.toString()
  }
  const o = v as object
  if (o instanceof ObjectId) return `ObjectId('${o.hex}')`
  if (o instanceof Date) return Number.isNaN(o.getTime()) ? 'Invalid Date' : `ISODate('${o.toISOString()}')`
  if (o instanceof RegExp) return String(o)
  if (o instanceof Error) return `${o.name}: ${o.message}`
  if (seen.has(o)) return '[Circular]'
  seen.add(o)
  const pad = ' '.repeat(indent + 2)
  const wrap = (open: string, close: string, parts: string[]) => {
    if (parts.length === 0) return open + close
    const inline = `${open} ${parts.join(', ')} ${close}`
    if (!parts.some((p) => p.includes('\n')) && inline.length + indent <= WIDTH) return inline
    return `${open}\n${parts.map((p) => pad + p).join(',\n')}\n${' '.repeat(indent)}${close}`
  }
  let out: string
  if (Array.isArray(o)) {
    out = wrap('[', ']', o.map((x) => format(x, indent + 2, seen)))
  } else {
    const entries = Object.entries(o as Doc)
    out = wrap('{', '}', entries.map(([k, x]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : quote(k)}: ${format(x, indent + 2, seen)}`))
  }
  seen.delete(o)
  return out
}

/** A stable string for comparing results (object keys sorted, ObjectIds anonymised). */
function canon(v: unknown): string {
  if (v instanceof ObjectId) return '"<ObjectId>"'
  if (v instanceof Date) return `"${v.toISOString()}"`
  if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`
  if (v && typeof v === 'object') {
    return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon((v as Doc)[k])}`).join(',')}}`
  }
  return v === undefined ? 'null' : JSON.stringify(v)
}

export function clone<T>(v: T): T {
  if (v instanceof ObjectId) return new ObjectId(v.hex) as T
  if (v instanceof Date) return new Date(v.getTime()) as T
  if (Array.isArray(v)) return v.map(clone) as T
  if (v && typeof v === 'object' && !(v instanceof RegExp)) {
    const out: Doc = {}
    for (const [k, x] of Object.entries(v)) out[k] = clone(x)
    return out as T
  }
  return v
}

/* ------------------------------------------------------------------ */
/* Cursors                                                             */
/* ------------------------------------------------------------------ */

interface FetchOptions { sort?: Doc; skip?: number; limit?: number; projection?: Doc }

export class Cursor {
  private readonly o: FetchOptions = {}
  private buffer: Doc[] | null = null
  private pos = 0

  constructor(private readonly fetch: (o: FetchOptions) => Doc[], private readonly explainFn: () => Doc) {}

  sort(spec: Doc) { this.o.sort = spec; return this }
  skip(n: number) { this.o.skip = n; return this }
  limit(n: number) { this.o.limit = n; return this }
  project(p: Doc) { this.o.projection = p; return this }
  // Accepted for compatibility with the real shell; they change nothing here.
  pretty() { return this }
  batchSize() { return this }
  hint() { return this }
  maxTimeMS() { return this }
  close() { return undefined }

  private all(): Doc[] { return (this.buffer ??= this.fetch(this.o)) }
  toArray(): Doc[] { return this.all().map(clone) }
  forEach(fn: (d: Doc) => void) { this.toArray().forEach(fn) }
  map(fn: (d: Doc) => unknown) { return this.toArray().map(fn) }
  count() { return this.all().length }
  size() { return this.all().length }
  itcount() { return this.all().length }
  hasNext() { return this.pos < this.all().length }
  next() {
    if (!this.hasNext()) throw new MongoServerError('Cursor is exhausted: there are no more documents')
    return clone(this.all()[this.pos++])
  }
  explain() { return this.explainFn() }
  [Symbol.iterator]() { return this.toArray()[Symbol.iterator]() }
}

/* ------------------------------------------------------------------ */
/* Collections and the database                                        */
/* ------------------------------------------------------------------ */

interface IndexDef { name: string; key: Doc; unique: boolean }

const isOperatorDoc = (d: unknown): d is Doc => !!d && typeof d === 'object' && !Array.isArray(d) && Object.keys(d).some((k) => k.startsWith('$'))

function pick(doc: Doc, path: string): unknown {
  let cur: unknown = doc
  for (const part of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined
    cur = (cur as Doc)[part]
  }
  return cur
}

/** MongoDB puts _id first in a projected document; mingo appends it. */
function idFirst(d: Doc): Doc {
  if (!('_id' in d)) return d
  const { _id, ...rest } = d
  return { _id, ...rest }
}

function assertDoc(d: unknown, what = 'document'): asserts d is Doc {
  if (!d || typeof d !== 'object' || Array.isArray(d)) throw new MongoServerError(`The ${what} must be an object, like { name: "Asha" }`)
}

class Collection {
  docs: Doc[] = []
  indexes: IndexDef[] = [{ name: '_id_', key: { _id: 1 }, unique: true }]
  created = false

  constructor(readonly name: string, private readonly db: Database) {}

  private ns() { return `${this.db.name}.${this.name}` }

  private checkUnique(doc: Doc, ignore?: Doc) {
    for (const idx of this.indexes) {
      if (!idx.unique) continue
      const fields = Object.keys(idx.key)
      const mine = fields.map((f) => canon(pick(doc, f)))
      const clash = this.docs.some((d) => d !== ignore && fields.every((f, i) => canon(pick(d, f)) === mine[i]))
      if (clash) {
        const keyDoc = Object.fromEntries(fields.map((f) => [f, pick(doc, f)]))
        throw new MongoServerError(`E11000 duplicate key error collection: ${this.ns()} index: ${idx.name} dup key: ${format(keyDoc)}`)
      }
    }
  }

  private add(input: unknown): unknown {
    assertDoc(input)
    const doc = clone(input)
    if (!('_id' in doc)) Object.assign(doc, { _id: new ObjectId() })
    const ordered: Doc = { _id: doc._id, ...doc }
    this.checkUnique(ordered)
    this.docs.push(ordered)
    this.created = true
    return ordered._id
  }

  /* reads */
  find(filter: Doc = {}, projection?: Doc): Cursor {
    assertDoc(filter, 'filter')
    return new Cursor(
      (o) => {
        let cur = new Query(filter).find(this.docs, o.projection ?? projection)
        if (o.sort) cur = cur.sort(o.sort)
        if (o.skip) cur = cur.skip(o.skip)
        if (o.limit) cur = cur.limit(o.limit)
        return cur.all().map((d) => idFirst(clone(d as Doc)))
      },
      () => this.explain(filter),
    )
  }
  findOne(filter: Doc = {}, projection?: Doc): Doc | null {
    return this.find(filter, projection).limit(1).toArray()[0] ?? null
  }
  countDocuments(filter: Doc = {}): number { return new Query(filter).find(this.docs).all().length }
  estimatedDocumentCount(): number { return this.docs.length }
  distinct(field: string, filter: Doc = {}): unknown[] {
    const seen = new Map<string, unknown>()
    for (const d of new Query(filter).find(this.docs).all() as Doc[]) {
      const v = pick(d, field)
      for (const x of Array.isArray(v) ? v : [v]) if (x !== undefined && x !== null) seen.set(canon(x), x)
    }
    return [...seen.values()].sort((a, b) => (canon(a) < canon(b) ? -1 : 1)).map(clone)
  }
  aggregate(pipeline: Doc[]): Cursor {
    if (!Array.isArray(pipeline)) throw new MongoServerError('aggregate() takes an array of stages: [ { $match: {...} }, ... ]')
    return new Cursor(
      () => (new Aggregator(pipeline, { collectionResolver: (name: string) => this.db.raw(name) }).run(this.docs) as Doc[]).map((d) => clone(d)),
      () => ({ stages: pipeline.map((s) => Object.keys(s)[0]), note: 'Aggregation runs in memory in this playground.' }),
    )
  }

  /* writes */
  insertOne(doc: unknown) {
    return { acknowledged: true, insertedId: this.add(doc) }
  }
  insertMany(docs: unknown[]) {
    if (!Array.isArray(docs)) throw new MongoServerError('insertMany() takes an array of documents')
    const insertedIds: Doc = {}
    docs.forEach((d, i) => { insertedIds[String(i)] = this.add(d) })
    return { acknowledged: true, insertedIds }
  }

  private runUpdate(filter: Doc, update: Doc, options: Doc | undefined, many: boolean) {
    assertDoc(filter, 'filter')
    if (!update || typeof update !== 'object') throw new MongoServerError('The update must be an object like { $set: { field: value } }')
    if (!Array.isArray(update) && !Object.keys(update).every((k) => k.startsWith('$'))) {
      throw new MongoServerError('Update document requires atomic operators like $set. To replace a whole document, use replaceOne().')
    }
    const before = this.docs.map((d) => canon(d))
    const res = (many ? mongoUpdateMany : mongoUpdateOne)(this.docs, filter, update as never, { cloneMode: 'none' })
    if (res.matchedCount === 0 && options?.upsert) {
      const seed: Doc = {}
      for (const [k, v] of Object.entries(filter)) if (!k.startsWith('$') && !isOperatorDoc(v)) seed[k] = clone(v)
      const setOnInsert = (update as Doc).$setOnInsert
      const mod = { ...(update as Doc) }
      delete mod.$setOnInsert
      if (Object.keys(mod).length > 0) mongoUpdate(seed, mod as never)
      if (setOnInsert && typeof setOnInsert === 'object') Object.assign(seed, clone(setOnInsert))
      return { acknowledged: true, insertedId: this.add(seed), matchedCount: 0, modifiedCount: 0, upsertedCount: 1 }
    }
    const modified = this.docs.reduce((n, d, i) => n + (before[i] !== canon(d) ? 1 : 0), 0)
    for (const d of this.docs) this.checkUnique(d, d)
    return { acknowledged: true, insertedId: null, matchedCount: res.matchedCount, modifiedCount: modified, upsertedCount: 0 }
  }
  updateOne(filter: Doc, update: Doc, options?: Doc) { return this.runUpdate(filter, update, options, false) }
  updateMany(filter: Doc, update: Doc, options?: Doc) { return this.runUpdate(filter, update, options, true) }
  replaceOne(filter: Doc, replacement: Doc) {
    assertDoc(replacement, 'replacement')
    const target = (new Query(filter).find(this.docs).all() as Doc[])[0]
    if (!target) return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 0 }
    const next = { _id: target._id, ...clone(replacement) }
    const changed = canon(next) !== canon(target)
    for (const k of Object.keys(target)) delete target[k]
    Object.assign(target, next)
    return { acknowledged: true, matchedCount: 1, modifiedCount: changed ? 1 : 0, upsertedCount: 0 }
  }
  findOneAndUpdate(filter: Doc, update: Doc, options: Doc = {}) {
    const before = this.findOne(filter)
    this.updateOne(filter, update, options)
    if (options.returnDocument === 'after' || options.returnNewDocument === true) {
      return this.findOne(before ? { _id: before._id } : filter)
    }
    return before
  }
  deleteOne(filter: Doc) { return this.runDelete(filter, 1) }
  deleteMany(filter: Doc = {}) { return this.runDelete(filter, Infinity) }
  findOneAndDelete(filter: Doc) {
    const hit = this.findOne(filter)
    if (hit) this.runDelete({ _id: hit._id }, 1)
    return hit
  }
  private runDelete(filter: Doc, max: number) {
    assertDoc(filter, 'filter')
    const hits = new Set((new Query(filter).find(this.docs).all() as Doc[]).slice(0, max))
    this.docs = this.docs.filter((d) => !hits.has(d))
    return { acknowledged: true, deletedCount: hits.size }
  }

  /* indexes and housekeeping */
  createIndex(keys: Doc, options: Doc = {}): string {
    assertDoc(keys, 'index specification')
    const name = typeof options.name === 'string' ? options.name : Object.entries(keys).map(([k, v]) => `${k}_${v}`).join('_')
    if (!this.indexes.some((i) => i.name === name)) {
      const idx: IndexDef = { name, key: clone(keys), unique: options.unique === true }
      if (idx.unique) {
        const saved = this.indexes
        this.indexes = [...saved, idx]
        try {
          for (const d of this.docs) this.checkUnique(d, d)
        } catch (e) {
          this.indexes = saved
          throw e
        }
      } else {
        this.indexes.push(idx)
      }
    }
    this.created = true
    return name
  }
  createIndexes(specs: Doc[]) { return specs.map((s) => this.createIndex(s)) }
  getIndexes() { return this.indexes.map((i) => ({ v: 2, key: clone(i.key), name: i.name, ...(i.unique && i.name !== '_id_' ? { unique: true } : {}) })) }
  dropIndex(name: string) {
    if (name === '_id_') throw new MongoServerError('cannot drop _id index')
    const n = this.indexes.length
    this.indexes = this.indexes.filter((i) => i.name !== name)
    if (this.indexes.length === n) throw new MongoServerError(`index not found with name [${name}]`)
    return { nIndexesWas: n, ok: 1 }
  }
  drop(): boolean {
    const existed = this.created
    this.db.removeCollection(this.name)
    return existed
  }
  renameCollection() { throw new MongoServerError('renameCollection() is not supported in this playground') }
  explain(filter: Doc = {}): Doc {
    const top = Object.keys(filter)
    const idx = this.indexes.find((i) => top.includes(Object.keys(i.key)[0]))
    const returned = this.countDocuments(filter)
    return {
      queryPlanner: { namespace: this.ns(), parsedQuery: clone(filter), winningPlan: idx ? { stage: 'FETCH', inputStage: { stage: 'IXSCAN', indexName: idx.name, keyPattern: clone(idx.key) } } : { stage: 'COLLSCAN', direction: 'forward' } },
      executionStats: { nReturned: returned, totalDocsExamined: idx ? returned : this.docs.length },
    }
  }
  count(filter: Doc = {}) { return this.countDocuments(filter) }
}

export class Database {
  private readonly cols = new Map<string, Collection>()
  constructor(readonly name: string) {}

  raw(name: string): Doc[] { return this.cols.get(name)?.docs ?? [] }
  getCollection(name: string): Collection {
    let c = this.cols.get(name)
    if (!c) {
      c = new Collection(name, this)
      this.cols.set(name, c)
    }
    return c
  }
  removeCollection(name: string) { this.cols.delete(name) }
  getCollectionNames(): string[] { return [...this.cols.values()].filter((c) => c.created).map((c) => c.name).sort() }
  createCollection(name: string) {
    this.getCollection(name).created = true
    return { ok: 1 }
  }
  dropDatabase() {
    this.cols.clear()
    return { ok: 1, dropped: this.name }
  }
  info() {
    return [...this.cols.values()].filter((c) => c.created).sort((a, b) => a.name.localeCompare(b.name)).map((c) => ({
      name: c.name,
      count: c.docs.length,
      fields: [...new Set(c.docs.slice(0, 20).flatMap((d) => Object.keys(d)))].slice(0, 12),
      indexes: c.indexes.length,
    }))
  }
}

/* ------------------------------------------------------------------ */
/* Splitting a script into top-level statements                        */
/* ------------------------------------------------------------------ */

const CONTINUES_AFTER = /[,.+\-*/%=&|?:<>!^~]$/
const CONTINUES_BEFORE = /^(?:\.|\?\.|&&|\|\||\?\?|\?(?!\?)|:|\+|-|\*|\/(?![/*])|=>|,|else\b|catch\b|finally\b)/
/** True for `if (...)`, `for (...)` or `while (...)` with nothing after the closing parenthesis yet (the body is on the next line). */
function isBareHeader(t: string): boolean {
  const m = /^(?:if|for|while)\s*\(/.exec(t)
  if (!m) return false
  let depth = 0
  for (let i = m[0].length - 1; i < t.length; i++) {
    if (t[i] === '(') depth++
    else if (t[i] === ')' && --depth === 0) return i === t.length - 1
  }
  return false
}

function afterComments(rest: string): string {
  return rest.replace(/^(?:\s|\/\/[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)*/, '')
}

/** Splits a script into statements the way a shell would run them: on `;` and on newlines that do not continue an expression. */
export function splitStatements(src: string): string[] {
  const out: string[] = []
  let cur = ''
  let depth = 0
  let i = 0
  let last = '' // last significant (non-space) character, to tell a regex from a division
  const flush = () => {
    const t = cur.trim()
    if (t) out.push(t)
    cur = ''
    last = ''
  }
  const copyQuoted = (q: string) => {
    cur += src[i++]
    while (i < src.length && src[i] !== q) {
      if (src[i] === '\\') cur += src[i++]
      cur += src[i++]
    }
    cur += src[i++] ?? ''
    last = q
  }
  const copyTemplate = () => {
    cur += src[i++]
    while (i < src.length && src[i] !== '`') {
      if (src[i] === '\\') {
        cur += src[i++]
        cur += src[i++] ?? ''
      } else if (src[i] === '$' && src[i + 1] === '{') {
        let d = 0
        do {
          if (src[i] === '{') d++
          else if (src[i] === '}') d--
          cur += src[i++]
        } while (i < src.length && d > 0)
      } else {
        cur += src[i++]
      }
    }
    cur += src[i++] ?? ''
    last = '`'
  }
  const copyRegex = () => {
    cur += src[i++]
    let inClass = false
    while (i < src.length && src[i] !== '\n' && (src[i] !== '/' || inClass)) {
      if (src[i] === '\\') cur += src[i++]
      else if (src[i] === '[') inClass = true
      else if (src[i] === ']') inClass = false
      cur += src[i++]
    }
    cur += src[i++] ?? ''
    last = '/'
  }

  while (i < src.length) {
    const c = src[i]
    const next = src[i + 1]
    if (c === '/' && next === '/') {
      while (i < src.length && src[i] !== '\n') i++
      continue
    }
    if (c === '/' && next === '*') {
      const end = src.indexOf('*/', i + 2)
      i = end === -1 ? src.length : end + 2
      cur += ' '
      continue
    }
    if (c === '"' || c === "'") { copyQuoted(c); continue }
    if (c === '`') { copyTemplate(); continue }
    if (c === '/' && (last === '' || '(,=:[!&|?{};'.includes(last))) { copyRegex(); continue }
    if (c === '(' || c === '[' || c === '{') depth++
    else if (c === ')' || c === ']' || c === '}') depth = Math.max(0, depth - 1)

    if (c === ';' && depth === 0) {
      i++
      flush()
      continue
    }
    if (c === '\n' && depth === 0) {
      i++
      const t = cur.trim()
      if (t === '') { cur = ''; continue }
      const upcoming = afterComments(src.slice(i))
      const continues = CONTINUES_AFTER.test(t) && !/(\+\+|--)$/.test(t)
        || CONTINUES_BEFORE.test(upcoming)
        || isBareHeader(t)
      if (continues) cur += '\n'
      else flush()
      continue
    }
    cur += c
    if (!/\s/.test(c)) last = c
    i++
  }
  flush()
  return out
}

/* ------------------------------------------------------------------ */
/* The shell                                                           */
/* ------------------------------------------------------------------ */

export interface Step {
  /** The statement that produced this output (empty for print() output). */
  code: string
  kind: 'value' | 'log' | 'error' | 'info'
  text: string
}

export interface RunReport {
  steps: Step[]
  /** The last statement's value, for comparing results. */
  last: unknown
  failed: boolean
}

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (...args: string[]) => (scope: object) => Promise<unknown>

const MAX_CURSOR_PREVIEW = 20
const MAX_ARRAY_PREVIEW = 500

function describeError(e: unknown): string {
  if (e instanceof Error) return e.name === 'Error' ? e.message : `${e.name}: ${e.message}`
  return String(e)
}

export class MongoEngine {
  private db = new Database(DB_NAME)
  private vars: Record<string, unknown> = {}
  private logs: string[] = []

  constructor() {
    this.reset()
  }

  reset() {
    this.db = new Database(DB_NAME)
    for (const [name, docs] of Object.entries(seedData())) {
      const c = this.db.getCollection(name)
      c.docs = docs
      c.created = true
    }
    this.vars = {}
    this.logs = []
  }

  collections() { return this.db.info() }

  private builtins(): Record<string, unknown> {
    const dbProxy = new Proxy(this.db as unknown as Record<string | symbol, unknown>, {
      get: (target, key) => {
        if (key in target) {
          const v = target[key]
          return typeof v === 'function' ? v.bind(target) : v
        }
        return typeof key === 'string' ? this.db.getCollection(key) : undefined
      },
    })
    const print = (...args: unknown[]) => {
      this.logs.push(args.map((a) => (typeof a === 'string' ? a : format(a))).join(' '))
    }
    const ObjectIdFn = function (hex?: string) { return new ObjectId(hex) }
    ObjectIdFn.prototype = ObjectId.prototype
    return {
      db: dbProxy,
      print,
      printjson: print,
      console: { log: print, info: print, warn: print, error: print },
      ObjectId: ObjectIdFn,
      ISODate: (s?: string) => {
        const d = s === undefined ? new Date() : new Date(s)
        if (Number.isNaN(d.getTime())) throw new MongoServerError(`Invalid date: ${s}`)
        return d
      },
      NumberInt: (n: unknown) => Math.trunc(Number(n)),
      NumberLong: (n: unknown) => Number(n),
      NumberDecimal: (n: unknown) => Number(n),
    }
  }

  private scope(): object {
    const builtins = this.builtins()
    const vars = this.vars
    return new Proxy({}, {
      has: (_, k) => typeof k === 'string' && (k in vars || k in builtins),
      get: (_, k) => (typeof k === 'string' ? (k in vars ? vars[k] : builtins[k]) : undefined),
      set: (_, k, v) => { if (typeof k === 'string') vars[k] = v; return true },
    })
  }

  /** `const x = ...` and `function f() {}` become session variables, like in the shell. */
  private declare(stmt: string): { code: string; declared: boolean } {
    const names = (pattern: string) => pattern.match(/[A-Za-z_$][\w$]*/g) ?? []
    const simple = /^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=(?!=)\s*/.exec(stmt)
    if (simple) {
      this.vars[simple[1]] = undefined
      return { code: `${simple[1]} = ${stmt.slice(simple[0].length)}`, declared: true }
    }
    const destructure = /^(?:const|let|var)\s+([{[][^=]*[}\]])\s*=(?!=)\s*/.exec(stmt)
    if (destructure) {
      for (const n of names(destructure[1])) this.vars[n] = undefined
      return { code: `(${destructure[1]} = ${stmt.slice(destructure[0].length)})`, declared: true }
    }
    const fn = /^(async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/.exec(stmt)
    if (fn) {
      this.vars[fn[2]] = undefined
      return { code: `${fn[2]} = ${fn[1] ?? ''}function (${stmt.slice(fn[0].length)}`, declared: true }
    }
    return { code: stmt, declared: false }
  }

  private async evaluate(stmt: string): Promise<{ value: unknown; declared: boolean }> {
    const { code, declared } = this.declare(stmt)
    const scope = this.scope()
    let fn: (scope: object) => Promise<unknown>
    try {
      fn = new AsyncFunction('__scope', `with (__scope) { return (\n${code}\n) }`)
    } catch {
      fn = new AsyncFunction('__scope', `with (__scope) {\n${code}\n}`)
    }
    return { value: await fn(scope), declared }
  }

  private shellCommand(stmt: string): string | null {
    const s = stmt.trim().replace(/;$/, '')
    if (/^show\s+(collections|tables)$/i.test(s)) return this.db.getCollectionNames().join('\n') || '(no collections)'
    if (/^show\s+(dbs|databases)$/i.test(s)) return `${this.db.name}   ${this.db.getCollectionNames().length} collections`
    const use = /^use\s+(\S+)$/i.exec(s)
    if (use) return use[1] === this.db.name ? `already on db ${this.db.name}` : `switched to db ${use[1]} (this playground has one database: ${this.db.name})`
    return null
  }

  async run(source: string): Promise<RunReport> {
    const steps: Step[] = []
    let last: unknown
    for (const stmt of splitStatements(source)) {
      const label = stmt.length > 160 ? `${stmt.slice(0, 157)}…` : stmt
      this.logs = []
      const shell = this.shellCommand(stmt)
      let value: unknown
      let declared = false
      let error: unknown
      if (shell !== null) {
        steps.push({ code: label, kind: 'info', text: shell })
        continue
      }
      try {
        ;({ value, declared } = await this.evaluate(stmt))
      } catch (e) {
        error = e
      }
      for (const text of this.logs) steps.push({ code: '', kind: 'log', text })
      if (error !== undefined) {
        steps.push({ code: label, kind: 'error', text: describeError(error) })
        return { steps, last, failed: true }
      }
      if (declared || value === undefined) continue
      if (value instanceof Cursor) {
        const all = value.toArray()
        const shown = all.slice(0, MAX_CURSOR_PREVIEW)
        const more = all.length - shown.length
        steps.push({ code: label, kind: 'value', text: format(shown) + (more > 0 ? `\n… ${more} more document${more === 1 ? '' : 's'}. Add .limit(), or use .toArray() to print them all.` : '') })
        last = all
      } else {
        let text = format(value)
        if (Array.isArray(value) && value.length > MAX_ARRAY_PREVIEW) text = format(value.slice(0, MAX_ARRAY_PREVIEW)) + `\n… ${value.length - MAX_ARRAY_PREVIEW} more`
        steps.push({ code: label, kind: 'value', text })
        last = value
      }
    }
    return { steps, last, failed: false }
  }
}

/* ------------------------------------------------------------------ */
/* Lesson challenges                                                   */
/* ------------------------------------------------------------------ */

export interface ChallengeSpec {
  /** A reference answer; the learner's result is compared with what it produces. */
  solution: string
  /** Optional query run after both, to compare the resulting data (for inserts, updates, deletes). */
  verify?: string
  /** Whether the order of returned documents matters. */
  ordered?: boolean
}

export function sameResult(a: unknown, b: unknown, ordered: boolean): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    const x = a.map(canon)
    const y = b.map(canon)
    if (!ordered) {
      x.sort()
      y.sort()
    }
    return x.length === y.length && x.every((v, i) => v === y[i])
  }
  return canon(a) === canon(b)
}

function sizeOf(v: unknown) { return Array.isArray(v) ? `${v.length} document${v.length === 1 ? '' : 's'}` : 'a single value' }

/** Runs the learner's code and the reference solution on identical fresh databases and compares them. */
export async function checkChallenge(code: string, spec: ChallengeSpec): Promise<{ pass: boolean; detail: string }> {
  const mine = new MongoEngine()
  const ref = new MongoEngine()
  const a = await mine.run(code)
  const failure = a.steps.find((s) => s.kind === 'error')
  if (failure) return { pass: false, detail: `Your code failed: ${failure.text}` }
  const b = await ref.run(spec.solution)
  let got = a.last
  let want = b.last
  if (spec.verify) {
    got = (await mine.run(spec.verify)).last
    want = (await ref.run(spec.verify)).last
  }
  if (got === undefined) return { pass: false, detail: spec.verify ? 'The data is not what the task asked for yet.' : 'Your code did not produce a result. End with the query (or the write) the task asks for.' }
  if (sameResult(got, want, spec.ordered === true)) return { pass: true, detail: 'Correct! Your result matches the expected one.' }
  if (!spec.ordered && Array.isArray(got) && Array.isArray(want) && sameResult(got, want, false)) return { pass: false, detail: 'Right documents, wrong order. Check your sort.' }
  if (Array.isArray(got) && Array.isArray(want) && got.length !== want.length) return { pass: false, detail: `Not quite: your query returned ${sizeOf(got)}, but ${sizeOf(want)} ${want.length === 1 ? 'was' : 'were'} expected.` }
  return { pass: false, detail: 'Not quite: the result is different from the expected one. Re-read the task and try again, or open the hint.' }
}
