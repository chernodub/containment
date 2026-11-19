# HERO14 handoff — marine read at gameplay size

Evidence: `artifacts/nextgen/hero14-final/` — `before-{colour,grey}.png`, `after-{colour,grey}.png` (4 rigs ×
Crew Checkpoint / Relay Racks / Freight Hold × calm / heavy, 480×270-reduced windows), `round1-colour.png`,
`native-before-after.png`, `portraits.png`. Log: `docs/nextgen/plans/HERO14-review.md`.

## Root causes found
- `vfx/ActorSurface.ts` (LIGHT13 marine hierarchy) mixed the rig colour into every top-facing plate (65 %) and
  multiplied direct light by it, and self-lit the whole diffuse, so the undersuit lifted too: Breacher/Pyro read as
  skin, Cryo/Arc as pastel.
- `lighting/GraphicSurface.ts` marine quantizer classified the cream K12 plates as saturated "rig panels"
  (chroma > .075) and pushed them to tan; the undersuit landed on a mid value.
- Weapons went through the generic actor family-tone path (`registerGeometry` marine base 0x3d4348), flattening
  them to a black silhouette.

## What changed (marine-only, delimited with `HERO14` comments)
- `ActorSurface.ts` (friendly branch only): no rig tint on plates; self-emission only for light plates (×.55) and
  saturated rig panels (×1.1); room light desaturated to 35 % colour on the marine; lit rig panels take .32 direct
  diffuse / .4 specular so they stay saturated; cool rim 0x8fd2ff at .28. Cache key `actor-surface-v9-hero14`.
- `GraphicSurface.ts` marine branch: three groups — rig panels (chroma > .16) keep hue at ×.58; luma > .30 →
  cool off-white (.80,.85,.90); everything else → near-black gunmetal (.035,.040,.047).
- `post/Ink.ts`: marine (class 3) interior region ink .80 → .22; outer contour unchanged.
- `weapons.ts`: weapon materials flagged `k10Original` (authored atlas, no family tone).
- `tools/assets/k12-hero/`: cool-white game plate albedo, yellow-amber Breacher (`amber_game`), rig-coloured crown
  stripes either side of the keel, both pauldron lames, Breacher ram barrels and Arc coil cores in rig colour; one
  Pyro exhaust fin dropped from the game LOD. Max drawn 24,770 triangles (body 20,306 + Pyro 4,464).
  Close-up ceramic is cool too; `hero.py` stages weapons from `plain/` (KTX2 cannot be imported by Blender).
- `tools/assets/ka12-weapons/weapons.py`: palette only — mid-grey graphite/steel, lighter plate/ivory top, yellow
  amber accent. No geometry change.
- Shipping: `marine.glb` + `plain/marine.glb` (meshopt, KTX2/PNG, PERF13 shadow LOD re-appended), five weapon
  GLBs + `plain/`. Rig-select portraits re-rendered (same names/sizes).

Exact rebuild (from repo root):
```
blender -b -t 4 -P tools/assets/k12-hero/marine.py -- --bake --hero
blender -b -t 4 -P tools/assets/ka12-weapons/weapons.py -- --round=3 --ship
# meshopt for the marine only (the stock script also re-packs creatures):
sed "s/for(const name of \['dretch','basilisk','marauder','tyrant','dragoon','marine'\])/for(const name of ['marine'])/" tools/assets/i11-models/optimize.mjs > tools/assets/i11-models/.m.mjs && node tools/assets/i11-models/.m.mjs && rm tools/assets/i11-models/.m.mjs
TOKTX=/path/to/toktx node tools/assets/t12-textures/pack.mjs
git checkout -- $(git status --short | awk '{print $2}' | grep public/assets/models | grep -v -E "marine|pistol|rifle|shotgun|plasma|rocket")   # pack.mjs rewrites creatures from its cache
sed "s/const names = \['dretch', 'basilisk', 'marauder', 'dragoon', 'tyrant', 'marine'\];/const names = ['marine'];/" tools/assets/i11-models/lod.mjs > tools/assets/i11-models/.l.mjs && node tools/assets/i11-models/.l.mjs && rm tools/assets/i11-models/.l.mjs
blender -b -t 4 -P tools/assets/k12-hero/portraits.py
npm run build
```
Warning for the asset owners: `pack.mjs` regenerated the current K11 creature GLBs from its stale source cache;
I restored them from git. The cache should be refreshed by the creature stream.

## Verify
- Calm and heavy frames per rig in a pale, a dark and a sodium-lit room (`k10-calm-<rig>:<room>`,
  `k10-heavy-<rig>:<room>`); greyscale 480×270: marine first; colour: rig nameable.
- Death/frost/burn/acid finishes on the marine (ActorSurface death styles unchanged, but the base palette changed).
- Low tier and graphics recovery (shader cache key bumped).
- Overdrive/ability overlays on the marine (heavy frames show a cyan overlay masking rig colour).

## Still weak
- Rig colour covers ~10 % of the top-down silhouette, under the 15–20 % target; the pack and pauldrons carry it.
  Next step: rig-coloured upper-arm/forearm main plates per rig (needs per-rig copies of body plates).
- In heavy frames combat effects wash over the marine and hide the rig colour.
- The visor reads from front/side; from directly behind only the cyan keel light shows.
- Close-up Breacher paint is still orange rather than yellow-amber (render palette unchanged); portraits are lit
  warmer by the rig-coloured key than gameplay.
- Weapons carry no per-rig accent (shared GLBs).
