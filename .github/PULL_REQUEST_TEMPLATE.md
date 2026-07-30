<!-- Thanks for contributing. Please read CONTRIBUTING.md before opening. -->

## What this changes

A short description of the change and why.

## Type

- [ ] Specification change (`specs/NNNN-*.md`)
- [ ] SDK / implementation change
- [ ] Docs / tooling only

## For a specification change

- **Versioning class** (per `specs/0007-versioning-policy.md` Section 6.1):
  MAJOR / MINOR / PATCH — and the reasoning.
- [ ] `Version` and `Last Modified` headers updated.
- [ ] New terms registered in `specs/0002-terminology.md` (Section 4.1).
- [ ] Website regenerated (`python3 tools/build-site.py`) if a spec page changed.

## Reviewer checklist (CONTRIBUTING.md "What reviewers check")

- [ ] **Consistency** — does not contradict or duplicate a single-owner document.
- [ ] **Principles** — holds against the seven Principles (`specs/0003-design-principles.md`), or records an explicit Deviation.
- [ ] **Security** — introduces no new way for an Adversary class (`specs/0005-security-model.md` Section 4.1) to defeat a guaranteed property.
- [ ] CI green (SDK build + tests, spec-lint, schemas, interop, conformance, site).

## Not a security report

Security vulnerabilities must **not** be filed as public pull requests —
see [`SECURITY.md`](../SECURITY.md).
