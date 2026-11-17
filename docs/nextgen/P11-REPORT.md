# P11 — twenty-room craft and incident pass

All twenty story rooms now have authored set pieces and incident details. The lead reviewed all final native tours, combat frame 02 and 480×270 E10 comparisons. This supersedes the initial Relay-only report. Campaign and measured results are recorded below; the remaining visual weaknesses are not claimed as solved.

## Delivered scope

Twenty original room landmarks, forty-five revised E9 modules, ten new service modules and the Lantern Brood infestation set. Blender generators and the common modelling/baking library are retained; `sh tools/assets/p11-set-pieces/rebuild.sh --render` rebuilds the authored packs sequentially with four Blender threads. Original work remains MIT. Retained third-party notices are unchanged.

Every hero received a second craft pass after the initial machine/growth rejection. The four standard-room review rounds and subsequent R11 corrections are recorded in `plans/P11-review.md`; `plans/P11-R11-review.md` tracks the twenty incident requirements. Primitive smooth growth was rejected again during R11: the replacement has overlapping shell, captured broken machinery, tendons and egg clusters.

The R11 hierarchy pass removes repeated ceiling rafts and redundant pendant/bridge assemblies, reduces recessed floor services to two peripheral windows, reduces fixture emission and softens perimeter pools. It changes room art placement, not the lighting engine. Grates sit below .022m and require deck support at corners/edges; detached oval wear marks were replaced with rail-attached wear. Passenger glazing samples actual carrier support.

## Room inventory

| Room | Landmark and incident | Hero triangles including attached incident |
|---|---|---:|
| Awakening Bay | Cryo berth array, failed canopy release and recovery tether | 11,582 |
| Passenger Vault | Sleeper carrier with an opened personal-effects drawer | 3,148 |
| Residential Gallery | Common nook, interrupted meal, drawings and fallen chair | 3,872 |
| Communal Atrium | Conservatory with broken glazing support and abandoned irrigation repair | 9,519 |
| Crew Checkpoint | Scanner gate and fractured ballistic barrier | 5,510 |
| Armory | Weapon carousel with empty issue positions and dropped equipment; counter darkened | 6,520 |
| Freight Hold | Gantry with shifted suspended load, snapped sling and collapsed pallet | 9,926 |
| Breached Loading Bay | Wedged cargo pod, thick peeled hull plating and exposed ribs | 5,982, plus runtime hull |
| Relay Racks | Dark varied server spine, exposed cards, fibre trays and abandoned patch repair | 11,810 |
| Transmission Chamber | Tracking uplink with open drive repair and cut terminals | 6,608 |
| Diagnostic Gallery | Probe/cradle with patient evidence cassettes and disconnected lead | 7,396 |
| Safety Interlock | Key-cylinder cage welded shut with snapped release | 8,806 |
| Coolant Plant | Turbines, ruptured return, frozen runoff/pool and anchored vapour | 11,122 |
| Service Shaft Landing | Lift winch and interrupted cable repair | 6,534 |
| Infested Workshop | Detailed milling machine consumed by shell mantle and ruptured growth | 11,964 |
| Swarm Junction | Ruptured brood plenum plus consumed duct-bank stronghold | 11,474 |
| Shielding Gate | Paired emitters and buckled shield leaves | 6,208 |
| Containment Annulus | Pressure ring with torn diaphragm and exposed internal channels | 8,988 |
| Manual Control Chamber | Physical lever dais, failed automatic cover and wired bypass | 4,830 |
| Overload Floor | Reactor crown with peeled pressure shields, bowed restraints and venting core | 9,630 |

Relay also has a separate 3,524-triangle north-wall crosspatch; Workshop has a 1,298-triangle secondary repair bench. Each individual hero remains below 12,000 triangles.

## Runtime and asset design

Static finish batches merge by source atlas; authored materials reuse the ink/banded shader and existing preparation ownership. Ten service modules are 336–1,176 triangles. Ordinary E9 modules are ≤1,500 triangles; six retained landmark-class exceptions remain: scanner 2,256, analyser 2,868, uplink 8,980, hoist 2,604, tool bridge 4,696 and airway exchanger 6,056. These are legacy landmark exceptions, not ordinary modules meeting the 1.5k limit. Some redundant landmark placements were removed.

Fourteen source packs each use one 512×512 tangent-normal atlas. AO/curvature and restrained wear are baked into vertex colors; disposable high geometry supplies normal relief. All GLBs are below 2 MB. Low omits designated secondary service geometry using retained draw ranges; heroes and warm textures remain, so no Low atlas-memory saving is claimed. Pack caches are bounded and retain exact-once asset ownership.

New static beds are shallow, connected to existing structure, outside fight circles, with ≥140-unit circulation routes. No simulation rules, actors, UI or lighting architecture changed.

## Verification and measurements

`npm ci` and `npm run build` passed. No automated tests were added or run. All twenty rooms have five-position tours and four kiting frames; the lead opened all five native tour positions, native kiting frame 02 and their 480×270 E10 comparisons. Final capture batches recorded zero errors and zero failures. Three standard-room Low views were opened at native/480 size.

Cryo / seed 1729 / Standard / unassisted campaign **completed all twenty rooms**, with zero errors and zero defects. The first segment cleared nineteen rooms and reached the one-hour tool wall limit (3,601.188 s). The same earned Manual Control clear checkpoint was resumed through native Continue; final segment completed Overload (385.857 s), for 3,987.045 s recorded total. Both segments used frozen renderer `1a451f6e`; subsequent changes only correct Overload decorative deck marks and remove redundant Interlock presentation props. No unfought room was advanced. Full evidence and provenance are in `artifacts/nextgen/p11-final/verification/`.

Combat benchmarking measured all twenty rooms. Atrium failed the sustained-population fixture requirement twice (12 s and 20 s windows); its measured resources are retained but that row is not a valid sustained-stress timing trial. Safety Interlock initially measured 337 draws; removing its redundant service atlas batch produced a passing 292-draw recheck. All other measured rooms stayed below 330 draws. Every measured trial created zero combat shaders. Host one-minute load ranged roughly 486–697 on ten logical cores; frame p95 was 50.5–217.4 ms. The 20 ms target is not met and no quiet-machine timing certification is claimed. All twenty fresh-room readiness checks passed at 855–1,991 ms, with zero errors, zero failures and zero combat/post-ready compiles. Whole-build E10/P11 comparisons include merged marine/creature/renderer changes and cannot isolate P11's performance contribution. Host load must accompany timing; quiet-machine certification remains separate.

Full GPU texture bytes are not exposed by the existing diagnostics. The table reports measured texture counts and explicitly bounded authored texture memory, rather than treating texture count or JS heap as GPU bytes. Fourteen new normal atlases total 18.667 MiB RGBA8+mip upper bound across the session; per-room source bounds and E10 floor estimates are documented in `tools/assets/p11-set-pieces/METRICS-NOTES.md`.

## Per-room before/after measurements

E10 → P11. Cryo / High / seed 1729 / 1920×1080; 12-second combat windows. Draws and triangles are observed maxima. Texture counts and ready times come from fresh-room preparation. The bounded MiB column covers the E10 High floor estimate plus the newly authored normal atlases only: **it is not total GPU memory**. Actor textures, retained Low images, other sources and driver overhead are excluded. Source cache retention can exceed a single-room bound.

| Room | Draws | Triangles | Texture count | Bounded texture MiB | Ready ms | Frame p95 ms |
|---|---:|---:|---:|---:|---:|---:|
| awakening-bay | 192 → 151 | 995,652 → 702,313 | 125 → 126 | 24.25 → 29.58 | 1613 → 1991 | 174.7 |
| passenger-vault | 160 → 119 | 787,270 → 537,311 | 130 → 130 | 24.25 → 28.25 | 1056 → 1485 | 168.2 |
| residential-gallery | 156 → 125 | 789,017 → 501,313 | 117 → 118 | 24.25 → 29.58 | 1119 → 946 | 116.9 |
| communal-atrium* | 163 → 132 | 709,470 → 472,850 | 126 → 128 | 24.25 → 30.92 | 1149 → 1443 | 141.2 |
| crew-checkpoint | 157 → 112 | 851,127 → 485,898 | 117 → 118 | 24.25 → 29.58 | 1281 → 903 | 217.4 |
| armory | 217 → 145 | 763,003 → 496,196 | 117 → 118 | 24.25 → 29.58 | 1220 → 1178 | 158.0 |
| freight-hold | 157 → 128 | 727,345 → 504,998 | 117 → 119 | 24.25 → 30.92 | 1233 → 947 | 99.9 |
| breached-loading-bay | 168 → 138 | 747,740 → 514,312 | 122 → 124 | 24.25 → 30.92 | 1146 → 1320 | 115.9 |
| relay-racks | 169 → 132 | 777,537 → 500,683 | 120 → 124 | 40.25 → 49.58 | 953 → 993 | 124.9 |
| transmission-chamber | 149 → 128 | 803,415 → 548,610 | 120 → 123 | 40.25 → 48.25 | 1341 → 1404 | 84.1 |
| diagnostic-gallery | 154 → 131 | 860,205 → 517,861 | 118 → 119 | 24.25 → 29.58 | 1013 → 1032 | 84.5 |
| safety-interlock-station | 277 → 292 | 885,717 → 532,068 | 119 → 121 | 24.25 → 29.58 | 1209 → 1262 | 132.9 |
| coolant-plant | 157 → 128 | 769,374 → 498,364 | 120 → 122 | 40.25 → 46.92 | 1110 → 855 | 151.3 |
| service-shaft-landing | 166 → 140 | 761,140 → 550,141 | 119 → 123 | 24.25 → 33.58 | 948 → 1080 | 50.5 |
| infested-workshop | 208 → 216 | 846,976 → 528,969 | 120 → 123 | 24.25 → 32.25 | 1371 → 1535 | 99.5 |
| swarm-junction | 151 → 131 | 758,485 → 503,266 | 117 → 119 | 24.25 → 30.92 | 1212 → 925 | 67.9 |
| shielding-gate | 232 → 188 | 792,239 → 512,984 | 120 → 124 | 40.25 → 49.58 | 1374 → 1252 | 73.9 |
| containment-annulus | 155 → 148 | 782,428 → 521,719 | 122 → 126 | 40.25 → 49.58 | 1300 → 1135 | 99.6 |
| manual-control-chamber | 197 → 170 | 713,976 → 512,374 | 120 → 123 | 24.25 → 32.25 | 986 → 1200 | 66.7 |
| overload-floor | 158 → 137 | 733,544 → 517,249 | 124 → 126 | 24.25 → 30.92 | 1388 → 1476 | 67.6 |

*Atrium: population median 22 / average 21.92, below required 24 / 22. The 20-second repeat also failed; these values are observations, not a passing sustained-stress trial. Failed JSON/logs remain in the gallery. Safety Interlock uses the passing corrected trial (292 draws); its earlier 337-draw failure is retained. All chosen rows recorded zero combat shader creation.

Nineteen valid combat rows meet the 330-draw requirement. Atrium remains unverified under the required sustained population. All twenty fresh preparation rows passed, with 855–1,991 ms public holds and zero combat/post-ready compiles. All frame-p95 values miss 20 ms on this heavily contended host; no hardware timing acceptance is claimed.

Raw data: `artifacts/nextgen/p11-final/per-room-metrics.json`; source reports in `verification/`. The comparison includes merged actor/renderer changes and does not attribute the whole-build reductions solely to P11.

## Honest limitations

Weakest rooms, in priority order:

1. **Swarm Junction:** shell-covered masses deform two duct installations, but the room still reads as machinery with localized infestation rather than a biological stronghold. Large shell plates are visibly angular.
2. **Infested Workshop:** the casting/table/motor now separate in game after a material-value correction; the growth is still dark and localized. This is substantially beyond the rejected boxes/blobs, but not a fully convincing consumed workshop.
3. **Communal Atrium:** removing pendant competition helps, yet dark foliage and sparse canopy weaken the garden landmark.
4. **Containment Annulus:** the new open ring and pressure channels read from the western combat view; the retained broad lid still dominates other positions.
5. **Manual Control:** the lever dais is physical and distinct, but small in the room; the retained sign still carries much of the narrative.
6. **Overload Floor:** peeled pressure shields and restrained damage are visible, but the crown remains too orderly for terminal catastrophe. The final deck-scorch correction is visible in the native/480 recapture, but reads as flat angular burn fans rather than physical deck buckling.

Tiny labels, welds, tools and personal effects are tertiary detail at 480, not readable story text. Most peripheral heroes are best seen in two or three tour positions rather than every combat position. Existing foreground architecture can still overlap the marine at extreme edges (notably Atrium); the actor cutaway remains the retained system. Six legacy E9 landmarks exceed the ordinary-module 1.5k budget as explicitly listed above. These are remaining quality/budget exceptions, not waived requirements.

Gallery: `artifacts/nextgen/p11-final/index.html`.

## Evidence revisions and handoff

Final runtime revision: `8f8c6ad4` (Interlock draw correction), based on `bff37aee` (visible Overload scorch). Campaign served `1a451f6e`; all later changes are presentation-only. Captures are a composite of unchanged rooms and focused corrections, with exact per-shot source SHA in `after/manifest.json` and original manifests in `provenance/`; they are not falsely labelled as one all-room capture at the latest HEAD.

Gallery absolute path: `/Users/chernodub/.t3/worktrees/containment-game/t3-98012d25/artifacts/nextgen/p11-final/index.html`. It contains before/after native images, exact 480×270 reviews, all hero/incident beauties, Low examples, campaign evidence and both successful and failed measurement records. Superseded image rounds/builds were deleted after final evidence was retained.

Branch: `t3/craft-room-set-pieces-1`. No push or PR. Remaining acceptance work is quiet-host timing, an Atrium sustained-population trial, the listed art weaknesses and six retained landmark triangle exceptions. This is a complete twenty-room implementation/evidence handoff, not a claim that every original quality/performance target has passed.
