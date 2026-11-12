# G3 wave 4 — graphic surfaces and render pipeline

## 1. What shipped

Branch: `t3/inked-render-pipeline`. Application candidate: `4939853` (includes Low readiness `27da81a`, equivalent silhouette work reduction `a63c0f4`, compact Low AA `7e098b2` and packed HDR). The completed first full benchmark uses preserved source `d70f811`; later candidate receipts are identified separately below. The final documentation commit is reported in the handoff. No push or PR.

- Shared opaque MRT output supplies view normals, class and a stable actor identity to AO and ink, with **zero additional geometry draws**. Skin meshes and physical marine/alien identity accents share their owner's ID; overlapping enemies retain separate boundaries. Pooled/reborrowed actors retain bounded, collision-free ownership.
- **Bold is the default.** Actors have approximately 3 px silhouettes at native 1080p, 1.5 px major-form creases, slightly heavier marine/elite/boss contours; props have approximately 1.85 px silhouettes and 1 px creases. Lines use geometry/depth/identity rather than image contrast, fade in haze and darken toward a neutral local shadow tint. Low keeps silhouettes. Excluded transparent/effect draws preserve geometry data; hostile priority overlays explicitly block ink.
- A central, uniform-driven material patch gives three broad diffuse values, soft 12% transitions, cooler shadows, a thin geometric bevel/rim response, family-colored actor posterization and strong texture low-pass, actor normal strength .30 and floor normal strength .10. Bold skips fine floor grain/scratch masks. Authored light pools, cast shadows and saturated physical family accents remain.
- HDR MSAA is removed. High's final FXAA operates **after ink**, through an sRGB RGBA8 presentation target, before the HUD; Low uses five fixed AA taps with a bounded blend and no edge search. Main scene color uses positive HDR RGB11/11/10 (32 bits), dropping unused alpha; AO retains RGBA16F. GTAO shares packed geometric normals; minor pooled point lights retain diffuse lighting while avoiding specular BRDF work. Existing half-resolution AO and quarter-resolution bloom/distortion remain. Actor outer contours skip eight depth samples/reconstructions that never contributed to their ID-only silhouette; major creases retain their own depth kernel.
- High enables slow, hysteretic adaptive internal resolution in [.70, 1.00]; Low remains 1.00 by default. Existing performance snapshots expose scale, GPU lifecycle and pipeline stages. Opt-in asynchronous per-pass queries, actual pass dimensions, shadow scope and host load are recorded by the bench. No frame readback or blocking query completion was added.
- New programs are prepared against the actual HDR/MRT target before readiness. Switching Low between ink-off forward rendering and ink-on post rendering also holds readiness. Existing program/draw/preparation limits remain fatal.

Options are additive: `inkOutlines: 'off' | 'silhouette' | 'full'`, `adaptiveResolution: boolean`, `stylizedShading: boolean`. High defaults full/true/true, Low silhouette/false/true. `GRAPHICS_OPTION_CHOICES` exposes all ink choices. `setStyleStrength('subtle'|'medium'|'bold')` is a renderer art-review seam, reached through the existing opt-in debug renderer; it does not create gameplay globals or program variants.

## 2. Art decision and evidence

**Choose bold.** Subtle fails the lead's screen-size test; medium improves prop rims but leaves crowded actor overlaps too weak. Bold creates continuous dark divisions through the Armory pile and readable planter/bench/light-box edges at 480×270. It also removes much of the actor texture chatter and makes the procedural props' flat surfaces feel intentional. The full-size native crops are the strongest evidence; judging only a whole-room thumbnail conceals both the original problem and residual aliasing.

Iteration history is retained, rather than replacing rejected evidence:

1. `g3-ab-round1`: rejected light-pool circles and weak outlines. Transparent draw-buffer policy was corrected so effects cannot replace surface IDs/normals.
2. `g3-ab-round2` and `g3-ab`: pool artifacts removed and topology/preparation verified; the lead explicitly rejected the remaining subtle art direction.
3. `g3-bold-ab`: OFF/subtle/medium/bold, stronger family shading, body boundaries and major creases. Bold selected, but native crops revealed jagged thin edges.
4. `g3-final-bold-ab`: the same strength matrix with post-ink FXAA; 20 matched four-way rows, 16 four-frame motion rows, 52 exact native 600×400 crops. All four manifests use frozen source `dc55a3e`, identical seed/assets/clocks, `errors:[]`, `failures:[]`. Final physical accent coverage is separately verified by nine clean `g3-shipping-seam` captures from `d70f811`; no claim that those later changes are inside the earlier matched matrix.

Gallery: `/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-final-bold-ab/index.html`.

Eight first-review paths (OFF / subtle / medium / bold columns; original full-size PNGs are linked from the gallery):

1. `/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-final-bold-ab/review480/combat-calm-communal-atrium-strengths.png`
2. `/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-final-bold-ab/review480/combat-calm-armory-strengths.png`
3. `/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-final-bold-ab/review480/combat-calm-awakening-bay-strengths.png`
4. `/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-final-bold-ab/review480/combat-kiting-awakening-bay-02-strengths.png`
5. `/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-final-bold-ab/review480/combat-heavy-armory-02-strengths.png`
6. `/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-final-bold-ab/review480/boss-reactor-vault-02-strengths.png`
7. `/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-final-bold-ab/review480/combat-calm-overload-floor-strengths.png`
8. `/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-final-bold-ab/native-crops/combat-heavy-armory-02-strengths-native.png`

Prop crop: `g3-final-bold-ab/native-crops/combat-calm-communal-atrium-strengths-native.png`. Four-frame native sheets: `motion/combat-kiting-awakening-bay-bold-four-native-crops.png` and `motion/g3-prop-motion-communal-atrium-bold-four-native-crops.png` under that same absolute gallery root. Crops copy RGB pixels without resizing; review rows use area downsampling to 480×270. The prop burst moves the real camera; it is not a stationary render with a fabricated crop shift.

`g3-bold-allrooms` contains 40 clean High/Low calm captures across all 20 authored rooms. The earlier `g3-ab` 58-pair gallery remains historical evidence, superseded by the bold matrix.

**Quality trades:** bold deliberately flattens photographic albedo and small normal/specular variation; this is visible in the enemy crops and is the intended art standard. Major diffuse light direction, practical pools and cast shadows survive. Strong ink can make the deepest pile look busy; it separates visible pieces, but cannot reveal completely occluded bodies or fix content stacking. FXAA removes most stair-stepping at the cost of slight softness on fine bevels (before/after: `artifacts/nextgen/g3-aa-check/ink-aa-crop.png`). Thin subpixel geometry can still change coverage during motion; the four-frame review is evidence, not proof of temporally perfect edges. No temporal jitter or history ghosting is introduced. Existing geometry determines prop panel lines; this stream does not invent missing chamfers/seams or reauthor props. Friendly effects still need their owning stream's priority work; the ink pipeline preserves hostile overlays but cannot alone establish all of Decision 2.

Later pipeline trade checks: `g3-low-aa-ab/index.html` has 13 matched Low AA pairs with native crops/bursts; the five-tap filter is slightly sharper and keeps silhouettes/prop edges readable, but its timing run does **not** establish a speedup. `g3-packed-low-ab/index.html` compares the same Low filter in RGBA16F versus packed HDR; `g3-packed-high-ab/index.html` retains eight native crowd/boss pairs with unchanged High FXAA. `g3-packed-check` has 24 clean captures including bright Overload, dark Atrium, both tiers and all four Low off/on preparation transitions (readiness held, zero combat compiles). Packed HDR reduces color precision and its positive maximum slightly; no new banding or readability loss is apparent in these native comparisons. This is a measured image review, not a claim of numerically identical color.

`/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-resolution-ab/index.html` contains ten matched final-build native-versus-.70 pairs. The safety-net endpoint is visibly softer on fine prop/body detail at native size; HUD stays native and body divisions remain readable. This is a real quality trade, not a free or invisible performance win. The controller's long recovery/hysteresis limits pumping, but these fixed endpoint pairs do not establish temporal invisibility under every load change.

## 3. Measurements and gate results

See [G3-GPU-NOTES.md](G3-GPU-NOTES.md) for raw query tables, host loads, immutable build identity and deterministic pixel/tap/target arithmetic. **Quiet-host High 60 fps is not certified.** This shared 10-core machine has hundreds of runnable tasks. Even isolated rotating timer scopes report implausibly similar durations for tiny quarter-resolution bloom and the scene/HUD. An additional explicit flush diagnostic did not establish additive pass attribution. Raw numbers remain available; they are not relabeled as trustworthy isolated shader costs or summed into a GPU frame estimate.

The compared main logical target footprint changes from 74.65 MB (requested 2× HDR/depth MSAA plus resolve) to 41.47 MB in the first RGBA16F candidate, then **33.18 MB** with packed scene color (4 B HDR + 4 B geometry + 4 B depth + 4 B presentation per pixel), or **16.26 MB** at .70 internal scale. These are configured storage calculations, not measured VRAM or GPU milliseconds. High adds final AA; default Low now has three submissions instead of one, an explicit cost for contours/AA. Low ink-off retains the old one-pass path. AO/bloom had already been reduced in P1; no duplicate savings are claimed.

Final native benchmark receipt: **48/48 trials passed the resource/error gates**, two selected rooms (Relay Racks and Diagnostic Gallery), four full-kit rigs, both tiers, three repeats. Zero combat program creations; peak 322 draws and 225 prepared programs; `errors:[]`, `budgetFailures:[]`. High/Low timing flags are observational and fail acceptance; exit 0 does not mean 60 fps. Host load1m changed 724.0→162.8 on 10 cores during the 1524 s matrix. Frozen defaults use `d70f811`; the later `27da81a` readiness-only toggle change does not affect fixed-tier measured fights and has separate targeted coverage. A matched Manual-control Chamber / Arc before/after receipt follows separately; different selected rooms are not silently compared as the same fixture.

Completed gate summary lines:

```text
npm ci: passed (61 packages; no runtime dependency changes)
npm run build: passed (TypeScript + Vite; existing large-chunk advisory)
Final Vitest: 1 failed | 261 passed | 1 skipped (263 files)
Final Tests: 1 failed | 3029 passed | 1 skipped (3031 tests)
node --test scripts/cryo-model-preview.test.mjs: 2 passed
npm run test:room-evidence: 28 passed; ragdoll evidence 33 checks passed
npm run test:smoke: passed
npm run test:authored-smoke:all: 20/20 passed
npm run bench:rooms: 42/42 passed; zero first-frame/combat compiles
npm run bench: 48/48 resource/error gates passed; zero combat compiles; timing target NOT met
```

The one remaining full-unit failure is real: `UiScreens` settings content is 744 px high inside the 660 px 1280×720 drawer. Its fit assertion is intact. `npm run verify` was attempted and stopped at units (that overflow plus a host-timeout in unchanged I5 cadence on that attempt). The final packed-build full unit run has only the settings failure: 166.91 s, source `4939853`, load110.6→116.4, logs under `artifacts/nextgen/g3/packed-gates/`. Isolated Python asset stages pass their first three checks, then require unavailable `blender` (`FileNotFoundError`); no asset or assertion was changed to bypass it. Focused physical actor/geometry tests: 44 passed; Low readiness/post tests: 32 passed; packed-format/post tests: 28 passed. Earlier exact logs remain in `/tmp/g3-*` and native gate receipts under `artifacts/nextgen/g3/gates/`.

Room entries peak at 2078.4 ms, 197 programs, 66 material profiles and 11 compile passes, with zero first-frame/combat compiles. The retained preparation history also records a **3249.3 ms cold initial title/room preparation** under load around 640; the subsequent guarded entry is 533.1 ms. The passing entry matrix does not erase that cold-start outlier. Seven final build/unit/asset logs are copied into the native gate evidence directory for a durable local receipt.

No gameplay, determinism, persistence, native-input, accessibility, context-recovery or authored-room assertion was removed or weakened.

## 4. Presentation pins rewritten

- `NextgenPost`: default Low now expects scene/composite/final-AA and compact MRT resources; explicit Low ink-off retains the original one-pass/no-resource guarantee. High expects final AA, packed normals/identity, single-sample packed positive HDR (AO stays half-float) and complete disposal/preparation. Low's bounded five-tap filter is separate from the retained High FXAA source.
- `UiScreens`: the exact 16-control count now derives from complete graphics metadata plus six non-graphics controls. The 720p fit assertion remains and exposes the outstanding layout defect.
- `UiSettings`: string overrides select a valid non-default value instead of assuming every enum accepts `low`; the full saved object includes additive ink/adaptive/style options. Persistence behavior remains checked.
- `I2GraphicsPreferences`: private renderer fakes include the real player/menu/actor roots needed by geometry registration; shadow/recovery/native UI expectations remain.
- New shared-material numeric pins follow the approved bold tuning, with explicit subtle/medium/bold and original-off behavior. Geometry ownership, shader-patch idempotence, effect exclusion, timer lifecycle, scale bounds and preparation contracts have focused coverage.

## 5. Integration requests and contracts

UI owner: [G3-ui-integration.md](plans/G3-ui-integration.md) identifies two required changes. Consume exported `GRAPHICS_OPTION_CHOICES` so ink `off` appears and persists in settings; fit the three additive controls in the existing native accessible drawer at 1280×720. `src/ui/**` remains untouched by this stream, as assigned. This is a completion blocker, not a waived presentation test.

Other render streams:

- Keep new opaque physical actor meshes beneath their registered actor root and preserve ActorPool's per-owner material clones: identity is a uniform, so distinct live owners must not share the same mutable material. Standard materials are patched centrally; current authored marine/alien identity shaders have a narrowly recognized physical adapter. A new custom shader must provide explicit physical normals/identity coverage or remain excluded until integrated. Do not copy a compiled patch twice or introduce per-instance defines/cache keys.
- Transparent particles, ability effects, decals and light-pool draws must write color only; hostile priority materials use the existing high render-order ancestry/ink-block policy. Never use an actor ID for a telegraph or HUD scene.
- Register topology before the material warmup profile is captured, and prepare the actual active target before releasing readiness. Preserve zero combat compiles, 330-draw headroom/350 hard guard, 400 programs, 160 material families, 12 preparation passes and 3 s entry budget.
- Existing performance provider integration is module-level; keep `window.__containmentPerformance` intact. Sparse GPU timer and opt-in per-pass profiler must not own elapsed-query targets simultaneously. No synchronous GPU completion/readback belongs in a frame.

## 6. Remaining gaps and next steps

The bold standard is materially closer to Decision 1 than the rejected subtle look, and it keeps the light-pool/shadow character of the rooms. It is not AAA finish: crowded geometry still stacks, some procedural shapes lack authored bevel hierarchy, dark rooms can hide fine lines, and native motion crops retain some subpixel edge coverage changes. The available shared host cannot establish the requested p95 or reliable isolated GPU-pass costs. The priority follow-up is the small UI integration, then a quiet-host M1 Pro native benchmark with the same frozen fixtures and scale reporting; retain the raw coarse timer evidence rather than claiming a successful 60 fps target from this run.
