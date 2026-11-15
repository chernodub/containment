# L8 Act4 architecture and integration report

Working branch: `t3/re-author-story-room-layouts`. Plan/test commit: `2126a2426881e1574259f9b963e083c3c88e8ffe`. This report covers prospective Act4 candidates and their owned presentation. Root owns registry integration, final native captures, matched cohorts, performance and global gates.

## Plan language and semantic review

- **Swarm Junction:** a real cross-junction with two former ventilation galleries. Four chamfered, hull-attached masses distort those galleries; growth is confined to their inward faces/seams. The center is an open fight crossing, with port approach, north/south airways and an actual hull exit. Both the north and south pockets have320-unit mouths.
- **Shielding Gate:** offset north/south shielding blocks make the scanner floor, inspection gallery and sterilization bypass. Original west shield / power cabinet / east shield source ownership is retained. Two hull-connected filled machinery enclosures replace narrow dead-end side pockets. Breaches use the enclosure's exposed vent faces or actual outboard door edges.
- **Containment Annulus:** the existing octagonal sealed passenger core retains its exact shape and both ring directions. The core moves(+200,+80); the west encounter floor is broad, while the east status rail is a secondary route. Two continuous north/south shielding/service housings extend the vessel envelope. This is necessary architecture: the original isolated184800-unit core cannot meet60% connected-solid area at the old hull size without severing a ring route or violating the area constraint. The housings are actual collision bodies rendered as grounded waist-height equipment with inspection lids.
- **Manual-control Chamber:** the paired hardwired cabinets meet the hull and enclose a440-unit-wide authorization booth, opening through two distinct160-unit threshold lanes onto the core floor. The fatal-cost/status desk terminates the south gallery. Broad side vestibules preserve entry→booth/floor→core-threshold flow. The original control models, desk, passenger panel and observation-shell owner stay intact.
- **Overload Floor:** the original six-sided core remains intact, translated(+100,+80). Its actual core-well center is(700,510). A western holdout floor, reaction-feed threshold, starboard gantry and exhaust gallery form the playable ring. The north feed and south exhaust housings are real hull-connected machinery. This is the sole Act4 holdout exception; both physical ring directions remain usable.

The first labeled review rejected the Manual cabinet's80-unit rear strips and the Shielding power cabinet's64-unit strips. Filling/widening actual solids removed them. A second review rejected the two one-mouth160×260 shielding pockets despite their numeric navigation pass; attached machinery now fills them and two breaches move to the inward faces. Final PNG inspection shows continuous structural masses, no detached cover islands in ordinary rooms, identifiable subspaces and broad alternate routes. This is a plan review; native environment-art acceptance remains with root's captures.

## Measurements

Checker union area uses the frozen2-unit sample method. All five reports have `errors: []`, legalR144 circles, at least4 reentrant corners, two named hull bays,140+ unit openings and legalR32 raw/inward breach anchors. Nonholdouts pass graph-cycle and physically sealed-opening reachability checks.

| Room | Old→new template dimensions | Baseline walkable | New walkable | Change | Solid / hull-connected solid | Connected | Free groups |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Swarm |1200×880→1200×1040|950800|843400|−107400 /−11.296%|199800 /199800|100%|0|
| Shielding |1200×880→1408×960|965000|794800|−170200 /−17.637%|217680 /217680|100%|0|
| Annulus |1200×880→1440×1040|707600|794400|+86800 /+12.267%|498400 /313600|62.921%|1|
| Manual |1200×880→1280×1040|972400|924000|−48400 /−4.977%|176800 /176800|100%|0|
| Overload |1200×880→1280×1040|607160|717600|+110440 /+18.190%|262400 /179200|68.293%|1|

Exact continuous occupancy sampling in the labeled plan renderer gives Swarm843280, Annulus794160 and Overload717560 rather than the union checker's843400/794400/717600 because boundary-contact samples are rejected by the native occupancy predicate. Both methods remain inside±20%. R32 usable areas are708112 /646692 /603536 /773632 /571488 respectively.

All geometry numeric changes, including every boundary/void vertex, rectangle, spawn, exit and raw breach before/after, are recorded in `artifacts/nextgen/l8-act4-plans/coordinate-deltas.json`. Arena centers are(600,520), (704,480), (350,520), (640,550), (335,520). Core polygon areas/shapes are unchanged: Annulus184800 and Overload83200. Encounter, progression, ability, actor, route, story and checkpoint numeric changes: **none**.

## Simulation and camera evidence

`node scripts/nextgen/l8-check-plan.mjs src/game/roguelike/shipArchitectureAct4.ts SHIP_ACT4_PLANS`: all5 `errors: []`, including dense marine positions and enemy radii14/18/24/28. `Act4Plans.test.ts` additionally verifies a singleR32 field using continuous swept adjacency. Native A3 mixed cohorts contain20 actors: all five families from all four breaches. Each anchor below resolves20/20 exposed blockers through native damage, no unresolved actors, using the unchanged600-unit line-of-sight opportunity and60000ms bound. This is finite-fight liveness, not campaign completion.

| Room | Entry last opportunity | Exit last opportunity |
| --- | ---: | ---: |
| Swarm |3450ms|3450ms|
| Shielding |8100ms|7600ms|
| Annulus |8350ms|8550ms|
| Manual |5650ms|5650ms|
| Overload |4500ms|6550ms|

All five replay the identical80-tick native mixed ingress and movement snapshots in two runs (50ms steps). Every accepted movement graph and body occupancy is asserted. No navigation or actor helper changed.

`Act4ShipFraming.test.ts`:5/5 pass. Every named-space anchor, arena, entry and exit is exercised at1080p/720p with reduced motion on/off. Hard guarantees remain100px native hero, full eight-corner body within HUD, room-AABB outside≤18%; at the arena, actual walkable viewport samples≥60%, every obstacle reservation≤35%, and the entire Annulus/Overload core reservation≤35%. The latter is conservative compared with the contracted decorative core. The E7 historical fixture's raised-core crop now follows the live core offset; its≤35%/hero/HUD/AABB bounds are unchanged.

## Presentation hooks

`src/render/Act4Architecture.ts` exports:

```ts
act4Architecture(id:string,t:Pick<RoomTemplate,'width'|'height'|'obstacles'|'boundary'|'voids'>):T.Group|null
```

An optional third palette argument lets the Annulus reuse its existing owned materials. The helper creates at most3 merged material batches, four physical hull/solid-mounted ingress recesses, function-bound threshold shoulders, and seam-bound Swarm growth. Only Annulus/Overload receive large housing bodies. Each housing follows its exact live rectangle: .84m body, .90m lid, .903m tiny lifting seam, continuous grounded ribs and a narrow physical diffuser. Floor shoulder relief tops out at .008m. New materials are ordinary existing MeshStandardMaterial profiles, constructed on room preparation; exact-once owned geometry/material disposal is tested. No kit assets, source caches, manifests, material warmup, actors, abilities or UI were changed.

Root dispatch requirements:

1. Register `SHIP_ACT4_PLANS` / derived layouts with the shared registry.
2. **Annulus already calls the helper internally exactly once**, using its existing8-material palette. Do not append it again. Before document signs, the source builder has≤11 merged mesh parts /8 material families; its two existing owned canvas signs remain. Source mechanism and circulation translate together, with local sign diagnostics matching the actual contracted source geometry. Perimeter follows the live hull.
3. **Overload:** keep original `reactorFloor` core builder and its single void. Replace its generic `equipment(f,t,'reactor')` call with `act4Architecture`; the helper builds the large hull housings without stretching old generic core props. `hotCore` already derives from the live void, so its light staging follows(700,510)/32.
4. **Swarm, Shielding, Manual:** append helper to the generic architecture root. Keep Shielding/Manual's existing three source equipment owners. No duplicate generic machinery needs suppression there. Keep Manual's `manualControlArchitecture` observation-shell hook at dispatch.

Lighting direction for shared compositions: Swarm's surviving cold ventilation source grazes the inward growth seams, a weak opposite airway source opens silhouettes, the masses stay dark and the junction stays quiet. Shielding's inspection face is the dominant cold source, sterilization is a weak warm secondary and the scanner floor is unpatterned. Annulus north shielding face is dominant, south face is30% fill, sealed machinery is the shadow mass and the west encounter plane remains quiet. Manual's booth/authorization desk is dominant with a weak core-threshold amber source; hold the fatal-cost display clear of foreground trim. Overload's real core is dominant hot light, reaction-feed/exhaust diffusers are subordinate warm sources; the western holdout floor remains readable. Helper fixtures use linear pool metadata, not circular stamps.

## Rewritten expectations and checks

- `ContainmentAnnulusBlockout.test.ts`: obsolete exact outer-octagon/no-obstacle pins become preserved original core-shape, attached-housing and live hull guarantees. Ring sweeps relocate to both actual new routes and retain radii16/28/30/38. Floor tests query native walkability instead of a stale rectangular mask. Circulation and contracted source-detail samples translate with the core. The8-mesh pin becomes11 mesh parts for added housing batches while material-family count and exact-once disposal remain. Canvas sign tests now raycast the actual live sign coordinates.
- `ShieldingGateBlockout.test.ts`: source head bounds are computed using the live rectangle and unchanged gate-start/source proportions instead of old world coordinates345…435. Source assemblies, containment, mechanics and material/cache assertions remain.
- `ManualControlBlockout.test.ts`: native routes follow the booth threshold and actual north/south approaches rather than the old y140 flank through new wall cabinets. Radii16/28 and all source model/resource guarantees remain.
- `E7EncounterFraming.test.ts`: only the raised-core crop follows the live offset. No hard camera limit changed.
- New `Act4Architecture.test.ts`, `Act4Plans.test.ts`, `Act4CrowdSoak.test.ts`, `Act4ShipFraming.test.ts` cover prospective render/geometry before registry activation. Existing root clearance/A3/roguelike-room tests were run unchanged.

Summary lines:

```text
Prospective architecture CLI:5 rooms, errors[] for every room.
Owned render/camera/source contracts: Test Files6 passed; Tests52 passed.
Candidate clearance/crowd/camera after final Shielding change: Test Files3 passed; Tests26 passed.
Candidate crowd + deterministic replay: Test Files1 passed; Tests16 passed.
Existing navigation/A3/roguelike + initial candidate suites: Test Files5 passed; Tests111 passed.
npm run build: passes (existing chunk-size advisory).
```

## Files and remaining integration evidence

Absolute plan artifact root: `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-act4-plans/`. Prospective20-up old/new sheet: `twenty-old-new.png`; retained first-review contact: `round1-contact.png`. Per-room before PNGs are at `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-baseline/plans/<id>.png`; new PNGs are in the artifact root with these exact filenames:

- `swarm-junction.png`
- `shielding-gate.png`
- `containment-annulus.png`
- `manual-control-chamber.png`
- `overload-floor.png`

Machine-readable `clearance-check.json`, `checks.json`, `areas.json`, `coordinate-deltas.json`, and focused test/build logs accompany them. Candidate source is committed separately from presentation so root can review/integrate it concretely. No computer use, browser, native captures or performance processes were run by this child. Root still owes dressed calm/kiting/storyboard captures,119-ray story-display/global fixture guards, matched before/after frozen-bot cohorts, fresh per-rig browser campaigns, preparation/frame/draw/compile budgets and required full desktop gates. These owned CPU results do not certify those outstanding global gates or a premium environment-art score.

Exact per-room before/after absolute paths:

- swarm-junction: `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-baseline/plans/swarm-junction.png` → `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-act4-plans/swarm-junction.png`
- shielding-gate: `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-baseline/plans/shielding-gate.png` → `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-act4-plans/shielding-gate.png`
- containment-annulus: `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-baseline/plans/containment-annulus.png` → `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-act4-plans/containment-annulus.png`
- manual-control-chamber: `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-baseline/plans/manual-control-chamber.png` → `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-act4-plans/manual-control-chamber.png`
- overload-floor: `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-baseline/plans/overload-floor.png` → `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-act4-plans/overload-floor.png`
