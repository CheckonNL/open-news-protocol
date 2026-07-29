/**
 * Ed25519 signature provider (ONP-1003 Section 4.3, required-baseline).
 *
 * Uses @noble/curves — an audited, zero-dependency, pure-JS RFC 8032
 * implementation that runs identically on every JavaScript runtime.
 * Ed25519 is deterministic (RFC 8032), so these signatures are
 * byte-identical to any conforming implementation, including the
 * WordPress PHP connector's libsodium path — which is what the
 * cross-implementation interop check depends on.
 */

import { ed25519 } from "@noble/curves/ed25519";
import type { SignatureAlgorithm } from "../algorithms.js";

export const ed25519Algorithm: SignatureAlgorithm = {
  id: "ed25519",

  generateKeypair() {
    const privateKey = ed25519.utils.randomPrivateKey();
    return { privateKey, publicKey: ed25519.getPublicKey(privateKey) };
  },

  sign(message, privateKey) {
    return ed25519.sign(message, privateKey);
  },

  verify(message, signature, publicKey) {
    // @noble throws on malformed signature/key bytes; ONP verification
    // MUST fail closed instead (ONP-0005 Section 4.2), so any such input
    // is an invalid signature, not an error to propagate.
    try {
      return ed25519.verify(signature, message, publicKey);
    } catch {
      return false;
    }
  },
};
