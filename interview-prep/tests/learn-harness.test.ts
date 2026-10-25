import { parseHTML } from 'linkedom'
import initSqlJs from 'sql.js'
import { describe, expect, it } from 'vitest'
import { cssValue, dockerInstructions, runStep, type HarnessEnv, type StepInput } from '@/lib/learn/harness'

const env: HarnessEnv = { parseHTML: (h) => parseHTML(h) as unknown as { document: Document }, sql: () => initSqlJs() as never }
const run = (input: Partial<StepInput> & Pick<StepInput, 'kind' | 'code'>) => runStep({ tests: [], ...input }, env)
const passes = (o: Awaited<ReturnType<typeof run>>) => o.results.map((r) => (r.pass ? 'ok' : `FAIL ${r.message}`))

describe('learn harness', () => {
  it('runs JavaScript checks against the learner code, one result each', async () => {
    const tests: [string, string][] = [['adds', 'expect(add(2, 3)).toBe(5)'], ['negative', 'expect(add(-1, 1)).toBe(0)']]
    expect(passes(await run({ kind: 'js', code: 'function add(a, b) { return a + b }', tests }))).toEqual(['ok', 'ok'])
    const wrong = await run({ kind: 'js', code: 'function add(a, b) { return a - b }', tests })
    expect(wrong.results[0]).toMatchObject({ pass: false, message: 'expected -1 to be 5' })
  })

  it('reports syntax errors, crashes and console output', async () => {
    expect((await run({ kind: 'js', code: 'function (' })).error).toMatch(/SyntaxError/)
    expect((await run({ kind: 'js', code: 'null.x' })).error).toMatch(/TypeError/)
    expect((await run({ kind: 'js', code: 'console.log("hi", { a: 1 })' })).logs).toEqual(['hi {"a":1}'])
  })

  it('stops a check whose promise never settles', async () => {
    const o = await run({ kind: 'js', code: 'const wait = () => new Promise(() => {})', tests: [['waits', 'await wait()']] })
    expect(o.results[0].message).toMatch(/took too long/)
  })

  it('compiles TypeScript, ES modules and JSX', async () => {
    const o = await run({ kind: 'js', typescript: true, jsx: true, code: 'export function hi(name: string): string { return `Hi ${name}` }\nexport const El = () => <b>x</b>', tests: [['exports', 'expect(module.exports.hi("Ada")).toBe("Hi Ada")'], ['jsx', 'expect(render(El).text()).toBe("x")']] })
    expect(passes(o)).toEqual(['ok', 'ok'])
  })

  it('renders React components with state, effects, lists and forms', async () => {
    const code = `import { useState, useEffect } from 'react'
export function Counter({ start = 0 }) {
  const [n, setN] = useState(start)
  const [title, setTitle] = useState('')
  useEffect(() => { setTitle('Count ' + n) }, [n])
  return <div><h1>{title}</h1><button onClick={() => setN(n + 1)}>Add</button><ul>{[1, 2].map((x) => <li>{x}</li>)}</ul></div>
}
export function Form({ onSave }) {
  const [v, setV] = useState('')
  return <form onSubmit={(e) => { e.preventDefault(); onSave(v) }}><input value={v} onChange={(e) => setV(e.target.value)} /><button>Save</button></form>
}`
    const tests: [string, string][] = [
      ['counts', 'const ui = render(Counter, { start: 2 }); expect(ui.getByRole("heading").children.join("")).toBe("Count 2"); ui.click(ui.getByText("Add")); expect(ui.getByRole("heading").children.join("")).toBe("Count 3")'],
      ['warns about keys', 'expect(render(Counter).warnings[0]).toMatch(/key/)'],
      ['form', 'const save = fn(); const ui = render(Form, { onSave: save }); ui.type(ui.getByRole("textbox"), "Ada"); ui.click(ui.getByText("Save")); expect(save).toHaveBeenCalledWith("Ada")'],
    ]
    expect(passes(await run({ kind: 'js', jsx: true, code, tests }))).toEqual(['ok', 'ok', 'ok'])
  })

  it('serves requests through the mini Express', async () => {
    const code = `import express from 'express'
export const app = express()
app.use(express.json())
const users = express.Router()
users.get('/:id', (req, res) => res.json({ id: Number(req.params.id), q: req.query.q }))
users.post('/', (req, res) => res.status(201).json(req.body))
app.use('/users', users)
app.get('/boom', async () => { throw new Error('nope') })
app.use((err, req, res, next) => res.status(500).json({ error: err.message }))`
    const tests: [string, string][] = [
      ['params', 'const r = await request(app).get("/users/7?q=x"); expect(r).toMatchObject({ status: 200, body: { id: 7, q: "x" } })'],
      ['json body', 'const r = await request(app).post("/users", { name: "Ada" }); expect(r.status).toBe(201); expect(r.body).toEqual({ name: "Ada" })'],
      ['errors', 'const r = await request(app).get("/boom"); expect(r).toMatchObject({ status: 500, body: { error: "nope" } })'],
      ['404', 'expect((await request(app).get("/nope")).status).toBe(404)'],
    ]
    expect(passes(await run({ kind: 'js', code, tests }))).toEqual(['ok', 'ok', 'ok', 'ok'])
  })

  it('queries the mini MongoDB', async () => {
    const setup = 'const db = createDb({ users: [{ name: "Ada", age: 36, tags: ["math"] }, { name: "Bob", age: 20, tags: [] }, { name: "Cy", age: 41, tags: ["math", "art"] }] })'
    const code = `async function adults() { return db.collection('users').find({ age: { $gte: 30 } }, { projection: { _id: 0, name: 1 } }).sort({ age: -1 }).toArray() }
async function byTag() { return db.collection('users').aggregate([{ $unwind: '$tags' }, { $group: { _id: '$tags', n: { $sum: 1 } } }, { $sort: { _id: 1 } }]).toArray() }`
    const tests: [string, string][] = [
      ['find', 'expect(await adults()).toEqual([{ name: "Cy" }, { name: "Ada" }])'],
      ['aggregate', 'expect(await byTag()).toEqual([{ _id: "art", n: 1 }, { _id: "math", n: 2 }])'],
      ['update', 'await db.collection("users").updateOne({ name: "Bob" }, { $inc: { age: 1 }, $push: { tags: "new" } }); expect(await db.collection("users").findOne({ name: "Bob" }, { projection: { _id: 0 } })).toEqual({ name: "Bob", age: 21, tags: ["new"] })'],
      ['needs operators', 'await expect(db.collection("users").updateOne({}, { name: "x" })).rejects.toMatch(/atomic/)'],
    ]
    expect(passes(await run({ kind: 'js', code, setup, tests }))).toEqual(['ok', 'ok', 'ok', 'ok'])
  })

  it('checks HTML structure and CSS declarations', async () => {
    const html = '<!doctype html><html lang="en"><head><style>.card { display: flex; gap: 8px }\n@media (min-width: 768px) { .card { gap: 16px } }</style></head><body><nav><a href="/">Home</a></nav></body></html>'
    const tests: [string, string][] = [['nav', 'expect($("nav a").textContent).toBe("Home")'], ['lang', 'expect(document.documentElement.getAttribute("lang")).toBe("en")'], ['css', 'expect(css(".card", "display")).toBe("flex"); expect(css(".card", "gap", "min-width: 768px")).toBe("16px")']]
    expect(passes(await run({ kind: 'html', code: html, tests }))).toEqual(['ok', 'ok', 'ok'])
    expect(cssValue('a, .b { color: red } .b { color: blue }', '.b', 'color')).toBe('blue')
  })

  it('runs SQL and compares with a reference query', async () => {
    const setup = 'CREATE TABLE t (id INTEGER, n TEXT); INSERT INTO t VALUES (1, "a"), (2, "b");'
    const tests: [string, string][] = [['same rows', 'expect(result.rows).toEqual(reference("SELECT n FROM t WHERE id = 2").rows)']]
    expect(passes(await run({ kind: 'sql', code: 'SELECT n FROM t WHERE id = 2;', setup, tests }))).toEqual(['ok'])
    expect((await run({ kind: 'sql', code: 'SELEC x', setup, tests })).error).toMatch(/SQL error/)
  })

  it('grades tests the learner writes: pass on correct code, catch each bug', async () => {
    const setup = '{ name: "isEven", correct: (n) => n % 2 === 0, bugs: { "always true": () => true, "odd instead": (n) => n % 2 === 1 } }'
    const good = await run({ kind: 'testing', setup, code: 'test("even", () => { expect(isEven(4)).toBe(true) })\ntest("odd", () => { expect(isEven(3)).toBe(false) })' })
    expect(passes(good)).toEqual(['ok', 'ok', 'ok', 'ok'])
    const weak = await run({ kind: 'testing', setup, code: 'test("even", () => { expect(isEven(4)).toBe(true) })' })
    expect(weak.results.map((r) => r.pass)).toEqual([true, true, false, true])
  })

  it('reads commands and Dockerfiles', async () => {
    expect(dockerInstructions('FROM node:22\n# c\nRUN npm ci \\\n  && echo ok')).toEqual([{ op: 'FROM', args: 'node:22' }, { op: 'RUN', args: 'npm ci && echo ok' }])
    const o = await run({ kind: 'text', code: '# stage\ngit add -A\ngit commit -m "x"', tests: [['two commands', 'expect(lines).toHaveLength(2)']] })
    expect(passes(o)).toEqual(['ok'])
  })
})
