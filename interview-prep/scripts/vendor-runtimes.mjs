// Copies the in-browser language runtimes (Pyodide, webR, sql.js) from
// node_modules into public/vendor so the compiler is fully self-hosted:
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
]

rmSync(out(''), { recursive: true, force: true })
for (const [from, to] of COPIES) {
  if (!existsSync(from)) throw new Error(`Missing ${from} — run npm install`)
  mkdirSync(dirname(to), { recursive: true })
  cpSync(from, to, { recursive: true })
}
console.log(`vendored ${COPIES.length} runtime files into public/vendor`)
