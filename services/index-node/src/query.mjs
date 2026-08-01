#!/usr/bin/env node
/**
 * Read-only lookup against a dumped index.json — "which endorsements does
 * this index know about for target_ref X". Deliberately returns the raw,
 * individually-verified entries with no ranking or aggregation (ONP-2900
 * §6.2): interpretation is left to whoever queries it.
 *
 * Usage: node src/query.mjs <targetVid> [index.json]
 */

import { readFileSync } from "node:fs";

export function query(index, targetRef) {
  return index[targetRef] ?? [];
}

function main() {
  const target = process.argv[2];
  const indexPath = process.argv[3] ?? new URL("../index.json", import.meta.url).pathname;
  if (!target) {
    console.error("usage: node src/query.mjs <targetVid> [index.json]");
    process.exit(1);
  }

  const index = JSON.parse(readFileSync(indexPath, "utf8"));
  const entries = query(index, target);

  if (entries.length === 0) {
    console.log(`No endorsements found in this index for ${target}.`);
    return;
  }
  for (const e of entries) {
    console.log(`${e.stance} — ${e.endorserDomain} (${e.endorsementOid})`);
    if (e.rationale) console.log(`  ${e.rationale}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
