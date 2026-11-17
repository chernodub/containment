# DRESS13 — Gate, Annulus and Manual Control review

## Shielding Gate — round 1 preparation

Opened final6 native tour frame 03: the shield leaf and floor remain very clean; the gate is the strongest silhouette but has no visible pressure against it.
First placement holds medium nests against existing shield solids, one torn duct with overlapping creep at the inspection cabinet, a swallowed cabinet section, and two elevated webs; the scanner fight floor remains bare. Capture review pending the shared browser slot.

## Containment Annulus — placement

Continuous overlapping creep follows both outer housing lips, with alternating wall patches, two breached ducts, hatched pods and one swallowed housing segment. The west encounter floor and both ring routes retain their native collision ownership.
Baseline final6 tour maximum is 72 draws / 374,899 triangles / 118 textures; first live review pending the serial browser slot.

## Manual Control Chamber — placement

Four mantles swallow the paired booth cabinets, linked by short high webs and creep spilling from the plinths; a large nest occupies the port cabinet corner and a burst duct starts the starboard colony. The manual authorisation dais and fight circle remain clean.
Baseline final6 tour maximum is 91 draws / 298,856 triangles / 117 textures; first live review pending the serial browser slot.

## Round 1 opened review and fixes

Shielding Gate: opened native spawn/fight and exact-area 480 spawn. The nested shield reads immediately at entry, and the fight floor/marine stay clear; the pale resin spill competes with the marine's value. Fixed creep to 0.55 baked albedo gain and webs to 0.7; flattened web vertical scale to 22% so the long web's measured 1.299m sag remains above head height.
Containment Annulus: opened native spawn/north-ring and exact-area 480 north-ring. The continuous outer strip communicates consumption while leaving the arena untouched, but identical crest spacing looked manufactured. Fixed the strip with alternating three creep shapes, small yaw/offset variation and dimmed crust; the wall climbs retain their attached outer-housing support.
Manual Control: opened native spawn/booth and exact-area 480 booth. Cabinet mantles and violet organs frame a clean decision floor; resin around their bases was too pale. Applied the same dim crust and high-web sag correction, keeping the manual dais and story sign fully readable.

## Round 2 opened review

Shielding Gate: reopened final native spawn plus 480 spawn; the web now clears the machinery face, the violet nest organ remains a peripheral landmark, and the marine is the clearest figure. Native fight view stays deliberately open; the nest's own attached spill is still lighter than the standalone crust, but stays outside the fight circle.
Containment Annulus: reopened final native/480 north-ring. The irregular overlapping edge now reads as a continuous colony rather than tiled scallops; the marine is clean against the quiet inner ring. The outer wall's repeated growth caps remain this room's weakest detail.
Manual Control: reopened final native/480 booth. Mantles visibly consume cabinet sections and the clean central authorisation floor/sign remain clear; the colony stays peripheral at spawn. The extreme left nest is partially cropped by the ordinary camera and is secondary to the swallowed cabinets.

Both rounds captured complete five-position tours and one calm frame per room. Final retained evidence is `artifacts/nextgen/dress13-final/gates/`, including exact-area 480 reductions; exact final6 source views are in `dress13-final/before/` and `before-480/`. No camera, simulation, actor, encounter, UI, or collision changes were made by this room group.

| Room | final6 tour max draws / triangles | Final tour+calm max draws / triangles | Final textures (count) | Max room preparation ms | Prepared tour compiles |
|---|---:|---:|---:|---:|---:|
| Shielding Gate | 192 / 371,693 | 183 / 182,472 | 125 | 1,628.4 | 0 |
| Containment Annulus | 72 / 374,899 | 90 / 270,537 | 127 | 2,346.0 | 0 |
| Manual Control Chamber | 91 / 298,856 | 120 / 164,902 | 124 | 1,838.9 | 0 |

These are staged whole-frame submission counts, not hardware FPS or an isolated DRESS13 performance delta; final6 and the merged branch include other renderer/actor changes. Texture counts are not texture-memory measurements. The three rooms reuse the Brood pack atlas and finish batches. Both capture manifests contain zero failures/errors. Combat kiting and full native campaign are owned by the integration pass.
