"""Build the Pokédex panel's per-game data (assets/dexdata/<game>.js) from PokéAPI's public CSV data:
level-up moves, how each Pokémon evolves, and where to find it in each version.

    python tools/build-dexdata.py            # every game in GAMES below
    python tools/build-dexdata.py xy         # just one

Add a game to GAMES when its guide is ready (version ids are in PokéAPI's versions.csv).
Downloads are cached in your temp folder (pokemon_moves.csv alone is ~10 MB); delete it to refresh.
"""
import csv, io, json, os, sys, tempfile, urllib.request
from collections import defaultdict

SRC = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/"
CACHE = os.path.join(tempfile.gettempdir(), "pokeapi-csv")
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "dexdata")

# id → PokéAPI version group, region, the guide's version ids mapped to PokéAPI version ids, and the last dex number.
GAMES = {
    "b2w2": {"label": "Black 2 / White 2", "gen": 5, "vg": 14, "region": 5, "max_dex": 649,
             "versions": [["b2", "Black 2", 21], ["w2", "White 2", 22]]},
    "xy": {"label": "X / Y", "gen": 6, "vg": 15, "region": 6, "max_dex": 721,
           "versions": [["x", "X", 23], ["y", "Y", 24]]},
}
# Contest-stat evolutions (Feebas by Beauty) only exist where the game has Pokéblocks or Poffins.
BEAUTY_VGS = {5, 6, 8, 9, 10, 16}
SIDE_VGS = {12, 13, 19, 24, 30, 31, 32}  # Colosseum, XD, Let's Go, Legends, Champions: never apply to the main games


def table(name):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, name + ".csv")
    if not os.path.exists(path):
        with urllib.request.urlopen(SRC + name + ".csv", timeout=120) as r, open(path, "wb") as f:
            f.write(r.read())
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def en(rows, key, field="name"):
    return {r[key]: r[field] for r in rows if r["local_language_id"] == "9"}


print("Loading PokeAPI tables...")
vg_order = {r["id"]: int(r["order"]) for r in table("version_groups")}
types = {r["id"]: r["identifier"].capitalize() for r in table("types")}
species_name = en(table("pokemon_species_names"), "pokemon_species_id")
species = {r["id"]: r for r in table("pokemon_species")}
default_pokemon = {r["id"]: r["species_id"] for r in table("pokemon") if r["is_default"] == "1"}
move_name = en(table("move_names"), "move_id")
moves = {r["id"]: r for r in table("moves")}
changelog = sorted(table("move_changelog"), key=lambda r: vg_order[r["changed_in_version_group_id"]])
item_name = en(table("item_names"), "item_id")
loc_region = {r["id"]: r["region_id"] for r in table("locations")}
loc_name = en(table("location_names"), "location_id")
areas = {r["id"]: r for r in table("location_areas")}
method_id = {r["id"]: r["identifier"] for r in table("encounter_methods")}
# Short labels for the Pokédex panel (PokéAPI's own are full sentences).
METHOD = {"walk": "Grass / cave", "dark-grass": "Dark grass", "grass-spots": "Rustling grass", "cave-spots": "Dust cloud",
          "bridge-spots": "Bridge shadow", "surf": "Surfing", "surf-spots": "Rippling water", "old-rod": "Old Rod",
          "good-rod": "Good Rod", "super-rod": "Super Rod", "super-rod-spots": "Super Rod (rippling water)",
          "rock-smash": "Rock Smash", "headbutt": "Headbutt", "yellow-flowers": "Yellow flowers", "purple-flowers": "Purple flowers",
          "red-flowers": "Red flowers", "rough-terrain": "Rough terrain", "gift": "Gift", "gift-egg": "Gift Egg",
          "static": "One-time encounter", "roaming-grass": "Roaming", "roaming-water": "Roaming", "npc-trade": "In-game trade",
          "overworld": "Overworld", "overworld-water": "Overworld (water)"}


def place(area):
    """Location name, plus the area (floor, inside/outside) when PokéAPI names one."""
    loc = loc_name.get(area["location_id"], area["identifier"])
    ident = area["identifier"]
    if not ident or ident.startswith("unknown-area"):
        return loc
    pretty = " ".join(w.upper() if any(c.isdigit() for c in w) or len(w) == 1 else w for w in ident.split("-"))
    return f"{loc} ({pretty})"
slots = {r["id"]: r for r in table("encounter_slots")}
cond_value = {r["id"]: r for r in table("encounter_condition_values")}
cond_name = en(table("encounter_condition_value_prose"), "encounter_condition_value_id")
evolutions = table("pokemon_evolution")
pokemon_moves = table("pokemon_moves")
encounters = table("encounters")
enc_conds = defaultdict(list)
for r in table("encounter_condition_value_map"):
    enc_conds[r["encounter_id"]].append(r["encounter_condition_value_id"])

TIME = {"morning": "in the morning", "day": "during the day", "night": "at night", "dusk": "at dusk"}
STATS = {"1": "Attack > Defense", "-1": "Attack < Defense", "0": "Attack = Defense"}


def move_at(mid, vg):
    """[name, type, damage class (0 status / 1 physical / 2 special), power, accuracy, pp] as of version group vg."""
    m = dict(moves[mid])
    for c in changelog:  # a changelog row lists the values a move had *before* that version group
        if c["move_id"] == mid and vg_order[c["changed_in_version_group_id"]] > vg_order[str(vg)]:
            for k in ("type_id", "power", "pp", "accuracy"):
                if c[k] and not m.get("_" + k):
                    m[k], m["_" + k] = c[k], True
    num = lambda v: int(v) if v else None
    return [move_name.get(mid, m["identifier"]), types[m["type_id"]], int(m["damage_class_id"]) - 1,
            num(m["power"]), num(m["accuracy"]), num(m["pp"])]


def evo_text(r):
    """Plain-English evolution method for one pokemon_evolution row."""
    trig = r["evolution_trigger_id"]
    parts = []
    if trig == "1":
        parts.append(f"Level {r['minimum_level']}" if r["minimum_level"] else "Level up")
    elif trig == "2":
        parts.append("Trade")
    elif trig == "3":
        parts.append(f"Use a {item_name.get(r['trigger_item_id'], 'item')}")
    elif trig == "4":
        return "Level 20 with an empty party slot and a spare Poké Ball (Nincada)"
    else:
        parts.append("Special")
    if r["gender_id"]:
        parts.append("(female)" if r["gender_id"] == "1" else "(male)")
    if r["held_item_id"]:
        parts.append(f"holding a {item_name.get(r['held_item_id'], 'item')}")
    if r["known_move_id"]:
        parts.append(f"knowing {move_name.get(r['known_move_id'])}")
    if r["known_move_type_id"]:
        parts.append(f"knowing a {types[r['known_move_type_id']]}-type move")
    if r["minimum_happiness"]:
        parts.append("with high friendship")
    if r["minimum_affection"]:
        parts.append(f"with {r['minimum_affection']}+ Affection hearts (Pokémon-Amie)")
    if r["minimum_beauty"]:
        parts.append("with high Beauty")
    if r["location_id"]:
        parts.append(f"at {loc_name.get(r['location_id'], 'a special place')}")
    if r["time_of_day"]:
        parts.append(TIME.get(r["time_of_day"], r["time_of_day"]))
    if r["relative_physical_stats"]:
        parts.append(f"with {STATS[r['relative_physical_stats']]}")
    if r["party_species_id"]:
        parts.append(f"with {species_name.get(r['party_species_id'])} in the party")
    if r["party_type_id"]:
        parts.append(f"with a {types[r['party_type_id']]}-type Pokémon in the party")
    if r["trade_species_id"]:
        parts.append(f"for a {species_name.get(r['trade_species_id'])}")
    if r["needs_overworld_rain"] == "1":
        parts.append("while it's raining")
    if r["turn_upside_down"] == "1":
        parts.append("with the system held upside down")
    return " ".join(parts)


def build(gid, g):
    vg, region, max_dex = g["vg"], str(g["region"]), g["max_dex"]
    here = lambda vgid: vgid not in map(str, SIDE_VGS) and vg_order[vgid] <= vg_order[str(vg)]

    # Evolutions: methods introduced in this game or earlier, for this region, that this game supports.
    evo = defaultdict(list)
    for r in evolutions:
        d = int(r["evolved_species_id"])
        if d > max_dex or not here(r["version_group_id"]):
            continue
        if r["region_id"] and r["region_id"] != region:
            continue
        if r["location_id"] and loc_region.get(r["location_id"]) != region:
            continue
        if r["minimum_beauty"] and vg not in BEAUTY_VGS:
            continue
        t = evo_text(r)
        if t not in evo[d]:
            evo[d].append(t)
    frm = {}
    for sid, s in species.items():
        d = int(sid)
        if d <= max_dex and s["evolves_from_species_id"] and int(s["evolves_from_species_id"]) <= max_dex:
            frm[d] = int(s["evolves_from_species_id"])

    # Level-up moves (method 1) in this version group, for each species' default form.
    lv, used = defaultdict(list), set()
    for r in pokemon_moves:
        if r["version_group_id"] != str(vg) or r["pokemon_move_method_id"] != "1":
            continue
        sid = default_pokemon.get(r["pokemon_id"])
        if not sid or int(sid) > max_dex:
            continue
        lv[int(sid)].append([int(r["level"] or 0), int(r["move_id"])])
        used.add(r["move_id"])
    for d in lv:
        lv[d] = sorted({tuple(x) for x in lv[d]}, key=lambda x: (x[0], move_name.get(str(x[1]), "")))

    # Where to find it, per version: area, method, levels, and encounter chance (summed slot rarity).
    places = {}
    for key, _label, vid in g["versions"]:
        agg = {}
        for r in encounters:
            if r["version_id"] != str(vid):
                continue
            sid = default_pokemon.get(r["pokemon_id"])
            if not sid or int(sid) > max_dex:
                continue
            slot = slots[r["encounter_slot_id"]]
            # Conditions like "During a swarm" or a season; the default ones ("Not during a swarm") are left out.
            conds = sorted(cond_name.get(c, cond_value[c]["identifier"]) for c in enc_conds[r["id"]] if cond_value[c]["is_default"] != "1")
            area = areas[r["location_area_id"]]
            name = place(area)
            mid = method_id[slot["encounter_method_id"]]
            k = (int(sid), name, METHOD.get(mid, mid.replace("-", " ").capitalize()), tuple(conds))
            a = agg.setdefault(k, [99, 0, 0])
            a[0], a[1] = min(a[0], int(r["min_level"])), max(a[1], int(r["max_level"]))
            a[2] += int(slot["rarity"] or 0)
        # Merge rows that differ only by season or time when all of them share the same levels and chance.
        merged = defaultdict(list)
        for (d, name, meth, conds), (lo, hi, pct) in agg.items():
            merged[(d, name, meth, lo, hi, pct)].append(conds)
        out = defaultdict(list)
        for (d, name, meth, lo, hi, pct), cs in merged.items():
            labels = sorted({c for cc in cs for c in cc})
            seasons = [c for c in labels if c.lower().split()[-1] in ("spring", "summer", "autumn", "winter")]
            if len(seasons) == 4:  # every season: no need to say
                labels = [c for c in labels if c not in seasons]
            order = ["spring", "summer", "autumn", "winter"]
            labels.sort(key=lambda c: order.index(c.lower().split()[-1]) if c in seasons else -1)
            labels = [c[len("During "):].capitalize() if c.startswith("During ") else c for c in labels]
            out[d].append([name, meth, lo, hi, min(pct, 100), ", ".join(labels)])
        for d in out:
            out[d].sort(key=lambda x: (x[0], x[1], x[2]))
        places[key] = dict(out)

    data = {
        "id": gid, "label": g["label"], "gen": g["gen"], "maxDex": max_dex,
        "versions": [[k, l] for k, l, _ in g["versions"]],
        "moves": {int(m): move_at(m, vg) for m in sorted(used, key=int)},
        "from": frm, "evo": dict(evo), "lv": dict(lv), "loc": places,
    }
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, gid + ".js")
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write("/* Generated by tools/build-dexdata.py from PokéAPI data. Don't edit by hand.\n"
                "   moves: id → [name, type, class (0 status / 1 physical / 2 special), power, accuracy, PP]\n"
                "   from: dex → the dex it evolves from · evo: dex → how (one line per method)\n"
                "   lv: dex → [[level, move id], …] (level-up moves) · loc: version → dex → [[place, method, min Lv, max Lv, %, conditions], …] */\n")
        f.write("(window.DEXDATA = window.DEXDATA || {})[%s] = " % json.dumps(gid))
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    print(f"{gid}: {len(lv)} Pokemon, {len(used)} moves, {sum(len(v) for v in places.values())} with locations -> {os.path.getsize(path) // 1024} KB")


for gid in (sys.argv[1:] or GAMES):
    build(gid, GAMES[gid])
