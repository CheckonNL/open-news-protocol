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
 * Wire encoding is fixed normatively in ONP-1003 Appendix C.2 (added
 * in v0.2.0), following the JOSE ES256 conventions the EUDI / eIDAS
 * stack uses:
 *
 *   - message digest : SHA-256 over the pre-image bytes (ES256);
 *   - signature bytes: raw r‖s, exactly 64 bytes, low-S (NOT DER);
 *   - public key     : compressed SEC1 point, exactly 33 bytes.
 *
 * The length/structure checks in verify() enforce those constraints so
 * this provider rejects any encoding Appendix C.2 forbids (e.g. a
 * 65-byte uncompressed key or a DER signature), fail closed.
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
    // ONP-1003 Appendix C.2: raw r‖s is exactly 64 bytes and the
    // public key is the 33-byte compressed SEC1 point. Reject anything
    // else (a DER signature, a 65-byte uncompressed key) fail closed
    // rather than letting @noble accept a forbidden encoding.
    if (signature.length !== 64 || publicKey.length !== 33) return false;
    // @noble verifies with lowS enforced by default, so a high-S
    // signature (also forbidden by Appendix C.2) is rejected too.
    // Malformed bytes throw; that must fail closed (ONP-0005 Section 4.2).
    try {
      return p256.verify(signature, sha256(message), publicKey);
    } catch {
      return false;
    }
  },
};
