# C6 — camera and actor presentation, wave 6

Branch `t3/camera-queen-actor-visuals`. Application source `eed48d9efe9fdad1eecee9a6303e95ea9902963c`; delivery HEAD is in the handoff. Local commits only, no push/PR. Work stays in this worktree. No simulation, UI, ability, world/prop/lighting-module, dependency or license changes. Desktop only; no computer-use tools. Every inspected image came from PNGs.

## What changed

**C3:** a final camera constraint follows existing aim/threat/boss/HUD framing. Marine foot-to-head projection is conservatively at least 100 CSS px at 1080p, normally targets 122 px, scaling with CSS resolution. Full eight-corner bounds remain clear of reserved HUD. The usable viewport is projected to the deck and clamped inward against the playable boundary's AABB; non-small axes have at most 18% outside coverage. Small axes center exactly. Shallow rooms that fit the normal hero view get a cached geometry-derived zoom floor before smoothing, preventing a remote target from triggering a sudden multi-step wall correction. Analytic critically damped framing uses slower reduced-motion response; final contact-fit receipts are remeasured against the actual rendered matrix.

The all-template sweep covers perspective/orthographic cameras at 1920×1080, 1280×720, 900×900 and 3440×1440; boundary-contained interior/wall positions, four aim directions and remote priority contacts. It asserts minimum scale, both independent non-small-axis bands, total AABB coverage, genuine small-axis centering and every body corner's HUD clearance. Existing pointer/visible/playerScreenBounds tests remain. Added final-matrix projection/picking, changing-priority wall approaches, reduced motion and cache invalidation regressions. The reproduced Atrium zoom pop .08058/frame becomes .00413 normal/.00310 reduced; no repeated zoom-floor searches occur across 90 translated lookAt updates.

**C10:** Crawler has a broad armored hump and two thick forward mandibles; Stalker has a solid thorax, broad folded forelimbs and one raised warm stinger. Geometry is merged into the existing resident identity draw. The camera size floor plus enlarged primary forms establishes their minimum presentation size; no collision radius or hitbox changes. Existing pooled soft contact shadows remain. Warm feature accents survive the freeze tint. Animated family/rank footprint tests now include the new role 10 features as well as existing torso anatomy; all five footprint tests pass.

**C5:** full freeze desaturates actor skin by 40% with a restrained cool cast. Lower legs get the glaze and silhouette edges a thin frost rim. The existing pooled ice draw now contains a low ground patch and short foot crystals, capped near 22% of family height, instead of pale upper-body shards. Identity colors and defining feature geometry remain visible. Flat frozen emission is reduced .12→.018; hit flashes remain bounded and isolated. Six families × High/Low have lower-ice bounds, palette/uniform/material stability and reuse tests. Marine presentation remains cyan-white.

**C6:** the Queen's two hinged shell halves open around an irregular rolled lip and dark sloped cavity walls. A lobed luminous organ sits below the rim with actual depth. The complete well emerges with exposure while remaining nested in the closed shell at rest; the original closed-nesting assertion is retained. The generic elite crest no longer crosses the organ. Pulsed organ radiance also colors the plates' inward faces. Source visual height increases 8% within the unchanged horizontal collision footprint; the existing contact-shadow instance grows 1.3→1.95m and a bounded boss-specific shader rim strengthens separation. No extra actor draw/light/pass. Opening, closing, status and pool reuse share resident geometry/materials.

## Evidence

Root: `/Users/chernodub/.t3/worktrees/containment-game/t3-81fc4d14/artifacts/nextgen/`.
Baseline `c6-before` is frozen 7b1a08d: 64 native PNGs, errors[]/failures[]. Final `c6-final`: 68 native PNGs / 17 sprites, errors[]/failures[]. Measured across all 68: conservative hero 100.0–124.3px; projected AABB outside maximum 10.92%; actual hull outside maximum 24.08%. Final uses frozen application eed48d9 from `c6-final-source-dist`. Exact 480×270 area reductions are review images, not mobile captures. The critique ledger is `docs/nextgen/plans/C6.md`; failed raw rounds remain unchanged.

| Item | Before absolute PNG | After absolute PNG |
|---|---|---|
| C3 Coolant | /Users/chernodub/.t3/worktrees/containment-game/t3-81fc4d14/artifacts/nextgen/c6-before/c6-kiting-coolant-plant-02.png | /Users/chernodub/.t3/worktrees/containment-game/t3-81fc4d14/artifacts/nextgen/c6-final/c6-kiting-coolant-plant-02.png |
| C3 Annulus | /Users/chernodub/.t3/worktrees/containment-game/t3-81fc4d14/artifacts/nextgen/c6-before/c6-kiting-containment-annulus-02.png | /Users/chernodub/.t3/worktrees/containment-game/t3-81fc4d14/artifacts/nextgen/c6-final/c6-kiting-containment-annulus-02.png |
| C3 Overload | /Users/chernodub/.t3/worktrees/containment-game/t3-81fc4d14/artifacts/nextgen/c6-before/c6-kiting-overload-floor-02.png | /Users/chernodub/.t3/worktrees/containment-game/t3-81fc4d14/artifacts/nextgen/c6-final/c6-kiting-overload-floor-02.png |
| C10 black sheet | /Users/chernodub/.t3/worktrees/containment-game/t3-81fc4d14/artifacts/nextgen/c6-before/review/g5-silhouettes-containment-annulus-04-silhouette-sheet480.png | /Users/chernodub/.t3/worktrees/containment-game/t3-81fc4d14/artifacts/nextgen/c6-final/review/c6-silhouettes-containment-annulus-04-silhouette-sheet480.png |
| C5 native crowd | /Users/chernodub/.t3/worktrees/containment-game/t3-81fc4d14/artifacts/nextgen/c6-before/combat-kiting-passenger-vault-04.png | /Users/chernodub/.t3/worktrees/containment-game/t3-81fc4d14/artifacts/nextgen/c6-final/combat-kiting-passenger-vault-04.png |
| C6 native organ | /Users/chernodub/.t3/worktrees/containment-game/t3-81fc4d14/artifacts/nextgen/c6-before/g2-queen-exposed-reactor-vault-04.png | /Users/chernodub/.t3/worktrees/containment-game/t3-81fc4d14/artifacts/nextgen/c6-final/g2-queen-exposed-reactor-vault-04.png |

Eight native-action kiting rooms: coolant-plant, containment-annulus, overload-floor, armory, communal-atrium, breached-loading-bay, passenger-vault and swarm-junction. Each has four native frames, native harness sprite, exact 480 sprite and offline projected playable-hull/usable-viewport overlays. Overlay source matrices, hull and actual frame receipts are saved in `review/c6-framing.json`. Look at `review/eight-rooms480.png` and `review/bounds-c6-kiting-overload-floor-02.png` first.

Queen motion: `c6-final/review/queen-opening-native-sprite.png`, `queen-closing-native-sprite.png`, `queen-phases-native.png` and `queen-phases480.png`; real phase/timestamp/crop receipts alongside. Native/480 family masks come from actual geometry-owner bytes with adaptive resolution disabled. The C6 family fixture repacks the closer view, preserves 76-unit spacing and minimum 12, and proves all 14 accepted native bodies clear the usable viewport on every sampled accepted phase. It requests 15 and records the surplus removal; this is different legal staging from the historical 15-body G5 sheet, not a pixel-matched model-only comparison. The frozen-family variant is explicitly presentation-only and leaves simulation statuses unchanged.

## Gates and budgets

```text
npm ci: passed, 61 packages; lockfile unchanged.
VITEST_MAX_WORKERS=1 npm run verify (one browser worker):
  Test Files  299 passed | 1 skipped (300)
  Tests       3463 passed | 1 skipped (3464); Duration 406.69s
node --test scripts/cryo-model-preview.test.mjs: 2 passed, 0 failed.
npm run build: TypeScript + Vite passed, 241 modules.
npm run test:room-evidence: 28 passed, 0 failed; ragdoll self-test 33 checks passed.
SMOKE_SCREENSHOTS=0 npm run test:smoke:
  Browser smoke passed: desktop, production Pages subpath, assets, fire,
  weapon switch, pause/resume, credits.
  Native input, resizing, context recovery, checkpoint, abilities and audio pass.
npm run test:authored-smoke:all -- --rooms=<all 20 explicit story IDs>:
  20/20 passed, all errors:[]; Overload explicitFatalAuthorization:true.
npm run bench before/final: 12/12 trials each, exit 0, errors[]/budgetFailures[].
  peak draws 300 → 290 (limit 330); program inventory 112 → 112;
  mid-combat shader compiles 0 → 0.
npm run capture c6-before: 64 PNGs,errors[]/failures[].
npm run capture c6-final: 68 PNGs / 17 sprites,errors[]/failures[].
```

`verify` exits 1 at unchanged `test_monitor_artifacts.py`: `FileNotFoundError: 'blender'`. The first three Python asset suites pass; later Python suites are not claimed. All independent JavaScript/browser gates above pass. No Blender installation or asset/test bypass. Optional historical smoke screenshots stay disabled; authored outputs are under `artifacts/authored-smoke/desktop`, with no sparse historical folders written.

**Hardware acceptance remains incomplete.** All final medians round to 16.7ms, but best-of-three p95 remains 24.9ms in Swarm/Cryo and 25.2ms in Relay/Arc; the other two cases reach18.1ms. This does not establish a locked 60 fps High pass. Across all 12 trials, p95 spans 18.2–49.9ms before and 18.1–33.5ms after. Host 1m load on 10 cores spans 42.9–219.2 before and 21.8–109.5 after. Adaptive scale minimum remains .8; before median .8 throughout, final median range .8–.925. No settings, caps or timing flags were weakened to obtain these results.

| Case | Before best p50/p95 ms | After best p50/p95 ms | Draw peaks before/after | Selected host load before/after |
|---|---:|---:|---:|---:|
| swarm-junction/cryo/high | 17.0/41.7 | 16.7/24.9 | 197/195 | 42.9/67.3 |
| swarm-junction/arc/high | 17.7/49.3 | 16.7/18.1 | 188/188 | 89.6/82.7 |
| relay-racks/cryo/high | 16.7/25.2 | 16.7/18.1 | 300/290 | 139.9/93.4 |
| relay-racks/arc/high | 16.7/18.2 | 16.7/25.2 | 282/259 | 219.2/96.2 |

Lowest frame p95 of three ordinary 20-second trials; paired p50/load/scale from the same trial. All trials retained. Different host loads preclude a causal timing speedup claim.

Raw ordinary cohorts: `artifacts/nextgen/c6-bench-before/benchmark.json` and `c6-bench-final/benchmark.json`; final source is eed48d9. Earlier full after cohorts remain `c6-bench-pre-continuity`(fb6b81a) and `c6-bench-pre-organ-recess`(c041af6); none are silently pooled into the final cohort. Per-trial values, selected paired loads/scales, chart and Markdown table live under `artifacts/nextgen/c6-budget-review/` (`comparison.json`, `comparison.png`, `comparison.md`). Logs are `artifacts/nextgen/c6-{verify-final-source,build-final,room-evidence-final,smoke-final,authored-smoke-final,bench-before,bench-final,final}.log`.


Benchmark method: same Swarm/Relay rooms × Cryo/Arc × High, three ordinary 20-second native 25-enemy trials each, before and after. One browser owned by this task at a time; host load retained per trial. Select the lowest frame p95 among three and retain its paired p50/load/adaptive scale; every raw trial is retained. Native software/hardware renderer detection, population, corpse, draw, resource and zero-program guards remain unchanged. Staged PNG timing is not hardware evidence. CPU/GPU scope qualifications from I9 remain.

## Tests and remaining gaps

Presentation-pin replacements are individually listed in `docs/nextgen/plans/C6.md`. No gameplay, deterministic, persistence, accessibility, safety, input, physics or authored-room assertion was removed. The new camera service is constructed in the existing physics integration fixture; its eleven assertions are unchanged.

- **C3 qualification:**18% is guaranteed against playable room AABBs, not every concave hull. Exact projected hull coverage remains a separate diagnostic and overlay. Overload's narrow north tip exceeds 18%, and the saved Breached Loading Bay kiting burst reaches 24.08%, despite passing the AABB limit; the fixed tilt, 100 px hero floor and full-body HUD reservation conflict there. Do not describe the rectangular pass as an exact-hull pass.
- Foreground machinery/wall geometry can obscure a body even when projection bounds pass. One normal Stalker remains partly world-occluded in the family sheet; the second normal and elite provide clear shape examples. Distant threats can yield to the hero-size/room constraint; final fit=false receipts are honest and existing offscreen markers remain.
- Queen presence is stronger, but the close hero-sized camera can clip the upper mantle in the original south-of-boss fixture. Its well has depth and a vulnerability read; anatomy still has procedural facets and the torso remains the retained source creature.
- The tiny families are clearer, with thick defining features, but at 480their smallest limb motion still requires attention. This is sampled visibility evidence, not every-frame recognition certification.
- Ability-side Glacier/Whiteout geometry and large Cryo constructs are unchanged. Effects lead should review those against the new subdued actor frost; actor treatment does not certify ability-side coverage.
- Hardware acceptance must be read from the final trial receipts; no universal 60 fps or causal speedup claim follows from differing shared-host loads. Repeat the full performance matrix after integrating the parallel world/effects/UI branches.
- Missing Blender remains an external aggregate-verify prerequisite; no Blender/asset test was weakened, no GLB was altered and no installation was attempted.
