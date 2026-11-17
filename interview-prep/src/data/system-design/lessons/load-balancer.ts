import type { SdLesson } from '../types'

export const loadBalancer: SdLesson = {
  id: 'load-balancer',
  title: 'Load balancer',
  topic: 'Scaling out',
  blurb: 'Spread incoming requests over many servers so no single one is overwhelmed, and users never notice a server failing.',
  why: {
    story: 'Your app starts on **one server**. It works until a sale, a viral post or a busy Monday morning: the single server runs out of CPU, requests queue up, pages time out and, if it crashes, the whole site is down. Buying a bigger server only delays the problem. The better fix is **many servers** plus something in front that decides which server gets each request. That something is a load balancer.',
    pains: ['One server has a hard limit on how many requests it can handle.', 'If that one server fails, every user sees an error (a **single point of failure**).', 'Deploying a new version means downtime, because there is nothing to switch traffic to.'],
  },
  before: {
    title: 'Without a load balancer: everyone hits one server',
    nodes: [
      { id: 'u1', label: 'Users', kind: 'user', x: 14, y: 28 },
      { id: 's', label: 'Server', kind: 'server', x: 56, y: 28, sub: 'the only one' },
      { id: 'db', label: 'Database', kind: 'db', x: 88, y: 28 },
    ],
    edges: [{ from: 'u1', to: 's' }, { from: 's', to: 'db' }],
    frames: [
      { caption: 'A few users: the single server copes fine.', active: ['u1', 's'], flow: [['u1', 's']] },
      { caption: 'Traffic grows. Every request goes to the same machine, and its CPU and memory run out.', active: ['u1'], flow: [['u1', 's']], bad: ['s'], badges: { s: 'OVERLOAD' } },
      { caption: 'The server crashes. There is no other server, so **the whole site is down**.', bad: ['s'], badges: { s: 'DOWN' } },
    ],
  },
  how: {
    title: 'With a load balancer: requests are shared',
    nodes: [
      { id: 'c', label: 'Users', kind: 'user', x: 10, y: 28 },
      { id: 'lb', label: 'Load balancer', kind: 'lb', x: 36, y: 28 },
      { id: 's1', label: 'Server 1', kind: 'server', x: 66, y: 10 },
      { id: 's2', label: 'Server 2', kind: 'server', x: 66, y: 28 },
      { id: 's3', label: 'Server 3', kind: 'server', x: 66, y: 46 },
      { id: 'db', label: 'Database', kind: 'db', x: 91, y: 28 },
    ],
    edges: [
      { from: 'c', to: 'lb' },
      { from: 'lb', to: 's1' },
      { from: 'lb', to: 's2' },
      { from: 'lb', to: 's3' },
      { from: 's1', to: 'db' },
      { from: 's2', to: 'db' },
      { from: 's3', to: 'db' },
    ],
    frames: [
      { caption: 'Every request first reaches the **load balancer**. Users only know its address.', active: ['c', 'lb'], flow: [['c', 'lb']] },
      { caption: 'Request 1 is sent to Server 1 (round robin: take turns).', active: ['lb', 's1'], flow: [['lb', 's1']], badges: { lb: '#1' } },
      { caption: 'Request 2 goes to Server 2.', active: ['lb', 's2'], flow: [['lb', 's2']], badges: { lb: '#2' } },
      { caption: 'Request 3 goes to Server 3, then the cycle starts again at Server 1.', active: ['lb', 's3'], flow: [['lb', 's3']], badges: { lb: '#3' } },
      { caption: 'Server 2 crashes. The load balancer notices through **health checks** and stops sending it traffic. Users see nothing.', active: ['lb'], bad: ['s2'], badges: { s2: 'DOWN' } },
      { caption: 'New requests now alternate between Server 1 and Server 3. The site stays up.', active: ['lb', 's1', 's3'], flow: [['lb', 's1'], ['lb', 's3']] },
    ],
  },
  realWorld: [
    { name: 'Nginx and HAProxy', text: 'Free, widely used software load balancers. Many websites run one in front of their application servers.' },
    { name: 'Cloud load balancers', text: 'AWS Elastic Load Balancing, Google Cloud Load Balancing and Azure Load Balancer are managed services: you register your servers and point your domain at the balancer.' },
    { name: 'Kubernetes', text: 'A Kubernetes Service spreads traffic across all the running copies (pods) of an app and removes unhealthy ones automatically.' },
    { name: 'DNS round robin', text: 'The simplest form: one domain name returns several server addresses. Cheap, but it cannot tell when a server is down.' },
  ],
  tradeoffs: {
    gain: ['Handles more traffic by adding servers (**horizontal scaling**).', 'Survives a server failing, with no downtime.', 'Lets you deploy with zero downtime: roll servers one at a time.'],
    cost: ['One more component to run, monitor and pay for.', 'The balancer itself must not become a single point of failure.', 'Servers should be **stateless**, or sessions need extra handling.'],
    useWhen: ['More than one server runs your app.', 'You need high availability.', 'Traffic is unpredictable or spiky.'],
    avoidWhen: ['A small internal tool with a handful of users.', 'One server comfortably handles the load and brief downtime is acceptable.'],
  },
  steps: [
    {
      title: 'Take turns (round robin)',
      tag: 'idea',
      idea: 'The simplest strategy: keep a counter and send each request to the next server in the list, wrapping around at the end. It spreads requests evenly when every request costs about the same.',
      walk: ['Keep the list of servers and a counter `next`.', '`pick` returns `servers[next % count]` and adds one to the counter.', '`release` does nothing yet: this strategy does not care how busy a server is.'],
      only: [0, 4, 5],
      code: {
        python: `class LoadBalancer:
    def __init__(self, servers, strategy):
        self.servers = list(servers)
        self.strategy = strategy
        self.next = 0

    def pick(self, key):
        server = self.servers[self.next % len(self.servers)]
        self.next += 1
        return server

    def release(self, server):
        pass
`,
        javascript: `class LoadBalancer {
  constructor(servers, strategy) {
    this.servers = [...servers];
    this.strategy = strategy;
    this.next = 0;
  }

  pick(key) {
    const server = this.servers[this.next % this.servers.length];
    this.next++;
    return server;
  }

  release(server) {}
}
`,
      },
      time: 'O(1) per request',
      space: 'O(servers)',
      verdict: 'Fast and fair for equal requests. It is blind to slow servers and to requests that take very different times.',
    },
    {
      title: 'Send to the least busy server',
      tag: 'better',
      idea: 'Track how many requests each server is handling right now. Send the next request to the server with the **fewest active connections**. A slow server accumulates open requests, so it automatically receives fewer new ones.',
      walk: ['Keep `active[server]` counts.', '`pick` chooses the server with the smallest count (the first one on a tie) and increases its count.', '`release` is called when a request finishes and decreases the count.'],
      only: [0, 1, 2, 4, 5],
      code: {
        python: `class LoadBalancer:
    def __init__(self, servers, strategy):
        self.servers = list(servers)
        self.strategy = strategy
        self.next = 0
        self.active = {s: 0 for s in servers}

    def pick(self, key):
        if self.strategy == "least_connections":
            server = min(self.servers, key=lambda s: self.active[s])
        else:
            server = self.servers[self.next % len(self.servers)]
            self.next += 1
        self.active[server] += 1
        return server

    def release(self, server):
        self.active[server] = max(0, self.active[server] - 1)
`,
        javascript: `class LoadBalancer {
  constructor(servers, strategy) {
    this.servers = [...servers];
    this.strategy = strategy;
    this.next = 0;
    this.active = {};
    for (const s of servers) this.active[s] = 0;
  }

  pick(key) {
    let server;
    if (this.strategy === "least_connections") {
      server = this.servers[0];
      for (const s of this.servers) {
        if (this.active[s] < this.active[server]) server = s;
      }
    } else {
      server = this.servers[this.next % this.servers.length];
      this.next++;
    }
    this.active[server]++;
    return server;
  }

  release(server) {
    this.active[server] = Math.max(0, this.active[server] - 1);
  }
}
`,
      },
      time: 'O(servers) per request',
      space: 'O(servers)',
      verdict: 'Adapts to slow servers and uneven requests. It needs to be told when requests finish.',
    },
    {
      title: 'Keep a user on the same server (hash)',
      tag: 'best',
      idea: 'Sometimes the same user should always reach the same server, for example because that server holds a local cache of their data. Hash a key (a user id or IP address) and use the result to choose the server. The same key always maps to the same server.',
      walk: ['Turn the key into a number (here, the sum of its character codes).', 'Use `number % servers` as the index.', 'All three strategies now live in one class, selected by the `strategy` argument.'],
      code: {
        python: `class LoadBalancer:
    def __init__(self, servers, strategy):
        self.servers = list(servers)
        self.strategy = strategy
        self.next = 0
        self.active = {s: 0 for s in servers}

    def pick(self, key):
        if self.strategy == "round_robin":
            server = self.servers[self.next % len(self.servers)]
            self.next += 1
        elif self.strategy == "least_connections":
            server = min(self.servers, key=lambda s: self.active[s])
        else:  # "hash": the same key always lands on the same server
            server = self.servers[sum(ord(c) for c in key) % len(self.servers)]
        self.active[server] += 1
        return server

    def release(self, server):
        self.active[server] = max(0, self.active[server] - 1)
`,
        javascript: `class LoadBalancer {
  constructor(servers, strategy) {
    this.servers = [...servers];
    this.strategy = strategy;
    this.next = 0;
    this.active = {};
    for (const s of servers) this.active[s] = 0;
  }

  pick(key) {
    let server;
    if (this.strategy === "round_robin") {
      server = this.servers[this.next % this.servers.length];
      this.next++;
    } else if (this.strategy === "least_connections") {
      server = this.servers[0];
      for (const s of this.servers) {
        if (this.active[s] < this.active[server]) server = s;
      }
    } else {
      // "hash": the same key always lands on the same server
      let sum = 0;
      for (const ch of key) sum += ch.charCodeAt(0);
      server = this.servers[sum % this.servers.length];
    }
    this.active[server]++;
    return server;
  }

  release(server) {
    this.active[server] = Math.max(0, this.active[server] - 1);
  }
}
`,
      },
      time: 'O(servers) per request',
      space: 'O(servers)',
      verdict: 'Simple "sticky" routing. If a server is added or removed, most keys move to a new server: **consistent hashing** (a later lesson) fixes that.',
    },
  ],
  sim: {
    id: 'load-balancer',
    intro: 'Send requests and see how each strategy spreads them. The orange bar is how many requests a server is busy with right now; the blue bar is the total it has received. Server 1 is slow by default.',
    tryThis: ['Round robin, send 6 requests, then press "1 second passes" a few times: the slow server keeps a backlog.', 'Switch to **least connections** and repeat: the slow server receives fewer new requests.', 'Untick "Server 1 is slow" and compare: now round robin is just as good.'],
  },
  practice: {
    fn: { python: 'simulate_lb', javascript: 'simulateLb' },
    symbol: { python: 'class LoadBalancer', javascript: 'class LoadBalancer' },
    driver: {
      python: `def simulate_lb(strategy, servers, ops):
    lb = LoadBalancer(servers, strategy)
    out = []
    for op in ops:
        if op[0] == "request":
            out.append(lb.pick(op[1]))
        else:
            lb.release(op[1])
            out.append(None)
    return out
`,
      javascript: `function simulateLb(strategy, servers, ops) {
  const lb = new LoadBalancer(servers, strategy);
  const out = [];
  for (const op of ops) {
    if (op[0] === "request") out.push(lb.pick(op[1]));
    else {
      lb.release(op[1]);
      out.push(null);
    }
  }
  return out;
}
`,
    },
    starter: {
      python: `class LoadBalancer:
    def __init__(self, servers, strategy):
        # strategy is "round_robin", "least_connections" or "hash"
        self.servers = list(servers)
        self.strategy = strategy

    def pick(self, key):
        # return the name of the server that should handle this request
        pass

    def release(self, server):
        # a request on this server has finished
        pass
`,
      javascript: `class LoadBalancer {
  constructor(servers, strategy) {
    // strategy is "round_robin", "least_connections" or "hash"
    this.servers = [...servers];
    this.strategy = strategy;
  }

  pick(key) {
    // return the name of the server that should handle this request
  }

  release(server) {
    // a request on this server has finished
  }
}
`,
    },
    cases: [
      { label: 'round robin takes turns', args: ['round_robin', ['A', 'B', 'C'], [['request', 'k'], ['request', 'k'], ['request', 'k'], ['request', 'k']]], expected: ['A', 'B', 'C', 'A'] },
      { label: 'least connections prefers a server that finished its work', args: ['least_connections', ['A', 'B', 'C'], [['request', 'k'], ['request', 'k'], ['request', 'k'], ['done', 'B'], ['request', 'k'], ['request', 'k']]], expected: ['A', 'B', 'C', null, 'B', 'A'] },
      { label: 'least connections avoids busy servers', args: ['least_connections', ['A', 'B', 'C'], [['request', 'k'], ['request', 'k'], ['done', 'A'], ['request', 'k'], ['request', 'k']]], expected: ['A', 'B', null, 'A', 'C'] },
      { label: 'hash sends the same key to the same server', args: ['hash', ['A', 'B', 'C'], [['request', 'u1'], ['request', 'u2'], ['request', 'u1']]], expected: ['B', 'C', 'B'] },
      { label: 'one server gets everything', args: ['round_robin', ['A'], [['request', 'k'], ['request', 'k'], ['request', 'k']]], expected: ['A', 'A', 'A'] },
      { label: 'round robin wraps around', args: ['round_robin', ['X', 'Y'], [['request', 'k'], ['request', 'k'], ['request', 'k'], ['request', 'k'], ['request', 'k']]], expected: ['X', 'Y', 'X', 'Y', 'X'] },
    ],
    hints: ['Keep a counter for round robin and an `active` count per server for least connections.', 'For least connections, `pick` adds one to the chosen server and `release` subtracts one.', 'For hash, turn the key into a number (for example the sum of character codes) and use `number % number_of_servers` as the index.'],
  },
  quiz: [
    { q: 'Server 3 is slow, so its requests take much longer. Which strategy copes best?', options: ['Round robin', 'Least connections', 'Hash of the user id'], answer: 1, why: 'Least connections sees that the slow server still has many open requests and sends new ones elsewhere. Round robin keeps sending it an equal share.' },
    { q: 'What stops the load balancer from sending traffic to a crashed server?', options: ['Health checks', 'A bigger database', 'Using HTTPS'], answer: 0, why: 'The balancer regularly pings each server (or watches its responses). If a server fails, it is taken out of rotation until it recovers.' },
    { q: 'What problem does one load balancer in front of everything create?', options: ['It makes servers slower', 'It becomes a single point of failure', 'It cannot use more than 3 servers'], answer: 1, why: 'If the balancer dies, nothing is reachable. Production setups run at least two (active-passive or active-active) or use a managed service that already does this.' },
  ],
  interview: [
    { q: 'How do you make the load balancer itself highly available?', a: 'Run two or more balancers. In an **active-passive** pair a standby takes over the shared IP address if the active one fails; in **active-active** both serve traffic (for example behind DNS or anycast). Managed cloud balancers do this for you. Mention health checks between the balancers too.' },
    { q: 'What is the difference between a layer 4 and a layer 7 load balancer?', a: 'A **layer 4** balancer works with TCP/UDP connections and just forwards them: very fast, but it cannot see the request. A **layer 7** balancer understands HTTP, so it can route by path, host or header, terminate TLS and add things like caching, at the cost of more CPU.' },
    { q: 'Your app stores the login session in server memory. What goes wrong behind a load balancer?', a: 'The next request may hit a different server that does not know the session, so the user appears logged out. Fixes: store sessions in a shared store such as Redis, use signed tokens (JWT) so servers stay **stateless**, or use sticky sessions (hash routing) as a temporary workaround.' },
  ],
  mistakes: ['Keeping session data in one server\'s memory (users get logged out when routed elsewhere).', 'Forgetting health checks, so traffic still goes to dead servers.', 'Using round robin when requests have very different costs.', 'Running a single load balancer and calling the system highly available.'],
  recap: 'A load balancer hides many servers behind one address, spreading work and routing around failures; pick the strategy that matches your traffic.',
}
