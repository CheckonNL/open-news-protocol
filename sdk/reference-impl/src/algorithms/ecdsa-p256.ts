/**
 * ECDSA-P256 signature provider (ONP-0005 Appendix A: `recommended`).
 *
 * The digital euro, the EU Digital Identity Wallet (EUDI) and eIDAS all
 * build on ECDSA over NIST P-256, so verifying ONP Objects signed in
 * those ecosystems needs this curve. Ed25519 remains the
 * required-baseline; this is the first `recommended` addition, and it
 * demonstrates the whole point of the provider registry: because the
 * `onp:sig:<algorithm-id>:...` string is keyed by algorithm-id, a new
 * curve slots in as one file plus a registry entry, with no change to
 * signing, verification, or the validation pipeline.
 *
 * Uses @noble/curves — audited, zero-dependency, pure-JS, and
 * deterministic (RFC 6979), so signatures are reproducible and the
 * provider runs identically on every JavaScript runtime.
 *
 * ── SPEC GAP ────────────────────────────────────────────────────────
 * ONP-1003 fixes the *Ed25519* wire encoding but does NOT yet define
 * ECDSA-P256's. This provider follows the JOSE **ES256** conventions —
 * the same ones the EUDI / eIDAS stack uses — so ratifying them in
 * ONP-1003 / ONP-0005 should be a formality rather than a change:
 *
 *   - message digest : SHA-256 over the pre-image bytes (ES256);
 *   - signature bytes: raw r‖s, 64 bytes, low-S normalized (NOT DER);
 *   - public key     : compressed SEC1 point, 33 bytes.
 *
 * These MUST be confirmed normatively before `ecdsa-p256` is promoted
 * past `recommended`. Until then this provider is usable and tested,
 * but its encoding is an implementation proposal, not settled spec.
 * ────────────────────────────────────────────────────────────────────
 */

import { p256 } from "@noble/curves/p256";
import { sha256 } from "@noble/hashes/sha2";
import type { SignatureAlgorithm } from "../algorithms.js";

export const ecdsaP256Algorithm: SignatureAlgorithm = {
  id: "ecdsa-p256",

  generateKeypair() {
    const privateKey = p256.utils.randomPrivateKey();
    // Compressed SEC1 public key (33 bytes).
    return { privateKey, publicKey: p256.getPublicKey(privateKey, true) };
  },

  sign(message, privateKey) {
    // ES256: sign the SHA-256 digest; emit raw r‖s (low-S by default).
    return p256.sign(sha256(message), privateKey).toCompactRawBytes();
  },

  verify(message, signature, publicKey) {
    // Malformed signature/key bytes must fail closed, not throw
    // (ONP-0005 Section 4.2, rule 3).
    try {
      return p256.verify(signature, sha256(message), publicKey);
    } catch {
      return false;
    }
  },
};
