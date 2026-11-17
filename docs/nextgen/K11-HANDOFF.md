# K11 handoff — Lantern Brood integration (for the integration agent)

Opus modelled the five castes; you finish verification and cleanup. Species note: `docs/nextgen/plans/K11-design.md`.
Rebuild everything: `sh tools/assets/k11-creatures/rebuild.sh` (~8 min, Blender 5.3). Review renders (not in git):
`artifacts/nextgen/k11-final/<caste>/{beauty,gameplay,pose-attack,pose-die}.png`. "Before" captures of all 30
fixtures: `artifacts/nextgen/k11-before/` (frozen pre-K11 dist was `/tmp/k11/dist-before`, rebuild from commit `8027d543` if gone).

## What shipped

| Caste | GLB (overwritten) | Ranks (mesh nodes) | Triangles base / elite / boss | Atlas |
|---|---|---|---|---|
| Crawler | `public/assets/models/dretch.glb` | `k11-crawler-base`, `-elite` | 7.6k / 9.0k / – | 1024 base+normal, 512 glow |
| Stalker | `basilisk.glb` | `k11-stalker-base`, `-elite` | 8.8k / 10.2k / – | 1024 / 512 |
| Spitter | `marauder.glb` | `k11-spitter-base`, `-elite` | 9.5k / 10.9k / – | 1024 / 512 |
| Brute (+Warden) | `tyrant.glb` | `k11-brute-base`, `-elite`, `-boss` | 11.5k / 13.1k / 17.3k | 2048 / 1024 |
| Carrier (+Matron) | `dragoon.glb` | `k11-carrier-base`, `-elite`, `-boss` | 11.0k / 12.5k / 17.0k | 2048 / 1024 |

Each GLB keeps the legacy skeleton/inverse binds/clips byte-exact (`tools/assets/k11-creatures/contracts/`) and appends
one material (`k11-<family>`, extras `k11Original`) with baseColor (AO baked in), tangent normal (scale .8), emissive
(glow mask) + `KHR_materials_emissive_strength`. Rank variants are full skins sharing one atlas; mesh-node extras carry
`k11Aspect` and `k11Family`. All 5 skeletons' joint names/hierarchy/rest are untouched; M10 motion GLBs merge by name.

## Runtime changes (already in the branch)

- `src/render/OriginalCreatureAnatomy.ts` (from the Sol scaffolding): hides non-base rank skins at registration,
  swaps rank geometry (base/elite/boss) on one SkinnedMesh, replaces the K7 identity overlay with an invisible stub,
  shares frost geometry per rank.
- `ActorFlatSkin.ts`, `ActorIdentity.ts`, `ActorRegions.ts`: early-outs for `k11Original` (authored finish; no region recolour).
- `models.ts` `rig()`: if a mesh node has `k11Aspect`, vertical scale = collider-fitted horizontal scale × aspect
  (no more horizontal-only squash). Legacy brute/stalker squash factors are skipped for K11 meshes. `alien()`: no family
  colour multiply; emissive intensity = authored strength × (1 + .28 elite + .45 champion + 1.8 × wind-up progress), ×.1 dead.
- `DepthRenderer.ts` (one delimited edit from Sol): warm-up promotes one Brute/Carrier to warden/matron so the boss rank compiles in `prepare`.
- `scripts/nextgen/k11-scenarios.mjs`: `k11-calm-<family>:<room>` / `k11-crowd-<family>:<room>` art fixtures (≥10 of 20 bodies for heavy families).

## You must do / check

1. `npm run build`; 30-shot capture matrix `k11-{calm,crowd}-{crawler,stalker,spitter,brute,carrier}:{crew-checkpoint,relay-racks,infested-workshop}`
   at 1920×1080 + 480×270 and before/after sheets against `k11-before`. Only crew-checkpoint crowds (+ crawler relay-racks) were looked at by Opus.
2. M9/M10 strips per caste (`node scripts/nextgen/m9-motion.mjs --subjects=crawler,stalker,spitter,brute,carrier --actions=attack,heavy-hit,death`).
   Opus only checked legacy `attack`/`die` poses in Blender (pose-*.png). Trouble spots to watch:
   - **Crawler**: mandible hooks are weighted to `antenna_left1/right1`; if antennae clips swing wide, re-tag them to `chest` in `crawler.py`. Scythes are rigid on `leg0/5_lower`.
   - **Stalker**: neck plates on `chest/neck_lo/neck_hi`; check the neck at full strike extension. Sting on `sting`.
   - **Spitter**: legs are 8-bone zigzag chains; knee membranes are blended spheres — check the high arch (`leg_m3/leg_b3`) during run for pinching. Acid vessel blends `bum`→`spine1`.
   - **Brute**: forearm gauntlet plates are rigid on `forearm.*`; elbow tendon blends shoulder/forearm. Small arms' finger claws are single cones on `finger*.1.*`. The legacy Queen (legacy saves only) also uses `tyrant.glb` and gets the K11 brute mesh under the old Queen overlay — confirm the `boss` capture still looks acceptable or give the Queen its own asset.
   - **Carrier**: legs skip the twin `leg_*.005` bones (weights go to `.002`, its child) — verify no stretching at the upper knee. Brood bulb blends `tail`→`tip`; check the raised tail in `charge`/attack.
3. Ragdolls (`DeathRagdolls.ts`) fit boxes from skin vertices per anatomical bone, so they adapt automatically; verify one death per caste does not explode (large carrier/brute claws are long rigid blades on `claw.*`).
4. Elite rim / champion visuals: existing ActorSurface rim still applies (orange halo on elites in captures). Decide whether to keep.
5. Health-bar/framing: `alien().height` uses Sol's K11 branch (×1.12 / ×1.3 stalker, ×1.25 elite, ×1.4 champion); check bar placement over the new heights (crawler .79 m, stalker 1.2 m, spitter 1.7 m, brute 1.6 m, carrier 2.7 m design estimates).
6. One bot campaign per rig (`npm run playtest -- --rig=<id> --seed=1729`) and `npm run bench` heavy combat before/after (GLBs grew: 3.3–7.9 MB each; texture memory ≈ 2×2k+512/1k per heavy family).
7. Credits: remove the Unvanquished *model/texture* lines for the five creatures from `public/asset-credits.html` / README, but **keep** the skeleton + animation attribution (contracts and clips are still the CC BY-SA originals).
8. Remove now-dead K7 anatomy for these families only after the above passes (`FamilyAnatomy.ts` is still used by the legacy path; the Queen still uses `QueenDesign`).
9. Portraits for a bestiary were not made; `beauty.png` per caste is a starting point.

## Known weak points (honest)

- At gameplay size the castes read by silhouette + lantern colour; plate detail is mostly lost at 480×270. Growth rings are subtle by design.
- Crawler/Stalker smaller and leaner than the legacy stilt creatures; Stalker is the weakest in presence (thin legs, dark shell).
- Leg segments are smooth round cones — the least sculptural parts; Spitter legs read as plain tubes.
- Carrier head plate with eye dots can read slightly "face-like".
- No tertiary displacement (pitting/scars) yet; `sdf.worley` is in place for it.

## Second pass (2026-11-17) — what changed for integration

Rebuild order unchanged: `sh tools/assets/k11-creatures/rebuild.sh` → `node tools/assets/i11-models/optimize.mjs` → `npm run build`.
Skeleton contract, rank node names (`k11-<family>-base|elite|boss`), material layout (base/normal/glow, 3 textures) and
`k11Aspect` extras are unchanged; no runtime code changed in this pass. Triangle budgets unchanged (≤ 11.5k regular, ≤ 17.3k boss).

Shared (all castes, `species.py` / `build.py`):
- Limbs are `armour_segment`s: dark core tube + pale ARMOR plate on the outward face; `knuckle` joints (wet flesh sleeve + pale ring); `foot` pads with splayed claws on the floor plane. Spurs removed (they became black tangles at 40 px).
- New zones ARMOR and FLESH. Baked-only surface character (`tertiary`): worley pitting and random scars on hard shell, creased wet flesh; pale wet highlights on flesh; flesh/organ creases darkened less.
- `GLOW_PODS` (carrier): soft skin near pods receives glow + organ tint with distance falloff (fake translucency, glow texture only).

Per caste:
- Crawler: twice-thicker plated legs with planted feet, broad shovel prow with pale tusks, wet waist seam. Elite: tall webbed bone sail + a second lantern on the thorax.
- Stalker: bulkier thorax/abdomen with pale banded ARMOR shingles, light dorsal ridge head→sting, 60 % larger violet lantern, armoured raptorial arms with longer blades, thick armoured stilt legs. Elite: overgrown second bone scythe on the right arm (`arm_mid.R`) + dorsal spines.
- Spitter: armoured arched legs ×1.5 girth with knuckles and feet. Elite: second ribbed acid vessel on the neck root (weights blend `spine2`→`neck`).
- Brute: wider, lower forequarters, hanging flesh belly with armour flank plates, pillar legs (r .95/.72) with foot pads, darker armour value. Elite: stacked pale pauldrons + shoulder horns. Warden: broad asymmetric bone shield over the left crusher (`forearm.l`) and a blunt bone battering ram on the brow (`head`) for the charge; knuckle bosses on the right forearm.
- Carrier: brood sac now sags low and back as bare stretched flesh (mantle only at root/flanks) with pods glowing through, sinew straps, and a lipped glowing brood opening at the low rear (`tip`); legs ×1.45 girth. Elite: one great horned bone shield over the thorax. Matron: hugely expanded brood mass behind/below with three glowing hatching vents (pod-hatching source) and four attendant pods on sinew stalks on the thorax flanks.

Check during integration:
- Motion strips for the new mass: brute belly (`chest`/`tail` blend), carrier sagging sac when the tail lifts (`tail`→`tip` blend), stalker elite blade on `arm_mid.R`, spitter elite vessel on the neck.
- Footprint radius grew slightly (feet pads): in-game scale dropped ~5–10 % for crawler/brute; aspect raised for brute (1.8) to compensate.
- Ragdoll boxes still fit from skin vertices; the heavier warden shield/ram are rigid on `forearm.l`/`head`.

## Third pass (2026-11-17) — boss tier, brood pod, silhouette fixes

Skeleton contract unchanged (bone names, hierarchy, rest pose, inverse binds, clips). Rank node names unchanged.

### Boss tier: sizes for the integration agent

Each boss rank skin carries node extras `k11RankScale`. The loader (`OriginalCreatureAnatomy.originalCreatureFootprints`,
`models.ts` `fitFootprint`) now applies it **uniformly** when the champion rank is selected: horizontal fit =
`k11RankScale × nativeRadius × 0.94 / radial(boss skin)`, vertical × `k11RankScale`, feet kept on the deck by offsetting the
asset origin (`groundY × (scale − 1)`). The drawn footprint therefore assumes the native collider is scaled by the same factor —
**you must scale the Warden/Matron collision radius and attack footprints** (simulation side, not done here).

| Rank | `k11RankScale` | In-game height (rest, est.) | Collider radius to use | Attack geometry |
|---|---:|---:|---:|---|
| Brute Warden | 2.3 | ≈ 4.0 m (≈ 1.95 × marine 2.05 m) | 0.875 × 2.3 = **2.0 m** | Ram front ≈ 1.4 m ahead of the body centre at rest (inside the collider): charge strike = capsule of radius 2.0 m swept ≥ 1.2 m beyond the collider edge; ram top ≈ 2.6 m |
| Carrier Matron | 1.4 | ≈ 4.6 m (spire top; ≈ 2.2 × marine) | 0.75 × 1.4 = **1.05 m** | Hatch vents at ≈ 3.2 / 3.7 / 4.1 m height on the spire, facing front-right, back and front-left; spawn hatchlings/pods on a ring of 1.6–2.2 m from the centre |
| Regular Brute / Carrier | 1 | 1.48 m / 2.02 m | 0.875 / 0.75 m | unchanged |

Per-rank estimates are written to `artifacts/nextgen/k11-final/<caste>/stats.json` (`*_estimate`). Health-bar height uses the
selected rank's skin bounds — verify it clears the scaled boss (it reads `assetRoot` scale through the world matrix).

### Named emission regions (now authored, not hard-coded)

`_K11REGION` (VEC2 float, x = **`warden-ram`**, y = **`matron-vents`**) is exported on the boss skins from named sculpture
primitives; `prepareEmissionRegions` uses it when present (the old hard-coded positions remain only as fallback). Warden:
the whole battering ram and its brow cheek bosses. Matron: the three ribbed vents (lips + glowing cores). The meshopt geometry
pack preserves the attribute (checked); keep it through the T12/LOD steps (`lod.mjs` reuses vertex accessors, so it should).

### Anatomy changes

- **Warden**: one broad leaning bone shield-wall on the left flank rising above the back (struts into the chest, bound to
  `chest` so arm swings pass inside it), a continuous sagittal crest fin brow→hind (no spikes), a massive blunt brow ram
  (`head`) with cheek bosses, right forearm knuckle bosses. Boss rank 21.5k tris.
- **Matron**: brood mass with mantle shingles, a three-chamber ribbed brood spire leaning back (`tail`→`tail.001` blend)
  with three vents and a crown lantern, two hanging pod clusters per side on sinew stalks (`tail`/`tip` blend), four
  attendant stalks with pod bulbs rising from the thorax (`body*`). Boss rank 21.5k tris.
- **Carrier** (all ranks): sac lowered and heavier, middle/hind legs 1.15×/1.4× girth, sinew slings from the upper legs into the sac.
- **Stalker**: flared shoulder hood plates on `arm_up.*`, scythes widened (0.26) and held flat-face-up with edges outward.
  Note: the horizontal collider fit shrinks the whole stalker as its silhouette widens, so the 40 px gain is modest; if more is
  wanted, raise the stalker's visual radius allowance or `ASPECT` in `stalker.py`.
- **Spitter**: ribbed glowing acid duct (ORGAN zone, follows `spine1→spine2→neck→head→jaw`) from the vessel along the neck crest
  into the mortar mouth, with sinew collars.

### Brood pod asset (new)

`public/assets/brood-growth/brood-pod.glb` (+ `brood-pod-normal.png` 512, `manifest-pod.json`), rebuild
`sh tools/assets/k11-creatures/growth/rebuild.sh --set=pod`. Static P11-format meshes (COLOR_0 × normal atlas):
nodes **`brood-pod`** and **`brood-pod-hatching`** (1.5k tris each, 0.95 m tall, bottom-centred floor cup with rooted spill).
Finishes: `brood-pod-shell` (opaque) and **`pod-core`** (emissive magenta core seen through six rib slits; the hatching
variant splits the crown and bulges the core out). Drive `pod-core` emissiveIntensity ≈ 0.3 → 3.0 as the hatch countdown and
swap to `brood-pod-hatching` for the final ~0.5 s. Replace the stationary-Crawler stand-in with these meshes (not skinned).

### Repack (toktx was not available on this machine — run these)

```sh
sh tools/assets/k11-creatures/rebuild.sh                 # all five creature GLBs (PNG source images)
node tools/assets/i11-models/optimize.mjs                # geometry pack (already run for brute/carrier/stalker/spitter)
TOKTX=/path/to/toktx node tools/assets/t12-textures/pack.mjs   # KTX2 shipping + plain/ PNG fallbacks
node tools/assets/i11-models/lod.mjs                     # PERF13 base-rank LOD siblings on both sets
npm run build
```
Until T12 is rerun, `public/assets/models/*.glb` hold the new geometry with PNG images (loads fine on the KTX path) while
`public/assets/models/plain/` still holds the previous fallback set. The growth kit/pod use their own packers
(`tools/assets/t12-textures/pack-brood.mjs`, `tools/assets/i11-models/brood-lod.mjs`) — include `brood-pod.glb` there.

### Check in the clips

- Warden **charge**: the ram leads, the shield-wall must not cut through the left crusher at full swing (it is on `chest`);
  watch the crest fin on hard head pitches. Scale 2.3 magnifies any knee/shoulder pinching — check run and charge strips.
- Matron **hatch**: vents face outward from the spire; the spire follows the tail lift (`tail`→`tail.001`), hanging pod clusters
  swing with the brood (`tail`/`tip`); check death/ragdoll (tall spire may need the corpse slump noted in I11).
- Carrier slings blend leg→`tail`: verify no stretching on long strides; Stalker hood on `arm_up` during strikes.
