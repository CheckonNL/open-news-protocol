Title: Open News Protocol (ONP): External Standards Interoperability
Document Number: ONP-9005
Status: Working Draft
Version: 0.1.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document is non-normative and addresses a gap this series left
open through ONP-3500: every document reused existing standards where
one fit (JCS, GeoJSON, SPDX, BCP 47) but none positioned ONP against
the existing standards a publisher adopting it would already be
running alongside — schema.org structured data search engines already
consume, RSS feeds publishers already maintain, and C2PA, the
dominant existing content-provenance standard. This document defines
concrete, fully-specified export mappings to schema.org/NewsArticle
and RSS 2.0 — both implemented as working code in
`sdk/reference-impl/`, not merely described — and positions ONP's
relationship to C2PA honestly: conceptually close, but deep
integration (binary manifest embedding) is deferred to a reserved,
not-yet-written Extension (ONP-3600), rather than forced into this
document's scope prematurely.

---

# Status of This Document

This document is part of the ONP Reference series (ONP-9000-9999),
extending beyond the original roadmap's 9000-9004 range — a
Specification beyond the original set, following the same
registration process as any other (ONP-0000 Section 4.1, as already
anticipated for future work beyond the original roadmap). It is
Informational for its schema.org and RSS mapping guidance; it creates
no new wire-level ONP field.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

ONP does not compete with schema.org, RSS, or C2PA — Principle P1
(Adjacent Publishing) already establishes that ONP is deployed
alongside a publisher's existing systems, and all three of these are
exactly the kind of existing system ONP sits next to. What was
missing was a concrete answer to "given an ONP Article Object, how do
I actually produce the schema.org markup my CMS already needs, or the
RSS item my existing feed already serves" — a question every one of
this series' 34 prior documents left to the reader.

---

# 2. Scope

## 2.1 In Scope

* a fully-specified, deterministic export mapping from an ONP Article
  Object to schema.org/NewsArticle JSON-LD;
* a fully-specified, deterministic export mapping from an ONP Article
  Object to an RSS 2.0 `<item>`;
* the conceptual relationship between ONP's Trust Model (ONP-0004,
  ONP-1003) and C2PA's Content Credentials, and the scoping decision
  to defer deep integration to a reserved future Extension.

## 2.2 Out of Scope

This document does NOT define:

* any *import* mapping (schema.org or RSS content becoming an ONP
  Object) — export only; import raises trust questions (who signs
  the resulting Object?) this document does not attempt to resolve;
* C2PA manifest embedding, JUMBF binary structure, or C2PA's own
  signing chain in full — reserved to ONP-3600 (Section 4.4);
* ActivityPub mapping — noted as a related, plausible future document
  with no number yet reserved, since it was not in scope of the
  feedback that motivated this document.

---

# 3. Terminology

This document introduces no new terms requiring registration; the
mappings in Section 4 operate on already-defined ONP fields and
already-defined external vocabularies, neither redefined here.

---

# 4. Guidance

## 4.1 schema.org/NewsArticle Export Mapping

schema.org structured data is what search engines and aggregators
already consume for rich results; an ONP-signing publisher gains
nothing from search visibility if their existing schema.org markup
and their new ONP Object silently diverge. This mapping is
deterministic and RECOMMENDED for any publisher exporting an Article
Object for embedding as JSON-LD:

| ONP Field | schema.org/NewsArticle Property |
|---|---|
| `content.headline` (ONP-2100) | `headline` |
| `content.dek` | `description` |
| `oid` | `identifier` |
| `content.byline` / resolved `contributor_refs` (ONP-2300) | `author` (as `Person` or `Organization`) |
| `signed_at` | `datePublished` |
| latest Version's `signed_at` (ONP-0006) | `dateModified` |
| `publisher.domain` | `publisher` (as `Organization`, with `url`) |
| resolved `media_refs[0]` (ONP-2200), if `role` absent/primary | `image` |
| `content.canonical_url` | `mainEntityOfPage` |
| resolved Rights Object `license_identifier`/`license_url` (ONP-2400) | `license` |
| `onp:metadata.language` (ONP-1005) | `inLanguage` |

A worked implementation of this mapping is at
`sdk/reference-impl/src/export-schemaorg.ts`.

## 4.2 RSS 2.0 Export Mapping

Publishers already maintaining an RSS feed do not need to abandon it
(Principle P1); this mapping lets that feed be generated from the
same ONP Article Objects a publisher already signs, rather than
maintained as a second, independently-drifting source of truth:

| ONP Field | RSS 2.0 `<item>` Element |
|---|---|
| `content.headline` | `<title>` |
| `content.dek` or `onp:metadata.summary` | `<description>` |
| `content.canonical_url` | `<link>` |
| `oid` | `<guid isPermaLink="false">` |
| `signed_at` | `<pubDate>` (RFC 822 format conversion required) |
| `content.byline[0]` or resolved `contributor_refs[0]` | `<author>` (if an email is available) or `<dc:creator>` |
| `content.section` | `<category>` |

A worked implementation of this mapping is at
`sdk/reference-impl/src/export-rss.ts`.

## 4.3 What Export Mappings Do Not Solve

Neither mapping produces a signed artifact — schema.org JSON-LD and
RSS items carry no ONP signature of their own, and a consumer relying
solely on the exported form has no ONP-level trust guarantee at all.
Publishers wanting a consumer to verify authenticity MUST direct them
to the actual signed ONP Object (e.g. via a `<link rel="alternate"
type="application/onp+json">` convention, illustrative only — this
document does not standardize that link relation type, which would
need its own registration process with IANA or an equivalent body,
out of scope here).

## 4.4 C2PA: Conceptual Relationship and Deferred Integration

C2PA (Coalition for Content Provenance and Authenticity) is the
dominant existing standard for cryptographically verifiable content
provenance, closest in spirit to ONP's Trust Model (ONP-0004) and
Digital Signatures (ONP-1003) of any standard reviewed. The
conceptual correspondence is real:

| ONP Concept | C2PA Concept |
|---|---|
| News Object (ONP-1000) | Asset with an attached Manifest |
| Signature (ONP-1003) | Claim Signature |
| Trust Anchor (ONP-0004) | Certificate-based Signer identity |
| Companion/Extension assertion (ONP-0001) | C2PA Assertion |
| Version lineage (ONP-0006) | Manifest history / ingredient chain |

Despite this correspondence, this document does NOT define a full
C2PA integration, for a concrete reason: C2PA manifests are typically
embedded within the media file itself using the JUMBF binary
container format, which is a materially different technical problem
from anything this series has solved — ONP's Verified Asset Reference
pattern (ONP-2200 Section 4.4) hashes an externally-hosted file
without needing to modify its internal binary structure, while C2PA
embedding does modify it. Reconciling these approaches properly
deserves its own dedicated design effort, not a rushed addition here.

**`org.onp.c2pa-bridge` is reserved** as the Extension namespace for
this future work (ONP-3600, not yet published), following the same
registration discipline as any reserved term (ONP-0002 Section 4.2).
Its likely minimal shape — a `manifest_ref` field on a Media Object
pointing to or hashing an external C2PA manifest, reusing the
Verified Asset Reference pattern (ONP-2200 Section 4.4) — is
sketched here only as a direction, not specified normatively.

---

# 5. Object Model

Not applicable in the wire-field sense — Section 4.1 and 4.2's
mapping tables are the closest equivalent, and are already given in
full there.

---

# 6. Processing Model

## 6.1 Export Workflow

```
1. Resolve any Object References needed for the mapping (author,
   media, rights) per ONP-2000 Section 6.2 — lazily, per ONP-9003
   Section 4.4's guidance, not eagerly for every export.
2. Apply the deterministic mapping (Section 4.1 or 4.2).
3. Publish the exported form alongside, not instead of, the signed
   ONP Object itself.
```

## 6.2 Interoperability

This document's entire purpose is interoperability with ecosystems
outside ONP's own — search engines consuming schema.org, feed readers
consuming RSS, and (eventually, via ONP-3600) C2PA-aware tooling. None
of it affects ONP-to-ONP interoperability, which remains governed
entirely by the Core series as before.

---

# 7. Examples

## 7.1 A schema.org Export of the Running Example

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Fusie-onderzoek Purmerend gepubliceerd",
  "description": "Necker van Naem publiceert budgetanalyse voor de voorgestelde fusie.",
  "identifier": "onp:oid:regiopurmerend.nl:fusie-onderzoek-necker-van-naem",
  "datePublished": "2026-07-28T10:00:00Z",
  "publisher": { "@type": "Organization", "url": "https://regiopurmerend.nl" },
  "mainEntityOfPage": "https://regiopurmerend.nl/artikel/fusie-onderzoek",
  "inLanguage": "nl-NL"
}
```

Generated by `sdk/reference-impl/src/export-schemaorg.ts` from the
same signed Article Object used throughout this series' examples.

---

# 8. Security Considerations

Exported forms (schema.org, RSS) carry no signature and MUST NOT be
treated as equivalent trust artifacts to the ONP Object they were
derived from (Section 4.3). A consumer that trusts an exported form
as much as the signed original has misunderstood what this document
provides.

---

# 9. Privacy Considerations

Export mappings surface the same fields already governed by the
originating ONP Object's own Companions (ONP-2100, ONP-2300, ONP-2400
Privacy Considerations); this document introduces no new privacy
mechanism, only a different serialization of already-considered
fields.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0003, Design Principles — Principle P1 (Adjacent Publishing),
  the entire motivation for this document existing.
* ONP-2100, Article; ONP-2200, Media; ONP-2300, Identity; ONP-2400,
  Rights — the source fields for both mappings in Section 4.

## 10.2 Informative References

* schema.org NewsArticle — https://schema.org/NewsArticle
* RSS 2.0 Specification
* C2PA Technical Specification — the standard positioned against in
  Section 4.4.
* ONP-9003, Performance — Section 4.4, the lazy-resolution guidance
  applied in Section 6.1.

---

# Appendix A: Reserved Future Work

```
ONP-3600  C2PA Bridge  — org.onp.c2pa-bridge reserved (Section 4.4),
                          not yet written
(unreserved)  ActivityPub mapping — plausible, no number reserved,
                          out of scope of the feedback motivating
                          this document (Section 2.2)
```

---
*End of Document*
