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

## FX31

The [comparison gallery](../../artifacts/nextgen/fx31/index.html) puts final20 on the left and FX31 on the right. Each 480 × 270 panel opens the 1920 × 1080 originals side by side. The six casts use the same Crew Checkpoint setup, native hit logic, peak offset and 300 ms advance as final20. Each overlap starts with a native crawler windup in a twenty-enemy encounter. The sampled frames contain eighteen to twenty visible enemies.

| Power | Material on the deck | Contact and readability at 480 × 270 |
| --- | --- | --- |
| Whiteout | Yes. Wind moves snow across cracked plates of frost. The snow thickens near obstructions and its lip breaks into clumps. | Pale deposits follow limbs inside the black outlines. The red projectile, marine, floor lanes and exposed family marks remain distinct. The crowd on the top edge partly leaves the view. |
| Cryo Nova | Yes. A jagged field of frost forms under the rising shard clusters. Large deck panels return as the crust thins. | Chilled limbs and bone marks stand out against the settled ice. The red warning at the lower edge is legible. The six native contacts include overlapping bodies. |
| Seismic Slam | Yes. Buckled plates lift in the dust, then leave a darker field of faulted steel at +300 ms. The letters beneath the plates remain visible. | The airborne victims pick up amber on their sides. The red projectile crosses the field clearly. The uppermost of the eleven struck bodies travels partly off screen. |
| Meltdown | Yes. Hot channels run along islands of cooling skin and out through an uneven ember edge. | The marine and red warning are clear. The native impact has zero targets, so there is no struck body to highlight at peak. One target takes damage on the next sampled tick. |
| Overload | Yes. A narrow fork of violet and char crosses the deck below each airborne discharge. It fades over about one second. | The early lance is the brightest element. Its branches subside before +300 ms, leaving the endpoints and a darker route visible. The lower red warning remains clear. |
| Napalm | Yes. FX30’s two rivulets and soot rim carry the fire. Burning actors receive a separate flicker at an animated joint. | The red sector and later red lane remain readable over the fuel. Bodies in the foreground crowd partially overlap. |

The floor shaders peak near 0.42 source alpha across their main mass. Noise, individual facets and seams vary their local value. The same collision rectangles shape pile-up near obstacles, while opaque geometry supplies the occlusion. Earlier proof showed two rectangular voids when the shader discarded fragments against collision bounds. The reviewed version removes that discard. The actor material leaves the family organ paint and a loaded striking limb clear. The native receipt holds its contact light for 620 ms, fading over the final 220 ms. Status light can persist after that.

I could locate the marine and the visible red warnings in each comparison. I could not identify every creature’s mark within one second in the dense pack. Bodies overlap and some leave the viewport during knockback. None of the six powers showed a flat floor tint, a continuous bright perimeter, or a clearance hole around an actor in the matched panels. Native target indicators and hostile warning arcs remain visible.

| Dense capture, peak / +300 ms | Final20 draws | FX31 draws |
| --- | ---: | ---: |
| Whiteout | 124 / 121 | 124 / 121 |
| Cryo Nova | 124 / 125 | 124 / 125 |
| Seismic Slam | 126 / 120 | 125 / 120 |
| Meltdown | 127 / 129 | 127 / 128 |
| Overload | 126 / 124 | 126 / 124 |
| Napalm | 124 / 123 | 124 / 123 |

In the +300 ms panels, the strongest cold and impact accents I could trace were on the frozen or airborne bodies. Overload’s live lance wins the peak frame. The faint fork is visible between the marine and the victims at +300 ms. Meltdown’s surviving crawler is warm along the edge beside its pink mark, although the moving fissures still draw my eye first in that frame. Napalm puts lit coals on the struck silhouettes, with some exposed fuel tips still bright between targets. I would not describe either Pyro frame as having every brightest pixel on a victim.

The [native Passenger Vault comparison](../../artifacts/nextgen/fx31/native-pyro-final-mid-1920.png) pairs the midpoint of two separate seed-1729 fights. The FX31 snapshot records a visible burning brute. Its outer leg stays outlined against the pool, with a glowing patch following the bend at the joint. The free-standing tongues are part of the fuel pool. The native marine positions differ between the two playthroughs. [Joint detail](../../artifacts/nextgen/fx31/native-burning-detail.png) · [Native snapshot](../../artifacts/nextgen/playtest/fx31-native-result/r2-passenger-vault-mid.json)

The production build passed. The seed-1729 Cryo campaign cleared all eight requested rooms with zero browser, console or gameplay errors. The runner also recorded three room-load diagnostics in Awakening Bay, Passenger Vault and Residential Gallery and returned a nonzero status for those diagnostics. [Campaign report](../../artifacts/nextgen/playtest/fx31-cryo-final/report.json)

| Hostile-warning overlap | Final20 draws | FX31 draws |
| --- | ---: | ---: |
| Cryo | 107 | 106 |
| Breacher | 101 | 101 |
| Arc | 103 | 102 |
| Pyro | 108 | 108 |

The Crew Checkpoint benchmark used 600 fixed ticks per rig and tier at fixed resolution. Every run recorded zero mid-combat shader compilations. The final Cryo and Pyro measurements repeat those rigs after the visual review adjustments. [Baseline](../../artifacts/nextgen/fx31-base-bench/benchmark.json) · [Four-rig benchmark](../../artifacts/nextgen/fx31-bench/benchmark.json) · [Cryo repeat](../../artifacts/nextgen/fx31-cryo-verified-bench/benchmark.json) · [Final Pyro repeat](../../artifacts/nextgen/fx31-result-bench/benchmark.json)

| Rig | High peak draws, before → FX31 | Low peak draws, before → FX31 | Combat compiles, High / Low |
| --- | ---: | ---: | ---: |
| Cryo | 146 → 146 | 133 → 133 | 0 / 0 |
| Pyro | 159 → 159 | 145 → 145 | 0 / 0 |
| Breacher | 143 → 142 | 134 → 133 | 0 / 0 |
| Arc | 155 → 155 | 144 → 144 | 0 / 0 |
