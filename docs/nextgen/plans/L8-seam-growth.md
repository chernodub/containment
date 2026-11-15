# L8 wall and deck seam consumption

New owned module: `src/render/world/L8ShipSeamGrowth.ts`; export `buildL8ShipSeamGrowth(id,t): Group|null`. Only `infested-workshop` and `swarm-junction` with their active authored hulls opt in. No shared renderer, simulation, geometry, actors, abilities, UI, assets or legacy templates changed.

## Evidence read and design response

Read-only PNG review: raw2 calm Workshop/Swarm and Workshop G6 kiting02, compared with final5 calm Workshop/Swarm in the original checkout. Raw2's available combat plane is largely blue steel while the organic source sits beyond the useful view. Final5 has visible pink material, but combines it with the old opaque polygon/scatter/bar recipe. The new layer brings rooted tissue onto actual ship construction in the useful floor view, without reinstating those pads or debris.

Workshop follows a converted service feed: the first real breach joint connects to the port deck seam, continues to the southern workbench supply joint, and reaches the actual gantry joint. A short joint branch grows toward the arena edge. Swarm follows the two opposite airway seams between its north/south tears, with unequal side branches approaching the crossing. These are deterministic continuous ribbon membranes with smoothly unequal widths, small meandering edges, tapering tips and a thin folded fibre. Dry plum tissue and muted olive fibre distinguish organic consumption from the bare blue floor; emission is restrained and constant, not a hazard pulse.

Wall-foot traces derive from actual hull/solid edges near the four real feature mounts. Inward/outward is selected through the native floor predicate. Four doorway leads begin at `ShipPlan.breachFeatures`, reach the actual raw breaches, then join128-unit deck-plate joints. All main service paths derive from those joint coordinates and the actual arena. Raised tissue is cap-only, fully inside existing solid reservations at.903–.909m; there are no new standing stalks, opaque floor pads or discs.

A160-unit radius around the authored arena is excluded, keeping the required R144/9m combat circle completely exposed with16 units of additional margin. Floor crest height is≤.0205m; floor tissue has no collider and never determines movement or damage.

## CPU receipt

```text
VITEST_MAX_WORKERS=2 npx vitest run src/render/world/L8ShipSeamGrowth.test.ts
Test Files1 passed(1)
Tests7 passed(7)
npx tsc --noEmit: PASS
```

| Room | Merged draws | Total triangles | Floor membrane triangles | Solid cap membrane triangles | Projected membrane triangle area / room AABB |
| --- | ---: | ---: | ---: | ---: | ---: |
| Infested Workshop |2|4200|2156|644|5.57%|
| Swarm Junction |2|3798|1924|608|4.94%|

Area is the sum of body triangle projections, not a gameplay-area subtraction or a screen-space measurement. All quality tiers use the same bounded static two draws; there are no texture fetches, lights, particles, animation updates, per-frame allocations or new shader code. Both finishes use the existing Standard/vertex-color material family. This is construction cost evidence, not hardware FPS or shader-compile acceptance.

Tests retain native per-vertex support plus edge and triangle-interior samples, exact continuous edge sweeps, quiet-circle exclusion, source solid cap support and the.91m raised cap limit. A deliberately added eight-unit solid and four-unit void prove that ribbons cannot bridge thin collision geometry. Repeated builds produce identical coordinates without mutating the input. Every emitted geometry and material disposes exactly once. The actual follow-camera/protection code rays all eight C6 marine box corners at spawn, arena and every named-space anchor; no new growth lies before the body. Fatal-story display rooms and all other IDs return null; their world story rays are unaffected by this helper's scope.

Illustrative top-down overlay, inspected as PNG:
`artifacts/nextgen/l8-seam-growth/plan-overlay.png`

Machine-readable mesh topology and statistics:
`artifacts/nextgen/l8-seam-growth/topology.json`
`artifacts/nextgen/l8-seam-growth/stats.json`

The overlay proves placement/ownership and branching near the playable arena. It is not a lit native or480×270 art capture.

## Integration hook and remaining acceptance

Root should add the returned group once to the room environment before shader preparation/material warmup. Existing room disposal via `disposeModel` owns both local geometries and finishes; no separate updater or owner is needed. Null preserves legacy construction and unrelated rooms. This layer replaces the old random floor-growth branches/patch recipe for the two active IDs; retain original supported kit machinery and licenses. Do not add a second generic scatter pass to fill the quiet arena.

No browser jobs were run by this child. The capture agent/root must still inspect integrated native calm/G6,480×270 and grayscale evidence, verify the tissue reads as consumed construction under actual lighting and post, and run the existing preparation/compile/draw/frame budgets. No invented art score or final lit-art/performance acceptance is claimed.
