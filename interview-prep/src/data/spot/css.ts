import type { SpotSet } from './types'

export const css: SpotSet = {
  id: 'css',
  bugs: [
    {
      id: 'center-axis',
      title: 'Not quite centred',
      task: 'The card should sit in the exact centre of the full-height hero. It is centred horizontally but stuck at the top.',
      lang: 'css',
      code: `.hero {
  display: flex;
  min-height: 100vh;
  justify-content: center;
  align-content: center;
}`,
      line: 5,
      fix: '  align-items: center;',
      explain: '`align-content` only spaces ==multiple lines== of wrapped flex items. A single line is aligned on the cross axis with `align-items`.',
      difficulty: 'Medium',
    },
    {
      id: 'absolute-parent',
      title: 'The badge flies away',
      task: 'The "New" badge should sit in the top-right corner of its card, but it appears in the corner of the page.',
      lang: 'css',
      code: `.card {
  border: 1px solid #ddd;
  padding: 1rem;
}
.card .badge {
  position: absolute;
  top: 8px;
  right: 8px;
}`,
      line: 3,
      also: [1],
      fix: '  padding: 1rem;\n  position: relative;',
      explain: 'An absolute element is positioned against its nearest ==positioned== ancestor. Give the card `position: relative` so it becomes the containing block.',
      difficulty: 'Easy',
    },
    {
      id: 'box-sizing',
      title: 'Two halves do not fit',
      task: 'Two columns at `width: 50%` should sit side by side, but the second always wraps below.',
      lang: 'css',
      code: `.col {
  float: left;
  width: 50%;
  padding: 0 16px;
  box-sizing: content-box;
}`,
      line: 5,
      fix: '  box-sizing: border-box;',
      explain: 'With `content-box`, padding is ==added== to the 50%, so two columns are wider than 100%. `border-box` includes padding and border in the width.',
      difficulty: 'Easy',
    },
    {
      id: 'specificity',
      title: 'The button that stays blue',
      task: 'The danger button should be red, but it stays blue. Both rules are in the same file.',
      lang: 'css',
      code: `#checkout .btn {
  background: #2563eb;
  color: white;
}
.btn.danger {
  background: #dc2626;
}`,
      line: 5,
      fix: '#checkout .btn.danger {',
      explain: '`#checkout .btn` has an id, so it beats `.btn.danger` (two classes) whatever the order. Match the specificity (or, better, avoid ids in selectors).',
      difficulty: 'Medium',
    },
    {
      id: 'transition-display',
      title: 'No fade',
      task: 'The menu should fade in on hover, but it appears instantly.',
      lang: 'css',
      code: `.menu {
  opacity: 0;
  display: none;
  transition: opacity 0.2s ease, visibility 0.2s;
}
.nav:hover .menu {
  opacity: 1;
  display: block;
}`,
      line: 3,
      also: [8],
      fixed: `.menu {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s;
}
.nav:hover .menu {
  opacity: 1;
  visibility: visible;
}`,
      explain: 'Switching `display` from `none` shows the element in the same frame as `opacity: 1`, so there is nothing to animate from. Hide it with ==`visibility`==, which can transition, and keep it in the layout. (Newer browsers can also use `transition-behavior: allow-discrete`.)',
      difficulty: 'Hard',
    },
    {
      id: 'media-direction',
      title: 'Big title on the small screen',
      task: 'Mobile-first CSS: the title should be 1.25rem on phones and 2rem from 768px up. It is the other way round.',
      lang: 'css',
      code: `.title {
  font-size: 1.25rem;
}
@media (max-width: 768px) {
  .title { font-size: 2rem; }
}`,
      line: 4,
      fix: '@media (min-width: 768px) {',
      explain: 'Mobile-first means base styles for small screens, then ==`min-width`== queries that add styles as the screen grows. `max-width` applies the big size to phones.',
      difficulty: 'Easy',
    },
  ],
}
