# Containment development

Containment targets desktop browsers with keyboard and mouse. The user removed all phone compatibility and future mobile testing on 2026-10-31. Do not add or run phone/touch-only controls, compatibility branches, captures, CI gates or release requirements. Historical mobile evidence remains historical and is not a release blocker.

Preserve desktop resizing, keyboard accessibility, native mouse and keyboard actions, graphics recovery, checkpoint persistence feedback and authored-room checks. Run `npm run verify` for changes; the required browser gates are desktop-only. Do not remove desktop assertions to resolve failures.

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
- `src/game/roguelike/checkpoints.ts`: versioned, validated checkpoints. New fields need backward-compatible defaults, round-trip coverage and corrupt-data rejection. Keep UI preferences separate from run saves.

Preserve DOM test hooks (`#start`, `#continue`, `#settings`, `#quality`, `#pause`, `#resume`, `#menu`, `#master-volume`, `#sound`, `[data-mutation]`, `[data-route]`, `[data-purchase]`, `[data-weapon]`, `body[data-state]`) and `window.__containmentPerformance`. Update consuming scripts in the same change if a hook must change. Extend the opt-in `?debug=1` / `window.__containmentDebug` fixture API instead of adding globals.

## Verification and test policy

Run `npm ci`, then `npm run verify`. The full chain includes Python asset tests requiring Blender 4.0+ on `PATH` and Pillow in the selected Python environment; do not weaken them or alter assets to bypass missing prerequisites. JavaScript gates from `docs/nextgen/01-ENGINEERING.md`:

```sh
VITEST_MAX_WORKERS=2 npx vitest run --exclude scripts/cryo-model-preview.test.mjs
node --test scripts/cryo-model-preview.test.mjs
npm run build
npm run test:room-evidence
npm run test:smoke
npm run test:authored-smoke:all
```

For visual changes run `npm run capture -- --label=review --scenarios=<relevant>` and inspect the resulting PNGs. Use `npm run bench` for measured scenario comparisons; do not claim hardware performance from staged screenshots. Playtest scripts now include native desktop bot campaigns (`npm run playtest -- --rig=<id> --seed=1729`) and a three-room `npm run playtest:smoke` gate. Retain the desktop smoke and all twenty authored-room gates; fixed-step bot timings are CPU submission evidence, not hardware FPS. See `scripts/nextgen/README.md` for fixture limitations. `scripts/nextgen/i10-capture.mjs` replays historical final3 coverage from a frozen build; `i10-gallery.mjs` assembles native evidence, exact 480×270 review images and original/final3/final4 comparisons. These reductions are desktop art review, not phone captures. `i10-license-audit.mjs` rehashes wave-6 outputs and provenance inventories without a browser. Playing captures enforce actual eight-corner marine bounds inside the measured HUD-safe viewport plus hero-scale and room-AABB rules; `player.visible` remains a point-composition diagnostic. Preserve all native actor/action/phase/priority assertions. Opt-in `capture --failure-evidence` saves same-task failure snapshots. Gallery subsets must retain failed-parent hashes and include only complete guarded scenarios; never erase a failed raw run.

Preserve gameplay, determinism, persistence, navigation, keyboard accessibility and safety assertions. When an approved redesign supersedes a presentation-specific test, replace it with an equivalent behavioral guarantee and list the change; never just delete assertions. Cover new simulation with deterministic tests, UI with DOM/browser contracts, and rendering with lifecycle/tier tests. Retain native input, resizing, context recovery and authored-room checks.

## Checkout and licensing

This is a partial, sparse clone. Historical evidence folders `docs/art-evidence`, `docs/pr-screenshots` and `docs/qa-evidence` are intentionally not checked out. Never disable sparse checkout or add files beneath those paths. Work only in the assigned worktree; `nextgen` is the overhaul integration branch of the fork of `cdb-lumen/containment`.

Preserve third-party notices. Original overhaul art/audio uses the repository MIT license; retained model, texture, music and recorded-audio licenses remain separate. Fonts are self-hosted OFL Barlow; preserve `THIRD_PARTY/Barlow-OFL.txt` and `public/fonts/OFL.txt`. Check runtime dependency licenses and include required texts in `THIRD_PARTY/`.
