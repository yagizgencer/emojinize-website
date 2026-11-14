/**
 * carousel.js: Home's sample in six languages ([data-carousel] in index.html).
 *
 * The card holds one layer per language (.lc-layer), stacked in one grid cell
 * so the card keeps the height of the longest. site.js draws each layer from
 * samples.js and fits its rows; this file decides which layer shows and when
 * its emojis land.
 *
 *   - One layer at a time. The next fades in, and its emojis land one by one,
 *     PER apart, in reading order: line by line from the top, and along each
 *     line in the layer's direction (right to left for Arabic).
 *   - A language stays HOLD after its last emoji lands, then the next one
 *     comes. The active tab fills like a timer meanwhile.
 *   - The tabs pick a language (click, or arrow keys); the rotation goes on
 *     from there. The button beside them pauses it.
 *   - It starts once the card is on screen, and waits while the card is off
 *     screen or the page is hidden. With reduced motion it starts paused and
 *     emojis show at once.
 */
(() => {
  "use strict";

  const card = document.querySelector("[data-carousel]");
  if (!card || !window.Emojinize) return;

  const PER = 70; // ms from one emoji to the next
  const HOLD = 4000; // ms a language stays once its last emoji has landed
  const LAND = 500; // ms an emoji takes to land (site.css)
  const ENTER = 200; // ms from a tab change to the first emoji

  const tabs = [...card.querySelectorAll('[role="tab"]')];
  const layers = [...card.querySelectorAll(".lc-layer")];
  const pauseButton = card.querySelector(".lc-pause");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const per = () => (reduced.matches ? 0 : PER);

  let cur = 0;
  let timer = 0;
  let jobs = [];
  let seen = false;
  let started = false;
  let held = reduced.matches;

  const annotated = (layer) => [...layer.querySelectorAll(".an")];

  /** --i on each phrase: lines top to bottom, each in reading direction. */
  function order(layer) {
    const rtl = getComputedStyle(layer).direction === "rtl";
    const items = [...layer.querySelectorAll(".an .w")].map((w) => {
      const r = w.querySelector(".t").getBoundingClientRect();
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
    layer.dataset.spans = String(i);
  }

  const orderAll = () => layers.forEach(order);

  /** Takes a layer's emojis off at once, ready to land again. */
  function reset(layer) {
    layer.classList.add("lc-snap");
    annotated(layer).forEach((el) => el.classList.remove("on"));
    void layer.offsetWidth;
    layer.classList.remove("lc-snap");
  }

  function later(fn, ms) {
    jobs.push(setTimeout(fn, ms));
  }

  function select(k) {
    tabs.forEach((t, i) => {
      t.setAttribute("aria-selected", String(i === k));
      t.tabIndex = i === k ? 0 : -1;
    });
    layers.forEach((l, i) => {
      l.classList.toggle("lc-cur", i === k);
      l.inert = i !== k;
    });
  }

  function show(k) {
    jobs.forEach(clearTimeout);
    jobs = [];
    clearTimeout(timer);
    started = true;
    const out = layers[cur];
    const inn = layers[k];
    if (out !== inn) {
      reset(inn);
      later(() => reset(out), 450);
    }
    cur = k;
    select(k);
    later(() => annotated(inn).forEach((el) => el.classList.add("on")), out === inn ? 60 : ENTER);
    schedule();
  }

  function schedule() {
    clearTimeout(timer);
    card.classList.remove("lc-run");
    card.classList.toggle("lc-held", held);
    const spans = Number(layers[cur].dataset.spans) || 0;
    const dur = ENTER + Math.max(0, spans - 1) * per() + LAND + HOLD;
    card.style.setProperty("--lc-dur", `${dur}ms`);
    if (held || !started || !seen || document.hidden) return;
    void card.offsetWidth;
    card.classList.add("lc-run");
    timer = setTimeout(() => show((cur + 1) % layers.length), dur);
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => show(i));
    tab.addEventListener("keydown", (e) => {
      const n = tabs.length;
      const k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: n - 1 }[e.key];
      if (k === undefined) return;
      e.preventDefault();
      const next = (k + n) % n;
      tabs[next].focus();
      show(next);
    });
  });

  pauseButton.addEventListener("click", () => {
    held = !held;
    pauseButton.setAttribute("aria-label", held ? "Play" : "Pause");
    schedule();
  });
  pauseButton.setAttribute("aria-label", held ? "Play" : "Pause");

  const setPer = () => card.style.setProperty("--lc-per", `${per()}ms`);
  setPer();
  reduced.addEventListener?.("change", setPer);

  select(0);
  orderAll();

  new IntersectionObserver(
    (entries) => {
      seen = entries[entries.length - 1].isIntersecting;
      if (seen && !started) show(0);
      else schedule();
    },
    { threshold: 0.3 },
  ).observe(card);

  document.addEventListener("visibilitychange", schedule);

  // Lines break elsewhere at another width, and fonts can arrive late: site.js
  // fits the rows again on the next frame; the order follows after it.
  let again = 0;
  const reorder = () => {
    cancelAnimationFrame(again);
    again = requestAnimationFrame(() => requestAnimationFrame(orderAll));
  };
  window.addEventListener("resize", reorder);
  document.fonts?.ready.then(reorder);
})();
