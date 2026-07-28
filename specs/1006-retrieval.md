Title: Open News Protocol (ONP): Retrieval
Document Number: ONP-1006
Status: Working Draft
Version: 0.1.0
Author: Open News Protocol Working Group
Last Modified: 2026-07-28

---

# Abstract

This document defines the Retrieval Convention: how a Node that
holds an OID obtains the News Object it names, and how a consumer
learns that new Objects or new Versions exist — using only ordinary,
already-deployed web technology. It defines a canonical Object URL
derived mechanically from the OID, VID-based conditional retrieval
via standard HTTP caching semantics, and a convention for carrying
Object URLs in existing RSS/Atom feeds and HTML pages. It
deliberately defines no new protocol, no node-to-node
synchronization, and no discovery index: per ONP-0000 Section 7.2,
ONP standardizes the object, not the channel — this document makes
that stance operational instead of leaving "exchanging" (ONP-0000
Section 1) without any interoperable floor. It extends the Core
series roadmap; that extension is recorded in ONP-0000 v0.4.0.

---

# Status of This Document

This document is part of the ONP Core series (ONP-1000-1999). It is
directly implementable and normative. It is the first Core document
added after the roadmap ONP-0000 originally laid out was completed;
the roadmap extension is a MINOR change to ONP-0000 under ONP-0007
Section 4.2, called out explicitly there. It is a Working Draft.

---

# Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174], per the interpretation established in
ONP-0000.

---

# 1. Introduction

Every Core document so far answers a question about an Object a
Node already holds: what it is (ONP-1000), how it names itself
(ONP-1001), how its bytes become deterministic (ONP-1002), how its
origin is proven (ONP-1003), whether its key was authorized
(ONP-0004). None answers the question that precedes all of them in
practice: *given an OID, where are the bytes?*

Without an answer, interoperability stops at "if you somehow
obtained the Object." Every consumer needs a per-publisher
arrangement, which is exactly the fragmentation ONP-0000 Section 1
names as the problem.

The answer this document gives is deliberately small, and it is
made possible by a property ONP-1001 already established: the
publisher's domain is *inside* the OID. An OID is therefore almost
a URL already — one fixed path convention turns
`onp:oid:regiopurmerend.nl:artikel-123` into a retrievable HTTPS
address mechanically, with no registry, no resolver service, and no
lookup protocol. The same `.well-known/onp/` path space ONP-0004
already claims for the Publisher Key Record hosts it.

Freshness comes equally free: the VID is a content-derived,
globally unique identifier of a specific Version — which is
precisely what an HTTP entity tag is for. Serving the VID as the
ETag makes standard conditional requests (RFC 9110) a
version-change detector with zero new mechanism.

Notification reuses what publishers already run: RSS/Atom feeds and
HTML pages carry a pointer to the Object URL, so existing feed
infrastructure becomes the "something new exists" channel.

---

# 2. Scope

## 2.1 In Scope

* the canonical Object URL derived from an OID, and the OPTIONAL
  Version URL for retrieving a specific prior Version;
* server behavior when serving Objects at these URLs (media type,
  ETag, conditional requests, TLS);
* consumer behavior when retrieving (validation obligation,
  redirect policy, 404 semantics);
* the convention for carrying Object URLs in RSS 2.0 and Atom
  feeds and in HTML documents.

## 2.2 Out of Scope

This document does NOT define:

* any obligation to serve Objects over HTTP at all — distribution
  remains non-exclusive (ONP-0000 Section 7.2); a publisher MAY
  distribute solely via other channels;
* node-to-node synchronization, replication, or reconciliation of
  Object sets between Nodes;
* any index, listing, or enumeration endpoint ("all Objects of this
  publisher") — deliberately, see Section 8.4;
* push notification (WebSub, WebSockets, or similar) — feeds are
  pull;
* trust of any kind: retrieval grants zero trust, and every
  retrieved Object goes through unchanged Core validation
  (ONP-1004) including Trust Anchor resolution (ONP-0004).

---

# 3. Terminology

This document is the owning specification for the following terms.

**Object URL**
: The canonical HTTPS URL at which the current Version of a News
  Object is retrievable, derived mechanically from its OID per
  Section 4.1.

**Version URL**
: The OPTIONAL HTTPS URL at which one specific Version of a News
  Object is retrievable, derived from its OID and that Version's
  VID per Section 4.3.

Terms used but owned elsewhere: **OID**, **Local Identifier**
(ONP-1001), **VID** (ONP-0001, structurally ONP-1001), **News
Object** (ONP-0000/1000), **Claimed Signing Time** (ONP-1000),
**Publisher Key Record** (ONP-0004), **Supersession** (ONP-0006).

---

# 4. Requirements

## 4.1 Object URL Derivation

1. The Object URL for an OID of the form
   `onp:oid:{domain}:{local-id}` (ONP-1001 Appendix A) is:

   ```
   https://{domain}/.well-known/onp/objects/{local-id}
   ```

   with `{domain}` and `{local-id}` taken byte-identical from the
   OID. This reuses the `.well-known/onp/` path space ONP-0004
   Section 4.2 already establishes, per RFC 8615.
2. The derivation is total and mechanical: any conforming OID
   yields exactly one Object URL, with no lookup, registry, or
   resolver involved. (The Local Identifier grammar — lowercase
   alphanumerics, `-`, or a UUID — requires no percent-encoding.)
3. Serving Objects at the Object URL is OPTIONAL. However, a
   publisher that makes News Objects retrievable over HTTPS at all
   SHOULD serve them at their Object URLs, so consumers can derive
   the location instead of needing per-publisher arrangements. A
   publisher MAY additionally serve the same Object at any other
   URL; the Object URL is canonical, not exclusive (ONP-0000
   Section 7.2).

## 4.2 Server Behavior

1. A successful response at an Object URL MUST carry the complete,
   byte-serialized current Version of the named News Object — the
   full envelope including `vid` and `signature`, exactly as
   signed.
2. The response SHOULD be served with the media type
   `application/onp+json` and MUST be parseable as the JSON
   envelope ONP-1000 defines regardless of the media type served.
   `application/onp+json` is not yet IANA-registered; registration
   is future work, and consumers MUST also accept
   `application/json` in the interim.
3. The response SHOULD carry an `ETag` header whose value is the
   Object's current VID (quoted, per RFC 9110). The VID is already
   a globally unique, content-derived identifier of exactly one
   Version — it is a natural entity tag, and no separate version
   token is needed.
4. A server providing the ETag of rule 3 MUST honor
   `If-None-Match` conditional requests per RFC 9110, answering
   `304 Not Modified` when the held VID is still current. This is
   the complete version-freshness mechanism of this document: a
   consumer re-fetches an Object URL with `If-None-Match: "<held
   VID>"` and learns from the status code alone whether a newer
   Version exists.
5. All retrieval is over HTTPS with standard WebPKI certificate
   validation, with the same posture as ONP-0004 Section 4.2:
   transport security here protects availability and reader
   privacy; it is NOT what authenticates the Object — Core
   validation of the retrieved bytes is (Section 5.2).
6. `404 Not Found` at an Object URL means only "not retrievable at
   this URL." It carries no statement about the Object's existence,
   validity, or lifecycle state, and a consumer MUST NOT interpret
   it as retraction — retraction is expressed in-band via
   `lifecycle_state` (ONP-1000 Section 4.5), never via HTTP status.

## 4.3 Version URL (OPTIONAL)

1. A publisher MAY additionally serve specific Versions at:

   ```
   https://{domain}/.well-known/onp/objects/{local-id}/versions/{vid}
   ```

   where `{vid}` is the full VID string (ONP-1001 Appendix A; the
   `:` characters it contains are legal in a URL path segment per
   RFC 3986).
2. A response at a Version URL MUST carry exactly the Version the
   VID names — which the consumer can verify unilaterally, since
   the VID is recomputable from the bytes (ONP-1001 Section 6.1).
3. Version URLs make a supersession chain (ONP-0006) walkable: a
   consumer holding a Version whose `supersedes` names a prior VID
   can attempt to retrieve that prior Version. Serving history is
   OPTIONAL and MAY be bounded by local retention policy.

## 4.4 Feed and HTML Carriage

1. A publisher distributing an RSS 2.0 feed for content that is
   also published as News Objects SHOULD include, per item, an
   `onp:object` element whose text content is the Object URL, under
   the XML namespace `https://opennewsprotocol.org/ns/feed`. RSS
   extension modules are ordinary, widely deployed practice; no
   feed consumer that ignores unknown namespaces is affected.
2. A publisher distributing an Atom feed SHOULD include, per entry,
   a `link` element with `rel="alternate"` and
   `type="application/onp+json"` pointing at the Object URL.
3. An HTML page rendering a News Object's content SHOULD include
   `<link rel="alternate" type="application/onp+json"
   href="{object-url}">` in its head, so the signed Object is
   discoverable from the human-readable page.
4. Feed and HTML carriage are pointers only. The feed entry and the
   page are unsigned and carry zero trust; the Object at the other
   end of the pointer is what gets validated. A mismatch between
   feed metadata and Object content is resolved in the Object's
   favor, always.

---

# 5. Processing Model

## 5.1 Retrieval Algorithm

```
Given OID = onp:oid:D:L, optionally a held VID H:

1. Object URL := https://D/.well-known/onp/objects/L
2. GET the Object URL over HTTPS
   (If-None-Match: "H" when H is held).
   A consumer MAY follow redirects; every hop MUST be https.
3. 304 -> the held Version is current. STOP.
   404 -> not retrievable here (Section 4.2, rule 6). STOP.
   200 -> continue.
4. Parse the body as a News Object envelope (ONP-1000).
5. Perform FULL Core validation on the retrieved bytes
   (ONP-1004 level 1, including Trust Anchor resolution,
   ONP-0004). Retrieval confers no trust whatsoever.
6. Confirm the retrieved Object's oid equals the requested OID.
   REJECT on mismatch (a server answering for the wrong OID).
```

## 5.2 Trust Posture

The self-certifying Object (ONP-1003) is what makes this document
safe to keep this small: because verification operates on bytes and
never on the channel, the channel needs no trust properties beyond
ordinary TLS. A tampered response fails VID or signature
validation; a response for the wrong Object fails step 6; a
response signed by an unauthorized key fails Trust Anchor
resolution. The Retrieval Convention therefore adds convenience,
not attack surface — with one honest exception stated in Section
8.2.

---

# 6. Examples

## 6.1 OID to Object URL

```
OID:        onp:oid:regiopurmerend.nl:wheermolen-bommen-2026
Object URL: https://regiopurmerend.nl/.well-known/onp/objects/wheermolen-bommen-2026
```

## 6.2 Conditional Retrieval

```
GET /.well-known/onp/objects/wheermolen-bommen-2026 HTTP/1.1
Host: regiopurmerend.nl
If-None-Match: "onp:vid:sha-256:L4Gvx2LkqQpihK7V61GW82nl-dUdf-FZjnfrTHGOpZc"

-> 304 Not Modified        (held Version is still current)
-> 200 + new envelope,
   ETag: "onp:vid:sha-256:<new digest>"   (a newer Version exists)
```

## 6.3 RSS Item Carriage

```xml
<rss version="2.0" xmlns:onp="https://opennewsprotocol.org/ns/feed">
  ...
  <item>
    <title>Bommenonderzoek Wheermolen-Oost afgerond</title>
    <guid isPermaLink="false">onp:oid:regiopurmerend.nl:wheermolen-bommen-2026</guid>
    <onp:object>https://regiopurmerend.nl/.well-known/onp/objects/wheermolen-bommen-2026</onp:object>
  </item>
</rss>
```

---

# 7. Interoperability

A consumer implementing only Sections 4.1 and 5.1 can retrieve and
fully verify any Object from any publisher that serves its Object
URLs — with no prior arrangement, no shared configuration, and no
mechanism beyond HTTPS GET. This is the Retrieval-layer instance of
the interoperability guarantee pattern (ONP-0001 Section 6.5,
ONP-0004 Section 6.4, ONP-1000 Section 4.4): the OPTIONAL
enhancements (Version URLs, feed carriage, HTML links) improve
reach and freshness but MUST NOT become silent preconditions for
baseline retrieval.

---

# 8. Security Considerations

## 8.1 Retrieval Is Not Trust

Nothing in this document weakens the rule that only Core validation
authenticates an Object (ONP-0004 Section 4.1). A consumer that
skips step 5 of Section 5.1 because "it came from the publisher's
own domain" has reintroduced messenger trust; implementations MUST
NOT provide a retrieval path that bypasses validation.

## 8.2 Current-Version Rollback

The one guarantee this document does NOT provide: that the Version
served at an Object URL is genuinely the newest that exists. A
compromised or misconfigured server can serve an older, validly
signed Version as "current." A consumer that has already seen a
newer Version can detect the regression (the held VID and the
supersession chain point forward); a consumer arriving fresh
cannot. Stronger recency guarantees require evidence mechanisms
(signed freshness statements, transparency logging of Version
history) that belong to future work, not to this convention — and
this limitation is inherited from, not added to, the trust model's
domain-compromise ceiling (ONP-0004 Section 8.1).

## 8.3 Redirect Handling

Following redirects is permitted for deployment flexibility (CDNs,
path migrations), but every hop MUST be HTTPS, and step 6 of
Section 5.1 makes the endpoint's identity irrelevant to
authenticity: wherever the bytes finally came from, they must be
the requested Object and must validate.

## 8.4 No Enumeration Endpoint, Deliberately

This document defines no way to list a publisher's Objects. An
enumeration surface is a synchronization and discovery concern with
its own privacy and load consequences (bulk scraping, existence
disclosure of unlisted Objects), and specifying it here would smuggle
a discovery protocol into a retrieval convention. If a future
document defines one, it does so with its own security analysis.

---

# 9. Privacy Considerations

1. Retrieval requests reveal to the publisher (and any on-path
   observer of traffic metadata) which Objects a consumer is
   interested in — ordinary web-browsing exposure, neither better
   nor worse. TLS (Section 4.2, rule 5) protects request content
   from on-path observers.
2. The absence of an enumeration endpoint (Section 8.4) means
   publishing an Object at its Object URL does not, by itself,
   announce that Object's existence; a consumer must learn the OID
   through some channel first. Publishers should not, however,
   treat an unannounced Object URL as access control — the URL is
   derivable by anyone who learns the OID.

---

# 10. References

## 10.1 Normative References

* [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119.
* [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
  2119 Key Words", BCP 14, RFC 8174.
* [RFC8615] Nottingham, M., "Well-Known Uniform Resource
  Identifiers (URIs)", RFC 8615 — basis for the
  `.well-known/onp/` path space, shared with ONP-0004.
* [RFC9110] Fielding, R., Nottingham, M., and J. Reschke, "HTTP
  Semantics", RFC 9110 — entity tags and conditional requests
  (Section 4.2, rules 3-4).
* ONP-1000, News Object — the envelope retrieved.
* ONP-1001, Identifiers — the OID grammar the derivation in
  Section 4.1 consumes byte-identically.
* ONP-0004, Trust Model — the `.well-known/onp/` precedent and the
  Trust Anchor resolution step 5 of Section 5.1 invokes.
* ONP-1004, Validation — the Core validation a retrieved Object
  MUST pass.

## 10.2 Informative References

* ONP-0000, Introduction — Section 7.2 (Non-Exclusivity of
  Channels), the stance this document operationalizes; v0.4.0
  records the roadmap extension adding this document.
* ONP-0006, News Object Lifecycle — the supersession chain Version
  URLs make walkable.
* ONP-9005, External Standards Interoperability — the RSS/Atom
  export bridges Section 4.4 builds on.
* [RFC3986] Berners-Lee, T., Fielding, R., and L. Masinter,
  "Uniform Resource Identifier (URI): Generic Syntax" — legality
  of `:` in path segments (Section 4.3).

---
*End of Document*
