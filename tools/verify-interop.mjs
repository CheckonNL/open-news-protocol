// tools/verify-interop.mjs — CI gate: PHP <-> TypeScript agreement.
import { readFileSync } from "node:fs";
import { validateFull, TrustAnchorResolver, referenceValidatorRegistry, validateCoreWithTrust } from "../sdk/reference-impl/dist/src/index.js";

async function verifySet(path, key) {
  const data = JSON.parse(readFileSync(path, "utf8"));
  const record = data.publisher_key_record;
  const resolver = new TrustAnchorResolver({ fetcher: async () => record });
  const envelopes = key === "versions" ? data.versions : [data.envelope];
  for (const env of envelopes) {
    const r = await validateFull(env, resolver, referenceValidatorRegistry);
    if (!r.core_authenticated || r.companion_valid !== true) {
      console.error(`FAIL ${path}: ${env.vid} ->`, r.core_authenticated ? r.companion_valid : r.failure_step);
      process.exit(1);
    }
  }
  // chain check for the simulation set
  if (key === "versions") {
    for (let i = 1; i < envelopes.length; i++) {
      if (envelopes[i].supersedes !== envelopes[i - 1].vid) {
        console.error(`FAIL ${path}: chain broken at v${i + 1}`);
        process.exit(1);
      }
    }
  }
  console.log(`OK ${path}: ${envelopes.length} envelope(s) verified`);
}

await verifySet(process.argv[2], "envelope");
await verifySet(process.argv[3], "versions");
console.log("PHP <-> TypeScript interop: GREEN");
