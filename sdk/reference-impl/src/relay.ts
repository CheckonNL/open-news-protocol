/**
 * ONP relay Node (ONP-0001 Section 6.3): an untrusted intermediary that
 * ingests, stores, and re-serves News Objects — cache, mirror, index —
 * WITHOUT ever conferring trust.
 *
 * The whole point of "trust the Object, not the Messenger" is that a
 * relay can be run by anyone, even an adversary: every consumer
 * re-verifies each Object, so a relay cannot smuggle in a forgery — it
 * can only fail to be useful. A relay MAY cache, forward, or index, but
 * MUST NOT be trusted (Section 6.3).
 *
 * This relay verifies on ingest so its index stays clean, and stores
 * the Object's exact bytes so the signature still verifies downstream.
 * It keeps the newest Version per OID, can mirror an Object by OID, can
 * list what it holds (a cross-publisher index — the discovery role no
 * single publisher can play), and can emit a combined `<onp:object>`
 * feed that an aggregator Node consumes exactly like any other feed —
 * closing the loop `publisher -> relay (index) -> aggregator (verify)`.
 */

import { validateCoreWithTrust } from "./validate.js";
import { objectUrlFromOid } from "./retrieval.js";
import type { NewsObjectEnvelope } from "./envelope.js";
import type { TrustAnchorResolver } from "./trust.js";

export interface RelayEntry {
  oid: string;
  vid: string;
  publisherDomain: string;
  signedAt: string;
  envelope: NewsObjectEnvelope;
}

export type RelayIngestResult =
  | { ingested: true; replacedPrevious: boolean }
  | { ingested: false; reason: "not-authenticated" | "older-than-held" };

export interface RelayQuery {
  /** Restrict to these publisher domains (case-insensitive). */
  domains?: string[];
  /** Cap the number of returned entries. */
  limit?: number;
}

/**
 * An in-memory relay index. Storage is intentionally pluggable-shaped
 * (a Map here); a production relay would persist, but the semantics —
 * verify on ingest, keep newest per OID, never confer trust — are the
 * same.
 */
export class Relay {
  private byOid = new Map<string, RelayEntry>();

  constructor(private readonly resolver: TrustAnchorResolver) {}

  /**
   * Verify an Object and, if authentic and newer than what is held for
   * its OID, store it. An unauthentic Object is never stored — but note
   * that this is a cleanliness measure, not the trust boundary: the
   * guarantee is that consumers re-verify whatever the relay serves.
   */
  async ingest(envelope: NewsObjectEnvelope): Promise<RelayIngestResult> {
    const validation = await validateCoreWithTrust(envelope, this.resolver);
    if (!validation.core_authenticated) {
      return { ingested: false, reason: "not-authenticated" };
    }
    const existing = this.byOid.get(envelope.oid);
    if (existing && existing.signedAt >= envelope.signed_at) {
      return { ingested: false, reason: "older-than-held" };
    }
    this.byOid.set(envelope.oid, {
      oid: envelope.oid,
      vid: envelope.vid,
      publisherDomain: envelope.publisher.domain,
      signedAt: envelope.signed_at,
      envelope,
    });
    return { ingested: true, replacedPrevious: existing !== undefined };
  }

  /** Mirror: the exact held Object for an OID, or null. */
  get(oid: string): NewsObjectEnvelope | null {
    return this.byOid.get(oid)?.envelope ?? null;
  }

  /** Index: held Objects, newest `signed_at` first, optionally filtered. */
  query(options: RelayQuery = {}): RelayEntry[] {
    let entries = [...this.byOid.values()];
    if (options.domains) {
      const allow = new Set(options.domains.map((d) => d.toLowerCase()));
      entries = entries.filter((e) => allow.has(e.publisherDomain.toLowerCase()));
    }
    entries.sort((a, b) =>
      a.signedAt < b.signedAt ? 1 : a.signedAt > b.signedAt ? -1 : 0
    );
    return options.limit !== undefined ? entries.slice(0, options.limit) : entries;
  }

  /**
   * A combined RSS feed carrying an `<onp:object>` pointer per held
   * Object (ONP-1006 Section 4.4). An aggregator Node consumes this the
   * same way it consumes any publisher's feed — the relay just widens
   * the discovery surface across publishers.
   */
  feed(): string {
    const items = this.query()
      .map((e) => `  <item><onp:object>${objectUrlFromOid(e.oid)}</onp:object></item>`)
      .join("\n");
    return (
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<rss version="2.0" xmlns:onp="https://opennewsprotocol.org/ns/feed">\n' +
      "<channel>\n" +
      "  <title>ONP relay index</title>\n" +
      items +
      "\n</channel>\n</rss>"
    );
  }

  /** How many distinct Objects the relay currently holds. */
  size(): number {
    return this.byOid.size;
  }
}
