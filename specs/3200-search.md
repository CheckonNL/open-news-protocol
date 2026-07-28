Title: Open News Protocol (ONP): Search
Document Number: ONP-3200
Status: Working Draft
Version: 0.1.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document defines the Search Extension: `org.onp.search`. It is
deliberately narrow: an indexing-consent signal (`indexable`) and an
optional, publisher-controlled snippet for search result display
(`search_snippet`). It does not duplicate the generic discovery
fields ONP-1005 (Core Metadata) already provides, and it explicitly
declines to define any ranking, priority, or relevance signal — this
document is about whether and how content may be indexed, never
about how prominently it should rank once it is.

---

# Status of This Document

This document is part of the ONP Extension series (ONP-3000-3999).
It is directly implementable. It is a Working Draft.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

ONP-1005 already gives every News Object a Companion-agnostic
`title`, `summary`, `language`, and `tags` layer any indexer can use
without understanding a specific Companion's schema. This document
does not repeat that work. What it adds is narrower and specific to
search: an explicit, signed indexing-consent signal, and an optional
snippet a publisher may craft specifically for how their content
appears in search results, distinct from the more general-purpose
`onp:metadata.summary`.

---

# 2. Scope

## 2.1 In Scope

* `indexable`: a boolean indexing-consent signal, defaulting to
  permissive absence (Section 4.4) — a deliberate departure from
  this series' usual no-default convention, explained in Section 4.4;
* `search_snippet`: an OPTIONAL, publisher-crafted string for search
  result display;
* the one Claim Domain this Extension declares;
* its relationship to existing `robots.txt` conventions.

## 2.2 Out of Scope

This document does NOT define:

* any ranking, priority, freshness weighting, or relevance signal —
  deliberately excluded; standardizing such a signal would function
  as an SEO-manipulation surface this document has no interest in
  creating;
* a global ONP search index or resolver — consistent with the
  no-global-resolver posture ONP-1001 Section 4.6 already
  established, this document defines a consent signal an indexer MAY
  respect, not an indexing service ONP itself provides;
* any duplication of `onp:metadata`'s `title`, `summary`, `language`,
  or `tags` fields (ONP-1005) — this Extension is additive to that
  layer, not a replacement for it.

---

# 3. Terminology

This document introduces no new general terms beyond its namespace
and Claim Domain registration (Section 4).

---

# 4. Requirements

## 4.1 Extension Namespace Declaration

This Extension's fields MUST be carried under
`onp:extensions.org.onp.search`.

## 4.2 Companion-vs-Extension Classification

```
Does "Search" have independent identity and an independent
lifecycle, separable from the Object it describes?

- Indexing consent and a search snippet are inherently properties
  of an existing Object; neither has any standalone existence a
  reader would reference on its own.
- NO -> Extension, consistent with the classification ONP-3100
  (AI Metadata) already reached for a structurally similar case.
```

## 4.3 Content Schema

`indexable` and `search_snippet` are both OPTIONAL, under the single
Claim Domain `search-indexing-consent` (Section 4.5).

## 4.4 Indexing Consent — A Deliberate Default Exception

1. `indexable`, if present, MUST be a boolean.
2. Unlike `training_permitted` (ONP-3100) or Rights permission flags
   (ONP-2400), an absent `indexable` MUST be treated as `true`. This
   is a deliberate, reasoned departure from this series' usual
   no-default-assumption discipline: search indexing follows a
   long-established web convention (content is indexable unless
   explicitly excluded, mirroring `robots.txt` and `noindex`
   conventions), and the harm profile of over-permissive search
   indexing is materially different from over-permissive AI training
   or commercial rights — matching existing, well-understood practice
   (Principle P3) is judged more valuable here than the general
   caution that motivates "no default" elsewhere in this series.
3. `indexable` and `training_permitted` (ONP-3100) are independent
   signals. A Node MUST NOT infer one from the other's value — a
   publisher MAY be excluded from search indexing while still
   permitting AI training under a separate arrangement, or the
   reverse.

## 4.5 Claim Domain

This Extension declares one Claim Domain: `search-indexing-consent`,
covering both `indexable` and `search_snippet`. It MUST be registered
in ONP-0002 alongside this document's publication (Section 10.3).

## 4.6 Search Snippet

`search_snippet`, if present, MUST be a plain-text string, distinct
from `onp:metadata.summary`. A publisher MAY use it to provide
search-result-optimized phrasing without altering the more
general-purpose summary a non-search consumer would see.

## 4.7 Relationship to `robots.txt`

`indexable` operates at the level of a signed News Object, not at the
level of an HTTP endpoint. It does not replace or override a
publisher's `robots.txt` directives for conventional web crawling,
which remain a separate, HTTP-layer convention this document does not
alter. Where both exist and appear to disagree for the same content, a
Node SHOULD apply the more restrictive of the two.

---

# 5. Object Model

```json
{
  "onp:extensions": {
    "org.onp.search": {
      "indexable": "boolean, OPTIONAL, default true if absent",
      "search_snippet": "string, OPTIONAL"
    }
  }
}
```

| Field | Claim Domain | Required | Default if Absent |
|---|---|---|---|
| `indexable` | `search-indexing-consent` | OPTIONAL | `true` |
| `search_snippet` | `search-indexing-consent` | OPTIONAL | none |

---

# 6. Processing Model

## 6.1 Consumption

A search indexer or crawler consuming a News Object SHOULD check
`onp:extensions.org.onp.search.indexable` before indexing it, applying
the permissive default (Section 4.4) when absent, and MAY use
`search_snippet` in place of `onp:metadata.summary` for result display
when present.

## 6.2 Interoperability

A Node without this Extension implemented treats every Object as
indexable by the same permissive default this document itself
specifies — implementing this Extension changes what a Node can
express, not the default outcome for Nodes that do not.

---

# 7. Examples

## 7.1 Explicit Opt-Out (Paywalled Content)

```json
{
  "onp:extensions": {
    "org.onp.search": {
      "indexable": false
    }
  }
}
```

## 7.2 Custom Search Snippet

```json
{
  "onp:extensions": {
    "org.onp.search": {
      "indexable": true,
      "search_snippet": "Volledig overzicht van het fusieonderzoek tussen Purmerend, Landsmeer, Wormerland en Oostzaan, inclusief budgetanalyse."
    }
  }
}
```

---

# 8. Security Considerations

`indexable` is a declared consent signal, not an access control
mechanism (the same limitation ONP-2400 Section 4.8 already states
for Rights): a Node or crawler that ignores it can still index the
content, since ONP provides no technical enforcement of any
declaration. This document's contribution is a standard, signed place
to express the preference, not a guarantee it will be honored by
every consumer.

---

# 9. Privacy Considerations

This document defines no fields carrying personal data and introduces
no privacy impact beyond what is already established elsewhere in
this series.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0001, Architecture — Section 4.4, the decision test applied in
  Section 4.2.
* ONP-0003, Design Principles — Principle P3 (Ordinary Technology),
  motivating the permissive default in Section 4.4.
* ONP-1001, Identifiers — Section 4.6, the no-global-resolver posture
  this document's own scoping (Section 2.2) is consistent with.
* ONP-1005, Core Metadata — the generic discovery layer this
  Extension is additive to, not a replacement for.
* ONP-3000, Extension Framework — Section 4.1 (namespace
  registration), Section 4.3 (Claim Domain declaration).
* ONP-3100, AI Metadata — Section 4.2's classification precedent,
  and Section 4.4, rule 3's independence from `training_permitted`.

## 10.2 Informative References

* `robots.txt` (Robots Exclusion Protocol) — the existing web
  convention Section 4.4 and Section 4.7 align with.

## 10.3 Registry Registration

As part of this document's publication, `org.onp.search` and
`search-indexing-consent` are registered in ONP-0002.

---

# Appendix A: Full Schema Reference

```json
{
  "onp:extensions": {
    "org.onp.search": {
      "indexable": "boolean, OPTIONAL, default true",
      "search_snippet": "string, OPTIONAL"
    }
  }
}
```

# Appendix B: Search Extension Checklist

```
[ ] Fields carried under onp:extensions.org.onp.search
[ ] indexable, if absent, is understood as true (deliberate
    exception to this series' usual no-default rule, Section 4.4)
[ ] indexable is NOT inferred from training_permitted (ONP-3100) or
    vice versa — the two are independent
[ ] search_snippet, if present, is distinct from onp:metadata.summary
[ ] no ranking, priority, or relevance signal has been added here —
    that remains explicitly out of scope
[ ] robots.txt, where present, is checked alongside this signal; the
    more restrictive of the two SHOULD apply
```

---
*End of Document*
