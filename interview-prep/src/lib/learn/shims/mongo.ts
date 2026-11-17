// An in-memory MongoDB for the lessons: the common query operators, update
// operators and aggregation stages, with the driver's async method names.

type Doc = Record<string, unknown>
type Filter = Record<string, unknown>

let counter = 0
const newId = () => `id${(++counter).toString().padStart(6, '0')}`

function get(doc: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((v, k) => (v && typeof v === 'object' ? (v as Doc)[k] : undefined), doc)
}

function set(doc: Doc, path: string, value: unknown) {
  const keys = path.split('.')
  let cur: Doc = doc
  for (const k of keys.slice(0, -1)) cur = (cur[k] ??= {}) as Doc
  cur[keys[keys.length - 1]] = value
}

const eq = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b)
const cmp = (a: unknown, b: unknown) => (a === b ? 0 : (a as number) < (b as number) ? -1 : 1)

function test(value: unknown, cond: unknown): boolean {
  const isOps = cond !== null && typeof cond === 'object' && !Array.isArray(cond) && Object.keys(cond).some((k) => k.startsWith('$'))
  if (!isOps) return Array.isArray(value) && !Array.isArray(cond) ? value.some((v) => eq(v, cond)) : eq(value, cond)
  return Object.entries(cond as Doc).every(([op, arg]) => {
    switch (op) {
      case '$eq': return test(value, arg)
      case '$ne': return !test(value, arg)
      case '$gt': return value !== undefined && value !== null && cmp(value, arg) > 0
      case '$gte': return value !== undefined && value !== null && cmp(value, arg) >= 0
      case '$lt': return value !== undefined && value !== null && cmp(value, arg) < 0
      case '$lte': return value !== undefined && value !== null && cmp(value, arg) <= 0
      case '$in': return (arg as unknown[]).some((a) => test(value, a))
      case '$nin': return !(arg as unknown[]).some((a) => test(value, a))
      case '$exists': return (value !== undefined) === Boolean(arg)
      case '$regex': return typeof value === 'string' && new RegExp(arg as string, (cond as Doc).$options as string | undefined).test(value)
      case '$options': return true
      case '$size': return Array.isArray(value) && value.length === arg
      case '$all': return Array.isArray(value) && (arg as unknown[]).every((a) => value.some((v) => eq(v, a)))
      case '$elemMatch': return Array.isArray(value) && value.some((v) => matches(v as Doc, arg as Filter))
      default: throw new Error(`Unsupported query operator ${op}`)
    }
  })
}

export function matches(doc: Doc, filter: Filter = {}): boolean {
  return Object.entries(filter).every(([k, cond]) => {
    if (k === '$and') return (cond as Filter[]).every((f) => matches(doc, f))
    if (k === '$or') return (cond as Filter[]).some((f) => matches(doc, f))
    if (k === '$nor') return !(cond as Filter[]).some((f) => matches(doc, f))
    if (k.startsWith('$')) throw new Error(`Unsupported top-level operator ${k}`)
    return test(get(doc, k), cond)
  })
}

function applyUpdate(doc: Doc, update: Doc): Doc {
  const keys = Object.keys(update)
  if (!keys.length || !keys.every((k) => k.startsWith('$'))) throw new Error('Update document requires atomic operators (like $set)')
  const out = structuredClone(doc)
  for (const [op, fields] of Object.entries(update)) {
    for (const [path, v] of Object.entries(fields as Doc)) {
      const cur = get(out, path)
      switch (op) {
        case '$set': set(out, path, v); break
        case '$unset': set(out, path, undefined); delete (out as Doc)[path]; break
        case '$inc': set(out, path, ((cur as number) ?? 0) + (v as number)); break
        case '$push': set(out, path, [...((cur as unknown[]) ?? []), ...((v as Doc)?.$each as unknown[] ?? [v])]); break
        case '$addToSet': set(out, path, ((cur as unknown[]) ?? []).some((x) => eq(x, v)) ? cur : [...((cur as unknown[]) ?? []), v]); break
        case '$pull': set(out, path, ((cur as unknown[]) ?? []).filter((x) => !test(x, v))); break
        default: throw new Error(`Unsupported update operator ${op}`)
      }
    }
  }
  return out
}

function project(doc: Doc, projection?: Doc): Doc {
  if (!projection || !Object.keys(projection).length) return structuredClone(doc)
  const include = Object.entries(projection).filter(([k, v]) => k !== '_id' && v).map(([k]) => k)
  const out: Doc = {}
  if (include.length) {
    if (projection._id !== 0 && projection._id !== false) out._id = doc._id
    for (const k of include) if (get(doc, k) !== undefined) set(out, k, structuredClone(get(doc, k)))
    return out
  }
  const copy = structuredClone(doc)
  for (const [k, v] of Object.entries(projection)) if (!v) delete copy[k]
  return copy
}

function sortDocs(docs: Doc[], spec: Doc): Doc[] {
  return [...docs].sort((a, b) => {
    for (const [k, dir] of Object.entries(spec)) {
      const c = cmp(get(a, k), get(b, k))
      if (c) return c * (dir as number)
    }
    return 0
  })
}

function evalExpr(doc: Doc, e: unknown): unknown {
  if (typeof e === 'string' && e.startsWith('$')) return get(doc, e.slice(1))
  if (e && typeof e === 'object' && !Array.isArray(e)) {
    const [op, arg] = Object.entries(e as Doc)[0]
    const args = Array.isArray(arg) ? arg.map((a) => evalExpr(doc, a)) : [evalExpr(doc, arg)]
    switch (op) {
      case '$multiply': return (args as number[]).reduce((x, y) => x * y, 1)
      case '$add': return (args as number[]).reduce((x, y) => x + y, 0)
      case '$subtract': return (args[0] as number) - (args[1] as number)
      case '$concat': return args.join('')
      case '$toUpper': return String(args[0]).toUpperCase()
      case '$size': return (args[0] as unknown[]).length
      default: return Object.fromEntries(Object.entries(e as Doc).map(([k, v]) => [k, evalExpr(doc, v)]))
    }
  }
  return e
}

function group(docs: Doc[], spec: Doc): Doc[] {
  const groups = new Map<string, { _id: unknown; docs: Doc[] }>()
  for (const d of docs) {
    const id = evalExpr(d, spec._id)
    const key = JSON.stringify(id ?? null)
    if (!groups.has(key)) groups.set(key, { _id: id ?? null, docs: [] })
    groups.get(key)!.docs.push(d)
  }
  return [...groups.values()].map(({ _id, docs: ds }) => {
    const out: Doc = { _id }
    for (const [field, acc] of Object.entries(spec)) {
      if (field === '_id') continue
      const [op, expr] = Object.entries(acc as Doc)[0]
      const vals = ds.map((d) => evalExpr(d, expr))
      switch (op) {
        case '$sum': out[field] = vals.reduce<number>((s, v) => s + (typeof v === 'number' ? v : 0), 0); break
        case '$avg': { const nums = vals.filter((v) => typeof v === 'number') as number[]; out[field] = nums.length ? nums.reduce((s, v) => s + v, 0) / nums.length : null; break }
        case '$min': out[field] = vals.reduce((m, v) => (m === undefined || cmp(v, m) < 0 ? v : m), undefined); break
        case '$max': out[field] = vals.reduce((m, v) => (m === undefined || cmp(v, m) > 0 ? v : m), undefined); break
        case '$push': out[field] = vals; break
        case '$addToSet': out[field] = vals.filter((v, i) => vals.findIndex((w) => eq(v, w)) === i); break
        case '$first': out[field] = vals[0]; break
        case '$last': out[field] = vals[vals.length - 1]; break
        case '$count': out[field] = vals.length; break
        default: throw new Error(`Unsupported accumulator ${op}`)
      }
    }
    return out
  })
}

class Cursor {
  // Like the driver: sort, skip and limit apply first, the projection last.
  constructor(private docs: Doc[], private projection?: Doc) {}
  sort(spec: Doc) { this.docs = sortDocs(this.docs, spec); return this }
  limit(n: number) { this.docs = this.docs.slice(0, n); return this }
  skip(n: number) { this.docs = this.docs.slice(n); return this }
  project(p: Doc) { this.projection = p; return this }
  async toArray() { return this.docs.map((d) => project(d, this.projection)) }
}

export class Collection {
  docs: Doc[]
  constructor(docs: Doc[] = []) {
    this.docs = docs.map((d) => ({ _id: d._id ?? newId(), ...structuredClone(d) }))
  }
  find(filter: Filter = {}, options: { projection?: Doc } = {}) {
    return new Cursor(this.docs.filter((d) => matches(d, filter)), options.projection)
  }
  async findOne(filter: Filter = {}, options: { projection?: Doc } = {}) {
    const d = this.docs.find((x) => matches(x, filter))
    return d ? project(d, options.projection) : null
  }
  async insertOne(doc: Doc) {
    const d = { _id: doc._id ?? newId(), ...structuredClone(doc) }
    this.docs.push(d)
    return { acknowledged: true, insertedId: d._id }
  }
  async insertMany(docs: Doc[]) {
    const ids = []
    for (const d of docs) ids.push((await this.insertOne(d)).insertedId)
    return { acknowledged: true, insertedCount: ids.length, insertedIds: ids }
  }
  private async update(filter: Filter, update: Doc, many: boolean, upsert = false) {
    let matchedCount = 0
    this.docs = this.docs.map((d) => {
      if ((!many && matchedCount) || !matches(d, filter)) return d
      matchedCount++
      return applyUpdate(d, update)
    })
    if (!matchedCount && upsert) {
      const base: Doc = {}
      for (const [k, v] of Object.entries(filter)) if (!k.startsWith('$') && (typeof v !== 'object' || v === null)) set(base, k, v)
      const { insertedId } = await this.insertOne(applyUpdate(base, update))
      return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedId: insertedId }
    }
    return { acknowledged: true, matchedCount, modifiedCount: matchedCount, upsertedId: null }
  }
  updateOne(filter: Filter, update: Doc, options: { upsert?: boolean } = {}) { return this.update(filter, update, false, options.upsert) }
  updateMany(filter: Filter, update: Doc) { return this.update(filter, update, true) }
  async deleteOne(filter: Filter = {}) {
    const i = this.docs.findIndex((d) => matches(d, filter))
    if (i >= 0) this.docs.splice(i, 1)
    return { acknowledged: true, deletedCount: i >= 0 ? 1 : 0 }
  }
  async deleteMany(filter: Filter = {}) {
    const before = this.docs.length
    this.docs = this.docs.filter((d) => !matches(d, filter))
    return { acknowledged: true, deletedCount: before - this.docs.length }
  }
  async countDocuments(filter: Filter = {}) {
    return this.docs.filter((d) => matches(d, filter)).length
  }
  /** Records the pipelines run, so lessons can check the stage order. */
  pipelines: Doc[][] = []
  aggregate(pipeline: Doc[]) {
    this.pipelines.push(pipeline)
    let docs = this.docs.map((d) => structuredClone(d))
    for (const stage of pipeline) {
      const [op, arg] = Object.entries(stage)[0]
      switch (op) {
        case '$match': docs = docs.filter((d) => matches(d, arg as Filter)); break
        case '$group': docs = group(docs, arg as Doc); break
        case '$sort': docs = sortDocs(docs, arg as Doc); break
        case '$limit': docs = docs.slice(0, arg as number); break
        case '$skip': docs = docs.slice(arg as number); break
        case '$count': docs = [{ [arg as string]: docs.length }]; break
        case '$unwind': {
          const path = String(arg).replace(/^\$/, '')
          docs = docs.flatMap((d) => ((get(d, path) as unknown[]) ?? []).map((v) => { const c = structuredClone(d); set(c, path, v); return c }))
          break
        }
        case '$project':
          docs = docs.map((d) => {
            const spec = arg as Doc
            const computed = Object.entries(spec).filter(([, v]) => typeof v === 'object' || typeof v === 'string')
            const base = project(d, Object.fromEntries(Object.entries(spec).filter(([, v]) => typeof v === 'number' || typeof v === 'boolean')))
            for (const [k, v] of computed) set(base, k, evalExpr(d, v))
            return base
          })
          break
        case '$lookup': {
          const { from, localField, foreignField, as } = arg as Record<string, string>
          const other = currentDb?.collection(from).docs ?? []
          docs = docs.map((d) => ({ ...d, [as]: other.filter((o) => eq(get(o, foreignField), get(d, localField))).map((o) => structuredClone(o)) }))
          break
        }
        default: throw new Error(`Unsupported stage ${op}`)
      }
    }
    return new Cursor(docs)
  }
  async createIndex(spec: Doc) {
    this.indexes.push(spec)
    return Object.entries(spec).map(([k, v]) => `${k}_${v}`).join('_')
  }
  indexes: Doc[] = []
}

let currentDb: ReturnType<typeof createDb> | undefined

/** `const db = createDb({ users: [...] })`; `db.collection('users')`. */
export function createDb(seed: Record<string, Doc[]> = {}) {
  counter = 0
  const cols = new Map(Object.entries(seed).map(([k, v]) => [k, new Collection(v)]))
  const db = {
    collection(name: string) {
      if (!cols.has(name)) cols.set(name, new Collection())
      return cols.get(name)!
    },
  }
  currentDb = db
  return db
}
