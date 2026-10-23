// Messages between the compiler UI and the in-browser runtime workers.

export type Stream = 'stdout' | 'stderr' | 'stdin' | 'system'

export interface SqlTable { columns: string[]; rows: (string | number | null)[][] }
export type SqlItem = { kind: 'table'; table: SqlTable; sql: string } | { kind: 'message'; text: string; sql: string }
export interface SqlSchemaTable { name: string; columns: { name: string; type: string }[]; rows: number }

export interface MongoStep { code: string; kind: 'value' | 'log' | 'error' | 'info'; text: string }
export interface MongoCollectionInfo { name: string; count: number; fields: string[]; indexes: number }
export interface MongoCheckResult { pass: boolean; detail: string }

export type WorkerEvent =
  | { type: 'loading'; text: string }
  | { type: 'started' }
  | { type: 'output'; stream: Stream; text: string }
  | { type: 'sql'; items: SqlItem[]; schema: SqlSchemaTable[] }
  | { type: 'mongo'; steps: MongoStep[]; collections: MongoCollectionInfo[] }
  | { type: 'check'; result: MongoCheckResult }
  | { type: 'done'; exitCode: number; ms: number }

export interface WorkerRequest {
  id: number
  code: string
  stdin: string
  /** Runtime-specific action, e.g. resetting the SQL database. */
  action?: 'run' | 'reset' | 'check'
  /** Extra JSON for an action (the MongoDB challenge to check against). */
  payload?: string
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
  onMongo?: (steps: MongoStep[], collections: MongoCollectionInfo[]) => void
  onCheck?: (result: MongoCheckResult) => void
  onImage?: (dataUrl: string) => void
}
