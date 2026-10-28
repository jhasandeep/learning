import type { NoteTopic } from './types'

export const html: NoteTopic = {
  id: 'html',
  title: 'HTML',
  tagline: 'Structure, semantics, forms, accessibility and SEO basics',
  category: 'Frontend',
  badge: 'HTML',
  color: '#e34f26',
  sections: [
    {
      id: 'what',
      title: 'What is HTML?',
      blocks: [
        { type: 'def', text: '**HTML** (HyperText Markup Language) describes the ==structure and meaning== of a web page using elements (tags). The browser parses it into the **DOM** tree, CSS styles that tree and JavaScript makes it interactive.' },
        { type: 'analogy', title: 'Think of an HTML page like building a house', steps: [{ icon: '🏗️', who: 'Architect', tech: 'HTML', text: 'Draws the structure: rooms, doors, windows' }, { icon: '🎨', who: 'Interior designer', tech: 'CSS', text: 'Colours, layout and style of every room' }, { icon: '⚡', who: 'Electrician', tech: 'JavaScript', text: 'Makes lights and doors respond when used' }, { icon: '🏠', who: 'Finished house', tech: 'Rendered page', text: 'The browser puts it all together for the visitor' }] },
        { type: 'flow', steps: ['HTML text', 'Parser', 'DOM tree', '+ CSSOM', 'Render tree', 'Layout', 'Paint'], caption: 'How a page becomes pixels (the critical rendering path)' },
        {
          type: 'code', lang: 'html', title: 'Minimal valid page', run: true,
          code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My page</title>
  </head>
  <body>
    <h1>Hello, world</h1>
    <p>A paragraph with a <a href="https://developer.mozilla.org">link</a>.</p>
  </body>
</html>`,
        },
        { type: 'list', items: ['`<!DOCTYPE html>` switches the browser to **standards mode** (no quirks).', '`lang` helps screen readers and translation.', 'The `viewport` meta tag makes the page responsive on phones.'] },
      ],
    },
    {
      id: 'semantic',
      title: 'Semantic HTML',
      blocks: [
        { type: 'def', text: 'Semantic elements describe ==what content is==, not how it looks. They improve **accessibility**, **SEO** and readability.' },
        {
          type: 'table', head: ['Element', 'Use for'],
          rows: [
            ['`<header>` / `<footer>`', 'Intro / closing content of a page or section'],
            ['`<nav>`', 'Main navigation links'],
            ['`<main>`', 'The unique main content (one per page)'],
            ['`<article>`', 'Self-contained content: a post, a product card'],
            ['`<section>`', 'A themed group of content with a heading'],
            ['`<aside>`', 'Side content: related links, ads'],
            ['`<figure>` + `<figcaption>`', 'Image/diagram with a caption'],
            ['`<button>`', 'Actions (not a `<div onclick>`)'],
          ],
        },
        { type: 'mistake', text: '"Div soup": `<div class="button" onclick=…>` is not focusable and is not announced as a button. Use `<button>`; use `<a>` only for navigation to a URL.' },
      ],
    },
    {
      id: 'elements',
      title: 'Block vs inline, and common elements',
      blocks: [
        {
          type: 'table', head: ['Block', 'Inline'],
          rows: [
            ['Starts on a new line, takes full width', 'Flows inside text, only as wide as content'],
            ['`div`, `p`, `h1–h6`, `ul`, `section`, `form`', '`span`, `a`, `strong`, `em`, `img`, `code`, `label`'],
          ],
        },
        { type: 'list', items: ['`<strong>` = important (bold), `<em>` = emphasis (italic) — semantic; `<b>`/`<i>` are only visual.', '`<img src alt>` — `alt` is required for accessibility; use `alt=""` for decorative images.', 'Lists: `<ul>` unordered, `<ol>` ordered, `<li>` items, `<dl>` description list.', 'Tables for tabular data only: `<table> <thead> <tbody> <tr> <th scope="col"> <td>`.'] },
      ],
    },
    {
      id: 'forms',
      title: 'Forms and validation',
      blocks: [
        {
          type: 'code', lang: 'html', title: 'Accessible form with built-in validation', run: true,
          code: `<form id="signup" novalidate>
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required autocomplete="email" />

  <label for="age">Age</label>
  <input id="age" name="age" type="number" min="18" max="99" />

  <label><input type="checkbox" name="terms" required /> I accept the terms</label>
  <button type="submit">Sign up</button>
</form>
<p id="msg"></p>
<script>
  document.getElementById('signup').addEventListener('submit', (e) => {
    e.preventDefault()
    const form = e.target
    const msg = document.getElementById('msg')
    msg.textContent = form.checkValidity() ? 'Valid ✓' : 'Please fix the highlighted fields'
    console.log(Object.fromEntries(new FormData(form)))
  })
</script>`,
        },
        { type: 'list', items: ['Every input needs a `<label>` (linked with `for`/`id` or by wrapping).', 'Input types (`email`, `number`, `date`, `tel`, `url`) give free validation and the right mobile keyboard.', 'Attributes: `required`, `min`/`max`, `minlength`, `pattern`, `autocomplete`.', 'GET puts data in the URL (search, filters); POST sends it in the body (create, login).'] },
        { type: 'mistake', text: 'Client-side validation is for UX only — always ==validate again on the server==.' },
      ],
    },
    {
      id: 'a11y',
      title: 'Accessibility (a11y)',
      blocks: [
        { type: 'list', items: ['Use semantic elements first; **ARIA** only fills gaps ("no ARIA is better than bad ARIA").', 'One `<h1>`, then headings in order (don\'t skip levels for styling).', 'Everything clickable must work with the keyboard (Tab, Enter, Space) and show a visible focus ring.', 'Text contrast at least 4.5:1; never use colour alone to carry meaning.', '`aria-label` names an icon-only button; `aria-live` announces dynamic updates.'] },
        { type: 'tip', text: 'Quick test: unplug the mouse and use the page with Tab only, then run Lighthouse / axe.' },
      ],
    },
    {
      id: 'head-seo',
      title: 'The <head>, SEO and loading scripts',
      blocks: [
        { type: 'list', items: ['`<title>` and `<meta name="description">` show in search results.', 'Open Graph tags (`og:title`, `og:image`) control link previews on social media.', '`<link rel="canonical">` avoids duplicate-content issues.', 'Search engines understand semantic HTML and real links (`<a href>`).'] },
        {
          type: 'table', head: ['Script tag', 'Downloads', 'Runs', 'Order kept?'],
          rows: [
            ['`<script>`', 'blocks parsing', 'immediately', 'yes'],
            ['`<script defer>`', 'in parallel', 'after HTML is parsed', 'yes'],
            ['`<script async>`', 'in parallel', 'as soon as downloaded', 'no'],
            ['`<script type="module">`', 'in parallel', 'deferred by default', 'yes'],
          ],
        },
        { type: 'tip', text: 'Use `defer` for app scripts, `async` for independent ones (analytics). Add `loading="lazy"` on below-the-fold images.' },
      ],
    },
    {
      id: 'storage',
      title: 'Browser storage',
      blocks: [
        {
          type: 'table', head: ['', 'Capacity', 'Lifetime', 'Sent to server?'],
          rows: [
            ['Cookie', '~4 KB', 'Until expiry', 'Yes, on every request'],
            ['localStorage', '~5–10 MB', 'Until cleared', 'No'],
            ['sessionStorage', '~5 MB', 'Until the tab closes', 'No'],
            ['IndexedDB', 'Large (quota)', 'Until cleared', 'No'],
          ],
        },
        { type: 'mistake', text: 'Don\'t keep auth tokens in localStorage — any XSS can read them. Prefer `httpOnly`, `Secure`, `SameSite` cookies.' },
        { type: 'revision', text: 'HTML = structure + meaning. Semantic tags, labelled forms, keyboard access, `defer` scripts, and the right storage for each job.' },
      ],
    },
  ],
  qa: [
    ['What does <!DOCTYPE html> do?', 'Tells the browser to render in standards mode instead of quirks mode.'],
    ['Semantic vs non-semantic elements?', 'Semantic elements (header, nav, main, article, button) describe meaning; div and span carry none. Semantics help accessibility, SEO and maintenance.'],
    ['Block vs inline elements?', 'Block elements start on a new line and fill the width (div, p, h1). Inline elements flow in text and only take their content width (span, a, strong).'],
    ['async vs defer on script tags?', 'Both download in parallel. defer runs after parsing, in order. async runs as soon as it downloads, in any order.'],
    ['Why is the alt attribute important?', 'Screen readers read it, it shows if the image fails, and search engines use it. Decorative images get alt="".'],
    ['localStorage vs sessionStorage vs cookies?', 'localStorage persists until cleared; sessionStorage lasts for the tab; cookies are small and are sent to the server on every request.'],
    ['How do you make a form accessible?', 'A label for every input, correct input types, clear error messages linked to fields, keyboard operable, and visible focus.'],
    ['What is the DOM?', 'The Document Object Model: the browser\'s tree of objects built from HTML that JavaScript can read and change.'],
    ['When should you use ARIA?', 'Only when native HTML can\'t express the role or state. Native elements first; ARIA fills gaps.'],
    ['What is the critical rendering path?', 'HTML → DOM, CSS → CSSOM, combined into the render tree, then layout and paint. Blocking CSS/JS delays the first paint.'],
  ],
}
