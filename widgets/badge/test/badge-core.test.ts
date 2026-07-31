import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateKeypair,
  signObject,
  buildOid,
  base64url,
  TrustAnchorResolver,
  type PublisherKeyRecord,
} from "open-news-protocol";
import { sha256 } from "@noble/hashes/sha2";
import { evaluateBadge } from "../src/badge-core.js";

const DOMAIN = "example.onp.dev";
const KEY = "onp:key:2026";

function keyRecord(publicKey: Uint8Array, extra: Partial<PublisherKeyRecord> = {}): PublisherKeyRecord {
  return {
    onp_trust_anchor_type: "domain",
    publisher_domain: DOMAIN,
    current_keys: [
      { key_id: KEY, algorithm: "Ed25519", public_key: base64url(publicKey), valid_from: "2026-01-01T00:00:00Z" },
    ],
    previous_keys: [],
    ...extra,
  };
}

function article(priv: Uint8Array, headline = "Test headline", extra: Record<string, unknown> = {}) {
  return signObject(
    {
      oid: buildOid(DOMAIN, "badge-test"),
      publisher: { domain: DOMAIN, key_id: KEY },
      signed_at: "2026-07-30T10:00:00Z",
      content_type: "onp:companion:article",
      content: { headline, body: "Body.", ...extra },
    },
    priv,
    "ed25519"
  );
}

const IMG_BYTES = new TextEncoder().encode("the-real-image-bytes");

function mediaObject(priv: Uint8Array, localId: string, bytes: Uint8Array) {
  return signObject(
    {
      oid: buildOid(DOMAIN, localId),
      publisher: { domain: DOMAIN, key_id: KEY },
      signed_at: "2026-07-30T10:00:00Z",
      content_type: "onp:companion:media",
      content: {
        media_type: "image",
        asset_url: "https://cdn.example/photo.jpg",
        asset_hash: "sha-256:" + base64url(sha256(bytes)),
        mime_type: "image/jpeg",
        credit: "© Broca Media",
      },
    },
    priv,
    "ed25519"
  );
}

const objectUrl = (localId: string) => `https://${DOMAIN}/.well-known/onp/objects/${localId}`;

test("badge: a genuine Object verifies and surfaces its provenance", async () => {
  const kp = generateKeypair();
  const resolver = new TrustAnchorResolver({ fetcher: async () => keyRecord(kp.publicKey), cacheTtlMs: 0 });
  const envelope = article(kp.privateKey);
  const r = await evaluateBadge("https://x/o", { objectFetcher: async () => envelope, resolver });
  assert.equal(r.status, "verified");
  assert.equal(r.publisherDomain, DOMAIN);
  assert.equal(r.headline, "Test headline");
});

test("badge: tampered content is rejected with a plain-language reason", async () => {
  const kp = generateKeypair();
  const resolver = new TrustAnchorResolver({ fetcher: async () => keyRecord(kp.publicKey), cacheTtlMs: 0 });
  const envelope = article(kp.privateKey);
  const tampered = { ...envelope, content: { ...envelope.content, headline: "HACKED" } };
  const r = await evaluateBadge("https://x/o", { objectFetcher: async () => tampered, resolver });
  assert.equal(r.status, "rejected");
  assert.equal(r.failureStep, "vid-mismatch");
  assert.match(r.detail, /altered/i);
});

test("badge: an unreachable Object is 'unavailable', not 'rejected'", async () => {
  const kp = generateKeypair();
  const resolver = new TrustAnchorResolver({ fetcher: async () => keyRecord(kp.publicKey), cacheTtlMs: 0 });
  const r = await evaluateBadge("https://x/o", {
    objectFetcher: async () => {
      throw new Error("HTTP 404");
    },
    resolver,
  });
  assert.equal(r.status, "unavailable");
});

test("badge: an EUDI-verified publisher surfaces the legal identity", async () => {
  const kp = generateKeypair();
  const resolver = new TrustAnchorResolver({
    fetcher: async () =>
      keyRecord(kp.publicKey, {
        eudi_attestation: { format: "sd-jwt-vc", credential: "<vc>", binds: { key_id: KEY, publisher_domain: DOMAIN } },
      }),
    eudiVerifier: async () => ({ verified: true, subject: { legal_name: "Example News B.V.", lei: "X" } }),
    cacheTtlMs: 0,
  });
  const envelope = article(kp.privateKey);
  const r = await evaluateBadge("https://x/o", { objectFetcher: async () => envelope, resolver });
  assert.equal(r.status, "verified");
  assert.equal(r.eudiName, "Example News B.V.");
});

test("badge: a referenced photo verifies against its real bytes", async () => {
  const kp = generateKeypair();
  const resolver = new TrustAnchorResolver({ fetcher: async () => keyRecord(kp.publicKey), cacheTtlMs: 0 });
  const media = mediaObject(kp.privateKey, "media-1", IMG_BYTES);
  const art = article(kp.privateKey, "With photo", { media_refs: [media.oid] });

  const r = await evaluateBadge("https://x/o", {
    objectFetcher: async (u) => (u === objectUrl("media-1") ? media : art),
    assetFetcher: async () => IMG_BYTES,
    resolver,
  });
  assert.equal(r.status, "verified");
  assert.equal(r.photos?.length, 1);
  assert.equal(r.photos?.[0].ok, true);
  assert.equal(r.photos?.[0].credit, "© Broca Media");
});

test("badge: a swapped photo turns the badge to 'attention', text still ok", async () => {
  const kp = generateKeypair();
  const resolver = new TrustAnchorResolver({ fetcher: async () => keyRecord(kp.publicKey), cacheTtlMs: 0 });
  const media = mediaObject(kp.privateKey, "media-1", IMG_BYTES);
  const art = article(kp.privateKey, "With photo", { media_refs: [media.oid] });

  const r = await evaluateBadge("https://x/o", {
    objectFetcher: async (u) => (u === objectUrl("media-1") ? media : art),
    assetFetcher: async () => new TextEncoder().encode("DIFFERENT-bytes"),
    resolver,
  });
  assert.equal(r.status, "attention");
  assert.equal(r.photos?.[0].ok, false);
});
