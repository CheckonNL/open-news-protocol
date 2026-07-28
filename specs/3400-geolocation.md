Title: Open News Protocol (ONP): Geolocation
Document Number: ONP-3400
Status: Working Draft
Version: 0.1.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document defines the Geolocation Extension:
`org.onp.geolocation`. It declares where a story's subject matter is
— the places an Article is *about* — not where it may be *accessed*,
which remains entirely the concern of the Rights Companion's
`territory_restrictions` (ONP-2400 Section 4.7). It reuses GeoJSON
for precise geometry rather than inventing a coordinate format, and
it supports multiple locations per Object, since a single story
frequently concerns more than one place — including, fittingly, the
four-municipality fusie-onderzoek example this series has carried
since ONP-0000.

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

Local and regional journalism is fundamentally about place, and
nothing published so far in this series lets a News Object say,
structurally, where its story happens. `onp:metadata.tags` (ONP-1005)
could carry a place name as a free-text keyword, but cannot carry
coordinates, cannot distinguish a story's primary location from one
merely mentioned in passing, and offers no basis for map-based
discovery or radius search. This document adds that, deliberately
scoped to subject-matter location only — a different concern from
access restriction, which ONP-2400 already owns.

---

# 2. Scope

## 2.1 In Scope

* `locations`: an array of place entries, each with a name and
  OPTIONAL GeoJSON geometry;
* `geo_scope`: a declared significance scope (local/regional/
  national/international);
* the one Claim Domain this Extension declares;
* the explicit boundary against Rights' `territory_restrictions`.

## 2.2 Out of Scope

This document does NOT define:

* access or redistribution territory restrictions — that remains
  entirely ONP-2400 Section 4.7's concern; this Extension never
  restricts who may view content, only describes what the content is
  about (Section 4.8);
* any content delivery, CDN routing, or geo-blocking mechanism —
  ONP declares, it does not enforce, consistent with every other
  declarative Companion and Extension in this series;
* precise geolocation of individual people (a source's location, a
  commenter's location) — a materially different and more sensitive
  concern than a story's subject-matter location, addressed, where it
  matters, by the same protective posture ONP-2600 (Sources) already
  establishes, not by this document (Section 4.9).

---

# 3. Terminology

This document introduces no new general terms beyond its namespace
and Claim Domain registration (Section 4).

---

# 4. Requirements

## 4.1 Extension Namespace Declaration

This Extension's fields MUST be carried under
`onp:extensions.org.onp.geolocation`.

## 4.2 Companion-vs-Extension Classification

```
Does "Geolocation" have independent identity and an independent
lifecycle, separable from the Object it describes?

- A story's subject-matter location is inherently a property of
  that story; it has no standalone existence a reader would
  reference independently of the Article it describes.
- NO -> Extension, consistent with every other document published
  in this series so far.
```

## 4.3 Content Schema

`locations` and `geo_scope` are both OPTIONAL, under the single Claim
Domain `geographic-subject-matter` (Section 4.7).

## 4.4 Location Entries

1. `locations`, if present, MUST be an array of objects, each with a
   REQUIRED `name` (string, human-readable place name) and an
   OPTIONAL `geometry`.
2. Each entry MAY include a `role`: `"primary"` (the story's main
   subject location) or `"mentioned"` (referenced but not the central
   subject). Absence of `role` MUST be treated as `"mentioned"` —
   the lower-emphasis default, so that a Node does not overstate a
   location's importance to the story based on an unstated field.
3. An Object MAY declare more than one `"primary"` location — a story
   may genuinely concern several places at once (Section 7.1).

## 4.5 Geometry (GeoJSON Reuse)

`geometry`, if present, MUST be a valid GeoJSON geometry object (RFC
7946) — most commonly a `Point`, but any GeoJSON geometry type MAY be
used where appropriate (e.g. a `Polygon` for a municipal boundary).
This document does not define its own coordinate format, consistent
with Principle P3.

## 4.6 Geographic Scope

`geo_scope`, if present, MUST be one of `"local"`, `"regional"`,
`"national"`, or `"international"`, describing the story's overall
geographic significance rather than any single location's own scale.

## 4.7 Claim Domain

This Extension declares one Claim Domain:
`geographic-subject-matter`. It MUST be registered in ONP-0002
alongside this document's publication (Section 10.3).

## 4.8 Boundary Against Rights' Territory Restrictions

`locations` and `geo_scope` MUST NOT be interpreted as access or
redistribution restrictions. A story's subject-matter location and
its access restrictions are independent axes: an Article about
Purmerend MAY be freely accessible worldwide, and an Article about an
international topic MAY still carry a Rights Object restricting
access to one territory. A Node MUST NOT infer one from the other.

## 4.9 Not for Individual Location Tracking

This Extension MUST NOT be used to encode a specific individual's
personal location (a source's home address, a commenter's IP-derived
location). Where a story's reporting process itself involves
location-sensitive information about a protected source, ONP-2600
Section 4.6's guidance — including the recommendation to avoid
creating a structured, distributable record at all for the most
sensitive cases — applies with at least equal force here.

---

# 5. Object Model

```json
{
  "onp:extensions": {
    "org.onp.geolocation": {
      "locations": [
        {
          "name": "string, REQUIRED",
          "geometry": "GeoJSON geometry object, OPTIONAL",
          "role": "'primary' | 'mentioned', OPTIONAL, default 'mentioned'"
        }
      ],
      "geo_scope": "'local' | 'regional' | 'national' | 'international', OPTIONAL"
    }
  }
}
```

| Field | Claim Domain | Required |
|---|---|---|
| `locations` | `geographic-subject-matter` | OPTIONAL |
| `locations[].name` | — | REQUIRED within each entry |
| `locations[].geometry` | — | OPTIONAL, GeoJSON |
| `locations[].role` | — | OPTIONAL, default `mentioned` |
| `geo_scope` | `geographic-subject-matter` | OPTIONAL |

---

# 6. Processing Model

## 6.1 Consumption

A map-based news display or a hyperlocal aggregator MAY use
`locations` to place a story geographically or filter by proximity,
and MAY use `role: "primary"` entries preferentially over
`"mentioned"` ones when a single representative location is needed
for display purposes.

## 6.2 Interoperability

A Node without this Extension implemented simply does not see
structured location data — `onp:metadata.tags` (ONP-1005) remains
available as a free-text fallback if a publisher also populated a
place name there. This Extension is Companion-agnostic, consistent
with every other Extension published so far.

---

# 7. Examples

## 7.1 The Running Fusie-Onderzoek Example, Finally Geolocated

```json
{
  "onp:extensions": {
    "org.onp.geolocation": {
      "locations": [
        { "name": "Purmerend", "role": "primary",
          "geometry": { "type": "Point", "coordinates": [4.9583, 52.5050] } },
        { "name": "Landsmeer", "role": "primary",
          "geometry": { "type": "Point", "coordinates": [4.9167, 52.4167] } },
        { "name": "Wormerland", "role": "primary",
          "geometry": { "type": "Point", "coordinates": [4.9167, 52.5000] } },
        { "name": "Oostzaan", "role": "primary",
          "geometry": { "type": "Point", "coordinates": [4.8833, 52.4500] } }
      ],
      "geo_scope": "regional"
    }
  }
}
```

Four `"primary"` locations, reflecting that the fusieonderzoek
genuinely concerns all four municipalities equally, not one principal
subject with three passing mentions.

## 7.2 Boundary Illustrated

```
Article: subject-matter location = Purmerend (locations, this doc)
Rights Object (referenced via rights_ref): no territory_restrictions
  declared -> accessible without geographic limitation

These are independent: the story being ABOUT Purmerend says nothing
about who may READ it, per Section 4.8.
```

---

# 8. Security Considerations

Like every declarative field in this series, `locations` and
`geo_scope` are publisher-asserted and not independently verified.
This document introduces no new risk beyond the general limitation
already accepted throughout: a Node treats these as claims, not
independently confirmed facts.

---

# 9. Privacy Considerations

The primary privacy consideration is the boundary Section 4.9
already states as a requirement: this Extension describes a story's
subject matter, never an individual's personal location. Publishers
SHOULD take particular care that a `"primary"` location entry with
precise `geometry` does not inadvertently pinpoint a private
individual's specific address or location when the story concerns a
person rather than a place — the same category of concern ONP-2600
already addresses for source identity, now extended to geographic
precision specifically.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* [RFC7946] Butler, H., et al., "The GeoJSON Format", RFC 7946 — the
  geometry format reused in Section 4.5.
* ONP-0001, Architecture — Section 4.4, the decision test applied in
  Section 4.2.
* ONP-0003, Design Principles — Principle P3 (Ordinary Technology),
  motivating GeoJSON reuse.
* ONP-1005, Core Metadata — `tags`, the free-text fallback noted in
  Section 6.2; this Extension is additive to it, not a replacement.
* ONP-2400, Rights — Section 4.7 (`territory_restrictions`), the
  access-restriction concept this document explicitly does not
  duplicate (Section 4.8).
* ONP-2600, Sources — Section 4.6, the protective guidance Section
  4.9 and Section 9 extend to geographic precision.
* ONP-3000, Extension Framework — Section 4.1 (namespace
  registration), Section 4.3 (Claim Domain declaration).

## 10.2 Informative References

* None beyond the normative set.

## 10.3 Registry Registration

As part of this document's publication, `org.onp.geolocation` and
`geographic-subject-matter` are registered in ONP-0002.

---

# Appendix A: Full Schema Reference

```json
{
  "onp:extensions": {
    "org.onp.geolocation": {
      "locations": [
        {
          "name": "string, REQUIRED",
          "geometry": "GeoJSON geometry object, OPTIONAL",
          "role": "enum, OPTIONAL, default 'mentioned'"
        }
      ],
      "geo_scope": "enum, OPTIONAL"
    }
  }
}
```

# Appendix B: Geolocation Extension Checklist

```
[ ] Fields carried under onp:extensions.org.onp.geolocation
[ ] Each locations[] entry has a name
[ ] geometry, if present, is valid GeoJSON (RFC 7946)
[ ] role, if absent, is treated as "mentioned," not "primary"
[ ] No access/territory restriction has been encoded here — that
    belongs to ONP-2400's rights_ref/territory_restrictions instead
[ ] No individual person's personal location has been encoded here
    (Section 4.9)
```

---
*End of Document*
