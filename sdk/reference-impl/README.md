# ONP Reference Implementation

A working TypeScript implementation of **ONP-1000 through ONP-1004**,
plus Trust Anchor resolution (**ONP-0004**) and Retrieval
(**ONP-1006**): envelope construction, identifier computation (VID,
content-addressed per ONP-1001), canonicalization (JCS/RFC 8785, per
ONP-1002), Ed25519 signing/verification (per ONP-1003), the full
multi-level validation pipeline (ONP-1004), domain-anchored Trust
Anchor resolution (ONP-0004), and the Retrieval Convention (ONP-1006).
This goes beyond the minimum scope
[`specs/9000-reference-implementation.md`](../../specs/9000-reference-implementation.md)
Section 4.1 requires; the sections below state exactly what is and is
not covered.

This is real, tested code — not pseudocode. It computes actual VID
and signature values; nothing here uses the placeholder
`AbC123-example-digest-bytes`-style values the specification text
itself uses for illustration.

## What this covers

- `src/preimage.ts` — Pre-Image construction (ONP-1002 Section 4.2),
  using the [`canonicalize`](https://www.npmjs.com/package/canonicalize)
  package (an RFC 8785 reference implementation, written by one of the
  RFC's own authors — reuse over reinvention, per Principle P3).
- `src/identifiers.ts` — OID construction and VID computation
  (ONP-1001).
- `src/signatures.ts` — Ed25519 signing and verification (ONP-1003),
  using Node's native `node:crypto`.
- `src/validate.ts` — the full Core validation pipeline (ONP-1003
  Section 6.1): structural check → VID integrity → algorithm check →
  signature verification, each step terminal on failure.
- `src/export-schemaorg.ts` and `src/export-rss.ts` — deterministic
  export mappings to schema.org/NewsArticle and RSS 2.0, per
  [`specs/9005-external-standards-interoperability.md`](../../specs/9005-external-standards-interoperability.md).
  Run `npm run bridges` to see both applied to the running
  fusie-onderzoek example.

## What this deliberately does NOT cover

- **Most Companions and Extensions**: only ONP-2100 (Article) and
  ONP-3100 (ai-metadata) ship as reference validators; every other
  Companion/Extension correctly reports `unknown` via the pluggable
  registry — which is itself conformant behavior (ONP-1004 Section
  6.3), not a gap.

## Multi-level validation (ONP-1004) — implemented

`src/multilevel.ts` implements the full four-level pipeline of
ONP-1004 Section 6.1. `validateFull()` runs Level 1 (Core, reusing
`validateCoreWithTrust()` unchanged), then Levels 2a/2b on a
pluggable `ValidatorRegistry`, and returns the Section 5.1
Validation Result — as a discriminated union, so Section 4.5 rule 2
("no other field is meaningful when `core_authenticated` is false")
is a type-level fact rather than a convention. The contract's edge
rules are all enforced and tested: `unknown` vs `false` are never
conflated (Section 4.3 rule 3), Companion invalidity never touches
`core_authenticated` (Section 4.3 rule 2), Extension Conflicts are
reported explicitly and never silently resolved (Section 4.4 rule
2), silence between two Extensions is not a conflict (Section 6.2),
and an empty registry still yields a complete well-formed Result
(Section 6.3). Reference validators for ONP-2100 (Article) and
ONP-3100 (org.onp.ai-metadata) are included via
`referenceValidatorRegistry`.

## Retrieval (ONP-1006) — implemented

`src/retrieval.ts` implements the Retrieval Convention:
`objectUrlFromOid()` derives the canonical Object URL mechanically
from the OID (the publisher's domain is inside the OID — no lookup,
registry, or resolver), `etagForVid()` gives the VID-as-entity-tag
convention, and `retrieveNewsObject()` runs the full Section 5.1
algorithm: conditional GET (`If-None-Match` with a held VID), 304 /
404 semantics, then MANDATORY full Core validation including Trust
Anchor resolution on the retrieved bytes, then the requested-OID
match check. There is deliberately no code path that returns
retrieved bytes without validating them (Section 8.1). The RSS
export bridge now carries `<onp:object>` per item (Section 4.4,
namespace `https://opennewsprotocol.org/ns/feed`), so existing feeds
point at the signed Object.

## Trust Anchor resolution (ONP-0004) — implemented

`src/trust.ts` implements the domain-anchored Trust Anchor baseline:

- the Publisher Key Record structure (ONP-0004 Section 5.1) with
  structural validation;
- the full Resolution Algorithm (Section 6.1): current-key match,
  previous-key validity-window check against the Object's
  `signed_at`, and `revoked_at` handling (Section 4.4, rule 4:
  "at or after `revoked_at`" is untrusted);
- caching with the mandatory re-fetch-on-failure rule (Section 6.3,
  rule 2), so a legitimate key rotation the cache has not yet
  observed never causes a false rejection;
- OPTIONAL DNS corroboration (Section 4.3) as a warning-only
  fingerprint comparison via an injectable lookup — absence never
  fails resolution, exactly as rule 3 requires.

`validateCoreWithTrust()` in `src/validate.ts` runs the complete
six-step verification procedure of ONP-1003 Section 4.5 in the
mandatory Section 4.6 order, including the algorithm cross-check
(step 4) between the signature's algorithm-id and the resolved
Publisher Key Record entry, and verifies the signature against the
**resolved** key — never a caller-supplied one. The original
synchronous `validateCore(envelope, publicKey)` remains available
for offline / key-in-hand verification.

Fetching is pluggable (`KeyRecordFetcher`); the default fetcher uses
`fetch()` over HTTPS at `/.well-known/onp/publisher.json`, with
WebPKI/TLS validation performed by the platform TLS stack (Section
4.2, rule 3). Tests inject in-memory records and cover every example
in ONP-0004 Section 7.

`keyRecordFingerprint()` implements the Record Fingerprint exactly
as ONP-0004 v0.2.0 Section 4.3 rule 4 now normatively specifies it:
sha-256 over the JCS (RFC 8785) canonicalization of the parsed
Publisher Key Record, base64url unpadded, labeled `sha-256:` per the
Algorithm Registry identifier form. (This rule was added to the
specification after this implementation surfaced that the pre-image
was previously undefined — the gap-to-spec feedback loop working as
ONP-9000 intends.)

## Usage

```bash
npm install
npm run build
npm test                 # runs the test suite (60 tests)
npm run example          # signs and verifies the running fusie-onderzoek Article
npm run bridges           # exports the same Article to schema.org JSON-LD and RSS XML
node dist/examples/generate-test-vectors.js   # regenerates examples/test-vectors.json
```

## Test Vectors

[`examples/test-vectors.json`](examples/test-vectors.json) contains
real, computed Test Vectors per
[`specs/9000-reference-implementation.md`](../../specs/9000-reference-implementation.md)
Section 4.3: a Minimal Viable Object, a superseding Version, and a
structurally invalid rejection case — each with a genuine VID and
signature, generated against a fixed, published test keypair (never a
production key). Any independent implementation can verify its own
output against these values without running this code at all, which
is the entire point of publishing them.

## License

Apache License 2.0 — see [`LICENSE`](LICENSE) in this directory. This
is separate from the CC BY 4.0 license covering specification text
elsewhere in this repository, per ONP-9000 Section 4.5.
