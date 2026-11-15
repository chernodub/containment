# L8 Swarm north-bank proposal — dormant

Selected export: `SHIP_SWARM_BAY_340_ARENA400_CANDIDATE` in `src/game/roguelike/shipArchitectureSwarmBayCandidate.ts`. No live registry is changed by this module. It retains the original hull, southern banks, spawn100/520, exit1100/520, ID, story/checkpoint format and encounter counts. Other exports retain the rejected300-depth and340/520,340/420 studies for comparison.

The former north ventilation banks now meet the broad fighting throat instead of sitting outside its useful view. Their inner faces are424/776, leaving352units of real circulation. The actual authored arena is600/400, inside the clear throat; it changes no camera rule or transform. The original600/520 circle also remains R144 legal. Named Growth crossing still contains both positions. Native bot storyboards must corroborate actual fighting here before any claim about organic use.

| Quantity | Current | Selected dormant |
| --- | ---: | ---: |
| Hull dimensions |1200×1040|1200×1040|
| North-bank depth |180|340|
| Inner faces |440/760|424/776|
| Walkable area |843400|764680|
| Original frozen walkable baseline |950800|950800|
| Ratio to frozen baseline |88.704%|80.425%|
| Solid union |199800|278520|
| Hull-connected solid union |199800|278520|
| Connected / free groups |100% /0|100% /0|
| Arena |600/520|600/400|
| North breach raw Y |260|440|
| North feature mount Y |180|340|

Northern chamfers end at394/340 and806/340, beginning at424/310 and776/310. The two lower banks are unchanged. First port/starboard crossings become144-unit spans atY384–528; their second spans remainY560–720. The northern352-unit throat carries two distinct144-unit spans, X456–600 and600–744 atY360. They share only an endpoint; sealing either leaves the other physical R32 route. Obsolete north-to-side gallery connections are removed. Every opening remains≥140, its R70 midpoint and full R32 span/normal crossing are clear, and physically sealing every opening preserves all-space reachability.

The300-depth study passed geometry/native proofs but put0% bank context in the quiet main viewport and only1.40% in the crowded main viewport. The340-depth study with the old600/520 arena still showed0% quiet context. These were not accepted solely because the floor/landmark upper bounds passed.

Selected600/400 uses the actual broad throat by the new banks. With the unchanged native camera solver, normal/reduced motion and positive/frozen presentation:

| Main view | Marine height | North-bank combined share | Largest bank share | Walkable viewport samples |
| --- | ---: | ---: | ---: | ---: |
| Quiet |122px|15.60%|9.82%|87.18–88.03%|
| Four nearby contacts |100px|21.75%|11.93%|82.05%|

All retain full eight-corner marine HUD clearance and≤18% room-AABB outside area. These are deterministic CPU projections, not native screenshots or hardware performance. The alternative600/420 study shows12.97% quiet /19.13% crowded bank context, less than the selected throat.

Validation:

```text
node scripts/nextgen/l8-check-plan.mjs src/game/roguelike/shipArchitectureSwarmBayCandidate.ts SHIP_SWARM_BAY_340_ARENA400_CANDIDATE
walkableArea764680; connectedFraction1; freeGroups0; areaRatio0.8042490534286916; errors[]
VITEST_MAX_WORKERS=2 npx vitest run tests/L8SwarmBayCandidate.test.ts tests/L8SwarmBayFraming.test.ts
```

The selected native proof includes a64-unit marine field:173 legal goals,3460 native-family breach routes, zero failures. Spitters require a real legal firing position in the native180–420 range and a radius9 projectile sweep. The checker additionally retains its dense14/18/24/28 navigation field.

Thirteen anchor cases cover all named spaces, entry/exit, both the chosen and old encounter floors, the new mouth and four front/chamfer fringes, including marine-legal positions too close for the largest enemy to occupy directly. Mixed native crowds resolve260/260 original bodies through legal range/LOS opportunities and ordinary full health+armor damage, last opportunity≤4100ms. Another260 single-family/breach cases reach native contact attacks, spitter hazard attacks or the carrier's native holding/firing band within60s. Accepted multi-leg movement is checked on every native enemy update. Carrier child requests are not dispatched; this is finite-fight geometry liveness, not campaign completion.

Replay compares120 native crowded ticks twice. Four cardinal220-unit R32 escape sweeps, the R144 ability reserve and long cross-ship firing lane remain legal. The unchanged G6 geometry fixture packs≥10 spaced threats from all five families at the selected arena. This mocked fixture check is not a browser firing receipt or an organic campaign. No simulation, actor or ability system is edited.

Plan PNGs, inspected as files:

- `artifacts/nextgen/l8-swarm-bay-proposal/selected-plans/swarm-junction.png`
- `artifacts/nextgen/l8-swarm-bay-proposal/comparison.png` (current /300-depth study / selected340-depth throat)

Activation remains parent-owned. Before rendering the candidate, `Act4Architecture.ts` must select the active plan rather than the original `SHIP_ACT4_PLANS`, and the two Swarm north fixtures in `ShipArchitectureRoom.ts` must follow the selected north feature mounts atY340. The existing seam-growth helper already reads the active plan and clips against its passed template. Parent will run the new combined cohort, all20 hard proofs, native guarded evidence and an organic Swarm storyboard; no activation, new draw/FPS claim or final visual acceptance is made here.
