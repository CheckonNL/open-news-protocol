# Contributing to the Open News Protocol

Thank you for considering a contribution. This document describes
how to propose a change to an existing specification, how to propose
a new one, and what happens after you do.

## Before you start

1. Check [`specs/0002-terminology.md`](specs/0002-terminology.md) —
   if the term you're about to use already has an owner, use the
   existing definition rather than introducing a competing one.
2. Check [`specs/0003-design-principles.md`](specs/0003-design-principles.md)
   Appendix A — every proposal is evaluated against these seven
   Principles (P1-P7) before it can advance. Reading them first
   saves a review round.
3. If you're proposing a new Companion or Extension, read
   [`specs/2000-companion-framework.md`](specs/2000-companion-framework.md)
   (or, once published, the equivalent Extension Framework document)
   — it defines the mandatory structure your proposal must follow.

## Proposing a change to an existing specification

1. Open an issue describing the problem, not (yet) the specific
   wording change. What breaks, or what's missing, without this
   change?
2. If the maintainers agree the problem is real, open a pull request
   against the specific `specs/NNNN-slug.md` file.
3. Classify your change per
   [`specs/0007-versioning-policy.md`](specs/0007-versioning-policy.md)
   Section 6.1 (MAJOR / MINOR / PATCH) and state that classification
   explicitly in your pull request description. Reviewers will check
   this, not just take your word for it — see Section 6.1's decision
   algorithm if you're unsure.
4. If your change introduces a new term, register it in
   [`specs/0002-terminology.md`](specs/0002-terminology.md) as part
   of the same pull request, per that document's Section 4.1.

## Proposing a new specification

1. Confirm the document number range is correct for what you're
   proposing (`specs/0000-introduction.md` Section 4.1): Foundation
   (`0000`-`0999`), Core (`1000`-`1999`), Companion (`2000`-`2999`),
   Extension (`3000`-`3999`), Reference (`9000`-`9999`).
2. If proposing a Companion, apply the Companion-vs-Extension
   decision test
   ([`specs/0001-architecture.md`](specs/0001-architecture.md)
   Section 4.4) explicitly in your proposal, and follow the
   mandatory additions
   [`specs/2000-companion-framework.md`](specs/2000-companion-framework.md)
   Section 4.2 requires.
3. Follow the universal template
   ([`specs/0000-introduction.md`](specs/0000-introduction.md)
   Section 3.2): `Title`, `Document Number`, `Status`, `Version`,
   `Author`, `Last Modified`, `Abstract`, `Status of This Document`,
   `Normative Language`, then the ten numbered sections through
   References, then appendices.
4. Before your specification can advance from Working Draft to
   Candidate status, it must pass:
   - a **Principles Review**
     ([`specs/0003-design-principles.md`](specs/0003-design-principles.md)
     Section 6.1),
   - a **Security Review**
     ([`specs/0005-security-model.md`](specs/0005-security-model.md)
     Section 6.3),
   - and full **Terminology Registration**
     ([`specs/0002-terminology.md`](specs/0002-terminology.md)
     Section 6.2).

   See [`specs/0007-versioning-policy.md`](specs/0007-versioning-policy.md)
   Section 4.5 for the complete precondition list.

## What reviewers check

A pull request that touches a specification is reviewed against:

- **Consistency** — does it contradict or duplicate something an
  earlier, single-owner document already states? (See
  `specs/0002-terminology.md` for term ownership, and
  `specs/0000-introduction.md` Section 4.2 for the dependency rules
  a specification must respect.)
- **Principles** — does it hold up against all seven Principles in
  `specs/0003-design-principles.md`, or does it need an explicit,
  recorded Deviation (that document's Section 6.3)?
- **Security** — does it introduce a new way for any of the four
  Adversary classes in `specs/0005-security-model.md` Section 4.1 to
  defeat a property ONP otherwise guarantees?
- **Versioning** — is the `Version` bump correctly classified per
  `specs/0007-versioning-policy.md`?

## Governance

See [`CHARTER.md`](CHARTER.md) for how the Working Group is
organized, how disputes are resolved, and how a specification's
Status is formally advanced. All participants are expected to follow
[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
