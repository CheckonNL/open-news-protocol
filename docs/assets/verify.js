/* Open News Protocol — in-browser verifier.
 *
 * Runs the real ONP-1003 Section 4.5 pipeline against whatever is in
 * the editor: JCS canonicalization (RFC 8785), SHA-256 VID recompute
 * (ONP-1001), key lookup in the Publisher Key Record (ONP-0004), and
 * Ed25519 signature verification (ONP-1003) via WebCrypto.
 *
 * Nothing is sent anywhere. The trust anchor here is a local copy of
 * the Publisher Key Record; a real Node fetches it from
 * https://{domain}/.well-known/onp/publisher.json.
 */

(function () {
  "use strict";

  // ---- RFC 8785 (JCS) ----------------------------------------------------

  function canonicalize(value) {
    if (value === null) return "null";
    const t = typeof value;
    if (t === "boolean") return value ? "true" : "false";
    if (t === "number") {
      if (!Number.isFinite(value)) throw new Error("non-finite number");
      return JSON.stringify(value);
    }
    if (t === "string") return JSON.stringify(value);
    if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
    if (t === "object") {
      const keys = Object.keys(value).sort(compareUtf16);
      return "{" + keys.map(function (k) {
        return JSON.stringify(k) + ":" + canonicalize(value[k]);
      }).join(",") + "}";
    }
    throw new Error("unsupported type " + t);
  }

  // JS string comparison is already UTF-16 code-unit ordered.
  function compareUtf16(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

  function buildPreimage(envelope, exclude) {
    const copy = {};
    Object.keys(envelope).forEach(function (k) {
      if (exclude.indexOf(k) === -1) copy[k] = envelope[k];
    });
    return canonicalize(copy);
  }

  // ---- encoding ----------------------------------------------------------

  function b64urlToBytes(s) {
    const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function bytesToB64url(bytes) {
    let bin = "";
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  async function sha256(text) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return new Uint8Array(digest);
  }

  // ---- the pipeline ------------------------------------------------------

  const STEPS = ["structure", "vid", "anchor", "signature"];

  async function verify(raw, keyRecord) {
    const result = {
      steps: { structure: null, vid: null, anchor: null, signature: null },
      ok: false,
      headline: "",
      detail: "",
    };

    // Step 1 — structure (ONP-1000 Section 6.1).
    let env;
    try {
      env = JSON.parse(raw);
    } catch (e) {
      result.steps.structure = { ok: false, note: "not valid JSON" };
      result.headline = "MALFORMED";
      result.detail = "The document is not parseable JSON, so no ONP check can run.";
      return result;
    }
    const required = ["oid", "vid", "publisher", "signed_at", "signature", "content_type", "content"];
    const missing = required.filter(function (f) { return !(f in env); });
    if (missing.length) {
      result.steps.structure = { ok: false, note: "missing " + missing.join(", ") };
      result.headline = "MALFORMED";
      result.detail = "Core requires all seven envelope fields (ONP-1000 §5.1).";
      return result;
    }
    result.steps.structure = { ok: true, note: "7 required fields present" };

    // Step 2 — recompute the VID (ONP-1001 Section 6.1).
    const vidPreimage = buildPreimage(env, ["vid", "signature"]);
    const recomputed = "onp:vid:sha-256:" + bytesToB64url(await sha256(vidPreimage));
    if (recomputed !== env.vid) {
      result.steps.vid = { ok: false, note: "recomputed " + recomputed.slice(0, 30) + "…" };
      result.steps.anchor = { skip: true };
      result.steps.signature = { skip: true };
      result.headline = "CONTENT CHANGED";
      result.detail =
        "The VID is derived from the bytes, so any edit — one character is enough — " +
        "produces a different VID than the one the publisher signed.";
      return result;
    }
    result.steps.vid = { ok: true, note: "matches the signed bytes" };

    // Step 3 — resolve the key (ONP-0004 Section 6.1).
    const entry = (keyRecord.current_keys || []).find(function (k) {
      return k.key_id === env.publisher.key_id;
    });
    if (!entry || keyRecord.publisher_domain !== env.publisher.domain) {
      result.steps.anchor = { ok: false, note: "no authorized key for this publisher" };
      result.steps.signature = { skip: true };
      result.headline = "UNKNOWN KEY";
      result.detail =
        "The key this document claims is not listed in the publisher's Trust Anchor, " +
        "so nothing about its origin can be established.";
      return result;
    }
    result.steps.anchor = { ok: true, note: entry.key_id };

    // Step 4 — verify the signature (ONP-1003 Section 4.5).
    const m = /^onp:sig:([a-z0-9-]+):([A-Za-z0-9_-]+)$/.exec(env.signature);
    if (!m || m[1] !== "ed25519") {
      result.steps.signature = { ok: false, note: "unsupported signature form" };
      result.headline = "NOT VERIFIED";
      result.detail = "Only ed25519 is in the required baseline (ONP-0005 §4.2).";
      return result;
    }

    let sigOk;
    try {
      const key = await crypto.subtle.importKey(
        "raw", b64urlToBytes(entry.public_key), { name: "Ed25519" }, false, ["verify"]
      );
      sigOk = await crypto.subtle.verify(
        { name: "Ed25519" }, key, b64urlToBytes(m[2]),
        new TextEncoder().encode(buildPreimage(env, ["signature"]))
      );
    } catch (e) {
      result.steps.signature = { ok: null, note: "Ed25519 unavailable in this browser" };
      result.headline = "PARTLY CHECKED";
      result.detail =
        "This browser has no Ed25519 in WebCrypto, so the signature step could not run here. " +
        "The integrity checks above did run, and every ONP library performs all four.";
      return result;
    }

    if (!sigOk) {
      result.steps.signature = { ok: false, note: "signature does not match" };
      result.headline = "FORGED";
      result.detail =
        "The bytes are intact but the signature was not produced by the publisher's key.";
      return result;
    }

    result.steps.signature = { ok: true, note: "ed25519 verified" };
    result.ok = true;
    result.headline = "VERIFIED";
    result.detail =
      "Signed by " + env.publisher.domain + " and unmodified since. " +
      "No server was asked, and no reputation was assumed.";
    return result;
  }

  // ---- wiring ------------------------------------------------------------

  const doc = document.getElementById("doc");
  const verdict = document.getElementById("verdict");
  const verdictTitle = document.getElementById("verdict-title");
  const verdictNote = document.getElementById("verdict-note");
  const resetBtn = document.getElementById("reset");
  if (!doc) return;

  let keyRecord = null;
  let pristine = "";
  let timer = null;

  function paint(res) {
    verdict.classList.toggle("is-valid", res.ok);
    verdict.classList.toggle("is-broken", !res.ok);
    verdictTitle.textContent = res.headline;
    verdictNote.textContent = res.detail;
    STEPS.forEach(function (name) {
      const li = document.getElementById("step-" + name);
      if (!li) return;
      const state = res.steps[name];
      const mark = li.querySelector(".mark");
      li.classList.remove("pass", "fail", "skip");
      if (!state) { mark.textContent = "·"; return; }
      if (state.skip) { li.classList.add("skip"); mark.textContent = "·"; }
      else if (state.ok === true) { li.classList.add("pass"); mark.textContent = "✓"; }
      else if (state.ok === false) { li.classList.add("fail"); mark.textContent = "✕"; }
      else { mark.textContent = "?"; }
      if (state.note) li.querySelector(".who").textContent = state.note;
    });
  }

  async function run() {
    if (!keyRecord) return;
    try {
      paint(await verify(doc.value, keyRecord));
    } catch (e) {
      paint({ steps: {}, ok: false, headline: "ERROR", detail: String(e.message || e) });
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(run, 180);
  }

  fetch("assets/demo-object.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      keyRecord = data.publisher_key_record;
      pristine = JSON.stringify(data.envelope, null, 2);
      doc.value = pristine;
      run();
    })
    .catch(function () {
      verdictTitle.textContent = "DEMO UNAVAILABLE";
      verdictNote.textContent = "The example document could not be loaded.";
    });

  doc.addEventListener("input", schedule);
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      doc.value = pristine;
      run();
      doc.focus();
    });
  }
})();
