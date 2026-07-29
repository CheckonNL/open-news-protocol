Title: Open News Protocol (ONP): Digital Signatures
Document Number: ONP-1003
Status: Working Draft
Version: 0.2.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-29

---

# Abstract

This document fixes the exact `signature` field format, defines the
`signing-preimage` Pre-Image Profile that ONP-1002 named but left
for this document to fill in, and specifies the full signing and
verification procedures. It confirms Ed25519 as the required-
baseline signature algorithm already listed in ONP-0005 Appendix A,
and integrates ONP-1001 (identifiers), ONP-1002 (canonicalization),
and ONP-0004 (Trust Anchor resolution) into one end-to-end
verification pipeline. With this document, the minimal Core chain
(ONP-1000 through ONP-1003) is complete: a Node implementing only
these four documents can fully verify any News Object.

---

# Status of This Document

This document is part of the ONP Core series (ONP-1000-1999). It is
directly implementable and is the document that ONP-1000 (Section
4.1), ONP-1002 (Section 4.3), ONP-0004 (Section 6.1), and ONP-0005
(Section 4.2) all forward-referenced. It is a Working Draft.

**Correction note:** while drafting this document, it became
apparent that ONP-1000's envelope lacked a field ONP-0004's key
rotation validity-window check requires — the Object's own claimed
signing time. ONP-1000 has been corrected to version 0.2.0, adding
`signed_at` as a seventh REQUIRED envelope field, classified MINOR
under ONP-0007 Section 4.2 with explicit callout there. This
document consumes that field (Section 4.4) but does not own it.

**Version note (0.2.0):** this revision adds Appendix C, which fixes
the algorithm-specific wire encodings — the exact signature-output and
public-key byte formats, and the digest applied before signing — for
both the `ed25519` required-baseline and the `ecdsa-p256`
`recommended` algorithm (ONP-0005 Appendix A). The Ed25519 encoding
was previously implicit; the ECDSA-P256 encoding was undefined, a gap
a second reference-implementation signature provider surfaced. Fixing
it is additive and breaks no existing Requirement, classified MINOR
under ONP-0007 Section 4.2. Section 4.2 gains rule 3, a pointer to the
new appendix.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

"Trust the Object, not the Messenger" has, until this document, been
a promise under construction: ONP-1001 fixed how an Object names
itself, ONP-1002 fixed how an Object's bytes become deterministic,
ONP-0004 fixed how a Node learns which key a publisher actually
controls. This document is where those three pieces are finally
put to use for their intended purpose — proving that a specific,
unmodified Object was produced by the key its `publisher` field
claims, at the time its `signed_at` field claims, in a way any
independent Node can check without asking anyone's permission.

---

# 2. Scope

## 2.1 In Scope

* the exact `signature` field format;
* the `signing-preimage` Pre-Image Profile's field list;
* the signing procedure;
* the verification procedure, integrating Algorithm Registry
  checking, Trust Anchor resolution, and cryptographic verification;
* the required-baseline algorithm confirmation (Ed25519);
* the cross-check between a signature's declared algorithm and the
  algorithm the resolved Publisher Key Record states for that key.

## 2.2 Out of Scope

This document does NOT define:

* the Algorithm Registry's governance or full content (ONP-0005);
* Trust Anchor resolution mechanics themselves (ONP-0004);
* canonicalization mechanics (ONP-1002) or identifier mechanics
  (ONP-1001) — this document consumes both;
* the multi-level validation procedure beyond the Core-level
  signature step (ONP-1004 owns the full
  procedure including Companion/Extension-level validation).

---

# 3. Terminology

This document is the owning specification for the following term.

**Signature String**
: The exact wire encoding of the `signature` field, taking the form
  fixed in Section 4.2.

Terms used but owned elsewhere: **Signature** (ONP-0001, this
document supplies its structural definition, fulfilling the
registry's "structurally defined in ONP-1003" reference), **Pre-Image
Profile**, **Pre-Image** (ONP-1002, this document fills in the
`signing-preimage` Profile those terms' mechanism supports),
`signed_at` (ONP-1000, this document consumes but does not own it).

---

# 4. Requirements

## 4.1 Signing Pre-Image (Finalizing `signing-preimage`)

1. The `signing-preimage` Pre-Image Profile (named in ONP-1002
   Section 4.3, rule 2) MUST exclude exactly `{ signature }` and
   include every other envelope field, including the now-assigned
   `vid` and the `signed_at` field.
2. A Node MUST construct the signing pre-image using the exact
   procedure in ONP-1002 Section 4.2 (field exclusion, then JCS
   canonicalization).

## 4.2 Signature Field Format

1. `signature` MUST take the form `onp:sig:<algorithm-id>:<digest>`,
   where `<algorithm-id>` is the lowercase wire form of an Algorithm
   Registry entry (ONP-0005 Section 5.1) with `purpose = signature`,
   and `<digest>` is the base64url-encoded (unpadded) signature
   bytes.
2. Wire-level algorithm identifiers embedded in any ONP identifier
   or signature string (`oid`, `vid`, `signature`) MUST be lowercase.
   The Algorithm Registry's display table (ONP-0005 Appendix A) MAY
   use different display casing (e.g. "Ed25519"); its lowercase form
   (`ed25519`) is what is embedded on the wire. This resolves a
   casing inconsistency between ONP-1001's examples and ONP-0005's
   display table, neither of which was normatively wrong, but which
   this document now fixes explicitly to remove ambiguity.
3. The raw bytes carried in `<digest>` (the signature output, before
   base64url) and in the `public_key` of the signer's Publisher Key
   Record entry (ONP-0004 Section 5.1) are algorithm-specific. Their
   exact encoding — including any digest applied before signing — is
   fixed per algorithm-id in Appendix C. A Node MUST reject (fail
   closed) a signature or public key whose length or structure does
   not match Appendix C for the declared algorithm-id.

## 4.3 Required-Baseline Algorithm

1. Every conforming Node MUST support Ed25519 (wire form `ed25519`)
   for both signing and verification, per its `required-baseline`
   status in ONP-0005 Appendix A.
2. A Node MAY support additional `recommended`-status algorithms
   from the Algorithm Registry, consistent with Cryptographic
   Agility (ONP-0005 Section 4.2), but MUST NOT claim conformance
   without Ed25519 support.

## 4.4 Signing Procedure

A publisher signing a News Object MUST perform the following, in
order:

```
1. Assemble the envelope with oid, vid (per ONP-1001), publisher,
   signed_at, content_type, content, and any OPTIONAL fields set,
   but without signature.
2. Construct the signing pre-image (Section 4.1).
3. Sign the signing pre-image bytes using the private key
   corresponding to publisher.key_id, with the algorithm that key's
   Publisher Key Record entry (ONP-0004 Section 5.1) declares.
4. Encode the resulting signature bytes as unpadded base64url.
5. Form signature = "onp:sig:" + algorithm-id + ":" + encoded-bytes.
6. Add signature to the envelope. The envelope is now complete.
```

## 4.5 Verification Procedure

A Node verifying a News Object MUST perform the following, in order,
after the structural checks ONP-1000 Section 6.1 and ONP-1001
Section 6.1 already require:

```
1. Parse the signature field into algorithm-id and digest.
2. Check algorithm-id against the Algorithm Registry
   (ONP-0005 Section 6.1). REJECT (fail closed) if forbidden or
   unrecognized.
3. Resolve the Trust Anchor for publisher.domain / publisher.key_id
   at claimed time signed_at, per ONP-0004 Section 6.1.
   REJECT if resolution fails.
4. Cross-check: does the algorithm-id in this Object's signature
   match the algorithm the resolved Publisher Key Record (ONP-0004
   Section 5.1) declares for publisher.key_id?
   REJECT if they disagree (Section 8.1).
5. Reconstruct the signing pre-image from the Object's own fields
   (Section 4.1).
6. Cryptographically verify the signature over the reconstructed
   pre-image, using the public key resolved in step 3 and the
   algorithm confirmed in step 4.
   REJECT if verification fails.
7. If all of steps 1-6 succeed, the Object is Core-authenticated.
```

## 4.6 Ordering Relative to Other Core Checks

The full Core-level validation of a News Object, combining every
Core document published so far, MUST proceed in this order and MUST
NOT be reordered:

```
1. ONP-1000 Section 6.1: envelope structural check
   (required fields present, well-formed).
2. ONP-1001 Section 6.1: OID domain match, Local Identifier
   grammar, VID structural integrity (recomputed hash match).
3. This document, Section 4.5: Algorithm Registry check, Trust
   Anchor resolution, algorithm cross-check, cryptographic
   signature verification.
```

A failure at any step is terminal for Core validation; no later step
is evaluated, and Companion/Extension-level processing (ONP-0001
Section 6.2, levels 2-3) MUST NOT begin.

---

# 5. Object Model

## 5.1 Signature Grammar (ABNF-Style)

```
signature        = "onp:sig:" algorithm-id ":" digest

algorithm-id     = 1*32( ALPHA-LOWER / DIGIT / "-" )
                    ; MUST match an Algorithm Registry identifier
                    ; (ONP-0005 Appendix A), lowercased,
                    ; e.g. "ed25519"

digest           = 1*( BASE64URL-CHAR )
                    ; unpadded base64url encoding of the raw
                    ; signature output bytes

ALPHA-LOWER      = %x61-7A  ; a-z
DIGIT            = %x30-39  ; 0-9
BASE64URL-CHAR   = ALPHA-LOWER / %x41-5A / DIGIT / "-" / "_"
```

This mirrors the OID/VID grammar established in ONP-1001 Appendix A,
so an implementer who has already parsed those needs no new parsing
logic beyond a different prefix.

---

# 6. Processing Model

## 6.1 Full End-to-End Core Validation Pipeline (Capstone)

This section assembles every Core document published so far into
one pipeline, for implementers who want the complete picture in one
place rather than following forward references across four
documents:

```
INPUT: a received News Object (raw JSON)

STEP 1 (ONP-1000): Parse top-level JSON. Confirm the seven REQUIRED
  keys are present and individually well-formed. Apply defaults for
  absent OPTIONAL keys.
  -> FAIL if malformed.

STEP 2 (ONP-1001): Confirm oid's domain component matches
  publisher.domain. Confirm local-id grammar. Recompute the
  vid-preimage hash (ONP-1002 mechanism) and compare to the
  declared vid.
  -> FAIL if mismatched.

STEP 3 (this document, Section 4.5): Check signature's algorithm
  against the Algorithm Registry. Resolve the Trust Anchor for
  publisher.domain/key_id at signed_at. Cross-check algorithm
  agreement. Reconstruct the signing-preimage (ONP-1002 mechanism)
  and cryptographically verify.
  -> FAIL if any sub-step fails.

STEP 4: If all of STEP 1-3 pass, the Object is Core-authenticated.
  Hand off to Companion-level processing (per content_type) and
  Extension-level processing (per onp:extensions namespaces),
  neither of which can affect the outcome of STEPS 1-3 (Vertical
  Invariant, ONP-0001 Section 4.1).

OUTPUT: Core-authenticated Object, ready for Companion/Extension
  interpretation — or a terminal rejection at whichever step failed.
```

## 6.2 Interoperability

A Node implementing exactly ONP-1000 through ONP-1003 — no
Companions, no Extensions, no knowledge of any specific
`content_type` or `onp:extensions` namespace — MUST be able to run
the complete pipeline in Section 6.1 and correctly accept or reject
any News Object on Core grounds alone. This is the concrete,
now-fully-specified form of the interoperability guarantee every
prior Core and Foundation document promised in the abstract; with
this document, that promise is no longer aspirational.

---

# 7. Examples

## 7.1 End-to-End: Sign and Verify

```
1. Publisher assembles envelope (oid, publisher, signed_at,
   content_type, content) without vid or signature.
2. Publisher computes vid (ONP-1001 Section 4.3, using ONP-1002's
   vid-preimage Profile) -> vid = "onp:vid:sha-256:AbC123..."
3. Publisher adds vid to the envelope.
4. Publisher constructs the signing pre-image (this document,
   Section 4.1) -> canonical bytes including oid, vid, publisher,
   signed_at, content_type, content.
5. Publisher signs those bytes with the Ed25519 private key for
   onp:key:2026-07-01.
6. signature = "onp:sig:ed25519:base64url(sig-bytes)"
7. Publisher adds signature. Envelope is complete and published.

--- Node receiving this Object ---

8. Node runs ONP-1000 Section 6.1 -> structurally valid.
9. Node runs ONP-1001 Section 6.1 -> vid matches recomputed hash.
10. Node runs this document's Section 4.5:
    - algorithm-id "ed25519" is required-baseline -> OK
    - Trust Anchor resolves: regiopurmerend.nl's Publisher Key
      Record lists onp:key:2026-07-01 as current, algorithm
      "Ed25519" -> matches signature's declared "ed25519" -> OK
    - signing-preimage reconstructed, matches what was signed
    - cryptographic verification succeeds
11. Object is Core-authenticated.
```

## 7.2 Algorithm Cross-Check Catching a Downgrade Attempt

```
Publisher Key Record states onp:key:2026-07-01 uses algorithm
"Ed25519".
An adversary crafts an Object claiming:
  signature = "onp:sig:ecdsa-p256:forged-bytes"
  publisher.key_id = "onp:key:2026-07-01"

Node's Section 4.5, step 4 cross-check:
  Publisher Key Record says this key_id is Ed25519.
  Signature claims ecdsa-p256.
  MISMATCH -> REJECT, before even attempting cryptographic
  verification. This defeats an attempt to claim a different
  algorithm than the actual key uses, which Section 8.1 discusses
  further.
```

## 7.3 Fail-Closed on Unrecognized Algorithm

```
Object declares: signature = "onp:sig:md5:..."
Algorithm Registry (ONP-0005 Appendix A): MD5 status = forbidden
  (and, separately, purpose = hash, not signature — doubly invalid)
Node: REJECT at Section 4.5, step 2, before any further processing.
```

---

# 8. Security Considerations

## 8.1 The Algorithm Cross-Check Closes a Downgrade Gap

Without Section 4.5, step 4 (the cross-check between a signature's
declared algorithm and the Publisher Key Record's declared algorithm
for that key), an adversary controlling only the network path (not
the key) could potentially relabel a signature's declared algorithm
to something a poorly implemented Node accepts more permissively,
even though the underlying key was never meant to be used with that
algorithm. Requiring agreement between what the signature claims and
what the publisher's own key record states removes this gap without
requiring any change to ONP-0004 or ONP-0005 — it is a consistency
check this document introduces at the point where both pieces of
information are simultaneously available.

## 8.2 This Document Completes, Not Replaces, Prior Security
     Analysis

Nothing in this document weakens or overrides the adversary model
(ONP-0005 Section 4.1), the compromise-window limitation (ONP-0004
Section 8.1), or the layer-confusion protections (ONP-0001, ONP-0005
Section 4.5). This document's contribution is making those already-
analyzed properties concretely checkable in code (Section 6.1), not
introducing new trust assumptions.

## 8.3 Signing Pre-Image Completeness

Because the signing pre-image (Section 4.1) includes every envelope
field except `signature` itself — critically, including `content`
and `onp:extensions` — a valid signature covers the entire Object as
received, not merely its Core fields. Tampering with `content` or
any Extension namespace after signing invalidates the signature just
as surely as tampering with `oid` would, even though Core-level
validation does not interpret `content`'s meaning (ONP-1000 Section
4.4, ONP-1002 Section 4.7).

---

# 9. Privacy Considerations

The `signature` field and Algorithm Registry identifiers carry no
personal data. `signed_at`'s privacy implications (revealing
publication timing) are already addressed at the general level in
ONP-0006 Section 9 and are not repeated here; this document only
consumes that field, it does not introduce a new privacy
consideration beyond what ONP-0006 already covers.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* [RFC8032] Josefsson, S. and I. Liusvaara, "Edwards-Curve Digital
  Signature Algorithm (EdDSA)", RFC 8032 — the Ed25519 signature and
  public-key byte encodings fixed in Appendix C.1.
* [FIPS186-5] National Institute of Standards and Technology,
  "Digital Signature Standard (DSS)", FIPS PUB 186-5 — NIST P-256
  (secp256r1) and ECDSA, per Appendix C.2.
* [SEC1] Certicom Research, "SEC 1: Elliptic Curve Cryptography",
  Version 2.0 — the compressed point encoding used for `ecdsa-p256`
  public keys in Appendix C.2.
* [RFC6979] Pornin, T., "Deterministic Usage of the Digital
  Signature Algorithm (DSA) and Elliptic Curve Digital Signature
  Algorithm (ECDSA)", RFC 6979 — the deterministic nonce and low-S
  form referenced in Appendix C.2.
* [RFC7518] Jones, M., "JSON Web Algorithms (JWA)", RFC 7518 — the
  `ES256` conventions (P-256, SHA-256, raw r||s) Appendix C.2 aligns
  with for eIDAS / EUDI interoperability.
* ONP-0000, Introduction; ONP-0001, Architecture — own the term
  "Signature"; this document supplies its structural definition.
* ONP-0003, Design Principles — Principle P3 (Ordinary Technology),
  motivating reuse of an existing, well-analyzed algorithm
  (Ed25519) rather than a bespoke one.
* ONP-0004, Trust Model — Section 6.1 (Resolution Algorithm) and
  Section 5.1 (Publisher Key Record's `algorithm` field), both
  consumed directly in Section 4.5 of this document.
* ONP-0005, Security Model — the Algorithm Registry (Section 5.1 /
  Appendix A) and Cryptographic Agility (Section 4.2), both fixed
  concretely here.
* ONP-1000, News Object — the envelope this document's `signature`
  and (consumed) `signed_at` fields belong to; corrected to v0.2.0
  alongside this document's publication (see Status of This
  Document).
* ONP-1001, Identifiers — Section 6.1's validation ordering, which
  this document's Section 4.6 extends.
* ONP-1002, Serialization — the Pre-Image mechanism this document's
  Section 4.1 finalizes for the `signing-preimage` Profile.

## 10.2 Informative References

* ONP-1004, Validation — the full multi-level
  validation procedure that wraps this document's Section 6.1
  Core-level pipeline with Companion/Extension-level checks).

---

# Appendix A: Signing Checklist

```
[ ] Envelope assembled without vid and signature
[ ] vid computed (ONP-1001) and added
[ ] signing pre-image constructed (Section 4.1: exclude signature
    only, canonicalize per ONP-1002)
[ ] signed with the private key matching publisher.key_id,
    using that key's declared algorithm
[ ] signature = "onp:sig:" + algorithm-id + ":" + base64url(bytes)
[ ] signature added; envelope complete
```

# Appendix B: Full Core Verification Checklist

```
[ ] ONP-1000: seven REQUIRED fields present and well-formed
[ ] ONP-1001: oid domain matches publisher.domain; local-id
    well-formed; vid matches recomputed hash
[ ] This document: signature algorithm recognized and not
    forbidden
[ ] This document: Trust Anchor resolves (ONP-0004) for
    publisher.domain/key_id at signed_at
[ ] This document: signature's algorithm matches the Publisher
    Key Record's declared algorithm for that key_id
[ ] This document: signing-preimage reconstructed and signature
    cryptographically verified
[ ] All of the above pass -> Object is Core-authenticated;
    proceed to Companion/Extension processing
[ ] Any failure -> REJECT; do not proceed further
```

# Appendix C: Algorithm-Specific Wire Encodings

The Signature String (Section 4.2) and the `public_key` of a Publisher
Key Record entry (ONP-0004 Section 5.1) both carry raw
algorithm-output bytes as unpadded base64url. Those raw bytes are
algorithm-specific. This appendix fixes them normatively for each
Algorithm Registry entry (ONP-0005 Appendix A) whose
`purpose = signature`. A Node MUST reject (fail closed) an Object or a
Publisher Key Record entry whose byte length or structure does not
match the encoding below for its declared algorithm-id.

## C.1 `ed25519` (required-baseline)

* Digest before signing: none applied by ONP. The input to the
  algorithm is the signing pre-image bytes (Section 4.1) directly;
  Ed25519 [RFC8032] performs its own internal hashing (PureEdDSA, not
  Ed25519ph).
* Signature output: the 64-byte Ed25519 signature [RFC8032]
  Section 5.1.6, base64url-unpadded as the `<digest>` of the Signature
  String.
* Public key: the 32-byte Ed25519 public key [RFC8032] Section 5.1.5,
  base64url-unpadded as `public_key`.

This encoding was implicit in v0.1.x and is unchanged; it is stated
here only so every algorithm's encoding lives in one place.

## C.2 `ecdsa-p256` (recommended)

ECDSA over NIST P-256 (secp256r1) [FIPS186-5]. The encoding follows
the JOSE `ES256` conventions [RFC7518] so that keys and signatures
produced by eIDAS and EU Digital Identity Wallet (EUDI) toolchains,
which use the same curve and encoding, interoperate without
transcoding.

* Digest before signing: SHA-256 over the signing pre-image bytes
  (Section 4.1). The resulting 32-byte digest is the input to ECDSA.
* Signature output: the raw `r || s` concatenation — `r` then `s`,
  each a 32-byte big-endian unsigned integer, 64 bytes total —
  base64url-unpadded as the `<digest>` of the Signature String. The
  ASN.1/DER encoding MUST NOT be used. `s` MUST be in the low-S form
  (`s <= n/2`, where `n` is the curve order) [RFC6979]; a Node MUST
  reject a signature that is not exactly 64 bytes or whose `s` is in
  the high-S form, which closes an ECDSA signature-malleability gap.
* Public key: the 33-byte compressed SEC1 point [SEC1] — a leading
  `0x02` or `0x03` parity byte followed by the 32-byte big-endian X
  coordinate — base64url-unpadded as `public_key`. The 65-byte
  uncompressed form MUST NOT be used in `public_key`.

Signing SHOULD use the deterministic nonce of [RFC6979]. Determinism
is a signer-side property only: a verifier MUST NOT treat a
deterministic and a non-deterministic signature over the same key and
pre-image as distinguishable, since only the verification equation and
the encoding constraints above are normative.

> **Status of `ecdsa-p256`.** This algorithm is `recommended`, not
> `required-baseline` (ONP-0005 Appendix A): a conforming Node MUST
> still support `ed25519` (Section 4.3) and MAY additionally support
> `ecdsa-p256`. This appendix ratifies its encoding so the two
> reference implementations and any third party agree on the bytes; it
> does not change Ed25519's baseline status.

---
*End of Document*
