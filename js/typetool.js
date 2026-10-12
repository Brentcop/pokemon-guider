/* Types panel: pick one or two types to see their matchups, plus the full type chart.
   Uses the game's `gen` so B2W2 gets the Gen 5 chart. Open with TypeTool.open(types?) (the ⚔ Types
   button or the T key). Looking up a Pokémon by name is the Pokédex panel's job (js/pokedex.js);
   TypeTool.matchups(types, gen) is the matchup block both panels show. */
window.TypeTool = (() => {
  "use strict";
  const G = window.GAME, gen = G.gen || 9;
  const C = Types.chart(gen);
  const $ = (s, r = document) => r.querySelector(s);
  const pill = (t, btn) => `<${btn ? `button type="button" data-tt-type="${t}"` : "span"} class="ty" style="background:${TYPE_COLORS[t]}">${t}</${btn ? "button" : "span"}>`;
  const fmt = (x) => ({ 4: "4×", 2: "2×", 1: "1×", 0.5: "½×", 0.25: "¼×", 0: "0×" }[x] ?? x + "×");

  const dlg = $("#typesDlg");
  let picked = []; // the 1–2 types being shown

  // ---------- matchup view ----------
  // The matchup block for a type combo under generation g's chart (shared with the Pokédex panel).
  function matchups(types, g = gen) {
    const C = Types.chart(g);
    // Defence: what each attacking type does to it.
    const groups = {};
    for (const a of C.types) (groups[C.vs(a, types)] ||= []).push(a);
    const tone = { 4: "worse", 2: "bad", 0.5: "good", 0.25: "best", 0: "best" };
    const row = (x, label) => groups[x]?.length
      ? `<div class="tt-row"><span class="tt-mult ${tone[x]}">${fmt(x)}</span><span class="tt-lbl">${label}</span><span class="tt-pills">${groups[x].map((t) => pill(t)).join("")}</span></div>` : "";
    // Offence: types its own-type (STAB) moves hit for 2× or better.
    const hits = C.types.filter((d) => types.some((a) => C.eff(a, d) >= 2));
    const walls = C.types.filter((d) => types.every((a) => C.eff(a, d) < 1));
    return `
      <h4>Attacks against it</h4>
      ${row(4, "super weak")}${row(2, "weak")}${row(0.5, "resists")}${row(0.25, "resists a lot")}${row(0, "immune")}
      <h4>Its ${types.join("/")} moves</h4>
      <div class="tt-row"><span class="tt-mult good">2×</span><span class="tt-lbl">hit</span><span class="tt-pills">${hits.map((t) => pill(t)).join("") || "<i>nothing</i>"}</span></div>
      ${walls.length ? `<div class="tt-row"><span class="tt-mult bad">½×</span><span class="tt-lbl">walled by</span><span class="tt-pills">${walls.map((t) => pill(t)).join("")}</span></div>` : ""}
      <p class="tt-note">Abilities can change this (e.g. Levitate ignores Ground, Flash Fire absorbs Fire).</p>`;
  }

  function render() {
    const out = $("#ttResult");
    if (!picked.length) { out.innerHTML = `<p class="tt-empty">Pick one or two types. To look up a Pokémon, use the <b>Pokédex</b> (P).</p>`; return; }
    out.innerHTML = `<div class="tt-head"><div><div class="tt-name">${picked.join(" / ")}</div>
      <div class="types">${picked.map((t) => pill(t)).join("")}</div></div></div>${matchups(picked)}`;
  }

  function pickers() {
    $("#ttPick").innerHTML = C.types.map((t) => pill(t, true)).join("");
    for (const b of dlg.querySelectorAll("[data-tt-type]")) b.classList.toggle("on", picked.includes(b.dataset.ttType));
  }

  function show(types) {
    if (Array.isArray(types) && types.length) picked = types.filter((t) => C.types.includes(t)).slice(0, 2);
    pickers(); render();
  }

  // ---------- full chart ----------
  function renderChart() {
    const ab = (t) => t.slice(0, 3);
    const head = `<tr><th class="tt-corner">ATK ↓ / DEF →</th>${C.types.map((d) => `<th class="tt-col" style="--c:${TYPE_COLORS[d]}" title="${d}"><span>${ab(d)}</span></th>`).join("")}</tr>`;
    const body = C.types.map((a) => `<tr><th class="tt-rowh" style="--c:${TYPE_COLORS[a]}">${a}</th>${C.types.map((d) => {
      const x = C.eff(a, d);
      return `<td class="m${String(x).replace(".", "")}" title="${a} → ${d}: ${fmt(x)}">${x === 1 ? "" : fmt(x).replace("×", "")}</td>`;
    }).join("")}</tr>`).join("");
    $("#ttChart").innerHTML = `<table class="tt-table">${head}${body}</table>
      <p class="tt-note">Gen ${gen} chart${gen < 6 ? " (no Fairy type; Steel also resists Ghost and Dark)" : ""}. Rows attack, columns defend. Hover to highlight a row and column; click to keep it highlighted.</p>`;
    crosshair($("#ttChart table"));
  }

  // Highlight the hovered cell's whole row and column. Clicking pins it (tap on phones);
  // clicking the same spot again unpins. A type header highlights just its row or column.
  function crosshair(tbl) {
    let pinned = null;
    const mark = (r, c) => {
      for (const row of tbl.rows) for (const cell of row.cells) {
        const inRow = r > 0 && row.rowIndex === r, inCol = c > 0 && cell.cellIndex === c;
        cell.classList.toggle("hl", inRow || inCol);
        cell.classList.toggle("hx", inRow && inCol);
      }
    };
    const at = (e) => { const cell = e.target.closest("td, th"); return cell && [cell.parentNode.rowIndex, cell.cellIndex]; };
    tbl.addEventListener("mouseover", (e) => { const p = at(e); if (p && !pinned) mark(...p); });
    tbl.addEventListener("mouseleave", () => mark(...(pinned || [-1, -1])));
    tbl.addEventListener("click", (e) => {
      const p = at(e); if (!p) return;
      pinned = pinned && pinned[0] === p[0] && pinned[1] === p[1] ? null : p;
      tbl.classList.toggle("pinned", !!pinned);
      mark(...(pinned || p));
    });
  }

  // ---------- wiring ----------
  function tab(name) {
    for (const b of dlg.querySelectorAll("[data-tt-tab]")) b.classList.toggle("on", b.dataset.ttTab === name);
    $("#ttLookup").hidden = name !== "lookup"; $("#ttChart").hidden = name !== "chart";
    if (name === "chart" && !$("#ttChart").firstChild) renderChart();
  }
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) return dlg.close();
    const t = e.target.closest("[data-tt-type]"), tb = e.target.closest("[data-tt-tab]");
    if (tb) tab(tb.dataset.ttTab);
    if (t && t.closest("#ttPick")) {
      const x = t.dataset.ttType;
      picked = picked.includes(x) ? picked.filter((p) => p !== x) : [...picked, x].slice(-2);
      pickers(); render();
    }
  });
  $("#ttClose").onclick = () => dlg.close();
  $("#typesBtn").onclick = () => open();

  // open(["Water", "Ground"]) shows that combo; a Pokémon's name opens its Pokédex entry instead.
  function open(arg) {
    if (typeof arg === "string" && window.Pokedex) { window.Pokedex.open(arg); return; }
    tab("lookup"); show(arg);
    if (dlg.open) dlg.close();
    window.Pokedex?.close();
    dlg.showModal();
  }
  return { open, matchups, close: () => dlg.open && dlg.close() };
})();
