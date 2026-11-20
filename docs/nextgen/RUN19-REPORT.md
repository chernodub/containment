# RUN19

## Baseline map

The current campaign uses the authored beats in `src/game/waves/authoredEncounters.ts`. `EncounterDirector` applies difficulty and seed opening selection, which can move the guardian beat without changing its room. `progressionFor` also supplies guardian metadata for the fallback schedule. Both Standard seeds 1729 and 2718 have Wardens in sectors 6, 9, 13 and 19 and a Matron in sector 16. Choosing Warden cache adds a Warden in sector 16.

The first three junctions also change the opening and ship condition of the next room.

| Junction destination | Baseline alternate consequence |
| --- | --- |
| Communal Atrium | Early salvage pays 45 credits up front and 35 after Breached Loading Bay. The locker grants health and a grenade. |
| Breached Loading Bay | Field requisition trades 70 credits for armor and grenades and spaces Transmission Chamber arrivals at 1.10× intervals. |
| Safety-interlock Station | The exposed workshop trades 180 credits for an augment upgrade and grants Overdrive charge equivalent to 3,000 damage in Swarm Junction. The infirmary heals immediately. |

## Player-facing changes

At the Communal Atrium junction, Plate-breaker supplies 24 plasma rounds and puts the armoured Warden escort first in Coolant Plant. Brood supplies up to two rockets within the existing carry limit and opens Coolant Plant with a Matron and her escort. The Matron uses the native brood windup and hatching pods. This substitutes for the third Warden slot. The route name and fight appear on the entry banner in sector 13 and in the expedition record for both death and completion. The two later junction deals retain their existing consequences. Saves that have already crossed the first junction without a guardian route retain their original appointments.

Passenger Vault's opening Brute gets a clear firing lane outside its swing at spawn. A real rifle hit on surviving armour produces the existing armour spark and cues key 4. Plasma uses the existing armour damage multiplier. Later, a pair of nearby light enemies moving toward the marine within a clear armed-rocket lane cues key 5. An armed blast applies ordinary splash damage and briefly staggers susceptible light enemies that survive the hit. The instructions yield to active danger and persist at the next saved boundary.

Rig select shows the repeat option only when a prior rig exists. The staged completion receipt now carries 20 sectors, 284 kills and roughly 13 minutes of combat.
