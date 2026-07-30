/**
 * <onp-badge> — an embeddable verification badge for a News Object.
 *
 *   <script type="module" src="onp-badge.js"></script>
 *   <onp-badge object="https://example.nl/.well-known/onp/objects/story"></onp-badge>
 *
 * On connection it retrieves the Object, verifies it locally (signature
 * + Trust Anchor resolution, via badge-core), and renders a badge the
 * reader can expand for the provenance details. All the cryptography
 * happens in the reader's own browser; the badge trusts the signature,
 * never the page it sits on.
 *
 * The DOM lives here; the verification logic is in badge-core, which is
 * what the tests exercise.
 */

import { evaluateBadge, type BadgeResult, type BadgeStatus } from "./badge-core.js";

const STYLE = `
  :host { display: inline-block; font: 13px/1.4 system-ui, sans-serif; color: #1a1a1a; }
  .badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px;
           border-radius: 999px; border: 1px solid #d9d9d9; background: #fff; cursor: pointer;
           user-select: none; }
  .badge .ic { width: 16px; height: 16px; flex: none; }
  .badge .chev { width: 13px; height: 13px; flex: none; opacity: .55; }
  .badge.verified { border-color: #b7e0c0; background: #f0faf2; color: #14622b; }
  .badge.rejected { border-color: #f0c2c2; background: #fdf1f1; color: #9a1c1c; }
  .badge.unavailable { border-color: #e2e2e2; background: #f7f7f7; color: #5f5f5f; }
  .label { font-weight: 500; }
  .panel { margin-top: .5em; max-width: 34em; padding: .7em .8em; border: 1px solid #e6e6e6;
           border-radius: 8px; background: #fff; }
  .panel[hidden] { display: none; }
  .row { display: flex; gap: .6em; padding: .15em 0; }
  .row .k { color: #777; min-width: 8.5em; flex: none; }
  .row .v { color: #1a1a1a; word-break: break-word; }
  .foot { margin-top: .5em; color: #888; font-size: 11px; }
`;

function iconSvg(status: BadgeStatus, loading: boolean): string {
  const svg = (paths: string) =>
    `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  if (loading) return svg('<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" opacity="0.5"/>');
  if (status === "verified") return svg('<path d="M20 6 9 17l-5-5"/>'); // check
  if (status === "rejected") return svg('<path d="M18 6 6 18M6 6l12 12"/>'); // cross
  return svg('<path d="M5 12h14"/>'); // dash — unavailable
}

const CHEVRON =
  '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

function label(status: BadgeStatus): string {
  return status === "verified"
    ? "Verified"
    : status === "rejected"
      ? "Not authentic"
      : "Unverified";
}

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

  private paint(result: BadgeResult, loading = false) {
    const rows: string[] = [];
    if (result.headline) rows.push(this.row("Article", result.headline));
    if (result.publisherDomain) rows.push(this.row("Publisher", result.publisherDomain));
    if (result.eudiName) rows.push(this.row("Verified identity", result.eudiName));
    if (result.signedAt) rows.push(this.row("Signed at", result.signedAt));
    if (result.failureStep) rows.push(this.row("Failure", result.failureStep));
    rows.push(this.row("Verdict", result.detail));

    this.root.innerHTML = `
      <style>${STYLE}</style>
      <span class="badge ${result.status}" part="badge" role="button" tabindex="0"
            aria-expanded="false" title="${loading ? "Checking" : result.detail.replace(/"/g, "&quot;")}">
        ${iconSvg(result.status, loading)}
        <span class="label">${loading ? "Checking…" : label(result.status)}</span>
        ${loading ? "" : CHEVRON}
      </span>
      <div class="panel" hidden>
        ${rows.join("")}
        <div class="foot">Verified in your browser with the Open News Protocol — the signature is checked locally, not taken on trust.</div>
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

  private row(k: string, v: string): string {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<div class="row"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`;
  }
}

if (!customElements.get("onp-badge")) {
  customElements.define("onp-badge", OnpBadge);
}

export { OnpBadge };
