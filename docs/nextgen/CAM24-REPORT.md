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

## Direct-clamp trials

The room clamp allows up to 22% outside the playable AABB at 1080 CSS
pixels and 7% at 720 CSS pixels, interpolated between those heights.
The camera prefers the middle 60% horizontally and 30–62% vertically
for the marine's projected centre. It retries that preference after the
existing engagement fit and keeps the preceding framing if the move
would change zoom or fail room coverage or full-body clearance.
The follow spring, aiming projection and scale targets are untouched.

The marine and priority-pair capture contracts read the limit from the
live framing receipt and default archived receipts to 18%. The 45%
and 24% trials cropped the physical Safety Interlock warning at 1080p.
The 22% trial kept it visible. At 720p the warning check failed at 22%
and 18%, then passed at 7%.

## Direct-clamp desktop and room review

The matched 1080p scenario sets produced 13 verified PNGs each. The
Safety Interlock marine's silhouette centre moved from 5.77% to 31.59%
of frame width at 1920×1080 and from 8.20% to 18.99% at 1280×720. The
extra view shows the dark hull. In the active coolant fixture in
Communal Atrium, the marine moved higher above the dock. In the dark
cargo fixture, the marine gained space to the left. Armory Cryo still
loses part of the lower approach to the dock and frame edge.

I reviewed 80 calm frames at the nearest legal position to each of the
four bounding-box corners in all twenty story rooms. The exterior was
dark ship subdeck throughout, with no sky-colour gaps or unfinished
exterior geometry observed. The largest AABB outside share was 22.00%.
The largest exact-hull outside share was 52.17% at Shielding Gate, where
the hull turns inward from its bounding box. Some corner poses still
push the marine beyond the preferred band when the AABB allowance is
spent. All 80 separate 1080p kiting frames passed the current capture
diagnostics.

The compact-cap build produced all five requested 1280×720 PNGs.
The 60-frame resize fixture went from 1920×1080 to 1280×720 and back
without errors. Its minimum recorded screen and HUD clearances were
174.65 px and 0.81 px. The TypeScript and Vite production build passed.
The 1080p example frames measured 100.00–120.72 px of hero scale on
the base and 100.00–121.09 px on the candidate.

The captures are under `artifacts/nextgen/` in
`cam24-examples-before/`, `cam24-final-examples/`,
`cam24-desktop-720/`, `cam24-desktop-resize/`, `cam24-corners/`,
and `cam24-final-kiting/`. The first 45% Safety Interlock failure is
retained under `cam24-edge-inspection/`.

## Initial native comparison

The base is `f4212bf2`. Each native campaign uses seed 1729, standard
difficulty, the default room limit and `--fast --startup-timeout-ms=180000`.

| Rig and build | Outcome | Rooms cleared | Total damage | Hit ratio | Outside central box | Estimated dock overlap |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Arc base | Died in Service Shaft Landing | 13 | 490.48 | 76.34% (1,010 / 1,323) | 1,416 / 5,527 (25.62%) | 0 |
| Arc 22% | Complete | 20 | 716.98 | 80.28% (1,714 / 2,135) | 1,028 / 9,193 (11.18%) | 0 |
| Cryo base | Complete | 20 | 1,055.03 | 77.31% (1,356 / 1,754) | 2,213 / 8,286 (26.71%) | 0 |
| Cryo 22% | Died in Diagnostic Gallery | 10 | 372.99 | 75.94% (524 / 690) | 390 / 3,723 (10.48%) | 0 |

Both base runs recorded zero runner errors. Cryo recorded one loading
defect in Manual Control Chamber (5.08 seconds). Arc started at load
averages 3.21 / 2.07 / 2.12 and Cryo at 16.04 / 17.06 / 17.40 on the
10-core host. Arc's one-minute load reached 34.49 while other Chromium
and Metal compiler jobs were active. The base runs cannot establish a
quiet-machine comparison.

Across the 13 rooms cleared in both Arc runs, damage rose from 331.48
to 360.49 (+8.75%). The candidate cleared seven more rooms. It recorded
zero runner errors or defects and started at load averages 11.29 /
9.30 / 8.40. The Arc archived Final15 share outside the central box was
19.50%, compared with 25.62% on the fresh base and 11.18% on the
candidate. Estimated dock overlap was zero in all three traces.

Across the 10 rooms both Cryo runs cleared, damage rose from 189.07
to 264.99 (+40.15%). The 22% build failed the 10% damage bar despite
reducing the fresh base's out-of-box share from 26.71% to 10.48%.
The archived Final15 Cryo share was 14.98%. Estimated dock overlap was
zero in all three traces. The 22% Cryo run recorded zero runner errors
and zero defects. It started at load averages 3.84 / 6.91 / 8.44.
The 22% build remains unapproved. I began the tighter 18% trial at
load averages 2.38 / 3.43 / 5.60.

### Tighter direct-clamp trials

| Cryo cap at 1080p | Outcome | Clears | Total damage | Damage over shared clears | Hit ratio | Outside central box |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 18% | Died in Diagnostic Gallery | 10 | 389.10 | 359.66 vs 189.07 (+90.22%) | 78.75% (478 / 607) | 322 / 3,473 (9.27%) |
| 7% | Complete | 20 | 1,249.60 | 1,249.60 vs 1,055.03 (+18.44%) | 76.96% (1,296 / 1,684) | 1,129 / 8,908 (12.67%) |

Both runs recorded zero runner errors, defects and estimated dock
overlaps. The 18% trial started at load averages 2.51 / 3.44 / 5.59.
The 7% trial started at 11.67 / 6.57 / 5.85 and ended at 2.73 /
2.54 / 3.64. The lower limits did not pass the Cryo damage criterion.

I started another base Cryo run at load averages 2.44 / 2.49 / 3.59.
The next variant applies the extra room allowance only to the current
rendered camera when the marine is outside the preferred band and the
correction shows more of the hull. The base solver retains its own
pose, engagement progression and follow-spring state. The variant's
production build passed and its native comparison is pending.

### Quiet-host rendered-pose comparison

| Rig and build | Outcome | Clears | Damage | Hit ratio | Outside central box, strict |
| --- | --- | ---: | ---: | ---: | ---: |
| Arc base | Died in Infested Workshop | 14 | 482.33 | 79.57% (1,235 / 1,552) | 997 / 6,257 (15.93%) |
| Arc rendered-pose variant | Complete | 20 | 793.42 | 81.75% (1,980 / 2,422) | 2,366 / 9,396 (25.18%) |
| Cryo base | Complete | 20 | 1,267.15 | 76.33% (1,303 / 1,707) | 962 / 8,366 (11.50%) |
| Cryo rendered-pose variant | Complete | 20 | 1,109.37 | 74.87% (1,332 / 1,779) | 2,226 / 8,426 (26.42%) |

The Cryo damage fell 12.45% over all 20 shared clears. Both runs had
zero runner errors, defects and estimated dock overlaps. The base
started at load averages 2.44 / 2.49 / 3.59 and the variant started
at 2.55 / 2.47 / 2.83. The variant placed 1,337 observations in the
fraction of a pixel within 0.01 px of a central-box edge. With that
projection tolerance, the out-of-box share was 10.55% versus 11.50%
on the base. I retained the strict counts in the table.

The Arc candidate took 393.62 damage over the 14 rooms both builds
cleared, compared with 363.74 on the base (+8.21%). It cleared six
more rooms. The runs started at load averages 2.10 / 2.10 / 2.32 and
1.89 / 2.05 / 2.14, respectively, and neither recorded errors or
defects. Estimated dock overlap was zero in both traces. Counting the
1,305 Arc candidate observations within 0.01 px of the box edges as
on the edge, the out-of-box share was 11.29% versus 15.93%.

The rendered-pose variant passed the 10% comparable-room damage
criterion in both quiet-host pairs.

## Final rendered-pose verification

CAM24 uses 22% playable-AABB allowance at 1080 CSS pixels for the
extra rendered pan, tapering to 7% at 720 CSS pixels. The existing
engagement solver still uses its 18% limit. The capture diagnostics
receive the effective upper bound and continue to report exact-hull
coverage separately. The extra pan changes the current rendered
translation when it can improve the marine's centre without changing
zoom or losing full-body clearance. It leaves the existing follow
and engagement state available for the next frame.

The final build passed all 13 matched 1080p example captures and all
five 1280×720 captures. Safety Interlock moved the marine's silhouette
centre from 5.77% to 20.52% of frame width at 1080p and from 8.20% to
19.00% at 720p. The physical warning remained readable at both sizes.
The active coolant frame in Communal Atrium moved the marine above
the lower approach. Armory Cryo still has attackers partly under the
dock and below the frame.

In four calm corner positions per room, all 20 story rooms showed
dark hull outside the playable floor. I saw no unfinished exterior
geometry or sky-colour gaps. Maximum AABB outside area was 22.00% in
Service Shaft Landing. Maximum exact-hull outside area was 39.03%
in Shielding Gate. Extreme corners can still put the marine outside
the preferred band. The 60-frame desktop resize passed without page
errors, with minimum recorded screen and HUD clearances of 174.65 px
and 133.07 px. `npm run build` passed.

I also ran one five-second Arc benchmark per tier in Safety Interlock.
High median frame intervals were 16.70 ms on both builds, with p90
rising from 17.80 ms to 25.10 ms. Low p90 was 17.50 ms on both builds.
The runs started at one-minute loads between 2.43 and 3.68. This
short single-room comparison leaves the High tail unconfirmed.

The final evidence is under `artifacts/nextgen/` in
`cam24-rendered-examples/`, `cam24-rendered-720/`,
`cam24-rendered-resize/`, `cam24-rendered-corners/`,
`cam24-bench-base/`, and `cam24-bench-rendered/`. The before set
is in `cam24-examples-before/`. The quiet native receipts are in
`playtest/cam24-quiet-base-{arc,cryo}/` and
`playtest/cam24-rendered-{arc,cryo}/`.
