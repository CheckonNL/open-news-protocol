Title: Open News Protocol (ONP): Performance
Document Number: ONP-9003
Status: Working Draft
Version: 0.1.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document is non-normative. It consolidates performance-relevant
guidance already scattered across the series (Trust Anchor caching,
ONP-0004 Section 6.3; high-volume Comment signing, ONP-2800 Section
8.2) and adds guidance not previously stated anywhere: computational
cost characterization of Core cryptographic operations, Algorithm
Registry caching, Object Reference resolution fan-out, and the
asymptotic behavior of Extension Claim Domain overlap detection at
scale. Nothing here is a conformance requirement — ONP defines
correctness, never speed, as a compliance criterion — but an
implementation that ignores this document's guidance will likely
work correctly and still perform poorly under real load.

---

# Status of This Document

This document is part of the ONP Reference series (ONP-9000-9999). It
is Informational and introduces no new normative requirement. It is a
Working Draft.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000. As in ONP-9001 and ONP-9002, nothing here creates a new
MUST-level obligation; SHOULD/RECOMMENDED statements are performance
guidance, never conformance criteria.

---

# 1. Introduction

Principle P7 (Time-to-First-Object, ONP-0003) is about getting
started quickly. This document is about what happens after that —
once a Node is consuming thousands of Objects a day from hundreds of
publishers, or a publisher is signing a high-volume comment section,
the same design that made a first Object easy to produce can become
a bottleneck if implemented naively. None of the guidance here changes
correctness; all of it is about doing the same correct thing
efficiently.

---

# 2. Scope

## 2.1 In Scope

* computational cost characterization of Core cryptographic
  operations and canonicalization;
* caching guidance for Trust Anchor resolution and Algorithm Registry
  lookups;
* Object Reference resolution fan-out and how to manage it;
* the asymptotic complexity of Extension Claim Domain overlap
  detection;
* high-volume Companion instance guidance (Comments);
* Object size tradeoffs already made elsewhere in the series,
  collected here for visibility.

## 2.2 Out of Scope

This document does NOT:

* specify any benchmark numbers — hardware and workload dependent,
  and would go stale quickly if fixed in specification text;
* create any performance-related conformance requirement — an
  implementation that is correct but slow remains fully conformant;
* recommend specific caching infrastructure, databases, or vendors,
  consistent with Principle P1 and P3.

---

# 3. Terminology

**Resolution Fan-out**
: The pattern by which following every Object Reference on a single
  Object can trigger many independent network resolutions, each with
  its own cost (Section 4.4).

---

# 4. Guidance

## 4.1 Computational Cost of Core Operations

Ed25519 signing and verification and SHA-256 hashing (ONP-0005
Appendix A) are both fast, well-optimized operations on essentially
any modern hardware; neither is a meaningful bottleneck at typical
newsroom publishing volumes. JCS canonicalization (ONP-1002) cost
scales with Object size, dominated in practice by an embedded Article
`body` (ONP-2100 Section 8.2). A Node verifying the same Object
repeatedly SHOULD cache the canonicalized byte form rather than
recomputing it on every access.

## 4.2 Trust Anchor Resolution Caching

Extending ONP-0004 Section 6.3's caching guidance: a Node consuming
many Objects from the same publisher SHOULD share one cached
Publisher Key Record across all of them, resolved once per cache TTL
rather than once per Object. A high-traffic aggregator resolving a
Publisher Key Record independently for every incoming Article from
the same domain is doing unnecessary, repeated work.

## 4.3 Algorithm Registry Caching

The Algorithm Registry (ONP-0005 Section 5.1) changes rarely relative
to Object volume. A Node SHOULD cache it locally with periodic
refresh (for example, daily) rather than treating every algorithm
check as requiring a fresh lookup — this was not previously addressed
when the Registry itself was defined, since ONP-0005's own scope was
the Registry's content and governance, not consumer-side caching
strategy.

## 4.4 Object Reference Resolution Fan-out

A single Article can now carry `contributor_refs`, `rights_ref`,
`payment_ref`, `source_refs`, and `corrections_ref` (ONP-2100
Sections 4.6-4.12) simultaneously. A Node that eagerly resolves every
reference on every Object it encounters, regardless of whether the
resolved content is actually needed, multiplies its network cost
substantially at scale. Two RECOMMENDED practices:

1. Resolve References lazily — only when the specific task at hand
   actually requires the referenced content (e.g. only resolve
   `rights_ref` when a user action requires checking usage terms),
   not eagerly for every Object ingested.
2. Where multiple References must be resolved for the same task,
   resolve them in parallel rather than serially — ONP-2000 Section
   4.4 already establishes that reference resolution is optional and
   non-blocking, so no ordering dependency forces serial resolution.

## 4.5 Extension Conflict Detection at Scale

ONP-3000 Section 6.1's pairwise Claim Domain overlap check is, in the
general case, quadratic in the number of Extension namespaces present
on a single Object. For the five Extensions published so far, and for
the small number typically attached to any one Object in practice,
this is not a meaningful concern. A Node anticipating a much larger
number of simultaneously-attached Extensions SHOULD pre-index Claim
Domains by namespace so overlap detection becomes a set-intersection
operation rather than a full pairwise scan — noted here for
completeness rather than because current usage patterns make it
urgent.

## 4.6 High-Volume Companion Instances (Comments)

Extending ONP-2800 Section 8.2: a popular Article's comment section,
if fully represented as individually-signed Comment Objects, can
reach volumes where per-comment, real-time signing becomes a
meaningful operational cost. Publishers using the Comments Companion
at scale SHOULD consider a periodic, batched signing workflow
(collecting comments and signing a batch on a short interval) rather
than synchronous per-comment signing, without changing the wire
format at all — each Comment Object remains independently verifiable
regardless of how its signing was operationally batched.

## 4.7 Object Size Considerations

Article's decision to embed full text (ONP-2100 Section 8.2) and
Media's decision to reference external assets instead (ONP-2200
Section 1) were both made with size in mind. For exceptionally
long-form content (extended investigative pieces), embedded body
size remains modest relative to typical network payloads generally,
but publishers producing unusually long pieces SHOULD be aware this
tradeoff exists and was made deliberately, not overlooked.

---

# 5. Object Model

Not applicable — this document defines no wire-level fields.

---

# 6. Processing Model

## 6.1 A Suggested Node Cache Architecture

Synthesizing Sections 4.2-4.4 into one coherent picture:

```
+---------------------------------------------------+
| Node                                               |
|                                                     |
|  +-----------------------+  TTL-bounded, shared     |
|  | Publisher Key Record   |  per publisher domain,  |
|  | Cache                  |  not per Object          |
|  +-----------------------+                          |
|                                                       |
|  +-----------------------+  Refreshed periodically,  |
|  | Algorithm Registry      |  not per Object          |
|  | Cache                   |                          |
|  +-----------------------+                          |
|                                                       |
|  +-----------------------+  Lazy, on-demand,        |
|  | Resolved Reference      |  parallelized when       |
|  | Cache                   |  multiple needed          |
|  +-----------------------+                          |
+---------------------------------------------------+
```

## 6.2 Interoperability

None of this document's guidance affects wire-level interoperability
— every recommendation here is about a Node's own internal
implementation strategy, invisible to any other Node it interoperates
with. A Node following none of this guidance and one following all of
it remain equally conformant and equally able to verify each other's
Objects; only their own operational cost differs.

---

# 7. Examples

## 7.1 A High-Traffic Aggregator's Caching Strategy

```
Scenario: a Node ingests thousands of Articles per day from
hundreds of publishers.

Naive approach: resolve Publisher Key Record and every Object
Reference for every ingested Article immediately.
  -> Thousands of redundant Trust Anchor resolutions per day for
     the same handful of publisher domains; most resolved
     references never actually displayed to a user.

Recommended approach (Section 4.2, 4.4):
  -> Cache Publisher Key Records per domain, refreshed on a bounded
     TTL, shared across every Article from that domain.
  -> Resolve rights_ref/payment_ref/etc. only when a user actually
     views a specific Article, not at ingestion time for the whole
     firehose.
```

---

# 8. Security Considerations

Caching aggressiveness is a direct tradeoff against revocation
responsiveness, already analyzed in ONP-0004 Section 8.3: a longer
Publisher Key Record cache TTL (Section 4.2 of this document) reduces
network load but widens the window during which a Node might accept
an Object signed with a since-revoked key. This document's performance
guidance and ONP-0004's security guidance pull in opposite directions
on this one parameter; an implementer SHOULD read both before choosing
a TTL, not this document's performance framing alone.

---

# 9. Privacy Considerations

A Node's own resolved-reference cache (Section 6.1) can, if not
invalidated on retraction, continue serving retracted content
(Source, Identity, or Comment Objects included) longer than the
retraction itself would suggest — an extension of the same
"retraction does not erase history" limitation already established
at the protocol level (ONP-0006 Section 8.3), now applying to a
well-behaved Node's own cache specifically, not merely to other
Nodes that copied an Object before retraction. A Node SHOULD
periodically re-check retraction status for cached, privacy-sensitive
References rather than trusting an indefinitely long cache lifetime
for those specifically.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0003, Design Principles — Principle P7 (Time-to-First-Object),
  the motivating concern this document extends past initial
  implementation.
* ONP-0004, Trust Model — Section 6.3 (caching, extended in Section
  4.2) and Section 8.3 (the revocation-responsiveness tradeoff
  restated in Section 8).
* ONP-0005, Security Model — Section 5.1, the Algorithm Registry
  caching guidance in Section 4.3 extends.
* ONP-0006, News Object Lifecycle — Section 8.3, the retraction
  limitation Section 9 applies to Node-side caching specifically.
* ONP-2000, Companion Framework — Section 4.4, the non-blocking
  Reference resolution property Section 4.4 of this document relies
  on for parallelization guidance.
* ONP-2100, Article — Section 8.2, the embedded-body size tradeoff
  restated in Section 4.7.
* ONP-2800, Comments — Section 8.2, the high-volume signing concern
  extended in Section 4.6.
* ONP-3000, Extension Framework — Section 6.1, the overlap check
  whose complexity Section 4.5 characterizes.

## 10.2 Informative References

* ONP-9000, Reference Implementation; ONP-9001, Best Practices;
  ONP-9002, Security Checklist — the structurally parallel documents
  in this series.

---

# Appendix A: Performance Guidance Quick Reference

```
[ ] Canonicalized bytes cached, not recomputed per verification
[ ] Publisher Key Records cached per domain, not per Object
[ ] Algorithm Registry cached locally with periodic refresh
[ ] Object References resolved lazily, only when actually needed
[ ] Multiple References for one task resolved in parallel
[ ] Extension Claim Domain overlap check pre-indexed if many
    Extensions are anticipated per Object
[ ] High-volume Comment signing considered as a batched workflow
[ ] Cache TTLs chosen with ONP-0004 Section 8.3's revocation
    tradeoff explicitly in mind, not performance alone
[ ] Cached, privacy-sensitive References periodically re-checked
    for retraction status
```

---
*End of Document*
