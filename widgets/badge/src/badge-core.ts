/**
 * Badge core: the reusable, DOM-free logic behind <onp-badge>.
 *
 * Given a News Object URL, it retrieves the Object, runs the full ONP
 * Core validation pipeline (Trust Anchor resolution included) via the
 * published SDK, and reduces the outcome to a small, display-ready
 * result. All I/O is injectable, so this is a pure function the tests
 * exercise without a browser or a network.
 *
 * The trust guarantee is the SDK's, unchanged: the reader's browser
 * fetches the publisher's key from the publisher's own domain and
 * verifies the signature locally — the badge never trusts the page it
 * is embedded in, only the cryptography.
 */

import {
  validateCoreWithTrust,
  TrustAnchorResolver,
  type NewsObjectEnvelope,
} from "open-news-protocol";

export type ObjectFetcher = (url: string) => Promise<unknown>;

export type BadgeStatus = "verified" | "rejected" | "unavailable";

export interface BadgeResult {
  status: BadgeStatus;
  /** Short human verdict for the badge line. */
  detail: string;
  headline?: string;
  publisherDomain?: string;
  signedAt?: string;
  /** Verified legal identity from an EUDI attestation, when present. */
  eudiName?: string;
  /** The Core failure step, when status is "rejected". */
  failureStep?: string;
}

export interface EvaluateOptions {
  objectFetcher?: ObjectFetcher;
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

/** Plain-language explanation of each Core validation failure. */
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

/**
 * Fetch a News Object by URL and reduce its verification to a
 * display-ready BadgeResult.
 */
export async function evaluateBadge(
  objectUrl: string,
  options: EvaluateOptions = {}
): Promise<BadgeResult> {
  const objectFetcher = options.objectFetcher ?? defaultObjectFetcher;
  const resolver = options.resolver ?? new TrustAnchorResolver();

  let body: unknown;
  try {
    body = await objectFetcher(objectUrl);
  } catch (e) {
    return {
      status: "unavailable",
      detail: `Could not retrieve the Object (${(e as Error).message}).`,
    };
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {
      status: "unavailable",
      detail: "That address did not return a News Object.",
    };
  }

  const envelope = body as NewsObjectEnvelope;
  const content = (envelope.content ?? {}) as Record<string, unknown>;
  const headline = typeof content.headline === "string" ? content.headline : undefined;
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
  const eudiName =
    tr && tr.resolved && tr.eudi?.verified ? tr.eudi.subject?.legal_name : undefined;

  return {
    status: "verified",
    detail: `Signed by ${publisherDomain}, unchanged since it was published.`,
    headline,
    publisherDomain,
    signedAt,
    eudiName,
  };
}
