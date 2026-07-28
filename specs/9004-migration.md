Title: Open News Protocol (ONP): Migration
Document Number: ONP-9004
Status: Working Draft
Version: 0.1.1
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document defines the required format and process for Migration
Guidance accompanying any MAJOR (breaking) change to a Standards-
Track specification, per ONP-0007 Section 4.3, rule 2. No ONP
specification has yet reached Standards-Track status — every document
in this series remains a Working Draft — so no actual historical
Migration Guidance instance exists yet either. This document sets the
target format now, and, in place of a real example, reflects honestly
on this series' own accumulated pre-1.0 corrections (the `signed_at`
addition, the Tombstone state reconciliation, the OID/VID reference
generalization, and others) as illustrative of the *kind* of reasoning
Migration Guidance will eventually require — while being explicit that
none of them were true MAJOR migrations, and that a real one will need
more than any of these pre-1.0 corrections did. This is the final
document in the original roadmap ONP-0000 laid out.

---

# Status of This Document

This document is part of the ONP Reference series (ONP-9000-9999) and
is its closing document. It is Informational for the reflective
material in Section 4.5, but Section 4's format requirement is a real
obligation on future MAJOR changes, inherited from ONP-0007 Section
4.3, rule 2, not newly invented here. It is a Working Draft.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

ONP-0007 Section 4.3, rule 2 already requires Migration Guidance to
accompany any MAJOR version bump on a Standards-Track specification;
it did not, at the time, specify what that guidance must actually
contain. This document closes that gap. It arrives, appropriately,
last: every document before it assumed migration would eventually
matter and pointed here rather than solving it inline, and now that
every other document in the original roadmap is published, this is
the moment to make that promise concrete.

---

# 2. Scope

## 2.1 In Scope

* the required content and structure of Migration Guidance;
* where Migration Guidance is published and how it relates to the
  Deviation process (ONP-0003 Section 6.3);
* a reflective, explicitly-not-equivalent review of this series' own
  pre-1.0 corrections as a preview of the reasoning a real migration
  will require.

## 2.2 Out of Scope

This document does NOT:

* document any actual current migration — none exists, since no
  specification has reached Standards-Track status;
* retroactively require Migration Guidance for any pre-1.0 correction
  already made in this series — ONP-0007 Section 4.2 explicitly
  exempts pre-1.0 changes from the MAJOR-bump Migration Guidance
  requirement, and this document does not reverse that.

---

# 3. Terminology

**Migration Guidance**
: The structured explanation, required by ONP-0007 Section 4.3, rule
  2, that MUST accompany any MAJOR version bump to a Standards-Track
  specification, per the format Section 4.2 of this document defines.

---

# 4. Requirements

## 4.1 When Migration Guidance Is Required

Migration Guidance MUST accompany any MAJOR version bump to a
specification at or beyond Standards-Track status (ONP-0007 Section
4.3, rule 2). It is NOT required for MINOR or PATCH changes, and it
is NOT required for pre-1.0 changes, even ones that would otherwise
meet the MAJOR criteria (ONP-0007 Section 4.2).

## 4.2 Required Content

Migration Guidance MUST include:

1. **What changed and why** — the specific normative Requirement that
   changed, and the reasoning (a Security Review finding, a
   Principles Review finding, or an identified gap) that motivated
   it.
2. **Before/after behavior** — a concrete description of what a
   conformant implementation did before, and what it MUST do after.
3. **Upgrade path** — the specific steps an existing implementation
   MUST take to become conformant with the new Requirement.
4. **Coexistence or cutover** — whether old and new behavior MAY
   coexist during a transition period (and for how long), or whether
   the change is atomic with no transition period at all.
5. **Downgrade resistance during any transition period** — where
   coexistence (item 4) is permitted, Migration Guidance MUST address
   whether an adversary could exploit the transition window as a
   Downgrade Attack (ONP-0005 Section 4.4), forcing continued
   acceptance of the deprecated behavior past its intended sunset.

## 4.3 Publication

Migration Guidance MUST be published either as a numbered subsection
of the changed specification's own References section — following the
same "Corresponding Update" pattern this series has used throughout
for cross-document changes — or, for changes significant enough to
affect many dependent specifications or implementations, as its own
dedicated document, at the ONP-WG's discretion by rough consensus
(CHARTER.md Section 3).

## 4.4 Relationship to the Deviation Process

A MAJOR change is a different event from a Deviation (ONP-0003
Section 6.3). A Deviation is a recorded exception from a Principle for
one specification, granted without changing the Principle itself.
Migration Guidance is what happens when a Principle-compliant
specification's own Requirements change, and everyone who built
against the old Requirements needs a documented path to the new ones.
The two MAY occur together (a Deviation might itself later be resolved
by a MAJOR change that removes the need for it) but MUST NOT be
conflated in specification text.

## 4.5 Reflection: This Series' Own Pre-1.0 Corrections (Illustrative,
     Not Equivalent, Precedent)

This series made several corrections during its own drafting that,
had they occurred post-1.0, would have needed real Migration Guidance
under Section 4.2. Reviewing them here previews the reasoning a real
migration will require, while being explicit that none of them
actually needed it:

1. **Adding `signed_at` to ONP-1000** (Section 4.1, rule 5, v0.1.0 to
   v0.2.0). What changed: a seventh REQUIRED field, discovered missing
   while drafting ONP-1003. Because this occurred pre-1.0, ONP-0007
   Section 4.2 classified it MINOR with an explicit callout rather
   than requiring Migration Guidance — but had ONP-1000 already been
   Standards-Track, this would have needed a genuine upgrade path
   (every existing Object missing `signed_at` would have needed
   reissuing) and a coexistence question (can a Node built against
   the six-field version still process seven-field Objects?) that the
   actual correction never had to answer, because nothing was yet
   depending on stability.
2. **Reconciling Tombstone state with `lifecycle_state`** (ONP-1000
   Section 4.5). A PATCH-level gloss correction, not a behavior
   change — this one genuinely would NOT have needed Migration
   Guidance even post-1.0, since no implementation's behavior was
   ever actually required to change; only the Terminology Registry's
   description of an existing mechanism was corrected.
3. **Generalizing Object Reference to OID-or-VID form** (ONP-2000
   Section 4.3, v0.1.0 to v0.2.0). What changed: a field that
   previously accepted only OID form could, after this addition, also
   accept VID form. Because this was purely additive (existing OID-
   form references remained valid), it was correctly classified MINOR
   even under strict post-1.0 semantics, not merely under the pre-1.0
   exception — a genuine example of a change that would need no
   Migration Guidance regardless of Status, because Section 4.2's
   "before/after behavior" item has no actual behavior change to
   document for existing users of the OID form.
4. **Correcting ONP-2200's `credit` field to state its upgrade path**
   (Section 4.5, rule 3, v0.1.0 to v0.2.0). A documentation
   inconsistency fix — the field's actual behavior never changed,
   only what the specification text said about it. Like item 2, this
   illustrates a class of correction that Migration Guidance's format
   does not really apply to: fixing what a document says, as opposed
   to changing what a conformant implementation must do.

The pattern across all four: this series' actual pre-1.0 corrections
were, without exception, either purely additive or purely editorial.
None of them required implementations to change existing behavior in
a way that could break something already working — which is precisely
why pre-1.0 status made them low-stakes enough not to need Section
4.2's full apparatus. A genuine future MAJOR change — removing a
required-baseline algorithm (ONP-0007 Section 7.2's own hypothetical
example, still hypothetical as of this document) is the clearer
illustration of what would actually need everything Section 4.2
requires, including a real coexistence window and real downgrade-
resistance analysis, neither of which any correction made during this
series' drafting ever needed.

---

# 5. Object Model

## 5.1 Migration Guidance Entry (Illustrative)

```json
{
  "specification": "ONP-nnnn",
  "old_version": "string",
  "new_version": "string",
  "change_summary": "string",
  "motivating_reason": "string",
  "before_behavior": "string",
  "after_behavior": "string",
  "upgrade_steps": ["string", "..."],
  "coexistence_window": "string or null",
  "downgrade_resistance_notes": "string or null"
}
```

---

# 6. Processing Model

## 6.1 Full Process, From Proposed Change to Published Migration
     Guidance

This is the final capstone this series has been building toward since
ONP-0003 and ONP-0005 first defined their own review processes:

```
1. A MAJOR-level change is proposed against a Standards-Track
   specification.
2. Principles Review (ONP-0003 Section 6.1) evaluates it against
   all seven Principles; a Deviation MAY be recorded if warranted
   (ONP-0003 Section 6.3).
3. Security Review (ONP-0005 Section 6.3) evaluates it against the
   Adversary model (ONP-0005 Section 4.1), including specifically
   whether the proposed transition window (if any) introduces a
   Downgrade Attack surface (Section 4.2, item 5 of this document).
4. Migration Guidance is drafted per Section 4.2 of this document.
5. The ONP-WG reaches rough consensus (CHARTER.md Section 3) that
   preconditions 2-4 are satisfied.
6. The MAJOR version bump is published, with Migration Guidance
   attached per Section 4.3.
```

## 6.2 Interoperability

Migration Guidance's entire purpose is protecting interoperability
across a breaking change: without a documented upgrade path and
coexistence window, independently built implementations would
diverge unpredictably at exactly the moment a specification changes
underneath them — the single interoperability risk every other
document in this series has been structured to avoid at every other
point in a specification's life.

---

# 7. Examples

## 7.1 The Algorithm Deprecation Scenario, Completed

ONP-0007 Section 7.2 posed a hypothetical: ONP-1003 at Standards-Track
version 2.1.0 needs to replace Ed25519 as required-baseline. Applying
this document's Section 4.2 to that same hypothetical:

```
{
  "specification": "ONP-1003",
  "old_version": "2.1.0",
  "new_version": "3.0.0",
  "change_summary": "Required-baseline signature algorithm changed
                      from Ed25519 to [replacement].",
  "motivating_reason": "Security Advisory (ONP-0005 Section 5.2)
                         determined Ed25519 no longer meets the
                         required-baseline bar.",
  "before_behavior": "Nodes MUST support Ed25519 as required-baseline.",
  "after_behavior": "Nodes MUST support [replacement] as required-
                      baseline; Ed25519 moves to deprecated status
                      in the Algorithm Registry.",
  "upgrade_steps": [
    "Implement [replacement] signing and verification.",
    "Continue accepting Ed25519-signed historical Objects per their
     own embedded algorithm identifier (ONP-1001 Section 4.3, rule 4).",
    "Cease signing NEW Objects with Ed25519 by [sunset date]."
  ],
  "coexistence_window": "12 months from publication, per WG rough
                          consensus",
  "downgrade_resistance_notes": "During the coexistence window, a
                          Node MUST NOT accept a NEWLY-signed Object
                          using Ed25519 claiming a signed_at after
                          the sunset date — this would indicate a
                          downgrade attempt, not legitimate historical
                          content, per the same signed_at-based
                          reasoning ONP-0004 Section 4.4 already uses
                          for key revocation."
}
```

---

# 8. Security Considerations

Section 4.2, item 5 — downgrade-resistance during any coexistence
window — is this document's central security contribution, and it is
not automatic: a naive migration that simply "accepts both old and new
for a while" without an explicit rule distinguishing legitimate
historical content from an active downgrade attempt reintroduces
exactly the Downgrade Attack class ONP-0005 Section 4.4 was written to
prevent, at precisely the moment a specification is most exposed —
mid-transition, with two valid code paths instead of one.

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
* ONP-0003, Design Principles — Section 6.3, the Deviation process
  distinguished from Migration Guidance in Section 4.4.
* ONP-0005, Security Model — Section 4.4 (Downgrade Attack, central
  to Section 4.2, item 5 and Section 8) and Section 6.3 (Security
  Review, Section 6.1 of this document).
* ONP-0007, Versioning Policy — Section 4.3, rule 2, the requirement
  this entire document exists to fulfill; Section 7.2, the
  hypothetical worked through fully in Section 7.1 of this document.
* `CHARTER.md` — Section 3, the rough-consensus process referenced in
  Section 4.3 and Section 6.1.

## 10.2 Informative References

* ONP-1000, ONP-2000, ONP-2200 — the pre-1.0 corrections reflected on,
  not treated as precedent, in Section 4.5.

---

# Appendix A: Migration Guidance Checklist

```
[ ] What changed and why is stated, citing the actual motivating
    Security or Principles Review finding
[ ] Before/after behavior is concretely described, not left implicit
[ ] A specific, actionable upgrade path is given
[ ] Coexistence window (if any) is explicitly bounded, not open-ended
[ ] Downgrade resistance during any coexistence window is explicitly
    addressed, not assumed
[ ] Published either as a subsection of the changed specification or
    as its own dedicated document, per WG rough consensus
```

# Appendix B: What the Original Roadmap Does, and Does Not, Cover

This document completes ONP-0000's original roadmap: 34 specifications
across five series (Foundation, Core, Companion, Extension, Reference),
all now published. What remains explicitly open, acknowledged at the
point each gap was found rather than glossed over, is real, and
substantial:

```
[ ] eudi Trust Anchor Type — reserved since ONP-0004, still
    unfulfilled (ONP-2300 Section 2.2)
[ ] Cross-publisher, self-sovereign contributor identity — out of
    scope of ONP-2300, no Specification number reserved
[ ] A true "Analytics Attestation" Companion for periodic metric
    snapshots — explicitly out of scope of ONP-3300 (Section 4.8 of
    that document)
[ ] Extension-vs-Companion Claim Domain conflict detection — ONP-3000's
    mechanism covers Extension-vs-Extension only (acknowledged in
    ONP-3100 Section 4.7)
[x] A minimal, working Reference Implementation with real, computed
    Test Vectors now exists (sdk/reference-impl/), covering ONP-1000
    through ONP-1003 per ONP-9000 Section 4.1's minimum scope — but
    NOT the RECOMMENDED additional scope (ONP-0004 Trust Anchor
    resolution, ONP-1004 multi-level validation, ONP-1005). Partial,
    not complete; its own README states this scope boundary
    explicitly.
[ ] Every specification remains Working Draft — none has undergone
    an actual Security Review, Principles Review, or reached Candidate
    status through the real human governance process CHARTER.md
    describes, as opposed to having that process defined
```

The specification is complete. Its implementation, adoption, and the
governance process actually being exercised by a real Working Group
are not — and this document, closing the roadmap, is the honest place
to say so plainly rather than let the completeness of the document set
itself imply more than it does.

---
*End of Document*
