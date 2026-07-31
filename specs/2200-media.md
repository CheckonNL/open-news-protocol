Title: Open News Protocol (ONP): Media
Document Number: ONP-2200
Status: Working Draft
Version: 0.5.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-31

---

# Abstract

This document defines the Media Companion:
`content_type = "onp:companion:media"`, for photos, video, and
audio. ONP-2100 (Article) already referenced Media Objects via
`media_refs` before this Companion existed to define them; this
document closes that gap. Unlike Article, a Media asset's actual
bytes are not embedded in the envelope — embedding binary files in a
signed JSON structure is impractical at typical photo and video
sizes. Instead, this document introduces the Verified Asset
Reference pattern: a REQUIRED content hash travels alongside an
externally-hosted asset's URL, so the actual file remains
cryptographically tamper-evident even though it is not embedded,
extending the content-addressing principle ONP-1001 established for
VID to assets that live outside the envelope entirely.

---

# Status of This Document

This document is part of the ONP Companion series (ONP-2000-2999).
It is directly implementable and follows every mandatory addition
ONP-2000 Section 4.2 requires. It is a Working Draft.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

Article's `media_refs` (ONP-2100 Section 4.7) is an array of Object
References with nothing, until now, on the other end of them. This
document supplies that: a Media Object a Node can independently
verify, reuse across multiple Articles, and update or replace on its
own lifecycle, exactly as ONP-0001 Section 4.2 requires of any
Companion. The one design problem Article never had to solve is
central here: a typical photo or video is too large to embed
sensibly inside a JSON envelope the way Article embeds its full
text. This document solves that without giving up tamper-evidence,
by hashing the asset instead of embedding it.

---

# 2. Scope

## 2.1 In Scope

* the `onp:companion:media` content schema: `media_type`,
  `asset_url`, `asset_hash`, `mime_type`, and the OPTIONAL fields
  `alt_text`, `caption`, `credit`, `width`, `height`,
  `duration_seconds`;
* the Verified Asset Reference pattern and the distinction between
  structural Companion validity and actual asset-byte verification;
* the precedence relationship between `caption` and
  `onp:metadata.title`/`summary`.

## 2.2 Out of Scope

This document does NOT define:

* actual file hosting, storage, CDN, or transcoding mechanics —
  entirely a publisher's own infrastructure concern, consistent with
  Principle P1 (Adjacent Publishing);
* rich accessibility metadata beyond a baseline `alt_text` field —
  owned by ONP-3500 (Accessibility);
* usage rights, crop permissions, or licensing terms for media
  assets — owned by ONP-2400 (Rights), not this document;
* any mandatory verification workflow — whether and when a Node
  fetches and checks `asset_hash` is entirely a Node's own policy
  (Section 6.1).

---

# 3. Terminology

This document is the owning specification for the following terms.

**Media Object**
: An informal name for a News Object whose `content_type` is
  `onp:companion:media`.

**Verified Asset Reference**
: The pattern of pairing an externally-hosted asset's URL
  (`asset_url`) with a content hash of its bytes (`asset_hash`), so
  that the asset remains cryptographically checkable despite not
  being embedded in the envelope. Future Companions with similar
  externally-hosted binary content needs MAY reuse this pattern,
  citing this document, rather than redefining it independently.

**Asset Hash**
: The `asset_hash` field: a hash of the actual bytes at `asset_url`,
  in the form `<algorithm-id>:<digest>`, using an algorithm from the
  Algorithm Registry (ONP-0005 Appendix A).

---

# 4. Requirements

## 4.1 content_type Declaration

Every Media Object MUST declare `content_type` as exactly
`onp:companion:media`.

## 4.2 Companion-vs-Extension Reapplication

Per ONP-2000 Section 4.2, rule 2:

```
Does "Media" have independent identity and an independent
lifecycle, separable from any Object that references it?

- A photo or video can be published, reused across multiple
  unrelated Articles, replaced with a corrected version, or
  retracted, entirely independently of any Article's own lifecycle.
- A Media Object commonly outlives, or is reused beyond, any single
  Article that references it via media_refs.
- YES -> Companion.
```

## 4.3 Content Schema

1. `media_type` is REQUIRED: one of `"image"`, `"video"`, `"audio"`,
   `"document"`. `media_type` names the coarse modality only; the
   specific format of a `"document"` (PDF, Word, Excel, plain text,
   etc.) is carried by `mime_type` (rule 4), not by further
   `media_type` values. `"document"` is the modality ONP-2600 relies on
   when a Source Object's `document_ref` points at a source file.
2. `asset_url` is REQUIRED: a well-formed URI locating the actual
   media file.
3. `asset_hash` is REQUIRED: the Verified Asset Reference hash
   (Section 4.4).
4. `mime_type` is REQUIRED: a string (e.g. `"image/jpeg"`,
   `"video/mp4"`) identifying how to interpret the fetched bytes.
5. `alt_text`, `caption`, `credit`, `creator_ref`, `width`, `height`,
   `duration_seconds`, `rights_ref`, and `payment_ref` are OPTIONAL,
   per Section 4.5.

## 4.4 Verified Asset Reference

1. `asset_hash` MUST take the form `<algorithm-id>:<digest>`, where
   `<algorithm-id>` is the lowercase wire form of an Algorithm
   Registry entry (ONP-0005 Appendix A) with `purpose = hash`, and
   `<digest>` is the base64url-encoded (unpadded) hash of the raw
   bytes located at `asset_url` — not of any canonicalized or
   re-encoded form, since the asset itself is not JSON.
2. `asset_hash` MUST be treated as a checkable, publisher-asserted
   claim, not a self-proving fact. A Node MUST NOT treat an
   unverified `asset_hash` as proof that the bytes at `asset_url`
   actually match; verification requires fetching the asset and
   computing the hash independently (Section 6.1).
3. Structural Companion validity (ONP-1004 Section 4.3) for a Media
   Object requires only that `asset_hash` is well-formed per rule 1
   — it does NOT require a Node to have fetched and confirmed the
   asset. Actual asset verification is a separate, additional check
   a Node MAY perform (Section 6.1), outside the fixed Validation
   Result contract ONP-1004 Section 5.1 defines.

## 4.5 Optional Fields

1. `alt_text`, if present, MUST be a string describing the asset for
   accessibility purposes. It is RECOMMENDED, though not REQUIRED,
   for `media_type: "image"`, consistent with Principle P2 (Minimal
   Required Surface) — a hard REQUIRED alt_text would raise the
   barrier to quick publishing beyond what this document judges
   proportionate; richer, structured accessibility metadata belongs
   to ONP-3500.
2. `caption`, if present, MUST be a string: a short, Media-specific
   description or credit line, taking precedence over
   `onp:metadata.title`/`summary` for a Media-aware Node, per the
   same pattern ONP-2100 Section 4.5 established for `headline`
   (ONP-1005 Section 4.3).
3. `credit`, if present, MUST be a string identifying the
   photographer, videographer, or source of the asset. It is
   provisional, in exactly the same sense ONP-2100 Section 4.6
   states for `byline`: a Node MUST NOT treat it as cryptographically
   verified attribution.
4. `creator_ref`, if present, MUST be a single Object Reference
   (ONP-2000 Section 4.3): an OID identifying an Identity Object
   (ONP-2300). Where both `creator_ref` and `credit` are present, an
   Identity-aware Node MUST prefer `creator_ref`; a Node without
   Identity Companion support MUST continue to fall back to
   `credit`. **Correction note (v0.2.0):** version 0.1.0 of this
   document defined `credit` without stating this upgrade path,
   unlike ONP-2100's equivalent `byline` field, which did state it
   from the start. This was an oversight, identified only while
   drafting ONP-2300, and is corrected here.
5. `width` and `height`, if present, MUST be positive integers
   (pixels), primarily relevant for `media_type: "image"` or
   `"video"`.
6. `duration_seconds`, if present, MUST be a positive number,
   primarily relevant for `media_type: "video"` or `"audio"`.
7. `rights_ref`, if present, MUST be a single Object Reference
   (ONP-2000 Section 4.3): an OID identifying a Rights Object
   (ONP-2400). A Media Object's usage terms commonly differ from an
   Article's (photo licensing is frequently more restrictive than
   article text licensing); `rights_ref` lets a Media Object declare
   its own terms independently, rather than inheriting whatever any
   referencing Article declares.
8. `payment_ref`, if present, MUST be a single Object Reference
   (ONP-2000 Section 4.3): an OID identifying a Payments Object
   (ONP-2500), for the same reason a Media Object may need its own
   Rights terms independent of any referencing Article — a stock
   photo's licensing fee is commonly separate from an article's own
   price.

---

# 5. Object Model

```json
{
  "content_type": "onp:companion:media",
  "content": {
    "media_type": "image",
    "asset_url": "https://regiopurmerend.nl/media/fusie-bijeenkomst-01.jpg",
    "asset_hash": "sha-256:base64url-digest-of-the-actual-file-bytes",
    "mime_type": "image/jpeg",
    "alt_text": "string, OPTIONAL, RECOMMENDED for images",
    "caption": "string, OPTIONAL",
    "credit": "string, OPTIONAL",
    "creator_ref": "onp:oid:..., OPTIONAL",
    "width": "integer, OPTIONAL",
    "height": "integer, OPTIONAL",
    "duration_seconds": "number, OPTIONAL",
    "rights_ref": "onp:oid:..., OPTIONAL",
    "payment_ref": "onp:oid:..., OPTIONAL"
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `media_type` | REQUIRED | `"image"` \| `"video"` \| `"audio"` \| `"document"` |
| `asset_url` | REQUIRED | External location; not embedded |
| `asset_hash` | REQUIRED | Verified Asset Reference (Section 4.4) |
| `mime_type` | REQUIRED | |
| `alt_text` | OPTIONAL, RECOMMENDED for images | |
| `caption` | OPTIONAL | Precedence over `onp:metadata` (Section 4.5, rule 2) |
| `credit` | OPTIONAL | Provisional fallback; see Section 4.5, rule 3 |
| `creator_ref` | OPTIONAL | Object Reference to an Identity Object (ONP-2300); preferred over `credit` (Section 4.5, rule 4) |
| `width` / `height` | OPTIONAL | |
| `duration_seconds` | OPTIONAL | |
| `rights_ref` | OPTIONAL | Object Reference to a Rights Object (ONP-2400, Section 4.5, rule 7) |
| `payment_ref` | OPTIONAL | Object Reference to a Payments Object (ONP-2500, Section 4.5, rule 8) |

---

# 6. Processing Model

## 6.1 Structural Validity vs. Asset Verification

```
STRUCTURAL (required for companion_valid = true, ONP-1004 S4.3):
  - media_type is a recognized enum value
  - asset_url is a well-formed URI
  - asset_hash matches the <algorithm-id>:<digest> grammar
  - mime_type is present

ASSET VERIFICATION (OPTIONAL, a Node's own additional check,
outside ONP-1004's fixed Validation Result contract):
  1. Fetch the bytes at asset_url.
  2. Hash them using the algorithm named in asset_hash.
  3. Compare to the declared digest.
  4. MATCH -> asset content-verified.
     MISMATCH -> asset content NOT verified; a Node SHOULD treat
     this as a strong signal not to trust the fetched bytes as the
     one the publisher signed for, without this affecting the Media
     Object's own core_authenticated or companion_valid status
     (which concern the envelope, not the externally-hosted bytes).
```

## 6.2 Interoperability

A Node implementing only Core plus this Companion can structurally
validate any Media Object without ever fetching the asset itself —
useful for indexing, cataloguing, or reference-checking use cases
that do not need the actual bytes. A Node that additionally performs
asset verification (Section 6.1) gets a stronger guarantee, at the
cost of a network fetch. Neither is wrong; this document deliberately
does not mandate which a conforming Node must do, consistent with
Principle P7 (Time-to-First-Object) — requiring every Node to fetch
every asset before it can call itself conformant would be a heavy,
disproportionate bar.

---

# 7. Examples

## 7.1 The Media Object ONP-2100's Example Article References

```json
{
  "oid": "onp:oid:regiopurmerend.nl:foto-fusie-bijeenkomst-01",
  "vid": "onp:vid:sha-256:DeF456-example-digest-bytes",
  "publisher": {
    "domain": "regiopurmerend.nl",
    "key_id": "onp:key:2026-07-01"
  },
  "signed_at": "2026-07-28T09:45:00Z",
  "signature": "onp:sig:ed25519:base64url-signature-bytes",
  "content_type": "onp:companion:media",
  "content": {
    "media_type": "image",
    "asset_url": "https://regiopurmerend.nl/media/fusie-bijeenkomst-01.jpg",
    "asset_hash": "sha-256:GhI789-example-asset-digest-bytes",
    "mime_type": "image/jpeg",
    "alt_text": "Inwoners van Purmerend tijdens de informatiebijeenkomst over de fusie",
    "caption": "Informatiebijeenkomst over de voorgestelde fusie, juli 2026",
    "credit": "Foto: Redactie RegioPurmerend",
    "creator_ref": "onp:oid:regiopurmerend.nl:redactie",
    "width": 1600,
    "height": 900,
    "rights_ref": "onp:oid:regiopurmerend.nl:rights-cc-by-standaard",
    "payment_ref": "onp:oid:regiopurmerend.nl:payments-fusie-onderzoek"
  }
}
```

This is the Object `onp:oid:regiopurmerend.nl:foto-fusie-bijeenkomst-01`
that ONP-2100 Section 7.1's Article `media_refs` array pointed to.

## 7.2 Asset Hash Mismatch at Verification Time

```
Node fetches asset_url, computes sha-256 of the bytes received.
Result does not match the declared asset_hash digest.

Per Section 6.1: core_authenticated and companion_valid for the
Media Object itself are UNAFFECTED (the envelope is still exactly
what the publisher signed). What is NOT trusted is that the
currently-hosted bytes at asset_url are the ones the publisher
signed for — the asset may have been altered, moved, or served
incorrectly by the hosting infrastructure after signing. A Node
SHOULD decline to display the fetched bytes as authoritative in
this case.
```

---

# 8. Security Considerations

## 8.1 Asset Hash Detects Post-Signing Substitution, If Checked

The entire value of `asset_hash` depends on a Node choosing to
verify it (Section 6.1) — an unchecked `asset_hash` provides no
protection at all, only the theoretical possibility of protection.
This is a materially different trust posture from Article's embedded
`body`, where tamper-evidence is automatic by construction (ONP-2100
Section 8.2). Implementers building anything that treats media
authenticity as security-relevant (as opposed to purely
presentational) SHOULD perform asset verification rather than
relying on `asset_hash`'s mere presence.

## 8.2 Hosting Infrastructure Remains a Trust Dependency for the
     Bytes Themselves

Even with asset verification, a Node depends on the availability and
non-interference of whatever infrastructure serves `asset_url` — a
compromised or coerced hosting provider could serve different bytes
to different requesters, which per-requester hash verification would
still catch (each requester independently detects the mismatch), but
which this document has no mechanism to prevent in advance. This is
analogous to the residual compromise-window limitation already
accepted for domain-anchored trust (ONP-0004 Section 8.1): detection,
not prevention, is what the Verified Asset Reference pattern
provides.

---

# 9. Privacy Considerations

Photos and video frequently depict identifiable people who are not
the subject of the reporting — bystanders, crowds, minors — which
raises distinct considerations from text: a person's image is
personal data in a way that is often unavoidable in event photography
even when handled responsibly. This document does not mandate any
specific consent or redaction mechanism; that remains publisher
editorial and legal responsibility, consistent with Principle P5
(Jurisdiction Neutrality). Separately, original media files
frequently carry embedded technical metadata (EXIF: GPS coordinates,
device identifiers, capture timestamps) that can reveal more than the
publisher intends — this document RECOMMENDS publishers strip
sensitive EXIF metadata before setting `asset_url`, but does not
mandate or enforce this, as ONP has no mechanism to inspect the
actual asset bytes at specification-writing time.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0003, Design Principles — Principle P1 (Adjacent Publishing,
  Section 2.2), Principle P2 (Minimal Required Surface, Section 4.5),
  Principle P5 (Jurisdiction Neutrality, Section 9), Principle P7
  (Time-to-First-Object, Section 6.2).
* ONP-1001, Identifiers — the content-addressing principle (VID)
  this document's Asset Hash extends to externally-hosted content.
* ONP-1004, Validation — Section 4.3, the structural-vs-unknown
  distinction this document's Section 6.1 extends with a third,
  explicitly-optional tier (asset verification).
* ONP-1005, Core Metadata — Section 4.3, the precedence rule
  Section 4.5, rule 2 of this document applies to `caption`.
* ONP-2000, Companion Framework — Section 4.1 (namespace
  registration), Section 4.2 (mandatory additions), Section 4.3
  (Object Reference mechanism connecting Article's `media_refs` to
  this Companion).
* ONP-2100, Article — Section 4.7, the `media_refs` field this
  Companion is the target of; Section 7.1's example, completed here
  in Section 7.1.
* ONP-2300, Identity — the publisher-asserted trust model
  `creator_ref` (Section 4.5, rule 4) points to.
* ONP-2400, Rights — the Companion `rights_ref` (Section 4.5, rule
  7) points to.
* ONP-2500, Payments — the Companion `payment_ref` (Section 4.5,
  rule 8) points to.

## 10.2 Informative References

* ONP-3500, Accessibility — richer accessibility
  metadata beyond baseline `alt_text`.

---

# Appendix A: Full Schema Reference

```json
{
  "content_type": "onp:companion:media",
  "content": {
    "media_type": "'image' | 'video' | 'audio' | 'document', REQUIRED",
    "asset_url": "string (URI), REQUIRED",
    "asset_hash": "string '<algorithm-id>:<digest>', REQUIRED",
    "mime_type": "string, REQUIRED",
    "alt_text": "string, OPTIONAL",
    "caption": "string, OPTIONAL",
    "credit": "string, OPTIONAL, provisional",
    "creator_ref": "string (OID), OPTIONAL, preferred over credit",
    "width": "integer, OPTIONAL",
    "height": "integer, OPTIONAL",
    "duration_seconds": "number, OPTIONAL",
    "rights_ref": "string (OID), OPTIONAL",
    "payment_ref": "string (OID), OPTIONAL"
  }
}
```

# Appendix B: Verified Asset Reference Checklist

```
[ ] media_type is one of image/video/audio/document
[ ] asset_url is a well-formed URI
[ ] asset_hash matches <algorithm-id>:<digest>, algorithm from the
    Algorithm Registry with purpose=hash
[ ] mime_type present
[ ] (optional, Node's own policy) asset fetched, hashed, and
    compared to asset_hash before treating fetched bytes as
    authoritative
```

---
*End of Document*
