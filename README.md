# Open News Protocol (ONP)

**An open standard for publishing, exchanging, verifying, and
monetizing news objects.**

News today is locked inside publisher-specific CMS platforms and
distributed through channels — RSS, ad-hoc APIs, social feeds — that
were never designed to carry cryptographic provenance, structured
rights, or payment terms. ONP makes the news article itself, not the
platform that happens to host it, the unit of trust, distribution,
rights, and payment.

> Read the full problem statement, mission, and four pillars in
> [`specs/0000-introduction.md`](specs/0000-introduction.md).

---

## Start here

If you read nothing else, read these two documents in order:

1. [`specs/0000-introduction.md`](specs/0000-introduction.md) — why
   ONP exists, the four pillars, and the roadmap for every other
   document in this repository.
2. [`specs/0001-architecture.md`](specs/0001-architecture.md) — the
   Core / Companion / Extension layering every later specification
   builds on.

## What's published so far

**The original roadmap ONP-0000 laid out is complete: 34 specifications
across all five series, plus three documents published beyond that
roadmap — ONP-1006 (Retrieval, an extending Core document added via a
recorded roadmap extension in ONP-0000 v0.4.0), ONP-9005 (External
Standards Interoperability), and ONP-2900 (Endorsement, a
cross-publisher Companion) — 37 in total.** What
that does, and does not, mean in practice is stated plainly in
[`specs/9004-migration.md`](specs/9004-migration.md) Appendix B — the
specification text is done. A real, working, tested TypeScript
implementation is **published on npm as
[`open-news-protocol`](https://www.npmjs.com/package/open-news-protocol)**
(`sdk/reference-impl/`): it covers ONP-1000 through ONP-1004, Trust
Anchor resolution (ONP-0004), and Retrieval (ONP-1006); signs and
verifies with both Ed25519 and ECDSA-P256 (the eIDAS curve, ratified in
ONP-1003 Appendix C); carries a provisional, additive `eudi`
corroboration hook (ONP-0004 Section 4.6); and adds a consumer-Node
aggregator that assembles a verified multi-publisher timeline, an `onp`
CLI, export bridges to schema.org/NewsArticle and RSS 2.0 (ONP-9005),
and genuine computed Test Vectors. A separate, language-agnostic
conformance suite (`conformance/`) lets a third party certify their own
implementation against the spec without importing any reference code. A
second, independent implementation in PHP ships as a WordPress plugin
(`implementations/wordpress/`), and continuous integration verifies
that both produce identical bytes from the same document and accept
each other's signatures. What has *not* happened yet: no specification
has been through external review, no third party has implemented
against the text alone, and the human governance process described in
`CHARTER.md` has not been exercised by a real Working Group. Several
acknowledged gaps remain open by design rather than glossed over: the
`eudi` Trust Anchor Type (an additive, warning-only corroboration hook
exists in the SDK, but its binding is not yet ratified and there is no
real wallet verifier), cross-publisher identity, a true Analytics
Attestation Companion, and deep C2PA integration (reserved as ONP-3600,
not yet written).

| Series | Range | Status |
|---|---|---|
| Foundation | `0000`-`0007` | Complete — principles, terminology, trust, security, lifecycle, versioning |
| Core | `1000`-`1006` | Complete — the News Object envelope, identifiers, serialization, signatures, validation, metadata, plus Retrieval (ONP-1006, added via ONP-0000 v0.4.0's roadmap extension) |
| Companion | `2000`-`2800` (+ `2900`) | Complete — framework plus Article, Media, Identity, Rights, Payments, Sources, Corrections, Comments, plus Endorsement (ONP-2900, cross-publisher, added beyond the original roadmap) |
| Extension | `3000`-`3500` | Complete — framework plus AI Metadata, Search, Analytics, Geolocation, Accessibility |
| Reference | `9000`-`9004` (+ `9005`) | Complete — Reference Implementation, Best Practices, Security Checklist, Performance, Migration, plus External Standards Interoperability |

A Node implementing only `specs/1000` through `specs/1006` can
already fully create, sign, retrieve, and verify a News Object end to end,
independent of any Companion or Extension support. See
[`specs/1003-digital-signatures.md`](specs/1003-digital-signatures.md)
Section 6.1 for the complete pipeline.

## Repository layout

```
specs/       Numbered specifications (this is the standard itself)
schemas/     JSON Schema (2020-12) definitions: News Object envelope,
             Publisher Key Record (structural layer only)
tools/       check-specs.py — spec lint run in CI: headers,
             terminology single-source, registry sync
             build-site.py — generates the website's specification
             pages from specs/*.md; CI fails if they drift
docs/        The public website (GitHub Pages), including an
             in-browser verifier that runs the real ONP-1003
             pipeline on an editable signed object
examples/    Standalone example News Objects (not yet populated)
diagrams/    Hand-drawn SVG diagrams (no build step, no external
             fonts): layer-model, verification-pipeline, version-chain
sdk/         Reference SDK / client libraries
  reference-impl/  A working TypeScript implementation of ONP-1000
                    through ONP-1004, plus Trust Anchor resolution
                    (ONP-0004) and Retrieval (ONP-1006), with a real
                    test suite and real, computed Test Vectors. See
                    its own README for exact scope and limitations.
reference/   Pointer to sdk/reference-impl/; ONP-9000 series notes
implementations/
  wordpress/onp-connector/  WordPress plugin: signs posts as News
             Objects, serves publisher.json (ONP-0004) and Object/
             Version URLs with VID-as-ETag (ONP-1006), carries
             <onp:object> in the feed. PHP is the second independent
             implementation, incl. its own RFC 8785/JCS serializer;
             CI cross-verifies it against the TypeScript SDK in both
             directions.
conformance/ Language-agnostic Core conformance suite: pure-data
             vectors (produce / verify / verify_trust) plus a
             reference runner. A third party can certify their own
             implementation against vectors.json without importing any
             reference code; CI dogfoods the reference SDK against it.
```

`schemas/` now contains JSON Schema (2020-12) definitions for the
News Object envelope (ONP-1000/1001/1003) and the Publisher Key
Record (ONP-0004) — structural checks only; the specification text
remains authoritative, and VID/signature/Trust-Anchor verification
is runtime behavior a schema cannot express. The SDK test suite
validates its own output and every published test vector against
these schemas, and `.github/workflows/ci.yml` runs that suite plus
`tools/check-specs.py` (header completeness, the terminology
single-source rule, and registry sync) on every push.

`diagrams/` holds three hand-drawn SVG diagrams — the layer model, the
verification pipeline, and the version chain — used on the website and
in this README's sibling documents. The ASCII diagrams inside the
specifications stay as they are: a specification has to be readable as
plain text, without fetching anything.

`examples/` is still empty; the Test Vectors in
`sdk/reference-impl/examples/test-vectors.json` currently serve that
purpose. `sdk/reference-impl/` is real, working code that goes beyond
the minimum scope ONP-9000 Section 4.1 requires; see its own README for
exactly what it does and does not cover.

## Document conventions

Every specification other than `0000-introduction.md` follows one
fixed template (defined in `specs/0000-introduction.md` Section 3.2):
`Title`, `Document Number`, `Status`, `Version`, `Author`,
`Last Modified`, `Abstract`, `Status of This Document`,
`Normative Language`, then ten numbered sections from Introduction
through References, followed by lettered appendices.

Filenames follow `specs/NNNN-slug.md`; in running text, documents are
cited by their number alone (`ONP-1003`), per
`specs/0000-introduction.md` Section 3.1.

Every term used across the series has exactly one owning document,
indexed in [`specs/0002-terminology.md`](specs/0002-terminology.md).
If you're unsure what a capitalized term means, that document is the
canonical index — check it before assuming a definition.

## Status levels

| Status | Meaning |
|---|---|
| Working Draft | Under active development; may change incompatibly |
| Candidate | Feature-complete; open for implementation feedback |
| Standards Track | Stable; changes follow `specs/0007-versioning-policy.md` |
| Informational | Non-normative |
| Obsolete | Superseded; retained for historical reference |

Every specification currently in this repository is a **Working
Draft**. See [`specs/0007-versioning-policy.md`](specs/0007-versioning-policy.md)
for exactly what that implies about stability guarantees.

## Origins

ONP began at [regiopurmerend.nl](https://regiopurmerend.nl), a
hyperlocal news site in Purmerend, the Netherlands, out of a problem
that kept recurring: an article that leaves the site it was published
on loses everything that made it trustworthy. The byline, the
corrections, the terms under which it may be reused — all of it stays
behind, while the text travels on into feeds, screenshots and AI
summaries.

The commit history here starts partway through that story. The
thinking, the earlier drafts, and a first attempt at the same problem
in a different shape all predate the first commit; what is
version-controlled in this repository is the write-up, not the idea.

It is deliberately not a standard designed for large publishers first.
A protocol that only works with a platform team behind it would
rebuild the very dependency it is meant to remove. If it works for a
one-person newsroom, it works for everything above that.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for how to propose a change,
and [`CHARTER.md`](CHARTER.md) for how the Working Group is organized
and how decisions get made. All participants are expected to follow
[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## License

Specification text in `specs/` is licensed under
[Creative Commons Attribution 4.0 International (CC BY 4.0)](LICENSE).
Code in `sdk/` and `implementations/` carries its own, separate
license — the reference SDK is
[Apache-2.0](sdk/reference-impl/LICENSE) — since code and normative
specification text are not the same kind of artifact and are not
expected to share a license by default.

## EU policy alignment

If you're evaluating ONP against the European Open Internet Stack
initiative or similar sovereignty-and-trust-focused programs, see
[`EU-ALIGNMENT.md`](EU-ALIGNMENT.md) for an honest, non-normative
assessment of fit and current maturity.
