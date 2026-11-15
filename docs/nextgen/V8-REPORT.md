# V8 — ability shape and combat grammar

Branch: `t3/vfx-wave8-ability-polish`. Baseline: `7ceefa5a52cc74a6b95712f29653d9bf523906be`.
Frozen runtime: `92bbf3bc9ef10056b72dc925fbda66133bab42e4`. Delivery HEAD is recorded in the final handoff.
Work is confined to this worktree. No push, PR, computer-use, gameplay, world, actor, camera or asset-license changes.
The HUD change consists of two statements at the existing placement-preview call sites.

## Delivered changes

- **F3 / fire:** a committed analytic three-profile family replaces photographic-alpha flame islands.
  Flashfire overlaps a narrow bright nozzle, connected unequal mid-cone lobes, narrower downstream
  fragments and restrained smoke/scorch/light. Cavities and rolling folds preserve the spine.
  High/Low cone cards fall20/9→16/7. Afterburn, Napalm edge fire, Meltdown and live enemy burn
  presentation use the same family. Retained explosion flipbooks and atlas manifests are unchanged.
  Native status ownership suppresses duplicate legacy sprites; a new High/Low test proves that route.
- **Meltdown:** short unequal outboard shoulder curls, visible hot vents/seams, small moving embers
  and a darker charred foot wake. Long parallel helmet horns were rejected in review. Helmet and
  weapon remain readable. This remains a restrained suit-scale ultimate rather than a cinematic inferno.
- **F7 / Overclock:** one subdued violet native marine ghost on both tiers, one quiet delayed shot
  echo, no scan rectangles. Short contiguous round contours follow actual marine, enemy and projectile
  velocity; width/alpha decrease along the wake. Stationary targets emit no motion contour. Native
  pose accuracy, start ripple,≤250ms reverse end snap and hostile projectile-head priority remain.
- **F8 / Whiteout:** broken directional perimeter gust packets replace the blanket cylinder body.
  Irregular age progression grows separate crystalline stem/twig deposits over steel; secondary twig
  count varies and Low is simpler. Freeze pulses use crystalline tips and brief native frozen-foot
  facets. The center stays transparent and the native friendly boundary stays thin. Nearby authored
  blocker/occupied-void bases retain bounded frost skirts; this is not universal prop-material coating.
- **F6 / placement:** static thin idle footprints use maximum alpha.12, held-F aim.50 and denied.72.
  Valid/blocked states keep the rig's friendly color, with small upright check/cross glyphs. Pointer
  presence alone does not activate strong emphasis. The real blocked F receipt still holds its exact
  footprint/reason for about one second without consuming a stored charge or inventing placement rules.
- **Seismic Slam:** six short-lived hinged deck sectors (three Low), dark fissures, cut edges and
  radially traveling clipped steel fragments anchor the impact. Physical fragments use cool steel;
  amber is limited to light/sparks. Explicit metal variants cannot enter the Cryo color heuristic.

No new GPU owner, dynamic material variant, runtime dependency or third-party asset was added.
All effects use the existing pools, readiness/material preparation, local priority mask and tier paths.
Glacier, Bulwark, Railbreaker and hostile warning syntax retain their existing implementations.

## Review method and qualifications

The unchanged V2 matrix covers all sixteen seven-phase abilities and four full kits in bright
Containment Annulus and dark Infested Workshop. Native1920×1080 sources and exact480×270 reductions
are separate artifacts. Fixed-step PNGs are art evidence, never hardware FPS evidence.
Three actual PNG critique→fix rounds are documented in [the ledger](plans/V8.md); each retains a
contact and source hashes. Intermediate successful round PNGs are removed after final pairing.
Failed raw runs remain, including sandbox server failures and the caught third-round GLSL name collision.

## Presentation pins replaced

- `PlacementPreview.test.ts`: the old invalid-cross/warm-color pin becomes a check/cross, upright
  fixed-size symbol and same-friendly-color idle/aim/denied contract; native footprint dimensions,
  augment positions, hidden clearing, storage reuse and exact-once disposal remain.
- `HudSystems.test.ts`: adds native F-down/up intent checks to the existing denied-footprint test;
  retains real denial reason, stored charge, unchanged gameplay snapshot and lifecycle clearing.
- Pyro/`SpectaclePrimitives`/`AbilityFireMaterials`: explosion-stamp/20–9 card pins become connected
  analytic16–7 cards with overlapping center segments, one hot source and smaller distal fragments.
  Exact cone, muzzle switching, source sockets, pause, priority and Low checks remain.
  Meltdown's8 High flames become6 flames plus2 small embers; native heated-suit inventory/grade,
  socket attachment, wake, expiry and body clearance remain asserted.
- Arc native/fallback tests: two bright ghosts/scan cards/double shot echoes become one quiet
  ghost, zero scan cards and bounded shrinking motion contours; native skinned vertex agreement,
  private skeleton/pose textures, authoritative shot receipts, target endpoints, pause, reset,
  expiry, priority and exact-once disposal remain.
- Cryo tests: broad pulse-ring counts become native pulse cadence and crystalline foot accents;
  existing radius, calm eye, wind bounds, support skirts, Low counts, pause and lifecycle remain.
- Breacher tests: generic `debris()`/rectangular body pins become cool clipped fragments,
  six bounded plate buckles and explicit coherent outward trajectories. Bulwark/Railbreaker
  assertions remain; blue metal's exclusion from the crystal branch gains coverage.

No gameplay, determinism, persistence, navigation, accessibility, native-input, resizing,
recovery, authored-room or safety assertion was weakened. Two accidentally commented-out
Meltdown inventory/grade assertions were restored before final verification.

## Verification receipts

Logs: `/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8/logs/`.

```text
npm ci: passed;84 packages installed;lockfile unchanged.
VITEST_MAX_WORKERS=2 npx vitest run --exclude scripts/cryo-model-preview.test.mjs
 Test Files  346 passed | 2 skipped (348)
      Tests  3864 passed | 2 skipped (3866)
   Duration  309.71s
node --test scripts/cryo-model-preview.test.mjs
 tests2;pass2;fail0
npm run build
 TypeScript and production Vite build passed.
npm run test:room-evidence
 pass28;fail0
 {"passed":true,"cpuOnly":true,"checks":33}
```

`npm run verify` passed the complete two-worker JavaScript suite, native model preview
and first three Python asset stages, then stopped at unchanged monitor subprocess
`FileNotFoundError: [Errno 2] No such file or directory: 'blender'`.
The separate service-finish test retains the same missing-Blender error. Blender was
not installed, per engineering; no asset/test was altered. An isolated temporary
Pillow13 environment ran the unaffected materials2/2, material-budget4/4 and
bundle-runtime6/6 checks successfully. This aggregate gate is explicitly not green.

The JavaScript command above was executed by `npm run verify` / `npm test` using
the same local Vitest binary and the required two-worker limit.

```text
npm run test:smoke (isolated retry)
 Browser smoke passed: desktop, production Pages subpath, assets, fire, weapon switch, pause/resume, credits.
npm run test:authored-smoke:all
 Authored desktop smoke passed: 20 rooms, native move/fire, Continue/route, pause/resume, Low quality, no browser errors.
capture before/final
 280 frames /40 sheets per side; errors[];failures[]
placement before/final
 32 frames /8 sheets per side; errors[];failures[]
High/Low sustained states, hostile priority and graphics recovery
 49 frames /12 sheets; errors[];failures[]
native/480 pairing
 40 sheet pairs /280 phase pairs, plus8 placement sheet pairs /32 phase pairs: clocks and hashes verified.
```

The first smoke run failed at restart on an atlas `net::ERR_ABORTED` receipt. Its
complete log remains `desktop-smoke.log`; the unchanged isolated rerun passes in
`desktop-smoke-isolated.log`. No assertion or request filtering was changed.

Successful intermediate rounds retired336 PNGs and9 generated HTML files
(897,560,448 bytes), after hashing every file into each round's `PNG-CLEANUP.json`.
The three contacts/source hashes, original manifests, final/before matrices and
every failed raw run remain. [Actual-open receipts](../../artifacts/nextgen/v8/actual-open.json)
list the selected final seven-phase sheet for each of sixteen abilities, four
bright full-kit sheets and three round contacts; they do not claim exhaustive
native-frame review. Additional actual native and Low/placement witnesses are
named in the review ledger and this report's description.

## Honest sixteen-ability ranking

Subjective finish/readability ranking from the saved seven-phase sheets, not gameplay
power, damage, or an independent director score. Quiet dash/support effects naturally
rank below the strongest impacts.

| Rank | Ability | Judgment and remaining limit |
|---:|---|---|
|1|Railbreaker|Strong directed hot core, recoil and aftermath; preserved strength.|
|2|Glacier|Grounded crystalline mass with a clear physical job; repeated teeth remain visible.|
|3|Bulwark|Confident anchored energy wall; edge-on views remain thin.|
|4|Overload|Clear connected chain and contacts; bolt spine is visibly segmented.|
|5|Flashfire|Connected directional core replaces floating islands; graphic lobes still look stylized.|
|6|Tesla Pylon|Readable gadget/source/target connection; restrained compared with a major cast.|
|7|Seismic Slam|Deck buckling and outward steel now anchor the hit; brief rather than cinematic.|
|8|Cryo Nova|Clear cold impact and aftermath; still relies on a ring announcement.|
|9|Overclock|One live bright body and quiet motion wake; subtle at480 while stationary.|
|10|Whiteout|Open blizzard perimeter and growing frost; deposits remain graphic fern-like marks.|
|11|Napalm Charge|Canister splash, fuel edge tongues and smoke distinguish the pool; interior deliberately sparse.|
|12|Static Step|Crisp relocation/contact; short-lived and modest in a single frame.|
|13|Meltdown|Hot suit vents, small embers and char wake preserve anatomy; weakest sustained ultimate spectacle.|
|14|Frost Trail|Clear cold path and foot crystals; intentionally low-profile.|
|15|Afterburn|Coherent swept ground fuel; still too much like a low straight stroke at480.|
|16|Ram|Readable displacement/impact, but generic short ghost/ribbon language remains.|

## Before/final sheet paths

All40 native/480 sheet pairs and280 clock/hash pairs: [complete evidence index](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8/evidence.md).

| Effect /room | Before native /480 | Final native /480 |
|---|---|---|
| v2-seismic-slam-containment-annulus:containment-annulus | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/v2-seismic-slam-containment-annulus-containment-annulus-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/review/v2-seismic-slam-containment-annulus-containment-annulus-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/v2-seismic-slam-containment-annulus-containment-annulus-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/review/v2-seismic-slam-containment-annulus-containment-annulus-sheet.png) |
| v2-seismic-slam-infested-workshop:infested-workshop | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/v2-seismic-slam-infested-workshop-infested-workshop-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/review/v2-seismic-slam-infested-workshop-infested-workshop-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/v2-seismic-slam-infested-workshop-infested-workshop-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/review/v2-seismic-slam-infested-workshop-infested-workshop-sheet.png) |
| v2-whiteout-containment-annulus:containment-annulus | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/v2-whiteout-containment-annulus-containment-annulus-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/review/v2-whiteout-containment-annulus-containment-annulus-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/v2-whiteout-containment-annulus-containment-annulus-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/review/v2-whiteout-containment-annulus-containment-annulus-sheet.png) |
| v2-whiteout-infested-workshop:infested-workshop | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/v2-whiteout-infested-workshop-infested-workshop-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/review/v2-whiteout-infested-workshop-infested-workshop-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/v2-whiteout-infested-workshop-infested-workshop-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/review/v2-whiteout-infested-workshop-infested-workshop-sheet.png) |
| v2-afterburn-containment-annulus:containment-annulus | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/v2-afterburn-containment-annulus-containment-annulus-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/review/v2-afterburn-containment-annulus-containment-annulus-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/v2-afterburn-containment-annulus-containment-annulus-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/review/v2-afterburn-containment-annulus-containment-annulus-sheet.png) |
| v2-flashfire-containment-annulus:containment-annulus | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/v2-flashfire-containment-annulus-containment-annulus-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/review/v2-flashfire-containment-annulus-containment-annulus-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/v2-flashfire-containment-annulus-containment-annulus-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/review/v2-flashfire-containment-annulus-containment-annulus-sheet.png) |
| v2-napalm-charge-containment-annulus:containment-annulus | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/v2-napalm-charge-containment-annulus-containment-annulus-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/review/v2-napalm-charge-containment-annulus-containment-annulus-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/v2-napalm-charge-containment-annulus-containment-annulus-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/review/v2-napalm-charge-containment-annulus-containment-annulus-sheet.png) |
| v2-meltdown-containment-annulus:containment-annulus | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/v2-meltdown-containment-annulus-containment-annulus-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/review/v2-meltdown-containment-annulus-containment-annulus-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/v2-meltdown-containment-annulus-containment-annulus-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/review/v2-meltdown-containment-annulus-containment-annulus-sheet.png) |
| v2-afterburn-infested-workshop:infested-workshop | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/v2-afterburn-infested-workshop-infested-workshop-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/review/v2-afterburn-infested-workshop-infested-workshop-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/v2-afterburn-infested-workshop-infested-workshop-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/review/v2-afterburn-infested-workshop-infested-workshop-sheet.png) |
| v2-flashfire-infested-workshop:infested-workshop | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/v2-flashfire-infested-workshop-infested-workshop-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/review/v2-flashfire-infested-workshop-infested-workshop-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/v2-flashfire-infested-workshop-infested-workshop-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/review/v2-flashfire-infested-workshop-infested-workshop-sheet.png) |
| v2-napalm-charge-infested-workshop:infested-workshop | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/v2-napalm-charge-infested-workshop-infested-workshop-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/review/v2-napalm-charge-infested-workshop-infested-workshop-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/v2-napalm-charge-infested-workshop-infested-workshop-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/review/v2-napalm-charge-infested-workshop-infested-workshop-sheet.png) |
| v2-meltdown-infested-workshop:infested-workshop | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/v2-meltdown-infested-workshop-infested-workshop-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/review/v2-meltdown-infested-workshop-infested-workshop-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/v2-meltdown-infested-workshop-infested-workshop-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/review/v2-meltdown-infested-workshop-infested-workshop-sheet.png) |
| v2-overclock-containment-annulus:containment-annulus | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/v2-overclock-containment-annulus-containment-annulus-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/review/v2-overclock-containment-annulus-containment-annulus-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/v2-overclock-containment-annulus-containment-annulus-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/review/v2-overclock-containment-annulus-containment-annulus-sheet.png) |
| v2-overclock-infested-workshop:infested-workshop | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/v2-overclock-infested-workshop-infested-workshop-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-before/review/v2-overclock-infested-workshop-infested-workshop-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/v2-overclock-infested-workshop-infested-workshop-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/review/v2-overclock-infested-workshop-infested-workshop-sheet.png) |

Matched native cursor/F-key placement:32 frames/eight sheets per side; every native/480 phase hash and clock is paired in [placement receipts](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8/placement-evidence.json).

| Placement | Before native /480 | Final native /480 |
|---|---|---|
| v7-placement-bulwark-valid | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-before/v7-placement-bulwark-valid-awakening-bay-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-before/review/v7-placement-bulwark-valid-awakening-bay-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-final/v7-placement-bulwark-valid-awakening-bay-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-final/review/v7-placement-bulwark-valid-awakening-bay-sheet.png) |
| v7-placement-bulwark-blocked | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-before/v7-placement-bulwark-blocked-awakening-bay-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-before/review/v7-placement-bulwark-blocked-awakening-bay-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-final/v7-placement-bulwark-blocked-awakening-bay-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-final/review/v7-placement-bulwark-blocked-awakening-bay-sheet.png) |
| v7-placement-glacier-valid | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-before/v7-placement-glacier-valid-awakening-bay-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-before/review/v7-placement-glacier-valid-awakening-bay-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-final/v7-placement-glacier-valid-awakening-bay-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-final/review/v7-placement-glacier-valid-awakening-bay-sheet.png) |
| v7-placement-glacier-blocked | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-before/v7-placement-glacier-blocked-awakening-bay-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-before/review/v7-placement-glacier-blocked-awakening-bay-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-final/v7-placement-glacier-blocked-awakening-bay-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-final/review/v7-placement-glacier-blocked-awakening-bay-sheet.png) |
| v7-placement-napalm-charge-valid | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-before/v7-placement-napalm-charge-valid-awakening-bay-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-before/review/v7-placement-napalm-charge-valid-awakening-bay-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-final/v7-placement-napalm-charge-valid-awakening-bay-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-final/review/v7-placement-napalm-charge-valid-awakening-bay-sheet.png) |
| v7-placement-napalm-charge-blocked | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-before/v7-placement-napalm-charge-blocked-awakening-bay-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-before/review/v7-placement-napalm-charge-blocked-awakening-bay-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-final/v7-placement-napalm-charge-blocked-awakening-bay-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-final/review/v7-placement-napalm-charge-blocked-awakening-bay-sheet.png) |
| v7-placement-tesla-pylon-valid | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-before/v7-placement-tesla-pylon-valid-awakening-bay-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-before/review/v7-placement-tesla-pylon-valid-awakening-bay-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-final/v7-placement-tesla-pylon-valid-awakening-bay-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-final/review/v7-placement-tesla-pylon-valid-awakening-bay-sheet.png) |
| v7-placement-tesla-pylon-blocked | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-before/v7-placement-tesla-pylon-blocked-awakening-bay-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-before/review/v7-placement-tesla-pylon-blocked-awakening-bay-sheet.png) | [native](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-final/v7-placement-tesla-pylon-blocked-awakening-bay-sprite.png) /[480](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-final/review/v7-placement-tesla-pylon-blocked-awakening-bay-sheet.png) |

## Matched native benchmark

Best ordinary frame-p95 trial among jointly passing trials when available, otherwise the least p95 miss; that same trial supplies scale/CPU/load. High requires minimum adaptive scale≥.9, stronger than I11’s median check. Peak draws retain every repeat. Raw misses remain below. Shared-host load is not CPU utilization; no screenshot timing is used.

| Room /rig /tier | Best frame p95 before→after ms | Median/min scale before→after | Peak draws all repeats | Load1m for selected trial | Jointly passing trials |
|---|---:|---:|---:|---:|---:|
| relay-racks/breacher/high | 18.1→18 | 1.000/0.975→0.975/0.975 | 289→295 | 30.75→10.74 | 2/2→2/2 |
| relay-racks/cryo/high | 18.1→17.9 | 1.000/0.975→1.000/0.975 | 284→288 | 28.66→8.61 | 2/2→2/2 |
| relay-racks/pyro/high | 18→17.9 | 1.000/0.975→1.000/1.000 | 291→291 | 21.45→10.65 | 2/2→2/2 |
| relay-racks/arc/high | 17.9→18 | 0.975/0.975→1.000/0.975 | 268→271 | 22.63→10.31 | 2/2→2/2 |
| freight-hold/breacher/high | 18.3→18.7 | 1.000/0.975→0.950/0.925 | 216→220 | 13.99→12.00 | 1/2→1/2 |
| freight-hold/cryo/high | 18.1→18.1 | 1.000/0.975→0.950/0.925 | 219→213 | 11.58→10.76 | 2/2→2/2 |
| freight-hold/pyro/high | 18.2→18.3 | 1.000/0.975→1.000/0.975 | 205→218 | 10.76→10.90 | 2/2→2/2 |
| freight-hold/arc/high | 18.1→18.1 | 1.000/0.975→1.000/0.975 | 201→209 | 10.14→11.27 | 2/2→2/2 |

v8-before-native: 16 trials; load1m 10.14–32.01; peak draws 291; 1 timing/scale/draw/program trial misses.
- freight-hold-breacher-high-1: High frame p95; p95 24.6ms; median scale 0.975; load 12.86.

v8-final-native: 16 trials; load1m 8.61–12.19; peak draws 295; 1 timing/scale/draw/program trial misses.
- freight-hold-breacher-high-0: High frame p95; p95 23.6ms; median scale 1; load 12.09.


Two ordinary20-second trials per case, all four rigs on High,1920×1080 DPR1,
Relay Racks and Freight Hold (I11's selected heavy/median rooms), Apple M1 Pro10-core /
ANGLE Metal. Native25-enemy replenishment/full-kit rules and default adaptive scaling
remain. No GPU flush, disabled depth, fixed-step screenshot timing, CPU profile or
other diagnostic mode is used. Low resource behavior is tested/captured separately;
this cohort makes no Low hardware timing claim.

Both `npm run bench` commands exit0, with errors[] and budgetFailures[] under the
unchanged native collector. The stricter V8 best-of-two summary passes8/8 cases,
requiring frame p95≤20ms, **minimum** adaptive scale≥.9 (stronger than I11's median
check), peak draws≤330 and zero combat programs. Both cohorts have15/16 individually
passing trials. The Freight/Breacher tail remains:24.6ms before and23.6ms final.
The selected passing final trial is18.7ms with minimum scale.925. This is a qualified
best-of-N result, not an all-trials or every-frame60fps guarantee.

All32 frame medians are16.7ms. Raw CPU p95 ranges9.8–23.2ms before and10.0–23.5ms
final; this does **not** establish the older universal8ms CPU target. No out-of-scope
physics/raycast optimization or favorable replacement cohort hides the tail.
Host load differs, so these observations do not establish a causal performance gain.

[Raw baseline](../../artifacts/nextgen/v8-before-native/benchmark.json),
[raw final](../../artifacts/nextgen/v8-final-native/benchmark.json),
[paired analysis](../../artifacts/nextgen/v8/performance.json) and
[browser ownership](../../artifacts/nextgen/v8/v8-benchmark-ownership.json) retain every
trial, selected paired metrics and all168 OS snapshots:maximum owned browser1,
foreign automation browsers0. The production build and frozen shipping directory
match all27 JS/CSS hashes in `final-build-witness.json`.

```text
npm run bench (before):16 ordinary High trials;exit0;errors[];combat programs0.
npm run bench (final):16 ordinary High trials;exit0;errors[];combat programs0.
V8 final best-of-N acceptance: PASS;8/8 cases;all-repeat peak draws295/330.
Raw Freight/Breacher timing miss retained in each cohort;aggregate verify blocked by Blender.
```

## First native PNGs to inspect

- [Full Pyro /Annulus](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/v2-full-pyro-containment-annulus-containment-annulus-04.png)
- [Full Arc /Annulus](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/v2-full-arc-containment-annulus-containment-annulus-04.png)
- [Whiteout /Annulus](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/v2-whiteout-containment-annulus-containment-annulus-06.png)
- [Moving Meltdown /Annulus](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final-supplement/v7-state-meltdown-containment-annulus-containment-annulus-04.png)
- [Seismic Slam /Annulus](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-final/v2-seismic-slam-containment-annulus-containment-annulus-03.png)
- [Denied Glacier preview](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8-placement-final/v7-placement-glacier-blocked-awakening-bay-01.png)

Three retained critiques: [round1 contact](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8/v8-round1/contact.png), [round2 contact](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8/v8-round2-native/contact.png), [round3 contact](/Users/chernodub/.t3/worktrees/containment-game/t3-bff215a7/artifacts/nextgen/v8/v8-round3-native/contact.png).
