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
 *   lake, lake-zh, lake-es, lake-hi, lake-ar, lake-tr
 *           Home's story, "A weekend by the lake", in six languages, for its
 *           language carousel. Recorded 2026-11-14 from production (/v1/mark,
 *           then /v1/emoji, as the extension asks): marker m-e286296f25e9f771,
 *           decoder d-8195a5a59b3ef9d6 (Gemma 4 E4B); two runs gave the same
 *           answer. Each text was checked span by span against the marking
 *           rules of the dataset pipeline (emojinize-train-test
 *           src/prompts/marking.py): every content word marked, no function
 *           word marked, every multi-word expression one span. Wordings the
 *           model split or read literally were replaced rather than shown,
 *           among them "soaked to the bone", "llover a cántaros", "bardaktan
 *           boşanırcasına yağmak", "yağmur yağmak", "iliklerine kadar ıslanmak",
 *           "तर-बतर होना",
 *           "raining cats and dogs" (🐈 🐕) and "crawled into" (👶). Each
 *           paragraph is one entry, its spans in code points of the paragraph.
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
  "lake": {
    title: ["A weekend by the lake",
      [[2,9,"📅🏖️😌"], [17,21,"🏞️💧"]]],
    p1: ["We hit the road at dawn and went fishing on the lake. Then it started pouring, and we got soaked.",
      [[3,15,"🚗🛣️"], [19,23,"🌅"], [28,32,"🚶➡️"], [33,40,"🎣🐟"], [48,52,"🏞️💧"], [62,69,"▶️"], [70,77,"🌧️⬇️"], [90,96,"🌧️💧👕😰"]]],
    p2: ["At camp, we warmed up by the fire and laughed a lot. Then we snuggled into our sleeping bags and fell asleep.",
      [[3,7,"🏕️🌲"], [12,21,"🥶➡️🔥😊"], [29,33,"🔥"], [38,45,"😂😄"], [61,69,"🤗🛏️"], [79,92,"🛏️🎒"], [97,108,"😴💤"]]],
  },
  "lake-zh": {
    title: ["湖边的周末",
      [[0,2,"🏞️💧"], [3,5,"📅🎉"]]],
    p1: ["我们清晨就上路了，去湖上钓鱼。突然一场倾盆大雨，把我们淋成了落汤鸡。",
      [[2,4,"🌅"], [5,7,"🚗🛣️"], [9,10,"➡️📍"], [10,11,"🏞️💧"], [12,14,"🎣🐟"], [15,17,"⚡😲"], [19,23,"🌧️🌧️🌧️💧"], [27,28,"🌧️💦👕"], [30,33,"🌧️💧🐔"]]],
    p2: ["回营地后，我们在篝火旁暖暖身子，笑个不停。晚上我们躺进睡袋，倒头就睡。",
      [[0,1,"↩️🏕️"], [1,3,"🏕️⛺"], [8,10,"🔥🪵"], [11,13,"🔥➡️😊"], [13,15,"🧍‍♂️"], [16,17,"😄"], [18,20,"🔁⏳"], [21,23,"🌙🌃"], [25,26,"🛏️⬇️"], [27,29,"🛏️🎒"], [30,32,"🛏️➡️😴"], [33,34,"😴💤"]]],
  },
  "lake-es": {
    title: ["Un fin de semana en el lago",
      [[3,16,"📅🏖️"], [23,27,"🏞️💧"]]],
    p1: ["Al alba pusimos rumbo al lago para pescar. De pronto diluvió y nos empapamos.",
      [[3,7,"🌅"], [8,21,"🧭➡️"], [25,29,"🏞️💧"], [35,41,"🎣🐟"], [43,52,"⚡😲"], [53,60,"🌧️🌧️💦"], [67,76,"💧👕💦"]]],
    p2: ["Junto al fuego nos calentamos y reímos mucho. Luego nos acurrucamos en los sacos de dormir y nos dormimos.",
      [[9,14,"🔥"], [19,29,"🔥➡️😊"], [32,38,"😂😄"], [56,67,"🤗🛏️"], [75,90,"🛏️🎒😴"], [97,105,"😴💤"]]],
  },
  "lake-hi": {
    title: ["झील पर एक वीकेंड",
      [[0,3,"🏞️💧"], [10,16,"📅🎉😌"]]],
    p1: ["हम सुबह-सुबह निकल पड़े और झील पर मछली पकड़ने गए. फिर बारिश में हम भीग गए.",
      [[3,12,"🌅⏰"], [13,22,"🚶‍♂️➡️"], [26,29,"🏞️💧"], [33,37,"🐟"], [38,44,"🎣🐟"], [45,47,"🚶➡️📍"], [53,58,"🌧️☔"], [66,69,"🌧️💧👕"]]],
    p2: ["कैंप पर लौटकर हम आग के पास बैठे और खूब हँसे. फिर स्लीपिंग बैग में घुसते ही हमें नींद आ गई.",
      [[0,4,"🏕️"], [8,13,"↩️🏕️"], [17,19,"🔥"], [27,31,"🪑⬇️"], [39,43,"😂🤣"], [49,61,"🛏️🎒"], [66,71,"🚶➡️🛏️"], [80,86,"😴💤"]]],
  },
  "lake-ar": {
    title: ["عطلة نهاية الأسبوع",
      [[0,18,"📅🏖️😌"]]],
    p1: ["شددنا الرحال عند الفجر وذهبنا لصيد السمك في البحيرة. ثم أمطرت فابتللنا تمامًا.",
      [[0,12,"🧳🚶‍♂️➡️"], [17,22,"🌅"], [23,29,"🚶➡️"], [30,34,"🎣"], [35,40,"🐟"], [44,51,"🏞️💧"], [56,61,"🌧️☔"], [62,70,"🌧️👕💧"]]],
    p2: ["في المخيم تدفأنا حول النار وضحكنا كثيرًا. ثم دخلنا الخيمة وغفونا على الفور.",
      [[3,9,"🏕️"], [10,16,"🥶➡️🔥😊"], [21,26,"🔥"], [27,33,"😂🤣"], [45,50,"🚶➡️⛺"], [51,57,"⛺"], [58,64,"😴🛏️"], [65,74,"⚡⏱️"]]],
  },
  "lake-tr": {
    title: ["Gölde bir hafta sonu",
      [[0,5,"🏞️💧"], [10,20,"📅🎉"]]],
    p1: ["Şafakta yola çıkıp gölde balık tuttuk. Derken sağanak başladı ve hepimiz ıslandık.",
      [[0,7,"🌅"], [8,18,"🚶➡️🛣️"], [19,24,"🏞️💧"], [25,37,"🎣🐟"], [46,53,"🌧️🌧️"], [54,61,"▶️"], [73,81,"🌧️💧👕"]]],
    p2: ["Kampta ateşin başında ısındık ve çok güldük. Sonra uyku tulumlarımıza girip uyuyakaldık.",
      [[0,6,"🏕️"], [7,13,"🔥"], [22,29,"🔥➡️😊"], [37,43,"😂🤣"], [51,69,"🛏️🎒"], [70,75,"🚶➡️🛏️"], [76,87,"😴💤"]]],
  },
});
