import type { TaskPath } from './types'

export const css: TaskPath = {
  id: 'css',
  title: 'CSS',
  blurb: 'Style real components: boxes, Flexbox, Grid, responsive layouts and smooth hovers.',
  tasks: [
    {
      id: 'style-card',
      kind: 'rules',
      language: 'css',
      title: 'Style a card with the box model',
      goal: 'Turn a plain `.card` into a neat, spaced box using padding, border and margin.',
      steps: [
        'Set `box-sizing: border-box` so width includes padding and border.',
        'Give the card `padding`, a `border` and rounded corners with `border-radius`.',
        'Add outside space with `margin` and a soft `box-shadow`.',
      ],
      starter: `.card {
  width: 300px;
  /* TODO: make it look like a card */
}`,
      hints: ['`box-sizing: border-box;` stops the box from growing when you add padding.', 'Try `padding: 16px;` and `border: 1px solid #ddd;`.', '`box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);` gives a soft lift.'],
      solution: `.card {
  width: 300px;
  box-sizing: border-box;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 12px;
  margin: 24px auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}`,
      rules: [
        { label: 'Uses `box-sizing: border-box`', match: /box-sizing:\s*border-box/i, hint: 'Add box-sizing: border-box;' },
        { label: 'Has `padding`', match: /\bpadding:\s*[^;]*\d/i, hint: 'Add padding: 16px;' },
        { label: 'Has a `border`', match: /\bborder:\s*[^;]*\d/i, hint: 'Add border: 1px solid #ddd;' },
        { label: 'Has rounded corners (`border-radius`)', match: /border-radius:\s*[^;]*\d/i, hint: 'Add border-radius: 12px;' },
        { label: 'Has a `margin`', match: /\bmargin:\s*[^;]*\d/i, hint: 'Add margin: 24px auto;' },
        { label: 'Has a `box-shadow`', match: /box-shadow:\s*[^;]*\d/i, hint: 'Add a soft box-shadow.' },
      ],
      learned: 'Every element is a box: content, then padding, border and margin. `border-box` makes sizing predictable.',
    },
    {
      id: 'flex-navbar',
      kind: 'rules',
      language: 'css',
      title: 'Lay out a navbar with Flexbox',
      goal: 'Put the logo on the left and the links on the right, all vertically centred.',
      steps: [
        'Make `.navbar` a flex container with `display: flex`.',
        'Push the logo and links apart with `justify-content: space-between`.',
        'Centre them vertically with `align-items: center`, and space the links with `gap`.',
      ],
      starter: `.navbar {
  padding: 12px 24px;
}

.links {
  list-style: none;
}`,
      hints: ['Flexbox starts with `display: flex;` on the parent.', 'Main axis (row) spacing is `justify-content`; cross axis is `align-items`.', 'The links list also needs `display: flex; gap: 16px;` to sit in a row.'],
      solution: `.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
}

.links {
  display: flex;
  gap: 16px;
  list-style: none;
}`,
      rules: [
        { label: '`.navbar` is a flex container', match: /\.navbar\s*\{[^}]*display:\s*flex/i, hint: 'Add display: flex; to .navbar.' },
        { label: 'Logo and links are pushed apart (`space-between`)', match: /justify-content:\s*space-between/i, hint: 'Add justify-content: space-between;' },
        { label: 'Items are vertically centred', match: /align-items:\s*center/i, hint: 'Add align-items: center;' },
        { label: '`.links` is also flex, with a `gap`', match: /\.links\s*\{[^}]*display:\s*flex[^}]*gap:|\.links\s*\{[^}]*gap:[^}]*display:\s*flex/i, hint: 'Give .links display: flex and gap: 16px.' },
      ],
      learned: 'Flexbox lays items out in one direction: `justify-content` works along it, `align-items` across it, and `gap` adds space between.',
    },
    {
      id: 'grid-gallery',
      kind: 'rules',
      language: 'css',
      title: 'Build a photo gallery with Grid',
      goal: 'Arrange gallery photos in three equal columns with even spacing.',
      steps: [
        'Make `.gallery` a grid with `display: grid`.',
        'Create three equal columns with `grid-template-columns: repeat(3, 1fr)`.',
        'Add `gap` and make images fill their cell with `width: 100%`.',
      ],
      starter: `.gallery {
  max-width: 900px;
  margin: 0 auto;
}

.gallery img {
  border-radius: 8px;
}`,
      hints: ['Grid is also turned on with `display: grid;`.', '`repeat(3, 1fr)` means three columns of equal fractions.', 'Put `width: 100%; display: block;` on the images.'],
      solution: `.gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  max-width: 900px;
  margin: 0 auto;
}

.gallery img {
  width: 100%;
  display: block;
  border-radius: 8px;
}`,
      rules: [
        { label: '`.gallery` is a grid', match: /\.gallery\s*\{[^}]*display:\s*grid/i, hint: 'Add display: grid; to .gallery.' },
        { label: 'Has 3 equal columns', match: /grid-template-columns:\s*(repeat\(\s*3\s*,\s*1fr\s*\)|1fr\s+1fr\s+1fr)/i, hint: 'Use grid-template-columns: repeat(3, 1fr);' },
        { label: 'Has a `gap` between photos', match: /\bgap:\s*[^;]*\d/i, hint: 'Add gap: 16px;' },
        { label: 'Images fill their cell (`width: 100%`)', match: /\.gallery\s+img\s*\{[^}]*width:\s*100%/i, hint: 'Add width: 100% to .gallery img.' },
      ],
      learned: 'Grid is for two-dimensional layouts. `fr` units share the free space, so columns stay equal at any width.',
    },
    {
      id: 'responsive-layout',
      kind: 'rules',
      language: 'css',
      title: 'Make a layout responsive',
      goal: 'A three-column layout that collapses to one column on phones.',
      steps: [
        'Use a flexible container: `width` as a percentage with a `max-width`.',
        'Use `rem` for font sizes instead of fixed pixels.',
        'Add `@media (max-width: 600px)` that switches the grid to a single column.',
      ],
      starter: `.layout {
  width: 960px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

h1 {
  font-size: 32px;
}`,
      hints: ['A fixed 960px width cannot shrink: use `width: 100%; max-width: 960px;`.', '2rem is 32px when the base size is 16px, and it scales with user settings.', 'Inside the media query: `.layout { grid-template-columns: 1fr; }`.'],
      solution: `.layout {
  width: 100%;
  max-width: 960px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

h1 {
  font-size: 2rem;
}

@media (max-width: 600px) {
  .layout {
    grid-template-columns: 1fr;
  }
}`,
      rules: [
        { label: 'Width is flexible (`max-width`, not a fixed width)', match: /max-width:\s*960px/i, hint: 'Use width: 100%; max-width: 960px;' },
        { label: 'No fixed `width: 960px` is left', match: /(^|[\s{;])width:\s*960px/i, absent: true, hint: 'Remove the fixed width.' },
        { label: 'Font size uses `rem`', match: /font-size:\s*[\d.]+rem/i, hint: 'Write font-size: 2rem;' },
        { label: 'Has a mobile media query', match: /@media\s*\(\s*max-width:\s*\d+px\s*\)/i, hint: 'Add @media (max-width: 600px) { … }' },
        { label: 'The layout becomes one column on phones', match: /@media[^{]*\{[^}]*\{[^}]*grid-template-columns:\s*1fr\s*;/i, hint: 'Inside the media query set grid-template-columns: 1fr;' },
      ],
      learned: 'Responsive design = flexible widths, relative units and media queries that change the layout at small sizes.',
    },
    {
      id: 'variables-hover',
      kind: 'rules',
      language: 'css',
      title: 'Theme a button with variables and hover',
      goal: 'Define brand colours once, use them everywhere, and add a smooth hover effect.',
      steps: [
        'Declare `--brand` and `--brand-dark` on `:root`.',
        'Style `.btn` with `background: var(--brand)` and white text.',
        'On `.btn:hover` switch to the dark colour, and add a `transition` so it animates.',
      ],
      starter: `.btn {
  padding: 10px 20px;
  border: 0;
  border-radius: 8px;
  color: white;
}`,
      hints: ['Variables start with two dashes: `--brand: #4f46e5;` inside `:root { … }`.', 'Use a variable with `var(--brand)`.', '`transition: background 0.2s ease;` goes on `.btn` (not on `:hover`).'],
      solution: `:root {
  --brand: #4f46e5;
  --brand-dark: #3730a3;
}

.btn {
  padding: 10px 20px;
  border: 0;
  border-radius: 8px;
  color: white;
  background: var(--brand);
  transition: background 0.2s ease;
}

.btn:hover {
  background: var(--brand-dark);
}`,
      rules: [
        { label: 'Declares `--brand` and `--brand-dark` on `:root`', match: /:root\s*\{[^}]*--brand:[^}]*--brand-dark:|:root\s*\{[^}]*--brand-dark:[^}]*--brand:/i, hint: 'Both variables go inside :root { … }.' },
        { label: '`.btn` uses `var(--brand)`', match: /\.btn\s*\{[^}]*var\(--brand\)/i, hint: 'background: var(--brand);' },
        { label: 'Has a `.btn:hover` rule using `var(--brand-dark)`', match: /\.btn:hover\s*\{[^}]*var\(--brand-dark\)/i, hint: 'Add .btn:hover { background: var(--brand-dark); }' },
        { label: 'Has a `transition` on `.btn`', match: /\.btn\s*\{[^}]*transition:/i, hint: 'Add transition: background 0.2s ease; to .btn.' },
      ],
      learned: 'CSS variables let you change a whole theme in one place, and `transition` makes state changes feel smooth.',
    },
  ],
}
