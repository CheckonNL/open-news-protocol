Title: Open News Protocol (ONP): Best Practices
Document Number: ONP-9001
Status: Working Draft
Version: 0.1.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document is purely informational: it creates no new normative
requirement anywhere in the ONP series. It synthesizes practical
guidance that, until now, existed only scattered across thirty
normative documents — a getting-started path for a publisher's first
verifiable Object, key management practices, a recommended Companion
adoption order for a newsroom implementing ONP incrementally, and a
catalog of common pitfalls this series' own design decisions were
built to prevent. Where anything here appears to conflict with a
normative specification, the normative specification always governs;
this document only restates and connects what those documents already
require or recommend.

---

# Status of This Document

This document is part of the ONP Reference series (ONP-9000-9999). It
is Informational: it introduces no MUST-level requirement of its own.
Every SHOULD or RECOMMENDED statement here either restates guidance a
normative document already gives, or offers a synthesized
recommendation that remains advisory even where stated firmly. It is
a Working Draft.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000. This document uses SHOULD/RECOMMENDED throughout and
deliberately avoids MUST/REQUIRED except when directly quoting a
normative requirement stated elsewhere — this document has no
authority to create new obligations.

---

# 1. Introduction

Thirty specifications is a lot to hold in mind at once when all a
publisher actually wants to know is "what do I do first." This
document exists for that reader: not to add anything to what the
series already requires, but to walk it in the order someone
implementing ONP for the first time would actually need, and to
collect, in one place, the mistakes this series' own normative text
was specifically designed to prevent.

---

# 2. Scope

## 2.1 In Scope

* a recommended getting-started implementation path;
* key management practices beyond what ONP-0004 requires as a bare
  minimum;
* a recommended Companion adoption order for incremental adoption;
* a catalog of common pitfalls, each tied to the normative rule it
  would violate.

## 2.2 Out of Scope

This document does NOT:

* create any new MUST-level requirement;
* recommend specific vendors, cloud providers, or tooling — Principle
  P1 (Adjacent Publishing) and P3 (Ordinary Technology) already
  establish that ONP works with whatever infrastructure a publisher
  already has;
* substitute for the actual Security Review (ONP-0005 Section 6.3) or
  Principles Review (ONP-0003 Section 6.1) processes required before
  any new specification advances in Status.

---

# 3. Terminology

This document introduces no new terms.

---

# 4. Guidance

## 4.1 Getting Started Path

A publisher implementing ONP for the first time SHOULD follow this
order, rather than attempting the full series at once:

```
1. Generate an Ed25519 keypair (ONP-1003 Section 4.3).
2. Publish a Publisher Key Record at
   https://{your-domain}/.well-known/onp/publisher.json
   (ONP-0004 Section 4.2).
3. Construct a Minimal Viable Object (ONP-1000 Section 4.2) — just
   the seven REQUIRED fields, content_type: "onp:companion:article".
4. Compute vid (ONP-1001), sign it (ONP-1003), and run it through
   the full Core validation pipeline (ONP-1003 Section 6.1) yourself
   before considering it done.
5. Only after step 4 succeeds reliably, consider adding
   onp:metadata (ONP-1005) for basic discoverability, then whichever
   Companions your newsroom's workflow actually needs (Section 4.3).
```

Attempting Rights, Payments, Identity, and three Extensions before a
single Minimal Viable Object round-trips correctly is a common way to
make debugging unnecessarily difficult — isolate Core first.

## 4.2 Key Management

Beyond what ONP-0004 requires as a bare minimum:

1. Rotate signing keys on a defined schedule (for example, annually)
   SHOULD occur even absent any suspected compromise — waiting for a
   reason to rotate is a worse habit than rotating routinely.
2. `previous_keys` (ONP-0004 Section 5.1) SHOULD be kept populated
   with historical keys rather than pruned once rotated out — pruning
   breaks verification of historical Objects signed under those keys
   (ONP-0004 Section 4.4).
3. The OPTIONAL rotation-continuity signature (ONP-0004 Section 4.4,
   rule 5) SHOULD be used even though not REQUIRED — it costs little
   and provides real continuity evidence beyond domain control alone.
4. Private keys SHOULD be backed up offline, separately from the
   systems that use them for day-to-day signing.
5. A signing key SHOULD NOT be reused across unrelated services —
   the same discipline any organization already applies to TLS
   certificates and API credentials applies here.

## 4.3 Recommended Companion Adoption Order

For a newsroom adopting Companions incrementally rather than all at
once, the following order is RECOMMENDED, based on what this series'
own design assumed would be needed first:

```
1. Article (ONP-2100)      — minimum viable, always first
2. Media (ONP-2200)        — if photo/video is part of your workflow
3. Rights (ONP-2400)       — adopt EARLY; retrofitting rights
                              declarations onto years of back-catalog
                              is harder than declaring them from day one
4. Identity (ONP-2300)     — once byline/credit provisional fields
                              start feeling insufficient
5. Payments (ONP-2500)     — only once an actual monetization model
                              is chosen; do not adopt speculatively
6. Sources (ONP-2600)      — as editorial workflow and source-
                              protection process matures
7. Corrections (ONP-2700)  — once your correction/retraction
                              editorial process is formalized enough
                              to produce structured explanations
8. Comments (ONP-2800)     — entirely optional (ONP-2800 Section
                              4.10); adopt only if you want reader
                              activity in the verifiable record at all
```

Rights is called out specifically as worth adopting earlier than its
number might suggest, precisely because declaring rights only becomes
harder as a back-catalog grows.

## 4.4 Common Pitfalls

Each entry below names a mistake this series' own normative text
already prohibits or guards against, collected here because the
prohibition is easy to miss buried in its own document.

1. **Treating an absent permission flag as `false`.** Rights
   (ONP-2400 Section 4.5) and AI Metadata (ONP-3100 Sections 4.5-4.6)
   both require absence to mean "unstated," never "denied." This is
   the single most common misreading risk in the entire series.
2. **Using a JSON number for money.** ONP-1002 Section 4.4, rule 2
   and ONP-2500 Section 4.4, rule 3 both require monetary amounts as
   strings. A JSON-number price is a floating-point bug waiting to
   happen.
3. **Embedding raw HTML in an Article body.** ONP-2100 Section 4.4
   forbids it explicitly, precisely to avoid the injection risk that
   motivated the Safe Markdown Subset in the first place.
4. **Treating `byline`, `credit`, or `commenter_display_name` as
   verified identity.** All three are explicitly provisional
   (ONP-2100 Section 4.6; ONP-2200 Section 4.5; ONP-2800 Section 4.7)
   — none of them are backed by anything beyond the publisher's own
   signature.
5. **Creating a structured Source Object reflexively, even for a
   highly sensitive protected source.** ONP-2600 Section 4.6
   explicitly recommends prose-only attribution instead for the
   highest-stakes cases, given retraction's limits (ONP-0006 Section
   8.3). Reflexively structuring everything is not always the safer
   choice.
6. **Assuming `indexable` needs an explicit `true`.** This is the one
   field in the entire series with a permissive default (ONP-3200
   Section 4.4) — the opposite of the no-default pattern everywhere
   else. Getting this backwards in either direction (assuming it
   needs explicit `true`, or assuming other fields share its
   permissive default) is an easy, understandable mistake.
7. **Building a custom Extension without registering its namespace
   and Claim Domain.** ONP-3000 Section 4.1 and Section 4.3 both
   require registration in ONP-0002 — even for an Extension a
   publisher intends to use only internally, if it is meant to
   interoperate with any other Node at all.
8. **Forcing a genuinely Companion-shaped concept into Extension
   form.** ONP-3300 Section 4.2 worked through exactly this tension
   for analytics snapshots and declined to force the fit. Apply the
   decision test (ONP-0001 Section 4.4) honestly, even when a
   roadmap slot seems to suggest an answer.

---

# 5. Object Model

Not applicable — this document defines no wire-level fields.

---

# 6. Processing Model

## 6.1 Recommended Testing Workflow

Before considering an implementation complete, a publisher or
implementer SHOULD validate their output against the Test Vectors
ONP-9000 Section 4.3 requires any Reference Implementation to
publish, rather than relying solely on internal self-consistency —
an implementation that only checks its own output against itself
cannot detect a systematic misunderstanding shared between its
construction and its own validation logic.

## 6.2 Interoperability

This document's own contribution to interoperability is indirect:
by collecting common mistakes in one place, it reduces the odds that
independent implementations diverge for avoidable reasons rather than
genuine specification ambiguity — the latter being exactly what
ONP-9000's Test Vectors and Reference Implementation requirement
exist to surface and fix.

---

# 7. Examples

## 7.1 The Complete Picture, Assembled

This series has carried one running example — RegioPurmerend's
fusie-onderzoek article — since ONP-0000's problem statement. By
ONP-3500, that single story had accumulated: a signed Article Object
(ONP-2100 Section 7.1) with an embedded body, a referenced Media
Object with Verified Asset Reference integrity (ONP-2200 Section
7.1), a publisher-attested Identity Object for its byline (ONP-2300
Section 7.1), a CC-BY-4.0 Rights Object (ONP-2400 Section 7.1), a
micropayment Payments Object (ONP-2500 Section 7.1), a named Source
reference (ONP-2600 Section 7.1), a geolocation Extension naming all
four municipalities (ONP-3400 Section 7.1), and the infrastructure to
support a later Corrections Object should one ever be needed. No
single document required all of this; Section 4.3's adoption order
is what makes reaching this point manageable rather than
overwhelming.

---

# 8. Security Considerations

Following this document's guidance reduces risk but does not itself
constitute compliance with anything — the actual Security Review
process (ONP-0005 Section 6.3) remains the authoritative gate for any
specification, and following key-management best practices (Section
4.2) does not substitute for an implementer's own security review of
their actual deployment.

---

# 9. Privacy Considerations

This document introduces no new privacy mechanism; where it discusses
privacy-relevant guidance (Section 4.4, item 5), it points to the
normative document that actually owns the consideration rather than
restating it independently.

---

# 10. References

## 10.1 Normative References

This document synthesizes guidance from across the series; the
specific citations are given inline throughout Section 4 rather than
repeated here. See ONP-0000 through ONP-3500 generally.

## 10.2 Informative References

* ONP-9000, Reference Implementation — the Test Vector requirement
  referenced in Section 6.1.

---

# Appendix A: Getting-Started Checklist

```
[ ] Ed25519 keypair generated
[ ] Publisher Key Record published at .well-known/onp/publisher.json
[ ] Minimal Viable Object constructed (seven REQUIRED fields only)
[ ] vid computed, signature applied
[ ] Full Core validation pipeline run against your own output
[ ] onp:metadata added for basic discoverability
[ ] Rights Object added (recommended early, Section 4.3)
[ ] Remaining Companions added per your newsroom's actual workflow,
    not all at once
```

# Appendix B: Common Pitfalls Quick Reference

```
[ ] No permission flag treated as false-by-default
[ ] No monetary amount as a JSON number
[ ] No raw HTML in Article body
[ ] No provisional field (byline/credit/commenter_display_name)
    treated as verified identity
[ ] Protected-source Object creation reconsidered per ONP-2600 4.6
[ ] indexable's permissive default not assumed elsewhere
[ ] Custom Extension namespaces and Claim Domains registered
[ ] Companion-vs-Extension test applied honestly, not assumed from
    a roadmap slot
```

---
*End of Document*
