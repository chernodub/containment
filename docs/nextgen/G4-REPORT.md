# G4 — world, actors and camera

Branch: `t3/world-actor-camera-overhaul`. Application freeze: `a169913744ac70901a47772cac866bc16a20b355`. The final report-only HEAD is supplied in the handoff; application source is unchanged from this freeze. **Readiness timing is not signed off: retained-session audits have exceeded the unchanged 3-second gate; see the raw controls and gate table.**

All changes are in the assigned worktree. No push, PR, computer-use/desktop-control tool, new dependency, new third-party asset, source GLB mutation, simulation/UI/post/ability implementation edit, phone control or phone capture. Visual reviews use saved production-harness PNGs. Three native Codex subagents worked on disjoint files; root integrated and serialized every production capture/benchmark/browser gate.

## What shipped

| Review item | Implementation and practical limit |
| --- | --- |
| AD-02 — industrial forms | Original shared kit: bounded 44-triangle chamfer boxes with separate planar normal groups, rounded pressure cylinders with analytic normals, framed/inset cabinets, feet, handles, broad crate ribs/corner castings; existing cartridge/vent/loom helpers remain. Armory horseshoe has a beveled cap, recessed housing, supported toe plinth and visible facade cassettes; carousel has beveled spindle/deck/collars/clamps. Atrium planter has real rim bevels and layered rounded foliage volumes without leaf cards or noisy leaf shader. Generic freight, communications, coolant, engineering and reactor kits use broader fitted forms; Relay drums/housings, Safety, Manual Control and Annulus use the kit within unchanged reservations. Small inlays remain cheap. Retained Awakening/Passenger and authored Residential GLB shapes were not replaced; Residential fallback alone gains cabinet/bedding/luggage details. This is not a bespoke replacement of every prop in all 20 rooms. |
| AD-01 — footprint | Family/elite horizontal fit uses actual navigation/collision radius while retaining family height. Removed elite-only visual enlargement. Weighted skin torsos and procedural torso attachments stay within 0.99×radius across 720 sampled walk/champion poses; rest limb allowance remains bounded. Marine retains uniform authored scale, 2.05m height and native socket alignment; its torso already fits. Renderer-only collider rings and per-family touching-pair captures include Warden/Matron and Queen. Actual coincident enemy centers await the parallel simulation separation change. |
| AD-03 — incoming danger | Hostile warning fills and projectiles composite through the existing HUD scene after friendly HDR/post. Warning radius stays exact; saturated red-orange band, black outer rim, dark backing, hatch and timing fill survive Whiteout/Meltdown/Napalm. Only warnings use bounded preallocated body ellipses to preserve visible actors; projectiles stay unmasked. Spit has a larger bright edge/dark core and ground shadow. Acid gains a lifetime-faded dark rim and order 29 above friendly ground decoration. At most 2 extra active draws, no per-projectile mesh allocation. Ellipse cutouts approximate body bounds; they are not G3's exact silhouette mask. |
| AD-04 — framing | Shared 15m view (+15.38% battlefield height over 13m), bounded aim/threat lead, soft interior edge bias and final projected marine guard. Middle 60%×55% body inset is authoritative; oversized desktop/debug bodies use a centered inset expanded only to half their projected span+.015. Subdeck extends 24m with the same 144 plate / 48 strut caps and dimmer tint; High 2 / Low 1 backdrop draws. All-room edge/corner projection, impulses, pause, resizing, pointer and HUD contracts remain. CPU playtest observer now consumes the same camera helpers, with 21 real-renderer parity cases; policy/balance/cadence assertions are unchanged. |
| AD-05 — title | Authored foreground casing, rear three-quarter marine aiming into a pod gap, partly hidden creature, deeper overlap, a motivated emergency fixture, subdued pod emission and existing DoF/reduced-motion behavior. Left 45% remains calm for the unchanged wordmark. Same prepared light topology, with weak fill/rim and only one energized emergency practical. |
| AD-09 — Queen | Retained skin plus swept five-point diadem, egg abdomen and wider hinged armored mantle that opens around the core. Arena power sectors are interrupted/consumed; four machinery islands have different broken/shrouded/braced profiles and asymmetric embedded tissue/membranes within their original solids. Nest husks/lifecycle remain. Anatomy is still procedural retained-model art, not a new bespoke rig. |
| AD-12 — story displays | Forward, camera-facing sloped displays with physical bezels/supports. Roof/lighting probes exclude story dressing, preventing vents and lamps from mounting across text. 119 rays per camera test each full display quad in both room-entry and settled inspection poses, including Room/Interior Practicals and environmental overhead. Every first hit is the display. |
| Environment follow-ups | Reduced floor microcontrast and reactor warm tint; darker neutral Annulus traversal. One interrupted-meal table vignette in the actual Atrium assembly, with unchanged 24-unit tabletop, supported blanket/journal/cup below 30 units, same 8 finishes and ≤11 meshes. Cargo torn hull has layered plating/ribs/hanging cable looms merged into two existing outboard batches. Engineering has roof-supported overhead pipes/vents/shadows. Existing leak-local reflections and seam-crossing infestation remain; Queen machinery adds new consumed-architecture growth. Reactor core remains the key and broad warm floor rings are removed. |

The actor fit exposed two real presentation failures and they were fixed: nonuniform marine scale sheared its weapon socket, so the marine keeps its uniform source transform; nonuniform enemy rigs required exact affine ragdoll mapping. Solved ragdoll velocities are bounded to prevent Carrier solver explosions without moving contacts or changing solver cadence/iterations. Invisible dead identity geometry borrows a preallocated empty buffer and restores the same live geometry on pool reset; hidden decorations no longer lift or sink corpses. Original skin/deck/contact/pose checks remain.

## Camera decision

Current uniform-source marine, ordinary east/south poses at 1920×1080:

| Candidate | Orthographic pixels | Native perspective pixels |
| --- | ---: | ---: |
|14.5m|109.92–118.13|113.71–122.53|
|15m — selected|106.26–114.19|109.80–118.30|

Earlier 13.8/14m selections used the rejected narrowed marine source and are superseded. 15m shows more battlefield and meets the preserved 105–125px measured-envelope contract. The requested 105–115px target is approximate: the taller ordinary perspective pose reaches118.30px.

The final all20 High/Low kiting sheets keep the marine central while showing the incoming pack and an escape lane; Armory and the narrow Atrium corridor favor 15m over the larger 14.5m silhouette. At Armory entry, marine center is 32.39% of screen width and hull edge 20.67%, versus round 1's roughly 38% outboard decking. Soft bias brings the room into view while the full body remains in the central inset. Measurements: `artifacts/nextgen/g4/camera-candidates.json`, `camera-projection.json`. No screenshot timing is used as a performance claim.

## Evidence and critique rounds

Artifact root: `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/`.

- `g4-before`:214 verified native frames /43 sheets; all 20 calm and kiting rooms, High/Low, title and boss. `errors:[]`, `failures:[]`. Preserved original build is `g4/before-dist`, source `ab71db8a35d99c3311582a7779136fe9a9742021`.
- `g4-before-forms`:10 matched legal inspection views on that original build, High/Low.
- `g4-before-details`:26 matched original-build danger/vignette frames /6 sheets; errors:[], failures:[]. The preserved original build was inspected after the final build without changing its original source identity.
- `g4-round1`:26 exploratory frames. Rejected excessive outboard grid/hero props offscreen, slender title stance and warning wash through HDR. Corrected soft interior bias, darker subdeck, title-only stage scale and post-HDR hostile priority.
- `g4-round2`:33 exploratory frames. Rejected lamps touching first story letters and opaque warning discs covering enemy bodies. Dense full-scene sightline tests reproduced the lamp attachment bug; corrected mount probes, panel placement and bounded body cutouts.
- `g4-round3`:25 exploratory frames; hardware/message and per-family ring pairs inspected natively. One Low fixture failed because it queried an unmounted settings control; that failure remains in its manifest. Corrected fixture uses the established renderer quality API. Final corrections widen body cutouts, add the supported habitation vignette, preserve its tabletop center datum, and raise acid-rim ground priority.
- Final frozen High/Low matrix `g4-final`: **289 native PNGs / 56 sheets; errors:[], failures:[]; 1237.66s.** All 20 calm/kiting High/Low room views, title, armored/exposed/opening/closing Queen and destroyed nest phases in both tiers, every family pair and all three bright-room danger cases pass. Exploratory captures were made during uncommitted iterations and are not final budget/source evidence. Final acceptance uses a preserved build and explicit source SHA.

`x3-review.mjs` creates exact area-reduced 480×270 counterparts; `g4-review.mjs` assembles those pixels into review pages. Original native images, burst sheets and failed attempts remain. The previous final gallery and organic I7 bot PNGs were read-only references.

## Before / after paths

All paths are absolute PNGs. Matched form fixtures use the same legal marine marks; camera/framing changes remain visible and intentional.

| Item | Before | After |
| --- | --- | --- |
| Armory | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-before-forms/g4-forms-high-armory.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-final/g4-forms-high-armory.png` |
| Atrium | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-before/g2-calm-high-communal-atrium.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-final/g2-calm-high-communal-atrium.png` |
| Relay | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-before-forms/g4-forms-high-relay-racks.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-final/g4-forms-high-relay-racks.png` |
| Diagnostic | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-before-forms/g4-forms-high-diagnostic-gallery.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-final/g4-forms-high-diagnostic-gallery.png` |
| Safety | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-before-forms/g4-forms-high-safety-interlock-station.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-final/g4-forms-high-safety-interlock-station.png` |
| Title | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-before/title.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-final/title.png` |
| Queen | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-before/g2-queen-exposed-reactor-vault-04.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-final/g2-queen-exposed-reactor-vault-04.png` |
| Camera | `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/playtest/i7-final-breacher-1729/r6-armory-mid.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-final/g2-kiting-high-armory-sprite.png` |
| Danger | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-before-details/g4-danger-whiteout-containment-annulus-02.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-final/g4-danger-whiteout-containment-annulus-02.png` |

Additional proof views (actor/Queen before views use the original ordinary fixture; danger/vignette use matched original-build setups):

| Item | Before | After |
| --- | --- | --- |
| AD-01 / touching Brute + Warden | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-before/g2-kiting-high-armory-01.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-final/g4-footprints-brute-armory.png` |
| AD-01 / Carrier + Matron | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-before/g2-kiting-high-armory-01.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-final/g4-footprints-carrier-armory.png` |
| AD-09 / opening mantle | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-before/g2-queen-exposed-reactor-vault-01.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-final/x2-queen-opening-high-reactor-vault-02.png` |
| Habitation / interrupted meal | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-before-details/g4-habitation-vignette-high-communal-atrium.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-final/g4-habitation-vignette-high-communal-atrium.png` |
| Cargo / layered hull tear | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-before/g2-calm-high-breached-loading-bay.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-final/g2-calm-high-breached-loading-bay.png` |
| Engineering / overhead shadows | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-before/g2-calm-high-diagnostic-gallery.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-final/g2-calm-high-diagnostic-gallery.png` |
| Containment / quiet traversal | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-before/g2-calm-high-containment-annulus.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-final/g2-calm-high-containment-annulus.png` |
| Reactor / core and floor | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-before/g2-calm-high-overload-floor.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-final/g2-calm-high-overload-floor.png` |
| AD-03 / meltdown | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-before-details/g4-danger-meltdown-containment-annulus-02.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-final/g4-danger-meltdown-containment-annulus-02.png` |
| AD-03 / napalm-charge | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-before-details/g4-danger-napalm-charge-containment-annulus-04.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-a2b1dfed/artifacts/nextgen/g4-final/g4-danger-napalm-charge-containment-annulus-04.png` |

## Gates and budgets

The complete sustained benchmark passes its native/resource assertions. All three readiness audits below **fail** the strict 3-second gate. This is a handoff with an unresolved readiness blocker, not complete performance signoff. Logs and raw benchmark JSON are retained under this artifact root.

```text
npm ci: added 61 packages; completed.
VITEST_MAX_WORKERS=1 npm run verify:
  Test Files 259 passed | 1 skipped (260)
  Tests 3051 passed | 1 skipped (3052)
  Duration 507.53s
node --test scripts/cryo-model-preview.test.mjs: tests 2; pass 2; fail 0.
npm run build: TypeScript + Vite production build passed.
npm run test:room-evidence: tests 28; pass 28; fail 0.
  Ragdoll CPU self-test: passed:true; checks:33.
npm run test:smoke:
  Browser smoke passed: desktop, production Pages subpath, assets, fire,
  weapon switch, pause/resume, credits.
  Graphics recovery, native desktop input, resize, audio and checkpoint feedback passed.
npm run test:authored-smoke:all -- --rooms=<all twenty story IDs>:
  20/20 desktop rooms passed real keyboard movement/fire; every errors:[].
npm run capture -- --label=g4-final --dist=<frozen> --scenarios=<matrix>:
  289 PNGs /56 sheets; errors:[]; failures:[]; exit 0.
npm run bench -- --label=g4-scan-final --no-build --scan-only --dist=<frozen>:
  20/20 native full-kit room inventories; peak252 draws;
  combat programs0; errors:[]; budgetFailures:[]; exit 0.
npm run bench -- --label=g4-bench-complete --no-build --dist=<frozen>
  --rooms=relay-racks,manual-control-chamber --repeat=1 --seconds=40:
  16/16 native trials; peak 323 draws; combat programs0;
  errors:[]; budgetFailures:[]; all full-kit/population/allocation checks pass; exit 0.
npm run bench:rooms -- --label=g4-rooms-last --no-build --dist=<frozen>:
  42 entries;30 readiness passes /12 misses; worst4368.5ms;
  peak189 programs; first-frame/combat programs0; errors:[]; exit 2.
```

The aggregate verify exit is 1 at the unchanged `test_monitor_artifacts.py` Blender invocation: `FileNotFoundError: [Errno 2] No such file or directory: 'blender'`. The earlier Python artifact, room-fit and distribution stages passed. Later Python stages are not claimed as run. The independent browser/build/room gates above were run after this stop. Logs: `g4/final-verify.log`, `final-build.log`, `final-room-evidence.log`, `final-smoke.log`, `final-authored.log`. After discarding the experiment, `g4/final-restored-build.log` passes again and `dist/index.html` matches the preserved final snapshot byte-for-byte.

Baseline room audit: 42/42 rows, maximum readiness 2801.2ms, maximum 196 retained programs, zero post-ready/combat compiles, errors/failures empty. Baseline realtime: 16 native 20-second trials (two matched rooms×four rigs×two tiers×one repeat), peak 290 draws, zero combat compiles, errors/budget failures empty. CPU p95 exceeds targets under recorded load 328–755 on 10 logical cores; this is not quiet-hardware certification.

The first full final attempt had six failed tests: stale CPU camera observer/cadence, two desktop timeouts, one loaded CPU timeout, and two presentation height pins for the new table vignette. The observer now has direct production parity; unchanged cadence passes 4/4. Isolated unchanged desktop UI/HUD passes 67/67; furniture/CPU rechecks pass. Original failures remain in `g4/final-vitest.log`. The second two-worker attempt (`g4/final-vitest-recheck.log`) passed all behavioral checks but hit unchanged AudioCombatRecipes PCM and Armory vertex-sweep timeouts. Both files passed unchanged in isolation (10 tests, 5.82s), then the complete one-worker verify run passed every active Vitest test. The default assertions and timeouts were retained; only concurrency was reduced for the loaded shared host. No gameplay or accessibility assertion was removed.

Room-readiness attempts retain every miss:

- `g4-rooms-final`:42 rows, peak189 programs, zero first-frame/combat compiles, errors:[];15 readiness failures, worst4861.8ms.
- `g4-rooms-isolated`:42 rows, peak189 programs, zero first-frame/combat compiles, errors:[];18 readiness failures, worst5477.6ms. Fresh entries remain subsecond. Retained reflection capture accounts for almost all excess time; geometry construction and shader preparation remain bounded.
- `g4-rooms-last`:42 rows, fresh maximum861.3ms; retained12 readiness failures, worst4368.5ms; peak189 programs, zero first-frame/combat compiles, errors:[]. This final unchanged rerun remains a gate failure.
- Back-to-back four-room controls use the original/final preserved builds and unchanged audit. Original `g4-rooms-control-before` readiness is530/2822/3598/3463ms; final `g4-rooms-control-final` is546/3970/3623/2430ms (Awakening/Passenger/Atrium/Freight). The original also exceeds3s under current load, and the final is not uniformly slower. This supports shared-host/queued-GPU timing as a contributor; it does not establish a sole cause or waive G4's gate miss. No reflection quality or assertion is reduced.

| Resource measure | Original G4 baseline | Final G4 | Guard |
| --- | ---: | ---: | ---: |
| Retained programs (42 room entries) |196|189|≤400; P1 final203|
| Material profiles |54|52|≤160|
| Compile passes |10|10|≤12|
| Post-ready / combat shader creation |0 /0|0 /0|0 /0|
| Full-kit all20 High/Arc draw scan |not run|252|≤330|
| Sustained fights peak draws (20s before /40s final) |290|323|≤330|
| Sustained retained program inventory |229|221|no growth budget regression|
| Room-readiness worst, first /isolated /last |2801.2ms|4861.8 /5477.6 /4368.5ms|≤3000ms — failed|

Sustained benchmark interruptions are retained: `g4-bench-final` completed six 20s configurations then Arc had an unusable frame-p95 summary. `g4-bench-arc-recheck` received only 4 native samples /0.167s simulation during 21.33 wall seconds and failed the full-kit receipt assertion. The identical original-build `g4-bench-arc-control` also failed receipts (5 samples / 0.127s simulation during 21.28 wall seconds). Neither is accepted as a populated full-kit result. The 40s isolated Arc diagnostic then passes: 103 samples, 4.96s simulation, accepted dash/tactical/power/Overdrive,271 peak draws, zero compiles. The complete 16-trial 40s matrix `g4-bench-complete` also passes every original assertion: at least 65 native samples and 3.22 simulation seconds per trial, peak 323 draws, peak 221 retained programs, errors:[], budgetFailures:[]. No simulation change or slow-interval exclusion was introduced. These longer trials offer additional stress coverage; their counts/timings are not an equal-duration 20s performance comparison.

Raw before/final realtime reports are `g4-bench-before/benchmark.json` and `g4-bench-complete/benchmark.json`; summaries are `g4/benchmark-summary.json`. Before CPU/frame worst-p95 are 32.4/459.1ms at load 328.25–755.02; final 23.4/367.9ms at load 71.43–255.07. Only 2/16 final CPU-p95 flags meet 8ms and 0/16 frame-p95 flags meet 16.6ms. All observed High trials miss those timing targets. Different load and trial duration prevent attributing timing changes to G4; strict frame/CPU performance is not signed off. Final 323 draws leaves only 7 draws below 330, so the combined G3/ability build must be remeasured.

A discarded, uncommitted shader experiment (`g4-mask-control`) isolated torso-mask uniforms to the warning material. Its four retained holds were542/2711/3747/3022ms and it added one program variant. It did not restore the gate; source was restored byte-for-byte to the captured freeze. The experimental source hash/build/JSON remain under `g4/mask-variant-source.json`, `g4/mask-variant-dist` and `g4-mask-control/rooms.json`, separate from final evidence. No reflection/tier quality or timing assertion was reduced. Reflection/queued-GPU attribution remains open; the original-build control is evidence of shared sensitivity, not proof that G4 has no contribution.

## Test changes

- Camera framing pins move from half-view room clamps and 13m framing to soft interior bias, 15m measured silhouette bounds and central-body projection. Pointer, visibility, pause, shake, boss and HUD assertions remain.
- Annulus exhaustive safety sweeps are split into x-ranges; every original sample/expectation and default timeout remains.
- AcidSplash/ElectricArc fixed nine-child pins become stable constructor-inventory/no-hot-allocation guarantees plus zero inactive hostile counts. NextgenVfx selects the named hostile warning batch and retains exact radius/timing/urgency checks.
- Acid surface RGB-only pin becomes a bounded, native-lifetime-faded dark-rim alpha guarantee; 40-segment footprint, transforms, standard output chunks, retirement and disposal checks remain.
- ElementalExpansion keeps every source skin geometry pointer and forbids cloning, skin application and attribute rebuilding on death; only invisible identity decoration may borrow a constructor-preallocated empty geometry. Shared inventory cannot grow on death.
- CommunalFurniture retains exact reservation/floor bearing and 24-unit tabletop ray hit while allowing the supported vignette below 30 units. The original center tabletop probe remains 24 after moving the blanket aside.
- DeathRagdolls integration mocks implement the new renderer-only APIs; original simulation pause/loading/contact assertions are unchanged. New affine no-pop/energy, 720-pose footprint, body-mask pooling, sightline, geometry-normal and camera-observer parity tests are additive.

## DepthRenderer hooks and integration

Surgical hooks: shared camera view/target/guard; boss guard before marine guard; title marks/aim/light/focus/contact positions; opt-in `setColliderDebug`; live collision radii to ring presentation; hostile batches in prepared HUD scene; cached framebuffer size and bounded actor cutout inputs; Queen warning progress from canonical 900ms delay; hazard bullets excluded from the old friendly bullet batch; acid render order 29. The obsolete duplicate Queen warning meshes are removed, retaining the inert group for existing internal fixture compatibility.

Public `pointer`, `visible`, `playerScreenBounds`, viewport and performance hooks keep their signatures. HUD shader warmup and context resource tracking already include the priority scene. No UI/game/post/ability implementation hook is required to run this branch.

Integration requests: G3 should replace the temporary projected body ellipses with its actual actor silhouette mask when that target is available; warnings/projectiles remain excluded from ink. Merge the simulation enemy-separation stream to prevent truly coincident centers. Re-run the combined graphics budget after G3's new passes and ability presentation changes; G4 alone does not certify the combined wave.

## Remaining gaps

- Retained Awakening/Passenger and authored Residential assets were not comprehensively rebuilt with the procedural kit. Infested Workshop's established machine/growth forms remain. Large props are more deliberate, but bespoke hero art is still uneven; AD-02 is partial.
- Queen additions and nesting architecture remain coarse procedural art. Title is an authored fixed stage with drift/threat animation, not new approach locomotion or a volumetric mist system.
- Ellipse warning cutouts can clear more floor than an exact silhouette and do not precisely protect every limb/weapon; G3's mask is the intended integration improvement.
- G3 ink/banded shading, friendly-effect redesign and simulation separation are separate streams and are not included here. No claim that this branch alone completes the unified W4 look.
- **The required ≤3s retained-room readiness gate is unresolved after three full runs and controls. Do not treat this branch as performance-approved.** The shared host is heavily loaded; resource/compilation guards and timing flags must be reported separately. No 60fps/8ms certification follows from fixed-step captures or loaded-host timings.
- Blender is absent. The unchanged aggregate Python asset chain stopped at its Blender invocation; assets/tests are not modified to bypass it.
