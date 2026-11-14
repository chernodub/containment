# I10 bounded remote camera follow-up

Parent-owned baseline C04 already fixes the actual nearby Armory group and preserves the original room/HUD/continuity assertions. This follow-up changes only `RoomCombatFraming.ts`, the optional final-remote policy in `HudCombatFraming.ts`, and additive CPU camera tests. No renderer ordering, simulation, actor geometry, room layout, UI, resources or balance changes. No browser, build, distribution write or commit by this implementation agent; root owns native acceptance and the combined commit.

## Problem and behavior

The original AA Breacher mid snapshots had four remote selected-body failures that are geometrically feasible under the actual user constraints: Atrium r4 (Brute10.43m), Crew Checkpoint r5 (two Spitters~9m), Breached Loading Bay r8 (focused Spitter12.38m) and Coolant Plant r13 (Brute9.16m). C04's immediate final solve intentionally applied only to nearby≤5.5m or primary-boss contacts, because applying the unconstrained remote correction directly caused5–10m wall-adjacent camera pops. The earlier room clamp also restarted remote correction at its zero-outside pose on every frame.

Remote-only final correction now starts from the previous rendered x/z/zoom, reuses the existing product engagement solver and room/body projection, then presents only a bounded valid intermediate pose. Normal motion caps are .5m and .04zoom per60Hz frame; reduced motion caps are .25m/.02. Faster frames scale these caps down by dt; slower frames retain the same absolute cap. Dwell, room/shallow zoom derivation and the ordinary camera springs remain unchanged. No per-frame arrays, vectors or closures are allocated by this path.

The intermediate hero-floor zoom is recomputed independently of the pan fraction. This matters when a moving marine invalidates a previously exact100px pose: coupling zoom to the fraction of a long pan could freeze the old pose below100px. Each accepted proposal checks actual full-marine eight-corner HUD clearance, reference100px hero scale, exact qualified AABB area and centered genuinely-small axes, plus actual movement/zoom bounds. The base safety pose is an alternative bounded goal. An invalid proposed correction is never rendered. The previous pose is held only if it is still valid for the current player/viewport; otherwise the existing valid base safety result takes precedence. Abrupt teleports/configuration changes that admit no bounded safe intermediate can therefore retain the existing safety correction behavior; the continuous paths below do not require that fallback.

Nearby urgent C04 fitting is unchanged. Reset clears the retained remote-progress state. Leaving engagement eases back toward the ordinary safety/composition result. `refreshFit` always describes the actual presented matrix, so native bearings continue until the full selected body enters the usable viewport; no false fit is asserted for the intermediate path or an impossible remote layout.

## Explicit presentation preference spent

The initial ordinary solve retains .06×usable-half-width / .10×usable-half-height pair padding and the existing marine composition envelope. The final remote-only fallback may spend those extra preferences to4CSSpx, then1CSSpx body-edge padding, with the marine allowed throughout that same usable rectangle. Its body-protection projection uses the requested pixel margin rather than the ordinary .025×half-viewport pad. R8 has a constructive fit with only~1.8px marine-head/~3px Spitter-foot clearance, so requiring4px would incorrectly declare the user contract infeasible. Full actual body geometry, HUD edges, hero≥100px and the18%/small-axis room rules remain strict. No existing test limit or assertion was lowered.

## CPU evidence

`OrganicRemoteFraming.test.ts` adds four exact recovered AA source-camera/body cases at1920×1080 and1280×720, normal/reduced motion,60/120/30/20Hz. Original independent body bounds and hero spans must match the saved receipts. Every intermediate frame checks the motion caps, hero floor, full marine bounds and qualified room limits; all four selected sets settle and remain inside within3s. The240-frame moving Coolant marine path reaches~5.4m/s, explicitly encounters invalid prior100px poses, and retains hero/body/room/cap assertions. Reset preserves centered small-axis framing without stale remote state.

`OrganicCampaignCameraReplay.test.mjs` is opt-in file-only analysis, not a default artifact dependency. It reconstructs the exact camera from each original saved .65m point/depth and fixed CameraRig orientation, derives each active body's height from its saved top and independently verifies all other bounds, then replays every original active/focused selection. It never changes source snapshots and writes no copied test files beneath artifacts. On all16 original AA Breacher mid snapshots, every original selected body set settles and remains fitted; every frame retains hero, full marine and qualified room checks. Remote corrections retain the stricter .5m/.04 caps; nearby contacts retain authorized immediate C04 fitting.

Receipt: `artifacts/nextgen/i10/remote-camera-all-mids-replay.json`, including original JSON SHA256, raw framing, selected IDs, final bounds, actual room diagnostics and all observed movement maxima. Normal static replay results:

| Original remote frame | First full-body fit | Largest step | Largest zoom step | Final hero px | Final AABB outside |
|---|---:|---:|---:|---:|---:|
| r4 Atrium | .067s | .5m | 0 | 118.97 | .16016 |
| r5 Crew Checkpoint | .117s | .5m | 0 | 107.37 | 0 |
| r8 Breached Loading Bay | .117s | .5m | .02058 | 100.03 | 0 |
| r13 Coolant Plant | .067s | .5m | .01147 | 100.41 | .00906 |

These are deterministic CPU camera-policy/projection observations, not GPU or live-campaign performance. The replay freezes the saved simulation geometry; root must still inspect native captures and rerun live campaigns, gates and hardware benchmarks on the final combined source. The actual playable-hull fraction remains a separate diagnostic from the qualified AABB rule.

Final scoped command: `I10_CAMERA_REPLAY_DIRECTORY=artifacts/nextgen/playtest/i10-breacher-1729 I10_CAMERA_REPLAY_REPORT=artifacts/nextgen/i10/remote-camera-all-mids-replay.json VITEST_MAX_WORKERS=1 npx vitest run src/render/camera tests/NextgenCamera.test.ts`. Existing wall-continuity limits (<.65m and<.055zoom), room sweeps, HUD checks, nearby Armory and Annulus/Queen tests are retained verbatim. Final results appended below after the last run.

Final validation: **9 files/120 tests passed**,12.32s wall time, with the opt-in all16 original-mid replay included. `npx tsc --noEmit` and `git diff --check` pass. Parent's separate native kiting-fixture CPU sweep also reports all50 room/size cases passing with their existing counts/spacing/phase assertions; that is parent-owned evidence, not a browser run by this agent. Camera product source is frozen after this handoff pending any real native failure.
