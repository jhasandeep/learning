import type { SdLesson } from '../types'

export const microservices: SdLesson = {
  id: 'microservices',
  title: 'Microservices vs monolith',
  topic: 'Splitting an application',
  blurb: 'One big application, or many small services? See the trade-offs and write the startup-order logic every service platform needs.',
  why: {
    story: 'A **monolith** is one application that contains everything: users, orders, payments, search. It is simple to build and deploy at first. As the team and traffic grow, it becomes hard: every change redeploys everything, one bug can take down all features, and different parts cannot scale separately. **Microservices** split the system into small services, each owning one job and its own data, talking over the network. Teams can deploy and scale independently, at the price of much more operational complexity.',
    pains: ['One huge codebase that everybody must change together.', 'A slow release because any small fix means redeploying everything.', 'The search feature needs ten times more servers than the profile page, but you must scale the whole app.', 'A memory leak in one module crashes the entire application.'],
  },
  before: {
    title: 'Monolith: everything in one process',
    nodes: [
      { id: 'u', label: 'Users', kind: 'user', x: 10, y: 28 },
      { id: 'm', label: 'Monolith', kind: 'server', x: 48, y: 28, sub: 'users + orders + pay + search' },
      { id: 'db', label: 'One database', kind: 'db', x: 86, y: 28 },
    ],
    edges: [{ from: 'u', to: 'm' }, { from: 'm', to: 'db' }],
    frames: [
      { caption: 'All features live in one application with one database. Simple to start: one thing to build, test and run.', active: ['u', 'm', 'db'], flow: [['u', 'm'], ['m', 'db']] },
      { caption: 'Over time the code grows tangled. Every small change means testing and deploying the whole thing.', active: ['m'], badges: { m: 'BIG' } },
      { caption: 'A bug in one feature can crash the entire application, and scaling means copying everything.', bad: ['m'], badges: { m: 'CRASH' } },
    ],
  },
  how: {
    title: 'Microservices: small services behind a gateway',
    nodes: [
      { id: 'u', label: 'Users', kind: 'user', x: 8, y: 28 },
      { id: 'g', label: 'API gateway', kind: 'gateway', x: 32, y: 28 },
      { id: 'us', label: 'User service', kind: 'service', x: 62, y: 8, sub: 'own DB' },
      { id: 'os', label: 'Order service', kind: 'service', x: 62, y: 28, sub: 'own DB' },
      { id: 'ps', label: 'Payment service', kind: 'service', x: 62, y: 48, sub: 'own DB' },
      { id: 'q', label: 'Event bus', kind: 'queue', x: 90, y: 28 },
    ],
    edges: [{ from: 'u', to: 'g' }, { from: 'g', to: 'us' }, { from: 'g', to: 'os' }, { from: 'g', to: 'ps' }, { from: 'os', to: 'q' }, { from: 'q', to: 'ps' }],
    frames: [
      { caption: 'Each service has **one responsibility** and its **own database**, owned by one small team.', active: ['us', 'os', 'ps'] },
      { caption: 'Users talk to one **API gateway**, which routes the request to the right service.', active: ['u', 'g', 'os'], flow: [['u', 'g'], ['g', 'os']] },
      { caption: 'Services talk to each other with calls, or with **events** on a message bus, so they do not depend on one another being up.', active: ['os', 'q', 'ps'], flow: [['os', 'q'], ['q', 'ps']] },
      { caption: 'The payment service crashes? Orders still work and wait in the queue. Busy search? Scale only that service.', bad: ['ps'], badges: { ps: 'DOWN', q: 'BUFFER' } },
    ],
  },
  realWorld: [
    { name: 'Netflix, Amazon, Uber', text: 'Run hundreds or thousands of microservices, each owned by a team that deploys several times a day.' },
    { name: 'Start as a monolith', text: 'Many successful companies (Shopify, Stack Overflow) run large well-structured **modular monoliths**. Splitting too early is a common mistake.' },
    { name: 'Kubernetes and Docker', text: 'Containers and orchestration made it practical to run and scale many small services.' },
    { name: 'Service discovery', text: 'Services find each other through a registry (Consul, Kubernetes DNS) because their addresses change as they scale.' },
  ],
  tradeoffs: {
    gain: ['Independent deployment and scaling per service.', 'Failures are isolated; teams work in parallel.', 'Each service can use the best technology for its job.'],
    cost: ['Network calls are slower and can fail; you need retries, timeouts and circuit breakers.', 'Data is spread out: no simple joins or transactions across services (use sagas).', 'Much more to operate: monitoring, tracing, deployment pipelines.'],
    useWhen: ['Large teams and a large, clearly separable system.', 'Parts of the system have very different scaling needs.'],
    avoidWhen: ['A small team or a new product: start with a modular monolith.', 'You cannot yet operate containers, monitoring and CI/CD.'],
  },
  steps: [
    {
      title: 'Start in alphabetical order',
      tag: 'slow',
      idea: 'A simple way to start services is by name. It works only when no service depends on one that comes later in the alphabet. Real platforms need to start **dependencies first**.',
      walk: ['Take all the service names.', 'Sort them alphabetically.', 'Return the list (ignoring dependencies completely).'],
      only: [0, 2, 4],
      code: {
        python: `def startup_order(services):
    return sorted(services)
`,
        javascript: `function startupOrder(services) {
  return Object.keys(services).sort();
}
`,
      },
      time: 'O(n log n)',
      space: 'O(n)',
      verdict: 'Breaks as soon as `api` needs `auth`, which needs `db`. We need a proper ordering.',
    },
    {
      title: 'Topological order: dependencies first',
      tag: 'best',
      idea: 'Start services with no unmet dependencies, then unlock those that were waiting for them (**Kahn\'s algorithm**). To make the result deterministic, among ready services always take the alphabetically first. If some services remain that can never become ready, there is a **dependency cycle** and no valid order exists: return `None`.',
      walk: ['Count each service\'s dependencies and remember who depends on whom.', 'Put services with zero dependencies in a ready list (sorted).', 'Take the first ready service, add it to the order, and reduce the count of services waiting for it; newly ready ones join the list.', 'If the order contains every service, return it; otherwise there is a cycle: return None.'],
      code: {
        python: `def startup_order(services):
    waiting = {name: len(deps) for name, deps in services.items()}
    users = {name: [] for name in services}
    for name, deps in services.items():
        for dep in deps:
            users[dep].append(name)
    ready = sorted(n for n, count in waiting.items() if count == 0)
    order = []
    while ready:
        name = ready.pop(0)
        order.append(name)
        for user in users[name]:
            waiting[user] -= 1
            if waiting[user] == 0:
                ready.append(user)
        ready.sort()
    return order if len(order) == len(services) else None
`,
        javascript: `function startupOrder(services) {
  const waiting = {};
  const users = {};
  for (const name of Object.keys(services)) {
    waiting[name] = services[name].length;
    users[name] = [];
  }
  for (const [name, deps] of Object.entries(services)) {
    for (const dep of deps) users[dep].push(name);
  }
  const ready = Object.keys(waiting).filter((n) => waiting[n] === 0).sort();
  const order = [];
  while (ready.length > 0) {
    const name = ready.shift();
    order.push(name);
    for (const user of users[name]) {
      waiting[user] -= 1;
      if (waiting[user] === 0) ready.push(user);
    }
    ready.sort();
  }
  return order.length === Object.keys(services).length ? order : null;
}
`,
      },
      time: 'O((n + edges) log n)',
      space: 'O(n + edges)',
      verdict: 'The same algorithm decides build order, task schedules and service start-up. A cycle means two services wait for each other forever (deadlock).',
    },
  ],
  practice: {
    fn: { python: 'startup_order', javascript: 'startupOrder' },
    starter: {
      python: `def startup_order(services):
    # services maps each service name to the list of services it depends on.
    # Return the names in an order where every service comes after its dependencies.
    # Among services that could start now, choose the alphabetically first.
    # If there is a dependency cycle, return None.
    pass
`,
      javascript: `function startupOrder(services) {
  // services maps each service name to the list of services it depends on.
  // Return the names in an order where every service comes after its dependencies.
  // Among services that could start now, choose the alphabetically first.
  // If there is a dependency cycle, return null.
}
`,
    },
    cases: [
      { label: 'independent services start alphabetically', args: [{ db: [], api: [] }], expected: ['api', 'db'] },
      { label: 'a chain of dependencies', args: [{ api: ['auth'], auth: ['db'], db: [] }], expected: ['db', 'auth', 'api'] },
      { label: 'a dependency that sorts later still starts first', args: [{ web: ['api'], api: [] }], expected: ['api', 'web'] },
      { label: 'a dependency cycle has no valid order', args: [{ a: ['b'], b: ['a'] }], expected: null },
      { label: 'no services', args: [{}], expected: [] },
      { label: 'two services share one dependency', args: [{ a: ['c'], b: ['c'], c: [] }], expected: ['c', 'a', 'b'] },
    ],
    hints: ['Count how many dependencies each service is still waiting for.', 'Repeatedly start the alphabetically first service that has zero waiting dependencies, then reduce the count of the services that depended on it.', 'If you cannot start every service, there is a cycle: return None / null.'],
  },
  quiz: [
    { q: 'A team of five is building a brand-new product. What is usually the best start?', options: ['A modular monolith', '200 microservices', 'One service per developer'], answer: 0, why: 'Microservices add heavy operational cost. Start simple and split when the pain is real.' },
    { q: 'Why does each microservice own its database?', options: ['To avoid hidden coupling and allow independent change and scaling', 'To make joins faster', 'Because databases are free'], answer: 0, why: 'A shared database ties services together: a schema change in one can break the others.' },
    { q: 'The payment service is down. What keeps orders from failing?', options: ['Asynchronous events through a queue, plus retries', 'Restarting the whole monolith', 'Nothing can help'], answer: 0, why: 'A message queue buffers the work until the payment service returns, so the services are loosely coupled.' },
  ],
  interview: [
    { q: 'What are the pros and cons of microservices?', a: '**Pros**: independent deployment, scaling and technology, fault isolation, team autonomy. **Cons**: network latency and failures, distributed data (no cross-service joins or transactions), and much higher operational complexity (monitoring, tracing, versioning, deployment). Use them when team and system size justify the cost.' },
    { q: 'How do microservices communicate?', a: '**Synchronously** with REST or gRPC (simple, but couples availability), or **asynchronously** with events on a message broker such as Kafka or RabbitMQ (loose coupling, resilience, eventual consistency). Often both: queries are synchronous, state changes are events.' },
    { q: 'How do you migrate from a monolith to microservices?', a: 'Gradually, with the **strangler fig** pattern: put a gateway in front, carve out one well-bounded capability at a time (own data included), route its traffic to the new service, and retire the old code. Avoid a big-bang rewrite.' },
  ],
  mistakes: ['Splitting into microservices before the team or product needs it.', 'Services sharing one database, which gives a distributed monolith.', 'Chains of synchronous calls: one slow service slows them all.', 'No monitoring or tracing across services.'],
  recap: 'Microservices trade simplicity for independence; start modular, split when scale and teams demand it.',
}
