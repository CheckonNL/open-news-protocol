/**
 * Badge core: the reusable, DOM-free logic behind <onp-badge>.
 *
 * Given a News Object URL, it retrieves the Object, runs the full ONP
 * Core validation pipeline (Trust Anchor resolution included) via the
 * published SDK, and — new in v0.2 — follows the Object's Companion
 * references to verify the whole story a reader sees:
 *
 *   - photos (media_refs): each Media Object's signature AND a re-hash
 *     of the actual image bytes against the signed asset_hash, plus the
 *     photographer credit and their Rights/Payment agreement;
 *   - source documents (source_refs -> document_ref): signature + a
 *     re-hash of the file bytes;
 *   - corrections (corrections_ref): signature + whether the correction
 *     names the Version being read.
 *
 * All I/O is injectable, so this is a pure function the tests exercise
 * without a browser or a network. Hashing uses a pure-JS SHA-256 (no
 * Web Crypto), so verification works in any context.
 *
 * The trust guarantee is the SDK's, unchanged: everything is checked in
 * the reader's browser against the publisher's own key — the badge
 * never trusts the page it is embedded in, only the cryptography.
 */

import {
  validateCoreWithTrust,
  TrustAnchorResolver,
  parseOidDomain,
  base64url,
  type NewsObjectEnvelope,
} from "open-news-protocol";
import { sha256 } from "@noble/hashes/sha2";

export type ObjectFetcher = (url: string) => Promise<unknown>;
export type AssetFetcher = (url: string) => Promise<Uint8Array>;

export type BadgeStatus = "verified" | "attention" | "rejected" | "unavailable";

/** ok: true = verified · false = failed · null = could not be checked. */
export interface PhotoResult {
  credit?: string;
  ok: boolean | null;
}
export interface RightsResult {
  ok: boolean;
  license?: string;
  reusePermitted?: boolean;
}
export interface PaymentResult {
  ok: boolean;
  shares: Array<{ recipient: string; percentage: string }>;
}
export interface CorrectionResult {
  ok: boolean;
  type?: string;
  explanation?: string;
  currentVersion?: boolean;
}
export interface DocumentResult {
  ok: boolean | null;
  title?: string;
  url?: string;
  /** Where the document was originally published, per the Source
   *  Object's `origin_url` — a citation, not itself re-checked. */
  originUrl?: string;
}

export interface BadgeResult {
  status: BadgeStatus;
  detail: string;
  headline?: string;
  publisherDomain?: string;
  signedAt?: string;
  eudiName?: string;
  failureStep?: string;
  photos?: PhotoResult[];
  rights?: RightsResult;
  payment?: PaymentResult;
  correction?: CorrectionResult;
  documents?: DocumentResult[];
}

export interface EvaluateOptions {
  objectFetcher?: ObjectFetcher;
  assetFetcher?: AssetFetcher;
  resolver?: TrustAnchorResolver;
}

const defaultObjectFetcher: ObjectFetcher = async (url) => {
  const res = await fetch(url, {
    headers: { accept: "application/onp+json, application/json" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const defaultAssetFetcher: AssetFetcher = async (url) => {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
};

const assetHash = (bytes: Uint8Array): string => "sha-256:" + base64url(sha256(bytes));

/** ONP-1006 §4.1: the canonical Object URL derived from an OID. */
function objectUrlForOid(oid: string): string {
  const { domain, localId } = parseOidDomain(oid);
  return `https://${domain}/.well-known/onp/objects/${localId}`;
}

function describeFailure(step: string | null | undefined): string {
  switch (step) {
    case "structural":
      return "The Object is missing required fields.";
    case "oid-domain-mismatch":
      return "The Object's identifier does not match its publisher.";
    case "vid-mismatch":
      return "The content has been altered since it was signed.";
    case "unrecognized-algorithm":
      return "The signature uses an algorithm this verifier does not support.";
    case "trust-anchor-resolution-failed":
      return "The publisher's signing key could not be confirmed at its domain.";
    case "algorithm-mismatch":
      return "The signature algorithm does not match the publisher's key.";
    case "signature-invalid":
      return "The signature does not verify — this Object is not authentic.";
    default:
      return "The Object could not be verified.";
  }
}

const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

/**
 * Fetch a News Object by URL and reduce its verification — text plus
 * every referenced Companion — to a display-ready BadgeResult.
 */
export async function evaluateBadge(
  objectUrl: string,
  options: EvaluateOptions = {}
): Promise<BadgeResult> {
  const objectFetcher = options.objectFetcher ?? defaultObjectFetcher;
  const assetFetcher = options.assetFetcher ?? defaultAssetFetcher;
  const resolver = options.resolver ?? new TrustAnchorResolver();

  let body: unknown;
  try {
    body = await objectFetcher(objectUrl);
  } catch (e) {
    return { status: "unavailable", detail: `Could not retrieve the Object (${(e as Error).message}).` };
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { status: "unavailable", detail: "That address did not return a News Object." };
  }

  const envelope = body as NewsObjectEnvelope;
  const content = (envelope.content ?? {}) as Record<string, unknown>;
  const headline = str(content.headline);
  const publisherDomain = envelope.publisher?.domain;
  const signedAt = envelope.signed_at;

  const validation = await validateCoreWithTrust(envelope, resolver);
  if (!validation.core_authenticated) {
    return {
      status: "rejected",
      detail: describeFailure(validation.failure_step),
      headline,
      publisherDomain,
      signedAt,
      failureStep: validation.failure_step ?? undefined,
    };
  }

  const tr = validation.trust_resolution;
  const eudiName = tr && tr.resolved && tr.eudi?.verified ? tr.eudi.subject?.legal_name : undefined;

  // Verify a referenced Companion Object by OID: fetch it at its
  // canonical URL and run Core validation. Returns null when it cannot
  // be retrieved or parsed (an "unchecked" outcome, not a failure).
  async function verifyByOid(
    oid: string
  ): Promise<{ content: Record<string, unknown>; ok: boolean; vid?: string } | null> {
    try {
      const obj = await objectFetcher(objectUrlForOid(oid));
      if (typeof obj !== "object" || obj === null) return null;
      const env = obj as NewsObjectEnvelope;
      const v = await validateCoreWithTrust(env, resolver);
      return { content: (env.content ?? {}) as Record<string, unknown>, ok: v.core_authenticated, vid: str(env.vid) };
    } catch {
      return null;
    }
  }

  // Photos + (from the first photo) the photographer's Rights/Payment.
  let photos: PhotoResult[] | undefined;
  let rights: RightsResult | undefined;
  let payment: PaymentResult | undefined;
  const mediaRefs = strArray(content.media_refs);
  if (mediaRefs.length) {
    photos = [];
    let firstMedia: Record<string, unknown> | undefined;
    for (const oid of mediaRefs) {
      const res = await verifyByOid(oid);
      if (!res) {
        photos.push({ ok: null });
        continue;
      }
      firstMedia = firstMedia ?? res.content;
      let ok: boolean | null = res.ok;
      const url = str(res.content.asset_url);
      const hash = str(res.content.asset_hash);
      if (ok && url && hash) {
        try {
          ok = assetHash(await assetFetcher(url)) === hash;
        } catch {
          ok = null; // signature valid, bytes just unreachable
        }
      }
      photos.push({ credit: str(res.content.credit), ok });
    }
    if (firstMedia) {
      rights = await resolveRights(str(firstMedia.rights_ref), verifyByOid);
      payment = await resolvePayment(str(firstMedia.payment_ref), verifyByOid);
    }
  }

  // Source documents: source_ref -> document_ref (Verified Asset Reference).
  let documents: DocumentResult[] | undefined;
  const sourceRefs = strArray(content.source_refs);
  if (sourceRefs.length) {
    documents = [];
    for (const oid of sourceRefs) {
      const src = await verifyByOid(oid);
      if (!src) {
        documents.push({ ok: null });
        continue;
      }
      const title = str(src.content.description);
      const originUrl = str(src.content.origin_url);
      const docOid = str(src.content.document_ref);
      if (!src.ok || !docOid) {
        documents.push({ ok: src.ok ? null : false, title, originUrl });
        continue;
      }
      const doc = await verifyByOid(docOid);
      if (!doc) {
        documents.push({ ok: null, title, originUrl });
        continue;
      }
      const url = str(doc.content.asset_url);
      const hash = str(doc.content.asset_hash);
      let ok: boolean | null = doc.ok;
      if (ok && url && hash) {
        try {
          ok = assetHash(await assetFetcher(url)) === hash;
        } catch {
          ok = null;
        }
      }
      documents.push({ ok, title, url, originUrl });
    }
  }

  // Corrections: does a signed correction name the Version being read?
  let correction: CorrectionResult | undefined;
  const correctionRefs = strArray(content.corrections_ref);
  for (const oid of correctionRefs) {
    const c = await verifyByOid(oid);
    if (!c) continue;
    correction = {
      ok: c.ok,
      type: str(c.content.correction_type),
      explanation: str(c.content.explanation),
      currentVersion: str(c.content.correcting_vid) === str(envelope.vid),
    };
  }

  const failed =
    (photos?.some((p) => p.ok === false) ?? false) ||
    (documents?.some((d) => d.ok === false) ?? false) ||
    (correction ? !correction.ok : false) ||
    (rights ? !rights.ok : false) ||
    (payment ? !payment.ok : false);

  return {
    status: failed ? "attention" : "verified",
    detail: failed
      ? `Signed by ${publisherDomain}, but part of the content could not be confirmed.`
      : `Signed by ${publisherDomain}, unchanged since it was published.`,
    headline,
    publisherDomain,
    signedAt,
    eudiName,
    photos,
    rights,
    payment,
    correction,
    documents,
  };
}

async function resolveRights(
  oid: string | undefined,
  verify: (oid: string) => Promise<{ content: Record<string, unknown>; ok: boolean } | null>
): Promise<RightsResult | undefined> {
  if (!oid) return undefined;
  const r = await verify(oid);
  if (!r) return undefined;
  return {
    ok: r.ok,
    license: str(r.content.license_identifier) ?? str(r.content.license_url),
    reusePermitted: typeof r.content.redistribution_permitted === "boolean" ? r.content.redistribution_permitted : undefined,
  };
}

async function resolvePayment(
  oid: string | undefined,
  verify: (oid: string) => Promise<{ content: Record<string, unknown>; ok: boolean } | null>
): Promise<PaymentResult | undefined> {
  if (!oid) return undefined;
  const r = await verify(oid);
  if (!r) return undefined;
  const shares = Array.isArray(r.content.revenue_shares)
    ? (r.content.revenue_shares as Array<Record<string, unknown>>)
        .map((s) => ({ recipient: str(s.recipient_ref) ?? "?", percentage: str(s.percentage) ?? "?" }))
    : [];
  return { ok: r.ok, shares };
}
