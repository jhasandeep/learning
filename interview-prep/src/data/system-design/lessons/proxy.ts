import type { SdLesson } from '../types'

export const proxy: SdLesson = {
  id: 'proxy',
  title: 'Forward proxy vs reverse proxy',
  topic: 'The middleman',
  blurb: 'A proxy sits between two parties. Learn which side it works for, and build the routing logic of a reverse proxy.',
  why: {
    story: 'A **proxy** is a server that passes requests along on someone\'s behalf. The question is **whose** behalf. A **forward proxy** acts for the **clients**: a company network sends all employees\' web traffic through it, so it can filter sites, cache files and hide the clients\' addresses. A **reverse proxy** acts for the **servers**: users talk to it and never see the real servers behind it, so it can balance load, terminate HTTPS, cache and protect them. Nginx in front of your app is the classic reverse proxy.',
    pains: ['Servers exposed directly to the internet are easier to attack.', 'Each service would have to handle HTTPS, compression and caching itself.', 'Clients on a company network need control, filtering and logging.', 'One public address must serve many different internal services.'],
  },
  before: {
    title: 'Forward proxy: stands in for the clients',
    nodes: [
      { id: 'c1', label: 'Employee 1', kind: 'client', x: 10, y: 14 },
      { id: 'c2', label: 'Employee 2', kind: 'client', x: 10, y: 42 },
      { id: 'p', label: 'Forward proxy', kind: 'gateway', x: 44, y: 28, sub: 'filters, caches' },
      { id: 'i', label: 'Internet', kind: 'server', x: 82, y: 28, sub: 'websites' },
    ],
    edges: [{ from: 'c1', to: 'p' }, { from: 'c2', to: 'p' }, { from: 'p', to: 'i' }],
    frames: [
      { caption: 'Employees send their requests to the **forward proxy** (a browser or network setting).', active: ['c1', 'c2', 'p'], flow: [['c1', 'p'], ['c2', 'p']] },
      { caption: 'The proxy checks its rules (is this site allowed?) and may answer from its cache.', active: ['p'], badges: { p: 'ALLOWED' } },
      { caption: 'It forwards the request to the website. The website sees the **proxy\'s** address, not the employees\'.', active: ['p', 'i'], flow: [['p', 'i']] },
    ],
  },
  how: {
    title: 'Reverse proxy: stands in front of the servers',
    nodes: [
      { id: 'u', label: 'Users', kind: 'user', x: 8, y: 28 },
      { id: 'p', label: 'Reverse proxy', kind: 'gateway', x: 38, y: 28, sub: 'one public address' },
      { id: 'web', label: 'Web service', kind: 'server', x: 74, y: 10, sub: '/' },
      { id: 'api', label: 'API service', kind: 'server', x: 74, y: 28, sub: '/api' },
      { id: 'img', label: 'Image service', kind: 'server', x: 74, y: 46, sub: '/images' },
    ],
    edges: [{ from: 'u', to: 'p' }, { from: 'p', to: 'web' }, { from: 'p', to: 'api' }, { from: 'p', to: 'img' }],
    frames: [
      { caption: 'Users only know one address. All traffic goes to the **reverse proxy**, which also terminates HTTPS.', active: ['u', 'p'], flow: [['u', 'p']] },
      { caption: 'A request for `/api/users` matches the `/api` rule: the proxy sends it to the API service.', active: ['p', 'api'], flow: [['p', 'api']], badges: { p: '/api' } },
      { caption: 'A request for `/images/logo.png` matches `/images` and goes to the image service.', active: ['p', 'img'], flow: [['p', 'img']], badges: { p: '/images' } },
      { caption: 'Anything else falls back to the web service. The internal servers are never exposed directly.', active: ['p', 'web'], flow: [['p', 'web']], badges: { p: '/' } },
    ],
  },
  tabs: ['Forward proxy (for clients)', 'Reverse proxy (for servers)'],
  realWorld: [
    { name: 'Nginx, HAProxy, Envoy, Traefik', text: 'Popular reverse proxies. They route by path or host, terminate TLS, compress, cache and balance load.' },
    { name: 'API gateways', text: 'An API gateway is a reverse proxy with extras for APIs: authentication, rate limiting and request transformation.' },
    { name: 'Corporate and school networks', text: 'A forward proxy (for example Squid) filters websites, logs usage and caches downloads for everyone on the network.' },
    { name: 'VPNs and privacy proxies', text: 'These are forward proxies for individuals: the website sees the proxy\'s address instead of yours.' },
  ],
  tradeoffs: {
    gain: ['Reverse: one public entry point, hidden internal servers, central HTTPS and caching.', 'Forward: control, filtering, caching and anonymity for clients.', 'Both can add logging and security rules in one place.'],
    cost: ['An extra hop and an extra component to run.', 'The proxy can become a bottleneck or a single point of failure: run it redundantly.'],
    useWhen: ['Reverse proxy: almost always in front of a web application.', 'Forward proxy: you must control or log outgoing traffic.'],
    avoidWhen: ['A single small service on a private network may not need one.'],
  },
  steps: [
    {
      title: 'Use the first rule that matches',
      tag: 'slow',
      idea: 'Keep a list of rules, each a path prefix and a backend. For a request, walk the list and use the first rule whose prefix matches. It is simple, but it depends on the **order** of rules: a catch-all `/` at the top swallows everything.',
      walk: ['For each `(prefix, backend)` in order, check `path.startswith(prefix)`.', 'Return the backend of the first match.', 'Return None if nothing matches.'],
      only: [0, 2, 3, 5],
      code: {
        python: `class ReverseProxy:
    def __init__(self, routes):
        self.routes = routes  # list of [prefix, backend]

    def route(self, path):
        for prefix, backend in self.routes:
            if path.startswith(prefix):
                return backend
        return None
`,
        javascript: `class ReverseProxy {
  constructor(routes) {
    this.routes = routes; // list of [prefix, backend]
  }

  route(path) {
    for (const [prefix, backend] of this.routes) {
      if (path.startsWith(prefix)) return backend;
    }
    return null;
  }
}
`,
      },
      time: 'O(rules)',
      space: 'O(rules)',
      verdict: 'Works only if you list the most specific rules first. A rule list that changes at runtime makes that fragile.',
    },
    {
      title: 'The longest matching prefix wins',
      tag: 'best',
      idea: 'Make the order irrelevant: among all rules whose prefix matches the path, pick the one with the **longest prefix**. `/api/v2` is more specific than `/api`, which is more specific than `/`. This is how Nginx `location` blocks and URL routers behave.',
      walk: ['Find every rule where `path.startswith(prefix)`.', 'Pick the matching rule with the longest prefix.', 'Return its backend, or None if no rule matches.'],
      code: {
        python: `class ReverseProxy:
    def __init__(self, routes):
        self.routes = routes  # list of [prefix, backend]

    def route(self, path):
        best = None
        for prefix, backend in self.routes:
            if path.startswith(prefix) and (best is None or len(prefix) > len(best[0])):
                best = (prefix, backend)
        return best[1] if best else None
`,
        javascript: `class ReverseProxy {
  constructor(routes) {
    this.routes = routes; // list of [prefix, backend]
  }

  route(path) {
    let best = null;
    for (const [prefix, backend] of this.routes) {
      if (path.startsWith(prefix) && (best === null || prefix.length > best[0].length)) {
        best = [prefix, backend];
      }
    }
    return best ? best[1] : null;
  }
}
`,
      },
      time: 'O(rules) (a trie makes it O(path length))',
      space: 'O(rules)',
      verdict: 'Rule order no longer matters. Real proxies add more: host-based routing, regular expressions, health checks and load balancing per backend.',
    },
  ],
  practice: {
    fn: { python: 'simulate_proxy', javascript: 'simulateProxy' },
    symbol: { python: 'class ReverseProxy', javascript: 'class ReverseProxy' },
    driver: {
      python: `def simulate_proxy(routes, paths):
    proxy = ReverseProxy(routes)
    return [proxy.route(p) for p in paths]
`,
      javascript: `function simulateProxy(routes, paths) {
  const proxy = new ReverseProxy(routes);
  return paths.map((p) => {
    const backend = proxy.route(p);
    return backend === undefined ? null : backend;
  });
}
`,
    },
    starter: {
      python: `class ReverseProxy:
    def __init__(self, routes):
        # routes is a list of [path_prefix, backend_name]
        self.routes = routes

    def route(self, path):
        # return the backend for this path, or None if no rule matches
        pass
`,
      javascript: `class ReverseProxy {
  constructor(routes) {
    // routes is a list of [pathPrefix, backendName]
    this.routes = routes;
  }

  route(path) {
    // return the backend for this path, or null if no rule matches
  }
}
`,
    },
    cases: [
      { label: 'send each path to its backend', args: [[['/api', 'api-svc'], ['/', 'web-svc']], ['/api/users', '/home']], expected: ['api-svc', 'web-svc'] },
      { label: 'the most specific rule wins, even if listed later', args: [[['/', 'web'], ['/api', 'api'], ['/api/v2', 'api-v2']], ['/api/v2/users']], expected: ['api-v2'] },
      { label: 'no rule matches', args: [[['/api', 'api']], ['/x']], expected: [null] },
      { label: 'a path equal to the prefix matches', args: [[['/api', 'api']], ['/api']], expected: ['api'] },
      { label: 'rule order does not matter', args: [[['/api/v2', 'v2'], ['/api', 'v1']], ['/api/x', '/api/v2/x']], expected: ['v1', 'v2'] },
      { label: 'a prefix must match the start of the path', args: [[['/api', 'a']], ['/x/api']], expected: [null] },
    ],
    hints: ['A rule matches when the path starts with its prefix.', 'Several rules can match: choose the one whose prefix is the **longest**.', 'If none match, return None / null.'],
  },
  quiz: [
    { q: 'A company wants to block social media sites for all employees. Which proxy do they need?', options: ['A forward proxy', 'A reverse proxy', 'A CDN'], answer: 0, why: 'A forward proxy sits on the client side and applies rules to outgoing requests.' },
    { q: 'Users reach `shop.com`, but `/api` is served by one cluster and `/images` by another. What makes this possible?', options: ['A reverse proxy that routes by path', 'A forward proxy', 'DNS round robin'], answer: 0, why: 'The reverse proxy is the single public entry and forwards each path to the right internal service.' },
    { q: 'Which statement about a reverse proxy is true?', options: ['The client knows the real server address', 'It can terminate HTTPS so backend servers handle plain HTTP', 'It only works for static files'], answer: 1, why: 'TLS termination at the proxy centralises certificates and removes encryption work from the app servers.' },
  ],
  interview: [
    { q: 'What is the difference between a forward and a reverse proxy?', a: 'A **forward proxy** represents the **client**: servers see the proxy, not the clients. A **reverse proxy** represents the **server**: clients see the proxy, not the real servers. Forward proxies filter and anonymise outgoing traffic; reverse proxies balance load, cache, terminate TLS and protect backends.' },
    { q: 'How is a reverse proxy different from a load balancer?', a: 'A load balancer spreads traffic across several identical servers. A reverse proxy is broader: it can route to different services, cache, compress and terminate TLS. In practice tools like Nginx and HAProxy do both, and the terms overlap.' },
    { q: 'What problems can a reverse proxy cause?', a: 'It adds a hop (latency), can be a bottleneck or single point of failure (so run several), and hides the client IP from the backend unless it forwards it in a header such as `X-Forwarded-For`.' },
  ],
  mistakes: ['Relying on rule order instead of the most specific match.', 'Forgetting to pass the original client IP to backends (`X-Forwarded-For`).', 'Running a single proxy instance and creating a new single point of failure.', 'Mixing up which side (client or server) each proxy type represents.'],
  recap: 'A forward proxy speaks for clients, a reverse proxy speaks for servers; reverse proxies route by the longest matching rule.',
}
