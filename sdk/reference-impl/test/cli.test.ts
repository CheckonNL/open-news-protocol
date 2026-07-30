import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// dist/test/cli.test.js -> dist/src/cli.js
const CLI = fileURLToPath(new URL("../src/cli.js", import.meta.url));

function run(args: string[]) {
  const opts = { encoding: "utf8" as const, maxBuffer: 10 * 1024 * 1024 };
  let r = spawnSync(process.execPath, [CLI, ...args], opts);
  // `r.error` is set only when the process could not be *started* (e.g.
  // EAGAIN/ENOMEM when the machine is under load), never for a real CLI
  // exit — a non-zero exit code has `r.error` undefined. Retry only the
  // transient start failures, so the suite does not flake under load
  // while a genuine non-zero exit is still surfaced to the assertions.
  for (let attempt = 0; attempt < 4 && r.error; attempt++) {
    r = spawnSync(process.execPath, [CLI, ...args], opts);
  }
  if (r.error) throw r.error;
  return r;
}

function unsignedFixture(dir: string): string {
  const path = join(dir, "unsigned.json");
  writeFileSync(
    path,
    JSON.stringify({
      oid: "onp:oid:example.onp.dev:cli-test-01",
      publisher: { domain: "example.onp.dev", key_id: "onp:key:cli" },
      signed_at: "2026-07-29T00:00:00Z",
      content_type: "onp:companion:article",
      content: { headline: "CLI test", body: "Body." },
    })
  );
  return path;
}

for (const algorithm of ["ed25519", "ecdsa-p256"] as const) {
  test(`CLI: keygen -> sign -> verify round-trips (${algorithm})`, () => {
    const kg = run(["keygen", "--algorithm", algorithm]);
    assert.equal(kg.status, 0, kg.stderr);
    const { private_key, public_key, algorithm: reported } = JSON.parse(kg.stdout);
    assert.equal(reported, algorithm);

    const dir = mkdtempSync(join(tmpdir(), "onp-cli-"));
    try {
      const unsigned = unsignedFixture(dir);
      const signed = join(dir, "signed.json");

      const s = run(["sign", unsigned, "--key", private_key, "--algorithm", algorithm, "--out", signed]);
      assert.equal(s.status, 0, s.stderr);

      const v = run(["verify", signed, "--key", public_key]);
      assert.equal(v.status, 0, `expected authentic, got: ${v.stderr}`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

test("CLI: verify exits non-zero on tampered content", () => {
  const kg = run(["keygen"]);
  const { private_key, public_key } = JSON.parse(kg.stdout);
  const dir = mkdtempSync(join(tmpdir(), "onp-cli-"));
  try {
    const unsigned = unsignedFixture(dir);
    const signed = join(dir, "signed.json");
    run(["sign", unsigned, "--key", private_key, "--out", signed]);

    // Tamper with the signed Object's content.
    const obj = JSON.parse(readFileSync(signed, "utf8"));
    obj.content.headline = "TAMPERED";
    writeFileSync(signed, JSON.stringify(obj));

    const v = run(["verify", signed, "--key", public_key]);
    assert.notEqual(v.status, 0, "tampered object must be rejected with non-zero exit");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI: unknown command exits non-zero", () => {
  const r = run(["frobnicate"]);
  assert.notEqual(r.status, 0);
});

test("CLI: publisher-json emits a well-formed Publisher Key Record", () => {
  const kg = run(["keygen"]);
  const { public_key } = JSON.parse(kg.stdout);
  const r = run([
    "publisher-json",
    "--domain", "example.onp.dev",
    "--key-id", "onp:key:cli",
    "--public-key", public_key,
  ]);
  assert.equal(r.status, 0, r.stderr);
  const record = JSON.parse(r.stdout);
  assert.equal(record.onp_trust_anchor_type, "domain");
  assert.equal(record.publisher_domain, "example.onp.dev");
  assert.equal(record.current_keys[0].public_key, public_key);
});
