/* =========================================================================
   Pokémon Black 2 / White 2 — Streamlined Route (Part 10 → Legendaries)
   Story content condensed from Bulbapedia's B2W2 walkthrough (Parts 10–22).
   Maps from mewmaps.org. Personal reference only.

   Step types:
     story  – required to advance the main story
     boss   – required battle (Gym Leader, rival, Team Plasma, League)
     legend – a legendary Pokémon you can catch here
     key    – a key item or action needed for a legendary
     prep   – catch prep / shopping (strongly recommended)
     heal   – free healing spot
     tip    – minor helpful extra (hidden unless "Show extras" is on)
   Version-specific text uses {b2|w2} placeholders, swapped at render time.
   ========================================================================= */
(() => {
"use strict";


// Region-map pin coordinates (percent of map width/height)
const PINS = {
  "Mistralton City": [20.0, 43.7],
  "Route 7": [20.4, 38.5],
  "Celestial Tower": [15.4, 29.5],
  "Twist Mountain": [25.4, 33.8],
  "Lentimas Town": [74.6, 45.8],
  "Strange House": [76.5, 50.0],
  "Reversal Mountain": [78.8, 47.3],
  "Undella Town": [90.0, 52.5],
  "Route 13": [78.0, 42.1],
  "Lacunosa Town": [78.8, 33.8],
  "Route 12": [73.8, 38.5],
  "Village Bridge": [64.2, 36.4],
  "Route 11": [55.8, 38.7],
  "Opelucid City": [45.0, 30.2],
  "Route 9": [45.0, 34.0],
  "Marine Tube": [98.0, 41.6],
  "Humilau City": [92.5, 33.3],
  "Route 22": [86.7, 27.3],
  "Route 21": [95.0, 38.7],
  "Seaside Cave": [86.3, 43.2],
  "Giant Chasm": [81.3, 27.1],
  "Route 23": [72.1, 27.3],
  "Victory Road": [70.0, 20.3],
  "Pokémon League": [66.3, 14.0],
  "N's Castle": [66.3, 17.5],
  "Aspertia City": [7.9, 82.2],
  "Route 20": [21.7, 71.8],
  "Cave of Being": [17.5, 82.2],
  "Driftveil City": [30.8, 62.4],
  "Clay Tunnel": [28.3, 58.3],
  "Icirrus City": [30.4, 40.1],
  "Route 8": [35.8, 33.8],
  "Tubeline Bridge": [40.8, 38.0],
  "Dragonspiral Tower": [32.1, 26.0],
  "Route 14": [87.5, 56.2],
  "Abundant Shrine": [67.9, 52.5],
  "Black City / White Forest": [79.2, 61.9],
  "Route 15": [73.3, 62.4],
  "Marvelous Bridge": [65.4, 58.8],
  "Castelia City": [58.3, 79.1],
  "Skyarrow Bridge": [65.8, 77.0],
  "Nacrene City": [74.2, 67.6],
  "Striaton City": [90.4, 65.6],
  "Dreamyard": [94.6, 68.7],
  "Route 1": [98.3, 83.2],
  "Route 17": [82.5, 89.5],
  "Route 18": [74.2, 89.5],
};

// Location maps from mewmaps.org, loaded straight from MewMaps' public Google Drive files (not rehosted).
const MAPS = {
  "celestial-tower": { name: "Celestial Tower", drive: "1kRI8-7nPqdSD7SZS-ZnRdPWKmJ4S_hMR" },
  "reversal-mountain": { name: "Reversal Mountain", drive: "1HgamUJfjx8_QPj8z5zMnqaR0FA7GSOQJ" },
  "giant-chasm": { name: "Giant Chasm", drive: "1-c7QeRPPfoe6LsxbSicIOZFkraLgmNse" },
  "victory-road": { name: "Victory Road", drive: "10AUvP93VpTMOO4QY1WA7L-5TcLbfnseO" },
  "cave-of-being": { name: "Cave of Being", drive: "1d0FrYfUiozUwdid_TaZSvAkBt5fQrHlG" },
  "clay-tunnel": { name: "Clay Tunnel", drive: "13usfK6nS1KNKWdTA1WQJleQ_f7iZ-9no" },
  "underground-ruins": { name: "Underground Ruins", drive: "1T9HCf6zIBnXhiFRF6OzeoR5HrF81hxEm" },
  "twist-mountain": { name: "Twist Mountain", drive: "1gHQ6oyq9AeZxpVtIEmWVt7h8YNuO8Z5W" },
  "dragonspiral-tower": { name: "Dragonspiral Tower", drive: "1u2oOsiIZG_DzTvghtXEuFqBZ050gHXhZ" },
  "dreamyard": { name: "Dreamyard", drive: "1VH6MSwb5S2wWVM8uTfrNehJh-S9ZYdW6" },
  "route-17-18-p2-lab": { name: "Routes 17 & 18 / P2 Lab", drive: "16N3eJcx325_iT5ADrgLfM8JiXy0TVZtA" },
};

/* ---------------------------------------------------------------------------
   Legendaries obtainable in-game (no events, no Dream Radar).
   ver: "both" | "b2" | "w2"
--------------------------------------------------------------------------- */
const LEGENDS = [
  { id: "cobalion",  name: "Cobalion",  dex: 638, lvl: 45, types: ["Steel", "Fighting"], ver: "both", phase: "story",
    where: "Route 13", step: "p12-cobalion",
    hit: "Fire, Fighting, Ground", avoid: "Dark moves (Justified boosts its Attack)",
    note: "If you KO it, it comes back at Lv65 after the Hall of Fame." },
  { id: "virizion",  name: "Virizion",  dex: 640, lvl: 45, types: ["Grass", "Fighting"], ver: "both", phase: "story",
    where: "Route 11", step: "p12-virizion",
    hit: "Flying (4×), Fire, Ice, Psychic", avoid: "Dark moves (Justified)",
    note: "If you KO it, it comes back at Lv65 after the Hall of Fame." },
  { id: "terrakion", name: "Terrakion", dex: 639, lvl: 45, types: ["Rock", "Fighting"], ver: "both", phase: "story",
    where: "Route 22", step: "p13-terrakion",
    hit: "Grass, Water, Ground, Fighting, Psychic, Steel", avoid: "Dark moves (Justified)",
    note: "If you KO it, it comes back after the Hall of Fame." },
  { id: "mesprit",   name: "Mesprit",   dex: 481, lvl: 65, types: ["Psychic"], ver: "both", phase: "post",
    where: "Celestial Tower roof", step: "pg-mesprit", requires: "Visit Cave of Being first",
    hit: "Bug, Ghost, Dark", avoid: "" },
  { id: "regirock",  name: "Regirock",  dex: 377, lvl: 65, types: ["Rock"], ver: "both", phase: "post",
    where: "Underground Ruins (via Clay Tunnel)", step: "pg-regirock",
    hit: "Water, Grass, Fighting, Ground, Steel", avoid: "" },
  { id: "registeel", name: "Registeel", dex: 379, lvl: 65, types: ["Steel"], ver: "both", native: "b2", phase: "post",
    where: "Underground Ruins — Iron Chamber", step: "pg-regikey", requires: "{Catch Regirock → Iron Key|Iron Key from a Black 2 game}",
    hit: "Fire, Fighting, Ground", avoid: "",
    other: "White 2 can't unlock this by itself. Get the Iron Key from a Black 2 game over Unova Link, or trade for Registeel." },
  { id: "regice",    name: "Regice",    dex: 378, lvl: 65, types: ["Ice"], ver: "both", native: "w2", phase: "post",
    where: "Underground Ruins — Iceberg Chamber", step: "pg-regikey", requires: "{Iceberg Key from a White 2 game|Catch Regirock → Iceberg Key}",
    hit: "Fire, Fighting, Rock, Steel", avoid: "",
    other: "Black 2 can't unlock this by itself. Get the Iceberg Key from a White 2 game over Unova Link, or trade for Regice." },
  { id: "regigigas", name: "Regigigas", dex: 486, lvl: 68, types: ["Normal"], ver: "both", phase: "post",
    where: "Twist Mountain (hidden north chamber)", step: "pg-regigigas", requires: "Regirock + Regice + Registeel in party",
    hit: "Fighting", avoid: "",
    note: "Slow Start halves its Attack/Speed for 5 turns — best window to catch." },
  { id: "azelf",     name: "Azelf",     dex: 482, lvl: 65, types: ["Psychic"], ver: "both", phase: "post",
    where: "Route 23 (west forest)", step: "pg-azelf", requires: "Visit Cave of Being first",
    hit: "Bug, Ghost, Dark", avoid: "" },
  { id: "zekrom",    name: "Zekrom",    dex: 644, lvl: 70, types: ["Dragon", "Electric"], ver: "b2", phase: "post",
    where: "Dragonspiral Tower 7F", step: "pg-dragon", requires: "Beat N at N's Castle → Dark Stone",
    hit: "Ground, Ice, Dragon", avoid: "" },
  { id: "reshiram",  name: "Reshiram",  dex: 643, lvl: 70, types: ["Dragon", "Fire"], ver: "w2", phase: "post",
    where: "Dragonspiral Tower 7F", step: "pg-dragon", requires: "Beat N at N's Castle → Light Stone",
    hit: "Ground, Rock, Dragon", avoid: "" },
  { id: "kyurem",    name: "Kyurem",    dex: 646, lvl: 70, types: ["Dragon", "Ice"], ver: "both", phase: "post",
    where: "Giant Chasm (inner cave)", step: "pg-kyurem", requires: "Catch {Zekrom|Reshiram} first",
    hit: "Fighting, Rock, Steel, Dragon", avoid: "",
    note: "Hardest catch in the game — the best Master Ball target. Drops the DNA Splicers." },
  { id: "cresselia", name: "Cresselia", dex: 488, lvl: 68, types: ["Psychic"], ver: "both", phase: "post",
    where: "Marvelous Bridge", step: "pg-cresselia", requires: "Lunar Wing (Strange House)",
    hit: "Bug, Ghost, Dark", avoid: "" },
  { id: "uxie",      name: "Uxie",      dex: 480, lvl: 65, types: ["Psychic"], ver: "both", phase: "post",
    where: "Nacrene City (outside the Museum)", step: "pg-uxie", requires: "Visit Cave of Being first",
    hit: "Bug, Ghost, Dark", avoid: "" },
  { id: "latios",    name: "Latios",    dex: 381, lvl: 68, types: ["Dragon", "Psychic"], ver: "b2", phase: "post",
    where: "Dreamyard (east of Striaton)", step: "pg-lati",
    hit: "Dragon, Ice, Bug, Ghost, Dark", avoid: "Strong Dark moves (it's frail to them — don't KO it)" },
  { id: "latias",    name: "Latias",    dex: 380, lvl: 68, types: ["Dragon", "Psychic"], ver: "w2", phase: "post",
    where: "Dreamyard (east of Striaton)", step: "pg-lati",
    hit: "Dragon, Ice, Bug, Ghost, Dark", avoid: "Strong Dark moves (it's frail to them — don't KO it)" },
  { id: "heatran",   name: "Heatran",   dex: 485, lvl: 68, types: ["Fire", "Steel"], ver: "both", phase: "post",
    where: "Reversal Mountain B1F", step: "pg-heatran", requires: "Magma Stone (Route 18)",
    hit: "Ground (4×), Water, Fighting", avoid: "" },
];

const NOT_IN_GAME = [
  ["Tornadus / Thundurus / Landorus", "Pokémon Dream Radar (3DS app) only"],
  ["The other version's dragon & Lati", "Trade with the other version"],
  ["Victini, Keldeo, Meloetta, Genesect", "Event distributions only"],
];

/* ---------------------------------------------------------------------------
   Chapters & steps
--------------------------------------------------------------------------- */
const CHAPTERS = [
  /* ============================ PART 10 ============================ */
  {
    id: "p10", part: "Part 10", title: "Skyla & the Celestial Tower",
    areas: "Mistralton City · Route 7 · Celestial Tower · Mistralton Gym",
    badge: "Jet Badge (#6)",
    steps: [
      { id: "p10-master", type: "key", loc: "Mistralton City", title: "Get the Master Ball from Professor Juniper",
        text: "Walk north past the Pokémon Center. Juniper stops you and hands over a <b>Master Ball</b>. Skyla shows up, then Juniper heads off to Celestial Tower.",
        callout: "Hold onto it. <b>Kyurem</b> (post-game) is the best use for it." },
      { id: "p10-route7", type: "story", loc: "Route 7", title: "Head north up Route 7 to Celestial Tower",
        text: "Use the raised walkways to skip most of the tall grass." },
      { id: "p10-tower", mapPin: [73.8, 61.3], mapLabel: "The bell (roof)", type: "story", loc: "Celestial Tower", map: "celestial-tower", title: "Climb Celestial Tower and ring the bell",
        text: "Juniper is on 1F and gives you a <b>Lucky Egg</b>. Climb all five floors to the roof and ring the bell.",
        callout: "You come back here after the Hall of Fame to catch <b>Mesprit</b> at the foot of the bell platform." },
      { id: "p10-heal", type: "heal", loc: "Celestial Tower", title: "Nurse Dixie on 3F heals your party after you beat her",
        text: "Wild Litwick can burn you with Flame Body. Use her as a free Pokémon Center." },
      { id: "p10-twist", type: "tip", loc: "Twist Mountain", title: "Twist Mountain is blocked, so skip it",
        text: "Marshal blocks the entrance at the northeast end of Route 7. There's nothing to do here yet." },
      { id: "p10-gym", type: "boss", loc: "Mistralton City", title: "Mistralton Gym: Skyla",
        text: "The turbines blow you back to the entrance. Move while the wind is off and duck behind the walls when it starts.",
        boss: { who: "Gym Leader Skyla", team: [["Swoobat", 37, "Psychic/Flying"], ["Skarmory", 37, "Steel/Flying"], ["Swanna", 39, "Water/Flying", "Sitrus Berry"]],
          use: "Electric hits all three (4× on Swanna). Rock also works on Swoobat and Swanna. Use Fire or Electric on Skarmory.", reward: "Jet Badge + TM62 Acrobatics" } },
      { id: "p10-cargo", type: "story", loc: "Mistralton City", title: "Go to the Cargo Service building and talk to Skyla",
        text: "Juniper meets you outside the Gym. Go into Cargo Service and talk to Skyla. Bianca joins, and Skyla flies the group to <b>Lentimas Town</b>." },
    ],
  },

  /* ============================ PART 11 ============================ */
  {
    id: "p11", part: "Part 11", title: "Lunar Wing & Reversal Mountain",
    areas: "Lentimas Town · Strange House · Reversal Mountain · Undella Town",
    steps: [
      { id: "p11-lentimas", type: "story", loc: "Lentimas Town", title: "Listen to Juniper in Lentimas Town",
        text: "She sends you to Opelucid City to ask Drayden about the legendary dragons. To get there, head east through Reversal Mountain." },
      { id: "p11-tutor", type: "tip", loc: "Lentimas Town", title: "Move Tutor (pays in Blue Shards): Icy Wind / Dragon Pulse",
        text: "Lives in the west house. Ice and Dragon moves are good against Drayden, two gyms from now." },
      { id: "p11-lunar", type: "key", loc: "Strange House", title: "Get the Lunar Wing from the Strange House (needed for Cresselia)",
        text: "The Strange House is hidden in the canyon east of Lentimas. Furniture blocks most paths, so follow this loop:" +
          "<ol><li>Entrance hall: go <b>left</b>, take the stairs <b>down</b> to B1F.</li>" +
          "<li>B1F: take the <b>east</b> stairs back up.</li>" +
          "<li>Climb to the upper level, go west, loop around to the lower-west room, take the <b>west</b> stairs down.</li>" +
          "<li>B1F: follow the new path east and go back up.</li>" +
          "<li>Take the <b>east</b> staircase, then the <b>center</b> staircase. The room at the top has the <b>Lunar Wing</b>.</li></ol>",
        callout: "Nothing in the story needs this, but you can't get <b>Cresselia</b> without it. You're right next to it now." },
      { id: "p11-reversal", mapPin: { b2: [48.1, 28.7], w2: [48.1, 76.4] }, mapLabel: "Exit to Undella Town", type: "story", loc: "Reversal Mountain", map: "reversal-mountain", title: "Cross Reversal Mountain with Bianca",
        text: "Bianca tags along and heals you between battles. The exit is the <b>Undella chamber</b> at the far east end of the main chamber." +
          "{<p><b>Black 2:</b> Main chamber → south → exit southwest to the mountainside and come back in. Head east past the stairway Bianca wants to check. Keep east past Ace Trainers Ray & Cora and the Scientist, then exit east.</p>|<p><b>White 2:</b> Main chamber → south to Battle Girl Chan → out the southwest exit and back in. Head east past the stairway Bianca wants to check. Go down near Black Belt Corey, then make your way east past Ace Trainers Ray & Cora and the Scientist, then exit east.</p>}",
        callout: "Bianca's \"Heatran chamber\" on B1F is where <b>Heatran</b> appears post-game, once you have the Magma Stone." },
      { id: "p11-falseswipe", type: "tip", loc: "Reversal Mountain", title: "TM54 False Swipe (Scientist, needs a full Habitat List)",
        text: "The Scientist east of Ace Trainers Ray & Cora gives you False Swipe if you've seen every Pokémon on the local Habitat List. It leaves targets at 1 HP, which makes legendaries much easier to catch." },
      { id: "p11-hugh", type: "boss", loc: "Undella Town", title: "Rival battle: Hugh at the Undella gate",
        text: "Hugh catches you as you walk toward the north gate.",
        boss: { who: "Rival Hugh", rival: true, team: [["Unfezant", 39, "Normal/Flying", "Scope Lens"], ["$monkey", 39], ["$ace", 41]],
          use: "Electric, Rock, or Ice for Unfezant. For the other two, use whatever beats his starter.", reward: "" } },
    ],
  },

  /* ============================ PART 12 ============================ */
  {
    id: "p12", part: "Part 12", title: "Two Swords of Justice",
    areas: "Route 13 · Lacunosa Town · Route 12 · Village Bridge · Route 11",
    steps: [
      { id: "p12-prep", type: "prep", loc: "Undella Town", title: "Stock up on balls before Route 13",
        text: "You're about to meet two Lv45 legendaries with very low catch rates. Bring <b>15+ Ultra Balls</b>, plus Quick, Timer, or Dusk Balls if you have them. <b>Dusk Balls work at night outdoors too.</b> Bring something that can <b>Sleep or Paralyze</b>, and <b>False Swipe</b> if you have it.<br>" +
              "Save before each fight. If you KO one by accident, reload, or catch it at Lv65 after the Hall of Fame." },
      { id: "p12-cobalion", type: "legend", legend: "cobalion", loc: "Route 13", title: "Cobalion: Route 13 clearing (Lv45)",
        text: "Head north along the beach. Climb the stairway into the forest and walk toward the Cut trees. Cobalion is waiting in the clearing.",
        tactic: "Open with Fire, Fighting, or Ground. Finish off with neutral moves. Never use Dark moves." },
      { id: "p12-lacunosa", type: "story", loc: "Lacunosa Town", title: "Lacunosa Town: hear the Giant Chasm legend",
        text: "Juniper and Bianca take you to an old woman on the north side of town. She tells the story of the monster from the Giant Chasm (Kyurem)." },
      { id: "p12-zinzolin", type: "boss", loc: "Lacunosa Town", title: "Tag battle: you + Hugh vs. Zinzolin + Grunt",
        text: "Head west from the Pokémon Center. Zinzolin and a Grunt show up, and Hugh asks you to team up.",
        boss: { who: "Zinzolin & Plasma Grunt (double)", team: [["Cryogonal", 42, "Ice"], ["Sneasel", 44, "Dark/Ice"], ["Golbat", 39, "Poison/Flying"], ["Garbodor", 39, "Poison"]],
          use: "Fire, Fighting, Rock, or Steel for the Ice types. Psychic or Ground for Garbodor.", reward: "" } },
      { id: "p12-route12", type: "story", loc: "Route 12", title: "West through Route 12 and Village Bridge",
        text: "This is a short route." },
      { id: "p12-heal", type: "heal", loc: "Village Bridge", title: "Village Bridge: the woman in the easternmost house heals you",
        text: "There's no Pokémon Center nearby. Heal here before Virizion." },
      { id: "p12-virizion", type: "legend", legend: "virizion", loc: "Route 11", title: "Virizion: west end of Route 11 (Lv45)",
        text: "Walk to the west side of Route 11 and Virizion jumps down from the cliff.",
        tactic: "Flying hits it 4×. Fire, Ice, and Psychic are also strong. Never use Dark moves." },
      { id: "p12-opelucid", type: "story", loc: "Route 11", title: "Keep west to Opelucid City", text: "" },
    ],
  },

  /* ============================ PART 13 ============================ */
  {
    id: "p13", part: "Part 13", title: "Drayden, Marlon & Terrakion",
    areas: "Opelucid City · Route 9 · Opelucid Gym · Marine Tube · Humilau City · Route 22",
    badge: "Legend Badge (#7) · Wave Badge (#8)",
    steps: [
      { id: "p13-iris", type: "story", loc: "Opelucid City", title: "Iris greets you and points you to the Gym", text: "" },
      { id: "p13-mall", type: "prep", loc: "Route 9", title: "Shopping Mall Nine (Route 9): buy your legendary ball stock here",
        text: "This mall has the best ball selection in the game: <b>Ultra, Dusk, Timer, Quick, Repeat</b>. Buy lots of <b>Dusk Balls</b>, since most post-game legendaries are in caves. Buy Timer Balls for long fights." },
      { id: "p13-gym", type: "boss", loc: "Opelucid City", title: "Opelucid Gym: Drayden",
        text: "Beat Veteran Lucius to raise the first dragon statue. Then beat <b>one</b> Trainer on each of the next two levels. The statues butt heads and open a path to Drayden.",
        boss: { who: "Gym Leader Drayden", team: [["Druddigon", 46, "Dragon"], ["Flygon", 46, "Ground/Dragon"], ["Haxorus", 48, "Dragon", "Sitrus Berry"]],
          use: "<b>Ice</b> (4× on Flygon) and Dragon. Grass, Fire, Water, and Electric are all resisted. KO Haxorus before Dragon Dance snowballs.", reward: "Legend Badge + TM82 Dragon Tail" } },
      { id: "p13-attack", type: "story", loc: "Opelucid City", title: "Team Plasma freezes the city: beat 3 Grunts",
        text: "After Drayden's story, the Plasma Frigate attacks. Slide across the ice and beat the three Grunts:" +
          "<ol><li>Just east of the Pokémon Center</li><li>North, outside the old Battle House</li><li>South of the Gym</li></ol>Then go back to the Gym." },
      { id: "p13-zinzolin", type: "boss", loc: "Opelucid City", title: "Zinzolin at the Gym",
        text: "",
        boss: { who: "Zinzolin", team: [["Cryogonal", 46, "Ice"], ["Cryogonal", 46, "Ice"], ["Weavile", 48, "Dark/Ice"]],
          use: "Fire and Fighting. Fighting is 4× on Weavile.", reward: "" } },
      { id: "p13-shadow", type: "boss", loc: "Route 11", title: "Shadow Triad member at the Route 11 gate",
        text: "A Shadow steals the DNA Splicers. One of them waits south near the Route 11 gate.",
        boss: { who: "Shadow Triad", team: [["Pawniard", 46, "Dark/Steel"], ["Pawniard", 46, "Dark/Steel"], ["Absol", 48, "Dark"]],
          use: "<b>Fighting</b> (4× on Pawniard).", reward: "" } },
      { id: "p13-tube", type: "story", loc: "Marine Tube", title: "Fly back to Undella Town and take the Marine Tube to Humilau City",
        text: "Cheren says Team Plasma is near Humilau." },
      { id: "p13-marlon", type: "story", loc: "Humilau City", title: "Meet Hugh, then walk north until Marlon jumps onto the pier",
        text: "After that, Marlon goes back to his Gym." },
      { id: "p13-gym2", type: "boss", loc: "Humilau City", title: "Humilau Gym: Marlon",
        text: "Stepping on a lily pad slides it until it hits something. Ride the pads <b>clockwise</b> from dock to dock: SW dock → east → south → around the east wall → NW dock. Do the clockwise loop again to reach Marlon. You only need to fight the Ace Trainers in your way.",
        boss: { who: "Gym Leader Marlon", team: [["Carracosta", 49, "Water/Rock"], ["Wailord", 49, "Water"], ["Jellicent", 51, "Water/Ghost", "Sitrus Berry"]],
          use: "<b>Grass</b> (4× on Carracosta) and Electric. All three know Scald (burns). Carracosta has Sturdy and Shell Smash.", reward: "Wave Badge + TM55 Scald" } },
      { id: "p13-prep", type: "prep", loc: "Humilau City", title: "Restock Ultra Balls: Terrakion is next door", text: "" },
      { id: "p13-terrakion", type: "legend", legend: "terrakion", loc: "Route 22", title: "Terrakion: center of Route 22 (Lv45)",
        text: "As you walk up, Colress cuts in and gives you the <b>Colress MCHN</b>. Then you can fight Terrakion.",
        tactic: "Water, Grass, Fighting, Ground, Psychic, and Steel all do 2×. Never use Dark moves." },
      { id: "p13-boulder", type: "story", loc: "Route 22", title: "Push the Strength boulder southeast to make a shortcut, then go back to Humilau",
        text: "Grunts block the Giant Chasm for now. Colress tells you to check <b>Seaside Cave</b> on Route 21." },
    ],
  },

  /* ============================ PART 14 ============================ */
  {
    id: "p14", part: "Part 14", title: "The Plasma Frigate & Giant Chasm",
    areas: "Route 21 · Seaside Cave · Plasma Frigate · Giant Chasm",
    steps: [
      { id: "p14-seaside", type: "story", loc: "Seaside Cave", title: "Seaside Cave: use the Colress MCHN on the odd boulder",
        text: "Surf south down Route 21 to the cave (you need Surf and Strength)." +
          "<ol><li>1F: go south over the ledges, jump the northern ledge, head east, go down the stairs to the water, Surf north, then go down to B1F.</li>" +
          "<li>B1F: push the boulder into the hole. On the big platform, push the boulders into place with Strength, then go northwest back to 1F.</li>" +
          "<li>1F: jump the lower ledge, climb the opposite stairs, and use the <b>Colress MCHN</b> on the boulder blocking the east exit. It's a <b>Crustle</b>, so battle it.</li></ol>" },
      { id: "p14-board", type: "story", loc: "Route 21", title: "Board the Plasma Frigate with Hugh",
        text: "Marlon lowers the gangplank. Beat a Grunt at the top, then follow Hugh in through the North Entrance. Inside, the two of you tag-battle two Grunts." },
      { id: "p14-barrier", type: "story", loc: "Route 21", title: "Shut off the electric barrier on B1F",
        text: "{<b>Black 2: four switches.</b> The warp panels in the six rooms around the stairwell take you back to switches in the North Entrance. Find and flip all four, then take the teleporter.|<b>White 2: password.</b> Get the <b>Plasma Card</b> from the female Grunt in the dining hall (west/southwest room). Talk to Grunts to collect the 5 clues; the password is different every playthrough. Enter it at the barrier, then take the teleporter.}<br>The bed in the {northeast|east} room heals your party." },
      { id: "p14-command", type: "boss", loc: "Route 21", title: "Command Center: Zinzolin + Grunt (tag battle with Hugh)",
        text: "Zinzolin shows off Kyurem, which is powering the ship.",
        boss: { who: "Zinzolin & Grunt (multi)", team: [["Cryogonal", 48, "Ice"], ["Cryogonal", 48, "Ice"], ["Weavile", 50, "Dark/Ice"], ["Liepard", 45, "Dark"], ["Watchog", 45, "Normal"], ["Scolipede", 45, "Bug/Poison"]],
          use: "Fighting covers nearly everything. Use Psychic, Fire, or Flying on Scolipede.", reward: "" } },
      { id: "p14-chasm", mapPin: [35.0, 15.9], mapLabel: "Entrance from Route 22", type: "story", loc: "Giant Chasm", map: "giant-chasm", title: "Fly to Humilau, take the Route 22 shortcut, enter the Giant Chasm",
        text: "Go south from the entrance. Hugh and a former Plasma spy drive off the Grunts. Move the boulder with Strength, then go southwest and jump the ledge into the <b>Crater Forest</b>." },
      { id: "p14-rood", map: "giant-chasm", mapPin: [56.7, 55.6], mapLabel: "Crater Forest", type: "boss", loc: "Giant Chasm", title: "Crater Forest: tag battle with Hugh",
        text: "Rood's old Plasma group is arguing with the new one. You and Hugh battle the Grunts. Afterward Rood gives you <b>3 Max Revives</b>. Climb the ice mound into the ship.",
        boss: null },
      { id: "p14-frigate", type: "story", loc: "Giant Chasm", title: "Frigate, round 2: South Entrance → B2F",
        text: "Beat the two Grunts in the South Entrance, then take the teleporter. On B2F, Rood's spy explains the room." +
          "{<br><b>Black 2: password.</b> Get the Plasma Card from the female Grunt on the north side of the pipe maze, collect the 5 clues, and enter the password.|<br><b>White 2: switches.</b> Use the pipe switches to move through the maze. The warp panels on the floor below lead to the 4 red switches.}" },
      { id: "p14-zinzolin", type: "boss", loc: "Giant Chasm", title: "Zinzolin (last time) in front of Kyurem's cage",
        boss: { who: "Zinzolin", team: [["Cryogonal", 49, "Ice"], ["Cryogonal", 49, "Ice"], ["Weavile", 51, "Dark/Ice"]],
          use: "Same plan as before: Fire and Fighting.", reward: "" },
        after: "Then take the <b>right</b> warp tile to the Control Room." },
      { id: "p14-colress", type: "boss", loc: "Giant Chasm", title: "Control Room: Colress",
        boss: { who: "Colress", team: [["Magneton", 50, "Electric/Steel", "Eviolite"], ["Beheeyem", 50, "Psychic"], ["Metang", 50, "Steel/Psychic"], ["Magnezone", 50, "Electric/Steel"], ["Klinklang", 52, "Steel", "Air Balloon"]],
          use: "<b>Ground</b> (4× on the Magne line) and <b>Fire</b>. Klinklang's Air Balloon makes it immune to Ground until the balloon pops. Use Dark or Ghost on Beheeyem.", reward: "" },
        after: "Afterward, take the warp on the <b>west</b> side of Kyurem's cage." },
      { id: "p14-triad", type: "boss", loc: "Giant Chasm", title: "Ghetsis' quarters: Shadow Triad ×3",
        text: "Each Shadow only fights when you talk to it, so <b>heal between battles</b>. Afterward Hugh gets his sister's Pokémon back (it's a Liepard now).",
        boss: { who: "Shadow Triad (3 separate battles)", team: [["Pawniard", 49, "Dark/Steel"], ["Pawniard", 49, "Dark/Steel"], ["Absol / Banette / Accelgor", 51, "Dark / Ghost / Bug"]],
          use: "Fighting (4× on Pawniard). Each Shadow's last Pokémon is different: Absol, then Banette, then Accelgor. Fire handles Accelgor.", reward: "" } },
      { id: "p14-kyuremfight", map: "giant-chasm", mapPin: [87.9, 18.8], mapLabel: "Cave depths", type: "boss", loc: "Giant Chasm", title: "Inner Cave: {Black|White} Kyurem (you can't catch it, just win)",
        text: "Leave the ship and go into the cave to the north. Ghetsis fuses Kyurem with N's {Zekrom|Reshiram}. Signals from Ghetsis' cane block capture, so you have to KO it.",
        boss: { who: "{Black|White} Kyurem", team: [["Kyurem", 55, "Dragon/Ice"]],
          use: "Fighting, Rock, Steel, Dragon.", reward: "" },
        callout: "Don't worry, you catch the normal <b>Kyurem</b> here after the Hall of Fame." },
      { id: "p14-ghetsis", type: "boss", loc: "Giant Chasm", title: "Ghetsis",
        boss: { who: "Ghetsis", team: [["Cofagrigus", 50, "Ghost", "Leftovers"], ["Seismitoad", 50, "Water/Ground"], ["Eelektross", 50, "Electric"], ["Drapion", 50, "Poison/Dark"], ["Toxicroak", 50, "Poison/Fighting"], ["Hydreigon", 52, "Dark/Dragon", "Life Orb"]],
          use: "Cofagrigus: Ghost or Dark. Seismitoad: <b>Grass (4×)</b>. Eelektross has no weaknesses (Levitate), so just hit hard. Drapion: Ground. Toxicroak: <b>Psychic (4×)</b>, Flying, or Ground. Hydreigon: <b>Fighting, Ice, Dragon, or Bug</b>.", reward: "" },
        after: "Afterward, Hugh tells you that Route 23 is through the <b>west</b> side of the outer cave." },
    ],
  },

  /* ============================ PART 15 ============================ */
  {
    id: "p15", part: "Part 15", title: "Victory Road & the Pokémon League",
    areas: "Route 23 · Victory Road · Pokémon League",
    steps: [
      { id: "p15-heal", type: "heal", loc: "Route 23", title: "The Ace Trainer in the house north of the cave exit heals you",
        text: "Handy right after Ghetsis." },
      { id: "p15-route23", type: "story", loc: "Route 23", title: "Route 23: head north to Victory Road",
        text: "Follow the river valley north to the big stairway, then head <b>west</b> through the forest. Chop trees and push boulders to get through. Then go north to Victory Road.",
        callout: "<b>Azelf</b> shows up post-game on the platform near the Strength puzzle in this west forest." },
      { id: "p15-n", mapPin: [32.5, 18.0], mapLabel: "Entrance & Pokémon Center", type: "story", loc: "Victory Road", map: "victory-road", title: "N gives you HM05 Waterfall at the entrance",
        text: "Pass the Badge Check Gate. There's a Pokémon Center to the northeast. Bring Pokémon that know <b>Cut, Surf, Strength, Waterfall, and Flash</b>." },
      { id: "p15-vr", mapPin: [76.6, 64.3], mapLabel: "Exit to the Pokémon League", type: "story", loc: "Victory Road", map: "victory-road", title: "Climb Victory Road (follow the map)",
        text: "The route is different in each version, so use the map. Both versions go: Cave 1F → River Valley → Cave 2F → Mountainside → Cave 2F Back (use <b>Flash</b>) → Mountainside → Cave 3F → outside → north path." +
          "<br>A <b>Zoroark</b> guards a cave entrance on the east side. Leave it alone for now; it leads to N's Castle post-game." },
      { id: "p15-hugh", type: "boss", loc: "Victory Road", title: "Rival battle: Hugh in the final tunnel",
        text: "Past Veterans Portia and Sterling. He gives you <b>TM24 Thunderbolt</b> afterward.",
        boss: { who: "Rival Hugh", rival: true, team: [["Unfezant", 55, "Normal/Flying", "Scope Lens"], ["$monkey", 55], ["Bouffalant", 55, "Normal"], ["$ace", 57]],
          use: "Electric, Rock, or Ice for Unfezant. Fighting for Bouffalant. For the other two, use whatever beats his starter.", reward: "TM24 Thunderbolt" } },
      { id: "p15-prep", type: "prep", loc: "Pokémon League", title: "League prep: aim for the 60s and stock Full Restores and Revives",
        text: "The Elite Four can be fought in any order. You warp back to the plaza after each one." },
      { id: "p15-shauntal", type: "boss", loc: "Pokémon League", title: "Elite Four: Shauntal (left)",
        boss: { who: "Shauntal", team: [["Cofagrigus", 56, "Ghost"], ["Drifblim", 56, "Ghost/Flying"], ["Golurk", 56, "Ground/Ghost"], ["Chandelure", 58, "Ghost/Fire", "Sitrus Berry"]],
          use: "Ghost and Dark. Water also hits Golurk and Chandelure.", reward: "" } },
      { id: "p15-grimsley", type: "boss", loc: "Pokémon League", title: "Elite Four: Grimsley (center-left)",
        boss: { who: "Grimsley", team: [["Liepard", 56, "Dark"], ["Scrafty", 56, "Dark/Fighting"], ["Krookodile", 56, "Ground/Dark"], ["Bisharp", 58, "Dark/Steel", "Sitrus Berry"]],
          use: "<b>Fighting</b> works on everything (4× on Bisharp). Use Flying on Scrafty, and Water, Grass, or Ice on Krookodile.", reward: "" } },
      { id: "p15-caitlin", type: "boss", loc: "Pokémon League", title: "Elite Four: Caitlin (center-right)",
        boss: { who: "Caitlin", team: [["Musharna", 56, "Psychic"], ["Sigilyph", 56, "Psychic/Flying"], ["Reuniclus", 56, "Psychic"], ["Gothitelle", 58, "Psychic", "Sitrus Berry"]],
          use: "Bug, Ghost, Dark.", reward: "" } },
      { id: "p15-marshal", type: "boss", loc: "Pokémon League", title: "Elite Four: Marshal (right)",
        boss: { who: "Marshal", team: [["Throh", 56, "Fighting"], ["Sawk", 56, "Fighting"], ["Mienshao", 56, "Fighting"], ["Conkeldurr", 58, "Fighting", "Sitrus Berry"]],
          use: "Psychic and Flying. Sawk has Sturdy.", reward: "" } },
      { id: "p15-iris", type: "boss", loc: "Pokémon League", title: "Champion Iris",
        text: "Check the plaque on the center statue to go down, then climb to the Champion's temple.",
        boss: { who: "Champion Iris", team: [["Hydreigon", 57, "Dark/Dragon"], ["Druddigon", 57, "Dragon", "Life Orb"], ["Aggron", 57, "Steel/Rock"], ["Archeops", 57, "Rock/Flying"], ["Lapras", 57, "Water/Ice"], ["Haxorus", 59, "Dragon", "Focus Sash"]],
          use: "Ice and Dragon for the dragons. Fighting or Ground for Aggron (4× each). Electric for Lapras and Archeops. Archeops loses half its power below 50% HP.", reward: "You're the Champion!" } },
    ],
  },

  /* ============================ POST-GAME ============================ */
  {
    id: "pg1", part: "Post-game ①", title: "Lake Trio Trigger · Mesprit · The Regis",
    areas: "Aspertia City · Cave of Being · Celestial Tower · Clay Tunnel · Underground Ruins · Twist Mountain",
    postgame: true,
    intro: "This order keeps backtracking to a minimum. You wake up in Aspertia. Cedric Juniper upgrades your Pokédex to the National Dex, and the post-game opens up.",
    steps: [
      { id: "pg-being", mapPin: [50.0, 75.0], mapLabel: "Juniper, inside the cave", type: "key", loc: "Cave of Being", map: "cave-of-being", title: "Cave of Being (Route 20): trigger the Lake Trio",
        text: "Climb the <b>waterfall</b> on the south side of Route 20 (HM05 from N) and go inside. Juniper is there, and <b>Uxie, Mesprit, and Azelf</b> appear and scatter across Unova.",
        callout: "To find each one, stand on its exact spot and it reveals itself. All three are Lv65." },
      { id: "pg-mesprit", mapPin: [73.8, 72.0], mapLabel: "Foot of the bell platform", type: "legend", legend: "mesprit", loc: "Celestial Tower", map: "celestial-tower", title: "Mesprit: Celestial Tower rooftop (Lv65)",
        text: "Fly to Mistralton, go up Route 7, and climb to the roof. Stand at the <b>foot of the bell platform</b>.",
        tactic: "Bug, Ghost, Dark. It's bulky, so use status and Timer Balls." },
      { id: "pg-clay", mapPin: [93.1, 43.2], mapLabel: "Door to the Underground Ruins", type: "story", loc: "Clay Tunnel", map: "clay-tunnel", title: "Clay Tunnel (north of Driftveil): ride the mine carts to the ruins",
        text: "You need Strength and Surf. Bring <b>Dusk Balls</b>.<ol><li>Southern Cave: go east from Hiker Teppei and ride the mine cart.</li>" +
          "<li>Northern Cave: go east and take the next cart.</li><li>Southern Cave: push the boulder and talk to the Worker to ride again.</li>" +
          "<li>Eastern Cave: Worker → ride.</li><li>Northern Cave: Surf north and go through the doorway.</li><li>Eastern Cave: push the boulder and take the cart.</li>" +
          "<li>Northern Cave: go north and take the east doorway into the <b>Underground Ruins</b>.</li></ol>" },
      { id: "pg-regirock", mapPin: [16.9, 17.3], mapLabel: "Regirock", type: "legend", legend: "regirock", loc: "Clay Tunnel", map: "underground-ruins", title: "Regirock: Underground Ruins (Lv65)",
        text: "Stand on the <b>center of the eye pattern</b> in the first chamber. Take <b>6 steps south, then 9 steps east</b>, and press A on the ground to find a hidden switch. The back room becomes the Rock Peak Chamber, and Regirock is at the far end.",
        tactic: "Water, Grass, Fighting, Ground, Steel. Dusk Balls work well here." },
      { id: "pg-regikey", mapPin: { b2: [81.1, 17.0], w2: [49.8, 17.4] }, mapLabel: "{Registeel|Regice}", type: "legend", legend: "{registeel|regice}", loc: "Clay Tunnel", map: "underground-ruins", title: "{Registeel|Regice}: unlock it with the {Iron|Iceberg} Key (Lv65)",
        text: "Catching Regirock unlocks the <b>{Iron Key|Iceberg Key}</b>. Save and quit, then on the title screen open <b>Unova Link → Key System</b> and turn the key on. Come back to the ruins and the chamber is now the {Iron|Iceberg} Chamber.",
        tactic: "{Fire or Fighting first, then Ice or Grass to whittle it down.|Fire or Fighting first, then weaker neutral moves to whittle it down.}",
        callout: "Regigigas needs <b>all three</b> Regis. {Regice|Registeel} needs the {Iceberg|Iron} Key from a <b>{White 2|Black 2}</b> game (sent over Unova Link), or trade for it." },
      { id: "pg-regigigas", mapPin: [36.1, 82.0], mapLabel: "Regigigas", type: "legend", legend: "regigigas", loc: "Twist Mountain", map: "twist-mountain", title: "Regigigas: Twist Mountain hidden chamber (Lv68)",
        text: "Exit the ruins west, push the boulder, and go north into <b>Twist Mountain B1F</b>. North of the icy rock, move the boulders: <b>west one right, middle one down, east one left</b>. With <b>Regirock, Regice, and Registeel in your party</b>, check the \"statue\" and it wakes up.",
        tactic: "Slow Start halves its Attack and Speed for the first 5 turns, so catch it then. Fighting does the most damage. Use Dusk Balls." },
    ],
  },
  {
    id: "pg2", part: "Post-game ②", title: "Azelf · N's Castle · Zekrom/Reshiram · Kyurem",
    areas: "Route 23 · Victory Road · N's Castle · Dragonspiral Tower · Giant Chasm",
    postgame: true,
    steps: [
      { id: "pg-azelf", type: "legend", legend: "azelf", loc: "Route 23", title: "Azelf: Route 23 west forest (Lv65)",
        text: "Fly to the Pokémon League and walk down to Route 23. In the <b>west forest</b>, stand on the <b>platform near the Strength puzzle</b>.",
        tactic: "Bug, Ghost, Dark. It's fast and hits hard, so use a Quick Ball on turn 1 or put it to sleep." },
      { id: "pg-zoroark", mapPin: [84.4, 84.1], mapLabel: "N's Castle entrance", type: "story", loc: "Victory Road", map: "victory-road", title: "Victory Road: follow the Zoroark to N's Castle",
        text: "Go down the stairway south of the two Veterans and find the <b>Zoroark</b> from earlier. It leads you through the cave it was guarding and up a tall stairway to N's Castle." },
      { id: "pg-n", type: "boss", loc: "N's Castle", title: "N's Castle: battle N and his {Zekrom|Reshiram}",
        text: "Follow N through the castle: 1F → his old room → 2F west to the crack in the floor → throne room.",
        boss: { who: "N", team: [["{Zekrom|Reshiram}", 70, "{Dragon/Electric|Dragon/Fire}"]],
          use: "{Ground or Ice. Ground types are immune to its Electric moves.|Ground, Rock, or Dragon, and switch in a Rock type to tank its Fire moves.}", reward: "{Dark Stone|Light Stone}" } },
      { id: "pg-route-dst", type: "story", loc: "Tubeline Bridge", title: "Travel to Dragonspiral Tower",
        text: "Fly to <b>Opelucid City</b> → west through Route 9 → <b>Tubeline Bridge</b> → Route 8 → <b>Icirrus City</b> → north to the tower." },
      { id: "pg-dst-climb", mapPin: [50.0, 30.0], mapLabel: "3F ramps", type: "story", loc: "Dragonspiral Tower", map: "dragonspiral-tower", title: "Climb Dragonspiral Tower to 7F",
        text: "1F is a straight path. 2F: use broken columns as bridges. 3F: one-way ramps, take the <b>southernmost</b> ramp west to the stairs. 4F and 6F are straight paths. 5F: circle the rings to the stairs on the left. 7F: walk up the narrow path." },
      { id: "pg-dragon", mapPin: [45.0, 91.0], mapLabel: "7F (see the notes)", type: "legend", legend: "{zekrom|reshiram}", loc: "Dragonspiral Tower", map: "dragonspiral-tower", title: "{Zekrom|Reshiram}: Dragonspiral Tower 7F (Lv70)",
        text: "The {Dark|Light} Stone wakes up into {Zekrom|Reshiram}. <b>Save first.</b>",
        tactic: "{Ground, Ice, or Dragon to bring it down, then Grass or Electric to whittle. If you KO it, beat the Elite Four again to respawn it.|Ground, Rock, or Dragon to bring it down, then Grass, Fire, or Electric to whittle. If you KO it, beat the Elite Four again to respawn it.}",
        callout: "Afterward, N tells you <b>Kyurem has returned</b> to the Giant Chasm." },
      { id: "pg-kyurem", mapPin: [87.9, 18.8], mapLabel: "Kyurem, in the cave depths", type: "legend", legend: "kyurem", loc: "Giant Chasm", map: "giant-chasm", title: "Kyurem: Giant Chasm, back of the northeast cave (Lv70)",
        text: "Fly to Lacunosa and head into the Giant Chasm → Crater Forest → the cave to the <b>northeast</b> → back chamber. <b>Save before talking to it.</b>",
        tactic: "This is the hardest catch here, so use the <b>Master Ball</b>. Otherwise use Dusk and Timer Balls with Paralysis or Sleep. It's weak to Fighting, Rock, Steel, and Dragon.",
        callout: "Pick up the <b>DNA Splicers</b> afterward. They fuse Kyurem with {Zekrom|Reshiram} into {Black|White} Kyurem." },
    ],
  },
  {
    id: "pg3", part: "Post-game ③", title: "Cresselia · Uxie · {Latios|Latias} · Heatran",
    areas: "Route 14 · Marvelous Bridge · Nacrene City · Dreamyard · Route 18 · Reversal Mountain",
    postgame: true,
    steps: [
      { id: "pg-route14", type: "story", loc: "Route 14", title: "Undella Town → Route 14 → {Black City|White Forest} → Route 15",
        text: "Head south from Undella. Hugh also gives you <b>HM06 Dive</b> in Undella; you don't need it for any legendary." },
      { id: "pg-cresselia", type: "legend", legend: "cresselia", loc: "Marvelous Bridge", title: "Cresselia: Marvelous Bridge (Lv68)",
        text: "Walk under the <b>eastern archway</b>. The Lunar Wing starts to shine, you hold it up, and Cresselia swoops down. (You need the Lunar Wing from the Strange House.)",
        tactic: "Bug, Ghost, Dark. It's very bulky and doesn't hit back hard, so this one's easy with Timer Balls." },
      { id: "pg-skyarrow", type: "story", loc: "Skyarrow Bridge", title: "Fly to Castelia → Skyarrow Bridge → Pinwheel Forest → Nacrene City",
        text: "" },
      { id: "pg-uxie", type: "legend", legend: "uxie", loc: "Nacrene City", title: "Uxie: outside the Nacrene Museum (Lv65)",
        text: "Stand in the <b>center of the circular walkway</b> outside the Museum on the north side of town.",
        tactic: "Bug, Ghost, Dark. It's bulky, so bring Timer Balls." },
      { id: "pg-striaton", type: "story", loc: "Striaton City", title: "Route 3 → Striaton City",
        text: "Talk to people in the apartment building south of the Pokémon Center about a mysterious presence in the Dreamyard. You can skip this; the encounter is there either way." },
      { id: "pg-lati", mapPin: [49.5, 36.5], mapLabel: "Easternmost walkway (approx.)", type: "legend", legend: "{latios|latias}", loc: "Dreamyard", map: "dreamyard", title: "{Latios|Latias}: Dreamyard (Lv68)",
        text: "{Latios|Latias} flies past several times as you go through. Cut the tree into the old factory, go west and up the stairs, then follow the walkway to its <b>easternmost point</b>. That's where it attacks.",
        tactic: "Dragon, Ice, Bug, Ghost, Dark, but it's frail to strong Dark moves, so don't KO it. A Dark type blocks its only attack. Psycho Shift sends status back at you." },
      { id: "pg-route18", mapPin: [33.6, 44.3], mapLabel: "Magma Stone", type: "key", loc: "Route 18", map: "route-17-18-p2-lab", title: "Get the Magma Stone on Route 18",
        text: "Route 2 → Accumula Town → <b>Route 1</b> → Surf west through <b>Route 17</b> → <b>Route 18</b>. Climb the stairs, go down into the valley, then up the northeast stairway (Crasher Wake is there). Cross the next bridge to get the <b>Magma Stone</b>." },
      { id: "pg-heatran", mapPin: { b2: [66.6, 28.7], w2: [65.6, 73.5] }, mapLabel: "Heatran's chamber", type: "legend", legend: "heatran", loc: "Reversal Mountain", map: "reversal-mountain", title: "Heatran: Reversal Mountain B1F (Lv68)",
        text: "Fly to Lentimas Town and go into Reversal Mountain. Find <b>Doctor Derek</b> and take the stairway near him down to Heatran's chamber on B1F. <b>Save</b>, use the Magma Stone, then talk to Heatran.",
        tactic: "Paralyze it first. Hit it with neutral moves and keep a Water type in to take its Fire and Steel hits. Ground is 4×, so don't KO it by accident. Use Dusk Balls." },
      { id: "pg-done", type: "story", loc: "Pokémon League", title: "That's every legendary you can catch in your version.",
        text: "Optional extras: Elite Four rematches (Lv72–78), the Nature Preserve shiny Haxorus (Unova Dex completion → Permit), and more." },
    ],
  },
];

/* ---------------------------------------------------------------------------
   Game module registration — everything the shared renderer needs.
--------------------------------------------------------------------------- */
window.GAME = {
  id: "b2w2",
  title: "B2W2 Legendary Route",
  tagline: "Story path from Part 10 to every catchable legendary",
  // First entry = text before "|" in {a|b} placeholders, second = after.
  versions: [
    { id: "b2", label: "Black 2", mode: "dark",  accent: "#33c3f0", accent2: "#1b8fd1", ink: "#04121a" },
    { id: "w2", label: "White 2", mode: "light", accent: "#e8462f", accent2: "#c0321d", ink: "#ffffff" },
  ],
  sprites: "assets/sprites/gen5",           // {dex}.png static, {dex}.gif animated
  regionMaps: { b2: { drive: "1LH6LxC3gznFS2haUMOJIMULeRCqZ1tdY" }, w2: { drive: "18xBlX1_dxuQ-DhgMQsD06aQKfVt0uMNY" } }, // MewMaps Drive files
  regionName: "Unova",
  pins: PINS,
  maps: MAPS,
  starter: {
    label: "Starter",
    options: [["snivy", "Snivy"], ["tepig", "Tepig"], ["oshawott", "Oshawott"]],
    // Fills "$ace" / "$monkey" in rival teams: [name, types, held item]
    slots: {
      snivy:    { ace: ["Emboar", "Fire/Fighting", "Charcoal"],  monkey: ["Simipour", "Water", "Mystic Water"] },
      tepig:    { ace: ["Samurott", "Water", "Mystic Water"],    monkey: ["Simisage", "Grass", "Miracle Seed"] },
      oshawott: { ace: ["Serperior", "Grass", "Miracle Seed"],   monkey: ["Simisear", "Fire", "Charcoal"] },
    },
  },
  legends: LEGENDS,
  notInGame: NOT_IN_GAME,
  catchKit: [
    "<b>Master Ball</b>: save it for Kyurem",
    "<b>Dusk Balls</b>: 3.5× in caves and at night",
    "<b>Timer Balls</b>: 4× after 10+ turns",
    "<b>Quick Ball</b>: throw it on turn 1",
    "Sleep or Paralysis user (Spore, Hypnosis, Thunder Wave)",
    "False Swipe user, so you never KO by accident",
    "<b>Save before every legendary</b>",
  ],
  postgameBanner: "🏆 Post-game: the legendary hunt. Everything below happens after you enter the Hall of Fame.",
  chapters: CHAPTERS,
  sources: [
    ["Bulbapedia B2W2 walkthrough", "https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Black_2_and_White_2"],
    ["MewMaps", "https://www.mewmaps.org/black-2-white-2"],
  ],
};
})();
