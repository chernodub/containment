# LOOK24 combat readability

The old cap limits reflected light and adds the emissive rim and full-body hit card back in full. After bloom, the ink composite also mixes committed creature silhouettes toward pale blue before tone mapping, producing a bright edge independently of the body material.

## Revised body values and attack ownership

The revised grade preserves dark values and compresses the upper range. Lit dorsal planes get more separation from the joints, and the authored emissive mask identifies family accents in the existing geometry buffer. At 480×270, the Relay Racks Spitter gland measured 209 → 115 → 210 across the three passes. Its dark leg sample measured 18 → 18 → 22.

The pale attack-owner contour is two display pixels wide at 1080p and is composited after the body ceiling. It follows living enemies in wind-up or strike, including a committed charge. The current fixture provides no attack order, so all committed attackers receive it. If the enemy snapshot supplies a finite numeric `order`, the lowest ordered committed attacker receives it.

| Measurement | Original | First pass | Revised |
|---|---:|---:|---:|
| Relay Racks body max / marine median | 146 / 185 (79%) | 101 / 185 (55%) | 125 / 185 (67%) |
| Crew Checkpoint body max / marine median | 146 / 185 (79%) | 102 / 185 (55%) | 124 / 185 (67%) |
| Pyro overlap body max / marine median | 172 / 185 (93%) | 111 / 185 (60%) | 123 / 185 (67%) |
| Flashfire body max / marine median | 214 / 186 (115%) | 116 / 186 (62%) | 125 / 186 (67%) |
| Swarm Junction body max / marine median | 143 / 183 (78%) | 100 / 183 (55%) | 124 / 183 (68%) |
| Relay Racks dark floor → Spitter body | 26 → 109 (+83) | 26 → 96 (+70) | 26 → 112 (+86) |
| Swarm Junction dark floor → Spitter body | 29 → 107 (+79) | 29 → 93 (+64) | 31 → 106 (+75) |
| Dark Breached Loading Bay floor → Spitter body | 4 → 67 (+63) | 4 → 66 (+62) | 4 → 71 (+67) |

All values use Rec.709-weighted sRGB code values. Native frame 01 body samples in the three crowd scenes use a 7×7 shell interior to exclude the restored contour. Their top-left coordinates are (808,590), (875,590) and (875,591) in Relay Racks, Crew Checkpoint and Swarm Junction. The Pyro, Flashfire and marine samples use the first-pass coordinates documented below. Ratios and differences use unrounded values.

The last three rows use 480×270 colour images. The body value is a 3×3 median on the Spitter below its lantern. The floor value is the darkest 3×3 median in a nearby 7×7 clear deck patch. Body and floor patch centres are (60,116) and (46,120) for Relay Racks, (77,116) and (63,120) for Swarm Junction, and (167,115) and (184,118) for the Dark loading bay. The loading-bay original was recaptured from the baseline revision with all 37 script and stylesheet hashes matching the original capture manifest.

The production build passed and all 29 revised captures completed without errors. Program counts matched the first pass in every frame. Draw counts matched in 27 of 29. Swarm Junction frame 01 moved from 82 to 83 draws and Flashfire frame 01 moved from 120 to 119. The 20-second realtime High/Pyro Relay Racks benchmark retained 148 programs, created zero during the fight and kept the same median of 157 draws. [Three-column colour and greyscale comparisons at 1920×1080 and 480×270](../../artifacts/nextgen/look24-comparison2/index.html) · [Revised captures](../../artifacts/nextgen/look24-after2/index.html) · [Benchmark](../../artifacts/nextgen/look24-after2-bench/benchmark.json)

The isolated six-room Pyro campaign cleared Armory with zero errors and zero defects. Program inventory matched at entry and clear in each room. [Campaign](../../artifacts/nextgen/playtest/look24-after2-pyro/index.html)

## First-pass screen samples

Sharp sampled frame 01 of each 1920×1080 production PNG. The creature column gives the maximum Rec.709-weighted sRGB code value in a 13×12 body patch. The marine column gives the median in a 5×5 pale plate patch. Coordinates are top-left pixel coordinates in each image. These measurements include the displayed effects, ink, grade and final antialiasing.

| Scene | Creature / plate coordinates | Creature max before → after | Plate median before → after | Ratio before → after |
|---|---|---:|---:|---:|
| Relay Racks crowd | (805,596) / (609,521) | 172.2 → 101.1 | 184.6 → 184.6 | 0.93 → 0.55 |
| Crew Checkpoint crowd | (872,596) / (677,521) | 179.2 → 101.4 | 184.6 → 184.6 | 0.97 → 0.55 |
| Pyro overlap | (872,596) / (685,526) | 171.8 → 110.6 | 184.6 → 184.6 | 0.93 → 0.60 |
| Flashfire | (902,276) / (712,555) | 213.6 → 115.7 | 185.6 → 186.4 | 1.15 → 0.62 |
| Swarm Junction crowd | (872,597) / (677,521) | 172.4 → 99.4 | 182.9 → 182.9 | 0.94 → 0.54 |

The Relay Racks native crop shows the previous pale line running continuously from front claw to rear leg. A full-strength hit now darkens diffuse colour and briefly lights grazing edges. Depleted armor opens a gap using the existing plate deformation and discard. The composite compresses creature highlights after exposure, bloom and status colour while retaining dark-room values. The existing priority texture also covers the feet and reduces friendly-effect brightness there, including during the initial impact.

In Swarm Junction the lit shell and lantern remain distinguishable against the purple deck. In Breached Loading Bay the Dark fixture showed 14 visible enemies, with large bodies readable even beyond the near light. The Workshop kiting fixture showed 23–24 visible enemies around the marine and the frost field.

## What the numbers show

Flashfire frame 01 went from five separate 18s to one **18 ×5**. The Pyro overlap showed **18 ×8** beyond the group. Mixed hits use total damage and a hit count. The HUD projects the cluster edge away from the marine and checks placement against the viewport, warnings and HUD. Ordinary weapon chips have no number. Kills, reported crits, elite hits and depleted armor qualify. Enemy damage labels use 18–29 px base type, last at most 0.4 seconds from their latest receipt, and share six slots with status chips. The existing combat-text setting controls visibility. Player health and healing keep their existing presentation.

## Verification

The production build passed. The local comparison gallery contains side-by-side frames 01 and 03 in colour and greyscale at native size and at 480×270. The final capture produced 29 PNGs with zero capture errors. [Paired gallery](../../artifacts/nextgen/look24-comparison/index.html) · [Baseline](../../artifacts/nextgen/look24-before/index.html) · [Final capture](../../artifacts/nextgen/look24-after/index.html)

All 20 matched frames across the four requested scenes retained their draw counts. Their program counts held at 145 for Relay Racks, 148 for Crew Checkpoint, 153 for Pyro overlap and 160 for Flashfire. Swarm Junction held at 149 programs. Its first frame went from 83 draws to 82, and the other three matched at 83.

The 20-second High/Pyro realtime benchmark in Relay Racks recorded **zero mid-combat program creations**, 148 resident programs and 143–166 draw calls. [Benchmark measurements](../../artifacts/nextgen/look24-bench/benchmark.json)

The isolated Pyro campaign (seed 1729, fast native input) cleared six rooms with zero errors, zero defects and exit code 0. The entry and clear program counts matched in each room. A previous concurrent run also cleared six rooms and flagged a five-second loading hold in Awakening Bay. [Isolated campaign report](../../artifacts/nextgen/playtest/look24-solo/index.html)

## Two remaining weaknesses

1. In the hottest part of Flashfire, the body stays below plate value, but the orange light still obscures interior detail. At 480×270 the outer contour carries most of the facing cue.
2. In the Dark loading bay, small creatures near the edge of the light pool are easiest to find by their lanterns. Their feet have less separation from the deck than the larger armored bodies do.

## LOOK25

The creature lighting ramp replaces directional diffuse with a nearly constant band across broad, single-colour shell plates, and the two highlight ceilings compress the remaining differences. The Dark deck exposes this in both Cryo and Pyro, and frost rim emission also enters the family-lantern calculation, while corpse admission zeros the real lantern emission altogether.

The final16 Breached Loading Bay pressure snapshot contained four live enemies and nine recent corpse events. The matched fixtures use the same cargo room with and without emergency lighting. Each Cryo fixture has two frozen and three chilled survivors and three admitted corpses. Dark Pyro reproduces the broad pale plate without ice. The room visibility floor applies to the deck. The creature wipe discards geometry above its moving boundary and keeps surviving pixels opaque.

The new material rolls highlights off according to the posed triangle normal and the position across the shell. The curve preserves the initial slope at black, and the low-light fill scales with the authored material colour. Ice tints the shell at its existing luminance and catches grazing edges independently of the family lamp. On death the lamp retains 30% of its authored resting intensity. The marine and the committed attacker contour keep their existing shading.

### Matched pixel samples

Values are display-space luma on a 0–255 scale. Each arrow compares the baseline with LOOK25. The body column is the maximum of a 5 × 5 lit-plane patch, the dark plate is a 3 × 3 median, and the marine plate is a 5 × 5 median. These are local samples from the native PNGs. The original LOOK24 scenes use frame 01. Family lamps, warning contours and readable HUD elements are outside the sample patches.

| Scene | Lit body | Dark plate | Marine plate | Body / marine | Lit body / dark plate |
|---|---:|---:|---:|---:|---:|
| Dark Cryo | 123.3 → 121.9 | 48.9 → 28.2 | 197.6 | 62% → 62% | 2.5 → 4.3 |
| Dark Pyro | 129.8 → 127.3 | 54.6 → 33.1 | 183.6 | 71% → 69% | 2.4 → 3.8 |
| Ordinary Cryo | 123.3 → 122.1 | 46.7 → 28.2 | 192.6 | 64% → 63% | 2.6 → 4.3 |
| Relay Racks | 121.6 → 109.9 | 42.4 → 21.6 | 184.6 | 66% → 60% | 2.9 → 5.1 |
| Crew Checkpoint | 125.1 → 125.1 | 58.9 → 40.3 | 184.6 | 68% → 68% | 2.1 → 3.1 |
| Pyro overlap | 122.9 → 122.8 | 42.1 → 21.6 | 184.6 | 67% → 67% | 2.9 → 5.7 |
| Flashfire | 123.1 → 123.0 | 51.5 → 41.0 | 183.6 | 67% → 67% | 2.4 → 3.0 |
| Swarm Junction | 125.1 → 125.1 | 45.6 → 24.9 | 183.6 | 68% → 68% | 2.7 → 5.0 |

On the frozen elite Crawler, seven pixels sampled every four pixels from (918,367) through (942,367) across one upper plate previously read 122–123. The same pixels now span 65–89, revealing curvature even within one painted panel.

| Scene | Lit body patch (x,y) | Dark plate patch (x,y) | Marine plate patch (x,y) |
|---|---:|---:|---:|
| Dark and ordinary Cryo | 869,367 | 931,406 | 690,549 |
| Dark Pyro | 822,523 | 868,531 | 717,569 |
| Relay Racks | 821,581 | 815,600 | 610,525 |
| Crew Checkpoint | 863,572 | 890,606 | 678,525 |
| Pyro overlap | 899,579 | 875,630 | 688,530 |
| Flashfire | 902,276 | 934,319 | 713,554 |
| Swarm Junction | 862,572 | 889,606 | 678,525 |

At 480 × 270 the Spitter body versus nearby dark floor measured 85.4 versus 25.9 in Relay Racks, 87.5 versus 31.1 in Swarm Junction and 85.9 versus 4.0 in the Dark loading bay. The corresponding baseline body readings were 111.6, 105.4 and 98.3. A rack partially occludes the Relay Racks Crawler, and Flashfire still puts orange light across the target. [Native and 480 × 270 comparisons](../../artifacts/nextgen/look25-comparison/index.html)

### Runtime verification

The production build passed. Both capture runs produced 29 matched frames with zero capture errors or failures. All four requested scenes matched their original draw counts. Across the full suite, 27 of 29 frames matched draw counts and 28 of 29 matched resident program counts. The other draw counts were 105 → 104 in the dark atrium and 125 → 126 in dark heavy cargo. Dark Pyro recorded 151 → 152 resident programs, and the original build also recorded 152 on repeat. [Before](../../artifacts/nextgen/look25-before/index.html) · [After](../../artifacts/nextgen/look25-after/index.html) · [Original build repeated](../../artifacts/nextgen/look25-baseline-repeat/index.html)

The 20-second High/Cryo benchmark in the Dark loading bay recorded 135–162 draws, 155 resident programs and zero combat program creations. The unassisted Cryo campaign at seed 1729 cleared all six rooms with zero errors and zero defects. Program counts matched at entry and clear in each room (165, 158, 155, 161, 161 and 160). [Realtime benchmark](../../artifacts/nextgen/look25-bench/benchmark.json) · [Six-room campaign](../../artifacts/nextgen/playtest/look25-cryo/index.html)
