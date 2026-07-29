#!/usr/bin/env node
/**
 * onp — command-line interface to the ONP reference SDK.
 *
 * This is the Node ENTRY POINT, deliberately separate from the
 * platform-agnostic library graph: it may use node: built-ins (fs,
 * process, util). The library it drives (./index.js) stays
 * runtime-neutral, which is what the browser bundle proves.
 *
 * Commands:
 *   onp keygen [--algorithm ed25519|ecdsa-p256]
 *   onp sign <unsigned.json> --key <b64url-private> [--algorithm <id>] [--out <file>]
 *   onp verify <file|url> [--key <b64url-public>] [--anchor <publisher.json>]
 *   onp publisher-json --domain <d> --key-id <id> --public-key <b64url> [--algorithm <name>]
 *
 * Exit codes: 0 = success / Object Core-authenticated; 1 = failure /
 * Object rejected. So `onp verify` is usable directly in CI and shell
 * pipelines.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs, type ParseArgsConfig } from "node:util";
import {
  generateKeypair,
  signObject,
  validateCore,
  validateCoreWithTrust,
  base64url,
  base64urlDecode,
  TrustAnchorResolver,
  type UnsignedEnvelope,
  type NewsObjectEnvelope,
  type PublisherKeyRecord,
} from "./index.js";

const USAGE = `onp — Open News Protocol reference CLI

Usage:
  onp keygen [--algorithm ed25519|ecdsa-p256]
  onp sign <unsigned.json> --key <b64url-private> [--algorithm <id>] [--out <file>]
  onp verify <file|url> [--key <b64url-public>] [--anchor <publisher.json>]
  onp publisher-json --domain <d> --key-id <id> --public-key <b64url> [--algorithm <name>]

verify runs the full pipeline (Trust Anchor resolution over HTTPS) by
default; --key does offline crypto-only verification, --anchor uses a
local Publisher Key Record instead of fetching one. Exit 0 = authentic,
1 = rejected.`;

function die(msg: string, code = 1): never {
  process.stderr.write(msg + "\n");
  process.exit(code);
}

/**
 * parseArgs wrapper that turns a parse error into a friendly exit and
 * returns loosely-typed values (each flag is `string | boolean |
 * undefined`), which is all these commands need — the specific flags
 * are read by name below.
 */
function parse(
  argv: string[],
  options: ParseArgsConfig["options"],
  allowPositionals = false
): { values: Record<string, string | boolean | undefined>; positionals: string[] } {
  try {
    const r = parseArgs({ args: argv, options, allowPositionals, strict: true });
    return {
      values: r.values as Record<string, string | boolean | undefined>,
      positionals: r.positionals as string[],
    };
  } catch (e) {
    return die(`${(e as Error).message}\n\n${USAGE}`);
  }
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    return die(`Cannot read JSON from ${path}: ${(e as Error).message}`);
  }
}

async function loadObject(target: string): Promise<unknown> {
  if (/^https?:\/\//i.test(target)) {
    let res: Response;
    try {
      res = await fetch(target, {
        headers: { accept: "application/onp+json, application/json" },
        redirect: "follow",
      });
    } catch (e) {
      return die(`Fetch failed: ${(e as Error).message}`);
    }
    if (!res.ok) return die(`Fetch failed: HTTP ${res.status}`);
    return res.json();
  }
  return readJson(target);
}

function cmdKeygen(argv: string[]): void {
  const { values } = parse(argv, { algorithm: { type: "string", default: "ed25519" } });
  const algorithm = values.algorithm as string;
  let keys;
  try {
    keys = generateKeypair(algorithm);
  } catch (e) {
    return die((e as Error).message);
  }
  process.stdout.write(
    JSON.stringify(
      {
        algorithm,
        private_key: base64url(keys.privateKey),
        public_key: base64url(keys.publicKey),
      },
      null,
      2
    ) + "\n"
  );
}

function cmdSign(argv: string[]): void {
  const { values, positionals } = parse(
    argv,
    {
      key: { type: "string" },
      algorithm: { type: "string", default: "ed25519" },
      out: { type: "string" },
    },
    true
  );
  const input = positionals[0];
  if (!input) return die("usage: onp sign <unsigned.json> --key <b64url-private> [--algorithm <id>] [--out <file>]");
  if (!values.key) return die("onp sign requires --key <base64url-private-key>");

  const unsigned = readJson(input) as UnsignedEnvelope;
  let envelope: NewsObjectEnvelope;
  try {
    envelope = signObject(unsigned, base64urlDecode(values.key as string), values.algorithm as string);
  } catch (e) {
    return die(`Signing failed: ${(e as Error).message}`);
  }
  const out = JSON.stringify(envelope, null, 2) + "\n";
  if (values.out) {
    writeFileSync(values.out as string, out);
    process.stderr.write(`Wrote ${values.out}\n`);
  } else {
    process.stdout.write(out);
  }
}

async function cmdVerify(argv: string[]): Promise<void> {
  const { values, positionals } = parse(
    argv,
    { key: { type: "string" }, anchor: { type: "string" } },
    true
  );
  const target = positionals[0];
  if (!target) return die("usage: onp verify <file|url> [--key <b64url-public>] [--anchor <publisher.json>]");

  const envelope = (await loadObject(target)) as NewsObjectEnvelope;

  if (values.key) {
    // Offline crypto-only verification against a supplied public key.
    const result = validateCore(envelope, base64urlDecode(values.key as string));
    return report(result.core_authenticated, result.failure_step, result);
  }

  const resolver = values.anchor
    ? new TrustAnchorResolver({
        fetcher: async () => readJson(values.anchor as string) as PublisherKeyRecord,
      })
    : new TrustAnchorResolver(); // default: fetch publisher.json over HTTPS
  const result = await validateCoreWithTrust(envelope, resolver);
  return report(result.core_authenticated, result.failure_step, result);
}

function cmdPublisherJson(argv: string[]): void {
  const { values } = parse(argv, {
    domain: { type: "string" },
    "key-id": { type: "string" },
    "public-key": { type: "string" },
    algorithm: { type: "string", default: "Ed25519" },
    "valid-from": { type: "string" },
  });
  for (const req of ["domain", "key-id", "public-key"] as const) {
    if (!values[req]) return die(`onp publisher-json requires --${req}`);
  }
  const record: PublisherKeyRecord = {
    onp_trust_anchor_type: "domain",
    publisher_domain: values.domain as string,
    current_keys: [
      {
        key_id: values["key-id"] as string,
        algorithm: values.algorithm as string,
        public_key: values["public-key"] as string,
        valid_from: (values["valid-from"] as string) ?? new Date().toISOString(),
      },
    ],
    previous_keys: [],
  };
  process.stdout.write(JSON.stringify(record, null, 2) + "\n");
}

function report(ok: boolean, failureStep: unknown, full: unknown): never {
  process.stdout.write(JSON.stringify(full, null, 2) + "\n");
  if (ok) {
    process.stderr.write("OK: Core-authenticated\n");
    process.exit(0);
  }
  process.stderr.write(`REJECTED: ${String(failureStep)}\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  switch (command) {
    case "keygen":
      return cmdKeygen(rest);
    case "sign":
      return cmdSign(rest);
    case "verify":
      return await cmdVerify(rest);
    case "publisher-json":
      return cmdPublisherJson(rest);
    case "help":
    case "--help":
    case "-h":
    case undefined:
      process.stdout.write(USAGE + "\n");
      return;
    default:
      return die(`Unknown command: ${command}\n\n${USAGE}`);
  }
}

main().catch((e) => die(`Unexpected error: ${(e as Error).stack ?? e}`));
