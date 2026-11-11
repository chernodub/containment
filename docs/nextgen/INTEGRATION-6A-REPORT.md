# Integration 6a — F2 + I4

Worktree branch: `t3/merge-world-performance`. Parents: F2 base `e97fe10217741b442c7cc047ae016c5ac36d04d1` and I4 `de5ca58` (`t3/integrate-world-performance`). Merge commit: `a62b6f188bc217b9f22ee19c35c18e26d1f243cd` (both full parent SHAs retained). Local merge only; no push, PR, other-worktree changes, redesign or balance changes.

## Conflict resolutions

Both parent reports and all three parent file versions were compared before resolution.

- `src/ui/application.ts`: retain F2's application-wide `graphicsHeld` input/simulation hold and its readiness/recovery screen synchronization; retain I4's audio timing accumulation and optional reused benchmark sample/callback. Keep type-only renderer/audio imports, concurrent dynamic code/model loading, initial templates, deferred physics warm-up after rendering, and debug-only observer wiring.
- `src/ui/styles/screens.css`: concatenate the independent changes: F2's native short-desktop panel/drawer scrolling, sticky Back/header, recovery/notice styling and scroll margins; I4's transparent cinematic parent overlay. Preserve the left-side title scrim and I4's separate boss-radar rules in `hud.css`.
- `tests/SafeRoomLoading.test.ts`: supply both F2's graphics gate/deferred-presentation adapters and I4's observer/sample bindings to the actual RAF harness. All original freeze, held-input, reentry and pause assertions remain. Add a case proving an opt-in observer still receives samples while restored graphics block gameplay, rendering can prepare recovery, and deliberate release never replays discarded input.

## Semantic audit and follow-up

- Renderer/audio remain dynamically loaded beside models. Run templates load only on demand; renderer preparation still finishes before input release. Menu feature detection and initial title templates are eager, so cinematic title does not depend on the run-template chunk. Return-to-title captures retain live actors and Continue but assert zero foreign gameplay draws.
- The deferred ragdoll facade delegates to I4's optimized hierarchy implementation after readiness. It retains latest-room/quality handoff and early-death fallback without backfilling corpses. Physics stays optional/background; preparation does not import it eagerly.
- F2's graphics gate remains independent of game status and I4's camera-layer isolation. Renderer preparation/picking use the normal layer; cinematic rendering restores camera mask and autoClear in `finally`; actual context recovery remains held until native Continue/Resume.
- Cached viewport hooks remain shared by combat text, threats and health bars. Extend zero-layout-read projection coverage to all six F2 desktop layout sizes, retaining the original portrait-desktop resize case and all near/far, bearing and mouse-ray assertions.
- Found a capture isolation race: navigation blur invokes the native pause handler on the old combat page, starting a lazy pause-template request during unload and surfacing as `net::ERR_ABORTED` in the next scenario. A traced isolated kiting run passed; the multi-scenario trace showed the request start/abort immediately before navigation. The capture runner now returns the completed fixture to title and settles network activity before its isolation reload. Waiting for idle alone was insufficient because blur started a new request during navigation. It still records and rejects every failed request, console error and page error; no threshold/assertion was weakened. The initial failing manifest/log are retained under `gates/`.
- Weapon/socket sync after V2 pose, shared-light ordering, Queen framing, boss radar, renderer prewarm and opt-in benchmark observer are unchanged from I4. No sustained benchmark or performance-budget signoff is implied by this integration.

## Production bundle

Five cold Chromium contexts at 1280×720, DPR1, native ANGLE Metal / Apple M1 Pro. Initial JS counts completed script resources at title readiness using the unchanged F2 measurement script; gzip uses Node gzip on delivered files.

| Initial JS | F2 | Integrated | Delta |
| --- | ---: | ---: | ---: |
| Raw | 1,735,446 B | 1,793,983 B | +58,537 B (+3.37%) |
| Gzip | 467,271 B | 487,009 B | +19,738 B (+4.22%) |

The new world/renderer code accounts for the growth; this is not an eager-loading regression. Entry is 213.45 kB / 68.19 kB Vite gzip (F2: 217.71 / 69.53). Renderer is 1,101.02 kB / 280.84 kB Vite gzip (F2:1,043.47 kB). No run-template or `DeathRagdolls` implementation/physics payload appears in any initial resource list; only the small deferred facade does. The 2,862.40 kB optional physics chunk remains separate. Vite's compressed-size calculation and startup-script Node gzip have slightly different compression output; the comparison table consistently uses the startup script.

Median title: 6.741 s; first playable: 9.006 s; 64 title requests / 73 playable requests. Shared-host timing is observational. Raw resource inventories and all five runs: `artifacts/nextgen/integration-6a/startup.json`.

## Gates and visual review

All required independent functional gates pass on the integrated application; the aggregate `verify` additionally reaches the documented unavailable Blender check. Gate logs are in `artifacts/nextgen/integration-6a/gates/`.

```text
npm ci: added 61 packages in 1s; no dependency changes
VITEST_MAX_WORKERS=2 npx vitest run --exclude scripts/cryo-model-preview.test.mjs:
  Test Files  215 passed | 1 skipped (216)
  Tests       2580 passed | 1 skipped (2581)
  Duration    126.38s
node --test scripts/cryo-model-preview.test.mjs: tests 2; pass 2; fail 0
npm run build: tsc --noEmit + vite build passed; existing large-chunk warning
npm run test:room-evidence: tests 28; pass 28; fail 0
  {"passed":true,"cpuOnly":true,"checks":33}
npm run test:smoke:
  Checkpoint feedback passed: vanished Continue announcement, real cross-tab storage refresh,
  failed write, same-screen recovery, failed removal, pause/title warning, stale Continue suppression, recovery.
  Combat Rig smoke passed: live Arc selection, Shift/Q/F/V receipts and HUD,
  Overdrive fill/active, menu/pause/typing gates, Continue rig-select/starting-boon/legacy.
  Audio wiring passed: production Start, native firing/ability, named live bus paths,
  one opening pause cue, zero paused/muted scheduling, real clear/checkpoint/death stingers.
  Browser smoke passed: desktop, production Pages subpath, assets, fire, weapon switch, pause/resume, credits.
npm run test:authored-smoke:all: exit 0; passenger-vault, breached-loading-bay,
  overload-floor; real keyboard move/fire; errors:[] in every room
npm run verify: exit 1 at documented FileNotFoundError: 'blender' in test_monitor_artifacts.py;
  preceding Vitest/model and first three Python artifact stages passed
Capture integration-6a 1920x1080: 13 PNGs / 2 sprite sheets; zero failures/errors; hardware Apple M1 Pro
```

The first sandboxed unit run failed at restricted Chromium/HTTP operations; it was rerun with local browser/server access. One unchanged audio-synthesis test exceeded its 5-second timeout while smoke/startup/capture jobs overlapped; the subsequent full verification run passed without changing assertions or timeouts. The final exact standalone Vitest command also passed after all capture fixes (126.38s), in addition to the passing verify-stage suite (129.49s). Failed logs remain available. Blender was neither installed nor bypassed.

Visual review round 1 opened the 1080p title/retained-combat title, calm Armory and four-frame kiting sheet: logotype/focus remain clear, the cast is isolated and the marine is visible above the action bar. Round 2 opened the Queen motion sheet, intro/radar view and actual restored-graphics screen: both actors stay clear of HUD chrome, the radar sits in the reserved bottom band and recovery offers Return to pause/Reload while holding the run. Dense staged brute overlap remains an inherited art limitation; no redesign was attempted.

```text
Capture integration-6a 1280x720: 8 PNGs / 1 sprite sheet; zero failures/errors
Capture integration-6a 640x360: 2 PNGs; zero failures/errors
Combined: 23 PNGs / 3 sprite sheets; matching JS/CSS application fingerprints across all batches
```

Opened the final title at both sizes, retained-title, calm Armory, kiting motion sheet, Queen motion sheet, boss intro/radar at both sizes, actual recovery at both sizes, and short-desktop title/settings. At 640×360 the title and settings intentionally scroll; Back remains visible and the native six-size action matrix verifies offscreen actions can be focused, scrolled into view and mouse-hit-tested. No phone/touch path was added.

All three commands used `--label=integration-6a`; each passing gallery was archived before the next viewport run, so manifests are retained independently. Captures identify application merge commit `a62b6f1`; the later follow-up changes only the capture lifecycle, expanded projection test and this report. `capture-summary.json` verifies matching application assets. First review paths:

- `/Users/chernodub/.t3/worktrees/containment-game/t3-f23f9e6a/artifacts/nextgen/integration-6a/1920x1080/title.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-f23f9e6a/artifacts/nextgen/integration-6a/1280x720/title.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-f23f9e6a/artifacts/nextgen/integration-6a/640x360/title-settings.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-f23f9e6a/artifacts/nextgen/integration-6a/1920x1080/combat-calm-armory.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-f23f9e6a/artifacts/nextgen/integration-6a/1920x1080/combat-kiting-armory-sprite.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-f23f9e6a/artifacts/nextgen/integration-6a/1280x720/i4-boss-beat-fixture-reactor-vault.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-f23f9e6a/artifacts/nextgen/integration-6a/1920x1080/f2-recovery.png`

Full galleries: `artifacts/nextgen/integration-6a/index.html`.

No existing assertion was removed or weakened. The RAF test only combines required fixtures and adds coverage; projection coverage grows. No integration requests for another owner remain. Existing I4 performance-budget misses and documented unavailable Blender remain outside this merge's functional acceptance.
