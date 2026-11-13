# U5 — combat clearance, rig identity and the aftermath

Branch: `t3/u5-hud-combat-ui`. Application/evidence source: `47bead886af689bd258ca6af78ba6db229776ab5`. Final handoff HEAD is reported with this document's commit. Worktree: `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7`. Local commits only; no push or PR.

## Implementation

- **B3, UI half.** The combat dock is 90 CSS px at 1080p and 78 px at 720p, with translucent glass, high-contrast numbers/icons and collapsed secondary labels. Action bar, vitals, objective and radar independently yield to projected actors and hostile warnings. Chrome fades to 30% (radar 35%); a separate red directional edge remains opaque and cannot intercept input. Marine avoidance remains the existing placement solver. Native windups, boss telegraphs, projectiles and pools drive occupancy. Charge extents use the native wall clipping/constants; cancellation/death remove their warning immediately, and Overclock cannot expire the fade ahead of the real attack. Spawn receipts retain bounded presentation timers.
- **B9, numbers.** Same target/source/element receipts accumulate through a 600 ms quiet window, animate the count over 120 ms, then emphasize the settled total. Same-pulse area receipts cannot create separate same-target/source totals. A kill retires the target's other receipts/chips and produces one terminal mark. A 12-node pool prioritizes kills, substantial/critical hits, ordinary hits, then status ticks/chips. Distinct damage elements remain distinct; ambiguous legacy provenance remains neutral. Combat text can be disabled; the new persisted Full/Reduced density keeps totals/kills while hiding small status ticks and chips. Old preference data defaults to Full; checkpoints are unchanged.
- **B13.** Four original SVG marine portraits put helmet/torso and signature equipment at the focal point: ram plate/shield projector, coolant tanks/vents, fuel reservoirs/nozzles, or induction coils/capacitors. Each rig has a three-word fantasy. Idle energy/vents/flicker and a short equip flash/cue respond to selection; reduced motion is static. Existing ability diagrams, keys, mechanics, exact inspection, keyboard selection/equip and 720p fit remain.
- **B14.** Free allocation shows current → after / maximum for health, armor, all four finite ammo reserves and grenades. Every service shows the resulting values including the free allocation, actual price and remaining credit balance. Full or partially wasted recovery is marked; unaffordable rows explain the exact shortfall. Detached public CombatSystem actions preview native recovery-boon conversions without modifying the run. Screen invalidation includes live reward resources.
- **B15.** One full-bleed original inked SVG depicts the reactor flash splitting the ship, the warning reaching New Earth and drifting cryo pods. The exact existing ending remains the sole headline. A staged 1.6 s reveal precedes the quieter archive/replay region; reduced motion gives a static composition. All 16 counters remain behind the native disclosure.
- **Onboarding/beats.** Explanations still require deliberate inspection. Live room/boss beats omit their explanatory paragraph and place their short identification around the measured usable viewport, marine and HUD. Existing native firing/hover, focus, checkpoint, recovery, resize and authored-room assertions remain.

## Renderer call contract

`src/ui/gameAdapter.ts` exports `setHudInsets(renderer, {top,right,bottom,left})`.

- Feature-detects `renderer.setHudInsets`; absence is a safe no-op.
- Values are nonnegative finite **CSS pixels**, independent of device pixel ratio or internal render scale. Invalid values become zero.
- Calls the hook with the renderer as `this` and a copied object; identical values are deduplicated.
- HUD occupancy uses cached measured panel rectangles and nearest occupied edges, with an 8 px clearance. HUD content, font changes, canvas resizing and ResizeObserver panel-size changes invalidate the measurements. Ordinary frames retain the measurement-free fast path.
- Leaving combat or disposing the HUD publishes `{top:0,right:0,bottom:0,left:0}`.
- `U5HudInsets` proves the optional hook with a fake renderer; `U5HudViewport` verifies measured publication, panel-only resizing, reset, dock height, opacity, passive edges and marine clearance.

**Integration gap:** this checkout does not contain the rendering lead's `DepthRenderer.setHudInsets` implementation. UI publication is complete and tested, but camera reframing itself requires that renderer-side landing. No renderer or simulation source was modified.

## Critique → fix rounds

Baseline `u5-before`: 24 accepted native PNGs, no capture errors. Frozen pre-edit build: `artifacts/nextgen/u5-before-dist`, source `84c0c66`. Historical R7 native images were also inspected read-only. A supplemental `u5-before-extra` capture adds the 26 remaining settings/inspection/beat/Armory/boss/recovery frames from the same preserved pre-edit bundle (explicit dist source `84c0c66`); its later capture date does not relabel final pixels as baseline. Together the two before galleries cover the same 50 states/frames as each final gallery, with no failures/errors.

1. `u5-round1`: 32 accepted 720p PNGs and four combat/ability sheets. Native-size and exact 480×270 review caught a cropped ending signal/planet, an undersized shop glyph, narrow free-allocation rules, slightly clipped rig equipment and a wrapping keyboard guide. Reframed the vector plate, fixed glyph padding and ledger width, reduced the short-desktop portrait crop and kept the keyboard guide together. Source review additionally replaced event-expiry guesses with native attack windups and added panel ResizeObserver invalidation.
2. `u5-round2`:seven accepted 720p PNGs before an unchanged fit assertion rejected a stale reduced-motion terminal DOM measurement. Its retained failure PNG shows the settled full-bleed composition. The harness now waits for the matching terminal DOM state and two RAFs **before** inspecting it; no fit assertion was relaxed. Added direct reduced-motion viewport/no-scroll/single-headline/16-counter contracts at both desktop sizes. Exact480×270 review also prompted a stronger 3 px signal line. Final captures repeat both ordinary and reduced-motion endings cleanly.

The intermediate builds/failed manifest remain separate. Final galleries each contain 50 accepted native PNGs and 7 phase sheets, with zero failures/errors/font fallbacks. All 100 exact 480×270 final frames and native-size UI/representative combat views were inspected. `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7/artifacts/nextgen/u5-evidence-audit.json` proves identical before/after filename coverage and all final marine clearances; `u5-review.json` records the reviewed thumbnail inventory. Final application assets are frozen once in `u5-final-dist`; both final resolutions use the same bytes. Captures are staged presentation evidence, not hardware-performance or balance claims. No benchmark/FPS improvement is claimed.

## Before / after evidence

All paths below are absolute. `u5-final-720/` contains the same filenames at 1280×720. Every final native frame also has an exact 480×270 derivative under `review480/`.

| Item | Before | After |
|---|---|---|
| B3 incoming action under dock (historical organic reference) | `/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final2/organic/pyro-r6-armory-mid.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7/artifacts/nextgen/u5-final/combat-kiting-passenger-vault-03.png` |
| B3 matched combat sheet | `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7/artifacts/nextgen/u5-before/combat-kiting-passenger-vault-sprite.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7/artifacts/nextgen/u5-final/combat-kiting-passenger-vault-sprite.png` |
| B9 Cryo full kit | `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7/artifacts/nextgen/u5-before/v2-full-cryo-infested-workshop-infested-workshop-05.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7/artifacts/nextgen/u5-final/v2-full-cryo-infested-workshop-infested-workshop-05.png` |
| B9 Whiteout | `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7/artifacts/nextgen/u5-before/v2-whiteout-awakening-bay-sprite.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7/artifacts/nextgen/u5-final/v2-whiteout-awakening-bay-sprite.png` |
| B13 rig identity | `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7/artifacts/nextgen/u5-before/rig-select-cryo.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7/artifacts/nextgen/u5-final/rig-select-cryo.png` |
| B14 recovery | `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7/artifacts/nextgen/u5-before-extra/u5-shop-recovery.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7/artifacts/nextgen/u5-final/u5-shop-recovery.png` |
| B15 aftermath | `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7/artifacts/nextgen/u5-before/complete-fixture.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7/artifacts/nextgen/u5-final/complete-fixture.png` |
| B15 reduced motion | `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7/artifacts/nextgen/u5-before/u4-ending-reduced-motion.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7/artifacts/nextgen/u5-final-720/u4-ending-reduced-motion.png` |

Two organic-style scripted live combat sheets: `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7/artifacts/nextgen/u5-final/combat-kiting-passenger-vault-sprite.png` and `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7/artifacts/nextgen/u5-final/combat-kiting-armory-sprite.png`. These use the native camera, casts, damage and kiting progression but explicit staged populations. Native playtest evidence is reported separately below.

## Tests and presentation pins

- `U5HudInsets` (new): safe optional adapter, copied input, deduplication, validation, late hook availability and reset.
- `U5HudWarnings` (new): native slow-time windup, cancellation/death, locked spit target/radius, wall-clipped charge corridor and boss target lifecycle.
- `U5HudViewport` (new):90/78px dock limits, translucent fill, marine clearance, CSS-only panel resize, all four panel fades, passive edge markers, warning expiration and disposal.
- `U5RigPortraits` (new): four distinctive original SVG equipment identities, exactly three fantasy words, retained ability/key/selection hooks, original asset policy, short-desktop rules and reduced motion.
- `UiCombatPresentation`:28-node receipt pool pin becomes12; merged numeric text is asserted after the 120 ms count-up. Added 590 ms merge / 630 ms gap, priority, single kill, reduced/off and retained element-color contracts. The existing28px status-chip bound remains unchanged.
- `HudSystems`: same28 → 12 receipt pool presentation pin and count-up settle; all existing native input, HUD clearance, hover/inspection, warning, health-lag and disposal assertions remain.
- `UiSettings` and `I2GraphicsPreferences`: additive validated density preference and native select persistence/default; existing graphics tier/recovery assertions remain.
- `ShopServices`: prior generic capped-copy pins become explicit cap reasons. Added detached-preview parity against actual free/paid purchases, including Field Medic conversion; waste/current/max/balance/shortfall checks. All purchase rejection and credit/progression safeguards remain.
- `UiScreens`: settings control count includes the added density control; shortfall copy also checks capped state. Added live credits/health previews and two reduced-motion aftermath layout/counter contracts. Keyboard, focus, desktop zoom, fitting, navigation and all 16 statistics remain.
- Capture harness: waits for the terminal DOM commit before inspecting geometry and records actual rectangle edges. No viewport, marine, font, input, story or authored assertion was removed or weakened. Added explicitly staged `u5-shop-recovery`.

No new dependency, runtime art asset, license change, phone control or mobile gate. Original SVG/CSS remains repository MIT work. No checkpoint/schema or gameplay change.

## Gate receipts

Logs: `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7/artifacts/nextgen/u5-logs/`.

Initial required `npm ci && npm run build` passed. The first aggregate verify run retained six failures: five stale presentation/default/copy pins, plus one unchanged low-health test whose Vite browser context was destroyed by a concurrent source reload. Corrected pins and the unchanged test then passed in the serialized 96-test UI rerun. Final reduced-motion suite: 42/42. No timing/assertion budget was extended.

```text
npm ci && npm run build
  added 61 packages; tsc --noEmit and Vite build passed (existing chunk-size warning).
Full Vitest gate through npm run verify → npm test → vitest run --exclude scripts/cryo-model-preview.test.mjs
  Test Files  284 passed | 1 skipped (285)
  Tests       3283 passed | 1 skipped (3284)
  Duration    386.30s; one worker for serialized browser ownership.
node --test scripts/cryo-model-preview.test.mjs
  tests 2; pass 2; fail 0.
npm run test:room-evidence
  tests 28; pass 28; fail 0.
  {"passed":true,"cpuOnly":true,"checks":33}
npm run build
  tsc --noEmit passed; Vite built successfully.
npm run test:smoke — unchanged isolated retry
  Checkpoint feedback passed: vanished Continue, cross-tab refresh, write/removal
  failures, stale Continue, warnings and recovery.
  Combat inspection passed: native firing across every weapon and ability opens no panels.
  Combat Rig smoke passed: Arc Shift/Q/F/V, Overdrive, menu/pause/typing, Continue phases.
  Audio wiring passed: native firing/ability, live buses, paused/muted silence, real stingers.
  Browser smoke passed: desktop, production Pages subpath, assets, fire,
  weapon switch, pause/resume, credits.
npm run test:authored-smoke:all
  passenger-vault, breached-loading-bay, overload-floor passed.
  Native desktop keyboard move/fire; errors:[] in all 3.
  explicitFatalAuthorization:true retained for Overload Floor.
npm run playtest:smoke
  smoke: room-limit; 3 rooms cleared; 0 errors.
  report: defects:[]; Arc; seed 1729; wall 95.39 s; unchanged 235 s limit.
Final capture u5-final (1920×1080)
  50 PNGs / 7 phase sheets; failures:[]; errors:[]; fontFallbacks:[].
Final capture u5-final-720 (1280×720)
  50 PNGs / 7 phase sheets; failures:[]; errors:[]; fontFallbacks:[].
Supplemental baseline u5-before-extra (preserved pre-edit bundle)
  26 PNGs; failures:[]; errors:[]; fontFallbacks:[].
```

The first production smoke attempt completed its functional rig checks but retained one `equipment.glb: net::ERR_ABORTED` request during navigation. The unchanged isolated retry passed the full gate. Both logs remain (`smoke-final.log`, `smoke-retry.log`); no request, asset or console assertion was filtered or removed.

`npm run verify` was run again on the final implementation. The entire JavaScript suite and model-preview gate passed, then the unchanged Python monitor probe ran 2 tests and failed 1 because `blender` is absent (`FileNotFoundError: [Errno 2] No such file or directory: 'blender'`). The aggregate is **not green**. No Blender installation, asset alteration or test bypass was attempted. The remaining JavaScript/build/browser gates were run separately and passed as shown above.

Native input evidence: `/Users/chernodub/.t3/worktrees/containment-game/t3-9f3011a7/artifacts/nextgen/playtest/smoke/report.json`, `trace.ndjson`, `hardest-sprite.png` and `u5-organic-rooms.png` in the same directory. These two sheets retain actual unassisted Arc combat, separate from the staged kiting galleries. All 3 native rooms cleared with zero errors/defects; this is the required smoke run, not a full campaign or hardware benchmark.

## Remaining gaps

1. Renderer-side `setHudInsets` must land before camera framing can consume the tested UI contract. The independent dock/fade/number/menu changes are active now.
2. Full aggregate asset verification needs the documented Blender installation on the integration/test host. Its tests and assets remain intact.

