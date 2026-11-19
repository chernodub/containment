# BOSS14 handoff — attacking planes, boss presence, elite rank

Branch `t3/original-creature-families` (merged nextgen 78d54032 / VALUE14 first). Modelling only; no runtime, motion or
`src/game/**` change in this pass. Evidence: `artifacts/nextgen/boss14-final/` — `<case>-pair.png` = before|after at 960 px
(top) and 480×270 colour + greyscale (bottom, before left, after right); raw captures in `before/` and `after/`
(bosses in `*/bosses/`). Frozen dists: before = nextgen 78d54032 build, after = this branch.

## What changed per creature

A new texture zone **BONE** (matte pale bone, linear ≈ 0.60/0.55/0.46, never emissive, not the lantern hue) is the
"attacking plane". It is modelled geometry + atlas zone; no shader tint.

| Creature | Change |
|---|---|
| Crawler | Foreleg scythes now whole pale BONE crescents (wider, 0.13 → heavy 0.16); wider pale wedge prow plate; two larger pale forward hooks (tusks). **Elite**: split, raised dorsal plates (left larger) with a tall pale BONE fin between them (replaces the webbed sail; thorax second lantern kept). |
| Stalker | Leading scythe pair = two long pale BONE blades, held face-up with edges outward (width 0.30). **Elite**: one oversized pale hooked forelimb blade on `arm_mid.R`. |
| Spitter | Mortar mouth is pale BONE (the aiming face). **Elite**: second sac (kept) + a pale BONE crest fin riding the main vessel. |
| Brute | Cleavers are wide pale BONE blades (0.8, heavier right) flared outward and face-up so they sit outside the body silhouette; flank armour plates removed and the belly narrowed to open a dark gap under each shoulder. **Elite**: asymmetric pauldrons, the left one overgrown and pale BONE. |
| Brute Warden | Shield-wall (the "radar dish") and crest fin removed. Organic crown: six grown horns rising from the shoulders and sweeping back, asymmetric (left taller), the outer right one **snapped** with a jagged stump, growth rings, fused bone collar plates. Ram face is pale BONE (charge direction); `warden-ram` mask still exported. In-game ≈ **4.4 m** (2.1× marine), rank scale 2.3. |
| Carrier | Fore-claws pale BONE. **Elite**: the thorax shield is now an asymmetric pale BONE plate. |
| Carrier Matron | Now her **own full skin** (`RANK_PARTS = {"boss": ["boss"]}` in `carrier.py`), not base + addons: heavy low thorax, small armoured head with pale prow and BONE mandibles, splayed uneven legs (per-leg girth 1.25–1.95×, armoured knee plates, planted pads), a huge veined brood sac rising behind with twelve shapes glowing through the skin, three `matron-vents` hatch vents, egg clusters along both thorax flanks, and a stained **ground decal** skinned to the static `root` bone (presentation only). Rank scale 1.9 → ≈ **5.0 m** (2.4× marine). |

Triangles (unchanged budgets): Crawler 7.6k/9.0k, Stalker 8.8k/10.2k, Spitter 9.5k/10.9k, Brute 11.5k/13.1k/**21.5k**,
Carrier 11.0k/12.5k/**21.0k** (base/elite/boss). Atlases unchanged in size (1024 small castes, 2048 Brute/Carrier; glow at half).

## Collider request (simulation owner)

- **Matron**: drawn footprint radius = 0.75 m × 1.9 = **1.43 m** (≈ 46 sim units; today 34). Raise her radius to **46** and
  scale her hatch-spawn ring to 1.9–2.5 m from her centre; vents sit at ≈ 2.5–3.5 m height on the sac's low flanks/back.
- **Warden**: unchanged (drawn 2.0 m = existing 64 units). The ram front is now the pale face ≈ 1.5 m ahead of centre.

## Rebuild / ship

```sh
for c in crawler stalker spitter brute carrier; do blender -b --factory-startup -P tools/assets/k11-creatures/build.py -- --caste=$c; done
node tools/assets/i11-models/optimize.mjs
git checkout -- public/assets/models/marine.glb            # optimize repacks already-packed files
TOKTX=/tmp/t12-ktx/KTX-Software-4.4.2-Darwin-arm64-tools.pkg/Payload/usr/local/bin/toktx node tools/assets/t12-textures/pack.mjs
node tools/assets/i11-models/lod.mjs
for n in marine pistol rifle shotgun plasma rocket; do git checkout -- public/assets/models/$n.glb public/assets/models/plain/$n.glb; done
npm run build
```
`pack.mjs` resolved the marine/weapons from a stale source (no `artifacts/nextgen/t12-source-models/` cache in this
worktree) — they are restored from git as above. Confirmed the shipped creature files are new: KTX2 main + PNG `plain/`,
boss nodes carry `k11RankScale` (2.3 / 1.9) and `_K11REGION`, boss triangle counts 21.5k / 21.0k, one `__lod_low` sibling each.
The PNG-image creature sources used for packing are reproducible from the generators (no cache needed).

## Verification

`npm run build` passes. Captures: 12 capture scenarios + 2 native boss cases, 0 failures/errors. Campaign
`npm run playtest -- --rig=breacher --seed=1729 --rooms=6`: 6 rooms cleared, 0 errors.

## Still weak / for Sol

- At 480×270 the single-elite captures are tiny; only the Crawler's pale dorsal plate is unmistakable. Stalker/Spitter elite
  features read at native size but deserve a dedicated close-crop review and possibly larger proportions.
- Stalker elite: its widened blade raises the footprint radius, so the horizontal collider fit shrinks the whole elite ~15%
  (`stats.json` elite estimate 1.12 m vs base 1.30 m). Consider allowing elites a larger visual radius.
- Matron sac: shapes glow through but the silhouette still reads partly as one long tube from some angles; vents face
  away from the camera when she faces the marine. Her corpse/ragdoll with the full skin was captured but not reviewed in depth.
- Brute cleavers: pale planes now sit outside the silhouette, but in rear views (marine behind the camera line) the body still
  occludes them; MOTION14's new clips should keep the arms spread in wind-up.
- Re-check Warden charge wind-up/stun and Matron hatch on the MOTION14 clips once merged (horns and the full Matron skin are
  rigid on `chest` / blended `tail`→`tip`).
