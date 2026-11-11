# I1a Combat Rig / interface integration

- Merge A1 then U1; preserve both capture scenario sets and assertions.
- Keep gameAdapter as the typed simulation seam and optional G1 graphics seam.
- Start/retry opt into rig-select and refresh the HUD synchronously; preserve checkpoint restore phases.
- Wire live action snapshots/events, damage source metadata, catalog augments and nested stats.
- Extend production keyboard/continue smoke and live rig/death captures.
- Inspect two capture rounds at 1920×1080; retain desktop accessibility/recovery/persistence guarantees.
- Run all engineering gates and verify (Blender-only failures are out of scope).

## Wired contracts
- Both stream heads were merged in order (`b5617a2`, then `5af5da8`). The four harness conflicts keep A1 setup arguments/native actions/receipts and U1 fixtures/projection/UI assertions together.
- Start/retry opt into rig selection; Continue follows the recorded phase. Start synchronously refreshes the HUD (A1's requested fix in the extracted application).
- gameAdapter calls the guaranteed typed A1 methods and snapshots directly. Explicit debug fixtures remain available for isolated presentation states; only renderer options/projection stay feature-detected.
- HUD receives native ability events, carries denial reasons across snapshot refresh, shows next dash recharge and active lifetimes, and uses real damage/source/lethal receipts. Augment glyphs also appear in the owned HUD stack and acquisition toasts.
- Results read the nested immutable run statistics; draft/loadout use catalog rules and dedicated icons for all twelve augments.
- Required initial-phase persistence exposed a missing A1 boundary: rig-select and starting-boon now save/restore as exact validated initial choices, with zero completed rooms/installed boons. Combat still preserves the last choice/room boundary, and failed removal keeps its warning and stale-Continue suppression.

## Test changes
- UiAdapter: obsolete missing-A1/mocked API cases replaced by live snapshot identity, real action acceptance/rejection, fixture isolation and unchanged optional G1 checks.
- UiScreens: missing-API guard and flat optional stats fixtures replaced by keyboard/public-action dispatch and nested live totals/cache invalidation; augment draft/loadout/icon guarantees added.
- UiIcons: all twelve unique augment glyphs added to coverage.
- A1Persistence: old rejection of initial phases replaced by exact initial phase round-trip plus rejection of later-room/preinstalled-boon initial saves. All corrupt extension/graph/resource checks remain.
- CheckpointFailures: initial no-save presentation expectation replaced by truthful saved-choice feedback and restoration of the previous initial choice after a failed later write; an explicit initial quota failure still requires no Continue. Removal/death/completion failures remain unchanged.
- I1aPersistence: all four rigs round-trip real initial choices and keep the initial boundary untouched during combat.
- HudSystems/UiCombatPresentation: live dash/cooldown/denial/ready receipts, persisted denial copy, source-specific coalescing and lethal emphasis.
- Smoke/authored/sound/checkpoint browser helpers insert rig selection before the draft without removing existing assertions. New production rig helper uses real native keys, snapshots and DOM; actual generated initial saves and legacy no-rig restores are exercised. Room asset preparation is awaited before reload to retain the zero-error assertion.
- Capture contracts preserve both scenario sets and require every live ability slot's catalog ID and state to agree with the simulation.

## Validation before visual iteration
- Vitest: 143 files passed / 1 skipped; 1,852 tests passed / 1 skipped.
- Cryo model: 2 tests passed; CPU checks 33.
- Room evidence: 28 checks passed plus ragdoll self-test.
- Production build and smoke passed; native Arc Shift/Q/F/V, all HUD receipts and initial/legacy Continue passed with zero errors.
- Authored smoke: three required desktop rooms plus an explicit Awakening Bay new-flow run passed with zero errors.
- `npm run verify` was run. An overlapping first attempt hit existing five-second geometry/HUD timeouts; an isolated rerun passed all JS tests and stopped at `test_monitor_artifacts.py` because `blender` is absent (documented out of scope). No test timeout or assertion was relaxed.

## Visual review / two critique → fix rounds
- Compared the redesigned HUD with the historical Awakening Bay baseline (read-only). Rig selection and the actual 16-cell debrief were clean at 1920×1080; the world retains the baseline renderer pending G1.
- Round 1: `integration-1a-round1`, 79 PNGs / 0 failures / 0 console-page errors, 156.65s, Metal. Viewed real Breacher Slam/Ram, Cryo Whiteout, Pyro Napalm, Arc Overclock, rig screens, death results, loadout and augment cards. Whiteout revealed duplicate stacked damage/status labels from repeated 250ms pulses. Fix: merge live receipts until a quiet gap, spatially coalesce unkeyed status feedback, and reserve distinct source lanes. Added sustained-pulse regression coverage. The selected rig now remains explicit in the draft header. Ability-only capture staging now expires the acquisition toast for the deliberately removed starter boon and asserts it stays absent.
- Round 2: `integration-1a-round2`, 13 PNGs / 0 failures / 0 console-page errors, 42.35s. Viewed Whiteout and confirmed consolidated totals/status labels, then reviewed real Cryo augment draft, all owned augment cards and starting-boon identity. Found stale “Overdrive ready · V” while Whiteout was already active. Fix: dismiss only the keyed ready announcement on real cast/impact; retain active-duration HUD and other toasts. Added real Overdrive event regression. Denied events also clear any leftover ready flash so the shake is visible.
- The original short `integration-1a` attempt exposed a capture-only assumption that augments appeared in starter drafts. Corrected the scenario to a deterministic real post-room reward with an owned starter. Final `integration-1a --scenarios=all` overwrites that partial manifest and validates every preserved scenario.
- Full merged gallery follow-up: resetting debug enemy IDs after the toast-settle period could reuse a cached renderer actor from a natural spawn. The harness now refreshes the empty encounter before reusing IDs; no renderer change was needed. The all-scenario run also exposed the legacy status setup exhausting its magazine after the brief Absolute Zero freeze had expired. The retained scenario now primes burn/poison/chill with a real rifle hit and freezes with live Cryo Nova, preserving all four status, visible-enemy and muzzle assertions. An isolated production status capture passed (4 PNGs / 0 errors, 11.14s). A stored but illegal power placement now says BLOCKED rather than misleading 0.0s, with a HUD regression test.
- Final test scheduling: after long GPU captures, Vitest's default worker fan-out intermittently exceeded the unchanged five-second limit in exhaustive geometry raycasts. Added a dedicated Vitest config merging the existing Vite settings and limiting workers to two (the scheduling approach already described by U1). No timeout, performance budget, assertion or test inclusion was relaxed.
- Production smoke follow-up: its fast phase reloads intermittently aborted prior room GLB fetches even though all game/DOM assertions passed. The rig helper now awaits debug preparation, two compositor frames, production `aria-busy=false` and network idle before navigation. The unchanged zero-error assertion passed on the rerun; no request failure is filtered or ignored.

## Final code gates
```text
npx vitest run --exclude scripts/cryo-model-preview.test.mjs
  Test Files 143 passed | 1 skipped (144)
  Tests      1855 passed | 1 skipped (1856)
node --test scripts/cryo-model-preview.test.mjs
  tests 2; pass 2; fail 0
npm run build
  tsc --noEmit + vite build passed (existing large-chunk warning remains)
npm run test:room-evidence
  tests 28; pass 28; fail 0; ragdoll self-test {passed:true,cpuOnly:true,checks:33}
npm run test:smoke
  Combat Rig smoke passed: live Arc selection, Shift/Q/F/V receipts and HUD,
  Overdrive fill/active, menu/pause/typing gates, Continue rig-select/starting-boon/legacy.
  Browser smoke passed: desktop, production Pages subpath, assets, fire,
  weapon switch, pause/resume, credits. Zero errors.
npm run test:authored-smoke:all
  passenger-vault, breached-loading-bay, overload-floor: all passed; errors:[]
```

## Remaining seams / self-assessment
- No integration request needs an edit in another owned stream. The A1 immediate-HUD request is applied in `src/ui/application.ts`.
- G1 graphics options remain feature-detected (`graphicsOptions`, `setGraphicsOptions`), and optional `worldToScreen` retains the camera-matrix fallback. This integration makes no edits under `src/render/**` after the U1 merge.
- World lighting/camera and dedicated ability constructs/zones/VFX/SFX remain renderer/audio follow-up work. The simulation and UI are live; these captures do not claim the whole game meets the AAA vision or the 60fps hardware budget. Capture timing includes screenshot/idle overhead and is not a benchmark.
- Isolated ready/cast/denied/complete fixtures remain explicit debug/test tools. Real rig selection, all sixteen ability uses, live augments/loadout, and death results have separate production evidence.
- No dependencies added, pushes made, PRs opened or other checkouts modified.


## Final visual evidence
```text
npm run capture -- --label=integration-1a --width=1920 --height=1080 --scenarios=all --keep-going
164 PNGs in 337.2s; 74 expanded scenarios / 56 registered scenario IDs
0 failures; 0 console/page/network errors; 0 font fallbacks
High graphics; hardware Metal / Apple M1 Pro; 1920×1080 @ DPR 1
Capture code HEAD: 58445c053aeca900cfb085072ecbe16d47561714
```
The final files below were opened and reviewed after regeneration, in addition to the two critique/fix galleries and baseline comparison:
- `/Users/chernodub/.t3/worktrees/containment-game/t3-6c247ac7/artifacts/nextgen/integration-1a/rig-select.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-6c247ac7/artifacts/nextgen/integration-1a/ability-seismic-slam-awakening-bay-01.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-6c247ac7/artifacts/nextgen/integration-1a/ability-whiteout-awakening-bay-01.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-6c247ac7/artifacts/nextgen/integration-1a/ability-meltdown-awakening-bay-01.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-6c247ac7/artifacts/nextgen/integration-1a/ability-overclock-awakening-bay-01.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-6c247ac7/artifacts/nextgen/integration-1a/augment-draft.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-6c247ac7/artifacts/nextgen/integration-1a/pause-loadout-augments.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-6c247ac7/artifacts/nextgen/integration-1a/results.png`
