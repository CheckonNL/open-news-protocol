/**
 * ONP create-side helper: the one-call counterpart to validateCore.
 *
 * Assembling a signed News Object is a fixed two-step procedure the
 * specs pin down exactly, and it MUST happen in this order:
 *
 *   1. ONP-1001 Section 4.3: compute the VID over the vid-preimage
 *      (the envelope minus vid and signature).
 *   2. ONP-1003 Section 4.4: sign the signing-preimage (the envelope,
 *      now carrying its vid, minus signature).
 *
 * Doing it by hand means three easy-to-misorder lines and a cast at
 * every call site. signObject() encapsulates that once, so callers get
 * a fully typed NewsObjectEnvelope from an UnsignedEnvelope in a single
 * call. Together, signObject (create) and validateCore (verify) are the
 * complete round trip.
 */

import { computeVid } from "./identifiers.js";
import { signEnvelope } from "./signatures.js";
import type { UnsignedEnvelope, NewsObjectEnvelope } from "./envelope.js";

/**
 * Compute the VID, then sign, producing a complete, signed News Object.
 *
 * The lone assertion below is the price of NewsObjectEnvelope's
 * `[key: string]: unknown` index signature: spreading an
 * UnsignedEnvelope widens its known fields to `unknown`, so the
 * structural match to NewsObjectEnvelope cannot be inferred. The value
 * is correct by construction — every REQUIRED field is present — which
 * is why the assertion lives here, once, rather than at each call site.
 */
export function signObject(
  unsigned: UnsignedEnvelope,
  privateKey: Uint8Array,
  algorithmId = "ed25519"
): NewsObjectEnvelope {
  const vid = computeVid(unsigned);
  const withVid = { ...unsigned, vid };
  const signature = signEnvelope(withVid, privateKey, algorithmId);
  return { ...withVid, signature } as NewsObjectEnvelope;
}
