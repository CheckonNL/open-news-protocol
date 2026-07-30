/**
 * ONP aggregator / consumer Node (ONP-0001 Section 6.3 network model).
 *
 * This is the Node role the SDK did not yet embody: pulling Objects
 * from MANY publishers and presenting a single, verified timeline. It
 * closes the `Publisher Node -> Signed Object -> Other Nodes ->
 * Applications` loop.
 *
 * The design is the whole point of "trust the Object, not the
 * Messenger": discovery is untrusted. Feeds are ordinary RSS/Atom that
 * carry `<onp:object>` pointers (ONP-1006 Section 4.4); the aggregator
 * follows those pointers, but trusts NOTHING it finds until each Object
 * passes full Core validation, including Trust Anchor resolution
 * (ONP-1003 Section 4.5). A hostile or broken feed cannot inject an
 * unauthentic Object into the timeline — it can only waste a fetch.
 *
 * Fetching is injectable (feeds and Objects), so the whole thing is a
 * pure, offline-testable function; the default fetchers use global
 * `fetch()` and keep the module runtime-agnostic (no `node:` imports).
 */

import {
  validateCoreWithTrust,
  type CoreTrustValidationResult,
} from "./validate.js";
import type { NewsObjectEnvelope } from "./envelope.js";
import type { TrustAnchorResolver } from "./trust.js";

/**
 * Extract the ONP-1006 Section 4.4 `<onp:object>` Object URLs from a
 * feed. Deliberately minimal (a reference aggregator, not a hardened
 * feed parser): it reads the pointers and lets validation, not parsing,
 * be the security boundary.
 */
export function extractObjectUrls(feedXml: string): string[] {
  const urls: string[] = [];
  // Capture everything up to the next '<', then trim in code. A single
  // `[^<]*` quantifier bounded by literals matches in linear time —
  // unlike the earlier `\s*(...)\s*` form, whose overlapping whitespace
  // matching allowed polynomial backtracking (ReDoS, CodeQL
  // js/polynomial-redos) on adversarial feed input.
  const re = /<onp:object>([^<]*)<\/onp:object>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(feedXml)) !== null) {
    const url = m[1].trim();
    if (url) urls.push(url);
  }
  return urls;
}

/** An authenticated Object placed in the aggregated timeline. */
export interface AggregatedItem {
  /** The feed pointer it was discovered through (untrusted). */
  url: string;
  envelope: NewsObjectEnvelope;
  /** The verification outcome; core_authenticated is always true here. */
  validation: CoreTrustValidationResult;
}

/** An Object that was discovered but did not make it into the timeline. */
export interface AggregationRejection {
  url: string;
  reason: "fetch-failed" | "not-an-envelope" | "validation-failed";
  validation?: CoreTrustValidationResult;
}

export interface AggregationResult {
  /** Authenticated Objects, newest `signed_at` first, deduplicated by OID. */
  items: AggregatedItem[];
  /** Everything discovered that failed, with why. */
  rejected: AggregationRejection[];
}

export type FeedFetcher = (url: string) => Promise<string>;
export type ObjectJsonFetcher = (url: string) => Promise<unknown>;

export interface AggregateOptions {
  feedFetcher?: FeedFetcher;
  objectFetcher?: ObjectJsonFetcher;
}

const defaultFeedFetcher: FeedFetcher = async (url) => {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
};

const defaultObjectFetcher: ObjectJsonFetcher = async (url) => {
  const res = await fetch(url, {
    headers: { accept: "application/onp+json, application/json" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

/**
 * Build a verified, multi-publisher timeline from a set of feed URLs.
 *
 * Fetches each feed, follows its `<onp:object>` pointers, fully
 * validates every referenced Object (Trust Anchor resolution included),
 * and returns only the authenticated ones — newest first, one per OID.
 * Discovery order and feed trustworthiness never affect the outcome;
 * only the signature does.
 */
export async function aggregate(
  feedUrls: string[],
  resolver: TrustAnchorResolver,
  options: AggregateOptions = {}
): Promise<AggregationResult> {
  const feedFetcher = options.feedFetcher ?? defaultFeedFetcher;
  const objectFetcher = options.objectFetcher ?? defaultObjectFetcher;

  // 1. Discover Object URLs across all feeds (deduplicated).
  const objectUrls = new Set<string>();
  for (const feedUrl of feedUrls) {
    try {
      const xml = await feedFetcher(feedUrl);
      for (const u of extractObjectUrls(xml)) objectUrls.add(u);
    } catch {
      // A broken feed contributes nothing; it is not itself an Object
      // rejection. Discovery is best-effort.
    }
  }

  const authenticated: AggregatedItem[] = [];
  const rejected: AggregationRejection[] = [];

  // 2. Retrieve and validate every discovered Object.
  for (const url of objectUrls) {
    let body: unknown;
    try {
      body = await objectFetcher(url);
    } catch {
      rejected.push({ url, reason: "fetch-failed" });
      continue;
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      rejected.push({ url, reason: "not-an-envelope" });
      continue;
    }
    const envelope = body as NewsObjectEnvelope;
    const validation = await validateCoreWithTrust(envelope, resolver);
    if (!validation.core_authenticated) {
      rejected.push({ url, reason: "validation-failed", validation });
      continue;
    }
    authenticated.push({ url, envelope, validation });
  }

  // 3. Deduplicate by OID (keep the newest signed_at), then sort the
  //    timeline newest first.
  const byOid = new Map<string, AggregatedItem>();
  for (const item of authenticated) {
    const oid = item.envelope.oid;
    const existing = byOid.get(oid);
    if (!existing || item.envelope.signed_at > existing.envelope.signed_at) {
      byOid.set(oid, item);
    }
  }
  const items = [...byOid.values()].sort((a, b) =>
    a.envelope.signed_at < b.envelope.signed_at ? 1 : a.envelope.signed_at > b.envelope.signed_at ? -1 : 0
  );

  return { items, rejected };
}
