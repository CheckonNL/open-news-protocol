/**
 * ONP-1000 News Object: the envelope structure.
 */

export interface PublisherReference {
  domain: string;
  key_id: string;
}

/** ONP-1000 Section 5.1: the seven REQUIRED fields, plus OPTIONAL ones. */
export interface NewsObjectEnvelope {
  [key: string]: unknown;
  oid: string;
  vid: string;
  publisher: PublisherReference;
  signed_at: string;
  signature: string;
  content_type: string;
  content: Record<string, unknown>;

  // OPTIONAL, ONP-0006 / ONP-1005:
  lifecycle_state?: "published" | "retracted";
  supersedes?: string;
  revision_reason?: string;
  republish_of_retraction?: string;
  "onp:metadata"?: Record<string, unknown>;
  "onp:extensions"?: Record<string, unknown>;
}

/** The envelope before vid/signature are computed. */
export type UnsignedEnvelope = Omit<NewsObjectEnvelope, "vid" | "signature">;

/** ONP-1000 Section 4.2: the seven-field Minimal Viable Object check. */
export function isMinimalViableObject(envelope: Record<string, unknown>): boolean {
  const required = [
    "oid",
    "vid",
    "publisher",
    "signed_at",
    "signature",
    "content_type",
    "content",
  ];
  return required.every((k) => k in envelope);
}
