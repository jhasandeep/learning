import { useSyncExternalStore } from 'react'
import { cloneTree, newId, node, type UNode, type UserMap } from './user-mindmap'

// Your mind maps live in localStorage, separate from progress (they are
// content, and can get large). Same pattern as lib/progress.ts.

const KEY = 'prep-arena:mindmaps:v1'
const EMPTY: UserMap[] = []

let state: UserMap[] = EMPTY
let loaded = false
const listeners = new Set<() => void>()

function load(): UserMap[] {
  if (loaded) return state
  loaded = true
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    state = Array.isArray(parsed) ? parsed.filter((m) => m && typeof m.id === 'string' && m.root) : EMPTY
  } catch {
    state = EMPTY
  }
  return state
}

function commit(next: UserMap[]): boolean {
  state = next
  let saved = true
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    saved = false // storage full or blocked: keep working in memory for this session
  }
  listeners.forEach((l) => l())
  return saved
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false
      load()
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** Every saved map, most recently edited first. `null` until the browser copy is read. */
export function useUserMaps(): UserMap[] | null {
  const maps = useSyncExternalStore(subscribe, load, () => null)
  return maps
}

export function getUserMap(id: string): UserMap | undefined {
  return load().find((m) => m.id === id)
}

export function createUserMap(title: string, root: UNode = node(title)): UserMap {
  const now = new Date().toISOString()
  const map: UserMap = { id: newId(), title, root, created: now, updated: now }
  commit([map, ...load()])
  return map
}

/** Saves a map's new tree or title; returns false if the browser refused to store it. */
export function saveUserMap(id: string, patch: Partial<Pick<UserMap, 'title' | 'root'>>): boolean {
  const maps = load()
  const i = maps.findIndex((m) => m.id === id)
  if (i < 0) return false
  const next = { ...maps[i], ...patch, updated: new Date().toISOString() }
  return commit([next, ...maps.slice(0, i), ...maps.slice(i + 1)])
}

export function duplicateUserMap(id: string): UserMap | undefined {
  const m = getUserMap(id)
  return m ? createUserMap(`${m.title} (copy)`, cloneTree(m.root)) : undefined
}

export function deleteUserMap(id: string) {
  commit(load().filter((m) => m.id !== id))
}
