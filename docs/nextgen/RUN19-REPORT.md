# RUN19

## Baseline map

The current campaign uses the authored beats in `src/game/waves/authoredEncounters.ts`. `EncounterDirector` applies difficulty and seed opening selection, which can move the guardian beat without changing its room. `progressionFor` also supplies guardian metadata for the fallback schedule. Both Standard seeds 1729 and 2718 have Wardens in sectors 6, 9, 13 and 19 and a Matron in sector 16. Choosing Warden cache adds a Warden in sector 16.

The first three junctions also change the opening and ship condition of the next room.

| Junction destination | Baseline alternate consequence |
| --- | --- |
| Communal Atrium | Early salvage pays 45 credits up front and 35 after Breached Loading Bay. The locker grants health and a grenade. |
| Breached Loading Bay | Field requisition trades 70 credits for armor and grenades and spaces Transmission Chamber arrivals at 1.10× intervals. |
| Safety-interlock Station | The exposed workshop trades 180 credits for an augment upgrade and grants Overdrive charge equivalent to 3,000 damage in Swarm Junction. The infirmary heals immediately. |
