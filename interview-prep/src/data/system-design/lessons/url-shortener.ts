import type { SdLesson } from '../types'

export const urlShortener: SdLesson = {
  id: 'design-url-shortener',
  title: 'Case study: design a URL shortener',
  topic: 'Putting it all together',
  blurb: 'Design a service like bit.ly: estimate the load, choose the short code scheme, and place a cache, a database and load balancers.',
  why: {
    story: 'A URL shortener turns `https://example.com/some/very/long/page?id=123` into `https://sho.rt/4c92`, and sends anyone who opens the short link to the long one. It looks tiny, but it is a perfect interview problem because it combines **estimation**, **data modelling**, **caching**, **scaling reads** and a clever **ID scheme**. Reads vastly outnumber writes (a link is created once and opened many times).',
    pains: ['Billions of links must be stored, forever.', 'Redirects must be very fast: users are waiting.', 'Short codes must be unique, short and hard to guess in order.', 'Read traffic can be hundreds of times higher than write traffic.'],
  },
  how: {
    title: 'The design: write path and read path',
    nodes: [
      { id: 'u', label: 'Users', kind: 'user', x: 8, y: 28 },
      { id: 'lb', label: 'Load balancer', kind: 'lb', x: 28, y: 28 },
      { id: 'app', label: 'App servers', kind: 'server', x: 52, y: 28, sub: 'stateless' },
      { id: 'cache', label: 'Cache', kind: 'cache', x: 78, y: 10, sub: 'code → URL' },
      { id: 'db', label: 'Database', kind: 'db', x: 78, y: 28, sub: 'sharded' },
      { id: 'id', label: 'ID generator', kind: 'service', x: 52, y: 50, sub: 'counter' },
    ],
    edges: [{ from: 'u', to: 'lb' }, { from: 'lb', to: 'app' }, { from: 'app', to: 'cache' }, { from: 'app', to: 'db' }, { from: 'app', to: 'id' }],
    frames: [
      { caption: '**Create a link.** The user submits a long URL. A load balancer sends it to an app server.', active: ['u', 'lb', 'app'], flow: [['u', 'lb'], ['lb', 'app']] },
      { caption: 'The app asks the **ID generator** for the next unique number (say 1,000,000).', active: ['app', 'id'], flow: [['app', 'id']] },
      { caption: 'It converts the number to **base 62**: 1,000,000 becomes `4c92`. That is the short code.', active: ['app'], badges: { app: '4c92' } },
      { caption: 'The app saves `4c92 → long URL` in the database and returns `sho.rt/4c92`.', active: ['app', 'db'], flow: [['app', 'db']] },
      { caption: '**Open a link.** Someone opens `sho.rt/4c92`. The app checks the **cache** first.', active: ['u', 'app', 'cache'], flow: [['app', 'cache']], badges: { cache: 'HIT' } },
      { caption: 'On a cache miss it reads the database and fills the cache. Then it replies with an HTTP **301/302 redirect** to the long URL.', active: ['app', 'db', 'cache'], flow: [['app', 'db'], ['app', 'cache']] },
    ],
  },
  realWorld: [
    { name: 'Bitly, TinyURL and friends', text: 'Public shorteners work this way: a short code maps to a long URL, and the redirect is served from a cache for popular links.' },
    { name: 'Twitter / X t.co', text: 'Every link in a post is wrapped in a short link, which also lets the service check links for safety and count clicks.' },
    { name: 'Marketing links', text: 'Companies use short links so that they can change the destination later and measure clicks per campaign.' },
    { name: 'The same ID idea elsewhere', text: 'Short, unique, ordered IDs are used for invite codes, order numbers and file names. Large systems often use distributed ID generators such as Twitter\'s Snowflake design.' },
  ],
  tradeoffs: {
    gain: ['Counter + base 62 gives short, unique codes with no collisions.', 'The read path is cacheable and scales almost without limit.', 'Stateless app servers scale horizontally behind a load balancer.'],
    cost: ['A counter must be generated safely across servers (a single point to protect).', 'Sequential codes can be guessed (add a secret shuffle if links are private).', 'Choosing 301 (permanent, cached by browsers) versus 302 (temporary) affects analytics.'],
    useWhen: ['Reads far outnumber writes.', 'The data is a simple key-value lookup.'],
    avoidWhen: ['You need private links with strong secrecy: use long random tokens instead of sequential codes.'],
  },
  steps: [
    {
      title: 'Random code and check for a collision',
      tag: 'slow',
      idea: 'Generate a random 6-character code, check the database to see if it is already used, and try again if it is. It is easy, but every write needs a database lookup, and collisions become more common as you fill the space.',
      walk: ['Pick 6 random characters from a 62-character alphabet.', 'Look the code up. If it exists, go back to step 1.', 'Otherwise store the mapping.'],
      only: [],
      code: {
        python: `import random

ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"


def random_code(taken):
    while True:
        code = "".join(random.choice(ALPHABET) for _ in range(6))
        if code not in taken:
            return code


def encode_id(n):
    return str(n)
`,
        javascript: `const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function randomCode(taken) {
  while (true) {
    let code = "";
    for (let i = 0; i < 6; i++) code += ALPHABET[Math.floor(Math.random() * 62)];
    if (!taken.has(code)) return code;
  }
}

function encodeId(n) {
  return String(n);
}
`,
      },
      time: 'O(1) expected, plus a lookup',
      space: 'O(1)',
      verdict: 'Works for small scale. At billions of links the extra lookup and the growing collision rate hurt.',
    },
    {
      title: 'A counter converted to base 62',
      tag: 'best',
      idea: 'Give every new link the **next number** from a counter (1, 2, 3…) and write that number in **base 62** using the characters `0-9`, `a-z` and `A-Z`. Numbers are unique, so codes never collide, and base 62 makes them short: 62⁶ is about 56 billion links in just 6 characters. To convert, repeatedly divide by 62 and collect the remainders.',
      walk: ['If `n` is 0, the code is "0".', 'While `n > 0`: take `n % 62` as the next digit (the **last** character), then set `n = n // 62`.', 'Build the characters from right to left, and look each digit up in the alphabet.', 'To decode a code, go the other way: multiply the running total by 62 and add each character\'s value.'],
      code: {
        python: `ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"


def encode_id(n):
    if n == 0:
        return ALPHABET[0]
    code = ""
    while n > 0:
        code = ALPHABET[n % 62] + code
        n //= 62
    return code


def decode_code(code):
    n = 0
    for ch in code:
        n = n * 62 + ALPHABET.index(ch)
    return n
`,
        javascript: `const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encodeId(n) {
  if (n === 0) return ALPHABET[0];
  let code = "";
  while (n > 0) {
    code = ALPHABET[n % 62] + code;
    n = Math.floor(n / 62);
  }
  return code;
}

function decodeCode(code) {
  let n = 0;
  for (const ch of code) n = n * 62 + ALPHABET.indexOf(ch);
  return n;
}
`,
      },
      time: 'O(log n) per code',
      space: 'O(1)',
      verdict: 'Unique by construction and short. To spread the counter across many servers, hand each server a **range** of numbers (for example 1,000,000 at a time) so they do not need to ask a central counter for every link.',
    },
  ],
  sim: {
    id: 'shortener',
    intro: 'This is the back-of-the-envelope maths you do at the start of a design interview. Change the numbers to see how load and storage scale, and convert any counter value into a short code.',
    tryThis: ['With 100 million new links a day, how many write and read requests per second? Notice reads are 100 times writes.', 'How many characters do you need for 5 years of links? Try 10 years.', 'Convert 62, 125 and 1,000,000 to short codes and compare with the lesson.'],
  },
  practice: {
    fn: { python: 'encode_id', javascript: 'encodeId' },
    starter: {
      python: `ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"


def encode_id(n):
    # turn the number into a base 62 string using ALPHABET
    pass
`,
      javascript: `const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encodeId(n) {
  // turn the number into a base 62 string using ALPHABET
}
`,
    },
    cases: [
      { label: '0 is "0"', args: [0], expected: '0' },
      { label: 'single digits', args: [9], expected: '9' },
      { label: 'lowercase letters follow the digits', args: [35], expected: 'z' },
      { label: 'uppercase letters come last', args: [61], expected: 'Z' },
      { label: '62 needs two characters', args: [62], expected: '10' },
      { label: '125 = 2 × 62 + 1', args: [125], expected: '21' },
      { label: 'the largest two-character code', args: [3843], expected: 'ZZ' },
      { label: '3844 = 62²', args: [3844], expected: '100' },
      { label: 'one million', args: [1000000], expected: '4c92' },
    ],
    hints: ['Base 62 works like base 10, but with 62 digits: `0-9`, then `a-z`, then `A-Z`.', 'Take `n % 62` to get the last digit, then divide `n` by 62 (whole-number division) and repeat.', 'You build the code from the right, so add each new character at the **front**. Handle `n == 0` separately.'],
  },
  quiz: [
    { q: 'A shortener gets 100 million new links a day and reads are 100 times writes. Roughly how many read requests per second?', options: ['About 1,200', 'About 116,000', 'About 11 billion'], answer: 1, why: '100 million / 86,400 seconds is about 1,160 writes per second. Times 100 reads per write is about 116,000 reads per second: a cache is clearly needed.' },
    { q: 'Why is a counter converted to base 62 better than random codes?', options: ['Counters never collide, so no uniqueness lookup is needed', 'Random codes are impossible to generate', 'Base 62 codes are encrypted'], answer: 0, why: 'Each counter value is unique, so each code is unique with no check against the database.' },
    { q: 'You use a 301 (permanent) redirect. What is a consequence?', options: ['Browsers may cache the redirect, so later clicks never reach your server and are not counted', 'The short link stops working', 'The database is updated faster'], answer: 0, why: '301 allows browsers to remember the target. A 302 (temporary) redirect makes every click pass through your service, which helps analytics and lets you change the destination.' },
  ],
  interview: [
    { q: 'Walk me through designing a URL shortener.', a: '1) **Requirements**: create short links, redirect fast, maybe custom aliases, expiry, analytics. 2) **Estimate**: writes per second, reads per second (reads dominate), storage (about 500 bytes per link). 3) **API**: `POST /shorten`, `GET /{code}` returning a redirect. 4) **Data**: key-value mapping code → URL (a NoSQL store or a sharded SQL table). 5) **ID scheme**: counter + base 62. 6) **Scale reads** with a cache and CDN. 7) **Reliability**: replicas, load balancers, rate limiting. 8) **Trade-offs**: 301 vs 302, guessable codes.' },
    { q: 'How do you generate unique IDs when there are many app servers?', a: 'Options: a **central counter** (simple, but a bottleneck: hand out ranges to each server to reduce calls), a **database auto-increment** with sharding by step, a **Snowflake-style ID** (timestamp + machine id + sequence) or **random codes with collision checks**. Ranges are the common answer for shorteners.' },
    { q: 'How would you handle custom aliases and expiring links?', a: 'Custom aliases go through a uniqueness check (a conditional insert that fails if the key exists). Expiry is a **TTL**: store an expiry time with each record, check it on read, and use a background job or the database\'s TTL feature to delete old rows.' },
  ],
  mistakes: ['Skipping the estimation step and designing without numbers.', 'Using random codes without a collision strategy.', 'Forgetting that reads dominate and not adding a cache.', 'Making sequential codes for links that are supposed to be private.'],
  recap: 'Estimate first, then design for the dominant traffic: a counter in base 62 for unique short codes, and a cache in front of the database for the redirects.',
}
