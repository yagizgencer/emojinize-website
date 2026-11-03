/**
 * tour.js: the welcome tour's page, steps listed beside, one at a time.
 *
 * With the extension, the extension runs the tour here as it ran it in
 * welcome.html: the real popup, right click and shortcuts, on its own sample.
 * It says so with <html data-emojinize-tour="host"> before this script runs,
 * and takes over #step, #rail, #dots, #back and #next.
 *
 * Without it, this is a preview of the same seven steps with the recorded
 * sample, under a banner that asks for the extension first.
 * Copy: emojinize-web-extension welcome.js COPY, with icons as text.
 */
(() => {
  "use strict";

  if (document.documentElement.dataset.emojinizeTour === "host") return;

  const E = window.Emojinize;
  const S = window.EmojinizeSamples?.monday;
  const $ = (id) => document.getElementById(id);
  const stepEl = $("step");
  const rail = $("rail");
  const dots = $("dots");
  const back = $("back");
  const next = $("next");
  if (!stepEl || !E || !S) return;
  // The preview draws its own emojis: an extension from before the site's
  // tour (0.9) must not emojinize them again.
  stepEl.setAttribute("data-emojinize", "ui");

  const LOGO = `<img src="/assets/icons/mark40.png" srcset="/assets/icons/mark60.png 2x" width="19" height="16" alt="Emojinize">`;
  const ctl = (s) => `<span class="ctl">${s}</span>`;
  const deco = (a) => `<div class="deco" aria-hidden="true">${a.map((x) => `<span>${x}</span>`).join("")}</div>`;
  const sample = (tag, cls, key, start, mode = "ontop") =>
    `<${tag} class="an ${cls}" data-mode="${mode}" data-render="${key}" data-start="${start}"></${tag}>`;
  const story = () =>
    `<div class="story">${sample("h3", "story-t", "title", 0)}${sample("p", "", "p1", 2)}${sample("p", "", "p2", 9)}${sample("p", "", "p3", 21)}</div>`;

  let auto = "on"; // the welcome step's answer, as the tour keeps it
  let current = 0;

  const STEPS = [
    {
      deco: ["👋", "😊", "✨"],
      title: () => "Meet Emojinize",
      body: () =>
        "Words and phrases you read come to life with emojis, on any website. " +
        "It decides which ones get emojis, and makes sure they fit their meaning in context.",
      extra: () =>
        `<div class="choice"><p class="label" id="when">When should emojis appear?</p>` +
        `<div class="tiles" role="radiogroup" aria-labelledby="when">` +
        [["on", "🔁", "Whenever I open a page"], ["off", "👆", "Only when I ask"]]
          .map(([v, e, t]) =>
            `<button type="button" class="tile" role="radio" aria-checked="${auto === v}" data-auto="${v}">` +
            `<span class="e" aria-hidden="true">${e}</span>${t}</button>`)
          .join("") +
        `</div><p class="cap">You can change this anytime.</p></div>`,
    },
    {
      deco: ["📌", "🧩", "⭐"],
      title: () => "Keep it within reach",
      body: () => "Pin Emojinize to your toolbar so it is always one click away.",
      extra: () =>
        `<ol class="howlist"><li>Click the extensions button 🧩 at the top right of Chrome.</li>` +
        `<li>Click the pin 📌 next to ${LOGO} Emojinize.</li></ol>`,
    },
    {
      deco: ["📄", "➡️", "🤩"],
      title: () => (auto === "on" ? "Every page, as it opens" : "A whole page in one click"),
      body: () =>
        auto === "on"
          ? `This story gets its emojis by itself, as every page you open will. Press ${ctl("Revert page")} in the menu for the plain words.`
          : `Click the Emojinize icon in your toolbar, then press ${ctl("Emojinize page")} to add emojis to everything on it.`,
      extra: story,
    },
    {
      deco: ["🍰", "🖍️", "💫"],
      title: () => "Or just the part you want",
      body: () =>
        `Select a few words, then click the icon that pops up next to them, or right click your selection and choose ${ctl("Emojinize")}.`,
      // The selected sentence gets its emojis where it is, as in the writer.
      extra: () =>
        `<div class="story"><p class="an" data-mode="ontop" data-later>` +
        `<mark class="sel">${E.annotate([S.p2[0]])}</mark> ${E.esc(S.p2[1][0])}</p></div>`,
    },
    {
      deco: ["✍️", "💌", "🎈"],
      title: () => "Write your own",
      body: () => "Have a message or a post of your own? Emojinize it in the writer, then copy it with its emojis.",
      extra: () =>
        `<ol class="howlist"><li>Click the Emojinize icon in your toolbar.</li>` +
        `<li>Press ${ctl("Write your own")}. The writer opens at emojinize.com/write.</li>` +
        `<li>Type or paste anything, press ${ctl("Emojinize")}, and copy the result.</li></ol>`,
    },
    {
      deco: ["🎨", "🪄", "🌈"],
      title: () => "Make it yours",
      body: () =>
        `Open Emojinize and click ${ctl("Display settings")}. Try a bigger emoji size, or switch ${ctl("Emoji display")} to ${ctl("Toggle")}. ` +
        "Every change takes effect right away and is kept for every page.",
      extra: () =>
        `<div class="story" data-sample><div class="demo-head"><span class="label" id="disp">Emoji display</span>` +
        `<div class="seg" role="radiogroup" aria-labelledby="disp" data-modes>` +
        `<button type="button" role="radio" aria-checked="true" data-mode-set="ontop">On top</button>` +
        `<button type="button" role="radio" aria-checked="false" data-mode-set="toggle">Toggle</button></div></div>` +
        `${sample("p", "", "p3", 0)}</div>`,
    },
    {
      deco: ["🎉", "🫶", "🚀"],
      title: () => "You're all set",
      body: () => "Four shortcuts for when your hands are on the keyboard.",
      extra: () =>
        `<div class="keys">` +
        [["E", "Open the Emojinize menu"], ["P", "Emojinize the page"], ["R", "Revert the page"], ["W", "Open the writer"]]
          .map(([k, t]) => `<div><span class="combo"><kbd>Alt</kbd><kbd>Shift</kbd><kbd>${k}</kbd></span><span>${t}</span></div>`)
          .join("") +
        `</div><p class="note">${
          auto === "on"
            ? `${ctl("Automatic")} is on, so every page you open gets its emojis by itself.`
            : `${ctl("Automatic")} is off, so pages wait for you.`
        } The switch is in the Emojinize menu.</p>`,
    },
  ];

  // The selection step: the sentence shows selected, then gets its emojis.
  let picking = 0;
  function pick(el) {
    const done = () => {
      el.querySelector(".sel")?.classList.add("off");
      E.land(el);
    };
    E.glue(el);
    E.fit(el);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) done();
    else picking = setTimeout(done, 1200);
  }

  function show(index, focus) {
    clearTimeout(picking);
    current = Math.max(0, Math.min(STEPS.length - 1, index));
    const step = STEPS[current];
    stepEl.innerHTML =
      `<div class="step-c">${deco(step.deco)}<h1 class="disp sm" tabindex="-1">${step.title()}</h1>` +
      `<p class="lede">${step.body()}</p>${step.extra()}</div>`;
    stepEl.querySelectorAll("[data-render]").forEach((el) => {
      const s = S[el.dataset.render];
      el.innerHTML = E.annotate(typeof s[0] === "string" ? [s] : s, Number(el.dataset.start) || 0);
    });
    stepEl.querySelectorAll(".an:not([data-later])").forEach((el) => E.land(el));
    stepEl.querySelectorAll(".an[data-later]").forEach(pick);

    rail.querySelectorAll("button").forEach((b, i) => {
      b.classList.toggle("done", i < current);
      b.querySelector(".n").textContent = i < current ? "✓" : String(i + 1);
      if (i === current) b.setAttribute("aria-current", "step");
      else b.removeAttribute("aria-current");
    });
    dots.setAttribute("aria-label", `Step ${current + 1} of ${STEPS.length}`);
    dots.querySelectorAll("i").forEach((d, i) => d.classList.toggle("cur", i === current));
    back.disabled = current === 0;
    next.textContent = current === STEPS.length - 1 ? "Done" : "Next";
    if (focus) stepEl.querySelector("h1").focus({ preventScroll: true });
  }

  rail.innerHTML = STEPS.map(
    (s, i) => `<li><button type="button" data-step="${i}"><span class="n">${i + 1}</span><span class="t">${s.title()}</span></button></li>`
  ).join("");
  dots.innerHTML = STEPS.map(() => "<i></i>").join("");

  rail.addEventListener("click", (event) => {
    const b = event.target.closest("[data-step]");
    if (b) show(Number(b.dataset.step), true);
  });
  back.addEventListener("click", () => show(current - 1, true));
  next.addEventListener("click", () => {
    if (current === STEPS.length - 1) location.href = "/";
    else show(current + 1, true);
  });
  stepEl.addEventListener("click", (event) => {
    const tile = event.target.closest("[data-auto]");
    if (!tile) return;
    auto = tile.dataset.auto;
    stepEl.querySelectorAll("[data-auto]").forEach((t) => t.setAttribute("aria-checked", String(t === tile)));
    // The page step's title follows the answer.
    rail.querySelector('[data-step="2"] .t').textContent = STEPS[2].title();
  });
  // Arrow keys move, as in the tour, unless someone is typing.
  document.addEventListener("keydown", (event) => {
    if (event.target.closest("input, textarea, select, [contenteditable]")) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowRight") show(current + 1, true);
    else if (event.key === "ArrowLeft") show(current - 1, true);
  });

  show(0, false);
})();
