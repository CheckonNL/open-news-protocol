# `<onp-badge>` — reader-facing verification badge

An embeddable web component that verifies an ONP News Object **in the
reader's own browser** and shows a provenance badge. It is the piece
that makes the protocol visible to a human: the reader sees a small
"Verified" (or "Not authentic") badge and can expand it for the
provenance — who published it, when, whether a single character has
changed since, and the publisher's EUDI-verified legal identity when
present.

It trusts the signature, never the page it is embedded in: the badge
fetches the publisher's key from the publisher's own domain and checks
the signature locally, using the published
[`open-news-protocol`](https://www.npmjs.com/package/open-news-protocol)
SDK.

## Use it

```html
<script type="module" src="onp-badge.js"></script>

<onp-badge object="https://regiopurmerend.nl/.well-known/onp/objects/fusie-onderzoek"></onp-badge>
```

The `object` attribute is the Object URL — the same `<onp:object>`
address a publisher already carries in its RSS feed (ONP-1006 Section
4.4). The badge does the rest: retrieve, verify (Trust Anchor
resolution included), and render.

## States

| Badge | Meaning |
|---|---|
| ✓ **Verified** | the signature checks out and the content is unchanged since it was signed |
| ✗ **Not authentic** | verification failed — the panel explains why (altered content, wrong key, unknown publisher, …) |
| – **Unverified** | the Object could not be retrieved (a network/availability problem, not a verdict on authenticity) |

## Build

```bash
npm install
npm run build     # type-check + compile the core tests
npm test          # verify the core logic (retrieve -> verify -> verdict)
npm run bundle    # produce dist/onp-badge.js, the browser bundle to embed
```

`dist/onp-badge.js` is a self-contained ES module (the widget plus the
SDK's pure-JS verification), so it drops into any page with no build
step on the publisher's side.

## Demo

Open [`demo.html`](demo.html) (serve the folder, e.g.
`npx serve`, then visit `demo.html`). It shows a genuine signed article
and a tampered copy side by side, verified offline against inline
example data — change nothing and watch the tampered one fail.

## Design

- `src/badge-core.ts` — the DOM-free logic (`evaluateBadge`): retrieve
  an Object by URL, run the SDK's `validateCoreWithTrust`, and reduce
  the outcome to a display-ready result. All I/O is injectable, so the
  tests run it without a browser or a network.
- `src/onp-badge.ts` — the `<onp-badge>` custom element: a thin
  Shadow-DOM presentation layer over `evaluateBadge`.
