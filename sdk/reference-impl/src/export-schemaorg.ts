/**
 * ONP-9005 Section 4.1: deterministic export mapping from an ONP
 * Article Object to schema.org/NewsArticle JSON-LD.
 *
 * This is an EXPORT only (Section 4.3) — the output carries no ONP
 * signature and MUST NOT be treated as an equivalent trust artifact
 * to the signed Object it was derived from.
 */

import type { NewsObjectEnvelope } from "./envelope.js";

export interface SchemaOrgNewsArticle {
  "@context": "https://schema.org";
  "@type": "NewsArticle";
  headline: string;
  description?: string;
  identifier: string;
  datePublished: string;
  dateModified?: string;
  publisher: { "@type": "Organization"; url: string };
  author?: { "@type": "Person" | "Organization"; name: string }[];
  image?: string;
  mainEntityOfPage?: string;
  license?: string;
  inLanguage?: string;
}

/**
 * Maps an ONP Article Object (content_type = onp:companion:article)
 * to schema.org/NewsArticle, per the table in ONP-9005 Section 4.1.
 *
 * Does not resolve Object References (contributor_refs, media_refs,
 * rights_ref) — callers that have already resolved them may pass the
 * resolved values via `resolved`. Unresolved references are simply
 * omitted from the output, consistent with ONP-9003 Section 4.4's
 * lazy-resolution guidance: exporting should not force eager
 * resolution of every reference.
 */
export function toSchemaOrgNewsArticle(
  envelope: NewsObjectEnvelope,
  resolved?: {
    authorNames?: string[];
    imageUrl?: string;
    licenseUrlOrIdentifier?: string;
  }
): SchemaOrgNewsArticle {
  if (envelope.content_type !== "onp:companion:article") {
    throw new Error(
      `toSchemaOrgNewsArticle only supports onp:companion:article, got ${envelope.content_type}`
    );
  }
  const content = envelope.content as Record<string, unknown>;
  const metadata = (envelope["onp:metadata"] ?? {}) as Record<string, unknown>;

  const out: SchemaOrgNewsArticle = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: String(content.headline ?? metadata.title ?? ""),
    identifier: envelope.oid,
    datePublished: envelope.signed_at,
    publisher: {
      "@type": "Organization",
      url: `https://${envelope.publisher.domain}`,
    },
  };

  if (content.dek) out.description = String(content.dek);
  else if (metadata.summary) out.description = String(metadata.summary);

  if (content.canonical_url) out.mainEntityOfPage = String(content.canonical_url);
  if (metadata.language) out.inLanguage = String(metadata.language);

  const authorNames =
    resolved?.authorNames ??
    (Array.isArray(content.byline) ? (content.byline as string[]) : undefined);
  if (authorNames && authorNames.length > 0) {
    out.author = authorNames.map((name) => ({ "@type": "Person" as const, name }));
  }

  if (resolved?.imageUrl) out.image = resolved.imageUrl;
  if (resolved?.licenseUrlOrIdentifier) out.license = resolved.licenseUrlOrIdentifier;

  return out;
}
