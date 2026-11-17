import type { SdLesson } from '../types'

export const requestFlow: SdLesson = {
  id: 'request-flow',
  title: 'What happens when you open a website',
  topic: 'The big picture',
  blurb: 'Follow one request from your browser through DNS, CDN, load balancer, cache and database, and learn what HLD and LLD mean.',
  why: {
    story: 'You type `shop.example.com` and a page appears in under a second. Behind that second a **chain of systems** cooperates: something turns the name into an address, something nearby serves the images, something picks a healthy server, something checks a cache before asking the database. Almost every system design question is a variation of this chain, so knowing it by heart gives you a map for everything else in the course.',
    pains: ['Without the map, each component feels like a random buzzword.', 'In interviews you must draw this flow quickly and explain what each box is for.', 'Debugging "the site is slow" means knowing which step to look at.'],
  },
  how: {
    title: 'One request, step by step',
    nodes: [
      { id: 'b', label: 'Browser', kind: 'client', x: 8, y: 28 },
      { id: 'dns', label: 'DNS', kind: 'dns', x: 28, y: 8, sub: 'name → IP' },
      { id: 'cdn', label: 'CDN', kind: 'cdn', x: 28, y: 48, sub: 'images, CSS' },
      { id: 'lb', label: 'Load balancer', kind: 'lb', x: 48, y: 28 },
      { id: 'app', label: 'App servers', kind: 'server', x: 68, y: 28 },
      { id: 'cache', label: 'Cache', kind: 'cache', x: 90, y: 10 },
      { id: 'db', label: 'Database', kind: 'db', x: 90, y: 46 },
    ],
    edges: [{ from: 'b', to: 'dns' }, { from: 'b', to: 'cdn' }, { from: 'b', to: 'lb' }, { from: 'lb', to: 'app' }, { from: 'app', to: 'cache' }, { from: 'app', to: 'db' }],
    frames: [
      { caption: '**1. DNS.** The browser asks DNS: "what is the IP address of shop.example.com?" and gets an answer (often from a cache).', active: ['b', 'dns'], flow: [['b', 'dns']] },
      { caption: '**2. CDN.** Static files (images, CSS, JavaScript) come from a **CDN** server close to the user.', active: ['b', 'cdn'], flow: [['b', 'cdn']], badges: { cdn: 'HIT' } },
      { caption: '**3. Load balancer.** Requests for dynamic data (the product list, your cart) go to the load balancer over HTTPS.', active: ['b', 'lb'], flow: [['b', 'lb']] },
      { caption: '**4. App server.** The balancer picks a healthy app server, which runs the business logic.', active: ['lb', 'app'], flow: [['lb', 'app']] },
      { caption: '**5. Cache.** The app first asks the **cache** for the product list.', active: ['app', 'cache'], flow: [['app', 'cache']], badges: { cache: 'MISS' } },
      { caption: '**6. Database.** On a miss it reads the **database**, then stores the answer in the cache for next time.', active: ['app', 'db'], flow: [['app', 'db']] },
      { caption: '**7. Response.** The answer travels back along the same path and the browser draws the page. A cache hit would have skipped step 6.', active: ['app', 'lb', 'b'], flow: [['app', 'lb'], ['lb', 'b']] },
    ],
  },
  realWorld: [
    { name: 'Any large website', text: 'Shopping sites, news sites and social networks all follow this chain. The names of the products change (Cloudflare or Akamai as CDN, Redis as cache, PostgreSQL or MySQL as database), the shape does not.' },
    { name: 'Mobile apps', text: 'An app call works the same way, except that the browser is replaced by the app and the response is usually JSON instead of an HTML page.' },
    { name: 'HLD vs LLD', text: '**High-level design (HLD)** draws the boxes above and how they talk (components, databases, scaling). **Low-level design (LLD)** zooms into one box: classes, methods and data structures inside the app server.' },
    { name: 'The interview', text: 'A common opening is "design X": you start with this chain at the HLD level, then the interviewer picks one box and asks for the LLD.' },
  ],
  tradeoffs: {
    gain: ['One mental map for every design problem.', 'You can point to the step that is slow or failing.', 'Each box can be scaled and replaced on its own.'],
    cost: ['More hops mean more places where failure can happen.', 'Each hop adds a little latency, so caches and CDNs are used to skip hops.'],
    useWhen: ['Starting any design: draw this chain first, then adapt it.', 'Debugging latency: measure each hop.'],
    avoidWhen: ['A tiny internal tool does not need a CDN or a cache: keep it simple.'],
  },
  steps: [
    {
      title: 'How DNS finds an address',
      tag: 'idea',
      idea: 'No single computer knows every address. DNS is a **hierarchy**: a root server knows who runs `.com`, the `.com` servers know who runs `example.com`, and that domain\'s own name server knows the IP of `shop.example.com`. Your resolver asks them in turn.',
      walk: ['Ask a root server who handles the top-level domain (`.com`).', 'Ask that server who handles `example.com`.', 'Ask the domain\'s name server for the IP address of the full name.'],
      only: [],
      code: {
        python: `def resolve_steps(domain):
    tld = domain.split(".")[-1]
    return [
        "ask a root server who handles ." + tld,
        "ask the ." + tld + " servers who handles the domain",
        "ask the domain's name server for the IP of " + domain,
    ]
`,
        javascript: `function resolveSteps(domain) {
  const parts = domain.split(".");
  const tld = parts[parts.length - 1];
  return [
    "ask a root server who handles ." + tld,
    "ask the ." + tld + " servers who handles the domain",
    "ask the domain's name server for the IP of " + domain,
  ];
}
`,
      },
      time: '3 lookups',
      space: 'O(1)',
      verdict: 'Three round trips for every page view would be slow, so answers are cached. Each answer says how long it may be cached: its **TTL**.',
    },
    {
      title: 'A DNS cache that respects the TTL',
      tag: 'best',
      idea: 'Your browser, your operating system and your internet provider all keep a cache of recent answers. An entry is valid until `stored_at + ttl`. After that it is ignored, so a changed IP is picked up. A very short TTL means fresh data but more lookups; a long TTL means fewer lookups but slow changes.',
      walk: ['`store(name, ip, ttl, now)` remembers the IP and the time it expires (`now + ttl`).', '`lookup(name, now)` returns the IP only if `now` is before the expiry time.', 'An expired entry returns None, so the caller must resolve it again.'],
      code: {
        python: `class DnsCache:
    def __init__(self):
        self.entries = {}  # name -> (ip, expires_at)

    def store(self, name, ip, ttl, now):
        self.entries[name] = (ip, now + ttl)

    def lookup(self, name, now):
        entry = self.entries.get(name)
        if entry is None:
            return None
        ip, expires_at = entry
        if now >= expires_at:
            del self.entries[name]
            return None
        return ip
`,
        javascript: `class DnsCache {
  constructor() {
    this.entries = new Map(); // name -> { ip, expiresAt }
  }

  store(name, ip, ttl, now) {
    this.entries.set(name, { ip, expiresAt: now + ttl });
  }

  lookup(name, now) {
    const entry = this.entries.get(name);
    if (!entry) return null;
    if (now >= entry.expiresAt) {
      this.entries.delete(name);
      return null;
    }
    return entry.ip;
  }
}
`,
      },
      time: 'O(1) per lookup',
      space: 'O(names)',
      verdict: 'The same "answer plus a time to live" idea is used by CDNs and HTTP caches.',
    },
  ],
  practice: {
    fn: { python: 'simulate_dns', javascript: 'simulateDns' },
    symbol: { python: 'class DnsCache', javascript: 'class DnsCache' },
    driver: {
      python: `def simulate_dns(ops):
    cache = DnsCache()
    out = []
    for op in ops:
        if op[0] == "store":
            cache.store(op[1], op[2], op[3], op[4])
            out.append(None)
        else:
            out.append(cache.lookup(op[1], op[2]))
    return out
`,
      javascript: `function simulateDns(ops) {
  const cache = new DnsCache();
  const out = [];
  for (const op of ops) {
    if (op[0] === "store") {
      cache.store(op[1], op[2], op[3], op[4]);
      out.push(null);
    } else {
      const ip = cache.lookup(op[1], op[2]);
      out.push(ip === undefined ? null : ip);
    }
  }
  return out;
}
`,
    },
    starter: {
      python: `class DnsCache:
    def __init__(self):
        pass

    def store(self, name, ip, ttl, now):
        # remember the answer for \`ttl\` seconds
        pass

    def lookup(self, name, now):
        # return the IP if the entry is still valid, otherwise None
        pass
`,
      javascript: `class DnsCache {
  constructor() {}

  store(name, ip, ttl, now) {
    // remember the answer for \`ttl\` seconds
  }

  lookup(name, now) {
    // return the IP if the entry is still valid, otherwise null
  }
}
`,
    },
    cases: [
      { label: 'an unknown name is a miss', args: [[['lookup', 'a.com', 0]]], expected: [null] },
      { label: 'a stored answer is returned within its TTL', args: [[['store', 'a.com', '1.1.1.1', 60, 0], ['lookup', 'a.com', 30]]], expected: [null, '1.1.1.1'] },
      { label: 'an answer expires when the TTL is reached', args: [[['store', 'a.com', '1.1.1.1', 60, 0], ['lookup', 'a.com', 60]]], expected: [null, null] },
      { label: 'storing again replaces the old answer', args: [[['store', 'a.com', '1.1.1.1', 60, 0], ['store', 'a.com', '2.2.2.2', 60, 10], ['lookup', 'a.com', 20]], ], expected: [null, null, '2.2.2.2'] },
      { label: 'different names are kept apart', args: [[['store', 'a.com', '1.1.1.1', 60, 0], ['store', 'b.com', '9.9.9.9', 60, 0], ['lookup', 'b.com', 5]]], expected: [null, null, '9.9.9.9'] },
      { label: 'a TTL of zero is never cached', args: [[['store', 'a.com', '1.1.1.1', 0, 0], ['lookup', 'a.com', 0]]], expected: [null, null] },
      { label: 'still valid one second before expiry', args: [[['store', 'a.com', '1.1.1.1', 60, 0], ['lookup', 'a.com', 59]]], expected: [null, '1.1.1.1'] },
    ],
    hints: ['Store the IP together with the time it expires: `now + ttl`.', 'On lookup, the entry is valid only while `now` is **before** the expiry time.', 'Remove or ignore expired entries and return None.'],
  },
  quiz: [
    { q: 'Which step is skipped when the product list is found in the cache?', options: ['DNS lookup', 'The database query', 'The load balancer'], answer: 1, why: 'A cache hit returns the stored answer, so the app never needs to query the database.' },
    { q: 'Which of these is an LLD (low-level design) question?', options: ['Which database and how many servers should we use?', 'Design the classes and methods for a parking lot', 'How do we put a CDN in front of the site?'], answer: 1, why: 'LLD is about classes, methods and data structures inside one component. Databases, servers and CDNs are high-level (HLD) choices.' },
    { q: 'A site changes its server IP but some users still reach the old one for an hour. Why?', options: ['The CDN is broken', 'DNS answers are cached for their TTL', 'The browser is old'], answer: 1, why: 'Resolvers cache the old IP until its TTL runs out. Lower the TTL before a planned move.' },
  ],
  interview: [
    { q: 'What happens when you type a URL and press Enter?', a: 'The browser checks its caches, resolves the name through **DNS**, opens a **TCP** connection and a **TLS** handshake (HTTPS), sends the HTTP request. Static files may come from a **CDN**; the request goes through a **load balancer** to an app server, which checks a **cache**, then the **database**, and returns the response. The browser renders it, fetching more resources as needed.' },
    { q: 'What is the difference between HLD and LLD?', a: '**HLD** is the architecture: components, how they communicate, data stores, scaling and trade-offs. **LLD** is the detailed design of one component: classes, interfaces, data structures and algorithms (for example the classes of a parking lot or the schema of a table).' },
    { q: 'Where would you look first if a page is slow?', a: 'Measure each hop: DNS time, TLS/connection time, server response time (time to first byte), then database and cache timings, then the size and number of assets. Fix the slowest hop; often a missing cache, an unindexed query or large images.' },
  ],
  mistakes: ['Forgetting that DNS and TLS also add time before the first byte.', 'Putting a cache or CDN in front of data that must always be fresh.', 'Mixing up HLD (the boxes) and LLD (the code inside one box).'],
  recap: 'A request flows DNS, CDN, load balancer, app, cache, database; caches let it skip steps, and HLD is the map while LLD is one zoomed-in box.',
}
