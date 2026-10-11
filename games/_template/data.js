/* =========================================================================
   GAME MODULE TEMPLATE: copy this folder to games/<id>/ and fill it in.
   Then set the matching entry in games/registry.js to status: "ready".

   Folder layout for a game:
     games/<id>/data.js        ← this file
     games/<id>/maps/<x>.jpg   ← only for maps you store yourself (else link by Drive id)
     games/<id>/maps/sm/<x>.jpg← ~1600px previews for stored maps

   Writing steps:
     • Version-specific text: "{first version text|second version text}",
       in the same order as `versions` below. Works in any string field.
     • Step types: story · boss · legend · key · prep · heal · tip
       (tip = optional, hidden unless "Show extras" is on)
     • Team entries: ["Name", level, "Type1/Type2", "Held item"?]
       Use "$slot" as the name to pull from starter.slots (e.g. the rival);
       a 4th value overrides the slot's held item ("-" = none).
     • Pokémon names must exist in assets/dex.js (name → National Dex #),
       and a sprite must exist at `${sprites}/<dex>.png` (+ .gif for legendaries).
   ========================================================================= */
(() => {
"use strict";

// Percent coordinates on the region map image: [x%, y%]
const PINS = {
  // "Lumiose City": [50.0, 50.0],
};

// Location maps: key → { name, <source> }. Give every step location a close-up map if you can.
//   drive: "<Google Drive id>"   e.g. MewMaps dungeon maps
//   bulba: "File name.png"       Bulbapedia image archive (the location infobox's image=); "{X|Y}" per version
//   url: "https://…"             any other image
//   file: "x.jpg"                stored in maps/ (+ maps/sm/ ~1600px preview)
// Optional locs: ["Other place", …] — extra place names this map covers. Any step whose `loc` is the
// map's name (or one of its locs) gets a button for it, and those names in step text become links to it.
const MAPS = {
  // "terminus-cave": { name: "Terminus Cave", drive: "1AbC…", locs: ["Route 18 cave"] },
  // "lumiose-city": { name: "Lumiose City", bulba: "Lumiose City XY.png" },
};

const LEGENDS = [
  // {
  //   id: "xerneas", name: "Xerneas", dex: 716, lvl: 50, types: ["Fairy"],
  //   ver: "both" | "<versionId>",   // which version can catch it
  //   native: "<versionId>",         // optional: version that unlocks it natively
  //   other: "How the other version gets it",  // shown when native !== current version
  //   phase: "story" | "post",
  //   where: "Team Flare Secret HQ", step: "<step id of the encounter>",
  //   requires: "Optional prerequisite text",
  //   hit: "Poison, Steel", avoid: "", note: "",
  // },
];

const NOT_IN_GAME = [
  // ["Mew", "Event only"],
];

const CHAPTERS = [
  {
    id: "ch1", part: "Part 1", title: "Chapter title",
    areas: "Town · Route · Gym",
    badge: "",            // optional chip, e.g. "Bug Badge (#1)"
    postgame: false,      // true → listed under "Post-game"
    intro: "",            // optional paragraph under the chapter header
    steps: [
      { id: "ch1-start", type: "story", loc: "Town", title: "Do the thing",
        text: "Short, direct instruction. <b>HTML</b> allowed.",
        callout: "",      // optional ★ highlight box
        map: "",          // optional key into MAPS, or a list of keys (the first one gets mapPin)
        mapPin: null,     // optional [x%, y%] on that map, or { v1: [x, y], v2: [x, y] } per version
        mapLabel: "",     // caption for the pin
      },
      // { id: "ch1-gym", type: "boss", loc: "Town", title: "Gym: Leader",
      //   boss: { who: "Gym Leader X", rival: false, team: [["Pokémon", 12, "Bug"]], use: "Fire, Flying, Rock.", reward: "Badge + TM" },
      //   after: "Text shown below the team." },
      // { id: "ch1-legend", type: "legend", legend: "xerneas", loc: "Place", title: "Xerneas (Lv50)",
      //   text: "How to reach it.", tactic: "How to catch it." },
    ],
  },
];

window.GAME = {
  id: "template",
  title: "Game Route",
  tagline: "",
  versions: [
    { id: "v1", label: "Version 1", mode: "dark",  accent: "#33c3f0", accent2: "#1b8fd1", ink: "#04121a" },
    { id: "v2", label: "Version 2", mode: "light", accent: "#e8462f", accent2: "#c0321d", ink: "#ffffff" },
  ],
  sprites: "assets/sprites/gen6",          // folder of <dex>.png / <dex>.gif
  regionMaps: { v1: { file: "region.jpg" }, v2: { file: "region.jpg" } }, // or { drive: id }, or null
  regionName: "Region",
  pins: PINS,
  maps: MAPS,
  starter: null,  // or { label, options: [[id, label]], slots: { id: { slotName: [name, types, item] } } }
  legends: LEGENDS,
  notInGame: NOT_IN_GAME,
  catchKit: [],
  postgameBanner: "🏆 Post-game",
  chapters: CHAPTERS,
  sources: [],    // [["Label", "https://…"]]
};
})();
