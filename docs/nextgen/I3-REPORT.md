# I3 UI / audio integration report

## 1. What shipped

Branch `t3/integrate-ui-audio-overhaul`. Implementation HEAD `21b7d8ee5f9ab6801ff488c95024c20bbe2585a3` (merge `327e7fba42815af1d45091d987b1f0dabf9b45b1`, parents `481f01e` / `c9dac35`). Final report/evidence commit is supplied in the handoff.

- Full S2 director routing replaces effect-by-effect legacy dispatch when present. UI gestures, settings, drafts, rig equip, pause/resume, checkpoints and terminal beats reach their named cues. Runtime-owned boss/Overdrive announcements play once. World loops clear on actual room exit/revision (including identical environments), pause, loading, visibility/graphics interruption and death. Passive blocking menus keep their UI transport audible while stopping world ambience and music.
- Coarse audio state uses authoritative abilities and actual mutation-adjusted max health; optional Queen phases are forwarded. Reload/switch/death cleanup remains in one `syncCombat` bridge. Production tests observe real AudioContext source starts/stops and source-to-destination bus paths, with native actions and muted/paused zero-scheduling assertions.
- G1 retains shot/hurt/explosion/ability-impact camera ownership through `handlesCameraEffects=true`. Only new hit-stop/final-kill timing transitions add bounded public-method punches, gated by reduced motion and shake strength; G1 applies the actual strength once. No renderer implementation was edited.
- U2's combat text sizing/fan-out now uses the real depth-safe camera-matrix projection. Passive prompt and beat bounds are cached by their owners, so combat numbers and indicators yield without ordinary-frame DOM measurements. Beat cards also yield to projected marine and opaque HUD bounds.
- The title keeps its existing design in a left-side self-sufficient composition, with a readable gradient over 3D. A feature-detected `menuPresentation === 'cinematic'` removes the optional vector ship artwork.

U2 (`t3/nextgen-ui-overhaul-1`, `c9dac35`) is merged into the reviewed ability / I2 graphics / S2 audio base. U2's authored screen hierarchy, passive beats, onboarding, pooled status chips, deterministic presentation clock and v2 capture/comparison tooling remain intact.

### I1b / I2 survival checklist

The audit used `git log --oneline cb8c174..nextgen -- src/ui scripts` and the complete path diffs, including graphics-stream commits inherited by I2. No base functional change was intentionally removed.

| Base change / origin | Location after integration | Preservation evidence |
| --- | --- | --- |
| Physical letter/digit menu shortcuts (`d015c3a`) | `src/ui/screens/ScreenManager.ts`: normalized `event.code` for rigs, drafts, reroll, routes; arrows/Enter retain U2's real map inspection | Existing `UiScreens` non-US physical-key tests retained |
| Physical US key-position controls copy (`d015c3a`) | `src/ui/screens/templates.ts`: U2 keyboard/mouse diagram plus the physical-position sentence | Controls completeness / keyboard tests retained |
| Validated live graphics patching (`d833d71`, `bd45b50`) | `src/ui/gameAdapter.ts`: `resolveGraphicsOptions`, live renderer options and preset ownership | I2 graphics settings/recovery tests retained |
| Avoid applying High/Low presets twice | `setGraphicsTier` checks live preset identity before optional fallback | Native High/Low smoke remains |
| Persistence and context-loss recovery | `src/ui/settings.ts`, `application.ts` settings reapply/context listeners; `scripts/nextgen/integration-settings.mjs` | Persisted override reload + actual WebGL context restoration fixture retained |
| Depth-safe perspective combat text / indicators / crosshair | `gameAdapter.ts` matrix projection, clip depth, positive W, finite coordinates and unmirrored off-screen bearing; native renderer visibility remains | `tests/I2UiProjection.test.ts` retained in full |
| Finite floor-ray radar footprint | `getCameraFootprint` rejects invalid helper and matrix intersections | I2 projection / radar tests retained |
| Shader readiness before native input | `scripts/smoke.mjs`, `scripts/authored-room-smoke.mjs`: actual loading and aria-busy waits | Native fire/movement/resource assertions retained |
| Settled checkpoint reloads (`fb40977`, S2 patch intent) | `scripts/checkpoint-feedback-check.mjs`: two callers of `reloadSettledRoom`, two RAFs + aria-busy false + networkidle | All failed-write/remove, stale Continue and recovery assertions retained; no duplicate sleep |
| Actual ability **and weapon** results receipts | `scripts/nextgen/scenarios.mjs`: brute targets, assisted rifle, 5s real combat; `capture.mjs`: damage/shot/kill/use receipts | Results capture assertion keeps both sources |
| All ten distinct default environments | `scenarios.mjs` / README include Service Shaft Landing for Maintenance | U2 default kiting and G1/I2 room scenarios share list |
| Graphics capture variants / native shader preparation / exposure | All `g1-*` scenarios and benchmark helpers retained | Old baseline/stress fixture IDs remain available |
| Live Arc Pylon + Overclock performance evidence (`fb40977`, `e699b49`) | `stageGraphicsKiting`, `integrationKitingSetup`, `i2-kiting-*`; `debug.realtime` | 3s simulation settlement, visible-threat and zero-program-compilation assertions retained |
| Context recovery and equivalent-room resource checks | `g1-recovery` retains three cycles, restore, draw errors and memory records | Capture metadata keeps recoveryProof |
| HUD stays clear of actual projected marine | `inspectFrame` collects native marine bounds / hudOverlaps; every playing capture asserts empty overlaps | U2 layout/map/feel guarantees added alongside it |
| World ability visuals and GPU draw audit | `capture.mjs` retains live zone/deployable mesh checks, audited boss/settings draws | No renderer implementation edited |
| Full graphics metadata | `inspectFrame`: interim mesh counts, draw errors, settings, lighting, pooled lights, luminance samples, inverse projection, shader/recovery/performance proofs | Combined with U2 layout/map/presentation metadata rather than replacing either return |
| UI pooled HitConfirmation + aim reticle | Existing UI import and native depth visibility remain | `tests/I2UiProjection`, reticle and native input gates retained |
| Capture clocks from both streams | `debug.ts` explicit U2 feel opt-in and I2 realtime benchmark opt-in; both lifecycle tests retained | `UiCaptureClock` keeps both conflicting tests |
| Target receipt budget (reviewed ability fixes) | `tests/HudSystems.test.ts` budgeted target/source receipt test retained alongside all U2 additions | Aggregate tick totals never become duplicate floating damage |
| G1 shader warmup / lighting / finish fixes | Base `src/render/**` unchanged | Inherited renderer tests and draw/preparation checks remain required |

## 2. Captures and critique

Review round 1: `integration-3-round1`, 1920×1080, 31 successful PNGs plus one honest reactor staging failure. Opened title, Arc rig, starting boon, route, settings, controls, real results, entry/boss beats, onboarding and Awakening Bay kiting sprite. Critique: damage receipts could cross coaching copy; the first legal reserved firing angle consumed the useful projected floor around the reactor core. Fixed a cached passive-overlay obstruction registry (no extra per-frame measurement) and camera-visible lane scoring while preserving the 18 staged / 12 visible target gates and 65-unit spacing. Also constrained title copy to the left 45% and calibrated its existing type size to fit that width.

Review round 2: `integration-3-round2-720`, 1280×720, 35 PNGs / no failures or browser errors. Opened title, controls, boss intro and both reactor/Awakening Bay kiting sheets. The first fixes held, with all four burst frames passing native movement/fire/ability assertions. Critique: the wide beat card touched the right status panel at 720p. Added cached beat placement against actual perspective marine and chrome bounds, and registered the beat's passive bounds so damage/indicator decoration also yields. The matching DOM regression verifies both desktop sizes, no overlap, viewport fit, unchanged simulation and no ordinary-frame measurement.

The first full ten-environment final attempt exposed two further camera-dependent fixture failures (Atrium: 13 staged targets; Containment: 14). Both failed the original eighteen-target staging gate. The harness now settles the actual follow spring after the real dash, then tries bounded alternate legal starting lanes with fresh real room attempts through the validated route helper if necessary. It keeps the native camera, 65-unit spacing, eighteen-target staging gate, twelve-visible-target burst gate, actual fire and movement assertions. The failed attempts are retained separately; final successful evidence is recorded below. One retry experiment legitimately cleared an emptied encounter while waiting for recharge; retries now re-enter through the validated room helper. A later Containment burst dropped to eleven visible targets and failed the unchanged per-frame assertion; the final fixture retains eighteen initially visible targets there and in the other ordinary default rooms. The Atrium uses fifteen initially visible targets plus legal offscreen threats (twenty total in the observed proof, fourteen–sixteen visible through the burst). This explicitly adapts the old whole-room staging filter to the approved closer camera while retaining the eighteen-world-threat and twelve-visible-per-frame acceptance gates, spacing, native actions and simulation numbers. The capture-only correction passed the unchanged ten-room geometry/action and gallery suite: 2 files / 17 tests, including explicit alternate-lane cases for Atrium and Containment.

Final 1080p label **`integration-3`** contains **153 accepted frames / 33 sprite sheets**, assembled from 113 unaffected primary captures and the final **40-frame / ten-sheet** kiting batch. The consolidator asserts identical application source/assets between batches, zero page errors, only the known superseded fixture failures, and all ten replacement rooms × four frames with unchanged acceptance checks. Every item retains `sourceCapture` / `sourceSHA`; `provenance.json` and `consolidate.mjs` make the assembly reviewable. The failed attempts are left intact. The production application bundle is identical across those commits (`index-OCE-juIX.js`); only capture harness/docs/tests changed after application SHA `8dccfd3`.

Opened the all-ten-environment motion contact sheet and all-sixteen-ability contact sheet, plus individual final title/settings/rig/results/beat/Atrium frames. UI/chip placement stays clear across bright Cryogenics/Security and dark Maintenance/Infested scenes. Enemy bodies and interim ability surfaces remain the inherited graphics work, with the later V2/world streams responsible for their polish.

Final 720p label **`integration-3-720`**: **61 frames / 11 sprite sheets**, 28 expanded scenarios, no failures, no browser errors and no font fallbacks. Both viewports use hardware **ANGLE Metal / Apple M1 Pro**, DPR 1, High defaults (the separately labelled settings-recovery fixture deliberately validates saved overrides).

| Final label | Viewport | Frames | Sprite sheets | Failures / errors / font fallbacks |
| --- | --- | --- | --- | --- |
| `integration-3` (provenance-preserving assembly) | 1920×1080 | 153 | 33 | 0 / 0 / 0 selected evidence |
| `integration-3-kiting-final` (single clean ten-room run) | 1920×1080 | 40 | 10 | 0 / 0 / 0 |
| `integration-3-720` | 1280×720 | 61 | 11 | 0 / 0 / 0 |

`integration-3-compare/compare.html` embeds 153 aligned views against round 1 and explicitly labels missing counterparts. Opened final 720p Arc, route, settings, boss-intro, title, boss and critical-health frames; the revised beat has clear space before the right status panel, with no marine overlap. The primary UI fit and projected-marine clearance assertions pass at both sizes.

### First eight review files

1. **Title:** `/Users/chernodub/.t3/worktrees/containment-game/t3-0f49d5c5/artifacts/nextgen/integration-3/title.png`
2. **Arc rig at 720p:** `/Users/chernodub/.t3/worktrees/containment-game/t3-0f49d5c5/artifacts/nextgen/integration-3-720/rig-select-arc.png`
3. **Descent map at 720p:** `/Users/chernodub/.t3/worktrees/containment-game/t3-0f49d5c5/artifacts/nextgen/integration-3-720/route.png`
4. **Pause settings at 720p:** `/Users/chernodub/.t3/worktrees/containment-game/t3-0f49d5c5/artifacts/nextgen/integration-3-720/pause-settings.png`
5. **Real combat results:** `/Users/chernodub/.t3/worktrees/containment-game/t3-0f49d5c5/artifacts/nextgen/integration-3/results.png`
6. **Boss-intro beat at 720p:** `/Users/chernodub/.t3/worktrees/containment-game/t3-0f49d5c5/artifacts/nextgen/integration-3-720/beat-boss-intro-fixture-awakening-bay-sprite.png`
7. **Ten-environment motion review:** `/Users/chernodub/.t3/worktrees/containment-game/t3-0f49d5c5/artifacts/nextgen/integration-3/review-kiting-contact.png`
8. **All sixteen live abilities:** `/Users/chernodub/.t3/worktrees/containment-game/t3-0f49d5c5/artifacts/nextgen/integration-3/review-abilities-contact.png`

## 3. Gate results

```text
npm ci: 61 packages installed; no dependency changes.
npx vitest run --exclude scripts/cryo-model-preview.test.mjs
  (VITEST_MAX_WORKERS=1; final standalone run includes the two added lane cases)
  Test Files 184 passed | 1 skipped (185)
  Tests      2357 passed | 1 skipped (2358)
node --test scripts/cryo-model-preview.test.mjs
  tests 2; pass 2; fail 0
npm run build
  tsc --noEmit + Vite passed; existing large-chunk warning remains
npm run test:room-evidence
  tests 28; pass 28; fail 0; ragdoll {passed:true,cpuOnly:true,checks:33}
npm run test:smoke
  Audio wiring passed: production Start, native firing/ability, named live bus paths,
  one opening pause cue, zero paused/muted scheduling, real clear/checkpoint/death stingers.
  Combat Rig smoke passed: live Arc, Shift/Q/F/V, HUD, Overdrive,
  menu/pause/typing gates, Continue rig-select/starting-boon/legacy.
  Browser smoke passed: desktop, production Pages subpath, assets, fire,
  weapon switch, pause/resume, credits. Zero errors.
npm run verify
  JavaScript suite and Cryo checks passed; Python reaches documented pre-existing
  FileNotFoundError: blender in test_monitor_artifacts.py. No Blender/test changes.
```

```text
npm run test:authored-smoke:all
  passenger-vault, breached-loading-bay, overload-floor: passed;
  native desktop keyboard move/fire, errors:[] in all three.
```

```text
npm run capture -- --label=integration-3-kiting-final --scenarios=combat-kiting --burst=4 --keep-going
  40 PNGs verified / 10 sprite sheets; all ten environments; 0 failures/errors.
node artifacts/nextgen/integration-3/consolidate.mjs
  Consolidated 153 successful frames / 33 sheets, all ten environments,
  identical application source; failed attempts preserved.
npm run capture -- --label=integration-3-720 ...
  61 PNGs verified / 11 sprite sheets; 0 failures/errors/font fallbacks.
npm run capture -- --label=integration-3-compare --compare=integration-3-round1,integration-3
  153 aligned views; missing counterparts labelled.
```

Final complete Vitest rerun after the capture-fixture corrections: **184 files passed / 1 skipped; 2357 tests passed / 1 skipped**, 158.45s. The earlier aggregate verify run had 2355 passing tests before the two additive alternate-lane cases, then reached the known Blender failure. No timeout, assertion or repository worker configuration was changed.

Full gate logs live in `artifacts/nextgen/integration-3-logs/`.

An initial sandboxed Vitest invocation could not bind local test servers (`listen EPERM`) or launch browser tests; subsequent validation uses approved local browser/server access, without changing assertions or timeouts.

## 4. Tests rewritten / removed

All U2 approved presentation rewrites are retained and documented in `plans/U2.md`: full maps replace old route grids; compact settings replace old scrolling disclosure; contextual onboarding replaces the permanent controls strip; actual screen fit, action bar clearance, focus and all native input/save assertions remain. Conflicting I2 receipt/clock tests were combined with U2 tests, not discarded. I3 additions: `UiIntegrationPresentation` verifies native camera ownership and once-only timing punches with comfort gating; `UiAudioIntegration` uses the real director/simulation to prove exclusive routing, loop lifecycle, terminal/ready/boss cue deduplication, checkpoints, health normalization and silence; `UiScreens` adds cinematic-art fallback and left-45% native action/fit regressions; `UiOnboarding` protects coaching from real projected receipts and releases cached bounds on disposal; `UiBeats` verifies passive projection-aware placement, HUD/marine clearance and cached sizing. No I3 test was deleted and no invariant was weakened.


| Retained U2 test changes | Equivalent guarantee retained |
| --- | --- |
| `UiScreens` | Real complete/legacy descent maps replace the route grid; catalog rules, all run counters, meaningful build/source composition, keyboard actions/tooltips and 720p–1440p fit remain asserted. |
| `UiSettings` | Compact visible native settings replace the advanced disclosure/scroller pins; preference validation, presets, native focus and audio persistence remain. |
| `HudSystems`, `HudHarness`, `WeaponHud` | Contextual prompts replace the permanent controls strip; full action-bar clearance, mouse/keyboard/held-fire behavior, resize and marine safety remain. Both receipt-budget and new U2 toast/tooltip tests survive. |
| `SafeRoomLoading` | The RAF fixture instantiates the real fixed-step feel controller; loading freeze, discarded pending input and user-pause assertions remain. |
| `UiCombatPresentation` | Adds independent target/source fan-out, pooled status glyphs, projected height sizing and passive rules without removing receipt/budget guarantees. |
| `UiOnboarding`, `UiBeats`, `UiFeel` | New success-only preference/lifecycle, passive/reduced-motion/skip and all-four-rig deterministic replay guarantees. |
| `UiAdapter` | Complete-director exclusive dispatch, partial legacy fallback, camera comfort and renderer ownership remain covered. |
| `UiCaptureClock`, `U2CaptureHarness`, `U2KitingFixture` | Both explicit feel and realtime clocks survive; PNG/sprite/compare integrity and legal ten-room native simulation actions remain. I3 changes lane selection, not acceptance counts/spacing. |

## 5. Integration requests

Renderer/synthesis ownership stays intact. No integration change is required for correctness. The later world pass should review the legacy Queen's framing at 720p: her large model can reach the top edge/under the boss bar while the marine and UI remain clear. This is inherited world/camera composition, outside the permitted renderer-edit scope. Later graphics streams can replace the interim ability renderer and advertise `menuPresentation === 'cinematic'`; the DOM then yields its optional right-hand ship art while retaining its left-side front door.

## 6. Known gaps / assessment

No simulation numbers, synthesis, renderer implementation, checkpoint schema, dependencies or remote state were changed. The legacy Queen can be partly cropped near the top edge at 720p; the world stream should finish that encounter composition. The title still uses U2 vector art until the later renderer supplies its cinematic flag; world and ability visuals remain the inherited I2/interim version. Heavy kiting intentionally stresses readability with legal staged enemies and invulnerability; it is not an organic balance playthrough. Hardware capture and scripted presentation evidence do not certify worst-case frame budgets or organic full-run balance. Presentation-only hit-stop/final-kill timing does not stop the audio clock; the contracted hostile Overclock mix retiming is wired. Listening on real speakers/headphones remains necessary for perceived audio quality. Blender is not installed, as documented by engineering; no asset tests are modified.

### Initial validation attempts

The first unrestricted full run overlapped multiple capture/verification jobs on the shared machine and hit original 5s/30s timeouts across unrelated audio synthesis, geometry and desktop DOM suites. The complete suite then passed with one worker, unchanged timeouts/assertions: **184 files passed / 1 skipped; 2355 tests passed / 1 skipped**, 205.12s. The serial worker setting is execution-only, not a repository config change.

The first smoke passed native gameplay, volume/mute persistence, pause, checkpoint feedback and Combat Rig assertions, then failed the unchanged final network assertion on one aborted Passenger Vault equipment GLB during the heavily contended run. The stable-build serial rerun passed the full smoke and unchanged network assertion with zero errors, including the new audio proof; no network failure was filtered.
