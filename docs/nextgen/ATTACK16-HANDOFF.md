# ATTACK16 handoff — striking planes, structural elite rank, Brute shape

Branch `t3/original-creature-families` (merged nextgen 5292fff9). Modelling only: no `src/**`, motion clips or skeleton
changes. Evidence (untracked): `artifacts/nextgen/attack16-final/<case>-pair.png` — before|after at 960 px on top, and
480×270 colour + greyscale below (before left, after right); raw frames in `attack16-before/` and `attack16-after/`
(frozen dists: before = nextgen 5292fff9 build, after = this branch). Cases: mixed crowds in Relay Racks, Crew Checkpoint
and Swarm Junction; each family's calm and attack frames; every family's regular and elite isolate; a twenty-Brute frame.

## What changed per creature

The attacking plane is the BONE atlas zone (matte pale bone, now linear 0.72/0.67/0.56; never emissive, not a lantern hue).
All elites are drawn **1.12×** their regular (`RANK_SCALE["elite"]` → `k11RankScale` on the elite node; the I14 loader draws
elites at base fit × that scale, so the elite features are extra, not shrinking the body).

| Creature | Regular | Elite |
|---|---|---|
| Crawler | Wide pale wedge head-plate turned up toward the camera; two broad pale hooks sweep out from its corners and curl in — a "C" from above, with a dark gap to the head plate. Foreleg scythes stay pale. | Forked, raised dorsal shell: two plates splayed up like a V, each carrying a tall pale triple-blade fin (the "double fin"); thorax second lantern kept. |
| Stalker | Two long, broad pale scythes (width 0.52, about body length) from the wrists, folded back along the flanks flat face up, edges outward, with a dark gap to the body; MOTION16's wind-up lifts them and the outline opens visibly (see stalker attack pairs). | One hugely exaggerated hooked scythe on the right wrist (`claw.R`, width 0.62, much longer), plus dorsal spines. |
| Spitter | (unchanged since BOSS14: pale mortar mouth) | Twin sacs kept; the pale crest is now tall (≈ 2× before). |
| Brute | Shape only (no resize): a tall shoulder hump with two shingle rows on top of the chest, and longer, wider pale cleavers (width 1.0, reaching further forward/out). Body width unchanged. | One overgrown pale shoulder-blade horn on the left (rank and loaded side in one shape) plus a smaller plate; the Warden no longer includes the elite add-on (`RANK_PARTS`). |
| Carrier | (pale fore-claws since BOSS14) | Asymmetric pale shield kept, plus a second visible brood cluster (four glowing pods on a flesh bed) on the other thorax flank. |

Triangles and atlases unchanged: Crawler 7.6k/9.0k, Stalker 8.8k/10.2k, Spitter 9.5k/10.9k, Brute 11.5k/13.1k/boss 19.9k
(Warden lost the elite add-on), Carrier 11.0k/12.5k/21.0k; atlases 1024 (small castes) / 2048 (Brute, Carrier).

## Brute model-space numbers (for RIG16)

At the current loader fit (collider 28 units = 0.875 m): drawn height **1.54 m**, horizontal footprint radius 0.94 × 0.875 =
0.82 m, design radial 5.25 units, 0.1566 m per design unit (was 1.43 m / 0.1649 before ATTACK16 — the longer cleavers raise the
radial ~5%, the hump adds ~0.11 m). At any uniform runtime scale s the drawn height is 1.54 s m. To reach 1.4–1.5× the marine
(2.05 m → 2.9–3.1 m), s ≈ 1.9–2.0, i.e. a simulated radius of ≈ 53–56 units if the footprint keeps tracking the collider.

## Collider notes

- Stalker: the wider scythes extend the base footprint, so the loader's collider fit draws the body ~8% smaller
  (0.2368 vs 0.2562 m/unit). If that matters, raise the Stalker's simulated radius from 17 to ≈ 18.5 units (drawn body back to
  the previous size), or let the loader fit stalkers by body only.
- Crawler: hooks cost ~3% (0.3476 vs 0.3578 m/unit); no request.
- No other collider requests from this pass (Matron 46 / Warden 64 unchanged).

## Clips

Checked the native attack frames (wind-up → strike → recovery) on MOTION16 clips: Stalker scythes open away from the head and
stay visible; Crawler hooks remain visible but small. No clip was found that hides a plane; worth a look for the motion stream:
the Crawler's strike rotates the head down so the wedge foreshortens for ~2 frames, and the Brute's rear-facing recovery still
puts the body between camera and cleavers.

## Rebuild / ship

```sh
for c in crawler stalker spitter brute carrier; do blender -b --factory-startup -P tools/assets/k11-creatures/build.py -- --caste=$c; done
sh tools/assets/k11-creatures/boss14/ship.sh      # optimize -> KTX2 + plain/ -> LOD, restoring marine/weapons from git between steps
npm run build
```
Packed creature files verified: KTX2 main + PNG `plain/`, elite/boss `k11RankScale`, one `__lod_low` sibling each.

## Verification

`npm run build` passes. 24 capture scenarios before and after, no failures. `npm run playtest -- --rig=breacher --seed=1729
--rooms=6 --fast`: 6 rooms cleared, 0 errors. Value check (greyscale 480×270, three crowds + twenty Brutes): bodies stay dark
masses, the pale planes are the only light creature shapes, the marine remains the brightest figure.

## Still weak

- Crawler and Stalker remain small on screen (≈ 50–60 px at 1080p); their planes read at native size but at 480×270 they are
  a few pixels — the scale question is the runtime/collider's, not the mesh's.
- The Stalker's flank scythes read as pale shards rather than unmistakable crescents in a dense crowd; a further step would be a
  brighter edge band or larger size, at the cost of more collider shrink.
- Spitter regular attacking face is only the pale mouth; its threat still reads mainly from the green sac and the ranged warning.
- Elite Crawler fins are mid-grey at 480; the forked V shape survives, the fin brightness less so.
