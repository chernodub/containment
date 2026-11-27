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

## FX32

Whiteout leaves strips of exposed steel between wind-aligned frost banks. Nearby walls, obstacles and heavy bodies shelter the deposits. The marine and small actors thin the snow underfoot through the existing priority mask. Cryo Nova concentrates its crystals at the advancing edge and keeps the center translucent. Seismic Slam separates a few lifted plates with dark gaps, shadows and narrow amber fractures. Meltdown has a dark cooling skin with short openings onto the hotter pool. The openings recede around the marine’s boots.

Flashfire keeps its initial cast direction, then dims its tongues behind the struck silhouettes. Napalm’s darker fuel and soot leave the yellow-white contact rim and joint ember readable on a burning body. Brute and Warden plates use their world-facing normals for pale upper ice and blue side planes. The native family marks and the attacking limb retain their own shading. These changes reuse the existing lights, materials and instance batches.

The gallery pairs final21 on the left with FX32 on the right at native resolution. Its thumbnails show FX32 alone at 480×270. The dense frames use the same Crew Checkpoint casts and sampling offsets as final21. The second frame is 300 ms after the first. [Gallery](../../artifacts/nextgen/fx32/index.html) · [Armor status detail](../../artifacts/nextgen/fx32/status-detail.png)

I counted distinct enemy silhouettes or family marks in a quick look at each thumbnail. The denominator comes from living enemy centers inside the native radius or cone in that frame, including actors pushed off screen or behind another actor. A health bar alone did not count. These are visual counts, not the number of enemies damaged at cast time. The peak Meltdown fixture has nearby enemies but none inside its 130-unit aura at that instant. [Fixture counts and projected centers](../../artifacts/nextgen/fx32/enemy-locations.txt)

| Dense power | Found at peak | Found at +300 ms | Deck at boots | Red warnings | Brightest effect accent after flash |
| --- | ---: | ---: | --- | --- | --- |
| Whiteout | 18/26 | 17/26 | Visible between drifts | Clear | Mostly on frosted heavy plates. Several small joints still blend into the pack. |
| Cryo Nova | 5/6 | 8/11 | Visible through center | Clear | Mixed. The crystal band still competes with small targets. |
| Seismic Slam | 2/3 | 5/7 | Visible between plates | Clear | On staggered bodies. Two projected centers have crossed the bottom edge at +300 ms. |
| Meltdown | 0/0 | 3/3 | Boot outline clear; some deck detail lost under hot skin | Clear | The crawler’s mark and lit edge stand out over the cooling skin. The marine’s vents remain bright too. |
| Flashfire | 7/8 | 8/9 | Visible | Clear | The victim accents outlast the fan. A few orange tips remain comparably bright. |
| Napalm | 7/10 | 6/8 | Visible beside fuel | Clear | Mixed. The struck Brute has a bright flank; exposed fuel tips still compete. |

All four overlap thumbnails preserve the red hostile arc across the marine. The native Passenger Vault midpoint records one visible burning Brute. On the native comparison its lit flank separates from the darker patch on the deck. The frozen and chilled heavies have blue-gray plate faces and inked edges. Burning shows a warm rim and shocked shows a violet edge. [Native Pyro comparison](../../artifacts/nextgen/fx32/native-pyro-native.png) · [Native fight snapshot](../../artifacts/nextgen/playtest/fx32-delivery-pyro/r2-passenger-vault-mid.json) · [Warden overview](../../artifacts/nextgen/fx32/warden-overview.png)

At native size the chilled Brute has the clearest separation between blue plate planes. The fully frozen Brute is paler and more uniform at 480×270; its outer ink remains easier to pick out than its individual joints. The burning Brute and Warden fixtures also record shock, so those two panels show combined status. [Brute and Warden crops](../../artifacts/nextgen/fx32/status-detail.png)

Every sampled dense cast matched final21’s draw count on both frames.

| Power | Peak draws, final21 / FX32 | +300 ms draws, final21 / FX32 |
| --- | ---: | ---: |
| Whiteout | 125 / 125 | 122 / 122 |
| Cryo Nova | 125 / 125 | 126 / 126 |
| Seismic Slam | 125 / 125 | 120 / 120 |
| Meltdown | 127 / 127 | 128 / 128 |
| Flashfire | 124 / 124 | 123 / 123 |
| Napalm | 124 / 124 | 123 / 123 |

The production build passed. Both benchmark builds used Crew Checkpoint, fixed resolution and 600 fixed ticks per rig and tier. [Baseline benchmark](../../artifacts/nextgen/fx32-base/benchmark.json) · [Delivery benchmark](../../artifacts/nextgen/fx32-delivery-bench/benchmark.json)

| Rig and tier | Baseline peak draws | FX32 peak draws | Combat shader compiles, baseline / FX32 |
| --- | ---: | ---: | ---: |
| Pyro High | 159 | 159 | 0 / 0 |
| Pyro Low | 145 | 145 | 0 / 0 |
| Cryo High | 147 | 147 | 0 / 0 |
| Cryo Low | 134 | 134 | 0 / 0 |

The native seed-1729 Pyro campaign cleared all eight rooms with zero errors. The runner exited 1 for room-loading diagnostics in Awakening Bay, Passenger Vault and Residential Gallery. [Campaign report](../../artifacts/nextgen/playtest/fx32-delivery-pyro/report.json) · [Build log](../../artifacts/nextgen/fx32/delivery-build.log)

## FX33

The Afterburn strip previously placed equally spaced upright flame cards along its centerline. It now places three to five low, uneven licks across the trail and leans each toward the wake. Napalm clusters different-sized licks along the fuel flow, over dark sheen and interrupted coals. The retained fuel surface now advances its own age. Its orange emission falls toward red-brown over the first 300 ms. Flashfire retains its accepted fork and muzzle flash. The Crawler’s amber hooks and dorsal stripe keep their authored shape through burn, with yellow-white contact light on the adjoining skin.

Whiteout uses the existing actor mask to thin snow behind silhouettes. Its deck shards are shorter and flatter, the struck-side joint receives a narrow highlight, and family emission survives the last frost pass. Cryo Nova breaks the crystal lip into separate patches and feathers the glaze between them. Meltdown drives a bright front to the native radius in 150 ms. Its pooled ground material handles both the base aura and the Core augment’s 260-unit detonation. Secondary kill bursts retain their local body particles. No light or screen pass was added.

I compared the dense frames at 480×270 and counted recognizable bodies or family marks, excluding health bars alone. Denominators count living centers inside the footprint at each sample. They include occluded and offscreen actors. The gallery uses final22’s native originals for the five matching dense casts, overlaps and native campaign. The dense Afterburn and combined status fixtures were recaptured on the pre-FX33 worktree build because final22 lacks those exact frames. The separate rank lineup uses final22’s calm lineup as its left panel. [Gallery](../../artifacts/nextgen/fx33/index.html) · [Fixture locations](../../artifacts/nextgen/fx33/enemy-locations.txt)

| Power | Peak, previous → FX33 | +300 ms, previous → FX33 | Post-flash accents and remaining construction |
| --- | --- | --- | --- |
| Afterburn | 1/1 → 1/1 | 2/2 → 2/2 | Narrow ember tracks leave the Crawler visible near the wake. No upright row. |
| Napalm | 7/10 → 8/10 | 6/8 → 7/8 | The burning flank and family marks lead over the settled fuel. Short hot ends persist between bodies; the resting edge is broken. |
| Flashfire | 7/8 → 7/8 | 8/9 → 8/9 | The separated fork still leads at peak. Flank accents lead in the tail, with a few bright embers on the deck. |
| Meltdown | 0/0 → 0/0 | 3/3 → 3/3 | No enemy center is inside the base aura at peak. The edge of the cooling pool is still visible at +300 ms. The Core augment’s expanding front is the brightest feature during detonation. |
| Whiteout | 18/26 → 20/26 | 17/26 → 19/26 | Family marks and dark silhouettes read through the margins. Heavy plates remain the brightest ice, and crowded small bodies still overlap. |
| Cryo Nova | 5/6 → 5/6 | 8/11 → 9/11 | Bare gaps interrupt the crystal edge, but individual bright clusters still compete with the bodies. |

The normal and elite Brute show blue sides and pale band tops at full freeze. Chilled bands stay darker, burn leaves a warm edge, and shock gives the bands a violet edge. The Warden resisted the lineup’s native freeze application and retained its rust and bone finish. The mixed-crowd status study includes small creatures with the same effects. [Heavy lineup receipts](../../artifacts/nextgen/fx33/trio-frozen.json)

The native Communal Atrium frame records a visible burning Crawler beside Afterburn and Flashfire residue. Its amber hook and stripe remain recognizable against the brown deck. The lit hide still approaches the mark’s value where they touch. In the Core detonation detail, the traveling front replaces the old cluster of bright fireballs; broken red crust remains at +300 ms. Both overlap cases retain their red hostile arc. [Native details](../../artifacts/nextgen/fx33/native-details.png) · [Crawler snapshot](../../artifacts/nextgen/playtest/fx33-release-pyro/r4-communal-atrium-pressure.json)

The production build passed. The seed-1729 Pyro campaign cleared all eight rooms with zero errors and zero runner defects. The Crew Checkpoint benchmark used fixed resolution and 600 fixed ticks per rig and tier. [Campaign](../../artifacts/nextgen/playtest/fx33-release-pyro/report.json) · [Baseline](../../artifacts/nextgen/fx33-base/benchmark.json) · [Release](../../artifacts/nextgen/fx33-release/benchmark.json)

| Rig and tier | Before peak draws | FX33 peak draws | Combat shader compiles, before / FX33 |
| --- | ---: | ---: | ---: |
| Pyro High | 160 | 155 | 0 / 0 |
| Pyro Low | 146 | 141 | 0 / 0 |
| Cryo High | 147 | 147 | 0 / 0 |
| Cryo Low | 134 | 134 | 0 / 0 |

## FX34

Eight cast effects share a 180 ms colored pulse. The existing surface materials project it onto the deck in world space and onto low prop edges. Actor materials use their stage-light gain and grazing angle for the rim. Color falls off with distance and height. The pulse is shaded into the opaque surfaces under hostile warnings. It adds no light, draw call or screen pass.

Cryo Nova trades its rolling mist cards for upright blue shards with white center blades at separated points along the front. Whiteout retains bare-deck channels, with dark joints between bank facets and crystal clusters at the rim. Both effects place a few additional blades at the nearest exposed faces of collision obstacles. Base Meltdown now derives its shader age from elapsed native aura time. Its translucent hot interior and bright front expand to the 130-unit radius in 150 ms. Core uses the same drawing at its native 260-unit detonation. Both cool into dark crust with a few ember seams.

Seismic Slam retains its dark raised slabs and amber fissures. Overload keeps its branching lance and deck track, and Railbreaker retains its linear wake. Each receives its rig-colored cast pulse. Flashfire retains its opening fork, with a faster falloff on the caster’s existing light. Fire emission fades behind actor silhouettes, and a single brighter ember follows a posed flank joint during the existing 650 ms Pyro hit receipt.

The gallery compares final23 with FX34 at native size and shows current-only thumbnails at 480×270. The cast sample is 10 ms after resolution. The peak and the next frame use final23’s timing, with the latter 300 ms after peak. The separate exact-300 sheet samples 300 ms after resolution. All gallery pairs use the final build on the right. For cast instants and the Core detonation, the comparison uses fresh captures of the pre-FX34 build on the same fixture because final23 lacks those samples. [Gallery](../../artifacts/nextgen/fx34/index.html) · [Exact-300 sheet](../../artifacts/nextgen/fx34/at300.png) · [Sheet order](../../artifacts/nextgen/fx34/at300-order.txt) · [Enemy centers](../../artifacts/nextgen/fx34/counts.txt)

The denominator is the live enemy roster inside the power at that sample, including enemies clipped by the viewport. The numerator is a one-second visual estimate at 480×270. An enemy needs a distinguishable body or family mark. A health bar alone does not count. For Overload the roster follows the native chain, and for Railbreaker it follows the shot corridor. Each cell gives previous → FX34.

| Power | Cast | Peak | Peak + 300 ms | Cast pulse and brightest accents at 300 ms after resolution |
| --- | --- | --- | --- | --- |
| Whiteout | 19/24 → 19/24 | 20/26 → 20/26 | 19/26 → 19/26 | Cyan reaches the deck and nearby silhouettes. At 300 ms the pale banks on the left still compete with frozen limbs. |
| Cryo Nova | 5/6 → 5/6 | 5/6 → 5/6 | 9/11 → 9/11 | Cyan deck flash under the rising shards. The white crystal tips and upper-body ice share the brightest cold accents. |
| Meltdown | 0/0 → 0/0 | 0/0 → 0/0 | 3/3 → 3/3 | Orange light spreads from the caster. The front reaches 130 units before cooling. At 300 ms the floor effect has faded below the marine and nearby family marks. |
| Meltdown Core | 5/5 → 5/5 | 5/5 → 5/5 | 5/5 → 5/5 | The orange pulse and broad travelling edge register against the Brutes. At 300 ms the pale outline on the recoiling heavy leads the fire residue. |
| Seismic Slam | 7/8 → 7/8 | 2/3 → 2/3 | 5/7 → 5/7 | Amber reflects off the deck at cast. The green, blue and amber creature marks stand above the dark plates and thin cracks at 300 ms. |
| Flashfire | 11/13 → 11/13 | 7/8 → 7/8 | 8/9 → 8/9 | Red-orange light reaches the deck and lower limbs. At 300 ms the muzzle has cooled. A few ember points and creature marks stand out, with the room practical brighter than either. |
| Overload | 4/5 → 4/5 | 4/5 → 4/5 | 4/5 → 4/5 | Violet light reaches the nearby deck and low edges at cast. At 300 ms the pale arc on the heavy and the creature marks lead the narrow purple track. |
| Railbreaker | 0/0 → 0/0 | 0/0 → 0/0 | 0/0 → 0/0 | An amber flash reflects beneath the white rail. At 300 ms its brightest remaining effect pixels are on the winding deck wake. The impact receipt records three hits. There are no surviving enemy centers in the 44-unit-wide shot corridor at the samples. |

The base Meltdown fixture starts with its nearest living enemy centers outside the 130-unit aura. Its separate 150 ms sample shows the full edge and the interruption at the nearby obstacle. The Core fixture puts five surviving Brutes inside its larger detonation. The native Pyro panel uses the Passenger Vault pressure frame from a two-room campaign. [Meltdown at full reach](../../artifacts/nextgen/fx34/meltdown-radius-480.png) · [Native Pyro](../../artifacts/nextgen/fx34/native-pyro-native.png)

At 480×270 the hostile red arc is identifiable beside the marine in all four overlap cases. Pyro gives it the least color separation. Its red curve remains distinct from the brighter orange fork. Cryo and Arc preserve the curve through the pulse, and Breacher leaves it visible inside the amber perimeter. In the dense power panels, visible warnings retain their red outlines, including the fan under Meltdown Core. The pulse reaches the deck in every cast. The low-edge tint is easiest to see on the nearest large bodies. Distant prop trim is too small to judge reliably at 480×270. [Pyro](../../artifacts/nextgen/fx34/overlap-pyro-native.png) · [Cryo](../../artifacts/nextgen/fx34/overlap-cryo-native.png) · [Arc](../../artifacts/nextgen/fx34/overlap-arc-native.png) · [Breacher](../../artifacts/nextgen/fx34/overlap-breacher-native.png)

The production build passed. The native Cryo campaign with seed 1729 cleared all eight rooms and recorded zero errors. The runner exited 1 after recording five room-loading diagnostics on the shared machine. [Build](../../artifacts/nextgen/fx34/build.log) · [Campaign receipt](../../artifacts/nextgen/playtest/fx34-final-cryo/report.json)

Crew Checkpoint peak draw calls over 600 fixed ticks. Each cell gives pre-FX34 → FX34. Combat compiles are counts of new shader programs during the measured combat interval. [Baseline](../../artifacts/nextgen/fx34-base/benchmark.json) · [FX34](../../artifacts/nextgen/fx34-final/benchmark.json)

| Rig | High peak draws | Low peak draws | High combat compiles | Low combat compiles |
| --- | ---: | ---: | ---: | ---: |
| Pyro | 155 → 155 | 141 → 141 | 0 → 0 | 0 → 0 |
| Cryo | 147 → 147 | 134 → 134 | 0 → 0 | 0 → 0 |
| Arc | 156 → 156 | 145 → 145 | 0 → 0 | 0 → 0 |
| Breacher | 143 → 143 | 134 → 134 | 0 → 0 | 0 → 0 |

## FX35

Meltdown's leading edge expands to the simulation radius in 150 ms. The heat field cools inward from its perimeter. Its former four floor-flame pockets have been removed. The existing aura light is weaker, and tick sparks originate at torso height and move outwards from the caster on native target receipts. Simulation damage and displacement are unchanged. A dashed green debug line in the 150 ms study projects the live zone's center and radius through the gameplay camera.

Whiteout and Nova thin their ground material immediately behind actor silhouettes via the existing priority texture. Nova has a cyan cast core and a narrow crystal lip. Flashfire uses its existing scorch fan to connect the white-hot muzzle to the far edge while preserving its separate contact bursts. None of these drawings adds a light or a screen pass.

The Relay Racks pressure receipt places Seismic Slam 717 ms into its cooldown, with no live ability zones and an inactive Overdrive. The overlapping cell edges in Slam's 2.2-second Shock draw produced the amber network. The owner is the Shock spawn in `src/render/abilities/breacher/index.ts:95` and the emissive plate seams in `src/render/abilities/FlagshipFx.ts:370`. The seam now lights only the narrowest gaps in broken sections, reaches zero emission at one second, and fades as dark residue before the draw retires.

When three living enemies approach within four metres the marine's existing surface material fades in a cool grazing-angle accent. The power mask gives more clearance to the visor and pauldron. The grayscale Whiteout pair still shows discrete suit planes rather than a continuous selection outline.

[Study gallery and native comparisons](../../artifacts/nextgen/fx35/index.html) · [Debug radius at 150 ms](../../artifacts/nextgen/fx35/fx35-meltdown-crew-checkpoint-dense-radius-crew-checkpoint-02-1920.png) · [Ability captures](../../artifacts/nextgen/fx35/abilities.html)

Transparent coverage was measured separately from the ordinary benchmark. A capture-only WebGL diagnostic preserved native transparent draws, discards, depth tests and opaque depth. It cleared the color attachment to white before the first transparent submission and multiplied destination red by 0.875 for each passing fragment. Readback used the GPU's implementation format for the packed HDR target. The reported value is the largest frame-average layer count in the 45, 150, 300 and 1000 ms Slam samples. Maximum per-pixel layers also remained level at 30 on High and 23 on Low. An initial diagnostic read used an incompatible pixel format and was discarded. [Previous layers](../../artifacts/nextgen/fx35-fill-base/manifest.json) · [Current layers](../../artifacts/nextgen/fx35-fill-now/manifest.json)

| Crew Checkpoint | Peak draws before → FX35 | Combat shader compiles before → FX35 | Peak mean transparent layers before → FX35 |
| --- | ---: | ---: | ---: |
| High | 146 → 146 | 0 → 0 | 2.335 → 2.277 |
| Low | 136 → 136 | 0 → 0 | 2.258 → 2.165 |

Draws and compiles use matched 600-tick Breacher runs at fixed resolution. The realtime attempt produced no usable frame sample under host load and was replaced by the fixed-step runs. [Before](../../artifacts/nextgen/fx35-fixed-base/benchmark.json) · [FX35](../../artifacts/nextgen/fx35-fixed-now/benchmark.json)

The body response uses the existing Meltdown target reaction in `src/render/motion/OverdriveReactions.ts` together with the joint ember. At the edge the outward-moving spark is small enough that I can follow it more easily at native size. Railbreaker's body displacement is still easier to see at 480×270. Nova's left reach is clearer, though the bright lip can briefly read as a drawn arc. On Whiteout the isolated small bodies have dark space immediately behind them. Two bodies crossing in front of the same bank are still difficult to separate at thumbnail size.

An isolated readback retained the actual Shock shader's emitted-light term, depth test and discards. At 30, 150, 300, 600 and 1000 ms, the highest count was 25,369 lit pixels on High and 27,061 on Low in a 1920×1080 frame. That is 1.22% and 1.31% of the viewport. Both recorded zero lit Shock pixels at one second. The visible deck occupies well over a tenth of these frames, putting the observed crack coverage below 15% of the visible deck. The matte also includes the brief central flash. [Emission measurements](../../artifacts/nextgen/fx35-crack-matte/manifest.json)

The native crowd comparisons use each room's own spawns. The marine walked toward them with firing off. The captured counts within four metres were four in Crew Checkpoint and three each in Freight Hold, Relay Racks and Overload Floor on both builds. The rim stays on the visible armor and visor. A Brute standing in front of the suit can still conceal part of it. Each color and grayscale pair is in the gallery; the separate room-pressure frames come from the Pyro campaign.

The production build passed. The catalog has sixteen equipped abilities across four rigs, including four Overdrives. Each produced cast, impact and aftermath receipts on both High and Low. All 96 selected receipts have an empty errors array. Tesla Pylon was recaptured at native resolution after its compact viewport put the HUD over the marine. The final Flashfire study extends the peak tongues to the far arc and whitens the muzzle. Meltdown's underlying mesh now ends at the native radius. [All 96 frames](../../artifacts/nextgen/fx35/abilities.html) · [Receipt index](../../artifacts/nextgen/fx35/ability-receipts.json) · [Production build](../../artifacts/nextgen/fx35/release-build.log)

The one- and five-second native Slam pairs use the same seed, original room spawns and simulation offsets in Relay Racks, Crew Checkpoint, Safety Interlock and Overload Floor. At one second the hazard stripes and broken lamp housing on Overload Floor are visible through the cooled impact. At five seconds the red attack fan is visible beside the marine. The dense Safety Interlock staging put its recorder outside the HUD-safe view, so the reported comparison uses the native room setup. Ship-kit preparation timeouts in Relay Racks, Safety Interlock and Freight Hold required fresh invocations. The Overload Floor capture was also restarted after it stopped advancing. [One second](../../artifacts/nextgen/fx35/fx35-native-overload-floor-overload-floor-01-480.png) · [Five seconds](../../artifacts/nextgen/fx35/fx35-native-overload-floor-overload-floor-02-480.png)

The seed-1729 Pyro campaign cleared all ten rooms with zero errors across the final run and its earned-checkpoint continuation. The first screenshot attempt timed out and was retried. On the final build the one-hour runner limit expired after eight clears. The continuation used the recorded Breached Loading Bay reward boundary and cleared Relay Racks and Transmission Chamber. Its outcome is `room-limit` with five room-loading diagnostics, exit status 1. [First eight rooms](../../artifacts/nextgen/playtest/fx35/report.json) · [Ten-room result](../../artifacts/nextgen/playtest/fx35-continuation/report.json)

At the start, `df -h /Users/chernodub` reported 926 GiB total, 859 GiB used and 41 GiB available (96%). At completion it reported 926 GiB total, 805 GiB used and 90 GiB available (90%). This worktree's nextgen artifacts measured 17 GB before cleanup and 1.8 GB after verification.

## FX36

Meltdown selects the final target ID from its native damage ticks for the heat accent and outward recoil. A repeat hit on the same target allows a 250 ms rest after its accent. The flame follows the visible body for up to 320 ms while the single disc dims. Overload tracks the last link confirmed by its impact receipt. Its fork rises over the recipient, the deck track fades sooner, and the chain no longer stamps a shock circle at every hop. Overclock weapon contacts use the same visual language on the struck actor, including a just-retired corpse.

Whiteout grows three unequal rime shards up each of a bounded number of living enemies inside the advancing front. The outer wall has fewer spikes and the deck deposit is dimmer. The plumes brighten briefly on the storm's freeze pulse. Napalm's first native burn receipt lights a white-core wick on each newly ignited body for 50 ms. Repeated pool ticks leave the ordinary burn wick. Seismic Slam uses a single moving rim, clips fractured plates to the ability radius and retires its shock, thrown debris and dust within 480 ms.

The capture selectors take the form `fx36-{power}-{room}-{tier}-{density}`. Each uses one native cast, except the Overclock chain study, which resolves Overload while Overclock is active. The first frame samples the power's impact or status tick and the second advances 250 ms. The staged encounters and fixed-step draw counts describe these frames. The historical final25 residual was sampled at +300 ms.

High draw calls in the 12-enemy encounters. Each cell gives peak / +250 ms. The original base is `ca7c4738`, the integrated baseline is `a65d7fb5` (BROOD43, ROOM35 and TITLE35), and FX36 is `463c6c67`. Each of these 84 frames had four visible pooled lights.

| Power | Safety original | Safety integrated baseline | Safety FX36 | Transmission original | Transmission integrated baseline | Transmission FX36 |
|---|---:|---:|---:|---:|---:|---:|
| meltdown | 158 / 160 | 159 / 160 | 157 / 158 | 115 / 118 | 116 / 118 | 114 / 116 |
| overload | 166 / 156 | 166 / 156 | 160 / 153 | 123 / 111 | 123 / 111 | 117 / 108 |
| overclock | 168 / 167 | 169 / 167 | 165 / 161 | 120 / 122 | 120 / 122 | 116 / 116 |
| whiteout | 155 / 155 | 155 / 155 | 155 / 155 | 110 / 110 | 111 / 110 | 111 / 110 |
| napalm-charge | 154 / 158 | 154 / 158 | 154 / 158 | 111 / 114 | 111 / 114 | 111 / 114 |
| seismic-slam | 165 / 160 | 165 / 160 | 164 / 159 | 119 / 117 | 119 / 117 | 118 / 116 |
| railbreaker | 158 / 154 | 158 / 154 | 158 / 154 | 117 / 114 | 118 / 114 | 118 / 114 |

The Arc seed 1729 desktop campaign cleared ten rooms through Transmission Chamber on `463c6c67`, with zero errors and zero recorded defects. After merging PLAY41 at `bf3bc21a`, the production build passed and High Meltdown and Low Whiteout produced four new frames with empty errors. High Meltdown measured 157 / 158 draws in that retake. [Native campaign](../../artifacts/nextgen/playtest/fx36/index.html) · [FX36 frame comparisons](../../artifacts/nextgen/fx36-review/index.html).

The gallery contains 238 matched frames per build on the original base and the FX36/BROOD43 study build, 84 integrated comparison frames and four post-PLAY41 frames. All 38 capture manifests have empty errors and failures. The 480-pixel previews link to the native 1920×1080 PNGs. The sampled Cryo Crawler is frozen and rimed at native size. Its pose and rime are still harder to separate beside a Brute at 480. In a packed Arc chain the near limbs can also cover a section of the fork.

In the 20-second realtime High Pyro Safety Interlock benchmark, nextgen at `5ef05e91` measured 32.10 / 50.20 ms frame p50 / p95, 207 draws and zero combat compiles. FX36 at `bf3bc21a` measured 31.90 / 50.10 ms, 204 draws and zero compiles. One-minute load was 17.30 and 19.22 at the start of the respective runs on ten cores. Both exceeded 20 ms. This single shared-host pair leaves hardware headroom unverified. [Baseline benchmark](../../artifacts/nextgen/fx36-bench-before/benchmark.json) · [FX36 benchmark](../../artifacts/nextgen/fx36-bench/benchmark.json).
