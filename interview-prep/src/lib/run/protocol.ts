// Messages between the compiler UI and the in-browser runtime workers.

export type Stream = 'stdout' | 'stderr' | 'stdin' | 'system'

export interface SqlTable { columns: string[]; rows: (string | number | null)[][] }
export type SqlItem = { kind: 'table'; table: SqlTable; sql: string } | { kind: 'message'; text: string; sql: string }
export interface SqlSchemaTable { name: string; columns: { name: string; type: string }[]; rows: number }

export type WorkerEvent =
  | { type: 'loading'; text: string }
  | { type: 'started' }
  | { type: 'output'; stream: Stream; text: string }
  | { type: 'sql'; items: SqlItem[]; schema: SqlSchemaTable[] }
  | { type: 'done'; exitCode: number; ms: number }

export interface WorkerRequest {
  id: number
  code: string
  stdin: string
  /** Runtime-specific action, e.g. resetting the SQL database. */
  action?: 'run' | 'reset'
}

export interface RunSummary {
  exitCode: number | null
  ms: number
  signal: 'TIMEOUT' | 'STOPPED' | null
}

export interface RunHandlers {
  onLoading?: (text: string) => void
  onOutput: (stream: Stream, text: string) => void
  onSql?: (items: SqlItem[], schema: SqlSchemaTable[]) => void
  onImage?: (dataUrl: string) => void
}
