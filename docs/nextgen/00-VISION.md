# CONTAINMENT — Next-Gen Overhaul: Vision

Owner / creative director: the lead (Claude). Executors: GPT Sol agent fleet.
This document is the source of truth for *what we are building and what "good" means*.
`01-ENGINEERING.md` is the source of truth for *how we work*. Stream briefs (`streams/*.md`) scope each agent.

## 1. Where we are

Containment is a desktop browser top-down action roguelike (TypeScript, Vite, Three.js 0.185, Rapier).
A marine wakes on an infested colony ship and fights through 20 authored rooms across 10 environments
(cryogenics, habitation, security, cargo, communications, engineering, maintenance, infested, containment, reactor).
Five weapons, grenades, medkits, ~48 boons in four build paths (Cryo executioner, Wildfire, Kinetic demolition,
Reactor cycling), elemental statuses (burn, chill/freeze, shock, acid), five enemy families plus champions and a Queen boss.

It plays correctly and is heavily tested, but it does not *feel* or *look* premium:

- Flat orthographic camera, even lighting, little depth, almost no atmosphere. Rooms read as diagrams.
- Combat has thin feedback: small tracers, no camera language, no hit-stop, no damage numbers, weak muzzle/impact light.
- The player has only "shoot, reload, grenade, medkit". No mobility skill, no active abilities, no ultimate, no moment-to-moment decisions beyond aiming.
- The HUD is a set of small text labels on dark backplates. Menus are plain panels. No iconography, no motion, no identity.

## 2. The target

**A player who opens the page should think "this is a real, premium game" within five seconds, and
"this feels incredible" within thirty.** We are aiming at the presentation and game-feel bar of the best
modern top-down action games (fluid ability-driven combat, readable chaos, cinematic lighting,
confident UI), delivered in a browser tab. Everything is original: our own names, art, layouts, icons and effects.
We take *inspiration from the genre's best practices*, never assets, names, characters or layouts from any existing game.

### Pillars (in priority order when they conflict)

1. **Readable chaos.** At peak intensity (25 enemies, explosions, three status effects, an ultimate) the player
   can always find: themself, the cursor, incoming threats, and what just hit them. Beauty never beats readability.
2. **Every input has a physical answer.** Shots kick, hits land, kills pop, abilities have anticipation → impact → aftermath.
   Light, camera, sound and UI all respond to the same event within one frame.
3. **Light is the art direction.** Darkness with motivated light: practical fixtures, emergency strobes, muzzle flash,
   burning enemies, the marine's lamp. Each of the 10 environments has a distinct lighting mood and color script.
4. **A build you can feel.** Rigs + abilities + boons combine into builds whose power is visible on screen
   (the cryo build makes the room look frozen; the arc build fills it with lightning).
5. **Rock-solid.** 60 fps on a mid-range laptop GPU at 1080p on High. Deterministic simulation stays deterministic.
   Saves stay valid. Accessibility (keyboard, reduced motion, readable contrast) is kept, not traded away.

## 3. Art direction

**Mood:** industrial deep-space horror-action. A dying colony ship: cold steel, condensation, failing power,
alien growth creeping over human order. Not neon cyberpunk, not cartoon. Grounded materials, dramatic light.

**Color script.** Base world is desaturated cold steel/teal in shadow. Saturated color is *earned* and means something:

| Meaning | Color | Use |
|---|---|---|
| Player / friendly tech | cyan-white `#9fe8ff` → `#e8fbff` | marine lamp, shields, ability UI accents |
| Danger / enemy telegraph | hot red-orange `#ff5a36` | warnings, enemy attacks, low health |
| Kinetic | amber `#ffb454` | muzzle, sparks, kinetic rig |
| Cryo | ice blue `#7fd6ff` | chill, freeze, cryo rig |
| Pyro | fire orange `#ff7a2e` → yellow core | burn, pyro rig |
| Arc / Reactor | violet-white `#b79cff` → `#f2ecff` | lightning, arc rig |
| Alien / acid | toxic green `#9dff5a` | acid, spit, infestation glow |
| Reward / rare | gold `#ffd27a` | credits, rare boons |

Environment moods (lighting + grade + atmosphere), one line each — the G-streams expand these:

- **cryogenics** — sterile cold blue-white, low ground fog of frost mist, soft caustic shimmer from pod glass.
- **habitation** — warm abandoned amber practicals fighting cold ambient; dust motes; a home gone wrong.
- **security** — hard white key lights, red alert strobes, deep black shadows, laser-grid motifs.
- **cargo** — high sodium-orange overheads, long shadows between containers, drifting dust.
- **communications** — dark racks with thousands of tiny status LEDs, cyan/green data glow, flickering screens.
- **engineering** — yellow hazard light, steam bursts, sparks, heat shimmer.
- **maintenance** — sickly green-teal fluorescents, dripping coolant, wet reflective floors.
- **infested** — bioluminescent green/magenta growth, spores in the air, pulsing organic emissives, almost no human light.
- **containment** — clinical white with violet energy fields, rhythmic pulses from shielding.
- **reactor** — overwhelming orange-white core glow, embers, heat haze, alarm rotation; the climax must look like one.

**Rendering character:** filmic HDR, soft contact-rich shadows, ambient occlusion grounding every object, bloom only on
genuinely hot emissives, gentle depth haze, restrained grade (no crushed blacks hiding gameplay), subtle lens treatment
(vignette, faint chromatic fringe at screen edge, very fine grain). No gimmick filters.

**UI character:** "ship systems interface" — precise, technical, calm under pressure. Dark glass panels with crisp
1px luminous edges and chamfered corners, a condensed technical display face for numerals/titles, clean sans for body.
Custom SVG iconography for every weapon, ability, boon family, status, room type. Motion is fast and purposeful
(120–220 ms, ease-out), never floaty. Color in the UI follows the same meaning table as the world.

## 4. Gameplay additions — the Combat Rig

The marine's suit gets a **Combat Rig**: a chosen kit of active abilities. This is the centerpiece gameplay upgrade.

**Controls (desktop):** `Shift` dash · `Q` tactical ability · `F` power ability · `V` ultimate (Overdrive).
Existing: WASD move, mouse aim/fire, `Space` aim-assist fire, `R` reload, `G` grenade, `E` medkit, `1–5` weapons, `Esc` pause.

**Universal: Dash.** Short, fast reposition in the move direction (or aim direction when standing still),
brief invulnerability window, 2 charges that recharge independently. Passes through enemies, not walls.
Each rig gives the dash a signature side effect.

**Overdrive (ultimate) charge** builds from damage dealt and kills, persists between rooms within a run,
and is spent entirely on activation.

Four rigs, chosen at the start of a run (before the starting boon). Each aligns with an existing boon path so
existing boons and the new abilities multiply each other:

### BREACHER rig — kinetic, close-range, walls are weapons (pairs with *Kinetic demolition*)
- **Dash — Ram:** enemies struck by the dash are shoved aside and staggered.
- **Q — Seismic Slam:** after a short wind-up, a radial shockwave around the marine deals damage and launches enemies outward (launches can wall-slam and trigger existing Breacher/Chain Reaction/Seismic Impact boons).
- **F — Bulwark:** deploy a wide energy barricade in front of the marine for several seconds. Blocks enemy movement and enemy projectiles; the marine's shots pass through.
- **V — Railbreaker:** brief charge, then a massive piercing lance along the aim line: heavy damage to everything on the line, launched sideways into walls.

### CRYO rig — control and execution (pairs with *Cryo executioner*)
- **Dash — Frost Trail:** leaves a short-lived strip of frost that chills enemies crossing it.
- **Q — Cryo Nova:** instant ring of cold; applies heavy chill, freezes already-chilled enemies.
- **F — Glacier:** raise an ice wall segment at the cursor; blocks movement/projectiles, and when it expires or is destroyed it shatters in a damaging, chilling burst.
- **V — Whiteout:** a large blizzard zone centered on the marine for several seconds: continuous chill, periodic freeze pulses, frozen enemies killed inside shatter for area damage.

### PYRO rig — area denial and momentum (pairs with *Wildfire*)
- **Dash — Afterburn:** leaves a line of fire that ignites enemies.
- **Q — Flashfire:** a wide cone of flame in the aim direction; damage + ignite.
- **F — Napalm Charge:** lob a canister to the cursor; it bursts into a burning pool that persists and ignites.
- **V — Meltdown:** the marine becomes a walking inferno for several seconds: burning aura, shots ignite, kills cause fire bursts; move-speed bonus.

### ARC rig — tempo, chains and gadgets (pairs with *Reactor cycling*)
- **Dash — Static Step:** on arrival, discharge a small shock to the nearest enemies.
- **Q — Overload:** chain lightning from the aim target through nearby enemies; shocked enemies are briefly stunned.
- **F — Tesla Pylon:** deploy a pylon at the cursor that periodically arcs to nearby enemies for its lifetime; arcs link between pylon and marine when close, damaging enemies crossing the link.
- **V — Overclock:** for several seconds time dilates (enemies and enemy projectiles heavily slowed, the marine is not), fire rate up, no ammo consumption, instant reloads.

**Augments.** New boons that modify abilities appear in drafts (only for the rig you run, plus a few universal ones:
extra dash charge, faster Overdrive charge, cooldown refund on kills). Target for the first release: 2 augments per rig + 4 universal.

**Design rules for abilities**
- Every ability is simulated in the deterministic game layer with fixed-step-safe logic and unit tests; visuals/audio subscribe to events.
- Every ability has clear *anticipation* (≤ 250 ms unless it is a deliberate charge), *impact*, *aftermath*; telegraph shapes match actual hit shapes exactly.
- Line-of-sight and wall rules are consistent with existing weapons (`hasClearExpeditionShot`, `canTraverseExpedition`).
- Abilities interact with existing statuses and boons through the existing MutationRuntime/ElementalRuntime paths rather than parallel systems.
- Balance target: abilities should account for roughly 30–40% of a skilled player's damage/control; weapons stay primary. Cooldowns: Q 6–9 s, F 12–18 s, dash recharge ~2.5 s per charge, Overdrive roughly once per 1–2 rooms.
- Bosses/champions: resist hard crowd control (freeze/stun/launch become brief slows/staggers) — reuse existing boss-resistance conventions.

## 5. Experience upgrades by area

**Camera & feel:** a closer hero camera (marine ≈ 110–140 px tall at 1080p, about 1.7–2× closer than the baseline's whole-room view) that follows the marine; rooms extend past the screen and out-of-bounds space is designed, never flat black; off-screen threats are surfaced by HUD indicators and a room radar; smooth follow with aim look-ahead; trauma-based shake scaled by a user setting; recoil kick; zoom punch on
explosions and Overdrive; micro hit-stop on heavy hits/kills; slow-motion beat on the final kill of a room; all disabled or
reduced under `prefers-reduced-motion` and a "Screen shake" setting.

**Combat VFX:** bright tapered tracers with light, real muzzle flashes that light the scene, ejecting shell casings,
impact sparks/dust/decals per surface, layered explosions (flash → fireball → smoke → shockwave distortion → scorch decal),
enemy hit flashes and dissolve deaths, persistent bullet-hole/scorch/acid/frost decals, elemental effects that light the room.

**HUD:** bottom-center action bar (weapon + ammo, dash pips, Q/F cooldown dials with keycaps, Overdrive meter),
segmented health/armor with damage-lag, objective + room header, boss bar with phases, floating damage numbers and status
callouts, off-screen threat indicators, custom crosshair with reload/spread ring, pickup/boon toasts, low-health treatment.

**Screens:** cinematic title over a live 3D scene; rig selection with ability previews; boon draft cards with icons, rarity,
synergy hints and keyboard selection; route selection as a ship-deck map; pause with Loadout / Settings / Controls;
results screen with run statistics; all keyboard-navigable.

**Audio:** ability, UI and feedback sounds synthesized/authored locally (no new licensed assets unless clearly licensed and credited),
ducking and a simple dynamic mix so Overdrive and explosions feel heavy.

## 6. Non-goals (for this overhaul)

- No phone/touch support (removed by the owner on 2026-10-31; see AGENTS.md).
- No change to the story, the 20-room route, or the ending.
- No migration to WebGPU; stay on WebGL2 / `WebGLRenderer`.
- No new third-party art/audio assets with unclear licenses. New npm dependencies must be MIT/BSD/Apache/zlib/OFL and justified.
- No multiplayer, no meta-progression between runs.

## 7. Definition of done (lead's acceptance)

The lead reviews captured screenshots/bursts (`npm run capture`) and plays the build. Done means:

1. Side-by-side with the baseline gallery, every scenario is an unmistakable generational jump.
2. All four rigs are playable start-to-finish with correct telegraphs, VFX, SFX, HUD state and augments.
3. Gates in `01-ENGINEERING.md` pass. No console errors. Frame time on High at 1080p in heavy combat within budget.
4. Nothing reads as placeholder: no default-looking buttons, no unlabeled states, no clipped text at 1280×720 → 2560×1440.
