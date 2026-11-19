# R14-B — independent play-and-feel verdict (GPT Astra 6.2, high reasoning, 2026-11-20, gallery final9)

## 1. Scores

| Area | /10 | Judgment |
|---|---:|---|
| Core combat loop | **7.0** | Stepping out of a committed swing and firing back feels earned, and killing a leader can dismiss a whole escort, but retreating and firing still solves long stretches of the campaign. |
| Ability kit design and rig differentiation | **8.0** | Crushing a target sideways into a barricade, sacrificing an ice wall, detonating a burn and sweeping a live wire give four rigs genuinely different reasons to move. |
| Enemy design and counterplay | **7.0** | The Stalker's locked lane, the Warden's wall collision and the Matron's interrupt reward distinct responses, though the smallest attackers lose their identity in a pack. |
| Game feel | **6.5** | A rifle burst now kicks the receiver and tips a Crawler into a continuous fall, but the ordinary surviving hit remains harder to see at fighting distance than the damage number. |
| Build variety and run depth | **6.5** | The exclusive augments can change how a room is played, while the fixed itinerary and several one-sided supply decisions limit what changes on a second expedition. |
| Onboarding and clarity | **7.5** | Awakening Bay teaches an actual evade and punish, but the game counts a fleeting glimpse of an advanced rig hint as having learned it. |
| Interface flow from title to death/results | **8.0** | The title, illustrated drafts, explicit shop prices and actionable death report form a coherent desktop game, with one misleading primary action on the rig screen. |
| Pacing and difficulty curve | **6.5** | Story offers a credible way through and Standard produces genuine losses, but late attrition varies sharply by room and rig, and cleanup still occupies roughly a fifth of active play. |

The scale uses 5 for a competent prototype, 7 for a solid commercial indie release and 10 for best in class. I inspected 64 images in batches of four or fewer, including seven native 1920×1080 frames. Gallery paths below start at `artifacts/nextgen/final9/`. Reports and source refer to the read-only `d89ed056` checkout. According to `MANIFEST.md`, the campaign, motion and boss captures were retained from `84dc049c`; the room, collider, revised Overdrive and root screen captures are current. The 480×270 reductions test what survives a glance. Sound, input latency, hardware frame rate and human learning remain unverified.

## 2. Calibration

**Near release quality as a combat system, late commercial alpha as a twenty-room game.** I would play again to try Ice Road after learning what it costs to give up Glacier. The biggest gap to the next tier is that too few rooms make their best tactical decision visible *before* I make it. In Safety-interlock I can erase six flankers by breaking the screen early. What I experience may just be six enemies that never appeared. The practice Brute gets this right at a smaller scale. I see the blade commit, leave its footprint, hit the exposed body and collect 20 credits. That exchange has a beginning and an ending I can attribute to my own hands.

## 3. Ten first-hour problems, ranked

1. **Winning a beat can look like ordinary thinning of the crowd.** In Pyro's Safety-interlock samples `play-r12-safety-interlock-station-018.json` and `-023.json`, six arrivals are canceled at 9.1 seconds and the siege begins at 11.5. A first-time player has little opportunity to connect the two. At the first breakable pincer, show the flank staging behind a visible breach. Have its shutter slam and the relay approach light up the moment the last screen enemy falls. Preserve the 14-second decision. See `src/game/waves/EncounterDirector.ts`.
2. **The first warning reads better than the next safe step.** In `overlap/value14-overlap-cryo-communal-atrium-06.png` the red fan survives a huge frost field. In the corresponding Breacher frame 07, my eye goes to repeated white 45s before the small red mark under the marine. In `rooms/combat-heavy-relay-racks-02.png`, I can pick the leading wedge out of several crossing lanes more quickly than I can choose where to land. Preserve a short section of each imminent escape-side edge through bodies and friendly effects, and move duplicate numbers away from the marine's feet.
3. **The late difficulty spike often tests endurance against familiar small attacks.** On the final cover cohort, Standard loses five runs in Transmission and five in Service Shaft, and Breacher clears only 10/20. In the Arc retry, familiar Stalker and Crawler attacks account for 143.7 of the fatal room's 153.4 damage. A player who reaches the brood encounter can learn “I needed more health” before learning the boss. Give the first Shaft interception a single visible flank and delay the next screen until that lunge has resolved. Keep the later pincer and the current hit caps. See `ROOM14-REPORT.md` and `play/arc/fast/report.json`.
4. **The ordinary rifle hit is easy to lose once several targets move.** In `motion/crawler-weapon-sequence-rifle.png`, the first hit rolls the shell and the second takes away its support. The terminal fold is the clearest part. In `native-heavy/cryo-pressure-1.png`, the 11 above a line of advancing bodies is easier to locate than the creature that caught the round. Give the first struck shoulder or shell edge a sharper directional break and carry it through the next stride. Tune it with numerals hidden, keeping the native attack clock intact.
5. **Mastery hints can teach the wrong verb, then disappear.** The Pyro callout says “Q – ignite marked targets.” Those targets are already burning. Q *consumes* the burn for 95 damage and a stagger. Arc's “Next hop” identifies a body without telling me what repositioning would buy. The hint is saved as seen on first display, for at most 2.5 seconds. Say “Q · Detonate 1,” show where the next Arc link will end, and repeat each hint on a later opportunity until the player succeeds or dismisses it. See `onboarding/onb14-mastery-{pyro,arc}-awakening-bay.png`, `src/ui/hud/MasteryHints.ts` and `src/game/abilities/catalog.ts`.
6. **The first route teaches me to stop weighing routes.** `route.png` offers the same destination with either current supplies or 45 free credits and no extra enemies. The later medicine-versus-workshop choice deserves attention that the first junction trains me to withhold. Offer the early cash against an equally immediate field repair or a grenade cache, and show the resulting inventory on both cards. See `src/game/roguelike/economy.ts`.
7. **The last few bodies still take too much of the evening.** Full Breacher spends an estimated 200.2 of 970.0 active seconds in cleanup. Full Pyro spends 148.1 of 828.1. The estimate includes dangerous moments, but another search after a decisive play dilutes the value of winning it. Carry retreat behavior through surviving offspring of a broken escort and let the player advance once the retreat is irreversible. Start with Swarm's opener, where ENC14 measured 13.6 seconds of Standard cleanup. See `play/summary.md` and `ENC14-REPORT.md`.
8. **Cover works even when the room fails to introduce it.** The tilted Freight stack has a credible base and stops shots. The Shaft assembly lies at the margin of its incident view, and only 18% of its projected footprint is visible from the centre in the room audit. Players can learn the cover by colliding with it before learning where it saves them. Stage the first Spitter across one shoulder of the wreck and put a desirable pickup in its lee. See `colliders/incident-cover-freight-hold.png`, `rooms/incident-facing-service-shaft-landing.png` and `ROOM14-REPORT.md`.
9. **A boss's biggest opening can resemble a pause in its animation.** The Warden's charge lane reads instantly in Relay Racks. After the collision, the crown and body overlap the marine, and a small gold marker carries much of the stun. The Matron's open pods show bright cores, but a new player must infer why either core matters now. Pin the Warden's head against the obstruction for the opening and make the two pod shells visibly split toward their common parent during the final half-second. See `bosses/ktx2-warden-relay-racks-wall-stun.png` and `bosses/pod-stages/ktx2-matron-crew-checkpoint-pod-opening.png`.
10. **The brightest launch button silently changes the selected rig.** In `rig-select.png`, Breacher is highlighted, its portrait and four abilities fill the panel, and “Recommended loadout” launches Cryo. The accessible label names Cryo, but the visible label omits it. A player can spend the opening pressing Shift for the Ram just advertised. Label that button “Quick start · Cryo” and give “Equip Breacher” primary emphasis when the player deliberately selects Breacher. See `src/ui/screens/{templates,ScreenManager}.ts`.

## 4. Rigs, augments and enemies

| Rig | Fantasy, dullest button and missing feedback | Is the exclusive choice real? |
|---|---|---|
| **Breacher** | Yes. The barricade gives a sideways Ram somewhere to put a body, and Railbreaker rewards lining up a pack. Base **Seismic Slam** asks least of me when surrounded. A victim briefly folding against the wall would make a planned 68-damage crush recognizable among incidental hits. | **Siege Plow** moves the barricade and therefore the point of contact. **Fault Line** turns the aimed Slam lane into three seconds of denial. I would choose between them on the basis of where I want to stand. |
| **Cryo** | Yes, most clearly. Keeping Glacier buys safety. Pressing F again buys 100 damage per wall. **Frost Trail** is the dullest input because a routine escape lays it anyway. Give a pursuer crossing the trail a distinct loss of footing so I can set up Nova deliberately. | **Shard Harvest** rewards selecting a frozen kill near three other targets. **Ice Road** trades the wall and its shatter for a traversable 1.6× speed strip. This pair gives up something I already value. |
| **Pyro** | Yes. Afterburn lays fuel across pursuit and Flashfire lets me decide when to spend it. Base **Napalm Charge** has the least follow-through after placement. A brief extinguishing reaction on consumed targets would distinguish a successful detonation from another fire pulse. | **Ember Relay** spreads ignition between targets for repeated cash-outs. **Meltdown Core** exchanges the eight-second aura for a two-second fuse and 240-damage blast. One rewards sustaining a field, the other entering and escaping on time. |
| **Arc** | Yes, especially when moving across a pylon link. Base **Overload** is the dullest directly after Static Step because both can chain through the same cluster. Show the first recipient and the next eligible hop as two different marks while aiming. | **Pilgrim Pylon** follows and can fall behind a corner. **Live Wire** replaces the Q chain with a four-second tether that I sweep through enemies. Its loss of Forked Overload recipients is a meaningful cost worth showing on the draft face. |

The spatial differences survive in the four `review480/builds--v2-full-<rig>-armory-armory-04.png` frames. In `abilities/v2-flashfire-crew-checkpoint-crew-checkpoint-04.png`, the line of 18s shows the weaker fresh-target shove. The four Standard builds installed Plow, Harvest, Relay and Pilgrim respectively. That exercises one side of each pair. Relative power between partners remains open. See `src/game/abilities/{catalog,augmentCatalog}.ts` and `KIT13-REPORT.md`.

| Enemy | What I can read, how I answer it, and where it repeats |
|---|---|
| **Crawler** | A pink-backed screen with a 320 ms swipe teaches distance quickly. Alone, it is fair. In a train, dorsal bars and numbers can be all that separates one attacker from the next. The twentieth swipe adds pressure more readily than a new decision. |
| **Stalker** | Its 460 ms line rewards a lateral step, then allows 650 ms to retaliate. Intercepting retreat earns it a place distinct from the Crawler. The line remains legible farther away than the thin body or the elite hook, so another pair in a pack can feel like extra contact damage. |
| **Brute** | The high cleaver, 700 ms wind-up and head-down recovery make the best ordinary melee lesson. It works as an anchor guarding a valuable target. Left alone after the screen dies, repeating the sweep has little surprise. |
| **Spitter** | The green sac and projectile ask a genuinely different question about sightlines. Solid cover answers it fairly when the player can locate the source. A directional edge cue is less help in choosing between two sides of cover. Its short backup bite contributes little. |
| **Carrier** | The brood sac makes it a plausible priority target. Killing a marked leader can send the escort home, while children on an ordinary kill complicate target order. Its close cone overlaps the Brute's role, and the visual difference between a valuable leader and another Carrier is smaller than the mechanical difference. |
| **Brute Warden** | The long locked lane gives me time to bait a wall, sidestep and earn a 1.5-second stun. This is the best exchange between an enemy and the ship itself. Four breach offsets vary the approach across rooms 6, 9, 13 and 19, but the same bait asks less each time unless the obstacle changes my exit. |
| **Carrier Matron** | Deal 20 actual damage during a one-second brood or shoot both pods before their 2.4-second hatch. Either success can buy 1.8 seconds of stun. This gives me a fair fallback after missing the interrupt. The swollen sac and pink cores identify the family, while the surrounding Crawler pressure can bury the target-switch lesson. |

Read against `src/game/enemies/{meleeAttacks,EnemySystem}.ts`, `I14-REPORT.md`, `motion/{brute,stalker}-attack.png`, the Relay Racks grey crowd and the Swarm Junction colour crowd in `crowds/`. Boss phase images are staged. Orange collision footprints in those images are inspection aids.

## 5. What the bot campaigns reveal

**Standard can be lost. Story has a credible opening for a newcomer.** The final paired cover cohort in `ROOM14-REPORT.md` cleared **55/80 Standard (68.75%)** and **67/80 Story (83.75%)**. The earlier I14 control cleared 52 and 62 respectively. Final clears out of 20 in Breacher/Cryo/Pyro/Arc order were **10/15/15/15** on Standard and **18/15/16/18** on Story. Neither mode recorded a death in rooms 1–7. The final Story deaths spread across six rooms, including three each in Transmission, Shielding Gate and Manual Control. I would keep the opening and the damage caps. A novice policy with 300 ms reaction time, missed inputs and consumable hesitation still knows where to aim, how to shop and what a relay does. These percentages cannot predict a first-time human's win rate.

| Seed 1729 native attempt | Clears and outcome | Active seconds | Kills | Damage taken | V uses | End credits |
|---|---|---:|---:|---:|---:|---:|
| Standard Breacher | 20, complete | 970.0 | 677 | 1,022.2 | 14 | 82 |
| Standard Cryo | 20, complete | 1,014.9 | 689 | 1,389.7 | 13 | 152 |
| Standard Pyro | 20, complete | 828.1 | 663 | 649.3 | 11 | 168 |
| Standard Arc, full render | 18, wall-timeout in Manual Control | 986.3 | 619 | 912.4 | 12 | 593 |
| Standard Arc, draw-decimated retry | 15, died in Swarm Junction | 786.2 | 485 | 810.9 | 9 | 201 |
| Story Cryo, novice | 20, complete | 907.1 | 533 | 1,079.1 | 11 | 83 |

The gallery therefore contains **three full-render Standard wins**, plus the Story win. I14 separately records a seed-1729 Arc clear. Fixed simulation and a shared seed allow different outcomes when the input traces differ. The zero HP at the end of the successful runs belongs to the authored ship sacrifice. Sources are `play/summary.md`, the per-rig reports and traces, `play/arc/fast/report.json` and `src/DepthGame.ts` (`clearRoom`).

**The dramatic enemy and the damaging enemy can be different.** In the Arc retry's fatal room, Stalkers dealt 74.8, Crawlers 68.9 and Spitter shots 9.7. The fatal hit was a 6.35-point Crawler swipe. The pressure frame shows seven health, a charged relay and enemies along its rim. Across a complete Standard run, Cryo absorbed 762.7 Crawler and 423.2 Stalker damage. Breacher took 353.0 from Spitter shots alone. Pyro finished 186.8 active seconds faster than Cryo while taking less than half its damage. That establishes a fast field-control run on this seed. The paired Standard cohort gives Pyro and Cryo the same 15/20 clear count. See `native-heavy/arc-fast-hardest-7995-0.png` and `play/<rig>/report.json`.

**The encounter consequences change play.** Three Pyro samples give unusually good evidence. In `play/pyro/play-r4-communal-atrium-023.json`, a priority beat has canceled an arrival with three bodies still present. The complete Pyro trace emits nine escort-break cues. In `play-r12-safety-interlock-station-018.json`, the pincer loses six scheduled arrivals before the 14-second flank. In `play-r16-swarm-junction-006.json`, the Matron is **alive**, has about 1.33 seconds of stun remaining and 15 arrivals have been canceled. Focus fire has changed the next fight. The footage establishes less about whether a new player notices why. A retreating escort still pays full kill credit if shot and half if it escapes, giving the player a reason to prolong a beat they just mastered.

**The cover changes play too.** ROOM14 reports 31 solid rectangles checked against rifle fire and spit, and all 101 role-specific navigation targets remain reachable. In `play/breacher/storyboard-freight-hold.png`, the tilted stack sits on a divider and the Stalker lane comes across the marine's route at 18–21 seconds. In `play/cryo/storyboard-manual-control-chamber.png`, the fight moves from open floor to divided sightlines and finally to a relay hold. The final layouts moved Standard Breacher from 14 to 10 clears and Story Arc from 13 to 18. Geometry matters. Attribution to a particular prop, or to a human deliberately taking cover, would require observing that decision.

**A narrow strategy still travels far.** Every ordinary fire-input sample I counted in the five full traces used rifle or shotgun. The completed runs bought the finale resuscitation and still had it at completion. All five first used V in room 6. The Pyro finale is a good 38.2-second fight, with fire laid across approaches and then a stand on the relay. Cryo's Manual Control took 90.7 seconds. A different rig changes how the playfield looks and how long it takes to solve, while the reliable purchases, guns and recovery plan stay remarkably similar. The other three guns' value remains open. See `play/pyro/storyboard-overload-floor.png`, `play/summary.md` and the five `trace.ndjson` files.

## 6. What premium competitors still do better, in order

1. **Let the player predict the result of a brave move.** In *Hades*, turning back into a recovery window feels intentional. Containment reaches that standard with its practice Brute and Warden. Its broken pincer deserves an equally visible payoff.
2. **Keep the next opening readable at peak power.** *Enter the Gungeon* lets me watch a target and still see a gap beside my character. Here the best hostile contour survives, but the next edge, its owner and the marine's feet can demand three separate looks.
3. **Make the cheapest shot worth firing for its own sake.** *Nuclear Throne* is the benchmark for how much physical information a single round can give. Containment's Crawler can now carry a hit through to death. The shooter and a surviving target still have a quieter exchange.
4. **Give a route decision consequences the player can describe several rooms later.** The medicine/workshop junction comes close. An extra Warden or relay changes one encounter. The fixed twenty-room sequence leaves the player few ways to choose what the back half of a run will demand.
5. **Teach mastery through another opportunity to act.** The optional drill already does this for basic melee. A short window to read “Next hop” amid crossfire is a weaker introduction to an entire rig.

## 7. Against R13-B

I recorded the eight scores before reading `docs/nextgen/reviews/R13-B-play-verdict.md`.

| Area | R13 → R14 | Verdict |
|---|---:|---|
| Core combat | 6.8 → 7.0 | Improved 0.2 |
| Rigs | 7.5 → 8.0 | Improved 0.5 |
| Enemies | 6.8 → 7.0 | Improved 0.2 |
| Feel | 6.3 → 6.5 | Improved 0.2 |
| Builds/run depth | 6.7 → 6.5 | Regressed 0.2 in my rating |
| Onboarding | 6.6 → 7.5 | Improved 0.9 |
| Interface | 7.5 → 8.0 | Improved 0.5 |
| Pacing | 6.2 → 6.5 | Improved 0.3 |

| R13 first-hour problem | Status | What changed |
|---|---|---|
| 1. Friendly power hides commitment | **Partly fixed** | The Cryo primary wedge reads through frost, and Pyro's underfoot edge has a contour. Subsequent lanes and attackers behind scenery remain harder to locate. |
| 2. Story room-11/12 cliff | **Fixed for the cited failure** | Rooms 11–13 stage admissions, depleted Story players get a room-12 pickup, accumulated light damage can trigger grace, and the final Story cohort lost nobody in room 12. Later attrition remains. |
| 3. Opener rewards avoiding the lesson | **Fixed** | The optional practice Brute pays for leaving its committed edge and damaging recovery. The Story storyboard shows the warning at 7.6–8.1 seconds and the player clear of it by 9.1. |
| 4. Glacier's second press is hidden | **Fixed** | The live slot says Shatter and the world prompt explicitly offers 100 damage. ONB14 records a deliberate native recast. |
| 5. Distinct openings, identical cleanup | **Partly fixed** | Leader withdrawal, broken screens and brood denial have native receipts. The finale holds once. Significant cleanup survives, and a broken pincer still opens no physical exit. |
| 6. Weak common-shot response | **Partly fixed** | The rifle has a shoulder return and sequential victim reactions. The terminal hit reads better than the ordinary hit in a moving pack. |
| 7. Intent, resistance and pods | **Partly fixed** | The rejection shield separates and pod cores open visibly. Small limbs, the sender of a warning and a crowded boss recovery remain weak. |
| 8. Abstract decisions before firing | **Fixed for the requested changes** | Recommended launch bypasses the boon draft, and the shotgun boon is now Wall Slam. The shortcut's visible rig label needs correction. |
| 9. Money loses purpose | **Partly fixed** | The first stop sells a 35-credit medkit and 20-credit grenade pair, upgrades name their target, and medicine competes with a 180-credit workshop. Winning full runs end on 82–168 credits. Free early salvage remains a non-decision. |
| 10. Debrief omits the counter | **Fixed** | The Spitter lesson depicts the shot striking solid cover, distinguishes the fatal hit from accumulated damage and offers same-rig retry. |

**Worse or uncertain.** The previous gallery's four Standard winners used V by room 4. All five full-render attempts here first used it in room 6, delaying the signature action in these runs. Standard Breacher's paired cover result fell 14/20 → 10/20 even as aggregate clears rose. My lower run-depth mark reflects the weight I give the fixed itinerary and dominant early offer. The economy itself improved. I read `DEFECTS.md` last. Its lower-HUD observations support the crowd-read concern, and its note on the repeated staged Brute composition is a good reason to judge encounter variety from native play.

## 8. One more month, five investments

1. **Give three encounter wins a visible consequence.** Start with Safety-interlock's sealed flank, Atrium's escorts visibly falling back, and Swarm's brood collapsing into a punish window. Spend the time between commitment and payoff showing what the player's intervention changed.
2. **Rework two dangerous approaches around usable cover.** Put a readable Spitter lane and a safe crossing in Transmission, then let the player bait Shaft's first flank past the hoist. Observe fresh desktop players choosing a route with Breacher and Cryo before changing global damage.
3. **Finish the rifle exchange at the actual combat camera.** Pair an animator and combat designer on one burst into a moving Crawler pack. Make a miss, a surviving hit and a kill distinguishable with numbers off. Carry that treatment to the Stalker and protect the escape edge during the hit.
4. **Extend the drill's teaching method to the four rigs.** Immediately after the first transformative choice, present one skippable setup where waiting, shattering, detonating or re-angling has an observable consequence appropriate to that build. Retire the hint on success.
5. **Make two junctions change the next two rooms.** Replace free salvage with a genuine resource trade. At a later junction, offer a protected route that preserves supplies against a dangerous route with a named build reward and a different firing lane. The second expedition should give the player a reason to take the other door.
