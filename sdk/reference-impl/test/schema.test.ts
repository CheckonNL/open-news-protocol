/**
 * Schema coherence tests.
 *
 * The JSON Schemas in /schemas are the machine form of the
 * STRUCTURAL layer only (ONP-1000 Section 6.1's structural check;
 * ONP-0004 Section 5.1's record structure). These tests pin three
 * things so schema, specification text, implementation, and test
 * vectors cannot drift apart silently:
 *
 *   1. every Object this SDK produces validates against the
 *      envelope schema;
 *   2. every published test vector behaves against the schema
 *      exactly as its expected_result says (valid vectors pass,
 *      the structurally-invalid vector fails);
 *   3. targeted negative cases: each schema constraint that encodes
 *      a specific normative rule actually rejects a violation of
 *      that rule.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  generateKeypair,
  computeVid,
  signEnvelope,
  buildOid,
  type UnsignedEnvelope,
} from "../src/index.js";

// dist/test -> dist -> reference-impl -> sdk -> repo root
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");

function loadJson(relPath: string): unknown {
  return JSON.parse(readFileSync(join(REPO_ROOT, relPath), "utf8"));
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats.default(ajv);

const validateEnvelope = ajv.compile(
  loadJson("schemas/news-object.schema.json") as object
);
const validateKeyRecord = ajv.compile(
  loadJson("schemas/publisher-key-record.schema.json") as object
);

function makeValidEnvelope(): Record<string, unknown> {
  const { privateKey } = generateKeypair();
  const unsigned: UnsignedEnvelope = {
    oid: buildOid("example.onp.dev", "schema-test-01"),
    publisher: { domain: "example.onp.dev", key_id: "onp:key:test" },
    signed_at: "2026-07-28T00:00:00Z",
    content_type: "onp:companion:article",
    content: { headline: "Schema test", body: "Body." },
  };
  const vid = computeVid(unsigned);
  const withVid: Record<string, unknown> = { ...unsigned, vid };
  const signature = signEnvelope(withVid, privateKey);
  return { ...withVid, signature };
}

test("Schema <-> SDK coherence: an SDK-produced Object validates against the envelope schema", () => {
  const envelope = makeValidEnvelope();
  const ok = validateEnvelope(envelope);
  assert.equal(ok, true, JSON.stringify(validateEnvelope.errors, null, 2));
});

test("Schema <-> SDK coherence: optional lifecycle fields validate", () => {
  const envelope = makeValidEnvelope();
  const withLifecycle = {
    ...envelope,
    lifecycle_state: "retracted",
    supersedes: envelope.vid,
    revision_reason: "factual correction",
    "onp:extensions": { "org.onp.ai-metadata": { ai_involved: false } },
    "onp:metadata": { language: "nl" },
  };
  const ok = validateEnvelope(withLifecycle);
  assert.equal(ok, true, JSON.stringify(validateEnvelope.errors, null, 2));
});

test("Schema <-> test-vector coherence: every vector matches its expected_result structurally", () => {
  const tv = loadJson(
    "sdk/reference-impl/examples/test-vectors.json"
  ) as { vectors: Array<Record<string, any>> };
  for (const v of tv.vectors) {
    const envelope = {
      ...v.input_envelope,
      ...(v.expected_vid ? { vid: v.expected_vid } : {}),
      ...(v.expected_signature ? { signature: v.expected_signature } : {}),
    };
    const ok = validateEnvelope(envelope);
    if (v.expected_result === "valid") {
      assert.equal(ok, true,
        `${v.test_vector_id} should pass the structural schema: ` +
        JSON.stringify(validateEnvelope.errors));
    } else {
      assert.equal(ok, false,
        `${v.test_vector_id} is expected structurally invalid and must fail the schema`);
    }
  }
});

test("Schema: examples/publisher.json validates against the Publisher Key Record schema", () => {
  const record = loadJson("sdk/reference-impl/examples/publisher.json");
  const ok = validateKeyRecord(record);
  assert.equal(ok, true, JSON.stringify(validateKeyRecord.errors, null, 2));
});

test("Envelope schema: unknown top-level field is rejected (ONP-0001 Section 4.1 rule 3 — closed envelope)", () => {
  const envelope = { ...makeValidEnvelope(), rogue_field: true };
  assert.equal(validateEnvelope(envelope), false);
});

test("Envelope schema: malformed OID is rejected (ONP-1001 Appendix A grammar)", () => {
  const envelope = { ...makeValidEnvelope(), oid: "onp:oid:Example.COM:Bad_Id!" };
  assert.equal(validateEnvelope(envelope), false);
});

test("Envelope schema: non-UTC signed_at is rejected (ONP-1000: ISO 8601 UTC)", () => {
  const envelope = { ...makeValidEnvelope(), signed_at: "2026-07-28T00:00:00+02:00" };
  assert.equal(validateEnvelope(envelope), false);
});

test("Envelope schema: content_type outside onp:companion:<name> is rejected (ONP-1000 Section 4.4 rule 2)", () => {
  const envelope = { ...makeValidEnvelope(), content_type: "application/json" };
  assert.equal(validateEnvelope(envelope), false);
});

test("Envelope schema: non-reverse-DNS extension namespace is rejected (ONP-0001 Section 5.2)", () => {
  const envelope = {
    ...makeValidEnvelope(),
    "onp:extensions": { "not-namespaced": {} },
  };
  assert.equal(validateEnvelope(envelope), false);
});

test("Key Record schema: previous key without valid_until is rejected (ONP-0004 Section 4.4 rule 2)", () => {
  const record = {
    onp_trust_anchor_type: "domain",
    publisher_domain: "example.onp.dev",
    current_keys: [],
    previous_keys: [
      {
        key_id: "onp:key:old",
        algorithm: "Ed25519",
        public_key: "eph9gqldpi59ShqTjQrEw_kx-UtqdbYWp2HUY2g4PK4",
        valid_from: "2025-01-01T00:00:00Z",
      },
    ],
  };
  assert.equal(validateKeyRecord(record), false);
});

test("Key Record schema: revoked_at accepts null and timestamp, rejects other types", () => {
  const base = {
    onp_trust_anchor_type: "domain",
    publisher_domain: "example.onp.dev",
    current_keys: [],
    previous_keys: [
      {
        key_id: "onp:key:old",
        algorithm: "Ed25519",
        public_key: "eph9gqldpi59ShqTjQrEw_kx-UtqdbYWp2HUY2g4PK4",
        valid_from: "2025-01-01T00:00:00Z",
        valid_until: "2026-01-01T00:00:00Z",
        revoked_at: null as unknown,
      },
    ],
  };
  assert.equal(validateKeyRecord(base), true, JSON.stringify(validateKeyRecord.errors));
  base.previous_keys[0].revoked_at = "2025-06-01T00:00:00Z";
  assert.equal(validateKeyRecord(base), true);
  base.previous_keys[0].revoked_at = false;
  assert.equal(validateKeyRecord(base), false);
});
