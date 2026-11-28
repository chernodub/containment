# R31 — lead's summary of the three independent reviews (2026-11-28, gallery final26)

Build reviewed: fixtures at `7e5f9042` (wave 35), native campaigns and the Warden death frames at `1b2823ac` (after FIX35, a dead Warden that froze standing 5.5 m tall over the lane; the bug predates wave 35). Reviewers: two GPT Astra 6.2 at high reasoning (visual, play) and one bounded Claude Opus art pass. Full texts: `R31-A-visual-verdict.md`, `R31-B-play-verdict.md`, `R31-C-opus-art-verdict.md`. Lead: Claude Opus, which took over from the previous Claude lead on 2026-11-27.

## Scores

| Visual (A) | R30 | R31 | | Play (B) | R30 | R31 | | Art second opinion (C) | R30 | R31 |
|---|---:|---:|---|---|---:|---:|---|---|---:|---:|
| First impression | 7.2 | 7.3 | | Core combat | 7.0 | 7.0 | | First impression | 7.0 | 7.0 |
| Interface and HUD | 7.6 | 7.5 | | Rigs | 7.5 | 7.5 | | Interface | 7.5 | 7.5 |
| Combat readability | 6.8 | 6.9 | | Enemy counterplay | 7.0 | 7.0 | | Combat readability | 6.0 | 6.5 |
| Environments | 6.6 | 6.8 | | Game feel | 6.5 | 7.0 | | Environments | 5.5 | 5.5 |
| Ability spectacle | 6.5 | 6.6 | | Build variety | 6.5 | 6.5 | | Ability effects | 6.0 | 6.0 |
| Characters and creatures | 6.1 | 6.1 | | Onboarding | 6.5 | 6.5 | | Characters and creatures | 6.0 | 6.5 |
| Animation | 6.0 | 6.0 | | Interface flow | 7.5 | 7.5 | | Cohesion | 6.5 | 7.0 |
| Cohesion | 7.2 | 7.0 | | Pacing | 6.5 | 6.0 | | | | |
| **Mean** | 6.75 | 6.78 | | **Mean** | 6.88 | 6.88 | | **Mean** | 6.36 | 6.57 |

Price: A US$12 (same), C US$15–18 (was 15). B: "solid commercial indie quality in individual fights. The campaign falls short of premium because it too often lets me win without learning what I did well." A and B are flat for the fourth round; C rose by 0.2, entirely from the value pass.

Of A's ten R30 defects: three fixed (Warden mouth, elite rank, capsule animal), seven partly fixed, none untouched. Of C's seven R30 changes: three done (Crawler darkened, glow as telegraph, Brute menace), three partly, one not done (camera). Of B's ten R30 problems: five partly fixed, four untouched (Interlock deaths traced to earlier rooms, exclusive's first fight, featured kill as midpoint, order consequence after reunion), one more partly.

## What worked

- The value rule: C "fixed the confetti problem", "removing the always-on glow unified the creatures with the inked marine and the UI" (+0.5 cohesion, readability, creatures). A: "the imminent attacker gains priority when the waiting animals go quiet."
- Warden mouth fixed (A, C): "the dark, tooth-rimmed cavity toward the camera. It is still findable."
- Elite as a rank without its ring (A fixed). Brute colour and face (C: "now has menace").
- Game feel +0.5 (B): "Body-local effects, displaced enemies and the Warden's recovery and exit communicate force more clearly." Arc's fork on the victim and Seismic's clean tail credited by A.
- Crawler share of suit loss fell (B): Breacher 46.7% → 31.1%, Story Cryo 54.1% → 39.2%.
- Grille: native Atrium closures 1/5 → 5/5; the escorts are findable (B, partly fixed).

## Where the three agree

1. **Contact and occlusion at the marine** (A1, A2, B2, C1). The next hit's footprint is clear, its owner is not; small resting families break into flecks in a dark crowd (A2, a cost of our own value rule); bodies cover the marine (C1: Warden stun in Armory hides him entirely; a Brute fuses with him in a Pyro fight).
2. **The heavy still reaches rather than loads** (A3, C3): "the walk still sells reach more readily than compression"; C reads the surfaces as "blotchy camouflage patches on faceted low-poly forms... papercraft" and asks for three designed value bands.
3. **A powered hit's victim** (A6, B10, C4): Meltdown's ring wins the first glance, Napalm's 50 ms flash is missed, Whiteout's small victims vanish. C: ring effects are flat on the floor; give them height.
4. **The final shelter's foot position** (A4, B9): the cap and impact read, the place to stand does not at the moment of choice.
5. **Campaign structure untouched for rounds** (B3, B4, B8, B7): a guardian kill followed by 33–52 s of scheduled fighting; the exclusive's first live fight shows an ordinary button; the order choice ends at the reunion; a depleted arrival is not traced back.
6. **Grille: demonstration, not decision** (B1): aware and unaware bots close 45/48 and 43/48 in Atrium. B's direction: keep Atrium as the forgiving demonstration, make Manual Control a real fork between two firing positions.
7. Floors (C5, A5, A8): soft smeared light; Checkpoint's arc reads as lane paint once the pivot leaves frame.

## Measurements

- Lead cohort at `7e5f9042`: Standard 40/48 (9/10/11/10), Story 22/24, zero stalls. Block means 16.2 / 141.0 / 184.9 / 197.4 / 188.6. B: "Added late health buys attrition with little new play" (+37.5% escort health); pacing −0.5.
- Native: all six campaigns clear at `1b2823ac`; Standard Cryo flipped from a death to a clear after a render-only fix, so single native outcomes are samples.
- Frame bench: wave 35 costs nothing on High over PERF48; Safety Interlock Pyro High 2.3–2.5% of frames over 20 ms (budget 5%).

## Lead's reading

The value pass is the first change in four rounds that moved a reviewer's numbers for a stated reason, and it did so because it was a rule, measured, not a taste. Keep it. A2's complaint (small families into flecks) is answered by shape inside the rule (a broad matte dorsal plane, head separated from forelimbs), not by brightness.

C asks again for a 12% camera push on the grounds that the marine is 6–7% of frame height. CAM35 measured 14–16% in crowds and showed the push hiding threats (one native seed lost 87.7 suit in Crew Checkpoint against 1.4). The real defect C names is occlusion: bodies covering the marine. That is cheap to fix directly (an occluded-marine silhouette and fading the occluder), and it is what wave 36 does instead of moving the camera.

B's untouched items are structural (encounter schedules, exclusives, route consequences). Art waves cannot move pacing, onboarding or build depth; two waves in a row have spent on art and the play mean has not moved. Wave 36 gives half its capacity to the campaign.

The instrument floor stands: "Input response, audible separation and unaided human discovery remain open." B's first and second investments both say to watch fresh desktop players. No delegate can supply that.

## Wave 36

At most four capture-heavy delegates at once.
- **CONTACT36** (Astra): the marine never hidden (occluded silhouette, fade the occluder); small families readable as shapes in a dark crowd inside the value rule; the striker's shoulder across the near boot with its hook visible through recoil.
- **HEAVY46** (Opus, bounded; a change of method after three Astra passes on the gait): chest crosses the loaded wrist, shoulder heights vary, knuckles leave last; surfaces as three designed value bands instead of patch masks.
- **PLAY42** (Sol): a skilled guardian kill or interrupt cancels the next scheduled group with a visible retreat; the exclusive's first Transmission fight places a target the equipped transformation solves; Manual Control as a decision between two firing positions; replace part of the +37.5% escort health with an interceptible arrival. Band 34–40, Story ≥ 22.
- **RUN21** (Sol): one order consequence past each reunion, shown on the card; projected entry health at the infirmary before a hold; the debrief names the costliest earlier room when the player entered the fatal room depleted.
- Queued: **FX37** (a held victim pose through the next aiming beat; ring effects with height and a white-core flash; Napalm readable at +300 ms) and **ROOM36** (the shelter's safe foothold as a lit strip visible from the fork; one hard hero pool per arena centre; Checkpoint's pivot track with teeth).
