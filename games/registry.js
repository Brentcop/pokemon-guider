/* =========================================================================
   Game registry: one entry per guide. The home page lists these, and
   guide.html?game=<id> loads games/<id>/data.js.

   status: "ready"   → has a data.js and shows up as playable
           "planned" → listed as "coming soon", no link
   art:    cover legendaries for the home page (local sprite files, so offline works); planned
           games show them as silhouettes

   To add a game: copy games/_template/ to games/<id>/, fill in data.js,
   then set status to "ready" here. See README.md → "Adding a game".
   ========================================================================= */
window.GAMES = [
  {
    id: "b2w2", status: "ready", gen: 5, region: "Unova",
    title: "Black 2 & White 2",
    blurb: "Full story (Parts 1–15), then every catchable legendary.",
    colors: ["#1b1f27", "#33c3f0", "#e8462f"],
    art: ["assets/sprites/gen5/644.gif", "assets/sprites/gen5/646.gif", "assets/sprites/gen5/643.gif"],
  },
  {
    id: "xy", status: "ready", gen: 6, region: "Kalos",
    title: "X & Y", playing: "Y",
    blurb: "Full story (Parts 1–15), then every catchable legendary.",
    colors: ["#1c3a6e", "#2f6fd6", "#d6334a"],
    art: ["assets/sprites/gen6/716.gif", "assets/sprites/gen6/717.gif"],
  },
  {
    id: "oras", status: "planned", gen: 6, region: "Hoenn",
    title: "Omega Ruby & Alpha Sapphire", playing: "Omega Ruby",
    blurb: "Story route + legendary hunt.",
    colors: ["#5a1414", "#d33b2c", "#2d6fd0"],
    art: ["assets/sprites/cover/383.png", "assets/sprites/cover/382.png"],
  },
  {
    id: "sm", status: "planned", gen: 7, region: "Alola",
    title: "Sun & Moon", playing: "Sun",
    blurb: "Story route + legendary hunt.",
    colors: ["#4a2a06", "#f29a1f", "#6a5ad6"],
    art: ["assets/sprites/cover/791.png", "assets/sprites/cover/792.png"],
  },
  {
    id: "usum", status: "planned", gen: 7, region: "Alola",
    title: "Ultra Sun & Ultra Moon", playing: "Ultra Sun",
    blurb: "Story route + legendary hunt.",
    colors: ["#3d1a05", "#f07a1a", "#7a4fe0"],
    art: ["assets/sprites/cover/800.png"],
  },
];
