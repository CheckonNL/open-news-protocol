# Open News Protocol Connector (WordPress)

Turns a WordPress site into an ONP publisher. On activation it
generates an Ed25519 keypair; from then on every published post is
signed as a News Object, and the site serves:

| Path | Serves | Spec |
|---|---|---|
| `/.well-known/onp/publisher.json` | Publisher Key Record | ONP-0004 §4.2 |
| `/.well-known/onp/objects/{local-id}` | current Version, VID as ETag, `If-None-Match` → 304 | ONP-1006 §4.1–4.2 |
| `/.well-known/onp/objects/{local-id}/versions/{vid}` | a specific immutable Version | ONP-1006 §4.3 |

The RSS feed carries `<onp:object>` per item (namespace
`https://opennewsprotocol.org/ns/feed`) and article pages get
`<link rel="alternate" type="application/onp+json">` — ONP-1006 §4.4.

## Behavior

- **Identity is frozen.** The Local Identifier is fixed at first
  signing (slug if it fits the ONP-1001 grammar, else `post-{ID}`).
  Changing the slug later never changes the OID.
- **Every substantive edit signs a new Version** whose `supersedes`
  names the previous VID (ONP-0006). Re-saving without changes does
  not grow the chain (the gate is a content hash, not the VID —
  `signed_at` alone never triggers a Version).
- **Unpublishing signs a retraction Version** (`lifecycle_state:
  retracted`). The Object URL keeps serving it — retraction is
  in-band Tombstone state, never a 404 (ONP-1006 §4.2 rule 6).
- **`body` is converted to the Safe Markdown Subset** (ONP-2100
  §4.4) with a deliberately simple converter (paragraphs, headings,
  emphasis, links, lists, blockquotes, code); exotic markup is
  stripped to text.

## Install

1. Copy `onp-connector/` to `wp-content/plugins/` and activate.
2. Check **Settings → Open News Protocol**: it shows the key, the
   publisher.json URL, and a button to sign the existing archive in
   batches of 100.
3. Verify from outside:
   ```
   curl -i https://YOUR-DOMAIN/.well-known/onp/publisher.json
   curl -i https://YOUR-DOMAIN/.well-known/onp/objects/SOME-SLUG
   ```

### If `/.well-known/` never reaches WordPress

Some server configs (ACME/Let's Encrypt setups) serve `/.well-known/`
statically and 404 before PHP runs. Pass the ONP paths through:

**nginx** (before the ACME location block):
```nginx
location ^~ /.well-known/onp/ { try_files $uri /index.php?$args; }
```

**Apache** (`.htaccess`, before the WordPress block):
```apache
RewriteRule ^\.well-known/onp/ /index.php [L]
```

## Key storage

By default the signing key lives in `wp_options` (autoload off).
Anyone with database access can then sign as this publisher — the
same boundary as WordPress password hashes, but broader than
necessary. For stronger isolation:

```php
define( 'ONP_SECRET_KEY', '<base64 of the 64-byte sodium secret key>' );
```

in `wp-config.php`; it takes precedence and the DB option can be
deleted. Key rotation (moving the old key to `previous_keys` with a
validity window, ONP-0004 §4.4) is not yet automated — planned.

## Cross-implementation verification

This plugin is the second, independent ONP implementation (PHP,
including its own RFC 8785/JCS serializer). Two CLI harnesses prove
byte-level agreement with the TypeScript reference implementation,
and CI runs both:

- `bin/onp-selftest.php` — re-verifies the SDK's published test
  vectors in PHP (TS→PHP), then emits a PHP-signed envelope for the
  SDK to validate (PHP→TS).
- `bin/onp-wp-simulation.php` — runs the publish → edit →
  unchanged-save → retract lifecycle against WP stubs and emits all
  signed Versions; the SDK verifies each one plus the supersedes
  chain.

## Companions (v0.3)

Beyond the Article, a published post now also signs:

- **Photos → Media Objects (ONP-2200)** — the featured image and
  attached images, each bound to its file bytes (`asset_hash`), listed
  in the Article's `media_refs`. In the media modal, a **Photographer**
  dropdown sets the credit and links the photographer's Rights/Payment
  profile.
- **Photographer profiles (Settings → ONP Photographers)** — credit,
  licence (ONP-2400) and revenue split (ONP-2500), signed once into
  Rights and Payment Objects that every photo references by OID (set
  once, never re-typed).
- **Source documents (ONP-2600)** — tick "source document" on a
  non-image attachment (PDF, Word, Excel, text); it is signed as a
  `media_type: "document"` Object (ONP-2200 v0.5.0) plus a Source Object,
  listed in the Article's `source_refs`.
- **Corrections (ONP-2700)** — the "ONP correction" box on the post
  editor records a type + note on your next update, signing a public
  record that links the old and new VIDs (`corrections_ref`).

All Companion Objects live in a custom table (`{prefix}onp_objects`) and
are served at their own `/.well-known/onp/objects/{local-id}` URLs, with
the same VID-as-ETag/Version semantics as Articles. Cross-verified with
the TypeScript SDK by `bin/onp-companions-test.php` (CI).

## Not yet implemented

Key rotation automation; serving `onp:extensions` (e.g. ai-metadata from
post meta); pages and custom post types (posts only, deliberately).
