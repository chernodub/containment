# L8 mounted ingress fittings

The fifteen non-Act4 story rooms previously retained their four raw floor grates but did not render their declared wall/door breach sources. `WorldDressing` now adds four feature-driven mounted cassettes per room, using the actual active plan's names, locations and raw breaches. The five Act4 rooms retain their existing owner and receive zero additions. Legacy templates, including reactor-vault, take the original path.

The fitting helper searches actual exposed hull, obstacle and sealed-partition faces within 64 units of each named source. Orientation follows that face's normal toward playable air, rather than treating the feature-to-breach diagonal as a wall normal. Width clips to the full supported face span and cannot bridge a tiny return. Vents use four louvres; human doors use split leaves and a handle; hull tears retain uneven flanges. There are no new floor bars or gameplay colliders.

Native source inspection exposed real visible/declared-face mismatches: some kit machinery is recessed inside its reservation, Residential has a low fallback plinth, and several hull cutaways are shorter than a nominal face skin. The approved correction gives each fitting its own physically grounded cassette backing, 0.88 m high and 0.08 m deep, wholly inside existing non-walkable solid/hull. The skin projects at most 0.035 m toward playable air; the body front follows the actual face. The backing does not alter source model ownership or replace an asset. Full lateral corners and slab depth are checked against the true solid union; no invisible unsupported wall is assumed.

Only the already populated steel, graphite and signal buckets are used. There are no new materials, textures, shader families, light pools, scene-mesh buckets or per-frame mutations. The original raw-grate loop, all four breach counts, generated warning displays, warning RGBA ranges, exact-once disposal, legacy behavior and 12,000-triangle cap remain. This is preparation-time scenery and does not change simulation, encounters, save data, camera, actors, abilities or observer policy.

## Per-room dressing triangles

Counts use the actual renderer architecture and `addWorldDressing` fixture from the existing lifecycle test, before and after this change. They are dressing counts, not total room triangles or hardware FPS. Full fitting centers, normals, widths, parts and ranges are recorded in `artifacts/nextgen/l8-mounted-ingress/fitting-proof.json`; deltas are in `triangle-deltas.json` beside it.

| Room | Before | After | Added |
| --- | ---: | ---: | ---: |
| Awakening Bay | 3,748 | 4,356 | 608 |
| Passenger Vault | 5,268 | 5,876 | 608 |
| Residential Gallery | 3,028 | 3,636 | 608 |
| Communal Atrium | 2,392 | 2,988 | 596 |
| Crew Checkpoint | 5,116 | 5,700 | 584 |
| Armory | 4,780 | 5,364 | 584 |
| Freight Hold | 3,656 | 4,228 | 572 |
| Breached Loading Bay | 7,132 | 7,692 | 560 |
| Relay Racks | 6,608 | 7,216 | 608 |
| Transmission Chamber | 6,784 | 7,368 | 584 |
| Diagnostic Gallery | 11,252 | 11,860 | 608 |
| Safety Interlock Station | 9,450 | 10,058 | 608 |
| Coolant Plant | 4,356 | 4,940 | 584 |
| Service-shaft Landing | 3,508 | 4,068 | 560 |
| Infested Workshop | 5,264 | 5,824 | 560 |
| Swarm Junction | 5,240 | 5,240 | 0 |
| Shielding Gate | 4,504 | 4,504 | 0 |
| Containment Annulus | 4,316 | 4,316 | 0 |
| Manual-control Chamber | 6,984 | 6,984 | 0 |
| Overload Floor | 2,984 | 2,984 | 0 |

Diagnostic has only 140 triangles of remaining dressing headroom. No further decorative parts were added.

## Exact test migration and validation

`src/render/WorldDressing.test.ts` previously required every raised fitting vertex to lie inside a solid's XY outline or outside the hull, except the separately proven warning gantries. That roof-only assumption would hide a face-mounted skin entirely behind its supporting wall. For explicitly recorded mounted-ingress vertex ranges only, it now requires the full physical exposed-face/slab backing proof and a finite bounded vertex envelope: embedded back, at most 0.035 m forward projection, and at most 0.91 m height. Every other raised vertex retains the original support assertion unchanged. The existing seven-material ceiling, four grates, 12,000-triangle limit, immutable topology, warning 119-ray guarantees and exact disposal assertions remain. An additional assertion requires zero new ingress material buckets.

`MountedIngress.test.ts` verifies all fifteen four-feature sets, the five Act4/legacy skips, immutable inputs, real face normals/support, every fitting vertex, embedded backs, native Three backing rays and exact resource disposal. Negative controls reject a floor card, a wide facade on a tiny return, excess forward projection, excess back extent and excess height. The rejected/dormant three-ingress candidate is tested only as a prospective input; the helper never activates it.

`MountedIngressSource.test.ts` extracts the exact milled cassette triangles emitted into the live WorldDressing bucket, rather than substituting a support box. All sixty mounts must have native backing hits at both lateral ends and center, at three body heights. Rays sit 0.2 mm inside shared triangle edges to avoid floating-point edge ambiguity; independent slab tests include the exact outer corners. It also checks four retained grates, no new buckets, immutable templates, full cassette bounds and exact-once retirement.

The final focused run includes both new tests, existing WorldDressing, warning actor envelopes, native warning shapes and kit story sightlines. Result: 6 files / 57 tests passed (6.37 s), with VITEST_MAX_WORKERS=2. `npm run build` passed. Full global/browser gates remain with the parent.

## Remaining evidence

No browser, native PNG capture or FPS benchmark was run for this pass. The new facade silhouettes, low cassette backs and distinctive vent/door/tear appearance require inspection in the final guarded native/480/grayscale gallery. Mounted source fittings can remain outside a close combat viewport when the real breach lies at a distant hull; this change does not move cameras or invent floor decoration to bring them into view. No new art score or full-release acceptance is claimed. Fixed cohort selection and final source/browser reservation remain with the parent.
