Title: Open News Protocol (ONP): Extension Framework
Document Number: ONP-3000
Status: Working Draft
Version: 0.1.5
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document is the entry point to the ONP Extension series
(ONP-3100-3500), mirroring the role ONP-2000 played for Companions.
It fixes the `org.onp.<name>` namespace registration process and the
mandatory additions every Extension specification MUST make to the
universal template. Its central, original contribution is the Claim
Domain mechanism: ONP-1004 Section 6.2 placed an obligation on "each
future Extension specification" to define, ad hoc, how conflicts
with other Extensions are detected, without giving them a shared
mechanism to do it with. This document supplies that mechanism once,
so no two Extensions invent incompatible ways of declaring what they
claim authority over.

---

# Status of This Document

This document is part of the ONP Extension series (ONP-3000-3999)
and is its framework document, numbered 3000 per the roadmap
(ONP-0000 Section 4.1). It is normative and binding on every future
Extension specification. It is a Working Draft.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

Companions never needed a conflict-detection mechanism, because
exactly one Companion applies to any given News Object at a time
(`content_type` is singular). Extensions are different by design:
several can attach to the same Object simultaneously through
`onp:extensions`, which is exactly where the Horizontal Invariant
(ONP-0001 Section 5.3) becomes a practical, not merely theoretical,
concern — and exactly why ONP-1004 Section 6.2 already anticipated
needing a conflict-detection obligation before any Extension existed
to test it against. This document is where that obligation gets a
concrete, shared mechanism instead of being reinvented by every
future Extension independently.

---

# 2. Scope

## 2.1 In Scope

* the `org.onp.<name>` namespace registration process;
* mandatory additions every Extension specification MUST make to the
  universal template;
* the Claim Domain mechanism: declaring what an Extension asserts
  about, so overlapping assertions across Extensions are mechanically
  detectable.

## 2.2 Out of Scope

This document does NOT define:

* any specific Extension's own domain content (ONP-3100 onward);
* the Object Reference mechanism — already owned by ONP-2000 and
  reused, not redefined, by Extensions that need it;
* the Companion-vs-Extension decision test itself — owned by ONP-0001
  Section 4.4; this document only requires it be shown applied
  (Section 4.2), exactly as ONP-2000 already requires for Companions.

---

# 3. Terminology

This document is the owning specification for the following terms.

**Extension Namespace**
: A registered `org.onp.<name>` identifier, unique across the entire
  ONP series, under which an Extension's fields are carried in
  `onp:extensions`.

**Claim Domain**
: A named category of assertion an Extension makes about a News
  Object (e.g. `redistribution`, `pricing-hint`,
  `geographic-restriction`), declared so that two Extensions
  asserting things about the same domain are mechanically detectable
  as a potential Extension Conflict (Section 4.5).

---

# 4. Requirements

## 4.1 Extension Namespace Registration

1. Every Extension specification MUST register a unique
   `org.onp.<name>` identifier, mirroring the registration process
   ONP-2000 Section 4.1 already established for Companion
   `content_type` identifiers.
2. This registration MUST occur in ONP-0002, alongside that
   Extension's other new terms, as part of its own publication.
3. An `org.onp.<name>` identifier, once registered, MUST NOT be
   reused for a different Extension.

## 4.2 Mandatory Extension Document Additions

Every Extension specification (ONP-3100 through ONP-3500) MUST, in
addition to the universal template (ONP-0000 Section 3.2), include:

1. An explicit statement of its registered `org.onp.<name>`
   identifier, in its Scope section.
2. An explicit application of the Companion-vs-Extension decision
   test (ONP-0001 Section 4.4), with its result stated and justified
   — mirroring ONP-2000 Section 4.2, rule 2's requirement for
   Companions.
3. Its extension schema: the fields it carries under
   `onp:extensions.<org.onp.name>`.
4. An explicit list of any Companion(s) it depends on, per ONP-0001
   Section 4.3's permission for an Extension to depend on named
   Companions — or an explicit statement that it depends only on
   Core.
5. At least one declared Claim Domain (Section 4.3), or an explicit,
   justified statement that it makes no claims capable of conflicting
   with any other Extension (Section 4.3, rule 4).

## 4.3 Claim Domain Declaration

1. An Extension specification MUST declare, in its Requirements
   section, every Claim Domain it asserts about.
2. Each declared Claim Domain MUST be registered in ONP-0002,
   following the same registration discipline as any other term.
3. Two or more Extensions MAY validly declare the same Claim Domain;
   this is not itself an error — it is the condition Section 4.5's
   mechanical check exists to surface for closer inspection.
4. An Extension asserting nothing capable of conflicting with another
   Extension's claims (for example, a purely additive, self-contained
   metric with no relationship to any other Extension's domain) MUST
   state this explicitly rather than silently omitting a Claim Domain
   declaration, so that its absence is legible as a deliberate claim
   of non-conflict, not an oversight.

## 4.4 Extension-Specific Comparison Rules (Optional, Deeper)

An Extension specification MAY additionally define a specific
comparison rule against one or more named other Extensions' fields,
to be used instead of Section 4.5's default fallback when both are
present on the same Object, in order to distinguish an actual value
contradiction from a benign overlap of the same Claim Domain (for
example, two Extensions both asserting a `redistribution` Claim
Domain might be fully compatible if their specific declared terms do
not actually contradict each other).

## 4.5 Mechanical Overlap Detection (Mandatory Baseline)

1. A Node performing Extension-level validation (ONP-1004 Section
   4.4) MUST check, for every pair of Extensions it implements and
   that are present on the same Object, whether their declared Claim
   Domains (per ONP-0002's registry) overlap.
2. A detected overlap MUST be reported as an Extension Conflict entry
   (ONP-1004 Section 5.1) at minimum as a "potential conflict, no
   comparison rule available" finding, unless a specific comparison
   rule (Section 4.4) determines the overlap is benign.
3. This mechanical check MUST occur even when no Extension-specific
   comparison rule (Section 4.4) exists for the specific pair
   involved — domain-level overlap detection is guaranteed and
   registry-driven; deeper, value-level comparison is an optional
   enhancement individual Extensions MAY additionally provide.

---

# 5. Object Model

## 5.1 Claim Domain Registry Entry

Registered in ONP-0002 using the existing Terminology Registry Entry
structure (ONP-0002 Section 5.1):

```
term: redistribution (Claim Domain)
owning_document: ONP-31xx (the declaring Extension)
gloss: Asserts a position on whether/how content may be
       redistributed.
status: active
```

---

# 6. Processing Model

## 6.1 Extension-Level Validation, Completed

This extends ONP-1004 Section 6.1, Level 2b, which described conflict
detection abstractly before this document existed to supply its
mechanism:

```
For each pair of implemented Extension namespaces present on an
Object:
  1. Look up each Extension's declared Claim Domain(s) in the
     ONP-0002 registry.
  2. If the sets of Claim Domains intersect:
       a. If a specific comparison rule (Section 4.4) exists for
          this pair -> apply it. Contradiction found -> Extension
          Conflict. No contradiction -> no conflict, despite the
          domain overlap.
       b. If no specific comparison rule exists -> report a
          "potential conflict, no comparison rule available"
          finding (Section 4.5, rule 2).
  3. If the sets do not intersect -> no conflict possible between
     this pair, by construction.
```

## 6.2 Interoperability

A Node implementing only ONP-3000 plus the Companion/Core series —
with no specific Extension implemented — performs no Extension-level
checks at all and correctly reports `extension_results` as empty
(ONP-1004 Section 5.1), consistent with the interoperability
guarantee already established throughout Core. A Node implementing
two or more specific Extensions gains the mechanical overlap check
this document defines, without needing either Extension to have
anticipated the other by name.

---

# 7. Examples

## 7.1 Revisiting ONP-1004's Own Worked Example

ONP-1004 Section 7.5 already illustrated an Extension Conflict
between a hypothetical Licensing-like and Syndication-like Extension,
before this document existed to explain mechanically how it would be
caught:

```
org.onp.licensing-example declares Claim Domain: redistribution
org.onp.syndication-example declares Claim Domain: redistribution

Both present on the same Object -> Claim Domains intersect (Section
6.1, step 2) -> checked against any specific comparison rule; absent
one, reported as a potential conflict per Section 4.5, rule 2 —
exactly the outcome ONP-1004 Section 7.5 already showed, now with the
mechanical basis for how a Node actually detects it.
```

---

# 8. Security Considerations

The mechanical overlap check (Section 4.5) is what makes the
Horizontal Invariant (ONP-0001 Section 5.3) enforceable in practice
rather than merely stated as a principle: without a shared,
registry-driven way to detect overlapping claims, enforcement would
depend on every Extension author happening to know about every other
Extension in advance — an assumption that does not scale as the
Extension series grows. Requiring Claim Domain declaration up front,
checked automatically by any Node implementing two or more
Extensions, removes that dependency on foresight.

---

# 9. Privacy Considerations

This document defines no data fields carrying personal information
and introduces no privacy impact of its own; the Claim Domain
mechanism operates on registered term names, not on Object content.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0001, Architecture — Section 4.3 (Extension Requirements) and
  Section 5.3 (Horizontal Invariant), both operationalized by this
  document.
* ONP-0002, Terminology — Section 4.1 (registration process), applied
  here to `org.onp.<name>` identifiers and Claim Domains.
* ONP-1004, Validation — Section 4.4 and Section 6.2, the Extension
  Conflict detection obligation this document fulfills with a
  concrete, shared mechanism.
* ONP-2000, Companion Framework — the structurally parallel framework
  document for Companions; this document mirrors its registration
  pattern (Section 4.1) rather than inventing a new one.

## 10.2 Informative References

* ONP-3100, AI Metadata (forward reference — the first Extension
  expected to declare a Claim Domain in practice).

---

# Appendix A: Extension Namespace Registry

As of `org.onp.accessibility` (ONP-3500), every Extension named in
ONP-0000 Section 4.1's original roadmap (3000-3500) has been
published, completing the original roadmap in full (Foundation
through Extension). Future Extensions beyond this original set remain
possible and follow the same registration process (Section 4.1).

| org.onp.name | Owning Document | Claim Domain(s) | Status |
|---|---|---|---|
| `org.onp.ai-metadata` | ONP-3100 | `ai-generation-disclosure`, `ai-training-permission` | active |
| `org.onp.search` | ONP-3200 | `search-indexing-consent` | active |
| `org.onp.analytics` | ONP-3300 | `analytics-tracking-disclosure` | active |
| `org.onp.geolocation` | ONP-3400 | `geographic-subject-matter` | active |
| `org.onp.accessibility` | ONP-3500 | `accessibility-alternatives` | active |

# Appendix B: Extension Publication Checklist

```
[ ] Companion-vs-Extension decision test applied and documented
    (ONP-0001 Section 4.4)
[ ] org.onp.<name> chosen, checked against ONP-0002 for collisions
[ ] Universal template followed (ONP-0000 Section 3.2)
[ ] org.onp.<name> registered in ONP-0002
[ ] Every new term registered in ONP-0002
[ ] Companion dependencies (if any) explicitly listed
[ ] At least one Claim Domain declared, or explicit no-conflict
    statement given (Section 4.3, rule 4)
[ ] Claim Domain(s) registered in ONP-0002
[ ] (optional) specific comparison rules defined against named
    other Extensions, where a domain overlap is anticipated
[ ] Principles Review passed (ONP-0003 Section 6.1)
[ ] Security Review passed (ONP-0005 Section 6.3)
```

---
*End of Document*
