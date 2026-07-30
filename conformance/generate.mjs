/**
 * Regenerates conformance/vectors.json from the fixed test keys.
 *
 * Run once to (re)establish the suite: `node conformance/generate.mjs`.
 * It builds every vector with the reference SDK, self-checks the whole
 * suite via run.mjs, and only writes if all vectors pass — so a
 * committed vectors.json is always internally consistent.
 *
 * The test keys below are FIXED and NON-PRODUCTION (ONP-9000 Section
 * 5.1). Committing them is what makes the `produce` vectors
 * byte-reproducible by any independent implementation.
 */

import { writeFileSync } from "node:fs";
import {
  signObject,
  base64url,
  base64urlDecode,
  buildOid,
} from "../sdk/reference-impl/dist/src/index.js";
import { runAll } from "./run.mjs";

const test_keys = {
  ed25519: {
    algorithm: "ed25519",
    private_key: "abdEaUfNn6mwZBV3M787PD8QQmqT40PFxENfgaSkS2s",
    public_key: "5sxr5c4qf4hfnf1BNCOWMZS0WbuHEsHVX_dxZPNtWbA",
  },
  "ecdsa-p256": {
    algorithm: "ecdsa-p256",
    private_key: "o2XR_f5eqZw-3rw_T2DQ2z4j1oRiCn4xNuwI38Siaqk",
    public_key: "A4I8EKSTx2hWOSMHX-ksWWKF44RjszHfJY9j19QEVJGA",
  },
};

const DOMAIN = "conformance.onp.dev";
const KEY_ID = "onp:key:conformance-2026";
const SIGNED_AT = "2026-07-29T00:00:00Z";

function unsigned(localId) {
  return {
    oid: buildOid(DOMAIN, localId),
    publisher: { domain: DOMAIN, key_id: KEY_ID },
    signed_at: SIGNED_AT,
    content_type: "onp:companion:article",
    content: { headline: "Conformance Test Object", body: "Body text." },
  };
}

function sign(localId, keyName) {
  const k = test_keys[keyName];
  return signObject(unsigned(localId), base64urlDecode(k.private_key), k.algorithm);
}

function record(keyName, algorithmDisplay, keyId = KEY_ID) {
  return {
    onp_trust_anchor_type: "domain",
    publisher_domain: DOMAIN,
    current_keys: [
      {
        key_id: keyId,
        algorithm: algorithmDisplay,
        public_key: test_keys[keyName].public_key,
        valid_from: "2026-01-01T00:00:00Z",
      },
    ],
    previous_keys: [],
  };
}

// ── produce ─────────────────────────────────────────────────────────
const produce = ["ed25519", "ecdsa-p256"].map((keyName) => {
  const u = unsigned(`produce-${keyName}`);
  const signed = sign(`produce-${keyName}`, keyName);
  return {
    id: `produce-${keyName}`,
    description: `Sign a Minimal Viable Object with the fixed ${keyName} test key; the VID and signature MUST reproduce byte-for-byte (ONP-1001/1002/1003).`,
    key: keyName,
    unsigned: u,
    expected_vid: signed.vid,
    expected_signature: signed.signature,
  };
});

// ── verify (offline Core validation) ────────────────────────────────
const valid = sign("verify-valid", "ed25519");
const pub = test_keys.ed25519.public_key;

const structural = structuredClone(valid);
delete structural.signed_at;

const oidMismatch = structuredClone(valid);
oidMismatch.oid = "onp:oid:attacker.example:verify-valid";

const vidMismatch = structuredClone(valid);
vidMismatch.content.headline = "Tampered headline";

const unrecognized = structuredClone(valid);
unrecognized.signature = valid.signature.replace("onp:sig:ed25519:", "onp:sig:rsa-9999:");

const sigInvalid = structuredClone(valid);
{
  const [, prefix, b64] = valid.signature.match(/^(onp:sig:ed25519:)(.+)$/);
  const bytes = base64urlDecode(b64);
  bytes[0] ^= 0xff; // flip a significant byte -> a different, invalid signature
  sigInvalid.signature = prefix + base64url(bytes);
}

const verify = [
  { id: "verify-authenticated", description: "A correctly signed Object is Core-authenticated.", public_key: pub, expected: "authenticated", envelope: valid },
  { id: "verify-structural", description: "Missing REQUIRED signed_at field (ONP-1000).", public_key: pub, expected: "structural", envelope: structural },
  { id: "verify-oid-domain-mismatch", description: "oid domain does not match publisher.domain (ONP-1001).", public_key: pub, expected: "oid-domain-mismatch", envelope: oidMismatch },
  { id: "verify-vid-mismatch", description: "Content tampered after signing; recomputed VID mismatches (ONP-1001).", public_key: pub, expected: "vid-mismatch", envelope: vidMismatch },
  { id: "verify-unrecognized-algorithm", description: "Signature declares an algorithm-id not in the registry (ONP-0005).", public_key: pub, expected: "unrecognized-algorithm", envelope: unrecognized },
  { id: "verify-signature-invalid", description: "Signature bytes altered; cryptographic verification fails (ONP-1003).", public_key: pub, expected: "signature-invalid", envelope: sigInvalid },
];

// ── verify_trust (full pipeline, injected key record) ───────────────
const trustEd = sign("trust-valid-ed", "ed25519");
const trustP256 = sign("trust-valid-p256", "ecdsa-p256");

const verify_trust = [
  { id: "trust-authenticated-ed25519", description: "Valid Object + matching domain-anchored Publisher Key Record (ONP-0004).", publisher_key_record: record("ed25519", "Ed25519"), expected: "authenticated", envelope: trustEd },
  { id: "trust-authenticated-ecdsa-p256", description: "Valid ECDSA-P256 Object resolves and verifies via the record (ONP-0004 + ONP-1003 Appendix C.2).", publisher_key_record: record("ecdsa-p256", "ECDSA-P256"), expected: "authenticated", envelope: trustP256 },
  { id: "trust-resolution-failed-unknown-key", description: "The Object's key_id is absent from the record; resolution fails (ONP-0004 Section 6.1).", publisher_key_record: record("ed25519", "Ed25519", "onp:key:some-other-key"), expected: "trust-anchor-resolution-failed", envelope: trustEd },
  { id: "trust-algorithm-mismatch", description: "The record declares a different algorithm than the signature (ONP-1003 Section 4.5 step 4).", publisher_key_record: record("ed25519", "ECDSA-P256"), expected: "algorithm-mismatch", envelope: trustEd },
];

const suite = {
  conformance_suite: "onp-core-conformance-v0.1.0",
  description:
    "ONP Core conformance vectors: produce (byte-reproducible VID + signature), verify (offline Core validation outcomes), and verify_trust (full pipeline with an injected Publisher Key Record). See README.md for the outcome vocabulary and how to run.",
  generated_by: "open-news-protocol conformance generator",
  note:
    "Fixed test keys are NON-PRODUCTION, published for reproducibility (ONP-9000 Section 5.1). ECDSA-P256 signatures are deterministic (RFC 6979); a non-deterministic signer reproduces the VID byte-for-byte but produces a different, still-valid signature — see README.",
  test_keys,
  produce,
  verify,
  verify_trust,
};

const { pass, fail, results } = await runAll(suite);
if (fail) {
  for (const r of results) if (!r.ok) console.error(`SELF-CHECK FAIL  ${r.id}  — ${r.detail}`);
  console.error(`\nRefusing to write vectors.json: ${fail} self-check failure(s).`);
  process.exit(1);
}

writeFileSync(new URL("./vectors.json", import.meta.url), JSON.stringify(suite, null, 2) + "\n");
console.log(
  `Wrote vectors.json: ${produce.length} produce, ${verify.length} verify, ${verify_trust.length} verify_trust — ${pass} self-checked, 0 failures.`
);
