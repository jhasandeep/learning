import type { SpotSet } from './types'

export const react: SpotSet = {
  id: 'react',
  bugs: [
    {
      id: 'mutate-state',
      title: 'Added, but not shown',
      task: 'Clicking "Add" should show the new todo. The array grows (you can log it) but the list never updates.',
      lang: 'jsx',
      code: `function Todos() {
  const [todos, setTodos] = useState([])
  function add(text) {
    todos.push({ id: crypto.randomUUID(), text })
    setTodos(todos)
  }
  return <TodoList todos={todos} onAdd={add} />
}`,
      line: 4,
      also: [5],
      fixed: `function Todos() {
  const [todos, setTodos] = useState([])
  function add(text) {
    setTodos((prev) => [...prev, { id: crypto.randomUUID(), text }])
  }
  return <TodoList todos={todos} onAdd={add} />
}`,
      explain: 'Mutating and passing the ==same array== means `Object.is(old, new)` is true, so React skips the render. Create a new array.',
      difficulty: 'Easy',
    },
    {
      id: 'effect-deps',
      title: 'The profile that never changes',
      task: 'Switching `userId` should load the new user, but the first user stays on screen.',
      lang: 'jsx',
      code: `function Profile({ userId }) {
  const [user, setUser] = useState(null)
  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then((r) => r.json())
      .then(setUser)
  }, [])
  return user ? <h1>{user.name}</h1> : <Spinner />
}`,
      line: 7,
      fix: '  }, [userId])',
      explain: 'An empty dependency array runs the effect only on mount. Every value from the component the effect uses (==`userId`==) belongs in the array.',
      difficulty: 'Easy',
    },
    {
      id: 'interval-cleanup',
      title: 'The clock speeds up',
      task: 'After visiting the page a few times (or in Strict Mode) the clock ticks several times a second.',
      lang: 'jsx',
      code: `function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    setInterval(() => setNow(new Date()), 1000)
  }, [])
  return <time>{now.toLocaleTimeString()}</time>
}`,
      line: 4,
      fixed: `function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return <time>{now.toLocaleTimeString()}</time>
}`,
      explain: 'The interval is never cleared, so each mount adds another one that keeps running after unmount. Return a ==cleanup== that calls `clearInterval`.',
      difficulty: 'Medium',
    },
    {
      id: 'index-key',
      title: 'The wrong row keeps its text',
      task: 'Each row has an uncontrolled `<input>`. After deleting the first row, the inputs show the wrong text.',
      lang: 'jsx',
      code: `function Rows({ rows, onDelete }) {
  return rows.map((row, i) => (
    <div key={i}>
      <input defaultValue={row.label} />
      <button onClick={() => onDelete(row.id)}>Delete</button>
    </div>
  ))
}`,
      line: 3,
      fix: '    <div key={row.id}>',
      explain: 'With index keys, deleting row 0 makes the old row 1 "become" key 0, so React keeps the first input\'s DOM and state. Use a ==stable id== as the key.',
      difficulty: 'Medium',
    },
    {
      id: 'and-zero',
      title: 'A stray 0',
      task: 'When the cart is empty, a "0" appears above the footer.',
      lang: 'jsx',
      code: `function Cart({ items }) {
  return (
    <section>
      {items.length && <ItemList items={items} />}
      <Footer />
    </section>
  )
}`,
      line: 4,
      fix: '      {items.length > 0 && <ItemList items={items} />}',
      explain: '`0 && x` evaluates to `0`, and React renders numbers. Make the condition a ==boolean==.',
      difficulty: 'Easy',
    },
    {
      id: 'stale-updater',
      title: '+3 adds 1',
      task: 'The "+3" button should add 3 to the score, but it only adds 1.',
      lang: 'jsx',
      code: `function Score() {
  const [score, setScore] = useState(0)
  function addThree() {
    for (let i = 0; i < 3; i++) setScore(score + 1)
  }
  return <button onClick={addThree}>{score} (+3)</button>
}`,
      line: 4,
      fix: '    for (let i = 0; i < 3; i++) setScore((s) => s + 1)',
      explain: 'Each call reads the same `score` from this render. The ==updater form== gets the latest queued value.',
      difficulty: 'Medium',
    },
  ],
}
