# HERO19 handoff — one marine from title to selector to play

## 1. Before (what failed to carry over)

Evidence: `artifacts/nextgen/hero19/before-identity.png` (columns: title crop, rig select, calm Crew Checkpoint,
Relay Racks crowd, Breacher overlap fight; rows: native colour, 480×270 colour, native grey, 480×270 grey), raw
captures `artifacts/nextgen/h19-before/`, Blender game-camera turnarounds `artifacts/nextgen/k12-work/review-h19a/`.
All five requested scenario ids existed.

1. **Visor (bake + shader):** the lens geometry is there, but the game atlas paints it near-black (`.008`) with emission
   only on a 6 mm strip, and the marine quantizer in `GraphicSurface` then snaps it to the undersuit black, so the title's
   cyan face becomes a black slit; the brow rim is a thin 11 mm panel, so there is no visible depth either (geometry).
2. **Shoulder dome (geometry):** the "big" pauldron is a 1.4× plate conformed 3 cm off a 17 cm shoulder loft, i.e. a cap
   that hugs the arm; from the high camera, with the marine facing right, it hides behind the helmet and the yellow that
   remains merges with the crown stripes, so play shows "a small yellow cap" instead of the title's helmet-sized dome.
3. **Black-and-white patches (shader first, geometry second):** the marine quantizer maps luma < .19 to `(.018,.021,.025)`
   and > .38 to `.77`, so every undersuit gap, graphite pectoral (MARINE17) and rear arm plate becomes a hard black island
   between white strips; the narrow limb plates (thigh/greave/vambrace) expose many such gaps.
4. **Gold headband (geometry/bake):** the rig-painted crown stripes at ±10–30° on the helmet top are what reads as a gold
   band from above; the title has only fine pinstripes there, so in the game LOD they should go.

## 2–4. What changed

**Geometry (`tools/assets/k12-hero/`)**
- `body.py` — every rig's dominant shoulder is now a real rig-coloured hemisphere (R .205 m, 108° sweep, rolled
  rim, dark seat ring, large "07" stencil) bound to the **clavicle** (`shoulder.L`, Pyro `shoulder.R`), so it stays on
  top of the shoulder in aim and run poses while the arm swings under its open rim. The off shoulder is a small
  ceramic cap plus one lame (scale .85). Chest pectorals, rear upper-arm and inner vambrace are ceramic again; shin
  greave and thigh front plate wrap both sides of the limb, the upper-arm plate covers the front.
- **The "camouflage" was geometry, not paint:** the game LOD ships the unsubdivided loft cage, but its plates were
  conformed to the subdivision limit surface and filled with sparse flat triangles, so the dark undersuit poked
  through every plate in polka-dots (proved with `marine.py -- --review --xray`, undersuit in red). Game-LOD plates
  now conform to the cage, stand 9 mm (limbs) / 5 mm (torso) clear, and use an anisotropic fill (`kit.plate(aniso=)`:
  dense columns around the limb, sparse rows along it) at no triangle cost.
- `helmet.py` — visor lens taller (top edge 16° → 30°) and wider (±63° → ±78°), brought forward 10 mm, under a deeper
  lipped brow rim; cheeks moved behind it. Game LOD: ceramic skull under the plates (no dark oval between side
  plates) and **no rig crown stripes** (they were the "gold headband"); the close-up keeps both.
- `materials.py` — atlas visor albedo cyan `(.035,.26,.34)` and the whole lens emissive `(.016,.115,.150)`, HUD strip ×2.6.

**Shading (`src/render/`)**
- `lighting/GraphicSurface.ts` marine quantizer: two calm values, ceramic `(.76,.78,.80)` and a warm dark-grey
  undersuit `(.060,.055,.050)` (was near-black `.018`), split at luma .30–.42 (was .19–.38) so worn plates never fall
  into the dark value; chromatic atlas texels (cyan visor, glow strips) keep their colour.
- `post/Ink.ts` marine interior seam ink .22 → .10. Outer contour unchanged.
- Program keys bumped: `actor-surface-v13-hero19:marine`, `graphic-surface-hero19`. Same material count; warm-up
  prepares them. Rim colour/strength and hostile warning separation untouched.

**Interface** — `scripts/nextgen/studio-plan.mjs` portraits now face so the dome shoulder and visor meet the lens
(left-dome rigs face screen-left like the title, Pyro faces right); `portrait-{breacher,cryo,pyro,arc}.png`
re-rendered through live shading. Selector, death card and pause use these files.

## Rebuild

```sh
blender -b -t 4 -P tools/assets/k12-hero/marine.py -- --bake --hero
sed "s/for(const name of \['dretch','basilisk','marauder','tyrant','dragoon','marine'\])/for(const name of ['marine'])/" tools/assets/i11-models/optimize.mjs > tools/assets/i11-models/.m.mjs && node tools/assets/i11-models/.m.mjs && rm tools/assets/i11-models/.m.mjs
TOKTX=/path/to/toktx node tools/assets/t12-textures/pack.mjs      # NOT RUN in HERO19, see below
sed "s/const names = \['dretch', 'basilisk', 'marauder', 'dragoon', 'tyrant', 'marine'\];/const names = ['marine'];/" tools/assets/i11-models/lod.mjs > tools/assets/i11-models/.l.mjs && node tools/assets/i11-models/.l.mjs && rm tools/assets/i11-models/.l.mjs
git checkout -- $(git status --short | awk '{print $2}' | grep public/assets/models | grep -v "/marine.glb")
npm run build && node scripts/nextgen/studio.mjs --only=portrait-
```
Diagnostics: `marine.py -- --review --views=g0,g90,g180,g270 [--xray]` (game-camera yaws, undersuit in red),
`atlas_view.py -- out.png <rig> <clip> <frame>` (shipped GLB albedo on the posed mesh),
`hero19_sheet.py -- out.png H img:x0:y0:x1:y1 …` (native / 480×270 / grey rows).

**Packing is not done.** Running the downloaded Khronos `toktx` 4.4.2 was refused by this session's permission
classifier, so `public/assets/models/marine.glb` ships meshopt + shadow LOD with **2048² PNG textures (15.1 MB, was
3.6 MB KTX2)** and `plain/marine.glb` is still the previous model. Before merge, run `pack.mjs` with `TOKTX` set (it
keeps geometry bytes identical and regenerates both files from the main GLB), then restore non-marine model files.

## 5. Verification

| | Before | After |
|---|---|---|
| Max drawn triangles (body + largest rig) | 24,994 | **23,910** (body 20,348 + Arc 3,562; Breacher 3,126, Cryo 3,462, Pyro 3,530) |
| Marine draw calls | body + rig (2) | unchanged (2), shadow LOD re-appended |
| Shader programs within a fight (playtest) | — | flat: 159 / 152 / 147 / 154 at start = mid = clear |
| Playtest `--rig=breacher --seed=1729 --rooms=4 --fast` | — | 4 rooms cleared, 0 errors |

Files: before `artifacts/nextgen/hero19/before-identity.png`, after `artifacts/nextgen/hero19/after-identity.png`
(columns title / selector / calm Crew Checkpoint / Relay Racks crowd / Breacher fight; rows native, 480×270, grey,
grey 480×270), all-rig fights `artifacts/nextgen/hero19/f-play.png`, portraits `hero19/portraits-after2.png`,
motion `hero19/motion/` and `hero19/motion-sheet.png` (run 90°/270°: the dome stays seated, no arm clip),
raw captures `artifacts/nextgen/h19-before/`, `h19-after/`, playtest `artifacts/nextgen/playtest/h19-breacher-1729/`.
`npm run bench` was not run in this session (budget).

What a player sees: on the title, a white-plated marine with a cyan visor and one big yellow "07" dome; in the
selector, the same figure in the same three-quarter, dome and visor toward the viewer; in play (~130 px), a white
figure with dark knees, elbows and waist, a rig-coloured dome riding above the far shoulder that is the largest
colour mass from every yaw, and a cyan visor edge. The dome survives 480×270 in colour; in greyscale it reads as a
mid-grey disc, distinct from the white plates.

## Still weak

1. **Visor size in play.** The aim pose pitches the head into the sights, so from the game camera the visor is a
   cyan rim/sliver, not the title's cyan face; it shows clearly only in the selector and in profile. Next step: a
   small head-pitch counter in the aim clip, or an emissive cyan crown edge on the brow.
2. **Shipping size / packing** (above): KTX2 packing must run before merge.
3. Title undersuit is warm brown under coloured key light; play's is neutral warm grey (kept off brown so it does
   not merge with russet creature masses). The selector figure sits tight against the top of its frame.
