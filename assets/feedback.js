/**
 * feedback.js: the Feedback tab.
 *
 * The extension opens /feedback?source=popup&version=0.9&env=prod (the same
 * hidden fields it gives the Tally form today, background.js feedbackUrl).
 * They travel with the message, and nothing else does: no page text, no
 * browsing history, no ID.
 *
 * Messages go to FEEDBACK_ENDPOINT (the feedback Worker) as JSON:
 *   { topic, message, website, source, version, env, turnstile }
 * topic and source use the telemetry Worker's FEEDBACK_VOCAB words
 * (emojinize-server telemetry/src/schema.js), so the counts on the usage
 * dashboard keep their meaning. Until the endpoint exists, the page links to
 * the Tally form instead, carrying the same hidden fields.
 */
(() => {
  "use strict";

  const config = window.EmojinizeConfig;
  const $ = (id) => document.getElementById(id);
  const form = $("fb");
  if (!form) return;

  const SOURCES = ["popup", "tour", "prompt", "uninstall", "site"];
  const FROM = {
    popup: "the popup",
    tour: "the tour",
    prompt: "the popup's question",
    uninstall: "removing the extension",
    site: "the website",
  };
  const VERSION = /^\d{1,5}(?:\.\d{1,5}){0,3}$/;
  // One question per topic, as the message box's placeholder.
  const ASK = {
    broken: "What went wrong, and on what kind of page?",
    quality: "Which words got the wrong emoji, and what would have fit?",
    idea: "What would make Emojinize better for you?",
    experience: "How does it feel to use? What gets in the way?",
    other: "Tell us more.",
  };

  const params = new URLSearchParams(location.search);
  const source = SOURCES.includes(params.get("source")) ? params.get("source") : "site";
  const version = VERSION.test(params.get("version") || "") ? params.get("version") : "";
  const env = ["prod", "dev"].includes(params.get("env")) ? params.get("env") : "prod";

  $("also").textContent = `Also sent: ${version ? `version ${version}, ` : ""}opened from ${FROM[source]}`;

  if (source === "uninstall") {
    $("fb-title").textContent = "Sorry to see you go";
    $("fb-lede").textContent = "If you have a moment, tell us what made you remove Emojinize. It helps us fix it.";
  }

  // No endpoint yet: the Tally form, with the same hidden fields.
  if (!config.FEEDBACK_ENDPOINT) {
    const url = new URL(config.TALLY_FORM);
    url.searchParams.set("source", source);
    if (version) url.searchParams.set("version", version);
    url.searchParams.set("env", env);
    $("fb-tally-link").href = url.href;
    $("fb-after").textContent = "That form is hosted for us by Tally. Nothing from the pages you read is attached.";
    form.hidden = true;
    $("fb-tally").hidden = false;
    return;
  }

  const message = $("msg");
  const website = $("website");
  const status = $("fb-status");
  const send = $("send");
  const DRAFT = "emojinize:feedback:draft";

  try {
    message.value = sessionStorage.getItem(DRAFT) || "";
  } catch {
    /* a draft is a convenience */
  }
  message.addEventListener("input", () => {
    try {
      sessionStorage.setItem(DRAFT, message.value);
    } catch {
      /* a draft is a convenience */
    }
  });

  form.addEventListener("change", (event) => {
    if (event.target.name === "topic") message.placeholder = ASK[event.target.value] || ASK.other;
  });

  // Cloudflare Turnstile keeps bots out of the inbox. Loaded only when the
  // site has a key, and only on this page.
  let widget = null;
  if (config.TURNSTILE_SITE_KEY) {
    window.onEmojinizeTurnstile = () => {
      widget = window.turnstile.render("#turnstile", {
        sitekey: config.TURNSTILE_SITE_KEY,
        appearance: "interaction-only",
        theme: "auto",
      });
    };
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onEmojinizeTurnstile&render=explicit";
    script.async = true;
    script.defer = true;
    document.head.append(script);
  }

  function say(text, bad = false) {
    status.textContent = text;
    status.classList.toggle("bad", bad);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const topic = form.elements.topic.value;
    const text = message.value.trim();
    if (!topic) {
      say("Pick what it is about first.", true);
      form.querySelector('input[name="topic"]').focus();
      return;
    }
    if (!text) {
      say("Write a few words first.", true);
      message.focus();
      return;
    }
    const turnstile = widget !== null && window.turnstile ? window.turnstile.getResponse(widget) || "" : "";
    send.disabled = true;
    say("Sending…");
    try {
      const response = await fetch(config.FEEDBACK_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic, message: text, website: website.value.trim(), source, version, env, turnstile,
          company: form.elements.company ? form.elements.company.value : "",
        }),
      });
      if (!response.ok) {
        say(
          response.status === 429
            ? "Too many messages from here at once. Wait a minute and send it again."
            : "Your message didn't go through. Try again in a moment.",
          true
        );
        if (widget !== null && window.turnstile) window.turnstile.reset(widget);
        return;
      }
      try {
        sessionStorage.removeItem(DRAFT);
      } catch {
        /* nothing to clear */
      }
      say("");
      form.hidden = true;
      $("thanks").hidden = false;
      $("thanks").querySelector("h2").focus();
    } catch {
      say("Can't reach Emojinize. Check your connection and send it again.", true);
    } finally {
      send.disabled = false;
    }
  });
})();
