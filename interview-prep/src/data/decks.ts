import { NOTE_TOPICS } from './notes'

export interface Card {
  id: string
  q: string
  a: string
}

export interface Deck {
  id: string
  title: string
  description: string
  /** Any CSS colour. */
  color: string
  cards: Card[]
}

function deck(id: string, title: string, description: string, color: Deck['color'], qa: [string, string][]): Deck {
  return { id, title, description, color, cards: qa.map(([q, a], i) => ({ id: `${id}-${i + 1}`, q, a })) }
}

// Rapid-fire interview questions, mostly from the revision notes in
// notes/system-design and notes/dsa (and the React volume).
export const DECKS: Deck[] = [
  deck('system-design', 'System Design', 'Building blocks, data, scaling and real case studies.', 'var(--accent)', [
    ['What happens when you type a URL and press Enter?', 'DNS lookup (browser → OS → resolver → root → TLD → authoritative) → TCP handshake → TLS handshake → HTTP request → CDN / load balancer → app server → cache → database → response → browser renders (DOM, CSSOM, layout, paint).'],
    ['Load balancer vs reverse proxy?', 'A load balancer spreads traffic across many servers with health checks. A reverse proxy sits in front of servers for SSL termination, caching, compression and security. Every LB is a reverse proxy; not every reverse proxy balances load.'],
    ['Which load-balancing algorithm suits long, uneven requests?', 'Least connections — send each request to the server with the fewest active connections.'],
    ['L4 vs L7 load balancing?', 'L4 routes on IP + port only (fast, cannot read URLs). L7 understands HTTP — URL, headers, cookies — so it can route /api and /images to different services.'],
    ['How does a CDN reduce latency?', 'It serves cached copies from an edge server physically close to the user. Only cache misses travel to the origin; the result is cached for its TTL.'],
    ['Forward vs reverse proxy?', 'A forward proxy acts for clients (hides the client, filters content). A reverse proxy acts for servers (hides servers, load balancing, SSL, caching).'],
    ['What does TLS give you?', 'Encryption (no one can read), integrity (no one can modify) and authentication (the certificate proves the domain). Asymmetric crypto agrees a session key; symmetric crypto (AES) encrypts the data.'],
    ['Write-through vs write-back cache?', 'Write-through writes cache and DB together — consistent but slower writes. Write-back writes to cache and flushes to the DB later — fast but data can be lost if the cache dies.'],
    ['What is a cache stampede and how do you prevent it?', 'A hot key expires and thousands of requests hit the DB at once. Prevent with a lock / single-flight on refill and random jitter on TTLs.'],
    ['Horizontal vs vertical scaling?', 'Vertical = a bigger machine (simple, hardware limit, single point of failure). Horizontal = more machines behind a load balancer (needs stateless servers, practically unlimited).'],
    ['Sharding vs replication?', 'Sharding splits data across servers to scale writes and storage. Replication copies the same data to scale reads and survive failures. Real systems shard and replicate each shard.'],
    ['Why use consistent hashing?', 'Adding or removing a node only moves about 1/N of the keys instead of reshuffling almost all of them as hash % N would.'],
    ['CAP theorem in one line?', 'Network partitions will happen, so during one you choose Consistency (CP: reject requests) or Availability (AP: answer, maybe stale).'],
    ['ACID vs BASE?', 'ACID: atomic, consistent, isolated, durable transactions — strong consistency (SQL, money). BASE: basically available, soft state, eventually consistent — scale and availability (many NoSQL stores).'],
    ['Name the 4 NoSQL types with one use each.', 'Document (MongoDB) — product catalog. Key-value (Redis) — sessions, cache. Column-family (Cassandra) — heavy writes, time series. Graph (Neo4j) — social graphs, recommendations.'],
    ['Why use a message queue?', 'Decouple services, absorb traffic spikes, run slow work asynchronously and retry safely. With at-least-once delivery, consumers must be idempotent; failures go to a dead-letter queue.'],
    ['WebSocket vs HTTP?', 'HTTP is request → response and stateless. A WebSocket upgrades once (101 Switching Protocols) and keeps a persistent, two-way connection — for chat, live scores, collaboration.'],
    ['Which rate-limiting algorithm allows short bursts?', 'Token bucket: tokens refill at a fixed rate and each request spends one. Keep counters in a shared store (Redis) so the limit holds across servers.'],
    ['Session vs JWT?', 'Session: state on the server, easy to revoke, needs a shared store to scale. JWT: signed, stateless token any server can verify — easy to scale, hard to revoke (use short-lived access + refresh tokens).'],
    ['How do you prevent double booking (e.g. IRCTC Tatkal)?', 'Atomic conditional update or row lock on the seat inventory (UPDATE … SET available = available − 1 WHERE available > 0), hold the seat during payment, release on timeout. Put a queue / waiting room and rate limits in front.'],
    ['How does Instagram build the home feed?', 'Hybrid fan-out: push new post IDs into followers\' feed lists for normal users (fan-out on write), but pull celebrity posts at read time (fan-out on read) and merge.'],
  ]),
  deck('dsa', 'DSA Patterns', 'Big-O, the four patterns, recursion and sorting.', 'var(--violet)', [
    ['What is Big-O?', 'How the number of steps (or memory) grows as the input size n grows — worst case, constants dropped, biggest term kept.'],
    ['O(n) vs O(log n) on one million items?', 'About 1,000,000 steps vs about 20 steps.'],
    ['When do two pointers work?', 'Usually on sorted arrays or when comparing both ends — pairs that hit a target, palindromes, in-place de-duplication.'],
    ['Frequency counter in one line?', 'Count items in a hash map, then compare counts instead of nested loops — O(n) instead of O(n²).'],
    ['Fixed vs variable sliding window?', 'Fixed: the size k is given (max sum of k items). Variable: the window grows and shrinks by a rule (longest substring without repeats).'],
    ['Why does binary search need sorted data?', 'Throwing away half is only safe if everything on one side is known to be smaller or bigger than the middle.'],
    ['Binary search loop condition with inclusive bounds?', 'while (lo <= hi), with lo = mid + 1 and hi = mid − 1. Using lo < hi skips the last element.'],
    ['Two must-haves of every recursive function?', 'A base case that stops it, and a smaller input on every call (and return the recursive result).'],
    ['Why is naive Fibonacci slow, and the fix?', 'It recomputes the same sub-problems — O(2ⁿ). Memoise answers in a map → O(n).'],
    ['Helper-method recursion?', 'An outer function holds the result (array, counter); an inner recursive helper fills it, so the result is not reset on each call.'],
    ['Bubble vs selection vs insertion sort?', 'Bubble: swap neighbours, the max bubbles to the end. Selection: find the min, swap it to the front. Insertion: insert the next item into the sorted left part.'],
    ['Which simple sort is best for nearly-sorted data?', 'Insertion sort — O(n) best case. (Optimised bubble sort is also O(n) best case.)'],
    ['What does "stable sort" mean?', 'Equal elements keep their original relative order. Bubble and insertion are stable; selection is not.'],
    ['Why is [10, 1, 5].sort() wrong in JavaScript?', 'The default sort compares strings, giving [1, 10, 5]. Pass a comparator: arr.sort((a, b) => a − b).'],
    ['Substring vs subsequence?', 'A substring is contiguous; a subsequence keeps order but may skip characters.'],
  ]),
  deck('react', 'React', 'Rendering, hooks, state and performance.', 'var(--warn)', [
    ['Why is the Virtual DOM fast?', 'It is not magic: React diffs the new element tree against the old one and applies the minimum set of real-DOM changes, batching updates.'],
    ['State vs props?', 'Props come from the parent and are read-only. State is owned by the component and changed with its setter.'],
    ['Why do list items need keys?', 'So React can tell which item is which across renders and keep the right state/DOM. Keys must be stable and unique — not array indexes for reorderable lists.'],
    ['Controlled vs uncontrolled inputs?', 'Controlled: the value lives in React state (value + onChange). Uncontrolled: the DOM holds the value and you read it with a ref.'],
    ['useEffect vs useLayoutEffect?', 'useEffect runs after paint (async). useLayoutEffect runs after DOM mutation but before paint (sync) — use it for measuring layout.'],
    ['Why can\'t hooks be called conditionally?', 'React tracks hooks by call order; changing the order between renders mismatches the state slots.'],
    ['useMemo vs useCallback vs React.memo?', 'useMemo caches a value, useCallback caches a function, React.memo skips re-rendering a component when its props are shallow-equal.'],
    ['How do you avoid prop drilling?', 'Component composition (children), Context, or a store such as Redux Toolkit or Zustand.'],
    ['Context vs Redux?', 'Context passes values down the tree. Redux is a full state-management system with middleware, devtools, predictable updates and selectors that limit re-renders.'],
    ['What is reconciliation?', 'Diffing the new element tree against the previous one to decide DOM updates; element type and key drive the matching.'],
    ['What is hydration?', 'React attaching event handlers and state to server-rendered HTML in the browser.'],
    ['SSR vs CSR in one line?', 'SSR sends ready HTML (better SEO and first paint) then hydrates; CSR sends an empty shell plus a JS bundle that renders in the browser.'],
    ['What are Error Boundaries?', 'Class components with getDerivedStateFromError / componentDidCatch that catch render errors in their children and show a fallback.'],
    ['How do you secure a React app?', 'Avoid dangerouslySetInnerHTML (or sanitise), keep tokens in httpOnly cookies, validate on the server, use HTTPS and a CSP, keep dependencies updated.'],
  ]),
  deck('javascript', 'JavaScript', 'The language questions every frontend round asks.', 'var(--good)', [
    ['var vs let vs const?', 'var is function-scoped and hoisted (initialised to undefined). let and const are block-scoped and in the temporal dead zone until declared; const cannot be reassigned (but objects stay mutable).'],
    ['What is a closure?', 'A function that remembers variables from the scope where it was created, even after that scope has returned — used for private state, factories, memoisation.'],
    ['== vs ===?', '=== compares without type conversion. == converts types first ("1" == 1 is true). Use === by default.'],
    ['How does the event loop work?', 'The call stack runs sync code. When it is empty, all microtasks (promise callbacks, queueMicrotask) run, then one macrotask (setTimeout, I/O, events), then microtasks again, and so on.'],
    ['Output order: setTimeout(log 1), Promise.resolve().then(log 2), log 3?', '3, 2, 1 — sync first, then microtasks (promise), then macrotasks (timeout).'],
    ['What does "this" refer to?', 'It depends on how a function is called: obj.method() → obj; plain call → undefined in strict mode; new → the new object; arrow functions take this from the surrounding scope.'],
    ['call vs apply vs bind?', 'call(thisArg, a, b) and apply(thisArg, [a, b]) invoke immediately; bind(thisArg) returns a new function with this fixed.'],
    ['Debounce vs throttle?', 'Debounce runs after calls stop for X ms (search box). Throttle runs at most once every X ms (scroll, resize).'],
    ['Promise.all vs allSettled vs race vs any?', 'all: all must succeed (fails fast). allSettled: waits for every result. race: first to settle wins. any: first to succeed wins.'],
    ['Shallow vs deep copy?', 'A shallow copy ({...obj}, [...arr]) copies the top level only; nested objects are shared. structuredClone(obj) makes a deep copy.'],
    ['What is hoisting?', 'Declarations are processed before code runs: function declarations are fully hoisted, var is hoisted as undefined, let/const/class are hoisted but unusable until declared.'],
    ['Prototype inheritance in one line?', 'Every object has a hidden link ([[Prototype]]) to another object; property lookups walk up that chain. class is syntax over this.'],
    ['What is event delegation?', 'Attach one listener to a parent and use event.target to handle events from many children — fewer listeners, works for elements added later.'],
    ['map vs forEach?', 'map returns a new array of the callback results; forEach returns undefined and is only for side effects.'],
  ]),
]

// Every notes topic contributes its rapid-fire Q&A as a deck, unless a
// hand-made deck with the same id already exists (React, JavaScript).
for (const topic of NOTE_TOPICS) {
  if (!DECKS.some((d) => d.id === topic.id)) {
    DECKS.push(deck(topic.id, topic.title, topic.tagline, topic.color, topic.qa))
  }
}

export const DECKS_BY_ID = Object.fromEntries(DECKS.map((d) => [d.id, d]))
export const ALL_CARDS = DECKS.flatMap((d) => d.cards.map((c) => ({ ...c, deckId: d.id })))
