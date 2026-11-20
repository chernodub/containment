# CREATURE18 handoff — a finished surface for the five creature families

## What was wrong (before, `artifacts/nextgen/c18-before/`)
Actor shading outputs roughly `albedo × 0.47 × two soft bands`, so a creature's on-screen value is its baked albedo.
The old bake mixed every zone with curvature wear, fbm grain, per-plate ±10 % variation and a heavy AO fold
(`(0.42+0.58·ao)^1.15`), which is the "smeared clay": no large value shapes survive two-band shading. From the
gameplay camera the dorsal shingles (dark shell) cover the mid flesh, so bodies sat in the floor's value band while the
pale bone blades (Brute wings, Stalker scythes, Crawler legs) were the brightest plane. Stalker shingles were a pale
grey-mauve "armor" that read as grey clay. Hits mixed the albedo 35 % toward white before lighting and the
corpse/acid dissolve discarded a 1.5 cm hash grid, which produced a translucent grey wash on hit and a speckled grey
smear on death. The fix needed both the bake (values) and the runtime shader (blade plane, hit, death).

## What changed
**Bake (`tools/assets/k11-creatures/build.py`)** — when a caste defines `BANDS`, `colorize_bands` paints flat
zones: `chitin` (shell/under/armor/crest/claw), `flesh` (membrane/flesh/sinew), `bone` (matte blade plane),
`accent` (organ, plus `eye`). Only a ±6 % plate step, a 22 % convex edge lift on chitin, a 22 % crease darkening,
no grain/blotch noise and a light AO fold (`0.74+0.26·ao`). Per caste `BAND_MAP` remaps zones to bands and
`PLATE_BAND` pins chosen plates. Elite parts (`*-elite` sculptures) paint every hard zone gold `(0.70,0.50,0.14)`;
those parts are geometry (horn, crest spines, blade, dorsal plates), so the rank changes the silhouette.

| Family | Dark | Mid mass (what the camera sees) | Accent | Notes |
|---|---|---|---|---|
| Crawler | legs, hooks, leg blades, shell | rust body + tan head shield and dorsal abdomen plates (40, 70–75) | red lantern | bone legs → chitin |
| Stalker | membrane gaps, shell | mauve shingles (armor → flesh) | violet lantern/eyes | scythes cool grey 0.20 |
| Spitter | chitin | olive shell + body | acid lantern, `GLOW_STRENGTH` 1.3 → 0.9 | pale mortar mouth kept (aiming face) |
| Brute | membrane/sinew gaps | ochre shingles and crest plates | ochre lantern | blades 0.17–0.20 cool grey (old bone 0.72 at rest ×0.5) |
| Carrier | chitin | plum thorax shingles + sac | magenta lantern | shield/claws 0.24 |

**Runtime (`src/render/vfx/ActorSurface.ts`, alien key `actor-surface-v13-creature18:alien`)**
- Blade plane is now detected by low chroma and mid value (not warm hue); at rest it is the authored value, a loaded
  strike lifts it ×1.55 (still below the marine plates) and its rim is cut 60 % so thin blades stop rim-glowing.
- Hit: a flat card while `actorFlash > .08` (≈ 50–100 ms): lit diffuse ×0.15 and emission → flat `(.54,.50,.45)`.
  Silhouette, ink and pose stay; no translucent wash. Marine hit flash unchanged.
- Death/dissolve: a rest-pose top-down wipe with a 3 % emissive edge instead of hash holes. `models.ts` now gives
  every creature its rest bounds (previously only the Queen).
**Crowd variety (`src/render/models.ts`)** — `setMotionSeed(id)` sets a hashed visual scale 0.94–1.06 applied to the
asset root in `fitFootprint` (non-rank only; `span`, colliders, reach and the simulation are untouched) and a loop rate
0.94–1.06 on idle/locomotion on top of the existing golden-ratio phase. Deterministic, no `Math.random()`.

## Rebuild
```sh
for c in crawler spitter stalker brute carrier; do blender -b --factory-startup -P tools/assets/k11-creatures/build.py -- --caste=$c; done   # ~1–2 min each
TOKTX=<KTX-Software 4.4.2 toktx> sh tools/assets/k11-creatures/boss14/ship.sh   # restores marine/weapons itself
git checkout -- <creature GLBs you did not rebuild>   # optimize.mjs repacks every creature file
npm run build
```
(toktx was found at `…/t3-b65322f4/artifacts/nextgen/marine17/tools/ktx/…/toktx`; `/tmp/t12-ktx` no longer exists.)

## Evidence (all under `artifacts/nextgen/`, gitignored)
- Before: `c18-before/` (three crowds), `c18-before2/` (`value14-overlap-pyro`, `value14-{brute,stalker,crawler}-attack-*`,
  rendered from a frozen HEAD build), `c18-motion-before/` (m9 strips: brute/crawler `weapon-kill-shotgun`,
  `weapon-hit-rifle`, `death-acid`).
- After: `c18-final/` (same seven scenarios), `c18-final2/` (swarm crowd + crawler attack after the last Crawler
  change), `c18-motion-after/`. Intermediate: `c18-after`, `c18-after2`, `c18-after3`.
- Playtest: `playtest/c18-playtest/` — breacher, seed 1729, 4 rooms cleared, 0 errors.

## Measured
- Draw calls identical in every scenario (crowds 122/124, 96, 81; overlap-pyro 133–142; attacks 103/77/63).
- Shipped triangle counts unchanged per caste (base 7.6k/8.8k/9.5k/11.5k/11.0k; geometry is deterministic).
  Single-creature attack scenes have identical triangle totals; the crowds draw +6.6k triangles (+2.1 %), which
  comes from more instances picking the high LOD once the ±6 % scale jitter is applied.
- No combat compiles: program count is constant within each playtest room from start through mid-fight to clear
  (159/152/147/154); materials are unchanged, so `MaterialWarmup` prepares the bumped key on the same path.

## Still weak
1. **Crawler at 480×270**: curled/braced Crawlers still read as dark pills with a red slit, and the spider pose
   shows only a small tan patch. Its top view is mostly legs; a bigger tan dorsal shape (geometry) or a
   Crawler-only lighter chitin is the next step.
2. **Stalker** still reads as a dark steel-blue mass in play (camouflage and the cool rim dominate); its mauve
   shingles show only up close.
3. Brute ochre plates carry some AO mottling up close; the Carrier's magenta accent is smaller than the old crest.
4. The flat hit card and death wipe were checked in m9 strips, which render without the room ink pass. Check them
   in a live room.

## Title illustration
`tools/assets/u10-keyart/title14.py` imports `public/assets/models/plain/{tyrant,dretch}.glb` and feeds their
base-colour and emission images into its own toon material at fixed positions. Re-running it
(`blender -b -P tools/assets/u10-keyart/title14.py`, then `npm run studio` for the plates) would pick up the new
band albedo with the same composition, poses and lights. Two things to check first: its crawlers override the
lantern to pink `(1,.22,.62)`, and its `bands=(.08,.30,.9)` toon ramp was tuned for the old darker albedo, so the
Brute may come out lighter than intended. I did not re-render the title.
