Title: Open News Protocol (ONP): AI Metadata
Document Number: ONP-3100
Status: Working Draft
Version: 0.1.1
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document defines the AI Metadata Extension:
`org.onp.ai-metadata`, the first Extension published in this series.
It covers two related but distinct concerns: disclosure of whether
and how AI was involved in producing a News Object's content, and
declaration of whether that content may be used to train AI models
or be quoted/summarized by AI agents serving end users. It declares
two Claim Domains under the mechanism ONP-3000 just established, and
it is the first document in this series to be classified an
Extension rather than a Companion — a genuinely different outcome
from the decision test applied throughout the Companion series, not
a formality.

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

ONP-0000 Section 1.1 named "AI systems cannot reliably establish
provenance" as one of the original problems ONP exists
to address. Signature and Trust Anchor resolution (ONP-1003,
ONP-0004) already solve half of that — an AI system consuming a News
Object can verify who published it. This document addresses the
other half: whether AI was involved in producing the content itself,
and whether the publisher permits that same content to be used for
training or agent-mediated consumption going forward.

---

# 2. Scope

## 2.1 In Scope

* `org.onp.ai-metadata`: fields for generation disclosure
  (`generation_method`, `model_reference`, `human_review`) and
  training/agent-use permission (`training_permitted`,
  `agent_use_permitted`, `attribution_required_for_ai_use`);
* the two Claim Domains this Extension declares;
* the explicit, acknowledged interaction question with the Rights
  Companion (ONP-2400), which ONP-3000's Claim Domain mechanism does
  not cover (Section 4.7).

## 2.2 Out of Scope

This document does NOT define:

* any technical mechanism to verify that a `generation_method`
  disclosure is accurate — like every provisional, publisher-
  asserted field in this series, it is trusted only as far as the
  publisher's own key (Section 8);
* legal interpretation of any AI regulation (e.g. the EU AI Act) or
  copyright text-and-data-mining exception — consistent with
  Principle P5, this document provides a structural signal, not a
  compliance determination;
* Extension-to-Companion conflict detection generally — ONP-3000's
  Claim Domain mechanism covers Extension-to-Extension overlap only;
  this document's Section 4.7 is a documented gap, not a solved one.

---

# 3. Terminology

This document introduces no new general terms beyond registering its
namespace and Claim Domains (Section 4).

---

# 4. Requirements

## 4.1 Extension Namespace Declaration

This Extension's fields MUST be carried under
`onp:extensions.org.onp.ai-metadata`.

## 4.2 Companion-vs-Extension Classification

```
Does "AI Metadata" have independent identity and an independent
lifecycle, separable from the Object it describes?

- AI generation disclosure and training-permission signals are
  inherently assertions ABOUT an existing Object's content. They
  cannot be meaningfully referenced or exist independently of that
  Object.
- Unlike every Companion published so far, there is no standalone
  "AI Metadata Object" a reader would ever look up on its own — it
  only makes sense attached to something else.
- NO -> Extension.
```

This is the first document in the series where the test's answer is
genuinely "no," not a formality repeated for consistency.

## 4.3 Content Schema

1. `generation_method`, `model_reference`, and `human_review` are
   OPTIONAL, under the `ai-generation-disclosure` Claim Domain
   (Section 4.5).
2. `training_permitted`, `agent_use_permitted`, and
   `attribution_required_for_ai_use` are OPTIONAL, under the
   `ai-training-permission` Claim Domain (Section 4.6).

## 4.4 Claim Domains

Per ONP-3000 Section 4.3, this Extension declares two Claim Domains:

1. `ai-generation-disclosure` — assertions about how content was
   produced.
2. `ai-training-permission` — assertions about downstream AI use of
   the content.

Both MUST be registered in ONP-0002 alongside this document's
publication (Section 10.3).

## 4.5 Generation Disclosure

1. `generation_method`, if present, MUST be one of `"human"`,
   `"ai-assisted"`, `"ai-generated"`, or
   `"ai-generated-human-edited"`.
2. Its absence MUST NOT be interpreted as `"human"` by default. Per
   the same no-default-assumption discipline ONP-2400 Section 6.2
   established for Rights, an absent `generation_method` means
   undisclosed, not human-authored.
3. `model_reference`, if present, MUST be a string naming the AI
   system involved (e.g. `"gpt-5"`, `"claude-opus-4-8"`) — informal
   and publisher-asserted, not independently verified.
4. `human_review`, if present, MUST be a boolean: whether a human
   editor reviewed AI-assisted or AI-generated content before
   publication.

## 4.6 Training and Agent-Use Permission

1. `training_permitted`, if present, MUST be a boolean: whether this
   content may be used to train AI models. Its absence establishes
   no default assumption, consistent with Principle P5 — silence is
   not consent, and this document does not assert otherwise.
2. `agent_use_permitted`, if present, MUST be a boolean: whether an
   AI agent MAY quote, summarize, or act on this content when serving
   an end user's query — a narrower, distinct question from bulk
   training permission, since a publisher MAY reasonably permit one
   without the other.
3. `attribution_required_for_ai_use`, if present, MUST be a boolean:
   whether an AI agent using this content under `agent_use_permitted`
   MUST attribute the source.
4. This document deliberately reuses the conceptual pattern of
   existing text-and-data-mining reservation conventions (e.g. the
   TDM Reservation Protocol) rather than inventing incompatible
   terminology, consistent with Principle P3.

## 4.7 Interaction with the Rights Companion (Acknowledged Gap)

1. `training_permitted` and `agent_use_permitted` MAY appear to
   overlap with, or even contradict, a Rights Object's
   `commercial_use_permitted` or `derivative_works_permitted` flags
   (ONP-2400 Section 4.5) if both are present on the same Object's
   `rights_ref` and `onp:extensions`.
2. ONP-3000's Claim Domain mechanism (Section 4.5 of that document)
   detects overlap between two Extensions; it does NOT cover overlap
   between an Extension and a Companion, since a Companion's
   assertions live in `content`, not `onp:extensions`. This is an
   acknowledged architectural gap, not a solved one — stated here
   explicitly rather than left for an implementer to discover
   independently.
3. Pending a future resolution of that gap, an Extension asserting
   `training_permitted` or `agent_use_permitted` SHOULD NOT contradict
   what the same Object's Rights Companion states, where both are
   present. Where an apparent contradiction exists, a Node SHOULD
   apply the more restrictive reading of the two as a conservative
   default — favoring the rights-holder's protection over permissive
   interpretation when a mechanical resolution is not yet defined.

---

# 5. Object Model

```json
{
  "onp:extensions": {
    "org.onp.ai-metadata": {
      "generation_method": "'human' | 'ai-assisted' | 'ai-generated' | 'ai-generated-human-edited', OPTIONAL",
      "model_reference": "string, OPTIONAL",
      "human_review": "boolean, OPTIONAL",
      "training_permitted": "boolean, OPTIONAL",
      "agent_use_permitted": "boolean, OPTIONAL",
      "attribution_required_for_ai_use": "boolean, OPTIONAL"
    }
  }
}
```

| Field | Claim Domain | Required |
|---|---|---|
| `generation_method` | `ai-generation-disclosure` | OPTIONAL |
| `model_reference` | `ai-generation-disclosure` | OPTIONAL |
| `human_review` | `ai-generation-disclosure` | OPTIONAL |
| `training_permitted` | `ai-training-permission` | OPTIONAL |
| `agent_use_permitted` | `ai-training-permission` | OPTIONAL |
| `attribution_required_for_ai_use` | `ai-training-permission` | OPTIONAL |

---

# 6. Processing Model

## 6.1 Consumption

A Node or AI system consuming a News Object SHOULD check
`onp:extensions.org.onp.ai-metadata.training_permitted` before using
that Object's content for model training, and
`agent_use_permitted`/`attribution_required_for_ai_use` before
quoting or summarizing it in an agent-mediated response, applying
Section 4.7's conservative-reading guidance where a Rights Object is
also present and appears to disagree.

## 6.2 Interoperability

A Node without this Extension implemented simply does not see AI
disclosure or permission signals — the Object itself remains fully
verifiable and usable regardless (ONP-1000 Section 4.4, rule 3). This
Extension is Companion-agnostic: it MAY attach to an Article, a
Media Object, or any future Companion's Object, since generation
method and AI-use permission are meaningful questions for any content
type, not specific to one.

---

# 7. Examples

## 7.1 AI-Assisted, Human-Reviewed, Partial AI-Use Permission

```json
{
  "onp:extensions": {
    "org.onp.ai-metadata": {
      "generation_method": "ai-assisted",
      "model_reference": "claude-opus-4-8",
      "human_review": true,
      "training_permitted": false,
      "agent_use_permitted": true,
      "attribution_required_for_ai_use": true
    }
  }
}
```

Drafting assistance was used, a human editor reviewed the result
before publication, bulk AI training is not permitted, but an AI
assistant MAY summarize the article for a user as long as it cites
RegioPurmerend as the source.

## 7.2 The Rights Interaction Scenario (Section 4.7 Worked)

```
Rights Object (referenced via rights_ref):
  commercial_use_permitted: false

AI Metadata Extension (same Object):
  agent_use_permitted: true
  (silent on whether the consuming AI agent's product is commercial)

Apparent tension: does agent_use_permitted=true override the
Rights Object's commercial_use_permitted=false if the AI agent in
question is part of a commercial product?

Per Section 4.7, rule 3: no mechanical resolution exists yet. A
Node SHOULD apply the more restrictive reading — here, treating
commercial agent use as NOT permitted despite agent_use_permitted's
bare `true`, since Rights' explicit commercial restriction is the
more specific and more conservative signal.
```

---

# 8. Security Considerations

A `generation_method` disclosure is publisher-asserted and not
independently verifiable by Core or by this Extension — a publisher
could omit or misstate AI involvement with no technical mechanism in
this document to detect it, the same limitation already accepted
throughout this series for any self-reported field (byline,
credentials, credit). This document's contribution is giving
publishers who want to disclose accurately a standard, verifiable-as-
signed place to do so, not a mechanism to compel accurate disclosure
from those who do not.

---

# 9. Privacy Considerations

`model_reference` and `human_review` typically carry no personal
data. This document introduces no new privacy mechanism beyond what
is already established elsewhere in this series.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0000, Introduction — Section 1.1, the AI-provenance problem
  this document addresses one half of.
* ONP-0001, Architecture — Section 4.4, the decision test applied in
  Section 4.2, here reaching Extension rather than Companion for the
  first time in the series.
* ONP-0003, Design Principles — Principle P3 (Ordinary Technology,
  Section 4.6, rule 4) and Principle P5 (Jurisdiction Neutrality,
  Section 2.2, Section 4.6, rule 1).
* ONP-2400, Rights — the Companion this Extension's Section 4.7
  documents an acknowledged, unresolved interaction gap with.
* ONP-3000, Extension Framework — Section 4.1 (namespace
  registration), Section 4.3 (Claim Domain declaration), Section 4.5
  (mechanical overlap detection, which Section 4.7 of this document
  notes does not extend to Companion interactions).

## 10.2 Informative References

* TDM Reservation Protocol (TDMRep) — the existing text-and-data-
  mining opt-out convention this document's training-permission
  fields are conceptually aligned with, per Principle P3.
* EU AI Act — cited as regulatory context motivating disclosure
  fields, not interpreted or relied upon as a compliance
  determination (Section 2.2).

## 10.3 Registry Registration

As part of this document's publication, `org.onp.ai-metadata`,
`ai-generation-disclosure`, and `ai-training-permission` are
registered in ONP-0002.

---

# Appendix A: Full Schema Reference

```json
{
  "onp:extensions": {
    "org.onp.ai-metadata": {
      "generation_method": "enum, OPTIONAL, no default",
      "model_reference": "string, OPTIONAL",
      "human_review": "boolean, OPTIONAL",
      "training_permitted": "boolean, OPTIONAL, no default",
      "agent_use_permitted": "boolean, OPTIONAL, no default",
      "attribution_required_for_ai_use": "boolean, OPTIONAL"
    }
  }
}
```

# Appendix B: AI Metadata Checklist

```
[ ] Fields carried under onp:extensions.org.onp.ai-metadata
[ ] generation_method, if present, is one of the four recognized
    values; if absent, understood as "undisclosed," not "human"
[ ] training_permitted / agent_use_permitted, if present, are
    booleans with no assumed default when absent
[ ] if a Rights Object is also present and appears to disagree:
    apply the more restrictive reading (Section 4.7)
[ ] no claim is made that this Extension mechanically resolves
    Rights/AI-Metadata conflicts — it does not (Section 4.7)
```

---
*End of Document*
