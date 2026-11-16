# CAM12 implementation and outstanding acceptance

Branch: `t3/camera-combat-framing`.

Implemented a conservative rotational marine envelope (minimum radius 1.45m,
height plus 0.30m) at the presentation framing boundary. Ordinary aim lead is
0.65m. Engaged target bias is bounded at 1.6m (0.8m reduced motion), plus at most
0.35m aim lead scaled by the usable viewport. Native melee windup/strike and
ranged pending attacks receive selection priority. Engagement zoom has an
absolute 0.88 floor; this is not a measured relative zoom bound. The existing
HUD viewport and room-AABB solver remain in charge of final constraints.

Edge bearings within 22.5 degrees merge with counts. Nonapproaching enemies
fade to 0.32–0.44 opacity; active attacks retain danger pulse and reduced-motion
support. No simulation, models, world geometry, or automated tests changed.

`npm ci` and the initial and final `npm run build` passed.

Baseline capture: `artifacts/nextgen/cam12-final`, three 1920×1080 calm frames,
all existing capture diagnostics passed. These were launched before the final
build and are baseline evidence, not acceptance evidence for the patch. Opened
Crew Checkpoint at native resolution: complete visible weapon/body, ample edge
clearance at spawn. These static frames do not reproduce the campaign failure.
Recorded baseline projected body screen-edge minima (not drawn-pixel/HUD minima):
Crew Checkpoint 419.14px; Armory 139.31px; Containment Annulus 143.06px.
All other room minima are unmeasured. The requested per-room animated pixel
margins cannot be claimed from these receipts.

First campaign invocation failed in the runner HTTP server with
`ERR_HTTP_HEADERS_SENT` at runner.mjs:231. Retry started with only one browser
and reached Awakening Bay; final outcome must be read from its report.

Acceptance remains incomplete: twenty-room position/eight-aim sweep, both
resolution six-room heavy bursts, exact reference before/after pairs, 480×270
inspection, final campaign storyboard review and measured benchmark. The
constant envelope is provisional: no evidence yet proves every cast extremity
fits it. Final engagement fitting still performs immediate corrections after
the spring; smoothness through target changes, dash, knockback, death and entry
has not been established. Room composition can still override distant enemy
visibility. This change must not be treated as CAM12 signoff.
