// Exports every /notes/<topic> page as a handwritten-style A4 PDF into public/notes.
//
//   npm run build && npx next start -p 3100   (in another terminal)
//   node scripts/export-notes-pdf.mjs [baseUrl]
//
// Uses Playwright (install it globally or with `npm i -D playwright`) and the
// page's own print stylesheet, so the PDF matches "Print / PDF" in the app.
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

const base = process.argv[2] ?? 'http://localhost:3100'
const out = path.resolve('public/notes')
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

// Topic ids, in curriculum order, from the running notes index.
const html = await (await fetch(`${base}/notes`)).text()
const topics = [...new Set([...html.matchAll(/href="\/notes\/([\w-]+)"/g)].map((m) => m[1]))]
if (topics.length === 0) throw new Error(`No topics found at ${base}/notes — is the server running?`)

await mkdir(out, { recursive: true })
const browser = await chromium.launch()
const context = await browser.newContext()
await context.addInitScript(() => localStorage.setItem('prep-arena:notes:hand', '1'))
for (const id of topics) {
  const page = await context.newPage()
  await page.goto(`${base}/notes/${id}`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  const file = path.join(out, `${id}.pdf`)
  const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' } })
  await writeFile(file, pdf)
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length
  console.log(`${id}.pdf  ${pages} pages  ${(pdf.length / 1024).toFixed(0)} KB`)
  await page.close()
}
await browser.close()
