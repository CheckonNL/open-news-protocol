Title: Open News Protocol (ONP): Introduction
Document Number: ONP-0000
Status: Working Draft
Version: 0.4.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Status of This Document

This document is part of the Open News Protocol (ONP) specification
series. It is published as an Informational document and defines no
normative wire behavior of its own. It states the problem ONP exists
to solve, ONP's mission and four pillars, and the numbering,
structure, and editorial conventions that govern every other
document in the series.

This document is a Working Draft. Distribution of this document is
unlimited. Comments should be sent to the ONP Working Group.

| Field     | Value                  |
|-----------|------------------------|
| Status    | Working Draft          |
| Version   | 0.3.2                  |
| Category  | Informational          |
| Obsoletes | None                   |
| Updates   | None                   |
| Series    | ONP-0000 (Foundation)  |

---

# Abstract

Open News Protocol (ONP) is an open standard for publishing,
exchanging, verifying, and monetizing news objects.

News today is produced inside closed systems and distributed through
channels that were never designed to carry it: publishers hold
authoritative content behind proprietary CMS databases and
publisher-specific APIs; syndication relies on formats built for
generic feeds rather than journalistic objects; and neither rights
nor payment terms travel reliably with an article once it leaves its
point of origin. ONP addresses this by making the news article
itself — not the platform that hosts it — the unit of trust,
distribution, rights, and payment. This document introduces the
problem, states ONP's mission and four pillars, and defines the
roadmap and editorial conventions that the rest of the ONP series
follows.

---

# 1. Scope

## 1.1 Problem Statement

Digital journalism operates without a shared infrastructure layer
for exchange. This produces concrete, recurring problems:

* **News is locked inside CMS platforms.** An article's authoritative
  form exists only inside one publisher's content management
  system; every consumer of that article — a reader, an aggregator,
  an AI system, an archive — receives a rendering of it, not the
  object itself.
* **Every publisher exposes a different API.** There is no common
  interface for requesting, verifying, or subscribing to journalistic
  content across publishers, which forces every integrator to build
  and maintain publisher-specific integrations.
* **RSS is too limited.** RSS carries a title, a summary, and a link;
  it carries no cryptographic provenance, no structured rights, and
  no payment terms, and it was never extended to do so.
* **ActivityPub is built for social interaction, not journalistic
  objects.** It standardizes how posts, likes, and follows move
  between servers; it does not standardize authorship verification,
  editorial versioning, licensing, or revenue terms for news content.
* **Rights and licenses are lost on republication.** Once an article
  is copied, embedded, syndicated, or summarized, the copyright
  notice, license terms, attribution requirements, and usage
  restrictions that governed the original are usually not carried
  along with it — they live in separate systems, if they are
  recorded at all.
* **AI systems cannot reliably establish provenance.** A model that
  ingests, summarizes, or cites a news article generally has no
  cryptographically verifiable way to confirm who published it, when,
  or whether it has been altered since.
* **Small and large publishers share no common standard for exchange
  or monetization.** A large publisher and a local newsroom each
  build bespoke, incompatible solutions for syndication and payment,
  which means neither benefits from network effects the way, for
  example, email or the web itself does.

These are not seven unrelated problems. They are symptoms of a
single missing layer: there is no open, verifiable, and portable
representation of a news object that carries its own trust, rights,
and payment terms independent of the platform that happens to be
distributing it. ONP is that missing layer.

## 1.2 Mission

> **Open News Protocol (ONP) is an open standard for publishing,
> exchanging, verifying and monetizing news objects.**

Every other statement in this document, and every specification
later in the series, exists in service of that one sentence.

## 1.3 The Four Pillars

ONP is organized around four pillars. Each pillar corresponds to one
of the problems in Section 1.1, and each is expanded into its own
Foundation, Core, Companion, or Extension specifications later in
the series.

### 1.3.1 Trusted News

A news object is cryptographically signed. Any recipient — a reader,
an application, a search index, an AI system — can independently
verify:

* **who** published it;
* **when** it was published;
* **whether** it has been modified since publication;
* **whether** it is authentic, without needing to trust the channel
  it arrived through.

This pillar is realized through the Core layer (ONP-1000 series):
the News Object model, identifiers, serialization, digital
signatures, and validation.

### 1.3.2 Open Distribution

A news object can be published anywhere and remains the same object
regardless of channel:

```
   Website   App   RSS   API   ActivityPub   E-mail   AI   Archive
       \      |     |     |         |           |      |    /
        \     |     |     |         |           |      |   /
         +----+-----+-----+---------+-----------+------+--+
                              |
                     Same News Object,
                     same OID, same signature,
                     verifiable regardless of channel
```

The object's identity and trust properties do not change when its
transport does. This pillar depends on the Core layer for object
identity and on Companion and Extension specifications for
channel-specific behavior; it does not require any channel to adopt
ONP exclusively.

### 1.3.3 Rights

The object itself carries:

* copyright ownership;
* license terms;
* attribution requirements;
* usage conditions;
* redistribution and derivative-work permissions.

Rights travel with the object instead of living in a separate,
disconnected database that republication silently leaves behind.
This pillar is realized primarily through the Rights Companion
(ONP-2400).

### 1.3.4 Payments

The object carries information about:

* price;
* payment model;
* revenue distribution;
* subscription terms;
* donation options;
* micropayment terms.

ONP standardizes *what* is owed and *to whom*, not *how* a payment
is executed. Settlement mechanisms (card networks, wallets,
micropayment rails) remain outside ONP's scope by design; the
Payments Companion (ONP-2500) defines the declarative terms that any
settlement mechanism can act upon.

## 1.4 The Ecosystem

ONP is designed as shared infrastructure that every kind of
participant builds on, rather than a product that competes with any
one of them:

```
                              AI
                               |
              Reader ---------+--------- Search
                               |
             Archive ----------+--------- Library
                               |
            Publisher ---------+--------- CMS
                               |
             Payments ---------+--------- Analytics
                               |
                    Open News Protocol
```

A publisher signs a News Object once. A CMS plugin, a search index,
an archive, an AI system, a payments processor, and an analytics
platform can each consume that same object and independently verify
its authenticity, rights, and payment terms, without individually
negotiating trust with the publisher or with each other.

## 1.5 What Is In Scope (This Document)

This document is in scope for:

* the problem statement, mission, and four pillars stated above;
* the document series structure (Foundation, Core, Companion
  Framework, Extensions, Reference) and its numbering scheme;
* the mandatory section template for all ONP specifications;
* the rules for normative language, terminology ownership, and
  document status;
* the dependency and reading order between documents.

## 1.6 What Is Out of Scope (This Document)

This document does NOT define:

* the News Object model (see ONP-1000);
* identifier formats (see ONP-1001);
* serialization procedures (see ONP-1002);
* signature schemes (see ONP-1003);
* validation rules (see ONP-1004);
* core metadata fields (see ONP-1005);
* Rights or Payments field structures (see ONP-2400, ONP-2500);
* any other Companion or Extension behavior (see the 2000 and 3000
  series).

A statement made in this document about protocol behavior is
illustrative only and MUST NOT be treated as normative. Where this
document appears to conflict with a Core, Companion, or Extension
specification, the more specific document governs.

---

# 2. Terminology

## 2.1 Requirements Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174] when, and only when, they appear in all
capitals, as shown here.

This requirements language governs the entire ONP series. No later
document needs to restate it; every ONP specification MUST include a
Terminology section that references this document rather than
redefining RFC 2119/8174 language independently.

## 2.2 Foundational Terms

**ONP (Open News Protocol)**
: The overall architecture, together with all specifications
  published under the ONP-nnnn identifier scheme.

**News Object**
: The unit of published journalistic content and its associated
  trust, rights, and payment metadata. Where the architecture
  reference uses the general term "Object," the ONP series uses
  "News Object" for the specific instantiation defined in ONP-1000;
  the two terms refer to the same underlying model.

**Specification**
: A single ONP-nnnn document. A Specification is the atomic unit of
  the series; it MUST be independently readable given only its
  stated dependencies.

**Series**
: A specification is a member of exactly one Series, determined by
  its identifier range (see Section 4).

**Working Group (ONP-WG)**
: The editorial body responsible for authoring, reviewing, and
  publishing ONP specifications.

**Node**
: Any software system that creates, signs, stores, verifies, or
  relays News Objects.

**Pillar**
: One of the four foundational commitments of ONP (Trusted News,
  Open Distribution, Rights, Payments) defined in Section 1.3. A
  Pillar is descriptive framing, not a normative term; it is realized
  through one or more Core, Companion, or Extension specifications.

Other terms (OID, VID, Companion, Extension, Core) are owned by
ONP-0001 (Architecture) and indexed, together with every other term
in the series, in ONP-0002 (Terminology); this document uses them
consistently with those definitions but does not itself own them.

---

# 3. Requirements

This section states the requirements that this document imposes on
the ONP series as a whole. These requirements are structural and
editorial, not protocol-level.

## 3.1 Document Identity

1. Every ONP specification MUST be stored in the repository under
   `specs/NNNN-slug.md`, where `NNNN` is the four-digit document
   number assigned according to Section 4 and `slug` is a lowercase,
   hyphenated short title (e.g. `specs/1003-signatures.md`).
2. In running text, cross-references and citations MUST use the
   form `ONP-NNNN` (e.g. "see ONP-1003"), regardless of the file's
   on-disk slug. The `ONP-NNNN` form is the stable citation
   identifier; the filename slug MAY be corrected editorially
   (per Section 3.5, a PATCH-level change) without affecting any
   `ONP-NNNN` cross-reference elsewhere in the series.
3. A specification's `NNNN` MUST NOT be reused, even if the document
   is withdrawn or obsoleted.
4. A specification MUST declare, in its front matter or document
   header, at minimum: `Document Number`, `Status`, `Version`,
   `Author`, and `Last Modified`.

Rationale: versions 0.1.0 and 0.2.0 of this document required a
`ONP-NNNN-Title.md` filename and an explicit `Category` field. Both
requirements are superseded as of version 0.3.0, in favor of the
repository layout defined by the ONP-WG (specs/, schemas/,
examples/, diagrams/, sdk/, reference/). `Category` remains
implied by a document's number range (Section 4.1) rather than
being restated as a separate field.

## 3.2 Mandatory Section Template

Every ONP specification other than this one MUST use the following
header block and section structure, in this order:

```
Title
Document Number
Status
Version
Author
Last Modified
Abstract
Status of This Document
Normative Language
1.  Introduction
2.  Scope
3.  Terminology
4.  Requirements
5.  Object Model
6.  Processing Model
7.  Examples
8.  Security Considerations
9.  Privacy Considerations
10. References
Appendix A
Appendix B
```

A specification MAY add subsections within any of these, and MAY
add further lettered appendices after Appendix B, but MUST NOT
omit, reorder, or rename any of the numbered sections above.

Note on Interoperability: this template does not carry a standalone
Interoperability section. Cross-channel and cross-implementation
interoperability concerns MUST instead be addressed as a labeled
subsection of Section 6 (Processing Model) — for example "6.x
Interoperability" — so that interoperability is discussed in the
context of the processing behavior it constrains, rather than
separately from it. This is an intentional consolidation relative
to versions 0.1.0-0.2.0 of this document, not an omission: no
specification MAY drop interoperability discussion where it is
material to that specification's correctness.

Note on Object Model vs. Processing Model: Section 5 (Object Model)
is normative structure — the fields, types, and constraints a
conforming object of that specification's domain MUST have. Section
6 (Processing Model) is normative behavior — what a conforming Node
MUST do when creating, receiving, validating, or acting on that
object. A specification MUST NOT blend structural and behavioral
requirements into a single section; this separation mirrors, at the
document level, the Core/Companion/Extension separation ONP-0001
enforces at the protocol level.

## 3.3 Normative and Informative Text

1. A specification MUST visually and structurally separate normative
   text (Requirements, Processing Rules) from informative text
   (Scope framing, rationale, examples, diagrams).
2. Rationale, motivation, and non-binding commentary SHOULD be
   placed in clearly labeled "Rationale" or "Note" blocks, not
   interleaved silently with Requirements text.
3. Examples are always informative. A Requirements section MUST NOT
   depend on an Example to be understood; the Example clarifies, it
   does not define.

## 3.4 Terminology Ownership

1. Each term used in the ONP series MUST have exactly one owning
   document.
2. A specification MUST NOT redefine a term owned by another
   specification. It MAY reference and use the term.
3. ONP-0002 (Terminology) is the canonical index of term ownership.
   Every new specification that introduces a term MUST register it
   there as part of its publication process.

## 3.5 Versioning Discipline

Every specification's `Version` field MUST follow semantic
versioning (`MAJOR.MINOR.PATCH`). The precise classification rules
for MAJOR, MINOR, and PATCH — including pre-1.0 semantics, the
registry-and-appendix worked rule, and the Status Transition process
— are owned by ONP-0007 (Versioning Policy) and are not restated
here. This section previously stated those rules informally in
versions 0.1.0 and 0.2.0 of this document; ONP-0007 now supersedes
that informal statement as the single authoritative source,
consistent with the single-owner content discipline established by
ONP-0001 and ONP-0002.

---

# 4. Processing Rules

This section describes how the document series is organized and how
a reader or implementer should traverse it.

## 4.1 Numbering Scheme

```
0000-0999   Foundation
  0000  Introduction                  (this document)
  0001  Architecture
  0002  Terminology
  0003  Design Principles
  0004  Trust Model
  0005  Security Model
  0006  News Object Lifecycle
  0007  Versioning

1000-1999   Core
  1000  News Object
  1001  Identifiers
  1002  Serialization
  1003  Digital Signatures
  1004  Validation
  1005  Core Metadata
  1006  Retrieval                     (added in v0.4.0; see note below)

2000-2999   Companion
  2000  Companion Framework
  2100  Article
  2200  Media
  2300  Identity
  2400  Rights
  2500  Payments
  2600  Sources
  2700  Corrections
  2800  Comments

3000-3999   Extension
  3000  Extension Framework
  3100  AI Metadata
  3200  Search
  3300  Analytics
  3400  Geolocation
  3500  Accessibility

9000-9999   Reference
  9000  Reference Implementation
  9001  Best Practices
  9002  Security Checklist
  9003  Performance
  9004  Migration
```

Note: this numbering scheme supersedes the version published in
ONP-0000 v0.1.0, which used a broader, domain-agnostic Companion and
Extension catalog (e.g. Messaging, Social, Commerce, Events,
Documents, IoT; Moderation, Reputation, Federation, Caching). That
catalog is withdrawn in favor of the journalism-specific list above,
which follows directly from the four pillars in Section 1.3. Numbers
already assigned above MUST NOT be reused for different topics if
withdrawn topics are reinstated later; a reinstated topic receives a
new, previously unused number.

### 4.1.1 Roadmap Extension: ONP-1006 (v0.4.0)

The Core series as originally laid out (1000-1005) answered every
question about an Object a Node already holds, but none about how a
Node holding only an OID obtains the Object, or how a consumer
learns that new Objects or Versions exist. ONP-1006 (Retrieval)
closes that gap with conventions over ordinary web technology,
operationalizing Section 7.2's channel stance rather than adding a
transport protocol. Extending a range previously described as
complete is a substantive roadmap change; per ONP-0007 Section 4.2
it is classified MINOR and, per that section's rule 4, called out
here explicitly so the version number alone does not understate it.

## 4.2 Dependency Rule

1. A specification MUST declare, in its Scope section, every other
   ONP-nnnn document it depends on.
2. A specification MUST NOT depend on a document with a higher
   number in the same Series unless that dependency is explicitly
   circular-safe and declared in both directions (this SHOULD be
   avoided entirely).
3. A Foundation document (0000-0999) MUST NOT depend on a Core,
   Companion, Extension, or Reference document.
4. A Core document (1000-1999) MUST NOT depend on a Companion,
   Extension, or Reference document.
5. A Companion document (2000-2999) MUST NOT depend on another
   Companion document's internal object state, per the Horizontal
   Invariant defined in ONP-0001 (Architecture), Section 5.3.
6. An Extension document (3000-3999) MAY depend on Core and MAY
   depend on one or more named Companions, but MUST NOT depend on
   another Extension's domain truth.

## 4.3 Reading Order

```
                 +-------------------+
                 |   ONP-0000        |
                 |   Introduction    |
                 |   (this document) |
                 +---------+---------+
                           |
                           v
                 +-------------------+
                 |  ONP-0001..0007   |
                 |  Foundation       |
                 +---------+---------+
                           |
                           v
                 +-------------------+
                 |  ONP-1000..1006   |
                 |  Core             |
                 +---------+---------+
                     |            |
                     v            v
           +-------------+  +-------------+
           | ONP-2xxx    |  | ONP-3xxx    |
           | Companions  |  | Extensions  |
           | (2100-2800) |  | (3100-3500) |
           +-------------+  +-------------+
                     \            /
                      \          /
                       v        v
                 +-------------------+
                 |  ONP-9000..9004   |
                 |  Reference        |
                 +-------------------+
```

An implementer building a Node MUST read the Foundation series and
the Core series before implementing any Companion or Extension. An
implementer building a single Companion or Extension MUST read the
Foundation series, the Core series, and only the specific Companion
or Extension document(s) relevant to their use case.

## 4.4 Status Levels

| Status | Meaning | Implementers |
|---|---|---|
| Working Draft | Under active development; MAY change incompatibly | MUST NOT treat as stable |
| Candidate | Feature-complete; open for implementation feedback | MAY implement provisionally |
| Standards Track | Stable; changes follow ONP-0007 versioning rules | MAY implement as stable |
| Informational | Non-normative; no conformance implications | N/A |
| Obsolete | Superseded; retained for historical reference only | MUST NOT implement |

## 4.5 Category

As of version 0.3.0, Category is no longer a mandatory front-matter
field (see Section 3.1). A specification's category — `foundation`,
`core`, `companion`, `extension`, or `reference` — MUST instead be
derived from its Document Number range as defined in Section 4.1.
Tooling (e.g. a documentation site generator) MAY compute and
display this category automatically from the number; a specification
MAY still state it explicitly for human readability, but the number
range is authoritative if the two ever disagree. This document's own
category is `info`, since it defines process and mission rather than
protocol, and its number (0000) falls in the Foundation range while
its content is process-only.

---

# 5. Security Considerations

This document defines no wire format, cryptographic procedure, or
trust mechanism, and therefore introduces no direct attack surface
of its own. Its editorial structure has security consequences for
the series as a whole, recorded here.

## 5.1 Terminology Drift as a Security Risk

If two ONP specifications were permitted to define the same term
differently, an implementer or auditor could reasonably validate a
News Object against the wrong definition, producing a false sense of
verification. The single-owner terminology rule in Section 3.4 is
therefore a security control, not merely an editorial preference.

## 5.2 Layer Confusion

The Core/Companion/Extension separation exists specifically so that
a party controlling a Companion or Extension — for example, the
Payments Companion or the AI Metadata Extension — cannot silently
acquire authority over Core trust properties (signature validity,
identifier assignment, version lineage). The dependency rules in
Section 4.2 enforce that separation across the document series.

## 5.3 Trust Pillar Is Foundational, Not Optional

Because Rights (1.3.3) and Payments (1.3.4) are pillars of equal
prominence to Trusted News (1.3.1) in this document's framing,
implementers MUST NOT treat rights or payment fields as more
authoritative than the Core signature that establishes whether a
News Object is authentic in the first place. A News Object with
well-formed rights or payment fields but an invalid signature MUST
be treated as untrusted regardless of how complete its other fields
are; verification order is defined normatively in ONP-1004
(Validation), not in this document.

## 5.4 Document Provenance

Implementers SHOULD verify that any ONP specification they rely upon
was obtained from the canonical Working Group publication channel.
This document does not itself define an integrity or signing scheme
for specification text; that is a process concern for the ONP-WG
publication infrastructure, out of scope for the protocol itself.

---

# 6. Privacy Considerations

This document defines no data collection, transmission, or storage
behavior, and therefore has no direct privacy impact. Two indirect
considerations are recorded for completeness.

## 6.1 Scope Boundary

This document makes no claims about what personal data News Objects
may carry. Privacy analysis of actual data fields belongs to
ONP-1005 (Core Metadata) and to each Companion and Extension that
introduces its own fields — notably ONP-2300 (Identity) and ONP-2500
(Payments), which are expected to carry personally identifiable
information by nature of their function.

## 6.2 Series-Wide Obligation

Every later ONP specification that defines a data field capable of
identifying a natural person MUST include an explicit Privacy
Considerations discussion of that field, per the mandatory section
template in Section 3.2. This document establishes that obligation;
it does not discharge it on behalf of any other document.

---

# 7. Interoperability

## 7.1 Interoperability Goal

The purpose of the numbering, dependency, and template rules in this
document is to make interoperability testable at the level of the
specification series, not only at the level of individual wire
messages. Two independent implementations that each claim
conformance to "ONP Core" should be comparable precisely because
every Core document follows the same structure and the same
terminology registry.

## 7.2 Non-Exclusivity of Channels

Per the Open Distribution pillar (1.3.2), ONP is explicitly designed
to coexist with, not replace, existing distribution channels. A News
Object MAY be carried over HTTP, RSS, ActivityPub, e-mail, or any
other transport; ONP standardizes the object, not the channel.
Publishers adopting ONP are not required to abandon any existing
distribution mechanism.

## 7.3 Backward Compatibility of This Document

This document, being purely editorial and mission-defining, has
minimal compatibility surface. A future MAJOR revision of ONP-0000
MUST NOT retroactively change the meaning of a `Category` or
`Status` value already used by a published specification without
also republishing that specification's front matter under ONP-0007's
migration rules. The withdrawal of the broader Companion/Extension
catalog noted in Section 4.1 is treated as a MINOR change because it
occurred before any specification in the withdrawn ranges reached
Candidate status or later.

## 7.4 Relationship to External Standards

ONP does not compete with or replace transport-level or web
standards; it is designed to be carried over existing infrastructure
and to interoperate with existing rights and identity standards
referenced in Section 9 and in ONP-0001 (Architecture).

---

# 8. Examples

## 8.1 Example: The Four Pillars Applied to One Article

A single published article illustrates all four pillars
simultaneously:

```json
{
  "onp:news_object": {
    "oid": "onp:oid:...",
    "signature": "...",
    "pillars_illustrated": {
      "trusted_news": "signature + publisher identity verify origin",
      "open_distribution": "same object served via website, RSS, API",
      "rights": "onp:extensions -> org.onp.rights (ONP-2400)",
      "payments": "onp:extensions -> org.onp.payments (ONP-2500)"
    }
  }
}
```

This example is illustrative only; the actual field names and
structure are normatively defined in ONP-1000 and the referenced
Companion specifications, not here.

## 8.2 Example: Resolving a Document Reference

```
Reference string : ONP-2500
File path         : specs/2500-payments.md
Series            : 2000-2999 -> Companion
Expected content  : Payments
Dependency implied: Depends on ONP-1000-1005 (Core)
Reading order     : After Foundation and Core series
```

## 8.3 Example: Correct vs. Incorrect Dependency

```
CORRECT:
  specs/3100-ai.md   (ONP-3100, Extension, 3000 series)
    depends on -> specs/1000-news-object.md   (ONP-1000)
    depends on -> specs/2100-article.md       (ONP-2100, named Companion)

INCORRECT:
  specs/1004-validation.md   (ONP-1004, Core, 1000 series)
    depends on -> specs/2500-payments.md      (ONP-2500, Companion)

  This is invalid per Section 4.2, rule 4: a Core document MUST NOT
  depend on a Companion document.
```

---

# 9. References

## 9.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0001, Architecture — defines Core, Companion, and Extension
  layering, the Vertical and Horizontal Invariants referenced
  throughout this document.
* ONP-0002, Terminology — the canonical term-ownership registry
  referenced in Section 3.4 and Section 5.1.

## 9.2 Historical Reference

* `draft-onp-architecture-00`, "Open News Protocol (ONP)
  Architecture Framework" — the informal working draft formalized
  and superseded by ONP-0001 and ONP-0002. Retained for historical
  context only.

## 9.2a Related Non-Normative Documents

* `EU-ALIGNMENT.md` — a non-normative positioning document mapping
  the four Pillars (Section 1.3) to the European Union's Open
  Internet Stack initiative. It is not part of the specification
  series, carries no RFC 2119 language, and does not bind ONP-0004,
  ONP-2300, ONP-2400, or ONP-2500; those documents state their own
  normative position when written.

## 9.3 Informative References

* W3C Decentralized Identifiers (DIDs)
* W3C ODRL Information Model
* IPTC RightsML
* JSON Canonicalization Scheme (JCS)
* RSS 2.0 Specification
* ActivityPub (W3C Recommendation)

## 9.4 Version 0.3.2 Classification

This document's front matter previously used a kramdown-rfc-style
YAML block (`title`/`abbrev`/`docname`/`ipr`/`keyword` fields),
inherited unchanged from `draft-onp-architecture-00` and never
updated once the flat `Title:`/`Document Number:`/`Status:` header
became the convention every other specification in this series uses.
This was inconsistent — this document's exemption from the mandatory
section template (Section 3.2) governs its body structure, not its
front-matter style, and nothing required keeping the old YAML form.
As of this version, the front matter matches the convention every
other document already follows; the exemption from the *section
template* remains unchanged. Classified PATCH under ONP-0007 Section
4.4, rule 2 — no meaning changed, only presentation.

---
*End of Document*
