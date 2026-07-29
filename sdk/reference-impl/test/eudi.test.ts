import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateKeypair,
  base64url,
  TrustAnchorResolver,
  type PublisherKeyRecord,
  type EudiAttestationVerifier,
} from "../src/index.js";

const DOMAIN = "example.onp.dev";
const KEY_ID = "onp:key:eudi-2026";
const SIGNED_AT = "2026-07-29T00:00:00Z";

function recordWithEudi(
  publicKey: Uint8Array,
  binds: { key_id?: string; publisher_domain?: string }
): PublisherKeyRecord {
  return {
    onp_trust_anchor_type: "domain",
    publisher_domain: DOMAIN,
    current_keys: [
      { key_id: KEY_ID, algorithm: "Ed25519", public_key: base64url(publicKey), valid_from: "2026-01-01T00:00:00Z" },
    ],
    previous_keys: [],
    eudi_attestation: { format: "sd-jwt-vc", credential: "<opaque-vc>", binds },
  };
}

function resolverWith(record: PublisherKeyRecord, eudiVerifier?: EudiAttestationVerifier) {
  return new TrustAnchorResolver({ fetcher: async () => record, eudiVerifier, cacheTtlMs: 0 });
}

const verifiedOrg: EudiAttestationVerifier = async () => ({
  verified: true,
  subject: { legal_name: "RegioPurmerend B.V.", lei: "5493001KJTIIGC8Y1R12" },
});

test("EUDI: a verified attestation that binds the resolved key elevates with the legal identity", async () => {
  const kp = generateKeypair();
  const resolver = resolverWith(recordWithEudi(kp.publicKey, { key_id: KEY_ID, publisher_domain: DOMAIN }), verifiedOrg);
  const r = await resolver.resolve(DOMAIN, KEY_ID, SIGNED_AT);
  if (!r.resolved) throw new Error("expected resolved");
  assert.equal(r.eudi?.verified, true);
  assert.equal(r.eudi?.subject?.lei, "5493001KJTIIGC8Y1R12");
  assert.equal(r.warnings.length, 0);
});

test("EUDI is additive: with no verifier the attestation is ignored, resolution unchanged", async () => {
  const kp = generateKeypair();
  const resolver = resolverWith(recordWithEudi(kp.publicKey, { key_id: KEY_ID })); // no verifier
  const r = await resolver.resolve(DOMAIN, KEY_ID, SIGNED_AT);
  if (!r.resolved) throw new Error("expected resolved");
  assert.equal(r.eudi, undefined);
  assert.equal(r.warnings.length, 0);
});

test("EUDI: a binding mismatch is a warning, not a failure", async () => {
  const kp = generateKeypair();
  const resolver = resolverWith(recordWithEudi(kp.publicKey, { key_id: "onp:key:some-other" }), verifiedOrg);
  const r = await resolver.resolve(DOMAIN, KEY_ID, SIGNED_AT);
  if (!r.resolved) throw new Error("expected resolved");
  assert.equal(r.eudi, undefined);
  assert.ok(r.warnings.some((w) => w.includes("eudi-binding-mismatch")));
});

test("EUDI: an unverified attestation is a warning, not a failure", async () => {
  const kp = generateKeypair();
  const failing: EudiAttestationVerifier = async () => ({ verified: false, reason: "not on any EU trust list" });
  const resolver = resolverWith(recordWithEudi(kp.publicKey, { key_id: KEY_ID }), failing);
  const r = await resolver.resolve(DOMAIN, KEY_ID, SIGNED_AT);
  if (!r.resolved) throw new Error("expected resolved");
  assert.equal(r.eudi, undefined);
  assert.ok(r.warnings.some((w) => w.includes("eudi-attestation-unverified")));
});

test("EUDI: a verifier that throws never fails resolution (Section 4.6 rule 3)", async () => {
  const kp = generateKeypair();
  const boom: EudiAttestationVerifier = async () => {
    throw new Error("wallet backend down");
  };
  const resolver = resolverWith(recordWithEudi(kp.publicKey, { key_id: KEY_ID }), boom);
  const r = await resolver.resolve(DOMAIN, KEY_ID, SIGNED_AT);
  if (!r.resolved) throw new Error("expected resolved");
  assert.ok(r.warnings.some((w) => w.includes("eudi-verification-error")));
});

test("EUDI never rescues a failed domain resolution", async () => {
  const kp = generateKeypair();
  // The Object claims a key_id absent from the record -> domain fails,
  // and the (would-verify) EUDI verifier is not even consulted.
  const resolver = resolverWith(recordWithEudi(kp.publicKey, { key_id: "onp:key:absent" }), verifiedOrg);
  const r = await resolver.resolve(DOMAIN, "onp:key:absent", SIGNED_AT);
  assert.equal(r.resolved, false);
});
