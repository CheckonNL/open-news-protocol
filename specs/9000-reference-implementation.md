Title: Open News Protocol (ONP): Reference Implementation
Document Number: ONP-9000
Status: Working Draft
Version: 0.2.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document is the entry point to the ONP Reference series
(ONP-9000-9004) and defines what a Reference Implementation is, why
one is required before any specification can advance from Candidate
to Standards Track status (ONP-0007 Section 4.5), and the minimal
scope a first Reference Implementation MUST cover to count as valid
evidence for that transition. A minimal Reference Implementation now
exists at `sdk/reference-impl/`, covering the REQUIRED minimum scope
(ONP-1000 through ONP-1003, Section 4.1, rule 1) with a real test
suite and real, computed Test Vectors — but not yet the RECOMMENDED
additional scope (ONP-0004, ONP-1004, ONP-1005; Section 4.1, rule 2).
This document defines the full target such an implementation must
eventually meet; the current implementation is a genuine but partial
step toward it, not a completed artifact.

---

# Status of This Document

This document is part of the ONP Reference series (ONP-9000-9999),
the fifth and final phase of the original roadmap (ONP-0000 Section
4.1). Unlike the Foundation, Core, Companion, and Extension series,
Reference documents are Informational rather than normative in the
usual sense — they define expectations and guidance around
implementation, not wire-level protocol behavior. It is a Working
Draft.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000. Where they appear in this document, they govern what
qualifies as a valid Reference Implementation for the purpose of
ONP-0007 Section 4.5's Candidate-transition precondition, not News
Object wire behavior itself.

---

# 1. Introduction

ONP-0007 Section 4.5 requires "at least one demonstrated, independent
implementation exercising the Specification's Requirements" before
any specification can advance from Candidate to Standards Track.
Principle P7 (Time-to-First-Object, ONP-0003) states the same
concern from the opposite direction: if a competent developer cannot
produce a working implementation from the specification text alone,
the specification has failed regardless of its internal consistency.
A Reference Implementation is the concrete artifact that tests both
claims at once — it either proves the specification text is
sufficient on its own, or it reveals exactly where it is not.

---

# 2. Scope

## 2.1 In Scope

* the minimum specification set a first Reference Implementation MUST
  cover;
* what "independent" means for the purpose of ONP-0007 Section 4.5;
* the Test Vector requirement and its purpose;
* language and technology neutrality.

## 2.2 Out of Scope

This document does NOT itself contain:

* any actual source code — that belongs in `sdk/` or `reference/`
  once written, not in specification text;
* a mandate for any specific programming language, framework, or
  platform (Section 4.4);
* full coverage of every Companion and Extension published so far —
  the minimum scope (Section 4.1) is deliberately smaller than the
  full series.

---

# 3. Terminology

This document is the owning specification for the following terms.

**Reference Implementation**
: A working software implementation of some or all of the ONP
  specification series, built to demonstrate that the specification
  text is sufficient, on its own, to produce interoperable behavior.

**Test Vector**
: A published, documented example input and its expected output
  (e.g. a News Object and its correct VID and signature), against
  which any implementation can check itself without needing to run
  the Reference Implementation's own code.

---

# 4. Requirements

## 4.1 Minimum Scope

1. A Reference Implementation submitted as evidence for a Candidate-
   to-Standards-Track transition (ONP-0007 Section 4.5) MUST, at
   minimum, cover ONP-1000 through ONP-1004: envelope construction
   and parsing, identifier computation, canonical serialization,
   signing and verification, and the multi-level validation pipeline.
2. It SHOULD also cover ONP-0004 (Trust Anchor resolution) and
   ONP-1005 (Core Metadata), since a Reference Implementation that
   cannot resolve Trust Anchors cannot meaningfully claim to
   "verify" anything beyond structural well-formedness.
3. Coverage of any specific Companion or Extension beyond this
   minimum is NOT REQUIRED for a Reference Implementation to be
   valid evidence for advancing a Foundation or Core specification;
   each Companion or Extension MAY be validated by its own,
   separately scoped Reference Implementation evidence when it
   reaches its own Candidate stage.

## 4.2 Independence

1. "Independent," for the purpose of ONP-0007 Section 4.5, means the
   implementation was built using only the published specification
   text as its normative source — without undocumented clarification
   from the specification's own authors filling gaps the text itself
   leaves open. This is the actual test of specification quality:
   whether the words on the page are sufficient, cold.
2. An implementation built by a different individual or organization
   than the specification's authors is stronger evidence of this than
   one built by the same people, but this document does not require
   organizational independence as a hard precondition — a single
   author who can honestly attest to relying only on the published
   text MAY still satisfy Section 4.2, rule 1.
3. Multiple independent implementations, especially by different
   parties, provide progressively stronger evidence, but a single one
   satisfies the minimum bar ONP-0007 Section 4.5 sets.

## 4.3 Test Vectors

1. A Reference Implementation submitted as Candidate-transition
   evidence MUST be accompanied by a published set of Test Vectors:
   documented example News Objects together with their correct VID
   and signature values (using a fixed, stated test keypair), so that
   any other implementation can verify its own output against a known
   answer without needing to execute the Reference Implementation's
   own code at all.
2. Test Vectors MUST cover, at minimum: a Minimal Viable Object
   (ONP-1000 Section 4.2), a Version with a non-null `supersedes`
   (ONP-0006), and at least one structurally invalid Object that MUST
   be rejected, so that both correct construction and correct
   rejection are demonstrated.

## 4.4 Language and Technology Neutrality

This document MUST NOT be read as favoring or requiring any specific
programming language, runtime, or platform. Any technology stack
capable of implementing JCS canonicalization (ONP-1002), Ed25519
signing and verification (ONP-1003), and SHA-256 hashing (ONP-0005
Appendix A) MAY be used, consistent with Principle P3.

## 4.5 Licensing

A published Reference Implementation MUST be licensed separately from
the CC BY 4.0 specification text (LICENSE), under an open-source
code license (the repository's LICENSE file already anticipates this
under "Code License (Future)"). This document does not mandate a
specific code license, though Apache License 2.0 or the MIT License
are RECOMMENDED as widely-recognized, unambiguous choices consistent
with Principle P3.

---

# 5. Object Model

## 5.1 Test Vector (Illustrative)

```json
{
  "test_vector_id": "string, REQUIRED",
  "description": "string, REQUIRED",
  "test_keypair": {
    "algorithm": "ed25519",
    "public_key": "base64url-encoded test public key",
    "note": "REQUIRED — a published, fixed test key, never a production key"
  },
  "input_envelope": { "...": "the envelope fields before vid/signature are computed" },
  "expected_vid": "onp:vid:sha-256:...",
  "expected_signature": "onp:sig:ed25519:...",
  "expected_result": "'valid' | 'structurally-invalid' | 'signature-invalid'"
}
```

---

# 6. Processing Model

## 6.1 Evaluating Submitted Evidence

When a Reference Implementation is submitted as evidence for a
Status Transition (ONP-0007 Section 4.5), the ONP-WG evaluates it
per CHARTER.md Section 3: reviewing the evidence in the open, and
advancing on rough consensus that Sections 4.1 through 4.3 of this
document are satisfied.

## 6.2 Interoperability

Test Vectors (Section 4.3) exist specifically to let a second,
completely separate implementation validate itself without any
dependency on the first Reference Implementation's own runtime — the
concrete mechanism behind the interoperability guarantee this entire
series has promised since ONP-0001. A specification is only as
interoperable as its Test Vectors prove it to be across independently
built implementations, not merely internally consistent within one.

---

# 7. Examples

## 7.1 A Real, Computed Test Vector (No Longer Illustrative)

```json
{
  "test_vector_id": "onp-tv-001",
  "description": "Minimal Viable Object, per ONP-1000 Section 4.2",
  "test_keypair": {
    "algorithm": "ed25519",
    "public_key": "eph9gqldpi59ShqTjQrEw_kx-UtqdbYWp2HUY2g4PK4",
    "note": "Published test key only"
  },
  "input_envelope": {
    "oid": "onp:oid:example.onp.dev:test-vector-001",
    "publisher": { "domain": "example.onp.dev", "key_id": "onp:key:test-2026" },
    "signed_at": "2026-07-28T00:00:00Z",
    "content_type": "onp:companion:article",
    "content": { "headline": "Test Vector Article", "body": "Test body text." }
  },
  "expected_vid": "onp:vid:sha-256:L4Gvx2LkqQpihK7V61GW82nl-dUdf-FZjnfrTHGOpZc",
  "expected_signature": "onp:sig:ed25519:cxyIJYCwJHmHd11UDNkdDj4_HLwWoW5uKf_vQ2pdHfhY3PmLXe0FsfEihdJQxg94ZULHsqmHhG1RiJQMv5XzAA",
  "expected_result": "valid"
}
```

Unlike every placeholder value used illustratively throughout this
series until now, this VID and signature are real, computed by
`sdk/reference-impl/` and self-verified against the same code before
publication. The full three-vector set (including a superseding
Version and a structurally invalid rejection case) is published at
`sdk/reference-impl/examples/test-vectors.json` — this is a copy of
its first entry, kept here for readability rather than as the sole
source of truth; if the two ever diverge, the file in
`sdk/reference-impl/` governs.

---

# 8. Security Considerations

Test Vectors MUST use a published, clearly-labeled test keypair,
never a production signing key — Section 5.1's schema requires this
explicitly. Test Vector integrity itself relies on the same document
provenance mechanism already established for the specification
series as a whole (ONP-0000 Section 5.3): Test Vectors are published
through the same repository and canonical channel as every other ONP
document, not through a separate, unverified distribution mechanism.

---

# 9. Privacy Considerations

This document defines no data fields carrying personal information
and introduces no privacy impact of its own.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0003, Design Principles — Principle P3 (Ordinary Technology,
  Section 4.4) and Principle P7 (Time-to-First-Object), the
  motivating concern behind this entire document.
* ONP-0007, Versioning Policy — Section 4.5, the Candidate-transition
  precondition this document exists to satisfy.
* ONP-1000 through ONP-1004 — the minimum specification scope
  (Section 4.1).
* ONP-0004, Trust Model; ONP-1005, Core Metadata — the recommended
  additional scope (Section 4.1, rule 2).

## 10.2 Informative References

* `LICENSE` (repository root) — the "Code License (Future)" section
  this document's Section 4.5 fulfills.
* `CHARTER.md` — Section 3, the Status Transition evaluation process
  referenced in Section 6.1.

---

# Appendix A: Reference Implementation Submission Checklist

```
[ ] Covers ONP-1000 through ONP-1004 at minimum
[ ] Covers ONP-0004 and ONP-1005 (recommended)
[ ] Built using only published specification text as its normative
    source (Section 4.2)
[ ] Accompanied by published Test Vectors covering: a Minimal Viable
    Object, a superseding Version, and at least one rejected,
    structurally invalid Object
[ ] Test Vectors use a clearly labeled, non-production test keypair
[ ] Licensed separately from specification text, under an
    open-source code license
[ ] No specific language/platform assumed or required by the
    specification itself
```

# Appendix B: Test Vector Schema Reference

```json
{
  "test_vector_id": "string, REQUIRED",
  "description": "string, REQUIRED",
  "test_keypair": {
    "algorithm": "string, REQUIRED",
    "public_key": "string, REQUIRED",
    "note": "string, REQUIRED"
  },
  "input_envelope": "object, REQUIRED — fields before vid/signature",
  "expected_vid": "string, REQUIRED",
  "expected_signature": "string, REQUIRED — omitted if expected_result is not 'valid'",
  "expected_result": "enum, REQUIRED"
}
```

---
*End of Document*
