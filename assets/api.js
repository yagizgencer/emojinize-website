/**
 * api.js: the inference service, for the Write tab's visitors who do not
 * have the extension. No DOM here, so it runs in a test under Node as well.
 *
 * The same two calls the extension makes (emojinize-web-extension
 * background.js): POST /v1/mark finds the words worth an emoji, then
 * POST /v1/emoji streams one emoji per word as Server-Sent Events,
 * `data: {"i": n, "emoji": "…"}`, ending with `data: {"done": true, …}`.
 * Offsets are code points, never UTF-16 (emojinize-server app/schemas.py).
 */
(() => {
  "use strict";

  class ApiError extends Error {
    constructor(code, retryAfter = null) {
      super(code);
      this.code = code;
      this.retryAfter = retryAfter;
    }
  }

  /** The gateway's answers, as the codes the page has words for. */
  function codeFor(status, body) {
    const error = body && typeof body.error === "string" ? body.error : "";
    if (status === 429) return error === "queue full" ? "busy" : "rate_limited";
    if (status === 503) return error === "unavailable" ? "unavailable" : "warming_up";
    if (status === 401 || status === 403) return "refused";
    if (status === 400 || status === 413 || status === 422) return "too_long";
    return "failed";
  }

  async function post(options, path, body, accept) {
    const { base, token, signal } = options;
    const fetchImpl = options.fetch || globalThis.fetch;
    let response;
    try {
      response = await fetchImpl(base + path, {
        method: "POST",
        headers: { "content-type": "application/json", accept, authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
        signal,
      });
    } catch (error) {
      if (signal && signal.aborted) throw new ApiError(signal.reason === "timeout" ? "unreachable" : "cancelled");
      throw new ApiError("unreachable");
    }
    if (!response.ok) {
      let parsed = null;
      try {
        parsed = await response.json();
      } catch {
        /* the status is enough */
      }
      const retry = Number(response.headers.get("retry-after"));
      throw new ApiError(codeFor(response.status, parsed), Number.isFinite(retry) && retry > 0 ? retry : null);
    }
    return response;
  }

  /**
   * Emojinizes one text. Resolves to its spans, [{start, end, emoji}] in
   * order, with emoji null for a word the model declined. `onSpans` hears the
   * spans as soon as they are known (before any emoji), and `onEmoji(index,
   * emoji)` each emoji as it streams in.
   */
  async function emojinize(text, options) {
    const marked = await post(options, "/v1/mark", { texts: [text], decoder: "qwen3" }, "application/json");
    let body;
    try {
      body = await marked.json();
    } catch {
      throw new ApiError("failed");
    }
    const result = body && Array.isArray(body.results) ? body.results[0] : null;
    if (!result || !Array.isArray(result.sentences) || !Array.isArray(result.spans)) throw new ApiError("failed");

    // In order, not overlapping, not empty: what one line of text can show.
    const length = Array.from(text).length;
    const spans = [];
    let end = 0;
    for (const s of [...result.spans].sort((a, b) => a.start - b.start)) {
      const ok = Number.isInteger(s.start) && Number.isInteger(s.end) && s.start >= end && s.end > s.start && s.end <= length;
      if (!ok) continue;
      spans.push({ si: s.si, cs: s.cs, ce: s.ce, start: s.start, end: s.end, emoji: null });
      end = s.end;
    }
    if (options.onSpans) options.onSpans(spans);
    if (!spans.length) return spans;

    const items = spans.map(({ si, cs, ce }) => ({ si, cs, ce }));
    const streamed = await post(options, "/v1/emoji", { sentences: result.sentences, items, decoder: "qwen3" }, "text/event-stream");
    const reader = streamed.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finished = false;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // Frames end with a blank line; a chunk can stop in the middle of one.
        const frames = buffer.split("\n\n");
        buffer = frames.pop() || "";
        for (const frame of frames) {
          const line = frame.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          let event;
          try {
            event = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (!event || typeof event !== "object") continue;
          if (event.done) finished = true;
          const i = event.i;
          if (!Number.isInteger(i) || i < 0 || i >= spans.length) continue;
          if (typeof event.emoji === "string" && event.emoji) {
            spans[i].emoji = event.emoji;
            if (options.onEmoji) options.onEmoji(i, event.emoji);
          }
        }
      }
    } catch {
      throw Object.assign(new ApiError(options.signal && options.signal.aborted ? "cancelled" : "stream_aborted"), { spans });
    }
    if (!finished && spans.some((s) => s.emoji === null)) {
      throw Object.assign(new ApiError("stream_aborted"), { spans });
    }
    return spans;
  }

  /**
   * The two forms the writer copies, as content.js serializeAnnotations makes
   * them: "annotated" keeps the words, [words](emoji); "replaced" puts the
   * emoji in their place.
   */
  function serialize(text, spans, style) {
    const cps = Array.from(text);
    let out = "";
    let pos = 0;
    for (const s of spans) {
      if (!s.emoji) continue;
      out += cps.slice(pos, s.start).join("");
      out += style === "replaced" ? s.emoji : `[${cps.slice(s.start, s.end).join("")}](${s.emoji})`;
      pos = s.end;
    }
    return out + cps.slice(pos).join("");
  }

  globalThis.EmojinizeApi = Object.freeze({ emojinize, serialize, ApiError, codeFor });
})();
