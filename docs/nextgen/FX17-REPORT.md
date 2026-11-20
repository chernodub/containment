# FX17 ability spectacle

FX17 restores a short, local cast light and moves the follow-through onto the struck actor. The shared contact draws a floor reflection and an elevated core for up to three advancing frames within 51 ms. Pyro adds a rising tongue. The light scales with the native radius, lasts 160 ms and follows flash intensity. Low uses the same atlas reflection with two secondary accents and omits the point light. The contact pool has 24 entries and shares the existing instance and light budgets.

## The four struck bodies

- **Railbreaker.** The elevated white core and victim light expire by 33 ms. The segmented amber wake sits 8 cm above the deck, with two scoring edges underneath the thrown silhouette. The midpoint light has a shorter reach and lifetime. Fast launches can carry a body beyond the brightest part of the trench.
- **Whiteout.** The frozen actor gets a fractured foot mark, a shallow translucent shell and up to four shards at animated limb joints, two on Low. The weather clears from the middle. The joint detail reads at native size. At quarter size the head and leg silhouette do more of the work.
- **Meltdown.** The first Pyro receipt records the incident direction. One flank ignites, then a second card grows farther round the shell over 380 ms. Actor identity varies the direction, width and tip height. Low uses one travelling flame. In a tightly packed group the rear flank can be hidden by another body.
- **Overload during Overclock.** Each authoritative hop gets a filled contact and a 340 ms limb highlight that follows the animated parent and child. A floor link and scorch dot fade over 2.1 s. The echoes use a single faint delayed marine. Plain Overclock slows time, so the crowd fixture fires a real Overload during the active state to show the enemy response.

## Frost accumulation

The retained flagship shader receives up to eight active frost discs and trail capsules. It clips buried perimeter fragments and resolves coincident edges by field order. The remaining interiors attenuate both coverage and premultiplied light. At a three-way intersection each participating surface is limited to 6% of its ordinary contribution and its alpha is clamped before that reduction. The actor and warning masks apply to the resulting surface. This uses the existing transparent pass. Glacier's physical wall and the individual ice shards retain their depth and silhouette.

## Two visual revisions

1. **First capture.** Flashfire regained cone width but held a uniform pale centre. Meltdown left a similarly broad patch on the deck. Napalm's directional front looked like a crescent. Overload's brightest point was on its first span. The elevated rail contact competed with the launched figures, Cryo repeated the standing foot clusters, and similar flames beside adjacent Pyro victims made the ignition order hard to read. The first fixes reduced broad emission, used a radial Napalm body with a raised rim, moved rail follow-through to the floor and gave status presentation sole ownership of the shell flames and joint ice.
2. **Second capture.** At +150 ms Flashfire was still pale across the forward half. Meltdown's core read as a halo around the protected marine and Napalm held a smooth cream-coloured dome. The next revision cooled the cone after 45 ms, collapsed Meltdown's patch by 180 ms and broke the dome up with the fuel noise. The Armory rail shot still lit a wide lane after contact, so victim lights now end at 33 ms and the midpoint light has a shorter reach. I reduced the frozen foot shell, gave the first shell flame some width on contact, and moved more electrical brightness from the primary span to the landing. The new limb highlight follows the moving bone through recoil.

## Capture method

Crew Checkpoint and Relay Racks use the native desktop capture at 1920×1080. Each ability has a cast frame and frames at impact +30, +150, +500 and +2000 ms. Dash arrival is sampled at 140 ms. Armory stages up to 18 legal brutes, begins on confirmed damage, then samples +17, +33, +150 and +333 ms. The full Cryo fight and the four hostile overlaps use their dedicated fixtures. The comparison gallery pairs the nearest available historical simulation time and labels its room. Final9 and final10 provide Crew Checkpoint for the individual powers. Historical crowd composition differs.

The review fixtures and galleries are local evidence. [Three-way comparison](../../artifacts/nextgen/fx17/compare.html) · [Final native frames](../../artifacts/nextgen/fx17/index.html) · [Second critique capture](../../artifacts/nextgen/fx17/review/round2/index.html)

The two-room matrix produced 217 native PNGs across 41 scenarios with zero capture errors. At +150 ms the Flashfire fan is amber, and by +500 ms the fan has given way to the scorched footprint. Meltdown shows a brief halo where the blast yields around the marine, then exposes the deck fractures. Napalm's pool has mass at quarter scale, although its first centre still looks smooth on Relay Racks. In the Armory chain, the longest span still attracts more attention than a distant limb. On the full Cryo build the outer storm and the advancing frost front can both be visible. The centre now leaves room to see the marine and nearby actors.

The native Pyro overlap frame 07 shows the red wedge interrupting both the filled pool and its bright edge. The Cryo overlap cuts a clear lane through the white front. At quarter scale the thinner end of an Arc link is easier to lose against damage numerals. [Pyro overlap](../../artifacts/nextgen/fx17/value14-overlap-pyro-communal-atrium-07.png) · [Rail aftermath](../../artifacts/nextgen/fx17/gallery-overdrive-breacher-armory-05.png)

## Per-ability cost

These are maximum whole-scene draw counts across the five sampled frames in each room. They include the room, enemies and active effects submitted to WebGL. A staged capture cannot isolate the GPU time of an individual ability.

| Ability | Crew Checkpoint peak draws | Relay Racks peak draws | Presentation work |
|---|---:|---:|---|
| ram | 93 | 114 | Two contact positions share the dash track and dust batches. |
| seismic-slam | 94 | 115 | Raised sectors and fracture ribbons share the kinetic batches. |
| bulwark | 81 | 116 | The placed wall shares one impact stamp with its base. |
| railbreaker | 98 | 121 | One lance and one deck wake. At most eight short victim lights requested from the pool. |
| frost-trail | 93 | 114 | One retained strip with a sampled capsule and an origin and arrival contact. |
| cryo-nova | 94 | 114 | One shock surface and one frost surface. Up to 16 shard clusters on High. |
| glacier | 83 | 116 | Placed wall, foot stamp and a retained frost surface on shatter. |
| whiteout | 99 | 116 | One climax disc and weather dome. Up to four joint shards per frozen body. |
| afterburn | 98 | 114 | Origin and arrival flames and one retained fuel strip. |
| flashfire | 95 | 116 | Up to three fire slices with one retained scorch fan and forward light. |
| napalm-charge | 96 | 119 | One short dome. A settled fuel surface and a rim-tongue mesh share the pool. |
| meltdown | 101 | 119 | A short pillar and retained fracture disc. Up to two fire cards per struck shell. |
| static-step | 97 | 118 | Origin and arrival contacts. A short wake and real link receipts. |
| overload | 97 | 115 | A primary surface and shock per hop, two short branches and a pooled limb ribbon. |
| tesla-pylon | 98 | 122 | One persistent pylon and its real link contacts. |
| overclock | 97 | 118 | A fracture field and one faint marine echo. Damaging hops come from Overload. |

The final joint lookup also recognises the Stalker, Spitter and Carrier skeletons. The mixed-family full build and overlap cases, plus Glacier and Tesla Pylon in both rooms, were recaptured on 419573ed. The comparison gallery uses these 41 refreshed frames wherever available. The remaining views use the renderer from c08f0b2d. [Final joint capture](../../artifacts/nextgen/fx17/review/joints/index.html)
