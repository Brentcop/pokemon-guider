/* Reading font: the View menu's choice, saved on this device for every guide and the home page ("pg.font").
   Sets <html data-font="…"> (css/style.css swaps --font) and loads that font's files only when it's picked.
   Load it in <head> so the page never flashes the old font. */
(() => {
  "use strict";
  const FONTS = {
    standard: { label: "Standard (Inter)" },
    lexend: { label: "Lexend", css: "https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800&display=swap" },
    atkinson: { label: "Atkinson Hyperlegible", css: "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap" },
    dyslexic: { label: "OpenDyslexic" }, // stored in assets/fonts (see @font-face in css/style.css)
  };
  const get = () => { try { const f = localStorage.getItem("pg.font"); return FONTS[f] ? f : "standard"; } catch { return "standard"; } };
  function apply(f) {
    document.documentElement.dataset.font = f;
    const css = FONTS[f].css;
    if (css && !document.querySelector(`link[data-font="${f}"]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = css; l.dataset.font = f;
      document.head.appendChild(l);
    }
  }
  window.readFont = {
    FONTS, get,
    set(f) { if (!FONTS[f]) return; try { localStorage.setItem("pg.font", f); } catch {} apply(f); },
  };
  apply(get());
})();
