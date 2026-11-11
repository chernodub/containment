# I5 shared combat-policy limitation

The user requested difficulty targets for **“THIS bot policy.”** The target, weapon, ability-opportunity and combat-spacing helpers remain unchanged; navigation-observer v3 is separately versioned in the experiment reports. No cone-aim correction has been made. The scope question is whether to correct directional cone aiming and rerun matched baselines, or preserve the existing combat decisions exactly. Difficulty acceptance remains unfinished; the unaccepted encounter profile is default-off.

## Executed minimal receipt

An isolated fixture imports the **real AbilitySystem** and unchanged `chooseTarget` / `chooseActions`. It uses an unaugmented Pyro at `(0, 0)`, a visible, unobstructed spitter at `(360, 0)`, and a visible, unobstructed crawler at `(0, 150)`. Both targets have 100 HP and radius 14. This is a diagnostic fixture, not a campaign or a claim about all casts.

| Observation | Existing selected aim | Counterfactual close-threat aim |
| --- | --- | --- |
| Shared target priority | Spitter, ID 1 | Still spitter, ID 1 |
| Shared opportunity keys | Q and F | Q and F |
| Actual Q aim | Spitter, ID 1 | Crawler, ID 2 |
| Tactical press accepted | Yes | Yes |
| Direct Flashfire hits | None | Crawler, 40 damage |
| Remaining cooldown after 80 ms cast | 7,920 ms | 7,920 ms |

`chooseTarget` gives the spitter `400 − 360 = 40` priority points versus the crawler's `0 − 150 = −150`. `chooseActions` presses Q because **any** enemy is within 240 units. Flashfire then checks a 300-unit cone with half-angle 0.61 radians around the selected aim: the spitter is outside its range and the crawler is 90 degrees off-axis. The direct cone hits neither. Aiming the same real press at the nearby crawler hits it. The engine and cooldown remain unchanged.

Source: `scripts/nextgen/playtest/policy.mjs` (`chooseTarget`, `chooseActions`); `src/game/abilities/AbilitySystem.ts` (`flashfire` impact). Reproducer and raw JSON are under `artifacts/nextgen/i5/cone-policy-proof.mjs`, `cone-proof-bundle/proof.mjs`, and `cone-policy-proof.json`. The proof ran successfully against the default-off checkpoint. No patch to `policy.mjs` was applied.

Scorched Fan's additional ground zone can still produce value in augmented campaigns. The fixture deliberately uses the base kit: it establishes a possible wasted direct cone, not zero value for every augmented cast. Native and Node players share these exact decisions, so this is not a demonstrated simulation-only penalty.

## Other limits

- The player kites according to weapon spacing (220 units with shotgun, 360 with rifle), while planted Napalm remains at its cast point and Meltdown damages within 130 units of the moving marine. These interactions can make continuous ranged kiting a poor use of Pyro's kit. Their campaign contribution is an inference, not an isolated causal estimate.
- The full-kit harness remains within its original 30–45% ability-share and 1.25× clear-spread assertions. Pyro is not weak in that harness; those tests do not establish that this bot uses every rig equally well.
- Both backends expose camouflaged stalkers and classify visibility by camera projection rather than alpha. That is a shared observer limitation. No stale-stat or missing sustained Pyro-damage defect was found.
- Native versus analytic observation can diverge: V18 Pyro 1729 dies in room 18 where Node completes, while 2718 agrees on death in room 14. Raw common-room times/damage and all errors/loading receipts remain in the experiment archive. Node completion is not an exact native prediction.

If cone aiming is corrected, use a new policy epoch, retain the old reports, rerun the same baseline and candidate seeds with the same helper, and repeat native validation. Do not pool that epoch with the existing-policy balance tables. Rig stats, checkpoint resources and encounter clears must remain authoritative and unmodified by the player.
