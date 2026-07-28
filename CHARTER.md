# Open News Protocol Working Group — Charter

## 1. Mission

The Open News Protocol Working Group (ONP-WG) develops and maintains
an open standard for publishing, exchanging, verifying, and
monetizing news objects, as stated in
[`specs/0000-introduction.md`](specs/0000-introduction.md).

## 2. Scope

The ONP-WG is responsible for:

- authoring and maintaining every specification under `specs/`;
- maintaining the Terminology Registry
  ([`specs/0002-terminology.md`](specs/0002-terminology.md)) as the
  canonical index of term ownership across the series;
- running the Principles Review, Security Review, and Terminology
  Registration processes a specification must pass before advancing
  in Status
  ([`specs/0007-versioning-policy.md`](specs/0007-versioning-policy.md)
  Section 4.5);
- publishing Security Advisories against the Algorithm Registry
  ([`specs/0005-security-model.md`](specs/0005-security-model.md)
  Section 5.2) when warranted.

The ONP-WG is explicitly **not** responsible for, and does not
govern:

- any individual publisher's, CMS vendor's, or Node operator's
  implementation choices, beyond conformance with published
  specifications;
- Application-level policy decisions
  ([`specs/1004-validation.md`](specs/1004-validation.md)
  Section 4.6) — what any given application does with a Validation
  Result is outside this Working Group's authority by design;
- legal interpretation of copyright, tax, or data-protection law in
  any jurisdiction, per Principle P5 (Jurisdiction Neutrality,
  [`specs/0003-design-principles.md`](specs/0003-design-principles.md)).

## 3. Document Status and Advancement

A specification's Status (`Working Draft`, `Candidate`,
`Standards Track`, `Informational`, `Obsolete`) is defined in
[`specs/0000-introduction.md`](specs/0000-introduction.md)
Section 4.4. The technical preconditions for moving between these
levels are fixed in
[`specs/0007-versioning-policy.md`](specs/0007-versioning-policy.md)
Section 4.5. This Charter governs the human decision process that
confirms those preconditions are actually met:

1. A specification author or maintainer requests a Status Transition
   review, with evidence that the relevant preconditions
   (Principles Review, Security Review, Terminology Registration,
   or — for Candidate to Standards Track — a demonstrated
   independent implementation) are satisfied.
2. Maintainers review the evidence in the open (via the repository's
   issue tracker or equivalent).
3. Advancement requires **rough consensus** among active maintainers:
   no sustained, substantive objection that has not been addressed.
   This Charter does not require unanimous agreement, only the
   absence of an unresolved, substantive objection.
4. A Deviation from a Principle
   ([`specs/0003-design-principles.md`](specs/0003-design-principles.md)
   Section 6.3) or a Security Review finding
   ([`specs/0005-security-model.md`](specs/0005-security-model.md)
   Section 6.3) may be recorded, rather than blocking advancement
   indefinitely, if maintainers reach rough consensus that the
   deviation is justified and bounded.

## 4. Roles

- **Contributor** — anyone who opens an issue or pull request. No
  special status required; see
  [`CONTRIBUTING.md`](CONTRIBUTING.md).
- **Maintainer** — a contributor with merge rights, responsible for
  reviewing proposals against the criteria in `CONTRIBUTING.md` and
  participating in Status Transition decisions (Section 3 above).
  Maintainer status is granted by rough consensus of existing
  maintainers, based on sustained, substantive contribution.
- **Editor** — a maintainer specifically responsible for a given
  specification's editorial consistency (template conformance,
  cross-reference accuracy, Terminology Registry synchronization).
  A specification MAY have more than one Editor; every specification
  SHOULD have at least one.

## 5. Decision Process for Disputes

Where rough consensus (Section 3) cannot be reached after reasonable
discussion:

1. The dispute is stated in writing, with each position's reasoning,
   in the relevant issue or pull request.
2. Maintainers attempt to identify whether the dispute is actually a
   Principles or Security question with an answerable criterion
   (`specs/0003-design-principles.md`, `specs/0005-security-model.md`)
   rather than a matter of preference.
3. If unresolved, a vote among active maintainers decides, with a
   simple majority sufficient, except that a change meeting the
   MAJOR classification criteria for a Standards-Track specification
   ([`specs/0007-versioning-policy.md`](specs/0007-versioning-policy.md)
   Section 4.1) requires a two-thirds majority, reflecting the higher
   bar Principle P6 (Core Immutability Bias) already sets for
   consequential change.

## 6. Intellectual Property

Specification text is licensed under CC BY 4.0; see
[`LICENSE`](LICENSE). Contributors retain copyright in their
contributions and license them under the same terms as a condition
of contribution, consistent with the front-matter `ipr: trust200902`
declaration already present in every published specification
(signaling an IETF Trust Legal Provisions–style intent, adapted for
this Working Group's own governance rather than IETF's).

## 7. Amending This Charter

This Charter is itself a Working Group document and may be amended
by the same rough-consensus process described in Section 3, applied
to a pull request against `CHARTER.md` rather than a `specs/`
document. It does not carry an ONP-nnnn number and is not part of
the numbered specification series, consistent with its role as
process documentation rather than protocol definition.
