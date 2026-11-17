import type { SdLesson } from '../types'

export const messageQueue: SdLesson = {
  id: 'message-queue',
  title: 'Message queue',
  topic: 'Decoupling and smoothing load',
  blurb: 'Put work in a queue so slow jobs happen in the background, spikes are absorbed, and a crashed worker loses nothing.',
  why: {
    story: 'A user places an order. Your server must charge the card, send an email, update stock and notify the warehouse. Doing it all **while the user waits** makes the page slow, and if the email service is down the whole order fails. A message queue lets the server write down "order 42 needs processing" and reply right away. **Workers** pick the jobs up in the background, at their own pace.',
    pains: ['Slow work (emails, images, reports) makes users wait.', 'A traffic spike overwhelms services that cannot keep up in real time.', 'If one service is down, everything that calls it fails.', 'The caller and the worker must both be up at the same moment.'],
  },
  before: {
    title: 'Without a queue: everything happens while the user waits',
    nodes: [
      { id: 'u', label: 'User', kind: 'user', x: 10, y: 28 },
      { id: 'app', label: 'App', kind: 'server', x: 36, y: 28 },
      { id: 'pay', label: 'Payment', kind: 'service', x: 70, y: 10 },
      { id: 'mail', label: 'Email', kind: 'service', x: 70, y: 28 },
      { id: 'wh', label: 'Warehouse', kind: 'service', x: 70, y: 46 },
    ],
    edges: [{ from: 'u', to: 'app' }, { from: 'app', to: 'pay' }, { from: 'app', to: 'mail' }, { from: 'app', to: 'wh' }],
    frames: [
      { caption: 'The user places an order. The app calls the payment, email and warehouse services **one after another**.', active: ['u', 'app'], flow: [['u', 'app'], ['app', 'pay']] },
      { caption: 'The email service is slow. The user stares at a spinner.', active: ['app', 'mail'], flow: [['app', 'mail']], bad: ['mail'], badges: { mail: 'SLOW' } },
      { caption: 'The email service is down, so **the whole order fails**, even though payment succeeded.', bad: ['mail', 'app'], badges: { mail: 'DOWN', app: 'ERROR' } },
    ],
  },
  how: {
    title: 'With a queue: reply fast, work in the background',
    nodes: [
      { id: 'u', label: 'User', kind: 'user', x: 8, y: 28 },
      { id: 'app', label: 'Producer', kind: 'server', x: 30, y: 28, sub: 'app server' },
      { id: 'q', label: 'Queue', kind: 'queue', x: 56, y: 28, sub: 'durable' },
      { id: 'w1', label: 'Worker 1', kind: 'worker', x: 84, y: 12 },
      { id: 'w2', label: 'Worker 2', kind: 'worker', x: 84, y: 44 },
    ],
    edges: [{ from: 'u', to: 'app' }, { from: 'app', to: 'q' }, { from: 'q', to: 'w1' }, { from: 'q', to: 'w2' }],
    frames: [
      { caption: 'The user places an order. The app **writes a message** ("process order 42") to the queue.', active: ['u', 'app', 'q'], flow: [['u', 'app'], ['app', 'q']] },
      { caption: 'The app replies at once: "order received". The user is not kept waiting.', active: ['u', 'app'], flow: [['app', 'u']] },
      { caption: 'A worker takes the message and starts the slow work in the background.', active: ['q', 'w1'], flow: [['q', 'w1']] },
      { caption: 'The worker crashes before finishing. It never **acknowledged** the message, so the queue still has it.', active: ['q'], bad: ['w1'], badges: { w1: 'CRASH' } },
      { caption: 'After a timeout the queue hands the same message to another worker. **Nothing is lost** (at-least-once delivery).', active: ['q', 'w2'], flow: [['q', 'w2']], badges: { w2: 'RETRY' } },
      { caption: 'Worker 2 finishes and acknowledges the message. The queue removes it.', active: ['w2', 'q'], badges: { q: 'ACK' } },
    ],
  },
  realWorld: [
    { name: 'Amazon SQS', text: 'A managed queue. Its **visibility timeout** works exactly like the one you build below: a received message is hidden for a while and reappears if you do not delete (acknowledge) it.' },
    { name: 'RabbitMQ', text: 'A popular open-source broker. Workers acknowledge messages; unacknowledged ones go back to the queue when a worker disconnects.' },
    { name: 'Apache Kafka', text: 'A distributed log used for high-volume event streams. Consumers track their position and can replay old events.' },
    { name: 'Everyday examples', text: 'Sending emails and SMS, resizing uploaded images, generating reports, processing payments or video transcoding are commonly done through queues.' },
  ],
  tradeoffs: {
    gain: ['Fast responses: slow work moves out of the request.', 'Spikes are absorbed: the queue grows, workers drain it steadily.', 'Services are **decoupled**: producers and workers can be deployed and fail independently.', 'Easy to scale workers up or down.'],
    cost: ['Work is **eventually** done, not instantly.', 'Messages may be delivered **more than once**, so workers must be idempotent.', 'One more system to run, monitor and keep ordered if order matters.'],
    useWhen: ['The work does not need to finish before you reply.', 'Traffic is bursty.', 'A downstream service is slow or unreliable.'],
    avoidWhen: ['The user needs the result right now (a search query).', 'A simple function call is enough and nothing can overload.'],
  },
  steps: [
    {
      title: 'A plain first-in, first-out list',
      tag: 'slow',
      idea: 'The simplest queue: `publish` adds to the end of a list and `consume` removes from the front. It keeps order, but there is a dangerous gap: the moment a worker takes a message it is **gone**. If the worker crashes, the job is lost.',
      walk: ['`publish(message)` appends to the list.', '`consume(now)` removes and returns the first message, or None when empty.', '`ack` does nothing: removal already happened.'],
      only: [0, 5],
      code: {
        python: `class MessageQueue:
    def __init__(self, visibility_timeout):
        self.ready = []

    def publish(self, message):
        self.ready.append(message)

    def consume(self, now):
        if not self.ready:
            return None
        return self.ready.pop(0)

    def ack(self, message):
        pass
`,
        javascript: `class MessageQueue {
  constructor(visibilityTimeout) {
    this.ready = [];
  }

  publish(message) {
    this.ready.push(message);
  }

  consume(now) {
    if (this.ready.length === 0) return null;
    return this.ready.shift();
  }

  ack(message) {}
}
`,
      },
      time: 'O(1) (O(n) for shift)',
      space: 'O(messages)',
      verdict: 'Fine for a toy, but a crash between `consume` and finishing the work loses the message.',
    },
    {
      title: 'Acknowledge, and redeliver after a timeout',
      tag: 'best',
      idea: 'When a message is consumed, do not delete it: mark it **in flight** with a deadline (`now + visibility_timeout`). The worker deletes it by calling `ack` when the work is done. If the deadline passes without an `ack`, the message becomes available again for another worker. This gives **at-least-once delivery**.',
      walk: ['Keep all messages in publish order, each with a deadline (None while waiting).', '`consume(now)`: return the first message that is waiting, or whose deadline has passed, and set its new deadline.', '`ack(message)`: remove the message for good.', 'A message consumed but never acknowledged reappears after the timeout.'],
      code: {
        python: `class MessageQueue:
    def __init__(self, visibility_timeout):
        self.timeout = visibility_timeout
        self.messages = []  # [message, deadline] in publish order; deadline is None while waiting

    def publish(self, message):
        self.messages.append([message, None])

    def consume(self, now):
        for entry in self.messages:
            if entry[1] is None or entry[1] <= now:
                entry[1] = now + self.timeout
                return entry[0]
        return None

    def ack(self, message):
        self.messages = [e for e in self.messages if e[0] != message]
`,
        javascript: `class MessageQueue {
  constructor(visibilityTimeout) {
    this.timeout = visibilityTimeout;
    this.messages = []; // { message, deadline } in publish order; deadline is null while waiting
  }

  publish(message) {
    this.messages.push({ message, deadline: null });
  }

  consume(now) {
    for (const entry of this.messages) {
      if (entry.deadline === null || entry.deadline <= now) {
        entry.deadline = now + this.timeout;
        return entry.message;
      }
    }
    return null;
  }

  ack(message) {
    this.messages = this.messages.filter((e) => e.message !== message);
  }
}
`,
      },
      time: 'O(n) per consume here (real brokers use indexes)',
      space: 'O(messages)',
      verdict: 'Because a message can be delivered twice (a slow worker that finishes after the timeout), workers must be **idempotent**: processing the same message again must be harmless.',
    },
  ],
  sim: {
    id: 'queue',
    intro: 'Messages arrive every second and consumers each handle 2 per second. Watch the queue length (the bars): if arrivals are faster than processing, the backlog grows.',
    tryThis: ['With 6 arrivals per second and 2 consumers (4 per second), press "10 seconds": the queue keeps growing.', 'Add consumers until the drain speed is above the arrival rate and watch the backlog shrink back to 0.', 'Raise the arrival rate for a few seconds, then lower it again: the queue absorbed the spike and the consumers caught up.'],
  },
  practice: {
    fn: { python: 'simulate_queue', javascript: 'simulateQueue' },
    symbol: { python: 'class MessageQueue', javascript: 'class MessageQueue' },
    driver: {
      python: `def simulate_queue(timeout, ops):
    queue = MessageQueue(timeout)
    out = []
    for op in ops:
        if op[0] == "publish":
            queue.publish(op[1])
            out.append(None)
        elif op[0] == "consume":
            out.append(queue.consume(op[1]))
        else:
            queue.ack(op[1])
            out.append(None)
    return out
`,
      javascript: `function simulateQueue(timeout, ops) {
  const queue = new MessageQueue(timeout);
  const out = [];
  for (const op of ops) {
    if (op[0] === "publish") {
      queue.publish(op[1]);
      out.push(null);
    } else if (op[0] === "consume") {
      const message = queue.consume(op[1]);
      out.push(message === undefined ? null : message);
    } else {
      queue.ack(op[1]);
      out.push(null);
    }
  }
  return out;
}
`,
    },
    starter: {
      python: `class MessageQueue:
    def __init__(self, visibility_timeout):
        self.timeout = visibility_timeout

    def publish(self, message):
        pass

    def consume(self, now):
        # return the next available message, or None
        pass

    def ack(self, message):
        # the worker finished: remove the message for good
        pass
`,
      javascript: `class MessageQueue {
  constructor(visibilityTimeout) {
    this.timeout = visibilityTimeout;
  }

  publish(message) {}

  consume(now) {
    // return the next available message, or null
  }

  ack(message) {}
}
`,
    },
    cases: [
      { label: 'messages come out in order', args: [5, [['publish', 'a'], ['publish', 'b'], ['consume', 0], ['consume', 0], ['consume', 0]]], expected: [null, null, 'a', 'b', null] },
      { label: 'an acknowledged message is gone for good', args: [5, [['publish', 'a'], ['consume', 0], ['ack', 'a'], ['consume', 100]]], expected: [null, 'a', null, null] },
      { label: 'an unacknowledged message comes back after the timeout', args: [5, [['publish', 'a'], ['consume', 0], ['consume', 3], ['consume', 5]]], expected: [null, 'a', null, 'a'] },
      { label: 'only the acknowledged message stays away', args: [5, [['publish', 'a'], ['publish', 'b'], ['consume', 0], ['ack', 'a'], ['consume', 1], ['consume', 10]]], expected: [null, null, 'a', null, 'b', 'b'] },
      { label: 'redelivered messages keep their original order', args: [5, [['publish', 'a'], ['publish', 'b'], ['consume', 0], ['consume', 1], ['consume', 6], ['consume', 6]]], expected: [null, null, 'a', 'b', 'a', 'b'] },
      { label: 'consuming from an empty queue', args: [5, [['consume', 0]]], expected: [null] },
    ],
    hints: ['A consumed message should not be deleted yet: remember a **deadline** (`now + timeout`) for it.', 'A message is available when it was never consumed, or its deadline is at or before `now`.', '`ack` removes the message completely. Keep messages in publish order so redelivery keeps the order.'],
  },
  quiz: [
    { q: 'A worker takes a message, then crashes. What should happen to the message?', options: ['It is lost, because the worker took it', 'It becomes available again after a timeout, so another worker can process it', 'It is moved to the front of the line forever'], answer: 1, why: 'Because the worker never acknowledged it, the queue puts it back after the visibility timeout. This is how queues avoid losing work.' },
    { q: 'With at-least-once delivery, a message may be processed twice. What must your worker be?', options: ['Faster', 'Idempotent: running it twice has the same effect as once', 'Single-threaded'], answer: 1, why: 'For example, "send email for order 42" should check whether it was already sent. Idempotency keys or "already processed" checks make duplicates harmless.' },
    { q: 'Messages arrive at 100 per second but workers handle 60 per second in total. What happens?', options: ['Nothing, queues are unlimited and free', 'The backlog grows by 40 per second until you add workers or slow the producers', 'The queue becomes faster'], answer: 1, why: 'A queue absorbs short spikes, but if the average arrival rate exceeds the processing rate the queue grows without end. Scale the consumers or apply backpressure.' },
  ],
  interview: [
    { q: 'When would you introduce a message queue into a design?', a: 'When work can be done **asynchronously** (emails, notifications, image processing), when traffic is spiky and you want to smooth it, or when you want to decouple services so one being down does not break the other. Do not use it when the user needs the result immediately.' },
    { q: 'What delivery guarantees can a queue offer?', a: '**At-most-once** (never redelivered, but can lose messages), **at-least-once** (never lost, but can be duplicated: the common choice) and **exactly-once** (hard and usually achieved as at-least-once plus idempotent processing or transactional support).' },
    { q: 'What is a dead-letter queue?', a: 'A separate queue for messages that keep failing. After a set number of retries a message is moved there instead of blocking or looping forever, so you can inspect it, fix the bug and replay it.' },
  ],
  mistakes: ['Assuming a message is processed exactly once and not making workers idempotent.', 'Setting the visibility timeout shorter than the real processing time, causing duplicates.', 'No dead-letter queue, so one bad message is retried forever.', 'Never monitoring queue length, so a growing backlog goes unnoticed.'],
  recap: 'A queue lets you reply now and do the work later: acknowledge messages, redeliver unacknowledged ones, and make workers safe to run twice.',
}
