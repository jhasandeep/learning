import type { SpotSet } from './types'

export const html: SpotSet = {
  id: 'html',
  bugs: [
    {
      id: 'label-for',
      title: 'The label that does nothing',
      task: 'Clicking "Email" should focus the input, and screen readers should announce the field name. Neither happens.',
      lang: 'html',
      code: `<form action="/subscribe" method="post">
  <label for="mail">Email</label>
  <input id="email" name="email" type="email" required>
  <button type="submit">Subscribe</button>
</form>`,
      line: 2,
      fix: '  <label for="email">Email</label>',
      explain: 'A label\'s `for` must match the input\'s ==`id`==, not a guess at its name. Here `for="mail"` points at nothing.',
      difficulty: 'Easy',
    },
    {
      id: 'button-submit',
      title: 'The page keeps reloading',
      task: 'The "Show password" button should toggle visibility, but every click submits the login form and reloads the page.',
      lang: 'html',
      code: `<form id="login">
  <input id="pw" type="password" name="password">
  <button onclick="togglePw()">Show password</button>
  <button type="submit">Log in</button>
</form>`,
      line: 3,
      fix: '  <button type="button" onclick="togglePw()">Show password</button>',
      explain: 'A `<button>` inside a form defaults to ==`type="submit"`==. Helper buttons need `type="button"`.',
      difficulty: 'Easy',
    },
    {
      id: 'img-alt',
      title: 'Silent product photo',
      task: 'Screen-reader users hear "image" and a file name instead of what the product is. The photo is meaningful content.',
      lang: 'html',
      code: `<article class="product">
  <h2>Trail Runner 3</h2>
  <img src="/img/tr3-blue.jpg" width="400" height="300">
  <p>Lightweight running shoe with a grippy sole.</p>
</article>`,
      line: 3,
      fix: '  <img src="/img/tr3-blue.jpg" alt="Blue Trail Runner 3 shoe, side view" width="400" height="300">',
      explain: 'Meaningful images need `alt` text describing them. (Decorative ones get `alt=""` so they are skipped.)',
      difficulty: 'Easy',
    },
    {
      id: 'script-head',
      title: 'null is not an element',
      task: 'The script throws `Cannot read properties of null (reading \'addEventListener\')` on load.',
      lang: 'html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <script src="app.js"></script>
</head>
<body>
  <button id="buy">Buy</button>
</body>
</html>`,
      line: 5,
      fix: '  <script src="app.js" defer></script>',
      explain: 'A classic script in `<head>` runs before the body is parsed, so `#buy` does not exist yet. ==`defer`== runs it after parsing (and does not block rendering).',
      difficulty: 'Medium',
    },
    {
      id: 'link-new-tab',
      title: 'The risky new tab',
      task: 'An external link opens in a new tab. A security review flags it.',
      lang: 'html',
      code: `<footer>
  <p>Made with care.</p>
  <a href="https://partner.example.com" target="_blank">Our partner</a>
</footer>`,
      line: 3,
      fix: '  <a href="https://partner.example.com" target="_blank" rel="noopener noreferrer">Our partner</a>',
      explain: 'Without `rel="noopener"`, older browsers give the new page `window.opener`, so it can redirect your tab (tabnabbing). Modern browsers imply `noopener`, but writing it is still expected.',
      difficulty: 'Medium',
    },
    {
      id: 'viewport',
      title: 'Tiny text on phones',
      task: 'The responsive CSS works when the desktop window is narrowed, but phones show a zoomed-out desktop layout.',
      lang: 'html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=1024">
  <title>Shop</title>
  <link rel="stylesheet" href="styles.css">
</head>`,
      line: 5,
      fix: '  <meta name="viewport" content="width=device-width, initial-scale=1">',
      explain: 'A fixed `width=1024` tells phones to lay out at 1024px and zoom out, so `max-width` media queries never match. Use ==`width=device-width`==.',
      difficulty: 'Easy',
    },
  ],
}
