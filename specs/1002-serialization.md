Title: Open News Protocol (ONP): Serialization
Document Number: ONP-1002
Status: Working Draft
Version: 0.1.1
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document fixes the exact byte-level canonical form every ONP
Node MUST produce from a News Object envelope, and defines the
generic Pre-Image construction mechanism — field exclusion followed
by canonicalization — that ONP-1001 already used for the VID
Pre-Image and that the forthcoming ONP-1003 will use for its signing
pre-image. It adopts RFC 8785 (JSON Canonicalization Scheme, JCS) as
the REQUIRED canonicalization algorithm rather than defining a new
one, consistent with Principle P3 (Ordinary Technology, ONP-0003).

---

# Status of This Document

This document is part of the ONP Core series (ONP-1000-1999). It is
directly implementable and is a hard dependency of ONP-1001 (already
published, referencing this document for the exact byte form of the
VID Pre-Image) and of the forthcoming ONP-1003. It is a Working
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

ONP-1001 defined VID as the hash of a canonically serialized
Pre-Image, and deferred "canonically serialize" to this document
five times. The reason a fixed canonical form matters this much:
two independently written Nodes that disagree on how to serialize
the same logical JSON object — different key order, different
whitespace, different number formatting — would compute different
hashes and different signatures for content a human would call
identical. That would silently break both content-addressing
(ONP-1001) and authenticity verification (ONP-1003) across
implementations, without either implementation being "wrong" in the
ordinary sense. This document closes that gap once, for every
Core and future Companion/Extension operation that needs
deterministic bytes, rather than leaving each of them to define
canonicalization independently.

---

# 2. Scope

## 2.1 In Scope

* the REQUIRED canonicalization algorithm (JCS, RFC 8785);
* the generic Pre-Image construction procedure: field exclusion,
  then canonicalization;
* the named Pre-Image Profiles already implied by ONP-1001 and
  ONP-1003, and the registration discipline for future ones;
* practical guidance on number and string representation to avoid
  ambiguity that JCS alone does not resolve;
* array ordering semantics.

## 2.2 Out of Scope

This document does NOT define:

* which specific fields are excluded for the VID Pre-Image (owned
  by ONP-1001) or the signing pre-image (owned by ONP-1003) — this
  document defines the mechanism, those documents define the
  Profile's field list;
* the hash or signature algorithms themselves (ONP-1003, and the
  Algorithm Registry in ONP-0005);
* any Companion- or Extension-specific serialization needs beyond
  participating correctly in whole-envelope canonicalization.

---

# 3. Terminology

This document is the owning specification for the following terms.

**Canonical Form**
: The unique, deterministic byte sequence RFC 8785 (JCS) produces
  for a given JSON value. Two JSON values that are semantically
  equal MUST produce identical Canonical Form bytes.

**Pre-Image Profile**
: A named, registered set of top-level envelope field names to
  exclude before canonicalization, used to construct a Pre-Image for
  a specific purpose (e.g. VID computation, signing).

**Pre-Image**
: The Canonical Form bytes resulting from applying a named Pre-Image
  Profile's field exclusions to an envelope, then canonicalizing
  what remains. ONP-1001's "VID Pre-Image" is the first instance of
  this general mechanism.

---

# 4. Requirements

## 4.1 Canonicalization Algorithm

1. Every ONP Node MUST use RFC 8785, the JSON Canonicalization
   Scheme (JCS), to produce the Canonical Form of any JSON value
   requiring deterministic byte representation.
2. A Node MUST NOT define or accept a locally-invented alternative
   canonicalization algorithm for any Core operation; JCS is the
   sole REQUIRED algorithm, consistent with Principle P3 — an
   existing, already-specified standard is reused rather than a new
   one invented.
3. Implementers SHOULD use an existing, well-tested JCS library
   rather than a hand-written implementation, per the correctness
   risk discussed in Section 8.

## 4.2 Pre-Image Construction Procedure

Given an envelope E and a named Pre-Image Profile P with an
excluded-field set F:

1. Start from the complete envelope E as received or assembled.
2. Remove every top-level key in F entirely from the structure — not
   set to `null`, not set to an empty value, but absent, as if it
   had never been present.
3. Apply JCS (Section 4.1) to the remaining structure.
4. The resulting bytes are the Pre-Image for Profile P applied to E.

A Node MUST follow this exact procedure for every defined Pre-Image
Profile (Section 4.3); no Profile may substitute a different
construction method.

## 4.3 Defined Pre-Image Profiles

1. The `vid-preimage` Profile excludes `{ vid, signature }`. Its
   field list is owned and normatively fixed by ONP-1001 Section
   4.3; this document only fixes the mechanism it uses.
2. The `signing-preimage` Profile excludes `{ signature }` only
   (retaining the now-assigned `vid`). Its exact field list and use
   are owned by the forthcoming ONP-1003; it is named here only so
   that ONP-1003 does not need to redefine the Pre-Image mechanism
   itself.
3. A future Companion or Extension that requires its own Pre-Image
   Profile for an internal cryptographic operation MUST register the
   Profile's name and excluded-field set in ONP-0002, following the
   same registration discipline as any other new term, before that
   Profile may be used normatively by any specification.

## 4.4 Number Representation Guidance

1. JCS canonicalizes JSON numbers per IEEE 754 double-precision
   semantics. A Node MUST rely on this for any numeric field it
   canonicalizes.
2. Any field requiring exact decimal fidelity — most notably
   monetary amounts — SHOULD NOT use the JSON number type, and
   SHOULD instead be represented as a string (e.g. `"0.05"` rather
   than `0.05`), to avoid floating-point representation ambiguity
   entirely rather than relying on canonicalization to resolve it.
   This guidance is binding on the forthcoming ONP-2500 (Payments):
   that Companion MUST represent monetary amounts as strings, not
   JSON numbers, citing this rule.

## 4.5 String and Character Encoding

1. Canonical Form output MUST be UTF-8 encoded.
2. Canonical Form output MUST NOT include a byte-order mark.
3. Publishers SHOULD use Unicode Normalization Form C (NFC) for
   string field content. This is a content-quality recommendation,
   not a canonicalization requirement JCS itself enforces — JCS
   canonicalizes the JSON structure as given, it does not normalize
   Unicode content within strings — so two byte-distinct but
   visually identical strings remain distinct after canonicalization
   unless the publisher's own tooling normalizes them first.

## 4.6 Array Ordering

1. JCS preserves array element order; it reorders object keys only,
   never array elements.
2. A Node MUST treat array order as semantically significant by
   default. A Companion or Extension whose array field is intended
   to be order-independent MUST document that explicitly in its own
   Requirements section; Core provides no automatic order
   normalization for such cases.

## 4.7 Content Region Participation

The opaque `content` region (ONP-1000 Section 4.4) MUST fully
participate in canonicalization as an ordinary part of the envelope
structure. Opacity is a semantic property — Core does not interpret
what `content` means — not a structural exemption; `content`'s
bytes are included in every Pre-Image exactly like any other field,
which is what makes tampering with `content` detectable by the same
signature that protects the rest of the envelope.

---

# 5. Object Model

## 5.1 Pre-Image Profile Registry Entry

| Field | Required | Description |
|---|---|---|
| `profile_name` | REQUIRED | Stable identifier, e.g. `vid-preimage`. |
| `excluded_fields` | REQUIRED | The top-level envelope keys removed before canonicalization. |
| `owning_document` | REQUIRED | The specification that fixes this Profile's field list. |
| `purpose` | REQUIRED | One-line description of what the resulting Pre-Image is used for. |

---

# 6. Processing Model

## 6.1 Canonicalization and Pre-Image Construction, Combined

```
Given: envelope E, Profile name P

1. Look up P in the Pre-Image Profile Registry (Section 5.1) to
   obtain its excluded_fields set F.
2. Remove every key in F from E (Section 4.2, step 2).
3. Apply JCS (RFC 8785) to the result.
4. Output: the Pre-Image bytes for P applied to E.
```

## 6.2 Interoperability

RFC 8785's entire design goal is that any two conformant JCS
implementations, given the same abstract JSON value, produce
byte-identical output. This document's contribution is fixing which
algorithm that must be (JCS, not an alternative) and which fields
are removed before it runs (the Pre-Image Profile). Together, these
two facts are what let a Node built by one team and a Node built by
an entirely different team compute the same VID, and independently
verify the same signature, for the same News Object — the concrete
mechanism behind the interoperability guarantee every Core document
so far has promised at a higher level of abstraction.

---

# 7. Examples

## 7.1 Canonicalization Effect (Illustrative)

```
Input (equivalent JSON, differently formatted):
{
  "content_type" : "onp:companion:article",
  "oid":"onp:oid:regiopurmerend.nl:fusie-onderzoek-necker-van-naem",
  "publisher": {"key_id": "onp:key:2026-07-01", "domain": "regiopurmerend.nl"}
}

Canonical Form (JCS): keys sorted, whitespace removed:
{"content_type":"onp:companion:article","oid":"onp:oid:regiopurmerend.nl:fusie-onderzoek-necker-van-naem","publisher":{"domain":"regiopurmerend.nl","key_id":"onp:key:2026-07-01"}}
```

Note `publisher`'s inner keys are also sorted (`domain` before
`key_id`), and outer keys are sorted (`content_type`, `oid`,
`publisher`) — JCS sorts recursively at every object level.

## 7.2 Completing ONP-1001's VID Computation Walkthrough

```
1. Assemble the full envelope minus vid and signature
   (vid-preimage Profile, Section 4.3, rule 1).
2. Apply this document's Section 6.1 procedure:
   remove {vid, signature} -> apply JCS -> Pre-Image bytes.
3. Hash those exact bytes with the required-baseline algorithm
   (ONP-0005 Appendix A) to obtain the VID's digest
   (ONP-1001 Section 4.3).

This is the step ONP-1001 Section 7.2 labeled "canonically
serialize," now fully specified.
```

## 7.3 Monetary Amount, Correctly Represented

```
CORRECT (per Section 4.4, rule 2):
  "price": "0.05"

AVOID:
  "price": 0.05
  (JCS/IEEE 754 double-precision canonicalization of this exact
  value is well-defined, but relying on floating-point
  representation for money is fragile practice this document
  recommends avoiding entirely, rather than trusting every future
  implementation to get the edge cases right.)
```

---

# 8. Security Considerations

Canonicalization correctness is security-critical, not merely a
data-hygiene concern: if two implementations disagreed on canonical
form for JSON values a human would call equivalent, they would
compute different hashes and signatures for "the same" content,
which could either cause spurious verification failures (an
availability problem) or, in a worse case, allow an adversary to
construct two different byte representations that a careless
implementation treats as canonically equal when they are not. JCS's
design (operating on the parsed abstract JSON value, not on
arbitrary input bytes) closes most of this risk by construction;
this document's Section 4.1, rule 3 (use a well-tested library) is
the practical mitigation for the remainder, since a subtly
non-conformant hand-written JCS implementation reintroduces exactly
this risk despite the specification being unambiguous.

---

# 9. Privacy Considerations

This document defines a syntactic transformation with no data
retention or collection behavior of its own and introduces no
privacy impact.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* [RFC8785] Rundgren, A., Jordan, B., Erdtman, S., "JSON
  Canonicalization Scheme (JCS)", RFC 8785 — the REQUIRED
  canonicalization algorithm fixed in Section 4.1.
* ONP-0003, Design Principles — Principle P3 (Ordinary Technology),
  motivating adoption of an existing standard over a new algorithm.
* ONP-1000, News Object — Section 4.4, the content opacity rule this
  document's Section 4.7 restates as a canonicalization-participation
  rule.
* ONP-1001, Identifiers — the first consumer of the Pre-Image
  mechanism (`vid-preimage` Profile), completed here.

## 10.2 Informative References

* ONP-0005, Security Model — the Algorithm Registry (Appendix A)
  consumed in Section 7.2's walkthrough.
* ONP-1003, Digital Signatures (forward reference — the
  `signing-preimage` Profile named but not fixed in Section 4.3,
  rule 2).
* ONP-2500, Payments (forward reference — bound by Section 4.4,
  rule 2's monetary representation requirement).

---

# Appendix A: JCS Core Rules (Informative Summary)

```
- Object keys are sorted by their UTF-16 code unit sequence.
- No insignificant whitespace anywhere in the output.
- Strings are escaped per JCS's fixed escaping rules.
- Numbers are formatted per IEEE 754 double-precision semantics,
  using JCS's specific number-to-string algorithm (ECMAScript's
  Number::toString behavior).
- Arrays preserve their original element order.
- Output is UTF-8, no byte-order mark.

This is a summary for readability; RFC 8785 itself is authoritative
in case of any discrepancy.
```

# Appendix B: Initial Pre-Image Profile Registry

| profile_name | excluded_fields | owning_document | purpose |
|---|---|---|---|
| `vid-preimage` | `vid`, `signature` | ONP-1001 | Computing the content-addressed Version Identifier |
| `signing-preimage` | `signature` | ONP-1003 | Computing the cryptographic signature over a Version |

---
*End of Document*
