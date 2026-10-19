// Python runner: Pyodide (CPython compiled to WebAssembly), self-hosted from
// /vendor/pyodide. Served as a plain static ES module so it runs as a true
// module worker (Pyodide refuses bundler-wrapped "classic" workers).
// Protocol: see src/lib/run/protocol.ts.
import { loadPyodide } from '/vendor/pyodide/pyodide.mjs'

let pyodide = null
let currentId = 0

const post = (ev) => self.postMessage({ ...ev, id: currentId })
const out = (stream, text) => post({ type: 'output', stream, text })

function writer(stream) {
  const decoder = new TextDecoder()
  return { write: (buf) => { out(stream, decoder.decode(buf, { stream: true })); return buf.length } }
}

async function load() {
  const py = await loadPyodide({ indexURL: '/vendor/pyodide/' })
  py.setStdout(writer('stdout'))
  py.setStderr(writer('stderr'))
  return py
}

/** Drop Pyodide's own frames from tracebacks so errors read like CPython's. */
function cleanTraceback(message) {
  const lines = message.split('\n')
  const kept = []
  for (let i = 0; i < lines.length; i++) {
    // e.g.  File "/lib/python314.zip/_pyodide/_base.py", line 619, in eval_code_async
    if (/File "\/lib\/python[\d.]+(\.zip)?\/_?pyodide\//.test(lines[i])) {
      while (lines[i + 1]?.startsWith('    ')) i++
      continue
    }
    kept.push(lines[i])
  }
  return kept.join('\n').replaceAll('File "<exec>"', 'File "main.py"')
}

self.onmessage = async (e) => {
  const { id, code, stdin } = e.data
  currentId = id
  if (!pyodide) post({ type: 'loading', text: 'Loading Python (first run only)…' })
  pyodide ??= load()
  let py
  try {
    py = await pyodide
  } catch (err) {
    pyodide = null
    out('stderr', `Could not load Python: ${err?.message ?? err}\n`)
    post({ type: 'done', exitCode: 1, ms: 0 })
    return
  }

  // input() reads the next stdin line; echo it so the output reads like a terminal.
  const lines = stdin === '' ? [] : stdin.replace(/\n$/, '').split('\n')
  let next = 0
  py.setStdin({
    stdin: () => {
      if (next >= lines.length) return undefined
      const value = lines[next++]
      out('stdin', `${value}\n`)
      return value
    },
    isatty: false,
  })

  post({ type: 'started' })
  const start = performance.now()
  let exitCode = 0
  try {
    // Fresh globals for every run, like starting a new interpreter.
    const globals = py.pyimport('builtins').dict()
    await py.runPythonAsync(code, { globals, filename: 'main.py' })
  } catch (err) {
    const message = err?.message ?? String(err)
    if (!/SystemExit: 0\b|SystemExit\s*$/.test(message)) {
      exitCode = 1
      out('stderr', `${cleanTraceback(message).trimEnd()}\n`)
    }
  }
  // Flush any partial line still buffered in sys.stdout / sys.stderr.
  try { py.runPython('import sys; sys.stdout.flush(); sys.stderr.flush()') } catch {}
  post({ type: 'done', exitCode, ms: Math.round(performance.now() - start) })
}
