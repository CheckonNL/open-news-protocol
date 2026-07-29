import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mediaCompanionValidator,
  rightsCompanionValidator,
  paymentsCompanionValidator,
  correctionsCompanionValidator,
  referenceValidatorRegistry,
  type CompanionValidator,
} from "../src/index.js";

// The reference validators ignore the envelope; a dummy suffices.
const ENV = {} as never;
const ok = (v: CompanionValidator, c: Record<string, unknown>) => v(c, ENV);

test("Media (ONP-2200): valid content passes; missing/ill-typed fails", () => {
  assert.equal(
    ok(mediaCompanionValidator, {
      media_type: "image",
      asset_url: "https://x/y.jpg",
      asset_hash: "sha-256:abc",
      mime_type: "image/jpeg",
      alt_text: "a photo",
      width: 800,
      duration_seconds: 1.5,
    }),
    true
  );
  // media_type not in the enum
  assert.equal(ok(mediaCompanionValidator, { media_type: "hologram", asset_url: "u", asset_hash: "h", mime_type: "m" }), false);
  // missing REQUIRED asset_hash
  assert.equal(ok(mediaCompanionValidator, { media_type: "image", asset_url: "u", mime_type: "m" }), false);
  // width present but not an integer
  assert.equal(ok(mediaCompanionValidator, { media_type: "image", asset_url: "u", asset_hash: "h", mime_type: "m", width: "800" }), false);
});

test("Rights (ONP-2400): needs a license id or url; type-checks options", () => {
  assert.equal(ok(rightsCompanionValidator, { license_identifier: "CC-BY-4.0", attribution_required: true }), true);
  assert.equal(ok(rightsCompanionValidator, { license_url: "https://creativecommons.org/licenses/by/4.0/" }), true);
  assert.equal(ok(rightsCompanionValidator, { copyright_year: 2026 }), false); // neither id nor url
  assert.equal(ok(rightsCompanionValidator, { license_identifier: "X", commercial_use_permitted: "yes" }), false); // bool as string
  assert.equal(ok(rightsCompanionValidator, { license_identifier: "X", territory_restrictions: ["NL", 5] }), false);
});

test("Payments (ONP-2500): payment_model enum; price is a string with currency", () => {
  assert.equal(ok(paymentsCompanionValidator, { payment_model: "free" }), true);
  assert.equal(
    ok(paymentsCompanionValidator, {
      payment_model: "one-time",
      price: "2.50",
      currency: "EUR",
      revenue_shares: [{ recipient_ref: "onp:oid:a:b", percentage: "50" }],
    }),
    true
  );
  assert.equal(ok(paymentsCompanionValidator, { payment_model: "barter" }), false); // not in enum
  assert.equal(ok(paymentsCompanionValidator, { payment_model: "one-time", price: 2.5, currency: "EUR" }), false); // price must be string
  assert.equal(ok(paymentsCompanionValidator, { payment_model: "one-time", price: "2.50" }), false); // currency required with price
  assert.equal(ok(paymentsCompanionValidator, { payment_model: "donation", revenue_shares: [{ recipient_ref: "x" }] }), false); // share missing percentage
});

test("Corrections (ONP-2700): all fields REQUIRED; correction_type enum", () => {
  const valid = {
    subject_oid: "onp:oid:example:a",
    corrected_vid: "onp:vid:sha-256:x",
    correcting_vid: "onp:vid:sha-256:y",
    correction_type: "factual",
    explanation: "Fixed a name.",
    corrected_at: "2026-07-29T00:00:00Z",
  };
  assert.equal(ok(correctionsCompanionValidator, valid), true);
  assert.equal(ok(correctionsCompanionValidator, { ...valid, correction_type: "vibes" }), false);
  const { explanation, ...missing } = valid;
  assert.equal(ok(correctionsCompanionValidator, missing), false);
});

test("referenceValidatorRegistry registers all five Companions", () => {
  const keys = Object.keys(referenceValidatorRegistry.companions ?? {});
  for (const k of [
    "onp:companion:article",
    "onp:companion:media",
    "onp:companion:rights",
    "onp:companion:payments",
    "onp:companion:corrections",
  ]) {
    assert.ok(keys.includes(k), `missing ${k}`);
  }
});
