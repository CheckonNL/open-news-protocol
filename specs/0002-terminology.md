Title: Open News Protocol (ONP): Terminology
Document Number: ONP-0002
Status: Working Draft
Version: 0.34.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document is the canonical terminology registry for the Open
News Protocol. It does not define term meanings itself — each term
is defined by exactly one owning specification, per the single-owner
rule established in ONP-0000 Section 3.4 — but it indexes every term
in use across the series, records which document owns it, and
provides the process by which a new specification registers a new
term. Where ONP-0000 states the rule that term ownership must be
singular, this document is the enforcement mechanism: the place that
rule is actually checked against.

---

# Status of This Document

This document is part of the ONP Foundation series (ONP-0000-0999).
It is normative with respect to process (Section 4) and is the
authoritative index of term ownership (Appendix A), but it is not
the authoritative source of any term's *definition* — for that,
consult the owning document listed in the registry. It supersedes
the informal placeholder registry that appeared as Section 14 of
`draft-onp-architecture-00`; any citation of that section SHOULD be
read as a citation of Appendix A of this document going forward.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

A term used inconsistently across a specification series is a
verification risk, not merely a readability problem: if two
documents define "Signature" differently, an implementer may
validate an Object against the wrong definition and believe it
verified when it did not. ONP-0000 Section 3.4 established the rule
that every term has exactly one owner. This document is where that
rule becomes checkable: a single table (Appendix A) that any author
or reviewer can consult to determine, before writing a new
definition, whether a term already has an owner.

---

# 2. Scope

## 2.1 In Scope

* the structure of a Registry Entry;
* the registration process for new terms;
* the current, complete index of owned terms across all published
  ONP specifications as of this document's version.

## 2.2 Out of Scope

This document does NOT define the meaning of any listed term beyond
a short, non-normative gloss for navigability. The normative
definition always lives in the owning document. This document also
does not define new terms of its own beyond the small set needed to
describe the registry itself (Section 3).

---

# 3. Terminology

This document owns the following terms:

**Term**
: A word or short phrase given a specific technical meaning
  somewhere in the ONP series (e.g. "OID", "Companion", "Pillar").

**Owning Document**
: The single ONP specification that defines a Term's authoritative
  meaning. Exactly one per Term (ONP-0000 Section 3.4).

**Registry Entry**
: A row in Appendix A recording a Term, its Owning Document, and a
  short gloss.

**Gloss**
: A short, non-normative, one-line description of a Term, included
  in the registry for navigability. A Gloss MUST NOT be treated as a
  definition; it is a pointer to one.

**Reserved Term**
: A Term listed in the registry with an Owning Document that has not
  yet been published (a forward reference). A Reserved Term MUST NOT
  be used with a specific meaning by any other document until its
  Owning Document is published.

---

# 4. Requirements

## 4.1 Registration Obligation

1. Any ONP specification that introduces a new Term MUST add a
   Registry Entry to Appendix A as part of that specification's
   publication, per ONP-0000 Section 3.4.
2. A specification MUST NOT introduce a Term that already has a
   Registry Entry owned by a different document. It MAY use an
   existing Term, consistent with its Owning Document's definition.
3. If a specification believes an existing Term's definition is
   wrong or incomplete, it MUST propose a change to that Term's
   Owning Document (via that document's own versioning process,
   ONP-0007), not redefine the Term locally.

## 4.2 Reservation

1. A Term MAY be listed in Appendix A as Reserved, with its intended
   future Owning Document named, before that document is published.
   This allows the roadmap in ONP-0000 Section 4.1 to pre-allocate
   vocabulary (e.g. "Corrections" is reserved for ONP-2700) without
   requiring every Foundation document to avoid the word entirely.
2. Reserving a Term does NOT define it. Any specification MUST treat
   a Reserved Term as undefined until its Owning Document is
   published, and MUST NOT rely on assumed meaning in the interim.

## 4.3 Deprecation and Withdrawal

1. A Term MUST NOT be removed from Appendix A once published; its
   status MAY be changed to `deprecated` or `withdrawn`, but the
   entry itself remains for historical traceability, consistent with
   the "NNNN MUST NOT be reused" principle in ONP-0000 Section 3.1.
2. A `deprecated` Term MAY still be used but SHOULD be migrated away
   from per its Owning Document's guidance.
3. A `withdrawn` Term MUST NOT be used in any new specification.

---

# 5. Object Model

A Registry Entry has the following structure:

| Field | Required | Description |
|---|---|---|
| `term` | REQUIRED | The exact term string, as used in specification text. |
| `owning_document` | REQUIRED | The ONP-NNNN document that defines it, or a named future document if Reserved. |
| `gloss` | REQUIRED | One-line, non-normative description. |
| `status` | REQUIRED | One of `active`, `reserved`, `deprecated`, `withdrawn`. |

---

# 6. Processing Model

## 6.1 Lookup Process

An author or implementer encountering an unfamiliar term in any ONP
specification resolves it by:

1. Consulting Appendix A of this document for the term's Owning
   Document.
2. Reading the term's authoritative definition in that Owning
   Document.
3. If the term is not listed, treating it as undefined and, if
   authoring a new specification, either registering it (Section
   4.1) or replacing it with an already-registered term.

## 6.2 Review-Time Enforcement

Per ONP-0003 Section 6.1 (Specification Review Against Principles),
the ONP-WG's Candidate-status review of any specification MUST
include a terminology check: every term the specification introduces
MUST be registered here with this document as a dependency update,
and every term it uses MUST already appear in Appendix A with a
different Owning Document, consistent with its published definition.
A specification MUST NOT advance to Candidate status with an
unregistered new term or a silently redefined existing one.

## 6.3 Interoperability

A shared, single-owner vocabulary is what allows independent
implementations of different ONP specifications to interoperate
semantically. Two Nodes built by different teams, each reading
"Signature" from ONP-1003's definition rather than from a locally
reinvented one, can be confident they mean the same cryptographic
property when they use the word — without this registry, that
confidence would depend on informal convention rather than a
checkable process.

---

# 7. Examples

## 7.1 Correct Registration

```
New specification: ONP-2400, Rights
New term introduced: "License Declaration"
Action: add Registry Entry:
  term: License Declaration
  owning_document: ONP-2400
  gloss: A structured statement of permitted uses attached to a
         News Object.
  status: active
```

## 7.2 Incorrect: Silent Redefinition

```
New specification: ONP-3300, Analytics
Attempts to define: "Signature" (already owned by ONP-1003)
Result: REJECTED at Candidate review per Section 6.2.
Correct action: ONP-3300 must use "Signature" as defined by
ONP-1003, or introduce a differently-named term (e.g.
"Analytics Attestation") if the concept is genuinely distinct.
```

## 7.3 Reserved Term Example

```
Term: "Correction"
Owning document: ONP-2700 (not yet published)
Status: reserved
Effect: ONP-0000 and other Foundation documents MAY use the word
"correction" descriptively (as in "corrections and retractions
linked to the original"), but MUST NOT assign it a specific
structural meaning until ONP-2700 is published and the entry's
status changes to active.
```

---

# 8. Security Considerations

This document's core security function is preventing terminology
drift, which is analyzed as a security concern in ONP-0000 Section
5.1 and is not repeated in full here. Concretely: this document is
the artifact that makes ONP-0000 Section 5.1's stated risk
detectable in practice, by giving reviewers a single table to check
new specifications against rather than relying on institutional
memory.

---

# 9. Privacy Considerations

This document defines no data fields and carries no privacy impact
of its own. Terms whose definitions involve personal data (e.g.
"Publisher Identity," to be owned by ONP-2300) are subject to
Privacy Considerations in their own owning documents, not here.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0000, Introduction — Section 3.4 (Terminology Ownership),
  Section 5.1 (terminology drift as a security risk).
* ONP-0001, Architecture — owns the architectural vocabulary listed
  in Appendix A (Core, Companion, Extension, and related terms).
* ONP-0003, Design Principles — Section 6.1 (specification review
  process) and Section 6.2 (interoperability process referenced in
  Section 6.3 of this document).

## 10.2 Historical Reference

* `draft-onp-architecture-00`, Section 14 ("Terminology Registry")
  — the informal placeholder this document formalizes and
  supersedes.

---

# Appendix A: Terminology Registry

## Registry meta-terms (owned by ONP-0002)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Term | ONP-0002 | A word or short phrase given a specific technical meaning somewhere in the ONP series. | active |
| Gloss | ONP-0002 | The one-line summary of a Term's meaning recorded in Appendix A. | active |
| Owning Document | ONP-0002 | The single specification in which a Term's authoritative definition lives. | active |
| Registry Entry | ONP-0002 | A row in Appendix A recording a Term, its Owning Document, and a Gloss. | active |
| Reserved Term | ONP-0002 | A Term listed in Appendix A before its Owning Document is published. | active |

## Foundation terms (owned by ONP-0000)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| ONP (Open News Protocol) | ONP-0000 | The overall architecture and specification series. | active |
| News Object | ONP-0000 (structurally defined in ONP-1000) | The unit of published content and its trust/rights/payment metadata. | active |
| Specification | ONP-0000 | A single ONP-nnnn document. | active |
| Series | ONP-0000 | The identifier range (Foundation/Core/Companion/Extension/Reference) a specification belongs to. | active |
| Working Group (ONP-WG) | ONP-0000 | The editorial body authoring and publishing ONP specifications. | active |
| Node | ONP-0000 | Any system that creates, signs, stores, verifies, or relays News Objects. | active |
| Pillar | ONP-0000 | One of the four foundational commitments: Trusted News, Open Distribution, Rights, Payments. | active |

## Architecture terms (owned by ONP-0001)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Layer | ONP-0001 | One of the three architectural tiers: Core, Companion, Extension. | active |
| Core | ONP-0001 | The layer owning Object truth: identity, integrity, lineage, signature. | active |
| Companion | ONP-0001 | A specification defining an independent domain object model with its own identity/lifecycle. | active |
| Extension | ONP-0001 | A specification adding domain meaning to an existing Object without its own identity. | active |
| Vertical Invariant | ONP-0001 | The rule that no Companion or Extension may override Core. | active |
| Horizontal Invariant | ONP-0001 | The rule that Extensions/Companions may not override each other's domain truth. | active |
| onp:extensions | ONP-0001 | The reserved container field carrying Extension data on a News Object. | active |
| OID (Object Identifier) | ONP-0001 (structurally defined in ONP-1001) | The globally unique identifier of a News Object. | active |
| VID (Version Identifier) | ONP-0001 (structurally defined in ONP-1001) | The identifier of a specific version in an Object's lineage. | active |
| Signature | ONP-0001 (structurally defined in ONP-1003) | The cryptographic proof of an Object's origin and integrity. | active |
| Tombstone state | ONP-0001 (realized by the `lifecycle_state` field, value `retracted`; see ONP-1000 Section 4.5) | The Core-owned condition indicating an Object has been retracted; not a separate field from `lifecycle_state`. | active |
| Version lineage | ONP-0001 (mechanism defined in ONP-0006, ONP-1000/1001) | The Core-owned chain of an Object's successive versions. | active |

## Design Principles terms (owned by ONP-0003)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Principle | ONP-0003 | A numbered, binding design constraint on all ONP specifications. | active |
| Adjacent Publishing | ONP-0003 | The posture of deploying ONP alongside, not instead of, existing publisher systems (Principle P1). | active |
| Minimal Viable Object | ONP-0003 | The smallest field set a News Object can carry and remain verifiable (Principle P2). | active |
| Deviation | ONP-0003 | A formally recorded, WG-approved exception to a Principle. | active |
| Settlement | ONP-0003 | The actual execution of a payment, as distinct from the declaration of its terms (Principle P4). | active |

## Trust Model terms (owned by ONP-0004)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Trust Anchor | ONP-0004 | The mechanism by which a Node establishes that a signing key belongs to a claimed publisher. | active |
| Trust Anchor Type | ONP-0004 | A named resolution mechanism (`domain` REQUIRED; `eudi` reserved for ONP-2300). | active |
| Publisher Key Record | ONP-0004 (structurally finalized in ONP-1003) | The resolvable document listing a publisher's current and previous signing keys. | active |
| Current Keys | ONP-0004 | The set of keys a Publisher Key Record declares presently authorized. | active |
| Previous Keys | ONP-0004 | The set of keys a Publisher Key Record declares no longer current but valid within a historical window. | active |
| Resolution | ONP-0004 | The act of fetching, validating, and interpreting a Publisher Key Record. | active |
| Transparency Log | ONP-0004 | An optional, publicly readable, non-consensus, append-only record of key changes. | active |
| Record Fingerprint | ONP-0004 (added in v0.2.0) | The deterministic digest of a Publisher Key Record (sha-256 over its JCS canonical form), used for optional DNS corroboration. | active |

## Security Model terms (owned by ONP-0005)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Adversary | ONP-0005 | A party modeled as potentially acting against ONP's security properties. | active |
| Attack Class | ONP-0005 | A named category of attack technique against ONP's layered architecture. | active |
| Cryptographic Agility | ONP-0005 | The property that ONP does not hardcode a single mandatory algorithm indefinitely. | active |
| Downgrade Attack | ONP-0005 | An attack forcing acceptance of a weaker algorithm or Trust Anchor Type than actually declared. | active |
| Replay Attack (ONP-specific sense) | ONP-0005 | Resubmitting a superseded but validly signed Object version as if current. | active |
| Algorithm Registry | ONP-0005 (authoritative content in ONP-1003) | The WG-maintained list of recognized algorithm identifiers and their status. | active |
| Security Review | ONP-0005 | The mandatory adversary-model evaluation before a specification reaches Candidate status. | active |
| Security Advisory | ONP-0005 | A WG-published notice deprecating/forbidding an algorithm or flagging a vulnerability. | active |

## Lifecycle terms (owned by ONP-0006)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Lifecycle State | ONP-0006 | The status of a Version: `published`, derived `superseded`, or `retracted`. | active |
| News Object Version | ONP-0006 (structurally finalized in ONP-1000/1001) | A single signed instance within a lineage; not to be confused with a Specification's own `Version` field (ONP-0007). | active |
| Supersession | ONP-0006 | The publisher-attested relationship by which one Version replaces a prior one. | active |
| Current Version | ONP-0006 | The Version in a lineage not superseded and not retracted (Section 4.3 of ONP-0006). | active |
| Superseded Version | ONP-0006 | A derived, non-Current status; never set directly by a publisher. | active |
| Retraction | ONP-0006 | The terminal, publisher-attested withdrawal of an entire lineage from current status. | active |
| Revision Reason | ONP-0006 | An optional, lightweight, Core-level string explaining a supersession, pending ONP-2700. | active |
| Lineage Fork | ONP-0006 | The condition of two or more Versions each claiming to supersede the same prior Version. | active |

## Versioning Policy terms (owned by ONP-0007)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Pre-1.0 Phase | ONP-0007 | The period during which a Specification's Version remains below 1.0.0, governed by distinct rules from post-1.0. | active |
| Change Classification | ONP-0007 | Determining whether a proposed edit is MAJOR, MINOR, or PATCH. | active |
| Status Transition | ONP-0007 | Moving a Specification from one Status level to the next, subject to stated preconditions. | active |
| Version History Entry | ONP-0007 | A recorded Version change: number, date, classification, and summary. | active |

## Core terms (owned by ONP-1000)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Envelope | ONP-1000 | The complete top-level JSON structure of a News Object. | active |
| Content Region | ONP-1000 | The `content` field: opaque to Core, schema owned by the named Companion. | active |
| Content Type | ONP-1000 | The namespaced identifier (`onp:companion:<name>`) declaring which Companion defines `content`'s schema. | active |
| Publisher Reference | ONP-1000 | The `publisher` field: domain and key identifier used for Trust Anchor resolution (ONP-0004). | active |
| Claimed Signing Time (`signed_at`) | ONP-1000 (added in v0.2.0; consumed by ONP-0004 and ONP-1003) | The ISO 8601 UTC timestamp a publisher claims as this Version's signing time. | active |

## Identifiers terms (owned by ONP-1001)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Local Identifier | ONP-1001 | The publisher-chosen component of an OID, unique within that publisher's own domain namespace. | active |
| VID Pre-Image | ONP-1001 (mechanism generalized in ONP-1002 as the `vid-preimage` Pre-Image Profile) | The canonical serialization of an envelope excluding `vid` and `signature`, used to compute VID. | active |

## Serialization terms (owned by ONP-1002)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Canonical Form | ONP-1002 | The deterministic byte sequence RFC 8785 (JCS) produces for a JSON value. | active |
| Pre-Image Profile | ONP-1002 | A named, registered set of excluded top-level fields used to construct a Pre-Image. | active |
| Pre-Image | ONP-1002 | The Canonical Form bytes resulting from applying a Pre-Image Profile. | active |

## Digital Signatures terms (owned by ONP-1003)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Signature String | ONP-1003 | The exact wire encoding of the `signature` field: `onp:sig:<algorithm-id>:<digest>`. | active |

## Validation terms (owned by ONP-1004)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Validation Level | ONP-1004 | One of Core, Companion, Extension, or Application. | active |
| Core-Authenticated | ONP-1004 (used descriptively since ONP-1003) | Status of an Object that has passed every Core-level check. | active |
| Validation Result | ONP-1004 | The structured output of running an Object through every implemented Validation Level. | active |
| Extension Conflict | ONP-1004 | A detected Horizontal Invariant violation between two Extensions on the same Object. | active |

## Core Metadata terms (owned by ONP-1005)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Core Metadata | ONP-1005 | The `onp:metadata` container and its fields: `language`, `title`, `summary`, `tags`. | active |
| Generic Field | ONP-1005 | A Core Metadata field, Companion-agnostic by design. | active |

## Retrieval terms (owned by ONP-1006)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Object URL | ONP-1006 | The canonical HTTPS URL at which a News Object's current Version is retrievable, derived mechanically from its OID. | active |
| Version URL | ONP-1006 | The optional HTTPS URL at which one specific Version is retrievable, derived from OID and VID. | active |

## Companion Framework terms (owned by ONP-2000)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Companion Namespace | ONP-2000 | A registered `content_type` identifier of the form `onp:companion:<name>`. | active |
| Object Reference | ONP-2000 | A field value consisting of another News Object's OID or VID (ONP-2000 v0.2.0), relating two Objects without transferring ownership. | active |
| Reference Target | ONP-2000 | The News Object an Object Reference's OID identifies. | active |

## Article terms (owned by ONP-2100)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Article (Companion) | ONP-2100 | content_type = "onp:companion:article" — the first published content Companion. | active |
| Article Object | ONP-2100 | Informal name for a News Object whose content_type is onp:companion:article. | active |
| Safe Markdown Subset | ONP-2100 | CommonMark with raw HTML blocks and inline HTML disallowed. | active |

## Media terms (owned by ONP-2200)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Media (Companion) | ONP-2200 | content_type = "onp:companion:media" — photos, video, and audio. | active |
| Media Object | ONP-2200 | Informal name for a News Object whose content_type is onp:companion:media. | active |
| Verified Asset Reference | ONP-2200 | Pairing an externally-hosted asset's URL with a content hash, reusable by future Companions. | active |
| Asset Hash | ONP-2200 | The `asset_hash` field: a hash of an externally-hosted asset's actual bytes. | active |

## Identity terms (owned by ONP-2300)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Identity (Companion) | ONP-2300 | content_type = "onp:companion:identity" — a publisher-asserted contributor record. | active |
| Identity Object | ONP-2300 | Informal name for a News Object whose content_type is onp:companion:identity. | active |
| Publisher-Asserted Identity | ONP-2300 | The trust model: an Identity Object proves the publisher vouches for it, not that the individual controls a key. | active |
| Contributor Reference | ONP-2300 | An Object Reference from an Article or Media Object to an Identity Object. | active |

## Rights terms (owned by ONP-2400)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Rights (Companion) | ONP-2400 | content_type = "onp:companion:rights" — a declarative, jurisdiction-neutral license/permissions record. | active |
| Rights Object | ONP-2400 | Informal name for a News Object whose content_type is onp:companion:rights. | active |
| License Reference | ONP-2400 | The authoritative license statement: `license_identifier`, `license_url`, or both. | active |
| Permission Flag | ONP-2400 | An OPTIONAL boolean convenience field, never authoritative over the License Reference. | active |

## Payments terms (owned by ONP-2500)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Payments Object | ONP-2500 | Informal name for a News Object whose content_type is onp:companion:payments. | active |
| Payment Model | ONP-2500 | The `payment_model` field: a declared category, never a settlement mechanism. | active |
| Revenue Share | ONP-2500 | A declared, partial allocation of payment proceeds to a named recipient. | active |
| Payment Provider Hint | ONP-2500 | A non-exclusive, informational pointer to a compatible Payment Provider. | active |

## Sources terms (owned by ONP-2600)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Source Object | ONP-2600 | Informal name for a News Object whose content_type is onp:companion:sources. | active |
| Visibility (Sources sense) | ONP-2600 | The `visibility` field: `named`/`anonymous`/`protected`, governing identifying-information constraints. | active |
| Protected Source | ONP-2600 | A Source Object with `visibility: "protected"`, signaling an explicit confidentiality commitment. | active |

## Corrections terms (owned by ONP-2700)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Corrections Object | ONP-2700 | Informal name for a News Object whose content_type is onp:companion:corrections. | active |
| Corrected Version | ONP-2700 | The exact, VID-pinned prior Version a Corrections Object identifies as erroneous. | active |
| Correcting Version | ONP-2700 | The exact, VID-pinned Version that fixed it. | active |

## Comments terms (owned by ONP-2800)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Comment Object | ONP-2800 | Informal name for a News Object whose content_type is onp:companion:comments. | active |
| Publisher-Attested Comment | ONP-2800 | A Comment Object's trust model, reusing ONP-2300's Publisher-Asserted Identity pattern. | active |

## Extension Framework terms (owned by ONP-3000)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Extension Namespace | ONP-3000 | A registered `org.onp.<name>` identifier under which an Extension's fields are carried. | active |
| Claim Domain | ONP-3000 | A named category of assertion an Extension makes, enabling mechanical overlap detection. | active |

## AI Metadata terms (owned by ONP-3100)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| org.onp.ai-metadata | ONP-3100 | Extension Namespace for AI generation disclosure and training/agent-use permission. | active |
| ai-generation-disclosure (Claim Domain) | ONP-3100 | Assertions about how content was produced. | active |
| ai-training-permission (Claim Domain) | ONP-3100 | Assertions about downstream AI training/agent use of content. | active |

## Search terms (owned by ONP-3200)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| org.onp.search | ONP-3200 | Extension Namespace for indexing consent and search snippet. | active |
| search-indexing-consent (Claim Domain) | ONP-3200 | Assertions about whether/how content may be indexed for search. | active |

## Analytics terms (owned by ONP-3300)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| org.onp.analytics | ONP-3300 | Extension Namespace for tracking-methodology transparency disclosure. | active |
| analytics-tracking-disclosure (Claim Domain) | ONP-3300 | Assertions about how engagement with content is tracked. | active |

## Geolocation terms (owned by ONP-3400)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| org.onp.geolocation | ONP-3400 | Extension Namespace for story subject-matter location. | active |
| geographic-subject-matter (Claim Domain) | ONP-3400 | Assertions about where a story's subject matter is located. | active |

## Accessibility terms (owned by ONP-3500)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| org.onp.accessibility | ONP-3500 | Extension Namespace for accessibility alternatives (transcript, captions, plain-language, etc.). | active |
| accessibility-alternatives (Claim Domain) | ONP-3500 | Assertions pointing to alternative, accessible representations of content. | active |

## Reference Implementation terms (owned by ONP-9000)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Reference Implementation | ONP-9000 | A working implementation demonstrating the specification text is sufficient on its own. | active |
| Test Vector | ONP-9000 | A published example input/output pair implementations can self-check against. | active |

## Security Checklist terms (owned by ONP-9002)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Conformance Test (implementation sense) | ONP-9002 | A check verifying a running implementation enforces a stated security requirement, distinct from spec-level Security Review. | active |

## Performance terms (owned by ONP-9003)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Resolution Fan-out | ONP-9003 | The pattern by which following every Object Reference on one Object triggers many independent resolutions. | active |

## Migration terms (owned by ONP-9004)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Migration Guidance | ONP-9004 | The structured explanation required to accompany any MAJOR version bump to a Standards-Track specification. | active |

## Reserved terms (future documents)

| Term | Owning Document | Gloss | Status |
|---|---|---|---|
| Correction | ONP-2700 | Realized as the Corrections Object (ONP-2700 Section 3); this placeholder gloss is superseded by that term's actual definition. | active |
| Rights Declaration | ONP-2400 | Realized as the Rights Object / License Reference (ONP-2400 Sections 3, 4.4); this placeholder gloss is superseded by those terms' actual definitions. | deprecated |
| Payment Terms | ONP-2500 | Realized as the Payments Object / Payment Model (ONP-2500 Section 3); this placeholder gloss is superseded by those terms' actual definitions. | deprecated |
| eudi (Trust Anchor Type) | ONP-2300 | Normative binding of the EU Digital Identity Wallet as an alternative Trust Anchor Type, reserved by ONP-0004 Section 4.6. ONP-2300 Section 2.2 explicitly acknowledges this is not yet defined. | reserved |

Note: illustrative namespace strings from `draft-onp-architecture-00`
(e.g. `org.onp.licensing`, `org.onp.media-rights`, `org.onp.syndication`)
are NOT registered here, as they do not correspond one-to-one with
the current roadmap in ONP-0000 Section 4.1. The authoritative
namespace identifier for each Companion or Extension will be
registered when that document is published.

---

# Appendix: Version History

Per ONP-9001 Section 5.1's recommendation that specifications
maintain a Version History appendix, and to explain why this
document's `Version` is far higher than most others in the series:
every publication of a new Companion or Extension registers new
terms here (ONP-0002 Section 4.1's registration obligation), and
ONP-0007 Section 4.4, rule 1 classifies each such addition as its
own MINOR bump. This document is therefore expected to have the
highest version number in the series by construction, not by error —
its version number is a direct, visible count of how many
specifications have been published so far, one MINOR bump per
document (with occasional additional PATCH bumps for gloss
corrections, e.g. the Tombstone state and VID Pre-Image entries).

| Version | Classification | Trigger |
|---|---|---|
| 0.1.0 | — | Initial publication |
| 0.2.0-0.4.0 | MINOR (×3) | Registry entries for ONP-0001, ONP-0003, ONP-0004 |
| 0.5.0-0.9.0 | MINOR (×5) | Registry entries for ONP-0005-0007, ONP-1000-1003 |
| 0.10.0-0.16.0 | MINOR (×7) | Registry entries for ONP-1004-1005, ONP-2000-2500 |
| 0.17.0-0.26.0 | MINOR (×10) | Registry entries for ONP-2600-3500 |
| 0.27.0-0.30.0 | MINOR (×4) | Registry entries for ONP-9000-9004 |
| 0.31.0 | MINOR | **Known bookkeeping gap:** this bump is present in the document header's history but its change summary was never recorded here — a violation of this document's own Section 4.1 discipline, noted rather than reconstructed. Candidate cause: an unlogged registration round; no ONP-9005 terms appear in Appendix A, so it was not that. |
| 0.32.0 | MINOR | Registry entry for Record Fingerprint (ONP-0004 v0.2.0) |
| 0.33.0 | MINOR | Registered this document's own five meta-terms (Term, Gloss, Owning Document, Registry Entry, Reserved Term) — Appendix A previously did not practice its own Section 4.2 rule on itself. Also set the self-described placeholder rows 'Rights Declaration' and 'Payment Terms' to `deprecated`: their glosses already stated they were superseded by ONP-2400/2500's actual terms, but their status was never updated. Both caught by `tools/check-specs.py` |
| 0.34.0 | MINOR | Registry entries for ONP-1006 (Object URL, Version URL) |
| (various PATCH bumps interleaved) | PATCH | Gloss corrections: Tombstone state (ONP-1000), VID Pre-Image precision (ONP-1002) |

This table summarizes rather than itemizes every single bump; the
full per-term history is reconstructable from each citing
specification's own "Corresponding Update to ONP-0002" references
section, not repeated exhaustively here.

---
*End of Document*
