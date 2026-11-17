import type { SdLesson } from '../types'

export const scaling: SdLesson = {
  id: 'scaling',
  title: 'Vertical vs horizontal scaling',
  topic: 'Handling growth',
  blurb: 'Make one machine bigger, or add more machines? Learn when each works and how to calculate how many servers you need.',
  why: {
    story: 'Your site is getting popular and the server is at 95% CPU. You have two ways out. **Vertical scaling** (scale up): buy a bigger machine with more CPU and memory. **Horizontal scaling** (scale out): add more machines of the same size and share the work. Vertical is simple but hits a ceiling and leaves one machine to fail. Horizontal has no real ceiling and survives failures, but needs a load balancer and stateless servers.',
    pains: ['A bigger machine gets very expensive and there is a biggest machine you can buy.', 'One huge machine is still a **single point of failure**.', 'Upgrading often needs downtime.', 'Traffic is spiky: paying for peak capacity all day wastes money.'],
  },
  before: {
    title: 'Vertical scaling: one machine, made bigger',
    nodes: [
      { id: 'u', label: 'Users', kind: 'user', x: 12, y: 28 },
      { id: 's', label: 'Big server', kind: 'server', x: 56, y: 28, sub: '64 CPU, 512 GB' },
      { id: 'db', label: 'Database', kind: 'db', x: 90, y: 28 },
    ],
    edges: [{ from: 'u', to: 's' }, { from: 's', to: 'db' }],
    frames: [
      { caption: 'The server is at its limit, so we buy a bigger one. Everything is on one machine: simple.', active: ['u', 's'], flow: [['u', 's']] },
      { caption: 'Traffic grows again. There is a limit to how big one machine can be, and each step costs much more.', active: ['s'], bad: ['s'], badges: { s: 'MAX SIZE' } },
      { caption: 'If this one machine fails, **the whole site is down**.', bad: ['s'], badges: { s: 'DOWN' } },
    ],
  },
  how: {
    title: 'Horizontal scaling: many machines behind a balancer',
    nodes: [
      { id: 'u', label: 'Users', kind: 'user', x: 8, y: 28 },
      { id: 'lb', label: 'Load balancer', kind: 'lb', x: 32, y: 28 },
      { id: 's1', label: 'Server 1', kind: 'server', x: 64, y: 8 },
      { id: 's2', label: 'Server 2', kind: 'server', x: 64, y: 28 },
      { id: 's3', label: 'Server 3', kind: 'server', x: 64, y: 48, sub: 'added later' },
      { id: 'db', label: 'Database', kind: 'db', x: 91, y: 28 },
    ],
    edges: [{ from: 'u', to: 'lb' }, { from: 'lb', to: 's1' }, { from: 'lb', to: 's2' }, { from: 'lb', to: 's3' }, { from: 's1', to: 'db' }, { from: 's2', to: 'db' }, { from: 's3', to: 'db' }],
    frames: [
      { caption: 'Two ordinary servers share the traffic behind a load balancer.', active: ['lb', 's1', 's2'], flow: [['lb', 's1'], ['lb', 's2']] },
      { caption: 'Traffic grows: we simply **add Server 3**. No downtime and no special hardware.', active: ['s3', 'lb'], flow: [['lb', 's3']], badges: { s3: 'NEW' } },
      { caption: 'Traffic drops at night: an **autoscaler** removes a server to save money.', active: ['lb', 's1', 's2'], badges: { s3: 'REMOVED' } },
      { caption: 'One server fails. The others carry on, so the site stays up. The shared database is the next thing to scale (replication, sharding).', active: ['lb', 's2', 's3'], bad: ['s1'], badges: { s1: 'DOWN' } },
    ],
  },
  tabs: ['Vertical (scale up)', 'Horizontal (scale out)'],
  realWorld: [
    { name: 'Cloud autoscaling', text: 'AWS Auto Scaling groups, Google managed instance groups and Kubernetes horizontal pod autoscaling add and remove servers based on CPU or request rate.' },
    { name: 'Databases often scale up first', text: 'A relational database is commonly made bigger first (more CPU, RAM, faster disks) because spreading it over many machines is harder. Later come read replicas and sharding.' },
    { name: 'Stateless web tier', text: 'Web and API servers that keep no user data in local memory can be copied freely, which is why companies keep sessions in Redis or in tokens.' },
    { name: 'Spare capacity ("N + 1")', text: 'Teams add at least one extra server beyond what the load needs so that a single failure does not overload the rest.' },
  ],
  tradeoffs: {
    gain: ['Horizontal: almost no upper limit and no single point of failure.', 'Horizontal: scale up and down with traffic to save money.', 'Vertical: simple, no code changes and no network between components.'],
    cost: ['Horizontal needs load balancing and **stateless** servers.', 'Horizontal makes data consistency harder (shared database, caches).', 'Vertical has a hard ceiling and a big failure risk.'],
    useWhen: ['Horizontal: web and API servers, anything stateless.', 'Vertical: databases and quick fixes early on.'],
    avoidWhen: ['Horizontal: do not add servers if the real bottleneck is a single database.', 'Vertical: do not rely on it alone for a business that cannot afford downtime.'],
  },
  steps: [
    {
      title: 'Vertical: the cost of a bigger machine',
      tag: 'slow',
      idea: 'Doubling the machine rarely costs double: the biggest machines are priced at a premium, and there is a maximum size. This tiny model shows why vertical scaling stops being sensible.',
      walk: ['Each doubling of CPU costs more than twice as much (here 2.5 times).', 'After a certain size there is nothing bigger to buy.'],
      only: [],
      code: {
        python: `def vertical_cost(doublings, base_cost=100):
    """Cost of a machine that has been doubled in size \`doublings\` times."""
    return base_cost * (2.5 ** doublings)
`,
        javascript: `function verticalCost(doublings, baseCost = 100) {
  // Cost of a machine that has been doubled in size \`doublings\` times.
  return baseCost * 2.5 ** doublings;
}
`,
      },
      time: 'cost grows faster than size',
      space: 'n/a',
      verdict: 'Great for a quick fix, poor as the only plan: it gets expensive and it never removes the single point of failure.',
    },
    {
      title: 'Horizontal: how many servers do we need?',
      tag: 'best',
      idea: 'Work backwards from traffic. One server can handle `capacity` requests per second, but you never want to run it at 100%: aim for a **target utilisation** (for example 70%) so that spikes and slow requests have room. Divide the traffic by the usable capacity, round **up**, and add **spare** servers so that a failure does not cause an overload.',
      walk: ['Usable capacity per server = `capacity × target`.', 'Servers = `ceil(rps / usable_capacity)`, and at least 1.', 'Add `spare` extra servers for failures and deployments.'],
      code: {
        python: `import math


def servers_needed(rps, capacity, target, spare):
    usable = capacity * target
    return max(1, math.ceil(rps / usable)) + spare
`,
        javascript: `function serversNeeded(rps, capacity, target, spare) {
  const usable = capacity * target;
  return Math.max(1, Math.ceil(rps / usable)) + spare;
}
`,
      },
      time: 'O(1)',
      space: 'O(1)',
      verdict: 'Real systems recompute this continuously (autoscaling) from live metrics such as CPU or requests per second.',
    },
  ],
  sim: {
    id: 'autoscale',
    intro: 'Move the traffic slider and see how many servers the formula asks for. Dashed servers are spares.',
    tryThis: ['Raise the traffic to 2,000 requests per second and watch the fleet grow. Then lower it again: autoscaling in action.', 'Lower the target utilisation to 40%: you need many more servers, but each is calm and a failure is easy to absorb.', 'Compare with the "vertical alternative": you would need machines several times bigger.'],
  },
  practice: {
    fn: { python: 'servers_needed', javascript: 'serversNeeded' },
    starter: {
      python: `import math


def servers_needed(rps, capacity, target, spare):
    # rps: requests per second, capacity: requests per second one server handles,
    # target: the utilisation you aim for (0.7 means 70%), spare: extra servers
    pass
`,
      javascript: `function serversNeeded(rps, capacity, target, spare) {
  // rps: requests per second, capacity: requests per second one server handles,
  // target: the utilisation you aim for (0.7 means 70%), spare: extra servers
}
`,
    },
    cases: [
      { label: 'round up to whole servers', args: [1000, 100, 0.8, 0], expected: 13 },
      { label: 'a lower target needs more servers, plus a spare', args: [1000, 100, 0.5, 1], expected: 21 },
      { label: 'no traffic still needs one server', args: [0, 100, 0.7, 0], expected: 1 },
      { label: 'no traffic with a spare', args: [0, 100, 0.7, 1], expected: 2 },
      { label: 'light traffic fits on one server', args: [50, 100, 0.8, 0], expected: 1 },
      { label: 'running at 100% target', args: [950, 100, 1.0, 0], expected: 10 },
      { label: 'bigger servers and two spares', args: [2500, 200, 0.5, 2], expected: 27 },
    ],
    hints: ['One server really handles `capacity × target` requests per second.', 'Divide the traffic by that and **round up** (a fraction of a server still needs a whole one).', 'There must always be at least one server, then add the spare servers.'],
  },
  quiz: [
    { q: 'Which component is usually the hardest to scale horizontally?', options: ['A stateless web server', 'A single relational database that holds all the data', 'A static file server'], answer: 1, why: 'Stateless servers can be copied freely. A database holds shared state, so spreading it needs replication or sharding.' },
    { q: 'Why not run servers at 100% utilisation?', options: ['It wastes electricity', 'Spikes, slow requests and a failed neighbour need headroom', 'The operating system forbids it'], answer: 1, why: 'At 100% any extra load causes queues and timeouts. Targets of 50 to 70% leave room for bursts and failures.' },
    { q: 'What must web servers be for horizontal scaling to work smoothly?', options: ['Stateless', 'The same colour', 'Written in the same language'], answer: 0, why: 'If a server keeps user data in its own memory, the next request may hit another server that does not have it. Keep state in shared stores or tokens.' },
  ],
  interview: [
    { q: 'Vertical or horizontal scaling: which do you choose?', a: 'It depends on the component. For stateless services choose **horizontal**: no ceiling, resilient, cheaper at scale. For a database start **vertical** (simple) and add read replicas, then sharding when one machine is not enough. Always mention the single point of failure and the cost.' },
    { q: 'How would you estimate the number of servers for 10 million daily users?', a: 'Convert to peak requests per second: daily requests divided by 86,400, times a peak factor (often 2 to 5). Divide by the requests per second one server can handle at about 60 to 70% utilisation, round up, and add spares. Then say how you would validate it with a load test.' },
    { q: 'What does autoscaling need to work well?', a: 'Stateless servers, fast start-up, a metric that reflects load (CPU, requests per second, queue length), sensible minimum and maximum sizes, and a cool-down so it does not flap up and down. Warm up caches and connections before sending traffic.' },
  ],
  mistakes: ['Scaling the web tier while the database is the real bottleneck.', 'Keeping sessions in server memory, which breaks horizontal scaling.', 'Planning exactly for the average load with no headroom or spares.', 'Forgetting to round up the number of servers.'],
  recap: 'Scale up for simplicity, scale out for growth and resilience; compute servers from traffic, per-server capacity, a utilisation target and spares.',
}
