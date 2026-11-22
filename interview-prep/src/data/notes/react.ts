import type { NoteTopic } from './types'

export const react: NoteTopic = {
  id: 'react',
  title: 'React',
  tagline: 'Components, rendering, hooks, state management and performance',
  category: 'Frontend',
  badge: '⚛',
  color: '#087ea4',
  sections: [
    {
      id: 'what',
      title: 'What React does',
      blocks: [
        { type: 'def', text: '**React** is a library for building UIs from ==components== — functions that return what the UI should look like for the current data. `UI = f(state)`.' },
        { type: 'analogy', title: 'Think of React like a restaurant menu board', steps: [{ icon: '📝', who: 'Chef changes a dish', tech: 'State / props', text: 'Something in the data changes' }, { icon: '🖊️', who: 'Updates the board', tech: 'Re-render', text: 'React builds a new description' }, { icon: '🔍', who: 'Compares old and new', tech: 'Virtual DOM diff', text: 'Finds only what changed' }, { icon: '👀', who: 'Diners see the update', tech: 'DOM commit', text: 'Only the changed line is rewritten' }] },
        { type: 'flow', steps: ['State / props change', 'Component re-renders', 'New element tree', 'Reconcile (diff)', 'Commit minimal DOM changes'] },
        { type: 'list', items: ['**Declarative**: describe the result, React works out the DOM updates.', '**One-way data flow**: props go down, events go up through callbacks.', '**Reconciliation**: different element type → replace the subtree; same type → update props; lists are matched by `key`.'] },
      ],
    },
    {
      id: 'jsx',
      title: 'JSX, components and props',
      blocks: [
        {
          type: 'code', lang: 'typescript', title: 'A typed component',
          code: `type CardProps = { title: string; count?: number; onSelect: (title: string) => void; children?: React.ReactNode }

export function Card({ title, count = 0, onSelect, children }: CardProps) {
  return (
    <article className="card" onClick={() => onSelect(title)}>
      <h3>{title}</h3>
      {count > 0 && <span>{count} new</span>}   {/* not {count && …} — 0 would render */}
      {children}
    </article>
  )
}`,
        },
        { type: 'list', items: ['JSX compiles to `jsx()` / `React.createElement` calls that return plain objects.', 'Props are read-only. A component re-renders when its state, its parent or a consumed context changes.', 'Rules: one root (or a Fragment `<>`), `className`, `htmlFor`, camelCase events, `{}` for expressions.'] },
      ],
    },
    {
      id: 'state',
      title: 'State and rendering',
      blocks: [
        {
          type: 'code', lang: 'typescript', title: 'Updater functions and immutability',
          code: `const [count, setCount] = useState(0)
setCount(count + 1); setCount(count + 1)   // → +1 (same snapshot)
setCount((c) => c + 1); setCount((c) => c + 1) // → +2

const [todos, setTodos] = useState<Todo[]>([])
setTodos((t) => [...t, newTodo])                          // add
setTodos((t) => t.map((x) => (x.id === id ? { ...x, done: true } : x))) // update
setTodos((t) => t.filter((x) => x.id !== id))             // remove`,
        },
        { type: 'list', items: ['State updates are **batched** and applied on the next render — the variable doesn\'t change immediately.', 'Never mutate state (`todos.push(x)`): React compares references, so it won\'t re-render.', 'Derive values during render instead of storing them in extra state.', '**Lift state up** to the closest common parent when siblings need it.'] },
        { type: 'mistake', text: 'Using an array index as `key` for a list that can be reordered or filtered — input state ends up on the wrong row. Use a stable id.' },
      ],
    },
    {
      id: 'effects',
      title: 'useEffect',
      blocks: [
        { type: 'def', text: '`useEffect` ==synchronises a component with something outside React== (network, subscriptions, timers, the DOM). It runs after the browser paints.' },
        {
          type: 'code', lang: 'typescript', title: 'Fetch with cleanup (no race conditions)',
          code: `useEffect(() => {
  const controller = new AbortController()
  setLoading(true)
  fetch(\`/api/users/\${id}\`, { signal: controller.signal })
    .then((r) => r.json())
    .then(setUser)
    .catch((e) => { if (e.name !== 'AbortError') setError(e) })
    .finally(() => setLoading(false))
  return () => controller.abort()   // cleanup when id changes or on unmount
}, [id])`,
        },
        {
          type: 'table', head: ['Dependency array', 'Runs'],
          rows: [
            ['none', 'after every render'],
            ['`[]`', 'once after mount (twice in dev Strict Mode, to catch missing cleanups)'],
            ['`[a, b]`', 'after mount and whenever a or b changes'],
          ],
        },
        { type: 'tip', text: 'You might not need an effect: derive data during render, handle user actions in event handlers, and use a data library (TanStack Query / SWR) for server state.' },
      ],
    },
    {
      id: 'hooks',
      title: 'Other hooks',
      blocks: [
        {
          type: 'table', head: ['Hook', 'Use it for'],
          rows: [
            ['`useRef`', 'a mutable value that survives renders without re-rendering; DOM refs'],
            ['`useMemo`', 'cache an expensive calculation'],
            ['`useCallback`', 'cache a function identity (for memoised children / effect deps)'],
            ['`useContext`', 'read a context value without prop drilling'],
            ['`useReducer`', 'complex state transitions: `(state, action) => newState`'],
            ['`useLayoutEffect`', 'measure the DOM before paint'],
            ['`useTransition` / `useDeferredValue`', 'mark updates as non-urgent so typing stays responsive'],
            ['`useId`', 'stable ids for accessibility attributes'],
          ],
        },
        { type: 'mistake', text: 'Rules of hooks: call them at the top level of components or custom hooks — never inside conditions or loops. React matches hooks by call order.' },
        {
          type: 'code', lang: 'typescript', title: 'A custom hook',
          code: `function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}`,
        },
      ],
    },
    {
      id: 'state-mgmt',
      title: 'State management',
      blocks: [
        {
          type: 'table', head: ['Kind of state', 'Best tool'],
          rows: [
            ['Local UI state (open, input value)', '`useState` / `useReducer`'],
            ['Shared, rarely changing (theme, user, locale)', 'Context'],
            ['Server data (lists, details, caching)', 'TanStack Query / SWR'],
            ['Complex global client state', 'Redux Toolkit / Zustand'],
            ['Shareable UI state (filters, page)', 'URL search params'],
          ],
        },
        { type: 'list', items: ['Context re-renders **every consumer** when its value changes — split contexts and memoise values.', 'Redux Toolkit: `createSlice` (reducers with Immer), `configureStore`, `useSelector` picks just what a component needs, RTK Query for data fetching.'] },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      blocks: [
        { type: 'list', items: ['Measure first with the React DevTools Profiler.', '`React.memo` skips re-rendering a child when its props are shallow-equal (pair with useCallback/useMemo for function/object props).', 'Code-split routes and heavy widgets with `lazy()` + `<Suspense>`.', 'Virtualise long lists (TanStack Virtual / react-window).', 'Keep state close to where it is used so fewer components re-render.', 'The **React Compiler** can add memoisation automatically.'] },
        { type: 'p', text: '**React 19** adds Actions (`useActionState`, `useFormStatus`, `useOptimistic`), the `use()` hook for promises and context, `ref` as a normal prop, and document metadata tags inside components.' },
        { type: 'revision', text: 'UI = f(state). Immutable updates and updater functions, stable keys, effects only for external sync (with cleanup), hooks at the top level, the right tool for each kind of state, measure before memoising.' },
      ],
    },
  ],
  qa: [
    ['What is the Virtual DOM / reconciliation?', 'React builds a new element tree on each render, diffs it with the previous one, and applies only the needed DOM changes. Element type and key drive the matching.'],
    ['State vs props?', 'Props come from the parent and are read-only; state is owned by the component and changed with its setter.'],
    ['Why do lists need keys?', 'So React can match items between renders and keep each item\'s state and DOM. Keys must be stable and unique.'],
    ['Why can\'t hooks be called conditionally?', 'React tracks hooks by their call order; changing the order between renders mixes up the state slots.'],
    ['useMemo vs useCallback vs React.memo?', 'useMemo caches a value, useCallback caches a function, React.memo skips re-rendering a component whose props are shallow-equal.'],
    ['useEffect vs useLayoutEffect?', 'useEffect runs after paint; useLayoutEffect runs after DOM changes but before paint — use it to measure layout.'],
    ['Why does setCount(count + 1) twice add only 1?', 'Both calls read the same render\'s snapshot. Use the updater form setCount(c => c + 1).'],
    ['Context vs Redux?', 'Context passes values down without props; Redux is a full state system with middleware, devtools and selectors that limit re-renders.'],
    ['Controlled vs uncontrolled inputs?', 'Controlled: the value lives in React state (value + onChange). Uncontrolled: the DOM keeps it and you read it with a ref or FormData.'],
    ['How do you avoid a fetch race condition in useEffect?', 'Abort the previous request in the cleanup (AbortController) or ignore stale responses with a flag.'],
    ['What is lifting state up?', 'Moving shared state to the closest common parent and passing it down as props.'],
    ['What is new in React 19?', 'Actions with useActionState/useFormStatus/useOptimistic, the use() hook, ref as a prop, and metadata tags rendered from components.'],
  ],
}
