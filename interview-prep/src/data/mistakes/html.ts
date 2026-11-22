import type { MistakeSet } from './types'

export const html: MistakeSet = {
  id: 'html',
  title: 'HTML',
  kind: 'html',
  lang: 'html',
  items: [
    {
      id: 'img-alt',
      title: 'An accessible image',
      difficulty: 'Easy',
      task: 'Show the logo `/logo.png` with the description `PrepArena logo` for screen readers.',
      broken: `<img src="/logo.png">
`,
      solution: `<img src="/logo.png" alt="PrepArena logo">
`,
      tests: [
        ['there is an image with the right src', 'expect($("img").getAttribute("src")).toBe("/logo.png")'],
        ['the alt text describes it', 'expect($("img").getAttribute("alt")).toBe("PrepArena logo")'],
      ],
      explain: 'Every `<img>` needs an **`alt`** attribute: screen readers read it, and browsers show it when the image fails to load. Decorative images use an empty `alt=""`.',
      hints: ['What do screen readers read for an image?', 'Add `alt="PrepArena logo"`.'],
    },
    {
      id: 'label-for',
      title: 'A label tied to its input',
      difficulty: 'Medium',
      task: 'An email field with a visible label `Email`; clicking the label must focus the input.',
      broken: `<form>
  <label for="email">Email</label>
  <input type="email" id="mail" name="email">
</form>
`,
      solution: `<form>
  <label for="email">Email</label>
  <input type="email" id="email" name="email">
</form>
`,
      tests: [
        ['the input has the id the label points at', 'const label = $("label"); expect($("#" + label.getAttribute("for"))).not.toBe(null)'],
        ['the label points at an input', 'const label = $("label"); expect($("#" + label.getAttribute("for")).tagName.toLowerCase()).toBe("input")'],
      ],
      explain: 'A label is connected to a field when the label\'s `for` equals the input\'s `id`. Here the label pointed at `email` but the input\'s id was `mail`, so clicking the label did nothing and screen readers could not announce it. (`name` is what the server receives; `id` is for linking.)',
      hints: ['Compare the `for` of the label with the `id` of the input.', 'They must be exactly the same text.'],
    },
    {
      id: 'list-structure',
      title: 'A proper list',
      difficulty: 'Easy',
      task: 'A navigation list with three links: Home, About, Contact.',
      broken: `<ul>
  <a href="/">Home</a>
  <a href="/about">About</a>
  <a href="/contact">Contact</a>
</ul>
`,
      solution: `<ul>
  <li><a href="/">Home</a></li>
  <li><a href="/about">About</a></li>
  <li><a href="/contact">Contact</a></li>
</ul>
`,
      tests: [
        ['the list has three <li> items', 'expect($$("ul > li").length).toBe(3)'],
        ['each item holds a link', 'expect($$("ul > li > a").length).toBe(3)'],
      ],
      explain: 'The only valid children of `<ul>` are **`<li>`** elements. Put each link inside its own `<li>` so assistive tech announces "list, 3 items" and the browser applies list styling correctly.',
      hints: ['What element must be directly inside a `<ul>`?', 'Wrap every `<a>` in an `<li>`.'],
    },
    {
      id: 'button-type',
      title: 'A button that does not submit',
      difficulty: 'Medium',
      task: 'A search form with a submit button and a `Clear` button that must NOT submit the form.',
      broken: `<form action="/search">
  <input name="q">
  <button>Search</button>
  <button>Clear</button>
</form>
`,
      solution: `<form action="/search">
  <input name="q">
  <button type="submit">Search</button>
  <button type="button">Clear</button>
</form>
`,
      tests: [
        ['Search submits', 'expect($$("button")[0].getAttribute("type") ?? "submit").toBe("submit")'],
        ['Clear is type="button" so it does not submit', 'expect($$("button")[1].getAttribute("type")).toBe("button")'],
      ],
      explain: 'A `<button>` inside a form is a **submit** button by default. The Clear button therefore sent the form. Give buttons that should only run script (or do nothing) `type="button"`.',
      hints: ['What is the default `type` of a button inside a form?', 'Set `type="button"` on Clear.'],
    },
  ],
}
