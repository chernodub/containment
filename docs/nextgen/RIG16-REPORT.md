# RIG16 character integration

Baseline was `c71a2807`. Capture comparisons use seed 1729 and the desktop production renderer.

## Marine paint

The K12 builder authorizes per-face paint and the marine exporter writes it as the scalar `_RIG_PAINT` vertex attribute. Painted zones include the outer vambraces and guards, both pauldron layers, crown stripes and crown halves, gorget, shoulder-blade plates, front and side thigh plates, and upward faces on the rig modules. The module selection covers the Breacher accumulator and rams, Cryo dewars and valves, Pyro fuel cells and exhaust stacks, and Arc capacitor and coil hardware.

The actor material applies the current rig colour through its existing uniform and retains the SHADE15 diffuse bands. The mask is present in both KTX2 and PNG fallback GLBs and their index-only shadow LODs. The maximum visible triangle count stays at 24,994. The body and each rig retain their individual high- and low-LOD triangle counts. The actor cache key was bumped once. The calm captures recorded 139–140 render programs before and after across all four rigs. The capture runner recorded zero page, console, or scenario errors across the 40 after-change paint frames. Each matched heavy burst held at 147 programs for all eight frames, for all four rigs, before and after.

The SHADE15 tool reported the following percentages of estimated figure pixels.

| Rig | Crew Checkpoint before | Crew Checkpoint after | Relay Racks before | Relay Racks after |
| --- | ---: | ---: | ---: | ---: |
| Breacher | 5.3% | 8.6% | 6.0% | 9.7% |
| Cryo | 21.2% | 24.4% | 18.0% | 21.7% |
| Pyro | 4.7% | 7.7% | 6.3% | 9.8% |
| Arc | 3.0% | 3.7% | 3.4% | 4.7% |

**The 15% target remains open.** Cryo's estimate includes teal floor pixels. Arc's larger violet region is visible in the captures, but many pixels land below the tool's hue or saturation cutoffs. The outlined grey-white body remains legible in greyscale at 480×270. All four hues are distinguishable in the calm comparisons. Pyro appears orange next to the sampled hostile red. Heavy effects and the weapon still obscure some paint and visor detail. The rounded crown, amber shoulder and pack carry the title silhouette most clearly on Breacher.

[Calm baseline](../../artifacts/nextgen/rig16-before/index.html) · [Heavy baseline](../../artifacts/nextgen/rig16-before-heavy/index.html) · [Calm and heavy after](../../artifacts/nextgen/rig16-v2/index.html) · [Native colour](../../artifacts/nextgen/rig16-review/marine-native-colour.png) · [Native greyscale](../../artifacts/nextgen/rig16-review/marine-native-grey.png) · [480-wide colour crops](../../artifacts/nextgen/rig16-review/marine-480-colour.png) · [480-wide greyscale crops](../../artifacts/nextgen/rig16-review/marine-480-grey.png)

The full-frame colour and greyscale comparisons are available at native and 480×270 sizes. The dedicated title capture timed out, so the comparison used the shipping title illustration and Final8 title capture. [Before derivatives](../../artifacts/nextgen/rig16-review/before/) · [After derivatives](../../artifacts/nextgen/rig16-review/after/) · [Shipping title art](../../artifacts/nextgen/rig16-review/title-art.png) · [Final8 title](../../artifacts/nextgen/rig16-review/title-final8.png)

## Portraits

The studio projects the posed skinned vertices to fit the figure in the square frame. The new portraits keep the helmet and boots visible and add a soft floor shadow and rig-coloured studio rim. Rig select, pause/loadout and the death card already consume the same four PNGs. The four portraits occupy roughly 92% of the image height in the studio. Breacher and Cryo are close in stance. The earlier Final8 bust still gives the pauldron more screen area because it crops the legs. Arc's forward hand and plasma receiver still cover part of the near coil.

[Before](../../artifacts/nextgen/rig16-before/rig-select.png) · [Final8 at 480×270](../../artifacts/nextgen/rig16-review/rig-select-final8-480.png) · [Breacher](../../artifacts/nextgen/rig16-screens/rig-select.png) · [Cryo](../../artifacts/nextgen/rig16-screens/rig-select-cryo.png) · [Pyro](../../artifacts/nextgen/rig16-screens/rig-select-pyro.png) · [Arc](../../artifacts/nextgen/rig16-screens/rig-select-arc.png) · [Pause/loadout](../../artifacts/nextgen/rig16-screens/pause-loadout.png) · [Death card](../../artifacts/nextgen/rig16-screens/dead.png)

Source-size portrait pairs are grouped by rig. [Before and after studio PNGs](../../artifacts/nextgen/rig16-review/portraits/)

## Brute

- The ordinary Brute simulation radius increases from 28 to 33 units (+17.9%, 0.875 m to 1.031 m), with the settled render footprint fitted to the larger body. The authored idle standing target is 2.95 m versus the marine's 2.05 m (1.44×). The Warden and Matron retain their rank scaling and radius.
- The ordinary melee origin advances 5 units along facing, matching the extra clearance. The arc retains its 92-unit range from that shifted origin and its 65-degree half-angle. The same native origin drives the warning and strike.
- The ROOM14 circle sweep at radius 33 preserved the reachable exit and legal breach entries from radius 28 across all 20 story rooms. Crew Checkpoint's two unreachable literal breach markers and Diagnostic Gallery's one already occurred at radius 28. The 96-unit opening in Diagnostic Gallery clears the 66-unit body diameter. The 56-unit Diagnostic Gallery and 50-unit Infested Workshop openings already fall at or below the 56-unit baseline diameter and have alternate reachable routes.

[Brute capture](../../artifacts/nextgen/rig16-screens/i11b-calm-brute-base-crew-checkpoint.png) · [ROOM14 reachability](../../artifacts/nextgen/rig16-review/room14-reachability.jsonl)

## Campaign verification

The TypeScript and production build passed. Each simulation cohort requests the same ten default seeds per rig.

| Difficulty and policy | Rig | Before completions out of 10 | After completions out of 10 |
| --- | --- | ---: | ---: |
| Standard competent | Breacher | 10 | 9 |
| Standard competent | Cryo | 8 | 7 |
| Standard competent | Pyro | 10 | 9 |
| Standard competent | Arc | 10 | 10 |
| Story novice | Breacher | 9 | 10 |
| Story novice | Cryo | 5 | 7 |
| Story novice | Pyro | 8 | 8 |
| Story novice | Arc | 9 | 7 |

Every rig stayed within two completions of its baseline in both cohorts. [Standard before](../../artifacts/nextgen/playtest/rig16-before-standard/summary.json) · [Standard after](../../artifacts/nextgen/playtest/rig16-final-standard/summary.json) · [Story before](../../artifacts/nextgen/playtest/rig16-before-story/summary.json) · [Story after](../../artifacts/nextgen/playtest/rig16-final-story/summary.json)

- Breacher, Standard, seed 1729, fast native. The bot cleared 10 rooms and died in Diagnostic Gallery with zero runner errors. [Campaign report](../../artifacts/nextgen/playtest/rig16-native-breacher/index.html)
- Arc, Story, seed 1729, fast native. The bot cleared all 20 rooms with zero runner errors. [Campaign report](../../artifacts/nextgen/playtest/rig16-native-arc/index.html)
- Arc, Story, seed 1729, ordinary native rendering. The bot cleared seven rooms with zero runner errors. I opened all three storyboards and spot-checked native frames with Brutes near cover. The Brute rounded the planter and crossed the scanner and freight lanes. I saw no sustained cover stall or clear wall penetration in the sampled frames. [Communal Atrium](../../artifacts/nextgen/rig16-review/storyboard-communal-atrium.png) · [Crew Checkpoint](../../artifacts/nextgen/rig16-review/storyboard-crew-checkpoint.png) · [Freight Hold](../../artifacts/nextgen/rig16-review/storyboard-freight-hold.png) · [Campaign report](../../artifacts/nextgen/playtest/rig16-storyboards/index.html)
