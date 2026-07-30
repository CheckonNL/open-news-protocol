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

## Install

```bash
npm install open-news-protocol
```

This installs the library and the `onp` CLI. The crypto is pure-JS (no
`node:` built-ins), so it runs unchanged on Node, browsers, Deno, and
edge runtimes. Published as `0.x`: still a Working Draft, so the API may
change between minor versions (SemVer's initial-development phase).

## What this covers

- `src/preimage.ts` — Pre-Image construction (ONP-1002 Section 4.2),
  using the [`canonicalize`](https://www.npmjs.com/package/canonicalize)
  package (an RFC 8785 reference implementation, written by one of the
  RFC's own authors — reuse over reinvention, per Principle P3).
- `src/identifiers.ts` — OID construction and VID computation
  (ONP-1001), hashing with [`@noble/hashes`](https://www.npmjs.com/package/@noble/hashes)
  and base64url via [`@scure/base`](https://www.npmjs.com/package/@scure/base).
- `src/algorithms.ts` (+ `src/algorithms/`) — a signature-algorithm
  provider registry keyed by the algorithm-id in `onp:sig:<id>:...`.
  Ed25519 (via [`@noble/curves`](https://www.npmjs.com/package/@noble/curves))
  is the required-baseline provider; adding ECDSA-P256 (ONP-0005
  Appendix A lists it `recommended`) or a post-quantum algorithm is one
  provider file plus a `registerSignatureAlgorithm` call — no change to
  signing, verification, or validation.
- `src/signatures.ts` — Ed25519 signing and verification (ONP-1003)
  over the provider registry. Keys are raw bytes and the crypto is
  pure-JS (no `node:crypto`), so the whole SDK runs unchanged on Node,
  browsers, Deno, edge runtimes, and EUDI-style wallet contexts.
- `src/validate.ts` — the full Core validation pipeline (ONP-1003
  Section 6.1): structural check → VID integrity → algorithm check →
  signature verification, each step terminal on failure.
- `src/export-schemaorg.ts` and `src/export-rss.ts` — deterministic
  export mappings to schema.org/NewsArticle and RSS 2.0, per
  [`specs/9005-external-standards-interoperability.md`](../../specs/9005-external-standards-interoperability.md).
  Run `npm run bridges` to see both applied to the running
  fusie-onderzoek example.

## What this deliberately does NOT cover

- **Some Companions and most Extensions**: reference validators ship
  for the Article (ONP-2100), Media (ONP-2200), Rights (ONP-2400),
  Payments (ONP-2500) and Corrections (ONP-2700) Companions, plus the
  ai-metadata Extension (ONP-3100). The Sources, Comments and Identity
  Companions and every other Extension correctly report `unknown` via
  the pluggable registry — itself conformant behavior (ONP-1004
  Section 6.3), not a gap.

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
(Section 6.3). `referenceValidatorRegistry` bundles reference
validators for the Article (ONP-2100), Media (ONP-2200), Rights
(ONP-2400), Payments (ONP-2500) and Corrections (ONP-2700) Companions
and the org.onp.ai-metadata Extension (ONP-3100).

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

## Aggregation — a consumer Node (ONP-0001 Section 6.3)

`src/aggregator.ts` is the Node role that closes the network model's
`Publisher Node -> Signed Object -> Other Nodes -> Applications` loop.
`aggregate(feedUrls, resolver)` follows the `<onp:object>` pointers in
ordinary RSS/Atom feeds, retrieves every referenced Object, runs full
Core validation (Trust Anchor resolution included) on each, and returns
a newest-first, per-OID-deduplicated timeline of **only the authentic
ones**, with a separate list of what was rejected and why. This is
"trust the Object, not the Messenger" made concrete: discovery is
untrusted, so a hostile or broken feed can only waste a fetch — it
cannot inject an unauthentic Object into the timeline (there is a test
for exactly that). Feed and Object fetching are injectable, so it is a
pure, offline-testable function; the `onp aggregate <feed-url>...` CLI
command runs it over live HTTPS.

## Relay — an untrusted intermediary (ONP-0001 Section 6.3)

`src/relay.ts` is the last Node role: an intermediary that caches,
mirrors, and indexes Objects across publishers — the cross-publisher
discovery no single publisher can offer — without ever conferring
trust. `Relay.ingest()` verifies an Object and keeps the newest Version
per OID; `get()` mirrors it by OID; `query()` returns a newest-first,
publisher-filterable index; and `feed()` emits a combined `<onp:object>`
feed an aggregator consumes exactly like any other, closing the loop
`publisher -> relay (index) -> aggregator (verify)`. Verifying on ingest
only keeps the index clean — the guarantee is that consumers re-verify,
so a relay can be run by anyone, even an adversary, and cannot smuggle
in a forgery (a test drives its feed straight into `aggregate`). With
this, every role in the network model — publisher, verifier, aggregator,
relay — has a reference implementation.

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
- OPTIONAL, **PROVISIONAL** EUDI corroboration (Section 4.6): an
  injectable `EudiAttestationVerifier` can bind the resolved key/domain
  to a wallet-verified legal identity (SD-JWT VC by default, with the
  organization's LEI as the recommended identifier). It is **additive
  and elevation/warning-only** — absence, a failed credential, or a
  binding mismatch never rejects an Object whose `domain` resolution
  already succeeded (rule 3: authenticity stays domain-verifiable). The
  SDK delegates all SD-JWT / mdoc / EU-Trust-List work to the injected
  verifier and does no credential crypto itself; the `eudi_attestation`
  shape is an implementation proposal, not yet ratified.

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
npm test                 # runs the test suite (94 tests)
npm run example          # signs and verifies the running fusie-onderzoek Article
npm run bridges           # exports the same Article to schema.org JSON-LD and RSS XML
npm run capstone         # the whole loop: sign -> RSS feed -> aggregate -> verified timeline (with a rejected forgery)
node dist/examples/generate-test-vectors.js   # regenerates examples/test-vectors.json
```

## CLI

After `npm run build`, the `onp` command (also exposed as the package's
`bin`) drives the SDK from the shell — no TypeScript required. `verify`
exits 0 when the Object is Core-authenticated and 1 when it is
rejected, so it drops straight into CI and pipelines.

```bash
onp keygen [--algorithm ed25519|ecdsa-p256]
onp sign <unsigned.json> --key <b64url-private> [--algorithm <id>] [--out <file>]
onp verify <file|url> [--key <b64url-public>] [--anchor <publisher.json>]
onp aggregate <feed-url> [<feed-url> ...]
onp publisher-json --domain <d> --key-id <id> --public-key <b64url> [--algorithm <name>]
```

`verify` runs the full pipeline — Trust Anchor resolution over HTTPS
against the Object's own domain — by default; `--key` does offline
crypto-only verification against a supplied public key, and `--anchor`
resolves against a local Publisher Key Record instead of fetching one.
Run the built entry directly during development with
`node dist/src/cli.js <command>`.

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
