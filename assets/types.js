/* Shared type data for every game: colors, the type chart for a generation, and a Pokémon's
   types as of a generation (uses POKEDEX / POKEDEX_PAST from assets/pokedex.js). */
const TYPE_COLORS = {
  Normal: "#9a9a6e", Fire: "#ee7f30", Water: "#5f8ff0", Grass: "#69c045", Electric: "#f3c623", Ice: "#76cfcf",
  Fighting: "#c0302a", Poison: "#9b409b", Ground: "#d8b45a", Flying: "#9a86ee", Psychic: "#f75587", Bug: "#a0b020",
  Rock: "#b4a03a", Ghost: "#6c5894", Dragon: "#6a3cf5", Dark: "#6c584a", Steel: "#b4b4cc", Fairy: "#e89ae8",
};

const Types = (() => {
  "use strict";
  const ALL = ["Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground",
    "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"];
  // Gen 6+ chart: attacker → { defender: multiplier } (anything missing is 1×).
  const CHART = {
    Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
    Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
    Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
    Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
    Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
    Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
    Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
    Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
    Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
    Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
    Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
    Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
    Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
    Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
    Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
    Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
    Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
    Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 },
  };
  const MAX_DEX = { 1: 151, 2: 251, 3: 386, 4: 493, 5: 649, 6: 721, 7: 809 };

  // The chart as it was in generation `gen` (2–5: no Fairy, and Steel resists Ghost and Dark).
  function chart(gen = 9) {
    const types = gen >= 6 ? ALL : ALL.filter((t) => t !== "Fairy");
    const eff = (atk, def) => {
      if (gen < 6 && def === "Steel" && (atk === "Ghost" || atk === "Dark")) return 0.5;
      return CHART[atk]?.[def] ?? 1;
    };
    // Multiplier an attack of type `atk` does to a Pokémon with types `defs` (one or two).
    const vs = (atk, defs) => defs.reduce((m, d) => m * eff(atk, d), 1);
    return { gen, types, eff, vs };
  }

  // Every Pokémon that exists in `gen`, with its types as of that generation.
  function dex(gen = 9) {
    const max = MAX_DEX[gen] || Infinity;
    return POKEDEX.filter(([n]) => n <= max).map(([n, name, types]) => {
      const old = (POKEDEX_PAST[n] || []).filter(([last]) => last >= gen).sort((a, b) => a[0] - b[0])[0];
      return { dex: n, name, types: (old ? old[1] : types).split("/") };
    });
  }

  return { ALL, chart, dex };
})();
