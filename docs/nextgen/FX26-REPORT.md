# FX26 cast peaks and residual effects

The baseline is `29996b19`. The production build used for the final measurements is `7555c6df`. All changes run in the renderer except for the plasma hit receipt, which now carries the result of the existing armor-break decision. The same native decision still awards the weapon lesson.

## Casts

Flashfire opens into orange lobes with yellow tips and a dark red foot. The standing flames subside into a fan-shaped scorch. Afterburn leaves an upright row of flames along its dash, followed by a soot stripe. Napalm erupts in three tall lobes. Shorter flames remain around its fuel bed, and the soot outlasts the fuel by two seconds.

Meltdown sends a bright radial star and an outward pressure wave across the deck. Its floor then breaks up into ember-lit fissures. Six short flame roots surround the moving suit, with a separate additive glow at the feet. The hostile sector draws over the floor.

Whiteout rolls a blue-gray bank of frost outward. Uneven ice and a visible leading edge remain on the floor. Ice gathers on upward-facing enemy surfaces and leaves the underside dark. Overload starts with a violet strike from the marine to the first victim. Later hops briefly light the individual shells and their contact forks, then the arc disappears.

The final plasma hit that exhausts armor sends a broad fragment toward the screen's upper left. The fragment uses the existing debris pool and lives for 3.8 seconds. A cut in the exposed shoulder changes the Brute's profile.

## Review conditions

Each power study uses one native cast at Crew Checkpoint. The columns show the peak, a later wind-up and the empty-room effect. The fixture removes the actors for the third view. The plate study follows a single native plasma break through flight and landing. Each sheet places the baseline above the revision.

## Paired budget runs

Each rig ran against both builds in Safety-interlock Station, High then Low, for 15 seconds per tier. The first invocation waited for load to drop below six. The measured pairs used the existing load-limit override of 100 and kept load reporting enabled. All eight runs recorded zero combat shader compilations.

| Rig and tier | Peak draws, before → after | Median frame ms, before → after | P95 frame ms, before → after | One-minute host load at start, before → after |
| --- | ---: | ---: | ---: | ---: |
| Pyro High | 304 → 303 | 57.8 → 33.9 | 125.1 → 84.3 | 9.84 → 10.81 |
| Pyro Low | 288 → 281 | 25.1 → 25.5 | 59.3 → 66.7 | 9.60 → 12.06 |
| Cryo High | 250 → 223 | 41.5 → 56.7 | 108.2 → 216.7 | 9.68 → 10.04 |
| Cryo Low | 276 → 229 | 41.7 → 58.3 | 92.3 → 241.6 | 8.91 → 8.97 |

Both High runs stayed below 330 draws. Frame times exceeded the 20 ms P95 target in every run. Cryo had longer frame times on both tiers after the change. One pair per rig on this shared host leaves the cause unresolved.
