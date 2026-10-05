/* Progress sync, shared by every game.
   Everything the guides save lives in localStorage under "pg.<game>.<key>".
   This module bundles those keys into one snapshot and can:
     • sync it to a private GitHub Gist (needs a token with only the "gist" scope)
     • export/import it as a backup code, or as a link (#import=<code>)
   Conflicts: newest snapshot wins (compared by the time it was last changed). */
(() => {
  "use strict";
  const FILE = "pokemon-guider-progress.json";
  const K = { token: "pg.sync.token", gist: "pg.sync.gist", local: "pg.sync.localUpdated", pulled: "pg.sync.remoteUpdated" };
  const API = "https://api.github.com";

  const ls = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
    del: (k) => { try { localStorage.removeItem(k); } catch {} },
  };
  const isProgressKey = (k) => k.startsWith("pg.") && !k.startsWith("pg.sync.") && k !== "pg.lastGame";

  // ---------- snapshot ----------
  function snapshot() {
    const data = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (isProgressKey(k)) data[k] = localStorage.getItem(k);
      }
    } catch {}
    return { v: 1, updated: Number(ls.get(K.local) || 0), data };
  }
  function applySnapshot(snap) {
    try {
      for (const k of Object.keys(localStorage)) if (isProgressKey(k)) localStorage.removeItem(k);
      for (const [k, v] of Object.entries(snap.data || {})) if (isProgressKey(k)) localStorage.setItem(k, v);
    } catch {}
    ls.set(K.local, String(snap.updated || Date.now()));
    listeners.forEach((fn) => fn());
  }

  // ---------- backup codes (base64url of the JSON snapshot) ----------
  const toCode = (snap) => btoa(unescape(encodeURIComponent(JSON.stringify(snap)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  function fromCode(code) {
    const b64 = code.trim().replace(/-/g, "+").replace(/_/g, "/");
    const snap = JSON.parse(decodeURIComponent(escape(atob(b64 + "===".slice((b64.length + 3) % 4)))));
    if (!snap || typeof snap.data !== "object") throw new Error("Not a progress code");
    return snap;
  }

  // ---------- GitHub Gist ----------
  const token = () => ls.get(K.token);
  async function gh(path, opts = {}) {
    const r = await fetch(API + path, {
      ...opts,
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token()}`, ...(opts.body ? { "Content-Type": "application/json" } : {}) },
    });
    if (!r.ok) throw new Error(r.status === 401 ? "Token was rejected (expired or wrong scope)" : `GitHub error ${r.status}`);
    return r.json();
  }
  async function findOrCreateGist() {
    let id = ls.get(K.gist);
    if (id) return id;
    for (let page = 1; page <= 5 && !id; page++) {
      const list = await gh(`/gists?per_page=100&page=${page}`);
      id = list.find((g) => g.files && g.files[FILE])?.id;
      if (list.length < 100) break;
    }
    if (!id) {
      const g = await gh("/gists", { method: "POST", body: JSON.stringify({
        description: "Pokémon Route Guides progress (auto-synced)", public: false,
        files: { [FILE]: { content: JSON.stringify(snapshot(), null, 1) } },
      }) });
      id = g.id;
    }
    ls.set(K.gist, id);
    return id;
  }
  async function pull() {
    const id = await findOrCreateGist();
    const g = await gh(`/gists/${id}`);
    const f = g.files?.[FILE];
    if (!f) return false;
    const remote = JSON.parse(f.truncated ? await (await fetch(f.raw_url)).text() : f.content);
    const local = Number(ls.get(K.local) || 0);
    if ((remote.updated || 0) > local) { applySnapshot(remote); ls.set(K.pulled, String(remote.updated)); return true; }
    return false;
  }
  async function push() {
    const id = await findOrCreateGist();
    const snap = snapshot();
    await gh(`/gists/${id}`, { method: "PATCH", body: JSON.stringify({ files: { [FILE]: { content: JSON.stringify(snap, null, 1) } } }) });
    ls.set(K.pulled, String(snap.updated));
  }

  // ---------- status + scheduling ----------
  let state = "off", msg = "", timer = null, busy = Promise.resolve();
  const listeners = new Set(), statusListeners = new Set();
  const setStatus = (s, m = "") => { state = s; msg = m; statusListeners.forEach((fn) => fn(state, msg)); };
  const queue = (fn) => (busy = busy.then(fn, fn));

  async function syncNow() {
    if (!token()) return setStatus("off");
    setStatus("syncing");
    try {
      const changed = await pull();
      // push if our copy is newer than what's in the gist
      if (!changed && Number(ls.get(K.local) || 0) > Number(ls.get(K.pulled) || 0)) await push();
      setStatus("ok", "Synced " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    } catch (e) { setStatus("error", e.message); }
  }

  window.Sync = {
    /** Call whenever progress changes; marks the time and schedules a push. */
    touch() {
      ls.set(K.local, String(Date.now()));
      if (!token()) return;
      clearTimeout(timer);
      setStatus("pending");
      timer = setTimeout(() => queue(syncNow), 2500);
    },
    onRemoteChange(fn) { listeners.add(fn); },
    onStatus(fn) { statusListeners.add(fn); fn(state, msg); },
    get connected() { return !!token(); },
    syncNow: () => queue(syncNow),
    async connect(t) {
      ls.set(K.token, t.trim()); ls.del(K.gist);
      setStatus("syncing");
      try { await gh("/gists?per_page=1"); } catch (e) { ls.del(K.token); setStatus("error", e.message); throw e; }
      return queue(syncNow);
    },
    disconnect() { [K.token, K.gist, K.pulled].forEach(ls.del); setStatus("off"); },
    exportCode: () => toCode({ ...snapshot(), updated: Number(ls.get(K.local) || Date.now()) }),
    importCode(code) {
      const snap = fromCode(code);
      applySnapshot({ ...snap, updated: Date.now() }); // imported = newest, so it syncs out
      if (token()) queue(push).then(() => setStatus("ok", "Imported & synced"), (e) => setStatus("error", e.message));
    },
  };

  // Pull on load and whenever the tab comes back into view.
  if (token()) queue(syncNow);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && token()) queue(syncNow); });
})();
