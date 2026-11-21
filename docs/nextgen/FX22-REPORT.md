# FX22 ability presentation

The baseline uses the production build at `0b97db74`. The staged ability timelines and overlap frames are in `artifacts/nextgen/fx22-before/`. The native ten-room Arc campaign at seed 1729 writes its Transmission Chamber fight and room-clear snapshots to `artifacts/nextgen/playtest/fx22-before-arc/`.

## What the player sees

- Napalm's canister throws three separate rising lobes. Each has a bright heart above the landing. The mature scar retains its merged coal edge, individual tongues and dark gaps. Three irregular interior pockets brighten in succession. Warning coverage suppresses those added flares while leaving distant pockets lit.
- Meltdown has a moving amber fill that grows hotter toward the marine. The visor and silhouette cut through it. The native quarter-second tick sends a pulse across the floor and a short spark up from each hit target. Embers rise around the boots.
- Overload carries a broad white strike with a violet skirt to each successive contact. The terminal fork converges on the struck shell and holds there through the last fraction of the discharge. Overclock brightens the electrical seams on the moving suit. Its native cast slows hostile time, so a rifle hit supplies the impact in its Armory contact scene.
- Railbreaker retains the white beam and short reverse-fading skid. A short white flash at ground level and an amber spark travelling back along the throw locate touchdown as the dust starts. The number follows the thrown target to the skid and stays there if the body retires.
- The hostile warning batch draws a narrow red stroke with a light centre on the leading side of the earliest overlapping attacker. It uses the creature positions projected through the gameplay camera and the native remaining wind-up times. Its origin is submitted after the other warning strokes.

The effects reuse the procedural burn, flame instances, ribbon, spark and warning materials. The shader changes share their existing prepared variants. Low uses fewer standing flames, particles and bolt details. These changes request no additional lights.

## Comparison and cost

The main gallery is `artifacts/nextgen/fx22-after/`. Its `review/` folder contains one three-panel sheet for each ability and all eight frames for each of the four overlaps. The left and middle panels compare the same Awakening Bay frame at 480×270. The right panel shows Communal Atrium overlap for Napalm and Overload, or Armory contacts for the ultimates. Native originals are 1920×1080. The Railbreaker sheet uses the corrected touchdown labels from `fx22-after-landing/`. Overclock's Armory panel uses `fx22-after-armored/`, where the actual rifle hit is reported as an armor contact for 16 damage. The pale fork meets the front brute at that contact. The longer Pyro timelines are in `fx22-after-contact/`.

| Overlap | FX20 peak draws | FX22 peak draws | Largest increase at the same frame | Resident programs |
| --- | ---: | ---: | ---: | ---: |
| Pyro | 139 | 139 | 3 | 151 |
| Arc | 136 | 139 | 4 | 151 |
| Cryo | 135 | 138 | 3 | 151 |
| Breacher | 143 | 143 | 2 | 151 |

The red sector and shooter stroke remain distinct wherever they are active in the 32 overlap frames. The red edge crosses the bright part of the Pyro splash. In Arc the white contact draws the eye briefly, but the red edge remains distinct against the violet links. The five individual ability timelines each held 158 programs. Before and after peak draws were 122 / 122 for Napalm, 124 / 125 for Meltdown, 124 / 124 for Overload, 124 / 124 for Overclock and 129 / 129 for Railbreaker. The staged draws and resident inventories are from the capture manifests. The High and Low Pyro and Arc benchmarks in `fx22-after-bench/benchmark.json` each recorded zero new combat programs and zero GL errors. Concurrent browser workloads make the timing samples unsuitable for hardware frame-rate claims.

In `review/napalm-life.png` the lobes are separated at impact and the fuel pockets are still lit at 3.15 seconds. The timeline probes for Napalm, Meltdown and Overclock recorded zero new programs from cast through expiry. The baseline ten-room Arc run cleared Transmission Chamber with zero errors and zero reported defects. Its native start, mid-fight and clear frames are also in `fx22-before/transmission/`.

The two weakest reads are the warm pools inside resting Napalm, which still look soft at 480×270, and Overload's terminal fork during the brightest part of a hop, when the broad violet falloff can compete with the smaller limb detail.

The matched native crowd study is `review/attacker-separation.png`. A stalker (ID 12) and crawler (ID 9) overlap at 2.117 s of the same Communal Atrium encounter. The native timers are 227 ms and 320 ms respectively on both builds. In the native-size crop a short white-centred red stroke leads from the stalker along its warning while the crawler keeps its outline. The upper panels show the same frame at 480×270. The two manifests in `fx22-owner-before/` and `fx22-owner/` record the target IDs and timers. The full-rate Transmission Chamber replay separately records ordinary native play from the earned baseline room-nine clear.

The Transmission replay cleared with zero errors or reported defects. It held 145 programs at room open and clear and recorded 150 storyboard observations in `playtest/fx22-after-transmission/`. The pressure frame at 287.400 s shows a crawler striking and a second crawler winding up beside the marine, with a spitter preparing at a distance. The matched Communal Atrium study isolates the two-overlapping-wind-ups case. The final armored-contact Arc benchmark also recorded zero new combat programs and zero GL errors on both tiers (`fx22-release-bench/benchmark.json`).

Both six-room campaigns on the final build cleared with zero runtime errors. Both opened and closed the six fights with 161, 154, 149, 156, 155 and 155 programs respectively. The harness returned a nonzero status for room loads over five seconds, three on Pyro and one on Arc. The records are `playtest/fx22-release-pyro/report.json` and `playtest/fx22-release-arc/report.json`. The final TypeScript and production build passed.
