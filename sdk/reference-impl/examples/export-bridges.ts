import {
  generateKeypair,
  signObject,
  buildOid,
  toSchemaOrgNewsArticle,
  toRssItem,
  rssItemToXml,
  type UnsignedEnvelope,
} from "../src/index.js";

function main() {
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
  const envelope = signObject(unsigned, privateKey);

  console.log("=== ONP-9005 Section 4.1: schema.org/NewsArticle export ===");
  console.log(JSON.stringify(toSchemaOrgNewsArticle(envelope), null, 2));

  console.log("\n=== ONP-9005 Section 4.2: RSS 2.0 <item> export ===");
  console.log(rssItemToXml(toRssItem(envelope)));
}

main();
