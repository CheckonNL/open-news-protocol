# ONP and the European Open Internet Stack

**Type:** Positioning document (non-normative)
**Status:** Working Draft
**Last Modified:** 2026-07-30
**Related specifications:** ONP-0000 (Introduction), ONP-0003 (Design Principles)

This document is not part of the ONP specification series and
carries no RFC 2119 normative language. It exists to record, in one
citable place, why and where the Open News Protocol overlaps with
the European Union's Open Internet Stack (OIS) initiative, so that
later specifications can be written with that alignment in mind
rather than retrofitted to it.

---

## 1. What the Open Internet Stack Is

The Open Internet Stack is the strategic successor to the EU's Next
Generation Internet (NGI) initiative. Backed by Horizon Europe
funding, it is described by its coordinating body as a shift from
research and experimentation toward "readily deployable,
interoperable digital solutions," with open-source building blocks
spanning digital identity, cybersecurity, decentralized platforms,
and regulatory compliance, intended to reduce Europe's reliance on
proprietary technology [NGI-2025]. It is now formal EU policy: the
European Commission's Open Source Strategy names "scaling the Open
Internet Stack" as an explicit objective — a catalogue of
open-source solutions aligned with EU priorities and rules
[EC-OSS-2026].

Funded work under this umbrella is organized around three focus
areas the Commission calls "3C" building blocks: trust (privacy-
enhancing technologies, AI-based agents, trusted identities),
connectivity, and decentralization — all required to be built on
open standards and compliant with the EU Digital Identity framework
(EUDI), the Cyber Resilience Act (CRA), the Digital Markets Act
(DMA), the Digital Services Act (DSA), GDPR, the Data Act, and the
Data Governance Act (DGA) [GrantBite-2026]. Individual calls have
explicitly listed "interoperable identity and credential management
tools" and "tools for decentralised social media" as example
components of interest [CORDIS-2025].

## 2. Why This Matters for ONP

ONP's four pillars (ONP-0000, Section 1.3) were not designed against
this framework, but they map onto it closely enough that the overlap
is worth stating explicitly rather than leaving it implicit:

| ONP Pillar | ONP Documents | OIS / EU Alignment |
|---|---|---|
| Trusted News | ONP-1003 (Signatures), ONP-0004 (Trust Model) | Maps to the OIS "trust" focus area: trusted identities, privacy-enhancing verification without centralized platform dependency [GrantBite-2026]. |
| Open Distribution | ONP-0001 (Architecture), Network Model | Maps to "decentralization": Objects exchanged Node-to-Node without a central registry, consistent with the "decentralised social media" component category [CORDIS-2025]. |
| Rights | ONP-2400 (Rights, planned) | Maps to regulatory compliance: a structured, referenceable rights declaration is the kind of building block the DSA/Data Act compliance requirement calls for, rather than an embedded legal interpretation (see ONP-0003, Principle P5). |
| Payments | ONP-2500 (Payments, planned) | Maps to "connectivity" and digital sovereignty goals: settlement-neutral payment terms (ONP-0003, Principle P4) avoid locking European publishers into non-EU payment infrastructure. |

Two structural design choices already made independently of this
alignment turn out to matter for it directly:

* **Settlement Neutrality (ONP-0003, P4)** is also a digital
  sovereignty property: because ONP does not mandate a specific
  payment rail, a European Payment Provider ecosystem can implement
  settlement without depending on a single non-EU platform.
* **Adjacent Publishing (ONP-0003, P1)** matches the OIS credibility
  requirement that funded solutions have "a credible path to
  integration" via cataloguing and app-store availability
  [EU-Funding-2026a] — ONP does not ask a publisher to migrate away
  from anything, which lowers the adoption barrier that OIS
  proposals are explicitly evaluated against.

## 3. Where ONP Would Need to Extend

Two future specifications should be written with explicit EU
regulatory hooks rather than generic ones, based on this alignment:

* **ONP-2300 (Identity):** SHOULD define an optional binding to the
  EU Digital Identity Wallet (EUDI) as one recognized trust anchor
  mechanism, alongside the DNS-based mechanism discussed for ONP-0004,
  rather than treating EUDI as out of scope.
* **ONP-2400 (Rights) and ONP-2500 (Payments):** SHOULD reference
  DSA, Data Act, and GDPR terminology explicitly in their Scope
  sections where declaring rights or payment terms intersects with
  those regulations, consistent with Principle P5 (Jurisdiction
  Neutrality) — ONP still does not interpret the law, but it SHOULD
  make its declarations legible to systems that must.

This is guidance for future specification authors, not a commitment
that binds ONP-0004, ONP-2300, ONP-2400, or ONP-2500 today; each of
those documents will state its own normative position when written.

## 4. Reality Check

This alignment is real but does not amount to eligibility. OIS
funding calls are consortium-based and typically award EUR 7–10.25
million per project, requiring a defined technology readiness level,
a maintenance and marketing plan for the full project lifecycle, and
demonstrated ties to "Support for Scale" integration efforts
[EU-Funding-2026a]. A parallel effort is underway to build a single
hub that catalogues, validates, and promotes solutions across the
whole Stack [EU-Funding-2026b]. ONP now has thirty-six published
specifications, a TypeScript reference implementation on npm
(`open-news-protocol`) covering the full Node lifecycle — signing,
verification, Trust Anchor resolution (with a provisional `eudi`
corroboration hook), and a consumer-Node aggregator — a second,
independent PHP implementation cross-verified in CI, and a
language-agnostic conformance suite. It signs with both Ed25519 and
ECDSA-P256, the eIDAS curve. What it still lacks is what such a call
would weigh most heavily: external review, a third party that has
implemented against the specification text alone, and a real Working
Group exercising the governance in `CHARTER.md`. The practical takeaway
is architectural, not financial: the identity, rights, and payments
Companions are written with these hooks in mind (Section 3), so
applying for OIS funding — likely alongside an established open-source
or research partner, as most funded consortia include one — becomes a
matter of packaging existing work and earning external validation
rather than retrofitting it.

## 5. References

* [NGI-2025] "From NGI to the Open Internet Stack: Charting the Next
  Chapter in Europe's Digital Future," Next Generation Internet,
  August 2025. https://ngi.eu/news/2025/08/04/from-ngi-to-the-open-internet-stack-charting-the-next-chapter-in-europes-digital-future/
* [EC-OSS-2026] "The EU Open Source Strategy," European Commission,
  Shaping Europe's Digital Future.
  https://digital-strategy.ec.europa.eu/en/policies/open-source-strategy
* [CORDIS-2025] "Open Internet Stack: development of technological
  commons/open-source 3C building blocks (RIA)," HORIZON, CORDIS,
  European Commission.
  https://cordis.europa.eu/programme/id/HORIZON_HORIZON-CL4-2025-03-DATA-11
* [GrantBite-2026] "Open Internet Stack Funding: Develop Trust &
  Decentralisation with EU Grants," GrantBite, May 2026.
  https://www.grantbite.com/en/funding/eu-open-internet-stack-funding
* [EU-Funding-2026a] "Call for proposals to foster the creation of
  open-source solutions organized under the Open Internet Stack
  framework," EU Funding Portal, January 2026.
  https://eufundingportal.eu/call-for-proposals-to-foster-the-creation-of-open-source-solutions-organized-under-the-open-internet-stack-framework/
* [EU-Funding-2026b] "Call for proposals to foster a common approach
  for cataloguing, reviewing, and validating Open Internet Stack
  components," EU Funding Portal, January 2026.
  https://eufundingportal.eu/call-for-proposals-to-foster-a-common-approach-for-cataloguing-reviewing-and-validating-open-internet-stack-components/
* [Swisscore-2026] "A new path for Europe's open digital future?"
  Swisscore, January 2026.
  https://www.swisscore.org/a-new-path-for-europes-open-digital-future/

---
*End of Document*
