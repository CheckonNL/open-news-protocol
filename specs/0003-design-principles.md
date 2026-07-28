Title: Open News Protocol (ONP): Design Principles
Document Number: ONP-0003
Status: Working Draft
Version: 0.1.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document codifies the non-negotiable design principles that
govern every ONP specification, from the Foundation series through
every Companion and Extension yet to be written. Where ONP-0000
states *why* ONP exists and ONP-0001 states *how the layers relate*,
this document states the constraints a specification or
implementation MUST satisfy regardless of which layer it belongs to.
These principles were distilled from an explicit risk analysis of
why open publishing standards fail to gain adoption — vendor
lock-in, excessive integration cost, unnecessary infrastructure,
and unclear economic incentive — and they exist specifically to
prevent those failure modes from being reintroduced, specification
by specification, as the series grows.

---

# Status of This Document

This document is part of the ONP Foundation series (ONP-0000-0999).
Unlike ONP-0000, this document is normative: the principles in
Section 4 impose real, checkable constraints on every later ONP
specification. It is a Working Draft; principles MAY still be added,
sharpened, or reworded before Candidate status, but MUST NOT be
silently removed once a Companion or Extension specification has
been written in reliance on them (see Section 6.3, Deviation
Process).

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

A protocol can be technically correct and still fail to be adopted.
The ONP Working Group's early risk analysis identified three
categories of risk — technical, organizational, and adoption — and
concluded that adoption risk is the least well-addressed by
specification text alone, because nothing stops a well-intentioned
future contributor from proposing a Companion or Extension that
quietly reintroduces the exact frictions ONP was created to remove:
a mandatory migration away from a publisher's existing systems, a
sprawling set of required fields, a dependency on infrastructure a
small newsroom cannot operate, or a settlement mechanism baked into
the protocol itself.

This document exists to make those frictions structurally
impossible to reintroduce without a deliberate, visible deviation
(Section 6.3), rather than relying on every future author to
independently rediscover why they matter.

---

# 2. Scope

## 2.1 In Scope

This document defines:

* the set of cross-cutting design principles binding on every ONP
  specification;
* the structure of a Principle as a registry entry;
* the process by which a specification is checked against these
  principles, and by which a deviation is requested and recorded.

## 2.2 Out of Scope

This document does NOT define:

* the trust and identity model (see ONP-0004);
* the rejected-alternatives analysis for cryptographic vs.
  ledger-based trust, including the "why not blockchain" question
  (see ONP-0005, Security Model);
* any Object structure, field, or wire format (see the 1000 series
  onward);
* jurisdiction-specific legal interpretation of copyright, tax, or
  licensing (explicitly excluded by Principle P5, Section 4.5).

A statement made in this document about a Companion or Extension's
future content is illustrative only and does not bind that
specification's actual normative text beyond the principles stated
here.

---

# 3. Terminology

**Principle**
: A single, numbered, MUST/MUST NOT-level constraint defined in
  Section 4, binding on all present and future ONP specifications
  unless a Deviation (below) has been formally recorded against it.

**Adjacent Publishing**
: The posture, defined in Principle P1, in which ONP is deployed
  alongside a publisher's existing systems rather than replacing
  them.

**Minimal Viable Object**
: The smallest set of fields a News Object can carry and still be
  independently verifiable per Principle P2. Its exact field list is
  defined normatively in ONP-1000, not here; this document only
  constrains how small that set MUST be kept.

**Deviation**
: A formally recorded, WG-approved exception permitting a specific
  specification to violate a named Principle for a stated reason.
  See Section 6.3.

**Settlement**
: The actual execution of a payment (e.g. card processing, a
  micropayment rail, a wallet transfer), as distinct from the
  declaration of payment terms. See Principle P4.

---

# 4. Requirements

Each Principle is stated as a normative rule, followed by its
rationale. Rationale text is informative; the rule itself is
normative.

## 4.1 P1 — Adjacent Publishing (No Lock-In)

**Rule:** An ONP specification MUST NOT require a publisher to
replace, migrate away from, or exclusively adopt ONP in place of an
existing publishing system. A conforming implementation MUST be
deployable alongside a publisher's existing CMS, website, and feeds
without requiring their removal.

**Rationale:** The single largest adoption risk identified by the
Working Group is a publisher asking "why would I make my articles
easier to copy?" and finding no answer. ONP is deployed *next to* a
publisher's existing site, not *instead of* it: the publisher keeps
their CMS, their website, their existing RSS feed, and simply adds a
signed, rights-and-payment-bearing representation of the same
content. Every later specification MUST preserve this posture; a
Companion or Extension that can only function if ONP is a
publisher's sole distribution channel violates this Principle.

## 4.2 P2 — Minimal Required Surface

**Rule:** The Core Object model (ONP-1000) MUST define the smallest
possible set of REQUIRED fields sufficient to establish identity,
integrity, and verifiability. Every field beyond that minimal set
MUST be OPTIONAL at the Core layer. A Companion or Extension MUST
NOT introduce a new field that Core requires universally; if a field
is universally required, it belongs in Core's minimal set and MUST
be proposed as a Core change through ONP-0007, not smuggled in
through a Companion.

**Rationale:** Every mandatory field is integration cost. A
specification that requires twenty fields to publish one verifiable
article fails the adoption test in Section 4.7 (P7) before a
developer writes a line of code. Optionality is the default;
mandatoriness is the exception that MUST be justified.

## 4.3 P3 — Ordinary Technology

**Rule:** ONP specifications MUST prefer widely deployed, boring
technology over novel infrastructure. Concretely: object
serialization MUST be expressible in JSON (ONP-1002); transport MUST
be achievable over plain HTTPS; no specification MAY require a
publisher to operate a blockchain, run a consensus node, or depend
on a single centralized third-party service as a precondition for
publishing a valid Object. Cryptographic trust MUST be based on
signature verification, not ledger consensus (elaborated in
ONP-0005).

**Rationale:** A newsroom's engineering resources are usually small.
Every unfamiliar piece of required infrastructure is a reason not to
adopt. This Principle does not forbid ONP from *interoperating* with
novel infrastructure optionally — a transparency log, for instance,
MAY be layered on top per ONP-0004 — but it MUST NOT be required to
produce a single valid, verifiable Object.

## 4.4 P4 — Settlement Neutrality

**Rule:** An ONP specification MUST declare payment *terms* (price,
recipient, license conditions) and MUST NOT define or require a
specific payment *settlement* mechanism. The Payments Companion
(ONP-2500) defines the declarative structure only; any number of
independent Payment Providers MAY implement settlement against that
structure.

**Rationale:** Micropayment settlement is an economics problem
(transaction cost versus price), not a protocol problem, and it is
not yet solved in a universally agreed way. Binding ONP to one
settlement mechanism would bind its economic viability to that
mechanism's economics. Declaring only "this article costs €0.05,
payable to this recipient" and leaving settlement open allows
competing Payment Providers to solve the economics independently,
without requiring a protocol change if today's answer turns out to
be wrong.

## 4.5 P5 — Jurisdiction Neutrality

**Rule:** An ONP specification MUST express legal terms (copyright,
licensing, usage rights) as structured, referenceable declarations
(e.g. a license identifier, a rights statement, a pointer to
license text) and MUST NOT embed an interpretation of any
jurisdiction's copyright, tax, or licensing law into normative
protocol behavior.

**Rationale:** Copyright, VAT, and licensing law differ by country
and change over time. A protocol that hard-codes legal
interpretation becomes wrong somewhere the moment it is published.
ONP's job is to say *what* the declared terms are ("here is the
license"), not to adjudicate *how* copyright law applies ("here is
how copyright works in this jurisdiction").

## 4.6 P6 — Core Immutability Bias

**Rule:** Pressure to add a field, behavior, or requirement MUST be
resolved by proposing a new or extended Companion or Extension
specification, never by modifying Core (ONP-1000 series) to
accommodate one requester's need. A Core change MUST clear a
materially higher bar than a Companion or Extension change: it MUST
be shown to be required by essentially all conforming
implementations, not merely convenient for one class of publisher.

**Rationale:** This directly operationalizes ONP-0001's
Core/Companion/Extension separation as a governance rule, not merely
a technical one. Large publishers (wire services, national
broadcasters) will ask for fields specific to their workflows; those
requests are legitimate, but they belong in a named Companion or
Extension, per ONP-0001 Section 4.4 (the Companion vs. Extension
decision procedure), so that Core remains small, stable, and
universally implementable indefinitely.

## 4.7 P7 — Time-to-First-Object

**Rule:** A specification review MUST evaluate, as an explicit
criterion, whether a competent developer with no prior ONP
experience can produce one valid, independently verifiable News
Object within a single working session using only the specification
text, its examples, and ordinary tooling (a text editor, a
general-purpose programming language, a standard cryptographic
library). A specification that fails this criterion MUST be
simplified before advancing past Candidate status.

**Rationale:** Adoption is won or lost in the first hour. If
producing a first valid Object takes three months of integration
work, ONP has already lost to the status quo, regardless of how
sound its cryptography or rights model is. This Principle is
deliberately phrased as a review criterion rather than a technical
rule, because it constrains specification *complexity*, which
resists more precise normative phrasing.

---

# 5. Object Model

This document does not define a News Object; it defines the
structure of a **Principle** as a registry entry, since Principles
are the artifact this specification produces and later documents
reference.

A Principle entry consists of:

| Field | Required | Description |
|---|---|---|
| `id` | REQUIRED | Stable identifier, e.g. `P1`. MUST NOT be reused if a principle is withdrawn. |
| `name` | REQUIRED | Short human-readable name, e.g. "Adjacent Publishing". |
| `rule` | REQUIRED | The normative MUST/MUST NOT statement. |
| `rationale` | REQUIRED | Informative justification. Not binding, but MUST NOT be omitted — a principle without a stated rationale cannot be evaluated for deviation requests. |
| `applies_to` | REQUIRED | Which series the principle constrains. Default is "all series" unless narrowed. |
| `status` | REQUIRED | One of `active`, `deprecated`, `withdrawn`. |

The full registry of active principles is enumerated in Appendix A.

---

# 6. Processing Model

## 6.1 Specification Review Against Principles

Before an ONP specification (Foundation, Core, Companion, or
Extension) advances from Working Draft to Candidate status, the
ONP-WG MUST evaluate it against each active Principle in Appendix A
and record the result. A specification MUST NOT advance to
Candidate status while in unresolved conflict with an active
Principle, unless a Deviation has been recorded per Section 6.3.

## 6.2 Principle Precedence

Principles do not normally conflict, because each governs a
distinct concern (deployment posture, field minimality, technology
choice, settlement, jurisdiction, layering, complexity). Where an
apparent conflict arises, the following precedence applies, highest
first:

1. P1 (Adjacent Publishing) and P6 (Core Immutability Bias) — these
   protect the architecture's integrity and take precedence over
   convenience.
2. P2 (Minimal Required Surface) and P3 (Ordinary Technology) —
   these protect adoption cost.
3. P4 (Settlement Neutrality) and P5 (Jurisdiction Neutrality) —
   these protect long-term flexibility.
4. P7 (Time-to-First-Object) — a review criterion applied last,
   against the specification as a whole rather than against a single
   design decision.

## 6.3 Deviation Process

A specification MAY deviate from a named Principle only if all of
the following hold:

1. The deviation is stated explicitly in that specification's own
   Security Considerations or Requirements section, naming the
   Principle and the reason.
2. The ONP-WG has recorded the deviation in that Principle's
   registry entry (Appendix A) with a link to the specification.
3. The deviation does not conflict with a higher-precedence
   Principle per Section 6.2.

A deviation is a visible, auditable exception, not a silent
override. This is the mechanism, referenced in Section "Status of
This Document," by which this document's principles remain
enforceable without being permanently unamendable.

## 6.4 Interoperability

Principle P1 (Adjacent Publishing) is, in practice, ONP's
interoperability requirement with the legacy ecosystem: every
conforming implementation MUST be able to coexist with a publisher's
existing RSS feed, website, and CMS without requiring their removal
or modification beyond the addition of ONP-specific endpoints or
files. A specification MUST NOT assume ONP is a publisher's only
means of distribution; where a specification describes behavior that
would break if legacy channels remain active in parallel, that
specification is in violation of P1 and MUST be revised.

---

# 7. Examples

## 7.1 Correct Application of P1

```
Publisher: RegioPurmerend.nl
Existing systems: WordPress CMS, existing RSS feed, existing website
ONP deployment: adds /.well-known/onp/publisher.json,
                signs existing articles as News Objects,
                exposes them via a new /onp/ endpoint
Result: WordPress, the website, and the RSS feed are UNCHANGED.
        ONP is additive.
```

## 7.2 Incorrect Application of P1 (Rejected Design)

```
REJECTED PROPOSAL: "Publishers migrate their CMS database to the
ONP reference object store; the CMS reads articles back from ONP."

Why rejected: this makes ONP a replacement dependency rather than an
addition. If the ONP store is unavailable, the publisher's own site
breaks. This violates P1 regardless of any technical merit the
proposal has.
```

## 7.3 P2 in Practice — Minimal vs. Maximal Object

```
MINIMAL (conforms to P2):
{
  "oid": "onp:oid:...",
  "publisher": "regiopurmerend.nl",
  "signature": "...",
  "content_ref": "https://regiopurmerend.nl/artikel/123"
}

NON-CONFORMING (violates P2 if these were REQUIRED at Core level):
{
  "oid": "...", "publisher": "...", "signature": "...",
  "content_ref": "...",
  "required_seo_tags": [...],
  "required_analytics_id": "...",
  "required_ad_slot_config": {...}
}

The second example's additional fields are legitimate — but they
belong in Companions or Extensions (Analytics, Media, Rights), as
OPTIONAL additions, not as Core requirements.
```

## 7.4 Deviation Record Example

```
Principle: P3 (Ordinary Technology)
Specification: ONP-3600 (hypothetical future "Trust Transparency"
                Extension)
Deviation: Requires an append-only transparency log, which is
           additional infrastructure beyond plain HTTPS.
Justification: The deviation is OPTIONAL at the protocol level
           (per ONP-0004); a Node MAY ignore the transparency log
           entirely and still produce and verify valid Objects.
           Because the log is not required to produce a valid
           Object, the WG determined this does not violate P3's
           core intent and recorded it as a bounded, optional
           deviation rather than a rejection.
```

---

# 8. Security Considerations

The principles in this document have direct security consequences.
P3 (Ordinary Technology) deliberately narrows ONP's trust model to
signature verification rather than ledger consensus; the detailed
security rationale for that choice, including the explicit
rejection of blockchain-based trust anchoring, is analyzed in
ONP-0005 and is not repeated here. P6 (Core Immutability Bias) is
itself a security control: keeping Core small and stable reduces the
attack surface a Node's trust-critical code path must handle, since
Companions and Extensions can be selectively implemented or ignored
without affecting Core verification.

A Deviation (Section 6.3) that touches a security-relevant Principle
(P3 in particular) MUST include a security analysis in the deviating
specification's own Security Considerations section, cross-referenced
from its Appendix A entry.

---

# 9. Privacy Considerations

P2 (Minimal Required Surface) has a direct privacy benefit: because
Core fields are minimized by default, no publisher is required to
expose more personal or organizational data than the minimal
verifiable set. Personally identifying fields (author names, contact
details, payment recipient information) are pushed into OPTIONAL
Companions such as ONP-2300 (Identity) and ONP-2500 (Payments),
where their privacy implications are analyzed specifically, rather
than being unavoidable in every ONP Object regardless of a
publisher's or reader's preference.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0000, Introduction — mission, four pillars, and document
  roadmap referenced throughout.
* ONP-0001, Architecture — Core/Companion/Extension separation
  operationalized by Principle P6.
* ONP-0002, Terminology — registration process referenced by
  Principle P6 and the deviation process in Section 6.3.

## 10.2 Historical Reference

* `draft-onp-architecture-00` — the informal working draft formalized
  and superseded by ONP-0001 and ONP-0002. Retained for historical
  context only.

## 10.3 Informative References

* ONP-0004, Trust Model (forward reference — identity and trust
  anchor design referenced in Section 8).
* ONP-0005, Security Model (forward reference — rejected
  alternatives analysis, including blockchain, referenced in
  Section 8).
* ONP-0007, Versioning Policy (forward reference — governs how
  Core changes proposed under P6 are evaluated).
* ONP-1000, News Object (forward reference — defines the actual
  minimal field set constrained by P2).
* ONP-2500, Payments (forward reference — the declarative structure
  constrained by P4).

---

# Appendix A: Principles Registry

| ID | Name | Applies To | Status |
|---|---|---|---|
| P1 | Adjacent Publishing (No Lock-In) | All series | active |
| P2 | Minimal Required Surface | Core, Companion, Extension | active |
| P3 | Ordinary Technology | All series | active |
| P4 | Settlement Neutrality | Companion (Payments) | active |
| P5 | Jurisdiction Neutrality | Companion (Rights) | active |
| P6 | Core Immutability Bias | Core, Companion, Extension | active |
| P7 | Time-to-First-Object | All series (review criterion) | active |

No deviations are recorded against any Principle as of this
document's Version 0.1.0.

---

# Appendix B: Deviation Request Template

```
Deviation Request
------------------
Principle:          [P-number and name]
Specification:      [ONP-NNNN and title]
Section:             [section of the deviating specification]
Nature of deviation: [what the specification does that the
                       principle would otherwise prohibit]
Justification:       [why the deviation is necessary]
Scope of deviation:  [is it optional at the protocol level, or does
                       it bind all conforming implementations?]
Precedence check:    [confirmation that no higher-precedence
                       Principle per Section 6.2 is violated]
WG decision:         [approved / rejected, with date]
```

---
*End of Document*
