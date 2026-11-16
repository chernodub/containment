# Stream U10 — The new marine in the interface, and a title screen worth the game

You are the **interface art lead**. Read `AGENTS.md` (no tests; Blender available), `docs/nextgen/00-VISION.md`,
`docs/nextgen/01-ENGINEERING.md`, `docs/nextgen/reviews/R10-verdict.md`, `docs/nextgen/K10-REPORT.md` first.

## Situation

K10 replaced the marine with an original modelled character with four colour-blocked Combat Rig variants (Breacher
amber, Cryo ice blue, Pyro orange, Arc violet) and five new weapons; sources in `tools/assets/k10-marine/`, renders in
`public/assets/portraits/k10/` (bust + hero per rig, transparent). The interface still shows the **old** hero
everywhere: the illustrated SVG title key art, rig-select portraits/silhouettes, pause/loadout, ending art, results.
The game now has two different heroes. Fix that, and use the chance to make first impression premium.

## Deliver

1. **Title screen** built around a rendered key image of the new marine. Use Blender (the K10 authoring scene/scripts)
   to stage and render a real key-art composition at 2560×1440 or larger: the marine in a strong pose in a ship
   corridor/hangar set (use the E9 ship kit under `tools/assets/e9-ship-kit/` and K10 weapons), dramatic rim and key
   lighting, depth, atmosphere, an alien threat implied in shadow or silhouette. Deliver layered renders (background,
   midground, hero, foreground, light/fog passes) so the title can parallax subtly with the mouse and breathe
   (slow fog drift, light flicker, visor glow) with cheap CSS/canvas compositing — no gameplay renderer on the title.
   Logo lock-up and menu typography redesigned to sit with the image. Keep `#start`, `#continue`, `#settings` hooks.
   Do at least four render → look → fix rounds; judge at 1920×1080 and at 1280×720.
2. **Rig select** as a hero moment: large rendered portrait per rig (re-render from Blender in a consistent three-quarter
   pose with rig-coloured rim light if the existing ones are not good enough), ability list with icons, clear
   selected state, keyboard navigation intact. Hover/focus swaps should feel instant (preload).
3. **Pause / loadout, results, death and ending screens** use the new marine (portrait or small rendered figure of
   the chosen rig); remove every remaining depiction of the old hero, including the legacy armour overlay in the title
   code. The ending illustration gets a rendered replacement consistent with the title.
4. **HUD portrait/rig badge** (if one exists) updated; ability icons checked against the new rig colours.
5. Optimise shipped images (WebP/AVIF with PNG fallback where needed, responsive sizes, lazy for non-title screens);
   title must appear fast and never block Start.

## Rules

- You own `src/ui/**`, `public/assets/portraits/**`, new `public/assets/ui/**`, and new Blender staging scripts under
  `tools/assets/u10-keyart/` (you may import K10/E9 assets read-only; do not modify their generating scripts or the
  in-game models). Do not edit render/simulation code.
- Combat HUD layout and behaviour stay as they are apart from portrait/badge art.
- Original work only; no resemblance to another game's key art. Credits accurate.
- No tests. Verify: `npm run build`; capture every changed screen at 1920×1080 and 1280×720 with
  `npm run capture` (see `scripts/nextgen/README.md` for UI scenarios) and look at them; keyboard-only pass through
  title → rig select → start → pause → resume → menu by hand through the capture/debug tools; one bot campaign
  (`npm run playtest -- --rig=arc --seed=1729`) still finishes without errors.
- Do not use computer-use tools. One browser at a time. Commit on your worktree branch, clean tree, no push. Keep
  `artifacts/nextgen/u10-final/` (before/after per screen), delete intermediate rounds.

## Report

`docs/nextgen/U10-REPORT.md`: what changed per screen, image weights and load timing, what still looks weak.
