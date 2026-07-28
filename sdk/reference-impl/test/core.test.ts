import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateKeypair,
  publicKeyFromRaw,
  computeVid,
  signEnvelope,
  validateCore,
  buildOid,
  isMinimalViableObject,
  type UnsignedEnvelope,
  type NewsObjectEnvelope,
} from "../src/index.js";

function makeSignedObject() {
  const { privateKey, publicKeyRaw } = generateKeypair();
  const publicKey = publicKeyFromRaw(publicKeyRaw);
  const unsigned: UnsignedEnvelope = {
    oid: buildOid("example.onp.dev", "test-article-01"),
    publisher: { domain: "example.onp.dev", key_id: "onp:key:test" },
    signed_at: "2026-07-28T00:00:00Z",
    content_type: "onp:companion:article",
    content: { headline: "Test", body: "Test body." },
  };
  const vid = computeVid(unsigned);
  const withVid: Record<string, unknown> = { ...unsigned, vid };
  const signature = signEnvelope(withVid, privateKey);
  const envelope = { ...withVid, signature } as unknown as NewsObjectEnvelope;
  return { envelope, publicKey, privateKey };
}

test("ONP-1000 Section 4.2: Minimal Viable Object has exactly the seven required fields", () => {
  const { envelope } = makeSignedObject();
  assert.equal(isMinimalViableObject(envelope), true);
});

test("ONP-1003 Section 6.1: a correctly signed object validates", () => {
  const { envelope, publicKey } = makeSignedObject();
  const result = validateCore(envelope, publicKey);
  assert.equal(result.core_authenticated, true);
  assert.equal(result.failure_step, null);
});

test("ONP-1001 Section 4.5: tampered content is caught by VID mismatch, before signature check", () => {
  const { envelope, publicKey } = makeSignedObject();
  const tampered = { ...envelope, content: { ...envelope.content, headline: "Tampered" } };
  const result = validateCore(tampered, publicKey);
  assert.equal(result.core_authenticated, false);
  assert.equal(result.failure_step, "vid-mismatch");
});

test("ONP-1001 Section 6.1: oid domain mismatch is rejected", () => {
  const { envelope, publicKey } = makeSignedObject();
  const tampered = {
    ...envelope,
    oid: buildOid("attacker.example", "test-article-01"),
  };
  // Recompute nothing — this VID will now also mismatch (oid is part of
  // the vid-preimage), so this exercises the same failure path as
  // above but confirms oid participates in VID integrity too.
  const result = validateCore(tampered, publicKey);
  assert.equal(result.core_authenticated, false);
});

test("ONP-1004 Section 4.5: wrong public key is rejected at signature-invalid", () => {
  const { envelope } = makeSignedObject();
  const { publicKeyRaw: wrongRaw } = generateKeypair();
  const wrongPublicKey = publicKeyFromRaw(wrongRaw);
  const result = validateCore(envelope, wrongPublicKey);
  assert.equal(result.core_authenticated, false);
  assert.equal(result.failure_step, "signature-invalid");
});

test("ONP-1000 Section 4.2: absence-has-meaning — lifecycle_state defaults apply at the application layer, not structurally", () => {
  const { envelope } = makeSignedObject();
  assert.equal("lifecycle_state" in envelope, false);
  assert.equal("supersedes" in envelope, false);
});

test("VID computation is deterministic (ONP-1001 Section 4.4)", () => {
  const unsigned: UnsignedEnvelope = {
    oid: buildOid("example.onp.dev", "determinism-test"),
    publisher: { domain: "example.onp.dev", key_id: "onp:key:test" },
    signed_at: "2026-07-28T00:00:00Z",
    content_type: "onp:companion:article",
    content: { headline: "Same", body: "Same body." },
  };
  const vid1 = computeVid(unsigned);
  const vid2 = computeVid(unsigned);
  assert.equal(vid1, vid2);
});

test("ONP-1002: key order does not affect the VID (canonicalization)", () => {
  const a: UnsignedEnvelope = {
    oid: buildOid("example.onp.dev", "order-test"),
    publisher: { domain: "example.onp.dev", key_id: "onp:key:test" },
    signed_at: "2026-07-28T00:00:00Z",
    content_type: "onp:companion:article",
    content: { headline: "X", body: "Y" },
  };
  // Same logical object, different construction order.
  const b: UnsignedEnvelope = {
    content_type: "onp:companion:article",
    signed_at: "2026-07-28T00:00:00Z",
    oid: buildOid("example.onp.dev", "order-test"),
    content: { body: "Y", headline: "X" },
    publisher: { key_id: "onp:key:test", domain: "example.onp.dev" },
  };
  assert.equal(computeVid(a), computeVid(b));
});
