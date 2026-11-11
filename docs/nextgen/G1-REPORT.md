# G1 implementation report

## 1. What shipped

Branch: `t3/nextgen-graphics-overhaul`. Renderer/capture revision: `c43048a0e8999855f87ca331b1e76c9f0df55e16`; the final documentation commit is reported in the handoff. Work is committed in logical commits, with no push, PR, or merge into `nextgen`. **Rendering implementation and visual evidence are complete; release acceptance remains blocked by the three unowned browser integration lines in §5.**

- High: half-float HDR with 2× MSAA, depth/normal GTAO (12 samples), half-resolution Poisson denoising (8 samples), quarter-resolution bloom, one AgX composite with restrained grade/haze/lens/sharpen/dither, and a pooled quarter-resolution distortion field. Contact AO and ACES remain evaluation options. Low releases post targets and uses one forward scene pass with tone mapping and mood exposure.
- Ten immutable environment color scripts, complementary key/fill ratios around 4–6:1, soft key shadows, real practical fixtures and floor pools, nine pooled effect lights, marine aim lamp/cone, and one loaded-room cube/PMREM reflection capture. Reactor uses its core as a shadow-casting Spot key. Floor macro wear/roughness variation and grounded AO preserve materials rather than using a global tint.
- Bounded instanced dust, frost, steam, spores, embers, fog and shafts; heat/cryo distortion; designed structural sub-deck outside the playable boundary. Tier and reduced-motion controls apply.
- Critically damped follow, aim look-ahead, trauma/recoil/punch, closer long-lens perspective camera, correct pointer/visibility/body bounds and room clamping. Queen staging shares the frame with the marine.
- Weapon-specific HDR tracers, muzzle/impact lighting, casings, bounded persistent decals, layered explosions/distortion, enemy soft rims/hit flash/dissolve/status light, damage/elite-only backed health bars and marine locator. Reusable telegraph/ribbon/zone/shield primitives and a callable demo are exported through `src/render/vfx/index.ts`.
- Native room loading serializes asset readiness, reflection capture and shader preparation. Retained exact-topology material proxies, independent sampler placeholders, light-count buckets and actual shadow draws prevent combat compilation. Context loss retires GPU resources while retaining CPU assets, then prepares them again on restore.

New public `DepthRenderer` API (existing API retained):

```ts
get graphicsOptions(): GraphicsOptions;
setGraphicsOptions(partial: Partial<GraphicsOptions>): void;
setCameraProjection(projection: 'orthographic' | 'perspective'): void;
setToneMapping(operator: 'aces' | 'agx'): void;
setAmbientOcclusionAlgorithm(algorithm: 'contact' | 'gtao'): void;
addTrauma(amount: number): void;
kick(angle: number, amount: number): void;
punch(amount: number, ms: number): void;
```

Ability exports: `TelegraphBatch` (`add`, `set`, `progress`, `remove`, `clear`, `dispose`), `EnergyRibbonBatch` (`begin`, `append`, `end`, `clear`, `dispose`), `createGroundZoneMaterial(kind: 'fire'|'frost'|'electric'): THREE.ShaderMaterial`, `createDeployableShieldMaterial(color?: THREE.ColorRepresentation): THREE.ShaderMaterial`, and `demoVfx(scene: THREE.Object3D)`. Constructors attach only rendering resources and do not decide gameplay. Construct future ability materials before renderer preparation.

Projection decision: **perspective 28°**, camera offset `(0,26,19)`, downward pitch 53.84°, landscape ground-plane view height 13. At 16:9 this spans **23.11 world units horizontally**, with **20.8** inside the conservative aim-assist margin. This slightly exceeds the suggested 20–22 m full span to retain dodge space around the enlarged brutes. Ordinary east/south marine poses measure **127–137 px at 1080p**; north-facing extended weapon/arm poses can reach 170 px. Tall desktop windows use height 18. Both camera projections retain all 20 authored rooms × five desktop sizes × edge/body/pointer guarantees in `tests/NextgenCamera.test.ts`; existing desktop framing assertions were not weakened. Matched perspective/orthographic and AgX/ACES captures are retained in the earlier G1 review galleries; the actual frame and close/baseline comparison support the perspective choice. Near-side parapets are already cut down. `visible(x,y)` uses the closer actual frustum, so UI threat indicators should use it.

AgX was selected after cryo/security/reactor image comparisons: it preserves hot-core color falloff and shadow detail more consistently than ACES. No new npm dependencies or external bitmap assets. Existing Three.js/addon shaders are MIT; license remains `THIRD_PARTY/Three-LICENSE.txt`.

Performance: same legal heavy fixtures, desktop 1920×1080 DPR1, 120 settled samples. Final numbers come from the separate isolated browser run under `artifacts/nextgen/g1-final/performance/manifest.json`; before is the original renderer69cd88a reproduced in this worktree with the same shared harness, under `g1-before/manifest.json`. This avoids claiming the supplied gallery's unsynchronized timings as a benchmark.

Renderer: **ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Pro, Unspecified Version)**; hardware acceleration verified. Frame/update/render columns are average milliseconds; render is JS submission, not a GPU timer.

| Room / tier | Before frame / update / render JS | Final frame / update / render JS | Before → final draws | Before → final triangles |
|---|---:|---:|---:|---:|
| Armory High | 16.721 / .045 / 2.516 | 16.733 / .037 / 2.992 | 120 → 141 | 311411 → 325064 |
| Armory Low | 16.597 / .029 / 2.054 | 16.595 / .031 / 2.843 | 106 → 130 | 311397 → 324493 |
| Cryo High | 16.668 / .045 / 2.493 | 16.668 / .041 / 3.065 | 165 → 172 | 548739 → 551038 |
| Cryo Low | 16.666 / .043 / 2.450 | 16.667 / .043 / 2.796 | 151 → 160 | 548725 → 550315 |

Status-heavy Armory High:16.596/.053/2.651ms,143draws,329555triangles. All five benchmark fights compiled **zero** programs. Across all ten original combat-heavy room bursts:127–172draws, maximum551684triangles. CPU submission stays below8ms on average and draws stay below350. These captures **do not certify a strict16.6ms worst-case frame or organic combat update budget**: automatic simulation is frozen between fixture steps, average frame pacing is about60Hz, frame P95 is17.3–25.2ms, and each120-sample run records2–4 intervals above50ms including browser/capture overhead. Test live simulation and another mid-range GPU before performance sign-off.

## 2. Captures and critique

Capture label **`g1-final`**,89PNGs; gallery `/Users/chernodub/.t3/worktrees/containment-game/t3-9c60cc91/artifacts/nextgen/g1-final/index.html`. Supplemental native-transition audit10PNGs and isolated benchmarks5PNGs are copied under `native-shaders/` and `performance/`. Reusable primitive demonstration PNGs remain under `vfx/`.

First eight images:

1. `/Users/chernodub/.t3/worktrees/containment-game/t3-9c60cc91/artifacts/nextgen/g1-final/comparison/comparison.png`
2. `/Users/chernodub/.t3/worktrees/containment-game/t3-9c60cc91/artifacts/nextgen/g1-final/g1-exposure-calm-overload-floor.png`
3. `/Users/chernodub/.t3/worktrees/containment-game/t3-9c60cc91/artifacts/nextgen/g1-final/g1-kiting-infested-workshop-02.png`
4. `/Users/chernodub/.t3/worktrees/containment-game/t3-9c60cc91/artifacts/nextgen/g1-final/g1-kiting-communal-atrium-02.png`
5. `/Users/chernodub/.t3/worktrees/containment-game/t3-9c60cc91/artifacts/nextgen/g1-final/g1-kiting-armory-02.png`
6. `/Users/chernodub/.t3/worktrees/containment-game/t3-9c60cc91/artifacts/nextgen/g1-final/status-vfx-communal-atrium-02.png`
7. `/Users/chernodub/.t3/worktrees/containment-game/t3-9c60cc91/artifacts/nextgen/g1-final/boss-reactor-vault-02.png`
8. `/Users/chernodub/.t3/worktrees/containment-game/t3-9c60cc91/artifacts/nextgen/g1-final/g1-low-armory-02.png`

Contact sheet `comparison/index.html` has all ten baseline/final pairs,20embeddedthumbnails,sourcehashesandPNGexport. The supplied baseline omitted maintenance; its clearly labeled before shot was freshly reproduced from original renderer69cd88a using the shared harness inside this worktree. No other checkout was written. `comparison/inline.html` and `review-charts.html` provide interactive comparison/histogram/performance views.

Process: initial full67/79/82-PNG review rounds, then reactor-first six-iteration contrast calibration, then **three additional complete40-PNG calm+kiting galleries** (`g1-contrast-round1/2/3`), followed by final targeted and89-PNG reviews. PNGs and bursts were opened and critiqued. The superseded uniformly bright calibration is not presented as final.

Final critique: strong floor pools and long shadows now separate the warm atrium, sodium cargo, yellow engineering, cool cryo, cyan/green communications, wet teal maintenance, white/red security, green/magenta infestation, violet containment and orange-core reactor. Grade exposure is1.06; color comes primarily from fixtures/key/fill. Rough probe fill is subordinate, smooth/wet reflections remain, and small hull fixtures retain visible pools. Actor bodies are darker/desaturated with restrained cool separation; only elites use stronger colored rims. Health bars show only damage/elites and use dark backing. Frozen enemies remain deliberately pale. The closer view retains dodge width while showing off-screen threats more often.

Histogram method: PNG Rec.709-weighted **sRGB** luma0–255, centralROI x15–85%/y20–80%. Primary playfield statistics additionally mask only points outside the actual room boundary by inverse camera projection; actors, props and deep occlusion **remain**. The unmasked ROI is retained alongside it for direct auditing. This matters in the small atrium, whose designed sub-deck occupies part of the centralROI. Marine-local samples project all visible legal ground within3m. Sixteen bins, decoded-linear stats and all burst frames are in `luminance.json`; the reproducible script is `luminance-analysis.mjs`.

| Environment | Calm mean | Calm P5 / median / P95 | Calm local median | Kiting P5 range | Kiting median range | Kiting P95 range | Lowest kiting local median |
|---|---:|---:|---:|---:|---:|---:|---:|
| Cryogenics | 77.7 | 26.9 / 66 / 174 | 90.5 | 10.3–12 | 53.4–62.2 | 169.7–178.9 | 103.4 |
| Habitation | 86.2 | 16 / 76.1 / 181.6 | 121.8 | 12.8–17.5 | 50.9–78.9 | 179.8–201.6 | 101.1 |
| Security | 59.6 | 18.2 / 55.8 / 171.8 | 140.4 | 13.9–17.2 | 54.4–54.6 | 193.8–196.9 | 97.8 |
| Cargo | 76.9 | 18.4 / 61.6 / 178.2 | 73.4 | 11.1–15.9 | 55.4–58.5 | 198.4–200.8 | 119.3 |
| Communications | 71 | 22.7 / 49.6 / 168.8 | 81.2 | 18–20.3 | 71.5–76.7 | 179.9–193.3 | 97.2 |
| Engineering | 78.7 | 24.4 / 52.5 / 198 | 116.7 | 17.2–18.1 | 62.5–65.6 | 165–178.3 | 89.6 |
| Maintenance | 71 | 21.5 / 50.5 / 168.7 | 108.3 | 18.2–19.2 | 72.1–81 | 203.3–211.2 | 96.6 |
| Infested | 67.5 | 25.8 / 50.2 / 170.6 | 137.4 | 21.9–22.3 | 53.5–59.4 | 208–215.9 | 77.9 |
| Containment | 79.9 | 27.6 / 67.5 / 186.3 | 163.5 | 12.8–12.9 | 76.5–78 | 196.4–210 | 119.3 |
| Reactor | 87.4 | 28.6 / 79.8 / 175.6 | 71.6 | 15.2–17.7 | 78.3–79.3 | 172.7–174.8 | 83.7 |

These are near the requested approximate bands, not a claim that every percentile passes exact closed bounds. Small deviations remain: cryo/cargo burst shadows below12, engineering burst P95down to165, maintenance burst median81, infested P95up to215.9; calm communications/maintenance highlights around169 and reactor P5 28.6. All measured marine-local medians remain≥71.6. Pool coverage was art-directed by footprint and image review, not certified as an exact30–45% segmentation metric.

## 3. Gates

Latest logs are retained under `artifacts/nextgen/g1-final/gates/`.

- `VITEST_MAX_WORKERS=2 npm run verify`: **139 test files passed,1skipped;1689tests passed,1skipped**. GLB preview **2passed**. First three Python stages pass; monitor-artifact stage stops with documented pre-existing `FileNotFoundError: blender`. No Blender/test/GLB changes were made. The commands after that chain were run separately.
- `npm run build`: **tsc --noEmit passes; Vite build passes**. Standard bundle-size advisory remains; no runtime console warning/error in captures.
- Final lighting targeted tests after the last numeric calibration: **2files/27tests passed**. Prior final VFX/lighting/pool set: **3files/36tests passed**.
- `npm run test:room-evidence`: **28passed,0failed**; ragdoll CPU self-test **33checks passed**.
- `npm run capture -- --label=g1-final …`: **89PNGs verified, failures[],errors[]**;392.58s.
- Native `loadRoom` preparation audit: **10/10environments,zero combat gl.createProgram calls,failures[],errors[]**;121.76s. Isolated High/Low/status benchmark captures: **5/5,zero combat program creation,failures[],errors[]**.
- Tier/room/recovery capture: equivalent cycles **110geometries/79textures** for all three cycles; after restore/revisit **110geometries/77textures**,contextLostfalse, no draw errors. Retained program library840.
- `npm run test:smoke` (real hardware backend, unchanged script): **FAIL** in starting-boon resource HUD invariance. It snapshots old12/∞ammo, then correctly sees new8/16 after the scheduled HUD refresh. Earlier attempts also reached restart and exposed old30/80→new8/16. Graphics, native menu/audio and several gameplay phases pass; the complete gate is not green.
- `npm run test:authored-smoke:all -- --rooms=<all20>` (desktop, unchanged script): **FAIL** after awakening passes real move/fire. Passenger-vault held keys are sent while roomLoading blocks input; the subsequent ammo-change wait times out. This is a readiness synchronization issue, not permission to remove native input assertions. The exact proposed hook adds readiness checking before them. An earlier pre-queue20-room pass is historical and is not substituted for this final result.

Hardware smoke preload `/tmp/g1-metal.mjs` changes only Playwright launch flags from forced SwiftShader to ANGLE Metal. No game or smoke assertions are modified.

## 4. Existing tests rewritten or extended

No old tests removed. Exactly seven existing test files differ from the original renderer baseline:

- `tests/BoonLinks.test.ts`: old exact neon values replaced with equivalent semantic HDR colors/lifetime guarantees.
- `tests/SceneLighting.test.ts`: old broad ambient minimum/old source layout replaced with ten-mood, fixture-origin, key/fill, shadow and local-readability guarantees matching the approved contrast direction.
- `tests/CommunalSouth32.test.ts`: one existing welcome/task-lamp material may emit HDR light; original8material/32mesh/45000triangle, footprint and lifecycle budgets remain.
- `tests/ShotgunMetal.test.ts`: rifle contacts now permit compact persistent bullet marks while retaining the no-pellet-wall-slam/no-fire behavior guarantees; private material fixture extended.
- `tests/WallSlam.test.ts`: pellet contact permits one compact bullet hole; hit/physics assertions retained.
- `tests/acid-pool-surface.test.ts`: private retained active-pool fixture extended; footprint, safety and lifecycle assertions retained.
- `src/render/DeathRagdolls.integration.test.ts`: private renderer fixtures include new retained services; physics/integration assertions retained.

New structural/behavioral tests cover options, post tiers, ten moods/practical placement, light lifecycles, floor/probe shading, atmosphere, camera projection/body/pointer/clamping, VFX and ability primitives, shader topology/sampler preparation, context restoration and recovery ownership. Existing desktop framing assertions remain intact.

## 5. Integration requests

**Ownership override is pending.** `docs/nextgen/streams/G1-render.md` explicitly lists `src/main.ts`, `scripts/smoke*.mjs` and `scripts/authored-room-smoke.mjs` under “You do not touch”; engineering says to describe an unowned one-line hook rather than editing it. Accordingly none of those files were modified.

Reviewable exact patch: **`docs/nextgen/plans/G1-browser-integration.patch`**, `git apply --check` passes. Three added lines:

1. `main.ts` `start()`: call `hud()` after `syncScreen(true)` so new-run/restart HUD values are synchronized before the first interactive panel/test snapshot.
2. Authored smoke: wait for playing, `#world[aria-busy="false"]`, and hidden`#room-loading` before capturing ammo and holding movement/fire keys.
3. Production smoke `chooseStartingBoon`: wait for the same existing loading indicators before taking the post-resume resource snapshot.

The waits add readiness checks and remove no assertions. Apply under the lead's ownership override, then rerun both full desktop browser gates before accepting/merging G1. This combined patch supersedes the earlier separate HUD/readiness patch proposals.

UI integration: persist and feed `setGraphicsOptions`, build controls from the frozen contract labels, and use actual `visible(x,y)` for off-screen threat indicators. Ability integration: use the exported pooled blocks and prepare added shader families before combat. G1 does not add simulation abilities or UI persistence.

## 6. Known gaps and self-assessment

The image is a clear jump in framing, directional depth and light composition over baseline. It is **not an honest AAA asset-quality claim**: legacy kit props remain faceted/blockout-like, floor wear still repeats at some angles, infestation growth is procedural and limited, and crowded large enemy rigs can still overlap into masses despite improved body/rim/contact treatment. The Queen is strongly staged as a silhouette but could use a more bespoke art pass.

Practicals use budgeted shared key visibility rather than independent shadow maps; the pools are deliberate approximations. Reflections are64pxstaticcube/PMREMcaptures, not moving-actor/SSR reflections. Haze/shafts are instanced approximations. Low deliberately omits the High composite, AO, bloom, distortion and atmosphere. Preparation retains840programs to avoid native combat compilation, trading loading time/memory for hitch prevention.

The numeric mood targets are approximately met with the small burst exceptions listed above; exact pool-percentage segmentation was not measured. The sampled3m readability guarantee does not certify every possible combat/camera position. Full organic simulation/GPU timing, strict worst-case16.6ms, higher-DPR desktop hardware and another mid-range GPU remain release validation work.

Next: approve/apply the three-line integration patch and make both browser gates green; play the closer camera with UI threat indicators; then prioritize bespoke industrial/infestation assets, Queen lighting and smoother crowd silhouettes rather than more global exposure adjustment. No push or integration merge was performed.
