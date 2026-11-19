# R13-B — independent play-and-feel verdict (GPT Astra 6.2, high reasoning, 2026-11-19, gallery final8)

## 1. Scores

| Area | /10 | Judgment |
|---|---:|---|
| Core combat loop | **6.8** | Baiting a charge, cutting a firing lane and holding a relay make positioning matter, but too many encounters finish with the same retreat, shoot and collect routine. |
| Ability kit design and rig differentiation | **7.5** | Four rigs give four credible answers to a closing pack, and choosing when to spend an established burn or break one's own ice wall is good commercial action design. |
| Enemy design and counterplay | **6.8** | The locked lunge, wall stun and interruptible brood all have fair answers in the rules, while overlapping bodies and subtle recovery poses make those answers unevenly visible. |
| Game feel | **6.3** | The shotgun sends a Crawler tumbling and Railbreaker cuts a satisfying line through a formation, but an ordinary rifle hit barely changes the shooter or victim at fighting scale. |
| Build variety and run depth | **6.7** | Exclusive augments change movement, targeting and cover, while five similar detour offers and a prescribed twenty-room sequence give the second expedition relatively little strategic uncertainty. |
| Onboarding and clarity | **6.6** | An isolated Crawler, Brute and revealed Stalker make a good first three lessons, but a player can clear them at range and reach a pincer without having learned how to leave one. |
| Interface flow from title to death/results | **7.5** | Illustrated rewards, explicit purchase costs and an accurate natural-death breakdown are release-quality decisions, with too much of the rig and boon vocabulary arriving before the first shot. |
| Pacing and difficulty curve | **6.2** | Bounded hits and recovery give mistakes room to breathe, but the room-11 increase in bodies and simultaneous attacks produces an abrupt second difficulty curve. |

I reviewed 54 gallery files in batches of four or fewer, including five native 1920×1080 frames, four campaign storyboards and four motion sheets. I used the existing reports, source and traces. Feel judgments cover visible timing and physical consequence. Audio, input latency, sustained frame rate and human learning remain unmeasured. Image and campaign paths below are relative to `artifacts/nextgen/final8/`. Report names are relative to `docs/nextgen/`.

## 2. Calibration

**Late commercial alpha.** I would pay attention to this game after one room and want to try another rig after one run. I would hesitate to recommend it as a finished action roguelike. The biggest obstacle is how long it takes to read **the next safe step**. In `native-heavy/pyro-hardest-4071-0.png`, I can find the marine, read 50 health and see two medkits immediately. Even at 1080p, I have to trace two overlapping attack fans through my own orange pools, burning bodies and floating numbers to choose an exit. *Hades* earns the player's trust at precisely that instant. Containment already has interesting answers to danger. It too often spends the player's reaction window explaining the question.

## 3. Ten first-hour problems, ranked

1. **Friendly power obscures hostile commitment.** In the native Pyro frame above, my fire, the damage ticks and the nearest danger share hue and space. The ordinary Story Cryo frame `native-heavy/story-cryo-hardest-4451-0.png` shows how much faster a single fan against a muted floor reads. Give the nearest committed strike an uninterrupted contrasting edge, suppress tick numerals inside it, and dim friendly pool detail beneath its escape side.
2. **Story has an attrition cliff halfway through.** Novice Cryo entered Safety Interlock with about 45 HP, 6 armor and no consumables. Within 15.8 seconds it had taken 49 Crawler and 29.34 Stalker damage and died. Story's late wave multiplier is 2.1 and its light melee admissions rise from two to four starting in room 11. A novice who barely survived room 11 gets the full pincer immediately. Stage that increase across rooms 11–13 and give a depleted Story player one visible recovery opportunity before the room-12 pincer. Evidence in `play/story-cryo/{trace.ndjson,report.json}` and `src/game/difficulty.ts`.
3. **The opener can teach the wrong success condition.** Breacher shoots the first Crawler at range, spends several frames with no immediate target, then uses a barricade against the group and exits at 9.3 seconds. That is legitimate play and poor practice for the later flank. Offer one optional follow-up in the opening bay that rewards stepping across a locked attack edge and hitting the recovering body. Let a skilled player leave immediately. See `play/breacher/storyboards/awakening-bay-storyboard.png` and `src/ui/onboarding.ts`.
4. **The most interesting second press is easy to miss.** Glacier's live wall stops a line of shots while the bottom F slot shows time. An expert knows pressing F can trade that protection for 100 damage per wall, versus 45 on expiry. A new player has every reason to wait. Change the live slot to **F · Shatter**, retain the cooldown in secondary type, and show that prompt once beside the first wall an enemy reaches. See `review480/abilities--v2-glacier-crew-checkpoint-crew-checkpoint-05.png` and `KIT13-REPORT.md`.
5. **Distinct openings converge on identical cleanup.** Transmission and Overload both open and close with a siege. Between them, most beats require removing every body before a 2.5-second lull. Arc's finale lasts 107.8 seconds and returns to the same relay after gathering scattered enemies. Give one pincer an actual exit that opens when its screen breaks, and end one priority beat when the leader falls, with surviving escorts withdrawing on screen. See `src/game/waves/authoredEncounters.ts` and `play/arc/storyboards/overload-floor-storyboard.png`.
6. **The common shot has the weakest physical answer.** In `motion/crawler-weapon-hit-rifle.png`, a tracer, tiny spark and small tilt carry the hit. The shotgun kill sheet gives the same body a much more intelligible change of state. Rifle shots account for 3,255 of Arc's 3,709 recorded shot events. Give the rifle a short shoulder return and a directional shell or limb recoil on the Crawler, preserving attack timing. Judge it against a moving pack at normal camera distance.
7. **Enemy identity is clearer than enemy intent.** I can pick out a green Spitter or pink Carrier in the crowd. I struggle to read a distant crown/shield, the word “RESISTED”, or the difference between a pod counting down and opening. A player can spend their one control move to no useful purpose. Anchor resistance to the body with a shield-breakaway motion on rejection, and make the pod silhouette open in three readable stages. See `review480/champion-mechanics--comm13-priority-armory-04.png` and `bosses/ktx2-matron-relay-racks-pod-{countdown,opening}.png`.
8. **The first meaningful choice comes before the player has a reference point.** Difficulty, four rigs with four slots apiece, then a starting boon precede firing. The art sells the marine. “Breacher” later appears on a weapon boon even in a Cryo draft. A newcomer can reasonably wonder whether installing it changes rigs. Add a one-click recommended loadout and rename the shotgun boon around its wall-impact effect. Keep full selection one action away. See `difficulty-selection.png`, `rig-select-cryo.png`, `starting-boon.png` and `augment-draft.png`.
9. **Money loses its purpose at both ends of a run.** Story Cryo died holding 343 credits just before the next supply stop. Winning Breacher finished with 927. The shop sells real recovery, yet its upgrade selects the first supported installed augment, and the five detours repeat an extra escorted group for 150 credits. Give one junction a choice between immediate field medicine and an augment-specific improvement, priced visibly before entry. See `route.png`, `src/game/roguelike/economy.ts` and the two campaign reports.
10. **The debrief tells me what killed me, then leaves the counterplay implicit.** The natural death panel correctly separates the fatal 14-point Stalker lunge from 49 points of Crawler swipes. That distinction matters more than the kill count. Use that space for one illustrated retry lesson, such as stepping sideways when the Stalker's line locks, with a quick restart on the same rig. See `play/story-cryo/terminal-dead.png`. The “Unidentified damage” in `results-fixture.png` comes from staging.

## 4. Rigs, augments and enemies

| Rig | Fantasy, dullest button and missing feedback | Does the exclusive pair change play? |
|---|---|---|
| **Breacher** | Yes. Ram can crush a foe against Bulwark for 68 damage and 450 ms stagger. Railbreaker rewards lining up the pack. Base Q, Seismic Slam, is the dullest because pressing it whenever surrounded usually answers the question. Show a crushed enemy folding against the barrier so the player can distinguish a planned kill from incidental splash. | **Siege Plow** advances the blocking front at 90 units/s and changes where Ram must land. **Fault Line** gives Slam a persistent aimed stagger lane. One changes where I stand, the other where I aim. |
| **Cryo** | Yes. Chill, freeze, kill and deliberate wall shatter form the clearest sequence. **Whiteout** is the least interactive button once activated, with eight seconds of automatic pulses. Make the next frozen-kill opportunity and the wall recast legible inside that blizzard. | **Shard Harvest** sends shards from a frozen kill to three nearby targets. **Ice Road** gives up blocking and both shatters for a 1.6× movement strip. This is the strongest sacrifice in the draft, especially after manual shatter became valuable. |
| **Pyro** | Yes. Afterburn slows pursuit, Napalm establishes fuel, and Q turns existing burn into 95 immediate damage and a stagger. The dullest is base **Napalm Charge** once placed. Show which targets Q can cash out and give the consumption a distinct extinguishing beat. The staged fresh-target Flashfire frame shows five 18s, an accurate picture of its weaker use. | **Ember Relay** spreads fuel for repeat Q casts. **Meltdown Core** replaces an eight-second aura with a two-second moving fuse, 240-damage blast and brief escape protection. That changes when I enter melee and how I get out. |
| **Arc** | Yes. Static Step can stun three targets for 750 ms, buying time to re-angle a pylon link. Base **Overload** feels least distinct immediately afterward because both inputs chain and stun. Show which enemy the next hop or wire will catch as I move. | **Pilgrim Pylon** travels behind my aim and can be outrun. **Live Wire** exchanges Q's chain for a four-second tether that sweeps enemies as I move and can transfer on target death. Forked Overload loses its extra recipients. This pair changes targeting as well as footwork. |

The four matched `review480/builds--v2-full-<rig>-armory-armory-04.png` frames show a piercing line, a defended frost field, a fire trail and a live electrical link. These are different spatial tools. The native clears installed Plow, Harvest, Relay and Pilgrim respectively. The policy gives all eight transforms 150 draft points and breaks ties by offer order. Those runs establish four working builds. They cannot rank the partners for a human. See `src/game/abilities/{catalog,augmentCatalog}.ts` and `play/cryo/source/policy.mjs`.

| Enemy | Read, fairness and contribution |
|---|---|
| **Crawler** | The red back and 320 ms fan work alone. A screen of Crawlers gives the player a reason to penetrate the formation, but repeated small swipes become the main damage source and last-body cleanup adds little. |
| **Stalker** | The revealed room-three lesson and 460 ms committed line make interception fair in isolation. The capsule survives crowding better than the small purple attacker or its recovery. It earns its place by cutting across retreat. Repeated pairs too easily become another contact tax. |
| **Brute** | A broad silhouette and 700 ms swing invite a deliberate sidestep and punish. As an anchor it can protect something worth reaching. Once isolated, repeating that sweep tests little more. |
| **Spitter** | A green sac, moving shot and edge warning support real crossfire. Breaking one sightline changes the fight. The off-screen chevron gives direction more readily than it reveals good cover, and the backup bite repeats a melee question already well represented. |
| **Carrier** | The magenta brood sac is easy to pick out. Its rear position, death children and priority-escort rules complicate kill order. Crown and escort links are harder to read than the body. Its close swipe adds little. |
| **Brute Warden** | Best single exchange. The long locked lane lets me bait a wall, step aside and exploit a 1.5-second stun. The gold stun halo reads at 480, though the torso covers the marine at point blank. Four Warden rooms deserve four different wall-bait setups. |
| **Carrier Matron** | Best target-switch demand. Deal 20 actual damage during the one-second brood commitment, interrupt with qualifying control, or shoot two 30-HP pods before their 2.4-second hatch. Paired purple pods are recognizable in the clean fixture. Their small change of brightness under a pile of fire undersells the deadline. Ordinary Carrier escorts already supply plenty of bodies. |

Enemy judgments use `src/game/enemies/{meleeAttacks,EnemySystem}.ts`, `ENC12-REPORT.md`, `crowds/gallery-crowd-{stalker,spitter,carrier}-communal-atrium.png`, and the Warden, Matron and Stalker phase sequences in `bosses/`. The guardian phases are staged. The reductions test visual hierarchy at a glance, not minimum desktop text size.

## 5. What the campaigns reveal

All five attempts used seed 1729, native desktop inputs and no assistance. Times below are active simulation seconds. Damage is actual armor plus health removed, rounded from deduplicated receipts in `play/<rig>/trace.ndjson` and the terminal report. The final Story receipt contributes the last 13.94. “Other” includes Brute melee/charge and occasional Spitter contact.

| Attempt | Clears | Seconds | Kills | Crawler melee | Stalker melee | Spitter shots | Other | Total taken | V uses |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Breacher, Standard | 20 | 1,120 | 882 | 512.5 | 210.1 | 246.4 | 45.0 | 1,014.0 | 16 |
| Cryo, Standard | 20 | 1,141 | 894 | 1,064.0 | 420.2 | 218.8 | 178.5 | 1,881.5 | 16 |
| Pyro, Standard | 20 | 954 | 868 | 337.5 | 272.8 | 150.4 | 86.0 | 846.7 | 15 |
| Arc, Standard | 20 | 1,226 | 895 | 367.5 | 166.1 | 301.6 | 28.0 | 863.2 | 17 |
| Cryo, Story novice | 11 | 448 | 248 | 294.4 | 141.7 | 65.0 | 0 | 501.1 | 5 |

**Standard is forgiving to an informed player on this seed and still spiky for someone learning. I would keep its hit caps.** The four winners all used V by room 4 and had recovery available over the campaign. Breacher's lowest observed positive HP was about 51. Arc fell below 8 in Infested Workshop. Cryo absorbed 282 damage in Coolant Plant alone, then finished the expedition. Pyro completed 272 active seconds faster than Arc with roughly 40% of outgoing damage from abilities and 18% from status. Arc dealt 52% through weapons. The same green completion mark describes four different fights.

**The percentages answer different questions.** BAL13's twenty seeds per rig yielded 45/80 Standard clears (56.25%). KIT13's later cohort yielded 46/80 (57.5%), split 7/20 Breacher, 13/20 Cryo, 11/20 Pyro and 15/20 Arc. Its Story spread was 18/13/17/9, and Veteran was 2/4/2/0. Gameplay and bot policy changed together. BAL13's own paired native sample cleared four of four versus one of four in simulation, across two modes. Shared visibility math helped, but live animated bounds, camera history and supplied inputs can still diverge. Four correlated final8 clears cannot establish Standard's human win rate or justify raising enemy damage. See `BAL13-REPORT.md` and `KIT13-REPORT.md`.

**Story Cryo is a plausible death, and a poor proxy for a novice's first hour.** Seven Crawler swipes cost 49 in the fatal room. Two lunges cost the remaining 29.34, the last two hits coming about 1.1 seconds apart. The player had already exhausted grenades and medkits. The >20-damage trigger for two seconds of protection against subsequent light contacts never fires on those small Story hits. The novice policy has a 300 ms reaction delay, misses and consumable hesitation, yet already understands visibility, priority targets, relay position, shopping and all four buttons. It neither learns a key nor stops to read a card. Its 448 active seconds locate a dangerous transition. They say little about when a newcomer will reach it.

**Rooms ask different opening questions.** Armory asks where to put a wall between a charge and yourself. Swarm Junction asks whether to interrupt a brood or divert fire to pods, then asks you to defend a relay. At 42–52 seconds the Pyro storyboard visibly changes from sweeping lanes to defending a small area. Overload asks the player to revisit the hold after a pincer and protected brood. Those are real changes of plan. Pressure becomes less varied once the objective is satisfied and bodies remain. Across all five traces, every recorded weapon shot was rifle or shotgun. That exposes a successful narrow policy and leaves the value of the other three weapons open. See `play/pyro/storyboards/swarm-junction-storyboard.png`, `play/arc/storyboards/overload-floor-storyboard.png` and `src/game/waves/{authoredEncounters,EncounterDirector}.ts`.

## 6. What premium competitors still do better

1. **Instantly readable danger under the player's strongest effects.** *Enter the Gungeon* is my benchmark for being able to choose a gap while still watching the target. Containment's floor carries too many equally bright messages.
2. **A satisfying ordinary hit.** *Nuclear Throne* makes the everyday shot carry the fight. Here the rifle exchange is visually slight next to the exceptional pleasure of a full-room Railbreaker.
3. **A first attempt that teaches a transferable skill.** The best *Hades* encounters let the player recognize, avoid and then exploit the same attack. Containment sometimes awards the clear before the learner sees the commitment.
4. **Encounter endings that pay off the opening decision.** Breaking a screen, stunning a guardian or intercepting brood should visibly release pressure and move the room forward. Too often the reward is another sweep for survivors.
5. **A reason to tell a different story about the next run.** The rig decision already does this. A repeated cash detour, fixed destination and automatic upgrade selection do much less for the middle of an expedition.

## 7. Against R12-B

The independent scores were recorded before opening `docs/nextgen/reviews/R12-B-play-verdict.md`. All eight improved. Deltas are editorial judgments on the same ten-point scale.

| Area | R12 → R13 | Change |
|---|---:|---:|
| Core combat | 6.0 → 6.8 | +0.8 |
| Rigs | 7.0 → 7.5 | +0.5 |
| Enemies | 6.0 → 6.8 | +0.8 |
| Feel | 6.0 → 6.3 | +0.3 |
| Builds | 6.0 → 6.7 | +0.7 |
| Onboarding | 5.5 → 6.6 | +1.1 |
| Interface | 7.0 → 7.5 | +0.5 |
| Pacing | 4.5 → 6.2 | +1.7 |

| R12 problem | Status | What changed |
|---|---|---|
| 1. Early small-enemy burst | **Fixed for the cited opening failure** | The 44-damage Standard lunge is capped at 26, Crawlers at 12, heavy damage starts selective anti-chain grace, and the first Stalker is revealed and isolated. The Story death is a different, later attrition failure. |
| 2. Incomplete view of immediate danger | **Partly fixed** | Off-screen Spitter commitments and incoming shots get directional cues. Native Pyro still has overlapping warnings, and the capture reviewer found a hostile footprint behind the action bar in Cryo room 12. |
| 3. Skip the lesson while succeeding | **Partly fixed** | Three graduated solo threats and observed evade/punish hints are substantive. A quick ranged clear still rehearses none of the later footwork. |
| 4. Difficulty calibrated to a different observer | **Partly fixed** | Shared viewport/framing work and healing at ≤55 address specific defects. Paired outcomes still diverge, and there is no fresh-player cohort. |
| 5. Objectives exist mainly in rules | **Partly fixed** | The siege ring, charge sweep, crown/shield, stun halo and bespoke pods now exist on screen. Pod urgency, rejection of control and the safe side of a stunned boss remain difficult in crowds. |
| 6. Same cleanup | **Partly fixed** | Last-three edge markers and reinforcement-cancellation feedback help locate and explain the tail. Ordinary beat completion still requires clearance. |
| 7. Dull buttons and late V | **Fixed as specified** | Flashfire consumes burn, Glacier can be shattered, Static Step chains stun, Ram can crush, and all four native Standard rigs used V in room 4. Discovering those opportunities is the remaining design task. |
| 8. Abstract early decisions | **Partly fixed** | Illustrated cards, diagrams, exclusions and loadout inspection improve the choice itself. The player still makes three decisions before shooting. |
| 9. Late recovery and narrow upgrades | **Partly fixed** | Story gains 35 HP after room 3 and these five runs reached the shop. Only eight transforms support the upgrade service and its target is automatic. |
| 10. Everyday weapon contact | **Untouched as a player-facing weakness** | Directional reactions and collapses are visible. The rifle's ordinary contact still depends heavily on a tracer, a number and a small flinch. |

**Worse or unresolved.** Within KIT13's paired Story cohorts, Arc fell from 13/20 to 9/20 while Pyro rose from 12/20 to 17/20. That is a genuine adverse balance signal. Both Overdrive timing and policy changed, so attributing the loss to Static Step alone would be guesswork. The capture agent also recorded a blank art panel in the first native Cryo ending frame. Other endings showed the art and the blank frame's duration is unknown. Neither finding establishes an across-the-board R12 regression. I read `DEFECTS.md` last.

## 8. The next month, in order

1. **Make one crowded exchange readable end to end.** Start with the native Diagnostic Gallery Pyro frame. Preserve the attack origin, committed edge, marine feet and an escape direction through two overlapping pools. Apply that treatment to Cryo and Arc only after it works in Pyro.
2. **Watch fresh desktop players learn the first three rooms and reach the late ramp.** Ask them to explain their last hit and demonstrate one counter. Change lesson staging and Story's rooms 11–13 from the mistakes they actually make. Keep rig-specific observations separate.
3. **Finish the action and reaction for the two most-used guns.** Pair a combat animator with a designer on rifle/Crawler and shotgun/Brute. Give firing, surviving a hit, dying and resuming movement distinct poses. Check the result in a real pack with damage numbers hidden.
4. **Put rig mastery in the player's hands during combat.** Give each rig one short, playable opportunity after its first transform. Surface Glacier's recast, Pyro's burning target, Breacher's crush alignment and Arc's next link exactly when the input matters.
5. **Rewrite three encounters and one detour around consequences.** Let a broken pincer open a path, a leader kill end a wave, and a successful brood interrupt change the next formation. Offer medicine versus an aimed upgrade at one junction. That would buy more replay value than another enemy family.
