# I14 integration follow-up

## 1. Carrier Matron collision

The native radius grew from 33.6 to 46 units (1.44 m). Pod centers now search the 60.8–80 unit annulus (1.9–2.5 m), starting at its midpoint. Admission still uses the current enemies' radii and the authored room geometry to reject overlaps. Navigation and ability contacts already read the native radius. Direct projectiles previously used the elite Carrier’s separate 38.3-unit shot radius. Projectiles fired at the Matron now use 46 units too. The melee shape multiplier and brood interruption thresholds retain their ENC14 values.

The native Relay Racks and Swarm Junction fixtures each recorded calm, brood, pod countdown, opening and hatch with zero runner errors. The overlay follows the grounded thorax and sac base. The first two pods in each room had about 10.4 units of combined-radius clearance at admission in the overlay capture. The Swarm fixture also admits the authored Matron, so the four-pod opening image includes two broods. [Matron capture receipts](../../artifacts/nextgen/i14/matron/manifest.json)

A staged render-free run entered the authored Swarm encounter both directly and with the fourth Warden-cache beat. In both variants the Matron emerged on legal floor at (336, 780) and moved 89.5 units from that point. A 20-damage hit canceled the brood and produced a 1,800 ms stun. On a separate run, destroying both pods produced the same stun. Both variants entered wind-up, strike and recovery with the 98-unit melee cone. The pod centers sampled after the interrupted brood were legal, with 6.9 and 8.3 units of clearance to the Matron and pod radii. A staged rifle projectile 43 units off center hit in both variants, and a projectile 48 units off center passed.

## 2. Elite footprint fit

The five elite skins now use the base family's idle footprint scale, multiplied by its authored elite rank scale. An oversized blade can extend past the body without shrinking the body. This removes the roughly 15% horizontal penalty BOSS14 reported for the Stalker. Five Crew Checkpoint captures passed and were reviewed with native pixel crops and at 480×270. The Stalker hook remains a small read at 480×270. [Elite captures](../../artifacts/nextgen/i14-elites/index.html)

## 3. Boss motion

The native Relay Racks capture observed Warden wind-up, charge, wall-stun and recovery, and Matron brood, opening, hatch and death. In the sampled poses, the Warden crown cleared the head and the Matron sac remained attached through hatch and collapse. The sampled phases used the shipping authored clips. The fixtures record the first frame of each phase and use a stationary invulnerable marine. [Boss motion receipts](../../artifacts/nextgen/i14/boss-motion/manifest.json)

## 4. Story rooms 13–14

The seed-1729 Story probe showed Cryo taking 119 Crawler damage in Coolant Plant and 43.1 Crawler plus 33.1 Stalker damage in Service Shaft Landing. Breacher's Shaft damage was 29.4 from those same two families. The Shaft opens with a Brute and repeated Stalker flanks, then admits both pincer arms within one spawn schedule. Coolant Plant stacks a large Crawler screen in three consecutive beats.

Story now has fewer Crawler admissions in both rooms and interruptible delayed Stalker arms. The Shaft opener loses one Stalker and gains 1.5 seconds of lull. Coolant gains a 1.5-second lull after its Warden beat. Standard receives one added Crawler in the finale siege. These changes use authored group counts and timing.

The final rerun used the 20 ENC14/KIT13 seeds per rig with the novice Story and competent Standard policies, including the projectile correction in both modes. Before columns use the ENC14 report. The two incomplete Story attempts were Cryo seed 137 in Crew Checkpoint and Arc seed 101 in Freight Hold. Both stalls reproduced on the untouched I14 starting revision with clear targets outside the bot’s viewport. That revision also reproduced the Standard Breacher seed-1729 death in Transmission Chamber.

| Story rig | ENC14 clears / 20 | I14 clears / 20 | I14 deaths | I14 stalls |
| --- | ---: | ---: | ---: | ---: |
| Breacher | 19 | 17 | 3 | 0 |
| Cryo | 16 | 14 | 5 | 1 |
| Pyro | 17 | 18 | 2 | 0 |
| Arc | 15 | 13 | 6 | 1 |
| Total | 67 / 80 | 62 / 80 | 16 | 2 |

| Story room | ENC14 mean damage | I14 entrants | I14 mean damage |
| --- | ---: | ---: | ---: |
| 11 | 42.9 | 76 | 43.6 |
| 12 | 42.3 | 74 | 38.9 |
| 13 | 100.8 | 74 | 61.5 |
| 14 | 105.7 | 74 | 71.7 |

Room 14 accounted for 3 of 16 I14 deaths (19%), down from 7 of 13 (54%). Rooms 14, 15 and 17 tied for the highest share at 19% each. The I14 mean damage steps from room 12 were +58% and +84%, above the roughly +50% target. Cryo and Arc missed the 15-clear target. Stalkers and Crawlers still accounted for 31.6 and 27.7 mean damage in room 14. [ENC14 baseline](ENC14-REPORT.md) · [I14 Story simulation](../../artifacts/nextgen/playtest/i14-story-final/summary.json)

| Standard rig | ENC14 clears / 20 | I14 clears / 20 | I14 deaths |
| --- | ---: | ---: | ---: |
| Breacher | 11 | 14 | 6 |
| Cryo | 16 | 13 | 7 |
| Pyro | 14 | 12 | 8 |
| Arc | 16 | 13 | 7 |
| Total | 57 / 80 | 52 / 80 | 28 |

| Standard room | ENC14 mean damage | I14 entrants | I14 mean damage |
| --- | ---: | ---: | ---: |
| 11 | 59.3 | 74 | 61.0 |
| 12 | 55.5 | 71 | 52.1 |
| 13 | 101.2 | 70 | 100.5 |
| 14 | 101.3 | 68 | 106.6 |

Every Standard rig reached the 9–15 clear band. Six Standard deaths were in room 14, with zero Pyro deaths in that room. The before comparison is historical. The one-Crawler nudge is confined to the finale and cannot explain changed outcomes in earlier rooms. [I14 Standard simulation](../../artifacts/nextgen/playtest/i14-standard-final/summary.json)

## 5. High draw budget

The audit found repeated rims, guards, contacts and heatsink fins in the Safety-interlock Station equipment. The recorder, disconnected AI and battery now use the existing rigid batcher within their own groups. The batching retains original transforms, materials, render flags and collider-source parts.

The scan stages 25 legal actors and the full Arc kit. Every scanned room came in at or below 330; both scans recorded zero combat program creation. These inventory counts sample a short scripted sequence.

| Room | Before | After |
| --- | ---: | ---: |
| Awakening Bay | 171 | 171 |
| Passenger Vault | 145 | 145 |
| Residential Gallery | 144 | 144 |
| Communal Atrium | 175 | 175 |
| Crew Checkpoint | 150 | 150 |
| Armory | 208 | 208 |
| Freight Hold | 148 | 148 |
| Breached Loading Bay | 156 | 156 |
| Relay Racks | 155 | 155 |
| Transmission Chamber | 143 | 143 |
| Diagnostic Gallery | 146 | 146 |
| Safety-interlock Station | 310 | 289 |
| Coolant Plant | 154 | 154 |
| Service Shaft Landing | 154 | 154 |
| Infested Workshop | 173 | 173 |
| Swarm Junction | 131 | 131 |
| Shielding Gate | 206 | 206 |
| Containment Annulus | 163 | 163 |
| Manual-control Chamber | 187 | 187 |
| Overload Floor | 153 | 153 |

The longer Safety-interlock High Arc audit went from 343 to 293 peak draws at a median 25 actors, with zero combat compiles in either run. Cold and warm preparation were 1.626/1.282 s before and 1.706/1.207 s after. The two realtime runs advanced 17.0 and 18.0 simulation seconds, so their peaks are observed workload samples. The historical 349-draw replay used Pyro. [Before scan](../../artifacts/nextgen/i14-draws/room-ranking.json) · [After scan](../../artifacts/nextgen/i14-draws-after/room-ranking.json) · [Before audit](../../artifacts/nextgen/i14-draw-audit/benchmark.json) · [After audit](../../artifacts/nextgen/i14-draw-audit-after/benchmark.json)

## 6. Texture packer

The packer reads current optimized PNG-image inputs directly and skips already packed KTX2 inputs. It compares generated bytes before replacing a shipping file and prints each rewritten path. The in-place run skipped 11 packed models, rewrote zero shipping files and left the model and Basis asset trees clean.

## 7. Whole-game verification

The baseline and final production builds passed. Native campaigns use seed 1729, the ordinary game and native desktop inputs, with fast rendering enabled. Outcome and defect counts are tracked in the campaign receipts.

| Rig and difficulty | Result | Rooms cleared | Runner errors | Runner defects | Longest room hold |
| --- | --- | ---: | ---: | ---: | ---: |
| Cryo · Story | Complete | 20 | 0 | 0 | 1.706 s |
| Breacher · Standard | Died in Coolant Plant | 12 | 0 | 0 | 1.999 s |
| Pyro · Standard | Complete | 20 | 0 | 0 | 2.620 s |
| Arc · Standard | Complete | 20 | 0 | 0 | 2.315 s |

Breacher died in combat and the room-limit runner returned status 1. The report records an ordinary death. Arc ran on the build with the final 46-unit projectile check and cleared Swarm. The first three runners loaded the preceding build, which already had the 46-unit movement collider. Breacher’s run ended before the affected encounter. [Cryo](../../artifacts/nextgen/playtest/i14-native-cryo/report.json) · [Breacher](../../artifacts/nextgen/playtest/i14-native-breacher/report.json) · [Pyro](../../artifacts/nextgen/playtest/i14-native-pyro/report.json) · [Arc](../../artifacts/nextgen/playtest/i14-native-arc/report.json)

I opened three entry, combat and clear sheets taken from the Cryo Story campaign. The sampled rooms showed intact models and materials, ordinary HUD transitions, and visible hostile warning shapes in Swarm. No sampled actor appeared embedded in debris. The Cryo ground effect crosses the Matron warning and reduces its contrast in the Swarm combat frame. Friendly effect priority is tracked by FX14. [Safety-interlock Station](../../artifacts/nextgen/playtest/i14-native-cryo/r12-safety-interlock-station-storyboard.png) · [Service Shaft Landing](../../artifacts/nextgen/playtest/i14-native-cryo/r14-service-shaft-landing-storyboard.png) · [Swarm Junction](../../artifacts/nextgen/playtest/i14-native-cryo/r16-swarm-junction-storyboard.png)

Cryo and Pyro replayed rooms 16–20 on the corrected projectile build through Continue from their earned room-15 clears. Both finished the campaign with zero errors and zero defects. The initial Cryo continuation stopped before combat because the playtest reconstruction omitted difficulty and loaded the Story run as Standard. The runner now preserves recorded difficulty, with the existing default available for historical evidence that lacks the field. The retry continued as Story. [Cryo initial continuation](../../artifacts/nextgen/playtest/i14-final-native-cryo/report.json) · [Cryo retry](../../artifacts/nextgen/playtest/i14-final-native-cryo-retry/report.json) · [Pyro continuation](../../artifacts/nextgen/playtest/i14-final-native-pyro/report.json)

## 8. Open items

- Story still exceeds the room 13–14 damage-step target. Cryo and Arc fall short of the Story clear-rate target. The two pre-existing off-screen bot stalls remain reproducible.
- The corrected-build Cryo continuation held 3.048 s at Shielding Gate under heavy host contention. The four full campaigns and the measured Safety-interlock preparations were below 3 s.
- The Swarm storyboard shows the remaining friendly-effect overlap with the Matron warning. That work is tracked by FX14.
