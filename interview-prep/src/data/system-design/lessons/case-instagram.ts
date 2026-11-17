import type { SdLesson } from '../types'

const POSTS = [[1, 'asha', 100], [2, 'ravi', 95], [3, 'asha', 90], [4, 'meera', 85], [5, 'ravi', 80], [6, 'asha', 70], [7, 'zed', 60]]

export const caseInstagram: SdLesson = {
  id: 'case-instagram',
  title: 'Case study: Instagram news feed',
  topic: 'Design the home feed',
  blurb: 'Put the pieces together: photos, a feed built from people you follow, fan-out on read vs write, caching and a CDN.',
  why: {
    story: 'Design Instagram: users upload photos, follow others and see a **feed** of recent posts from the people they follow. The challenge is scale: hundreds of millions of people, each opening the feed many times a day, with some accounts followed by tens of millions. The hardest question is: **when do we build each user\'s feed**? At the moment they open the app (**fan-out on read**), or at the moment someone posts (**fan-out on write**)? Real systems mix both.',
    pains: ['Building a feed by querying every followed account is slow.', 'Pushing a post into millions of followers\' feeds at once is expensive.', 'Photos are large and users are everywhere.', 'Most users only look at the first few posts.'],
  },
  before: {
    title: 'Fan-out on read (pull)',
    nodes: [
      { id: 'u', label: 'Viewer', kind: 'user', x: 8, y: 28 },
      { id: 'f', label: 'Feed service', kind: 'service', x: 36, y: 28, sub: 'merge on demand' },
      { id: 'p1', label: 'Posts of Asha', kind: 'db', x: 80, y: 8 },
      { id: 'p2', label: 'Posts of Ravi', kind: 'db', x: 80, y: 28 },
      { id: 'p3', label: 'Posts of Meera', kind: 'db', x: 80, y: 48 },
    ],
    edges: [{ from: 'u', to: 'f' }, { from: 'f', to: 'p1' }, { from: 'f', to: 'p2' }, { from: 'f', to: 'p3' }],
    frames: [
      { caption: 'The viewer opens the app. The feed service must work out the feed **now**.', active: ['u', 'f'], flow: [['u', 'f']] },
      { caption: 'It reads the recent posts of **every account** the viewer follows and merges them by time.', active: ['f', 'p1', 'p2', 'p3'], flow: [['f', 'p1'], ['f', 'p2'], ['f', 'p3']] },
      { caption: 'Writes are cheap (a post is stored once), but reads are slow when you follow hundreds of people.', bad: ['f'], badges: { f: 'SLOW' } },
    ],
  },
  how: {
    title: 'Fan-out on write (push) with CDN and cache',
    nodes: [
      { id: 'a', label: 'Poster', kind: 'user', x: 8, y: 14 },
      { id: 'api', label: 'Post service', kind: 'service', x: 34, y: 14 },
      { id: 'q', label: 'Queue', kind: 'queue', x: 58, y: 14 },
      { id: 'w', label: 'Feed workers', kind: 'worker', x: 82, y: 14 },
      { id: 'fc', label: 'Feed cache', kind: 'cache', x: 82, y: 44, sub: 'per user' },
      { id: 'v', label: 'Viewer', kind: 'user', x: 8, y: 44 },
      { id: 'cdn', label: 'CDN + storage', kind: 'cdn', x: 44, y: 44, sub: 'photos' },
    ],
    edges: [{ from: 'a', to: 'api' }, { from: 'api', to: 'q' }, { from: 'q', to: 'w' }, { from: 'w', to: 'fc' }, { from: 'v', to: 'fc' }, { from: 'v', to: 'cdn' }],
    frames: [
      { caption: 'A user posts a photo. The **photo** goes to object storage and the **CDN**; the post record is saved, and an event goes to a queue.', active: ['a', 'api', 'q'], flow: [['a', 'api'], ['api', 'q']] },
      { caption: 'Workers take the event and **push** the new post id into the **feed cache** of each follower (fan-out on write).', active: ['q', 'w', 'fc'], flow: [['q', 'w'], ['w', 'fc']] },
      { caption: 'A viewer opens the app: the feed is already prepared, so reading it is one fast cache lookup.', active: ['v', 'fc'], flow: [['v', 'fc']], badges: { fc: 'HIT' } },
      { caption: 'Photos load from the nearest **CDN** edge, not from the application servers.', active: ['v', 'cdn'], flow: [['v', 'cdn']] },
      { caption: '**Celebrity problem:** an account with 50 million followers would flood 50 million caches. For such accounts, skip the push and merge their posts into the feed **at read time** (a hybrid).', active: ['w'], badges: { w: 'HYBRID' } },
    ],
  },
  tabs: ['Fan-out on read', 'Fan-out on write'],
  realWorld: [
    { name: 'Twitter / X and Instagram', text: 'Have described hybrid designs: precompute feeds for ordinary accounts, and merge posts of very popular accounts at read time.' },
    { name: 'Object storage and CDN', text: 'Photos live in blob storage (like S3) and are served through a CDN in several sizes for different screens.' },
    { name: 'Sharding and replication', text: 'User and post tables are sharded by user id and replicated for availability (see those lessons).' },
    { name: 'Ranking', text: 'Modern feeds are ranked by relevance, not only time; a ranking service scores a candidate list.' },
  ],
  tradeoffs: {
    gain: ['Fan-out on write: very fast reads, which are the common operation.', 'Fan-out on read: cheap writes and always fresh.', 'Hybrid: best of both for typical and celebrity accounts.'],
    cost: ['Fan-out on write: heavy work and storage per post; delay before followers see it.', 'Fan-out on read: slow feeds for users who follow many accounts.', 'More moving parts: queues, workers, caches.'],
    useWhen: ['Reads far outnumber writes (almost always for a feed).'],
    avoidWhen: ['Do not push to millions of caches for one celebrity post.'],
  },
  steps: [
    {
      title: 'Collect all posts, sort, take the newest',
      tag: 'slow',
      idea: 'Fan-out on read, the simple way: keep only posts by accounts the viewer follows, sort them all by time (newest first) and return the first `limit` ids. Correct, but it sorts every post even if we need only ten.',
      walk: ['Filter posts whose author is in `follows`.', 'Sort by time, newest first.', 'Return the ids of the first `limit` posts.'],
      code: {
        python: `def build_feed(follows, posts, limit):
    mine = [p for p in posts if p[1] in follows]
    mine.sort(key=lambda p: -p[2])
    return [p[0] for p in mine[:limit]]
`,
        javascript: `function buildFeed(follows, posts, limit) {
  const mine = posts.filter((p) => follows.includes(p[1]));
  mine.sort((a, b) => b[2] - a[2]);
  return mine.slice(0, limit).map((p) => p[0]);
}
`,
      },
      time: 'O(P log P) for P posts',
      space: 'O(P)',
      verdict: 'Fine for small data. With millions of posts we should not sort everything just to show ten.',
    },
    {
      title: 'Merge per-author lists and stop early',
      tag: 'best',
      idea: 'Group posts per followed author (each list already newest first). Then repeatedly take the newest among the **heads** of those lists until `limit` items are collected. This is a **k-way merge** that does only `limit` rounds of work, the same idea a real feed service uses when it merges a precomputed feed with a celebrity\'s recent posts.',
      walk: ['Build a list of posts per followed author, sorted newest first.', 'Keep a pointer at the head of each list.', 'Repeat up to `limit` times: pick the head with the largest time, add its id, move that pointer.', 'Stop early when all lists are used up.'],
      code: {
        python: `def build_feed(follows, posts, limit):
    lists = []
    for author in follows:
        mine = [p for p in posts if p[1] == author]
        mine.sort(key=lambda p: -p[2])
        lists.append(mine)
    pointers = [0] * len(lists)
    feed = []
    while len(feed) < limit:
        best = -1
        for i, items in enumerate(lists):
            if pointers[i] < len(items):
                if best == -1 or items[pointers[i]][2] > lists[best][pointers[best]][2]:
                    best = i
        if best == -1:
            break
        feed.append(lists[best][pointers[best]][0])
        pointers[best] += 1
    return feed
`,
        javascript: `function buildFeed(follows, posts, limit) {
  const lists = follows.map((author) =>
    posts.filter((p) => p[1] === author).sort((a, b) => b[2] - a[2])
  );
  const pointers = lists.map(() => 0);
  const feed = [];
  while (feed.length < limit) {
    let best = -1;
    for (let i = 0; i < lists.length; i++) {
      if (pointers[i] < lists[i].length) {
        if (best === -1 || lists[i][pointers[i]][2] > lists[best][pointers[best]][2]) best = i;
      }
    }
    if (best === -1) break;
    feed.push(lists[best][pointers[best]][0]);
    pointers[best] += 1;
  }
  return feed;
}
`,
      },
      time: 'O(P + limit x k) for k followed accounts',
      space: 'O(P)',
      verdict: 'With per-author lists stored sorted (as a database index would) and a heap for the heads, each feed costs O(limit log k).',
    },
  ],
  practice: {
    fn: { python: 'build_feed', javascript: 'buildFeed' },
    starter: {
      python: `def build_feed(follows, posts, limit):
    # follows: names the viewer follows. posts: [post_id, author, time].
    # Return the ids of the newest posts by followed authors, newest first,
    # at most limit of them.
    pass
`,
      javascript: `function buildFeed(follows, posts, limit) {
  // follows: names the viewer follows. posts: [postId, author, time].
  // Return the ids of the newest posts by followed authors, newest first,
  // at most limit of them.
}
`,
    },
    cases: [
      { label: 'newest posts from followed accounts', args: [['asha', 'ravi'], POSTS, 3], expected: [1, 2, 3] },
      { label: 'posts by accounts you do not follow are hidden', args: [['meera'], POSTS, 5], expected: [4] },
      { label: 'the limit cuts the feed', args: [['asha', 'ravi', 'meera'], POSTS, 4], expected: [1, 2, 3, 4] },
      { label: 'fewer posts than the limit', args: [['zed'], POSTS, 10], expected: [7] },
      { label: 'following nobody gives an empty feed', args: [[], POSTS, 5], expected: [] },
      { label: 'all followed posts, newest first', args: [['asha', 'ravi'], POSTS, 10], expected: [1, 2, 3, 5, 6] },
      { label: 'a limit of zero', args: [['asha'], POSTS, 0], expected: [] },
    ],
    hints: ['Only posts whose author is in `follows` belong in the feed.', 'Newest first means the largest time first.', 'You can sort everything, or merge per-author lists and stop after `limit` items.'],
  },
  quiz: [
    { q: 'Why do many feed systems precompute feeds (fan-out on write)?', options: ['Feeds are read far more often than posts are written, so make reads cheap', 'Writes are free', 'To avoid using caches'], answer: 0, why: 'Optimise for the common operation: reading the feed.' },
    { q: 'What is the problem with fan-out on write for an account with 50 million followers?', options: ['One post must be copied to 50 million feeds, causing huge write load and delay', 'Nothing', 'The photo is too small'], answer: 0, why: 'This is the celebrity (hot key) problem. Handle such accounts at read time.' },
    { q: 'Where should photos be served from?', options: ['The application server database', 'Object storage behind a CDN', 'The user\'s phone'], answer: 1, why: 'Large static files belong in blob storage with CDN delivery near users.' },
  ],
  interview: [
    { q: 'Walk through designing an Instagram feed.', a: 'Clarify requirements (post photos, follow, feed, scale, latency). **Upload path**: app server, blob storage, CDN, post metadata in a sharded DB, event to a queue. **Feed**: fan-out on write into per-user feed caches via workers, with read-time merging for celebrity accounts. **Read path**: feed cache returns post ids, hydrate with metadata, photos load via CDN. Add pagination (cursor), ranking, replication and monitoring.' },
    { q: 'How do you paginate a feed?', a: 'Use a **cursor** (the id or time of the last item seen), not page numbers: new posts keep arriving, so offsets would repeat or skip items. Request "20 items older than cursor X".' },
    { q: 'How would you store followers and posts?', a: 'A follow table of `(follower, followee)` indexed both ways, sharded by user id. Posts in a store partitioned by author and sorted by time, which makes "latest posts of author X" a single-shard range read. Counters (likes) are buffered in a cache and flushed in batches.' },
  ],
  mistakes: ['Computing every feed from scratch on each open.', 'Pushing celebrity posts to every follower.', 'Using offset pagination on a constantly changing list.', 'Serving images from application servers instead of a CDN.'],
  recap: 'A feed system optimises reads with precomputed feeds, a hybrid for celebrities, a CDN for photos and queues to do the fan-out work.',
}
