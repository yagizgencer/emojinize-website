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
  // Chinese and Japanese have no spaces, so a run of text there can be a whole
  // clause: only punctuation is kept with the phrase.
  const GLUE_ANY = [/\S+$/, /^\S+/];
  const GLUE_CJK = [/[“‘「『（(]+$/, /^[，。、！？；：”’」』）),.!?;:]+/];

  function glue(scope) {
    for (const el of annotated(scope)) {
      const [reBefore, reAfter] = /^(zh|ja)\b/.test(el.closest("[lang]")?.lang || "") ? GLUE_CJK : GLUE_ANY;
      el.querySelectorAll(".w").forEach((w) => {
        if (w.parentElement.classList.contains("nb")) return;
        const prev = w.previousSibling;
        const next = w.nextSibling;
        const before = prev?.nodeType === 3 ? prev.data.match(reBefore) : null;
        const after = next?.nodeType === 3 ? next.data.match(reAfter) : null;
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
   * The site's own text ([data-room] around it: the samples and the writer):
   * each phrase's box is padded to the width of its emojis plus a little air,
   * so every row sits centred over its words at full size, and Toggle draws
   * it at full size within the box. The padding follows On top's size in both
   * modes, so switching modes moves no word.
   */
  function pad(el) {
    const words = [...el.querySelectorAll(".w")];
    if (!el.closest("[data-room]")) {
      words.forEach((w) => w.style.removeProperty("padding-inline"));
      return;
    }
    const emoji = glyphSize(el);
    for (const w of words) padWord(w, emoji);
  }

  const glyphSize = (el) => parseFloat(getComputedStyle(el).getPropertyValue("--glyph-size")) || 0.78;

  /** One phrase's box padded to its row (pad), or unpadded while it has none. */
  function padWord(w, emoji) {
    const g = w.querySelector(".g");
    if (!g?.textContent) {
      w.style.removeProperty("padding-inline");
      return;
    }
    const size = parseFloat(getComputedStyle(w).fontSize) * emoji;
    const row = (g.offsetWidth / parseFloat(getComputedStyle(g).fontSize)) * size;
    const text = w.querySelector(".t").getBoundingClientRect().width;
    const side = Math.max(0, (row + 0.3 * size - text) / 2);
    w.style.setProperty("padding-inline", `${side.toFixed(1)}px`);
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

  /**
   * --i on every annotated word or phrase under `scope`, in reading order:
   * lines from the top, each in the reading direction (right to left for
   * Arabic). Each emoji then lands --i steps after the first (Home's
   * carousel, the tour). Returns how many there are.
   */
  function order(scope) {
    const rtl = getComputedStyle(scope).direction === "rtl";
    const items = [...scope.querySelectorAll(".an .w")].map((w) => {
      const r = (w.querySelector(".t") || w).getBoundingClientRect();
      return { w, y: r.top + r.height / 2, x: r.left + r.width / 2, h: r.height };
    });
    items.sort((a, b) => a.y - b.y);
    const lines = [];
    for (const it of items) {
      const line = lines[lines.length - 1];
      if (line && Math.abs(line[0].y - it.y) < line[0].h / 2) line.push(it);
      else lines.push([it]);
    }
    let i = 0;
    for (const line of lines) {
      line.sort((a, b) => (rtl ? b.x - a.x : a.x - b.x));
      for (const it of line) it.w.style.setProperty("--i", String(i++));
    }
    return i;
  }

  /**
   * Lets the emojis of every annotated element under `scope` land again.
   * Home's language carousel ([data-carousel]) is drawn and fitted here too,
   * but carousel.js decides when its emojis land.
   */
  function land(scope) {
    const els = annotated(scope).filter((el) => !el.closest("[data-carousel]"));
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

  /*
   * Emojis that stream in (the writer) land as Home's do: in the text's
   * order, LAND_PER_MS after the one before, each fading in and springing up
   * with its tint. A word lands once its emoji is in and every word before it
   * has landed or been declined; one still waiting holds the words after it
   * that are in for at most HEAD_WAIT_MS, then they go past it and it lands
   * when it comes. An emoji is written only at its turn, and its box then
   * grows to its row (padWord) while the words after it slide along
   * (site.css .w.landing), so no room opens before its emoji shows. The
   * extension's content.js landStream lands its writer and card the same way,
   * with the same numbers.
   */
  const LAND_PER_MS = 70;
  const HEAD_WAIT_MS = 400;
  const LAND_MS = 500;

  /**
   * A lander for the phrases (.w) under `el`, in text order, each with an
   * empty .g. arrive(w, emoji) hands one its answer (null: declined, it stays
   * plain); finish() says no more will come and resolves once the last has
   * landed; stop() drops the rest.
   */
  function lander(el) {
    // Its words land one by one, not all at once: start() lands every .an in
    // the page, the writer's empty box included, and with .on there every
    // word showed its tint before its emoji, and each emoji came in unanimated.
    el.classList.remove("on");
    const queue = [...el.querySelectorAll(".w")];
    const answers = new Map();
    // Words that held the queue too long: each lands when its emoji comes.
    const late = new Set();
    const timers = new Set();
    const per = reducedMotion() ? 0 : LAND_PER_MS;
    const emoji = glyphSize(el);
    let free = 0;
    let blockedSince = 0;
    let blockTimer = 0;
    let stopped = false;
    let finished = null;
    let resolveFinished = null;

    const later = (fn, ms) => {
      const t = setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };

    function landWord(w, value) {
      if (stopped || !w.isConnected) return;
      w.querySelector(".g").textContent = value;
      w.classList.add("landing");
      if (el.closest("[data-room]")) padWord(w, emoji);
      w.classList.add("got");
      later(() => w.classList.remove("landing"), LAND_MS + 100);
    }

    function slot(w, value) {
      if (!value) return;
      const now = performance.now();
      const at = Math.max(now, free);
      free = at + per;
      if (at - now < 1) landWord(w, value);
      else later(() => landWord(w, value), at - now);
    }

    function pump() {
      clearTimeout(blockTimer);
      if (stopped) return;
      while (queue.length) {
        const w = queue[0];
        if (answers.has(w)) {
          queue.shift();
          blockedSince = 0;
          slot(w, answers.get(w));
          continue;
        }
        // The first word still waiting holds the ones after it that are in.
        const ready = queue.findIndex((x) => answers.has(x));
        if (ready < 0) {
          blockedSince = 0;
          return;
        }
        const now = performance.now();
        blockedSince ||= now;
        const left = blockedSince + HEAD_WAIT_MS - now;
        if (left > 0) {
          blockTimer = setTimeout(pump, left);
          return;
        }
        for (const x of queue.splice(0, ready)) late.add(x);
        blockedSince = 0;
      }
    }

    function stop() {
      stopped = true;
      clearTimeout(blockTimer);
      for (const t of timers) clearTimeout(t);
      timers.clear();
      resolveFinished?.();
    }

    return {
      arrive(w, value) {
        if (stopped || !w || answers.has(w)) return;
        answers.set(w, value || null);
        if (late.delete(w)) slot(w, value);
        else pump();
      },
      finish() {
        if (finished) return finished;
        for (const w of [...queue, ...late]) if (!answers.has(w)) answers.set(w, null);
        late.clear();
        pump();
        finished = new Promise((resolve) => {
          resolveFinished = resolve;
          later(resolve, Math.max(0, free - performance.now()) + LAND_MS);
        });
        if (stopped) resolveFinished();
        return finished;
      },
      stop,
    };
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

  // The ad tags a visit arrived with (utm_source, utm_medium, utm_campaign:
  // the three the Chrome Web Store forwards to its Google Analytics, where an
  // install is counted per campaign). Plain words only.
  const UTM = ["utm_source", "utm_medium", "utm_campaign"];
  const arrivedWith = UTM
    .map((key) => [key, params.get(key)])
    .filter(([, value]) => value && /^[\w.-]{1,64}$/.test(value));

  /**
   * Store links say where they were clicked, or pass on the visit's ad tags,
   * so an install is counted under the campaign that brought it. Links to the
   * site's other pages carry the tags along (nothing is stored in the
   * browser), so a visit that lands on Home and installs from Write keeps them.
   */
  function storeLinks() {
    const { STORE_URL } = window.EmojinizeConfig;
    document.querySelectorAll("a[data-store]").forEach((a) => {
      const url = new URL(STORE_URL);
      if (arrivedWith.length) {
        for (const [key, value] of arrivedWith) url.searchParams.set(key, value);
      } else {
        url.searchParams.set("utm_source", "emojinize.com");
        url.searchParams.set("utm_medium", a.dataset.store || "site");
      }
      a.href = url.href;
    });
    if (!arrivedWith.length) return;
    document.querySelectorAll('a[href^="/"]').forEach((a) => {
      const url = new URL(a.getAttribute("href"), location.origin);
      for (const [key, value] of arrivedWith) url.searchParams.set(key, value);
      a.setAttribute("href", url.pathname + url.search + url.hash);
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

  window.Emojinize = Object.freeze({ esc, annotate, land, render, installed, glue, fit, order, lander });

  // Lines break elsewhere at another width, and an emoji font can arrive late.
  // Only the width moves a line break: a phone's address bar showing or
  // hiding as the reader scrolls resizes the height alone, and refitting then
  // (.refit takes the transitions off) showed every emoji still landing at once.
  let refit = 0;
  let fittedWidth = innerWidth;
  const fitAll = () => {
    cancelAnimationFrame(refit);
    refit = requestAnimationFrame(() => fit(document.body));
  };
  const onResize = () => {
    if (innerWidth === fittedWidth) return;
    fittedWidth = innerWidth;
    fitAll();
  };

  /**
   * On a screen too narrow for every link, the site nav scrolls sideways:
   * the current page's link is scrolled into view, so it never sits cut off.
   */
  function showCurrentLink() {
    const nav = document.querySelector(".links");
    const cur = nav?.querySelector('[aria-current="page"]');
    if (!cur || nav.scrollWidth <= nav.clientWidth) return;
    const n = nav.getBoundingClientRect();
    const c = cur.getBoundingClientRect();
    if (c.right > n.right) nav.scrollLeft += c.right - n.right + 8;
    else if (c.left < n.left) nav.scrollLeft -= n.left - c.left + 8;
  }

  function start() {
    storeLinks();
    applyInstalled();
    showCurrentLink();
    render(document);
    land(document.body);
    addEventListener("resize", onResize);
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
