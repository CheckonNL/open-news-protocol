Title: Open News Protocol (ONP): Sources
Document Number: ONP-2600
Status: Working Draft
Version: 0.2.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-31

---

# Abstract

This document defines the Sources Companion:
`content_type = "onp:companion:sources"`, enabling structured,
verifiable attribution of what a story is based on — a document, a
named official, an anonymous or protected individual. ONP-2000
Section 9 flagged this Companion, before it existed, as the one
where source protection would need to take precedence over
completeness. This document follows through on that: its visibility
model hard-forbids identifying information from accompanying an
anonymous or protected source declaration, and its guidance
explicitly recommends that the most sensitive cases avoid creating a
structured, distributable Source Object at all — accepting reduced
machine-readability in exchange for not creating a permanent,
widely-copyable record of a fact that could endanger someone.

---

# Status of This Document

This document is part of the ONP Companion series (ONP-2000-2999).
It is directly implementable. Concurrently with its publication,
ONP-2100 (Article) is updated with a new OPTIONAL `source_refs`
field (Section 10.3). It is a Working Draft.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

Structured source attribution has real value: it lets a reader, a
fact-checker, or an AI system see what a story is actually built on,
rather than trusting an unverifiable "sources say." ONP-2000 Section
9 already named the cost of that value before this Companion existed
to weigh it properly: a Sources Companion could, if designed
carelessly, become a mechanism for inadvertently exposing exactly
the people journalism's confidentiality protections exist to shield.
This document is designed with that risk as a primary constraint,
not an afterthought.

---

# 2. Scope

## 2.1 In Scope

* the `onp:companion:sources` content schema;
* the visibility model (`named` / `anonymous` / `protected`) and its
  hard constraints preventing identifying fields from accompanying a
  non-named source;
* guidance on when a structured Source Object should not be created
  at all, given ONP's permanent-record properties.

## 2.2 Out of Scope

This document does NOT define:

* any technical anonymization, redaction, or de-identification
  mechanism — ensuring a `description` field does not inadvertently
  identify a protected source remains entirely an editorial,
  human-judgment responsibility this document cannot automate;
* legal shield law interpretation or any jurisdiction's source
  protection statute — consistent with Principle P5, this document
  provides structural support for whatever protection a publisher's
  own legal and editorial process requires, without interpreting any
  specific law;
* verification methodology — `credibility_note` (Section 4.3) is a
  free-text editorial field, not a structured fact-checking protocol.

---

# 3. Terminology

This document is the owning specification for the following terms.

**Source Object**
: An informal name for a News Object whose `content_type` is
  `onp:companion:sources`.

**Visibility**
: The `visibility` field: `"named"`, `"anonymous"`, or `"protected"`
  — the central declaration governing what identifying information a
  Source Object may carry (Section 4.4).

**Protected Source**
: A Source Object with `visibility: "protected"`, signaling an
  explicit confidentiality commitment by the publisher, distinct from
  ordinary, lower-stakes anonymity (Section 4.4, rule 3).

---

# 4. Requirements

## 4.1 content_type Declaration

Every Source Object MUST declare `content_type` as exactly
`onp:companion:sources`.

## 4.2 Companion-vs-Extension Classification

```
Does "Source" have independent identity and an independent
lifecycle, separable from any Article that cites it?

- A recurring source (a standing public database, a regularly
  quoted official, a repeatedly referenced report) is commonly cited
  by more than one Article over time, independently of any single
  Article's own lifecycle.
- YES -> Companion.
```

## 4.3 Content Schema

1. `source_type` is REQUIRED: one of `"document"`, `"person"`,
   `"organization"`, `"event"`.
2. `visibility` is REQUIRED: one of `"named"`, `"anonymous"`,
   `"protected"` (Section 4.4).
3. `source_ref`, `description`, `document_ref`, `origin_url`,
   `credibility_note`, and `access_date` are OPTIONAL, subject to
   the constraints in Sections 4.4 and 4.5.

## 4.4 Visibility Model

1. When `visibility` is `"named"`, `source_ref` (an Object Reference
   to an Identity Object, ONP-2300) MAY be present, identifying the
   source directly.
2. When `visibility` is `"anonymous"` or `"protected"`, `source_ref`
   MUST NOT be present. This is a hard constraint, not a
   recommendation: the entire purpose of these visibility values is
   that no field in this Object identifies the source, and a
   present `source_ref` would directly defeat that purpose. A Node
   encountering `source_ref` alongside `visibility: "anonymous"` or
   `"protected"` MUST treat the Source Object as malformed.
3. `"protected"` signals an explicit confidentiality commitment
   (e.g. a whistleblower whose safety depends on non-disclosure),
   distinct from `"anonymous"`, which MAY simply reflect editorial
   style (an official who preferred not to be named for a routine
   reason). This distinction exists so that downstream handling —
   editorial, legal, or technical — can treat the two differently
   where that matters.
4. `description`, if present, MUST be a general, non-identifying
   characterization when `visibility` is `"anonymous"` or
   `"protected"` (e.g. "a senior official at the Ministry of
   Finance," not anything narrow enough to identify one specific
   person). This document cannot enforce this — whether a
   description is actually non-identifying is an editorial judgment
   call, not something Core or this Companion can validate
   mechanically (Section 8.1).

## 4.5 Document and Access Fields

1. `document_ref`, if present, MUST be a single Object Reference to
   a Media Object (ONP-2200) representing the source document itself
   (e.g. a leaked report), reusing that Companion's Verified Asset
   Reference pattern for the document's own integrity. The Media
   Object's `asset_url` is the address a verifier fetches and
   re-hashes; it commonly points to a copy the publisher itself
   hosts (self-hosting keeps the bytes at that address stable, so
   the Verified Asset Reference stays checkable for as long as the
   publisher serves it).
2. `origin_url`, if present, MUST be a well-formed URI: where the
   document was originally published or obtained, when that differs
   from `document_ref`'s `asset_url` (e.g. the government portal a
   leaked or since-removed report was retrieved from). It is a
   citation, not a Verified Asset Reference — nothing requires the
   bytes at `origin_url` to still exist or still match, and a Node
   MUST NOT treat `origin_url` as checkable the way `asset_hash` is.
3. `access_date`, if present, MUST be an ISO 8601 timestamp: when
   the information was obtained or accessed.
4. `credibility_note`, if present, MUST be a string: an editorial
   note on how this source's reliability was assessed.

## 4.6 Guidance: When Not to Create a Structured Source Object

For a `"protected"` source whose safety depends on non-disclosure, a
publisher SHOULD weigh whether creating any structured, independently
distributable Source Object is appropriate at all, given that
retraction does not guarantee removal from Nodes that have already
copied it (ONP-0006 Section 8.3). A publisher MAY instead represent
such a source only in the Article's own `body` prose (ONP-2100),
with no separate Source Object and no `source_refs` entry — accepting
reduced machine-readability and cross-referenceability in exchange
for not creating a permanent, independently distributable record of
the source's existence at all. This document does not mandate this
choice; it states it as a genuine, RECOMMENDED option for the highest-
stakes cases, not a fallback of last resort.

## 4.7 Local Identifier Guidance for Protected Sources

Where a `"protected"` Source Object is created, its OID's Local
Identifier (ONP-1001 Section 4.2) SHOULD be an opaque, non-descriptive
token rather than a human-readable slug, to avoid the identifier
string itself becoming an inadvertent identifying clue.

---

# 5. Object Model

```json
{
  "content_type": "onp:companion:sources",
  "content": {
    "source_type": "'document' | 'person' | 'organization' | 'event', REQUIRED",
    "visibility": "'named' | 'anonymous' | 'protected', REQUIRED",
    "source_ref": "onp:oid:..., OPTIONAL, ONLY when visibility='named'",
    "description": "string, OPTIONAL",
    "document_ref": "onp:oid:..., OPTIONAL",
    "origin_url": "string (URI), OPTIONAL",
    "credibility_note": "string, OPTIONAL",
    "access_date": "string (ISO 8601), OPTIONAL"
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `source_type` | REQUIRED | |
| `visibility` | REQUIRED | Section 4.4 |
| `source_ref` | OPTIONAL | MUST NOT appear unless `visibility: "named"` |
| `description` | OPTIONAL | Non-identifying when not named (Section 4.4, rule 4) |
| `document_ref` | OPTIONAL | Object Reference to a Media Object |
| `origin_url` | OPTIONAL | Citation only — not a Verified Asset Reference (Section 4.5, rule 2) |
| `credibility_note` | OPTIONAL | |
| `access_date` | OPTIONAL | |

---

# 6. Processing Model

## 6.1 Structural Validity

A Node MUST reject a Source Object as malformed if `source_ref` is
present alongside `visibility: "anonymous"` or `"protected"` (Section
4.4, rule 2). This is a structural check, evaluable without any
editorial judgment, unlike the non-identifying-description guidance
(Section 4.4, rule 4), which is not mechanically checkable.

## 6.2 Interoperability

A Node without Sources Companion support simply does not see source
attribution — the referencing Article remains fully verifiable and
usable, exactly as for any unrecognized Companion. This document does
not require every Article to carry `source_refs`.

---

# 7. Examples

## 7.1 A Named Source

```json
{
  "content_type": "onp:companion:sources",
  "content": {
    "source_type": "person",
    "visibility": "named",
    "source_ref": "onp:oid:regiopurmerend.nl:wethouder-devries",
    "credibility_note": "Direct citaat tijdens raadsvergadering, 27 juli 2026."
  }
}
```

## 7.2 An Anonymous Source

```json
{
  "content_type": "onp:companion:sources",
  "content": {
    "source_type": "person",
    "visibility": "anonymous",
    "description": "Een ambtenaar betrokken bij het fusieonderzoek.",
    "credibility_note": "Bevestigd door een tweede, onafhankelijke bron."
  }
}
```

Note `source_ref` is correctly absent.

## 7.3 Malformed: Named Reference on an Anonymous Source (Rejected)

```json
{
  "content": {
    "visibility": "anonymous",
    "source_ref": "onp:oid:regiopurmerend.nl:ambtenaar-devries"
  }
}
```

REJECTED per Section 4.4, rule 2 / Section 6.1 — this defeats the
entire purpose of declaring `"anonymous"`.

## 7.4 A Protected Source, Handled per Section 4.6's Guidance

```
Rather than creating a Source Object at all, the publisher
represents this source only in the Article's own body text:

"Volgens een bron die vanwege haar veiligheid anoniem wenst te
blijven en niet nader is aangeduid, ..."

No Source Object, no source_refs entry — the safer choice this
document explicitly recommends for the highest-stakes case.
```

---

# 8. Security Considerations

## 8.1 The Structural Check Cannot Replace Editorial Judgment

Section 6.1's structural check (rejecting `source_ref` alongside
non-named visibility) catches only the most direct failure mode. It
cannot detect an overly specific `description` that identifies a
supposedly anonymous source through inference (e.g. a description
narrow enough to name exactly one person in context). This remains
entirely an editorial responsibility this document has no mechanical
way to enforce.

## 8.2 OID Local Identifiers as a Leakage Vector

Section 4.7's guidance exists because an OID's Local Identifier
(ONP-1001) is, throughout this series' examples, human-readable and
descriptive by convention — appropriate for public Articles and
Media, but a real risk if that convention were followed unthinkingly
for a protected source's own OID.

---

# 9. Privacy Considerations

This document's entire design is a response to the concern ONP-2000
Section 9 raised before this Companion existed: source relationships
are, in investigative journalism specifically, sometimes a matter of
a real person's physical safety, not merely conventional privacy. The
visibility model's hard constraints (Section 4.4) and the explicit
guidance to avoid creating a structured Object at all for the highest-
stakes cases (Section 4.6) both exist because ONP's permanent,
widely-distributable-by-design nature (ONP-0001 Section 6.3; ONP-0006
Section 8.3) is, for this specific use case, a risk to be actively
designed around rather than a neutral property. Publishers SHOULD
treat the decision to create any Source Object — even a `"protected"`
one — as a deliberate choice with permanence implications, not a
default.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0000, Introduction — the Trusted News pillar, extended here to
  the reporting process itself, not only the Object.
* ONP-0003, Design Principles — Principle P5 (Jurisdiction
  Neutrality, Section 2.2).
* ONP-0006, News Object Lifecycle — Section 8.3, the retraction-does-
  not-erase-history property central to Section 4.6 and Section 9 of
  this document.
* ONP-1001, Identifiers — Section 4.2 (Local Identifier), extended
  with protective guidance in Section 4.7.
* ONP-2000, Companion Framework — Section 9, which named this
  document's central risk before it was written; Section 4.3 (Object
  Reference mechanism).
* ONP-2200, Media — the Verified Asset Reference pattern
  `document_ref` reuses.
* ONP-2300, Identity — the target of `source_ref` when
  `visibility: "named"`.

## 10.2 Informative References

* ONP-2100, Article (updated concurrently, Section 10.3) — the
  Companion expected to carry `source_refs`.

## 10.3 Corresponding Update to ONP-2100

As part of this document's publication, ONP-2100 (Article) is updated
to add `source_refs` (OPTIONAL, array of OID strings referencing
Source Objects), following the same Object Reference pattern already
established for `contributor_refs`, `rights_ref`, and `payment_ref`.
Classified MINOR (additive) under ONP-0007 Section 4.1.

---

# Appendix A: Full Schema Reference

```json
{
  "content_type": "onp:companion:sources",
  "content": {
    "source_type": "enum, REQUIRED",
    "visibility": "enum, REQUIRED",
    "source_ref": "string (OID), OPTIONAL, ONLY if visibility='named'",
    "description": "string, OPTIONAL, non-identifying if not named",
    "document_ref": "string (OID), OPTIONAL",
    "origin_url": "string (URI), OPTIONAL",
    "credibility_note": "string, OPTIONAL",
    "access_date": "string (ISO 8601), OPTIONAL"
  }
}
```

# Appendix B: Source Object Checklist

```
[ ] source_type and visibility both present
[ ] if visibility is 'anonymous' or 'protected': source_ref is
    ABSENT (hard requirement, Section 4.4, rule 2)
[ ] if visibility is not 'named': description, if present, has
    been reviewed by an editor for inadvertent identifiability
[ ] for 'protected' sources: has the publisher considered
    Section 4.6 — would prose-only attribution, with no Source
    Object at all, be the safer choice here?
[ ] for 'protected' sources that DO get a Source Object: Local
    Identifier is an opaque token, not a descriptive slug
    (Section 4.7)
```

---
*End of Document*
