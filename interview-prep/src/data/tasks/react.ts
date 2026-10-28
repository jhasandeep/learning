import type { TaskPath } from './types'

export const react: TaskPath = {
  id: 'react',
  title: 'React',
  blurb: 'Build components: props, state, lists, effects and controlled inputs.',
  tasks: [
    {
      id: 'props',
      kind: 'rules',
      language: 'jsx',
      title: 'Build a component with props',
      goal: 'Create a reusable `Greeting` component and use it twice in `App`.',
      steps: [
        'Write `function Greeting({ name, role = "student" })` that returns `<h1>Hello, {name}</h1>` and a paragraph with the role.',
        'In `App`, render `<Greeting name="Asha" />` and `<Greeting name="Ravi" role="mentor" />`.',
        'Wrap both in one parent element (or a fragment).',
      ],
      starter: `function Greeting() {
  return <h1>Hello</h1>;
}

export default function App() {
  return <Greeting />;
}`,
      hints: ['Props arrive as one object: destructure them in the parameter list.', 'Curly braces put JavaScript values in JSX: `{name}`.', 'A fragment `<> … </>` lets you return two siblings.'],
      solution: `function Greeting({ name, role = "student" }) {
  return (
    <div>
      <h1>Hello, {name}</h1>
      <p>Role: {role}</p>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Greeting name="Asha" />
      <Greeting name="Ravi" role="mentor" />
    </>
  );
}`,
      rules: [
        { label: '`Greeting` destructures `name` and `role` from its props', match: /function\s+Greeting\(\s*\{\s*name\s*,\s*role/, hint: 'function Greeting({ name, role = "student" })' },
        { label: '`role` has a default value', match: /role\s*=\s*["'][^"']+["']/, hint: 'Give role a default: role = "student".' },
        { label: 'Shows the name with `{name}`', match: /\{\s*name\s*\}/, hint: 'Use <h1>Hello, {name}</h1>.' },
        { label: 'Shows the role with `{role}`', match: /\{\s*role\s*\}/, hint: 'Show it in a paragraph: <p>Role: {role}</p>.' },
        { label: '`App` renders `Greeting` twice', match: /<Greeting\s[^>]*name=/, min: 2, hint: 'Add one <Greeting name="…" /> per person.' },
      ],
      learned: 'Components are functions that return UI; props are their inputs, so one component can render many different results.',
    },
    {
      id: 'counter-state',
      kind: 'rules',
      language: 'jsx',
      title: 'Add state with useState',
      goal: 'Build a counter with a +1 button and a reset button.',
      steps: [
        'Import `useState` and create `const [count, setCount] = useState(0)`.',
        'Show the count, and a button whose `onClick` calls `setCount(count + 1)`.',
        'Add a Reset button that sets it back to 0. Never change `count` directly.',
      ],
      starter: `export default function Counter() {
  let count = 0;

  return (
    <div>
      <p>Count: {count}</p>
      <button>+1</button>
    </div>
  );
}`,
      hints: ['`useState(0)` returns the value and a setter function.', 'Pass a function to `onClick`: `onClick={() => setCount(count + 1)}`.', 'A normal `let` variable is reset on every render and does not update the screen.'],
      solution: `import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}`,
      rules: [
        { label: 'Imports `useState` from "react"', match: /import\s*\{[^}]*useState[^}]*\}\s*from\s*["']react["']/, hint: 'import { useState } from "react";' },
        { label: 'Declares `const [count, setCount] = useState(0)`', match: /const\s*\[\s*count\s*,\s*setCount\s*\]\s*=\s*useState\(\s*0\s*\)/, hint: 'Replace the let variable with useState.' },
        { label: 'The +1 button calls `setCount(count + 1)`', match: /onClick=\{\s*\(\)\s*=>\s*setCount\(\s*count\s*\+\s*1\s*\)\s*\}/, hint: 'onClick={() => setCount(count + 1)}' },
        { label: 'There is a reset button using `setCount(0)`', match: /setCount\(\s*0\s*\)/, hint: 'Add <button onClick={() => setCount(0)}>Reset</button>.' },
        { label: 'Does not change `count` directly', match: /\bcount\s*(\+\+|\+=|=[^=])/, absent: true, hint: 'Always use setCount instead of assigning to count.' },
      ],
      learned: 'State is data React remembers between renders; calling its setter re-renders the component so the screen always matches the data.',
    },
    {
      id: 'list-keys',
      kind: 'rules',
      language: 'jsx',
      title: 'Render a list with keys',
      goal: 'Show a to-do list from an array, with a stable `key` on each item.',
      steps: [
        'Use `todos.map(...)` to create one `<li>` per to-do.',
        'Give each `<li>` `key={todo.id}`.',
        'Show the text, and a ✓ before finished items with `todo.done ? ...`.',
      ],
      starter: `const todos = [
  { id: 1, text: "Learn JSX", done: true },
  { id: 2, text: "Learn state", done: false },
];

export default function TodoList() {
  return <ul></ul>;
}`,
      hints: ['`map` turns an array of data into an array of elements.', 'The key must be unique and stable: use the id, not the index.', 'A ternary works inside JSX: `{todo.done ? "✓ " : ""}`.'],
      solution: `const todos = [
  { id: 1, text: "Learn JSX", done: true },
  { id: 2, text: "Learn state", done: false },
];

export default function TodoList() {
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          {todo.done ? "✓ " : ""}
          {todo.text}
        </li>
      ))}
    </ul>
  );
}`,
      rules: [
        { label: 'Uses `todos.map(...)`', match: /todos\.map\(/, hint: 'Call .map on the todos array inside <ul>.' },
        { label: 'Each `<li>` has `key={todo.id}`', match: /<li\s+key=\{\s*todo\.id\s*\}/, hint: 'Write <li key={todo.id}>.' },
        { label: 'Shows `todo.text`', match: /\{\s*todo\.text\s*\}/, hint: 'Render {todo.text} inside the li.' },
        { label: 'Marks finished items using `todo.done`', match: /todo\.done\s*\?/, hint: 'Use todo.done ? "✓ " : "".' },
      ],
      learned: 'Lists are just arrays mapped to elements; a stable `key` lets React track each item when the list changes.',
    },
    {
      id: 'effect-fetch',
      kind: 'rules',
      language: 'jsx',
      title: 'Load data with useEffect',
      goal: 'Fetch a user once when the component appears, showing a loading message first.',
      steps: [
        'Keep `user` (start `null`) and `loading` (start `true`) in state.',
        'In `useEffect`, fetch `/api/user`, store the JSON and set `loading` to false.',
        'Use an empty dependency array `[]` so it runs only once, and show "Loading…" while waiting.',
      ],
      starter: `import { useState } from "react";

export default function Profile() {
  return <p>…</p>;
}`,
      hints: ['`useEffect(() => { … }, [])` runs after the first render only.', 'Inside the effect: `fetch(url).then(r => r.json()).then(setUser)`.', 'Return early in JSX: `if (loading) return <p>Loading…</p>;`'],
      solution: `import { useEffect, useState } from "react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading…</p>;
  return <h1>{user.name}</h1>;
}`,
      rules: [
        { label: 'Imports `useEffect` and `useState`', match: /import\s*\{(?=[^}]*useEffect)(?=[^}]*useState)[^}]*\}\s*from\s*["']react["']/, hint: 'import { useEffect, useState } from "react";' },
        { label: 'Has `user` and `loading` state', match: /useState\(\s*(null|true)\s*\)/, min: 2, hint: 'const [user, setUser] = useState(null); const [loading, setLoading] = useState(true);' },
        { label: 'Calls `fetch("/api/user")` inside `useEffect`', match: /useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*fetch\(\s*["']\/api\/user["']/, hint: 'Put the fetch inside the effect function.' },
        { label: 'Uses an empty dependency array `[]`', match: /\}\s*,\s*\[\s*\]\s*\)/, hint: 'End the effect with }, []);' },
        { label: 'Shows a loading message', match: /loading[\s\S]*Loading/, hint: 'Return <p>Loading…</p> while loading is true.' },
      ],
      learned: '`useEffect` runs code after rendering to sync with the outside world, and its dependency array decides when it runs again.',
    },
    {
      id: 'controlled-input',
      kind: 'rules',
      language: 'jsx',
      title: 'Create a controlled input',
      goal: 'A text box that shows what you type in a live preview below it.',
      steps: [
        'Store the text in state: `const [text, setText] = useState("")`.',
        'Bind the input with `value={text}` and `onChange={(e) => setText(e.target.value)}`.',
        'Show the text in a paragraph with `{text}`.',
      ],
      starter: `import { useState } from "react";

export default function Preview() {
  return (
    <div>
      <input placeholder="Type here" />
      <p>You typed: </p>
    </div>
  );
}`,
      hints: ['A controlled input gets its value from state, not from the DOM.', 'The event object is `e`; the typed text is `e.target.value`.', 'Both `value` and `onChange` are needed.'],
      solution: `import { useState } from "react";

export default function Preview() {
  const [text, setText] = useState("");

  return (
    <div>
      <input
        placeholder="Type here"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <p>You typed: {text}</p>
    </div>
  );
}`,
      rules: [
        { label: 'Stores the text in state', match: /const\s*\[\s*text\s*,\s*setText\s*\]\s*=\s*useState\(\s*["']{2}\s*\)/, hint: 'const [text, setText] = useState("");' },
        { label: 'The input has `value={text}`', match: /<input[^>]*value=\{\s*text\s*\}/, hint: 'Add value={text} to the input.' },
        { label: 'The input updates state in `onChange`', match: /onChange=\{\s*\(\s*e\s*\)\s*=>\s*setText\(\s*e\.target\.value\s*\)\s*\}/, hint: 'onChange={(e) => setText(e.target.value)}' },
        { label: 'Shows the live text with `{text}`', match: /<p>[^<]*\{\s*text\s*\}/, hint: 'Write <p>You typed: {text}</p>.' },
      ],
      learned: 'In a controlled input React state is the single source of truth: the screen shows the state and typing updates the state.',
    },
  ],
}
