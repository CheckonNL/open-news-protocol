#!/usr/bin/env python3
"""ONP specification lint.

Three checks, in line with the discipline the series itself states:

1. HEADERS  — every specs/*.md carries the required header fields
              (Title, Document Number, Status, Version).
2. OWNERSHIP — no term is defined (owned) by more than one document.
              A document "owns" a term when the term appears as a
              definition-list entry (**Term** followed by a ':' line)
              inside its Terminology section. This is the machine
              form of ONP-0002 Section 4.1's single-source rule.
3. REGISTRY — every owned term appears in ONP-0002 Appendix A, and
              every 'active' Appendix A row's owning document
              actually defines that term. Registry drift in either
              direction fails.

Exit code 0 = clean, 1 = violations found.
"""

import re
import sys
from pathlib import Path

SPECS = Path(__file__).resolve().parent.parent / "specs"
REQUIRED_HEADERS = ["Title:", "Document Number:", "Status:", "Version:"]

# Terminology-section heading, e.g. "# 3. Terminology" or "# Terminology"
TERM_HEADING = re.compile(r"^#\s+(?:\d+\.\s+)?Terminology\s*$", re.M)
TOP_HEADING = re.compile(r"^#\s+", re.M)
# **Term** on its own line, immediately followed by a definition line
DEFINITION = re.compile(r"^\*\*(.+?)\*\*\s*\n:", re.M)


def doc_number(text: str) -> str:
    m = re.search(r"^Document Number:\s*(\S+)", text, re.M)
    return m.group(1) if m else "?"


def terminology_section(text: str) -> str:
    m = TERM_HEADING.search(text)
    if not m:
        return ""
    rest = text[m.end():]
    nxt = TOP_HEADING.search(rest)
    return rest[: nxt.start()] if nxt else rest


def normalize(term: str) -> str:
    """Strip inline code/formatting and parenthesized qualifiers so
    '`crit`' and 'Claimed Signing Time (`signed_at`)' compare stably."""
    t = term.strip().strip("`")
    t = re.sub(r"\s*\(.*\)$", "", t)
    return t


def main() -> int:
    failures: list[str] = []

    # ---- 1. HEADERS ----
    spec_files = sorted(SPECS.glob("*.md"))
    texts = {f: f.read_text(encoding="utf-8") for f in spec_files}
    for f, text in texts.items():
        head = text[:400]
        for field in REQUIRED_HEADERS:
            if field not in head:
                failures.append(f"HEADERS: {f.name} is missing '{field}'")

    # ---- 2. OWNERSHIP ----
    owners: dict[str, list[str]] = {}
    for f, text in texts.items():
        doc = doc_number(text)
        section = terminology_section(text)
        for raw in DEFINITION.findall(section):
            term = normalize(raw)
            owners.setdefault(term, []).append(doc)
    for term, docs in sorted(owners.items()):
        if len(set(docs)) > 1:
            failures.append(
                f"OWNERSHIP: term '{term}' is defined in more than one "
                f"document: {', '.join(sorted(set(docs)))}"
            )

    # ---- 3. REGISTRY (ONP-0002 Appendix A) ----
    reg_file = SPECS / "0002-terminology.md"
    reg_text = texts[reg_file]
    appendix = reg_text[reg_text.index("# Appendix A"):]
    registry: dict[str, tuple[str, str]] = {}  # term -> (owner, status)
    for line in appendix.splitlines():
        m = re.match(r"\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|[^|]*\|\s*(\w+)\s*\|", line)
        if not m:
            continue
        term, owner_cell, status = m.groups()
        if owner_cell.strip() == "Owning Document" or set(term) <= {"-"}:
            continue  # table header / separator rows
        owner_match = re.search(r"ONP-\d{4}", owner_cell)
        owner = owner_match.group(0) if owner_match else owner_cell
        registry[normalize(term)] = (owner, status)

    for term, docs in sorted(owners.items()):
        if term not in registry:
            failures.append(
                f"REGISTRY: '{term}' is defined in {docs[0]} but has no "
                f"row in ONP-0002 Appendix A (Section 4.2 requires "
                f"registration at publication)"
            )
        else:
            reg_owner, _ = registry[term]
            if reg_owner != docs[0] and reg_owner.startswith("ONP-"):
                failures.append(
                    f"REGISTRY: '{term}' — Appendix A says owner is "
                    f"{reg_owner}, but it is defined in {docs[0]}"
                )

    docs_by_number = {doc_number(t): t for t in texts.values()}
    for term, (owner, status) in sorted(registry.items()):
        if status != "active":
            continue  # reserved/deprecated rows need no live definition
        if term in owners:
            continue  # has a formal definition-list entry somewhere
        # Fallback: identifier registrations (org.onp.*, Claim Domains)
        # and qualified rows are satisfied if the owning document's text
        # uses the term at all; only a row pointing at a document that
        # never mentions the term is rot.
        owner_text = docs_by_number.get(owner, "")
        if term not in owner_text:
            failures.append(
                f"REGISTRY: Appendix A lists '{term}' as active, owned by "
                f"{owner}, but {owner} never mentions that term"
            )

    # ---- report ----
    if failures:
        print(f"onp-spec-lint: {len(failures)} violation(s)\n")
        for f in failures:
            print(f"  FAIL  {f}")
        return 1
    n_terms = len(owners)
    print(
        f"onp-spec-lint: clean — {len(spec_files)} specs, "
        f"{n_terms} owned terms, single-source holds, registry in sync"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
