/**
 * ONP-1002 Serialization: Pre-Image construction.
 *
 * Implements ONP-1002 Section 4.2's exact procedure:
 *   1. Start from the complete envelope.
 *   2. Remove every top-level key in the Profile's excluded-field set
 *      entirely (not set to null — absent).
 *   3. Apply JCS (RFC 8785) to the remaining structure.
 *   4. The resulting bytes are the Pre-Image.
 *
 * Uses the `canonicalize` package (RFC 8785 reference implementation,
 * written by one of the RFC's own authors), per Principle P3
 * (Ordinary Technology, ONP-0003): reuse an existing, already-
 * specified standard rather than a bespoke canonicalizer.
 */

import canonicalize from "canonicalize";

/** ONP-1002 Section 4.3: the two Profiles defined so far. */
export const PRE_IMAGE_PROFILES = {
  /** ONP-1001 Section 4.3: excludes vid and signature. */
  "vid-preimage": ["vid", "signature"],
  /** ONP-1003 Section 4.1: excludes signature only. */
  "signing-preimage": ["signature"],
} as const;

export type PreImageProfileName = keyof typeof PRE_IMAGE_PROFILES;

/**
 * ONP-1002 Section 4.2: construct a Pre-Image by excluding the named
 * Profile's fields, then canonicalizing (JCS) what remains.
 *
 * Returns the canonical JSON string. Callers hash or sign the UTF-8
 * bytes of this string, per ONP-1001 Section 4.3 / ONP-1003 Section
 * 4.1.
 */
export function buildPreImage(
  envelope: Record<string, unknown>,
  profile: PreImageProfileName
): string {
  const excluded = new Set<string>(PRE_IMAGE_PROFILES[profile]);
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(envelope)) {
    if (!excluded.has(key)) {
      filtered[key] = value;
    }
  }
  const result = canonicalize(filtered);
  if (result === undefined) {
    throw new Error("Canonicalization produced undefined output (empty or invalid envelope)");
  }
  return result;
}

/** UTF-8 bytes of a Pre-Image string, ready for hashing or signing. */
export function preImageBytes(preImage: string): Uint8Array {
  return new TextEncoder().encode(preImage);
}
