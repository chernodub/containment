# U4 — combat UI priority and authored transmission

Worktree: `/Users/chernodub/.t3/worktrees/containment-game/t3-ac195e37`.
Branch: `t3/fix-combat-hud-and-results-ui`. Production 1080p source: `2c71ddccb462ae2ece65ea707c2a42bfba49278e`; final 720p/implementation source: `c9fb44430c6fbbd16b99acee2c5776c5a0983b01`. Final report HEAD is recorded in the handoff. Local commits only; no push or PR.

## Implementation

1. **AD-10 / combat inspection.** Pointer hover and bare focus cannot open ability explanations while playing. Held Tab/Alt deliberately reveals focused/hovered rules. Weapon slots no longer have native title tooltips. Objective and weapon-bank hover expansion is removed; switching a weapon still briefly identifies it. World damage/status, threat and direction layers sit below all HUD chrome, ability explanations, toasts and outer beats/panels. The native production smoke sweeps every action-bar slot while actually firing and asserts no panel opens. Automatic contextual coaching now requires inspection; successful-action learning remains active. When ability rules are open, they own the inspect space instead of overlapping coaching.
2. **AD-11 / combat footprint.** The objective is 260px wide at 720p: room, remaining count and short action. Exact authored objective and narrative remain in Pause. Story/set reminders last four presentation seconds on entry/change. Explicit fatal decisions and “Overload is NOT armed” remain visible. Radar is 128px wide at 720p, fades to 35% for enemy/boss contacts beneath it, retains marine avoidance through the existing HUD placement solver, and remains optional through the persisted Threat radar setting. No game-save schema changed.
3. **AD-13 / color meaning.** `damageTokens.ts` documents/exhaustively maps native source, ability-element and boon/status names. Fire orange `--pyro:#ff7a2e`, kinetic amber `--kinetic:#ffb454`, reward gold `--gold:#ffd27a` are distinct. Cryo uses ice blue, Arc violet, acid/poison toxic green, weapon damage neutral white and healing mint. Kills retain the damage element and gain weight/size/×. Different elemental receipts do not combine into a falsely colored total. Single-producer legacy status receipts, including lethal burn, can be resolved from the rig/build through the adapter. Ambiguous receipts remain neutral (contract gap below). Results display the actual source accounting categories with neutral, matched textures and labels, rather than claiming all status damage is one element. Boon accents were audited independently of set membership.
4. **AD-14 / benefits first.** All 60 catalog IDs have authored benefit headlines ≤48 characters in `boonBenefits.ts`. Displayed metrics derive from catalog prose and round meters/seconds to 0.5 and percentages to 5%; approximations carry ≈. The card footer retains the modified ability/icon and set count. Exact values/rules require held Alt/Tab or focused I; Escape closes inspection, preserves focus and never steals combat pause. Scrollable exact details consume reading clicks, not installation. Exact rules remain in Pause loadout. Catalogs and mechanics are unchanged.
5. **AD-15 / final transmission.** Original DOM/SVG/CSS depicts a fractured colony ship, warning trajectory and New Earth receipt. Human loss and warning success have separate landmarks. `SACRIFICE_ENDING` remains verbatim. Reduced motion uses separated static ship poses and a persistent signal. Expedition statistics remain a native disclosure. All actual gameplay hurt origins carry provenance; unknown source cases are unsourced public/debug hurt calls, historical saves without a ledger, or invalid origin data. A fresh natural-death check is recorded below.
6. **Graphics controls.** Additive boolean/numeric/string fields keep native labels and referenced hints. Known ink/adaptive controls have player-language copy; unfamiliar metadata is honored with readable key/hint fallback and preservation of unfamiliar current string values. No renderer option was invented or changed.
7. **Regression.** Existing native inputs, focus containment, zoom/resize matrix, graphics recovery, checkpoints and authored-room assertions remain. No renderer/game files, assets, licenses, dependencies or other worktrees were changed.

## Critique rounds

Before: immutable `artifacts/nextgen/u4-before-dist`, source `ab71db8a35d99c3311582a7779136fe9a9742021`. `u4-before`: 14 verified PNGs; no failures/errors/font fallbacks. Initial invalid-scenario and localhost-denial attempts produced no PNGs; the successful immutable before manifest is retained.

Round 1: `u4-round1`, 1280×720, 10 verified PNGs, no failures/errors. Inspected full size and exact 480×270. Fixed remaining automatic onboarding intrusion, increased the compact numeric row, restored 244px side-column fit in extreme desktop zoom, and corrected source-sensitive receipt tests.

Round 2: `u4-round2`, 1280×720, 12 verified PNGs, no failures/errors. Inspected critical objectives, deliberate ability/draft rules, compact HUD, final transmission and exact 480×270 views. Fixed simultaneous coaching/rules overlap, made the human-loss caption explicit, and included boss contacts in radar fade. The finite ship entrance was subsequently shortened from 12 s to 0.8 s to preserve native zoom/navigation readiness without extending its 30 s test deadline. An additional full-size 1080p finishing pass caught late-loaded screen CSS recoloring the source legend. Increased specificity and a production computed-color assertion fixed it. `u4-pre-legend-fix` preserves all 29 original PNGs and its manifest (the intermediate build path was reused; the original build is not retained); both final galleries were freshly recaptured from the corrected source. The existing onboarding fixture now deliberately holds Alt. The first 720p run then caught expanded death telemetry overflowing by 53px. Kept all 16 counters and tightened only short-desktop expanded-debrief spacing; added panel/action fit assertions. `u4-pre-debrief-fit-720` retains the original 30 accepted frames, failure PNG and failed manifest. A focused statistics recheck precedes a complete fresh 720p capture. Final evidence below records each source explicitly.

Capture fixtures are presentation evidence, not organic balance or hardware performance claims. Final galleries and organic sheets are recorded below. `review480/` contains exact area-reduced frames without another browser.

## Changed tests and presentation pins

- `HudSystems`: passive hover/bare-focus inspection pins become held-key contracts; objective hover expansion becomes no-expansion plus Tab/Alt; five identical-target events with differing elements retain both totals rather than one falsely combined color. Same-element budgeted events retain the original sum. Added exhaustive HUD layer order, critical objectives, right-column area/width, radar fade, marine clearance and suppression of uninvited coaching.
- `UiCombatPresentation`: canonical element hues replace washed-out variants; direct weapon receipts explicitly identify neutral weapon damage; differing elements retain separate receipts. Added actual computed damage/status colors, white weapon hits and element-preserving lethal emphasis.
- `UiScreens`: fire card checks the unchanged family semantics through its accessible label and compact footer; exact LIMIT rules are checked after deliberate I inspection. New native Alt/Tab/I/Escape/reading-click contracts preserve focus and prevent accidental installation.
- `U4BoonPresentation`: all 60 IDs/headline lengths; every metric derived from catalog text, bounded rounding and exact-rule retention; Escape combat-pause regression.
- `U4DamageColors`: exhaustive source/status/element mapping; distinct reward/kinetic/fire/heal tokens; authoritative metadata and conservative legacy resolution including lethal/expired mixed statuses.
- `U4EndingSettings`: exact ending, original vector composition, loss/success, reduced motion, optional graphics metadata and native controls for additive option types.
- `scripts/combat-rig-check.mjs`: real native firing while pointer crosses all weapon/ability slots must reveal nothing; shots must actually increase.
- `UiScreens` additionally checks all source legend values are neutral; the production capture harness enforces the same computed-color contract to cover stylesheet load order.
- Capture harness: additive native held-key/focus and reduced-motion scenario metadata; always releases held keys between scenarios. Existing capture correctness/marine assertions remain intact.

- `F2Hud`: pointer hover still performs zero layout reads; it now reveals nothing until deliberate Alt, which also performs zero reads.
- `HudReadability`: the old inline source-expression pin now accepts the cached concise status variable and checks compact actions plus exact authored objectives retained in Pause. All narrative reveal, skip and authorization checks remain.

No gameplay, determinism, persistence, navigation, recovery, safety, native-input or authored-room assertion was removed or weakened.

## Remaining contract limitations

- The simulation's damage ledger aggregates some status damage by target/source without element. Mixed burn/poison/frostbite builds and legacy boon damage cannot be accurately split by the UI. These remain neutral rather than inventing a hue. Full elemental fidelity requires the simulation owner to add authoritative element provenance and aggregate per element. The UI already feature-detects `damageElement` / `element` metadata.
- The current statistics snapshot contains source totals, not per-element totals. The results bar accurately labels source composition; it cannot present elemental composition without new simulation data.
- Blender is documented as absent on this machine. The required `verify` result and unchanged asset-test blocker are recorded below; no asset test is disabled and no asset is altered.

## Evidence and gate receipts

Full logs: `/Users/chernodub/.t3/worktrees/containment-game/t3-ac195e37/artifacts/nextgen/u4-logs/`.

```text
npm ci
  added 61 packages; no dependency changes.
VITEST_MAX_WORKERS=1 npx vitest run --exclude scripts/cryo-model-preview.test.mjs --maxWorkers=1
  Test Files  257 passed | 1 skipped (258)
  Tests  3002 passed | 1 skipped (3003); 435.57s.
Final radar visibility regression:
  Two focused 22-test runs: 21 passed, one unchanged 5 s resizing timeout each.
  Host load observed at 526.12; no assertion/deadline changed.
  Same resizing case alone: 1 passed | 21 skipped; 9.73 s total including setup.
  The added radar clearance assertion passed in both focused runs.
Final legend correction, tests/UiScreens.test.ts:
  Test Files  1 passed (1); Tests  35 passed (35).
Final short-desktop debrief fit, tests/UiScreens.test.ts:
  Test Files  1 passed (1); Tests  35 passed (35).
Earlier isolated UI regression:
  Test Files  4 passed (4); Tests  81 passed (81).
node --test scripts/cryo-model-preview.test.mjs
  tests 2; pass 2; fail 0.
npm run build
  tsc --noEmit passed; Vite built successfully; existing large-chunk warning.
npm run test:room-evidence
  tests 28; pass 28; fail 0.
  {"passed":true,"cpuOnly":true,"checks":33}
```

`npm run verify` was executed. Its first aggregate stopped at seven UI presentation/zoom failures; these were corrected and the complete final Vitest gate passed as shown above. The unchanged Python monitor asset probe ran two tests and failed one with `FileNotFoundError: blender`. No Blender installation, asset change or asset-test bypass was attempted. Native smoke/authored gates preceded the final CSS-only legend and 720p spacing corrections; the strengthened UiScreens suite and production captures verified those final changes. The aggregate verify command is not claimed green.

```text
npm run test:smoke
  Checkpoint feedback passed: vanished Continue, cross-tab refresh, failed write,
  removal, stale Continue, warnings and recovery.
  Combat inspection passed: native firing across every weapon and ability opens no panels.
  Combat Rig smoke passed: Arc Shift/Q/F/V, Overdrive, menu/pause/typing and Continue phases.
  Audio wiring passed: native firing/ability, live buses, paused/muted silence, real stingers.
  Browser smoke passed: desktop, production Pages subpath, assets, fire,
  weapon switch, pause/resume, credits. Zero errors.
```

```text
npm run test:authored-smoke:all
  passenger-vault, breached-loading-bay, overload-floor passed.
  Native desktop keyboard move/fire; errors:[] in all three.
  Explicit fatal authorization retained for Overload Floor.
```

```text
Final capture u4-final (1920×1080):
  31 verified PNGs / 3 sprite sheets; 0 failures/errors/font fallbacks.
Final capture u4-final-720 (1280×720):
  31 verified PNGs / 3 sprite sheets; 0 failures/errors/font fallbacks.
  Every captured playing HUD clears the native projected marine.
  Every captured playing right column is below 14% of screen area.
Focused debrief-fit720 recheck:
  2 verified PNGs; 0 failures/errors.
```

Every final image has an exact 480×270 derivative in `review480/`. Native burn metadata records actual `source:status`, `element:burn`, token `pyro` and computed `rgb(255,122,46)`; the result source legend is asserted neutral in production captures.

```text
npm run playtest:smoke — UNMET ON THIS HOST
  First run: wall-timeout; 1 room cleared; 0 errors; defects:[].
  Start host load 648.42 on 10 logical cores; only 20.4 simulation seconds advanced.
  Unchanged isolated retry: wall-timeout; 1 room cleared; 0 errors; defects:[].
  Host load later 697.06. Deadline 235 s and three-room target are unchanged.
```

First attempt is retained under `playtest/u4-smoke-timeout-1`; retry under `playtest/smoke`. Both native traces show ongoing movement, firing and reload rather than an open explanation panel or recorded navigation defect. This required timing gate needs a quiet-host rerun; it is not claimed passing. No fast/assisted mode or longer deadline was substituted for it.

```text
Separate native Breacher evidence (fast draw mode, not a replacement smoke gate):
  wall-timeout; 2 rooms cleared; 0 errors; defects:[].
  Seed 1729; unassisted; normal native inputs and 60 Hz simulation.
  Intermediate GPU submissions omitted; evidence frames fully drawn.
```

This separate run supplies organic UI evidence only; no balance or performance acceptance is claimed. Natural-death verification is a separate intentionally idle lifecycle probe, with no forced damage/health/state changes.


## Before / after image paths

Each path is absolute. The final 1080p snapshot is 2c71ddc; final 720p is c9fb444. All 20 application JavaScript content hashes are identical. The sole application delta is expanded-debrief CSS inside `max-height:800px`, inactive at 1080p. Both final snapshots remain immutable; the hash receipt and exact CSS patch are in `u4-logs/css-only-720.json` and `720-css-delta.patch`. The extra inspect/critical/burn fixtures name their staging explicitly; organic results are separate.

| Item | Before | After |
|---|---|---|
| AD-10, combat HUD | `/Users/chernodub/.t3/worktrees/containment-game/t3-ac195e37/artifacts/nextgen/u4-before/combat-kiting-containment-annulus-02.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-ac195e37/artifacts/nextgen/u4-final/combat-kiting-containment-annulus-02.png` |
| AD-11,720p objective/radar | `/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final-720/combat-kiting-awakening-bay-03.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-ac195e37/artifacts/nextgen/u4-final-720/u4-critical-objective-containment-annulus.png` |
| AD-13, actual burn ticks | `/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final/v2-flashfire-awakening-bay-05.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-ac195e37/artifacts/nextgen/u4-final/u4-burn-ticks-awakening-bay.png` |
| AD-14, augment hierarchy | `/Users/chernodub/.t3/worktrees/containment-game/t3-ac195e37/artifacts/nextgen/u4-before/augment-draft.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-ac195e37/artifacts/nextgen/u4-final/augment-draft.png` |
| AD-15, final transmission | `/Users/chernodub/.t3/worktrees/containment-game/t3-ac195e37/artifacts/nextgen/u4-before/complete-fixture.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-ac195e37/artifacts/nextgen/u4-final/complete-fixture.png` |
| Settings | `/Users/chernodub/.t3/worktrees/containment-game/t3-ac195e37/artifacts/nextgen/u4-before/title-settings.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-ac195e37/artifacts/nextgen/u4-final-720/title-settings.png` |
| Pause loadout | `/Users/chernodub/.t3/worktrees/containment-game/t3-ac195e37/artifacts/nextgen/u4-before/pause-loadout-augments.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-ac195e37/artifacts/nextgen/u4-final-720/pause-loadout-augments.png` |

Additional deliberate inspection: `/Users/chernodub/.t3/worktrees/containment-game/t3-ac195e37/artifacts/nextgen/u4-final-720/u4-boon-inspect.png` and `/Users/chernodub/.t3/worktrees/containment-game/t3-ac195e37/artifacts/nextgen/u4-final-720/u4-ability-inspect-awakening-bay.png`.

The original organic AD-10 defect remains read-only at `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/playtest/i7-final-arc-1729/r18-containment-annulus-mid.png`. The real native firing sweep is a behavioral proof, since a still screenshot cannot establish that hover never opens a panel.

The vector ending gives this UI an authored final moment. Final combined art-direction judgment belongs on the integrated ink/world/VFX build; the existing world crowding in this UI worktree is unchanged.


## Organic sheets and actual fatal-hit proof

- Arc sheet: `/Users/chernodub/.t3/worktrees/containment-game/t3-ac195e37/artifacts/nextgen/u4-organic-review/arc/organic-combat-sheet.png`.
- Breacher sheet: `/Users/chernodub/.t3/worktrees/containment-game/t3-ac195e37/artifacts/nextgen/u4-organic-review/breacher/organic-combat-sheet.png`.
- Exact 480×270 cells: each cohort's `review480/organic-combat-sheet.png`. Both sheets were inspected at native size and 480×270. They select separate native snapshots rather than implying a continuous burst; per-frame source paths and simulation timestamps are in each manifest. Arc uses the unchanged every-tick draw mode; Breacher is explicitly fast-rendering. Both are unassisted.
- Real native fade: `/Users/chernodub/.t3/worktrees/containment-game/t3-ac195e37/artifacts/nextgen/u4-radar-fade-720/u4-radar-fade.png`. A legal enemy beneath the actual camera/radar produced computed opacity 0.35, no marine overlap and zero errors. Its exact480×270 derivative is retained.
- Natural death: `/Users/chernodub/.t3/worktrees/containment-game/t3-ac195e37/artifacts/nextgen/playtest/u4-natural-death/terminal-dead.png` and `terminal-dead.json` beside it. The native intentionally idle lifecycle probe died after 6.883 simulation seconds (87.71 wall seconds), with no assistance, forced damage or health/state override. Fast mode omits intermediate GPU submissions only. It is separate from campaign/balance evidence.

```text
Natural-death probe: dead; 0 rooms cleared; 0 errors; defects:[].
Authoritative lastDamage: enemy-contact / crawler / 6 damage / 1729:v3-r0.
Visible fatal explanation: Swarm crawler attack — Awakening bay · 6 damage.
No unknown source in the retained native recent-damage ledger.
Native radar fade: 1 verified PNG; opacity 0.35; marineOverlaps:[]; errors:[].
```

The reported cause uses the actual RunStats receipt, not the playtest runner's separate nearby-threat inference. The only unidentified-source cases found by source audit are unsourced public/debug hurt calls, historical data with no ledger, and invalid origin metadata; none occurred in this native death.

## Handoff status

The UI implementation and review artifacts are committed locally. **Required organic smoke remains unmet under extreme host contention** after two unchanged 235 s attempts; rerun it on a quiet host. Full asset verification still requires the documented missing Blender executable. **AD-13 remains partial for mixed status/legacy boon numeric damage** until the simulation owner supplies authoritative per-hit element provenance and preserves it in aggregation. All other requested JavaScript/browser/capture gates passed as recorded. No rendering/simulation files, dependencies, assets or third-party notices changed; no push or PR.
