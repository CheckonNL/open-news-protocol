import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateKeypair,
  computeVid,
  signEnvelope,
  buildOid,
  base64url,
  validateFull,
  referenceValidatorRegistry,
  TrustAnchorResolver,
  type ExtensionValidator,
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
        public_key: base64url(kp.publicKey),
        valid_from: "2026-01-01T00:00:00Z",
      },
    ],
    previous_keys: [],
  };
  const resolver = new TrustAnchorResolver({ fetcher: async () => record });

  function makeObject(
    overrides: Partial<UnsignedEnvelope> = {}
  ): NewsObjectEnvelope {
    const unsigned: UnsignedEnvelope = {
      oid: buildOid(DOMAIN, "multilevel-01"),
      publisher: { domain: DOMAIN, key_id: KEY_ID },
      signed_at: "2026-07-28T00:00:00Z",
      content_type: "onp:companion:article",
      content: { headline: "Multi-level test", body: "Body." },
      ...overrides,
    };
    const vid = computeVid(unsigned);
    const withVid: Record<string, unknown> = { ...unsigned, vid };
    const signature = signEnvelope(withVid, kp.privateKey);
    return { ...withVid, signature } as unknown as NewsObjectEnvelope;
  }

  return { resolver, makeObject };
}

test("ONP-1004 Section 7.1: recognized Companion and Extension, all valid", async () => {
  const { resolver, makeObject } = makeWorld();
  const envelope = makeObject({
    "onp:extensions": {
      "org.onp.ai-metadata": { generation_method: "human", human_review: true },
    },
  });
  const result = await validateFull(envelope, resolver, referenceValidatorRegistry);
  assert.equal(result.core_authenticated, true);
  assert.equal(result.core_authenticated && result.companion_valid, true);
  assert.deepEqual(
    result.core_authenticated && result.extension_results,
    { "org.onp.ai-metadata": "valid" }
  );
  assert.deepEqual(result.core_authenticated && result.conflicts, []);
});

test("ONP-1004 Section 6.3: a MINIMAL Node (empty registry) still produces a complete, well-formed Result", async () => {
  const { resolver, makeObject } = makeWorld();
  const envelope = makeObject({
    "onp:extensions": { "org.onp.something-unimplemented": { x: 1 } },
  });
  const result = await validateFull(envelope, resolver, {});
  assert.equal(result.core_authenticated, true);
  assert.equal(result.core_authenticated && result.companion_valid, "unknown");
  assert.deepEqual(
    result.core_authenticated && result.extension_results,
    { "org.onp.something-unimplemented": "unknown" }
  );
  assert.deepEqual(result.core_authenticated && result.conflicts, []);
});

test("ONP-1004 Section 4.3 rule 3: unrecognized content_type is 'unknown', never false", async () => {
  const { resolver, makeObject } = makeWorld();
  const envelope = makeObject({
    content_type: "onp:companion:recipe",
    content: { anything: true },
  });
  const result = await validateFull(envelope, resolver, referenceValidatorRegistry);
  assert.equal(result.core_authenticated, true);
  assert.equal(result.core_authenticated && result.companion_valid, "unknown");
});

test("ONP-1004 Section 4.3 rule 2: companion_valid=false does NOT alter core_authenticated", async () => {
  const { resolver, makeObject } = makeWorld();
  // Signed, authentic Object whose content is missing the REQUIRED
  // body (ONP-2100): non-conformant content, authentic origin.
  const envelope = makeObject({ content: { headline: "No body here" } });
  const result = await validateFull(envelope, resolver, referenceValidatorRegistry);
  assert.equal(result.core_authenticated, true);
  assert.equal(result.core_authenticated && result.companion_valid, false);
});

test("ONP-1004 Section 4.4 rule 1: invalid extension data reports 'invalid' for that namespace only", async () => {
  const { resolver, makeObject } = makeWorld();
  const envelope = makeObject({
    "onp:extensions": {
      "org.onp.ai-metadata": { generation_method: "made-by-robots" }, // not in enum
    },
  });
  const result = await validateFull(envelope, resolver, referenceValidatorRegistry);
  assert.equal(result.core_authenticated, true);
  assert.equal(result.core_authenticated && result.companion_valid, true);
  assert.deepEqual(
    result.core_authenticated && result.extension_results,
    { "org.onp.ai-metadata": "invalid" }
  );
});

test("ONP-1004 Section 4.5 rule 2: Core failure is terminal — no Level 2 fields exist on the Result", async () => {
  const { resolver, makeObject } = makeWorld();
  const envelope = makeObject();
  const tampered = {
    ...envelope,
    content: { ...(envelope.content as object), headline: "Tampered" },
  } as NewsObjectEnvelope;
  const result = await validateFull(tampered, resolver, referenceValidatorRegistry);
  assert.equal(result.core_authenticated, false);
  assert.equal(!result.core_authenticated && result.failure_step, "vid-mismatch");
  assert.equal("companion_valid" in result, false);
  assert.equal("extension_results" in result, false);
  assert.equal("conflicts" in result, false);
});

test("ONP-1004 Section 4.4 rule 2: a declared Extension Conflict is reported explicitly, never silently resolved", async () => {
  const { resolver, makeObject } = makeWorld();
  // Two synthetic extensions whose specs declare a conflict rule:
  // both claim to own the same hypothetical domain value.
  const claimsA: ExtensionValidator = {
    validate: () => true,
    conflictsWith(otherNs, otherData, ownData) {
      if (otherNs === "org.onp.test-b" && otherData.zone === ownData.zone) {
        return `both namespaces claim zone '${ownData.zone}'`;
      }
      return null;
    },
  };
  const claimsB: ExtensionValidator = { validate: () => true };
  const envelope = makeObject({
    "onp:extensions": {
      "org.onp.test-a": { zone: "front-page" },
      "org.onp.test-b": { zone: "front-page" },
    },
  });
  const result = await validateFull(envelope, resolver, {
    extensions: { "org.onp.test-a": claimsA, "org.onp.test-b": claimsB },
  });
  assert.equal(result.core_authenticated, true);
  const conflicts = result.core_authenticated ? result.conflicts : [];
  assert.equal(conflicts.length, 1);
  assert.deepEqual(conflicts[0].namespaces, ["org.onp.test-a", "org.onp.test-b"]);
  assert.match(conflicts[0].description, /front-page/);
  // Both results remain individually reported — neither side "wins".
  assert.deepEqual(result.core_authenticated && result.extension_results, {
    "org.onp.test-a": "valid",
    "org.onp.test-b": "valid",
  });
});

test("ONP-1004 Section 6.2: silence between two Extensions is NOT a conflict", async () => {
  const { resolver, makeObject } = makeWorld();
  const silent: ExtensionValidator = { validate: () => true };
  const envelope = makeObject({
    "onp:extensions": {
      "org.onp.test-a": { x: 1 },
      "org.onp.test-b": { y: 2 },
    },
  });
  const result = await validateFull(envelope, resolver, {
    extensions: { "org.onp.test-a": silent, "org.onp.test-b": silent },
  });
  assert.deepEqual(result.core_authenticated && result.conflicts, []);
});

test("ONP-1004 Section 4.2: Extension validation is independent of Companion outcome", async () => {
  const { resolver, makeObject } = makeWorld();
  // Companion-invalid content AND a valid extension: the extension
  // result must be unaffected by companion_valid=false.
  const envelope = makeObject({
    content: { headline: "No body" }, // companion false
    "onp:extensions": { "org.onp.ai-metadata": { human_review: true } },
  });
  const result = await validateFull(envelope, resolver, referenceValidatorRegistry);
  assert.equal(result.core_authenticated, true);
  assert.equal(result.core_authenticated && result.companion_valid, false);
  assert.deepEqual(
    result.core_authenticated && result.extension_results,
    { "org.onp.ai-metadata": "valid" }
  );
});

test("ONP-2100: reference Article validator enforces types on optional fields", async () => {
  const { resolver, makeObject } = makeWorld();
  const envelope = makeObject({
    content: { headline: "H", body: "B", byline: "not-an-array" },
  });
  const result = await validateFull(envelope, resolver, referenceValidatorRegistry);
  assert.equal(result.core_authenticated && result.companion_valid, false);
});
