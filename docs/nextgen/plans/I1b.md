# I1b — Combat Rig simulation integration

## Scope and decisions

Merge `t3/combat-rig-ability-simulation` at `fd0f565a01dbfb96e45adcaf503942d4e2ddb9c3`
into `t3/merge-combat-rig-simulation` from integration parent `cb8c174`.
Read both conflict parents, A1Persistence, CheckpointFailures, I1aPersistence,
and incoming checkpoint, input, timing/geometry, launch, movement/expiry and
presentation-budget regression suites before resolution.

- `DepthGame.ts`: retain integration saves in `newRun` and `chooseRig`, including
  suppression after failed deletion. Combine with incoming presentation reset,
  budgeted damage/feedback dispatch and explicit Overclock synchronization.
  Preserve the incoming movement, expiry splitting, simulation and event fixes.
- `checkpoints.ts`: retain initial `rig-select` / `starting-boon` acceptance and
  rejection of installed boons/completed rooms; additionally validate statistics
  against the checkpoint's regenerated run graph. Both Continue queries use this
  same reader; current timer entry cannot overflow a validator-accepted map.
- UI adapter and action bar already consume authoritative snapshots, while
  combat text consumes target/source damage receipts. Do not distribute area
  `totalDamage` across targets or count it again; it is aggregate metadata.
  Tests cover 250 ms coalescing, source lanes, lethal state and status labels.
  Rig manifests already read numbers/text directly from the ability catalog.
- Align rig/draft/route number shortcuts and reroll with physical gameplay key
  codes, retain key-only synthetic fallback and native shortcut/typing guards.
  Controls copy explains physical US keyboard positions.
- Smoke checkpoint-feedback navigation now waits for the actual room loading
  indicator and network idle before reloading. This fixes aborted GLB requests
  without filtering failures or relaxing gameplay/persistence assertions.
  Its SSR helper disables unused HMR to avoid a shared-port warning.

## Added integration coverage

- Initial-phase graph-local timer maps, missing-current-timer restoration,
  foreign timers and invalid installed boons/completed-room rejection; Continue
  availability agrees with execution and valid input never throws.
- Real Chromium HUD path through PresentationBudget: aggregate ticks do not
  duplicate damage; coalesced target/source receipts retain status/lethal data.
- Physical menu shortcuts under non-Latin/shifted characters, ignored foreign
  codes/numpad positions, native modifier guards, and route selection.

No existing assertions were weakened or removed by the integration changes.
Incoming simulation regression/balance test changes are preserved from the
reviewed source branch.

## Validation and visual evidence

All six requested gate families passed:

```text
Vitest: Test Files 151 passed | 1 skipped (152)
        Tests 2053 passed | 1 skipped (2054)
Model preview: tests 2; pass 2; fail 0
Build: tsc --noEmit + vite build passed (existing large-chunk advisory)
Room evidence: tests 28; pass 28; fail 0
               {"passed":true,"cpuOnly":true,"checks":33}
Combat Rig smoke passed: live Arc selection, Shift/Q/F/V receipts and HUD,
Overdrive fill/active, menu/pause/typing gates, Continue rig-select/starting-boon/legacy.
Browser smoke passed: desktop, production Pages subpath, assets, fire, weapon switch,
pause/resume, credits.
Authored smoke: passenger-vault, breached-loading-bay, overload-floor; errors:[]
```

`npm ci` passed. `npm run verify` was also run: its Vitest and model gates
passed, then the documented unrelated Python MonitorArtifacts imported-geometry
check failed because `blender` is unavailable. No Blender installation, asset
change, or assertion relaxation was attempted. Remaining required verify stages
were run independently and passed.

The first sandboxed unit run could not launch native HTTP/browser harnesses;
reruns used native access. A newly added synthetic-key test was corrected to
send events from an element, as native key events do. The full final suite passed.
The first production smoke exposed two checkpoint-feedback reloads aborting GLB
requests; both now settle real loading before navigation, and the zero-error
assertion passes. A nonfatal Vite HMR port advisory can occur during concurrent
browser test harnesses; it does not appear as a game console/page error.

The exact standalone Vitest command was rerun after the test correction:
151 files passed, 2053 tests passed, one existing skip; the final repeat after
strengthening the results fixture completed in 88.97 seconds.

### Inherited reviewed test updates

These changes were already present in `fd0f565` and remain unmodified here:

- `A1AbilitySystem.test.ts`: updated exact Slam shape/damage/cooldown, Flashfire
  damage and Meltdown payoff to the reviewed catalog balance.
- `A1Balance.test.ts`: replaces a replenished 30-second fixture with a complete
  seeded finite Act 2 encounter, baseline comparison, all-family composition,
  full-kit usage, earned Overdrive, clear-time spread and damage-share bounds.
- `A1GameIntegration.test.ts`: asserts complete status receipt sums/lethal data
  across the 250 ms presentation window and allows bounded receipt latency.
- `A1StatusCombat.test.ts`: uses catalog-native burn strength while adding
  stronger weapon-burn preservation coverage.
- `A1ReviewRegressions.test.ts`: checks immediate authoritative boon totals
  before waiting the bounded presentation interval for their visual receipts.

No tests were removed by this integration. Three integration suites were
extended; existing persistence/accessibility/gameplay assertions remain intact.

Initial visual pass: seven requested PNGs opened (Slam, Cryo Nova, Whiteout,
Napalm, Overclock, rig-select, results). Cooldowns/active timers, 90-damage Slam,
status labels, catalog 230 radius / 6 s cooldown, and screen layout were legible.
The results fixture exposed a real evidence gap: the opening Overload killed
all staged crawlers before the rifle connected, leaving zero weapon damage.
Use tougher brutes, aim assist and a five-second normal firing interval; require
both ability damage and confirmed weapon hits in addition to the existing kill,
tactical-use and Overdrive assertions. The isolated revised fixture passed.
Final committed-source capture passed: 70 PNGs across 19 scenarios in
147.14 seconds; High at 1920×1080 / DPR 1, hardware Metal / Apple M1 Pro.
Zero failures, zero per-shot/global console/page/network errors, zero font
fallbacks. The manifest records merge code commit `d015c3a`.

Opened all six recommended final PNGs below after regeneration:

- Slam: three readable 90-damage receipts and 5.8 s tactical cooldown; clear
  player/action-bar separation.
- Whiteout: bounded consolidated damage numbers, CHILLED feedback and 5.9 s
  active Overdrive timer; no stale ready announcement or duplicate tick totals.
- Napalm: BURNING label and bounded periodic damage, 5.6 s active power timer.
- Overclock: live Arc names, ready Q/F, active 6.0 s Overdrive countdown.
- Rig selection: updated Slam 90 damage / 230 radius / 6 s cooldown shown from
  the same catalog used by simulation; no clipped manifest or keyboard guide.
- Results: 2 kills, 957.65 weapon damage (958 displayed), 154.35 ability damage
  (154 displayed), 124 status damage, 1236 total, 61 confirmed hits / 63 shots
  (97%), one tactical and one Overdrive use; aligned unclipped stats grid.

The world presentation retains the integration parent's camera/lighting and
existing ability-renderer limitations. No further UI correction was required
by this final visual review.


The final capture runs from merge commit
`d015c3abf4af9e6c6c6729ac49cf7e7dbb28b8ee` (parents `cb8c174` and `fd0f565`).
The follow-up evidence commit changes this report only.

Final gallery directory:
`/Users/chernodub/.t3/worktrees/containment-game/t3-fda950e5/artifacts/nextgen/integration-1b/`.
Gate logs are retained in its `gates/` subdirectory. Captures/logs are ignored
artifacts, not added to Git.

Screenshots for the lead to inspect first:

- `/Users/chernodub/.t3/worktrees/containment-game/t3-fda950e5/artifacts/nextgen/integration-1b/ability-seismic-slam-awakening-bay-01.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-fda950e5/artifacts/nextgen/integration-1b/ability-whiteout-awakening-bay-01.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-fda950e5/artifacts/nextgen/integration-1b/ability-napalm-charge-awakening-bay-04.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-fda950e5/artifacts/nextgen/integration-1b/ability-overclock-awakening-bay-01.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-fda950e5/artifacts/nextgen/integration-1b/rig-select.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-fda950e5/artifacts/nextgen/integration-1b/results.png`

No dependencies added, integration requests outstanding, pushes made, PRs opened,
or other worktrees modified. Dedicated ability world VFX/audio remain the
existing renderer/audio follow-up; this integration verifies simulation/UI
contracts and does not claim performance certification or finish that artwork.
