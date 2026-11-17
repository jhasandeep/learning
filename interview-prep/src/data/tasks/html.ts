import type { TaskPath } from './types'

export const html: TaskPath = {
  id: 'html',
  title: 'HTML',
  blurb: 'Build real pages: structure, forms, accessibility and a search-friendly head.',
  tasks: [
    {
      id: 'semantic-page',
      kind: 'rules',
      language: 'html',
      title: 'Build a page with real structure',
      goal: 'Turn a pile of `div`s into a page that screen readers and Google understand.',
      steps: [
        'Add the document basics: `<!DOCTYPE html>`, `<html lang="en">` and a `<title>`.',
        'Replace the top `div` with `<header>` and the menu `div` with `<nav>` holding a list of links.',
        'Wrap the page content in `<main>` with exactly one `<h1>`, and use `<footer>` at the bottom.',
      ],
      starter: `<div class="top">
  <h1>My Bakery</h1>
</div>
<div class="menu">
  <a href="/">Home</a>
  <a href="/cakes">Cakes</a>
</div>
<div class="content">
  <p>Fresh bread every morning.</p>
</div>
<div class="bottom">© My Bakery</div>`,
      hints: ['Semantic tags describe meaning: header, nav, main, footer.', 'A menu is a list of links, so use `<ul>` and `<li>` inside `<nav>`.', 'Put `lang="en"` on the `<html>` tag and put the title inside `<head>`.'],
      solution: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>My Bakery</title>
</head>
<body>
  <header>
    <h1>My Bakery</h1>
  </header>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/cakes">Cakes</a></li>
    </ul>
  </nav>
  <main>
    <p>Fresh bread every morning.</p>
  </main>
  <footer>© My Bakery</footer>
</body>
</html>`,
      rules: [
        { label: 'Starts with `<!DOCTYPE html>`', match: /<!doctype html>/i, hint: 'The very first line should be <!DOCTYPE html>.' },
        { label: '`<html>` has a `lang` attribute', match: /<html[^>]*\slang=/i, hint: 'Write <html lang="en">.' },
        { label: 'Has a non-empty `<title>`', match: /<title>\s*\S[^<]*<\/title>/i, hint: 'Add <title>My Bakery</title> inside <head>.' },
        { label: 'Uses `<header>`', match: /<header[\s>]/i, hint: 'Replace the first div with <header>.' },
        { label: 'Uses `<nav>` with a list of links', match: /<nav[\s>][\s\S]*<ul[\s>][\s\S]*<li[\s>][\s\S]*<a\s[\s\S]*<\/nav>/i, hint: 'Put <ul><li><a>…</a></li></ul> inside <nav>.' },
        { label: 'Uses `<main>`', match: /<main[\s>]/i, hint: 'Wrap the page content in <main>.' },
        { label: 'Uses `<footer>`', match: /<footer[\s>]/i, hint: 'Replace the last div with <footer>.' },
        { label: 'Has no leftover `<div>`s', match: /<div[\s>]/i, absent: true, hint: 'Every div can become a meaningful tag here.' },
      ],
      learned: 'Semantic tags tell browsers, screen readers and search engines what each part of the page is, not just how it looks.',
    },
    {
      id: 'contact-form',
      kind: 'rules',
      language: 'html',
      title: 'Create a contact form',
      goal: 'Build a form people can fill in with the keyboard, with the browser checking their input.',
      steps: [
        'Give every field a `<label>` connected with `for` and a matching `id`.',
        'Use `type="email"` for the email and a `<textarea>` for the message.',
        'Mark name and email as `required`, and end with a submit button.',
      ],
      starter: `<form action="/contact" method="post">
  Name: <input name="name">
  Email: <input name="email">
  Message: <input name="message">
  <div>Send</div>
</form>`,
      hints: ['A label is connected to its input when `for` equals the input `id`.', 'Use `<textarea id="message" name="message"></textarea>` for long text.', 'A `<button type="submit">` submits the form; a div does not.'],
      solution: `<form action="/contact" method="post">
  <label for="name">Name</label>
  <input id="name" name="name" required>

  <label for="email">Email</label>
  <input id="email" name="email" type="email" required>

  <label for="message">Message</label>
  <textarea id="message" name="message"></textarea>

  <button type="submit">Send</button>
</form>`,
      rules: [
        { label: 'Has a `<label for="…">` for each of the 3 fields', match: /<label[^>]*\sfor=/i, min: 3, hint: 'Each input needs its own label with a matching for/id.' },
        { label: 'Each field has an `id`', match: /<(input|textarea)[^>]*\sid=/i, min: 3, hint: 'Add id="name", id="email" and id="message".' },
        { label: 'The email field uses `type="email"`', match: /<input[^>]*type=["']email["']/i, hint: 'Write <input type="email" …>.' },
        { label: 'The message uses a `<textarea>`', match: /<textarea[\s>]/i, hint: 'Replace the message input with a textarea.' },
        { label: 'Name and email are `required`', match: /<input[^>]*\srequired/i, min: 2, hint: 'Add the required attribute to both inputs.' },
        { label: 'Ends with `<button type="submit">`', match: /<button[^>]*type=["']submit["']/i, hint: 'Replace the div with a submit button.' },
      ],
      learned: 'Labels make a field clickable and readable by screen readers; built-in attributes like `required` and `type="email"` give free validation.',
    },
    {
      id: 'accessible-content',
      kind: 'rules',
      language: 'html',
      title: 'Make content accessible',
      goal: 'Fix a card so that people using screen readers or only a keyboard can use it.',
      steps: [
        'Give the image a helpful `alt` text (not "image" or "photo").',
        'Replace the vague "click here" link with text that says where it goes.',
        'Replace the clickable `div` with a real `<button>`.',
      ],
      starter: `<article>
  <img src="/cake.jpg">
  <h2>Chocolate cake</h2>
  <p>Rich, soft and baked fresh. <a href="/cakes/chocolate">click here</a></p>
  <div onclick="addToCart()">Add to cart</div>
</article>`,
      hints: ['The alt text describes what the image shows or means.', 'Link text should make sense on its own: "See the chocolate cake".', 'Buttons are focusable and work with Enter and Space automatically.'],
      solution: `<article>
  <img src="/cake.jpg" alt="A chocolate cake with glossy icing">
  <h2>Chocolate cake</h2>
  <p>Rich, soft and baked fresh. <a href="/cakes/chocolate">See the chocolate cake</a></p>
  <button type="button" onclick="addToCart()">Add to cart</button>
</article>`,
      rules: [
        { label: 'The image has a meaningful `alt`', match: /<img[^>]*\salt=["'][^"']{6,}["']/i, hint: 'Write at least a few words, e.g. alt="A chocolate cake with glossy icing".' },
        { label: 'No link says "click here"', match: /click here/i, absent: true, hint: 'Describe the destination instead.' },
        { label: 'The link text is descriptive', match: /<a\s[^>]*>[^<]{10,}<\/a>/i, hint: 'Use a few words inside the link.' },
        { label: 'Uses a real `<button>`', match: /<button[\s>]/i, hint: 'Change the clickable div into a button.' },
        { label: 'No clickable `<div onclick>` is left', match: /<div[^>]*onclick/i, absent: true, hint: 'Remove the div with onclick.' },
      ],
      learned: 'Accessibility is mostly using the right element: real buttons, real links and honest text alternatives work for everyone with no extra effort.',
    },
    {
      id: 'seo-head',
      kind: 'rules',
      language: 'html',
      title: 'Write a search-friendly head',
      goal: 'Add the tags that make a page show up properly in Google and when shared.',
      steps: [
        'Add `<meta charset="utf-8">` and the mobile `viewport` meta tag.',
        'Write a clear `<title>` and a `meta name="description"`.',
        'Add Open Graph `og:title` and `og:image` tags, and a `canonical` link.',
      ],
      starter: `<head>
  <title>Home</title>
</head>`,
      hints: ['The viewport tag is `<meta name="viewport" content="width=device-width, initial-scale=1">`.', 'Open Graph tags use `property="og:title"` and a `content` attribute.', 'The canonical link is `<link rel="canonical" href="https://…">`.'],
      solution: `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fresh Bread and Cakes in Delhi | My Bakery</title>
  <meta name="description" content="Order fresh bread, cakes and pastries baked every morning in Delhi.">
  <meta property="og:title" content="My Bakery: fresh bread and cakes">
  <meta property="og:image" content="https://example.com/share.jpg">
  <link rel="canonical" href="https://example.com/">
</head>`,
      rules: [
        { label: 'Declares the charset', match: /<meta[^>]*charset=/i, hint: 'Add <meta charset="utf-8">.' },
        { label: 'Has the mobile viewport tag', match: /<meta[^>]*name=["']viewport["'][^>]*width=device-width/i, hint: 'content="width=device-width, initial-scale=1"' },
        { label: 'The title is at least 15 characters', match: /<title>[^<]{15,}<\/title>/i, hint: 'Describe the page, e.g. "Fresh Bread and Cakes in Delhi | My Bakery".' },
        { label: 'Has a meta description', match: /<meta[^>]*name=["']description["'][^>]*content=["'][^"']{30,}/i, hint: 'Write one sentence of 30+ characters.' },
        { label: 'Has `og:title` and `og:image`', match: /<meta[^>]*property=["']og:(title|image)["']/i, min: 2, hint: 'Add both Open Graph tags.' },
        { label: 'Has a canonical link', match: /<link[^>]*rel=["']canonical["']/i, hint: 'Add <link rel="canonical" href="…">.' },
      ],
      learned: 'The `<head>` is invisible but powerful: it decides how your page looks in search results, in link previews and on phones.',
    },
    {
      id: 'pricing-table',
      kind: 'rules',
      language: 'html',
      title: 'Show data in a proper table',
      goal: 'Build a small pricing table the right way, with header cells and a caption.',
      steps: [
        'Use `<table>` with a `<caption>`, a `<thead>` and a `<tbody>`.',
        'Header cells use `<th scope="col">`; data cells use `<td>`.',
        'Include 3 plans (rows) with name and price.',
      ],
      starter: `<div>Plan - Price</div>
<div>Basic - ₹499</div>
<div>Pro - ₹999</div>
<div>Team - ₹2499</div>`,
      hints: ['Start with `<table><caption>Our plans</caption>`.', 'The header row goes inside `<thead><tr><th scope="col">Plan</th>…`.', 'Each plan is one `<tr>` with two `<td>` cells inside `<tbody>`.'],
      solution: `<table>
  <caption>Our plans</caption>
  <thead>
    <tr><th scope="col">Plan</th><th scope="col">Price</th></tr>
  </thead>
  <tbody>
    <tr><td>Basic</td><td>₹499</td></tr>
    <tr><td>Pro</td><td>₹999</td></tr>
    <tr><td>Team</td><td>₹2499</td></tr>
  </tbody>
</table>`,
      rules: [
        { label: 'Uses `<table>` with a `<caption>`', match: /<table[\s>][\s\S]*<caption[\s>]/i, hint: 'Add <caption>Our plans</caption> right after <table>.' },
        { label: 'Has `<thead>` and `<tbody>`', match: /<thead[\s>][\s\S]*<tbody[\s>]/i, hint: 'Split the header row from the data rows.' },
        { label: 'Header cells are `<th scope="col">`', match: /<th[^>]*scope=["']col["']/i, min: 2, hint: 'Use <th scope="col"> for Plan and Price.' },
        { label: 'Has 3 data rows with `<td>` cells', match: /<td[\s>]/i, min: 6, hint: 'Three plans with two td cells each.' },
        { label: 'No leftover `<div>` rows', match: /<div[\s>]/i, absent: true, hint: 'Replace the divs with table rows.' },
      ],
      learned: 'Tables are for data, and `th` plus `scope` tell assistive technology which header belongs to which cell.',
    },
  ],
}
