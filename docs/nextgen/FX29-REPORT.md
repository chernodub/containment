# FX29 ground-effect review

I reviewed five final19 frames for each of the sixteen ability entries and four Overdrive entries. Whiteout and the Cryo Overdrive gallery show the same persistent opaque bank. Both use the revised Whiteout shader.

Ram, Seismic Slam, Bulwark, Railbreaker, Frost Trail, Cryo Nova, Glacier, Afterburn, Flashfire, Napalm Charge, Meltdown, Static Step, Overload, Tesla Pylon and Overclock already pass the sustained opaque-area criterion in these captures. The Breacher Overdrive concentrates brightness in a beam, Pyro leaves gaps between hot fissures and Arc leaves gaps between fractures.

The additional art-direction pass changed three powers that passed the opaque-area review. Cryo Nova and Seismic Slam use their existing shock disc for a 25% interior glaze, radial seams and a bright leading edge at the event radius. The original ice shards and outward dust remain. Overload retains its lance and gives each native hop a distinct violet-white fork and a small violet floor scorch.

## Side-by-side review

The [comparison gallery](../../artifacts/nextgen/fx29/index.html) shows final19 on the left and FX29 on the right. Each thumbnail has two 480 × 270 panels. Select it for the two 1920 × 1080 originals. The gallery includes peaks and +300 ms for all four powers, a Crew Checkpoint Cryo Nova overlapping a red sector, and a dense Armory Cryo fight. The capture fixture uses final19's room override and its 345 ms Whiteout onset.

- Whiteout. The crests reach the simulation radius in 150 ms. A 0.4–0.6 m band separates the white lip from an ice-cyan inner face. The glaze has 3.6–7% base opacity with isolated stronger radial streaks. I could find the marine, red indicators and exposed creature markings at thumbnail size. The floor seams now cross the field visibly. Crowded models can still cover one another's markings, so I could not count every individual's mark within a second.
- Cryo Nova. Yes, the cyan edge and radial ice lines establish the visible footprint at a glance. The red sector stays distinct where it crosses the ice in the overlap pair.
- Seismic Slam. Yes, the gold front and wider amber cracks show the footprint at peak. At +300 ms the bright face has passed and the deck seams and residual fractures remain.
- Overload. The peak shows the lance splitting on its way to the target cluster. The chain's overall reach is immediately legible. Individual hops that end in the same cluster are harder to separate at thumbnail size.

I saw no loss of brightness in the marine, hostile warnings, health bars or exposed creature marks in the pairs. Both the room walls and viewport can cut off parts of an effect at its real radius.

| Capture draw calls | Previous peak | FX29 peak | Previous +300 ms | FX29 +300 ms |
| --- | ---: | ---: | ---: | ---: |
| Whiteout | 124 | 124 | 121 | 121 |
| Cryo Nova | 124 | 124 | 125 | 125 |
| Seismic Slam | 126 | 126 | 120 | 120 |
| Overload | 126 | 126 | 125 | 124 |

## Crew Checkpoint benchmark

The production build passed. The requested ten-second Cryo benchmark ran three times per tier. Both builds recorded zero mid-combat shader compilations in all six runs. The checkout resolved to f038749c, whose only change after ec79403e was the roadmap.

| Peak draws | Baseline repeats | FX29 repeats | Highest before → after |
| --- | --- | --- | --- |
| High, real time | 157, 145, 147 | 143, 142, 145 | 157 → 145 |
| Low, real time | 130, 130, 137 | 133, 138, 130 | 137 → 138 |
| Low, matched 600 ticks at fixed resolution | 133 | 133 | 133 → 133 |

The real-time Low maximum exceeded baseline by one draw. The follow-up used the same native benchmark driver with fixed timing and resolution. It recorded 133 peak draws and zero combat compiles on both builds. The matched power captures also stayed within their previous draw counts.

[Real-time baseline](../../artifacts/nextgen/fx29-before/benchmark.json) · [Real-time FX29](../../artifacts/nextgen/fx29/benchmark.json) · [Fixed baseline](../../artifacts/nextgen/fx29-low-fixed-before/benchmark.json) · [Fixed FX29](../../artifacts/nextgen/fx29-low-fixed-now/benchmark.json)

The [seed-1729 native Cryo campaign](../../artifacts/nextgen/playtest/fx29-cryo/index.html) cleared fourteen rooms and entered Infested Workshop. It reached the runner's one-hour wall limit with zero recorded errors or defects. Full campaign completion remains unverified.

## FX30

The [FX30 gallery](../../artifacts/nextgen/fx30/index.html) pairs the same casts on 73c92179 and the revised build. Every pair opens at native size. The ten dense-fight panels cover peak and +300 ms for five powers. Additional pairs show the Pyro overlap, the open Manual Control Chamber pool, the pool 100 ms after ignition, the cooled soot, and small actors close to Meltdown. The open pool and cooled frame use the same cast.

| Power | Struck bodies and bright marks at 480 × 270 | Warnings and visible geometry | First 150 ms after impact |
| --- | --- | --- | --- |
| Flashfire | I can separate the two near-side bursts and see the exposed markings between tongues. I cannot count all 12 native targets by eye in the dense pack. | The overlap shows the red sector beside the marine. The hot core ends at about one fifth of the reach. Gaps, curved tips and torn edges break up the long sides. | The direction, spread and reach read from the outer tongues at 45 ms. |
| Napalm | I can pick out the exposed creatures and their marks. The two large bodies and the foreground cluster overlap several of the 10 targets on the sampled tick. | The red sector at peak and red lane at +300 ms survive. Two curved runs of fuel carry clusters of low and tall leaning flames. Breaks and recesses interrupt the pool lip. The soot is subtle on dark steel after burnout. | The 100 ms frame shows the rounded damage footprint before the outer clusters finish lighting. |
| Meltdown | The dense activation has zero impact target IDs. Its next sampled tick has one. The separate close-contact cast shows how the compact central glare reads beside small bodies. | Red projectile cues and the lower red warning remain visible. The hard circle marks detonation. By +300 ms the fissures run through a broken crust edge and taper independently. | The hard front shows the actual radius at 45 ms. Cosmetic fissure tips can extend beyond it. |
| Cryo Nova | I can see individual icy outlines, exposed marks and bars. The 6 native targets overlap enough that I cannot match every mark to a target at a glance. | The red warnings stay readable. The cyan front is deliberately circular. Deck seams run through the glaze to the marine's boots without a circular clearance pocket. | The front and thin radial ice lines show the area at 45 ms. |
| Seismic Slam | I can see flung bodies and their exposed marks. I cannot visually separate all 11 native targets in the upper cluster. | The red projectile remains visible. The gold radius and amber cracks remain crisp while the lettering shows through the interior. The circular actor pockets are gone. | The gold front shows the visible footprint at 150 ms. The viewport crops part of its left edge. |

Nova and Slam use 18–22.5% source alpha for the glaze at peak and a darker pigment for the deck. The bright cracks and leading front are separate terms. These floor effects rely on actor depth and warning draw order. The native hit shapes and timings stay the same.

| Matched draw calls | Previous | FX30 |
| --- | ---: | ---: |
| Flashfire, peak / +300 ms | 124 / 123 | 124 / 123 |
| Napalm, peak / +300 ms | 124 / 123 | 124 / 123 |
| Meltdown, peak / +300 ms | 128 / 130 | 127 / 129 |
| Cryo Nova, peak / +300 ms | 124 / 125 | 124 / 125 |
| Seismic Slam, peak / +300 ms | 126 / 120 | 126 / 120 |
| High Pyro benchmark, peak | 159 | 159 |
| Low Pyro benchmark, peak | 145 | 145 |
| Mid-combat shader compilations, High / Low | 0 / 0 | 0 / 0 |

The production build passed. Both benchmarks rendered 600 matched ticks at fixed resolution in Crew Checkpoint. [Baseline benchmark](../../artifacts/nextgen/fx30-base-bench/benchmark.json) · [FX30 benchmark](../../artifacts/nextgen/fx30-final-bench/benchmark.json)

The [native Pyro campaign](../../artifacts/nextgen/playtest/fx30-final-pyro/index.html) cleared all eight requested rooms on seed 1729 with zero errors or recorded defects. In the close-contact Meltdown pair, both small bodies are individually visible at the right of the marine. The red sector remains legible across the centre.
