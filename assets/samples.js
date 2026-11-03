/**
 * samples.js: real output of the Emojinize model, recorded, so the site shows
 * it without calling the service. Each sentence is
 * [text, [[start, end, emoji], ...]] with start and end in code points of that
 * sentence.
 *
 *   monday  the welcome tour's story, from emojinize-web-extension
 *           tour-data.js (generated 2026-10-04 by scripts/tour-data.js, Qwen3
 *           decoder). Regenerate from tour-data.js when the extension's sample
 *           changes.
 *   lake    Home's story, chosen on 2026-11-03 from candidate stories run
 *           through the production model with the same script's run(): three
 *           multi-word expressions of different kinds, as the model marked
 *           them ("hit the road", "rowed out", "hot chocolate").
 */
window.EmojinizeSamples = Object.freeze({
  monday: {
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
  },
  lake: {
    title: ["Saturday at the lake", [[0, 8, "📅🎉"], [16, 20, "🏞️💧"]]],
    p1: [
      ["We hit the road before sunrise and rented a boat at the lake.",
        [[3, 15, "🚗🛣️➡️"], [23, 30, "🌅☀️"], [35, 41, "💰🤝📦"], [44, 48, "🚤"], [56, 60, "🏞️💧"]]],
      ["The water was calm, so we rowed out to the island.",
        [[4, 9, "💧🌊"], [14, 18, "🌊😌"], [26, 35, "🚣‍♂️➡️🌊"], [43, 49, "🏝️"]]],
    ],
    p2: [
      ["Back at the cabin, we drank hot chocolate by the fire.",
        [[12, 17, "🌲🏠"], [22, 27, "🥤😋"], [28, 41, "🍫🔥🥛"], [49, 53, "🔥🪵"]]],
      ["It was the best day of the whole summer.",
        [[11, 15, "🏆⭐"], [16, 19, "☀️📅"], [33, 39, "☀️🏖️"]]],
    ],
  },
});
