# G5 — designed actor graphics

Branch `t3/designed-actor-graphics`. Application source `8fd8bd0`; final documentation HEAD is in the handoff. Local commits only; no push or PR. No gameplay simulation, gameplay collision/hitbox, save, UI, ability, environment or production camera changes. Ragdoll proxy fitting is visual presentation only. No dependencies or licensing changes.

## Standard and authorship

Actor triangle regions are authored once on loaded templates from original mesh names (marine armor/helmet) and summed skin-bone weights (head, trunk, left/right limbs, lower limbs, organ). Triangles retain one categorical region across all three corners; reindexing splits only seams. Source skin maps and micro normals no longer supply skin values. A matte family finish plus authored region values receives the existing three-band HDR diffuse response. Marine helmet/shoulders are cyan-white, with graphite body groups, a restrained chest/visor light, rig-colored physical panels and unchanged weapon/facing pose.

The existing MRT RG normal and B owner bytes remain; A packs class +8×region. Owner identity supplies exterior silhouettes; region identity supplies interior ink. Actor normal/depth crease detection is entirely removed. World creases, AO normals, hostile/effect exclusion, clear policy, native AA and Low silhouette-only behavior remain. Marine contour is3.75px at1080p; elites add a restrained bronze contour. Interior ink uses four region samples, replacing the old actor normal/depth kernel. No additional render target/pass or per-owner shader define. The marine's existing friendly-effect priority ellipse expands to its full body width.

Three standard critique rounds precede propagation. Round1 rejected round shoulder blobs; round2 selected angular shield planes and a stronger high Spitter organ; round3 raised the shields and quieted physical lamps, accepting marine/Brute/Spitter across bright, dark and warm floors. Native four-frame crops and exact480×270 frames live under /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-standard. The original debug zoom reset itself; the first close-labelled attempts are retained but superseded by explicit1.65× fixture view-height captures. Full decisions: /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/docs/nextgen/plans/G5.md.

Propagation adds low Crawler shell, narrowed/low Stalker body with paired long blades, single large rear Carrier egg, dorsal elite crest and three-prong champion crown. A first black-sheet review rejected weak Carrier/Stalker changes and drove the wider rear egg/blades. All walking/rank/Queen footprint assertions remain. Tall anatomy is included in health-bar and priority height. Spitter swelling follows native remaining windup.

Queen armor is two large split shell halves, retaining the existing rigid hinge math. One simple weak point rises.30×rig height and expands1.5× vertically/1.2× horizontally. Its normal correction follows the same deformation as the geometry attachment. Exposed silhouette/value survives the presentation-only frozen/burning stress fixture. Native phases and hitboxes remain unchanged.

Corpses retain major anatomy in the same resident geometry and dissolve with their owner. Hidden rank pieces do not become support points. Flat frost/burn/acid treatments preserve regional values; existing shock presentation remains on the unchanged native event path. Title cast shares the partition and bands, with shoulder orientation adapted for the frontal title view. Source finish consolidation preserves posed vertices/anchors/skeleton ownership and reduces Marine skin4→1, Brute2→1 and Spitter2→1; this funds corpse anatomy without reducing High10/Low6 retention. Brute/Stalker rigid anatomy joins their presentation torso proxies; Carrier retains its original trunk proxy after the enlarged proxy violated the unchanged joint-error test.

## Evidence

Canonical final gallery: /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/index.html. Final masks: /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/review/g5-silhouettes-containment-annulus-04-silhouette-sheet-native.png and /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/review/g5-silhouettes-containment-annulus-04-silhouette-sheet480.png. Masks derive from actual visible geometry-owner bytes, retain native combat scale, and do not threshold colors. Two ordinary examples plus actual elite/Warden/Matron are labeled.

Queen phase sheet: /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/review/queen-phases-native.png; 480 sheet: /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/review/queen-phases480.png. Source phase clocks/crop rectangles are retained beside them. Four-frame native transition sheets: /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/review/queen-opening-native-sprite.png and /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/review/queen-closing-native-sprite.png.

| Review | Before (absolute path) | After (absolute path) |
|---|---|---|
| Crawler, four native frames | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-before-propagation/review/native-g5-silhouettes-containment-annulus-crawler-1.png | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/review/native-g5-silhouettes-containment-annulus-crawler-1.png |
| Spitter, four native frames | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-before-propagation/review/native-g5-silhouettes-containment-annulus-spitter-2.png | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/review/native-g5-silhouettes-containment-annulus-spitter-2.png |
| Brute, four native frames | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-before-propagation/review/native-g5-silhouettes-containment-annulus-brute-3.png | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/review/native-g5-silhouettes-containment-annulus-brute-3.png |
| Carrier, four native frames | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-before-propagation/review/native-g5-silhouettes-containment-annulus-carrier-4.png | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/review/native-g5-silhouettes-containment-annulus-carrier-4.png |
| Stalker, four native frames | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-before-propagation/review/native-g5-silhouettes-containment-annulus-stalker-5.png | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/review/native-g5-silhouettes-containment-annulus-stalker-5.png |
| Marine / bright crowd | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-before-propagation/combat-kiting-awakening-bay-04.png | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/combat-kiting-awakening-bay-04.png |
| Marine / dark crowd | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-before-propagation/combat-kiting-infested-workshop-04.png | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/combat-kiting-infested-workshop-04.png |
| Marine / warm crowd | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-before-propagation/combat-kiting-overload-floor-04.png | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/combat-kiting-overload-floor-04.png |
| Queen armored | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-before-propagation/boss-reactor-vault-01.png | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/boss-reactor-vault-01.png |
| Queen opening | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-before-propagation/x2-queen-opening-high-reactor-vault-04.png | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/x2-queen-opening-high-reactor-vault-04.png |
| Queen exposed | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-before-propagation/g2-queen-exposed-reactor-vault-04.png | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/g2-queen-exposed-reactor-vault-04.png |
| Queen closing | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-before-propagation/x2-queen-closing-high-reactor-vault-04.png | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/x2-queen-closing-high-reactor-vault-04.png |
| Title cast | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-before-propagation/title.png | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/title.png |
| Status crowd | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-before-propagation/status-vfx-communal-atrium-04.png | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/status-vfx-communal-atrium-04.png |
| Thirteen deaths / ten retained corpses | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-before-propagation/i8-corpse-budget.png | /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/i8-corpse-budget.png |

Body-only proof (ground ring/direction hidden only in the fixture): /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/g5-body-only-awakening-bay-04.png, /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/g5-body-only-infested-workshop-04.png, /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/g5-body-only-overload-floor-04.png. Native crowd motion crops: /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/review/motion-combat-kiting-awakening-bay.png, /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/review/motion-combat-kiting-infested-workshop.png, /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-accepted-final/review/motion-combat-kiting-overload-floor.png.

Before production bytes are frozen at /Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-standard/before-dist (84c0c66). Standard and first propagation captures retain their original manifests; their capture-checkout SHA predates uncommitted art changes, and source-identity receipts explicitly record that. The primary16-trial/42-room matrix and desktop gates use03cabc4; final8fd8bd0 changes only max(family, rank) visual clearance, with complete final-source unit/build, isolated timing repeats and recapture receipts. Asset hashes and source identities remain separate. These are staged recognition/status proofs, not organic balance or hardware-performance certificates.

## Verification and budgets

All browsers launched by this stream were serialized against one another. Primary receipts: `artifacts/nextgen/g5-standard/gates/acceptance.json`; final-clearance receipts: `artifacts/nextgen/g5-standard/final-clearance/acceptance.json`. The primary matrix uses03cabc4; the final build/unit/capture cohort uses8fd8bd0. The final source differs only in visual family/rank clearance plus tests/harness.

```text
npm ci: passed, 61 packages
VITEST_MAX_WORKERS=2 npx vitest run --exclude scripts/cryo-model-preview.test.mjs:
  Test Files 286 passed | 1 skipped (287)
  Tests 3278 passed | 1 skipped (3279)
node --test scripts/cryo-model-preview.test.mjs: 2 passed
npm run build: passed (TypeScript + Vite)
npm run test:room-evidence: 28 passed; ragdoll evidence 33 checks passed
npm run test:smoke: passed (desktop native input, checkpoint feedback, resizing/recovery/restart)
npm run test:authored-smoke:all -- --rooms=<all twenty story rooms>: 20/20 passed
npm run bench: primary16 + final-clearance6 trials passed resource/error gates, zero combat compiles
npm run bench:rooms: 42/42 passed, errors[]/failures[], zero post-ready/combat compiles
npm run capture: final77 native frames passed, errors[]/failures[]
npm run verify: exits1 at the documented missing Blender executable; later Python stages not run
```

No Blender installation, asset change or weakened asset assertion was used to bypass that missing prerequisite. Initial failed presentation pins and the real Carrier proxy failure are retained in `artifacts/nextgen/g5-standard/logs/verify-first-failed.log`, followed by passing unchanged physics assertions and final complete unit suite.

| Metric | Before | Primary after | Limit |
|---|---:|---:|---:|
| Peak combat draws | 324 | 297 | 330 |
| Combat program inventory | 234 | 234 | 400 |
| Room program inventory | 200 | 200 | 400 |
| Material profiles | 65 | 65 | 160 |
| Preparation compile passes | 11 | 11 | 12 |
| Combat/post-ready shader creations | 0 | 0 | 0 |
| Worst room entry, ms | 976.6 | 1335.9 | 3000 |
| Worst recorded cold preparation, ms | 2503.6 | 1292.9 | 3000 |
| High frame p50 range, ms | 16.7–17.9 | 16.7 | 16.7 |
| High frame p95 range, ms | 18.0–49.7 | 17.9–23.6 | 20 |
| CPU p95 range, ms | 7.0–14.5 | 6.1–13.4 | 8 aspiration |

![Resource budget comparison](/Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-standard/budget-comparison.png)

Each combat matrix has16 native20-second trials: two matched rooms × four rigs × High/Low, repeat1. The primary after High tail misses are Swarm Junction Cryo23.3ms and Pyro23.6ms. Peak draws improve and resource inventories do not regress; room-entry maxima vary and are explicitly retained. This is not a claim of lower CPU p95 in every case or a causal timing speedup. Host load1m on10 logical cores spans59.2–140.5 before and78.0–240.6 after; room audits span115.3–122.6 before and63.1–76.1 after. Adaptive scale minimum remains.80. Raw per-case frame/CPU/draw/load values and resource chart are in [budget-comparison.json](/Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-standard/budget-comparison.json) and [budget-comparison.png](/Users/chernodub/.t3/worktrees/containment-game/t3-437c442c/artifacts/nextgen/g5-standard/budget-comparison.png).

Final-clearance Cryo/Pyro repeat3 adds six trials: all High medians16.7ms, p95s Cryo24.5/18.2/18.2 and Pyro18.0/18.1/18.2ms, peak218draws, zero compiles. Process inspection proved a concurrent external benchmark browser during this cohort, so it cannot certify exclusive-host hardware timing. These receipts remain separate and are not substituted for primary values.

Final-source clean-window recheck: **both cases pass**. Cryo frame p50/p95 **16.7/17.9ms**, Pyro **16.7/18.0ms**, draws206/216 and zero combat shader creations. Resource/error gates pass. The wrapper checked for no external automated browser before launch and sampled ownership every5seconds throughout:11 observations, all browser mains belonged to this run. Receipt: `artifacts/nextgen/g5-standard/exclusive-final/ownership.json`; raw trials: `artifacts/nextgen/g5-exclusive-final/benchmark.json`. Host load fell26.6→19.6 on10 logical cores; CPU p95 remains10.4/12.2ms. This validates the two tail-miss cases in a browser-exclusive window, not a complete quiet-machine matrix or the8ms CPU aspiration. Contested primary/repeat timings remain visible above.

## Presentation contracts updated

- ActorSkinBatching + PerformanceRegression: shipping Marine skin/material count4→1; exact pose, shared geometry and independent skeleton/material assertions remain. Standalone legacy22→4 batching test stays unchanged.
- PlayerBeacon: exact shipping pose/normal/geometry comparison now borrows one consolidated skin; explicit four-skin fixtures retain every visibility, transform, bind, geometry-change fallback and exactly-once disposal assertion.
- ActorGeometryMaterial + ActorHotPaths + ActorFootprint: old all-dead-fragment/empty-attachment pins become resident visible corpse anatomy, weak-point retirement, hidden-rank bounds, dissolve/reset and GPU ownership guarantees. Existing floor contact/skin/joint tests remain unchanged.
- X2Actors: rounded-normal-count pin becomes bounded bevelled shield normals plus closed thickness/triangle budget; old small embedded Queen/edge-glow pins become bounded two-half shell, one nested core, rising-organ motion, normal deformation and exposure-only weak point.
- NextgenVfx: stochastic frost-patch literal becomes flat frost glaze; rim/hit/dissolve uniform composition and reset remain.
- assets.lifecycle: ownership assertions target the actual post-region prepared shared geometry; source images/material independence and retirement/disposal guarantees remain.
- Added actual region partition/clone, source finish/pose/anchor, family/rank, Queen deformation/footprint and status/title tests. No gameplay, persistence, navigation, input, accessibility, safety or authored-room assertion was removed or weakened.

## Shared hooks and remaining limits

Shared hooks: assets.ts authors regions before source-finish batching; GeometryBuffer/ActorGeometryMaterial encode region in A, Ink/DepthGTAO and the two G3 fixture readers decode class; DepthRenderer only changes the marine priority radius; models.ts reports visual height and synchronizes presentation status/dissolve. Existing DOM hooks and window.__containmentPerformance remain unchanged. Capture data extends window.__containmentDebug; no new application global. No integration request outside assigned ownership.

This is a clearer designed graphic standard, not bespoke hero sculpture. Original creature skin contours and thin legs remain; the smallest Stalker/Crawler profiles require more attention at480 than the large families, and status crowds still contain many numbers/boundaries. The Queen's large simple core is deliberately graphic and can read as an emblem; opening/closing samples establish sampled continuity, not perfect temporal stability. Title armor remains procedural; added anatomy uses the existing body shadowing rather than extra shadow draws. No human manual play was performed under the no-computer-use constraint; native mouse/keyboard gates provide input coverage. The two clean-window High rechecks meet the requested frame targets, while a complete quiet-host matrix and the8ms CPU aspiration remain unproven. Earlier contested timing misses are retained.
