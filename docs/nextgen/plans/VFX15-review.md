# VFX15 working visual review

## Overdrives (Crew Checkpoint, Relay Racks)
Before (final7 04): Whiteout, Meltdown and Overclock = the same white + element Shock rings (my VFX13 shared activation)
plus rig-module rings and the Aura ring field. One template, recoloured.
R1 (`vfx15-od-r1`): shared rings removed everywhere (OverdrivePayoff, cryo pulses/aura, arc rings/front/timeField, meltdown
impact ring). New FlagshipFx `Climax` mode (cell-noise floor, one program) with three element branches + per-rig extras.
Three different reads already; Whiteout's early front was a spiky sunburst, Meltdown activation still carried a 360° fire
swirl from VFX14, Overclock's sustain was faint.
R2: VFX14 swirl replaced by a small kill-burst fireball (burst phase only); Overclock sustain lifted; frost cracks masked.
Whiteout early front then read as a uniform white drum.
R3: seam-free angular noise splits the frost front into uneven racing tongues; wall band thinner while small. Accepted:
Whiteout = jagged frost wall racing out, ice plates, ice climbing enemies, pulses travel the crack lines, shard shatter end;
Meltdown = heat column, molten cracks/blisters spreading irregularly under him, standing flame on nearby enemies;
Overclock = chromatic snap, flickering glass fracture field, lightning between enemies and along machinery, reverse snap.
Weakness: Whiteout's frost film lifts the dark Relay Racks floor a lot; Overclock cells read slightly as a hex grid;
the Meltdown heat column (Pillar ribs) is whitish rather than orange.

## Napalm Charge (Relay Racks, Crew Checkpoint)
Before (final7 04): an opaque black disc with a lava leopard-print pattern — a stamped texture.
R1 (`vfx15-np-r1`): new `Tongues` mode (eight camera-facing procedural tongues in one mesh, sliver columns discarded),
soot made a soft irregular underlay, short Fire-mode fireball on landing, thin landing outline during flight. Tongues read
as small white candles; interior still leopard print.
R2: wider, taller, more orange tongues; fuel pockets sparser. Native crop: tongues were smooth paper cutouts with a hard
flat base.
R3/R4: forked licking tips, noise-broken body, soft base, temperature by height; pool edge shifted from deep red to
orange-amber so it never reads as the hostile warning colour. Accepted: dark soot pool, standing flickering tongues with
height, boiling bright edge at the exact radius, embers and smoke. Weakness: tongues are still on the small side seen
from the steep camera and their spacing is fairly even.

## Effect priority in full builds (Armory, 25 enemies)
Before (final7 04): concentric rings and frost/fire sheets over the fight.
R1 (`vfx15-fb-r1`): native crop shows the hostile priority mask already opens FlagshipFx around actors and warnings;
what buries the fight is ring count and the bright sustained frost wall.
R2: shared sustained-coverage budget in FlagshipFx (`fxYield`; impact beats and the first .9 s of a climax exempt;
cap 110 m² High / 70 m² Low, floor .45). Little visible change at +150 ms (impact frames are exempt by design).
R3: Shock fronts broken into arcs by angular noise; Cryo Nova's second FriendlyBoundary ring removed; Whiteout's
sustained wall dims after the race. Accepted: enemies and red warnings read in all three; cryo +150 ms is still the
busiest frame (Nova arcs + Whiteout front + blizzard streaks overlap).

## 480×270, HUD hidden (`vfx15-480`, `vfx15-480m`)
Overclock, Railbreaker and Whiteout (+600 ms) identifiable at a glance. Meltdown was thin → cracks widened, spread faster,
floor glow raised; now reads as a molten floor with enemies standing in flame. Whiteout's +30 ms frame is mostly flash.
