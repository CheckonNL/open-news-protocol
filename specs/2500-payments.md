Title: Open News Protocol (ONP): Payments
Document Number: ONP-2500
Status: Working Draft
Version: 0.1.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document defines the Payments Companion:
`content_type = "onp:companion:payments"`, fulfilling the fourth and
final pillar named in ONP-0000 Section 1.3.4. It declares *what* is
owed and *to whom* — price, currency, recipient, revenue distribution
— and, per Principle P4 (Settlement Neutrality, ONP-0003), never
*how* payment is executed. No money moves through ONP itself; this
document is the binding instance that ONP-1002 Section 4.4, rule 2
anticipated when it required monetary amounts to be represented as
strings rather than JSON numbers. Like Rights (ONP-2400), a Payments
Object declares without enforcing: it names terms a Payment Provider
ecosystem MAY act upon, never a specific provider ONP requires.

---

# Status of This Document

This document is part of the ONP Companion series (ONP-2000-2999).
It is directly implementable. Concurrently with its publication,
ONP-2100 (Article) and ONP-2200 (Media) are each updated with a new
OPTIONAL `payment_ref` field (Section 10.3). It is a Working Draft.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

ONP-0000 Section 1.3.4 stated the pillar plainly: "not how paid, but
for what and to whom." ONP-0003 Principle P4 turned that into a
binding constraint before any Payments Companion existed to test it
against. ONP-1002 Section 4.4, rule 2 went further and pre-committed
this future document to a specific representational choice — money
as strings, never JSON numbers — years, in specification-time,
before this document was written. This is where all three
commitments finally meet an actual schema.

---

# 2. Scope

## 2.1 In Scope

* the `onp:companion:payments` content schema: `payment_model`,
  `price`, `currency`, `recipient_ref`, `revenue_shares`,
  `subscription_period`, `payment_provider_hint`;
* the settlement-neutrality boundary, restated as a binding
  requirement specific to this Companion;
* revenue-share declaration and its deliberately partial nature.

## 2.2 Out of Scope

This document does NOT define:

* any settlement mechanism, payment processor, card network,
  micropayment rail, or wallet protocol — per Principle P4, that
  remains entirely the concern of independent Payment Providers,
  never ONP;
* verification that revenue shares actually get paid out — a
  Payments Object is a declaration of intent, not a ledger of
  completed transactions;
* tax treatment, VAT, or any jurisdiction-specific financial
  regulation — consistent with Principle P5 (Jurisdiction
  Neutrality), applied here to money exactly as ONP-2400 applied it
  to law.

---

# 3. Terminology

This document is the owning specification for the following terms.

**Payments Object**
: An informal name for a News Object whose `content_type` is
  `onp:companion:payments`.

**Payment Model**
: The `payment_model` field: a declared category
  (`free`/`one-time`/`subscription`/`donation`/`micropayment`)
  describing the general payment posture, not a settlement mechanism.

**Revenue Share**
: A declared, partial allocation of payment proceeds to a named
  recipient, expressed as a percentage (Section 4.7).

**Payment Provider Hint**
: A non-exclusive, informational pointer to a Payment Provider known
  to support these terms (Section 4.8) — never a requirement that
  only that provider may settle.

---

# 4. Requirements

## 4.1 content_type Declaration

Every Payments Object MUST declare `content_type` as exactly
`onp:companion:payments`.

## 4.2 Companion-vs-Extension Classification

Unlike Rights (ONP-2400 Section 4.2), no prior worked example exists
for Payments; the test is applied fresh here, per ONP-0001 Section
4.4:

```
Does "Payments" have independent identity and an independent
lifecycle, separable from any Object it applies to?

- Payment terms (a subscription's price, a standing revenue-share
  agreement) commonly apply across many Articles or Media Objects
  and are updated independently of any single one of them — a price
  change does not require touching every Article that references it.
- A Payments Object can be created, revised, and retracted on its
  own lifecycle, exactly as Rights already established for a
  structurally similar case.
- YES -> Companion.
```

## 4.3 Content Schema

1. `payment_model` is REQUIRED: one of `"free"`, `"one-time"`,
   `"subscription"`, `"donation"`, `"micropayment"`.
2. `price`, `currency`, `recipient_ref`, `revenue_shares`,
   `subscription_period`, and `payment_provider_hint` are OPTIONAL,
   per Sections 4.4-4.8.

## 4.4 Payment Model and Price

1. When `payment_model` is `"free"`, `price` and `currency` SHOULD
   be absent.
2. When `price` is present, `currency` MUST also be present, and
   MUST be a well-formed ISO 4217 currency code.
3. `price` MUST be represented as a string, never a JSON number,
   per ONP-1002 Section 4.4, rule 2 — this document is the binding
   case that rule was written for.

## 4.5 Settlement Neutrality (Restated as a Binding Requirement)

A Payments Object MUST NOT specify, require, or presume a specific
settlement mechanism, payment processor, card network, micropayment
rail, or wallet protocol. It declares terms only. This restates
Principle P4 (ONP-0003) as a concrete, checkable requirement now
that an actual schema exists to hold it to.

## 4.6 Recipient Reference

1. `recipient_ref`, if present, MUST be a single Object Reference
   (ONP-2000 Section 4.3): an OID identifying an Identity Object
   (ONP-2300).
2. If `recipient_ref` is absent, the default recipient MUST be
   understood as the referencing Object's own `publisher.domain`
   (ONP-1000 Section 4.3) — the publisher is the implicit recipient
   unless a Payments Object explicitly names someone else.

## 4.7 Revenue Shares

1. `revenue_shares`, if present, MUST be an array of objects, each
   with a `recipient_ref` (Object Reference to an Identity Object)
   and a `percentage` (string, e.g. `"20.00"`, following the same
   string-encoding rationale as `price`, Section 4.4, rule 3, for
   the same precision reasons).
2. `revenue_shares` MAY be a partial specification. This document
   does NOT require declared percentages to sum to 100; a Node MUST
   NOT reject a Payments Object solely because its shares do not
   total 100. Any undeclared remainder is understood informally as
   accruing to the default recipient (Section 4.6, rule 2) unless a
   Payments Object states otherwise in a form outside this schema
   (e.g. via `onp:extensions`, forward-looking, not defined here).

## 4.8 Payment Provider Hint

`payment_provider_hint`, if present, MUST be an array of strings
(informally, domain names or identifiers of Payment Providers known
to support these declared terms). It MUST NOT be interpreted as
exclusive or exhaustive: any Payment Provider MAY act on a Payments
Object's declared terms, whether or not it is named in this field.
This field exists purely as a discovery convenience, never as a
restriction — a restriction would violate Section 4.5.

---

# 5. Object Model

```json
{
  "content_type": "onp:companion:payments",
  "content": {
    "payment_model": "'free' | 'one-time' | 'subscription' | 'donation' | 'micropayment', REQUIRED",
    "price": "string, OPTIONAL — decimal amount, never a JSON number",
    "currency": "string (ISO 4217), REQUIRED if price present",
    "recipient_ref": "onp:oid:..., OPTIONAL — default: publisher.domain",
    "revenue_shares": [
      { "recipient_ref": "onp:oid:...", "percentage": "string" }
    ],
    "subscription_period": "string (ISO 8601 duration), OPTIONAL",
    "payment_provider_hint": ["string", "..."]
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `payment_model` | REQUIRED | Section 4.4 |
| `price` | OPTIONAL | String, never a number (Section 4.4, rule 3) |
| `currency` | REQUIRED if `price` present | ISO 4217 |
| `recipient_ref` | OPTIONAL | Default: publisher.domain (Section 4.6) |
| `revenue_shares` | OPTIONAL | Partial specification permitted (Section 4.7) |
| `subscription_period` | OPTIONAL | ISO 8601 duration, e.g. `"P1M"` |
| `payment_provider_hint` | OPTIONAL | Non-exclusive discovery aid (Section 4.8) |

---

# 6. Processing Model

## 6.1 Resolution and Default Recipient

```
1. Resolve payment_ref on the referencing Article/Media Object
   (ONP-2000 Section 6.2) to obtain the Payments Object.
2. If recipient_ref is present on the Payments Object, resolve it
   to an Identity Object (Section 4.6, rule 1).
3. If recipient_ref is absent, treat the referencing Object's own
   publisher.domain as the recipient (Section 4.6, rule 2).
4. If revenue_shares is present, apply each declared share; treat
   any undeclared remainder as accruing to the default recipient
   from step 2/3 (Section 4.7, rule 2).
```

## 6.2 Interoperability

A Node without Payments Companion support simply does not see
declared terms — the Article or Media Object it references remains
fully verifiable and usable, exactly as for any unrecognized
Companion (ONP-1000 Section 4.4, rule 3). This document does not
require every Object to carry a `payment_ref`, and free content
requires no Payments Object at all (Section 4.4, rule 1's own
guidance already covers the explicit case).

---

# 7. Examples

## 7.1 A Micropayment Payments Object

```json
{
  "oid": "onp:oid:regiopurmerend.nl:payments-fusie-onderzoek",
  "vid": "onp:vid:sha-256:PqR678-example-digest-bytes",
  "publisher": { "domain": "regiopurmerend.nl", "key_id": "onp:key:2026-07-01" },
  "signed_at": "2026-07-28T10:00:00Z",
  "signature": "onp:sig:ed25519:base64url-signature-bytes",
  "content_type": "onp:companion:payments",
  "content": {
    "payment_model": "micropayment",
    "price": "0.05",
    "currency": "EUR"
  }
}
```

This is the exact "this article costs €0.05" case discussed when
Principle P4 was first motivated (ONP-0003) — now an actual,
signed, verifiable declaration.

## 7.2 Revenue Share Between Publisher and a Freelance Photographer

```json
{
  "content_type": "onp:companion:payments",
  "content": {
    "payment_model": "one-time",
    "price": "1.50",
    "currency": "EUR",
    "revenue_shares": [
      {
        "recipient_ref": "onp:oid:regiopurmerend.nl:freelance-fotograaf-jansen",
        "percentage": "20.00"
      }
    ]
  }
}
```

The remaining 80% is undeclared and accrues to the default recipient
(the publisher), per Section 6.1, step 4.

## 7.3 Subscription

```json
{
  "content_type": "onp:companion:payments",
  "content": {
    "payment_model": "subscription",
    "price": "8.00",
    "currency": "EUR",
    "subscription_period": "P1M",
    "payment_provider_hint": ["example-payment-provider.eu"]
  }
}
```

`payment_provider_hint` names one known-compatible provider; any
other Payment Provider MAY still process these terms (Section 4.8).

---

# 8. Security Considerations

No funds move through ONP itself; a Payments Object is a declaration,
not a custody or settlement event. The material risk a compromised
publisher key (ONP-0004 Section 8.1) introduces here is
*misattribution*, not theft directly through ONP: a forged Payments
Object could misstate a price or redirect a `revenue_shares` entry
toward an attacker-controlled `recipient_ref`. Because ONP itself
never moves money, the actual financial harm depends entirely on
whether some external Payment Provider acts on the forged
declaration — this document does not, and cannot, prevent that; it
only makes the declaration itself tamper-evident and attributable to
whichever key signed it (Section 8's parallel already established in
ONP-2400 Section 8 for Rights).

---

# 9. Privacy Considerations

A `recipient_ref` naming a specific individual (a freelancer paid
directly rather than through the publisher) reveals a financial
relationship between that person and the publisher, which is more
sensitive than the general personal-data considerations already
noted for Identity Objects (ONP-2300 Section 9). This document
introduces no new privacy mechanism beyond what ONP-2300 already
establishes; publishers SHOULD apply the same consent guidance
(ONP-2300 Section 4.6) when naming an individual as a payment
recipient.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* ONP-0000, Introduction — Section 1.3.4, the Payments pillar this
  document fulfills.
* ONP-0001, Architecture — Section 4.4, the decision test applied
  fresh in Section 4.2 of this document.
* ONP-0003, Design Principles — Principle P4 (Settlement Neutrality),
  restated as a binding requirement in Section 4.5; Principle P5
  (Jurisdiction Neutrality, Section 2.2).
* ONP-1002, Serialization — Section 4.4, rule 2, the money-as-string
  rule this document is the binding instance of (Section 4.4, rule
  3).
* ONP-2000, Companion Framework — Section 4.3 (Object Reference
  mechanism, used for `recipient_ref`).
* ONP-2300, Identity — the recipient representation `recipient_ref`
  and `revenue_shares` entries point to.
* ONP-2400, Rights — the structurally parallel declarative-not-
  enforcing pattern this document follows for money instead of
  permissions.

## 10.2 Informative References

* ONP-2100, Article; ONP-2200, Media (both updated concurrently,
  Section 10.3) — the Companions expected to carry `payment_ref`.
* ISO 4217 — the currency code standard `currency` reuses.
* ISO 8601 durations — the format `subscription_period` reuses.

## 10.3 Corresponding Updates to ONP-2100 and ONP-2200

As part of this document's publication, both ONP-2100 (Article) and
ONP-2200 (Media) are updated to add `payment_ref` (OPTIONAL, a
single OID string referencing a Payments Object), following the same
Object Reference pattern already established for `contributor_refs`,
`creator_ref`, and `rights_ref`. Both changes are classified MINOR
(additive) under ONP-0007 Section 4.1. This is now the third such
addition to each of those documents; readers should expect this
`_ref` convention to continue as further Companions are published.

---

# Appendix A: Full Schema Reference

```json
{
  "content_type": "onp:companion:payments",
  "content": {
    "payment_model": "enum, REQUIRED",
    "price": "string, OPTIONAL, never a JSON number",
    "currency": "string (ISO 4217), REQUIRED if price present",
    "recipient_ref": "string (OID), OPTIONAL, default publisher.domain",
    "revenue_shares": "array of {recipient_ref, percentage}, OPTIONAL, partial permitted",
    "subscription_period": "string (ISO 8601 duration), OPTIONAL",
    "payment_provider_hint": "array of strings, OPTIONAL, non-exclusive"
  }
}
```

# Appendix B: Payments Object Checklist

```
[ ] payment_model present, one of the five recognized values
[ ] if price present: currency also present, both as strings
    (price) / ISO 4217 code (currency), never JSON numbers
[ ] recipient_ref, if present, is an OID pointing to an Identity
    Object; if absent, publisher.domain is understood as recipient
[ ] revenue_shares percentages need not sum to 100
[ ] payment_provider_hint, if present, is understood as
    non-exclusive — no other provider is excluded by its presence
[ ] no settlement mechanism, processor, or rail is specified
    anywhere in this Object
```

---
*End of Document*
