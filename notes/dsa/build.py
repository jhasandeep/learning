"""Build the DSA notes HTML (typed + handwritten themes) from the template.

Placeholders `[[code:name]]` in the template become a Python + JavaScript
pair taken from exercises/dsa/{python/dsa.py, javascript/dsa.js}. Pairs whose
lines are short sit side by side; longer ones are stacked. The handwritten
theme layers handwritten.css on top of the template's styles.

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


THEMES = {
    # output file, widest side-by-side line, extra stylesheet
    "typed": ("dsa-notes.html", SIDE_BY_SIDE_MAX, None),
    "handwritten": ("dsa-notes-handwritten.html", 44, "handwritten.css"),
}


def unalign_comments(code):
    """Handwriting isn't monospace, so column-aligned trailing comments look ragged."""
    return re.sub(r"(?m)(\S) {2,}(#|//)", r"\1  \2", code)


def build(theme, snippets, template):
    out_name, side_max, css = THEMES[theme]

    def replace(match):
        name = match.group(1)
        py, js = snippets["py"].get(name), snippets["js"].get(name)
        if py is None or js is None:
            raise SystemExit(f"snippet '{name}' missing in python={py is not None} js={js is not None}")
        if css:
            py, js = unalign_comments(py), unalign_comments(js)
        widest = max(len(line) for line in (py + "\n" + js).splitlines())
        cls = "pair" if widest <= side_max else "stack"
        return f'<div class="{cls}">{card("py", py)}{card("js", js)}</div>'

    out = re.sub(r"\[\[code:(\w+)\]\]", replace, template)
    if css:
        out = out.replace("</head>", f"<style>\n{(HERE / css).read_text()}</style>\n</head>", 1)
    (HERE / out_name).write_text(out)
    return out_name


def main():
    snippets = {lang: load_snippets(path, comment) for lang, (path, comment, _, _) in SOURCES.items()}
    template = (HERE / "dsa-notes.template.html").read_text()
    used = set(re.findall(r"\[\[code:(\w+)\]\]", template))
    unused = (set(snippets["py"]) | set(snippets["js"])) - used
    for theme in THEMES:
        print(f"built {build(theme, snippets, template)} with {len(used)} snippet pairs")
    if unused:
        print(f"unused snippets: {sorted(unused)}")

if __name__ == "__main__":
    main()
