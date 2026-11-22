import type { LearnTrack } from './types'

export const html: LearnTrack = {
  id: 'html',
  intro: 'Build pages the right way: document structure, semantic landmarks, links and images, lists, accessible forms and tables.',
  kind: 'html',
  lang: 'html',
  steps: [
    {
      id: 'skeleton',
      title: 'The page skeleton',
      learn: `Every page starts the same way:

- \`<!DOCTYPE html>\` switches on standards mode
- \`<html lang="en">\` tells screen readers and search engines the language
- \`<head>\` holds metadata: \`<meta charset="utf-8">\` and a \`<title>\`
- \`<body>\` holds what you see`,
      task: 'Complete the skeleton: add `lang="en"` to `<html>`, a `<meta charset="utf-8">` and a `<title>` of "My page", and an `<h1>` saying "Hello" in the body.',
      starter: `<!DOCTYPE html>
<html>
<head>

</head>
<body>

</body>
</html>
`,
      solution: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>My page</title>
</head>
<body>
  <h1>Hello</h1>
</body>
</html>
`,
      tests: [
        ['<html> has lang="en"', 'expect(document.documentElement.getAttribute("lang")).toBe("en")'],
        ['the charset is utf-8', 'expect($("meta[charset]")?.getAttribute("charset")?.toLowerCase()).toBe("utf-8")'],
        ['the title is "My page"', 'expect($("head title")?.textContent.trim()).toBe("My page")'],
        ['the body has an <h1> "Hello"', 'expect($("body h1")?.textContent.trim()).toBe("Hello")'],
      ],
      hints: ['`lang` is an attribute on the opening `<html>` tag.', 'The `<meta>` and `<title>` go inside `<head>`; the `<h1>` inside `<body>`.'],
    },
    {
      id: 'semantic-layout',
      title: 'Semantic landmarks',
      learn: `Use elements that say what they are. Screen readers let people jump between these **landmarks**:

- \`<header>\`, \`<nav>\`, \`<main>\` (one per page), \`<footer>\`
- \`<article>\` for a self-contained piece, \`<section>\` for a themed group with a heading

A page made only of \`<div>\`s has none of this.`,
      task: 'Replace the divs with semantic elements: the top bar becomes `<header>` containing a `<nav>`, the content becomes `<main>`, and the bottom becomes `<footer>`.',
      starter: `<body>
  <div class="top">
    <div class="links"><a href="/">Home</a> <a href="/blog">Blog</a></div>
  </div>
  <div class="content">
    <h1>Welcome</h1>
  </div>
  <div class="bottom">© 2026</div>
</body>
`,
      solution: `<body>
  <header>
    <nav><a href="/">Home</a> <a href="/blog">Blog</a></nav>
  </header>
  <main>
    <h1>Welcome</h1>
  </main>
  <footer>© 2026</footer>
</body>
`,
      tests: [
        ['a <header> holds a <nav> with the links', 'expect($$("header nav a").length).toBe(2)'],
        ['the heading is inside <main>', 'expect($("main h1")?.textContent).toBe("Welcome")'],
        ['there is a <footer>', 'expect($("footer")?.textContent).toContain("2026")'],
        ['exactly one <main>', 'expect($$("main").length).toBe(1)'],
      ],
      hints: ['Swap the tag names; the content inside stays the same.', '`<div class="top">` → `<header>`, the inner links div → `<nav>`.'],
    },
    {
      id: 'links-images',
      title: 'Links and images',
      learn: `\`<a href="…">\` makes a link. For links that open a new tab, add \`target="_blank"\` with \`rel="noopener noreferrer"\`.

\`<img>\` needs \`alt\` text describing the image (or \`alt=""\` if it is purely decorative), and \`width\`/\`height\` so the page doesn't jump while it loads.`,
      task: 'Make the logo image accessible (alt "Acme logo", width 120, height 40) and make the docs link open in a new tab safely.',
      starter: `<header>
  <img src="/logo.png">
  <a href="https://docs.example.com">Docs</a>
</header>
`,
      solution: `<header>
  <img src="/logo.png" alt="Acme logo" width="120" height="40">
  <a href="https://docs.example.com" target="_blank" rel="noopener noreferrer">Docs</a>
</header>
`,
      tests: [
        ['the image has alt text', 'expect($("img")?.getAttribute("alt")).toBe("Acme logo")'],
        ['the image has width and height', 'expect($("img")?.getAttribute("width")).toBe("120"); expect($("img")?.getAttribute("height")).toBe("40")'],
        ['the link opens a new tab', 'expect($("a")?.getAttribute("target")).toBe("_blank")'],
        ['…with rel="noopener"', 'expect($("a")?.getAttribute("rel") ?? "").toMatch(/noopener/)'],
      ],
      hints: ['Attributes go inside the opening tag: `<img src="…" alt="…">`.', 'The link needs both `target="_blank"` and `rel="noopener noreferrer"`.'],
    },
    {
      id: 'lists',
      title: 'Lists',
      learn: `\`<ul>\` is an unordered (bullet) list, \`<ol>\` an ordered (numbered) one. Each item is an \`<li>\`, and \`<li>\` must be a direct child of the list.

Navigation menus are usually a \`<ul>\` of links inside \`<nav>\`.`,
      task: 'Turn the steps into an ordered list with three `<li>` items, and the ingredients into an unordered list.',
      starter: `<h2>Ingredients</h2>
<p>Flour, Eggs, Milk</p>
<h2>Steps</h2>
<p>1. Mix. 2. Rest. 3. Cook.</p>
`,
      solution: `<h2>Ingredients</h2>
<ul>
  <li>Flour</li>
  <li>Eggs</li>
  <li>Milk</li>
</ul>
<h2>Steps</h2>
<ol>
  <li>Mix</li>
  <li>Rest</li>
  <li>Cook</li>
</ol>
`,
      tests: [
        ['ingredients are a <ul> of 3 items', 'expect($$("ul > li").map((li) => li.textContent.trim())).toEqual(["Flour", "Eggs", "Milk"])'],
        ['steps are an <ol> of 3 items', 'expect($$("ol > li").length).toBe(3)'],
        ['no leftover paragraphs', 'expect($$("p").length).toBe(0)'],
      ],
      hints: ['Order matters for the steps, so use `<ol>`; the browser numbers them for you.', 'Each item is its own `<li>…</li>` directly inside the list.'],
    },
    {
      id: 'forms',
      title: 'Accessible forms',
      learn: `Every input needs a **label**. Link them with \`for\` on the label matching \`id\` on the input; clicking the label then focuses the input.

Use the right \`type\` (\`email\`, \`password\`, \`number\`…) for the right keyboard and validation, \`name\` so the value is sent, and \`required\` for fields that must be filled.`,
      task: 'Finish the sign-up form: label both fields (email and password), give the inputs matching `id`s, the right `type`s, `name`s and `required`. The button submits the form.',
      starter: `<form action="/signup" method="post">
  Email <input>
  Password <input>
  <button>Sign up</button>
</form>
`,
      solution: `<form action="/signup" method="post">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required>
  <label for="password">Password</label>
  <input id="password" name="password" type="password" required>
  <button type="submit">Sign up</button>
</form>
`,
      tests: [
        ['every input has a matching label', 'const inputs = $$("input"); expect(inputs.length).toBe(2); for (const i of inputs) expect($(`label[for="${i.getAttribute("id")}"]`)).toBeTruthy()'],
        ['the email field is type="email"', 'expect($("input[type=email]")).toBeTruthy()'],
        ['the password field is type="password"', 'expect($("input[type=password]")).toBeTruthy()'],
        ['both have a name and are required', 'for (const i of $$("input")) { expect(i.getAttribute("name")).toBeTruthy(); expect(i.hasAttribute("required")).toBe(true) }'],
      ],
      hints: ['`<label for="email">Email</label>` pairs with `<input id="email">`.', 'Add `type`, `name` and `required` attributes to both inputs.'],
    },
    {
      id: 'buttons',
      title: 'Buttons that do the right thing',
      learn: `Inside a form, \`<button>\` defaults to \`type="submit"\`. A helper button (show password, add a row) needs \`type="button"\`, or it submits the form.

Use a real \`<button>\` for actions and \`<a>\` for navigation: a \`<div onclick>\` is not keyboard accessible.`,
      task: 'Fix the form: the "Show password" control must not submit the form and must be a real button; the "Log in" button submits.',
      starter: `<form action="/login" method="post">
  <input id="pw" name="password" type="password">
  <div class="toggle">Show password</div>
  <button>Log in</button>
</form>
`,
      solution: `<form action="/login" method="post">
  <input id="pw" name="password" type="password">
  <button type="button" class="toggle">Show password</button>
  <button type="submit">Log in</button>
</form>
`,
      tests: [
        ['"Show password" is a <button type="button">', 'const b = $$("button").find((x) => x.textContent.includes("Show")); expect(b?.getAttribute("type")).toBe("button")'],
        ['"Log in" is the submit button', 'const b = $$("button").find((x) => x.textContent.includes("Log in")); expect(b?.getAttribute("type") ?? "submit").toBe("submit")'],
        ['no clickable divs', 'expect($(".toggle")?.tagName.toLowerCase()).toBe("button")'],
      ],
      hints: ['Change the `<div>` to `<button>`.', 'Give it `type="button"`; give "Log in" `type="submit"` to be explicit.'],
    },
    {
      id: 'tables',
      title: 'Tables for tabular data',
      learn: `Tables are for data with rows and columns (not for layout). Give them structure:

- \`<caption>\` names the table
- \`<thead>\` with \`<th scope="col">\` header cells
- \`<tbody>\` with \`<tr>\` rows of \`<td>\` cells`,
      task: 'Build a table with caption "Scores", a header row (Name, Score) using `<th scope="col">`, and two body rows: Ada 95, Linus 88.',
      starter: `<table>

</table>
`,
      solution: `<table>
  <caption>Scores</caption>
  <thead>
    <tr><th scope="col">Name</th><th scope="col">Score</th></tr>
  </thead>
  <tbody>
    <tr><td>Ada</td><td>95</td></tr>
    <tr><td>Linus</td><td>88</td></tr>
  </tbody>
</table>
`,
      tests: [
        ['has the caption "Scores"', 'expect($("table caption")?.textContent.trim()).toBe("Scores")'],
        ['header cells use <th scope="col">', 'const th = $$("thead th"); expect(th.map((t) => t.textContent.trim())).toEqual(["Name", "Score"]); expect(th.every((t) => t.getAttribute("scope") === "col")).toBe(true)'],
        ['two rows in <tbody>', 'expect($$("tbody tr").map((r) => [...r.querySelectorAll("td")].map((c) => c.textContent.trim()))).toEqual([["Ada", "95"], ["Linus", "88"]])'],
      ],
      hints: ['Order inside `<table>`: `<caption>`, `<thead>`, `<tbody>`.', 'Each row is `<tr>`; header cells are `<th scope="col">`, data cells `<td>`.'],
    },
    {
      id: 'responsive-meta',
      title: 'Ready for phones',
      learn: `Without a viewport tag, phones lay the page out about 980px wide and zoom out, so your media queries never match:

\`<meta name="viewport" content="width=device-width, initial-scale=1">\`

A page also needs a \`<meta name="description">\` for search results.`,
      task: 'Add the viewport meta tag and a description ("Recipes for busy people") to the head.',
      starter: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Quick Recipes</title>
</head>
<body><h1>Quick Recipes</h1></body>
</html>
`,
      solution: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Recipes for busy people">
  <title>Quick Recipes</title>
</head>
<body><h1>Quick Recipes</h1></body>
</html>
`,
      tests: [
        ['has a viewport using device-width', 'expect($("meta[name=viewport]")?.getAttribute("content") ?? "").toMatch(/width=device-width/)'],
        ['…with initial-scale=1', 'expect($("meta[name=viewport]")?.getAttribute("content") ?? "").toMatch(/initial-scale=1/)'],
        ['has the description', 'expect($("meta[name=description]")?.getAttribute("content")).toBe("Recipes for busy people")'],
      ],
      hints: ['Both are `<meta name="…" content="…">` tags inside `<head>`.', 'The viewport content is `width=device-width, initial-scale=1`.'],
    },
  ],
}
