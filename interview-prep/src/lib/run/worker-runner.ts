import type { RunHandlers, RunSummary, WorkerEvent, WorkerRequest } from './protocol'

/**
 * Owns one long-lived worker per runtime (so Pyodide / SQLite load once),
 * streams its events to the UI, and enforces a time limit that starts when
 * the user's code starts (not while the runtime is still downloading).
 * Stopping or timing out terminates the worker; the next run starts fresh.
 */
export class WorkerRunner {
  private worker: Worker | null = null
  private nextId = 1
  private cancel: ((summary: RunSummary) => void) | null = null

  constructor(private readonly create: () => Worker, private readonly timeoutMs: number) {}

  run(req: Omit<WorkerRequest, 'id'>, handlers: RunHandlers): Promise<RunSummary> {
    this.stop()
    const worker = (this.worker ??= this.create())
    const id = this.nextId++
    return new Promise<RunSummary>((resolve) => {
      let timer: ReturnType<typeof setTimeout> | undefined
      const finish = (summary: RunSummary) => {
        clearTimeout(timer)
        worker.removeEventListener('message', onMessage)
        worker.removeEventListener('error', onError)
        this.cancel = null
        resolve(summary)
      }
      const kill = (signal: 'TIMEOUT' | 'STOPPED') => {
        worker.terminate()
        if (this.worker === worker) this.worker = null
        finish({ exitCode: null, ms: 0, signal })
      }
      const onMessage = (e: MessageEvent<WorkerEvent & { id: number }>) => {
        const ev = e.data
        if (ev.id !== id) return
        switch (ev.type) {
          case 'loading': handlers.onLoading?.(ev.text); break
          case 'started': timer = setTimeout(() => kill('TIMEOUT'), this.timeoutMs); break
          case 'output': handlers.onOutput(ev.stream, ev.text); break
          case 'sql': handlers.onSql?.(ev.items, ev.schema); break
          case 'done': finish({ exitCode: ev.exitCode, ms: ev.ms, signal: null }); break
        }
      }
      const onError = (e: ErrorEvent) => {
        handlers.onOutput('stderr', `Runtime failed to load: ${e.message || 'unknown error'}\n`)
        worker.terminate()
        if (this.worker === worker) this.worker = null
        finish({ exitCode: 1, ms: 0, signal: null })
      }
      this.cancel = () => kill('STOPPED')
      worker.addEventListener('message', onMessage)
      worker.addEventListener('error', onError)
      worker.postMessage({ ...req, id } satisfies WorkerRequest)
    })
  }

  stop() {
    this.cancel?.({ exitCode: null, ms: 0, signal: 'STOPPED' })
  }
}
