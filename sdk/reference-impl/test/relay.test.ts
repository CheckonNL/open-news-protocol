import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateKeypair,
  signObject,
  buildOid,
  base64url,
  objectUrlFromOid,
  TrustAnchorResolver,
  Relay,
  aggregate,
  type PublisherKeyRecord,
  type NewsObjectEnvelope,
} from "../src/index.js";

const A = "pub-a.onp.dev";
const B = "pub-b.onp.dev";
const KEY = "onp:key:2026";

function publisher(domain: string) {
  const kp = generateKeypair();
  const record: PublisherKeyRecord = {
    onp_trust_anchor_type: "domain",
    publisher_domain: domain,
    current_keys: [
      { key_id: KEY, algorithm: "Ed25519", public_key: base64url(kp.publicKey), valid_from: "2026-01-01T00:00:00Z" },
    ],
    previous_keys: [],
  };
  return { domain, kp, record };
}

type Publisher = ReturnType<typeof publisher>;

function obj(pub: Publisher, localId: string, signedAt: string, headline: string): NewsObjectEnvelope {
  return signObject(
    {
      oid: buildOid(pub.domain, localId),
      publisher: { domain: pub.domain, key_id: KEY },
      signed_at: signedAt,
      content_type: "onp:companion:article",
      content: { headline, body: "Body." },
    },
    pub.kp.privateKey,
    "ed25519"
  );
}

function world() {
  const a = publisher(A);
  const b = publisher(B);
  const records = new Map<string, PublisherKeyRecord>([
    [A, a.record],
    [B, b.record],
  ]);
  const resolver = new TrustAnchorResolver({
    fetcher: async (d) => {
      const r = records.get(d);
      if (!r) throw new Error(`no record for ${d}`);
      return r;
    },
    cacheTtlMs: 0,
  });
  return { a, b, resolver };
}

test("relay: ingests an authentic Object and mirrors it by OID", async () => {
  const { a, resolver } = world();
  const relay = new Relay(resolver);
  const o = obj(a, "story", "2026-07-28T10:00:00Z", "Story");
  const r = await relay.ingest(o);
  assert.equal(r.ingested, true);
  assert.equal(relay.size(), 1);
  assert.deepEqual(relay.get(o.oid), o);
});

test("relay: refuses an unauthentic Object — never stored", async () => {
  const { a, resolver } = world();
  const relay = new Relay(resolver);
  const o = obj(a, "story", "2026-07-28T10:00:00Z", "Story");
  const forged: NewsObjectEnvelope = { ...o, content: { ...o.content, headline: "FORGED" } };
  const r = await relay.ingest(forged);
  assert.equal(r.ingested, false);
  assert.equal(r.ingested === false && r.reason, "not-authenticated");
  assert.equal(relay.size(), 0);
});

test("relay: keeps the newest Version per OID", async () => {
  const { a, resolver } = world();
  const relay = new Relay(resolver);
  const v1 = obj(a, "story", "2026-07-28T10:00:00Z", "v1");
  const v2 = obj(a, "story", "2026-07-29T10:00:00Z", "v2");
  await relay.ingest(v1);
  const r2 = await relay.ingest(v2);
  assert.equal(r2.ingested, true);
  assert.equal(r2.ingested === true && r2.replacedPrevious, true);
  assert.equal(relay.size(), 1);
  const held = relay.get(v1.oid)!;
  assert.equal((held.content as Record<string, unknown>).headline, "v2");
  // Re-ingesting the older Version is refused.
  const older = await relay.ingest(v1);
  assert.equal(older.ingested, false);
  assert.equal(older.ingested === false && older.reason, "older-than-held");
});

test("relay: query is newest-first and filterable by publisher", async () => {
  const { a, b, resolver } = world();
  const relay = new Relay(resolver);
  await relay.ingest(obj(a, "a1", "2026-07-28T10:00:00Z", "A1"));
  await relay.ingest(obj(b, "b1", "2026-07-29T10:00:00Z", "B1"));
  const all = relay.query();
  assert.equal(all.length, 2);
  assert.equal(all[0].publisherDomain, B); // newest first
  const onlyA = relay.query({ domains: [A] });
  assert.equal(onlyA.length, 1);
  assert.equal(onlyA[0].publisherDomain, A);
});

test("relay: its feed closes the loop — an aggregator consumes it and re-verifies", async () => {
  const { a, b, resolver } = world();
  const relay = new Relay(resolver);
  await relay.ingest(obj(a, "a1", "2026-07-28T10:00:00Z", "A1"));
  await relay.ingest(obj(b, "b1", "2026-07-29T10:00:00Z", "B1"));

  // The relay only serves pointers + mirrored bytes; the aggregator
  // re-verifies everything, so the relay never has to be trusted.
  const mirror = new Map(relay.query().map((e) => [objectUrlFromOid(e.oid), e.envelope]));
  const result = await aggregate(["https://relay.example/feed"], resolver, {
    feedFetcher: async () => relay.feed(),
    objectFetcher: async (u) => {
      const o = mirror.get(u);
      if (!o) throw new Error("404");
      return o;
    },
  });

  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].envelope.content.headline, "B1"); // newest first
  assert.ok(result.items.every((i) => i.validation.core_authenticated));
});
