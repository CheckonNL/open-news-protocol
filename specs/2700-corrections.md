Title: Open News Protocol (ONP): Corrections
Document Number: ONP-2700
Status: Working Draft
Version: 0.1.1
Author: Open News Protocol Working Group
Last Modified: 2026-08-01

---

# Abstract

This document defines the Corrections Companion:
`content_type = "onp:companion:corrections"`, the structured,
human-readable explanation layer ONP-0006 Section 4.5 promised but
deliberately did not build: a Corrections Object pins precisely to
one exact prior Version and one exact fixing Version (using the VID
reference form ONP-2000 Section 4.3 was generalized to support while
this document was being designed), states a correction type, and
gives a full explanation. Unlike every other Companion published so
far, the reference direction runs *from* the Corrections Object *to*
the Article it explains, not the other way around — a design already
anticipated in ONP-2100's references before this document existed to
confirm it.

---

# Status of This Document

This document is part of the ONP Companion series (ONP-2000-2999).
It is directly implementable. Concurrently with its publication,
ONP-2100 (Article) is updated with a new OPTIONAL, discovery-only
`corrections_ref` field (Section 10.3). It is a Working Draft.

**Change note (v0.1.1):** corrected Sections 2.2, 4.7, and 10.2, which
had informally pointed to ONP-3200 (Search) as the future home for
correction discovery. ONP-3200 was published addressing indexing
consent and result snippets only; it does not define any enumeration
or ranking mechanism and never resolved this limitation. No wording
elsewhere in this document depended on that assumption. Classified
PATCH under ONP-0007 Section 4.2, rule 3: purely editorial, no
normative requirement changed.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

ONP-0006 Section 4.5 gave every Article a lightweight
`revision_reason` string and explicitly deferred anything richer to
this document. A one-line reason is enough to note that something
changed; it is not enough to actually explain what was wrong, how
serious it was, or how it was fixed — the kind of accountable,
structured correction record wire services and major newsrooms
already maintain by convention, and that ONP-0000 Section 1.1 named
as part of the original problem: "rechten en licenties gaan verloren
bij herpublicatie" applies just as much to correction history, which
today lives, if anywhere, in a separate database disconnected from
the Object it concerns.

---

# 2. Scope

## 2.1 In Scope

* the `onp:companion:corrections` content schema;
* VID-pinned referencing of the exact corrected and correcting
  Versions;
* the reversed reference direction (Corrections Object -> Article)
  and the discovery limitation that follows from it;
* the cross-check a Node MAY perform against an Article's own
  `supersedes` chain.

## 2.2 Out of Scope

This document does NOT define:

* a mechanism for discovering every Corrections Object that concerns
  a given Article — that remains a search/indexing problem with no
  current owning document (ONP-3200 addresses indexing consent and
  search-result snippets only, not enumeration or ranking, and does
  not solve it either), not solved here (Section 4.7);
* any correction taxonomy beyond the small enum in Section 4.5 —
  publishers with more elaborate internal classification MAY extend
  via `onp:extensions`, not by redefining `correction_type`;
* retraction itself, which remains a Core-level lifecycle concept
  (ONP-0006 Section 4.4) — a Corrections Object MAY explain a
  retraction, but does not perform one.

---

# 3. Terminology

This document is the owning specification for the following terms.

**Corrections Object**
: An informal name for a News Object whose `content_type` is
  `onp:companion:corrections`.

**Corrected Version**
: The exact, VID-pinned prior Version a Corrections Object identifies
  as having contained the error.

**Correcting Version**
: The exact, VID-pinned Version that fixed it.

---

# 4. Requirements

## 4.1 content_type Declaration

Every Corrections Object MUST declare `content_type` as exactly
`onp:companion:corrections`.

## 4.2 Companion-vs-Extension Classification

```
Does "Correction" have independent identity and an independent
lifecycle, separable from the Article it explains?

- A correction record can be independently referenced (e.g. by a
  media-accountability or corrections-tracking service cataloguing
  patterns across publishers) without needing the Article's own
  content.
- A correction explanation can itself, in principle, be revised
  later (e.g. a more complete account of why an error occurred),
  independently of the Article's own Version lineage.
- YES -> Companion.
```

## 4.3 Content Schema

1. `subject_oid` is REQUIRED: the OID of the Article (or other
   content Companion Object) this correction concerns.
2. `corrected_vid` is REQUIRED: a VID-form Object Reference (ONP-2000
   Section 4.3) identifying the exact prior Version that was in
   error.
3. `correcting_vid` is REQUIRED: a VID-form Object Reference
   identifying the exact Version that fixed it.
4. `correction_type` is REQUIRED, per Section 4.5.
5. `explanation` is REQUIRED: a string in the Safe Markdown Subset
   (ONP-2100 Section 4.4), reused here for the same XSS-prevention
   rationale.
6. `corrected_at` is REQUIRED: an ISO 8601 timestamp for when the
   correction was published — distinct from, and possibly later
   than, `correcting_vid`'s own `signed_at`.

## 4.4 VID Pinning

`corrected_vid` and `correcting_vid` MUST use VID form, not OID form
(ONP-2000 Section 4.3, as generalized concurrently with this
document's publication). Pinning to the exact, immutable Version is
the entire point: a Corrections Object describes a specific
historical transition, not "whatever this lineage's Current Version
happens to be" — which would drift out of accuracy the moment a
further, unrelated Version is published.

## 4.5 Correction Type

`correction_type` MUST be one of: `"factual"` (an error of fact),
`"clarification"` (accurate but potentially misleading, now
clarified), `"typographical"` (a non-substantive text error),
`"retraction"` (explains a Core-level retraction, ONP-0006 Section
4.4, without itself performing one), or `"update"` (a routine,
non-error update, e.g. adding information as a developing story
progresses).

## 4.6 Reference Direction

1. The authoritative relationship runs from the Corrections Object to
   the Article: `subject_oid`, `corrected_vid`, and `correcting_vid`
   are what establish the connection, not any field on the Article
   itself.
2. An Article's OPTIONAL `corrections_ref` (ONP-2100 Section 4.12,
   added concurrently, Section 10.3) is a discovery convenience only,
   populated at the publisher's option when a new, correcting Version
   happens to be issued anyway. It MUST NOT be treated as
   authoritative or exhaustive — the Corrections Object's own fields
   remain the source of truth regardless of whether any Article links
   back to it.

## 4.7 Discovery Limitation

This document does not provide, and ONP does not otherwise mandate, a
mechanism for discovering every Corrections Object that concerns a
given `subject_oid` without either the publisher's own indexing or an
independent aggregator service. No current ONP document owns this
problem: ONP-3200 (Search) addresses indexing consent and result
snippets only, not enumeration or ranking, despite this document
previously pointing to it as a forward reference. A Node
encountering an Article has no guaranteed way to enumerate its
corrections short of already knowing to look, consistent with the "no
global resolver" posture ONP-1001 Section 4.6 already established for
OID resolution generally.

---

# 5. Object Model

```json
{
  "content_type": "onp:companion:corrections",
  "content": {
    "subject_oid": "onp:oid:..., REQUIRED",
    "corrected_vid": "onp:vid:..., REQUIRED — VID form (Section 4.4)",
    "correcting_vid": "onp:vid:..., REQUIRED — VID form (Section 4.4)",
    "correction_type": "'factual' | 'clarification' | 'typographical' | 'retraction' | 'update', REQUIRED",
    "explanation": "string, REQUIRED — Safe Markdown Subset",
    "corrected_at": "string (ISO 8601), REQUIRED"
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `subject_oid` | REQUIRED | OID form (the lineage) |
| `corrected_vid` | REQUIRED | VID form, exact prior Version |
| `correcting_vid` | REQUIRED | VID form, exact fixing Version |
| `correction_type` | REQUIRED | Section 4.5 enum |
| `explanation` | REQUIRED | Safe Markdown Subset |
| `corrected_at` | REQUIRED | ISO 8601 |

---

# 6. Processing Model

## 6.1 Cross-Check Against the Article's Own Lineage

A Node MAY, and SHOULD where it has access to the subject Article's
full Version history, verify that `correcting_vid`'s own `supersedes`
field (ONP-1000 Section 4.1, rule 5; ONP-0006 Section 4.2) actually
equals `corrected_vid`, as the Corrections Object claims. A mismatch
means the Corrections Object describes a transition that does not
match what the Article's own signed lineage actually records — a
strong signal the Corrections Object is fabricated, mistaken, or
describes a different Article than it claims to (Section 8.1).

## 6.2 Interoperability

A Node without Corrections Companion support simply does not see
correction explanations. The Article itself remains fully verifiable
regardless, and its own lightweight `revision_reason` (ONP-0006)
remains available as a fallback, exactly as ONP-0006 Section 4.5
already anticipated.

---

# 7. Examples

## 7.1 A Factual Correction

```json
{
  "oid": "onp:oid:regiopurmerend.nl:correctie-fusie-onderzoek-01",
  "vid": "onp:vid:sha-256:StU901-example-digest-bytes",
  "publisher": { "domain": "regiopurmerend.nl", "key_id": "onp:key:2026-07-01" },
  "signed_at": "2026-07-29T08:05:00Z",
  "signature": "onp:sig:ed25519:base64url-signature-bytes",
  "content_type": "onp:companion:corrections",
  "content": {
    "subject_oid": "onp:oid:regiopurmerend.nl:fusie-onderzoek-necker-van-naem",
    "corrected_vid": "onp:vid:sha-256:AbC123-example-digest-bytes",
    "correcting_vid": "onp:vid:sha-256:XyZ789-example-digest-bytes",
    "correction_type": "factual",
    "explanation": "In de oorspronkelijke publicatie stond een onjuist bedrag in de tweede alinea. Dit is gecorrigeerd op basis van het officiële rapport van Necker van Naem.",
    "corrected_at": "2026-07-29T08:00:00Z"
  }
}
```

This is the same `corrected_vid`/`correcting_vid` pair already used
illustratively in ONP-1000 Section 7.2's Core-level example — this
document is where that transition finally gets a full, structured
explanation instead of only a one-line `revision_reason`.

## 7.2 Cross-Check Failure

```
Corrections Object claims:
  corrected_vid = V1, correcting_vid = V2
Article's actual lineage shows:
  V2.supersedes = V3 (not V1)

Per Section 6.1: mismatch detected. A Node SHOULD treat this
Corrections Object as unreliable — either mistaken or fabricated —
and SHOULD NOT present it as an authoritative accounting of what
changed, notwithstanding its own valid signature (which only proves
who signed the claim, not that the claim is accurate).
```

---

# 8. Security Considerations

## 8.1 A Valid Signature Does Not Guarantee an Accurate Claim

A Corrections Object's signature proves who asserted the correction,
not that `corrected_vid` and `correcting_vid` actually stand in the
claimed relationship within the subject Article's own lineage. The
cross-check in Section 6.1 is the mechanism for catching this; a Node
that skips it accepts Corrections Objects on faith rather than on
verifiable consistency with the Article's own Core-level record.

## 8.2 Why the Reversed Reference Direction Matters Here

Because the Corrections Object references the Article rather than
the reverse (Section 4.6), a compromised Corrections-issuing key
cannot alter the Article itself — it can only publish a claim about
it, which the cross-check in Section 6.1 can independently evaluate
against the Article's own, separately-signed lineage. This is a
direct benefit of keeping the two Companions' authority strictly
separate.

---

# 9. Privacy Considerations

`explanation` text could, depending on the nature of the correction,
reference specific individuals (e.g. correcting a misattributed
quote), carrying the same limited personal-data considerations
already discussed for `body` (ONP-2100 Section 9). This document
introduces no new privacy mechanism beyond what that document already
establishes.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0000, Introduction — Section 1.1, corrections named as an
  original design goal.
* ONP-0006, News Object Lifecycle — Section 4.5, the `revision_reason`
  field this document's richer explanation layer supplements, not
  replaces.
* ONP-1000, News Object — Section 4.1, rule 5 (`supersedes`), the
  field Section 6.1's cross-check inspects.
* ONP-2000, Companion Framework — Section 4.3, generalized to VID
  form concurrently with this document's design (Section 4.4 of this
  document depends on that generalization).
* ONP-2100, Article — Section 4.4 (Safe Markdown Subset, reused for
  `explanation`); updated concurrently with `corrections_ref`
  (Section 10.3).

## 10.2 Informative References

* ONP-1006, Retrieval — Section 4.4 (feed carriage, a workable
  discovery channel) and Section 8.4 (no enumeration endpoint,
  deliberately) — together the reason Section 4.7's limitation exists
  and one concrete way around part of it.
* ONP-3200, Search — addresses indexing consent and search-result
  snippets only; despite being informally treated elsewhere (including
  an earlier version of this document, and ONP-2900) as a forward
  reference for correction/endorsement discovery, it does not define
  any enumeration or ranking mechanism and does not resolve Section
  4.7's limitation.

## 10.3 Corresponding Update to ONP-2100

As part of this document's publication, ONP-2100 (Article) is updated
to add `corrections_ref` (OPTIONAL, array of OID strings referencing
Corrections Objects), as a discovery convenience only — never
authoritative, per Section 4.6 of this document. Classified MINOR
(additive) under ONP-0007 Section 4.1.

---

# Appendix A: Full Schema Reference

```json
{
  "content_type": "onp:companion:corrections",
  "content": {
    "subject_oid": "string (OID), REQUIRED",
    "corrected_vid": "string (VID), REQUIRED",
    "correcting_vid": "string (VID), REQUIRED",
    "correction_type": "enum, REQUIRED",
    "explanation": "string, REQUIRED, Safe Markdown Subset",
    "corrected_at": "string (ISO 8601), REQUIRED"
  }
}
```

# Appendix B: Corrections Object Checklist

```
[ ] subject_oid present (OID form)
[ ] corrected_vid and correcting_vid both present, both VID form
    (not OID form)
[ ] correction_type is one of the five recognized values
[ ] explanation uses Safe Markdown Subset, no raw HTML
[ ] corrected_at present
[ ] (recommended) cross-checked: does correcting_vid.supersedes
    actually equal corrected_vid in the subject Article's own
    lineage?
```

---
*End of Document*
