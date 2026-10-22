#!/usr/bin/env python3
"""Comprovacions sense dependències per als materials de la Unitat 0."""
import html
from html.parser import HTMLParser
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT.parents[1]
ANNEX = ROOT
PAGES = [ANNEX / "index.html"] + [ANNEX / f"bloc-{n}" / "index.html" for n in range(1, 5)]

class FigureParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = []
    def handle_starttag(self, tag, attrs):
        if tag == "img":
            self.images.append(dict(attrs))

def assert_ok(condition, label):
    if not condition:
        raise AssertionError(label)
    print("OK:", label)

def example(page, filename):
    pattern = rf'<span class="code-filename">{re.escape(filename)}</span>.*?<code class="language-csharp">(.*?)</code>'
    match = re.search(pattern, page, re.DOTALL)
    assert_ok(match is not None, "Codi del fitxer " + filename + " documentat")
    return html.unescape(match.group(1)).strip()

assert_ok(all(page.exists() for page in PAGES), "Portada i quatre blocs disponibles")
home = (SITE / "index.html").read_text(encoding="utf-8")
assert_ok("Unitat 0" in home and home.index('Unitat 0') < home.index('<span class="unit-number">Unitat 1</span>'),
          "La Unitat 0 es mostra abans de la Unitat 1")
for page in PAGES:
    contents = page.read_text(encoding="utf-8")
    assert_ok(contents.count("<article") == 1 and contents.count("</article>") == 1,
              "Article principal únic: " + page.parent.name)
    assert_ok("<html" in contents and "</html>" in contents, "HTML amb estructura: " + page.parent.name)
    figs = FigureParser()
    figs.feed(contents)
    assert_ok(bool(figs.images), "Inclou figures: " + page.parent.name)
    for img in figs.images:
        assert_ok(bool(img.get("alt", "").strip()), "Text alternatiu: " + img.get("src", "?"))
        src = img.get("src", "")
        if src.startswith("/ioc/dam_0488/"):
            target = SITE / src.removeprefix("/ioc/dam_0488/")
            assert_ok(target.exists(), "Imatge local existent: " + src)
    copy_buttons = contents.count('class="copy-btn"')
    blocks = contents.count('class="code-block"')
    assert_ok(copy_buttons == blocks, "Un botó de còpia per fragment de codi: " + page.parent.name)

source = (ANNEX / "bloc-4" / "index.html").read_text(encoding="utf-8")
for name in ("Producte.cs", "GestorProductes.cs", "Form1.cs"):
    file_path = ANNEX / "exemples" / "MiniCataleg" / name
    assert_ok(example(source, name) == file_path.read_text(encoding="utf-8").strip(),
              "L'exemple descarregable coincideix amb el del material: " + name)

for svg in (SITE / "assets" / "img" / "annex-csharp").glob("*.svg"):
    ET.parse(svg)
    assert_ok(svg.read_text(encoding="utf-8").count("<title") >= 1,
              "SVG accessible i correcte: " + svg.name)
print("TOTES LES COMPROVACIONS HAN PASSAT")
