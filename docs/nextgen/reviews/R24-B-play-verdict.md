# R24-B — independent play-and-feel verdict (GPT Astra 6.2, high reasoning, 2026-11-25, gallery final19)

## 1. Scores

| First-hour experience | /10 | Judgment |
|---|---:|---|
| Core combat loop | **7.0** | Stepping past a loaded swing and turning to shoot can buy a second attack, but killing the attacker on approach often pays just as well and teaches less. |
| Ability kits and rig differentiation | **8.0** | Pinning a pursuer against a Bulwark, shattering a Glacier and sweeping a live tether make the same piece of deck worth occupying for different reasons. |
| Enemy design and counterplay | **7.0** | The Stalker’s straight lunge, Spitter’s firing lane and Matron’s brood all invite specific answers, while the two smallest melee families still account for 63% of recorded Standard suit loss. |
| Game feel | **7.0** | The Brute recoiling from a return shot sells the impact, but its buried arm and several targets inside Flashfire disappear before I can read their reaction. |
| Build variety and run depth | **7.5** | A wall can become a road and a turret can become a traveling companion, with a second chance to choose, although all five Standard victories upgraded the first exclusive they installed. |
| Onboarding and clarity | **7.0** | Story’s first plasma strip visibly pays off, yet its novice fired all three of its campaign plasma shots in that one lesson. |
| Interface flow from title to death/results | **8.0** | Wake up, Equip and Retry each identify the next action immediately, while the crowded supply stop can push a defining build decision below the fold. |
| Pacing and difficulty curve | **6.0** | Standard gives away most of four sectors, then lets ordinary contacts spend more suit in one room than a guardian costs across several appearances. |

## 2. Calibration

**Solid commercial indie. The gap to the genre leaders is the player’s ability to choose where the *second* exchange happens.** I can name a good move in Diagnostic Gallery before the pack arrives. Let the Brute commit north of the recorder, cut around its west end and shoot back before the southern Stalker locks. At peak pressure the same marine is against the right partition, with a fan across the feet and bodies between the gun and open floor. The first exchange has a designer’s answer. The later one gives me a good reason to leave and little reason to stop anywhere in particular. I would sell the four rigs on their merits today. I would hold the premium combat claim. [Played Gallery sequence][gallery]

I judged the six recorded desktop runs and their traces at `3bb061f5`. The manifest distinguishes these from the earlier staged presentation studies at `f4f54aa7`. Suit loss includes damage later repaired. Stills and strips support judgments about poses, aim and visibility. Input feel, audible impact and what an unaided first-time player learns require human play. [Gallery manifest][manifest]

## 3. Ten first-hour problems, ranked

1. **The protected escape often goes unused before the lesson happens.** Across five Standard traces the first Gallery Brute never appears in a sampled melee strike phase. Four seed-1729 Atrium runs also show the first Brute only approaching before it disappears. Arc 2718 actually sees an Atrium strike and recovery. A player who shoots effectively can miss the best piece of combat teaching in the room. Move the anchor one committed swing closer, show its arrival at that point, and leave the inside shoulder open through the first return shot. Preserve the kill for a player who earns it early. [Attack scheduling][director] · [Cryo trace][cryoTrace] · [Alternate Arc trace][arcTrace]
2. **Too much late damage comes from a fight the player experiences as the bill for winning the last one.** In Standard Cryo’s Coolant Plant the opening guardian group costs 63 suit. A separate late group containing only small enemies costs another 63. The intervening crossfire costs 43.7, about 34.7 of it after its last non-light enemy disappears. Withdrawing three stragglers cannot remove the next scheduled pincer. Carry a successful crossfire cancellation forward into that pincer by closing one of its two entries. Let the player see the shut grille when they get there. [Cryo trace][cryoTrace] · [Authored room groups][groups]
3. **The opening four sectors give a competent player too little reason to change habits.** Across the five Standard recordings they cost 33.9 suit combined, including 3.9 from Arc’s own blast. Every rig’s cohort median is zero in sectors 2, 3 and 4. Keep Awakening Bay forgiving. In Residential Gallery, let the first Stalker reach a side-on lock while the player still has a clear sidestep and a close-range shot. A clean clear should feel like something the player did. [Sector ledgers][suit] · [PLAY30 cohort][play30]
4. **The busiest pictures explain the current hit better than the next safe step.** In Pyro’s Shielding Gate pressure frame two red lunge lanes meet the marine beside machinery. The danger is legible at 480 pixels. The space where a player could turn and fire is much harder to judge. Offset the second attacker’s shoulder and approach so that the gap is visible before the first lock. Let the room geometry protect that landing for one attack. [Played Shielding Gate][shield]
5. **A reserve cancellation can feel identical to an ordinary kill.** Breacher cancels two arrivals in Coolant and one in Workshop, Pyro cancels four in Coolant, and Arc 2718 cancels three in Workshop. In Breacher’s native Coolant success frame the conspicuous instruction is “Break the Spitter’s line of sight.” The room counter says 21 remaining. Neither tells me what my kill just bought. Show the threatened grille closing, reuse its countdown position for “2 Crawlers cut off,” and keep that result visible through the next shot. [Cancellation receipts][obs] · [Breacher’s actual view][cancel]
6. **The best repeat boss trick hides its payoff.** All six Relay Racks runs break the shutter. In Arc 2718’s final19 impact frame the Warden occupies much of the right half and is easy to find. Its wall-stun caption covers the face, and I cannot pick out the newly vulnerable Spitter. Other angles crop the action further. Move the shutter down the aisle and put the gunner in the revealed sightline. Keep the broken frame on the floor, with its opening wide enough to aim through. [Played impact][shutter] · [All six receipts][obs]
7. **The fourth guardian repeats a decision the player has already passed.** On seed 1729 it is a second Matron in Swarm Junction after the Coolant Matron. The pincer changes the surroundings. The deciding action against the boss is still to interrupt brood or shoot pods. Put one brood clutch across the inside route to the relay and another beside an optional resource. The player can then choose which part of the room survives the hatch. [Arc itinerary][arcReport] · [Pod and crowd studies][bossSheet]
8. **The weapon lesson has a strong reward and weak transfer.** The Story trace records three plasma plate hits and a 15-credit increase at 16.17 seconds, then no more plasma or rocket shots before sector 15. The novice policy explicitly privileges the Passenger Vault lesson, so this establishes one successful demonstration, with human retention still open. Put a second visible plate beside an unarmoured threat in sector 3. Let the player choose the gun, then show the exposed shoulder long enough to reward switching back. [Novice trace][storyTrace] · [Weapon policy][policy]
9. **Friendly effects sometimes obscure the part of the target I need to aim at next.** Flashfire’s core gives the cone a strong direction, but the outer blades merge across surviving bodies. In Whiteout the hostile red fan survives while the texture of the adjacent safe floor washes out. Keep the cast peak. Pull the residual away from the surviving attacker’s striking limb and the floor just beyond the locked shape. [Cast and overlap studies][overlap] · [FX27 treatment][fx]
10. **The supply stop hides an unusually generous offer.** Passing both exclusives earns a free choice at Breached Loading Bay, but the card competes with ammo, medicine and rerolls. The requisition fixture has 1,431 pixels of content inside a 1,022-pixel panel. Give the returning pair a single comparison row above the ordinary stock, with the equipped action and its replacement side by side. [Supply screen][shop] · [Requisition implementation][ui] · [Capture diagnostics][defects]

## 4. Rigs and enemies

| Rig | Fantasy delivered, dullest button and missing decision | Are the exclusives real choices? |
|---|---|---|
| Breacher | **Yes.** Ram a pursuer into the barrier and the player has effectively made a weapon out of the room. Base **F, Bulwark**, is dullest in open space once placed. Give one escort a reason to come around its end. | **Siege Plow** moves the front the player fights behind. **Fault Line** leaves a fixed lane that repeatedly staggers. They reward advancing and holding different ground. |
| Cryo | **Yes.** Choosing when to sacrifice Glacier for shatter is the best ordinary power decision. **V, Whiteout**, asks the least once active. A visible pocket within the storm where I can line up an execution would strengthen it. | **Shard Harvest** makes a frozen kill a source of further hits. **Ice Road** gives up the wall and its shatter for a traversable 1.6× speed lane. The clearest trade in the game. |
| Pyro | **Yes.** Trail, pool and detonation reward drawing pursuers through the same ground. **Shift, Afterburn**, is the least deliberate because an ordinary escape already paints the trail. A split approach would give me a reason to choose which side to ignite. | **Ember Relay** rewards keeping occupied fire zones near fresh targets. **Meltdown Core** trades an eight-second aura for a two-second fuse and a close detonation. They change when I go in. |
| Arc | **Yes.** A planted pylon makes the line between marine and machine worth defending. **Shift, Static Step**, makes its target choice for me. More two-sided approaches would reward moving the link across a second enemy. | **Pilgrim Pylon** follows and can fall behind a dash. **Live Wire** replaces the automatic chain with a tether I must sweep. Both Arc campaigns took and upgraded Pilgrim, leaving Live Wire’s campaign value unmeasured here. |

The catalog describes what each choice removes as well as what it adds. The build and overlap sheets show distinct results at fighting scale. The five guns also have distinct jobs, including precision pistol, sustained rifle fire, close shotgun interruption, plasma for armour and lines, and an armed rocket for a distant group with room to escape its blast. [Augment contracts][aug] · [Rig studies][rigSheet] · [Weapon designs][guns]

| Enemy | Read, fairness and contribution | Where it becomes redundant or unclear |
|---|---|---|
| Crawler | Pink back, low body, short swipe fan. Fair alone and useful for pushing the marine out of a firing stance. | A third Crawler at the feet adds another contact to count without offering a different move. |
| Stalker | The straight capsule makes a lateral step intelligible. A far-side Stalker can punish retreat and reward cutting inward. | The blade and the waiting turn are small beside Shaft machinery. Two capsules can identify two threats while hiding the gap. |
| Brute | The jade body, pale face and raised cleaver identify the anchor. A missed heavy gives the player time to punish it. | The lowered arm merges into the chest. Gold brackets carry much of the recovery read, and a second anchor often repeats the first. |
| Spitter | The firing line gives cover a purpose and makes crossing its aim a fair decision. | A second distant shooter without a new angle repeats the cover check. At melee range the bright marine and muzzle compete for the same space. |
| Carrier | The sac changes target priority because killing a carrier can release children. Its braced limbs distinguish it from the runners. | At fighting scale the quiet side reads as several dark legs. Ordinary Carrier melee contributes less identity than the brood consequence. |
| Brute Warden | The pale ram and locked charge reward baiting a collision. The shutter gives the player a reason to choose a particular wall. | The protected shooter and the exact impact surface are difficult to see together. An ordinary wall stun looks much like the special solution. |
| Carrier Matron | The brood wind-up, interrupt and opening pods create a fair choice between aiming at the mother and redirecting fire to her young. | Once learned, the same pod priority solves the repeat. Where the young will cut off the player matters more than another escort. |

The heavy lineup communicates rank even in silhouette. At 480×270 the smaller families depend more on their ground shapes than on their loaded limbs. Audio design separates five warning and strike pairs, spatial flank calls and guardian phases, with danger ducking the weapons bed. Generic recovery has no dedicated cue. I can assess that coverage from the routing, but the evidence contains no listening session. [Heavy lineup][heavies] · [Loaded attacks][wind] · [Audio design][audio]

## 5. What the campaigns reveal

**Standard is too easy to complete while bypassing some of its best decisions.** It still inflicts substantial damage. Breacher, Cryo, Pyro and Arc on 1729, plus Arc on 2718, all finish in 721–937 game seconds with 561–970 gross suit loss. The wider competent cohort clears 41/48, first death in sector 10. Story novice clears 22/24. Both cohorts have zero stalls. Breacher’s 8/12 against 11/12 for each other rig is a weak basis for tuning. On fresh seeds Breacher clears 23/24 and Arc 22/24. The clear rates describe the bot policies. Human win rates remain unmeasured. [Campaign manifest][manifest] · [Cohort and fresh seeds][play30]

**The middle of the run has a shape the clear rate conceals.** Sectors 1–10 account for 31.6% of pooled cohort loss. Transmission already costs a median 43.1–65.5 across rigs. In recorded Standard Cryo, sectors 13–16 cost 576.2 of 969.7, followed by just 82.2 in sectors 17–20. Arc 1729 instead spends 178.8 in Shielding Gate, and Breacher spends 162.9 in Manual Control. Across all five Standard traces, distinct damage receipts total 3,726.3 suit. Crawlers account for 1,252.1, Stalkers for 1,082.3 and Spitters for 896.5. Repair and replenishment let competent runs absorb repeated mistakes. [Sector ledger][suit] · [Cryo room report][cryoReport]

**A timed dodge sometimes gives real initiative.** In Service Shaft Landing, shoot the first Stalker across its lunge, then turn inward while the far attacker is still approaching. At 525.60 seconds Breacher staggers a Stalker, moves from about (261, 669) to (261, 486) and takes zero damage over the next second. Cryo earns two Stalker staggers two seconds apart in the same room, yet loses 163.8 there overall, including 120.5 to Stalkers. The Gallery recorder also offers a real west-end cutback, and Atrium delays light locks through the heavy’s recovery. These are successful local exchanges. Later packs seldom preserve that certainty. Standard records peaks of two or three melee and one or two ranged wind-ups, 450–550 ms minimum melee-hit spacing per run, and just 42 exposed weapon hits among 13,184 weapon hits. That denominator includes ineligible enemies and shots taken long before a miss. It measures how often the reward enters ordinary play. The conversion rate per opportunity needs a different denominator. [Shaft sequence][shaft] · [Breacher trace][breachTrace] · [Attack and recovery rules][enemy]

**Cleanup differs sharply by room.** In Coolant, the final all-small group costs Arc 1729 37.8 of its 50.4 suit and Breacher 37.8 of 73.5. Cryo takes 151.8 Crawler damage there, including hits while the Matron is alive. Much of what feels like cleanup is a separately authored pincer. In Workshop, Pyro and Arc 2718 lose zero. Cryo’s 55.4 comes from Stalkers with a non-light enemy still present. The Story novice dies while a Carrier and two Brutes are alive. The three-enemy withdrawal genuinely occurs in Diagnostic Gallery, but requires all scheduled arrivals to have entered, and on Standard it applies only to qualifying beats. Whole-room small-enemy damage cannot establish post-kill attrition. These timings come from adjacent 100 ms trace samples and the gaps between groups. [Encounter rules][director] · [Played withdrawal][withdraw] · [Cryo trace][cryoTrace]

**The novice death has a specific cause and a long lead-in.** Story Cryo spends 110.3 suit at Interlock, 84.6 in Coolant and 149.8 in Shaft, then enters Workshop at 12.2 health and zero armour. The room costs 39.2, entirely Crawler contact. At 518.517 seconds it is stationary, aiming at Carrier 1 with 3.9 health, no medkits, a nearly reloaded shotgun and both dash charges ready. At 518.583 the Crawler finishes it. The death card accurately reports the 4-point fatal hit separately from the room’s 39. Its generic single-Crawler diagram cannot show where the player could have broken fixation in this pack. [Live trace][storyTrace] · [Death card][death]

**Some room choices change what happens next.** All five seed-1729 campaigns close Interlock breach 1, while Arc 2718 closes breach 2. All four Standard 1729 itineraries book Warden 6, Warden 9, Matron 13, Matron 16. The fourth guardian differs from the first, but repeats the third guardian’s central question. Arc 2718 instead gets Matron 6, shutter Warden 9 and plated Warden 13. Finally, the covered reactor bend is a defensible choice. Pyro and Arc 2718 both reach the fork with no dash charge and a threatened short lane. Pyro reaches cover in 3.1 seconds for zero loss. Arc takes 7.0 seconds and loses 27.7. Breacher, Cryo and Arc 1729 have a charge and cross near in 0.5–0.7 seconds for zero. The long bend trades time for a break in sight and pursuit. Five different runs establish that both plans work, without establishing which bank would have been cheaper in the same fight. [Bank receipts][obs] · [Alternate Arc trace][arcTrace] · [Pyro trace][pyroTrace]

## 6. What the commercial leaders deliver better

1. **Space the player can read in advance.** In *Enter the Gungeon*, a gap can be as conspicuous as the bullets defining it. Containment’s later Shaft fights often reveal the second lane only after the player has chosen the first dodge.
2. **A reliable turn to attack.** In *Hades*, learning the end of an attack sequence can give a player confidence to start a slower move. The Warden wall stun delivers that here. A missed ordinary swing in a pack seldom does.
3. **Repeated enemies that test a different skill.** The shutter makes a familiar charge into a tool. The second Matron needs an equally strong reason to aim somewhere new.
4. **Consequences visible through the next input.** A broken grille, a wounded shoulder and a survivor stepping out of the flames should tell the player where to aim while the mouse is still moving.
5. **Runs remembered for a decision made in play.** Ice Road and Live Wire could each define a campaign. The strongest payoff currently documented across the five wins is buying an upgrade to the same early choice.

## 7. Against the previous review

The eight scores above were recorded before reading either R23 verdict. Score changes compare independent judgments. The measured changes below identify where the recordings themselves differ. [R23-B verdict][prev] · [R23 team synthesis][team]

| Area | R23 → R24 | Change |
|---|---:|---|
| Core combat | 7.5 → 7.0 | **Regressed 0.5.** I give less credit for a protected opening that the lead enemy rarely lives to use. |
| Rigs | 8.0 → 8.0 | **Same.** Four distinct ways to control a room. |
| Enemy counterplay | 7.5 → 7.0 | **Regressed 0.5.** The shutter adds a good interaction, but the two small melee families still decide too many late fights. |
| Game feel | 7.0 → 7.0 | **Same.** Better loaded poses and reactions, with surviving targets still lost at cast peaks. |
| Build variety | 7.0 → 7.5 | **Improved 0.5.** The free return of a passed pair makes deferral a viable build decision. |
| Onboarding | 7.5 → 7.0 | **Regressed 0.5 in judgment.** The plasma lesson itself improved. I weight the lack of demonstrated transfer and the bypassed heavy rehearsal more heavily. |
| Interface flow | 8.0 → 8.0 | **Same.** Strong launch and retry actions, with the crowded requisition still the weak stop. |
| Pacing | 6.5 → 6.0 | **Regressed 0.5.** Near-free opening sectors and the renewed Shaft spike outweigh shorter tails in some rooms. |

| R23’s ten problems, in original order | Disposition |
|---|---|
| 1. Ordered attacks hide the exit | **Partly fixed.** Gallery’s recorder and Shaft’s first pair give a specific inside turn. Later pressure can close it again. |
| 2. The crowd seldom invites the return shot | **Partly fixed.** The light-lock hold exists and a real Shaft stagger buys movement. Pooled Standard exposed hits fall from 88/12,602 to 42/13,184. |
| 3. Ordinary attrition outweighs the feature | **Partly fixed.** Reserve cancellations and three actual Gallery departures are visible in the records. The separate Coolant pincer can still cost more than the guardian. |
| 4. The final fork cannot justify cover | **Fixed as a choice.** Two live far-bank crossings with spent dashes, including one damage-free crossing, complement three clean near dashes. |
| 5. Repeated Warden wall impacts | **Partly fixed.** The booking cap and breakable shutter change the itinerary and target wall. The gunner reveal remains visually weak, and repeat brood has no equivalent twist. |
| 6. The cast hides the follow-up target | **Partly fixed.** Contacts and hostile outlines survive more often. Flashfire blades and dense Whiteout still hide useful floor and limbs. |
| 7. Waiting lane changes are hard to read | **Partly fixed.** The assigned Stalker turns and plants, with 9–18 feints per Standard run against R23’s 2–9. Its small silhouette still loses to the floor warning. |
| 8. Story rewards ignoring plasma | **Fixed for the first plate.** Three real plasma hits and a paid strip replace zero shots. Follow-through on later plates remains unproved. |
| 9. Exclusive choice comes too early | **Fixed for deferral.** A player can pass the pair and install either for free at the first supply stop. Its placement in the shop still needs work. |
| 10. The hold boundary disappears when moving | **Fixed for the local interaction.** Cryo’s played finale shows an amber near arc alongside the marine and an explicit outside-hold label. [Played hold boundary][hold] |

**What worsened in the recordings.** Standard Cryo’s Shaft cost rises from 70.4 to 163.8, even as its Workshop cost falls from 131.3 to 55.4. Standard cohort clears rise from 36/48 to 41/48 and Story falls from 24/24 to 22/24. Multiple scheduling and policy changes separate the builds. Those shifts warrant attention, but do not isolate a cause or establish a human difficulty rating.

## 8. Five investments for one month, in order

1. **Build three exchanges around where the player can stop and shoot.** Give Residential Gallery one ordinary committed lunge, Diagnostic Gallery one attainable recorder cutback, and a later Shaft pack one clear inward landing. Watch fresh desktop players point to the landing before the attack locks, then see whether they choose to fire from it.
2. **Move late pressure into decisions the player can affect.** Start with Coolant’s final pincer. Carry a killed reserve leader’s consequence into the next entrance. In Workshop, preserve the dangerous mixed flank and make the Brute controlling its reserve unmistakable.
3. **Give each repeat guardian a room-specific outcome.** Restage the Relay shutter so one camera view contains ram, broken panel and exposed gunner. Give the second Matron a pod whose survival alters access to the relay. Reuse the existing bosses.
4. **Make the next target survive the player’s own spectacle.** Work at fighting scale on the recovering Brute arm, the waiting Stalker’s shoulder and the first survivor of Flashfire or Whiteout. Listen under sustained rifle fire for warning, release and successful punish as separate events.
5. **Take one build choice from trial to payoff.** Surface the free deferred pair at the supply stop, let the player try one action, then give the next room an optional objective a moving Bulwark, traversable Glacier, ignition chain or swept tether can solve differently.

[manifest]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/MANIFEST.md
[gallery]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/play28/cryo-diagnostic-gallery-storyboard.png
[suit]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/play28/suit-loss.md
[play30]: /Users/chernodub/.t3/worktrees/containment-game/t3-caf9da89-9fba86dc174e1b32/docs/nextgen/PLAY28-REPORT.md
[director]: /Users/chernodub/.t3/worktrees/containment-game/t3-caf9da89-9fba86dc174e1b32/src/game/waves/EncounterDirector.ts
[groups]: /Users/chernodub/.t3/worktrees/containment-game/t3-caf9da89-9fba86dc174e1b32/src/game/waves/authoredEncounters.ts
[enemy]: /Users/chernodub/.t3/worktrees/containment-game/t3-caf9da89-9fba86dc174e1b32/src/game/enemies/EnemySystem.ts
[breachTrace]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/play/breacher/trace.ndjson
[cryoTrace]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/play/cryo/trace.ndjson
[arcTrace]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/play/arc-2718/trace.ndjson
[pyroTrace]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/play/pyro/trace.ndjson
[storyTrace]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/play/story-cryo/trace.ndjson
[cryoReport]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/play/cryo/report.json
[arcReport]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/play/arc/report.json
[shield]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/native-heavy/pyro-pressure-1.png
[obs]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/play28/observations.json
[cancel]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/play28/breacher-coolant-plant-reserve-canceled-1.png
[shutter]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/play28/arc-2718-relay-racks-shutter-break.png
[bossSheet]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/review-sheets/frames-15.png
[policy]: /Users/chernodub/.t3/worktrees/containment-game/t3-caf9da89-9fba86dc174e1b32/scripts/nextgen/playtest/policy.mjs
[overlap]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/review-sheets/frames-14.png
[fx]: /Users/chernodub/.t3/worktrees/containment-game/t3-caf9da89-9fba86dc174e1b32/docs/nextgen/FX26-REPORT.md
[shop]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/screen-extra/play21-supply-failure.png
[ui]: /Users/chernodub/.t3/worktrees/containment-game/t3-caf9da89-9fba86dc174e1b32/src/ui/screens/templates.ts
[defects]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/DEFECTS.md
[aug]: /Users/chernodub/.t3/worktrees/containment-game/t3-caf9da89-9fba86dc174e1b32/src/game/abilities/augmentCatalog.ts
[rigSheet]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/review-sheets/frames-13.png
[guns]: /Users/chernodub/.t3/worktrees/containment-game/t3-caf9da89-9fba86dc174e1b32/docs/nextgen/WEAPONS15-REPORT.md
[heavies]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/heavies.png
[wind]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/review-sheets/frames-09.png
[audio]: /Users/chernodub/.t3/worktrees/containment-game/t3-caf9da89-9fba86dc174e1b32/docs/nextgen/AUDIO18-REPORT.md
[shaft]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/play28/cryo-service-shaft-landing-storyboard.png
[withdraw]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/play28/arc-2718-diagnostic-gallery-late-withdrawal.png
[death]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/play/story-cryo/terminal-dead.png
[prev]: /Users/chernodub/.t3/projects/containment-game/docs/nextgen/reviews/R23-B-play-verdict.md
[team]: /Users/chernodub/.t3/worktrees/containment-game/t3-caf9da89-9fba86dc174e1b32/docs/nextgen/reviews/R23-verdict.md
[hold]: /Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final19/play/cryo/r20-overload-floor-pressure.png
