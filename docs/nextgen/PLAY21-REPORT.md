# PLAY21

## Changes in play

1. Weapon prompts record an opportunity for the current room. A plasma hit that strips a plate or an armed rocket that damages two targets records completion for the run. A missed lesson can appear again in a later room, and existing completion flags remain valid.
2. Rockets and grenades record damage to the marine as **Your own blast**. The first accepted self-hit shows how far inside the blast radius the marine stood. The death card names the fatal source and the expedition statistics show total suit loss from self-blast. Rockets retain their 72-point maximum before difficulty and defenses. Grenades use a 36-point maximum.
3. The director prevents two same-beat Stalkers tagged as flankers from beginning lunges across headings more than 45 degrees apart while the first is winding up or striking. A flanker can enter as the first recovers. Crawler swipes retain their existing admission.
4. Escorts from the Warden's beat within 150 units of the Warden wait to start a new attack during the first 800 ms of a wall stun. An attack that already committed can still land.
5. Transmission opens with a Spitter that aims one live volley into the receiver. The rest of the opening wave arrives after the volley window. The receiver uses the existing room geometry and projectile collision, and the Spitter resumes regular attacks.
6. Breached Loading Bay shows the Coolant Plant appointment beside a one-stock, 45-credit purchase. Plate-breaker offers 24 plasma cells and Brood offers one rocket when there is carry capacity. Rig select leads with one play example and diagram. The keyboard-accessible Inspect disclosure expands the four-slot diagrams.
7. Two authored Stalker slots move from Manual-control Chamber's ordinary flank to Overload Floor's relay fight. Annulus retains its own resource risk and both later sectors retain their existing objectives.

## Measurement

Baseline source is `064f0acd`. Standard competent uses seeds 7, 11, 23, 99, 256, 512, 1024, 2025, 4096, 6561, 9001 and 65537, with a separate command per rig and three workers. Late-sector losses are measured as health plus armor removed. The room-by-room comparison uses completed campaigns so every campaign in the comparison contributes a receipt for each of sectors 18–20.

The clean baseline rerun on the requested commit cleared 36/48, with 9/12 on each rig. The supplied reference was 37/48. In the 36 baseline clears, mean suit losses for sectors 18–20 were 28.1, 71.3 and 51.4. The corresponding medians were 20.1, 73.1 and 44.2. Baseline summaries are under `artifacts/nextgen/playtest/play21-before-{breacher,cryo,pyro,arc}`.

The final Standard cohort cleared **35/48**, within the requested 32–40 range. Breacher cleared 9/12, Cryo 10/12, Pyro 6/12 and Arc 10/12. Raw summaries are under `artifacts/nextgen/playtest/play21-after-{breacher,cryo,pyro,arc}`.

| Sector | Baseline mean loss | After mean loss | Baseline median | After median |
| --- | ---: | ---: | ---: | ---: |
| 18 · Containment Annulus | 28.1 | 27.3 | 20.1 | 22.1 |
| 19 · Manual-control Chamber | 71.3 | 63.9 | 73.1 | 62.0 |
| 20 · Overload Floor | 51.4 | 75.6 | 44.2 | 72.0 |

Including all campaigns that reached each room, the baseline means were 28.3, 68.8 and 51.4, and the final means were 31.3, 62.7 and 75.6. Both comparisons put the highest suit loss in the finale after the change.

Story novice cleared 23/24 with the same seeds and three workers. Cryo cleared 11/12 and Breacher cleared 12/12. The run summary is under `artifacts/nextgen/playtest/play21-story-novice`.

## Visual receipts

The desktop batch `artifacts/nextgen/play21-final-visuals` contains `play21-supply.png`, `rig-select.png` and `play21-self-blast-passenger-vault.png`. They were reviewed at 1920×1080 and 480×270. The blast fixture uses a real grenade against room geometry and shows the first accepted self-hit while the marine is inside the blast.

## Remaining weaknesses

Pyro's Standard clears fell from nine to six even as the overall cohort stayed within range. All 35 Standard runs that reached Overload Floor in the after cohort cleared it, despite the higher suit loss there. The weapon receipts show what the combat system accepts. Human uptake of either lesson remains unmeasured.

The existing High benchmark recorded zero new combat shader compiles in Manual-control Chamber and Overload Floor. Its Overload sample fell below the fixture's sustained-population threshold, so the benchmark exited nonzero. An isolated Overload retry with one native campaign still running hit the same population check. The diagnostic data is in `artifacts/nextgen/play21-late-bench/benchmark.json` and `artifacts/nextgen/play21-overload-bench-retry/benchmark.json`.

## Native combat observations

Both native saves began with neither weapon lesson completed. Arc completed the rocket lesson in sector 3 and the plasma lesson in sector 6. Breacher completed plasma in sector 3 and rockets in sector 5. The opening Spitter volley hit the Transmission receiver before the next arrival in both traces. The impacts are about 2.35 seconds after entry for Arc and 2.05 seconds for Breacher.

The native campaign logs and screenshots are under `artifacts/nextgen/playtest/play21-native-arc` and `artifacts/nextgen/playtest/play21-native-breacher`.

Arc 2718 cleared all 20 sectors with zero run errors. Three room-load diagnostics exceeded five seconds, so the runner returned exit code 1. Its suit loss in sectors 18–20 was 0, 40 and 70.9. In Manual-control Chamber, the two overlapping Stalker warnings started from headings 2.47 and 2.44 radians. That is a same-side overlap, which the director still allows. The competent Breacher attempt on seed 1729 died in sector 13 with zero run errors and 119 suit points attributed to Crawler swipes there. The fresh expert-profile retry used the same Standard difficulty and native controls. It cleared all 20 sectors with zero run errors and one loading diagnostic at Manual-control Chamber, which made the runner return exit code 1. Its losses in sectors 18–20 were 10.1, 20.5 and 46.0. The two Manual-control Stalker warnings started 2.31 seconds apart. The retry is under `artifacts/nextgen/playtest/play21-native-breacher-expert`.

The final `npm run build` passed.
