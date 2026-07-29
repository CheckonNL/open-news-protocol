/**
 * ONP-1001 Identifiers.
 *
 * OID:  onp:oid:<domain>:<local-id>          (Section 4.1)
 * VID:  onp:vid:<hash-algorithm-id>:<digest>  (Section 4.3)
 */

import { sha256 } from "@noble/hashes/sha2";
import { base64urlnopad } from "@scure/base";
import { buildPreImage, preImageBytes } from "./preimage.js";

const LOCAL_ID_RE = /^[a-z0-9-]{1,128}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** ONP-1001 Section 4.1: build an OID from a publisher domain and Local Identifier. */
export function buildOid(domain: string, localId: string): string {
  if (!LOCAL_ID_RE.test(localId) && !UUID_RE.test(localId)) {
    throw new Error(
      `Local Identifier "${localId}" does not match the required grammar (ONP-1001 Appendix A)`
    );
  }
  return `onp:oid:${domain}:${localId}`;
}

/** ONP-1001 Section 6.1, step 1: parse an OID and confirm its domain matches. */
export function parseOidDomain(oid: string): { domain: string; localId: string } {
  const m = /^onp:oid:([^:]+):(.+)$/.exec(oid);
  if (!m) throw new Error(`Malformed OID: ${oid}`);
  return { domain: m[1], localId: m[2] };
}

/**
 * ONP-1001 Section 4.3: compute a VID.
 *   1. Build the vid-preimage (envelope minus vid, signature).
 *   2. Hash with the required-baseline algorithm (sha-256, ONP-0005
 *      Appendix A).
 *   3. vid = "onp:vid:" + algorithm-id + ":" + base64url(digest)
 */
export function computeVid(envelope: Record<string, unknown>): string {
  const preImage = buildPreImage(envelope, "vid-preimage");
  const digest = sha256(preImageBytes(preImage));
  return `onp:vid:sha-256:${base64url(digest)}`;
}

/** ONP-1001 Section 6.1, steps 3-4: recompute and compare a declared VID. */
export function verifyVid(envelope: Record<string, unknown> & { vid: string }): boolean {
  const recomputed = computeVid(envelope);
  return recomputed === envelope.vid;
}

/** ONP-1001 Appendix A: parse a VID into its algorithm id and digest. */
export function parseVid(vid: string): { algorithmId: string; digest: string } {
  const m = /^onp:vid:([a-z0-9-]{1,32}):(.+)$/.exec(vid);
  if (!m) throw new Error(`Malformed VID: ${vid}`);
  return { algorithmId: m[1], digest: m[2] };
}

export function base64url(buf: Uint8Array): string {
  return base64urlnopad.encode(buf);
}

export function base64urlDecode(s: string): Uint8Array {
  return base64urlnopad.decode(s);
}
