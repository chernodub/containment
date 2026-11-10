# Stream A1 — Combat Rig: ability simulation

You are the **gameplay lead**. Read `docs/nextgen/00-VISION.md` (especially §4) and `docs/nextgen/01-ENGINEERING.md` first.
Goal: implement the Combat Rig — dash, tactical, power and Overdrive abilities for four rigs — as a deterministic,
fully tested part of the simulation, playable from the keyboard, emitting everything presentation needs.

## Design inputs (already written by the lead — implement these, tune within reason)
- `src/game/abilities/contract.ts` — snapshot and event types shared with renderer/UI. You may ADD optional fields/phases; never rename/remove.
- `src/game/abilities/catalog.ts` — the 4 rigs / 16 abilities with rules text and headline numbers. If you tune a mirrored number, update the catalog text in the same commit.

## You own
`src/game/**`, `src/DepthGame.ts`, `src/InputController.ts`, and the tests covering them. You may add capture scenarios
(`ability:<id>`; see `scripts/nextgen/README.md`) driven through `window.__containmentDebug.game`.

## You do not touch
`src/main.ts`, `src/style.css`, `index.html`, `src/ui/**`, `src/render/**`, `src/HudLayout.ts`, `src/StatusHud.ts`,
`src/WeaponHud.ts`, smoke scripts. Presentation (VFX, SFX, HUD) is built by other streams from your snapshots/events.
Until then abilities will be invisible apart from their gameplay effect — that is expected; prove them with tests.

## Scope

### 1. Ability runtime (`src/game/abilities/`)
- `AbilitySystem` (name is yours) owned by `DepthGame`: cooldowns, charges, cast wind-ups, lingering zones, deployables,
  self-buffs, Overdrive meter; `snapshot: AbilitiesSnapshot` (stable identity when nothing changed, like other snapshots).
- Public game API (other streams will call exactly these):
  - `game.abilities.snapshot`
  - `game.useAbility(slot: AbilitySlot): boolean` — uses current aim angle / aim point; emits a `denied` event when rejected.
  - `game.setAimPoint(point | null)` or an `aimPoint` field on `GameInput` (your choice; document it) for `point`-targeted abilities.
  - `game.chooseRig(id: RigId)` and rig-selection flow (below).
  - `game.stats` — run statistics snapshot (below).
- Emit presentation events as `GameEffect {type:'ability', ability: AbilityEvent, x, y}` for every phase in the contract
  (cast, impact, tick, end, burst, link, dash-start/end, denied, ready, overdrive-ready).
- Data-driven where it helps (shapes/targeting from the catalog), explicit handlers where behavior is unique.

### 2. The sixteen abilities
Implement all four rigs exactly as specified in the catalog/vision. Requirements that cut across them:
- **Dash**: moves the marine quickly along move direction (aim direction when idle) using the existing collision path so
  it never crosses walls/voids; passes through enemies; i-frames (`hurt` ignores damage; acid pools too); 2 independent charges.
- **Hit shapes are exact** and respect walls/line of sight the same way weapons do (`hasClearExpeditionShot`, `canTraverseExpedition`).
- **Statuses and boons**: chill/freeze/burn/shock/launch/wall-slam go through the existing `MutationRuntime` /
  `ElementalRuntime` machinery so existing boons react (e.g. Seismic Slam launches can wall-slam and chain; Cryo Nova
  stacks the same chill Shattershot consumes; fire from Pyro spreads with Kindling). Abilities must work without any boon owned.
- **Deployables** (Bulwark, Glacier, Tesla Pylon): block enemy movement and enemy projectiles (barrier/ice wall), have
  health, expire, and never trap the marine or leave enemies permanently stuck (navigation must cope or enemies must be
  able to attack/destroy the obstacle — choose, justify, test). The marine's own shots pass through Bulwark.
- **Zones** (Frost Trail, Afterburn, Napalm, Whiteout, Meltdown aura): bounded count, deterministic ticks.
- **Overclock**: `hostileTimeScale` slows enemy AI/movement/attacks and hostile projectiles/pools only; marine, weapons,
  ability timers and pickups run at normal speed. Free ammo / faster fire / instant reload for the duration.
- **Overdrive meter**: charges from damage dealt and kills (start around: full meter ≈ 1–2 normal rooms), persists across
  rooms, spent on activation; `overdrive-ready` event once per fill.
- **Bosses/champions** resist hard control exactly in the spirit of existing rules (freeze/stun/launch → brief slow/stagger).
- Bounded, allocation-light, no `Math.random`, no wall-clock.

### 3. Run flow, persistence, input
- Rig is part of the build: persisted in checkpoints with a version-tolerant reader (old saves load; new saves round-trip;
  corrupt data rejected as before). Overdrive charge persists at room boundaries.
- Rig selection: add run phase `'rig-select'` that precedes `'starting-boon'` (game status stays `'reward'` while in it).
  `game.chooseRig(id)` advances to `'starting-boon'`. **Because the UI for this lands in a later stream**, `newRun()`
  called the way `main.ts` calls it today must keep the current flow working: default to the `breacher` rig and skip
  `'rig-select'`. Enter the selection phase only when asked (e.g. `newRun(seed, {rigSelect: true})`). A continued old
  save without a rig gets the default rig. The existing smoke flows must pass unchanged.
- `InputController`: `Shift` dash, `Q` tactical, `F` power, `V` Overdrive (edge-triggered, ignored while not playing /
  while typing in inputs, reset on blur like other keys); feed the cursor's world point for `point` targeting.
  Keep `Space` aim-assist, `R`, `G`, `E`, `1–5`, `Esc` exactly as they are.

### 4. Combat feedback data (for HUD/VFX streams)
- Add optional fields to confirmed-hit `GameEffect`s: `damage` (applied amount), `lethal`, `source: 'weapon'|'ability'|'status'|'boon'`,
  so floating combat text and hit-stop can be built without touching the simulation again. Cover status ticks and boon procs
  in a bounded way (no event floods: coalesce per target per tick where needed).
- `game.stats`: kills (total and per family), damage dealt (by source), damage taken, shots fired/hit, ability uses per slot,
  Overdrives used, highest multi-kill, time per room, credits earned. Persist with the checkpoint (version-tolerant).

### 5. Augment boons (first set)
Add to the mutation catalog and runtime, offered only when relevant (rig-specific ones only for the active rig), with the
same quality of rules text as existing boons:
- Universal (4): +1 dash charge; kills refund a slice of tactical cooldown; Overdrive charges 30% faster; dashing reloads the equipped weapon.
- Two per rig (8) that visibly change an ability (e.g. Seismic Slam leaves a second delayed aftershock; Bulwark reflects
  spit; Cryo Nova radius grows per frozen target; Glacier spawns twin walls; Flashfire leaves burning ground; Napalm splits
  into three pools; Overload forks; Tesla Pylon deploys two). You design the exact eight; keep them simple, strong and testable.
- Draft/offer logic and `boonPaths` hints updated so rig augments appear alongside the rig's matching boon path.

## Tests (required)
Deterministic unit tests per ability (shape, damage, status, LOS, cooldown/charges, events emitted, boss resistance),
dash collision/i-frames, deployable blocking + no-stuck navigation, time dilation isolation, Overdrive meter, checkpoint
round-trip and old-save compatibility, rig-select flow and legacy `newRun()` flow, input bindings, replay determinism
(same seed + same inputs ⇒ identical state hash with abilities used), and a soak test (long fight spamming abilities:
no NaN, bounded entity counts, no throw).

## Acceptance
- Gates in 01-ENGINEERING pass (vitest, build, smoke; authored smoke because checkpoints/flows changed).
- In the real game (default Breacher rig) Shift/Q/F/V work; switch rig through `__containmentDebug.game.chooseRig` flow
  and confirm all four in a capture/driver script; include a short balance note (damage share of abilities vs weapons in a
  scripted fight, Overdrive fill rate).
