Title: Open News Protocol (ONP): News Object
Document Number: ONP-1000
Status: Working Draft
Version: 0.3.1
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document defines the News Object envelope: the top-level wire
structure every ONP Object MUST use, composed of Core State (owned
by this document, with exact formats delegated to ONP-1001 and
ONP-1003), an opaque Content region (owned by whichever Companion a
`content_type` identifier names), and the OPTIONAL Extensions
container already structurally defined in ONP-0001. It finalizes,
as authoritative wire format, the lifecycle fields ONP-0006
introduced illustratively, and the Minimal Viable Object field list
Principle P2 (ONP-0003) requires to exist but did not itself specify.
It also resolves a naming overlap the Terminology Registry carried
since ONP-0001: "Tombstone state" is not a second field alongside
`lifecycle_state` — it is the name for what `lifecycle_state:
retracted` is.

---

# Status of This Document

This document is part of the ONP Core series (ONP-1000-1999). Unlike
the Foundation series, it is directly implementable: a conforming
Node can be built against this document, ONP-1001, and ONP-1003
alone and correctly parse and Core-validate any News Object,
independent of which Companions or Extensions that Object also
carries (ONP-0001 Section 6.5). It is a Working Draft.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

Every prior Foundation document described the News Object's shape
illustratively and deferred its authoritative form here: ONP-0001
sketched the three-region envelope (Core State, Content, Extensions);
ONP-0004 illustrated a `publisher` reference without fixing its
field names; ONP-0006 defined `lifecycle_state`, `supersedes`,
`revision_reason`, and `republish_of_retraction` as mechanism, noting
their wire format was "structurally finalized in ONP-1000/1001."
This document is where those deferrals are collected and fixed.

---

# 2. Scope

## 2.1 In Scope

* the top-level envelope structure and its required/optional keys;
* the Core State field list this document owns directly (`publisher`
  reference) and the fields it finalizes on behalf of ONP-0006
  (lifecycle fields);
* the Minimal Viable Object's exact field list (finalizing the term
  ONP-0003 owns, per Section 4.2);
* the Content region's opacity requirement relative to Core
  validation;
* the `content_type` namespace identifier scheme;
* the reconciliation of "Tombstone state" with `lifecycle_state`.

## 2.2 Out of Scope

This document does NOT define:

* the exact OID/VID generation algorithm or string format (ONP-1001);
* canonical serialization/byte encoding for signing (ONP-1002);
* the signature computation, algorithm registry entries, or
  signature field's exact encoding (ONP-1003);
* the multi-level validation procedure itself, beyond restating that
  Content MUST remain opaque to it (ONP-1004);
* any specific Companion's Content schema (e.g. Article, ONP-2100)
  or any Extension's fields under `onp:extensions`.

---

# 3. Terminology

This document is the owning specification for the following terms.

**Envelope**
: The complete top-level JSON structure of a News Object: Core
  State fields, the `content` region, and the OPTIONAL
  `onp:extensions` container, all as direct siblings at the top
  level (Section 5.1).

**Content Region**
: The `content` field: opaque to Core, its schema owned entirely by
  whichever Companion the Object's `content_type` names.

**Content Type**
: The namespaced identifier (Section 4.4) declaring which Companion
  specification defines the schema of `content`.

**Publisher Reference**
: The `publisher` field: the Core-owned pointer (domain and key
  identifier) a Node uses to perform Trust Anchor resolution per
  ONP-0004.

**Claimed Signing Time**
: The `signed_at` field: the ISO 8601 UTC timestamp a publisher
  claims as this Version's signing time (Section 5.1, rule on
  `signed_at`), consumed by ONP-0004's key-rotation validity-window
  check and ONP-1003's verification procedure. Added as a field in
  v0.2.0; this formal term entry completes that change in v0.3.1
  (PATCH: the ONP-0002 Appendix A row for this term already named
  this document as owner, but no definition existed here — a
  registry/definition drift caught by `tools/check-specs.py`).

Terms used but owned elsewhere: **News Object** (ONP-0000, this
document supplies its structural definition), **Minimal Viable
Object** (ONP-0003, this document supplies its concrete field list
in Section 4.2), **Lifecycle State**, **Supersession**, **Revision
Reason** (ONP-0006, this document supplies their wire format in
Section 5.1), **Tombstone state** (ONP-0001; Section 4.5 of this
document resolves its relationship to `lifecycle_state`).

---

# 4. Requirements

## 4.1 Envelope Structure

1. A News Object MUST be a single JSON object at its top level.
2. The following top-level keys are REQUIRED on every News Object:
   `oid`, `vid`, `publisher`, `signed_at`, `signature`,
   `content_type`, `content`.
3. The following top-level keys are OPTIONAL: `lifecycle_state`,
   `supersedes`, `revision_reason`, `republish_of_retraction`,
   `onp:extensions`, `onp:metadata` (added in v0.3.0; see ONP-1005).
4. A Node MUST NOT require any key beyond those listed in rules 2
   and 3 to be present for an Object to be considered structurally
   well-formed at the envelope level; a Companion or Extension MAY
   require additional keys within `content` or within its own
   `onp:extensions` namespace, but MUST NOT require a new top-level
   envelope key (this would violate ONP-0001 Section 4.1, rule 3 —
   no Companion or Extension may introduce a field that shadows or
   sits alongside Core-owned envelope structure without going
   through this document's own versioning process, ONP-0007).
5. `signed_at` MUST be an ISO 8601 UTC timestamp string, stating the
   time the publisher claims to have signed this Version. It is the
   value ONP-0004 Section 4.4 uses as `T` when checking a signing
   key's validity window, and the value ONP-1003 (Digital
   Signatures) consumes as the claimed signing time during
   verification. It MUST participate in the signing pre-image
   (ONP-1003 Section 4.1) exactly like any other included field;
   its authenticity is protected by the same signature that protects
   the rest of the envelope, not by any separate mechanism.

## 4.2 Minimal Viable Object

Per Principle P2 (ONP-0003), this document fixes the Minimal Viable
Object as exactly the seven REQUIRED keys in Section 4.1, rule 2,
with no other key present:

```
oid, vid, publisher, signed_at, signature, content_type, content
```

A Node MUST accept an Object containing only these seven keys as
structurally complete, provided each satisfies its own field-level
requirements (Section 5.1). An absent `lifecycle_state` MUST be
interpreted as `published`; an absent `supersedes` MUST be
interpreted as "first Version in its lineage" (ONP-0006 Section 4.2,
rule 1). This absence-has-meaning design keeps the truly minimal
case free of any lifecycle bookkeeping a first-time publisher does
not yet need.

**Correction note (v0.2.0):** version 0.1.0 of this document omitted
`signed_at`, a field ONP-0004's key rotation validity-window check
(Section 4.4 of that document) requires to determine whether an
Object's signing key was valid at the time it claims to have signed.
This gap surfaced while drafting ONP-1003 and is corrected here; see
Section 10.3.

## 4.3 Publisher Reference

1. `publisher` MUST be an object with, at minimum, a `domain` field
   (the value used for Trust Anchor resolution per ONP-0004 Section
   4.2) and a `key_id` field (the key identifier used to look up the
   signing key within that domain's Publisher Key Record).
2. A Node MUST use `publisher.domain` and `publisher.key_id` exactly
   as ONP-0004 Section 6.1 (Resolution Algorithm) consumes `D` and
   `K` respectively; this document does not introduce a second,
   competing way to express publisher identity.

## 4.4 Content Region and Content Type

1. `content` MUST be opaque to Core-level validation: a Node MUST be
   able to complete Core validation (ONP-0001 Section 6.2, level 1)
   —structural well-formedness, signature validity, Trust Anchor
   resolution — without parsing or understanding the internal
   structure of `content`.
2. `content_type` MUST be a namespaced identifier of the form
   `onp:companion:<name>` (e.g. `onp:companion:article`), naming the
   Companion specification that defines `content`'s schema. This
   mirrors the `org.onp.<name>` namespacing ONP-0001 Section 4.3
   requires for Extensions, applied here to Companions instead.
3. A Node encountering a `content_type` it does not recognize MUST
   still complete Core validation successfully (per rule 1) and MUST
   NOT reject the Object solely for unrecognized content_type; it
   MAY decline to interpret or display `content` meaningfully, but
   the Object remains authentically verified at the Core level. This
   is the concrete mechanism behind the interoperability guarantee
   pattern established in ONP-0001 Section 6.5, ONP-0004 Section
   6.4, and ONP-0006 Section 6.3.

## 4.5 Lifecycle Fields and Tombstone State Reconciliation

1. `lifecycle_state`, `supersedes`, `revision_reason`, and
   `republish_of_retraction` MUST use exactly the semantics ONP-0006
   Sections 4.1 through 4.5 define, with the wire-level field names
   given in Section 5.1 of this document.
2. The term "Tombstone state," owned by ONP-0001 and referenced in
   this document's Terminology Registry entry as "structurally
   defined in ONP-1000," is hereby resolved as follows: Tombstone
   state is not a separate field. It is the descriptive Core-
   ownership name for the condition `lifecycle_state == "retracted"`.
   No News Object carries both a `lifecycle_state` field and a
   distinct `tombstone` field; a specification or implementation
   that introduces a second, redundant field for this purpose is
   non-conformant.
3. ONP-0002's registry gloss for "Tombstone state" is updated
   alongside this document's publication to reflect this
   resolution (see Section 10.3).

---

# 5. Object Model

## 5.1 Full Envelope Schema (Authoritative)

```json
{
  "oid": "string, REQUIRED — exact format owned by ONP-1001",
  "vid": "string, REQUIRED — exact format owned by ONP-1001",
  "publisher": {
    "domain": "string, REQUIRED — e.g. regiopurmerend.nl",
    "key_id": "string, REQUIRED — e.g. onp:key:2026-07-01"
  },
  "signed_at": "string, REQUIRED — ISO 8601 UTC, e.g. 2026-07-28T10:00:00Z",
  "signature": "string, REQUIRED — exact encoding owned by ONP-1003",
  "content_type": "string, REQUIRED — e.g. onp:companion:article",
  "content": {
    "...": "opaque to Core; schema owned by the named Companion"
  },
  "lifecycle_state": "string, OPTIONAL, default 'published' — 'published' | 'retracted'",
  "supersedes": "string or absent, OPTIONAL — a prior vid in the same oid lineage",
  "revision_reason": "string, OPTIONAL",
  "republish_of_retraction": "string, OPTIONAL — a prior vid, only on a republish",
  "onp:extensions": {
    "...": "OPTIONAL — structure owned by ONP-0001 Section 5.2"
  },
  "onp:metadata": {
    "...": "OPTIONAL — structure owned by ONP-1005"
  }
}
```

## 5.2 Field Table

| Field | Required | Owning Document (exact format) |
|---|---|---|
| `oid` | REQUIRED | ONP-1001 |
| `vid` | REQUIRED | ONP-1001 |
| `publisher.domain` | REQUIRED | This document (Section 4.3); consumed by ONP-0004 |
| `publisher.key_id` | REQUIRED | This document (Section 4.3); consumed by ONP-0004 |
| `signed_at` | REQUIRED | This document (Section 4.1, rule 5); consumed by ONP-0004 and ONP-1003 |
| `signature` | REQUIRED | ONP-1003 |
| `content_type` | REQUIRED | This document (Section 4.4) |
| `content` | REQUIRED | Named Companion (e.g. ONP-2100) |
| `lifecycle_state` | OPTIONAL, default `published` | ONP-0006 (semantics); this document (wire form) |
| `supersedes` | OPTIONAL, default absent | ONP-0006 (semantics); this document (wire form) |
| `revision_reason` | OPTIONAL | ONP-0006 |
| `republish_of_retraction` | OPTIONAL | ONP-0006 |
| `onp:extensions` | OPTIONAL | ONP-0001 Section 5.2 |
| `onp:metadata` | OPTIONAL | ONP-1005 |

---

# 6. Processing Model

## 6.1 Parsing Order

```
1. Parse the top-level JSON object.
2. Confirm the six REQUIRED keys (Section 4.1, rule 2) are present
   and structurally valid per Section 5.2.
   -> FAIL (structural) if any is missing or malformed.
3. Apply defaults for absent OPTIONAL keys (Section 4.2).
4. Hand oid/vid to ONP-1001 processing; hand signature + publisher
   to ONP-1003/ONP-0004 processing for cryptographic and Trust
   Anchor verification.
5. Only after step 4 succeeds does a Node proceed to interpret
   `content` (per content_type, Companion-owned) or
   `onp:extensions` (per namespace, Extension-owned) — consistent
   with the three-level validation ordering in ONP-0001 Section 6.2.
```

## 6.2 Content Opacity Enforcement

A Node's Core-validation code path MUST NOT branch on the contents
of `content`. This is an implementation discipline as much as a wire
rule: an implementation that inspects `content` to decide whether an
Object is "trustworthy" has reintroduced exactly the layer confusion
ONP-0001's Vertical Invariant and ONP-0005 Section 4.5 prohibit.
Core trust and Content interpretation MUST remain separate code
paths.

## 6.3 Interoperability

A Node implementing only ONP-1000, ONP-1001, and ONP-1003 — with no
support for any specific Companion or Extension — MUST be able to:
verify any News Object's signature, resolve its Trust Anchor,
determine its Current Version within a known set (per ONP-0006), and
correctly report it as untrusted if any of those fail — all without
understanding a single `content_type` or `onp:extensions` namespace.
This is the concrete, testable form of the interoperability
guarantee every prior Foundation document promised in the abstract.

---

# 7. Examples

## 7.1 Minimal Viable Object

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
    "body_ref": "https://regiopurmerend.nl/artikel/fusie-onderzoek"
  }
}
```

No `lifecycle_state` present -> a Node MUST interpret this as
`published`. No `supersedes` present -> a Node MUST interpret this
as the first Version in its lineage.

## 7.2 A Correction (Second Version in a Lineage)

```json
{
  "oid": "onp:oid:regiopurmerend.nl:fusie-onderzoek-necker-van-naem",
  "vid": "onp:vid:sha-256:XyZ789-example-digest-bytes",
  "supersedes": "onp:vid:sha-256:AbC123-example-digest-bytes",
  "revision_reason": "Cijfer in tweede alinea gecorrigeerd",
  "publisher": { "domain": "regiopurmerend.nl", "key_id": "onp:key:2026-07-01" },
  "signed_at": "2026-07-29T08:00:00Z",
  "signature": "onp:sig:ed25519:base64url-signature-bytes-of-this-version",
  "content_type": "onp:companion:article",
  "content": { "headline": "Fusie-onderzoek Purmerend gepubliceerd (gecorrigeerd)", "body_ref": "..." }
}
```

Same `oid`, new `vid`, `supersedes` pointing at the prior `vid`.
Applying ONP-0006 Section 6.1's algorithm to both Objects together
correctly identifies this Version as Current and the first as
Superseded.

## 7.3 Unrecognized content_type, Still Core-Valid

```
A Node with no Media Companion support receives:
  content_type: "onp:companion:media"
Per Section 4.4, rule 3: the Node completes Core validation
normally (signature + Trust Anchor resolution both succeed) and
reports the Object as authentically verified, while declining to
render or interpret `content` meaningfully.
```

---

# 8. Security Considerations

Content opacity (Section 4.4, rule 1; Section 6.2) is a direct
security control, not merely an architectural nicety: it is what
makes it structurally impossible for a malicious or buggy Companion
implementation to affect whether an Object is judged authentic. This
restates, at the wire-field level, the Vertical Invariant already
analyzed in ONP-0001 Section 8 and ONP-0005 Section 4.5; it is not a
new risk, but this document is where the enforcement point actually
lives in code, so it is restated here for implementers who read Core
documents without necessarily re-reading Foundation security
analysis.

The `publisher` reference (Section 4.3) is the exact handoff point
into ONP-0004's Trust Anchor resolution; a Node MUST treat a News
Object whose `publisher.domain` cannot be resolved, or whose
`publisher.key_id` is not found current or historically valid per
ONP-0004 Section 6.1, as unverified — this document introduces no
new trust logic of its own, it only fixes the field names ONP-0004's
already-normative algorithm consumes.

---

# 9. Privacy Considerations

The REQUIRED envelope fields (Section 4.1, rule 2) carry minimal
personal data: `publisher.domain` identifies an organization, not an
individual; `oid`, `vid`, `signature`, and `content_type` carry none.
This is a direct consequence of Principle P2 (Minimal Required
Surface) as applied concretely by Section 4.2 of this document — any
personally identifying content is confined to the opaque `content`
region (governed by whichever Companion defines it, e.g. ONP-2300)
or to `onp:extensions`, neither of which this document requires to
be populated.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0000, Introduction — owns the term "News Object"; this
  document supplies its structural definition.
* ONP-0001, Architecture — Core ownership rules (Section 4.1), the
  `onp:extensions` container (Section 5.2), and the interoperability
  guarantee pattern (Section 6.5) this document instantiates
  concretely.
* ONP-0003, Design Principles — Principle P2 (Minimal Required
  Surface), owning "Minimal Viable Object," whose exact field list
  this document fixes in Section 4.2.
* ONP-0004, Trust Model — the Resolution Algorithm (Section 6.1)
  this document's `publisher` field (Section 4.3) feeds directly.
* ONP-0005, Security Model — Section 4.5 (layer confusion),
  restated at the field level in Section 8 of this document.
* ONP-0006, News Object Lifecycle — owns the semantics of
  `lifecycle_state`, `supersedes`, `revision_reason`, and
  `republish_of_retraction`; this document fixes their wire form.

## 10.2 Informative References

* ONP-1001, Identifiers (forward reference — exact `oid`/`vid`
  format).
* ONP-1002, Serialization (forward reference — canonical byte
  encoding for signing).
* ONP-1003, Digital Signatures (forward reference — exact
  `signature` field encoding and Algorithm Registry).
* ONP-1004, Validation — the full multi-level
  validation procedure this document's Section 6.1 outlines only at
  the parsing-order level).
* ONP-2100, Article (forward reference — an example Companion
  defining a `content_type` schema, used in Section 7).

## 10.3 Corresponding Update to ONP-0002

As part of this document's publication, ONP-0002's registry gloss
for "Tombstone state" is updated to state that it is realized by the
`lifecycle_state` field (value `retracted`) rather than a separate
field, per Section 4.5 of this document. This is a PATCH-level
change under ONP-0007 Section 4.4, rule 2 (gloss correction, no
change of owning document or substantive meaning — the concept
Tombstone state names was always this condition; only its wire
realization is now stated precisely).

## 10.4 Version 0.2.0 Classification

The addition of `signed_at` as a seventh REQUIRED envelope field
(Section 4.1, rule 5; Section 4.2) invalidates any prior
understanding of this document's Minimal Viable Object as a
six-field structure. Per ONP-0007 Section 4.2 (pre-1.0 semantics),
this is classified MINOR — not MAJOR, since this document remains
below Version 1.0.0 — with this explicit callout satisfying ONP-0007
Section 4.2, rule 4's requirement that a pre-1.0 change meeting the
MAJOR criteria be called out in prose rather than left to the
version number alone to convey.

## 10.5 Version 0.3.0 Classification

The addition of `onp:metadata` as an OPTIONAL top-level key (per
ONP-1005) does not invalidate any previously valid News Object — the
Minimal Viable Object (Section 4.2) remains the same seven REQUIRED
fields. This is classified MINOR under ONP-0007 Section 4.1
(additive, backward-compatible) and does not require the explicit-
breaking-change callout Section 10.4 needed, since no MAJOR-level
criterion is met.

---

# Appendix A: Minimal Viable Object Checklist

```
[ ] oid present and well-formed (ONP-1001)
[ ] vid present and well-formed (ONP-1001)
[ ] publisher.domain present
[ ] publisher.key_id present
[ ] signed_at present, ISO 8601 UTC
[ ] signature present and well-formed (ONP-1003)
[ ] content_type present, namespaced onp:companion:<name>
[ ] content present (opaque, per content_type's Companion)
[ ] no envelope key beyond the seven required + the four OPTIONAL
    lifecycle/extensions keys listed in Section 4.1
```

# Appendix B: Absence-Has-Meaning Defaults

```
Field                     | Absent means
--------------------------|--------------------------------------
lifecycle_state           | published
supersedes                | first Version in its lineage (no prior)
revision_reason           | no reason stated (permitted; not an error)
republish_of_retraction   | this Version is not a republish
onp:extensions            | no Extensions attached
onp:metadata              | no generic Companion-agnostic metadata stated
```

---
*End of Document*
