Title: Open News Protocol (ONP): News Object Lifecycle
Document Number: ONP-0006
Status: Working Draft
Version: 0.1.1
Author: Open News Protocol Working Group
Last Modified: 2026-08-01

---

# Abstract

This document defines the lifecycle of a News Object: how a
publisher issues a new Version that supersedes a prior one, how a
Node determines which Version in a lineage is Current, and how a
publisher retracts an Object entirely. It supplies the concrete
mechanism that ONP-0005 Section 4.3 requires but does not itself
define: a Node's ability to distinguish a Current Version from a
Superseded one, so that a validly signed but outdated Version cannot
be replayed as though it were still authoritative. It defines a
lightweight, Core-level Revision Reason field, explicitly not a
substitute for the richer, structured explanation-of-change that the
Corrections Companion (ONP-2700) defines.

---

# Status of This Document

This document is part of the ONP Foundation series (ONP-0000-0999).
It is normative and is a direct dependency for the correctness of
ONP-1000 and ONP-1001, which will finalize the wire-level structure
this document specifies illustratively (Section 5), consistent with
how ONP-0004 and ONP-0001 treated their own illustrative structures.
It is a Working Draft.

**Change note (v0.1.1):** the Abstract, Section 2.2, and Section 10.2
described ONP-2700 (Corrections) in future tense as not yet
published; ONP-2700 has since been published. Corrected throughout.
Classified PATCH under ONP-0007 Section 4.2, rule 3: editorial only.

**Terminology note:** this document's use of "Version" refers
exclusively to a News Object Version within a lineage. It is
unrelated to a Specification's own `Version` field (semantic
versioning of an ONP-nnnn document itself, governed by ONP-0007).
The two concepts share an English word by coincidence, not by
design; neither document redefines the other's term.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

ONP-0000 Section 1.1 names "corrections and retractions linked to
the original" as a problem existing infrastructure does not solve.
ONP-0005 Section 4.3 names the security consequence of not solving
it: an adversary who can serve or cache a superseded Version can
suppress a correction by having a Node treat old, still-validly-
signed content as current. This document closes both gaps with one
mechanism: an explicit, publisher-attested chain of supersession
that a Node can walk without needing to trust wall-clock timestamps,
a central registry, or any third party's word for which Version is
current.

---

# 2. Scope

## 2.1 In Scope

* the lifecycle states a News Object MUST support (Published,
  Retracted) and the derived state (Superseded);
* the Version lineage / supersession mechanism, and the algorithm a
  Node MUST use to determine the Current Version;
* retraction semantics and their interaction with archival access;
* the lightweight, OPTIONAL Core-level Revision Reason field;
* lineage fork handling (conflicting supersession claims).

## 2.2 Out of Scope

This document does NOT define:

* the wire-level byte format of a Version, OID, or VID (see
  ONP-1000, ONP-1001);
* the structured, publisher-facing explanation of what changed and
  why (see ONP-2700, Corrections, now published; this document
  provides the Core-level plumbing that Companion builds on);
* any pre-publication workflow state (draft, in review, scheduled)
  internal to a publisher's own CMS — per Principle P1 (Adjacent
  Publishing, ONP-0003), that remains entirely the CMS's own concern
  and is never visible to ONP;
* archival storage or retrieval mechanics themselves (a Node or
  archive MAY retain every Version of a lineage indefinitely; this
  document only defines how to interpret them once retained).

---

# 3. Terminology

This document is the owning specification for the following terms.

**Lifecycle State**
: The status of a News Object Version: `published`, the derived
  status `superseded`, or `retracted`.

**News Object Version**
: A single, independently signed instance within a lineage, sharing
  an OID with every other Version in that lineage and identified by
  its own VID. Distinct from a Specification's semantic `Version`
  field (see Status of This Document, Terminology Note).

**Supersession**
: The publisher-attested relationship by which one Version declares
  that it replaces a specific, immediately prior Version in the same
  lineage.

**Current Version**
: The Version in a lineage that is not Retracted and that no other
  known, validly signed Version in the same lineage declares itself
  to supersede (Section 4.3).

**Superseded Version**
: A Version that is not Current, because a later Version in the same
  lineage declares supersession over it. This is a derived status,
  not a field a publisher sets directly.

**Retraction**
: The publisher-attested, terminal declaration that an entire
  lineage is withdrawn and MUST NOT be treated as current or
  authoritative content going forward, while remaining verifiable
  for archival purposes. Distinct from Correction (ONP-2700,
  reserved), which will describe an amendment while the lineage
  remains published.

**Revision Reason**
: An OPTIONAL, short, Core-level string a publisher MAY attach to a
  superseding Version, describing at a high level why the
  supersession occurred. Not a substitute for the structured
  Correction record ONP-2700 will define.

**Lineage Fork**
: The condition in which two or more validly signed Versions in the
  same lineage each declare supersession over the same prior
  Version, producing an ambiguous "next" Version (Section 6.2).

---

# 4. Requirements

## 4.1 Lifecycle States

1. Core MUST support exactly two explicit Lifecycle States that a
   publisher can set on a Version: `published` and `retracted`.
2. `superseded` MUST be a derived status, computed per Section 4.3,
   never a field a publisher sets directly. This keeps the Minimal
   Required Surface (ONP-0003, Principle P2) honored: a publisher
   only ever declares "this is published" or "this lineage is
   retracted"; a Node computes the rest.

## 4.2 Version Lineage

1. The first Version in a lineage MUST declare no `supersedes`
   value (or an explicit null/absent value).
2. Every subsequent Version in the same lineage MUST declare exactly
   one `supersedes` value, pointing to the VID of the Version it
   replaces.
3. A Version MUST NOT declare `supersedes` pointing to a VID outside
   its own OID's lineage.
4. Ordering within a lineage MUST be established by walking
   `supersedes` pointers, not by comparing signing timestamps. A
   timestamp MAY be included for informational purposes but MUST
   NOT be treated as authoritative for determining order — an
   adversary or a misconfigured clock can produce a misleading
   timestamp; a publisher's explicit `supersedes` declaration is
   what a Node trusts for ordering.

## 4.3 Current Version Determination

1. Given a set of known, validly signed Versions sharing an OID, a
   Node MUST determine the Current Version as follows: a Version V
   is Current if and only if (a) no known Version in the set
   declares `supersedes = V`, and (b) V's Lifecycle State is not
   `retracted`.
2. A Node MUST NOT present a Version as current if a later Version
   in its known set satisfies the Current Version test instead. This
   directly satisfies the security property required by ONP-0005
   Section 4.3.
3. A Node's determination is necessarily bounded by what Versions it
   knows about; a Node that has not yet observed a later Version
   MUST still treat the latest Version it knows as Current until and
   unless a newer one becomes known to it. This document does not
   require real-time global consistency (per the rejection of
   consensus-based trust rooting in ONP-0005 Section 4.6) — eventual
   observation of the correct Current Version is the guarantee, not
   instantaneous global agreement.

## 4.4 Retraction

1. A publisher retracts a lineage by issuing a final Version with
   Lifecycle State `retracted`. This final Version MUST itself
   follow the normal supersession rule (Section 4.2) relative to the
   prior Current Version.
2. A Node MUST treat a `retracted` lineage's content as no longer
   current or authoritative for any purpose other than archival or
   historical reference. A Node presenting retracted content to an
   end user in a context implying it is current MUST NOT do so
   without clearly indicating its retracted status.
3. A Node MUST continue to allow independent verification (Core
   signature and Trust Anchor resolution) of every historical
   Version in a retracted lineage; retraction affects presentation
   and currency, not verifiability.
4. A publisher MAY issue a new Version after a retraction only via
   an explicit `republish` declaration referencing the retraction it
   reverses. A Node encountering a post-retraction Version without
   an explicit `republish` declaration SHOULD treat it as anomalous
   and apply elevated scrutiny, consistent with ONP-0005's Adversary
   A3 (compromised key) — a sudden, undeclared revival of a retracted
   lineage is exactly the kind of anomaly a compromised key might
   produce.

## 4.5 Revision Reason

1. A publisher MAY attach a Revision Reason string to any superseding
   Version. A Node MUST NOT require this field to be present to
   process a valid supersession.
2. A Revision Reason MUST NOT be treated as a substitute for a
   Corrections Companion record once ONP-2700 is published; it is a
   minimal, Core-level courtesy field available before that
   Companion exists, not a permanent alternative to it.

## 4.6 Lineage Fork Handling

1. If a Node observes two or more validly signed Versions that each
   declare `supersedes` pointing to the same prior Version, it MUST
   NOT silently select one as Current. This is a Lineage Fork
   (Section 3).
2. A Node MUST surface a detected Lineage Fork as an anomalous
   condition rather than resolving it invisibly. This document does
   not mandate a single resolution policy (e.g. "prefer the latest
   timestamp") as authoritative, because timestamp is explicitly
   non-authoritative for ordering (Section 4.2, rule 4); a Node MAY
   apply local policy to choose a working assumption while
   presenting the fork condition, but MUST NOT represent that choice
   as an ONP-guaranteed Current Version determination.

---

# 5. Object Model

The following structure is illustrative. Its authoritative wire-
level form is owned by ONP-1000 and ONP-1001.

```json
{
  "oid": "onp:oid:...",
  "vid": "onp:vid:...",
  "supersedes": "onp:vid:... (or null for the first Version)",
  "lifecycle_state": "published",
  "revision_reason": "optional short string",
  "republish_of_retraction": "onp:vid:... (only present on a republish)"
}
```

| Field | Required | Description |
|---|---|---|
| `oid` | REQUIRED | Constant across every Version in a lineage. |
| `vid` | REQUIRED | Unique to this Version. |
| `supersedes` | REQUIRED (absent only on the first Version) | The VID this Version replaces. |
| `lifecycle_state` | REQUIRED | `published` or `retracted`. `superseded` is never stored; it is derived (Section 4.1, rule 2). |
| `revision_reason` | OPTIONAL | Short string (Section 4.5). |
| `republish_of_retraction` | OPTIONAL | Present only when reversing a prior retraction (Section 4.4, rule 4). |

---

# 6. Processing Model

## 6.1 Lineage Construction and Current Version Resolution

```
Given: a set S of validly signed Versions sharing an OID.

1. Build a map: for each Version V in S, record V.supersedes.
2. Build the set of "superseded VIDs" = { V.supersedes : V in S,
   V.supersedes is not null }.
3. Candidate Current Versions = { V in S : V.vid is NOT in
   superseded VIDs }.
4. If |Candidates| == 1 and that Version's lifecycle_state is not
   "retracted": that is the Current Version.
5. If |Candidates| == 1 and its lifecycle_state is "retracted": the
   lineage has no Current Version (it is retracted); serve only
   with explicit retracted-status indication (Section 4.4, rule 2).
6. If |Candidates| > 1: a Lineage Fork (Section 4.6) exists; do not
   silently resolve.
7. If |Candidates| == 0: malformed lineage (a supersession cycle);
   MUST be treated as a validation failure, not resolved.
```

## 6.2 Interaction with Retraction and Republication

A `republish` Version (Section 4.4, rule 4) participates in the same
supersession chain as any other Version — it simply also carries a
`republish_of_retraction` pointer for auditability. The algorithm in
Section 6.1 does not need a special case for it; a republish Version
becomes Current exactly as any other new Version would, once it
supersedes the prior (retracted) Current Version. The elevated
scrutiny required by Section 4.4, rule 4 is a Node-side policy
response, not a change to the resolution algorithm itself.

## 6.3 Interoperability

A Node implementing only this document's REQUIRED mechanism (plain
`supersedes` chains, `published`/`retracted` states) MUST be able to
correctly determine the Current Version of any lineage, regardless
of whether the publisher has also published Corrections Companion
(ONP-2700) records explaining the changes in human-readable form.
The Companion is additive narrative; it MUST NOT be required for a
minimal Node to get lifecycle determination right. This mirrors the
same interoperability guarantee ONP-0004 Section 6.4 states for
Trust Anchor resolution.

---

# 7. Examples

## 7.1 Simple Lineage: Three Versions, One Retraction

```
V1: vid=v1, supersedes=null, state=published
V2: vid=v2, supersedes=v1,   state=published, revision_reason="Corrected quote attribution"
V3: vid=v3, supersedes=v2,   state=retracted

Resolution (Section 6.1):
  superseded VIDs = { v1, v2 }
  candidates = { v3 }
  v3.lifecycle_state == retracted
  -> lineage has no Current Version; serve as retracted (rule 5)
```

## 7.2 Defeating the Replay Attack from ONP-0005 Section 7.4

```
Publisher issues V1, then V2 (a correction).
Adversary re-serves V1 to a Node that already knows about V2.

Node's known set S = { V1, V2 }
superseded VIDs = { v1 } (because V2.supersedes = v1)
candidates = { v2 }
-> Current Version = V2, not V1.

The replayed V1 is correctly recognized as Superseded even though
its own signature remains valid — exactly the outcome ONP-0005
Section 4.3 requires.
```

## 7.3 Lineage Fork

```
V1: vid=v1, supersedes=null
V2a: vid=v2a, supersedes=v1  (signed by the publisher's current key)
V2b: vid=v2b, supersedes=v1  (also signed by the publisher's current key,
                               e.g. due to a publishing error or a
                               compromised key issuing a conflicting Version)

superseded VIDs = { v1 }
candidates = { v2a, v2b }
-> Lineage Fork detected (Section 4.6); Node MUST surface this,
   MUST NOT silently pick one.
```

---

# 8. Security Considerations

## 8.1 This Document Satisfies ONP-0005 Section 4.3

The Current Version determination algorithm (Section 6.1) is the
concrete mechanism ONP-0005 Section 4.3 required without defining.
Its correctness rests entirely on the `supersedes` chain, which is
itself part of the signed content of each Version — an adversary
without a valid key cannot forge a new supersession, and an
adversary who replays an old Version cannot make it appear Current
if a Node has also observed the superseding Version (Section 7.2).

## 8.2 Lineage Forks Are a Real, Not Merely Theoretical, Risk

A Lineage Fork (Section 4.6) can arise innocently (a publisher's own
tooling issuing two corrections concurrently before observing each
other) or maliciously (a compromised key issuing a conflicting
Version, per ONP-0005 Adversary A3). This document deliberately does
not mandate an automatic resolution policy, because any automatic
policy (e.g. "prefer latest timestamp") would reintroduce exactly
the non-authoritative-timestamp risk Section 4.2 rule 4 excludes
elsewhere. Surfacing the fork, rather than silently resolving it, is
itself the security property this document provides for that case.

## 8.3 Retraction Does Not Erase History

Per Section 4.4 rule 3, retraction never removes the ability to
verify historical Versions. This is a deliberate choice: an
architecture that let retraction make prior signed content
unverifiable would let a compromised or coerced publisher erase
inconvenient history, which is a worse outcome than leaving it
verifiably archived but clearly marked as retracted.

## 8.4 Republication Anomaly Detection Is Advisory, Not Enforced

Section 4.4 rule 4's "SHOULD treat as anomalous" is deliberately a
SHOULD, not a MUST, because legitimate republication does happen
(e.g. a retraction issued in error, corrected shortly after). A Node
MAY implement stricter local policy, but this document does not
mandate blocking all undeclared post-retraction Versions outright,
since doing so would give an adversary who successfully times a
malicious retraction a way to permanently suppress a publisher's own
legitimate recovery.

---

# 9. Privacy Considerations

A lineage's Version history — how often and when a publisher issues
corrections or retractions — is, by the nature of this mechanism,
observable to any Node that retains history. This is inherent to
supporting corrections and retractions at all (ONP-0000 Section 1.1)
and is not a defect; publishers should be aware that their editorial
correction cadence becomes part of a verifiable, retained record,
similar in spirit to a version-controlled document's commit history.
No individual person's personal data is inherently exposed by this
mechanism beyond what a Companion (e.g. ONP-2300, Identity) chooses
to attach to a given Version.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0000, Introduction — Section 1.1 (corrections/retractions
  named as a design goal this document fulfills).
* ONP-0001, Architecture — owns "Version lineage" and "Tombstone
  state" as terms; this document supplies their mechanism.
* ONP-0003, Design Principles — Principle P2 (Minimal Required
  Surface), directly shaping Section 4.1's two-explicit-states
  design.
* ONP-0005, Security Model — Section 4.3, the security property this
  entire document exists to satisfy; Section 4.6, the non-consensus
  rationale referenced in Section 4.3, rule 3 of this document.

## 10.2 Informative References

* ONP-1000, News Object; ONP-1001, Identifiers (forward references —
  authoritative wire-level OID/VID/Version schema).
* ONP-2700, Corrections (now published) — the structured,
  human-readable Companion this document's lightweight Revision
  Reason field defers to.
* ONP-0007, Versioning Policy — governs Specification versioning, a
  distinct concept from News Object Versioning; see the Terminology
  Note in this document's Status section.

---

# Appendix A: Full Lifecycle State Diagram

```
                    +-------------+
   (first Version)  |  published  |
        ----------->|  (Current)  |
                    +------+------+
                           |
                new Version supersedes it
                           |
                           v
                    +-------------+          +--------------+
                    | published   |--------->|  retracted   |
                    | (Current)   | publisher +--------------+
                    +------+------+ retracts         |
                           |                  explicit republish
                new Version supersedes it            |
                           |                          v
                           v                   +-------------+
                    +-------------+             | published   |
                    | published   |             | (Current)   |
                    | (Current)   |             +-------------+
                    +-------------+

  "superseded" is never a stored state — any prior Version in the
  chain above is automatically Superseded once a later one exists,
  per the Current Version algorithm (Section 6.1). It is omitted
  from this diagram because it has no box of its own; it is the
  absence of Current-ness.
```

# Appendix B: Current Version Determination — Quick Reference

```
[ ] Collect every known, validly signed Version sharing this OID.
[ ] Compute the set of VIDs referenced by any Version's `supersedes`.
[ ] Candidates = Versions whose own VID is NOT in that set.
[ ] Exactly one candidate, not retracted  -> that is Current.
[ ] Exactly one candidate, retracted      -> lineage has no Current
                                              Version; show retracted.
[ ] Zero candidates                        -> malformed (cycle);
                                              validation failure.
[ ] More than one candidate                -> Lineage Fork; surface
                                              it, do not silently pick.
```

---
*End of Document*
