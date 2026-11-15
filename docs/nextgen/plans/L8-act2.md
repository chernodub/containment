# L8 Act 2 — hull-backed issue, freight, loading and uplink plans

Replacement-standard implementation, following L8 standard round9. The earlier paused candidates were superseded. Owned plan map: `src/game/roguelike/shipArchitectureAct2.ts`, export `SHIP_ACT2_PLANS`; `SHIP_ACT2_LAYOUTS` derives compatibility topology from that map. No encounter, progression, actor, ability, UI, story, route, checkpoint or save-format changes.

## Plan language and critique

- **Armory:** retain the established horseshoe and carousel; a 240×200 rear magazine/spine genuinely joins the horseshoe to the north hull. Port magazine and starboard fitting bay open into a broad southern issue court. The spindle remains the single independent solid component. The two side bays have physically separate parallel mouth lanes; sealing one lane leaves another. This reads as equipment issued from a ship magazine instead of a free-standing arena sculpture.
- **Freight Hold:** west loading neck → port stock court/control booth → tow floor → recessed starboard dispatch. North, east and south container banks are hull-backed. One offset load and one two-mouth control booth remain free components. An expanded native crowd soak found a Stalker corner orbit; the offset load north face420→432 and height120→108 preserve its south face540 while removing the orbit. This adds3120 walkable units without changing any encounter number. The booth has 156-unit southern and 160-unit western mouths; the stock behind it begins152 units beyond its southern cheek. Named booth thresholds independently verify both exits. The cross aisle and tow floor provide independent circulation; the R144 turning circle stays open.
- **Breached Loading Bay:** preserve the original diagonal penetrator exactly. Its north shoulder is now attached to the hull through a closed repair trunk, so the dominant scar is a wound in ship structure. Two stern loading beds are hull-backed. Both generous circulation lanes run below the scar; the former north loop is intentionally superseded by the real hull connection. Port docking apron, central turning floor and starboard pressure lock are distinct sub-spaces; the southern floor is expanded to maintain area and turning clearance.
- **Transmission Chamber:** a defensible transmission nave faces an uplink chancel; the dish occupies a fitted northern apse rather than the middle of combat. A west service airlock and southern service chapel articulate the hull. Two short partial thresholds screen the chancel; all large equipment is hull-backed. The deliberate holdout exception is declared only here. No holdout timing/counts change.

Plan critique after PNG inspection: all four are identifiable functional places; their fighting floors remain broad and their hulls establish the plan before dressing. Freight's L booth is deliberately a small working control position with two large mouths, not a one-door cabin. Loading loses the old north loop, but its two separated southern lanes and physically sealed-opening checks preserve escape. Transmission's quiet nave is the primary fight area; dish/stock stay at the perimeter. These are prospective plans, not final dressed art approval.

## Geometry evidence

Frozen reference: `artifacts/nextgen/l8-baseline/plans/templates.json` and `tests/fixtures/l8-walkable-baseline.json`. Area uses the shared deterministic two-unit point grid and solid UNION, rather than subtracting overlapping polygon areas twice.

| Room | Frozen walkable | New walkable | Delta | Hull-connected solid UNION | Free components | Dense marine goals | Native contact paths |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Armory | 940184 | 826832 | −12.06% | 132272 / 152368 =86.81% | 1 | 126 | 2016 |
| Freight Hold | 868800 | 755760 | −13.01% | 99200 / 135440 =73.24% | 2 | 114 | 1824 |
| Breached Loading Bay | 655540 | 728080 | +11.07% | 129520 / 129520 =100% | 0 | 97 | 1552 |
| Transmission Chamber | 976800 | 811520 | −16.92% | 97600 / 105280 =92.71% | 2 | 122 | 1952 |

Total:7344 dense goal×radius×breach routes; radii14/18/24/28, all four native inward breach points, ≤900 legal eight-unit movement legs per route. All four rooms have an R144 clear crowd circle, ≥4 functional reentrant hull corners, ≥2 named hull bays, ≥3 distinct named spaces, ≥140-unit openings, R70 midpoint clearance, R32 full-span/threshold sweeps and mounted breach features within145 units. Non-holdout plans pass actual R32 anchor reachability after sealing each declared opening. Parallel lanes are non-overlapping spans. Checker reports all four `errors: []`.

Machine-readable checker evidence: `artifacts/nextgen/l8-act2-plans/check-plan.json`. Prospective labeled room plans and comparison context sheet are under `artifacts/nextgen/l8-act2-plans/`; this is not the final20-room gallery.

| Room | Before plan PNG (absolute) | Prospective plan PNG (absolute) |
| --- | --- | --- |
| Armory | `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-baseline/plans/armory.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-act2-plans/armory.png` |
| Freight Hold | `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-baseline/plans/freight-hold.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-act2-plans/freight-hold.png` |
| Breached Loading Bay | `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-baseline/plans/breached-loading-bay.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-act2-plans/breached-loading-bay.png` |
| Transmission Chamber | `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-baseline/plans/transmission-chamber.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-act2-plans/transmission-chamber.png` |

## Every numeric gameplay geometry change

Coordinates are simulation units. Rectangle notation is `[x,y,width,height]`; boundaries list ordered vertices. Unmentioned fields, including every encounter number, retain their reference value.

**Armory** keeps1200×880, spawn100/440, exit1100/440 and carousel radius80. Counter outer/inner radii remain300/210, center600/450; angular endpoints150–390° become152–388° (mouth widens2° on each side,4° total). Samples remain25 per arc. This minimal correction removes the previously observed R28 grid-tip stall; the render worktop trim derives the same endpoints. Add rear spine `[480,0,240,200]` as void2. New boundary:
`[[0,240],[80,240],[80,0],[1120,0],[1120,240],[1200,240],[1200,640],[1120,640],[1120,880],[80,880],[80,640],[0,640]]`.
Breaches `[[100,100],[1100,100],[100,780],[1100,780]]` → `[[140,100],[1060,100],[140,780],[1060,780]]`.

**Freight** keeps1200×880 and spawn100/440; exit1100/440 →1090/720. Replace four old containers `[280,180,260,180],[670,180,260,180],[280,520,260,180],[670,520,260,180]` with `[400,80,320,160],[320,816,300,64],[1080,240,120,240],[660,432,260,108]`. New booth void `[[240,480],[420,480],[420,664],[396,664],[396,504],[240,504]]`. New boundary:
`[[0,240],[180,240],[180,80],[1000,80],[1000,0],[1200,0],[1200,480],[1120,480],[1120,640],[1200,640],[1200,880],[180,880],[180,640],[0,640]]`.
Breaches `[[100,100],[1100,100],[100,780],[1100,780]]` → `[[260,160],[1100,120],[100,560],[1060,760]]`.

**Loading** width1200 retained; height880 →960; spawn140/440 and exit1080/520 retained. Scar void0 retains every original coordinate. Add repair trunk `[560,80,100,220]` as void1, overlapping the scar's north shoulder. Replace floating freight `[300,600,100,70],[640,740,120,50]` with hull-backed `[280,840,140,80],[700,840,200,80]`. New boundary:
`[[40,240],[180,240],[180,80],[760,80],[760,40],[980,40],[980,160],[1160,160],[1160,700],[1040,700],[1040,920],[280,920],[280,800],[40,800]]`.
Breaches `[[220,260],[1000,240],[300,740],[860,720]]` → `[[220,260],[1040,240],[160,680],[980,800]]`.

**Transmission** keeps1200×880 and exit1100/440; spawn100/440 →600/440. Dish `[480,260,240,180]` → `[480,0,240,180]`; stock `[290,580,180,100],[770,580,180,100]` → `[200,720,180,160],[1040,640,160,160]`. Add two chancel partial walls `[420,320,160,24],[760,320,160,24]`. New boundary:
`[[0,240],[200,240],[200,40],[480,40],[480,0],[720,0],[720,40],[1200,40],[1200,800],[1040,800],[1040,880],[200,880],[200,640],[0,640]]`.
Breaches `[[100,100],[1100,100],[100,780],[1100,780]]` → `[[280,160],[1080,160],[100,560],[940,780]]`.

## Rendering and shared hooks

Owned `Room8RepairArchitecture.ts` separates `room8OrganicVoids(t)` (void0 only) from `room8RepairVoids(t)` (remaining structural partitions). `room8RepairArchitecture(t)` builds the actual repair trunk with closed casing, captive cover, lap seams and one physically rooted warm fixture; maximum height.866m, maximum3 batched material draws. It has no live light/cache/simulation state and owns disposable geometry/materials exactly once.

Two loading-bed-derived flush guide pairs replace the previous four apron patches, scattered markings and hardcoded guide positions. For each live bed, guide centers are `r.x+8` and `r.x+r.width−8`, z=`r.y−68`, length88. Their highest vertex is.019m; the quiet turning floor has no scatter. Metadata: `replacesLegacyLoadingFloor:true`, `loadingGuides`, `lightFixtures`; predicate `room8UsesAuthoredLoadingFloor(t)`. Legacy one-scar plans return an empty group without allocating materials.

Shared root hooks (outside child ownership):
1. Activate `SHIP_ACT2_PLANS` in the shared map; derive runtime topology as usual.
2. Generic Armory builder omits extra extrusions for void0/1 (the actual carousel model owns those) and extrudes the added rear spine. Retain original kit assets and weapon assembly.
3. Loading deck must subtract the UNION of the overlapping scar/trunk from the exact hull; independent Three holes overlap and are invalid.
4. In `breachedBay`, iterate only `room8OrganicVoids(t)` for colony/seal/torn-edge construction. A structural rectangle must never enter the organic remnants loop (which assumes the original five-edge scar).
5. Suppress legacy Loading apron/guide recipe when `room8UsesAuthoredLoadingFloor(t)` is true. After `f.finish()`, append `room8RepairArchitecture(t)`.
6. Use function-tied loading/issue/uplink floor cues and architecture-shaped fixture spill in shared dressing/lighting. Transmission's dish follows the new minimum-y obstacle through the existing dressing consumer. No camera bound/scale rule changes.

Suggested compositions: cold task illumination down Armory's hull-backed issue spine with a warm quiet court; side-lit Freight canyons, dark container faces and an open tow floor; warning mass rooted at Loading's actual trunk/scar with a quiet southern apron; one dominant uplink apse and secondary airlock source over the broad, quiet Transmission nave. Final lighting/luminance/capture evaluation belongs to the root.

## Tests and migration policy

- New `L8Act2Architecture.test.ts` validates prospective templates directly through `createRoomTemplateGeometry`; it does not depend on activating a candidate in global state. Retains the complete structural/opening/physical seal/native breach/area/arena checks and7344 bounded dense native contact paths.
- `ArmoryCarouselLayout.test.ts` replaces the exactly-two-voids/old anchor pin with exact first-two equipment silhouettes plus the real magazine spine and new breach coordinates. The old outer loop through the new magazine is replaced by both outer retreat aisles and the broad southern connection. R16/28/38 mouth/inner/spindle sweeps and cover/clear-shot assertions remain. No navigation helper changes.
- `Room8Placement.test.ts` replaces old floating-pallet coordinate pins and the superseded north loop with exact hull-backed stern beds and two generous southern lanes. Every step retains R16/28/38 occupancy, continuous native corpse sweeps, raw breach/entry/exit reachability and sealed-scar ray intersections. Uses the prospective candidate directly while integration is pending.
- New `Room8RepairArchitecture.test.ts` checks separate scar/trunk classification, exact solid support of raised vertices, floor topology/height, bed-derived guide coordinates,3-draw cap, physical fixture support and exact-once disposal. Legacy no-allocation behavior is covered.
- `Room8Visuals.test.ts` replaces the superseded three apron-material pins with the actual three repair/guide materials, verifies finite vertices and≤.019m flush guides, requires4 bed-derived channels and rejects all3 old recipe materials. Exact-once disposal and isolation from all other bespoke rooms remain, now traversing nested modules.
- `ArmoryCarouselModel`, `ArmoryBlockout`, and `Room8Models` preserve their full source/baked-vertex support, fixed-scale weapons, equipment detail, sealed organic surface, support/skid, material and lifecycle assertions.
- New `L8Act2CrowdSoak.test.ts` extends the unchanged A3 native20-actor/5-family method to entry, exit and every named sub-space (22 scenarios/440 initial actors), validates every accepted swept movement leg, and writes optional machine-readable evidence via `L8_ACT2_CROWD_REPORT`. This is finite-fight opportunity evidence, not a campaign completion claim.

Final CPU summary lines, native crowd timings and source commit are appended after integration below. No browser/capture/benchmark jobs are run by this child because the root owns the single-browser schedule. Matched campaign cohorts, replay campaign determinism, all20 final gallery, smoke gates and hardware budget acceptance remain root-owned; no final art/performance/balance acceptance is claimed here.


## Integrated CPU receipt

Plan/Armory source landed in shared commit `b818728` (another agent committed the shared index during the staging approval delay; no history rewrite). The final12-unit Freight correction and renderer/fixture source are committed separately. Branch: `t3/re-author-story-room-layouts`.

```text
Prospective checker: armory errors:[]; freight-hold errors:[]; breached-loading-bay errors:[]; transmission-chamber errors:[]
Owned plan/Armory/helper batch: Test Files5 passed(5); Tests35 passed(35)
Integrated L8ArchitectureClearance + roguelikeRooms + A3CrowdSoak Act2/name filter: Test Files3 passed(3); Tests21 passed |103 skipped(124)
Room8Placement + Room8RepairArchitecture + Room8Models + Room8Visuals + L8Act2CrowdSoak: Test Files5 passed(5); Tests38 passed(38)
```

The integrated filter is intentional room ownership, not skipped Act2 coverage: all4 rooms have complete direct prospective checks,8 native entry/exit cases and all named-space crowd cases. Evidence logs are kept beside the prospective plans.

| Room | Native crowd scenarios | Actors resolved | Maximum last opportunity | Entry / exit last opportunity |
| --- | ---: | ---: | ---: | --- |
| Armory |5|100 /100|18550ms|18100 /18100ms|
| Freight Hold |6|120 /120|17200ms|10000 /10650ms|
| Breached Loading Bay |5|100 /100|10450ms|9400 /10450ms|
| Transmission Chamber |6|120 /120|8100ms|3150 /8100ms|

`crowd-results.json` records every individual named-space time. All are under the unchanged60000ms horizon. The first Freight named-space run failed at Starboard dispatch; the final y432 corner correction passes all22 cases. No assertion was removed to obtain the pass.

Additional generic navigation invariant batch initially23passed/1failed: `FacilityNavigationClearance`, `A1LaunchSweepReview`, `spitterProjectileClearance` pass; `EnemyMovementSweep` recorded Shielding Gate start lies inside the new Act4 solid and requires honest fixture migration. Root delegated that migration to this child after Act2 completion. This is distinct from the Act2 checker and native crowd results.
