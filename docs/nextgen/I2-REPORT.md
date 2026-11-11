# I2 graphics integration report

## 1. What shipped

Branch **`t3/integrate-graphics-overhaul`**. Implementation HEAD **`e699b4949e1943beaae75f9a3b778111575c87c3`**; the documentation-only handoff commit is supplied in the final message. Graphics HEAD `1152940c35255bb25188bb8e45604b4616500593` is merged in `d833d71dc9a844efe26c967ccc1a34dea5bc144c` (other parent `d6fed9a0331b8efc3f4f572fdd7010568cef7807`). No push, PR, simulation balance changes or audio edits.

- G1's HDR/GTAO/bloom/AgX/distortion, ten moods, practicals/reflections/atmosphere/sub-deck, perspective follow camera, combat effects, preparation and recovery now run with the reviewed Combat Rig simulation and DOM interface.
- Live graphics tier plus validated overrides persist through reload and context replacement; native High/Low controls retain their smoke hooks. The adapter avoids applying the same tier preset twice.
- UI projection now rejects near/far/behind-camera points and preserves correct off-screen bearings. Radar footprint rejects nonfinite intersections. Aim-assist visibility also tests depth. Existing perspective mouse rays, torso targeting, marine bounds and resize/clearance paths remain in use; regression coverage exercises native camera methods at different desktop sizes, DPR/render scales and recoil poses.
- Shot/hurt/explosion camera feedback already belongs to G1 and remains single-applied. Ability-only impact/burst feedback uses the same rig. No duplicate adapter routing was added.
- `src/render/abilities/InterimAbilityVisuals.ts` is the small replaceable bridge for authoritative zones, capsule strips, barriers, pylons, links and cast/impact shapes. Fixed pools, G1 exported primitives/materials, hidden material inventory before warmup, room clearing, reduced motion and idempotent disposal keep it isolated for V2 replacement.
- Saved Low-shadow overrides exposed a real preparation bug: restoring the override retired the High warmup map before the post warm frame sampled its comparison texture. Force a shadow redraw before post preparation; regression and real WebGL operation tracing pass across reload/context restore.
- Live kills exposed unprepared raw shared pickup materials in Cryogenics. Normalize shared finishes to the prepared local-light shader family before loading. All ten High and both Low live fights now create **zero GPU programs**. Interim material animation loops reuse their material list.

### Merge conflicts and boundaries

Only textual conflict: `scripts/nextgen/scenarios.mjs`'s `inspectFrame` return. Kept both sides: live ability/statistics/UI receipts and G1 shader/recovery/lighting/luminance metadata. All original scenario IDs/helpers remain available. G1's kiting algorithm is shared with unchanged defaults; new I2 options select live Arc and tiers. The ten default rooms now cover all ten distinct environments, replacing the duplicate Cryogenics default with Maintenance; Passenger Vault remains explicitly selectable.

Kept the UI HitConfirmation implementation, migrated its last test import and deleted the render compatibility entry. `tests/WallSlam.test.ts` merged automatically, preserving incoming compact-contact expectations and reviewed gameplay assertions.

The G1 patch's immediate HUD sync was already implemented by I1a in `application.ts`. Applied its readiness intent with one commented wait in each smoke script: production playing/loading state, `#world[aria-busy=false]` and hidden `#room-loading` before native input/resource snapshots. No arbitrary sleep, relaxed timeout, filtered failure or removed assertion. The only UI implementation file changed by I2 is `src/ui/gameAdapter.ts`; no UI reformat/restructure or visual redesign.

### Performance sanity

Hardware: **ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Pro, Unspecified Version)**, full Chromium, hardware verified, 1920×1080 at DPR 1. Supplemental manifest: `/Users/chernodub/.t3/worktrees/containment-game/t3-3b4cf7fd/artifacts/nextgen/integration-2/performance/manifest.json`, source `e699b4949e1943beaae75f9a3b778111575c87c3`. These numbers supersede the shorter callback-count windows in the main visual gallery.

Each fixture uses normal RAF calls into the original simulation/render functions, actual movement/fire, a real Pylon and Overclock, with three seconds of live simulation before the snapshot. This fills the 120-sample diagnostic window on high-refresh displays. At least ten threats are staged, at least eight survive and at least six remain in the conservative visible region. UI/radar are live; abilities are simulation actions, not snapshot fixtures. Frame includes pacing; render is CPU submission/presentation, **not GPU time**. HUD figures are average cost per periodic HUD synchronization, separately recorded in JSON.

| Room | Tier | Frame avg ms | Update avg ms | Render avg ms | Draws | Frame P95 ms |
|---|---|---:|---:|---:|---:|---:|
| awakening-bay | high | 16.603 | 1.488 | 3.481 | 231 | 24.9 |
| communal-atrium | high | 16.595 | 1.556 | 3.787 | 105 | 25.1 |
| armory | high | 16.736 | 3.612 | 3.187 | 105 | 25.2 |
| breached-loading-bay | high | 16.595 | 0.812 | 3.508 | 175 | 24.7 |
| relay-racks | high | 16.667 | 0.332 | 3.126 | 137 | 25.1 |
| safety-interlock-station | high | 16.663 | 0.251 | 3.457 | 127 | 25.1 |
| service-shaft-landing | high | 16.666 | 0.601 | 3.767 | 148 | 17.8 |
| infested-workshop | high | 16.598 | 0.280 | 2.825 | 113 | 25.2 |
| containment-annulus | high | 16.596 | 0.928 | 3.680 | 113 | 25.1 |
| overload-floor | high | 16.665 | 0.966 | 3.200 | 105 | 25.3 |
| armory | low | 16.655 | 3.458 | 3.002 | 95 | 25.1 |
| overload-floor | low | 16.738 | 0.963 | 2.718 | 92 | 25.2 |

Average update+render ranges **3.105–6.798 ms on High**, below the 8 ms average sanity target, with **105–231 draws** in these live High fixtures. Low Armory is **6.460 ms / 95 draws** and Low Reactor **3.681 ms / 92 draws**. Periodic HUD sync averages **0.373–0.485 ms** across both tiers. Frame averages are **16.595–16.738 ms**, but P95 reaches **25.3 ms**; Armory update P95 is **8.6–8.7 ms**. This does **not** certify a strict 16.6 ms worst-case frame, an 8 ms worst-case CPU budget, another GPU, or long-run encounter balance. Do not compare these live update costs to G1's frozen-simulation figures as if they were the same benchmark.

Equivalent room cycles retain **117 geometries / 79 textures** for all three iterations; after context restore/revisit **117 / 77**, contextLost false, no draw errors. Retained shader library: **922 programs**. Shader preparation trades loading/memory for avoiding combat compilation.

## 2. Captures and review

Capture label **`integration-2`**, **143 PNGs in 517.28 seconds**, failures/errors/fontFallbacks all empty. The main gallery records `fb40977` (same shipping renderer/UI/simulation as the final implementation); the later commit changes only benchmark sampling and its documentation. Supplemental `integration-2-performance`: **12 PNGs in 136.88 seconds**, failures/errors empty, copied under the main gallery's `performance/` directory. The complete primary gallery is `artifacts/nextgen/integration-2/index.html`; all evidence is ignored local artifacts, not added to Git.

The gallery includes title, real rig selection/starting draft, calm and kiting-heavy scenes in every environment, all sixteen live abilities plus native Shift/Q/F/V, status VFX, Queen, pause settings, genuine combat results, two Low calm/heavy pairs, repeated room/context recovery and persisted graphics recovery. Every playing shot asserts that HUD chrome does not intersect the renderer-projected marine bounds. Ability entities must have visible interim world meshes; live HUD IDs/states must agree with the simulation.

Round 1 (`integration-2-round1`, 26 PNGs, no errors/failures): opened title, calm Cryogenics, Armory kiting, Bulwark, Whiteout, settings and results. HUD/backplates were readable and marine clear, but deployables/zones were invisible. **Fix:** isolated interim render bridge.

Round 2 (`integration-2-round2` and diagnostic/fix galleries): opened barrier, Whiteout and Pylon/link bursts. Whiteout's generic footprint/fill was too bright. **Fix:** lower interim material strength and footprint opacity, retaining the deck and hostile silhouettes. Opened the revised Whiteout and High/Low heavy scenes. Corrected capture sequencing to await the actual pylon cast and bounded kiting movement to keep threats visible; these are harness controls, not balance changes. This review exposed and fixed the saved-shadow GPU error, then live profiling exposed and fixed pickup shader compilation. Failed diagnostic runs remain historical; they are not substituted for the zero-error final galleries.

Final review opened all ten calm and all ten High heavy scenes, live ability scenes across all rigs, first/last Napalm and Reactor kiting burst frames, title/rig/settings/results, Low Reactor, status VFX and Queen. Compared the original Reactor baseline read-only. HUD contrast, body/ground projection, radar footprint, reticle and marine clearance remain readable across the bright/dark moods. No new missing-light, z-fighting, clipped-label or stale-HUD defect was found. Large overlapping enemies can still hide parts of the marine body; the player locator remains visible. This existing crowd silhouette limitation needs the later presentation/art pass.

Eight screenshots to open first:

1. `/Users/chernodub/.t3/worktrees/containment-game/t3-3b4cf7fd/artifacts/nextgen/integration-2/title.png`
2. `/Users/chernodub/.t3/worktrees/containment-game/t3-3b4cf7fd/artifacts/nextgen/integration-2/rig-select.png`
3. `/Users/chernodub/.t3/worktrees/containment-game/t3-3b4cf7fd/artifacts/nextgen/integration-2/i2-kiting-high-overload-floor-02.png`
4. `/Users/chernodub/.t3/worktrees/containment-game/t3-3b4cf7fd/artifacts/nextgen/integration-2/i2-kiting-high-service-shaft-landing-02.png`
5. `/Users/chernodub/.t3/worktrees/containment-game/t3-3b4cf7fd/artifacts/nextgen/integration-2/ability-bulwark-awakening-bay-02.png`
6. `/Users/chernodub/.t3/worktrees/containment-game/t3-3b4cf7fd/artifacts/nextgen/integration-2/ability-whiteout-awakening-bay-02.png`
7. `/Users/chernodub/.t3/worktrees/containment-game/t3-3b4cf7fd/artifacts/nextgen/integration-2/boss-reactor-vault-02.png`
8. `/Users/chernodub/.t3/worktrees/containment-game/t3-3b4cf7fd/artifacts/nextgen/integration-2/results.png`

## 3. Gates

```text
npx vitest run --exclude scripts/cryo-model-preview.test.mjs
  Test Files 171 passed | 1 skipped (172)
  Tests      2207 passed | 1 skipped (2208)
node --test scripts/cryo-model-preview.test.mjs
  tests 2; pass 2; fail 0
npm run build
  tsc --noEmit + Vite build passed (existing large-chunk advisory)
npm run test:room-evidence
  tests 28; pass 28; fail 0
  {"passed":true,"cpuOnly":true,"checks":33}
npm run test:smoke
  Graphics High/Low defaults and selection passed: desktop
  Checkpoint feedback passed: failed write, same-screen recovery, failed removal,
  pause/title warning, stale Continue suppression, recovery.
  Combat Rig smoke passed: live Arc selection, Shift/Q/F/V receipts and HUD,
  Overdrive fill/active, menu/pause/typing gates, Continue rig-select/starting-boon/legacy.
  Browser smoke passed: desktop, production Pages subpath, assets, fire,
  weapon switch, pause/resume, credits. errors:[]
npm run test:authored-smoke:all
  passenger-vault, breached-loading-bay, overload-floor:
  desktop 1280×900, Low, real keyboard move/fire, state playing, errors:[]
npm run capture -- --label=integration-2 ...
  143 PNGs in 517.28s; failures:[]; errors:[]; fontFallbacks:[]
npm run capture -- --label=integration-2-performance ...
  12 PNGs in 136.88s; failures:[]; errors:[]; zero live combat programs in all 12 fights
```

`npm ci` passed. `npm run verify` passed 171 unit/browser-unit files, 2,207 tests, two model tests and the first three Python asset stages, then stopped at the documented `test_monitor_artifacts.py` `FileNotFoundError: blender`. No Blender install, test change or GLB modification was attempted. Required subsequent stages are run independently and recorded above. Logs are retained under `artifacts/nextgen/integration-2/gates/`.

## 4. Tests changed and why

No gameplay, persistence, navigation, accessibility, geometry, lifecycle or desktop assertion was weakened or removed by I2.

- New `I2UiProjection.test.ts`: production camera switching/resizing/recoil, mouse floor rays, radar corners, body/frustum alignment, behind-camera bearings, near/far aim-assist depth and invalid footprint rejection.
- New `I2GraphicsPreferences.test.ts`: actual renderer option resolver/presets through the settings controller, versioned persistence, reduced motion, cancelled/retried context preparation, and replacement-shadow readiness before post preparation.
- New `InterimAbilityVisuals.test.ts`: 11 shape/orientation/extent, bounded pooling, event expiry, reduced-motion, routing, material warmup, context retirement and exactly-once disposal checks.
- `DeathRagdolls.integration`, `ResidentialGalleryEquipment`, `CommunalSouth32`, `ShotgunMetal`: private CPU renderer fixtures add the retained interim service. Existing physics, contact, authored-room, footprint and budget assertions remain.
- `HitConfirmation.test.ts`: import follows the UI owner; all assertions retained.
- `A1CaptureContract.test.mjs`: preserve UI/ability/G1 scenario IDs and require default coverage of all ten lighting environments.
- `UiCaptureClock.test.ts`: add opt-in realtime control/clock regression; default fixed-step semantics remain asserted.
- Capture runner adds projected marine-clearance, real ability-entity visualization, live heavy encounter and shader-compilation guarantees. No pre-existing capture assertion was removed.

Incoming G1 test policy changes are retained as documented in `G1-REPORT.md`: semantic HDR colors (`BoonLinks`), ten-mood/fixture/key/fill lighting (`SceneLighting`), one motivated emissive (`CommunalSouth32`), compact persistent bullet contacts (`ShotgunMetal`, `WallSlam`), and retained-service fixture extensions (`acid-pool-surface`, `DeathRagdolls.integration`). All original gameplay/geometry/budget guarantees remain. I2 adds no further presentation-pin rewrite.

## 5. Integration requests

No unimplemented hook is required from another stream. For the later UI experience merge, retain the small `gameAdapter.ts` validation/projection changes and the two production loading-signal smoke waits. For V2, replace the clearly named interim module; preserve snapshot geometry, preparation registration, context retirement, room clearing and disposal. No audio files were edited.

## 6. Known gaps and next steps

- Interim ability artwork deliberately remains generic. Dedicated dash/buff/Overdrive language, bespoke anticipation/impact/aftermath and the parallel audio stream remain future work.
- G1 is a substantial framing/light improvement over the baseline, but legacy faceted props, repeating surfaces and overlapping large enemy silhouettes remain below the complete vision. No simulation spacing or balance was changed to conceal this.
- The live measurements pass average CPU/draw sanity, not worst-case frame or CPU certification. Frame P95 and Armory update spikes need longer profiling, a second GPU and higher-DPR desktop validation. The retained 922-program library still has a real loading/memory cost.
- Blender-dependent historical asset validation remains unavailable exactly as documented by the engineering rules. The six requested integration gates are the acceptance evidence; no failed gate is hidden behind a filtered error or weaker assertion.
