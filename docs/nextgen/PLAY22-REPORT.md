# PLAY22 play pass

Baseline source is `0b97db74`. The independent R18 review reported 37 Standard clears out of 48, with Breacher 7, Cryo 10, Pyro 11 and Arc 9.

## Player changes

1. The Brute in Passenger Vault waits in a clear lane, with the briefing beside its plate. Pressing 4 selects plasma. Stripping the plate with a real hit exposes the shell and staggers the Brute for 1.1 seconds. Normal encounter cleanup waits out the staged hold and the follow-up opening. The lesson can return at a later plate if the player skips this one.
2. Rifle rounds spark and apply 42 percent of their usual damage to intact plate. The competent policy gives the visible plasma lesson priority. In ordinary fights, a clear new plated contact gets a short firing opportunity before the bot spends an offensive ability. It resumes its ordinary weapon selection once the plate is gone.
3. On its first charge, a Warden looks for a legal line with a nearby impact wall. The spawn warning marks the staged position. The first charge waits until the Warden is within 240 world units of the marine and prefers a lane with an impact point within 320 units. If there is no qualifying lane, the Warden can use a normal first aim after closing to 200 units. Later charges use the ordinary rules.
4. The death card records an ability actually ready during the final second and shows it alongside the fatal attack. The first self-blast draws a one-second line from the marine toward the escape edge. The supply stop displays the booked guardian's studio silhouette at the heading.
5. Interrupting a brood traces back from the folding pods to the parent. Breaking an escort links the lead target to the first reacting escort, with a directional pulse by the marine when the action is distant or outside the fighting view.
6. A floor control in Safety-interlock Station closes the selected shutter while the other approach stays open. Each control points toward its own shutter. On Overload Floor, the first bank charges for eight seconds and fails. The player crosses to a backup and holds it for the remaining four seconds while the encounter continues. Seeded variation chooses between the other two opening beats and leaves the crossing as the closing combat beat.

## Plate arithmetic

These are clean body hits at base weapon damage, before build modifiers and outside damage. The Passenger Vault Brute has approximately 164 plate. The Warden guardian has 120.

| Plate | Baseline rifle hits | PLAY22 rifle hits | Plasma hits in either build |
| --- | ---: | ---: | ---: |
| Passenger Vault Brute | 11 | 25 | 3 |
| Plate-breaker Warden | 8 | 18 | 2 |

A rifle hit applies 16 damage to an unplated body and up to 6.72 to plate. A plasma bolt deals 80 to plate. At 9 rifle shots per second and 3.2 plasma bolts per second, the first-to-last shot span is approximately 2.67 seconds versus 0.63 seconds on the Brute and 1.89 seconds versus 0.31 seconds on the Warden. Projectile travel, heat and missed shots add to the time in play.

## Verification

The cohort seeds are `7,11,23,99,256,512,1024,2025,4096,6561,9001,65537`. Standard uses the competent policy. Story uses novice. The before cohorts pin both the simulation and policy to `0b97db74` so weapon-policy changes do not enter the baseline.

### Standard competent cohorts

| Rig | Supplied reference | Pinned baseline rerun | PLAY22 |
| --- | ---: | ---: | ---: |
| Breacher | 7/12 | 8/12 | 8/12 |
| Cryo | 10/12 | 11/12 | 10/12 |
| Pyro | 11/12 | 10/12 | 10/12 |
| Arc | 9/12 | 12/12 | 9/12 |
| Total | 37/48 | 41/48 | 37/48 |

The pinned rerun and the supplied reference gave different totals. The baseline reruns are in `artifacts/nextgen/playtest/play22-before-{breacher,cryo,pyro,arc}/summary.json`. The new result is within the requested range of 32–40 clears and all four rigs reached six clears. The after summaries are in `artifacts/nextgen/playtest/play22-warden-{breacher,cryo,pyro,arc}/summary.json`. Story novice cleared 21/24, with Cryo at 11/12 and Breacher at 10/12. Its summary is in `artifacts/nextgen/playtest/play22-warden-story/summary.json`.

Among completed Standard campaigns, mean suit losses in sectors 18, 19 and 20 were 33.7, 58.7 and 70.4 before and 25.7, 70.0 and 80.1 after. The corresponding medians were 29.2, 53.7 and 60.0 before and 20.1, 54.2 and 72.0 after.

### Desktop captures

Production TypeScript and Vite builds passed. The capture gallery at `artifacts/nextgen/play22-final-evidence/index.html` contains five frames and reported zero failures.

- `play22-plate-passenger-vault.png` shows the opening firing lane and key-4 prompt.
- `play22-plate-break-passenger-vault.png` shows the result of three ordinary plasma bolts through the firing lane.
- `play22-gate-safety-interlock-station.png` shows the two walk-over shutter controls. The updated arrows are captured at `artifacts/nextgen/play22-gate-arrows/play22-gate-safety-interlock-station.png`.
- `play22-crossing-overload-floor.png` shows the failed bank and one backup from the marine's viewpoint.
- `play22-death.png` shows “Dash was ready” beside the fatal Stalker lunge.

The real grenade-splash fixture in `artifacts/nextgen/play22-blast-edge/play21-self-blast-passenger-vault.png` uses the production renderer with the escape-edge receipt connected. The Warden portrait beside the purchase heading is visible in `artifacts/nextgen/play22-supply-art/play21-supply.png`.

### Warden staging check

Before the final staging correction, the Arc 2718 Relay Racks trace recorded the first warning about 12.8 metres from the marine with the Warden outside the fighting view. The corrected Arc run's first Relay Racks warning begins at 4.4 metres with the Warden visible. The new Cryo 1729 Armory snapshot shows a real wall stun with 1.15 seconds remaining, 5.97 metres from the marine. The Warden's projected centre was (460, 722) on the 1920×1080 frame. That receipt is in `artifacts/nextgen/playtest/play22-native-warden-cryo/r6-armory-mid.json`.

### Native plasma use

Both native bots fired three plasma bolts in Passenger Vault and all three struck the Brute's plate. Arc fired 18 rifle rounds in the same room and Cryo fired 22, with zero rifle plate contacts for either. The independent R18 campaigns recorded zero plasma shots in that room.

Arc 2718 fired six plasma bolts and 171 rifle rounds in Coolant Plant. The Warden itself took two plasma contacts on its plate, and the room registered zero rifle plate contacts. The R18 Arc 2718 trace had one plasma bolt and 166 rifle rounds in the room.

### Native campaign outcomes

Arc 2718 cleared 16 sectors and died in Shielding Gate. The runner logged zero errors and flagged two room loads above five seconds. Its report and trace are in `artifacts/nextgen/playtest/play22-native-warden-arc/`. Cryo 1729 cleared all 20 sectors with zero errors or runner diagnostics. Cryo lost 154 combined suit points on Overload Floor after losses of 9.2 and 42.5 in the two preceding sectors. Its report and trace are in `artifacts/nextgen/playtest/play22-native-warden-cryo/`. The native campaigns ran the measured simulation and policy. The shutter arrows were verified in a separate capture after that presentation change.

### Shots by plated sector

Shot counts include all rounds fired in the sector. Plate contacts count actual weapon hits on armour. Target coverage checks the distinct enemy IDs with armour-hit receipts. A target counts as served when a plasma bolt hit its armour or when the immediately preceding native input aimed an observed plasma shot at it.

#### Arc 2718


| Sector | Plasma shots | Rifle shots | Plasma plate contacts | Rifle plate contacts | Plated targets served |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 · Awakening bay | 1 | 7 | 1 | 0 | 1/1 |
| 2 · Passenger vault | 3 | 18 | 3 | 0 | 1/1 |
| 3 · Residential gallery | 4 | 0 | 3 | 0 | 2/2 |
| 4 · Communal atrium | 5 | 14 | 4 | 0 | 2/2 |
| 5 · Crew checkpoint | 8 | 51 | 8 | 1 | 4/4 |
| 6 · Armory | 8 | 59 | 5 | 0 | 3/3 |
| 7 · Freight hold | 3 | 19 | 4 | 0 | 2/2 |
| 8 · Breached loading bay | 3 | 79 | 5 | 0 | 2/2 |
| 9 · Relay racks | 7 | 86 | 7 | 0 | 3/3 |
| 10 · Transmission chamber | 6 | 112 | 12 | 2 | 4/4 |
| 11 · Diagnostic gallery | 14 | 173 | 10 | 0 | 6/6 |
| 12 · Safety interlock station | 6 | 190 | 10 | 0 | 5/5 |
| 13 · Coolant plant | 6 | 171 | 7 | 0 | 4/4 |
| 14 · Service shaft landing | 5 | 154 | 8 | 0 | 3/3 |
| 15 · Infested workshop | 6 | 111 | 9 | 0 | 4/4 |
| 16 · Swarm junction | 13 | 149 | 13 | 0 | 6/6 |
| 17 · Shielding gate | 9 | 137 | 12 | 0 | 6/6 |

Plasma fired at or hit 58 of 58 targets with armour receipts and landed on the plate of 57.

#### Cryo 1729


| Sector | Plasma shots | Rifle shots | Plasma plate contacts | Rifle plate contacts | Plated targets served |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 · Awakening bay | 1 | 17 | 1 | 0 | 1/1 |
| 2 · Passenger vault | 3 | 22 | 3 | 0 | 1/1 |
| 4 · Communal atrium | 4 | 21 | 3 | 0 | 2/2 |
| 5 · Crew checkpoint | 6 | 84 | 11 | 0 | 4/4 |
| 6 · Armory | 6 | 29 | 5 | 0 | 3/3 |
| 7 · Freight hold | 3 | 26 | 4 | 0 | 2/2 |
| 8 · Breached loading bay | 3 | 55 | 4 | 0 | 2/2 |
| 9 · Relay racks | 8 | 55 | 10 | 0 | 5/5 |
| 10 · Transmission chamber | 11 | 108 | 9 | 0 | 3/3 |
| 11 · Diagnostic gallery | 10 | 126 | 12 | 1 | 5/6 |
| 12 · Safety interlock station | 9 | 51 | 13 | 0 | 6/6 |
| 13 · Coolant plant | 4 | 125 | 6 | 0 | 3/3 |
| 14 · Service shaft landing | 6 | 76 | 9 | 0 | 3/3 |
| 15 · Infested workshop | 7 | 70 | 10 | 0 | 5/5 |
| 16 · Swarm junction | 23 | 186 | 25 | 2 | 10/10 |
| 17 · Shielding gate | 12 | 81 | 13 | 1 | 6/6 |
| 18 · Containment annulus | 6 | 32 | 8 | 0 | 3/3 |
| 19 · Manual control chamber | 11 | 118 | 13 | 3 | 8/9 |
| 20 · Overload floor | 12 | 85 | 11 | 3 | 5/6 |

Plasma fired at or hit 77 of 80 targets with armour receipts and landed on the plate of 77.


## What still needs work

Cryo had three plated targets with no confirmed plasma shot or hit. At least one took a stray rifle hit before it was in view. The plate strip, self-blast exit marker and escort reaction are brief. The second relay backup can sit outside the fighting view when the first bank fails. The staged screenshots and native bot runs establish the mechanics and visibility at specific moments. How often new players notice and act on these cues still needs human play.
