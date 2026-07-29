/**
 * The running example this entire specification series has carried
 * since ONP-0000: RegioPurmerend's fusie-onderzoek Article.
 *
 * This is where its VID and signature stop being illustrative
 * placeholders ("AbC123-example-digest-bytes") and become real,
 * computed values — the concrete deliverable ONP-9000 Section 2.2
 * said was still missing.
 */

import {
  generateKeypair,
  publicKeyFromRaw,
  signObject,
  validateCore,
  buildOid,
  base64url,
  type UnsignedEnvelope,
  type NewsObjectEnvelope,
} from "../src/index.js";

function main() {
  // 1. Generate a keypair (in production, this is done once and the
  //    public key published at .well-known/onp/publisher.json, ONP-0004).
  const { privateKey, publicKeyRaw } = generateKeypair();
  const publicKey = publicKeyFromRaw(publicKeyRaw);

  console.log("=== Publisher Key Record excerpt (ONP-0004 Section 5.1) ===");
  console.log(
    JSON.stringify(
      {
        domain: "regiopurmerend.nl",
        current_keys: [
          {
            key_id: "onp:key:2026-07-01",
            algorithm: "Ed25519",
            public_key: base64url(publicKeyRaw),
          },
        ],
      },
      null,
      2
    )
  );

  // 2. Assemble the unsigned envelope (ONP-1000 Section 4.1).
  const unsigned: UnsignedEnvelope = {
    oid: buildOid("regiopurmerend.nl", "fusie-onderzoek-necker-van-naem"),
    publisher: { domain: "regiopurmerend.nl", key_id: "onp:key:2026-07-01" },
    signed_at: "2026-07-28T10:00:00Z",
    content_type: "onp:companion:article",
    content: {
      headline: "Fusie-onderzoek Purmerend gepubliceerd",
      dek: "Necker van Naem publiceert budgetanalyse voor de voorgestelde fusie.",
      body: "Purmerend - Het langverwachte onderzoek naar de financiele gevolgen van een fusie tussen Purmerend, Landsmeer, Wormerland en Oostzaan is vandaag gepubliceerd.\n\n## Belangrijkste bevindingen\n\n- Bevinding een\n- Bevinding twee",
      byline: ["Redactie RegioPurmerend"],
      section: "Politiek",
      canonical_url: "https://regiopurmerend.nl/artikel/fusie-onderzoek",
    },
  };

  // 3-4. Compute the VID (ONP-1001 Section 4.3) and sign (ONP-1003
  //      Section 4.4) in one call.
  const envelope = signObject(unsigned, privateKey);

  console.log("\n=== Complete, REALLY-signed News Object ===");
  console.log(JSON.stringify(envelope, null, 2));

  // 5. Verify (ONP-1003 Section 6.1, full pipeline).
  const result = validateCore(envelope, publicKey);
  console.log("\n=== Validation Result ===");
  console.log(result);

  if (!result.core_authenticated) {
    throw new Error("Self-verification failed — this should never happen");
  }

  // 6. Negative test: tamper with the content, confirm rejection.
  const tampered: NewsObjectEnvelope = {
    ...envelope,
    content: { ...envelope.content, headline: "TAMPERED HEADLINE" },
  };
  const tamperedResult = validateCore(tampered, publicKey);
  console.log("\n=== Validation Result (tampered content) ===");
  console.log(tamperedResult);
  if (tamperedResult.core_authenticated) {
    throw new Error("Tampered object was incorrectly accepted!");
  }

  console.log("\nAll checks passed: real signature, real VID, tamper detection confirmed.");
}

main();
