# Containment development

Containment targets desktop browsers with keyboard and mouse. The user removed all phone compatibility and future mobile testing on 2026-10-31. Do not add or run phone/touch-only controls, compatibility branches, captures, CI gates or release requirements. Historical mobile evidence remains historical and is not a release blocker.

Preserve desktop resizing, keyboard accessibility, native mouse and keyboard actions, graphics recovery and checkpoint persistence feedback as product behaviour. The automated test suites were removed by the owner on 2026-11-15 (see below); `npm run verify` is now the type-check and production build.

## Architecture and module map

Keep simulation deterministic and render-free: `src/DepthGame.ts` and gameplay systems use seeded state, not DOM, Three.js, wall clocks or `Math.random()`. Renderer/audio consume snapshots and `GameEffect` events; visual feedback must never determine a hit. `src/game/audio/` is the Web Audio presentation boundary, not simulation logic.

- `src/game/abilities/`: catalog, contracts, deterministic ability runtime and augments.
- `src/render/DepthRenderer.ts`: renderer orchestration; authored rooms and environment modules live alongside it.
- `src/render/post/`, `lighting/`, `atmosphere/`, `camera/`: postprocessing, pooled lights/practicals, environmental layers and camera feedback. High gas uses demanded half-size detached depth snapshots; Low allocates none. Preserve preparation warmup, cached framebuffer ownership, color-only transparent MRT writes and context/tier disposal.
- `src/render/vfx/`, `abilities/`, `world/`: pooled effects, elemental ability presentation and world dressing. The V6 atlas and four CC0 room kits stay lazy on title/settings; gameplay readiness must await asset owners, atlas decode/upload and shader preparation. Preserve atlas/source manifests, pack credits and CC0 licenses.
- `src/render/camera/RoomCombatFraming.ts`: final marine scale and playable-AABB camera constraint. The 18% outside-area bound is against the AABB, not an exact concave hull; retain both diagnostics and full-body HUD clearance.
- `src/render/world/KitDeckArchitecture.ts` adds flush connected access surfaces to three kit floors in the existing pass. Keep floor skins inside the authored hull, clear of voids/obstacles and below `.022m`; they have no gameplay colliders. Named floor mood gains must reset from saved original colors before recalibration. Shaft floor panels own a separate material; preserve the grain shader hook/cache key and exact-once disposal.
- `src/render/world/VerticalRoofSampler.ts`: temporary CPU triangle index for static construction support probes. Preserve native Three raycast heights/material sides/transforms and unsupported-object fallback; query geometry must never enter the render scene or own source buffers.
- `src/render/graphicsOptions.ts`: High/Low presets and validated overrides. Keep Low inexpensive; preserve manual selection, recovery and resource disposal.
- `src/ui/`: DOM/CSS/SVG application, screens, settings, onboarding and HUD, including original illustrated title/ending art. Read snapshots through `src/ui/gameAdapter.ts`; dispatch gameplay through public game methods. Critical HUD numerals keep their opaque local backing when surrounding panels fade.
- `src/game/audio/`: synthesis, cues, preferences, mix engine and audio lifecycle.
- `scripts/nextgen/`: production captures, galleries, debug fixtures, audio audition and realtime benchmark; see its README.
- `src/game/roguelike/checkpoints.ts`: versioned, validated checkpoints. New fields need backward-compatible defaults and corrupt-data rejection. Keep UI preferences separate from run saves.

Preserve the DOM hooks the capture, bench and playtest tools drive (`#start`, `#continue`, `#settings`, `#quality`, `#pause`, `#resume`, `#menu`, `#master-volume`, `#sound`, `[data-mutation]`, `[data-route]`, `[data-purchase]`, `[data-weapon]`, `body[data-state]`) and `window.__containmentPerformance`. Update consuming scripts in the same change if a hook must change. Extend the opt-in `?debug=1` / `window.__containmentDebug` fixture API instead of adding globals.

## Verification (no test suites)

The owner removed every automated test on 2026-11-15: unit/integration tests, Python asset tests, browser smoke and authored-room gates, and their CI steps. Do not add tests, test runners or assertion gates back, and do not spend time on proof infrastructure. The last commit that contains them is tagged `pre-test-removal`.

Verify changes by running the game:

```sh
npm ci
npm run build            # tsc --noEmit + vite build; must pass
npm run capture -- --label=review --scenarios=<relevant>   # then open and look at the PNGs
npm run playtest -- --rig=<id> --seed=1729                 # native desktop bot campaign; must finish without errors
npm run bench                                              # measured scenario comparisons
```

For visual changes inspect the resulting PNGs at native size and at 480×270. Use `npm run bench` for measured comparisons; do not claim hardware performance from staged screenshots, and fixed-step bot timings are CPU submission evidence, not hardware FPS. See `scripts/nextgen/README.md` for the capture, bench and playtest tools and their fixture limitations. Capture guards (marine bounds inside the HUD-safe viewport, hero scale, room-AABB rules) are tool diagnostics: fix the cause when one trips on new work, or retire a guard that an approved redesign supersedes.

Keep the simulation deterministic, saves backward compatible, and keyboard navigation working — by design and by playing, not by test files.

## Blender and remodelling

Blender is installed (`blender` on `PATH`, or `/Applications/Blender.app/Contents/MacOS/Blender`). The owner authorised remodelling any asset from the ground up on 2026-11-15: characters, creatures, weapons, props, room kits, rigs and animation clips may be authored in Blender (scripted with `bpy`, run headless with `blender -b -P <script>`), baked and exported to GLB. Keep the generating scripts under `tools/assets/` so an asset can be rebuilt; original work is MIT like the rest of the overhaul. Existing third-party CC0 packs may be replaced by original models; keep credits accurate for whatever still ships.

## Checkout and licensing

This is a partial, sparse clone. Historical evidence folders `docs/art-evidence`, `docs/pr-screenshots` and `docs/qa-evidence` are intentionally not checked out. Never disable sparse checkout or add files beneath those paths. Work only in the assigned worktree; `nextgen` is the overhaul integration branch of the fork of `cdb-lumen/containment`.

Preserve third-party notices. Original overhaul art/audio uses the repository MIT license; retained model, texture, music and recorded-audio licenses remain separate. Fonts are self-hosted OFL Barlow; preserve `THIRD_PARTY/Barlow-OFL.txt` and `public/fonts/OFL.txt`. Check runtime dependency licenses and include required texts in `THIRD_PARTY/`.

Wave-7 integration: hostile acid uses one retained shader family in `MaterialWarmup`; preserve zero first-pool combat compilation and exact-once preparation ownership. `AbilityPriorityMask` includes live native pools after their telegraphs retire. Power-placement preview support remains presentation-only through `gameAdapter` / `setPlacementPreview`; native placement rules decide acceptance. The Queen (`reactor-vault`) is legacy-save coverage only, excluded from the current-story showcase.
