# F2 — desktop application recovery, input, HUD and loading

Branch: `t3/fix-ui-recovery-accessibility`. Implementation before the final evidence commit: `6a6e5cdd71b1110ac7f0555db068eab15c28d081`. No push or PR.

## Findings and regressions

1. Hit-stop holds whole deferred steps until the stop expires; deferred time is preserved. `F2Feel`: “holds whole deferred steps through frames entirely inside hit-stop”; `F2NativeUi`: “replays browser-event-timed physical inputs identically across queued hit-stop frames”. Existing four-rig fixed-step replay tests remain.
2. Graphics loss blocks the application independently of the active screen. Reload stays available; every game action is blocked, the background is inert/aria-hidden, restoration remains held, and combat requires Resume. `F2NativeUi`: parameterized “graphics loss blocks %s” plus “restoration from combat never resumes until the native Resume action”; actual WebGL loss/restore is captured in `f2-recovery`.
3. Focusable UI owns keyboard defaults and clears held gameplay intent. Canvas click restores gameplay focus; physical codes, modifier filtering and body/canvas Space assist survive. `F2NativeUi`: “native focused HUD Space pauses, Shift+Tab does not dash, and canvas reclaims gameplay focus”; existing `A1InputReview` and `InputController` tests retained.
4. Tab containment precedes repeat rejection. HUD, world and signature are inert and aria-hidden while blocked. `F2NativeUi`: parameterized “held Tab and Shift+Tab remain inside the %s blocking screen”, 30 repeated keydowns in each direction.
5. Panels and drawers use native scrolling at short desktop CSS viewports; drawer Back stays sticky. Dense draft cards become one column without hiding their rules. `F2NativeUi`: full action reachability matrix at 640×360, 960×540, 1280×720, 1920×1080, 2560×1440 and 3440×1440, including every title drawer and pause tab.
6. Finale pacing observes authoritative zero threats, including queued waves and bosses. The penultimate kill cannot arm it. `F2Feel`: “arms finale only after the authoritative zero-threat transition, never the penultimate death” and “also observes zero threats without a corpse callback”.
7. Every combat-text fan-out candidate checks cached onboarding/beat obstacles. `F2Hud`: “every fan-out candidate yields to onboarding and beat rectangles”, retaining three visible independent receipts.
8. Escape closes Settings, Controls and Credits and restores the launcher. Overlay-scoped binding also fixes the duplicate HUD/title Credits ID lookup. Pause Escape keeps the existing resume-from-slider contract; required choices never commit on Escape. `F2NativeUi`: three “Escape closes title %s and restores launcher focus” cases, each asserting the drawer actually opened first.
9. Failed Continue refreshes availability, restores Start focus, and shows a visible toast in a polite live region. A real storage event updates the title without a reload. `checkCheckpointFeedback`: vanished native Continue action plus same-origin sibling-tab add/remove/re-add; all previous persistence checks retained.
10. Hurt events carry optional finite `sourceX`/`sourceY` from contact, projectile launch, pool and boss-area origins. Indicators never reuse an attack telegraph to infer a later hit. `F2DamageOrigin` covers every call site and unknown origins; `ThreatIndicators`: “never reuses a cached spitter bearing for source-less damage”. No simulation values changed.
11. Renderer/audio code loads beside actor models; four HTML model preloads begin before application evaluation. Run-screen templates load on demand. Optional Rapier/ragdolls start after the first rendered frame, attach to the latest room and never backfill old corpses. Worker/catalog synthesis remains deferred behind the existing audio gesture path. `F2Loading` covers readiness and fallback; `startup-smoke.mjs` measures five cold production starts at `/containment/` and rejects software GPUs. CSS remains eager and the actual model-completion progress remains unchanged.
12. Ability tooltips use cached anchor rectangles, ResizeObserver/scroll/resize and HUD-placement revisions. Measurements happen in the presentation frame. `F2Hud`: “pointer movement never measures ability anchors or tooltip layout” observes zero rectangle reads across 100 pointer events.
13. Native InputController, real focused HUD actions, browser-event replay, every recovery screen, repeated Tab, stale Continue, penultimate timing, fan-out and the desktop layout matrix are now covered. Reproducers in `/tmp/r2-review` were read and ported; temporary isolated original-code probes reproduced eight expected timing/input/recovery/Escape failures and were removed.

## Bundle and startup measurements

Five cold browser contexts per batch, 1280×720, DPR 1, hardware **ANGLE Metal / Apple M1 Pro**. JS is the sum of completed script resources observed at title readiness, including dependencies; gzip is computed from the delivered files. Request counts include the document. First playable timing includes native Start → equip → boon actions and waits for the real room hold to clear. These are startup measurements, not frame-budget certification. Final batch timings vary with the shared machine; the earlier after batch is retained separately.

| Metric | Before | Final after |
|---|---:|---:|
| Initial JS raw | 4,607,455 B | 1,735,446 B |
| Initial JS gzip | 1,548,637 B | 467,271 B |
| Requests at title | 51 | 63 |
| Requests at first playable frame | 58 | 72 |
| Median time to title | 6.859 s | 5.977 s |
| Median time to first playable frame | 11.616 s | 9.339 s |

Entry chunk: 4,527.28 kB / 1,544.51 kB gzip → 217.71 kB / 69.53 kB gzip. Optional physics: 2,862.17 kB / 1,097.84 kB gzip. The renderer still has a 1,043.47 kB chunk; deeper room-art splitting belongs to the concurrent graphics streams. Requests increased because code now arrives in staged chunks.

Raw measurement files: `artifacts/nextgen/f2-loading-before.json`, `f2-loading-after.json` (earlier batch), `f2-loading-final.json` (reported final batch).

## Accessibility by screen

Every row below has repeated Tab/Shift+Tab containment, inert/aria-hidden background, native focus, graphics interruption coverage, and the six-size mouse/keyboard action matrix.

| Screen | Keyboard / focus | Escape | Zoom |
|---|---|---|---|
| Title | Native launchers; visible focus | No implicit action | Scrolls at short desktop sizes |
| Settings drawer | Native selects, ranges, switches, links; Back focus on entry | Close; focus Settings | Native scroll; sticky Back |
| Controls drawer | Native Back; readable reference | Close; focus Controls | Native scroll; sticky Back |
| Credits drawer | Native links and close controls | Close; focus Credits | Native scroll; sticky Back |
| Rig select | Arrows/physical digits inspect; Enter equips | Focus screen heading, preserve selection | Scrollable panel |
| Starting boon / reward draft | Physical digits install; R only when allowed | Preserve required choice; focus heading | One-column cards at short sizes; scroll |
| Shop | Native Collect and affordable purchase buttons | Preserve allocation; focus heading | Scrollable panel |
| Route | Arrows inspect, Enter confirms, physical digits route | Preserve route; focus heading | Scrollable panel/map |
| Destroy confirmation | Only explicit Destroy dispatches destruction | Preserve decision; focus heading | Scrollable panel |
| Pause: Resume / Loadout / Settings / Controls | Native tabs with arrows/Home/End; all controls and Resume reachable | Resume, including from a range control | Scrollable panel; action matrix covers all tabs |
| Dead / complete results | Native restart/title actions; no held-fire activation | Focus heading; never restart implicitly | Scrollable panel |
| Graphics recovery | Reload available; Continue disabled until ready; prior control or safe panel focus restored | Keeps run held | Recovery panel fits short viewports |

## Visual evidence and critique

Capture label `f2`, hardware GPU, no accepted capture errors. At 640×360, title/settings scroll; the native action matrix verifies reachability beyond the initial screenshot. The first visual review exposed the underlying title launcher retaining focus and a lazy pause-template race; drawer entry focus and native-control readiness were corrected. Second review opened title/settings, real context recovery, native focused pause and the frozen-pose fallback. Close and Resume remain clearly reachable, the recovered game remains held, and the non-physics corpse is readable while it tosses/settles. The four-frame fallback burst was opened and reviewed: the frozen crawler tosses, slides and settles without affecting the marine or game state. No renderer appearance implementation changed.

First screenshots for the lead:
- `/Users/chernodub/.t3/worktrees/containment-game/t3-3a5f07c9/artifacts/nextgen/f2/640x360/title.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-3a5f07c9/artifacts/nextgen/f2/640x360/title-settings.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-3a5f07c9/artifacts/nextgen/f2/title.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-3a5f07c9/artifacts/nextgen/f2/title-settings.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-3a5f07c9/artifacts/nextgen/f2/f2-recovery.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-3a5f07c9/artifacts/nextgen/f2/f2-pause-focus.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-3a5f07c9/artifacts/nextgen/f2/f2-fallback-corpse.png`

## Gate results

```text
npm ci
  added 61 packages in 2s; no dependency changes.
VITEST_MAX_WORKERS=1 npx vitest run --exclude scripts/cryo-model-preview.test.mjs --maxWorkers=1
  Test Files  196 passed | 1 skipped (197)
  Tests       2458 passed | 1 skipped (2459)
  Duration    320.35s
node --test scripts/cryo-model-preview.test.mjs
  tests 2; pass 2; fail 0
npm run build
  tsc --noEmit passed; Vite built in 1.95s; existing large-chunk warnings remain.
npm run test:room-evidence
  tests 28; pass 28; fail 0
  {"passed":true,"cpuOnly":true,"checks":33}
npm run test:smoke
  Checkpoint feedback passed: vanished Continue announcement, real cross-tab storage refresh,
    failed write, same-screen recovery, failed removal, pause/title warning,
    stale Continue suppression, recovery.
  Combat Rig smoke passed: live Arc selection, Shift/Q/F/V receipts and HUD,
    Overdrive fill/active, menu/pause/typing gates, Continue rig-select/starting-boon/legacy.
  Audio wiring passed: production Start, native firing/ability, named live bus paths,
    one opening pause cue, zero paused/muted scheduling, real clear/checkpoint/death stingers.
  Browser smoke passed: desktop, production Pages subpath, assets, fire,
    weapon switch, pause/resume, credits. Zero errors.
npm run test:authored-smoke:all
  passenger-vault, breached-loading-bay, overload-floor: passed;
  real desktop keyboard move/fire; errors:[] in all three.
npm run verify
  JavaScript suite and Cryo checks passed. Python reaches documented pre-existing
  FileNotFoundError: [Errno 2] No such file or directory: 'blender'
  in test_monitor_artifacts.py. No assertion/timeouts or Blender tests changed.
```

`verify` ran before the final drawer/pause subcases were added (2,446 JavaScript tests passed there); the final explicit required Vitest gate above includes all 2,458. Earlier overlapping runs hit unchanged 5-second audio/HUD timeouts; the quiet final run passed without changing tests or timeouts. An initial paused-slider Escape failure was fixed, and the final smoke retained its original assertion.

Final logs: `artifacts/nextgen/f2-logs/`. Captures retain separate `640x360/manifest.json` and `1280x720/manifest.json` under `artifacts/nextgen/f2/`.

Capture summaries:

```text
npm run capture -- --label=f2 --width=640 --height=360 --scenarios=title,title-settings
  2 PNGs verified; hardware Apple M1 Pro; zero errors.
npm run capture -- --label=f2 --width=1280 --height=720 --scenarios=title,title-settings,f2-recovery,f2-pause-focus,f2-fallback-corpse
  5 PNGs verified; hardware Apple M1 Pro; zero errors.
npm run capture -- --label=f2-fallback-motion --width=1280 --height=720 --scenarios=f2-fallback-corpse --burst=4
  4 PNGs verified / 1 sprite sheet; zero errors; opened and reviewed.
```

Motion sheet: `artifacts/nextgen/f2-fallback-motion/f2-fallback-corpse-sprite.png`.

## Test changes / scope / gaps

- No test was deleted and no gameplay/determinism/persistence/desktop assertion was weakened. `HudSystems` now supplies an explicit damage-event origin instead of testing the audited stale-attacker inference. `UiScreens` requires no Resume while recovery is blocking, a disabled recovery Continue and inert HUD. `UiFeel` primes a live threat count before asserting the authoritative zero-threat transition. `SafeRoomLoading` supplies the added application gate/readiness adapters; all its freeze/input/pause assertions remain.
- The capture runner now accepts a 360-pixel-tall desktop CSS viewport. Its original no-scroll checks remain at heights ≥600; shorter desktop views permit native auto/scroll overflow while retaining no horizontal clipping and no off-viewport panel bounds. The actual action matrix verifies every enabled action by native focus, scrolling, viewport bounds and mouse hit testing.
- Renderer edits are exactly two one-line dynamic-import boundaries: `DepthRenderer.ts` imports the deferred UI facade; `assets.ts` imports optional physics only when initialization is requested. No renderer implementation, synthesis implementation, simulation balance, checkpoint schema, dependency, phone control/test, other worktree, push or PR was changed.
- No correctness finding remains intentionally open. The aggregate `verify` cannot complete without Blender, a documented pre-existing environment dependency. No Blender installation or test bypass was attempted. Large renderer/physics chunk warnings remain; physics is optional/background, and room-by-room art splitting should be coordinated with the graphics streams. Hardware speaker listening and worst-case frame-budget certification remain outside these startup/UI checks.
