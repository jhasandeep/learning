// Copies the in-browser runtimes (Pyodide, webR, sql.js, plus the whiteboard's
// Excalidraw fonts and pdf.js worker) from node_modules into public/vendor, so
// the app is fully self-hosted:
// no third-party CDN at runtime. Runs on postinstall / predev / prebuild.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const nm = (p) => join(root, 'node_modules', p)
const out = (p) => join(root, 'public', 'vendor', p)

const COPIES = [
  // Pyodide core + Python standard library (no extra packages)
  ...['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'].map((f) => [nm(`pyodide/${f}`), out(`pyodide/${f}`)]),
  // webR: R compiled to WebAssembly, plus its virtual filesystem
  ...['webr.js', 'webr-worker.js', 'R.js', 'R.wasm', 'libRblas.so', 'libRlapack.so', 'vfs'].map((f) => [nm(`webr/dist/${f}`), out(`webr/${f}`)]),
  // sql.js: SQLite compiled to WebAssembly
  ...['sql-wasm-browser.wasm'].map((f) => [nm(`sql.js/dist/${f}`), out(`sqljs/${f}`)]),
  // Whiteboard: Excalidraw's hand-drawn fonts and the pdf.js worker
  [nm('@excalidraw/excalidraw/dist/prod/fonts'), out('excalidraw/fonts')],
  [nm('pdfjs-dist/legacy/build/pdf.worker.min.mjs'), out('pdfjs/pdf.worker.min.mjs')],
]

rmSync(out(''), { recursive: true, force: true })
for (const [from, to] of COPIES) {
  if (!existsSync(from)) throw new Error(`Missing ${from} — run npm install`)
  mkdirSync(dirname(to), { recursive: true })
  cpSync(from, to, { recursive: true })
}
console.log(`vendored ${COPIES.length} runtime files and folders into public/vendor`)
