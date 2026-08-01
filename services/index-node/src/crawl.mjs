#!/usr/bin/env node
/**
 * Prototype index-node crawl (ONP-2900 §4.8 forward reference).
 *
 * Deliberately NOT a directory-enumeration crawler — ONP-1006 §8.4 forbids
 * exactly that ("no enumeration endpoint... would smuggle a discovery
 * protocol into a retrieval convention"). Instead this reads each seed
 * publisher's already-existing RSS/Atom feed (ONP-1006 §4.4), extracts the
 * Object URLs it carries, fetches each one, and keeps only those that are
 * a) a valid, Trust-Anchor-resolved Endorsement Object (ONP-2900), b)
 * whose own Core signature verifies. Everything else is silently skipped —
 * a broken or unreachable feed/object must never crash the whole crawl.
 *
 * Output is a single flat JSON file, keyed by the endorsed target_ref
 * (VID), so it stays a "dumb", fully exportable dataset — a mirror only
 * needs to copy this file, never re-derive it, per the design discussed
 * for keeping the index cheap to replicate and not a single point of
 * control.
 *
 * Usage:
 *   node src/crawl.mjs [config.json] [index.json]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { validateCoreWithTrust, TrustAnchorResolver } from "open-news-protocol";
import { extractObjectUrls } from "./feed-parser.mjs";

/** Crawl one publisher's feed; returns the Endorsement entries it carries that verify. */
export async function crawlFeed(feedUrl, { fetcher = fetch, resolver } = {}) {
  const res = await fetcher(feedUrl);
  if (!res.ok) throw new Error(`feed fetch failed: HTTP ${res.status}`);
  const xml = await res.text();
  const objectUrls = extractObjectUrls(xml);

  const entries = [];
  for (const url of objectUrls) {
    try {
      const objRes = await fetcher(url);
      if (!objRes.ok) continue;
      const env = await objRes.json();
      if (env?.content_type !== "onp:companion:endorsement") continue;

      const targetRef = env.content?.target_ref;
      if (typeof targetRef !== "string") continue;

      const validation = await validateCoreWithTrust(env, resolver);
      if (!validation.core_authenticated) continue;

      entries.push({
        endorsementOid: env.oid,
        endorserDomain: env.publisher?.domain,
        targetRef,
        stance: env.content?.stance,
        rationale: env.content?.rationale,
        endorsedAt: env.content?.endorsed_at,
      });
    } catch {
      continue; // unreachable or malformed — skip, never abort the whole crawl
    }
  }
  return entries;
}

/** Crawl every seed and fold the results into one target_ref -> entries[] index. */
export async function buildIndex(seeds, { fetcher, resolver } = {}) {
  const activeResolver = resolver ?? new TrustAnchorResolver();
  const byTarget = new Map();

  for (const seed of seeds) {
    const entries = await crawlFeed(seed.feedUrl, { fetcher, resolver: activeResolver });
    for (const entry of entries) {
      if (!byTarget.has(entry.targetRef)) byTarget.set(entry.targetRef, []);
      byTarget.get(entry.targetRef).push(entry);
    }
  }

  return Object.fromEntries(byTarget);
}

async function main() {
  const configPath = process.argv[2] ?? new URL("../config.example.json", import.meta.url).pathname;
  const outPath = process.argv[3] ?? new URL("../index.json", import.meta.url).pathname;

  const seeds = JSON.parse(readFileSync(configPath, "utf8"));
  const index = await buildIndex(seeds);

  writeFileSync(outPath, JSON.stringify(index, null, 2) + "\n");
  const total = Object.values(index).reduce((n, arr) => n + arr.length, 0);
  console.log(`Wrote ${outPath} — ${total} endorsement(s) across ${Object.keys(index).length} target(s).`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error("crawl failed:", e.message);
    process.exit(1);
  });
}
