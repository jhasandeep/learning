import type { SdLesson } from '../types'

const USERS = [{ id: 1, name: 'Asha' }, { id: 2, name: 'Ravi' }, { id: 3, name: 'Meera' }]

export const sqlVsNosql: SdLesson = {
  id: 'sql-vs-nosql',
  title: 'SQL vs NoSQL databases',
  topic: 'Choosing where data lives',
  blurb: 'Tables with joins, or documents, key-value pairs, wide columns and graphs? Learn what each is good at and build a join.',
  why: {
    story: 'A **relational (SQL) database** stores data in **tables** with fixed columns and links rows with **keys**; you combine tables with **joins** and get strong guarantees (see ACID). **NoSQL** is a family of other models, built for flexible data or huge scale: **document** (JSON-like records), **key-value** (a giant dictionary), **wide-column** (rows with many sparse columns) and **graph** (nodes and relationships). There is no winner: the right choice depends on your data shape and access patterns.',
    pains: ['Forcing highly connected data into tables makes queries slow and awkward.', 'Forcing financial data into loose documents risks inconsistency.', 'Changing a table with a billion rows is painful.', 'One model rarely fits every part of a big system.'],
  },
  before: {
    title: 'Relational: tables and joins',
    nodes: [
      { id: 'u', label: 'users table', kind: 'db', x: 16, y: 14, sub: 'id, name' },
      { id: 'o', label: 'orders table', kind: 'db', x: 16, y: 44, sub: 'id, user_id, item' },
      { id: 'j', label: 'JOIN', kind: 'service', x: 56, y: 28, sub: 'match user_id = id' },
      { id: 'r', label: 'Result', kind: 'client', x: 88, y: 28, sub: 'name + item' },
    ],
    edges: [{ from: 'u', to: 'j' }, { from: 'o', to: 'j' }, { from: 'j', to: 'r' }],
    frames: [
      { caption: 'Data is split into tables to avoid repetition: each fact is stored **once** (the user\'s name lives only in `users`).', active: ['u', 'o'] },
      { caption: 'A query **joins** the tables on a key: for each order, find the user with that id.', active: ['u', 'o', 'j'], flow: [['u', 'j'], ['o', 'j']] },
      { caption: 'The result combines both: name and item. SQL gives strong consistency, flexible queries and transactions.', active: ['j', 'r'], flow: [['j', 'r']] },
    ],
  },
  how: {
    title: 'The four NoSQL families',
    nodes: [
      { id: 'doc', label: 'Document', kind: 'db', x: 16, y: 14, sub: 'MongoDB' },
      { id: 'kv', label: 'Key-value', kind: 'cache', x: 16, y: 44, sub: 'Redis, DynamoDB' },
      { id: 'col', label: 'Wide column', kind: 'db', x: 62, y: 14, sub: 'Cassandra' },
      { id: 'gr', label: 'Graph', kind: 'db', x: 62, y: 44, sub: 'Neo4j' },
      { id: 'app', label: 'Your use case', kind: 'client', x: 88, y: 28 },
    ],
    edges: [{ from: 'doc', to: 'app' }, { from: 'kv', to: 'app' }, { from: 'col', to: 'app' }, { from: 'gr', to: 'app' }],
    frames: [
      { caption: '**Document**: store a whole object as JSON, such as a product with its reviews. Flexible shape, easy to read in one go. Good for catalogues and profiles.', active: ['doc', 'app'], flow: [['doc', 'app']] },
      { caption: '**Key-value**: `key -> value`, very fast lookups. Good for sessions, caches and counters.', active: ['kv', 'app'], flow: [['kv', 'app']] },
      { caption: '**Wide column**: rows grouped by a partition key with many columns, built for enormous write volumes. Good for time series, messages and logs.', active: ['col', 'app'], flow: [['col', 'app']] },
      { caption: '**Graph**: nodes and relationships, with fast traversal ("friends of friends"). Good for social networks and recommendations.', active: ['gr', 'app'], flow: [['gr', 'app']] },
    ],
  },
  tabs: ['SQL (relational)', 'NoSQL families'],
  realWorld: [
    { name: 'Banks and e-commerce orders', text: 'Choose SQL (PostgreSQL, MySQL, Oracle) for money, orders and inventory, where transactions and consistency matter.' },
    { name: 'Product catalogues and CMS', text: 'Documents (MongoDB) fit items whose fields vary, such as a phone vs a shirt.' },
    { name: 'Sessions and leaderboards', text: 'Key-value stores (Redis) give microsecond reads; DynamoDB scales key lookups without limit.' },
    { name: 'Chat history, IoT, activity feeds', text: 'Wide-column stores (Cassandra, HBase) absorb millions of writes per second, partitioned by user or device.' },
    { name: 'Friend suggestions, fraud rings', text: 'Graph databases (Neo4j) follow relationships many hops deep far faster than repeated joins.' },
  ],
  tradeoffs: {
    gain: ['SQL: transactions, joins, ad-hoc queries, mature tools.', 'NoSQL: flexible schema, horizontal scale, specialised speed.'],
    cost: ['SQL: harder to scale writes across machines.', 'NoSQL: weaker joins and often weaker consistency; you design around your queries.'],
    useWhen: ['SQL: structured data with relationships and the need for correctness.', 'NoSQL: huge scale, flexible data, simple access patterns.'],
    avoidWhen: ['NoSQL just because it is trendy.', 'SQL for a single huge key-value workload.'],
  },
  steps: [
    {
      title: 'Nested loops: compare every pair',
      tag: 'slow',
      idea: 'For each order, scan the whole user list to find the matching user. It is easy and correct, but with `n` orders and `m` users it does `n x m` comparisons.',
      walk: ['For each order, loop over all users.', 'When `user.id == order.user_id`, add `[name, item]` to the result.', 'Orders with no matching user are dropped (inner join).'],
      code: {
        python: `def inner_join(users, orders):
    out = []
    for order in orders:
        for user in users:
            if user["id"] == order["user_id"]:
                out.append([user["name"], order["item"]])
    return out
`,
        javascript: `function innerJoin(users, orders) {
  const out = [];
  for (const order of orders) {
    for (const user of users) {
      if (user.id === order.user_id) out.push([user.name, order.item]);
    }
  }
  return out;
}
`,
      },
      time: 'O(orders x users)',
      space: 'O(result)',
      verdict: 'Fine for tiny tables. Real databases do better with an index.',
    },
    {
      title: 'Hash join: index one side first',
      tag: 'best',
      idea: 'Build a dictionary from user id to name once (like a database index), then look up each order in O(1). This is a **hash join**.',
      walk: ['Build `names = {id: name}` from the users.', 'For each order, look up `user_id` in `names`.', 'Skip orders whose user does not exist.'],
      code: {
        python: `def inner_join(users, orders):
    names = {u["id"]: u["name"] for u in users}
    out = []
    for order in orders:
        if order["user_id"] in names:
            out.append([names[order["user_id"]], order["item"]])
    return out
`,
        javascript: `function innerJoin(users, orders) {
  const names = new Map(users.map((u) => [u.id, u.name]));
  const out = [];
  for (const order of orders) {
    if (names.has(order.user_id)) out.push([names.get(order.user_id), order.item]);
  }
  return out;
}
`,
      },
      time: 'O(users + orders)',
      space: 'O(users)',
      verdict: 'This is how databases make joins fast with indexes. In a document database you would avoid the join by embedding the name inside each order, trading duplication for read speed.',
    },
  ],
  practice: {
    fn: { python: 'inner_join', javascript: 'innerJoin' },
    starter: {
      python: `def inner_join(users, orders):
    # users: [{"id", "name"}], orders: [{"user_id", "item"}]
    # return [name, item] for each order that has a matching user, in order-list order.
    pass
`,
      javascript: `function innerJoin(users, orders) {
  // users: [{ id, name }], orders: [{ user_id, item }]
  // return [name, item] for each order that has a matching user, in order-list order.
}
`,
    },
    cases: [
      { label: 'match orders to users', args: [USERS, [{ user_id: 1, item: 'book' }, { user_id: 2, item: 'pen' }]], expected: [['Asha', 'book'], ['Ravi', 'pen']] },
      { label: 'one user with several orders', args: [USERS, [{ user_id: 3, item: 'a' }, { user_id: 3, item: 'b' }]], expected: [['Meera', 'a'], ['Meera', 'b']] },
      { label: 'orders without a matching user are dropped', args: [USERS, [{ user_id: 9, item: 'ghost' }, { user_id: 1, item: 'cup' }]], expected: [['Asha', 'cup']] },
      { label: 'no orders', args: [USERS, []], expected: [] },
      { label: 'no users', args: [[], [{ user_id: 1, item: 'x' }]], expected: [] },
      { label: 'the result follows the order of the orders', args: [USERS, [{ user_id: 2, item: 'z' }, { user_id: 1, item: 'y' }]], expected: [['Ravi', 'z'], ['Asha', 'y']] },
    ],
    hints: ['First build a dictionary from user id to name.', 'Then walk the orders in order, looking up each `user_id`.', 'Skip orders whose id is not in the dictionary.'],
  },
  quiz: [
    { q: 'Which database fits a banking ledger best?', options: ['A relational database with transactions', 'A key-value cache', 'A graph database'], answer: 0, why: 'Money needs ACID transactions and strict consistency, which relational databases are built for.' },
    { q: 'You need "friends of friends of friends" recommendations. Which family?', options: ['Key-value', 'Graph', 'Wide column'], answer: 1, why: 'Graph databases traverse relationships quickly without repeated joins.' },
    { q: 'Why can a document store avoid a join?', options: ['It stores related data together inside one document (denormalised)', 'It has no data', 'It ignores keys'], answer: 0, why: 'Embedding related data means one read returns it all, at the cost of duplication and harder updates.' },
  ],
  interview: [
    { q: 'How do you choose between SQL and NoSQL?', a: 'Start from **data shape and access patterns**. Use SQL for structured, relational data needing transactions and ad-hoc queries. Use NoSQL when you need massive horizontal scale, flexible schema, or a specialised model (key-value speed, graph traversal). Many systems use **both** (polyglot persistence).' },
    { q: 'Does NoSQL mean no transactions or no consistency?', a: 'Not necessarily. Many NoSQL databases offer transactions in limited scope (one document or partition) and tunable consistency. The general trade is flexibility and scale for fewer cross-record guarantees.' },
    { q: 'What is normalisation vs denormalisation?', a: '**Normalisation** stores each fact once across tables (less duplication, consistent updates, needs joins). **Denormalisation** duplicates data so reads need no join (faster reads, harder updates). SQL leans normalised, document stores lean denormalised.' },
  ],
  mistakes: ['Choosing NoSQL for hype or SQL out of habit, without looking at the access patterns.', 'Using a document store but modelling it like tables and joins.', 'Joining huge tables without indexes.', 'Using one database for everything when parts of the system differ a lot.'],
  recap: 'SQL is for structured, relational, transactional data; NoSQL families trade joins and strictness for flexibility and scale.',
}
