import type { LearnTrack } from './types'

const PAGE = `<header class="site-header"><a class="logo" href="/">Acme</a><nav class="menu"><a href="/a">A</a><a href="/b">B</a></nav></header>
<main class="hero"><div class="card"><h1 class="title">Hello</h1><p>Text</p><button class="btn">Go</button></div></main>
<section class="grid"><div class="item">1</div><div class="item">2</div><div class="item">3</div></section>`

export const css: LearnTrack = {
  id: 'css',
  intro: 'Style real layouts: selectors, the box model, Flexbox, Grid, positioning, responsive design, custom properties and transitions.',
  kind: 'css',
  lang: 'css',
  steps: [
    {
      id: 'selectors',
      title: 'Selectors and colours',
      learn: `A rule is a **selector** plus declarations:

\`\`\`
.title { color: #1e293b; font-size: 2rem; }
\`\`\`

\`.name\` selects a class, \`#id\` an id, \`a\` every link and \`.menu a\` links inside \`.menu\` (a descendant). Prefer classes: ids are hard to override.`,
      task: 'Make `.title` 2rem with colour `#1e293b`, and make links inside `.menu` have no underline (`text-decoration: none`).',
      starter: `/* Write your rules here */
`,
      solution: `.title {
  color: #1e293b;
  font-size: 2rem;
}

.menu a {
  text-decoration: none;
}
`,
      tests: [
        ['.title is 2rem', 'expect(css(".title", "font-size")).toBe("2rem")'],
        ['.title colour is #1e293b', 'expect(css(".title", "color")?.toLowerCase()).toBe("#1e293b")'],
        ['menu links have no underline', 'expect(css(".menu a", "text-decoration")).toBe("none")'],
      ],
      hints: ['Two rules: one for `.title`, one for `.menu a`.', 'Each declaration ends with a semicolon: `font-size: 2rem;`.'],
      setup: PAGE,
    },
    {
      id: 'box-model',
      title: 'The box model',
      learn: `Every element is a box: **content**, then \`padding\`, \`border\`, \`margin\`.

By default \`width\` is the content only, so padding makes a box wider than you asked. \`box-sizing: border-box\` makes \`width\` include padding and border, which is what most people expect. Many sites set it for everything with \`*, *::before, *::after\`.`,
      task: 'Set `box-sizing: border-box` on `*, *::before, *::after`, and give `.card` a width of 320px, padding of 24px and a 1px solid #e2e8f0 border.',
      starter: `.card {

}
`,
      solution: `*, *::before, *::after {
  box-sizing: border-box;
}

.card {
  width: 320px;
  padding: 24px;
  border: 1px solid #e2e8f0;
}
`,
      tests: [
        ['everything uses border-box', 'expect(css("*", "box-sizing")).toBe("border-box"); expect(css("*::before", "box-sizing")).toBe("border-box")'],
        ['.card is 320px wide with 24px padding', 'expect(css(".card", "width")).toBe("320px"); expect(css(".card", "padding")).toBe("24px")'],
        ['.card has the border', 'expect(css(".card", "border")?.toLowerCase()).toBe("1px solid #e2e8f0")'],
      ],
      hints: ['The universal rule is `*, *::before, *::after { box-sizing: border-box; }`.', 'The border shorthand is width, style, colour: `1px solid #e2e8f0`.'],
      setup: PAGE,
    },
    {
      id: 'flexbox',
      title: 'Flexbox: a header bar',
      learn: `\`display: flex\` lays children out in a row. On the container:

- \`justify-content\` spaces them along the row (\`space-between\` pushes them to the ends)
- \`align-items\` aligns them across it (\`center\` for vertical centring)
- \`gap\` sets the space between items`,
      task: 'Make `.site-header` a flex row with the logo on the left and the menu on the right (`space-between`), vertically centred. Make `.menu` a flex row with a 16px gap.',
      starter: `.site-header {

}

.menu {

}
`,
      solution: `.site-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.menu {
  display: flex;
  gap: 16px;
}
`,
      tests: [
        ['.site-header is flex', 'expect(css(".site-header", "display")).toBe("flex")'],
        ['items pushed to the ends', 'expect(css(".site-header", "justify-content")).toBe("space-between")'],
        ['vertically centred', 'expect(css(".site-header", "align-items")).toBe("center")'],
        ['.menu is flex with a 16px gap', 'expect(css(".menu", "display")).toBe("flex"); expect(css(".menu", "gap")).toBe("16px")'],
      ],
      hints: ['`justify-content` works along the row; `align-items` across it.', 'The menu needs its own `display: flex` before `gap` does anything.'],
      setup: PAGE,
    },
    {
      id: 'centering',
      title: 'Centre anything',
      learn: `To centre a child both ways, make the parent a flex (or grid) container and centre on both axes:

\`\`\`
.parent { display: flex; justify-content: center; align-items: center; }
\`\`\`

The parent needs a height to centre within, such as \`min-height: 100vh\`.`,
      task: 'Centre `.card` in `.hero` horizontally and vertically, with `.hero` at least the full viewport height.',
      starter: `.hero {

}
`,
      solution: `.hero {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
`,
      tests: [
        ['.hero is a flex or grid container', 'expect(["flex", "grid"]).toContain(css(".hero", "display"))'],
        ['centred on both axes', 'const d = css(".hero", "display"); if (d === "grid") expect(css(".hero", "place-items")).toBe("center"); else { expect(css(".hero", "justify-content")).toBe("center"); expect(css(".hero", "align-items")).toBe("center") }'],
        ['at least the viewport height', 'expect(css(".hero", "min-height")).toBe("100vh")'],
      ],
      hints: ['`justify-content: center` + `align-items: center` on the parent.', 'Without `min-height: 100vh` the hero is only as tall as the card, so there is nothing to centre in.'],
      setup: PAGE,
    },
    {
      id: 'grid',
      title: 'CSS Grid',
      learn: `Grid lays items out in rows **and** columns. \`grid-template-columns\` defines the columns; \`fr\` is a share of the free space:

\`\`\`
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
\`\`\`

\`repeat(auto-fill, minmax(200px, 1fr))\` makes as many columns as fit: responsive with no media query.`,
      task: 'Make `.grid` a grid of responsive columns: `repeat(auto-fill, minmax(200px, 1fr))` with a 24px gap.',
      starter: `.grid {

}
`,
      solution: `.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
}
`,
      tests: [
        ['.grid is a grid', 'expect(css(".grid", "display")).toBe("grid")'],
        ['columns fill the space, at least 200px each', 'expect(css(".grid", "grid-template-columns")?.replace(/\\s/g, "")).toBe("repeat(auto-fill,minmax(200px,1fr))")'],
        ['24px gap', 'expect(css(".grid", "gap")).toBe("24px")'],
      ],
      hints: ['Start with `display: grid`.', 'The column value is `repeat(auto-fill, minmax(200px, 1fr))`.'],
      setup: PAGE,
    },
    {
      id: 'responsive',
      title: 'Mobile-first media queries',
      learn: `Mobile first: write the base styles for small screens, then add \`min-width\` media queries for bigger ones:

\`\`\`
.title { font-size: 1.5rem; }
@media (min-width: 768px) {
  .title { font-size: 3rem; }
}
\`\`\``,
      task: 'Make `.title` 1.5rem by default and 3rem from 768px wide (a `min-width` media query).',
      starter: `.title {
  font-size: 3rem;
}
`,
      solution: `.title {
  font-size: 1.5rem;
}

@media (min-width: 768px) {
  .title {
    font-size: 3rem;
  }
}
`,
      tests: [
        ['1.5rem on small screens', 'expect(css(".title", "font-size")).toBe("1.5rem")'],
        ['3rem from 768px', 'expect(css(".title", "font-size", "min-width: 768px")).toBe("3rem")'],
        ['uses min-width, not max-width', 'expect(stylesheet).not.toMatch(/max-width/)'],
      ],
      hints: ['The base rule (outside any media query) is the phone size.', 'Put a second `.title` rule inside `@media (min-width: 768px) { … }`.'],
      setup: PAGE,
    },
    {
      id: 'variables',
      title: 'Custom properties',
      learn: `CSS variables keep a design consistent. Define them on \`:root\`, use them with \`var()\`:

\`\`\`
:root { --brand: #0891b2; }
.btn { background: var(--brand); }
\`\`\`

Change the variable once and everything that uses it follows (dark mode is often just new values).`,
      task: 'Define `--brand: #0891b2` and `--radius: 8px` on `:root`, then use them for `.btn` background and border-radius.',
      starter: `.btn {
  background: #0891b2;
  border-radius: 8px;
}
`,
      solution: `:root {
  --brand: #0891b2;
  --radius: 8px;
}

.btn {
  background: var(--brand);
  border-radius: var(--radius);
}
`,
      tests: [
        ['defines --brand and --radius on :root', 'expect(css(":root", "--brand")?.toLowerCase()).toBe("#0891b2"); expect(css(":root", "--radius")).toBe("8px")'],
        ['.btn uses var(--brand)', 'expect(css(".btn", "background")?.replace(/\\s/g, "")).toBe("var(--brand)")'],
        ['.btn uses var(--radius)', 'expect(css(".btn", "border-radius")?.replace(/\\s/g, "")).toBe("var(--radius)")'],
      ],
      hints: ['Custom property names start with two dashes.', 'Read one with `var(--brand)`.'],
      setup: PAGE,
    },
    {
      id: 'positioning',
      title: 'Positioning a badge',
      learn: `\`position: absolute\` places an element relative to its nearest **positioned** ancestor (one whose \`position\` isn't \`static\`). So give the parent \`position: relative\`:

\`\`\`
.card { position: relative; }
.badge { position: absolute; top: 8px; right: 8px; }
\`\`\``,
      task: 'Pin `.btn` to the bottom-right corner of `.card`: 16px from the bottom and right. Make `.card` the containing block.',
      starter: `.btn {
  position: absolute;
}
`,
      solution: `.card {
  position: relative;
}

.btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
}
`,
      tests: [
        ['.card is the containing block', 'expect(css(".card", "position")).toBe("relative")'],
        ['.btn is absolutely positioned', 'expect(css(".btn", "position")).toBe("absolute")'],
        ['16px from the bottom and right', 'expect(css(".btn", "bottom")).toBe("16px"); expect(css(".btn", "right")).toBe("16px")'],
      ],
      hints: ['Without a positioned ancestor, the button would pin to the page corner.', '`.card { position: relative; }`, then `bottom` and `right` on `.btn`.'],
      setup: PAGE,
    },
  ],
}
