/**
 * site.js: what every page shares.
 *
 *   - Recorded samples: an element with data-render="<sample>" is filled with
 *     that sample from samples.js, annotated, and its emojis land, sized so
 *     each row stays over its own words (fit, as the extension does).
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
  const annotated = (scope) => (scope.matches?.(".an") ? [scope] : [...scope.querySelectorAll(".an")]);

  /**
   * Keeps the characters touching a phrase on its line ("bed," and "(word)"):
   * a phrase is an inline-block, and a line may break between an inline-block
   * and the comma after it. The phrase and its neighbours go in a nowrap span.
   */
  function glue(scope) {
    for (const el of annotated(scope)) {
      el.querySelectorAll(".w").forEach((w) => {
        if (w.parentElement.classList.contains("nb")) return;
        const prev = w.previousSibling;
        const next = w.nextSibling;
        const before = prev?.nodeType === 3 ? prev.data.match(/\S+$/) : null;
        const after = next?.nodeType === 3 ? next.data.match(/^\S+/) : null;
        if (!before && !after) return;
        const nb = document.createElement("span");
        nb.className = "nb";
        w.before(nb);
        if (before) {
          prev.data = prev.data.slice(0, -before[0].length);
          nb.append(before[0]);
        }
        nb.append(w);
        if (after) {
          next.data = next.data.slice(after[0].length);
          nb.append(after[0]);
        }
      });
    }
  }

  // The smallest a glyph row is drawn, as a share of its size.
  const SMALLEST = 0.5;

  /**
   * Sizes the glyphs (--fit on each phrase) the way the extension does.
   * Toggle: a glyph wider than its words is drawn smaller, so it covers only
   * them. On top: two neighbouring rows on a line keep a gap between them,
   * and every row on that line is drawn at the one size that allows it, so
   * each emoji reads as belonging to the words under it.
   */
  function fit(scope) {
    for (const el of annotated(scope)) {
      const words = [...el.querySelectorAll(".w")].filter((w) => w.querySelector(".g")?.textContent);
      const rows = words.map((w) => {
        const box = w.getBoundingClientRect();
        const g = w.querySelector(".g");
        return { w, top: box.top, mid: box.left + box.width / 2, words: box.width, glyph: g.offsetWidth, px: parseFloat(getComputedStyle(g).fontSize) };
      });
      if (el.dataset.mode === "toggle") {
        rows.forEach((r) => r.w.style.setProperty("--fit", String(Math.max(SMALLEST, Math.min(1, r.words / (r.glyph || 1))))));
        continue;
      }
      const lines = [];
      for (const r of rows) {
        const line = lines.find((l) => Math.abs(l[0].top - r.top) < 4);
        if (line) line.push(r);
        else lines.push([r]);
      }
      for (const line of lines) {
        line.sort((a, b) => a.mid - b.mid);
        let scale = 1;
        for (let i = 1; i < line.length; i++) {
          const a = line[i - 1];
          const b = line[i];
          const gap = 0.6 * Math.max(a.px, b.px);
          const need = (a.glyph + b.glyph) / 2;
          if (need > 0) scale = Math.min(scale, (b.mid - a.mid - gap) / need);
        }
        const value = String(Math.max(SMALLEST, Math.min(1, scale)));
        line.forEach((r) => r.w.style.setProperty("--fit", value));
      }
    }
  }

  /** Lets the emojis of every annotated element under `scope` land again. */
  function land(scope) {
    const els = annotated(scope);
    glue(scope);
    fit(scope);
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

  window.Emojinize = Object.freeze({ esc, annotate, land, render, installed, glue, fit });

  // Lines break elsewhere at another width, and an emoji font can arrive late.
  let refit = 0;
  const fitAll = () => {
    cancelAnimationFrame(refit);
    refit = requestAnimationFrame(() => fit(document.body));
  };

  function start() {
    storeLinks();
    applyInstalled();
    render(document);
    land(document.body);
    addEventListener("resize", fitAll);
    document.fonts?.ready.then(fitAll);
    // The extension's mark can come after this script on a slow start.
    new MutationObserver(applyInstalled).observe(root, {
      attributes: true,
      attributeFilter: ["data-emojinize-extension"],
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
