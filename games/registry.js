/* =========================================================================
   Game registry: one entry per guide. The home page lists these, and
   guide.html?game=<id> loads games/<id>/data.js.

   status: "ready"   → has a data.js and shows up as playable
           "planned" → listed as "coming soon", no link

   To add a game: copy games/_template/ to games/<id>/, fill in data.js,
   then set status to "ready" here. See README.md → "Adding a game".
   ========================================================================= */
window.GAMES = [
  {
    id: "b2w2", status: "ready", gen: 5, region: "Unova",
    title: "Black 2 & White 2",
    blurb: "Part 10 → Champion, then every catchable legendary.",
    colors: ["#1b1f27", "#33c3f0", "#e8462f"],
  },
  {
    id: "xy", status: "planned", gen: 6, region: "Kalos",
    title: "X & Y", playing: "Y",
    blurb: "Story route + legendary hunt.",
    colors: ["#1c3a6e", "#2f6fd6", "#d6334a"],
  },
  {
    id: "oras", status: "planned", gen: 6, region: "Hoenn",
    title: "Omega Ruby & Alpha Sapphire", playing: "Omega Ruby",
    blurb: "Story route + legendary hunt.",
    colors: ["#5a1414", "#d33b2c", "#2d6fd0"],
  },
  {
    id: "sm", status: "planned", gen: 7, region: "Alola",
    title: "Sun & Moon", playing: "Sun",
    blurb: "Story route + legendary hunt.",
    colors: ["#4a2a06", "#f29a1f", "#6a5ad6"],
  },
  {
    id: "usum", status: "planned", gen: 7, region: "Alola",
    title: "Ultra Sun & Ultra Moon", playing: "Ultra Sun",
    blurb: "Story route + legendary hunt.",
    colors: ["#3d1a05", "#f07a1a", "#7a4fe0"],
  },
];
