# LOOK24 combat readability

The old cap limits reflected light and adds the emissive rim and full-body hit card back in full. After bloom, the ink composite also mixes committed creature silhouettes toward pale blue before tone mapping, producing a bright edge independently of the body material.

## Screen samples

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
