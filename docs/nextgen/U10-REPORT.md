# U10 — Crown–keel marine in the interface

Branch: `t3/marine-hero-ui`. Core UI implementation: `7bb2eac74d7ab153bababdc32f147596b33a3b61`; cinematic artwork/UI implementation: `a302ee3` (the final handoff supplies the later documentation HEAD). No push or PR. No render, world, simulation, model, motion, capture or playtest source was edited.

## What changed

- **Title / loading:** replaced the illustrated SVG marine and its UI armour shapes with an original 2560×1440 Blender composition: K10 Breacher/rifle in a forward brace, a low 44mm camera with knee crop, an E9 torn pressure passage, cool-white rim, amber emergency key, luminous visor and three original dark threat silhouettes/eye points, delivered as five aligned background/midground/hero/foreground/fog plates. The signal seal, wordmark, ruled DEPTH tag and menu typography are redesigned. Normal menu frames skip the world draw and hide the canvas; readiness and graphics recovery still settle normally. The existing renderer is initialized by the shared bootstrap, but it does not supply title pixels or a title render loop.
- **Rig selection:** re-rendered all four K10 rigs with a consistent three-quarter camera, rig-colored key, cool-white rim, luminous visor and subdivided helmet, with large 330px / 210px portrait fields, rig-colored backgrounds, equipment/color identity, the existing ability icons/manifests and a clear Equip action. All four 640px portraits preload on first menu interaction or idle. Mouse movement previews and keyboard focus/arrow/number inspection use those warmed images without changing gameplay until Equip.
- **Pause / loadout:** chosen-rig portrait in Resume and beside the loadout identity. Room records, ability rules, save feedback and native keyboard actions remain.
- **Death / results:** chosen-rig render replaces the former glyph-only debrief identity; the expanded build also carries its marine. Incoming damage receipts and run statistics retain their actual behavior.
- **Ending:** a matching Blender-rendered empty nave, fading chosen-rig suit archive and warning receipt replace the old SVG illustration. `SHIP DESTROYED / ALL ABOARD LOST / NEW EARTH WARNED` remains verbatim. This is an archive, not a surviving marine.
- **HUD:** there is no existing marine portrait or rig badge slot in the combat shell. No HUD space was added or rearranged. Inspected the native action bar and checked the retained amber / ice-blue / orange / violet ability glyphs. Tactical preview miniatures now use a small Crown–keel symbol.

K10/E9 source files and in-game GLBs were imported read-only. Their original MIT artwork and existing animation attribution remain intact; the title Credits links model/animation credits. No new runtime dependency, font or third-party artwork was added.

## Art iterations and rebuild

`tools/assets/u10-keyart/stage.py` reconstructs the set, applies the original K10 pose/weapon correction functions, and renders with Cycles. `optimize.py` creates responsive delivery images. Commands are in `public/assets/ui/u10/README.md`.

`tools/assets/u10-keyart/REVIEW.md` records the initial four render/look/fix rounds at 1920×1080 and 1280×720, followed by lead rejection of that wide composition. Five additional renders (6–10) supply four further look/fix rounds, each opened at 1920×1080 and 480×270. The final camera gives approximately 71% visible hero height with a knee crop. New work corrected the slipped rifle attachment using the weapon-tag matrix delta, reshaped the threats, separated the near claw from the shoulder, removed concentric shoulder rings, added a small chevron and subdivided the frozen helmet for rendering. All four portraits were re-rendered in the same lighting language. Cycles delivery uses 128 samples and denoise, physical low-density volume/spot cones and wet steel reflections. The empty ending nave uses the same set and palette. Intermediate round PNGs were deleted; final raw layers, ending and delivery PNGs remain under `keyart/`.

## Image weights and load observations

Bytes below are encoded file bodies, excluding HTTP headers. WebP is selected by current desktop browsers; composites retain JPEG and transparent plates retain PNG fallbacks. Non-title portraits/ending are lazy; rig-selection images are eager and preloaded. Source K10 PNGs remain untouched.

| Requested desktop view | Immediate composite | Five optional layers | Total title images |
| --- | ---: | ---: | ---: |
| 1280×720 | 29,212 B | 70,680 B | 99,892 B |
| 1920×1080 | 45,432 B | 158,482 B | 203,914 B |

The 2560px composite is 64,444 B. The four 640px rig portraits together are 150,234 B (approximately 35–40 KB each). Ending WebP: 15,298 B at 1280px and 25,568 B at 1920px. All new responsive UI/portrait delivery formats together occupy 1,148,019 B, excluding the four full PNG portrait sources. `image-weights.json` lists exact weights. Original K10 PNGs remain untouched; unused first-pass K10 WebP derivatives were removed.

The one-off production-browser observation used localhost under shared-host load. The initial 1920px composite finished at 94.8ms (3.8ms transfer); optional plates finished at 3176.9–3177.5ms (15.7–16.4ms transfers), after the existing bootstrap created the menu. Start was observed ready at 3519.6ms. This is one local observation, not a network or hardware performance guarantee. Existing actor/renderer/font bootstrap still precedes the interactive menu.

Start never awaits these image loads or decodes. With all six title images deliberately delayed, Start was enabled while all six were pending and reached rig selection in 798.4ms. The static composite remains until every optional plate decodes; retained image owners prevent a quick transition/drawer refresh from cancelling requests. A failed optional decode leaves the composite. The title WebGL frame counter remained 34 → 34 over 1.6s; CSS depth transforms and slow opacity/light drift supply presentation. Reduced motion produced `none` transforms and animations.

## Verification and evidence

`npm ci` completed. `npm run build` passed (TypeScript and Vite; existing large-chunk advisory). No tests, runners or assertion gates were added.

The retained gallery is:

`/Users/chernodub/.t3/worktrees/containment-game/t3-d6a0468e/artifacts/nextgen/u10-final/index.html`

Before: 13 screen frames at each resolution. Final capture labels: `u10-cinematic-1080` (19 frames, including manual Low, graphics recovery and four title-motion frames) and `u10-cinematic-720` (13 frames). Both final passes have zero errors and zero diagnostic failures. Native UI PNGs and exact-area 480×270 reductions were opened; existing `u9-review.mjs` supplied the reductions. The failed 1080p transition parent is preserved under `failed-transition-1080/`: its cancelled title-image requests caused the ownership fix, with no guard removed.

Look here first:

- `/Users/chernodub/.t3/worktrees/containment-game/t3-d6a0468e/artifacts/nextgen/u10-final/after-1080/title.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-d6a0468e/artifacts/nextgen/u10-final/after-1080/rig-select-arc.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-d6a0468e/artifacts/nextgen/u10-final/after-720/rig-select-cryo.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-d6a0468e/artifacts/nextgen/u10-final/after-1080/pause-loadout.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-d6a0468e/artifacts/nextgen/u10-final/after-1080/complete-fixture.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-d6a0468e/artifacts/nextgen/u10-final/after-720/review480/contact.png`

The native-keyboard sequence used Enter → 4 → Enter → 1 → Escape → Escape → Escape → Tab → Enter: title, Arc inspection/equip, first boon, combat, pause, resume and title. It finished with zero page errors. Mouse movement previewed Cryo, while ArrowLeft with a stationary pointer correctly selected Pyro; the pointer did not take keyboard selection back. A genuine menu WebGL loss/restore returned to title through Continue; the ordinary gameplay recovery fixture also passed. Native screenshots and observations are in `keyboard/`. No computer-use/desktop-control tools were used, and browser jobs ran serially.

`npm run playtest -- --rig=arc --seed=1729 --label=u10-arc-1729` completed the full unassisted native campaign: 20 rooms / 20 cleared, outcome `complete`, zero errors, zero defects, 1050.58s wall time. Every simulation tick rendered. Evidence is in `play/arc/`. This campaign used core UI commit `7bb2eac`; subsequent changes were cinematic images, optional-image retry and pointer preview, with no gameplay/render/simulation changes. Final captures and the native keyboard journey exercised the final UI/assets.

`npm run bench -- --rooms=awakening-bay --tiers=high --rigs=arc --seconds=12 --repeat=2` ran before and after and completed with zero reported benchmark errors. Each ordinary trial rendered native gameplay; no instrumentation mode or software renderer was substituted. Full cohorts remain under `bench/before/` and `bench/final/`.

| Cohort / trial | Host load (1m) | Frame p50 / p95 ms | CPU p50 / p95 ms | Adaptive scale p50 | Peak draws |
| --- | ---: | ---: | ---: | ---: | ---: |
| before / 1 | 297.8 | 17.5 / 41.8 | 13.2 / 39.5 | 0.85 | 272 |
| before / 2 | 284.6 | 16.9 / 39.9 | 14.3 / 26.0 | 0.82 | 273 |
| final / 1 | 149.2 | 16.8 / 41.6 | 13.7 / 21.4 | 0.85 | 267 |
| final / 2 | 151.2 | 16.7 / 25.9 | 13.0 / 20.7 | 0.88 | 270 |

Combat compiles were zero in all four trials. These are short shared-host observations: load and adaptive scale differ materially, so the timing differences do not establish a U10 speed improvement or hardware FPS. Combat rendering code and HUD geometry were unchanged. Title-specific evidence is the unchanged WebGL draw-frame counter and non-blocking image-load observation above.

## Integration requests

The renderer owner can now retire the dormant `src/render/world/TitlePresentation.ts` legacy `titleMarineArmor` and associated 3D title allocation. U10 bypasses its normal menu draw and hides the canvas, so it cannot depict the old hero in the interface. That source was left untouched because this brief explicitly forbids render-file edits. No renderer hook or simulation change is required to enable the delivered UI.

## What still looks weak

The ceramic panels remain unusually clean, and the gloves/rifle grip have less anatomical nuance than hand-authored cinematic character work. The threat is now large and readable in silhouette, but its simplified hooked anatomy is still abstract; its darkest limbs lose some separation at thumbnail size. The near claw and volume cones are deliberately restrained, and the knee crop limits the visible wet floor. The ending reads as a ship-system archive, with less cinematic scale than an exterior destruction scene. Tiny debrief portraits lose helmet detail at 480; adjacent rig names and equipment colors carry identity. The existing bootstrap still delays interactive Start even though the key image is available early. A future renderer-owned boot/title-allocation cleanup would improve that first-use wait.
