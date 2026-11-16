# P11 infested, maintenance and containment assets

Original MIT geometry. Rebuild commands:

```sh
blender -b --factory-startup -P tools/assets/p11-set-pieces/infested.py -- --render --modules
blender -b --factory-startup -P tools/assets/p11-set-pieces/maintenance_containment.py -- --render
```

`cpu_preview.py` uses four CPU threads and16 samples without device discovery. Initial Metal previews stalled under shared host load; stopped only these task-owned processes before restarting CPU previews. No browser processes launched by this modelling subtask.

All models use shared named finish batches, geometric normals, vertex AO/curvature/wear and emissive material zones. No normal-map bake is claimed; no texture memory is added. The main runtime owner integrates the placement modules and tier policy.

## Actual beauty inspection and corrections

Opened all six initial hero renders. Workshop machine had a readable cutting throat and feed bed but growth was buried in its metal body. Moved the growth mantle to front and crown surfaces, then corrected exposed root ends to join the crown mantle. Kept the tool/spindle throat clear. Brood plenum initially buried its eggs in an oversized growth blob and had apparently detached straight grille bars. Reduced growth, raised eggs, replaced bars with bent strips anchored in the mouth roof, added top cooling grille, fasteners and airway ID. Opened revised renders of both.

Pump initially had unconnected return-pipe ends and a floating flow terminal. Added deck receiver sockets and a terminal pedestal. Winch gained brake lock bolts and linkage, a terminal and gearbox handle, and its stencil moved onto the actual top face. Emitter and ring first passes were too simple: plain repeated posts and a torus. Added forked optic crowns, calibration hatches, conduit returns and numbers to the emitter; segmented gasketed shield sectors, clamp locks, identification plates and hydraulic lines to the ring. Opened revised beauties. Emitter crown was cropped by the default camera; the final render uses1.18 framing scale and was opened to verify full bounds.

## Workshop room review

Opened all five native room-tour frames and kiting02 from `p11-standard-round1-fixed`, then all six exact480 reductions. Opened matched E10 native tours02 and04 from the E10 worktree. First placement in the north lathe obstacle was almost entirely outside the gameplay crop; oversized legacy overhead bridges still dominated centre views and rear04 was essentially unchanged. It was not a successful first room round.

Moved the unique machine to the east gantry solid at(1200,340), rotated90 degrees at1.8 scale. Its transformed bounds remain inside the existing160×280 obstacle. Replaced the corresponding generic source. Added a distinct low repair bench, roots and egg clutch to the existing southern workbench obstacle; bench at.85 scale is.86m high. Removed the generic workbench to avoid overlap. These revisions require the lead's next actual room captures; do not claim they were present in round1.

## Placement and retained structures

No simulation or collider edits. Infested and maintenance placements use the existing readiness/batching/cutaway owner. Coolant replaces first obstacle's generic pump. Shaft winch sits immediately inside the west shaft curb at(420,330), supplementing retained lift guides/counterweight. Shield emitter replaces the named northern backing housing (lead integration hides it). Annulus ring rests over the retained sealed core roof; the sealed core and story equipment remain owned by their existing builder.

## Limits

Room readability and final performance depend on the lead's serial captures and benchmark. Shader compilation, per-room draw counts and preparation time are not certified by Blender renders. Growth remains deliberately coarse and dark at game scale; it is the weakest sculptural part of this set and should be judged in native room captures.
