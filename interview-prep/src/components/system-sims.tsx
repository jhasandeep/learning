'use client'

import { useMemo, useState } from 'react'
import { Button, cx } from '@/components/ui'
import type { SimId } from '@/data/system-design/types'

// Small interactive simulators for the system design lessons. Each one runs the same idea as the lesson's code.

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      {children}
    </div>
  )
}

const Stat = ({ label, value, tone }: { label: string; value: string | number; tone?: 'good' | 'bad' }) => (
  <span className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs">
    <span className="text-muted">{label}</span> <b className={cx('ml-1 font-mono text-sm', tone === 'good' && 'text-good', tone === 'bad' && 'text-bad')}>{value}</b>
  </span>
)

function Slider({ label, min, max, value, onChange, unit = '' }: { label: string; min: number; max: number; value: number; onChange: (n: number) => void; unit?: string }) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <span className="w-44 text-muted">{label}</span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-40 accent-[var(--accent)]" />
      <span className="w-12 font-mono">{value}{unit}</span>
    </label>
  )
}

// ---- load balancer -------------------------------------------------------------------------------------

type Strategy = 'round-robin' | 'least-connections' | 'random'

function LoadBalancerSim() {
  const N = 3
  const [strategy, setStrategy] = useState<Strategy>('round-robin')
  const [slow, setSlow] = useState(true)
  const [state, setState] = useState({ active: [0, 0, 0], total: [0, 0, 0], next: 0, tick: 0 })

  const send = (count: number) =>
    setState((s) => {
      const active = [...s.active]
      const total = [...s.total]
      let next = s.next
      for (let i = 0; i < count; i++) {
        let pick = 0
        if (strategy === 'round-robin') {
          pick = next % N
          next++
        } else if (strategy === 'least-connections') {
          pick = active.indexOf(Math.min(...active))
        } else {
          pick = Math.floor(Math.random() * N)
        }
        active[pick]++
        total[pick]++
      }
      return { ...s, active, total, next }
    })

  const pass = () =>
    setState((s) => {
      const tick = s.tick + 1
      // healthy servers finish 2 requests a second; the slow one finishes 1 every other second
      const active = s.active.map((a, i) => Math.max(0, a - (slow && i === 0 ? (tick % 2 === 0 ? 1 : 0) : 2)))
      return { ...s, active, tick }
    })

  const maxBar = Math.max(8, ...state.active, ...state.total)
  return (
    <Panel title="Load balancer simulator">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2"><span className="text-muted">Strategy</span>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value as Strategy)} className="rounded-lg border border-line bg-surface-2 px-2 py-1">
            <option value="round-robin">Round robin</option>
            <option value="least-connections">Least connections</option>
            <option value="random">Random</option>
          </select>
        </label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} /> Server 1 is slow</label>
      </div>
      <div className="mt-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span className="w-24">Server {i + 1}{slow && i === 0 ? ' 🐢' : ''}</span>
            <div className="flex-1 space-y-1">
              <div className="h-3 rounded bg-surface-2"><div className="h-3 rounded bg-warn transition-all" style={{ width: `${(state.active[i] / maxBar) * 100}%` }} /></div>
              <div className="h-1.5 rounded bg-surface-2"><div className="h-1.5 rounded bg-accent transition-all" style={{ width: `${(state.total[i] / maxBar) * 100}%` }} /></div>
            </div>
            <span className="w-28 text-right font-mono text-xs"><span className="text-warn">{state.active[i]} busy</span> · {state.total[i]} total</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="primary" onClick={() => send(1)}>Send 1 request</Button>
        <Button size="sm" onClick={() => send(6)}>Send 6 requests</Button>
        <Button size="sm" onClick={pass}>1 second passes</Button>
        <Button size="sm" variant="ghost" onClick={() => setState({ active: [0, 0, 0], total: [0, 0, 0], next: 0, tick: 0 })}>Reset</Button>
      </div>
    </Panel>
  )
}

// ---- cache ---------------------------------------------------------------------------------------------

function CacheSim() {
  const KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const [capacity, setCapacity] = useState(3)
  const [policy, setPolicy] = useState<'lru' | 'fifo'>('lru')
  const [cache, setCache] = useState<string[]>([])
  const [stats, setStats] = useState({ hits: 0, misses: 0 })
  const [log, setLog] = useState<string[]>([])

  const request = (key: string, c: string[]): { next: string[]; hit: boolean } => {
    const idx = c.indexOf(key)
    if (idx !== -1) return { next: policy === 'lru' ? [...c.slice(0, idx), ...c.slice(idx + 1), key] : c, hit: true }
    const next = [...c, key]
    while (next.length > capacity) next.shift()
    return { next, hit: false }
  }

  const run = (keys: string[]) => {
    let c = cache
    let hits = stats.hits
    let misses = stats.misses
    const lines: string[] = []
    for (const k of keys) {
      const r = request(k, c)
      c = r.next
      if (r.hit) hits++
      else misses++
      lines.push(`${k}: ${r.hit ? 'hit' : 'MISS'}`)
    }
    setCache(c)
    setStats({ hits, misses })
    setLog((l) => [...lines.reverse(), ...l].slice(0, 12))
  }

  const popular = () => {
    const seq: string[] = []
    let seed = stats.hits * 7 + stats.misses * 13 + 1
    for (let i = 0; i < 20; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      const r = seed % 10
      seq.push(r < 8 ? KEYS[r % 3] : KEYS[3 + (seed >> 4) % 5])
    }
    run(seq)
  }

  const total = stats.hits + stats.misses
  return (
    <Panel title="Cache simulator">
      <div className="space-y-3">
        <Slider label="Cache size (items)" min={1} max={6} value={capacity} onChange={(n) => { setCapacity(n); setCache((c) => c.slice(-n)) }} />
        <label className="flex items-center gap-3 text-sm"><span className="w-44 text-muted">Eviction rule</span>
          <select value={policy} onChange={(e) => setPolicy(e.target.value as 'lru' | 'fifo')} className="rounded-lg border border-line bg-surface-2 px-2 py-1">
            <option value="lru">LRU (drop least recently used)</option>
            <option value="fifo">FIFO (drop the oldest added)</option>
          </select>
        </label>
      </div>
      <p className="mt-4 text-xs text-muted">Ask for an item (the database is slow, the cache is fast):</p>
      <div className="mt-1 flex flex-wrap gap-2">{KEYS.map((k) => <Button key={k} size="sm" onClick={() => run([k])}>{k}</Button>)}
        <Button size="sm" variant="primary" onClick={popular}>20 random requests (A, B, C are popular)</Button>
        <Button size="sm" variant="ghost" onClick={() => { setCache([]); setStats({ hits: 0, misses: 0 }); setLog([]) }}>Reset</Button>
      </div>
      <div className="mt-4">
        <p className="mb-1 text-xs text-muted">Inside the cache (oldest on the left{policy === 'lru' ? ', most recently used on the right' : ''}):</p>
        <div className="flex min-h-10 flex-wrap gap-2">
          {cache.length === 0 ? <span className="text-xs italic text-muted">empty</span> : cache.map((k) => <span key={k} className="grid h-10 w-10 place-items-center rounded-lg border-2 border-accent bg-accent/10 font-mono font-semibold">{k}</span>)}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2"><Stat label="hits" value={stats.hits} tone="good" /><Stat label="misses" value={stats.misses} tone="bad" /><Stat label="hit rate" value={total ? `${Math.round((stats.hits / total) * 100)}%` : '–'} /></div>
      {log.length > 0 && <p className="mt-3 font-mono text-xs text-muted">{log.join('  ·  ')}</p>}
    </Panel>
  )
}

// ---- consistent hashing --------------------------------------------------------------------------------

function fnv(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  // final mixing so that similar keys spread around the whole ring
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b) >>> 0
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35) >>> 0
  h ^= h >>> 16
  return h >>> 0
}

const COLORS = ['#22d3ee', '#f59e0b', '#a78bfa', '#34d399', '#fb7185', '#60a5fa']
const KEYS = Array.from({ length: 30 }, (_, i) => `key${i + 1}`)

function ownerOf(key: string, nodes: string[], vnodes: number): string {
  const ring: [number, string][] = []
  for (const n of nodes) for (let v = 0; v < vnodes; v++) ring.push([fnv(`${n}#${v}`), n])
  ring.sort((a, b) => a[0] - b[0])
  const h = fnv(key)
  const hit = ring.find(([p]) => p >= h) ?? ring[0]
  return hit[1]
}

function HashRingSim() {
  const [count, setCount] = useState(3)
  const [vnodes, setVnodes] = useState(1)
  const [prev, setPrev] = useState(3)
  const names = Array.from({ length: 6 }, (_, i) => `S${i + 1}`)
  const nodes = names.slice(0, count)
  const owners = useMemo(() => KEYS.map((k) => ownerOf(k, nodes, vnodes)), [nodes, vnodes])
  const before = useMemo(() => KEYS.map((k) => ownerOf(k, names.slice(0, prev), vnodes)), [prev, vnodes, names])
  const moved = KEYS.filter((_, i) => owners[i] !== before[i]).length
  const movedModulo = KEYS.filter((k) => fnv(k) % prev !== fnv(k) % count).length
  const R = 21
  // rounded so the server and the browser print identical numbers
  const pos = (h: number, r: number): [number, number] => [Math.round((50 + r * Math.cos((h / 2 ** 32) * 2 * Math.PI - Math.PI / 2)) * 100) / 100, Math.round((28 + r * Math.sin((h / 2 ** 32) * 2 * Math.PI - Math.PI / 2)) * 100) / 100]

  const change = (n: number) => {
    setPrev(count)
    setCount(n)
  }
  const perServer = nodes.map((n) => owners.filter((o) => o === n).length)

  return (
    <Panel title="Consistent hashing ring">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,240px)]">
        <svg viewBox="0 0 100 56" className="w-full rounded-xl bg-surface-2" role="img" aria-label="A ring with servers and keys placed around it">
          <circle cx="50" cy="28" r={R} fill="none" stroke="var(--line-strong)" strokeWidth="0.4" />
          {nodes.flatMap((n, ni) => Array.from({ length: vnodes }, (_, v) => {
            const [x, y] = pos(fnv(`${n}#${v}`), R)
            return <rect key={`${n}${v}`} x={x - 1.6} y={y - 1.6} width="3.2" height="3.2" rx="0.6" fill={COLORS[ni]} stroke="var(--surface)" strokeWidth="0.4" />
          }))}
          {KEYS.map((k, i) => {
            const [x, y] = pos(fnv(k), R - 4.5)
            return <circle key={k} cx={x} cy={y} r="1" fill={COLORS[names.indexOf(owners[i])]} opacity="0.9" />
          })}
          <text x="50" y="27" textAnchor="middle" fontSize="2.6" fill="var(--muted)">squares = servers</text>
          <text x="50" y="31" textAnchor="middle" fontSize="2.6" fill="var(--muted)">dots = keys</text>
        </svg>
        <div className="space-y-3 text-sm">
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={() => change(Math.min(6, count + 1))} disabled={count >= 6}>Add a server</Button>
            <Button size="sm" onClick={() => change(Math.max(2, count - 1))} disabled={count <= 2}>Remove one</Button>
          </div>
          <Slider label="Virtual nodes" min={1} max={20} value={vnodes} onChange={setVnodes} />
          <ul className="space-y-1">{nodes.map((n, i) => <li key={n} className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: COLORS[i] }} /> {n}: <b className="font-mono">{perServer[i]}</b> keys</li>)}</ul>
          <div className="space-y-1.5">
            <Stat label="moved (ring)" value={`${moved} / ${KEYS.length}`} tone="good" />
            <Stat label="moved (hash % n)" value={`${movedModulo} / ${KEYS.length}`} tone="bad" />
          </div>
        </div>
      </div>
    </Panel>
  )
}

// ---- rate limiter --------------------------------------------------------------------------------------

function RateLimiterSim() {
  const [capacity, setCapacity] = useState(5)
  const [rate, setRate] = useState(1)
  const [tokens, setTokens] = useState(5)
  const [time, setTime] = useState(0)
  const [log, setLog] = useState<string[]>([])

  const send = (n: number) => {
    let t = tokens
    const lines: string[] = []
    for (let i = 0; i < n; i++) {
      if (t >= 1) {
        t -= 1
        lines.push('allowed')
      } else lines.push('REJECTED (429)')
    }
    setTokens(t)
    setLog((l) => [...lines.reverse(), ...l].slice(0, 14))
  }
  const wait = () => {
    setTime((x) => x + 1)
    setTokens((t) => Math.min(capacity, t + rate))
  }

  return (
    <Panel title="Token bucket simulator">
      <div className="space-y-2">
        <Slider label="Bucket size (burst)" min={1} max={10} value={capacity} onChange={(n) => { setCapacity(n); setTokens((t) => Math.min(t, n)) }} />
        <Slider label="Refill per second" min={1} max={5} value={rate} onChange={setRate} />
      </div>
      <div className="mt-4">
        <p className="mb-1 text-xs text-muted">Tokens in the bucket (each request costs one):</p>
        <div className="flex flex-wrap gap-1.5">{Array.from({ length: capacity }, (_, i) => <span key={i} className={cx('h-7 w-7 rounded-full border-2', i < Math.floor(tokens) ? 'border-accent bg-accent/30' : 'border-line')} />)}</div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="primary" onClick={() => send(1)}>Send a request</Button>
        <Button size="sm" onClick={() => send(10)}>Burst of 10</Button>
        <Button size="sm" onClick={wait}>1 second passes</Button>
        <Button size="sm" variant="ghost" onClick={() => { setTokens(capacity); setTime(0); setLog([]) }}>Reset</Button>
        <Stat label="time" value={`${time}s`} />
      </div>
      {log.length > 0 && <p className="mt-3 font-mono text-xs text-muted">{log.join('  ·  ')}</p>}
    </Panel>
  )
}

// ---- queue ---------------------------------------------------------------------------------------------

function QueueSim() {
  const [produce, setProduce] = useState(6)
  const [consumers, setConsumers] = useState(2)
  const [depth, setDepth] = useState<number[]>([0])

  const step = (n: number) =>
    setDepth((d) => {
      let cur = d[d.length - 1]
      const out = [...d]
      for (let i = 0; i < n; i++) {
        cur = Math.max(0, cur + produce - consumers * 2)
        out.push(cur)
      }
      return out.slice(-30)
    })

  const now = depth[depth.length - 1]
  const max = Math.max(10, ...depth)
  return (
    <Panel title="Queue simulator">
      <div className="space-y-2">
        <Slider label="Messages arriving / second" min={1} max={12} value={produce} onChange={setProduce} />
        <Slider label="Consumers (2 msgs/s each)" min={1} max={8} value={consumers} onChange={setConsumers} />
      </div>
      <div className="mt-4 flex h-24 items-end gap-0.5 rounded-xl bg-surface-2 p-2" aria-label="Queue length over time">
        {depth.map((d, i) => <div key={i} className={cx('w-full rounded-sm', d > 20 ? 'bg-bad' : 'bg-accent')} style={{ height: `${Math.max(2, (d / max) * 100)}%` }} />)}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="primary" onClick={() => step(1)}>1 second</Button>
        <Button size="sm" onClick={() => step(10)}>10 seconds</Button>
        <Button size="sm" variant="ghost" onClick={() => setDepth([0])}>Reset</Button>
        <Stat label="waiting" value={now} tone={now > 20 ? 'bad' : undefined} />
        <Stat label="drain speed" value={`${consumers * 2}/s`} />
      </div>
      <p className="mt-2 text-xs text-muted">{produce > consumers * 2 ? 'Messages arrive faster than they are processed: the backlog keeps growing. Add consumers.' : 'The consumers keep up: the queue stays short.'}</p>
    </Panel>
  )
}

// ---- circuit breaker -----------------------------------------------------------------------------------

function BreakerSim() {
  const THRESHOLD = 3
  const TIMEOUT = 5
  const [healthy, setHealthy] = useState(false)
  const [s, setS] = useState({ state: 'CLOSED' as 'CLOSED' | 'OPEN' | 'HALF-OPEN', fails: 0, openedAt: 0, now: 0 })
  const [log, setLog] = useState<string[]>([])
  const push = (m: string) => setLog((l) => [m, ...l].slice(0, 10))

  const call = () => {
    let { state, fails } = s
    const { openedAt, now } = s
    if (state === 'OPEN' && now - openedAt >= TIMEOUT) state = 'HALF-OPEN'
    if (state === 'OPEN') {
      push('rejected instantly (breaker open)')
      return
    }
    if (healthy) {
      push(state === 'HALF-OPEN' ? 'trial call worked: breaker CLOSED' : 'call worked')
      setS({ ...s, state: 'CLOSED', fails: 0 })
      return
    }
    fails += 1
    if (state === 'HALF-OPEN' || fails >= THRESHOLD) {
      push(state === 'HALF-OPEN' ? 'trial call failed: breaker OPEN again' : `failure ${fails}: breaker OPEN`)
      setS({ ...s, state: 'OPEN', fails, openedAt: now })
      return
    }
    push(`call failed (${fails} in a row)`)
    setS({ ...s, state, fails })
  }

  const colour = s.state === 'CLOSED' ? 'bg-good' : s.state === 'OPEN' ? 'bg-bad' : 'bg-warn'
  const remaining = s.state === 'OPEN' ? Math.max(0, TIMEOUT - (s.now - s.openedAt)) : 0
  return (
    <Panel title="Circuit breaker simulator">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className={cx('rounded-full px-3 py-1 text-xs font-bold text-white', colour)}>{s.state === 'OPEN' && remaining === 0 ? 'OPEN (ready to test)' : s.state}</span>
        <Stat label="failures in a row" value={`${s.fails} / ${THRESHOLD}`} />
        {s.state === 'OPEN' && <Stat label="tries again in" value={`${remaining}s`} />}
        <label className="ml-auto flex items-center gap-2"><input type="checkbox" checked={healthy} onChange={(e) => setHealthy(e.target.checked)} /> The other service is healthy</label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="primary" onClick={call}>Call the service</Button>
        <Button size="sm" onClick={() => setS((c) => ({ ...c, now: c.now + 1 }))}>1 second passes</Button>
        <Button size="sm" onClick={() => setS((c) => ({ ...c, now: c.now + 5 }))}>5 seconds pass</Button>
        <Button size="sm" variant="ghost" onClick={() => { setS({ state: 'CLOSED', fails: 0, openedAt: 0, now: 0 }); setLog([]) }}>Reset</Button>
      </div>
      {log.length > 0 && <ul className="mt-3 space-y-0.5 font-mono text-xs text-muted">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>}
    </Panel>
  )
}

// ---- URL shortener estimate ----------------------------------------------------------------------------

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
function base62(n: number): string {
  if (n === 0) return '0'
  let out = ''
  while (n > 0) {
    out = ALPHABET[n % 62] + out
    n = Math.floor(n / 62)
  }
  return out
}

function ShortenerSim() {
  const [perDay, setPerDay] = useState(100) // millions
  const [ratio, setRatio] = useState(100)
  const [years, setYears] = useState(5)
  const [id, setId] = useState(125)
  const writes = (perDay * 1e6) / 86400
  const reads = writes * ratio
  const total = perDay * 1e6 * 365 * years
  const length = Math.max(1, Math.ceil(Math.log(total) / Math.log(62)))
  const storageTb = (total * 500) / 1e12
  const fmt = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n.toFixed(0))
  return (
    <Panel title="Back-of-the-envelope calculator">
      <div className="space-y-2">
        <Slider label="New short links / day" min={1} max={500} value={perDay} onChange={setPerDay} unit="M" />
        <Slider label="Reads per write" min={1} max={500} value={ratio} onChange={setRatio} unit="×" />
        <Slider label="Keep links for" min={1} max={10} value={years} onChange={setYears} unit=" yr" />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Stat label="write QPS" value={fmt(writes)} />
        <Stat label="read QPS" value={fmt(reads)} />
        <Stat label="links stored" value={fmt(total)} />
        <Stat label="storage (500 bytes each)" value={`${storageTb.toFixed(1)} TB`} />
        <Stat label="code length needed (base 62)" value={`${length} characters`} tone="good" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2"><span className="text-muted">Counter value</span>
          <input type="number" min={0} value={id} onChange={(e) => setId(Math.max(0, Math.floor(Number(e.target.value) || 0)))} className="w-40 rounded-lg border border-line bg-surface-2 px-2 py-1 font-mono" />
        </label>
        <span>→ short code <b className="rounded-md bg-accent/15 px-2 py-0.5 font-mono">{base62(id)}</b></span>
      </div>
    </Panel>
  )
}

// ---- autoscaling ---------------------------------------------------------------------------------------

function AutoscaleSim() {
  const [rps, setRps] = useState(300)
  const [capacity, setCapacity] = useState(100)
  const [target, setTarget] = useState(70)
  const [spare, setSpare] = useState(1)
  const needed = Math.max(1, Math.ceil(rps / (capacity * (target / 100)))) + spare
  const util = Math.round((rps / (needed * capacity)) * 100)
  const bigger = Math.ceil(rps / (capacity * 4)) // one machine that is 4x bigger
  return (
    <Panel title="Capacity planner">
      <div className="space-y-2">
        <Slider label="Traffic (requests/s)" min={10} max={3000} value={rps} onChange={setRps} />
        <Slider label="One server handles" min={20} max={500} value={capacity} onChange={setCapacity} unit="/s" />
        <Slider label="Target utilisation" min={30} max={95} value={target} onChange={setTarget} unit="%" />
        <Slider label="Spare servers (for failures)" min={0} max={3} value={spare} onChange={setSpare} />
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5" aria-label={`${needed} servers`}>
        {Array.from({ length: Math.min(needed, 40) }, (_, i) => <span key={i} className={cx('grid h-8 w-8 place-items-center rounded-md border-2 text-sm', i < needed - spare ? 'border-accent bg-accent/15' : 'border-dashed border-warn')}>🖥️</span>)}
        {needed > 40 && <span className="self-center text-xs text-muted">+{needed - 40} more</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Stat label="servers needed" value={needed} tone="good" />
        <Stat label="average load" value={`${util}%`} />
        <Stat label="vertical alternative" value={`${bigger}+ machines 4× bigger`} />
      </div>
      <p className="mt-2 text-xs text-muted">Dashed servers are spares. Lower the traffic and the fleet shrinks: that is what autoscaling does automatically. A single bigger machine has a ceiling and is still one point of failure.</p>
    </Panel>
  )
}

// ---- CDN -----------------------------------------------------------------------------------------------

function CdnSim() {
  const regions = [
    { name: 'Mumbai', origin: 30, edge: 15 },
    { name: 'London', origin: 190, edge: 20 },
    { name: 'New York', origin: 240, edge: 18 },
    { name: 'Sydney', origin: 320, edge: 22 },
  ]
  const [cdn, setCdn] = useState(true)
  const [warm, setWarm] = useState<Record<string, boolean>>({})
  const request = (name: string) => setWarm((w) => ({ ...w, [name]: true }))
  return (
    <Panel title="CDN latency (origin server is in Mumbai)">
      <label className="mb-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={cdn} onChange={(e) => { setCdn(e.target.checked); setWarm({}) }} /> Use a CDN (copies of the file near each region)</label>
      <div className="space-y-3">
        {regions.map((r) => {
          const hit = cdn && warm[r.name]
          const ms = hit ? r.edge : r.origin
          return (
            <div key={r.name} className="flex items-center gap-3 text-sm">
              <span className="w-24">{r.name}</span>
              <div className="h-3 flex-1 rounded bg-surface-2"><div className={cx('h-3 rounded transition-all', hit ? 'bg-good' : 'bg-warn')} style={{ width: `${(ms / 340) * 100}%` }} /></div>
              <span className="w-24 text-right font-mono text-xs">{ms} ms {hit ? '(edge)' : '(origin)'}</span>
              <Button size="sm" onClick={() => request(r.name)}>Request</Button>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-muted">{cdn ? 'The first request in a region is a cache miss and travels to the origin. After that, the nearby edge answers.' : 'Without a CDN every user fetches from Mumbai: far-away users wait much longer.'}</p>
    </Panel>
  )
}

// ---- sharding strategies -------------------------------------------------------------------------------

function ShardSim() {
  const names = ['aman', 'anita', 'arjun', 'asha', 'bhavna', 'chirag', 'divya', 'deepak', 'esha', 'farhan', 'gita', 'harsh', 'isha', 'jatin', 'kavya', 'manish', 'neha', 'nikhil', 'omar', 'priya', 'rahul', 'riya', 'sanjay', 'sara', 'tanvi', 'vikram']
  const [strategy, setStrategy] = useState<'range' | 'hash'>('range')
  const [shards, setShards] = useState(3)
  const shardOf = (key: string) => (strategy === 'range' ? Math.floor(((key.charCodeAt(0) - 97) * shards) / 26) : [...key].reduce((n, c) => n + c.charCodeAt(0), 0) % shards)
  const groups = Array.from({ length: shards }, (_, i) => names.filter((n) => shardOf(n) === i))
  return (
    <Panel title="Which shard stores each user?">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2"><span className="text-muted">Strategy</span>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value as 'range' | 'hash')} className="rounded-lg border border-line bg-surface-2 px-2 py-1">
            <option value="range">Range (by first letter)</option>
            <option value="hash">Hash of the key</option>
          </select>
        </label>
        <Slider label="Shards" min={2} max={6} value={shards} onChange={setShards} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {groups.map((g, i) => (
          <div key={i} className="rounded-xl border border-line bg-surface-2 p-2">
            <p className="text-xs font-semibold">Shard {i + 1} <span className="font-normal text-muted">· {g.length} users</span></p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">{g.join(', ') || 'empty'}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">Range sharding keeps neighbours together (good for range queries) but names are not evenly spread, so some shards become hot. Hash sharding spreads load evenly but scatters related keys.</p>
    </Panel>
  )
}

// ---- replication ---------------------------------------------------------------------------------------

function ReplicationSim() {
  const [leader, setLeader] = useState(0)
  const [followers, setFollowers] = useState([0, 0])
  const [version, setVersion] = useState(0)
  const [msg, setMsg] = useState('')
  const write = () => {
    setVersion((v) => v + 1)
    setLeader(version + 1)
    setMsg('Written to the leader. The followers have not received it yet.')
  }
  const replicate = () => {
    setFollowers([leader, leader])
    setMsg('The leader sent its changes: followers are up to date.')
  }
  const readFollower = () => setMsg(followers[0] === leader ? `Read from follower 1: value v${followers[0]} (fresh).` : `Read from follower 1: value v${followers[0]}, but the leader has v${leader}: a stale read caused by replication lag.`)
  return (
    <Panel title="Leader and followers">
      <div className="flex flex-wrap gap-3">
        {[['Leader (accepts writes)', leader, true], ['Follower 1', followers[0], false], ['Follower 2', followers[1], false]].map(([name, v, lead]) => (
          <div key={String(name)} className={cx('min-w-32 rounded-xl border-2 p-3 text-center', lead ? 'border-accent bg-accent/10' : v === leader ? 'border-good' : 'border-warn')}>
            <p className="text-xs text-muted">{String(name)}</p>
            <p className="mt-1 font-mono text-lg font-bold">v{String(v)}</p>
            {!lead && v !== leader && <p className="text-[11px] text-warn">behind</p>}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="primary" onClick={write}>Write a new value</Button>
        <Button size="sm" onClick={replicate}>Replicate to followers</Button>
        <Button size="sm" onClick={readFollower}>Read from follower 1</Button>
        <Button size="sm" variant="ghost" onClick={() => { setLeader(0); setFollowers([0, 0]); setVersion(0); setMsg('') }}>Reset</Button>
      </div>
      <p className="mt-3 min-h-5 text-sm">{msg}</p>
    </Panel>
  )
}

// ---- quorum --------------------------------------------------------------------------------------------

function QuorumSim() {
  const N = 5
  const [w, setW] = useState(3)
  const [r, setR] = useState(3)
  const [down, setDown] = useState<number[]>([])
  const up = Array.from({ length: N }, (_, i) => i).filter((i) => !down.includes(i))
  const canWrite = up.length >= w
  const canRead = up.length >= r
  const overlap = w + r > N
  return (
    <Panel title="Quorum with 5 replicas">
      <div className="space-y-2">
        <Slider label="Write quorum W" min={1} max={N} value={w} onChange={setW} />
        <Slider label="Read quorum R" min={1} max={N} value={r} onChange={setR} />
      </div>
      <p className="mt-3 text-xs text-muted">Click a replica to take it down or bring it back (a network partition or a crash).</p>
      <div className="mt-2 flex gap-2">
        {Array.from({ length: N }, (_, i) => (
          <button key={i} type="button" onClick={() => setDown((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]))} className={cx('h-12 w-12 rounded-xl border-2 text-lg', down.includes(i) ? 'border-bad bg-bad/10' : 'border-good bg-good/10')} aria-label={`Replica ${i + 1} is ${down.includes(i) ? 'down' : 'up'}`}>{down.includes(i) ? '✖' : '🗄️'}</button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Stat label="R + W > N ?" value={overlap ? `${r + w} > ${N}: reads see the latest write` : `${r + w} ≤ ${N}: a read may miss the latest write`} tone={overlap ? 'good' : 'bad'} />
        <Stat label="writes" value={canWrite ? 'available' : 'rejected (not enough replicas)'} tone={canWrite ? 'good' : 'bad'} />
        <Stat label="reads" value={canRead ? 'available' : 'rejected (not enough replicas)'} tone={canRead ? 'good' : 'bad'} />
      </div>
      <p className="mt-2 text-xs text-muted">This is the CAP trade-off in one picture: raise W and R for consistency and you lose availability when replicas fail; lower them and you stay available but may read stale data.</p>
    </Panel>
  )
}

// ---- JWT -----------------------------------------------------------------------------------------------

const b64url = (str: string) => btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

function JwtSim() {
  const [name, setName] = useState('asha')
  const [role, setRole] = useState('user')
  const [ttl, setTtl] = useState(15)
  const [tamper, setTamper] = useState(false)
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify({ sub: name, role, exp: ttl * 60 }))
  const signature = b64url(`sig-${fnv(`${header}.${payload}.secret`).toString(16)}`)
  const shownPayload = tamper ? b64url(JSON.stringify({ sub: name, role: 'admin', exp: ttl * 60 })) : payload
  const valid = !tamper
  return (
    <Panel title="Build a token">
      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <label className="flex flex-col gap-1"><span className="text-muted">User (sub)</span><input value={name} onChange={(e) => setName(e.target.value.slice(0, 12))} className="rounded-lg border border-line bg-surface-2 px-2 py-1" /></label>
        <label className="flex flex-col gap-1"><span className="text-muted">Role</span><select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg border border-line bg-surface-2 px-2 py-1"><option>user</option><option>editor</option></select></label>
        <Slider label="Expires in" min={1} max={60} value={ttl} onChange={setTtl} unit=" min" />
      </div>
      <p className="mt-4 break-all rounded-xl bg-surface-2 p-3 font-mono text-xs leading-relaxed"><span className="text-accent">{header}</span>.<span className="text-warn">{shownPayload}</span>.<span className="text-good">{signature}</span></p>
      <p className="mt-1 text-[11px] text-muted"><span className="text-accent">header</span> · <span className="text-warn">payload (anyone can read it, it is only encoded)</span> · <span className="text-good">signature (made with the server secret)</span></p>
      <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={tamper} onChange={(e) => setTamper(e.target.checked)} /> An attacker edits the payload to make themselves an admin</label>
      <p className={cx('mt-2 rounded-lg px-3 py-2 text-sm font-medium', valid ? 'bg-good/10 text-good' : 'bg-bad/10 text-bad')}>{valid ? 'Server check: signature matches, token accepted.' : 'Server check: the signature no longer matches the payload, token rejected.'}</p>
    </Panel>
  )
}

// ---- seat booking --------------------------------------------------------------------------------------

function BookingSim() {
  const [hold, setHold] = useState(true)
  const [taken, setTaken] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])
  const users = ['Asha', 'Ben']
  const [seen, setSeen] = useState<string[]>([])
  const look = (u: string) => setSeen((s) => (s.includes(u) ? s : [...s, u]))
  const book = (u: string) => {
    if (!hold) {
      setTaken((t) => (t ? `${t} and ${u}` : u))
      setLog((l) => [`${u} booked the seat${taken ? ' too: DOUBLE BOOKING' : ''}`, ...l].slice(0, 8))
      return
    }
    if (taken) setLog((l) => [`${u} was too late: the seat is already ${taken.includes(' and ') ? 'booked' : `held by ${taken}`}`, ...l].slice(0, 8))
    else {
      setTaken(u)
      setLog((l) => [`${u} got the seat (an atomic hold: only one request can win)`, ...l].slice(0, 8))
    }
  }
  return (
    <Panel title="Two people grab the last seat">
      <label className="mb-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={hold} onChange={(e) => { setHold(e.target.checked); setTaken(null); setLog([]); setSeen([]) }} /> Use an atomic hold (check and reserve in one step)</label>
      <div className="flex flex-wrap items-center gap-6">
        <div className={cx('grid h-16 w-16 place-items-center rounded-xl border-2 text-2xl', taken ? 'border-bad bg-bad/10' : 'border-good bg-good/10')} aria-label="The last seat">{taken ? '🔒' : '💺'}</div>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u} className="flex items-center gap-2 text-sm">
              <span className="w-12">{u}</span>
              {!hold && <Button size="sm" onClick={() => look(u)} disabled={seen.includes(u)}>{seen.includes(u) ? 'Sees a free seat' : 'Look at seats'}</Button>}
              <Button size="sm" variant="primary" onClick={() => book(u)} disabled={!hold && !seen.includes(u)}>Book it</Button>
            </div>
          ))}
        </div>
      </div>
      {!hold && <p className="mt-2 text-xs text-muted">Without a hold, both users first <b>look</b> (the seat is free for both), then both press <b>Book it</b>.</p>}
      {log.length > 0 && <ul className="mt-3 space-y-0.5 text-xs text-muted">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>}
    </Panel>
  )
}

export function Sim({ id }: { id: SimId }) {
  switch (id) {
    case 'load-balancer': return <LoadBalancerSim />
    case 'cache': return <CacheSim />
    case 'hash-ring': return <HashRingSim />
    case 'rate-limiter': return <RateLimiterSim />
    case 'queue': return <QueueSim />
    case 'breaker': return <BreakerSim />
    case 'shortener': return <ShortenerSim />
    case 'autoscale': return <AutoscaleSim />
    case 'cdn': return <CdnSim />
    case 'shard': return <ShardSim />
    case 'replication': return <ReplicationSim />
    case 'quorum': return <QuorumSim />
    case 'jwt': return <JwtSim />
    case 'booking': return <BookingSim />
  }
}
