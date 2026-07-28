Title: Open News Protocol (ONP): Accessibility
Document Number: ONP-3500
Status: Working Draft
Version: 0.1.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document defines the Accessibility Extension:
`org.onp.accessibility`, fulfilling the promise ONP-2200 Section 4.5
made when it kept `alt_text` deliberately minimal and deferred richer
accessibility metadata here. Rather than embedding alternative
content (transcripts, captions, audio descriptions, plain-language
rewrites) directly as new field values, this Extension points to
them as properly-typed, independently verifiable Companion Objects —
an Article for a transcript or plain-language version, a Media Object
for captions or an audio-described video — reusing the existing
Companion machinery rather than introducing a second, unverified way
to carry the same kinds of content. With this document, every
Companion and Extension named in ONP-0000's original roadmap
(0000-3500) is published.

---

# Status of This Document

This document is part of the ONP Extension series (ONP-3000-3999)
and completes the original Extension roadmap (ONP-0000 Section 4.1).
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

ONP-2200 Section 4.5 gave Media a baseline `alt_text` field and
explicitly deferred anything richer to this document, to avoid
raising Media's own required-effort bar (Principle P2) while still
acknowledging that a single short string cannot serve every
accessibility need — a complex chart needs a longer description than
a photograph does; a video needs captions and, separately, an
audio-described version; an article MAY benefit from a plain-language
alternative for readers with cognitive disabilities or those reading
in a non-native language. This document supplies those, each as a
pointer to a properly-typed Object rather than a new, informally-
structured field.

---

# 2. Scope

## 2.1 In Scope

* `long_description`, `transcript_ref`, `captions_ref`,
  `audio_description_ref`, `reading_level`, and `plain_language_ref`;
* the design choice to represent alternative content as Object
  References to Media or Article Companion Objects, not as inline,
  unverified strings or URLs;
* the one Claim Domain this Extension declares, and its declared
  dependency on the Article and Media Companions.

## 2.2 Out of Scope

This document does NOT define:

* `alt_text` itself — remains owned by ONP-2200 Section 4.5;
* any specific captioning file format, transcript formatting
  convention, or readability scoring algorithm — this document points
  to where such content lives, it does not standardize the content's
  own internal format;
* any rendering or assistive-technology implementation detail.

---

# 3. Terminology

This document introduces no new general terms beyond its namespace
and Claim Domain registration (Section 4).

---

# 4. Requirements

## 4.1 Extension Namespace Declaration

This Extension's fields MUST be carried under
`onp:extensions.org.onp.accessibility`.

## 4.2 Companion-vs-Extension Classification

```
Does "Accessibility" have independent identity and an independent
lifecycle, separable from the Object it describes?

- Accessibility metadata is inherently a property of, or a set of
  pointers from, an existing Object; it has no standalone existence
  a reader would reference on its own.
- NO -> Extension, consistent with every other Extension published
  in this series.
```

## 4.3 Companion Dependency Declaration

Per ONP-3000 Section 4.2, rule 4, this Extension declares a
dependency on two Companions: ONP-2100 (Article), the target of
`transcript_ref` and `plain_language_ref`, and ONP-2200 (Media), the
target of `captions_ref` and `audio_description_ref`. It does not
depend on any other Companion.

## 4.4 Content Schema

`long_description`, `transcript_ref`, `captions_ref`,
`audio_description_ref`, `reading_level`, and `plain_language_ref`
are all OPTIONAL, under the single Claim Domain
`accessibility-alternatives` (Section 4.9).

## 4.5 Long Description

`long_description`, if present, MUST be a string: an extended
description for content too complex for a short `alt_text` alone (a
chart, an infographic, a complex diagram) — supplementary to, not a
replacement for, `alt_text` (ONP-2200 Section 4.5).

## 4.6 Transcript and Captions

1. `transcript_ref`, if present, MUST be an Object Reference (OID
   form) to an Article Companion Object (ONP-2100) containing the full
   text transcript of audio or video content.
2. `captions_ref`, if present, MUST be an Object Reference (OID form)
   to a Media Companion Object (ONP-2200) whose `asset_url` locates a
   timed captions/subtitles file, verifiable via that Companion's
   Verified Asset Reference pattern (ONP-2200 Section 4.4).
3. `audio_description_ref`, if present, MUST be an Object Reference
   (OID form) to a Media Companion Object representing an alternate,
   audio-described version of a video, for users who cannot see its
   visual content.

## 4.7 Reading Level

`reading_level`, if present, MUST be a string identifying an
established, existing readability metric and its value (e.g. a
Flesch-Kincaid grade level) rather than a newly-invented scale,
consistent with Principle P3.

## 4.8 Plain-Language Reference

`plain_language_ref`, if present, MUST be an Object Reference (OID
form) to a separate Article Companion Object containing a
plain-language version of the same story, for readers with cognitive
disabilities or those who benefit from simplified text. It MUST NOT
be treated as a correction (ONP-2700) or a new Version in the
original Article's own lineage (ONP-0006) — it is a parallel,
independently existing Object, not a supersession.

## 4.9 Claim Domain

This Extension declares one Claim Domain:
`accessibility-alternatives`, covering all six fields in Section 4.4.
It MUST be registered in ONP-0002 alongside this document's
publication (Section 10.3).

---

# 5. Object Model

```json
{
  "onp:extensions": {
    "org.onp.accessibility": {
      "long_description": "string, OPTIONAL",
      "transcript_ref": "onp:oid:..., OPTIONAL — Article Object",
      "captions_ref": "onp:oid:..., OPTIONAL — Media Object",
      "audio_description_ref": "onp:oid:..., OPTIONAL — Media Object",
      "reading_level": "string, OPTIONAL",
      "plain_language_ref": "onp:oid:..., OPTIONAL — Article Object"
    }
  }
}
```

| Field | Points To | Required |
|---|---|---|
| `long_description` | (inline string) | OPTIONAL |
| `transcript_ref` | Article Object (ONP-2100) | OPTIONAL |
| `captions_ref` | Media Object (ONP-2200) | OPTIONAL |
| `audio_description_ref` | Media Object (ONP-2200) | OPTIONAL |
| `reading_level` | (inline string) | OPTIONAL |
| `plain_language_ref` | Article Object (ONP-2100) | OPTIONAL |

---

# 6. Processing Model

## 6.1 Consumption

An assistive technology or accessibility-aware Node MAY resolve
`transcript_ref`, `captions_ref`, `audio_description_ref`, or
`plain_language_ref` using the standard Object Reference resolution
procedure (ONP-2000 Section 6.2), then process the resolved Object
through its own Companion (ONP-2100 or ONP-2200) exactly as it would
for any other Article or Media Object — no new resolution logic is
required beyond what those Companions already define.

## 6.2 Interoperability

A Node without this Extension implemented simply does not see
accessibility alternatives; the base Object (with its `alt_text`, if
any) remains fully usable regardless. This Extension is not
Companion-agnostic in the same sense as ONP-3100 through ONP-3400 —
it explicitly depends on Article and Media (Section 4.3) — but it
does not require both to be present simultaneously; a publisher MAY
populate only the fields relevant to a given Object's own content
type.

---

# 7. Examples

## 7.1 A Video with Captions and Audio Description

```json
{
  "onp:extensions": {
    "org.onp.accessibility": {
      "captions_ref": "onp:oid:regiopurmerend.nl:ondertiteling-fusie-bijeenkomst",
      "audio_description_ref": "onp:oid:regiopurmerend.nl:audiodescriptie-fusie-bijeenkomst",
      "transcript_ref": "onp:oid:regiopurmerend.nl:transcript-fusie-bijeenkomst"
    }
  }
}
```

## 7.2 A Plain-Language Version of an Article

```json
{
  "onp:extensions": {
    "org.onp.accessibility": {
      "reading_level": "Flesch-Kincaid grade 6",
      "plain_language_ref": "onp:oid:regiopurmerend.nl:fusie-onderzoek-eenvoudig"
    }
  }
}
```

The original Article keeps its own reading level implicitly higher;
`plain_language_ref` points to a genuinely separate, independently
signed Article Object with its own OID — not a Version in the same
lineage.

---

# 8. Security Considerations

Every reference field in this Extension resolves through the
standard Object Reference mechanism (ONP-2000 Section 6.2) and is
therefore subject to the same non-blocking, independently-verified
resolution rules as any other reference in this series: an
unreachable `transcript_ref` does not affect the base Object's own
Core validity, and a resolved target is verified through its own
Companion's ordinary Core validation, not granted any special trust
for being accessibility-related content.

---

# 9. Privacy Considerations

This document defines no fields carrying personal data directly.
Where a `transcript_ref` or `captions_ref` target contains spoken
content naming or otherwise identifying individuals, the referenced
Article or Media Object's own privacy considerations apply — this
Extension introduces no additional privacy mechanism beyond pointing
to that content.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0001, Architecture — Section 4.4, the decision test applied in
  Section 4.2.
* ONP-0003, Design Principles — Principle P2 (Minimal Required
  Surface, Section 1) and Principle P3 (Ordinary Technology, Section
  4.7).
* ONP-2000, Companion Framework — Section 4.3 (Object Reference
  mechanism), Section 6.2 (resolution procedure, reused in Section
  6.1).
* ONP-2100, Article; ONP-2200, Media — the Companions this Extension
  declares a dependency on (Section 4.3) and points into throughout.
* ONP-2700, Corrections — the boundary Section 4.8 draws against,
  clarifying `plain_language_ref` is not a correction.
* ONP-3000, Extension Framework — Section 4.1 (namespace
  registration), Section 4.2, rule 4 (Companion dependency
  declaration), Section 4.3 (Claim Domain declaration).

## 10.2 Informative References

* None beyond the normative set.

## 10.3 Registry Registration

As part of this document's publication, `org.onp.accessibility` and
`accessibility-alternatives` are registered in ONP-0002.

---

# Appendix A: Full Schema Reference

```json
{
  "onp:extensions": {
    "org.onp.accessibility": {
      "long_description": "string, OPTIONAL",
      "transcript_ref": "string (OID), OPTIONAL",
      "captions_ref": "string (OID), OPTIONAL",
      "audio_description_ref": "string (OID), OPTIONAL",
      "reading_level": "string, OPTIONAL",
      "plain_language_ref": "string (OID), OPTIONAL"
    }
  }
}
```

# Appendix B: Accessibility Extension Checklist

```
[ ] Fields carried under onp:extensions.org.onp.accessibility
[ ] transcript_ref and plain_language_ref, if present, point to
    Article Objects (ONP-2100), not Media Objects
[ ] captions_ref and audio_description_ref, if present, point to
    Media Objects (ONP-2200), not Article Objects
[ ] plain_language_ref target is a separate Object with its own
    OID, not a Version in the original Article's own lineage
[ ] alt_text itself remains defined on the Media Object per
    ONP-2200 — not redefined here
```

---
*End of Document*
