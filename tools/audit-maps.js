/* Map audit for a game module — run after adding or editing a game:
     node tools/audit-maps.js <gameId> [--no-net]
   Reports steps whose location has no close-up map, maps nothing uses, and (unless --no-net)
   checks that every map image actually loads. Exit code 1 if an image is broken. */
"use strict";
const path = require("path");
const id = process.argv[2] || "b2w2", offline = process.argv.includes("--no-net");
global.window = {};
require(path.join(__dirname, "../js/md5.js"));
require(path.join(__dirname, `../games/${id}/data.js`));
const G = window.GAME;

// Same rules as js/app.js: a map covers its name plus its `locs`; a step gets its own `map`,
// the map for its `loc`, and maps for places named in its title. {a|b} → one entry per version.
const both = (s) => (s.match(/\{([^{}|]*)\|([^{}]*)\}/) ? [0, 1].map((i) => s.replace(/\{([^{}|]*)\|([^{}]*)\}/g, (_, a, b) => (i ? b : a))) : [s]);
// Whole-name match, like the app ("Route 1" doesn't match inside "Route 19").
const named = (text, name) => new RegExp(`(?<![\\w-])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`).test(text);
const byName = new Map();
for (const [k, m] of Object.entries(G.maps || {})) for (const n of [m.name, ...(m.locs || [])]) if (!byName.has(n)) byName.set(n, k);
const steps = G.chapters.flatMap((c) => c.steps);
const used = new Set(), gaps = new Map();
for (const st of steps) {
  const keys = [].concat(st.map || []).flatMap(both);
  if (byName.has(st.loc)) keys.push(byName.get(st.loc));
  for (const t of both(st.title || "")) for (const [n, k] of byName) if (named(t, n)) keys.push(k);
  keys.forEach((k) => used.add(k));
  if (!keys.length) gaps.set(st.loc || "(no loc)", [...(gaps.get(st.loc || "(no loc)") || []), st.id]);
}

console.log(`${G.title}: ${steps.length} steps, ${Object.keys(G.maps || {}).length} maps\n`);
console.log(gaps.size ? "Steps with no close-up map (region pin only):" : "Every step has a close-up map.");
for (const [loc, ids] of gaps) console.log(`  ${loc}${G.pins?.[loc] ? "" : "  ⚠ no region pin either"}: ${ids.join(", ")}`);
const unused = Object.keys(G.maps || {}).filter((k) => !used.has(k));
if (unused.length) console.log(`\nMaps no step uses (fine if text links to them): ${unused.join(", ")}`);

const urls = (m) => m.bulba ? both(m.bulba).map((f) => { f = f.trim().replace(/ /g, "_"); const h = window.md5(f); return `https://archives.bulbagarden.net/media/upload/${h[0]}/${h.slice(0, 2)}/${encodeURIComponent(f)}`; })
  : m.url ? both(m.url) : m.drive ? [`https://lh3.googleusercontent.com/d/${m.drive}=w200`] : [];
if (offline) return;
(async () => {
  const all = Object.entries(G.maps || {}).flatMap(([k, m]) => urls(m).map((u) => [k, u]));
  const res = await Promise.all(all.map(async ([k, u]) => {
    try { const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0" } }); return [k, u, r.status]; }
    catch (e) { return [k, u, String(e.message || e)]; }
  }));
  const bad = res.filter(([, , s]) => s !== 200);
  console.log(`\nImages: ${res.length - bad.length}/${res.length} load.`);
  for (const [k, u, s] of bad) console.log(`  ✗ ${k} (${s}) ${decodeURIComponent(u)}`);
  process.exitCode = bad.length ? 1 : 0;
})();
