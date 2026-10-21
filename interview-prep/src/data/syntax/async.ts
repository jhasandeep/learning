import type { SyntaxSet } from './types'

export const async: SyntaxSet = {
  id: 'async',
  title: 'Promises & async',
  snippets: [
    {
      id: 'new-promise',
      title: 'Create a promise (sleep)',
      lang: 'javascript',
      code: `const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function fetchUser(id) {
  return new Promise((resolve, reject) => {
    if (!id) return reject(new Error('id is required'))
    setTimeout(() => resolve({ id, name: 'Asha' }), 100)
  })
}`,
      note: 'The **executor** gets `resolve` and `reject`. Asked as a warm-up, and as the base for `sleep`, timeouts and wrapping callback APIs.',
    },
    {
      id: 'async-await',
      title: 'async / await with try / catch',
      lang: 'javascript',
      code: `async function loadDashboard(userId) {
  try {
    const user = await fetchUser(userId)
    const [orders, invoices] = await Promise.all([
      getOrders(user.id),
      getInvoices(user.id),
    ])
    return { user, orders, invoices }
  } catch (err) {
    console.error('Failed to load', err)
    throw err
  } finally {
    setLoading(false)
  }
}`,
      note: '`await` the first call, then run independent calls **in parallel** with `Promise.all`. Interviewers watch for accidental sequential awaits.',
    },
    {
      id: 'promise-all-polyfill',
      title: 'Promise.all polyfill',
      lang: 'javascript',
      code: `function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = []
    let done = 0
    if (promises.length === 0) return resolve(results)
    promises.forEach((p, i) => {
      Promise.resolve(p).then((value) => {
        results[i] = value
        done += 1
        if (done === promises.length) resolve(results)
      }, reject)
    })
  })
}`,
      note: 'The most asked promise polyfill. Keep results **in input order** (store by index), wrap values with `Promise.resolve`, reject on the first failure.',
    },
    {
      id: 'promise-allsettled-polyfill',
      title: 'Promise.allSettled polyfill',
      lang: 'javascript',
      code: `function allSettled(promises) {
  return Promise.all(
    promises.map((p) =>
      Promise.resolve(p).then(
        (value) => ({ status: 'fulfilled', value }),
        (reason) => ({ status: 'rejected', reason }),
      ),
    ),
  )
}`,
      note: 'Turn every outcome into a fulfilled `{ status, value | reason }` object, then `Promise.all` can never reject.',
    },
    {
      id: 'promise-race-timeout',
      title: 'Timeout with Promise.race',
      lang: 'javascript',
      code: `function withTimeout(promise, ms) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Timed out')), ms)
  })
  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timer)
  })
}`,
      note: '`Promise.race` settles with whichever promise settles first. Clear the timer in `finally` so it does not keep the process alive.',
    },
    {
      id: 'retry-backoff',
      title: 'Retry with exponential backoff',
      lang: 'javascript',
      code: `async function retry(fn, retries = 3, delay = 200) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt >= retries) throw err
      await new Promise((r) => setTimeout(r, delay * 2 ** attempt))
    }
  }
}`,
      note: 'A favourite follow-up to fetching: retry a failing call, doubling the wait each time (200, 400, 800 ms). `return await` keeps the error inside the `try`.',
    },
    {
      id: 'promisify',
      title: 'promisify a callback API',
      lang: 'javascript',
      code: `function promisify(fn) {
  return (...args) =>
    new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
}

const readFileAsync = promisify(fs.readFile)`,
      note: 'Node callbacks are **error-first** `(err, result)`. Asked to check you understand both callbacks and promises.',
    },
    {
      id: 'concurrency-limit',
      title: 'Run tasks with a concurrency limit',
      lang: 'javascript',
      code: `async function mapLimit(items, limit, worker) {
  const results = new Array(items.length)
  let next = 0
  async function run() {
    while (next < items.length) {
      const i = next++
      results[i] = await worker(items[i], i)
    }
  }
  const runners = Array.from({ length: limit }, run)
  await Promise.all(runners)
  return results
}`,
      note: 'Process 100 URLs, at most 5 at a time: start `limit` runners that each pull the next index. A common senior-level async question.',
    },
    {
      id: 'event-loop-order',
      title: 'Event loop order puzzle',
      lang: 'javascript',
      code: `console.log('1 sync')
setTimeout(() => console.log('5 timeout'), 0)
Promise.resolve()
  .then(() => console.log('3 microtask'))
  .then(() => console.log('4 microtask 2'))
queueMicrotask(() => console.log('3b queueMicrotask'))
console.log('2 sync')`,
      note: 'Sync code first, then **all microtasks** (promise callbacks, `queueMicrotask`), then one macrotask (the timer). Write it, then predict the output.',
    },
  ],
}
