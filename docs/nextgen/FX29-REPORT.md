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
