Title: Open News Protocol (ONP): Validation
Document Number: ONP-1004
Status: Working Draft
Version: 0.1.1
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

ONP-1000 through ONP-1003 fully specify Core-level validation: a
Node implementing only those four documents can accept or reject any
News Object on authenticity grounds alone. What has been described
only abstractly until now — ONP-0001's three-level validation
diagram (Core, Companion/Extension, Application) — is formalized
here. This document wraps ONP-1003's Core pipeline with a concrete
Companion-level content validation procedure, an Extension-level
namespace validation and conflict-detection procedure, and a
structured Validation Result contract that Application-level code
consumes. It fixes the boundary precisely: Core-authentication is
terminal and independent of everything after it; Companion and
Extension validity are reported as separate, non-authoritative-over-
authenticity facts; what an application does with those facts is
never ONP's concern.

---

# Status of This Document

This document is part of the ONP Core series (ONP-1000-1999). It is
directly implementable and closes the loop ONP-1003 Section 2.2 left
open ("the full multi-level validation procedure... ONP-1004, not
yet published, owns the full procedure"). With this document, the
Core series' central validation story — from raw received bytes to a
structured, actionable result — is complete. It is a Working Draft.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

ONP-0001 Section 6.2 sketched three validation levels — Core,
Extension/Companion, Application — as a diagram, without specifying
what a Node concretely does at levels two and three, or what shape
the output of validation takes at all. ONP-1003 Section 6.1 filled
in level one completely. This document fills in level two
(Companion content validation and Extension namespace validation,
including conflict detection) and draws the exact line at level
three: ONP defines the facts an application receives, never the
business decision the application makes with them.

---

# 2. Scope

## 2.1 In Scope

* the Validation Result data contract;
* Companion-level (content) validation procedure and its failure
  semantics, including the `unknown` case for unrecognized
  `content_type`;
* Extension-level (`onp:extensions`) validation procedure, including
  Horizontal Invariant conflict detection;
* the independence rules between Core-authentication and
  Companion/Extension validity;
* the precise Application-level boundary.

## 2.2 Out of Scope

This document does NOT define:

* Core-level validation itself — fully specified in ONP-1000 through
  ONP-1003; this document only wraps that pipeline as Level 1 of a
  larger one;
* any specific Companion's or Extension's own schema validation
  rules — owned entirely by each of those specifications;
* Application-level business logic or display policy — per
  Principle P1 (Adjacent Publishing, ONP-0003), that remains
  entirely outside ONP's concern; this document fixes only the shape
  of the facts an application receives (Section 4.5), never what it
  does with them.

---

# 3. Terminology

This document is the owning specification for the following terms.

**Validation Level**
: One of the levels a News Object passes through during validation:
  Core (ONP-1000-1003), Companion, Extension, or Application.
  Companion and Extension are peer levels, not sequential relative
  to each other (Section 4.1).

**Core-Authenticated**
: The status of a News Object that has passed every Core-level check
  (ONP-1003 Section 6.1). This document formalizes the term ONP-1003
  used descriptively.

**Validation Result**
: The structured output (Section 5.1) a Node produces after running
  a News Object through every Validation Level it implements.

**Extension Conflict**
: A detected violation of the Horizontal Invariant (ONP-0001 Section
  5.3; ONP-0005 Section 4.5, rule 2) between two Extensions attached
  to the same Object.

---

# 4. Requirements

## 4.1 Validation Levels

1. Core (Level 1) MUST be evaluated first and is fully specified by
   ONP-1000 through ONP-1003; this document introduces no change to
   it.
2. Companion validation and Extension validation are both Level 2.
   They MUST both occur only after Level 1 succeeds, and MAY occur
   in either order relative to each other, except where an Extension
   explicitly declares a dependency on a named Companion (ONP-0001
   Section 4.3), in which case that Extension's validation MUST
   occur after the Companion's.
3. Application (Level 3) is never evaluated by ONP itself; it is the
   consumer of the Validation Result (Section 4.5) produced by
   Levels 1-2.

## 4.2 Level Independence

1. Core-authentication status MUST NOT depend on the outcome of
   Companion or Extension validation. This restates the Vertical
   Invariant (ONP-0001 Section 4.1) at the validation-procedure
   level: a Node MUST NOT allow a Companion or Extension validator,
   however it is implemented, to influence `core_authenticated`.
2. Companion validation MUST NOT depend on the presence or validity
   of any Extension.
3. An Extension MAY condition its own validation on a named
   Companion's content, but only where that Extension's own
   specification explicitly declares the dependency (ONP-0001
   Section 4.3); absent such a declaration, Extension validation
   MUST be independent of Companion outcome as well.

## 4.3 Companion-Level Validation Procedure

1. If a Node implements the Companion named by `content_type`, it
   MUST validate `content` against that Companion's own Object Model
   and Requirements sections, and MUST report the result as
   `companion_valid: true` or `companion_valid: false`.
2. A `companion_valid: false` result MUST NOT alter
   `core_authenticated`; the Object remains authentically attributed
   to its publisher even if its content does not conform to the
   Companion's schema (ONP-1000 Section 4.4 already established that
   Core validation does not depend on content; this rule makes the
   converse explicit — content invalidity does not retroactively
   revoke authenticity either).
3. If a Node does not implement the Companion named by
   `content_type`, it MUST report `companion_valid: unknown`, not
   `false`. `unknown` and `false` are distinct outcomes and MUST NOT
   be conflated: `false` means "recognized and non-conformant,"
   `unknown` means "not evaluated because unrecognized" (ONP-1000
   Section 4.4, rule 3).

## 4.4 Extension-Level Validation Procedure

1. For each namespace present under `onp:extensions` that a Node
   implements, the Node MUST validate that namespace's content
   against the owning Extension's own Requirements, and report
   `valid`, `invalid`, or (for unimplemented namespaces) `unknown`,
   per namespace.
2. For every pair of implemented Extension namespaces present on the
   same Object, a Node MUST check for an Extension Conflict as
   defined by each Extension's own conflict-detection rules (Section
   6.2). A detected conflict MUST be reported explicitly (Section
   4.5) and MUST NOT be silently resolved in favor of either
   Extension, per ONP-0005 Section 4.5, rule 2.
3. An Extension Conflict MUST NOT alter `core_authenticated`, for the
   same reason stated in Section 4.2 — conflicts at Level 2 do not
   retroactively affect Level 1.

## 4.5 Validation Result Contract

1. A Node MUST be able to produce a Validation Result containing, at
   minimum, the fields in Section 5.1.
2. `core_authenticated: false` MUST be treated as terminal: a Node
   MUST NOT populate or rely on any other field when
   `core_authenticated` is false, and MUST reject the Object outright
   at the application boundary.
3. When `core_authenticated: true`, every other field MUST reflect
   only what Levels 2 actually evaluated, using `unknown` wherever a
   Companion or Extension was not implemented, per Sections 4.3 and
   4.4.

## 4.6 Application-Level Boundary

1. ONP MUST NOT define what an application does with a Validation
   Result — whether to display Companion-invalid content, how to
   surface an Extension Conflict to a user, whether to treat
   `unknown` as acceptable for its use case. These are Application-
   level policy decisions, explicitly out of ONP's scope per
   Principle P1.
2. An application relying on ONP for trust guarantees MUST check
   `core_authenticated` before making any use of an Object; this
   document does not and cannot enforce that an application does so
   correctly, but states the requirement unambiguously so that
   non-compliance is a clear application defect, not an ambiguity in
   this specification (Section 8.2).

---

# 5. Object Model

## 5.1 Validation Result (Authoritative)

```json
{
  "core_authenticated": true,
  "companion_valid": "true | false | unknown",
  "extension_results": {
    "org.onp.<namespace>": "valid | invalid | unknown"
  },
  "conflicts": [
    {
      "namespaces": ["org.onp.<a>", "org.onp.<b>"],
      "description": "human-readable conflict summary"
    }
  ],
  "failure_step": "string or null — which Core step failed, if core_authenticated is false"
}
```

| Field | Required | Description |
|---|---|---|
| `core_authenticated` | REQUIRED | Terminal. `false` means reject; no other field is meaningful. |
| `companion_valid` | REQUIRED when `core_authenticated` is true | `true`, `false`, or `unknown` (Section 4.3). |
| `extension_results` | REQUIRED when `core_authenticated` is true | Map of implemented namespaces to their result. |
| `conflicts` | REQUIRED (MAY be empty) when `core_authenticated` is true | List of detected Extension Conflicts (Section 4.4, rule 2). |
| `failure_step` | REQUIRED when `core_authenticated` is false | Which Core step (ONP-1003 Section 6.1) failed, for diagnostics. |

---

# 6. Processing Model

## 6.1 Full Four-Level Pipeline (Final Capstone)

```
INPUT: a received News Object (raw JSON)

LEVEL 1 — CORE (ONP-1000 through ONP-1003):
  Run the full pipeline (ONP-1003 Section 6.1).
  -> If any step fails: core_authenticated = false,
     failure_step = <the failed step>. STOP. Return Validation
     Result. Do not proceed to Level 2.
  -> If all steps pass: core_authenticated = true. Proceed.

LEVEL 2a — COMPANION:
  If content_type's Companion is implemented:
    validate content against it -> companion_valid = true/false
  Else:
    companion_valid = unknown

LEVEL 2b — EXTENSION (independent of 2a unless a declared
            dependency exists, per Section 4.2, rule 3):
  For each onp:extensions namespace present:
    if implemented: validate -> valid/invalid
    else: unknown
  For each pair of implemented namespaces:
    check for Extension Conflict -> append to conflicts[] if found

  (2a and 2b MAY run in parallel; neither affects the other's
  outcome except where an Extension has declared a Companion
  dependency.)

OUTPUT: Validation Result (Section 5.1), handed to Level 3.

LEVEL 3 — APPLICATION (never evaluated by ONP itself):
  Application-specific code consumes the Validation Result and
  makes whatever business decision it needs to. ONP's involvement
  ends at producing the Result.
```

## 6.2 Extension Conflict Detection (Forward-Looking Obligation)

Because no Extension specifications are yet published, this document
cannot enumerate concrete conflict rules; it instead places an
obligation on every future Extension specification (ONP-3000
series): each Extension specification MUST define, in its own
Requirements section, what constitutes a conflict with another
Extension's domain claims, in a form a Node can check
mechanically. A Node implementing two Extensions that have not
defined any conflict relationship between each other MUST assume no
conflict exists between them by default — silence between two
Extension specifications is not itself evidence of a conflict.

## 6.3 Interoperability

A Node implementing only ONP-1000 through ONP-1004 — no specific
Companion, no specific Extension — MUST still be able to produce a
complete, correctly-shaped Validation Result for any Object: Level 1
runs fully, and Level 2 correctly reports `unknown` throughout rather
than guessing or omitting fields. This is the final, concrete form of
the interoperability guarantee stated abstractly since ONP-0001: a
minimal Node's output is always well-formed, even when it cannot
evaluate everything a fuller implementation could.

---

# 7. Examples

## 7.1 Fully Valid, Recognized Companion and Extension

```json
{
  "core_authenticated": true,
  "companion_valid": true,
  "extension_results": { "org.onp.ai-metadata": "valid" },
  "conflicts": [],
  "failure_step": null
}
```

## 7.2 Core Valid, Unrecognized content_type

```json
{
  "core_authenticated": true,
  "companion_valid": "unknown",
  "extension_results": {},
  "conflicts": [],
  "failure_step": null
}
```

## 7.3 Core Valid, Companion Content Malformed

```json
{
  "core_authenticated": true,
  "companion_valid": false,
  "extension_results": {},
  "conflicts": [],
  "failure_step": null
}
```

The Object is still genuinely from its claimed publisher; its
`content` simply does not conform to the Article Companion's schema.
An application MAY choose to still store this Object for audit
purposes while declining to render it as an article — that choice is
Level 3, outside this document's concern (Section 4.6).

## 7.4 Core Invalid (Terminal)

```json
{
  "core_authenticated": false,
  "failure_step": "ONP-1003 Section 4.5, step 6 (signature verification failed)"
}
```

No other field is present, per Section 4.5, rule 2.

## 7.5 Extension Conflict Detected

```json
{
  "core_authenticated": true,
  "companion_valid": true,
  "extension_results": {
    "org.onp.licensing-example": "valid",
    "org.onp.syndication-example": "valid"
  },
  "conflicts": [
    {
      "namespaces": ["org.onp.licensing-example", "org.onp.syndication-example"],
      "description": "Syndication declares unrestricted redistribution; Licensing declares no-redistribution."
    }
  ],
  "failure_step": null
}
```

Both Extensions individually validate; the conflict between their
claims is what Section 4.4, rule 2 requires surfacing rather than
silently resolving.

---

# 8. Security Considerations

## 8.1 Level Independence Is Where Layer Confusion Is Actually
     Prevented in Code

Section 4.2's independence rules are the concrete implementation of
the Vertical Invariant (ONP-0001 Section 4.1) and the layer-confusion
protections (ONP-0005 Section 4.5) at the exact point in a Node's
code where they could otherwise be violated: if a Companion or
Extension validator function were allowed to write to
`core_authenticated`, every prior document's security analysis would
be moot in practice, however correct it is on paper. This document
is where that boundary must be enforced, which is why it is restated
here rather than assumed to follow automatically from earlier
documents.

## 8.2 The Application Boundary Is a Documented Requirement, Not an
     Enforced One

Section 4.6, rule 2 states that an application MUST check
`core_authenticated` before use. ONP has no mechanism to force
compliance with this at the application layer — an application that
ignores the Validation Result entirely and renders Object content
regardless is not prevented by anything in this document. This
document's contribution is making that failure mode unambiguously a
violation of a stated MUST, which matters for conformance testing
(ONP-9002, Reference series) even though it
cannot be enforced by the protocol itself.

---

# 9. Privacy Considerations

The Validation Result structure (Section 5.1) carries no personal
data of its own. Companion-level and Extension-level validation may
process `content` or `onp:extensions` fields that do carry personal
data, but the privacy analysis of those fields belongs to their
owning Companion or Extension specifications, not to this document,
which only defines the pass/fail/unknown reporting shape.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0001, Architecture — Section 6.2, the three-level validation
  diagram this document formalizes into a procedure.
* ONP-0003, Design Principles — Principle P1 (Adjacent Publishing),
  motivating the Application-level boundary (Section 4.6).
* ONP-0005, Security Model — Section 4.5 (layer confusion), restated
  concretely in Section 8.1; Horizontal Invariant conflict handling,
  formalized in Section 4.4.
* ONP-1000 through ONP-1003 — fully specify Level 1 (Core), which
  this document wraps without modification.

## 10.2 Informative References

* ONP-2100, Article; ONP-3100, AI Metadata (forward references —
  example Companion/Extension consumers of this document's
  Companion- and Extension-level procedures).
* ONP-3000, Extension Framework — the
  conflict-declaration obligation in Section 6.2 is formally
  imposed on individual Extensions there.
* ONP-9002, Security Checklist — conformance
  testing implications of Section 8.2.

---

# Appendix A: Validation Result JSON Schema (Illustrative)

```json
{
  "core_authenticated": "boolean, REQUIRED",
  "companion_valid": "'true' | 'false' | 'unknown', REQUIRED if core_authenticated",
  "extension_results": "object mapping namespace to 'valid'|'invalid'|'unknown', REQUIRED if core_authenticated",
  "conflicts": "array of {namespaces: [string,string], description: string}, REQUIRED (may be empty) if core_authenticated",
  "failure_step": "string or null, REQUIRED if not core_authenticated"
}
```

# Appendix B: Four-Level Pipeline Quick Reference

```
[ ] Level 1 (Core, ONP-1000-1003): run full pipeline.
      FAIL -> core_authenticated=false, failure_step set, STOP.
      PASS -> core_authenticated=true, continue.
[ ] Level 2a (Companion): recognized -> validate -> true/false.
                          unrecognized -> unknown.
[ ] Level 2b (Extension): per namespace, recognized -> valid/invalid.
                          unrecognized -> unknown.
                          check all implemented pairs for conflicts.
[ ] Assemble Validation Result (Appendix A).
[ ] Hand off to Level 3 (Application) — ONP's involvement ends here.
```

---
*End of Document*
