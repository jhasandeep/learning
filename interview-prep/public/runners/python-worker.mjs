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

// Runs once after Pyodide loads. Tracks callbacks scheduled on the event loop
// so a run only ends once they have all fired (like CPython, which keeps
// running until pending timers and threads finish). Without it, output from
// fire-and-forget tasks, loop.call_later() and threading.Timer was lost.
// threading.Timer is rebuilt on the event loop because there are no threads.
const PRELUDE = `
import asyncio, threading
from pyodide.webloop import WebLoop

_prep_pending = set()
_orig_call_later = WebLoop.call_later

def _prep_call_later(self, delay, callback, *args, context=None):
    box = []
    def run(*a):
        _prep_pending.discard(box[0])
        return callback(*a)
    handle = _orig_call_later(self, delay, run, *args, context=context)
    box.append(handle)
    _prep_pending.add(handle)
    return handle

WebLoop.call_later = _prep_call_later

class _PrepTimer(threading.Timer):
    """threading.Timer on the event loop: the browser has no threads."""
    def start(self):
        self._prep_handle = asyncio.get_event_loop().call_later(max(0, self.interval), self.run)
    def run(self):
        if not self.finished.is_set():
            self.function(*self.args, **self.kwargs)
        self.finished.set()
    def cancel(self):
        self.finished.set()
        handle = getattr(self, "_prep_handle", None)
        if handle is not None:
            handle.cancel()
            _prep_pending.discard(handle)
    def is_alive(self):
        return hasattr(self, "_prep_handle") and not self.finished.is_set()
    def join(self, timeout=None):
        pass

threading.Timer = _PrepTimer

def _prep_reset():
    for h in list(_prep_pending):
        h.cancel()
    _prep_pending.clear()

async def _prep_drain():
    """Wait until no scheduled callbacks or unfinished tasks are left."""
    me = asyncio.current_task()
    while True:
        live = [h for h in _prep_pending if not h.cancelled()]
        tasks = [t for t in asyncio.all_tasks() if t is not me and not t.done()]
        if not live and not tasks:
            return
        await asyncio.sleep(0.005)
`

async function load() {
  const py = await loadPyodide({ indexURL: '/vendor/pyodide/' })
  py.setStdout(writer('stdout'))
  py.setStderr(writer('stderr'))
  py.runPython(PRELUDE)
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
    py.globals.get('_prep_reset')()
    await py.runPythonAsync(code, { globals, filename: 'main.py' })
    // Keep running while timers, call_later() callbacks or tasks are pending.
    await py.runPythonAsync('await _prep_drain()')
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
