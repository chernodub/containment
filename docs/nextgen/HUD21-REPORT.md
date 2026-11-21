# HUD21 threat visibility

The baseline is nextgen at `064f0acd`. The 1920×1080 `hud21-before` capture has
four frames each from the Armory Cryo rig fight and kiting in Shielding Gate,
Armory, Crew Checkpoint and Relay Racks.

I used the capture manifest’s projected eight-corner body rectangles and
measured the compact dock from the PNGs. A body counts once per frame if it is
within 192 world units (6 m) and either at least half its full rectangle
intersects the dock or its rectangle crosses the viewport’s bottom edge.
A body entirely below the viewport is reported separately. The dock’s
translucent areas count toward geometric overlap, as do portions that yield.

The baseline has zero qualifying bodies in all 20 frames. The visible lower
approach concern is farther out in these fixtures. The charging Brute in the
first Armory Cryo frame is 10.7 m from the marine.
