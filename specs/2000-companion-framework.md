Title: Open News Protocol (ONP): Companion Framework
Document Number: ONP-2000
Status: Working Draft
Version: 0.2.2
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document is the entry point to the ONP Companion series
(ONP-2100-2800). It does not define any specific Companion — not
Article, not Media, not Rights — but fixes the scaffolding every
Companion specification MUST share: the `content_type` namespace
registration process, mandatory additions to the universal
specification template (ONP-0000 Section 3.2) that every Companion
document MUST include, and the Object Reference mechanism by which
one News Object points to another by OID. That last piece closes a
gap: the informal architecture draft this series formalizes
(`draft-onp-architecture-00`) had a Relationship Model section that
ONP-0001's formalization did not carry forward. This document is
where it is restored, in the place it actually belongs — the
Companion series is where cross-Object relationships (an Article
referencing Media, an Event referencing Sources) will be used
constantly.

---

# Status of This Document

This document is part of the ONP Companion series (ONP-2000-2999)
and is its framework document, numbered 2000 per the roadmap
(ONP-0000 Section 4.1). It is normative and binding on every future
Companion specification. It is a Working Draft.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

Core (ONP-1000-1005) is now complete, small, and — per Principle P6
(Core Immutability Bias, ONP-0003) — meant to stay that way. Every
domain-specific concept the roadmap names (Article, Media, Identity,
Rights, Payments, Sources, Corrections, Comments) belongs in a
Companion instead. Before any of those are written, this document
fixes what they all have in common, so that each individual
Companion specification can focus entirely on its own domain content
rather than re-deriving registration process, template structure, or
cross-referencing mechanics independently.

---

# 2. Scope

## 2.1 In Scope

* the `content_type` namespace registration process;
* mandatory additions every Companion specification MUST make to
  the universal template (ONP-0000 Section 3.2);
* the Object Reference mechanism: how a field within `content` (or
  within an Extension namespace) points to another News Object by
  OID, and what that reference does and does not imply.

## 2.2 Out of Scope

This document does NOT define:

* any specific Companion's content schema (ONP-2100 onward);
* the Companion-vs-Extension decision test itself, which remains
  normatively owned by ONP-0001 Section 4.4 — this document only
  requires that test be explicitly reapplied and its result stated
  in every new Companion's own Scope section (Section 4.2);
* Extension namespace registration, which is ONP-3000's concern, not
  this document's, though the registration mechanics (Section 4.1)
  are deliberately similar so both series stay consistent.

---

# 3. Terminology

This document is the owning specification for the following terms.

**Companion Namespace**
: A registered `content_type` identifier of the form
  `onp:companion:<name>`, unique across the entire ONP series.

**Object Reference**
: A field value, within `content` or within an Extension namespace,
  consisting of another News Object's OID (lineage reference) or VID
  (exact-version reference), used to relate one Object to another
  without transferring ownership, custody, or control (Section 4.3).

**Reference Target**
: The News Object (or, for a VID-form reference, the exact Version)
  an Object Reference identifies. A Reference Target's existence, reachability, or validity is never a
  precondition for the referencing Object's own Core validity
  (Section 4.4).

---

# 4. Requirements

## 4.1 Companion Namespace Registration

1. Every Companion specification MUST register a unique
   `content_type` identifier of the form `onp:companion:<name>`,
   where `<name>` matches the grammar `1*32( ALPHA-LOWER / DIGIT /
   "-" )`, mirroring the algorithm-identifier grammar already fixed
   in ONP-1001 Appendix A for consistency across the series.
2. This registration MUST occur in ONP-0002, alongside that
   Companion's other new terms, as part of its own publication — no
   separate registry is introduced; a `content_type` identifier is
   registered exactly like any other ONP term (ONP-0002 Section 4.1),
   with its exact wire-form string stated in the gloss.
3. A `content_type` identifier, once registered, MUST NOT be reused
   for a different Companion, consistent with the general
   non-reuse discipline already established for Specification
   numbers (ONP-0000 Section 3.1) and Local Identifiers (ONP-1001
   Section 4.2).

## 4.2 Mandatory Companion Document Additions

Every Companion specification (ONP-2100 through ONP-2800) MUST, in
addition to the universal template (ONP-0000 Section 3.2), include:

1. An explicit statement of its registered `content_type` identifier,
   in its Scope section.
2. An explicit reapplication of the Companion-vs-Extension decision
   test (ONP-0001 Section 4.4 / Appendix B), with its result stated
   and justified — even where the classification seems obvious, the
   test MUST be shown applied, not merely asserted, consistent with
   how ONP-0001 Section 7.2 modeled this for the Rights Companion as
   a worked, non-obvious example.
3. Its `content` schema: required and optional fields, following the
   same Minimal Required Surface discipline (Principle P2, ONP-0003)
   Core itself follows.
4. An explicit statement of its relationship to `onp:metadata`
   (ONP-1005 Section 4.3): which of its own `content` fields, if any,
   are the "more specific equivalent" that takes precedence over a
   generic `onp:metadata` field for a Companion-aware Node.

## 4.3 Object Reference Mechanism

1. A field that relates one News Object to another MUST express that
   relationship as the Reference Target's identifier, given as a
   plain string in one of two forms:
   * an **OID** (ONP-1001 Appendix A), referencing the lineage as a
     whole — a Node resolving it follows ONP-0006 Section 6.1 to
     find whatever is currently the Current Version;
   * a **VID** (ONP-1001 Appendix A), referencing one exact,
     immutable Version — a Node resolving it MUST NOT substitute any
     other Version in the same lineage, even a later one, since
     pinning to a specific, unchanging Version is the entire purpose
     of using VID form instead of OID form.
2. A Companion or Extension specification introducing a new
   reference field MUST state explicitly, in its own Requirements
   section, which form (OID or VID) that field uses and why —
   "whatever is current" (OID) and "this exact version, permanently"
   (VID) are different guarantees, and a reader MUST NOT be left to
   guess which one a given field provides.
3. A Companion or Extension specification MUST NOT embed a full
   Reference Target Object inline as a substitute for a proper
   Object Reference. Doing so would let one Object absorb another's
   independent identity, which contradicts a Companion Object's own
   Core-owned identity (every News Object has its own OID/VID/
   signature by construction, ONP-1000) and the general principle
   that a reference relates independent things rather than merging
   them.
4. An Object Reference MUST NOT be interpreted as transferring
   ownership, custody, editorial control, or trust from the
   Reference Target to the referencing Object, or vice versa. The
   Reference Target remains independently owned, signed, and
   versioned by whichever publisher actually controls it.

**Correction note (v0.2.0):** version 0.1.0 of this document
supported OID form only. While designing ONP-2700 (Corrections), it
became clear that pinning precisely to "this exact version was
wrong, this exact version fixed it" requires referencing an
immutable Version, not a lineage that may have moved on since. VID
form is added here rather than inventing a separate mechanism, since
the underlying pattern — a plain string identifier resolved per
ONP-0006 or held exact — is otherwise identical.

## 4.4 Reference Integrity Is Not a Core Concern

1. A Node MAY verify a Reference Target if it can locate it, but a
   referencing Object's own Core validation (ONP-1004) MUST NOT
   depend on whether any Object Reference within its `content` can
   be located, dereferenced, or independently verified.
2. An unreachable or even entirely fictitious Object Reference is a
   content-quality concern for the referencing Companion (and,
   ultimately, Application-level policy, per ONP-1004 Section 4.6)
   to handle, never a Core-level validation failure. This preserves
   content opacity (ONP-1000 Section 4.4; ONP-1002 Section 4.7):
   Core does not, and must not, reach into `content` to check
   whether a reference resolves.

## 4.5 Cross-Companion Reference Direction

Any Companion MAY reference any other Companion's Objects by OID
(for example, a future Article referencing a Media Object, or an
Event referencing a Source). This document does not restrict which
Companions may reference which others; an individual Companion
specification MAY impose its own restrictions if its domain requires
them, but MUST NOT assume such a restriction is implied by this
document.

---

# 5. Object Model

## 5.1 Companion Namespace Registry Entry

Registered in ONP-0002 per Section 4.1, using the existing
Terminology Registry Entry structure (ONP-0002 Section 5.1), with
the gloss stating the exact `content_type` wire string, e.g.:

```
term: Article (Companion)
owning_document: ONP-2100
gloss: content_type = "onp:companion:article" — [description]
status: active
```

## 5.2 Object Reference (Illustrative Field Convention)

```json
{
  "content": {
    "...": "Companion-specific fields",
    "media_refs": [
      "onp:oid:regiopurmerend.nl:foto-fusie-bijeenkomst-01"
    ]
  }
}
```

`media_refs` here is illustrative of the convention, not a
normatively fixed field name — each Companion names its own
reference fields; this document only fixes that whatever such a
field is called, its values MUST be OID strings (Section 4.3).

---

# 6. Processing Model

## 6.1 Companion Registration Process

```
1. Apply the Companion-vs-Extension decision test (ONP-0001
   Section 4.4). Document the result.
2. Choose a content_type name; confirm it is not already
   registered (ONP-0002).
3. Draft the Companion specification per ONP-0000's universal
   template plus this document's Section 4.2 additions.
4. Register the content_type and every new term the specification
   introduces in ONP-0002, per that document's Section 4.1.
5. Undergo Principles Review (ONP-0003 Section 6.1) and Security
   Review (ONP-0005 Section 6.3) before Candidate status, per
   ONP-0007 Section 4.5.
```

## 6.2 Reference Resolution

A Node encountering an Object Reference MAY attempt to locate the
Reference Target via whatever channel it has available — the
publisher's own site, a feed, a cache — subject to the same "no
global resolver" rule already established for OID lookups generally
(ONP-1001 Section 4.6). If located, the Node MAY verify the
Reference Target through the ordinary Core validation pipeline
(ONP-1003 Section 6.1) like any other Object. If not located, the
referencing Object's own validity is unaffected (Section 4.4).

## 6.3 Interoperability, and Its Honest Limit

A Node implementing only Core (ONP-1000-1005), with no Companion
support, cannot discover or follow Object References at all — they
live inside `content`, which is opaque to such a Node by design
(ONP-1000 Section 4.4). This is a deliberate, accepted limit, not an
oversight: Object References are a Companion-level concept, visible
only to Nodes that implement the specific Companion whose schema
defines them. A Core-only Node's inability to see them is the
correct behavior, not a gap this document needs to close.

---

# 7. Examples

## 7.1 An Illustrative Cross-Companion Reference

```json
{
  "oid": "onp:oid:regiopurmerend.nl:fusie-onderzoek-necker-van-naem",
  "content_type": "onp:companion:article",
  "content": {
    "headline": "Fusie-onderzoek Purmerend gepubliceerd",
    "media_refs": [
      "onp:oid:regiopurmerend.nl:foto-fusie-bijeenkomst-01"
    ]
  }
}
```

A Node implementing the (future) Article Companion recognizes
`media_refs` as an array of Object References and MAY fetch and
verify the referenced Media Object independently. A Core-only Node
sees only an opaque `content` blob and has no way to know a
reference exists inside it (Section 6.3) — both behaviors are
correct for what each Node implements.

---

# 8. Security Considerations

An Object Reference carries no inherent trust. A syntactically valid
OID appearing inside `content` proves nothing about the Reference
Target's actual existence, authenticity, or relationship to the
referencing Object beyond what the referencing Companion's own
publisher asserts. A Node MUST independently run full Core validation
(ONP-1003 Section 6.1) on any Reference Target it chooses to
dereference, exactly as it would for any other Object; it MUST NOT
treat a referenced Object as pre-verified or more trustworthy merely
because a Core-authenticated Object referenced it. Trust does not
propagate across an Object Reference in either direction (Section
4.3, rule 3).

---

# 9. Privacy Considerations

Object References can expose relationship graphs a publisher may not
intend to make fully explicit — most notably, a future Sources
Companion (ONP-2600) referenced from an Article could reveal which
sources contributed to a story, a genuinely sensitive category in
investigative journalism where source protection is a professional
and sometimes legal obligation. This document does not mandate any
specific mitigation, but publishers and the Sources Companion
specification itself SHOULD consider whether, and how, a Reference
Target's identity can be selectively withheld, aggregated, or
anonymized when the referenced Source has a legitimate interest in
not being explicitly linked, rather than assuming every relationship
worth modeling is safe to make an explicit, publicly verifiable
Object Reference.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0000, Introduction — Section 3.2 (universal template, extended
  here) and Section 3.1 (non-reuse discipline, applied to
  `content_type` in Section 4.1).
* ONP-0001, Architecture — Section 4.2 (Companion Requirements) and
  Section 4.4 (the decision test this document requires every
  Companion to reapply explicitly).
* ONP-0002, Terminology — Section 4.1 (registration process),
  applied here to `content_type` identifiers.
* ONP-0003, Design Principles — Principle P2 (Minimal Required
  Surface) and Principle P6 (Core Immutability Bias), both
  motivating why domain content belongs here, not in Core.
* ONP-0007, Versioning Policy — Section 4.5 (Status Transition
  preconditions), applied to Companion publication in Section 6.1.
* ONP-1000, News Object — Section 4.4 (`content_type` mechanism,
  content opacity).
* ONP-1001, Identifiers — the OID grammar (Appendix A) Object
  References MUST match, and Section 4.6 (no global resolver
  requirement).
* ONP-1002, Serialization; ONP-1004, Validation — content opacity
  restated at the canonicalization and validation levels,
  underpinning Section 4.4 of this document.
* ONP-1005, Core Metadata — Section 4.3 (precedence rule), which
  Section 4.2, rule 4 of this document requires every Companion to
  address explicitly.

## 10.2 Historical Reference

* `draft-onp-architecture-00`, Section 12 ("Relationship Model") —
  the informal precedent for the Object Reference mechanism
  formalized in this document. ONP-0001's formalization of that
  draft did not carry this section forward; this document is where
  the gap is closed, in the series location where it is actually
  used.

## 10.3 Informative References

* ONP-2100, Article (forward reference — the first Companion
  expected to use Object References in practice, per Section 7.1).
* ONP-2600, Sources (forward reference — the Companion whose privacy
  considerations, Section 9, most directly motivate caution around
  Object References).

---

# Appendix A: Companion Namespace Registry

This table is updated as each Companion specification is published.
As of `onp:companion:comments` (ONP-2800), every Companion named in
ONP-0000 Section 4.1's original roadmap (2000-2800) has been
published. Future Companions beyond this original set remain
possible and follow the same registration process (Section 4.1).

| content_type | Owning Document | Status |
|---|---|---|
| `onp:companion:article` | ONP-2100 | active |
| `onp:companion:media` | ONP-2200 | active |
| `onp:companion:identity` | ONP-2300 | active |
| `onp:companion:rights` | ONP-2400 | active |
| `onp:companion:payments` | ONP-2500 | active |
| `onp:companion:sources` | ONP-2600 | active |
| `onp:companion:corrections` | ONP-2700 | active |
| `onp:companion:comments` | ONP-2800 | active |

# Appendix B: Companion Publication Checklist

```
[ ] Companion-vs-Extension decision test applied and documented
    (ONP-0001 Section 4.4)
[ ] content_type chosen, checked against ONP-0002 for collisions
[ ] Universal template followed (ONP-0000 Section 3.2)
[ ] content_type registered in ONP-0002
[ ] Every new term registered in ONP-0002
[ ] content schema follows Minimal Required Surface (ONP-0003 P2)
[ ] onp:metadata precedence relationship stated explicitly
    (ONP-1005 Section 4.3)
[ ] Any Object Reference fields use OID or VID strings only (with
    the choice of form stated and justified), no inline
    embedding (Section 4.3 of this document)
[ ] Principles Review passed (ONP-0003 Section 6.1)
[ ] Security Review passed (ONP-0005 Section 6.3)
```

---
*End of Document*
