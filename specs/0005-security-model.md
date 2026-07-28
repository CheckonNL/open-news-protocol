Title: Open News Protocol (ONP): Security Model
Document Number: ONP-0005
Status: Working Draft
Version: 0.1.1
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document defines the security framework that every other ONP
specification's design decisions are evaluated against: an
adversary model naming who ONP defends against and what it
explicitly does not defend against, a cryptographic agility
baseline, a set of attack classes specific to ONP's layered
architecture, and the full comparative analysis — deferred from
ONP-0003 and ONP-0004 — of why ONP rejects blockchain-based and
dedicated-PKI-based trust rooting in favor of the domain-anchored
model ONP-0004 already defines. It also defines the security review
process a specification MUST pass before reaching Candidate status.

---

# Status of This Document

This document is part of the ONP Foundation series (ONP-0000-0999).
It is normative. It does not depend on ONP-0004 for its own
correctness — ONP-0004's domain-anchored Trust Model is cited here
as a worked example of a decision already made under this
framework (Section 7.1), not as a prerequisite for understanding
this document. It is a Working Draft.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

"Trust the Object, not the Messenger" (ONP-0001, Section 1) is a
security claim, and security claims require an explicit adversary
model to mean anything. A protocol that does not state who it
defends against, and who it does not, cannot be evaluated — only
believed. This document states both halves explicitly.

It also settles, once and for all, a question every reader of
ONP-0003 (Principle P3, "no blockchain") and ONP-0004 (Section 1,
"approach 2 rejected") has been told is coming: why not a
blockchain? Section 4.6 gives the full answer. The short version,
expanded there: ONP does not have the problem blockchain consensus
solves.

---

# 2. Scope

## 2.1 In Scope

* the adversary model (who ONP defends against, and the explicit
  limits of that defense);
* cryptographic agility requirements binding on the Core series;
* attack classes arising specifically from ONP's layered
  architecture (replay/freshness, downgrade, layer confusion);
* the full rejected-alternatives analysis for blockchain-based and
  dedicated-PKI-based trust rooting;
* the security review process required before Candidate status.

## 2.2 Out of Scope

This document does NOT define:

* specific signature or hash algorithms (see ONP-1003);
* the domain-anchored Trust Anchor mechanism itself (already
  normatively defined in ONP-0004; this document supplies the
  comparative rationale ONP-0004 references but does not restate
  ONP-0004's requirements);
* Object version lineage mechanics (see the forthcoming ONP-0006,
  Object Lifecycle, and ONP-1000/ONP-1001) — this document states
  the security *property* those mechanisms MUST satisfy (Section
  4.3) without defining the mechanism;
* Companion- or Extension-specific security concerns (e.g. Payments
  settlement security), which are owned by those specifications.

---

# 3. Terminology

This document is the owning specification for the following terms.

**Adversary**
: A party this document models as potentially acting against ONP's
  security properties. Section 4.1 enumerates the recognized
  Adversary classes.

**Attack Class**
: A named category of attack against ONP's layered architecture,
  distinct from an Adversary (who is attacking) — an Attack Class
  describes what technique is used (Section 4.3-4.5).

**Cryptographic Agility**
: The property that ONP does not hardcode a single mandatory
  cryptographic primitive indefinitely, but instead names algorithms
  explicitly per Object and supports controlled deprecation
  (Section 4.2).

**Downgrade Attack**
: An Attack Class in which an adversary attempts to force a Node to
  accept a weaker algorithm or Trust Anchor Type than the publisher
  actually used, typically by stripping or spoofing capability
  information (Section 4.4).

**Replay Attack (ONP-specific sense)**
: An Attack Class in which an adversary resubmits a validly signed
  but superseded version of a News Object, attempting to have a Node
  treat it as current (Section 4.3). This is distinct from replaying
  an Object for legitimate historical/archival lookup, which ONP
  MUST continue to support.

**Algorithm Registry**
: The WG-maintained list of recognized cryptographic algorithm
  identifiers and their status (Section 5.1).

**Security Review**
: The mandatory adversary-model evaluation a specification MUST
  undergo before advancing to Candidate status (Section 6.3).

**Security Advisory**
: A WG-published notice deprecating or forbidding an algorithm or
  flagging a discovered vulnerability (Section 5.2).

---

# 4. Requirements

## 4.1 Adversary Model

ONP's security properties are stated against four Adversary classes.
For each, this document states both what ONP defends against and
what it explicitly does not.

**A1 — External Network Attacker.** Can observe and manipulate
network traffic but holds no valid publisher signing key and does
not control any publisher's domain.
*Defended against:* tampering with an Object in transit (Core
signature detects modification); impersonating a publisher without
a valid key (Trust Anchor resolution, ONP-0004, fails).
*Not defended against:* traffic analysis revealing which Objects a
given Node requests (out of scope; see Section 9).

**A2 — Malicious or Compromised Relay/Node.** Forwards, caches, or
indexes Objects but is not the originating publisher.
*Defended against:* forging a new Object under another publisher's
identity (fails Trust Anchor resolution); silently modifying an
Object's content while preserving its apparent identity (breaks the
signature).
*Not defended against:* a relay refusing to forward an Object at
all (availability is out of scope for this document; see Section
2.2, mitigations belong to the Network Model in ONP-0001 Section
6.3, which already avoids requiring any single relay).

**A3 — Party with a Compromised or Stolen Publisher Key, or Domain
Control.** Has obtained a currently-valid signing key or has
compromised the publisher's HTTPS domain.
*Defended against:* Objects signed before compromise remain
verifiable via the Previous Keys / revocation mechanism (ONP-0004
Section 4.4) once the compromise is discovered and revoked.
*Not defended against:* Objects signed *during* the compromise
window, before revocation — this is the fundamental limitation
already stated plainly in ONP-0004 Section 8.1, and this document
does not soften that statement. No domain-anchored or PKI-anchored
system defends against this; only detection speed and revocation
responsiveness (ONP-0004 Section 6.3) bound the damage.

**A4 — Malicious Companion or Extension Author.** Publishes a
specification or implementation that attempts to exploit ONP's
layered architecture rather than the cryptography directly.
*Defended against:* by the Vertical and Horizontal Invariants
(ONP-0001 Sections 4.1-4.3) and the layer-confusion attack class
(Section 4.5 of this document), which together ensure a Companion
or Extension cannot acquire Core-level authority.
*Not defended against:* a Companion or Extension being adopted
despite poor design if it passes Security Review (Section 6.3)
without the reviewer identifying the flaw — this document defines
the review process, not a guarantee of its infallibility.

## 4.2 Cryptographic Agility

1. Every signed News Object MUST explicitly identify the algorithm
   used to produce its signature; a Node MUST NOT assume a default
   algorithm.
2. The Core series MUST NOT hardcode a single mandatory algorithm as
   permanently required; instead, ONP-1003 MUST define an initial
   REQUIRED baseline algorithm and a process for adding, deprecating,
   and forbidding algorithms via the Algorithm Registry (Section
   5.1), without requiring a breaking change to ONP-1003 itself for
   ordinary deprecation.
3. A Node encountering a signature algorithm not present in the
   Algorithm Registry, or present with `forbidden` status, MUST
   reject the Object's signature as invalid. A Node MUST fail
   closed, not silently ignore the unrecognized algorithm and treat
   the Object as unsigned or otherwise degrade gracefully into a
   lower-trust state without explicit local policy authorizing that
   fallback.

## 4.3 Freshness and Version Lineage (Security Property)

1. A Node MUST be able to distinguish a News Object's current
   version from a superseded version within the same lineage.
2. A Node MUST NOT present a superseded version as current when a
   newer, validly signed version is known to it.
3. This requirement is a security property that ONP-0006 (Object
   Lifecycle) and ONP-1000/ONP-1001 (Core State, Identifiers) MUST
   satisfy in their mechanism design; this document does not itself
   define version lineage mechanics. The security consequence of
   failing this property is that an adversary who can serve or cache
   an old signed version could suppress a correction or retraction
   the publisher has since issued, exploiting the fact that the old
   version's signature remains cryptographically valid on its own
   terms.

## 4.4 Downgrade Resistance

1. A Node MUST NOT select a weaker Trust Anchor Type or algorithm
   than the strongest one the publisher has actually declared,
   regardless of what a network intermediary presents.
2. Where a publisher's Publisher Key Record (ONP-0004) or Object
   metadata declares multiple supported mechanisms, a Node MUST use
   the mechanism the publisher has marked as current/preferred, and
   MUST treat an attempt to strip that declaration down to a weaker
   fallback as a validation failure, not as an acceptable
   negotiation outcome.

## 4.5 Layer Confusion (Restated as a Security Requirement)

1. A Node MUST treat a Core-level validation failure as terminal,
   regardless of how well-formed any Companion or Extension data on
   the same Object appears. This requirement is architecturally
   defined in ONP-0001 Sections 4.1 and 6.2; it is restated here as
   a binding security requirement rather than duplicated in detail.
2. A Node MUST treat a conflict between two Extensions' domain
   claims (Horizontal Invariant violation, ONP-0001 Section 5.3) as
   a validation error, and MUST NOT resolve such a conflict silently
   in favor of whichever Extension is processed first.

## 4.6 Rejected Alternative: Blockchain / Consensus-Based Trust
     Rooting

This is the full analysis referenced from ONP-0003 (Principle P3)
and ONP-0004 (Sections 1 and 8.5).

**The core technical argument.** A blockchain's consensus mechanism
exists to solve one specific problem: establishing a single, globally
agreed-upon order of events among mutually distrusting parties who
might otherwise double-spend a scarce, fungible resource. ONP has no
such resource and no such problem. A News Object's authenticity is
established by a digital signature, which is independently
verifiable by any Node without agreement from any other Node.
Ordering and scarcity are not properties ONP needs to guarantee;
adopting consensus infrastructure to solve a problem ONP does not
have would import that infrastructure's costs without its benefit.

**Four supporting arguments:**

1. **Correction hostility.** An append-only ledger with global
   consensus is deliberately expensive to amend. Journalism requires
   fast, cheap, frequent correction and retraction (ONP-0006 will
   define this as a first-class operation). A trust-rooting
   mechanism that makes correction structurally expensive works
   against the domain it serves.
2. **Latency and throughput.** Global consensus adds confirmation
   latency unsuitable for breaking-news publication cadence, where
   an Object may need to be verifiable within seconds of signing,
   not after a confirmation delay measured in minutes or longer.
3. **Privacy and erasure tension.** Public, immutable ledgers
   permanently expose whatever metadata is written to them. This sits
   in direct tension with data protection frameworks discussed in
   `EU-ALIGNMENT.md` (GDPR, Data Act) that presume some degree of
   correctability and erasability is possible; a permanent public
   record of every publication event is a harder privacy posture to
   justify than necessary.
4. **Operational burden.** Requiring publishers or Nodes to run or
   pay for blockchain infrastructure as a precondition for producing
   a valid Object directly violates Principle P3 (Ordinary
   Technology) and Principle P7 (Time-to-First-Object), both
   ONP-0003. A local government newsroom with one developer and an
   afternoon should not need to acquire tokens, run a node, or pay
   gas fees to publish a verifiable article.

**What ONP does adopt instead, and why it is not the same thing.**
ONP-0004's OPTIONAL Transparency Log (Section 4.5 of that document)
resembles ledger-based designs superficially but is explicitly
non-consensus: it is a publicly auditable append-only record with no
requirement that Nodes agree on its state to validate an Object, and
no requirement that a publisher use it at all to produce a valid
Object. It borrows the auditability benefit of a public log (as
Certificate Transparency does for TLS) without importing consensus,
ordering, or scarcity machinery ONP does not need.

## 4.7 Rejected Alternative: Dedicated Content-Signing PKI

A purpose-built Certificate Authority hierarchy specifically for ONP
content signing was considered and rejected as the primary
mechanism, for three reasons:

1. **New trusted third party.** It introduces a gatekeeper publishers
   must obtain credentials from, specifically for ONP, in tension
   with the decentralization goal stated in ONP-0000 Section 1.3.2.
2. **Adoption friction.** It duplicates work publishers have already
   done to obtain ordinary TLS certificates for their existing
   websites, without giving them anything ONP-0004's domain-anchored
   model does not already provide from that same existing
   investment — directly contrary to Principle P7.
3. **No net security gain for this problem.** WebPKI's
   domain-validated certificates already prove domain control, which
   is exactly the guarantee ONP-0004 needs. A dedicated CA hierarchy
   would prove domain control a second time through a different,
   less-deployed path, without proving anything additional.

This rejection is not absolute: a Node MAY treat an
extended-validation-style attestation from an established CA as an
additional corroborating signal, analogous to the DNS TXT
corroboration in ONP-0004 Section 4.3, but MUST NOT require it, for
the same reasons ONP-0004 keeps DNS corroboration optional.

---

# 5. Object Model

## 5.1 Algorithm Registry Entry (Illustrative)

The Algorithm Registry's authoritative, versioned form is maintained
by the ONP-WG and referenced normatively from ONP-1003. Its entry
structure:

| Field | Required | Description |
|---|---|---|
| `algorithm_id` | REQUIRED | Stable identifier, e.g. `Ed25519`. |
| `purpose` | REQUIRED | `signature` or `hash`. |
| `status` | REQUIRED | One of `required-baseline`, `recommended`, `deprecated`, `forbidden`. |
| `status_since` | REQUIRED | Date the current status took effect. |
| `advisory_ref` | OPTIONAL | Pointer to a Security Advisory (Section 5.2) if the status change was advisory-driven. |

## 5.2 Security Advisory (Illustrative)

| Field | Required | Description |
|---|---|---|
| `advisory_id` | REQUIRED | Stable identifier. |
| `affected` | REQUIRED | Algorithm(s), mechanism(s), or specification section(s) affected. |
| `severity` | REQUIRED | One of `informational`, `advisory`, `critical`. |
| `recommended_action` | REQUIRED | E.g. "migrate signing keys before DATE," "treat algorithm X as forbidden immediately." |
| `published` | REQUIRED | Publication date. |

---

# 6. Processing Model

## 6.1 Algorithm Acceptance Processing

A Node validating a signature MUST:

```
1. Read the declared algorithm_id from the Object.
2. Look up algorithm_id in the current Algorithm Registry.
3. If status is `forbidden` or algorithm_id is unrecognized:
     -> REJECT (fail closed, per Section 4.2 rule 3).
4. If status is `deprecated`:
     -> MAY accept per local policy, SHOULD warn/log.
5. If status is `required-baseline` or `recommended`:
     -> proceed with cryptographic verification.
```

## 6.2 Freshness Check Processing (Property, Not Mechanism)

Per Section 4.3, this document states only the required outcome:
given two validly signed versions of the same lineage, a Node MUST
be able to determine which is current and MUST NOT present the
superseded one as current. The mechanism (version ordering,
lineage pointers, explicit "supersedes" declarations) is normatively
defined in ONP-0006 and ONP-1000/ONP-1001; a Node's processing MUST
implement whatever mechanism those documents define in a way that
satisfies this outcome.

## 6.3 Security Review Process

Before any ONP specification advances from Working Draft to
Candidate status, in addition to the Principles review already
required by ONP-0003 Section 6.1, the ONP-WG MUST conduct a Security
Review evaluating the specification against each Adversary class in
Section 4.1: for each class, does the specification introduce a new
way for that Adversary to defeat a security property ONP otherwise
guarantees? A specification MUST NOT advance to Candidate status
with an unresolved Security Review finding, unless a Deviation is
recorded following the same process ONP-0003 Section 6.3 defines for
Principles, applied here to Security Review findings.

## 6.4 Interoperability

Cryptographic Agility (Section 4.2) must not fragment
interoperability: ONP-1003 MUST define a `required-baseline`
algorithm that every conforming Node MUST support, so that two
Nodes implementing only the mandatory minimum can always verify each
other's Objects, even as the Algorithm Registry (Section 5.1)
accumulates `recommended` alternatives over time. Agility expands
what a Node MAY additionally support; it MUST NOT be read as
license to ship a Node that supports only a non-baseline algorithm
and calls itself conformant.

---

# 7. Examples

## 7.1 ONP-0004 as a Worked Example of This Framework

ONP-0004's domain-anchored Trust Model, already published, is a
worked example of a decision made under this document's rejected-
alternatives framework:

```
Candidate mechanisms considered (ONP-0004 Section 1):
  1. Dedicated PKI      -> rejected per Section 4.7 of this document
  2. Blockchain/ledger  -> rejected per Section 4.6 of this document
  3. DNS alone          -> demoted to corroborating signal only
  4. Domain-anchored HTTPS -> adopted as REQUIRED baseline

This is cited as an example of the framework in use, not as a
dependency this document requires to be understood.
```

## 7.2 Blockchain vs. ONP — Comparative Table

| Criterion | Blockchain-rooted trust | ONP (domain-anchored + signature) |
|---|---|---|
| Problem actually solved | Double-spend / global ordering of a scarce resource | Authenticity and integrity of an independently verifiable object |
| Correction cost | High — amending an append-only consensus record is deliberately expensive | Low — a new signed version supersedes the old; see ONP-0006 |
| Confirmation latency | Consensus-dependent, often seconds to minutes | Immediate — verification is local, no confirmation wait |
| Operational cost to publish | Running/paying for ledger infrastructure | An HTTPS endpoint the publisher already operates |
| Privacy / erasure posture | Permanent public record by design | Publisher controls what is exposed; optional Transparency Log only for key changes, not content |
| Fit with Principle P7 (Time-to-First-Object) | Poor — new infrastructure required | Good — ordinary web tooling suffices |

## 7.3 Downgrade Attack, Rejected

```
Publisher declares (Publisher Key Record, ONP-0004):
  current Trust Anchor Type: domain (with eudi also configured)
Network attacker strips the eudi declaration in transit,
  presenting only a weaker, spoofed alternative.
Node behavior (per Section 4.4):
  MUST use the publisher's actually-declared preferred mechanism;
  detecting a stripped/inconsistent declaration MUST be treated as
  a validation failure, not silently downgraded.
```

## 7.4 Replay of a Superseded Version, Rejected

```
Publisher issues Version 1 of an Article, later issues a
correction as Version 2 (both validly signed).
Adversary re-serves Version 1 to a Node that has already seen
Version 2.
Required Node behavior (Section 4.3):
  the Node MUST recognize Version 1 as superseded (mechanism per
  ONP-0006) and MUST NOT present it as current, even though
  Version 1's own signature remains valid on its own terms.
```

---

# 8. Security Considerations

This document is, in its entirety, a Security Considerations
document for the ONP series; this section addresses residual risks
not otherwise covered above.

**Working Group compromise.** This document's own integrity depends
on the ONP-WG's publication channel, per ONP-0000 Section 5.3
(Document Provenance), which is not re-analyzed here. A compromised
publication channel could distribute a tampered Algorithm Registry
(Section 5.1) or a false Security Advisory (Section 5.2); this is a
process and infrastructure risk for the ONP-WG, not a protocol-level
one, and is out of scope for a wire-level defense within ONP itself.

**Reference implementation supply chain.** Vulnerabilities in a
reference implementation (ONP-9000) are outside
this document's scope; ONP-9002 (Security Checklist) addresses
implementation-level guidance.

**Residual compromise window.** As stated in Section 4.1 (Adversary
A3) and ONP-0004 Section 8.1, no mechanism in this document or in
ONP-0004 defends against Objects signed during an undetected key or
domain compromise. This is stated once more here, explicitly, so
that no later specification is written under the mistaken assumption
that ONP eliminates this risk rather than bounding it.

---

# 9. Privacy Considerations

The Algorithm Registry and Security Advisory structures (Section 5)
carry no personal data. The freshness/lineage security property
(Section 4.3) has a minor indirect privacy implication: a mechanism
that reveals which version of an Object is "current" necessarily
reveals some publication and correction timing metadata; this is
inherent to supporting corrections at all (ONP-0000 Section 1.1
identifies "corrections and retractions linked to the original" as
a design goal, not an optional feature) and is judged an acceptable
and necessary tradeoff. Detailed privacy analysis of any specific
timing metadata field belongs to whichever document defines that
field (ONP-1000, ONP-0006), not to this document.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0000, Introduction — Section 5 (Security Considerations at the
  document-series level) and Section 1.1 (correction as a named
  design goal, referenced in Section 9).
* ONP-0001, Architecture — Vertical and Horizontal Invariants,
  restated as security requirements in Section 4.5.
* ONP-0003, Design Principles — Principle P3 (Ordinary Technology)
  and Principle P7 (Time-to-First-Object), both directly motivating
  Sections 4.6 and 4.7; Section 6.1 (specification review),
  extended by Section 6.3 of this document.

## 10.2 Informative References

* ONP-0004, Trust Model — cited as a worked example (Section 7.1)
  of a decision made under this framework; not a dependency for
  understanding this document.
* `EU-ALIGNMENT.md` — cited in Section 4.6 regarding privacy/erasure
  tension with public ledgers.
* ONP-0006, Object Lifecycle (forward reference — normative
  mechanism for the freshness property in Section 4.3).
* ONP-1000, News Object; ONP-1001, Identifiers (forward references —
  version lineage mechanics).
* ONP-1003, Digital Signatures (forward reference — authoritative
  Algorithm Registry and REQUIRED baseline algorithm).
* ONP-9002, Security Checklist — implementation-
  level guidance, Reference series.
* Nakamoto, S., "Bitcoin: A Peer-to-Peer Electronic Cash System,"
  2008 — cited informatively in Section 4.6 as the canonical
  statement of the double-spend/consensus problem blockchain
  consensus mechanisms solve, which this document argues ONP does
  not have.
* Certificate Transparency (RFC 9162) — the non-consensus log design
  pattern referenced in Section 4.6 as what ONP-0004's Transparency
  Log follows instead of ledger consensus.

---

# Appendix A: Illustrative Initial Algorithm Registry

| algorithm_id | purpose | status | status_since |
|---|---|---|---|
| Ed25519 | signature | required-baseline | 2026-07-28 |
| ECDSA-P256 | signature | recommended | 2026-07-28 |
| RSA-2048 | signature | deprecated | 2026-07-28 |
| SHA-256 | hash | required-baseline | 2026-07-28 |
| SHA-1 | hash | forbidden | 2026-07-28 |
| MD5 | hash | forbidden | 2026-07-28 |

This table is illustrative of the registry's shape. Its
authoritative initial content is normatively fixed in ONP-1003, not
here.

# Appendix B: Security Review Checklist

```
For each Adversary class (Section 4.1), evaluate the specification
under review:

[ ] A1 (External Network Attacker): does the specification introduce
    any new way to tamper with or impersonate content without a
    valid key or domain control?
[ ] A2 (Malicious/Compromised Relay): does the specification give a
    relay any authority beyond forwarding/caching signed Objects?
[ ] A3 (Compromised Key/Domain): does the specification introduce a
    new mechanism whose compromise window is wider or harder to
    detect than the baseline in ONP-0004 Section 8.1?
[ ] A4 (Malicious Companion/Extension Author): does the
    specification, if it is itself a Companion or Extension, respect
    the Vertical and Horizontal Invariants (ONP-0001)? If it is a
    Foundation or Core specification, does it give any Companion or
    Extension a path to violate them?

[ ] Cryptographic Agility: if the specification touches signing or
    hashing, does it reference the Algorithm Registry (Section 5.1)
    rather than hardcoding an algorithm inline?
[ ] Freshness: if the specification touches versioning, does it
    satisfy the property in Section 4.3?
[ ] Downgrade: if the specification offers multiple mechanisms or
    algorithms, does it define which one is authoritative and
    require fail-closed behavior on ambiguity (Section 4.4)?

Outcome: PASS / FINDING (with Deviation per Section 6.3) / BLOCKED
```

---
*End of Document*
