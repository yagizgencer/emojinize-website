/**
 * samples.js: real output of the Emojinize model, recorded.
 *
 * The welcome tour's sample text and what the models said about it, taken
 * from emojinize-web-extension tour-data.js (generated 2026-10-04 by
 * scripts/tour-data.js, Qwen3 decoder). Each sentence is
 * [text, [[start, end, emoji], ...]] with start and end in code points of that
 * sentence. Shown on Home and in the tour preview without calling the service.
 * Regenerate from tour-data.js when the extension's sample changes.
 */
window.EmojinizeSamples = Object.freeze({
  hero: ["Grab a coffee, sit back and watch the words around you come to life.",
    [[0, 4, "🤲☕"], [7, 13, "☕"], [15, 23, "🪑↩️😌"], [28, 33, "👀"], [38, 43, "📝🔤"], [55, 67, "📝➡️🎭✨"]]],
  title: ["A very Monday morning", [[7, 13, "📅🌙"], [14, 21, "🌅☀️"]]],
  p1: [
    ["My alarm went off at six, but I hit snooze and slept in.",
      [[3, 8, "⏰🔔"], [9, 17, "🔔🔊"], [32, 35, "👆🔘"], [36, 42, "⏰⏸️😴"], [47, 55, "😴🛏️⏰"]]],
    ["By the time I rolled out of bed, I was already running late.",
      [[14, 31, "🛏️➡️🚶"], [47, 59, "⏰🏃‍♂️💨"]]],
  ],
  p2: [
    ["The bus pulled away just as I got to the stop, so I gave up and called a cab.",
      [[4, 7, "🚌"], [8, 19, "🚌💨➡️"], [30, 33, "🚶➡️📍"], [41, 45, "🚌🚏"], [52, 59, "😞🏳️"], [64, 70, "📞🗣️"], [73, 76, "🚕"]]],
    ["The driver insisted on a shortcut that turned out to be a dead end.",
      [[4, 10, "🚗👤"], [11, 19, "😤☝️"], [25, 33, "🛣️⚡"], [39, 49, "🔍➡️✅"], [58, 66, "🛣️➡️🚫🏁"]]],
  ],
  p3: [
    ["At the office, my boss was in a great mood and brought in donuts for everyone.",
      [[7, 13, "🏢💼"], [18, 22, "👔🏢"], [32, 37, "👍✨"], [38, 42, "😊🧠"], [47, 57, "📦➡️🏢"], [58, 64, "🍩"]]],
    ["Maybe Mondays are not so bad after all.", [[6, 13, "📅🌙"], [18, 21, "🚫"], [25, 28, "👎😟"]]],
  ],
});
