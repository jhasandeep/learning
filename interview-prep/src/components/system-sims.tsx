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

export function Sim({ id }: { id: SimId }) {
  switch (id) {
    case 'load-balancer': return <LoadBalancerSim />
    case 'cache': return <CacheSim />
    case 'hash-ring': return <HashRingSim />
    case 'rate-limiter': return <RateLimiterSim />
    case 'queue': return <QueueSim />
    case 'breaker': return <BreakerSim />
    case 'shortener': return <ShortenerSim />
  }
}
