# K12 handoff — second-generation hero marine

Scope delivered (owner scope change, 2026-11-16): the hero marine only — Crown-keel helmet v2, layered armour,
woven undersuit, articulated gloves, boots and the four rig variants, as an in-game mesh on the untouched skeleton
and a full-detail close-up source from the same description; one pose/light setup that renders the four rig
portraits and the title hero layer. Weapons stay K10 (only the glove grip was fixed). Design notes:
`docs/nextgen/plans/K12-design.md`; review log: `docs/nextgen/plans/K12-review.md`; generator:
`tools/assets/k12-hero/` (README there). One command: `sh tools/assets/k12-hero/rebuild.sh`.

## What ships

| Item | Value |
| --- | --- |
| `public/assets/models/marine.glb` | 18.4 MB (K10: 13.6 MB). Nodes `k10-body`, `k10-rig-{breacher,cryo,pyro,arc}`; material extras `k10Original` (runtime contract unchanged, no TS edits). |
| Triangles (game) | body 20,306; Breacher 3,696, Cryo 4,004, Pyro 4,312, Arc 3,840 → max drawn 24,618 (≤ 25k) |
| Textures | one shared 2048² RGB8 set: base colour, tangent normal, AO, emission (emissive strength 4) |
| Close-up source | `artifacts/nextgen/k12-work/hero/marine-hero.glb` (≈ 330k body + 36–46k per rig; rebuilt, gitignored) |
| Portraits | `public/assets/portraits/u10/{rig}-bust.png` (1024² RGBA) + `-256/-640/-1024.webp` (same names/sizes U10's UI loads) |
| Title hero layer | `artifacts/nextgen/k12-final/hero-layer-2560.png` (2560×1440 RGBA, U10 title camera) — not dropped into `public/assets/ui/u10/` because the composite/other plates still show the K10 hero |

Skeleton: `tools/assets/k10-marine/marine-contract.glb` nodes/joints/inverse binds/17 clips are copied byte-for-byte
by `contract.export_marine`; meshes are appended and weighted by bone name. Motion clips in
`public/assets/models/motion/` merge by bone name as before. `tools/assets/k10-marine/rebuild.sh` now rebuilds
the K10 arsenal and delegates the marine to K12, so it can no longer overwrite the new marine.

## Rendering the hero (portraits, title layer, anything new)

- Entry points: `tools/assets/k12-hero/hero.py`
  - `stage_hero(rig, weapon='rifle', brace=True, curl=40.0)` imports the close-up GLB, restores the procedural
    role materials from COLOR_0, applies `stand` (t=.22) + `{weapon}_delta` with K10's verified clip sampler,
    closes the gloves (right: +X flexion; left: −Z × 1.4, the left bone axes are mirrored), normalizes the figure
    to **feet on z=0, 2.1 m tall, centred at the origin** (the frame U10's `stage.py` already uses), attaches the
    shipping K10 weapon at `tag_weapon` and applies the forward brace (ribs −12° Y, head −8° Z, weapon carried with
    the hand). Returns `(objects, meshes, armature)`.
  - `light_rig(rig, scale=1.0, target=(0,0,1.65))`: the single hero light rig — cold rim behind-left
    (−1.5,−1.6,3.0), rig-coloured key front-right (2.6,1.2,2.5), neutral warm key (2.2,2.6,2.2), low floor bounce,
    small visor kicker. AgX Medium High Contrast, exposure −1.1, near-black world.
- `tools/assets/k12-hero/portraits.py`
  - default: four busts (ortho three-quarter camera from (5.4,3.8,.35), framed on everything above z=1.18).
  - `-- --title`: hero plate in U10's title frame — whole hero group rotated 23° about Z, camera at
    (2.7,3.1,1.05) aimed at (0,0,1.25), 44 mm lens, shifts placing the visor (world ≈ (.1,−.08,1.92)) at 73.5 % x /
    62 % y; transparent film. `--preview` writes small review renders; `--hands` renders a grip study.
  - Cycles 128 samples + denoise; the close-up meshes are stored in source units, so `materials.COORD_SCALE` is
    set to 1/6.8 for them (done inside `stage_hero`).

## Gameplay-camera read (follow-up)

The view from above-behind is now mostly light plate: large back carapace, shoulder-blade plates, lumbar, full
back-of-thigh/calf and rear upper-arm plates, ceramic gorget. Rig identity from above: rig-coloured pauldron cap
and first lame on both shoulders (Pyro's heat shield is now orange), the rig pack, a rig-coloured dorsal spine with
a glowing core strip below the pack and a rear collar arc. Game-atlas values are lifted (ceramic .84/.81/.72;
undersuit .12/.14/.16, graphite, gunmetal and rubber lifted likewise via `materials.GAME_VALUE`); the close-up
keeps the darker undersuit. Key art: the dorsal spine glow is visible on the back in three-quarter views.

## For the key-art agent (title set, creatures, haze, layers, ending)

Build the set in the same normalized frame and call `stage_hero` + `light_rig` (or render your set and composite
`hero-layer-2560.png`). Needs around him:
- A motivated rig-colour key source front-right (a practical lamp/emergency light) and something cold behind-left
  to justify the rim; let the visor stay the brightest object on the figure (it is emissive, strength 1.4).
- Contact: a floor under the boots (wet steel reflections), contact shadow/AO; the hero layer has no floor.
- The breach/violet light on the left must not flood the hero front: it reads as rim on his left shoulder at most.
- Haze in front of the hero should be thin (≤ the U10 fog density); the panel lines and stencils are small.
- Re-render all five plates + composite together, then `optimize.py` for `public/assets/ui/u10/`; the
  `hero-*` plate must match the new composite. Keep the calm top-left for the logo/menu.
- HUD/pause/results use the same `portraits/u10/{rig}-bust-*` files, so they are already updated.

## For the integration agent (check in game)

- **Deformation trouble spots** (seen in still poses only; run `scripts/nextgen/m9-motion.mjs` strips for run/strafe/
  fire/hit/casts/death and a 70° twist): rigid chest plates vs abdominal bands at extreme torso twist (ribs vs
  spine weights); hip tassets are thigh-weighted and may clip the belt pouches at high knee lift; the Cryo/Pyro
  hoses use transferred arm weights and can stretch at full arm extension; pauldron caps (upper-arm rigid) can
  intersect the collar on raised-arm casts; glove phalanges are rigid per bone — the left support hand in
  `rifle_delta` floats under short handguards (clip issue, not mesh).
- **Materials**: one material, `k10Original` path (authored atlas; GraphicSurface map response disabled as before).
  The suit reads darker overall than K10 (more visible graphite undersuit); if the banded shader crushes it,
  raise `ceramic_game`/`fabric` values in `materials.PALETTE` and rebake (`marine.py -- --bake`). Emission: visor,
  keel light, sternum light, rig glows. Check the visor/keel light still read from the top-down camera.
- **Sockets**: `tag_weapon`, `tag_head`, `tag_gear` are untouched skeleton nodes; weapon GLBs and `WEAPON_FIT`
  unchanged. Rig selection by node name prefix (`MarineRigAnatomy.originalMarineRig`) unchanged.
- **Budget**: GLB +4 MB (larger PNG atlas from wear detail). If load size matters, re-encode the base colour as
  JPEG in `bake.py` (contract writer supports image/jpeg).
- Run `npm run build`, one calm/heavy capture per rig (`k10-calm-{rig}:<room>`, `k10-heavy-{rig}:<room>`), the
  four bot campaigns and a heavy-combat bench before merging; none were run by K12 beyond one calm + one heavy
  capture (`artifacts/nextgen/k12-r5/`).

## Honest weak list

- Close-up ceramic still a touch clean/even under strong light; chips read best on rig paint. Hazard black stripes
  show sandy chip noise.
- Pauldron caps are still rounded domes under the ridge; the rear helmet is plain.
- Undersuit lofts are unsubdivided in the game LOD (faceting visible only at close range in game).
- The left (support) glove closes but does not touch the K10 rifle handguard in the `rifle_delta` pose.
- Exhaust temper colours are lost in the close-up GLB (no `k12_heat` attribute after import); stacks render plain.
- No motion strips, campaigns or bench were run (dropped from scope).
