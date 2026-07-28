Title: Open News Protocol (ONP): Comments
Document Number: ONP-2800
Status: Working Draft
Version: 0.1.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document defines the Comments Companion:
`content_type = "onp:companion:comments"`, closing the Companion
series roadmap (ONP-2000-2800). It is the first Companion whose
subject is an ordinary reader rather than publisher staff or a
credentialed contributor. Readers typically control no domain and
have no Trust Anchor of their own, so this document does not invent
a third trust model — it reuses the publisher-attested pattern
ONP-2300 (Identity) already established: a Comment Object proves the
publisher attests a reader said this, not that the reader
independently signed it. This Companion is deliberately OPTIONAL
infrastructure; a publisher is never required to represent every
comment on its site as a signed News Object.

---

# Status of This Document

This document is part of the ONP Companion series (ONP-2000-2999)
and is its closing document — every Companion named in ONP-0000
Section 4.1's original roadmap (2000-2800) is now published. It is
directly implementable. It is a Working Draft.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

Every Companion published so far represents something the publisher
or its credentialed contributors produced. A reader's comment is
different in kind: it comes from the public, who have no domain to
anchor trust in and no reason to obtain one just to comment on an
article. Rather than solving this as a new problem, this document
recognizes it as the same problem ONP-2300 already solved for
contributors without their own cryptographic identity, and reuses
that solution: the publisher signs, and a Comment Object's
authenticity claim is scoped accordingly (Section 4.8).

---

# 2. Scope

## 2.1 In Scope

* the `onp:companion:comments` content schema;
* the plain-text (not Markdown) body requirement, and why it differs
  from Article;
* threading via `parent_ref`;
* the reused publisher-attestation trust model;
* `moderation_status` as a Companion-level convenience, distinct
  from Core-level retraction;
* the explicit statement that this Companion is optional
  infrastructure, not a requirement to represent every comment.

## 2.2 Out of Scope

This document does NOT define:

* comment ranking, scoring, or recommendation algorithms — entirely
  an application concern;
* spam or abuse detection — a publisher's own moderation tooling
  concern, upstream of whatever a publisher chooses to represent as
  a Comment Object;
* self-sovereign commenter identity — deferred exactly as ONP-2300
  Section 2.2 already deferred it for contributors, for the same
  reason;
* any requirement that a publisher use this Companion at all
  (Section 4.10).

---

# 3. Terminology

This document is the owning specification for the following terms.

**Comment Object**
: An informal name for a News Object whose `content_type` is
  `onp:companion:comments`.

**Publisher-Attested Comment**
: A Comment Object's trust model: the signing publisher attests a
  reader said this, reusing ONP-2300's Publisher-Asserted Identity
  pattern rather than requiring the commenter's own signature
  (Section 4.8).

---

# 4. Requirements

## 4.1 content_type Declaration

Every Comment Object MUST declare `content_type` as exactly
`onp:companion:comments`.

## 4.2 Companion-vs-Extension Classification

```
Does "Comment" have independent identity and an independent
lifecycle, separable from the Article it responds to?

- A comment can be moderated, edited, or retracted on its own
  lifecycle, independently of the Article's own Version history.
- A comment can be independently referenced — most directly, by
  another comment replying to it (Section 4.6), forming a thread
  structure of its own.
- YES -> Companion.
```

## 4.3 Content Schema

1. `body` is REQUIRED: a plain-text string (Section 4.4).
2. `subject_ref` is REQUIRED: an OID identifying the Article (or
   other content Companion Object) this comment responds to (Section
   4.5).
3. `posted_at` is REQUIRED: an ISO 8601 timestamp for when the reader
   posted the comment, which MAY precede `signed_at` if a moderation
   delay exists between posting and publisher attestation.
4. `parent_ref`, `commenter_ref`, `commenter_display_name`, and
   `moderation_status` are OPTIONAL, per Sections 4.6-4.9.

## 4.4 Plain-Text Body

Unlike `body` in ONP-2100 (Article), which permits the Safe Markdown
Subset, a Comment Object's `body` MUST be plain text with no Markdown
or HTML formatting of any kind. This is a deliberate, stricter
default: the abuse surface of formatted text in a high-volume,
publicly-writable context (link spam disguised as formatting, visual
disruption) outweighs the presentational value formatting would add
to a typical reader comment.

## 4.5 Subject Reference

`subject_ref` MUST use OID form (ONP-2000 Section 4.3): a comment is
understood to respond to the Article's lineage generally, not to one
exact, VID-pinned Version. This document does not provide the finer-
grained precision ONP-2700 (Corrections) uses for its own,
structurally different purpose.

## 4.6 Threading via Parent Reference

`parent_ref`, if present, MUST use OID form: an OID identifying
another Comment Object this one replies to, forming a thread. A
top-level comment (one not replying to another comment) MUST omit
`parent_ref`.

## 4.7 Commenter Representation

1. `commenter_ref`, if present, MUST be an Object Reference (OID
   form) to an Identity Object (ONP-2300) — for a reader who is
   authenticated or otherwise linked to a persistent identity the
   publisher maintains.
2. `commenter_display_name`, if present, MUST be a plain string: an
   unverified, publisher-asserted display name or handle. It is
   explicitly provisional from this document's first published
   version — unlike `byline` (ONP-2100) and `credit` (ONP-2200),
   whose provisional nature was inconsistently documented at first
   (ONP-2300 Section 10.3), this document states it plainly from the
   outset: `commenter_display_name` MUST NOT be treated as verified
   identity.
3. Both fields MAY be absent, representing a fully anonymous comment
   with no persistent or display identity at all.

## 4.8 Publisher Attestation (Trust Model)

A Comment Object's authenticity, like every News Object's, rests
entirely on its own `publisher`/`signature` fields and Trust Anchor
resolution (ONP-0004). A Node MUST NOT treat a Comment Object as
proof that the named or displayed commenter independently controls
any cryptographic key — it is proof only that the publisher attests
this comment was posted as represented, reusing exactly the
limitation ONP-2300 Section 4.4 already states for contributor
Identity Objects.

## 4.9 Moderation Status

1. `moderation_status`, if present, MUST be one of `"approved"`,
   `"pending"`, or `"flagged"`.
2. `moderation_status` is a Companion-level convenience field and is
   NOT a substitute for Core-level retraction (ONP-0006 Section 4.4).
   Full removal of a comment MUST use the Core lifecycle mechanism
   (`lifecycle_state: "retracted"`), not merely a `moderation_status`
   change — a `"flagged"` comment remains a normal, fully valid News
   Object until and unless actually retracted.

## 4.10 Optional Infrastructure

A publisher is NOT required to represent any or all reader comments
as Comment Objects. This Companion exists for publishers who choose
to make some or all of their comment activity part of the verifiable
ONP record — for example, featured or notable comments, or an entire
comment section, depending on the publisher's own editorial and
technical choices. An ordinary comment section handled entirely
within a publisher's existing CMS, with no corresponding Comment
Objects at all, remains fully consistent with Principle P1 (Adjacent
Publishing, ONP-0003).

---

# 5. Object Model

```json
{
  "content_type": "onp:companion:comments",
  "content": {
    "body": "string, REQUIRED — plain text, no Markdown/HTML",
    "subject_ref": "onp:oid:..., REQUIRED",
    "posted_at": "string (ISO 8601), REQUIRED",
    "parent_ref": "onp:oid:..., OPTIONAL",
    "commenter_ref": "onp:oid:..., OPTIONAL",
    "commenter_display_name": "string, OPTIONAL, provisional",
    "moderation_status": "'approved' | 'pending' | 'flagged', OPTIONAL"
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `body` | REQUIRED | Plain text only (Section 4.4) |
| `subject_ref` | REQUIRED | OID form (Section 4.5) |
| `posted_at` | REQUIRED | May precede `signed_at` |
| `parent_ref` | OPTIONAL | OID form, threading (Section 4.6) |
| `commenter_ref` | OPTIONAL | Object Reference to Identity Object |
| `commenter_display_name` | OPTIONAL | Provisional, unverified |
| `moderation_status` | OPTIONAL | Convenience only; not a substitute for Core retraction |

---

# 6. Processing Model

## 6.1 Thread Resolution

A Node MAY reconstruct a comment thread by following `parent_ref`
chains, analogous in mechanism (though not in purpose) to how
ONP-0006 Section 6.1 walks `supersedes` chains — here, the chain
represents reply structure, not version succession, and has no
Current/Superseded distinction of its own.

## 6.2 Interoperability

A Node without Comments Companion support simply does not see
comment activity — the Article itself remains fully verifiable and
usable regardless (ONP-1000 Section 4.4, rule 3). This document does
not require any Node to implement it, nor any publisher to use it.

---

# 7. Examples

## 7.1 A Top-Level, Anonymous Comment

```json
{
  "oid": "onp:oid:regiopurmerend.nl:comment-a1b2",
  "vid": "onp:vid:sha-256:VwX234-example-digest-bytes",
  "publisher": { "domain": "regiopurmerend.nl", "key_id": "onp:key:2026-07-01" },
  "signed_at": "2026-07-29T12:05:00Z",
  "signature": "onp:sig:ed25519:base64url-signature-bytes",
  "content_type": "onp:companion:comments",
  "content": {
    "body": "Goed dat dit onderzoek nu openbaar is. Benieuwd naar de raadsvergadering hierover.",
    "subject_ref": "onp:oid:regiopurmerend.nl:fusie-onderzoek-necker-van-naem",
    "posted_at": "2026-07-29T12:00:00Z",
    "commenter_display_name": "Lezer uit Purmerend-Noord",
    "moderation_status": "approved"
  }
}
```

## 7.2 A Threaded Reply

```json
{
  "content_type": "onp:companion:comments",
  "content": {
    "body": "De raadsvergadering staat gepland voor september, staat in het artikel.",
    "subject_ref": "onp:oid:regiopurmerend.nl:fusie-onderzoek-necker-van-naem",
    "parent_ref": "onp:oid:regiopurmerend.nl:comment-a1b2",
    "posted_at": "2026-07-29T12:30:00Z",
    "moderation_status": "approved"
  }
}
```

---

# 8. Security Considerations

## 8.1 Publisher Attestation Is Not Reader Non-Repudiation

Because the publisher signs, a Comment Object cannot itself
distinguish "a reader genuinely posted this" from "the publisher
attributed this to a reader" — a publisher, if compromised or acting
in bad faith, could fabricate favorable comments with no
independently verifiable objection from any actual reader, since no
reader-controlled signature exists in this design. This is not a new
risk category relative to ONP-2300's Identity Objects, but it is
worth restating plainly here given how directly it bears on comment
authenticity specifically: a Comment Object proves attribution
claimed by the publisher, not a reader's own non-repudiable act.

## 8.2 High-Volume Signing Is an Accepted, Not Ignored, Tradeoff

Representing every comment on a popular Article as an individually
signed News Object could mean thousands of Objects per discussion.
This document does not attempt to reduce that overhead through
batching or aggregation; Section 4.10 instead resolves the tension by
making the Companion optional at the publisher's discretion rather
than compromising the per-Object verifiability every other Companion
in this series relies on.

---

# 9. Privacy Considerations

Comment `body` text and `commenter_display_name` reflect a reader's
own expressed opinions, which readers may wish to have genuinely
removed later — a materially common real-world request for comment
systems specifically. Per ONP-0006 Section 8.3, retraction never
guarantees removal from Nodes that already hold a copy, exactly as
already discussed for Identity Objects (ONP-2300 Section 9).
Publishers using this Companion SHOULD make this limitation clear to
commenters before publishing their comments as signed, independently
distributable Objects, since the expectation a reader brings to an
ordinary comment box ("I can delete this later") does not
automatically hold once a comment has been distributed this way.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0003, Design Principles — Principle P1 (Adjacent Publishing,
  Section 4.10), motivating this Companion's optional status.
* ONP-0006, News Object Lifecycle — Section 4.4 (retraction) and
  Section 8.3 (retraction does not erase history), both directly
  relevant to Sections 4.9 and 9 of this document.
* ONP-2000, Companion Framework — Section 4.3 (Object Reference
  mechanism, OID and VID forms), used throughout.
* ONP-2100, Article — the `subject_ref` target; Section 4.4's Safe
  Markdown Subset, contrasted with this document's stricter
  plain-text choice (Section 4.4).
* ONP-2300, Identity — Section 4.4, the Publisher-Asserted Identity
  pattern this document reuses in full (Section 4.8).

## 10.2 Informative References

* None beyond the normative set — this document closes the Companion
  roadmap without introducing new forward references of its own.

---

# Appendix A: Full Schema Reference

```json
{
  "content_type": "onp:companion:comments",
  "content": {
    "body": "string, REQUIRED, plain text only",
    "subject_ref": "string (OID), REQUIRED",
    "posted_at": "string (ISO 8601), REQUIRED",
    "parent_ref": "string (OID), OPTIONAL",
    "commenter_ref": "string (OID), OPTIONAL",
    "commenter_display_name": "string, OPTIONAL, provisional",
    "moderation_status": "enum, OPTIONAL, convenience only"
  }
}
```

# Appendix B: Comment Object Checklist

```
[ ] body is plain text — no Markdown, no HTML
[ ] subject_ref present, OID form
[ ] posted_at present
[ ] parent_ref, if present, points to another Comment Object
[ ] commenter_ref and/or commenter_display_name, if present, are
    both understood as publisher-attested, never independently
    verified reader identity
[ ] moderation_status, if used, is understood as convenience only —
    actual removal requires Core-level retraction (ONP-0006)
[ ] publisher has considered whether representing this comment as
    a signed, independently distributable Object is appropriate,
    given that retraction later will not guarantee removal
    elsewhere (Section 9)
```

---
*End of Document*
