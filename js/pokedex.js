/* Pokédex panel: search any Pokémon and see, for the game picked in its Game menu, how it evolves, where to find it,
   its level-up moves and its type matchups. Each game's data is assets/dexdata/<game>.js (built by
   tools/build-dexdata.py), loaded the first time that game is shown. The games listed are the guides with a `dex`
   entry in games/registry.js. Open with Pokedex.open(name?): the Pokédex button, the P key, or clicking a Pokémon. */
window.Pokedex = (() => {
  "use strict";
  const G = window.GAME;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pill = (t) => `<span class="ty" style="background:${TYPE_COLORS[t]}">${t}</span>`;
  const dlg = $("#pokedexDlg"), body = $("#pdBody"), search = $("#pdSearch"), verSel = $("#pdVer");

  // Game picker: every guide with Pokédex data, one entry per version.
  const games = (window.GAMES || []).filter((g) => g.dex && (g.status === "ready" || g.id === G.id));
  const opts = games.flatMap((g) => g.dex.map(([ver, label]) => ({ game: g.id, gen: g.gen, ver, label, key: `${g.id}:${ver}` })));
  verSel.innerHTML = games.map((g) => `<optgroup label="${esc(g.title)}">${g.dex.map(([v, l]) => `<option value="${g.id}:${v}">${esc(l)}</option>`).join("")}</optgroup>`).join("");
  let picked = null; // a version chosen in the picker; until then it follows the guide's version toggle
  const cur = () => opts.find((o) => o.key === (picked || `${G.id}:${document.body.dataset.version}`)) || opts[0];

  const loading = {};
  function data(game) {
    if (window.DEXDATA?.[game]) return Promise.resolve(window.DEXDATA[game]);
    return (loading[game] ||= new Promise((ok, fail) => {
      const s = document.createElement("script");
      s.src = `assets/dexdata/${game}.js?v=${window.BUILD || ""}`;
      s.onload = () => (window.DEXDATA?.[game] ? ok(window.DEXDATA[game]) : fail());
      s.onerror = () => { delete loading[game]; fail(); };
      document.body.appendChild(s);
    }));
  }

  const monsByGen = {};
  const mons = (gen) => (monsByGen[gen] ||= Types.dex(gen));
  const monAt = (gen, dex) => mons(gen).find((m) => m.dex === dex);
  // That generation's sprites (cached for offline like the other sprites); the plain sprite if one is missing.
  const SPRITE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
  const GEN_SPRITES = { 5: "versions/generation-v/black-white/", 6: "versions/generation-vi/x-y/" };
  const sprite = (gen, dex, cls = "") =>
    `<img class="${cls}" src="${SPRITE}${GEN_SPRITES[gen] || ""}${dex}.png" alt="" loading="lazy" onerror="if(!this.dataset.f){this.dataset.f=1;this.src='${SPRITE}${dex}.png'}else this.remove()">`;

  let view = null; // the dex number shown, or null for the search results
  let shown = 60;  // how many search results are drawn

  // ---------- search results ----------
  function results(d, o) {
    const q = search.value.trim().toLowerCase();
    const all = mons(o.gen).filter((m) => m.dex <= d.maxDex);
    const hits = !q ? all : /^\d+$/.test(q) ? all.filter((m) => String(m.dex).startsWith(q))
      : [...all.filter((m) => m.name.toLowerCase().startsWith(q)), ...all.filter((m) => !m.name.toLowerCase().startsWith(q) && m.name.toLowerCase().includes(q))];
    if (!hits.length) return `<p class="tt-empty">No Pokémon in ${esc(o.label)} matches “${esc(q)}”.</p>`;
    return `<div class="pd-grid">${hits.slice(0, shown).map((m) => `
      <button type="button" class="pd-card" data-pd-dex="${m.dex}">${sprite(o.gen, m.dex)}
        <span class="pd-cn"><b>${esc(m.name)}</b><small>#${m.dex}</small></span><span class="pd-ct">${m.types.map(pill).join("")}</span></button>`).join("")}</div>
      ${hits.length > shown ? `<button type="button" class="btn pd-more" data-pd-more>Show more (${hits.length - shown} left)</button>` : ""}`;
  }

  // ---------- one Pokémon ----------
  function evolution(d, o, dex) {
    let root = dex;
    while (d.from[root]) root = d.from[root];
    const kids = {};
    for (const [k, v] of Object.entries(d.from)) (kids[v] ||= []).push(+k);
    if (!kids[root]) return `<p class="pd-none">Doesn't evolve.</p>`;
    const card = (n) => { const m = monAt(o.gen, n);
      return `<button type="button" class="pd-evo-mon${n === dex ? " on" : ""}" data-pd-dex="${n}">${sprite(o.gen, n)}<span>${esc(m?.name || "#" + n)}</span></button>`; };
    const how = (n) => (d.evo[n] || ["Can't evolve in this game"]).map(esc).join("<br><i>or</i> ");
    const stage = (n) => `<div class="pd-stage">${card(n)}${kids[n] ? `<div class="pd-kids">${kids[n].sort((a, b) => a - b)
      .map((c) => `<div class="pd-branch"><div class="pd-how"><span class="pd-arrow" aria-hidden="true">→</span>${how(c)}</div>${stage(c)}</div>`).join("")}</div>` : ""}</div>`;
    return `<div class="pd-evo">${stage(root)}</div>`;
  }

  const ONE_OFF = /Gift|One-time|trade|Roaming/;
  function places(d, o, dex) {
    const rows = d.loc[o.ver]?.[dex] || [];
    if (!rows.length) {
      const pre = d.from[dex] && monAt(o.gen, d.from[dex]);
      return `<p class="pd-none">Not found in the wild in ${esc(o.label)}.${pre ? ` Evolve it from <button type="button" class="pd-link" data-pd-dex="${pre.dex}">${esc(pre.name)}</button>, or breed it.` : " It may only come from an event, a trade, or another game."}</p>`;
    }
    let last = "";
    return `<table class="pd-table pd-loc"><thead><tr><th>Where</th><th>How</th><th>Lv</th><th>Chance</th></tr></thead><tbody>${rows.map(([place, how, lo, hi, pct, cond]) => {
      const first = place !== last; last = place;
      return `<tr class="${first ? "pd-first" : ""}"><td>${first ? esc(place) : ""}</td>
        <td>${esc(how)}${cond ? `<small>${esc(cond)}</small>` : ""}</td>
        <td class="num">${lo === hi ? lo : `${lo}–${hi}`}</td><td class="num">${ONE_OFF.test(how) || !pct ? "—" : pct + "%"}</td></tr>`;
    }).join("")}</tbody></table>`;
  }

  const CLASS = [["Status", "pd-st"], ["Physical", "pd-ph"], ["Special", "pd-sp"]];
  function moves(d, dex) {
    const lv = d.lv[dex] || [];
    if (!lv.length) return `<p class="pd-none">No level-up moves.</p>`;
    return `<table class="pd-table pd-moves"><thead><tr><th>Lv</th><th>Move</th><th>Type</th><th>Kind</th><th class="num">Pow</th><th class="num">Acc</th><th class="num">PP</th></tr></thead><tbody>${lv.map(([l, id]) => {
      const [name, type, cls, pow, acc, pp] = d.moves[id];
      return `<tr><td class="num">${l || "Evo"}</td><td><b>${esc(name)}</b></td><td>${pill(type)}</td>
        <td><span class="pd-cls ${CLASS[cls][1]}">${CLASS[cls][0]}</span></td>
        <td class="num">${pow ?? "—"}</td><td class="num">${acc ?? "—"}</td><td class="num">${pp ?? "—"}</td></tr>`;
    }).join("")}</tbody></table>`;
  }

  function detail(d, o, dex) {
    const m = monAt(o.gen, dex);
    const head = `<button type="button" class="btn pd-back" data-pd-back><svg class="ic"><use href="#i-chevron"/></svg>All Pokémon</button>`;
    if (!m || dex > d.maxDex) return `${head}<p class="tt-empty">${esc(m?.name || "That Pokémon")} isn't in ${esc(o.label)}. Pick a later game above.</p>`;
    const sec = (id, title, html) => `<section class="pd-sec" id="pd-${id}"><h3>${title}</h3>${html}</section>`;
    return `${head}
      <div class="tt-head pd-head">${sprite(o.gen, dex, "pd-big")}
        <div><div class="tt-name">${esc(m.name)} <small>#${dex}</small></div>
        <div class="types">${m.types.map(pill).join("")}</div>
        <div class="pd-jump"><a href="#pd-evo">Evolution</a><a href="#pd-loc">Where to find</a><a href="#pd-moves">Moves</a><a href="#pd-types">Matchups</a></div></div>
      </div>
      ${sec("evo", "Evolution", evolution(d, o, dex))}
      ${sec("loc", `Where to find it in ${esc(o.label)}`, places(d, o, dex))}
      ${sec("moves", "Level-up moves", moves(d, dex))}
      ${sec("types", `Type matchups <button type="button" class="btn pd-types-btn" data-pd-types="${m.types.join("/")}">Open in Types</button>`,
        window.TypeTool ? TypeTool.matchups(m.types, o.gen) : "")}`;
  }

  // ---------- drawing ----------
  async function draw(scrollTop = true) {
    const o = cur();
    verSel.value = o.key;
    let d;
    try { d = await data(o.game); } catch { body.innerHTML = `<p class="tt-empty">Couldn't load the Pokédex data for ${esc(o.label)}. Check your connection and try again.</p>`; return; }
    if (o !== cur()) return; // the picker changed while loading
    search.parentElement.hidden = view != null;
    body.innerHTML = view == null ? results(d, o) : detail(d, o, view);
    if (scrollTop) dlg.scrollTop = 0;
  }
  function show(dex) { view = dex; draw(); }

  search.addEventListener("input", () => { view = null; shown = 60; draw(); });
  search.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const first = body.querySelector("[data-pd-dex]");
    if (first) show(+first.dataset.pdDex);
  });
  verSel.onchange = () => { picked = verSel.value; draw(false); };
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) return dlg.close();
    const t = e.target.closest("[data-pd-dex],[data-pd-back],[data-pd-more],[data-pd-types],.pd-jump a");
    if (!t) return;
    if (t.matches(".pd-jump a")) { e.preventDefault(); $(t.getAttribute("href"), dlg)?.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (t.dataset.pdDex) show(+t.dataset.pdDex);
    else if ("pdBack" in t.dataset) { view = null; draw(); search.focus(); }
    else if ("pdMore" in t.dataset) { shown += 120; draw(false); }
    else if (t.dataset.pdTypes) { dlg.close(); TypeTool.open(t.dataset.pdTypes.split("/")); }
  });
  $("#pdClose").onclick = () => dlg.close();
  $("#pokedexBtn").onclick = () => open();

  // open("Kyurem") shows its entry; open() shows the search.
  function open(name) {
    const o = cur();
    const m = name && mons(o.gen).find((x) => x.name.toLowerCase() === String(name).toLowerCase());
    view = m ? m.dex : null;
    if (!m) { search.value = ""; shown = 60; }
    window.TypeTool?.close();
    if (!dlg.open) dlg.showModal();
    draw();
    if (!m) search.focus();
  }
  return { open, close: () => dlg.open && dlg.close() };
})();
