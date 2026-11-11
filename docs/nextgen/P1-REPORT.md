# P1 — render preparation, draw cost and texture lifecycle

Branch: `t3/optimize-room-preparation`. Validated application revision: `63d0b758d43b22d60285c2c2ca590302c7d0a93d`; capture synchronization revision: `8ed9496`. The final report-only HEAD is supplied in the handoff. Baseline application: `93adf6d10870e94fd5b32d2b04eff1ef746f64d8`, preserved inside this worktree at `artifacts/nextgen/p1/before-dist`. Final production snapshot: `artifacts/nextgen/p1/final-collider-dist`. No push, PR, other-worktree edit, dependency addition, asset-file mutation or phone testing.

## What shipped

- Warm only the selected tier/options and hold graphics readiness again when a setting changes shader topology. High no longer compiles every Low/dynamic-light/shadow permutation on every entry. Keep generation-aware parallel shader polling, lazy uniform/attribute introspection before release, and actual warm shadow/post draws. Introspection runs once per program; immutable textures upload once per texture version/generation. Eight-millisecond CPU slices replace timer-clamped yields after each cached texture.
- Fix screen HUD preparation: the HUD draws after HDR compositing, so its shaders must be compiled for the screen target. The new audit caught five first-frame variants that the initial selected-configuration implementation had missed. They now compile before release; final readiness-to-first-frame and combat creation checks are zero.
- Keep a fixed nine-slot High light topology, with a uniform-zero branch before attenuation and BRDF work. Positive lights retain their original shading. Eliminate combat visibility-bucket scans, skip unchanged practical matrix/color GPU uploads, and retain one PMREM generator across rooms. Graphics loss explicitly retires that generator and resets GPU upload/introspection state.
- Freeze and skip the static room hierarchy during ordinary matrix walks; forced refreshes and asynchronous owner arrivals retain exact transforms. Consolidate identical stock room finishes. Manual-control obstacle draws fall 15→7; Safety-interlock 16→8. Already-batched infestation is unchanged.
- Merge marine skins once on the immutable asset template: 22→4 draws, retaining every vertex, skin weight, normal, material, attachment anchor and sampled animation pose. Merge the Recovery Kit's 21 rigid meshes into eight exact finishes, retaining all 29,304 triangles. These save up to 18+13 color draws and the same number per shadow render; actual camera-dependent totals are measured below.
- Preserve physics independently of visual batches. A final audit found that merging the kit removed the existing dense-console proxy heuristic. Both static batchers now retain original collision partitions in a WeakMap; the real Recovery Kit still creates all 21 original colliders, including its single console proxy. Rendering remains eight meshes. Neither solver cadence/iterations nor gameplay collision changed.
- Add `prepareAhead(nodes)` with a bounded two-template idle LRU and future-light shader linking. The renderer reads known next nodes once at the reward/route boundary; it never replaces the active world or releases combat input for speculative work. No UI hook was necessary. No file under `src/render/abilities/**`, `src/game/**` or `src/ui/**` changed.
- Cache exactly three known Awakening GLBs per session, coalesce overlapping decodes, clone owner materials/transforms and borrow immutable geometry/maps. Room retirement cannot close cached images. Validate all images and required PBR bindings before caching; failed loads remain retryable. Explicit shutdown defers retirement until outstanding borrows finish. Actor model preload also coalesces overlapping requests.
- Add `npm run bench:rooms`, per-phase capture evidence, a first-frame program guard, program/work budgets, operation-count profiling, and a native twenty-cycle CPU/network-throttled restart stress runner. The original 350-draw benchmark assertion remains; P1 adds the stricter 330-draw headroom guard.

## Room preparation

Hardware: Apple M1 Pro, ten logical cores, Chromium 145 / ANGLE Metal, 1920×1080 DPR 1, High. Raw before/after: `artifacts/nextgen/p1-rooms-before/rooms.json` and `p1-rooms-complete/rooms.json`. Fresh means a new page per target after normal title initialization; the browser/driver can retain its ordinary shader cache. Retained means one renderer traverses all twenty story templates and the legacy arena through validated checkpoint routes. It exercises the accumulating material/program library and real construction/preparation; it is **not an organic twenty-room campaign**. Native full-kit combat and native room input are separate gates below.

Final 42-entry audit: fresh median **382 ms**, worst **663 ms**; retained median **334 ms**, worst **751 ms**. Every entry passes the ≤3 s guard and is below the 1.5 s typical target in this final run. All have zero programs created after public preparation and before the first frame, and zero during the subsequent combat probe. Peak retained program inventory is **203**, versus **2,541** before; material-family count stays bounded. The audit enforces programs≤400, shader families≤160, compile passes≤12 and readiness holds≤3,000 ms. GPU/host timing remains observational.

| Room | Fresh before → after ms | Retained before → after ms | Retained programs before → after |
|---|---:|---:|---:|
| awakening-bay | 1329 → 487 | 1392 → 497 | 1154 → 117 |
| passenger-vault | 2649 → 328 | 1575 → 243 | 1163 → 110 |
| residential-gallery | 1154 → 323 | 1077 → 334 | 1180 → 111 |
| communal-atrium | 1126 → 217 | 1018 → 228 | 1197 → 112 |
| crew-checkpoint | 1064 → 321 | 704 → 264 | 1197 → 112 |
| armory | 1238 → 306 | 3150 → 237 | 1214 → 113 |
| freight-hold | 1538 → 662 | 1166 → 751 | 1214 → 113 |
| breached-loading-bay | 1005 → 305 | 669 → 251 | 1216 → 115 |
| relay-racks | 869 → 140 | 551 → 170 | 1215 → 114 |
| transmission-chamber | 1097 → 339 | 746 → 320 | 1214 → 113 |
| diagnostic-gallery | 1152 → 405 | 804 → 362 | 1215 → 114 |
| safety-interlock-station | 2796 → 466 | 1171 → 415 | 1234 → 117 |
| coolant-plant | 1230 → 383 | 866 → 446 | 1231 → 114 |
| service-shaft-landing | 1262 → 147 | 868 → 203 | 1248 → 115 |
| infested-workshop | 1380 → 385 | 798 → 358 | 1249 → 116 |
| swarm-junction | 1208 → 382 | 850 → 411 | 1249 → 116 |
| shielding-gate | 1215 → 421 | 869 → 422 | 1249 → 116 |
| containment-annulus | 1103 → 218 | 931 → 199 | 1286 → 121 |
| manual-control-chamber | 4822 → 467 | 12507 → 486 | 2539 → 201 |
| overload-floor | 3659 → 427 | 1242 → 241 | 2540 → 202 |
| reactor-vault | 4936 → 563 | 807 → 370 | 2541 → 203 |

Manual-control after eighteen preceding room loads: **12,507→486 ms**. The baseline warm phase was **12,202 ms**; the late reactor key type multiplied the entire accumulated library across all light buckets/tier combinations. The final selected-configuration warm phase is approximately **230 ms**, with ten compile passes. Per-phase records include construction, owner wait, reflection, actor/action setup, uploads, link submission/wait and uniform/attribute introspection. Repeated owner notifications coalesce while assets are still pending.

The quieter background probe `p1-ahead` links 43 future-light programs in335 ms while the preceding Containment Annulus reward remains visible; Manual-control entry takes 368 ms. A final collider-preserving repeat (`p1-ahead-final`) at load 381.65 takes 1,861 ms in the background and 2,516 ms on entry (1,458 ms reflection and 884 ms warmup). Both retain zero first-frame/combat compiles and pass the 3 s worst-case guard. The extra high-load observation is retained alongside the faster result. The detached CPU cache owns at most two future templates and cancels queued work when an actual room starts. The shared tiny shader proxies retain no departed room vertex buffers or image owners.

Parallel compilation uses the same Three compile/link + `isReady()` mechanism as `compileAsync`, with explicit graphics-generation cancellation. The pre-existing uncancellable Three callback is intentionally not reintroduced: context replacement must stop polling disposed programs. Error reporting remains enabled. Input stays blocked through owner readiness, reflection, all required programs, GPU introspection and the actual warm frame.

Early exploratory failures remain under `p1-rooms-round 1`, `p1-rooms-after` and `p1-manual-readiness`. The first selected-configuration audit exposed the HUD target omission; it was fixed rather than relaxing timing/readiness assertions. The final table does not replace those raw failures.

## Frame cost and profiles

Best CPU-p95 trial of three per configuration; draws/triangles/programs use the maximum across all three.

| Room / rig / tier | Load before → after | Frame p50/p95 ms before → after | CPU+HUD p50/p95 ms before → after | Update+render p95 before → after | Peak draws before → after | Peak triangles before → after | Programs before → after |
|---|---:|---:|---:|---:|---:|---:|---:|
| awakening-bay / breacher / high | 110.43 → 664.46 | 16.70/25.10 → 16.70/25.10 | 8.60/13.50 → 8.20/13.60 | 13.50 → 13.40 | 349 → 305 | 1282901 → 1294923 | 1164 → 123 |
| awakening-bay / breacher / low | 127.62 → 730.88 | 16.70/18.20 → 16.70/25.10 | 6.60/9.70 → 6.80/10.30 | 9.70 → 10.20 | 183 → 165 | 629235 → 651421 | 1151 → 172 |
| awakening-bay / cryo / high | 108.15 → 854.89 | 16.70/25.30 → 16.70/18.10 | 9.10/13.70 → 10.30/14.10 | 13.50 → 14.00 | 368 → 312 | 1297677 → 1281337 | 1164 → 123 |
| awakening-bay / cryo / low | 91.58 → 846.62 | 16.70/25.20 → 16.70/18.00 | 5.90/8.70 → 6.50/9.70 | 8.60 → 9.60 | 196 → 184 | 645231 → 671115 | 1151 → 172 |
| awakening-bay / pyro / high | 124.76 → 922.99 | 16.70/25.10 → 16.70/23.20 | 9.80/14.50 → 10.30/14.70 | 14.40 → 14.60 | 361 → 310 | 1269635 → 1283669 | 1164 → 123 |
| awakening-bay / pyro / low | 135.01 → 858.69 | 16.70/18.00 → 16.70/25.20 | 6.70/9.80 → 7.50/11.30 | 9.70 → 11.20 | 201 → 181 | 658473 → 661965 | 1151 → 169 |
| awakening-bay / arc / high | 200.47 → 814.89 | 16.70/18.20 → 16.70/25.30 | 8.50/12.00 → 7.40/11.20 | 11.90 → 11.10 | 322 → 276 | 1260223 → 1266289 | 1164 → 120 |
| awakening-bay / arc / low | 295.35 → 626.62 | 16.70/25.00 → 16.70/25.10 | 6.00/8.80 → 6.00/8.70 | 8.80 → 8.50 | 174 → 158 | 641137 → 669687 | 1151 → 169 |
| diagnostic-gallery / breacher / high | 321.87 → 530.06 | 16.80/31.90 → 16.70/25.30 | 8.70/15.30 → 7.10/11.90 | 15.10 → 11.90 | 287 → 256 | 862633 → 854067 | 1174 → 114 |
| diagnostic-gallery / breacher / low | 299.96 → 499.85 | 16.70/25.20 → 16.70/18.30 | 5.90/9.60 → 5.40/9.20 | 9.50 → 9.20 | 165 → 149 | 444981 → 452195 | 1163 → 166 |
| diagnostic-gallery / cryo / high | 257.39 → 444.33 | 16.70/25.20 → 16.70/25.30 | 9.50/14.20 → 8.90/13.70 | 14.10 → 13.60 | 287 → 255 | 838231 → 833189 | 1174 → 114 |
| diagnostic-gallery / cryo / low | 235.55 → 391.25 | 16.70/25.10 → 16.70/25.20 | 6.20/9.60 → 5.60/8.70 | 9.60 → 8.60 | 168 → 147 | 441373 → 439107 | 1163 → 166 |
| diagnostic-gallery / pyro / high | 226.32 → 296.06 | 16.70/18.10 → 16.70/23.70 | 9.90/14.70 → 8.50/13.20 | 14.60 → 13.10 | 293 → 254 | 838663 → 853521 | 1174 → 114 |
| diagnostic-gallery / pyro / low | 275.58 → 277.71 | 16.70/18.10 → 16.70/25.30 | 6.50/10.30 → 6.00/10.00 | 10.20 → 9.90 | 175 → 154 | 450163 → 449845 | 1163 → 166 |
| diagnostic-gallery / arc / high | 282.65 → 277.98 | 16.70/25.60 → 16.70/25.20 | 6.60/10.80 → 6.20/10.40 | 10.70 → 10.40 | 257 → 222 | 803949 → 804185 | 1174 → 116 |
| diagnostic-gallery / arc / low | 263.65 → 499.91 | 16.70/18.00 → 16.70/25.20 | 5.50/7.60 → 4.80/7.60 | 7.60 → 7.60 | 149 → 131 | 420331 → 413259 | 1163 → 166 |

Separate operation-audit runs; all columns below are per-frame p95 counts. Probe overhead is excluded from the primary timing matrix.

| Room / rig / tier | GL calls B→A | Program switches B→A | State setter calls B→A | Uniform uploads B→A | Local matrix composes B→A | World matrix writes B→A |
|---|---:|---:|---:|---:|---:|---:|
| awakening-bay / cryo / high | 3205 → 3086 | 127 → 137 | 1064 → 1003 | 1409 → 1404 | 3771 → 3976 | 4117 → 4283 |
| awakening-bay / cryo / low | 1965 → 1959 | 108 → 111 | 702 → 701 | 741 → 749 | 3368 → 3345 | 3397 → 3352 |
| awakening-bay / pyro / high | 3135 → 3048 | 133 → 125 | 1047 → 1017 | 1336 → 1354 | 3937 → 3665 | 4052 → 3854 |
| awakening-bay / pyro / low | 2005 → 2016 | 120 → 115 | 713 → 734 | 730 → 747 | 3571 → 3436 | 3655 → 3459 |
| diagnostic-gallery / cryo / high | 2646 → 2659 | 110 → 113 | 870 → 859 | 1133 → 1161 | 3505 → 3767 | 3691 → 3868 |
| diagnostic-gallery / cryo / low | 1751 → 1732 | 101 → 98 | 602 → 586 | 644 → 666 | 3335 → 3380 | 3340 → 3415 |
| diagnostic-gallery / pyro / high | 2731 → 2623 | 117 → 115 | 917 → 873 | 1122 → 1121 | 3753 → 3654 | 3953 → 3809 |
| diagnostic-gallery / pyro / low | 1780 → 1733 | 101 → 102 | 631 → 614 | 641 → 634 | 3321 → 3323 | 3337 → 3297 |

| Room / rig / tier | Draw peak B→A | Scene instances peak B→A | Active scene lights peak B→A | Shadow maps/draws peak B→A | Passes including color peak B→A | CPU particles advanced p95 B→A |
|---|---:|---:|---:|---:|---:|---:|
| awakening-bay / cryo / high | 359 → 322 | 1888 → 2057 | 20 → 20 | 1/143 → 1/114 | 8 → 8 | 782 → 816 |
| awakening-bay / cryo / low | 195 → 171 | 1073 → 1114 | 8 → 8 | 0/0 → 0/0 | 1 → 1 | 312 → 324 |
| awakening-bay / pyro / high | 365 → 313 | 1781 → 1725 | 20 → 20 | 1/144 → 1/113 | 8 → 8 | 828 → 833 |
| awakening-bay / pyro / low | 205 → 177 | 1011 → 990 | 8 → 8 | 0/0 → 0/0 | 1 → 1 | 331 → 340 |
| diagnostic-gallery / cryo / high | 275 → 247 | 1813 → 1755 | 20 → 20 | 1/93 → 1/77 | 8 → 8 | 791 → 735 |
| diagnostic-gallery / cryo / low | 173 → 148 | 1025 → 1060 | 8 → 8 | 0/0 → 0/0 | 1 → 1 | 315 → 327 |
| diagnostic-gallery / pyro / high | 296 → 253 | 1653 → 1664 | 20 → 20 | 1/98 → 1/80 | 8 → 8 | 823 → 822 |
| diagnostic-gallery / pyro / low | 169 → 154 | 900 → 863 | 8 → 8 | 0/0 → 0/0 | 1 → 1 | 335 → 324 |

Unwrapped operation-profile pair: Awakening/Pyro/High, 20 seconds; native fixture observation and CDP sampling remain enabled.

| Metric | Before | After |
|---|---:|---:|
| Host load 1m | 35.18 | 370.83 |
| Sampled allocation MiB/s | 91.62 | 61.58 |
| Sampled allocation KiB/observed frame | 1602.68 | 1964.90 |
| GC pause maximum ms | 15.94 | 12.03 |

| CPU self-time group (ms over 20 s) | Before | After |
|---|---:|---:|
| Rapier/WASM | 3744.28 | 3183.43 |
| setFromRotationMatrix | 377.98 | 204.39 |
| renderBufferDirect | 191.70 | 112.62 |
| upload | 115.15 | 42.71 |
| _update | 33.64 | 16.50 |
| apply | 151.53 | 104.89 |
| (garbage collector) | 128.83 | 186.00 |

Budgets are checked against actual populated fights: 25 legal initial actors, legal native replenishment, retained corpses, accepted full-kit receipts, native audio and twenty wall-clock seconds. The default timing matrix contains three trials per room/rig/tier; raw samples and every trial remain in the JSON. The table selects the lowest CPU-p95 trial of three for timings and reports draw maxima across all three. Update includes fixture-driver work and CPU includes HUD synchronization. Timing trials use the same optional draw audit on both sides. Profile/cost-audit timings are kept separate.

The all-twenty High/Arc inventory scan is `p1-scan-release`: 25 legal actors and full native kit, zero combat programs in every room; peak **242 draws** in Awakening Bay. It predates only the collider-partition preservation change, which does not change render draws. Its ranking is not a replacement for sustained all-rig trials.

High quality is preserved: scene color/composite at1920×1080, GTAO/denoise at960×540, bloom/distortion at480×270, 1024² High shadows and existing 30 Hz shadow cadence. Low retains its forward path with no fullscreen post passes. No AO/bloom/DoF/atmosphere density, effect cap, corpse limit or visual tier was reduced. State-call counters mean actual GL setter calls, not an invented count of state transitions; program switches count changed handles.

Heap sampling includes collected objects. The operation audit intentionally wraps GL/matrix calls and allocates probe arguments, so its allocation numbers cannot certify production allocation rates. Separate `p1-profile-before` / `p1-profile-final` runs omit those wrappers. All profile figures include ordinary benchmark observation and fixture activity; they are not a global zero-allocation claim. The changed steady-state light/practical/static-transform paths add no frame allocations; owner/material/geometry work occurs on preparation boundaries.

## Texture error investigation and reliability

The original nine-error Chromium incident was not reproduced with a proven low-level cause. Source inspection found no application-wide blob revocation, no shared cross-parser blob URL, and no premature image close in the former independent room owners. Three r185 revokes embedded URLs after successful decode, but resolves failed texture loads as null; retaining such an incomplete source would be unsafe.

A supported lifecycle defect was repeated parsing of all three Awakening GLBs on every restart, plus uncoalesced overlapping actor preload requests. Their 26 embedded room images were decoded again for each new owner. The fixed three-key cache removes that recurring GLTF/blob path from native restart/Continue, retains CPU images across context recovery and validates both image pixels and material map bindings. New material copies preserve per-owner lighting changes. Cancelled rooms abandon their borrow while the session-owned transfer can finish for another room; failed entries are evicted and retried. Cache disposal and merged-geometry disposal have independent, tested ownership.

Final native stress (`p1-restarts-final`): **20/20 Start/title/Continue cycles passed**, CPU 2×, network 100 ms latency /8 MiBps, HTTP cache disabled. Initial decode totals are **55 blob URLs /55 ImageBitmaps, including 26 room images**. All twenty cycles remain at those totals, with 102 GPU textures and 124 retained programs. No failed embedded fetch, decode error, leaked blob URL, double close, closed live map, console/page error or fallback owner was accepted. Native smoke separately exercises page reload, checkpoint Continue, return-to-title and new-run actions. Raw lifecycle/failure traces are retained in `restart-stress.json`.

This proves the exercised restart path no longer decodes/revokes a fresh set of room images each cycle. It does **not** prove the exact historical browser decoder rejection or every possible driver failure has been identified. That remaining attribution limit is explicit; no console error was filtered or assertion weakened.

## Captures and visual review

Fourteen matched High/Low pairs cover Awakening Bay, Communal Atrium, Relay Racks, Infested Workshop, Containment Annulus, Manual-control and the legacy Queen arena. Labels: `p1-before` / `p1-final`; standalone comparison gallery `artifacts/nextgen/p1-quality/compare.html`, with one side-by-side PNG per fixture and retained original 1920×1080 frames. The source provenance of every gallery is in its manifest. Later collider-partition changes affect physics metadata only; native final recovery and all authored inputs were rerun.

All fourteen pairs were opened. Review round 1 checked every environment/tier and both Queen views: light pools, floor relief, silhouette, reflections and marine/HUD placement remain. Review round 2 inspected the final Recovery Kit batching in High and Low, and actual restored-graphics/Armory frames. The kit's baked Float32 positions differ by <2e−6 world units, normals <1e−6 and UVs are exact; no visible material seam or shadow change was found. Several pairs differ only in a handful of pixels. The mean absoluteRGB error is≤0.566/255 in all fourteen pairs; transient checkpoint toasts and small shading differences remain visible in the raw comparisons. No deliberate quality reduction was made. `pixel-comparison.json` retains actual per-pair differences rather than asserting screenshot byte equality.

First eight review paths (pairs have before left / after right):

- [g2-calm-high-awakening-bay.png](/Users/chernodub/.t3/worktrees/containment-game/t3-d2bc1fd4/artifacts/nextgen/p1-quality/g2-calm-high-awakening-bay.png)
- [g2-calm-low-awakening-bay.png](/Users/chernodub/.t3/worktrees/containment-game/t3-d2bc1fd4/artifacts/nextgen/p1-quality/g2-calm-low-awakening-bay.png)
- [g2-calm-high-manual-control-chamber.png](/Users/chernodub/.t3/worktrees/containment-game/t3-d2bc1fd4/artifacts/nextgen/p1-quality/g2-calm-high-manual-control-chamber.png)
- [g2-calm-low-manual-control-chamber.png](/Users/chernodub/.t3/worktrees/containment-game/t3-d2bc1fd4/artifacts/nextgen/p1-quality/g2-calm-low-manual-control-chamber.png)
- [g2-calm-high-infested-workshop.png](/Users/chernodub/.t3/worktrees/containment-game/t3-d2bc1fd4/artifacts/nextgen/p1-quality/g2-calm-high-infested-workshop.png)
- [g2-calm-high-containment-annulus.png](/Users/chernodub/.t3/worktrees/containment-game/t3-d2bc1fd4/artifacts/nextgen/p1-quality/g2-calm-high-containment-annulus.png)
- [boss-reactor-vault-01.png](/Users/chernodub/.t3/worktrees/containment-game/t3-d2bc1fd4/artifacts/nextgen/p1-quality/boss-reactor-vault-01.png)
- [g2-boss-low-reactor-vault-01.png](/Users/chernodub/.t3/worktrees/containment-game/t3-d2bc1fd4/artifacts/nextgen/p1-quality/g2-boss-low-reactor-vault-01.png)

## Gates

Logs: `artifacts/nextgen/p1/gates/`. Final application gates use the collider-preserving renderer; earlier failed/interrupted diagnostics remain separately labelled.

```text
npm ci: added 61 packages; no dependency/lockfile changes
VITEST_MAX_WORKERS=2 npx vitest run --exclude scripts/cryo-model-preview.test.mjs:
  Test Files 223 passed |1 skipped (224)
  Tests 2624 passed |1 skipped (2625); Duration 113.96 s
node --test scripts/cryo-model-preview.test.mjs: tests 2; pass 2; fail 0
npm run build: tsc --noEmit + Vite passed; existing large-chunk advisory
npm run test:room-evidence: tests 28; pass 28; fail 0
  {"passed":true,"cpuOnly":true,"checks":33}
npm run test:smoke: Browser smoke passed: desktop, production Pages subpath,
  assets, fire, weapon switch, pause/resume, credits.
  Checkpoint feedback, all rig/native controls, audio wiring and zero-error assertions passed.
npm run test:authored-smoke:all -- --rooms=<all twenty story IDs>:
  20/20 rooms passed real keyboard movement/fire; errors:[] in every room;
  Overload retained explicitFatalAuthorization:true.
npm run bench:rooms -- --label=p1-rooms-complete --no-build:
  42/42 entries passed; first-frame programs 0; combat programs 0; errors[]; failures[].
npm run bench -- --label=p1-frame-final --rooms=awakening-bay,diagnostic-gallery
  --repeat=3 --audit-draws --no-build:
  48/48 trials; peak 312 draws; combat programs 0; errors[]; budgetFailures[]; exit 0.
  CPU/frame timing flags remain red in all 24 High trials; see limits below.
Operation audits:8 before +8 after trials; all original gameplay/resource assertions passed.
Unwrapped CPU/heap profiles:1 before +1 after 20 s run; errors[]; combat programs 0.
Restart stress:20/20 native cycles; zero additional embedded URLs/image decodes.
Capture p1-before /p1-final:14+14 verified PNGs; errors[]; failures[].
Final native context capture p1-context-final:2 verified PNGs; errors[]; failures[].
Capture fixture tests:3 files,9 tests passed.
Cost-audit self-test: driver/matrix/shadow/post/particle counts and restoration passed.
npm run verify: unit/model stages passed, then stopped at documented pre-existing
  FileNotFoundError: 'blender' in test_monitor_artifacts.py. No Blender/test bypass.
```

The aggregate verify attempt predates the final focused physics additions; all requested independent final gates above were rerun afterward. The pre-collider and pre-Recovery timing runs were explicitly stopped when a further correctness/performance change required a new build; their partial JSONs remain as diagnostics, not final trials. The complete 96 before/final timing trials and separate profiles remain complete. No desktop assertion, population threshold, native slot receipt, resource check or console-error gate was relaxed.

## Tests added, rewritten or removed

No gameplay, persistence, input, navigation, accessibility, desktop sizing or authored-geometry assertion was removed or weakened.

New coverage checks stable Three light topology; unchanged GPU attribute versions for idle practicals; PMREM lifetime/reset; exact static materials/transforms/normal/UV/shadow flags; cache LRU/cancellation/ownership; bit-exact marine attributes and every deformed vertex through nine production poses; Recovery Kit's21→8 rendering with all 21 original collider decisions/bounds; real Rapier static collider count; shared texture shutdown/retry/cancellation; twenty native-owner cycles; generation-safe preparation, coalesced owner notifications and screen-target HUD preparation. Operation-count probes have a standalone self-test with wrapper restoration checks.

Presentation-specific rewrites:

- `tests/NextgenLighting.test.ts`: replace two old visibility-bucket expectations with fixed admission counts and stable `WebGLLights.state.version`; active-light capacities/lifetimes remain asserted.
- `tests/PracticalOcclusion.test.ts`: shader cache key v5→v6 for the uniform-zero early branch; existing practical occlusion coverage remains.
- `src/render/vfx/PlayerBeacon.test.ts`: expect four exact source skins rather than 22 after template batching; all original per-vertex/index/normal/pose and fallback/lifecycle assertions remain.
- `tests/I2GraphicsPreferences.test.ts`: assert selected Low-shadow rendering has completed before post warmup, instead of requiring the old temporary High map to be replaced; add actual screen-target HUD checks. Persistence/recovery assertions remain.
- `scripts/nextgen/scenarios.mjs`: the faster preparation exposed an intermittent capture race with the application's next DOM commit. Recovery now waits for real visible enabled Return-to-pause/Resume controls instead of optional clicks on missing buttons. The failed `p1-context-complete` frame/manifest is retained; final recovery passes the original HUD/GPU/resource assertions.

## Integration requests and remaining limits

**Preparation, first-frame/combat shader, 330-draw headroom and exercised restart reliability goals pass. The strict frame/CPU timing signoff does not.** All 24 sustained High trials exceed 8 ms update+render p95 and 16.6 ms frame p95. Best-of-three High update+render p95 is10.4–14.6 ms; best CPU+HUD p95 is10.4–14.7 ms. Best selected frame p95 ranges 18.1–25.3 ms. Every raw trial remains available, including the 41.8 ms frame-p95 outlier. This is not quiet-host 60fps certification.

Host load 1m ranged **277.71–971.54** during the final timing matrix. No unrelated process, simulator or browser was stopped. After profiling, a nearly three-minute settling window still measured load 366.95→392.74; `host-settle.json` retains timestamps and all three averages. No quiet rerun is substituted for the failed timing flags. Different host load, actor mix, corpses and frame counts mean neither timings nor total live workload counts are an isolated causal estimate. The exact per-asset reductions and program topology changes are deterministic; the populated-fight counter tables are observations.

Profiles rank Rapier/WASM, animation/transform work and render submission among the remaining CPU costs. Sampling also shows continued Three uniform/animation allocation, ability particle work and simulation polygon/path queries. Unwrapped sampled allocation falls per second but rises per observed frame in this pair; differing frame counts and host scheduling prevent a causal efficiency claim. This is **not** proof of global allocation efficiency or zero allocation. The strict global no-allocation/headroom objective remains open. Full CPU/allocation self-time/site rankings are retained under `artifacts/nextgen/p1/*-rankings.json`; minified names are not presented as invented source-map attribution.

Integration requests: no UI/game hook or ability API change is required to land these commits. For the remaining timing budget, the simulation owner should investigate the profiled path/polygon query allocation/cost, and the ability stream should inspect the `ElementKit.begin` particle/allocation stack without reducing visual capacity. Renderer follow-up should profile offscreen pose work, standard uniform uploads and death-physics cost on a quieter native run before choosing another quality-preserving optimization. Solver cadence/iterations, body support/collision shapes and High effects were deliberately retained.

The historical GLTF decoder rejection's exact low-level trigger remains unproven. The repetitive restart decode path is removed by construction and the stress passes; further attribution needs an actual failing underlying fetch/decode trace, not a guessed blob-lifetime claim.

The rendering character, post resolutions, authored composition and gameplay remain. This is a performance/lifecycle pass, not a new art-quality claim: inherited blockout-like props, crowd silhouette overlap and the Queen's bespoke-art limitations remain. Captures support preservation of the approved look; they do not establish human play feel or another GPU/browser's performance. The retained-room sequence is accumulation coverage, not a new organic campaign. No mobile release requirement was added.
