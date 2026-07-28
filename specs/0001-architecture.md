Title: Open News Protocol (ONP): Architecture
Document Number: ONP-0001
Status: Working Draft
Version: 0.1.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-28
Obsoletes: draft-onp-architecture-00

---

# Abstract

This document defines the layered architecture of the Open News
Protocol: a strict separation between Core (which owns Object
truth), Companions (which own independent domain models), and
Extensions (which own domain meaning without altering Object truth).
It formalizes, under the ONP numbering and template conventions
established in ONP-0000, the architecture originally described in
the informal working draft `draft-onp-architecture-00`. This
document supersedes that draft; where the two differ, this document
governs. It does not itself define field-level structure — that is
the Core series' responsibility (ONP-1000 onward) — and it does not
own term definitions beyond the architectural vocabulary introduced
here, which is indexed, together with every other ONP term, in
ONP-0002.

---

# Status of This Document

This document is part of the ONP Foundation series (ONP-0000-0999).
It is normative: every Core, Companion, and Extension specification
MUST conform to the layering rules defined here. It obsoletes
`draft-onp-architecture-00`, the informal document from which its
content is derived; any prior citation of that draft SHOULD be read
as a citation of this document going forward. It is a Working Draft.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

Digital publishing today routes trust through intermediary
platforms: a reader trusts an article because they trust the
platform that served it, not because the article itself can be
verified. ONP's founding principle, stated informally in the
original architecture draft and formalized here, is:

> **Trust the Object, not the Messenger.**

To make that principle implementable without collapsing under the
weight of every domain that wants to extend it (advertising,
payments, AI provenance, moderation, search, and others not yet
imagined), ONP separates responsibility into three layers, each with
a narrow, non-overlapping mandate. This document defines those
layers, the rules that keep them separate, and the decision
procedure for classifying new functionality into the correct one.
The problem motivating this separation — why an open protocol is
needed at all — is stated in ONP-0000 and is not repeated here.

---

# 2. Scope

## 2.1 In Scope

* the three-layer architecture (Core, Companion, Extension) and the
  rules governing each;
* the Vertical Invariant (no layer may override Core) and the
  Horizontal Invariant (no Extension or Companion may override
  another's domain truth);
* the News Object's layered structure (Core State, Content,
  Extensions);
* the Companion-vs-Extension classification procedure;
* the validation architecture (Core, Extension, Application levels);
* the network and CMS adoption models, at the level of architectural
  shape rather than wire-level detail.

## 2.2 Out of Scope

This document does NOT define:

* concrete field names, types, or constraints for the News Object
  (see ONP-1000);
* identifier formats (ONP-1001), serialization (ONP-1002), or
  signature schemes (ONP-1003);
* term ownership beyond the architectural vocabulary introduced in
  Section 3 (the full registry is ONP-0002);
* trust anchor mechanics — how a Node establishes that a given
  signing key belongs to a given publisher (see ONP-0004);
* the design principles that constrain how this architecture may be
  extended over time (see ONP-0003, which this document does not
  restate).

---

# 3. Terminology

This document is the owning specification for the following terms.
Per the single-owner rule (ONP-0000 Section 3.4), no other ONP
document may redefine them.

**Layer**
: One of the three architectural tiers defined in Section 4: Core,
  Companion, or Extension.

**Core**
: The layer that owns News Object truth: identity, integrity,
  version lineage, and signature validity. Core answers "what is
  this Object, and can it be verified?" and nothing else.

**Companion**
: A specification that defines an independent domain object model
  with its own identity and lifecycle, layered on top of Core. A
  Companion does not alter Core truth; it adds a new class of
  Object that itself has Core-verifiable identity.

**Extension**
: A specification that adds domain-specific meaning to an existing
  Object (of any layer) without giving that meaning its own
  independent identity or lifecycle, and without altering Core
  truth.

**Vertical Invariant**
: The rule that a Companion or Extension MUST NOT override, replace,
  or redefine anything Core controls (Section 5.2).

**Horizontal Invariant**
: The rule that one Extension MUST NOT override another Extension's
  domain truth, and one Companion MUST NOT depend on another
  Companion's internal object state (Section 5.3).

**onp:extensions**
: The reserved container field, defined structurally in Section 6.2,
  through which Extension data is carried on a News Object.

Terms used here but owned elsewhere (News Object, OID, VID,
Signature, Node) are defined in ONP-0000 and ONP-1000 and are used
consistently with those definitions.

---

# 4. Requirements

## 4.1 Core Ownership

1. Core MUST define, and be the sole owner of: Object identifier
   (OID), version identifier (VID), digital signature, version
   lineage, and tombstone (deletion/retraction) state.
2. Core MUST NOT define domain-specific concerns: advertising,
   payments, licensing, ranking, moderation, or AI policy. These
   MUST be defined by Companions or Extensions.
3. No Companion or Extension specification MAY introduce a field
   that redefines, shadows, or overrides a Core-owned field's
   meaning.

## 4.2 Companion Requirements

1. A specification MUST be classified as a Companion if and only if
   the concept it defines has independent identity and an
   independent lifecycle from any existing Object (see the decision
   procedure, Section 4.4).
2. A Companion-defined Object MUST itself carry Core state (OID,
   VID, signature) — a Companion Object is a News Object in its own
   right, not merely a field on another Object.
3. A Companion MUST NOT require another Companion's internal state
   to function (Horizontal Invariant, Section 5.3); it MAY reference
   another Companion's Object by OID.

## 4.3 Extension Requirements

An Extension:

**MUST:**
* define its own domain terminology and register it per ONP-0002;
* reference existing ONP terminology rather than re-deriving it;
* preserve Core state unmodified;
* be carried under the `onp:extensions` container (Section 6.2),
  namespaced by a reverse-domain-style identifier (e.g.
  `org.onp.<name>`).

**MUST NOT:**
* redefine a Core term or another Extension's or Companion's term;
* duplicate a term already owned by another document;
* override another Extension's domain truth (Horizontal Invariant);
* introduce its own OID/VID/signature scheme; an Extension attaches
  to an existing Object's identity, it does not mint a new one (that
  is what distinguishes it from a Companion).

## 4.4 Companion vs. Extension Decision Procedure

A specification author classifying a new concept MUST apply the
following test:

> Does the concept have its own identity and independent lifecycle,
> separable from the Object it relates to?
>
> - **YES** → it is a **Companion**. It MUST get its own OID/VID/
>   signature per Section 4.2.
> - **NO** → it is an **Extension**. It MUST attach to an existing
>   Object under `onp:extensions` per Section 4.3.

This test MUST be applied and its result stated explicitly in any
new Companion or Extension specification's Scope section (see
worked examples in Section 7).

---

# 5. Object Model

## 5.1 Layered Object Structure

A News Object consists of three layered regions. This is the
structural model; the field-level content of each region is
normatively defined elsewhere (Core State in ONP-1000-1005; Content
per whichever Companion defines the Object's type, e.g. ONP-2100 for
an Article; Extensions per whichever Extension specifications are
attached).

```
+-------------------------------------------+
| News Object                                |
+-------------------------------------------+
| Core State            (owned by Core)      |
|                                             |
| - OID                                      |
| - VID                                      |
| - Publisher reference                      |
| - Signature                                |
| - Version lineage                          |
| - Tombstone state                          |
+-------------------------------------------+
| Content                (owned by the       |
|                          originating        |
|                          Companion, e.g.    |
|                          Article, Media)    |
+-------------------------------------------+
| Extensions              (owned by zero or   |
|   onp:extensions          more Extension    |
|                          specifications)    |
+-------------------------------------------+
```

## 5.2 The Extension Container

Extension data MUST be carried under the reserved `onp:extensions`
field, keyed by a namespace identifier:

```json
{
  "onp:extensions": {
    "org.onp.rights": {},
    "org.onp.payments-hint": {},
    "org.onp.ai-metadata": {}
  }
}
```

Note: the namespace identifiers shown here (`org.onp.rights`, etc.)
are illustrative of the container's structure only. The authoritative
namespace identifier for any given Extension is assigned in that
Extension's own specification, not in this document (see Section
2.2). Where the original architecture draft used illustrative
namespaces such as `org.onp.licensing` or `org.onp.media-rights`
that do not correspond one-to-one with the current roadmap (ONP-0000
Section 4.1), those draft namespaces are non-normative and are
superseded by whatever the relevant Companion or Extension
ultimately defines.

---

# 6. Processing Model

## 6.1 Layer Classification at Authoring Time

When a new domain requirement is proposed (e.g. "we need a field for
X"), a Node or specification author MUST, before writing any field
definition:

1. Check whether X is already owned by an existing Core, Companion,
   or Extension term (per ONP-0002). If so, use it; do not
   redefine it.
2. If X is new, apply the decision procedure in Section 4.4 to
   determine whether it is a Companion or an Extension.
3. Route the proposal to the appropriate specification: a new or
   existing Companion document if Companion, a new or existing
   Extension document if Extension. X MUST NOT be added directly to
   Core (this also follows from ONP-0003 Principle P6).

## 6.2 Validation at Processing Time

A Node processing a received News Object MUST validate it in the
following order, and MUST NOT skip or reorder these levels:

```
+-----------------------------------+
| 1. Core                           |
|    Structure / Signature /        |
|    Identity                       |
+-----------------------------------+
                  |
                  v
+-----------------------------------+
| 2. Extension / Companion          |
|    Domain-specific validation     |
+-----------------------------------+
                  |
                  v
+-----------------------------------+
| 3. Application                    |
|    Business decisions             |
|    (e.g. "should I display this?")|
+-----------------------------------+
```

An Object that fails level 1 (Core) validation MUST be rejected
before any level 2 or level 3 processing occurs, regardless of how
well-formed its Extension or Companion data appears. This ordering
is a direct consequence of the Vertical Invariant (Section 5.2 of
this document's Requirements... see Section 4.1) and is restated
here because it is a processing-time, not authoring-time, rule.

## 6.3 Network Model

ONP does not require a central database or registry. Nodes exchange
signed Objects directly or through intermediate relays, and each
recipient independently verifies what it receives:

```
Publisher Node ---> Signed Object ---> Other Nodes ---> Applications
```

A relay MAY cache, forward, or index Objects, but MUST NOT be
trusted as an authority on an Object's validity; validity is
established by the recipient's own Core-level verification (Section
6.2), never by the relay's say-so.

## 6.4 CMS Adoption Model

Consistent with Principle P1 (Adjacent Publishing, ONP-0003), ONP is
adopted through existing publishing systems rather than by replacing
them:

```
CMS ---> ONP Plugin ---> Signed News Object ---> ONP Node
```

The CMS remains the system of record for the publisher's own
operations; the ONP Plugin produces a signed, layered representation
of content the CMS already holds. No specification in the ONP series
may require the reverse (CMS reading its own content back from an
ONP store) as a precondition for conformance.

## 6.5 Interoperability

Strict layering is what makes independent implementations
interoperable at the semantic level, not merely the syntactic one.
Because Core validation (Section 6.2, level 1) never depends on
which Companions or Extensions a given Object carries, two Nodes
that implement only Core — one supporting the Article and Rights
Companions, another supporting only Media — can each verify the
authenticity of any Object either one produces, even though neither
can interpret all of the other's domain-specific content. A
specification MUST NOT introduce a requirement that makes Core
verification depend on the presence, absence, or content of any
specific Companion or Extension; doing so would break this
guarantee and is prohibited by the Vertical Invariant (Section 5.2).

---

# 7. Examples

## 7.1 Worked Classification: Article

```
Concept: "Article"
Test: Does it have independent identity and lifecycle?
  - An Article is published, corrected, retracted, and archived
    independently of any other Object.
  - YES -> Companion.
Result: Article is a Companion (ONP-2100). It carries its own
        OID/VID/signature.
```

## 7.2 Worked Classification: Rights Declaration

```
Concept: "Usage rights for a specific Article"
Test: Does it have independent identity and lifecycle, separable
      from the Article it governs?
  - A rights declaration only makes sense attached to a specific
    Article; it does not outlive or exist independently of it in
    the way a correction or a comment might.
  - Borderline case: rights information changes over time
    (a license may be updated) and might seem to warrant its own
    lifecycle.
  - Resolution: ONP-0000 treats Rights as a full Companion
    (ONP-2400) rather than an Extension, because a rights
    declaration can be independently referenced (e.g. by a
    licensing marketplace) and revised on its own version lineage,
    which satisfies the independent-identity test. This is recorded
    here as a worked example of a borderline case, not as a
    shortcut around the test in Section 4.4 — each new concept MUST
    still be evaluated on its own facts.
```

## 7.3 Correct vs. Incorrect Layering

```
CORRECT:
  An AI Metadata Extension (ONP-3100) attaches provenance
  information to an existing Article Object's onp:extensions
  container. It does not mint a new OID.

INCORRECT:
  A proposed "AI Metadata Object" with its own OID that duplicates
  the Article's content. This violates the Extension definition in
  Section 3 (an Extension does not mint its own identity) and should
  instead be evaluated as a Companion if independent identity is
  genuinely required — or, more likely, simplified back into an
  Extension attached to the Article it describes.
```

---

# 8. Security Considerations

The Vertical Invariant (Section 5.2 of Requirements, i.e. Section
4.1) and the validation ordering in Section 6.2 exist specifically
to prevent layer confusion: a party controlling a Companion or
Extension must not be able to acquire authority over Core trust
properties. This is the same security property discussed at the
document-series level in ONP-0000 Section 5.2; this document is
where it is enforced architecturally. A Node implementation MUST
treat a Core validation failure as terminal — no Extension or
Companion data, however well-formed, can compensate for an invalid
signature or a malformed identifier.

The Horizontal Invariant (Section 5.3, i.e. Section 4.2/4.3) prevents
a second, subtler failure: an Extension that is individually
well-behaved with respect to Core but that silently overrides
another Extension's domain claims (for example, a Syndication
Extension asserting distribution terms that contradict a Rights
Companion's usage permissions). A Node MUST treat such a conflict as
a validation error at level 2 (Section 6.2), not resolve it silently
in favor of whichever Extension it processes first.

---

# 9. Privacy Considerations

This document defines no data fields and therefore has no direct
privacy impact. Its layering discipline has an indirect privacy
benefit: because Extensions and Companions are optional and
separable from Core (Section 4.1), a Node or implementation can
support Core verification without ever processing or storing
privacy-sensitive Companion data such as Identity (ONP-2300) or
Payments (ONP-2500) fields. Privacy analysis of those fields belongs
to their owning specifications.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0000, Introduction — mission, four pillars, and document
  roadmap.
* ONP-0002, Terminology — the full term ownership registry; this
  document only owns the architectural vocabulary in Section 3.
* ONP-0003, Design Principles — Principle P6 (Core Immutability
  Bias) and Principle P1 (Adjacent Publishing) directly motivate
  Sections 4.1 and 6.4 of this document.

## 10.2 Historical Reference

* `draft-onp-architecture-00`, "Open News Protocol (ONP)
  Architecture Framework" — the informal working draft this document
  formalizes and obsoletes. Retained for historical context only;
  where it conflicts with this document, this document governs.

## 10.3 Informative References

* ONP-1000, News Object (forward reference — normative Core State
  field definitions).
* ONP-2100, Article; ONP-2400, Rights (forward references — worked
  examples in Section 7).
* ONP-3100, AI Metadata (forward reference — worked example in
  Section 7.3).

---

# Appendix A: Full Layering Diagram

```
                     ONP Ecosystem
                          |
                Applications and Users
                          |
    +-------------------------------------------+
    |             Domain Layer                  |
    |                                            |
    |   Extensions              Companions       |
    |   (attach to existing     (independent     |
    |    Objects; no own        identity;        |
    |    identity)               own OID/VID)     |
    +-------------------------------------------+
                          |
    +-------------------------------------------+
    |                 Core                       |
    |                                            |
    |   Identity (OID)                           |
    |   Integrity (Signature)                     |
    |   Version lineage (VID)                     |
    |   Object lifecycle (Tombstone state)         |
    +-------------------------------------------+
```

# Appendix B: Companion vs. Extension Checklist

```
[ ] Does the concept need to be independently referenced by OID
    from outside the Object it relates to?
[ ] Does the concept have its own creation, correction, and
    retraction lifecycle, distinct from the Object it relates to?
[ ] Could the concept exist, meaningfully, with no other Object
    present at all?

If ANY of the above is YES  -> classify as Companion (Section 4.2).
If ALL of the above are NO  -> classify as Extension (Section 4.3).

Then verify:
[ ] The specification registers any new terms in ONP-0002.
[ ] The specification does not redefine a Core-owned term
    (Section 4.1, rule 3).
[ ] If a Companion: the specification defines the Companion
    Object's own Core State per Section 5.1.
[ ] If an Extension: the specification defines a namespace
    identifier for the onp:extensions container per Section 5.2.
```

---
*End of Document*
