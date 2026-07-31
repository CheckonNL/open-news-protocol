/**
 * ONP-1004 Validation: the full multi-level pipeline and the
 * Validation Result contract.
 *
 * Level 1 (Core) reuses validateCoreWithTrust() unchanged — this
 * module introduces no change to Core validation, exactly as
 * ONP-1004 Section 2.2 requires. Levels 2a (Companion) and 2b
 * (Extension) run on pluggable validators; a Node implementing
 * none still produces a complete, well-formed Validation Result
 * with `unknown` throughout (Section 6.3's interoperability
 * guarantee).
 *
 * The level-independence rules (Section 4.2) are enforced by
 * construction: Level 2 validators receive the envelope read-only,
 * their outcomes are written only into their own result fields, and
 * nothing they return can reach `core_authenticated`.
 */

import type { NewsObjectEnvelope } from "./envelope.js";
import type { TrustAnchorResolver } from "./trust.js";
import {
  validateCoreWithTrust,
  type TrustValidationFailureStep,
} from "./validate.js";
import type { ResolutionResult } from "./trust.js";

export type CompanionOutcome = true | false | "unknown";
export type ExtensionOutcome = "valid" | "invalid" | "unknown";

/** ONP-1004 Section 5.1: a detected Extension Conflict. */
export interface ExtensionConflict {
  namespaces: [string, string];
  description: string;
}

/**
 * A Companion validator judges `content` against its own Object
 * Model and Requirements (ONP-1004 Section 4.3, rule 1). It MUST
 * NOT throw for non-conformant content — non-conformance is the
 * `false` outcome, not an error.
 */
export type CompanionValidator = (
  content: Record<string, unknown>,
  envelope: Readonly<NewsObjectEnvelope>
) => boolean;

/**
 * An Extension validator judges its own namespace's data (ONP-1004
 * Section 4.4, rule 1) and MAY define pairwise conflict rules
 * (Section 6.2). conflictsWith returns a human-readable description
 * when this Extension's own rules detect a conflict with the named
 * other namespace, or null. Silence between two Extensions is not
 * a conflict (Section 6.2, final rule).
 */
export interface ExtensionValidator {
  validate(
    data: Record<string, unknown>,
    envelope: Readonly<NewsObjectEnvelope>
  ): boolean;
  conflictsWith?(
    otherNamespace: string,
    otherData: Record<string, unknown>,
    ownData: Record<string, unknown>
  ): string | null;
}

/** What a Node implements. Empty registry = minimal conforming Node. */
export interface ValidatorRegistry {
  companions?: Record<string, CompanionValidator>; // keyed by content_type
  extensions?: Record<string, ExtensionValidator>; // keyed by namespace
}

/**
 * ONP-1004 Section 5.1: the Validation Result, as a discriminated
 * union so the Section 4.5 rule 2 contract is a type-level fact:
 * when core_authenticated is false, no Level 2 field exists to be
 * relied upon.
 */
export type ValidationResult =
  | {
      core_authenticated: true;
      companion_valid: CompanionOutcome;
      extension_results: Record<string, ExtensionOutcome>;
      conflicts: ExtensionConflict[];
      failure_step: null;
      trust_resolution: ResolutionResult | null;
    }
  | {
      core_authenticated: false;
      failure_step: TrustValidationFailureStep;
      trust_resolution: ResolutionResult | null;
    };

/**
 * ONP-1004 Section 6.1: the full pipeline.
 *
 *   LEVEL 1 — Core (ONP-1000-1003 + ONP-0004), via
 *     validateCoreWithTrust. Failure is terminal: STOP, return, do
 *     not proceed to Level 2 (Section 4.5, rule 2).
 *   LEVEL 2a — Companion: implemented -> true/false, else "unknown"
 *     ("unknown" and false are distinct and never conflated,
 *     Section 4.3, rule 3).
 *   LEVEL 2b — Extension: per present namespace valid/invalid/
 *     "unknown"; pairwise conflict checks among implemented
 *     namespaces, reported explicitly, never silently resolved
 *     (Section 4.4, rule 2).
 *   LEVEL 3 — Application: not evaluated here; this function's
 *     return value is the boundary (Section 4.6).
 */
export async function validateFull(
  envelope: NewsObjectEnvelope,
  resolver: TrustAnchorResolver,
  registry: ValidatorRegistry = {}
): Promise<ValidationResult> {
  // LEVEL 1 — Core.
  const core = await validateCoreWithTrust(envelope, resolver);
  if (!core.core_authenticated) {
    return {
      core_authenticated: false,
      failure_step: core.failure_step as TrustValidationFailureStep,
      trust_resolution: core.trust_resolution,
    };
  }

  // LEVEL 2a — Companion.
  let companion_valid: CompanionOutcome = "unknown";
  const companionValidator = registry.companions?.[envelope.content_type];
  if (companionValidator) {
    companion_valid = companionValidator(
      envelope.content as Record<string, unknown>,
      envelope
    );
  }

  // LEVEL 2b — Extension (independent of 2a; Section 4.2 rule 3's
  // declared-dependency exception is a per-Extension concern its
  // validator expresses by reading the envelope it receives).
  const extension_results: Record<string, ExtensionOutcome> = {};
  const conflicts: ExtensionConflict[] = [];
  const present = (envelope["onp:extensions"] ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  const namespaces = Object.keys(present);

  for (const ns of namespaces) {
    const v = registry.extensions?.[ns];
    extension_results[ns] = v
      ? v.validate(present[ns], envelope)
        ? "valid"
        : "invalid"
      : "unknown";
  }

  // Pairwise conflict detection among IMPLEMENTED namespaces present
  // on this Object, asking each side's own rules (Section 6.2).
  const implemented = namespaces.filter((ns) => registry.extensions?.[ns]);
  for (let i = 0; i < implemented.length; i++) {
    for (let j = i + 1; j < implemented.length; j++) {
      const [a, b] = [implemented[i], implemented[j]];
      const fromA = registry.extensions![a].conflictsWith?.(
        b, present[b], present[a]
      );
      const fromB = registry.extensions![b].conflictsWith?.(
        a, present[a], present[b]
      );
      const description = fromA ?? fromB;
      if (description != null) {
        conflicts.push({ namespaces: [a, b], description });
      }
    }
  }

  return {
    core_authenticated: true,
    companion_valid,
    extension_results,
    conflicts,
    failure_step: null,
    trust_resolution: core.trust_resolution,
  };
}

// ---------------------------------------------------------------------------
// Reference validators: the first published Companion and Extension,
// so Level 2 is demonstrably real, not only pluggable.
// ---------------------------------------------------------------------------

/**
 * ONP-2100 Section 5: the Article Companion's Object Model.
 * headline and body are REQUIRED strings; every other field is
 * OPTIONAL but type-checked when present.
 */
export const articleCompanionValidator: CompanionValidator = (content) => {
  const isStr = (x: unknown) => typeof x === "string";
  const isStrArray = (x: unknown) =>
    Array.isArray(x) && x.every((e) => typeof e === "string");

  if (!isStr(content.headline) || !isStr(content.body)) return false;
  const optionalStrings = ["dek", "section", "canonical_url", "rights_ref", "payment_ref"];
  for (const f of optionalStrings) {
    if (f in content && !isStr(content[f])) return false;
  }
  const optionalArrays = ["byline", "contributor_refs", "media_refs", "source_refs", "corrections_ref"];
  for (const f of optionalArrays) {
    if (f in content && !isStrArray(content[f])) return false;
  }
  return true;
};

// Shared type predicates for the Companion validators below. Each
// validator mirrors its spec's Object Model (Section 5): REQUIRED
// fields must be present and correctly typed, OPTIONAL fields are
// type-checked only when present, and non-conformance is the `false`
// outcome — never a thrown error (ONP-1004 Section 4.3, rule 1).
const isString = (x: unknown): x is string => typeof x === "string";
const isBoolean = (x: unknown) => typeof x === "boolean";
const isInteger = (x: unknown) => typeof x === "number" && Number.isInteger(x);
const isNumber = (x: unknown) => typeof x === "number";
const isStringArray = (x: unknown) => Array.isArray(x) && x.every(isString);

/**
 * ONP-2200 Section 5: the Media Companion's Object Model. media_type
 * (enum), asset_url, asset_hash, mime_type are REQUIRED.
 */
export const mediaCompanionValidator: CompanionValidator = (content) => {
  const MEDIA_TYPES = new Set(["image", "video", "audio", "document"]);
  if (!isString(content.media_type) || !MEDIA_TYPES.has(content.media_type)) return false;
  for (const f of ["asset_url", "asset_hash", "mime_type"]) {
    if (!isString(content[f])) return false;
  }
  const optStr = ["alt_text", "caption", "credit", "creator_ref", "rights_ref", "payment_ref"];
  for (const f of optStr) {
    if (f in content && !isString(content[f])) return false;
  }
  for (const f of ["width", "height"]) {
    if (f in content && !isInteger(content[f])) return false;
  }
  if ("duration_seconds" in content && !isNumber(content.duration_seconds)) return false;
  return true;
};

/**
 * ONP-2400 Section 5: the Rights Companion's Object Model. At least one
 * of license_identifier / license_url is REQUIRED.
 */
export const rightsCompanionValidator: CompanionValidator = (content) => {
  const hasId = "license_identifier" in content;
  const hasUrl = "license_url" in content;
  if (!hasId && !hasUrl) return false;
  if (hasId && !isString(content.license_identifier)) return false;
  if (hasUrl && !isString(content.license_url)) return false;
  for (const f of ["copyright_holder", "attribution_text", "embargo_until"]) {
    if (f in content && !isString(content[f])) return false;
  }
  if ("copyright_year" in content && !isString(content.copyright_year) && !isInteger(content.copyright_year)) {
    return false;
  }
  const optBool = ["redistribution_permitted", "attribution_required", "derivative_works_permitted", "commercial_use_permitted"];
  for (const f of optBool) {
    if (f in content && !isBoolean(content[f])) return false;
  }
  if ("territory_restrictions" in content && !isStringArray(content.territory_restrictions)) return false;
  return true;
};

/**
 * ONP-2500 Section 5: the Payments Companion's Object Model.
 * payment_model (enum) is REQUIRED; currency is REQUIRED when price is
 * present; price MUST be a string, never a JSON number (Section 4.4).
 */
export const paymentsCompanionValidator: CompanionValidator = (content) => {
  const MODELS = new Set(["free", "one-time", "subscription", "donation", "micropayment"]);
  if (!isString(content.payment_model) || !MODELS.has(content.payment_model)) return false;
  if ("price" in content) {
    if (!isString(content.price)) return false;
    if (!("currency" in content)) return false; // REQUIRED if price present
  }
  if ("currency" in content && !isString(content.currency)) return false;
  for (const f of ["recipient_ref", "subscription_period"]) {
    if (f in content && !isString(content[f])) return false;
  }
  if ("payment_provider_hint" in content && !isStringArray(content.payment_provider_hint)) return false;
  if ("revenue_shares" in content) {
    if (!Array.isArray(content.revenue_shares)) return false;
    for (const share of content.revenue_shares) {
      if (typeof share !== "object" || share === null) return false;
      const s = share as Record<string, unknown>;
      if (!isString(s.recipient_ref) || !isString(s.percentage)) return false;
    }
  }
  return true;
};

/**
 * ONP-2700 Section 5: the Corrections Companion's Object Model. Every
 * field is REQUIRED; correction_type is an enum.
 */
export const correctionsCompanionValidator: CompanionValidator = (content) => {
  const TYPES = new Set(["factual", "clarification", "typographical", "retraction", "update"]);
  for (const f of ["subject_oid", "corrected_vid", "correcting_vid", "explanation", "corrected_at"]) {
    if (!isString(content[f])) return false;
  }
  if (!isString(content.correction_type) || !TYPES.has(content.correction_type)) return false;
  return true;
};

/**
 * ONP-3100 Section 5: org.onp.ai-metadata. Every field OPTIONAL,
 * but type- and enum-checked when present; unknown members within
 * the namespace are non-conformant (the namespace's schema is owned
 * entirely by ONP-3100).
 */
export const aiMetadataExtensionValidator: ExtensionValidator = {
  validate(data) {
    const GENERATION = new Set([
      "human", "ai-assisted", "ai-generated", "ai-generated-human-edited",
    ]);
    const BOOLEANS = new Set([
      "human_review", "training_permitted", "agent_use_permitted",
      "attribution_required_for_ai_use",
    ]);
    for (const [k, v] of Object.entries(data)) {
      if (k === "generation_method") {
        if (typeof v !== "string" || !GENERATION.has(v)) return false;
      } else if (k === "model_reference") {
        if (typeof v !== "string") return false;
      } else if (BOOLEANS.has(k)) {
        if (typeof v !== "boolean") return false;
      } else {
        return false; // member not in ONP-3100's model
      }
    }
    return true;
  },
  // ONP-3100 declares no conflict relationship with any other
  // Extension; per ONP-1004 Section 6.2, silence means no conflict.
};

/** A registry preloaded with the reference validators above. */
export const referenceValidatorRegistry: ValidatorRegistry = {
  companions: {
    "onp:companion:article": articleCompanionValidator,
    "onp:companion:media": mediaCompanionValidator,
    "onp:companion:rights": rightsCompanionValidator,
    "onp:companion:payments": paymentsCompanionValidator,
    "onp:companion:corrections": correctionsCompanionValidator,
  },
  extensions: { "org.onp.ai-metadata": aiMetadataExtensionValidator },
};
