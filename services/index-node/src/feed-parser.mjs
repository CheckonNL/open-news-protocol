/**
 * Minimal, purpose-built extractor for the two Object-URL carriage forms
 * ONP-1006 §4.4 defines — RSS's <onp:object> element and Atom's
 * rel="alternate" type="application/onp+json" link — not a general XML
 * parser. ONP-1006 §8.4 deliberately defines no enumeration endpoint;
 * this is the discovery channel the protocol actually specifies:
 * publishers' own, already-existing feeds.
 */

function parseAttrs(tag) {
  const attrs = {};
  const re = /([a-zA-Z0-9:_-]+)\s*=\s*"([^"]*)"|([a-zA-Z0-9:_-]+)\s*=\s*'([^']*)'/g;
  let m;
  while ((m = re.exec(tag))) {
    attrs[m[1] ?? m[3]] = m[2] ?? m[4];
  }
  return attrs;
}

/** Returns the deduplicated list of Object URLs carried in a feed (RSS or Atom). */
export function extractObjectUrls(feedXml) {
  const urls = new Set();

  for (const m of feedXml.matchAll(/<onp:object>([^<]+)<\/onp:object>/g)) {
    urls.add(m[1].trim());
  }

  for (const m of feedXml.matchAll(/<link\b[^>]*\/?>/g)) {
    const attrs = parseAttrs(m[0]);
    if (attrs.rel === "alternate" && attrs.type === "application/onp+json" && attrs.href) {
      urls.add(attrs.href.trim());
    }
  }

  return [...urls];
}
