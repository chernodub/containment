# Stream K10 — An original marine and arsenal, modelled from the ground up

You are the **hero character lead**. Read `AGENTS.md` (note: no tests; Blender available; remodelling authorised),
`docs/nextgen/00-VISION.md` (§3 art direction and color meaning, §4 Combat Rig), `docs/nextgen/01-ENGINEERING.md` and
`docs/nextgen/reviews/R10-verdict.md` (F12: rig silhouettes) first.

## Why

The marine and the five weapons are converted third-party models (Unvanquished, CC BY-SA) wearing code-authored rig
modules. The player looks at this figure for the whole game, and it is neither ours nor premium. The owner has
authorised Blender and ground-up remodelling. Build **our** marine.

## What to build

1. **The Containment marine** — an original hard-surface armoured figure designed for a close top-down camera
   (he is 110–140 px tall on screen at 1080p): the read comes from **helmet, shoulders, backpack, forearms and weapon**,
   seen from above and behind at ~55–65°. Chunky readable shapes, clear material breakup (armour plate / undersuit /
   webbing / emissive), a strong top silhouette. Not a copy of any existing game's suit: no Master-Chief, Doom Slayer,
   Space-Marine pauldron, Isaac-Clarke rib-helmet or Helldiver look-alikes. Give him one or two ownable ideas (e.g. an
   asymmetric shoulder with the rig core, a dorsal rig spine that glows in the rig's element, a visor shape).
2. **Four Combat Rig variants** that change the silhouette, not just the color — shared body, different rig modules:
   - **Breacher** (kinetic, amber): heavy ram shoulder/forearm plating, impact pistons, blocky backpack.
   - **Cryo** (ice blue): coolant tanks and finned radiator back, insulated collar, hose runs.
   - **Pyro** (orange): fuel cells, heat-shield apron/shoulder, vented exhaust stacks.
   - **Arc** (violet-white): coil emitters, antenna/capacitor spines, lighter insulated plating.
   The rig must be identifiable from the gameplay camera at 480×270.
3. **Five weapons** (pistol, rifle, shotgun, plasma, rocket) — original designs with distinct top-down silhouettes and
   lengths, a clear muzzle, held correctly by the hands, with muzzle/ejection sockets where the current ones are.
4. Optional if time allows after the above is excellent: title-screen/portrait renders of the new marine per rig for the
   UI (hand them over as PNGs under `public/assets/` and list them under "Integration requests"; do not edit UI code).

## Quality bar and pipeline (Blender, scripted with `bpy`, headless)

- Model with real hard-surface technique: blocked forms → bevels → panel lines/insets → booleans for vents and ports →
  support detail (bolts, latches, cable, straps). Aim ~12–20k triangles for the marine with a rig, 1.5–4k per weapon.
- Textures: bake from the modelled detail — ambient occlusion, curvature/edge wear masks, normal map from a
  higher-detail version where it helps; author base colour in a few flat material zones that work with the game's
  ink contours and banded shading (look at how the current actors are shaded: `src/render/ActorFlatSkin.ts`,
  `ActorSurface.ts`, `MarineRigAnatomy.ts`). One atlas per character variant set if possible; emissive mask for the
  rig core in the rig's element color. Keep texture memory reasonable (≤ 2k atlas).
- **Skeleton contract (hard rule):** another stream (M10) is authoring new animation clips for the marine in Blender
  right now, on the **current** marine skeleton. Keep that armature exactly: same bone names, hierarchy and rest pose
  (import `public/assets/models/marine.glb`, keep its armature, delete the old meshes, skin your new mesh to it; unused
  face bones may stay unweighted). Keep the existing clips in the file working. Proportions therefore follow the
  current skeleton; armour volume, helmet, pack and silhouette are yours.
- Skin weights must deform cleanly through run, strafe, aim twist, crouch and the death pose: rigid plates follow
  single bones, the undersuit blends at joints, no plate interpenetration at 70° torso twist.
- Runtime integration: the game loads the marine through `src/render/models.ts` / `MarineRigAnatomy.ts`; the
  code-authored rig modules there are replaced by your modelled rig variants (keep sockets/attachment names the VFX and
  weapons use). M10 owns the motion code and `src/render/motion/**` — do not edit those; keep your runtime edits to
  model loading, materials and rig-variant selection.
- Generating scripts in `tools/assets/k10-marine/` (one command rebuilds everything), exports replacing
  `public/assets/models/marine.glb` and the five weapon GLBs (or new files plus a loader change), credits updated:
  the new marine and weapons are original MIT work; remove the Unvanquished credit lines only for assets that no longer ship.

## Method

- **Design first, on paper**: write `docs/nextgen/plans/K10-design.md` — the ownable ideas, the four rig silhouettes
  described, material zones, what you deliberately avoid. Render Blender turnarounds (front/side/back/top and the
  gameplay angle) of a grey blockout for all four rigs and look at them at 140 px height before detailing.
- **Critique rounds**: at least four rounds of render → look → fix, written down (`docs/nextgen/plans/K10-review.md`).
  Judge at gameplay size from the gameplay angle first, close-up second. Compare against the current marine in the
  same frame (`npm run capture` in a calm room and in heavy combat, plus the M9 strip tool
  `scripts/nextgen/m9-motion.mjs` for run/fire/hit strips with the new mesh).
- Up to 4 Sol sub-agents (e.g. body, rig modules, weapons, runtime integration) with disjoint files; you review every
  render before accepting.
- Verification: `npm run build`; a bot campaign per rig (`npm run playtest -- --rig=<id> --seed=1729`) finishes without
  errors; `npm run bench` before/after for the heavy-combat scenario (the marine must not cost measurable frame time);
  captures of all four rigs in three rooms, at 1920×1080 and reduced to 480×270.
- No tests, no proof tooling. Do not use computer-use / desktop-control tools. One browser at a time. Commit on your
  worktree branch, clean tree, no push, no PR. Keep `artifacts/nextgen/k10-final/` (turnarounds, in-game before/after
  per rig, strips); delete intermediate rounds.

## Report

`docs/nextgen/K10-REPORT.md`: design summary, triangle/texture numbers, what was replaced, integration requests
(UI portraits, title art), and your honest list of what still looks weak.
