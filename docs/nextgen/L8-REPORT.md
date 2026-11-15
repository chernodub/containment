# L8 implementation report — release gates in progress

Branch: `t3/re-author-story-room-layouts`. Baseline gameplay source: `7ceefa5a52cc74a6b95712f29653d9bf523906be`. Current audited gameplay source: `659ac9ddf167b9d0b24ec65001ebd2912aaf79e2`. Guarded equipment-feed rendering source: `9b6fb7abb79d30ae0fbffc72109028c2266a6a4e` (identical gameplay bytes). This document does not yet claim final art, cohort or performance acceptance.

## Plan language and hard geometry proof

The lead-rejected floating-island standard was withdrawn. Replacement standard round9 uses hull-connected cabins/booths/banks, actual named sub-spaces, wide openings and waist-height cutaways. It passed three substantive plan/dressed/native critique rounds before propagation; the critique ledger is `plans/L8-standard-review.md`. Residential uses existing CC0 beds, desks, chairs and cutaway lockers. No disc-pool recipe is retained in the inspected standard; fixture-shaped spill follows cabin doors, scanner/guard circulation and cooling aisles.

Independent implementation review `plans/L8-final-plan-review.md` withheld ship-wide semantic acceptance because Diagnostic/Workshop named uninterrupted floor as separate rooms. The subsequent revision adds actual hull-connected workbay dividers, jambs and side doors; broad mouths are honestly represented as single apertures with two lanes. Safety's equipment band is now named an open instrumentation gallery. The shared checker rejects fake floor doors, missing jambs, overlapping lanes and blocked thresholds. Native proof and guarded captures cover the revised geometry; premium art acceptance is still not claimed.

Every plan passes solid-UNION measurement with at least60% hull-connected area, at most2 free components, at least3 named legal spaces, two articulated named hull bays,140-unit openings, R70 opening midpoints, full-span R32 sweeps, an R144 fight circle and actual raw/inward breach access. Nonholdouts additionally pass graph-cycle AND physical sealed-door reachability. Only Transmission/Overload receive holdout exemptions. All16 legacy templates, story text, ids, route generation and checkpoint formats remain unchanged.

|Room|Plan language|Walkable before → after|Ratio|Connected solids|Free groups|
|---|---|---:|---:|---:|---:|
|awakening-bay|Release threshold, pod aisle, recovery bay and observation/service circuit.|748840 → 829060|1.1071|63.49%|2|
|passenger-vault|Hull-backed cryo banks, central inspection aisle and southern service return.|691056 → 644360|0.9324|78.82%|1|
|residential-gallery|Six furnished cabins open onto a gallery, common nook and exit bay.|961000 → 931280|0.9691|100.00%|0|
|communal-atrium|Galley frontage, inhabited common floor, living garden and welcome nook.|316332 → 377040|1.1919|68.34%|2|
|crew-checkpoint|Entry vestibule, inspection booths, scanner hall, two bypasses and open guard cage.|973184 → 795712|0.8176|84.86%|2|
|armory|Hull-connected magazine, retained horseshoe issue counter and fitting/weapon court.|940184 → 826832|0.8794|86.81%|1|
|freight-hold|Loading neck, stock court/control booth, tow floor and recessed dispatch.|868800 → 755760|0.8699|73.24%|2|
|breached-loading-bay|Docking apron, structural repair trunk around the retained hull scar and pressure lock.|655540 → 728080|1.1107|100.00%|0|
|relay-racks|Two rack aisles around a service spine, north cross-aisle and console bay.|973000 → 948800|0.9751|85.55%|1|
|transmission-chamber|Defensible transmission nave, uplink chancel/apse, airlock and service chapel.|976800 → 812672|0.8320|93.73%|2|
|diagnostic-gallery|Four actual three-sided workbays, nave, service side doors and access landings.|969600 → 898600|0.9268|99.66%|2|
|safety-interlock-station|Open recorder/AI gallery, low interlock cage, battery return and independent galleries.|982400 → 936544|0.9533|93.59%|2|
|coolant-plant|Wall pump galleries and split return banks with a real cross-service opening.|956000 → 958400|1.0025|89.19%|2|
|service-shaft-landing|Retained C balcony around the shaft; upper/lower docking recesses and local lift.|802000 → 783600|0.9771|100.00%|0|
|infested-workshop|Loading dock, lathe/tool/gantry workbays, side door and rear service gallery.|948400 → 939040|0.9901|99.82%|1|
|swarm-junction|Deep hull-connected vent banks around a playable northern crossing and hull exit.|950800 → 764680|0.8042|100.00%|0|
|shielding-gate|Offset shielding banks, inspection scanner floor and sterilization bypass.|965000 → 794800|0.8236|100.00%|0|
|containment-annulus|Intact translated sealed core, two inspection-ring routes and paired airlocks.|707600 → 794400|1.1227|62.92%|1|
|manual-control-chamber|Hardwired authorization booth, core floor, fatal-cost gallery and core threshold.|972400 → 924000|0.9502|100.00%|0|
|overload-floor|Intact translated core, western holdout floor, reaction feed and exhaust gallery.|607160 → 717600|1.1819|68.29%|1|

Areas use the deterministic2-unit UNION method; continuous occupancy PNG area differs slightly at polygon edges. Every room remains within±20%. All old/new coordinates, including every hull/void vertex, obstacle, spawn, exit and breach, are recorded with exact source ids in `artifacts/nextgen/l8-sim/final-combined/all20-numeric-layout-changes.json`. It asserts that no template fields beyond the eight authorized geometry fields changed.

All20 labeled final plans and the20-up comparison are under `artifacts/nextgen/l8-final/release/plans/`. The final native gallery will live under `artifacts/nextgen/l8-final/release/`; earlier rejected review files at the parent path retain their original receipts.

## Simulation and finite encounter changes

Final hard proof receipt: `artifacts/nextgen/l8-sim/revised659-hardproof/receipt.json`. Thirty-four files /840 tests pass;20 strict checker errors arrays are empty. All five independent geometry packets hash to `e18ff45ab40c0dde0222e1aba76d6e67338d77e756730f641ca31f66cd885d44`.

- 168 native mixed-crowd targets /3360 actors:0 unresolved; worst22.35s.
- 3360 native family/breach opportunities:0 missing; worst29.60s. Carriers are checked at their real visible holding range; Spitters must complete real firing attacks.
- 2256 dense legal marine positions /45120 five-family routes:0 failures;2256 reachable native Spitter firing fields.
- 4 rigs ×20 rooms ×120 fixed steps ×2: identical every-frame state/effect hashes and legal sweeps.
- 3 actual Brute corner controls pass. Exact native rounded sweeps and short committed navigation legs fix real stalls without changing actors.

The original825 layout packet failed balance. V1 and V1.1 corrected the pump/workshop rig skew but remained too fast/easy. The separate Transmission door-spacing experiment shortened fights further and was rejected. All raw failed packets remain. Live source combines the proven V1.1 pump/workshop layout with rear cabin/booth/service ingresses; entrance spacing is not claimed to guarantee slowdown.

Only four encounter counts change, after those layout-first experiments:

|Room|Requests before → after|Last scheduled request before → after|
|---|---:|---:|
|Transmission|32 →34|23900 →25400ms|
|Diagnostic|27 →29|4230 →4410ms|
|Safety|28 →30|4320 →4500ms|
|Shielding|31 →33|4400 →4580ms|

These are eight additional actual seeded enemies per complete campaign. Every original request/RNG field is retained exactly. Family pools, caps, first650ms, interval formulas, progression, firstfive introductory encounters and Overload48 remain unchanged. No timer padding or artificial clear wait was added. The historical200-plan digest remains exact after removing only those four tails.

The fixed final validation is160 matched attempts/profile,40 declared seeds/rig, unchanged policy `976eb173f26b67e0d02806b91b316a13fc11eecee94ba0310ac2287a7e402502`. Declaration: `plans/L8-N40-VALIDATION.md`. Baseline160 completes88/160=55%; B47.5/C75/P35/A62.5%; maximum rig distance20pp is an inherited miss. The revised659 complete160 packet fails acceptance:98/160=61.25%; B42.5/C82.5/P52.5/A67.5%; maximum distance21.25pp (range40pp), ordinary29.9167s. Transmission61.5167s, every-rig Overdrive cadence, natural terminals, welcoming firstfive and deaths9–20 pass. Exact paired comparison is `artifacts/nextgen/l8-sim/revised659-N160-comparison.{json,md}`. This failed packet remains immutable; a further measured source revision and full controlled rerun are required. Diagnostic overrides never count as release evidence.

Frozen final full-kit guard passes unchanged30–45% ability attribution and≤1.25× clear-time spread: B33.1691/C32.6012/P42.3396/A32.6459%;93.25/97.15/80.70/89.05s; spread1.20384×. All rigs use every slot, earn OD and resolve the same55 actual kills. Campaign direct/status/weapon buckets are reported separately. The unchanged actual `I5Cadence.mjs` guard also passes.

## Presentation and verification audit

Geometry owns decks, hulls, cutaway partitions, fitted kit reservations, seam growth and radar footprints. Shared deck clipping subtracts overlapping solid UNION once. New function-tied floor marks replace detached patch/confetti recipes. All20 live rooms disable circular suit-fill pedestals while retaining the directional marine lamp. Core decorations stay within the unchanged C6/E7 combat-plane, body/HUD, hero-scale and AABB bounds.

All migrated tests and reasons are listed individually in `plans/L8-test-migrations.md`. Old camera/construction/navigation reproductions use exact historical fixtures; independent live-room tests preserve actual current guarantees. The Safety service owner consolidates903 static meshes to24 using the existing collider-part-preserving batcher, with unchanged triangles/bounds/rays/names/routes and exact-once private disposal.

No UI, actor, ability, checkpoint schema, run-generation or story-text source is edited.52 frozen observer/presentation imports and five actor GLBs remain byte-identical to baseline, recorded in `final-observer-actor-identity.json`.

Final required gate summaries, native campaign receipts, source-hashed20-up calm gallery, per-room absolute image paths and quiet paired hardware budgets remain pending below. The full `npm run verify` chain is expected to stop at the documented pre-existing absent-Blender asset tests; engineering explicitly prohibits installing Blender or bypassing those tests. Other Python asset checks use the isolated Pillow environment, without changing repository prerequisites.

## Remaining release gates

Additional exact-opening A3 coverage exposed a liveness gap omitted by named-space/grid samples: six of157 opening midpoints left mixed actors unresolved at60s (Awakening, Atrium, two Diagnostic thresholds, Workshop, Annulus). Full failed states remain in `artifacts/nextgen/l8-sim/opening-midpoint-native-dispatch659/`. Repair `c7c75b9` expires a stale navigation commitment after eight deterministic native decisions without one unit of net improvement; same-decision speculative queries never advance that counter. Plain callers retain position-based observation. It changes no actor, ability, collision predicate or BFS algorithm. All157 openings/3140 actors now resolve under the unchanged60s native horizon, with accepted body sweeps and the actual director's240-unit occupied-breach fallback. Five focused files/173 tests pass, including exact stale states, completely stationary actors, healthy slow progress and prior corner/jitter controls. Details and red/green evidence: `plans/L8-navigation-progress-repair.md`. Broader final proof and a new controlled cohort remain required; the earlier659 cohort cannot certify this repair's balance.

The659-game/9b6-render preflight now passes the full JavaScript suite (`399 passed | 2 skipped` files; `5040 passed | 2 skipped` tests), build, native desktop smoke and exact `test:authored-smoke:all`: `Authored desktop smoke passed: 20 rooms, native move/fire, Continue/route, pause/resume, Low quality, no browser errors.` The full verify then stops at the documented absent Blender executable in `MonitorArtifacts.test_imported_geometry_regression`; no test or asset was altered to bypass it. Both skips are existing opt-in CPU-profile/historical-camera-replay suites. Logs and hashes: `artifacts/nextgen/l8-sim/verification-preflight-250ee77/receipt.json`. These are source preflight passes, not acceptance of a later geometry revision.

- Final PNG art review and all20 guarded entry/arena/kiting captures.
- Final fixed160 cohort table and target assessment.
- Final native browser campaign per rig; desktop smoke, all20 authored smoke and playtest smoke.
- Full Vitest, build, room-evidence and verify summary lines.
- Quiet measured benchmark/preparation comparisons with every raw miss and host-load receipt.

No final completion claim is made until these results are recorded.
