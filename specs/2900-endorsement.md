Title: Open News Protocol (ONP): Endorsement
Document Number: ONP-2900
Status: Working Draft
Version: 0.1.1
Author: Open News Protocol Working Group
Last Modified: 2026-08-01

---

# Abstract

This document defines the Endorsement Companion:
`content_type = "onp:companion:endorsement"`, letting one publisher
take a structured, signed position on another publisher's News
Object — confirming it, disputing it, or adding context — without
either party needing the other's cooperation. Every Companion
published so far (ONP-2100 through ONP-2800) assumed the signing
publisher and the subject publisher are the same entity; this
document is the first where they are, by design, expected to differ.
It is the protocol-level basis for a pluralistic, permissionless
alternative to a single centralized trust authority (e.g. a sole
commercial rating service, or a closed certificate-issuer
consortium): any publisher that can produce a Publisher Key Record
(ONP-0004) can endorse any News Object, and any publisher can
withdraw its own endorsement unilaterally, with neither action
requiring the other party's permission.

---

# Status of This Document

This document is part of the ONP Companion series (ONP-2000-2999),
published after the original roadmap's eight Companions (ONP-2100
through ONP-2800, closed by ONP-2800 Section "Status of This
Document") — following the same beyond-the-original-roadmap
registration precedent ONP-9005 already established for the
Reference series. Concurrently with its publication, ONP-2100
(Article) is updated with a new OPTIONAL, discovery-only
`endorsement_refs` field (Section 10.3), exactly as ONP-2700
(Corrections) added `corrections_ref`. It is a Working Draft.

**Change note (v0.1.1):** corrected Sections 2.2, 4.8, and 10.2, which
had informally pointed to ONP-3200 (Search) as the future home for
endorsement discovery. ONP-3200 was published addressing indexing
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

A News Object's Core signature (ONP-1003) and Trust Anchor
resolution (ONP-0004) prove that a publisher said something and that
the publisher is who it claims to be. Neither says anything about
whether another, independent party finds the claim credible. Readers,
aggregators, and fact-checkers routinely form and publish exactly
that judgment today — but with no structured, verifiable, portable
way to attach it to the specific signed Version it concerns, it lives
as an unlinked tweet, a footnote on a different site, or a private
rating database. This document gives that judgment the same
signed-Object treatment ONP-2700 already gave correction explanations,
adapted for the one structural difference that matters here: the
party making the claim is not the party who published the thing being
claimed about.

---

# 2. Scope

## 2.1 In Scope

* the `onp:companion:endorsement` content schema;
* VID-pinned referencing of the exact endorsed Version;
* the requirement that Trust Anchor resolution for the Endorsement
  Object and for its target proceed as two independent checks,
  neither presupposing the other;
* the reversed reference direction (Endorsement Object -> target) and
  the discovery limitation that follows from it;
* retraction of an Endorsement Object via the existing Core Tombstone
  lifecycle, requiring no cooperation from the target's publisher.

## 2.2 Out of Scope

This document does NOT define:

* a mechanism for discovering every Endorsement Object that concerns
  a given target — that remains a search/indexing problem with no
  current owning document (ONP-3200 addresses indexing consent and
  search-result snippets only, not enumeration or ranking, and does
  not solve it either); most likely addressed by a future, not-yet-
  numbered document or by independent, competing aggregator
  services, not solved here (Section 4.8);
* any aggregation, scoring, or ranking of multiple endorsements into
  a single reputation figure — deliberately left an application-layer
  concern, for the same reason ONP-2800 Section 2.2 excludes comment
  ranking from that Companion (Section 6.2);
* any judgment of the endorsing publisher's own credibility,
  authority, or subject-matter competence — this document establishes
  only that a named domain made a claim, not that the claim should be
  trusted (Section 8.2);
* a structured taxonomy of what precisely within a target Object is
  being endorsed (a whole article vs. one specific claim within it) —
  the OPTIONAL `scope_note` free-text field (Section 4.3) is the only
  mechanism offered; a structured claim-level model is left to a
  future Extension if it proves needed.

---

# 3. Terminology

This document is the owning specification for the following terms.

**Endorsement Object**
: An informal name for a News Object whose `content_type` is
  `onp:companion:endorsement`.

**Stance**
: The `stance` field: the endorsing publisher's structured position on
  the target Object — `"confirms"`, `"disputes"`, or `"adds-context"`
  (Section 4.5).

**Cross-Publisher Reference**
: An Object Reference (ONP-2000 Section 4.3) whose Reference Target is
  signed by a different `publisher.domain` than the referencing
  Object itself — the defining structural feature of an Endorsement
  Object (Section 4.4), not seen in any Companion published before
  this one.

---

# 4. Requirements

## 4.1 content_type Declaration

Every Endorsement Object MUST declare `content_type` as exactly
`onp:companion:endorsement`.

## 4.2 Companion-vs-Extension Classification

```
Does "Endorsement" have independent identity and an independent
lifecycle, separable from the Object it concerns?

- An endorsement can be independently referenced (e.g. by a
  media-accountability aggregator cataloguing endorsement patterns
  across publishers) without needing the target's own content.
- An endorsement has its own creation and retraction lifecycle
  (Section 4.9) that explicitly does NOT require the target
  publisher's cooperation — the central design requirement this
  Companion exists to satisfy.
- YES -> Companion.
```

## 4.3 Content Schema

1. `target_ref` is REQUIRED: a VID-form Object Reference (ONP-2000
   Section 4.3, generalized to VID form for ONP-2700 and reused here)
   identifying the exact Version of the Object being endorsed.
2. `stance` is REQUIRED, per Section 4.5.
3. `rationale` is REQUIRED: a string in the Safe Markdown Subset
   (ONP-2100 Section 4.4), reused here for the same XSS-prevention
   rationale. An endorsement with no stated reasoning is not
   accountable and is NOT RECOMMENDED practice, but this document
   makes the field REQUIRED rather than merely recommending it, so
   that no conforming Endorsement Object can omit it.
4. `scope_note` is OPTIONAL: free text narrowing what specifically is
   endorsed (e.g. "the budget figures in paragraph 3", as distinct
   from the article's framing as a whole). Its absence means the
   `stance` applies to the target Object as a whole.
5. `endorsed_at` is REQUIRED: an ISO 8601 timestamp for when the
   endorsement was published.

## 4.4 Cross-Publisher Signing

1. An Endorsement Object's `publisher.domain` (ONP-1000 Section 4.1)
   identifies the endorsing publisher and MUST NOT be required, or
   expected, to equal the `publisher.domain` of the Object identified
   by `target_ref`. This is the ordinary, expected case for this
   Companion, unlike every Companion published before it.
2. A Node MUST perform Trust Anchor resolution (ONP-0004) for the
   Endorsement Object against the endorsing publisher's own domain,
   entirely independently of any resolution it performs for the
   target Object. Neither resolution's outcome MUST be made to depend
   on the other (Section 6.1).
3. A publisher requires no relationship, agreement, or registration
   with the target's publisher, nor with any third party, to produce
   a valid Endorsement Object — only its own Publisher Key Record
   (ONP-0004 Section 4.2), which it is presumed to already operate if
   it is an ONP publisher of anything at all.

## 4.5 Stance Values

`stance` MUST be one of: `"confirms"` (the endorsing publisher's own
reporting, knowledge, or review supports the target Object),
`"disputes"` (the endorsing publisher's own reporting, knowledge, or
review contradicts some or all of the target Object), or
`"adds-context"` (neither confirms nor disputes, but supplies material
context a reader would likely want alongside the target Object).

## 4.6 VID Pinning

`target_ref` MUST use VID form, not OID form (ONP-2000 Section 4.3).
An endorsement concerns a specific, immutable Version; if the target
publisher later issues a corrected or otherwise different Version, a
prior endorsement MUST NOT be read as silently carrying over to it —
exactly the rationale ONP-2700 Section 4.4 already established for
`corrected_vid`/`correcting_vid`.

## 4.7 Reference Direction

1. The authoritative relationship runs from the Endorsement Object to
   its target: `target_ref` is what establishes the connection, not
   any field on the target Object itself.
2. A target's own Companion (e.g. ONP-2100 Article) MAY carry an
   OPTIONAL `endorsement_refs` field (added concurrently, Section
   10.3), populated at the target publisher's own option as a
   discovery convenience. It MUST NOT be treated as authoritative or
   exhaustive: an Endorsement Object's validity never depends on
   whether the target links back to it, and a target publisher's
   choice not to list a known endorsement (for example, one it
   dislikes) has no bearing on that endorsement's authenticity.

## 4.8 Discovery Limitation

This document does not provide, and ONP does not otherwise mandate, a
mechanism for discovering every Endorsement Object that concerns a
given target without either the target publisher's own optional
self-reported list (Section 4.7) or an independent aggregator service
(see ONP-1006 Section 4.4's feed-carriage convention for one workable
discovery channel, and ONP-1006 Section 8.4 for why no enumeration
endpoint exists). No current ONP document owns this problem: ONP-3200
(Search) addresses indexing consent and result snippets only, not
enumeration or ranking, despite earlier drafts of this and ONP-2700
informally pointing to it as a forward reference. A Node encountering
a News Object has no guaranteed way to enumerate its
endorsements short of already knowing to look, consistent with the
"no global resolver" posture ONP-1001 Section 4.6 already established
for OID resolution generally. Unlike ONP-2700's Corrections, where the
subject publisher is at least motivated to link its own corrections,
here the party best positioned to enumerate a target's endorsements
(the endorsers) has no structural relationship to the target's own
discovery surface at all — this is a materially harder discovery
problem than Corrections faced, not merely the same one repeated.

## 4.9 Retraction

Withdrawing an endorsement is a Core-level concern, not a new
mechanism this document introduces: an endorsing publisher retracts
its own Endorsement Object via the existing Tombstone lifecycle
(ONP-0006 Section 4.4), exactly as any News Object is retracted. This
requires no action, acknowledgment, or cooperation from the target's
publisher, consistent with Section 4.4's independence requirement.

---

# 5. Object Model

```json
{
  "content_type": "onp:companion:endorsement",
  "content": {
    "target_ref": "onp:vid:..., REQUIRED — VID form (Section 4.6)",
    "stance": "'confirms' | 'disputes' | 'adds-context', REQUIRED",
    "rationale": "string, REQUIRED — Safe Markdown Subset",
    "scope_note": "string, OPTIONAL",
    "endorsed_at": "string (ISO 8601), REQUIRED"
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `target_ref` | REQUIRED | VID form, exact endorsed Version |
| `stance` | REQUIRED | Section 4.5 enum |
| `rationale` | REQUIRED | Safe Markdown Subset |
| `scope_note` | OPTIONAL | Narrows scope; absence = whole Object |
| `endorsed_at` | REQUIRED | ISO 8601 |

---

# 6. Processing Model

## 6.1 Verification Algorithm

```
Given an Endorsement Object E with publisher.domain = D_e, and its
target_ref resolving to Object T with publisher.domain = D_t:

1. Resolve E's Trust Anchor against D_e (ONP-0004 Section 6.1).
   -> FAIL: E is untrusted. Stop; do not evaluate T.
2. Independently resolve T's Trust Anchor against D_t
   (ONP-0004 Section 6.1), exactly as if E did not exist.
   -> FAIL: T is untrusted, but this has no bearing on whether E is
      an authentic claim by D_e — E's own status is unaffected.
3. Present E and T's verification outcomes as two separate results.
   A Node MUST NOT collapse them into one combined verdict; a reader
   needs to be able to tell "D_e authentically made this claim" apart
   from "T is itself authentic", since either can hold without the
   other (Section 6.1.1).
```

### 6.1.1 Worked Outcomes

```
E valid, T valid   -> "D_e authentically confirms/disputes/adds
                       context to an authentic Object by D_t."
E valid, T invalid -> "D_e authentically made a claim about
                       something that does not itself verify as
                       authentic" (e.g. E references a since-tampered
                       or fabricated OID/VID).
E invalid          -> the claim itself cannot be trusted as coming
                      from D_e at all; T's own status is irrelevant.
```

## 6.2 Aggregation Is Out of Scope

A Node or application MAY choose to display multiple Endorsement
Objects concerning the same target together, but this document defines
no rule for combining multiple `stance` values into a single score,
label, or ranking. Doing so would reintroduce, at the application
layer, exactly the single-arbiter-of-truth problem this Companion's
cross-publisher, no-central-registry design (Section 4.4) exists to
avoid. This mirrors ONP-2800 Section 2.2's exclusion of comment
ranking algorithms from that Companion's scope.

## 6.3 Interoperability

A Node without Endorsement Companion support simply does not see
endorsements; the target Object remains fully verifiable regardless,
exactly as ONP-2700 Section 6.2 already established for Corrections.
A Node implementing this Companion but encountering an unreachable
`target_ref` MUST treat that as an unresolved Reference (ONP-2000
Section 6.2), not as a failure of the Endorsement Object's own
signature.

---

# 7. Examples

## 7.1 A Confirming Endorsement, Cross-Publisher

```json
{
  "oid": "onp:oid:nos.nl:endorsement-fusie-onderzoek-purmerend",
  "vid": "onp:vid:sha-256:example-digest-bytes-01",
  "publisher": { "domain": "nos.nl", "key_id": "onp:key:2026" },
  "signed_at": "2026-08-01T09:00:00Z",
  "signature": "onp:sig:ed25519:base64url-signature-bytes",
  "content_type": "onp:companion:endorsement",
  "content": {
    "target_ref": "onp:vid:sha-256:u3RP2GYOk8cS5Pc8TmCTJK5Clexl-ig9lfaVSt4Lr8s",
    "stance": "confirms",
    "rationale": "Eigen onderzoek bevestigt de cijfers uit het Necker van Naem-rapport.",
    "endorsed_at": "2026-08-01T09:00:00Z"
  }
}
```

`target_ref` is the same VID already used illustratively in ONP-1000
Section 7.2 and referenced by ONP-2700 Section 7.1, but signed here by
`nos.nl` — a domain wholly unrelated to `regiopurmerend.nl`, the
target's own publisher.

## 7.2 Verification of the Above

```
publisher.domain (E) = nos.nl -> resolve nos.nl's own Publisher Key
  Record -> SUCCEEDS (independent of regiopurmerend.nl entirely).
target_ref resolves to the Article at regiopurmerend.nl -> resolve
  regiopurmerend.nl's own Publisher Key Record -> SUCCEEDS.
Result (Section 6.1.1): "nos.nl authentically confirms an authentic
  Object by regiopurmerend.nl."
```

## 7.3 Retraction

```
nos.nl later determines its confirmation was premature and retracts
it: the Endorsement Object at
onp:oid:nos.nl:endorsement-fusie-onderzoek-purmerend is Tombstoned
per ONP-0006 Section 4.4, on nos.nl's own infrastructure. No message,
request, or acknowledgment to regiopurmerend.nl is required or
implied (Section 4.9).
```

---

# 8. Security Considerations

## 8.1 Domain Impersonation Risk Is Symmetric

Because a reader must now check the endorsing domain's identity in
addition to the target's, the same domain-compromise and
domain-confusion risk ONP-0004 Section 8.1 already documents for
publishers applies equally, and readers are structurally less
practiced at scrutinizing an endorser's domain (e.g. distinguishing
`nos.nl` from a lookalike) than a familiar masthead's own domain.
This document introduces no new cryptographic weakness, but
implementers displaying Endorsement Objects SHOULD surface the
endorsing domain as prominently as the target's own, not as a
secondary detail.

## 8.2 A Valid Signature Proves Authorship, Not Institutional Credibility

An Endorsement Object passing verification proves only that the named
domain authentically made the stated claim — never that the domain
represents a competent, good-faith, or authoritative institution. This
document, like ONP-0004 Section 4.1 for identity, deliberately does
not conflate the two: judging an endorser's own credibility is left
entirely to the reader or application, consistent with this
Companion's explicit refusal to aggregate or rank endorsements
(Section 6.2).

## 8.3 A Compromised Endorsing Key Cannot Alter the Target

Because the reference direction runs from Endorsement Object to target
(Section 4.7), a compromised key belonging to an endorsing publisher
can publish false claims about a target but cannot alter the target
Object itself — exactly the same structural protection ONP-2700
Section 8.2 already established for Corrections, here extended across
publisher boundaries rather than within one.

---

# 9. Privacy Considerations

`rationale` and `scope_note` text could, depending on content,
reference specific individuals (e.g. naming a source whose claim is
being disputed), carrying the same limited personal-data
considerations already discussed for `body` (ONP-2100 Section 9) and
`explanation` (ONP-2700 Section 9). This document introduces no new
privacy mechanism beyond what those documents already establish.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0004, Trust Model — Section 6.1 (Resolution Algorithm), invoked
  twice, independently, per Section 6.1 of this document.
* ONP-0006, News Object Lifecycle — Section 4.4 (Tombstone), the
  mechanism Section 4.9 reuses for retraction.
* ONP-1000, News Object — Section 4.1 (`publisher.domain`), the field
  Section 4.4 of this document constrains not to be assumed equal
  across an Endorsement Object and its target.
* ONP-2000, Companion Framework — Section 4.3, VID-form Object
  References, reused here exactly as ONP-2700 Section 4.4 reused them.
* ONP-2100, Article — Section 4.4 (Safe Markdown Subset, reused for
  `rationale`); updated concurrently with `endorsement_refs`
  (Section 10.3).
* ONP-2700, Corrections — the structurally closest prior Companion:
  reversed reference direction, VID pinning, and discovery-limitation
  framing are all patterns this document deliberately reuses rather
  than reinventing.

## 10.2 Informative References

* ONP-2800, Comments — Section 2.2, the comment-ranking exclusion this
  document's Section 6.2 mirrors for endorsement aggregation.
* ONP-1006, Retrieval — Section 4.4 (feed carriage, a workable
  discovery channel) and Section 8.4 (no enumeration endpoint,
  deliberately) — together the reason Section 4.8's limitation exists
  and one concrete way around part of it.
* ONP-3200, Search — addresses indexing consent and search-result
  snippets only; despite being informally treated elsewhere (including
  an earlier version of this document, and ONP-2700) as a forward
  reference for endorsement/correction discovery, it does not define
  any enumeration or ranking mechanism and does not resolve Section
  4.8's limitation.
* ONP-9005, External Standards Interoperability — Appendix A, the
  "beyond the original roadmap" registration precedent this document's
  own numbering (ONP-2900) follows.

## 10.3 Corresponding Update to ONP-2100

As part of this document's publication, ONP-2100 (Article) is updated
to add `endorsement_refs` (OPTIONAL, array of OID or VID strings
referencing Endorsement Objects), as a discovery convenience only —
never authoritative, per Section 4.7 of this document. Classified
MINOR (additive) under ONP-0007 Section 4.1.

---

# Appendix A: Full Schema Reference

```json
{
  "content_type": "onp:companion:endorsement",
  "content": {
    "target_ref": "string (VID), REQUIRED",
    "stance": "enum, REQUIRED",
    "rationale": "string, REQUIRED, Safe Markdown Subset",
    "scope_note": "string, OPTIONAL",
    "endorsed_at": "string (ISO 8601), REQUIRED"
  }
}
```

# Appendix B: Endorsement Object Checklist

```
[ ] target_ref present, VID form (not OID form)
[ ] stance is one of the three recognized values
[ ] rationale present, uses Safe Markdown Subset, no raw HTML
[ ] endorsed_at present
[ ] publisher.domain of this Object is understood to potentially
    differ from the target's publisher.domain — no equality check
    performed or expected (Section 4.4)
[ ] Trust Anchor resolution performed independently for this Object
    and for its target (Section 6.1) — neither outcome blocks
    evaluation of the other
```

---
*End of Document*
