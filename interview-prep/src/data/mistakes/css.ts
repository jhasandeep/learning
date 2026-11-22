import type { MistakeSet } from './types'

const PAGE = `<header class="site-header"><a class="logo" href="/">Acme</a><nav class="menu"><a href="/a">A</a><a href="/b">B</a></nav></header>
<main class="hero"><div class="card"><h1 class="title">Hello</h1><p>Text</p><button class="btn">Go</button></div></main>`

export const css: MistakeSet = {
  id: 'css',
  title: 'CSS',
  kind: 'css',
  lang: 'css',
  items: [
    {
      id: 'property-typo',
      title: 'A misspelled property',
      difficulty: 'Easy',
      task: 'Make the `.title` text `#1e293b` and `2rem` big.',
      setup: PAGE,
      broken: `.title {
  colour: #1e293b;
  font-size: 2rem;
}
`,
      solution: `.title {
  color: #1e293b;
  font-size: 2rem;
}
`,
      tests: [
        ['colour is #1e293b', 'expect(css(".title", "color")?.toLowerCase()).toBe("#1e293b")'],
        ['font size is 2rem', 'expect(css(".title", "font-size")).toBe("2rem")'],
      ],
      explain: 'CSS uses the American spelling: the property is **`color`**. The browser silently ignores properties it does not know, so a typo gives no error: the text just stays the default colour.',
      hints: ['No error, just no effect. Check how each property is spelled.', '`color`, not `colour`.'],
    },
    {
      id: 'missing-semicolon',
      title: 'A missing semicolon',
      difficulty: 'Medium',
      task: 'Style `.card`: `padding: 1rem`, `border-radius: 12px` and `background: white`.',
      setup: PAGE,
      broken: `.card {
  padding: 1rem
  border-radius: 12px;
  background: white;
}
`,
      solution: `.card {
  padding: 1rem;
  border-radius: 12px;
  background: white;
}
`,
      tests: [
        ['padding is 1rem', 'expect(css(".card", "padding")).toBe("1rem")'],
        ['border radius is 12px', 'expect(css(".card", "border-radius")).toBe("12px")'],
        ['background is white', 'expect(css(".card", "background")).toBe("white")'],
      ],
      explain: 'Each declaration ends with **`;`**. Without it the browser reads `padding: 1rem border-radius: 12px` as one invalid value and throws away **both** lines. A missing semicolon often breaks the line after it, not the one you are looking at.',
      hints: ['One property in the rule is not working, and so is the one after it.', 'End `padding: 1rem` with a semicolon.'],
    },
    {
      id: 'class-selector',
      title: 'Class or id?',
      difficulty: 'Easy',
      task: 'The button has `class="btn"`. Give it a blue background `#2563eb` and white text.',
      setup: PAGE,
      broken: `#btn {
  background: #2563eb;
  color: white;
}
`,
      solution: `.btn {
  background: #2563eb;
  color: white;
}
`,
      tests: [
        ['.btn has the blue background', 'expect(css(".btn", "background")).toBe("#2563eb")'],
        ['.btn has white text', 'expect(css(".btn", "color")).toBe("white")'],
      ],
      explain: '`#name` selects an **id** and `.name` selects a **class**. The element has a class (`class="btn"`), so the selector must start with a dot. An id selector found nothing, so no styles applied.',
      hints: ['Look at the HTML: is `btn` a class or an id?', 'A class selector starts with `.`'],
    },
    {
      id: 'flex-value',
      title: 'Centre with Flexbox',
      difficulty: 'Medium',
      task: 'Make `.hero` a flex container that centres its children both ways (`display`, `justify-content`, `align-items`).',
      setup: PAGE,
      broken: `.hero {
  display: flexbox;
  justify-content: center;
  align-items: center;
}
`,
      solution: `.hero {
  display: flex;
  justify-content: center;
  align-items: center;
}
`,
      tests: [
        ['display is flex', 'expect(css(".hero", "display")).toBe("flex")'],
        ['centred horizontally', 'expect(css(".hero", "justify-content")).toBe("center")'],
        ['centred vertically', 'expect(css(".hero", "align-items")).toBe("center")'],
      ],
      explain: 'The value is **`flex`**, not `flexbox`. An invalid value makes the browser drop the whole declaration, so `justify-content` and `align-items` (which only work on a flex container) had no effect either.',
      hints: ['Is `flexbox` a valid value of `display`?', '`display: flex;`'],
    },
  ],
}
