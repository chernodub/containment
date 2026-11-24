# CAM24 room camera framing

## Final15 baseline

The archived traces project the marine at 0.65 m above the deck. I used
that point as the centre proxy and counted observations outside x=384–1536
or y=216–864 at 1920×1080. The traces omit the marine body rectangle.
Dock overlap is therefore an estimate using a 76×150 px rectangle around
the projected point against the HUD21 dock at x=621–1299 and y=984–1058.
The estimate does not account for pose, perspective or HUD displacement.

| Campaign | Observations | Centre outside central 60% | Estimated body overlaps dock |
| --- | ---: | ---: | ---: |
| arc | 9,011 | 1,757 (19.50%) | 0 (0.00%) |
| arc-2718 | 8,161 | 1,077 (13.20%) | 0 (0.00%) |
| breacher | 9,013 | 1,479 (16.41%) | 0 (0.00%) |
| cryo | 3,606 | 540 (14.98%) | 0 (0.00%) |
| pyro | 8,177 | 2,338 (28.59%) | 0 (0.00%) |
| story-cryo | 8,206 | 898 (10.94%) | 0 (0.00%) |

## Camera candidate

The candidate allows 45% outside the playable AABB across the usable
viewport, subject to the existing small-axis rules. The camera prefers
the middle 60% horizontally and 30–62% vertically for the marine's
projected centre. It preserves the existing follow spring and body-safe
viewport. When neither axis is small, the clamp searches for the nearest
legal position along the path back into the room. The capture marine
contract reads the active limit from the room-framing diagnostics.
Archived captures without that field retain their 18% interpretation.

The 45% value is provisional pending the native damage comparison and
visual review. The base build and the candidate production build passed.
