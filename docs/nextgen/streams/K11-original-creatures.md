# Stream K11 — Original creature families (Opus modelling stream)

You are the **creature art lead**. Owner decision 2026-11-16: 3D modelling is done by Claude Opus. Read `AGENTS.md`
(no tests; Blender available; remodelling authorised), `docs/nextgen/00-VISION.md` (§3 colour meaning),
`docs/nextgen/01-ENGINEERING.md`, `docs/nextgen/streams/W4-direction.md`, `docs/nextgen/K10-REPORT.md`,
`docs/nextgen/M10-REPORT.md`, `docs/nextgen/B10-REPORT.md` and `scripts/nextgen/README.md` first.

## Why

The five alien models (`public/assets/models/dretch.glb`, `basilisk.glb`, `marauder.glb`, `dragoon.glb`,
`tyrant.glb`) are converted third-party meshes (Unvanquished, CC BY-SA) with code-authored anatomy on top
(`src/render/FamilyAnatomy.ts`, K7). They are the last borrowed characters. Replace them with our own species.

**The bar is high, because the current creatures already look good in play.** Open
`/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/reference/current-creatures-coolant.png`: detailed,
menacing, readable. A previous attempt (branch `t3/k11-sol-wip`, sample
`artifacts/nextgen/reference/rejected-sol-brute.png`) was rejected: capsule limbs and smooth shells that read as wooden
toys. Your creatures must be clearly **better than the current ones** in the same frame, or they do not ship.

## What to build

One species, five castes, plus elites and two boss-class variants. Map each caste to the game family through
`src/render/ActorIdentity.ts`, `FamilyAnatomy.ts`, `models.ts`: Crawler (small swarmer), Stalker (pouncer),
Spitter (ranged), Brute (heavy), Carrier (brood-bearer); elites; Brute Warden; Carrier Matron.

- An ownable anatomy idea shared by all castes (write it down first): e.g. layered overlapping chitin with torn
  membrane between plates, an exposed bioluminescent organ whose colour marks the caste's danger, asymmetry, real
  joints with tendon and sinew, claws/mandibles/spines with weight. Not a copy of any known alien: no xenomorph domed
  heads, no zergling/hydralisk, no headcrab/facehugger, no Starship Troopers arachnid.
- Organic sculptural quality: real muscle and shell forms with secondary and tertiary shapes (ridges, pitting, growth
  rings, scars, wet membranes), not primitives. Use whatever Blender gives you — sculpt-like workflows through
  `bpy` (metaballs/skin modifier/remesh + displacement, multires, lattice shaping), subdivision modelling, shells
  taken from the body surface — then retopologise/decimate to game budgets and **bake** normal, AO, curvature and
  thickness from the high-detail version. 6–14k triangles per regular creature, up to ~22k for boss-class.
- Top-down readability at 480×270: each caste identifiable by silhouette and one colour note; attack limbs large and
  readable (wind-up poses depend on them); a warm organic palette clearly apart from the white-and-rig-colour marine
  and the cool ship; flat readable material zones that work with the game's ink contours and banded shading
  (`src/render/ActorFlatSkin.ts`, `vfx/ActorSurface.ts`); emissive mask for the organ; elites get a visible crest /
  heavier plating / brighter organ, not a tint.
- Crowds of 25 must stay in budget: one atlas per family (≤ 2k), minimal materials, existing skinning/batching
  contracts (`ActorSkinBatching.ts`).

## Skeleton contract (hard rule)

Animation clips per family were authored on the **current** skeletons and ship as separate animation-only GLBs merged
by bone name (`public/assets/models/motion/`, sources `tools/assets/m10-motion/`). Import each existing creature GLB,
keep its armature exactly (bone names, hierarchy, rest pose), delete the old meshes, skin your mesh to it. Proportions
follow the skeletons; mass, shells, heads, limb volume and silhouette are yours. Every clip (run, wind-up, strike,
recovery, pain, stagger, deaths, breach entrance) must deform cleanly — check with the strip tool
(`scripts/nextgen/m9-motion.mjs`). Ragdoll bodies (`DeathRagdolls.ts`) must still fit. The code-authored anatomy that
dressed the old meshes is replaced by your models; keep socket/attachment names VFX use. The `t3/k11-sol-wip` branch
contains loader/contract/baking scaffolding you may read or cherry-pick; its meshes are rejected.

## Method

1. `docs/nextgen/plans/K11-design.md`: the species idea and a rendered silhouette sheet of all castes at gameplay size.
2. **Crawler to final quality as the standard**: at least five render → look → fix rounds, written in
   `docs/nextgen/plans/K11-review.md`. Each round: a beauty render (~1200 px, three-quarter, dramatic light), the
   gameplay-angle render at in-game pixel size, and an in-game capture of a 20-crawler crowd next to the marine,
   side by side with the current crawler. Judge honestly: would this be mistaken for a shipped stylised game's
   creature? Is it better than the current one? If a round does not move toward that, change technique.
3. Then the other castes. You may run up to 4 sub-agents **on the Opus model** (one per caste, disjoint files);
   review every render yourself before accepting.
4. Portrait per caste (transparent, ~1024 px) under `public/assets/portraits/k11/` for a future bestiary.

## Ownership and verification

You own the creature model files, `tools/assets/k11-creatures/`, and enemy model loading/materials/anatomy modules.
Do not edit motion code or clips, world/lighting, UI, audio, simulation or the playtest bot; other streams are editing
the marine (`tools/assets/k10-marine/`, marine/weapon GLBs), environment props (`tools/assets/e9-ship-kit/`, world
modules) and UI/difficulty. Keep `DepthRenderer.ts` edits tiny and delimited.

No tests. Verify: `npm run build`; captures of every caste calm and in a 20-enemy crowd in three rooms (pale Crew
Checkpoint, dark Relay Racks, Infested Workshop) at 1920×1080 and 480×270 with before/after sheets; attack/hit/death
strips per caste; one bot campaign per rig (`npm run playtest -- --rig=<id> --seed=1729`) finishing without errors;
`npm run bench` heavy combat before/after (note host load — other streams are running). Do not use computer-use tools.
One browser at a time. Generating scripts rebuild everything with one command. Credits: remove the Unvanquished lines
for models that no longer ship. Keep `artifacts/nextgen/k11-final/`, delete intermediates. Commit on your worktree
branch, clean tree, no push, no PR.

Report: `docs/nextgen/K11-REPORT.md` — species design, numbers, what was replaced, integration requests, honest weak list.
