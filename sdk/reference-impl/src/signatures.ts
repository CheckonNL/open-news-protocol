/**
 * ONP-1003 Digital Signatures.
 *
 * signature = "onp:sig:" + algorithm-id + ":" + base64url(sig-bytes)
 *
 * The actual cryptography lives in per-algorithm providers
 * (./algorithms/*), looked up by algorithm-id in the registry. This
 * module is only the envelope-level glue: build the signing pre-image,
 * hand it to the right provider, and frame the result as the
 * `onp:sig:...` string. Keys are raw bytes, so nothing here is bound to
 * a particular runtime (Node, browser, edge, wallet).
 */

import {
  getSignatureAlgorithm,
  registeredAlgorithmIds,
} from "./algorithms.js";
import { ed25519Algorithm } from "./algorithms/ed25519.js";
import { buildPreImage, preImageBytes } from "./preimage.js";
import { base64url, base64urlDecode } from "./identifiers.js";

export interface Keypair {
  privateKey: Uint8Array;
  publicKey: Uint8Array; // raw public key, for Publisher Key Records
}

/**
 * Generate a fresh keypair for the given algorithm (default: the
 * required-baseline ed25519, ONP-1003 Section 4.3).
 */
export function generateKeypair(algorithmId = "ed25519"): Keypair {
  const algo = getSignatureAlgorithm(algorithmId);
  if (!algo) {
    throw new Error(
      `Unknown signature algorithm "${algorithmId}"; registered: ${registeredAlgorithmIds().join(", ")}`
    );
  }
  return algo.generateKeypair();
}

/** Backwards-compatible alias: an Ed25519 keypair specifically. */
export type Ed25519Keypair = Keypair;

/**
 * ONP-1003 Section 4.4: sign an envelope (which already has oid, vid,
 * etc. set, but not `signature`) with the given raw private key.
 * Returns the full "onp:sig:<algorithm-id>:..." string.
 */
export function signEnvelope(
  envelope: Record<string, unknown>,
  privateKey: Uint8Array,
  algorithmId = "ed25519"
): string {
  const algo = getSignatureAlgorithm(algorithmId);
  if (!algo) {
    throw new Error(`Unknown signature algorithm "${algorithmId}"`);
  }
  const preImage = buildPreImage(envelope, "signing-preimage");
  const sigBytes = algo.sign(preImageBytes(preImage), privateKey);
  return `onp:sig:${algo.id}:${base64url(sigBytes)}`;
}

/** ONP-1003 Section 5.1: parse a signature string. */
export function parseSignature(sig: string): { algorithmId: string; digest: Uint8Array } {
  const m = /^onp:sig:([a-z0-9-]{1,32}):(.+)$/.exec(sig);
  if (!m) throw new Error(`Malformed signature: ${sig}`);
  return { algorithmId: m[1], digest: base64urlDecode(m[2]) };
}

/**
 * ONP-1003 Section 4.5, steps 5-6: reconstruct the signing pre-image
 * from the Object's own fields and cryptographically verify against the
 * supplied raw public key.
 *
 * Does NOT perform Trust Anchor resolution or the algorithm cross-check
 * (Section 4.5, step 4) — those require a Publisher Key Record and live
 * in validateCoreWithTrust(). An unrecognized algorithm-id fails closed
 * (ONP-0005 Section 4.2, rule 3).
 */
export function verifySignature(
  envelope: Record<string, unknown> & { signature: string },
  publicKey: Uint8Array
): boolean {
  const { algorithmId, digest } = parseSignature(envelope.signature);
  const algo = getSignatureAlgorithm(algorithmId);
  if (!algo) {
    // Fail closed on unrecognized algorithm, per ONP-0005 Section 4.2, rule 3.
    return false;
  }
  const preImage = buildPreImage(envelope, "signing-preimage");
  return algo.verify(preImageBytes(preImage), digest, publicKey);
}

export { ed25519Algorithm };
