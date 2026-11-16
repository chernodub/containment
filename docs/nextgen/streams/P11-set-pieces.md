# Stream P11 — Set pieces and prop craft for the twenty rooms (Opus modelling stream)

You are the **environment modelling lead**. Owner decision 2026-11-16: 3D modelling is done by Claude Opus. Read
`AGENTS.md` (no tests; Blender available; remodelling authorised), `docs/nextgen/00-VISION.md` (environment moods),
`docs/nextgen/01-ENGINEERING.md`, `docs/nextgen/streams/E9-room-interiors.md`, `docs/nextgen/E9-REPORT.md`,
`docs/nextgen/streams/E10-floors-and-light.md`, `docs/nextgen/E10-REPORT.md` and `scripts/nextgen/README.md` first.

## Situation

The rooms now have ship plans, palettes, baked floor sets, shaped light and an original kit
(`tools/assets/e9-ship-kit/`, `public/assets/e9-ship-kit/`). See
`/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/reference/e10-twenty-calm.png` and
`e10-twenty-kiting.png`. What is missing is **craft and identity in the objects**: the kit pieces are clean simple
boxes with a few insets (white-goods look), many rooms share the same modules, and several rooms have no memorable
object. E10's own weak list: Residential centre, Workshop rear, Relay cross aisle, Transmission airlock.

## Deliver

1. **One hero set piece per room** — the thing a player remembers the room by — modelled to hero quality and placed
   where it is visible from the fight circle without blocking it (far wall, corner well, overhead, or under glass):
   Awakening Bay cryo-berth array with frost and umbilicals; Passenger Vault stacked sleeper drawers on a carrier
   rail; Residential Gallery a lived-in common nook (table, mugs, a child's drawing wall, overturned chairs);
   Communal Atrium the garden with a cracked skylight projection; Crew Checkpoint scanner gate; Armory weapon carousel;
   Freight Hold gantry crane with a hanging container; Breached Loading Bay the hull tear with a wedged cargo pod;
   Relay Racks server monoliths with fibre trunks; Transmission Chamber the dish/uplink mast; Diagnostic Gallery
   probe arm over a specimen cradle; Safety Interlock the interlock cage with rotating key cylinders; Coolant Plant
   pump turbines with frosted manifolds; Service Shaft the open shaft with lift machinery; Infested Workshop a machine
   swallowed by growth; Swarm Junction the nest mass in the ducts; Shielding Gate the field emitter; Containment
   Annulus the containment ring; Manual Control the control dais with physical levers; Overload Floor the reactor
   crown. Keep what already exists if it is good (some rooms have authored landmarks) and raise it; replace it if not.
   Where it suits, give the set piece cheap life: a rotating part, pulsing emissive, drifting vapour hook, flicker.
2. **Kit quality pass**: every module of the E9 kit gets real industrial design — chamfered forms, panel breakup with
   purpose, handles, hinges, vents with depth, cable/pipe connections that go somewhere, labels and numbering,
   wear — and three or four new families the rooms lack (cable trays and conduit runs, pipe racks with valves and
   gauges, wall panels with access hatches, crates/cases/barrels with variety, railings and stairs, consoles with
   distinct screens). Bake AO/curvature/normal; flat readable zones for the ink/banded shader; emissive masks.
3. **Infestation set** for acts 3–4 rooms: growth masses, egg clusters, resin webs between structures, burst ducts —
   organic sculptural quality, placed so they tell where the creatures came from.
4. **Placement** in all twenty rooms with the existing dressing system (`src/render/world/**`, room modules): fix
   E10's four weakest views first, then every room; no two rooms sharing the same prominent module without variation.

## Rules

- Presentation only, with one allowance: static colliders for wall-backed pieces up to 48 units deep and for set
  pieces outside the fight circle where lanes stay ≥ 140 units; check with bot campaigns that nothing gets stuck.
  Nothing taller than waist height near the camera side; overhead pieces fade near the marine.
- Budgets: draws ≤ 330, zero mid-combat shader compiles, room preparation ≤ 3 s, High frame p95 ≤ 20 ms — E10 left
  frame time over budget on a loaded machine, so every piece must be cheap: merged/instanced static batches, shared
  atlases (≤ 2k per environment group), triangle budgets stated per piece (hero set piece ≤ 12k, kit module ≤ 1.5k),
  LOD or Low-tier simplification. Report per-room draws/triangles/texture memory before and after.
- Combat readability: no saturated red/orange (danger) on props, nothing noisy under actors.
- Method: standard on three rooms first (Relay Racks, Residential Gallery, Infested Workshop) with at least four
  written render → look → fix rounds (`docs/nextgen/plans/P11-review.md`): Blender beauty render of each piece, then
  in-game five-position room tours and a 20-enemy kiting frame at native size and 480×270, side by side with the E10
  frame. Then all twenty, with up to 4 sub-agents **on the Opus model** (disjoint environment groups); you review
  every render and capture.
- You own `tools/assets/e9-ship-kit/`, `public/assets/e9-ship-kit/`, new `tools/assets/p11-set-pieces/` and
  `public/assets/p11/`, and placement code under `src/render/world/**` and the room modules. Do not edit actors,
  creature or marine models (streams K11/K12), motion, UI, lighting architecture, simulation rules or the bot.
- No tests. Verify: `npm run build`; tours and kiting captures you look at; one bot campaign
  (`npm run playtest -- --rig=cryo --seed=1729`) without errors; `npm run bench` with host load noted. Do not use
  computer-use tools. One browser at a time. One command rebuilds every asset. Keep `artifacts/nextgen/p11-final/`
  (per-room before/after, set-piece beauty renders), delete intermediates. Commit on your worktree branch, clean tree,
  no push, no PR.

Report: `docs/nextgen/P11-REPORT.md` — per room: set piece, what changed, numbers; honest list of the weakest rooms.
