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
   * Places and sizes the glyphs: --dx (sideways, from the words' centre) and
   * --fit (scale) on each phrase. A new size is drawn at once, not animated.
   *
   * Toggle: a glyph wider than its words is drawn smaller, so it covers only
   * them. On top: rows on a line keep a gap between them (--row-gap, in
   * glyphs), so each emoji reads as belonging to the words under it. A row
   * wider than its words ("hit" with two emojis, next to "snooze" with
   * three) first slides sideways into free room, as long as it still spans
   * the middle of its own words (placeLine); only rows that can't fit even
   * so are drawn smaller. Smaller is one size for the whole line, as in the
   * extension, or with --row-fit: pair only the rows that crowd each other.
   */
  function fit(scope) {
    for (const el of annotated(scope)) {
      el.classList.add("refit");
      sizeRows(el);
      void el.offsetWidth;
      el.classList.remove("refit");
    }
  }

  /**
   * The site's own samples ([data-room] around them; not the writer): each
   * phrase's box is padded to the width of its emojis plus a little air, so
   * every row sits centred over its words at full size, and Toggle draws it
   * at full size within the box. The padding follows On top's size in both
   * modes, so switching modes moves no word.
   */
  function pad(el) {
    const words = [...el.querySelectorAll(".w")];
    if (!el.closest("[data-room]")) {
      words.forEach((w) => w.style.removeProperty("padding-inline"));
      return;
    }
    const emoji = parseFloat(getComputedStyle(el).getPropertyValue("--glyph-size")) || 0.78;
    for (const w of words) {
      const g = w.querySelector(".g");
      if (!g?.textContent) {
        w.style.removeProperty("padding-inline");
        continue;
      }
      const size = parseFloat(getComputedStyle(w).fontSize) * emoji;
      const row = (g.offsetWidth / parseFloat(getComputedStyle(g).fontSize)) * size;
      const text = w.querySelector(".t").getBoundingClientRect().width;
      const side = Math.max(0, (row + 0.3 * size - text) / 2);
      w.style.setProperty("padding-inline", `${side.toFixed(1)}px`);
    }
  }

  function sizeRows(el) {
    pad(el);
    const rows = [...el.querySelectorAll(".w")]
      .filter((w) => w.querySelector(".g")?.textContent)
      .map((w) => {
        const box = w.getBoundingClientRect();
        const g = w.querySelector(".g");
        return { w, top: box.top, mid: box.left + box.width / 2, words: box.width, glyph: g.offsetWidth, px: parseFloat(getComputedStyle(g).fontSize), scale: 1 };
      });
    const set = (r, scale, dx = 0) => {
      r.w.style.setProperty("--fit", String(Math.max(SMALLEST, Math.min(1, scale))));
      r.w.style.setProperty("--dx", `${Math.round(dx * 10) / 10}px`);
    };
    if (el.dataset.mode === "toggle") {
      rows.forEach((r) => set(r, r.words / (r.glyph || 1)));
      return;
    }
    const style = getComputedStyle(el);
    const space = parseFloat(style.getPropertyValue("--row-gap")) || 0.6;
    const pairs = style.getPropertyValue("--row-fit").trim() === "pair";
    const box = el.getBoundingClientRect();
    const lines = [];
    for (const r of rows) {
      const line = lines.find((l) => Math.abs(l[0].top - r.top) < 4);
      if (line) line.push(r);
      else lines.push([r]);
    }
    for (const line of lines) {
      line.sort((a, b) => a.mid - b.mid);
      // Rows that could reach each other, even slid as far as they may.
      const groups = [[line[0]]];
      for (let i = 1; i < line.length; i++) {
        const a = line[i - 1];
        const b = line[i];
        const reach = a.glyph + b.glyph + space * Math.max(a.px, b.px);
        if (b.mid - a.mid < reach) groups[groups.length - 1].push(b);
        else groups.push([b]);
      }
      const plans = groups.map((g) => {
        let best = placeLine(g, 1, space, box);
        let scale = 1;
        if (!best) {
          let lo = SMALLEST;
          let hi = 1;
          for (let k = 0; k < 10; k++) {
            const mid = (lo + hi) / 2;
            if (placeLine(g, mid, space, box)) lo = mid;
            else hi = mid;
          }
          scale = lo;
          best = placeLine(g, lo, space, box) || placeLine(g, lo, space, box, true);
        }
        return { g, scale, xs: best };
      });
      const lineScale = Math.min(...plans.map((p) => p.scale));
      for (const p of plans) {
        // One size for the line: the rows placed again at it.
        const scale = pairs ? p.scale : lineScale;
        const xs = scale === p.scale ? p.xs : placeLine(p.g, scale, space, box) || p.xs;
        p.g.forEach((r, i) => set(r, scale, xs[i] - r.mid));
      }
    }
  }

  /**
   * Centres for one group of rows at `scale`, or null if they can't all fit:
   * each row as near its words' centre as it can be, at least the gap from
   * its neighbours, inside the text's box, and spanning the middle of its
   * own words (the centre, give or take a third of a glyph). With `anyway`,
   * the best try even when rows still crowd each other.
   */
  function placeLine(group, scale, space, box, anyway = false) {
    const n = group.length;
    const width = group.map((r) => r.glyph * scale);
    const lo = [];
    const hi = [];
    group.forEach((r, i) => {
      const keep = Math.min(r.words / 2, 0.35 * r.px * scale);
      const boxLo = box.left + width[i] / 2;
      const boxHi = box.right - width[i] / 2;
      let a = Math.max(r.mid - width[i] / 2 + keep, boxLo);
      let b = Math.min(r.mid + width[i] / 2 - keep, boxHi);
      // Can't have both: staying inside the text's box wins.
      if (a > b) a = b = boxLo <= boxHi ? Math.min(boxHi, Math.max(boxLo, r.mid)) : (box.left + box.right) / 2;
      lo.push(a);
      hi.push(b);
    });
    const xs = group.map((r, i) => Math.min(hi[i], Math.max(lo[i], r.mid)));
    const sep = (i) => (width[i - 1] + width[i]) / 2 + space * Math.max(group[i - 1].px, group[i].px) * scale;
    for (let pass = 0; pass < 60; pass++) {
      let moved = false;
      for (let i = 1; i < n; i++) {
        const short = sep(i) - (xs[i] - xs[i - 1]);
        if (short <= 0.05) continue;
        // Each gives half, as far as its own room allows; the other the rest.
        let left = Math.min(short / 2, xs[i - 1] - lo[i - 1]);
        const right = Math.min(short - left, hi[i] - xs[i]);
        left = Math.min(short - right, xs[i - 1] - lo[i - 1]);
        if (left + right > 0.05) moved = true;
        xs[i - 1] -= left;
        xs[i] += right;
      }
      if (!moved) break;
    }
    for (let i = 1; i < n; i++) if (xs[i] - xs[i - 1] < sep(i) - 0.5 && !anyway) return null;
    return xs;
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

  /**
   * Fills every [data-render] under `scope` from samples.js, from the story
   * the nearest [data-story] names (Home: "lake"), or the tour's ("monday").
   */
  function render(scope) {
    const samples = window.EmojinizeSamples;
    if (!samples) return;
    scope.querySelectorAll("[data-render]").forEach((el) => {
      const story = samples[el.closest("[data-story]")?.dataset.story || "monday"];
      const sample = story && story[el.dataset.render];
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
