import { useSyncExternalStore } from 'react'
import { dayKey } from './srs'

// Today's date as YYYY-MM-DD, read only in the browser. During prerendering
// (and the hydration pass) it is '' so the static HTML never bakes in the
// build date; components treat '' as "not known yet".
function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 60_000)
  return () => clearInterval(id)
}

export function useToday(): string {
  return useSyncExternalStore(subscribe, () => dayKey(), () => '')
}
