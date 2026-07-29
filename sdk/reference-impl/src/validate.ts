/**
 * The full Core validation pipeline, per ONP-1003 Section 6.1:
 *
 *   STEP 1 (ONP-1000): envelope structural check.
 *   STEP 2 (ONP-1001): oid domain match, VID structural integrity.
 *   STEP 3 (ONP-1003): algorithm check, signature verification.
 *     (Trust Anchor resolution, ONP-0004, is out of scope for this
 *      minimal implementation — see signatures.ts's doc comment.)
 *
 * A failure at any step is terminal; later steps are not evaluated.
 */

import { isMinimalViableObject, type NewsObjectEnvelope } from "./envelope.js";
import { parseOidDomain, verifyVid } from "./identifiers.js";
import { verifySignature, parseSignature } from "./signatures.js";
import { getSignatureAlgorithm } from "./algorithms.js";

export type ValidationFailureStep =
  | "structural"
  | "oid-domain-mismatch"
  | "vid-mismatch"
  | "unrecognized-algorithm"
  | "signature-invalid";

export interface CoreValidationResult {
  core_authenticated: boolean;
  failure_step: ValidationFailureStep | null;
}

// The Algorithm Registry (ONP-0005 Appendix A) is the set of signature
// algorithms this Node recognizes. It is exactly the set of registered
// providers, so recognized == implemented and adding ECDSA-P256 or a
// post-quantum provider extends both at once. `isRecognizedAlgorithm`
// is the single check both validation pipelines use.
function isRecognizedAlgorithm(algorithmId: string): boolean {
  return getSignatureAlgorithm(algorithmId) !== undefined;
}

export function validateCore(
  envelope: NewsObjectEnvelope,
  publicKey: Uint8Array
): CoreValidationResult {
  // STEP 1 — ONP-1000 Section 6.1: structural check.
  if (!isMinimalViableObject(envelope)) {
    return { core_authenticated: false, failure_step: "structural" };
  }

  // STEP 2 — ONP-1001 Section 6.1: oid domain match, VID integrity.
  const { domain } = parseOidDomain(envelope.oid);
  if (domain !== envelope.publisher.domain) {
    return { core_authenticated: false, failure_step: "oid-domain-mismatch" };
  }
  if (!verifyVid(envelope)) {
    return { core_authenticated: false, failure_step: "vid-mismatch" };
  }

  // STEP 3 — ONP-1003 Section 4.5: algorithm check + signature verification.
  const { algorithmId } = parseSignature(envelope.signature);
  if (!isRecognizedAlgorithm(algorithmId)) {
    return { core_authenticated: false, failure_step: "unrecognized-algorithm" };
  }
  if (!verifySignature(envelope, publicKey)) {
    return { core_authenticated: false, failure_step: "signature-invalid" };
  }

  return { core_authenticated: true, failure_step: null };
}

// ---------------------------------------------------------------------------
// Full pipeline including Trust Anchor resolution (ONP-1003 Section 4.5,
// all six steps, in the mandatory order of Section 4.6).
// ---------------------------------------------------------------------------

import { TrustAnchorResolver, type ResolutionResult } from "./trust.js";
import { base64urlDecode } from "./identifiers.js";

export type TrustValidationFailureStep =
  | ValidationFailureStep
  | "trust-anchor-resolution-failed" // ONP-1003 Section 4.5, step 3
  | "algorithm-mismatch";            // ONP-1003 Section 4.5, step 4

export interface CoreTrustValidationResult {
  core_authenticated: boolean;
  failure_step: TrustValidationFailureStep | null;
  /** The underlying ONP-0004 resolution outcome, for diagnostics. */
  trust_resolution: ResolutionResult | null;
}

/**
 * The complete Core validation pipeline with Trust Anchor resolution:
 *
 *   STEP 1 (ONP-1000 Section 6.1): envelope structural check.
 *   STEP 2 (ONP-1001 Section 6.1): oid domain match, VID integrity.
 *   STEP 3 (ONP-1003 Section 4.5):
 *     3a. parse signature, Algorithm Registry check (fail closed);
 *     3b. Trust Anchor resolution for publisher.domain /
 *         publisher.key_id at claimed time signed_at (ONP-0004
 *         Section 6.1) — REJECT if resolution fails; an Object
 *         failing resolution MUST be treated identically to one
 *         failing signature validation (ONP-0004 Section 6.2);
 *     3c. algorithm cross-check between the signature's algorithm-id
 *         and the resolved Publisher Key Record entry's declared
 *         algorithm (case-insensitive) — REJECT on disagreement;
 *     3d. cryptographic verification using the RESOLVED public key
 *         (not a caller-supplied one).
 *
 * This is what makes "trust the Object, not the Messenger" hold end
 * to end: the verification key comes from the publisher's own
 * domain-anchored Publisher Key Record, never from the transport
 * that delivered the Object.
 */
export async function validateCoreWithTrust(
  envelope: NewsObjectEnvelope,
  resolver: TrustAnchorResolver
): Promise<CoreTrustValidationResult> {
  // STEP 1 — structural.
  if (!isMinimalViableObject(envelope)) {
    return fail("structural", null);
  }

  // STEP 2 — identifiers.
  const { domain } = parseOidDomain(envelope.oid);
  if (domain.toLowerCase() !== envelope.publisher.domain.toLowerCase()) {
    return fail("oid-domain-mismatch", null);
  }
  if (!verifyVid(envelope)) {
    return fail("vid-mismatch", null);
  }

  // STEP 3a — Algorithm Registry (fail closed on unrecognized).
  const { algorithmId } = parseSignature(envelope.signature);
  if (!isRecognizedAlgorithm(algorithmId)) {
    return fail("unrecognized-algorithm", null);
  }

  // STEP 3b — Trust Anchor resolution (ONP-0004 Section 6.1).
  const resolution = await resolver.resolve(
    envelope.publisher.domain,
    envelope.publisher.key_id,
    envelope.signed_at
  );
  if (!resolution.resolved) {
    return fail("trust-anchor-resolution-failed", resolution);
  }

  // STEP 3c — algorithm cross-check (ONP-1003 Section 4.5, step 4).
  if (resolution.key.algorithm.toLowerCase() !== algorithmId) {
    return fail("algorithm-mismatch", resolution);
  }

  // STEP 3d — cryptographic verification with the resolved key.
  const publicKey = base64urlDecode(resolution.key.public_key);
  if (!verifySignature(envelope, publicKey)) {
    return fail("signature-invalid", resolution);
  }

  return {
    core_authenticated: true,
    failure_step: null,
    trust_resolution: resolution,
  };
}

function fail(
  step: TrustValidationFailureStep,
  resolution: ResolutionResult | null
): CoreTrustValidationResult {
  return {
    core_authenticated: false,
    failure_step: step,
    trust_resolution: resolution,
  };
}
