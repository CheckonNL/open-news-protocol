Title: Open News Protocol (ONP): Versioning Policy
Document Number: ONP-0007
Status: Working Draft
Version: 0.1.1
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document is the authoritative policy for how an ONP
Specification's own `Version` field changes over time, and for the
process by which a Specification moves between Status levels
(Working Draft, Candidate, Standards Track, Obsolete). ONP-0000
Section 3.5 introduced semantic versioning informally; this document
replaces that informal statement with a precise policy, including
the pre-1.0 semantics every currently published ONP specification is
operating under, and a worked classification rule for the specific
case this series has already encountered four times: is adding a new
entry to an append-only registry (ONP-0002 Appendix A) a MAJOR,
MINOR, or PATCH change? This document answers that question
precisely enough that it never needs to be re-derived per instance.

---

# Status of This Document

This document is part of the ONP Foundation series (ONP-0000-0999)
and is its closing document. It is normative and supersedes ONP-0000
Section 3.5 as the authoritative source of versioning rules; ONP-0000
retains only a pointer to this document (see Section 10 of this
document for the corresponding update made to ONP-0000). It is a
Working Draft — notably, it is itself subject to the pre-1.0
semantics it defines in Section 4.2.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

**Terminology note:** "Version" in this document refers to a
Specification's own semantic version number. It is unrelated to a
News Object Version (ONP-0006), which uses the same English word for
an unrelated concept. Neither document redefines the other's term.

---

# 1. Introduction

Six Foundation specifications have already been published and
revised under an informally stated versioning rule. That informal
rule was sufficient to get the series started but left real
questions unanswered in practice: when ONP-0002's registry gained
new entries four separate times in one working session, each bump
was judged MINOR by convention rather than by a citable rule. This
document exists so that judgment call never has to be remade from
scratch, and so that every future Companion, Extension, and Core
specification inherits one precise, worked-out policy rather than
each author reasoning about semantic versioning independently.

---

# 2. Scope

## 2.1 In Scope

* precise MAJOR/MINOR/PATCH classification criteria;
* pre-1.0 (`0.y.z`) semantics and how they differ from post-1.0
  semantics;
* the worked classification rule for registry and appendix changes;
* the Status transition process (what must pass before a
  specification advances from Working Draft to Candidate to
  Standards Track, and how Obsolete is handled);
* the Version History Entry structure specifications SHOULD
  maintain going forward.

## 2.2 Out of Scope

This document does NOT define:

* the human governance process behind a Status transition decision
  (voting, WG membership, quorum) — that belongs to a future
  `CHARTER.md`, not yet published, and is explicitly out of scope
  here: this document defines what must be TRUE for a transition
  (Section 4.5), not WHO decides it is true;
* retroactive changelog backfilling for ONP-0000 through ONP-0006
  (Section 5.2 addresses this as a SHOULD, not a mandate);
* Migration guidance for a specific breaking change (see ONP-9004,
  Reference series).

---

# 3. Terminology

This document is the owning specification for the following terms.

**Pre-1.0 Phase**
: The period during which a Specification's Version remains below
  `1.0.0`. Governed by distinct rules from post-1.0 (Section 4.2).

**Change Classification**
: The act of determining whether a proposed edit to a Specification
  is MAJOR, MINOR, or PATCH per Section 4.

**Status Transition**
: The act of moving a Specification from one Status level (ONP-0000
  Section 4.4) to the next, subject to the preconditions in Section
  4.5.

**Version History Entry**
: A record of a single Version change: its number, date, Change
  Classification, and a one-line summary (Section 5.1).

---

# 4. Requirements

## 4.1 Version Number Semantics

A Specification's `Version` field MUST follow `MAJOR.MINOR.PATCH`:

* **MAJOR** — a change that breaks a normative Requirement: removes
  or weakens a MUST, changes the mandatory section template or
  filename convention, reassigns an existing Terminology Registry
  entry's owning document or meaning, or otherwise invalidates a
  previously-conformant implementation or specification.
* **MINOR** — a change that is additive and backward-compatible: a
  new OPTIONAL field, a new SHOULD/MAY guidance, a new Terminology
  Registry entry, a new worked example, or new content that does not
  invalidate anything previously conformant.
* **PATCH** — a purely editorial change with no normative effect:
  wording clarification, typo correction, formatting, or a
  Terminology Registry gloss correction that does not change the
  entry's owning document or meaning.

## 4.2 Pre-1.0 Semantics

1. Every Specification MUST begin at `0.1.0` and MUST remain in the
   `0.y.z` range for as long as its Status is `Working Draft`.
2. While in the `0.y.z` range, a Specification MUST NOT use a MAJOR
   bump under any circumstances, including for changes that would
   otherwise meet the MAJOR criteria in Section 4.1. Instead, such a
   change MUST bump MINOR (`0.y.z` -> `0.(y+1).0`). This reflects
   ordinary semantic versioning convention for major version zero:
   the public interface is understood to be still settling, and
   MINOR is the ceiling for meaningful change during this phase.
3. A PATCH bump remains available and MUST be used, even pre-1.0,
   for purely editorial changes, so that editorial history remains
   distinguishable from substantive revision history.
4. This is not a loophole around Section 4.1's MAJOR criteria — a
   pre-1.0 MINOR bump for what would, post-1.0, be a MAJOR change
   MUST still be called out explicitly in that Specification's own
   prose (as ONP-0000 Section 4.1 and Section 7.3 already do for
   their own roadmap and template changes), so that readers are not
   misled by the version number alone into assuming the change was
   small.

## 4.3 Post-1.0 Semantics

1. A Specification MUST NOT declare `1.0.0` while its Status remains
   `Working Draft`. Reaching `1.0.0` requires, at minimum, Candidate
   Status (Section 4.5).
2. Once at or beyond `1.0.0`, standard semantic versioning applies
   without the pre-1.0 exception in Section 4.2: a MAJOR bump is
   REQUIRED for any change meeting the MAJOR criteria in Section 4.1,
   and MUST be accompanied by Migration guidance (forward reference,
   ONP-9004) for any dependent specification or implementation.

## 4.4 Registry and Appendix Change Classification (Worked Rule)

This rule resolves the specific, previously ad hoc question this
series encountered with ONP-0002's Terminology Registry, and applies
equally to any other append-only registry or catalog an ONP
Specification maintains (e.g. ONP-0005's Algorithm Registry,
Appendix A):

1. Adding a new entry to an append-only registry or appendix, where
   the entry did not previously exist and its addition does not
   alter any existing entry, MUST be classified MINOR.
2. Correcting an existing entry's gloss, wording, or formatting
   without changing its owning document or its substantive meaning
   MUST be classified PATCH.
3. Changing an existing entry's owning document, reassigning its
   status (e.g. `active` to `withdrawn`) in a way that invalidates
   prior reliance on it, or otherwise altering its substantive
   meaning MUST be classified MAJOR post-1.0, or MINOR-with-explicit-
   callout pre-1.0 per Section 4.2 rule 4.
4. Every MINOR bump made under rule 1 of this section MUST still
   append a Version History Entry (Section 5.1) naming which new
   entries were added, so that the registry's own change history
   remains auditable independent of the owning document's broader
   prose changes.

## 4.5 Status Transition Preconditions

A Specification MUST NOT be marked as having reached a given Status
level until the following preconditions for that level are met.
This document defines the preconditions; the human decision process
that confirms they are met is out of scope (Section 2.2).

**Working Draft -> Candidate** requires ALL of:
* a Principles Review per ONP-0003 Section 6.1, with no unresolved
  finding (or a recorded Deviation);
* a Security Review per ONP-0005 Section 6.3, with no unresolved
  finding (or a recorded Deviation);
* full Terminology Registration per ONP-0002 Section 6.2 — every
  term the Specification introduces is registered, and no term it
  uses conflicts with an existing entry.

**Candidate -> Standards Track** requires:
* the Version reaching `1.0.0` or later (Section 4.3);
* at least one demonstrated, independent implementation exercising
  the Specification's Requirements — consistent with Principle P7
  (Time-to-First-Object, ONP-0003), a Specification that cannot be
  implemented by an independent party is not ready to be called
  stable.

**Any Status -> Obsolete** requires:
* a stated successor Specification or an explicit statement that
  the Specification's function is retired without replacement;
* the Specification's number remains permanently assigned to it
  (ONP-0000 Section 3.1) — Obsolete is not equivalent to
  "available for reuse."

**Obsolete -> Working Draft (revival)** is permitted for the same
Specification (not a reuse of its number for a different topic,
which remains prohibited) but MUST reset its Version to a new `0.y.z`
value greater than any it previously held, and MUST NOT resume the
old Version sequence as though the Obsolete period had not happened.

## 4.6 Cross-Document Version Compatibility Signaling

1. When one Specification declares a dependency on another (per
   ONP-0000 Section 4.2), it SHOULD state the minimum Version of the
   dependency it requires.
2. A MAJOR version mismatch (post-1.0) between a declared minimum
   and an available Specification MUST be treated as incompatible by
   any tooling checking conformance.
3. A MINOR or PATCH difference SHOULD be treated as compatible,
   consistent with the additive, non-breaking nature MINOR and PATCH
   changes are required to have under Section 4.1.

---

# 5. Object Model

## 5.1 Version History Entry (Illustrative)

Every ONP Specification SHOULD maintain a Version History as a
final appendix, structured as:

| Field | Required | Description |
|---|---|---|
| `version` | REQUIRED | The Version number reached. |
| `date` | REQUIRED | Date of the change. |
| `classification` | REQUIRED | `MAJOR`, `MINOR`, or `PATCH`. |
| `summary` | REQUIRED | One-line description of what changed. |

This requirement applies to Specifications published from ONP-0007
onward. ONP-0000 through ONP-0006 SHOULD backfill this appendix at
their next substantive revision rather than as an immediate,
change-free patch solely to add history (which would itself need
its own Version History Entry to describe truthfully, and would add
no normative value in the meantime).

---

# 6. Processing Model

## 6.1 Change Classification Algorithm

```
Given a proposed change to Specification S (currently at version V):

1. Does the change alter the mandatory section template, filename
   convention, or any MUST/MUST NOT in S's Requirements section,
   in a way that a previously-conformant reader/implementation
   would now be non-conformant?
     YES -> proceed to step 2.
     NO  -> proceed to step 4.

2. Is S currently pre-1.0 (V < 1.0.0)?
     YES -> classify MINOR, with mandatory explicit prose callout
            (Section 4.2, rule 4).
     NO  -> classify MAJOR, with mandatory Migration guidance
            (Section 4.3, rule 2).

3. (unreached; steps 1-2 are exhaustive for the breaking-change path)

4. Is the change additive only (new OPTIONAL field, new registry
   entry, new SHOULD/MAY guidance, new example) with no existing
   Requirement altered?
     YES -> classify MINOR.
     NO  -> proceed to step 5.

5. Is the change purely editorial (wording, formatting, gloss
   correction with no meaning change)?
     YES -> classify PATCH.
     NO  -> the change does not fit steps 1-5 cleanly; treat as
            MINOR pending explicit WG classification, and flag for
            review rather than guessing.
```

## 6.2 Status Transition Workflow

```
Working Draft
     |
     |  Principles Review PASS (ONP-0003 S6.1)
     |  Security Review PASS (ONP-0005 S6.3)
     |  Terminology Registration complete (ONP-0002 S6.2)
     v
  Candidate
     |
     |  Version >= 1.0.0
     |  Independent implementation demonstrated
     v
Standards Track  ---------->  Obsolete
                  (successor    (any Status may transition
                   published,    here per Section 4.5)
                   or retired
                   without
                   replacement)
```

## 6.3 Interoperability

Version compatibility signaling (Section 4.6) is what allows
independent tooling — a Node's dependency checker, a documentation
site generator, a conformance test harness — to determine
compatibility mechanically rather than by a human re-reading prose
diffs. A tool that understands MAJOR/MINOR/PATCH semantics per this
document can correctly reason about a Specification's dependency
graph (ONP-0000 Section 4.2) without understanding that
Specification's substantive content at all — this is a deliberate
design goal, analogous to how strict layering (ONP-0001) lets a
minimal Node verify Objects without understanding every Companion's
domain content.

---

# 7. Examples

## 7.1 Retroactive Classification of This Session's Actual History

```
ONP-0000  0.1.0 -> 0.2.0
  Change: mission statement, four pillars, problem statement, and
          roadmap catalog replacement added.
  Classification per Section 6.1: touches Section 4.1's numbering
  scheme content (a catalog replacement), but does not alter the
  mandatory section template or any MUST governing OTHER documents'
  structure -> did not meet step 1's bar for THIS document's own
  Requirements -> correctly classified MINOR under step 4.

ONP-0000  0.2.0 -> 0.3.0
  Change: mandatory section template (Section 3.2) and filename
          convention (Section 3.1) replaced.
  Classification: meets step 1 (alters what every OTHER
  specification's Requirements section must look like) -> step 2:
  V was pre-1.0 -> MINOR with explicit callout. This matches what
  was actually done at the time, retroactively validated by this
  document's own rule.

ONP-0002  0.1.0 -> 0.2.0 -> 0.3.0 -> 0.4.0
  Change (each step): new Terminology Registry entries added,
          no existing entry's owning document or meaning changed.
  Classification per Section 4.4, rule 1: MINOR, each time.
  This matches what was actually done, and is now backed by an
  explicit, citable rule rather than an unstated convention.
```

## 7.2 A Hypothetical MAJOR Case, Post-1.0

```
Suppose ONP-1003 (Digital Signatures) has reached Standards Track
at version 2.1.0, and the WG later needs to remove Ed25519 from
required-baseline status, replacing it with a different algorithm
as the mandatory minimum.

Classification: this invalidates any Node conformant under the old
required-baseline -> meets step 1 -> V >= 1.0.0 -> MAJOR bump to
3.0.0, with mandatory Migration guidance (ONP-9004) describing how
implementations should transition.
```

---

# 8. Security Considerations

A stale or misattributed Specification version creates a supply-
chain-adjacent risk: an implementation built against a claimed
version that does not match the actual, current normative text could
silently diverge from the real requirements (e.g. an implementation
built against a Working Draft that has since had a Security Review
finding resolved with a breaking MINOR change, per Section 4.2 rule
4, that the implementer never saw). This is the same class of risk
ONP-0000 Section 5.3 (Document Provenance) already names at the
document-integrity level; this document's contribution is ensuring
that when a Specification does change, the Version number and
Version History Entry (Section 5.1) make that change discoverable
and classifiable, rather than silent.

---

# 9. Privacy Considerations

Version History Entries (Section 5.1) record editorial and technical
change activity, not personal data. No privacy impact is introduced
by this document.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0000, Introduction — Section 3.5 (superseded by this document;
  ONP-0000 is updated to point here, see Section 10.3) and Section
  4.4 (Status level meanings, which this document's Section 4.5
  supplies the transition process for).
* ONP-0002, Terminology — Section 6.2 (registration review),
  referenced as a Candidate-transition precondition (Section 4.5).
* ONP-0003, Design Principles — Section 6.1 (Principles Review) and
  Principle P7 (Time-to-First-Object), both referenced as Status
  transition preconditions.
* ONP-0005, Security Model — Section 6.3 (Security Review),
  referenced as a Candidate-transition precondition.

## 10.2 Informative References

* ONP-9004, Migration — guidance format for MAJOR post-1.0 changes,
  Section 4.3.
* `CHARTER.md` — the human governance process
  behind Status Transition decisions, explicitly out of scope here
  per Section 2.2.
* Semantic Versioning 2.0.0 (semver.org) — the general specification
  this document's MAJOR.MINOR.PATCH policy is derived from, including
  the major-version-zero convention adopted in Section 4.2.

## 10.3 Corresponding Update to ONP-0000

As part of this document's publication, ONP-0000 Section 3.5
("Versioning Discipline") is updated to read as a pointer to this
document rather than restating versioning rules, consistent with the
single-owner terminology and content-ownership discipline this
series has followed since ONP-0001 and ONP-0002 were published.

---

# Appendix A: Change Classification Quick Reference

```
[ ] Breaks a MUST, the mandatory template, or the filename
    convention, invalidating prior conformance?
      pre-1.0  -> MINOR (with explicit callout)
      >=1.0.0  -> MAJOR (with Migration guidance)
[ ] Purely additive (new OPTIONAL field, new registry entry, new
    SHOULD/MAY, new example), nothing existing invalidated?
      -> MINOR
[ ] Purely editorial (wording, formatting, gloss correction, no
    meaning change)?
      -> PATCH
[ ] Doesn't fit cleanly above?
      -> default MINOR, flag for explicit WG classification
```

# Appendix B: Status Transition Precondition Checklist

```
Working Draft -> Candidate:
  [ ] Principles Review passed (ONP-0003 S6.1) or Deviation recorded
  [ ] Security Review passed (ONP-0005 S6.3) or Deviation recorded
  [ ] Terminology Registration complete (ONP-0002 S6.2)

Candidate -> Standards Track:
  [ ] Version >= 1.0.0
  [ ] At least one independent implementation demonstrated

Any -> Obsolete:
  [ ] Successor named, OR explicit retirement-without-replacement
      statement
  [ ] Number remains permanently assigned (never reused)

Obsolete -> Working Draft (revival, same document only):
  [ ] New 0.y.z Version greater than any previously held
  [ ] Old Version sequence not resumed
```

---
*End of Document*
