// Exports the downloadable PDFs in public/notes:
//   <topic>.pdf          the notes page in its handwritten style (print stylesheet)
//   boards/<topic>.pdf   the topic's whiteboard, one page per slide (the app's Export PDF)
//   questions/<set>.pdf  the most-asked interview questions with every answer expanded
//
//   npm run build && npx next start -p 3100   (in another terminal)
//   npm run notes:pdf [-- baseUrl [notes|boards|questions…]]
//
// Uses Playwright (install it globally or with `npm i -D playwright`).
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

const base = process.argv[2] ?? 'http://localhost:3100'
// Optional stages to run (notes, boards, questions); all by default.
const stages = new Set(process.argv.slice(3).length ? process.argv.slice(3) : ['notes', 'boards', 'questions'])
const out = path.resolve('public/notes')
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const { PDFDocument } = await import('pdf-lib')

// Topic ids, in curriculum order, from the running notes index.
const html = await (await fetch(`${base}/notes`)).text()
const topics = [...new Set([...html.matchAll(/href="\/notes\/([\w-]+)"/g)].map((m) => m[1]))]
if (topics.length === 0) throw new Error(`No topics found at ${base}/notes — is the server running?`)

const report = async (file, pdf) => console.log(`${file}  ${(await PDFDocument.load(pdf)).getPageCount()} pages  ${(pdf.length / 1024).toFixed(0)} KB`)

const qHtml = await (await fetch(`${base}/questions`)).text()
const questionSets = [...new Set([...qHtml.matchAll(/href="\/questions\/([\w-]+)"/g)].map((m) => m[1]))]

await mkdir(path.join(out, 'boards'), { recursive: true })
await mkdir(path.join(out, 'questions'), { recursive: true })
const browser = await chromium.launch()

// Handwritten notes pages.
const notes = await browser.newContext()
await notes.addInitScript(() => localStorage.setItem('prep-arena:notes:hand', '1'))
for (const id of stages.has('notes') ? topics : []) {
  const page = await notes.newPage()
  await page.goto(`${base}/notes/${id}`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' } })
  await writeFile(path.join(out, `${id}.pdf`), pdf)
  await report(`${id}.pdf`, pdf)
  await page.close()
}

// Whiteboards: a fresh context per board, so no saved drawings end up in the export.
for (const id of stages.has('boards') ? topics : []) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })
  const page = await context.newPage()
  await page.goto(`${base}/board/${id}`)
  await page.waitForSelector('[data-board-ready]', { timeout: 60_000 })
  await page.evaluate(() => document.fonts.ready)
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 120_000 }), page.getByRole('button', { name: /Export PDF/ }).click()])
  const file = path.join(out, 'boards', `${id}.pdf`)
  await download.saveAs(file)
  await report(`boards/${id}.pdf`, await readFile(file))
  await context.close()
}
// Interview questions (the print stylesheet expands every answer).
const qs = await browser.newContext()
for (const id of stages.has('questions') ? questionSets : []) {
  const page = await qs.newPage()
  await page.goto(`${base}/questions/${id}`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' } })
  await writeFile(path.join(out, 'questions', `${id}.pdf`), pdf)
  await report(`questions/${id}.pdf`, pdf)
  await page.close()
}
await browser.close()
