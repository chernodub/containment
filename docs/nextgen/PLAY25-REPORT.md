# PLAY25

Baseline is `f4212bf2`. Standard competent cleared 38 of 48 and Story novice cleared 23 of 24. No actor model files changed. The model file manifest content digest is `6c5430fdc045e81ea4eb605852003b367c434c49ada35ae61a3129f1f1a9a7e0`.

## Combat order and decisions

Melee wind-ups reserve space after earlier wind-ups. The enemy system separates strike starts by at least 450 ms on its simulation clock. Later attackers keep tracking until the earlier wind-up has struck, including cases where their lanes cross. This deliberately delays all later locks rather than predicting the player's escape direction. Crawlers retain their half-token cost. Snapshots expose the wind-up order.

The existing warning batch fills the first melee shape and keeps the first attacker's bright limb edge. It outlines queued shapes instead. The existing actor-outline pass highlights only the next melee attacker and still highlights ranged commitments. The final 300 ms of an off-view Spitter warning extends the stroke toward its locked target.

Brutes use the shared 1.3 family scale for the model and collider, and elites apply the usual elite multiplier. The authored strike range and width remain in use, with the attack origin and engagement distance advancing for the larger body. The Warden retains its larger guardian radius.

A clearance probe across the twenty room layouts found legal spawn circles in pockets that the larger elite body could not navigate out of. The authored schedule can select those breaches in Communal Atrium, Infested Workshop and Containment Annulus. Story-format elite Brute arrivals now require a connected route at their own clearance. A request that cannot fit a connected candidate retries through the room's existing alternate-breach rule.

At the last bank failure, the floor marks both paths and a Spitter pair is staged across the exposed crossing. Both pads are visible during the decision. The hold ring and countdown appear at the chosen bank. The exposed path in the capture is 292 world units. The covered path is about 789, adding 2.3 seconds at walk speed. A bot below half health aims for the covered bank.

In Passenger Vault, intact armour takes 42% of ordinary rifle damage and still shows its chip stages. Three rifle contacts end the staged hold. The Brute stays in combat after that release. A plasma strip pays the 15-credit lesson reward and gives the stagger opening.

## Balance

The initial Standard pass cleared 38 of 48 with zero stalls. Breacher cleared 10, Cryo 11, Pyro 7 and Arc 10. This pass preceded the plated-target cleanup correction and the final covered-bank distance. Token damage and recovery remained at the PLAY24 values.

The pre-ingress Standard pass also cleared 38 of 48 with zero stalls. Its four runs used game hash `4a479038b859d4a2cfd082670085daa16afd1d3ea5b4d005948c2ed42bd30f6a` and policy hash beginning `07e7b09e06f1`. Seeds were 7, 11, 23, 99, 256, 512, 1024, 2025, 4096, 6561, 9001 and 65537.

| Standard competent | PLAY24 baseline | PLAY25 before ingress correction | PLAY25 final | Final stalls |
| --- | ---: | ---: | ---: | ---: |
| Breacher | 10/12 | 10/12 | 10/12 | 0 |
| Cryo | 10/12 | 11/12 | 11/12 | 0 |
| Pyro | 8/12 | 7/12 | 8/12 | 0 |
| Arc | 10/12 | 10/12 | 10/12 | 0 |
| Total | 38/48 | 38/48 | 39/48 | 0 |

The final summaries are in `artifacts/nextgen/playtest/play25-ingress-{breacher,cryo,pyro,arc}/summary.json`. They use `a8de3ad8`, game hash `d512deeb67b13d521f1217e97a0eec528516d413a0e44c3e125da1b9af2d3b5a` and the same policy hash as the pre-ingress pass.

Story novice cleared 21 of 24 after the ingress correction, compared with a baseline of 23 of 24. Breacher cleared 12 and Cryo 9, with zero stalls. The pre-ingress pass cleared 22 of 24. The final summary is `artifacts/nextgen/playtest/play25-ingress-story/summary.json`.

## Captures

The staged captures are under `artifacts/nextgen/`. The ordered Swarm Junction image shows three Crawler wind-ups at 153, 603 and 1,053 ms. The route captures show the Spitter lane across the near path and the side of the reactor used by the far path.

- `play25-ship-crowd/play25-ordered-crowd-swarm-junction.png`
- `play25-release/play23-edge-safety-interlock-station.png`
- `play25-release/play25-brute-scale-armory.png`
- `play25-release/play25-route-0-overload-floor.png`
- `play25-far-pad/play25-route-1-overload-floor.png`

## Native campaigns

The runner used Standard, competent input, seed 1729 and fast rendering with full combat rules. Melee-hit intervals use adjacent `enemy-contact` receipts in the same room from the recent-damage ledger, de-duplicated by room and simulation timestamp. Warden charges have their own `enemy-charge` source. First-plate shots use Passenger Vault's shot and armour-hit receipts for the first Brute.

In the pre-ingress run, Arc 1729 took 59.6 suit damage in Transmission, down from 139.2 in the reviewed native run. Before Transmission it took 10.0 in Awakening Bay, 12.6 in Crew Checkpoint, 26.4 in Freight Hold and 13.2 in Breached Loading Bay. Five of the first nine rooms were still damage-free. Arc died in Coolant Plant after 12 clears with zero errors. It landed three plasma shots on the first plate and its shortest melee-hit gap was 450 ms.

Pre-ingress Cryo cleared all 20 rooms with zero errors. It took the near bank, landed three plasma shots on the first plate, and recorded a 450 ms minimum across 61 ordinary melee hits. These two runs are archived as `play25-native-arc` and `play25-native-cryo`.

On the corrected build, Arc took 17.1 damage in Transmission. It took zero damage in four of the first nine rooms and 85.7 total before Transmission. This did not trigger further pacing changes. The final `npm run build` passed.

Final Arc 1729 cleared 15 rooms and died in Swarm Junction with zero errors. Its 22 ordinary melee hits had an 833.3 ms minimum gap. Arc landed three plasma shots on the first plate and died before the bank choice. Swarm Junction dealt 203.4 damage including 90.0 from Brute melee and 63.6 from Crawler melee.

Final Cryo 1729 cleared all 20 rooms with zero errors. Its 49 ordinary melee hits had a 450.0 ms minimum gap. Cryo landed three plasma shots on the first plate and took the near bank.

Both final traces and runner reports are under `artifacts/nextgen/playtest/play25-ingress-native-{arc,cryo}/`. The full Cryo run exercised the enlarged Brutes across the campaign. The covered bank has staged capture evidence. The two final native campaigns supplied one near-bank choice and no covered-bank choices.

## Remaining weaknesses

Arc still died to cumulative crowd pressure in Swarm Junction despite the wider gaps. Cryo lost 215.8 suit integrity in Manual Control Chamber and 37.8 in the finale. This seed still has a large late-room damage swing. Pyro cleared the fewest Standard seeds at 8 of 12.
