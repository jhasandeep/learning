import type { MistakeSet } from './types'

const NAMES_SETUP = `const NAMES = [{ id: 1, name: 'Asha' }, { id: 2, name: 'Ravi' }]`

export const react: MistakeSet = {
  id: 'react',
  title: 'React',
  kind: 'js',
  lang: 'javascript',
  jsx: true,
  items: [
    {
      id: 'counter-state',
      title: 'A counter that updates',
      difficulty: 'Easy',
      task: 'A `Counter` shows `Count: 0` and a `+` button that adds one each click.',
      broken: `import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => count++}>+</button>
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
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  )
}
`,
      demo: 'const ui = render(Counter); ui.click(ui.getByText("+")); ui.click(ui.getByText("+")); console.log(ui.text())',
      tests: [
        ['starts at 0', 'expect(render(Counter).text()).toContain("Count: 0")'],
        ['+ adds one per click', 'const ui = render(Counter); ui.click(ui.getByText("+")); ui.click(ui.getByText("+")); ui.getByText("Count: 2")'],
      ],
      explain: 'Changing a normal variable (`count++`) does not tell React anything, so it never re-renders and the screen stays at 0 (and `count` is a `const`, so it would even throw). State must be changed with its **setter**: `setCount(count + 1)`.',
      hints: ['`count` is a state value. How do you ask React to change it?', '`setCount(count + 1)`.'],
    },
    {
      id: 'missing-import',
      title: 'Hook not imported',
      difficulty: 'Easy',
      task: '`Toggle` shows `OFF`; clicking the button switches it to `ON` and back.',
      broken: `function Toggle() {
  const [on, setOn] = useState(false)

  return <button onClick={() => setOn(!on)}>{on ? 'ON' : 'OFF'}</button>
}
`,
      solution: `import { useState } from 'react'

function Toggle() {
  const [on, setOn] = useState(false)

  return <button onClick={() => setOn(!on)}>{on ? 'ON' : 'OFF'}</button>
}
`,
      demo: 'const ui = render(Toggle); console.log(ui.text()); ui.click(ui.getByText("OFF")); console.log(ui.text())',
      tests: [
        ['starts OFF', 'expect(render(Toggle).text()).toBe("OFF")'],
        ['click turns it ON, again OFF', 'const ui = render(Toggle); ui.click(ui.getByText("OFF")); ui.getByText("ON"); ui.click(ui.getByText("ON")); ui.getByText("OFF")'],
      ],
      explain: '`useState` is not a global: it has to be imported with `import { useState } from \'react\'`. Without it you get `ReferenceError: useState is not defined`. The same goes for `useEffect`, `useRef` and the other hooks.',
      hints: ['Read the error: which name is not defined?', 'Hooks come from the `react` package.'],
    },
    {
      id: 'list-keys',
      title: 'List without keys',
      difficulty: 'Easy',
      task: '`NameList` renders every name in a `<ul>` with one `<li>` each. React must not warn about keys.',
      broken: `function NameList({ names }) {
  return (
    <ul>
      {names.map((n) => (
        <li>{n.name}</li>
      ))}
    </ul>
  )
}
`,
      solution: `function NameList({ names }) {
  return (
    <ul>
      {names.map((n) => (
        <li key={n.id}>{n.name}</li>
      ))}
    </ul>
  )
}
`,
      demo: 'const ui = render(NameList, { names: [{ id: 1, name: "Asha" }, { id: 2, name: "Ravi" }] }); console.log(ui.getAllByTag("li").map((li) => li.children.join("")).join(", ")); console.log("warnings:", ui.warnings.length)',
      tests: [
        ['one <li> per name', 'const ui = render(NameList, { names: [{ id: 1, name: "Asha" }, { id: 2, name: "Ravi" }] }); expect(ui.getAllByTag("li").length).toBe(2)'],
        ['every item has a key (no warning)', 'const ui = render(NameList, { names: [{ id: 1, name: "Asha" }, { id: 2, name: "Ravi" }] }); expect(ui.warnings).toEqual([])'],
      ],
      explain: 'Items rendered with `map` need a stable, unique **`key`** so React can tell them apart when the list changes. Use the item id (`key={n.id}`); avoid the array index when items can be added, removed or reordered.',
      hints: ['React prints "Each child in a list should have a unique key".', 'Put `key={n.id}` on the outer element you return from `map`.'],
    },
    {
      id: 'zero-renders',
      title: 'A stray 0 on screen',
      difficulty: 'Medium',
      task: '`Inbox` shows the unread count in a badge only when it is more than 0. With 0 unread it shows just `Inbox`.',
      broken: `function Inbox({ unread }) {
  return (
    <div>
      <h2>Inbox</h2>
      {unread && <span>{unread} new</span>}
    </div>
  )
}
`,
      solution: `function Inbox({ unread }) {
  return (
    <div>
      <h2>Inbox</h2>
      {unread > 0 && <span>{unread} new</span>}
    </div>
  )
}
`,
      demo: 'console.log(render(Inbox, { unread: 3 }).text()); console.log(render(Inbox, { unread: 0 }).text())',
      tests: [
        ['shows 3 new', 'expect(render(Inbox, { unread: 3 }).text()).toBe("Inbox3 new")'],
        ['shows only Inbox for 0 (no stray 0)', 'expect(render(Inbox, { unread: 0 }).text()).toBe("Inbox")'],
      ],
      explain: '`unread && <span>` returns `unread` itself when it is falsy, and React **renders the number 0**. Make the condition a real boolean: `unread > 0 && …` (or `Boolean(unread) &&`).',
      hints: ['What does `0 && "x"` evaluate to?', 'Compare with `> 0` so the left side is a boolean.'],
    },
    {
      id: 'controlled-input',
      title: 'An input you can type in',
      difficulty: 'Medium',
      task: '`NameBox` has a text input; what you type must show in `Hello, <name>`.',
      broken: `import { useState } from 'react'

function NameBox() {
  const [name, setName] = useState('')

  return (
    <div>
      <input value={name} placeholder="Your name" />
      <p>Hello, {name}</p>
    </div>
  )
}
`,
      solution: `import { useState } from 'react'

function NameBox() {
  const [name, setName] = useState('')

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
      <p>Hello, {name}</p>
    </div>
  )
}
`,
      demo: 'const ui = render(NameBox); ui.type(ui.getByRole("textbox"), "Asha"); console.log(ui.getByText(/Hello/).children.join(""))',
      tests: [
        ['typing updates the greeting', 'const ui = render(NameBox); ui.type(ui.getByRole("textbox"), "Asha"); ui.getByText("Hello, Asha")'],
        ['the input shows what was typed', 'const ui = render(NameBox); ui.type(ui.getByRole("textbox"), "Ravi"); expect(ui.getByRole("textbox").props.value).toBe("Ravi")'],
      ],
      explain: 'An input with `value={name}` is **controlled**: React decides what it shows. Without `onChange` nothing ever updates `name`, so the field looks frozen. Add `onChange={(e) => setName(e.target.value)}`.',
      hints: ['What updates `name` when the user types?', '`onChange={(e) => setName(e.target.value)}`'],
    },
    {
      id: 'todo-add',
      title: 'Todo: add an item',
      difficulty: 'Medium',
      task: '`Todos` has an input and an `Add` button. Adding text appends it to the list and clears the input.',
      broken: `import { useState } from 'react'

function Todos() {
  const [todos, setTodos] = useState([])
  const [text, setText] = useState('')

  function add(e) {
    e.preventDefault()
    if (!text.trim()) return
    setTodos(todos.push({ id: Date.now(), text }))
    setText('')
  }

  return (
    <div>
      <form onSubmit={add}>
        <input value={text} onChange={(e) => setText(e.target.value)} />
        <button>Add</button>
      </form>
      <ul>
        {todos.map((t) => <li key={t.id}>{t.text}</li>)}
      </ul>
    </div>
  )
}
`,
      solution: `import { useState } from 'react'

function Todos() {
  const [todos, setTodos] = useState([])
  const [text, setText] = useState('')

  function add(e) {
    e.preventDefault()
    if (!text.trim()) return
    setTodos([...todos, { id: Date.now(), text }])
    setText('')
  }

  return (
    <div>
      <form onSubmit={add}>
        <input value={text} onChange={(e) => setText(e.target.value)} />
        <button>Add</button>
      </form>
      <ul>
        {todos.map((t) => <li key={t.id}>{t.text}</li>)}
      </ul>
    </div>
  )
}
`,
      demo: 'const ui = render(Todos); for (const w of ["Buy milk", "Write code"]) { ui.type(ui.getByRole("textbox"), w); ui.click(ui.getByText("Add")) } console.log(ui.getAllByTag("li").map((li) => li.children.join("")).join(" | "))',
      tests: [
        ['an added todo shows up', 'const ui = render(Todos); ui.type(ui.getByRole("textbox"), "Buy milk"); ui.click(ui.getByText("Add")); ui.getByText("Buy milk")'],
        ['the input is cleared', 'const ui = render(Todos); ui.type(ui.getByRole("textbox"), "x"); ui.click(ui.getByText("Add")); expect(ui.getByRole("textbox").props.value).toBe("")'],
        ['several todos stack up', 'const ui = render(Todos); for (const w of ["a", "b"]) { ui.type(ui.getByRole("textbox"), w); ui.click(ui.getByText("Add")) } expect(ui.getAllByTag("li").length).toBe(2)'],
      ],
      explain: '`push` **changes the array in place** and returns the **new length** (a number), so `setTodos` stored a number and `todos.map` is no longer a function. Even without that, mutating state in place is wrong: React needs a **new array**. Use `setTodos([...todos, newTodo])`.',
      hints: ['What does `push` return?', 'Build a new array with spread and pass it to `setTodos`: `[...todos, newTodo]`.'],
    },
    {
      id: 'todo-toggle',
      title: 'Todo: tick one off',
      difficulty: 'Medium',
      task: 'Clicking a todo toggles `done`; done todos show with a `✓ ` in front. Other todos stay as they are.',
      broken: `import { useState } from 'react'

function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React', done: false },
    { id: 2, text: 'Build a todo app', done: false },
  ])

  function toggle(id) {
    const todo = todos.find((t) => t.id === id)
    todo.done = !todo.done
    setTodos(todos)
  }

  return (
    <ul>
      {todos.map((t) => (
        <li key={t.id} onClick={() => toggle(t.id)}>{t.done ? '✓ ' : ''}{t.text}</li>
      ))}
    </ul>
  )
}
`,
      solution: `import { useState } from 'react'

function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React', done: false },
    { id: 2, text: 'Build a todo app', done: false },
  ])

  function toggle(id) {
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  return (
    <ul>
      {todos.map((t) => (
        <li key={t.id} onClick={() => toggle(t.id)}>{t.done ? '✓ ' : ''}{t.text}</li>
      ))}
    </ul>
  )
}
`,
      demo: 'const ui = render(TodoList); ui.click(ui.getByText("Learn React")); console.log(ui.getAllByTag("li").map((li) => li.children.join("")).join(" | "))',
      tests: [
        ['clicking ticks the todo', 'const ui = render(TodoList); ui.click(ui.getByText("Learn React")); ui.getByText("✓ Learn React")'],
        ['the other todo is unchanged', 'const ui = render(TodoList); ui.click(ui.getByText("Learn React")); ui.getByText("Build a todo app")'],
        ['clicking again unticks it', 'const ui = render(TodoList); ui.click(ui.getByText("Learn React")); ui.click(ui.getByText("✓ Learn React")); ui.getByText("Learn React")'],
      ],
      explain: 'The code changed the todo object directly and handed React the **same array** back, so React saw no change and skipped the update. Use `map` to create a new array with a **new object** only for the todo you change: `{ ...t, done: !t.done }`.',
      hints: ['`setTodos(todos)` passes the same array again.', '`todos.map((t) => t.id === id ? { ...t, done: !t.done } : t)`'],
    },
    {
      id: 'todo-delete',
      title: 'Todo: delete an item',
      difficulty: 'Easy',
      task: 'Each todo has a `Delete` button that removes that todo only.',
      broken: `import { useState } from 'react'

function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React' },
    { id: 2, text: 'Build a todo app' },
  ])

  const remove = (id) => setTodos(todos.filter((t) => t.id === id))

  return (
    <ul>
      {todos.map((t) => (
        <li key={t.id}>
          {t.text} <button onClick={() => remove(t.id)}>Delete</button>
        </li>
      ))}
    </ul>
  )
}
`,
      solution: `import { useState } from 'react'

function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React' },
    { id: 2, text: 'Build a todo app' },
  ])

  const remove = (id) => setTodos(todos.filter((t) => t.id !== id))

  return (
    <ul>
      {todos.map((t) => (
        <li key={t.id}>
          {t.text} <button onClick={() => remove(t.id)}>Delete</button>
        </li>
      ))}
    </ul>
  )
}
`,
      demo: 'const ui = render(TodoList); ui.click(ui.getAllByText("Delete")[0]); console.log(ui.getAllByTag("li").map((li) => li.children.join("")).join(" | "))',
      tests: [
        ['deleting the first leaves the second', 'const ui = render(TodoList); ui.click(ui.getAllByText("Delete")[0]); expect(ui.getAllByTag("li").length).toBe(1); ui.getByText(/Build a todo app/)'],
        ['the deleted one is gone', 'const ui = render(TodoList); ui.click(ui.getAllByText("Delete")[0]); expect(ui.queryByText(/Learn React/)).toBe(null)'],
      ],
      explain: '`filter` **keeps** the items for which the callback is true. `t.id === id` keeps only the one you wanted to delete. To remove it, keep everything else: `t.id !== id`.',
      hints: ['After clicking Delete, which todos are left on screen?', 'Flip the comparison: `!==`.'],
    },
    {
      id: 'fetch-names',
      title: 'fetch: show names from the API',
      difficulty: 'Medium',
      task: '`Names` loads `/api/names` with `fetch` when it appears, then lists the names. (A fake `fetch` returns Asha and Ravi.)',
      setup: `${NAMES_SETUP}
const fetch = async (url) => ({ ok: true, json: async () => NAMES })`,
      broken: `import { useState, useEffect } from 'react'

function Names() {
  const [names, setNames] = useState([])

  useEffect(() => {
    fetch('/api/names')
      .then((res) => setNames(res))
  }, [])

  return (
    <ul>
      {names.map((n) => <li key={n.id}>{n.name}</li>)}
    </ul>
  )
}
`,
      solution: `import { useState, useEffect } from 'react'

function Names() {
  const [names, setNames] = useState([])

  useEffect(() => {
    fetch('/api/names')
      .then((res) => res.json())
      .then((data) => setNames(data))
  }, [])

  return (
    <ul>
      {names.map((n) => <li key={n.id}>{n.name}</li>)}
    </ul>
  )
}
`,
      demo: 'const ui = render(Names); await ui.flush(); console.log(ui.getAllByTag("li").map((li) => li.children.join("")).join(", "))',
      tests: [
        ['lists the names from the API', 'const ui = render(Names); await ui.flush(); expect(ui.getAllByTag("li").map((li) => li.children.join(""))).toEqual(["Asha", "Ravi"])'],
      ],
      explain: '`fetch` resolves to a **Response**, not to your data. The body must be read with `res.json()` (which returns another promise), so you need a second `.then`. Putting the Response into state breaks `names.map`.',
      hints: ['What does the first `.then` receive: the data or something else?', 'Add `.then((res) => res.json())` before setting state.'],
    },
    {
      id: 'axios-names',
      title: 'axios: set data in state',
      difficulty: 'Medium',
      task: '`Names` loads the list with `axios.get` and shows each name. (A fake `axios` returns Asha and Ravi.)',
      setup: `${NAMES_SETUP}
const axios = { get: async (url) => ({ status: 200, data: NAMES }) }`,
      broken: `import { useState, useEffect } from 'react'

function Names() {
  const [names, setNames] = useState([])

  useEffect(() => {
    axios.get('/api/names').then((res) => setNames(res))
  }, [])

  return (
    <ul>
      {names.map((n) => <li key={n.id}>{n.name}</li>)}
    </ul>
  )
}
`,
      solution: `import { useState, useEffect } from 'react'

function Names() {
  const [names, setNames] = useState([])

  useEffect(() => {
    axios.get('/api/names').then((res) => setNames(res.data))
  }, [])

  return (
    <ul>
      {names.map((n) => <li key={n.id}>{n.name}</li>)}
    </ul>
  )
}
`,
      demo: 'const ui = render(Names); await ui.flush(); console.log(ui.getAllByTag("li").map((li) => li.children.join("")).join(", "))',
      tests: [
        ['lists the names', 'const ui = render(Names); await ui.flush(); expect(ui.getAllByTag("li").map((li) => li.children.join(""))).toEqual(["Asha", "Ravi"])'],
      ],
      explain: 'axios wraps the result in a response object (`status`, `headers`, `data`…). The array you want is in **`res.data`**. Passing `res` to `setNames` stores the whole response object, and `.map` is not a function on it. (Unlike `fetch`, axios already parses the JSON.)',
      hints: ['What does `res` contain in axios?', '`setNames(res.data)`.'],
    },
  ],
}
