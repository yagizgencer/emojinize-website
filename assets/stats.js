/**
 * stats.js: what emojinize.com counts about itself, anonymously.
 *
 * One small note per event, sent with navigator.sendBeacon to the telemetry
 * Worker's website route (emojinize-server telemetry/, POST /v1/s), which
 * keeps only values from its fixed lists (schema.js SITE_VOCAB, SITE_SLOTS)
 * and adds the country Cloudflare sees. Nothing is stored in the browser (no
 * cookie, no localStorage, no sessionStorage), and nothing identifies anyone:
 * the referrer's host becomes a class here ("google", "reddit", "other") and
 * is never sent; the campaign is one of our own names or "other".
 *
 *   view         every page, once it has loaded (so the extension has marked it)
 *   store_click  a Chrome Web Store link, by where it is (data-store)
 *   sample_lang  a language tab picked in Home's sample
 *   writer       the writer used WITHOUT the extension (write.js calls it);
 *                with the extension, the extension's own statistics count it
 *   copy         the writer's result copied, without the extension
 *   tour_step    the site's own tour preview, without the extension
 *   uninstall    /feedback/?source=uninstall, the page Chrome opens when the
 *                extension is removed: the weeks it was kept and how much it
 *                was used, which the extension put in the address
 *
 * The privacy policy's "On this website" says what is sent; change it first.
 */
(() => {
  "use strict";

  const endpoint = window.EmojinizeConfig?.STATS_ENDPOINT;
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);

  // --- the context every event carries ---------------------------------------

  /** Which page this is; the 404 page says so on <html data-page>. */
  function pageOf() {
    if (root.dataset.page) return root.dataset.page;
    const path = location.pathname.replace(/index\.html$/, "");
    return { "/": "home", "/write/": "write", "/tour/": "tour", "/feedback/": "feedback", "/privacy/": "privacy" }[path] ?? "other";
  }

  // The referrer's site, as a class. First match wins, so the store (on a
  // google.com host) comes before Google.
  const REFERRERS = [
    [/(^|\.)emojinize\.com$|^localhost$|^127\.0\.0\.1$/, "internal"],
    [/^chromewebstore\.google\.com$|^chrome\.google\.com$/, "chromewebstore"],
    [/(^|\.)google\.[a-z.]+$/, "google"],
    [/(^|\.)bing\.com$/, "bing"],
    [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
    [/(^|\.)yahoo\.[a-z.]+$/, "yahoo"],
    [/(^|\.)yandex\.[a-z.]+$|(^|\.)ya\.ru$/, "yandex"],
    [/(^|\.)baidu\.com$/, "baidu"],
    [/(^|\.)ecosia\.org$/, "ecosia"],
    [/^search\.brave\.com$/, "brave"],
    [/(^|\.)chatgpt\.com$|^chat\.openai\.com$/, "chatgpt"],
    [/(^|\.)perplexity\.ai$/, "perplexity"],
    [/(^|\.)reddit\.com$|^redd\.it$/, "reddit"],
    [/(^|\.)producthunt\.com$/, "producthunt"],
    [/^news\.ycombinator\.com$/, "hackernews"],
    [/(^|\.)x\.com$|(^|\.)twitter\.com$|^t\.co$/, "x"],
    [/(^|\.)facebook\.com$|(^|\.)fb\.com$|^l\.messenger\.com$/, "facebook"],
    [/(^|\.)instagram\.com$/, "instagram"],
    [/(^|\.)linkedin\.com$|^lnkd\.in$/, "linkedin"],
    [/(^|\.)youtube\.com$|^youtu\.be$/, "youtube"],
    [/(^|\.)tiktok\.com$/, "tiktok"],
    [/(^|\.)github\.com$/, "github"],
  ];

  function refOf(referrer) {
    if (!referrer) return "none";
    let host;
    try {
      host = new URL(referrer).hostname.toLowerCase();
    } catch {
      return "other";
    }
    return REFERRERS.find(([re]) => re.test(host))?.[1] ?? "other";
  }

  // Our own campaign names (utm_campaign on links we hand out). The Worker
  // keeps the same list; anything else is "other".
  const CAMPAIGNS = ["beta", "ph_launch", "hn_launch", "reddit_post", "g_reading", "g_emojitext", "reddit_ads"];
  function campaignOf(value) {
    if (!value) return "none";
    return CAMPAIGNS.includes(value) ? value : "other";
  }

  function deviceOf() {
    const coarse = window.matchMedia?.("(pointer: coarse)").matches;
    if (!coarse) return "desktop";
    return Math.min(screen.width, screen.height) < 600 ? "phone" : "tablet";
  }

  /** The browser, for who can install a Chrome extension at all. */
  function browserOf() {
    const brands = (navigator.userAgentData?.brands ?? []).map((b) => b.brand);
    const ua = navigator.userAgent || "";
    if (navigator.brave) return "brave";
    if (brands.includes("Microsoft Edge") || /Edg(A|iOS)?\//.test(ua)) return "edge";
    if (brands.includes("Opera") || /OPR\/|OPiOS/.test(ua)) return "opera";
    if (/SamsungBrowser/.test(ua)) return "samsung";
    if (/Firefox|FxiOS/.test(ua)) return "firefox";
    if (brands.includes("Google Chrome") || brands.includes("Chromium") || /Chrome\/|CriOS/.test(ua)) return "chrome";
    if (/Safari\//.test(ua)) return "safari";
    return "other";
  }

  const langOf = () => (navigator.language || "").toLowerCase().split("-")[0] || "und";

  // The extension marks the page at document_start; ?preview=installed only
  // pretends, and counts as no.
  const extOf = () => {
    const mark = root.getAttribute("data-emojinize-extension");
    return mark && mark !== "preview" ? "yes" : "no";
  };

  const context = () => ({
    page: pageOf(),
    ref: refOf(document.referrer),
    campaign: campaignOf(params.get("utm_campaign")),
    device: deviceOf(),
    browser: browserOf(),
    lang: langOf(),
    ext: extOf(),
  });

  // --- sending ----------------------------------------------------------------

  function send(event, slots = {}) {
    if (!endpoint) return;
    const body = JSON.stringify({ event, ...context(), ...slots });
    try {
      // text/plain: a simple request, no preflight, and it outlives the page
      // (a store link opening, the tab closing).
      if (navigator.sendBeacon?.(endpoint, new Blob([body], { type: "text/plain" }))) return;
    } catch {
      /* fall back to fetch */
    }
    try {
      fetch(endpoint, { method: "POST", body, keepalive: true, mode: "cors", credentials: "omit" }).catch(() => {});
    } catch {
      /* counting is never worth an error on the page */
    }
  }

  // --- buckets for the writer -----------------------------------------------

  function charsBucket(n) {
    if (n < 100) return "1-99";
    if (n < 500) return "100-499";
    return "500-1000";
  }

  function filledBucket(spans, filled) {
    if (!(spans > 0)) return "none";
    const pct = (100 * filled) / spans;
    if (filled <= 0) return "0";
    if (pct < 50) return "1-49";
    if (pct < 80) return "50-79";
    if (pct < 95) return "80-94";
    return "95-100";
  }

  function ttfeBucket(ms) {
    if (ms === null || ms === undefined || !Number.isFinite(ms)) return "none";
    if (ms < 1000) return "<1s";
    if (ms < 3000) return "1-3s";
    if (ms < 10_000) return "3-10s";
    if (ms < 30_000) return "10-30s";
    if (ms < 120_000) return "30-120s";
    return "120s+";
  }

  // --- events ---------------------------------------------------------------

  const stepsSeen = new Set();

  window.EmojinizeStats = Object.freeze({
    /**
     * The writer, without the extension: `outcome` (ok, nothing, or the
     * error's code), the text's length, how many words were sent and got an
     * emoji, and the milliseconds to the first emoji (null: none came).
     */
    writer({ outcome, chars, spans, filled, ttfeMs }) {
      send("writer", {
        a: outcome,
        b: charsBucket(chars),
        c: filledBucket(spans, filled),
        d: ttfeBucket(ttfeMs),
      });
    },
    copy(style) {
      send("copy", { a: style });
    },
    /** A step of the site's own tour preview, the first time it shows. */
    tourStep(id) {
      if (stepsSeen.has(id)) return;
      stepsSeen.add(id);
      send("tour_step", { a: id });
    },
  });

  document.addEventListener("click", (event) => {
    const store = event.target.closest?.("a[data-store]");
    if (store) send("store_click", { a: store.dataset.store });
    const tab = event.target.closest?.('[data-carousel] [role="tab"]');
    if (tab && tab.getAttribute("aria-selected") !== "true") send("sample_lang", { a: tab.lang });
  }, { capture: true });

  function start() {
    send("view");
    if (pageOf() === "feedback" && params.get("source") === "uninstall") {
      // Missing from an older build's address: stored as n/a, not guessed.
      send("uninstall", { a: params.get("age") || undefined, b: params.get("used") || undefined });
    }
  }

  // Once the page has loaded, so the extension has had its chance to mark it.
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
})();
