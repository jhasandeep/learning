"""Build dsa-notes.html from the template, embedding tested code snippets.

Placeholders `[[code:name]]` in the template become a Python + JavaScript
pair taken from exercises/dsa/{python/dsa.py, javascript/dsa.js}. Pairs whose
lines are short sit side by side; longer ones are stacked.

Usage: python3 notes/dsa/build.py
"""
import re
from pathlib import Path

from pygments import highlight
from pygments.formatters import HtmlFormatter
from pygments.lexers import JavascriptLexer, PythonLexer

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
SOURCES = {
    "py": (ROOT / "exercises/dsa/python/dsa.py", "#", PythonLexer(), "python"),
    "js": (ROOT / "exercises/dsa/javascript/dsa.js", "//", JavascriptLexer(), "javascript"),
}
SIDE_BY_SIDE_MAX = 55  # widest line (chars) that still fits half a page


def load_snippets(path, comment):
    pattern = re.compile(rf"^{re.escape(comment)} @snippet (\w+)\n(.*?)^{re.escape(comment)} @end",
                         re.M | re.S)
    return {name: body.rstrip("\n") for name, body in pattern.findall(path.read_text())}


def card(lang, code):
    _, _, lexer, label = SOURCES[lang]
    formatter = HtmlFormatter(nowrap=True, classprefix="t-")
    body = highlight(code, lexer, formatter).rstrip("\n")
    return f'<div class="cw {lang}"><span class="tag {lang}">{label}</span><pre>{body}</pre></div>'


def main():
    snippets = {lang: load_snippets(path, comment) for lang, (path, comment, _, _) in SOURCES.items()}

    def replace(match):
        name = match.group(1)
        py, js = snippets["py"].get(name), snippets["js"].get(name)
        if py is None or js is None:
            raise SystemExit(f"snippet '{name}' missing in python={py is not None} js={js is not None}")
        widest = max(len(line) for line in (py + "\n" + js).splitlines())
        cls = "pair" if widest <= SIDE_BY_SIDE_MAX else "stack"
        return f'<div class="{cls}">{card("py", py)}{card("js", js)}</div>'

    template = (HERE / "dsa-notes.template.html").read_text()
    out = re.sub(r"\[\[code:(\w+)\]\]", replace, template)
    (HERE / "dsa-notes.html").write_text(out)
    used = set(re.findall(r"\[\[code:(\w+)\]\]", template))
    unused = (set(snippets["py"]) | set(snippets["js"])) - used
    print(f"built dsa-notes.html with {len(used)} snippet pairs" + (f"; unused: {sorted(unused)}" if unused else ""))


if __name__ == "__main__":
    main()
