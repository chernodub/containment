# L8 reviewed rear-vent ingress

Source map: `src/game/roguelike/shipIngressCandidates.ts`, export `SHIP_INGRESS_CANDIDATE_PLANS`, source commit `0e6a325`. This was validated dormant, then the root selected it and Act3 explicitly activated the overrides through the integration registry. This child never edited the active registry or encounters. Original Transmission doors are untouched. All room hulls, voids, obstacles/furniture, named spaces, openings, arena circles, spawn/exit anchors, route, story and save format remain exact base-plan values.

## Coordinates and architecture

Each row lists raw breaches in stable breach0–3 order, then physical feature mounts. Enemy inward offsets remain the native±56 rule; no steering or spawner policy changed.

| Room | Old raw coordinates | New raw coordinates | New mounted features |
| --- | --- | --- | --- |
| Residential |460/200,860/200,340/740,1100/740|592/80,1030/80,200/880,1030/880|600/40,1030/40,200/920,1030/920|
| Crew |380/200,980/160,380/680,980/720|380/160,980/120,380/720,980/760|380/120,1080/120,380/760,1080/760|
| Diagnostic |300/220,980/220,300/760,980/760|600/80,960/80,456/880,960/880|600/40,960/40,456/920,960/920|
| Safety |300/260,980/260,300/820,980/820|160/80,1100/80,360/880,920/880|160/40,1080/40,360/920,920/920|
| Shielding |260/420,1140/180,260/780,1140/540|704/200,980/120,300/840,704/920|704/160,848/120,300/880,704/960|

The proposed Residential600/80 faces west at the1200-wide room's midpoint, making native544/80 only34 units from the bed's east edge510. It fails the requested R38 stress. Moving only the raw x600→592 faces east to648/80, between bed and desk, while retaining the real locker vent600/40. No bed or desk was moved. All other requested Residential/Crew coordinates are exact.

Residential rear locker vents use the actual cabin aisles and side-door structure. Crew enters from the back of the inspection booths and the ends of the bypasses. Diagnostic uses rear distribution-header vents behind recorder/instrument partitions and rear return vents on opposite sides of the service spine. Safety uses the outboard recorder/AI booths and the two battery-return aisles. Shielding uses the north power housing's real service face, the cabinet's east rear face, the sterilization rear wall and the lower shield-return doorway. Those faces belong to existing hull-connected machinery. All mounts are nonwalkable actual surfaces and within140 units of their raw breach (maximum132).

These ingress changes create different sightline/turn choices across actual sub-spaces. They do not force an arbitrary wait, change speed, seal an escape route or change simulation time.

## Strict and native verification

```text
l8-check-plan: all5 rooms errors:[]
L8IngressCandidates + L8IngressFraming: Test Files2 passed(2); Tests116 passed(116)
npx tsc --noEmit: PASS
Existing live room/gameplay suites: Test Files8 passed(8); Tests225 passed(225)
```

The116 tests contain:5 structural/native R32/R38 ingress tests;1 exact base-geometry/no-import-mutation guarantee;50 native family-goal cases totaling1000 independent native trials;5 matched base-plan arena references totaling100 trials;50 mixed crowds totaling1000 initial actors;5 camera tests.

Every family reaches native contact, a completed native spit with R9 projectile sightline, or visible Carrier holding range≤260 within the unchanged60000ms bound. Each accepted movement graph is checked through legal native swept legs; intermediate bodies remain legal. Native spawner fallback is recorded as both requested and actual positions. Mixed crowds retain the established finite-fight “clear exposed blockers” method and exact production damage/death handling; they are not campaign wins. No assertions, time/range bounds, enemy properties or input policies were weakened.

Both raw and inward points are exactly legal at R32 and R38. Structural solid-union/area values are unchanged; all openings, alternate-route seal checks and R144 arena checks pass. The shared checker additionally routes R14/18/24/28 from all new breaches to dense legal marine positions.

Camera proof uses1080/720 desktop framing, both motion modes, actual candidate ingress priorities and all raw/inward positions plus spawn/exit/arena:220 viewpoint combinations. It preserves the100px-at1080 hero floor,≤18% outside-AABB bound and all eight marine body corners inside the measured HUD-safe viewport. No camera rule was changed.

No stale explicit old-breach pin required a migration: the dedicated live tests already read `template.breaches`. The isolated live verification passed `residentialGalleryGameplay`, `CrewCheckpointBlockout`, `L8Act3Architecture`, `L8Act3CrowdSoak`, `ShieldingGateBlockout`, `SafetyInterlockBlockout`, `expeditionGeometry` and `roguelikeRooms`. No existing test was edited or weakened for this activation.

Frozen native/camera receipt:
`artifacts/nextgen/l8-ingress-candidate/activated-proof/candidate-receipt.json`

Exact five-room template/plan SHA256:
`716968bd47aee350947990b1b50d1131a0809b6b88c4a7c4d25986c0661e0328`

The receipt records actual activation status and the original base-plan reference rooms independently of the active registry. Thus activation cannot silently turn the old-ingress timing control into the candidate itself.

## Measured likely impact, not a balance guarantee

The median below is native attack/holding opportunity across the same20 family/breach cases at the authored arena. It is not a room-clear time. Blocked LOS counts use every labeled target and all four inward points; some labels deliberately repeat important spawn/arena positions. Travel is summed accepted endpoint displacement, not an exact geodesic or FPS measurement.

| Room | Blocked initial LOS before→after | Arena opportunity median before→after | Longest native opportunity | Longest finite mixed crowd |
| --- | --- | --- | --- | --- |
| Residential |0/48→12/48|2175→3650ms|16800ms|7850ms|
| Crew |18/48→14/48|2850→3125ms|14750ms|11750ms|
| Diagnostic |0/32→11/32|2275→2950ms|14600ms|6400ms|
| Safety |18/40→26/40|4075→4625ms|17400ms|12200ms|
| Shielding |3/32→8/32|2700→2350ms|16300ms|10050ms|

Residential, Diagnostic and Safety gain genuine occluded approaches, with later controlled arena opportunities. Crew's back-of-booth positions add modest travel while opening some prior occluded angles; this is not uniformly more cover or difficulty. Shielding gains occlusion across sub-spaces but reaches the central arena faster in this controlled witness. Its geometry must not be advertised as a guaranteed slowdown. Final campaign difficulty depends on enemy requests, wave overlap, player movement/build and combat; the root's separately authorized real-request adjustments and matched N160 cohorts determine actual acceptance. No completion, clear-time, Overdrive or death-distribution target is claimed from these fixtures.

## Plan evidence and remaining gates

Inspected labeled PNGs:
- `artifacts/nextgen/l8-ingress-candidate/plans/residential-gallery.png`
- `artifacts/nextgen/l8-ingress-candidate/plans/crew-checkpoint.png`
- `artifacts/nextgen/l8-ingress-candidate/plans/diagnostic-gallery.png`
- `artifacts/nextgen/l8-ingress-candidate/plans/safety-interlock-station.png`
- `artifacts/nextgen/l8-ingress-candidate/plans/shielding-gate.png`

The context contact sheet is `plans/twenty-old-new.png`; its old references are exact V11/base-plan templates from `v11-reference-templates.json`, so the five changed pairs show ingress changes with identical furniture. Other15 rooms remain context. One final contact sheet is retained; no intermediate PNG rounds.

Machine metrics: `ingress-metrics.json`; strict checker: `check-plan.json`; CPU receipts: `activated-tests.log`, `camera.log`, `live-gameplay-tests.log` in the same evidence directory. This child ran no browser or performance bench. Native playing captures, full verification, final cohort balance and hardware performance remain root-owned. Act4 owns the final seam-growth depth repair and its capture freeze; this child made no competing growth edits.
