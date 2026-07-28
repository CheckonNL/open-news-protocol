Title: Open News Protocol (ONP): Identity
Document Number: ONP-2300
Status: Working Draft
Version: 0.1.1
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document defines the Identity Companion:
`content_type = "onp:companion:identity"`, a reusable, independently
verifiable record of a contributor — a journalist, photographer, or
editor. It upgrades the provisional string fields ONP-2100 (`byline`)
and ONP-2200 (`credit`) already promised an upgrade path for,
replacing repeated free-text names with an Object Reference to a
single, reusable Identity Object per person. The trust model is
stated precisely and without overclaiming: an Identity Object is
**publisher-asserted**, not self-sovereign — it is signed by the
publisher's own key, exactly like any other News Object, and proves
"this publisher vouches for this identity record," not that the
named individual independently controls any cryptographic key of
their own. Cross-publisher identity linking is explicitly out of
scope for this version.

---

# Status of This Document

This document is part of the ONP Companion series (ONP-2000-2999).
It is directly implementable and follows every mandatory addition
ONP-2000 Section 4.2 requires. Concurrently with this document's
publication, ONP-2100 and ONP-2200 are each updated with a new,
OPTIONAL Object Reference field pointing to Identity Objects,
alongside their existing provisional string fields (Section 10.3).
It is a Working Draft.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

ONP-2100 Section 4.6 promised that `byline` was provisional pending
this document. ONP-2200's `credit` field made the same implicit
promise without stating it — a gap this document's publication
corrects concurrently (Section 10.3). Both fields, until now, were
plain strings: a name with no persistence, no reusability across a
contributor's body of work, and no cryptographic backing beyond the
Article or Media Object's own signature. This document does not
create individual, self-sovereign cryptographic identity for
journalists — that would require each contributor to control their
own domain or an equivalent trust anchor, which most do not. Instead
it creates something more modest but immediately useful: a reusable,
independently versioned record the publisher itself vouches for,
referenced by OID instead of repeated by name.

---

# 2. Scope

## 2.1 In Scope

* the `onp:companion:identity` content schema;
* the publisher-asserted trust model and its explicit limits;
* consent and contact-field guidance;
* the Article and Media upgrade fields (`contributor_refs`,
  `creator_ref`), whose actual normative definition remains owned by
  ONP-2100 and ONP-2200 respectively (Section 10.3) — this document
  only defines what they point to.

## 2.2 Out of Scope

This document does NOT define:

* self-sovereign, cross-publisher identity — a mechanism letting one
  individual maintain a single identity independently verifiable
  across multiple, unrelated publishers is a real and anticipated
  need (a freelance journalist works with more than one outlet) but
  is not solved here; it remains open future work with no
  Specification number yet reserved;
* verified credentials — `credentials` (Section 4.3) is an
  unverified, publisher-asserted display field, exactly as
  provisional in nature as `byline` was before this document;
* any authentication mechanism letting the named individual control
  or correct their own Identity Object directly — the publisher
  remains the sole signer, per Section 4.4;
* the `eudi` Trust Anchor Type. ONP-0004 Section 4.6 reserved this
  identifier and stated it would be "normatively defined in
  ONP-2300." This document does not fulfill that promise: EUDI
  Wallet binding (attribute schemas, verifiable credential formats,
  wallet interaction) is a substantial topic in its own right and
  deserves dedicated treatment rather than a late addition to a
  document primarily about publisher-asserted contributor records.
  This gap is acknowledged here explicitly rather than left silently
  unaddressed; `eudi` remains `reserved` in ONP-0002's Terminology
  Registry (Section 10.3), not `active`, until a future revision of
  this document — or a separate document — actually defines it.

---

# 3. Terminology

This document is the owning specification for the following terms.

**Identity Object**
: An informal name for a News Object whose `content_type` is
  `onp:companion:identity`.

**Publisher-Asserted Identity**
: The trust model this document adopts: an Identity Object's
  authenticity is scoped entirely to the publisher whose key signed
  it. It is that publisher's claim about the named individual, not
  an independent, cross-publisher, or self-sovereign identity claim
  by the individual themselves (Section 4.4).

**Contributor Reference**
: An Object Reference (ONP-2000 Section 4.3) from an Article or
  Media Object to an Identity Object, replacing a plain-string name
  with a pointer to a reusable, independently verifiable record.

---

# 4. Requirements

## 4.1 content_type Declaration

Every Identity Object MUST declare `content_type` as exactly
`onp:companion:identity`.

## 4.2 Companion-vs-Extension Reapplication

Per ONP-2000 Section 4.2, rule 2:

```
Does "Identity" have independent identity and an independent
lifecycle, separable from any Article or Media Object that
references it?

- A contributor's identity record persists across their entire body
  of work, is created once and referenced by many Articles or Media
  Objects over time, and can be updated (a new bio, a new role)
  entirely independently of any single piece of content referencing
  it.
- YES -> Companion.
```

## 4.3 Content Schema

1. `display_name` is REQUIRED: a string, the contributor's
   publicly-displayed name.
2. `role`, `bio`, `credentials`, `profile_url`, `avatar_ref`, and
   `contact` are OPTIONAL, per Sections 4.5-4.7.

## 4.4 Publisher-Asserted Trust Model

1. An Identity Object's authenticity, like any News Object's, is
   established entirely by its own `publisher`/`signature` fields
   (ONP-1000, ONP-1003) and Trust Anchor resolution (ONP-0004). A
   Node MUST NOT treat an Identity Object as proof that the named
   individual independently controls any cryptographic key; it is
   proof only that the asserting publisher signed this claim.
2. A Node MUST NOT treat two Identity Objects from different
   publishers, even with an identical `display_name`, as
   automatically referring to the same real-world individual. This
   document defines no cross-publisher linking mechanism (Section
   2.2); the same journalist working at two publishers is
   represented by two independent Identity Objects, one per
   publisher, unless and until a future mechanism defines otherwise.

## 4.5 avatar_ref

`avatar_ref`, if present, MUST be an Object Reference (ONP-2000
Section 4.3) to a Media Object (ONP-2200) depicting the contributor.

## 4.6 Consent Guidance (Non-Enforceable)

A publisher SHOULD obtain the named individual's knowledge and, where
applicable, consent before publishing an Identity Object describing
them, particularly where `contact` is populated. ONP has no protocol
mechanism to verify or enforce this — it is stated here as guidance,
not as a checkable requirement, consistent with how ONP-2200 Section
9 already treats consent for identifiable people in photographs.

## 4.7 Contact Field Guidance

`contact`, if present, SHOULD be a URL to a contact form or a
publisher-hosted contact page, rather than a raw personal email
address or phone number, to reduce direct exposure of the
individual's personal contact information to harvesting or
harassment. This document does not forbid a raw address, but
RECOMMENDS against it.

---

# 5. Object Model

```json
{
  "content_type": "onp:companion:identity",
  "content": {
    "display_name": "string, REQUIRED",
    "role": "string, OPTIONAL",
    "bio": "string, OPTIONAL",
    "credentials": ["string", "..."],
    "profile_url": "string (URI), OPTIONAL",
    "avatar_ref": "onp:oid:..., OPTIONAL — Object Reference to a Media Object",
    "contact": "string, OPTIONAL — URL preferred over raw address (Section 4.7)"
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `display_name` | REQUIRED | |
| `role` | OPTIONAL | e.g. "Journalist", "Photographer", "Editor" |
| `bio` | OPTIONAL | Short, plain-text biography |
| `credentials` | OPTIONAL | Array of strings; unverified (Section 2.2) |
| `profile_url` | OPTIONAL | |
| `avatar_ref` | OPTIONAL | Object Reference to a Media Object (Section 4.5) |
| `contact` | OPTIONAL | URL RECOMMENDED over raw address (Section 4.7) |

---

# 6. Processing Model

## 6.1 Resolution and Precedence

A Node resolving an Article's `contributor_refs` (ONP-2100) or a
Media Object's `creator_ref` (ONP-2200) follows the same Object
Reference resolution procedure already defined generically in
ONP-2000 Section 6.2: fetch if possible, verify via ordinary Core
validation if fetched, and treat the reference as non-blocking for
the referencing Object's own validity if unreachable (ONP-2000
Section 4.4). Where both a reference field and its corresponding
provisional string field (`byline`, `credit`) are present, an
Identity-aware Node MUST prefer the reference, per the precedence
rule each of those fields' owning documents states (ONP-2100 Section
4.6; ONP-2200 Section 4.5, as corrected in Section 10.3 of this
document).

## 6.2 Interoperability

A Node with no Identity Companion support still has `byline` or
`credit` strings to fall back on, exactly as promised when those
fields were first defined — this document's arrival changes nothing
about that fallback's continued validity. An Identity-aware Node
gets a reusable, independently verifiable, and updatable record
instead of a repeated name.

---

# 7. Examples

## 7.1 An Identity Object

```json
{
  "oid": "onp:oid:regiopurmerend.nl:redactie",
  "vid": "onp:vid:sha-256:JkL012-example-digest-bytes",
  "publisher": {
    "domain": "regiopurmerend.nl",
    "key_id": "onp:key:2026-07-01"
  },
  "signed_at": "2026-07-01T00:00:00Z",
  "signature": "onp:sig:ed25519:base64url-signature-bytes",
  "content_type": "onp:companion:identity",
  "content": {
    "display_name": "Redactie RegioPurmerend",
    "role": "Redactie",
    "bio": "De redactie van RegioPurmerend.nl, lokale nieuwsberichtgeving voor Purmerend en Beemster.",
    "profile_url": "https://regiopurmerend.nl/over-ons",
    "contact": "https://regiopurmerend.nl/contact"
  }
}
```

## 7.2 Article Using `contributor_refs` (Anticipating ONP-2100's
     Update)

```json
{
  "content_type": "onp:companion:article",
  "content": {
    "headline": "Fusie-onderzoek Purmerend gepubliceerd",
    "body": "...",
    "byline": ["Redactie RegioPurmerend"],
    "contributor_refs": ["onp:oid:regiopurmerend.nl:redactie"]
  }
}
```

An Identity-aware Node uses `contributor_refs` and can fetch the
full Identity Object; a Node without Identity support still has
`byline` to display.

---

# 8. Security Considerations

## 8.1 Publisher-Asserted Means Publisher-Compromised Means
     Identity-Compromised

Because an Identity Object's authenticity depends entirely on the
same publisher key that signs everything else that publisher
produces, a compromised publisher key (ONP-0004 Section 8.1; ONP-0005
Adversary A3) can fabricate false Identity Objects attributing
content or credentials to real, named individuals who never
consented to or wrote it. This is not a new class of risk this
document introduces — it is the same compromise-window limitation
already accepted throughout this series — but it carries higher
reputational stakes here specifically because an Identity Object's
entire subject is a named person, not an abstract piece of content.
Implementers building anything that surfaces Identity Objects
prominently (e.g. a byline display) SHOULD be aware that this
document provides no stronger authenticity guarantee than any other
Companion, despite its subject matter feeling more personal.

---

# 9. Privacy Considerations

This is, by a wide margin, the most privacy-sensitive Companion
published so far: its entire purpose is to make a specific, named,
real individual identifiable, potentially permanently and publicly.
Two considerations deserve explicit statement rather than a routine
note:

1. **Retraction does not guarantee removal.** ONP-0006 Section 8.3
   already establishes that retraction never erases historical
   verifiability of an Object — deliberately, for editorial
   accountability. Applied to an Identity Object, this means a
   retracted or corrected Identity Object (for example, one an
   individual asks to have removed after leaving a publisher) can
   still be held, cached, or archived by any Node that obtained a
   copy before retraction. This is a real and material tension with
   data protection frameworks that presume some degree of
   erasability, and this document does not resolve it — consistent
   with Principle P5 (Jurisdiction Neutrality), ONP does not attempt
   to encode any jurisdiction's right-to-erasure requirements, but
   publishers SHOULD understand this limitation before treating
   Identity Object retraction as equivalent to removal.
2. **Publisher-asserted, not individual-controlled.** Per Section
   4.4, the named individual has no protocol-level mechanism to
   correct, retract, or contest an Identity Object describing them —
   only the publisher can. Publishers SHOULD establish their own
   editorial process for individuals to request corrections,
   entirely outside ONP's mechanism, since ONP provides none.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0003, Design Principles — Principle P2 (Minimal Required
  Surface, Section 4.3), Principle P5 (Jurisdiction Neutrality,
  Section 9).
* ONP-0004, Trust Model; ONP-0005, Security Model — the compromise-
  window limitation this document's Section 8.1 restates in the
  specific context of named-individual attribution.
* ONP-0006, News Object Lifecycle — Section 8.3, the retraction-
  does-not-erase-history property this document's Section 9 applies
  to personal data specifically.
* ONP-2000, Companion Framework — Section 4.3 (Object Reference
  mechanism), Section 4.2 (mandatory additions, followed throughout).
* ONP-2100, Article — Section 4.6, the upgrade path this document
  fulfills.
* ONP-2200, Media — the `credit` field this document also upgrades,
  corrected concurrently (Section 10.3) to state the same promise
  ONP-2100 already made.

## 10.2 Informative References

* Future cross-publisher identity mechanism (Section 2.2) — no
  Specification number is yet reserved; noted here as an open
  question for the Working Group rather than a forward reference to
  a named document.

## 10.3 Corresponding Updates to ONP-2100 and ONP-2200

As part of this document's publication:

* **ONP-2100 (Article)** is updated to add `contributor_refs`
  (OPTIONAL, array of OID strings referencing Identity Objects),
  alongside the existing `byline` field, with `contributor_refs`
  preferred by an Identity-aware Node per Section 4.6 of that
  document (unchanged in substance, now fulfilled). Classified MINOR
  (additive) under ONP-0007 Section 4.1.
* **ONP-2200 (Media)** is updated to (a) add `creator_ref` (OPTIONAL,
  a single OID string referencing an Identity Object), alongside the
  existing `credit` field, and (b) correct Section 4.5, rule 3's
  prior text, which did not state the upgrade-path promise ONP-2100
  made for `byline`. This correction is noted here transparently:
  the omission was not identified until this document's drafting.
  Classified MINOR (additive) under ONP-0007 Section 4.1.

## 10.4 ONP-0002 Status: `eudi` Remains Reserved

Per Section 2.2, this document does not define the `eudi` Trust
Anchor Type ONP-0004 Section 4.6 reserved. No change is made to that
term's `reserved` status in ONP-0002. This is stated here explicitly
so that a reader checking the Terminology Registry and a reader
checking this document's own Scope reach the same, consistent
conclusion: `eudi` remains open work.

---

# Appendix A: Full Schema Reference

```json
{
  "content_type": "onp:companion:identity",
  "content": {
    "display_name": "string, REQUIRED",
    "role": "string, OPTIONAL",
    "bio": "string, OPTIONAL",
    "credentials": "array of strings, OPTIONAL, unverified",
    "profile_url": "string (URI), OPTIONAL",
    "avatar_ref": "string (OID), OPTIONAL",
    "contact": "string, OPTIONAL, URL preferred"
  }
}
```

# Appendix B: Publisher-Asserted Identity — Quick Reference

```
[ ] Identity Object signed by the SAME publisher who would
    reference it (no cross-publisher signing)
[ ] display_name present
[ ] avatar_ref, if present, is an OID pointing to a Media Object
[ ] contact, if present, prefers a URL over a raw personal address
[ ] Node treats this as "publisher vouches for this," never as
    "individual cryptographically controls this"
[ ] Node does NOT assume two same-named Identity Objects from
    different publishers are the same real person
```

---
*End of Document*
