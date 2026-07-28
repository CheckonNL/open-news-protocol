Title: Open News Protocol (ONP): Analytics
Document Number: ONP-3300
Status: Working Draft
Version: 0.1.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document defines the Analytics Extension: `org.onp.analytics`.
It is deliberately narrower than its name might suggest: it declares
*how* a publisher tracks engagement with a News Object — tracking
method, third-party involvement, consent requirements, retention —
never the live metrics themselves (view counts, engagement figures).
Actual metrics change continuously and would require constant
re-signing to embed in an immutable Object, which does not fit the
Extension model at all; Section 2.2 states this explicitly as a
scoping boundary rather than a silent omission. This document is,
above all, a transparency mechanism for a privacy-sensitive practice,
not a tracking implementation.

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

The original architecture draft this series formalizes listed
"Analytics Attestation" among its anticipated future modules,
without specifying what it would actually contain. Working through
that concretely surfaces a real design tension: an *attestation* — a
periodic, signed snapshot of aggregate metrics — has exactly the
independent identity and lifecycle (published at a point in time,
superseded by a later snapshot) that would make it a Companion, not
an Extension, per the same decision test applied throughout this
series. This document does not force that concept into the Extension
shape it does not fit. Instead, it defines the part of "analytics"
that genuinely is a property of an existing Object: transparency
about how tracking works, not what the numbers currently say.

---

# 2. Scope

## 2.1 In Scope

* `tracking_method`, `third_party_trackers`, `consent_required`, and
  `retention_period` — declarative transparency fields about how
  engagement with this content is tracked;
* the one Claim Domain this Extension declares;
* the explicit architectural note on why live metrics are out of
  scope (Section 2.2) and what shape a future mechanism for them
  would need (Section 4.8).

## 2.2 Out of Scope

This document does NOT define:

* view counts, engagement metrics, or any other live, continuously-
  changing analytics data — embedding these in a signed Object would
  require re-signing on every change, which is impractical and
  inconsistent with the immutable-once-signed model every other
  document in this series relies on (ONP-1002, ONP-1003);
* a periodic "Analytics Attestation" snapshot mechanism — this would
  need independent identity and lifecycle (a new snapshot supersedes
  an old one, exactly as ONP-0006 already models for content), making
  it Companion-shaped, not Extension-shaped. It is out of scope here
  and would need its own future document, outside the current
  roadmap, if built (Section 4.8);
* legal interpretation of consent requirements under any
  jurisdiction's data protection or e-privacy law — consistent with
  Principle P5, `consent_required` is a declarative signal, not a
  compliance determination.

---

# 3. Terminology

This document introduces no new general terms beyond its namespace
and Claim Domain registration (Section 4).

---

# 4. Requirements

## 4.1 Extension Namespace Declaration

This Extension's fields MUST be carried under
`onp:extensions.org.onp.analytics`.

## 4.2 Companion-vs-Extension Classification

```
Does "Analytics" (as scoped by this document: tracking-methodology
disclosure, not live metrics) have independent identity and an
independent lifecycle, separable from the Object it describes?

- Tracking methodology (what kind of tracking applies to this
  content) is inherently a property of the Object it describes; it
  has no standalone existence a reader would reference on its own.
- NO -> Extension, for the scope this document actually covers.

(Contrast: a live-metrics snapshot, explicitly out of scope per
Section 2.2, WOULD satisfy the independent-identity test and would
need Companion treatment instead — this is precisely why this
document does not attempt to cover it.)
```

## 4.3 Content Schema

`tracking_method`, `third_party_trackers`, `consent_required`, and
`retention_period` are all OPTIONAL, under the single Claim Domain
`analytics-tracking-disclosure` (Section 4.7).

## 4.4 Tracking Method

`tracking_method`, if present, MUST be one of `"none"`,
`"aggregate-only"`, `"cookie-based"`, `"server-side"`, or
`"third-party"`.

## 4.5 Third-Party Trackers

`third_party_trackers`, if present, MUST be an array of strings
(domain names or vendor identifiers) naming third-party analytics or
advertising-technology providers involved when
`tracking_method: "third-party"` applies.

## 4.6 Consent Requirement

`consent_required`, if present, MUST be a boolean. Its absence
establishes no default assumption — unlike `indexable` (ONP-3200),
where a permissive default matched established web convention,
tracking consent carries privacy and, commonly, legal stakes closer
in kind to Rights (ONP-2400) and AI training permission (ONP-3100),
where this series consistently declines to assume a default.

## 4.7 Claim Domain

This Extension declares one Claim Domain:
`analytics-tracking-disclosure`, covering all four fields in Section
4.3. It MUST be registered in ONP-0002 alongside this document's
publication (Section 10.3).

## 4.8 Future Work: Analytics Attestation

A future mechanism for periodic, signed metric snapshots — closer to
what "Analytics Attestation" originally suggested — remains
plausible future work. Per Section 4.2's contrast, it would need
independent identity and lifecycle and would therefore be a
Companion, not an addition to this Extension. This document does not
reserve a number or namespace for it; a future proposal would follow
the ordinary Companion registration process (ONP-2000 Section 4.1) if
and when it is designed.

---

# 5. Object Model

```json
{
  "onp:extensions": {
    "org.onp.analytics": {
      "tracking_method": "'none' | 'aggregate-only' | 'cookie-based' | 'server-side' | 'third-party', OPTIONAL",
      "third_party_trackers": ["string", "..."],
      "consent_required": "boolean, OPTIONAL, no default",
      "retention_period": "string (ISO 8601 duration), OPTIONAL"
    }
  }
}
```

| Field | Claim Domain | Required |
|---|---|---|
| `tracking_method` | `analytics-tracking-disclosure` | OPTIONAL |
| `third_party_trackers` | `analytics-tracking-disclosure` | OPTIONAL |
| `consent_required` | `analytics-tracking-disclosure` | OPTIONAL, no default |
| `retention_period` | `analytics-tracking-disclosure` | OPTIONAL |

---

# 6. Processing Model

## 6.1 Consumption

A privacy-conscious client, reader tool, or browser extension MAY use
`tracking_method` and `third_party_trackers` to decide whether to
block trackers or warn a user before loading the publisher's own
rendering of the content, analogous in purpose (though not in
mechanism) to app-store-style privacy nutrition labels — an existing,
recognizable pattern this document aligns with rather than reinvents,
per Principle P3.

## 6.2 Interoperability

A Node without this Extension implemented simply does not see
tracking-methodology disclosure; the Object itself remains fully
verifiable and usable regardless. This Extension is Companion-
agnostic, exactly as ONP-3100 and ONP-3200 already are.

---

# 7. Examples

## 7.1 Aggregate-Only, No Third Parties

```json
{
  "onp:extensions": {
    "org.onp.analytics": {
      "tracking_method": "aggregate-only",
      "consent_required": false
    }
  }
}
```

## 7.2 Third-Party Tracking Disclosed

```json
{
  "onp:extensions": {
    "org.onp.analytics": {
      "tracking_method": "third-party",
      "third_party_trackers": ["example-analytics-vendor.com"],
      "consent_required": true,
      "retention_period": "P26M"
    }
  }
}
```

---

# 8. Security Considerations

Like every declarative field in this series, `tracking_method` and
its companions are publisher-asserted and not independently verified
— a publisher could under-disclose third-party tracking with no
technical mechanism in this document to detect it. This document's
value is giving publishers who want to disclose accurately a
standard, signed place to do so; it is not, and cannot be, a
technical enforcement or verification mechanism for actual tracking
behavior.

---

# 9. Privacy Considerations

This entire Extension exists in service of a privacy concern:
engagement tracking is one of the more consequential forms of data
collection tied to news consumption, revealing reading habits and
interests readers may reasonably consider sensitive. This document
deliberately does not collect or transmit any tracking data itself —
it only lets a publisher disclose, in a signed and verifiable way,
what tracking approach applies. Readers, tools, and regulators
evaluating a publisher's actual practice should treat this disclosure
as a starting point for scrutiny, not as proof of compliance; per
Section 8, nothing here is independently verified against actual
behavior.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0001, Architecture — Section 4.4, the decision test applied
  (and contrasted against the out-of-scope Companion case) in Section
  4.2.
* ONP-0003, Design Principles — Principle P3 (Ordinary Technology,
  Section 6.1) and Principle P5 (Jurisdiction Neutrality, Section
  2.2).
* ONP-1002, Serialization; ONP-1003, Digital Signatures — the
  immutable-once-signed model that motivates excluding live metrics
  (Section 2.2).
* ONP-2400, Rights; ONP-3100, AI Metadata — the no-default-assumption
  precedent Section 4.6 follows for `consent_required`.
* ONP-3000, Extension Framework — Section 4.1 (namespace
  registration), Section 4.3 (Claim Domain declaration).
* ONP-3200, Search — the permissive-default precedent Section 4.6
  explicitly does NOT follow, with the reasoning for that divergence
  stated there.

## 10.2 Informative References

* App-store-style privacy nutrition labels — the existing
  transparency-disclosure pattern this Extension's purpose aligns
  with (Section 6.1).

## 10.3 Registry Registration

As part of this document's publication, `org.onp.analytics` and
`analytics-tracking-disclosure` are registered in ONP-0002.

---

# Appendix A: Full Schema Reference

```json
{
  "onp:extensions": {
    "org.onp.analytics": {
      "tracking_method": "enum, OPTIONAL",
      "third_party_trackers": "array of strings, OPTIONAL",
      "consent_required": "boolean, OPTIONAL, no default",
      "retention_period": "string (ISO 8601 duration), OPTIONAL"
    }
  }
}
```

# Appendix B: Analytics Extension Checklist

```
[ ] Fields carried under onp:extensions.org.onp.analytics
[ ] No live metrics (view counts, engagement figures) have been
    added here — explicitly out of scope (Section 2.2)
[ ] tracking_method, if present, is one of the five recognized
    values
[ ] consent_required, if absent, is understood as undisclosed, NOT
    false (Section 4.6 — no default, unlike ONP-3200's indexable)
[ ] third_party_trackers populated whenever tracking_method is
    "third-party"
```

---
*End of Document*
