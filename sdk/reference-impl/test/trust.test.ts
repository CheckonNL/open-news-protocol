import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateKeypair,
  computeVid,
  signEnvelope,
  buildOid,
  base64url,
  TrustAnchorResolver,
  resolveAgainstRecord,
  keyRecordFingerprint,
  validateCoreWithTrust,
  type PublisherKeyRecord,
  type UnsignedEnvelope,
  type NewsObjectEnvelope,
} from "../src/index.js";

const DOMAIN = "example.onp.dev";
const CURRENT_KEY_ID = "onp:key:2026-07-01";
const PREVIOUS_KEY_ID = "onp:key:2025-01-15";

/** Build a keypair + matching Publisher Key Record + signed Object. */
function makeWorld() {
  const current = generateKeypair();
  const previous = generateKeypair();

  const record: PublisherKeyRecord = {
    onp_trust_anchor_type: "domain",
    publisher_domain: DOMAIN,
    current_keys: [
      {
        key_id: CURRENT_KEY_ID,
        algorithm: "Ed25519",
        public_key: base64url(current.publicKeyRaw),
        valid_from: "2026-07-01T00:00:00Z",
      },
    ],
    previous_keys: [
      {
        key_id: PREVIOUS_KEY_ID,
        algorithm: "Ed25519",
        public_key: base64url(previous.publicKeyRaw),
        valid_from: "2025-01-15T00:00:00Z",
        valid_until: "2026-07-01T00:00:00Z",
        revoked_at: null,
      },
    ],
  };

  function makeObject(
    keyId: string,
    privateKey: typeof current.privateKey,
    signedAt: string
  ): NewsObjectEnvelope {
    const unsigned: UnsignedEnvelope = {
      oid: buildOid(DOMAIN, "trust-test-01"),
      publisher: { domain: DOMAIN, key_id: keyId },
      signed_at: signedAt,
      content_type: "onp:companion:article",
      content: { headline: "Trust test", body: "Body." },
    };
    const vid = computeVid(unsigned);
    const withVid: Record<string, unknown> = { ...unsigned, vid };
    const signature = signEnvelope(withVid, privateKey);
    return { ...withVid, signature } as unknown as NewsObjectEnvelope;
  }

  return { current, previous, record, makeObject };
}

function resolverFor(
  record: () => PublisherKeyRecord | Promise<PublisherKeyRecord>,
  opts: { cacheTtlMs?: number } = {}
) {
  let fetchCount = 0;
  const resolver = new TrustAnchorResolver({
    fetcher: async () => {
      fetchCount++;
      return record();
    },
    cacheTtlMs: opts.cacheTtlMs ?? 5 * 60 * 1000,
  });
  return { resolver, fetches: () => fetchCount };
}

test("ONP-0004 Section 7.1: current key resolves successfully", async () => {
  const { record } = makeWorld();
  const result = resolveAgainstRecord(
    record, DOMAIN, CURRENT_KEY_ID, "2026-07-28T00:00:00Z"
  );
  assert.equal(result.resolved, true);
  assert.equal(result.resolved && result.matched_in, "current_keys");
});

test("ONP-0004 Section 7.2: rotated key within window resolves", async () => {
  const { record } = makeWorld();
  const result = resolveAgainstRecord(
    record, DOMAIN, PREVIOUS_KEY_ID, "2025-11-01T10:00:00Z"
  );
  assert.equal(result.resolved, true);
  assert.equal(result.resolved && result.matched_in, "previous_keys");
});

test("ONP-0004 Section 6.1 step 5: previous key outside window fails", async () => {
  const { record } = makeWorld();
  const result = resolveAgainstRecord(
    record, DOMAIN, PREVIOUS_KEY_ID, "2026-08-15T00:00:00Z"
  );
  assert.equal(result.resolved, false);
  assert.equal(!result.resolved && result.reason, "outside-validity-window");
});

test("ONP-0004 Section 7.3: revoked key fails at or after revoked_at", async () => {
  const { record } = makeWorld();
  record.previous_keys![0].revoked_at = "2025-10-01T00:00:00Z";
  // Inside the validity window, but at/after revoked_at -> untrusted.
  const atRevocation = resolveAgainstRecord(
    record, DOMAIN, PREVIOUS_KEY_ID, "2025-10-01T00:00:00Z"
  );
  assert.equal(atRevocation.resolved, false);
  assert.equal(!atRevocation.resolved && atRevocation.reason, "key-revoked");
  // Strictly before revoked_at -> still authentic (Section 4.4 rule 4).
  const beforeRevocation = resolveAgainstRecord(
    record, DOMAIN, PREVIOUS_KEY_ID, "2025-09-30T23:59:59Z"
  );
  assert.equal(beforeRevocation.resolved, true);
});

test("ONP-0004 Section 6.1 step 6: unknown key fails", async () => {
  const { record } = makeWorld();
  const result = resolveAgainstRecord(
    record, DOMAIN, "onp:key:never-existed", "2026-07-28T00:00:00Z"
  );
  assert.equal(result.resolved, false);
  assert.equal(!result.resolved && result.reason, "key-unknown");
});

test("Record for a different publisher_domain is rejected", async () => {
  const { record } = makeWorld();
  const result = resolveAgainstRecord(
    { ...record, publisher_domain: "attacker.example" },
    DOMAIN, CURRENT_KEY_ID, "2026-07-28T00:00:00Z"
  );
  assert.equal(result.resolved, false);
  assert.equal(!result.resolved && result.reason, "record-domain-mismatch");
});

test("ONP-0004 Section 4.4 rule 2: previous key missing valid_until fails closed", async () => {
  const { record } = makeWorld();
  delete record.previous_keys![0].valid_until;
  const result = resolveAgainstRecord(
    record, DOMAIN, PREVIOUS_KEY_ID, "2025-11-01T00:00:00Z"
  );
  assert.equal(result.resolved, false);
  assert.equal(!result.resolved && result.reason, "record-invalid");
});

test("ONP-0004 Section 6.3 rule 2: failure against cached copy triggers re-fetch (rotation is observed)", async () => {
  const { record, current } = makeWorld();
  // Serve a STALE record first (without the current key), then the
  // fresh one — simulating a rotation the cache hasn't seen yet.
  const stale: PublisherKeyRecord = {
    ...record,
    current_keys: [],
    previous_keys: record.previous_keys,
  };
  let serveFresh = false;
  const { resolver, fetches } = resolverFor(() => (serveFresh ? record : stale));

  // Prime the cache with the stale record via a resolvable request.
  const primed = await resolver.resolve(
    DOMAIN, PREVIOUS_KEY_ID, "2025-11-01T00:00:00Z"
  );
  assert.equal(primed.resolved, true);
  assert.equal(fetches(), 1);

  // Rotation happens server-side; the cache still holds stale.
  serveFresh = true;

  // Resolving the NEW current key fails against the cached copy;
  // the resolver MUST re-fetch and then succeed.
  const result = await resolver.resolve(
    DOMAIN, CURRENT_KEY_ID, "2026-07-28T00:00:00Z"
  );
  assert.equal(result.resolved, true);
  assert.equal(fetches(), 2);
  void current;
});

test("Caching: a second successful resolve within TTL does not re-fetch", async () => {
  const { record } = makeWorld();
  const { resolver, fetches } = resolverFor(() => record);
  await resolver.resolve(DOMAIN, CURRENT_KEY_ID, "2026-07-28T00:00:00Z");
  await resolver.resolve(DOMAIN, CURRENT_KEY_ID, "2026-07-28T01:00:00Z");
  assert.equal(fetches(), 1);
});

test("ONP-1003 Section 4.5 end to end: full pipeline authenticates via the RESOLVED key", async () => {
  const { record, current, makeObject } = makeWorld();
  const envelope = makeObject(
    CURRENT_KEY_ID, current.privateKey, "2026-07-28T00:00:00Z"
  );
  const { resolver } = resolverFor(() => record);
  const result = await validateCoreWithTrust(envelope, resolver);
  assert.equal(result.core_authenticated, true);
  assert.equal(result.failure_step, null);
});

test("ONP-1003 Section 4.5 step 3: attacker's own keypair fails Trust Anchor resolution despite valid signature", async () => {
  // The exact attack ONP-0004 Section 1 describes: mint a keypair,
  // sign a plausible Object claiming to be the publisher. The
  // signature is cryptographically valid; resolution must reject it.
  const { record, makeObject } = makeWorld();
  const attacker = generateKeypair();
  const envelope = makeObject(
    "onp:key:attacker", attacker.privateKey, "2026-07-28T00:00:00Z"
  );
  const { resolver } = resolverFor(() => record);
  const result = await validateCoreWithTrust(envelope, resolver);
  assert.equal(result.core_authenticated, false);
  assert.equal(result.failure_step, "trust-anchor-resolution-failed");
});

test("ONP-1003 Section 4.5 step 4: algorithm cross-check rejects record/signature disagreement", async () => {
  const { record, current, makeObject } = makeWorld();
  record.current_keys[0].algorithm = "P-256"; // record now disagrees
  const envelope = makeObject(
    CURRENT_KEY_ID, current.privateKey, "2026-07-28T00:00:00Z"
  );
  const { resolver } = resolverFor(() => record);
  const result = await validateCoreWithTrust(envelope, resolver);
  assert.equal(result.core_authenticated, false);
  assert.equal(result.failure_step, "algorithm-mismatch");
});

test("ONP-0004 Section 6.2: key substitution in the record still fails signature verification", async () => {
  // A record that lists the right key_id but the WRONG public key
  // (e.g. a compromised host serving a tampered record) must fail at
  // the cryptographic step — the signature can't verify against a
  // substituted key.
  const { record, current, makeObject } = makeWorld();
  const substitute = generateKeypair();
  record.current_keys[0].public_key = base64url(substitute.publicKeyRaw);
  const envelope = makeObject(
    CURRENT_KEY_ID, current.privateKey, "2026-07-28T00:00:00Z"
  );
  const { resolver } = resolverFor(() => record);
  const result = await validateCoreWithTrust(envelope, resolver);
  assert.equal(result.core_authenticated, false);
  assert.equal(result.failure_step, "signature-invalid");
});

test("ONP-0004 Section 4.3: DNS fingerprint mismatch is a warning, not a failure", async () => {
  const { record } = makeWorld();
  const resolver = new TrustAnchorResolver({
    fetcher: async () => record,
    dnsLookup: async () => "sha256:definitely-not-matching",
  });
  const result = await resolver.resolve(
    DOMAIN, CURRENT_KEY_ID, "2026-07-28T00:00:00Z"
  );
  assert.equal(result.resolved, true);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /dns-fingerprint-mismatch/);
});

test("ONP-0004 Section 4.3 rule 3: DNS absence never affects resolution", async () => {
  const { record } = makeWorld();
  const resolver = new TrustAnchorResolver({
    fetcher: async () => record,
    dnsLookup: async () => null,
  });
  const result = await resolver.resolve(
    DOMAIN, CURRENT_KEY_ID, "2026-07-28T00:00:00Z"
  );
  assert.equal(result.resolved, true);
  assert.equal(result.warnings.length, 0);
});

test("keyRecordFingerprint is deterministic and key-order independent", async () => {
  const { record } = makeWorld();
  const reordered = JSON.parse(JSON.stringify(record));
  // Same logical record, different property insertion order.
  const shuffled: PublisherKeyRecord = {
    publisher_domain: reordered.publisher_domain,
    current_keys: reordered.current_keys,
    onp_trust_anchor_type: reordered.onp_trust_anchor_type,
    previous_keys: reordered.previous_keys,
  };
  assert.equal(keyRecordFingerprint(record), keyRecordFingerprint(shuffled));
  // ONP-0004 v0.2.0 Section 4.3 rule 4: Algorithm Registry label form.
  assert.match(keyRecordFingerprint(record), /^sha-256:[A-Za-z0-9_-]+$/);
});
