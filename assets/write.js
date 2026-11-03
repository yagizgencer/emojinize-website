/**
 * write.js: the Write tab, one box. Type or paste, press Emojinize, and the
 * same box shows the text with its emojis, with Copy annotated, Copy
 * replaced and Edit text.
 *
 * Who does the work:
 *   - With the extension, the extension does, with the reader's own settings
 *     and its 10,000 characters. It says so by setting
 *     <html data-emojinize-writer="host"> before this script runs, and this
 *     script then leaves the box alone. The element ids below are the seam.
 *   - Without it, this script calls the service itself (api.js), up to
 *     WEB_MAX_CHARS at a time, once config.js has a WEB_TOKEN.
 */
(() => {
  "use strict";

  if (document.documentElement.dataset.emojinizeWriter === "host") return;

  const config = window.EmojinizeConfig;
  const Api = window.EmojinizeApi;
  const $ = (id) => document.getElementById(id);
  const card = $("writer");
  const field = $("text");
  const result = $("result");
  const label = $("writer-label");
  const count = $("count");
  const go = $("go");
  const edit = $("edit");
  const copies = $("copies");
  const copyAnnotated = $("copy-annotated");
  const copyReplaced = $("copy-replaced");
  const status = $("status");
  if (!card || !field || !Api) return;

  const MAX = config.WEB_MAX_CHARS;
  // The token switches it on. An empty API_BASE means this site's own origin.
  const live = Boolean(config.WEB_TOKEN);
  const DRAFT = "emojinize:write:draft";
  const fmt = (n) => n.toLocaleString("en-US");

  // The extension's own sentences (errors.js), so the two never describe one
  // problem differently.
  const SAY = {
    working: "Emojinizing…",
    nothing: "No emojinizable words here. Names, numbers, and function words are skipped by design.",
    tooLong: `Up to ${fmt(MAX)} characters at a time here. Emojinize in Chrome takes longer texts.`,
    soon: "Trying your own text here opens soon. Emojinize in Chrome does it on any page today.",
    copied: "Copied!",
    unreachable: "Can't reach Emojinize. Check your connection or try again in a minute.",
    rate_limited: "Too many requests. Wait a minute.",
    warming_up: "Emojinize is starting up. This can take a few minutes.",
    unavailable: "Emojinize is unavailable right now. Try again in a few minutes.",
    too_long: `That text is too long to try here. Up to ${fmt(MAX)} characters at a time.`,
    failed: "Something went wrong. Try again.",
  };

  let busy = false;
  let shown = null; // { text, spans } of the result on screen
  let controller = null;

  const store = {
    get() {
      try {
        return sessionStorage.getItem(DRAFT) || "";
      } catch {
        return "";
      }
    },
    set(value) {
      try {
        sessionStorage.setItem(DRAFT, value);
      } catch {
        /* a draft is a convenience */
      }
    },
  };

  const length = () => Array.from(field.value).length;

  function say(text, bad = false) {
    status.textContent = text || "";
    status.classList.toggle("bad", Boolean(bad));
  }

  function paint() {
    const n = length();
    count.textContent = `${fmt(n)} / ${fmt(MAX)}`;
    count.classList.toggle("over", n > MAX);
    const editing = card.dataset.state !== "result";
    go.textContent = busy ? SAY.working : "Emojinize";
    go.setAttribute("aria-disabled", String(busy || !field.value.trim() || n > MAX));
    go.hidden = !editing;
    edit.hidden = editing;
    copies.hidden = editing || !shown || !shown.spans.some((s) => s.emoji);
    field.hidden = !editing;
    result.hidden = editing;
    label.textContent = editing ? "Your text" : "Emojinized";
    field.readOnly = busy;
  }

  function showEdit() {
    if (controller) controller.abort("cancelled");
    card.dataset.state = "edit";
    say("");
    paint();
    field.focus();
  }

  /** Lays the text out with its words in place, before any emoji arrives. */
  function layout(text, spans) {
    const cps = Array.from(text);
    const frag = document.createDocumentFragment();
    let pos = 0;
    spans.forEach((span, i) => {
      frag.append(cps.slice(pos, span.start).join(""));
      const w = document.createElement("span");
      w.className = "w";
      w.style.setProperty("--i", "0");
      const t = document.createElement("span");
      t.className = "t";
      t.textContent = cps.slice(span.start, span.end).join("");
      const g = document.createElement("span");
      g.className = "g";
      g.setAttribute("aria-hidden", "true");
      w.append(t, g);
      w.dataset.index = String(i);
      frag.append(w);
      pos = span.end;
    });
    frag.append(cps.slice(pos).join(""));
    result.replaceChildren(frag);
  }

  function fill(i, emoji) {
    const w = result.querySelector(`.w[data-index="${i}"]`);
    if (!w) return;
    w.querySelector(".g").textContent = emoji;
    requestAnimationFrame(() => w.classList.add("got"));
  }

  /** Words the model declined go back to plain text. */
  function settle(spans) {
    result.querySelectorAll(".w").forEach((w) => {
      const span = spans[Number(w.dataset.index)];
      if (!span || !span.emoji) w.replaceWith(w.querySelector(".t").textContent);
    });
    result.normalize();
  }

  async function run() {
    if (busy) return;
    const text = field.value;
    if (!text.trim()) {
      field.focus();
      return;
    }
    if (length() > MAX) {
      say(SAY.tooLong, true);
      return;
    }
    if (!live) {
      say(SAY.soon);
      return;
    }
    busy = true;
    say("");
    paint();
    controller = new AbortController();
    const timer = setTimeout(() => controller.abort("timeout"), 90_000);
    let spans = [];
    try {
      spans = await Api.emojinize(text, {
        base: config.API_BASE,
        token: config.WEB_TOKEN,
        signal: controller.signal,
        onSpans(found) {
          if (!found.length) return;
          shown = { text, spans: found };
          layout(text, found);
          card.dataset.state = "result";
          paint();
        },
        onEmoji: fill,
      });
      settle(spans);
      if (!spans.some((s) => s.emoji)) {
        card.dataset.state = "edit";
        say(SAY.nothing);
      }
    } catch (error) {
      const code = error && error.code;
      if (code === "cancelled") return;
      if (error && error.spans && error.spans.some((s) => s.emoji)) {
        settle(error.spans);
        say(SAY.failed, true);
      } else {
        card.dataset.state = "edit";
        say(SAY[code] || SAY.failed, true);
      }
    } finally {
      clearTimeout(timer);
      controller = null;
      busy = false;
      paint();
    }
  }

  // --- copies, as on the selection card -------------------------------------

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
      document.body.append(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      area.remove();
      return ok;
    }
  }

  function copyButton(button, style) {
    const words = button.querySelector("span");
    const label = words.textContent;
    let timer = null;
    button.addEventListener("click", async () => {
      if (!shown) return;
      if (!(await copyText(Api.serialize(shown.text, shown.spans, style)))) return;
      words.textContent = SAY.copied;
      clearTimeout(timer);
      timer = setTimeout(() => (words.textContent = label), 1600);
    });
  }

  copyButton(copyAnnotated, "annotated");
  copyButton(copyReplaced, "replaced");

  // --- wiring -----------------------------------------------------------------

  field.maxLength = MAX;
  field.value = store.get();
  card.dataset.state = "edit";
  paint();

  field.addEventListener("input", () => {
    store.set(field.value);
    if (status.classList.contains("bad") || status.textContent === SAY.soon) say("");
    paint();
  });
  go.addEventListener("click", () => {
    if (go.getAttribute("aria-disabled") === "true" && !field.value.trim()) field.focus();
    else run();
  });
  edit.addEventListener("click", showEdit);
  // Cmd/Ctrl+Enter anywhere on the page, as in the extension's writer.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || !(event.metaKey || event.ctrlKey)) return;
    if (card.dataset.state === "result") return;
    event.preventDefault();
    run();
  });
})();
