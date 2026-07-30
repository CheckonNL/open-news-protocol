# Security Policy

The Open News Protocol is a cryptographic provenance protocol: a flaw
in a signature, canonicalization, identifier, or trust-resolution rule
can be a security vulnerability, not merely a bug. We take such reports
seriously and ask you to report them **privately** so a fix can ship
before the issue is public.

## Reporting a vulnerability

**Do not open a public issue or pull request for a suspected security
vulnerability.** Instead, either:

- email **info@checkon.nl** with the details, or
- use GitHub's **private vulnerability reporting** on this repository
  (the "Report a vulnerability" button under the *Security* tab), if
  enabled.

Please include, as far as you can:

- what is affected — the specification (cite the `ONP-NNNN` document and
  section), the TypeScript SDK (`sdk/reference-impl/`), and/or the
  WordPress plugin (`implementations/wordpress/`);
- a concrete description of the flaw and its impact;
- steps, a proof of concept, or a failing test vector that demonstrates
  it — a divergent VID or signature, an accepted forgery, a trust
  bypass, and so on;
- any suggested remediation.

## What to expect

This is a small, pre-1.0 project, so we set expectations honestly:

- we aim to **acknowledge** your report within **5 business days**;
- we will confirm whether we can reproduce it and agree a remediation
  and disclosure timeline with you (**coordinated disclosure** — we ask
  that you hold public details until a fix is available);
- we will credit you for the report unless you prefer to remain
  anonymous.

## Scope

In scope:

- **Specification flaws** — a normative rule that permits forgery,
  signature stripping, downgrade, replay, VID collision, canonicalization
  divergence between conforming implementations, or a Trust Anchor
  bypass (evaluated against the Adversary classes in
  [`specs/0005-security-model.md`](specs/0005-security-model.md)
  Section 4.1).
- **Reference SDK** (`sdk/reference-impl/`) — a bug that causes an
  invalid Object to validate, a valid Object to be forgeable, or the two
  implementations to disagree on the bytes.
- **WordPress plugin** (`implementations/wordpress/`) — signing, key
  handling, or the served `.well-known` endpoints.

Generally out of scope: vulnerabilities in third-party dependencies
themselves (report those upstream; tell us if ONP's use of them is
affected), and issues that require a already-compromised signing key —
the protocol's Adversary model
([`specs/0005-security-model.md`](specs/0005-security-model.md) Section
4.1) states plainly what it does and does not defend against.

## Related

- [`specs/0005-security-model.md`](specs/0005-security-model.md) — the
  adversary model and security properties.
- [`specs/9002-security-checklist.md`](specs/9002-security-checklist.md)
  — the implementer's security checklist.
- [`CHARTER.md`](CHARTER.md) — how the Working Group publishes Security
  Advisories, including against the Algorithm Registry.

## Supported versions

Every specification is currently a **Working Draft** and the SDK is
`0.x`; the latest `main` is what receives security fixes. There is no
long-term-support branch yet.
