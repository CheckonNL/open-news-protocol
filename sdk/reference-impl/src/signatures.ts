/**
 * ONP-1003 Digital Signatures.
 *
 * signature = "onp:sig:" + algorithm-id + ":" + base64url(sig-bytes)
 *
 * Uses Node's native `node:crypto` Ed25519 support — no bespoke
 * cryptography, per Principle P3 (ONP-0003) and the Algorithm
 * Registry's required-baseline algorithm (ONP-0005 Appendix A).
 */

import {
  generateKeyPairSync,
  sign as nodeSign,
  verify as nodeVerify,
  createPublicKey,
  createPrivateKey,
  type KeyObject,
} from "node:crypto";
import { buildPreImage, preImageBytes } from "./preimage.js";
import { base64url, base64urlDecode } from "./identifiers.js";

export interface Ed25519Keypair {
  publicKey: KeyObject;
  privateKey: KeyObject;
  publicKeyRaw: Buffer; // raw 32-byte public key, for Publisher Key Records
}

/** Generate a fresh Ed25519 keypair (ONP-1003 Section 4.3, required-baseline). */
export function generateKeypair(): Ed25519Keypair {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const raw = publicKey.export({ type: "spki", format: "der" });
  // Raw Ed25519 public key is the last 32 bytes of the SPKI DER encoding.
  const publicKeyRaw = raw.subarray(raw.length - 32);
  return { publicKey, privateKey, publicKeyRaw };
}

/** Reconstruct a KeyObject from a raw 32-byte Ed25519 public key. */
export function publicKeyFromRaw(raw: Buffer): KeyObject {
  const prefix = Buffer.from("302a300506032b6570032100", "hex");
  return createPublicKey({
    key: Buffer.concat([prefix, raw]),
    format: "der",
    type: "spki",
  });
}

/**
 * ONP-1003 Section 4.4: sign an envelope (which already has oid, vid,
 * etc. set, but not `signature`) with the given private key.
 * Returns the full "onp:sig:ed25519:..." string.
 */
export function signEnvelope(
  envelope: Record<string, unknown>,
  privateKey: KeyObject
): string {
  const preImage = buildPreImage(envelope, "signing-preimage");
  const sigBytes = nodeSign(null, preImageBytes(preImage), privateKey);
  return `onp:sig:ed25519:${base64url(sigBytes)}`;
}

/** ONP-1003 Section 5.1: parse a signature string. */
export function parseSignature(sig: string): { algorithmId: string; digest: Buffer } {
  const m = /^onp:sig:([a-z0-9-]{1,32}):(.+)$/.exec(sig);
  if (!m) throw new Error(`Malformed signature: ${sig}`);
  return { algorithmId: m[1], digest: base64urlDecode(m[2]) };
}

/**
 * ONP-1003 Section 4.5, steps 5-6: reconstruct the signing pre-image
 * from the Object's own fields and cryptographically verify.
 * Does NOT perform Trust Anchor resolution or the algorithm
 * cross-check (Section 4.5, step 4) — those require a Publisher Key
 * Record, which is out of scope for this minimal reference
 * implementation (ONP-9000 Section 4.1 notes ONP-0004 coverage is
 * only RECOMMENDED, not REQUIRED, for a first Reference
 * Implementation).
 */
export function verifySignature(
  envelope: Record<string, unknown> & { signature: string },
  publicKey: KeyObject
): boolean {
  const { algorithmId, digest } = parseSignature(envelope.signature);
  if (algorithmId !== "ed25519") {
    // Fail closed on unrecognized algorithm, per ONP-0005 Section 4.2, rule 3.
    return false;
  }
  const preImage = buildPreImage(envelope, "signing-preimage");
  return nodeVerify(null, preImageBytes(preImage), publicKey, digest);
}

export { createPrivateKey };
