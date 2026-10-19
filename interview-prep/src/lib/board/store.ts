// Saved boards live in IndexedDB (scenes with PDF pages can be several MB,
// too big for localStorage). One record per board id.
export interface SavedBoard {
  elements: readonly unknown[]
  files: Record<string, unknown>
  viewBackgroundColor?: string
  updatedAt: number
}

const DB = 'prep-arena-boards'
const STORE = 'boards'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = run(db.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

export const loadBoard = (id: string) => tx<SavedBoard | undefined>('readonly', (s) => s.get(id))
export const saveBoard = (id: string, board: SavedBoard) => tx('readwrite', (s) => s.put(board, id))
export const deleteBoard = (id: string) => tx('readwrite', (s) => s.delete(id))
export const savedBoardIds = () => tx<IDBValidKey[]>('readonly', (s) => s.getAllKeys()).then((k) => k.map(String))
