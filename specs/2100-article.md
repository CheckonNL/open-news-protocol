Title: Open News Protocol (ONP): Article
Document Number: ONP-2100
Status: Working Draft
Version: 0.6.1
Author: Open News Protocol Working Group
Last Modified: 2026-08-01

---

# Abstract

This document defines the Article Companion:
`content_type = "onp:companion:article"`. It is the first concrete
content model published in the ONP series — every prior document
built the infrastructure this one finally uses for its intended
purpose. An Article Object embeds its full text (as a constrained,
safe Markdown subset) directly within the signed envelope, so that
the same signature protecting `oid`, `vid`, and `publisher` also
protects the actual words a reader, an archive, or an AI system
receives — not merely a link to them. This document defines the
Article content schema, its relationship to Core Metadata
(ONP-1005), and the security requirement that forbids raw HTML in
article bodies.

---

# Status of This Document

This document is part of the ONP Companion series (ONP-2000-2999).
It is directly implementable and follows every mandatory addition
ONP-2000 Section 4.2 requires of a Companion specification. It is a
Working Draft.

**Change note (v0.6.1):** Section 4.7 described ONP-2200 (Media) as
not yet published; ONP-2200 has since been published. Corrected.
Classified PATCH under ONP-0007 Section 4.2, rule 3: editorial only.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

"An Article is published, corrected, retracted, and archived
independently of any other Object" — ONP-0001 Section 7.1 already
used Article as its worked example of a Companion with independent
identity and lifecycle, before this document existed to back that
claim up. This document is where that claim becomes real: a
publisher can now produce a single, signed News Object that a Node
anywhere can verify as authentically theirs, unmodified since
signing, carrying the actual article text rather than a pointer to a
page that could change without anyone noticing.

---

# 2. Scope

## 2.1 In Scope

* the `onp:companion:article` content schema: `headline`, `body`,
  and the OPTIONAL fields `dek`, `byline`, `section`,
  `canonical_url`, `media_refs`;
* the constrained, safe Markdown subset `body` MUST use, and the
  rendering-time sanitization requirement;
* the precedence relationship between `headline` and
  `onp:metadata.title`.

## 2.2 Out of Scope

This document does NOT define:

* cryptographically verified authorship — `byline` (Section 4.6) is
  a provisional, plain-string mechanism pending ONP-2300 (Identity);
* structured, formal correction records — those belong to ONP-2700
  (Corrections), which will reference an Article's OID rather than
  the reverse;
* media file handling, formats, or storage — owned by ONP-2200
  (Media); this document only defines how an Article *references* a
  Media Object (Section 4.7);
* any rendering engine's specific implementation, beyond the
  sanitization requirement Section 4.4 imposes.

---

# 3. Terminology

This document is the owning specification for the following terms.

**Article Object**
: An informal name for a News Object whose `content_type` is
  `onp:companion:article`. Not a distinct wire-level concept from
  News Object (ONP-1000); every Article Object is a News Object.

**Safe Markdown Subset**
: The constrained Markdown grammar `body` MUST use: CommonMark
  syntax with raw HTML blocks and inline HTML both disallowed
  (Section 4.4; Appendix B).

---

# 4. Requirements

## 4.1 content_type Declaration

Every Article Object MUST declare `content_type` as exactly
`onp:companion:article`.

## 4.2 Companion-vs-Extension Reapplication

Per ONP-2000 Section 4.2, rule 2, the decision test (ONP-0001
Section 4.4) is reapplied here explicitly:

```
Does "Article" have independent identity and an independent
lifecycle, separable from any other Object?

- An Article is created, corrected (new Version, ONP-0006),
  retracted, and archived entirely on its own — it does not require
  any other Object to exist first, and its lifecycle events do not
  depend on any other Object's lifecycle.
- YES -> Companion.
```

This confirms, with the test actually shown rather than merely
asserted, the classification ONP-0001 Section 7.1 already used as
its worked example.

## 4.3 Content Schema

1. `headline` is REQUIRED: a string, the Article's editorial
   headline.
2. `body` is REQUIRED: a string in the Safe Markdown Subset
   (Section 4.4), the Article's full text.
3. `dek`, `byline`, `section`, `canonical_url`, and `media_refs` are
   OPTIONAL, per Sections 4.6-4.8.

## 4.4 Body Format — Safe Markdown Subset

1. `body` MUST be valid CommonMark with raw HTML blocks and inline
   HTML both disallowed. A publisher MUST NOT include raw HTML
   anywhere in `body`.
2. A Node rendering `body` to HTML MUST use a sanitizing renderer
   that strips any HTML found in `body` rather than passing it
   through, even though rule 1 already forbids publishers from
   including it. This is a deliberate defense-in-depth requirement:
   a Node MUST NOT trust that every publisher's tooling correctly
   enforces rule 1, for the same reason Core validation never trusts
   an unverified claim anywhere else in this series (Section 8.1).
3. See Appendix B for the precise grammar boundary.

## 4.5 Headline / `onp:metadata.title` Precedence

Per ONP-1005 Section 4.3, an Article-aware Node MUST use
`content.headline` for display, never `onp:metadata.title`.
`onp:metadata.title`, if present, remains available only for Nodes
that do not implement this Companion (ONP-1005 Section 6.1).

## 4.6 Byline (Provisional) and Contributor References

1. `byline`, if present, MUST be an array of plain display-name
   strings.
2. A Node MUST NOT treat `byline` as cryptographically verified
   authorship; it is a provisional, publisher-asserted convenience
   field, not an identity claim backed by any signature beyond the
   Article Object's own.
3. `contributor_refs`, if present, MUST be an array of Object
   References (ONP-2000 Section 4.3), each an OID identifying an
   Identity Object (ONP-2300). Where both `contributor_refs` and
   `byline` are present, an Identity-aware Node MUST prefer
   `contributor_refs`; a Node without Identity Companion support
   MUST continue to fall back to `byline`, for backward
   compatibility. This fulfills the upgrade path promised in
   version 0.1.0 of this document, now that ONP-2300 defines what
   `contributor_refs` points to.

## 4.7 Media References

1. `media_refs`, if present, MUST be an array of Object References
   (ONP-2000 Section 4.3), each an OID string identifying a Media
   Companion Object (ONP-2200).
2. Order within `media_refs` MAY be semantically significant (for
   example, a publisher's own convention that the first entry is a
   lead image); this document does not mandate any such convention.
   A publisher using an ordering convention SHOULD document it
   separately; this document neither requires nor forbids one.
3. Per ONP-2000 Section 4.4, an unreachable or invalid entry in
   `media_refs` MUST NOT affect this Article Object's own Core
   validity.

## 4.8 Canonical URL

1. `canonical_url`, if present, MUST be a well-formed URI pointing
   to the publisher's own rendered, human-readable page for this
   Article.
2. A Node MUST NOT treat `canonical_url` as the source of truth for
   Article content. `body` is authoritative and signed;
   `canonical_url` is a convenience pointer only, consistent with
   Principle P1 (Adjacent Publishing, ONP-0003) — the Article Object
   exists alongside the publisher's website, not as its replacement.

## 4.9 Rights Reference

`rights_ref`, if present, MUST be a single Object Reference
(ONP-2000 Section 4.3): an OID identifying a Rights Object (ONP-2400).
Its absence establishes no default assumption about usage terms
(ONP-2400 Section 6.2); this document does not require every Article
to carry one.

## 4.10 Payment Reference

`payment_ref`, if present, MUST be a single Object Reference
(ONP-2000 Section 4.3): an OID identifying a Payments Object
(ONP-2500). Its absence does not imply the Article is free; ONP-2500
establishes no default payment assumption, consistent with the
jurisdiction- and settlement-neutral posture that document maintains.

## 4.11 Source References

`source_refs`, if present, MUST be an array of Object References
(ONP-2000 Section 4.3), each an OID identifying a Source Object
(ONP-2600). Per that document's own guidance, not every source an
Article relies on needs a corresponding Source Object — ONP-2600
Section 4.6 explicitly recommends against creating one at all for
the most sensitive, protection-critical cases.

## 4.12 Corrections Reference (Discovery Convenience Only)

`corrections_ref`, if present, MUST be an array of OID strings, each
identifying a Corrections Object (ONP-2700). Unlike every other
reference field in this document, `corrections_ref` is NOT the
authoritative source of the relationship it describes — per ONP-2700
Section 4.6, a Corrections Object's own `subject_oid`,
`corrected_vid`, and `correcting_vid` fields are authoritative
regardless of whether this field is present. `corrections_ref` exists
purely so a publisher MAY make its own corrections easier to discover
when it happens to be issuing a new Version anyway; its absence MUST
NOT be read as meaning no corrections exist.

---

# 5. Object Model

```json
{
  "content_type": "onp:companion:article",
  "content": {
    "headline": "string, REQUIRED",
    "dek": "string, OPTIONAL",
    "body": "string, REQUIRED — Safe Markdown Subset (Section 4.4)",
    "byline": ["string", "..."],
    "contributor_refs": ["onp:oid:...", "..."],
    "section": "string, OPTIONAL",
    "canonical_url": "string, OPTIONAL — well-formed URI",
    "media_refs": ["onp:oid:...", "..."],
    "rights_ref": "onp:oid:...",
    "payment_ref": "onp:oid:...",
    "source_refs": ["onp:oid:...", "..."],
    "corrections_ref": ["onp:oid:...", "..."]
  }
}
```

| Field | Required | Type | Notes |
|---|---|---|---|
| `headline` | REQUIRED | string | Takes precedence over `onp:metadata.title` (Section 4.5) |
| `body` | REQUIRED | string | Safe Markdown Subset only (Section 4.4) |
| `dek` | OPTIONAL | string | Standfirst / subtitle |
| `byline` | OPTIONAL | array of strings | Provisional fallback; see Section 4.6 |
| `contributor_refs` | OPTIONAL | array of OID strings | Object References to Identity Objects (ONP-2300); preferred over `byline` (Section 4.6) |
| `section` | OPTIONAL | string | Publisher-defined editorial section |
| `canonical_url` | OPTIONAL | string (URI) | Convenience pointer only (Section 4.8) |
| `media_refs` | OPTIONAL | array of OID strings | Object References to Media Objects (Section 4.7) |
| `rights_ref` | OPTIONAL | OID string | Object Reference to a Rights Object (ONP-2400, Section 4.9) |
| `payment_ref` | OPTIONAL | OID string | Object Reference to a Payments Object (ONP-2500, Section 4.10) |
| `source_refs` | OPTIONAL | array of OID strings | Object References to Source Objects (ONP-2600, Section 4.11) |
| `corrections_ref` | OPTIONAL | array of OID strings | Discovery convenience only, never authoritative (ONP-2700, Section 4.12) |

---

# 6. Processing Model

## 6.1 Rendering Procedure

```
1. Confirm Core validation passed (ONP-1004) — a Node MUST NOT
   render body from a non-Core-authenticated Object.
2. Confirm companion_valid = true for this Object (ONP-1004
   Section 4.3) against this document's schema.
3. Render headline for display (never onp:metadata.title, per
   Section 4.5).
4. Render body through a sanitizing Markdown renderer (Section 4.4,
   rule 2), stripping any embedded HTML regardless of whether the
   publisher complied with rule 1.
5. Optionally resolve media_refs (ONP-2000 Section 6.2) if the Node
   also implements the Media Companion.
```

## 6.2 Interoperability

This is the first document in the series where the full
interoperability story pays off concretely: a Node with no Article
support still gets a usable fallback via `onp:metadata` (ONP-1005
Section 6.1) if the publisher included it; a Node that implements
this Companion gets the complete, signed, tamper-evident article
text. Neither Node's behavior is wrong — each does exactly what its
level of implementation entitles it to do, exactly as every prior
Core and Companion Framework document promised in the abstract.

---

# 7. Examples

## 7.1 A Complete Article Object

```json
{
  "oid": "onp:oid:regiopurmerend.nl:fusie-onderzoek-necker-van-naem",
  "vid": "onp:vid:sha-256:AbC123-example-digest-bytes",
  "publisher": {
    "domain": "regiopurmerend.nl",
    "key_id": "onp:key:2026-07-01"
  },
  "signed_at": "2026-07-28T10:00:00Z",
  "signature": "onp:sig:ed25519:base64url-signature-bytes",
  "content_type": "onp:companion:article",
  "content": {
    "headline": "Fusie-onderzoek Purmerend gepubliceerd",
    "dek": "Necker van Naem publiceert budgetanalyse voor de voorgestelde fusie.",
    "body": "Purmerend - Het langverwachte onderzoek naar de financiële gevolgen van een fusie tussen Purmerend, Landsmeer, Wormerland en Oostzaan is vandaag gepubliceerd...\n\n## Belangrijkste bevindingen\n\n- Bevinding een\n- Bevinding twee",
    "byline": ["Redactie RegioPurmerend"],
    "contributor_refs": ["onp:oid:regiopurmerend.nl:redactie"],
    "section": "Politiek",
    "canonical_url": "https://regiopurmerend.nl/artikel/fusie-onderzoek",
    "media_refs": ["onp:oid:regiopurmerend.nl:foto-fusie-bijeenkomst-01"],
    "rights_ref": "onp:oid:regiopurmerend.nl:rights-cc-by-standaard",
    "payment_ref": "onp:oid:regiopurmerend.nl:payments-fusie-onderzoek",
    "source_refs": ["onp:oid:regiopurmerend.nl:wethouder-devries"]
  },
  "onp:metadata": {
    "language": "nl-NL",
    "title": "Fusie-onderzoek Purmerend gepubliceerd",
    "tags": ["purmerend", "fusie", "gemeentefinanciën"]
  }
}
```

Note `onp:metadata.title` and `content.headline` are identical here
by publisher choice, not by requirement — they are permitted to
differ (Section 4.5), and an Article-aware Node always uses
`content.headline` regardless.

## 7.2 Rejected: Raw HTML in Body

```
body: "Purmerend - Belangrijk nieuws.<script>alert(1)</script>"

REJECTED per Section 4.4, rule 1 at publication time; if a Node
nonetheless receives such a body (e.g. from a non-conformant
publisher), it MUST strip the HTML at render time per rule 2,
rather than passing it through.
```

---

# 8. Security Considerations

## 8.1 The Sanitization Requirement Is Defense in Depth, Not
     Redundant

Section 4.4's two rules exist at different trust boundaries: rule 1
constrains what a conformant publisher produces; rule 2 constrains
what a conformant Node accepts, regardless of publisher compliance.
This mirrors the pattern used throughout this series — a Node never
extends trust based solely on a specification's prohibition; it
independently enforces the property that prohibition exists to
protect (compare: ONP-1003 Section 4.5's algorithm cross-check,
which similarly does not merely trust a declared value but verifies
it against an independent source). Here, the property is "no
injectable markup," and the independent enforcement is
render-time sanitization.

## 8.2 Embedding Full Text Increases the Signed Surface, by Design

Because `body` is embedded rather than referenced, the entire
article text participates in the signing pre-image (ONP-1003 Section
4.1) and is therefore tamper-evident in full. This is a deliberate
design choice: a `canonical_url`-only approach would leave the
actual words unprotected by the signature, defeating much of the
purpose of a verifiable news object. The tradeoff is Object size,
which this document accepts as reasonable for typical article
lengths.

---

# 9. Privacy Considerations

`byline` names and any personal information appearing within `body`
(subjects of reporting, quoted individuals) are, by the nature of
journalism, often personal data, and are frequently subject to
national press and data-protection law that varies by jurisdiction.
Consistent with Principle P5 (Jurisdiction Neutrality, ONP-0003),
this document does not attempt to encode any jurisdiction's legal
requirements for handling such content; that responsibility remains
entirely with the publisher, exactly as it does for their existing
website today. ONP's contribution is limited to making whatever
content a publisher chooses to sign tamper-evident, not to judging
its legal compliance.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0001, Architecture — Section 7.1, the worked Article example
  this document fulfills; Section 4.4, the decision test reapplied
  in Section 4.2.
* ONP-0003, Design Principles — Principle P1 (Adjacent Publishing,
  Section 4.8), Principle P2 (Minimal Required Surface, Section 4.3),
  Principle P5 (Jurisdiction Neutrality, Section 9).
* ONP-1000, News Object — the `content_type`/`content` mechanism
  this Companion instantiates.
* ONP-1002, Serialization — `body`'s full participation in
  canonicalization and the signing pre-image (Section 8.2).
* ONP-1005, Core Metadata — Section 4.3, the precedence rule
  Section 4.5 of this document applies concretely.
* ONP-2000, Companion Framework — Section 4.1 (namespace
  registration), Section 4.2 (mandatory additions, followed
  throughout this document), Section 4.3 (Object Reference
  mechanism, used for `media_refs` and `contributor_refs`).
* ONP-2300, Identity — Section 4.4, the publisher-asserted trust
  model `contributor_refs` (Section 4.6) points to.
* ONP-2400, Rights — the Companion `rights_ref` (Section 4.9)
  points to.
* ONP-2500, Payments — the Companion `payment_ref` (Section 4.10)
  points to.
* ONP-2600, Sources — the Companion `source_refs` (Section 4.11)
  points to.
* ONP-2700, Corrections — the Companion `corrections_ref` (Section
  4.12) points to, discovery convenience only (not authoritative).

## 10.2 Informative References

* ONP-2200, Media (forward reference — the Companion `media_refs`
  entries are expected to identify).
* CommonMark Specification — the base Markdown grammar the Safe
  Markdown Subset (Appendix B) constrains.

---

# Appendix A: Full Schema Reference

```json
{
  "content_type": "onp:companion:article",
  "content": {
    "headline": "string, REQUIRED",
    "dek": "string, OPTIONAL",
    "body": "string, REQUIRED, Safe Markdown Subset",
    "byline": "array of strings, OPTIONAL, provisional (Section 4.6)",
    "contributor_refs": "array of OID strings, OPTIONAL, preferred over byline (Section 4.6)",
    "section": "string, OPTIONAL",
    "canonical_url": "string (URI), OPTIONAL",
    "media_refs": "array of OID strings, OPTIONAL",
    "rights_ref": "string (OID), OPTIONAL",
    "payment_ref": "string (OID), OPTIONAL",
    "source_refs": "array of OID strings, OPTIONAL",
    "corrections_ref": "array of OID strings, OPTIONAL, discovery convenience only"
  }
}
```

# Appendix B: Safe Markdown Subset

```
ALLOWED (standard CommonMark):
  - headings, paragraphs, emphasis/strong
  - lists (ordered, unordered)
  - links, images (as Markdown image syntax, not inline HTML)
  - blockquotes
  - code spans and fenced code blocks
  - horizontal rules

DISALLOWED:
  - raw HTML blocks
  - inline HTML tags
  - any CommonMark extension that permits arbitrary HTML passthrough

A Node's Markdown renderer MUST be configured to strip, not pass
through, any HTML it encounters in body, regardless of whether the
publisher's own tooling already enforces this at authoring time
(Section 4.4, rule 2; Section 8.1).
```

---
*End of Document*
