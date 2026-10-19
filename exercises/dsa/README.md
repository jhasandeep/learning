# DSA exercises (Python + JavaScript)

Solutions for the problems in Technical Suneja's *DSA in JavaScript* playlist, written in both languages. The handwritten-style notes in [`notes/dsa/`](../../notes/dsa/) embed these exact snippets.

| File | Run tests |
| --- | --- |
| [`python/dsa.py`](python/dsa.py) | `python3 exercises/dsa/python/dsa.py` |
| [`javascript/dsa.js`](javascript/dsa.js) | `node exercises/dsa/javascript/dsa.js` |

Each solution sits between `@snippet <name>` / `@end` comment markers. After you edit a snippet, rebuild the notes:

```sh
pip install pygments
python3 notes/dsa/build.py   # -> dsa-notes.html (typed) + dsa-notes-handwritten.html (notebook)
```

Then print either HTML file to PDF (A4, background graphics on), or render it with headless Chromium.
