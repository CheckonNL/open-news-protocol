/**
 * ONP-0004 Trust Model: domain-anchored Trust Anchor resolution.
 *
 * Implements:
 *   - the Publisher Key Record structure (ONP-0004 Section 5.1);
 *   - the Resolution Algorithm (ONP-0004 Section 6.1, steps 1-6);
 *   - key rotation / revocation semantics (ONP-0004 Section 4.4);
 *   - caching with mandatory re-fetch-on-failure (ONP-0004
 *     Section 6.3, rule 2);
 *   - OPTIONAL DNS-corroboration support as a warning-only
 *     fingerprint comparison (ONP-0004 Section 4.3 / Section 6.1
 *     step 7) — the DNS lookup itself is injectable, never required.
 *
 * Design note: fetching is pluggable (KeyRecordFetcher) so that the
 * resolution logic is a pure, testable function and so embedders can
 * supply their own transport, cache policy, or pinned records. The
 * default fetcher uses global fetch() over HTTPS only; TLS/WebPKI
 * validation (Section 4.2, rule 3) is performed by the platform's
 * TLS stack — this module never disables or overrides it.
 */

import { sha256 } from "@noble/hashes/sha2";
import canonicalize from "canonicalize";
import { base64url } from "./identifiers.js";

/** ONP-0004 Section 5.1: one entry in current_keys or previous_keys. */
export interface PublisherKeyEntry {
  key_id: string;
  /** e.g. "Ed25519" (record) — compared case-insensitively to the
   *  signature's algorithm-id per ONP-1003 Section 4.5, step 4. */
  algorithm: string;
  /** base64url-encoded raw public key. */
  public_key: string;
  valid_from: string;
  /** REQUIRED on previous_keys entries (Section 4.4, rule 2). */
  valid_until?: string;
  /** Section 4.4, rule 4. */
  revoked_at?: string | null;
}

/** ONP-0004 Section 5.1: the Publisher Key Record. */
export interface PublisherKeyRecord {
  onp_trust_anchor_type: "domain";
  publisher_domain: string;
  current_keys: PublisherKeyEntry[];
  previous_keys?: PublisherKeyEntry[];
  transparency_log?: { log_url: string; entry_id?: string };
  rotation_continuity_signature?: string;
  [key: string]: unknown;
}

export type ResolutionFailureReason =
  | "record-fetch-failed"       // Section 6.1 steps 1-2
  | "record-invalid"            // Section 6.1 step 3
  | "record-domain-mismatch"    // record claims a different publisher_domain
  | "key-unknown"               // Section 6.1 step 6: key in neither set
  | "outside-validity-window"   // Section 6.1 step 5 window check failed
  | "key-revoked";              // Section 4.4, rule 4

export interface ResolutionSuccess {
  resolved: true;
  /** The matched key entry; its public_key is what ONP-1003 Section
   *  4.5 step 6 verifies against. */
  key: PublisherKeyEntry;
  /** Whether the key was found in current_keys or previous_keys. */
  matched_in: "current_keys" | "previous_keys";
  /** Warning-only corroboration signals (Section 6.1 steps 7-8). */
  warnings: string[];
}

export interface ResolutionFailure {
  resolved: false;
  reason: ResolutionFailureReason;
  warnings: string[];
}

export type ResolutionResult = ResolutionSuccess | ResolutionFailure;

/**
 * Structural check of a fetched Publisher Key Record (Section 6.1
 * step 3, "Parse the Publisher Key Record").
 */
export function isPublisherKeyRecord(x: unknown): x is PublisherKeyRecord {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return (
    r.onp_trust_anchor_type === "domain" &&
    typeof r.publisher_domain === "string" &&
    Array.isArray(r.current_keys) &&
    (r.previous_keys === undefined || Array.isArray(r.previous_keys)) &&
    (r.current_keys as unknown[]).every(isKeyEntry) &&
    ((r.previous_keys as unknown[] | undefined) ?? []).every(isKeyEntry)
  );
}

function isKeyEntry(x: unknown): x is PublisherKeyEntry {
  if (typeof x !== "object" || x === null) return false;
  const e = x as Record<string, unknown>;
  return (
    typeof e.key_id === "string" &&
    typeof e.algorithm === "string" &&
    typeof e.public_key === "string" &&
    typeof e.valid_from === "string"
  );
}

/**
 * ONP-0004 Section 6.1, steps 3-6: the pure resolution decision.
 * Given an already-fetched record, decide whether key K was
 * authorized for this publisher at claimed signing time T.
 *
 * Timestamps are compared as RFC 3339 instants; a malformed
 * timestamp in the record fails closed (record-invalid), a
 * malformed signedAt fails closed (outside-validity-window can
 * never be satisfied).
 */
export function resolveAgainstRecord(
  record: PublisherKeyRecord,
  expectedDomain: string,
  keyId: string,
  signedAt: string,
  warnings: string[] = []
): ResolutionResult {
  // Guard: the fetched record must be about the domain the Object
  // claims (case-insensitive, per DNS name semantics). A record
  // served for the wrong publisher_domain is a substitution.
  if (
    record.publisher_domain.toLowerCase() !== expectedDomain.toLowerCase()
  ) {
    return { resolved: false, reason: "record-domain-mismatch", warnings };
  }

  // Step 4: K in current_keys -> SUCCEED.
  const current = record.current_keys.find((k) => k.key_id === keyId);
  if (current) {
    return { resolved: true, key: current, matched_in: "current_keys", warnings };
  }

  // Step 5: K in previous_keys AND valid_from <= T <= valid_until
  //         AND (revoked_at null OR T < revoked_at) -> SUCCEED.
  const previous = (record.previous_keys ?? []).find(
    (k) => k.key_id === keyId
  );
  if (previous) {
    const t = Date.parse(signedAt);
    const from = Date.parse(previous.valid_from);
    const until =
      previous.valid_until !== undefined
        ? Date.parse(previous.valid_until)
        : NaN;
    if (Number.isNaN(from) || Number.isNaN(until)) {
      // Section 4.4 rule 2 REQUIRES both bounds on previous keys;
      // a record violating that is not interpretable -> fail closed.
      return { resolved: false, reason: "record-invalid", warnings };
    }
    if (Number.isNaN(t) || t < from || t > until) {
      return { resolved: false, reason: "outside-validity-window", warnings };
    }
    if (previous.revoked_at != null) {
      const revokedAt = Date.parse(previous.revoked_at);
      if (Number.isNaN(revokedAt)) {
        return { resolved: false, reason: "record-invalid", warnings };
      }
      // Section 4.4 rule 4: "at or after revoked_at" -> untrusted.
      if (t >= revokedAt) {
        return { resolved: false, reason: "key-revoked", warnings };
      }
    }
    return { resolved: true, key: previous, matched_in: "previous_keys", warnings };
  }

  // Step 6: neither set -> FAIL.
  return { resolved: false, reason: "key-unknown", warnings };
}

/**
 * A fetcher returns the parsed JSON body of
 * https://{domain}/.well-known/onp/publisher.json, or throws.
 * Injectable so tests and embedders can supply records without
 * network access; the resolution semantics above never change.
 */
export type KeyRecordFetcher = (domain: string) => Promise<unknown>;

/**
 * Default fetcher (ONP-0004 Section 4.2, rules 2-3): HTTPS only, at
 * the .well-known path. WebPKI/TLS validation is done by the
 * platform; any TLS failure surfaces as a thrown error here, which
 * resolveTrustAnchor maps to record-fetch-failed (fail closed).
 */
export const httpsKeyRecordFetcher: KeyRecordFetcher = async (domain) => {
  const url = `https://${domain}/.well-known/onp/publisher.json`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Publisher Key Record fetch failed: HTTP ${res.status}`);
  }
  return res.json();
};

/** Optional DNS corroboration hook (Section 4.3): returns the
 *  fingerprint published at _onp.{domain}, or null if absent.
 *  Never required; absence MUST NOT fail resolution (rule 3). */
export type DnsFingerprintLookup = (domain: string) => Promise<string | null>;

/**
 * Record Fingerprint of a Publisher Key Record for DNS corroboration,
 * per ONP-0004 v0.2.0 Section 4.3 rule 4: sha-256 over the UTF-8
 * bytes of the JCS (RFC 8785) canonicalization of the PARSED record
 * (never the served bytes), base64url unpadded, labeled with the
 * Algorithm Registry identifier form ("sha-256").
 */
export function keyRecordFingerprint(record: PublisherKeyRecord): string {
  const canonical = canonicalize(record);
  if (canonical === undefined) {
    throw new Error("Canonicalization of Publisher Key Record failed");
  }
  const digest = sha256(new TextEncoder().encode(canonical));
  return `sha-256:${base64url(digest)}`;
}

export interface TrustAnchorResolverOptions {
  fetcher?: KeyRecordFetcher;
  /** Cache TTL in milliseconds (Section 6.3, rule 3 leaves the value
   *  to the Node; default 5 minutes). 0 disables caching. */
  cacheTtlMs?: number;
  /** Optional DNS corroboration (Section 4.3). */
  dnsLookup?: DnsFingerprintLookup;
  /** Injectable clock, for tests. */
  now?: () => number;
}

interface CacheEntry {
  record: PublisherKeyRecord;
  fetchedAt: number;
}

/**
 * Stateful resolver: fetch + cache + resolve.
 *
 * Implements ONP-0004 Section 6.3 rule 2 exactly: when resolution
 * FAILS against a cached copy, the resolver MUST re-fetch once and
 * re-evaluate before returning failure — a legitimate rotation the
 * cache has not yet observed must not cause a false rejection.
 */
export class TrustAnchorResolver {
  private fetcher: KeyRecordFetcher;
  private cacheTtlMs: number;
  private dnsLookup?: DnsFingerprintLookup;
  private now: () => number;
  private cache = new Map<string, CacheEntry>();

  constructor(options: TrustAnchorResolverOptions = {}) {
    this.fetcher = options.fetcher ?? httpsKeyRecordFetcher;
    this.cacheTtlMs = options.cacheTtlMs ?? 5 * 60 * 1000;
    this.dnsLookup = options.dnsLookup;
    this.now = options.now ?? Date.now;
  }

  /** ONP-0004 Section 6.1, the full algorithm. */
  async resolve(
    domain: string,
    keyId: string,
    signedAt: string
  ): Promise<ResolutionResult> {
    const warnings: string[] = [];
    const cacheKey = domain.toLowerCase();

    // Steps 1-3: obtain a parsed record (cache-aware).
    let entry = this.cachedEntry(cacheKey);
    let fromCache = entry !== null;
    if (!entry) {
      const fetched = await this.fetchRecord(domain);
      if (!fetched.ok) return { resolved: false, reason: fetched.reason, warnings };
      entry = { record: fetched.record, fetchedAt: this.now() };
      if (this.cacheTtlMs > 0) this.cache.set(cacheKey, entry);
    }

    // Steps 4-6.
    let result = resolveAgainstRecord(
      entry.record, domain, keyId, signedAt, warnings
    );

    // Section 6.3 rule 2: failure against a cached copy -> MUST
    // re-fetch before treating the Object as untrusted.
    if (!result.resolved && fromCache) {
      const refetched = await this.fetchRecord(domain);
      if (refetched.ok) {
        entry = { record: refetched.record, fetchedAt: this.now() };
        if (this.cacheTtlMs > 0) this.cache.set(cacheKey, entry);
        result = resolveAgainstRecord(
          entry.record, domain, keyId, signedAt, warnings
        );
      }
      // If the re-fetch itself fails, the cached-copy failure stands.
    }

    // Step 7 (OPTIONAL, warning-only): DNS corroboration.
    if (this.dnsLookup) {
      try {
        const dnsFp = await this.dnsLookup(domain);
        if (dnsFp !== null) {
          const recordFp = keyRecordFingerprint(entry.record);
          if (dnsFp !== recordFp) {
            result.warnings.push(
              `dns-fingerprint-mismatch: _onp.${domain} says ${dnsFp}, ` +
                `fetched record is ${recordFp} (ONP-0004 Section 4.3: ` +
                `warning, not failure)`
            );
          }
        }
      } catch {
        // Section 4.3 rule 3: DNS absence/failure never fails resolution.
      }
    }

    return result;
  }

  private cachedEntry(cacheKey: string): CacheEntry | null {
    if (this.cacheTtlMs <= 0) return null;
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;
    if (this.now() - entry.fetchedAt > this.cacheTtlMs) {
      this.cache.delete(cacheKey);
      return null;
    }
    return entry;
  }

  private async fetchRecord(
    domain: string
  ): Promise<
    | { ok: true; record: PublisherKeyRecord }
    | { ok: false; reason: ResolutionFailureReason }
  > {
    let body: unknown;
    try {
      body = await this.fetcher(domain);
    } catch {
      return { ok: false, reason: "record-fetch-failed" };
    }
    if (!isPublisherKeyRecord(body)) {
      return { ok: false, reason: "record-invalid" };
    }
    return { ok: true, record: body };
  }
}
