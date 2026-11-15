# K10 — Original split-crown marine and arsenal

Branch: `t3/original-marine-arsenal`. Implementation commit: `70c22c7` (`feat(art): author original marine rigs and arsenal on preserved skeleton`). Final documentation HEAD is supplied with the handoff.

The shipping marine body/armour and all five weapons now use original Blender-authored geometry and baked textures. The marine's split crown, exposed cassette carrier and four different rig assemblies replace the converted body and procedural suit modules. All new art and generating scripts are repository MIT work. The retained Unvanquished skeleton, sockets and seventeen clips remain separately attributed under their existing Creative Commons terms.

## Design and implementation

The shared suit has a divided ceramic chest, graphite pressure fabric, structural metal, a split crown/offset brow, and an exposed dorsal cassette carrier. Breacher carries an asymmetric ram shoulder and impact cassette; Cryo has collared vessels, radiator and hoses; Pyro has splayed exhausts, squat cells, a heat shield and apron; Arc has an open induction yoke, capacitor rings and antenna fingers. These are weighted mesh variants, not color swaps. Only the selected rig is visible.

Pistol, rifle, shotgun, plasma and rocket have distinct lengths and top silhouettes: compact hex-bore breech, split rail, twin bores, open induction fork, and hollow hexagonal launch shroud. Existing `WEAPON_FIT` values and exact muzzle socket coordinates remain unchanged. Each weapon also has a named ejection socket in the existing derived casing frame.

Real bevelled/tapered plates, recessed boolean service pockets and vents, latches, collars, hose runs and sparse fasteners carry the detail. Cycles bakes supply AO, curvature masks and tangent normals; the weapons project higher-detail rounded edges onto their gameplay meshes. Flat base zones stay subordinate to the game's contours and banded lighting. K10 materials retain their authored atlas values instead of the old photographic family remap. Per-skin material owners avoid duplicate title hook application while sharing texture resources. Visible-mesh sizing excludes inactive variants.

The hard skeleton contract is intact: all first 123 nodes, hierarchy/rest transforms, 122-joint order and inverse-bind payload are identical to the outgoing GLB. All 17 clip names, 3,690 channels/samplers and their input/output payloads are unchanged. A stripped skeleton/clip source under `tools/assets/k10-marine/` permits rebuilding after replacing the shipping GLB. No old marine mesh or embedded skin image remains in either source contract or new marine file. No motion, world/room, UI, simulation or save code was changed.

Rebuild everything: `tools/assets/k10-marine/rebuild.sh` (Blender 5.3; no new dependency). The command generates all six GLBs, atlas source bakes, turnarounds and artist pose previews; it completed successfully end to end. Blender’s UV packer can vary island placement between runs, while geometry/normal/weight triangles remained identical and all five weapon files were byte-identical. The shipping marine is the exact frozen export used by the retained native evidence (SHA256 `3488b67dd4d4db5de5526cd36860d4c73d44e4514d8ec71e40aa832fd12bf395`). `K10-design.md` and `K10-review.md` record grey-blockout judgment and four actual render/look/fix rounds, including the title material-hook and emission-mask failures that were corrected.

## Geometry and textures

| Asset / active variant | Triangles | Shipping maps |
| --- | ---: | --- |
| Shared marine body | 10,960 | One shared 1024² atlas set: base, normal, AO, emissive |
| Breacher body + rig | 12,012 | Same shared set |
| Cryo body + rig | 13,380 | Same shared set |
| Pyro body + rig | 13,516 | Same shared set |
| Arc body + rig | 13,472 | Same shared set |
| Pistol | 1,308 | 512² base + normal |
| Rifle | 1,856 | 512² base + normal |
| Shotgun | 2,168 | 512² base + normal |
| Plasma | 1,988 | 512² base + normal |
| Rocket | 1,740 | 512² base + normal |

All five weapons total 9,060 triangles; only the equipped weapon is visible. The compact pistol is below the approximate 1.5k aim because extra geometry would not improve its read. The marine stores 19,500 resident triangles across shared body/all four rigs; it draws only the active 12–13.5k. Marine GLB: 6,370,548 bytes. Five weapon GLBs: 1,834,040 bytes combined. GPU atlas upper estimate with RGBA8 mip chains: 21.3 MiB marine plus 13.3 MiB all preloaded weapons; no atlas exceeds 1024². Curvature source maps remain authoring/review outputs, not extra runtime samplers.

## Verification and measured comparison

`npm ci` completed. `npm run build` passed (TypeScript and production Vite build). No tests, runners, assertion gates or proof infrastructure were added.

Capture labels: `k10-before`, `k10-final-live`. Retained gallery: `/Users/chernodub/.t3/worktrees/containment-game/t3-c52a0ed7/artifacts/nextgen/k10-final/index.html`. There are 20 before PNGs and 28 final PNGs at 1920×1080, exact4:1 area reductions to 480×270, all four rigs in Awakening Bay/Armory/Infested Workshop, and matching calm/heavy before-after boards per rig. The original successful capture manifests and native frames remain. Final runs had zero capture errors. The first failed title-material manifest is retained under diagnostics. Intermediate successful rounds were removed after review.

The existing M9 tool produced nine before and 21 final native-pixel strips with zero errors: eight run directions, five weapons, hit/reload/death and action input studies. All three final four-phase contact pages were opened. Artist-only 70° torso twist and crouch poses cover every rig; their independent ankle controls are explicitly positioned by the preview script. These are skin/art studies, not foot-contact or native-action certification. Native campaigns below supply ordinary input/encounter evidence.

The ordinary hardware benchmark used ANGLE Metal / Apple M1 Pro, High, 1920×1080, Awakening Bay heavy combat, all four rigs, three 12-second trials per rig in both cohorts. All 24 trials completed with zero errors, zero budget failures and zero combat program compilation. Summary below is the median of each rig's three trial percentiles (not a sum of stage percentiles).

| Rig | Frame p50 before → final ms | Frame p95 before → final ms | CPU p50 before → final ms | CPU p95 before → final ms |
| --- | --- | --- | --- | --- |
| Breacher | 16.7 → 16.7 | 18.1 → 18.2 | 10.0 → 9.6 | 15.8 → 15.1 |
| Cryo | 16.7 → 16.7 | 18.0 → 18.0 | 10.0 → 9.8 | 14.4 → 14.1 |
| Pyro | 16.7 → 16.7 | 18.1 → 18.2 | 9.3 → 8.9 | 14.1 → 13.6 |
| Arc | 16.7 → 16.7 | 18.0 → 18.0 | 8.8 → 9.4 | 13.1 → 13.0 |

| Rig | Median adaptive scale before → final | GPU-query p50 before → final ms |
| --- | --- | --- |
| Breacher | 0.950 → 0.975 | 14.69 → 12.81 |
| Cryo | 0.950 → 0.925 | 20.10 → 21.02 |
| Pyro | 0.925 → 0.925 | 22.26 → 22.02 |
| Arc | 0.925 → 0.950 | 21.34 → 21.72 |

Adaptive scale improved for two rigs, held for one and fell one step for Cryo. GPU queries include shared-device scheduling and are not a controlled cost comparison; preserve them with the frame/CPU/load data.

No meaningful observed frame-time regression was resolved: p50 is unchanged and p95 differs by 0–0.1ms. This does **not** establish zero GPU cost. Host load differed materially (before one-minute load about23–73 on10 cores; final about12–17 at trial starts), native population/effect counts vary, and isolated long frames remain in the raw data. Arc CPU p50 rose0.6ms while its p95 fell0.1ms; do not claim CPU improvement or a controlled microbenchmark. Peak final draws: Breacher269/Cryo283/Pyro270/Arc264. Raw cohorts are `bench-before/benchmark.json` and `bench-final/benchmark.json`. Staged captures and fixed-step campaign timings are not hardware FPS evidence.

All four ordinary unassisted seed1729 native campaigns finished with zero errors and zero defects. Every fixed tick was rendered; no assisted damage scale, fast rendering or room limit was selected. Pyro's natural death in Diagnostic Gallery is retained.

| Rig | Rooms cleared | Native outcome | Errors | Defects |
| --- | ---: | --- | ---: | ---: |
| Breacher | 20 | complete | 0 | 0 |
| Cryo | 20 | complete | 0 | 0 |
| Pyro | 10 | dead | 0 | 0 |
| Arc | 20 | complete | 0 | 0 |

Full reports, traces and native screenshots are retained under `play/{breacher,cryo,pyro,arc}/` in the final gallery. Breacher, Cryo and Arc completed the twenty-room Overload Floor ending. Pyro cleared ten rooms and died naturally in the eleventh. These are input/encounter/lifecycle observations, not hardware FPS measurements. The source report labels/head metadata remain literal; all four runs used the same frozen final distribution and exact shipping marine export.

## Look first

- [All rig forms: front, side, back, top and gameplay](/Users/chernodub/.t3/worktrees/containment-game/t3-c52a0ed7/artifacts/nextgen/k10-final/turnarounds/round4-all-views.png)
- [Gameplay angle at140px height](/Users/chernodub/.t3/worktrees/containment-game/t3-c52a0ed7/artifacts/nextgen/k10-final/turnarounds/round4-140-contact.png)
- [Arsenal native source views](/Users/chernodub/.t3/worktrees/containment-game/t3-c52a0ed7/artifacts/nextgen/k10-final/weapons/arsenal-contact.png)
- [All four rigs in three production rooms at480×270](/Users/chernodub/.t3/worktrees/containment-game/t3-c52a0ed7/artifacts/nextgen/k10-final/after/four-rigs-three-rooms-480.png)
- [Native-pixel calm/heavy before-after](/Users/chernodub/.t3/worktrees/containment-game/t3-c52a0ed7/artifacts/nextgen/k10-final/comparisons/breacher-before-after-native.png)
- [Matched full-frame reduced comparison](/Users/chernodub/.t3/worktrees/containment-game/t3-c52a0ed7/artifacts/nextgen/k10-final/comparisons/arc-before-after-480.png)
- [Five weapon grips and muzzles; full native strips alongside](/Users/chernodub/.t3/worktrees/containment-game/t3-c52a0ed7/artifacts/nextgen/k10-final/strips-final/marine-contact-2.png)
- [Artist-only extreme-pose skin review](/Users/chernodub/.t3/worktrees/containment-game/t3-c52a0ed7/artifacts/nextgen/k10-final/poses/pose-contact.png)

## Integration requests and honest weaknesses

1. M10: merge incoming animation-only GLBs by the unchanged bone names. The 123-node/122-joint contract and existing seventeen clips are preserved. Incoming M10 clips were not available here and have not been judged on this mesh.
2. Title owner/E9: `src/render/world/TitlePresentation.ts` still adds its old procedural title armour. Skip `titleMarineArmor` for the original K10 body (detect `k10-body` or the asset's `userData.k10Original`) so it cannot cover authored panels. That world module is outside K10 ownership. The shared-material shader failure is already fixed from the material owner side.
3. UI owner: existing illustrated portraits/title art are unchanged. Optional new portrait PNGs were not authored; adapt that art to the split crown and cassette silhouettes if it should exactly match the live marine. No UI edits are required for gameplay rig selection.

The suit reads strongly from above, but the face/ceramic blocks remain utilitarian and mechanical in a close-up; this is not cinematic AAA character art. Lower legs/fabric are too dark in some banded shadow values. Small bolts and bake detail mostly disappear at the 480 reduction, as intended, leaving broad forms. Rifle/shotgun rear stocks share a simple beam vocabulary; weapon receivers remain restrained rather than richly hand-painted. Existing animations are still stiff, and the action-input strips do not certify M10's future clips. The title's legacy armour overlay and old portrait art are explicit integration gaps. No push, PR or integration-branch merge is part of this handoff.
