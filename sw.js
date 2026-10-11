/* Offline support. The site's own files are fetched network-first (so updates show up right
   away) and fall back to the saved copy offline. Images and fonts from other sites (maps,
   sprites, Google Fonts) are saved the first time they load and served from the device after.
   GitHub (progress sync) is never cached. */
"use strict";
const SHELL = "pg-shell-v3", MEDIA = "pg-media-v1"; // bump SHELL when CORE changes; MEDIA holds saved maps, keep it
const MEDIA_HOSTS = ["lh3.googleusercontent.com", "archives.bulbagarden.net", "raw.githubusercontent.com", "fonts.googleapis.com", "fonts.gstatic.com"];

// Everything a guide needs to open, saved on install so the very first visit already works offline.
self.window = self; // registry.js sets window.GAMES
importScripts("games/registry.js");
const CORE = ["./", "index.html", "guide.html", "css/style.css", "games/registry.js",
  "assets/dex.js", "assets/pokedex.js", "assets/types.js",
  "js/icons.js", "js/md5.js", "js/sync.js", "js/app.js", "js/typetool.js",
  ...self.GAMES.filter((g) => g.status === "ready").map((g) => `games/${g.id}/data.js`)];

self.addEventListener("install", (e) => {
  // cache: "reload" skips the browser's HTTP cache, so we never save a stale copy.
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keep = [SHELL, MEDIA];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

const timeout = (ms) => new Promise((_, no) => setTimeout(() => no(new Error("timeout")), ms));

// Own files: network first (4s), then the saved copy. Query strings (?v=BUILD, ?game=) are
// ignored when falling back, so any saved version beats nothing.
async function shell(req) {
  const cache = await caches.open(SHELL);
  try {
    const res = await Promise.race([fetch(req), timeout(4000)]);
    if (res.ok) {
      const path = new URL(req.url).pathname; // keep one copy per file, not one per ?v=
      for (const k of await cache.keys()) if (new URL(k.url).pathname === path && k.url !== req.url) cache.delete(k);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    const hit = await cache.match(req, { ignoreSearch: true })
      || (req.mode === "navigate" && await cache.match("guide.html", { ignoreSearch: true }));
    return hit || Response.error();
  }
}

// Images/fonts: saved copy first; otherwise fetch with CORS (every host here allows it, so the
// saved copy is readable and counts at its real size) and keep it.
async function media(req) {
  const cache = await caches.open(MEDIA);
  const hit = await cache.match(req.url);
  if (hit) return hit;
  try {
    const res = await fetch(req.url, { mode: "cors", credentials: "omit", referrerPolicy: "no-referrer" });
    if (res.ok) await cache.put(req.url, res.clone());
    return res;
  } catch {
    return fetch(req); // let the browser try it its own way (and fail normally if offline)
  }
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) return e.respondWith(shell(req));
  if (MEDIA_HOSTS.includes(url.hostname)) return e.respondWith(media(req));
  // Anything else (api.github.com for sync, Bulbapedia pages…) goes straight to the network.
});
