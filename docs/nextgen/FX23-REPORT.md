# FX23 presentation review

The Overload Floor crossing has a broken amber track and small, separate bank markers. In Transmission the charge sweep advances beside a thin teal track. The deck and actors show through both. The placement previews and pylon and field boundaries use the same subdued floor treatment. The reactor itself still has a bright physical fixture.

Napalm stands on dark, uneven fuel with glowing seams and flames of different heights. A burning enemy has a tongue at its foot and warm light on its lower shell. Meltdown has a pale yellow heart at the boots, a flickering edge and rising fire in the scar. Against a winding-up enemy, the ground darkens and nearby flames shorten. In the Armory panel the marine and the red fan are visible inside the burn. The firelight competes for the existing pooled slots.

Overload has a white centre and a violet fringe. Each link ends in a flash on the target. Separate bodies show the path clearly in Awakening Bay. The nearby shooter stroke and red attack sector stay visible during the brighter Communal Atrium contacts. Whiteout leaves the deck visible between low crystals growing out from the centre. The advancing frost and frozen bodies frame the hostile fan in the Armory.

Light builds inside the Matron's carapace. Two red rings on the deck contract toward the native pod release points. Beside an escort's attack fan, the rings stay at the two release sites and leave the Matron's jaw visible. The brood comparison includes the live warning and subsequent pods both alone and with escorts. Native AI supplied the release timing.

## Evidence and cost

The production gallery in `artifacts/nextgen/fx23-after/` contains 69 full-size frames. Its `review/` folder pairs 480×270 panels for Utility, Napalm, Meltdown, Overload, Whiteout and Brood. The four Overlap sheets show all 32 final frames from `fx23-release-overlap/`. Across the four sequences, the active red contours and shooter strokes remain distinguishable through friendly particles. The white Arc contact briefly becomes the brightest object in its frame.

| Rig | FX20 peak draws | FX23 peak draws | Largest matched-frame increase | Resident programs throughout overlap |
| --- | ---: | ---: | ---: | ---: |
| Pyro | 139 | 139 | 3 | 153 |
| Arc | 136 | 139 | 4 | 153 |
| Cryo | 135 | 138 | 3 | 153 |
| Breacher | 143 | 143 | 2 | 153 |

The final build passed. Seed 1729 cleared six rooms on Pyro and Arc with zero errors and zero reported defects. The first run exposed one additional program during the Communal Atrium fight. Restoring the retreat marker to the existing material preparation fixed it. In the final runs each room ended with its starting inventory on both rigs, respectively 163, 156, 151, 158, 157 and 157. The six High and Low Pyro, Arc and Cryo benchmark runs recorded zero combat program creations and zero GL errors. Low uses nine standing flame positions and six frost branches. The final records are in `playtest/fx23-final-pyro/report.json`, `playtest/fx23-final-arc/report.json` and `fx23-release-bench/benchmark.json` under `artifacts/nextgen/`. The benchmark ran alongside capture workloads, so its timings do not establish hardware frame rate.

The two weakest reads at 480×270 are adjacent Overload contacts, which can briefly merge into one white flash, and Meltdown's central heat when the marine and a hostile fan occupy the same patch. Its outer flames remain easier to see than its heart in that frame.
