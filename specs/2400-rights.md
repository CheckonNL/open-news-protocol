Title: Open News Protocol (ONP): Rights
Document Number: ONP-2400
Status: Working Draft
Version: 0.1.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document defines the Rights Companion:
`content_type = "onp:companion:rights"`, fulfilling the Rights
pillar named in ONP-0000 Section 1.3.3. Every Article and Media
Object published in this series so far has carried no explicit
usage terms at all; this document closes that gap. Consistent with
Principle P5 (Jurisdiction Neutrality, ONP-0003), a Rights Object
declares what its issuer asserts — a license reference, optional
permission flags, an optional embargo date, optional territory
restrictions — and makes no claim about legal enforceability in any
jurisdiction. Consistent with Principle P3 (Ordinary Technology), it
reuses existing license identifier systems (SPDX, Creative Commons)
rather than inventing a new one. This document also confirms, and
does not re-derive, the Companion classification ONP-0001 Section
7.2 already worked through for Rights before this Companion existed
to back it up.

---

# Status of This Document

This document is part of the ONP Companion series (ONP-2000-2999).
It is directly implementable. Concurrently with its publication,
ONP-2100 (Article) and ONP-2200 (Media) are each updated with a new
OPTIONAL `rights_ref` field (Section 10.3). It is a Working Draft.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

ONP-0000 Section 1.3.3 named Rights as one of ONP's four founding
pillars: "the object contains itself: copyright; license;
attribution; conditions; no more separate databases." Every
Companion published since then — Article, Media, Identity — has had
no way to actually make that claim. This document is where the
pillar becomes an implementable Companion, not just a promise in the
mission statement.

---

# 2. Scope

## 2.1 In Scope

* the `onp:companion:rights` content schema: `license_identifier` /
  `license_url` (at least one REQUIRED), and OPTIONAL permission
  flags, embargo, and territory restriction fields;
* the precedence rule between the authoritative license reference
  and the convenience permission flags;
* the explicit statement that a Rights Object is a declaration, not
  an enforcement mechanism.

## 2.2 Out of Scope

This document does NOT define:

* any legal interpretation of copyright, licensing, or enforceability
  in any jurisdiction — per Principle P5, a Rights Object states what
  its issuer asserts, never what the law actually permits or
  requires;
* any access control, DRM, or technical enforcement mechanism — ONP
  has none; a Rights Object is checkable and verifiable, never
  self-enforcing (Section 4.8);
* payment terms — owned by the forthcoming ONP-2500 (Payments), kept
  cleanly separate: a Rights Object can exist for freely licensed
  content with no payment terms at all;
* a controlled vocabulary of license types — this document reuses
  existing external systems (SPDX, Creative Commons) rather than
  maintaining one (Section 4.4).

---

# 3. Terminology

This document is the owning specification for the following terms.

**Rights Object**
: An informal name for a News Object whose `content_type` is
  `onp:companion:rights`.

**License Reference**
: The authoritative statement of a Rights Object's license, expressed
  as `license_identifier`, `license_url`, or both (Section 4.4).

**Permission Flag**
: One of the OPTIONAL boolean convenience fields
  (`redistribution_permitted`, `attribution_required`,
  `derivative_works_permitted`, `commercial_use_permitted`), never
  authoritative over the License Reference (Section 4.5).

---

# 4. Requirements

## 4.1 content_type Declaration

Every Rights Object MUST declare `content_type` as exactly
`onp:companion:rights`.

## 4.2 Companion-vs-Extension Classification (Confirmed, Not
     Re-derived)

Per ONP-2000 Section 4.2, rule 2, this document confirms rather than
re-derives the classification: ONP-0001 Section 7.2 already applied
the decision test to Rights, as a worked example of a borderline
case, before this Companion existed:

```
"Rights is a full Companion (ONP-2400) rather than an Extension,
because a rights declaration can be independently referenced (e.g.
by a licensing marketplace) and revised on its own version lineage,
which satisfies the independent-identity test."
                                    — ONP-0001, Section 7.2
```

This document is that Companion, now published.

## 4.3 Content Schema

1. A Rights Object MUST include at least one of `license_identifier`
   or `license_url` (Section 4.4).
2. `copyright_holder`, `copyright_year`,
   `redistribution_permitted`, `attribution_required`,
   `attribution_text`, `derivative_works_permitted`,
   `commercial_use_permitted`, `embargo_until`, and
   `territory_restrictions` are all OPTIONAL, per Sections 4.5-4.7.

## 4.4 License Reference

1. `license_identifier`, if present, SHOULD use an existing external
   identifier system — an SPDX license identifier or a Creative
   Commons short code (e.g. `"CC-BY-4.0"`, `"CC0-1.0"`) — where the
   license in question is covered by one. This document MUST NOT be
   read as maintaining or endorsing its own controlled vocabulary of
   license types; it reuses existing ones, consistent with Principle
   P3.
2. `license_identifier` MAY be a custom string for a license not
   covered by an existing external system (for example,
   `"all-rights-reserved"`); in that case, `license_url` SHOULD also
   be present, pointing to the actual license text, since a custom
   identifier alone conveys no machine-checkable meaning.
3. `license_url`, if present, MUST be a well-formed URI pointing to
   the actual, human-readable license text.

## 4.5 Permission Flags Are Convenience, Never Authoritative

1. `redistribution_permitted`, `attribution_required`,
   `derivative_works_permitted`, and `commercial_use_permitted`, if
   present, MUST be booleans.
2. The License Reference (Section 4.4) MUST be treated as
   authoritative. Permission Flags are a machine-readable convenience
   summary a rights-holder MAY additionally provide; they MUST NOT be
   treated as overriding or superseding what the actual license
   (identified or linked) states.
3. A Node MUST NOT interpret an absent Permission Flag as `false`.
   Absence means "not stated as a convenience flag," not "denied." A
   Node needing a definitive answer MUST consult the License
   Reference, not assume a default from an absent flag.

## 4.6 Embargo

1. `embargo_until`, if present, MUST be an ISO 8601 timestamp: the
   time before which the rights-holder declares this content is not
   yet permitted for use or redistribution by whoever this Rights
   Object's terms apply to.
2. `embargo_until` is a declaration, not an enforcement mechanism
   (Section 4.8) — ONP provides no technical means to prevent access
   or redistribution before that time; compliance is an
   Application-level and, ultimately, a legal or contractual matter
   entirely outside this document's mechanism.

## 4.7 Territory Restrictions

`territory_restrictions`, if present, MUST be an array of strings.
Use of ISO 3166-1 alpha-2 country codes is RECOMMENDED for
machine-readability, but this document does not mandate a specific
format, since a territory restriction is itself a declared business
or contractual fact, not a legal determination this document is
positioned to formalize.

## 4.8 No Enforcement Mechanism

A Rights Object is a cryptographically verifiable declaration of
what its issuer asserts. ONP MUST NOT be implemented, described, or
relied upon as providing access control, digital rights management,
or any technical means of preventing use that contravenes a Rights
Object's terms. Enforcement, where it exists at all, happens outside
ONP entirely — through licensing agreements, legal action, or
platform-level policy — exactly as it does today without this
Companion.

---

# 5. Object Model

```json
{
  "content_type": "onp:companion:rights",
  "content": {
    "license_identifier": "string, REQUIRED unless license_url present",
    "license_url": "string (URI), REQUIRED unless license_identifier present",
    "copyright_holder": "string, OPTIONAL",
    "copyright_year": "string or integer, OPTIONAL",
    "redistribution_permitted": "boolean, OPTIONAL",
    "attribution_required": "boolean, OPTIONAL",
    "attribution_text": "string, OPTIONAL",
    "derivative_works_permitted": "boolean, OPTIONAL",
    "commercial_use_permitted": "boolean, OPTIONAL",
    "embargo_until": "string (ISO 8601), OPTIONAL",
    "territory_restrictions": ["string", "..."]
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `license_identifier` | REQUIRED unless `license_url` present | SPDX/CC preferred (Section 4.4) |
| `license_url` | REQUIRED unless `license_identifier` present | |
| `copyright_holder` | OPTIONAL | |
| `copyright_year` | OPTIONAL | |
| `redistribution_permitted` | OPTIONAL | Convenience only (Section 4.5) |
| `attribution_required` | OPTIONAL | Convenience only |
| `attribution_text` | OPTIONAL | |
| `derivative_works_permitted` | OPTIONAL | Convenience only |
| `commercial_use_permitted` | OPTIONAL | Convenience only |
| `embargo_until` | OPTIONAL | Declaration, not enforcement (Section 4.6) |
| `territory_restrictions` | OPTIONAL | ISO 3166-1 alpha-2 RECOMMENDED |

---

# 6. Processing Model

## 6.1 Resolution and Precedence

A Node resolving an Article's or Media Object's `rights_ref` follows
the standard Object Reference resolution procedure (ONP-2000 Section
6.2). Where a Rights Object's Permission Flags and its License
Reference could be read as disagreeing, the License Reference governs
(Section 4.5, rule 2).

## 6.2 Absence of a Rights Object Establishes Nothing

If an Article or Media Object carries no `rights_ref` at all, this
document does not establish any default assumption about usage
terms — neither "all rights reserved" nor "freely usable." Per
Principle P5, ONP does not encode a default legal position; what
applies in the absence of an explicit declaration is a matter for
whatever law or convention governs the specific context, entirely
outside this document's scope.

## 6.3 Interoperability

A Node without Rights Companion support simply does not see usage
terms — the Article or Media Object it references remains fully
verifiable and usable exactly as it would be for any other
unrecognized Companion (ONP-1000 Section 4.4, rule 3). A Rights-aware
Node gains the ability to check declared permissions before an
application decides how to use the content; ONP does not require
every Node to implement this Companion.

---

# 7. Examples

## 7.1 A Creative Commons Rights Object

```json
{
  "oid": "onp:oid:regiopurmerend.nl:rights-cc-by-standaard",
  "vid": "onp:vid:sha-256:MnO345-example-digest-bytes",
  "publisher": { "domain": "regiopurmerend.nl", "key_id": "onp:key:2026-07-01" },
  "signed_at": "2026-07-01T00:00:00Z",
  "signature": "onp:sig:ed25519:base64url-signature-bytes",
  "content_type": "onp:companion:rights",
  "content": {
    "license_identifier": "CC-BY-4.0",
    "copyright_holder": "RegioPurmerend",
    "copyright_year": "2026",
    "redistribution_permitted": true,
    "attribution_required": true,
    "attribution_text": "Bron: RegioPurmerend.nl"
  }
}
```

## 7.2 An All-Rights-Reserved Rights Object with Embargo

```json
{
  "content_type": "onp:companion:rights",
  "content": {
    "license_identifier": "all-rights-reserved",
    "license_url": "https://regiopurmerend.nl/gebruiksvoorwaarden",
    "copyright_holder": "RegioPurmerend",
    "redistribution_permitted": false,
    "embargo_until": "2026-08-01T06:00:00Z"
  }
}
```

## 7.3 Article Referencing a Rights Object (Anticipating ONP-2100's
     Update)

```json
{
  "content_type": "onp:companion:article",
  "content": {
    "headline": "Fusie-onderzoek Purmerend gepubliceerd",
    "rights_ref": "onp:oid:regiopurmerend.nl:rights-cc-by-standaard"
  }
}
```

---

# 8. Security Considerations

A Rights Object's authenticity rests on exactly the same guarantees
as any other Companion: it is only as trustworthy as the publisher's
own signing key (ONP-0004, ONP-1003). This document introduces no
new security property beyond what every prior Companion already
relies on. Because a Rights Object makes no enforceable claim
(Section 4.8), its compromise or forgery risk is limited to
misrepresentation of terms, not to any technical bypass of a
protection mechanism — there is no protection mechanism for a forged
Rights Object to bypass.

---

# 9. Privacy Considerations

`copyright_holder` MAY name a specific individual (a freelance
photographer or writer holding their own copyright rather than
assigning it to the publisher) rather than an organization, which is
personal data in the same limited sense already discussed for
`credit` (ONP-2200) and Identity Objects (ONP-2300). This document
introduces no new privacy mechanism beyond what those documents
already establish.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0000, Introduction — Section 1.3.3, the Rights pillar this
  document fulfills.
* ONP-0001, Architecture — Section 7.2, the worked Companion
  classification confirmed, not re-derived, in Section 4.2.
* ONP-0003, Design Principles — Principle P3 (Ordinary Technology,
  Section 4.4) and Principle P5 (Jurisdiction Neutrality, throughout
  this document, most explicitly Sections 2.2, 4.8, and 6.2).
* ONP-2000, Companion Framework — Section 4.3 (Object Reference
  mechanism), Section 4.2 (mandatory additions, followed throughout).

## 10.2 Informative References

* ONP-2100, Article; ONP-2200, Media (both updated concurrently,
  Section 10.3) — the Companions expected to carry `rights_ref`.
* ONP-2500, Payments (forward reference — kept cleanly separate,
  Section 2.2).
* SPDX License List — an external, existing identifier system
  `license_identifier` SHOULD reuse where applicable.
* Creative Commons license short codes — likewise reused rather than
  reinvented.

## 10.3 Corresponding Updates to ONP-2100 and ONP-2200

As part of this document's publication, both ONP-2100 (Article) and
ONP-2200 (Media) are updated to add `rights_ref` (OPTIONAL, a single
OID string referencing a Rights Object), following the same Object
Reference pattern already used for `contributor_refs` and
`creator_ref`. Both changes are classified MINOR (additive) under
ONP-0007 Section 4.1.

---

# Appendix A: Full Schema Reference

```json
{
  "content_type": "onp:companion:rights",
  "content": {
    "license_identifier": "string, REQUIRED unless license_url present",
    "license_url": "string (URI), REQUIRED unless license_identifier present",
    "copyright_holder": "string, OPTIONAL",
    "copyright_year": "string or integer, OPTIONAL",
    "redistribution_permitted": "boolean, OPTIONAL, convenience only",
    "attribution_required": "boolean, OPTIONAL, convenience only",
    "attribution_text": "string, OPTIONAL",
    "derivative_works_permitted": "boolean, OPTIONAL, convenience only",
    "commercial_use_permitted": "boolean, OPTIONAL, convenience only",
    "embargo_until": "string (ISO 8601), OPTIONAL, declaration not enforcement",
    "territory_restrictions": "array of strings, OPTIONAL"
  }
}
```

# Appendix B: Rights Object Checklist

```
[ ] At least one of license_identifier or license_url present
[ ] license_identifier, if present, uses SPDX/CC where applicable
[ ] Permission Flags, if any, are understood as convenience only —
    never treated as overriding the License Reference
[ ] Absent Permission Flags are treated as "unstated," not "false"
[ ] embargo_until, if present, is understood as declarative only —
    no enforcement is implied or provided
[ ] No claim of legal enforceability is made anywhere in this
    Object or its use
```

---
*End of Document*
