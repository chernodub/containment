# R22 — twenty-second review round (gallery `final17`, 2026-11-24)

Reviewers: GPT Astra 6.2 at high reasoning for the visual (`R22-A-visual-verdict.md`) and play-and-feel
(`R22-B-play-verdict.md`) verdicts; Claude Opus for a bounded art-director pass (`R22-C-opus-art-verdict.md`, 44
images). Scale: 7 = solid commercial indie, 10 = best in class. Gallery captured fresh at `b74bfa28` (wave 25). All
six bot campaigns cleared twenty rooms.

| Visual | R21 Astra | R22 Astra | R21 Opus | R22 Opus | | Play (Astra) | R21 | R22 |
|---|---:|---:|---:|---:|---|---|---:|---:|
| First impression | 7.5 | 7.5 | 7 | 6.5 | | Core combat loop | 7.4 | 7.5 |
| Interface and HUD | 7.5 | 7.5 | 7.5 | 7.5 | | Ability kits / rigs | 8.2 | 8.2 |
| Combat readability | 6.5 | 7.0 | 7 | 6.5 | | Enemy design and counterplay | 7.1 | 7.3 |
| Environments | 6.5 | 6.5 | 6 | 6 | | Game feel | 6.9 | 7.2 |
| Ability spectacle | 7.0 | 7.0 | 6 | 6 | | Build variety and depth | 7.6 | 7.5 |
| Characters and creatures | 6.0 | 6.0 | 5.5 | 5 | | Onboarding and clarity | 7.3 | 7.5 |
| Animation and motion | 6.0 | 6.5 | – | – | | Interface flow | 8.0 | 8.3 |
| Visual cohesion | 7.0 | 6.5 | 5.5 | 5.5 | | Pacing and difficulty | 6.6 | 6.8 |

Calibration: US$10, "a small commercial action roguelike… the rig selector is already convincing at a premium price;
the twenty campaign frames together put the game a tier below that" (Astra visual); "Solid commercial indie. The
biggest gap to the genre leaders is how little initiative a player earns by reading a crowd correctly" (Astra play);
"polished early-access indie: AA menus over upper-prototype creature art", US$12–15 (Opus).

**Honest reading: play moved a little, the picture did not, and the creature finish went backwards with the
reviewer who asked for it.** Seven of eight play scores rose by 0.1–0.3 (game feel 6.9 → 7.2, interface flow 8.3):
small, but the first round in which play moved in one direction. The visual scores are the eighth round of the
plateau. Opus put creatures at 5.0, the lowest in six rounds: "opacity fixed one fault and exposed the
posterisation". R21-C asked for "opaque, two-band, the marine's ink line"; SHADER25 delivered exactly that; R22-C
calls the result "crumpled brown paper". The lead looked at the cited frames at native size and agrees with the new
verdict, not the old request: the Brute and the Warden are brown blotched masses whose head and arms cannot be found.

Lead diagnosis (to be tested by CREATURE26, not assumed): a hard terminator computed from the lumpy normals of an
SDF mesh draws camouflage instead of form; the value zones follow a painted atlas of small islands instead of
anatomy; and the heavies were designed as upright bipeds for a camera that looks down on them. The title screen,
which shades the same marine and a Brute with smooth form light, looks a tier better than the game — the two
languages should meet by bringing form light into play, not by posterising the title.

What wave 25 did, from the evidence:
- **Waiting enemies and the exposed mark**: credited by the play reviewer ("a moving waiting pack makes roles easier
  to anticipate"), but "the waiting pack looks busy while giving the player few new decisions", and the punish
  window is too short to use: late-run recovery is Brute 171 ms, Crawler 87 ms; bots land 0.25% of hits on exposed
  enemies. "A successful dodge often buys too little time to turn and fire."
- **Warden**: "Yes, immediately as a boss" (Astra); "a lumpy mass with no head-to-limb hierarchy" (Opus). Its drawn
  body reaches 2.99 m against a 2.0 m collider and hides the marine at contact.
- **Rehearsal before combination**: fixed for Relay Racks; the spike moved to Service Shaft Landing (Cryo lost 200.7).
- **Final fork**: explained in time now, still never worth taking; label tiny, route dark.
- **Rooms' lanes**: not credited. Both visual reviewers still find the fights on "similar lanes of dark tiles";
  the visual reviewer lists the weakest element of each of the twenty rooms.
- **Death card**: fixed and praised.

What the three verdicts agree on:
1. **Heavy creatures' anatomy and finish** (Opus 1–3, Astra 2, 4, 5): no head plane, weapon arm joins the belly,
   brown on dark floor, Pyro orange shared with hostile bodies.
2. **The marine disappears behind the Warden at contact** (Astra 1, play 5).
3. **Room centres lose the room's story** (Astra 3, Opus 5–6): carry a piece of the machine across the floor; give
   landmarks a light tier.
4. **Fire and frost lose their material in fights** (Opus 4, Astra 7): Flashfire "a flat orange smear", Whiteout and
   Meltdown "barely register", Overdrive "isolated soft flecks".
5. **Two render languages** (Opus 7, Astra cohesion 7.0 → 6.5): "the selector's beautifully separated armour planes,
   flat in-game plates".
6. **Play**: a punish worth seeking; one readable escape lane in the hardest fights (Shaft, Workshop, Swarm hold);
   a trustworthy Warden body and a different second Warden fight; a final crossing with two winners; build
   trade-offs shown as a loss as well as a gain; Weapons tab, supply cards and the ending image.

Measured at this head: Standard competent 37 of 48 (Breacher 8, Cryo 11, Pyro 9, Arc 9), Story novice 22 of 24, no
stalls. High frame tail in Safety-interlock regressed to 10–14% of frames over 20 ms (PERF25 in progress).

Wave 26 (from this): heavy creatures rebuilt for the plan view with clean shadow shapes and anatomical value zones
(Opus, bounded), then the same recipe for the small families; a Brute punish window that is long enough to use and
a staged Shaft; the marine shown through a heavy that covers him; fire and frost with layered shape; machines
carried into the lanes of the rooms the reviewers named; Weapons tab, supply and ending screens; the High frame tail.
