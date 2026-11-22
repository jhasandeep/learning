import type { SdLesson } from '../types'

const USER = { id: 7, name: 'Asha', email: 'asha@example.com', address: { city: 'Pune', zip: '411001' }, orders: [{ id: 1, total: 250, items: 3 }, { id: 2, total: 90, items: 1 }] }

export const apiStyles: SdLesson = {
  id: 'api-styles',
  title: 'REST, GraphQL, gRPC and WebSockets',
  topic: 'How programs talk',
  blurb: 'The main ways a client and a server exchange data, when to choose each, and how GraphQL lets the client pick its fields.',
  why: {
    story: 'An **API** is the agreed way for one program to ask another for something. There are several styles. **REST** uses plain HTTP and URLs (`GET /users/7`) and is the default for web APIs. **GraphQL** lets the client describe exactly which fields it wants. **gRPC** uses compact binary messages and is popular between internal services. **WebSockets** keep a connection open so the server can push messages (chat, live scores). **SOAP** is an older XML-based style still found in banks and enterprise systems. Choosing well keeps apps fast and teams productive.',
    pains: ['A mobile app downloads a big JSON object but shows only two fields (over-fetching).', 'A screen needs data from three endpoints, so it makes three round trips (under-fetching).', 'Polling a server every second for new messages wastes bandwidth.', 'Internal services spend more time encoding and decoding text than doing real work.'],
  },
  before: {
    title: 'REST: one URL per resource',
    nodes: [
      { id: 'c', label: 'Mobile app', kind: 'client', x: 12, y: 28 },
      { id: 'u', label: 'GET /users/7', kind: 'server', x: 50, y: 12, sub: 'whole user' },
      { id: 'o', label: 'GET /users/7/orders', kind: 'server', x: 50, y: 44, sub: 'all orders' },
      { id: 'db', label: 'Database', kind: 'db', x: 86, y: 28 },
    ],
    edges: [{ from: 'c', to: 'u' }, { from: 'c', to: 'o' }, { from: 'u', to: 'db' }, { from: 'o', to: 'db' }],
    frames: [
      { caption: 'To show a profile card the app needs the **name** and the **number of orders**.', active: ['c'] },
      { caption: 'Request 1: `GET /users/7` returns the whole user: email, address and more. Most of it is thrown away (**over-fetching**).', active: ['c', 'u', 'db'], flow: [['c', 'u'], ['u', 'db']] },
      { caption: 'Request 2: `GET /users/7/orders` returns every order with all details. Two round trips for one small card (**under-fetching**).', active: ['c', 'o', 'db'], flow: [['c', 'o'], ['o', 'db']], bad: ['o'] },
    ],
  },
  how: {
    title: 'GraphQL: the client chooses its fields',
    nodes: [
      { id: 'c', label: 'Mobile app', kind: 'client', x: 14, y: 28 },
      { id: 'g', label: 'POST /graphql', kind: 'gateway', x: 50, y: 28, sub: 'one endpoint' },
      { id: 'db', label: 'Data sources', kind: 'db', x: 86, y: 28 },
    ],
    edges: [{ from: 'c', to: 'g' }, { from: 'g', to: 'db' }],
    frames: [
      { caption: 'The app sends **one query** that lists exactly the fields it needs: `{ user(id: 7) { name orders { id } } }`.', active: ['c', 'g'], flow: [['c', 'g']] },
      { caption: 'The server collects the data from its sources, in one request.', active: ['g', 'db'], flow: [['g', 'db']] },
      { caption: 'The response contains **only** what was asked for, in the same shape as the query. One round trip, no waste.', active: ['c', 'g'], flow: [['g', 'c']], badges: { g: 'JUST RIGHT' } },
      { caption: 'Other styles: **gRPC** sends compact binary messages between internal services, and **WebSockets** keep a connection open so the server can push updates to the client.', active: ['c', 'g'] },
    ],
  },
  tabs: ['REST', 'GraphQL'],
  realWorld: [
    { name: 'REST', text: 'Stripe, GitHub and most public web APIs. Simple, cacheable, understood by every tool. Verbs: GET read, POST create, PUT/PATCH update, DELETE remove.' },
    { name: 'GraphQL', text: 'Created at Facebook for its mobile apps, where bandwidth is precious. GitHub offers a GraphQL API next to REST.' },
    { name: 'gRPC', text: 'Used by Google and many companies for service-to-service calls: Protocol Buffers are small and fast, and it supports streaming.' },
    { name: 'WebSockets', text: 'Chat apps, multiplayer games, live dashboards and trading screens: a two-way connection where the server can push data any time.' },
    { name: 'SOAP and API vs SDK', text: 'SOAP wraps messages in XML with strict contracts (older banking and insurance systems). An **API** is the interface; an **SDK** is a ready-made kit of libraries and tools that wraps the API for one language.' },
  ],
  tradeoffs: {
    gain: ['REST: simple, cacheable, works everywhere.', 'GraphQL: no over- or under-fetching, great for varied clients.', 'gRPC: very fast and strongly typed.', 'WebSockets: real-time push.'],
    cost: ['REST can need many calls and returns extra fields.', 'GraphQL is harder to cache and needs query cost limits.', 'gRPC is awkward in browsers and hard to read by eye.', 'WebSockets keep connections open, which uses server memory.'],
    useWhen: ['Public API: REST.', 'Many different clients with different needs: GraphQL.', 'Internal microservices: gRPC.', 'Chat, live updates: WebSockets.'],
    avoidWhen: ['Do not use WebSockets for ordinary request/response pages.', 'Do not expose raw GraphQL without depth and cost limits.'],
  },
  steps: [
    {
      title: 'REST style: return the whole resource',
      tag: 'slow',
      idea: 'The simplest server returns the entire object every time. The client takes what it needs and discards the rest. It is correct, but it sends more data than necessary.',
      walk: ['Receive the data and the list of wanted fields.', 'Ignore the list.', 'Return everything.'],
      only: [],
      code: {
        python: `def pick(data, query):
    return data
`,
        javascript: `function pick(data, query) {
  return data;
}
`,
      },
      time: 'O(size of data)',
      space: 'O(size of data)',
      verdict: 'Easy, but over-fetches. We want the answer to have the same shape as the query.',
    },
    {
      title: 'GraphQL style: return only the selected fields',
      tag: 'best',
      idea: 'The query is a tree: a key with `true` means "give me this field", a key with a nested object means "go inside and pick from there". If the value is a **list**, apply the same selection to every item. Unknown fields are skipped.',
      walk: ['If `data` is a list, return a list with the selection applied to each item.', 'Otherwise build a new object.', 'For each key in the query: if the data has it, copy it when the selection is `true`, or recurse when it is a nested selection.'],
      code: {
        python: `def pick(data, query):
    if isinstance(data, list):
        return [pick(item, query) for item in data]
    out = {}
    for key, sel in query.items():
        if key not in data:
            continue
        out[key] = data[key] if sel is True else pick(data[key], sel)
    return out
`,
        javascript: `function pick(data, query) {
  if (Array.isArray(data)) return data.map((item) => pick(item, query));
  const out = {};
  for (const [key, sel] of Object.entries(query)) {
    if (!(key in data)) continue;
    out[key] = sel === true ? data[key] : pick(data[key], sel);
  }
  return out;
}
`,
      },
      time: 'O(size of the selection)',
      space: 'O(size of the result)',
      verdict: 'This is the core idea of a GraphQL resolver. Real servers also validate against a schema and fetch each field lazily.',
    },
  ],
  practice: {
    fn: { python: 'pick', javascript: 'pick' },
    starter: {
      python: `def pick(data, query):
    # query is a tree: True means "include this field", a dict means "go inside".
    # If data is a list, apply the same query to every item.
    # Skip fields that do not exist.
    pass
`,
      javascript: `function pick(data, query) {
  // query is a tree: true means "include this field", an object means "go inside".
  // If data is an array, apply the same query to every item.
  // Skip fields that do not exist.
}
`,
    },
    cases: [
      { label: 'pick two simple fields', args: [USER, { name: true, email: true }], expected: { name: 'Asha', email: 'asha@example.com' } },
      { label: 'go inside a nested object', args: [USER, { name: true, address: { city: true } }], expected: { name: 'Asha', address: { city: 'Pune' } } },
      { label: 'apply the selection to every item in a list', args: [USER, { orders: { id: true } }], expected: { orders: [{ id: 1 }, { id: 2 }] } },
      { label: 'missing fields are skipped', args: [USER, { name: true, phone: true }], expected: { name: 'Asha' } },
      { label: 'an empty query returns an empty object', args: [USER, {}], expected: {} },
      { label: 'nested list and object together', args: [USER, { id: true, address: { zip: true }, orders: { total: true } }], expected: { id: 7, address: { zip: '411001' }, orders: [{ total: 250 }, { total: 90 }] } },
    ],
    hints: ['Use recursion: the query for a nested field is itself a query.', 'If `data` is a list, return a new list made by applying `pick` to each element.', 'Copy a field only when the key exists in the data.'],
  },
  quiz: [
    { q: 'A phone app on a slow network keeps downloading large JSON it barely uses. Which style helps most?', options: ['GraphQL, so the app asks only for the fields it needs', 'SOAP', 'Adding more servers'], answer: 0, why: 'GraphQL removes over-fetching by letting the client choose the fields (and combine resources in one request).' },
    { q: 'You are building a live chat. Which fits best?', options: ['Polling a REST endpoint each second', 'WebSockets', 'A nightly batch job'], answer: 1, why: 'WebSockets keep a connection open so the server can push new messages immediately.' },
    { q: 'What is the difference between an API and an SDK?', options: ['They are the same', 'An API is the interface; an SDK is a toolkit of libraries that makes using it easier', 'An SDK is a database'], answer: 1, why: 'The SDK wraps the API in language-specific code, examples and helpers.' },
  ],
  interview: [
    { q: 'REST vs GraphQL: when would you choose each?', a: '**REST** for simple, cacheable, public APIs with predictable resources. **GraphQL** when many clients need different shapes of data, or when screens need data from several resources in one trip. GraphQL costs more to cache and secure (limit query depth and cost).' },
    { q: 'Why use gRPC between microservices?', a: 'It uses **Protocol Buffers** (compact binary), runs over HTTP/2 with multiplexing and streaming, and generates typed client code from a schema. That means lower latency and CPU than JSON over HTTP, at the price of being harder to debug and not browser-friendly.' },
    { q: 'What makes an API idempotent and why does it matter?', a: 'Repeating the call has the same effect as doing it once (`PUT`, `DELETE`, or `POST` with an idempotency key). Networks retry on timeouts, so idempotency prevents things like charging a customer twice.' },
  ],
  mistakes: ['Choosing GraphQL or gRPC when a simple REST API is enough.', 'Using verbs in REST URLs (`/getUser`) instead of resources (`/users/7`).', 'Exposing GraphQL without query depth or cost limits.', 'Keeping WebSocket connections without heartbeats or limits.'],
  recap: 'REST is the default, GraphQL lets clients pick fields, gRPC is fast for internal calls and WebSockets push live data.',
}
