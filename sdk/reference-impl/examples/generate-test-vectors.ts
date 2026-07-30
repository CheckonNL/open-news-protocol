/**
 * Generates real Test Vectors per ONP-9000 Section 4.3:
 *   - a Minimal Viable Object (ONP-1000 Section 4.2)
 *   - a Version with a non-null supersedes (ONP-0006)
 *   - a structurally invalid Object that MUST be rejected
 *
 * Uses a FIXED, published test keypair (never a production key,
 * per ONP-9000 Section 5.1's schema requirement) so these vectors
 * are reproducible by any independent implementation checking
 * itself against them, per ONP-9000 Section 4.3's entire purpose.
 */

import { writeFileSync } from "node:fs";
import {
  generateKeypair,
  computeVid,
  signEnvelope,
  buildOid,
  base64url,
  validateCore,
  type UnsignedEnvelope,
} from "../src/index.js";

/**
 * Generates a fresh Ed25519 keypair to serve as the FIXED, published
 * test keypair for this vector set. Raw key bytes (Uint8Array) are
 * printed so they can be committed as the canonical test key going
 * forward — this script is meant to be run once to establish the
 * fixture, not on every build.
 */
function fixedTestKeypair() {
  return generateKeypair();
}

function main() {
  const { privateKey, publicKey } = fixedTestKeypair();

  console.log("=== PUBLISHED TEST KEYPAIR (not production, per ONP-9000 5.1) ===");
  console.log("public_key (base64url):", base64url(publicKey));
  console.log("private_key (base64url, for regenerating vectors only):", base64url(privateKey));

  const vectors: unknown[] = [];

  // --- Vector 1: Minimal Viable Object ---
  const mvo: UnsignedEnvelope = {
    oid: buildOid("example.onp.dev", "test-vector-001"),
    publisher: { domain: "example.onp.dev", key_id: "onp:key:test-2026" },
    signed_at: "2026-07-28T00:00:00Z",
    content_type: "onp:companion:article",
    content: { headline: "Test Vector Article", body: "Test body text." },
  };
  const mvoVid = computeVid(mvo);
  const mvoWithVid: Record<string, unknown> = { ...mvo, vid: mvoVid };
  const mvoSig = signEnvelope(mvoWithVid, privateKey);
  const mvoEnvelope = { ...mvoWithVid, signature: mvoSig };
  vectors.push({
    test_vector_id: "onp-tv-001",
    description: "Minimal Viable Object, per ONP-1000 Section 4.2",
    test_keypair: {
      algorithm: "ed25519",
      public_key: base64url(publicKey),
      note: "Published test key only — see PUBLISHED TEST KEYPAIR above",
    },
    input_envelope: mvo,
    expected_vid: mvoVid,
    expected_signature: mvoSig,
    expected_result: "valid",
  });

  // --- Vector 2: superseding Version ---
  const v2: UnsignedEnvelope = {
    oid: mvo.oid,
    publisher: mvo.publisher,
    signed_at: "2026-07-29T08:00:00Z",
    content_type: "onp:companion:article",
    content: { headline: "Test Vector Article (corrected)", body: "Corrected body text." },
    revision_reason: "Corrected a factual error in the body.",
  } as UnsignedEnvelope;
  const v2WithSupersedes: Record<string, unknown> = { ...v2, supersedes: mvoVid };
  const v2Vid = computeVid(v2WithSupersedes);
  const v2WithVid: Record<string, unknown> = { ...v2WithSupersedes, vid: v2Vid };
  const v2Sig = signEnvelope(v2WithVid, privateKey);
  const v2Envelope = { ...v2WithVid, signature: v2Sig };
  vectors.push({
    test_vector_id: "onp-tv-002",
    description: "A Version with non-null supersedes (ONP-0006)",
    test_keypair: {
      algorithm: "ed25519",
      public_key: base64url(publicKey),
      note: "Published test key only",
    },
    input_envelope: v2WithSupersedes,
    expected_vid: v2Vid,
    expected_signature: v2Sig,
    expected_result: "valid",
  });

  // --- Vector 3: structurally invalid (missing REQUIRED field) ---
  const invalid = {
    oid: buildOid("example.onp.dev", "test-vector-003"),
    publisher: { domain: "example.onp.dev", key_id: "onp:key:test-2026" },
    // signed_at deliberately omitted -> structurally invalid per ONP-1000 4.1
    content_type: "onp:companion:article",
    content: { headline: "Missing signed_at", body: "This should be rejected." },
  };
  vectors.push({
    test_vector_id: "onp-tv-003",
    description: "Structurally invalid: missing REQUIRED signed_at field",
    test_keypair: {
      algorithm: "ed25519",
      public_key: base64url(publicKey),
      note: "Published test key only",
    },
    input_envelope: invalid,
    expected_vid: null,
    expected_signature: null,
    expected_result: "structurally-invalid",
  });

  // --- Self-check: verify vectors 1 and 2 actually validate ---
  const r1 = validateCore(mvoEnvelope as any, publicKey);
  const r2 = validateCore(v2Envelope as any, publicKey);
  console.log("\nSelf-check vector 1:", r1);
  console.log("Self-check vector 2:", r2);
  if (!r1.core_authenticated || !r2.core_authenticated) {
    throw new Error("Generated test vectors failed self-verification!");
  }

  const output = {
    test_vector_set: "onp-core-v0.1.0",
    generated_by: "open-news-protocol example generator",
    note: "Real, computed values — not placeholders. Public test key is safe to publish; private key material above is for vector regeneration only and MUST NOT be used for anything else.",
    vectors,
  };

  writeFileSync(
    new URL("../../examples/test-vectors.json", import.meta.url),
    JSON.stringify(output, null, 2)
  );
  console.log("\nWrote examples/test-vectors.json");
}

main();
