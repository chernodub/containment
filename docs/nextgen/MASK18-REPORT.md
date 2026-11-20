# MASK18 friendly effect clearings

The 128×72 priority texture covered 15 output pixels per texel at 1920×1080. Actors were stamped with overlapping discs whose coverage was evaluated at integer coordinates, while warnings filled whole scanline spans. The shader already sampled linearly in screen UV and had no binary threshold on the mask itself. Interpolating that coarse coverage still left visible steps where the bright Pyro fill met an actor or warning. Quarter-resolution postprocessing resized bloom and distortion, and the priority texture kept its fixed size.

The CPU now writes signed distances at texel centres for projected actor capsules and projected warning contours. The shader linearly samples those distances and maps them to a soft edge spanning about 9 output pixels at 1080p for a straight edge. Friendly opacity reaches zero in the warning interior. The marine retains both body and near-ground protection. The existing material preparation compiles the patched shaders, and the texture dimensions, sample count and render pass count stay the same on both tiers.

## Captures

Both High capture sets contain eight frames per rig in `artifacts/nextgen/mask18-before/` and `artifacts/nextgen/mask18-after/`. The matching review frames are listed below. I compared the combat area at native scale and the full frames at 480×270.

| Rig | File names in each capture set | Peak draws before → after | Programs before → after |
| --- | --- | ---: | ---: |
| Pyro | `value14-overlap-pyro-communal-atrium-04.png`, `value14-overlap-pyro-communal-atrium-05.png` | 142 → 142 | 149 → 149 |
| Cryo | `value14-overlap-cryo-communal-atrium-04.png` | 134 → 134 | 149 → 149 |
| Arc | `value14-overlap-arc-communal-atrium-04.png` | 140 → 140 | 149 → 149 |
| Breacher | `value14-overlap-breacher-communal-atrium-04.png` | 142 → 142 | 149 → 149 |

Draw counts match frame by frame across all 32 pairs. The same Pyro frame 04 in `mask18-after-low` and `mask18-after-scale09` shows rounded clearings and a readable marine. The Low run temporarily switched the existing scenario to Low before ability use. The 0.9 run pinned High render scale and disabled adaptive resolution for that capture.

The production build passed. The four-room Pyro playtest at seed 1729 cleared all four rooms with zero errors. Program inventory was flat from combat start to finish in each room, at 159, 152, 147 and 154 respectively. The playtest report is `artifacts/nextgen/playtest/pyro-1729/report.json`.

The clearings are projected gameplay footprints. Their outlines are approximate around extended limbs and weapon geometry. The mask no longer showed coarse steps in the reviewed frames.
