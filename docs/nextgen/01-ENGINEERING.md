# CONTAINMENT — Next-Gen Overhaul: Engineering rules

Read `00-VISION.md` first. These rules apply to every agent on the overhaul.

## Repository facts

- Working repo: `/Users/chernodub/.t3/projects/containment-game`, integration branch **`nextgen`**
  (based on the fork `chernodub/containment`, remote name `fork`). Upstream `cdb-lumen/containment` is read-only: never push or open PRs there.
- The checkout is a **partial, sparse clone**. `docs/art-evidence`, `docs/pr-screenshots`, `docs/qa-evidence` are
  deliberately absent (historical evidence, ~320 MB). Never disable sparse checkout, never `git add` anything under those paths.
- Source style is dense (long lines, many statements per line). Match the surrounding style in files you edit;
  **new files should be written in normal, readable multi-line TypeScript** with short doc comments on exported APIs.
- Node 24, npm. `npm ci` once per worktree. Playwright Chromium is cached in `~/Library/Caches/ms-playwright`.
- Blender is **not** installed on this machine: the Python asset tests chained at the end of `npm test`
  (`tools/assets/passenger-vault/test_*.py`) fail for that reason only. That failure is pre-existing and out of scope.
  Do not install Blender; do not modify those tests or the GLB assets they cover.

## Gates

Run before you report. Paste the summary lines in your report.

```sh
npx vitest run --exclude scripts/cryo-model-preview.test.mjs   # unit + browser unit tests
node --test scripts/cryo-model-preview.test.mjs
npm run build                                                  # tsc --noEmit + vite build
npm run test:room-evidence
npm run test:smoke                                             # production browser smoke (needs build)
npm run test:authored-smoke:all                                # authored rooms; slow (minutes)
npm run capture -- --label=<your-stream> --scenarios=<relevant> # visual evidence, see scripts/nextgen/README.md
```

Minimum for every stream: vitest, build, smoke, capture. Run authored smoke when you touched room loading,
the renderer's room pipeline, checkpoints, route/continue flows, or DOM ids the smoke scripts use.

### Test policy

- Gameplay, determinism, persistence, navigation, accessibility and safety assertions are **invariants**: never weaken them.
- Many existing tests pin *presentation details of the old look* (exact CSS values, exact source strings, exact HUD boxes,
  the orthographic camera, exact pass lists). When the approved redesign in `00-VISION.md` legitimately supersedes such a
  detail, **rewrite the test to assert the equivalent guarantee for the new design** (e.g. "HUD never covers the marine",
  "pointer events pass through decoration", "low tier disables expensive passes"). Do not simply delete. List every
  rewritten or removed test in your report with a one-line reason.
- New systems need new tests: deterministic unit tests for sim logic; DOM/browser tests for UI contracts; cheap structural
  tests for render modules (construct, update, dispose without leaks; tier switches).

## Architecture rules

1. **Simulation is deterministic and render-free.** Everything under `src/game/**` and `src/DepthGame.ts` must not import
   Three.js, touch the DOM, read the clock or use `Math.random()` (use the existing seeded patterns). It communicates outward
   through snapshots (`game.<system>.snapshot`) and emitted `GameEffect` events.
2. **Renderer and audio subscribe; they never decide gameplay.** A visual may not change a hit result.
3. **UI reads snapshots.** UI code lives in `src/ui/**` (new), is DOM/CSS/SVG, and calls game methods only through
   the same public methods input uses.
4. **Quality tiers.** Everything expensive is tiered: `high` (default) and `low`. Low must remain a genuinely cheap path.
   New graphics options are additive settings on top of the tier (see the U and G briefs).
5. **Budgets (High, 1920×1080, heavy combat, mid-range laptop GPU):** ≤ 16.6 ms frame on real hardware; main-thread
   update+render JS ≤ 8 ms on an M-series Mac; ≤ 350 draw calls in a typical room; no per-frame allocations in hot loops
   (pool everything: particles, lights, decals, DOM nodes for combat text); no shader compilation hitches mid-combat
   (prewarm in `renderer.prepare`).
6. **Pooling and lifecycle.** Every pooled/GPU resource has `dispose()`; room changes and context loss/restore must not leak
   (there are existing tests for geometry/texture counts — keep them meaningful).
7. **Accessibility.** Keyboard reachability for every menu action, visible focus, `prefers-reduced-motion` respected
   (shake, flashes, parallax, UI motion), color is never the only signal, text contrast ≥ 4.5:1 on its backplate.
8. **Stable test hooks.** Smoke scripts drive the game through DOM ids/attributes (`#start`, `#continue`, `#settings`,
   `#quality`, `#pause`, `#resume`, `#menu`, `#master-volume`, `#sound`, `#reroll`, `[data-mutation]`, `[data-route]`,
   `[data-purchase]`, `[data-weapon]`, `body[data-state]`, `window.__containmentPerformance`, …). Keep them working or
   update the scripts in the same change. The dev hook `window.__containmentDebug` (only with `?debug=1`) is the supported
   way to script scenarios; extend it rather than adding ad-hoc globals.
9. **Saves.** Checkpoints are versioned and validated (`src/game/roguelike/checkpoints.ts`). Any new persisted field needs
   a version-tolerant reader: old saves must still load (with sensible defaults), new saves must round-trip, corrupt data
   must be rejected exactly as before.
10. **Licensing.** Original work only. Do not copy names, characters, icons, UI layouts, sounds or art from existing games.
    New npm dependencies: permissive license, small, justified in the report; add license text under `THIRD_PARTY/` when the
    license requires attribution. Fonts must be OFL and self-hosted (no runtime dependency on Google Fonts in new work).

## File ownership (parallel safety)

Streams run in separate git worktrees and are merged by the lead. The source has very long lines, so two streams editing
the same file means painful conflicts. **Edit only files your brief assigns to you.** If you need a change in a file you
do not own, expose what you need from your side, describe the required one-line hook in your report under
"Integration requests", and stub/mock it on your side. Shared contract files are frozen unless the brief says otherwise.

## Working method for stream leads

- You are a lead. Start by reading the code you own and writing a short technical plan to
  `docs/nextgen/plans/<stream>.md` (decisions, module list, risks). Then execute.
- **Fan out.** Split parallelizable work with disjoint file ownership across your own GPT Sol sub-agents
  (model `gpt-6.1-sol`), inside your worktree. Give each a precise brief (goal, files owned, acceptance, gates) and
  integrate their work yourself. Recurse further when a sub-task is itself large. Do not fan out trivial work.
- **Look at your work.** Use `npm run capture` and open the PNGs. Compare against `artifacts/nextgen/baseline/`
  (in the main checkout: `/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/baseline/`).
  Critique like an art director against `00-VISION.md`, then iterate. At least two critique→fix rounds before reporting.
  For anything animated, capture bursts and judge motion.
- Commit to your worktree branch in small logical commits (conventional prefixes `feat|fix|perf|refactor|test|docs`).
  Do **not** push, do not open PRs, do not merge into `nextgen` yourself, do not touch other worktrees.
- Never leave the build red. If you cannot finish something, land it behind a clearly named constant/flag and say so.

## Report format (final message of every stream)

1. What shipped (bullets) and the branch name + HEAD SHA.
2. Capture label and the absolute paths of 4–8 screenshots the lead should look at first.
3. Gate results (summary lines).
4. Tests rewritten/removed and why.
5. Integration requests for files you do not own.
6. Known gaps, honest self-assessment against the vision (what still does not look/feel AAA), recommended next steps.
