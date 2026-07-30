/**
 * Capstone example: the whole ONP loop in one runnable file.
 *
 *   publish (sign)  ->  distribute (RSS feed with <onp:object>)  ->
 *   aggregate (consumer Node pulls the feed)  ->  verify  ->  timeline
 *
 * Two independent publishers each sign an Article; their feeds are
 * carried by a shared aggregator; a hostile relay plants a forged
 * Object into that feed. The aggregator trusts NOTHING it is handed
 * until each Object passes full Core validation — so the forgery is
 * rejected while the genuine Objects form a verified, newest-first
 * timeline. One publisher additionally carries an EUDI attestation, so
 * its entry is elevated with a wallet-verified legal identity.
 *
 * Everything runs in memory (no server, no network): transport is
 * injected, exactly as the aggregator's design allows.
 *
 * Run with:  npm run capstone
 */

import {
  generateKeypair,
  signObject,
  buildOid,
  base64url,
  objectUrlFromOid,
  toRssItem,
  rssItemToXml,
  TrustAnchorResolver,
  aggregate,
  type NewsObjectEnvelope,
  type PublisherKeyRecord,
  type EudiAttestationVerifier,
} from "../src/index.js";

function makePublisher(domain: string, keyId: string) {
  const kp = generateKeypair();
  const record: PublisherKeyRecord = {
    onp_trust_anchor_type: "domain",
    publisher_domain: domain,
    current_keys: [
      { key_id: keyId, algorithm: "Ed25519", public_key: base64url(kp.publicKey), valid_from: "2026-01-01T00:00:00Z" },
    ],
    previous_keys: [],
  };
  return { domain, keyId, kp, record };
}

type Publisher = ReturnType<typeof makePublisher>;

function article(pub: Publisher, localId: string, signedAt: string, headline: string, dek: string): NewsObjectEnvelope {
  return signObject(
    {
      oid: buildOid(pub.domain, localId),
      publisher: { domain: pub.domain, key_id: pub.keyId },
      signed_at: signedAt,
      content_type: "onp:companion:article",
      content: { headline, dek, byline: ["Redactie"], section: "Politiek", canonical_url: `https://${pub.domain}/${localId}` },
    },
    pub.kp.privateKey,
    "ed25519"
  );
}

function feedXml(itemXml: string[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:onp="https://opennewsprotocol.org/ns/feed" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "<channel>",
    "  <title>Aggregated regional news</title>",
    ...itemXml,
    "</channel>",
    "</rss>",
  ].join("\n");
}

async function main() {
  // ── STEP 1: two independent publishers each sign an Article ──────────
  const rp = makePublisher("regiopurmerend.nl", "onp:key:2026");
  const other = makePublisher("nieuws.example", "onp:key:2026");

  // regiopurmerend.nl additionally publishes an EUDI attestation binding
  // its signing key to a wallet-verified legal identity (Stage 1).
  rp.record.eudi_attestation = {
    format: "sd-jwt-vc",
    credential: "<wallet-issued verifiable credential>",
    binds: { key_id: rp.keyId, publisher_domain: rp.domain },
  };

  const a1 = article(rp, "fusie-onderzoek", "2026-07-28T10:00:00Z", "Fusie-onderzoek Purmerend gepubliceerd", "Necker van Naem publiceert de budgetanalyse.");
  const a2 = article(other, "begroting-2027", "2026-07-29T09:00:00Z", "Raad stemt over de begroting 2027", "Sluitende begroting met bezuiniging op groenbeheer.");
  console.log("STEP 1 — signed 2 Articles from 2 publishers.");

  // ── STEP 2: publishers expose RSS feeds carrying <onp:object> ────────
  const genuineItems = [a1, a2].map((e) => rssItemToXml(toRssItem(e)));

  // A hostile relay plants a forged pointer: same OID as a1, but the
  // Object served has tampered content.
  const forged: NewsObjectEnvelope = { ...a1, content: { ...a1.content, headline: "NEP: Purmerend stapt uit de EU" } };
  const forgedUrl = "https://regiopurmerend.nl/.well-known/onp/objects/planted";
  const hostileItem = `<item>\n  <title>Planted headline</title>\n  <guid isPermaLink="false">${forged.oid}</guid>\n  <onp:object>${forgedUrl}</onp:object>\n</item>`;

  const feed = feedXml([...genuineItems, hostileItem]);
  console.log("STEP 2 — built a shared feed (via the RSS export bridge) + a hostile relay planted a forged item.");

  // ── STEP 3: an aggregator (consumer Node) pulls the feed ─────────────
  const records = new Map<string, PublisherKeyRecord>([
    [rp.domain, rp.record],
    [other.domain, other.record],
  ]);
  const eudiVerifier: EudiAttestationVerifier = async () => ({
    verified: true,
    subject: { legal_name: "RegioPurmerend B.V.", lei: "5493001KJTIIGC8Y1R12" },
  });
  const resolver = new TrustAnchorResolver({
    fetcher: async (d) => {
      const r = records.get(d);
      if (!r) throw new Error(`no record for ${d}`);
      return r;
    },
    eudiVerifier,
    cacheTtlMs: 0,
  });

  const objects = new Map<string, NewsObjectEnvelope>([
    [objectUrlFromOid(a1.oid), a1],
    [objectUrlFromOid(a2.oid), a2],
    [forgedUrl, forged],
  ]);

  const result = await aggregate(["https://aggregator.example/feed"], resolver, {
    feedFetcher: async () => feed,
    objectFetcher: async (u) => {
      const o = objects.get(u);
      if (!o) throw new Error(`404 ${u}`);
      return o;
    },
  });
  console.log("STEP 3 — aggregator pulled the feed and verified every referenced Object.\n");

  // ── STEP 4: the verified, newest-first timeline ──────────────────────
  console.log("=== Verified timeline (authentic only) ===");
  for (const item of result.items) {
    const headline = String((item.envelope.content as Record<string, unknown>).headline);
    const tr = item.validation.trust_resolution;
    const eudi = tr && tr.resolved && tr.eudi?.verified ? `  [EUDI: ${tr.eudi.subject?.legal_name}]` : "";
    console.log(`  ${item.envelope.signed_at}  ${item.envelope.publisher.domain}  "${headline}"${eudi}`);
  }
  console.log("\n=== Rejected (hostile or broken) ===");
  for (const r of result.rejected) {
    console.log(`  ${r.url}  ->  ${r.reason}${r.validation ? " (" + r.validation.failure_step + ")" : ""}`);
  }

  // ── Self-checks: the loop's guarantees hold ──────────────────────────
  if (result.items.length !== 2) throw new Error("expected exactly 2 authentic Objects");
  if (result.rejected.length !== 1) throw new Error("expected exactly 1 rejected Object");
  if (result.items.some((i) => String((i.envelope.content as Record<string, unknown>).headline).startsWith("NEP"))) {
    throw new Error("a forgery leaked into the timeline!");
  }
  console.log("\nAll checks passed: publish -> feed -> aggregate -> verify. The forgery was rejected; discovery was untrusted; only signatures admitted content.");
}

main();
