/**
 * ONP Core conformance runner (reference implementation).
 *
 * Reads vectors.json and checks each vector against an ONP
 * implementation. This runner drives the reference SDK, which is how
 * the reference implementation dogfoods the suite in CI. A THIRD PARTY
 * does not use this file: they read vectors.json (pure data) and the
 * README, and write an equivalent runner against their own code. Only
 * the three assertions below are normative; everything else is glue.
 *
 * Exit code: 0 if every vector passes, 1 otherwise — so it drops into
 * CI directly.
 */

import { pathToFileURL } from "node:url";
import {
  computeVid,
  signEnvelope,
  validateCore,
  validateCoreWithTrust,
  base64urlDecode,
  TrustAnchorResolver,
} from "../sdk/reference-impl/dist/src/index.js";

/** Map a Core validation result to the suite's outcome vocabulary. */
function outcome(result) {
  return result.core_authenticated ? "authenticated" : result.failure_step;
}

export async function runAll(suite) {
  const results = [];
  const add = (id, ok, detail) => results.push({ id, ok, detail });

  // PRODUCE: recompute the VID and signature and require byte equality.
  for (const v of suite.produce ?? []) {
    const key = suite.test_keys[v.key];
    const priv = base64urlDecode(key.private_key);
    const vid = computeVid(v.unsigned);
    const signature = signEnvelope({ ...v.unsigned, vid }, priv, key.algorithm);
    const vidOk = vid === v.expected_vid;
    const sigOk = signature === v.expected_signature;
    add(
      v.id,
      vidOk && sigOk,
      `vid ${vidOk ? "ok" : "MISMATCH"}, signature ${sigOk ? "ok" : "MISMATCH"}`
    );
  }

  // VERIFY: offline Core validation against a supplied public key.
  for (const v of suite.verify ?? []) {
    const actual = outcome(validateCore(v.envelope, base64urlDecode(v.public_key)));
    add(v.id, actual === v.expected, `expected ${v.expected}, got ${actual}`);
  }

  // VERIFY_TRUST: full pipeline with the vector's Publisher Key Record
  // injected as the Trust Anchor (no network).
  for (const v of suite.verify_trust ?? []) {
    const resolver = new TrustAnchorResolver({
      fetcher: async () => v.publisher_key_record,
    });
    const actual = outcome(await validateCoreWithTrust(v.envelope, resolver));
    add(v.id, actual === v.expected, `expected ${v.expected}, got ${actual}`);
  }

  const pass = results.filter((r) => r.ok).length;
  return { pass, fail: results.length - pass, results };
}

// Run directly: `node conformance/run.mjs`
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { readFileSync } = await import("node:fs");
  const suite = JSON.parse(
    readFileSync(new URL("./vectors.json", import.meta.url), "utf8")
  );
  const { pass, fail, results } = await runAll(suite);
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.id}  — ${r.detail}`);
  }
  console.log(`\n${suite.conformance_suite}: ${pass} pass, ${fail} fail`);
  process.exit(fail ? 1 : 0);
}
