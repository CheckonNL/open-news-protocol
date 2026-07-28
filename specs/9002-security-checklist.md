Title: Open News Protocol (ONP): Security Checklist
Document Number: ONP-9002
Status: Working Draft
Version: 0.1.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document is non-normative and fulfills forward references made
in ONP-0005 Section 8, ONP-0007 Section 8, and ONP-1004 Section 8.2.
It is distinct in kind from the Security Review process ONP-0005
Section 6.3 already defines: that process evaluates whether a
*specification's text* introduces a security gap before it reaches
Candidate status. This document evaluates whether an *implementation*
of already-published specifications actually enforces the
security-critical MUST rules those specifications contain — a
different failure mode entirely, since a specification can be
perfectly sound while an implementation of it silently skips a step,
reorders a check, or mishandles a cryptographic comparison.

---

# Status of This Document

This document is part of the ONP Reference series (ONP-9000-9999).
It is Informational: it introduces no new normative requirement.
Every checklist item cites the specific normative rule it verifies
conformance against; where this document's phrasing and the cited
specification differ, the specification governs.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000. As in ONP-9001, this document restates existing
requirements for checkability; it does not create new ones.

---

# 1. Introduction

A specification can be exactly right and an implementation of it can
still be wrong — reordering ONP-1003 Section 6.1's validation steps,
comparing signatures with a non-constant-time function, or letting a
Companion validation failure leak into `core_authenticated` are all
implementation bugs no amount of specification-text review catches,
because the text was never the problem. This document collects the
checks an implementer SHOULD run against their own code, organized
by the security property each one verifies, so that "did we actually
build this correctly" has a concrete answer beyond re-reading thirty
specifications from memory.

---

# 2. Scope

## 2.1 In Scope

* implementation-level checks for Core validation ordering, Trust
  Anchor resolution, algorithm handling, layer separation, lineage
  and freshness handling, and Extension conflict detection;
* general cryptographic implementation hygiene (constant-time
  comparison, private key handling) not previously stated anywhere in
  this series, because it is implementation practice rather than
  protocol behavior.

## 2.2 Out of Scope

This document does NOT:

* replace or duplicate the spec-level Security Review process
  (ONP-0005 Section 6.3), which evaluates specification text before
  Candidate status, not running code;
* constitute or substitute for professional security review,
  penetration testing, or audit of an actual deployment — a checklist
  reduces risk, it does not eliminate it (Section 8);
* guarantee that passing every item here means an implementation is
  free of vulnerabilities.

---

# 3. Terminology

**Conformance Test (implementation sense)**
: A check verifying that a running implementation, not a
  specification's text, correctly enforces a stated security
  requirement. Distinct from the Security Review (ONP-0005 Section
  6.3), which evaluates specification text.

---

# 4. Guidance

## 4.1 Core Validation Ordering

```
[ ] Structural checks (ONP-1000 Section 6.1) run and can reject
    BEFORE any cryptographic operation is attempted
[ ] VID structural integrity (ONP-1001 Section 4.5) is checked and
    can reject BEFORE Trust Anchor resolution or signature
    verification begin
[ ] Algorithm Registry check (ONP-0005 Section 6.1) rejects
    forbidden/unrecognized algorithms BEFORE any cryptographic
    verification is attempted on them
[ ] A Core-level rejection at any step is genuinely terminal — no
    code path continues to Companion/Extension processing after a
    Core failure (ONP-1000 Section 6.1; ONP-1004 Section 4.2)
```

## 4.2 Trust Anchor Resolution

```
[ ] TLS certificate validation for a publisher's domain is not
    skipped, weakened, or bypassed under any configuration
    (ONP-0004 Section 4.2, rule 3)
[ ] Previous Keys' validity windows (valid_from/valid_until) are
    actually checked against the Object's signed_at, not assumed
    (ONP-0004 Section 4.4, rule 3)
[ ] revoked_at is checked and treated as terminal even within an
    otherwise-valid window (ONP-0004 Section 4.4, rule 4)
[ ] An ambiguous or stripped Trust Anchor Type declaration is
    rejected, not silently downgraded to a weaker mechanism
    (ONP-0005 Section 4.4)
```

## 4.3 Algorithm Handling

```
[ ] An unrecognized or forbidden algorithm causes rejection, not a
    silent fallback to a default (ONP-0005 Section 4.2, rule 3)
[ ] The signature's declared algorithm is cross-checked against the
    Publisher Key Record's declared algorithm for that key_id, not
    merely accepted at face value (ONP-1003 Section 4.5, step 4)
[ ] VID verification uses the algorithm named IN the VID string
    itself, not the implementation's current default algorithm
    (ONP-1001 Section 8.3)
[ ] Signature and hash comparison use constant-time comparison
    functions, not naive byte-by-byte or string equality checks —
    this is implementation practice this series has not previously
    stated explicitly, and is a common, subtle source of
    timing-based side-channel vulnerabilities in cryptographic code
    generally, independent of anything ONP-specific
```

## 4.4 Layer Separation

```
[ ] No code path exists by which Companion or Extension validation
    logic can set or influence core_authenticated (ONP-1004 Section
    4.2, rule 1; ONP-1000 Section 4.4, rule 1)
[ ] Core validation code genuinely never branches on the contents
    of `content` — verify this by inspection, not merely by absence
    of an obvious bug (ONP-1000 Section 4.4; ONP-1002 Section 4.7)
[ ] companion_valid: "unknown" and companion_valid: "false" are
    distinct code paths, not conflated (ONP-1004 Section 4.3, rule
    3)
```

## 4.5 Lineage and Freshness

```
[ ] Current Version determination follows the supersedes-chain
    algorithm (ONP-0006 Section 6.1), never wall-clock timestamp
    comparison, for establishing order
[ ] A detected Lineage Fork is surfaced, not silently resolved by
    an undocumented tie-breaking rule (ONP-0006 Section 4.6)
[ ] A superseded Version is never presented as current, even if it
    is the only one immediately available (ONP-0005 Section 4.3;
    ONP-0006 Section 4.3)
```

## 4.6 Extension Conflict Detection

```
[ ] The Claim Domain overlap check (ONP-3000 Section 6.1) actually
    runs for every pair of implemented Extensions present on an
    Object, not only when a conflict is expected
[ ] A detected overlap is surfaced per ONP-1004 Section 5.1's
    conflicts array, not silently dropped
```

## 4.7 General Cryptographic Hygiene

```
[ ] Private signing keys are never logged, printed, or included in
    error messages or crash reports
[ ] Private key material is cleared from memory after use where the
    implementation language and runtime make this practical
[ ] Test keypairs (ONP-9000 Section 4.3) are never reachable from
    or confusable with production signing paths
[ ] Random number generation for key creation uses a
    cryptographically secure source, not a general-purpose or
    predictable one
```

---

# 5. Object Model

Not applicable — this document defines no wire-level fields.

---

# 6. Processing Model

## 6.1 Relationship to Reference Implementation Evidence

An implementation SHOULD pass this checklist before being submitted
as Candidate-transition evidence under ONP-9000 Section 4.2 — the
"independent" bar that document sets is about specification-text
sufficiency, while this checklist is about whether the resulting
implementation actually behaves correctly; both matter, and neither
substitutes for the other.

## 6.2 Interoperability

An implementation that fails items in Section 4.1 or 4.4 specifically
risks a subtle, hard-to-detect interoperability failure: it may
appear to work correctly against ordinary Objects while silently
mis-handling adversarial or edge-case ones, precisely the failure
mode ONP-9000's Test Vectors (Section 4.3 of that document) are
designed to catch mechanically where this checklist catches it by
code-level inspection instead.

---

# 7. Examples

## 7.1 A Subtle Bug This Checklist Catches

```
Buggy implementation:
  1. Run Core validation.
  2. Render Article body to the user interface.
  3. THEN check core_authenticated and hide the rendered content
     if false.

Per Section 4.1 and ONP-1004 Section 4.6, rule 2: this is backwards.
The content was already rendered — however briefly — before
authenticity was confirmed. A checklist walkthrough of "does
rendering ever occur before core_authenticated is checked" catches
this; a Test Vector alone, which only checks final output
correctness, would not necessarily catch a bug in this ordering if
the final displayed state happened to look correct in the common
case.
```

---

# 8. Security Considerations

This checklist reduces, but does not eliminate, implementation risk.
Passing every item here is evidence of care, not proof of absence of
vulnerabilities — professional security review of an actual
deployment remains valuable regardless of this document's guidance,
and this document does not claim otherwise.

---

# 9. Privacy Considerations

This document introduces no new privacy mechanism or consideration
beyond what is already established throughout the series.

---

# 10. References

## 10.1 Normative References

The specific citations for each checklist item are given inline in
Section 4; see ONP-0004, ONP-0005, ONP-1000 through ONP-1004,
ONP-0006, and ONP-3000 generally.

## 10.2 Informative References

* ONP-9000, Reference Implementation — Section 4.2 and 4.3, the
  Candidate-transition evidence this checklist complements per
  Section 6.1.
* ONP-9001, Best Practices — the structurally parallel, non-security-
  specific companion to this document.

---

# Appendix A: Full Security Checklist (Consolidated)

```
CORE VALIDATION ORDERING
[ ] Structural checks reject before cryptographic operations
[ ] VID integrity checked before Trust Anchor resolution/signature
[ ] Algorithm Registry checked before cryptographic verification
[ ] Core rejection is genuinely terminal

TRUST ANCHOR RESOLUTION
[ ] TLS validation never skipped or weakened
[ ] Previous Keys validity windows actually checked
[ ] revoked_at checked and terminal
[ ] Ambiguous Trust Anchor Type rejected, not downgraded

ALGORITHM HANDLING
[ ] Unrecognized/forbidden algorithms rejected, no silent fallback
[ ] Signature algorithm cross-checked against Publisher Key Record
[ ] VID verified using its own embedded algorithm, not current default
[ ] Constant-time comparison used for signatures/hashes

LAYER SEPARATION
[ ] No Companion/Extension code path affects core_authenticated
[ ] Core validation never branches on content
[ ] companion_valid "unknown" vs "false" kept distinct

LINEAGE AND FRESHNESS
[ ] Current Version determined via supersedes chain, not timestamps
[ ] Lineage Forks surfaced, not silently resolved
[ ] Superseded Versions never presented as current

EXTENSION CONFLICT DETECTION
[ ] Claim Domain overlap check runs for every Extension pair present
[ ] Detected overlaps surfaced, not dropped

GENERAL CRYPTOGRAPHIC HYGIENE
[ ] Private keys never logged or included in error output
[ ] Private key memory cleared after use where practical
[ ] Test keypairs isolated from production signing paths
[ ] CSPRNG used for key generation
```

---
*End of Document*
