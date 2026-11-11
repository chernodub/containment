# X3 — final desktop UI fix wave

Branch: `t3/containment-uiux-fix-wave`. Final UI implementation commit: `9eb159a` (full SHA in the final handoff). Both complete galleries use immutable `artifacts/nextgen/x3-final-dist`, source 1146a6c, plus one focused CSS-only augment-draft correction from immutable `x3-final-readability-dist`, source 9eb159a. Every application JavaScript byte/content hash is identical across those builds; Vite renamed its entry after the stylesheet change. Per-shot correction provenance and original manifests/PNGs are retained. Later changes affect capture tooling, tests and documentation only. The final handoff supplies HEAD.

## Merge and scope

The FIRST operation attempted the required `git merge t3/integrate-playtest-balance-tuning`. The sandbox initially denied Git's external worktree metadata write; the approved retry merged successfully. Merge commit `06eac9e` preserves both sides of `package.json` and `scripts/nextgen/README.md`: benchmark/room-benchmark commands plus playtest/simulation/smoke commands and both documentation sections. Credits and paid-recovery changes remain intact. The imported branch head was `f496476`.

No renderer, balance parameter, playtest tool, dependency, font, third-party notice, other checkout or sparse-checkout configuration was changed. The only simulation additions are incoming-damage statistics and their checkpoint handling in DepthGame, RunStats, checkpoints and the minimal expedition snapshot copy. No push or PR.

## What changed

1. **Cursor:** stable 40px screen-space core, closed bright ring/dot with a strong dark keyline, independent continuous spread/reload rings, topmost combat layer. Its silhouette stays intact through spread and feedback. Reviewed bright Cryo/Containment floors and dense relay/Low combat natively and at 480×270.
2. **Title:** CONTAINMENT owns the lockup; DEPTH is a small spaced companion tag. This keeps the existing name while freeing the left 45% for a self-contained front door beside the separately owned cinematic shot.
3. **Rig identity and units:** sixteen original SVG miniature arenas show the marine, hostile dots and distinct tactical behaviors: shove/launch, frost trail, instant freeze pulse, wall/fragments, moving blizzard, flame lane/cone/pool/aura, chain hops, pylon link and time dilation. Outcome copy precedes statistics. One shared 32-world-units/metre formatter is used by threat descriptions, ability statistics/rules, boon/augment text and recap tooltips. Small 20-unit growth remains 0.63m rather than rounding away.
4. **Boon language:** elemental icon/accent is independent of family-set membership. Fire is orange, Cryo blue, Arc violet, kinetic amber, acid green and recovery green-white. Drafts, augment cards, build strip, loadout, results recap and acquisition glyphs follow that identity. Smaller explicit set badges retain unchanged family mechanics. Visible routes/rewards say boon. Tactical advice, limits, conditions and true trade-offs have distinct labels; repeated augment/rig labels are removed.
5. **Combat footprint:** inactive weapons become a compact digit strip; switch, hover or number key reveals icons for 1.5s. After 4s the room/story block reduces to its objective, retaining held-Tab/hover inspection. Cooldown numerals and keycaps grow. Short desktop CSS viewports preserve the original 140px marine safety envelope and all native buttons/keys.
6. **Denied actions:** Casting, Recharging, No charge and Need clear ground replace ambiguous BLOCKED/COOLDOWN labels; actual denied receipts appear briefly by the cursor. The optional No target reason is supported. Renderer invalid-placement preview is feature-detected and cleared on expiry, pause, room change and disposal; the current renderer has no such hook, so current production uses the reticle text.
7. **Failure and ending:** actual armor/health removed is recorded with source kind, optional enemy family, room and simulation timestamp. The 32-entry recent ring retains at most 5s and never counts denied/paused/invulnerable damage. Death leads with fatal source/room and incoming damage by source. Outgoing/build counters remain behind a native disclosure, with all sixteen original counters preserved and open state retained on refresh. Completion leads with exact authored ending text in a full-viewport moment; statistics are on demand. Historical saves load with empty defaults; new data validates, round-trips, freezes and rejects corruption. Fractional fixed-step timestamps are checked across 20 rooms.
8. **Threats:** larger filled pointed chevrons, strong dark backing, one consistent inset edge, upright grouped count plates and a stronger filled/outlined exclamation state for real attacks. True bearings, source-origin damage directions, culling, bounded pools and marine/HUD clearance remain tested.
9. **Screen notes:** unaffordable services show readable credit shortfalls; Pause emphasizes useful health/credits/build state over its sector numeral; augmented slots show badges, changed-value lines and effective values; settings group descriptive player-language options; destruction outcomes keep unchanged wording and equal-width discovery. One temporary Overdrive toast plus the persistent slot replaces duplicate coaching/outer glow. Rig coaching uses actual ability names/summaries, medkit advice anchors to the stock readout, low-health treatment stays peripheral, one relevant icon chip represents each enemy status, and entry/clear/boss beats have distinct framing.

## Visual evidence and critique

All paths below are beneath:
`/Users/chernodub/.t3/worktrees/containment-game/t3-f6332275/artifacts/nextgen/`

Before source: immutable `x3-before-dist`, revision 06eac9e. `x3-before` retains the first attempt's six lazy-screen fixture races with zero page/console errors; `x3-before-retry` resolves augment/results/onboarding after real control-readiness waits. `x3-before-extra` supplies the three rig variants plus health/status/cooling/reload/low-ammo/compact-room states. Failed attempts were retained, not filtered.

Round 1: `x3-round 1`, 51 accepted frames plus one completion-bounds failure. Opened native and exact480×270 title, rig, settings, boon, loadout, fatal/denial, low-health, bright dense fights and Low threats. Fixed the diagnostic hurt proxy dropping source metadata, fullviewport completion translation, disclosure refresh, desktop360px-height dock clearance and effective augmented stat values.

Round 2: `x3-round2-720`, 46 accepted frames, no failures/errors. Opened native and exact480×270 dense fights, Low threats, compact dock, fatal ledger, ending and screen hierarchy. Improved secondary set-badge size/contrast and split generic rule labels into advice, limits, prerequisites and trade-offs. Explicit expanded-statistics fixtures retain outgoing/build review. Both expanded views passed a focused720p production capture before freezing finals.

Final galleries `x3-final` and `x3-final-720` each contain 59 accepted frames / 7 sprite sheets, zero failures, zero errors and zero font fallbacks on hardware ANGLE Metal / Apple M1 Pro. Final native review also removed a duplicated rig/family sentence beneath augment cards. One exact draft fixture per gallery was recaptured and assembled only after verifying the complete multiset of JavaScript content hashes/counts was unchanged; `pre-readability-correction/` preserves the original PNG/manifest. The initial replacement commands had a mistyped source-SHA argument; those invalid-provenance attempts remain under `*-invalid-sha` and were regenerated with verified 9eb159a before inclusion. Every accepted playing frame keeps the original projected-marine overlap assertions. Staged fights and explicit damage/UI fixtures are presentation evidence, not organic balance or hardware-performance certification.

First before/after pairs (absolute paths):

- Title: `/Users/chernodub/.t3/worktrees/containment-game/t3-f6332275/artifacts/nextgen/x3-before/title.png` → `/Users/chernodub/.t3/worktrees/containment-game/t3-f6332275/artifacts/nextgen/x3-final/title.png`
- Cryo rig: `/Users/chernodub/.t3/worktrees/containment-game/t3-f6332275/artifacts/nextgen/x3-before-extra/rig-select-cryo.png` → `/Users/chernodub/.t3/worktrees/containment-game/t3-f6332275/artifacts/nextgen/x3-final/rig-select-cryo.png`
- Fire boon: `/Users/chernodub/.t3/worktrees/containment-game/t3-f6332275/artifacts/nextgen/x3-before/starting-boon.png` → `/Users/chernodub/.t3/worktrees/containment-game/t3-f6332275/artifacts/nextgen/x3-final/starting-boon.png`
- Failure: `/Users/chernodub/.t3/worktrees/containment-game/t3-f6332275/artifacts/nextgen/x3-before-retry/results.png` → `/Users/chernodub/.t3/worktrees/containment-game/t3-f6332275/artifacts/nextgen/x3-final-720/x3-failure-analysis.png`
- Dense cursor: `/Users/chernodub/.t3/worktrees/containment-game/t3-f6332275/artifacts/nextgen/x3-before/combat-kiting-relay-racks-04.png` → `/Users/chernodub/.t3/worktrees/containment-game/t3-f6332275/artifacts/nextgen/x3-final-720/combat-kiting-relay-racks-04.png`
- Compact HUD: `/Users/chernodub/.t3/worktrees/containment-game/t3-f6332275/artifacts/nextgen/x3-before-extra/x3-hud-compact-awakening-bay.png` → `/Users/chernodub/.t3/worktrees/containment-game/t3-f6332275/artifacts/nextgen/x3-final-720/x3-hud-compact-awakening-bay.png`
- Low threats: `/Users/chernodub/.t3/worktrees/containment-game/t3-f6332275/artifacts/nextgen/x3-before/g2-kiting-low-infested-workshop-04.png` → `/Users/chernodub/.t3/worktrees/containment-game/t3-f6332275/artifacts/nextgen/x3-final-720/g2-kiting-low-infested-workshop-04.png`
- Ending: `/Users/chernodub/.t3/worktrees/containment-game/t3-f6332275/artifacts/nextgen/x3-before/complete-fixture.png` → `/Users/chernodub/.t3/worktrees/containment-game/t3-f6332275/artifacts/nextgen/x3-final-720/complete-fixture.png`

`review480/` in each gallery contains exact area-reduced480×270 frames. The source PNGs and manifests remain unchanged.

## Tests and presentation pins

No gameplay, native input, determinism, save validation, recovery, navigation, resizing, marine safety or authored-room assertion was removed or weakened. The retained F2 desktop CSS-viewport matrix is640×360,960×540,1280×720,1920×1080,2560×1440 and3440×1440; it exercises native keyboard focus, mouse reachability, repeated Tab containment and graphics interruption across blocking screens. These are desktop zoom/resizing checks, not phone support.

- HitConfirmation/UiCombatPresentation: fixed minimum core plus independent spread replaces growing/open-segment pins; dark keyline, continuous silhouette, reload and combat z-order remain asserted. Status chips retain accessible labels and pooled children, with new priority/one-chip-per-target coverage.
- ThreatIndicators/I2UiProjection: rectangle-edge intersection replaces ellipse geometry while preserving exact outward bearing, viewport/HUD/marine clearance, grouping, urgency and pool bounds.
- HudSystems: contextual denial wording replaces BLOCKED/COOLDOWN strings; the redundant ready-edge animation expectation becomes none, retaining ready key/meter/energy and once-only immediate-cast dismissal. New compact/inspection/timer/placement-hook lifecycle tests preserve simulation snapshots.
- UiScreens: generic SELF label becomes a time-dilation vignette; debrief tests deliberately open native disclosure and retain all sixteen counters/source totals/accuracy/refresh checks. New tests cover title hierarchy at both desktop sizes, elemental versus set identity, credit reasons, augment badges/changes/effective charges and ending-first disclosure.
- UiSettings: renderer-facing exact metadata text becomes native meaningful player labels and referenced descriptive hints; all contract fields, choices, sizing, controls, persistence and keyboard focus remain checked.
- UiOnboarding: old duplicate first-full Overdrive coaching is replaced by HUD ownership; successful-use preference persistence remains. Rig-specific names, medkit anchoring and projected-obstacle/cache guarantees are covered.
- UiAdapter/UiCaptureClock/A1CaptureContract: optional finite-coordinate placement hook, debug provenance forwarding/immune behavior, and visible result disclosure plus incoming-breakdown fixture contracts.
- New X3IncomingDamage: provenance, clamped actual loss, denied damage, all hurt origins, bounded 5s/32 receipts, pause/room clocks, old/new/corrupt checkpoints, immutable restored receipts, grouped failure text, exact ending and 20-room fractional-step validity.
- New UiPlayerLanguage: single conversion including small augments, all catalog prose, elemental membership separation, rule labels and sixteen unique authored actor vignettes. The final fire-card presentation expectation was updated from generic RULE to LIMIT for its explicit non-stacking restriction; no mechanic/assertion was removed.

## Validation

Validation receipts are appended below. Browser jobs run serially; Vitest uses one worker within the requested cap of two. Unchanged load-sensitive failures were retried in isolation without increasing timeouts or reducing assertions.

## Remaining gaps / integration requests

- **Balance owner:** imported revision 06eac9e independently gives Breacher 11 clears / 6 Overdrives, cadence 1.8333333333333333 against unchanged I5Cadence upper bound 1.8. Evidence: `artifacts/nextgen/playtest/x3-imported-baseline-cadence/breacher-1729.json`. This is not fixed by UI changes and was not bypassed.
- **Renderer owner:** no `setInvalidAbilityPlacement` hook exists currently. The UI feature-detects it, so the current experience gives precise reticle text; a world footprint requires the separately owned renderer implementation. No renderer code changed.
- **Simulation contract:** current abilities accept empty casts and have no authoritative no-target denial. The UI can render that optional receipt but does not invent a gameplay restriction or falsely label a successful cast as denied. Generic non-placement blocked cases remain Unavailable; room-limited Overdrive says Next room.
- **Environment:** Blender is missing. The unchanged monitor asset test reproduces FileNotFoundError; no install, asset edits or test bypass.
- Miniature vignettes are tactical schematics rather than exact range drawings. Cinematic actor/world/VFX restaging remains with its owning agents. No organic full-run balance or quiet-hardware performance certification is claimed.

### Gate receipts

```text
npm ci
  added 61 packages in 1s; no dependency changes.

VITEST_MAX_WORKERS=2 npx vitest run --exclude scripts/cryo-model-preview.test.mjs --maxWorkers=1
  Initial integration run: 8 failed | 240 passed | 1 skipped (249 files).
  11 failed | 2908 passed | 1 skipped (2920 tests).
  Presentation pins/integration defects were corrected; unchanged load-sensitive
  renderer/HUD failures passed isolated reruns without timeout changes.

VITEST_MAX_WORKERS=1 npm run verify
  Final aggregate: Test Files 2 failed | 246 passed | 1 skipped (249).
  Tests 2 failed | 2921 passed | 1 skipped (2924); 455.16s.
  Failure 1: imported I5Cadence Breacher 1.8333333333333333 > 1.8.
  Failure 2: new fire-card presentation pin expected RULE, actual LIMIT.
  That pin was corrected to match the approved restriction label, then:
    npx vitest run tests/UiScreens.test.ts --maxWorkers=1
    Test Files 1 passed (1); Tests 34 passed (34); 24.97s.
  The imported I5Cadence failure is the remaining unresolved JavaScript failure.
  verify stops at Vitest; it does not reach the Python chain in this run.

Final pure contract/persistence/capture/adapter suite
  Test Files 5 passed (5); Tests 41 passed (41).
Desktop HUD zoom/regression rerun
  Test Files 1 passed (1); Tests 18 passed (18).
Other affected UI + unchanged renderer timeout retries
  Passed in the isolated 12-file run; its remaining failures were the later-fixed
  640x360 HUD fit and the independently reproduced imported I5Cadence.

node --test scripts/cryo-model-preview.test.mjs
  tests 2; pass 2; fail 0.
npm run build
  tsc --noEmit passed; Vite built in 1.01s; existing chunk-size warning remains.
npm run test:room-evidence
  tests 28; pass 28; fail 0.
  {"passed":true,"cpuOnly":true,"checks":33}
npm run test:smoke
  Checkpoint feedback passed: vanished Continue, cross-tab refresh, failed-write,
  removal, stale Continue, warnings and recovery.
  Combat Rig smoke passed: Arc Shift/Q/F/V, Overdrive, menu/pause/typing,
  Continue rig-select/starting-boon/legacy.
  Audio wiring passed: native firing/ability, live buses, pause/mute silence,
  clear/checkpoint/death stingers.
  Browser smoke passed: desktop, production Pages subpath, assets, fire,
  weapon switch, pause/resume, credits. Zero errors.
npm run test:authored-smoke:all
  passenger-vault, breached-loading-bay, overload-floor passed;
  native desktop keyboard move/fire; errors:[] in all three.

Direct unchanged Blender-dependent asset test
  python3 tools/assets/passenger-vault/test_monitor_artifacts.py
  Ran 2 tests; FAILED (errors=1): FileNotFoundError: blender.

Final captures
  x3-final: 59 accepted PNGs / 7 sprite sheets; 0 failures/errors/font fallbacks.
  x3-final-720: 59 accepted PNGs / 7 sprite sheets; 0 failures/errors/font fallbacks.
  One CSS-only exact augment-draft replacement per gallery; JS bytes identical,
  per-shot provenance and original evidence retained.
```

Gate logs: `/Users/chernodub/.t3/worktrees/containment-game/t3-f6332275/artifacts/nextgen/x3-logs/`.

```text
npm run playtest:smoke
  smoke: room-limit; 3 rooms cleared; 0 errors; defects:[].
  Arc, seed1729; Awakening Bay, Passenger Vault, Residential Gallery all clear.
```

Final source tree is committed locally; no push or PR. All required browser gates, build, Cryo preview and room-evidence checks pass. **The complete Vitest/verify gate is not green:** the imported Breacher cadence assertion remains, independently reproduced on the untouched merge. The separate unchanged Blender probe also fails for the documented missing executable. The stale new UI label expectation was fixed and all34 screen tests pass on rerun. No required gameplay assertion or asset test was weakened to change those outcomes.
