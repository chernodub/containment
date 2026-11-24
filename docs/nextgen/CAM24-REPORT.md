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
legal position along the path back into the room. Both capture
contracts (marine body and priority pair) read the active limit from the
room-framing diagnostics.
Archived captures without that field retain their 18% interpretation.

The 45% value is provisional pending the native damage comparison and
visual review. The base build and the candidate production build passed.

In the staged PLAY23 Safety Interlock edge frame, the marine moved
from roughly 4% to 36% of frame width compared with the archived
capture. The newly visible left side is the dark ship subdeck. The
candidate screenshot failed the existing warning visibility check
because no retained warning panel was fully readable in the allowed
region. The failure is retained in
`artifacts/nextgen/cam24-edge-inspection/`.

The serial native baseline began at load averages 3.21 / 2.07 / 2.12.
The one-minute load later reached 34.49 on this 10-core host while
other Chromium and Metal compiler jobs were active. This receipt
cannot establish the requested quiet-machine comparison.

The first kiting captures showed that an existing engagement fit could
move the marine below the preferred band. The updated candidate retries
the centre correction after engagement framing. It retains the preceding
pose when the correction would change zoom or fail the room and full-body
clearance checks. This makes the centre band a preference at conflicting
positions.

The Safety Interlock warning check also failed at 24% outside area:
its rightmost corner projected just beyond the frame. At 22% the same
fixture passed all capture diagnostics. It places the marine around 30%
of frame width and leaves the warning fully visible. The current
candidate therefore uses 22% pending the native comparison.

The baseline Arc run ended in Service Shaft Landing after 13 clears.
It took 490.5 total damage and hit 1,010 of 1,323 shots (76.34%),
with zero runner errors. Host contention prevents treating this run as
quiet-machine evidence.

The matched 1920×1080 scenario sets each produced 13 verified PNGs.
In Communal Atrium's active coolant fixture the marine moved higher
above the dock. In the dark cargo fixture the marine moved farther
from the left edge. Armory Cryo still loses part of its lower approach
to the dock and frame edge.

At 1280×720 the candidate Armory Cryo capture passed, but the Safety
Interlock warning check failed. The base build passed the same
1280×720 Safety Interlock fixture. The candidate resize fixture
completed 60 frames without a page error, going from 1920×1080 down
to 1280×720 and back. Its minimum measured screen clearance was
208.8 px and its minimum gap from a HUD element was 0.8 px.

The compact desktop limit is 7% at 720 CSS pixels. The limit increases
linearly to 22% at 1080 CSS pixels. The 7% Safety Interlock trial passed
the warning check at 1280×720, after 18% and 22% both failed. In the
matched edge fixture, the projected silhouette centre moved from
5.77% to 31.59% of frame width at 1920×1080 and from 8.20% to
18.99% at 1280×720.

## Corner and compact desktop review

I reviewed 80 calm frames at the nearest legal position to each of
the four bounding-box corners in each of the twenty story rooms.
The exterior was the dark ship subdeck in every room. I found no
sky-colour gaps or unfinished exterior geometry. The largest AABB
outside share was 22.00%. The largest exact-hull outside share was
52.17% at Shielding Gate, where the playable hull turns inward from
its bounding box. Some corner poses still push the marine outside
the preferred centre band when the AABB allowance is spent.

The compact-cap build produced all five requested 1280×720 PNGs
without capture failures. The final 60-frame desktop resize fixture
recorded zero errors, 174.65 px minimum screen clearance and 0.81 px
minimum clearance from a HUD element. The final TypeScript and Vite
production build passed. The 1080p matched example frames measured
100.00–120.72 px of hero scale on the base and 100.00–121.09 px on
the candidate.
