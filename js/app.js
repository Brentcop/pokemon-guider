/* Shared guide renderer: works for any game module that sets window.GAME
   (see games/_template/data.js for the full shape). */
(() => {
  "use strict";
  const G = window.GAME;
  const BASE = `games/${G.id}/`;

  // ---------- persistent state (localStorage, per game, fails soft) ----------
  const NS = `pg.${G.id}.`;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(NS + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch {} },
  };
  // One-time move of progress saved before guides were namespaced per game.
  if (G.id === "b2w2") {
    try {
      for (const k of ["ver", "starter", "extras", "hideDone", "done", "caught"]) {
        const old = localStorage.getItem("b2w2." + k);
        if (old != null && localStorage.getItem(NS + k) == null) localStorage.setItem(NS + k, old);
        localStorage.removeItem("b2w2." + k);
      }
    } catch {}
  }
  try { localStorage.setItem("pg.lastGame", G.id); } catch {}

  const S = {};
  function loadState() {
    Object.assign(S, {
      ver: store.get("ver", G.versions[0].id),
      starter: store.get("starter", G.starter?.options[0][0]),
      extras: store.get("extras", false),
      hideDone: store.get("hideDone", false),
      done: new Set(store.get("done", [])),
      caught: new Set(store.get("caught", [])),
      collapsed: new Set(store.get("collapsed", [])),
    });
    if (!G.versions.some((v) => v.id === S.ver)) S.ver = G.versions[0].id;
    // Renamed steps keep their check-off ("{a|b}" picks by version; V() isn't defined yet here).
    const vi = G.versions.findIndex((v) => v.id === S.ver);
    for (const [from, to] of Object.entries(G.renamedSteps || {})) {
      if (S.done.delete(from)) S.done.add(to.replace(/\{([^{}|]*)\|([^{}]*)\}/g, (_, a, b) => (vi === 0 ? a : b)));
    }
  }
  loadState();
  const save = () => {
    store.set("ver", S.ver); store.set("starter", S.starter); store.set("extras", S.extras);
    store.set("hideDone", S.hideDone); store.set("done", [...S.done]); store.set("caught", [...S.caught]);
    store.set("collapsed", [...S.collapsed]);
    window.Sync?.touch();
  };

  const TYPE_COLORS = {
    Normal: "#9a9a6e", Fire: "#ee7f30", Water: "#5f8ff0", Grass: "#69c045", Electric: "#f3c623", Ice: "#76cfcf",
    Fighting: "#c0302a", Poison: "#9b409b", Ground: "#d8b45a", Flying: "#9a86ee", Psychic: "#f75587", Bug: "#a0b020",
    Rock: "#b4a03a", Ghost: "#6c5894", Dragon: "#6a3cf5", Dark: "#6c584a", Steel: "#b4b4cc", Fairy: "#e89ae8",
  };
  const TYPE_LABEL = { story: "Story", boss: "Battle", legend: "Legendary", key: "Key item", prep: "Prep", heal: "Heal", tip: "Extra" };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const verIndex = () => G.versions.findIndex((v) => v.id === S.ver);
  const verLabel = () => G.versions[verIndex()].label;

  // Swap {first version text|second version text}
  const V = (s) => (s == null ? s : String(s).replace(/\{([^{}|]*)\|([^{}]*)\}/g, (_, a, b) => (verIndex() === 0 ? a : b)));
  const sprite = (name, anim) => {
    const id = DEX[name];
    return id ? `${G.sprites}/${id}.${anim ? "gif" : "png"}` : "";
  };
  const typePills = (t) => `<span class="types">${String(t || "").split(/[\/,]/).map((x) => x.trim()).filter(Boolean)
    .map((x) => `<span class="ty" style="background:${TYPE_COLORS[x] || "#888"}">${x}</span>`).join("")}</span>`;

  const legendsForVersion = () => G.legends.filter((l) => l.ver === "both" || l.ver === S.ver);
  const legendById = (id) => G.legends.find((l) => l.id === id);
  // A map is one of:
  //   { drive: "<Google Drive file id>" }   linked from the source site (e.g. MewMaps)
  //   { bulba: "File name.png" }            Bulbapedia image archive; {v1|v2} picks a version's file
  //   { url: "https://…" }                  any other image
  //   { file: "name.jpg" }                  stored in games/<id>/maps/, preview in maps/sm/
  function bulbaUrl(name) {
    const f = V(name).trim().replace(/ /g, "_"), h = window.md5(f);
    return `https://archives.bulbagarden.net/media/upload/${h[0]}/${h.slice(0, 2)}/${encodeURIComponent(f)}`;
  }
  const mapSrc = (m, full) => m.bulba ? bulbaUrl(m.bulba) : m.url ? V(m.url) : m.drive
    ? `https://lh3.googleusercontent.com/d/${m.drive}=${full ? "s0" : "w1600"}`
    : `${BASE}maps/${full ? "" : "sm/"}${m.file}`;

  // Place name → location-map key, from each map's name plus its `locs` aliases.
  const MAP_BY_NAME = new Map();
  for (const [k, m] of Object.entries(G.maps || {}))
    for (const n of [m.name, ...(m.locs || [])]) if (!MAP_BY_NAME.has(n)) MAP_BY_NAME.set(n, k);
  const asList = (x) => (x == null || x === "" ? [] : Array.isArray(x) ? x : [x]);
  // Maps for a step: its own `map` (one key or a list), then the map for its location, then
  // maps for places named in its title (e.g. "Virbank Gym: Roxie" → the Gym's map).
  function stepMaps(st) {
    const keys = asList(st.map).map(V);
    if (MAP_BY_NAME.has(st.loc)) keys.push(MAP_BY_NAME.get(st.loc));
    for (const n of (PLACE_RE && V(st.title).match(PLACE_RE)) || []) if (MAP_BY_NAME.has(n)) keys.push(MAP_BY_NAME.get(n));
    return [...new Set(keys)].filter((k) => G.maps[k]);
  }

  // Turn place names in step text into links: the location map if there is one, else the region pin.
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const PLACES = [...new Set([...MAP_BY_NAME.keys(), ...Object.keys(G.pins || {})])].sort((a, b) => b.length - a.length);
  const PLACE_RE = PLACES.length ? new RegExp(`(?<![\\w-])(?:${PLACES.map(reEsc).join("|")})(?![\\w-])`, "g") : null;
  function linkPlaces(html, own) {
    if (!PLACE_RE || !html) return html;
    const seen = new Set([own]);
    let inLink = 0;
    return html.split(/(<[^>]*>)/).map((part) => {
      if (part.startsWith("<")) { if (/^<(a|button)\b/i.test(part)) inLink++; else if (/^<\/(a|button)>/i.test(part)) inLink--; return part; }
      if (inLink) return part;
      return part.replace(PLACE_RE, (n) => {
        if (seen.has(n)) return n;
        seen.add(n);
        const kind = MAP_BY_NAME.has(n) ? "map" : "pin";
        return `<button type="button" class="xref" data-xref="${esc(n)}" data-kind="${kind}" title="${kind === "map" ? `Show the ${esc(n)} map` : `Show ${esc(n)} on the region map`}">${n}</button>`;
      });
    }).join("");
  }

  // ---------- walkthrough links (e.g. Bulbapedia) ----------
  const WT = G.walkthrough;
  const wtUrl = (part, anchor) => WT.base + part + (anchor ? "#" + encodeURI(anchor) : "");
  const refUrl = (ref) => { const [part, anchor] = V(ref).split("#"); return wtUrl(part, anchor); };
  // Hide sections that belong to the other version, e.g. "Route 4 (White 2)" while on Black 2.
  const otherLabels = () => G.versions.filter((v) => v.id !== S.ver).map((v) => `(${v.label})`);
  function moreLinks(ch) {
    if (!WT?.sections || !ch.refs) return "";
    const skip = otherLabels();
    const groups = ch.refs.map((p) => {
      const secs = (WT.sections[p] || []).filter(([label]) => !skip.some((x) => label.includes(x)));
      return `<div class="more-group"><a class="more-part" href="${wtUrl(p)}" target="_blank" rel="noopener">${WT.partLabel(p)} ↗</a>
        ${secs.map(([label, a]) => `<a href="${wtUrl(p, a)}" target="_blank" rel="noopener">${esc(label)}</a>`).join("")}</div>`;
    }).join("");
    const n = ch.refs.reduce((t, p) => t + (WT.sections[p] || []).length, 0);
    return `<details class="more"><summary>📖 More on ${WT.label}: side content, items &amp; full text (${n} sections)</summary>${groups}</details>`;
  }

  // ---------- rendering ----------
  function renderMon([name, lvl, types, item]) {
    // "$slot" entries come from the starter choice (e.g. the rival's starter).
    // An explicit item overrides the slot's; "-" means no held item.
    if (name.startsWith("$") && G.starter) {
      const slot = G.starter.slots[S.starter]?.[name.slice(1)];
      if (slot) { const own = item; [name, types, item] = slot; if (own) item = own; }
    }
    if (item === "-") item = "";
    name = V(name); types = V(types);
    const src = sprite(name.split(" / ")[0]);
    return `<div class="mon">${src ? `<img src="${src}" alt="" loading="lazy">` : ""}
      <span class="mn">${esc(name)}</span><span class="ml">Lv ${lvl}</span>${typePills(types)}
      ${item ? `<span class="mi">@ ${esc(item)}</span>` : ""}</div>`;
  }

  function renderBoss(b) {
    if (!b) return "";
    return `<div class="boss">
      <div class="boss-who"><span>⚔ ${esc(V(b.who))}${b.rival ? ` <span class="rw">(team based on your ${(G.starter?.label || "starter").toLowerCase()})</span>` : ""}</span>${b.reward ? `<span class="rw">🏅 ${esc(V(b.reward))}</span>` : ""}</div>
      <div class="team">${b.team.map(renderMon).join("")}</div>
      <div class="use"><b class="lbl">Use:</b> ${V(b.use)}</div>
    </div>`;
  }

  function renderLegendCard(step) {
    const l = legendById(V(step.legend));
    if (!l) return "";
    const caught = S.caught.has(l.id);
    return `<div class="legend-card">
      <div class="spr"><img src="${sprite(l.name, true)}" alt="${l.name}" loading="lazy" onerror="this.onerror=null;this.src='${sprite(l.name)}'"></div>
      <div>
        <div><span class="ln">${l.name}</span><span class="lv">Lv${l.lvl}</span></div>
        ${typePills(l.types.join("/"))}
        <div class="row"><b>Hit with:</b> ${l.hit}</div>
        ${l.avoid ? `<div class="row"><b>Avoid:</b> ${l.avoid}</div>` : ""}
        ${step.tactic ? `<div class="row"><b>Plan:</b> ${V(step.tactic)}</div>` : ""}
        ${l.note ? `<div class="row"><b>Note:</b> ${l.note}</div>` : ""}
        <button class="btn caught-btn ${caught ? "on" : ""}" data-catch="${l.id}">${caught ? "✓ Caught!" : "Mark as caught"}</button>
      </div>
    </div>`;
  }

  function renderStep(st) {
    const done = S.done.has(st.id);
    const maps = stepMaps(st);
    const mapBtns = maps.map((k) => `<button class="btn mapbtn" data-map="${k}"><img src="${mapSrc(G.maps[k])}" alt="" loading="lazy" referrerpolicy="no-referrer">🗺 ${G.maps[k].name} map</button>`).join("");
    const pinBtn = G.pins[st.loc] ? `<button class="btn" data-mini="${esc(st.loc)}">📍 Where is this?</button>` : "";
    // The location chip opens the inside map when the place has one, otherwise the region pin.
    const locMap = MAP_BY_NAME.get(st.loc);
    const locBtn = !st.loc ? ""
      : locMap ? `<button class="loc" data-map="${locMap}" title="Show the ${esc(G.maps[locMap].name)} map">🗺 ${esc(st.loc)}</button>`
      : `<button class="loc" data-mini="${esc(st.loc)}" title="Show on the region map">📍 ${esc(st.loc)}</button>`;
    const txt = (s) => linkPlaces(V(s), st.loc);
    return `<article class="step ${done ? "done" : ""}" id="${st.id}" data-type="${st.type}">
      <button class="check" data-step="${st.id}" aria-label="Mark done">✓</button>
      <div>
        <div class="s-top"><span class="tag">${TYPE_LABEL[st.type]}</span>${locBtn}</div>
        <h3 class="s-title">${V(st.title)}</h3>
        <div class="s-body">
          ${st.text ? `<div>${txt(st.text)}</div>` : ""}
          ${st.type === "legend" ? renderLegendCard(st) : ""}
          ${renderBoss(st.boss)}
          ${st.after ? `<div class="after">${txt(st.after)}</div>` : ""}
          ${st.callout ? `<div class="callout">${txt(st.callout)}</div>` : ""}
          <div class="s-actions">${mapBtns}${pinBtn}${st.ref && WT ? `<a class="btn wt" href="${refUrl(st.ref)}" target="_blank" rel="noopener" title="Read this section on ${WT.label}">📖 ${WT.label} ↗</a>` : ""}</div>
          <div class="mini-slot"></div>
        </div>
      </div>
    </article>`;
  }

  function renderMain() {
    let html = "";
    let shownPostBanner = false;
    for (const ch of G.chapters) {
      if (ch.postgame && !shownPostBanner && G.postgameBanner) {
        html += `<div class="postgame-banner">${G.postgameBanner}</div>`;
        shownPostBanner = true;
      }
      const legs = ch.steps.filter((s) => s.type === "legend").map((s) => legendById(V(s.legend))?.name).filter(Boolean);
      const req = requiredSteps(ch), nDone = req.filter((s) => S.done.has(s.id)).length;
      html += `<section class="chapter ${S.collapsed.has(ch.id) ? "collapsed" : ""}" id="${ch.id}">
        <div class="ch-head">
          <button class="ch-toggle" data-collapse="${ch.id}" aria-expanded="${!S.collapsed.has(ch.id)}" title="Collapse / expand (C)">▾</button>
          <div class="ch-part">${ch.part} <span class="ch-count">${nDone}/${req.length}</span></div>
          <h2>${V(ch.title)}</h2>
          <div class="ch-areas">${V(ch.areas)}</div>
          <div class="ch-meta">
            ${ch.badge ? `<span class="chip">🏅 ${V(ch.badge)}</span>` : ""}
            ${legs.map((n) => `<span class="chip">★ ${n}</span>`).join("")}
          </div>
          ${ch.intro ? `<p class="ch-intro">${V(ch.intro)}</p>` : ""}
          ${moreLinks(ch)}
        </div>
        ${ch.steps.map(renderStep).join("")}
      </section>`;
    }
    $("#main").innerHTML = html;
  }

  const chapterGroup = (ch) => ch.group || (ch.postgame ? "Post-game" : "Main story");
  const requiredSteps = (ch) => ch.steps.filter((s) => s.type !== "tip");

  function renderNav() {
    let html = "", group = null;
    for (const ch of G.chapters) {
      if (chapterGroup(ch) !== group) { group = chapterGroup(ch); html += `<div class="nav-group">${group}</div>`; }
      const req = requiredSteps(ch);
      const d = req.filter((s) => S.done.has(s.id)).length;
      const stars = ch.steps.filter((s) => s.type === "legend").length;
      const full = d === req.length;
      html += `<div class="nav-item ${full ? "complete" : ""}" data-ch="${ch.id}">
        <button class="pcheck" data-part="${ch.id}" title="${full ? "Uncheck" : "Check off"} all of ${esc(ch.part)}" aria-label="Check off ${esc(ch.part)}">✓</button>
        <a class="nav-link" href="#${ch.id}">
          <span class="np">${ch.part}</span><span class="nt">${V(ch.title)}</span>
          <span class="na">${V(ch.areas)}</span>
          <span class="nc">${d}/${req.length} steps${stars ? ` · <span class="stars">${"★".repeat(stars)}</span>` : ""}</span>
        </a></div>`;
    }
    html += `<div class="key">${Object.entries(TYPE_LABEL).map(([k, v]) =>
      `<span class="tag" style="background:var(--t-${k});${k === "legend" ? "color:#2a1d00" : ""}">${v}</span>`).join("")}</div>`;
    $("#nav").innerHTML = html;
  }

  function renderTracker() {
    const list = legendsForVersion();
    const n = list.filter((l) => S.caught.has(l.id)).length;
    const row = (l) => `<div class="trow ${S.caught.has(l.id) ? "caught" : ""}" data-goto="${l.step}">
      <img src="${sprite(l.name)}" alt="">
      <div><div class="tn">${l.name} <span class="tl">Lv${l.lvl}</span></div>
      <div class="tw">${esc(l.where)}${l.requires ? ` · <i>${V(l.requires)}</i>` : ""}</div>
      ${l.other && l.native && l.native !== S.ver ? `<div class="tw">⚠ ${l.other}</div>` : ""}</div>
      <button class="tc" data-catch="${l.id}" title="Toggle caught">✓</button></div>`;
    const story = list.filter((l) => l.phase === "story"), post = list.filter((l) => l.phase === "post");
    $("#dexCount").textContent = `${n}/${list.length}`;
    $("#tracker").innerHTML = `
      <div class="panel">
        <button class="btn drawer-close" data-drawer="close" aria-label="Close">✕</button>
        <h3>Legendary Dex</h3>
        <div class="count">${n}<small> / ${list.length} catchable in ${verLabel()}</small></div>
        <div class="dexbar"><div style="width:${list.length ? (n / list.length) * 100 : 0}%"></div></div>
        ${story.length ? `<div class="tgroup">During the story</div>${story.map(row).join("")}` : ""}
        ${post.length ? `<div class="tgroup">Post-game (suggested order)</div>${post.map(row).join("")}` : ""}
      </div>
      ${G.catchKit?.length ? `<div class="panel"><h3>Catch kit</h3><ul class="kit">${G.catchKit.map((x) => `<li>${x}</li>`).join("")}</ul></div>` : ""}
      ${G.notInGame?.length ? `<div class="panel"><h3>Not catchable in-game</h3>
        <ul class="nig">${G.notInGame.map(([a, b]) => `<li><b>${a}</b>: ${b}</li>`).join("")}</ul></div>` : ""}`;
  }

  function updateProgress() {
    const all = G.chapters.flatMap((c) => c.steps).filter((s) => s.type !== "tip");
    const d = all.filter((s) => S.done.has(s.id)).length;
    $("#bar").style.width = (all.length ? (d / all.length) * 100 : 0) + "%";
  }

  function applyTheme() {
    const v = G.versions[verIndex()], root = document.documentElement.style;
    document.body.dataset.mode = v.mode;
    root.setProperty("--accent", v.accent); root.setProperty("--accent-2", v.accent2); root.setProperty("--accent-ink", v.ink);
  }

  function renderChrome() {
    document.title = G.title;
    $("#gTitle").textContent = G.title;
    $("#gTagline").textContent = G.tagline || "";
    $("#verSeg").innerHTML = G.versions.map((v) => `<button data-ver="${v.id}">${v.label}</button>`).join("");
    if (G.starter) {
      $("#starterWrap").hidden = false;
      $("#starterLabel").textContent = G.starter.label;
      $("#starter").innerHTML = G.starter.options.map(([id, label]) => `<option value="${id}">${label}</option>`).join("");
    }
    $("#regionBtn").hidden = !G.regionMaps;
    $("#foot").innerHTML = (G.sources?.length ? "Sources: " + G.sources.map(([t, u]) => `<a href="${u}" target="_blank">${t}</a>`).join(" · ") + ". " : "")
      + `Sprites from PokéAPI. Personal reference only. <a href="index.html">All guides</a>`;
  }

  function renderAll() {
    applyTheme();
    $$("#verSeg button").forEach((b) => b.classList.toggle("on", b.dataset.ver === S.ver));
    if (G.starter) $("#starter").value = S.starter;
    $("#extras").checked = S.extras;
    $("#hideDone").checked = S.hideDone;
    document.body.classList.toggle("extras", S.extras);
    document.body.classList.toggle("hide-done", S.hideDone);
    renderMain(); renderNav(); renderTracker(); updateProgress(); observeChapters();
  }

  // ---------- pan / zoom viewer (inline maps and the full-screen lightbox) ----------
  // The image is transformed inside `stage`; the pin lives outside the transform so it keeps
  // its size and its tip always sits on [x%, y%] of the image.
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  let pageWheelAt = -1e9; // last wheel tick that scrolled the page
  addEventListener("wheel", (e) => { if (!e.defaultPrevented) pageWheelAt = performance.now(); }, { passive: true });
  function panZoom(stage, img, pinEl, { inline = false, homeScale } = {}) {
    const V2 = { s: 1, x: 0, y: 0, w: 0, h: 0, pin: null };
    const box = () => ({ w: stage.clientWidth, h: stage.clientHeight });
    const fitScale = () => { const b = box(); return V2.w ? Math.min(b.w / V2.w, b.h / V2.h) : 1; };
    const minS = () => fitScale() * (inline ? 1 : 0.5);
    const maxS = () => Math.max(4, fitScale() * 2);
    function apply() {
      // Keep at least 80px of the image on screen so it can't be lost off an edge.
      const b = box(), keep = 80, iw = V2.w * V2.s, ih = V2.h * V2.s;
      V2.x = clamp(V2.x, Math.min(keep - iw, b.w - iw), Math.max(b.w - keep, 0));
      V2.y = clamp(V2.y, Math.min(keep - ih, b.h - ih), Math.max(b.h - keep, 0));
      img.style.transform = `translate(${V2.x}px,${V2.y}px) scale(${V2.s})`;
      const real = img.naturalWidth ? (V2.s * V2.w * devicePixelRatio) / img.naturalWidth : 1;
      img.style.imageRendering = real >= 1.5 ? "pixelated" : "auto";
      if (pinEl) {
        pinEl.hidden = !V2.pin || !V2.w;
        if (V2.pin) {
          pinEl.style.left = V2.x + (V2.pin[0] / 100) * iw + "px";
          pinEl.style.top = V2.y + (V2.pin[1] / 100) * ih + "px";
        }
      }
    }
    function zoomAt(mx, my, ns) {
      ns = clamp(ns, minS(), maxS());
      V2.x = mx - ((mx - V2.x) * ns) / V2.s; V2.y = my - ((my - V2.y) * ns) / V2.s; V2.s = ns; apply();
    }
    const zoomBy = (f) => { const b = box(); zoomAt(b.w / 2, b.h / 2, V2.s * f); };
    function fit() {
      const b = box(); V2.s = fitScale();
      V2.x = (b.w - V2.w * V2.s) / 2; V2.y = (b.h - V2.h * V2.s) / 2; apply();
    }
    function home() {
      if (!V2.w) return;
      if (!V2.pin) return fit();
      const b = box();
      V2.s = clamp(homeScale ? homeScale(b, V2) : fitScale() * 3, minS(), maxS());
      V2.x = b.w / 2 - (V2.pin[0] / 100) * V2.w * V2.s;
      V2.y = b.h / 2 - (V2.pin[1] / 100) * V2.h * V2.s;
      apply();
    }
    function setImage(w, h, pin) {
      V2.w = w; V2.h = h; V2.pin = pin || null;
      img.style.width = w ? w + "px" : ""; img.style.height = h ? h + "px" : "";
      last = box(); // the box may have just been resized for this image; don't shift it again
      home();
    }

    // Drag with any mouse button (left, middle or right). Touch: pinch + drag in the
    // lightbox; inline maps leave touch alone so the page still scrolls, and a tap opens full screen.
    const ptrs = new Map(); let drag = null, pinch = null, moved = 0, lastType = "mouse";
    stage.addEventListener("pointerdown", (e) => {
      lastType = e.pointerType;
      if (inline && e.pointerType !== "mouse") return;
      if (e.target.closest("button, a")) return;
      e.preventDefault();
      try { stage.setPointerCapture(e.pointerId); } catch {}
      ptrs.set(e.pointerId, e); moved = 0;
      stage.classList.add("engaged");
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), s: V2.s }; drag = null;
      } else { drag = { x: e.clientX - V2.x, y: e.clientY - V2.y }; stage.classList.add("drag"); }
    });
    stage.addEventListener("pointermove", (e) => {
      if (!ptrs.has(e.pointerId)) return;
      const prev = ptrs.get(e.pointerId);
      moved += Math.abs(e.clientX - prev.clientX) + Math.abs(e.clientY - prev.clientY);
      ptrs.set(e.pointerId, e);
      if (pinch && ptrs.size === 2) {
        const [a, b] = [...ptrs.values()], r = stage.getBoundingClientRect();
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        zoomAt((a.clientX + b.clientX) / 2 - r.left, (a.clientY + b.clientY) / 2 - r.top, pinch.s * (d / pinch.d));
      } else if (drag) { V2.x = e.clientX - drag.x; V2.y = e.clientY - drag.y; apply(); }
    });
    const endPtr = (e) => {
      if (!ptrs.delete(e.pointerId)) return;
      pinch = null; stage.classList.remove("drag");
      const rest = [...ptrs.values()][0];
      drag = rest ? { x: rest.clientX - V2.x, y: rest.clientY - V2.y } : null;
    };
    stage.addEventListener("pointerup", endPtr); stage.addEventListener("pointercancel", endPtr);
    stage.addEventListener("contextmenu", (e) => e.preventDefault()); // right-drag pans instead
    stage.addEventListener("mousedown", (e) => { if (e.button === 1) e.preventDefault(); }); // no middle-click autoscroll
    stage.addEventListener("dragstart", (e) => e.preventDefault());
    stage.addEventListener("dblclick", (e) => {
      if (e.target.closest("button, a")) return;
      const r = stage.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, V2.s * (e.shiftKey ? 0.5 : 2));
    });

    // The wheel zooms. On inline maps it only skips zooming while the page is mid-scroll
    // (a map sliding under the cursor shouldn't grab the wheel), or once zoomed all the way out.
    stage.addEventListener("wheel", (e) => {
      if (inline && !e.ctrlKey && !e.metaKey) {
        const scrolling = performance.now() - pageWheelAt < 350;
        const atLimit = e.deltaY > 0 && V2.s <= minS() * 1.001;
        if (scrolling || atLimit || !V2.w) { pageWheelAt = performance.now(); return; }
      }
      e.preventDefault();
      const r = stage.getBoundingClientRect(), k = e.ctrlKey && Math.abs(e.deltaY) < 50 ? 0.01 : 0.0015;
      zoomAt(e.clientX - r.left, e.clientY - r.top, V2.s * Math.exp(-e.deltaY * k));
    }, { passive: false });

    // Keep the view centred on the same spot when the box changes size.
    let last = box();
    new ResizeObserver(() => {
      const b = box();
      if (!V2.w || !b.w) { last = b; return; }
      if (!last.w) { last = b; home(); return; } // was hidden: start over from the default view
      V2.x += (b.w - last.w) / 2; V2.y += (b.h - last.h) / 2; last = b; apply();
    }).observe(stage);

    return { setImage, fit, home, zoomBy, refresh: apply, pan(dx, dy) { V2.x += dx; V2.y += dy; apply(); }, get tapIsTouch() { return lastType !== "mouse"; }, get moved() { return moved; } };
  }

  // ---------- inline maps (region pin + location maps), shown inside a step ----------
  const regionSrc = (full) => mapSrc(G.regionMaps[S.ver], full);
  const pinFor = (p) => (!p ? null : Array.isArray(p) ? p : p[S.ver] || null);
  const touchUI = matchMedia("(pointer: coarse)").matches;

  // Show `src` in the step's map slot, centred on pin [x%, y%] with the image `scale`× the
  // box width; no pin → the whole image. Same key again closes it.
  function inlineMap(slot, key, { src, full, pin, caption, title, scale = 3.2 }) {
    if (slot.dataset.key === key) { slot.innerHTML = ""; slot.dataset.key = ""; return; }
    slot.dataset.key = key;
    slot.innerHTML = `<div class="minimap ${pin ? "" : "fit"}">
      <img src="${src}" alt="" referrerpolicy="no-referrer" draggable="false">
      <div class="pin" hidden><span></span></div>
      <div class="cap">${esc(caption)}</div>
      <div class="mm-tools">
        <button type="button" data-z="in" title="Zoom in">+</button><button type="button" data-z="out" title="Zoom out">−</button>
        <button type="button" data-z="home" title="${pin ? "Back to the pin" : "Fit the whole map"}">⌖</button><button type="button" data-z="full" title="Full screen">⤢</button>
      </div>
      <div class="mm-hint">${touchUI ? "Tap to open full screen" : "Drag to move · scroll to zoom · double-click zooms in"}</div>
    </div>`;
    const mm = slot.firstElementChild, img = mm.querySelector("img");
    const pz = panZoom(mm, img, mm.querySelector(".pin"), { inline: true, homeScale: (b, v) => (b.w * scale) / v.w });
    const ready = () => {
      if (!img.naturalWidth) return;
      // A whole-map view gets a box shaped like the image (up to 520px tall).
      if (!pin) mm.style.height = Math.min(520, mm.clientWidth * (img.naturalHeight / img.naturalWidth)) + "px";
      pz.setImage(img.naturalWidth, img.naturalHeight, pin);
      mm.classList.add("ready");
      // The preview is ~1600px wide; swap in the full-size map (same file the full-screen view
      // uses) so zoomed-in views stay sharp. The layout size is fixed, so nothing moves.
      if (full !== src) {
        const hi = new Image();
        hi.referrerPolicy = "no-referrer";
        hi.onload = () => { if (mm.isConnected) { img.src = full; pz.refresh(); } };
        hi.src = full;
      }
    };
    img.complete && img.naturalWidth ? ready() : img.addEventListener("load", ready, { once: true });
    mm.addEventListener("click", (e) => {
      const z = e.target.closest("[data-z]")?.dataset.z;
      if (z === "in") pz.zoomBy(1.5);
      else if (z === "out") pz.zoomBy(1 / 1.5);
      else if (z === "home") pz.home();
      else if (z === "full" || (!z && pz.tapIsTouch)) openLightbox(full, title, pin);
    });
  }

  function toggleRegion(btn, loc = btn.dataset.mini) {
    const step = btn.closest(".step");
    if (step.classList.contains("done") || !G.regionMaps) return;
    inlineMap(step.querySelector(".mini-slot"), "region:" + loc, {
      src: regionSrc(), full: regionSrc(true), pin: G.pins[loc],
      caption: `${loc} (approx.)`, title: `${loc} · ${G.regionName || "Region"}`,
    });
  }

  // A step's location map. The step's mapPin/mapLabel apply to its own `map` (the first one listed).
  function toggleLocationMap(btn, key = btn.dataset.map) {
    const step = btn.closest(".step");
    const st = G.chapters.flatMap((c) => c.steps).find((x) => x.id === step.id);
    const m = G.maps[key], own = V(asList(st.map)[0]) === key;
    const pin = own ? pinFor(st.mapPin) : null, label = own && pin && st.mapLabel ? V(st.mapLabel) : "";
    inlineMap(step.querySelector(".mini-slot"), "map:" + key, {
      src: mapSrc(m), full: mapSrc(m, true), pin, scale: 2.4,
      caption: label ? `${m.name}: ${label}` : m.name,
      title: label ? `${m.name} · ${label}` : m.name,
    });
  }

  // A place name linked inside step text.
  function showXref(btn) {
    const n = btn.dataset.xref;
    if (MAP_BY_NAME.has(n)) toggleLocationMap(btn, MAP_BY_NAME.get(n));
    else toggleRegion(btn, n);
    btn.closest(".step").querySelector(".mini-slot").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // ---------- full-screen lightbox ----------
  const lb = $("#lightbox"), stage = $("#lbStage"), lbImg = $("#lbImg");
  const lbView = panZoom(stage, lbImg, $("#lbPin"));
  let lbPinNow = null;
  function openLightbox(src, title, pin) {
    lb.hidden = false; document.body.style.overflow = "hidden";
    $("#lbTitle").textContent = title; $("#lbOpen").href = src;
    lbPinNow = pin || null;
    lbView.setImage(0, 0, null);
    lbImg.onload = () => lbView.setImage(lbImg.naturalWidth, lbImg.naturalHeight, lbPinNow);
    lbImg.src = src;
    if (lbImg.complete && lbImg.naturalWidth) lbImg.onload();
  }
  function closeLightbox() { lb.hidden = true; document.body.style.overflow = ""; lbImg.removeAttribute("src"); }
  $("#lbClose").onclick = closeLightbox;
  $("#lbFit").onclick = () => lbView.fit();
  $("#lbIn").onclick = () => lbView.zoomBy(1.5);
  $("#lbOut").onclick = () => lbView.zoomBy(1 / 1.5);
  $("#lbHome").onclick = () => lbView.home();
  document.addEventListener("keydown", (e) => {
    if (lb.hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key, step = e.shiftKey ? 240 : 80;
    if (k === "Escape") closeLightbox();
    else if (k === "+" || k === "=") lbView.zoomBy(1.4);
    else if (k === "-" || k === "_") lbView.zoomBy(1 / 1.4);
    else if (k === "0") lbView.fit();
    else if (k === "p" || k === "P") lbView.home();
    else if (k === "ArrowLeft") lbView.pan(step, 0);
    else if (k === "ArrowRight") lbView.pan(-step, 0);
    else if (k === "ArrowUp") lbView.pan(0, step);
    else if (k === "ArrowDown") lbView.pan(0, -step);
    else return;
    e.preventDefault();
  });

  // ---------- active chapter highlighting ----------
  let io;
  function observeChapters() {
    io?.disconnect();
    io = new IntersectionObserver((ents) => {
      for (const en of ents) if (en.isIntersecting) {
        $$(".nav-item").forEach((a) => a.classList.toggle("active", a.dataset.ch === en.target.id));
      }
    }, { rootMargin: "-140px 0px -60% 0px" });
    $$(".chapter").forEach((c) => io.observe(c));
  }

  function flashTo(id, instant) {
    const el = document.getElementById(id); if (!el) return;
    const sec = el.closest(".chapter");
    if (sec?.classList.contains("collapsed")) { S.collapsed.delete(sec.id); save(); sec.classList.remove("collapsed"); }
    if (el.classList.contains("done") && S.hideDone) { S.hideDone = false; save(); renderAll(); return flashTo(id, instant); }
    el.scrollIntoView({ behavior: instant ? "instant" : "smooth", block: "start" });
    el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
  }

  // ---------- events ----------
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-step],[data-catch],[data-map],[data-mini],[data-xref],[data-goto],[data-ver],[data-part],[data-collapse],[data-drawer]");
    if (!t) return;
    if (t.dataset.collapse) { toggleCollapse(t.dataset.collapse); return; }
    if (t.dataset.drawer) { setDrawer(false); return; }
    if (t.dataset.ver) { S.ver = t.dataset.ver; save(); renderAll(); return; }
    if (t.dataset.catch) {
      e.stopPropagation();
      const id = t.dataset.catch;
      S.caught.has(id) ? S.caught.delete(id) : S.caught.add(id);
      const l = legendById(id); // catching also completes the matching step
      if (S.caught.has(id) && l) S.done.add(l.step);
      save(); renderAll(); return;
    }
    if (t.dataset.step) {
      const id = t.dataset.step;
      S.done.has(id) ? S.done.delete(id) : S.done.add(id);
      save();
      const el = document.getElementById(id);
      el.classList.toggle("done", S.done.has(id));
      const ch = G.chapters.find((c) => c.steps.some((x) => x.id === id)), req = requiredSteps(ch);
      el.closest(".chapter").querySelector(".ch-count").textContent = `${req.filter((x) => S.done.has(x.id)).length}/${req.length}`;
      renderNav(); updateProgress(); observeChapters(); return;
    }
    if (t.dataset.part) {
      e.preventDefault();
      const ch = G.chapters.find((c) => c.id === t.dataset.part), req = requiredSteps(ch);
      const allDone = req.every((x) => S.done.has(x.id));
      if (allDone && !confirm(`Uncheck every step in ${ch.part}?`)) return;
      req.forEach((x) => (allDone ? S.done.delete(x.id) : S.done.add(x.id)));
      allDone ? S.collapsed.delete(ch.id) : S.collapsed.add(ch.id); // finished parts fold up
      save(); renderAll(); return;
    }
    if (t.dataset.map) { toggleLocationMap(t); return; }
    if (t.dataset.mini) { toggleRegion(t); return; }
    if (t.dataset.xref) { showXref(t); return; }
    if (t.dataset.goto) { setDrawer(false); flashTo(t.dataset.goto); return; }
  });
  $("#starter").onchange = (e) => { S.starter = e.target.value; save(); renderAll(); };
  $("#extras").onchange = (e) => { S.extras = e.target.checked; save(); renderAll(); };
  $("#hideDone").onchange = (e) => { S.hideDone = e.target.checked; save(); renderAll(); };
  $("#regionBtn").onclick = () => openLightbox(regionSrc(true), `${G.regionName || "Region"} · ${verLabel()}`);
  // Where you left off: the first unchecked step after the last one you checked
  // (skipped steps further back don't pull you away from where you are).
  function resumeStep() {
    const all = G.chapters.flatMap((c) => c.steps).filter((s) => S.extras || s.type !== "tip");
    let last = -1;
    all.forEach((s, i) => { if (S.done.has(s.id)) last = i; });
    return all[last + 1] || all.find((s) => !S.done.has(s.id));
  }
  $("#nextBtn").onclick = () => { const next = resumeStep(); if (next) flashTo(next.id); };

  // ---------- collapsible parts ----------
  function toggleCollapse(id) {
    S.collapsed.has(id) ? S.collapsed.delete(id) : S.collapsed.add(id);
    save();
    const sec = document.getElementById(id);
    sec.classList.toggle("collapsed", S.collapsed.has(id));
    sec.querySelector(".ch-toggle").setAttribute("aria-expanded", String(!S.collapsed.has(id)));
  }

  // ---------- Legendary Dex drawer (narrow screens) ----------
  const drawerMQ = matchMedia("(max-width: 1180px)");
  function setDrawer(open) {
    if (!drawerMQ.matches) open = false;
    $("#tracker").classList.toggle("open", open);
    $("#drawerBackdrop").hidden = !open;
    document.body.classList.toggle("drawer-open", open);
  }
  $("#dexBtn").onclick = () => setDrawer(!$("#tracker").classList.contains("open"));
  $("#drawerBackdrop").onclick = () => setDrawer(false);
  drawerMQ.addEventListener("change", () => setDrawer(false));

  // ---------- keyboard shortcuts (desktop) ----------
  const kbdDlg = $("#kbdDlg");
  $("#kbdBtn").onclick = () => kbdDlg.showModal();
  $("#kbdClose").onclick = () => kbdDlg.close();
  kbdDlg.addEventListener("click", (e) => { if (e.target === kbdDlg) kbdDlg.close(); });
  let focusId = null;
  const visibleSteps = () => $$(".chapter:not(.collapsed) .step").filter((el) => el.offsetParent !== null);
  function focusStep(el) {
    if (!el) return;
    $$(".step.kfocus").forEach((x) => x.classList.remove("kfocus"));
    el.classList.add("kfocus"); focusId = el.id;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function currentStep() {
    const el = focusId && document.getElementById(focusId);
    if (el && el.offsetParent !== null) return el;
    // otherwise: the first step visible near the top of the screen
    return visibleSteps().find((x) => x.getBoundingClientRect().bottom > 140) || null;
  }
  function currentChapter() {
    const st = currentStep();
    if (st) return st.closest(".chapter");
    return $$(".chapter").find((c) => c.getBoundingClientRect().bottom > 140);
  }
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
    if ($("dialog[open]")) return;
    if (!lb.hidden) return;
    const k = e.key;
    if (k === "Escape") { setDrawer(false); $$(".step.kfocus").forEach((x) => x.classList.remove("kfocus")); focusId = null; return; }
    if (k === "?") { kbdDlg.showModal(); e.preventDefault(); return; }
    const steps = visibleSteps(), cur = currentStep(), i = cur ? steps.indexOf(cur) : -1;
    switch (k.toLowerCase()) {
      case "j": focusStep(focusId ? steps[Math.min(i + 1, steps.length - 1)] : cur); break;
      case "k": focusStep(focusId ? steps[Math.max(i - 1, 0)] : cur); break;
      case "x": case " ": if (cur) { cur.querySelector(".check").click(); focusId = cur.id; cur.classList.add("kfocus"); } break;
      case "n": $("#nextBtn").click(); break;
      case "m": cur?.querySelector("[data-map], .s-actions [data-mini]")?.click(); break;
      case "b": { const a = cur?.querySelector("a.wt"); if (a) window.open(a.href, "_blank", "noopener"); break; }
      case "c": { const ch = currentChapter(); if (ch) toggleCollapse(ch.id); break; }
      case "]": case "[": {
        const chs = $$(".chapter"), c = currentChapter(), j = chs.indexOf(c) + (k === "]" ? 1 : -1);
        if (chs[j]) chs[j].scrollIntoView({ behavior: "smooth", block: "start" });
        break;
      }
      case "d": setDrawer(!$("#tracker").classList.contains("open")); break;
      case "r": $("#regionBtn").click(); break;
      default: return;
    }
    e.preventDefault();
  });

  // ---------- sync panel (cloud via GitHub Gist + backup codes) ----------
  const syncDlg = $("#syncDlg");
  const STATUS_TEXT = { off: "Not connected", pending: "Changes waiting…", syncing: "Syncing…", ok: "Synced", error: "Sync error" };
  function paintSync(state, msg) {
    $("#syncBtn").dataset.state = state;
    $("#syncState").textContent = msg || STATUS_TEXT[state] || "";
    $("#syncState").dataset.state = state;
    $("#syncConnect").hidden = Sync.connected;
    $("#syncConnected").hidden = !Sync.connected;
  }
  Sync.onStatus(paintSync);
  Sync.onRemoteChange(() => {
    loadState(); renderAll();
    if (!userMoved) resume(); // newer progress from another device arrived before you started scrolling
  });
  $("#syncBtn").onclick = () => { $("#codeOut").value = Sync.exportCode(); $("#codeIn").value = ""; syncDlg.showModal(); };
  $("#syncClose").onclick = () => syncDlg.close();
  syncDlg.addEventListener("click", (e) => { if (e.target === syncDlg) syncDlg.close(); });
  $("#tokenSave").onclick = async () => {
    const t = $("#tokenIn").value;
    if (!t.trim()) return;
    try { await Sync.connect(t); $("#tokenIn").value = ""; } catch {}
  };
  $("#syncNow").onclick = () => Sync.syncNow();
  $("#syncOff").onclick = () => { if (confirm("Stop syncing on this device? Your progress stays here and in the Gist.")) Sync.disconnect(); };
  const copy = async (text, btn) => {
    try { await navigator.clipboard.writeText(text); } catch { $("#codeOut").select(); document.execCommand("copy"); }
    const t = btn.textContent; btn.textContent = "Copied!"; setTimeout(() => (btn.textContent = t), 1500);
  };
  $("#codeCopy").onclick = (e) => copy($("#codeOut").value, e.target);
  $("#linkCopy").onclick = (e) => copy(`${location.origin}${location.pathname}?game=${G.id}#import=${$("#codeOut").value}`, e.target);
  const doImport = (code) => {
    try { Sync.importCode(code); if (syncDlg.open) syncDlg.close(); return true; }
    catch { alert("That code doesn't look right. Make sure you copied all of it."); return false; }
  };
  $("#codeImport").onclick = () => {
    const code = $("#codeIn").value.trim();
    if (code && confirm("Replace the progress on this device with the imported progress (all games)?")) doImport(code);
  };
  // Opening a backup link: guide.html?game=…#import=<code>
  if (location.hash.startsWith("#import=")) {
    const code = location.hash.slice(8);
    history.replaceState(null, "", location.pathname + location.search);
    if (confirm("Load the progress from this link? It replaces the progress on this device (all games).")) doImport(code);
  }

  renderChrome();
  renderAll();

  // ---------- open where you left off ----------
  // Puts the first unchecked step after your last check-off (its checkbox) right under the
  // sticky header, and holds it there while fonts and images finish loading and shift the page.
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  let userMoved = false;
  for (const ev of ["wheel", "touchmove", "keydown", "pointerdown"]) addEventListener(ev, () => { userMoved = true; }, { passive: true });
  function placeStep(el) {
    const head = $(".topbar").getBoundingClientRect().bottom;
    scrollTo({ top: el.getBoundingClientRect().top + scrollY - head - 12, behavior: "instant" });
  }
  function resume() {
    if (!S.done.size || (location.hash && document.getElementById(location.hash.slice(1)))) return;
    const st = resumeStep();
    if (!st) return;
    flashTo(st.id, true); // opens its part if collapsed, turns off "Hide done" if needed
    const el = document.getElementById(st.id);
    if (!el) return;
    userMoved = false;
    focusId = st.id; // J/K continue from here
    $$(".step.kfocus").forEach((x) => x.classList.remove("kfocus"));
    el.classList.add("kfocus");
    placeStep(el);
    const hold = new ResizeObserver(() => { if (!userMoved) placeStep(el); });
    hold.observe($("#main"));
    document.fonts?.ready.then(() => { if (!userMoved) placeStep(el); });
    addEventListener("load", () => { if (!userMoved) placeStep(el); }, { once: true });
    setTimeout(() => hold.disconnect(), 4000);
  }
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", resume, { once: true });
  else resume();
})();
