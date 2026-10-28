import type { TaskPath } from './types'

export const nextjs: TaskPath = {
  id: 'nextjs',
  title: 'Next.js',
  blurb: 'Use the App Router: pages, layouts, server data, client components and API routes.',
  tasks: [
    {
      id: 'page-metadata',
      kind: 'rules',
      language: 'jsx',
      title: 'Create a page with metadata',
      goal: 'Write `app/about/page.js` that becomes the `/about` page and sets its title for Google.',
      steps: [
        'Export a `metadata` object with a `title` and a `description`.',
        'Export a default component `AboutPage` that returns an `<h1>`.',
        'Add a link back to the home page using `Link` from `next/link`.',
      ],
      starter: `// app/about/page.js
export default function AboutPage() {
  return <p>About us</p>;
}`,
      hints: ['In the App Router a folder name is the URL, and `page.js` is what shows.', '`export const metadata = { title: "…", description: "…" };`', '`import Link from "next/link";` then `<Link href="/">Home</Link>`.'],
      solution: `// app/about/page.js
import Link from "next/link";

export const metadata = {
  title: "About us",
  description: "Learn who we are and what we build.",
};

export default function AboutPage() {
  return (
    <main>
      <h1>About us</h1>
      <Link href="/">Home</Link>
    </main>
  );
}`,
      rules: [
        { label: 'Exports a `metadata` object', match: /export\s+const\s+metadata\s*=\s*\{/, hint: 'export const metadata = { … };' },
        { label: 'Metadata has a `title` and a `description`', match: /metadata\s*=\s*\{(?=[\s\S]*title:)(?=[\s\S]*description:)/, hint: 'Add both fields.' },
        { label: 'Has a default-exported page component', match: /export\s+default\s+function\s+\w+/, hint: 'export default function AboutPage() { … }' },
        { label: 'Has an `<h1>`', match: /<h1[\s>]/, hint: 'Return an <h1>About us</h1>.' },
        { label: 'Links home with `Link` from `next/link`', match: /import\s+Link\s+from\s+["']next\/link["'][\s\S]*<Link\s+href=["']\/["']/, hint: 'import Link from "next/link" and use <Link href="/">.' },
      ],
      learned: 'In the App Router folders are routes, `page.js` is the page, and exporting `metadata` is how you control the title and description.',
    },
    {
      id: 'server-fetch',
      kind: 'rules',
      language: 'jsx',
      title: 'Fetch data on the server',
      goal: 'Turn a client-side fetch into a Server Component that loads posts and refreshes every 60 seconds.',
      steps: [
        'Make the page `async` and remove `useState` / `useEffect`.',
        '`await fetch("https://api.example.com/posts")` directly in the component.',
        'Pass `{ next: { revalidate: 60 } }` so the result is cached and refreshed each minute.',
      ],
      starter: `"use client";
import { useEffect, useState } from "react";

export default function Posts() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    fetch("https://api.example.com/posts").then((r) => r.json()).then(setPosts);
  }, []);
  return <ul>{posts.map((p) => <li key={p.id}>{p.title}</li>)}</ul>;
}`,
      hints: ['Server Components can be `async` and can `await` data directly.', 'Delete the "use client" line: the component should run on the server.', '`const res = await fetch(url, { next: { revalidate: 60 } }); const posts = await res.json();`'],
      solution: `export default async function Posts() {
  const res = await fetch("https://api.example.com/posts", {
    next: { revalidate: 60 },
  });
  const posts = await res.json();

  return (
    <ul>
      {posts.map((p) => (
        <li key={p.id}>{p.title}</li>
      ))}
    </ul>
  );
}`,
      rules: [
        { label: 'The component is `async`', match: /export\s+default\s+async\s+function/, hint: 'export default async function Posts()' },
        { label: 'Awaits `fetch(...)` in the component', match: /await\s+fetch\(/, hint: 'const res = await fetch(…);' },
        { label: 'Revalidates every 60 seconds', match: /next:\s*\{\s*revalidate:\s*60\s*\}/, hint: 'Pass { next: { revalidate: 60 } } as the second argument.' },
        { label: 'No `"use client"`', match: /["']use client["']/, absent: true, hint: 'Remove the "use client" directive.' },
        { label: 'No `useState` or `useEffect` left', match: /useState|useEffect/, absent: true, hint: 'The server does the fetching: remove the hooks.' },
      ],
      learned: 'Server Components fetch data on the server with plain `await`, ship no JavaScript for that code, and `revalidate` controls caching.',
    },
    {
      id: 'client-component',
      kind: 'rules',
      language: 'jsx',
      title: 'Add a Client Component',
      goal: 'Create a Like button that needs the browser (state and clicks).',
      steps: [
        'Put `"use client";` as the very first line.',
        'Keep a `likes` number with `useState(0)`.',
        'Render a button that shows the count and adds 1 on click.',
      ],
      starter: `export default function LikeButton() {
  return <button>Like</button>;
}`,
      hints: ['Components are Server Components by default: they cannot use state or `onClick`.', 'The directive is the exact string `"use client";` at the top.', '`onClick={() => setLikes(likes + 1)}`'],
      solution: `"use client";

import { useState } from "react";

export default function LikeButton() {
  const [likes, setLikes] = useState(0);

  return <button onClick={() => setLikes(likes + 1)}>Like ({likes})</button>;
}`,
      rules: [
        { label: 'Starts with `"use client";`', match: /^\s*["']use client["']/, hint: 'The first line must be "use client";' },
        { label: 'Imports `useState`', match: /import\s*\{[^}]*useState[^}]*\}\s*from\s*["']react["']/, hint: 'import { useState } from "react";' },
        { label: 'Keeps `likes` in state', match: /const\s*\[\s*likes\s*,\s*setLikes\s*\]\s*=\s*useState\(\s*0\s*\)/, hint: 'const [likes, setLikes] = useState(0);' },
        { label: 'Adds one on click and shows the count', match: /onClick=\{[^}]*setLikes\([^}]*\}[^>]*>[^<]*\{\s*likes\s*\}/, hint: 'onClick={() => setLikes(likes + 1)} and {likes} in the label.' },
      ],
      learned: '`"use client"` marks the boundary where a component becomes interactive: keep it small and push it as far down the tree as you can.',
    },
    {
      id: 'route-handler',
      kind: 'rules',
      language: 'jsx',
      title: 'Write an API route',
      goal: 'Create `app/api/hello/route.js` that answers `GET /api/hello` with JSON.',
      steps: [
        'Export an `async function GET(request)`.',
        'Read a `name` from the query string with `new URL(request.url).searchParams`.',
        'Return `Response.json({ message: ... })`, defaulting the name to `"world"`.',
      ],
      starter: `// app/api/hello/route.js
export async function GET(request) {
  // your code here
}`,
      hints: ['The exported function name is the HTTP method: GET, POST, …', '`const { searchParams } = new URL(request.url);`', '`searchParams.get("name") ?? "world"`'],
      solution: `// app/api/hello/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "world";
  return Response.json({ message: \`Hello, \${name}\` });
}`,
      rules: [
        { label: 'Exports `async function GET`', match: /export\s+async\s+function\s+GET\(/, hint: 'export async function GET(request) { … }' },
        { label: 'Reads the query string', match: /new\s+URL\(\s*request\.url\s*\)/, hint: 'new URL(request.url).searchParams' },
        { label: 'Uses `searchParams.get("name")`', match: /searchParams\.get\(\s*["']name["']\s*\)/, hint: 'searchParams.get("name")' },
        { label: 'Has a default of "world"', match: /["']world["']/, hint: 'Use ?? "world" for the fallback.' },
        { label: 'Returns JSON with `Response.json`', match: /return\s+(Response|NextResponse)\.json\(/, hint: 'return Response.json({ message: … });' },
      ],
      learned: 'A `route.js` file turns a folder into an API endpoint; each exported HTTP-method function handles that method.',
    },
    {
      id: 'layout-loading',
      kind: 'rules',
      language: 'jsx',
      title: 'Add a layout and a loading state',
      goal: 'Create a shared layout for the dashboard and a `loading.js` file shown while data loads.',
      steps: [
        'In `layout.js` export a default component that renders a `<nav>` and `{children}`.',
        'Add a link to `/dashboard/settings` with `Link`.',
        'Add a `loading` component that returns a "Loading…" message.',
      ],
      starter: `// app/dashboard/layout.js
export default function DashboardLayout() {
  return <div></div>;
}

// app/dashboard/loading.js
`,
      hints: ['Layouts receive the page as `children` and wrap it.', 'Destructure it in the parameter: `({ children })`.', '`loading.js` also needs a default export that returns JSX.'],
      solution: `// app/dashboard/layout.js
import Link from "next/link";

export default function DashboardLayout({ children }) {
  return (
    <div>
      <nav>
        <Link href="/dashboard/settings">Settings</Link>
      </nav>
      {children}
    </div>
  );
}

// app/dashboard/loading.js
export default function Loading() {
  return <p>Loading…</p>;
}`,
      rules: [
        { label: 'The layout receives `{ children }`', match: /DashboardLayout\(\s*\{\s*children\s*\}\s*\)/, hint: 'export default function DashboardLayout({ children })' },
        { label: 'The layout renders `{children}`', match: /\{\s*children\s*\}\s*(\n|<\/)/, hint: 'Render {children} inside the wrapper.' },
        { label: 'Has a `<nav>` with a `Link` to the settings page', match: /<nav[\s>][\s\S]*<Link\s+href=["']\/dashboard\/settings["']/, hint: '<Link href="/dashboard/settings">Settings</Link>' },
        { label: 'Has a default-exported loading component', match: /export\s+default\s+function\s+Loading\(\)/, hint: 'export default function Loading() { … }' },
        { label: 'Loading shows a "Loading" message', match: /Loading[…\.]*<\/\w+>/, hint: 'return <p>Loading…</p>;' },
      ],
      learned: 'Layouts persist across navigation and wrap child pages; `loading.js` gives an instant loading state while the page streams in.',
    },
  ],
}
