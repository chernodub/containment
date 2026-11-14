# V7 — persistent ability states and graphic effects

Branch: `t3/upgrade-ability-vfx`. Runtime HEAD: `645fdc0a7cbe350d53de990f94bd1ad1195de66d`; the delivery/report commit is identified in the final handoff. Baseline: `cbebef01e118a6c5878b3ec06fd03774eb92a3ef`.

The main before/final image matrix uses frozen baseline and `b426ec1e5b5522ba19dc7c5dd09564141e9ae7a8` builds. The subsequent runtime commit only adds weather disposal and rejects the render-free campaign proxy as a scene root; it changes no active rendering values. Hardware benchmarks, repeated gates and supplemental Whiteout/recovery captures use the corrected frozen `shipping-dist` at 645fdc0. The original frozen image build remains immutable and identified, rather than being silently restamped.

## Delivered behavior

- **Whiteout:** two fixed prewarmed surfaces form a connected rotating snow wall and spreading broken floor frost. Directional snow, a leading crest, fast freeze fronts and bounded interior currents leave a calm eye. Ground/vertical skirts frost nearby authored blocker and occupied-void edges without changing prop materials or colliders. Low uses cheaper coarse grains and fewer supplemental streams. This is graphic sheet weather, not volumetric fog or a universal prop-material coating.
- **Meltdown:** two animated shoulder anchors emit shaped jets and a rear flame mantle; hot armor seams remain attached. Burning prints, a bounded ember stream, repeated small heat wake, activation burst, native kill bursts and pooled cold vent steam/embers mark the lifetime. Detached flame coverage yields to hostile priority; attached small seams remain readable. Low omits heat distortion and reduces flame/ember counts. At 480 it remains the most modest of the sustained ultimate silhouettes; I do not score it as finished cinematic inferno work.
- **Overclock:** two crisp delayed native skinned poses (one on Low), with exact live bone/bind transforms and borrowed source geometry. A bounded fallback supports standalone fixtures. Authoritative `shotsFired` changes create delayed displaced muzzle/tracer echoes, including shots whose real projectile has retired. Existing hostile slow/smear and projectile heads remain. Start ripple, subtle violet edges and a≤250ms end snap distinguish entry/exit. Native deformed-vertex tests agree within 1e-6 m; pose textures are allocated/exposed for preparation before combat.
- **Railbreaker:** a75ms thick white-hot core inside native width, five unequal line shock rings (three Low), wall contacts/sparks and cool dark trench. It is the strongest sampled single-frame ability impact in this sixteen-ability review; this is an art judgment, not an exhaustive intensity proof over every possible game effect.
- **One combustion language:** shared weapon/boon/grenade/rocket explosion and ability fire/status paths use four broad hot-core/body/dark-edge values; smoke uses three. Mip-biased sampling suppresses source micrograin before banding. No PNG/source hash, third-party license or runtime dependency changed. Nest/Queen native payloads contain no fire and remain neutral blasts; no invented orange explosion is added. Ice/lightning keep their established faceting/branching and graphic high-value accents. Particles remain outside the ink pass.
- **Industrial impacts:** Seismic Slam/Ram eject thin manufactured steel/deck plates and sparks, use cool industrial dust/scars and pressure fronts, replacing tan stone masses.
- **Placement:** actual native support footprints for Glacier, Napalm Charge, Tesla Pylon and Bulwark follow the cursor/native facing while a charge is stored. Friendly element-colored dashes become a warm interrupted blocked mark. A denied physical F press holds that footprint and a reason near the cursor for about one second; the HUD slot retains `REPOSITION`/charge availability. Native range clamps remain authoritative, so this implementation does not invent an `Out of range` rejection for accepted clamped casts. Machinery explanations are read-only geometry diagnostics; other blocks say `Need clear ground`.

## Placement-preview integration

`src/render/abilities/PlacementPreview.ts` exports:

```ts
type PlacementPreviewState = {
  ability: 'glacier' | 'napalm-charge' | 'tesla-pylon' | 'bulwark';
  x: number; y: number; angle: number; valid: boolean; reason?: string;
  points?: readonly { x: number; y: number; valid: boolean; radius?: number }[];
  pointCount?: number;
};
setPlacementPreview(value: PlacementPreviewState | null): void;
```

Coordinates are simulation units. `AbilityVisuals` owns one prepared three-instance mesh. `LazyAbilityVisuals` retains pending state and exposes its stable callback on `scene.userData.setPlacementPreview`, removing only its own callback on disposal. `gameAdapter.setPlacementPreview` feature-detects a direct renderer method first, then that bridge, then the legacy denial hook. Only `src/ui/gameAdapter.ts` and `src/ui/hud/Hud.ts` change in UI; no renderer orchestration, actors, world, lighting, camera or `src/game/**` edits. Read-only native range/orientation/twin/triplet rules and native torso pointer picking keep the preview aligned with the next public gameplay action. Clear/menu/death/pause/rig/dispose contracts retire it.

## Evidence

All paths below are absolute. Main matrices each pass280 native frames/40 sheets, with identical seven simulation clocks, native and exact480×270 PNG hashes checked. They contain all sixteen abilities and four full kits in containment-annulus and infested-workshop. Fixed-step captures are art evidence, never FPS evidence.

- [All40 before/final native/480 sheet pairs](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7/evidence.md) and [phase/hash receipts](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7/evidence.json).
- [Before gallery](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-before-retry/review/index.html), [final gallery](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-final/review/index.html).

| Ultimate / room | Before480 sheet | Final480 sheet |
|---|---|---|
| whiteout / containment-annulus | [before](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-before-retry/review/v2-whiteout-containment-annulus-containment-annulus-sheet.png) | [final](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-final/review/v2-whiteout-containment-annulus-containment-annulus-sheet.png) |
| whiteout / infested-workshop | [before](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-before-retry/review/v2-whiteout-infested-workshop-infested-workshop-sheet.png) | [final](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-final/review/v2-whiteout-infested-workshop-infested-workshop-sheet.png) |
| meltdown / containment-annulus | [before](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-before-retry/review/v2-meltdown-containment-annulus-containment-annulus-sheet.png) | [final](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-final/review/v2-meltdown-containment-annulus-containment-annulus-sheet.png) |
| meltdown / infested-workshop | [before](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-before-retry/review/v2-meltdown-infested-workshop-infested-workshop-sheet.png) | [final](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-final/review/v2-meltdown-infested-workshop-infested-workshop-sheet.png) |
| overclock / containment-annulus | [before](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-before-retry/review/v2-overclock-containment-annulus-containment-annulus-sheet.png) | [final](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-final/review/v2-overclock-containment-annulus-containment-annulus-sheet.png) |
| overclock / infested-workshop | [before](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-before-retry/review/v2-overclock-infested-workshop-infested-workshop-sheet.png) | [final](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-final/review/v2-overclock-infested-workshop-infested-workshop-sheet.png) |
| railbreaker / containment-annulus | [before](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-before-retry/review/v2-railbreaker-containment-annulus-containment-annulus-sheet.png) | [final](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-final/review/v2-railbreaker-containment-annulus-containment-annulus-sheet.png) |
| railbreaker / infested-workshop | [before](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-before-retry/review/v2-railbreaker-infested-workshop-infested-workshop-sheet.png) | [final](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-final/review/v2-railbreaker-infested-workshop-infested-workshop-sheet.png) |

- [High/Low sustained open-state, five explosion origins, hostile priority and graphics-recovery gallery](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-final-states/review/index.html).
- [Eight actual cursor/F-key valid/blocked placement cases](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-placement-final/review/index.html).
- [Matched baseline shared-explosion material gallery](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-before-explosion-fire-body/review/index.html).
- [Corrected-runtime Whiteout and graphics-recovery gallery](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-final-lifecycle/review/index.html).
- [Critique round1 contact](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7/critique-round1/contact.png); its contact-sources.json records source phase/hash.
- [Critique round2 contact](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7/critique-round2/contact.png); its contact-sources.json records source phase/hash.
- [Critique round3 contact](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7/critique-round3/contact.png); its contact-sources.json records source phase/hash.

Root actually opened all sixteen selected final seven-phase480 sheets (Breacher/Pyro bright; Cryo/Arc dark), the corresponding selected baseline sheets, final native Whiteout/dark03, Meltdown/dark03, Overclock/bright03 and Railbreaker/bright01, the four bright full-kit480 sheets, four selected valid/blocked placement sheets, and the final grenade/Queen480 material sheets. Three actual PNG critique→fix rounds and the selected native witnesses are described in `plans/V7.md`. This is not a claim that every saved native phase was independently opened.

Intermediate successful rounds' PNGs were removed after review per instruction; each round retains its manifest and a PNG-CLEANUP.json hash inventory, with one contact in the critique folder. Failed raw captures are untouched. Initial sandbox binding failure and failed placement/explosion framing runs remain explicitly failed. The early explosion review put the effect near the frame edge and was rejected as an art witness. New strict full-Queen-pulse plus worst-case smoke-envelope framing was infeasible in the native close camera and still rejects; its guard/tests remain. Those newly added infeasible probes require explicit scenario selection (`diagnosticOnly`), so the default `all` capture is not made deliberately failing; no pre-existing scenario is excluded. Separate `v7-material-explosion-*` captures certify the complete fire card over 0–600 ms, retain full240-unit Queen pulse/conservative smoke bounds as clipping diagnostics, and preserve payload/radius/camera/body/HUD/phase/priority/GL/program guards. Saved material receipts define certification through `framing.scope`, `pulseInside`, `smokeInside` and their bounds; an inherited free-text `note` still used full-envelope wording in those earlier receipts. The generator now corrects that note; no raw receipt was edited. Native grenade combat remains covered by the ordinary combat fixture. These are explicit presentation-only payload replays, not simulated originating kills/actions.

## Shared-explosion material sheets

| Origin | Before480 | Final480 |
|---|---|---|
| weapon | [before](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-before-explosion-fire-body/review/v7-material-explosion-weapon-containment-annulus-sheet.png) | [final](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-final-states/review/v7-material-explosion-weapon-containment-annulus-sheet.png) |
| grenade | [before](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-before-explosion-fire-body/review/v7-material-explosion-grenade-containment-annulus-sheet.png) | [final](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-final-states/review/v7-material-explosion-grenade-containment-annulus-sheet.png) |
| rocket | [before](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-before-explosion-fire-body/review/v7-material-explosion-rocket-containment-annulus-sheet.png) | [final](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-final-states/review/v7-material-explosion-rocket-containment-annulus-sheet.png) |
| nest | [before](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-before-explosion-fire-body/review/v7-material-explosion-nest-containment-annulus-sheet.png) | [final](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-final-states/review/v7-material-explosion-nest-containment-annulus-sheet.png) |
| queen | [before](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-before-explosion-fire-body/review/v7-material-explosion-queen-containment-annulus-sheet.png) | [final](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-final-states/review/v7-material-explosion-queen-containment-annulus-sheet.png) |

## Presentation pins rewritten

- `CryoPresentation.test.ts`:20/10 mist stamps and their billboard overlap/size pins become zero mist stamps, bounded8/4 snow streams, connected weather geometry/lifetime/prewarm tests and bounded ground/vertical authored-edge frost. Calm eye, exact native radius, pause, Low and support-area guarantees remain.
- `ArcPresentation.test.ts`: old≤1.4m echo displacement becomes≤2.3m with≥1.25m pair separation; colors/opacity/priority/native target/pause/reset guarantees remain. Native skin resource/vertex tests replace the intermediate26-proxy-instance presentation pin. Every authoritative shot and≤250ms reverse snap gain coverage.
- `breacher.test.ts`: tan crack/trench colors, stone shard shape and three High Rail rings become cool steel scars, thin manufactured plate dimensions/colors and five High rings. Native radii/endpoints, fragment containment, camera response, Low counts and hot-core width stay asserted.
- `PyroPresentation.test.ts`:3/6 flames become5/8, with native shoulder attachment and bounded jets; detached volumes now yield after the impact beat while small hot armor signals retain attachment priority. The old exact shimmer-wake constants become the new smaller repeated mantle settings; pause/expiry remain.
- `AbilityBudgets.test.ts`: separately accounts for exactly three fixed new weather/preview surfaces. Old owner caps111meshes/17geometries/23materials remain independently asserted; total114/20/26. Original combat draw cap remains. Real native echo meshes are independently owned/tested and measured in the browser benchmark.
- `AbilityFireMaterials.test.ts`, `ExplosionEffects.test.ts`, `StatusBatches.test.ts`: direct photographic RGB/unmipped/direct-alpha string pins become shared ramp, mipmapped filtering and source-alpha-derived coverage checks. sRGB/linear handling, atlas insets, non-inked particles, retirement and disposal remain.
- `HudSystems.test.ts`: slot text `Need clear ground` becomes `REPOSITION`; a new cursor-label/held-footprint test asserts native denial, no gameplay mutation, one-second retirement and lifecycle clearing. The 32-frame native placement campaign verifies trusted F, blocked denial receipts, stored charges and no ability use.

The final capture-only diagnostic-selection contract passes 7/7 tests; a registry check confirms only the five newly added full-envelope probes are excluded from default `all`, with every pre-existing scenario retained. No gameplay/determinism/safety/navigation/accessibility/desktop framing assertion was removed. The full-suite disposal failure was fixed in production ownership, not by weakening its assertion. The render-free campaign's proxy compatibility was fixed in the presentation constructor, leaving its simulation tests unchanged.

## Validation

Required runs (complete raw logs: [/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7/logs](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7/logs)):

```text
npm ci: passed (84 packages installed).
VITEST_MAX_WORKERS=2 npx vitest run --exclude scripts/cryo-model-preview.test.mjs
 Test Files  338 passed | 2 skipped (340)
      Tests  3827 passed | 2 skipped (3829)
node --test scripts/cryo-model-preview.test.mjs
 tests 2; pass 2; fail 0
npm run build
 ✓ built in 574ms (tsc --noEmit and production Vite build)
npm run test:room-evidence
 tests 28; pass 28; fail 0
 {"passed":true,"cpuOnly":true,"checks":33}
npm run test:smoke
 Browser smoke passed: desktop, production Pages subpath, assets, fire, weapon switch, pause/resume, credits.
npm run test:authored-smoke:all
 Authored desktop smoke passed: 20 rooms, native move/fire, Continue/route, pause/resume, Low quality, no browser errors.
npm run playtest:smoke
 smoke: room-limit; 3 rooms cleared; 0 errors
npm run bench
 32 ordinary trials + 2 isolated Pyro trials per build; zero runtime errors/combat shader creations.
```

The exact requested two-worker JavaScript command above passes independently in 258.05 s (`vitest-workers2.log`). The final `npm run verify` also passes the same entire JavaScript suite with one worker (`verify-final.log`). Initial full-suite 9 failures remain in verify.log: six were the render-free proxy incompatibility, one was the real weather-disposal bug, and two were superseded sampling pins. The production fixes and equivalent presentation checks pass 46 tests in isolation and then the entire suite. Desktop build/evidence/smoke/all 20 authored gates were repeated after that correction.

`npm run verify` was executed twice. The final invocation passes all JavaScript, the native model preview and the first three Python artifact contracts, then fails the monitor Blender subprocess with `FileNotFoundError: [Errno 2] No such file or directory: 'blender'`. Engineering §Repository facts explicitly says Blender is absent and must not be installed. No asset/test was weakened or altered to bypass it. The subsequent unaffected Python gates were run separately: materials 2/2, material-budget 4/4 and bundle-runtime 6/6 pass (including actual GLTFLoader CPU loading and 12 PNG decodes). Service-finish also stops at its unchanged Blender subprocess; its artifact check passes and geometry subprocess errors once. This is a real prerequisite failure, so full verify is not claimed green.

Captures: final core280/40; final supplemental162 frames; final native placement32; corrected-runtime Whiteout/recovery22. All successful manifests have empty errors/failures and original native actor/action/phase/priority checks. Corrected-runtime recovery validates stable resources across repeated room/tier changes and an actual context loss/restoration. Native placement asserts trusted F, unchanged stored charges/uses and actual denial receipts. No computer-use/desktop-control tool was used; game art review used saved PNGs only.

## Measured performance

The ordinary benchmark uses the same two ranked rooms (Relay Racks/Crew Checkpoint), all four rigs, High/Low,20 seconds/trial, two repeats per case. The one remaining Relay/Pyro scale miss was rerun in isolated before/after batches, two further ordinary trials each; this case therefore has N=4, the others N=2. Browsers, captures and tests were serialized. Host: ANGLE Metal / Apple M1 Pro,10 logical CPUs. No GPU flush, disabled soft depth, staged screenshot timings or invasive profiling is used for acceptance.

**Final best-of-N:16/16 cases have a jointly passing trial**, with High selected frame p95≤18.1ms, minimum selected High median scale0.925, peak draws across all 34 final trials290≤330, and zero combat shader creations. Selection first requires frame/scale/draw/compile conditions together, then minimizes rounded frame p95; scale/CPU/load always come from that same trial. Lower-resolution faster trials are not preferred over jointly passing ones. All selected frame p50s are16.7ms.

This is not34/34 timing acceptance: the original final matrix retains four missed trials—Relay/Pyro High scale.850/.875; Crew/Cryo High p9532.0ms; Crew/Pyro High p9525.8ms and scale.825. The isolated final Pyro trials pass17.9/18.0ms with scale.925/.950 at load16.00/13.70. Baseline retains six missed trials. Total one-minute load ranges are13.60–61.39 before and12.98–29.82 after. Lower final host load and native fight variation prevent a causal performance-improvement claim.

- [Full paired table, passing counts and every raw miss](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7/performance.md), [machine-readable review](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7/performance.json), [chart](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7/performance.html), [SVG](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7/performance.svg).
- Raw immutable matrices: [before](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-before-native/benchmark.json), [final](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-final-native/benchmark.json).
- Matched isolated Relay/Pyro repeats: [before](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-before-pyro-isolated/benchmark.json), [final](/Users/chernodub/.t3/worktrees/containment-game/t3-bd303196/artifacts/nextgen/v7-final-pyro-isolated/benchmark.json).

Original High half-size demanded detached depth snapshots and Low's zero-allocation path remain; no new postprocessing pass or shader variant is added. Two weather surfaces and one footprint are prepared up front; two native echo skins borrow geometry and own their skeleton textures/material. All 34 final resource/GL/compile guards pass. These measured ranked-room results do not certify every room or host-load condition.

## Honest ability ranking

Subjective spectacle/readability judgment from the saved native/480 evidence, not a fresh independent director score. Lower-rank support/dash abilities are intentionally quieter than ultimates; this ranks their present visual result, not gameplay power.

| Rank | Ability | Score /10 | Judgment |
|---:|---|---:|---|
|1|Railbreaker|8.5|Strongest sampled single-frame impact; unmistakable white line and trench.|
|2|Overclock|8.1|Distinct real marine poses and firing echoes; white ghosts could retain more violet separation.|
|3|Flashfire|8.0|Clear shaped cone and coherent new flame values.|
|4|Whiteout|7.8|Connected streaming weather and calm eye; wall is still visibly a graphic sheet.|
|5|Glacier|7.7|Clear upright faceted blockade and honest cursor strip.|
|6|Overload|7.6|Strong connected branching strike; thin residual energy is quieter.|
|7|Cryo Nova|7.5|Readable expanding icy pressure front and brittle aftermath.|
|8|Tesla Pylon|7.4|Grounded coil silhouette and links; small at 480.|
|9|Seismic Slam|7.2|Manufactured chips/pressure read better on steel; impact remains compact.|
|10|Meltdown|7.0|Persistent heated suit/vent/ember state; still less infernal than the requested ideal at 480.|
|11|Afterburn|6.9|Useful hot wake, restrained dash silhouette.|
|12|Static Step|6.8|Clean arrival/link, less dramatic than its tactical counterpart.|
|13|Napalm Charge|6.7|Consistent fire body and exact area, still boundary-led.|
|14|Bulwark|6.5|Legible narrow structure/preview; subdued material spectacle.|
|15|Frost Trail|6.4|Grounded readable icy residue, little large-scale motion.|
|16|Ram|6.3|Industrial arrival improves the hit; dash trail remains slight.|

The remaining artistic weakness is Meltdown's compact sustained silhouette. Whiteout uses bounded sheet weather and local frost skirts rather than general prop-material frosting; electrical effects retain angular shapes rather than forcing fire/ice to the same geometry. The Queen full-envelope art capture is an explicitly retained framing limitation. Timing acceptance is qualified by the raw shared-host benchmark results above. No changes were pushed and no PR was opened.
