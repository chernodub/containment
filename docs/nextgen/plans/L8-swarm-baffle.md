# Dormant Swarm vent-return candidate

Export `SHIP_SWARM_BAFFLE_CANDIDATE` from
`src/game/roguelike/shipSwarmBaffleCandidate.ts`. It derives from active
`SHIP_SWARM_BAY_340_ARENA400_CANDIDATE`; nothing registers this new map.
This is a geometry-only counterplay study, not balance or release acceptance.

Only the two northern void polygons change. The original inner chamfer runs to
408/326 on the port side (mirrored at792/326). An eight-unit attached return
then descends, with an eight-unit inward dogleg between y384 and404, ending at
460. The port upper/lower fin bands are400..408 and408..416; starboard mirrors
these at792..800 and784..792. Source machinery reservations, hull, southern
banks, arena600/400, spawn/exit, all four raw breaches and feature mounts are
exactly preserved. No actors, abilities, encounters, policy or camera change.

Open circulation planes move320→300 and880→900. Port approach spans x0..300;
Growth crossing spans300..900; Hull exit spans900..1200. All anchors retain
their original coordinates. Corresponding side edges and SouthAirway spans
move honestly with those bounds:160..300 and900..1040 remain140 units wide.
These are circulation annotations, not claimed physical doors. Full R32 spans,
R70 opening midpoints, sweeps and sealed-opening alternate routes pass.

| Measurement | Active340 | Candidate |
| --- | ---: | ---: |
| Walkable area | 764680 | 762500 |
| Walkable / frozen950800 baseline | 80.4249% | 80.1956% |
| Solid area | 278520 | 280700 |
| Hull-connected solid | 100% | 100% |
| Free solid groups | 0 | 0 |

The candidate adds2180 solid units. It retains1860 units above the strict80%
walkable floor; no area waiver or encounter adjustment is used. R144 at the
original arena remains clear, as do the open cross-ship gallery at y520 and the
north–south throat. The old y400 cross-ship sightline is intentionally broken
by the vent returns. Native Railbreaker still hits two separated bodies inside
the actual fight floor; all four native wall/dash orientations remain usable.

Two rejected revisions exposed real failures and remain in the evidence.
The initial exact filled-chamfer/straight-return proposal stranded Brute and
Stalker attacks at marine440/330 (eight trials); original-layout controls pass.
Retaining the chamfer and moving the straight return outward repaired that
point, but Brutes failed at retained cover-side marine824/400 (four single
trials and one mixed crowd). The final local dogleg repairs both sets without
moving or deleting any failing target. Their raw JSON, exact geometry and logs
remain under `failures/`. The original440/330 and760/330 points, all cover sides
and tips, and all exact opening midpoints remain in final native/crowd coverage.
Two independent marine escape routes are tested for both original fringes and
both sides of both returns.

At stationary arena600/400, the actual native ranged comparison is:

| Family / entrance | Active first opportunity | Candidate first opportunity | Candidate position / range |
| --- | ---: | ---: | --- |
| Spitter NW | 550ms | 1250ms | 382.3/485.8;234.0 |
| Spitter NE | 550ms | 1300ms | 809.6/482.6;225.3 |
| Spitter SW | 1000ms | 1000ms | 364.1/739.6;413.5 |
| Spitter SE | 1000ms | 1000ms | 835.9/739.6;413.5 |
| Carrier NW | 100ms | 700ms | 381.4/473.0;230.5 |
| Carrier NE | 100ms | 700ms | 818.6/473.0;230.5 |

Both northern raw R9 spit lines are interrupted. Northern spitters route around
actual lower tips before completing their attack. Their first visible samples
move from50ms to600/650ms, and R9-clear samples to750/800ms. Carriers use their
native visible-holding criterion rather than projectile clearance. Southern
opportunities are unchanged. The64-row comparison also measures open-gallery
and both inner-cover targets, recording initial visibility, first sightline,
actual attack/holding time and position. This is directional counterplay, not a
claim that every spitter must enter Seismic Slam's230-unit radius: even this
fixed NW opportunity remains234, and southern ones remain413.5.

Final focused proof: four new files,67 tests pass; TypeScript passes. Strict
prospective checker returns errors[]. Dense64-unit sampling covers173 marine
goals and3460 actual five-family/breach routes. Native opportunity proof covers
520 trials at26 unique targets (maximum13.2s against60s). All26 production-
dispatched mixed20-body crowds clear (520 actors; maximum7.7s against60s).
Occupied entrances use the exact production240-unit farthest-breach fallback;
dense routing still starts independently from every native breach. The16
original fringe-control trials also pass. Native crowded states/events replay
identically across120 steps. All native Bulwark/Glacier orientations, complete
four-rig dashes and the actual two-body Railbreaker line pass unchanged bounds.
G6's five-family/spacing/fire/grenade fixture packs against this geometry.

C6/E7 tests retain all marine body corners, full HUD-safe viewport, hero size,
18% AABB limit, both desktop heights and motion settings. Quiet/crowded/frozen
F2 checks report85.47% quiet and82.05% crowded walkable viewport samples; each
northern bank AABB remains below35%. Combined bank AABB shares are33.73% quiet
and39.83% crowded, providing structural context. These are CPU composition
measurements, not a dressed art score or hardware performance result.

Evidence: `artifacts/nextgen/l8-swarm-baffle/strict-check.json`, `proof/`,
`plans/swarm-junction.png`, `plans/twenty-old-new.png` and `failures/`.
Exact baseline+candidate plan/template SHA256:
`a42782e59b7783f3fe2e25c69fd4ec2cb9f2d90032be0b381457ca39b2b0e5bf`.
The parent owns plan review, activation, cohorts, rendered captures, measured
budgets and full integration gates. No browser or cohort was run for this study.
