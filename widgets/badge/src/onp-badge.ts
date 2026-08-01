/**
 * <onp-badge> — an embeddable verification badge for a News Object.
 *
 *   <script type="module" src="onp-badge.js"></script>
 *   <onp-badge object="https://example.nl/.well-known/onp/objects/story"></onp-badge>
 *
 * On connection it retrieves the Object, verifies it locally (signature
 * + Trust Anchor resolution), and — v0.2 — follows the Object's
 * Companion references to also verify its photos (and photographer
 * credit, rights and revenue split), source documents, and corrections.
 * It renders a badge the reader can expand for the full provenance. All
 * the cryptography happens in the reader's own browser; the badge trusts
 * the signature, never the page it sits on.
 *
 * The DOM lives here; the verification logic is in badge-core, which is
 * what the tests exercise.
 */

import {
  evaluateBadge,
  type BadgeResult,
  type BadgeStatus,
} from "./badge-core.js";

const STYLE = `
  :host { display: inline-block; font: 13px/1.4 system-ui, sans-serif; color: #1a1a1a; }
  .badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px;
           border-radius: 999px; border: 1px solid #d9d9d9; background: #fff; cursor: pointer;
           user-select: none; }
  .badge .ic { width: 16px; height: 16px; flex: none; }
  .badge .chev { width: 13px; height: 13px; flex: none; opacity: .55; }
  .badge.verified { border-color: #b7e0c0; background: #f0faf2; color: #14622b; }
  .badge.attention { border-color: #ead9a6; background: #fdf7e6; color: #8a6100; }
  .badge.rejected { border-color: #f0c2c2; background: #fdf1f1; color: #9a1c1c; }
  .badge.unavailable { border-color: #e2e2e2; background: #f7f7f7; color: #5f5f5f; }
  .label { font-weight: 500; }
  .panel { margin-top: .5em; max-width: 34em; padding: .7em .8em; border: 1px solid #e6e6e6;
           border-radius: 8px; background: #fff; }
  .panel[hidden] { display: none; }
  .row { display: flex; gap: .6em; padding: .15em 0; }
  .row .k { color: #777; min-width: 8.5em; flex: none; }
  .row .v { color: #1a1a1a; word-break: break-word; }
  .v .ok { color: #14622b; } .v .bad { color: #9a1c1c; } .v .dim { color: #888; }
  .foot { margin-top: .5em; color: #888; font-size: 11px; }
`;

function iconSvg(status: BadgeStatus, loading: boolean): string {
  const svg = (paths: string) =>
    `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  if (loading) return svg('<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" opacity="0.5"/>');
  if (status === "verified") return svg('<path d="M20 6 9 17l-5-5"/>'); // check
  if (status === "rejected") return svg('<path d="M18 6 6 18M6 6l12 12"/>'); // cross
  if (status === "attention")
    return svg('<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 2 18a1.7 1.7 0 0 0 1.5 2.6h17A1.7 1.7 0 0 0 22 18L13.7 3.9a1.7 1.7 0 0 0-3 0z"/>'); // triangle
  return svg('<path d="M5 12h14"/>'); // dash — unavailable
}

const CHEVRON =
  '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

function label(status: BadgeStatus): string {
  switch (status) {
    case "verified":
      return "Verified";
    case "attention":
      return "Check needed";
    case "rejected":
      return "Not authentic";
    default:
      return "Unverified";
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const ok = (t: string) => `<span class="ok">✓ ${esc(t)}</span>`;
const bad = (t: string) => `<span class="bad">✗ ${esc(t)}</span>`;
const dim = (t: string) => `<span class="dim">${esc(t)}</span>`;

class OnpBadge extends HTMLElement {
  static get observedAttributes() {
    return ["object"];
  }

  private root: ShadowRoot;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    void this.run();
  }

  attributeChangedCallback() {
    if (this.isConnected) void this.run();
  }

  private async run() {
    const url = this.getAttribute("object");
    if (!url) {
      this.paint({ status: "unavailable", detail: "No Object URL was given (set the `object` attribute)." });
      return;
    }
    this.paint({ status: "unavailable", detail: "Checking…" }, true);
    const result = await evaluateBadge(url);
    this.paint(result);
  }

  /** Build the rows of the provenance panel. */
  private rows(r: BadgeResult): string {
    const rows: string[] = [];
    const row = (k: string, v: string) => `<div class="row"><span class="k">${esc(k)}</span><span class="v">${v}</span></div>`;

    if (r.headline) rows.push(row("Article", esc(r.headline)));
    if (r.publisherDomain) rows.push(row("Publisher", esc(r.publisherDomain)));
    if (r.eudiName) rows.push(row("Verified identity", esc(r.eudiName)));
    if (r.signedAt) rows.push(row("Signed at", esc(r.signedAt)));

    if (r.status !== "rejected") rows.push(row("Text", ok("unchanged")));

    r.photos?.forEach((p, i) => {
      const v = p.ok === true ? ok(p.credit ?? "verified") : p.ok === false ? bad(`altered${p.credit ? " — " + p.credit : ""}`) : dim("could not check");
      rows.push(row(`Photo ${i + 1}`, v));
    });

    if (r.rights) {
      const reuse = r.rights.reusePermitted === undefined ? "" : ` · ${r.rights.reusePermitted ? "reuse allowed" : "no reuse"}`;
      rows.push(row("Rights", r.rights.ok ? ok(`${r.rights.license ?? "licensed"}${reuse}`) : bad("unverified")));
    }
    if (r.payment && r.payment.shares.length) {
      const split = r.payment.shares.map((s) => `${s.recipient} ${s.percentage}%`).join(" · ");
      rows.push(row("Revenue", r.payment.ok ? ok(split) : bad("unverified")));
    }
    r.documents?.forEach((d, i) => {
      const key = r.documents!.length > 1 ? `Document ${i + 1}` : "Document";
      const v = d.ok === true ? ok(d.title ?? "verified") : d.ok === false ? bad(`altered${d.title ? " — " + d.title : ""}`) : dim(d.title ?? "could not check");
      rows.push(row(key, v));
      if (d.originUrl) rows.push(row("Original source", dim(d.originUrl) + ` <span style="opacity:.65">(citation, not verified)</span>`));
    });
    if (r.correction) {
      const v = r.correction.ok
        ? ok(`updated (${r.correction.type ?? "correction"})${r.correction.currentVersion ? " — you are reading the latest version" : ""}`)
        : bad("correction unverified");
      rows.push(row("Correction", v));
    }
    r.endorsements?.forEach((e, i) => {
      const key = r.endorsements!.length > 1 ? `Endorsement ${i + 1}` : "Endorsement";
      const stanceLabel = e.stance ? `${e.stance}${e.domain ? " — " + e.domain : ""}` : e.domain ?? "endorsement";
      const v = e.ok === true ? ok(stanceLabel) : e.ok === false ? bad(`unverified${e.domain ? " — " + e.domain : ""}`) : dim("could not check");
      rows.push(row(key, v));
      if (e.ok === true && e.rationale) rows.push(row("", dim(e.rationale)));
    });

    rows.push(row("Verdict", esc(r.detail)));
    return rows.join("");
  }

  private paint(result: BadgeResult, loading = false) {
    this.root.innerHTML = `
      <style>${STYLE}</style>
      <span class="badge ${result.status}" part="badge" role="button" tabindex="0"
            aria-expanded="false" title="${loading ? "Checking" : result.detail.replace(/"/g, "&quot;")}">
        ${iconSvg(result.status, loading)}
        <span class="label">${loading ? "Checking…" : label(result.status)}</span>
        ${loading ? "" : CHEVRON}
      </span>
      <div class="panel" hidden>
        ${loading ? "" : this.rows(result)}
        <div class="foot">Verified in your browser with the Open News Protocol — text, photos and documents checked locally, not taken on trust.</div>
      </div>`;

    const badge = this.root.querySelector(".badge") as HTMLElement | null;
    const panel = this.root.querySelector(".panel") as HTMLElement | null;
    if (badge && panel && !loading) {
      const toggle = () => {
        const open = panel.hasAttribute("hidden");
        if (open) panel.removeAttribute("hidden");
        else panel.setAttribute("hidden", "");
        badge.setAttribute("aria-expanded", String(open));
      };
      badge.addEventListener("click", toggle);
      badge.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });
    }
  }
}

if (!customElements.get("onp-badge")) {
  customElements.define("onp-badge", OnpBadge);
}

export { OnpBadge };
