# HERO24 handoff: the selector kit on the play marine

## Before
The PORTRAIT24 selector shows a different piece of kit on each rig: Breacher's strike plate, Cryo's dewars, Pyro's
exhausts and Arc's forked mast. In play, all four rigs were the same white figure with a differently coloured dome.
In greyscale the four could not be told apart (`artifacts/nextgen/hero24/hero24-before-sheet.png`: per rig the
portrait, a calm Relay Racks crop and a `value14-overlap` fight crop (frame 04); rows show native colour, 480×270,
greyscale, and greyscale at 480×270). In play the camera looks down from a high three-quarter angle and the marine
stands about 135×185 px inside its marineBounds at 1920×1080.

## What changed
- `tools/assets/k12-hero/game_kit.py` (new) holds game-scale versions of the four selector assemblies. They are
  built in both LODs, and the high copy feeds the normal bake. The portrait build (`--portrait-kit`) skips them
  and keeps its own close-up kit. Each assembly replaces the old back-pack parts that stood in the same place.
  - **Breacher:** a clipped-corner strike plate on the left forearm (~.45×.60 m). It stands off the forearm and
    tilts up toward the camera, with a gunmetal shoe, three cleats and two short steel rams.
  - **Cryo:** two tall dewars (.60 and .66 m) leaning back out of a gunmetal saddle, with straps and valve nuts.
    A dark insulated loop arches over both of them.
  - **Pyro:** two fuel bottles with straps. On top, two flared heat-tinted exhaust stacks lean out and back, each
    capped by a small fire-glow puck. The "wide launcher nozzle" in the portrait belongs to the weapon model,
    which is shared with play, so it was not changed.
  - **Arc:** a steel pylon rising behind the left shoulder above the helmet. It carries a stack of five
    insulators, then a brass fork with two small arc-glow terminals.
- `marine.py`: parts named `kit24 paint …` keep their rig material and get `rig_paint = 1`, so in play they take
  the same painted-ceramic path as the dome. Everything else uses the shared gunmetal, steel, rubber and glow
  atlas roles.
- `src/render/models.ts`: the human marine's height metric (`span / size.y`) now ignores `k10-rig-*` meshes.
  Without this, the Arc mast would have shrunk every rig by about 11%, because the metric is taken with all
  rig meshes visible. In-game marine scale is unchanged: the Breacher calm bounds are 181 px tall now and were
  184 px before, with the difference coming from pose and plate.
- Shading: no shader edits. The new parts are on the same single atlas material, so there are no new programs.
  The glows are small terminals; the kit does not carry hostile lantern colours or pickup-style glow.
- `atlas_view.py` can now pose the authored `m10-*` clips by importing `motion/marine-motion.glb`. Its `m10-run`
  frames come out with a wrong root orientation, so run and brake were judged from the in-game fight sequence
  instead.

The rebuild follows the HERO19 handoff: bake, marine-only meshopt,
`resize-embedded.mjs … 1024`, marine-only shadow LOD, then `cp` to `plain/marine.glb`. The two files are
identical, and the packer rewrote no other model files.

## Bug found on the way
The first Pyro build drew **black squares** at the stack tops during fights. The cause was a zero-area glow disc
(a lathe profile with coincident points), which shades to NaN and is then spread by post. It is now a closed
puck. The old pyro exhaust uses the same disc pattern, but it is no longer in the build.

## Measurements
| | Before | After |
|---|---|---|
| Body + largest rig triangles | 24,206 (Arc) | **24,842** (body 20,644 + Arc 4,198; Breacher 2,706, Cryo 3,434, Pyro 3,702) |
| Marine draw calls | 2 (body + rig) | 2 (no new meshes; shadow LOD re-appended) |
| `marine.glb` (= `plain/marine.glb`) | 6,440,364 B | 6,486,084 B (+0.7%), PNG textures 1024 |
| Rest-pose top, model units (÷6.8 = m) | 14.095 (2.07 m) | Breacher/Pyro unchanged; Cryo 14.472 (+0.06 m); **Arc 15.891 (+0.26 m, +12%)** |
| Rig-colour pixels per calm frame, mean of 10 rooms | B 817 · C 2,442 · P 1,113 · A 671 | B 1,104 (+35%) · C 4,504 (+84%) · P 1,767 (+59%) · A 976 (+45%) |
| Coverage share (`shade15_coverage.py`) | B 5.0 · C 14.7 · P 6.4 · A 4.1 % | B 6.7 · C 20.6 · P 8.1 · A 4.6 % |
| Playtest breacher / arc, seed 1729, 4 rooms, fast | — | 4 rooms cleared, 0 errors each; programs flat per fight (163/156/153/159 at start = mid = clear) |

Two caveats on these numbers:
- The coverage share divides by a figure box that now also contains the kit, so pixel counts are the fairer
  comparison. Cryo's figure also picks up the teal Relay Racks floor in that tool's hue window.
- Balance and height: the game's own scale metric excludes the kit (see `models.ts` above). A headless tool that
  reads the GLB's full bounds would see Arc 0.26 m (12%) taller and Cryo 0.06 m taller. Body height is unchanged.

## Evidence
`artifacts/nextgen/hero24/`: `hero24-before-sheet.png`, `hero24-after-sheet.png` (layout as above),
`pyrofix.png` (Pyro and Breacher fight frames 04 and 07 after the fix), `motion-sheet.png` (strike and shotgun
poses), `review-a.png` (rest pose from game yaws), and `coverage-{before,after}.txt`. Raw captures are in
`artifacts/nextgen/hero24-before/` and `hero24-after/`, and the playtests in
`artifacts/nextgen/playtest/{breacher,arc}-1729/`. Rebuild the sheet with
`node tools/assets/k12-hero/hero24_sheet.mjs <label>`. `npm run bench` was not run (budget).

## In play now
- **Cryo:** two blue cylinders stand behind the shoulders under a dark loop, the biggest change of the four.
- **Arc:** a thin mast with a violet insulator stack rises well above the helmet and forks at the top.
- **Pyro:** two dark stacks with hot tips lean back over the orange dome and bottles.
- **Breacher:** a yellow slab joins the dome as a fin in the fight frames. In the calm aim pose the weapon and
  body mostly hide it.

In greyscale, Cryo (twin cylinders), Arc (mast) and Pyro (two stalks with bright tips) are tellable at 480×270.
Breacher is told apart mainly because it lacks those shapes.

## Weakest remaining
1. **Breacher's plate** sits on the left forearm. In the aim pose that forearm runs under the gun on the far side
   of the body, so from the play camera the plate merges with the dome or is hidden. It does not read as the
   portrait's shield. A next step would mount a second, shoulder-side plate edge on the clavicle, or turn the
   forearm out in the Breacher hold.
2. **Rig colour is still a small share of the figure:** Arc and Pyro are under 10%. Their new mass is mostly
   steel, gunmetal and heat tint. Painting the pylon and stack jackets would add colour, but would also make the
   kit read more like a coloured pickup.
