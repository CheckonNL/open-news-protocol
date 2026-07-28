/**
 * ONP-1006 Retrieval: canonical Object URL, conditional retrieval,
 * and the retrieve-then-validate pipeline.
 *
 * The Object URL is derived mechanically from the OID (Section 4.1)
 * — the publisher's domain is inside the OID, so no lookup, registry
 * or resolver is involved. Freshness rides standard HTTP conditional
 * requests with the VID as entity tag (Section 4.2, rules 3-4).
 *
 * Retrieval confers ZERO trust: retrieveNewsObject() runs the full
 * Core validation pipeline including Trust Anchor resolution on
 * whatever comes back (Section 5.1 step 5), and confirms the
 * retrieved Object is the one that was asked for (step 6).
 */

import { parseOidDomain } from "./identifiers.js";
import {
  validateCoreWithTrust,
  type CoreTrustValidationResult,
} from "./validate.js";
import type { NewsObjectEnvelope } from "./envelope.js";
import type { TrustAnchorResolver } from "./trust.js";

/** ONP-1006 Section 4.1: derive the canonical Object URL from an OID. */
export function objectUrlFromOid(oid: string): string {
  const { domain, localId } = parseOidDomain(oid);
  return `https://${domain}/.well-known/onp/objects/${localId}`;
}

/** ONP-1006 Section 4.3: derive the OPTIONAL Version URL. */
export function versionUrlFromOid(oid: string, vid: string): string {
  return `${objectUrlFromOid(oid)}/versions/${vid}`;
}

/** ONP-1006 Section 4.2 rule 3: the VID is the natural entity tag. */
export function etagForVid(vid: string): string {
  return `"${vid}"`;
}

/**
 * Minimal HTTP response shape the retrieval algorithm needs.
 * Injectable so tests and embedders supply transport; the default
 * uses global fetch() (HTTPS-only URLs are guaranteed by
 * objectUrlFromOid, and redirects stay within fetch's TLS handling
 * — Section 8.3).
 */
export interface RetrievalResponse {
  status: number;
  etag?: string | null;
  body?: unknown; // parsed JSON when status is 200
}

export type ObjectFetcher = (
  url: string,
  ifNoneMatch?: string
) => Promise<RetrievalResponse>;

export const httpsObjectFetcher: ObjectFetcher = async (url, ifNoneMatch) => {
  const headers: Record<string, string> = {
    accept: "application/onp+json, application/json",
  };
  if (ifNoneMatch) headers["if-none-match"] = ifNoneMatch;
  const res = await fetch(url, { headers, redirect: "follow" });
  if (res.status === 200) {
    return { status: 200, etag: res.headers.get("etag"), body: await res.json() };
  }
  return { status: res.status, etag: res.headers.get("etag") };
};

export type RetrievalOutcome =
  | {
      outcome: "retrieved";
      envelope: NewsObjectEnvelope;
      validation: CoreTrustValidationResult; // core_authenticated is true
    }
  | { outcome: "not-modified" }                // 304: held VID is current
  | { outcome: "not-retrievable"; status: number } // 404 etc., Section 4.2 rule 6
  | {
      outcome: "rejected";
      reason: "oid-mismatch" | "not-an-envelope" | "validation-failed";
      validation?: CoreTrustValidationResult;
    };

/**
 * ONP-1006 Section 5.1: the full retrieval algorithm.
 *
 * @param oid       the Object to retrieve
 * @param resolver  Trust Anchor resolver (ONP-0004) — validation is
 *                  NOT optional; there is deliberately no code path
 *                  that returns bytes without validating them
 *                  (Section 8.1).
 * @param heldVid   optional VID already held; sent as If-None-Match
 */
export async function retrieveNewsObject(
  oid: string,
  resolver: TrustAnchorResolver,
  options: { heldVid?: string; fetcher?: ObjectFetcher } = {}
): Promise<RetrievalOutcome> {
  const fetcher = options.fetcher ?? httpsObjectFetcher;
  const url = objectUrlFromOid(oid); // step 1 (also validates OID shape)

  // Step 2: conditional GET.
  const res = await fetcher(
    url,
    options.heldVid ? etagForVid(options.heldVid) : undefined
  );

  // Step 3: status handling.
  if (res.status === 304) return { outcome: "not-modified" };
  if (res.status !== 200) {
    // 404 means only "not retrievable at this URL" — never a
    // statement about validity or retraction (Section 4.2 rule 6).
    return { outcome: "not-retrievable", status: res.status };
  }

  // Step 4: parse.
  const body = res.body;
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { outcome: "rejected", reason: "not-an-envelope" };
  }
  const envelope = body as NewsObjectEnvelope;

  // Step 5: FULL Core validation incl. Trust Anchor resolution.
  const validation = await validateCoreWithTrust(envelope, resolver);
  if (!validation.core_authenticated) {
    return { outcome: "rejected", reason: "validation-failed", validation };
  }

  // Step 6: the retrieved Object must be the requested one.
  if (envelope.oid !== oid) {
    return { outcome: "rejected", reason: "oid-mismatch", validation };
  }

  return { outcome: "retrieved", envelope, validation };
}
