import type { SdLesson } from '../types'

export const cdn: SdLesson = {
  id: 'cdn',
  title: 'Content delivery network (CDN)',
  topic: 'Speed for users everywhere',
  blurb: 'Keep copies of files in servers close to users, so a visitor in Sydney does not wait for a server in Mumbai.',
  why: {
    story: 'Light travels fast, but not instantly: a round trip across the world takes **hundreds of milliseconds** before the server even starts working. A page needs dozens of images, scripts and styles, so a far-away user feels every delay. A CDN is a network of servers placed in many cities. It keeps **copies of your static files** near each user and serves them from there, and your own servers (the **origin**) are asked only when the CDN does not have a file yet.',
    pains: ['Users far from your servers see slow page loads.', 'Your origin servers pay for the bandwidth of every image and video.', 'A traffic spike for one popular file hits the origin hard.', 'Attacks that flood a single location can overwhelm it.'],
  },
  before: {
    title: 'Without a CDN: every file comes from the origin',
    nodes: [
      { id: 'sy', label: 'User in Sydney', kind: 'user', x: 12, y: 14 },
      { id: 'ny', label: 'User in New York', kind: 'user', x: 12, y: 42 },
      { id: 'o', label: 'Origin server', kind: 'server', x: 76, y: 28, sub: 'in Mumbai' },
    ],
    edges: [{ from: 'sy', to: 'o', label: '320 ms' }, { from: 'ny', to: 'o', label: '240 ms' }],
    frames: [
      { caption: 'Every user fetches every image, script and video from one server in Mumbai.', active: ['sy', 'ny', 'o'], flow: [['sy', 'o'], ['ny', 'o']] },
      { caption: 'Distant users wait a long time for each file, and the origin pays for all of the traffic.', bad: ['o'], badges: { o: 'BUSY' } },
    ],
  },
  how: {
    title: 'With a CDN: copies near each user',
    nodes: [
      { id: 'sy', label: 'User in Sydney', kind: 'user', x: 10, y: 14 },
      { id: 'ny', label: 'User in New York', kind: 'user', x: 10, y: 42 },
      { id: 'e1', label: 'Edge Sydney', kind: 'cdn', x: 44, y: 14 },
      { id: 'e2', label: 'Edge New York', kind: 'cdn', x: 44, y: 42 },
      { id: 'o', label: 'Origin', kind: 'server', x: 84, y: 28, sub: 'Mumbai' },
    ],
    edges: [{ from: 'sy', to: 'e1' }, { from: 'ny', to: 'e2' }, { from: 'e1', to: 'o' }, { from: 'e2', to: 'o' }],
    frames: [
      { caption: 'The first user in Sydney asks for `logo.png`. The nearby edge server does not have it: **cache miss**.', active: ['sy', 'e1'], flow: [['sy', 'e1']], badges: { e1: 'MISS' } },
      { caption: 'The edge fetches the file from the origin **once** and keeps a copy (with a time to live).', active: ['e1', 'o'], flow: [['e1', 'o']] },
      { caption: 'The next Sydney users get the file straight from the edge in a few milliseconds: **cache hit**.', active: ['sy', 'e1'], flow: [['sy', 'e1']], badges: { e1: 'HIT' } },
      { caption: 'New York has its own edge. Its first request also goes to the origin, then everyone nearby is served locally.', active: ['ny', 'e2', 'o'], flow: [['ny', 'e2'], ['e2', 'o']], badges: { e2: 'MISS' } },
      { caption: 'The origin sees only a handful of requests, however many users there are. When the file changes, the CDN copy expires or is purged.', active: ['o'] },
    ],
  },
  realWorld: [
    { name: 'Cloudflare, Akamai, Amazon CloudFront, Fastly', text: 'Large CDN providers with servers in hundreds of cities. You point your domain at them and they cache your files.' },
    { name: 'Netflix Open Connect', text: 'Netflix places its own cache appliances inside internet providers\' networks, so popular videos are served from very close to viewers.' },
    { name: 'Push vs pull CDN', text: 'A **pull** CDN fetches files from your origin on the first request (simple, most common). A **push** CDN needs you to upload files to it in advance, which suits large rarely-changing files.' },
    { name: 'More than speed', text: 'CDNs also absorb traffic spikes and DDoS attacks, and terminate HTTPS close to the user.' },
  ],
  tradeoffs: {
    gain: ['Much lower latency for far-away users.', 'The origin handles far less traffic and bandwidth.', 'Absorbs spikes and some attacks.'],
    cost: ['Content can be stale until its TTL expires or you purge it.', 'Extra cost per gigabyte and a new thing to configure.', 'Personal or private data must not be cached for everyone.'],
    useWhen: ['Images, video, scripts, styles, downloads.', 'A global audience.', 'Pages that are the same for most users.'],
    avoidWhen: ['Highly personal responses (a user\'s own account page).', 'Data that must always be real-time.'],
  },
  steps: [
    {
      title: 'No cache: always ask the origin',
      tag: 'slow',
      idea: 'The simplest edge server forwards every request to the origin. It works, but it adds a hop and saves nothing.',
      walk: ['Receive a request for a URL.', 'Forward it to the origin and return the answer.', 'Remember nothing, so every request is a "miss".'],
      only: [4],
      code: {
        python: `class EdgeCache:
    def __init__(self, ttl):
        self.ttl = ttl

    def get(self, url, now):
        return "miss"
`,
        javascript: `class EdgeCache {
  constructor(ttl) {
    this.ttl = ttl;
  }

  get(url, now) {
    return "miss";
  }
}
`,
      },
      time: 'every request reaches the origin',
      space: 'O(1)',
      verdict: 'Correct, but pointless: all the work still lands on the origin.',
    },
    {
      title: 'Keep a copy until its TTL expires',
      tag: 'best',
      idea: 'Remember when each URL was last fetched from the origin. If a request arrives while the copy is still younger than the **TTL**, answer from the edge (**hit**). Otherwise fetch from the origin again (**miss**) and restart the clock. The origin controls the TTL with the `Cache-Control` response header.',
      walk: ['Keep `fetched_at[url]`.', 'If the URL is known and `now - fetched_at < ttl`, return "hit".', 'Otherwise record `fetched_at[url] = now` (we fetched it from the origin) and return "miss".'],
      code: {
        python: `class EdgeCache:
    def __init__(self, ttl):
        self.ttl = ttl
        self.fetched_at = {}

    def get(self, url, now):
        if url in self.fetched_at and now - self.fetched_at[url] < self.ttl:
            return "hit"
        self.fetched_at[url] = now  # fetch from the origin
        return "miss"
`,
        javascript: `class EdgeCache {
  constructor(ttl) {
    this.ttl = ttl;
    this.fetchedAt = new Map();
  }

  get(url, now) {
    if (this.fetchedAt.has(url) && now - this.fetchedAt.get(url) < this.ttl) {
      return "hit";
    }
    this.fetchedAt.set(url, now); // fetch from the origin
    return "miss";
  }
}
`,
      },
      time: 'O(1) per request',
      space: 'O(files)',
      verdict: 'Real CDNs also evict old files when space runs out, revalidate with the origin using ETags and let you purge a file when it changes.',
    },
  ],
  sim: {
    id: 'cdn',
    intro: 'The origin is in Mumbai. Press **Request** for each region and compare latency with and without a CDN.',
    tryThis: ['With the CDN on, request from London twice: the first trip goes to the origin, the second is served by the edge.', 'Switch the CDN off and request from Sydney: always the slow origin path.', 'Notice that Mumbai hardly benefits: it was already close. CDNs help far-away users most.'],
  },
  practice: {
    fn: { python: 'simulate_cdn', javascript: 'simulateCdn' },
    symbol: { python: 'class EdgeCache', javascript: 'class EdgeCache' },
    driver: {
      python: `def simulate_cdn(ttl, requests):
    edge = EdgeCache(ttl)
    return [edge.get(url, now) for url, now in requests]
`,
      javascript: `function simulateCdn(ttl, requests) {
  const edge = new EdgeCache(ttl);
  return requests.map(([url, now]) => edge.get(url, now));
}
`,
    },
    starter: {
      python: `class EdgeCache:
    def __init__(self, ttl):
        self.ttl = ttl

    def get(self, url, now):
        # return "hit" if a fresh copy is cached, otherwise "miss" (and remember the fetch)
        pass
`,
      javascript: `class EdgeCache {
  constructor(ttl) {
    this.ttl = ttl;
  }

  get(url, now) {
    // return "hit" if a fresh copy is cached, otherwise "miss" (and remember the fetch)
  }
}
`,
    },
    cases: [
      { label: 'the first request misses, the second hits', args: [60, [['a.png', 0], ['a.png', 10]]], expected: ['miss', 'hit'] },
      { label: 'a copy expires exactly at the TTL', args: [60, [['a.png', 0], ['a.png', 60]]], expected: ['miss', 'miss'] },
      { label: 'each URL is cached separately', args: [60, [['a.png', 0], ['b.png', 1], ['a.png', 2], ['b.png', 3]]], expected: ['miss', 'miss', 'hit', 'hit'] },
      { label: 'after expiry the refetched copy is fresh again', args: [60, [['a.png', 0], ['a.png', 70], ['a.png', 100]]], expected: ['miss', 'miss', 'hit'] },
      { label: 'a TTL of zero never caches', args: [0, [['a.png', 0], ['a.png', 0]]], expected: ['miss', 'miss'] },
      { label: 'one request is always a miss', args: [60, [['a.png', 5]]], expected: ['miss'] },
    ],
    hints: ['Remember the time each URL was last fetched from the origin.', 'It is a hit only if `now - fetched_at < ttl`.', 'On a miss, record `now` as the new fetch time (the edge just downloaded a fresh copy).'],
  },
  quiz: [
    { q: 'Which content is best served by a CDN?', options: ['A user\'s private account page', 'A product image used by every visitor', 'A live stock price'], answer: 1, why: 'Public, identical, rarely-changing files give the best hit rate. Private or real-time data should not be cached for everyone.' },
    { q: 'You update `logo.png` but users still see the old logo. What is the likely cause and fix?', options: ['The CDN has a stale copy: purge it, or use a new file name (versioning)', 'The database is slow', 'The load balancer is down'], answer: 0, why: 'The edge keeps serving the cached copy until its TTL ends. Purge the file, or change its name (logo.v2.png) so caches treat it as new.' },
    { q: 'What does the origin see when 1 million users in one city request the same cached image?', options: ['1 million requests', 'About one request (the first miss)', 'Zero requests ever'], answer: 1, why: 'Only the first request that misses goes to the origin; the rest are served from the edge until the copy expires.' },
  ],
  interview: [
    { q: 'How does a CDN reduce latency?', a: 'It serves content from an **edge server near the user**, which cuts the network distance (round-trip time), avoids repeated trips to the origin, and can reuse warm TCP/TLS connections. Popular files are found in the edge cache after the first request.' },
    { q: 'How do you invalidate content on a CDN?', a: 'Options: wait for the **TTL** to expire, **purge** a URL through the CDN API, or **version the file name** (`app.3f2a.js`) so a new version is a new URL. Versioning is the most reliable for scripts and styles.' },
    { q: 'What is the difference between a CDN and a reverse proxy cache?', a: 'Both cache responses, but a CDN is a **globally distributed** network of edge servers close to users, while a reverse proxy (such as Nginx) usually sits next to your servers in one place. Many systems use both.' },
  ],
  mistakes: ['Caching personalised responses so one user sees another user\'s data.', 'A very long TTL with no way to purge, so mistakes stay live.', 'Not versioning static asset names.', 'Forgetting that the first request in each region is still slow.'],
  recap: 'A CDN keeps cached copies of your files near users and goes back to the origin only on a miss or when the copy expires.',
}
