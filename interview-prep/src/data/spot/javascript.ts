import type { SpotSet } from './types'

export const javascript: SpotSet = {
  id: 'javascript',
  bugs: [
    {
      id: 'sort-numbers',
      title: 'Top scores in the wrong order',
      task: '`topScores([5, 100, 20])` should return `[100, 20, 5]` but returns `[5, 20, 100]`.',
      lang: 'javascript',
      code: `function topScores(scores) {
  return [...scores].sort().reverse()
}

console.log(topScores([5, 100, 20]))`,
      line: 2,
      fix: '  return [...scores].sort((a, b) => b - a)',
      explain: 'Without a compare function `sort` compares ==strings==, so "100" < "20" < "5". Pass a numeric comparator.',
      difficulty: 'Easy',
    },
    {
      id: 'var-closure',
      title: 'Every button says 3',
      task: 'Each button should log its own index (0, 1, 2), but every click logs 3.',
      lang: 'javascript',
      code: `const buttons = document.querySelectorAll('button')
for (var i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener('click', () => {
    console.log('clicked', i)
  })
}`,
      line: 2,
      fix: 'for (let i = 0; i < buttons.length; i++) {',
      explain: '`var` is function-scoped: all handlers close over the same `i`, which is 3 when they run. ==`let`== creates a fresh binding per iteration.',
      difficulty: 'Medium',
    },
    {
      id: 'foreach-async',
      title: 'Saved before saving',
      task: '"All saved" should print after every user is saved, but it prints first.',
      lang: 'javascript',
      code: `async function saveAll(users) {
  users.forEach(async (u) => {
    await db.save(u)
  })
  console.log('All saved')
}`,
      line: 2,
      fixed: `async function saveAll(users) {
  await Promise.all(users.map(async (u) => {
    await db.save(u)
  }))
  console.log('All saved')
}`,
      explain: '`forEach` ignores the promises its callback returns, so nothing waits. Map to promises and ==`await Promise.all`== (or use `for…of` with `await` to save one at a time).',
      difficulty: 'Medium',
    },
    {
      id: 'this-callback',
      title: 'Lost `this`',
      task: 'The timer should count up, but it throws `Cannot read properties of undefined (reading \'seconds\')`.',
      lang: 'javascript',
      code: `class Timer {
  seconds = 0
  start() {
    setInterval(function () {
      this.seconds++
    }, 1000)
  }
}
new Timer().start()`,
      line: 4,
      fix: '    setInterval(() => {',
      explain: 'A regular `function` gets its own `this` (undefined in class code). An ==arrow function== uses the `this` of `start()`, which is the timer.',
      difficulty: 'Medium',
    },
    {
      id: 'or-default',
      title: 'Volume zero is ignored',
      task: '`setVolume({ volume: 0 })` should mute, but it plays at 50.',
      lang: 'javascript',
      code: `function setVolume(options) {
  const volume = options.volume || 50
  player.volume = volume
}`,
      line: 2,
      fix: '  const volume = options.volume ?? 50',
      explain: '`||` replaces every falsy value, including 0. ==`??`== only replaces `null` and `undefined`.',
      difficulty: 'Easy',
    },
    {
      id: 'shallow-copy',
      title: 'The draft changes the original',
      task: 'Editing the draft\'s address should not touch the saved user, but it does.',
      lang: 'javascript',
      code: `const saved = { name: 'Ada', address: { city: 'London' } }
const draft = { ...saved }
draft.address.city = 'Paris'
console.log(saved.address.city) // 'Paris'?!`,
      line: 2,
      fix: 'const draft = structuredClone(saved)',
      explain: 'Spread copies one level deep; `draft.address` is the ==same object== as `saved.address`. `structuredClone` makes a deep copy.',
      difficulty: 'Medium',
    },
  ],
}
