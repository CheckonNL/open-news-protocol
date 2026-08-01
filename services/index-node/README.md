# ONP Index-Node (prototype)

Answers one narrow question: **"which Endorsement Objects (ONP-2900) exist
for this target?"** — nothing more. This is a local, unpublished prototype
of the discovery mechanism ONP-2900 §4.8 and ONP-2700 §4.7 both explicitly
defer to a future ONP-3200 (Search) or an independent aggregator service. It
is not deployed anywhere and is not part of any conformance requirement.

## Why a feed reader, not a crawler

ONP-1006 §8.4 deliberately defines no endpoint for listing a publisher's
Objects — an enumeration surface has its own privacy and load consequences
(bulk scraping, existence disclosure of unlisted Objects) that a retrieval
convention should not smuggle in. So this does not probe
`.well-known/onp/objects/` for guessed IDs. Instead it reads each seed
publisher's already-existing RSS/Atom feed (ONP-1006 §4.4 — the
`<onp:object>` element / `rel="alternate" type="application/onp+json"`
link publishers already emit for ordinary syndication reasons), pulls out
the Object URLs it carries, and only keeps what independently verifies.

## Design constraints this deliberately follows

- **The index never has to be trusted.** Every entry it keeps has already
  passed full Core validation and Trust Anchor resolution (ONP-0004)
  against the *endorsing* publisher's own domain — exactly as a badge
  would do it directly. A compromised or careless index-node can omit
  entries or be slow; it cannot make a forged endorsement verify.
- **No ranking or aggregation** (ONP-2900 §6.2). `query.mjs` returns the
  raw list of verified entries for a target — confirms/disputes/adds-context
  side by side, uninterpreted.
- **Cheap to mirror.** The entire dataset is one flat JSON file
  (`index.json`), keyed by `target_ref`. Copying it *is* running a mirror;
  no re-crawl required.
- **Deliberately dumb.** No credibility scoring of endorsers (ONP-2900
  §8.2), no retraction-aware archival (that's a separate, harder concern —
  see the conversation this prototype came out of), no attempt to be the
  only one of its kind.

## Usage (local only)

```
npm install
cp config.example.json config.json   # edit with real feed URLs
npm run crawl -- config.json index.json
npm run query -- "onp:vid:sha-256:..." index.json
```

## Known limitations of this prototype

- `feed-parser.mjs` is a minimal, purpose-built extractor for the two
  carriage forms ONP-1006 §4.4 defines, not a general/hardened XML parser —
  fine for known-good feeds, not for adversarial input.
- No retry, rate-limiting, or scheduling — this is a one-shot script, not a
  long-running service.
- No handling yet for a target whose endorsement was later retracted
  (ONP-2900 §4.9, Core Tombstone) — a stale crawl can still list a
  withdrawn endorsement until the next run notices it is gone.
