# ONP Core Conformance Suite

A language-agnostic way to certify that an independent ONP
implementation agrees with the specification — on the bytes it
produces and on the verdicts it reaches. The suite is **pure data**
([`vectors.json`](vectors.json)); the runner here
([`run.mjs`](run.mjs)) drives the reference SDK, but a third party does
not use it. They read `vectors.json` and this document, and write an
equivalent runner against their own code. Nothing here imports, or
requires, the reference implementation.

## What it checks

`vectors.json` (structure: [`vector-schema.json`](vector-schema.json))
has three categories.

### 1. `produce` — byte-reproducibility

Each vector gives a fixed test key and an `unsigned` envelope. An
implementation MUST:

1. compute the VID over the envelope (ONP-1001 §4.3, ONP-1002 JCS) and
   get exactly `expected_vid`;
2. add that VID, sign the signing pre-image (ONP-1003 §4.4) with the
   named key's `private_key`, and get exactly `expected_signature`.

Byte equality is the pass condition. The VID is always deterministic.
Ed25519 signatures are deterministic (RFC 8032). **ECDSA-P256**
signatures here use the deterministic nonce of RFC 6979; a signer that
uses random `k` will still reproduce the VID byte-for-byte but produce
a *different, still-valid* signature — such an implementation checks
`produce` for the VID and instead verifies its own signature rather
than byte-comparing it.

### 2. `verify` — offline Core validation outcomes

Each vector gives a full `envelope` and a `public_key`. Run Core
validation (ONP-1003 §6.1) **without** Trust Anchor resolution, using
the supplied key, and map the result to one outcome token. It MUST
equal `expected`. Tokens:

| token | meaning |
|---|---|
| `authenticated` | all Core checks pass |
| `structural` | a REQUIRED envelope field is missing/malformed (ONP-1000) |
| `oid-domain-mismatch` | `oid` domain ≠ `publisher.domain` (ONP-1001) |
| `vid-mismatch` | recomputed VID ≠ declared `vid` (ONP-1001) |
| `unrecognized-algorithm` | signature algorithm-id not in the registry (ONP-0005) |
| `signature-invalid` | cryptographic verification fails (ONP-1003) |

An implementation that reaches the *right verdict* by a different
internal step order still conforms, as long as the terminal outcome
token matches.

### 3. `verify_trust` — full pipeline with a key record

Each vector gives an `envelope` and a `publisher_key_record`. Run the
full pipeline (ONP-1003 §4.5) with that record supplied as the Trust
Anchor **instead of fetching one over the network**, and map to an
outcome token. Additional tokens beyond the `verify` set:

| token | meaning |
|---|---|
| `trust-anchor-resolution-failed` | the key_id does not resolve in the record (ONP-0004 §6.1) |
| `algorithm-mismatch` | the record's declared algorithm ≠ the signature's (ONP-1003 §4.5 step 4) |

## Running the reference runner

```bash
cd sdk/reference-impl && npm ci && npm run build && cd ../..
node conformance/run.mjs
```

Exit code 0 means every vector passed. This is exactly what the
`conformance` CI job runs, so the reference implementation is held to
its own suite on every push.

## Regenerating

`vectors.json` is generated from the fixed keys and self-checked
before it is written:

```bash
node conformance/generate.mjs
```

## Test keys

The keys in `test_keys` are **fixed and NON-PRODUCTION**, published so
the `produce` vectors are reproducible (ONP-9000 §5.1). They MUST NOT
be used to sign anything real.

## Versioning

`conformance_suite` carries the suite version (`onp-core-conformance-vX.Y.Z`).
New vectors or a stricter expectation bump it; the intent is that an
implementation can cite the exact suite version it passes.
