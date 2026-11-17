# DRESS13 review

## Swarm Junction
Round 1: opened native tour 02/04 and their 480×270 reductions. Creep and nests read as connected edge masses; the web presented as a dark bar, so tilted both membranes .65 radians and removed the former plenum decoration.
Round 2: opened revised native tour 03/04. Marine remains exposed in the crossing and airway; web retains a heavy silhouette at distance. Heart is relegated to the deep south recess to keep the fight circle open; landmark visibility remains weaker than the modelling reference.

## Infested Workshop
Round 1: opened native south/gantry tour04 and exact-size reductions of tour02/04. South-only growth missed the tool-gallery story; moved the duct, medium nest, pods and connected wall creep to the north workbay.
Round 2 is captured in dress13-edge-final; two machines retain consumed shells, and the fight floor remains free of tall pieces. Calm retry required after concurrent dist rewrite broke a lazy import in the earlier capture.

## Overload Floor
Round 1: opened native fight02 and exhaust04, plus 480 reductions. Growth stays dark and peripheral, with substantially dimmer lanterns; the reactor and marine dominate.
Fix: flattened the long overhead membrane's vertical sag and kept the central holdout floor free of all raised growth. Final source capture follows the common build.

## Breached Loading Bay first trace
Round 1: opened native entry01 and 480 entry01. A burst duct and connected creep sit by the port tear, well clear of the marine and freight turn floor; warm room lighting makes the flesh brighter than intended.
Fix: baked trace albedo gain reduced to .65, keeping the early contamination quiet. Complete five-position tour/calm in dress13-edge-final; final source recapture follows.

## Freight Hold first trace
Round 1: opened five-position tour's north-court reduction03; the added trace stays at the distant dispatch ventilation edge rather than becoming an early room landmark. Native calm and five-position tour completed without capture guards.
Fix: same .65 trace albedo gain as Loading Bay; no extra masses, no new collision or route obstruction. Final source recapture follows.

## Growth final source corrections
Inspection of the south recess showed the heart was too far from the toured airway; moved it from z950 to z825, still 305 units from the arena centre with the near edge outside the fight circle. Darkened living creep to .6 albedo gain so actor silhouettes retain priority. Legacy ConstructionLanguage/EnvironmentalStory ribbons are retired in the two takeover rooms, in addition to L8 seams.

## Rooms 17–19 reviewed rounds

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

## Compressed-atlas integration
The first KTX2 capture caught GL_INVALID_ENUM in preparation: retained warmup samplers copied a compressed ASTC format onto a plain DataTexture. Corrected the placeholder to RGBA8 while preserving shader sampler shape; the one-room Freight retry passed with the shipping compressed atlas. Final growth tours use that corrected immutable build. No warmup ownership or disposal path was removed.

Swarm final tour04 exposed a poor heart location: the marine's south-airway inspection mark entered its cutaway region, hiding the landmark. Moved the heart to the starboard plenum shoulder at (970,400), scale .8, where its back overlaps existing machinery and the southern exit route retains over 140 units. It stays outside the fight circle and requires a fresh final Swarm tour.
