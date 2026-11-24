# PLAY27 · Melee recovery and final crossing

The comparison starts at `b74bfa28`. The supplied Standard competent baseline cleared 37 of 48 campaigns. Breacher cleared 8, Cryo 11, Pyro 9 and Arc 9. Story novice cleared 22 of 24. Neither baseline cohort stalled.

## Combat and staging

1. An ordinary Brute or Carrier that misses a committed swing enters at least 450 ms of recovery. A missed Stalker lunge has at least 320 ms of recovery. These floors apply across difficulties and sectors. A surviving Brute, Carrier or Stalker takes one stagger on the first weapon hit of each exposed recovery, extending the opening by 350 ms and keeping the next wind-up behind the extended timer. Exposed weapon hits against ordinary Brutes and Carriers deal 40% extra damage. Crawlers, Spitters, Stalkers and guardians retain their prior damage bonus. The recovery floor applies to misses only.
2. The renderer positions recovery brackets from the actor's drawn root every frame. A missed ordinary swing plays the existing exposed synthesis at 45% gain, with a 1,500 ms interval between cues. The first stagger adds a gold pulse and a short confirm cue.
3. Both desktop and render-free policies put an exposed ordinary Brute, Carrier or Stalker ahead of other targets when the target is visible, the shot is clear, the target is within weapon range and at least 150 ms of exposure remains.
4. Service Shaft Landing starts with a Stalker. Subsequent arrivals in its opening beat are spaced 2,800 ms later. The first attacker approaches along the landing where the marine has a legal sidestep, and the second beat sends its Crawlers in from opposite ends of the landing. The authored groups retain their enemy counts.
5. One waiting Stalker per beat can move toward the marine's recent retreat direction. It uses roughly 1,000 ms of position history and the existing visible approach routes. It keeps the normal wind-up when an attack slot opens.
6. Overload Floor opens the choice with a 500 ms Spitter wind-up along the short crossing. The sheltered path has brighter markings, a larger Cover label and a matching glyph on the far bank. Both bots prefer the sheltered bank below 60% combined health and armour, or while the near lane is under its opening wind-up and dash is spent.

## Desktop evidence

The production build passed. During the first native run, an exposed weapon hit produced no stagger because knockback had already ended recovery. The corrected build moves the body on impact and preserves the recovery timer. A fresh native trace recorded the stagger receipt.

Cryo's first Stalker at Service Shaft Landing appeared about 1,400 ms after room entry and began its 460 ms wind-up at about 1,667 ms. Cryo killed it before the strike. The next Stalker appeared about 4,650 ms after entry. The second beat alternated Crawler arrivals from the north and south ends of the landing. Cryo cleared the room with 66.1 suit damage. The reviewer cited 200.7 on a different winning Cryo run.

Native Standard Cryo on seed 1729 completed all 20 rooms with zero runner errors. Its trace includes 14 exposed hits out of 2,671 positive-damage weapon hits (0.52%) and seven recovery stagger receipts. Cryo entered the crossing at 100 health and 53.7 armour, chose the near bank, and lost zero suit points between the first choosing snapshot and bank selection.

Native Standard Breacher on seed 1729 also completed all 20 rooms with zero runner errors. Its trace includes 12 exposed hits out of 2,112 positive-damage weapon hits (0.57%) and five recovery stagger receipts. Breacher entered the choice at 100 health and 100 armour, chose the near bank, and lost zero suit points on the crossing. Both native traces observed the opening ranged wind-up.

The runner reports and input traces are filed under `artifacts/nextgen/playtest/play27-final-native-{cryo,breacher}/`.

## Standard competent

The cohort cleared 40 of 48 with zero stalls. Breacher, Cryo, Pyro and Arc each cleared 10 of 12. This meets the target of 34–40 clears and at least seven per rig, so ordinary enemy idle durations stayed at their existing values.

All 41 campaigns that chose a bank took the short crossing. Seven died before making a bank choice. On seed 11, Breacher took the near bank with zero crossing damage, Cryo took the near bank with 24 suit damage, Pyro took the near bank with zero crossing damage, and Arc took the near bank with zero crossing damage. Cryo seed 9001 also took the near bank, with 59.5 crossing damage. The covered route still needs a live campaign example.

The Standard reports are under `artifacts/nextgen/playtest/play27-standard-{breacher,cryo,pyro,arc}/`.

## Story novice

Story finished at 23 of 24 with zero stalls. Breacher cleared all 12 seeds. Cryo cleared 11 and died in Safety-interlock Station on seed 256. The Story reports are under `artifacts/nextgen/playtest/play27-story-{breacher,cryo}/`.

## Exposed weapon hits on seed 1729

The paired Standard simulations used the competent policy and counted positive-damage weapon hit receipts. The before runs loaded both game and policy source from `b74bfa28`.

Breacher went from 6 of 2,125 hits (0.28%) to 10 of 2,124 (0.47%). Both runs cleared all 20 rooms. Cryo went from 4 of 346 hits (1.16%) to 31 of 2,347 (1.32%). Baseline Cryo died in Freight Hold after six clears. PLAY27 Cryo finished all 20 rooms, so its share covers a different mix of encounters.

The paired reports are under `artifacts/nextgen/playtest/play27-{before,after}-{breacher,cryo}/`.

## Visual review

I inspected the recovery brackets, Cover label, near-lane wind-up, marked bend and occupied far-bank glyph at 1920×1080 and 480×270. The Cover label remains legible at the smaller size, and the hexagon is visible under the marine at the covered bank. The far-bank image places the marine at the pad as a capture fixture. The [review gallery](../../artifacts/nextgen/play27-review/index.html) and [occupied far-bank capture](../../artifacts/nextgen/play27-covered/play27-covered-bank-overload-floor.png) contain the source PNGs.
