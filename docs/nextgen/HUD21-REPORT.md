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
first Armory Cryo frame is 10.7 m from the marine. Only two body-frame
instances in each gallery were within 4 m, and both already fit above the
dock in the baseline.

The camera scores committed contacts by distance, weighs nearby contacts
before distant aim targets, and probes the lower ground corner to account for
feet. If the full group fails the constrained solve, it can retry with the
nearest committed attacker. The existing render-pose validation still limits
the room AABB and protects the marine’s full HUD-safe envelope.

The dock fades only the segments intersecting the nearest overlapping
committed attacker’s projected upper body or forward strike proxy.
The faded segments retain outlined numerals. Shielding Gate’s 720p frames
01–03 show the weapon segment yielding, and frame 04 shows its return.
The action bar measured the same 641 × 74 CSS pixels throughout. In Armory
Cryo frame 02, the weapon and dash segments yield together. This reveals
in-frame anatomy through the HUD while bottom-edge clipping can still
hide legs in the same shot.

The 1080p and 720p samples use the new 12 CSS pixel type floor on the visible
HUD and sampled route, supply and rig cards. Supply card prices appear beside
their titles in `shop.png` at both sizes. The 720p workshop card shows
180 CR beside Upgrade Ice Road in
`hud21-paid-route-720/run15-junction-3-diagnostic-gallery.png`.

The production build passed. The four-room Cryo playtest for seed 1729 cleared
four rooms and recorded zero errors. The runner returned a nonzero exit code
for one 5.29-second Passenger Vault load. See `artifacts/nextgen/playtest/hud21-cryo-1729/report.json`.

## Per-frame counts

Each row names the four PNGs with suffixes `-01.png` through `-04.png` in
`artifacts/nextgen/hud21-before` and `artifacts/nextgen/hud21-after`. The
after dock measured x=621–1299 and y=984–1058 at 1080p, matching the baseline
estimate. Each sequence lists the four frames in order.

| PNG basename | Qualifying bodies within 6 m, before → after | Bottom-edge crossings at any distance, before → after | Entirely below at any distance, before → after |
| --- | --- | --- | --- |
| `v2-kit-cryo-high-armory-armory` | 0, 0, 0, 0 → 0, 0, 0, 0 | 5, 5, 6, 6 → 5, 6, 6, 7 | 2, 2, 2, 2 → 2, 2, 2, 2 |
| `g6-kiting-shielding-gate` | 0, 0, 0, 0 → 0, 0, 0, 0 | 2, 2, 2, 3 → 2, 2, 2, 3 | 0, 0, 0, 2 → 1, 1, 1, 2 |
| `g6-kiting-armory` | 0, 0, 0, 0 → 0, 0, 0, 0 | 0, 0, 0, 0 → 0, 0, 0, 0 | 0, 0, 0, 0 → 0, 0, 0, 0 |
| `g6-kiting-crew-checkpoint` | 0, 0, 0, 0 → 0, 0, 0, 0 | 4, 4, 4, 3 → 3, 4, 4, 3 | 0, 1, 1, 2 → 2, 1, 1, 2 |
| `g6-kiting-relay-racks` | 0, 0, 0, 0 → 0, 0, 0, 0 | 3, 3, 3, 3 → 3, 3, 3, 3 | 2, 2, 2, 2 → 2, 2, 2, 2 |

Across all distances, bottom-edge crossings rose from 58 to 59 body-frame
instances and fully off-bottom bodies rose from 22 to 27. Armory Cryo still
loses the lower pack and can lose more bodies at the edge. Shielding Gate and
Crew Checkpoint account for the bodies newly below the frame. The Armory Cryo
fixture includes live time before its burst, so matching frame numbers are
comparable views with slightly different simulation clocks.
The after frames recorded no marine/HUD intersections and a maximum
playable-AABB outside fraction of 0.074%.

The galleries completed with no capture errors or failed scenes. Earlier
after attempts hit the existing opaque-backing diagnostic while the dock
was deliberately transparent or returning from its fade. The final capture
keeps the original diagnostic for the rest of the HUD and recognizes the
yielding segment throughout its opacity transition.

A repeat run without overlapping captures also cleared all four rooms with
zero errors. The runner again exited nonzero on its loading diagnostic,
recording 7.72 seconds in Passenger Vault and 5.04 seconds in Residential
Gallery. See `artifacts/nextgen/playtest/hud21-cryo-1729-repeat/report.json`.
