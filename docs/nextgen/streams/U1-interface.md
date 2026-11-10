# Stream U1 — Interface: design system, HUD, screens

You are the **UI lead**. Read `docs/nextgen/00-VISION.md` (especially §3 "UI character", §5) and `docs/nextgen/01-ENGINEERING.md` first.
Goal: replace the current text-label HUD and plain panels with a confident, premium "ship systems interface" — a real
design system, custom iconography, purposeful motion — and restructure the UI code so it can keep growing.

## You own
`src/main.ts`, `src/style.css` (split it), `index.html`, `src/HudLayout.ts`, `src/StatusHud.ts`, `src/WeaponHud.ts`,
`src/render/HitConfirmation.ts` (the DOM crosshair/hit marker — move it under `src/ui/`), new `src/ui/**`,
`public/fonts/**`, `scripts/smoke*.mjs`, `scripts/authored-room-smoke.mjs`, `scripts/*-check.mjs`, and the tests covering these.
You may add capture scenarios (see `scripts/nextgen/README.md`).

## You do not touch
`src/render/**` (except moving `HitConfirmation.ts`), `src/DepthGame.ts`, `src/InputController.ts`, `src/game/**`.
Two parallel streams are changing those: **G1** (renderer; will add `renderer.setGraphicsOptions(partial)` /
`renderer.graphicsOptions`, a camera rig) and **A1** (abilities; will add `game.abilities.snapshot`,
`game.useAbility(slot)`, `game.chooseRig(id)`, run phase `'rig-select'`, `game.stats`, and `damage`/`lethal`/`source`
fields on hit `GameEffect`s). Code against the shared contracts that already exist:
`src/game/abilities/contract.ts`, `src/game/abilities/catalog.ts`, `src/render/graphicsOptions.ts`.
Where the live API does not exist yet, go through one small adapter (`src/ui/gameAdapter.ts`) that feature-detects at
runtime and returns `null`/defaults, and prove your components with fixture snapshots in tests. After merge the lead
wires the adapter to the real thing.

## Scope

### 1. Architecture
`main.ts` becomes a thin bootstrap + frame loop. UI moves to `src/ui/`:
`screens/` (title, rig-select, draft, shop, route, pause, results, destroy-confirm, loading/errors),
`hud/` (vitals, action bar, objective/room header, boss bar, build strip, toasts, combat text, threat indicators, crosshair),
`icons/` (SVG), `styles/` (tokens, base, components, hud, screens), `settings.ts` (persisted preferences).
Keep it framework-free (DOM + template functions + small update methods). No per-frame layout thrash: the HUD updates
via cached nodes and only on change; combat text and indicators are pooled.
Keep the existing bootstrap/recovery behaviors intact (asset preload progress, WebGL unavailable / context loss & restore,
room-loading hold, safe input gating, checkpoint warnings, audio preferences).

### 2. Design system
- Tokens (color, type scale, spacing, radii/chamfers, elevation, motion) as CSS custom properties; color meanings follow
  the table in 00-VISION §3.
- Typography: self-hosted OFL fonts in `public/fonts/` (remove the Google Fonts `@import`): a condensed technical display
  face for numerals/titles and a clean sans for body. Tabular numerals wherever numbers change.
- Components: panel (dark glass, 1px luminous edge, chamfered corners), buttons (primary/secondary/quiet, hover/active/focus/disabled),
  cards, tabs, sliders, toggles, selects, keycaps, meters (linear, segmented, radial), tooltips, toasts.
- **Icon set** (original SVG, consistent grid/stroke): 5 weapons, grenade, medkit, credits, armor, health; 16 abilities +
  4 rigs; 4 boon families + rarity marks; statuses (burn, chill, freeze, shock, acid); room kinds (combat, elite, medical,
  armory, boss); system icons (pause, settings, sound, keyboard, arrow, check, lock, warning). Every ability icon must be
  distinguishable at 32 px and in monochrome.
- Motion: 120–220 ms ease-out for state changes; screen transitions; everything disabled/reduced under `prefers-reduced-motion`.

### 3. HUD
- **Action bar** (bottom center): weapon slots with icons, current ammo/reserve and reload progress; dash pips; tactical and
  power slots with radial cooldown, charge count, keycap, ready flash, denied shake; Overdrive meter that feels special when
  full. Ability slots render from `AbilitiesSnapshot` (via the adapter) and hide gracefully when no rig is available.
- **Vitals**: segmented health and armor with damage-lag ghost, low-health state (pulse + screen-edge treatment), medkit/grenade counts with icons and keys.
- **Room header / objective**: depth, room name, objective, enemies remaining; story line presentation (skippable as today).
- **Boss bar** with phase states (armored / exposed / nests) and timer.
- **Build strip**: owned boons as icons grouped by family, with set-bonus state.
- **Crosshair**: custom cursor-following reticle showing spread/bloom, reload ring, hit/kill confirmation (replaces the tiny marker).
- **Combat text**: pooled floating damage numbers and status callouts positioned from world coordinates
  (use `renderer` projection helpers that exist today; if you need a new one, request it), merged per target to avoid spam,
  setting to disable. Uses the optional `damage`/`lethal`/`source` fields on effects when present.
- **Threat indicators**: screen-edge markers for off-screen enemies that are attacking/near, and directional damage indicators.
- **Toasts**: pickups, boon acquired, checkpoint saved/failed.
- The guarantee behind `HudLayout`/`UnifiedHudLayout`/`StoryHudLayout`/`WeaponHud` tests stays: **HUD never hides the marine
  and never eats gameplay clicks** (decoration is `pointer-events:none`; interactive HUD controls keep working with mouse and keyboard).
  You may redesign how it is achieved (e.g. edge-anchored layout + local fade/relocation) and rewrite those tests to the new layout.
- Readable over every environment (bright cryo floors and dark infested rooms alike).

### 4. Screens
- **Title**: cinematic composition over the live 3D scene, strong logotype, Start / Continue / Settings / Credits, version line.
- **Rig select** (new; driven by `RIG_CATALOG`/`ABILITY_CATALOG`; shown when the run phase is `'rig-select'`): four rig cards,
  focused rig shows its four abilities with icons, keys, rules text and stat lines; mouse and keyboard (arrows/1–4/Enter).
- **Boon draft**: cards with family icon/color, rarity treatment, rules text, trade-off, synergy hint, keyboard 1–3, reroll.
- **Shop** (infirmary / supply cache) and **route** screens; route selection shows the run as a **deck map** (the run graph
  with visited/current/available nodes, room-kind icons and rewards), not just buttons.
- **Pause**: tabs — Resume, Loadout (rig, abilities, boons with full text), Settings, Controls (key reference).
- **Settings**: graphics tier (`#quality`, High/Low — keep ids/values the smoke uses) plus every option in
  `GraphicsOptions` rendered generically from `GRAPHICS_OPTION_LABELS`; audio (master volume + mute as today; add music/effects
  sliders if `AudioSystem` already supports setting them, otherwise leave a clean seam); gameplay/accessibility
  (screen shake, flash intensity, combat text on/off). Persist in localStorage with validation, like `audio/preferences.ts`.
- **Results** (death / completion): headline, run stats grid (reads `game.stats` via the adapter; shows what exists), build recap, New run / Title.
- **Destroy-ship confirmation** and all story text keep their exact wording and deliberate-consent behavior.
- All screens: keyboard navigable, visible focus, no clipped/overflowing text from 1280×720 to 2560×1440.

## Method
Land the architecture split first (behavior-preserving, tests green), then fan out: design system + icons, HUD,
screens, settings/persistence can proceed in parallel sub-agents with disjoint files. Capture `title`, `title-settings`,
`starting-boon`, `combat-calm`, `combat-heavy`, `boss`, `reward`, `route`, `shop`, `pause`, `dead` at 1920×1080 and 1280×720,
compare with baseline, critique as a UI art director (hierarchy, spacing rhythm, alignment, contrast, icon clarity), iterate.
Add fixture-driven scenarios for rig-select and the action bar with abilities in each state (ready, cooling, casting, denied, Overdrive full).

## Acceptance
- Gates in 01-ENGINEERING pass (vitest, build, smoke, authored smoke, capture). Smoke scripts updated in the same change where selectors moved.
- No Google Fonts request; no console errors; no layout shift while playing; HUD update cost negligible in the performance snapshot.
- Nothing looks default or placeholder. Every interactive element has hover, active, focus-visible and disabled states.
