import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeypair, signObject, buildOid, base64url, TrustAnchorResolver } from "open-news-protocol";
import { crawlFeed, buildIndex } from "../src/crawl.mjs";
import { extractObjectUrls } from "../src/feed-parser.mjs";
import { query } from "../src/query.mjs";

const KEY_ID = "onp:key:2026";

function keyRecord(domain, publicKey) {
  return {
    onp_trust_anchor_type: "domain",
    publisher_domain: domain,
    current_keys: [{ key_id: KEY_ID, algorithm: "Ed25519", public_key: base64url(publicKey), valid_from: "2026-01-01T00:00:00Z" }],
    previous_keys: [],
  };
}

function endorsement(priv, domain, localId, targetRef, stance = "confirms") {
  return signObject(
    {
      oid: buildOid(domain, localId),
      publisher: { domain, key_id: KEY_ID },
      signed_at: "2026-08-01T09:00:00Z",
      content_type: "onp:companion:endorsement",
      content: { target_ref: targetRef, stance, rationale: "Because.", endorsed_at: "2026-08-01T09:00:00Z" },
    },
    priv,
    "ed25519"
  );
}

function article(priv, domain, localId) {
  return signObject(
    {
      oid: buildOid(domain, localId),
      publisher: { domain, key_id: KEY_ID },
      signed_at: "2026-07-30T10:00:00Z",
      content_type: "onp:companion:article",
      content: { headline: "Not an endorsement", body: "…" },
    },
    priv,
    "ed25519"
  );
}

function resolverFor(domainToKey) {
  return new TrustAnchorResolver({ fetcher: async (domain) => domainToKey[domain], cacheTtlMs: 0 });
}

const objUrl = (domain, localId) => `https://${domain}/.well-known/onp/objects/${localId}`;

test("feed-parser: extracts onp:object from RSS and rel=alternate link from Atom", () => {
  const rss = `<rss version="2.0" xmlns:onp="https://opennewsprotocol.org/ns/feed"><channel>
    <item><title>x</title><onp:object>https://a.example/.well-known/onp/objects/one</onp:object></item>
  </channel></rss>`;
  const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><entry>
    <link rel="alternate" type="application/onp+json" href="https://b.example/.well-known/onp/objects/two"/>
  </entry></feed>`;

  assert.deepEqual(extractObjectUrls(rss), ["https://a.example/.well-known/onp/objects/one"]);
  assert.deepEqual(extractObjectUrls(atom), ["https://b.example/.well-known/onp/objects/two"]);
});

test("crawlFeed: a genuine cross-domain endorsement is verified and included", async () => {
  const kp = generateKeypair();
  const resolver = resolverFor({ "nos.example.dev": keyRecord("nos.example.dev", kp.publicKey) });
  const e = endorsement(kp.privateKey, "nos.example.dev", "e1", "onp:vid:sha-256:target-abc");
  const feedXml = `<rss xmlns:onp="https://opennewsprotocol.org/ns/feed"><channel><item><onp:object>${objUrl("nos.example.dev", "e1")}</onp:object></item></channel></rss>`;

  const fetcher = async (url) => {
    if (url === "https://nos.example.dev/feed") return { ok: true, text: async () => feedXml };
    if (url === objUrl("nos.example.dev", "e1")) return { ok: true, json: async () => e };
    return { ok: false, status: 404 };
  };

  const entries = await crawlFeed("https://nos.example.dev/feed", { fetcher, resolver });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].endorserDomain, "nos.example.dev");
  assert.equal(entries[0].targetRef, "onp:vid:sha-256:target-abc");
  assert.equal(entries[0].stance, "confirms");
});

test("crawlFeed: non-endorsement content_type is skipped", async () => {
  const kp = generateKeypair();
  const resolver = resolverFor({ "a.example.dev": keyRecord("a.example.dev", kp.publicKey) });
  const art = article(kp.privateKey, "a.example.dev", "art1");
  const feedXml = `<rss xmlns:onp="https://opennewsprotocol.org/ns/feed"><channel><item><onp:object>${objUrl("a.example.dev", "art1")}</onp:object></item></channel></rss>`;

  const fetcher = async (url) => {
    if (url === "https://a.example.dev/feed") return { ok: true, text: async () => feedXml };
    if (url === objUrl("a.example.dev", "art1")) return { ok: true, json: async () => art };
    return { ok: false, status: 404 };
  };

  const entries = await crawlFeed("https://a.example.dev/feed", { fetcher, resolver });
  assert.equal(entries.length, 0);
});

test("crawlFeed: a tampered endorsement fails Core validation and is skipped", async () => {
  const kp = generateKeypair();
  const resolver = resolverFor({ "bad.example.dev": keyRecord("bad.example.dev", kp.publicKey) });
  const e = endorsement(kp.privateKey, "bad.example.dev", "e1", "onp:vid:sha-256:target-abc");
  const tampered = { ...e, content: { ...e.content, stance: "disputes" } }; // mutated after signing
  const feedXml = `<rss xmlns:onp="https://opennewsprotocol.org/ns/feed"><channel><item><onp:object>${objUrl("bad.example.dev", "e1")}</onp:object></item></channel></rss>`;

  const fetcher = async (url) => {
    if (url === "https://bad.example.dev/feed") return { ok: true, text: async () => feedXml };
    if (url === objUrl("bad.example.dev", "e1")) return { ok: true, json: async () => tampered };
    return { ok: false, status: 404 };
  };

  const entries = await crawlFeed("https://bad.example.dev/feed", { fetcher, resolver });
  assert.equal(entries.length, 0);
});

test("crawlFeed: an unreachable Object URL is skipped without crashing the crawl", async () => {
  const resolver = resolverFor({});
  const feedXml = `<rss xmlns:onp="https://opennewsprotocol.org/ns/feed"><channel><item><onp:object>${objUrl("gone.example.dev", "missing")}</onp:object></item></channel></rss>`;

  const fetcher = async (url) => {
    if (url === "https://gone.example.dev/feed") return { ok: true, text: async () => feedXml };
    throw new Error("network error");
  };

  const entries = await crawlFeed("https://gone.example.dev/feed", { fetcher, resolver });
  assert.equal(entries.length, 0);
});

test("buildIndex: endorsements from different feeds targeting the same VID are grouped together", async () => {
  const kp1 = generateKeypair();
  const kp2 = generateKeypair();
  const resolver = resolverFor({
    "nos.example.dev": keyRecord("nos.example.dev", kp1.publicKey),
    "vrt.example.dev": keyRecord("vrt.example.dev", kp2.publicKey),
  });
  const target = "onp:vid:sha-256:shared-target";
  const e1 = endorsement(kp1.privateKey, "nos.example.dev", "e1", target, "confirms");
  const e2 = endorsement(kp2.privateKey, "vrt.example.dev", "e2", target, "disputes");

  const feed1 = `<rss xmlns:onp="https://opennewsprotocol.org/ns/feed"><channel><item><onp:object>${objUrl("nos.example.dev", "e1")}</onp:object></item></channel></rss>`;
  const feed2 = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><link rel="alternate" type="application/onp+json" href="${objUrl("vrt.example.dev", "e2")}"/></entry></feed>`;

  const fetcher = async (url) => {
    if (url === "https://nos.example.dev/feed") return { ok: true, text: async () => feed1 };
    if (url === "https://vrt.example.dev/feed") return { ok: true, text: async () => feed2 };
    if (url === objUrl("nos.example.dev", "e1")) return { ok: true, json: async () => e1 };
    if (url === objUrl("vrt.example.dev", "e2")) return { ok: true, json: async () => e2 };
    return { ok: false, status: 404 };
  };

  const index = await buildIndex(
    [{ domain: "nos.example.dev", feedUrl: "https://nos.example.dev/feed" }, { domain: "vrt.example.dev", feedUrl: "https://vrt.example.dev/feed" }],
    { fetcher, resolver }
  );

  assert.equal(index[target].length, 2);
  const stances = index[target].map((e) => e.stance).sort();
  assert.deepEqual(stances, ["confirms", "disputes"]);
});

test("query: returns the raw, unranked list for a target, and [] for an unknown one", () => {
  const index = { "onp:vid:sha-256:x": [{ stance: "confirms", endorserDomain: "nos.example.dev" }] };
  assert.equal(query(index, "onp:vid:sha-256:x").length, 1);
  assert.deepEqual(query(index, "onp:vid:sha-256:unknown"), []);
});
