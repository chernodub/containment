# FX26 cast peaks and residual effects

The baseline is `29996b19`. The production build used for the final measurements is `7555c6df`. All changes run in the renderer except for the plasma hit receipt, which now carries the result of the existing armor-break decision. The same native decision still awards the weapon lesson.

## Casts

Flashfire opens into orange lobes with yellow tips and a dark red foot. The standing flames subside into a fan-shaped scorch. Afterburn leaves an upright row of flames along its dash, followed by a soot stripe. Napalm erupts in three tall lobes. Shorter flames remain around its fuel bed, and the soot outlasts the fuel by two seconds.

Meltdown sends a bright radial star and an outward pressure wave across the deck. Its floor then breaks up into ember-lit fissures. Six short flame roots surround the moving suit, with a separate additive glow at the feet. The hostile sector draws over the floor.

Whiteout rolls a blue-gray bank of frost outward. Uneven ice and a visible leading edge remain on the floor. Ice gathers on upward-facing enemy surfaces and leaves the underside dark. Overload starts with a violet strike from the marine to the first victim. Later hops briefly light the individual shells and their contact forks, then the arc disappears.

The final plasma hit that exhausts armor sends a broad fragment toward the screen's upper left. The fragment uses the existing debris pool and lives for 3.8 seconds. A cut in the exposed shoulder changes the Brute's profile.

## Review conditions

Each power study uses one native cast at Crew Checkpoint. The columns show the peak, a later wind-up and the empty-room effect. The fixture removes the actors for the third view. The plate study follows a single native plasma break through flight and landing. Each sheet places the baseline above the revision.

In the Flashfire and Overload residuals, Stalker 7 is just below and right of the marine at the near end of the red lane. In Afterburn, Brute 6 stands at the left end of the trail and projects its sector to the right. In Meltdown and Whiteout, Brute 6 stands just right of the marine and projects its red sector left across the player. Napalm has two committed actors. Brute 6 is at the left-facing sector beside the marine. Spitter 2 and its short red aim stroke are above and right of the pool.

In the plate sheet, look near (184, 125) at impact, (167, 116) in flight and (117, 102) after landing, measured from the top left of each 480 × 270 panel. The debris pool recorded the same live fragment at 17 ms, 247 ms and 1.65 seconds. It had settled on the deck in the last frame. The shoulder change is subtler than the flying fragment, especially at 480 × 270.

Flashfire’s broad lobes still tint some uncommitted bodies orange. The committed Stalker and its warning remain distinct. Overload’s early contacts now stay on the victims, though the empty-room frame still catches a violet link fading at its last contact.

## Paired budget runs

Each rig ran against both builds in Safety-interlock Station, High then Low, for 15 seconds per tier. The first invocation waited for load to drop below six. The measured pairs used the existing load-limit override of 100 and kept load reporting enabled. All eight runs recorded zero combat shader compilations.

| Rig and tier | Peak draws, before → after | Median frame ms, before → after | P95 frame ms, before → after | One-minute host load at start, before → after |
| --- | ---: | ---: | ---: | ---: |
| Pyro High | 304 → 303 | 57.8 → 33.9 | 125.1 → 84.3 | 9.84 → 10.81 |
| Pyro Low | 288 → 281 | 25.1 → 25.5 | 59.3 → 66.7 | 9.60 → 12.06 |
| Cryo High | 250 → 223 | 41.5 → 56.7 | 108.2 → 216.7 | 9.68 → 10.04 |
| Cryo Low | 276 → 229 | 41.7 → 58.3 | 92.3 → 241.6 | 8.91 → 8.97 |

Both High runs stayed below 330 draws. Frame times exceeded the 20 ms P95 target in every run. Cryo had longer frame times on both tiers after the change. One pair per rig on this shared host leaves the cause unresolved.

The flame shader caps each flame fragment at 60% over the center of the enemy mask. Warning clearance is applied afterward. That limit applies to individual draws. The captures show the final composite, whose opacity also depends on overlapping flames and underlying floor light.

The first Flashfire revision still had long streaks at 480×270. I replaced the stretched fan stamp with a procedural crown and kept upright tongues across its floor footprint. The first empty-room plate capture also lost its target when the encounter dismissed an escort. The revised fixture uses a priority Brute and fires native plasma rounds. Flashfire shoves its original targets, so a fresh Stalker approaches during the residual study and earns its warning through the normal attack rules.

## Comparison frames

| Power | Native panels | Small panels |
| --- | --- | --- |
| Flashfire | [1920 × 1080](/Users/chernodub/.t3/worktrees/containment-game/t3-917e2513-55d87e0cd6c93b1c/artifacts/nextgen/fx26-review/flashfire-1920.png) | [480 × 270](/Users/chernodub/.t3/worktrees/containment-game/t3-917e2513-55d87e0cd6c93b1c/artifacts/nextgen/fx26-review/flashfire-480.png) |
| Afterburn | [1920 × 1080](/Users/chernodub/.t3/worktrees/containment-game/t3-917e2513-55d87e0cd6c93b1c/artifacts/nextgen/fx26-review/afterburn-1920.png) | [480 × 270](/Users/chernodub/.t3/worktrees/containment-game/t3-917e2513-55d87e0cd6c93b1c/artifacts/nextgen/fx26-review/afterburn-480.png) |
| Napalm Charge | [1920 × 1080](/Users/chernodub/.t3/worktrees/containment-game/t3-917e2513-55d87e0cd6c93b1c/artifacts/nextgen/fx26-review/napalm-charge-1920.png) | [480 × 270](/Users/chernodub/.t3/worktrees/containment-game/t3-917e2513-55d87e0cd6c93b1c/artifacts/nextgen/fx26-review/napalm-charge-480.png) |
| Meltdown and Pyro Overdrive | [1920 × 1080](/Users/chernodub/.t3/worktrees/containment-game/t3-917e2513-55d87e0cd6c93b1c/artifacts/nextgen/fx26-review/meltdown-1920.png) | [480 × 270](/Users/chernodub/.t3/worktrees/containment-game/t3-917e2513-55d87e0cd6c93b1c/artifacts/nextgen/fx26-review/meltdown-480.png) |
| Whiteout | [1920 × 1080](/Users/chernodub/.t3/worktrees/containment-game/t3-917e2513-55d87e0cd6c93b1c/artifacts/nextgen/fx26-review/whiteout-1920.png) | [480 × 270](/Users/chernodub/.t3/worktrees/containment-game/t3-917e2513-55d87e0cd6c93b1c/artifacts/nextgen/fx26-review/whiteout-480.png) |
| Overload | [1920 × 1080](/Users/chernodub/.t3/worktrees/containment-game/t3-917e2513-55d87e0cd6c93b1c/artifacts/nextgen/fx26-review/overload-1920.png) | [480 × 270](/Users/chernodub/.t3/worktrees/containment-game/t3-917e2513-55d87e0cd6c93b1c/artifacts/nextgen/fx26-review/overload-480.png) |
| Plasma plate break | [1920 × 1080](/Users/chernodub/.t3/worktrees/containment-game/t3-917e2513-55d87e0cd6c93b1c/artifacts/nextgen/fx26-review/plate-1920.png) | [480 × 270](/Users/chernodub/.t3/worktrees/containment-game/t3-917e2513-55d87e0cd6c93b1c/artifacts/nextgen/fx26-review/plate-480.png) |

The final gallery contains 45 frames with zero capture failures or runtime errors, including eight overlap frames each for Pyro, Cryo and Arc. The separate Whiteout timeline reaches the four-second freeze pulse with five frozen Brutes. Their upper shells take the frost color while their legs and ink outlines remain dark. [Overlap gallery](/Users/chernodub/.t3/worktrees/containment-game/t3-917e2513-55d87e0cd6c93b1c/artifacts/nextgen/fx26-final/index.html) · [Frozen Brutes at native size](/Users/chernodub/.t3/worktrees/containment-game/t3-917e2513-55d87e0cd6c93b1c/artifacts/nextgen/fx26-freeze/v2-whiteout-crew-checkpoint-crew-checkpoint-06.png)

## Campaigns

The production build passed. Pyro, Cryo and Arc each cleared ten rooms on seed 1729 with zero runner errors and zero reported defects. The campaigns used native desktop input with fast rendering. [Pyro run](/Users/chernodub/.t3/worktrees/containment-game/t3-917e2513-55d87e0cd6c93b1c/artifacts/nextgen/playtest/fx26-pyro/index.html) [Cryo run](/Users/chernodub/.t3/worktrees/containment-game/t3-917e2513-55d87e0cd6c93b1c/artifacts/nextgen/playtest/fx26-cryo/index.html) [Arc run](/Users/chernodub/.t3/worktrees/containment-game/t3-917e2513-55d87e0cd6c93b1c/artifacts/nextgen/playtest/fx26-arc/index.html)
