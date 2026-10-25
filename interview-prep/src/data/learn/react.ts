import type { LearnTrack } from './types'

export const react: LearnTrack = {
  id: 'react',
  intro: 'Build interactive UIs: components and props, state, events, lists and keys, forms, effects, context and custom hooks.',
  kind: 'js',
  lang: 'jsx',
  jsx: true,
  steps: [
    {
      id: 'components',
      title: 'Components and JSX',
      learn: `A component is a function that returns **JSX**: HTML-like syntax that becomes React elements.

\`\`\`
function Hello() {
  return <h1>Hello!</h1>
}
\`\`\`

Component names start with a capital letter, and a component returns one root element (wrap siblings in \`<>…</>\`).`,
      task: 'Write a `Welcome` component that renders an `<h1>` "Welcome to React" and a `<p>` "Let\'s build something.".',
      starter: `function Welcome() {

}
`,
      solution: `function Welcome() {
  return (
    <>
      <h1>Welcome to React</h1>
      <p>Let's build something.</p>
    </>
  )
}
`,
      tests: [
        ['renders the heading', 'const ui = render(Welcome); expect(ui.getByRole("heading").tag).toBe("h1"); ui.getByText("Welcome to React")'],
        ['renders the paragraph', 'const ui = render(Welcome); expect(ui.getByText("Let\'s build something.").tag).toBe("p")'],
      ],
      hints: ['A component must `return` the JSX.', 'Two siblings need a wrapper: a fragment `<>…</>` works.'],
    },
    {
      id: 'props',
      title: 'Props',
      learn: `Props pass data into a component, like function arguments. Destructure them:

\`\`\`
function Avatar({ name, size = 40 }) { … }
<Avatar name="Ada" />
\`\`\`

Props are read-only: a component never changes its own props.`,
      task: 'Write `Badge({ label, count })`: render a `<span>` with the label, and when `count` is above 0 also show it in parentheses, e.g. "Inbox (3)". Show just "Inbox" when the count is 0.',
      starter: `function Badge(props) {
  return <span>{props.label}</span>
}
`,
      solution: `function Badge({ label, count }) {
  return <span>{label}{count > 0 && \` (\${count})\`}</span>
}
`,
      tests: [
        ['shows the count', 'expect(render(Badge, { label: "Inbox", count: 3 }).text()).toBe("Inbox (3)")'],
        ['hides a zero count (and never renders "0")', 'expect(render(Badge, { label: "Inbox", count: 0 }).text()).toBe("Inbox")'],
      ],
      hints: ['`{count > 0 && …}` renders nothing when the condition is false.', 'Watch out: `{count && …}` would render "0" for a zero count.'],
    },
    {
      id: 'state',
      title: 'State with useState',
      learn: `\`useState\` gives a component memory. Calling the setter re-renders it with the new value:

\`\`\`
const [count, setCount] = useState(0)
<button onClick={() => setCount((c) => c + 1)}>+</button>
\`\`\`

Use the updater form \`(c) => c + 1\` when the new value depends on the old one.`,
      task: 'Build a `Counter`: show "Count: 0", a "+" button that adds 1, a "-" button that subtracts 1 but never goes below 0, and a "Reset" button.',
      starter: `import { useState } from 'react'

function Counter() {
  return (
    <div>
      <p>Count: 0</p>
      <button>+</button>
      <button>-</button>
      <button>Reset</button>
    </div>
  )
}
`,
      solution: `import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
      <button onClick={() => setCount((c) => Math.max(0, c - 1))}>-</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  )
}
`,
      tests: [
        ['+ adds one', 'const ui = render(Counter); ui.click(ui.getByText("+")); ui.click(ui.getByText("+")); ui.getByText("Count: 2")'],
        ['- never goes below 0', 'const ui = render(Counter); ui.click(ui.getByText("-")); ui.getByText("Count: 0"); ui.click(ui.getByText("+")); ui.click(ui.getByText("-")); ui.getByText("Count: 0")'],
        ['Reset goes back to 0', 'const ui = render(Counter); ui.click(ui.getByText("+")); ui.click(ui.getByText("Reset")); ui.getByText("Count: 0")'],
      ],
      hints: ['`const [count, setCount] = useState(0)`, then show `{count}`.', 'For "-": `setCount((c) => Math.max(0, c - 1))`.'],
    },
    {
      id: 'lists',
      title: 'Lists and keys',
      learn: `Render a list with \`map\`. Each item needs a stable, unique \`key\` so React can track it between renders:

\`\`\`
<ul>{todos.map((t) => <li key={t.id}>{t.text}</li>)}</ul>
\`\`\`

Avoid the array index as a key when items can be added, removed or reordered.`,
      task: 'Write `TodoList({ todos })`: a `<ul>` of `<li>` with each todo\'s text (keyed by id). Done todos show "✓ " before the text. If there are no todos, render a `<p>` "Nothing to do".',
      starter: `function TodoList({ todos }) {
  return <ul></ul>
}
`,
      solution: `function TodoList({ todos }) {
  if (todos.length === 0) return <p>Nothing to do</p>
  return (
    <ul>
      {todos.map((t) => (
        <li key={t.id}>{t.done ? '✓ ' : ''}{t.text}</li>
      ))}
    </ul>
  )
}
`,
      tests: [
        ['renders one <li> per todo', 'const ui = render(TodoList, { todos: [{ id: 1, text: "Shop", done: false }, { id: 2, text: "Cook", done: true }] }); expect(ui.getAllByTag("li").map((li) => li.children.join(""))).toEqual(["Shop", "✓ Cook"])'],
        ['every item has a key', 'const ui = render(TodoList, { todos: [{ id: 1, text: "A", done: false }, { id: 2, text: "B", done: false }] }); expect(ui.warnings).toEqual([])'],
        ['an empty list says so', 'expect(render(TodoList, { todos: [] }).getByText("Nothing to do").tag).toBe("p")'],
      ],
      hints: ['`todos.map((t) => <li key={t.id}>…</li>)` inside the `<ul>`.', 'Check `todos.length === 0` first and return the `<p>`.'],
    },
    {
      id: 'forms',
      title: 'Controlled forms',
      learn: `A **controlled** input takes its \`value\` from state and updates it in \`onChange\`. React state is then the single source of truth.

On submit, call \`e.preventDefault()\` so the browser doesn't reload the page.`,
      task: 'Build `AddTodo({ onAdd })`: a form with a text input and an "Add" button. Submitting calls `onAdd(text)` with the trimmed text and clears the input. Ignore empty text.',
      starter: `import { useState } from 'react'

function AddTodo({ onAdd }) {
  return (
    <form>
      <input placeholder="What needs doing?" />
      <button>Add</button>
    </form>
  )
}
`,
      solution: `import { useState } from 'react'

function AddTodo({ onAdd }) {
  const [text, setText] = useState('')
  function handleSubmit(e) {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    onAdd(value)
    setText('')
  }
  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="What needs doing?" value={text} onChange={(e) => setText(e.target.value)} />
      <button>Add</button>
    </form>
  )
}
`,
      tests: [
        ['submits the trimmed text', 'const add = fn(); const ui = render(AddTodo, { onAdd: add }); ui.type(ui.getByRole("textbox"), "  Buy milk "); ui.click(ui.getByText("Add")); expect(add).toHaveBeenCalledWith("Buy milk")'],
        ['clears the input after adding', 'const ui = render(AddTodo, { onAdd: fn() }); ui.type(ui.getByRole("textbox"), "x"); ui.click(ui.getByText("Add")); expect(ui.getByRole("textbox").props.value).toBe("")'],
        ['ignores empty text', 'const add = fn(); const ui = render(AddTodo, { onAdd: add }); ui.type(ui.getByRole("textbox"), "   "); ui.click(ui.getByText("Add")); expect(add).not.toHaveBeenCalled()'],
        ['the input is controlled', 'const ui = render(AddTodo, { onAdd: fn() }); ui.type(ui.getByRole("textbox"), "hi"); expect(ui.getByRole("textbox").props.value).toBe("hi")'],
      ],
      hints: ['`const [text, setText] = useState("")`, with `value={text}` and `onChange={(e) => setText(e.target.value)}`.', 'Put the logic in `onSubmit` on the `<form>` and start with `e.preventDefault()`.'],
    },
    {
      id: 'effects',
      title: 'Effects and cleanup',
      learn: `\`useEffect\` syncs a component with something outside React (timers, subscriptions, fetching). List every value it uses in the dependency array, and **return a cleanup** to undo it:

\`\`\`
useEffect(() => {
  const id = setInterval(tick, 1000)
  return () => clearInterval(id)
}, [])
\`\`\``,
      task: '`getUser(id)` returns a promise of a user. Write `Profile({ id })` that shows "Loading…" and then the user\'s name in an `<h2>`. It must load again when `id` changes.',
      starter: `import { useState, useEffect } from 'react'

const USERS = { 1: 'Ada', 2: 'Linus' }
const getUser = (id) => Promise.resolve({ id, name: USERS[id] })

function Profile({ id }) {
  const [user, setUser] = useState(null)
  useEffect(() => {
    getUser(id).then(setUser)
  }, [])
  return user ? <h2>{user.name}</h2> : <p>Loading…</p>
}
`,
      solution: `import { useState, useEffect } from 'react'

const USERS = { 1: 'Ada', 2: 'Linus' }
const getUser = (id) => Promise.resolve({ id, name: USERS[id] })

function Profile({ id }) {
  const [user, setUser] = useState(null)
  useEffect(() => {
    let cancelled = false
    setUser(null)
    getUser(id).then((u) => { if (!cancelled) setUser(u) })
    return () => { cancelled = true }
  }, [id])
  return user ? <h2>{user.name}</h2> : <p>Loading…</p>
}
`,
      tests: [
        ['shows Loading… then the name', 'const ui = render(Profile, { id: 1 }); ui.getByText("Loading…"); expect((await ui.findByText("Ada")).tag).toBe("h2")'],
        ['loads again when id changes', 'const ui = render(Profile, { id: 1 }); await ui.findByText("Ada"); ui.rerender({ id: 2 }); await ui.findByText("Linus")'],
        ['lists id as a dependency', 'expect(code).toMatch(/\\[\\s*id\\s*\\]/)'],
      ],
      hints: ['The effect uses `id`, so the array must be `[id]`.', 'A `cancelled` flag set in the cleanup stops an old, slow request from overwriting a newer one.'],
    },
    {
      id: 'context',
      title: 'Context',
      learn: `Context passes a value down the tree without threading props through every level:

\`\`\`
const ThemeContext = createContext('light')
<ThemeContext.Provider value="dark"> … </ThemeContext.Provider>
const theme = useContext(ThemeContext)
\`\`\``,
      task: 'Create `ThemeContext` (default "light"). `ThemeLabel` shows "Theme: <theme>" from context. `App` provides "dark" around a `ThemeLabel`.',
      starter: `import { createContext, useContext } from 'react'

function ThemeLabel() {
  return <p>Theme: ?</p>
}

function App() {
  return <ThemeLabel />
}
`,
      solution: `import { createContext, useContext } from 'react'

const ThemeContext = createContext('light')

function ThemeLabel() {
  const theme = useContext(ThemeContext)
  return <p>Theme: {theme}</p>
}

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <ThemeLabel />
    </ThemeContext.Provider>
  )
}
`,
      tests: [
        ['App provides "dark"', 'render(App).getByText("Theme: dark")'],
        ['the default is "light"', 'render(ThemeLabel).getByText("Theme: light")'],
        ['uses useContext', 'expect(code).toMatch(/useContext\\(\\s*ThemeContext\\s*\\)/)'],
      ],
      hints: ['`const ThemeContext = createContext("light")` at the top level.', 'Read it with `useContext(ThemeContext)`; provide it with `<ThemeContext.Provider value="dark">`.'],
    },
    {
      id: 'custom-hooks',
      title: 'Custom hooks',
      learn: `A custom hook is a function starting with \`use\` that calls other hooks. It shares **logic**, not state: every component that calls it gets its own copy.

\`\`\`
function useToggle(initial = false) {
  const [on, setOn] = useState(initial)
  return [on, () => setOn((v) => !v)]
}
\`\`\``,
      task: 'Write `useToggle(initial = false)` returning `[on, toggle]`, then use it in `Spoiler({ text })`: a "Show"/"Hide" button that reveals the text in a `<p>`.',
      starter: `import { useState } from 'react'

function Spoiler({ text }) {
  return <button>Show</button>
}
`,
      solution: `import { useState } from 'react'

function useToggle(initial = false) {
  const [on, setOn] = useState(initial)
  const toggle = () => setOn((v) => !v)
  return [on, toggle]
}

function Spoiler({ text }) {
  const [open, toggle] = useToggle()
  return (
    <div>
      <button onClick={toggle}>{open ? 'Hide' : 'Show'}</button>
      {open && <p>{text}</p>}
    </div>
  )
}
`,
      tests: [
        ['hidden at first', 'const ui = render(Spoiler, { text: "Secret" }); expect(ui.queryByText("Secret")).toBeNull(); ui.getByText("Show")'],
        ['Show reveals, Hide hides', 'const ui = render(Spoiler, { text: "Secret" }); ui.click(ui.getByText("Show")); ui.getByText("Secret"); ui.click(ui.getByText("Hide")); expect(ui.queryByText("Secret")).toBeNull()'],
        ['useToggle works on its own', 'const T = () => { const [on, t] = useToggle(true); return <button onClick={t}>{String(on)}</button> }; const ui = render(T); ui.click(ui.getByText("true")); ui.getByText("false")'],
      ],
      hints: ['`useToggle` returns an array: `[on, toggle]`.', 'In `Spoiler`: `const [open, toggle] = useToggle()` and `{open && <p>{text}</p>}`.'],
    },
  ],
}
