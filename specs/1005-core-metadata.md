Title: Open News Protocol (ONP): Core Metadata
Document Number: ONP-1005
Status: Working Draft
Version: 0.1.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document defines `onp:metadata`: an OPTIONAL, Companion-
agnostic container for a small set of generic fields — `language`,
`title`, `summary`, `tags` — useful for display, indexing, and
search across every Companion, without requiring a Node to
understand any specific `content_type` schema. It closes a gap left
open since ONP-1000: a Node with no Companion support has, until
now, been able only to decline to render an Object meaningfully
(ONP-1000 Section 4.4, rule 3; ONP-1004 Section 7.2). With
`onp:metadata`, such a Node can produce a reasonable generic
representation instead. This document is the last specification in
the ONP-1000 Core series.

---

# Status of This Document

This document is part of the ONP Core series (ONP-1000-1999) and is
its closing document. It is directly implementable. It is a Working
Draft.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

Every Companion so far discussed — Article, Media, Identity, Rights,
Payments — will define its own domain-specific fields inside
`content`. None of that helps a Node that does not implement the
specific Companion an Object declares. ONP-1000 Section 4.4, rule 3
already requires such a Node to complete Core validation and
decline to render `content` meaningfully; that is correct as far as
authenticity goes, but it leaves genuinely useful cross-cutting
information — what language is this in, what is it broadly about —
unavailable to exactly the Nodes that need it most: generic
indexers, search tools, and minimal implementations that will never
support every Companion in the roadmap. This document supplies that
information as an OPTIONAL, Core-owned layer, modeled on
well-precedented generic metadata vocabularies (informally, in the
spirit of Dublin Core) rather than inventing journalism-specific
semantics that would belong to a Companion instead.

---

# 2. Scope

## 2.1 In Scope

* the `onp:metadata` container and its field definitions;
* the precedence rule between `onp:metadata` and Companion-specific
  equivalents within `content`;
* the fallback-display use case this enables for Companion-agnostic
  Nodes.

## 2.2 Out of Scope

This document does NOT define:

* any Companion-specific display field (e.g. Article's future
  `headline`) — those remain owned entirely by their Companion;
* semantic validation of whether `onp:metadata` content accurately
  describes `content` — Core has no way to check this (Section 8);
* categorization taxonomies, controlled vocabularies for `tags`, or
  language-detection behavior — a Node MAY apply its own policy for
  any of these; this document only fixes the field's presence and
  type.

---

# 3. Terminology

This document is the owning specification for the following terms.

**Core Metadata**
: The `onp:metadata` container and the fields it defines: `language`,
  `title`, `summary`, `tags`.

**Generic Field**
: Any Core Metadata field, so named because its meaning is
  Companion-agnostic by design, unlike a field defined within
  `content` by a specific Companion.

---

# 4. Requirements

## 4.1 The `onp:metadata` Container

1. `onp:metadata` is an OPTIONAL top-level envelope key, added to
   the OPTIONAL key list ONP-1000 Section 4.1, rule 3 already
   enumerates.
2. If present, `onp:metadata` MUST be a JSON object. It SHOULD NOT
   be present as an empty object; a publisher with no Core Metadata
   to state SHOULD simply omit the key entirely, consistent with the
   absence-has-meaning pattern already established in ONP-1000
   Appendix B.

## 4.2 Field Definitions

1. `language`, if present, MUST be a well-formed BCP 47 (RFC 5646)
   language tag describing the primary language of `content`.
2. `title`, if present, MUST be a string: a short, Companion-agnostic
   display title. It is RECOMMENDED to keep it under roughly 200
   characters for practical display purposes, though this document
   does not impose a hard length limit.
3. `summary`, if present, MUST be a string: a short, Companion-
   agnostic description, distinct from and shorter than `content`
   itself.
4. `tags`, if present, MUST be an array of strings: generic
   keywords or categories. This document does not fix a controlled
   vocabulary; a Node MAY apply its own normalization or matching
   policy.

## 4.3 Precedence Relative to Companion-Specific Fields

1. Where a Companion defines its own, more specific equivalent field
   within `content` (for example, a future Article `headline`), that
   Companion-specific field MUST be treated as authoritative for any
   rendering performed by a Node that implements that Companion.
2. `onp:metadata` fields MUST be treated as a fallback layer, not an
   override: a Node that DOES implement the relevant Companion MUST
   NOT let `onp:metadata` silently supersede that Companion's own,
   more specific content.
3. A Node that does NOT implement the relevant Companion MAY use
   `onp:metadata` fields as its only available basis for generic
   display or indexing (Section 6.1).

## 4.4 Non-Authoritativeness for Trust Purposes

`onp:metadata` fields are, like every other envelope field, fully
covered by the signing pre-image (ONP-1002, ONP-1003) and are
therefore tamper-evident. This does not make them semantically
authoritative over `content` — Core has no mechanism to verify that
a `title` accurately describes what `content` actually says
(Section 8).

## 4.5 Naming Discipline

A Companion SHOULD avoid naming a field within `content` identically
to a Core Metadata field name (`language`, `title`, `summary`,
`tags`), even though no literal namespace collision occurs (`content`
and `onp:metadata` are structurally distinct containers), because
doing so invites exactly the kind of reader confusion the single-
owner terminology discipline (ONP-0002) otherwise prevents.

---

# 5. Object Model

```json
{
  "onp:metadata": {
    "language": "nl-NL",
    "title": "Fusie-onderzoek Purmerend gepubliceerd",
    "summary": "Necker van Naem publiceert budgetanalyse voor de voorgestelde fusie.",
    "tags": ["purmerend", "fusie", "gemeentefinanciën"]
  }
}
```

| Field | Required | Type |
|---|---|---|
| `onp:metadata` | OPTIONAL | object |
| `onp:metadata.language` | OPTIONAL | string, BCP 47 |
| `onp:metadata.title` | OPTIONAL | string |
| `onp:metadata.summary` | OPTIONAL | string |
| `onp:metadata.tags` | OPTIONAL | array of strings |

---

# 6. Processing Model

## 6.1 Fallback Display for Companion-Agnostic Nodes

```
Given: an Object whose content_type is unrecognized by this Node
       (companion_valid = "unknown", per ONP-1004 Section 4.3)

1. Check for onp:metadata.
2. If present, a Node MAY use title, summary, language, and tags
   to produce a generic representation (e.g. a search index entry,
   a minimal preview card) without interpreting content at all.
3. If absent, the Node has no generic fallback and MAY decline to
   render anything beyond bare provenance information (publisher
   domain, signed_at), per ONP-1000 Section 4.4, rule 3.
```

## 6.2 Interoperability

A Node implementing only ONP-1000 through ONP-1005 — the complete
Core series, no Companion or Extension — can now do more than
authenticate an Object it cannot otherwise interpret: if
`onp:metadata` is present, it can meaningfully index, search, or
minimally display that Object. This is additive to, not a
replacement for, the interoperability guarantee already established:
a minimal Node's behavior remains correct and well-defined whether
or not `onp:metadata` is present, per the OPTIONAL status fixed in
Section 4.1.

---

# 7. Examples

## 7.1 Generic Fallback Display Completed

```
Object: content_type = "onp:companion:media" (unimplemented by
        this Node)
companion_valid: "unknown" (ONP-1004 Section 7.2)
onp:metadata present: { "title": "...", "summary": "...",
                         "language": "nl-NL" }

Node behavior (Section 6.1): renders a generic preview using
onp:metadata, while still correctly reporting companion_valid as
"unknown" rather than pretending to understand the Media Companion's
actual content structure.
```

## 7.2 Precedence: Companion-Aware Node

```
A Node that DOES implement the (future) Article Companion receives
an Object with both onp:metadata.title and content.headline set to
different strings (e.g. a publisher's generic SEO title vs. the
Companion's specific editorial headline).

Per Section 4.3: the Node's Article-aware rendering MUST use
content.headline, not onp:metadata.title. A search index built by
a Companion-agnostic Node, however, MAY reasonably use
onp:metadata.title instead, since it has no access to
content.headline's meaning at all.
```

---

# 8. Security Considerations

`onp:metadata` fields are tamper-evident (Section 4.4) but not
semantically verified: a publisher could set a `title` or `summary`
that is misleading relative to `content`, and no Core mechanism
detects this — it is a content-quality concern, not an authenticity
one, and is explicitly outside what Core validation (ONP-1004) can
or should check. This mirrors the same limitation already
acknowledged for `content` generally: Core proves who published
something and that it has not been altered since, never that its
content is honest.

---

# 9. Privacy Considerations

Because `title`, `summary`, and `tags` are free-text or free-form
fields under publisher control, they could inadvertently carry
personal data (e.g. a summary naming a private individual). This is
no different in kind from the same risk `content` already carries;
this document introduces no new privacy mechanism and defers to
general publisher responsibility, consistent with how ONP-1000
Section 9 treats `content` itself.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* [RFC5646] Phillips, A., Davis, M., "Tags for Identifying
  Languages", BCP 47, RFC 5646 — the format `language` MUST follow.
* ONP-1000, News Object — Section 4.1 (OPTIONAL key list, extended
  here), Section 4.4 (the unrecognized-content_type fallback case
  this document completes).
* ONP-1002, Serialization — `onp:metadata` participates in
  canonicalization and the signing pre-image exactly like any other
  field, per general envelope rules already established there.
* ONP-1004, Validation — Section 4.3 and Section 7.2, the
  `companion_valid: unknown` case this document's Section 6.1
  directly addresses.

## 10.2 Informative References

* ONP-2100, Article (forward reference — the Companion whose future
  `headline`-equivalent field motivates the precedence rule, Section
  4.3).
* ONP-3200, Search (forward reference — a natural consumer of
  `onp:metadata` for indexing purposes).
* Dublin Core Metadata Element Set — the general precedent this
  document's field selection (title, language, description/summary,
  subject/tags) is informally modeled on, cited for context, not
  adopted as a normative dependency.

## 10.3 Corresponding Update to ONP-1000

As part of this document's publication, ONP-1000 is updated to list
`onp:metadata` among its OPTIONAL top-level keys (Section 4.1, rule
3) and its schema/field table (Section 5) is extended accordingly.
This is a purely additive change — no previously valid News Object
becomes invalid — and is classified MINOR under ONP-0007 Section 4.1
without requiring the explicit-breaking-change callout Section 4.2,
rule 4 mandates only for changes that would otherwise meet the MAJOR
criteria; this one does not.

---

# Appendix A: `onp:metadata` Checklist

```
[ ] onp:metadata omitted entirely if there is nothing to state
    (do not send an empty object)
[ ] language, if present, is a well-formed BCP 47 tag
[ ] title, if present, is a plain string, Companion-agnostic
[ ] summary, if present, is a plain string, shorter than content
[ ] tags, if present, is an array of strings
[ ] Companion-aware rendering never lets onp:metadata override a
    more specific Companion field within content
```

---
*End of Document*
