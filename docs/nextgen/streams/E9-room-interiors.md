# Stream E9 — Room interiors: make every frame read as a place

You are the **room interiors lead**. Read `AGENTS.md`, `docs/nextgen/00-VISION.md`, `docs/nextgen/01-ENGINEERING.md`,
`docs/nextgen/L8-REPORT.md` and `docs/nextgen/reviews/R10-verdict.md` first.

## Where we are

L8 re-authored all twenty story rooms into ship plans: articulated hulls, hull-connected partitions, three or more
named sub-spaces per room (`src/game/roguelike/shipArchitecture*.ts`, drawn by `src/render/world/ShipArchitectureRoom.ts`
and the per-act presentation modules). The plans are good. **What the player sees is not there yet.**

Open `artifacts/nextgen/l8-final/twenty-calm.png` and the native frames beside it, then compare two of them:

- `combat-calm-residential-gallery.png` — reads as a place. Each sub-space has its own floor tone with a trim line,
  cabins hold beds/desk/lockers against walls, warm fixture light spills through doorways, walls have visible faces.
- `combat-calm-diagnostic-gallery.png`, `…crew-checkpoint.png`, `…swarm-junction.png`, `…infested-workshop.png`,
  `…containment-annulus.png`, `…manual-control-chamber.png` — a bare tile grid with a couple of objects at the frame
  edge. Partition walls read as **thin dark stripes on the floor**. Nothing in frame says "diagnostic gallery".

The gameplay camera is close (hero scale), so a frame shows roughly 40% of a room. The room must therefore be
readable **in any 40% window**, not only in the plan view.

## Goal

In all twenty rooms, any gameplay frame — spawn, room centre, each named sub-space, the exit — shows a recognisable
ship interior of that room's function. Independent reviewers have held environments at 5.5/10 for five rounds; the
target of this stream is a clear step above that.

## The standard (derive from Residential, then exceed it)

1. **Walls read as walls.** From the gameplay camera every partition and hull wall shows three things: a lit cap of a
   distinct lighter value, a visible darker near face with real height, and a contact shadow/base trim on the floor.
   Minimum on-screen thickness of the cap ≈ 10 px at 1920×1080. Near-camera walls stay low/cutaway so they never hide
   the marine or enemies; far walls may be taller. Door openings get jambs and a threshold strip in the floor.
   No wall may read as a line.
2. **Floor zoning by sub-space.** Every named sub-space owns a floor treatment (material family, tone step, panel
   module/orientation) different from its neighbours, separated by a threshold/trim. The central fight circle is the
   calmest surface but is never a blank grid: give it a function-specific inlay (inspection lanes, cable trench
   covers, drain channels, deck-plate module, painted bay numbers, a large floor graphic) with low contrast.
   Value contrast of floor inlays stays below actors and telegraphs (combat priority in `streams/W4-direction.md`).
3. **Function furnishing against walls.** Each sub-space gets a cluster of 3–7 kit pieces that names it (consoles and
   scanner arches for a checkpoint, test benches and probe arms for diagnostics, pump skids and pipe runs for coolant…),
   mounted on or backed against walls/partitions, never floating islands in the fight circle. Reuse the four CC0 kits
   in `public/assets/kits/` and existing authored props; build simple original geometry where the kits lack a piece.
4. **Fixture light.** Every pool of light has a visible source in or just out of frame (strip, lamp, screen, doorway);
   shapes follow the fixture. Each sub-space has its own key tone inside the room's mood palette. No disc pools.
5. **One landmark per room visible from the fight circle**, and something of interest in **every** 40% window.
6. **Story traces** (sparingly): the evacuation, the infestation and the fight left marks appropriate to the act.

## Method

- **Standard first on the three worst rooms**: Diagnostic Gallery, Crew Checkpoint, Swarm Junction. Capture each from
  at least five marine positions (spawn, centre, two sub-spaces, exit) at 1920×1080 and look at the PNGs yourself at
  native size and at 480×270. Do at least three critique → fix rounds; write the critique of each round down
  (`docs/nextgen/plans/E9-standard-review.md`), including a side-by-side with the original Residential frame.
  Do not propagate until those three are clearly better than Residential is today.
- **Then propagate to all twenty** (you may use up to 6 Sol sub-agents; give each a disjoint room set and disjoint
  files, keep shared modules with you). Raise Residential and the other already-decent rooms to the new wall standard.
- Add a capture scenario family that walks five positions per room (`room-tour:<room>`), and a contact sheet
  `artifacts/nextgen/e9-final/tour-<room>.png` (five frames per room) plus `twenty-calm.png`, `twenty-kiting.png`.
- Extend the automated checks: a test that every named sub-space of every plan has a floor treatment, at least one
  furnishing cluster and a light fixture; and that no dressing piece intrudes into walkable lanes/openings/fight circle
  beyond what the plan declares.

## Rules

- Presentation only. Do **not** change collision, plan geometry, spawn/exit/breach positions, navigation, enemies,
  abilities or balance; gameplay bytes under `src/game/**` stay identical apart from additive presentation metadata
  (names/tags for sub-spaces) if you need it. If a plan makes a room impossible to dress well, write it under
  "Integration requests" instead of changing it.
- Budgets: draws ≤ 330 and frame p95 ≤ 20 ms on High at 1920×1080; zero mid-combat shader compiles; room preparation
  ≤ 3 s; Low stays cheap (zoning and wall caps must survive on Low — they are readability, not decoration). Use
  instancing/merged static batches and existing material families; no new per-room shader programs.
  Performance numbers are certified later by the integration agent; do measure draws/triangles/programs per room.
- Combat readability beats decoration: nothing in the fight circle taller than a decal, no saturated red/orange floor
  graphics (reserved for danger), no high-frequency noise under actors.
- Preserve all gameplay, determinism, persistence, navigation, accessibility and authored-room assertions. Presentation
  pins that the new look supersedes may be rewritten to an equivalent guarantee — list each one in the report.
- CC0-only third-party assets; keep manifests, credits and licenses. No new downloads without recording source+license.
- Do not use computer-use / desktop-control tools. One browser at a time. Rerun load-induced failures in isolation
  (`VITEST_MAX_WORKERS=2`). Delete intermediate capture rounds; keep only `artifacts/nextgen/e9-final/`.
- Work only in your worktree; commit on your branch; no push, no PR. Converge: when the gates pass once and the
  twenty tours are reviewed, stop — no extra proof infrastructure.

## Acceptance

- Gates in `01-ENGINEERING.md` (JavaScript ones; the Blender-dependent Python tests are a known local gap).
- `artifacts/nextgen/e9-final/` with twenty five-frame tours, the two twenty-up sheets and a before/after sheet against
  `l8-final`.
- `docs/nextgen/E9-REPORT.md`: per room — what names the place now, landmark, per-room draws/triangles; rewritten
  presentation pins; integration requests; and an honest list of the rooms you still consider weakest and why.
