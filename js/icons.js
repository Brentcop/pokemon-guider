/* One small SVG icon set for every page (no icon font). Loads before anything that draws icons:
   it adds a hidden <svg> of <symbol>s to the page, and `icon(name)` returns markup that uses one.
   Static HTML can use them directly: <svg class="ic"><use href="#i-map"/></svg>.
   Icons are 24×24, drawn with a 2px stroke in currentColor so they take the text color. */
(() => {
  "use strict";
  const P = {
    map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    swords: '<path d="M4 4l11 11M13 17l4-4M15 15l4 4M20 4L9 15M11 17l-4-4M9 15l-4 4"/>',
    cloud: '<path d="M7 18h10.5a4.5 4.5 0 00.6-8.96A6 6 0 006.2 10.1 4 4 0 007 18z"/>',
    keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6"/>',
    star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M4.5 12.5l5 5L20 7"/>',
    book: '<path d="M4 4.5A2.5 2.5 0 016.5 2H20v16H6.5A2.5 2.5 0 004 20.5z"/><path d="M4 20.5A2.5 2.5 0 006.5 23H20v-5"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>',
    chevron: '<path d="M6 9l6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    target: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    expand: '<path d="M14 4h6v6M10 20H4v-6M20 4l-6 6M4 20l6-6"/>',
    fit: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
    menu: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    badge: '<path d="M12 2l7 4v6c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
    heart: '<path d="M12 20s-8-4.8-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 9c0 6.2-8 11-8 11z"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M18 5l2 2"/>',
    bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 016 0v2"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3.5 10.9c.6.4 1 1.2 1 2.1h5c0-.9.4-1.7 1-2.1A6 6 0 0012 3z"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    trophy: '<path d="M8 4h8v6a4 4 0 01-8 0z"/><path d="M8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 14v4M8 21h8M9 18h6"/>',
    ball: '<circle cx="12" cy="12" r="9"/><path d="M3 12h6M15 12h6"/><circle cx="12" cy="12" r="3"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  };
  const filled = new Set(["play", "star"]);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">${Object.entries(P).map(([k, d]) =>
    `<symbol id="i-${k}" viewBox="0 0 24 24" fill="${filled.has(k) ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</symbol>`).join("")}</svg>`;
  const put = () => document.body.insertAdjacentHTML("afterbegin", svg);
  document.body ? put() : document.addEventListener("DOMContentLoaded", put, { once: true });
  window.icon = (name, cls = "") => `<svg class="ic${cls ? " " + cls : ""}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  // For CSS (e.g. ::after on place links): the same icon as a data: URL to use as a mask.
  window.iconURL = (name) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${P[name]}</svg>`)}")`;
  document.documentElement.style.setProperty("--ic-map", window.iconURL("map"));
  document.documentElement.style.setProperty("--ic-pin", window.iconURL("pin"));
  document.documentElement.style.setProperty("--ic-star", window.iconURL("star"));
  document.documentElement.style.setProperty("--ic-download", window.iconURL("download"));
})();
