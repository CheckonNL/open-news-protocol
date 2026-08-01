#!/usr/bin/env python3
"""Build the ONP website's specification pages from specs/*.md.

The site is GENERATED from the specifications, never maintained
alongside them: a spec edit that is not reflected on the site is
impossible, and `--check` fails CI if the committed pages have drifted
from the sources.

Outputs docs/specs/<slug>.html for every specification plus
docs/specs/index.html grouped by series.
"""

import html
import re
import sys
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
SPECS = ROOT / "specs"
OUT = ROOT / "docs" / "specs"

SERIES = [
    ("0", "Foundation", "Mission, architecture, terminology, and the trust, security, "
                        "lifecycle and versioning models everything else rests on."),
    ("1", "Core", "What a News Object is, how it is named and serialized, how it is "
                  "signed, validated, and retrieved. Core alone decides authenticity."),
    ("2", "Companion", "Domain object models layered on Core: articles, media, identity, "
                       "rights, payments, sources, corrections, comments."),
    ("3", "Extension", "Additive claims attached to an object: AI metadata, search, "
                       "analytics, geolocation, accessibility."),
    ("9", "Reference", "Implementation guidance, best practices, security checklist, "
                       "performance, migration, and interoperability with existing standards."),
]

PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} — Open News Protocol</title>
<meta name="description" content="{descr}">
<link rel="icon" href="../assets/onp-mark.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/style.css">
</head>
<body>
<header class="masthead">
  <div class="wrap">
    <a class="brand" href="../">
      <img class="lockup" src="../assets/onp-lockup.png" alt="Open News Protocol">
      <img class="mark" src="../assets/onp-mark.png" alt="">
    </a>
    <nav>
      <a href="../#verify">Verify</a>
      <a href="../#how">How it works</a>
      <a href="./">Specifications</a>
      <a href="../#build">Implementations</a>
      <a href="https://github.com/CheckonNL/open-news-protocol">GitHub</a>
    </nav>
  </div>
</header>
<main class="wrap">
{body}
</main>
<footer class="site">
  <div class="wrap">
    <p style="margin:0">
      <a href="./">← All specifications</a> ·
      <a href="https://github.com/CheckonNL/open-news-protocol/blob/main/specs/{source}">Source on GitHub</a>
    </p>
    <p class="colophon">Apache 2.0. Working Draft — expect changes.</p>
  </div>
</footer>
</body>
</html>
"""


def parse_header(text):
    """Pull the front-matter fields every spec carries."""
    head = text[:600]
    out = {}
    for field in ("Title", "Document Number", "Status", "Version", "Last Modified"):
        m = re.search(rf"^{field}:\s*(.+)$", head, re.M)
        if m:
            out[field] = m.group(1).strip()
    return out


def body_after_header(text):
    """Everything after the front-matter block's closing rule."""
    m = re.search(r"^---\s*$", text, re.M)
    return text[m.end():] if m else text


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def render(path):
    raw = path.read_text(encoding="utf-8")
    meta = parse_header(raw)
    md = markdown.Markdown(extensions=["tables", "fenced_code", "sane_lists"])
    content = md.convert(body_after_header(raw))

    # Anchor every h1/h2 so the table of contents can link into the page.
    headings = []

    def anchor(m):
        level, inner = m.group(1), m.group(2)
        text = re.sub(r"<[^>]+>", "", inner)
        sid = slugify(text)
        if level == "1":
            headings.append((text, sid))
        return f'<h{level} id="{sid}">{inner}</h{level}>'

    content = re.sub(r"<h([12])>(.*?)</h\1>", anchor, content, flags=re.S)

    title = meta.get("Title", path.stem)
    number = meta.get("Document Number", "")
    toc = "".join(
        f'<li><a href="#{sid}">{html.escape(t)}</a></li>' for t, sid in headings
    )

    body = f"""<div class="doc-layout">
  <article class="prose">
    <p class="eyebrow">{html.escape(number)}</p>
    <h1 id="top">{html.escape(title)}</h1>
    <div class="doc-meta">
      <span class="status">{html.escape(meta.get('Status', ''))}</span>
      <span>Version {html.escape(meta.get('Version', ''))}</span>
      <span>Updated {html.escape(meta.get('Last Modified', ''))}</span>
    </div>
    {content}
  </article>
  <aside class="toc">
    <h4>On this page</h4>
    <ul>{toc}</ul>
  </aside>
</div>"""

    descr = f"{number}: {title} — part of the Open News Protocol specification series."
    return meta, PAGE.format(
        title=html.escape(f"{number} {title}"),
        descr=html.escape(descr),
        body=body,
        source=path.name,
    )


def build_index(entries):
    blocks = []
    for prefix, name, blurb in SERIES:
        rows = [e for e in entries if e["num"].split("-", 1)[-1].startswith(prefix)]
        if not rows:
            continue
        items = "".join(
            f'<a href="{e["slug"]}.html">'
            f'<span class="num">{html.escape(e["num"])}</span>'
            f'<span>{html.escape(e["title"])}</span>'
            f'<span class="ver">v{html.escape(e["version"])}</span></a>'
            for e in sorted(rows, key=lambda r: r["num"])
        )
        blocks.append(
            f'<div class="spec-series"><h2>{html.escape(name)}</h2>'
            f"<p>{html.escape(blurb)}</p>"
            f'<div class="spec-list">{items}</div></div>'
        )

    body = f"""<div style="padding:3rem 0 1rem;max-width:62ch">
  <p class="eyebrow">The standard</p>
  <h1>Specifications</h1>
  <p class="lede" style="margin-top:1.2rem">
    {len(entries)} documents. Each names the terms it owns, states its own version, and may
    not redefine anything another document already settled. Every one is a Working Draft.
  </p>
</div>
<div style="padding-bottom:4rem">{''.join(blocks)}</div>"""

    return PAGE.format(
        title="Specifications",
        descr="All Open News Protocol specifications: Foundation, Core, Companion, "
              "Extension and Reference series.",
        body=body,
        source="",
    ).replace(
        '<a href="https://github.com/CheckonNL/open-news-protocol/blob/main/specs/">Source on GitHub</a>',
        '<a href="https://github.com/CheckonNL/open-news-protocol/tree/main/specs">Sources on GitHub</a>',
    )


def main():
    check = "--check" in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    entries, changed = [], []

    for path in sorted(SPECS.glob("*.md")):
        meta, page = render(path)
        slug = path.stem
        entries.append({
            "num": meta.get("Document Number", slug),
            "title": meta.get("Title", slug).replace("Open News Protocol (ONP): ", ""),
            "version": meta.get("Version", "?"),
            "slug": slug,
        })
        target = OUT / f"{slug}.html"
        if not target.exists() or target.read_text(encoding="utf-8") != page:
            changed.append(target.name)
            if not check:
                target.write_text(page, encoding="utf-8")

    index = build_index(entries)
    target = OUT / "index.html"
    if not target.exists() or target.read_text(encoding="utf-8") != index:
        changed.append("index.html")
        if not check:
            target.write_text(index, encoding="utf-8")

    if check and changed:
        print("build-site: site is out of date with specs/ — run tools/build-site.py")
        for name in changed:
            print(f"  stale  {name}")
        return 1

    print(f"build-site: {len(entries)} specification pages + index "
          f"({'up to date' if not changed else str(len(changed)) + ' written'})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
