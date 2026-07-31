// tools/verify-companions.mjs — CI gate: the WordPress plugin's Companion
// Objects (Media incl. "document", Rights, Payments, Sources, Corrections)
// verify byte-for-byte under the TypeScript reference implementation.
//
// Every Object MUST be core_authenticated (signature + VID). Companion
// validation must not be `false`: `true` for the kinds that carry a
// reference validator (Media/Rights/Payments/Corrections), and "unknown"
// is acceptable for Sources, which has no reference validator — that is
// the ONP-1004 interoperability guarantee, not a failure.
import { readFileSync } from "node:fs";
import {
  validateFull,
  TrustAnchorResolver,
  referenceValidatorRegistry,
} from "../sdk/reference-impl/dist/src/index.js";

const data = JSON.parse(readFileSync(process.argv[2], "utf8"));
const resolver = new TrustAnchorResolver({ fetcher: async () => data.publisher_key_record });

let n = 0;
for (const env of data.objects) {
  const r = await validateFull(env, resolver, referenceValidatorRegistry);
  if (!r.core_authenticated) {
    console.error(`FAIL ${env.content_type} ${env.oid}: core ->`, r.failure_step);
    process.exit(1);
  }
  if (r.companion_valid === false) {
    console.error(`FAIL ${env.content_type} ${env.oid}: companion invalid`);
    process.exit(1);
  }
  n++;
}
console.log(`OK companions: ${n} Object(s) verified (PHP -> TypeScript)`);
