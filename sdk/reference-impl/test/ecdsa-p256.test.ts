import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateKeypair,
  signObject,
  validateCore,
  validateCoreWithTrust,
  buildOid,
  base64url,
  registeredAlgorithmIds,
  TrustAnchorResolver,
  type UnsignedEnvelope,
  type PublisherKeyRecord,
} from "../src/index.js";

const DOMAIN = "example.onp.dev";
const KEY_ID = "onp:key:p256-2026";

function unsignedObject(): UnsignedEnvelope {
  return {
    oid: buildOid(DOMAIN, "p256-test-01"),
    publisher: { domain: DOMAIN, key_id: KEY_ID },
    signed_at: "2026-07-28T00:00:00Z",
    content_type: "onp:companion:article",
    content: { headline: "P-256 test", body: "Body." },
  };
}

test("ecdsa-p256 is registered alongside the ed25519 baseline", () => {
  const ids = registeredAlgorithmIds();
  assert.ok(ids.includes("ed25519"));
  assert.ok(ids.includes("ecdsa-p256"));
});

test("ECDSA-P256: signObject round-trips and validateCore authenticates", () => {
  const { privateKey, publicKey } = generateKeypair("ecdsa-p256");
  const envelope = signObject(unsignedObject(), privateKey, "ecdsa-p256");
  assert.ok(
    envelope.signature.startsWith("onp:sig:ecdsa-p256:"),
    envelope.signature
  );
  const result = validateCore(envelope, publicKey);
  assert.equal(result.core_authenticated, true);
  assert.equal(result.failure_step, null);
});

test("ECDSA-P256: tampered content is rejected", () => {
  const { privateKey, publicKey } = generateKeypair("ecdsa-p256");
  const envelope = signObject(unsignedObject(), privateKey, "ecdsa-p256");
  const tampered = {
    ...envelope,
    content: { ...envelope.content, headline: "Tampered" },
  };
  const result = validateCore(tampered, publicKey);
  assert.equal(result.core_authenticated, false);
});

test("ECDSA-P256: wrong public key is rejected at signature-invalid", () => {
  const { privateKey } = generateKeypair("ecdsa-p256");
  const { publicKey: wrong } = generateKeypair("ecdsa-p256");
  const envelope = signObject(unsignedObject(), privateKey, "ecdsa-p256");
  const result = validateCore(envelope, wrong);
  assert.equal(result.core_authenticated, false);
  assert.equal(result.failure_step, "signature-invalid");
});

test("ECDSA-P256: full Trust Anchor pipeline authenticates via the resolved key", async () => {
  const { privateKey, publicKey } = generateKeypair("ecdsa-p256");
  const record: PublisherKeyRecord = {
    onp_trust_anchor_type: "domain",
    publisher_domain: DOMAIN,
    current_keys: [
      {
        key_id: KEY_ID,
        // Record declares "ECDSA-P256"; the algorithm cross-check
        // (ONP-1003 Section 4.5 step 4) compares this case-insensitively
        // to the signature's "ecdsa-p256".
        algorithm: "ECDSA-P256",
        public_key: base64url(publicKey),
        valid_from: "2026-01-01T00:00:00Z",
      },
    ],
    previous_keys: [],
  };
  const resolver = new TrustAnchorResolver({ fetcher: async () => record });
  const envelope = signObject(unsignedObject(), privateKey, "ecdsa-p256");
  const result = await validateCoreWithTrust(envelope, resolver);
  assert.equal(result.core_authenticated, true, JSON.stringify(result));
});
