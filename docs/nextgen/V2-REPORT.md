# V2 ability presentation report

## 1. What shipped

Branch: `t3/ability-vfx-overhaul`. Implementation SHA: **a08e8a32a198fc42923d9b8965d14ad81cb3a91d**. No push, PR, integration merge, new external assets, npm dependencies, simulation, UI, audio, input or smoke changes. Reused existing CC0 Flame02/WispySmoke02 atlases; provenance remains in `public/assets/vfx/CREDITS.md`.

- Replaced the Interim file with a four-rig presentation registry and a shared element kit. All16 abilities, three deployables, circular/strip zones, Tesla links and Overdrive lifetimes consume actual receipts/snapshots.
- Added anticipation, impact and aftermath signatures: Ram chevrons; Slam pressure/deck debris; segmented unfolding Bulwark; Rail convergence/lance/heat scar; crystalline Frost Trail; Nova ice edge; staggered Glacier columns/cracks/shatter; sparse Whiteout snow/pulses; twin Afterburn exhaust; rolling Flashfire; Napalm flight/pool; Meltdown mantle/tracers; Static Step lightning body; staggered Overload forks; mechanical Pylon/coil/cable; Overclock dial/ripples/streaks.
- Shared marine brace/dash poses, at most three articulated180ms ghosts, invulnerability contour, element-colored Overdrive-ready vents, frozen facets, burning edges, stunned orbit sparks and kinetic motion trails. Denied and ordinary ready events add no world effects.
- Exact catalog/augmented event telegraphs and authoritative persistent capsule/box/circle/link bounds. Cyan-white friendly anticipation edges remain distinct from hostile red.
- Fixed GPU inventories, bounded receipt/particle/ring/beam/decal pools,9-light public shared pool, allocation-free presentation hot loops, lower-cost edge-only Low zones/straight lightning, motion/flash settings, room/death/menu clearing and idempotent disposal. Shader families are registered before preparation.

Module map:

| Module | Role |
|---|---|
| `src/render/abilities/AbilityVisuals.ts` | Registry, event/snapshot/frame routing, options and lifecycle |
| `AbilityGeometry.ts`, `shape.ts` | Catalog/receipt telegraphs, exact snapshot ground footprints and Low flat zones |
| `ElementKit.ts`, `InstanceBatch.ts`, `types.ts` | Element palette, pooled instancing/particles/decals/rings/ribbons, licensed flame/smoke flipbooks, public light/distortion/camera services |
| `ZoneMaterials.ts` | Animated fire veins and frost/electric fringe; ring-only Meltdown; no filled aura disc |
| `breacher/index.ts` | Ram/Slam/Bulwark/Railbreaker |
| `cryo/index.ts` | Frost/Nova/Glacier/Whiteout |
| `pyro/index.ts` | Afterburn/Flashfire/Napalm/Meltdown |
| `arc/index.ts` | Static Step/Overload/Pylon/Overclock |
| `system/index.ts` | Marine poses/ghosts/immunity/ready flare and target statuses |
| `scripts/nextgen/v2-*` | Additive timeline/showcase/stress/recovery scenarios, PNG sheets and matched performance summaries |

The rig/system implementations were delegated after the shared framework commit, then integrated and art-directed here. No child checkouts were created.

DepthRenderer hooks are surgical: import/construct the registry in the existing retained ability field; bind the existing LightPool, distortion and CameraRig public services; forward graphics tier/options/reduced motion; route ability receipts without the previous duplicate camera adapter; pass snapshots, game read access, marine root/body and camera on the existing per-frame call. Existing registration in MaterialWarmup, context tracking, room clear and disposal remain in place. The private `interimAbilities` field and scene inventory name remain solely to preserve existing capture/private-test instrumentation. There are no Interim source files. **No LightPool, decal, post, camera, model or other shared-render implementation changed beyond the assigned DepthRenderer hooks.**

## 2. Captures and review

Final capture label **`v2-final`**: **306 unique PNGs**, **16 seven-phase ability sheets**,22full-kit environment/tier sheets, Scorched Fan, recovery and8stress sequences. All ten moods are represented; every rig has Armory/Containment/Infested full-kit bursts plus its native Cryogenics ability timeline. Matched-palette frames cover Cryo/Cryogenics, Pyro/Reactor, Arc/Containment and Kinetic/Cargo. Low has a complete native full-kit burst for each rig. Final sources are five successful batches (`v2-shipped-core`, `v2-shipped-kit-a`, `v2-shipped-kit-b`, `v2-exact-phases`, `v2-after-stress`); their376capturedframes merge to306unique frames. Final manifest failures/errors are empty.

Sheet index: `/Users/chernodub/.t3/worktrees/containment-game/t3-52217c68/artifacts/nextgen/v2-final/sheets/index.html`.

Gallery: `/Users/chernodub/.t3/worktrees/containment-game/t3-52217c68/artifacts/nextgen/v2-final/index.html`. Individual sheets are under `sheets/`; `rig-environments.png`, `matching-moods.png`, `low-kits.png` and the four rig timelines provide quick comparison. The gallery uses bounded embedded thumbnails with full-PNG links, avoiding the original runner's single-string limit. Per-shot source labels and SHAs are retained. Runtime implementation is `ad1eb1587eccfc3df0eab99432023b0fe1ed0c87`; later commits change capture timing/coverage only.

Dash samples are arrival-relative (70ms mid-dash,170ms arrival+30,290ms arrival+150,740ms arrival+600). Other abilities sample press/anticipation/impact+30/+150/+600/lingering/expiry on the native fixed-step clock. The real augmented Scorched Fan pool is captured through expiry. Final sheets were opened, including all sixteen timelines and bright/dark/matching-palette/Low kit comparisons.

First ten review files (absolute paths):

1. `/Users/chernodub/.t3/worktrees/containment-game/t3-52217c68/artifacts/nextgen/v2-final/sheets/v2-full-pyro-overload-floor-overload-floor.png`
2. `/Users/chernodub/.t3/worktrees/containment-game/t3-52217c68/artifacts/nextgen/v2-final/sheets/v2-full-arc-relay-racks-relay-racks.png`
3. `/Users/chernodub/.t3/worktrees/containment-game/t3-52217c68/artifacts/nextgen/v2-final/sheets/v2-full-breacher-breached-loading-bay-breached-loading-bay.png`
4. `/Users/chernodub/.t3/worktrees/containment-game/t3-52217c68/artifacts/nextgen/v2-final/sheets/v2-full-cryo-armory-armory.png`
5. `/Users/chernodub/.t3/worktrees/containment-game/t3-52217c68/artifacts/nextgen/v2-final/sheets/v2-railbreaker-awakening-bay.png`
6. `/Users/chernodub/.t3/worktrees/containment-game/t3-52217c68/artifacts/nextgen/v2-final/sheets/v2-glacier-awakening-bay.png`
7. `/Users/chernodub/.t3/worktrees/containment-game/t3-52217c68/artifacts/nextgen/v2-final/sheets/v2-whiteout-awakening-bay.png`
8. `/Users/chernodub/.t3/worktrees/containment-game/t3-52217c68/artifacts/nextgen/v2-final/sheets/v2-flashfire-awakening-bay.png`
9. `/Users/chernodub/.t3/worktrees/containment-game/t3-52217c68/artifacts/nextgen/v2-final/sheets/v2-napalm-charge-awakening-bay.png`
10. `/Users/chernodub/.t3/worktrees/containment-game/t3-52217c68/artifacts/nextgen/v2-final/sheets/v2-scorched-fan-overload-floor.png`

Baseline:102ability/kiting frames +28per-rig heavy frames. Three full sixteen-ability critique rounds are described in `plans/V2.md`; failed diagnostic fixtures are retained and not counted as passing evidence. Seven-phase sheets record real simulation timestamps. All effects use production game actions and renderer resources; no mocked ability state is used in V2 fixtures.

## 3. Gates and performance

```text
VITEST_MAX_WORKERS=2 npm run verify
  Test Files 178 passed | 1 skipped (179)
  Tests      2254 passed | 1 skipped (2255)
  model preview: tests2; pass2; fail0
  first three Python asset stages pass
  stops at documented FileNotFoundError: blender (monitor-artifact stage)
npx vitest run <ability geometry/framework/material/rig/system tests> --maxWorkers=2
  Test Files8passed; Tests58passed
npm run build
  tsc --noEmit + Vite build passed (existing large-chunk advisory)
npm run test:room-evidence
  pass28; fail0; ragdoll CPU self-test checks33passed
npm run test:smoke
  Graphics High/Low: desktop passed
  Checkpoint feedback: failed writes/removal, recovery and stale Continue suppression passed
  Combat Rig: live Arc, native Shift/Q/F/V, HUD, Overdrive and input/pause/Continue gates passed
  Browser smoke passed: desktop, production subpath, assets, fire, weapon switch, pause/resume, credits
npm run test:authored-smoke:all
  passenger-vault, breached-loading-bay, overload-floor
  desktop1280x900, Low, real keyboard move/fire, state playing, errors:[]
Final capture batches
  112 +63 +91 +78 +32 PNGs; failures:[]; errors:[]; final unique PNGs306
```

Logs are under `artifacts/nextgen/v2-final/gates/`. No Blender install or historical asset-test change was attempted. An earlier sandbox-limited verify failed on localhost/browser access; the authorized full rerun above supersedes it. One intermediate smoke run recorded aborted asset requests while capture/build work overlapped; the final stable-build smoke passed every original assertion. No error filter, timeout relaxation or desktop assertion removal was used.

Real recovery: three equivalent room cycles **129geometries/79textures** each; after active-Meltdown context loss/restore, two equivalent cycles stabilize at **130/79**. Context is restored, no capture/WebGL errors. One newly exercised geometry remains resident; repeated cycles do not grow. Retained program library **1082**, a loading/memory tradeoff. Owned atlases add two retained textures; CPU images survive context retirement. Disposal and tier tests pass.

Hardware: **ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Pro, Unspecified Version)**; full Chromium, verified hardware,1920x1080 DPR1. Before reproduces original interim renderer source `a6b970085b479bce04feccc1e814c11301ba5c89` inside this worktree with automatic source restoration. Both runs use the same legal25-enemy fixtures, accepted native slots and late dash uses so both charges are cooling. Three real RAF seconds fill120samples. Survivors are retained (10–19 in V2), not replenished or made invulnerable. Render is CPU submission, **not GPU time**. These shared-machine observations are not an isolated causal comparison; other stream workloads were present during parts of the session.

| Rig / tier | Before → V2 frame avg ms | Before → V2 render JS ms | Draws | Peak lights | Peak instances |
|---|---:|---:|---:|---:|---:|
| breacher / high | 19.864 → 17.013 | 10.093 → 7.638 | 126 → 130 | 9 → 9 | 5 → 574 |
| breacher / low | 16.805 → 16.667 | 4.539 → 4.065 | 113 → 119 | 0 → 0 | 5 → 166 |
| cryo / high | 16.736 → 16.723 | 5.958 → 6.197 | 137 → 211 | 9 → 9 | 15 → 675 |
| cryo / low | 16.739 → 16.663 | 5.098 → 4.722 | 123 → 127 | 0 → 0 | 16 → 348 |
| pyro / high | 16.806 → 16.598 | 6.718 → 6.869 | 133 → 211 | 9 → 9 | 21 → 603 |
| pyro / low | 16.659 → 16.727 | 4.712 → 4.591 | 118 → 122 | 0 → 0 | 21 → 267 |
| arc / high | 16.735 → 16.598 | 6.014 → 5.903 | 130 → 133 | 9 → 9 | 26 → 1156 |
| arc / low | 16.670 → 16.663 | 4.516 → 4.572 | 118 → 124 | 0 → 0 | 26 → 206 |

Draws are the last live diagnostic snapshot, including scheduled shadow work; frozen gallery frames have different counts. Peak lights mean the shared dynamic LightPool; peak instances include submitted ability meshes and ribbon segments. All eight fights created **zero GPU programs**. Sampled live draws peak211(<350); dynamic lights peak9High/0Low; total observed ability instances peak1156. Primitive submissions are capped2048, with separate fixed ribbon/ring inventories; peak particles592of768. All resources are retained/pool-bounded.

**The strict CPU/frame budget is not signed off.** High update+render averages **9.143–13.118ms**; Low **7.683–11.159ms**. High frame averages **16.598–17.013ms**, frame P95 up to25.2ms. The interim baseline already exceeded8ms combined CPU in the same25-actor fixture. No claim of strict16.6ms worst-case frames,8ms worst-case CPU, another GPU or long-run organic performance is made. CPU actor/simulation profiling remains necessary under joint G2/A1 ownership.

![Observed CPU cost before and after V2](/Users/chernodub/.t3/worktrees/containment-game/t3-52217c68/artifacts/nextgen/v2-final/performance.png)

Full numbers: `artifacts/nextgen/v2-final/performance.json`; comparison chart: `performance.png`; matched manifests remain under `v2-before-stress` and `v2-after-stress`. Frozen screenshot timings are not substituted for these live measurements.

## 4. Tests changed and why

No gameplay, desktop, accessibility, persistence, navigation or authored-room assertion was removed or weakened.

- Renamed `InterimAbilityVisuals.test.ts` to `AbilityGeometry.test.ts` as the Interim implementation was deleted. Preserved circle/capsule/wall/link extents, augmented geometry, pause, saturation, preparation, context retirement and exactly-once disposal checks. Expanded the hidden inventory expectation for the three retained Low edge-only materials and ring-only aura material. Camera routing now asserts the adapter does not double-apply the rig camera response; shot/hurt/explosion single-application checks remain.
- New `AbilityVfxFramework.test.ts`: all16 catalog shapes (no invented area for chain/dash), augmented receipt dimensions, finite input, bounded pools, pause/clear/dispose, Low/reduced-motion suppression, actual dash endpoints, death/menu clearing, camera-facing soft cards and shader-topology retention.
- New `AbilityFireMaterials.test.ts`: authored alpha coverage, animated per-instance atlas phases, additive fire versus normal smoke, HUD-region fade, ring-only aura, textured zone energy and texture disposal.
- New rig/system tests cover each signature's geometry/timing, exact snapshot positions and radii, wall growth/health/expiry, native2s freeze pulses, chain delays, Low simplification, presentation reset, no owned shared-resource disposal, absolute marine poses, articulated ghost lifetime and per-element statuses.
- Additive capture scenarios retain every original ID and assertion. They add real accepted slot receipts,25staged-enemy stress, true cooling dash charges, zero combat shader compiles, full-kit overlap and active-Overdrive recovery. No smoke scripts changed.

## 5. Integration requests

No required unowned presentation hook remains. Keep the small DepthRenderer routing hunk during the parallel G2 world merge. No audio files were edited.

Performance integration request: profile the25-actor simulation/actor-render costs jointly with A1/G2 to meet the8ms combined CPU target; the V2 measurements above remain an open acceptance item.

Optional next capabilities: exact intercepted-contact coordinates for Bulwark hit ripples (currently estimated from health change); temporary local grade influence for Whiteout/Overclock/Meltdown (currently expressed through local light/geometry); bespoke skeletal cast/dash clips instead of the restrained public-body transform. These are presentation improvements and do not authorize changing hit results.

## 6. Honest per-ability critique and remaining work

This is a coherent composed VFX pass using original procedural geometry and the existing licensed flame/smoke atlases, not a claim of film-quality volumetric fluids or bespoke cinematic character animation. Readability and element meaning take precedence over full-screen flash and opaque volume.

| Ability | Signature achieved | Remaining visual limitation |
|---|---|---|
| Ram | Amber pressure chevrons, shoved-target sparks, articulated ghosts | Ghosts are assembled silhouettes; dust is modest |
| Seismic Slam | Converging dust, brace, deck front/debris, crack aftermath | Deck movement is an instanced illusion, not physical deformation |
| Bulwark | Seven-panel unfold, hex lattice, contact pulse, expiry collapse | Contact point estimated from health receipts; no exact intercepted-hit coordinate |
| Railbreaker | Convergence, charge pullback, hot piercing lance, long heat/scorch tail | Restrained flash; no screen-long volumetric beam scattering |
| Frost Trail | Jagged capsule edges, crystals and low mist | Frost growth is sparse procedural geometry |
| Cryo Nova | Hard crystal leading edge, pale vapor, broken frost decal | Vapor is thin cards; needs richer authored turbulence for premium close inspection |
| Glacier | Staggered ice column growth, inner cores, damage/expiry cracks, shatter | Translucent facets approximate refraction; no real transmission |
| Whiteout | Sparse swirling snow, cold light, visible2s waves, exact boundary | No local desaturation; dome is suggested rather than volumetric |
| Afterburn | Twin exhaust, irregular animated atlas tongues along a flowing strip, embers and dark smoke | Billboard layers remain an approximation of fluid volume |
| Flashfire | Overlapping rolling flame folds, hot cores/red-orange body, smoke/scorch fan | Transparent layers can still reveal their card construction at frozen close inspection |
| Napalm Charge | Airborne canister/trajectory, exact landing marker, boiling pool | Canister is small at game scale; pool uses layered procedural ground/card effects |
| Meltdown | Ignition, head-clear atlas flame mantle, thin heat ring with no filled disc, fiery tracers and kill bursts | No global warming grade; flame volume remains layered sprites |
| Static Step | Violet lightning body, blink ghosts, arrival forks | Silhouette is a wire figure rather than a skinned lightning marine |
| Overload | Forked white/violet chain with40ms hop staggering and stun crackle | Dense enemy overlap can conceal short internal hops |
| Tesla Pylon | Mechanical tripod/stem/coil, live cable, zaps and collapse | Small gadget silhouette at normal framing; lacks bespoke textured machinery |
| Overclock | Activation/end ripple, clock ticks, ghosts and hostile streaks | No temporary room grade; deliberately subtle while active |

Arc remains the accepted reference from lead review. The revised Pyro pass replaces the rejected paper spikes/salmon disc with alpha-covered animated flame/smoke, concentrated hot cores, stronger orange light, flowing surface detail and an open heat ring; its final human art acceptance is still the lead's decision. No ability is left behind an Interim implementation or disabled flag.

The weakest premium-fidelity areas are Whiteout's suggested rather than volumetric dome, Glacier's approximate refraction, and assembled ghost/body-transform animation. Flashfire and Napalm remain layered sprites under close frozen inspection. These are honest quality limits, not missing simulation functionality. The strict CPU budget remains open as documented. Recommended next work: joint25-actor profiling, then bespoke cast/dash animation and localized grade/refraction improvements if they justify their cost. Desktop resize/keyboard/native-input/recovery/checkpoint/authored-room guarantees remain intact.
