# Pokémon Route Guides

Personal guides that keep only the main story and the legendaries, without optional item pickups and side quests.

| Game | Status |
|---|---|
| Black 2 & White 2 | ✅ Parts 1–15 + post-game legendaries |
| X & Y | planned |
| Omega Ruby & Alpha Sapphire | planned |
| Sun & Moon | planned |
| Ultra Sun & Ultra Moon | planned |

**Open:** `index.html` (game picker) → `guide.html?game=<id>`. It runs from disk or from any static host such as GitHub Pages. Locally you can also run `python -m http.server` in this folder.

## Using a guide
- The **version toggle** swaps version-exclusive legendaries, puzzles, and the theme.
- The **starter picker** sets the rival's team.
- Check off steps as you go. **▶ Next step** jumps to where you left off. Progress is saved per game in your browser.
- **Legendary Dex** (right panel): mark catches, and click a row to jump to its step.
- **📍 Where is this?** shows a pin on the region map. **Map buttons** open the location maps (scroll or pinch to zoom, drag to pan).
- **Show extras** reveals optional tips.
- **📖 Bulbapedia** on each step opens that exact section. Each part's header has a **More on Bulbapedia** list covering all the side content, items and full text.
- **Parts collapse:** tap ▾ on a part header. Checking off a whole part folds it up automatically.
- **Keyboard (desktop):** J/K move between steps, X checks one off, N jumps to the next unchecked step, [ / ] change parts, C collapses, M opens the map, B opens Bulbapedia. Press ? for the full list.
- **Narrow screens:** the Legendary Dex opens from the **★ Dex** button.

## Layout
```
index.html              game picker (reads games/registry.js)
guide.html              shared guide page, loads games/<id>/data.js + js/app.js
js/app.js               shared renderer (no game-specific code)
css/style.css           shared styles; light/dark base + per-version accent colors
assets/dex.js           Pokémon name → National Dex number (shared by all games)
assets/sprites/gen5/    sprites by dex number (<dex>.png, <dex>.gif)
games/registry.js       list of games + status (ready / planned)
games/<id>/data.js      everything about one game: versions, chapters, legendaries, pins, maps
games/<id>/maps/        only for maps you store yourself (B2W2 links to MewMaps instead)
games/_template/        starting point for a new game, with every field documented
```

## Adding a game
1. Copy `games/_template/` to `games/<id>/`, using the id already in `games/registry.js` (`xy`, `oras`, `sm`, `usum`).
2. Fill in `data.js`: versions (with theme colors), chapters and steps, legendaries, region-map pins, maps.
3. Maps: link them by Google Drive id (`{ drive: "…" }`) the way B2W2 does, or store them in `games/<id>/maps/` with ~1600px previews in `maps/sm/`.
4. Add any new Pokémon names to `assets/dex.js`. Add a sprite folder (for example `assets/sprites/gen6/`) and point `sprites` at it.
5. Set the game's `status` to `"ready"` in `games/registry.js`.
6. After any change, bump `BUILD` in `guide.html` (and the `?v=` numbers) so browsers load the new files.

Sources for B2W2: [Bulbapedia walkthrough](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Black_2_and_White_2), [MewMaps](https://www.mewmaps.org/black-2-white-2), sprites from PokéAPI.
