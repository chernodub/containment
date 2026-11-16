# Stream K12 — Hero-quality marine, arsenal and key art (Opus modelling stream)

You are the **hero art lead**. Owner decision 2026-11-16: 3D modelling is done by Claude Opus. Read `AGENTS.md`
(no tests; Blender available), `docs/nextgen/00-VISION.md`, `docs/nextgen/01-ENGINEERING.md`,
`docs/nextgen/streams/K10-original-marine.md`, `docs/nextgen/K10-REPORT.md`, `docs/nextgen/U10-REPORT.md` and
`scripts/nextgen/README.md` first.

## Situation

K10 built an original marine with four colour-blocked rig variants (Breacher amber, Cryo ice blue, Pyro orange, Arc
violet) and five weapons; U10 rendered a title key image, rig-select portraits and an ending image from it. At
gameplay size he reads well. **In close-up he reads as a vinyl toy**: open
`/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/reference/current-title.png` — a smooth egg helmet, a
balloon pauldron, featureless ceramic, mitten-like hands on a blocky gun, in a dark empty set with a creature that is
barely visible. This is the first image of the game. Make it worthy.

## Deliver

1. **Marine, second generation** (same design language and colour blocking, far more craft). Hard-surface work at the
   level of a hero asset: designed helmet (visor with depth and frame, vents, sensor cluster, neck seal), layered armour
   with real thickness and overlap, panel lines, chamfers, fasteners, hoses and cable routing with clamps, undersuit
   with ribbing/weave at joints, articulated gloves with separate fingers gripping the weapon correctly, boots with
   soles and buckles, rig modules with mechanical logic (pistons, tanks with valves and gauges, coils with windings,
   exhausts with heat discolouration). Surface story: unit markings, numbering, hazard stripes, scratches and edge
   wear, grime in recesses — baked. Two LODs from one source: an in-game mesh (≤ 25k triangles with rig, ≤ 2k atlas,
   flat readable zones for the ink/banded shader) and a close-up render version (subdivided, full detail) for key art
   and portraits. Original design — no look-alike of an existing game's armour.
2. **Five weapons, second generation**: designed side profiles, real mechanical parts (bolt, charging handle, magazine,
   rails, sights, muzzle devices, vents, energy cores with emissive), distinct top-down silhouettes and lengths;
   in-game ≤ 5k triangles each, close-up version for renders. Keep muzzle/ejection socket names and positions usable.
3. **Skeleton contract (hard rule)**: keep the current marine armature exactly (bone names, hierarchy, rest pose);
   authored animation clips ship separately (`public/assets/models/motion/marine-motion.glb`) and must keep working.
   Check deformation with the strip tool (`scripts/nextgen/m9-motion.mjs`) for run/strafe/fire/hit/casts/death and
   a 70° torso twist.
4. **Title key art, re-rendered** (`tools/assets/u10-keyart/`): hero large on the right third, three-quarter, low
   camera; strong rim and motivated key light, glowing visor as the focal point; a breached bulkhead on the left with
   violet light and haze, creature silhouettes at several depths with readable limbs and eye glints (use the current
   creature models, or stream K11's new ones if they are merged by then); a rich ship set built from the E9 kit
   (`tools/assets/e9-ship-kit/`) with real detail — pipes, cables, signage, floor grating, steam, sparks, debris;
   depth of field, volumetrics, wet-floor reflections; a calm dark area top-left for the logo and menu. Cycles, high
   samples, denoised. Deliver the same layer set U10's title code expects (check `src/ui/screens/title/` and
   `public/assets/ui/` for names and sizes) so it drops in without UI code changes; if a layout tweak is unavoidable,
   keep it minimal and keep `#start`, `#continue`, `#settings`.
5. **Rig-select portraits, HUD/pause/results figures and the ending image re-rendered** from the new model with the
   same file names/sizes.

## Method

- Design sheet first (`docs/nextgen/plans/K12-design.md`): helmet options rendered, chosen with reasons.
- At least six written render → look → fix rounds (`docs/nextgen/plans/K12-review.md`): close-up beauty render at
  ~1600 px, gameplay-angle render at in-game pixel size (four rigs side by side), in-game capture in a calm room and
  in heavy combat next to the K10 version. Bar: the close-up render, shown without context, is taken for a
  professional stylised game character; the title image at 480×270 reads "armoured hero, something terrible coming
  through the wall" and at 1920×1080 rewards looking.
- Up to 4 sub-agents **on the Opus model** (helmet/body, rig modules, weapons, key-art set and lighting) with
  disjoint files; you review every render.

## Ownership and verification

You own `tools/assets/k10-marine/`, `tools/assets/u10-keyart/`, `public/assets/models/marine.glb` and the weapon GLBs,
`public/assets/portraits/k10/`, the title/ending image assets under `public/assets/ui/`, and marine/weapon model
loading and materials (`src/render/models.ts`, `MarineRigAnatomy.ts`, `weapons.ts` loading parts). Do not edit motion
code/clips, creature models (stream K11), world/props (stream P11), UI logic or simulation.

No tests. Verify: `npm run build`; captures of title, rig select (all four), pause, results, ending at 1920×1080 and
1280×720; four rigs in three rooms at 1920×1080 and 480×270; one bot campaign per rig finishing without errors;
`npm run bench` heavy combat before/after with host load noted. Do not use computer-use tools. One browser at a time.
One command rebuilds every asset. Keep `artifacts/nextgen/k12-final/`, delete intermediates. Commit on your worktree
branch, clean tree, no push, no PR.

Report: `docs/nextgen/K12-REPORT.md` — what changed, numbers, image weights, honest weak list.
