# R29 — lead's summary of the three independent reviews (2026-11-27, gallery final24)

Build reviewed: `d34a6a86` (wave 33), one head. Reviewers: two GPT Astra 6.2 at high reasoning (visual, play) and one bounded Claude Opus art pass. Full texts: `R29-A-visual-verdict.md`, `R29-B-play-verdict.md`, `R29-C-opus-art-verdict.md`.

## Scores

| Visual (A) | R28 | R29 | | Play (B) | R28 | R29 | | Art second opinion (C) | R28 | R29 |
|---|---:|---:|---|---|---:|---:|---|---|---:|---:|
| First impression | 6.5 | 7.0 | | Core combat | 7.0 | 7.0 | | First impression | 6.5 | 6.5 |
| Interface and HUD | 7.5 | 7.5 | | Rigs | 8.0 | 7.5 | | Interface | 7.5 | 7.0 |
| Combat readability | 7.0 | 7.0 | | Enemy counterplay | 7.0 | 7.0 | | Combat readability | 6.5 | 6.0 |
| Environments | 6.5 | 6.5 | | Game feel | 7.0 | 6.5 | | Environments | 6.0 | 5.5 |
| Ability spectacle | 6.5 | 6.5 | | Build variety | 7.0 | 7.0 | | Ability effects | 6.0 | 6.0 |
| Characters and creatures | 5.5 | 6.5 | | Onboarding | 7.0 | 7.0 | | Characters and creatures | 5.5 | 5.5 |
| Animation | 6.0 | 6.5 | | Interface flow | 8.0 | 7.5 | | Cohesion | 6.5 | 6.0 |
| Cohesion | 7.0 | 7.0 | | Pacing | 6.5 | 6.0 | | | | |

Price: A US$10, C US$12–15. B: "at the threshold of a solid commercial indie release". A rose in three categories (creatures by a full point, first impression, animation). B fell half a point in four; it attributes three to its own calibration and one, pacing, to a measured change. C fell half a point in four and held creatures at 5.5 ("the finish improved, which exposes the design"). Net: flat. Nobody calls the game premium.

## What worked

- The creature repaint (A, +1.0): "Clawed hands replace rounded ends, the mask gains a side plane, and clean bands wrap the shoulders. This is the largest gain at both crop sizes." Both visual reviewers mark "cel-paint the creatures" and "preserve species through status" as fixed.
- The title's central creature (A, +0.5; C: "the title creature is crisp").
- Repeated triangular light pools: fixed for shape (A). Death diagram scale and spacing: fixed (A).
- Removing the Manual Control floor labels (B): "Removing 'Bait / Step / Return lane' was right. The game was prescribing a move it could not consistently recommend."
- Coolant Plant's follow-up no longer outweighs its featured encounter (B, fixed for the sampled runs). The fourth guardian and the covered bend "both earn their places" (B).

## What did not

1. **What a dodge buys** (B's calibration): the console exchange went unused in all four campaigns that reached it; exposed hits are 0.17–0.92% of weapon hits on Standard. "A player can succeed by keeping moving and spending area damage."
2. **Pacing** (B, −0.5, measured): sectors 1–4 cost a competent Standard run 6.6 suit, later blocks 190–208; the cohort is 43 of 48, above the 34–40 band. A Story novice died on the Safety Interlock hold, which "can teach a novice to die on the objective".
3. **The heavy walks too lightly** (A's first defect): "the near hand keeps much the same spread through much of the stride". C: the Brute is "an army-green faceted turtle-gorilla that reads as a toy".
4. **Small attackers lose their anatomy head-on and at the boots** (A, B, C): the Crawler is A's "weakest family in play" and B's most expensive ordinary attack with "the least visible point of contact". Making it quieter to stop it reading as ammunition cost visibility in dark crowds.
5. **The marine is lost at peak pressure** (C's first change): flat-lit Brutes match his value and outsize him.
6. **Rooms** (A same, C −0.5): "too many fights take place on interchangeable sections of striped deck"; the incident pools are soft ("coloured fog instead of shaped beams", C), several are brighter than their source, and two wash out the action (Coolant, Swarm Junction). The final refuge is still hard to recognise on approach.
7. **Effects** (A, C): Meltdown's centre is stronger than its edge and decays into patches; Whiteout hides small bodies; Cryo Nova and Flashfire are small; Seismic cracks carpet rooms.
8. **Warden's mouth** (A): still takes too long to find at wall-stun.
9. **Interface** (B, C −0.5 each): the supply stop "makes a free build decision feel like purchasing administration"; shop icons are in a different, glossy style; the death diagram still needs its key.
10. **The run repeats** (B, untouched for several rounds): two Arc seeds walk the same first eleven rooms.

## Measurements

- Lead cohort at `c5e0de5a`: Standard 43 of 48 (Breacher 11, Cryo 10, Pyro 10, Arc 12), Story novice 22 of 24, zero stalls. A lower paid repair (17/12) did not move it.
- Native gallery campaigns: four of five Standard runs cleared; Arc 1729 died in Diagnostic Gallery (room 11), Story novice Cryo in Safety Interlock Station (room 12). Both final hits judged fair by B.
- Quiet bench at `b5a1a420` (after PERF44 and PERF45): Safety Interlock High 10.4 / 8.1 / 14.3% (Pyro) and 7.2 / 5.2 / 9.0% (Arc) of frames over 20 ms against a 5% budget; every Low case 0.1–0.6%. Update plus render submission is about 12 ms at p95, so the slips are not main-thread work. PERF46 is ablating High's features on frame share.

## Lead's reading

Three rounds in a row have landed within half a point of each other. The one clear gain this round came from a change of method, not another pass of the same kind: creatures were repainted in the marine's language instead of being re-textured, and the reviewer who looks hardest at the evidence gave a full point for it. The losses came where the work was a parameter change (quieter Crawlers, softer and then dimmer incident lights) or where measurement moved without a design change (the cohort drifting above its band).

Wave 34 therefore puts its effort where a reviewer named a mechanism, not a taste:

- a dodge-and-return rule with a visible stake (held escorts behind a grille), taught early and reused at the console, measured on and off before it ships (PLAY39);
- pressure from sector three by avoidable, recoverable costs, not multipliers, and a grace period on Story's first hold (PLAY39);
- an order choice at two junctions (RUN20);
- the Brute's planted stride and the Warden's mouth turned to the camera in recoil (HEAVY44);
- a front, side and rear for each small family, and a striking-limb accent that the warning line ends on (BROOD42);
- four fighting lanes finished end to end, hard-edged motivated light, a refuge with a face (ROOM34);
- effects that end on the last body hit (FX35); the marine's value lead in a crowd (in HEAVY44 and FX35);
- supply-stop exit, icon style and the death diagram's two poses (UI34); the title's footing and shared light (TITLE34).

Two things no delegate can supply remain open: nobody has heard the mix, and nobody has played the game with their hands. B's fifth investment is the honest one: "Use fresh desktop players to settle the remaining design bets."
