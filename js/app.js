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

  const S = {
    ver: store.get("ver", G.versions[0].id),
    starter: store.get("starter", G.starter?.options[0][0]),
    extras: store.get("extras", false),
    hideDone: store.get("hideDone", false),
    done: new Set(store.get("done", [])),
    caught: new Set(store.get("caught", [])),
  };
  if (!G.versions.some((v) => v.id === S.ver)) S.ver = G.versions[0].id;
  const save = () => {
    store.set("ver", S.ver); store.set("starter", S.starter); store.set("extras", S.extras);
    store.set("hideDone", S.hideDone); store.set("done", [...S.done]); store.set("caught", [...S.caught]);
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
  // A map is { drive: "<Google Drive file id>" } (linked from the source site)
  // or { file: "name.jpg" } (stored in games/<id>/maps/, preview in maps/sm/).
  const mapSrc = (m, full) => m.drive
    ? `https://lh3.googleusercontent.com/d/${m.drive}=${full ? "s0" : "w1600"}`
    : `${BASE}maps/${full ? "" : "sm/"}${m.file}`;

  // ---------- rendering ----------
  function renderMon([name, lvl, types, item]) {
    // "$slot" entries come from the starter choice (e.g. the rival's starter)
    if (name.startsWith("$") && G.starter) {
      const slot = G.starter.slots[S.starter]?.[name.slice(1)];
      if (slot) [name, types, item] = slot;
    }
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
    const mapBtn = st.map ? `<button class="btn mapbtn" data-map="${st.map}"><img src="${mapSrc(G.maps[st.map])}" alt="" loading="lazy">${G.maps[st.map].name} map</button>` : "";
    const pinBtn = G.pins[st.loc] ? `<button class="btn" data-mini="${esc(st.loc)}">📍 Where is this?</button>` : "";
    return `<article class="step ${done ? "done" : ""}" id="${st.id}" data-type="${st.type}">
      <button class="check" data-step="${st.id}" aria-label="Mark done">✓</button>
      <div>
        <div class="s-top"><span class="tag">${TYPE_LABEL[st.type]}</span>
          ${st.loc ? `<button class="loc" data-mini="${esc(st.loc)}">📍 ${esc(st.loc)}</button>` : ""}</div>
        <h3 class="s-title">${V(st.title)}</h3>
        <div class="s-body">
          ${st.text ? `<div>${V(st.text)}</div>` : ""}
          ${st.type === "legend" ? renderLegendCard(st) : ""}
          ${renderBoss(st.boss)}
          ${st.after ? `<div class="after">${V(st.after)}</div>` : ""}
          ${st.callout ? `<div class="callout">${V(st.callout)}</div>` : ""}
          ${mapBtn || pinBtn ? `<div class="s-actions">${mapBtn}${pinBtn}</div>` : ""}
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
      html += `<section class="chapter" id="${ch.id}">
        <div class="ch-head">
          <div class="ch-part">${ch.part}</div>
          <h2>${V(ch.title)}</h2>
          <div class="ch-areas">${V(ch.areas)}</div>
          <div class="ch-meta">
            ${ch.badge ? `<span class="chip">🏅 ${V(ch.badge)}</span>` : ""}
            ${legs.map((n) => `<span class="chip">★ ${n}</span>`).join("")}
          </div>
          ${ch.intro ? `<p class="ch-intro">${V(ch.intro)}</p>` : ""}
        </div>
        ${ch.steps.map(renderStep).join("")}
      </section>`;
    }
    $("#main").innerHTML = html;
  }

  function renderNav() {
    let html = `<div class="nav-group">Main story</div>`;
    let pg = false;
    for (const ch of G.chapters) {
      if (ch.postgame && !pg) { html += `<div class="nav-group">Post-game</div>`; pg = true; }
      const req = ch.steps.filter((s) => s.type !== "tip");
      const d = req.filter((s) => S.done.has(s.id)).length;
      const stars = ch.steps.filter((s) => s.type === "legend").length;
      html += `<a class="nav-item ${d === req.length ? "complete" : ""}" href="#${ch.id}" data-ch="${ch.id}">
        <span class="np">${ch.part}</span><span class="nt">${V(ch.title)}</span>
        <span class="nc">${d}/${req.length} steps${stars ? ` · <span class="stars">${"★".repeat(stars)}</span>` : ""}</span></a>`;
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
    $("#tracker").innerHTML = `
      <div class="panel">
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

  // ---------- mini region map ----------
  const regionSrc = (full) => mapSrc(G.regionMaps[S.ver], full);
  function toggleMini(btn) {
    const step = btn.closest(".step");
    if (step.classList.contains("done") || !G.regionMaps) return;
    const slot = step.querySelector(".mini-slot");
    if (slot.innerHTML) { slot.innerHTML = ""; return; }
    const loc = btn.dataset.mini; const [x, y] = G.pins[loc];
    slot.innerHTML = `<div class="minimap"><img src="${regionSrc()}" alt="" referrerpolicy="no-referrer"><div class="pin"><span></span></div><div class="cap">${esc(loc)} (approx.)</div></div>`;
    const mm = slot.firstChild, img = mm.querySelector("img");
    const place = () => {
      if (!img.naturalWidth) return;
      const cw = mm.clientWidth, chh = mm.clientHeight, scale = 3.2;
      const iw = cw * scale, ih = iw * (img.naturalHeight / img.naturalWidth);
      img.style.width = iw + "px";
      img.style.left = cw / 2 - (x / 100) * iw + "px"; img.style.top = chh / 2 - (y / 100) * ih + "px";
    };
    img.complete ? place() : img.addEventListener("load", place);
    mm.addEventListener("click", () => openLightbox(regionSrc(true), `${loc} · ${G.regionName || "Region"}`, [x, y]));
  }

  // ---------- lightbox with pan / wheel-zoom / pinch-zoom ----------
  const LB = { s: 1, x: 0, y: 0, w: 0, h: 0 };
  const lb = $("#lightbox"), stage = $("#lbStage"), inner = $("#lbInner"), lbImg = $("#lbImg"), lbPin = $("#lbPin");
  const applyLB = () => { inner.style.transform = `translate(${LB.x}px,${LB.y}px) scale(${LB.s})`; };
  const fitScale = () => { const r = stage.getBoundingClientRect(); return Math.min(r.width / LB.w, r.height / LB.h); };
  function fitLB() {
    const r = stage.getBoundingClientRect();
    LB.s = fitScale(); LB.x = (r.width - LB.w * LB.s) / 2; LB.y = (r.height - LB.h * LB.s) / 2; applyLB();
  }
  function zoomAt(mx, my, ns) {
    ns = Math.min(Math.max(ns, fitScale() * 0.5), 4);
    LB.x = mx - ((mx - LB.x) * ns) / LB.s; LB.y = my - ((my - LB.y) * ns) / LB.s; LB.s = ns; applyLB();
  }
  function openLightbox(src, title, pin) {
    lb.hidden = false; document.body.style.overflow = "hidden";
    $("#lbTitle").textContent = title; $("#lbOpen").href = src;
    lbPin.hidden = !pin;
    lbImg.onload = () => {
      LB.w = lbImg.naturalWidth; LB.h = lbImg.naturalHeight;
      inner.style.width = LB.w + "px"; inner.style.height = LB.h + "px";
      if (pin) {
        const px = (pin[0] / 100) * LB.w, py = (pin[1] / 100) * LB.h, r = stage.getBoundingClientRect();
        lbPin.style.left = px + "px"; lbPin.style.top = py + "px";
        LB.s = fitScale() * 3; LB.x = r.width / 2 - px * LB.s; LB.y = r.height / 2 - py * LB.s; applyLB();
      } else fitLB();
    };
    lbImg.src = src;
    if (lbImg.complete && lbImg.naturalWidth) lbImg.onload();
  }
  function closeLightbox() { lb.hidden = true; document.body.style.overflow = ""; lbImg.removeAttribute("src"); }
  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const r = stage.getBoundingClientRect();
    zoomAt(e.clientX - r.left, e.clientY - r.top, LB.s * Math.exp(-e.deltaY * 0.0015));
  }, { passive: false });
  const ptrs = new Map(); let pinch = null, drag = null;
  stage.addEventListener("pointerdown", (e) => {
    stage.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, e);
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), s: LB.s }; drag = null;
    } else { drag = { x: e.clientX - LB.x, y: e.clientY - LB.y }; stage.classList.add("drag"); }
  });
  stage.addEventListener("pointermove", (e) => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, e);
    if (pinch && ptrs.size === 2) {
      const [a, b] = [...ptrs.values()], r = stage.getBoundingClientRect();
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      zoomAt((a.clientX + b.clientX) / 2 - r.left, (a.clientY + b.clientY) / 2 - r.top, pinch.s * (d / pinch.d));
    } else if (drag) { LB.x = e.clientX - drag.x; LB.y = e.clientY - drag.y; applyLB(); }
  });
  const endPtr = (e) => {
    ptrs.delete(e.pointerId); pinch = null; stage.classList.remove("drag");
    const rest = [...ptrs.values()][0];
    drag = rest ? { x: rest.clientX - LB.x, y: rest.clientY - LB.y } : null;
  };
  stage.addEventListener("pointerup", endPtr); stage.addEventListener("pointercancel", endPtr);
  $("#lbClose").onclick = closeLightbox; $("#lbFit").onclick = fitLB;
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) closeLightbox(); });

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

  function flashTo(id) {
    const el = document.getElementById(id); if (!el) return;
    if (el.classList.contains("done") && S.hideDone) { S.hideDone = false; save(); renderAll(); return flashTo(id); }
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
  }

  // ---------- events ----------
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-step],[data-catch],[data-map],[data-mini],[data-goto],[data-ver]");
    if (!t) return;
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
      document.getElementById(id).classList.toggle("done", S.done.has(id));
      renderNav(); updateProgress(); observeChapters(); return;
    }
    if (t.dataset.map) { openLightbox(mapSrc(G.maps[t.dataset.map], true), G.maps[t.dataset.map].name); return; }
    if (t.dataset.mini) { toggleMini(t); return; }
    if (t.dataset.goto) { flashTo(t.dataset.goto); return; }
  });
  $("#starter").onchange = (e) => { S.starter = e.target.value; save(); renderAll(); };
  $("#extras").onchange = (e) => { S.extras = e.target.checked; save(); renderAll(); };
  $("#hideDone").onchange = (e) => { S.hideDone = e.target.checked; save(); renderAll(); };
  $("#regionBtn").onclick = () => openLightbox(regionSrc(true), `${G.regionName || "Region"} · ${verLabel()}`);
  $("#nextBtn").onclick = () => {
    const next = G.chapters.flatMap((c) => c.steps).find((s) => !S.done.has(s.id) && (S.extras || s.type !== "tip"));
    if (next) flashTo(next.id);
  };

  renderChrome();
  renderAll();
})();
