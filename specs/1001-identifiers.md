Title: Open News Protocol (ONP): Identifiers
Document Number: ONP-1001
Status: Working Draft
Version: 0.1.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document fixes the exact format and computation of the two
identifiers ONP-1000 declared but deferred: the Object Identifier
(OID), constant across every Version in a lineage, and the Version
Identifier (VID), unique to each Version. OID is domain-anchored: it
reuses the same publisher-domain-control guarantee ONP-0004 already
roots trust in, requiring no separate namespace authority. VID is
content-addressed: it is the hash of a Version's canonical form,
which gives uniqueness, idempotency, and a cheap, signature-
independent tamper check for free.

---

# Status of This Document

This document is part of the ONP Core series (ONP-1000-1999). It is
directly implementable and is a direct dependency of ONP-1000, which
forward-referenced it five times. It does not itself own the terms
"OID" or "VID" — those remain owned by ONP-0001 — but it is the
document ONP-0001's registry entries for both terms name as their
structural definition, and this document fulfills that. It is a
Working Draft.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

An identifier scheme for a decentralized protocol has to answer a
question centralized systems get for free: who gets to say an
identifier is valid, without a registry to ask? ONP-0004 already
answered this for publisher identity — a publisher proves it by
controlling its own domain. This document reuses that same answer
for OID, rather than inventing a second namespace authority: an OID
is valid because it is scoped to a domain whose control is already
verified the same way a signature's authenticity is. VID needs a
different answer, because it must be unique per Version rather than
stable across a lineage; this document makes it a content hash,
which is unique by construction and requires no authority to assign
at all — a Node computes it, it does not request it.

---

# 2. Scope

## 2.1 In Scope

* the exact string format of OID and VID;
* the Local Identifier a publisher chooses within its own domain;
* the VID computation algorithm, including its pre-image definition
  (deferring exact byte-level canonicalization to ONP-1002);
* structural validation of both identifiers, including the
  signature-independent VID integrity check;
* OID stability guarantees across retraction and republication.

## 2.2 Out of Scope

This document does NOT define:

* canonical serialization / byte-level encoding (ONP-1002);
* the signature computation itself, or the "signing pre-image" that
  additionally includes the assigned VID (ONP-1003);
* any mechanism for resolving an OID to its Current Version over a
  network — ONP does not require or define a global resolver
  (Section 4.6); discovery remains a channel-level concern per
  Principle P1 (Adjacent Publishing, ONP-0003);
* handling of a Lineage Fork once detected — that remains owned by
  ONP-0006 Section 4.6; this document only supplies the identifiers
  that mechanism operates on.

---

# 3. Terminology

This document is the owning specification for the following terms.

**Local Identifier**
: The publisher-chosen component of an OID, unique within that
  publisher's own domain namespace, chosen once per lineage and
  never changed (Section 4.2).

**VID Pre-Image**
: The canonical serialization (per ONP-1002) of a News Object's
  envelope with the `vid` and `signature` fields both excluded,
  used as the input to VID computation (Section 4.3).

Terms used but owned elsewhere: **OID**, **VID** (both ONP-0001;
this document supplies their structural definition), **Publisher
Reference**, `publisher.domain` (ONP-1000 Section 4.3).

---

# 4. Requirements

## 4.1 OID Format

1. An OID MUST take the form `onp:oid:<domain>:<local-id>`.
2. `<domain>` MUST be byte-identical to the `publisher.domain` value
   (ONP-1000 Section 4.3) on every Version in the lineage. A Node
   MUST reject a Version whose `oid` domain component does not match
   its own `publisher.domain`.
3. `<local-id>` MUST match the Local Identifier grammar (Appendix A).
4. OID uniqueness is achieved by domain scoping, not by any central
   registry: because only the party controlling `<domain>`'s Trust
   Anchor (ONP-0004) can produce validly signed Objects under that
   domain, a collision in `<local-id>` can only occur within one
   publisher's own control, which is that publisher's own
   responsibility (Section 4.2), not a protocol-enforced global
   uniqueness guarantee. This is a deliberate consequence of
   Principle P3 (Ordinary Technology, ONP-0003): no namespace
   authority is required to mint a valid OID.

## 4.2 Local Identifier

1. A publisher MUST choose a Local Identifier before publishing the
   first Version of a lineage and MUST NOT change it for any
   subsequent Version in that same lineage, including across
   retraction and republication (ONP-0006 Section 4.4).
2. A publisher MUST NOT reuse a Local Identifier for a semantically
   different lineage, even after the original lineage has been
   retracted — this mirrors, within a publisher's own namespace, the
   same "a number MUST NOT be reused" discipline ONP-0000 Section
   3.1 applies to Specification numbers.
3. A publisher SHOULD derive its Local Identifiers from something
   already stable in its own systems (e.g. a CMS post ID or a
   content slug), so that no new bookkeeping system is required
   solely to satisfy this document — consistent with Principle P7
   (Time-to-First-Object, ONP-0003).

## 4.3 VID Computation

1. A Node computing a VID MUST assemble the VID Pre-Image as the
   canonical serialization (ONP-1002) of the complete News Object
   envelope with the `vid` and `signature` fields both absent.
2. The VID Pre-Image MUST be hashed using the current
   `required-baseline` hash algorithm named in the Algorithm
   Registry (ONP-0005 Section 5.1 / Appendix A).
3. VID MUST take the form `onp:vid:<hash-algorithm-id>:<digest>`,
   where `<hash-algorithm-id>` matches the Algorithm Registry
   identifier used and `<digest>` is the resulting hash, encoded per
   Appendix A.
4. Including `<hash-algorithm-id>` in the VID string itself is
   REQUIRED so that Cryptographic Agility (ONP-0005 Section 4.2)
   does not break VID verification for historical Versions computed
   under a since-superseded baseline algorithm — a Node MUST verify
   each VID using the algorithm the VID itself names, not
   necessarily the current baseline.

## 4.4 VID Idempotency

1. Given byte-identical VID Pre-Image content, VID computation MUST
   be deterministic: the same input MUST always produce the same
   VID.
2. A Node MUST NOT treat two Versions with identical VIDs as
   distinct Versions requiring separate supersession handling; an
   identical VID indicates identical pre-image content, and a
   publisher re-signing unchanged content produces a redundant but
   not erroneous Version.

## 4.5 Structural VID Integrity Check

1. Before performing signature validation, a Node MUST recompute the
   VID Pre-Image hash from the received Object's own fields (per
   Section 4.3) and compare it to the declared `vid`.
2. A Node MUST reject an Object whose declared `vid` does not match
   its recomputed value as structurally invalid, independent of and
   prior to any Trust Anchor or signature check (ONP-1000 Section
   6.1). This is a cheap, local consistency check, not a substitute
   for cryptographic authenticity verification (Section 8).

## 4.6 No Global Resolver Requirement

1. ONP MUST NOT be implemented in a way that assumes a mandatory
   central or global service resolves an OID to its Current Version.
2. A Node obtains an Object through whatever channel already carries
   it (a publisher's website, feed, or API, per ONP-0001 Section
   6.4); the OID is what lets a Node recognize, after the fact, that
   two independently obtained Objects belong to the same lineage,
   not what a Node queries to find an Object in the first place.

---

# 5. Object Model

## 5.1 Identifier Grammar (Informal)

```
oid        = "onp:oid:"  domain ":" local-id
vid        = "onp:vid:"  hash-algorithm-id ":" digest

domain     = the exact string used as publisher.domain (ONP-1000 S4.3)
local-id   = 1*128( ALPHA-LOWER / DIGIT / "-" )  OR  a UUIDv4 string
hash-algorithm-id = an identifier from the Algorithm Registry
                     (ONP-0005 Appendix A), e.g. "sha-256"
digest     = base64url-encoded hash output, no padding
```

The formal ABNF is given in Appendix A.

## 5.2 Field Table

| Component | Chosen By | Stability |
|---|---|---|
| `domain` (in OID) | Publisher, fixed by `publisher.domain` | Constant across the lineage |
| `local-id` | Publisher, once, per Section 4.2 | Constant across the lineage |
| `hash-algorithm-id` (in VID) | Whatever the Algorithm Registry's baseline was when this Version was created | Fixed per Version, never changes retroactively |
| `digest` (in VID) | Computed, not chosen | Unique per distinct VID Pre-Image |

---

# 6. Processing Model

## 6.1 OID/VID Validation, Slotted into ONP-1000's Parsing Order

This extends ONP-1000 Section 6.1, step 2 (structural validity) and
step 4 (pre-cryptographic checks):

```
1. Parse oid; confirm its domain component matches publisher.domain.
   -> FAIL (structural) on mismatch.
2. Parse oid's local-id; confirm it matches the grammar (Appendix A).
   -> FAIL (structural) if malformed.
3. Recompute the VID Pre-Image from the Object's own fields
   (Section 4.3) and hash it per the algorithm named in the
   received vid.
4. Compare the recomputed digest to the declared vid's digest.
   -> FAIL (structural, per Section 4.5) on mismatch.
5. Only after steps 1-4 pass does the Node proceed to Trust Anchor
   resolution and signature verification (ONP-1000 Section 6.1,
   step 4 continued; ONP-0004; ONP-1003).
```

## 6.2 Interaction with Lineage Fork Detection

If a Node observes two Versions sharing an OID whose supersession
relationship cannot be resolved to a single lineage (per ONP-0006
Section 6.1), this document contributes only the identifiers
involved; the fork-handling behavior itself remains owned by ONP-0006
Section 4.6 and is not redefined here.

## 6.3 Interoperability

A Node implementing only ONP-1000 and ONP-1001 (plus the
required-baseline hash algorithm from ONP-0005) MUST be able to
perform the full structural and integrity check in Section 6.1 for
any Object, regardless of which Companion or Extension it also
carries — consistent with the interoperability guarantee ONP-1000
Section 6.3 already states for the envelope as a whole. This
document adds no exception to that guarantee; OID/VID validation is
part of the Core-only validation path, not a Companion-dependent one.

---

# 7. Examples

## 7.1 OID Construction

```
publisher.domain = "regiopurmerend.nl"
local-id chosen by publisher = "fusie-onderzoek-necker-van-naem"

oid = "onp:oid:regiopurmerend.nl:fusie-onderzoek-necker-van-naem"
```

## 7.2 VID Computation Walkthrough

```
1. Assemble envelope without vid and signature:
   { oid, publisher, content_type, content, ...lifecycle fields }
2. Canonically serialize (ONP-1002) -> VID Pre-Image bytes.
3. Hash with required-baseline algorithm (sha-256, per ONP-0005
   Appendix A) -> digest.
4. vid = "onp:vid:sha-256:base64url(digest)"
```

## 7.3 Structural Rejection Before Signature Check

```
Received Object declares:
  vid = "onp:vid:sha-256:AbC123..."
Node recomputes the VID Pre-Image hash from the Object's own
fields and obtains:
  "onp:vid:sha-256:XyZ789..."
Mismatch -> Node REJECTS at Section 4.5 (structural), before
spending any effort on Trust Anchor resolution or signature
verification. This is a cheap first-pass filter, not the
authenticity check itself.
```

---

# 8. Security Considerations

## 8.1 VID Integrity Check Is Not Authenticity

The structural VID check (Section 4.5) proves internal consistency
— that the declared identifier matches the content it claims to
identify — not who produced that content. An adversary with no valid
signing key can trivially produce an Object with a self-consistent
VID; that Object still fails Trust Anchor resolution and signature
verification (ONP-0004, ONP-1003). Section 4.5's check exists to
cheaply reject malformed or corrupted Objects before spending
cryptographic effort on them, not to replace that effort.

## 8.2 Domain-Anchored OID Inherits ONP-0004's Compromise Window

Because OID validity is scoped to domain control, an attacker who
compromises a publisher's domain (ONP-0004 Section 8.1, ONP-0005
Adversary A3) can mint arbitrary Local Identifiers under that domain
during the compromise window, including ones colliding with or
shadowing existing lineages. This is not a new risk this document
introduces; it is the same risk already named in those documents,
inherited here because OID reuses the same trust root by design.

## 8.3 Algorithm-Agility-Aware VID Verification

Because Cryptographic Agility (ONP-0005 Section 4.2) allows the
required-baseline hash algorithm to change over time, a Node MUST
verify each VID using the algorithm identifier embedded in that VID
(Section 4.3, rule 4), not the Node's current default. A Node that
ignores an older VID's stated algorithm and attempts to verify it
with a newer default would produce a false mismatch, incorrectly
rejecting valid historical content.

---

# 9. Privacy Considerations

A Local Identifier is chosen by the publisher and is not required to
carry any personal data. However, because Section 4.2, rule 3
RECOMMENDS deriving Local Identifiers from existing internal
identifiers (e.g. a CMS post ID), publishers SHOULD ensure such
identifiers do not inadvertently expose internal system details
(sequential database keys revealing publication volume, internal
author-linked slugs, etc.) beyond what the publisher intends to make
public. This document does not require any specific mitigation; it
notes the consideration for publisher awareness.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0000, Introduction; ONP-0001, Architecture — own the terms
  "OID" and "VID"; this document supplies their structural
  definition.
* ONP-0003, Design Principles — Principle P3 (Ordinary Technology,
  motivating domain-scoped OID over a namespace authority) and
  Principle P7 (Time-to-First-Object, motivating Section 4.2, rule
  3).
* ONP-0004, Trust Model — `publisher.domain` and its Trust Anchor
  resolution, which OID's domain component reuses directly.
* ONP-0005, Security Model — the Algorithm Registry (Section 5.1)
  VID computation depends on, and Cryptographic Agility (Section
  4.2), which Section 4.3 rule 4 and Section 8.3 of this document
  account for.
* ONP-0006, News Object Lifecycle — OID stability across retraction
  and republication (Section 4.4), confirmed here in Section 4.2.
* ONP-1000, News Object — the envelope this document's identifiers
  are fields of; Section 6.1's parsing order, extended in Section
  6.1 of this document.

## 10.2 Informative References

* ONP-1002, Serialization (forward reference — exact canonical
  byte-level encoding of the VID Pre-Image).
* ONP-1003, Digital Signatures (forward reference — the signing
  pre-image, which additionally includes the assigned `vid`).

---

# Appendix A: Formal Grammar (ABNF-Style)

```
oid              = "onp:oid:" domain ":" local-id
vid              = "onp:vid:" hash-algorithm-id ":" digest

domain           = 1*253( DOMAIN-CHAR )
                    ; MUST be byte-identical to publisher.domain

local-id         = 1*128( ALPHA-LOWER / DIGIT / "-" )
                  / UUIDv4

hash-algorithm-id = 1*32( ALPHA-LOWER / DIGIT / "-" )
                    ; MUST match an Algorithm Registry identifier
                    ; (ONP-0005 Appendix A), lowercased, e.g. "sha-256"

digest           = 1*( BASE64URL-CHAR )
                    ; unpadded base64url encoding of the raw hash
                    ; output bytes

ALPHA-LOWER      = %x61-7A  ; a-z
DIGIT            = %x30-39  ; 0-9
DOMAIN-CHAR      = ALPHA-LOWER / DIGIT / "-" / "."
BASE64URL-CHAR   = ALPHA-LOWER / %x41-5A / DIGIT / "-" / "_"
UUIDv4           = 8HEXDIG "-" 4HEXDIG "-" "4" 3HEXDIG "-"
                    ("8"/"9"/"a"/"b") 3HEXDIG "-" 12HEXDIG
```

# Appendix B: VID Computation — Quick Reference

```
[ ] Assemble the envelope with every field EXCEPT vid and signature.
[ ] Canonically serialize per ONP-1002.
[ ] Look up the current required-baseline hash algorithm
    (ONP-0005 Appendix A).
[ ] Hash the canonical bytes with that algorithm.
[ ] Encode the digest as unpadded base64url.
[ ] vid = "onp:vid:" + hash-algorithm-id + ":" + digest
[ ] Add vid to the envelope. (signature is computed afterward,
    per ONP-1003, over a pre-image that includes this vid.)
```

---
*End of Document*
