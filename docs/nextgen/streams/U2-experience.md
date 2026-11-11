# Stream U2 — Experience pass: flow, feel, screens

You are the **UI/experience lead** for the second pass. Read `docs/nextgen/00-VISION.md`, `docs/nextgen/01-ENGINEERING.md`,
then `docs/nextgen/plans/U1*.md` and `docs/nextgen/plans/I1a.md` (what exists). The interface from pass one is merged and
live with the Combat Rig. Goal now: make the *whole experience* feel directed — first minute, room rhythm, feedback beats,
and the three screens that still look like forms.

## You own
`src/ui/**`, `src/main.ts`, `index.html`, `public/fonts/**`, smoke scripts and `scripts/*-check.mjs`, `scripts/nextgen/**`
(capture harness), and their tests.

## You do not touch
`src/render/**` (graphics stream G1 is about to merge: closer tilted follow camera, HDR post, `renderer.setGraphicsOptions`,
a camera rig with `addTrauma/kick/punch`, optional `worldToScreen`), `src/game/**`, `src/DepthGame.ts`,
`src/InputController.ts` (ability-simulation fixes are landing there), `src/game/audio/**` (audio stream S2 is implementing
`src/game/audio/contract.ts`: `handleEffect`, `playUi`, `setEnvironment`, `setCombatState`).
Reach all of those through `src/ui/gameAdapter.ts` with runtime feature detection, so your work merges independently and
lights up when they land.

## Scope

### 1. Presentation beats (new `src/ui/hud/beats/` or similar)
Short, skippable, non-blocking, reduced-motion-aware overlays driven by game state/events:
- **Room enter card**: "SECTOR 04 / 20 — COMMUNAL ATRIUM" with environment tag and objective, 1.6 s, typographic, slides away as combat starts.
- **Room clear**: decisive "SECTOR CLEAR" beat with time/kills, then flows into the reward screen (no dead air, no instant jump).
- **Boss intro**: name plate + phase explanation the first time; **boss defeated** beat.
- **Overdrive ready** callout near the action bar (once per fill); **ability unlocked/augmented** toast when a boon changes an ability.
- **Low health** screen-edge treatment and **hit direction** arcs; **death** beat before the results screen; **final room / ending** keeps the exact story text.
- Drive audio cues through the adapter (`playUi('room-enter')` etc.) when available.

### 2. Game feel in the frame loop (`src/ui/application.ts` + a small `src/ui/feel.ts`)
- **Hit-stop**: 30–70 ms freeze of simulation stepping on heavy hits (rocket/explosion kills, ability impacts, elite/champion kills), capped and never stacking beyond 90 ms; never during player-critical moments (not while the marine is dashing).
- **Final-kill slow motion**: 350–500 ms at ~0.3× on the last enemy of a room, with the room-clear beat.
- **Camera hooks**: call the renderer camera rig (`addTrauma`, `kick`, `punch`) from effects when available; scale by settings; reduced motion disables.
- All time manipulation happens outside the deterministic simulation (the sim only ever receives scaled/zero dt), never changes outcomes for a given input sequence in fixed-step replay tests, and is disabled in the capture/debug stepping path unless asked.

### 3. First-minute onboarding (no tutorial screens)
Contextual, dismiss-on-use key prompts in the first room of a run for players who have never used them (persist a tiny
"seen" record in preferences): move/aim/fire, dash (Shift), tactical (Q), power (F), Overdrive when first full (V),
reload/grenade/medkit. One prompt at a time, anchored near the action bar slot it teaches, never over the marine.

### 4. Screens that need a real design
- **Title**: build a composition that does not depend on the 3D backdrop: logotype lockup with real presence, animated
  ship-systems detail, a main menu with Start / Continue (with run summary: rig, depth, boons) / Settings / Controls / Credits,
  subtle parallax on pointer move, version line. Remove meaningless ornaments (e.g. the "20 / 01" tick).
- **Route / deck map**: a true map — the run graph laid out as a descent through the ship (nodes for all 20 rooms in their
  acts/environments, branches drawn as paths, visited trail, current node pulsing, available choices highlighted with
  room-kind icon, reward and environment), with the selected destination detailed beside it. Keyboard: arrows/1–n/Enter.
  It must work for both branching and single-path steps and for legacy 12-room saves.
- **Results**: hero headline + rig emblem, 3–4 hero stats large, secondary stats grouped (combat / abilities / economy),
  a damage-by-source bar, build recap visible by default as an icon grid with tooltips, distinct treatments for death vs
  completion (the ending text stays exact), New expedition / Title.
- **Rig select**: add an ability "preview strip" per ability showing its shape (cone/circle/line/wall/chain icon drawn from
  the catalog shape data) and keep everything on one screen at 1280×720 without internal scrolling.
- **Pause / settings**: fit 1280×720 without awkward inner scrolling (two-column settings), add a Controls tab with a
  drawn keyboard/mouse diagram, show graphics options from `GraphicsOptions` grouped (Quality / Effects / Comfort).
- **Boon draft**: card reveal stagger, hover/focus lift, clearer rarity treatment for rare and for rig augments
  (augment cards show which ability they modify with that ability's icon), family set-bonus progress.

### 5. HUD refinements
- Ability slots: tooltip on hover/focus with rules text; active-duration ring for lingering abilities; Overdrive block shows the
  ability icon large when ready; clear visual for "no ammo"/"reloading" on the weapon block.
- Combat text tuned for the closer camera (bigger characters): size/offset scale with projected actor size when
  `worldToScreen` is available; kill streak / multi-kill callout ("TRIPLE", "RAMPAGE" style but in our own voice) with a short cooldown.
- Radar and threat indicators verified with the closer camera (more off-screen enemies).
- Objective tracker shows progress (enemies remaining as a bar or wave pips when the director exposes it).

### 6. Harness v2 (`scripts/nextgen/**`)
- A canonical **kiting** heavy-combat scenario for every default room (marine moving and firing, enemies spread, abilities
  used on a script) to replace the "enemies stacked on a stationary marine" shots as the main review material; keep the old ones.
- `--compare=<labelA>,<labelB>` producing a side-by-side contact sheet HTML for two galleries.
- A short **video/gif-like burst** mode: N frames at fixed sim step stitched into a single sprite-sheet PNG per scenario for motion review.

## Method
Fan out (beats+feel / onboarding / title+route / results+rig+pause+draft / harness) with disjoint files; integrate and
art-direct yourself. Capture at 1920×1080 and 1280×720, critique, iterate at least three rounds. Keep final galleries
under `artifacts/nextgen/u2-final/` and `u2-final-720/`.

## Acceptance
Gates in 01-ENGINEERING (vitest, build, smoke, authored smoke, capture). Replay-determinism tests prove hit-stop/slow-motion
do not alter simulation outcomes. No console errors. Every new overlay is keyboard-safe (never traps focus), pointer-transparent
during combat, and honors reduced motion.
