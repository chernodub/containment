> Historical policy-v1 evidence. Targeted aiming was subsequently corrected and frozen as policy v3 at `e97cf06107c6e23f9f7b96ac94f8b95ba3e7163d`. These receipts retain their original source identities and do not replace final v3 campaign/gate evidence.

# I5 pre-final functional fixture verification

The three requested browser gates passed sequentially against the existing V27b `dist`. This verifies the revised smoke fixture and unaffected desktop gates; it does not accept the balance candidate or replace the final campaign cohort. One owned browser ran at a time, and all owned browsers closed afterward. No source, assertions, timeouts, build output or test parameters were changed by this task. No rebuild, full Vitest, `npm run verify` or full native campaign was run.

Checkout HEAD stayed `7dd620a8242edf73584725bf11d175bdbd101fc9`. The served entry was `assets/index-DG8RN87Z.js`; `dist/index.html` SHA-256 at completion was `6ac982e235ae35a88db5d1f10380ffd1c76471e46ac60d6a132cf495d69ee7e2`.

## Gate summary lines

```text
npm run test:smoke
  Combat Rig smoke passed: live Arc selection, Shift/Q/F/V receipts and HUD,
    Overdrive fill/active, menu/pause/typing gates, Continue rig-select/starting-boon/legacy.
  Checkpoint feedback passed: vanished Continue announcement, real cross-tab storage refresh,
    failed write, same-screen recovery, failed removal, pause/title warning,
    stale Continue suppression, recovery.
  Audio wiring passed: production Start, native firing/ability, named live bus paths,
    one opening pause cue, zero paused/muted scheduling, real clear/checkpoint/death stingers.
  Browser smoke passed: desktop, production Pages subpath, assets, fire,
    weapon switch, pause/resume, credits.
  Attempt 1; exit 0; no retry.
npm run test:authored-smoke:all
  passenger-vault, breached-loading-bay, overload-floor passed;
  real desktop keyboard move/fire; errors:[] in all 3.
  Overload explicitFatalAuthorization:true.
  Exit 0.
npm run playtest:smoke
  smoke: room-limit; 3 rooms cleared; 0 errors.
  Raw defects:[]; wall 95.165 s; unchanged max-wall-seconds=235.
  Exit 0.
```

The Combat Rig phase completed in 68.341 seconds. Its current ordinary-room Overdrive-cap and holdout-exception fixture preserved the ready-ability setup used by the pause/typing assertions. The entire phase passed; no readiness/geometry assertion failure needed triage. Graphics, menu audio, starting boon, gameplay input, paused audio, credits/assets, restart, checkpoint feedback and audio wiring also passed. The restart receipt has `errors:[]`; the known `GLTFLoader` texture-blob failure was not observed. No filtering or permitted retry was used.

Authored-room evidence records desktop 1280×900, Low quality, real keyboard movement/fire and empty errors for all three rooms. Playtest smoke records policy `i5-catalog-ability-aim-v1`, navigation `i5-navigation-observer-v3` and `tuningEnabled:true`. Its three-room `room-limit` outcome is the gate's intended stop, not a full campaign completion.

## Raw evidence and load

Unique logs:

- `artifacts/nextgen/i5-continuation/gate-fixture-smoke-attempt1.log`
- `artifacts/nextgen/i5-continuation/gate-fixture-authored-smoke.log`
- `artifacts/nextgen/i5-continuation/gate-fixture-playtest-smoke.log`

Every log retains an explicit exit code. `gate-fixture-summary.json` consolidates the receipts. Copies of the standard authored and playtest output folders are preserved as `gate-fixture-authored-evidence/` and `gate-fixture-playtest-evidence/`, so later standard gate runs can replace their default artifact directories without losing this verification's reports, traces or screenshots.

Read-only 1/5/15-minute host load averages on 10 logical cores:

| Sample | Load averages |
| --- | --- |
| Before gates | 29.521 / 32.962 / 64.128 |
| After smoke | 86.827 / 48.104 / 63.962 |
| After authored smoke | 95.946 / 58.101 / 66.634 |
| Playtest report start → final save | 92.586 / 58.032 / 66.560 → 144.093 / 81.900 / 74.694 |
| After all gates and closed browsers | 113.246 / 88.271 / 77.850 |

These shared-machine diagnostics do not certify frame-time or CPU/GPU headroom. Historical preparation and texture-lifetime findings remain with the graphics owner. Final balance acceptance and the required final story campaigns remain separate work.
