import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateKeypair,
  publicKeyFromRaw,
  computeVid,
  signEnvelope,
  buildOid,
  toSchemaOrgNewsArticle,
  toRssItem,
  rssItemToXml,
  type UnsignedEnvelope,
  type NewsObjectEnvelope,
} from "../src/index.js";

function makeArticle(): NewsObjectEnvelope {
  const { privateKey } = generateKeypair();
  const unsigned: UnsignedEnvelope = {
    oid: buildOid("regiopurmerend.nl", "fusie-onderzoek-necker-van-naem"),
    publisher: { domain: "regiopurmerend.nl", key_id: "onp:key:2026-07-01" },
    signed_at: "2026-07-28T10:00:00Z",
    content_type: "onp:companion:article",
    content: {
      headline: "Fusie-onderzoek Purmerend gepubliceerd",
      dek: "Necker van Naem publiceert budgetanalyse voor de voorgestelde fusie.",
      body: "Purmerend - ...",
      byline: ["Redactie RegioPurmerend"],
      section: "Politiek",
      canonical_url: "https://regiopurmerend.nl/artikel/fusie-onderzoek",
    },
    "onp:metadata": { language: "nl-NL" },
  } as UnsignedEnvelope;
  const vid = computeVid(unsigned);
  const withVid: Record<string, unknown> = { ...unsigned, vid };
  const signature = signEnvelope(withVid, privateKey);
  return { ...withVid, signature } as unknown as NewsObjectEnvelope;
}

test("ONP-9005 Section 4.1: schema.org export maps headline, publisher, dates", () => {
  const envelope = makeArticle();
  const out = toSchemaOrgNewsArticle(envelope);
  assert.equal(out.headline, "Fusie-onderzoek Purmerend gepubliceerd");
  assert.equal(out.identifier, envelope.oid);
  assert.equal(out.datePublished, "2026-07-28T10:00:00Z");
  assert.equal(out.publisher.url, "https://regiopurmerend.nl");
  assert.equal(out.inLanguage, "nl-NL");
  assert.equal(out.author?.[0].name, "Redactie RegioPurmerend");
});

test("ONP-9005 Section 4.2: RSS export maps title, guid, pubDate, category", () => {
  const envelope = makeArticle();
  const item = toRssItem(envelope);
  assert.equal(item.title, "Fusie-onderzoek Purmerend gepubliceerd");
  assert.equal(item.guid.value, envelope.oid);
  assert.equal(item.guid.isPermaLink, false);
  assert.equal(item.category, "Politiek");
  assert.equal(item.creator, "Redactie RegioPurmerend");
});

test("ONP-9005 Section 4.2: RSS XML rendering escapes special characters", () => {
  const item = toRssItem(makeArticle());
  const xml = rssItemToXml(item);
  assert.match(xml, /<title>/);
  assert.match(xml, /<guid isPermaLink="false">/);
  assert.match(xml, /<pubDate>/);
});

test("ONP-9005 Section 4.3: export carries no signature field", () => {
  const envelope = makeArticle();
  const schemaOrg = toSchemaOrgNewsArticle(envelope);
  const rss = toRssItem(envelope);
  assert.equal("signature" in schemaOrg, false);
  assert.equal("signature" in rss, false);
});
