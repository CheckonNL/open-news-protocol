import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateKeypair,
  signObject,
  buildOid,
  base64url,
  objectUrlFromOid,
  TrustAnchorResolver,
  aggregate,
  extractObjectUrls,
  type PublisherKeyRecord,
  type NewsObjectEnvelope,
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
  return { kp, record };
}

function makeObject(domain: string, keyId: string, localId: string, signedAt: string, priv: Uint8Array, headline: string): NewsObjectEnvelope {
  return signObject(
    {
      oid: buildOid(domain, localId),
      publisher: { domain, key_id: keyId },
      signed_at: signedAt,
      content_type: "onp:companion:article",
      content: { headline, body: "Body." },
    },
    priv,
    "ed25519"
  );
}

const DOMAIN_A = "pub-a.onp.dev";
const DOMAIN_B = "pub-b.onp.dev";
const KEY = "onp:key:2026";

function world() {
  const a = makePublisher(DOMAIN_A, KEY);
  const b = makePublisher(DOMAIN_B, KEY);
  const resolver = new TrustAnchorResolver({
    fetcher: async (d: string) => {
      if (d === DOMAIN_A) return a.record;
      if (d === DOMAIN_B) return b.record;
      throw new Error("no record");
    },
    cacheTtlMs: 0,
  });
  return { a, b, resolver };
}

function feedOf(urls: string[]): string {
  const items = urls.map((u) => `<item><onp:object>${u}</onp:object></item>`).join("");
  return `<?xml version="1.0"?><rss xmlns:onp="https://opennewsprotocol.org/ns/feed"><channel>${items}</channel></rss>`;
}

test("extractObjectUrls reads the <onp:object> pointers (ONP-1006 Section 4.4)", () => {
  const urls = extractObjectUrls(feedOf(["https://x/o/1", "https://y/o/2"]));
  assert.deepEqual(urls, ["https://x/o/1", "https://y/o/2"]);
});

test("extractObjectUrls stays linear on adversarial input (ReDoS regression)", () => {
  // An opening tag followed by many spaces and no closing tag made the
  // earlier ambiguous regex backtrack polynomially (CodeQL
  // js/polynomial-redos). The linear form returns immediately.
  const evil = "<onp:object>" + " ".repeat(50000);
  const started = Date.now();
  const urls = extractObjectUrls(evil);
  assert.deepEqual(urls, []);
  assert.ok(Date.now() - started < 2000, "extractObjectUrls must run in linear time");
});

test("aggregate builds a verified, newest-first, multi-publisher timeline", async () => {
  const { a, b, resolver } = world();
  const oA = makeObject(DOMAIN_A, KEY, "older", "2026-07-28T10:00:00Z", a.kp.privateKey, "A older");
  const oB = makeObject(DOMAIN_B, KEY, "newer", "2026-07-29T10:00:00Z", b.kp.privateKey, "B newer");

  const objects = new Map<string, NewsObjectEnvelope>([
    [objectUrlFromOid(oA.oid), oA],
    [objectUrlFromOid(oB.oid), oB],
  ]);
  const result = await aggregate(["https://feed"], resolver, {
    feedFetcher: async () => feedOf([...objects.keys()]),
    objectFetcher: async (u) => {
      const o = objects.get(u);
      if (!o) throw new Error("404");
      return o;
    },
  });

  assert.equal(result.items.length, 2);
  assert.equal(result.rejected.length, 0);
  // Newest signed_at first.
  assert.equal(result.items[0].envelope.content.headline, "B newer");
  assert.equal(result.items[1].envelope.content.headline, "A older");
  assert.ok(result.items.every((i) => i.validation.core_authenticated));
});

test("a hostile feed cannot inject an unauthentic Object", async () => {
  const { a, resolver } = world();
  const good = makeObject(DOMAIN_A, KEY, "good", "2026-07-28T10:00:00Z", a.kp.privateKey, "Genuine");
  // Tamper AFTER signing: the recomputed VID will not match.
  const forged: NewsObjectEnvelope = { ...good, content: { ...good.content, headline: "FORGED" } };

  const goodUrl = objectUrlFromOid(good.oid);
  const forgedUrl = "https://pub-a.onp.dev/.well-known/onp/objects/forged";
  const result = await aggregate(["https://feed"], resolver, {
    feedFetcher: async () => feedOf([goodUrl, forgedUrl]),
    objectFetcher: async (u) => {
      if (u === goodUrl) return good;
      if (u === forgedUrl) return forged;
      throw new Error("404");
    },
  });

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].envelope.content.headline, "Genuine");
  assert.ok(result.rejected.some((r) => r.reason === "validation-failed"));
});

test("aggregate deduplicates by OID, keeping the newest version", async () => {
  const { a, resolver } = world();
  const v1 = makeObject(DOMAIN_A, KEY, "story", "2026-07-28T10:00:00Z", a.kp.privateKey, "v1");
  const v2 = makeObject(DOMAIN_A, KEY, "story", "2026-07-29T10:00:00Z", a.kp.privateKey, "v2");
  assert.equal(v1.oid, v2.oid); // same Object, two Versions
  // Two different Object URLs both resolving to the same OID.
  const result = await aggregate(["https://feed"], resolver, {
    feedFetcher: async () => feedOf(["https://a/v1", "https://a/v2"]),
    objectFetcher: async (u) => (u === "https://a/v1" ? v1 : v2),
  });
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].envelope.content.headline, "v2");
});
