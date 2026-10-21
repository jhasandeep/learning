import type { SyntaxSet } from './types'

export const react: SyntaxSet = {
  id: 'react',
  title: 'React',
  snippets: [
    {
      id: 'counter-use-state',
      title: 'Counter with useState',
      lang: 'tsx',
      code: `import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
      <button onClick={() => setCount((c) => c - 1)}>-1</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  )
}`,
      note: 'The classic warm-up. Use the **functional update** `setCount((c) => c + 1)` whenever the next state depends on the previous one.',
    },
    {
      id: 'fetch-in-effect',
      title: 'Fetch in useEffect with cleanup',
      lang: 'tsx',
      code: `function UserProfile({ id }: { id: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(\`/api/users/\${id}\`, { signal: controller.signal })
      .then((res) => res.json())
      .then(setUser)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
    return () => controller.abort()
  }, [id])

  if (error) return <p role="alert">{error}</p>
  return user ? <h2>{user.name}</h2> : <p>Loading...</p>
}`,
      note: 'Interviewers look for the **cleanup**: aborting the request when `id` changes or the component unmounts avoids race conditions and stale state.',
    },
    {
      id: 'controlled-form',
      title: 'Controlled form with validation',
      lang: 'tsx',
      code: `function NameForm({ onSave }: { onSave: (name: string) => void }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (name.trim().length < 2) return setError('Name is too short')
    setError('')
    onSave(name.trim())
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      {error && <p role="alert">{error}</p>}
      <button type="submit">Save</button>
    </form>
  )
}`,
      note: 'A **controlled input** takes its `value` from state and updates it in `onChange`. Remember `e.preventDefault()` so the page does not reload.',
    },
    {
      id: 'list-filter-keys',
      title: 'Filtered list with keys',
      lang: 'tsx',
      code: `function ProductList({ products }: { products: Product[] }) {
  const [term, setTerm] = useState('')
  const visible = products.filter((p) =>
    p.name.toLowerCase().includes(term.toLowerCase()),
  )

  return (
    <>
      <input value={term} onChange={(e) => setTerm(e.target.value)} />
      <ul>
        {visible.map((p) => (
          <li key={p.id}>{p.name} - \${p.price}</li>
        ))}
      </ul>
      {visible.length === 0 && <p>No results</p>}
    </>
  )
}`,
      note: 'Derive the filtered list during render instead of storing it in state. Use a **stable id** as the `key`, never the array index for lists that change.',
    },
    {
      id: 'use-debounce',
      title: 'Custom hook: useDebounce',
      lang: 'tsx',
      code: `function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}

const debouncedQuery = useDebounce(query, 500)
useEffect(() => {
  if (debouncedQuery) search(debouncedQuery)
}, [debouncedQuery])`,
      note: 'The most asked **custom hook**: every change resets the timer, so the value only updates after the user stops typing. Great for search boxes.',
    },
    {
      id: 'use-reducer-todos',
      title: 'useReducer for todos',
      lang: 'tsx',
      code: `type Todo = { id: number; text: string; done: boolean }
type Action =
  | { type: 'add'; todo: Todo }
  | { type: 'toggle'; id: number }

function todosReducer(todos: Todo[], action: Action): Todo[] {
  switch (action.type) {
    case 'add':
      return [...todos, action.todo]
    case 'toggle':
      return todos.map((t) =>
        t.id === action.id ? { ...t, done: !t.done } : t,
      )
  }
}

const [todos, dispatch] = useReducer(todosReducer, [])
dispatch({ type: 'toggle', id: 1 })`,
      note: 'A **reducer** is a pure function `(state, action) => newState`. Reach for it when several state updates belong together; never mutate, always return a new array.',
    },
    {
      id: 'context-provider',
      title: 'Context provider and hook',
      lang: 'tsx',
      code: `type Theme = 'light' | 'dark'
type ThemeCtx = { theme: Theme; toggle: () => void }
const ThemeContext = createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const toggle = () =>
    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  return (
    <ThemeContext value={{ theme, toggle }}>{children}</ThemeContext>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used in ThemeProvider')
  return ctx
}`,
      note: 'Context avoids prop drilling. In React 19 `<ThemeContext>` is itself the provider, and a **custom hook** that throws outside the provider is what interviewers want to see.',
    },
    {
      id: 'memo-callback',
      title: 'useMemo, useCallback and memo',
      lang: 'tsx',
      code: `const Row = memo(function Row({ item, onSelect }: RowProps) {
  return <li onClick={() => onSelect(item.id)}>{item.name}</li>
})

function List({ items, onPick }: ListProps) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items],
  )
  const onSelect = useCallback((id: string) => onPick(id), [onPick])
  return (
    <ul>
      {sorted.map((i) => (
        <Row key={i.id} item={i} onSelect={onSelect} />
      ))}
    </ul>
  )
}`,
      note: '`memo` skips re-rendering a child when its props are equal, which only works if callbacks keep the **same identity** (`useCallback`) and derived data is cached (`useMemo`).',
    },
    {
      id: 'use-ref',
      title: 'useRef: focus and timer id',
      lang: 'tsx',
      code: `function SearchBox() {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => inputRef.current?.focus(), [])
  return <input ref={inputRef} />
}
function Timer() {
  const idRef = useRef<number>(undefined)
  const start = () => {
    idRef.current = window.setInterval(tick, 1000)
  }
  const stop = () => clearInterval(idRef.current)
  return (
    <>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </>
  )
}`,
      note: 'A ref holds a DOM node or any **mutable value** that survives renders without causing one. Asked as "focus the input on mount" or "store an interval id".',
    },
    {
      id: 'lazy-suspense',
      title: 'lazy and Suspense',
      lang: 'tsx',
      code: `import { lazy, Suspense, useState } from 'react'

const Chart = lazy(() => import('./Chart'))

export function Dashboard() {
  const [show, setShow] = useState(false)
  return (
    <>
      <button onClick={() => setShow(true)}>Show chart</button>
      {show && (
        <Suspense fallback={<p>Loading chart...</p>}>
          <Chart />
        </Suspense>
      )}
    </>
  )
}`,
      note: '**Code splitting**: `lazy` loads the component bundle on first render, and the nearest `Suspense` shows the fallback until it arrives.',
    },
    {
      id: 'error-boundary',
      title: 'Error boundary class',
      lang: 'tsx',
      code: `type Props = { fallback: ReactNode; children: ReactNode }
type State = { hasError: boolean }

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError(error, info.componentStack)
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}`,
      note: 'Error boundaries are ==still class components==. `getDerivedStateFromError` switches to the fallback, `componentDidCatch` logs. They do not catch errors in event handlers.',
    },
    {
      id: 'use-action-state',
      title: 'Form with useActionState',
      lang: 'tsx',
      code: `async function subscribe(_prev: unknown, formData: FormData) {
  const email = String(formData.get('email'))
  if (!email.includes('@')) return { error: 'Invalid email' }
  await saveEmail(email)
  return { error: '' }
}
function Newsletter() {
  const [state, formAction, isPending] = useActionState(subscribe, {
    error: '',
  })
  return (
    <form action={formAction}>
      <input name="email" type="email" />
      <button disabled={isPending}>Subscribe</button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  )
}`,
      note: 'React 19 forms: `useActionState` gives the last result, a form `action` and an **isPending** flag, so no manual loading or `onSubmit` state.',
    },
  ],
}
