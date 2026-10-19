/// <reference lib="webworker" />
import initSqlJs, { type Database } from 'sql.js'
import { SAMPLE_DB } from './sample-db'
import type { SqlItem, SqlSchemaTable, WorkerEvent, WorkerRequest } from './protocol'

// SQLite via sql.js (WebAssembly). The database lives in this worker and
// keeps changes between runs until the user resets it.

let db: Promise<Database> | null = null

async function open(): Promise<Database> {
  const SQL = await initSqlJs({ locateFile: (file: string) => `/vendor/sqljs/${file}` })
  const d = new SQL.Database()
  d.exec(SAMPLE_DB)
  return d
}

function schema(d: Database): SqlSchemaTable[] {
  const tables = d.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")[0]?.values ?? []
  return tables.map(([name]) => {
    const quoted = `"${String(name).replaceAll('"', '""')}"`
    const cols = d.exec(`PRAGMA table_info(${quoted})`)[0]?.values ?? []
    const count = d.exec(`SELECT COUNT(*) FROM ${quoted}`)[0]?.values[0]?.[0] ?? 0
    return { name: String(name), columns: cols.map((c) => ({ name: String(c[1]), type: String(c[2] || 'ANY') })), rows: Number(count) }
  })
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, code, action } = e.data
  const post = (ev: WorkerEvent) => self.postMessage({ ...ev, id })
  if (!db) post({ type: 'loading', text: 'Loading SQLite…' })
  if (action === 'reset' && db) {
    ;(await db).close()
    db = null
  }
  db ??= open()
  const d = await db

  post({ type: 'started' })
  const start = performance.now()
  const items: SqlItem[] = []
  let exitCode = 0
  if (action !== 'reset') {
    try {
      // Run statement by statement so each SELECT gets its own table and
      // each write reports how many rows it changed.
      for (const stmt of d.iterateStatements(code)) {
        const sql = stmt.getSQL().trim()
        const columns = stmt.getColumnNames()
        if (columns.length > 0) {
          const rows: (string | number | null)[][] = []
          while (stmt.step()) rows.push(stmt.get().map((v) => (v instanceof Uint8Array ? `<blob ${v.length} bytes>` : v)) as (string | number | null)[])
          items.push({ kind: 'table', table: { columns, rows }, sql })
        } else {
          stmt.step()
          const changed = d.getRowsModified()
          const verb = sql.split(/\s+/)[0]?.toUpperCase() ?? ''
          items.push({ kind: 'message', sql, text: ['INSERT', 'UPDATE', 'DELETE', 'REPLACE'].includes(verb) ? `${changed} row${changed === 1 ? '' : 's'} affected` : `${verb || 'Statement'} OK` })
        }
        stmt.free()
      }
      if (items.length === 0) items.push({ kind: 'message', sql: '', text: 'No statements to run.' })
    } catch (err) {
      exitCode = 1
      post({ type: 'output', stream: 'stderr', text: `${err instanceof Error ? err.message : String(err)}\n` })
    }
  } else {
    items.push({ kind: 'message', sql: '', text: 'Database reset to the sample tables.' })
  }
  post({ type: 'sql', items, schema: schema(d) })
  post({ type: 'done', exitCode, ms: Math.round(performance.now() - start) })
}
