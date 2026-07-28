/**
 * ONP-9005 Section 4.2: deterministic export mapping from an ONP
 * Article Object to an RSS 2.0 <item>.
 *
 * Export only (Section 4.3) — no ONP signature accompanies this
 * output.
 */

import type { NewsObjectEnvelope } from "./envelope.js";
import { objectUrlFromOid } from "./retrieval.js";

export interface RssItem {
  title: string;
  description?: string;
  link?: string;
  guid: { value: string; isPermaLink: false };
  pubDate: string; // RFC 822
  creator?: string;
  category?: string;
  /** ONP-1006 Section 4.4 rule 1: the Object URL, carried as
   *  <onp:object> under xmlns:onp="https://opennewsprotocol.org/ns/feed". */
  objectUrl?: string;
}

/** ISO 8601 -> RFC 822, as RSS 2.0 <pubDate> requires. */
function toRfc822(iso: string): string {
  return new Date(iso).toUTCString();
}

/**
 * Maps an ONP Article Object to an RSS 2.0 <item>, per the table in
 * ONP-9005 Section 4.2.
 */
export function toRssItem(envelope: NewsObjectEnvelope): RssItem {
  if (envelope.content_type !== "onp:companion:article") {
    throw new Error(
      `toRssItem only supports onp:companion:article, got ${envelope.content_type}`
    );
  }
  const content = envelope.content as Record<string, unknown>;
  const metadata = (envelope["onp:metadata"] ?? {}) as Record<string, unknown>;

  const item: RssItem = {
    title: String(content.headline ?? metadata.title ?? ""),
    guid: { value: envelope.oid, isPermaLink: false },
    pubDate: toRfc822(envelope.signed_at),
    // ONP-1006 Section 4.4 rule 1: derive the Object URL from the
    // OID so feed consumers can fetch the signed Object itself.
    objectUrl: objectUrlFromOid(envelope.oid),
  };

  if (content.dek) item.description = String(content.dek);
  else if (metadata.summary) item.description = String(metadata.summary);

  if (content.canonical_url) item.link = String(content.canonical_url);
  if (content.section) item.category = String(content.section);

  if (Array.isArray(content.byline) && content.byline.length > 0) {
    item.creator = String((content.byline as string[])[0]);
  }

  return item;
}

/** Renders an RssItem as an XML <item> string. */
export function rssItemToXml(item: RssItem): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const parts = [
    "<item>",
    `  <title>${esc(item.title)}</title>`,
    item.description ? `  <description>${esc(item.description)}</description>` : null,
    item.link ? `  <link>${esc(item.link)}</link>` : null,
    `  <guid isPermaLink="false">${esc(item.guid.value)}</guid>`,
    `  <pubDate>${item.pubDate}</pubDate>`,
    item.creator ? `  <dc:creator>${esc(item.creator)}</dc:creator>` : null,
    item.category ? `  <category>${esc(item.category)}</category>` : null,
    item.objectUrl ? `  <onp:object>${esc(item.objectUrl)}</onp:object>` : null,
    "</item>",
  ].filter((l): l is string => l !== null);

  return parts.join("\n");
}
