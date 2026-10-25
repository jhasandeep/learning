// A tiny React for the lessons: elements, function components, the common
// hooks and context, rendered to a plain tree the checks can query and click.
// No DOM is needed, so it runs in a Web Worker next to the learner's code.

type Props = Record<string, unknown> & { children?: unknown }
type Component = (props: Props) => unknown
export interface ReactEl { $$typeof: 'el'; type: string | Component | symbol | ContextProvider; props: Props; key: string | null }
export interface HostNode { tag: string; props: Props; children: (HostNode | string)[]; parent: HostNode | null }
interface ContextProvider { $$provider: Ctx }
interface Ctx { $$context: true; defaultValue: unknown; Provider: ContextProvider }

export const Fragment = Symbol('Fragment')
/** Marks children passed as separate arguments (siblings in JSX), which need no keys. */
const STATIC = Symbol('static children')

export function createElement(type: ReactEl['type'], props: Props | null, ...children: unknown[]): ReactEl {
  const { key, ...rest } = props ?? {}
  const kids = children.length === 0 ? rest.children : children.length === 1 ? children[0] : Object.assign(children, { [STATIC]: true })
  return { $$typeof: 'el', type, props: kids === undefined ? rest : { ...rest, children: kids }, key: key === undefined || key === null ? null : String(key) }
}

export function createContext<T>(defaultValue: T): Ctx {
  const ctx = { $$context: true, defaultValue } as Ctx
  ctx.Provider = { $$provider: ctx }
  return ctx
}

const isEl = (x: unknown): x is ReactEl => typeof x === 'object' && x !== null && (x as ReactEl).$$typeof === 'el'

interface Instance { hooks: unknown[]; effects: { deps?: unknown[]; cleanup?: unknown; pending?: () => unknown }[] }
interface Renderer {
  instances: Map<string, Instance>
  current: Instance | null
  hookIndex: number
  effectIndex: number
  contexts: Map<Ctx, unknown[]>
  dirty: boolean
  schedule(): void
}

let active: Renderer | null = null

function hookSlot<T>(init: () => T): [T, (v: T) => void] {
  const r = active
  if (!r?.current) throw new Error('Hooks can only be called inside a function component, during render')
  const inst = r.current
  const i = r.hookIndex++
  if (!(i in inst.hooks)) inst.hooks[i] = init()
  return [inst.hooks[i] as T, (v: T) => { inst.hooks[i] = v }]
}

const depsChanged = (a?: unknown[], b?: unknown[]) => !a || !b || a.length !== b.length || a.some((x, i) => !Object.is(x, b[i]))

export function useState<T>(initial: T | (() => T)): [T, (v: T | ((prev: T) => T)) => void] {
  const r = active!
  const [state, write] = hookSlot<{ value: T; set?: (v: T | ((prev: T) => T)) => void }>(() => ({ value: typeof initial === 'function' ? (initial as () => T)() : initial }))
  state.set ??= (v) => {
    const next = typeof v === 'function' ? (v as (p: T) => T)(state.value) : v
    if (Object.is(next, state.value)) return
    state.value = next
    write(state)
    r.dirty = true
    r.schedule()
  }
  return [state.value, state.set]
}

export function useReducer<S, A>(reducer: (s: S, a: A) => S, initial: S): [S, (a: A) => void] {
  const [s, set] = useState(initial)
  const [dispatch] = hookSlot(() => (a: A) => set((prev) => reducer(prev, a)))
  return [s, dispatch]
}

export function useRef<T>(initial: T): { current: T } {
  return hookSlot(() => ({ current: initial }))[0]
}

export function useMemo<T>(factory: () => T, deps: unknown[]): T {
  const [slot] = hookSlot<{ deps?: unknown[]; value?: T }>(() => ({}))
  if (depsChanged(slot.deps, deps)) {
    slot.value = factory()
    slot.deps = deps
  }
  return slot.value as T
}

export function useCallback<T>(callback: T, deps: unknown[]): T {
  const [slot] = hookSlot<{ deps?: unknown[]; value?: T }>(() => ({}))
  if (depsChanged(slot.deps, deps)) {
    slot.value = callback
    slot.deps = deps
  }
  return slot.value as T
}

export function useEffect(effect: () => unknown, deps?: unknown[]) {
  const r = active!
  const inst = r.current!
  const i = r.effectIndex++
  const slot = (inst.effects[i] ??= {})
  if (deps === undefined || depsChanged(slot.deps, deps)) {
    slot.pending = effect
    slot.deps = deps
  }
}
export const useLayoutEffect = useEffect

export function useContext<T>(ctx: Ctx): T {
  const stack = active?.contexts.get(ctx)
  return (stack?.length ? stack[stack.length - 1] : ctx.defaultValue) as T
}

export const memo = <T>(c: T) => c

const React = { createElement, Fragment, createContext, useState, useReducer, useRef, useMemo, useCallback, useEffect, useLayoutEffect, useContext, memo }
export default React

// ---------- rendering ----------

const ROLE: Record<string, (n: HostNode) => boolean> = {
  button: (n) => n.tag === 'button' || (n.tag === 'input' && ['button', 'submit'].includes(String(n.props.type))),
  textbox: (n) => n.tag === 'textarea' || (n.tag === 'input' && !['checkbox', 'radio', 'button', 'submit', 'number'].includes(String(n.props.type ?? 'text'))),
  checkbox: (n) => n.tag === 'input' && n.props.type === 'checkbox',
  heading: (n) => /^h[1-6]$/.test(n.tag),
  list: (n) => n.tag === 'ul' || n.tag === 'ol',
  listitem: (n) => n.tag === 'li',
  link: (n) => n.tag === 'a',
  img: (n) => n.tag === 'img',
  form: (n) => n.tag === 'form',
}

export function textOf(n: HostNode | string): string {
  return typeof n === 'string' ? n : n.children.map(textOf).join('')
}

function walk(nodes: (HostNode | string)[], visit: (n: HostNode) => void) {
  for (const n of nodes) if (typeof n !== 'string') {
    visit(n)
    walk(n.children, visit)
  }
}

const textMatches = (text: string, want: string | RegExp) => (typeof want === 'string' ? text.trim() === want : want.test(text))

/** Renders `<Component {...props} />` and returns helpers to inspect and interact with it. */
export function render(component: Component | ReactEl, initialProps: Props = {}) {
  let props = initialProps
  let tree: (HostNode | string)[] = []
  const warnings: string[] = []
  let renders = 0
  let scheduled = false
  const r: Renderer = {
    instances: new Map(), current: null, hookIndex: 0, effectIndex: 0, contexts: new Map(), dirty: false,
    schedule() {
      if (scheduled || batching) return
      scheduled = true
      queueMicrotask(() => {
        scheduled = false
        if (r.dirty) rerender()
      })
    },
  }
  let batching = false

  const toHost = (node: unknown, path: string, parent: HostNode | null, seen: Set<string>, inArray = false): (HostNode | string)[] => {
    if (node === null || node === undefined || typeof node === 'boolean') return []
    if (typeof node === 'string' || typeof node === 'number') return [String(node)]
    if (Array.isArray(node)) {
      return node.flatMap((child, i) => {
        if (!(STATIC in node) && isEl(child) && child.key === null && !warnings.some((w) => w.startsWith('Each child'))) warnings.push('Each child in a list should have a unique "key" prop.')
        return toHost(child, `${path}[${isEl(child) && child.key !== null ? `k:${child.key}` : i}]`, parent, seen, true)
      })
    }
    if (!isEl(node)) {
      if (typeof node === 'function') throw new Error('Functions are not valid as a React child. Did you mean <Component /> instead of Component?')
      throw new Error(`Objects are not valid as a React child (found: ${JSON.stringify(node)})`)
    }
    void inArray
    const { type } = node
    if (type === Fragment) return toHost(node.props.children, `${path}/F`, parent, seen)
    if (typeof type === 'object' && type && '$$provider' in type) {
      const ctx = (type as ContextProvider).$$provider
      const stack = r.contexts.get(ctx) ?? []
      r.contexts.set(ctx, [...stack, node.props.value])
      try {
        return toHost(node.props.children, `${path}/P`, parent, seen)
      } finally {
        r.contexts.set(ctx, stack)
      }
    }
    if (typeof type === 'function') {
      const id = `${path}/${type.name || 'Anonymous'}`
      seen.add(id)
      const inst = r.instances.get(id) ?? { hooks: [], effects: [] }
      r.instances.set(id, inst)
      const prev = { current: r.current, hook: r.hookIndex, effect: r.effectIndex }
      r.current = inst
      r.hookIndex = 0
      r.effectIndex = 0
      let out: unknown
      try {
        out = type(node.props)
      } finally {
        r.current = prev.current
        r.hookIndex = prev.hook
        r.effectIndex = prev.effect
      }
      if (out === undefined) throw new Error(`${type.name || 'A component'} returned undefined. Return JSX or null.`)
      return toHost(out, id, parent, seen)
    }
    const host: HostNode = { tag: String(type), props: node.props, children: [], parent }
    host.children = toHost(node.props.children, `${path}/${String(type)}`, host, seen)
    return [host]
  }

  const runEffects = () => {
    for (const inst of r.instances.values()) {
      for (const e of inst.effects) {
        if (!e.pending) continue
        if (typeof e.cleanup === 'function') (e.cleanup as () => void)()
        const fx = e.pending
        e.pending = undefined
        e.cleanup = fx()
      }
    }
  }

  function rerender() {
    for (let loop = 0; loop < 25; loop++) {
      r.dirty = false
      renders++
      const seen = new Set<string>()
      active = r
      try {
        tree = toHost(isEl(component) ? component : createElement(component, props), 'root', null, seen)
      } finally {
        active = null
      }
      for (const [id, inst] of r.instances) {
        if (seen.has(id)) continue
        inst.effects.forEach((e) => typeof e.cleanup === 'function' && (e.cleanup as () => void)())
        r.instances.delete(id)
      }
      batching = true
      try {
        runEffects()
      } finally {
        batching = false
      }
      if (!r.dirty) return
    }
    throw new Error('Too many re-renders: a state update runs on every render.')
  }

  const act = (fn: () => unknown) => {
    batching = true
    try {
      fn()
    } finally {
      batching = false
    }
    if (r.dirty) rerender()
  }

  rerender()

  const all = () => {
    const out: HostNode[] = []
    walk(tree, (n) => out.push(n))
    return out
  }
  const byText = (want: string | RegExp) => {
    const hits = all().filter((n) => textMatches(textOf(n), want))
    // The innermost element whose text matches.
    return hits.filter((h) => !hits.some((o) => o !== h && isInside(o, h)))
  }
  const isInside = (inner: HostNode, outer: HostNode) => {
    for (let p = inner.parent; p; p = p.parent) if (p === outer) return true
    return false
  }
  const fail = (what: string): never => {
    throw new Error(`Unable to find ${what}. The rendered text is: ${JSON.stringify(textOf({ tag: 'root', props: {}, children: tree, parent: null }).slice(0, 300))}`)
  }
  const event = (target: HostNode, extra: Record<string, unknown> = {}) => ({
    target: { value: target.props.value, checked: target.props.checked, name: target.props.name, ...extra },
    currentTarget: target, preventDefault() {}, stopPropagation() {}, key: extra.key,
  })

  const ui = {
    get tree() { return tree },
    get renders() { return renders },
    warnings,
    text: () => tree.map(textOf).join(''),
    getByText(want: string | RegExp) { return byText(want)[0] ?? fail(`text ${String(want)}`) },
    queryByText(want: string | RegExp) { return byText(want)[0] ?? null },
    getAllByText(want: string | RegExp) { const h = byText(want); return h.length ? h : fail(`text ${String(want)}`) },
    getAllByTag(tag: string) { return all().filter((n) => n.tag === tag) },
    getByRole(role: string, opts: { name?: string | RegExp } = {}) {
      const hit = ui.queryByRole(role, opts)
      return hit ?? fail(`role "${role}"${opts.name ? ` named ${String(opts.name)}` : ''}`)
    },
    queryByRole(role: string, opts: { name?: string | RegExp } = {}) {
      const is = ROLE[role] ?? ((n: HostNode) => n.props.role === role)
      return all().find((n) => is(n) && (!opts.name || textMatches(textOf(n) || String(n.props['aria-label'] ?? n.props.placeholder ?? n.props.alt ?? ''), opts.name))) ?? null
    },
    getAllByRole(role: string) { return all().filter(ROLE[role] ?? ((n: HostNode) => n.props.role === role)) },
    getByPlaceholderText(want: string | RegExp) { return all().find((n) => textMatches(String(n.props.placeholder ?? ''), want)) ?? fail(`placeholder ${String(want)}`) },
    click(el: HostNode) {
      act(() => {
        ;(el.props.onClick as ((e: unknown) => void) | undefined)?.(event(el))
        if (el.tag === 'input' && el.props.type === 'checkbox') (el.props.onChange as ((e: unknown) => void) | undefined)?.(event(el, { checked: !el.props.checked }))
        if (el.tag === 'button' && (el.props.type ?? 'submit') === 'submit') {
          let form = el.parent
          while (form && form.tag !== 'form') form = form.parent
          ;(form?.props.onSubmit as ((e: unknown) => void) | undefined)?.(event(form!))
        }
      })
    },
    type(el: HostNode, value: string) {
      act(() => (el.props.onChange as ((e: unknown) => void) | undefined)?.(event(el, { value })))
    },
    keyDown(el: HostNode, key: string) {
      act(() => (el.props.onKeyDown as ((e: unknown) => void) | undefined)?.(event(el, { key })))
    },
    submit(form: HostNode) {
      act(() => (form.props.onSubmit as ((e: unknown) => void) | undefined)?.(event(form)))
    },
    rerender(next: Props) {
      props = next
      rerender()
    },
    unmount() {
      for (const inst of r.instances.values()) inst.effects.forEach((e) => typeof e.cleanup === 'function' && (e.cleanup as () => void)())
      r.instances.clear()
      tree = []
    },
    /** Lets pending promises (e.g. a fetch in an effect) settle and re-renders. */
    async flush() {
      for (let i = 0; i < 5; i++) {
        await new Promise((res) => setTimeout(res, 0))
        if (r.dirty) rerender()
      }
    },
    async findByText(want: string | RegExp) {
      for (let i = 0; i < 20; i++) {
        const hit = byText(want)[0]
        if (hit) return hit
        await ui.flush()
      }
      return fail(`text ${String(want)}`)
    },
  }
  return ui
}
