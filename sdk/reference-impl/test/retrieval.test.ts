import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateKeypair,
  computeVid,
  signEnvelope,
  buildOid,
  base64url,
  objectUrlFromOid,
  versionUrlFromOid,
  etagForVid,
  retrieveNewsObject,
  toRssItem,
  rssItemToXml,
  TrustAnchorResolver,
  type ObjectFetcher,
  type PublisherKeyRecord,
  type UnsignedEnvelope,
  type NewsObjectEnvelope,
} from "../src/index.js";

const DOMAIN = "example.onp.dev";
const KEY_ID = "onp:key:test-2026";

function makeWorld() {
  const kp = generateKeypair();
  const record: PublisherKeyRecord = {
    onp_trust_anchor_type: "domain",
    publisher_domain: DOMAIN,
    current_keys: [
      {
        key_id: KEY_ID,
        algorithm: "Ed25519",
        public_key: base64url(kp.publicKeyRaw),
        valid_from: "2026-01-01T00:00:00Z",
      },
    ],
    previous_keys: [],
  };
  const resolver = new TrustAnchorResolver({ fetcher: async () => record });

  function makeObject(localId: string): NewsObjectEnvelope {
    const unsigned: UnsignedEnvelope = {
      oid: buildOid(DOMAIN, localId),
      publisher: { domain: DOMAIN, key_id: KEY_ID },
      signed_at: "2026-07-28T00:00:00Z",
      content_type: "onp:companion:article",
      content: { headline: "Retrieval test", body: "Body." },
    };
    const vid = computeVid(unsigned);
    const withVid: Record<string, unknown> = { ...unsigned, vid };
    const signature = signEnvelope(withVid, kp.privateKey);
    return { ...withVid, signature } as unknown as NewsObjectEnvelope;
  }

  return { kp, record, resolver, makeObject };
}

test("ONP-1006 Section 4.1: Object URL derivation is mechanical and byte-identical", () => {
  assert.equal(
    objectUrlFromOid("onp:oid:regiopurmerend.nl:wheermolen-bommen-2026"),
    "https://regiopurmerend.nl/.well-known/onp/objects/wheermolen-bommen-2026"
  );
});

test("ONP-1006 Section 4.1: UUID Local Identifiers need no encoding", () => {
  const uuid = "9f1c2d3e-4a5b-4c6d-8e7f-0123456789ab";
  assert.equal(
    objectUrlFromOid(`onp:oid:${DOMAIN}:${uuid}`),
    `https://${DOMAIN}/.well-known/onp/objects/${uuid}`
  );
});

test("ONP-1006 Section 4.1: malformed OID is rejected before any network use", () => {
  assert.throws(() => objectUrlFromOid("not-an-oid"));
});

test("ONP-1006 Section 4.3: Version URL keeps the full VID string in the path", () => {
  const vid = "onp:vid:sha-256:AbC123";
  assert.equal(
    versionUrlFromOid(`onp:oid:${DOMAIN}:x`, vid),
    `https://${DOMAIN}/.well-known/onp/objects/x/versions/${vid}`
  );
});

test("ONP-1006 Section 4.2 rule 3: the ETag is the quoted VID", () => {
  assert.equal(etagForVid("onp:vid:sha-256:AbC"), '"onp:vid:sha-256:AbC"');
});

test("ONP-1006 Section 5.1 end to end: retrieve, validate, accept", async () => {
  const { resolver, makeObject } = makeWorld();
  const envelope = makeObject("retrieval-01");
  const fetcher: ObjectFetcher = async (url) => {
    assert.equal(url, objectUrlFromOid(envelope.oid));
    return { status: 200, etag: etagForVid(envelope.vid), body: envelope };
  };
  const result = await retrieveNewsObject(envelope.oid, resolver, { fetcher });
  assert.equal(result.outcome, "retrieved");
  assert.equal(
    result.outcome === "retrieved" && result.validation.core_authenticated,
    true
  );
});

test("ONP-1006 Section 5.1 step 3: 304 with held VID short-circuits as not-modified", async () => {
  const { resolver, makeObject } = makeWorld();
  const envelope = makeObject("retrieval-02");
  const fetcher: ObjectFetcher = async (_url, ifNoneMatch) => {
    assert.equal(ifNoneMatch, etagForVid(envelope.vid));
    return { status: 304 };
  };
  const result = await retrieveNewsObject(envelope.oid, resolver, {
    heldVid: envelope.vid,
    fetcher,
  });
  assert.equal(result.outcome, "not-modified");
});

test("ONP-1006 Section 4.2 rule 6: 404 is not-retrievable, never invalid", async () => {
  const { resolver } = makeWorld();
  const fetcher: ObjectFetcher = async () => ({ status: 404 });
  const result = await retrieveNewsObject(
    buildOid(DOMAIN, "absent"), resolver, { fetcher }
  );
  assert.equal(result.outcome, "not-retrievable");
  assert.equal(result.outcome === "not-retrievable" && result.status, 404);
});

test("ONP-1006 Section 5.1 step 5: tampered response is rejected by validation, despite TLS-clean transport", async () => {
  const { resolver, makeObject } = makeWorld();
  const envelope = makeObject("retrieval-03");
  const tampered = {
    ...envelope,
    content: { ...(envelope.content as object), headline: "Tampered" },
  } as NewsObjectEnvelope;
  const fetcher: ObjectFetcher = async () => ({ status: 200, body: tampered });
  const result = await retrieveNewsObject(envelope.oid, resolver, { fetcher });
  assert.equal(result.outcome, "rejected");
  assert.equal(result.outcome === "rejected" && result.reason, "validation-failed");
});

test("ONP-1006 Section 5.1 step 6: a valid Object for the WRONG OID is rejected as oid-mismatch", async () => {
  const { resolver, makeObject } = makeWorld();
  const other = makeObject("some-other-article"); // fully valid, wrong Object
  const requested = buildOid(DOMAIN, "the-article-i-asked-for");
  const fetcher: ObjectFetcher = async () => ({ status: 200, body: other });
  const result = await retrieveNewsObject(requested, resolver, { fetcher });
  assert.equal(result.outcome, "rejected");
  assert.equal(result.outcome === "rejected" && result.reason, "oid-mismatch");
});

test("ONP-1006 Section 4.4 rule 1: RSS export carries <onp:object> with the derived Object URL", () => {
  const { makeObject } = makeWorld();
  const envelope = makeObject("feed-item-01");
  const item = toRssItem(envelope);
  assert.equal(item.objectUrl, objectUrlFromOid(envelope.oid));
  const xml = rssItemToXml(item);
  assert.match(xml, /<onp:object>https:\/\/example\.onp\.dev\/\.well-known\/onp\/objects\/feed-item-01<\/onp:object>/);
});
