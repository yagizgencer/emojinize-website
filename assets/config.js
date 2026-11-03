/**
 * config.js: the site's addresses and switches, in one place.
 *
 * Served from emojinize.com, the site talks to the production Workers; served
 * from localhost (python3 -m http.server 8000), to the dev ones, whose
 * gateway and feedback Worker accept that origin. The dev gateway's GPU scales
 * to zero, so the first Emojinize there may answer "starting up".
 *
 *   WEB_TOKEN          the gateway's token for this site's Write tab
 *                      (emojinize-server gateway, WEB_TOKEN secret). Public by
 *                      construction, like the extension's: what it buys is a
 *                      budget of its own, and deleting the secret turns the
 *                      demo off without touching the extension. Empty keeps
 *                      the live demo off ("opens soon").
 *   FEEDBACK_ENDPOINT  the feedback Worker (emojinize-server feedback/).
 *                      Empty shows a link to the Tally form instead.
 *   TURNSTILE_SITE_KEY Cloudflare Turnstile on the feedback form, with
 *                      TURNSTILE_SECRET set on the Worker. Empty: off.
 */
(() => {
  const local = ["localhost", "127.0.0.1"].includes(location.hostname);

  window.EmojinizeConfig = Object.freeze({
    // The published listing, by ID (the unpacked build's ID is another one).
    STORE_URL: "https://chromewebstore.google.com/detail/cbofieekacidabdkojipfaokcahhbplm",

    // Write tab, for visitors without the extension.
    API_BASE: local
      ? "https://emojinize-gateway.emojinize.workers.dev"
      : "https://emojinize-gateway-prod.emojinize.workers.dev",
    WEB_TOKEN: local
      ? "01c361b8df85b8a9626ef0aaec9406c360148db85407fcc3f9d79e5cd733a742"
      : "f2ae4db165afdd628884b1bc59df30ff97d11318dd76fd5f6eef6d4265a055c1",
    WEB_MAX_CHARS: 1000,

    // Feedback tab.
    FEEDBACK_ENDPOINT: local
      ? "https://emojinize-feedback.emojinize.workers.dev/v1/feedback"
      : "https://emojinize-feedback-prod.emojinize.workers.dev/v1/feedback",
    // The widget knows emojinize.com only; the dev Worker asks for no token.
    TURNSTILE_SITE_KEY: local ? "" : "0x4AAAAAAFx7TQXxHBHiRvrL",
    // For 0.9 installs, which still open it directly.
    TALLY_FORM: "https://tally.so/r/44gJXB",
  });
})();
