# P11 — twenty-room craft and incident pass

Implementation is complete across the twenty story rooms; final visual acceptance, campaign and measured results are being collected. This report supersedes the initial Relay-only report and will be finalized against one frozen build.

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

Final capture, campaign and benchmark results pending. No automated tests were added or run. Whole-build E10/P11 comparisons include merged marine/creature/renderer changes and cannot isolate P11's performance contribution. Host load must accompany timing; quiet-machine certification remains separate.

Full GPU texture bytes are not exposed by the existing diagnostics. The final table will report measured texture counts and explicitly bounded authored texture memory, rather than treating texture count or JS heap as GPU bytes. Fourteen new normal atlases total 18.667 MiB RGBA8+mip upper bound across the session; per-room source bounds and E10 floor estimates are documented in `../../tools/assets/p11-set-pieces/METRICS-NOTES.md`.

## Honest limitations

Final weakest-room ranking awaits the frozen native/480 tours. The support furniture remains less individual than the heroes; tiny labels and personal effects are tertiary detail, not readable story text at 480. The infestation needs room-scale judgment after the latest baked relief pass.

Gallery: `artifacts/nextgen/p11-final/index.html`.
