# HUD19 threat visibility

The 1920×1080 kiting captures contain four frames per room in each of
`artifacts/nextgen/hud19-before` and `artifacts/nextgen/hud19-after`.
The table lists frames 01 through 04 in order. Coverage is the intersection
area of each manifest's projected eight-corner enemy body bounds and the dock
rectangle, divided by the full projected body rectangle. I located the dock
edges in the PNGs. The wide baseline dock spanned approximately x=549–1371 and
y=968–1058. The compact dock spanned approximately x=621–1299 and y=984–1058.
This measures rectangular overlap, including translucent chrome. It excludes
off-screen loss, world geometry, and other HUD panels. Boundary estimates and
projected boxes can differ from the actual limbs and silhouette.

| PNGs in each capture | At least half before | At least half after | Any overlap before | Any overlap after |
| --- | --- | --- | --- | --- |
| `g6-kiting-crew-checkpoint-01.png` to `-04.png` | 0, 0, 0, 0 | 0, 0, 0, 0 | 4, 3, 3, 2 | 3, 3, 3, 3 |
| `g6-kiting-relay-racks-01.png` to `-04.png` | 0, 0, 0, 0 | 0, 0, 0, 0 | 4, 3, 3, 3 | 3, 3, 3, 3 |
| `g6-kiting-overload-floor-01.png` to `-04.png` | 1, 1, 0, 0 | 0, 0, 0, 0 | 2, 2, 4, 3 | 2, 2, 3, 3 |
| `g6-kiting-diagnostic-gallery-01.png` to `-04.png` | 0, 0, 0, 0 | 0, 0, 0, 0 | 0, 0, 0, 0 | 0, 0, 0, 0 |

In combat the active weapon, magazine numeral, five numbered weapon pips and
ability controls occupy a narrower, shallower dock. The expanded mode chips
wrap their full labels between fights. The Weapons tab on pause shows the five mode names
and equipped ammo. Critical numerals keep their own opaque backgrounds.

The camera uses the compact dock reservation and favors lower committed or
coached contacts when they compete for space. An arrow can sit above the lower
dock when the body intersects it. Equal recent hits on one target display as a
single amount and multiplier. Committed attackers block combat text placement
over their projected body, and their periodic damage readouts yield while they
attack. The visible text pool is limited to eight entries.

The half-covered threshold dropped from two body-frame instances to zero.
Partial overlap persists. Overload Floor still has one, one and two committed
Spitters intersecting the dock in frames 01, 02 and 03 respectively. The first
after frame shows the arrow and warning above the dock while the lowest Spitter
has legs behind the ability controls. Relay Racks still loses some lower
anatomy at the screen edge. Crew Checkpoint shows more of the pack in the first
frame, but the dock still crosses legs in later frames. The Diagnostic Gallery
fixture had no dock overlap on either run, so those frames cannot verify the
specific historical lower-Spitter occlusion. The captures do not establish
complete visibility for every attack during live play.

The production build passed. The native fast Cryo campaign on seed 1729 cleared
Awakening Bay, Passenger Vault, Residential Gallery and Communal Atrium with
zero errors. Its report is `artifacts/nextgen/playtest/cryo-1729/index.html`.
The 1280×720 combat capture is `hud19-720/g6-kiting-diagnostic-gallery-01.png`.
The desktop resize survey changed from 1920×1080 to 1280×720 and back. Its
`hud19-resize-final/resize-00.png`, `resize-21.png`, and `resize-40.png` show
the full tray between fights. The survey recorded no page errors.


The pause captures are `hud19-pause-final/pause-loadout.png` and
`hud19-pause-final/pause-weapons.png`. Both fit at 1280×720. The after kiting
frames have no marine/HUD intersections. The largest recorded playable-AABB
outside fraction was 3.73%, and the smallest projected marine height was
100 CSS pixels.

| Rig | Communal Atrium overlap capture | Peak visible damage labels |
| --- | --- | --- |
| Breacher | `hud19-after/value14-overlap-breacher-communal-atrium-06.png` | 8 |
| Cryo | `hud19-after/value14-overlap-cryo-communal-atrium-01.png` | 6 |
| Pyro | `hud19-overlap-retry/value14-overlap-pyro-communal-atrium-03.png` | 8 |
| Arc | `hud19-overlap-retry/value14-overlap-arc-communal-atrium-01.png` | 5 |

A concurrent production rebuild interrupted the first Pyro capture with a
missing asset request. Pyro and Arc completed in a separate capture against
the finished distribution. The kiting captures and Breacher/Cryo overlaps
precede the pause-only layout changes. The final build and pause captures
include those changes.
