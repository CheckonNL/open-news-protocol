/**
 * Signature algorithm registry (ONP-0005 Appendix A / ONP-1003).
 *
 * A News Object's signature string is `onp:sig:<algorithm-id>:<bytes>`
 * (ONP-1003 Section 4.1), so verification is inherently keyed by the
 * algorithm-id. This registry makes that explicit: each algorithm is a
 * small provider (generate / sign / verify over raw byte keys), looked
 * up by the exact id that appears in the signature string.
 *
 * Ed25519 is the required-baseline provider, registered by default
 * below. Adding ECDSA-P256 (ONP-0005 Appendix A lists it as
 * `recommended`, and the EUDI / eIDAS / digital-euro ecosystems use it)
 * or a post-quantum algorithm later is a `registerSignatureAlgorithm`
 * call plus one provider file — never a change to the signing,
 * verification, or validation pipelines, which only ever ask this
 * registry for a provider by id.
 *
 * Keys are raw bytes (`Uint8Array`), not a platform key handle, so the
 * whole SDK stays runtime-agnostic (Node, browser, Deno, edge, wallet)
 * — the property ONP-0004's `.well-known` records already assume, since
 * they carry base64url raw public keys.
 */

import { ed25519Algorithm } from "./algorithms/ed25519.js";

/** One entry in the registry: sign/verify over raw byte keys. */
export interface SignatureAlgorithm {
  /** The algorithm-id exactly as it appears in `onp:sig:<id>:...`. */
  readonly id: string;
  /** Fresh keypair as raw bytes (private, public). */
  generateKeypair(): { privateKey: Uint8Array; publicKey: Uint8Array };
  /** Detached signature over `message` with a raw private key. */
  sign(message: Uint8Array, privateKey: Uint8Array): Uint8Array;
  /**
   * Verify a detached signature. MUST return `false` — never throw —
   * on malformed signature or key bytes, so callers can fail closed.
   */
  verify(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean;
}

const REGISTRY = new Map<string, SignatureAlgorithm>([
  [ed25519Algorithm.id, ed25519Algorithm],
]);

/** Register (or replace) a signature algorithm provider by its id. */
export function registerSignatureAlgorithm(algo: SignatureAlgorithm): void {
  REGISTRY.set(algo.id, algo);
}

/** The provider for an algorithm-id, or undefined if unrecognized. */
export function getSignatureAlgorithm(id: string): SignatureAlgorithm | undefined {
  return REGISTRY.get(id);
}

/** Ids of every currently registered algorithm (the recognized set). */
export function registeredAlgorithmIds(): string[] {
  return [...REGISTRY.keys()];
}
