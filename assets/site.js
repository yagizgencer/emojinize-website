/**
 * site.js: what every page shares.
 *
 *   - Recorded samples: an element with data-render="<sample>" is filled with
 *     that sample from samples.js, annotated, and its emojis land.
 *   - The On top / Toggle switch of a sample card ([data-modes] inside
 *     [data-sample]), and clicking a word in Toggle mode.
 *   - Store links ([data-store]) carry where on the site they were clicked.
 *   - Whether the Emojinize extension is in this browser. The extension marks
 *     <html data-emojinize-extension="<version>"> on emojinize.com; elements
 *     with data-when="installed" or data-when="new" show for one or the other.
 *     ?preview=installed shows the installed version without the extension.
 */
(() => {
  "use strict";

  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  if (params.get("preview") === "installed" && !root.hasAttribute("data-emojinize-extension")) {
    root.setAttribute("data-emojinize-extension", "preview");
  }

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  /** HTML for recorded sentences, each [text, [[start, end, emoji], ...]]. */
  function annotate(sentences, start = 0) {
    let i = start;
    return sentences
      .map(([text, spans]) => {
        const cps = Array.from(text);
        let pos = 0;
        let out = "";
        for (const [cs, ce, emoji] of spans) {
          out += esc(cps.slice(pos, cs).join(""));
          out +=
            `<span class="w" style="--i:${i++}"><span class="t">${esc(cps.slice(cs, ce).join(""))}</span>` +
            `<span class="g" aria-hidden="true">${esc(emoji)}</span></span>`;
          pos = ce;
        }
        return out + esc(cps.slice(pos).join(""));
      })
      .join(" ");
  }

  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Lets the emojis of every annotated element under `scope` land again. */
  function land(scope) {
    const els = scope.matches?.(".an") ? [scope] : [...scope.querySelectorAll(".an")];
    els.forEach((el) => el.classList.remove("on"));
    if (reducedMotion()) {
      els.forEach((el) => el.classList.add("on"));
      return;
    }
    void scope.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => els.forEach((el) => el.classList.add("on"))));
  }

  /** Fills every [data-render] under `scope` from samples.js. */
  function render(scope) {
    const samples = window.EmojinizeSamples;
    if (!samples) return;
    scope.querySelectorAll("[data-render]").forEach((el) => {
      const sample = samples[el.dataset.render];
      if (!sample) return;
      const sentences = typeof sample[0] === "string" ? [sample] : sample;
      el.innerHTML = annotate(sentences, Number(el.dataset.start) || 0);
    });
  }

  const installed = () => root.hasAttribute("data-emojinize-extension");

  function applyInstalled() {
    const yes = installed();
    document.querySelectorAll("[data-when]").forEach((el) => {
      el.hidden = el.dataset.when !== (yes ? "installed" : "new");
    });
  }

  function storeLinks() {
    const { STORE_URL } = window.EmojinizeConfig;
    document.querySelectorAll("a[data-store]").forEach((a) => {
      const url = new URL(STORE_URL);
      url.searchParams.set("utm_source", "emojinize.com");
      url.searchParams.set("utm_medium", a.dataset.store || "site");
      a.href = url.href;
    });
  }

  // The switch and Toggle mode's words, for samples drawn now or later.
  document.addEventListener("click", (event) => {
    const set = event.target.closest("[data-mode-set]");
    if (set) {
      const card = set.closest("[data-sample]") || document;
      const mode = set.dataset.modeSet;
      set.closest("[data-modes]").querySelectorAll("[data-mode-set]").forEach((b) => {
        b.setAttribute("aria-checked", String(b === set));
      });
      card.querySelectorAll(".an").forEach((el) => (el.dataset.mode = mode));
      land(card);
      return;
    }
    const word = event.target.closest('.an[data-mode="toggle"] .w');
    if (word) word.classList.toggle("show");
  });

  window.Emojinize = Object.freeze({ esc, annotate, land, render, installed });

  function start() {
    storeLinks();
    applyInstalled();
    render(document);
    land(document.body);
    // The extension's mark can come after this script on a slow start.
    new MutationObserver(applyInstalled).observe(root, {
      attributes: true,
      attributeFilter: ["data-emojinize-extension"],
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
